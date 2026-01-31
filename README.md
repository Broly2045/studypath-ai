# StudyPath AI – Action‑Driven Study Abroad Counselor

An **AI-powered study abroad counselor** that doesn’t just chat — it **takes real actions** to help students plan, decide, and execute their international education journey.

StudyPath AI guides students from **profile building → university discovery → finalization → application preparation** using a strict, stage-based flow enforced in code.

---

## 🚀 What is StudyPath AI?

StudyPath AI is a full‑stack web application that acts like a **personal overseas education counselor**.

Unlike generic AI chatbots, the AI in StudyPath can:

* Shortlist universities
* Lock final universities
* Create & complete tasks
* Update user profiles

All actions happen **directly from conversation**.

---

## ✨ Core Features

### 🧠 AI Counselor (PathFinder)

* Conversational AI with full context of the user’s profile
* Capable of **executing actions**, not just suggesting them:

  * Add universities to shortlist
  * Lock universities
  * Generate application tasks
  * Update profile data

---

### 🧩 Dual Onboarding Experience

Users can choose how they start:

* **Guided Form Onboarding** – structured, step‑by‑step flow
* **AI‑Led Onboarding** – conversational onboarding with adaptive follow‑ups

Both lead to the same validated profile state.

---

### 🎯 Personalized University Recommendations

* AI‑generated recommendations based on profile strength
* Categorized into:

  * **Dream** universities
  * **Target** universities
  * **Safe** universities
* Updates dynamically as the profile improves

---

### 🔐 University Locking System

* Users shortlist multiple universities
* Must **lock at least one university** to proceed
* Locking unlocks application preparation tasks

This enforces commitment and prevents decision paralysis.

---

### ✅ AI‑Generated Task Management

* Automatic to‑do list creation based on:

  * Exams required
  * SOP readiness
  * University deadlines
* Tasks evolve as the user advances through stages

---

### 📊 Profile Strength Analysis

Visual indicators showing readiness across:

* Academics
* Exams
* SOP
* Overall preparedness

---

## 🧭 Strict Stage‑Based Flow

Progression is intentionally gated and enforced both in frontend routing and backend logic.

1. **Stage 1 – Profile Building**

   * Academics
   * Exams & scores
   * Preferences

2. **Stage 2 – University Discovery**

   * AI recommendations
   * Comparison & shortlisting

3. **Stage 3 – Finalization**

   * Lock at least one university

4. **Stage 4 – Application Preparation**

   * SOP tasks
   * Document preparation
   * Timeline tracking

---

## 🛠️ Tech Stack

### Frontend

* React 18 (Vite)
* Tailwind CSS (custom design system)
* Framer Motion
* React Router v6
* Axios
* Recharts

### Backend

* Node.js + Express
* PostgreSQL
* Prisma ORM
* JWT Authentication
* Google OAuth 2.0
* **Groq LLM API**

---

## ⚙️ Local Setup

### Prerequisites

* Node.js 18+
* PostgreSQL
* Groq API key

---

### 1️⃣ Clone Repository

```bash
git clone <repo-url>
cd ai-counselor
```

---

### 2️⃣ Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

---

### 3️⃣ Environment Variables

#### Backend (`.env`)

```env
DATABASE_URL="postgresql://username:password@localhost:5432/studypath_db"
JWT_SECRET="your-jwt-secret"
JWT_EXPIRES_IN="7d"
GROQ_API_KEY="your-groq-api-key"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_CALLBACK_URL="http://localhost:5000/api/auth/google/callback"
FRONTEND_URL="http://localhost:5173"
PORT=5000
```

#### Frontend (`.env`)

```env
VITE_API_URL="http://localhost:5000/api"
```

---

### 4️⃣ Database Setup

```bash
cd backend
npm run db:generate
npm run db:push
```

---

### 5️⃣ Run the App

```bash
# Backend
cd backend
npm run dev

# Frontend
cd ../frontend
npm run dev
```

Open: `http://localhost:5173`

---

## 📁 Project Structure

```
ai-counselor/
├── backend/
│   ├── prisma/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   └── index.js
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.jsx
│   │   └── main.jsx
│
└── README.md
```

---

## 🔑 API Overview

### Authentication

* `POST /api/auth/signup`
* `POST /api/auth/login`
* `GET /api/auth/google`
* `GET /api/auth/me`

### Profile

* `GET /api/profile`
* `PUT /api/profile`
* `POST /api/profile/complete-onboarding`

### AI Counselor

* `POST /api/ai/chat`
* `POST /api/ai/onboarding`
* `GET /api/ai/conversations`

### Universities

* `GET /api/universities/recommendations`
* `GET /api/universities/shortlist`
* `POST /api/universities/shortlist`
* `POST /api/universities/shortlist/:id/lock`

### Tasks

* `GET /api/tasks`
* `POST /api/tasks`
* `POST /api/tasks/:id/toggle`

---

## 🎨 Design Philosophy

* Dark‑first UI
* Glassmorphism accents
* Clear progress indicators
* Action‑driven UX

---

## 🚀 Deployment

### Backend

* Render 

### Frontend

* Vercel

### Database

* Neon (PostgreSql)

---

## 🏆 Hackathon Context

Built for the **Humanity Founders Hackathon**.

### Why It Stands Out

* AI that executes real actions
* Strict, enforced user flow
* Clear real‑world problem
* Fully working end‑to‑end MVP

---

Built with ❤️ to make studying abroad less confusing and more actionable.

