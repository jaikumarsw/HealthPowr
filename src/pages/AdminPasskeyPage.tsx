import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

const ADMIN_PASSKEY_FALLBACK = 'HealthPowrAdmin';

export default function AdminPasskeyPage() {
  const [passkey, setPasskey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const expectedPasskey = (import.meta.env.VITE_ADMIN_PASSKEY as string | undefined) || ADMIN_PASSKEY_FALLBACK;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (passkey.trim() !== expectedPasskey) {
        setError('Invalid passkey.');
        return;
      }

      window.sessionStorage.setItem('hp_admin_passkey_ok', 'true');
      navigate('/admin-login', { replace: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-white border border-gray-200 rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Admin Access</h1>
            <p className="text-sm text-gray-500">Enter admin passkey to continue</p>
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Passkey</label>
          <input
            type="password"
            value={passkey}
            onChange={(e) => setPasskey(e.target.value)}
            className="w-full h-11 border border-gray-200 rounded-lg px-3 focus:border-teal-600 focus:ring-4 focus:ring-teal-50 outline-none"
            placeholder="Enter passkey"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-11 rounded-lg bg-teal-600 text-white font-medium hover:bg-teal-700 disabled:opacity-60"
        >
          {isSubmitting ? 'Verifying...' : 'Continue'}
        </button>
      </form>
    </div>
  );
}
