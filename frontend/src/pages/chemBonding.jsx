import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";

// ─── GLOBAL CSS ───────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { width: 100%; min-height: 100vh; }
  body { font-family: 'Sora', sans-serif; overflow-x: hidden; }
  @keyframes twinkle    { 0%,100%{opacity:0.08} 50%{opacity:0.82} }
  @keyframes floatY     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-14px)} }
  @keyframes fadeUp     { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
  @keyframes scaleIn    { from{opacity:0;transform:scale(0.93)} to{opacity:1;transform:scale(1)} }
  @keyframes xpPop      { 0%{opacity:1;transform:translateY(0) scale(1)} 60%{opacity:1;transform:translateY(-32px) scale(1.25)} 100%{opacity:0;transform:translateY(-58px) scale(0.9)} }
  @keyframes debtWarn   { 0%,100%{opacity:1} 50%{opacity:0.4} }
  @keyframes glowPulse  { 0%,100%{box-shadow:0 0 22px rgba(124,58,237,0.26)} 50%{box-shadow:0 0 54px rgba(124,58,237,0.52),0 0 100px rgba(124,58,237,0.16)} }
  @keyframes pulseRing  { 0%{transform:translate(-50%,-50%) scale(1);opacity:0.7} 100%{transform:translate(-50%,-50%) scale(1.55);opacity:0} }
  @keyframes duelPing   { 0%,100%{transform:scale(1)} 50%{transform:scale(1.02)} }
  @keyframes shake      { 0%{transform:translateX(0)} 15%{transform:translateX(-8px)} 30%{transform:translateX(8px)} 45%{transform:translateX(-6px)} 60%{transform:translateX(6px)} 75%{transform:translateX(-3px)} 90%{transform:translateX(3px)} 100%{transform:translateX(0)} }
  @keyframes wrongFlash { 0%{background:rgba(239,68,68,0.18)} 100%{background:transparent} }
  /* ── NEW: Operation Vectorfall animations ── */
  @keyframes vf-scanline {
    0% { background-position: 0 0; }
    100% { background-position: 0 100px; }
  }
  @keyframes vf-flicker  { 0%,100%{opacity:1} 92%{opacity:1} 93%{opacity:0.82} 94%{opacity:1} 97%{opacity:0.88} }
  @keyframes vf-blink    { 0%,100%{opacity:1} 50%{opacity:0} }
  @keyframes vf-draw     { from{stroke-dashoffset:var(--len,600)} to{stroke-dashoffset:0} }
  @keyframes vf-popIn    { from{opacity:0;transform:scale(0.88)} to{opacity:1;transform:scale(1)} }
  @keyframes vf-wrongShake { 0%{transform:translateX(0)} 18%{transform:translateX(-10px)} 36%{transform:translateX(10px)} 54%{transform:translateX(-7px)} 72%{transform:translateX(7px)} 90%{transform:translateX(-3px)} 100%{transform:translateX(0)} }
  @keyframes vf-healthPulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
  @keyframes vf-critOverlay { 0%{opacity:1} 100%{opacity:0} }
  @keyframes vf-drone    { 0%{transform:translateX(0)} 100%{transform:translateX(170px)} }
  @keyframes vf-intercept{ 0%{transform:translate(0,0)} 100%{transform:translate(-200px,30px)} }
  @keyframes vf-spin     { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes vf-orbitPod { from{transform:rotate(0deg) translateX(58px)} to{transform:rotate(360deg) translateX(58px)} }
  /* ── Chemical Investigation Game ── */
  @keyframes ci-alarm    { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(1.04)} }
  @keyframes ci-danger   { 0%,100%{box-shadow:0 0 0px rgba(239,68,68,0)} 50%{box-shadow:0 0 60px rgba(239,68,68,0.5),inset 0 0 60px rgba(239,68,68,0.08)} }
  @keyframes ci-scan     { 0%{background-position:0 -100px} 100%{background-position:0 100vh} }
  @keyframes ci-glitch   { 0%,100%{transform:translate(0)} 20%{transform:translate(-3px,1px)} 40%{transform:translate(3px,-1px)} 60%{transform:translate(-2px,2px)} 80%{transform:translate(2px,-2px)} }
  @keyframes ci-hpDrop   { 0%{width:var(--from)} 100%{width:var(--to)} }
  @keyframes ci-redFlash { 0%{background:rgba(239,68,68,0.25)} 100%{background:transparent} }
  @keyframes ci-popIn    { 0%{opacity:0;transform:scale(0.85) translateY(12px)} 100%{opacity:1;transform:scale(1) translateY(0)} }
  @keyframes ci-victory  { 0%{opacity:0;transform:scale(0.7) rotate(-4deg)} 60%{transform:scale(1.07) rotate(1deg)} 100%{opacity:1;transform:scale(1) rotate(0)} }
  @keyframes ci-pulse    { 0%,100%{opacity:0.6} 50%{opacity:1} }
  @keyframes ci-levelIn  { 0%{opacity:0;transform:translateX(60px)} 100%{opacity:1;transform:translateX(0)} }
  @keyframes ci-shake    { 0%{transform:translate(0)} 15%{transform:translate(-10px,3px)} 30%{transform:translate(10px,-3px)} 50%{transform:translate(-8px,2px)} 70%{transform:translate(8px,-2px)} 85%{transform:translate(-4px,1px)} 100%{transform:translate(0)} }
  ::-webkit-scrollbar { width:5px; }
  ::-webkit-scrollbar-track { background:rgba(255,255,255,0.02); }
  ::-webkit-scrollbar-thumb { background:rgba(124,58,237,0.35);border-radius:99px; }
`;

// ─── EXISTING HELPERS ─────────────────────────────────────────────────────────
function calcDebt(hintsUsed, attempts, timeTaken, expectedTime) {
    let d = 0;
    if (hintsUsed >= 1) d += 0.15;
    if (hintsUsed >= 2) d += 0.15;
    if (hintsUsed >= 3) d += 0.20;
    if (attempts >= 2) d += 0.20;
    if (timeTaken > expectedTime) d += 0.10;
    return Math.min(d, 1);
}

function nextDiff(cur, correct, hintsUsed) {
    if (correct && hintsUsed === 0) {
        if (cur === "easy") return "medium";
        if (cur === "medium") return "hard";
    }
    if (!correct || hintsUsed >= 3) {
        if (cur === "hard") return "medium";
        if (cur === "medium") return "easy";
    }
    return cur;
}

const SUBJECTS = {
    physics: {
        name: "Physics", icon: "⚛️", color: "#4a80f5", grad: "linear-gradient(135deg,#1e3a8a,#3b5bdb)",
        class11: [
            { id: "units", name: "Units & Measurements", icon: "📏", progress: 0 },
            { id: "motion1d", name: "Motion in a Straight Line", icon: "➡️", progress: 0 },
            { id: "motion2d", name: "Motion in a Plane", icon: "📐", progress: 45, hasQuiz: true, lastTopic: "Projectile Motion" },
            { id: "laws", name: "Laws of Motion", icon: "⚖️", progress: 20, lastTopic: "Newton's 2nd Law" },
            { id: "work", name: "Work, Energy & Power", icon: "⚡", progress: 0 },
            { id: "rotation", name: "System of Particles & Rotational Motion", icon: "🌀", progress: 0 },
            { id: "gravity", name: "Gravitation", icon: "🌍", progress: 0 },
            { id: "solids", name: "Mechanical Properties of Solids", icon: "🪨", progress: 0 },
            { id: "fluids", name: "Mechanical Properties of Fluids", icon: "💧", progress: 0 },
            { id: "thermal", name: "Thermal Properties of Matter", icon: "🌡️", progress: 0 },
            { id: "thermo", name: "Thermodynamics", icon: "♨️", progress: 0 },
            { id: "kinetic", name: "Kinetic Theory", icon: "🔬", progress: 0 },
            { id: "oscillate", name: "Oscillations", icon: "〰️", progress: 0 },
            { id: "waves", name: "Waves", icon: "🌊", progress: 0 },
        ],
        class12: [
            { id: "ecf", name: "Electric Charges & Fields", icon: "⚡", progress: 0 },
            { id: "epc", name: "Electrostatic Potential & Capacitance", icon: "🔋", progress: 0 },
            { id: "current", name: "Current Electricity", icon: "💡", progress: 0 },
            { id: "mag1", name: "Moving Charges & Magnetism", icon: "🧲", progress: 0 },
            { id: "mag2", name: "Magnetism & Matter", icon: "🔮", progress: 0 },
            { id: "emi", name: "Electromagnetic Induction", icon: "🌐", progress: 0 },
            { id: "ac", name: "Alternating Current", icon: "📡", progress: 0 },
            { id: "emwave", name: "Electromagnetic Waves", icon: "〰️", progress: 0 },
            { id: "rayopt", name: "Ray Optics & Optical Instruments", icon: "🔭", progress: 0 },
            { id: "waveopt", name: "Wave Optics", icon: "🌈", progress: 0 },
            { id: "dual", name: "Dual Nature of Radiation & Matter", icon: "☢️", progress: 0 },
            { id: "atoms", name: "Atoms", icon: "⚛️", progress: 0 },
            { id: "nuclei", name: "Nuclei", icon: "🔴", progress: 0 },
            { id: "semi", name: "Semiconductors", icon: "💻", progress: 0 },
        ],
    },
    chemistry: {
        name: "Chemistry", icon: "🧪", color: "#10b981", grad: "linear-gradient(135deg,#064e3b,#059669)",
        class11: [
            { id: "basic", name: "Some Basic Concepts of Chemistry", icon: "🔬", progress: 30, lastTopic: "Mole Concept" },
            { id: "atomstr", name: "Structure of Atom", icon: "⚛️", progress: 0 },
            { id: "periodic", name: "Classification of Elements", icon: "📊", progress: 0 },
            { id: "bonding", name: "Chemical Bonding & Molecular Str.", icon: "🔗", progress: 35, hasQuiz: true, lastTopic: "Hybridization & MO Theory" },
            { id: "states", name: "States of Matter", icon: "💨", progress: 0 },
            { id: "thermo11", name: "Thermodynamics", icon: "♨️", progress: 0 },
            { id: "equil", name: "Equilibrium", icon: "⚖️", progress: 0 },
            { id: "redox", name: "Redox Reactions", icon: "🔄", progress: 0 },
            { id: "hydrogen", name: "Hydrogen", icon: "💧", progress: 0 },
            { id: "sblocks", name: "s-Block Elements", icon: "🧱", progress: 0 },
            { id: "pblocks11", name: "p-Block Elements", icon: "🧩", progress: 0 },
            { id: "organic", name: "Organic Chemistry - Basic Principles", icon: "🌿", progress: 0 },
            { id: "hydrocarbons", name: "Hydrocarbons", icon: "⛽", progress: 0 },
            { id: "env11", name: "Environmental Chemistry", icon: "🌍", progress: 0 },
        ],
        class12: [
            { id: "solutions", name: "Solutions", icon: "🧫", progress: 0 },
            { id: "electro", name: "Electrochemistry", icon: "⚡", progress: 0 },
            { id: "kinetics", name: "Chemical Kinetics", icon: "⏱️", progress: 0 },
            { id: "surface", name: "Surface Chemistry", icon: "🔍", progress: 0 },
            { id: "general", name: "General Principles of Extraction", icon: "⚙️", progress: 0 },
            { id: "pblocks12", name: "p-Block Elements", icon: "🧩", progress: 0 },
            { id: "dblock", name: "d & f Block Elements", icon: "🔩", progress: 0 },
            { id: "coord", name: "Coordination Compounds", icon: "🔗", progress: 0 },
            { id: "haloalk", name: "Haloalkanes & Haloarenes", icon: "🧬", progress: 0 },
            { id: "alcohol", name: "Alcohols, Phenols & Ethers", icon: "🍶", progress: 0 },
            { id: "aldehyde", name: "Aldehydes, Ketones & Carboxylic", icon: "🧪", progress: 0 },
            { id: "amines", name: "Amines", icon: "🔬", progress: 0 },
            { id: "biomol", name: "Biomolecules", icon: "🧬", progress: 0 },
            { id: "poly", name: "Polymers", icon: "🔗", progress: 0 },
        ],
    },
    maths: {
        name: "Mathematics", icon: "📐", color: "#8a4bff", grad: "linear-gradient(135deg,#4c1d95,#7c3aed)",
        class11: [
            { id: "sets", name: "Sets", icon: "🔢", progress: 0 },
            { id: "relations", name: "Relations & Functions", icon: "↔️", progress: 0 },
            { id: "trig", name: "Trigonometric Functions", icon: "📐", progress: 60, lastTopic: "Inverse Trig" },
            { id: "complex", name: "Complex Numbers & Quadratics", icon: "🔲", progress: 0 },
            { id: "lineq", name: "Linear Inequalities", icon: "⚖️", progress: 0 },
            { id: "perm", name: "Permutations & Combinations", icon: "🔀", progress: 0 },
            { id: "binom", name: "Binomial Theorem", icon: "📈", progress: 0 },
            { id: "seqser", name: "Sequences & Series", icon: "🔢", progress: 0 },
            { id: "straight", name: "Straight Lines", icon: "📏", progress: 0 },
            { id: "conic", name: "Conic Sections", icon: "⭕", progress: 0 },
            { id: "3d", name: "Introduction to 3D Geometry", icon: "🧊", progress: 0 },
            { id: "limits", name: "Limits & Derivatives", icon: "∞", progress: 0 },
            { id: "stats11", name: "Statistics", icon: "📊", progress: 0 },
            { id: "prob11", name: "Probability", icon: "🎲", progress: 0 },
        ],
        class12: [
            { id: "rel12", name: "Relations & Functions", icon: "↔️", progress: 0 },
            { id: "invtrig", name: "Inverse Trigonometric Functions", icon: "🔄", progress: 0 },
            { id: "matrices", name: "Matrices", icon: "🔢", progress: 0 },
            { id: "dets", name: "Determinants", icon: "🔲", progress: 0 },
            { id: "cont", name: "Continuity & Differentiability", icon: "〰️", progress: 0 },
            { id: "appderiv", name: "Application of Derivatives", icon: "📈", progress: 65, lastTopic: "Maxima & Minima" },
            { id: "integrals", name: "Integrals", icon: "∫", progress: 0 },
            { id: "appint", name: "Application of Integrals", icon: "📐", progress: 0 },
            { id: "diffeq", name: "Differential Equations", icon: "🧮", progress: 0 },
            { id: "vectors", name: "Vector Algebra", icon: "➡️", progress: 0 },
            { id: "3dgeom", name: "Three Dimensional Geometry", icon: "🧊", progress: 0 },
            { id: "lp", name: "Linear Programming", icon: "📊", progress: 0 },
            { id: "prob12", name: "Probability", icon: "🎲", progress: 0 },
        ],
    },
};

const QUESTIONS = {
    easy: [
        { id: "e1", q: "If a particle is located at coordinates (x, y, z), what is the standard expression for its position vector R⃗?", options: ["R⃗ = x + y + z", "R⃗ = x î + y ĵ + z k̂", "R⃗ = (x+y+z)(î+ĵ+k̂)", "R⃗ = xî − yĵ + zk̂"], correct: 1, exp: "The position vector is the sum of each coordinate multiplied by its unit vector: R⃗ = xî + yĵ + zk̂.", h1: "💡 Concept: A position vector points from the origin to the particle. Think about how each axis (x, y, z) contributes independently.", h2: "📐 Formula: R⃗ = (x-component)î + (y-component)ĵ + (z-component)k̂. Each coordinate pairs with its own unit vector.", h3: "🔢 Substitution: Directly multiply each coordinate by its unit vector and add: x·î + y·ĵ + z·k̂. No cross terms.", xp: 10, t: 35 },
        { id: "e2", q: "A particle moves from (2, 0, −3) to (3, 1, 2). What is the displacement vector s⃗?", options: ["s⃗ = 2î + ĵ + 5k̂", "s⃗ = î − ĵ + 5k̂", "s⃗ = î + ĵ + 5k̂", "s⃗ = î + ĵ − 5k̂"], correct: 2, exp: "Displacement = Final − Initial = (3−2)î + (1−0)ĵ + (2−(−3))k̂ = î + ĵ + 5k̂.", h1: "💡 Concept: Displacement is a vector from the initial point to the final point. The direction matters — it's always final minus initial.", h2: "📐 Formula: s⃗ = (x₂−x₁)î + (y₂−y₁)ĵ + (z₂−z₁)k̂. Subtract each coordinate component separately.", h3: "🔢 Substitution: (3−2)=1, (1−0)=1, (2−(−3))=2+3=5. Watch the double negative in the z-component!", xp: 10, t: 45 },
        { id: "e3", q: "A particle undergoes displacement (î + ĵ + 5k̂) m in 0.5 s. What is its average velocity vector?", options: ["v⃗ = î + ĵ + 5k̂ m/s", "v⃗ = 0.5î + 0.5ĵ + 2.5k̂ m/s", "v⃗ = 2î + 2ĵ + 10k̂ m/s", "v⃗ = 4î + 4ĵ + 20k̂ m/s"], correct: 2, exp: "v⃗_avg = displacement/time = (î+ĵ+5k̂)/0.5 = 2î + 2ĵ + 10k̂ m/s.", h1: "💡 Concept: Average velocity = total displacement ÷ total time. It's a vector — divide every component by the same scalar time.", h2: "📐 Formula: v⃗_avg = Δr⃗/Δt. Divide each î, ĵ, k̂ component by 0.5 s.", h3: "🔢 Substitution: 1/0.5 = 2, 1/0.5 = 2, 5/0.5 = 10. So: 2î + 2ĵ + 10k̂ m/s.", xp: 10, t: 40 },
        { id: "e4", q: "A projectile is fired at speed u and angle θ. What is its speed at the highest point of its trajectory?", options: ["u·sin θ", "u·tan θ", "0", "u·cos θ"], correct: 3, exp: "At the apex the vertical velocity is zero. Only the horizontal component vₓ = u·cosθ remains.", h1: "💡 Concept: At the highest point, the projectile momentarily stops moving vertically. Think about what happens to each component of velocity separately.", h2: "📐 Formula: v = √(vₓ² + vᵧ²). At the peak, vᵧ = 0. So speed = |vₓ| = u·cosθ.", h3: "🔢 Substitution: vₓ = u·cos θ (constant throughout). vᵧ = u·sinθ − gt = 0 at peak. Therefore speed = u·cos θ.", xp: 10, t: 35 },
        { id: "e5", q: "At which launch angle is the horizontal range of a projectile maximum for a given initial speed?", options: ["30°", "60°", "45°", "90°"], correct: 2, exp: "R = u²sin(2θ)/g is maximum when sin(2θ) = 1, which means 2θ = 90°, so θ = 45°.", h1: "💡 Concept: Range depends on the launch angle. There's one special angle where you get the farthest horizontal distance.", h2: "📐 Formula: R = u²·sin(2θ)/g. This is maximized when sin(2θ) is at its maximum possible value.", h3: "🔢 Substitution: sin(2θ) is maximum = 1 when 2θ = 90°. Solving: θ = 45°.", xp: 10, t: 30 },
        { id: "e6", q: "Two projectiles are thrown at the same initial speed at 45° and 30°. What is the ratio R₄₅/R₃₀?", options: ["√3/2", "√2", "1", "2/√3"], correct: 3, exp: "R = u²sin(2θ)/g. R₄₅ = u²/g. R₃₀ = u²·(√3/2)/g. Ratio = 2/√3.", h1: "💡 Concept: Use the range formula for each angle and then divide. The initial speed cancels out in the ratio.", h2: "📐 Formula: R = u²·sin(2θ)/g. Apply for θ=45°: sin(90°)=1. Apply for θ=30°: sin(60°)=√3/2.", h3: "🔢 Substitution: R₄₅/R₃₀ = sin(90°)/sin(60°) = 1/(√3/2) = 2/√3 ≈ 1.15.", xp: 10, t: 60 },
        { id: "e7", q: "A ball is thrown at u = 30 m/s, θ = 60°. Using T = 2u·sinθ/g (g = 10 m/s²), find the time of flight.", options: ["3 s", "3√3 s ≈ 5.2 s", "√3 s ≈ 1.73 s", "6 s"], correct: 1, exp: "T = 2×30×sin60°/10 = 60×(√3/2)/10 = 3√3 ≈ 5.2 s.", h1: "💡 Concept: Time of flight is determined only by the vertical motion.", h2: "📐 Formula: T = 2u·sinθ/g. Substitute u=30, θ=60°, g=10. Remember sin(60°) = √3/2.", h3: "🔢 Substitution: T = 2×30×(√3/2)/10 = 3√3 ≈ 5.2 s.", xp: 10, t: 40 },
        { id: "e8", q: "For motion x = 4sin(ωt − π/2), y = 4sin(ωt), what shape is the trajectory?", options: ["Ellipse", "Straight line", "Parabola", "Circle of radius 4"], correct: 3, exp: "Using sin(θ−π/2) = −cosθ: x = −4cosωt, y = 4sinωt → x² + y² = 16 → circle of radius 4.", h1: "💡 Concept: To find the trajectory, eliminate the time parameter t.", h2: "📐 Formula: Use the identity sin(θ − π/2) = −cos θ to simplify x. Then use sin²θ + cos²θ = 1.", h3: "🔢 Substitution: x²/16 + y²/16 = cos²ωt + sin²ωt = 1 → x² + y² = 16.", xp: 10, t: 70 },
        { id: "e9", q: "A ball with kinetic energy E is projected at 60°. What is its KE at the highest point?", options: ["E/2", "E/3", "E/4", "E/√2"], correct: 2, exp: "At apex speed = u·cos60° = u/2. KE = ½m(u/2)² = E/4.", h1: "💡 Concept: At the highest point, only horizontal velocity remains. KE depends on speed squared.", h2: "📐 Formula: KE_peak = ½m·(u·cosθ)². Express as a fraction of E = ½mu².", h3: "🔢 Substitution: cos(60°) = 1/2. So vₓ = u/2. KE_peak = ½m·(u/2)² = E/4.", xp: 10, t: 55 },
        { id: "e10", q: "A particle starts at origin with u⃗ = 15ĵ m/s, a⃗ = (10î + 4ĵ) m/s². What are its coordinates at time t?", options: ["x=10t, y=15t+4t²", "x=5t², y=15t+2t²", "x=10t², y=4t²", "x=5t, y=15t"], correct: 1, exp: "x = ½(10)t² = 5t², y = 15t + ½(4)t² = 15t + 2t².", h1: "💡 Concept: Treat x and y motions completely independently.", h2: "📐 Formula: r = u₀t + ½at² for each axis. Note: u_x = 0, u_y = 15 m/s.", h3: "🔢 Substitution: x = 5t². y = 15t + 2t².", xp: 10, t: 65 },
    ],
    medium: [
        { id: "m1", q: "Given x = 3t⁴ and y = t², which expression gives the speed at time t?", options: ["√(9t⁸ + t⁴)", "2t√(36t⁴ + 1)", "12t³ + 2t", "6t²"], correct: 1, exp: "vₓ = 12t³, vᵧ = 2t. Speed = √(144t⁶ + 4t²) = 2t√(36t⁴ + 1).", h1: "💡 Concept: Velocity components are the time derivatives of position components.", h2: "📐 Formula: vₓ = dx/dt, vᵧ = dy/dt. Speed = √(vₓ² + vᵧ²).", h3: "🔢 Substitution: vₓ = 12t³, vᵧ = 2t. Speed = 2t√(36t⁴+1).", xp: 15, t: 80 },
        { id: "m2", q: "For x = t², y = t³, what is the acceleration vector at time t?", options: ["a⃗ = 2tî + 3t²ĵ", "a⃗ = 2î + 3tĵ", "a⃗ = 2î + 6tĵ", "a⃗ = 4tî + 6t²ĵ"], correct: 2, exp: "v⃗ = 2tî + 3t²ĵ. a⃗ = dv⃗/dt = 2î + 6tĵ.", h1: "💡 Concept: Acceleration is the second derivative of position.", h2: "📐 Formula: a⃗ = d²r⃗/dt². Differentiate position twice.", h3: "🔢 Substitution: aₓ = d(2t)/dt = 2, aᵧ = d(3t²)/dt = 6t.", xp: 15, t: 90 },
        { id: "m3", q: "A particle starts at (4, 10) with v⃗₀ = 4î + 8ĵ m/s, a⃗ = 2î − 4ĵ m/s². When does it cross the x-axis?", options: ["t = 1 s", "t = 3 s", "t = 5 s", "t = 8 s"], correct: 2, exp: "y(t) = 10 + 8t − 2t² = 0 → t² − 4t − 5 = 0 → t = 5 s.", h1: "💡 Concept: Crossing the x-axis means y = 0.", h2: "📐 Formula: y(t) = y₀ + vᵧ₀·t + ½aᵧ·t² = 0.", h3: "🔢 Substitution: 10 + 8t − 2t² = 0 → (t−5)(t+1) = 0 → t = 5 s.", xp: 15, t: 110 },
        { id: "m4", q: "Particle from origin: u⃗ = 3î m/s, a⃗ = 6î + 4ĵ m/s². What is x when y = 32 m?", options: ["x = 30 m", "x = 48 m", "x = 60 m", "x = 72 m"], correct: 2, exp: "y = 2t² = 32 → t = 4 s. x = 3(4) + ½(6)(16) = 60 m.", h1: "💡 Concept: Use the y-equation to find time, then substitute into x.", h2: "📐 Formula: y = ½aᵧt². x = u_x·t + ½aₓ·t².", h3: "🔢 Substitution: t = 4 s. x = 12 + 48 = 60 m.", xp: 15, t: 110 },
        { id: "m5", q: "Body projected at 45°. Speed at t = 2 s is 20 m/s (g = 10). What is the maximum height H?", options: ["H = 20 m", "H = 40 m", "H = 80 m", "H = 10√2 m"], correct: 1, exp: "vₓ = u/√2 (constant). Using |v|² = 400, u = 20√2. H = u²sin²45°/2g = 40 m.", h1: "💡 Concept: The horizontal velocity never changes. Use the known speed at t=2s to find u.", h2: "📐 Formula: vₓ² + vᵧ² = 400, where vᵧ = u/√2 − 20.", h3: "🔢 Substitution: u = 20√2. H = (800×0.5)/20 = 40 m.", xp: 15, t: 140 },
        { id: "m6", q: "At θ = 45°, what is the relationship between max range R and max height H?", options: ["R = H", "R = 2H", "R = 4H", "R = 8H"], correct: 2, exp: "R = u²/g. H = u²/4g. So R/H = 4.", h1: "💡 Concept: Write separate formulas for R and H at 45°, then find the ratio.", h2: "📐 Formula: R = u²·sin(2θ)/g and H = u²·sin²θ/(2g). Substitute θ=45°.", h3: "🔢 Substitution: R = u²/g. H = u²/(4g). Ratio = 4.", xp: 15, t: 95 },
        { id: "m7", q: "A ball just clears a 19.6 m high window at its apex, 39.2 m horizontally. What is the initial speed?", options: ["u ≈ 14 m/s at 60°", "u ≈ 19.8 m/s at 30°", "u ≈ 27.7 m/s at 45°", "u ≈ 22 m/s at 45°"], correct: 2, exp: "H=19.6, R/2=39.2 → tanθ=1 → θ=45°. u² = 2gH/sin²45° → u ≈ 27.7 m/s.", h1: "💡 Concept: The window is at the apex. The horizontal distance to the apex is R/2.", h2: "📐 Formula: Divide H by R/2 to find θ first, then solve for u.", h3: "🔢 Substitution: tanθ=1 → θ=45°. u ≈ 27.7 m/s.", xp: 15, t: 160 },
        { id: "m8", q: "A stone drops from a bus window 1.96 m high, bus moving at 60 km/h. What is the horizontal distance traveled?", options: ["x ≈ 5.2 m", "x ≈ 10.53 m", "x ≈ 16.7 m", "x ≈ 8 m"], correct: 1, exp: "t = √(2×1.96/9.8) ≈ 0.632 s. v ≈ 16.67 m/s. x ≈ 10.53 m.", h1: "💡 Concept: The stone retains the bus's horizontal velocity at release.", h2: "📐 Formula: t = √(2h/g). x = v_bus × t. Convert 60 km/h to m/s.", h3: "🔢 Substitution: t ≈ 0.632 s. x = 16.67 × 0.632 ≈ 10.53 m.", xp: 15, t: 120 },
        { id: "m9", q: "Ball 1 thrown up at 50 m/s. Ball 2 thrown 2 s later at 50 m/s. When do they meet (from first throw)?", options: ["t = 4 s", "t = 5 s", "t = 6 s", "t = 7 s"], correct: 2, exp: "Setting h₁ = h₂: 20t = 120 → t = 6 s.", h1: "💡 Concept: They meet when at the same height at the same time.", h2: "📐 Formula: h₁(t) = 50t − 5t². h₂(t) = 50(t−2) − 5(t−2)². Set equal.", h3: "🔢 Substitution: Simplifying → 20t = 120 → t = 6 s.", xp: 15, t: 140 },
        { id: "m10", q: "A boat can do 5 km/h in still water. It crosses a 1 km river on the shortest path in 15 min. What is the river's current speed?", options: ["2 km/h", "3 km/h", "4 km/h", "√21 km/h"], correct: 1, exp: "Resultant = 4 km/h. River = √(25−16) = 3 km/h.", h1: "💡 Concept: Shortest path means the resultant velocity is perpendicular to the bank.", h2: "📐 Formula: v_resultant = 4 km/h. v_river = √(v_boat² − v_resultant²).", h3: "🔢 Substitution: v_river = √(25−16) = 3 km/h.", xp: 15, t: 130 },
    ],
    hard: [
        { id: "h1", q: "A boy in an accelerating train throws a ball at 60°. Why can't the standard range formula be used?", options: ["Standard range applies unchanged", "A pseudo-force −ma acts horizontally, modifying the trajectory", "The ball moves faster due to train's acceleration", "Vertical motion is also affected by pseudo-force"], correct: 1, exp: "The train is a non-inertial frame. A horizontal pseudo-force −ma acts on the ball, modifying x(t) = u·cos60°·t − ½at².", h1: "💡 Concept: When the reference frame itself accelerates, Newton's laws in standard form don't apply.", h2: "📐 Formula: In non-inertial frames, add pseudo-force = −m·a_frame. For a forward-accelerating train, the pseudo-force is backward.", h3: "🔢 Substitution: x(t) = u·cos60°·t − ½a·t². The standard formula breaks down.", xp: 20, t: 200 },
        { id: "h2", q: "A pilot drops a bomb from a horizontally flying plane. What trajectory does a ground observer see, and why?", options: ["Straight vertical", "Parabola — bomb keeps forward velocity and gains vertical velocity", "Straight diagonal", "Circle"], correct: 1, exp: "The bomb retains the plane's horizontal velocity at release. Combined with gravity, the ground observer sees a parabolic path.", h1: "💡 Concept: At release, the bomb has the same horizontal velocity as the plane.", h2: "📐 Formula: x = v_plane·t. y = ½gt². Eliminate t to find shape.", h3: "🔢 Substitution: y = (g/2v²)x². This is y ∝ x² — a parabola.", xp: 20, t: 180 },
        { id: "h3", q: "At its peak, a projectile's gravity weakens to g' = g/0.81. What happens to the second half of the flight?", options: ["Symmetric — same time and range", "Second half takes less time; range < original", "Second half takes longer (T₂ = 0.9·T₁); total range > original", "Second half unaffected"], correct: 2, exp: "Fall time T₂ = √(2H/g') = 0.9·T₁. More horizontal time → total range larger than symmetric original.", h1: "💡 Concept: First half uses original g; second half uses weaker g'. Think about fall time with weaker gravity.", h2: "📐 Formula: T₂ = √(2H/g'). Since g' = g/0.81, substitute and compare.", h3: "🔢 Substitution: T₂ = 0.9·T₁. Ball lands farther since horizontal velocity is unchanged.", xp: 20, t: 260 },
        { id: "h4", q: "A ball bounces infinitely, losing fraction α of its speed each time. What is the total horizontal displacement?", options: ["u²sin2θ / g", "u²sin2θ / [g(1−α)]", "u²sin2θ / [g(1−α²)]", "u·cosθ / (1−α)"], correct: 2, exp: "Range → α²×range each bounce. Geometric series with ratio α². Sum = u²sin2θ/[g(1−α²)].", h1: "💡 Concept: After each bounce, speed → α×speed. Range depends on u², so each subsequent range is multiplied by α².", h2: "📐 Formula: Sum = R₀/(1−α²) where R₀ = u²sin2θ/g.", h3: "🔢 Substitution: Total = u²sin2θ / [g(1−α²)]. Valid when α < 1.", xp: 20, t: 300 },
        { id: "h5", q: "Two projectiles launched simultaneously from different x-positions. What conditions ensure a mid-air collision?", options: ["Same speed", "u₁y = u₂y AND (u₁x−u₂x)·t = x₂₀−x₁₀", "u₁x = u₂x AND u₁y = u₂y", "Same angle"], correct: 1, exp: "Setting y₁ = y₂: ½gt² cancels → u₁y = u₂y. Setting x₁ = x₂ gives horizontal condition.", h1: "💡 Concept: Both particles must be at the same position (x AND y) at the same time.", h2: "📐 Formula: y₁=y₂: (u₁y−u₂y)·t = 0 → u₁y = u₂y. Similarly for x.", h3: "🔢 Substitution: Both conditions must hold simultaneously at the same t.", xp: 20, t: 260 },
    ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// ─── CHEMISTRY: CHEMICAL BONDING QUESTION BANK — EXACT SOURCE QUESTIONS ───────
// ═══════════════════════════════════════════════════════════════════════════════
const CHEM_BOND_QUESTIONS = {
    easy: [
        {
            id: "cb_e1",
            q: "What is the force that holds different atoms together in a molecule called?",
            options: ["A) Nuclear force", "B) Chemical bond", "C) Gravitational force", "D) Magnetic attraction"],
            correct: 1,
            exp: "A chemical bond is the force that holds atoms together in a molecule. It arises from electrostatic attraction between nuclei and electrons. Nuclear force operates only within the nucleus (extremely short range), while gravity and magnetism are far too weak to bind atoms.",
            h1: "💡 What force is specifically about atoms joining together — not nuclear, not gravitational?",
            h2: "📐 The bond arises from electrostatic attraction between positively charged nuclei and negatively charged electrons.",
            h3: "🔢 Answer: B — Chemical bond. Nuclear force holds the nucleus itself; chemical bonds hold atoms together in molecules.",
            xp: 10, t: 30,
        },
        {
            id: "cb_e2",
            q: "According to the Octet Rule, atoms combine to achieve the electronic configuration of which group?",
            options: ["A) Alkali metals", "B) Halogens", "C) Noble gases", "D) Transition metals"],
            correct: 2,
            exp: "The Octet Rule states that atoms bond to achieve 8 electrons in their outermost shell — the same stable configuration as noble gases (Group 18). Noble gases like Neon (2,8) and Argon (2,8,8) are chemically inert because their outer shells are already completely filled.",
            h1: "💡 Which group of elements is famously unreactive and never forms bonds naturally?",
            h2: "📐 Noble gases have fully filled outer shells: He=2, Ne=2,8, Ar=2,8,8. All other atoms bond to copy this.",
            h3: "🔢 Answer: C — Noble gases. Na loses 1e⁻ to match Ne; Cl gains 1e⁻ to match Ar.",
            xp: 10, t: 30,
        },
        {
            id: "cb_e3",
            q: "The outermost shell electrons that take part in chemical combinations are known as:",
            options: ["A) Core electrons", "B) Valence electrons", "C) Inner electrons", "D) Lone pairs"],
            correct: 1,
            exp: "Valence electrons are the outermost shell electrons that participate in chemical bonding — either by transfer (ionic) or sharing (covalent). Core electrons are tightly held near the nucleus and do not participate. Lone pairs ARE valence electrons, but specifically the non-bonding ones.",
            h1: "💡 'Valence' = capacity. These electrons are on the outside of the atom, available for bonding.",
            h2: "📐 Na: 2,8,1 → 1 valence electron. Cl: 2,8,7 → 7 valence electrons. Always the outermost shell.",
            h3: "🔢 Answer: B — Valence electrons. They determine chemical properties and reactivity.",
            xp: 10, t: 30,
        },
        {
            id: "cb_e4",
            q: "Ionic or electrovalent bonds are generally formed between:",
            options: ["A) Two metals", "B) Two non-metals", "C) Metals and non-metals", "D) Two noble gases"],
            correct: 2,
            exp: "Ionic bonds form between metals (low ionization enthalpy → easily lose electrons to become cations) and non-metals (high electron gain enthalpy → readily accept electrons to become anions). The resulting electrostatic attraction between cation and anion is the ionic bond. Example: Na⁺ + Cl⁻ → NaCl.",
            h1: "💡 One atom must give electrons, the other must receive them. Which types of elements do each of these?",
            h2: "📐 Metal → low IE → gives e⁻ → cation. Non-metal → high EA → takes e⁻ → anion. Attraction = ionic bond.",
            h3: "🔢 Answer: C — Metals and non-metals. Two metals → metallic bonding; two non-metals → covalent bonding.",
            xp: 10, t: 30,
        },
        {
            id: "cb_e5",
            q: "Hydrogen bonding occurs when hydrogen is covalently bonded to highly electronegative elements like:",
            options: ["A) Carbon, Sulfur, and Chlorine", "B) Nitrogen, Oxygen, and Fluorine", "C) Sodium, Magnesium, and Aluminum", "D) Helium, Neon, and Argon"],
            correct: 1,
            exp: "Hydrogen bonding requires H to be bonded to a small, highly electronegative atom: N, O, or F. Their high electronegativity pulls electron density from H, giving it a δ+ charge that attracts lone pairs on adjacent N, O, or F atoms. This explains water's anomalously high boiling point vs H₂S.",
            h1: "💡 N, O, F — the three most electronegative elements (apart from noble gases). They make H very δ+.",
            h2: "📐 Electronegativity: F=4.0, O=3.5, N=3.0. S=2.5, C=2.5 — not electronegative enough for true H-bonds.",
            h3: "🔢 Answer: B — Nitrogen, Oxygen, Fluorine. H₂O (O), NH₃ (N), HF (F) all show hydrogen bonding.",
            xp: 10, t: 35,
        },
    ],
    medium: [
        {
            id: "cb_m1",
            q: "Which of the following factors favors the formation of a cation for an ionic bond?",
            options: ["A) High ionization enthalpy", "B) Low ionization enthalpy", "C) High electron gain enthalpy", "D) High electronegativity"],
            correct: 1,
            exp: "Low ionization enthalpy means the metal atom loses its electron(s) with minimal energy — making cation formation easy. High electron gain enthalpy favors ANION formation. High electronegativity would actually resist losing electrons. Na (IE = 496 kJ/mol) forms Na⁺ far more easily than Mg (IE₁ = 738 + IE₂ = 1451 kJ/mol).",
            h1: "💡 Cation = positive ion = atom LOSES electrons. Which factor measures how easy it is to remove electrons?",
            h2: "📐 Ionization enthalpy = energy to remove an electron. LOWER = easier removal = better cation formation.",
            h3: "🔢 Answer: B — Low ionization enthalpy. Electron gain enthalpy (C) is for anion formation, not cation.",
            xp: 15, t: 65,
        },
        {
            id: "cb_m2",
            q: "Lattice energy of an ionic compound increases when:",
            options: ["A) The size of the ions increases.", "B) The magnitude of the charge on the ions increases.", "C) The interionic attraction decreases.", "D) The ions are in a gaseous state."],
            correct: 1,
            exp: "Lattice energy ∝ |q₁ × q₂| / r (Coulomb's law). Higher ionic charges dramatically increase the numerator → higher lattice energy. Smaller ionic radii reduce r → also increases lattice energy. MgO (charges ±2, smaller ions) has ~5× higher lattice energy than NaCl (charges ±1, larger ions).",
            h1: "💡 Use Coulomb's law: F ∝ q₁q₂/r². To INCREASE lattice energy: make charges BIGGER or distance SMALLER.",
            h2: "📐 Increase charge → increases lattice energy directly. Increase size → DECREASES lattice energy (larger r in denominator).",
            h3: "🔢 Answer: B — Higher magnitude of charge. MgO (±2) melts at 2852°C; NaCl (±1) melts at only 801°C.",
            xp: 15, t: 65,
        },
        {
            id: "cb_m3",
            q: "Ionic compounds are generally soluble in:",
            options: ["A) Organic solvents like benzene", "B) Non-polar solvents like CCl₄", "C) Polar solvents such as water", "D) All of the above"],
            correct: 2,
            exp: "'Like dissolves like.' Ionic compounds are charged, so they dissolve in polar solvents like water. Water's δ− oxygen clusters around cations and δ+ hydrogens cluster around anions — solvation provides enough energy to overcome the lattice energy. Non-polar benzene and CCl₄ have no partial charges and cannot solvate ions.",
            h1: "💡 'Like dissolves like.' Ionic compounds have charges — polar solvents also have partial charges (δ+/δ−) to interact with them.",
            h2: "📐 Water: bent shape → permanent dipole → δ+H and δ−O ends solvate ions and pull them out of the lattice.",
            h3: "🔢 Answer: C — Polar solvents like water. Ion-dipole interactions provide the energy to break the ionic lattice.",
            xp: 15, t: 65,
        },
        {
            id: "cb_m4",
            q: "What is the formal charge on an atom in a polyatomic ion?",
            options: ["A) The net charge on the ion as a whole.", "B) The charge assigned to individual atoms within the ion.", "C) The number of shared pairs of electrons.", "D) The total number of valence electrons."],
            correct: 1,
            exp: "Formal charge is the hypothetical charge assigned to each individual atom in a molecule or ion, calculated assuming bond electrons are shared equally 50/50. FC = Valence e⁻ − Lone pair e⁻ − ½(Bonding e⁻). The sum of all formal charges equals the overall charge of the ion/molecule.",
            h1: "💡 Formal charge is PER ATOM, not per molecule. It assumes perfect 50/50 sharing in all bonds.",
            h2: "📐 FC = Valence e⁻ − Non-bonding e⁻ − ½(Bonding e⁻). For N in NH₄⁺: 5 − 0 − 4 = +1.",
            h3: "🔢 Answer: B — Charge assigned to individual atoms. Option A is the net ionic charge of the entire species.",
            xp: 15, t: 70,
        },
        {
            id: "cb_m5",
            q: "In a coordinate (dative) bond, the shared electrons are:",
            options: ["A) Contributed by both atoms.", "B) Contributed by one atom and shared by both.", "C) Transferred completely from one atom to another.", "D) Lost by both atoms."],
            correct: 1,
            exp: "In a coordinate (dative) bond, ONE atom (the donor/Lewis base) provides BOTH electrons — its lone pair — to an empty orbital of the acceptor atom. Once formed, the bond is indistinguishable from a normal covalent bond in strength and properties. Example: N in NH₃ donates its lone pair to H⁺ → NH₄⁺.",
            h1: "💡 Normal covalent: 1 electron from each atom. Dative/coordinate: 2 electrons from ONE atom only.",
            h2: "📐 Donor = has lone pair (NH₃, H₂O). Acceptor = has empty orbital (H⁺, BF₃, metal ions).",
            h3: "🔢 Answer: B — One atom contributes both electrons, but it's still a covalent (not ionic) bond once formed.",
            xp: 15, t: 70,
        },
        {
            id: "cb_m6",
            q: "Bond enthalpy is defined as the amount of energy required to:",
            options: ["A) Form one mole of bonds.", "B) Break one mole of bonds of a particular type into gaseous atoms.", "C) Measure the distance between two nuclei.", "D) Change the bond angle in a molecule."],
            correct: 1,
            exp: "Bond enthalpy (bond dissociation enthalpy) is the energy required — always positive (endothermic) — to break one mole of a specific bond in gaseous molecules to produce free gaseous atoms. Measured in gas phase to exclude intermolecular forces. Higher bond enthalpy = stronger bond. Forming bonds releases the same energy (exothermic).",
            h1: "💡 Bond enthalpy is about BREAKING bonds (endothermic = +ve ΔH). Forming bonds is the reverse (exothermic = −ve ΔH).",
            h2: "📐 Always gaseous state: C−C=348, C=C=614, C≡C=839 kJ/mol. Higher bond order → higher enthalpy.",
            h3: "🔢 Answer: B — Break one mole of bonds into gaseous atoms. Option A describes bond formation (the reverse).",
            xp: 15, t: 70,
        },
        {
            id: "cb_m7",
            q: "According to the relationship between bond order and bond length:",
            options: ["A) As bond order increases, bond length increases.", "B) As bond order increases, bond length decreases.", "C) Bond order and bond length are independent.", "D) Bond order equals the bond length in Angstroms."],
            correct: 1,
            exp: "Bond order and bond length are inversely proportional. More shared electron pairs pull nuclei closer together, decreasing bond length and increasing bond strength. Data: N−N=145pm (BO=1) > N=N=125pm (BO=2) > N≡N=110pm (BO=3). Bond enthalpy increases with bond order.",
            h1: "💡 More bonds = nuclei pulled closer = SHORTER bond. More bonds also = harder to break = STRONGER.",
            h2: "📐 Bond order ∝ 1/bond length (inverse). Bond order ∝ bond enthalpy (direct).",
            h3: "🔢 Answer: B — Bond order ↑ → bond length ↓. C−C=154pm, C=C=134pm, C≡C=120pm confirms this.",
            xp: 15, t: 70,
        },
        {
            id: "cb_m8",
            q: "Resonance structures are used when:",
            options: ["A) A single Lewis structure can explain all properties of a molecule.", "B) A single Lewis structure cannot explain all the properties of a molecule.", "C) The molecule has only sigma bonds.", "D) The molecule is non-polar."],
            correct: 1,
            exp: "Resonance structures are needed when no single Lewis structure can fully explain all observed properties — especially bond lengths. The actual molecule is a resonance hybrid (average) of all valid structures. Example: O₃ has both O−O bonds at 128 pm — between single bond (148 pm) and double bond (121 pm) — only explained by resonance.",
            h1: "💡 If actual bond lengths differ from what any single Lewis structure predicts, you need resonance!",
            h2: "📐 The molecule IS the hybrid — not flipping between structures. Like a mule is a hybrid, not alternating horse and donkey.",
            h3: "🔢 Answer: B — Single structure can't explain all properties. O₃, CO₃²⁻, and benzene are classic resonance examples.",
            xp: 15, t: 70,
        },
        {
            id: "cb_m9",
            q: "Molecules with a zero dipole moment typically have shapes that are:",
            options: ["A) Bent or angular", "B) Linear or symmetrical", "C) Unsymmetrical", "D) Pyramidal"],
            correct: 1,
            exp: "A molecule has zero dipole moment when all bond dipoles cancel completely — this requires a symmetrical geometry. CO₂ is linear (O=C=O): two equal C=O dipoles are opposite → cancel → μ=0. CCl₄ is tetrahedral: four equal C−Cl bonds point symmetrically → cancel → μ=0. H₂O is bent → dipoles don't cancel → μ≠0.",
            h1: "💡 Perfect symmetry = bond dipoles point in equal-and-opposite directions → cancel to zero.",
            h2: "📐 CO₂ (linear): O←C→O dipoles cancel. H₂O (bent): both H−O dipoles point the same side → polar.",
            h3: "🔢 Answer: B — Linear or symmetrical shapes. Zero dipole requires complete cancellation of bond dipoles.",
            xp: 15, t: 70,
        },
        {
            id: "cb_m10",
            q: "According to VSEPR theory, the shape of a molecule depends on:",
            options: ["A) The number of bonded electron pairs only.", "B) The number of lone pairs only.", "C) The total number of electron pairs (bonded and non-bonded) around the central atom.", "D) The size of the nuclei."],
            correct: 2,
            exp: "VSEPR: shape depends on the TOTAL electron pairs (bond pairs + lone pairs) around the central atom, since ALL pairs repel each other. Lone pair−lone pair repulsion is strongest. CH₄: 4 BP, 0 LP → 109.5°. NH₃: 3 BP, 1 LP → 107°. H₂O: 2 BP, 2 LP → 104.5°. Each lone pair compresses bond angles ~2−3°.",
            h1: "💡 Don't forget lone pairs! They repel just as strongly as bonding pairs — often MORE.",
            h2: "📐 Repulsion: LP-LP > LP-BP > BP-BP. Every lone pair added compresses the bond angles further.",
            h3: "🔢 Answer: C — Total electron pairs. VSEPR = Valence Shell Electron Pair Repulsion.",
            xp: 15, t: 75,
        },
        {
            id: "cb_m11",
            q: "Why is a sigma (σ) bond stronger than a pi (π) bond?",
            options: ["A) Pi bonds involve s-orbitals.", "B) Axial overlapping in sigma bonds is greater than sidewise overlapping in pi bonds.", "C) Sigma bonds are always longer than pi bonds.", "D) Pi bonds are formed by head-on overlap."],
            correct: 1,
            exp: "Sigma bonds form by direct axial (head-on) overlap along the internuclear axis — maximising orbital overlap and electron density between nuclei → stronger bond. Pi bonds form by lateral (sideways) overlap of p-orbitals above and below the axis — less overlap → weaker bond. The π contribution in C=C is only ~266 kJ/mol vs σ = 348 kJ/mol.",
            h1: "💡 Axial (face-to-face) overlap > lateral (side-by-side) overlap. More overlap = stronger bond.",
            h2: "📐 σ bond: orbitals directly along the internuclear axis → max overlap. π bond: parallel p-orbitals overlap above & below → less.",
            h3: "🔢 Answer: B — Axial overlapping in σ bonds is greater than sidewise overlapping in π bonds.",
            xp: 15, t: 75,
        },
        {
            id: "cb_m12",
            q: "In sp² hybridization, the hybrid orbitals are directed at an angle of:",
            options: ["A) 180°", "B) 109.5°", "C) 120°", "D) 90°"],
            correct: 2,
            exp: "In sp² hybridization, one s and two p orbitals mix to form three equivalent sp² hybrid orbitals. To minimise repulsion, they arrange at the corners of an equilateral triangle in one plane — 120° apart (trigonal planar). The remaining unhybridised p orbital is perpendicular to this plane and forms π bonds. Examples: BF₃, C₂H₄, SO₃.",
            h1: "💡 sp=2 orbitals(180°). sp²=3 orbitals(120°). sp³=4 orbitals(109.5°). Count orbitals, divide 360°.",
            h2: "📐 Three equally spaced in a circle: 360°/3 = 120°. That's trigonal planar — the sp² geometry.",
            h3: "🔢 Answer: C — 120°. Three sp² orbitals in one plane at 120°; unhybridised p orbital is perpendicular.",
            xp: 15, t: 70,
        },
        {
            id: "cb_m13",
            q: "The structure of methane (CH₄) is explained by which type of hybridization?",
            options: ["A) sp", "B) sp²", "C) sp³", "D) dsp²"],
            correct: 2,
            exp: "In methane, carbon undergoes sp³ hybridization: the 2s and all three 2p orbitals mix to form four equivalent sp³ hybrid orbitals pointing toward the corners of a regular tetrahedron at 109.5°. Each sp³ orbital overlaps with H's 1s orbital to form four identical C−H σ bonds.",
            h1: "💡 Four IDENTICAL bonds at equal angles → must come from four equivalent hybrid orbitals → sp³.",
            h2: "📐 sp³: 1s + 3p = 4 hybrid orbitals at 109.5° (tetrahedral). All four C−H bonds in CH₄ are identical.",
            h3: "🔢 Answer: C — sp³. Carbon: 2s²2p² → sp³ hybridized → four sp³ orbitals → tetrahedral CH₄.",
            xp: 15, t: 70,
        },
        {
            id: "cb_m14",
            q: "An intramolecular hydrogen bond is formed:",
            options: ["A) Between two different molecules of the same compound.", "B) Between two different molecules of different compounds.", "C) Within the same molecule between two electronegative atoms.", "D) Only in the gaseous state."],
            correct: 2,
            exp: "Intramolecular hydrogen bonding occurs WITHIN the same molecule: H bonded to one electronegative atom is attracted to another electronegative atom in the SAME molecule. This creates an internal ring. Example: o-nitrophenol forms a 6-membered ring via O−H···O=N within one molecule. Options A and B describe INTERmolecular H-bonds.",
            h1: "💡 INTRA = within one molecule. INTER = between different molecules. Intramolecular needs donor AND acceptor in same molecule.",
            h2: "📐 Requires a H-donor (−OH, −NH) and H-acceptor (=O, −N=) close enough within the SAME molecule.",
            h3: "🔢 Answer: C — Within the same molecule. Options A and B describe intermolecular H-bonds.",
            xp: 15, t: 70,
        },
        {
            id: "cb_m15",
            q: "Which molecule is an example of an intramolecular hydrogen bond?",
            options: ["A) Water (H₂O)", "B) Ammonia (NH₃)", "C) o-nitrophenol", "D) Hydrogen Fluoride (HF)"],
            correct: 2,
            exp: "o-nitrophenol shows intramolecular H-bonding: the −OH hydrogen and one oxygen of the adjacent −NO₂ group (on the ortho carbon) form an internal O−H···O=N bond, creating a stable 6-membered ring. Water, NH₃, and HF all show only INTERmolecular hydrogen bonds between different molecules.",
            h1: "💡 For intramolecular H-bonding: donor (−OH) and acceptor (=O) must be in the SAME molecule AND geometrically close.",
            h2: "📐 o-nitrophenol: ortho position puts −OH and −NO₂ adjacent → 6-membered intramolecular H-bond ring.",
            h3: "🔢 Answer: C — o-nitrophenol. O−H···O=N bond forms internally. Water and HF only have intermolecular H-bonds.",
            xp: 15, t: 70,
        },
    ],
    hard: [
        {
            id: "cb_h1",
            q: 'Which of the following molecules violates the octet rule by having an "expanded octet"?',
            options: ["A) LiCl", "B) BeCl₂", "C) PCl₅", "D) BCl₃"],
            correct: 2,
            exp: "PCl₅ has an expanded octet — phosphorus (Period 3) uses sp³d hybridization, forming 5 bonds and accommodating 10 electrons around P. This is possible because Period 3 atoms have accessible 3d orbitals. Period 2 atoms (Li, Be, B) have NO d-orbitals and cannot exceed 8 electrons. Note: BeCl₂ (4e⁻ around Be) and BCl₃ (6e⁻ around B) have INCOMPLETE octets — the opposite violation.",
            h1: "💡 Only Period 3+ atoms can expand their octet (they have d-orbitals). Period 2 atoms cannot go beyond 8.",
            h2: "📐 P: [Ne]3s²3p³ has empty 3d orbitals → sp³d hybridisation → 5 bonds → 10 electrons around P.",
            h3: "🔢 Answer: C — PCl₅. Phosphorus uses available 3d orbitals to form 5 bonds. BeCl₂ and BCl₃ have incomplete (not expanded) octets.",
            xp: 20, t: 140,
        },
        {
            id: "cb_h2",
            q: "In Molecular Orbital Theory (LCAO), a bonding molecular orbital is formed by the:",
            options: ["A) Subtraction of wave functions.", "B) Addition of wave functions.", "C) Complete transfer of electrons.", "D) Lateral overlap of s-orbitals only."],
            correct: 1,
            exp: "According to LCAO, a bonding MO forms by ADDITION of atomic wave functions (ψ_BMO = ψ₁ + ψ₂). This constructive interference increases electron density between the two nuclei, lowering the system's energy and stabilising the molecule. The antibonding MO forms by subtraction (ψ₁ − ψ₂), creating a node between nuclei and raising energy.",
            h1: "💡 Addition = constructive interference = waves in phase = more electron density between nuclei = bonding (lower energy).",
            h2: "📐 In-phase combination (add) → bonding MO (σ1s). Out-of-phase (subtract) → antibonding MO (σ*1s) with node.",
            h3: "🔢 Answer: B — Addition of wave functions. σ1s = ψ₁ + ψ₂ (bonding, lower energy). σ*1s = ψ₁ − ψ₂ (antibonding, node).",
            xp: 20, t: 140,
        },
        {
            id: "cb_h3",
            q: "The magnetic nature of a molecule is paramagnetic if:",
            options: ["A) All molecular orbitals have paired electrons.", "B) One or more molecular orbitals have unpaired electrons.", "C) The bond order is a whole number.", "D) It contains only sigma bonds."],
            correct: 1,
            exp: "Paramagnetism arises from unpaired electrons. Each unpaired electron has a spin magnetic moment that aligns with an external field, causing attraction. O₂ has two unpaired electrons in degenerate π*2p orbitals (Hund's rule) → paramagnetic. N₂ has all paired electrons → diamagnetic. MO theory's prediction of O₂'s paramagnetism was a key triumph that VB theory could not explain.",
            h1: "💡 Unpaired electron = net magnetic moment = attracted to magnet = paramagnetic. All paired = diamagnetic.",
            h2: "📐 Fill MOs using Aufbau + Pauli + Hund's rules. Count unpaired e⁻. ≥1 unpaired → paramagnetic.",
            h3: "🔢 Answer: B — One or more MOs with unpaired electrons. O₂: π*2p¹π*2p¹ → 2 unpaired → paramagnetic.",
            xp: 20, t: 140,
        },
        {
            id: "cb_h4",
            q: "Calculate the bond order for a molecule with 10 bonding electrons and 5 antibonding electrons.",
            options: ["A) 2.5", "B) 5", "C) 1.5", "D) 0"],
            correct: 0,
            exp: "Bond order = (bonding electrons − antibonding electrons) / 2 = (10 − 5) / 2 = 5/2 = 2.5. A bond order of 2.5 indicates the molecule exists stably (between double and triple bond). This matches the NO (nitric oxide) molecule — BO = 2.5, and it is also paramagnetic (1 unpaired electron in π*).",
            h1: "💡 Formula: BO = (bonding e⁻ − antibonding e⁻) / 2. Subtract antibonding from bonding FIRST, then divide by 2.",
            h2: "📐 (10 − 5) / 2 = 5/2 = 2.5. Do NOT do 10/5 = 2, or (10+5)/2 = 7.5. Subtract, then halve.",
            h3: "🔢 Answer: A — 2.5. BO = (10−5)/2 = 2.5. Corresponds to the NO molecule.",
            xp: 20, t: 140,
        },
        {
            id: "cb_h5",
            q: "Based on the sources, what is the bond order of a Helium molecule (He₂) based on its 4 electrons?",
            options: ["A) 1", "B) 2", "C) 0 (It does not exist stably)", "D) 0.5"],
            correct: 2,
            exp: "He₂ has 4 electrons: MO configuration = (σ1s)²(σ*1s)². Bond order = (2 bonding − 2 antibonding) / 2 = 0/2 = 0. Bond order zero means every bonding electron is exactly cancelled — no net stabilisation. He₂ does NOT exist stably. This is why helium is monoatomic — forming He₂ provides zero energy advantage.",
            h1: "💡 BO = 0 → no net bonding force → molecule doesn't exist. Equal bonding and antibonding electrons cancel completely.",
            h2: "📐 He₂: σ1s²(2 bonding) + σ*1s²(2 antibonding). BO = (2−2)/2 = 0. Compare H₂: BO = (2−0)/2 = 1 → stable.",
            h3: "🔢 Answer: C — Bond order = 0. He₂ does not exist stably. Noble gases are monoatomic because diatomic offers no energy gain.",
            xp: 20, t: 140,
        },
    ],
};

// ─── CHEMISTRY CASE-STUDY DATA ────────────────────────────────────────────────
const CHEM_CASES = [
    {
        id: 1, badge: "🔬", label: "CASE 1", title: "THE SALT FACTORY SABOTAGE",
        subtitle: "Ionic Bonding & Lattice Energy",
        color: "#10b981",
        intro: `ALERT: Salt Production Line OMEGA has been flagged for anomalous crystal formation. Three batches show deviations — some crystals grow impossibly slowly, others shatter under minimal force. Factory records show unauthorized substitution of magnesium for sodium in Batch 7-C.\n\nYou are the Chemical Detective assigned to investigate. Access the factory's lab reports, ionization energy databases, and lattice energy charts. Identify the root cause of each anomaly and restore the production line before the next shift begins.`,
        questions: [
            {
                q: "LAB REPORT 7-A — Cation Formation Anomaly\n\nThe lab report shows that Batch 7-A uses standard sodium metal (ionization enthalpy: 496 kJ/mol). Workers measured an unusually high energy expenditure before crystal lattice formation began. The factory manager suspects someone replaced the sodium with a different Group 1 element. Your analysis of the Born-Haber cycle shows that one factor dominates in determining how easily a metal atom becomes a cation. Which factor is MOST IMPORTANT in favoring cation formation in ionic bonding?",
                opts: ["High negative electron gain enthalpy — the anion partner forms easily, pulling the process forward", "Low ionization enthalpy — the metal loses its electron with minimal energy input", "High lattice energy — the crystals that form are very stable, making formation favorable", "High electronegativity of the metal — it attracts electrons less, losing them easily"],
                ans: 1,
                exp: "Low ionization enthalpy is decisive for cation formation. A metal atom must first lose an electron to become a cation — the lower the energy this requires, the more readily it happens. Electron gain enthalpy (option A) favors anion formation (the chloride side). Lattice energy (C) helps the overall process but doesn't directly control how easily the metal ionizes. Electronegativity (D) actually opposes ionization.",
            },
            {
                q: "LAB REPORT 7-C — The Magnesium Substitution\n\nForensic analysis confirms: Batch 7-C used magnesium (Mg) instead of sodium (Na). Factory ionization data: Na = 496 kJ/mol (1st IE), Mg = 738 kJ/mol (1st IE), 1451 kJ/mol (2nd IE). The batch supervisor insists 'Mg and Na are in the same period, how different can they be?' Your analysis must settle this debate and explain why Mg²⁺ formation is so much slower than Na⁺ formation.",
                opts: ["Sodium has a higher electron gain enthalpy, meaning it more readily accepts electrons to form a stable anion pair", "Magnesium has a lower ionization enthalpy than sodium — it gives up electrons even more easily than sodium", "Sodium has a significantly lower first ionization enthalpy (496 vs 738 kJ/mol) — it loses its single outermost electron with far less energy expenditure", "Magnesium is a non-metal and therefore less likely to form positive ions in ionic compounds"],
                ans: 2,
                exp: "Sodium has only one outermost electron in a 3s¹ configuration that is well-shielded and easy to remove (496 kJ/mol). Magnesium needs to lose TWO electrons (738 + 1451 = 2189 kJ/mol total) to form the stable Mg²⁺ ion used in MgCl₂. This is dramatically more energy than Na needs, slowing crystal formation significantly. Magnesium is a metal (D is wrong), and electron gain enthalpy (A) relates to anion formation.",
            },
            {
                q: "STRUCTURAL ANALYSIS — Crystal Brittleness Report\n\nQuality control found that some batches produce crystals that shatter far too easily. Comparing two batches: Batch A uses NaCl (Na⁺ radius 102 pm, Cl⁻ radius 181 pm, charges ±1) and Batch B uses MgO (Mg²⁺ radius 72 pm, O²⁻ radius 140 pm, charges ±2). Batch A crystals are brittle; Batch B crystals are extremely hard (melting point 2852°C vs NaCl's 801°C). Using Coulomb's law: U ∝ (q₁ × q₂)/r, which combination yields the strongest crystal lattice?",
                opts: ["Large ionic radii and small charges — more spread-out ions create a more uniform, stable structure", "Small ionic radii and high magnitude of charges — closer ions with greater charges have dramatically stronger attraction", "Low interionic attraction — reduced competition between ions means more orderly packing", "Ions existing in liquid state — thermal motion helps ions find optimal positions in the lattice"],
                ans: 1,
                exp: "Lattice energy ∝ |q₁·q₂|/r (Coulomb's law). MgO: (+2)(−2)/(72+140) pm vs NaCl: (+1)(−1)/(102+181) pm. MgO has 4× higher charge product and 25% smaller interionic distance — resulting in roughly 5× higher lattice energy. This is why MgO is used as a refractory material (melts at 2852°C) while NaCl melts at only 801°C.",
            },
            {
                q: "CONDUCTIVITY TEST — Quality Assurance Failure\n\nThe quality assurance team attempts to test electrical conductivity on the freshly formed solid NaCl crystals as part of their new protocol. All solid samples register zero conductivity, causing confusion. The team leader insists: 'NaCl has Na⁺ and Cl⁻ ions — it MUST conduct electricity!' The Chemical Detective must explain this to the team. Why do solid ionic compounds like NaCl fail to conduct electricity despite being filled with charged ions?",
                opts: ["Solid ionic compounds completely lack electrons — there are no charge carriers available", "The ions are locked in fixed positions within the rigid crystalline lattice — they cannot flow through the material to carry current", "Solid NaCl is soluble in benzene, which disrupts electron flow between ions", "Ionic compounds have very low melting points, making them unstable as conductors"],
                ans: 1,
                exp: "Electrical conductivity requires MOBILE charge carriers. In solid NaCl, Na⁺ and Cl⁻ ions are held firmly in fixed positions within the crystal lattice by powerful electrostatic forces — they cannot migrate. When NaCl is dissolved in water or melted, the ions become mobile and CAN conduct electricity. This is why 'ionic' ≠ 'always conductive' — the state of matter matters critically.",
            },
        ],
    },
    {
        id: 2, badge: "⚗️", label: "CASE 2", title: "THE VANISHING MOLECULE",
        subtitle: "Molecular Orbital Theory & Bond Order",
        color: "#3b82f6",
        intro: `URGENT: MysteriGas specimens at Cryogenic Lab SIGMA are disappearing. Synthesized at 4 AM, they break down within hours. Instruments confirm unusual electron configurations and spontaneous magnetic alignment near field generators.\n\nThe research director suspects the molecule has a near-zero bond order — but needs proof. You have access to MO energy diagrams, magnetic test data, and bond length spectrometry. Determine whether MysteriGas can exist, explain its magnetic behavior, and identify the molecular orbital signature that seals its fate.`,
        questions: [
            {
                q: "MO DIAGRAM ANALYSIS — How Does Bonding Begin?\n\nThe lab's quantum chemistry software displays atomic wave functions ψ₁ and ψ₂ for two approaching hydrogen atoms. As the atoms approach, the software shows two possible mathematical combinations of these wave functions. The first combination (ψ₁ + ψ₂) produces a pear-shaped electron cloud concentrated BETWEEN the two nuclei, dramatically lowering the system's energy. This is the foundation of MO theory. According to LCAO (Linear Combination of Atomic Orbitals), how specifically is a bonding molecular orbital formed?",
                opts: ["By subtraction of atomic wave functions (ψ₁ − ψ₂), which creates a node between the nuclei where electron density is zero", "By addition of atomic wave functions (ψ₁ + ψ₂), which causes constructive interference — electron density builds up between the nuclei, lowering energy", "By complete electron transfer from one atom to the other's empty orbital, creating an ionic interaction", "By lateral (sideways) overlap of s-orbitals, which always produces π-type molecular orbitals"],
                ans: 1,
                exp: "LCAO predicts two MOs from two AOs: (1) Bonding MO = ψ₁ + ψ₂ (constructive interference). Electron density between nuclei increases → both nuclei attracted to this region → lower energy → molecule stabilized. (2) Antibonding MO = ψ₁ − ψ₂ (destructive interference). A node (zero electron density) forms between nuclei → nuclei repel each other → higher energy.",
            },
            {
                q: "BOND ORDER CALCULATION — Does MysteriGas Exist?\n\nThe MO filling diagram for MysteriGas shows: σ1s² σ*1s² σ2s² σ*2s² — exactly 4 bonding electrons and 4 antibonding electrons. Senior researcher Dr. Patel calculates: Bond Order = (bonding e⁻ − antibonding e⁻)/2 = (4−4)/2 = 0. The junior researcher protests: 'But it has electrons! How can it not exist?' What does a bond order of zero conclusively indicate about the existence and stability of a molecule?",
                opts: ["The molecule is extremely stable — having equal bonding and antibonding electrons creates a perfectly balanced, neutral system", "The molecule has both sigma and pi bonds, giving it complex but stable bonding", "The molecule does NOT exist stably — bonding and antibonding electrons cancel each other completely, leaving no net force holding atoms together", "The molecule is paramagnetic — the zero bond order means unpaired electrons are present in antibonding orbitals"],
                ans: 2,
                exp: "Bond order = (bonding e⁻ − antibonding e⁻)/2. A bond order of zero means every bonding electron is canceled by an antibonding electron — there is zero net attractive force between the atoms. The system has no reason to stay together. This perfectly explains why He₂ doesn't exist: σ1s²σ*1s² → BO = (2−2)/2 = 0. The four electrons gain nothing by being in He₂ vs. two separate He atoms.",
            },
            {
                q: "MAGNETIC FIELD TEST — The Paramagnetism Mystery\n\nLab assistant Maya runs the magnetic deflection test on different gas samples. N₂ (10 bonding, 4 antibonding electrons, all paired) shows NO deflection. O₂ (10 bonding, 6 antibonding electrons) shows STRONG deflection toward the magnet. MysteriGas sample #3 also shows deflection. Maya is confused: 'O₂ has an even number of electrons — how can it be attracted to a magnet?' According to MO theory, under what condition is a molecule paramagnetic?",
                opts: ["When all electrons in all molecular orbitals are completely paired — paired spins cancel magnetic moments", "When one or more molecular orbitals contain unpaired electrons — each unpaired electron has a net spin magnetic moment that responds to external fields", "When the bond order is a whole number (1, 2, or 3) — integers indicate unpaired electrons", "When the molecule contains exclusively sigma bonds with no pi contribution"],
                ans: 1,
                exp: "Paramagnetism arises from unpaired electrons. Each unpaired electron has a spin magnetic moment (↑ or ↓). When placed in a magnetic field, these unpaired spins align with the field, causing attraction. O₂'s MO configuration ends in: ...π*2p¹ π*2p¹ (Hund's rule: electrons fill degenerate orbitals singly before pairing) → 2 unpaired electrons → paramagnetic. This was a major triumph of MO theory over VB theory, which incorrectly predicted O₂ to be diamagnetic.",
            },
            {
                q: "BOND SPECTROMETRY — Length vs Strength Analysis\n\nThe spectrometer outputs for three gas samples:\n• Sample A: Bond length 110 pm, Bond enthalpy 945 kJ/mol\n• Sample B: Bond length 121 pm, Bond enthalpy 498 kJ/mol  \n• Sample C: Bond length 154 pm, Bond enthalpy 348 kJ/mol\nThe chemist identifies Sample A as N₂ (BO=3), Sample B as O₂ (BO=2), Sample C as F₂ (BO=1). She needs to state the general rule for future analysis. What is the correct relationship between bond order and bond length/strength?",
                opts: ["Bond order and bond length are directly proportional: higher bond order = longer, weaker bond", "Bond order and bond length are inversely proportional: higher bond order = shorter bond AND stronger bond (higher bond enthalpy)", "Bond order and bond length are independent: bond length depends only on atomic radii, not electron configuration", "Higher bond order = longer bond due to increased electron-electron repulsion between multiple pairs"],
                ans: 1,
                exp: "Bond order and bond length are inversely proportional (higher order → shorter length). Bond order and bond strength are directly proportional (higher order → higher bond enthalpy). More electron pairs between two nuclei pull them closer together (shorter distance) and make the bond harder to break (stronger). The spectrometer data confirms this perfectly: N₂ (BO=3): 110pm/945kJ > O₂ (BO=2): 121pm/498kJ > F₂ (BO=1): 154pm/348kJ.",
            },
            {
                q: "FINAL VERDICT — The H₂ Baseline Test\n\nBefore concluding the investigation, Dr. Patel runs a baseline test on H₂ molecules to verify the MO filling protocol. H₂ has 2 electrons total. The MO diagram shows only two orbitals available: σ1s (bonding, lower energy) and σ*1s (antibonding, higher energy). Following Aufbau principle (fill lowest energy first), Pauli exclusion principle (max 2 electrons per orbital, opposite spins), and Hund's rule — what is the correct electron configuration and bond order of H₂?",
                opts: ["Two electrons in σ*1s (both in antibonding): BO = (0−2)/2 = −1 → does not exist", "One electron in σ1s and one in σ*1s: BO = (1−1)/2 = 0 → does not exist", "Two electrons in σ1s (both in bonding orbital): BO = (2−0)/2 = 1 → exists as a stable single bond", "No electrons in bonding orbitals — H₂ forms through electron transfer, not MO theory"],
                ans: 2,
                exp: "H₂ electron configuration: (σ1s)². Both electrons fill the lowest available orbital (σ1s bonding MO). Bond order = (2 bonding − 0 antibonding)/2 = 1. H₂ exists as a stable molecule with one sigma bond. Bond length = 74 pm, bond enthalpy = 436 kJ/mol. This is the simplest and most fundamental application of MO theory, perfectly confirmed experimentally.",
            },
        ],
    },
    {
        id: 3, badge: "🫧", label: "CASE 3", title: "THE SNEAKY HYDROGEN",
        subtitle: "Resonance, H-Bonding & Molecular Geometry",
        color: "#f97316",
        intro: `INCIDENT REPORT: Beverage Company FIZZ-LAB has a contamination mystery. Three different beverages show unexpected foaming, altered solubility, and strange boiling points compared to theoretical predictions. All anomalies trace to unusual intermolecular interactions.\n\nChemical Detective, you have 4 hours. The culprit appears to be hydrogen — forming bonds it shouldn't. Analyze the molecular structures, identify resonance contributors, classify the hydrogen bonding patterns, and determine why molecules with identical formulas can behave so differently.`,
        questions: [
            {
                q: "STRUCTURE ANALYSIS LAB — The Ozone Puzzle\n\nThe lab's NMR and X-ray crystallography team reports an anomaly: ozone (O₃) shows two equal O-O bond lengths of 128 pm. This is strange because the Lewis structure they drew shows one single bond (148 pm expected) and one double bond (121 pm expected). Two valid Lewis structures exist:\n• Structure 1: O=O−O (double bond on left)\n• Structure 2: O−O=O (double bond on right)\nNeither alone explains the equal bond lengths. This happens when: (resonance structures are needed). What must remain UNCHANGED between all resonance structures of the same molecule?",
                opts: ["The positions of all atoms/nuclei — only electrons are redistributed between resonance structures; atoms never move", "The number of sigma bonds only — pi bonds are allowed to shift and migrate freely", "The formal charges on all atoms must be identical in every resonance structure drawn", "The molecular 3D shape must be the same — VSEPR determines structure, not electron placement"],
                ans: 0,
                exp: "In all resonance structures, the nuclear skeleton (positions of all atoms) remains absolutely fixed. Only the positions of electrons (specifically, pi bonds and lone pairs) change between resonance structures. Sigma bonds NEVER move. This is why we say resonance structures differ only in electron distribution, not molecular framework. Ozone: the O-O-O angle (117°) and the central oxygen's position never change across both resonance forms.",
            },
            {
                q: "BOILING POINT ANOMALY — Water vs Hydrogen Sulfide\n\nThe lab database shows:\n• H₂O: MW = 18 g/mol, BP = 100°C\n• H₂S: MW = 34 g/mol, BP = −60°C\n• H₂Se: MW = 81 g/mol, BP = −41°C\nBy molecular weight alone, H₂O should have the LOWEST boiling point. Instead it's dramatically higher than both H₂S and H₂Se. The quality control chemist correctly identifies hydrogen bonding as the cause. Which statement correctly describes the strength of hydrogen bonds relative to covalent bonds?",
                opts: ["Hydrogen bonds are stronger than covalent bonds — this is why water has such anomalously high properties", "Hydrogen bonds are weaker than covalent bonds but significantly stronger than typical van der Waals forces — they're special dipole-dipole interactions between H and highly electronegative atoms (N, O, F)", "Hydrogen bonds are only formed between metal atoms in crystalline structures, not in liquids", "Hydrogen bonds only exist in the solid (ice) state and disappear completely upon melting"],
                ans: 1,
                exp: "Hydrogen bonds (~10-40 kJ/mol) are weaker than covalent bonds (200-1000 kJ/mol) but much stronger than ordinary van der Waals forces (~1-10 kJ/mol). They form specifically between a H covalently bonded to N, O, or F (which makes H partially positive δ+) and a lone pair of an adjacent N, O, or F atom. In water, each molecule can form up to 4 hydrogen bonds — explaining its exceptionally high boiling point relative to its molecular mass.",
            },
            {
                q: "SOLUBILITY CASE FILE — The Two Phenols\n\nForensic chemistry reveals two isomers in the beverage:\n• o-nitrophenol: odor present, dissolves in oily layer, BP = 214°C\n• p-nitrophenol: odorless, dissolves in water layer, BP = 279°C\nBoth have IDENTICAL molecular formulas (C₆H₅NO₃) and molecular weights. The only difference: in the ortho isomer, -OH and -NO₂ groups are on adjacent ring carbons (close together). In the para isomer, they're on opposite ends of the ring. The Detective suspects intramolecular hydrogen bonding is the culprit. Which molecule most clearly exhibits INTRAMOLECULAR hydrogen bonding?",
                opts: ["Water (H₂O) — two lone pairs on oxygen attract adjacent water molecules within the same molecule", "Hydrogen fluoride (HF) — the strong F-H bond creates internal bonding within the HF molecule", "o-nitrophenol — the -OH group and -NO₂ group are geometrically positioned to form a hydrogen bond WITHIN the same molecule, creating a 6-membered ring", "Ammonia (NH₃) — the lone pair on nitrogen bonds internally to one of the hydrogens"],
                ans: 2,
                exp: "o-nitrophenol: the -OH hydrogen and one oxygen of the adjacent -NO₂ group are close enough (ortho position) to form an intramolecular H-bond, creating a stable 6-membered ring (O-H...O=N-C=C). This internal H-bond 'uses up' the -OH group, making the molecule less able to form H-bonds with water → lower water solubility → dissolves in oily (non-polar) layer. p-nitrophenol cannot form this internal bond → -OH is free to H-bond with water → higher water solubility.",
            },
            {
                q: "FOAM MECHANISM — Intermolecular Hydrogen Bonding\n\nThe foam in Beverage FIZZ-3 is caused by extensive hydrogen bond networks between dissolved sugar molecules and water. The foaming agent (a surfactant) works partly by interrupting these networks at the water surface. Understanding the distinction between intra- and intermolecular hydrogen bonding is critical for formulation. Intermolecular hydrogen bonding occurs specifically between:",
                opts: ["Two atoms within the same molecule — the bond connects different parts of one molecular chain", "Two separate molecules of the same or different compounds — the H of one molecule bonds to an electronegative atom of a different molecule", "The nucleus of a hydrogen atom and its own valence electrons — a form of intranuclear bonding", "Only between noble gas atoms dissolved in polar solvents — a quantum mechanical effect"],
                ans: 1,
                exp: "Intermolecular hydrogen bonding occurs BETWEEN separate molecules — the partially positive H of one molecule (bonded to N, O, or F) is attracted to a lone pair on an N, O, or F of a different molecule. Examples: water...water, water...ammonia, HF...HF chains. This is what gives water its high surface tension and cohesion. Contrast with intramolecular H-bonds (within the same molecule, like o-nitrophenol).",
            },
            {
                q: "FINAL STRUCTURE PUZZLE — The Expanded Octet Compound\n\nTrace analysis of the beverage contamination identifies a phosphorus-containing stabilizer molecule. The molecular formula shows the central phosphorus atom forming 5 bonds simultaneously. The lab technician checks the octet rule and says: 'This is impossible — carbon, nitrogen, and oxygen can never do this.' But the senior chemist says: 'Phosphorus CAN — it uses orbitals that Period 2 elements simply don't have.' Which molecule demonstrates an expanded octet where the central atom accommodates more than 8 electrons?",
                opts: ["LiCl — lithium has empty 2p orbitals but these are in Period 2 and cannot expand the octet", "BeCl₂ — beryllium actually has an INCOMPLETE octet (only 4 electrons around Be), the opposite of expansion", "PCl₅ — phosphorus (Period 3, has 3d orbitals) forms 5 bonds using sp³d hybridization, accommodating 10 electrons around phosphorus", "BCl₃ — boron forms only 3 bonds in a trigonal planar structure, also with an incomplete octet (6 electrons)"],
                ans: 2,
                exp: "PCl₅ has an expanded octet: phosphorus forms 5 covalent bonds (10 electrons around P) using sp³d hybridization. This is possible because P is in Period 3 and has accessible 3d orbitals. Period 2 elements (C, N, O, F, Ne) have no d-orbitals and cannot expand beyond the octet. Note: BeCl₂ and BCl₃ are exceptions in the other direction — incomplete octets (4 and 6 electrons respectively). Only Period 3+ central atoms can exceed 8 electrons.",
            },
        ],
    },
];

