import { useState, useRef } from "react";
import { useNavigate } from "react-router";
import { T } from "../components/theme.js";
import { Pill } from "../components/Pill.jsx";
import { QUESTIONS } from "../data/constants.js";
import { calcDebt, nextDiff } from "../utils/helpers.js";

export default function NewAdaptiveQuiz() {
    const navigate = useNavigate();
    const onBack = () => navigate(-1);
    const onXpEarned = () => { };

    const [diff, setDiff] = useState("easy");
    const [phase, setPhase] = useState("q");
    const [hintsShown, setHintsShown] = useState(0);
    const [attemptsMade, setAttemptsMade] = useState(0);
    const [firstWrongIdx, setFirstWrongIdx] = useState(null);
    const [selected, setSelected] = useState(null);
    const [answered, setAnswered] = useState(null);
    const [shaking, setShaking] = useState(false);
    const [debtScore, setDebtScore] = useState(0);
    const [history, setHistory] = useState([]);
    const [session, setSession] = useState({ correct: 0, total: 0, xp: 0 });
    const [xpPops, setXpPops] = useState([]);
    const [qCounter, setQCounter] = useState(0);
    const qStartRef = useRef(Date.now());

    const pool = QUESTIONS[diff];
    const usedIds = history.map(h => h.id);
    const avail = pool.filter(q => !usedIds.includes(q.id));
    const q = avail.length > 0 ? avail[0] : pool[qCounter % pool.length];
    const dc = { easy: "#34d399", medium: "#f59e0b", hard: "#ef4444" };
    const LABELS = ["A", "B", "C", "D"];
    const hintPenalties = ["−15% XP", "−15% more XP", "−20% more XP"];
    const hintColors = ["#fde68a", "#fb923c", "#f87171"];
    const hintLabels = ["Hint 1 — Concept Direction", "Hint 2 — Formula Application", "Hint 3 — Guided Substitution"];
    const hintTexts = [q.h1, q.h2, q.h3];

    function addPop(amt) { const id = Date.now(); setXpPops(p => [...p, { id, amt }]); setTimeout(() => setXpPops(p => p.filter(x => x.id !== id)), 1500); }

    function submitAnswer(idx) {
        if (phase !== "q") return;
        const isCorrect = idx === q.correct;
        if (isCorrect) {
            const time = (Date.now() - qStartRef.current) / 1000;
            const debt = calcDebt(hintsShown, attemptsMade, time, q.t);
            setDebtScore(debt); setSelected(idx); setAnswered(true); setPhase("result");
            const earned = Math.round(q.xp * (1 - debt));
            setSession(s => ({ ...s, correct: s.correct + 1, total: s.total + 1, xp: s.xp + earned }));
            onXpEarned(earned); addPop(earned);
            setHistory(h => [...h, { id: q.id, diff, correct: true, debt, nd: nextDiff(diff, true, hintsShown) }]);
        } else {
            if (attemptsMade === 0) {
                setFirstWrongIdx(idx); setAttemptsMade(1); setShaking(true);
                setTimeout(() => setShaking(false), 600);
            } else {
                const time = (Date.now() - qStartRef.current) / 1000;
                const debt = calcDebt(hintsShown, 2, time, q.t);
                setDebtScore(debt); setSelected(idx); setAnswered(false); setPhase("result");
                setSession(s => ({ ...s, total: s.total + 1 }));
                setHistory(h => [...h, { id: q.id, diff, correct: false, debt, nd: nextDiff(diff, false, hintsShown) }]);
            }
        }
    }

    function nextQ() {
        const nd = nextDiff(diff, answered, hintsShown);
        setDiff(nd); setHintsShown(0); setAttemptsMade(0); setFirstWrongIdx(null);
        setSelected(null); setAnswered(null); setPhase("q"); setShaking(false);
        qStartRef.current = Date.now(); setQCounter(c => c + 1);
    }

    const total = history.length;
    const acc = total > 0 ? Math.round((session.correct / session.total) * 100) : 0;
    const attemptsLeft = phase === "q" ? 2 - attemptsMade : 0;

    function optStyle(i) {
        const isFirstWrong = firstWrongIdx === i && phase === "q";
        const base = { width: "100%", textAlign: "left", padding: "14px 18px", borderRadius: 12, fontFamily: "'Sora',sans-serif", fontWeight: 600, fontSize: 14, cursor: phase === "q" ? "pointer" : "default", transition: "all 0.18s", display: "flex", alignItems: "center", gap: 13, lineHeight: 1.5 };
        if (phase === "q") { if (isFirstWrong) return { ...base, background: "rgba(239,68,68,0.08)", border: "1.5px solid rgba(239,68,68,0.5)", color: "#f87171" }; return { ...base, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(124,58,237,0.2)", color: "#c4cfe8" }; }
        if (i === q.correct) return { ...base, background: "rgba(52,211,153,0.12)", border: "2px solid #34d399", color: "white" };
        if (i === selected && i !== q.correct) return { ...base, background: "rgba(239,68,68,0.1)", border: "2px solid #ef4444", color: "#f87171" };
        return { ...base, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", color: "#3a4a62" };
    }
    function optLabelStyle(i) {
        const base = { width: 30, height: 30, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, transition: "all 0.2s" };
        if (phase === "result") { if (i === q.correct) return { ...base, background: "#34d399", color: "white", border: "1px solid #34d399" }; if (i === selected && i !== q.correct) return { ...base, background: "#ef4444", color: "white", border: "1px solid #ef4444" }; }
        if (firstWrongIdx === i && phase === "q") return { ...base, background: "rgba(239,68,68,0.25)", color: "#f87171", border: "1px solid rgba(239,68,68,0.5)" };
        return { ...base, background: "rgba(124,58,237,0.18)", color: "#a78bfa", border: "1px solid rgba(124,58,237,0.3)" };
    }

    return (
        <div style={{ ...T.page }}>
            <div style={{ padding: "78px 28px 40px", maxWidth: 860, margin: "0 auto" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                    <button onClick={onBack} style={{ ...T.ghost, fontSize: 13 }}>← Back</button>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}><Pill color={dc[diff]}>{diff.toUpperCase()}</Pill><span style={{ fontSize: 12, color: "#2a3448" }}>Adaptive Engine · MCQ</span></div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 9, marginBottom: 18 }}>
                    {[{ l: "Session XP", v: `+${session.xp}`, c: "#fde68a", i: "⚡" }, { l: "Correct", v: session.correct, c: "#34d399", i: "✓" }, { l: "Accuracy", v: total ? `${acc}%` : "—", c: "#a78bfa", i: "🎯" }, { l: "Debt Score", v: debtScore > 0 ? debtScore.toFixed(2) : "0.00", c: debtScore > 0.4 ? "#ef4444" : "#4b5e82", i: "📊" }].map((s, i) => (
                        <div key={i} style={{ ...T.card, padding: "11px 14px", textAlign: "center" }}><p style={{ fontSize: 10, color: "#2a3448", fontWeight: 700, letterSpacing: "0.08em", marginBottom: 3 }}>{s.i} {s.l}</p><p style={{ fontSize: 20, fontWeight: 900, color: s.c }}>{s.v}</p></div>
                    ))}
                </div>
                {history.length > 0 && (
                    <div style={{ display: "flex", gap: 5, marginBottom: 16, alignItems: "center", flexWrap: "wrap" }}>
                        <span style={{ fontSize: 10, color: "#2a3448", fontWeight: 700, marginRight: 3, letterSpacing: "0.08em" }}>PATH:</span>
                        {history.slice(-9).map((h, i) => (
                            <div key={i} title={`${h.diff} · ${h.correct ? "✓" : "✗"}`} style={{ width: 26, height: 26, borderRadius: "50%", background: h.correct ? "rgba(52,211,153,0.18)" : "rgba(239,68,68,0.14)", border: `2px solid ${h.correct ? "#34d39960" : "#ef444450"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, position: "relative" }}>
                                <span style={{ fontSize: 8, color: dc[h.diff], position: "absolute", bottom: -12, fontWeight: 700 }}>{h.diff[0].toUpperCase()}</span>{h.correct ? "✓" : "✗"}
                            </div>
                        ))}
                        <span style={{ fontSize: 11, color: "#2a3448", marginLeft: 10 }}>→ <span style={{ color: dc[diff], fontWeight: 700 }}>{diff}</span></span>
                    </div>
                )}
                <div style={{ position: "relative" }}>
                    {xpPops.map(p => (
                        <div key={p.id} style={{ position: "absolute", top: -8, right: 18, zIndex: 50, color: "#fde68a", fontWeight: 900, fontSize: 22, animation: "xpPop 1.5s ease forwards", textShadow: "0 0 16px rgba(253,230,138,0.65)", pointerEvents: "none", fontFamily: "'JetBrains Mono',monospace" }}>+{p.amt} XP ⚡</div>
                    ))}
                    <div style={{ ...T.card, padding: "28px 32px", border: phase === "result" ? `1px solid ${answered ? "rgba(52,211,153,0.42)" : "rgba(239,68,68,0.38)"}` : "1px solid rgba(124,58,237,0.24)", transition: "border-color 0.3s", animation: shaking ? "shake 0.6s ease" : "scaleIn 0.3s both" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                            <div style={{ display: "flex", gap: 7 }}><Pill color={dc[diff]}>{diff}</Pill><Pill color="#fde68a">⚡ {q.xp} XP</Pill><Pill color="#4b5e82">⏱ {q.t}s</Pill></div>
                            <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
                                {phase === "q" && <span style={{ fontSize: 11, color: attemptsLeft === 1 ? "#fb923c" : "#4b5e82", fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", background: attemptsLeft === 1 ? "rgba(251,146,60,0.1)" : "transparent", padding: "3px 8px", borderRadius: 6, border: attemptsLeft === 1 ? "1px solid rgba(251,146,60,0.3)" : "none" }}>{attemptsLeft === 2 ? "2 attempts left" : attemptsLeft === 1 ? "⚠️ 1 attempt left" : ""}</span>}
                                <span style={{ fontSize: 11, color: "#2a3448", fontFamily: "'JetBrains Mono',monospace" }}>Q{total + 1} · Motion in a Plane</span>
                            </div>
                        </div>
                        <p style={{ fontSize: 16, color: "#dce8ff", lineHeight: 1.78, fontWeight: 600, marginBottom: 24 }}>{q.q}</p>
                        {attemptsMade === 1 && phase === "q" && <div style={{ background: "rgba(251,146,60,0.07)", border: "1px solid rgba(251,146,60,0.28)", borderRadius: 10, padding: "10px 14px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10, animation: "fadeUp 0.3s both" }}><span style={{ fontSize: 18 }}>⚠️</span><div><p style={{ fontSize: 13, fontWeight: 700, color: "#fb923c" }}>That's not quite right — you have one more attempt!</p><p style={{ fontSize: 11, color: "#7a5230" }}>Tip: use a hint below to guide your thinking before trying again.</p></div></div>}
                        {hintsShown > 0 && <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>{[0, 1, 2].filter(i => i < hintsShown).map(i => <div key={i} style={{ background: `${hintColors[i]}08`, border: `1px solid ${hintColors[i]}28`, borderRadius: 10, padding: "12px 15px", animation: "fadeUp 0.3s both" }}><p style={{ fontSize: 10, fontWeight: 700, color: hintColors[i], marginBottom: 4, letterSpacing: "0.08em" }}>💡 {hintLabels[i]}</p><p style={{ fontSize: 13, color: `${hintColors[i]}cc`, lineHeight: 1.65 }}>{hintTexts[i]}</p></div>)}</div>}
                        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                            {q.options.map((opt, i) => (
                                <button key={i} onClick={() => submitAnswer(i)} style={optStyle(i)} onMouseEnter={e => { if (phase === "q" && firstWrongIdx !== i) e.currentTarget.style.borderColor = "rgba(124,58,237,0.55)"; }} onMouseLeave={e => { if (phase === "q" && firstWrongIdx !== i) e.currentTarget.style.borderColor = "rgba(124,58,237,0.2)"; }}>
                                    <span style={optLabelStyle(i)}>{phase === "result" && i === q.correct ? "✓" : phase === "result" && i === selected && i !== q.correct ? "✗" : LABELS[i]}</span>
                                    <span>{opt}</span>
                                </button>
                            ))}
                        </div>
                        {phase === "result" && (
                            <div style={{ animation: "fadeUp 0.35s both" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", background: answered ? "rgba(52,211,153,0.08)" : "rgba(239,68,68,0.08)", border: `1px solid ${answered ? "rgba(52,211,153,0.3)" : "rgba(239,68,68,0.3)"}`, borderRadius: 12, marginBottom: 14 }}>
                                    <span style={{ fontSize: 24 }}>{answered ? "🎉" : "❌"}</span>
                                    <div><p style={{ fontWeight: 800, fontSize: 15, color: answered ? "#34d399" : "#f87171" }}>{answered ? `Correct! ${attemptsMade === 0 ? "First attempt — perfect!" : "Got it on the second try."}` : "Incorrect on both attempts."}</p><p style={{ fontSize: 12, color: "#6b7fa8", marginTop: 2 }}>{answered ? `+${Math.round(q.xp * (1 - debtScore))} XP earned${debtScore > 0 ? ` (debt: −${Math.round(debtScore * 100)}%)` : ""}` : `Correct answer: (${LABELS[q.correct]}) ${q.options[q.correct]}`}</p></div>
                                </div>
                                <div style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)", borderRadius: 12, padding: "14px 18px", marginBottom: 14 }}>
                                    <p style={{ fontSize: 10, fontWeight: 700, color: "#a78bfa", marginBottom: 6, letterSpacing: "0.08em" }}>✦ FULL EXPLANATION</p>
                                    <p style={{ fontSize: 13, color: "#8b9ec7", lineHeight: 1.75 }}>{q.exp}</p>
                                </div>
                                {debtScore > 0.3 && <div style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 9, padding: "9px 14px", marginBottom: 12, animation: "debtWarn 1s ease 2" }}><p style={{ fontSize: 12, color: "#f87171" }}>⚠️ Debt score {debtScore.toFixed(2)} — difficulty adjusted to reinforce this concept.</p></div>}
                                <button onClick={nextQ} style={{ ...T.btn, width: "100%", padding: "14px", fontSize: 14, background: answered ? "linear-gradient(135deg,#059669,#10b981)" : "linear-gradient(135deg,#7c3aed,#4f46e5)", boxShadow: answered ? "0 0 20px rgba(16,185,129,0.3)" : "0 0 20px rgba(124,58,237,0.3)" }}>
                                    Next Question → ({nextDiff(diff, answered, hintsShown)} difficulty)
                                </button>
                            </div>
                        )}
                        {phase === "q" && hintsShown < 3 && (
                            <div style={{ marginTop: 4 }}>
                                <button onClick={() => setHintsShown(h => h + 1)} style={{ ...T.ghost, width: "100%", padding: "11px", fontSize: 12, border: `1px solid ${hintColors[hintsShown]}33`, color: hintColors[hintsShown], background: `${hintColors[hintsShown]}06` }}>
                                    💡 {hintLabels[hintsShown]} <span style={{ opacity: 0.55, marginLeft: 6 }}>({hintPenalties[hintsShown]})</span>
                                </button>
                            </div>
                        )}
                        {phase === "q" && hintsShown === 3 && <p style={{ fontSize: 11, color: "#3a4a62", textAlign: "center", marginTop: 8 }}>All hints used. Try to answer now!</p>}
                    </div>
                </div>
                <div style={{ ...T.card, padding: "14px 19px", marginTop: 12, border: "1px solid rgba(124,58,237,0.1)" }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: "#2a3448", letterSpacing: "0.09em", marginBottom: 10 }}>QUESTION BANK · MOTION IN A PLANE · 30 QUESTIONS</p>
                    <div style={{ display: "flex", gap: 8 }}>
                        {[{ l: "Easy", n: QUESTIONS.easy.length, c: "#34d399" }, { l: "Medium", n: QUESTIONS.medium.length, c: "#f59e0b" }, { l: "Hard", n: QUESTIONS.hard.length, c: "#ef4444" }].map(b => (
                            <div key={b.l} style={{ flex: 1, textAlign: "center", padding: "9px", background: `${b.c}0c`, border: `1px solid ${b.c}28`, borderRadius: 9 }}>
                                <p style={{ fontSize: 19, fontWeight: 900, color: b.c }}>{b.n}</p>
                                <p style={{ fontSize: 10, color: "#2a3448", fontWeight: 700 }}>{b.l}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
