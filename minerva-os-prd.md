# PRD — Minerva OS

## Vision produit

**Minerva OS** est le système d’exploitation stratégique d’Uprising Studio : une plateforme premium qui centralise l’acquisition, l’onboarding, l’exécution, la collaboration client, la facturation et l’intelligence opérationnelle dans une seule expérience cohérente.[cite:27][cite:1][cite:2][cite:3]

Le nom **Minerva** renvoie à la déesse romaine de la sagesse, de l’intellect et de la stratégie, ce qui donne au produit une portée historique et légendaire adaptée à une agence qui veut projeter autorité, discernement et maîtrise.[cite:27][cite:29]

Le produit doit fusionner deux dimensions : la rigueur d’un portail client moderne — sécurité, permissions, documents, suivi, approbations, facturation — et une direction artistique distinctive inspirée d’un univers céleste, éditorial et cinématographique observé dans l’image de référence fournie par l’utilisateur.[cite:1][cite:2][cite:3]

## Contexte

Les guides récents sur les portails clients pour agences convergent sur un ensemble d’attentes fortes : authentification sécurisée, contrôle d’accès par rôle, messagerie, partage de documents, visibilité projet, feedback, approbations, facturation et personnalisation de marque.[cite:1][cite:2][cite:3]

Pour Uprising Studio, l’enjeu n’est pas seulement de créer un tableau de bord, mais de réduire la fragmentation des outils, d’accélérer les validations, d’améliorer la perception premium côté client et de rendre les opérations plus lisibles en interne.[cite:1][cite:2][cite:3]

## Objectifs business

- Réduire le temps de qualification et d’onboarding des nouveaux clients grâce à des flux structurés de brief, de collecte d’informations et de validation.[cite:2][cite:3]
- Offrir un portail client premium qui augmente la transparence sur l’état des projets, des livrables, des échéances et des validations.[cite:1][cite:2][cite:3]
- Centraliser contrats, fichiers, approbations et historique de communication dans un environnement unifié.[cite:1][cite:2]
- Diminuer le temps perdu dans les allers-retours, la recherche d’information et le suivi manuel des tâches, fichiers et paiements.[cite:2][cite:3]
- Créer un actif produit différenciant pour Uprising Studio, réutilisable comme socle opérationnel interne et éventuellement commercialisable plus tard.[cite:1][cite:3]

## Objectifs produit

Le MVP doit prouver trois promesses : **qualifier plus vite**, **livrer plus clairement** et **faire approuver sans friction**.[cite:2][cite:3]

Le produit doit permettre à l’agence de piloter ses opérations internes tout en exposant au client une version contrôlée, lisible et élégante de la réalité projet via un portail white-label premium.[cite:1][cite:2]

## Utilisateurs cibles

| Rôle | Description | Besoins principaux |
|---|---|---|
| Agency Owner | Direction de l’agence | Vue globale pipeline, rentabilité, capacité, santé des comptes |
| Strategist | Responsable cadrage | Discovery, brief, proposition, objectifs, documentation |
| Project Manager | Chef d’orchestre livraison | Timeline, tâches, dépendances, validation, communication |
| Designer | Production créative | Accès assets, feedback, versions, approbations |
| Developer | Production technique | Spécifications, tickets, fichiers, statuts, handoff |
| Finance | Gestion financière | Devis, factures, retainers, paiements, export |
| Client Stakeholder | Décideur client | Vision du projet, documents, échéances, validations |
| Client Reviewer | Relecteur ou collaborateur client | Commentaires, approbations, fichiers, annotations |

## Jobs to be done

- Quand un prospect arrive, l’équipe doit pouvoir capturer les besoins, qualifier l’opportunité et lancer un onboarding sans duplication de saisie.[cite:2][cite:3]
- Quand un projet démarre, les équipes doivent centraliser objectifs, livrables, tâches, assets, décisions et risques dans un même espace.[cite:1][cite:3]
- Quand un client veut suivre ou approuver, il doit voir l’essentiel sans complexité interne inutile.[cite:1][cite:2]
- Quand la direction veut piloter l’agence, elle doit comprendre charge, marge, vélocité, revenus et blocages sans consolider plusieurs outils à la main.[cite:1][cite:3]

## Proposition de valeur

Minerva OS se positionne comme un **agency operating system premium** plutôt qu’un simple portail client ou gestionnaire de tâches.[cite:1][cite:2][cite:3]

