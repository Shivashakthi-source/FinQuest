import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import StatsCard from "../components/StatsCard.jsx";
import { getStats } from "../api/stats.js";
import { setCurrentBudget } from "../api/budget.js";

function formatCurrency(amount) {
  const n = Number(amount) || 0;
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(n);
}

function formatMonthLabel(monthKey) {
  // YYYY-MM -> "Mar 2026"
  if (!monthKey || !monthKey.includes("-")) return "";
  const [y, m] = monthKey.split("-").map((x) => Number(x));
  const d = new Date(y, (m || 1) - 1, 1);
  return d.toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

function severityToClasses(severity) {
  if (severity === "good") return "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200";
  if (severity === "warning") return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200";
  if (severity === "bad") return "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200";
  return "border-slate-200 bg-slate-50 text-slate-800 dark:border-slate-800/60 dark:bg-slate-900/40 dark:text-slate-100";
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [status, setStatus] = useState({ loading: true, error: "" });
  const [budgetLimitDraft, setBudgetLimitDraft] = useState("");
  const [budgetSubmitting, setBudgetSubmitting] = useState(false);
  const [budgetError, setBudgetError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function boot() {
      try {
        const data = await getStats();
        if (!cancelled) setStats(data);
      } catch (err) {
        if (!cancelled) {
          setStatus({ loading: false, error: err?.response?.data?.message || err?.message || "Failed to load stats." });
        }
        return;
      }
      if (!cancelled) setStatus({ loading: false, error: "" });
    }
    boot();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/40">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            A clear view of your month: income, spending, budget progress, and smart next steps.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/expenses/new"
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
          >
            Add Expense
          </Link>
        </div>
      </div>

      {status.loading ? (
        <div className="mt-6 text-sm text-slate-600 dark:text-slate-300">Loading your dashboard...</div>
      ) : status.error ? (
        <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200">
          {status.error}
        </div>
      ) : (
        <>
          {/* TOP: Summary cards */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard title="Total Income" value={formatCurrency(stats?.monthly?.totalIncome)} hint={`For ${formatMonthLabel(stats?.monthly?.thisMonthKey)}.`} />
            <StatsCard title="Total Expenses" value={formatCurrency(stats?.monthly?.totalExpenses)} hint={`For ${formatMonthLabel(stats?.monthly?.thisMonthKey)}.`} />
            <StatsCard title="Balance" value={formatCurrency(stats?.monthly?.balance)} hint="Income minus expenses." />
            <StatsCard
              title="Savings %"
              value={`${(Number(stats?.monthly?.savingsPercent) || 0).toFixed(0)}%`}
              hint="How much of your income you keep."
            />
          </div>

          {/* MIDDLE: Budget progress */}
          <div className="mt-6 grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
            <div className="rounded-xl border border-slate-200/60 bg-white p-5 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/40">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Budget progress</div>
                  <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                    {formatMonthLabel(stats?.monthly?.thisMonthKey)} budget usage.
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-slate-500 dark:text-slate-400">Remaining</div>
                  <div
                    className={`text-lg font-semibold ${
                      stats?.budget?.status === "red"
                        ? "text-rose-600 dark:text-rose-300"
                        : stats?.budget?.status === "yellow"
                          ? "text-amber-600 dark:text-amber-300"
                          : "text-emerald-600 dark:text-emerald-300"
                    }`}
                  >
                    {formatCurrency(stats?.budget?.remaining)}
                  </div>
                </div>
              </div>

              <div className="mt-4">
                {Number(stats?.budget?.limit) > 0 ? (
                  <>
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <div>
                        Used{" "}
                        <span className="font-semibold text-slate-700 dark:text-slate-200">
                          {(Number(stats?.budget?.usedPercent) || 0).toFixed(0)}%
                        </span>
                      </div>
                      <div>
                        Limit <span className="font-semibold text-slate-700 dark:text-slate-200">{formatCurrency(stats?.budget?.limit)}</span>
                      </div>
                    </div>

                    <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-800/60">
                      <div
                        className={`h-full rounded-full transition-[width] duration-500 ${
                          stats?.budget?.status === "red"
                            ? "bg-rose-600"
                            : stats?.budget?.status === "yellow"
                              ? "bg-amber-500"
                              : "bg-emerald-600"
                        }`}
                        style={{ width: `${clampPct(stats?.budget?.usedPercent)}%` }}
                      />
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                          stats?.budget?.status === "red"
                            ? "bg-rose-600/15 text-rose-700 dark:text-rose-200 dark:bg-rose-500/10"
                            : stats?.budget?.status === "yellow"
                              ? "bg-amber-500/15 text-amber-700 dark:text-amber-200 dark:bg-amber-500/10"
                              : "bg-emerald-600/15 text-emerald-700 dark:text-emerald-200 dark:bg-emerald-500/10"
                        }`}
                      >
                        Status: {stats?.budget?.status.toUpperCase()}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {stats?.budget?.status === "green"
                          ? "On track"
                          : stats?.budget?.status === "yellow"
                            ? "Watch your spending"
                            : "Action needed"}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="rounded-xl border border-slate-200/60 bg-white p-4 text-sm text-slate-600 dark:border-slate-800/60 dark:bg-slate-950/30 dark:text-slate-300">
                    No budget set yet. Add your monthly limit to unlock progress tracking and alerts.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200/60 bg-white p-5 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/40">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Set budget</div>
              <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">Monthly limit for {formatMonthLabel(stats?.monthly?.thisMonthKey)}.</div>

              <div className="mt-4">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Budget limit</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={budgetLimitDraft}
                  onChange={(e) => setBudgetLimitDraft(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                  placeholder="e.g., 1200"
                />
              </div>

              {budgetError ? (
                <div className="mt-3 text-xs font-medium text-rose-700 dark:text-rose-200">{budgetError}</div>
              ) : null}

              <button
                type="button"
                disabled={budgetSubmitting}
                onClick={async () => {
                  setBudgetError("");
                  const limit = Number(budgetLimitDraft);
                  if (!Number.isFinite(limit) || limit < 0) {
                    setBudgetError("Please enter a valid budget limit.");
                    return;
                  }
                  setBudgetSubmitting(true);
                  try {
                    await setCurrentBudget({ limit });
                    const data = await getStats();
                    setStats(data);
                    setBudgetLimitDraft("");
                    alert("Budget updated.");
                  } catch (err) {
                    setBudgetError(err?.response?.data?.message || err?.message || "Failed to update budget.");
                  } finally {
                    setBudgetSubmitting(false);
                  }
                }}
                className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60"
              >
                {budgetSubmitting ? "Saving..." : "Save budget"}
              </button>
            </div>
          </div>

          {/* INSIGHTS SECTION */}
          <div className="mt-6 rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/40">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">AI Insights</div>
                <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">Alerts and suggestions based on your month.</div>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Auto-generated</div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Alerts</div>
                <div className="mt-3 flex flex-col gap-3">
                  {(stats?.aiInsights?.alerts || []).length === 0 ? (
                    <div className="rounded-xl border border-slate-200/60 bg-white p-4 text-sm text-slate-600 dark:border-slate-800/60 dark:bg-slate-950/30 dark:text-slate-300">
                      No alerts right now. Nice work.
                    </div>
                  ) : (
                    stats.aiInsights.alerts.map((a, idx) => (
                      <div key={idx} className={`rounded-xl border p-4 text-sm ${severityToClasses(a.severity)}`}>
                        <div className="font-semibold">{a.title}</div>
                        <div className="mt-1 text-xs opacity-90">{a.body}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Suggestions</div>
                <div className="mt-3 flex flex-col gap-3">
                  {(stats?.aiInsights?.suggestions || []).length === 0 ? (
                    <div className="rounded-xl border border-slate-200/60 bg-white p-4 text-sm text-slate-600 dark:border-slate-800/60 dark:bg-slate-950/30 dark:text-slate-300">
                      Nothing to suggest yet.
                    </div>
                  ) : (
                    stats.aiInsights.suggestions.map((s, idx) => (
                      <div key={idx} className={`rounded-xl border p-4 text-sm ${severityToClasses(s.severity)}`}>
                        <div className="font-semibold">{s.title}</div>
                        <div className="mt-1 text-xs opacity-90">{s.body}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* PREDICTION SECTION */}
          <div className="mt-6 rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/40">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Next Month Prediction</div>
                <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                  Forecast based on your recent spending trend.
                </div>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Confidence: {stats?.prediction?.confidence || "low"}</div>
            </div>

            <div className="mt-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-950/30">
              <div className="text-xs text-slate-500 dark:text-slate-400">{stats?.prediction?.nextMonthKey ? `For ${formatMonthLabel(stats.prediction.nextMonthKey)}` : "Next month"}</div>
              <div className="mt-1 text-3xl font-semibold text-slate-900 dark:text-slate-100">
                {formatCurrency(stats?.prediction?.predictedExpense)}
              </div>
              <div className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Estimated spend if the pattern continues. Use insights above to adjust early.
              </div>
            </div>
          </div>

          {/* BOTTOM: Recent expenses */}
          <div className="mt-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Recent expenses</div>
                <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">Your latest entries, newest first.</div>
              </div>
              <Link to="/expenses" className="text-sm font-medium text-indigo-700 hover:underline dark:text-indigo-300">
                View all
              </Link>
            </div>

            <div className="mt-3 overflow-hidden rounded-xl border border-slate-200/60 dark:border-slate-800/60">
              <div className="hidden bg-white p-3 text-xs font-semibold text-slate-600 sm:grid sm:grid-cols-[1.7fr_0.8fr_0.7fr_auto] dark:bg-slate-950/30 dark:text-slate-300">
                <div>Expense</div>
                <div>Amount</div>
                <div>Date</div>
                <div className="text-right">Category</div>
              </div>

              <div className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
                {(stats?.recentExpenses || []).length === 0 ? (
                  <div className="bg-white p-6 text-sm text-slate-600 dark:bg-slate-950/20 dark:text-slate-300">
                    No expenses yet. Add your first one to unlock insights.
                  </div>
                ) : (
                  stats.recentExpenses.map((e) => {
                    const date = e.date ? new Date(e.date) : null;
                    const formattedDate = date ? date.toLocaleDateString() : "";
                    return (
                      <div key={e._id} className="grid gap-3 bg-white p-3 sm:grid-cols-[1.7fr_0.8fr_0.7fr_auto] dark:bg-slate-950/20">
                        <div>
                          <div className="font-medium text-slate-900 dark:text-slate-100">{e.title}</div>
                          <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">{e.category}</div>
                        </div>
                        <div className="font-semibold text-indigo-700 dark:text-indigo-300">{formatCurrency(e.amount)}</div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">{formattedDate}</div>
                        <div className="flex justify-end">
                          <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                            {e.category}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function clampPct(v) {
  const n = Number(v) || 0;
  return Math.max(0, Math.min(100, n));
}

