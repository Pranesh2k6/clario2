import { createContext, useContext, useState, useEffect } from "react";
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    signOut,
} from "firebase/auth";
import { auth, googleProvider } from "../config/firebase";
import client from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // Auto-sync: ensure this Firebase user has a Postgres record.
                // This runs on every page load / refresh, not just on login.
                try {
                    await client.post('/auth/sync');
                } catch (e) {
                    console.warn('[AuthContext] Sync failed:', e);
                }
            }
            setCurrentUser(user);
            setLoading(false);
        });
        return unsub;
    }, []);

    const loginWithEmail = (email, password) =>
        signInWithEmailAndPassword(auth, email, password);

    const signupWithEmail = (email, password) =>
        createUserWithEmailAndPassword(auth, email, password);

    const loginWithGoogle = () => signInWithPopup(auth, googleProvider);

    const logout = () => signOut(auth);

    const value = {
        currentUser,
        loading,
        loginWithEmail,
        signupWithEmail,
        loginWithGoogle,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    return useContext(AuthContext);
}
