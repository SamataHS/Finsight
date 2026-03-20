import ReactMarkdown from "react-markdown";
import { Sparkles } from "lucide-react";

export default function MessageBubble({ message }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-md px-4 py-3 rounded-lg ${
          isUser
            ? "bg-brand-500/20 border border-brand-500/50 text-white"
            : "bg-slate-800 border border-slate-700 text-slate-200"
        }`}
      >
        {/* Message content */}
        <div className="prose prose-invert max-w-none text-sm">
          <ReactMarkdown
            components={{
              p: ({ node, ...props }) => <p className="mb-2" {...props} />,
              strong: ({ node, ...props }) => <strong className="font-semibold text-white" {...props} />,
              em: ({ node, ...props }) => <em className="italic" {...props} />,
              ul: ({ node, ordered, depth, ...props }) => <ul className="list-disc list-inside mb-2" {...props} />,
              ol: ({ node, ordered, depth, ...props }) => <ol className="list-decimal list-inside mb-2" {...props} />,
              li: ({ node, index, ordered, checked, ...props }) => <li className="mb-1" {...props} />,
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>

        {/* Insights (for AI messages) */}
        {!isUser && message.insights && message.insights.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-700 space-y-2">
            {message.insights.map((insight, idx) => (
              <div key={idx} className="flex gap-2 text-xs text-slate-300">
                <Sparkles className="w-3 h-3 flex-shrink-0 text-brand-400 mt-0.5" />
                <span>{insight}</span>
              </div>
            ))}
          </div>
        )}

        {/* Timestamp */}
        <div className={`text-xs mt-2 ${isUser ? "text-brand-300" : "text-slate-400"}`}>
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </div>
  );
}
