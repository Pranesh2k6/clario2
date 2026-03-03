export function Pill({ children, color = "#a78bfa" }) {
    return (
        <span style={{
            background: `${color}18`, color, border: `1px solid ${color}33`,
            borderRadius: 99, padding: "3px 11px", fontSize: 11, fontWeight: 700,
            letterSpacing: "0.05em", display: "inline-block",
        }}>
            {children}
        </span>
    );
}
