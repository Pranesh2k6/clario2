import { useState, useEffect } from "react";

export function VFVisualizer({ type, color }) {
    const [tick, setTick] = useState(0);
    useEffect(() => {
        const id = setInterval(() => setTick(t => t + 1), 50);
        return () => clearInterval(id);
    }, []);

    const gridLines = (
        <>
            {[30, 70, 110, 150, 190].map(x => <line key={`gx${x}`} x1={x} y1={10} x2={x} y2={150} stroke="rgba(124,58,237,0.1)" strokeWidth="0.5" />)}
            {[30, 70, 110, 150].map(y => <line key={`gy${y}`} x1={10} y1={y} x2={210} y2={y} stroke="rgba(124,58,237,0.1)" strokeWidth="0.5" />)}
        </>
    );

    if (type === "vectors") return (
        <svg viewBox="0 0 220 160" width="100%" style={{ maxHeight: 170 }}>
            <defs>
                <marker id="vfah" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#22c55e" /></marker>
                <marker id="vfab" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#3b82f6" /></marker>
                <marker id="vfac" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#eab308" /></marker>
            </defs>
            {gridLines}
            <line x1="10" y1="150" x2="210" y2="150" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
            <line x1="10" y1="10" x2="10" y2="150" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
            <circle cx="30" cy="130" r="4" fill="#7c3aed" />
            <text x="34" y="145" fill="#a78bfa" fontSize="9" fontFamily="Sora,sans-serif">O(0,0)</text>
            <line x1="30" y1="130" x2="90" y2="50" stroke="#22c55e" strokeWidth="2" markerEnd="url(#vfah)" strokeDasharray="120" strokeDashoffset="120" style={{ animation: "vf-draw 1.2s 0.3s ease forwards", "--len": "120" }} />
            <circle cx="90" cy="50" r="4" fill="#22c55e" opacity="0" style={{ animation: "fadeUp 0.3s 1.4s ease forwards" }} />
            <text x="94" y="48" fill="#22c55e" fontSize="9" fontFamily="Sora,sans-serif">A(6,8)</text>
            <line x1="90" y1="50" x2="50" y2="10" stroke="#3b82f6" strokeWidth="2" markerEnd="url(#vfab)" strokeDasharray="90" strokeDashoffset="90" style={{ animation: "vf-draw 0.9s 1.6s ease forwards", "--len": "90" }} />
            <circle cx="50" cy="10" r="4" fill="#3b82f6" opacity="0" style={{ animation: "fadeUp 0.3s 2.5s ease forwards" }} />
            <text x="54" y="12" fill="#3b82f6" fontSize="9" fontFamily="Sora,sans-serif">B(-2,12)</text>
            <line x1="30" y1="130" x2="50" y2="10" stroke="#eab308" strokeWidth="1.5" strokeDasharray="5 4" markerEnd="url(#vfac)" opacity="0" style={{ animation: "fadeUp 0.5s 2.8s ease forwards" }} />
            <text x="20" y="70" fill="#eab30888" fontSize="8" fontFamily="Sora,sans-serif" transform="rotate(-80,20,70)">|OB|=√148</text>
        </svg>
    );

    if (type === "drone") {
        const dronePct = (tick % 120) / 120;
        const droneX = 30 + dronePct * 150;
        const interceptPct = Math.min((tick % 80) / 80, 1);
        const intX = 200 - interceptPct * 130;
        const intY = 80 + interceptPct * 25;
        return (
            <svg viewBox="0 0 220 160" width="100%" style={{ maxHeight: 170 }}>
                {gridLines}
                <line x1="10" y1="80" x2="210" y2="80" stroke="rgba(59,130,246,0.2)" strokeWidth="1" strokeDasharray="6 4" />
                <g transform={`translate(${droneX},80)`}>
                    <circle cx="0" cy="0" r="7" fill="none" stroke="#3b82f6" strokeWidth="1.5" />
                    <line x1="-7" y1="-7" x2="-11" y2="-11" stroke="#3b82f6" strokeWidth="1.5" />
                    <line x1="7" y1="-7" x2="11" y2="-11" stroke="#3b82f6" strokeWidth="1.5" />
                    <line x1="-7" y1="7" x2="-11" y2="11" stroke="#3b82f6" strokeWidth="1.5" />
                    <line x1="7" y1="7" x2="11" y2="11" stroke="#3b82f6" strokeWidth="1.5" />
                    {[[-11, -11], [-11, 11], [11, -11], [11, 11]].map(([px, py], i) => <circle key={i} cx={px} cy={py} r="3" fill="#3b82f6" opacity="0.7" />)}
                </g>
                <g transform={`translate(${intX},${intY})`}>
                    <polygon points="0,-7 7,7 0,4 -7,7" fill="#ef4444" opacity="0.9" />
                    <line x1="0" y1="7" x2="0" y2="18" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3 2" />
                </g>
                <text x="10" y="148" fill="#3b82f688" fontSize="8" fontFamily="JetBrains Mono,monospace">v₁=(15î+20ĵ)→v₂=(25î+20ĵ)</text>
                <text x="130" y="148" fill="#ef444488" fontSize="8" fontFamily="JetBrains Mono,monospace">XENON</text>
            </svg>
        );
    }

    if (type === "fall" || type === "flare") {
        const isFlare = type === "flare";
        const animPct = Math.min((tick % 140) / 140, 1);
        const drawLen = animPct * 250;
        const pts = [];
        for (let i = 0; i <= 40; i++) {
            const t = i / 40;
            const x = 20 + t * 180;
            const y = isFlare ? (130 - 100 * Math.sin(Math.PI * t)) : (20 + 120 * t * t);
            pts.push(`${x},${y}`);
        }
        return (
            <svg viewBox="0 0 220 160" width="100%" style={{ maxHeight: 170 }}>
                {gridLines}
                <line x1="10" y1="135" x2="210" y2="135" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
                {isFlare && <g><rect x="80" y="95" width="9" height="40" fill="rgba(239,68,68,0.2)" stroke="#ef4444" strokeWidth="1" /><text x="74" y="93" fill="#ef4444" fontSize="7" fontFamily="Sora,sans-serif">20m</text><text x="80" y="152" fill="#ef444488" fontSize="7" fontFamily="Sora,sans-serif">50m</text></g>}
                <polyline points={pts.join(" ")} stroke={isFlare ? "#f97316" : "#eab308"} strokeWidth="2" fill="none" strokeDasharray="300" strokeDashoffset={300 - drawLen} style={{ transition: "stroke-dashoffset 0.05s" }} />
                <circle cx="20" cy={isFlare ? 130 : 20} r="5" fill={isFlare ? "#f97316" : "#eab308"} />
                {animPct > 0.98 && <><circle cx="200" cy="135" r="6" fill={isFlare ? "#f97316" : "#eab308"} />{isFlare && <text x="108" y="128" fill="#22c55e" fontSize="8" fontFamily="Sora,sans-serif">✓ CLEARS</text>}</>}
                <text x="5" y="155" fill={isFlare ? "#f9731688" : "#eab30888"} fontSize="8" fontFamily="Sora,sans-serif">{isFlare ? "FLARE TRAJECTORY" : "EJECTION PATH"}</text>
            </svg>
        );
    }

    if (type === "incline") return (
        <svg viewBox="0 0 220 160" width="100%" style={{ maxHeight: 170 }}>
            <polygon points="20,140 200,140 200,60" fill="rgba(239,68,68,0.08)" stroke="#ef4444" strokeWidth="1.5" />
            <text x="172" y="110" fill="#ef4444" fontSize="9" fontFamily="Sora,sans-serif">30°</text>
            <path d="M 185,140 A 18,18 0 0,0 198,126" fill="none" stroke="#ef4444" strokeWidth="1" />
            <circle cx="20" cy="140" r="4" fill="#22c55e" />
            <path d="M 20,140 Q 85,55 150,60" stroke="#22c55e" strokeWidth="2" fill="none" strokeDasharray="200" strokeDashoffset="200" style={{ animation: "vf-draw 1.5s 0.5s ease forwards", "--len": "200" }} />
            <text x="30" y="48" fill="#22c55e" fontSize="10" fontFamily="Sora,sans-serif" fontWeight="700">θ = 60°</text>
            <text x="30" y="60" fill="#8b9ec7" fontSize="8" fontFamily="Sora,sans-serif">(45° + 30°/2)</text>
        </svg>
    );

    if (type === "centrifuge") return (
        <svg viewBox="0 0 220 190" width="100%" style={{ maxHeight: 190 }}>
            <circle cx="110" cy="95" r="65" fill="none" stroke="rgba(168,85,247,0.2)" strokeWidth="2" />
            <circle cx="110" cy="95" r="65" fill="none" stroke="rgba(168,85,247,0.4)" strokeWidth="1" strokeDasharray="8 5" style={{ animation: "vf-spin 8s linear infinite", transformOrigin: "110px 95px" }} />
            <circle cx="110" cy="95" r="6" fill="#a855f7" />
            {[0, 90, 180, 270].map((a, i) => { const r = a * Math.PI / 180; return <line key={i} x1="110" y1="95" x2={110 + 65 * Math.cos(r)} y2={95 + 65 * Math.sin(r)} stroke="rgba(168,85,247,0.15)" strokeWidth="1" />; })}
            <g style={{ animation: "vf-spin 4s linear infinite", transformOrigin: "110px 95px" }}>
                <circle cx="175" cy="95" r="9" fill="#a855f7" />
                <text x="170" y="99" fill="white" fontSize="9" fontFamily="Sora,sans-serif">A</text>
                <line x1="165" y1="95" x2="122" y2="95" stroke="#ef4444" strokeWidth="2" />
                <polygon points="122,92 115,95 122,98" fill="#ef4444" />
            </g>
            <text x="20" y="178" fill="#a855f788" fontSize="8" fontFamily="JetBrains Mono,monospace">ω = v/R = 15/25 = 0.6 rad/s</text>
            <text x="20" y="188" fill="#ef444488" fontSize="8" fontFamily="JetBrains Mono,monospace">a_c = v²/R = 225/25 = 9 m/s²</text>
        </svg>
    );

    if (type === "banked") return (
        <svg viewBox="0 0 220 160" width="100%" style={{ maxHeight: 160 }}>
            <polygon points="50,130 170,130 160,75 60,75" fill="rgba(148,163,184,0.1)" stroke="#94a3b8" strokeWidth="1.5" />
            <defs>
                <marker id="vfang" markerWidth="5" markerHeight="5" refX="3" refY="2.5" orient="auto"><polygon points="0,0 5,2.5 0,5" fill="#22c55e" /></marker>
                <marker id="vfarg" markerWidth="5" markerHeight="5" refX="3" refY="2.5" orient="auto"><polygon points="0,0 5,2.5 0,5" fill="#ef4444" /></marker>
                <marker id="vfarb" markerWidth="5" markerHeight="5" refX="3" refY="2.5" orient="auto"><polygon points="0,0 5,2.5 0,5" fill="#3b82f6" /></marker>
            </defs>
            <line x1="110" y1="103" x2="88" y2="50" stroke="#22c55e" strokeWidth="2" markerEnd="url(#vfang)" />
            <text x="52" y="46" fill="#22c55e" fontSize="8" fontFamily="Sora,sans-serif">N (normal)</text>
            <line x1="110" y1="103" x2="110" y2="138" stroke="#ef4444" strokeWidth="2" markerEnd="url(#vfarg)" />
            <text x="114" y="144" fill="#ef4444" fontSize="8" fontFamily="Sora,sans-serif">mg</text>
            <line x1="110" y1="103" x2="60" y2="103" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="4 2" markerEnd="url(#vfarb)" />
            <text x="18" y="101" fill="#3b82f6" fontSize="8" fontFamily="Sora,sans-serif">Fc</text>
            <rect x="94" y="89" width="32" height="14" rx="3" fill="#475569" stroke="#94a3b8" strokeWidth="1" />
            <circle cx="99" cy="104" r="4" fill="#94a3b8" />
            <circle cx="121" cy="104" r="4" fill="#94a3b8" />
            <text x="10" y="155" fill="#94a3b888" fontSize="7" fontFamily="JetBrains Mono,monospace">tan θ = v²/Rg — no friction</text>
        </svg>
    );

    return null;
}
