const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Expense = require("../models/Expense");
const Income = require("../models/Income");
const Budget = require("../models/Budget");
const { xpFromAmount, levelFromXP } = require("../utils/xp");
const { connectDB } = require("../config/db");

function parseBool(value, fallback = true) {
  if (value === undefined) return fallback;
  return String(value).toLowerCase() === "true";
}

async function ensureConnected() {
  if (mongoose.connection.readyState === 1) return;
  await connectDB();
}

async function seedIfEmpty() {
  const autoSeed = parseBool(process.env.AUTO_SEED, true);
  if (!autoSeed) return;

  await ensureConnected();

  const demoEmail = process.env.DEMO_USER_EMAIL || "demo@finquest.ai";
  const demoName = process.env.DEMO_USER_NAME || "FinQuest Demo";
  const demoPassword = process.env.DEMO_USER_PASSWORD || "demo12345";

  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;

  // Ensure demo user exists with a usable password for login.
  let user = await User.findOne({ email: String(demoEmail).toLowerCase() }).select("+password");
  if (!user) {
    const hashedPassword = await bcrypt.hash(String(demoPassword), saltRounds);
    user = await User.create({
      name: demoName,
      email: String(demoEmail).toLowerCase(),
      password: hashedPassword,
      xp: 0,
      level: 1
    });
  } else if (!user.password) {
    const hashedPassword = await bcrypt.hash(String(demoPassword), saltRounds);
    user.password = hashedPassword;
    await user.save();
  }

  const now = new Date();
  const daysAgo = (n) => {
    const d = new Date(now);
    d.setDate(now.getDate() - n);
    d.setHours(12, 0, 0, 0);
    return d;
  };

  const expensesData = [
    { title: "Groceries", amount: 50, category: "Food", date: daysAgo(1) },
    { title: "Fuel", amount: 30, category: "Transport", date: daysAgo(2) },
    { title: "Utilities", amount: 120, category: "Bills", date: daysAgo(3) },
    { title: "Coffee", amount: 10, category: "Food", date: daysAgo(5) },
    { title: "Rent Support", amount: 200, category: "Home", date: daysAgo(6) }
  ];

  const existingExpenseCount = await Expense.countDocuments({ userId: user._id });
  const existingIncomeCount = await Income.countDocuments({ userId: user._id });
  const existingBudgetCount = await Budget.countDocuments({ userId: user._id });

  let expenses = [];
  if (existingExpenseCount === 0) {
    expenses = await Expense.insertMany(
      expensesData.map((e) => ({
        ...e,
        userId: user._id
      }))
    );
  } else {
    expenses = await Expense.find({ userId: user._id });
  }

  if (existingIncomeCount === 0) {
    const incomesData = [
      { source: "Salary", amount: 1500, date: daysAgo(2) },
      { source: "Freelance", amount: 400, date: daysAgo(7) }
    ];

    await Income.insertMany(
      incomesData.map((i) => ({
        ...i,
        userId: user._id
      }))
    );
  }

  const currentMonthKey = (() => {
    const n = new Date();
    const year = n.getFullYear();
    const month = String(n.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  })();

  if (existingBudgetCount === 0) {
    await Budget.create({
      month: currentMonthKey,
      limit: 1200,
      userId: user._id
    });
  }

  const totalXP = expenses.reduce((sum, e) => sum + xpFromAmount(e.amount), 0);
  const totalLevel = levelFromXP(totalXP);

  user.xp = totalXP;
  user.level = totalLevel;
  await user.save();

  // eslint-disable-next-line no-console
  console.log("Seeded demo user + expenses.");
}

async function runSeed() {
  await ensureConnected();
  // For explicit runs we always seed if empty (same behavior as server startup)
  await seedIfEmpty();
  // eslint-disable-next-line no-console
  console.log("Seed complete.");
  await mongoose.disconnect();
}

module.exports = { seedIfEmpty, runSeed };

if (require.main === module) {
  runSeed().catch((err) => {
    // eslint-disable-next-line no-console
    console.error("Seed failed:", err);
    process.exit(1);
  });
}

