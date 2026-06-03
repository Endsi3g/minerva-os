<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# sortir une roadmap v2.4 → v3.0 avec fonctionnalités classées en Must / Should / Luxury, plus les modules à fusionner, retirer ou simplifier.

Oui — voici une roadmap **v2.4 → v3.0** pensée pour transformer Minerva OS en système plus net, plus rentable, et plus difficile à casser. Je la structure avec MoSCoW parce que ce cadre est adapté aux arbitrages produit et aide à rendre explicites les priorités comme les renoncements.[^1][^2]

## Vision produit

La vision de Minerva OS ne devrait plus être “22 modules dans une plateforme”, mais “le système d’exploitation qui réduit la friction entre vente, delivery, finance et relation client”. Les recommandations roadmap 2026 insistent sur des thèmes limités, reliés à des objectifs, puis séquencés en itérations plutôt qu’en accumulation de fonctionnalités.[^2][^1]

Je te propose 4 thèmes structurants:

- Operating visibility: ce qui bloque, dérape ou ralentit doit être visible vite.[^3][^4]
- Workflow execution: automatiser les transitions sans automatiser les décisions importantes.[^5][^1]
- Trust and governance: permissions, audit, provenance AI, journalisation.[^3]
- Module simplification: moins de surfaces, plus de clarté opérationnelle.[^4][^1]


## Roadmap

### v2.4 — Focus et contrôle

Version à livrer vite, centrée sur la réduction du bruit et la création d’un vrai “command center”. Les dashboards B2B 2026 les plus efficaces montrent des vues par rôle, un KPI primaire clair et de la progressive disclosure plutôt qu’une navigation lourde.[^4][^3]

**Must**

- Home par rôle: Owner, PM, Finance, Client Stakeholder, Designer, Developer.
- Vue “Today” unique: tâches bloquées, approbations en attente, factures à risque, tickets chauds, livrables dus.
- Command bar globale: recherche, navigation, création rapide, switch client/projet.
- Saved views sur tables principales: Projects, Tasks, Billing, Tickets.
- Activity timeline unifiée sur client/projet.
- Score de santé client v1: combine retards, tickets, approbations, impayés, NPS.

**Should**

- Partage d’état par lien filtré pour reporting interne.
- Snapshots exportables d’une vue filtrée.
- Empty states orientés action dans chaque module.
- KPI cards avec “next action” et pas seulement un chiffre.

**Luxury**

- Natural-language search cross-module.
- Résumés AI journaliers par rôle.
- Brief de matin automatique pour Owner/PM.


### v2.5 — Workflow engine

Ici Minerva devient vraiment un OS d’agence. Les guides transformation 2026 recommandent d’automatiser d’abord les processus à fort poids opérationnel, comme approbations, reporting et transitions inter-équipes.[^1]

**Must**

- Workflow builder v1: triggers, conditions, actions, délais.
- Templates: proposal signed, project kickoff, scope change, overdue invoice, approval overdue.
- Checklists obligatoires par type de projet.
- Handoffs structurés Sales → PM → Production → Finance.
- SLA internes sur tickets, approvals et livrables.
- Escalade automatique si deadline ou approbation critique bloquée.

**Should**

- Dépendances inter-modules visibles dans un panneau unique.
- Task packs / project templates par service.
- Champs obligatoires intelligents selon le type de client ou de service.

**Luxury**

- Suggestions AI de workflow à partir des patterns réels.
- Auto-détection de goulots d’étranglement récurrents.


### v2.6 — Finance et rentabilité

Les outils agence 2026 se différencient surtout par la visibilité financière, la précision temps/marge et la transparence client.[^6]

**Must**

- Deal-to-delivery margin tracking: proposal → budget → temps → coûts → facture → marge.
- Budget vs actual par projet et par phase.
- Revenue recognition simple par milestone.
- Alertes de scope creep et rentabilité en baisse.
- Prévisions de cash-in issues des approbations et factures.
- Permissions finance plus granulaires.

**Should**

- Catalogue de services avec marges cibles.
- Templates d’estimation et de retainer.
- Centre de litiges / écarts de facturation.
- Vue portefeuille: top clients par marge, risque, charge.

**Luxury**

