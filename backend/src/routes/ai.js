import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import {
  getSpendingBehaviorAnalysis,
  getSavingSuggestions,
  predictFutureExpenses,
  getFinancialHealthScore,
  getGoalPlan,
  getRiskAlerts,
} from "../services/aiService.js";

const aiRouter = Router();
aiRouter.use(authMiddleware);

aiRouter.get("/behavior", async (req, res) => {
  try {
    const month = req.query.month;
    const analysis = await getSpendingBehaviorAnalysis(req.userId, month);
    res.json({ analysis });
  } catch (e) {
    res.status(500).json({ error: "Analysis failed" });
  }
});

aiRouter.get("/suggestions", async (req, res) => {
  try {
    const suggestions = await getSavingSuggestions(req.userId);
    res.json({ suggestions });
  } catch (e) {
    res.status(500).json({ error: "Failed to get suggestions" });
  }
});

aiRouter.get("/predict", async (req, res) => {
  try {
    const months = parseInt(req.query.months) || 1;
    const prediction = await predictFutureExpenses(req.userId, months);
    res.json(prediction);
  } catch (e) {
    res.status(500).json({ error: "Prediction failed" });
  }
});

aiRouter.get("/health-score", async (req, res) => {
  try {
    const score = await getFinancialHealthScore(req.userId);
    res.json(score);
  } catch (e) {
    res.status(500).json({ error: "Failed to compute health score" });
  }
});

aiRouter.get("/goal-plan/:goalId", async (req, res) => {
  try {
    const plan = await getGoalPlan(req.userId, req.params.goalId);
    if (!plan) return res.status(404).json({ error: "Goal not found" });
    res.json(plan);
  } catch (e) {
    res.status(500).json({ error: "Failed to generate plan" });
  }
});

aiRouter.get("/risk-alerts", async (req, res) => {
  try {
    const alerts = await getRiskAlerts(req.userId);
    res.json({ alerts });
  } catch (e) {
    res.status(500).json({ error: "Failed to get alerts" });
  }
});

export { aiRouter };
