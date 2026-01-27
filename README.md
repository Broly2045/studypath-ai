# StudyPath AI - Study Abroad Counselor

An AI-powered study abroad counselor that helps students plan their international education journey with personalized university recommendations, smart task management, and actionable guidance.

![StudyPath AI](https://img.shields.io/badge/StudyPath-AI%20Counselor-blue)

## 🌟 Features

### Core Features
- **AI Counselor (PathFinder)** - Chat with an AI that understands your profile and TAKES ACTIONS
- **Smart Onboarding** - Two modes: Step-by-step form OR AI-led conversation
- **Personalized University Recommendations** - Dream, Target, and Safe categories
- **University Locking** - Lock universities to unlock application guidance
- **AI-Generated Tasks** - Automatic to-do list based on your profile and goals
- **Profile Strength Analysis** - Visual breakdown of academics, exams, and SOP readiness

### What Makes This UNIQUE
1. **AI Takes Actions** - Unlike typical chatbots, our AI can:
   - Add universities to your shortlist directly from conversation
   - Create and complete tasks
   - Update your profile
   - Provide contextual recommendations

2. **Strict Stage-Based Flow** - Four stages that unlock progressively:
   - Stage 1: Building Profile
   - Stage 2: Discovering Universities
   - Stage 3: Finalizing Universities (lock at least one)
   - Stage 4: Preparing Applications

3. **Dual Onboarding Modes** - Choose your preferred experience

## 🛠️ Tech Stack

### Frontend
- React 18 with Vite
- Tailwind CSS (custom design system)
- Framer Motion (animations)
- React Router v6
- Axios for API calls
- Recharts for visualizations

### Backend
- Node.js + Express
- PostgreSQL with Prisma ORM
- JWT Authentication
- Google OAuth 2.0
- Gemini AI (Google)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Gemini API key (free from Google AI Studio)

### 1. Clone and Setup

```bash
# Clone the repository
git clone <repo-url>
cd ai-counselor

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment Variables

**Backend (.env)**
```env
DATABASE_URL="postgresql://username:password@localhost:5432/studypath_db"
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"
GEMINI_API_KEY="your-gemini-api-key"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_CALLBACK_URL="http://localhost:5000/api/auth/google/callback"
FRONTEND_URL="http://localhost:5173"
PORT=5000
```

**Frontend (.env)**
```env
VITE_API_URL="http://localhost:5000/api"
```

### 3. Setup Database

```bash
cd backend

# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push
```

### 4. Run the Application

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

Visit `http://localhost:5173`

## 📁 Project Structure

```
ai-counselor/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma      # Database schema
│   ├── src/
│   │   ├── config/            # Database & Passport config
│   │   ├── controllers/       # Route handlers
│   │   ├── middleware/        # Auth middleware
│   │   ├── routes/            # API routes
│   │   ├── services/          # AI service
│   │   └── index.js           # Entry point
│   └── package.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/        # Reusable components
│   │   ├── context/           # Auth context
│   │   ├── pages/             # Page components
│   │   ├── services/          # API service
│   │   ├── App.jsx            # Main app with routing
│   │   └── main.jsx           # Entry point
│   ├── index.html
│   └── package.json
│
└── README.md
```

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/google` - Google OAuth
- `GET /api/auth/me` - Get current user

### Profile
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update profile
- `POST /api/profile/complete-onboarding` - Complete onboarding

### AI Counselor
- `POST /api/ai/chat` - Chat with AI (takes actions!)
- `POST /api/ai/onboarding` - AI-led onboarding
- `GET /api/ai/conversations` - Get conversation history

### Universities
- `GET /api/universities/recommendations` - AI recommendations
- `GET /api/universities/shortlist` - User's shortlist
- `POST /api/universities/shortlist` - Add to shortlist
- `POST /api/universities/shortlist/:id/lock` - Lock university

### Tasks
- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create task
- `POST /api/tasks/:id/toggle` - Toggle completion

## 🎨 Design System

Custom Tailwind theme with:
- **Primary**: Blue (#0c8ce6)
- **Accent**: Green (#00e67f)
- **Dark theme** with glassmorphism effects
- Custom animations (fade-in, slide-up, gradient)

## 🚀 Deployment

### Backend (Railway/Render)
1. Connect your GitHub repo
2. Set environment variables
3. Deploy

### Frontend (Vercel)
1. Import project
2. Set `VITE_API_URL` to your backend URL
3. Deploy

### Database (Neon/Supabase)
1. Create PostgreSQL database
2. Copy connection string to `DATABASE_URL`

## 📹 Demo Video Tips

For your 3-5 minute demo:
1. Show landing page (10 sec)
2. Sign up flow (20 sec)
3. Onboarding - show BOTH modes (60 sec)
4. Dashboard overview (30 sec)
5. AI Counselor - demonstrate ACTIONS (90 sec)
   - Ask for university recommendations
   - Have AI shortlist a university
   - Have AI add a task
6. University shortlisting and locking (60 sec)
7. Tasks page (30 sec)

## 🏆 Hackathon Submission

This project was built for the Humanity Founders Hackathon.

### Evaluation Criteria Met:
- ✅ Product clarity - Clear study abroad counselor
- ✅ Flow correctness - Strict 4-stage progression
- ✅ AI usefulness - AI takes REAL actions
- ✅ UX clarity - Clean, intuitive design
- ✅ Execution discipline - Working MVP

## 📝 License

MIT

---

Built with ❤️ for the Humanity Founders Hackathon
