import { Reminder, ReminderEventType, Application } from '../types/database';

/**
 * Calculates reminder dates based on the event date and selected days before.
 * Correctly offsets dates according to local calendar days.
 */
export function calculateReminderDates(
  eventDateStr: string,
  daysBeforeList: number[]
): { daysBefore: number; reminderDate: string }[] {
  if (!eventDateStr) return [];

  // Parse YYYY-MM-DD
  const [year, month, day] = eventDateStr.split('-').map(Number);
  if (!year || !month || !day) return [];

  const results: { daysBefore: number; reminderDate: string }[] = [];
  const uniqueDays = Array.from(new Set(daysBeforeList)).sort((a, b) => b - a);

  for (const days of uniqueDays) {
    const d = new Date(Date.UTC(year, month - 1, day));
    d.setUTCDate(d.getUTCDate() - days);

    const remYear = d.getUTCFullYear();
    const remMonth = String(d.getUTCMonth() + 1).padStart(2, '0');
    const remDay = String(d.getUTCDate()).padStart(2, '0');

    results.push({
      daysBefore: days,
      reminderDate: `${remYear}-${remMonth}-${remDay}`,
    });
  }

  return results;
}

/**
 * Formats a clean human-readable reminder headline based on event type and days remaining.
 * Example: "Online Assessment is in 2 days", "Technical Interview is tomorrow", "Application deadline is in 2 days"
 */
export function formatReminderHeadline(
  eventType: string,
  eventTitle: string,
  daysBefore: number,
  companyName?: string
): string {
  const subject = eventType === 'Custom Reminder' || !eventType ? eventTitle : eventType;

  if (daysBefore === 1) {
    return companyName ? `${subject} with ${companyName} is tomorrow` : `${subject} is tomorrow`;
  }
  if (daysBefore === 0) {
    return companyName ? `${subject} with ${companyName} is today` : `${subject} is today`;
  }
  if (daysBefore === 2) {
    return companyName ? `${subject} with ${companyName} is in 2 days` : `${subject} is in 2 days`;
  }
  return companyName
    ? `${subject} with ${companyName} is in ${daysBefore} days`
    : `${subject} is in ${daysBefore} days`;
}

/**
 * Formats a detailed email notification body matching the exact requirements.
 */
export function formatEmailNotification(
  userName: string,
  eventType: string,
  companyName: string,
  jobTitle: string,
  eventDate: string,
  daysBefore: number,
  notes?: string | null
): { subject: string; body: string } {
  const subject = `Reminder — ${eventType} at ${companyName}`;

  const formattedDate = new Date(eventDate + 'T00:00:00').toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const relativeText =
    daysBefore === 0
      ? 'on the event day'
      : daysBefore === 1
      ? '1 day before the event'
      : `${daysBefore} days before the event`;

  const body = `Hi ${userName || 'there'},

Reminder:

Your ${eventType} for:
${jobTitle || 'Application'}
${companyName}

is scheduled for:
${formattedDate}

This reminder was sent ${relativeText}.
${notes ? `\nNotes: ${notes}\n` : ''}
Job & Internship Tracker`;

  return { subject, body };
}

/**
 * Determines relative time label for UI: Today, Tomorrow, In 2 days, In X days, Overdue.
 */
export function getRelativeTimeLabel(targetDateStr: string): {
  label: string;
  badgeClass: string;
  isUrgent: boolean;
  isToday: boolean;
  isTomorrow: boolean;
} {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [y, m, d] = targetDateStr.split('-').map(Number);
  const target = new Date(y, m - 1, d);
  target.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const overdueDays = Math.abs(diffDays);
    return {
      label: overdueDays === 1 ? '1 day overdue' : `${overdueDays} days overdue`,
      badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
      isUrgent: true,
      isToday: false,
      isTomorrow: false,
    };
  }

  if (diffDays === 0) {
    return {
      label: 'Today',
      badgeClass: 'bg-amber-100 text-amber-900 border-amber-300 font-bold',
      isUrgent: true,
      isToday: true,
      isTomorrow: false,
    };
  }

  if (diffDays === 1) {
    return {
      label: 'Tomorrow',
      badgeClass: 'bg-blue-100 text-blue-900 border-blue-300 font-bold',
      isUrgent: true,
      isToday: false,
      isTomorrow: true,
    };
  }

  if (diffDays === 2) {
    return {
      label: 'In 2 days',
      badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      isUrgent: false,
      isToday: false,
      isTomorrow: false,
    };
  }

  return {
    label: target.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    isUrgent: false,
    isToday: false,
    isTomorrow: false,
  };
}

/**
 * Returns distinct styling and iconography class for each stage and event type.
 */
export function getEventTypeBadge(eventType: string): {
  bgClass: string;
  textClass: string;
  dotClass: string;
} {
  switch (eventType) {
    case 'Online Assessment':
      return { bgClass: 'bg-purple-50 text-purple-700 border-purple-200', textClass: 'text-purple-700', dotClass: 'bg-purple-500' };
    case 'Technical Interview':
      return { bgClass: 'bg-blue-50 text-blue-700 border-blue-200', textClass: 'text-blue-700', dotClass: 'bg-blue-500' };
    case 'HR Interview':
    case 'Final Interview':
      return { bgClass: 'bg-teal-50 text-teal-700 border-teal-200', textClass: 'text-teal-700', dotClass: 'bg-teal-500' };
    case 'Application Deadline':
      return { bgClass: 'bg-rose-50 text-rose-700 border-rose-200', textClass: 'text-rose-700', dotClass: 'bg-rose-500' };
    case 'Follow-up':
      return { bgClass: 'bg-amber-50 text-amber-700 border-amber-200', textClass: 'text-amber-700', dotClass: 'bg-amber-500' };
    case 'Shortlisted':
      return { bgClass: 'bg-emerald-50 text-emerald-700 border-emerald-200', textClass: 'text-emerald-700', dotClass: 'bg-emerald-500' };
    case 'Offer Received':
    case 'Selected':
      return { bgClass: 'bg-green-50 text-green-700 border-green-200', textClass: 'text-green-700', dotClass: 'bg-green-500' };
    default:
      return { bgClass: 'bg-slate-50 text-slate-700 border-slate-200', textClass: 'text-slate-700', dotClass: 'bg-slate-500' };
  }
}
