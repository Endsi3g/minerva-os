# Minerva OS — Premium Email Templates

This document contains the expanded email templates designed to align with the Minerva OS design system. 

For maximum flexibility, each template is provided in two formats:
1. **React Email Components** (utilizing `@react-email/components` from Resend).
2. **Compiled Raw HTML** (for direct copy-pasting into the Resend dashboard or other HTML template editors).

### Design System Tokens Applied:
* **Backgrounds**: Obsidian `#0A0D14` (wrapper), Midnight `#111522` (cards), Dusk `#171C2A` (meta components).
* **Text**: Ivory `#F5F1E8` (titles/primary), Silver `#B8BDC7` (body/secondary), Fog `#8A9099` (meta labels).
* **Accents**: Sage `#7FA38A` (success/active), Warm `#B89B6A` (warning/pending), Ember `#A86A6A` (critical alerts).
* **Buttons**: Ivory background with obsidian text, fully rounded (`rounded-full`).
* **Borders**: Subtle overlays using `rgba(255, 255, 255, 0.08)`.

---

## Shared Styles & Constants (for React Email)

When creating React Email templates, define these style objects to maintain design system consistency:

```tsx
// Shared Styles
const main = {
  backgroundColor: '#0A0D14',
  color: '#F5F1E8',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  margin: '0',
  padding: '0',
};

const container = {
  maxWidth: '580px',
  margin: '0 auto',
  backgroundColor: '#111522',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: '16px',
  overflow: 'hidden',
};

const header = {
  padding: '32px 32px 24px 32px',
  borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
};

const logo = {
  fontSize: '20px',
  fontWeight: '700',
  color: '#F5F1E8',
  letterSpacing: '0.5px',
  textDecoration: 'none',
};

const logoDot = {
  color: '#7FA38A',
};

const content = {
  padding: '32px',
};

const title = {
  fontSize: '24px',
  fontWeight: '600',
  color: '#F5F1E8',
  marginTop: '0',
  marginBottom: '16px',
  lineHeight: '1.3',
};

const text = {
  fontSize: '15px',
  lineHeight: '1.6',
  color: '#B8BDC7',
  marginTop: '0',
  marginBottom: '24px',
};

const btnContainer = {
  marginTop: '32px',
  marginBottom: '32px',
};

const button = {
  display: 'inline-block',
  padding: '14px 36px',
  backgroundColor: '#F5F1E8',
  color: '#0A0D14',
  textDecoration: 'none',
  borderRadius: '9999px',
  fontWeight: '600',
  fontSize: '14px',
  textAlign: 'center' as const,
};

const hr = {
  height: '1px',
  backgroundColor: 'rgba(255, 255, 255, 0.06)',
  border: 'none',
  margin: '32px 0 24px 0',
};

const footerText = {
  fontSize: '12px',
  color: '#8A9099',
  lineHeight: '1.5',
  margin: '0',
};

const link = {
  color: '#7FA38A',
  textDecoration: 'none',
};

const listSection = {
  marginBottom: '28px',
};

const listItem = {
  fontSize: '14px',
  lineHeight: '1.5',
  color: '#B8BDC7',
  margin: '0 0 10px 0',
};

const listHighlight = {
  color: '#F5F1E8',
};

const metaBox = {
  backgroundColor: '#171C2A',
  borderRadius: '12px',
  padding: '24px',
  marginBottom: '32px',
  border: '1px solid rgba(255, 255, 255, 0.06)',
};

const metaLabel = {
  color: '#8A9099',
  fontSize: '14px',
  fontWeight: '500',
  paddingBottom: '8px',
  width: '130px',
};

const metaValue = {
  color: '#F5F1E8',
  fontSize: '14px',
  fontWeight: '600',
  paddingBottom: '8px',
};

const metaLabelVertical = {
  color: '#8A9099',
  fontSize: '14px',
  fontWeight: '500',
  paddingBottom: '12px',
  width: '110px',
  verticalAlign: 'top',
};

const metaValueVertical = {
  color: '#F5F1E8',
  fontSize: '14px',
  fontWeight: '600',
  paddingBottom: '12px',
  verticalAlign: 'top',
};

const alertHeader = {
  color: '#A86A6A',
  fontSize: '13px',
  fontWeight: '700',
  textTransform: 'uppercase' as const,
  letterSpacing: '1.5px',
  marginBottom: '12px',
};
```

---

## 1. Team Invitation (`team_invitation`)

Used when inviting a team member to join a workspace.

