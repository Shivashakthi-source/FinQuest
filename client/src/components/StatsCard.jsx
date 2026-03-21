import React from "react";

export default function StatsCard({ title, value, icon, hint }) {
  return (
    <div className="rounded-xl border border-slate-200/60 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300/60 dark:border-slate-800/60 dark:bg-slate-900/40 dark:hover:border-indigo-400/30">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-medium text-slate-600 dark:text-slate-400">{title}</div>
          <div className="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-100">
            {value}
          </div>
        </div>
        {icon ? <div className="text-2xl">{icon}</div> : null}
      </div>
      {hint ? <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">{hint}</div> : null}
    </div>
  );
}

