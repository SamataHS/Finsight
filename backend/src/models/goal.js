import mongoose from "mongoose";

const goalSchema =
  new mongoose.Schema(
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },

      name: String,

      targetAmount: Number,

      currentAmount: {
        type: Number,
        default: 0,
      },

      targetDate: Date,

      priority: Number,
    },
    { timestamps: true }
  );

export default mongoose.model(
  "Goal",
  goalSchema
);