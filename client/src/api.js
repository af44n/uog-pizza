import axios from "axios";

// One axios instance for the whole app. In development Vite forwards /api to Express (port 5000).
const api = axios.create({ baseURL: "/api" });

// Turn axios errors into plain Errors that carry the server's message
api.interceptors.response.use(
  (res) => res,
  (err) => Promise.reject(Object.assign(new Error(err.response?.data?.error || "Request failed"), { status: err.response?.status }))
);

export default api;
