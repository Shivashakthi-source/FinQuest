import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";

function SunIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="M4.93 4.93l1.41 1.41" />
      <path d="M17.66 17.66l1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="M4.93 19.07l1.41-1.41" />
      <path d="M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export default function Navbar({ user, onLogout }) {
  const location = useLocation();
  const [theme, setTheme] = useState(() => {
    try {
      const stored = localStorage.getItem("theme");
      return stored === "dark" || stored === "light" ? stored : "dark";
    } catch (e) {
      return "dark";
    }
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem("theme");
      // If nothing is stored yet, default to dark-first UI.
      if (stored === "dark" || stored === "light") setTheme(stored);
      else if (!stored) setTheme("dark");
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const linkClass = useMemo(() => {
    return (path) =>
      `px-3 py-2 rounded-md text-sm font-medium transition ${
        location.pathname === path
          ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
          : "text-slate-700 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800"
      }`;
  }, [location.pathname]);

  const [mobileOpen, setMobileOpen] = useState(false);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    try {
      localStorage.setItem("theme", next);
    } catch (e) {
      // ignore
    }
  }

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200/60 bg-white/80 backdrop-blur dark:border-slate-800/60 dark:bg-slate-950/60">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500" />
          <div>
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">FinQuest</div>
            <div className="text-xs text-slate-600 dark:text-slate-400">AI Gamified Expense Manager</div>
          </div>
        </div>

        <nav className="hidden items-center gap-2 sm:flex" aria-label="Primary">
          <Link to="/dashboard" className={linkClass("/dashboard")}>
            Dashboard
          </Link>
          <Link to="/expenses" className={linkClass("/expenses")}>
            Expenses
          </Link>
          <Link to="/income" className={linkClass("/income")}>
            Income
          </Link>
        </nav>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white/70 p-2 text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-200 sm:hidden"
          aria-label="Open navigation"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((s) => !s)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
            <path d="M4 6h16" />
            <path d="M4 12h16" />
            <path d="M4 18h16" />
          </svg>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="hidden rounded-lg border border-slate-200 bg-white/70 px-3 py-2 text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300 dark:hover:bg-slate-900/70 sm:inline-flex"
            aria-label="Toggle dark mode"
            title="Toggle dark mode"
          >
            <span className="flex items-center gap-2">
              {theme === "dark" ? <MoonIcon /> : <SunIcon />}
              <span className="text-xs font-medium">{theme === "dark" ? "Dark" : "Light"}</span>
            </span>
          </button>

          <div className="hidden text-xs text-slate-500 sm:block">
            {user ? (
              <span className="flex items-center gap-2">
                <span className="text-slate-400 dark:text-slate-400">Signed in</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">{user.name}</span>
              </span>
            ) : (
              <span>Sign in to track your expenses.</span>
            )}
          </div>

          {user ? (
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center justify-center rounded-lg bg-rose-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-rose-700"
            >
              Logout
            </button>
          ) : null}
        </div>
      </div>

      {mobileOpen ? (
        <div className="sm:hidden">
          <div className="mx-auto max-w-6xl px-4 pb-3">
            <div className="rounded-xl border border-slate-200/60 bg-white p-2 shadow-sm dark:border-slate-800/60 dark:bg-slate-950/40">
              <div className="flex flex-col gap-1">
                <Link
                  to="/dashboard"
                  className={linkClass("/dashboard")}
                  onClick={() => setMobileOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  to="/expenses"
                  className={linkClass("/expenses")}
                  onClick={() => setMobileOpen(false)}
                >
                  Expenses
                </Link>
                <Link
                  to="/income"
                  className={linkClass("/income")}
                  onClick={() => setMobileOpen(false)}
                >
                  Income
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}

