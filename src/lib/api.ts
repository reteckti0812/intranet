import axios from "axios";

// Em dev o Vite faz proxy de /api → Express; em produção o mesmo servidor serve o SPA e a API
const api = axios.create({
  baseURL: "/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("admin_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;