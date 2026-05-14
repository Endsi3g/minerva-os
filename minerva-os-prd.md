# PRD — Minerva OS

## Vision produit

**Minerva OS** est le système d’exploitation stratégique d’Uprising Studio : une plateforme premium qui centralise l’acquisition, l’onboarding, l’exécution, la collaboration client, la facturation et l’intelligence opérationnelle dans une seule expérience cohérente.

Le nom **Minerva** renvoie à la déesse romaine de la sagesse, de l’intellect et de la stratégie, ce qui donne au produit une portée historique et légendaire adaptée à une agence qui veut projeter autorité, discernement et maîtrise.

Le produit fusionne deux dimensions : la rigueur d’un portail client moderne (sécurité, permissions, documents, suivi, approbations, facturation) et une direction artistique distinctive inspirée d’un univers céleste, éditorial et cinématographique (Celestial Editorial Noir).

## 1. Système & plateforme Minerva OS

Minerva OS est pensé comme une **plateforme d’agence unifiée** composée de plusieurs sous‑systèmes : Core Platform, Collaboration temps réel, IA & Automations, Billing & Finance, Intégrations externes, Observabilité & Admin.

### 1.1. Core Platform (Convex + Next.js)

- **Backend unique sur Convex** : Logique métier, données, temps réel, schedulers et webhooks gérés de manière centralisée.
- **Frontend Next.js** : Utilisation du App Router, TypeScript, Tailwind CSS, et shadcn/ui comme unique source de composants UI.
- **Architecture unifiée** : Partage des types, schémas Convex, composants Minerva UI et hooks à travers l'application.

**Services “core” Convex :**
- Queries/mutations typées pour chaque domaine (CRM, Projects, Files, Billing, Approvals, Reporting).
- Real-time subscriptions sur les vues critiques (pipeline, dashboard projet, queue d’approbation, file vault).
- **Convex File Storage** pour la gestion native des assets.
- **HTTP Actions** pour les webhooks Stripe, les notifications email et les intégrations tierces.

## 2. Fonctionnalités système avancées (Convex)

### 2.1. Temps réel & collaboration
- **Présence temps réel** : Statut “en ligne”, curseurs et présence visuelle sur les projets et fiches clients.
- **Sync automatique** : Mise à jour instantanée de toutes les vues dès modification des données.
- **Locks optimistes** : Stratégie de “last writer wins” avec journal d’activité complet.

### 2.2. Storage fichiers & liens
- **Gestion d'assets** : Métadonnées stockées (taille, type, client, visibilité).
- **URLs signées** : Génération temporaire pour une livraison sécurisée aux clients.
- **Auto-nettoyage** : Suppression automatique des versions obsolètes via cron jobs.

### 2.3. Cron, jobs planifiés & tâches asynchrones
- **Cron jobs Convex** : Résumés hebdomadaires, rappels d’approbation en attente, rappels de facturation.
- **Scheduled functions** : Planification dynamique d'actions futures (ex: rappels spécifiques).

### 2.4. Webhooks & HTTP Actions
- **Endpoints Stripe** : Synchronisation en temps réel des paiements et abonnements.
- **Notifications critiques** : Synchronisation de la délivrance des emails via providers (Sendgrid/Postmark).

### 2.5. Vector Search & IA contextuelle
- **Recherche sémantique** : Recherche intelligente dans les notes, appels et documents.
- **Suggestions d'assets** : Matching intelligent basé sur le contexte du projet ou du client.
- **Global Search** : Recherche transversale intelligente (embeddings).

## 3. IA & Automations (Minerva Intelligence Layer)

Une IA assistive basée sur Convex + LLM externe (OpenAI/Anthropic).

### 3.1. Domaines IA
- **Summaries & briefs** : Résumé automatique de discovery briefs, notes d'appels et rapports hebdomadaires.
- **Approvals & risques** : Détection de blocages, backlog critique ou dégradation de marges.
- **Aide à la rédaction** : Suggestion de structure pour propositions et drafts d'emails transactionnels.

