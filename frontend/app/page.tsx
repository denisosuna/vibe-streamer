import { ChatContainer } from "@/components/chat/ChatContainer";

export default function Home() {
  return (
    <main className="flex-1 flex items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-2xl h-[85vh]">
        <ChatContainer />
      </div>
    </main>
  );
}