### React Email Component

```tsx
import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface TeamInvitationEmailProps {
  inviteLink?: string;
}

export const TeamInvitationEmail = ({
  inviteLink = 'https://minerva-os.vercel.app/invite/token',
}: TeamInvitationEmailProps) => (
  <Html>
    <Head />
    <Preview>You have been invited to join Minerva OS</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Link href="https://minerva-os.vercel.app" style={logo}>
            MINERVA<span style={logoDot}>·</span>OS
          </Link>
        </Section>
        <Section style={content}>
          <Text style={title}>You have been invited!</Text>
          <Text style={text}>
            You've been invited to join a collaborative workspace on Minerva OS — the strategic operating system for elite agencies.
          </Text>
          <Text style={text}>
            Click the button below to accept the invitation, create your account, and join your teammates:
          </Text>
          <Section style={btnContainer}>
            <Button style={button} href={inviteLink}>
              Accept Invitation
            </Button>
          </Section>
          <Hr style={hr} />
          <Text style={footerText}>
            If the button doesn't work, copy and paste this URL into your browser:<br />
            <Link href={inviteLink} style={link}>
              {inviteLink}
            </Link>
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);
```

### Compiled Raw HTML

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You've been invited to join Minerva OS</title>
  <style>
    body {
      background-color: #0A0D14;
      color: #F5F1E8;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      background-color: #0A0D14;
      padding: 48px 24px;
    }
    .container {
      max-width: 580px;
      margin: 0 auto;
      background-color: #111522;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    }
    .header {
      padding: 32px 32px 24px 32px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      text-align: left;
    }
    .logo {
      font-size: 20px;
      font-weight: 700;
      color: #F5F1E8;
      letter-spacing: 0.5px;
      text-decoration: none;
    }
    .logo span {
      color: #7FA38A;
    }
    .content {
      padding: 32px;
    }
    .title {
      font-size: 24px;
      font-weight: 600;
      color: #F5F1E8;
      margin-top: 0;
      margin-bottom: 16px;
      line-height: 1.3;
    }
    .text {
      font-size: 15px;
      line-height: 1.6;
      color: #B8BDC7;
      margin-top: 0;
      margin-bottom: 24px;
    }
    .button-container {
      margin-top: 32px;
      margin-bottom: 32px;
    }
    .button-primary {
      display: inline-block;
      padding: 14px 36px;
      background-color: #F5F1E8;
      color: #0A0D14 !important;
      text-decoration: none;
      border-radius: 9999px;
      font-weight: 600;
      font-size: 14px;
      text-align: center;
    }
    .divider {
      height: 1px;
      background-color: rgba(255, 255, 255, 0.06);
      margin: 32px 0 24px 0;
    }
    .footer {
      padding: 0 32px 32px 32px;
      text-align: left;
    }
    .footer-text {
      font-size: 12px;
      color: #8A9099;
      line-height: 1.5;
      margin: 0;
    }
    .footer-link {
      color: #7FA38A;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <a href="#" class="logo">MINERVA<span>·</span>OS</a>
      </div>
      <div class="content">
        <h1 class="title">You have been invited!</h1>
        <p class="text">
          You've been invited to join a collaborative workspace on Minerva OS — the strategic operating system for elite agencies.
        </p>
        <p class="text">
          Click the button below to accept the invitation, create your account, and join your teammates:
        </p>
        <div class="button-container">
          <a href="{{inviteLink}}" class="button-primary">Accept Invitation</a>
        </div>
        <div class="divider"></div>
      </div>
      <div class="footer">
        <p class="footer-text">
          If the button doesn't work, copy and paste this URL into your browser:<br>
          <a href="{{inviteLink}}" class="footer-link">{{inviteLink}}</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>
```

---

## 2. Welcome Email (`welcome_email`)

Sent to new users when onboarding is completed.

### React Email Component

```tsx
import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface WelcomeEmailProps {
  name?: string;
  dashboardLink?: string;
}

export const WelcomeEmail = ({
  name = 'Partner',
  dashboardLink = 'https://minerva-os.vercel.app/app/dashboard',
}: WelcomeEmailProps) => (
  <Html>
    <Head />
    <Preview>Welcome to Minerva OS!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Link href="https://minerva-os.vercel.app" style={logo}>
            MINERVA<span style={logoDot}>·</span>OS
          </Link>
        </Section>
        <Section style={content}>
          <Text style={title}>Welcome to Minerva OS, {name}!</Text>
          <Text style={text}>
            Thank you for completing the onboarding process. Your workspace is now fully set up and ready.
          </Text>
          <Text style={text}>
            Minerva OS is engineered to consolidate your agency's core functions:
          </Text>
          <Section style={listSection}>
            <Text style={listItem}>• <strong style={listHighlight}>Pipeline Management</strong> · Track potential projects and deals.</Text>
            <Text style={listItem}>• <strong style={listHighlight}>Project Architecture</strong> · Monitor progress, metrics, and risk flags.</Text>
            <Text style={listItem}>• <strong style={listHighlight}>Client Portal & Approvals</strong> · Share deliverables and request sign-offs.</Text>
            <Text style={listItem}>• <strong style={listHighlight}>Financial Engine</strong> · Issue, send, and track professional invoices.</Text>
          </Section>
          <Section style={btnContainer}>
            <Button style={button} href={dashboardLink}>
              Go to Dashboard
            </Button>
          </Section>
        </Section>
      </Container>
    </Body>
  </Html>
);
```

### Compiled Raw HTML

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Minerva OS</title>
  <style>
    body {
      background-color: #0A0D14;
      color: #F5F1E8;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      background-color: #0A0D14;
      padding: 48px 24px;
    }
    .container {
      max-width: 580px;
      margin: 0 auto;
      background-color: #111522;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    }
    .header {
      padding: 32px 32px 24px 32px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      text-align: left;
    }
    .logo {
      font-size: 20px;
      font-weight: 700;
      color: #F5F1E8;
      letter-spacing: 0.5px;
      text-decoration: none;
    }
    .logo span {
      color: #7FA38A;
    }
    .content {
      padding: 32px;
    }
    .title {
      font-size: 24px;
      font-weight: 600;
      color: #F5F1E8;
      margin-top: 0;
      margin-bottom: 16px;
      line-height: 1.3;
    }
    .text {
      font-size: 15px;
      line-height: 1.6;
      color: #B8BDC7;
      margin-top: 0;
      margin-bottom: 20px;
    }
    .feature-list {
      margin-bottom: 28px;
      padding-left: 20px;
    }
    .feature-item {
      font-size: 14px;
      line-height: 1.5;
      color: #B8BDC7;
      margin-bottom: 10px;
    }
    .feature-item strong {
      color: #F5F1E8;
    }
    .button-container {
      margin-top: 32px;
      margin-bottom: 16px;
    }
    .button-primary {
      display: inline-block;
      padding: 14px 36px;
      background-color: #F5F1E8;
      color: #0A0D14 !important;
      text-decoration: none;
      border-radius: 9999px;
      font-weight: 600;
      font-size: 14px;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <a href="#" class="logo">MINERVA<span>·</span>OS</a>
      </div>
      <div class="content">
        <h1 class="title">Welcome to Minerva OS, {{name}}!</h1>
        <p class="text">
          Thank you for completing the onboarding process. Your workspace is now fully set up and ready.
        </p>
        <p class="text">
          Minerva OS is engineered to consolidate your agency's core functions:
        </p>
        <ul class="feature-list">
          <li class="feature-item"><strong>Pipeline Management</strong> · Track potential projects and deals.</li>
          <li class="feature-item"><strong>Project Architecture</strong> · Monitor progress, metrics, and risk flags.</li>
          <li class="feature-item"><strong>Client Portal & Approvals</strong> · Share deliverables and request sign-offs.</li>
          <li class="feature-item"><strong>Financial Engine</strong> · Issue, send, and track professional invoices.</li>
        </ul>
        <div class="button-container">
          <a href="{{dashboardLink}}" class="button-primary">Go to Dashboard</a>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
```

---

## 3. Invoice Sent (`invoice_sent`)

Sent to clients when a new invoice is issued.

### React Email Component

```tsx
import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface InvoiceSentEmailProps {
  invoice_number?: string;
  due_date?: string;
  amount?: string;
  invoiceLink?: string;
}

export const InvoiceSentEmail = ({
  invoice_number = 'INV-0042',
  due_date = 'June 15, 2026',
  amount = '4,500.00',
  invoiceLink = 'https://minerva-os.vercel.app/portal/invoice/123',
}: InvoiceSentEmailProps) => (
  <Html>
    <Head />
    <Preview>New Invoice {invoice_number} from Minerva OS</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Link href="https://minerva-os.vercel.app" style={logo}>
            MINERVA<span style={logoDot}>·</span>OS
          </Link>
        </Section>
        <Section style={content}>
          <Text style={title}>New Invoice Received</Text>
          <Text style={text}>
            Hello, a new invoice has been issued and sent from your agency. Please review the details below:
          </Text>
          <Section style={metaBox}>
            <table style={{ width: '100%' }}>
              <tbody>
                <tr>
                  <td style={metaLabel}>Invoice Number</td>
                  <td style={metaValue}>{invoice_number}</td>
                </tr>
                <tr>
                  <td style={metaLabel}>Due Date</td>
                  <td style={metaValue}>{due_date}</td>
                </tr>
                <tr>
                  <td style={{ ...metaLabel, padding: '16px 0 0 0', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>Amount Due</td>
                  <td style={{ ...metaValue, padding: '16px 0 0 0', borderTop: '1px solid rgba(255, 255, 255, 0.06)', color: '#7FA38A', fontSize: '18px' }}>${amount}</td>
                </tr>
              </tbody>
            </table>
          </Section>
          <Section style={btnContainer}>
            <Button style={button} href={invoiceLink}>
              Review & Pay
            </Button>
          </Section>
        </Section>
      </Container>
    </Body>
  </Html>
);
```

### Compiled Raw HTML

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Invoice Received</title>
  <style>
    body {
      background-color: #0A0D14;
      color: #F5F1E8;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      background-color: #0A0D14;
      padding: 48px 24px;
    }
    .container {
      max-width: 580px;
      margin: 0 auto;
      background-color: #111522;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    }
    .header {
      padding: 32px 32px 24px 32px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      text-align: left;
    }
    .logo {
      font-size: 20px;
      font-weight: 700;
      color: #F5F1E8;
      letter-spacing: 0.5px;
      text-decoration: none;
    }
    .logo span {
      color: #7FA38A;
    }
    .content {
      padding: 32px;
    }
    .title {
      font-size: 24px;
      font-weight: 600;
      color: #F5F1E8;
      margin-top: 0;
      margin-bottom: 16px;
      line-height: 1.3;
    }
    .text {
      font-size: 15px;
      line-height: 1.6;
      color: #B8BDC7;
      margin-top: 0;
      margin-bottom: 24px;
    }
    .meta-box {
      background-color: #171C2A;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 32px;
      border: 1px solid rgba(255, 255, 255, 0.06);
    }
    .meta-row {
      margin-bottom: 12px;
      font-size: 14px;
    }
    .meta-row:last-child {
      margin-bottom: 0;
    }
    .meta-label {
      color: #8A9099;
      display: inline-block;
      width: 130px;
      font-weight: 500;
    }
    .meta-value {
      color: #F5F1E8;
      font-weight: 600;
    }
    .meta-row.total {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
    }
    .meta-row.total .meta-label {
      color: #F5F1E8;
      font-size: 16px;
    }
    .meta-row.total .meta-value {
      color: #7FA38A;
      font-size: 18px;
    }
    .button-container {
      margin-bottom: 16px;
    }
    .button-primary {
      display: inline-block;
      padding: 14px 36px;
      background-color: #F5F1E8;
      color: #0A0D14 !important;
      text-decoration: none;
      border-radius: 9999px;
      font-weight: 600;
      font-size: 14px;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <a href="#" class="logo">MINERVA<span>·</span>OS</a>
      </div>
      <div class="content">
        <h1 class="title">New Invoice Received</h1>
        <p class="text">
          Hello, a new invoice has been issued and sent from your agency. Please review the details below:
        </p>
        <div class="meta-box">
          <div class="meta-row">
            <span class="meta-label">Invoice Number</span>
            <span class="meta-value">{{invoice_number}}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Due Date</span>
            <span class="meta-value">{{due_date}}</span>
          </div>
          <div class="meta-row total">
            <span class="meta-label">Amount Due</span>
            <span class="meta-value">${{amount}}</span>
          </div>
        </div>
        <div class="button-container">
          <a href="{{invoiceLink}}" class="button-primary">Review & Pay</a>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
```

---

## 4. Critical Risk Alert (`risk_alert`)

Sent to project owners when a high-severity risk flag is raised.

### React Email Component

```tsx
import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface RiskAlertEmailProps {
  project_name?: string;
  risk_type?: string;
  summary?: string;
  details?: string;
  projectDashboardLink?: string;
}

export const RiskAlertEmail = ({
  project_name = 'Acme Rebrand',
  risk_type = 'Budget Overrun',
  summary = 'Project has exceeded 90% of allocated hours.',
  details = 'The design phase took 40 hours longer than estimated due to client revisions.',
  projectDashboardLink = 'https://minerva-os.vercel.app/app/projects/123',
}: RiskAlertEmailProps) => (
  <Html>
    <Head />
    <Preview>[CRITICAL] High Severity Risk Flag: {project_name}</Preview>
    <Body style={main}>
      <Container style={{ ...container, borderLeft: '4px solid #A86A6A', borderRadius: '0 16px 16px 0' }}>
        <Section style={header}>
          <Link href="https://minerva-os.vercel.app" style={logo}>
            MINERVA<span style={{ color: '#A86A6A' }}>·</span>OS
          </Link>
        </Section>
        <Section style={content}>
          <Text style={alertHeader}>Critical Risk Flag</Text>
          <Text style={title}>High Severity Risk Flag Detected</Text>
          <Section style={metaBox}>
            <table style={{ width: '100%' }}>
              <tbody>
                <tr>
                  <td style={metaLabelVertical}>Project</td>
                  <td style={metaValueVertical}>{project_name}</td>
                </tr>
                <tr>
                  <td style={metaLabelVertical}>Risk Type</td>
                  <td style={{ ...metaValueVertical, color: '#A86A6A' }}>{risk_type}</td>
                </tr>
                <tr>
                  <td style={metaLabelVertical}>Summary</td>
                  <td style={metaValueVertical}>{summary}</td>
                </tr>
                <tr>
                  <td style={metaLabelVertical}>Details</td>
                  <td style={{ ...metaValueVertical, color: '#B8BDC7', fontWeight: 400 }}>{details}</td>
                </tr>
              </tbody>
            </table>
          </Section>
          <Section style={btnContainer}>
            <Button style={{ ...button, backgroundColor: '#A86A6A', color: '#F5F1E8' }} href={projectDashboardLink}>
              Investigate Risk
            </Button>
          </Section>
        </Section>
      </Container>
    </Body>
  </Html>
);
```

### Compiled Raw HTML

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Critical Risk Alert</title>
  <style>
    body {
      background-color: #0A0D14;
      color: #F5F1E8;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      background-color: #0A0D14;
      padding: 48px 24px;
    }
    .container {
      max-width: 580px;
      margin: 0 auto;
      background-color: #111522;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-left: 4px solid #A86A6A;
      border-radius: 0 16px 16px 0;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    }
    .header {
      padding: 32px 32px 24px 32px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      text-align: left;
    }
    .logo {
      font-size: 20px;
      font-weight: 700;
      color: #F5F1E8;
      letter-spacing: 0.5px;
      text-decoration: none;
    }
    .logo span {
      color: #A86A6A;
    }
    .content {
      padding: 32px;
    }
    .alert-header {
      color: #A86A6A;
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin-bottom: 12px;
    }
    .title {
      font-size: 22px;
      font-weight: 600;
      color: #F5F1E8;
      margin-top: 0;
      margin-bottom: 20px;
      line-height: 1.3;
    }
    .meta-box {
      background-color: #171C2A;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 28px;
      border: 1px solid rgba(255, 255, 255, 0.06);
    }
    .meta-row {
      margin-bottom: 12px;
      font-size: 14px;
    }
    .meta-row:last-child {
      margin-bottom: 0;
    }
    .meta-label {
      color: #8A9099;
      display: inline-block;
      width: 110px;
      font-weight: 500;
      vertical-align: top;
    }
    .meta-value {
      color: #F5F1E8;
      font-weight: 600;
      display: inline-block;
      width: calc(100% - 120px);
    }
    .meta-value.detail-desc {
      font-weight: 400;
      color: #B8BDC7;
    }
    .button-container {
      margin-bottom: 16px;
    }
    .button-primary {
      display: inline-block;
      padding: 14px 36px;
      background-color: #A86A6A;
      color: #F5F1E8 !important;
      text-decoration: none;
      border-radius: 9999px;
      font-weight: 600;
      font-size: 14px;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <a href="#" class="logo">MINERVA<span>·</span>OS</a>
      </div>
      <div class="content">
        <div class="alert-header">Critical Risk Flag</div>
        <h1 class="title">High Severity Risk Flag Detected</h1>
        <div class="meta-box">
          <div class="meta-row">
            <span class="meta-label">Project</span>
            <span class="meta-value">{{project_name}}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Risk Type</span>
            <span class="meta-value" style="color: #A86A6A;">{{risk_type}}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Summary</span>
            <span class="meta-value">{{summary}}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Details</span>
            <span class="meta-value detail-desc">{{details}}</span>
          </div>
        </div>
        <div class="button-container">
          <a href="{{projectDashboardLink}}" class="button-primary">Investigate Risk</a>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
```

---

## 5. Client Approval Request (`approval_request`)

Sent to clients when they need to review and approve a deliverable.

### React Email Component

```tsx
import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface ApprovalRequestEmailProps {
  approval_name?: string;
  approval_type?: string;
  portalLink?: string;
}

export const ApprovalRequestEmail = ({
  approval_name = 'V1 Logo Styleguide',
  approval_type = 'Brand Identity',
  portalLink = 'https://minerva-os.vercel.app/portal/client-token',
}: ApprovalRequestEmailProps) => (
  <Html>
    <Head />
    <Preview>Approval Required: {approval_name}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Link href="https://minerva-os.vercel.app" style={logo}>
            MINERVA<span style={{ color: '#B89B6A' }}>·</span>OS
          </Link>
        </Section>
        <Section style={content}>
          <Text style={title}>Approval Required</Text>
          <Text style={text}>
            Hello, your review and sign-off are requested for the following project deliverable:
          </Text>
          <Section style={metaBox}>
            <table style={{ width: '100%' }}>
              <tbody>
                <tr>
                  <td style={metaLabel}>Item / Deliverable</td>
                  <td style={metaValue}>{approval_name}</td>
                </tr>
                <tr>
                  <td style={metaLabel}>Type</td>
                  <td style={metaValue}>{approval_type}</td>
                </tr>
              </tbody>
            </table>
          </Section>
          <Text style={text}>
            Please click the button below to view the deliverable and submit your approval in the secure Client Portal:
          </Text>
          <Section style={btnContainer}>
            <Button style={button} href={portalLink}>
              View Deliverable
            </Button>
          </Section>
        </Section>
      </Container>
    </Body>
  </Html>
);
```

### Compiled Raw HTML

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Approval Required</title>
  <style>
    body {
      background-color: #0A0D14;
      color: #F5F1E8;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      background-color: #0A0D14;
      padding: 48px 24px;
    }
    .container {
      max-width: 580px;
      margin: 0 auto;
      background-color: #111522;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    }
    .header {
      padding: 32px 32px 24px 32px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      text-align: left;
    }
    .logo {
      font-size: 20px;
      font-weight: 700;
      color: #F5F1E8;
      letter-spacing: 0.5px;
      text-decoration: none;
    }
    .logo span {
      color: #B89B6A;
    }
    .content {
      padding: 32px;
    }
    .title {
      font-size: 24px;
      font-weight: 600;
      color: #F5F1E8;
      margin-top: 0;
      margin-bottom: 16px;
      line-height: 1.3;
    }
    .text {
      font-size: 15px;
      line-height: 1.6;
      color: #B8BDC7;
      margin-top: 0;
      margin-bottom: 24px;
    }
    .meta-box {
      background-color: #171C2A;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 32px;
      border: 1px solid rgba(255, 255, 255, 0.06);
    }
    .meta-row {
      margin-bottom: 12px;
      font-size: 14px;
    }
    .meta-row:last-child {
      margin-bottom: 0;
    }
    .meta-label {
      color: #8A9099;
      display: inline-block;
      width: 120px;
      font-weight: 500;
    }
    .meta-value {
      color: #F5F1E8;
      font-weight: 600;
    }
    .button-container {
      margin-bottom: 16px;
    }
    .button-primary {
      display: inline-block;
      padding: 14px 36px;
      background-color: #F5F1E8;
      color: #0A0D14 !important;
      text-decoration: none;
      border-radius: 9999px;
      font-weight: 600;
      font-size: 14px;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <a href="#" class="logo">MINERVA<span>·</span>OS</a>
      </div>
      <div class="content">
        <h1 class="title">Approval Required</h1>
        <p class="text">
          Hello, your review and sign-off are requested for the following project deliverable:
        </p>
        <div class="meta-box">
          <div class="meta-row">
            <span class="meta-label">Item / Deliverable</span>
            <span class="meta-value">{{approval_name}}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Type</span>
            <span class="meta-value">{{approval_type}}</span>
          </div>
        </div>
        <p class="text">
          Please click the button below to view the deliverable and submit your approval in the secure Client Portal:
        </p>
        <div class="button-container">
          <a href="{{portalLink}}" class="button-primary">View Deliverable</a>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
```
