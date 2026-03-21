import axios from "axios";

const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:5000";

export const authApi = axios.create({
  baseURL: serverUrl,
  withCredentials: true
});

export const api = axios.create({
  baseURL: serverUrl,
  withCredentials: true
});

