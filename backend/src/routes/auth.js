import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { getDB } from "../lib/mongo.js";
import { authMiddleware } from "../middleware/auth.js";

const authRouter = Router();

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});


// ✅ SIGNUP
authRouter.post("/signup", async (req, res) => {
  try {
    const db = getDB();
    const users = db.collection("users");

    const { email, password, firstName, lastName } =
      signupSchema.parse(req.body);

    const existing = await users.findOne({ email });

    if (existing) {
      return res.status(400).json({
        error: "Email already registered",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await users.insertOne({
      email,
      passwordHash,
      firstName,
      lastName,
      currency: "INR",
    });

    const user = {
      id: result.insertedId,
      email,
      firstName,
      lastName,
      currency: "INR",
    };

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "7d" }
    );

    res.status(201).json({ user, token });

  } catch (e) {

    console.error("SIGNUP ERROR:", e);

    if (e instanceof z.ZodError) {
      return res.status(400).json({
        error: e.errors[0]?.message,
      });
    }

    res.status(500).json({
      error: "Signup failed",
    });
  }
});


// ✅ LOGIN
authRouter.post("/login", async (req, res) => {
  try {
    const db = getDB();
    const users = db.collection("users");

    const { email, password } =
      loginSchema.parse(req.body);

    const user = await users.findOne({ email });

    if (
      !user ||
      !(await bcrypt.compare(password, user.passwordHash))
    ) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "7d" }
    );

    res.json({
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        currency: user.currency,
      },
      token,
    });

  } catch (e) {

    console.error("LOGIN ERROR:", e);

    if (e instanceof z.ZodError) {
      return res.status(400).json({
        error: e.errors[0]?.message,
      });
    }

    res.status(500).json({
      error: "Login failed",
    });
  }
});


// ✅ ME
authRouter.get(
  "/me",
  authMiddleware,
  async (req, res) => {

    const db = getDB();
    const users = db.collection("users");

    const user = await users.findOne({
      _id: req.userId,
    });

    if (!user)
      return res.status(404).json({
        error: "User not found",
      });

    res.json({
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      currency: user.currency,
    });
  }
);

export { authRouter };