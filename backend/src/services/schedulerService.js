/**
 * Monthly Email Scheduler
 * Sends monthly financial reports to all users on the 1st of each month at 6 AM
 */

import cron from "node-cron";
import { sendMonthlyEmailsToAllUsers } from "./monthlyEmailService.js";

let scheduledJob = null;

/**
 * Start the monthly email scheduler
 */
function startMonthlyEmailScheduler() {
  try {
    // Run every 1st of month at 6:00 AM
    // Cron pattern: "0 6 1 * *"
    // Sec Min Hour Day Month DayOfWeek
    // 0    6   1    *   *     (every month on 1st day at 6 AM)

    scheduledJob = cron.schedule("0 6 1 * *", async () => {
      console.log("📧 Monthly email scheduler triggered at", new Date().toISOString());
      try {
        const results = await sendMonthlyEmailsToAllUsers();
        console.log("✅ Monthly emails sent successfully:", results);
      } catch (error) {
        console.error("❌ Monthly email scheduler error:", error);
      }
    });

    console.log("📅 Monthly email scheduler started. Emails will be sent on the 1st of each month at 6:00 AM");
    return true;
  } catch (error) {
    console.error("Failed to start monthly email scheduler:", error);
    return false;
  }
}

/**
 * Stop the monthly email scheduler
 */
function stopMonthlyEmailScheduler() {
  if (scheduledJob) {
    scheduledJob.stop();
    scheduledJob = null;
    console.log("📅 Monthly email scheduler stopped");
    return true;
  }
  return false;
}

/**
 * Get scheduler status
 */
function getSchedulerStatus() {
  return {
    isActive: scheduledJob !== null,
    nextRun: scheduledJob ? "1st of each month at 6:00 AM UTC" : "Not scheduled",
    scheduledJob: scheduledJob ? "Active" : "Inactive",
  };
}

export {
  startMonthlyEmailScheduler,
  stopMonthlyEmailScheduler,
  getSchedulerStatus,
};
