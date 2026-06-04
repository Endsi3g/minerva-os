---
title: "Conventions de Code & Standards"
description: "Règles strictes et non-négociables de développement sur le projet Minerva OS."
status: "approved"
tags: [status/approved, type/process]
last_updated: 2026-06-04
---

# Conventions de Code & Standards (Minerva OS)

Ces conventions sont strictes et doivent être suivies sans exception par les humains et les agents IA travaillant sur le codebase.

---

## 🛠️ Règles Techniques

### 1. TypeScript Strict
- Les options `noUnusedLocals` et `noUnusedParameters` sont activées.
- **Règle :** Chaque variable et import déclaré doit être utilisé. Lancez `npx tsc --noEmit` à la racine avant de considérer une tâche comme terminée.

### 2. Pas de PostCSS / Pas de `tailwind.config.js`
- Le projet utilise Tailwind CSS v4 via le plugin Vite `@tailwindcss/vite`.
- **Règle :** N'ajoutez aucun fichier de configuration Tailwind ou PostCSS à la racine.

### 3. Gestion de l'i18n (Internationalisation)
- **Règle :** Toutes les chaînes de caractères visibles par l'utilisateur doivent passer par `useLang()` et le dictionnaire `t.*`. Ne jamais coder de texte brut en JSX.

### 4. Style et Typographie UI
- **Règle :** Aucun tiret cadratin (`—`) dans l'interface utilisateur. Utilisez des virgules, des points, ou un point médian (`·`).
- **Typographie :** *Playfair Display* uniquement pour les titres d'affichage (headings); *Inter* pour tout le reste du texte de l'interface utilisateur.

---

## 🎨 Charte Graphique & Design System

- **Backgrounds** : obsidian `#0A0D14` (page), midnight `#111522` (cartes/inputs), dusk `#171C2A` (éléments élevés).
- **Text** : ivory `#F5F1E8` (titres/primaire), silver `#B8BDC7` (secondaire), fog `#8A9099` (métadonnées).
- **Accents** : sage `#7FA38A` (succès/actif), warm `#B89B6A` (avertissement), ember `#A86A6A` (erreur).
- **Transitions** : lentes et atmosphériques — durée 0.4s à 0.9s, easing `cubic-bezier(0.22, 1, 0.36, 1)`. Pas d'effet ressort ("bouncy springs").
- **Bordures** : `rgba(255,255,255,0.06)` à `rgba(255,255,255,0.12)`. Jamais de bordures blanches ou noires pures.

---

## 🔗 Références & Liens connexes
- [[Index]] · Index général.
- [[Architecture_Technique]] · Architecture globale.
