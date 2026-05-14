/**
 * Mautic API Client Utility
 * Handles contact synchronization and event tracking.
 */

const MAUTIC_BASE_URL = process.env.NEXT_PUBLIC_MAUTIC_URL || 'https://mautic.yourdomain.com';
const MAUTIC_PUBLIC_KEY = process.env.MAUTIC_PUBLIC_KEY;
const MAUTIC_SECRET_KEY = process.env.MAUTIC_SECRET_KEY;

interface MauticContact {
  email: string;
  firstname?: string;
  lastname?: string;
  tags?: string[];
}

export const mautic = {
  /**
   * Syncs a contact to Mautic.
   * In a real production app, this would use OAuth2 or Basic Auth.
   */
  async syncContact(contact: MauticContact) {
    if (!MAUTIC_PUBLIC_KEY || !MAUTIC_SECRET_KEY) {
      console.warn('Mautic API credentials not configured. Skipping sync.');
      return null;
    }

    try {
      const response = await fetch(`${MAUTIC_BASE_URL}/api/contacts/new`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${Buffer.from(`${MAUTIC_PUBLIC_KEY}:${MAUTIC_SECRET_KEY}`).toString('base64')}`,
        },
        body: JSON.stringify(contact),
      });

      if (!response.ok) {
        throw new Error(`Mautic API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to sync contact to Mautic:', error);
      return null;
    }
  },

  /**
   * Identifies a user for tracking purposes.
   */
  identify(email: string) {
    if (typeof window !== 'undefined' && (window as any).mt) {
      (window as any).mt('send', 'pageview', { email });
    }
  }
};