- Modèle de pricing recommandé selon historique.
- Simulateur “si on ajoute 20h / si on décale / si on change la team”.


### v2.7 — Client OS

Cette version rend le portail client remarquable. Les recommandations B2B 2026 poussent des vues adaptées au persona, un reporting prêt à partager et des parcours de décision plus courts.[^3][^4]

**Must**

- Dashboard client simplifié par compte: livrables, approbations, échéances, factures, décisions attendues.
- Commentaires et décisions in-context sur livrables, proposals et factures.
- Journal des décisions client.
- Notifications digest configurables.
- Centre documentaire client plus propre avec structure canonique.

**Should**

- Shareable reports client-ready.
- Timeline de collaboration agence/client.
- Statuts normalisés pour éviter les ambiguïtés (“Pending client”, “In production”, “Ready for review”).

**Luxury**

- Client copilot pour retrouver docs, propositions, historiques.
- Résumés exécutifs mensuels générés automatiquement.


### v2.8 — Trust, audit, conformité

Les dashboards augmentés et les systèmes AI de 2026 doivent afficher provenance, timestamp, confiance, et gouvernance d’accès avant de scaler.[^3]

**Must**

- MFA pour rôles sensibles.
- Audit log immuable des actions critiques.
- Provenance AI: source, timestamp, confiance, auteur humain/agent.
- Access review console pour Owner/Admin.
- Export log + data retention policies.
- Soft delete + restore sur entités critiques.

**Should**

- Approval policies configurables par montant, client ou type d’action.
- Session management amélioré.
- Security center dans Settings.

**Luxury**

- Anomaly detection sur accès et exports inhabituels.
- Approval quorum pour opérations très sensibles.


### v2.9 — Intelligence opératoire

À ce stade, l’AI doit agir comme couche d’aide à la décision, pas comme déco. Les tendances 2026 favorisent l’anomaly detection, la traçabilité et l’intégration au CRM/ticketing plutôt qu’un chatbot isolé.[^7][^3]

**Must**

- Risk engine v2: churn, marge, delivery delay, approval lag.
- Weekly executive review auto-généré.
- Insight feed avec explication et provenance.
- Recommandations d’action sur comptes et projets.
- Metric registry: définitions claires des KPI.

**Should**

- Benchmarks internes anonymisés entre types de projets.
- Détection des patterns gagnants/perdants par service.
- Suggestions de next best action pour PM et Owner.

**Luxury**

- Agent ops autonomes à validation humaine.
- Query en langage naturel sur reporting multi-module.


### v3.0 — Minerva OS comme système central

La version 3.0 doit matérialiser un produit plus simple à comprendre malgré plus de puissance. Les meilleures pratiques roadmap rappellent qu’une bonne roadmap montre aussi ce qu’on ne fait pas, pour éviter la dérive.[^2]

**Must**

- Architecture produit recentrée autour de 6 espaces clairs.
- Navigation unifiée web/mobile/desktop.
- Operating review cockpit pour direction.
- Workflow engine stable + analytics d’automations.
- Health scores client/projet/portfolio.
- Reporting stakeholder-ready par rôle.

**Should**

- Marketplace interne de templates, automations, views et playbooks.
- Layer API/public events plus propre pour intégrations.
- Scorecards équipe / charge / delivery quality.

**Luxury**

- Mode multi-agence / multi-brand.
- Forecasting IA plus avancé.
- Knowledge graph agence complet.


## Modules à fusionner

La simplification est critique, car les approches 2026 recommandent d’éliminer les étapes et surfaces qui n’ajoutent pas de valeur claire.[^1]


