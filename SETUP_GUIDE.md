# Finsight - Complete Setup & Implementation Guide

## ✅ Project Status
All features are **fully implemented** with proper database connections and security:

### Features Implemented:
1. ✅ **User Authentication** - JWT-based signup/login with bcrypt password hashing
2. ✅ **Transaction Management** - Complete CRUD operations (add, edit, delete)
3. ✅ **Budget System** - Monthly budget tracking with percentage used display
4. ✅ **Dashboard Analytics** - Income/Expense charts and category breakdown
5. ✅ **AI Features** - 6 advanced AI-powered financial insights
6. ✅ **Goals System** - Financial goal creation and tracking with AI planning
7. ✅ **Risk Alerts** - Proactive spending pattern detection

---

## 📋 Prerequisites

### System Requirements:
- Node.js 16+
- MongoDB (local or Atlas)
- npm or yarn

### Install Dependencies:

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

---

## 🔧 Configuration

### 1. Backend Environment Variables
Create/update `backend/.env`:

```env
# Server
PORT=3002

# Database (Update with your MongoDB URL)
DATABASE_URL=mongodb://localhost:27017/finsight
# For MongoDB Atlas: DATABASE_URL=mongodb+srv://user:password@cluster.mongodb.net/finsight

# Authentication
JWT_SECRET="finsight-jwt-secret-change-in-production-2024"

# AI Features (Optional - Leave empty for fallback responses)
OPENAI_API_KEY="your-openai-api-key-here"

# Frontend URL
FRONTEND_URL="http://localhost:5173"
```

### 2. Frontend Environment Variables
Create `frontend/.env` (vite auto-proxies API):

```env
VITE_API_URL=http://localhost:3002
```

---

## 🚀 Running the Application

### Option 1: Separate Terminals

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

### Option 2: From Root (if concurrently is set up)
```bash
npm run dev
```

**Access the application:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3002
- API Health: http://localhost:3002/api/health

---

## 📊 Database Setup

### MongoDB Local Installation:
1. Download MongoDB Community Edition
2. Run MongoDB server: `mongod`
3. Database name: `finsight` (auto-created)

### Collections Created Automatically:
- `users` - User accounts with hashed passwords
- `transactions` - Income/expense records
- `budgets` - Monthly budgets by category
- `goals` - Financial goals
- `recurringtrans` - Recurring transaction templates (optional)

---

## 🧪 Testing the Application

### 1. Test Authentication Flow

