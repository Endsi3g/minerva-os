/** Centralised status pill styles — bg-{color} text-{color} border-{color} */
export const STATUS_STYLES: Record<string, string> = {
  active:      'bg-emerald-50 text-emerald-700 border-emerald-200',
  completed:   'bg-gray-100   text-gray-600   border-gray-200',
  in_review:   'bg-blue-50    text-blue-700   border-blue-200',
  on_hold:     'bg-amber-50   text-amber-700  border-amber-200',
  pending:     'bg-amber-50   text-amber-700  border-amber-200',
  approved:    'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected:    'bg-red-50     text-red-700    border-red-200',
  overdue:     'bg-red-50     text-red-700    border-red-200',
  paid:        'bg-emerald-50 text-emerald-700 border-emerald-200',
  draft:       'bg-blue-50    text-blue-700   border-blue-200',
  sent:        'bg-indigo-50  text-indigo-700 border-indigo-200',
  signed:      'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled:   'bg-gray-100   text-gray-500   border-gray-200',
  inactive:    'bg-gray-100   text-gray-500   border-gray-200',
  at_risk:     'bg-red-50     text-red-700    border-red-200',
  healthy:     'bg-emerald-50 text-emerald-700 border-emerald-200',
} as const;

/** Dark mode variants (used inside .dark context) */
export const STATUS_STYLES_DARK: Record<string, string> = {
  active:      'dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800',
  completed:   'dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700',
  pending:     'dark:bg-amber-950   dark:text-amber-300   dark:border-amber-800',
  overdue:     'dark:bg-red-950     dark:text-red-300     dark:border-red-800',
  draft:       'dark:bg-blue-950    dark:text-blue-300    dark:border-blue-800',
} as const;

/** Combine light + dark for a given status key */
export function statusClass(key: string): string {
  const light = STATUS_STYLES[key] ?? STATUS_STYLES.pending;
  const dark  = STATUS_STYLES_DARK[key] ?? '';
  return `${light} ${dark} border text-xs font-medium px-2 py-0.5 rounded-full`;
}