const DUELS = [
    { id: 1, opponent: "NebulaKing", av: "🚀", rating: 1820, subject: "Motion in a Plane", diff: "Hard", xpWin: 120, timeLeft: "2h 14m", status: "pending" },
    { id: 2, opponent: "QuantumLeap", av: "⚡", rating: 1750, subject: "Laws of Motion", diff: "Medium", xpWin: 80, timeLeft: "Active", status: "active" },
    { id: 3, opponent: "StarForge", av: "🌟", rating: 1680, subject: "Trigonometry", diff: "Medium", xpWin: 75, timeLeft: "5h 30m", status: "pending" },
    { id: 4, opponent: "CosmicDrift", av: "🌌", rating: 1540, subject: "Derivatives", diff: "Easy", xpWin: 50, timeLeft: "Done", status: "done", won: true },
    { id: 5, opponent: "VoidWalker", av: "🌙", rating: 1480, subject: "Electrostatics", diff: "Hard", xpWin: 110, timeLeft: "Done", status: "done", won: false },
];

const BOARD = [
    { rank: 1, name: "NebulaKing", xp: 8420, streak: 23, av: "🚀", level: 18 },
    { rank: 2, name: "QuantumLeap", xp: 7890, streak: 15, av: "⚡", level: 16 },
    { rank: 3, name: "StarForge", xp: 7230, streak: 19, av: "🌟", level: 15 },
    { rank: 4, name: "You", xp: 6750, streak: 7, av: "🔭", level: 14, isUser: true },
    { rank: 5, name: "CosmicDrift", xp: 5990, streak: 9, av: "🌌", level: 13 },
    { rank: 6, name: "VoidWalker", xp: 5440, streak: 4, av: "🌙", level: 12 },
    { rank: 7, name: "Photon7", xp: 4880, streak: 11, av: "💫", level: 11 },
];

