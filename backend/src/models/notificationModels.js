import mongoose from "mongoose";

const notificationPreferenceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  alerts: {
    budgetExceeded: {
      enabled: { type: Boolean, default: true },
      threshold: { type: Number, default: 100 }, // 100% = exceeded
    },
    monthlyReport: {
      enabled: { type: Boolean, default: true },
      day: { type: Number, default: 1 }, // Day of month
    },
    subscriptionReminder: {
      enabled: { type: Boolean, default: true },
      daysAhead: { type: Number, default: 3 },
    },
    highSpending: {
      enabled: { type: Boolean, default: false },
      threshold: { type: Number, default: 50000 }, // ₹ amount
    },
    goalMilestone: {
      enabled: { type: Boolean, default: true },
    },
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

const notificationLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  type: {
    type: String,
    enum: [
      "budgetExceeded",
      "monthlyReport",
      "subscriptionReminder",
      "highSpending",
      "goalMilestone",
    ],
    required: true,
  },
  recipient: {
    type: String,
    required: true,
  },
  subject: String,
  message: String,
  sentAt: {
    type: Date,
    default: Date.now,
  },
  read: {
    type: Boolean,
    default: false,
  },
  metadata: mongoose.Schema.Types.Mixed,
});

const NotificationPreference = mongoose.model(
  "NotificationPreference",
  notificationPreferenceSchema
);
const NotificationLog = mongoose.model("NotificationLog", notificationLogSchema);

export { NotificationPreference, NotificationLog };
