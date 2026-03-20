import mongoose from "mongoose";

const recurringSchema =
  new mongoose.Schema(
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },

      type: {
        type: String,
        enum: ["income", "expense"],
      },

      amount: Number,

      category: String,

      description: String,

      frequency: {
        type: String,
        enum: [
          "weekly",
          "monthly",
          "yearly",
        ],
      },

      nextDueDate: Date,

      isActive: {
        type: Boolean,
        default: true,
      },
    },
    { timestamps: true }
  );

export default mongoose.model(
  "RecurringTransaction",
  recurringSchema
);