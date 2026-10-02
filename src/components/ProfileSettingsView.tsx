import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApplications } from '../context/ApplicationContext';
import { notificationService } from '../lib/notificationService';
import {
  User,
  Mail,
  Camera,
  Trash2,
  Save,
  ShieldCheck,
  Key,
  CheckCircle2,
  AlertCircle,
  Database,
  Bell,
  Globe,
  Smartphone,
  Check,
  CheckCheck,
} from 'lucide-react';

const NotificationSettingsCard: React.FC = () => {
  const { notificationPreferences, updateNotificationPreferences, showToast } = useApplications();
  const [daysBefore, setDaysBefore] = useState<number[]>(
    notificationPreferences.default_days_before || [2, 1]
  );
  const [emailEnabled, setEmailEnabled] = useState(
    notificationPreferences.email_enabled ?? true
  );
  const [inAppEnabled, setInAppEnabled] = useState(
    notificationPreferences.in_app_enabled ?? true
  );
  const [pushEnabled, setPushEnabled] = useState(
    notificationPreferences.push_enabled ?? false
  );
  const [timezone, setTimezone] = useState(
    notificationPreferences.timezone || 'Asia/Kolkata'
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (notificationPreferences) {
      setDaysBefore(notificationPreferences.default_days_before || [2, 1]);
      setEmailEnabled(notificationPreferences.email_enabled ?? true);
      setInAppEnabled(notificationPreferences.in_app_enabled ?? true);
      setPushEnabled(notificationPreferences.push_enabled ?? false);
      setTimezone(notificationPreferences.timezone || 'Asia/Kolkata');
    }
  }, [notificationPreferences]);

  const toggleDay = (day: number) => {
    if (daysBefore.includes(day)) {
      setDaysBefore(daysBefore.filter((d) => d !== day));
    } else {
      setDaysBefore([...daysBefore, day].sort((a, b) => b - a));
    }
  };

  const handleTestPush = async () => {
    const success = await notificationService.sendTestNotification();
    if (success) {
      showToast('Test notification sent to this phone/browser!', 'success');
    } else {
      showToast('Please enable notifications in your browser/device permissions.', 'error');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (pushEnabled) {
        await notificationService.requestPermission();
      }
      await updateNotificationPreferences({
        default_days_before: daysBefore,
        email_enabled: emailEnabled,
        in_app_enabled: inAppEnabled,
        push_enabled: pushEnabled,
        timezone,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Notifications & Reminders
            </h3>
            <p className="text-xs text-slate-500">
              Set universal reminder defaults for assessments, interviews, and deadlines
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Default Intervals */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Default Reminder Intervals
          </label>
          <p className="text-xs text-slate-500">
            Automated alerts scheduled prior to an event (you can always override per stage)
          </p>

          <div className="flex flex-wrap gap-2.5 pt-2">
            {[
              { days: 7, label: '7 days before' },
              { days: 3, label: '3 days before' },
              { days: 2, label: '2 days before (Recommended)' },
              { days: 1, label: '1 day before (Tomorrow)' },
              { days: 0, label: 'On event day' },
            ].map(({ days, label }) => {
              const active = daysBefore.includes(days);
              return (
                <button
                  type="button"
                  key={days}
                  onClick={() => toggleDay(days)}
                  className={`text-xs px-3.5 py-2 rounded-xl border font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    active
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {active && <Check className="w-3.5 h-3.5" />}
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Channels */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Notification Delivery Methods
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <label
              className={`p-3.5 rounded-2xl border flex items-center gap-3 cursor-pointer transition-all ${
                emailEnabled
                  ? 'bg-blue-50/80 border-blue-300 text-blue-900 font-bold'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              <input
                type="checkbox"
                checked={emailEnabled}
                onChange={(e) => setEmailEnabled(e.target.checked)}
                className="rounded text-blue-600 focus:ring-0 w-4 h-4"
              />
              <div>
                <div className="text-xs font-bold flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-blue-600" /> Email Alerts
                </div>
                <div className="text-[10px] text-slate-500 font-normal">
                  Sent to your verified email
                </div>
              </div>
            </label>

            <label
              className={`p-3.5 rounded-2xl border flex items-center gap-3 cursor-pointer transition-all ${
                inAppEnabled
                  ? 'bg-blue-50/80 border-blue-300 text-blue-900 font-bold'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              <input
                type="checkbox"
                checked={inAppEnabled}
                onChange={(e) => setInAppEnabled(e.target.checked)}
                className="rounded text-blue-600 focus:ring-0 w-4 h-4"
              />
              <div>
                <div className="text-xs font-bold flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-blue-600" /> In-App Bell
                </div>
                <div className="text-[10px] text-slate-500 font-normal">
                  Topbar bell & dashboard
                </div>
              </div>
            </label>

            <label
              className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                pushEnabled
                  ? 'bg-blue-50/80 border-blue-300 text-blue-900 font-bold'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={pushEnabled}
                  onChange={async (e) => {
                    const checked = e.target.checked;
                    setPushEnabled(checked);
                    if (checked) {
                      await notificationService.requestPermission();
                    }
                  }}
                  className="rounded text-blue-600 focus:ring-0 w-4 h-4"
                />
                <div>
                  <div className="text-xs font-bold flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-blue-600" /> Push Notifications
                  </div>
                  <div className="text-[10px] text-slate-500 font-normal">
                    Browser & Android PWA
                  </div>
                </div>
              </div>

              {pushEnabled && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleTestPush();
                  }}
                  className="text-[10px] bg-blue-600 hover:bg-blue-700 text-white font-bold px-2 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  Test Alert
                </button>
              )}
            </label>
          </div>
        </div>

        {/* Timezone */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-blue-600" /> Server Timezone
          </label>
          <div className="flex items-center gap-3">
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-blue-500"
            >
              <option value="Asia/Kolkata">Asia/Kolkata (IST - UTC+05:30)</option>
              <option value="UTC">UTC (Universal Time)</option>
              <option value="America/New_York">America/New_York (EST/EDT)</option>
              <option value="America/Los_Angeles">America/Los_Angeles (PST/PDT)</option>
              <option value="Europe/London">Europe/London (GMT/BST)</option>
            </select>
            <span className="text-[11px] text-slate-500">
              Scheduled reminders run daily at 00:01 AM local time
            </span>
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-100">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />{' '}
            {saving ? 'Saving...' : 'Save Notification Preferences'}
          </button>
        </div>
      </form>
    </div>
  );
};

export const ProfileSettingsView: React.FC = () => {
  const { user, profile, updateUserProfile, uploadAvatar, isDemoMode, isConfigured } = useAuth();
  const { showToast } = useApplications();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setEmail(profile.email || user?.email || '');
      setPhotoUrl(profile.profile_photo_url || null);
    } else if (user) {
      setFullName(user.user_metadata?.full_name || '');
      setEmail(user.email || '');
    }
  }, [profile, user]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        showToast('Please upload a valid image (PNG, JPG, WEBP)', 'error');
        return;
      }
      setUploadingPhoto(true);
      try {
        const url = await uploadAvatar(file);
        setPhotoUrl(url);
        showToast('Profile photo updated successfully!', 'success');
      } catch (err: unknown) {
        console.error(err);
        const msg = err instanceof Error ? err.message : 'Photo upload failed';
        showToast(msg, 'error');
      } finally {
        setUploadingPhoto(false);
      }
    }
  };

  const handleRemovePhoto = async () => {
    if (window.confirm('Remove your profile photo?')) {
      try {
        await updateUserProfile({ profile_photo_url: null });
        setPhotoUrl(null);
        showToast('Profile photo removed', 'info');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to remove photo';
        showToast(msg, 'error');
      }
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      showToast('Name cannot be empty', 'error');
      return;
    }
    setSaving(true);
    try {
      await updateUserProfile({
        full_name: fullName.trim(),
        email: email.trim(),
      });
      showToast('Profile updated successfully!', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update profile';
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Profile & Account Settings</h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage your personal details, profile avatar, and Supabase identity credentials
        </p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        {/* Photo Upload Section */}
        <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-100">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-3xl font-extrabold shadow-md border-4 border-white">
              {photoUrl ? (
                <img src={photoUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                fullName.charAt(0).toUpperCase() || 'U'
              )}
            </div>

            <label
              htmlFor="photo-upload-input"
              className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full shadow-md cursor-pointer hover:bg-blue-700 transition-transform group-hover:scale-110"
              title="Upload / Change Photo"
            >
              <Camera className="w-4 h-4" />
              <input
                id="photo-upload-input"
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                disabled={uploadingPhoto}
                className="hidden"
              />
            </label>
          </div>

          <div className="space-y-1.5 text-center sm:text-left flex-1">
            <h3 className="text-lg font-bold text-slate-900">{fullName || 'Your Name'}</h3>
            <p className="text-xs text-slate-500">{email || 'your.email@example.com'}</p>
            <div className="flex flex-wrap items-center gap-2 pt-2 justify-center sm:justify-start">
              <label
                htmlFor="photo-upload-input"
                className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-xl cursor-pointer transition-colors"
              >
                {uploadingPhoto ? 'Uploading...' : photoUrl ? 'Replace Photo' : 'Upload Photo'}
              </label>
              {photoUrl && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-xl cursor-pointer transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Photos are stored in Supabase Storage bucket: <code className="text-slate-600">profile-photos</code>
            </p>
          </div>
        </div>

        {/* Update Form */}
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" /> Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your Full Name"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-blue-600" /> Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* SECTION 25: Settings -> Notifications & Reminders */}
      <NotificationSettingsCard />

      {/* Security & RLS Context */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Row Level Security (RLS) User Context</h3>
            <p className="text-xs text-slate-500">Every application and file you store is bound to your user identity.</p>
          </div>
        </div>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-semibold">User ID (auth.uid()):</span>
            <code className="text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200 font-mono text-[11px]">
              {user?.id || 'demo-user-1'}
            </code>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-semibold">Database Mode:</span>
            <span className="font-bold text-blue-600 flex items-center gap-1">
              <Database className="w-3.5 h-3.5" />
              {isConfigured ? 'Live Supabase PostgreSQL' : 'Local / Demo Mode (Ready for Supabase credentials)'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-semibold">Row Level Security:</span>
            <span className="text-emerald-700 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Enforced by User ID
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
