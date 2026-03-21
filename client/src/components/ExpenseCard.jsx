import React from "react";

export default function ExpenseCard({ expense, onDelete }) {
  const amount = Number(expense.amount);
  const formattedAmount = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD"
  }).format(amount);

  const date = expense.date ? new Date(expense.date) : null;
  const formattedDate = date ? date.toLocaleDateString() : "";

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200/60 bg-white p-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800/60 dark:bg-slate-900/40">
      <div>
        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{expense.title}</div>
        <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">
          {expense.category} • {formattedDate}
        </div>
        <div className="mt-2 text-lg font-semibold text-indigo-700 dark:text-indigo-300">
          {formattedAmount}
        </div>
      </div>

      {onDelete ? (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onDelete?.(expense._id)}
            className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-rose-700"
          >
            Delete
          </button>
        </div>
      ) : null}
    </div>
  );
}

