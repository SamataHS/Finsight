import { Router } from "express";
import { z } from "zod";
import { authMiddleware } from "../middleware/auth.js";
import {
  sendChatMessage,
  searchConversations,
  getConversationHistory,
  getConversations,
  deleteConversation,
} from "../services/chatService.js";

const chatRouter = Router();

chatRouter.use(authMiddleware);

const messageSchema = z.object({
  message: z.string().min(1).max(2000),
  conversationId: z.string().optional(), // "new" or ObjectId
});

// ✅ Send message to chat
chatRouter.post("/message", async (req, res) => {
  try {
    const { message, conversationId } = messageSchema.parse(req.body);

    const result = await sendChatMessage(req.userId, conversationId || "new", message);

    res.json(result);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({
        error: e.errors[0]?.message,
      });
    }

    console.error("CHAT MESSAGE ERROR:", e);

    res.status(500).json({
      error: "Failed to send message",
    });
  }
});

// ✅ Get all conversations for user
chatRouter.get("/conversations", async (req, res) => {
  try {
    const conversations = await getConversations(req.userId);

    res.json(conversations);
  } catch (e) {
    console.error("CHAT CONVERSATIONS ERROR:", e);

    res.status(500).json({
      error: "Failed to fetch conversations",
    });
  }
});

// ✅ Search conversations
chatRouter.get("/search", async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 1) {
      return res.status(400).json({
        error: "Search query required",
      });
    }

    const conversations = await searchConversations(req.userId, q);

    res.json(conversations);
  } catch (e) {
    console.error("CHAT SEARCH ERROR:", e);

    res.status(500).json({
      error: "Failed to search conversations",
    });
  }
});

// ✅ Get conversation history
chatRouter.get("/history/:conversationId", async (req, res) => {
  try {
    const history = await getConversationHistory(req.userId, req.params.conversationId);

    res.json(history);
  } catch (e) {
    console.error("CHAT HISTORY ERROR:", e);

    res.status(404).json({
      error: "Conversation not found",
    });
  }
});

// ✅ Delete conversation
chatRouter.delete("/:conversationId", async (req, res) => {
  try {
    await deleteConversation(req.userId, req.params.conversationId);

    res.json({
      success: true,
    });
  } catch (e) {
    console.error("CHAT DELETE ERROR:", e);

    res.status(404).json({
      error: "Conversation not found",
    });
  }
});

export { chatRouter };
