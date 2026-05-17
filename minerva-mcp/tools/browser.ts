import {
  navigateTo,
  takeScreenshot,
  clickElement,
  fillField,
  getPageContent,
} from '../browser-session.js';

export const browserTools = [
  {
    name: 'navigate_to',
    description: 'Navigate the Minerva OS app to a specific page. Use paths like /app/dashboard, /app/pipeline, /app/clients, etc.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        path: { type: 'string', description: 'App path to navigate to (e.g. /app/dashboard)' },
      },
      required: ['path'],
    },
    async handler(args: Record<string, unknown>) {
      const url = await navigateTo(args.path as string);
      const content = await getPageContent();
      return { navigatedTo: url, title: content.title, preview: content.text.slice(0, 500) };
    },
  },
  {
    name: 'take_screenshot',
    description: 'Take a screenshot of the current Minerva OS page. Returns a base64 PNG image.',
    inputSchema: { type: 'object' as const, properties: {}, required: [] },
    async handler(_args: Record<string, unknown>) {
      const base64 = await takeScreenshot();
      return { screenshot: base64, mimeType: 'image/png' };
    },
  },
  {
    name: 'click_element',
    description: 'Click an element on the current page by CSS selector or visible text.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        selector: { type: 'string', description: 'CSS selector or text locator (e.g. "button:has-text(\'Add Client\')")' },
      },
      required: ['selector'],
    },
    async handler(args: Record<string, unknown>) {
      await clickElement(args.selector as string);
      const content = await getPageContent();
      return { clicked: args.selector, currentPage: content.url };
    },
  },
  {
    name: 'fill_form',
    description: 'Fill a form field on the current page.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        selector: { type: 'string', description: 'CSS selector for the input field' },
        value: { type: 'string', description: 'Value to fill in' },
      },
      required: ['selector', 'value'],
    },
    async handler(args: Record<string, unknown>) {
      await fillField(args.selector as string, args.value as string);
      return { filled: args.selector, value: args.value };
    },
  },
  {
    name: 'get_page_content',
    description: 'Get the current page URL, title, and visible text content.',
    inputSchema: { type: 'object' as const, properties: {}, required: [] },
    async handler(_args: Record<string, unknown>) {
      return await getPageContent();
    },
  },
];
