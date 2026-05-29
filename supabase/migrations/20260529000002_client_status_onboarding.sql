-- Database Migration: Update public.clients status constraint
-- Drop existing automatically generated check constraint
ALTER TABLE public.clients DROP CONSTRAINT IF EXISTS clients_status_check;

-- Add updated check constraint supporting lead and onboarding statuses
ALTER TABLE public.clients ADD CONSTRAINT clients_status_check CHECK (status IN ('active', 'lead', 'onboarding', 'inactive'));
