import axios from "axios";

const api = axios.create({
    baseURL: "/",
    headers: { "Content-Type": "application/json" },
    timeout: 30000,
});

api.interceptors.response.use(
    (response) => response,
    (error) => Promise.reject(error)
);

export default api;