### 3.2. Architecture IA
- **Convex Actions** pour les appels API LLM sécurisés.
- **Vector search** pour fournir un contexte riche (RAG) aux prompts IA.
- **Audit IA** : Log complet des requêtes et résumés dans `AISummary`.

## 4. Modules fonctionnels enrichis

### 4.1. CRM & Pipeline
- **Lead scoring** : Règles configurables (budget, fit, timeline).
- **Automations** : Passage automatique en "Opportunity" et création de projets "draft".
- **Web-to-lead** : Endpoint HTTP pour capture de leads externe.

### 4.2. Intake & Discovery
- **Templates versionnés** par type de service.
- **Form builder léger** stocké en JSON pour une flexibilité maximale.
- **Autosave temps réel** pour les sessions de workshop.

### 4.3. Proposals & Scoping
- **Générateur de proposition** basé sur templates et variables.
- **Tracking de consultation** : Savoir quand le client consulte sa proposition.
- **Lien Billing** : Conversion immédiate en devis/facture.

### 4.4. Project Hub
- **Multi-vues** : Liste, Kanban, Calendrier.
- **Project Health** : Calcul automatique des indicateurs de santé (marge, délais, satisfaction).
- **Tracking temps/points** par phase.

### 4.5. Feedback & Approvals
- **Threading avancé** : Mentions, résolutions et discussion contextuelle.
- **Règles d'approbation** : Simples ou multi-reviewers avec workflows logiques.

### 4.6. Files & Asset Vault
- **Classification** : Contrat, brand asset, livrable, source.
- **Traçabilité** : Audit log des téléchargements et accès.

### 4.7. Billing & Retainers
- **Sync Stripe** : Invoices et Payment Links synchronisés.
- **Taxes locales** : Calcul TPS/TVQ automatisé pour le Québec.
- **Suivi de retainer** : Alertes de consommation (heures/points).

### 4.8. Financial Department
- **Journal détaillé** : Revenus, dépenses, taxes, types.
- **Rapports fiscaux** : Exports pour TPS/TVQ par période.

### 4.9. Call Preps & Summaries
- **Sync Calendars** : Mapping des sessions d'appels.
- **Live notes** : Prise de notes collaborative avec présence.
- **AI post-call** : Génération de tâches directement liées au projet.

### 4.10. Client Fulfillment
- **Checklists métier** : SEO, Ads, Content (configurables).
- **Progress tracking** : Vue client simplifiée de l'état d'avancement technique.

## 5. Permissions, multi‑workspace & sécurité

### 5.1. Modèle multi‑workspace
- Isolation totale des données par Workspace (marque ou entité).
- Rôles granulaires par utilisateur par workspace.

### 5.2. Sécurité Convex
- Validation systématique `ctx.auth` + rôle dans chaque mutation.
- **Audit log central** (`ActivityLog`) pour toutes les actions sensibles.

## 6. Observabilité & Qualité
- **Monitoring Convex** : Logs de fonctions, erreurs et performances.
- **Feature Flags** : Activation progressive des fonctions (ex: IA Summaries pour pilotes).

## 7. Design System & Minerva UI
- **Celestial Editorial Noir** : Direction sombre, premium, cinématographique.
- **Composants Minerva UI** : `ProjectHealthCard`, `StatusBadge`, `ApprovalQueue`, `CommandCenter`.

## 8. Roadmap actualisée

### Phase 4 – Client Experience (En cours)
- Stabilisation portail client.
- Intégration facturation Stripe.
- Notifications critiques.

### Phase 5 – Intelligence (À venir)
- Vector Search & RAG.
- Résumés IA (briefs, calls, weekly).
- Risk flags basés sur la donnée réelle.

### Phase 6 – Extensibilité
- API publique restreinte.
- Intégrations Calendars réelles.
- Connecteurs formulaires externes.
