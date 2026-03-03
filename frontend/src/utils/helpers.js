export function calcDebt(hintsUsed, attempts, timeTaken, expectedTime) {
    let d = 0;
    if (hintsUsed >= 1) d += 0.15;
    if (hintsUsed >= 2) d += 0.15;
    if (hintsUsed >= 3) d += 0.20;
    if (attempts >= 2) d += 0.20;
    if (timeTaken > expectedTime) d += 0.10;
    return Math.min(d, 1);
}

export function nextDiff(cur, correct, hintsUsed) {
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
