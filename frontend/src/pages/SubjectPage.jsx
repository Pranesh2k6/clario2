import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { T } from "../components/theme.js";
import { Pill } from "../components/Pill.jsx";
import { Bar } from "../components/Bar.jsx";
import { SUBJECTS } from "../data/constants.js";

export default function SubjectPage() {
    const { subjectId } = useParams();
    const navigate = useNavigate();
    const [cls, setCls] = useState("11");
    const sub = SUBJECTS[subjectId];

    if (!sub) {
        return (
            <div style={{ ...T.page, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ textAlign: "center" }}>
                    <h1 style={{ fontSize: 24, fontWeight: 900, color: "white" }}>Subject not found</h1>
                    <button onClick={() => navigate('/galaxy')} style={{ ...T.btn, marginTop: 16 }}>Back to Galaxy Map</button>
                </div>
            </div>
        );
    }

    const chs = cls === "11" ? sub.class11 : sub.class12;

    function handleChapter(ch) {
        navigate(`/subject/${subjectId}/chapter/${ch.id}`);
    }

    return (
        <div style={{ ...T.page }}>
            <div style={{ padding: "78px 28px 40px", maxWidth: 1280, margin: "0 auto" }}>
                <button onClick={() => navigate('/galaxy')} style={{ ...T.ghost, fontSize: 12, marginBottom: 16 }}>← Galaxy Map</button>
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 22, animation: "fadeUp 0.4s both" }}>
                    <div style={{ width: 54, height: 54, borderRadius: 15, background: sub.grad, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, boxShadow: `0 0 20px ${sub.color}44` }}>{sub.icon}</div>
                    <div>
                        <h1 style={{ fontSize: 24, fontWeight: 900, color: "white", letterSpacing: "-0.025em" }}>{sub.name}</h1>
                        <p style={{ fontSize: 13, color: "#3a4a62" }}>NCERT Class {cls} · {chs.length} Chapters</p>
                    </div>
                    <div style={{ marginLeft: "auto", display: "flex", gap: 3, background: "rgba(255,255,255,0.04)", padding: 4, borderRadius: 10, border: "1px solid rgba(124,58,237,0.14)" }}>
                        {["11", "12"].map(c => (
                            <button key={c} onClick={() => setCls(c)} style={{ padding: "8px 22px", borderRadius: 8, border: "none", background: cls === c ? "linear-gradient(135deg,#7c3aed,#4f46e5)" : "transparent", color: cls === c ? "white" : "#3a4a62", fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 13, cursor: "pointer", transition: "all 0.2s" }}>Class {c}</button>
                        ))}
                    </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}>
                    {chs.map((ch, i) => {
                        const act = ch.hasQuiz || ch.progress > 0;
                        return (
                            <div key={ch.id} onClick={() => handleChapter(ch)} style={{ ...T.card, padding: "15px 19px", display: "flex", alignItems: "center", gap: 13, cursor: "pointer", transition: "all 0.2s", animation: `fadeUp 0.4s ${i * 0.03}s both`, border: ch.hasQuiz ? "1px solid rgba(167,139,250,0.42)" : act ? "1px solid rgba(124,58,237,0.2)" : "1px solid rgba(124,58,237,0.1)", background: ch.hasQuiz ? "rgba(124,58,237,0.1)" : "rgba(10,14,40,0.82)", position: "relative", overflow: "hidden" }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = `${sub.color}55`; e.currentTarget.style.transform = "translateX(4px)"; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = ch.hasQuiz ? "rgba(167,139,250,0.42)" : act ? "rgba(124,58,237,0.2)" : "rgba(124,58,237,0.1)"; e.currentTarget.style.transform = "translateX(0)"; }}>
                                {ch.hasQuiz && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg,transparent,#a78bfa,transparent)" }} />}
                                <div style={{ fontSize: 19, width: 34, textAlign: "center", flexShrink: 0 }}>{ch.icon}</div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
                                        <p style={{ fontWeight: 700, fontSize: 13, color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Ch.{i + 1} — {ch.name}</p>
                                        {ch.hasQuiz && <Pill color="#a78bfa">Quiz ✦</Pill>}
                                    </div>
                                    {ch.progress > 0
                                        ? <><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span style={{ fontSize: 10, color: "#2a3448" }}>{ch.lastTopic || "In progress"}</span><span style={{ fontSize: 10, color: "#2a3448" }}>{ch.progress}%</span></div><Bar pct={ch.progress} h={4} color={`linear-gradient(90deg,${sub.color}88,${sub.color})`} /></>
                                        : <p style={{ fontSize: 10, color: "#2a3448" }}>Not started</p>}
                                </div>
                                <span style={{ color: "#2a3448", fontSize: 14, flexShrink: 0 }}>›</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