const T = {
    page: { width: "100%", minHeight: "100vh", background: "linear-gradient(170deg,#060818 0%,#0c0d2a 45%,#100825 100%)", color: "#dce8ff", fontFamily: "'Sora',sans-serif", position: "relative", overflowX: "hidden" },
    card: { background: "rgba(10,14,40,0.82)", border: "1px solid rgba(124,58,237,0.18)", borderRadius: 16, backdropFilter: "blur(14px)" },
    btn: { background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "white", border: "none", borderRadius: 10, padding: "12px 28px", fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 14, cursor: "pointer", transition: "all 0.2s" },
    ghost: { background: "rgba(124,58,237,0.1)", color: "#a78bfa", border: "1px solid rgba(124,58,237,0.3)", borderRadius: 10, padding: "10px 22px", fontFamily: "'Sora',sans-serif", fontWeight: 600, fontSize: 13, cursor: "pointer", transition: "all 0.2s" },
    inp: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(124,58,237,0.25)", borderRadius: 10, padding: "13px 16px", color: "#dce8ff", fontFamily: "'JetBrains Mono',monospace", fontSize: 14, width: "100%", outline: "none", transition: "border-color 0.2s", resize: "vertical" },
};

function Pill({ children, color = "#a78bfa" }) { return <span style={{ background: `${color}18`, color, border: `1px solid ${color}33`, borderRadius: 99, padding: "3px 11px", fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", display: "inline-block" }}>{children}</span>; }
function Bar({ pct, h = 6, color = "linear-gradient(90deg,#6d28d9,#a855f7)" }) { return <div style={{ height: h, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden" }}><div style={{ height: "100%", width: `${Math.min(pct, 100)}%`, background: color, borderRadius: 99, boxShadow: "0 0 8px rgba(168,85,247,0.4)", transition: "width 0.7s ease" }} /></div>; }
function Stars() { const s = useRef(Array.from({ length: 140 }, (_, i) => ({ id: i, x: Math.random() * 100, y: Math.random() * 100, sz: Math.random() * 1.6 + 0.4, dur: Math.random() * 5 + 3, del: Math.random() * 6 }))).current; return <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>{s.map(s => <div key={s.id} style={{ position: "absolute", left: `${s.x}%`, top: `${s.y}%`, width: s.sz, height: s.sz, borderRadius: "50%", background: "white", animation: `twinkle ${s.dur}s ${s.del}s ease-in-out infinite alternate` }} />)}</div>; }

function TopBar({ xp, tab, onNav }) {
    const tabs = [{ id: "dashboard", label: "Dashboard" }, { id: "galaxy", label: "🌌 Galaxy Map" }, { id: "duels", label: "⚔️ Duels" }, { id: "leaderboard", label: "Leaderboard" }, { id: "progress", label: "Progress" }];
    return <div style={{ position: "fixed", top: 0, left: 0, right: 0, width: "100%", zIndex: 200, background: "rgba(6,8,24,0.93)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(124,58,237,0.14)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", height: 58 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <span style={{ fontSize: 20, fontWeight: 800, color: "white", letterSpacing: "-0.03em", flexShrink: 0 }}>clar<span style={{ color: "#a78bfa" }}>io</span></span>
            <nav style={{ display: "flex", gap: 2 }}>{tabs.map(t => <button key={t.id} onClick={() => onNav(t.id)} style={{ background: tab === t.id ? "rgba(124,58,237,0.22)" : "transparent", border: "none", borderRadius: 8, color: tab === t.id ? "#c4b5fd" : "#4b5e82", padding: "6px 12px", fontFamily: "'Sora',sans-serif", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap" }}>{t.label}</button>)}</nav>
        </div>
        <div style={{ display: "flex", gap: 9, alignItems: "center" }}>
            <div style={{ ...T.card, padding: "5px 13px", display: "flex", gap: 6, alignItems: "center", border: "1px solid rgba(253,230,138,0.22)" }}><span>⚡</span><span style={{ fontWeight: 800, color: "#fde68a", fontSize: 13 }}>{xp.toLocaleString()} XP</span></div>
            <div style={{ ...T.card, padding: "5px 13px", display: "flex", gap: 6, alignItems: "center", border: "1px solid rgba(251,146,60,0.22)" }}><span>🔥</span><span style={{ fontWeight: 800, color: "#fdba74", fontSize: 13 }}>7d</span></div>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, cursor: "pointer", border: "2px solid rgba(124,58,237,0.4)" }}>🔭</div>
        </div>
    </div>;
}

function Login({ onLogin }) {
    const [mode, setMode] = useState("login");
    const [email, setEmail] = useState("");
    const [pw, setPw] = useState("");
    const [showPw, setShowPw] = useState(false);
    const inp = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(124,58,237,0.22)", borderRadius: 10, padding: "13px 16px", color: "#dce8ff", fontFamily: "'Sora',sans-serif", fontSize: 14, width: "100%", outline: "none", transition: "border-color 0.2s" };
    return <div style={{ ...T.page, display: "flex", alignItems: "center", justifyContent: "center", width: "100vw", minHeight: "100vh" }}>
        <Stars />
        <div style={{ position: "fixed", top: "-20%", right: "-5%", width: "55%", height: "60%", background: "radial-gradient(circle,rgba(76,29,149,0.28) 0%,transparent 65%)", pointerEvents: "none" }} />
        <div style={{ ...T.card, display: "flex", borderRadius: 22, overflow: "hidden", width: 840, minHeight: 500, boxShadow: "0 40px 100px rgba(0,0,0,0.7)", animation: "scaleIn 0.5s ease", position: "relative", zIndex: 1 }}>
            <div style={{ width: "42%", background: "linear-gradient(150deg,#12053a 0%,#1a1060 45%,#0c2060 100%)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                {[200, 290, 370].map((r, i) => <div key={i} style={{ position: "absolute", width: r, height: r, borderRadius: "50%", border: `1px solid rgba(139,92,246,${0.12 - i * 0.03})`, top: "50%", left: "50%", transform: "translate(-50%,-50%)" }} />)}
                <div style={{ width: 140, height: 140, borderRadius: "50%", background: "radial-gradient(circle at 35% 35%,#c084fc,#7c3aed 50%,#1e1b4b)", boxShadow: "0 0 60px rgba(196,132,252,0.32)", animation: "floatY 7s ease-in-out infinite", position: "relative", zIndex: 2 }}>
                    <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%) rotateX(72deg)", width: 190, height: 190, borderRadius: "50%", border: "16px solid rgba(139,92,246,0.28)" }} />
                </div>
                <div style={{ position: "absolute", bottom: "22%", left: "18%", width: 44, height: 44, borderRadius: "50%", background: "radial-gradient(circle at 35% 35%,#60a5fa,#1e40af)", animation: "floatY 9s 1s ease-in-out infinite" }} />
                <div style={{ position: "absolute", top: "20%", right: "16%", width: 28, height: 28, borderRadius: "50%", background: "radial-gradient(circle at 35% 35%,#34d399,#064e3b)", animation: "floatY 11s 2s ease-in-out infinite" }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right,transparent 75%,rgba(10,14,40,0.65))" }} />
                <div style={{ position: "absolute", bottom: 28, left: 28, right: 28 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#a78bfa", marginBottom: 5, letterSpacing: "0.06em" }}>CLARIO</p>
                    <p style={{ fontSize: 16, fontWeight: 800, color: "white", lineHeight: 1.45 }}>Master Physics, Chemistry<br />&amp; Maths through space</p>
                </div>
            </div>
            <div style={{ flex: 1, padding: "50px 44px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <h1 style={{ fontSize: 30, fontWeight: 800, color: "white", letterSpacing: "-0.025em", marginBottom: 6 }}>Welcome back, Explorer</h1>
                <p style={{ fontSize: 14, color: "#4b5e82", marginBottom: 32 }}>Continue your journey through the cosmos of knowledge</p>
                <div style={{ display: "flex", background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 4, marginBottom: 28, border: "1px solid rgba(124,58,237,0.14)" }}>
                    {["login", "signup"].map(m => <button key={m} onClick={() => setMode(m)} style={{ flex: 1, padding: "10px", background: mode === m ? "linear-gradient(135deg,#7c3aed,#4f46e5)" : "transparent", border: "none", borderRadius: 8, color: mode === m ? "white" : "#3a4a62", fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 13, cursor: "pointer", textTransform: "capitalize", transition: "all 0.2s" }}>{m === "login" ? "Login" : "Sign Up"}</button>)}
                </div>
                <div style={{ marginBottom: 14 }}><label style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.09em", color: "#3a4a62", display: "block", marginBottom: 7 }}>EMAIL</label><input style={inp} placeholder="explorer@clario.space" value={email} onChange={e => setEmail(e.target.value)} onFocus={e => e.target.style.borderColor = "rgba(124,58,237,0.6)"} onBlur={e => e.target.style.borderColor = "rgba(124,58,237,0.22)"} /></div>
                <div style={{ marginBottom: 28, position: "relative" }}><label style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.09em", color: "#3a4a62", display: "block", marginBottom: 7 }}>PASSWORD</label><input style={inp} type={showPw ? "text" : "password"} placeholder="Enter your password" value={pw} onChange={e => setPw(e.target.value)} onFocus={e => e.target.style.borderColor = "rgba(124,58,237,0.6)"} onBlur={e => e.target.style.borderColor = "rgba(124,58,237,0.22)"} /><button onClick={() => setShowPw(!showPw)} style={{ position: "absolute", right: 14, bottom: 13, background: "none", border: "none", color: "#3a4a62", cursor: "pointer", fontSize: 15 }}>{showPw ? "🙈" : "👁️"}</button></div>
                <button onClick={onLogin} style={{ ...T.btn, width: "100%", padding: "14px", fontSize: 15, borderRadius: 12, boxShadow: "0 0 28px rgba(124,58,237,0.38)" }} onMouseEnter={e => e.target.style.boxShadow = "0 0 48px rgba(124,58,237,0.65)"} onMouseLeave={e => e.target.style.boxShadow = "0 0 28px rgba(124,58,237,0.38)"}>Continue →</button>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 18 }}><span style={{ fontSize: 12, color: "#2a3448", cursor: "pointer" }}>Forgot password?</span><span style={{ fontSize: 12, color: "#2a3448", cursor: "pointer" }}>Need an account?</span></div>
            </div>
        </div>
    </div>;
}

function Dashboard({ onSubject, onNav }) {
    const days = ["M", "T", "W", "T", "F", "S", "S"]; const bars = [0.4, 0.65, 0.5, 0.9, 0.75, 0.3, 1.0];
    const continueCards = [
        { subject: "Physics", icon: "⚛️", color: "#4a80f5", chapter: "Motion in a Plane", topic: "Projectile Motion · Hard", progress: 45, sid: "physics" },
        { subject: "Chemistry", icon: "🧪", color: "#10b981", chapter: "Some Basic Concepts", topic: "Mole Concept · Medium", progress: 30, sid: "chemistry" },
        { subject: "Maths", icon: "📐", color: "#8a4bff", chapter: "App. of Derivatives", topic: "Maxima & Minima · Practice", progress: 65, sid: "maths" },
    ];
    return <div style={{ padding: "78px 28px 40px", maxWidth: 1400, margin: "0 auto" }}>
        <div style={{ ...T.card, padding: "30px 44px", marginBottom: 22, textAlign: "center", background: "linear-gradient(135deg,rgba(76,29,149,0.52),rgba(49,46,129,0.48),rgba(20,18,60,0.38))", border: "1px solid rgba(124,58,237,0.28)", borderRadius: 20, animation: "glowPulse 5s ease-in-out infinite", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg,transparent,rgba(167,139,250,0.55),transparent)" }} />
            <h2 style={{ fontSize: 28, fontWeight: 900, color: "white", marginBottom: 14, letterSpacing: "-0.025em" }}>Ready to Start Your Next Mission?</h2>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                <button onClick={() => onNav("galaxy")} style={{ ...T.btn, padding: "12px 28px", fontSize: 14, borderRadius: 12, boxShadow: "0 0 28px rgba(124,58,237,0.45)" }}>🌌 Galaxy Map</button>
                <button onClick={() => onNav("duels")} style={{ ...T.ghost, padding: "12px 28px", fontSize: 14, borderRadius: 12, border: "1px solid rgba(251,146,60,0.4)", color: "#fdba74", background: "rgba(251,146,60,0.08)" }}>⚔️ Duel Challenge</button>
            </div>
        </div>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#3a4a62", letterSpacing: "0.1em", marginBottom: 12 }}>CONTINUE WHERE YOU LEFT OFF</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 24 }}>
            {continueCards.map((c, i) => <div key={i} onClick={() => onSubject(c.sid)} style={{ ...T.card, padding: "18px 20px", cursor: "pointer", transition: "all 0.2s", animation: `fadeUp 0.45s ${i * 0.1}s both`, border: "1px solid rgba(124,58,237,0.15)" }} onMouseEnter={e => { e.currentTarget.style.borderColor = `${c.color}55`; e.currentTarget.style.transform = "translateY(-3px)"; }} onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(124,58,237,0.15)"; e.currentTarget.style.transform = "translateY(0)"; }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 8 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 9, background: `${c.color}22`, border: `1px solid ${c.color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17 }}>{c.icon}</div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: c.color }}>{c.subject}</span>
                </div>
                <p style={{ fontWeight: 800, fontSize: 15, color: "white", marginBottom: 4 }}>{c.chapter}</p>
                <p style={{ fontSize: 11, color: "#3a4a62", marginBottom: 12 }}>{c.topic}</p>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}><span style={{ fontSize: 10, color: "#2a3448" }}>Progress</span><span style={{ fontSize: 10, color: "#2a3448" }}>{c.progress}%</span></div>
                <Bar pct={c.progress} color={`linear-gradient(90deg,${c.color}88,${c.color})`} />
                <button onClick={e => { e.stopPropagation(); onSubject(c.sid); }} style={{ ...T.ghost, width: "100%", textAlign: "center", fontSize: 12, padding: "9px", marginTop: 12 }}>Resume →</button>
            </div>)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
            <div style={{ ...T.card, padding: 20, border: "1px solid rgba(251,146,60,0.3)", background: "rgba(120,53,15,0.12)", animation: "duelPing 3s ease-in-out infinite" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}><p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "#fb923c" }}>⚔️ ACTIVE DUEL</p><Pill color="#fb923c">Live</Pill></div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🔭</div>
                    <span style={{ fontSize: 16, color: "#fb923c", fontWeight: 800 }}>VS</span>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>⚡</div>
                    <div><p style={{ fontWeight: 700, color: "white", fontSize: 14 }}>vs QuantumLeap</p><p style={{ fontSize: 11, color: "#3a4a62" }}>Laws of Motion · Medium</p></div>
                </div>
                <button onClick={() => onNav("duels")} style={{ ...T.btn, width: "100%", padding: "10px", background: "linear-gradient(135deg,#ea580c,#c2410c)", boxShadow: "0 0 18px rgba(234,88,12,0.3)" }}>Continue Duel →</button>
            </div>
            <div style={{ ...T.card, padding: 20 }}>
                <h3 style={{ fontWeight: 800, color: "white", fontSize: 14, marginBottom: 14 }}>Weekly Progress</h3>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 78 }}>
                    {days.map((d, i) => <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                        <div style={{ width: "100%", borderRadius: 4, height: `${bars[i] * 62}px`, background: i === 6 ? "linear-gradient(180deg,#a855f7,#6d28d9)" : "rgba(109,40,217,0.22)", boxShadow: i === 6 ? "0 0 12px rgba(168,85,247,0.45)" : "none" }} />
                        <span style={{ fontSize: 10, color: "#2a3448", fontWeight: 600 }}>{d}</span>
                    </div>)}
                </div>
            </div>
        </div>
        <div style={{ ...T.card, padding: 18 }}>
            <h3 style={{ fontWeight: 800, color: "white", fontSize: 13, marginBottom: 12 }}>Study Heatmap</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(14,1fr)", gap: 3 }}>{Array.from({ length: 70 }, (_, i) => { const v = Math.random(); return <div key={i} style={{ aspectRatio: "1", borderRadius: 3, background: v > 0.75 ? "rgba(139,92,246,0.82)" : v > 0.5 ? "rgba(139,92,246,0.42)" : v > 0.25 ? "rgba(139,92,246,0.16)" : "rgba(139,92,246,0.05)" }} /> })}
            </div><p style={{ fontSize: 10, color: "#2a3448", marginTop: 8 }}>10 weeks · Physics · Chemistry · Maths</p>
        </div>
    </div>;
}

function GalaxyMap({ onSelectSubject }) {
    const [hov, setHov] = useState(null);
    const planets = [
        { id: "physics", name: "Physics", icon: "⚛️", color: "#4a80f5", grad: "linear-gradient(135deg,#1e3a8a,#3b5bdb)", progress: 28, size: 120, x: 22, y: 40 },
        { id: "chemistry", name: "Chemistry", icon: "🧪", color: "#10b981", grad: "linear-gradient(135deg,#064e3b,#059669)", progress: 15, size: 104, x: 62, y: 26 },
        { id: "maths", name: "Mathematics", icon: "📐", color: "#8a4bff", grad: "linear-gradient(135deg,#4c1d95,#7c3aed)", progress: 42, size: 112, x: 75, y: 60 },
    ];
    return <div style={{ padding: "78px 28px 40px", maxWidth: 1400, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 8, animation: "fadeUp 0.4s both" }}>
            <h1 style={{ fontSize: 34, fontWeight: 900, color: "white", letterSpacing: "-0.025em" }}>Choose Your Galaxy</h1>
            <p style={{ color: "#4b5e82", fontSize: 15, marginTop: 8 }}>Select a subject to begin your exploration</p>
        </div>
        <div style={{ position: "relative", height: "calc(100vh - 280px)", minHeight: 420 }}>
            {[420, 580, 720].map((r, i) => <div key={i} style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: r, height: r * 0.52, borderRadius: "50%", border: `1px solid rgba(139,92,246,${0.07 - i * 0.02})`, pointerEvents: "none" }} />)}
            {planets.map(p => {
                const isH = hov === p.id; return <div key={p.id} style={{ position: "absolute", left: `${p.x}%`, top: `${p.y}%`, transform: `translate(-50%,-50%) scale(${isH ? 1.1 : 1})`, transition: "transform 0.25s ease", cursor: "pointer", textAlign: "center", animation: `floatY ${6 + p.x % 4}s ease-in-out infinite` }} onMouseEnter={() => setHov(p.id)} onMouseLeave={() => setHov(null)} onClick={() => onSelectSubject(p.id)}>
                    {isH && <div style={{ position: "absolute", top: "50%", left: "50%", width: p.size + 24, height: p.size + 24, borderRadius: "50%", border: `2px solid ${p.color}`, boxShadow: `0 0 24px ${p.color}60`, animation: "pulseRing 1.5s ease-out infinite", pointerEvents: "none" }} />}
                    <div style={{ width: p.size, height: p.size, borderRadius: "50%", background: p.grad, boxShadow: isH ? `0 0 50px ${p.color}80,inset -18px -18px 35px rgba(0,0,0,0.45)` : `0 0 22px ${p.color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: p.size * 0.32, margin: "0 auto 12px", border: isH ? `2px solid ${p.color}70` : "2px solid transparent", transition: "all 0.25s" }}>{p.icon}</div>
                    <p style={{ fontWeight: 800, fontSize: 16, color: isH ? "white" : "#c4cfe8", marginBottom: 3 }}>{p.name}</p>
                    <p style={{ fontSize: 13, color: "#4b5e82" }}>{p.progress}% Complete</p>
                    {isH && <div style={{ marginTop: 8 }}><Pill color={p.color}>Enter Galaxy →</Pill></div>}
                </div>;
            })}
        </div>
    </div>;
}

function SubjectPage({ subjectId, onChapter, onBack }) {
    const [cls, setCls] = useState("11");
    const sub = SUBJECTS[subjectId];
    const chs = cls === "11" ? sub.class11 : sub.class12;
    return <div style={{ padding: "78px 28px 40px", maxWidth: 1280, margin: "0 auto" }}>
        <button onClick={onBack} style={{ ...T.ghost, fontSize: 12, marginBottom: 16 }}>← Galaxy Map</button>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 22, animation: "fadeUp 0.4s both" }}>
            <div style={{ width: 54, height: 54, borderRadius: 15, background: sub.grad, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, boxShadow: `0 0 20px ${sub.color}44` }}>{sub.icon}</div>
            <div><h1 style={{ fontSize: 24, fontWeight: 900, color: "white", letterSpacing: "-0.025em" }}>{sub.name}</h1><p style={{ fontSize: 13, color: "#3a4a62" }}>NCERT Class {cls} · {chs.length} Chapters</p></div>
            <div style={{ marginLeft: "auto", display: "flex", gap: 3, background: "rgba(255,255,255,0.04)", padding: 4, borderRadius: 10, border: "1px solid rgba(124,58,237,0.14)" }}>
                {["11", "12"].map(c => <button key={c} onClick={() => setCls(c)} style={{ padding: "8px 22px", borderRadius: 8, border: "none", background: cls === c ? "linear-gradient(135deg,#7c3aed,#4f46e5)" : "transparent", color: cls === c ? "white" : "#3a4a62", fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 13, cursor: "pointer", transition: "all 0.2s" }}>Class {c}</button>)}
            </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}>
            {chs.map((ch, i) => {
                const act = ch.hasQuiz || ch.progress > 0; return <div key={ch.id} onClick={() => onChapter(ch, subjectId)} style={{ ...T.card, padding: "15px 19px", display: "flex", alignItems: "center", gap: 13, cursor: "pointer", transition: "all 0.2s", animation: `fadeUp 0.4s ${i * 0.03}s both`, border: ch.hasQuiz ? "1px solid rgba(167,139,250,0.42)" : act ? "1px solid rgba(124,58,237,0.2)" : "1px solid rgba(124,58,237,0.1)", background: ch.hasQuiz ? "rgba(124,58,237,0.1)" : "rgba(10,14,40,0.82)", position: "relative", overflow: "hidden" }} onMouseEnter={e => { e.currentTarget.style.borderColor = `${sub.color}55`; e.currentTarget.style.transform = "translateX(4px)"; }} onMouseLeave={e => { e.currentTarget.style.borderColor = ch.hasQuiz ? "rgba(167,139,250,0.42)" : act ? "rgba(124,58,237,0.2)" : "rgba(124,58,237,0.1)"; e.currentTarget.style.transform = "translateX(0)"; }}>
                    {ch.hasQuiz && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg,transparent,#a78bfa,transparent)" }} />}
                    <div style={{ fontSize: 19, width: 34, textAlign: "center", flexShrink: 0 }}>{ch.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}><p style={{ fontWeight: 700, fontSize: 13, color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Ch.{i + 1} — {ch.name}</p>{ch.hasQuiz && <Pill color="#a78bfa">Quiz ✦</Pill>}</div>
                        {ch.progress > 0 ? <><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span style={{ fontSize: 10, color: "#2a3448" }}>{ch.lastTopic || "In progress"}</span><span style={{ fontSize: 10, color: "#2a3448" }}>{ch.progress}%</span></div><Bar pct={ch.progress} h={4} color={`linear-gradient(90deg,${sub.color}88,${sub.color})`} /></> : <p style={{ fontSize: 10, color: "#2a3448" }}>Not started</p>}
                    </div>
                    <span style={{ color: "#2a3448", fontSize: 14, flexShrink: 0 }}>›</span>
                </div>;
            })}
        </div>
    </div>;
}

// ─── MODIFIED ChapterDetail (supports physics motion2d AND chemistry bonding) ─
function ChapterDetail({ chapter, subjectId, onBack, onStartQuiz, onLearn, onPracticeCases, onStartChemQuiz, onChemCases }) {
    const sub = SUBJECTS[subjectId];
    const isKin = chapter.id === "motion2d";
    const isBonding = chapter.id === "bonding" && subjectId === "chemistry";

    let modes;
    if (isBonding) {
        modes = [
            { icon: "📖", title: "Learn", desc: "Step-by-step concept walkthrough with live examples", tag: "COMING SOON", tc: "#a78bfa", avail: false, onCk: null },
            { icon: "🔬", title: "Case Investigations", desc: "3 immersive detective cases — Salt Factory, Vanishing Molecule & The Sneaky Hydrogen", tag: "NEW", tc: "#10b981", avail: true, onCk: () => onChemCases && onChemCases() },
            { icon: "🎯", title: "Personalised Quiz", desc: "25 contextual questions, 3 difficulty tiers — ionic bonding to MO theory", tag: "ADAPTIVE", tc: "#fde68a", avail: true, onCk: () => onStartChemQuiz && onStartChemQuiz() },
            { icon: "⏱️", title: "Mock Test", desc: "Exam conditions, full chapter", extra: "45 min", tc: "#6b7fa8", avail: false, onCk: null },
        ];
    } else {
        modes = [
            { icon: "📖", title: "Learn", desc: "Step-by-step concept walkthrough with live animation", tag: "RECOMMENDED", tc: "#a78bfa", avail: isKin, onCk: () => onLearn && onLearn() },
            { icon: "💡", title: "Practice Cases", desc: "Investigation-style cinematic challenges — Operation Vectorfall", tag: "NEW", tc: "#fde68a", avail: isKin, onCk: () => onPracticeCases && onPracticeCases() },
            { icon: "🎯", title: "Personalised Quiz", desc: "Adaptive questions, your level", tag: "ADAPTIVE", tc: "#34d399", avail: isKin, onCk: () => onStartQuiz() },
            { icon: "⏱️", title: "Mock Test", desc: "Exam conditions, full chapter", extra: "45 min", tc: "#6b7fa8", avail: false, onCk: null },
        ];
    }
    return <div style={{ padding: "78px 28px 40px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 16, fontSize: 13 }}>
            <button onClick={onBack} style={{ background: "none", border: "none", color: "#7c3aed", cursor: "pointer", fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 13 }}>← {sub.name}</button>
            <span style={{ color: "#2a3448" }}>/</span><span style={{ color: "#8b9ec7" }}>{chapter.name}</span>
        </div>
        <div style={{ ...T.card, padding: "20px 26px", marginBottom: 22, display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid rgba(124,58,237,0.2)", animation: "fadeUp 0.4s both" }}>
            <div>
                <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 5 }}><h2 style={{ fontSize: 22, fontWeight: 900, color: "white" }}>{chapter.name}</h2>{chapter.progress > 0 && <Pill color="#34d399">In Progress</Pill>}</div>
                <p style={{ fontSize: 13, color: chapter.progress > 0 ? "#34d399" : "#3a4a62", fontWeight: chapter.progress > 0 ? 600 : 400 }}>{chapter.progress > 0 ? `Last: ${chapter.lastTopic}` : "Not started yet"}</p>
            </div>
            {chapter.progress > 0 && <div style={{ display: "flex", gap: 24, textAlign: "right" }}>{[{ v: `${chapter.progress}%`, l: "PROGRESS", c: "white" }, { v: "78%", l: "ACCURACY", c: "#34d399" }].map((s, i) => <div key={i}><p style={{ fontSize: 24, fontWeight: 900, color: s.c }}>{s.v}</p><p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "#2a3448" }}>{s.l}</p></div>)}</div>}
        </div>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: "white", marginBottom: 4 }}>Choose Your Learning Mode</h3>
        <p style={{ fontSize: 13, color: "#3a4a62", marginBottom: 14 }}>Select how you want to explore this chapter</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {modes.map((m, i) => <div key={i} onClick={m.avail && m.onCk ? m.onCk : undefined} style={{ ...T.card, padding: "22px 24px", cursor: m.avail && m.onCk ? "pointer" : "default", transition: "all 0.2s", animation: `fadeUp 0.4s ${i * 0.08}s both`, opacity: !m.avail ? 0.38 : 1, border: i === 0 ? "1px solid rgba(124,58,237,0.32)" : i === 1 && m.avail ? "1px solid rgba(253,230,138,0.28)" : "1px solid rgba(124,58,237,0.12)", position: "relative", overflow: "hidden" }} onMouseEnter={e => m.avail && m.onCk && (e.currentTarget.style.borderColor = i === 1 ? "rgba(253,230,138,0.55)" : "rgba(124,58,237,0.52)", e.currentTarget.style.transform = "translateY(-2px)")} onMouseLeave={e => m.avail && m.onCk && (e.currentTarget.style.borderColor = i === 0 ? "rgba(124,58,237,0.32)" : i === 1 ? "rgba(253,230,138,0.28)" : "rgba(124,58,237,0.12)", e.currentTarget.style.transform = "translateY(0)")}>
                {m.tag && <div style={{ position: "absolute", top: 14, right: 14 }}><Pill color={m.tc}>{m.tag}</Pill></div>}
                <div style={{ width: 46, height: 46, borderRadius: 13, background: "rgba(124,58,237,0.16)", border: "1px solid rgba(124,58,237,0.24)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 13 }}>{m.icon}</div>
                <h4 style={{ fontSize: 17, fontWeight: 800, color: "white", marginBottom: 5 }}>{m.title}</h4>
                <p style={{ fontSize: 13, color: "#3a4a62", marginBottom: 11 }}>{m.desc}</p>
                {m.xp && <Pill color="#fde68a">⚡ {m.xp}</Pill>}
                {m.extra && <Pill color="#4b5e82">🕐 {m.extra}</Pill>}
                {!m.avail && <p style={{ fontSize: 11, color: "#2a3448", marginTop: 7 }}>Coming soon</p>}
            </div>)}
        </div>
    </div>;
}

// ─── LEARN MODE (unchanged) ───────────────────────────────────────────────────
function LearnMode({ onBack }) {
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
            const scale = 3.2;
            const ox = 50, oy = H - 60;
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
            ctx.beginPath(); ctx.arc(ox, oy, 34, -(ang), 0, true); ctx.stroke();
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

    return <div style={{ padding: "78px 22px 40px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, animation: "fadeUp 0.4s both" }}>
            <button onClick={onBack} style={{ ...T.ghost, fontSize: 13 }}>← Back</button>
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
    </div>;
}

// ─── ADAPTIVE QUIZ (unchanged) ────────────────────────────────────────────────
function AdaptiveQuiz({ onXpEarned, onBack }) {
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
    const hintColors = ["#fde68a", "#fb923c", "#f87171"];
    const hintLabels = ["Hint 1 — Concept Direction", "Hint 2 — Formula Application", "Hint 3 — Guided Substitution"];
    const hintTexts = [q.h1, q.h2, q.h3];

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

    return <div style={{ padding: "78px 28px 40px", maxWidth: 860, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <button onClick={onBack} style={{ ...T.ghost, fontSize: 13 }}>← Back</button>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}><Pill color={dc[diff]}>{diff.toUpperCase()}</Pill><span style={{ fontSize: 12, color: "#2a3448" }}>Adaptive Engine · MCQ</span></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 9, marginBottom: 18 }}>
            {[{ l: "Session XP", v: `+${session.xp}`, c: "#fde68a", i: "⚡" }, { l: "Correct", v: session.correct, c: "#34d399", i: "✓" }, { l: "Accuracy", v: total ? `${acc}%` : "—", c: "#a78bfa", i: "🎯" }, { l: "Debt Score", v: debtScore > 0 ? debtScore.toFixed(2) : "0.00", c: debtScore > 0.4 ? "#ef4444" : "#4b5e82", i: "📊" }].map((s, i) => (
                <div key={i} style={{ ...T.card, padding: "11px 14px", textAlign: "center" }}><p style={{ fontSize: 10, color: "#2a3448", fontWeight: 700, letterSpacing: "0.08em", marginBottom: 3 }}>{s.i} {s.l}</p><p style={{ fontSize: 20, fontWeight: 900, color: s.c }}>{s.v}</p></div>
            ))}
        </div>
        {history.length > 0 && <div style={{ display: "flex", gap: 5, marginBottom: 16, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: 10, color: "#2a3448", fontWeight: 700, marginRight: 3, letterSpacing: "0.08em" }}>PATH:</span>
            {history.slice(-9).map((h, i) => (
                <div key={i} title={`${h.diff} · ${h.correct ? "✓" : "✗"}`} style={{ width: 26, height: 26, borderRadius: "50%", background: h.correct ? "rgba(52,211,153,0.18)" : "rgba(239,68,68,0.14)", border: `2px solid ${h.correct ? "#34d39960" : "#ef444450"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, position: "relative" }}>
                    <span style={{ fontSize: 8, color: dc[h.diff], position: "absolute", bottom: -12, fontWeight: 700 }}>{h.diff[0].toUpperCase()}</span>{h.correct ? "✓" : "✗"}
                </div>
            ))}
            <span style={{ fontSize: 11, color: "#2a3448", marginLeft: 10 }}>→ <span style={{ color: dc[diff], fontWeight: 700 }}>{diff}</span></span>
        </div>}
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
                    {q.options.map((opt, i) => (<button key={i} onClick={() => submitAnswer(i)} style={optStyle(i)} onMouseEnter={e => { if (phase === "q" && firstWrongIdx !== i) e.currentTarget.style.borderColor = "rgba(124,58,237,0.55)"; }} onMouseLeave={e => { if (phase === "q" && firstWrongIdx !== i) e.currentTarget.style.borderColor = "rgba(124,58,237,0.2)"; }}>
                        <span style={optLabelStyle(i)}>{phase === "result" && i === q.correct ? "✓" : phase === "result" && i === selected && i !== q.correct ? "✗" : LABELS[i]}</span>
                        <span>{opt}</span>
                    </button>))}
                </div>
                {phase === "result" && <div style={{ animation: "fadeUp 0.35s both" }}>
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
                </div>}
                {phase === "q" && hintsShown < 3 && <div style={{ marginTop: 4 }}>
                    <button onClick={() => setHintsShown(h => h + 1)} style={{ ...T.ghost, width: "100%", padding: "11px", fontSize: 12, border: `1px solid ${hintColors[hintsShown]}33`, color: hintColors[hintsShown], background: `${hintColors[hintsShown]}06` }}>
                        💡 {hintLabels[hintsShown]} <span style={{ opacity: 0.55, marginLeft: 6 }}>({hintPenalties[hintsShown]})</span>
                    </button>
                </div>}
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
    </div>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── CHEMISTRY ADAPTIVE QUIZ ─────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
function ChemBondingQuiz({ onXpEarned, onBack }) {
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

    const pool = CHEM_BOND_QUESTIONS[diff];
    const usedIds = history.map(h => h.id);
    const avail = pool.filter(q => !usedIds.includes(q.id));
    const q = avail.length > 0 ? avail[0] : pool[qCounter % pool.length];
    const dc = { easy: "#34d399", medium: "#f59e0b", hard: "#ef4444" };
    const LABELS = ["A", "B", "C", "D"];
    const hintPenalties = ["−15% XP", "−15% more XP", "−20% more XP"];
    const hintColors = ["#34d399", "#f59e0b", "#ef4444"];
    const hintLabels = ["Show Concept Hint", "Show Formula/Approach Hint", "Show Calculation Hint"];
    const hints = [q.h1, q.h2, q.h3];

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
                setFirstWrongIdx(idx); setSelected(idx); setShaking(true);
                setTimeout(() => setShaking(false), 600);
                setAttemptsMade(1);
            } else {
                setDebtScore(0.5); setSelected(idx); setAnswered(false); setPhase("result");
                setSession(s => ({ ...s, total: s.total + 1 }));
                setHistory(h => [...h, { id: q.id, diff, correct: false, debt: 0.5, nd: nextDiff(diff, false, hintsShown) }]);
            }
        }
    }

    function nextQ() {
        const nd = nextDiff(diff, answered, hintsShown);
        setDiff(nd); setPhase("q"); setSelected(null); setAnswered(null); setHintsShown(0);
        setAttemptsMade(0); setFirstWrongIdx(null); setDebtScore(0); setShaking(false);
        setQCounter(c => c + 1); qStartRef.current = Date.now();
    }

    const accuracy = session.total > 0 ? Math.round((session.correct / session.total) * 100) : 0;

    return <div style={{ padding: "78px 28px 40px", maxWidth: 700, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <button onClick={onBack} style={{ ...T.ghost, fontSize: 12 }}>← Chapter</button>
            <div style={{ display: "flex", gap: 8 }}>
                <div style={{ ...T.card, padding: "6px 14px", fontSize: 12, fontWeight: 700, color: dc[diff], border: `1px solid ${dc[diff]}33` }}>⚗️ Personalised Quiz · {diff.charAt(0).toUpperCase() + diff.slice(1)}</div>
                <div style={{ ...T.card, padding: "6px 14px", fontSize: 12, fontWeight: 700, color: "#fde68a", border: "1px solid rgba(253,230,138,0.22)" }}>⚡ {session.xp} XP</div>
            </div>
        </div>

        {/* Session stats bar - matches Motion in a Plane style */}
        <div style={{ ...T.card, padding: "12px 18px", marginBottom: 14, display: "flex", gap: 20, animation: "fadeUp 0.3s both", border: "1px solid rgba(16,185,129,0.15)" }}>
            {[
                { l: "ANSWERED", v: session.total, c: "white" },
                { l: "CORRECT", v: session.correct, c: "#34d399" },
                { l: "ACCURACY", v: `${accuracy}%`, c: accuracy >= 70 ? "#34d399" : accuracy >= 40 ? "#f59e0b" : "#f87171" },
                { l: "DEBT SCORE", v: debtScore > 0 ? debtScore.toFixed(2) : "0.00", c: debtScore > 0.3 ? "#f87171" : debtScore > 0.15 ? "#f59e0b" : "#34d399" },
            ].map((s, i) => <div key={i}><p style={{ fontSize: 18, fontWeight: 900, color: s.c }}>{s.v}</p><p style={{ fontSize: 9, color: "#2a3448", fontWeight: 800, letterSpacing: "0.09em" }}>{s.l}</p></div>)}
            <div style={{ flex: 1 }} />
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                {["easy", "medium", "hard"].map(d => <div key={d} style={{ width: 20, height: 20, borderRadius: 5, background: diff === d ? dc[d] : `${dc[d]}20`, border: `1px solid ${dc[d]}44`, transition: "all 0.3s", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 800, color: diff === d ? "white" : `${dc[d]}88` }}>{d[0].toUpperCase()}</div>)}
            </div>
        </div>

        {/* XP pops */}
        <div style={{ position: "relative" }}>
            {xpPops.map(p => <div key={p.id} style={{ position: "absolute", top: -10, right: 10, fontWeight: 900, fontSize: 15, color: "#fde68a", animation: "xpPop 1.5s forwards", pointerEvents: "none", zIndex: 50 }}>+{p.amt} XP ⚡</div>)}
        </div>

        {/* Question card */}
        <div style={{ ...T.card, padding: "24px 26px", marginBottom: 14, animation: `vf-popIn 0.4s both`, animationDelay: "0.05s", border: "1px solid rgba(16,185,129,0.22)", position: "relative", overflow: "hidden", animation: shaking ? "shake 0.5s both" : undefined }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: `linear-gradient(90deg,${dc[diff]},${dc[diff]}44)` }} />
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 14 }}>
                <div style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 8, padding: "4px 10px", fontSize: 10, fontWeight: 800, color: "#10b981", letterSpacing: "0.06em", flexShrink: 0, marginTop: 2 }}>🧪 Q{session.total + 1}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#dce8ff", lineHeight: 1.75, fontFamily: "'Sora',sans-serif", whiteSpace: "pre-wrap" }}>{q.q}</div>
            </div>
            {/* Hint boxes */}
            {hintsShown > 0 && <div style={{ marginBottom: 14, display: "flex", flexDirection: "column", gap: 7 }}>
                {hints.slice(0, hintsShown).map((h, i) => <div key={i} style={{ background: `${hintColors[i]}08`, border: `1px solid ${hintColors[i]}25`, borderRadius: 9, padding: "10px 14px", fontSize: 12, color: hintColors[i], lineHeight: 1.6 }}>{h}</div>)}
            </div>}
            {/* Options */}
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {q.options.map((opt, i) => {
                    const isSelected = selected === i;
                    const isFirstWrong = firstWrongIdx === i && phase === "q";
                    const isRight = phase === "result" && i === q.correct;
                    const isWrong = phase === "result" && selected === i && !answered;
                    let bg = "rgba(124,58,237,0.07)", border = "1px solid rgba(124,58,237,0.18)", color = "#8b9ec7";
                    if (isRight) { bg = "rgba(52,211,153,0.12)"; border = "1px solid rgba(52,211,153,0.45)"; color = "#34d399"; }
                    else if (isWrong) { bg = "rgba(239,68,68,0.1)"; border = "1px solid rgba(239,68,68,0.4)"; color = "#f87171"; }
                    else if (isSelected && phase === "q" && attemptsMade > 0 && !isFirstWrong) { bg = "rgba(245,158,11,0.1)"; border = "1px solid rgba(245,158,11,0.3)"; color = "#f59e0b"; }
                    else if (isFirstWrong) { bg = "rgba(239,68,68,0.07)"; border = "1px solid rgba(239,68,68,0.28)"; color = "#f87171"; }
                    return <button key={i} onClick={() => submitAnswer(i)} disabled={phase === "result" || (attemptsMade >= 1 && isFirstWrong)} style={{ background: bg, border, borderRadius: 10, padding: "12px 16px", color, fontFamily: "'Sora',sans-serif", fontSize: 13, fontWeight: 600, textAlign: "left", cursor: phase === "result" || (attemptsMade >= 1 && isFirstWrong) ? "default" : "pointer", transition: "all 0.2s", display: "flex", gap: 12, alignItems: "flex-start", lineHeight: 1.55 }}>
                        <span style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 800, flexShrink: 0, marginTop: 1 }}>{LABELS[i]}</span>
                        <span>{opt}</span>
                    </button>;
                })}
            </div>
        </div>
        {phase === "result" && <div style={{ animation: "fadeUp 0.35s both" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", background: answered ? "rgba(52,211,153,0.08)" : "rgba(239,68,68,0.08)", border: `1px solid ${answered ? "rgba(52,211,153,0.3)" : "rgba(239,68,68,0.3)"}`, borderRadius: 12, marginBottom: 14 }}>
                <span style={{ fontSize: 24 }}>{answered ? "🎉" : "❌"}</span>
                <div><p style={{ fontWeight: 800, fontSize: 15, color: answered ? "#34d399" : "#f87171" }}>{answered ? `Correct! ${attemptsMade === 0 ? "First attempt — perfect!" : "Got it on the second try."}` : "Incorrect on both attempts."}</p><p style={{ fontSize: 12, color: "#6b7fa8", marginTop: 2 }}>{answered ? `+${Math.round(q.xp * (1 - debtScore))} XP earned${debtScore > 0 ? ` (debt: −${Math.round(debtScore * 100)}%)` : ""}` : `Correct answer: (${LABELS[q.correct]}) ${q.options[q.correct]}`}</p></div>
            </div>
            <div style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 12, padding: "14px 18px", marginBottom: 14 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: "#10b981", marginBottom: 6, letterSpacing: "0.08em" }}>🧬 CHEMICAL INSIGHT</p>
                <p style={{ fontSize: 13, color: "#8b9ec7", lineHeight: 1.75 }}>{q.exp}</p>
            </div>
            {debtScore > 0.3 && <div style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 9, padding: "9px 14px", marginBottom: 12, animation: "debtWarn 1s ease 2" }}><p style={{ fontSize: 12, color: "#f87171" }}>⚠️ Debt score {debtScore.toFixed(2)} — difficulty adjusted to reinforce this concept.</p></div>}
            <button onClick={nextQ} style={{ ...T.btn, width: "100%", padding: "14px", fontSize: 14, background: answered ? "linear-gradient(135deg,#059669,#10b981)" : "linear-gradient(135deg,#7c3aed,#4f46e5)", boxShadow: answered ? "0 0 20px rgba(16,185,129,0.3)" : "0 0 20px rgba(124,58,237,0.3)" }}>
                Next Question → ({nextDiff(diff, answered, hintsShown)} difficulty)
            </button>
        </div>}
        {phase === "q" && hintsShown < 3 && <div style={{ marginTop: 4 }}>
            <button onClick={() => setHintsShown(h => h + 1)} style={{ ...T.ghost, width: "100%", padding: "11px", fontSize: 12, border: `1px solid ${hintColors[hintsShown]}33`, color: hintColors[hintsShown], background: `${hintColors[hintsShown]}06` }}>
                💡 {hintLabels[hintsShown]} <span style={{ opacity: 0.55, marginLeft: 6 }}>({hintPenalties[hintsShown]})</span>
            </button>
        </div>}
        {phase === "q" && hintsShown === 3 && <p style={{ fontSize: 11, color: "#3a4a62", textAlign: "center", marginTop: 8 }}>All hints used. Try to answer now!</p>}

        <div style={{ ...T.card, padding: "14px 19px", marginTop: 12, border: "1px solid rgba(16,185,129,0.1)" }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#2a3448", letterSpacing: "0.09em", marginBottom: 10 }}>QUESTION BANK · CHEMICAL BONDING & HYBRIDIZATION · 25 QUESTIONS</p>
            <div style={{ display: "flex", gap: 8 }}>
                {[{ l: "Easy", n: CHEM_BOND_QUESTIONS.easy.length, c: "#34d399" }, { l: "Medium", n: CHEM_BOND_QUESTIONS.medium.length, c: "#f59e0b" }, { l: "Hard", n: CHEM_BOND_QUESTIONS.hard.length, c: "#ef4444" }].map(b => (
                    <div key={b.l} style={{ flex: 1, textAlign: "center", padding: "9px", background: `${b.c}0c`, border: `1px solid ${b.c}28`, borderRadius: 9 }}>
                        <p style={{ fontSize: 19, fontWeight: 900, color: b.c }}>{b.n}</p>
                        <p style={{ fontSize: 10, color: "#2a3448", fontWeight: 700 }}>{b.l}</p>
                    </div>
                ))}
            </div>
        </div>
    </div>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── CHEMICAL INVESTIGATION GAME ─────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
const CI_LEVEL_TRANSITIONS = [
    {
        from: "🔬 CASE 1 CRACKED",
        msg: "The salt factory's anomalies trace to a rogue compound manipulating ionic lattices. Coordinates of the molecular lab obtained. Moving to Level 2...",
        color: "#10b981",
    },
    {
        from: "⚗️ CASE 2 CRACKED",
        msg: "MysteriGas identified. Its unstable bond order is being weaponised. The final signal leads to the city's water treatment facility. Initiating Level 3...",
        color: "#3b82f6",
    },
];

function ChemCaseStudy({ onXpEarned, onBack }) {
    const MAX_HP = 100;
    const HP_PER_MISS = 20; // 5 wrong answers = game over
    const [phase, setPhase] = useState("danger"); // danger | levelTransition | game | gameover | victory
    const [levelIdx, setLevelIdx] = useState(0);
    const [qIdx, setQIdx] = useState(0);
    const [hp, setHp] = useState(MAX_HP);
    const [selected, setSelected] = useState(null);
    const [answered, setAnswered] = useState(null);
    const [shaking, setShaking] = useState(false);
    const [redFlash, setRedFlash] = useState(false);
    const [attempts, setAttempts] = useState(0);
    const [firstWrong, setFirstWrong] = useState(null);
    const [xpPops, setXpPops] = useState([]);
    const [totalXp, setTotalXp] = useState(0);
    const [score, setScore] = useState({ correct: 0, total: 0 });
    const [hpAnim, setHpAnim] = useState(false);

    const cas = CHEM_CASES[levelIdx];
    const q = cas.questions[qIdx];
    const LABELS = ["A", "B", "C", "D"];
    const totalQs = CHEM_CASES.reduce((s, c) => s + c.questions.length, 0);
    const doneQs = CHEM_CASES.slice(0, levelIdx).reduce((s, c) => s + c.questions.length, 0) + qIdx;
    const hpColor = hp > 60 ? "#22c55e" : hp > 30 ? "#eab308" : "#ef4444";
    const hpPulse = hp <= 30;

    function addPop(amt) { const id = Date.now(); setXpPops(p => [...p, { id, amt }]); setTimeout(() => setXpPops(p => p.filter(x => x.id !== id)), 1600); }

    function handleSelect(i) {
        if (answered !== null) return;
        const correct = i === q.ans;
        if (correct) {
            const earned = attempts === 0 ? 20 : 10;
            setSelected(i); setAnswered(true);
            setScore(s => ({ correct: s.correct + 1, total: s.total + 1 }));
            setTotalXp(x => x + earned); onXpEarned(earned); addPop(earned);
        } else {
            if (attempts === 0) {
                setFirstWrong(i); setSelected(i); setShaking(true); setAttempts(1);
                setTimeout(() => setShaking(false), 600);
            } else {
                // second wrong — drain HP
                const newHp = hp - HP_PER_MISS;
                setSelected(i); setAnswered(false);
                setScore(s => ({ ...s, total: s.total + 1 }));
                setRedFlash(true); setHpAnim(true);
                setTimeout(() => { setRedFlash(false); setHpAnim(false); }, 700);
                setHp(newHp);
                if (newHp <= 0) setTimeout(() => setPhase("gameover"), 900);
            }
        }
    }

    function nextQ() {
        if (answered === false && hp <= 0) return;
        const nextQIdx = qIdx + 1;
        if (nextQIdx < cas.questions.length) {
            setQIdx(nextQIdx); reset();
        } else if (levelIdx < CHEM_CASES.length - 1) {
            setPhase("levelTransition");
        } else {
            setPhase("victory");
        }
    }

    function reset() { setSelected(null); setAnswered(null); setAttempts(0); setFirstWrong(null); setShaking(false); }

    function startLevel(idx) {
        setLevelIdx(idx); setQIdx(0); reset(); setPhase("game");
    }

    function restartGame() {
        setHp(MAX_HP); setLevelIdx(0); setQIdx(0); reset();
        setTotalXp(0); setScore({ correct: 0, total: 0 }); setPhase("danger");
    }

    // ── DANGER INTRO ───────────────────────────────────────────────────────────
    if (phase === "danger") return (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "78px 28px 40px", position: "relative", overflow: "hidden" }}>
            {/* Scanline overlay */}
            <div style={{ position: "fixed", inset: 0, pointerEvents: "none", background: "repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.04) 3px,rgba(0,0,0,0.04) 4px)", animation: "ci-scan 8s linear infinite", zIndex: 0 }} />
            {/* Red ambient glow */}
            <div style={{ position: "fixed", inset: 0, background: "radial-gradient(ellipse at center,rgba(239,68,68,0.12) 0%,transparent 65%)", pointerEvents: "none", animation: "ci-alarm 2s ease-in-out infinite", zIndex: 0 }} />
            <div style={{ position: "relative", zIndex: 1, maxWidth: 680, width: "100%", textAlign: "center" }}>
                <button onClick={onBack} style={{ ...T.ghost, fontSize: 12, marginBottom: 28, opacity: 0.6 }}>← Chapter</button>
                {/* Flashing danger badge */}
                <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "rgba(239,68,68,0.14)", border: "2px solid rgba(239,68,68,0.6)", borderRadius: 99, padding: "8px 22px", marginBottom: 24, animation: "ci-alarm 1s ease-in-out infinite" }}>
                    <span style={{ fontSize: 18 }}>🚨</span>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 900, fontSize: 13, color: "#fca5a5", letterSpacing: "0.2em" }}>⚠ EMERGENCY ALERT ⚠</span>
                    <span style={{ fontSize: 18 }}>🚨</span>
                </div>
                <h1 style={{ fontSize: 52, fontWeight: 900, color: "white", letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: 10, animation: "ci-glitch 6s ease-in-out infinite" }}>
                    DANGER!
                </h1>
                <h2 style={{ fontSize: 26, fontWeight: 800, color: "#fca5a5", letterSpacing: "-0.01em", marginBottom: 22 }}>
                    The City Is Under Chemical Attack
                </h2>
                {/* Terminal briefing */}
                <div style={{ background: "rgba(0,0,0,0.65)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 14, padding: "22px 26px", marginBottom: 28, textAlign: "left", fontFamily: "'JetBrains Mono',monospace", fontSize: 12, lineHeight: 2, color: "#fca5a5", position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(239,68,68,0.03) 2px,rgba(239,68,68,0.03) 4px)", pointerEvents: "none" }} />
                    <p style={{ color: "#f87171", fontWeight: 800, marginBottom: 10, fontSize: 11, letterSpacing: "0.15em" }}>◈ C.I.B. — CHEMICAL INVESTIGATION BUREAU — CLASSIFIED TRANSMISSION</p>
                    <p>AGENT, we have a LEVEL-5 chemical crisis on our hands.</p>
                    <p>An unknown compound has infiltrated three critical city systems —</p>
                    <p>the <span style={{ color: "#fde68a", fontWeight: 700 }}>Salt Manufacturing Plant</span>, the <span style={{ color: "#60a5fa", fontWeight: 700 }}>Molecular Research Lab</span>,</p>
                    <p>and the <span style={{ color: "#fb923c", fontWeight: 700 }}>City Water Treatment Facility</span>.</p>
                    <p style={{ marginTop: 10 }}>You are our <span style={{ color: "white", fontWeight: 900 }}>ONLY</span> qualified chemical detective.</p>
                    <p>Navigate all 3 crisis zones. Solve every clue. Stop the compound.</p>
                    <p style={{ color: "#f87171", marginTop: 10, fontWeight: 700 }}>WARNING: One mistake drains your VITALS. Five wrong answers = MISSION FAILED.</p>
                </div>
                {/* Stats row */}
                <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 28 }}>
                    {[{ i: "🔬", v: "3", l: "CRISIS ZONES" }, { i: "🧩", v: `${totalQs}`, l: "CLUES TO SOLVE" }, { i: "❤️", v: "5", l: "LIVES (mistakes)" }, { i: "⚡", v: "280", l: "MAX XP" }].map((s, i) => (
                        <div key={i} style={{ ...T.card, padding: "12px 16px", textAlign: "center", border: "1px solid rgba(239,68,68,0.2)", minWidth: 80 }}>
                            <div style={{ fontSize: 20, marginBottom: 4 }}>{s.i}</div>
                            <div style={{ fontSize: 18, fontWeight: 900, color: "white" }}>{s.v}</div>
                            <div style={{ fontSize: 9, color: "#6b7fa8", fontWeight: 700, letterSpacing: "0.08em" }}>{s.l}</div>
                        </div>
                    ))}
                </div>
                <button onClick={() => startLevel(0)} style={{ ...T.btn, padding: "18px 52px", fontSize: 17, background: "linear-gradient(135deg,#dc2626,#991b1b)", boxShadow: "0 0 40px rgba(239,68,68,0.5),0 0 80px rgba(239,68,68,0.2)", letterSpacing: "0.05em", fontWeight: 900, animation: "ci-alarm 2s ease-in-out infinite" }}>
                    ⚡ ACCEPT THE MISSION
                </button>
                <p style={{ marginTop: 14, fontSize: 11, color: "#374151", fontFamily: "'JetBrains Mono',monospace" }}>[ C.I.B. CLEARANCE LEVEL: OMEGA-5 ]</p>
            </div>
        </div>
    );

    // ── LEVEL TRANSITION ───────────────────────────────────────────────────────
    if (phase === "levelTransition") {
        const tr = CI_LEVEL_TRANSITIONS[levelIdx];
        return (
            <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 28px", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "fixed", inset: 0, background: `radial-gradient(ellipse at center,${tr.color}22 0%,transparent 65%)`, pointerEvents: "none" }} />
                <div style={{ ...T.card, maxWidth: 620, width: "100%", padding: "40px 36px", textAlign: "center", border: `2px solid ${tr.color}44`, animation: "ci-popIn 0.5s both", position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.04) 3px,rgba(0,0,0,0.04) 4px)", pointerEvents: "none" }} />
                    <div style={{ fontSize: 48, marginBottom: 12, animation: "ci-victory 0.6s both" }}>✅</div>
                    <div style={{ display: "inline-block", background: `${tr.color}18`, border: `1px solid ${tr.color}50`, borderRadius: 99, padding: "4px 18px", marginBottom: 14 }}>
                        <span style={{ fontWeight: 900, fontSize: 11, color: tr.color, letterSpacing: "0.12em" }}>{tr.from}</span>
                    </div>
                    <h2 style={{ fontSize: 24, fontWeight: 900, color: "white", marginBottom: 16, letterSpacing: "-0.02em" }}>Zone Secured. Advancing...</h2>
                    {/* HP display */}
                    <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
                        <span style={{ fontSize: 13, color: "#6b7fa8", fontWeight: 600 }}>Vitals remaining:</span>
                        <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden", width: 120, height: 10 }}>
                            <div style={{ height: "100%", width: `${hp}%`, background: hpColor, borderRadius: 99, transition: "width 0.5s ease" }} />
                        </div>
                        <span style={{ fontWeight: 800, color: hpColor, fontSize: 13 }}>{hp}%</span>
                    </div>
                    <div style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "16px 20px", marginBottom: 24, fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: "#94a3b8", lineHeight: 1.85, textAlign: "left" }}>
                        {tr.msg}
                    </div>
                    <button onClick={() => startLevel(levelIdx + 1)} style={{ ...T.btn, padding: "16px 42px", fontSize: 15, background: `linear-gradient(135deg,${tr.color},${tr.color}bb)`, boxShadow: `0 0 28px ${tr.color}44` }}>
                        Enter Zone {levelIdx + 2} →
                    </button>
                </div>
            </div>
        );
    }

    // ── GAME OVER ──────────────────────────────────────────────────────────────
    if (phase === "gameover") return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 28px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "fixed", inset: 0, background: "radial-gradient(ellipse at center,rgba(239,68,68,0.2) 0%,transparent 60%)", pointerEvents: "none", animation: "ci-danger 2s ease-in-out infinite" }} />
            <div style={{ position: "fixed", inset: 0, background: "repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(239,68,68,0.03) 3px,rgba(239,68,68,0.03) 4px)", pointerEvents: "none" }} />
            <div style={{ ...T.card, maxWidth: 580, width: "100%", padding: "44px 36px", textAlign: "center", border: "2px solid rgba(239,68,68,0.5)", animation: "ci-popIn 0.5s both", position: "relative", overflow: "hidden" }}>
                <div style={{ fontSize: 56, marginBottom: 12, animation: "ci-alarm 1s ease-in-out infinite" }}>💀</div>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "#f87171", letterSpacing: "0.2em", marginBottom: 8 }}>◈ MISSION FAILED ◈</div>
                <h2 style={{ fontSize: 32, fontWeight: 900, color: "#fca5a5", marginBottom: 6, letterSpacing: "-0.02em" }}>VITALS DEPLETED</h2>
                <p style={{ fontSize: 14, color: "#6b7fa8", marginBottom: 24, lineHeight: 1.6 }}>
                    The compound has overpowered your analysis systems.<br />
                    Zone <strong style={{ color: "white" }}>{levelIdx + 1}</strong> — Question <strong style={{ color: "white" }}>{qIdx + 1}</strong> was your last stand.
                </p>
                <div style={{ display: "flex", gap: 14, justifyContent: "center", marginBottom: 28 }}>
                    {[{ v: score.correct, l: "CLUES SOLVED", c: "#34d399" }, { v: `${totalQs - doneQs}`, l: "REMAINING", c: "#f87171" }, { v: `+${totalXp} XP`, l: "EARNED", c: "#fde68a" }].map((s, i) => (
                        <div key={i} style={{ ...T.card, padding: "14px 18px", textAlign: "center", border: "1px solid rgba(239,68,68,0.2)" }}>
                            <div style={{ fontSize: 22, fontWeight: 900, color: s.c, marginBottom: 2 }}>{s.v}</div>
                            <div style={{ fontSize: 9, color: "#2a3448", fontWeight: 700, letterSpacing: "0.09em" }}>{s.l}</div>
                        </div>
                    ))}
                </div>
                <div style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "14px 18px", marginBottom: 24, fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "#9ca3af", lineHeight: 1.75, textAlign: "left" }}>
                    <span style={{ color: "#f87171", fontWeight: 800 }}>C.I.B. DEBRIEF: </span>The compound remains at large. Your chemical knowledge needs reinforcement before re-deployment. Study the bonding principles and try again.
                </div>
                <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                    <button onClick={onBack} style={{ ...T.ghost, padding: "12px 22px" }}>← Exit</button>
                    <button onClick={restartGame} style={{ ...T.btn, padding: "14px 32px", background: "linear-gradient(135deg,#dc2626,#991b1b)", boxShadow: "0 0 24px rgba(239,68,68,0.4)" }}>🔄 Retry Mission</button>
                </div>
            </div>
        </div>
    );

    // ── VICTORY ────────────────────────────────────────────────────────────────
    if (phase === "victory") return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 28px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "fixed", inset: 0, background: "radial-gradient(ellipse at center,rgba(253,230,138,0.15) 0%,rgba(16,185,129,0.1) 40%,transparent 70%)", pointerEvents: "none" }} />
            <div style={{ ...T.card, maxWidth: 660, width: "100%", padding: "44px 36px", textAlign: "center", border: "2px solid rgba(253,230,138,0.4)", animation: "ci-victory 0.6s both", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(253,230,138,0.02) 3px,rgba(253,230,138,0.02) 4px)", pointerEvents: "none" }} />
                <div style={{ fontSize: 60, marginBottom: 12, animation: "ci-victory 0.5s both" }}>🏆</div>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "#fde68a", letterSpacing: "0.2em", marginBottom: 8, animation: "ci-pulse 2s infinite" }}>◈ MISSION ACCOMPLISHED ◈</div>
                <h2 style={{ fontSize: 34, fontWeight: 900, color: "white", marginBottom: 8, letterSpacing: "-0.025em" }}>CITY SAVED!</h2>
                <p style={{ fontSize: 15, color: "#94a3b8", marginBottom: 8, lineHeight: 1.65 }}>All 3 crisis zones secured. The compound has been neutralised.<br />
                    <span style={{ color: "#fde68a", fontWeight: 700 }}>You are now a Level-5 Chemical Detective.</span>
                </p>
                {/* HP remaining */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 22 }}>
                    <span style={{ fontSize: 13, color: "#6b7fa8", fontWeight: 600 }}>Vitals remaining:</span>
                    <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden", width: 120, height: 10 }}>
                        <div style={{ height: "100%", width: `${hp}%`, background: hpColor, borderRadius: 99, transition: "width 0.5s ease" }} />
                    </div>
                    <span style={{ fontWeight: 900, color: hpColor, fontSize: 14 }}>{hp}%</span>
                </div>
                {/* Score grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 26 }}>
                    {[
                        { v: `${score.correct}/${totalQs}`, l: "CLUES CRACKED", c: "#34d399" },
                        { v: `${Math.round((score.correct / totalQs) * 100)}%`, l: "ACCURACY", c: "white" },
                        { v: `+${totalXp} XP`, l: "XP EARNED", c: "#fde68a" },
                    ].map((s, i) => (
                        <div key={i} style={{ ...T.card, padding: "16px", textAlign: "center", border: `1px solid ${s.c}28` }}>
                            <div style={{ fontSize: 24, fontWeight: 900, color: s.c, marginBottom: 3 }}>{s.v}</div>
                            <div style={{ fontSize: 9, color: "#2a3448", fontWeight: 700, letterSpacing: "0.09em" }}>{s.l}</div>
                        </div>
                    ))}
                </div>
                {/* Level badges */}
                <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 26 }}>
                    {CHEM_CASES.map((c, i) => (
                        <div key={i} style={{ ...T.card, padding: "10px 16px", display: "flex", gap: 7, alignItems: "center", border: `1px solid ${c.color}40` }}>
                            <span style={{ fontSize: 16 }}>✅</span>
                            <span style={{ fontSize: 11, fontWeight: 700, color: c.color }}>{c.label}</span>
                        </div>
                    ))}
                </div>
                <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                    <button onClick={onBack} style={{ ...T.ghost, padding: "12px 22px" }}>← Chapter</button>
                    <button onClick={restartGame} style={{ ...T.btn, padding: "14px 32px", background: "linear-gradient(135deg,#059669,#10b981)", boxShadow: "0 0 28px rgba(16,185,129,0.4)" }}>🔄 Play Again</button>
                </div>
            </div>
        </div>
    );

    // ── GAME (Q&A) ─────────────────────────────────────────────────────────────
    if (phase === "game") return (
        <div style={{ padding: "78px 28px 40px", maxWidth: 760, margin: "0 auto", position: "relative", animation: redFlash ? "ci-redFlash 0.7s" : "ci-levelIn 0.4s both" }}>
            {/* Red flash overlay when HP drops */}
            {redFlash && <div style={{ position: "fixed", inset: 0, background: "rgba(239,68,68,0.18)", pointerEvents: "none", zIndex: 999, animation: "ci-redFlash 0.7s both" }} />}

            {/* ── TOP HUD ── */}
            <div style={{ ...T.card, padding: "12px 18px", marginBottom: 16, border: "1px solid rgba(239,68,68,0.2)", background: "rgba(10,14,40,0.96)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 9 }}>
                    {/* Level badges */}
                    <div style={{ display: "flex", gap: 6 }}>
                        {CHEM_CASES.map((c, i) => (
                            <div key={i} style={{ width: 26, height: 26, borderRadius: 7, background: i < levelIdx ? "rgba(52,211,153,0.2)" : i === levelIdx ? `${c.color}22` : "rgba(255,255,255,0.04)", border: i === levelIdx ? `2px solid ${c.color}` : i < levelIdx ? "2px solid rgba(52,211,153,0.5)" : "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, transition: "all 0.3s" }}>
                                {i < levelIdx ? "✓" : c.badge}
                            </div>
                        ))}
                    </div>
                    <div style={{ flex: 1, textAlign: "center" }}>
                        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 800, fontSize: 11, color: cas.color, letterSpacing: "0.1em" }}>ZONE {levelIdx + 1} — {cas.title}</span>
                    </div>
                    {/* XP */}
                    <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                        <span style={{ fontSize: 11, color: "#fde68a", fontWeight: 700 }}>⚡ {totalXp} XP</span>
                    </div>
                </div>
                {/* VITALS bar */}
                <div style={{ display: "flex", gap: 9, alignItems: "center" }}>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fontWeight: 800, color: hpColor, letterSpacing: "0.08em", flexShrink: 0, animation: hpPulse ? "ci-alarm 0.8s infinite" : undefined }}>
                        ❤ VITALS
                    </span>
                    <div style={{ flex: 1, height: 12, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden", border: `1px solid ${hpColor}33` }}>
                        <div style={{ height: "100%", width: `${hp}%`, background: hp > 60 ? "linear-gradient(90deg,#16a34a,#22c55e)" : hp > 30 ? "linear-gradient(90deg,#d97706,#eab308)" : "linear-gradient(90deg,#b91c1c,#ef4444)", borderRadius: 99, transition: "width 0.5s ease", boxShadow: `0 0 8px ${hpColor}88`, animation: hpAnim ? "ci-hpDrop 0.4s ease-out" : undefined }} />
                    </div>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, fontWeight: 900, color: hpColor, flexShrink: 0, minWidth: 36, textAlign: "right", animation: hpPulse ? "ci-alarm 0.8s infinite" : undefined }}>{hp}%</span>
                </div>
                {/* Progress dots */}
                <div style={{ display: "flex", gap: 5, marginTop: 9, alignItems: "center" }}>
                    <span style={{ fontSize: 9, color: "#2a3448", fontWeight: 700, letterSpacing: "0.08em", marginRight: 2 }}>CLUES</span>
                    {cas.questions.map((_, i) => (
                        <div key={i} style={{ width: i === qIdx ? 22 : 14, height: 6, borderRadius: 4, background: i < qIdx ? "rgba(52,211,153,0.7)" : i === qIdx ? cas.color : "rgba(255,255,255,0.08)", transition: "all 0.3s" }} />
                    ))}
                    <span style={{ marginLeft: "auto", fontSize: 10, color: "#3a4a62", fontWeight: 700 }}>{doneQs + qIdx + 1}/{totalQs}</span>
                </div>
            </div>

            {/* XP pops */}
            <div style={{ position: "relative", height: 0 }}>
                {xpPops.map(p => <div key={p.id} style={{ position: "absolute", top: -10, right: 0, fontWeight: 900, fontSize: 16, color: "#fde68a", animation: "xpPop 1.5s forwards", pointerEvents: "none", zIndex: 50 }}>+{p.amt} XP ⚡</div>)}
            </div>

            {/* Zone briefing pill */}
            <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 14, padding: "8px 14px", background: `${cas.color}0f`, border: `1px solid ${cas.color}28`, borderRadius: 10 }}>
                <span style={{ fontSize: 18 }}>{cas.badge}</span>
                <div>
                    <span style={{ fontSize: 10, fontWeight: 800, color: cas.color, letterSpacing: "0.1em" }}>{cas.subtitle}</span>
                    <span style={{ fontSize: 10, color: "#3a4a62", marginLeft: 10 }}>Question {qIdx + 1} of {cas.questions.length}</span>
                </div>
            </div>

            {/* Question card */}
            <div style={{ ...T.card, padding: "24px 26px", marginBottom: 14, border: `1px solid ${answered === false ? "rgba(239,68,68,0.45)" : answered === true ? "rgba(52,211,153,0.35)" : cas.color + "28"}`, animation: shaking ? "ci-shake 0.55s both" : "ci-popIn 0.4s both", position: "relative", overflow: "hidden", transition: "border-color 0.3s" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: `linear-gradient(90deg,${cas.color},${cas.color}44,transparent)` }} />
                {/* Scanline */}
                <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.025) 3px,rgba(0,0,0,0.025) 4px)" }} />
                <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "flex-start", position: "relative" }}>
                    <div style={{ background: `${cas.color}18`, border: `1px solid ${cas.color}40`, borderRadius: 8, padding: "3px 10px", fontSize: 10, fontWeight: 900, color: cas.color, letterSpacing: "0.1em", flexShrink: 0, marginTop: 2, fontFamily: "'JetBrains Mono',monospace" }}>CLUE·{qIdx + 1}</div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#dce8ff", lineHeight: 1.85, fontFamily: "'Sora',sans-serif" }}>{q.q}</p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 9, position: "relative" }}>
                    {q.opts.map((opt, i) => {
                        const isRight = answered !== null && i === q.ans;
                        const isWrong = answered === false && selected === i;
                        const isFirst = firstWrong === i && answered === null;
                        let bg = "rgba(124,58,237,0.07)", brd = `1px solid rgba(124,58,237,0.18)`, col = "#8b9ec7";
                        if (isRight) { bg = "rgba(52,211,153,0.12)"; brd = "1px solid rgba(52,211,153,0.5)"; col = "#34d399"; }
                        else if (isWrong) { bg = "rgba(239,68,68,0.12)"; brd = "1px solid rgba(239,68,68,0.5)"; col = "#f87171"; }
                        else if (isFirst) { bg = "rgba(239,68,68,0.06)"; brd = "1px solid rgba(239,68,68,0.28)"; col = "#f87171"; }
                        return (
                            <button key={i} onClick={() => handleSelect(i)} disabled={answered !== null || (attempts > 0 && firstWrong === i)} style={{ background: bg, border: brd, borderRadius: 10, padding: "13px 16px", color: col, fontFamily: "'Sora',sans-serif", fontSize: 13, fontWeight: 600, textAlign: "left", cursor: answered !== null || (attempts > 0 && firstWrong === i) ? "default" : "pointer", transition: "all 0.2s", display: "flex", gap: 12, alignItems: "flex-start", lineHeight: 1.55 }} onMouseEnter={e => { if (answered === null && !(attempts > 0 && firstWrong === i)) e.currentTarget.style.borderColor = `${cas.color}66`; }} onMouseLeave={e => { if (answered === null) e.currentTarget.style.borderColor = brd.split(" ").slice(2).join(" "); }}>
                                <span style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 900, flexShrink: 0, marginTop: 1, fontFamily: "'JetBrains Mono',monospace" }}>{LABELS[i]}</span>
                                <span>{opt}</span>
                                {isRight && <span style={{ marginLeft: "auto", fontSize: 16, flexShrink: 0 }}>✅</span>}
                                {(isWrong || isFirst) && <span style={{ marginLeft: "auto", fontSize: 16, flexShrink: 0 }}>❌</span>}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Answer result */}
            {answered !== null && (
                <div style={{ animation: "ci-popIn 0.35s both" }}>
                    <div style={{ display: "flex", gap: 12, padding: "14px 18px", background: answered ? "rgba(52,211,153,0.08)" : "rgba(239,68,68,0.08)", border: `1px solid ${answered ? "rgba(52,211,153,0.35)" : "rgba(239,68,68,0.35)"}`, borderRadius: 12, marginBottom: 12, alignItems: "flex-start" }}>
                        <span style={{ fontSize: 22, marginTop: 2 }}>{answered ? "🧬" : "⚠️"}</span>
                        <div>
                            <p style={{ fontWeight: 800, fontSize: 14, color: answered ? "#34d399" : "#f87171", marginBottom: 5 }}>
                                {answered ? "CLUE CRACKED! Chemical insight added to your dossier." : hp > 0 ? "Wrong deduction! Vitals drained. Check the insight below." : "VITALS CRITICAL — Game ending..."}
                            </p>
                            <p style={{ fontSize: 13, color: "#8b9ec7", lineHeight: 1.7 }}>{q.exp}</p>
                        </div>
                    </div>
                    {hp > 0 && (
                        <button onClick={nextQ} style={{ ...T.btn, width: "100%", padding: "14px", fontSize: 14, background: answered ? `linear-gradient(135deg,${cas.color},${cas.color}cc)` : "linear-gradient(135deg,#7c3aed,#4f46e5)", boxShadow: answered ? `0 0 20px ${cas.color}44` : "0 0 20px rgba(124,58,237,0.3)", fontFamily: "'Sora',sans-serif" }}>
                            {qIdx < cas.questions.length - 1 ? "Next Clue →" : levelIdx < CHEM_CASES.length - 1 ? "Advance to Next Zone →" : "Complete Mission →"}
                        </button>
                    )}
                </div>
            )}
            {answered === null && attempts === 1 && (
                <div style={{ padding: "10px 14px", background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 10, marginTop: 4 }}>
                    <p style={{ fontSize: 12, color: "#f59e0b", fontWeight: 700 }}>⚠️ Wrong deduction! One more mistake will drain your VITALS. Choose carefully.</p>
                </div>
            )}
        </div>
    );
    return null;
}

