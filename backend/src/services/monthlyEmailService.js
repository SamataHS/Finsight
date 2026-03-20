import { getDB } from "../lib/mongo.js";
import { sendEmail, generateMonthlyReportEmail } from "./emailService.js";

/**
 * Generate monthly summary for a user
 * @param {string} userId - User ID
 * @param {number} monthsAgo - How many months back (0 = current month)
 * @returns {Promise<Object>} - Summary with income, expenses, savings
 */
async function generateMonthlySummary(userId, monthsAgo = 0) {
  const db = getDB();

  // Calculate month range
  const d = new Date();
  d.setMonth(d.getMonth() - monthsAgo);
  const year = d.getFullYear();
  const month = d.getMonth();

  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59);

  // Get transactions for this month
  const transactions = await db
    .collection("transactions")
    .find({
      userId,
      date: { $gte: start, $lte: end },
    })
    .toArray();

  // Calculate summary
  let totalIncome = 0;
  let totalExpense = 0;
  const expenseByCategory = {};

  transactions.forEach((tx) => {
    if (tx.type === "income") {
      totalIncome += tx.amount;
    } else {
      totalExpense += tx.amount;
      expenseByCategory[tx.category] = (expenseByCategory[tx.category] || 0) + tx.amount;
    }
  });

  const savings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? (savings / totalIncome) * 100 : 0;

  // Format category breakdown
  const categoryBreakdown = Object.entries(expenseByCategory)
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);

  return {
    income: totalIncome,
    expenses: totalExpense,
    savings,
    savingsRate,
    categoryBreakdown,
    transactionCount: transactions.length,
    monthYear: new Date(year, month).toLocaleString("en-IN", { month: "long", year: "numeric" }),
  };
}

/**
 * Send monthly email to a specific user
 * @param {string} userId - User ID
 * @param {Object} userEmail - User email object {userId, user {email, firstName}}
 * @returns {Promise<Object>} - Email send result
 */
async function sendMonthlyEmailToUser(userId, userEmail) {
  try {
    if (!userEmail.user?.email) {
      console.warn(`User ${userId} has no email address, skipping monthly email`);
      return null;
    }

    // Generate last month's summary (previous month from today)
    const summary = await generateMonthlySummary(userId, 1);

    // Generate email
    const htmlContent = generateMonthlyReportEmail(
      summary,
      summary.categoryBreakdown,
      userEmail.user?.firstName || "User"
    );

    // Send email
    const result = await sendEmail(
      userEmail.user.email,
      `Your Monthly Financial Report - ${summary.monthYear}`,
      htmlContent
    );

    console.log(`✅ Monthly email sent to ${userEmail.user.email}`);
    return result;
  } catch (error) {
    console.error(`❌ Failed to send monthly email to user ${userId}:`, error);
    throw error;
  }
}

/**
 * Send monthly emails to all users
 * Called manually or via cron job on the 1st of each month
 * @returns {Promise<Object>} - Summary of emails sent
 */
async function sendMonthlyEmailsToAllUsers() {
  const db = getDB();

  try {
    console.log("📧 Starting monthly email sending process...");

    // Get all users with emails
    const users = await db
      .collection("users")
      .find({ "email": { $exists: true, $ne: null } })
      .toArray();

    console.log(`Found ${users.length} users to email`);

    const results = {
      total: users.length,
      successful: 0,
      failed: 0,
      errors: [],
    };

    // Send email to each user
    for (const user of users) {
      try {
        const userEmail = {
          user: {
            email: user.email,
            firstName: user.firstName || "User",
          },
        };

        await sendMonthlyEmailToUser(user._id.toString(), userEmail);
        results.successful++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          userId: user._id.toString(),
          email: user.email,
          error: error.message,
        });
      }
    }

    console.log(`✅ Monthly email process complete: ${results.successful} sent, ${results.failed} failed`);
    return results;
  } catch (error) {
    console.error("❌ Monthly email process failed:", error);
    throw error;
  }
}

export {
  generateMonthlySummary,
  sendMonthlyEmailToUser,
  sendMonthlyEmailsToAllUsers,
};
