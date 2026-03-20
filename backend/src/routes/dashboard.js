import { Router } from "express";
import { getDB } from "../lib/mongo.js";
import { authMiddleware } from "../middleware/auth.js";

const dashboardRouter = Router();

dashboardRouter.use(authMiddleware);


function getMonthRange(monthsAgo) {
  const d = new Date();

  d.setMonth(d.getMonth() - monthsAgo);

  const y = d.getFullYear();
  const m = d.getMonth();

  const start = new Date(y, m, 1);

  const end =
    new Date(y, m + 1, 0, 23, 59, 59);

  return { start, end };
}


// ✅ SUMMARY
dashboardRouter.get(
  "/summary",
  async (req, res) => {

    try {

      const db = getDB();

      const userId = req.userId;

      const { months = "3" } = req.query;

      const n =
        Math.min(
          12,
          Math.max(
            1,
            parseInt(months) || 3
          )
        );

      const results = [];

      for (let i = 0; i < n; i++) {

        const { start, end } =
          getMonthRange(i);

        const tx =
          await db
            .collection("transactions")
            .find({
              userId,
              date: {
                $gte: start,
                $lte: end,
              },
            })
            .toArray();

        let income = 0;
        let expense = 0;

        for (const t of tx) {

          if (t.type === "income")
            income += t.amount;

          if (t.type === "expense")
            expense += t.amount;
        }

        results.unshift({
          month:
            `${start.getFullYear()}-${String(
              start.getMonth() + 1
            ).padStart(2, "0")}`,
          income,
          expense,
          savings:
            income - expense,
        });
      }

      res.json(results);

    } catch (e) {

      console.error(
        "SUMMARY ERROR",
        e
      );

      res.status(500).json({
        error: "Failed",
      });
    }
  }
);


// ✅ CATEGORY BREAKDOWN
dashboardRouter.get(
  "/category-breakdown",
  async (req, res) => {

    try {

      const db = getDB();

      const userId =
        req.userId;

      const { month } =
        req.query;

      const targetMonth =
        month ||
        new Date()
          .toISOString()
          .slice(0, 7);

      const [y, m] =
        targetMonth
          .split("-")
          .map(Number);

      const start =
        new Date(y, m - 1, 1);

      const end =
        new Date(
          y,
          m,
          0,
          23,
          59,
          59
        );

      const tx =
        await db
          .collection(
            "transactions"
          )
          .find({
            userId,
            type: "expense",
            date: {
              $gte: start,
              $lte: end,
            },
          })
          .toArray();

      const byCategory = {};

      for (const t of tx) {

        byCategory[
          t.category
        ] =
          (byCategory[
            t.category
          ] || 0) +
          t.amount;
      }

      const breakdown =
        Object.entries(
          byCategory
        ).map(
          ([category, total]) => ({
            category,
            total,
          })
        );

      breakdown.sort(
        (a, b) =>
          b.total -
          a.total
      );

      res.json(
        breakdown
      );

    } catch (e) {

      console.error(
        "BREAKDOWN ERROR",
        e
      );

      res.status(500).json({
        error: "Failed",
      });
    }
  }
);


// ✅ BUDGET STATUS
dashboardRouter.get(
  "/budget-status",
  async (req, res) => {

    try {

      const db = getDB();

      const userId =
        req.userId;

      const targetMonth =
        req.query.month ||
        new Date()
          .toISOString()
          .slice(0, 7);

      const [y, m] =
        targetMonth
          .split("-")
          .map(Number);

      const start =
        new Date(y, m - 1, 1);

      const end =
        new Date(
          y,
          m,
          0,
          23,
          59,
          59
        );

      const budgets =
        await db
          .collection(
            "budgets"
          )
          .find({
            userId,
            month:
              targetMonth,
          })
          .toArray();

      const tx =
        await db
          .collection(
            "transactions"
          )
          .find({
            userId,
            type:
              "expense",
            date: {
              $gte:
                start,
              $lte: end,
            },
          })
          .toArray();

      const spentByCat =
        {};

      for (const t of tx) {

        spentByCat[
          t.category
        ] =
          (spentByCat[
            t.category
          ] || 0) +
          t.amount;
      }

      const status =
        budgets.map(
          (b) => ({

            id: b._id,

            category:
              b.category,

            budget:
              b.amount,

            spent:
              spentByCat[
                b.category
              ] || 0,

            remaining:
              b.amount -
              (spentByCat[
                b.category
              ] || 0),

            percentUsed:
              Math.round(
                (
                  (spentByCat[
                    b.category
                  ] || 0) /
                  b.amount
                ) *
                  100
              ),

            exceeded:
              (spentByCat[
                b.category
              ] || 0) >
              b.amount,
          })
        );

      res.json(
        status
      );

    } catch (e) {

      console.error(
        "STATUS ERROR",
        e
      );

      res.status(500).json({
        error:
          "Failed",
      });
    }
  }
);


export {
  dashboardRouter,
};