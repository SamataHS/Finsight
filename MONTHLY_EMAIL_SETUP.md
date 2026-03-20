# Monthly Email Service Setup - Complete Guide

## What's Been Configured

### 1. **Automatic Monthly Emails**
✅ Emails are sent **automatically on the 1st of each month at 6:00 AM UTC**

### 2. **Enhanced Email Template**
- Income summary
- Expense summary
- Savings amount
- Savings rate percentage
- Top 5 spending categories with breakdown
- Quick financial tips
- Beautiful HTML design with color-coded cards

### 3. **API Endpoints**

**Send monthly email to yourself (for testing):**
```
POST /api/notifications/send-monthly-email
Authorization: Bearer {your-token}
```

**Send monthly emails to all users (admin only):**
```
POST /api/notifications/send-monthly-emails-all
```

## How It Works

### Backend Services Created:
1. **monthlyEmailService.js** - Generates summaries and sends emails
2. **schedulerService.js** - Manages cron jobs for automatic scheduling
3. **Enhanced emailService.js** - Beautiful HTML email template

### Automatic Scheduling:
- Runs on the **1st of every month at 6:00 AM UTC**
- Sends emails based on *previous month's* data
- Example: On April 1st → Sends March summary

## Testing the Feature

### 1. Test Your Own Email
```bash
curl -X POST http://localhost:3002/api/notifications/send-monthly-email \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

Expected response:
```json
{
  "success": true,
  "message": "Monthly email sent successfully",
  "email": "your.email@example.com"
}
```

### 2. Test Sending to All Users (Manual Trigger)
```bash
curl -X POST http://localhost:3002/api/notifications/send-monthly-emails-all \
  -H "Content-Type: application/json"
```

Expected response:
```json
{
  "success": true,
  "message": "Monthly emails process started",
  "results": {
    "total": 5,
    "successful": 5,
    "failed": 0,
    "errors": []
  }
}
```

## Email Contents

Each user receives:
- **Summary Stats**: Income, Expenses, Savings, Savings Rate
- **Top Categories**: Shows their top 5 spending categories with amounts
- **Financial Tips**: Best practices for money management
- **Dashboard Link**: Direct link to view full dashboard

## Required Configuration

Make sure your **.env** has these email settings:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password
SMTP_FROM=Finsight <noreply@finsight.local>
```

## Auto-Scheduling Details

- **Frequency**: Monthly (1st of each month)
- **Time**: 6:00 AM UTC
- **Cron Pattern**: `0 6 1 * *`
- **Data**: Summarizes *previous* month's transactions

## Frontend Integration (Optional)

If you want to add a button in the frontend to send test emails:

```jsx
// In your Profile/Settings page
<button onClick={async () => {
  const response = await api.post('/notifications/send-monthly-email');
  toast.success('Test email sent!');
}}>
  Test Monthly Email
</button>
```

## Troubleshooting

### Emails not sending?
1. Check SMTP credentials in `.env`
2. Verify users have email addresses in database
3. Check backend logs for send errors

### Check scheduler status?
Add this endpoint to test:
```bash
GET /api/notifications/scheduler-status
```

### Want to disable emails temporarily?
Comment out this line in `src/index.js`:
```js
// startMonthlyEmailScheduler();
```

## Next Steps

1. **Restart backend** to activate the scheduler:
   ```bash
   npm run dev
   ```

2. **Test with your own email** using the endpoint above

3. **Verify email settings** - Send a test email from Settings/Profile

4. **Monitor logs** - Check backend console for "Monthly email scheduler started"

Emails should now be sending automatically on the 1st of each month! 🎉
