import { Router } from "express";
import { z } from "zod";
import { ObjectId } from "mongodb";
import { getDB } from "../lib/mongo.js";
import { authMiddleware } from "../middleware/auth.js";

const goalRouter = Router();

goalRouter.use(authMiddleware);


const goalSchema = z.object({
  name: z.string().min(1),

  targetAmount: z.number().positive(),

  currentAmount: z.number().min(0).optional(),

  targetDate: z
    .string()
    .transform((s) => new Date(s))
    .optional(),

  priority: z.number().int().min(1).optional(),
});


// ✅ GET ALL
goalRouter.get("/", async (req, res) => {
  try {

    const db = getDB();

    const goals =
      await db
        .collection("goals")
        .find({
          userId: req.userId,
        })
        .toArray();

    goals.sort(
      (a, b) =>
        (a.priority || 1) -
        (b.priority || 1)
    );

    res.json(goals);

  } catch (e) {

    console.error(
      "GOALS GET ERROR",
      e
    );

    res.status(500).json({
      error: "Failed",
    });
  }
});


// ✅ CREATE
goalRouter.post("/", async (req, res) => {
  try {

    const db = getDB();

    const data =
      goalSchema.parse(
        req.body
      );

    const goal = {
      ...data,

      userId:
        req.userId,

      currentAmount:
        data.currentAmount ??
        0,
    };

    const result =
      await db
        .collection(
          "goals"
        )
        .insertOne(goal);

    res.status(201).json({
      _id:
        result.insertedId,
      ...goal,
    });

  } catch (e) {

    if (
      e instanceof z.ZodError
    ) {
      return res
        .status(400)
        .json({
          error:
            e.errors[0]
              ?.message ||
            "Validation failed",
        });
    }

    console.error(
      "GOAL CREATE ERROR",
      e
    );

    res.status(500).json({
      error:
        "Create failed",
    });
  }
});


// ✅ UPDATE
goalRouter.patch(
  "/:id",
  async (req, res) => {

    try {

      const data =
        goalSchema
          .partial()
          .parse(
            req.body
          );

      // Validate ObjectId format
      if (!ObjectId.isValid(req.params.id)) {
        return res.status(400).json({
          error: "Invalid goal ID format",
        });
      }

      const db =
        getDB();

      const result =
        await db
          .collection(
            "goals"
          )
          .updateOne(
            {
              _id:
                new ObjectId(
                  req.params.id
                ),

              userId:
                req.userId,
            },
            {
              $set:
                data,
            }
          );

      if (
        result.matchedCount ===
        0
      ) {
        return res
          .status(404)
          .json({
            error:
              "Goal not found",
          });
      }

      res.json({
        success: true,
      });

    } catch (e) {

      console.error(
        "GOAL UPDATE ERROR",
        e
      );

      res.status(500).json({
        error:
          "Update failed",
      });
    }
  }
);


// ✅ DELETE
goalRouter.delete(
  "/:id",
  async (req, res) => {

    try {

      // Validate ObjectId format
      if (!ObjectId.isValid(req.params.id)) {
        return res.status(400).json({
          error: "Invalid goal ID format",
        });
      }

      const db =
        getDB();

      const result =
        await db
          .collection(
            "goals"
          )
          .deleteOne({
            _id:
              new ObjectId(
                req.params.id
              ),

            userId:
              req.userId,
          });

      if (
        result.deletedCount ===
        0
      ) {
        return res
          .status(404)
          .json({
            error:
              "Not found",
          });
      }

      res.json({
        success: true,
      });

    } catch (e) {

      console.error(
        "GOAL DELETE ERROR",
        e
      );

      res.status(500).json({
        error:
          "Delete failed",
      });
    }
  }
);


export { goalRouter };