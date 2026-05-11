# AGENTS.md — AI Collaboration Guide

This document describes how AI coding agents (Claude Code, Gemini CLI, Cursor, etc.) should work within the Minerva OS codebase. Read CLAUDE.md for the full project brief and design system rules.

---

## Key Constraints

1. **TypeScript strict mode** — `noUnusedLocals` and `noUnusedParameters` are enabled. Every variable and import must be used. Run `npx tsc --noEmit` before considering a task done.
2. **No new npm packages** unless explicitly approved. All necessary Radix UI primitives and utilities are already installed.
3. **No PostCSS / no `tailwind.config.js`** — Tailwind v4 runs via `@tailwindcss/vite`. Do not add config files for it.
4. **i18n always** — all user-visible strings go through `useLang()` / `t.*`. Never hardcode UI copy in JSX.
5. **No em dashes (`—`)** in UI copy. Use commas, periods, or a middle dot (`·`).
6. **No `overflow-hidden` + `maxHeight` for animated panels** — use `translateY` slide via Framer Motion instead.

---

## Design System Rules (non-negotiable)

- **Backgrounds:** obsidian `#0A0D14` (page), midnight `#111522` (cards/inputs), dusk `#171C2A` (elevated)
- **Text:** ivory `#F5F1E8` (primary), silver `#B8BDC7` (secondary), fog `#8A9099` (meta)
- **Accent:** sage `#7FA38A` (success/active), warm `#B89B6A` (warning), ember `#A86A6A` (error)
- **Typography:** Playfair Display for display headings only; Inter for all UI body text
- **Motion:** slow and atmospheric — 0.4–0.9s duration, `cubic-bezier(0.22, 1, 0.36, 1)` easing. No bouncy springs.
- **Borders:** `rgba(255,255,255,0.06–0.12)` for card edges; never pure white or black borders.
- **Buttons:** primary = ivory bg + obsidian text + rounded-full; ghost = silver text + subtle border; no neon glows.

---

## Development Patterns

### Pages

All app pages live in `src/pages/app/`. They receive no props — they read from local state seeded from `src/lib/mock-data.ts`. There is no backend yet.

Page pattern:
```tsx
export default function PageName() {
  const [items, setItems] = useState<ItemType[]>(MOCK_ITEMS);
  // ...
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-ivory">Page Title</h1>
        <Button size="sm" onClick={...}><Plus size={14} /> Add item</Button>
      </div>
      {/* content */}
    </>
  );
}
```

### Adding a new page

1. Create `src/pages/app/NewPage.tsx`
2. Add route in `src/App.tsx` under the `AppShell` element
3. Add nav item in `src/components/layout/AppSidebar.tsx` (icon + label)
4. Add breadcrumb label in `src/components/layout/AppHeader.tsx` (`PAGE_LABELS` map)
5. Add i18n key in `src/i18n.tsx` if the page has copy
6. Add mock data in `src/lib/mock-data.ts` and types in `src/lib/types.ts`

### Adding a UI component

All shadcn/ui components live in `src/components/ui/`. They use the Minerva CSS variable bridge from `src/index.css`. Install any new Radix primitives via npm, then write the component manually (the shadcn CLI is blocked on this machine due to a Windows symlink issue).

### Sheets (slide-over forms)

Use the `Sheet` component from `src/components/ui/sheet.tsx`. Pattern:
```tsx
<Sheet open={open} onOpenChange={setOpen}>
  <SheetContent side="right" className="w-96 p-6 flex flex-col gap-6">
    <SheetHeader><SheetTitle>Title</SheetTitle></SheetHeader>
    <div className="flex flex-col gap-4 flex-1">
      {/* form fields */}
    </div>
    <Button className="w-full" onClick={handleSubmit}>Submit</Button>
  </SheetContent>
</Sheet>
```

---

## Testing

There are no automated tests yet. Type checking is the primary correctness gate:

```bash
npx tsc --noEmit
```

For UI work: run `npm run dev` and manually verify the golden path and edge cases in the browser.

---

## File Hygiene

- Do not create documentation files (*.md) without explicit user request.
- Do not create helper files, abstraction layers, or utilities for single-use operations.
- Do not add comments to code that was not changed.
- Do not add error handling for impossible cases.
- Prefer editing existing files over creating new ones.

---

## Commit Convention

Messages in English, imperative mood, concise. Examples:
- `add Projects page with progress bars and budget tracking`
- `fix TypeScript error in i18n.tsx — remove as const`
- `refine Landing hero — stronger glassmorphism and CTA glow`
