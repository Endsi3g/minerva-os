import { useState, useCallback } from 'react';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function useHermes(workspaceContext?: string) {
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
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages,
          context: workspaceContext,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to connect to Hermes');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error('No reader available');

      // Append an empty assistant message to update with stream
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      let assistantContent = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        assistantContent += chunk;

        setMessages(prev => {
          const updated = [...prev];
          if (updated.length > 0 && updated[updated.length - 1].role === 'assistant') {
            updated[updated.length - 1] = { role: 'assistant', content: assistantContent };
          }
          return updated;
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [messages, workspaceContext]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, isLoading, error, sendMessage, clearMessages };
}
