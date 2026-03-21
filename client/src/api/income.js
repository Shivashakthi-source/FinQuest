import { api } from "./axios";

export async function getIncomes() {
  const res = await api.get("/api/income");
  return res.data;
}

export async function createIncome({ source, amount, date }) {
  const payload = { source, amount, date };
  const res = await api.post("/api/income", payload);
  return res.data;
}

export async function deleteIncome(id) {
  const res = await api.delete(`/api/income/${id}`);
  return res.data;
}

