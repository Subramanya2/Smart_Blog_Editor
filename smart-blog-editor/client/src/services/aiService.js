/**
 * Streams autocomplete completions from the backend SSE endpoint.
 *
 * @param {string} text Input context text
 * @param {AbortSignal} signal AbortController signal
 * @param {function(string): void} onChunk Callback fired when a new text chunk arrives
 */
export async function streamAutocomplete(text, signal, onChunk) {
  if (!text || !text.trim()) return;

  const host = window.location.hostname || 'localhost';
  const protocol = window.location.protocol;
  const apiUrl = `${protocol}//${host}:8000/api/autocomplete`;

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
    signal,
  });

  if (!response.ok || !response.body) return;

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let accumulatedGhostText = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    if (signal.aborted) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const rawJson = line.slice(6).trim();
          if (rawJson) {
            const textChunk = JSON.parse(rawJson);
            accumulatedGhostText += textChunk;
          }
        } catch (e) {
          // Ignore incomplete JSON chunks
        }
      }
    }

    if (accumulatedGhostText && !signal.aborted) {
      onChunk(accumulatedGhostText);
    }
  }
}
