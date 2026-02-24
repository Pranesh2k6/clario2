import { Navigate } from 'react-router';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
    const { currentUser, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#060818]">
                <p className="text-[#A78BFA] text-[16px] font-semibold animate-pulse">
                    Loading Clario...
                </p>
            </div>
        );
    }

    if (!currentUser) {
        return <Navigate to="/" replace />;
    }

    return children;
}
