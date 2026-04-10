import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function AdminLoginPage() {
  const { user, signIn, isSubmitting } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    navigate(user.role === 'admin' ? '/admin' : '/', { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      // Do not trim password: it must match Supabase exactly.
      // Trimming can break passwords that intentionally include leading/trailing whitespace.
      await signIn({ email: email.trim(), password, expectedRole: 'admin' });
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-white border border-gray-200 rounded-2xl p-6 space-y-4 shadow-sm">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Admin Sign In</h1>
          <p className="text-sm text-gray-500">Use an admin account to enter the portal.</p>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-11 border border-gray-200 rounded-lg px-3 focus:border-teal-600 focus:ring-4 focus:ring-teal-50 outline-none"
            placeholder="admin@healthpowr.com"
            required
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-11 border border-gray-200 rounded-lg px-3 focus:border-teal-600 focus:ring-4 focus:ring-teal-50 outline-none"
            placeholder="••••••••"
            required
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-11 rounded-lg bg-teal-600 text-white font-medium hover:bg-teal-700 disabled:opacity-60"
        >
          {isSubmitting ? 'Signing In...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}