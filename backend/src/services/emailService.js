import nodemailer from "nodemailer";

// Lazy-load transporter to ensure env vars are loaded
let transporter = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }
  return transporter;
}

// Send email
async function sendEmail(recipient, subject, htmlContent) {
  try {
    const transporter = getTransporter();

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || "Finsight <noreply@finsight.local>",
      to: recipient,
      subject,
      html: htmlContent,
    });

    console.log("Email sent:", info.messageId);
    return info;
  } catch (e) {
    console.error("Email error:", e);
    throw e;
  }
}

// Budget Exceeded Template
function generateBudgetExceededEmail(category, spent, budgeted, overPercentage) {
  return `
    <html>
      <body style="font-family: Arial, sans-serif; color: #333;">
        <h2>Budget Alert: ${category}</h2>
        <p>Your <strong>${category}</strong> spending has exceeded your budget this month.</p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <p><strong>Budgeted:</strong> ₹${budgeted.toLocaleString("en-IN")}</p>
          <p><strong>Spent:</strong> ₹${spent.toLocaleString("en-IN")}</p>
          <p><strong>Overage:</strong> ${overPercentage.toFixed(1)}%</p>
        </div>
        <p>Review your transactions and adjust your spending to stay within budget.</p>
        <a href="https://finsight.local/transactions" style="color: #22c55e; text-decoration: none;">View Transactions →</a>
      </body>
    </html>
  `;
}

// Monthly Report Template - Enhanced
function generateMonthlyReportEmail(summary, categoryBreakdown, userName = "User") {
  const topCategories = categoryBreakdown
    .slice(0, 5)
    .map(
      (cat) =>
        `<tr style="border-bottom: 1px solid #ddd;">
          <td style="padding: 10px; text-align: left;">${cat.category}</td>
          <td style="padding: 10px; text-align: right;">₹${cat.total.toLocaleString("en-IN")}</td>
        </tr>`
    )
    .join("");

  return `
    <html>
      <body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0;">📊 Your Monthly Financial Report</h1>
          <p style="margin: 5px 0 0 0; opacity: 0.9;">${new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' })}</p>
        </div>

        <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px;">
          <p>Hi <strong>${userName}</strong>,</p>
          <p>Here's a summary of your financial activity this month:</p>

          <!-- Summary Cards -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0;">
            <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #22c55e;">
              <p style="margin: 0; color: #666; font-size: 12px; text-transform: uppercase;">Income</p>
              <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; color: #22c55e;">₹${summary.income.toLocaleString("en-IN")}</p>
            </div>
            <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #ef4444;">
              <p style="margin: 0; color: #666; font-size: 12px; text-transform: uppercase;">Expenses</p>
              <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; color: #ef4444;">₹${summary.expenses.toLocaleString("en-IN")}</p>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0;">
            <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #06b6d4;">
              <p style="margin: 0; color: #666; font-size: 12px; text-transform: uppercase;">Savings</p>
              <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; color: #06b6d4;">₹${summary.savings.toLocaleString("en-IN")}</p>
            </div>
            <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #8b5cf6;">
              <p style="margin: 0; color: #666; font-size: 12px; text-transform: uppercase;">Savings Rate</p>
              <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; color: #8b5cf6;">${summary.savingsRate.toFixed(1)}%</p>
            </div>
          </div>

          <!-- Top Spending Categories -->
          <h3 style="margin-top: 25px;">Top Spending Categories</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f0f0f0;">
                <th style="padding: 10px; text-align: left; font-weight: bold;">Category</th>
                <th style="padding: 10px; text-align: right; font-weight: bold;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${topCategories}
            </tbody>
          </table>

          <!-- Tips -->
          <div style="background: #e0f2fe; border-left: 4px solid #06b6d4; padding: 15px; border-radius: 4px; margin-top: 20px;">
            <p style="margin: 0 0 10px 0; font-weight: bold; color: #0369a1;">💡 Quick Tips:</p>
            <ul style="margin: 0; padding-left: 20px; color: #0369a1;">
              <li>Track your monthly spending patterns to identify savings opportunities</li>
              <li>Review your largest expense categories and look for optimization chances</li>
              <li>Keep your savings rate above 20% for long-term financial health</li>
            </ul>
          </div>

          <!-- CTA Button -->
          <div style="text-align: center; margin-top: 25px;">
            <a href="https://finsight.local/dashboard" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              View Full Dashboard
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #ddd; margin: 25px 0;">
          <p style="font-size: 12px; color: #999; text-align: center; margin: 0;">
            This is an automated monthly report from Finsight. Stay in control of your finances!
          </p>
        </div>
      </body>
    </html>
  `;
}

// High Spending Alert Template
function generateHighSpendingEmail(category, amount) {
  return `
    <html>
      <body style="font-family: Arial, sans-serif; color: #333;">
        <h2>High Spending Alert</h2>
        <p>Your spending in <strong>${category}</strong> has reached <strong>₹${amount.toLocaleString("en-IN")}</strong> this month. This is higher than usual.</p>
        <p>Consider reviewing these transactions and adjusting your spending.</p>
        <a href="https://finsight.local/transactions" style="color: #22c55e; text-decoration: none;">View Transactions →</a>
      </body>
    </html>
  `;
}

export {
  sendEmail,
  generateBudgetExceededEmail,
  generateMonthlyReportEmail,
  generateHighSpendingEmail,
};
