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

// Auto-logout: se a sessão expirar/for inválida (401), limpa e volta ao login.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url: string = error?.config?.url || "";
    if (status === 401 && !url.includes("/admins/login")) {
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_user");
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        const next = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.href = `/login?expired=1&next=${next}`;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
