import { useState, useCallback } from 'react';

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export function useHermes() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    setIsLoading(true);
    setError(null);

    const newUserMessage: Message = { role: 'user', content };
    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);

    try {
      const hermesUrl = process.env.NEXT_PUBLIC_HERMES_URL;
      if (!hermesUrl) {
        setError('AI chat not configured. Set NEXT_PUBLIC_HERMES_URL to enable.');
        setIsLoading(false);
        return;
      }
      const response = await fetch(`${hermesUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Note: In a real production app, the key should be handled securely.
          // For local development with Hermes, we use the server key if required.
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_HERMES_API_KEY || 'default_key'}`,
        },
        body: JSON.stringify({
          model: 'hermes-agent',
          messages: updatedMessages,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to connect to Hermes API');
      }

      const data = await response.json();
      const assistantMessage: Message = data.choices[0].message;
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Hermes Error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
  };
}
