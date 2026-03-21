import { api } from "./axios";

export async function setCurrentBudget({ limit }) {
  const payload = { limit };
  const res = await api.post("/api/budget/current", payload);
  return res.data;
}

