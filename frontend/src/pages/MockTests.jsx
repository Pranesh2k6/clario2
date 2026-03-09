import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { SpaceBackground } from '../components/SpaceBackground';
import {
  LayoutDashboard,
  Map,
  FileText,
  Swords,
  Calendar,
  BarChart3,
  Settings,
  Clock,
  BookOpen,
  Award,
  Play,
  Edit2,
  Trash2,
  Plus,
  Minus
} from 'lucide-react';
const clarioLogo = '/clario-logo.png';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Map, label: 'Galaxy Map', path: '/galaxy' },
  { icon: FileText, label: 'Mock Tests', path: '/tests' },
  { icon: Swords, label: 'Duels', path: '/duels' },
  { icon: Calendar, label: 'Study Planner', path: '/planner' },
  { icon: BarChart3, label: 'Analytics', path: '/analytics' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

// Mock data for generated tests
const initialGeneratedTests = [
  {
    id: 1,
    title: 'Physics + Math Mock',
    subjects: ['Physics', 'Mathematics'],
    questions: 40,
    duration: '1 Hour',
    difficulty: 'Mixed',
  },
  {
    id: 2,
    title: 'JEE Full Mock Test 1',
    subjects: ['Physics', 'Chemistry', 'Mathematics'],
    questions: 90,
    duration: '3 Hours',
    difficulty: 'Hard',
  },
];

const pastAttempts = [
  {
    id: 1,
    name: 'Physics Full Mock 1',
    date: 'Feb 20, 2026',
    score: 64,
    total: 75,
    accuracy: '85%',
    timeTaken: '2h 45m',
  },
  {
    id: 2,
    name: 'JEE Main Full Mock 1',
    date: 'Feb 18, 2026',
    score: 72,
    total: 90,
    accuracy: '80%',
    timeTaken: '2h 50m',
  },
  {
    id: 3,
    name: 'Chemistry Sectional',
    date: 'Feb 15, 2026',
    score: 35,
    total: 40,
    accuracy: '88%',
    timeTaken: '1h 20m',
  },
];

export default function MockTests() {
  const navigate = useNavigate();

  // Test configuration state
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [numQuestions, setNumQuestions] = useState(40);
  const [timeLimit, setTimeLimit] = useState('1 hour');
  const [difficulty, setDifficulty] = useState('Mixed');
  const [questionSource, setQuestionSource] = useState('Mixed');
  const [examSimMode, setExamSimMode] = useState(false);
  const [generatedTests, setGeneratedTests] = useState(initialGeneratedTests);

  // Subject question distribution
  const [physicsQuestions, setPhysicsQuestions] = useState(20);
  const [mathQuestions, setMathQuestions] = useState(15);
  const [chemistryQuestions, setChemistryQuestions] = useState(15);

  const handleNavigation = (path) => {
    const isImplemented = ['/dashboard', '/galaxy', '/duels', '/planner', '/tests', '/analytics', '/settings'].includes(path);
    if (isImplemented) {
      navigate(path);
    }
  };

  const toggleSubject = (subject) => {
    setSelectedSubjects(prev =>
      prev.includes(subject)
        ? prev.filter(s => s !== subject)
        : [...prev, subject]
    );
  };

  const handleGenerateTest = () => {
    const newTest = {
      id: generatedTests.length + 1,
      title: `Custom Mock ${generatedTests.length + 1}`,
      subjects: selectedSubjects,
      questions: numQuestions,
      duration: timeLimit,
      difficulty,
    };
    setGeneratedTests([...generatedTests, newTest]);
  };

  const handleDeleteTest = (id) => {
    setGeneratedTests(generatedTests.filter(test => test.id !== id));
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Space Background */}
      <SpaceBackground />

      {/* Main Layout */}
      <div className="relative z-10 flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col w-[260px] bg-[rgba(8,5,24,0.85)] backdrop-blur-xl border-r border-white/8">
          {/* Logo */}
          <div className="w-[259px] h-[78.5px] border-b border-white/8 flex items-center justify-center">
            <img
              src={clarioLogo}
              alt="Clario"
              className="w-[160px] h-[57.6px] object-contain"
            />
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.path === '/tests';
              const isImplemented = ['/dashboard', '/galaxy', '/duels', '/planner', '/tests', '/analytics', '/settings'].includes(item.path);

              return (
                <button
                  key={item.path}
                  onClick={() => handleNavigation(item.path)}
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
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-8 bg-[#7C3AED] rounded-r-full shadow-[0_0_12px_rgba(124,58,237,0.6)]" />
                  )}
                  <Icon size={20} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col">
          {/* Top Bar */}
          <header className="px-6 lg:px-8 py-6 border-b border-white/8 bg-[rgba(12,8,36,0.5)] backdrop-blur-sm">
            <h2 className="text-[24px] font-bold text-[#F3F4F6] mb-2">
              Mock Test Center
            </h2>
            <p className="text-[13px] text-[#9CA3AF] mb-2">
              Simulate real exam conditions and evaluate your readiness.
            </p>
            <p className="text-[11px] text-[#6B7280]">
              Mock tests replicate real exam pressure and measure performance across accuracy, time management, and difficulty handling.
            </p>
          </header>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6 lg:p-8">
            <div className="max-w-[1400px] mx-auto space-y-8">
              {/* Create Custom Mock Test */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 bg-[rgba(12,8,36,0.7)] backdrop-blur-xl rounded-2xl border border-white/10"
              >
                <h3 className="text-[18px] font-bold text-[#F3F4F6] mb-6">Create Custom Mock Test</h3>

                <div className="space-y-6">
                  {/* Subject Selection */}
                  <div>
                    <label className="block text-[13px] font-medium text-[#F3F4F6] mb-3">Subject Selection</label>
                    <div className="flex flex-wrap gap-3">
                      {['Physics', 'Mathematics', 'Chemistry'].map((subject) => (
                        <button
                          key={subject}
                          onClick={() => toggleSubject(subject)}
                          className={`
                            px-4 py-2.5 rounded-lg text-[13px] font-medium transition-all
                            ${selectedSubjects.includes(subject)
                              ? 'bg-[#6366F1] text-white border-2 border-[#6366F1]'
                              : 'bg-white/5 text-[#9CA3AF] border-2 border-white/10 hover:border-white/20'
                            }
                          `}
                        >
                          {subject}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Number of Questions */}
                  <div>
                    <label className="block text-[13px] font-medium text-[#F3F4F6] mb-3">
                      Number of Questions: <span className="text-[#6366F1]">{numQuestions}</span>
                    </label>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="10"
                        max="100"
                        step="5"
                        value={numQuestions}
                        onChange={(e) => setNumQuestions(parseInt(e.target.value))}
                        className="flex-1 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#6366F1]"
                      />
                      <input
                        type="number"
                        min="10"
                        max="100"
                        value={numQuestions}
                        onChange={(e) => setNumQuestions(parseInt(e.target.value))}
                        className="w-20 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-[13px] text-[#F3F4F6] focus:outline-none focus:border-[#6366F1]"
                      />
                    </div>
                  </div>

                  {/* Time Limit */}
                  <div>
                    <label className="block text-[13px] font-medium text-[#F3F4F6] mb-3">Time Limit</label>
                    <select
                      value={timeLimit}
                      onChange={(e) => setTimeLimit(e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-[13px] text-[#F3F4F6] focus:outline-none focus:border-[#6366F1] cursor-pointer"
                    >
                      <option value="No timer">No timer</option>
                      <option value="30 minutes">30 minutes</option>
                      <option value="1 hour">1 hour</option>
                      <option value="1.5 hours">1.5 hours</option>
                      <option value="3 hours">3 hours (Real exam simulation)</option>
                    </select>
                  </div>

                  {/* Difficulty Level */}
                  <div>
                    <label className="block text-[13px] font-medium text-[#F3F4F6] mb-3">Difficulty Level</label>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      {['Mixed', 'Easy', 'Medium', 'Hard', 'Adaptive'].map((level) => (
                        <button
                          key={level}
                          onClick={() => setDifficulty(level)}
                          className={`
                            px-4 py-2.5 rounded-lg text-[13px] font-medium transition-all
                            ${difficulty === level
                              ? 'bg-[#6366F1] text-white'
                              : 'bg-white/5 text-[#9CA3AF] border border-white/10 hover:border-white/20'
                            }
                          `}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Question Source */}
                  <div>
                    <label className="block text-[13px] font-medium text-[#F3F4F6] mb-3">Question Source</label>
                    <div className="flex gap-3">
                      {['Concept Practice', 'Previous Year Questions (PYQs)', 'Mixed'].map((source) => (
                        <button
                          key={source}
                          onClick={() => setQuestionSource(source)}
                          className={`
                            flex-1 px-4 py-2.5 rounded-lg text-[13px] font-medium transition-all
                            ${questionSource === source
                              ? 'bg-[#6366F1] text-white'
                              : 'bg-white/5 text-[#9CA3AF] border border-white/10 hover:border-white/20'
                            }
                          `}
                        >
                          {source}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Subject Question Distribution */}
                  {selectedSubjects.length > 0 && (
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <label className="block text-[13px] font-medium text-[#F3F4F6] mb-4">Subject Question Distribution</label>
                      <div className="space-y-3">
                        {selectedSubjects.includes('Physics') && (
                          <div className="flex items-center justify-between">
                            <span className="text-[13px] text-[#9CA3AF]">Physics</span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setPhysicsQuestions(Math.max(0, physicsQuestions - 5))}
                                className="w-7 h-7 rounded bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                              >
                                <Minus size={14} className="text-[#9CA3AF]" />
                              </button>
                              <span className="w-12 text-center text-[13px] font-medium text-[#F3F4F6]">{physicsQuestions}</span>
                              <button
                                onClick={() => setPhysicsQuestions(physicsQuestions + 5)}
                                className="w-7 h-7 rounded bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                              >
                                <Plus size={14} className="text-[#9CA3AF]" />
                              </button>
                            </div>
                          </div>
                        )}
                        {selectedSubjects.includes('Mathematics') && (
                          <div className="flex items-center justify-between">
                            <span className="text-[13px] text-[#9CA3AF]">Mathematics</span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setMathQuestions(Math.max(0, mathQuestions - 5))}
                                className="w-7 h-7 rounded bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                              >
                                <Minus size={14} className="text-[#9CA3AF]" />
                              </button>
                              <span className="w-12 text-center text-[13px] font-medium text-[#F3F4F6]">{mathQuestions}</span>
                              <button
                                onClick={() => setMathQuestions(mathQuestions + 5)}
                                className="w-7 h-7 rounded bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                              >
                                <Plus size={14} className="text-[#9CA3AF]" />
                              </button>
                            </div>
                          </div>
                        )}
                        {selectedSubjects.includes('Chemistry') && (
                          <div className="flex items-center justify-between">
                            <span className="text-[13px] text-[#9CA3AF]">Chemistry</span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setChemistryQuestions(Math.max(0, chemistryQuestions - 5))}
                                className="w-7 h-7 rounded bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                              >
                                <Minus size={14} className="text-[#9CA3AF]" />
                              </button>
                              <span className="w-12 text-center text-[13px] font-medium text-[#F3F4F6]">{chemistryQuestions}</span>
                              <button
                                onClick={() => setChemistryQuestions(chemistryQuestions + 5)}
                                className="w-7 h-7 rounded bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                              >
                                <Plus size={14} className="text-[#9CA3AF]" />
                              </button>
                            </div>
                          </div>
                        )}
                        <div className="pt-3 border-t border-white/10">
                          <div className="flex items-center justify-between">
                            <span className="text-[13px] font-medium text-[#F3F4F6]">Total</span>
                            <span className="text-[13px] font-bold text-[#6366F1]">
                              {(selectedSubjects.includes('Physics') ? physicsQuestions : 0) +
                                (selectedSubjects.includes('Mathematics') ? mathQuestions : 0) +
                                (selectedSubjects.includes('Chemistry') ? chemistryQuestions : 0)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Exam Simulation Mode */}
                  <div className="flex items-start justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex-1">
                      <p className="text-[13px] font-medium text-[#F3F4F6] mb-1">Exam Simulation Mode</p>
                      <p className="text-[11px] text-[#9CA3AF]">
                        When enabled, this mock test replicates real exam conditions. Timer cannot be paused, hints disabled, full focus environment.
                      </p>
                    </div>
                    <button
                      onClick={() => setExamSimMode(!examSimMode)}
                      className={`
                        ml-4 w-12 h-7 rounded-full transition-colors relative flex-shrink-0
                        ${examSimMode ? 'bg-[#6366F1]' : 'bg-white/10'}
                      `}
                    >
                      <motion.div
                        animate={{ x: examSimMode ? 22 : 2 }}
                        className="absolute top-1 w-5 h-5 bg-white rounded-full"
                      />
                    </button>
                  </div>

                  {/* Generate Button */}
                  <button
                    onClick={handleGenerateTest}
                    className="w-full py-3.5 bg-[#6366F1] rounded-lg text-[14px] font-medium text-white hover:bg-[#5558E3] transition-colors shadow-[0_4px_16px_rgba(99,102,241,0.4)]"
                  >
                    Generate Mock Test
                  </button>
                </div>
              </motion.div>

              {/* Generated Mock Tests */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h3 className="text-[16px] font-bold text-[#F3F4F6] mb-4">Generated Mock Tests</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {generatedTests.map((test, index) => (
                    <motion.div
                      key={test.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + index * 0.05 }}
                      className="p-5 bg-[rgba(12,8,36,0.7)] backdrop-blur-xl rounded-xl border border-white/10 hover:border-white/20 transition-colors"
                    >
                      <h4 className="text-[14px] font-bold text-[#F3F4F6] mb-3">{test.title}</h4>

                      {/* Test Details */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-[12px] text-[#9CA3AF]">
                          <BookOpen size={14} />
                          <span>{test.subjects.join(', ')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[12px] text-[#9CA3AF]">
                          <FileText size={14} />
                          <span>{test.questions} Questions</span>
                        </div>
                        <div className="flex items-center gap-2 text-[12px] text-[#9CA3AF]">
                          <Clock size={14} />
                          <span>{test.duration}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[12px] text-[#9CA3AF]">
                          <Award size={14} />
                          <span>{test.difficulty} Difficulty</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => navigate('/tests/interface')}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#6366F1] rounded-lg text-[12px] font-medium text-white hover:bg-[#5558E3] transition-colors"
                        >
                          <Play size={14} />
                          Start Test
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg hover:border-white/20 transition-colors"
                        >
                          <Edit2 size={14} className="text-[#9CA3AF]" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleDeleteTest(test.id)}
                          className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg hover:border-[#EF4444]/50 transition-colors"
                        >
                          <Trash2 size={14} className="text-[#EF4444]" />
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Past Mock Test Attempts */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h3 className="text-[16px] font-bold text-[#F3F4F6] mb-4">Past Mock Test Attempts</h3>

                <div className="bg-[rgba(12,8,36,0.7)] backdrop-blur-xl rounded-xl border border-white/10 overflow-hidden">
                  {/* Table Header */}
                  <div className="grid grid-cols-6 gap-4 px-5 py-3 bg-white/5 border-b border-white/10">
                    <p className="text-[11px] font-medium text-[#9CA3AF]">Test Name</p>
                    <p className="text-[11px] font-medium text-[#9CA3AF]">Score</p>
                    <p className="text-[11px] font-medium text-[#9CA3AF]">Accuracy</p>
                    <p className="text-[11px] font-medium text-[#9CA3AF]">Time Taken</p>
                    <p className="text-[11px] font-medium text-[#9CA3AF]">Date</p>
                    <p className="text-[11px] font-medium text-[#9CA3AF]">Action</p>
                  </div>

                  {/* Table Rows */}
                  {pastAttempts.map((attempt) => (
                    <div
                      key={attempt.id}
                      className="grid grid-cols-6 gap-4 px-5 py-4 border-b border-white/5 last:border-b-0 hover:bg-white/5 transition-colors"
                    >
                      <p className="text-[12px] text-[#F3F4F6]">{attempt.name}</p>
                      <p className="text-[12px] font-semibold text-[#F3F4F6]">
                        {attempt.score}/{attempt.total}
                      </p>
                      <p className="text-[12px] font-semibold text-[#10B981]">{attempt.accuracy}</p>
                      <p className="text-[12px] text-[#9CA3AF]">{attempt.timeTaken}</p>
                      <p className="text-[12px] text-[#9CA3AF]">{attempt.date}</p>
                      <button className="text-[12px] text-[#6366F1] hover:text-[#5558E3] transition-colors text-left font-medium">
                        View Analysis
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}