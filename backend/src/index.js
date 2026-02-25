'use strict';

require('dotenv').config();

const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server: SocketIOServer } = require('socket.io');

// Route handlers
const authRoutes = require('./routes/auth');
const duelsRoutes = require('./routes/duels');

// ─── App & HTTP Server Setup ──────────────────────────────────────────────────
const app = express();
const httpServer = http.createServer(app);

// ─── Socket.io Setup (for Real-time Duel Streaming) ──────────────────────────
const io = new SocketIOServer(httpServer, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        methods: ['GET', 'POST'],
    },
});

// Make `io` accessible inside route handlers via req.app.get('io')
app.set('io', io);

// ─── Global Middleware ────────────────────────────────────────────────────────
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
}));
app.use(express.json());

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Serve Dataset Images ─────────────────────────────────────────────────────
const path = require('path');
app.use('/dataset', express.static(path.join(__dirname, '../../dataset')));

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', authRoutes);   // GET /api/v1/users/me is on the auth router
app.use('/api/v1/duels', duelsRoutes);

// ─── WebSocket: Duel Real-time Room Management ────────────────────────────────
//
// Flow:
//  1. Frontend connects to the Socket.io server.
//  2. Frontend emits 'duel:join' with { duelId } to enter a specific duel room.
//  3. When a player submits an answer, the REST route emits to the room.
//  4. Both players receive 'duel:answer_submitted' events in real time.
//
io.on('connection', (socket) => {
    console.log(`[WS] Client connected: ${socket.id}`);

    // Join a duel room — both players call this after a duel is accepted.
    socket.on('duel:join', ({ duelId }) => {
        if (!duelId) return;
        socket.join(duelId);
        console.log(`[WS] ${socket.id} joined duel room: ${duelId}`);
        socket.to(duelId).emit('duel:opponent_joined', { socketId: socket.id });
    });

    // Player leaves a room (e.g. on disconnect or duel end).
    socket.on('duel:leave', ({ duelId }) => {
        socket.leave(duelId);
        console.log(`[WS] ${socket.id} left duel room: ${duelId}`);
    });

    socket.on('disconnect', () => {
        console.log(`[WS] Client disconnected: ${socket.id}`);
    });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error('[Server Error]', err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
    console.log(`✅ Clario backend running at http://localhost:${PORT}`);
    console.log(`   Socket.io listening for real-time duel connections`);
});
