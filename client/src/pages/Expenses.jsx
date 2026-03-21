import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { createExpense, deleteExpense, getExpenses } from "../api/expenses.js";

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

function formatDateYMD(date) {
  if (!date) return "";
  const d = date instanceof Date ? date : new Date(date);
  return formatDateInputValue(d);
}

function downloadTextFile(filename, text, mime = "text/plain;charset=utf-8") {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [status, setStatus] = useState({ loading: true, error: "" });
  const [toast, setToast] = useState({ type: "", message: "" });

  const [filters, setFilters] = useState({
    category: "All",
    date: "",
    minAmount: "",
    maxAmount: ""
  });

  const [form, setForm] = useState({
    title: "",
    amount: "",
    category: "Food",
    date: ""
  });

  const [submitStatus, setSubmitStatus] = useState({ loading: false, error: "" });

  const categories = useMemo(
    () => ["Food", "Transport", "Bills", "Home", "Entertainment", "Other"],
    []
  );

  async function load() {
    const data = await getExpenses();
    setExpenses(data);
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
            error: err?.response?.data?.message || err?.message || "Failed to load expenses."
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

  const filteredExpenses = useMemo(() => {
    const cat = filters.category;
    const date = filters.date;
    const min = filters.minAmount === "" ? null : Number(filters.minAmount);
    const max = filters.maxAmount === "" ? null : Number(filters.maxAmount);

    return expenses.filter((e) => {
      if (cat !== "All" && e.category !== cat) return false;
      if (date && formatDateYMD(e.date) !== date) return false;
      const amt = Number(e.amount) || 0;
      if (min !== null && (Number.isFinite(min) ? amt < min : true)) return false;
      if (max !== null && (Number.isFinite(max) ? amt > max : true)) return false;
      return true;
    });
  }, [expenses, filters]);

  async function handleDelete(id) {
    if (!confirm("Delete this expense?")) return;
    try {
      await deleteExpense(id);
      await load();
      setToast({ type: "success", message: "Expense deleted." });
    } catch (err) {
      setToast({
        type: "error",
        message: err?.response?.data?.message || err?.message || "Failed to delete."
      });
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitStatus({ loading: true, error: "" });
    setToast({ type: "", message: "" });

    try {
      const payload = {
        title: form.title.trim(),
        amount: Number(form.amount),
        category: form.category,
        date: form.date
      };

      if (!payload.title) {
        setSubmitStatus({ loading: false, error: "Title is required." });
        return;
      }
      if (!Number.isFinite(payload.amount) || payload.amount < 0) {
        setSubmitStatus({ loading: false, error: "Amount must be a non-negative number." });
        return;
      }
      if (!payload.date) {
        setSubmitStatus({ loading: false, error: "Date is required." });
        return;
      }

      await createExpense(payload);
      await load();
      setForm((f) => ({ ...f, title: "", amount: "" }));
      setSubmitStatus({ loading: false, error: "" });
      setToast({ type: "success", message: "Expense added successfully." });
    } catch (err) {
      setSubmitStatus({
        loading: false,
        error: err?.response?.data?.message || err?.message || "Failed to add expense."
      });
    }
  }

  function toCsv(rows) {
    const header = ["title", "category", "amount", "date"];
    const esc = (v) => {
      const s = String(v ?? "");
      if (s.includes('"') || s.includes(",") || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };
    const lines = [
      header.join(","),
      ...rows.map((r) => [r.title, r.category, r.amount, r.date ? new Date(r.date).toISOString().slice(0, 10) : ""].map(esc).join(","))
    ];
    return lines.join("\n");
  }

  function handleExportCsv() {
    if (filteredExpenses.length === 0) {
      setToast({ type: "error", message: "No expenses match your filters to export." });
      return;
    }
    const csv = toCsv(filteredExpenses);
    const stamp = new Date().toISOString().slice(0, 10);
    downloadTextFile(`finquest-expenses-${stamp}.csv`, csv, "text/csv;charset=utf-8");
    setToast({ type: "success", message: "Export started. Your CSV file is downloading." });
  }

  return (
    <section className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/40">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Expenses</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Track expenses and keep leveling up.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
            disabled={filteredExpenses.length === 0 || status.loading}
          >
            Export CSV
          </button>
          <Link to="/expenses/new" className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700">
            Add via page
          </Link>
        </div>
      </div>

      {toast.message ? (
        <div
          className={`mt-4 rounded-xl border p-4 text-sm ${
            toast.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200"
              : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200"
          }`}
        >
          {toast.message}
        </div>
      ) : null}

      {/* Add Expense Form */}
      <form onSubmit={handleSubmit} className="mt-6 rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/40">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Add expense</div>
            <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">Quickly log spending to power your insights.</div>
          </div>
          {submitStatus.error ? (
            <div className="text-xs font-medium text-rose-700 dark:text-rose-200">{submitStatus.error}</div>
          ) : null}
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Title</label>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              placeholder="e.g., Subway ticket"
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
              placeholder="e.g., 25"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
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

          <div className="sm:col-span-2 flex items-center gap-3">
            <button
              type="submit"
              disabled={submitStatus.loading}
              className="inline-flex w-full sm:w-auto items-center justify-center rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60"
            >
              {submitStatus.loading ? "Adding..." : "Add expense"}
            </button>
            <button
              type="button"
              disabled={submitStatus.loading}
              onClick={() => setForm((f) => ({ ...f, title: "", amount: "" }))}
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
            >
              Clear
            </button>
          </div>
        </div>
      </form>

      {/* Filters */}
      <div className="mt-6 rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/40">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Filters</div>
            <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">Narrow down expenses by category, date, and amount.</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFilters({ category: "All", date: "", minAmount: "", maxAmount: "" })}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Category</label>
            <select
              value={filters.category}
              onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
            >
              <option value="All">All</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Date</label>
            <input
              type="date"
              value={filters.date}
              onChange={(e) => setFilters((f) => ({ ...f, date: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Min amount</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={filters.minAmount}
              onChange={(e) => setFilters((f) => ({ ...f, minAmount: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              placeholder="0"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Max amount</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={filters.maxAmount}
              onChange={(e) => setFilters((f) => ({ ...f, maxAmount: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              placeholder="500"
            />
          </div>
        </div>

        <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          Showing <span className="font-semibold text-slate-700 dark:text-slate-200">{filteredExpenses.length}</span> of{" "}
          <span className="font-semibold text-slate-700 dark:text-slate-200">{expenses.length}</span> expenses.
        </div>
      </div>

      {status.loading ? (
        <div className="mt-6 text-sm text-slate-600 dark:text-slate-300">Loading expenses...</div>
      ) : status.error ? (
        <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200">
          {status.error}
        </div>
      ) : filteredExpenses.length === 0 ? (
        <div className="mt-6 rounded-xl border border-slate-200/60 bg-white p-6 text-sm text-slate-600 dark:border-slate-800/60 dark:bg-slate-900/40 dark:text-slate-300">
          No expenses match your filters yet. Try adjusting filters or add a new expense.
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-800/60">
          <div className="hidden bg-white p-3 text-xs font-semibold text-slate-600 sm:grid sm:grid-cols-[1.6fr_0.9fr_0.8fr_auto] sm:items-center dark:bg-slate-950/30 dark:text-slate-300">
            <div>Expense</div>
            <div className="text-right">Amount</div>
            <div className="text-right">Date</div>
            <div className="text-right">Actions</div>
          </div>

          <div className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
            {filteredExpenses.map((expense) => (
              <div key={expense._id} className="grid gap-3 bg-white p-3 sm:grid-cols-[1.6fr_0.9fr_0.8fr_auto] sm:items-center dark:bg-slate-950/20">
                <div className="min-w-0">
                  <div className="truncate font-semibold text-slate-900 dark:text-slate-100">{expense.title}</div>
                  <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">{expense.category}</div>
                </div>
                <div className="text-right font-semibold text-indigo-700 dark:text-indigo-300">{formatCurrency(expense.amount)}</div>
                <div className="text-right text-sm text-slate-600 dark:text-slate-400">
                  {expense.date ? new Date(expense.date).toLocaleDateString() : ""}
                </div>
                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => handleDelete(expense._id)}
                    className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-rose-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