function DuelsPage() {
    const [duelTab, setDuelTab] = useState("active");
    const filtered = DUELS.filter(d => duelTab === "active" ? d.status !== "done" : d.status === "done");
    const dc = { Easy: "#34d399", Medium: "#f59e0b", Hard: "#ef4444" };
    return <div style={{ padding: "78px 28px 40px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22, animation: "fadeUp 0.4s both" }}>
            <div><h1 style={{ fontSize: 26, fontWeight: 900, color: "white", letterSpacing: "-0.025em" }}>⚔️ Duel Challenges</h1><p style={{ fontSize: 13, color: "#4b5e82", marginTop: 4 }}>Challenge friends, climb the ranks, earn bonus XP</p></div>
            <button style={{ ...T.btn, padding: "11px 22px", background: "linear-gradient(135deg,#ea580c,#c2410c)", boxShadow: "0 0 20px rgba(234,88,12,0.28)" }}>+ New Duel</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 20 }}>
            {[{ i: "⚔️", l: "Total Duels", v: "12", c: "white" }, { i: "🏆", l: "Wins", v: "8", c: "#34d399" }, { i: "❌", l: "Losses", v: "4", c: "#f87171" }, { i: "🔥", l: "Win Rate", v: "67%", c: "#fde68a" }].map((s, i) => <div key={i} style={{ ...T.card, padding: "14px", textAlign: "center" }}><p style={{ fontSize: 19, marginBottom: 5 }}>{s.i}</p><p style={{ fontSize: 20, fontWeight: 900, color: s.c }}>{s.v}</p><p style={{ fontSize: 10, color: "#2a3448", fontWeight: 700 }}>{s.l}</p></div>)}
        </div>
        <div style={{ display: "flex", gap: 3, background: "rgba(255,255,255,0.04)", padding: 4, borderRadius: 10, border: "1px solid rgba(124,58,237,0.14)", marginBottom: 16, width: "fit-content" }}>
            {["active", "history"].map(t => <button key={t} onClick={() => setDuelTab(t)} style={{ padding: "8px 22px", borderRadius: 8, border: "none", background: duelTab === t ? "linear-gradient(135deg,#7c3aed,#4f46e5)" : "transparent", color: duelTab === t ? "white" : "#3a4a62", fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 13, cursor: "pointer", transition: "all 0.2s", textTransform: "capitalize" }}>{t === "active" ? "Active" : "History"}</button>)}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            {filtered.map((d, i) => <div key={d.id} style={{ ...T.card, padding: "18px 22px", display: "flex", alignItems: "center", gap: 16, animation: `fadeUp 0.4s ${i * 0.07}s both`, border: d.status === "active" ? "1px solid rgba(251,146,60,0.35)" : d.won === true ? "1px solid rgba(52,211,153,0.28)" : d.won === false ? "1px solid rgba(239,68,68,0.22)" : "1px solid rgba(124,58,237,0.16)", background: d.status === "active" ? "rgba(120,53,15,0.12)" : "rgba(10,14,40,0.82)" }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, border: "2px solid rgba(124,58,237,0.25)", flexShrink: 0 }}>{d.av}</div>
                <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}><p style={{ fontWeight: 800, color: "white", fontSize: 15 }}>{d.opponent}</p><Pill color={dc[d.diff]}>{d.diff}</Pill>{d.status === "active" && <Pill color="#fb923c">⚡ Live</Pill>}{d.won === true && <Pill color="#34d399">🏆 Won</Pill>}{d.won === false && <Pill color="#f87171">Loss</Pill>}</div>
                    <p style={{ fontSize: 12, color: "#3a4a62" }}>{d.subject} · Rating: {d.rating}</p>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 800, color: "#fde68a", marginBottom: 4 }}>+{d.xpWin} XP</p>
                    <p style={{ fontSize: 11, color: "#2a3448", marginBottom: 8 }}>{d.timeLeft}</p>
                    {d.status !== "done" && <button style={{ ...T.btn, padding: "9px 18px", fontSize: 12, background: d.status === "active" ? "linear-gradient(135deg,#ea580c,#c2410c)" : "linear-gradient(135deg,#7c3aed,#4f46e5)" }}>{d.status === "active" ? "Continue ⚔️" : "Accept"}</button>}
                </div>
            </div>)}
        </div>
    </div>;
}

