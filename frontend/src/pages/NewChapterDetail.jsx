import { useParams, useNavigate } from "react-router";
import { T } from "../components/theme.js";
import { Pill } from "../components/Pill.jsx";
import { Bar } from "../components/Bar.jsx";
import { SUBJECTS } from "../data/constants.js";

export default function ChapterDetail() {
    const { subjectId, chapterId } = useParams();
    const navigate = useNavigate();
    const sub = SUBJECTS[subjectId];

    // Find the chapter across both class 11 and 12
    const chapter = sub
        ? [...sub.class11, ...sub.class12].find(ch => ch.id === chapterId)
        : null;

    if (!sub || !chapter) {
        return (
            <div style={{ ...T.page, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ textAlign: "center" }}>
                    <h1 style={{ fontSize: 24, fontWeight: 900, color: "white" }}>Chapter not found</h1>
                    <button onClick={() => navigate(`/subject/${subjectId}`)} style={{ ...T.btn, marginTop: 16 }}>Back to Subject</button>
                </div>
            </div>
        );
    }

    const isKin = chapter.id === "motion2d";
    const isBonding = subjectId === "chemistry" && chapter.id === "bonding";
    const hasLearn = isKin || chapter.id === "limits" || isBonding;
    const modes = [
        { icon: "📖", title: "Learn", desc: "Step-by-step concept walkthrough with live animation", tag: "RECOMMENDED", tc: "#a78bfa", avail: hasLearn && !isBonding, onCk: () => navigate(`/subject/${subjectId}/chapter/${chapterId}/learn`) },
        { icon: "💡", title: "Practice Cases", desc: isBonding ? "3 immersive detective cases — Salt Factory, Vanishing Molecule & Sneaky Hydrogen" : "Investigation-style cinematic challenges — Operation Vectorfall", tag: "NEW", tc: "#fde68a", avail: isKin || isBonding, onCk: () => navigate(isBonding ? `/subject/chemistry/chapter/bonding/learn` : `/subject/${subjectId}/chapter/${chapterId}/vectorfall`) },
        { icon: "🎯", title: "Personalised Quiz", desc: "Adaptive questions, your level", tag: "ADAPTIVE", tc: "#34d399", avail: isKin, onCk: () => navigate(`/subject/${subjectId}/chapter/${chapterId}/quiz`) },
        { icon: "⏱️", title: "Mock Test", desc: "Exam conditions, full chapter", extra: "45 min", tc: "#6b7fa8", avail: false, onCk: null },
    ];

    return (
        <div style={{ ...T.page }}>
            <div style={{ padding: "78px 28px 40px", maxWidth: 1100, margin: "0 auto" }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 16, fontSize: 13 }}>
                    <button onClick={() => navigate(`/subject/${subjectId}`)} style={{ background: "none", border: "none", color: "#7c3aed", cursor: "pointer", fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 13 }}>← {sub.name}</button>
                    <span style={{ color: "#2a3448" }}>/</span>
                    <span style={{ color: "#8b9ec7" }}>{chapter.name}</span>
                </div>
                <div style={{ ...T.card, padding: "20px 26px", marginBottom: 22, display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid rgba(124,58,237,0.2)", animation: "fadeUp 0.4s both" }}>
                    <div>
                        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 5 }}>
                            <h2 style={{ fontSize: 22, fontWeight: 900, color: "white" }}>{chapter.name}</h2>
                            {chapter.progress > 0 && <Pill color="#34d399">In Progress</Pill>}
                        </div>
                        <p style={{ fontSize: 13, color: chapter.progress > 0 ? "#34d399" : "#3a4a62", fontWeight: chapter.progress > 0 ? 600 : 400 }}>{chapter.progress > 0 ? `Last: ${chapter.lastTopic}` : "Not started yet"}</p>
                    </div>
                    {chapter.progress > 0 && (
                        <div style={{ display: "flex", gap: 24, textAlign: "right" }}>
                            {[{ v: `${chapter.progress}%`, l: "PROGRESS", c: "white" }, { v: "78%", l: "ACCURACY", c: "#34d399" }].map((s, i) => (
                                <div key={i}><p style={{ fontSize: 24, fontWeight: 900, color: s.c }}>{s.v}</p><p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "#2a3448" }}>{s.l}</p></div>
                            ))}
                        </div>
                    )}
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "white", marginBottom: 4 }}>Choose Your Learning Mode</h3>
                <p style={{ fontSize: 13, color: "#3a4a62", marginBottom: 14 }}>Select how you want to explore this chapter</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    {modes.map((m, i) => (
                        <div key={i} onClick={m.avail && m.onCk ? m.onCk : undefined} style={{ ...T.card, padding: "22px 24px", cursor: m.avail && m.onCk ? "pointer" : "default", transition: "all 0.2s", animation: `fadeUp 0.4s ${i * 0.08}s both`, opacity: !m.avail ? 0.38 : 1, border: i === 0 ? "1px solid rgba(124,58,237,0.32)" : i === 1 && m.avail ? "1px solid rgba(253,230,138,0.28)" : "1px solid rgba(124,58,237,0.12)", position: "relative", overflow: "hidden" }}
                            onMouseEnter={e => m.avail && m.onCk && (e.currentTarget.style.borderColor = i === 1 ? "rgba(253,230,138,0.55)" : "rgba(124,58,237,0.52)", e.currentTarget.style.transform = "translateY(-2px)")}
                            onMouseLeave={e => m.avail && m.onCk && (e.currentTarget.style.borderColor = i === 0 ? "rgba(124,58,237,0.32)" : i === 1 ? "rgba(253,230,138,0.28)" : "rgba(124,58,237,0.12)", e.currentTarget.style.transform = "translateY(0)")}>
                            {m.tag && <div style={{ position: "absolute", top: 14, right: 14 }}><Pill color={m.tc}>{m.tag}</Pill></div>}
                            <div style={{ width: 46, height: 46, borderRadius: 13, background: "rgba(124,58,237,0.16)", border: "1px solid rgba(124,58,237,0.24)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 13 }}>{m.icon}</div>
                            <h4 style={{ fontSize: 17, fontWeight: 800, color: "white", marginBottom: 5 }}>{m.title}</h4>
                            <p style={{ fontSize: 13, color: "#3a4a62", marginBottom: 11 }}>{m.desc}</p>
                            {m.extra && <Pill color="#4b5e82">🕐 {m.extra}</Pill>}
                            {!m.avail && <p style={{ fontSize: 11, color: "#2a3448", marginTop: 7 }}>Coming soon</p>}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
