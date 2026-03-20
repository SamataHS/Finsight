import { Router } from "express";
import { z } from "zod";
import { ObjectId } from "mongodb";
import { getDB } from "../lib/mongo.js";
import { authMiddleware } from "../middleware/auth.js";

const budgetRouter = Router();

budgetRouter.use(authMiddleware);

const budgetSchema = z.object({
  category: z.string().min(1),
  amount: z.number().positive(),
  month: z.string().regex(/^\d{4}-\d{2}$/),
});


// ✅ GET budgets
budgetRouter.get("/", async (req, res) => {
  try {

    const db = getDB();

    const { month } = req.query;

    const targetMonth =
      month || new Date().toISOString().slice(0, 7);

    const budgets =
      await db.collection("budgets")
      .find({
        userId: req.userId,
        month: targetMonth,
      })
      .toArray();

    res.json(budgets);

  } catch (e) {

    console.error("GET budget error", e);

    res.status(500).json({
      error: "Failed",
    });
  }
});


// ✅ CREATE / UPDATE budget
budgetRouter.post("/", async (req, res) => {
  try {

    const db = getDB();

    const data =
      budgetSchema.parse(req.body);

    const userId = req.userId;

    const existing =
      await db.collection("budgets")
      .findOne({
        userId,
        category: data.category,
        month: data.month,
      });

    let result;

    if (existing) {

      await db.collection("budgets")
      .updateOne(
        { _id: existing._id },
        { $set: { amount: data.amount } }
      );

      result = {
        ...existing,
        amount: data.amount,
      };

    } else {

      const insert =
        await db.collection("budgets")
        .insertOne({
          ...data,
          userId,
        });

      result = {
        _id: insert.insertedId,
        ...data,
        userId,
      };
    }

    res.status(201).json(result);

  } catch (e) {

    console.error("POST budget error", e);

    if (e instanceof z.ZodError) {
      return res.status(400).json({
        error:
          e.errors[0]?.message ||
          "Validation failed",
      });
    }

    res.status(500).json({
      error: "Create failed",
    });
  }
});


// ✅ DELETE
budgetRouter.delete("/:id", async (req, res) => {
  try {

    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        error: "Invalid budget ID format",
      });
    }

    const db = getDB();

    const result =
      await db.collection("budgets")
      .deleteOne({
        _id: new ObjectId(req.params.id),
        userId: req.userId,
      });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        error: "Not found",
      });
    }

    res.json({ success: true });

  } catch (e) {

    console.error("DELETE budget error", e);

    res.status(500).json({
      error: "Delete failed",
    });
  }
});

export { budgetRouter };