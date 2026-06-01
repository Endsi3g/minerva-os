-- Database Migration: Email triggers and invoices status check updates
-- Migration timestamp: 20260601000001

-- 1. Enable pg_net extension if not already present
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Drop existing constraint on invoices status
ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS invoices_status_check;

-- 3. Add updated constraint supporting 'sent' and 'cancelled'
ALTER TABLE public.invoices ADD CONSTRAINT invoices_status_check CHECK (status IN ('paid', 'pending', 'overdue', 'draft', 'sent', 'cancelled'));

-- 4. Create trigger handler function
CREATE OR REPLACE FUNCTION public.handle_email_trigger()
RETURNS TRIGGER AS $$
DECLARE
  payload JSONB;
  request_id INT;
  project_url TEXT;
  service_role_key TEXT;
BEGIN
  -- 1. Construct the payload depending on the table and condition
  IF TG_TABLE_NAME = 'invitations' THEN
    payload := jsonb_build_object(
      'type', 'team_invitation',
      'payload', jsonb_build_object(
        'email', NEW.email,
        'token', NEW.token
      )
    );
  ELSIF TG_TABLE_NAME = 'user_profiles' THEN
    IF NEW.onboarding_completed = true AND (OLD.onboarding_completed = false OR OLD.onboarding_completed IS NULL) THEN
      payload := jsonb_build_object(
        'type', 'welcome_email',
        'payload', jsonb_build_object(
          'email', NEW.email,
          'name', NEW.name
        )
      );
    ELSE
      RETURN NEW;
    END IF;
  ELSIF TG_TABLE_NAME = 'invoices' THEN
    IF NEW.status = 'sent' AND (TG_OP = 'INSERT' OR OLD.status != 'sent') THEN
      DECLARE
        c_email TEXT;
      BEGIN
        SELECT email INTO c_email FROM public.clients WHERE id = NEW.client_id;
        payload := jsonb_build_object(
          'type', 'invoice_sent',
          'payload', jsonb_build_object(
            'client_email', COALESCE(c_email, ''),
            'invoice_number', NEW.invoice_number,
            'amount', NEW.amount,
            'due_date', NEW.due_date
          )
        );
      END;
    ELSE
      RETURN NEW;
    END IF;
  ELSIF TG_TABLE_NAME = 'risk_flags' THEN
    IF NEW.severity = 'high' AND (TG_OP = 'INSERT' OR OLD.severity != 'high') THEN
      DECLARE
        p_name TEXT;
        o_email TEXT;
      BEGIN
        SELECT name INTO p_name FROM public.projects WHERE id = NEW.project_id;
        SELECT email INTO o_email FROM public.user_profiles WHERE workspace_id = NEW.workspace_id AND role = 'owner' LIMIT 1;
        payload := jsonb_build_object(
          'type', 'risk_alert',
          'payload', jsonb_build_object(
            'owner_email', COALESCE(o_email, 'onboarding@resend.dev'),
            'project_name', COALESCE(p_name, 'Unknown Project'),
            'risk_type', NEW.type,
            'summary', NEW.summary,
            'details', NEW.details
          )
        );
      END;
    ELSE
      RETURN NEW;
    END IF;
  ELSIF TG_TABLE_NAME = 'approvals' THEN
    DECLARE
      p_client_id UUID;
      c_email TEXT;
      c_token TEXT;
    BEGIN
      SELECT client_id INTO p_client_id FROM public.projects WHERE id = NEW.project_id;
      SELECT email INTO c_email FROM public.clients WHERE id = p_client_id;
      SELECT token INTO c_token FROM public.portal_tokens WHERE client_id = p_client_id LIMIT 1;
      
      payload := jsonb_build_object(
        'type', 'approval_request',
        'payload', jsonb_build_object(
          'client_email', COALESCE(c_email, ''),
          'approval_name', NEW.name,
          'approval_type', NEW.type,
          'client_token', COALESCE(c_token, '')
        )
      );
    END;
  END IF;

  -- 2. Fetch service role key from vault decrypted secrets if they exist
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'vault' AND tablename = 'decrypted_secrets') THEN
    SELECT decrypted_secret INTO service_role_key FROM vault.decrypted_secrets WHERE name = 'service_role_key' LIMIT 1;
  END IF;

  IF service_role_key IS NOT NULL THEN
    project_url := 'https://kcwdmufkyjsitsuxmqld.supabase.co/functions/v1/send-email';
  ELSE
    project_url := 'http://kong:8000/functions/v1/send-email';
    -- Dummy service role key fallback for local development
    service_role_key := 'sb_publishable_fJZzWMwE5Sl1zkr9h7fiLQ_6-OOCDIB';
  END IF;

  -- 3. Perform POST request via pg_net
  SELECT net.http_post(
    url := project_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_role_key
    ),
    body := payload
  ) INTO request_id;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log warning to DB logs and return NEW to not block transaction
  RAISE WARNING 'Failed to trigger email webhook: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Define table triggers calling the handler
CREATE OR REPLACE TRIGGER on_invitation_created
  AFTER INSERT ON public.invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_email_trigger();

CREATE OR REPLACE TRIGGER on_user_onboarding_completed
  AFTER UPDATE OF onboarding_completed ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_email_trigger();

CREATE OR REPLACE TRIGGER on_invoice_sent
  AFTER INSERT OR UPDATE OF status ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_email_trigger();

CREATE OR REPLACE TRIGGER on_risk_flag_severity
  AFTER INSERT OR UPDATE OF severity ON public.risk_flags
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_email_trigger();

CREATE OR REPLACE TRIGGER on_approval_created
  AFTER INSERT ON public.approvals
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_email_trigger();
