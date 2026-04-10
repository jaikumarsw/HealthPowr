import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, Lock, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { toStaffLoginEmail } from '../lib/orgSlug';

type OrganizationOption = {
  id: string;
  name: string;
  borough: string | null;
};

export default function StaffAuthPage() {
  const navigate = useNavigate();
  const { signIn, user, isSubmitting } = useAuth();
  const [organizations, setOrganizations] = useState<OrganizationOption[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function loadOrganizations() {
      try {
        setLoadingOrgs(true);
        const { data, error: orgError } = await supabase
          .from('organizations')
          .select('id, name, borough')
          .order('name', { ascending: true });
        if (orgError) throw orgError;
        if (!active) return;
        setOrganizations((data as OrganizationOption[]) ?? []);
      } catch (err: any) {
        if (!active) return;
        setError(err?.message || 'Could not load organizations.');
      } finally {
        if (active) setLoadingOrgs(false);
      }
    }
    void loadOrganizations();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (user?.role === 'organization') {
      navigate('/cbo', { replace: true });
    }
  }, [navigate, user]);

  const selectedOrg = useMemo(
    () => organizations.find((org) => org.id === selectedOrgId),
    [organizations, selectedOrgId],
  );

  async function handleSignIn() {
    setError(null);
    setMessage(null);
    if (!selectedOrgId || !username.trim() || !password) {
      setError('Organization, username, and password are required.');
      return;
    }
    try {
      if (!selectedOrg?.name) {
        setError('Please select an organization.');
        return;
      }
      // Accept either "jai_kumar" or the full login email "jai_kumar@alpha-hive.healthpowr.app"
      const normalizedUsername = username.trim().toLowerCase().replace(/@.*$/, '');

      // Resolve username -> staff's REAL auth email via org membership.
      const { data: memberRow, error: memberErr } = await supabase
        .from('organization_members')
        .select('profile:profiles!profile_id(email)')
        .eq('organization_id', selectedOrgId)
        .eq('username', normalizedUsername)
        .maybeSingle();
      if (memberErr) throw memberErr;
      const resolvedEmail = (memberRow as any)?.profile?.email as string | undefined;
      if (!resolvedEmail) {
        // Backward-compatible fallback: old generated login email
        // (for any staff created before this change).
        const fallback = toStaffLoginEmail({
          username: normalizedUsername,
          orgName: selectedOrg.name,
        });
        await signIn({ email: fallback, password });
        navigate('/cbo', { replace: true });
        return;
      }

      await signIn({
        email: resolvedEmail,
        password,
      });

      navigate('/cbo', { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Unable to sign in.');
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Staff Portal</h1>
          <p className="text-sm text-gray-500 mt-1">
            Your organization admin will create your account and send you credentials.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
            Organization
          </label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={selectedOrgId}
              onChange={(e) => setSelectedOrgId(e.target.value)}
              disabled={loadingOrgs}
              className="w-full h-11 border border-gray-200 rounded-lg pl-10 pr-3 text-sm bg-white"
            >
              <option value="">
                {loadingOrgs ? 'Loading organizations...' : 'Select organization'}
              </option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                  {org.borough ? ` (${org.borough})` : ''}
                </option>
              ))}
            </select>
          </div>
          {selectedOrg && (
            <p className="text-xs text-gray-500 mt-1">
              Selected: {selectedOrg.name}
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
            Username
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your username (e.g. jai_kumar)"
              autoCapitalize="none"
              autoCorrect="off"
              className="w-full h-11 border border-gray-200 rounded-lg pl-10 pr-3 text-sm"
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">Enter your username or your full login email — either works.</p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full h-11 border border-gray-200 rounded-lg pl-10 pr-3 text-sm"
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {message && <p className="text-sm text-teal-700">{message}</p>}

        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => void handleSignIn()}
          className="w-full h-11 rounded-lg bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 disabled:opacity-60"
        >
          {isSubmitting ? 'Please wait...' : 'Sign In'}
        </button>

        <div className="text-center">
          <Link to="/" className="text-sm text-teal-700 hover:text-teal-800 font-medium">
            Back to main portal
          </Link>
        </div>
      </div>
    </div>
  );
}
