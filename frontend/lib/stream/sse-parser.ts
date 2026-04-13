const DONE_SIGNAL = "[DONE]";

interface ParseResult {
  events: string[];
  remainder: string;
}

/**
 * Parses raw SSE text into discrete events, handling partial chunks.
 *
 * SSE format expected: "data: <text>\n\n"
 * Returns parsed event payloads and any leftover partial data
 * that should be prepended to the next chunk.
 */
export function parseSSEChunk(raw: string): ParseResult {
  const events: string[] = [];
  const lines = raw.split("\n");

  let remainder = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line === "") continue;

    if (!line.startsWith("data: ")) {
      // Incomplete line — could be a partial chunk from the next read
      if (i === lines.length - 1 && !raw.endsWith("\n")) {
        remainder = lines[i];
      }
      continue;
    }

    const payload = line.slice("data: ".length);

    if (payload === DONE_SIGNAL) continue;

    try {
      events.push(JSON.parse(payload));
    } catch {
      events.push(payload);
    }
  }

  return { events, remainder };
}
