import { getDB } from "../lib/mongo.js";
import { ObjectId } from "mongodb";

// Analyze transactions for recurring patterns
async function analyzeRecurringPatterns(userId) {
  const db = getDB();

  // Get last 12 months of transactions
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const transactions = await db
    .collection("transactions")
    .find({
      userId,
      type: "expense",
      date: { $gte: twelveMonthsAgo },
    })
    .sort({ date: 1 })
    .toArray();

  // Get existing subscriptions (to avoid duplicates)
  const existing = await db
    .collection("subscriptions")
    .find({ userId })
    .toArray();

  const existingNames = new Set(existing.map((s) => s.name.toLowerCase()));

  // Group by description and amount
  const patterns = {};

  transactions.forEach((tx) => {
    const key = `${tx.description || "Unknown"}|${tx.amount}`;
    if (!patterns[key]) {
      patterns[key] = [];
    }
    patterns[key].push(tx.date);
  });

  // Detect patterns
  const detected = [];

  for (const [key, dates] of Object.entries(patterns)) {
    if (dates.length < 3) continue; // Need at least 3 occurrences

    const [description, amount] = key.split("|");
    const amountNum = parseFloat(amount);

    if (existingNames.has(description.toLowerCase())) {
      continue; // Already tracked
    }

    // Analyze pattern
    const intervals = [];
    for (let i = 1; i < dates.length; i++) {
      const diffDays = Math.floor((dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24));
      intervals.push(diffDays);
    }

    // Determine frequency and confidence
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((sum, interval) => {
      return sum + Math.pow(interval - avgInterval, 2);
    }, 0) / intervals.length;
    const stdDev = Math.sqrt(variance);

    let frequency, confidence;

    if (avgInterval < 2) {
      frequency = "daily";
      confidence = Math.max(0, 100 - stdDev * 5);
    } else if (avgInterval < 10) {
      frequency = "weekly";
      confidence = Math.max(0, 100 - stdDev * 3);
    } else if (avgInterval < 20) {
      frequency = "biweekly";
      confidence = Math.max(0, 100 - stdDev * 3);
    } else if (avgInterval < 45) {
      frequency = "monthly";
      confidence = Math.max(0, 100 - stdDev * 2);
    } else if (avgInterval < 120) {
      frequency = "quarterly";
      confidence = Math.max(0, 100 - stdDev * 2);
    } else {
      frequency = "yearly";
      confidence = Math.max(0, 100 - stdDev);
    }

    // Only include if confidence is high enough
    if (confidence >= 60) {
      detected.push({
        name: description,
        amount: amountNum,
        frequency,
        confidence: Math.round(confidence),
        category: "Entertainment", // Default, user can change
        lastDate: dates[dates.length - 1],
        occurrences: dates.length,
      });
    }
  }

  return detected.sort((a, b) => b.confidence - a.confidence);
}

// Get all subscriptions with analytics
async function getSubscriptions(userId) {
  const db = getDB();

  const subscriptions = await db
    .collection("subscriptions")
    .find({ userId })
    .sort({ nextDueDate: 1 })
    .toArray();

  return subscriptions.map((s) => ({
    id: s._id,
    name: s.name,
    amount: s.amount,
    frequency: s.frequency,
    category: s.category,
    status: s.status,
    confidence: s.confidence,
    nextDueDate: s.nextDueDate,
    lastDetectedDate: s.lastDetectedDate,
    isManual: s.isManual,
  }));
}

// Get subscription analysis (total spending, by frequency)
async function getSubscriptionAnalysis(userId) {
  const db = getDB();

  const subscriptions = await db
    .collection("subscriptions")
    .find({ userId, status: "active" })
    .toArray();

  let totalMonthly = 0;
  let totalYearly = 0;
  const byFrequency = {};

  subscriptions.forEach((s) => {
    if (!byFrequency[s.frequency]) {
      byFrequency[s.frequency] = { count: 0, totalAmount: 0 };
    }
    byFrequency[s.frequency].count++;
    byFrequency[s.frequency].totalAmount += s.amount;

    // Convert to monthly for comparison
    let monthlyAmount = s.amount;
    switch (s.frequency) {
      case "daily":
        monthlyAmount = s.amount * 30;
        break;
      case "weekly":
        monthlyAmount = s.amount * 4.33;
        break;
      case "biweekly":
        monthlyAmount = s.amount * 2.165;
        break;
      case "quarterly":
        monthlyAmount = s.amount / 3;
        break;
      case "yearly":
        monthlyAmount = s.amount / 12;
        break;
    }
    totalMonthly += monthlyAmount;
    totalYearly += monthlyAmount * 12;
  });

  return {
    count: subscriptions.length,
    totalMonthly: Math.round(totalMonthly * 100) / 100,
    totalYearly: Math.round(totalYearly * 100) / 100,
    byFrequency,
    potentialSavings: Math.round(totalYearly * 0.20 * 100) / 100, // Estimate 20% could be cancelled
  };
}

