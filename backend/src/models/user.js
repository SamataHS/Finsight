import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  passwordHash: String,
  firstName: String,
  lastName: String,
  currency: {
    type: String,
    default: "INR",
  },
});

export const User = mongoose.model("User", userSchema);