import { getDB } from "../lib/mongo.js";
import { ObjectId } from "mongodb";
import { callGroq } from "./groqService.js";

// Helper function to get transactions from DB
async function getTransactions(userId, filter = {}) {
  const db = getDB();
  return await db
    .collection("transactions")
    .find({
      userId,
      ...filter,
    })
    .toArray();
}

// Helper function to get budgets from DB
async function getBudgets(userId) {
  const db = getDB();
  return await db
    .collection("budgets")
    .find({ userId })
    .toArray();
}

// Helper function to get goals from DB
async function getGoals(userId) {
  const db = getDB();
  return await db
    .collection("goals")
    .find({ userId })
    .toArray();
}

// =============================
// Spending behavior
// =============================

export async function getSpendingBehaviorAnalysis(userId, month) {
  const targetMonth =
    month || new Date().toISOString().slice(0, 7);

  const [y, m] = targetMonth.split("-").map(Number);

  const thisStart = new Date(y, m - 1, 1);
  const thisEnd = new Date(y, m, 0, 23, 59, 59);

  const lastStart = new Date(y, m - 2, 1);
  const lastEnd = new Date(y, m - 1, 0, 23, 59, 59);

  const thisTx = await getTransactions(userId, {
    date: { $gte: thisStart, $lte: thisEnd },
  });

  const lastTx = await getTransactions(userId, {
    date: { $gte: lastStart, $lte: lastEnd },
  });

  const thisExpenses = thisTx.filter(
    (t) => t.type === "expense"
  );

  const lastExpenses = lastTx.filter(
    (t) => t.type === "expense"
  );

  const thisByCat = {};
  const lastByCat = {};

  for (const t of thisExpenses)
    thisByCat[t.category] =
      (thisByCat[t.category] || 0) + t.amount;

  for (const t of lastExpenses)
    lastByCat[t.category] =
      (lastByCat[t.category] || 0) + t.amount;

  const comparisons = Object.keys({
    ...thisByCat,
    ...lastByCat,
  }).map((cat) => ({
    category: cat,
    thisMonth: thisByCat[cat] || 0,
    lastMonth: lastByCat[cat] || 0,
    changePercent: lastByCat[cat]
      ? Math.round(
        ((thisByCat[cat] || 0 - lastByCat[cat]) / lastByCat[cat]) * 100
      )
      : 0,
  }));

  const prompt = `Analyze the following spending patterns and provide 3 actionable tips to reduce expenses:

Spending by Category (This Month vs Last Month):
${JSON.stringify(comparisons, null, 2)}

Please provide specific, practical advice.`;

  return callAI(
    prompt,
    "Add more transactions to get detailed analysis"
  );
}


// =============================
// Saving suggestions
// =============================

export async function getSavingSuggestions(userId) {
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(
    threeMonthsAgo.getMonth() - 3
  );

  const tx = await getTransactions(userId, {
    date: { $gte: threeMonthsAgo },
  });

  const expenses = tx.filter(
    (t) => t.type === "expense"
  );

  const income = tx.filter(
    (t) => t.type === "income"
  );

  const expenseByCategory = {};
  for (const t of expenses) {
    expenseByCategory[t.category] =
      (expenseByCategory[t.category] || 0) + t.amount;
  }

  const totalExpense = expenses.reduce((s, t) => s + t.amount, 0);
  const totalIncome = income.reduce((s, t) => s + t.amount, 0);
  const avgSavings = (totalIncome - totalExpense) / 3;

  const prompt = `Based on the following financial data, provide 3 personalized saving recommendations:

Average Monthly Income: ${totalIncome / 3}
Average Monthly Expenses: ${totalExpense / 3}
Average Monthly Savings: ${avgSavings}

Expenses by Category:
${JSON.stringify(expenseByCategory, null, 2)}

Please provide specific, actionable suggestions to increase savings.`;

  return callAI(
    prompt,
    "Add more transactions to get personalized recommendations"
  );
}



// =============================
// Prediction
// =============================

export async function predictFutureExpenses(
  userId,
  monthsAhead = 1
) {
  return predictFromHistory(
    userId,
    "expense",
    monthsAhead
  );
}



export async function predictFromHistory(
  userId,
  type,
  monthsAhead
) {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(
    sixMonthsAgo.getMonth() - 6
  );

  const tx = await getTransactions(userId, {
    type,
    date: { $gte: sixMonthsAgo },
  });

  const byMonth = {};

  for (const t of tx) {
    const key =
      t.date instanceof Date
        ? t.date.getFullYear() +
          "-" +
          String(
            t.date.getMonth() + 1
          ).padStart(2, "0")
        : new Date(t.date).getFullYear() +
          "-" +
          String(
            new Date(t.date).getMonth() + 1
          ).padStart(2, "0");

    byMonth[key] =
      (byMonth[key] || 0) + t.amount;
  }

  const values =
    Object.values(byMonth);

  const avg =
    values.reduce(
      (a, b) => a + b,
      0
    ) / (values.length || 1);

  return {
    predicted: Math.round(avg),
    method: "moving average",
    monthsAnalyzed: values.length,
    historicalData: byMonth,
  };
}



// =============================
// Financial health
// =============================

