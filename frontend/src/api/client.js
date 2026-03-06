import axios from "axios";
import { auth } from "../config/firebase";

const client = axios.create({
    // In production, VITE_API_URL points to the deployed backend (e.g. https://clario-backend.onrender.com)
    // In local dev, falls back to /api/v1 which is proxied by the Vite dev server
    baseURL: import.meta.env.VITE_API_URL
        ? `${import.meta.env.VITE_API_URL}/api/v1`
        : "/api/v1",
});

// Attach Firebase ID token to every request
client.interceptors.request.use(async (config) => {
    const user = auth.currentUser;
    if (user) {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default client;
