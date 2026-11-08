import { useState } from 'react';
import { LockKeyhole, Mail, MessageCircle, UserRound } from 'lucide-react';
import api, { getApiErrorMessage, setAuthToken } from '../services/api';

export function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [chatId, setChatId] = useState('');
  const [telegramUsername, setTelegramUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (mode === 'register' && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
      const payload =
        mode === 'login'
          ? { identifier: email, password }
          : { fullName, username, email, password, confirmPassword, chatId, telegramUsername };

      const response = await api.post(endpoint, payload);
      const token = response.data?.data?.token ?? response.data?.token;

      if (!token) {
        throw new Error('Authentication failed: token missing.');
      }

      setAuthToken(token);
      window.location.href = '/';
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to complete authentication. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-[#080d20] p-4 sm:p-6">
      <div className="my-4 max-h-[calc(100vh-2rem)] w-full max-w-md overflow-y-auto rounded-3xl border border-violet-500/20 bg-[#111a33] p-5 shadow-2xl shadow-violet-950/30 sm:my-6 sm:max-h-[calc(100vh-3rem)] sm:p-7">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 inline-flex rounded-2xl bg-violet-600/15 p-3 text-violet-200">
            <LockKeyhole size={28} />
          </div>
          <p className="text-[10px] uppercase tracking-[0.35em] text-violet-200">SMS Portal</p>
          <h1 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">{mode === 'login' ? 'Welcome back' : 'Create an account'}</h1>
        </div>

        <div className="mb-4 flex rounded-xl border border-white/10 bg-slate-900/40 p-1">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${mode === 'login' ? 'bg-violet-600 text-white' : 'text-slate-300'}`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${mode === 'register' ? 'bg-violet-600 text-white' : 'text-slate-300'}`}
          >
            Register
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {mode === 'register' && (
            <>
              <label className="block">
                <span className="mb-2 block text-sm text-slate-300">Fullname</span>
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/40 px-3">
                  <UserRound size={16} className="text-slate-400" />
                  <input
                    required
                    autoComplete="name"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    className="w-full border-0 bg-transparent py-3 text-white outline-none placeholder:text-slate-500"
                    placeholder="Jane Doe"
                  />
                </div>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm text-slate-300">Username</span>
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/40 px-3">
                  <UserRound size={16} className="text-slate-400" />
                  <input
                    required
                    autoComplete="username"
                    maxLength={50}
                    pattern="[A-Za-z0-9._\-]+"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    className="w-full border-0 bg-transparent py-3 text-white outline-none placeholder:text-slate-500"
                    placeholder="jane.doe"
                  />
                </div>
              </label>
            </>
          )}

          {mode === 'login' && (
            <label className="block">
              <span className="mb-2 block text-sm text-slate-300">Username or email</span>
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/40 px-3">
                <Mail size={16} className="text-slate-400" />
                <input
                  type="text"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full border-0 bg-transparent py-3 text-white outline-none placeholder:text-slate-500"
                  placeholder="Username or email"
                />
              </div>
            </label>
          )}

          <label className="block">
            <span className="mb-2 block text-sm text-slate-300">Password</span>
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/40 px-3">
              <LockKeyhole size={16} className="text-slate-400" />
              <input
                type="password"
                required
                minLength={7}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full border-0 bg-transparent py-3 text-white outline-none placeholder:text-slate-500"
                placeholder="••••••••"
              />
            </div>
          </label>

          {mode === 'register' && (
            <>
              <label className="block">
                <span className="mb-2 block text-sm text-slate-300">Confirm Password</span>
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/40 px-3">
                  <LockKeyhole size={16} className="text-slate-400" />
                  <input
                    type="password"
                    required
                    minLength={7}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="w-full border-0 bg-transparent py-3 text-white outline-none placeholder:text-slate-500"
                    placeholder="Re-enter your password"
                  />
                </div>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm text-slate-300">Chat ID</span>
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/40 px-3">
                  <MessageCircle size={16} className="text-slate-400" />
                  <input
                    required
                    value={chatId}
                    onChange={(event) => setChatId(event.target.value)}
                    className="w-full border-0 bg-transparent py-3 text-white outline-none placeholder:text-slate-500"
                    placeholder="Your chat ID"
                  />
                </div>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm text-slate-300">Telegram Username</span>
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/40 px-3">
                  <span className="text-sm text-slate-400">@</span>
                  <input
                    required
                    maxLength={64}
                    value={telegramUsername}
                    onChange={(event) => setTelegramUsername(event.target.value.replace(/^@/, ''))}
                    className="w-full border-0 bg-transparent py-3 text-white outline-none placeholder:text-slate-500"
                    placeholder="username"
                  />
                </div>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm text-slate-300">Email address</span>
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/40 px-3">
                  <Mail size={16} className="text-slate-400" />
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full border-0 bg-transparent py-3 text-white outline-none placeholder:text-slate-500"
                    placeholder="you@example.com"
                  />
                </div>
              </label>
            </>
          )}

          {error && <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-violet-600 px-4 py-3 font-medium text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  );
}
