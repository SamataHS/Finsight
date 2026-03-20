import { Router } from "express";
import { z } from "zod";
import { authMiddleware } from "../middleware/auth.js";
import { ObjectId } from "mongodb";
import {
  analyzeRecurringPatterns,
  getSubscriptions,
  getSubscriptionAnalysis,
  addSubscription,
  updateSubscription,
  deleteSubscription,
  getSubscriptionTrends,
} from "../services/subscriptionService.js";

const subscriptionRouter = Router();

subscriptionRouter.use(authMiddleware);

const subscriptionSchema = z.object({
  name: z.string().min(1),
  amount: z.number().positive(),
  frequency: z.enum(["daily", "weekly", "biweekly", "monthly", "quarterly", "yearly"]),
  category: z.string().min(1),
  dayOfCycle: z.number().int().min(1).max(31).optional(),
});

// ✅ Detect recurring patterns
subscriptionRouter.get("/detect", async (req, res) => {
  try {
    const detected = await analyzeRecurringPatterns(req.userId);
    res.json(detected);
  } catch (e) {
    console.error("SUBSCRIPTION DETECT ERROR:", e);
    res.status(500).json({
      error: "Failed to detect subscriptions",
    });
  }
});

// ✅ Get all subscriptions
subscriptionRouter.get("/", async (req, res) => {
  try {
    const subscriptions = await getSubscriptions(req.userId);
    res.json(subscriptions);
  } catch (e) {
    console.error("SUBSCRIPTION GET ERROR:", e);
    res.status(500).json({
      error: "Failed to fetch subscriptions",
    });
  }
});

// ✅ Get subscription analysis
subscriptionRouter.get("/analysis", async (req, res) => {
  try {
    const analysis = await getSubscriptionAnalysis(req.userId);
    res.json(analysis);
  } catch (e) {
    console.error("SUBSCRIPTION ANALYSIS ERROR:", e);
    res.status(500).json({
      error: "Failed to get analysis",
    });
  }
});

// ✅ Get subscription trends
subscriptionRouter.get("/trends/:id", async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        error: "Invalid subscription ID",
      });
    }

    const trends = await getSubscriptionTrends(req.userId, req.params.id);
    res.json(trends);
  } catch (e) {
    console.error("SUBSCRIPTION TRENDS ERROR:", e);
    res.status(404).json({
      error: "Subscription not found",
    });
  }
});

// ✅ Add new subscription
subscriptionRouter.post("/", async (req, res) => {
  try {
    const data = subscriptionSchema.parse(req.body);
    const subscription = await addSubscription(req.userId, data);
    res.status(201).json(subscription);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({
        error: e.errors[0]?.message,
      });
    }

    console.error("SUBSCRIPTION CREATE ERROR:", e);
    res.status(500).json({
      error: "Failed to create subscription",
    });
  }
});

// ✅ Update subscription
subscriptionRouter.patch("/:id", async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        error: "Invalid subscription ID",
      });
    }

    const data = subscriptionSchema.partial().parse(req.body);
    await updateSubscription(req.userId, req.params.id, data);

    res.json({
      success: true,
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({
        error: e.errors[0]?.message,
      });
    }

    console.error("SUBSCRIPTION UPDATE ERROR:", e);
    res.status(500).json({
      error: "Failed to update subscription",
    });
  }
});

// ✅ Delete subscription
subscriptionRouter.delete("/:id", async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        error: "Invalid subscription ID",
      });
    }

    await deleteSubscription(req.userId, req.params.id);

    res.json({
      success: true,
    });
  } catch (e) {
    console.error("SUBSCRIPTION DELETE ERROR:", e);
    res.status(404).json({
      error: "Subscription not found",
    });
  }
});

export { subscriptionRouter };
