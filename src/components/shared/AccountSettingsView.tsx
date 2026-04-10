import { useRef, useState } from 'react';
import {
  Camera, CheckCircle, Eye, EyeOff, KeyRound, Lock, Mail,
  MapPin, Phone, Save, User as UserIcon, X,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

const BOROUGHS = ['Manhattan', 'Brooklyn', 'Queens', 'The Bronx', 'Staten Island'] as const;

interface Props {
  /** If true, hides borough field (staff/org users don't need it) */
  hideBorough?: boolean;
}

export function AccountSettingsView({ hideBorough = false }: Props) {
  const { user, profile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Avatar state ──────────────────────────────────────────────────────────
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.avatar ?? null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarMsg, setAvatarMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // ── Profile state ─────────────────────────────────────────────────────────
  const [profileForm, setProfileForm] = useState({
    name: profile?.full_name || user?.name || '',
    phone: profile?.phone || '',
    borough: profile?.borough || '',
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});

  // ── Password state ────────────────────────────────────────────────────────
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false });
  const [savingPw, setSavingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pwErrors, setPwErrors] = useState<Record<string, string>>({});

  if (!user) return null;

  const initials = user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const displayAvatar = avatarPreview ?? avatarUrl;

  // ── Avatar handlers ───────────────────────────────────────────────────────
  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setAvatarMsg({ ok: false, text: 'Image must be under 2 MB.' });
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setAvatarMsg(null);
  }

  function cancelAvatarChange() {
    setAvatarFile(null);
    setAvatarPreview(null);
    setAvatarMsg(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function saveAvatar() {
    if (!avatarFile || !user) return;
    try {
      setUploadingAvatar(true);
      setAvatarMsg(null);
      const ext = avatarFile.name.split('.').pop() ?? 'jpg';
      const path = `${user.id}/avatar.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from('avatars')
        .upload(path, avatarFile, { upsert: true, contentType: avatarFile.type });
      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
      // Bust cache with a timestamp query param
      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      const { error: profileErr } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);
      if (profileErr) throw profileErr;

      setAvatarUrl(publicUrl);
      setAvatarPreview(null);
      setAvatarFile(null);
      setAvatarMsg({ ok: true, text: 'Profile photo updated.' });
    } catch (err: any) {
      setAvatarMsg({ ok: false, text: err?.message || 'Failed to upload photo.' });
    } finally {
      setUploadingAvatar(false);
    }
  }

  // ── Profile handlers ──────────────────────────────────────────────────────
  function validateProfile() {
    const errs: Record<string, string> = {};
    if (!profileForm.name.trim()) errs.name = 'Full name is required.';
    if (profileForm.phone && !/^\d{7,15}$/.test(profileForm.phone.replace(/\s/g, '')))
      errs.phone = 'Enter a valid phone number (digits only).';
    return errs;
  }

  async function saveProfile() {
    if (!user) return;
    const errs = validateProfile();
    setProfileErrors(errs);
    if (Object.keys(errs).length > 0) return;
    try {
      setSavingProfile(true);
      setProfileMsg(null);
      const update: Record<string, unknown> = {
        full_name: profileForm.name.trim(),
        phone: profileForm.phone.trim() || null,
      };
      if (!hideBorough) update.borough = profileForm.borough || null;
      const { error } = await supabase.from('profiles').update(update).eq('id', user.id);
      if (error) throw error;
      setProfileMsg({ ok: true, text: 'Profile saved.' });
    } catch (err: any) {
      setProfileMsg({ ok: false, text: err?.message || 'Failed to save.' });
    } finally {
      setSavingProfile(false);
    }
  }

  // ── Password handlers ─────────────────────────────────────────────────────
  function validatePw() {
    const errs: Record<string, string> = {};
    if (!pwForm.current) errs.current = 'Current password is required.';
    if (!pwForm.next) errs.next = 'New password is required.';
    else if (pwForm.next.length < 8) errs.next = 'New password must be at least 8 characters.';
    if (pwForm.next !== pwForm.confirm) errs.confirm = 'Passwords do not match.';
    return errs;
  }

  async function changePassword() {
    const errs = validatePw();
    setPwErrors(errs);
    if (Object.keys(errs).length > 0) return;
    try {
      setSavingPw(true);
      setPwMsg(null);
      // Re-authenticate first to verify current password
      const { data: sessionData } = await supabase.auth.getSession();
      const email = sessionData.session?.user?.email;
      if (!email) throw new Error('Could not read session email.');
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password: pwForm.current });
      if (signInErr) { setPwErrors({ current: 'Incorrect current password.' }); return; }
      // Update to new password
      const { error: updateErr } = await supabase.auth.updateUser({ password: pwForm.next });
      if (updateErr) throw updateErr;
      setPwMsg({ ok: true, text: 'Password updated successfully.' });
      setPwForm({ current: '', next: '', confirm: '' });
    } catch (err: any) {
      setPwMsg({ ok: false, text: err?.message || 'Failed to update password.' });
    } finally {
      setSavingPw(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">

      {/* ── Avatar Card ── */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">Profile Photo</h2>
          <p className="text-xs text-gray-400 mt-0.5">JPG, PNG or WebP · max 2 MB</p>
        </div>
        <div className="p-6 flex items-center gap-5">
          {/* Avatar preview */}
          <div className="relative flex-shrink-0">
            {displayAvatar ? (
              <img
                src={displayAvatar}
                alt={user.name}
                className="w-20 h-20 rounded-full object-cover ring-2 ring-gray-100"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-teal-50 flex items-center justify-center ring-2 ring-gray-100">
                <span className="text-teal-600 font-bold text-2xl">{initials}</span>
              </div>
            )}
            {!avatarPreview && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-7 h-7 bg-teal-600 rounded-full flex items-center justify-center shadow-md hover:bg-teal-700 transition-colors"
              >
                <Camera className="w-3.5 h-3.5 text-white" />
              </button>
            )}
          </div>

          <div className="flex-1 space-y-3">
            {!avatarPreview ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="h-9 px-4 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Choose photo
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={uploadingAvatar}
                  onClick={() => void saveAvatar()}
                  className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 disabled:opacity-60 transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  {uploadingAvatar ? 'Uploading…' : 'Save photo'}
                </button>
                <button
                  type="button"
                  disabled={uploadingAvatar}
                  onClick={cancelAvatarChange}
                  className="flex items-center gap-1 h-9 px-3 rounded-lg border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 disabled:opacity-60 transition-colors"
                >
                  <X className="w-3.5 h-3.5" /> Cancel
                </button>
              </div>
            )}
            {avatarMsg && (
              <p className={`text-xs flex items-center gap-1.5 ${avatarMsg.ok ? 'text-green-600' : 'text-red-600'}`}>
                {avatarMsg.ok ? <CheckCircle className="w-3.5 h-3.5" /> : null}
                {avatarMsg.text}
              </p>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={onFileChange}
          />
        </div>
      </div>

      {/* ── Profile Card ── */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">Personal Information</h2>
        </div>
        <div className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Full Name <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={profileForm.name}
                onChange={(e) => { setProfileForm(p => ({ ...p, name: e.target.value })); setProfileErrors(p => ({ ...p, name: '' })); }}
                className={`w-full h-11 border rounded-xl pl-10 pr-3 text-sm outline-none transition-all focus:ring-2 focus:ring-teal-50 ${profileErrors.name ? 'border-red-300 focus:border-red-400' : 'border-gray-200 focus:border-teal-500'}`}
              />
            </div>
            {profileErrors.name && <p className="text-xs text-red-500 mt-1">{profileErrors.name}</p>}
          </div>

          {/* Email — read-only */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                disabled
                value={user.email}
                className="w-full h-11 border border-gray-100 rounded-xl pl-10 pr-3 text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">Email cannot be changed here.</p>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Phone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={profileForm.phone}
                inputMode="tel"
                onChange={(e) => { setProfileForm(p => ({ ...p, phone: e.target.value.replace(/[^\d\s+()-]/g, '') })); setProfileErrors(p => ({ ...p, phone: '' })); }}
                placeholder="(555) 000-0000"
                className={`w-full h-11 border rounded-xl pl-10 pr-3 text-sm outline-none transition-all focus:ring-2 focus:ring-teal-50 ${profileErrors.phone ? 'border-red-300 focus:border-red-400' : 'border-gray-200 focus:border-teal-500'}`}
              />
            </div>
            {profileErrors.phone && <p className="text-xs text-red-500 mt-1">{profileErrors.phone}</p>}
          </div>

          {/* Borough — only for clients */}
          {!hideBorough && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Borough</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={profileForm.borough}
                  onChange={(e) => setProfileForm(p => ({ ...p, borough: e.target.value }))}
                  className="w-full h-11 border border-gray-200 rounded-xl pl-10 pr-3 text-sm bg-white outline-none transition-all focus:border-teal-500 focus:ring-2 focus:ring-teal-50"
                >
                  <option value="">Select borough</option>
                  {BOROUGHS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
            </div>
          )}

          {profileMsg && (
            <p className={`text-sm flex items-center gap-1.5 ${profileMsg.ok ? 'text-green-600' : 'text-red-600'}`}>
              {profileMsg.ok && <CheckCircle className="w-4 h-4" />}
              {profileMsg.text}
            </p>
          )}

          <button
            type="button"
            disabled={savingProfile}
            onClick={() => void saveProfile()}
            className="flex items-center gap-2 h-10 px-5 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 disabled:opacity-60 transition-colors"
          >
            <Save className="w-4 h-4" />
            {savingProfile ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* ── Password Card ── */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-gray-500" />
            <h2 className="text-base font-bold text-gray-900">Change Password</h2>
          </div>
        </div>
        <div className="p-6 space-y-4">
          {(['current', 'next', 'confirm'] as const).map((field) => {
            const labels = { current: 'Current Password', next: 'New Password', confirm: 'Confirm New Password' };
            return (
              <div key={field}>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  {labels[field]}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPw[field] ? 'text' : 'password'}
                    value={pwForm[field]}
                    onChange={(e) => { setPwForm(p => ({ ...p, [field]: e.target.value })); setPwErrors(p => ({ ...p, [field]: '' })); }}
                    placeholder="••••••••"
                    className={`w-full h-11 border rounded-xl pl-10 pr-10 text-sm outline-none transition-all focus:ring-2 focus:ring-teal-50 ${pwErrors[field] ? 'border-red-300 focus:border-red-400' : 'border-gray-200 focus:border-teal-500'}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(p => ({ ...p, [field]: !p[field] }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPw[field] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {pwErrors[field] && <p className="text-xs text-red-500 mt-1">{pwErrors[field]}</p>}
              </div>
            );
          })}

          {pwMsg && (
            <p className={`text-sm flex items-center gap-1.5 ${pwMsg.ok ? 'text-green-600' : 'text-red-600'}`}>
              {pwMsg.ok && <CheckCircle className="w-4 h-4" />}
              {pwMsg.text}
            </p>
          )}

          <button
            type="button"
            disabled={savingPw}
            onClick={() => void changePassword()}
            className="flex items-center gap-2 h-10 px-5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 disabled:opacity-60 transition-colors"
          >
            <KeyRound className="w-4 h-4" />
            {savingPw ? 'Updating…' : 'Update Password'}
          </button>
        </div>
      </div>
    </div>
  );
}
