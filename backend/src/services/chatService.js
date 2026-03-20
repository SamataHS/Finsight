import { getDB } from "../lib/mongo.js";
import { callAI } from "./aiService.js";

// Get user's financial context for chat
async function getFinancialContext(userId) {
  const db = getDB();

  // Get last 3 months of transactions
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const transactions = await db
    .collection("transactions")
    .find({
      userId,
      date: { $gte: threeMonthsAgo },
    })
    .toArray();

  // Get budgets for current month
  const currentMonth = new Date();
  const monthStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}`;

  const budgets = await db
    .collection("budgets")
    .find({
      userId,
      month: monthStr,
    })
    .toArray();

  // Get all goals
  const goals = await db
    .collection("goals")
    .find({ userId })
    .toArray();

  // Calculate summary
  let totalIncome = 0;
  let totalExpense = 0;
  const expenseByCategory = {};

  transactions.forEach((tx) => {
    if (tx.type === "income") {
      totalIncome += tx.amount;
    } else {
      totalExpense += tx.amount;
      expenseByCategory[tx.category] = (expenseByCategory[tx.category] || 0) + tx.amount;
    }
  });

  const savings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? (savings / totalIncome) * 100 : 0;

  return {
    totalIncome: totalIncome.toFixed(2),
    totalExpense: totalExpense.toFixed(2),
    savings: savings.toFixed(2),
    savingsRate: savingsRate.toFixed(1),
    expenseByCategory,
    budgets: budgets.map((b) => ({
      category: b.category,
      budgeted: b.amount,
    })),
    goals: goals.map((g) => ({
      name: g.name,
      targetAmount: g.targetAmount,
      currentAmount: g.currentAmount,
      targetDate: g.targetDate,
    })),
    transactionCount: transactions.length,
  };
}

// Extract insights from AI response
function extractInsights(response) {
  const insights = [];

  // Look for suggestions and tips in response
  const lines = response.split("\n").filter((line) => line.trim());

  for (const line of lines) {
    if (
      line.includes("suggest") ||
      line.includes("recommend") ||
      line.includes("consider") ||
      line.includes("could") ||
      line.includes("should")
    ) {
      const cleaned = line
        .replace(/^\d+\.\s*/, "")
        .replace(/^\*\*/, "")
        .replace(/\*\*$/, "")
        .trim();
      if (cleaned.length > 10 && cleaned.length < 200) {
        insights.push(cleaned);
      }
    }
  }

  return insights.slice(0, 3); // Return top 3 insights
}

// Send chat message and get AI response
async function sendChatMessage(userId, conversationId, userMessage) {
  const db = getDB();

  // Fetch or create conversation
  let conversation;
  if (conversationId && conversationId !== "new") {
    const { ObjectId } = await import("mongodb");
    conversation = await db
      .collection("chatConversations")
      .findOne({
        _id: new ObjectId(conversationId),
        userId,
      });

    if (!conversation) {
      throw new Error("Conversation not found");
    }
  } else {
    conversation = {
      userId,
      title: userMessage.substring(0, 50) || "New Conversation",
      messages: [],
      context: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  // Get financial context
  const context = await getFinancialContext(userId);
  conversation.context = { summaryData: context };

  // Build system prompt - simplified for gemma:2b
  const systemPrompt = `You are a helpful financial advisor. Be concise and direct.

Financial data:
- Recent income: ₹${context.totalIncome}
- Recent expenses: ₹${context.totalExpense}
- Savings: ₹${context.savings}
- Top spending: ${Object.entries(context.expenseByCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([cat, amt]) => `${cat} ₹${amt.toFixed(0)}`)
    .join(", ")}

Answer the user's question based on their financial data. Keep responses short and helpful.`;

  // Build conversation history string
  const conversationHistory = conversation.messages
    .slice(-10) // Last 10 messages for context
    .map((msg) => `${msg.role === "assistant" ? "Assistant" : "User"}: ${msg.content}`)
    .join("\n");

  // Build single prompt string
  const fullPrompt = `${systemPrompt}

${conversationHistory ? `Previous conversation:\n${conversationHistory}\n` : ""}
User: ${userMessage}`;

  // Get AI response
  const aiResponse = await callAI(fullPrompt, "I couldn't generate a response. Please try again.");

  // Extract insights
  const insights = extractInsights(aiResponse);

  // Add messages to conversation
  conversation.messages.push({
    role: "user",
    content: userMessage,
    timestamp: new Date(),
  });

  conversation.messages.push({
    role: "assistant",
    content: aiResponse,
    timestamp: new Date(),
    insights,
  });

  // Save conversation
  if (conversationId && conversationId !== "new") {
    const { ObjectId } = await import("mongodb");
    await db.collection("chatConversations").updateOne(
      {
        _id: new ObjectId(conversationId),
      },
      {
        $set: {
          messages: conversation.messages,
          context: conversation.context,
          updatedAt: new Date(),
        },
      }
    );
  } else {
    const result = await db.collection("chatConversations").insertOne(conversation);
    conversation._id = result.insertedId;
  }

  return {
    conversationId: conversation._id,
    reply: aiResponse,
    insights,
  };
}

// Search conversations
async function searchConversations(userId, keyword) {
  const db = getDB();

  const conversations = await db
    .collection("chatConversations")
    .find({
      userId,
      $or: [
        {
          title: { $regex: keyword, $options: "i" },
        },
        {
          "messages.content": { $regex: keyword, $options: "i" },
        },
      ],
    })
    .sort({ updatedAt: -1 })
    .toArray();

  return conversations.map((c) => ({
    id: c._id,
    title: c.title,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    messageCount: c.messages.length,
    lastMessage: c.messages[c.messages.length - 1]?.content || "",
  }));
}

// Get conversation history
async function getConversationHistory(userId, conversationId) {
  const db = getDB();
  const { ObjectId } = await import("mongodb");

  const conversation = await db
    .collection("chatConversations")
    .findOne({
      _id: new ObjectId(conversationId),
      userId,
    });

  if (!conversation) {
    throw new Error("Conversation not found");
  }

  return {
    id: conversation._id,
    title: conversation.title,
    messages: conversation.messages,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
  };
}

// Get all conversations for user
async function getConversations(userId, limit = 20) {
  const db = getDB();

  const conversations = await db
    .collection("chatConversations")
    .find({ userId })
    .sort({ updatedAt: -1 })
    .limit(limit)
    .toArray();

  return conversations.map((c) => ({
    id: c._id,
    title: c.title,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    messageCount: c.messages.length,
    lastMessage: c.messages[c.messages.length - 1]?.content.substring(0, 100) || "",
  }));
}

// Delete conversation
async function deleteConversation(userId, conversationId) {
  const db = getDB();
  const { ObjectId } = await import("mongodb");

  const result = await db
    .collection("chatConversations")
    .deleteOne({
      _id: new ObjectId(conversationId),
      userId,
    });

  if (result.deletedCount === 0) {
    throw new Error("Conversation not found");
  }

  return true;
}

export {
  sendChatMessage,
  searchConversations,
  getConversationHistory,
  getConversations,
  deleteConversation,
  getFinancialContext,
};
