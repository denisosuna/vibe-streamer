"use client";

import { FormEvent, useState } from "react";

interface ChatInputProps {
  onSubmit: (prompt: string) => void;
  onStop: () => void;
  disabled: boolean;
}

export function ChatInput({ onSubmit, onStop, disabled }: ChatInputProps) {
  const [input, setInput] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || disabled) return;
    onSubmit(trimmed);
    setInput("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-gray-200 p-4 flex gap-3"
    >
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type your message..."
        disabled={disabled}
        className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm
                   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                   disabled:opacity-50 disabled:cursor-not-allowed"
      />
      <button
        type="submit"
        disabled={disabled || !input.trim()}
        className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white
                   hover:bg-blue-700 transition-colors
                   disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Send
      </button>
      {disabled && (
        <button
          type="button"
          onClick={onStop}
          className="rounded-lg bg-red-500 px-5 py-2.5 text-sm font-medium text-white
                     hover:bg-red-600 transition-colors"
        >
          Stop
        </button>
      )}
    </form>
  );
}
