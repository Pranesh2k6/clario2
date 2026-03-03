export function Bar({ pct, h = 6, color = "linear-gradient(90deg,#6d28d9,#a855f7)" }) {
    return (
        <div style={{ height: h, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden" }}>
            <div style={{
                height: "100%", width: `${Math.min(pct, 100)}%`, background: color,
                borderRadius: 99, boxShadow: "0 0 8px rgba(168,85,247,0.4)", transition: "width 0.7s ease",
            }} />
        </div>
    );
}
