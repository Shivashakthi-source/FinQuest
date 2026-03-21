## FinQuest – AI Gamified Expense Manager (MERN)

FinQuest lets you track expenses and earn XP with simple leveling:
- Each expense adds XP based on its `amount`
- Leveling formula: every `100 XP` => level up

### Folder structure
- `server/` - Express + MongoDB (Mongoose) REST API + seed script
- `client/` - React (Vite) + Tailwind UI + Axios integration

## Setup

### 1) Backend (MongoDB + REST API)
```bash
cd server
npm install
cp .env.example .env
npm run dev
```

The server will auto-seed sample data on startup (user + 5 expenses) by default.

### 2) Frontend (React UI)
In a separate terminal:
```bash
cd client
npm install
cp .env.example .env
npm run dev
```

Open the URL shown by Vite (typically `http://localhost:5173`).

## API (backend)
- `POST   /api/users/register`
- `POST   /api/users/login`
- `POST   /api/expenses`
- `GET    /api/expenses`
- `PUT    /api/expenses/:id`
- `DELETE /api/expenses/:id`
- `GET    /api/stats` (returns total expenses, total XP, level)

## Demo user
- The frontend auto-logs in using the demo email configured in `server/.env.example` (`DEMO_USER_EMAIL`).

