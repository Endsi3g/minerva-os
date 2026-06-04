---
title: "Architecture Technique"
description: "Description de la stack technique de Minerva OS : React, Vite, TypeScript et Convex."
status: "draft"
tags: [status/draft, type/concept]
last_updated: 2026-06-04
---

# Architecture Technique

## 🎯 Objectif
Documenter la stack technique, les flux de données et l'infrastructure de Minerva OS.

## 📋 Contexte
La stack de Minerva OS est moderne, modulaire et optimisée pour la réactivité en temps réel :
- **Frontend** : React 18+, Vite, TypeScript en mode strict, Framer Motion, et Tailwind CSS v4 via `@tailwindcss/vite`.
- **Backend/Base de données** : Convex pour les fonctions réactives en temps réel et Supabase pour la persistance relationnelle et les migrations SQL.
- **i18n** : Traduction intégrale via le système `useLang` (voir [[Conventions_Code]]).

## 🔗 Références & Liens connexes
- [[Index]] · Index général.
- [[Vision_Produit]] · Vision produit.
- [[Conventions_Code]] · Normes de codage et d'hygiène de fichiers.

## ⚡ Supabase Realtime Sync

Les données opérationnelles de Minerva OS sont synchronisées en temps réel via Supabase Realtime :
- **Publication** : La publication `supabase_realtime` regroupe les tables clés (`clients`, `projects`, `tasks`, `deals`, `invoices`, `retainers`, `finances`, `approvals`, `activity`, `workflows`, `workflow_runs`, `handoffs`, `notifications`, `agents`, `agent_api_keys`).
- **Replica Identity** : L'identité de réplication est définie sur `FULL` pour toutes ces tables afin d'assurer que l'intégralité des charges utiles (payloads) soit transmise lors des mises à jour en temps réel.
- **Front-end integration** : Le hook client `useSupabase` s'abonne dynamiquement aux canaux correspondants pour mettre à jour l'état local dès qu'une modification survient dans la base de données.

## 🤖 Agent Builder & Clés d'API

L'architecture des agents IA autonomes repose sur un découpage clair :
- **useAgents Hook** : Gère le cycle de vie des agents et des clés d'API correspondantes en persistant les données sur Supabase avec un repli (fallback) transparent vers le localStorage si la base distante est inaccessible.
- **Table `agent_api_keys`** : Stocke de manière sécurisée les clés d'API personnalisées des fournisseurs (OpenAI, Anthropic).
- **Contrôle d'accès (Plan Tier Locks)** : L'ajout de clés d'API personnalisées est soumis aux règles de tarification de Minerva OS. Seuls les espaces de travail souscrits aux forfaits **Growth** et **Scale (Advanced)** peuvent enregistrer des clés d'API personnalisées, tandis que le forfait **Starter (Free)** est verrouillé avec une incitation à la mise à niveau.
