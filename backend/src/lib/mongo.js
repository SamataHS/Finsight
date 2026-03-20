import mongoose from "mongoose";

export const connectMongo = async () => {
  try {
    const dbUrl = process.env.DATABASE_URL || "mongodb://localhost:27017/finsight";
    await mongoose.connect(dbUrl);
    console.log("MongoDB Connected via Mongoose");
  } catch (err) {
    console.error("MongoDB connection failed:", err);
    throw err;
  }
};

// For backward compatibility with existing routes that use getDB()
export const getDB = () => {
  if (!mongoose.connection.db) {
    throw new Error("Database not initialized");
  }
  return mongoose.connection.db;
};