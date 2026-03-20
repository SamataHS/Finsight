import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  frequency: {
    type: String,
    enum: ["daily", "weekly", "biweekly", "monthly", "quarterly", "yearly"],
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  dayOfCycle: {
    type: Number, // 1-31 for monthly, 1-54 for weekly
    default: 1,
  },
  startDate: {
    type: Date,
    default: Date.now,
  },
  lastDetectedDate: {
    type: Date,
  },
  nextDueDate: {
    type: Date,
  },
  status: {
    type: String,
    enum: ["active", "paused", "cancelled"],
    default: "active",
  },
  confidence: {
    type: Number,
    default: 0, // 0-100
  },
  transactionIds: [mongoose.Schema.Types.ObjectId],
  isManual: {
    type: Boolean,
    default: false,
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

const Subscription = mongoose.model("Subscription", subscriptionSchema);

export { Subscription };
