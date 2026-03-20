import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";
import toast from "react-hot-toast";
import { Send, Plus, Trash2, Search } from "lucide-react";
import ChatWindow from "../components/Chat/ChatWindow";
import ConversationList from "../components/Chat/ConversationList";

export default function Chat() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedConversations, setSelectedConversations] = useState([]);
  const messagesEndRef = useRef(null);

  // Fetch conversations
  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const { data } = await api.get("/chat/conversations");
      setConversations(data || []);
    } catch (err) {
      console.error("Failed to fetch conversations:", err);
    }
  };

  // Load conversation history when selected
  useEffect(() => {
    if (currentConversation) {
      loadConversation(currentConversation.id);
    }
  }, [currentConversation]);

  const loadConversation = async (conversationId) => {
    try {
      const { data } = await api.get(`/chat/history/${conversationId}`);
      setMessages(data.messages);
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch (err) {
      toast.error("Failed to load conversation");
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input;
    setInput("");

    try {
      setLoading(true);
      console.log("Sending message:", userMessage);

      const response = await api.post("/chat/message", {
        message: userMessage,
        conversationId: currentConversation?.id || "new",
      });

      console.log("Response received:", response.data);

      // Update current conversation if new
      if (!currentConversation) {
        const newConvId = response.data.conversationId;
        const newConv = {
          id: newConvId,
          title: userMessage.substring(0, 50),
          createdAt: new Date(),
          updatedAt: new Date(),
          messageCount: 2, // user + assistant
          lastMessage: response.data.reply,
        };

        setCurrentConversation(newConv);
        // Add new conversation to list immediately
        setConversations([newConv, ...conversations]);
      }

      // Add messages to display
      const newMessages = [
        ...messages,
        {
          role: "user",
          content: userMessage,
          timestamp: new Date(),
        },
        {
          role: "assistant",
          content: response.data.reply || "I couldn't generate a response.",
          timestamp: new Date(),
          insights: response.data.insights || [],
        },
      ];

      console.log("Updated messages:", newMessages);
      setMessages(newMessages);

      // Refresh conversations list in background
      setTimeout(() => fetchConversations(), 500);
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      toast.success("Message sent!");
    } catch (err) {
      console.error("Chat error:", err);
      const errorMsg = err?.response?.data?.error || err?.message || "Failed to send message";
      toast.error(errorMsg);
      setInput(userMessage); // Restore input on error
    } finally {
      setLoading(false);
    }
  };

  const handleNewConversation = () => {
    setCurrentConversation(null);
    setMessages([]);
  };

  const handleDeleteConversation = async (conversationId) => {
    if (!confirm("Delete this conversation?")) return;

    try {
      await api.delete(`/chat/${conversationId}`);
      toast.success("Conversation deleted");
      if (currentConversation?.id === conversationId) {
        handleNewConversation();
      }
      fetchConversations();
    } catch (err) {
      toast.error("Failed to delete conversation");
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      fetchConversations();
      return;
    }

    try {
      const { data } = await api.get(`/chat/search?q=${encodeURIComponent(searchQuery)}`);
      setSelectedConversations(data);
    } catch (err) {
      toast.error("Search failed");
    }
  };

  const displayConversations = selectedConversations.length > 0 ? selectedConversations : conversations;

  return (
    <div className="flex h-screen bg-slate-900">
      {/* Sidebar */}
      <div className="w-80 flex flex-col border-r border-slate-800">
        {/* Header */}
        <div className="p-4 border-b border-slate-800">
          <button
            onClick={handleNewConversation}
            className="w-full flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-500/20 hover:bg-brand-500/30 text-brand-400 font-medium transition"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </button>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="p-3 border-b border-slate-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:border-brand-500"
            />
          </div>
        </form>

        {/* Conversations List */}
        <ConversationList
          conversations={displayConversations}
          currentConversation={currentConversation}
          onSelectConversation={setCurrentConversation}
          onDeleteConversation={handleDeleteConversation}
        />
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Window */}
        <ChatWindow messages={messages} loading={loading} />

        {/* Message Input */}
        <form
          onSubmit={handleSendMessage}
          className="flex-none p-4 border-t border-slate-800 bg-slate-800/50"
        >
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your finances..."
              disabled={loading}
              className="flex-1 px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-brand-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-4 py-3 rounded-lg bg-brand-500 hover:bg-brand-600 text-white font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
