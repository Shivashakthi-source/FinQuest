const Budget = require("../models/Budget");

function monthKey(d) {
  // YYYY-MM in local time
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function normalizeLimit(body) {
  const limit = Number(body?.limit);
  return limit;
}

async function getCurrentBudget(req, res) {
  const userId = req.user._id;
  const key = monthKey(new Date());
  const budget = await Budget.findOne({ userId, month: key });

  return res.json(
    budget || {
      month: key,
      limit: 0,
      remaining: 0
    }
  );
}

async function upsertCurrentBudget(req, res) {
  const userId = req.user._id;
  const key = monthKey(new Date());
  const limit = normalizeLimit(req.body);

  if (!Number.isFinite(limit) || limit < 0) {
    return res.status(400).json({ message: "limit must be a non-negative number." });
  }

  const budget = await Budget.findOneAndUpdate(
    { userId, month: key },
    { limit },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return res.json(budget);
}

module.exports = { getCurrentBudget, upsertCurrentBudget };

