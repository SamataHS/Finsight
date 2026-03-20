import mongoose from "mongoose";

const budgetSchema =
  new mongoose.Schema(
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },

      category: String,

      amount: Number,

      month: String, // YYYY-MM
    },
    { timestamps: true }
  );

export default mongoose.model(
  "Budget",
  budgetSchema
);