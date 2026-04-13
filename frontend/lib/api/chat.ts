import { ChatRequest } from "@/types/chat";
import { parseSSEChunk } from "@/lib/stream/sse-parser";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function extractErrorDetail(response: Response): Promise<string> {
  const fallback = `Server error (${response.status})`;
  try {
    const body = await response.json();
    if (!body.detail) return fallback;
    return Array.isArray(body.detail)
      ? body.detail.map((d: { msg: string }) => d.msg).join(", ")
      : String(body.detail);
  } catch {
    return response.statusText || fallback;
  }
}

interface StreamCallbacks {
  onChunk: (text: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
  signal?: AbortSignal;
}

export async function sendChatMessage(
  prompt: string,
  { onChunk, onDone, onError, signal }: StreamCallbacks
): Promise<void> {
  const body: ChatRequest = { prompt };

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      onDone();
      return;
    }
    onError("Network error: could not reach the server.");
    return;
  }

  if (!response.ok) {
    const detail = await extractErrorDetail(response);
    onError(detail);
    return;
  }

  if (!response.body) {
    onError("Response body is empty.");
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let remainder = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const raw = remainder + decoder.decode(value, { stream: true });
      const parsed = parseSSEChunk(raw);

      remainder = parsed.remainder;

      for (const event of parsed.events) {
        onChunk(event);
      }
    }
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      onDone();
      return;
    }
    onError("Stream interrupted unexpectedly.");
    return;
  }

  onDone();
}
