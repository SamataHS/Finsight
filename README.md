# 💰 Finsight - AI-Powered Personal Finance Management

> A full-stack financial management platform with automatic transaction categorization, AI-powered insights, email automation, and comprehensive financial analytics.

[![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)](#)
[![Node.js](https://img.shields.io/badge/Node.js-16+-green)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6+-green)](https://www.mongodb.com/)
[![React](https://img.shields.io/badge/React-18+-blue)](https://react.dev/)
[![License](https://img.shields.io/badge/License-MIT-yellow)](#)

---

## Table of Contents
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation & Setup](#-installation--setup)
- [Environment Variables](#-environment-variables)
- [Running the Project](#-running-the-project)
- [API Endpoints](#-api-endpoints)
- [Usage Guide](#-usage-guide)
- [Database Schema](#-database-schema)
- [Troubleshooting](#-troubleshooting)

---

## ✨ Features

### 1. **User Authentication** 🔐
- JWT-based authentication
- Bcrypt password hashing (12 salt rounds)
- User profile management
- Secure session handling

### 2. **Transaction Management** 📊
- Upload bank statements (CSV format)
- Manual transaction entry
- Auto-categorization with AI & 50+ merchant keywords
- Transaction filtering and search
- Complete CRUD operations

### 3. **Intelligent Upload System** 📤
- CSV parsing and validation
- 2-tier categorization:
  - **Tier 1:** Merchant keyword matching (50+ merchants)
  - **Tier 2:** Groq AI fallback for unknown merchants
- Duplicate detection with fuzzy matching
- Support for multiple date formats
- Batch transaction import

### 4. **Budget Management** 💳
- Set monthly budgets per category
- Real-time budget tracking
- Budget exceeded alerts
- Category-wise comparisons
- Visual progress indicators

### 5. **Dashboard Analytics** 📈
- Financial summary (Income, Expenses, Savings)
- Spending breakdown by category
- Income vs Expense visualization
- Savings rate calculation
- Interactive charts and graphs

### 6. **AI-Powered Features** 🤖
- **Behavior Analysis:** Compare spending patterns
- **Savings Suggestions:** Personalized recommendations
- **Expense Prediction:** Forecast future spending
- **Health Score:** Composite financial score
- **Goal Planning:** AI calculates required savings
- **Risk Alerts:** Spending spike warnings

### 7. **AI Chat Assistant** 💬
- Real-time financial advice
- Context-aware responses
- Conversation history
- Transaction analysis
- Budget optimization tips

### 8. **Email Notifications** 📧
- Monthly financial reports
- Beautiful HTML templates
- Automatic scheduling (1st of month at 6 AM UTC)
- Budget alerts
- High spending notifications

### 9. **Financial Goals** 🎯
- Create and track goals
- Target amounts and dates
- Progress monitoring
- AI-powered planning

### 10. **Additional Features** ✅
- Subscription tracking
- Financial simulator (what-if scenarios)
- Recurring expense templates
- Responsive design
- Toast notifications

---

## 🛠️ Tech Stack

### **Frontend**
```
React 18.3.1          Vite 5.4.10           Tailwind CSS 3.4.14
React Router 6.28     Axios 1.7.7           Recharts 2.13.3
React Dropzone 14     React Markdown 8      React Hot Toast 2.4.1
Lucide React 0.454    PapaParse 5.4.1
```

### **Backend**
```
Node.js + Express 4.21    MongoDB 6.21.0      Mongoose 8.23.0
JWT (jsonwebtoken 9.0.2)  Bcryptjs 2.4.3      Nodemailer 6.9.7
Node-cron 3.0.2           Multer 1.4.5        Axios 1.13.6
Sharp 0.34.5              CSV-parser 3.0.0    Zod 3.23.8
CORS 2.8.5                pdf2pic 3.2.0
```

### **AI & External APIs**
```
Groq API (llama-3.3-70b-versatile)    Gmail SMTP
```

---

## 📦 Prerequisites

- **Node.js** v16 or higher
- **MongoDB** (local or Atlas)
- **npm** or **yarn**
- **Groq API Key** (free at https://groq.com)
- **Gmail Account** (for email notifications)

---

## 🚀 Installation & Setup

### **Step 1: Clone Repository**
```bash
git clone <repository-url>
cd Finsight
```

### **Step 2: Backend Setup**
```bash
cd backend
npm install
```

### **Step 3: Frontend Setup**
```bash
cd ../frontend
npm install
```

### **Step 4: Configure Environment**

Create `backend/.env`:
```env
# Server
PORT=3002
FRONTEND_URL="http://localhost:5173"

# Database
DATABASE_URL=mongodb://localhost:27017/finsight

# JWT
JWT_SECRET="your-secret-key-here"

# Groq API
GROQ_API_KEY=gsk_your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile

# Email (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-16-char-app-password
SMTP_FROM=Finsight <noreply@finsight.local>
MAIL_FROM_NAME=Finsight
```

### **Step 5: Start Services**

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

**Terminal 3 - MongoDB (if local):**
```bash
mongod
```

### **Access Application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3002
- Health Check: http://localhost:3002/api/health

---

## 🔐 Environment Variables

### **Getting Groq API Key**
1. Visit https://console.groq.com
2. Sign up (free)
3. Generate API key
4. Copy to GROQ_API_KEY

### **Getting Gmail App Password**
1. Enable 2-Step at https://myaccount.google.com/security
2. Generate app password at https://myaccount.google.com/apppasswords
3. Select Mail & Windows Computer
4. Copy 16-char password (remove spaces)
5. Paste in SMTP_PASSWORD

### **MongoDB Setup**

**Local:**
```
mongodb://localhost:27017/finsight
```

**MongoDB Atlas:**
```
mongodb+srv://username:password@cluster.mongodb.net/finsight
```

---

## ▶️ Running the Project

**Start Backend & Frontend:**

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev

# Open http://localhost:5173
```

---

## 📡 API Endpoints

### **Authentication** (`/api/auth`)
```
POST   /signup              Create account
POST   /login               User login
GET    /profile             Get profile
PUT    /profile             Update profile
```

### **Transactions** (`/api/transactions`)
```
GET    /                    List transactions
POST   /                    Create transaction
PUT    /:id                 Update transaction
DELETE /:id                 Delete transaction
```

### **Budgets** (`/api/budgets`)
```
GET    /                    List budgets
POST   /                    Create budget
PUT    /:id                 Update budget
DELETE /:id                 Delete budget
```

### **Goals** (`/api/goals`)
```
GET    /                    List goals
POST   /                    Create goal
PUT    /:id                 Update goal
DELETE /:id                 Delete goal
```

### **Dashboard** (`/api/dashboard`)
```
GET    /                    Dashboard summary
GET    /breakdown           Spending breakdown
```

### **Chat** (`/api/chat`)
```
GET    /conversations       Get conversations
POST   /conversations       Create conversation
POST   /messages            Send message
```

### **Uploads** (`/api/uploads`)
```
POST   /csv                 Upload CSV
POST   /statement           Upload statement
```

### **AI** (`/api/ai`)
```
POST   /health-score        Health score
POST   /risk-alerts         Risk alerts
POST   /behavior            Behavior analysis
POST   /suggestions         Suggestions
POST   /predict             Predict expenses
```

### **Email** (`/api/notifications`)
```
GET    /test-email-simple           Test email (no auth)
POST   /send-monthly-email          Send to user
POST   /send-monthly-emails-all     Send to all
```

---

## 📖 Usage Guide

### **1. Create Account**
- Go to http://localhost:5173
- Click "Sign Up"
- Enter email and password

### **2. Upload Transactions**
- Go to Upload section
- Upload CSV with transactions
- Auto-categorization applies
- Review and confirm

### **3. View Dashboard**
- See income, expenses, savings
- View spending by category
- Check AI health score
- Get alerts and tips

### **4. Manage Transactions**
- View all transactions
- Filter by category/date
- Edit or delete manually
- Search merchants

### **5. Set Budgets**
- Create budgets per category
- Track spending
- Get alerts when exceeded

### **6. Track Goals**
- Create financial goals
- Set amount and date
- Monitor progress

### **7. Chat with AI**
- Ask financial questions
- Get personalized advice
- View history

### **8. Test Emails**
```bash
curl "http://localhost:3002/api/notifications/test-email-simple?email=your@email.com"
```

---

## 📁 Project Structure

```
Finsight/
├── frontend/                     # React App
│   ├── src/
│   │   ├── components/          # Reusable components
│   │   ├── pages/               # Page components
│   │   ├── App.jsx              # Main app
│   │   └── main.jsx             # Entry
│   └── package.json
│
├── backend/                      # Express API
│   ├── src/
│   │   ├── routes/              # API routes
│   │   ├── services/            # Business logic
│   │   ├── middleware/          # Express middleware
│   │   ├── lib/                 # DB connection
│   │   └── index.js             # Server
│   ├── .env                     # Config
│   └── package.json
│
└── README.md                    # This file
```

---

## 🗄️ Database Schema

### **users**
```json
{
  "_id": ObjectId,
  "email": String,
  "password": String (hashed),
  "name": String,
  "createdAt": Date
}
```

### **transactions**
```json
{
  "_id": ObjectId,
  "userId": ObjectId,
  "type": "income" | "expense",
  "amount": Number,
  "category": String,
  "description": String,
  "date": Date,
  "createdAt": Date
}
```

### **budgets**
```json
{
  "_id": ObjectId,
  "userId": ObjectId,
  "category": String,
  "amount": Number,
  "month": "YYYY-MM",
  "spent": Number,
  "createdAt": Date
}
```

### **goals**
```json
{
  "_id": ObjectId,
  "userId": ObjectId,
  "name": String,
  "targetAmount": Number,
  "currentAmount": Number,
  "targetDate": Date,
  "status": String,
  "createdAt": Date
}
```

### **chatConversations**
```json
{
  "_id": ObjectId,
  "userId": ObjectId,
  "title": String,
  "messages": Array,
  "context": Object,
  "createdAt": Date
}
```

---

## 🔄 Merchant Categorization

### **Keyword Matching (50+ Merchants)**
- Swiggy/Uber Eats → Food & Dining
- Uber/Ola → Transport
- Amazon/Flipkart → Shopping
- Electricity/Water → Utilities
- Hospital/Pharmacy → Healthcare
- Flight/Hotel → Travel
- School/College → Education
- Stock/Mutual Fund → Investments
- And many more...

### **AI Fallback**
If merchant not recognized, Groq AI analyzes and categorizes

### **Duplicate Detection**
- Exact: date, amount, description match
- Fuzzy: 85%+ similarity (handles OCR typos)

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| MongoDB fails | Start MongoDB: `mongod` |
| SMTP password error | Remove spaces from app password |
| Groq API error | Check `GROQ_API_KEY` in `.env` |
| Port 3002 in use | `lsof -i :3002` → `kill -9 <PID>` |
| CORS errors | Verify `FRONTEND_URL` in `.env` |
| Email not received | Check spam folder |
| Transactions not categorizing | Check Groq API key |

---

## 🧪 Testing

### **Test Email**
```bash
curl "http://localhost:3002/api/notifications/test-email-simple?email=test@example.com"
```

### **Create Account**
```bash
curl -X POST http://localhost:3002/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### **Login**
```bash
curl -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

---

## 🚀 Deployment

### **Backend**
- Heroku, Railway, Render, Vercel
- AWS EC2, Elastic Beanstalk
- DigitalOcean

### **Frontend**
- Vercel (recommended)
- Netlify
- GitHub Pages

### **Database**
- MongoDB Atlas
- Self-hosted MongoDB

---

## 📊 Categories Supported

🍽️ Food & Dining | 🏠 Rent | 💡 Utilities | 🚗 Transport | 🛍️ Shopping | 🎬 Entertainment | ✈️ Travel | 🏥 Healthcare | 📚 Education | 💼 Investments | 💰 Salary | 💻 Freelance | 📌 Other

---

## 🎯 Key Learning Areas

This project demonstrates:
- ✅ Full-stack JavaScript (React + Node.js)
- ✅ REST API design with Express
- ✅ JWT authentication & security
- ✅ MongoDB data modeling
- ✅ AI/LLM API integration
- ✅ Email automation with cron
- ✅ CSV parsing and validation
- ✅ React hooks and patterns
- ✅ Responsive UI design
- ✅ Production-ready code

---

## 📄 License

MIT License

---

**Built with ❤️ for better financial management**

*Last Updated: March 2026*
