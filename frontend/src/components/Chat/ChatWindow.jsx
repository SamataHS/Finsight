import { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";
import { Loader } from "lucide-react";

export default function ChatWindow({ messages, loading }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      {messages.length === 0 ? (
        <div className="h-full flex items-center justify-center text-center">
          <div>
            <div className="text-4xl mb-4">💬</div>
            <h2 className="text-2xl font-bold text-slate-200 mb-2">Start a Conversation</h2>
            <p className="text-slate-400">
              Ask me anything about your finances!
              <br />
              Example: "Why is my saving low?" or "How can I reduce my food spending?"
            </p>
          </div>
        </div>
      ) : (
        <>
          {messages.map((message, index) => (
            <MessageBubble key={index} message={message} />
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-slate-400">
              <Loader className="w-4 h-4 animate-spin" />
              <span>Thinking...</span>
            </div>
          )}
          <div ref={endRef} />
        </>
      )}
    </div>
  );
}
