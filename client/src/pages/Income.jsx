import React, { useEffect, useMemo, useState } from "react";
import { createIncome, deleteIncome, getIncomes } from "../api/income.js";

function formatCurrency(amount) {
  const n = Number(amount) || 0;
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(n);
}

function formatDateInputValue(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function Income() {
  const [incomes, setIncomes] = useState([]);
  const [status, setStatus] = useState({ loading: true, error: "" });

  const [form, setForm] = useState({
    source: "",
    amount: "",
    date: ""
  });

  const [submitStatus, setSubmitStatus] = useState({ loading: false, error: "" });

  async function load() {
    const data = await getIncomes();
    setIncomes(data);
  }

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      try {
        const today = new Date();
        const todayValue = formatDateInputValue(today);
        if (!cancelled) setForm((f) => ({ ...f, date: todayValue }));
        await load();
      } catch (err) {
        if (!cancelled) {
          setStatus({
            loading: false,
            error: err?.response?.data?.message || err?.message || "Failed to load income."
          });
        }
        return;
      }
      if (!cancelled) setStatus({ loading: false, error: "" });
    }

    boot();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentMonthTotal = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    return incomes.reduce((sum, i) => {
      const d = i.date instanceof Date ? i.date : new Date(i.date);
      if (d.getFullYear() === y && d.getMonth() === m) return sum + (Number(i.amount) || 0);
      return sum;
    }, 0);
  }, [incomes]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitStatus({ loading: true, error: "" });

    try {
      const payload = {
        source: form.source.trim(),
        amount: Number(form.amount),
        date: form.date
      };

      if (!payload.source) {
        setSubmitStatus({ loading: false, error: "Source is required." });
        return;
      }
      if (!Number.isFinite(payload.amount) || payload.amount < 0) {
        setSubmitStatus({ loading: false, error: "Amount must be a non-negative number." });
        return;
      }

      await createIncome(payload);
      setForm((f) => ({ ...f, source: "", amount: "" }));
      await load();
      setSubmitStatus({ loading: false, error: "" });
      // Simple success feedback: avoids adding toast libs.
      alert("Income added successfully.");
    } catch (err) {
      setSubmitStatus({
        loading: false,
        error: err?.response?.data?.message || err?.message || "Failed to add income."
      });
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this income?")) return;
    try {
      await deleteIncome(id);
      await load();
      alert("Income deleted.");
    } catch (err) {
      alert(err?.response?.data?.message || err?.message || "Failed to delete income.");
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/40">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Income</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Track income sources and build a clearer budget.
          </p>
        </div>
        <div className="rounded-xl border border-slate-200/60 bg-white/50 px-4 py-3 dark:border-slate-800/60 dark:bg-slate-950/40">
          <div className="text-xs text-slate-500 dark:text-slate-400">This month</div>
          <div className="text-xl font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(currentMonthTotal)}</div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 rounded-xl border border-slate-200/60 bg-white p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-950/30">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Add income</div>
            <div className="text-xs text-slate-600 dark:text-slate-400">Add a new income entry.</div>
          </div>
          {submitStatus.error ? (
            <div className="text-xs font-medium text-rose-700 dark:text-rose-200">{submitStatus.error}</div>
          ) : null}
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Source</label>
            <input
              value={form.source}
              onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              placeholder="e.g., Salary"
              required
              autoComplete="off"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Amount</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              placeholder="e.g., 2500"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Date</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              required
            />
          </div>

          <div className="sm:col-span-3 flex items-center gap-3">
            <button
              type="submit"
              disabled={submitStatus.loading}
              className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60"
            >
              {submitStatus.loading ? "Adding..." : "Add income"}
            </button>
            <button
              type="button"
              className="rounded-xl border border-slate-200 bg-white px-5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
              onClick={() => setForm((f) => ({ ...f, source: "", amount: "" }))}
              disabled={submitStatus.loading}
            >
              Clear
            </button>
          </div>
        </div>
      </form>

      <div className="mt-6">
        {status.loading ? (
          <div className="text-sm text-slate-600 dark:text-slate-300">Loading income...</div>
        ) : status.error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200">
            {status.error}
          </div>
        ) : incomes.length === 0 ? (
          <div className="rounded-xl border border-slate-200/60 bg-white p-6 text-sm text-slate-600 dark:border-slate-800/60 dark:bg-slate-900/40 dark:text-slate-300">
            No income entries yet. Add one to get better budget insights.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200/60 dark:border-slate-800/60">
            <div className="hidden bg-white p-3 text-xs font-semibold text-slate-600 sm:grid sm:grid-cols-[1.6fr_1fr_1fr_auto] dark:bg-slate-950/30 dark:text-slate-300">
              <div>Source</div>
              <div>Amount</div>
              <div>Date</div>
              <div className="text-right">Actions</div>
            </div>
            <div className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
              {incomes.map((inc) => {
                const amount = Number(inc.amount) || 0;
                const date = inc.date ? new Date(inc.date) : null;
                const formattedDate = date ? date.toLocaleDateString() : "";
                return (
                  <div key={inc._id} className="grid gap-3 bg-white p-3 sm:grid-cols-[1.6fr_1fr_1fr_auto] dark:bg-slate-950/20">
                    <div className="font-medium text-slate-900 dark:text-slate-100">{inc.source}</div>
                    <div className="font-semibold text-indigo-700 dark:text-indigo-300">{formatCurrency(amount)}</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">{formattedDate}</div>
                    <div className="flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => handleDelete(inc._id)}
                        className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-rose-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

