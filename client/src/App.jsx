import React, { useCallback, useEffect, useState } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Expenses from "./pages/Expenses.jsx";
import Income from "./pages/Income.jsx";
import AddExpense from "./pages/AddExpense.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import { getMe, logout } from "./api/users.js";
import { clearStoredUser, getStoredUser, setStoredUser } from "./utils/authStorage.js";

function RequireAuth({ user, bootingAuth, children }) {
  if (bootingAuth) {
    return (
      <div className="mt-10 text-sm text-slate-600 dark:text-slate-300">Loading session...</div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => getStoredUser());
  const [bootingAuth, setBootingAuth] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      try {
        const me = await getMe();
        if (cancelled) return;
        setStoredUser(me);
        setUser(me);
      } catch (err) {
        // No active session cookie.
        clearStoredUser();
        if (cancelled) return;
        setUser(null);
      } finally {
        if (!cancelled) setBootingAuth(false);
      }
    }

    boot();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
    } catch (e) {
      // ignore network/logout errors; local state still clears.
    }
    clearStoredUser();
    setUser(null);
    navigate("/login", { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen">
      <Navbar user={user} onLogout={handleLogout} />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Routes>
          <Route
            path="/"
            element={
              bootingAuth ? (
                <div className="mt-10 text-sm text-slate-600 dark:text-slate-300">Loading...</div>
              ) : user ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/login"
            element={user ? <Navigate to="/dashboard" replace /> : <Login onAuthed={(u) => { setStoredUser(u); setUser(u); navigate("/dashboard", { replace: true }); }} />}
          />
          <Route
            path="/register"
            element={
              user ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Register
                onAuthed={(user) => {
                  setStoredUser(user)
                  setUser(user)
                  navigate("/dashboard", { replace: true });
                }}
                />
              )
            }
          />
          <Route
            path="/dashboard"
            element={
              <RequireAuth user={user} bootingAuth={bootingAuth}>
                <Dashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/expenses"
            element={
              <RequireAuth user={user} bootingAuth={bootingAuth}>
                <Expenses />
              </RequireAuth>
            }
          />
          <Route
            path="/income"
            element={
              <RequireAuth user={user} bootingAuth={bootingAuth}>
                <Income />
              </RequireAuth>
            }
          />
          <Route
            path="/expenses/new"
            element={
              <RequireAuth user={user} bootingAuth={bootingAuth}>
                <AddExpense />
              </RequireAuth>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

