"use client";

import { useChatStream } from "@/hooks/useChatStream";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";

export function ChatContainer() {
  const { messages, error, isStreaming, sendMessage, stopStreaming } = useChatStream();

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <header className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <h2 className="text-sm font-semibold text-gray-700">
          Vibe Streamer Chat
        </h2>
      </header>

      <ChatMessages messages={messages} />

      {error && (
        <div className="mx-4 mb-2 rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-700">
          {error}
        </div>
      )}

      <ChatInput onSubmit={sendMessage} onStop={stopStreaming} disabled={isStreaming} />
    </div>
  );
}