Sa différenciation repose sur cinq piliers :
- Une identité de marque forte et légendaire.
- Une UX premium inspirée d’une direction visuelle céleste et éditoriale.
- Une base de composants propriétaire construite sur shadcn/ui pour garder contrôle, cohérence et vitesse d’exécution.[cite:26]
- Une séparation nette entre vues internes et vues client.
- Une orchestration du cycle complet agence, du lead au paiement.[cite:1][cite:2][cite:3]

## Périmètre fonctionnel

### 1. CRM & Pipeline

Fonction : gérer les leads, opportunités, statuts commerciaux, notes de discovery, budget, source et probabilité de closing.[cite:3]

Fonctionnalités :
- Fiches lead et compte client.
- Pipeline par étapes.
- Score de qualification.
- Historique d’interactions.
- Assignation owner.
- Prochaine action recommandée.
- Liens vers proposition, onboarding et projet.[cite:3]

### 2. Intake & Discovery

Fonction : convertir un lead en projet cadré avec un workflow de brief et de collecte.[cite:2][cite:3]

Fonctionnalités :
- Formulaires de brief.
- Upload de documents et assets.
- Questionnaire de qualification.
- Checklist d’onboarding.
- Notes de workshop.
- Résumé de besoins.
- Validation du scope initial.[cite:2][cite:3]

### 3. Proposals & Scoping

Fonction : formaliser l’offre commerciale et le périmètre projet.

Fonctionnalités :
- Templates de proposition.
- Structure livrables / phases.
- Estimation budget / retainer.
- Conditions, exclusions, add-ons.
- Signature et approbation manuelle ou via statut.

### 4. Project Hub

Fonction : piloter l’exécution active du projet.[cite:1][cite:3]

Fonctionnalités :
- Vue d’ensemble projet.
- Phases et milestones.
- Kanban et liste de tâches.
- Responsables et échéances.
- Journal d’activité.
- Risques / blockers.
- Santé du projet.
- Vue client simplifiée.[cite:1][cite:3]

### 5. Feedback & Approvals

Fonction : centraliser la validation des livrables, commentaires et décisions, un besoin fortement présent dans les outils d’agence modernes.[cite:2][cite:3]

Fonctionnalités :
- Commentaires contextualisés.
- Demande de validation.
- États “Pending / Changes requested / Approved”.
- Historique de versions.
- Journal de décision.
- Notifications ciblées.[cite:2][cite:3]

### 6. Files & Asset Vault

Fonction : stocker les contrats, visuels, exports, livrables, fichiers source et documents de référence dans une structure cohérente.[cite:1]

Fonctionnalités :
- Arborescence par client/projet.
- Tags et recherche.
- Prévisualisation.
- Permissions par rôle.
- Historique d’upload.
- Lien avec tâches, livrables et approbations.[cite:1]

### 7. Billing & Retainers

Fonction : suivre la partie financière, fréquemment citée comme composante clé d’un portail client robuste.[cite:1][cite:3]

Fonctionnalités :
- Devis.
- Factures.
- Paiements.
- Suivi de retainer.
- Historique des transactions.
- État des soldes.
- Exports comptables.[cite:1][cite:3]

### 8. Client Portal

Fonction : exposer au client un espace sobre, branded et utile avec une visibilité contrôlée.[cite:1][cite:2][cite:3]

Fonctionnalités :
- Dashboard client.
- Timeline projet.
- Fichiers et livrables.
- Factures et devis.
- Messages ciblés.
- Validation de livrables.
- Checklist d’onboarding.
- Informations de projet visibles selon permissions.[cite:1][cite:2][cite:3]

### 9. Team Operations

Fonction : donner à l’interne les leviers de pilotage sur charge, vélocité et collaboration.[cite:1][cite:3]

Fonctionnalités :
- Charge par personne / rôle.
- Santé du delivery.
- Vue deadlines.
- Performance des comptes.
- Notes internes.
- Capacité disponible.
- Alertes de risques.[cite:1][cite:3]

### 10. Reporting & Intelligence

Fonction : fournir une lecture synthétique et actionnable de l’activité agence.[cite:1][cite:3]

Fonctionnalités :
- CA par client.
- Valeur pipeline.
- Taux de conversion.
- Vitesse de livraison.
- Délai moyen d’approbation.
- Utilisation des retainers.
- Satisfaction client.
- Rapports par période.[cite:1][cite:3]

