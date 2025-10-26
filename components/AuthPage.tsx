
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CrowdSenseIcon, UserIcon, LockClosedIcon } from './index';
import { login, signup } from '../services/authService';

interface AuthPageProps {
  onLoginSuccess: (username: string, mode: 'login' | 'signup') => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (mode === 'signup' && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const response = mode === 'login'
        ? await login(username, password)
        : await signup(username, password);

      if (response.success) {
        onLoginSuccess(username, mode);
      } else {
        setError(response.message);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = () => {
    setMode(prev => prev === 'login' ? 'signup' : 'login');
    setError(null);
    setUsername('');
    setPassword('');
    setConfirmPassword('');
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 font-sans">
      <motion.div
        className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
      <motion.div
        className="relative w-full max-w-sm"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        <div className="text-center mb-8">
          <CrowdSenseIcon className="w-24 h-24 mx-auto text-teal-400" />
          <h1 className="text-4xl font-bold text-white mt-4">CrowdSense</h1>
          <p className="text-slate-400 mt-2">
            {mode === 'login' ? 'Please sign in to access the dashboard.' : 'Create a new account to get started.'}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 space-y-6 shadow-2xl"
        >
          <div className="relative">
            <UserIcon className="w-5 h-5 text-slate-400 absolute top-1/2 left-3 -translate-y-1/2" />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 pl-10 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
              required
            />
          </div>
          <div className="relative">
            <LockClosedIcon className="w-5 h-5 text-slate-400 absolute top-1/2 left-3 -translate-y-1/2" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 pl-10 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
              required
            />
          </div>
          
          <AnimatePresence>
            {mode === 'signup' && (
              <motion.div 
                className="relative"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                 <LockClosedIcon className="w-5 h-5 text-slate-400 absolute top-1/2 left-3 -translate-y-1/2" />
                 <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm Password"
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 pl-10 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                    required={mode === 'signup'}
                  />
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="text-sm text-red-400 text-center"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-8 py-3 rounded-lg font-bold text-lg text-white bg-teal-600 hover:bg-teal-500 transition-all duration-300 transform hover:scale-105 disabled:bg-slate-600 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            ) : (
              mode === 'login' ? 'Login' : 'Create Account'
            )}
          </button>

          <p className="text-center text-sm text-slate-400 pt-2">
            {mode === 'login' ? "Don't have an account?" : "Already have an account?"}
            <button
              type="button"
              onClick={switchMode}
              className="font-semibold text-teal-400 hover:text-teal-300 ml-1 focus:outline-none"
            >
              {mode === 'login' ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </form>
      </motion.div>
    </div>
  );
};

export default AuthPage;