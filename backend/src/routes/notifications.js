import { Router } from "express";
import { z } from "zod";
import { authMiddleware } from "../middleware/auth.js";
import { getDB } from "../lib/mongo.js";
import { sendEmail, generateMonthlyReportEmail } from "../services/emailService.js";
import { sendMonthlyEmailToUser, sendMonthlyEmailsToAllUsers, generateMonthlySummary } from "../services/monthlyEmailService.js";

const notificationRouter = Router();

notificationRouter.use(authMiddleware);

const preferencesSchema = z.object({
  alerts: z.object({
    budgetExceeded: z
      .object({
        enabled: z.boolean(),
        threshold: z.number(),
      })
      .optional(),
    monthlyReport: z
      .object({
        enabled: z.boolean(),
        day: z.number(),
      })
      .optional(),
    subscriptionReminder: z
      .object({
        enabled: z.boolean(),
        daysAhead: z.number(),
      })
      .optional(),
    highSpending: z
      .object({
        enabled: z.boolean(),
        threshold: z.number(),
      })
      .optional(),
    goalMilestone: z
      .object({
        enabled: z.boolean(),
      })
      .optional(),
  }),
});

// ✅ Get notification preferences
notificationRouter.get("/preferences", async (req, res) => {
  try {
    const db = getDB();

    const prefs = await db.collection("notificationPreferences").findOne({
      userId: req.userId,
    });

    if (!prefs) {
      return res.status(404).json({
        error: "Preferences not found",
      });
    }

    res.json({
      email: prefs.email,
      alerts: prefs.alerts,
    });
  } catch (e) {
    console.error("GET PREFERENCES ERROR:", e);
    res.status(500).json({
      error: "Failed to fetch preferences",
    });
  }
});