### 11. Automation & AI Assist

Fonction : accélérer les tâches répétitives sans tomber dans une IA gadget.

Fonctionnalités :
- Résumés automatiques de briefs.
- Suggestions de prochaine étape.
- Rappels d’approbation.
- Détection de projet à risque.
- Résumé hebdomadaire de compte.
- Classification automatique de documents.

## Hors périmètre MVP

- Marketplace externe.
- Facturation multi-entité complexe.
- Automatisation no-code visuelle complète.
- SSO enterprise dès V1.
- API publique complète dès lancement.[cite:1]

## Exigences fonctionnelles

### Authentification et sécurité

- Connexion email/password ou magic link.
- Gestion des rôles et permissions granulaires, car le contrôle d’accès est une exigence centrale des portails modernes.[cite:1][cite:2]
- Journal d’activité des actions sensibles.
- Chiffrement des données sensibles en transit et au repos selon les pratiques recommandées pour les portails custom.[cite:1]
- Sessions sécurisées, expiration configurable, récupération de mot de passe.

### Permissions

- Chaque entité doit avoir une visibilité interne, client ou privée.
- Les clients ne voient jamais les notes internes, marges, capacité ou commentaires internes.
- Les validateurs client peuvent approuver sans voir toute l’administration du compte.
- Les rôles internes héritent de permissions modulaires par domaine (CRM, projet, finance, fichiers, admin).

### Navigation

- Sidebar principale pour l’app interne.
- Header contextuel avec recherche, actions rapides et switch de contexte.
- Espace client simplifié avec navigation limitée aux sections autorisées.
- Command palette omniprésente pour ouvrir rapidement comptes, projets, tâches, fichiers et actions.

### Recherche

- Recherche globale sur clients, projets, tâches, documents et factures.
- Filtres par type, statut, owner, date et compte.
- Résultats priorisés par fréquence d’accès et contexte.

### Notifications

- Notifications in-app.
- Emails transactionnels critiques.
- Préférences par utilisateur.
- Rappels pour approbations, paiements, retards et nouvelles affectations.[cite:1][cite:2]

## Exigences non fonctionnelles

- Interface responsive desktop-first avec couverture mobile de consultation et d’actions critiques.
- Accessibilité WCAG AA via primitives accessibles et comportements compatibles clavier, approche facilitée par shadcn/ui et Radix.[cite:26]
- Performances rapides sur dashboard, tables et vues projet.
- Architecture modulaire extensible.
- Logs, monitoring et suivi d’erreurs.
- Tolérance à la croissance des volumes de fichiers, projets et comptes.[cite:1]

## Architecture de l’information

### Niveaux principaux

1. Workspace
2. Clients
3. Pipeline
4. Projects
5. Tasks
6. Approvals
7. Files
8. Billing
9. Reports
10. Settings

### Hiérarchie interne

- Workspace
  - Dashboard
  - Pipeline
  - Clients
    - Overview
    - Contacts
    - Files
    - Billing
    - Activity
  - Projects
    - Overview
    - Timeline
    - Tasks
    - Deliverables
    - Approvals
    - Files
    - Notes
  - Reports
  - Team
  - Settings

### Hiérarchie client

- Client Portal
  - Home
  - Project Status
  - Deliverables
  - Files
  - Approvals
  - Invoices
  - Messages

## Navigation modèle

L’expérience doit séparer clairement l’espace **agency internal** et l’espace **client portal**, tout en partageant le même langage visuel.[cite:1][cite:2]

Le design doit favoriser une lecture hiérarchique calme : peu d’encombrement, sections bien respirées, actions primaires évidentes, contenus secondaires repliables et surfaces contextuelles plutôt que surcharge d’écran.[file:21]

## UX principles

- Une action principale par vue.
- Révélation progressive de la complexité.
- Transparence opérationnelle sans exposer le chaos interne au client.[cite:2][cite:3]
- États de validation extrêmement lisibles.
- Navigation silencieuse et rapide.
- Cohérence forte entre data-heavy UI et langage de marque premium.
- Aucun pattern visuel générique de “startup SaaS”.[file:21]

## Design system — Celestial Editorial Noir

L’image fournie montre un univers nocturne, nuageux, très contrasté, presque pictural, avec une typo serif monumentale, une interface en capsules sombres et une lumière argentée diffuse ; cette direction devient le socle du système **Celestial Editorial Noir**.[file:21]

