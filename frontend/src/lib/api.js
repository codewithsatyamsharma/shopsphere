import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true, // send the login cookie with every request
});

// Helpers so no component digs through error.response by hand
export const getErrorMessage = (error) =>
  error.response?.data?.message ?? "Cannot reach the server. Check your connection.";
export const getFieldErrors = (error) => error.response?.data?.errors ?? [];

// If a protected request comes back 401, tell the app the session has ended.
// A custom event avoids importing the Redux store here (which would be a circular import).
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthCall = error.config?.url?.startsWith("/auth/");
    if (error.response?.status === 401 && !isAuthCall) {
      window.dispatchEvent(new Event("auth:expired"));
    }
    return Promise.reject(error);
  },
);