export async function getFinancialHealthScore(
  userId
) {
  const threeMonthsAgo = new Date();

  threeMonthsAgo.setMonth(
    threeMonthsAgo.getMonth() - 3
  );

  const tx = await getTransactions(userId, {
    date: { $gte: threeMonthsAgo },
  });

  const budgets = await getBudgets(userId);
  const goals = await getGoals(userId);

  const income = tx
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);

  const expense = tx
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);

  const savings = income - expense;
  const savingsRatio = income > 0 ? (savings / income) * 100 : 0;

  // Calculate budget adherence
  let budgetScore = 50;
  if (budgets.length > 0) {
    // Check how many budgets are not exceeded
    let adheringBudgets = 0;
    for (const budget of budgets) {
      const categoryExpenses = tx
        .filter(
          (t) =>
            t.type === "expense" &&
            t.category === budget.category
        )
        .reduce((s, t) => s + t.amount, 0);

      if (categoryExpenses <= budget.amount) {
        adheringBudgets++;
      }
    }
    budgetScore =
      Math.round((adheringBudgets / budgets.length) * 100);
  }

  // Calculate goal progress score
  let goalScore = 50;
  if (goals.length > 0) {
    let progressCount = 0;
    for (const goal of goals) {
      if (
        goal.currentAmount >=
        goal.targetAmount * 0.5
      ) {
        progressCount++;
      }
    }
    goalScore =
      Math.round((progressCount / goals.length) * 100);
  }

  // Overall score
  const overallScore = Math.round(
    (savingsRatio * 0.4 +
      budgetScore * 0.35 +
      goalScore * 0.25) /
      100
  );

  return {
    score: Math.min(100, Math.max(0, overallScore)),
    income: Math.round(income),
    expense: Math.round(expense),
    savings: Math.round(savings),
    savingsRatio: Math.round(savingsRatio),
    goals: goals.length,
    budgets: budgets.length,
    budgetAdherence: budgetScore,
    goalProgress: goalScore,
    breakdown: {
      savingsComponent: Math.round(savingsRatio * 0.4),
      budgetComponent: Math.round(budgetScore * 0.35),
      goalComponent: Math.round(goalScore * 0.25),
    },
  };
}



// =============================
// Goal plan
// =============================

export async function getGoalPlan(
  userId,
  goalId
) {
  const db = getDB();

  let goal;
  try {
    goal = await db
      .collection("goals")
      .findOne({
        _id: new ObjectId(goalId),
        userId,
      });
  } catch (e) {
    return null;
  }

  if (!goal) return null;

  const remaining =
    goal.targetAmount -
    (goal.currentAmount || 0);

  const monthsUntilTarget = goal.targetDate
    ? Math.ceil(
      (new Date(goal.targetDate) - new Date()) /
      (1000 * 60 * 60 * 24 * 30)
    )
    : 12;

  const monthlyRequired =
    monthsUntilTarget > 0
      ? Math.ceil(remaining / monthsUntilTarget)
      : remaining;

  const prompt = `Create a savings plan for the following goal:

Goal Name: ${goal.name}
Target Amount: ${goal.targetAmount}
Current Amount: ${goal.currentAmount || 0}
Remaining: ${remaining}
Months Until Target: ${monthsUntilTarget}
Monthly Required: ${monthlyRequired}

Please provide practical steps to achieve this goal.`;

  const plan = await callAI(
    prompt,
    `Save ₹${monthlyRequired} per month to reach your goal of ₹${goal.targetAmount} for ${goal.name} in ${monthsUntilTarget} months.`
  );

  return {
    goal: {
      ...goal,
      _id: goal._id.toString(),
    },
    plan,
    monthlySavingsRequired: monthlyRequired,
    monthsUntilTarget,
  };
}



// =============================
// Risk alerts
// =============================

export async function getRiskAlerts(
  userId
) {
  const tx = await getTransactions(userId);

  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);

  const lastMonthTx = tx.filter((t) => {
    const tDate = t.date instanceof Date
      ? t.date
      : new Date(t.date);
    return (
      tDate.getFullYear() ===
      lastMonth.getFullYear() &&
      tDate.getMonth() === lastMonth.getMonth()
    );
  });

  const thisMonth = new Date();
  const thisMonthTx = tx.filter((t) => {
    const tDate = t.date instanceof Date
      ? t.date
      : new Date(t.date);
    return (
      tDate.getFullYear() ===
      thisMonth.getFullYear() &&
      tDate.getMonth() === thisMonth.getMonth()
    );
  });

  const lastMonthExpense = lastMonthTx
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);

  const thisMonthExpense = thisMonthTx
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);

  const alerts = [];

  // Alert for high spending
  if (thisMonthExpense > 50000) {
    alerts.push({
      type: "high_spending",
      message: `⚠️ High spending detected: ₹${Math.round(
        thisMonthExpense
      )} this month`,
      severity: "high",
    });
  }

  // Alert for spending increase
  if (lastMonthExpense > 0) {
    const percentIncrease =
      ((thisMonthExpense - lastMonthExpense) /
        lastMonthExpense) *
      100;

    if (percentIncrease > 20) {
      alerts.push({
        type: "spending_increase",
        message: `📈 Spending increased by ${Math.round(
          percentIncrease
        )}% compared to last month`,
        severity: "medium",
      });
    }
  }

  // Alert for budget exceeded
  const budgets = await getBudgets(userId);
  for (const budget of budgets) {
    const categoryExpense = thisMonthTx
      .filter(
        (t) =>
          t.type === "expense" &&
          t.category === budget.category
      )
      .reduce((s, t) => s + t.amount, 0);

    if (categoryExpense > budget.amount) {
      const exceeded = Math.round(
        categoryExpense - budget.amount
      );
      alerts.push({
        type: "budget_exceeded",
        category: budget.category,
        message: `💰 Budget exceeded for ${budget.category}: Over by ₹${exceeded}`,
        severity: "high",
      });
    }
  }

  return alerts;
}



// =============================
// AI call
// =============================

export async function callAI(
  prompt,
  fallback
) {
  try {
    const response = await callGroq(prompt);
    return response || fallback;
  } catch (error) {
    console.error("AI service error:", error);
    return fallback;
  }
}