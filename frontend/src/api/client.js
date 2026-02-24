import axios from "axios";
import { auth } from "../config/firebase";

const client = axios.create({
    baseURL: "/api/v1",
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
