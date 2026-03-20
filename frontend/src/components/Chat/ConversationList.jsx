import { Trash2, MessageSquare } from "lucide-react";

export default function ConversationList({
  conversations,
  currentConversation,
  onSelectConversation,
  onDeleteConversation,
}) {
  return (
    <div className="flex-1 overflow-y-auto">
      {conversations.length === 0 ? (
        <div className="p-4 text-center text-slate-400 text-sm">
          No conversations yet. Start a new chat!
        </div>
      ) : (
        <div className="space-y-1 p-2">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`p-3 rounded-lg cursor-pointer transition group ${
                currentConversation?.id === conversation.id
                  ? "bg-brand-500/20 border border-brand-500/50"
                  : "hover:bg-slate-800 border border-transparent"
              }`}
              onClick={() => onSelectConversation(conversation)}
            >
              <div className="flex items-start gap-2">
                <MessageSquare className="w-4 h-4 flex-shrink-0 mt-0.5 text-brand-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {conversation.title || "Untitled"}
                  </p>
                  {conversation.lastMessage && (
                    <p className="text-xs text-slate-400 truncate mt-1">
                      {conversation.lastMessage}
                    </p>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteConversation(conversation.id);
                  }}
                  className="flex-shrink-0 p-1 rounded hover:bg-red-500/20 text-slate-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
