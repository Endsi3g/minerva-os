# Full Coverage Audit — Minerva OS
> Généré le 2026-06-05

## Résumé

| Statut | Nombre | % |
|--------|--------|---|
| ✅ Fonctionnel | 59 | 95% |
| ⚠️ Placeholder/stub | 1 | 2% |
| 🔴 Page vide | 0 | 0% |
| ❌ Erreur/crash | 2 | 3% |
| **Total routes testées** | **62** | — |

---

## Routes publiques & auth (7/7 fonctionnelles)

| Statut | Route | Notes |
|--------|-------|-------|
| ✅ | `/` | — |
| ✅ | `/login` | — |
| ✅ | `/signup` | — |
| ✅ | `/forgot-password` | — |
| ✅ | `/reset-password` | — |
| ✅ | `/welcome` | — |
| ✅ | `/offline` | — |

## Modules core (17/18 fonctionnelles)

| Statut | Route | Notes |
|--------|-------|-------|
| ✅ | `/app/dashboard` | — |
| ✅ | `/app/pipeline` | — |
| ✅ | `/app/clients` | — |
| ✅ | `/app/projects` | — |
| ✅ | `/app/tasks` | — |
| ✅ | `/app/approvals` | — |
| ✅ | `/app/files` | — |
| ✅ | `/app/billing` | — |
| ✅ | `/app/proposals` | — |
| ✅ | `/app/agents` | — |
| ❌ | `/app/copilot` | 1 JS error(s) |
| ✅ | `/app/agent-ops` | — |
| ✅ | `/app/workflows` | — |
| ✅ | `/app/settings` | — |
| ✅ | `/app/profile` | — |
| ✅ | `/app/support-hub` | — |
| ✅ | `/app/marketplace` | — |
| ✅ | `/app/finance-hub` | — |

## Modules avancés (sans couverture précédente) (9/9 fonctionnelles)

| Statut | Route | Notes |
|--------|-------|-------|
| ✅ | `/app/intelligence` | — |
| ✅ | `/app/profitability` | — |
| ✅ | `/app/scorecards` | — |
| ✅ | `/app/finance` | — |
| ✅ | `/app/reports` | — |
| ✅ | `/app/command` | — |
| ✅ | `/app/support` | — |
| ✅ | `/app/call-preps` | — |
| ✅ | `/app/fulfillment` | — |

## Modules secondaires (10/12 fonctionnelles)

| Statut | Route | Notes |
|--------|-------|-------|
| ✅ | `/app/resources` | — |
| ✅ | `/app/knowledge` | — |
| ✅ | `/app/services` | — |
| ✅ | `/app/expenses` | — |
| ✅ | `/app/time-tracking` | — |
| ✅ | `/app/nps` | — |
| ⚠️ | `/app/changelog` | Placeholder text detected: "placeholder" |
| ✅ | `/app/tickets` | — |
| ✅ | `/app/onboarding` | Missing expected content: /onboard|setup|workspace/i |
| ✅ | `/app/onboarding/discover` | — |
| ❌ | `/todo` | 1 JS error(s) |
| ✅ | `/invite/test-invite-token` | — |

## Routes portail client (16/16 fonctionnelles)

| Statut | Route | Notes |
|--------|-------|-------|
| ✅ | `/portal` | Missing expected content: /email|portal|access/i |
| ✅ | `/portal/test-portal-audit-xyz` | — |
| ✅ | `/portal/test-portal-audit-xyz?signed=1` | — |
| ✅ | `/portal/test-portal-audit-xyz/files` | — |
| ✅ | `/portal/test-portal-audit-xyz/invoices` | — |
| ✅ | `/portal/test-portal-audit-xyz/proposals` | — |
| ✅ | `/portal/test-portal-audit-xyz/approvals` | — |
| ✅ | `/portal/test-portal-audit-xyz/deliverables` | — |
| ✅ | `/portal/test-portal-audit-xyz/journal` | — |
| ✅ | `/portal/test-portal-audit-xyz/timeline` | — |
| ✅ | `/portal/test-portal-audit-xyz/reports` | — |
| ✅ | `/portal/test-portal-audit-xyz/tickets` | — |
| ✅ | `/portal/test-portal-audit-xyz/settings` | — |
| ✅ | `/portal/test-portal-audit-xyz/nps` | — |
| ✅ | `/portal/proposal/test-proposal-token` | — |
| ✅ | `/reports/shared-report-test-token` | — |