**Create a new user:**
```bash
curl -X POST http://localhost:3002/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

Response:
```json
{
  "user": {
    "id": "ObjectId...",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "currency": "INR"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Login:**
```bash
curl -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### 2. Test Transaction CRUD

**Add a transaction (requires Bearer token):**
```bash
curl -X POST http://localhost:3002/api/transactions \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "expense",
    "amount": 500,
    "category": "Food & Dining",
    "description": "Lunch",
    "date": "2024-03-01T12:00:00Z"
  }'
```

**Get transactions:**
```bash
curl -X GET http://localhost:3002/api/transactions \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Get transaction categories:**
```bash
curl -X GET http://localhost:3002/api/transactions/categories
```

### 3. Test Budget System

**Create/Update budget:**
```bash
curl -X POST http://localhost:3002/api/budgets \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "category": "Food & Dining",
    "amount": 5000,
    "month": "2024-03"
  }'
```

**Get budget status:**
```bash
curl -X GET "http://localhost:3002/api/dashboard/budget-status?month=2024-03" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 4. Test Dashboard Analytics

**Get monthly summary:**
```bash
curl -X GET "http://localhost:3002/api/dashboard/summary?months=3" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Get category breakdown:**
```bash
curl -X GET "http://localhost:3002/api/dashboard/category-breakdown?month=2024-03" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 5. Test AI Features

**Spending behavior analysis:**
```bash
curl -X GET "http://localhost:3002/api/ai/behavior?month=2024-03" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Saving suggestions:**
```bash
curl -X GET http://localhost:3002/api/ai/suggestions \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Future expense prediction:**
```bash
curl -X GET "http://localhost:3002/api/ai/predict?months=1" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Financial health score:**
```bash
curl -X GET http://localhost:3002/api/ai/health-score \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Risk alerts:**
```bash
curl -X GET http://localhost:3002/api/ai/risk-alerts \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 6. Test Goals System

**Create goal:**
```bash
curl -X POST http://localhost:3002/api/goals \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Buy Laptop",
    "targetAmount": 80000,
    "currentAmount": 0,
    "targetDate": "2024-12-31",
    "priority": 1
  }'
```

**Get goal plan:**
```bash
curl -X GET "http://localhost:3002/api/ai/goal-plan/GOAL_ID_HERE" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 🔐 Database Security

### Current Implementation:
- ✅ **Password Hashing** - bcrypt with 12 salt rounds
- ✅ **JWT Authentication** - 7-day token expiration
- ✅ **User Data Isolation** - All queries filtered by userId
- ✅ **Data Validation** - Zod schema validation on all inputs
- ✅ **CORS Protection** - Only accept requests from frontend origin

### Recommended Production Updates:
1. Change `JWT_SECRET` to a strong random string
2. Secure `OPENAI_API_KEY` with environment-only access
3. Set MongoDB connection with strong credentials
4. Enable HTTPS/SSL for production
5. Add rate limiting on auth endpoints
6. Add input sanitization for MongoDB injection prevention

---

## 📁 Project Structure

```
Finsight/
├── backend/
│   ├── src/
│   │   ├── index.js                 # Express server entry
│   │   ├── lib/mongo.js             # MongoDB connection
│   │   ├── middleware/
│   │   │   └── auth.js              # JWT verification
│   │   ├── models/                  # Mongoose schemas (reference)
│   │   ├── routes/
│   │   │   ├── auth.js              # Login/signup
│   │   │   ├── transactions.js      # CRUD operations
│   │   │   ├── budgets.js           # Budget management
│   │   │   ├── goals.js             # Goals management
│   │   │   ├── dashboard.js         # Analytics endpoints
│   │   │   └── ai.js                # AI features
│   │   └── services/
│   │       └── aiService.js         # AI logic (OpenAI integration)
│   ├── .env                         # Configuration
│   └── package.json                 # Dependencies
│
├── frontend/
│   ├── src/
│   │   ├── main.jsx                 # React entry
│   │   ├── App.jsx                  # Router setup
│   │   ├── context/AuthContext.jsx  # Auth state
│   │   ├── lib/api.js               # Axios config
│   │   ├── components/
│   │   │   └── Layout.jsx           # Main layout
│   │   └── pages/
│   │       ├── Login.jsx            # Auth page
│   │       ├── Signup.jsx
│   │       ├── Dashboard.jsx        # Analytics page
│   │       ├── Transactions.jsx     # CRUD page
│   │       ├── Budget.jsx           # Budget page
│   │       ├── Goals.jsx            # Goals page
│   │       └── Profile.jsx          # Settings
│   ├── .env                         # Frontend config
│   └── package.json                 # Dependencies
│
├── SETUP_GUIDE.md                   # This file
└── README.md                        # Project overview
```

---

## 🛠️ Troubleshooting

### MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution:** Ensure MongoDB is running (`mongod` command)

### JWT Token Invalid
```
error: "Invalid or expired token"
```
**Solution:**
- Token expires in 7 days
- Ensure `Authorization: Bearer TOKEN` format is correct
- Re-login to get a new token

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::3002
```
**Solution:**
```bash
# Kill process on port 3002
lsof -i :3002
kill -9 <PID>
# Or change PORT in .env
```

### API Not Responding
**Check health endpoint:**
```bash
curl http://localhost:3002/api/health
```

### MongoDB Atlas Connection
**Update DATABASE_URL:**
```env
DATABASE_URL=mongodb+srv://username:password@clustername.mongodb.net/finsight?retryWrites=true&w=majority
```

---

## 🎯 API Endpoints Summary

| Feature | Method | Endpoint | Auth Required |
|---------|--------|----------|---------------|
| **Authentication** |
| Signup | POST | `/api/auth/signup` | No |
| Login | POST | `/api/auth/login` | No |
| Get Profile | GET | `/api/auth/me` | Yes |
| **Transactions** |
| List | GET | `/api/transactions` | Yes |
| Create | POST | `/api/transactions` | Yes |
| Update | PATCH | `/api/transactions/:id` | Yes |
| Delete | DELETE | `/api/transactions/:id` | Yes |
| Categories | GET | `/api/transactions/categories` | No |
| **Budgets** |
| List | GET | `/api/budgets` | Yes |
| Create/Update | POST | `/api/budgets` | Yes |
| Delete | DELETE | `/api/budgets/:id` | Yes |
| **Goals** |
| List | GET | `/api/goals` | Yes |
| Create | POST | `/api/goals` | Yes |
| Update | PATCH | `/api/goals/:id` | Yes |
| Delete | DELETE | `/api/goals/:id` | Yes |
| **Dashboard** |
| Summary | GET | `/api/dashboard/summary` | Yes |
| Category Breakdown | GET | `/api/dashboard/category-breakdown` | Yes |
| Budget Status | GET | `/api/dashboard/budget-status` | Yes |
| **AI Features** |
| Spending Analysis | GET | `/api/ai/behavior` | Yes |
| Saving Tips | GET | `/api/ai/suggestions` | Yes |
| Expense Prediction | GET | `/api/ai/predict` | Yes |
| Health Score | GET | `/api/ai/health-score` | Yes |
| Goal Planning | GET | `/api/ai/goal-plan/:goalId` | Yes |
| Risk Alerts | GET | `/api/ai/risk-alerts` | Yes |

---

## 📞 Support & Next Steps

### To Test the App:
1. Install MongoDB locally or use MongoDB Atlas
2. Update backend `.env` with your MongoDB connection
3. Run backend: `npm run dev` (port 3002)
4. Run frontend: `npm run dev` (port 5173)
5. Create an account and add sample transactions
6. View dashboards and AI insights

### Production Deployment:
- Deploy backend on Heroku/Railway/Render
- Deploy frontend on Vercel/Netlify
- Use MongoDB Atlas for database
- Set secure environment variables
- Enable HTTPS

### Features Highlights:
- ✨ **6 AI-Powered Features** for financial insights
- 💾 **MongoDB Integration** for secure data storage
- 🔐 **JWT Authentication** with bcrypt password hashing
- 📊 **Real-time Analytics** with charts and breakdowns
- 📱 **Responsive Design** with Tailwind CSS
- ⚡ **Fast API** with Express.js and Node.js

---

## 📝 Notes
- All transactions are stored in MongoDB with user isolation
- Passwords are hashed with bcrypt (12 rounds) - never stored in plain text
- API responses include error handling and validation
- CORS is configured for frontend origin only
- AI features include fallback responses if OpenAI API is not configured
