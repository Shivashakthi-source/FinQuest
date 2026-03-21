import { api } from "./axios";

export async function getStats() {
  const res = await api.get("/api/stats");
  return res.data;
}

