import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
    const [pos, setPos] = useState({ top: 0, right: 0 });
    const btnRef = useRef(null);
    const menuRef = useRef(null);

    // Fetch user ID on mount
    useEffect(() => {
        client.get('/users/me')
            .then(r => setUserId(r.data.user?.id || '—'))
            .catch(() => { });
    }, []);

    // Position the dropdown relative to the button
    const updatePos = useCallback(() => {
        if (!btnRef.current) return;
        const rect = btnRef.current.getBoundingClientRect();
        setPos({
            top: rect.bottom + 8,
            right: window.innerWidth - rect.right,
        });
    }, []);

    // Toggle open and recalculate position
    const toggle = () => {
        if (!open) updatePos();
        setOpen(prev => !prev);
    };

    // Close on click outside
    useEffect(() => {
        if (!open) return;
        const handler = (e) => {
            if (
                btnRef.current && !btnRef.current.contains(e.target) &&
                menuRef.current && !menuRef.current.contains(e.target)
            ) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    // Reposition on scroll/resize while open
    useEffect(() => {
        if (!open) return;
        window.addEventListener('scroll', updatePos, true);
        window.addEventListener('resize', updatePos);
        return () => {
            window.removeEventListener('scroll', updatePos, true);
            window.removeEventListener('resize', updatePos);
        };
    }, [open, updatePos]);

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

    const dropdown = open ? createPortal(
        <div
            ref={menuRef}
            style={{ position: 'fixed', top: pos.top, right: pos.right, zIndex: 9999 }}
            className="min-w-[300px] bg-[rgba(12,8,36,0.97)] backdrop-blur-xl border border-white/15 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.6)] py-3"
        >
            {/* User ID */}
            <div className="px-4 pb-3 border-b border-white/10">
                <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-[0.15em] mb-2">Your User ID</p>
                <div
                    onClick={handleCopy}
                    className="flex items-center gap-2 px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg cursor-pointer hover:bg-white/8 hover:border-white/20 transition-all group"
                >
                    <span className="text-[12px] font-mono text-[#E5E7EB] leading-relaxed break-all select-all flex-1">
                        {userId || '...'}
                    </span>
                    <div className="flex-shrink-0 p-1">
                        {copied
                            ? <Check size={14} className="text-[#10B981]" />
                            : <Copy size={14} className="text-[#6B7280] group-hover:text-[#D1D5DB] transition-colors" />
                        }
                    </div>
                </div>
                {copied && (
                    <p className="text-[10px] text-[#10B981] mt-1.5 text-center font-medium">Copied!</p>
                )}
            </div>

            {/* Sign Out */}
            <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-2.5 mt-1 text-[13px] font-medium text-[#F87171] hover:bg-white/8 transition-colors"
            >
                <LogOut size={16} />
                <span>Sign Out</span>
            </button>
        </div>,
        document.body
    ) : null;

    return (
        <>
            <button
                ref={btnRef}
                onClick={toggle}
                className="w-9 h-9 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#6366F1] border-2 border-white/20 cursor-pointer hover:border-white/40 transition-all"
            />
            {dropdown}
        </>
    );
}