---

## 🔴 Problèmes critiques (2)

### `/app/copilot`
- 1 JS error(s)
- JS errors:
  - `Minified React error #418; visit https://react.dev/errors/418?args[]=text&args[]= for the full message or use the non-mi`

### `/todo`
- 1 JS error(s)
- JS errors:
  - `An error occurred in the Server Components render. The specific message is omitted in production builds to avoid leaking`

---

## ⚠️ Pages placeholder / stubs (1)

- `/app/changelog` — Placeholder text detected: "placeholder"

---

## JS Errors détectées

### `/app/copilot`
- `Minified React error #418; visit https://react.dev/errors/418?args[]=text&args[]= for the full message or use the non-mi`

### `/todo`
- `An error occurred in the Server Components render. The specific message is omitted in production builds to avoid leaking`

---

## ✅ Pages fonctionnelles (59)

- `/` (6 éléments interactifs, 6075 chars)
- `/login` (6 éléments interactifs, 6803 chars)
- `/signup` (9 éléments interactifs, 6861 chars)
- `/forgot-password` (3 éléments interactifs, 6547 chars)
- `/reset-password` (6 éléments interactifs, 6588 chars)
- `/welcome` (6 éléments interactifs, 6394 chars)
- `/offline` (1 éléments interactifs, 6194 chars)
- `/app/dashboard` (26 éléments interactifs, 8733 chars)
- `/app/pipeline` (33 éléments interactifs, 9034 chars)
- `/app/clients` (31 éléments interactifs, 9063 chars)
- `/app/projects` (30 éléments interactifs, 8993 chars)
- `/app/tasks` (33 éléments interactifs, 8982 chars)
- `/app/approvals` (26 éléments interactifs, 8734 chars)
- `/app/files` (28 éléments interactifs, 8469 chars)
- `/app/billing` (35 éléments interactifs, 9150 chars)
- `/app/proposals` (29 éléments interactifs, 8431 chars)
- `/app/agents` (28 éléments interactifs, 8772 chars)
- `/app/agent-ops` (30 éléments interactifs, 9537 chars)
- `/app/workflows` (26 éléments interactifs, 8886 chars)
- `/app/settings` (42 éléments interactifs, 9063 chars)
- `/app/profile` (27 éléments interactifs, 9451 chars)
- `/app/support-hub` (35 éléments interactifs, 8971 chars)
- `/app/marketplace` (32 éléments interactifs, 8828 chars)
- `/app/finance-hub` (31 éléments interactifs, 9442 chars)
- `/app/intelligence` (32 éléments interactifs, 9414 chars)
- `/app/profitability` (31 éléments interactifs, 8967 chars)
- `/app/scorecards` (29 éléments interactifs, 8949 chars)
- `/app/finance` (26 éléments interactifs, 8617 chars)
- `/app/reports` (29 éléments interactifs, 9365 chars)
- `/app/command` (26 éléments interactifs, 8843 chars)
- `/app/support` (34 éléments interactifs, 8717 chars)
- `/app/call-preps` (27 éléments interactifs, 8583 chars)
- `/app/fulfillment` (27 éléments interactifs, 8696 chars)
- `/app/resources` (27 éléments interactifs, 8718 chars)
- `/app/knowledge` (29 éléments interactifs, 8665 chars)
- `/app/services` (31 éléments interactifs, 8670 chars)
- `/app/expenses` (27 éléments interactifs, 8650 chars)
- `/app/time-tracking` (31 éléments interactifs, 9058 chars)
- `/app/nps` (27 éléments interactifs, 8764 chars)
- `/app/tickets` (32 éléments interactifs, 8553 chars)
- `/app/onboarding` (1 éléments interactifs, 6156 chars)
- `/app/onboarding/discover` (1 éléments interactifs, 6156 chars)
- `/invite/test-invite-token` (2 éléments interactifs, 7851 chars)
- `/portal` (1 éléments interactifs, 6156 chars)
- `/portal/test-portal-audit-xyz` (1 éléments interactifs, 8695 chars)
- `/portal/test-portal-audit-xyz?signed=1` (1 éléments interactifs, 8747 chars)
- `/portal/test-portal-audit-xyz/files` (1 éléments interactifs, 9108 chars)
- `/portal/test-portal-audit-xyz/invoices` (1 éléments interactifs, 9688 chars)
- `/portal/test-portal-audit-xyz/proposals` (1 éléments interactifs, 9440 chars)
- `/portal/test-portal-audit-xyz/approvals` (1 éléments interactifs, 6156 chars)
- `/portal/test-portal-audit-xyz/deliverables` (1 éléments interactifs, 9452 chars)
- `/portal/test-portal-audit-xyz/journal` (1 éléments interactifs, 9038 chars)
- `/portal/test-portal-audit-xyz/timeline` (1 éléments interactifs, 9042 chars)
- `/portal/test-portal-audit-xyz/reports` (1 éléments interactifs, 9038 chars)
- `/portal/test-portal-audit-xyz/tickets` (1 éléments interactifs, 9272 chars)
- `/portal/test-portal-audit-xyz/settings` (1 éléments interactifs, 9042 chars)
- `/portal/test-portal-audit-xyz/nps` (1 éléments interactifs, 9102 chars)
- `/portal/proposal/test-proposal-token` (1 éléments interactifs, 6156 chars)
- `/reports/shared-report-test-token` (0 éléments interactifs, 7706 chars)

