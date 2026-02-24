import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { SpaceBackground } from '../components/SpaceBackground';
import { CosmicIllustration } from '../components/CosmicIllustration';
import { AuthInput } from '../components/AuthInput';
import { AuthButton } from '../components/AuthButton';
import { ModeToggle } from '../components/ModeToggle';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';
const clarioLogo = '';

export default function Auth() {
  const navigate = useNavigate();
  const { loginWithEmail, signupWithEmail, loginWithGoogle, currentUser } = useAuth();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // If already logged in, redirect
  if (currentUser) {
    navigate('/dashboard');
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setBusy(true);
    try {
      if (mode === 'signup') {
        await signupWithEmail(email, password);
        // Sync new user to Postgres
        await client.post('/auth/sync').catch(() => { });
        navigate('/onboarding/subjects');
      } else {
        await loginWithEmail(email, password);
        // Sync user to Postgres
        await client.post('/auth/sync').catch(() => { });
        navigate('/dashboard');
      }
    } catch (err) {
      const code = err.code;
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        setError('Incorrect email or password.');
      } else if (code === 'auth/email-already-in-use') {
        setError('An account with this email already exists.');
      } else if (code === 'auth/weak-password') {
        setError('Password must be at least 6 characters.');
      } else {
        setError(err.message?.replace('Firebase: ', '') || 'Authentication failed.');
      }
      setBusy(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Space Background */}
      <SpaceBackground />

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 sm:p-6 md:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-[860px]"
        >
          {/* Glassmorphic Auth Card */}
          <div className="relative bg-[rgba(12,8,36,0.7)] backdrop-blur-xl rounded-3xl border border-white/12 shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden">
            <div className="flex flex-col lg:flex-row">
              {/* Left Panel - Illustration (Desktop/Tablet only) */}
              <div className="hidden md:block lg:w-[45%] border-r border-white/10 p-8 lg:p-12 min-h-[500px]">
                <CosmicIllustration />
              </div>

              {/* Right Panel - Form */}
              <div className="flex-1 p-6 sm:p-8 md:p-12">
                <div className="w-full max-w-[420px] mx-auto">
                  {/* Brand Row - Using Logo Image */}
                  <div className="flex items-center mb-8">
                    <img
                      src={clarioLogo}
                      alt="Clario"
                      className="h-[56px] w-auto"
                    />
                  </div>

                  {/* Headline */}
                  <h1 className="text-[28px] font-bold text-[#F3F4F6] tracking-[-0.01em] leading-[130%] mb-2">
                    {mode === 'login' ? 'Welcome back, Explorer' : 'Join the Mission'}
                  </h1>

                  {/* Subtext */}
                  <p className="text-[14px] text-[#9CA3AF] leading-[150%] mb-8 font-normal">
                    {mode === 'login'
                      ? 'Continue your journey through the cosmos of knowledge'
                      : 'Begin your adventure in gamified STEM learning'}
                  </p>

                  {/* Mode Toggle */}
                  <div className="mb-8">
                    <ModeToggle mode={mode} onChange={(m) => { setMode(m); setError(''); setEmail(''); setPassword(''); setConfirmPassword(''); }} />
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-[13px]">
                      {error}
                    </div>
                  )}

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <AuthInput
                      label="Email"
                      type="email"
                      placeholder="explorer@clario.space"
                      value={email}
                      onChange={setEmail}
                    />

                    <AuthInput
                      label="Password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={setPassword}
                    />

                    {mode === 'signup' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <AuthInput
                          label="Confirm Password"
                          type="password"
                          placeholder="Confirm your password"
                          value={confirmPassword}
                          onChange={setConfirmPassword}
                        />
                      </motion.div>
                    )}

                    {/* Primary Button */}
                    <div className="pt-4">
                      <AuthButton type="submit" disabled={busy}>
                        {busy ? 'Authenticating...' : mode === 'login' ? 'Continue' : 'Create Account'}
                      </AuthButton>
                    </div>

                    {/* Footer Links */}
                    <div className="flex items-center justify-between pt-6">
                      {mode === 'login' ? (
                        <>
                          <button
                            type="button"
                            className="text-[12px] text-[#9CA3AF] hover:text-[#8B5CF6] transition-colors font-normal"
                          >
                            Forgot password?
                          </button>
                          <button
                            type="button"
                            onClick={() => setMode('signup')}
                            className="text-[12px] text-[#9CA3AF] hover:text-[#8B5CF6] transition-colors font-normal"
                          >
                            Need an account?
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setMode('login')}
                          className="text-[12px] text-[#9CA3AF] hover:text-[#8B5CF6] transition-colors mx-auto font-normal"
                        >
                          Already have an account?
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}