[image:1]

### Intentions esthétiques

- Sombre, céleste, cinématographique.
- Premium, silencieux, stratégique.
- Éditorial plutôt que gadget.
- Monochrome enrichi par des nuances froides, ivoire, graphite et argent.[file:21]

### Palette fondatrice

| Token | Valeur | Usage |
|---|---|---|
| `--bg` | `#0A0D14` | Fond principal app |
| `--surface` | `#111522` | Cartes et surfaces de base |
| `--surface-2` | `#171C2A` | Surfaces surélevées |
| `--border` | `rgba(255,255,255,0.10)` | Contours subtils |
| `--text` | `#F5F1E8` | Texte principal |
| `--text-muted` | `#B8BDC7` | Texte secondaire |
| `--text-faint` | `#8A9099` | Métadonnées |
| `--accent` | `#D8DDE6` | Accent clair premium |
| `--accent-strong` | `#FFFFFF` | Focus et actions majeures |
| `--success` | `#7FA38A` | État succès |
| `--warning` | `#B89B6A` | État attention |
| `--danger` | `#A86A6A` | État erreur |

### Typographie

- **Display** : serif élégante et dramatique pour hero, titres de marque, écrans vides premium et moments narratifs.[file:21]
- **UI sans-serif** : sans nette, compacte et lisible pour navigation, tableaux, formulaires et contenus d’app.[file:21]
- Hiérarchie : un langage très contrasté entre titres de marque et texte fonctionnel.

### Tokens et principes

- Grille 4px.
- Radius moyen à large, jamais cartoon.
- Ombres profondes mais diffuses.
- Bordures alpha-blended.
- Blur subtil sur surfaces overlays.
- Motion lente et feutrée.
- États focus lumineux, nets, non agressifs.

### Surfaces

- Fond global très sombre.
- Cartes graphite/bleu nuit.
- Overlays verre fumé.
- Hero visuel avec gradient sombre + texture nuageuse ou cosmique très discrète.
- Aucune saturation forte ni néon.[file:21]

### Composants visuels signatures

- Navigation pill.
- Titres serif généreux.
- Cards denses mais respirées.
- Data tables raffinées.
- Empty states cinématographiques.
- Badges monochromes à contraste doux.

## shadcn/ui — stratégie complète

La documentation officielle présente shadcn/ui comme une approche où l’équipe récupère le code des composants et le personnalise directement, au lieu de dépendre d’une bibliothèque opaque ; ce modèle est particulièrement adapté à un produit qui veut bâtir un système propriétaire fort.[cite:26]

### Principe de base

- shadcn/ui devient la **fondation intégrale de l’interface**.[cite:26]
- Tous les composants sont reskinnés dans la direction Minerva OS.
- Une registry interne “Minerva UI” encapsule les variantes métiers.
- Les primitives accessibles Radix sont conservées via shadcn/ui.[cite:26]

### Composants shadcn/ui à adopter

- Button
- Input
- Textarea
- Label
- Select
- Checkbox
- Radio Group
- Switch
- Form
- Card
- Sheet
- Dialog
- Drawer
- Popover
- Tooltip
- Hover Card
- Tabs
- Accordion
- Collapsible
- Breadcrumb
- Navigation Menu
- Sidebar
- Command
- Dropdown Menu
- Context Menu
- Menubar
- Alert Dialog
- Toast / Sonner integration
- Avatar
- Badge
- Skeleton
- Progress
- Calendar
- Table / Data table patterns
- Pagination
- Separator
- Scroll Area
- Chart patterns if needed via ecosystem blocks.[cite:26][cite:28][cite:30]

### Registry Minerva UI

Créer des wrappers internes :
- `AccountCard`
- `ProjectHealthCard`
- `ApprovalQueue`
- `DeliverablePanel`
- `ClientPortalShell`
- `RetainerUsageWidget`
- `CommandCenter`
- `ActivityFeed`
- `RiskBanner`
- `InvoiceStatusCard`
- `FileVaultTable`
- `LeadQualificationPanel`

### Règles d’implémentation

- Aucun composant brut non stylé ne sort en production.
- Chaque composant reçoit des tokens Minerva.
- Les states hover, focus, active et disabled sont documentés.
- Les patterns métier sont composés au-dessus des primitives shadcn/ui, jamais en contradiction.
- Toutes les modales, sheets, menus et overlays doivent garder cohérence de blur, radius, bordure et tonalité.[cite:26]