function LeaderboardPage() {
    return <div style={{ padding: "78px 28px 40px", maxWidth: 860, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 26, animation: "fadeUp 0.4s both" }}><h1 style={{ fontSize: 28, fontWeight: 900, color: "white", letterSpacing: "-0.025em" }}>🏆 Galactic Leaderboard</h1><p style={{ color: "#3a4a62", fontSize: 14, marginTop: 7 }}>Top explorers this week</p></div>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 13, marginBottom: 28 }}>
            {[BOARD[1], BOARD[0], BOARD[2]].map((u, i) => { const h = [148, 188, 118]; const m = ["🥈", "🥇", "🥉"]; return <div key={u.rank} style={{ textAlign: "center", animation: `fadeUp 0.4s ${i * 0.1}s both` }}><div style={{ fontSize: 30, marginBottom: 5 }}>{u.av}</div><p style={{ fontWeight: 800, color: "white", fontSize: 13, marginBottom: 2 }}>{u.name}</p><p style={{ fontSize: 11, color: "#fde68a", marginBottom: 7 }}>⚡ {u.xp.toLocaleString()}</p><div style={{ width: 86, height: h[i], borderRadius: "9px 9px 0 0", background: i === 1 ? "rgba(253,230,138,0.12)" : "rgba(139,92,246,0.1)", border: i === 1 ? "1px solid rgba(253,230,138,0.22)" : "1px solid rgba(139,92,246,0.14)", display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 11, fontSize: 24 }}>{m[i]}</div></div>; })}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {BOARD.map((u, i) => <div key={u.rank} style={{ ...T.card, padding: "13px 17px", display: "flex", alignItems: "center", gap: 13, border: u.isUser ? "1px solid rgba(167,139,250,0.42)" : "1px solid rgba(124,58,237,0.11)", background: u.isUser ? "rgba(124,58,237,0.11)" : "rgba(10,14,40,0.82)", animation: `fadeUp 0.35s ${i * 0.05}s both` }}>
                <span style={{ fontSize: 15, width: 27, fontWeight: 900, color: u.rank <= 3 ? "#fde68a" : "#2a3448" }}>#{u.rank}</span>
                <div style={{ width: 37, height: 37, borderRadius: "50%", background: u.isUser ? "linear-gradient(135deg,#7c3aed,#4f46e5)" : "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19, border: u.isUser ? "2px solid rgba(139,92,246,0.48)" : "2px solid rgba(255,255,255,0.06)" }}>{u.av}</div>
                <div style={{ flex: 1 }}><p style={{ fontWeight: 700, color: u.isUser ? "#c4b5fd" : "white", fontSize: 14 }}>{u.name} {u.isUser && <Pill color="#a78bfa">You</Pill>}</p><p style={{ fontSize: 11, color: "#2a3448" }}>Lv.{u.level} · 🔥 {u.streak}d streak</p></div>
                <div style={{ textAlign: "right" }}><p style={{ fontWeight: 900, color: "#fde68a", fontSize: 16 }}>⚡ {u.xp.toLocaleString()}</p><p style={{ fontSize: 10, color: "#2a3448" }}>this week</p></div>
            </div>)}
        </div>
    </div>;
}

function ProgressPage({ xp }) {
    const level = Math.floor(xp / 500) + 1; const lvlXp = xp % 500;
    const titles = ["Stargazer", "Cosmonaut", "Galaxy Scout", "Nebula Navigator", "Void Walker", "Cosmic Overlord"];
    const title = titles[Math.min(Math.floor(level / 5), titles.length - 1)];
    return <div style={{ padding: "78px 28px 40px", maxWidth: 1060, margin: "0 auto" }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: "white", marginBottom: 20, letterSpacing: "-0.025em" }}>⚡ Your Progress</h1>
        <div style={{ ...T.card, padding: "24px 32px", marginBottom: 18, background: "linear-gradient(135deg,rgba(76,29,149,0.42),rgba(10,14,40,0.9))", border: "1px solid rgba(124,58,237,0.32)", borderRadius: 20, display: "flex", gap: 30, alignItems: "center", animation: "fadeUp 0.4s both" }}>
            <div style={{ textAlign: "center", minWidth: 106 }}>
                <div style={{ width: 90, height: 90, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#4f46e5)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", margin: "0 auto 9px", border: "3px solid rgba(139,92,246,0.38)", boxShadow: "0 0 36px rgba(124,58,237,0.38)" }}><span style={{ fontSize: 11, fontWeight: 700, color: "#a78bfa" }}>LVL</span><span style={{ fontSize: 28, fontWeight: 900, color: "white", lineHeight: 1 }}>{level}</span></div>
                <p style={{ fontWeight: 800, color: "#a78bfa", fontSize: 12 }}>{title}</p>
            </div>
            <div style={{ flex: 1 }}>
                <p style={{ fontSize: 12, color: "#3a4a62", marginBottom: 5 }}>Total Experience</p>
                <p style={{ fontSize: 36, fontWeight: 900, color: "#fde68a", letterSpacing: "-0.02em", marginBottom: 12 }}>{xp.toLocaleString()} XP</p>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}><span style={{ fontSize: 11, color: "#2a3448" }}>Level {level}</span><span style={{ fontSize: 11, color: "#2a3448" }}>{lvlXp} / 500 XP</span></div>
                <Bar pct={(lvlXp / 500) * 100} h={8} />
            </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 18 }}>
            {[{ i: "📐", l: "Active Chapters", v: "3", c: "#a78bfa" }, { i: "🎯", l: "Avg Accuracy", v: "78%", c: "#34d399" }, { i: "🔥", l: "Streak", v: "7 days", c: "#fdba74" }, { i: "⚔️", l: "Duel Win Rate", v: "67%", c: "#fb923c" }].map((s, i) => <div key={i} style={{ ...T.card, padding: "14px", textAlign: "center", animation: `fadeUp 0.4s ${i * 0.08}s both` }}><div style={{ fontSize: 22, marginBottom: 7 }}>{s.i}</div><p style={{ fontSize: 18, fontWeight: 900, color: s.c, marginBottom: 3 }}>{s.v}</p><p style={{ fontSize: 10, color: "#2a3448", fontWeight: 700 }}>{s.l}</p></div>)}
        </div>
        <div style={{ ...T.card, padding: "18px 22px" }}>
            <h3 style={{ fontWeight: 800, color: "white", marginBottom: 13, fontSize: 14 }}>Achievements</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 9 }}>
                {[{ i: "🔥", n: "On Fire", d: "7 day streak", done: true }, { i: "📐", n: "Vector Vision", d: "Ace Kinematics 2D", done: false }, { i: "⚡", n: "XP Hunter", d: "Earned 5,000 XP", done: true }, { i: "⚔️", n: "Duel Master", d: "Win 10 duels", done: false }, { i: "🚀", n: "Explorer", d: "Start all 3 subjects", done: false }, { i: "💡", n: "No Hints", d: "5 Qs without hints", done: true }].map((a, i) => <div key={i} style={{ ...T.card, padding: "12px 14px", display: "flex", gap: 10, alignItems: "center", opacity: a.done ? 1 : 0.36, border: a.done ? "1px solid rgba(139,92,246,0.26)" : "1px solid rgba(255,255,255,0.04)", animation: `fadeUp 0.4s ${i * 0.06}s both` }}><div style={{ width: 36, height: 36, borderRadius: 9, background: a.done ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.03)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>{a.i}</div><div><p style={{ fontWeight: 700, fontSize: 13, color: a.done ? "white" : "#2a3448" }}>{a.n}</p><p style={{ fontSize: 11, color: "#2a3448" }}>{a.d}</p></div>{a.done && <span style={{ marginLeft: "auto", fontSize: 13 }}>✅</span>}</div>)}
            </div>
        </div>
    </div>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── NEW: OPERATION VECTORFALL ─────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

const VF_LEVELS = [
    {
        id: 1, badge: "🟢", label: "LEVEL 1", title: "THE DISAPPEARING SCIENTIST", color: "#22c55e",
        voice: `Lead Analyst, wake up. The rogue AI 'XENON' has seized the Defense Grid. Scientist Dr. Aris is trapped — you are our only link to his tracker. Every calculation is a lifeline. Don't miss.\n\nStatic fills the comms. Aris is running through Sector 7. GPS origin O (0,0). He reached Point A (6km E, 8km N) before his signal flickered. An hour later, he's at Point B (2km W, 12km N). We need the vector map before XENON wipes the logs.`,
        visualizer: "vectors",
        questions: [
            { q: "Position vector of Point A?", opts: ["6î + 8ĵ", "8î + 6ĵ", "-6î + 8ĵ", "6î - 8ĵ"], ans: 0 },
            { q: "Displacement vector from A to B?", opts: ["-8î + 4ĵ", "-4î + 4ĵ", "-8î + 12ĵ", "4î + 4ĵ"], ans: 0 },
            { q: "Magnitude of displacement O to B?", opts: ["√148", "√160", "√200", "14"], ans: 0 },
            { q: "Total path is 16 km. What does this reveal?", opts: ["Distance = Displacement", "Distance ≥ Displacement", "Displacement depends on path"], ans: 1 },
        ],
    },
    {
        id: 2, badge: "🔵", label: "LEVEL 2", title: "DRONE PURSUIT", color: "#3b82f6",
        voice: `Thermal cameras active! Aris hijacked a drone. He's at v₁=(15î+20ĵ) m/s. After 5s he's at v₂=(25î+20ĵ) m/s. But XENON just launched an Interceptor at (30î−5ĵ). Calculation required for evasive maneuvers!`,
        visualizer: "drone",
        questions: [
            { q: "Initial speed of Aris' drone?", opts: ["25 m/s", "20 m/s", "35 m/s", "30 m/s"], ans: 0 },
            { q: "Acceleration vector of the drone?", opts: ["2î m/s²", "4î m/s²", "2ĵ m/s²", "5î m/s²"], ans: 0 },
            { q: "Interceptor velocity relative to Aris?", opts: ["15î − 25ĵ", "15î + 25ĵ", "−15î − 25ĵ", "−15î + 25ĵ"], ans: 0 },
            { q: "To appear stationary to the hunter, Aris must?", opts: ["Match the Interceptor's velocity", "Reverse direction", "Reduce to zero speed"], ans: 0 },
        ],
    },
    {
        id: 3, badge: "🟡", label: "LEVEL 3", title: "THE 90-METER FALL", color: "#eab308",
        voice: `Direct hit! The drone is burning. Aris has ejected at 90m altitude with a horizontal velocity of 30 m/s. Turrets are locking onto his landing zone. Where will he hit the ground?`,
        visualizer: "fall",
        questions: [
            { q: "Time to reach the ground? (g = 10 m/s²)", opts: ["3 s", "4.24 s", "5 s", "6 s"], ans: 1 },
            { q: "Horizontal distance covered at impact?", opts: ["60 m", "90 m", "127.2 m", "150 m"], ans: 2 },
            { q: "Direction of velocity at impact?", opts: ["Purely horizontal", "Purely vertical", "At an angle below horizontal"], ans: 2 },
        ],
    },
    {
        id: 4, badge: "🟠", label: "LEVEL 4", title: "FLARE SIGNAL", color: "#f97316",
        voice: `He's down but pinned behind a ridge. He's firing a flare at 40 m/s at 45° to signal extraction. There's a XENON surveillance tower 20m high, 50m away. If the flare hits that tower — it's game over.`,
        visualizer: "flare",
        questions: [
            { q: "Maximum height of the flare?", opts: ["20 m", "40 m", "80 m", "10 m"], ans: 1 },
            { q: "Total time of flight?", opts: ["4 s", "5.6 s", "8 s", "10 s"], ans: 1 },
            { q: "Horizontal range of the flare?", opts: ["80 m", "120 m", "160 m", "200 m"], ans: 2 },
            { q: "Does the flare clear the 20m tower at 50m?", opts: ["Yes — it clears", "No — it strikes"], ans: 0 },
        ],
    },
    {
        id: 5, badge: "🔴", label: "LEVEL 5", title: "PROJECTILE ON INCLINED PLANE", color: "#ef4444",
        voice: `Extraction ship is hovering above a 30° incline. We're firing a rescue tether at 60 m/s. Physics on an incline is different — adjust the launch angle for maximum reach along the slope.`,
        visualizer: "incline",
        questions: [
            { q: "Optimal angle for maximum range on a 30° incline?", opts: ["30°", "45°", "60°", "75°"], ans: 2 },
            { q: "Why isn't the optimal angle 45°?", opts: ["Gravity effectively rotates on the incline", "The incline changes the effective horizontal axis"], ans: 1 },
        ],
    },
    {
        id: 6, badge: "🟣", label: "LEVEL 6", title: "THE ROTATING ESCAPE", color: "#a855f7",
        voice: `Aris reached the platform! It's a centrifuge escape pod, R=25m, spinning at 15 m/s. He's losing consciousness from the G-force. Check the vitals.`,
        visualizer: "centrifuge",
        questions: [
            { q: "Angular velocity of the pod?", opts: ["0.6 rad/s", "1 rad/s", "2 rad/s", "5 rad/s"], ans: 0 },
            { q: "Centripetal acceleration?", opts: ["6 m/s²", "9 m/s²", "15 m/s²", "25 m/s²"], ans: 1 },
            { q: "Direction of centripetal acceleration?", opts: ["Tangential to motion", "Outward from center", "Inward toward center"], ans: 2 },
        ],
    },
    {
        id: 7, badge: "⚫", label: "FINAL LEVEL", title: "THE BANKED ESCAPE", color: "#94a3b8",
        voice: `Final stretch! The extraction rover is hitting a banked curve (R=120m) at 24 m/s. If the physics holds, the normal force will carry us home without friction. Stay steady!`,
        visualizer: "banked",
        questions: [
            { q: "Why is no friction needed at design speed on a banked curve?", opts: ["Normal force component provides centripetal force", "Gravity disappears on banked curves"], ans: 0 },
            { q: "If speed drops below design speed, friction pulls the rover?", opts: ["Up the slope", "Down the slope", "Outward radially"], ans: 0 },
        ],
    },
];

// ── Typewriter hook ───────────────────────────────────────────────────────────
function useTypewriter(text, speed = 20) {
    const [shown, setShown] = useState("");
    const [done, setDone] = useState(false);
    useEffect(() => {
        setShown(""); setDone(false);
        if (!text) return;
        let i = 0;
        const id = setInterval(() => { i++; setShown(text.slice(0, i)); if (i >= text.length) { clearInterval(id); setDone(true); } }, speed);
        return () => clearInterval(id);
    }, [text, speed]);
    return { shown, done };
}

// ── SVG Physics Visualizers ───────────────────────────────────────────────────
function VFVisualizer({ type, color }) {
    const [tick, setTick] = useState(0);
    useEffect(() => { const id = setInterval(() => setTick(t => t + 1), 50); return () => clearInterval(id); }, []);
    const angle = (tick * 2) % 360;

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
            {/* O */}
            <circle cx="30" cy="130" r="4" fill="#7c3aed" />
            <text x="34" y="145" fill="#a78bfa" fontSize="9" fontFamily="Sora,sans-serif">O(0,0)</text>
            {/* OA */}
            <line x1="30" y1="130" x2="90" y2="50" stroke="#22c55e" strokeWidth="2" markerEnd="url(#vfah)" strokeDasharray="120" strokeDashoffset="120" style={{ animation: "vf-draw 1.2s 0.3s ease forwards", ["--len"]: "120" }} />
            <circle cx="90" cy="50" r="4" fill="#22c55e" opacity="0" style={{ animation: "fadeUp 0.3s 1.4s ease forwards" }} />
            <text x="94" y="48" fill="#22c55e" fontSize="9" fontFamily="Sora,sans-serif">A(6,8)</text>
            {/* AB */}
            <line x1="90" y1="50" x2="50" y2="10" stroke="#3b82f6" strokeWidth="2" markerEnd="url(#vfab)" strokeDasharray="90" strokeDashoffset="90" style={{ animation: "vf-draw 0.9s 1.6s ease forwards", ["--len"]: "90" }} />
            <circle cx="50" cy="10" r="4" fill="#3b82f6" opacity="0" style={{ animation: "fadeUp 0.3s 2.5s ease forwards" }} />
            <text x="54" y="12" fill="#3b82f6" fontSize="9" fontFamily="Sora,sans-serif">B(-2,12)</text>
            {/* OB displacement */}
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
                {/* Drone */}
                <g transform={`translate(${droneX},80)`}>
                    <circle cx="0" cy="0" r="7" fill="none" stroke="#3b82f6" strokeWidth="1.5" />
                    <line x1="-7" y1="-7" x2="-11" y2="-11" stroke="#3b82f6" strokeWidth="1.5" />
                    <line x1="7" y1="-7" x2="11" y2="-11" stroke="#3b82f6" strokeWidth="1.5" />
                    <line x1="-7" y1="7" x2="-11" y2="11" stroke="#3b82f6" strokeWidth="1.5" />
                    <line x1="7" y1="7" x2="11" y2="11" stroke="#3b82f6" strokeWidth="1.5" />
                    {[[-11, -11], [-11, 11], [11, -11], [11, 11]].map(([px, py], i) => <circle key={i} cx={px} cy={py} r="3" fill="#3b82f6" opacity="0.7" />)}
                </g>
                {/* Interceptor */}
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
        // Parabola as polyline
        const pts = [];
        for (let i = 0; i <= 40; i++) {
            const t = i / 40;
            const x = isFlare ? (20 + t * 180) : (20 + t * 180);
            const y = isFlare ? (130 - 100 * Math.sin(Math.PI * t)) : (20 + 120 * t * t);
            pts.push(`${x},${y}`);
        }
        const polyPts = pts.join(" ");
        return (
            <svg viewBox="0 0 220 160" width="100%" style={{ maxHeight: 170 }}>
                {gridLines}
                <line x1="10" y1="135" x2="210" y2="135" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
                {isFlare && <g><rect x="80" y="95" width="9" height="40" fill="rgba(239,68,68,0.2)" stroke="#ef4444" strokeWidth="1" /><text x="74" y="93" fill="#ef4444" fontSize="7" fontFamily="Sora,sans-serif">20m</text><text x="80" y="152" fill="#ef444488" fontSize="7" fontFamily="Sora,sans-serif">50m</text></g>}
                <polyline points={polyPts} stroke={isFlare ? "#f97316" : "#eab308"} strokeWidth="2" fill="none"
                    strokeDasharray="300" strokeDashoffset={300 - drawLen} style={{ transition: "stroke-dashoffset 0.05s" }} />
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
            <path d="M 20,140 Q 85,55 150,60" stroke="#22c55e" strokeWidth="2" fill="none" strokeDasharray="200" strokeDashoffset="200" style={{ animation: "vf-draw 1.5s 0.5s ease forwards", ["--len"]: "200" }} />
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
            {/* Orbiting pod */}
            <g style={{ animation: "vf-spin 4s linear infinite", transformOrigin: "110px 95px" }}>
                <circle cx="175" cy="95" r="9" fill="#a855f7" />
                <text x="170" y="99" fill="white" fontSize="9" fontFamily="Sora,sans-serif">A</text>
                {/* Centripetal arrow pointing inward */}
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

// ── Typewriter terminal ───────────────────────────────────────────────────────
function VFTerminal({ text }) {
    const { shown, done } = useTypewriter(text, 18);
    const [cursor, setCursor] = useState(true);
    useEffect(() => { const id = setInterval(() => setCursor(c => !c), 520); return () => clearInterval(id); }, []);
    return (
        <div style={{
            background: "rgba(0,0,0,0.55)",
            border: "1px solid rgba(124,58,237,0.22)",
            borderRadius: 10, padding: "14px 16px",
            marginBottom: 14,
            position: "relative", overflow: "hidden",
            animation: "vf-flicker 10s infinite",
        }}>
            {/* Scanline overlay */}
            <div style={{
                position: "absolute", inset: 0, pointerEvents: "none",
                background: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.06) 2px,rgba(0,0,0,0.06) 4px)",
                animation: "vf-scanline 4s linear infinite",
            }} />
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 3, color: "#7c3aed", marginBottom: 8, fontFamily: "JetBrains Mono,monospace" }}>◈ XENON OVERRIDE — SYSTEM VOICE</div>
            <p style={{ fontFamily: "JetBrains Mono,monospace", fontSize: 11, color: "rgba(220,232,255,0.82)", lineHeight: 1.85, whiteSpace: "pre-wrap", position: "relative", zIndex: 1 }}>
                {shown}{!done && <span style={{ animation: "vf-blink 1s infinite" }}>▌</span>}
            </p>
        </div>
    );
}

