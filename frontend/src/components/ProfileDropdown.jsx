import { useState, useRef, useEffect } from 'react';
import { LogOut, Copy, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router';
import client from '../api/client';

export function ProfileDropdown() {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [userId, setUserId] = useState(null);
    const [copied, setCopied] = useState(false);
    const ref = useRef(null);

    // Fetch user ID on mount
    useEffect(() => {
        client.get('/users/me')
            .then(r => setUserId(r.data.user?.id || '—'))
            .catch(() => { });
    }, []);

    // Close on click outside
    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleSignOut = async () => {
        await logout();
        navigate('/');
    };

    const handleCopy = () => {
        if (!userId) return;
        navigator.clipboard.writeText(userId);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(prev => !prev)}
                className="w-9 h-9 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#6366F1] border-2 border-white/20 cursor-pointer hover:border-white/40 transition-all"
            />

            {open && (
                <div className="absolute right-0 top-12 w-72 bg-[rgba(12,8,36,0.95)] backdrop-blur-xl border border-white/12 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] py-2 z-50">
                    {/* User ID */}
                    <div className="px-4 py-2.5 border-b border-white/8">
                        <p className="text-[11px] font-medium text-[#9CA3AF] uppercase tracking-wider mb-1">Your User ID</p>
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-mono font-semibold text-[#F3F4F6] break-all select-all">
                                {userId || '...'}
                            </span>
                            <button
                                onClick={handleCopy}
                                className="p-1 rounded hover:bg-white/10 transition-colors"
                                title="Copy ID"
                            >
                                {copied
                                    ? <Check size={14} className="text-[#10B981]" />
                                    : <Copy size={14} className="text-[#9CA3AF]" />
                                }
                            </button>
                        </div>
                    </div>

                    {/* Sign Out */}
                    <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium text-[#F87171] hover:bg-white/8 transition-colors"
                    >
                        <LogOut size={16} />
                        <span>Sign Out</span>
                    </button>
                </div>
            )}
        </div>
    );
}