| Modules actuels | Action | Pourquoi |
| :-- | :-- | :-- |
| Pipeline + Clients + Call Preps | Fusionner partiellement dans **Revenue** | Même continuum commercial, évite trois contextes séparés pour un même compte. [^1][^4] |
| Projects + Tasks + Resource Planning + Time Tracking | Fusionner sous **Delivery** avec sous-vues | Même système d’exécution; aujourd’hui trop fragmenté pour le PM. [^6][^4] |
| Billing + Expenses + Finance | Fusionner en **Finance** | La séparation actuelle peut créer des allers-retours inutiles pour voir la vraie marge. [^6][^1] |
| Approvals + Proposals | Fusionner dans **Approvals \& Decisions** | Même logique de décision, validation, signature, refus, audit. [^1] |
| Knowledge Base + Support/Tickets | Rapprocher dans **Support \& Knowledge** | Les tickets doivent tirer parti de la base de connaissance dans le même contexte. [^7] |
| Services + Fulfillment | Fusionner dans **Operations Catalog** | Les services vendus et les modes d’exécution doivent partager templates, étapes et marges. [^1] |
| NPS + Reports | Intégrer NPS comme signal dans **Insights** | NPS seul comme module est trop étroit; mieux comme source dans une couche d’insight. [^3] |
| Agent Ops + minerva-mcp views | Fusionner dans **Intelligence** | Évite une séparation artificielle entre AI ops, tools et insights. [^7][^3] |

## Modules à retirer ou simplifier

Tu n’as pas forcément besoin de supprimer brutalement des fonctions, mais plusieurs surfaces devraient devenir des vues secondaires et non des modules de premier niveau. Les dashboards 2026 performants réduisent le nombre d’entrées et privilégient des vues par rôle et par décision.[^4][^3]

Je retirerais ou simplifierais ainsi:

- **Call Preps** comme module autonome: devient une vue ou un générateur dans Revenue/Clients.
- **NPS** comme module autonome: devient widget, signal et rapport dans Insights/Health.
- **Reports** comme module fourre-tout: à remplacer par reporting contextuel dans chaque espace + un Executive Review.
- **Files** comme module principal: à conserver, mais surtout comme couche transverse attachée aux clients, projets, factures et approbations.
- **Settings** à scinder visuellement entre Workspace, Security, Billing, AI, Integrations pour éviter une zone trop dense.[^3]
- **Support page** marketing/help séparée dans l’app: garde-la, mais descends-la en surface secondaire.
- **Changelog page** dans l’app: utile, mais secondaire; accessible depuis profil/help, pas comme destination forte.


## Architecture cible

À horizon 3.0, je viserais une navigation principale en 6 espaces maximum. Cela suit la logique de simplification des systèmes denses: moins d’entrées, plus de profondeur contextuelle.[^1][^4]

- **Home** — Today, alerts, role dashboard.
- **Revenue** — Pipeline, Clients, Proposals, Call Prep.
- **Delivery** — Projects, Tasks, Resources, Time, Files.
- **Finance** — Billing, Expenses, Margin, Forecasting.
- **Intelligence** — Reports, Health Scores, Risk, Agent Ops, NPS.
- **Admin** — Settings, Security, Team, Integrations, Audit.


## Règle d’arbitrage

Pour décider si une feature entre en Must, pose trois questions. Une initiative doit aller en Must si elle réduit le temps de décision, protège une opération sensible, ou améliore directement la marge, l’adoption ou la fiabilité.[^2][^1]

Score chaque idée selon:

- impact sur revenu ou marge;
- fréquence d’usage hebdomadaire;
- réduction du risque opérationnel;
- clarté UX apportée;
- dépendances techniques.[^2]

Si tu veux, je peux maintenant te produire la **version ultra concrète en tableau de pilotage**, avec colonnes: Epic, Version, Priority, Owner, KPI cible, dépendances, effort estimé, et “why now”.
<span style="display:none">[^10][^8][^9]</span>

<div align="center">⁂</div>

[^1]: https://iwis.io/en/blog/complete-guide-digital-transformation-2026/

[^2]: https://www.parallelhq.com/blog/how-to-create-product-roadmap

[^3]: https://www.linkedin.com/pulse/saas-dashboard-get-smarter-simpler-more-social-here-5-emerging-y4lac

[^4]: https://www.orbix.studio/blogs/b2b-saas-dashboard-design-examples

[^5]: https://www.klaviyo.com/blog/marketing-automation-trends

[^6]: https://worklenz.com/blog/top-10-agency-management-tools-for-2026/

[^7]: https://ciberspring.com/articles/the-future-of-marketing-operations-trends-to-watch-in-2026-and-beyond/

[^8]: https://www.youtube.com/watch?v=n9xDqrxlWa0

[^9]: https://www.slicktext.com/blog/2026/01/marketing-automation-agencies-top-tools-2026/

[^10]: https://www.productlift.dev/blog/product-roadmap-example/

