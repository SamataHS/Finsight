import mongoose from "mongoose";

const bankUploadSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  fileName: {
    type: String,
    required: true,
  },
  uploadDate: {
    type: Date,
    default: Date.now,
  },
  transactionCount: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ["success", "partial", "failed"],
    default: "success",
  },
  errors: [
    {
      rowNumber: Number,
      error: String,
    },
  ],
  transactions: [mongoose.Schema.Types.ObjectId],
  metadata: {
    bank: String,
    format: String,
    period: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const BankUpload = mongoose.model("BankUpload", bankUploadSchema);

export { BankUpload };