## Architecture technique

### Frontend

- Next.js.
- TypeScript.
- Tailwind CSS.
- shadcn/ui pour l’intégralité de la couche composants.[cite:26]
- State management léger par domaine.
- Charts et tables selon besoins analytiques.

### Backend

- API applicative sécurisée.
- Services métiers par domaine : CRM, projets, fichiers, billing, notifications, reporting.
- File storage séparé.
- Mécanisme de jobs pour emails, rappels et résumés.

### Data

- PostgreSQL.
- ORM type Prisma ou Drizzle.
- Audit log sur actions critiques.
- Relations fortes entre client, projet, livrable, facture, utilisateur et approbation.

### Intégrations

- Stripe pour paiements.
- Email provider transactionnel.
- Stockage objet pour fichiers.
- Calendar optionnel plus tard.
- Analytics produit.

## Modèle de données — aperçu

### Entités principales

- User
- Role
- Permission
- Workspace
- ClientAccount
- Contact
- Lead
- Opportunity
- DiscoveryBrief
- Proposal
- Project
- ProjectPhase
- Task
- Deliverable
- ApprovalRequest
- ApprovalDecision
- FileAsset
- Folder
- Invoice
- Payment
- Retainer
- ActivityLog
- Notification
- Comment
- ReportSnapshot

### Relations clés

- Un client a plusieurs contacts, projets, factures et fichiers.
- Un projet contient phases, tâches, livrables, approbations et activité.
- Une approbation est liée à un livrable, une version et un ou plusieurs reviewers.
- Une facture peut être rattachée à un projet ou à un compte client.
- Les permissions sont résolues par rôle, workspace et contexte d’objet.

## Permissions et sécurité

Les portails modernes mettent fortement l’accent sur les permissions et la protection des données, car le même système doit servir des équipes internes et des clients externes sans confusion des droits.[cite:1][cite:2]

### Niveaux de visibilité

- `internal_only`
- `client_visible`
- `client_approver_only`
- `finance_only`
- `admin_only`

### Exigences

- Journal d’audit sur création, suppression, validation, accès fichier sensible et modification de permissions.[cite:1]
- Suppression logique pour restauration.
- Politique de session et logs d’accès.
- Préparation future au MFA et au SSO si montée enterprise.[cite:1]

## User stories essentielles

### CRM

- En tant qu’owner, il faut visualiser toutes les opportunités par étape pour piloter le pipe.
- En tant que strategist, il faut attacher un brief et noter le budget estimé à un lead.

### Projets

- En tant que PM, il faut créer un projet depuis un compte gagné sans ressaisir les données du brief.
- En tant que designer, il faut retrouver rapidement le dernier livrable validé.

### Approvals

- En tant que client reviewer, il faut voir ce qui attend validation et approuver ou demander des modifications simplement.[cite:2][cite:3]
- En tant que PM, il faut savoir qui bloque une approbation et depuis combien de temps.[cite:2][cite:3]

### Finance

- En tant que finance, il faut voir les factures ouvertes et le statut de paiement par client.[cite:1][cite:3]
- En tant que client stakeholder, il faut télécharger une facture sans passer par email.[cite:1][cite:2]

## Écrans clés

### Interne

- Dashboard exécutif
- Pipeline CRM
- Fiche client
- Espace discovery
- Dashboard projet
- Vue tâches / kanban
- Vue livrables
- Queue d’approbation
- File vault
- Billing center
- Reporting
- Paramètres

### Client

- Home
- Project overview
- Deliverables
- Approvals
- Files
- Billing
- Messages

## Analytics et événements

- Lead created
- Qualification completed
- Proposal sent
- Project created
- Approval requested
- Approval approved
- Approval changes requested
- Invoice viewed
- Invoice paid
- File uploaded
- File downloaded
- Portal login
- Dashboard viewed
- Command used

## KPIs

| KPI | Définition |
|---|---|
| Lead-to-project conversion | % leads devenus projets |
| Time-to-onboard | Délai entre closing et onboarding complet |
| Approval turnaround time | Temps moyen d’approbation |
| On-time delivery rate | % livrables à temps |
| Retainer utilization visibility | Niveau de visibilité et suivi d’usage |
| Client portal adoption | Taux de connexion et usage du portail |
| Invoice payment delay | Délai moyen de paiement |
| Internal admin time saved | Temps administratif économisé |

