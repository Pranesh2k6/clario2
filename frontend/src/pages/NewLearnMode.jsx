import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { T } from "../components/theme.js";
import { Pill } from "../components/Pill.jsx";

export default function LearnMode() {
    const navigate = useNavigate();
    const canvasRef = useRef(null);
    const stateRef = useRef({ time: 0, paused: false, angle: 45, speed: 50, animId: null });
    const [angle, setAngle] = useState(45);
    const [speed, setSpeed] = useState(50);
    const [paused, setPaused] = useState(false);
    const [stats, setStats] = useState({ t: "0.00", vx: "0", vy: "0", h: "0", r: "0" });
    const [step, setStep] = useState(0);

    const steps = [
        { title: "What is Projectile Motion?", color: "#a78bfa", body: "A projectile is any object launched into the air and moving only under gravity. The key insight: horizontal and vertical motions are completely independent of each other." },
        { title: "The Two Components", color: "#60a5fa", body: "Horizontal: vₓ = u·cos θ — constant forever (no horizontal force).\nVertical: vy = u·sin θ − g·t — decreases as gravity pulls down.\nTry dragging the angle slider and watch the vectors change!" },
        { title: "At the Peak", color: "#34d399", body: "At the highest point, the vertical velocity = 0. Only vₓ remains.\nSpeed at peak = u·cos θ\nKinetic energy at peak = ½m(u·cosθ)²\nSet θ = 90° — what happens to the range?" },
        { title: "Range Formula", color: "#fde68a", body: "Range R = u²·sin(2θ) / g\nMaximum range at θ = 45° (sin 90° = 1).\nTime of flight T = 2u·sinθ / g\nTry θ = 30° and 60° — they give the same range!" },
        { title: "Real-World Insight", color: "#fb923c", body: "Why does a bomb dropped from a moving plane follow a parabola? Because it keeps the plane's horizontal velocity!\nSame physics: vₓ = constant, vy increases under gravity → parabolic path." },
    ];

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        const S = stateRef.current;
        function draw() {
            const W = canvas.width, H = canvas.height;
            ctx.clearRect(0, 0, W, H);
            const ang = S.angle * Math.PI / 180;
            const spd = S.speed;
            const vx = spd * Math.cos(ang);
            const vy0 = spd * Math.sin(ang);
            const vy = vy0 - 9.8 * S.time;
            const x = vx * S.time;
            const y = vy0 * S.time - 0.5 * 9.8 * S.time * S.time;
            const scale = 3.2, ox = 50, oy = H - 60;
            ctx.strokeStyle = "rgba(124,58,237,0.25)"; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(0, oy); ctx.lineTo(W, oy); ctx.stroke();
            ctx.strokeStyle = "rgba(255,255,255,0.03)"; ctx.lineWidth = 1;
            for (let gx = 0; gx < W; gx += 60) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke(); }
            for (let gy = 0; gy < H; gy += 40) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke(); }
            ctx.strokeStyle = "rgba(184,146,255,0.55)"; ctx.lineWidth = 2;
            ctx.shadowColor = "#b892ff"; ctx.shadowBlur = 6;
            ctx.beginPath(); let first = true;
            for (let t2 = 0; t2 <= S.time; t2 += 0.04) {
                const tx = vx * t2, ty = vy0 * t2 - 0.5 * 9.8 * t2 * t2;
                if (ty < 0) break;
                const px = ox + tx * scale, py = oy - ty * scale;
                if (first) { ctx.moveTo(px, py); first = false; } else ctx.lineTo(px, py);
            }
            ctx.stroke(); ctx.shadowBlur = 0;
            const Tfull = 2 * vy0 / 9.8;
            ctx.strokeStyle = "rgba(184,146,255,0.12)"; ctx.lineWidth = 1.5; ctx.setLineDash([5, 6]);
            ctx.beginPath(); first = true;
            for (let t2 = 0; t2 <= Tfull; t2 += 0.04) {
                const tx = vx * t2, ty = vy0 * t2 - 0.5 * 9.8 * t2 * t2;
                const px = ox + tx * scale, py = oy - ty * scale;
                if (first) { ctx.moveTo(px, py); first = false; } else ctx.lineTo(px, py);
            } ctx.stroke(); ctx.setLineDash([]);
            const tApex = vy0 / 9.8;
            const apexX = ox + vx * tApex * scale, apexY = oy - (vy0 * tApex - 0.5 * 9.8 * tApex * tApex) * scale;
            ctx.strokeStyle = "rgba(52,211,153,0.5)"; ctx.lineWidth = 1; ctx.setLineDash([3, 4]);
            ctx.beginPath(); ctx.moveTo(apexX, apexY); ctx.lineTo(apexX, oy); ctx.stroke(); ctx.setLineDash([]);
            ctx.fillStyle = "rgba(52,211,153,0.8)"; ctx.font = "bold 10px Sora,sans-serif";
            ctx.fillText("APEX", apexX + 4, apexY - 6);
            if (y >= 0) {
                const bx = ox + x * scale, by = oy - y * scale;
                const grd = ctx.createRadialGradient(bx, by, 0, bx, by, 14);
                grd.addColorStop(0, "rgba(255,209,102,0.9)"); grd.addColorStop(1, "rgba(255,209,102,0)");
                ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(bx, by, 14, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = "#ffd166"; ctx.shadowColor = "#ffd166"; ctx.shadowBlur = 12;
                ctx.beginPath(); ctx.arc(bx, by, 7, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
                const vxLen = vx * 1.6;
                ctx.strokeStyle = "#7df9ff"; ctx.lineWidth = 2.5; ctx.shadowColor = "#7df9ff"; ctx.shadowBlur = 8;
                ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + vxLen, by); ctx.stroke();
                ctx.fillStyle = "#7df9ff"; ctx.font = "bold 11px Sora,sans-serif"; ctx.shadowBlur = 0;
                ctx.fillText("vₓ", bx + vxLen / 2 - 4, by - 7);
                const vyLen = vy * 1.6;
                ctx.strokeStyle = "#ff5da2"; ctx.lineWidth = 2.5; ctx.shadowColor = "#ff5da2"; ctx.shadowBlur = 8;
                ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx, by - vyLen); ctx.stroke(); ctx.shadowBlur = 0;
                ctx.fillStyle = "#ff5da2"; ctx.font = "bold 11px Sora,sans-serif";
                ctx.fillText(vy >= 0 ? "vy ↑" : "vy ↓", bx + 6, by - vyLen / 2);
            }
            ctx.strokeStyle = "rgba(167,139,250,0.5)"; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.arc(ox, oy, 34, -ang, 0, true); ctx.stroke();
            ctx.fillStyle = "#a78bfa"; ctx.font = "bold 11px Sora,sans-serif";
            ctx.fillText(`${S.angle}°`, ox + 38 * Math.cos(ang / 2), oy - 38 * Math.sin(ang / 2) + 4);
            setStats({ t: S.time.toFixed(2), vx: vx.toFixed(1), vy: vy.toFixed(1), h: Math.max(y, 0).toFixed(1), r: x.toFixed(1) });
            if (!S.paused) { S.time += 0.028; if (y < -0.5) S.time = 0; }
            S.animId = requestAnimationFrame(draw);
        }
        S.animId = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(S.animId);
    }, []);

    function handleAngle(v) { setAngle(v); stateRef.current.angle = v; stateRef.current.time = 0; }
    function handleSpeed(v) { setSpeed(v); stateRef.current.speed = v; stateRef.current.time = 0; }
    function handlePause() { setPaused(p => { stateRef.current.paused = !p; return !p; }); }
    function handleReset() { stateRef.current.time = 0; stateRef.current.paused = false; setPaused(false); }
    const sliderStyle = { width: "100%", accentColor: "#a78bfa", cursor: "pointer" };

    return (
        <div style={{ ...T.page }}>
            <div style={{ padding: "78px 22px 40px", maxWidth: 1200, margin: "0 auto" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, animation: "fadeUp 0.4s both" }}>
                    <button onClick={() => navigate(-1)} style={{ ...T.ghost, fontSize: 13 }}>← Back</button>
                    <Pill color="#a78bfa">📖 Learn Mode</Pill>
                    <h1 style={{ fontSize: 20, fontWeight: 900, color: "white", margin: 0 }}>Motion in a Plane — Interactive Lab</h1>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16, alignItems: "start" }}>
                    <div>
                        <div style={{ ...T.card, padding: 0, overflow: "hidden", border: "1px solid rgba(139,92,246,0.28)", marginBottom: 14, borderRadius: 16, position: "relative" }}>
                            <div style={{ padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontSize: 12, fontWeight: 700, color: "#a78bfa", letterSpacing: "0.08em" }}>🔬 PROJECTILE MOTION SIMULATOR</span>
                                <div style={{ display: "flex", gap: 7 }}>
                                    <button onClick={handlePause} style={{ ...T.ghost, padding: "6px 14px", fontSize: 12 }}>{paused ? "▶ Resume" : "⏸ Pause"}</button>
                                    <button onClick={handleReset} style={{ ...T.ghost, padding: "6px 14px", fontSize: 12 }}>↺ Reset</button>
                                </div>
                            </div>
                            <canvas ref={canvasRef} width={720} height={340} style={{ display: "block", width: "100%", height: "auto", background: "radial-gradient(ellipse at bottom,#110828 0%,#060818 100%)" }} />
                        </div>
                        <div style={{ ...T.card, padding: "16px 20px", marginBottom: 14, border: "1px solid rgba(124,58,237,0.18)" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                                <div>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><label style={{ fontSize: 12, fontWeight: 700, color: "#a78bfa" }}>Launch Angle</label><span style={{ fontSize: 13, fontWeight: 900, color: "white", fontFamily: "'JetBrains Mono',monospace" }}>{angle}°</span></div>
                                    <input type="range" min="5" max="85" value={angle} onChange={e => handleAngle(+e.target.value)} style={sliderStyle} />
                                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}><span style={{ fontSize: 10, color: "#2a3448" }}>5°</span><span style={{ fontSize: 10, color: "#fde68a" }}>45° = max range</span><span style={{ fontSize: 10, color: "#2a3448" }}>85°</span></div>
                                </div>
                                <div>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><label style={{ fontSize: 12, fontWeight: 700, color: "#60a5fa" }}>Initial Speed</label><span style={{ fontSize: 13, fontWeight: 900, color: "white", fontFamily: "'JetBrains Mono',monospace" }}>{speed} m/s</span></div>
                                    <input type="range" min="15" max="100" value={speed} onChange={e => handleSpeed(+e.target.value)} style={sliderStyle} />
                                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}><span style={{ fontSize: 10, color: "#2a3448" }}>15</span><span style={{ fontSize: 10, color: "#2a3448" }}>100 m/s</span></div>
                                </div>
                            </div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8 }}>
                            {[{ l: "Time", v: `${stats.t}s`, c: "#a78bfa" }, { l: "vₓ (m/s)", v: stats.vx, c: "#7df9ff" }, { l: "vᵧ (m/s)", v: stats.vy, c: "#ff5da2" }, { l: "Height", v: `${stats.h}m`, c: "#fde68a" }, { l: "Range", v: `${stats.r}m`, c: "#34d399" }].map((s, i) => (
                                <div key={i} style={{ ...T.card, padding: "10px", textAlign: "center", border: "1px solid rgba(124,58,237,0.12)" }}>
                                    <p style={{ fontSize: 10, color: "#2a3448", fontWeight: 700, marginBottom: 3 }}>{s.l}</p>
                                    <p style={{ fontSize: 15, fontWeight: 900, color: s.c, fontFamily: "'JetBrains Mono',monospace" }}>{s.v}</p>
                                </div>
                            ))}
                        </div>
                        <div style={{ ...T.card, padding: "14px 18px", marginTop: 12, border: "1px solid rgba(124,58,237,0.14)" }}>
                            <p style={{ fontSize: 10, fontWeight: 700, color: "#a78bfa", letterSpacing: "0.08em", marginBottom: 10 }}>✦ KEY FORMULAS</p>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                                {[{ f: "vₓ = u·cos θ", d: "Horizontal (constant)" }, { f: "vᵧ = u·sinθ − gt", d: "Vertical velocity" }, { f: "R = u²·sin(2θ)/g", d: "Range" }, { f: "H = u²·sin²θ/2g", d: "Max height" }, { f: "T = 2u·sinθ/g", d: "Time of flight" }, { f: "θ = 45° → R_max", d: "Optimal angle" }].map((f, i) => (
                                    <div key={i} style={{ background: "rgba(124,58,237,0.07)", borderRadius: 8, padding: "8px 12px", border: "1px solid rgba(124,58,237,0.12)" }}>
                                        <p style={{ fontSize: 13, fontWeight: 800, color: "#c4b5fd", fontFamily: "'JetBrains Mono',monospace", marginBottom: 2 }}>{f.f}</p>
                                        <p style={{ fontSize: 10, color: "#3a4a62" }}>{f.d}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div style={{ position: "sticky", top: 70 }}>
                        <div style={{ ...T.card, padding: "18px 20px", border: "1px solid rgba(124,58,237,0.22)", marginBottom: 12 }}>
                            <p style={{ fontSize: 10, fontWeight: 700, color: "#a78bfa", letterSpacing: "0.08em", marginBottom: 12 }}>📖 CONCEPT WALKTHROUGH</p>
                            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
                                {steps.map((s, i) => (
                                    <button key={i} onClick={() => setStep(i)} style={{ textAlign: "left", background: step === i ? `${s.color}18` : "rgba(255,255,255,0.02)", border: `1px solid ${step === i ? s.color + "44" : "rgba(255,255,255,0.05)"}`, borderRadius: 9, padding: "9px 12px", cursor: "pointer", transition: "all 0.15s", fontFamily: "'Sora',sans-serif" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                                            <span style={{ width: 20, height: 20, borderRadius: "50%", background: step === i ? s.color : "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 900, color: step === i ? "#0a0e28" : "#3a4a62", flexShrink: 0 }}>{i + 1}</span>
                                            <span style={{ fontSize: 12, fontWeight: 700, color: step === i ? s.color : "#4b5e82" }}>{s.title}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                            <div style={{ background: `${steps[step].color}0e`, border: `1px solid ${steps[step].color}33`, borderRadius: 12, padding: "16px", animation: "fadeUp 0.3s both" }} key={step}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: steps[step].color, boxShadow: `0 0 8px ${steps[step].color}` }} />
                                    <p style={{ fontSize: 13, fontWeight: 800, color: steps[step].color }}>{steps[step].title}</p>
                                </div>
                                <p style={{ fontSize: 13, color: "#c4cfe8", lineHeight: 1.75, whiteSpace: "pre-line" }}>{steps[step].body}</p>
                            </div>
                            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                                <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0} style={{ ...T.ghost, flex: 1, padding: "9px", opacity: step === 0 ? 0.3 : 1, fontSize: 12 }}>← Prev</button>
                                <button onClick={() => setStep(s => Math.min(steps.length - 1, s + 1))} disabled={step === steps.length - 1} style={{ ...T.btn, flex: 1, padding: "9px", opacity: step === steps.length - 1 ? 0.3 : 1, fontSize: 12 }}>Next →</button>
                            </div>
                        </div>
                        <div style={{ ...T.card, padding: "14px 16px", border: "1px solid rgba(52,211,153,0.22)", background: "rgba(52,211,153,0.04)" }}>
                            <p style={{ fontSize: 11, fontWeight: 700, color: "#34d399", marginBottom: 6 }}>🧪 Try It Yourself</p>
                            <p style={{ fontSize: 12, color: "#6b7fa8", lineHeight: 1.6 }}>Set angle to <strong style={{ color: "white" }}>30°</strong> and <strong style={{ color: "white" }}>60°</strong>. Notice the range is the same — both are complementary angles!</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
