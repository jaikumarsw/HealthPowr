import { useEffect, useState } from 'react';
import { Building2, Edit, MapPin, Save, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { staffApi } from '../../api/staff';
import { toStaffLoginEmail } from '../../lib/orgSlug';

const BOROUGHS = [
  'Manhattan',
  'Brooklyn',
  'Queens',
  'The Bronx',
  'Staten Island',
] as const;

export function SettingsView() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    borough: ''
  });
  const [initialForm, setInitialForm] = useState({
    name: '',
    description: '',
    borough: ''
  });
  const [myProfileId, setMyProfileId] = useState<string | null>(null);
  const [myMembershipRole, setMyMembershipRole] = useState<
    'owner' | 'admin' | 'member' | null
  >(null);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [teamMessage, setTeamMessage] = useState<string | null>(null);
  const [teamError, setTeamError] = useState<string | null>(null);
  const [createStaff, setCreateStaff] = useState({
    username: '',
    personalEmail: '',
    fullName: '',
    role: 'member' as 'admin' | 'member',
  });
  const [creatingStaff, setCreatingStaff] = useState(false);
  const [createdCreds, setCreatedCreds] = useState<null | {
    login_email: string;
    invited_email: string;
  }>(null);

  useEffect(() => {
    async function loadOrg() {
      try {
        setLoading(true);
        const { data: auth } = await supabase.auth.getUser();
        if (!auth.user) return;
        setMyProfileId(auth.user.id);
        const { data: membership } = await supabase
          .from('organization_members')
          .select('organization_id, role')
          .eq('profile_id', auth.user.id)
          .maybeSingle();
        if (!membership?.organization_id) return;
        setOrgId(membership.organization_id);
        setMyMembershipRole((membership.role as any) ?? null);

        const { data: org } = await supabase
          .from('organizations')
          .select('name, description, borough')
          .eq('id', membership.organization_id)
          .single();
        if (org) {
          const next = {
            name: org.name || '',
            description: org.description || '',
            borough: org.borough || ''
          };
          setForm(next);
          setInitialForm(next);
        }
      } finally {
        setLoading(false);
      }
    }
    void loadOrg();
  }, []);

  useEffect(() => {
    if (!orgId) return;
    async function loadTeam() {
      try {
        setTeamLoading(true);
        const [membersResult] = await Promise.all([
          supabase
            .from('organization_members')
            .select(
              `
              profile_id,
              role,
              joined_at,
              profile:profiles!profile_id(id, full_name, email)
            `,
            )
            .eq('organization_id', orgId)
            .order('joined_at', { ascending: true }),
        ]);
        if (membersResult.error) throw membersResult.error;
        setTeamMembers(membersResult.data ?? []);
      } catch (err: any) {
        setTeamError(err?.message || 'Failed to load team.');
      } finally {
        setTeamLoading(false);
      }
    }
    void loadTeam();
  }, [orgId]);

  async function save() {
    if (!orgId) return;
    if (myMembershipRole !== 'owner' && myMembershipRole !== 'admin') {
      setError('Only owner/admin can edit organization settings.');
      return;
    }
    try {
      setSaving(true);
      setMessage(null);
      setError(null);
      if (form.borough && !BOROUGHS.includes(form.borough as any)) {
        setError('Please select a borough from the dropdown.');
        return;
      }
      const { error } = await supabase
        .from('organizations')
        .update({
          name: form.name,
          description: form.description || null,
          borough: form.borough
        })
        .eq('id', orgId);
      if (error) throw error;
      setMessage('Organization settings updated.');
      setInitialForm(form);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed.');
    } finally {
      setSaving(false);
    }
  }

  const canEditOrganization = myMembershipRole === 'owner' || myMembershipRole === 'admin';
  const canManageTeam = myMembershipRole === 'owner' || myMembershipRole === 'admin';

  function validateEmail(input: string) {
    const email = input.trim().toLowerCase();
    if (!email) return { ok: false, value: '', error: 'Personal email is required.' };
    // Simple RFC-ish check (good UX; backend still validates).
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { ok: false, value: email, error: 'Enter a valid email address.' };
    }
    return { ok: true, value: email, error: null as string | null };
  }

  function validateUsername(input: string) {
    const username = input.trim().toLowerCase();
    if (!username) return { ok: false, value: '', error: 'Username is required.' };
    if (username.length < 3) {
      return { ok: false, value: username, error: 'Username must be at least 3 characters.' };
    }
    if (username.length > 24) {
      return { ok: false, value: username, error: 'Username must be 24 characters or less.' };
    }
    if (!/^[a-z0-9._-]+$/.test(username)) {
      return { ok: false, value: username, error: 'Username can only use a-z, 0-9, dot, underscore, and dash.' };
    }
    return { ok: true, value: username, error: null as string | null };
  }

  async function createStaffAccount() {
    if (!orgId) return;
    if (!canManageTeam) return;
    if (!form.name.trim()) return;
    const emailCheck = validateEmail(createStaff.personalEmail);
    const usernameCheck = validateUsername(createStaff.username);
    if (!emailCheck.ok) {
      setTeamError(emailCheck.error);
      return;
    }
    if (!usernameCheck.ok) {
      setTeamError(usernameCheck.error);
      return;
    }
    const personalEmail = emailCheck.value;
    const username = usernameCheck.value;
    try {
      setTeamError(null);
      setTeamMessage(null);
      setCreatedCreds(null);
      setCreatingStaff(true);
      const creds = await staffApi.createStaffAccount({
        organizationId: orgId,
        organizationName: form.name,
        username,
        personalEmail,
        fullName: createStaff.fullName.trim() || undefined,
        membershipRole: createStaff.role,
      });
      setCreatedCreds(creds);
      setTeamMessage('Invite email sent. Staff must set password from the email, then sign in.');
      setCreateStaff({ username: '', personalEmail: '', fullName: '', role: 'member' });
      // Refresh members
      const { data: refreshed } = await supabase
        .from('organization_members')
        .select(
          `
          profile_id,
          role,
          joined_at,
          profile:profiles!profile_id(id, full_name, email)
        `,
        )
        .eq('organization_id', orgId)
        .order('joined_at', { ascending: true });
      setTeamMembers(refreshed ?? []);
    } catch (err: any) {
      setTeamError(err?.message || 'Failed to create staff account.');
    } finally {
      setCreatingStaff(false);
    }
  }

  async function removeTeamMember(profileId: string) {
    if (!orgId) return;
    if (profileId === myProfileId) {
      setTeamError("You can't remove yourself from the organization.");
      return;
    }
    try {
      setTeamError(null);
      setTeamMessage(null);
      const { error: deleteError } = await supabase
        .from('organization_members')
        .delete()
        .eq('organization_id', orgId)
        .eq('profile_id', profileId);
      if (deleteError) throw deleteError;
      setTeamMembers((prev) => prev.filter((m) => m.profile_id !== profileId));
      setTeamMessage('Team member removed.');
    } catch (err: any) {
      setTeamError(err?.message || 'Failed to remove member.');
    }
  }

  if (loading) return <div className="py-20 text-center text-gray-500">Loading organization settings...</div>;

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Organization</h1>
        <button
          type="button"
          disabled={!canEditOrganization}
          onClick={() => {
            if (!canEditOrganization) return;
            setError(null);
            setMessage(null);
            if (isEditing) {
              setForm(initialForm);
              setIsEditing(false);
            } else {
              setIsEditing(true);
            }
          }}
          className="h-10 px-3 rounded-lg border border-gray-200 text-sm flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isEditing ? <X className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
          {isEditing ? 'Cancel' : 'Edit'}
        </button>
      </div>
      {!canEditOrganization && (
        <p className="text-sm text-gray-500">
          Organization details are editable only by owner/admin.
        </p>
      )}

      {!isEditing ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <div className="flex items-center gap-3 pb-5 border-b border-gray-100">
            <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-teal-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[12px] text-gray-500 uppercase tracking-wide">
                Organization name
              </p>
              <p className="text-[18px] font-bold text-gray-900 truncate">
                {form.name || '—'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 pt-5">
            <div className="rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 text-gray-400">
                <MapPin className="w-4 h-4" />
                <p className="text-[11px] font-semibold uppercase">Borough</p>
              </div>
              <p className="mt-2 text-[14px] font-semibold text-gray-900">
                {form.borough || '—'}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 p-4">
              <p className="text-[11px] font-semibold text-gray-400 uppercase">
                Description
              </p>
              <p className="mt-2 text-[14px] text-gray-800 whitespace-pre-wrap">
                {form.description || '—'}
              </p>
            </div>
          </div>

          {error && <p className="text-sm text-red-600 mt-4">{error}</p>}
          {message && <p className="text-sm text-gray-600 mt-4">{message}</p>}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
          <div className="rounded-xl border border-teal-200 bg-teal-50/40 p-4">
            <p className="text-sm font-semibold text-teal-900">
              You’re editing your organization
            </p>
            <p className="text-xs text-teal-800 mt-1">
              Update your organization details and save changes.
            </p>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Organization Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="w-full h-11 border border-gray-200 rounded-lg px-3"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              className="w-full min-h-24 border border-gray-200 rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Borough</label>
            <select
              value={form.borough}
              onChange={(e) => setForm((p) => ({ ...p, borough: e.target.value }))}
              className="w-full h-11 border border-gray-200 rounded-lg px-3 bg-white"
            >
              <option value="">Select borough</option>
              {BOROUGHS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => void save()}
              disabled={saving}
              className="h-11 px-4 rounded-lg bg-teal-600 text-white text-sm font-medium flex items-center gap-2 disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => {
                setForm(initialForm);
                setIsEditing(false);
              }}
              className="h-11 px-4 rounded-lg border border-gray-200 text-gray-700 text-sm hover:bg-gray-50 disabled:opacity-60"
            >
              Cancel
            </button>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {message && <p className="text-sm text-gray-600">{message}</p>}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Team Management</h2>
            <p className="text-sm text-gray-500">
              Manage staff logins under your organization.
            </p>
          </div>
          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 uppercase font-semibold">
            Your role: {myMembershipRole || 'member'}
          </span>
        </div>
        <div className="rounded-lg border border-teal-100 bg-teal-50 px-3 py-2 text-xs text-teal-800">
          Create staff accounts directly. Staff receive a Supabase invite email to set their
          password securely (no passwords sent over email).
        </div>

        {canManageTeam ? (
          <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
            <input
              value={createStaff.personalEmail}
              onChange={(e) => setCreateStaff((p) => ({ ...p, personalEmail: e.target.value }))}
              placeholder="Staff personal email (where invite is sent)"
              className="md:col-span-2 h-10 border border-gray-200 rounded-lg px-3 text-sm"
            />
            <input
              value={createStaff.username}
              onChange={(e) => setCreateStaff((p) => ({ ...p, username: e.target.value }))}
              placeholder="Username (login)"
              className="md:col-span-1 h-10 border border-gray-200 rounded-lg px-3 text-sm"
            />
            <input
              value={createStaff.fullName}
              onChange={(e) => setCreateStaff((p) => ({ ...p, fullName: e.target.value }))}
              placeholder="Full name (optional)"
              className="md:col-span-2 h-10 border border-gray-200 rounded-lg px-3 text-sm"
            />
            <select
              value={createStaff.role}
              onChange={(e) => setCreateStaff((p) => ({ ...p, role: e.target.value as any }))}
              className="h-10 border border-gray-200 rounded-lg px-3 text-sm bg-white"
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
            <div className="md:col-span-6 flex items-center justify-between gap-2">
              <p className="text-xs text-gray-500">
                Login email will be{" "}
                <span className="font-mono">
                  {createStaff.username.trim()
                    ? toStaffLoginEmail({ username: createStaff.username, orgName: form.name || "Organization" })
                    : "username@org.healthpowr.app"}
                </span>
              </p>
              <button
                type="button"
                disabled={creatingStaff}
                onClick={() => void createStaffAccount()}
                className="h-10 px-4 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 disabled:opacity-60"
              >
                {creatingStaff ? "Creating..." : "Create Staff Account"}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            Only org owner/admin can add or remove team members.
          </p>
        )}

        {teamError && <p className="text-sm text-red-600">{teamError}</p>}
        {teamMessage && <p className="text-sm text-teal-700">{teamMessage}</p>}
        {createdCreds && (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm font-semibold text-gray-900">Invite sent</p>
            <p className="text-xs text-gray-600 mt-1">
              Supabase sent an invite email to the staff member. They must set their password from that email.
            </p>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="rounded-lg border border-gray-200 bg-white p-3">
                <p className="text-[11px] text-gray-500 uppercase">Login email</p>
                <p className="text-sm font-mono text-gray-900 mt-1">
                  {createdCreds.login_email}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-3">
                <p className="text-[11px] text-gray-500 uppercase">Invited to</p>
                <p className="text-sm font-mono text-gray-900 mt-1">
                  {createdCreds.invited_email}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-xs text-gray-500 uppercase">Name</th>
                <th className="px-4 py-3 text-xs text-gray-500 uppercase">Email</th>
                <th className="px-4 py-3 text-xs text-gray-500 uppercase">Role</th>
                <th className="px-4 py-3 text-xs text-gray-500 uppercase">Joined</th>
                <th className="px-4 py-3 text-xs text-gray-500 uppercase text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {teamLoading ? (
                <tr>
                  <td className="px-4 py-8 text-center text-sm text-gray-500" colSpan={5}>
                    Loading team...
                  </td>
                </tr>
              ) : teamMembers.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-sm text-gray-500" colSpan={5}>
                    No team members found.
                  </td>
                </tr>
              ) : (
                teamMembers.map((m) => (
                  <tr key={m.profile_id}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {m.profile?.full_name || 'Staff'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {m.profile?.email || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm capitalize">{m.role}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {m.joined_at ? new Date(m.joined_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {canManageTeam && m.profile_id !== myProfileId ? (
                        <button
                          type="button"
                          onClick={() => void removeTeamMember(m.profile_id)}
                          className="h-8 px-3 rounded-lg border border-red-200 text-red-700 text-xs hover:bg-red-50"
                        >
                          Remove
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">
                          {m.profile_id === myProfileId ? 'You' : '—'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
