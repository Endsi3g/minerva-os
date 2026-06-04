# Guide d'Utilisation du Coffre pour les Agents IA

Ce document définit les standards d'organisation et d'interaction pour les agents d'intelligence artificielle (Claude Code, Gemini CLI, Cursor, etc.) afin de naviguer rapidement dans le coffre Obsidian de Minerva OS tout en réduisant drastiquement l'usage de tokens.

---

## ⚡ Stratégies d'Économie de Tokens & Vitesse

Pour minimiser la consommation de tokens de contexte et accélérer vos réponses, appliquez rigoureusement les règles suivantes :

### 1. Lecture ciblée du Frontmatter (YAML)
Chaque note possède un en-tête de métadonnées (YAML Frontmatter) délimité par `---`.
- **Règle :** Ne lisez pas l'intégralité d'un gros fichier dès le départ. Utilisez une lecture partielle (par exemple, les 15 premières lignes) pour inspecter uniquement le frontmatter et vérifier si la note correspond à votre recherche.

### 2. Exclusion de l'Archive
Le dossier `50_Archive/` et le sous-dossier `00_Meta/Attachments/` sont exclus de la recherche globale dans `.obsidian/app.json`.
- **Règle :** N'effectuez jamais de recherche de type `grep` ou de parcours de fichiers dans `50_Archive/` sauf si l'utilisateur vous le demande explicitement.

### 3. Navigation via l'Index (MOC)
Au lieu de lister récursivement tous les dossiers du coffre (ce qui consomme des tokens et du temps de calcul) :
- **Règle :** Lisez d'abord le fichier [[Index]] à la racine pour cibler le bon sous-dossier ou la note recherchée.

---

## 📝 Format Standard d'une Note (YAML Frontmatter)

Toute nouvelle note créée ou éditée par un agent doit respecter l'en-tête YAML suivant :

```yaml
---
title: "Nom de la Note"
description: "Résumé succinct en une seule phrase du contenu."
status: "draft | review | approved"
tags: [status/draft, type/spec]
last_updated: 2026-06-04
---
```

### Propriétés obligatoires :
- `title` : Titre exact de la note.
- `description` : Un résumé court et clair (max 150 caractères). Utile pour que l'IA puisse le scanner via des outils de recherche de ligne rapide.
- `status` : Progression de la note (`draft`, `review`, ou `approved`).
- `tags` : Indique l'état (`status/*`) et la catégorie (`type/*`).
- `last_updated` : Date de la dernière modification au format `AAAA-MM-JJ`.

---

## 🔗 Philosophie "Link-First" et Syntaxe des Liens

Pour faciliter l'analyse sémantique et la découverte de documents liés :
- **Utilisez les liens Obsidian standard :** Privilégiez les liens Wiki-links `[[Nom de la note]]` au lieu des liens Markdown complexes, car ils sont plus courts de quelques caractères et optimisent le graphe de connaissances.
- **Chemin le plus court :** Le fichier `.obsidian/app.json` est configuré pour résoudre les liens avec le chemin le plus court. Utilisez simplement `[[Nom de la Note]]` au lieu de `[[20_Features/Nom de la Note]]`.
- **Mise en relation :** Lorsque vous créez ou modifiez une note, liez-la toujours à l'[[Index]] ou à une note parente existante afin de maintenir l'arbre de connaissances connecté et d'éviter les "notes orphelines".

---

## 📂 Organisation des Dossiers

| Dossier | Contenu principal | Règle d'accès IA |
| :--- | :--- | :--- |
| `00_Meta/` | Fichiers systèmes, modèles, consignes. | Lecture seule des guides, copier les templates pour de nouvelles notes. |
| `10_Core/` | Architecture, documents conceptuels généraux. | Lecture prioritaire pour comprendre le socle technique. |
| `20_Features/` | Spécifications des modules Minerva OS. | Modification/Création fréquente lors du développement de features. |
| `30_Processes/` | Standards de dev et workflows de l'équipe. | Lecture pour respecter les patterns de code. |
| `40_Resources/` | Références d'APIs, modèles de données tiers. | Lecture pour consultation technique. |
| `50_Archive/` | Anciens fichiers obsolètes ou brouillons. | **Ignorer par défaut.** |
