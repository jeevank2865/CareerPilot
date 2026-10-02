import React, { useState } from 'react';
import { useApplications } from '../context/ApplicationContext';
import { useAuth } from '../context/AuthContext';
import { notificationService } from '../lib/notificationService';
import { formatEmailNotification } from '../lib/reminderService';
import { REMINDER_EVENT_TYPES, ReminderEventType } from '../types/database';
import {
  Bell,
  Calendar,
  Clock,
  Building,
  Check,
  X,
  Mail,
  Smartphone,
  Sparkles,
} from 'lucide-react';

interface AddCustomReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultApplicationId?: string;
}

export const AddCustomReminderModal: React.FC<AddCustomReminderModalProps> = ({
  isOpen,
  onClose,
  defaultApplicationId,
}) => {
  const { user } = useAuth();
  const { applications, createCustomReminder, notificationPreferences, showToast } =
    useApplications();

  const [selectedAppId, setSelectedAppId] = useState<string>(
    defaultApplicationId || (applications[0]?.id ?? '')
  );
  const [eventType, setEventType] = useState<ReminderEventType>('Custom Reminder');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(
    new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]
  );
  const [time, setTime] = useState('10:00');
  const [description, setDescription] = useState('');

  // Reminder intervals
  const [daysBefore, setDaysBefore] = useState<number[]>(
    notificationPreferences.default_days_before || [2, 1]
  );

  // Channels
  const [emailEnabled, setEmailEnabled] = useState(
    notificationPreferences.email_enabled ?? true
  );
  const [inAppEnabled, setInAppEnabled] = useState(
    notificationPreferences.in_app_enabled ?? true
  );
  const [pushEnabled, setPushEnabled] = useState(
    notificationPreferences.push_enabled ?? false
  );

  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const toggleDayInterval = (day: number) => {
    if (daysBefore.includes(day)) {
      setDaysBefore(daysBefore.filter((d) => d !== day));
    } else {
      setDaysBefore([...daysBefore, day].sort((a, b) => b - a));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppId) {
      showToast('Please select an application', 'error');
      return;
    }
    if (!title.trim()) {
      showToast('Please enter a reminder title', 'error');
      return;
    }
    if (!date) {
      showToast('Please select a reminder date', 'error');
      return;
    }

    setSaving(true);
    try {
      await createCustomReminder(selectedAppId, {
        title: title.trim(),
        eventType,
        date,
        time: time || undefined,
        description: description.trim() || undefined,
        daysBefore: daysBefore.length > 0 ? daysBefore : [2, 1],
        email: emailEnabled,
        inApp: inAppEnabled,
        push: pushEnabled,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600 text-white rounded-xl shadow-xs">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">Add Reminder</h2>
              <p className="text-xs text-slate-500">
                Universal reminder for any stage, assessment, interview, or deadline
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-white rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          {/* Target Application */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Related Application *
            </label>
            <select
              value={selectedAppId}
              onChange={(e) => setSelectedAppId(e.target.value)}
              required
              className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-hidden cursor-pointer"
            >
              {applications.map((app) => (
                <option key={app.id} value={app.id}>
                  {app.company_name} — {app.job_title} ({app.current_stage})
                </option>
              ))}
            </select>
          </div>

          {/* Event Type & Preset */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Event Type
            </label>
            <select
              value={eventType}
              onChange={(e) => {
                const val = e.target.value as ReminderEventType;
                setEventType(val);
                if (!title || title === eventType) {
                  setTitle(val === 'Custom Reminder' ? '' : val);
                }
              }}
              className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-hidden cursor-pointer"
            >
              {REMINDER_EVENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Reminder Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Submit coding assignment, Online Assessment, HR round"
              required
              className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-hidden font-medium"
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Event Date *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-hidden font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Event Time (Optional)
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-hidden font-medium"
              />
            </div>
          </div>

          {/* Reminder Schedule Intervals */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Reminder Schedule Intervals
            </label>
            <p className="text-[11px] text-slate-500">
              When should automated reminders be delivered before the event?
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {[
                { days: 7, label: '7 days before' },
                { days: 3, label: '3 days before' },
                { days: 2, label: '2 days before' },
                { days: 1, label: '1 day before (Tomorrow)' },
                { days: 0, label: 'On event day' },
              ].map(({ days, label }) => {
                const active = daysBefore.includes(days);
                return (
                  <button
                    type="button"
                    key={days}
                    onClick={() => toggleDayInterval(days)}
                    className={`text-xs px-3 py-1.5 rounded-xl border font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
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

          {/* Notification Channels */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Notification Delivery Channels
            </label>
            <div className="grid grid-cols-3 gap-2">
              <label
                className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                  emailEnabled
                    ? 'bg-blue-50/80 border-blue-300 text-blue-900 font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <input
                  type="checkbox"
                  checked={emailEnabled}
                  onChange={(e) => setEmailEnabled(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-0"
                />
                <Mail className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-xs">Email</span>
              </label>

              <label
                className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                  inAppEnabled
                    ? 'bg-blue-50/80 border-blue-300 text-blue-900 font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <input
                  type="checkbox"
                  checked={inAppEnabled}
                  onChange={(e) => setInAppEnabled(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-0"
                />
                <Bell className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-xs">In-App</span>
              </label>

              <label
                className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                  pushEnabled
                    ? 'bg-blue-50/80 border-blue-300 text-blue-900 font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <input
                  type="checkbox"
                  checked={pushEnabled}
                  onChange={async (e) => {
                    const checked = e.target.checked;
                    setPushEnabled(checked);
                    if (checked) {
                      const res = await notificationService.requestPermission();
                      if (res === 'granted') {
                        showToast('Phone notifications enabled for this device!', 'success');
                      } else {
                        showToast('Please enable notifications in your browser/device settings', 'info');
                      }
                    }
                  }}
                  className="rounded text-blue-600 focus:ring-0"
                />
                <Smartphone className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-xs">Push</span>
              </label>
            </div>

            <div className="pt-1.5 text-[11px] text-slate-500 space-y-1">
              {emailEnabled && (
                <div className="text-blue-700 flex items-center gap-1.5 font-medium">
                  <Mail className="w-3.5 h-3.5 shrink-0" />
                  <span>Email alerts scheduled for: <strong>{user?.email || 'srangaswamy042@gmail.com'}</strong></span>
                </div>
              )}
              {pushEnabled && (
                <div className="text-emerald-700 flex items-center gap-1.5 font-medium">
                  <Smartphone className="w-3.5 h-3.5 shrink-0" />
                  <span>Push alerts active on this device & mobile browser</span>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Description / Preparation Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Bring updated resume copy, review graphs and DP problems..."
              className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-hidden font-medium resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-xs font-extrabold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              {saving ? 'Scheduling...' : 'Set Universal Reminder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
