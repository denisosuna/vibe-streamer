"use client";

import { useCallback, useRef, useState } from "react";
import { ChatMessage, StreamStatus } from "@/types/chat";
import { sendChatMessage } from "@/lib/api/chat";

function createMessage(
  role: ChatMessage["role"],
  content: string,
  isStreaming = false
): ChatMessage {
  return { id: crypto.randomUUID(), role, content, isStreaming };
}

export function useChatStream() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<StreamStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const appendToLastAssistant = useCallback((chunk: string) => {
    setMessages((prev) => {
      const updated = [...prev];
      const last = updated[updated.length - 1];
      if (last?.role === "assistant") {
        updated[updated.length - 1] = {
          ...last,
          content: last.content + chunk,
        };
      }
      return updated;
    });
  }, []);

  const finalizeLastAssistant = useCallback(() => {
    setMessages((prev) => {
      const updated = [...prev];
      const last = updated[updated.length - 1];
      if (last?.role === "assistant") {
        updated[updated.length - 1] = { ...last, isStreaming: false };
      }
      return updated;
    });
  }, []);

  const sendMessage = useCallback(
    async (prompt: string) => {
      const trimmed = prompt.trim();
      if (!trimmed || status === "streaming") return;

      setError(null);
      setStatus("streaming");

      const controller = new AbortController();
      abortRef.current = controller;

      const userMessage = createMessage("user", trimmed);
      const assistantMessage = createMessage("assistant", "", true);

      setMessages((prev) => [...prev, userMessage, assistantMessage]);

      await sendChatMessage(trimmed, {
        onChunk: (text) => appendToLastAssistant(text),
        onDone: () => {
          finalizeLastAssistant();
          setStatus("idle");
          abortRef.current = null;
        },
        onError: (errorMsg) => {
          finalizeLastAssistant();
          setError(errorMsg);
          setStatus("error");
          abortRef.current = null;
        },
        signal: controller.signal,
      });
    },
    [status, appendToLastAssistant, finalizeLastAssistant]
  );

  const isStreaming = status === "streaming";

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  return { messages, status, error, isStreaming, sendMessage, stopStreaming } as const;
}
