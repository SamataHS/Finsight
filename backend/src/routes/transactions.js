import { Router } from "express";
import { z } from "zod";
import { getDB } from "../lib/mongo.js";
import { authMiddleware } from "../middleware/auth.js";
import { ObjectId } from "mongodb";

const transactionRouter = Router();

transactionRouter.use(authMiddleware);


const transactionSchema = z.object({
  type: z.enum(["income", "expense"]),
  amount: z.number().positive(),
  category: z.string().min(1),
  description: z.string().optional(),
  date: z.string().transform((s) => new Date(s)),
});


const categories = [
  "Food & Dining",
  "Rent",
  "Utilities",
  "Transport",
  "Shopping",
  "Entertainment",
  "Travel",
  "Healthcare",
  "Education",
  "Investments",
  "Salary",
  "Freelance",
  "Other Income",
  "Other Expense",
];


// ✅ categories
transactionRouter.get("/categories", (_, res) => {
  res.json({ categories });
});


// ✅ get transactions
transactionRouter.get("/", async (req, res) => {
  try {

    const db = getDB();

    const { month, type, limit = 100 } = req.query;

    const filter = {
      userId: req.userId,
    };

    if (type) {
      filter.type = type;
    }

    if (month) {
      const [y, m] = month.split("-");

      const start = new Date(y, m - 1, 1);
      const end = new Date(y, m, 0, 23, 59, 59);

      filter.date = {
        $gte: start,
        $lte: end,
      };
    }

    const list =
      await db
        .collection("transactions")
        .find(filter)
        .sort({ date: -1 })
        .limit(Number(limit))
        .toArray();

    res.json(list);

  } catch (e) {

    console.error(
      "TX GET ERROR",
      e
    );

    res.status(500).json({
      error: "Failed",
    });
  }
});


// ✅ create
transactionRouter.post("/", async (req, res) => {
  try {

    const db = getDB();

    const data =
      transactionSchema.parse(
        req.body
      );

    const tx = {
      ...data,
      userId: req.userId,
    };

    const result =
      await db
        .collection(
          "transactions"
        )
        .insertOne(tx);

    res.status(201).json({
      _id:
        result.insertedId,
      ...tx,
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
              ?.message,
        });
    }

    console.error(
      "TX CREATE ERROR",
      e
    );

    res.status(500).json({
      error:
        "Create failed",
    });
  }
});


// ✅ update
transactionRouter.patch(
  "/:id",
  async (req, res) => {

    try {

      if (!ObjectId.isValid(req.params.id)) {
        return res.status(400).json({
          error: "Invalid transaction ID format",
        });
      }

      const db =
        getDB();

      const data =
        transactionSchema
          .partial()
          .parse(
            req.body
          );

      const result =
        await db
          .collection(
            "transactions"
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
              "Not found",
          });
      }

      res.json({
        success: true,
      });

    } catch (e) {

      console.error(
        "TX UPDATE ERROR",
        e
      );

      res.status(500).json({
        error:
          "Update failed",
      });
    }
  }
);


// ✅ delete
transactionRouter.delete(
  "/:id",
  async (req, res) => {

    try {

      if (!ObjectId.isValid(req.params.id)) {
        return res.status(400).json({
          error: "Invalid transaction ID format",
        });
      }

      const db =
        getDB();

      const result =
        await db
          .collection(
            "transactions"
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
        "TX DELETE ERROR",
        e
      );

      res.status(500).json({
        error:
          "Delete failed",
      });
    }
  }
);


export { transactionRouter };