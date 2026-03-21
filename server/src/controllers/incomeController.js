const Income = require("../models/Income");

function normalizeIncomeFields(body) {
  const source = String(body?.source || body?.title || "").trim();
  const amount = Number(body?.amount);
  const date = body?.date ? new Date(body.date) : new Date();
  return { source, amount, date };
}

async function createIncome(req, res) {
  const { source, amount, date } = normalizeIncomeFields(req.body);

  if (!source) {
    return res.status(400).json({ message: "source is required." });
  }
  if (!Number.isFinite(amount) || amount < 0) {
    return res.status(400).json({ message: "amount must be a non-negative number." });
  }
  if (!date || Number.isNaN(date.getTime())) {
    return res.status(400).json({ message: "date is invalid." });
  }

  const userId = req.user._id;
  const income = await Income.create({ source, amount, date, userId });
  return res.status(201).json(income);
}

async function listIncomes(req, res) {
  const userId = req.user._id;
  const incomes = await Income.find({ userId }).sort({ date: -1 });
  return res.json(incomes);
}

async function deleteIncome(req, res) {
  const { id } = req.params;
  const userId = req.user._id;

  const income = await Income.findOne({ _id: id, userId });
  if (!income) {
    return res.status(404).json({ message: "Income not found." });
  }

  await income.deleteOne();
  return res.json({ message: "Income deleted." });
}

module.exports = {
  createIncome,
  listIncomes,
  deleteIncome
};

