import { useState } from "react";
import { useNavigate } from "react-router";
import { T } from "../components/theme.js";
import { Pill } from "../components/Pill.jsx";
import { VFVisualizer } from "../components/visualizers/VFVisualizer.jsx";
import { VFTerminal } from "../components/visualizers/VFTerminal.jsx";
import { VF_LEVELS } from "../data/constants.js";

export default function NewOperationVectorfall() {
    const navigate = useNavigate();
    const onBack = () => navigate(-1);
    const onXpEarned = () => { }; // no-op in standalone route context

    const [phase, setPhase] = useState("intro");
    const [levelIdx, setLevelIdx] = useState(0);
    const [qIdx, setQIdx] = useState(0);
    const [health, setHealth] = useState(100);
    const [selected, setSelected] = useState(null);
    const [result, setResult] = useState(null);
    const [shaking, setShaking] = useState(false);
    const [showCrit, setShowCrit] = useState(false);
    const [score, setScore] = useState(0);
    const [totalAnswered, setTotalAnswered] = useState(0);
    const [xpPops, setXpPops] = useState([]);

    const level = VF_LEVELS[levelIdx];
    const question = level?.questions[qIdx];
    const isLastQ = qIdx === (level?.questions.length - 1);
    const isLastLevel = levelIdx === VF_LEVELS.length - 1;
    const totalQ = VF_LEVELS.reduce((s, l) => s + l.questions.length, 0);
    const healthColor = health > 60 ? "#22c55e" : health > 30 ? "#eab308" : "#ef4444";
    const OPTS = ["A", "B", "C", "D"];

    function addPop(amt) { const id = Date.now(); setXpPops(p => [...p, { id, amt }]); setTimeout(() => setXpPops(p => p.filter(x => x.id !== id)), 1600); }

    function handleAnswer(idx) {
        if (selected !== null || phase !== "game") return;
        setSelected(idx); setTotalAnswered(t => t + 1);
        if (idx === question.ans) {
            setResult("correct"); setScore(s => s + 1);
            const xp = 10; onXpEarned(xp); addPop(xp);
        } else {
            setResult("wrong");
            const newH = Math.max(0, health - 10);
            setHealth(newH); setShaking(true); setShowCrit(true);
            setTimeout(() => setShaking(false), 700);
            setTimeout(() => setShowCrit(false), 900);
            if (newH <= 0) { setTimeout(() => setPhase("defeat"), 1000); return; }
        }
        setTimeout(() => {
            setSelected(null); setResult(null);
            if (isLastQ) { if (isLastLevel) setPhase("victory"); else { setLevelIdx(l => l + 1); setQIdx(0); } }
            else setQIdx(q => q + 1);
        }, 1200);
    }

    function restart() {
        setPhase("game"); setLevelIdx(0); setQIdx(0); setHealth(100);
        setScore(0); setTotalAnswered(0); setSelected(null); setResult(null);
    }

    // INTRO
    if (phase === "intro") return (
        <div style={{ ...T.page }}>
            <div style={{ padding: "78px 28px 40px", maxWidth: 720, margin: "0 auto", textAlign: "center", animation: "fadeUp 0.6s both" }}>
                <button onClick={onBack} style={{ ...T.ghost, fontSize: 13, marginBottom: 28, display: "block", width: "fit-content" }}>← Back to Chapter</button>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed", letterSpacing: 5, marginBottom: 14, fontFamily: "JetBrains Mono,monospace" }}>ANTHROPIC DEFENSE NET · SECTOR 7 UPLINK</div>
                <div style={{ fontSize: 12, fontFamily: "JetBrains Mono,monospace", color: "#ef4444", marginBottom: 12, letterSpacing: 3, animation: "vf-flicker 3s infinite" }}>⚠ XENON INTRUSION DETECTED ⚠</div>
                <h1 style={{ fontSize: "clamp(28px,5vw,46px)", fontWeight: 900, lineHeight: 1.1, marginBottom: 16, letterSpacing: "-0.025em", background: "linear-gradient(135deg,#e2e8f0 0%,#a855f7 50%,#3b82f6 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                    OPERATION<br />VECTORFALL
                </h1>
                <p style={{ fontFamily: "JetBrains Mono,monospace", fontSize: 12, color: "rgba(220,232,255,0.6)", lineHeight: 1.9, marginBottom: 36, padding: "0 20px", whiteSpace: "pre-line" }}>
                    Lead Analyst, wake up. The rogue AI 'XENON' has seized the Defense Grid.{"\n"}
                    Scientist Dr. Aris is trapped. You are our only link to his tracker.{"\n"}
                    Every calculation is a lifeline. <span style={{ color: "#ef4444", fontWeight: 700 }}>Don't miss.</span>
                </p>
                <div style={{ display: "flex", justifyContent: "center", gap: 28, marginBottom: 36, flexWrap: "wrap" }}>
                    {[["22", "QUESTIONS"], ["7", "LEVELS"], ["100%", "INTEGRITY"]].map(([n, l]) => (
                        <div key={l}><div style={{ fontSize: 30, fontWeight: 900, color: "#a855f7" }}>{n}</div><div style={{ fontSize: 9, fontFamily: "JetBrains Mono,monospace", color: "rgba(255,255,255,0.35)", letterSpacing: 2 }}>{l}</div></div>
                    ))}
                </div>
                <button onClick={() => setPhase("game")} style={{ ...T.btn, padding: "14px 52px", fontSize: 14, borderRadius: 12, boxShadow: "0 0 40px rgba(124,58,237,0.45)", letterSpacing: 2, fontFamily: "JetBrains Mono,monospace" }} onMouseEnter={e => e.target.style.boxShadow = "0 0 70px rgba(124,58,237,0.7)"} onMouseLeave={e => e.target.style.boxShadow = "0 0 40px rgba(124,58,237,0.45)"}>
                    INITIATE UPLINK →
                </button>
            </div>
        </div>
    );

    // VICTORY / DEFEAT
    if (phase === "victory" || phase === "defeat") return (
        <div style={{ ...T.page }}>
            <div style={{ padding: "78px 28px 40px", maxWidth: 600, margin: "0 auto", textAlign: "center", animation: "fadeUp 0.7s both" }}>
                <button onClick={onBack} style={{ ...T.ghost, fontSize: 13, marginBottom: 28, display: "block", width: "fit-content" }}>← Back to Chapter</button>
                <div style={{ fontSize: 72, marginBottom: 18 }}>{phase === "victory" ? "🛸" : "💀"}</div>
                <div style={{ fontFamily: "JetBrains Mono,monospace", fontSize: 11, color: phase === "victory" ? "#22c55e" : "#ef4444", letterSpacing: 4, marginBottom: 12 }}>{phase === "victory" ? "MISSION ACCOMPLISHED" : "SYSTEM COMPROMISED"}</div>
                <h2 style={{ fontSize: 34, fontWeight: 900, marginBottom: 14, letterSpacing: "-0.025em", background: phase === "victory" ? "linear-gradient(135deg,#22c55e,#86efac)" : "linear-gradient(135deg,#ef4444,#fca5a5)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                    {phase === "victory" ? "DR. ARIS EXTRACTED" : "XENON PREVAILS"}
                </h2>
                <p style={{ fontFamily: "JetBrains Mono,monospace", fontSize: 12, color: "rgba(220,232,255,0.55)", marginBottom: 36, lineHeight: 1.8 }}>
                    {phase === "victory" ? "Every vector calculated. The grid is cleared. XENON has been neutralized." : "System integrity failed. XENON seized the grid. Aris remains trapped."}
                </p>
                <div style={{ display: "flex", justifyContent: "center", gap: 36, marginBottom: 44 }}>
                    {[{ v: score, l: "CORRECT", c: phase === "victory" ? "#22c55e" : "#ef4444" }, { v: totalQ, l: "TOTAL", c: "#a855f7" }, { v: `${Math.round((score / totalQ) * 100)}%`, l: "ACCURACY", c: "#3b82f6" }].map((s, i) => (
                        <div key={i}><div style={{ fontSize: 42, fontWeight: 900, color: s.c }}>{s.v}</div><div style={{ fontSize: 9, fontFamily: "JetBrains Mono,monospace", color: "rgba(255,255,255,0.3)", letterSpacing: 2 }}>{s.l}</div></div>
                    ))}
                </div>
                <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                    <button onClick={restart} style={{ ...T.btn, padding: "13px 36px", borderRadius: 12, fontFamily: "JetBrains Mono,monospace", letterSpacing: 2 }}>↺ RETRY MISSION</button>
                    <button onClick={onBack} style={{ ...T.ghost, padding: "13px 36px", borderRadius: 12 }}>← Exit</button>
                </div>
            </div>
        </div>
    );

    // GAME
    return (
        <div style={{ ...T.page }}>
            <div style={{ padding: "78px 28px 40px", maxWidth: 1100, margin: "0 auto" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                    <button onClick={onBack} style={{ ...T.ghost, fontSize: 12, padding: "7px 14px" }}>← Exit Mission</button>
                    <div style={{ fontFamily: "JetBrains Mono,monospace", fontSize: 10, color: "#7c3aed", letterSpacing: 3 }}>OPERATION VECTORFALL · {level.label}</div>
                    <div style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center" }}>
                        <span style={{ fontFamily: "JetBrains Mono,monospace", fontSize: 10, color: "rgba(255,255,255,0.35)" }}>Q {totalAnswered + 1}/{totalQ}</span>
                        <span style={{ fontFamily: "JetBrains Mono,monospace", fontSize: 10, color: "#22c55e" }}>✓ {score}</span>
                    </div>
                </div>
                <div style={{ ...T.card, padding: "12px 16px", marginBottom: 14, border: "1px solid rgba(124,58,237,0.18)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                        <span style={{ fontFamily: "JetBrains Mono,monospace", fontSize: 9, color: "rgba(255,255,255,0.35)", letterSpacing: 2 }}>SIMULATION INTEGRITY</span>
                        <span style={{ fontFamily: "JetBrains Mono,monospace", fontSize: 9, color: healthColor, animation: health < 40 ? "vf-healthPulse 1s infinite" : "none" }}>{health}%</span>
                    </div>
                    <div style={{ height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden", marginBottom: 8 }}>
                        <div style={{ height: "100%", width: `${health}%`, background: `linear-gradient(90deg,${healthColor},${healthColor}99)`, borderRadius: 99, transition: "width 0.5s ease", boxShadow: `0 0 10px ${healthColor}88` }} />
                    </div>
                    <div style={{ display: "flex", gap: 4 }}>
                        {VF_LEVELS.map((l, i) => <div key={i} style={{ flex: 1, height: 3, borderRadius: 99, background: i < levelIdx ? level.color : i === levelIdx ? `${level.color}88` : "rgba(255,255,255,0.06)", transition: "all 0.3s" }} />)}
                    </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1.1fr", gap: 16, alignItems: "start" }}>
                    <div>
                        <div style={{ ...T.card, padding: "12px 16px", marginBottom: 12, display: "flex", alignItems: "center", gap: 12, border: `1px solid ${level.color}33`, background: `${level.color}08` }}>
                            <span style={{ fontSize: 22 }}>{level.badge}</span>
                            <div>
                                <div style={{ fontFamily: "JetBrains Mono,monospace", fontSize: 9, color: level.color, letterSpacing: 3, marginBottom: 2 }}>{level.label}</div>
                                <div style={{ fontWeight: 800, fontSize: 14, color: "white" }}>{level.title}</div>
                            </div>
                        </div>
                        <div style={{ ...T.card, padding: "12px 14px", marginBottom: 12, border: "1px solid rgba(124,58,237,0.14)" }}>
                            <div style={{ fontFamily: "JetBrains Mono,monospace", fontSize: 9, color: "rgba(255,255,255,0.28)", letterSpacing: 2, marginBottom: 8 }}>TACTICAL VISUALIZER</div>
                            <VFVisualizer type={level.visualizer} color={level.color} />
                        </div>
                        <VFTerminal text={level.voice} />
                    </div>
                    <div style={{ position: "relative" }}>
                        {xpPops.map(p => <div key={p.id} style={{ position: "absolute", top: -8, right: 16, zIndex: 50, color: "#fde68a", fontWeight: 900, fontSize: 20, animation: "xpPop 1.6s ease forwards", textShadow: "0 0 16px rgba(253,230,138,0.6)", pointerEvents: "none", fontFamily: "JetBrains Mono,monospace" }}>+{p.amt} XP ⚡</div>)}
                        <div style={{ ...T.card, padding: "24px", border: result === "correct" ? "1px solid rgba(34,197,94,0.5)" : result === "wrong" ? "1px solid rgba(239,68,68,0.5)" : "1px solid rgba(124,58,237,0.22)", transition: "border-color 0.3s", animation: shaking ? "vf-wrongShake 0.7s ease" : "vf-popIn 0.4s ease", position: "relative", overflow: "hidden" }}>
                            <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0, background: "repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.04) 3px,rgba(0,0,0,0.04) 6px)", animation: "vf-scanline 6s linear infinite" }} />
                            {showCrit && <div style={{ position: "absolute", inset: 0, zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(239,68,68,0.08)", animation: "vf-critOverlay 0.9s ease forwards" }}><div style={{ fontFamily: "JetBrains Mono,monospace", fontSize: 16, color: "#ef4444", letterSpacing: 4, textShadow: "0 0 24px #ef4444", fontWeight: 900 }}>⚠ CRITICAL ERROR ⚠</div></div>}
                            <div style={{ position: "relative", zIndex: 1 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                                    <div style={{ display: "flex", gap: 6 }}><Pill color={level.color}>{level.label}</Pill><Pill color="#4b5e82">Q {qIdx + 1}/{level.questions.length}</Pill></div>
                                    <span style={{ fontFamily: "JetBrains Mono,monospace", fontSize: 9, color: "rgba(255,255,255,0.25)" }}>MOTION IN A PLANE</span>
                                </div>
                                <p style={{ fontSize: 15, fontWeight: 600, color: "#dce8ff", lineHeight: 1.75, marginBottom: 20, fontFamily: "'Sora',sans-serif" }}>{question.q}</p>
                                <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 16 }}>
                                    {question.opts.map((opt, i) => {
                                        let bg = "rgba(255,255,255,0.04)", border = "1px solid rgba(124,58,237,0.18)", color = "#c4cfe8";
                                        if (selected !== null) {
                                            if (i === question.ans) { bg = "rgba(34,197,94,0.12)"; border = "2px solid #34d399"; color = "white"; }
                                            else if (i === selected && i !== question.ans) { bg = "rgba(239,68,68,0.1)"; border = "2px solid #ef4444"; color = "#f87171"; }
                                            else { bg = "rgba(255,255,255,0.02)"; border = "1px solid rgba(255,255,255,0.05)"; color = "#3a4a62"; }
                                        }
                                        return (
                                            <button key={i} onClick={() => handleAnswer(i)} disabled={selected !== null} style={{ width: "100%", textAlign: "left", padding: "12px 16px", borderRadius: 10, fontFamily: "'Sora',sans-serif", fontWeight: 600, fontSize: 14, cursor: selected !== null ? "default" : "pointer", transition: "all 0.18s", display: "flex", alignItems: "center", gap: 12, lineHeight: 1.5, background: bg, border, color }}
                                                onMouseEnter={e => { if (selected === null) { e.currentTarget.style.borderColor = `${level.color}66`; e.currentTarget.style.background = `${level.color}12`; } }}
                                                onMouseLeave={e => { if (selected === null) { e.currentTarget.style.borderColor = "rgba(124,58,237,0.18)"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; } }}>
                                                <span style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, background: selected !== null && i === question.ans ? "#34d399" : selected !== null && i === selected && i !== question.ans ? "#ef4444" : "rgba(124,58,237,0.2)", color: selected !== null && (i === question.ans || (i === selected && i !== question.ans)) ? "white" : "#a78bfa", border: "1px solid rgba(124,58,237,0.3)", transition: "all 0.2s" }}>
                                                    {selected !== null && i === question.ans ? "✓" : selected !== null && i === selected && i !== question.ans ? "✗" : OPTS[i]}
                                                </span>
                                                <span>{opt}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                                {result && (
                                    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: result === "correct" ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)", border: `1px solid ${result === "correct" ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`, borderRadius: 10, animation: "fadeUp 0.3s both" }}>
                                        <span style={{ fontSize: 22 }}>{result === "correct" ? "🎉" : "❌"}</span>
                                        <div><p style={{ fontWeight: 800, fontSize: 14, color: result === "correct" ? "#34d399" : "#f87171", fontFamily: "'Sora',sans-serif" }}>{result === "correct" ? "Correct! +10 XP" : "Incorrect — Integrity −10%"}</p>{result === "wrong" && <p style={{ fontSize: 11, color: "#6b7fa8", marginTop: 2, fontFamily: "'Sora',sans-serif" }}>Correct: ({OPTS[question.ans]}) {question.opts[question.ans]}</p>}</div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div style={{ ...T.card, padding: "12px 16px", marginTop: 10, border: "1px solid rgba(124,58,237,0.1)" }}>
                            <div style={{ fontFamily: "JetBrains Mono,monospace", fontSize: 9, color: "rgba(255,255,255,0.2)", letterSpacing: 2, marginBottom: 8 }}>MISSION PROGRESS</div>
                            <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                                {VF_LEVELS.map((l, i) => (
                                    <div key={i} style={{ width: 30, height: 30, borderRadius: 8, background: i < levelIdx ? `${l.color}22` : i === levelIdx ? `${l.color}18` : "rgba(255,255,255,0.03)", border: `1px solid ${i <= levelIdx ? `${l.color}44` : "rgba(255,255,255,0.06)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, boxShadow: i === levelIdx ? `0 0 12px ${l.color}44` : "none", transition: "all 0.3s" }}>
                                        {i < levelIdx ? "✓" : l.badge}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
