import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api/",
  validateStatus: () => true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const isApiFailure = (res) =>
  res?.data?.ok === false || res?.data?.unauthorized === true;

export const isUnauthorized = (data) =>
  data?.unauthorized === true || data?.code === "USER_NOT_FOUND";

api.interceptors.response.use((res) => {
  if (isUnauthorized(res.data)) {
    const hadToken = !!localStorage.getItem("token");
    localStorage.removeItem("token");
    if (hadToken && !window.location.pathname.includes("/login")) {
      window.location.href = "/login";
    }
  }
  return res;
});

export default api;
