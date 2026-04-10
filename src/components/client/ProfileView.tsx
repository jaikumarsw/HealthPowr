import { useState } from 'react';
import { Edit, Save, User as UserIcon, Mail, Phone, MapPin } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

const BOROUGHS = [
  'Manhattan',
  'Brooklyn',
  'Queens',
  'The Bronx',
  'Staten Island',
] as const;

function isValidEmail(email: string) {
  // Simple, practical validation for UI (auth provider enforces correctness).
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function digitsOnly(value: string) {
  return value.replace(/[^\d]/g, '');
}

export function ProfileView() {
  const { user, profile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ phone?: string; borough?: string; email?: string }>({});
  const [profileData, setProfileData] = useState({
    name: profile?.full_name || user?.name || '',
    email: user?.email || '',
    phone: profile?.phone || '',
    borough: profile?.borough || ''
  });

  const handleSave = async () => {
    if (!user) return;
    try {
      setIsSaving(true);
      setMessage(null);
      const nextErrors: typeof errors = {};

      if (profileData.email && !isValidEmail(profileData.email)) {
        nextErrors.email = 'Please enter a valid email address.';
      }

      if (profileData.phone && !/^\d+$/.test(profileData.phone)) {
        nextErrors.phone = 'Phone must contain digits only.';
      }

      if (profileData.borough && !BOROUGHS.includes(profileData.borough as any)) {
        nextErrors.borough = 'Please select a borough from the list.';
      }

      setErrors(nextErrors);
      if (Object.keys(nextErrors).length > 0) return;

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profileData.name,
          phone: profileData.phone || null,
          borough: profileData.borough || null
        })
        .eq('id', user.id);
      if (error) throw error;
      setIsEditing(false);
      setMessage('Profile updated successfully.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-teal-50 rounded-full flex items-center justify-center">
              <UserIcon className="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">My Profile</h1>
              <p className="text-sm text-gray-500">Community Member</p>
            </div>
          </div>
          <button
            onClick={() => setIsEditing((v) => !v)}
            className="h-10 px-3 rounded-lg border border-gray-200 text-sm flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            {isEditing ? 'Cancel' : 'Edit'}
          </button>
        </div>
      </div>

      {!isEditing ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 pb-5 border-b border-gray-100">
            <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-teal-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[12px] text-gray-500 uppercase tracking-wide">
                Name
              </p>
              <p className="text-[18px] font-bold text-gray-900 truncate">
                {profileData.name || '—'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-5">
            <div className="rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 text-gray-400">
                <Mail className="w-4 h-4" />
                <p className="text-[11px] font-semibold uppercase">Email</p>
              </div>
              <p className="mt-2 text-[14px] font-semibold text-gray-900 break-all">
                {profileData.email || '—'}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 text-gray-400">
                <Phone className="w-4 h-4" />
                <p className="text-[11px] font-semibold uppercase">Phone</p>
              </div>
              <p className="mt-2 text-[14px] font-semibold text-gray-900">
                {profileData.phone || '—'}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 p-4 md:col-span-2">
              <div className="flex items-center gap-2 text-gray-400">
                <MapPin className="w-4 h-4" />
                <p className="text-[11px] font-semibold uppercase">Borough</p>
              </div>
              <p className="mt-2 text-[14px] font-semibold text-gray-900">
                {profileData.borough || '—'}
              </p>
            </div>
          </div>

          {message && <p className="text-sm text-gray-600 mt-4">{message}</p>}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
          <div className="rounded-xl border border-teal-200 bg-teal-50/40 p-4">
            <p className="text-sm font-semibold text-teal-900">
              You’re editing your profile
            </p>
            <p className="text-xs text-teal-800 mt-1">
              Update your phone number and borough, then save changes.
            </p>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Full Name</label>
            <input
              value={profileData.name}
              onChange={(e) =>
                setProfileData((prev) => ({ ...prev, name: e.target.value }))
              }
              className="w-full h-11 border border-gray-200 rounded-lg px-3"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Email</label>
            <input
              disabled
              type="email"
              value={profileData.email}
              className="w-full h-11 border border-gray-200 rounded-lg px-3 bg-gray-50"
            />
            {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email}</p>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Phone</label>
              <input
                value={profileData.phone}
                inputMode="numeric"
                pattern="\d*"
                onChange={(e) => {
                  const next = digitsOnly(e.target.value);
                  setProfileData((prev) => ({ ...prev, phone: next }));
                  if (errors.phone) setErrors((p) => ({ ...p, phone: undefined }));
                }}
                className="w-full h-11 border border-gray-200 rounded-lg px-3"
              />
              {errors.phone && <p className="text-sm text-red-600 mt-1">{errors.phone}</p>}
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Borough</label>
              <select
                value={profileData.borough}
                onChange={(e) => {
                  setProfileData((prev) => ({ ...prev, borough: e.target.value }));
                  if (errors.borough) setErrors((p) => ({ ...p, borough: undefined }));
                }}
                className="w-full h-11 border border-gray-200 rounded-lg px-3 bg-white"
              >
                <option value="">Select borough</option>
                {BOROUGHS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
              {errors.borough && <p className="text-sm text-red-600 mt-1">{errors.borough}</p>}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={isSaving}
              onClick={() => void handleSave()}
              className="h-11 px-4 rounded-lg bg-teal-600 text-white text-sm font-medium flex items-center gap-2 disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Profile'}
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={() => setIsEditing(false)}
              className="h-11 px-4 rounded-lg border border-gray-200 text-gray-700 text-sm hover:bg-gray-50 disabled:opacity-60"
            >
              Cancel
            </button>
          </div>

          {message && <p className="text-sm text-gray-600">{message}</p>}
        </div>
      )}
    </div>
  );
}
