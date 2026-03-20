import { getDB } from "../lib/mongo.js";

// Get current spending by category for a month
async function getCategorySpending(userId, month) {
  const db = getDB();

  const [year, monthNum] = month.split("-");
  const startDate = new Date(year, parseInt(monthNum) - 1, 1);
  const endDate = new Date(year, parseInt(monthNum), 0, 23, 59, 59);

  const transactions = await db
    .collection("transactions")
    .find({
      userId,
      type: "expense",
      date: { $gte: startDate, $lte: endDate },
    })
    .toArray();

  const byCategory = {};
  let totalSpending = 0;

  transactions.forEach((tx) => {
    byCategory[tx.category] = (byCategory[tx.category] || 0) + tx.amount;
    totalSpending += tx.amount;
  });

  return { byCategory, totalSpending };
}

// Calculate impact of changes
async function simulateSpending(userId, month, changes) {
  const { byCategory, totalSpending } = await getCategorySpending(userId, month);

  let simulatedSpending = 0;
  const newByCategory = {};

  for (const [category, amount] of Object.entries(byCategory)) {
    const change = changes.find((c) => c.category === category);
    let newAmount = amount;

    if (change) {
      if (change.fixedAmount) {
        newAmount = change.fixedAmount;
      } else if (change.percentChange) {
        newAmount = amount * (1 + change.percentChange / 100);
      }
    }

    newByCategory[category] = newAmount;
    simulatedSpending += newAmount;
  }

  // Calculate savings impact
  const db = getDB();
  const [year, monthNum] = month.split("-");
  const incomeData = await db
    .collection("transactions")
    .aggregate([
      {
        $match: {
          userId,
          type: "income",
          date: {
            $gte: new Date(year, parseInt(monthNum) - 1, 1),
            $lte: new Date(year, parseInt(monthNum), 0, 23, 59, 59),
          },
        },
      },
      {
        $group: {
          _id: null,
          totalIncome: { $sum: "$amount" },
        },
      },
    ])
    .toArray();

  const totalIncome = incomeData[0]?.totalIncome || 0;
  const currentSavings = totalIncome - totalSpending;
  const simulatedSavings = totalIncome - simulatedSpending;
  const savingsDifference = simulatedSavings - currentSavings;
  const savingsRateImpact = totalIncome > 0 ? (savingsDifference / totalIncome) * 100 : 0;

  return {
    currentSpending: totalSpending,
    simulatedSpending,
    savingsDifference,
    savingsRateImpact,
    newByCategory,
    totalIncome,
    currentSavings,
    simulatedSavings,
  };
}

// Save scenario
async function saveScenario(userId, scenarioData) {
  const db = getDB();

  const scenario = {
    userId,
    ...scenarioData,
    savedAt: new Date(),
    createdAt: new Date(),
  };

  const result = await db.collection("simulationScenarios").insertOne(scenario);

  return {
    id: result.insertedId,
    ...scenario,
  };
}

// Get saved scenarios
async function getScenarios(userId) {
  const db = getDB();

  const scenarios = await db
    .collection("simulationScenarios")
    .find({ userId })
    .sort({ savedAt: -1 })
    .toArray();

  return scenarios.map((s) => ({
    id: s._id,
    name: s.name,
    month: s.month,
    createdAt: s.createdAt,
    results: s.results,
  }));
}

// Delete scenario
async function deleteScenario(userId, scenarioId) {
  const db = getDB();
  const { ObjectId } = await import("mongodb");

  const result = await db
    .collection("simulationScenarios")
    .deleteOne({
      _id: new ObjectId(scenarioId),
      userId,
    });

  if (result.deletedCount === 0) {
    throw new Error("Scenario not found");
  }

  return true;
}

export { getCategorySpending, simulateSpending, saveScenario, getScenarios, deleteScenario };
