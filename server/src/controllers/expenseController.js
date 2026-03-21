const Expense = require("../models/Expense");
const { xpFromAmount, levelFromXP } = require("../utils/xp");

function normalizeExpenseFields(body) {
  const title = String(body?.title || "").trim();
  const category = String(body?.category || "").trim();
  const amount = Number(body?.amount);
  const date = body?.date ? new Date(body.date) : new Date();
  return { title, category, amount, date };
}

async function createExpense(req, res) {
  const { title, category, amount, date } = normalizeExpenseFields(req.body);

  if (!title || !category) {
    return res.status(400).json({ message: "title and category are required." });
  }
  if (!Number.isFinite(amount) || amount < 0) {
    return res.status(400).json({ message: "amount must be a non-negative number." });
  }
  if (!date || Number.isNaN(date.getTime())) {
    return res.status(400).json({ message: "date is invalid." });
  }

  const user = req.user;
  const xpEarned = xpFromAmount(amount);

  const expense = await Expense.create({
    title,
    amount,
    category,
    date,
    userId: user._id
  });

  const nextXp = user.xp + xpEarned;
  const nextLevel = levelFromXP(nextXp);
  user.xp = nextXp;
  user.level = nextLevel;
  await user.save();

  return res.status(201).json(expense);
}

async function listExpenses(req, res) {
  const userId = req.user._id;
  const expenses = await Expense.find({ userId }).sort({ date: -1 });
  return res.json(expenses);
}

async function updateExpense(req, res) {
  const { id } = req.params;
  const userId = req.user._id;

  const expense = await Expense.findOne({ _id: id, userId });
  if (!expense) {
    return res.status(404).json({ message: "Expense not found." });
  }

  const { title, category, amount, date } = normalizeExpenseFields(req.body);
  if (!title || !category) {
    return res.status(400).json({ message: "title and category are required." });
  }
  if (!Number.isFinite(amount) || amount < 0) {
    return res.status(400).json({ message: "amount must be a non-negative number." });
  }
  if (!date || Number.isNaN(date.getTime())) {
    return res.status(400).json({ message: "date is invalid." });
  }

  const oldXp = xpFromAmount(expense.amount);
  const newXp = xpFromAmount(amount);
  const deltaXp = newXp - oldXp;

  expense.title = title;
  expense.category = category;
  expense.amount = amount;
  expense.date = date;
  await expense.save();

  const nextXp = Math.max(0, req.user.xp + deltaXp);
  req.user.xp = nextXp;
  req.user.level = levelFromXP(nextXp);
  await req.user.save();

  return res.json(expense);
}

async function deleteExpense(req, res) {
  const { id } = req.params;
  const userId = req.user._id;

  const expense = await Expense.findOne({ _id: id, userId });
  if (!expense) {
    return res.status(404).json({ message: "Expense not found." });
  }

  const xpEarned = xpFromAmount(expense.amount);
  await expense.deleteOne();

  const nextXp = Math.max(0, req.user.xp - xpEarned);
  req.user.xp = nextXp;
  req.user.level = levelFromXP(nextXp);
  await req.user.save();

  return res.json({ message: "Expense deleted." });
}

module.exports = {
  createExpense,
  listExpenses,
  updateExpense,
  deleteExpense
};