// ── Main OperationVectorfall component ─────────────────────────────────────────
function OperationVectorfall({ onBack, onXpEarned }) {
    const [phase, setPhase] = useState("intro"); // intro|game|victory|defeat
    const [levelIdx, setLevelIdx] = useState(0);
    const [qIdx, setQIdx] = useState(0);
    const [health, setHealth] = useState(100);
    const [selected, setSelected] = useState(null);
    const [result, setResult] = useState(null); // null|"correct"|"wrong"
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
        setSelected(idx);
        setTotalAnswered(t => t + 1);
        if (idx === question.ans) {
            setResult("correct");
            setScore(s => s + 1);
            const xp = 10;
            onXpEarned(xp);
            addPop(xp);
        } else {
            setResult("wrong");
            const newH = Math.max(0, health - 10);
            setHealth(newH);
            setShaking(true);
            setShowCrit(true);
            setTimeout(() => setShaking(false), 700);
            setTimeout(() => setShowCrit(false), 900);
            if (newH <= 0) { setTimeout(() => setPhase("defeat"), 1000); return; }
        }
        setTimeout(() => {
            setSelected(null); setResult(null);
            if (isLastQ) {
                if (isLastLevel) setPhase("victory");
                else { setLevelIdx(l => l + 1); setQIdx(0); }
            } else {
                setQIdx(q => q + 1);
            }
        }, 1200);
    }

    function restart() {
        setPhase("game"); setLevelIdx(0); setQIdx(0); setHealth(100);
        setScore(0); setTotalAnswered(0); setSelected(null); setResult(null);
    }

    // ── INTRO ──
    if (phase === "intro") return (
        <div style={{ padding: "78px 28px 40px", maxWidth: 720, margin: "0 auto", textAlign: "center", animation: "fadeUp 0.6s both" }}>
            <button onClick={onBack} style={{ ...T.ghost, fontSize: 13, marginBottom: 28, display: "block", width: "fit-content" }}>← Back to Chapter</button>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed", letterSpacing: 5, marginBottom: 14, fontFamily: "JetBrains Mono,monospace" }}>ANTHROPIC DEFENSE NET · SECTOR 7 UPLINK</div>
            <div style={{ fontSize: 12, fontFamily: "JetBrains Mono,monospace", color: "#ef4444", marginBottom: 12, letterSpacing: 3, animation: "vf-flicker 3s infinite" }}>⚠ XENON INTRUSION DETECTED ⚠</div>
            <h1 style={{
                fontSize: "clamp(28px,5vw,46px)", fontWeight: 900, lineHeight: 1.1, marginBottom: 16, letterSpacing: "-0.025em",
                background: "linear-gradient(135deg,#e2e8f0 0%,#a855f7 50%,#3b82f6 100%)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
            }}>
                OPERATION<br />VECTORFALL
            </h1>
            <p style={{ fontFamily: "JetBrains Mono,monospace", fontSize: 12, color: "rgba(220,232,255,0.6)", lineHeight: 1.9, marginBottom: 36, padding: "0 20px", whiteSpace: "pre-line" }}>
                Lead Analyst, wake up. The rogue AI 'XENON' has seized the Defense Grid.{"\n"}
                Scientist Dr. Aris is trapped. You are our only link to his tracker.{"\n"}
                Every calculation is a lifeline. <span style={{ color: "#ef4444", fontWeight: 700 }}>Don't miss.</span>
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: 28, marginBottom: 36, flexWrap: "wrap" }}>
                {[["22", "QUESTIONS"], ["7", "LEVELS"], ["100%", "INTEGRITY"]].map(([n, l]) => (
                    <div key={l}>
                        <div style={{ fontSize: 30, fontWeight: 900, color: "#a855f7" }}>{n}</div>
                        <div style={{ fontSize: 9, fontFamily: "JetBrains Mono,monospace", color: "rgba(255,255,255,0.35)", letterSpacing: 2 }}>{l}</div>
                    </div>
                ))}
            </div>
            <button onClick={() => setPhase("game")} style={{ ...T.btn, padding: "14px 52px", fontSize: 14, borderRadius: 12, boxShadow: "0 0 40px rgba(124,58,237,0.45)", letterSpacing: 2, fontFamily: "JetBrains Mono,monospace" }}
                onMouseEnter={e => e.target.style.boxShadow = "0 0 70px rgba(124,58,237,0.7)"}
                onMouseLeave={e => e.target.style.boxShadow = "0 0 40px rgba(124,58,237,0.45)"}>
                INITIATE UPLINK →
            </button>
        </div>
    );

    // ── VICTORY / DEFEAT ──
    if (phase === "victory" || phase === "defeat") return (
        <div style={{ padding: "78px 28px 40px", maxWidth: 600, margin: "0 auto", textAlign: "center", animation: "fadeUp 0.7s both" }}>
            <button onClick={onBack} style={{ ...T.ghost, fontSize: 13, marginBottom: 28, display: "block", width: "fit-content" }}>← Back to Chapter</button>
            <div style={{ fontSize: 72, marginBottom: 18 }}>{phase === "victory" ? "🛸" : "💀"}</div>
            <div style={{ fontFamily: "JetBrains Mono,monospace", fontSize: 11, color: phase === "victory" ? "#22c55e" : "#ef4444", letterSpacing: 4, marginBottom: 12 }}>
                {phase === "victory" ? "MISSION ACCOMPLISHED" : "SYSTEM COMPROMISED"}
            </div>
            <h2 style={{
                fontSize: 34, fontWeight: 900, marginBottom: 14, letterSpacing: "-0.025em",
                background: phase === "victory" ? "linear-gradient(135deg,#22c55e,#86efac)" : "linear-gradient(135deg,#ef4444,#fca5a5)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
            }}>
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
    );

    // ── GAME ──
    return (
        <div style={{ padding: "78px 28px 40px", maxWidth: 1100, margin: "0 auto" }}>
            {/* Topbar breadcrumb */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <button onClick={onBack} style={{ ...T.ghost, fontSize: 12, padding: "7px 14px" }}>← Exit Mission</button>
                <div style={{ fontFamily: "JetBrains Mono,monospace", fontSize: 10, color: "#7c3aed", letterSpacing: 3 }}>OPERATION VECTORFALL · {level.label}</div>
                <div style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{ fontFamily: "JetBrains Mono,monospace", fontSize: 10, color: "rgba(255,255,255,0.35)" }}>
                        Q {totalAnswered + 1}/{totalQ}
                    </span>
                    <span style={{ fontFamily: "JetBrains Mono,monospace", fontSize: 10, color: "#22c55e" }}>✓ {score}</span>
                </div>
            </div>

            {/* Health + level progress */}
            <div style={{ ...T.card, padding: "12px 16px", marginBottom: 14, border: "1px solid rgba(124,58,237,0.18)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontFamily: "JetBrains Mono,monospace", fontSize: 9, color: "rgba(255,255,255,0.35)", letterSpacing: 2 }}>SIMULATION INTEGRITY</span>
                    <span style={{ fontFamily: "JetBrains Mono,monospace", fontSize: 9, color: healthColor, animation: health < 40 ? "vf-healthPulse 1s infinite" : "none" }}>{health}%</span>
                </div>
                <div style={{ height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden", marginBottom: 8 }}>
                    <div style={{ height: "100%", width: `${health}%`, background: `linear-gradient(90deg,${healthColor},${healthColor}99)`, borderRadius: 99, transition: "width 0.5s ease", boxShadow: `0 0 10px ${healthColor}88` }} />
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                    {VF_LEVELS.map((l, i) => (
                        <div key={i} style={{ flex: 1, height: 3, borderRadius: 99, background: i < levelIdx ? level.color : i === levelIdx ? `${level.color}88` : "rgba(255,255,255,0.06)", transition: "all 0.3s" }} />
                    ))}
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.1fr", gap: 16, alignItems: "start" }}>
                {/* LEFT: Mission Log */}
                <div>
                    {/* Level badge */}
                    <div style={{ ...T.card, padding: "12px 16px", marginBottom: 12, display: "flex", alignItems: "center", gap: 12, border: `1px solid ${level.color}33`, background: `${level.color}08` }}>
                        <span style={{ fontSize: 22 }}>{level.badge}</span>
                        <div>
                            <div style={{ fontFamily: "JetBrains Mono,monospace", fontSize: 9, color: level.color, letterSpacing: 3, marginBottom: 2 }}>{level.label}</div>
                            <div style={{ fontWeight: 800, fontSize: 14, color: "white" }}>{level.title}</div>
                        </div>
                    </div>

                    {/* Physics Visualizer */}
                    <div style={{ ...T.card, padding: "12px 14px", marginBottom: 12, border: "1px solid rgba(124,58,237,0.14)" }}>
                        <div style={{ fontFamily: "JetBrains Mono,monospace", fontSize: 9, color: "rgba(255,255,255,0.28)", letterSpacing: 2, marginBottom: 8 }}>TACTICAL VISUALIZER</div>
                        <VFVisualizer type={level.visualizer} color={level.color} />
                    </div>

                    {/* System Voice terminal */}
                    <VFTerminal text={level.voice} />
                </div>

                {/* RIGHT: Question card */}
                <div style={{ position: "relative" }}>
                    {xpPops.map(p => (
                        <div key={p.id} style={{ position: "absolute", top: -8, right: 16, zIndex: 50, color: "#fde68a", fontWeight: 900, fontSize: 20, animation: "xpPop 1.6s ease forwards", textShadow: "0 0 16px rgba(253,230,138,0.6)", pointerEvents: "none", fontFamily: "JetBrains Mono,monospace" }}>
                            +{p.amt} XP ⚡
                        </div>
                    ))}
                    <div style={{
                        ...T.card,
                        padding: "24px",
                        border: result === "correct" ? "1px solid rgba(34,197,94,0.5)" : result === "wrong" ? "1px solid rgba(239,68,68,0.5)" : "1px solid rgba(124,58,237,0.22)",
                        transition: "border-color 0.3s",
                        animation: shaking ? "vf-wrongShake 0.7s ease" : "vf-popIn 0.4s ease",
                        position: "relative", overflow: "hidden",
                    }}>
                        {/* Scanline overlay on card */}
                        <div style={{
                            position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
                            background: "repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.04) 3px,rgba(0,0,0,0.04) 6px)",
                            animation: "vf-scanline 6s linear infinite",
                        }} />

                        {/* CRITICAL ERROR flash */}
                        {showCrit && <div style={{
                            position: "absolute", inset: 0, zIndex: 10,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            background: "rgba(239,68,68,0.08)",
                            animation: "vf-critOverlay 0.9s ease forwards",
                        }}>
                            <div style={{ fontFamily: "JetBrains Mono,monospace", fontSize: 16, color: "#ef4444", letterSpacing: 4, textShadow: "0 0 24px #ef4444", fontWeight: 900 }}>
                                ⚠ CRITICAL ERROR ⚠
                            </div>
                        </div>}

                        <div style={{ position: "relative", zIndex: 1 }}>
                            {/* Q meta */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                                <div style={{ display: "flex", gap: 6 }}>
                                    <Pill color={level.color}>{level.label}</Pill>
                                    <Pill color="#4b5e82">Q {qIdx + 1}/{level.questions.length}</Pill>
                                </div>
                                <span style={{ fontFamily: "JetBrains Mono,monospace", fontSize: 9, color: "rgba(255,255,255,0.25)" }}>MOTION IN A PLANE</span>
                            </div>

                            {/* Question text — using Sora, matching app body style */}
                            <p style={{ fontSize: 15, fontWeight: 600, color: "#dce8ff", lineHeight: 1.75, marginBottom: 20, fontFamily: "'Sora',sans-serif" }}>
                                {question.q}
                            </p>

                            {/* Options */}
                            <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 16 }}>
                                {question.opts.map((opt, i) => {
                                    let bg = "rgba(255,255,255,0.04)";
                                    let border = "1px solid rgba(124,58,237,0.18)";
                                    let color = "#c4cfe8";
                                    if (selected !== null) {
                                        if (i === question.ans) { bg = "rgba(34,197,94,0.12)"; border = "2px solid #34d399"; color = "white"; }
                                        else if (i === selected && i !== question.ans) { bg = "rgba(239,68,68,0.1)"; border = "2px solid #ef4444"; color = "#f87171"; }
                                        else { bg = "rgba(255,255,255,0.02)"; border = "1px solid rgba(255,255,255,0.05)"; color = "#3a4a62"; }
                                    }
                                    return (
                                        <button key={i} onClick={() => handleAnswer(i)} disabled={selected !== null}
                                            style={{
                                                width: "100%", textAlign: "left", padding: "12px 16px",
                                                borderRadius: 10, fontFamily: "'Sora',sans-serif", fontWeight: 600, fontSize: 14,
                                                cursor: selected !== null ? "default" : "pointer",
                                                transition: "all 0.18s", display: "flex", alignItems: "center", gap: 12,
                                                lineHeight: 1.5, background: bg, border, color,
                                            }}
                                            onMouseEnter={e => { if (selected === null) { e.currentTarget.style.borderColor = `${level.color}66`; e.currentTarget.style.background = `${level.color}12`; } }}
                                            onMouseLeave={e => { if (selected === null) { e.currentTarget.style.borderColor = "rgba(124,58,237,0.18)"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; } }}
                                        >
                                            <span style={{
                                                width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                fontSize: 11, fontWeight: 900,
                                                background: selected !== null && i === question.ans ? "#34d399" : selected !== null && i === selected && i !== question.ans ? "#ef4444" : "rgba(124,58,237,0.2)",
                                                color: selected !== null && (i === question.ans || (i === selected && i !== question.ans)) ? "white" : "#a78bfa",
                                                border: "1px solid rgba(124,58,237,0.3)",
                                                transition: "all 0.2s",
                                            }}>
                                                {selected !== null && i === question.ans ? "✓" : selected !== null && i === selected && i !== question.ans ? "✗" : OPTS[i]}
                                            </span>
                                            <span>{opt}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Result feedback */}
                            {result && (
                                <div style={{
                                    display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
                                    background: result === "correct" ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
                                    border: `1px solid ${result === "correct" ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
                                    borderRadius: 10, animation: "fadeUp 0.3s both",
                                }}>
                                    <span style={{ fontSize: 22 }}>{result === "correct" ? "🎉" : "❌"}</span>
                                    <div>
                                        <p style={{ fontWeight: 800, fontSize: 14, color: result === "correct" ? "#34d399" : "#f87171", fontFamily: "'Sora',sans-serif" }}>
                                            {result === "correct" ? "Correct! +10 XP" : "Incorrect — Integrity −10%"}
                                        </p>
                                        {result === "wrong" && <p style={{ fontSize: 11, color: "#6b7fa8", marginTop: 2, fontFamily: "'Sora',sans-serif" }}>
                                            Correct: ({OPTS[question.ans]}) {question.opts[question.ans]}
                                        </p>}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Level mini-map */}
                    <div style={{ ...T.card, padding: "12px 16px", marginTop: 10, border: "1px solid rgba(124,58,237,0.1)" }}>
                        <div style={{ fontFamily: "JetBrains Mono,monospace", fontSize: 9, color: "rgba(255,255,255,0.2)", letterSpacing: 2, marginBottom: 8 }}>MISSION PROGRESS</div>
                        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                            {VF_LEVELS.map((l, i) => (
                                <div key={i} style={{
                                    width: 30, height: 30, borderRadius: 8,
                                    background: i < levelIdx ? `${l.color}22` : i === levelIdx ? `${l.color}18` : "rgba(255,255,255,0.03)",
                                    border: `1px solid ${i <= levelIdx ? `${l.color}44` : "rgba(255,255,255,0.06)"}`,
                                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
                                    boxShadow: i === levelIdx ? `0 0 12px ${l.color}44` : "none",
                                    transition: "all 0.3s",
                                }}>
                                    {i < levelIdx ? "✓" : l.badge}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── MAIN APP (modified to add vectorfall view) ───────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
export default function App() {
    const navigate = useNavigate();

    return <>
        <style>{CSS}</style>
        <div style={{ ...T.page, width: "100%" }}>
            <Stars />
            <div style={{ position: "fixed", top: "-18%", right: "-4%", width: "50%", height: "54%", background: "radial-gradient(circle,rgba(76,29,149,0.16) 0%,transparent 65%)", pointerEvents: "none", zIndex: 0 }} />
            <div style={{ position: "relative", zIndex: 1, width: "100%" }}>
                <ChemCaseStudy
                    onXpEarned={() => { }}
                    onBack={() => navigate('/subject/chemistry/chapter/bonding')}
                />
            </div>
        </div>
    </>;
}

