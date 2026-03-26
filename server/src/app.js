require("dotenv").config();

const express = require("express");
const cors = require("cors");
const session = require("express-session");

const userRoutes = require("./routes/userRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const statsRoutes = require("./routes/statsRoutes");
const incomeRoutes = require("./routes/incomeRoutes");
const budgetRoutes = require("./routes/budgetRoutes");

const app = express();

app.use(express.json());

const allowedOrigins = [
  "http://localhost:5173",
  "https://fin-quest-azure.vercel.app",
  "https://fin-quest-git-main-shivashakthi-sources-projects.vercel.app",
  "https://fin-quest-dgwhe221a-shivashakthi-sources-projects.vercel.app"
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.set("trust proxy", 1);

app.use(
  session({
    name: process.env.SESSION_COOKIE_NAME || "finquest.sid",
    secret: process.env.SESSION_SECRET || "dev-session-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "none",
      secure: true,
      maxAge: 1000 * 60 * 60 * 24 * 7
    }
  })
);

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", userRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/income", incomeRoutes);
app.use("/api/budget", budgetRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Basic error handler (keeps errors readable in development)
app.use((err, req, res, next) => {
  // eslint-disable-next-line no-unused-vars
  const _ = next;
  // eslint-disable-next-line no-console
  console.error(err);
  res.status(err.statusCode || 500).json({ message: err.message || "Server error" });
});

module.exports = app;

