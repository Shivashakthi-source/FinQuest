import { authApi } from "./axios";

export async function login({ email, password }) {
  const res = await authApi.post("/api/auth/login", { email, password });
  return res.data;
}

export async function register({ name, email, password }) {
  const res = await authApi.post("/api/auth/register", { name, email, password });
  return res.data;
}

export async function getMe() {
  const res = await authApi.get("/api/auth/me");
  return res.data;
}

export async function logout() {
  const res = await authApi.post("/api/auth/logout");
  return res.data;
}