// Add subscription manually
async function addSubscription(userId, subscriptionData) {
  const db = getDB();

  const subscription = {
    userId,
    name: subscriptionData.name,
    amount: subscriptionData.amount,
    frequency: subscriptionData.frequency,
    category: subscriptionData.category,
    dayOfCycle: subscriptionData.dayOfCycle || 1,
    startDate: new Date(),
    nextDueDate: calculateNextDueDate(new Date(), subscriptionData.frequency, subscriptionData.dayOfCycle),
    status: "active",
    confidence: 100,
    isManual: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await db.collection("subscriptions").insertOne(subscription);

  return {
    id: result.insertedId,
    ...subscription,
  };
}

// Update subscription
async function updateSubscription(userId, subscriptionId, updates) {
  const db = getDB();

  const result = await db
    .collection("subscriptions")
    .updateOne(
      {
        _id: new ObjectId(subscriptionId),
        userId,
      },
      {
        $set: {
          ...updates,
          updatedAt: new Date(),
        },
      }
    );

  if (result.matchedCount === 0) {
    throw new Error("Subscription not found");
  }

  return result;
}

// Delete subscription
async function deleteSubscription(userId, subscriptionId) {
  const db = getDB();

  const result = await db
    .collection("subscriptions")
    .deleteOne({
      _id: new ObjectId(subscriptionId),
      userId,
    });

  if (result.deletedCount === 0) {
    throw new Error("Subscription not found");
  }

  return true;
}

// Get subscription spending trends
async function getSubscriptionTrends(userId, subscriptionId) {
  const db = getDB();

  const subscription = await db
    .collection("subscriptions")
    .findOne({
      _id: new ObjectId(subscriptionId),
      userId,
    });

  if (!subscription) {
    throw new Error("Subscription not found");
  }

  // Get related transactions
  const transactions = await db
    .collection("transactions")
    .find({
      userId,
      description: subscription.name,
      type: "expense",
    })
    .sort({ date: -1 })
    .limit(24) // Last 2 years
    .toArray();

  // Group by month
  const monthlyData = {};
  transactions.forEach((tx) => {
    const monthKey = tx.date.toISOString().substring(0, 7);
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { count: 0, total: 0 };
    }
    monthlyData[monthKey].count++;
    monthlyData[monthKey].total += tx.amount;
  });

  // Convert to array
  const trends = Object.entries(monthlyData)
    .map(([month, data]) => ({
      month,
      amount: Math.round(data.total * 100) / 100,
      count: data.count,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  return {
    name: subscription.name,
    trends,
    avgAmount: subscription.amount,
    frequency: subscription.frequency,
  };
}

// Helper: Calculate next due date
function calculateNextDueDate(baseDate, frequency, dayOfCycle = 1) {
  const nextDate = new Date(baseDate);

  switch (frequency) {
    case "daily":
      nextDate.setDate(nextDate.getDate() + 1);
      break;
    case "weekly":
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case "biweekly":
      nextDate.setDate(nextDate.getDate() + 14);
      break;
    case "monthly":
      nextDate.setMonth(nextDate.getMonth() + 1);
      nextDate.setDate(Math.min(dayOfCycle, 28));
      break;
    case "quarterly":
      nextDate.setMonth(nextDate.getMonth() + 3);
      nextDate.setDate(Math.min(dayOfCycle, 28));
      break;
    case "yearly":
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      nextDate.setDate(Math.min(dayOfCycle, 28));
      break;
  }

  return nextDate;
}

export {
  analyzeRecurringPatterns,
  getSubscriptions,
  getSubscriptionAnalysis,
  addSubscription,
  updateSubscription,
  deleteSubscription,
  getSubscriptionTrends,
};