---

## Screenshots capturés

76 screenshots dans `tests/screenshots/`:
- `18-app-agent-ops.png`
- `18-app-agents.png`
- `18-app-approvals.png`
- `18-app-billing.png`
- `18-app-call-preps.png`
- `18-app-clients.png`
- `18-app-command.png`
- `18-app-copilot.png`
- `18-app-dashboard.png`
- `18-app-files.png`
- `18-app-finance-hub.png`
- `18-app-finance.png`
- `18-app-fulfillment.png`
- `18-app-intelligence.png`
- `18-app-marketplace.png`
- `18-app-pipeline.png`
- `18-app-profile.png`
- `18-app-profitability.png`
- `18-app-projects.png`
- `18-app-proposals.png`
- `18-app-reports.png`
- `18-app-scorecards.png`
- `18-app-settings.png`
- `18-app-support-hub.png`
- `18-app-support.png`
- `18-app-tasks.png`
- `18-app-workflows.png`
- `18-app_changelog.png`
- `18-app_expenses.png`
- `18-app_knowledge.png`
- `18-app_nps.png`
- `18-app_onboarding.png`
- `18-app_onboarding_discover.png`
- `18-app_resources.png`
- `18-app_services.png`
- `18-app_tickets.png`
- `18-app_time-tracking.png`
- `18-forgot-password.png`
- `18-home.png`
- `18-invite_test-invite-token.png`
- `18-login.png`
- `18-offline.png`
- `18-portal-approvals.png`
- `18-portal-deliverables.png`
- `18-portal-files.png`
- `18-portal-gateway.png`
- `18-portal-invoices.png`
- `18-portal-journal.png`
- `18-portal-nps.png`
- `18-portal-overview.png`
- `18-portal-proposal-sign.png`
- `18-portal-proposals.png`
- `18-portal-reports.png`
- `18-portal-settings.png`
- `18-portal-signed.png`
- `18-portal-tickets.png`
- `18-portal-timeline.png`
- `18-reports-shared.png`
- `18-reset-password.png`
- `18-s6-approvals.png`
- `18-s6-billing-tabs.png`
- `18-s6-cmdpalette.png`
- `18-s6-login-validation.png`
- `18-s6-sidebar-check.png`
- `18-s7-agents.png`
- `18-s7-billing.png`
- `18-s7-clients.png`
- `18-s7-dashboard.png`
- `18-s7-pipeline.png`
- `18-s7-projects.png`
- `18-s7-proposals.png`
- `18-s7-settings.png`
- `18-s7-workflows.png`
- `18-signup.png`
- `18-todo.png`
- `18-welcome.png`

---

## Recommandations priorisées

### 🔴 Bloquer avant démo — Pages cassées

- `/app/copilot`: 1 JS error(s)
- `/todo`: 1 JS error(s)

### ⚠️ Modules à compléter avant lancement


### 📋 Modules secondaires (post-launch)

- `/app/changelog`
