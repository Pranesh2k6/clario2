import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { SpaceBackground } from '../components/SpaceBackground';
import { LayoutDashboard, Map, FileText, Swords, Calendar, BarChart3, Settings, Flame, Zap, Users, UserPlus, Gamepad2, Clock, Trophy, CheckCircle, X, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import { connectSocket, onMatchFound } from '../api/socket';
import { ProfileDropdown } from '../components/ProfileDropdown';
const clarioLogo = '';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Map, label: 'Galaxy Map', path: '/galaxy' },
  { icon: FileText, label: 'Mock Tests', path: '/tests' },
  { icon: Swords, label: 'Duels', path: '/duels' },
  { icon: Calendar, label: 'Study Planner', path: '/planner' },
  { icon: BarChart3, label: 'Analytics', path: '/analytics' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export default function Duels() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [friendCode, setFriendCode] = useState('');
  const [challengeUserId, setChallengeUserId] = useState('');
  const [activeMode, setActiveMode] = useState(null);

  // Data states
  const [pendingChallenges, setPendingChallenges] = useState([]);
  const [activity, setActivity] = useState({ totalDuels: 0, winRate: 0, rank: 0 });
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [loading, setLoading] = useState({ random: false, ai: false, friend: false });
  const [matchmakingStatus, setMatchmakingStatus] = useState(null);
  const pollingRef = useRef(null);

  // Fetch data on mount + live polling for pending challenges
  useEffect(() => {
    const fetchPending = () => client.get('/duels/pending').then(r => setPendingChallenges(r.data.duels)).catch(() => { });
    fetchPending();
    client.get('/duels/recent-activity').then(r => setActivity(r.data)).catch(() => { });
    client.get('/duels/subjects/list').then(r => setSubjects(r.data.subjects)).catch(() => { });

    // Poll pending challenges every 10 seconds
    const interval = setInterval(fetchPending, 10000);
    return () => clearInterval(interval);
  }, []);

  // ── Socket.io: Listen for match_found from the server ─────────────────────
  // This is the FIX for the one-sided match bug. When the SERVER creates a duel
  // (because the other player's request triggered the match), this listener
  // catches it and immediately navigates — no more relying solely on polling.
  useEffect(() => {
    const socket = connectSocket();
    const cleanup = onMatchFound((data) => {
      // Clear the polling interval immediately
      if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
      setMatchmakingStatus(null);
      setLoading(l => ({ ...l, random: false }));
      navigate('/duels/match', { state: { duelId: data.duelId } });
    });
    return () => cleanup();
  }, []);

  // Toggle subject selection
  const toggleSubject = (id) => {
    setSelectedSubjects(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  // ── Random Match ──────────────────────────────────────────────────────────
  const handleRandomMatch = async () => {
    setLoading(l => ({ ...l, random: true }));
    setMatchmakingStatus('searching');
    try {
      const res = await client.post('/duels/random-match', { subjectIds: selectedSubjects });
      if (res.data.matched) {
        navigate(`/duels/match`, { state: { duelId: res.data.duel.id } });
      } else {
        setMatchmakingStatus('waiting');
        // Poll every 3 seconds (backup — the socket listener is the primary)
        const interval = setInterval(async () => {
          try {
            const r = await client.post('/duels/random-match', { subjectIds: selectedSubjects });
            if (r.data.matched) {
              clearInterval(interval);
              pollingRef.current = null;
              navigate(`/duels/match`, { state: { duelId: r.data.duel.id } });
            }
          } catch { clearInterval(interval); pollingRef.current = null; setMatchmakingStatus(null); }
        }, 3000);
        pollingRef.current = interval;
        // Timeout after 30 seconds
        setTimeout(() => { clearInterval(interval); pollingRef.current = null; setMatchmakingStatus(null); setLoading(l => ({ ...l, random: false })); }, 30000);
        return;
      }
    } catch (err) {
      console.error('Random match error:', err);
      setMatchmakingStatus(null);
    }
    setLoading(l => ({ ...l, random: false }));
  };

  // ── Friend Duel (Join by Code) ────────────────────────────────────────────
  const handleJoinDuel = async () => {
    if (!friendCode.trim()) return;
    setLoading(l => ({ ...l, friend: true }));
    try {
      const res = await client.post('/duels/join', { duelCode: friendCode.trim() });
      navigate(`/duels/match`, { state: { duelId: res.data.duel.id } });
    } catch (err) {
      alert(err.response?.data?.error || 'Could not join duel. Check the code.');
    }
    setLoading(l => ({ ...l, friend: false }));
  };

  // ── Send Challenge by User ID ──────────────────────────────────────────────
  const handleSendChallenge = async () => {
    if (!challengeUserId.trim()) return;
    setLoading(l => ({ ...l, friend: true }));
    try {
      await client.post('/duels/request', {
        targetUserId: challengeUserId.trim(),
        subjectIds: selectedSubjects,
      });
      alert('Challenge sent! They will see it in their Pending Challenges.');
      setChallengeUserId('');
      // Refresh pending list
      client.get('/duels/pending').then(r => setPendingChallenges(r.data.duels)).catch(() => { });
    } catch (err) {
      alert(err.response?.data?.error || 'Could not send challenge.');
    }
    setLoading(l => ({ ...l, friend: false }));
  };

  // ── AI Match ──────────────────────────────────────────────────────────────
  const handleAiMatch = async () => {
    setLoading(l => ({ ...l, ai: true }));
    try {
      const res = await client.post('/duels/ai-match', { subjectIds: selectedSubjects });
      navigate(`/duels/match`, { state: { duelId: res.data.duel.id } });
    } catch (err) {
      console.error('AI match error:', err);
    }
    setLoading(l => ({ ...l, ai: false }));
  };

  // ── Accept / Decline ──────────────────────────────────────────────────────
  const handleAccept = async (duelId) => {
    try {
      await client.post(`/duels/${duelId}/accept`);
      navigate(`/duels/match`, { state: { duelId } });
    } catch (err) {
      console.error('Accept error:', err);
    }
  };

  const handleDecline = async (duelId) => {
    try {
      await client.post(`/duels/${duelId}/decline`);
      setPendingChallenges(prev => prev.filter(d => d.id !== duelId));
    } catch (err) {
      console.error('Decline error:', err);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Space Background */}
      <SpaceBackground />

      {/* Background Streaks - Energetic */}
      <div className="absolute inset-0 z-[5] pointer-events-none overflow-hidden">
        <motion.div
          className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-[#8B5CF6]/10 rounded-full blur-[120px]"
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#EC4899]/8 rounded-full blur-[120px]"
          animate={{
            x: [0, -40, 0],
            y: [0, -50, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Main Layout */}
      <div className="relative z-10 flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col w-[260px] bg-[rgba(8,5,24,0.85)] backdrop-blur-xl border-r border-white/8">
          {/* Logo */}
          <div className="p-6 border-b border-white/8">
            <img
              src={clarioLogo}
              alt="Clario"
              className="h-[64px] w-auto"
            />
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.path === '/duels';
              const isImplemented = ['/dashboard', '/galaxy', '/duels'].includes(item.path);

              return (
                <button
                  key={item.path}
                  onClick={() => isImplemented && navigate(item.path)}
                  disabled={!isImplemented}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-xl
                    text-[14px] font-medium transition-all duration-200
                    relative
                    ${isActive
                      ? 'bg-white/8 text-[#F3F4F6]'
                      : isImplemented
                        ? 'text-[#9CA3AF] hover:bg-white/5 hover:text-[#D1D5DB] cursor-pointer'
                        : 'text-[#9CA3AF]/40 cursor-not-allowed'
                    }
                  `}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute inset-0 bg-gradient-to-r from-[#8B5CF6]/20 to-[#EC4899]/20 rounded-xl border border-[#8B5CF6]/30"
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col">
          {/* Top Bar */}
          <header className="flex items-center justify-between px-6 lg:px-8 py-5 border-b border-white/8 bg-[rgba(12,8,36,0.5)] backdrop-blur-sm">
            {/* Left - Title */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#EC4899]/20 rounded-lg">
                <Swords size={24} className="text-[#EC4899]" />
              </div>
              <div>
                <h2 className="text-[16px] font-bold text-[#F3F4F6]">Duels Arena</h2>
                <p className="text-[12px] text-[#9CA3AF]">Competitive Mode</p>
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-4">
              {/* XP */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
                <Zap size={16} className="text-[#FBBF24]" />
                <span className="text-[13px] font-semibold text-[#F3F4F6]">1,250 XP</span>
              </div>

              {/* Streak */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
                <Flame size={16} className="text-[#F97316]" />
                <span className="text-[13px] font-semibold text-[#F3F4F6]">7 days</span>
              </div>

              {/* Profile Avatar */}
              <ProfileDropdown />
            </div>
          </header>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 lg:p-8">
              <div className="max-w-7xl mx-auto">
                {/* Arena Header */}
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center mb-8 relative"
                >
                  {/* Atmospheric Glow */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-gradient-to-b from-[#8B5CF6]/20 via-[#EC4899]/10 to-transparent rounded-full blur-[100px] -z-10" />

                  <h1 className="text-[40px] font-bold text-[#F3F4F6] mb-3">
                    Enter the Duel Arena
                  </h1>
                  <p className="text-[16px] text-[#9CA3AF] max-w-2xl mx-auto">
                    Choose how you want to battle.
                  </p>
                </motion.div>

                {/* Subject Selection */}
                {subjects.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                  >
                    <h3 className="text-[13px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-3 text-center">
                      Select Subjects (optional)
                    </h3>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      {subjects.map(s => (
                        <button
                          key={s.id}
                          onClick={() => toggleSubject(s.id)}
                          className={`
                            px-4 py-2 rounded-xl text-[13px] font-medium transition-all duration-200 border
                            ${selectedSubjects.includes(s.id)
                              ? 'bg-[#8B5CF6]/20 border-[#8B5CF6]/50 text-[#F3F4F6]'
                              : 'bg-white/5 border-white/10 text-[#9CA3AF] hover:border-white/20'
                            }
                          `}
                        >
                          {s.title}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Mode Selection Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
                  {/* MODE 1 - Random Opponent */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    onHoverStart={() => setActiveMode('random')}
                    onHoverEnd={() => setActiveMode(null)}
                    className="relative bg-[rgba(12,8,36,0.7)] backdrop-blur-xl rounded-2xl border border-white/12 p-8 overflow-hidden group cursor-pointer"
                    onClick={handleRandomMatch}
                  >
                    {/* Electric Streak Accent */}
                    <motion.div
                      className="absolute top-0 right-0 w-[200px] h-[200px] bg-gradient-to-bl from-[#10B981]/20 to-transparent rounded-full blur-[60px]"
                      animate={{
                        opacity: activeMode === 'random' ? 1 : 0.3,
                        scale: activeMode === 'random' ? 1.2 : 1,
                      }}
                      transition={{ duration: 0.3 }}
                    />

                    {/* Border Glow */}
                    <motion.div
                      className="absolute inset-0 rounded-2xl border-2 border-[#10B981]/40 opacity-0 group-hover:opacity-100"
                      animate={{
                        boxShadow: activeMode === 'random'
                          ? '0 0 30px rgba(16, 185, 129, 0.4)'
                          : '0 0 0px rgba(16, 185, 129, 0)',
                      }}
                      transition={{ duration: 0.3 }}
                    />

                    {/* Instant Match Tag */}
                    <div className="absolute top-4 right-4 px-3 py-1.5 bg-[#10B981]/20 border border-[#10B981]/40 rounded-lg">
                      <span className="text-[11px] font-bold text-[#10B981] uppercase tracking-wider">
                        Instant Match
                      </span>
                    </div>

                    {/* Icon */}
                    <div className="flex items-center justify-center w-16 h-16 mb-6 rounded-2xl bg-[#10B981]/20 border border-[#10B981]/30">
                      <Users size={32} className="text-[#10B981]" />
                    </div>

                    {/* Content */}
                    <h3 className="text-[24px] font-bold text-[#F3F4F6] mb-3">
                      Random Duel
                    </h3>
                    <p className="text-[14px] text-[#9CA3AF] mb-6 leading-relaxed">
                      Match instantly with a player at your level.
                    </p>

                    {/* Button */}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      disabled={loading.random}
                      className="w-full py-3 bg-[#10B981] text-white rounded-xl font-semibold text-[14px] shadow-[0_4px_16px_rgba(16,185,129,0.3)] hover:shadow-[0_6px_24px_rgba(16,185,129,0.4)] transition-all disabled:opacity-60"
                    >
                      {matchmakingStatus === 'waiting' ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader size={16} className="animate-spin" /> Searching...
                        </span>
                      ) : 'Find Match'}
                    </motion.button>
                  </motion.div>

                  {/* MODE 2 - Friend Duel */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    whileHover={{ scale: 1.02 }}
                    onHoverStart={() => setActiveMode('friend')}
                    onHoverEnd={() => setActiveMode(null)}
                    className="relative bg-[rgba(12,8,36,0.7)] backdrop-blur-xl rounded-2xl border border-white/12 p-8 overflow-hidden group"
                  >
                    {/* Calmer Glow */}
                    <motion.div
                      className="absolute top-0 right-0 w-[200px] h-[200px] bg-gradient-to-bl from-[#6366F1]/20 to-transparent rounded-full blur-[60px] pointer-events-none"
                      animate={{
                        opacity: activeMode === 'friend' ? 1 : 0.3,
                        scale: activeMode === 'friend' ? 1.2 : 1,
                      }}
                      transition={{ duration: 0.3 }}
                    />

                    {/* Border Glow */}
                    <motion.div
                      className="absolute inset-0 rounded-2xl border-2 border-[#6366F1]/40 opacity-0 group-hover:opacity-100 pointer-events-none"
                      animate={{
                        boxShadow: activeMode === 'friend'
                          ? '0 0 30px rgba(99, 102, 241, 0.4)'
                          : '0 0 0px rgba(99, 102, 241, 0)',
                      }}
                      transition={{ duration: 0.3 }}
                    />

                    {/* Icon */}
                    <div className="relative z-10">
                      <div className="flex items-center justify-center w-16 h-16 mb-6 rounded-2xl bg-[#6366F1]/20 border border-[#6366F1]/30">
                        <UserPlus size={32} className="text-[#6366F1]" />
                      </div>

                      {/* Content */}
                      <h3 className="text-[24px] font-bold text-[#F3F4F6] mb-3">
                        Duel a Friend
                      </h3>
                      <p className="text-[14px] text-[#9CA3AF] mb-6 leading-relaxed">
                        Join by code or challenge by User ID.
                      </p>

                      {/* Join by Code */}
                      <div className="space-y-3 mb-4">
                        <input
                          type="text"
                          value={friendCode}
                          onChange={(e) => setFriendCode(e.target.value.toUpperCase())}
                          placeholder="Enter duel code"
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-[14px] text-[#F3F4F6] placeholder:text-[#6B7280] focus:outline-none focus:border-[#6366F1]/50 focus:bg-white/8 transition-all uppercase tracking-widest text-center"
                        />
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleJoinDuel}
                          disabled={loading.friend || !friendCode.trim()}
                          className="w-full py-3 bg-[#6366F1] text-white rounded-xl font-semibold text-[14px] shadow-[0_4px_16px_rgba(99,102,241,0.3)] hover:shadow-[0_6px_24px_rgba(99,102,241,0.4)] transition-all disabled:opacity-60"
                        >
                          {loading.friend ? <Loader size={16} className="animate-spin mx-auto" /> : 'Join Duel'}
                        </motion.button>
                      </div>

                      {/* OR divider */}
                      <div className="flex items-center gap-3 my-4">
                        <div className="flex-1 h-px bg-white/10" />
                        <span className="text-[12px] font-semibold text-[#6B7280] uppercase">or</span>
                        <div className="flex-1 h-px bg-white/10" />
                      </div>

                      {/* Send Challenge by User ID */}
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={challengeUserId}
                          onChange={(e) => setChallengeUserId(e.target.value)}
                          placeholder="Paste opponent's User ID"
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-[14px] text-[#F3F4F6] placeholder:text-[#6B7280] focus:outline-none focus:border-[#EC4899]/50 focus:bg-white/8 transition-all font-mono text-center"
                        />
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleSendChallenge}
                          disabled={loading.friend || !challengeUserId.trim()}
                          className="w-full py-3 bg-[#EC4899] text-white rounded-xl font-semibold text-[14px] shadow-[0_4px_16px_rgba(236,72,153,0.3)] hover:shadow-[0_6px_24px_rgba(236,72,153,0.4)] transition-all disabled:opacity-60"
                        >
                          {loading.friend ? <Loader size={16} className="animate-spin mx-auto" /> : 'Send Challenge'}
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>

                  {/* MODE 3 - Pending Challenges */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    whileHover={{ scale: 1.02 }}
                    onHoverStart={() => setActiveMode('pending')}
                    onHoverEnd={() => setActiveMode(null)}
                    className="relative bg-[rgba(12,8,36,0.7)] backdrop-blur-xl rounded-2xl border border-white/12 p-8 overflow-hidden group"
                  >
                    {/* Notification Glow */}
                    <motion.div
                      className="absolute top-0 right-0 w-[200px] h-[200px] bg-gradient-to-bl from-[#FBBF24]/20 to-transparent rounded-full blur-[60px] pointer-events-none"
                      animate={{
                        opacity: activeMode === 'pending' ? 1 : 0.3,
                        scale: activeMode === 'pending' ? 1.2 : 1,
                      }}
                      transition={{ duration: 0.3 }}
                    />

                    {/* Pulse Indicator */}
                    {pendingChallenges.length > 0 && (
                      <motion.div
                        className="absolute top-4 right-4 w-3 h-3 bg-[#FBBF24] rounded-full"
                        animate={{
                          scale: [1, 1.3, 1],
                          opacity: [1, 0.7, 1],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                        }}
                      />
                    )}

                    {/* Border Glow */}
                    <motion.div
                      className="absolute inset-0 rounded-2xl border-2 border-[#FBBF24]/40 opacity-0 group-hover:opacity-100 pointer-events-none"
                      animate={{
                        boxShadow: activeMode === 'pending'
                          ? '0 0 30px rgba(251, 191, 36, 0.4)'
                          : '0 0 0px rgba(251, 191, 36, 0)',
                      }}
                      transition={{ duration: 0.3 }}
                    />

                    {/* Icon */}
                    <div className="relative z-10">
                      <div className="flex items-center justify-center w-16 h-16 mb-6 rounded-2xl bg-[#FBBF24]/20 border border-[#FBBF24]/30">
                        <Trophy size={32} className="text-[#FBBF24]" />
                      </div>

                      {/* Content */}
                      <h3 className="text-[24px] font-bold text-[#F3F4F6] mb-3">
                        Pending Challenges
                      </h3>
                      <p className="text-[14px] text-[#9CA3AF] mb-6 leading-relaxed">
                        {pendingChallenges.length > 0
                          ? `You have ${pendingChallenges.length} pending challenge${pendingChallenges.length > 1 ? 's' : ''}.`
                          : 'No pending challenges right now.'}
                      </p>

                      {/* Request List */}
                      <div className="space-y-3 max-h-[200px] overflow-y-auto">
                        {pendingChallenges.map((challenge) => (
                          <div
                            key={challenge.id}
                            className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className="w-10 h-10 rounded-full border-2 border-white/20 bg-gradient-to-br from-[#8B5CF6] to-[#6366F1]"
                              />
                              <div>
                                <p className="text-[13px] font-semibold text-[#F3F4F6]">
                                  {challenge.challenger_name || 'Unknown'}
                                </p>
                                <p className="text-[11px] text-[#9CA3AF]">
                                  {challenge.challenger_xp || 0} XP
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleAccept(challenge.id)}
                                className="p-2 bg-[#10B981]/20 border border-[#10B981]/40 rounded-lg hover:bg-[#10B981]/30 transition-colors"
                              >
                                <CheckCircle size={16} className="text-[#10B981]" />
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleDecline(challenge.id)}
                                className="p-2 bg-[#EF4444]/20 border border-[#EF4444]/40 rounded-lg hover:bg-[#EF4444]/30 transition-colors"
                              >
                                <X size={16} className="text-[#EF4444]" />
                              </motion.button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>

                  {/* MODE 4 - AI Duel */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    whileHover={{ scale: 1.02 }}
                    onHoverStart={() => setActiveMode('ai')}
                    onHoverEnd={() => setActiveMode(null)}
                    className="relative bg-[rgba(12,8,36,0.7)] backdrop-blur-xl rounded-2xl border border-white/12 p-8 overflow-hidden group cursor-pointer"
                    onClick={handleAiMatch}
                  >
                    {/* Tech Pattern */}
                    <div className="absolute inset-0 opacity-5">
                      <div className="absolute inset-0" style={{
                        backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(255, 255, 255, .05) 25%, rgba(255, 255, 255, .05) 26%, transparent 27%, transparent 74%, rgba(255, 255, 255, .05) 75%, rgba(255, 255, 255, .05) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(255, 255, 255, .05) 25%, rgba(255, 255, 255, .05) 26%, transparent 27%, transparent 74%, rgba(255, 255, 255, .05) 75%, rgba(255, 255, 255, .05) 76%, transparent 77%, transparent)',
                        backgroundSize: '20px 20px'
                      }} />
                    </div>

                    {/* Darker Glow */}
                    <motion.div
                      className="absolute top-0 right-0 w-[200px] h-[200px] bg-gradient-to-bl from-[#8B5CF6]/20 to-transparent rounded-full blur-[60px]"
                      animate={{
                        opacity: activeMode === 'ai' ? 1 : 0.3,
                        scale: activeMode === 'ai' ? 1.2 : 1,
                      }}
                      transition={{ duration: 0.3 }}
                    />

                    {/* Border Glow */}
                    <motion.div
                      className="absolute inset-0 rounded-2xl border-2 border-[#8B5CF6]/40 opacity-0 group-hover:opacity-100"
                      animate={{
                        boxShadow: activeMode === 'ai'
                          ? '0 0 30px rgba(139, 92, 246, 0.4)'
                          : '0 0 0px rgba(139, 92, 246, 0)',
                      }}
                      transition={{ duration: 0.3 }}
                    />

                    {/* AI Badge */}
                    <div className="absolute top-4 right-4 px-3 py-1.5 bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 rounded-lg">
                      <span className="text-[11px] font-bold text-[#8B5CF6] uppercase tracking-wider">
                        AI Powered
                      </span>
                    </div>

                    {/* Icon */}
                    <div className="flex items-center justify-center w-16 h-16 mb-6 rounded-2xl bg-[#8B5CF6]/20 border border-[#8B5CF6]/30">
                      <Gamepad2 size={32} className="text-[#8B5CF6]" />
                    </div>

                    {/* Content */}
                    <h3 className="text-[24px] font-bold text-[#F3F4F6] mb-3">
                      Battle AI
                    </h3>
                    <p className="text-[14px] text-[#9CA3AF] mb-6 leading-relaxed">
                      Train against an intelligent opponent.
                    </p>

                    {/* Button */}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      disabled={loading.ai}
                      className="w-full py-3 bg-[#8B5CF6] text-white rounded-xl font-semibold text-[14px] shadow-[0_4px_16px_rgba(139,92,246,0.3)] hover:shadow-[0_6px_24px_rgba(139,92,246,0.4)] transition-all disabled:opacity-60"
                    >
                      {loading.ai ? <Loader size={16} className="animate-spin mx-auto" /> : 'Start AI Duel'}
                    </motion.button>
                  </motion.div>
                </div>

                {/* Activity Panel */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-[rgba(12,8,36,0.7)] backdrop-blur-xl rounded-2xl border border-white/12 p-6"
                >
                  <h3 className="text-[18px] font-bold text-[#F3F4F6] mb-4">Recent Activity</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                      <p className="text-[12px] text-[#9CA3AF] mb-1">Total Duels</p>
                      <p className="text-[24px] font-bold text-[#F3F4F6]">{activity.totalDuels}</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                      <p className="text-[12px] text-[#9CA3AF] mb-1">Win Rate</p>
                      <p className="text-[24px] font-bold text-[#10B981]">{activity.winRate}%</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                      <p className="text-[12px] text-[#9CA3AF] mb-1">Ranking</p>
                      <p className="text-[24px] font-bold text-[#FBBF24]">#{activity.rank}</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
