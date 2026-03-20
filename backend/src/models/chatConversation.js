import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ["user", "assistant"],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  insights: [String], // Extracted insights from response
});

const chatConversationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  title: {
    type: String,
    default: "New Conversation",
  },
  messages: [messageSchema],
  context: {
    summaryData: mongoose.Schema.Types.Mixed, // Financial summary cached
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update updatedAt on every save
chatConversationSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const ChatConversation = mongoose.model("ChatConversation", chatConversationSchema);

export { ChatConversation };
