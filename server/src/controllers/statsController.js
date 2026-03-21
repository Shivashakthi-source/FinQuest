const Expense = require("../models/Expense");
const Income = require("../models/Income");
const Budget = require("../models/Budget");
const { xpFromAmount, levelFromXP } = require("../utils/xp");

function formatDateKey(d) {
  // YYYY-MM-DD in local time
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function monthKey(d) {
  // YYYY-MM in local time
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

async function getStats(req, res) {
  const userId = req.user._id;

  const now = new Date();

  // Current month (local time)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);

  // Previous month
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
  const prevMonthEnd = monthStart;

  const thisMonthKey = monthKey(now);

  const [expensesAll, expensesThisMonth, expensesPrevMonth, incomesThisMonth, weeklyExpenses, recentExpenses, budgetThisMonth] =
    await Promise.all([
      Expense.find({ userId }).select("amount date category title").sort({ date: -1 }),
      Expense.find({ userId, date: { $gte: monthStart, $lt: monthEnd } }).select("amount category title date").sort({ date: -1 }),
      Expense.find({ userId, date: { $gte: prevMonthStart, $lt: prevMonthEnd } }).select("amount category title date").sort({ date: -1 }),
      Income.find({ userId, date: { $gte: monthStart, $lt: monthEnd } }).select("amount source date").sort({ date: -1 }),
      Expense.find({
        userId,
        date: { $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6), $lt: monthEnd }
      }).select("amount date"),
      Expense.find({ userId }).sort({ date: -1 }).limit(5).select("title category amount date"),
      Budget.findOne({ userId, month: thisMonthKey })
    ]);

  // Existing gamification stats (kept intact)
  const totalExpenses = expensesAll.length; // historical: count
  const totalExpenseAmount = expensesAll.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const totalXP = expensesAll.reduce((sum, e) => sum + xpFromAmount(e.amount), 0);
  const level = levelFromXP(totalXP);

  // Weekly summary (last 7 days, local time)
  const weeklyStart = new Date(now);
  weeklyStart.setDate(now.getDate() - 6);
  weeklyStart.setHours(0, 0, 0, 0);

  const byDay = new Map();
  for (const exp of weeklyExpenses) {
    const expDate = exp.date instanceof Date ? exp.date : new Date(exp.date);
    if (expDate < weeklyStart) continue;
    const key = formatDateKey(expDate);
    const prev = byDay.get(key) || 0;
    byDay.set(key, prev + xpFromAmount(exp.amount));
  }

  const weekly = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weeklyStart);
    d.setDate(weeklyStart.getDate() + i);
    const key = formatDateKey(d);
    weekly.push({ date: key, xp: byDay.get(key) || 0 });
  }

  // Finance summary (current month)
  const totalIncomeAmount = incomesThisMonth.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
  const totalExpenseAmountThisMonth = expensesThisMonth.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const balance = totalIncomeAmount - totalExpenseAmountThisMonth;
  const savingsPercent = totalIncomeAmount > 0 ? (balance / totalIncomeAmount) * 100 : 0;

  // Budget progress (current month)
  const budgetLimit = budgetThisMonth?.limit || 0;
  const spent = totalExpenseAmountThisMonth;
  const remaining = budgetLimit > 0 ? budgetLimit - spent : 0;
  const usedPercent = budgetLimit > 0 ? (spent / budgetLimit) * 100 : 0;

  let budgetStatus = "green";
  if (budgetLimit > 0) {
    budgetStatus = usedPercent <= 70 ? "green" : usedPercent <= 90 ? "yellow" : "red";
  }

  // Category analysis for insights
  function groupTotalsByCategory(list) {
    const m = new Map();
    for (const e of list) {
      const cat = String(e.category || "Uncategorized");
      const prev = m.get(cat) || 0;
      m.set(cat, prev + (Number(e.amount) || 0));
    }
    return m;
  }

  const currCatTotals = groupTotalsByCategory(expensesThisMonth);
  const prevCatTotals = groupTotalsByCategory(expensesPrevMonth);

  let topCategory = null;
  let topCategoryAmount = 0;
  for (const [cat, amount] of currCatTotals.entries()) {
    if (amount > topCategoryAmount) {
      topCategory = cat;
      topCategoryAmount = amount;
    }
  }

  const prevTopAmount = topCategory ? prevCatTotals.get(topCategory) || 0 : 0;
  const topCategoryGrowth =
    prevTopAmount > 0 ? (topCategoryAmount - prevTopAmount) / prevTopAmount : topCategoryAmount > 0 ? 1 : 0;

  // Next-month prediction from monthly expense totals (last up to 6 months)
  const startPrediction = new Date(now.getFullYear(), now.getMonth() - 5, 1, 0, 0, 0, 0);
  const expenseWindow = await Expense.find({
    userId,
    date: { $gte: startPrediction, $lt: monthEnd }
  }).select("amount date");

  const monthTotals = new Map();
  for (const exp of expenseWindow) {
    const d = exp.date instanceof Date ? exp.date : new Date(exp.date);
    const key = monthKey(d);
    const prev = monthTotals.get(key) || 0;
    monthTotals.set(key, prev + (Number(exp.amount) || 0));
  }

  const sortedKeys = Array.from(monthTotals.keys()).sort();
  const lastThree = sortedKeys.slice(-3);
  const values = lastThree.map((k) => monthTotals.get(k) || 0);
  const avg = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;

  const trend =
    values.length >= 2 && values[values.length - 2] > 0 ? (values[values.length - 1] - values[values.length - 2]) / values[values.length - 2] : 0;
  const predictedExpense = avg * (1 + clamp(trend, -0.2, 0.3));

  const predictionConfidence = values.length >= 3 ? "high" : values.length === 2 ? "medium" : values.length === 1 ? "low" : "low";
  const nextMonthKey = monthKey(new Date(now.getFullYear(), now.getMonth() + 1, 1));

  // Deterministic “AI-style” insights (heuristics)
  const alerts = [];
  const suggestions = [];

  if (budgetLimit > 0) {
    if (usedPercent <= 70) {
      suggestions.push({
        severity: "good",
        title: "You are on track",
        body: `You’ve used ${usedPercent.toFixed(0)}% of your ${thisMonthKey} budget.`
      });
    } else if (usedPercent <= 90) {
      alerts.push({
        severity: "warning",
        title: "Budget is getting tight",
        body: `You’ve used ${usedPercent.toFixed(0)}% of your budget. Consider trimming non-essentials.`
      });
    } else {
      alerts.push({
        severity: "bad",
        title: "Budget exceeded",
        body: `Spending is ${spent > budgetLimit ? "$" + (spent - budgetLimit).toFixed(0) + " over" : "over"} your planned limit.`
      });
    }
  } else {
    suggestions.push({
      severity: "warning",
      title: "Set a monthly budget",
      body: "Add a budget limit on the dashboard to unlock smarter alerts and progress tracking."
    });
  }

  if (totalIncomeAmount > 0) {
    if (savingsPercent >= 20) {
      suggestions.push({
        severity: "good",
        title: "Great savings momentum",
        body: `You’re saving about ${savingsPercent.toFixed(0)}% of your income this month.`
      });
    } else if (savingsPercent >= 10) {
      suggestions.push({
        severity: "warning",
        title: "Room to improve savings",
        body: `Your savings rate is ${savingsPercent.toFixed(0)}%. Try reducing one category for a quick win.`
      });
    } else if (savingsPercent >= 0) {
      alerts.push({
        severity: "bad",
        title: "Low savings rate",
        body: `You’re saving only ${savingsPercent.toFixed(0)}%. A small cut can make a big difference.`
      });
    } else {
      alerts.push({
        severity: "bad",
        title: "Spending is above income",
        body: `Your balance is negative this month (${savingsPercent.toFixed(0)}% savings).`
      });
    }
  }

  if (topCategory && prevTopAmount > 0 && topCategoryGrowth >= 0.2) {
    suggestions.push({
      severity: "warning",
      title: `${topCategory} is trending up`,
      body: `Spending on ${topCategory} increased by ${(topCategoryGrowth * 100).toFixed(0)}% vs last month.`
    });
  }

  const totalCurrExpenses = totalExpenseAmountThisMonth;
  if (topCategory && totalCurrExpenses > 0) {
    const share = topCategoryAmount / totalCurrExpenses;
    if (share >= 0.4) {
      suggestions.push({
        severity: "warning",
        title: "One category dominates spending",
        body: `About ${(share * 100).toFixed(0)}% of your spending is in ${topCategory}. Review the biggest driver.`
      });
    }
  }

  return res.json({
    // Finance summary (current month)
    monthly: {
      thisMonthKey,
      totalIncome: totalIncomeAmount,
      totalExpenses: totalExpenseAmountThisMonth,
      balance,
      savingsPercent
    },
    // Budget progress (current month)
    budget: {
      month: thisMonthKey,
      limit: budgetLimit,
      spent,
      remaining,
      usedPercent,
      status: budgetStatus
    },
    // AI-style insights and forecast
    aiInsights: {
      alerts,
      suggestions
    },
    prediction: {
      nextMonthKey,
      predictedExpense: Math.max(0, Math.round(predictedExpense)),
      confidence: predictionConfidence
    },
    recentExpenses: recentExpenses.map((e) => ({
      _id: e._id,
      title: e.title,
      category: e.category,
      amount: e.amount,
      date: e.date
    })),

    // Kept for the existing gamification experience
    totalExpenses,
    totalExpenseAmount,
    totalXP,
    level,
    weekly
  });
}

module.exports = { getStats };

