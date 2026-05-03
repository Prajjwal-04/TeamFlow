import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'member' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=60 height=60 xmlns=http://www.w3.org/2000/svg%3E%3Cpath d=M0 0h60v60H0z fill=none/%3E%3Cpath d=M0 0h1v60H0zm59 0h1v60h-1zM0 0h60v1H0zm0 59h60v1H0z stroke=%23334155 stroke-width=.5/%3E%3C/svg%3E')] opacity-30" />

      <div className="relative w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">TF</div>
            <span className="text-white font-bold text-2xl tracking-tight">TeamFlow</span>
          </div>
          <p className="text-slate-400 text-sm">Create your account</p>
        </div>

        <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">{error}</div>
            )}
            <div>
              <label className="label text-slate-400">Full Name</label>
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="input bg-slate-900/60 border-slate-700 text-white placeholder-slate-500"
                placeholder="Jane Smith" required minLength={2} />
            </div>
            <div>
              <label className="label text-slate-400">Email</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                className="input bg-slate-900/60 border-slate-700 text-white placeholder-slate-500"
                placeholder="you@company.com" required />
            </div>
            <div>
              <label className="label text-slate-400">Password</label>
              <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                className="input bg-slate-900/60 border-slate-700 text-white placeholder-slate-500"
                placeholder="Min. 6 characters" required minLength={6} />
            </div>
            <div>
              <label className="label text-slate-400">Role</label>
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                className="input bg-slate-900/60 border-slate-700 text-white">
                <option value="member">Team Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold transition-all duration-200 active:scale-[0.98] disabled:opacity-50 mt-2">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : 'Create Account'}
            </button>
          </form>
          <p className="text-center text-slate-400 text-sm mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
