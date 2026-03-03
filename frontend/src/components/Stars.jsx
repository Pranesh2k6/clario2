import { useRef } from "react";

const starData = Array.from({ length: 140 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    sz: Math.random() * 1.6 + 0.4,
    dur: Math.random() * 5 + 3,
    del: Math.random() * 6,
}));

export function Stars() {
    return (
        <div style={{
            position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
            pointerEvents: "none", zIndex: 0, overflow: "hidden",
        }}>
            {starData.map(s => (
                <div key={s.id} style={{
                    position: "absolute", left: `${s.x}%`, top: `${s.y}%`,
                    width: s.sz, height: s.sz, borderRadius: "50%", background: "white",
                    animation: `twinkle ${s.dur}s ${s.del}s ease-in-out infinite alternate`,
                }} />
            ))}
        </div>
    );
}
