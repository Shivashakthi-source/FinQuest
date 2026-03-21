import { api } from "./axios";

export async function getExpenses() {
  const res = await api.get("/api/expenses");
  return res.data;
}

export async function createExpense({ title, amount, category, date }) {
  const payload = {
    title,
    amount,
    category,
    date
  };
  const res = await api.post("/api/expenses", payload);
  return res.data;
}

export async function updateExpense(id, { title, amount, category, date }) {
  const payload = { title, amount, category, date };
  const res = await api.put(`/api/expenses/${id}`, payload);
  return res.data;
}

export async function deleteExpense(id) {
  const res = await api.delete(`/api/expenses/${id}`);
  return res.data;
}

