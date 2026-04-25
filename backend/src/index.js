import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { connectMongo } from "./lib/mongo.js";
import { startMonthlyEmailScheduler } from "./services/schedulerService.js";
import { sendEmail } from "./services/emailService.js";

import { authRouter } from "./routes/auth.js";
import { transactionRouter } from "./routes/transactions.js";
import { budgetRouter } from "./routes/budgets.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { aiRouter } from "./routes/ai.js";
import { goalRouter } from "./routes/goals.js";
import { chatRouter } from "./routes/chat.js";
import { subscriptionRouter } from "./routes/subscriptions.js";
import { uploadRouter } from "./routes/uploads.js";
import { simulatorRouter } from "./routes/simulator.js";
import { notificationRouter } from "./routes/notifications.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

app.use(express.json());

// ✅ PUBLIC: Test email endpoint (no authentication required)
app.get("/api/notifications/test-email-simple", async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email parameter required",
        message: "Usage: /api/notifications/test-email-simple?email=your@email.com",
      });
    }

    // Verify SMTP is configured
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
      return res.status(400).json({
        success: false,
        error: "SMTP not configured",
        details: "Check your .env file for SMTP settings",
      });
    }

    // Send a simple test email
    const htmlContent = `
      <html>
        <body style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
          <h2 style="color: #22c55e;">✅ Finsight Email Test Successful</h2>
          <p>Hello,</p>
          <p>This email confirms that your Finsight email service is working correctly!</p>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p><strong>Email Address:</strong> ${email}</p>
            <p><strong>Status:</strong> ✓ Connected and working</p>
            <p><strong>Test Time:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <p>You will receive monthly financial reports automatically on the 1st of each month.</p>
          <a href="https://finsight.local/profile" style="color: #22c55e; text-decoration: none; font-weight: bold;">Go to Finsight →</a>
        </body>
      </html>
    `;

    const result = await sendEmail(email, "✅ Finsight Email Test - Success", htmlContent);

    res.json({
      success: true,
      message: "Test email sent successfully!",
      email: email,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    console.error("SIMPLE EMAIL TEST ERROR:", e);
    res.status(500).json({
      success: false,
      error: "Failed to send test email",
      message: e.message,
    });
  }
});

app.use("/api/auth", authRouter);
app.use("/api/transactions", transactionRouter);
app.use("/api/budgets", budgetRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/ai", aiRouter);
app.use("/api/goals", goalRouter);
app.use("/api/chat", chatRouter);
app.use("/api/subscriptions", subscriptionRouter);
app.use("/api/uploads", uploadRouter);
app.use("/api/simulator", simulatorRouter);
app.use("/api/notifications", notificationRouter);

app.get("/api/health", (_, res) => {
  res.json({
    status: "ok",
    message: "API running",
  });
});

async function main() {
  try {
    await connectMongo();

    // Start monthly email scheduler
    startMonthlyEmailScheduler();

    app.listen(PORT, () => {
      console.log(`🚀 Finsight API running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Mongo connection failed", err);
  }
}

main();