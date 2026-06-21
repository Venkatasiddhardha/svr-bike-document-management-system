import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("svr_access");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original?._retry) {
      const refresh = localStorage.getItem("svr_refresh");
      if (refresh) {
        original._retry = true;
        try {
          const { data } = await axios.post(`${api.defaults.baseURL}/auth/refresh/`, { refresh });
          localStorage.setItem("svr_access", data.access);
          if (data.refresh) localStorage.setItem("svr_refresh", data.refresh);
          original.headers.Authorization = `Bearer ${data.access}`;
          return api(original);
        } catch {
          localStorage.clear();
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  },
);

export const errorMessage = (error) => {
  const data = error.response?.data;
  if (!data) return "Unable to connect to the server.";
  if (typeof data.detail === "string") return data.detail;
  return Object.entries(data)
    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : value}`)
    .join(" ");
};
