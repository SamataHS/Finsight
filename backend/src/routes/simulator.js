import { Router } from "express";
import { z } from "zod";
import { authMiddleware } from "../middleware/auth.js";
import { simulateSpending, saveScenario, getScenarios, deleteScenario } from "../services/simulatorService.js";
import { ObjectId } from "mongodb";

const simulatorRouter = Router();

simulatorRouter.use(authMiddleware);

const simulationSchema = z.object({
  name: z.string().min(1),
  month: z.string(),
  changes: z.array(
    z.object({
      category: z.string(),
      percentChange: z.number().optional(),
      fixedAmount: z.number().optional(),
    })
  ),
});

// ✅ Simulate spending changes
simulatorRouter.post("/simulate", async (req, res) => {
  try {
    const { month, changes } = req.body;

    if (!month || !changes) {
      return res.status(400).json({
        error: "Month and changes are required",
      });
    }

    const result = await simulateSpending(req.userId, month, changes);

    res.json(result);
  } catch (e) {
    console.error("SIMULATOR ERROR:", e);
    res.status(500).json({
      error: "Simulation failed",
    });
  }
});

// ✅ Save scenario
simulatorRouter.post("/scenarios", async (req, res) => {
  try {
    const data = simulationSchema.parse(req.body);

    const result = await simulateSpending(req.userId, data.month, data.changes);

    const scenario = await saveScenario(req.userId, {
      name: data.name,
      month: data.month,
      changes: data.changes,
      results: {
        currentSpending: result.currentSpending,
        simulatedSpending: result.simulatedSpending,
        savingsDifference: result.savingsDifference,
        savingsRateImpact: result.savingsRateImpact,
      },
    });

    res.status(201).json(scenario);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({
        error: e.errors[0]?.message,
      });
    }

    console.error("SAVE SCENARIO ERROR:", e);
    res.status(500).json({
      error: "Failed to save scenario",
    });
  }
});

// ✅ Get saved scenarios
simulatorRouter.get("/scenarios", async (req, res) => {
  try {
    const scenarios = await getScenarios(req.userId);
    res.json(scenarios);
  } catch (e) {
    console.error("GET SCENARIOS ERROR:", e);
    res.status(500).json({
      error: "Failed to fetch scenarios",
    });
  }
});

// ✅ Delete scenario
simulatorRouter.delete("/scenarios/:id", async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        error: "Invalid scenario ID",
      });
    }

    await deleteScenario(req.userId, req.params.id);

    res.json({
      success: true,
    });
  } catch (e) {
    console.error("DELETE SCENARIO ERROR:", e);
    res.status(404).json({
      error: "Scenario not found",
    });
  }
});

export { simulatorRouter };
