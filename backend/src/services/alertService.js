import { getDB } from "../lib/mongo.js";
import {
  sendEmail,
  generateBudgetExceededEmail,
  generateMonthlyReportEmail,
  generateHighSpendingEmail,
} from "./emailService.js";

// Check budget exceeded and alert
async function checkBudgetExceeded(userId, userEmail, preferences) {
  try {
    if (!preferences.alerts.budgetExceeded.enabled) return;

    const db = getDB();
    const currentMonth = new Date();
    const [year, month] = [currentMonth.getFullYear(), String(currentMonth.getMonth() + 1).padStart(2, "0")];
    const monthStr = `${year}-${month}`;

    // Get budgets and actual spending
    const budgets = await db
      .collection("budgets")
      .find({
        userId,
        month: monthStr,
      })
      .toArray();

    const transactions = await db
      .collection("transactions")
      .find({
        userId,
        type: "expense",
        date: {
          $gte: new Date(year, parseInt(month) - 1, 1),
          $lte: new Date(year, parseInt(month), 0, 23, 59, 59),
        },
      })
      .toArray();

    const spending = {};
    transactions.forEach((tx) => {
      spending[tx.category] = (spending[tx.category] || 0) + tx.amount;
    });

    // Check each budget
    for (const budget of budgets) {
      const spent = spending[budget.category] || 0;
      const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

      if (
        percentage >= preferences.alerts.budgetExceeded.threshold &&
        percentage >= 100
      ) {
        // Send alert
        const htmlContent = generateBudgetExceededEmail(
          budget.category,
          spent,
          budget.amount,
          percentage - 100
        );

        await sendEmail(userEmail, `Budget Alert: ${budget.category} Exceeded`, htmlContent);

        // Log notification
        await db.collection("notificationLogs").insertOne({
          userId,
          type: "budgetExceeded",
          recipient: userEmail,
          subject: `Budget Alert: ${budget.category} Exceeded`,
          sentAt: new Date(),
          metadata: { category: budget.category, spent, budgeted: budget.amount },
        });
      }
    }
  } catch (e) {
    console.error("Budget check error:", e);
  }
}

// Generate and send monthly report
async function generateMonthlyReport(userId, userEmail) {
  try {
    const db = getDB();
    const currentMonth = new Date();
    const [year, month] = [currentMonth.getFullYear(), String(currentMonth.getMonth() + 1).padStart(2, "0")];

    // Get transactions for current month
    const transactions = await db
      .collection("transactions")
      .find({
        userId,
        date: {
          $gte: new Date(year, parseInt(month) - 1, 1),
          $lte: new Date(year, parseInt(month), 0, 23, 59, 59),
        },
      })
      .toArray();

    let income = 0,
      expenses = 0;
    transactions.forEach((tx) => {
      if (tx.type === "income") {
        income += tx.amount;
      } else {
        expenses += tx.amount;
      }
    });

    const savings = income - expenses;
    const savingsRate = income > 0 ? (savings / income) * 100 : 0;

    const summary = { income, expenses, savings, savingsRate };
    const htmlContent = generateMonthlyReportEmail(summary);

    await sendEmail(userEmail, "Your Monthly Financial Report", htmlContent);

    // Log notification
    await db.collection("notificationLogs").insertOne({
      userId,
      type: "monthlyReport",
      recipient: userEmail,
      subject: "Your Monthly Financial Report",
      sentAt: new Date(),
      metadata: summary,
    });
  } catch (e) {
    console.error("Monthly report error:", e);
  }
}

// Check for high spending
async function checkHighSpending(userId, userEmail, preferences) {
  try {
    if (!preferences.alerts.highSpending.enabled) return;

    const db = getDB();
    const currentMonth = new Date();
    const [year, month] = [currentMonth.getFullYear(), String(currentMonth.getMonth() + 1).padStart(2, "0")];

    const transactions = await db
      .collection("transactions")
      .find({
        userId,
        type: "expense",
        date: {
          $gte: new Date(year, parseInt(month) - 1, 1),
          $lte: new Date(year, parseInt(month), 0, 23, 59, 59),
        },
      })
      .toArray();

    const spending = {};
    transactions.forEach((tx) => {
      spending[tx.category] = (spending[tx.category] || 0) + tx.amount;
    });

    // Check each category
    for (const [category, amount] of Object.entries(spending)) {
      if (amount > preferences.alerts.highSpending.threshold) {
        const htmlContent = generateHighSpendingEmail(category, amount);

        await sendEmail(userEmail, `High Spending Alert: ${category}`, htmlContent);

        await db.collection("notificationLogs").insertOne({
          userId,
          type: "highSpending",
          recipient: userEmail,
          subject: `High Spending Alert: ${category}`,
          sentAt: new Date(),
          metadata: { category, amount },
        });
      }
    }
  } catch (e) {
    console.error("High spending check error:", e);
  }
}

// Schedule daily alert checks
async function runDailyAlertChecks() {
  try {
    const db = getDB();

    const allUsers = await db
      .collection("notificationPreferences")
      .find({})
      .toArray();

    for (const prefs of allUsers) {
      await checkBudgetExceeded(prefs.userId, prefs.email, prefs);
      await checkHighSpending(prefs.userId, prefs.email, prefs);
    }

    console.log("Daily alert checks completed");
  } catch (e) {
    console.error("Daily checks error:", e);
  }
}

// Schedule monthly report checks
async function runMonthlyReportChecks() {
  try {
    const db = getDB();

    const allUsers = await db
      .collection("notificationPreferences")
      .find({
        "alerts.monthlyReport.enabled": true,
      })
      .toArray();

    for (const prefs of allUsers) {
      await generateMonthlyReport(prefs.userId, prefs.email);
    }

    console.log("Monthly report checks completed");
  } catch (e) {
    console.error("Monthly checks error:", e);
  }
}

export { checkBudgetExceeded, generateMonthlyReport, checkHighSpending, runDailyAlertChecks, runMonthlyReportChecks };
