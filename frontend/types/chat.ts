export type ChatRole = "user" | "assistant";

export type StreamStatus = "idle" | "streaming" | "error";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  isStreaming?: boolean;
}

export interface ChatRequest {
  prompt: string;
}
