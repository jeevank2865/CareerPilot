import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Briefcase,
  Mail,
  Lock,
  User,
  ArrowRight,
  Sparkles,
  Database,
  CheckCircle2,
  AlertCircle,
  KeyRound,
} from 'lucide-react';

interface AuthViewProps {
  onOpenSupabaseModal: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onOpenSupabaseModal }) => {
  const { signIn, signUp, resetPassword, loginAsDemo, isConfigured } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      if (mode === 'signin') {
        const { error } = await signIn(email, password);
        if (error) {
          setMessage({ text: error.message, type: 'error' });
        }
      } else if (mode === 'signup') {
        if (!fullName.trim()) {
          setMessage({ text: 'Please enter your full name', type: 'error' });
          setLoading(false);
          return;
        }
        const { error, needsEmailConfirmation } = await signUp(email, password, fullName);
        if (error) {
          setMessage({ text: error.message, type: 'error' });
        } else if (needsEmailConfirmation) {
          setMessage({
            text: 'Account created! Please check your email to confirm your account before logging in.',
            type: 'success',
          });
        }
      } else if (mode === 'forgot') {
        const { error } = await resetPassword(email);
        if (error) {
          setMessage({ text: error.message, type: 'error' });
        } else {
          setMessage({
            text: 'Password reset link sent to your email address.',
            type: 'success',
          });
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      setMessage({ text: msg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/20 mb-2">
            <Briefcase className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Job & Internship Tracker
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Maintain and track every application, stage, interview feedback & resume
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/20 space-y-6">
          {/* Tabs */}
          <div className="flex p-1 bg-slate-100 rounded-2xl text-xs font-bold">
            <button
              onClick={() => {
                setMode('signin');
                setMessage(null);
              }}
              className={`flex-1 py-2 rounded-xl transition-all ${
                mode === 'signin'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setMode('signup');
                setMessage(null);
              }}
              className={`flex-1 py-2 rounded-xl transition-all ${
                mode === 'signup'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Alert Message */}
          {message && (
            <div
              className={`p-3.5 rounded-2xl text-xs flex items-start gap-2.5 ${
                message.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border border-rose-200 text-rose-900'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-600" /> Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Jeevan Kumar"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-blue-600" /> Email Address
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>

            {mode !== 'forgot' && (
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-blue-600" /> Password
                  </label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot');
                        setMessage(null);
                      }}
                      className="text-[11px] font-semibold text-blue-600 hover:underline"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                'Processing...'
              ) : mode === 'signin' ? (
                <>
                  Sign In <ArrowRight className="w-4 h-4" />
                </>
              ) : mode === 'signup' ? (
                <>
                  Create Account <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  Send Reset Link <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {mode === 'forgot' && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setMode('signin')}
                className="text-xs font-bold text-blue-600 hover:underline"
              >
                ← Back to Sign In
              </button>
            </div>
          )}

          {/* Quick Demo Exploration Button */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <button
              type="button"
              onClick={loginAsDemo}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Explore Instant Demo Mode</span>
            </button>

            <button
              type="button"
              onClick={onOpenSupabaseModal}
              className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-xs rounded-xl border border-emerald-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>Configure Supabase Project & SQL</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