// ✅ Update notification preferences
notificationRouter.patch("/preferences", async (req, res) => {
  try {
    const data = preferencesSchema.parse(req.body);
    const db = getDB();

    const result = await db.collection("notificationPreferences").updateOne(
      { userId: req.userId },
      {
        $set: {
          alerts: data.alerts,
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        error: "Preferences not found",
      });
    }

    res.json({
      success: true,
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({
        error: e.errors[0]?.message,
      });
    }

    console.error("UPDATE PREFERENCES ERROR:", e);
    res.status(500).json({
      error: "Failed to update preferences",
    });
  }
});

// ✅ Get notification history
notificationRouter.get("/history", async (req, res) => {
  try {
    const db = getDB();

    const logs = await db
      .collection("notificationLogs")
      .find({ userId: req.userId })
      .sort({ sentAt: -1 })
      .limit(20)
      .toArray();

    res.json(
      logs.map((log) => ({
        id: log._id,
        type: log.type,
        subject: log.subject,
        sentAt: log.sentAt,
        read: log.read,
      }))
    );
  } catch (e) {
    console.error("GET HISTORY ERROR:", e);
    res.status(500).json({
      error: "Failed to fetch history",
    });
  }
});

// ✅ Send test email
notificationRouter.post("/send-test", async (req, res) => {
  try {
    const db = getDB();

    const user = await db.collection("users").findOne({
      _id: req.userId,
    });

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    const htmlContent = `
      <html>
        <body style="font-family: Arial, sans-serif; color: #333;">
          <h2>Test Email from Finsight</h2>
          <p>Hello ${user.firstName || "User"},</p>
          <p>This is a test email to verify your notification settings are working correctly.</p>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Status:</strong> ✓ Connected and working</p>
          </div>
          <p>You can now receive financial alerts and reports. Check your notification preferences to customize which alerts you want to receive.</p>
          <a href="https://finsight.local/profile" style="color: #22c55e; text-decoration: none;">Go to Settings →</a>
        </body>
      </html>
    `;

    await sendEmail(user.email, "Finsight Test Email", htmlContent);

    res.json({
      success: true,
      message: "Test email sent successfully",
    });
  } catch (e) {
    console.error("SEND TEST ERROR:", e);
    res.status(500).json({
      error: "Failed to send test email",
    });
  }
});

// ✅ Send monthly email to current user (for testing)
notificationRouter.post("/send-monthly-email", async (req, res) => {
  try {
    const db = getDB();

    const user = await db.collection("users").findOne({
      _id: req.userId,
    });

    if (!user || !user.email) {
      return res.status(404).json({
        error: "User or email not found",
      });
    }

    const userEmail = {
      user: {
        email: user.email,
        firstName: user.firstName || "User",
      },
    };

    await sendMonthlyEmailToUser(req.userId.toString(), userEmail);

    res.json({
      success: true,
      message: "Monthly email sent successfully",
      email: user.email,
    });
  } catch (e) {
    console.error("SEND MONTHLY EMAIL ERROR:", e);
    res.status(500).json({
      error: "Failed to send monthly email",
    });
  }
});

// ✅ Send monthly emails to all users (admin endpoint)
notificationRouter.post("/send-monthly-emails-all", async (req, res) => {
  try {
    // Check if user is admin (can add proper auth check later)
    // For now, anyone can call this - you should add admin middleware

    const results = await sendMonthlyEmailsToAllUsers();

    res.json({
      success: true,
      message: "Monthly emails process started",
      results,
    });
  } catch (e) {
    console.error("SEND MONTHLY EMAILS ALL ERROR:", e);
    res.status(500).json({
      error: "Failed to send monthly emails",
    });
  }
});

// ✅ TEST EMAIL FEATURE - Comprehensive test to verify email functionality
notificationRouter.get("/test-email-feature", async (req, res) => {
  try {
    console.log("🧪 Starting comprehensive email test...");

    const db = getDB();
    const userId = req.userId;

    // Step 1: Verify SMTP Configuration
    const smtpConfig = {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      user: process.env.SMTP_USER,
      from: process.env.SMTP_FROM,
      configured: !!(
        process.env.SMTP_HOST &&
        process.env.SMTP_PORT &&
        process.env.SMTP_USER &&
        process.env.SMTP_PASSWORD
      ),
    };

    console.log("📧 SMTP Config:", smtpConfig);

    if (!smtpConfig.configured) {
      return res.status(400).json({
        success: false,
        error: "SMTP not configured",
        details: "Missing SMTP_HOST, SMTP_PORT, SMTP_USER, or SMTP_PASSWORD in .env",
        smtpConfig,
      });
    }

    // Step 2: Get user information
    const user = await db.collection("users").findOne({ _id: userId });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    if (!user.email) {
      return res.status(400).json({
        success: false,
        error: "User email not configured",
        message: "Please update your profile with an email address",
      });
    }

    console.log("👤 User found:", { email: user.email, firstName: user.firstName });

    // Step 3: Generate monthly summary
    const summary = await generateMonthlySummary(userId, 0); // Current month

    console.log("📊 Summary generated:", summary);

    // Step 4: Generate email HTML
    const emailHtml = generateMonthlyReportEmail(summary, summary.categoryBreakdown, user.firstName);

    console.log("📝 Email HTML generated, length:", emailHtml.length);

    // Step 5: Send test email
    console.log("📤 Sending email to:", user.email);
    const emailResult = await sendEmail(
      user.email,
      "🧪 TEST: Your Monthly Financial Report",
      emailHtml
    );

    console.log("✅ Email sent successfully!");

    res.json({
      success: true,
      message: "Email feature test completed successfully!",
      details: {
        smtpConfigured: smtpConfig.configured,
        userEmail: user.email,
        emailSent: true,
        messageId: emailResult.messageId,
        summary: {
          income: summary.income,
          expenses: summary.expenses,
          savings: summary.savings,
          savingsRate: `${summary.savingsRate.toFixed(1)}%`,
          topCategories: summary.categoryBreakdown.slice(0, 3),
          transactionCount: summary.transactionCount,
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (e) {
    console.error("❌ EMAIL TEST ERROR:", e);
    res.status(500).json({
      success: false,
      error: "Email test failed",
      message: e.message,
      details: e,
    });
  }
});

export { notificationRouter };