## MVP

### Inclus en V1

- Auth.
- Rôles.
- CRM léger.
- Brief intake.
- Création projet.
- Dashboard projet.
- Tâches.
- Fichiers.
- Approbations simples.
- Dashboard client.
- Factures visibles.
- Notifications de base.[cite:1][cite:2][cite:3]

### Non inclus V1

- SSO.
- Automations visuelles avancées.
- IA conversationnelle complète.
- Multi-workspace complexe.
- Reporting financier avancé.

## Roadmap

| Phase | Objectif | Livrables |
|---|---|---|
| Phase 0 | Strategy | PRD, architecture, flows, design system |
| Phase 1 | Foundation | Auth, shell app, tokens, shadcn/ui setup |
| Phase 2 | Revenue | CRM, intake, proposal, account creation |
| Phase 3 | Delivery | Projects, tasks, files, approvals |
| Phase 4 | Client experience | Client portal, billing visibility, notifications |
| Phase 5 | Intelligence | Reporting, risk flags, AI summaries |

## Risques et dépendances

- Scope trop large dès V1.
- Complexité des permissions multi-rôles.[cite:1][cite:2]
- Mauvaise séparation entre vue interne et vue client, ce qui nuit à la clarté.[cite:2]
- Sous-estimation du travail sur la qualité des composants et de la registry shadcn/ui.[cite:26]
- Dette UX si les workflows métier sont posés après le design au lieu d’avant.

## QA et tests

- Tests composants sur toutes variantes critiques.
- Tests de permissions par rôle.
- Tests de navigation clavier et accessibilité.[cite:26]
- Tests mobile sur vues client critiques.
- Tests de performance sur tables, recherche, dashboard.
- Tests upload/download fichiers.
- Tests de statuts d’approbation et d’historique.

## Lancement

### Pré-lancement

- Seed de données réalistes.
- Comptes pilotes internes.
- Deux ou trois clients bêta sélectionnés.
- Templates de projets et d’onboarding.
- Support interne et documentation rapide.

### Lancement beta

- Limiter le scope à quelques comptes pilotes.
- Mesurer adoption, friction, usage du portail et temps d’approbation.
- Prioriser les frictions de delivery, pas les gadgets.

### Post-lancement

- Ajouter reporting avancé.
- Ajouter summaries IA et signaux de risque.
- Consolider la design registry Minerva.
- Préparer version commercialisable plus tard.

## Prompt maître pour conception/implémentation

```text
Create and implement a premium agency operating system called Minerva OS for Uprising Studio.

Core identity:
- The product name is Minerva OS.
- Minerva references the Roman goddess of wisdom, strategy, intellect, and craft.
- The brand must feel historical, legendary, premium, calm, cinematic, and highly intelligent.

Visual direction:
- Use the attached reference image as the primary visual inspiration.
- Build a complete design system called “Celestial Editorial Noir”.
- The visual language should combine dark celestial atmosphere, cloud-like softness, cool night tones, ivory typography, cinematic composition, editorial restraint, and premium software clarity.
- Avoid generic SaaS design, blue-purple AI gradients, neon effects, startup clichés, and template-like layouts.

Component system:
- Use shadcn/ui as the complete foundation of the interface.
- Customize every shadcn/ui component into the Minerva OS visual language.
- Build an internal registry of agency-specific components on top of shadcn/ui.
- Ensure accessibility, keyboard navigation, semantic structure, and polished states.

Product scope:
- Include CRM, pipeline, lead scoring, intake, onboarding, proposals, project management, tasks, milestones, approvals, feedback, asset vault, billing, retainers, notifications, team ops, reporting, AI-assisted summaries, and a client portal.
- Separate internal views and client-facing views with granular permissions.
- Design the system for a premium creative/digital agency.

Output expectations:
- Produce implementation-ready architecture, UI structure, routes, entities, components, roles, permissions, screens, flows, analytics events, and roadmap.
- Make the result feel like a world-class internal operating system for a legendary modern agency.
```

## Recommandation finale

Minerva OS doit être construit comme un produit propriétaire premium, pas comme un assemblage de widgets. Le bon choix est de prendre shadcn/ui comme fondation technique complète, puis de créer par-dessus une couche de design et de patterns métier distinctifs pour transformer l’outil en système de marque, d’opérations et de perception client.[cite:26][cite:1][cite:2][cite:3]
