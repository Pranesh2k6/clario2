import { useState, useEffect } from "react";
import { useTypewriter } from "../../hooks/useTypewriter.js";

export function VFTerminal({ text }) {
    const { shown, done } = useTypewriter(text, 18);
    const [cursor, setCursor] = useState(true);

    useEffect(() => {
        const id = setInterval(() => setCursor(c => !c), 520);
        return () => clearInterval(id);
    }, []);

    return (
        <div style={{
            background: "rgba(0,0,0,0.55)",
            border: "1px solid rgba(124,58,237,0.22)",
            borderRadius: 10, padding: "14px 16px",
            marginBottom: 14,
            position: "relative", overflow: "hidden",
            animation: "vf-flicker 10s infinite",
        }}>
            <div style={{
                position: "absolute", inset: 0, pointerEvents: "none",
                background: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.06) 2px,rgba(0,0,0,0.06) 4px)",
                animation: "vf-scanline 4s linear infinite",
            }} />
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 3, color: "#7c3aed", marginBottom: 8, fontFamily: "JetBrains Mono,monospace" }}>
                ◈ XENON OVERRIDE — SYSTEM VOICE
            </div>
            <p style={{
                fontFamily: "JetBrains Mono,monospace", fontSize: 11, color: "rgba(220,232,255,0.82)",
                lineHeight: 1.85, whiteSpace: "pre-wrap", position: "relative", zIndex: 1,
            }}>
                {shown}{!done && <span style={{ animation: "vf-blink 1s infinite" }}>▌</span>}
            </p>
        </div>
    );
}
