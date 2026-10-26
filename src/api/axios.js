import axios from "axios";
import { getAccessToken, setAccessToken, clearAccessToken } from "./authToken";
import { getCsrfToken } from "./csrf";

const api = axios.create({
  baseURL: import.meta.env.VITE_BASE_API_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const method = (config.method || "get").toLowerCase();
  if (["post", "put", "patch", "delete"].includes(method)) {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      config.headers["X-CSRFToken"] = csrfToken;
    }
  }

  return config;
});

let refreshPromise = null;

async function performRefresh() {
  const csrfToken = getCsrfToken();
  const response = await api.post(
    "accounts/auth/refresh/",
    {},
    {
      headers: csrfToken ? { "X-CSRFToken": csrfToken } : {},
    }
  );
  return response.data.access;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Network/CORS/server-down errors have no response — synthesize one so
    // every API module's `error.response.data` rethrow is always safe.
    if (!error.response) {
      error.response = { status: 0, data: { detail: "Cannot reach the server. Please try again." } };
    }
    const originalRequest = error.config;
    const isAuthEndpoint =
      originalRequest?.url?.includes("accounts/auth/refresh") ||
      originalRequest?.url?.includes("accounts/auth/login");

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      try {
        if (!refreshPromise) {
          refreshPromise = performRefresh().finally(() => {
            refreshPromise = null;
          });
        }
        const newToken = await refreshPromise;
        setAccessToken(newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        clearAccessToken();
        const path = window.location.pathname;
        const isPublicPath = ["/", "/register", "/forgot-password", "/verify-email", "/new-password"].includes(path);
        if (!isPublicPath) {
          window.location.replace("/");
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;