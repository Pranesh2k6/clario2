import { io } from "socket.io-client";

// Connect to the backend Socket.io server
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";

let socket = null;

export function getSocket() {
    if (!socket) {
        socket = io(SOCKET_URL, {
            autoConnect: false,
            transports: ["websocket", "polling"],
        });
    }
    return socket;
}

export function connectSocket() {
    const s = getSocket();
    if (!s.connected) s.connect();
    return s;
}

export function disconnectSocket() {
    if (socket && socket.connected) {
        socket.disconnect();
    }
}

// Duel-specific helpers
export function joinDuelRoom(duelId) {
    const s = getSocket();
    s.emit("duel:join", { duelId });
}

export function leaveDuelRoom(duelId) {
    const s = getSocket();
    s.emit("duel:leave", { duelId });
}

export function onDuelAccepted(cb) {
    const s = getSocket();
    s.on("duel:accepted", cb);
    return () => s.off("duel:accepted", cb);
}

export function onOpponentJoined(cb) {
    const s = getSocket();
    s.on("duel:opponent_joined", cb);
    return () => s.off("duel:opponent_joined", cb);
}

export function onAnswerSubmitted(cb) {
    const s = getSocket();
    s.on("duel:answer_submitted", cb);
    return () => s.off("duel:answer_submitted", cb);
}

export function onMatchFound(cb) {
    const s = getSocket();
    s.on("duel:match_found", cb);
    return () => s.off("duel:match_found", cb);
}

export function onOpponentForfeited(cb) {
    const s = getSocket();
    s.on("duel:opponent_forfeited", cb);
    return () => s.off("duel:opponent_forfeited", cb);
}

export function onDuelCompleted(cb) {
    const s = getSocket();
    s.on("duel:completed", cb);
    return () => s.off("duel:completed", cb);
}

export function onPlayerFinished(cb) {
    const s = getSocket();
    s.on("duel:player_finished", cb);
    return () => s.off("duel:player_finished", cb);
}
