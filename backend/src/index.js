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

/* ================================
   ✅ FIXED CORS (PRODUCTION SAFE)
================================ */
const allowedOrigins = [
  "http://localhost:5173",
  "https://finsi.netlify.app"
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log("Blocked by CORS:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json());

/* ================================
   EMAIL TEST ROUTE
================================ */
app.get("/api/notifications/test-email-simple", async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email parameter required",
      });
    }

    if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
      return res.status(400).json({
        success: false,
        error: "SMTP not configured",
      });
    }

    const htmlContent = `
      <html>
        <body style="font-family: Arial; padding: 20px;">
          <h2 style="color: green;">✅ Finsight Email Test Successful</h2>
          <p>Email: ${email}</p>
          <p>Status: Working fine 🚀</p>
          <p>Time: ${new Date().toLocaleString()}</p>
        </body>
      </html>
    `;

    await sendEmail(email, "Finsight Email Test", htmlContent);

    res.json({
      success: true,
      message: "Email sent successfully",
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: "Email failed",
    });
  }
});

/* ================================
   ROUTES
================================ */
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

/* ================================
   HEALTH CHECK
================================ */
app.get("/api/health", (_, res) => {
  res.json({
    status: "ok",
    message: "API running 🚀",
  });
});

/* ================================
   START SERVER
================================ */
async function main() {
  try {
    await connectMongo();
    console.log("MongoDB connected");

    startMonthlyEmailScheduler();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

  } catch (err) {
    console.error("Mongo connection failed", err);
  }
}

main();