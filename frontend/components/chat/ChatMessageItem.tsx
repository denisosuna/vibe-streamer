import { memo } from "react";
import Markdown from "react-markdown";
import { ChatMessage } from "@/types/chat";

interface ChatMessageItemProps {
  message: ChatMessage;
}

function ChatMessageItemRaw({ message }: ChatMessageItemProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "bg-blue-600 text-white rounded-br-md whitespace-pre-wrap"
            : "bg-gray-100 text-gray-900 rounded-bl-md prose prose-sm prose-gray"
        }`}
      >
        {isUser ? (
          message.content || "\u00A0"
        ) : (
          <>
            {message.content ? (
              <Markdown>{message.content}</Markdown>
            ) : (
              "\u00A0"
            )}
          </>
        )}
        {message.isStreaming && (
          <span className="inline-block w-1.5 h-4 ml-0.5 align-text-bottom bg-gray-400 animate-pulse rounded-sm" />
        )}
      </div>
    </div>
  );
}

export const ChatMessageItem = memo(ChatMessageItemRaw);
