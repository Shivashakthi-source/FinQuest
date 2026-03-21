import React, { useState } from "react";
import { Link } from "react-router-dom";
import { login } from "../api/users.js";

export default function Login({ onAuthed }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [status, setStatus] = useState({ loading: false, error: "" });

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus({ loading: true, error: "" });

    try {
      const user = await login(form);
      onAuthed?.(user);
    } catch (err) {
      setStatus({
        loading: false,
        error: err?.response?.data?.message || err?.message || "Login failed."
      });
    }
  }

  return (
    <section className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col justify-center">
      <div className="rounded-2xl border border-slate-200/60 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-slate-800/60 dark:bg-slate-900/40">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Log in to view and manage your expenses.
          </p>
        </div>

        {status.error ? (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200">
            {status.error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-800 dark:text-slate-200" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-800 dark:text-slate-200" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={status.loading}
            className="mt-2 inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60"
          >
            {status.loading ? "Signing in..." : "Login"}
          </button>

          <div className="text-center text-sm text-slate-600 dark:text-slate-400">
            New here?{" "}
            <Link to="/register" className="font-medium text-indigo-700 hover:underline dark:text-indigo-300">
              Create an account
            </Link>
          </div>
        </form>
      </div>
    </section>
  );
}

