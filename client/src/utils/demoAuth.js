import { authApi } from "../api/axios";

const DEMO_EMAIL = import.meta.env.VITE_DEMO_USER_EMAIL || "demo@finquest.ai";
const USER_ID_KEY = "userId";

export async function ensureDemoUser() {
  const existingUserId = localStorage.getItem(USER_ID_KEY);
  if (existingUserId) return { userId: existingUserId };

  const res = await authApi.post("/api/users/login", { email: DEMO_EMAIL });
  const user = res.data;
  localStorage.setItem(USER_ID_KEY, user.userId);
  return user;
}

export function getUserId() {
  return localStorage.getItem(USER_ID_KEY);
}

