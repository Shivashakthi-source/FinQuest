import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createExpense } from "../api/expenses.js";

export default function AddExpense() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    amount: "",
    category: "Food",
    date: ""
  });

  const [status, setStatus] = useState({ loading: true, error: "" });

  useEffect(() => {
    let cancelled = false;
    async function boot() {
      try {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, "0");
        const dd = String(today.getDate()).padStart(2, "0");
        if (!cancelled) {
          setForm((f) => ({ ...f, date: `${yyyy}-${mm}-${dd}` }));
          setStatus({ loading: false, error: "" });
        }
      } catch (err) {
        if (!cancelled) {
          setStatus({
            loading: false,
            error: err?.response?.data?.message || err?.message || "Failed to initialize."
          });
        }
      }
    }
    boot();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus({ loading: true, error: "" });

    try {
      const payload = {
        title: form.title,
        amount: Number(form.amount),
        category: form.category,
        date: form.date
      };
      await createExpense(payload);
      navigate("/expenses");
    } catch (err) {
      setStatus({
        loading: false,
        error: err?.response?.data?.message || err?.message || "Failed to add expense."
      });
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/40">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Add Expense</h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        Add a new expense to earn XP and level up.
      </p>

      {status.loading ? (
        <div className="mt-6 text-sm text-slate-600 dark:text-slate-300">Preparing...</div>
      ) : status.error ? (
        <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200">
          {status.error}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Title</label>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              placeholder="e.g., Subway ticket"
              required
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
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              placeholder="e.g., 25"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
            >
              <option value="Food">Food</option>
              <option value="Transport">Transport</option>
              <option value="Bills">Bills</option>
              <option value="Home">Home</option>
              <option value="Entertainment">Entertainment</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Date</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              required
            />
          </div>

          <div className="sm:col-span-2 flex items-center gap-3">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
              disabled={status.loading}
            >
              Add Expense
            </button>
            <button
              type="button"
              className="rounded-xl border border-slate-200 bg-white px-5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
              onClick={() => navigate("/expenses")}
              disabled={status.loading}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

