import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import {
  Application,
  ApplicationStage,
  ApplicationStatus,
  ApplicationTimelineEvent,
  Reminder,
  NotificationPreferences,
} from '../types/database';
import { dataService, SAMPLE_GOOGLE_APPLICATION } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { getRelativeTimeLabel, calculateReminderDates } from '../lib/reminderService';
import { notificationService } from '../lib/notificationService';
import confetti from 'canvas-confetti';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export interface UpcomingTaskItem {
  id: string;
  reminderId?: string;
  timelineEventId?: string | null;
  applicationId: string;
  eventType: string;
  title: string;
  companyName: string;
  jobTitle: string;
  eventDate: string;
  eventTime?: string | null;
  reminderDate?: string;
  daysRemaining: number;
  relativeLabel: string;
  badgeClass: string;
  isToday: boolean;
  isTomorrow: boolean;
  isUrgent: boolean;
  isCompleted?: boolean;
}

interface ApplicationContextType {
  applications: Application[];
  loading: boolean;
  selectedApplication: Application | null;
  setSelectedApplication: (app: Application | null) => void;
  refreshApplications: () => Promise<void>;
  createApplication: (
    appData: Omit<Application, 'id' | 'created_at' | 'updated_at'>,
    resumeFile?: File | null
  ) => Promise<Application>;
  updateApplication: (
    id: string,
    updates: Partial<Application>,
    resumeFile?: File | null
  ) => Promise<Application>;
  deleteApplication: (id: string) => Promise<void>;
  quickUpdateStage: (
    id: string,
    stage: ApplicationStage,
    status?: ApplicationStatus,
    stageDate?: string,
    reminderDays?: number[]
  ) => Promise<void>;

  // Timeline & Universal Reminders
  addTimelineEntry: (
    appId: string,
    event: {
      event_title: string;
      event_description?: string;
      event_type?: string;
      event_date?: string;
      event_time?: string | null;
      reminder_enabled?: boolean;
      custom_reminder_days?: number[];
    }
  ) => Promise<ApplicationTimelineEvent | undefined>;
  deleteTimelineEntry: (eventId: string, appId: string) => Promise<void>;
  updateTimelineEntry: (
    eventId: string,
    appId: string,
    updates: Partial<ApplicationTimelineEvent>
  ) => Promise<void>;
  markTimelineEventCompleted: (
    eventId: string,
    appId: string,
    isCompleted: boolean
  ) => Promise<void>;

  // Reminders
  reminders: Reminder[];
  refreshReminders: () => Promise<void>;
  createCustomReminder: (
    appId: string,
    data: {
      title: string;
      date: string;
      time?: string;
      description?: string;
      daysBefore?: number[];
      eventType?: string;
      email?: boolean;
      inApp?: boolean;
      push?: boolean;
    }
  ) => Promise<Reminder>;
  cancelReminder: (reminderId: string) => Promise<void>;
  markAllRemindersRead: () => Promise<void>;

  // Notification Preferences
  notificationPreferences: NotificationPreferences;
  updateNotificationPreferences: (
    prefs: Partial<NotificationPreferences>
  ) => Promise<void>;

  // Aggregated upcoming tasks for Dashboard, Notification Bell & Calendar
  upcomingTasks: UpcomingTaskItem[];
  activeRemindersCount: number;

  addSampleApplication: () => Promise<void>;
  toasts: Toast[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;

  // Stats
  stats: {
    total: number;
    applied: number;
    inProgress: number;
    interviews: number;
    selected: number;
    rejected: number;
    shortlisted: number;
    offers: number;
    thisMonth: number;
  };
  followUpApplications: Application[];
  upcomingInterviews: Application[];
  recentApplications: Application[];
}

const ApplicationContext = createContext<ApplicationContextType | undefined>(
  undefined
);

export const ApplicationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [notificationPreferences, setNotificationPreferences] =
    useState<NotificationPreferences>({
      user_id: '',
      default_days_before: [2, 1],
      email_enabled: true,
      in_app_enabled: true,
      push_enabled: false,
      timezone: 'Asia/Kolkata',
    });

  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] =
    useState<Application | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback(
    (message: string, type: 'success' | 'error' | 'info' = 'success') => {
      const id =
        'toast-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4500);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const refreshApplications = useCallback(async () => {
    if (!user) {
      setApplications([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await dataService.getApplications(user.id);
      setApplications(data);
    } catch (err: unknown) {
      console.error('Failed to load applications:', err);
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch applications';
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  }, [user, showToast]);

  const refreshReminders = useCallback(async () => {
    if (!user) {
      setReminders([]);
      return;
    }
    try {
      const data = await dataService.getReminders(user.id);
      setReminders(data);
    } catch (err) {
      console.error('Failed to load reminders:', err);
    }
  }, [user]);

  const loadPreferences = useCallback(async () => {
    if (!user) return;
    try {
      const prefs = await dataService.getNotificationPreferences(user.id);
      setNotificationPreferences(prefs);
    } catch (e) {
      console.error('Failed to load preferences:', e);
    }
  }, [user]);

  useEffect(() => {
    refreshApplications();
    refreshReminders();
    loadPreferences();
  }, [refreshApplications, refreshReminders, loadPreferences]);

  // Keep selectedApplication synced
  useEffect(() => {
    if (selectedApplication) {
      const latest = applications.find((a) => a.id === selectedApplication.id);
      if (latest) {
        setSelectedApplication(latest);
      }
    }
  }, [applications]);

  const createApplication = async (
    appData: Omit<Application, 'id' | 'created_at' | 'updated_at'>,
    resumeFile?: File | null
  ): Promise<Application> => {
    if (!user) throw new Error('User not authenticated');

    try {
      let created = await dataService.createApplication({
        ...appData,
        user_id: user.id,
      });

      // Handle resume file if uploaded
      if (resumeFile) {
        try {
          const uploadRes = await dataService.uploadResume(
            user.id,
            created.id,
            resumeFile
          );
          created = await dataService.updateApplication(created.id, {
            resume_file_name: uploadRes.name,
            resume_file_path: uploadRes.path,
            resume_file_type: uploadRes.type,
            resume_file_size: uploadRes.size,
            resume_uploaded_at: new Date().toISOString(),
          });
        } catch (resErr) {
          console.warn('Resume upload error:', resErr);
          showToast('Application created, but resume upload failed', 'error');
        }
      }

      // Automatically add initial timeline event
      try {
        await dataService.addTimelineEvent({
          application_id: created.id,
          user_id: user.id,
          event_type: 'Application',
          event_title: `Applied to ${created.company_name}`,
          event_description: `Role: ${created.job_title} (${created.application_type})`,
          event_date: created.date_applied || new Date().toISOString().split('T')[0],
        });
      } catch (timelineErr) {
        console.warn('Could not record initial timeline entry:', timelineErr);
      }

      await refreshApplications();
      await refreshReminders();
      showToast('Application created successfully!', 'success');
      return created;
    } catch (err: unknown) {
      console.error('Error creating application:', err);
      const msg =
        err instanceof Error ? err.message : 'Error creating application';
      showToast(msg, 'error');
      throw err;
    }
  };

  const updateApplication = async (
    id: string,
    updates: Partial<Application>,
    resumeFile?: File | null
  ): Promise<Application> => {
    if (!user) throw new Error('User not authenticated');

    try {
      let mergedUpdates = { ...updates };

      if (resumeFile) {
        const uploadRes = await dataService.uploadResume(
          user.id,
          id,
          resumeFile
        );
        mergedUpdates = {
          ...mergedUpdates,
          resume_file_name: uploadRes.name,
          resume_file_path: uploadRes.path,
          resume_file_type: uploadRes.type,
          resume_file_size: uploadRes.size,
          resume_uploaded_at: new Date().toISOString(),
        };
      }

      const updated = await dataService.updateApplication(id, mergedUpdates);
      await refreshApplications();
      await refreshReminders();
      return updated;
    } catch (err: unknown) {
      console.error('Error updating application:', err);
      const msg =
        err instanceof Error ? err.message : 'Error updating application';
      showToast(msg, 'error');
      throw err;
    }
  };

  const deleteApplication = async (id: string): Promise<void> => {
    try {
      await dataService.deleteApplication(id);
      if (selectedApplication?.id === id) {
        setSelectedApplication(null);
      }
      await refreshApplications();
      await refreshReminders();
      showToast('Application deleted successfully', 'info');
    } catch (err: unknown) {
      console.error('Error deleting application:', err);
      const msg =
        err instanceof Error ? err.message : 'Error deleting application';
      showToast(msg, 'error');
      throw err;
    }
  };

  const quickUpdateStage = async (
    id: string,
    stage: ApplicationStage,
    status?: ApplicationStatus,
    stageDate?: string,
    reminderDays?: number[]
  ) => {
    if (!user) return;
    try {
      const app = applications.find((a) => a.id === id);
      if (!app) return;

      let computedStatus: ApplicationStatus = status || 'Under Review';
      if (!status) {
        if (stage === 'Applied') computedStatus = 'Applied';
        else if (stage === 'Shortlisted') computedStatus = 'Shortlisted';
        else if (stage === 'Online Assessment')
          computedStatus = 'Assessment Pending';
        else if (
          stage === 'Technical Interview' ||
          stage === 'HR Interview' ||
          stage === 'Final Interview'
        )
          computedStatus = 'Interview Scheduled';
        else if (stage === 'Offer Received')
          computedStatus = 'Offer Received';
        else if (stage === 'Selected') computedStatus = 'Selected';
        else if (stage === 'Rejected') computedStatus = 'Rejected';
        else if (stage === 'Withdrawn') computedStatus = 'Withdrawn';
      }

      await dataService.updateApplication(id, {
        current_stage: stage,
        current_status: computedStatus,
      });

      // Timeline event with optional date and reminder
      const eventDate =
        stageDate || new Date().toISOString().split('T')[0];
      const hasReminder = Boolean(stageDate && reminderDays && reminderDays.length > 0);

      try {
        const createdEvent = await dataService.addTimelineEvent({
          application_id: id,
          user_id: user.id,
          event_type: stage,
          event_title: `${stage}`,
          event_description: `Stage updated to ${stage}. Status: ${computedStatus}`,
          event_date: eventDate,
          reminder_enabled: hasReminder,
          custom_reminder_days: reminderDays || [2, 1],
          is_completed: false,
        });

        if (hasReminder && createdEvent) {
          await dataService.syncRemindersForEvent(
            user.id,
            id,
            createdEvent,
            app.company_name,
            app.job_title
          );
        }
      } catch (timelineErr) {
        console.warn('Could not record stage timeline event:', timelineErr);
      }

      if (stage === 'Selected' || stage === 'Offer Received') {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      }

      await refreshApplications();
      await refreshReminders();
      showToast(`Stage updated to ${stage}`, 'success');
    } catch (err: unknown) {
      console.error('Error updating stage:', err);
      const msg = err instanceof Error ? err.message : 'Error updating stage';
      showToast(msg, 'error');
    }
  };

  const addTimelineEntry = async (
    appId: string,
    event: {
      event_title: string;
      event_description?: string;
      event_type?: string;
      event_date?: string;
      event_time?: string | null;
      reminder_enabled?: boolean;
      custom_reminder_days?: number[];
    }
  ): Promise<ApplicationTimelineEvent | undefined> => {
    if (!user) return;
    try {
      const app = applications.find((a) => a.id === appId);
      const eventDate =
        event.event_date || new Date().toISOString().split('T')[0];
      const reminderDays = event.custom_reminder_days || [2, 1];

      const created = await dataService.addTimelineEvent({
        application_id: appId,
        user_id: user.id,
        event_type: event.event_type || 'Custom Reminder',
        event_title: event.event_title,
        event_description: event.event_description || null,
        event_date: eventDate,
        event_time: event.event_time || null,
        reminder_enabled: Boolean(event.reminder_enabled),
        custom_reminder_days: reminderDays,
        is_completed: false,
      });

      if (event.reminder_enabled && created && app) {
        await dataService.syncRemindersForEvent(
          user.id,
          appId,
          created,
          app.company_name,
          app.job_title
        );
      }

      await refreshReminders();
      showToast('Timeline event and reminders created!', 'success');
      return created;
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Failed to add timeline event';
      showToast(msg, 'error');
      return undefined;
    }
  };

  const deleteTimelineEntry = async (eventId: string, _appId: string) => {
    try {
      await dataService.deleteTimelineEvent(eventId);
      await dataService.deleteRemindersForTimelineEvent(eventId);
      await refreshReminders();
      showToast('Event and associated reminders removed', 'info');
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Failed to delete event';
      showToast(msg, 'error');
    }
  };

  const updateTimelineEntry = async (
    eventId: string,
    appId: string,
    updates: Partial<ApplicationTimelineEvent>
  ) => {
    if (!user) return;
    try {
      const app = applications.find((a) => a.id === appId);
      const updated = await dataService.updateTimelineEvent(eventId, updates);

      // Re-sync reminders if date or reminder settings changed
      if (app) {
        await dataService.syncRemindersForEvent(
          user.id,
          appId,
          updated,
          app.company_name,
          app.job_title
        );
      }

      await refreshReminders();
      showToast('Event and reminders updated', 'success');
    } catch (err: unknown) {
      console.error('Failed to update timeline event:', err);
      const msg =
        err instanceof Error ? err.message : 'Failed to update timeline event';
      showToast(msg, 'error');
    }
  };

  const markTimelineEventCompleted = async (
    eventId: string,
    appId: string,
    isCompleted: boolean
  ) => {
    if (!user) return;
    try {
      const app = applications.find((a) => a.id === appId);
      await dataService.updateTimelineEvent(eventId, {
        is_completed: isCompleted,
      });

      if (isCompleted) {
        // Cancel future reminders since event is completed
        await dataService.cancelRemindersForTimelineEvent(eventId);
      } else if (app) {
        // Re-activate reminders if marked not completed
        const updated = await dataService.updateTimelineEvent(eventId, {
          is_completed: false,
        });
        await dataService.syncRemindersForEvent(
          user.id,
          appId,
          updated,
          app.company_name,
          app.job_title
        );
      }

      await refreshReminders();
      showToast(
        isCompleted ? 'Marked event as completed' : 'Event re-opened',
        'success'
      );
    } catch (err) {
      console.error(err);
      showToast('Failed to update completion status', 'error');
    }
  };

  const createCustomReminder = async (
    appId: string,
    data: {
      title: string;
      date: string;
      time?: string;
      description?: string;
      daysBefore?: number[];
      eventType?: string;
      email?: boolean;
      inApp?: boolean;
      push?: boolean;
    }
  ): Promise<Reminder> => {
    if (!user) throw new Error('Not authenticated');
    const app = applications.find((a) => a.id === appId);
    const company = app?.company_name || 'General';
    const job = app?.job_title || 'Application';
    const daysList = data.daysBefore && data.daysBefore.length > 0 ? data.daysBefore : [2, 1];

    // 1. Record in timeline
    let event: ApplicationTimelineEvent | null = null;
    try {
      event = await dataService.addTimelineEvent({
        application_id: appId,
        user_id: user.id,
        event_type: data.eventType || 'Custom Reminder',
        event_title: data.title,
        event_description: data.description || null,
        event_date: data.date,
        event_time: data.time || null,
        reminder_enabled: true,
        custom_reminder_days: daysList,
        is_completed: false,
      });
    } catch (e) {
      console.warn('Could not record timeline event for reminder:', e);
    }

    // 2. Directly create reminders for each interval
    const reminderDates = calculateReminderDates(data.date, daysList);
    const createdList: Reminder[] = [];

    for (const p of reminderDates) {
      const rem = await dataService.createReminder({
        user_id: user.id,
        application_id: appId,
        timeline_event_id: event?.id,
        event_type: data.eventType || 'Custom Reminder',
        event_title: data.title,
        event_description: data.description || null,
        event_date: data.date,
        event_time: data.time || null,
        reminder_date: p.reminderDate,
        days_before: p.daysBefore,
        email_enabled: data.email ?? true,
        in_app_enabled: data.inApp ?? true,
        push_enabled: data.push ?? false,
        email_sent: false,
        notification_created: false,
        is_cancelled: false,
        company_name: company,
        job_title: job,
      });
      createdList.push(rem);
    }

    // 3. If event is an Interview or Assessment type, also sync application's interview date if unset
    if (
      app &&
      data.eventType &&
      (data.eventType.includes('Interview') || data.eventType.includes('Assessment'))
    ) {
      try {
        const updates: Partial<Application> = {};
        if (!app.interview_date) {
          updates.interview_date = data.date;
        }
        if (data.eventType.includes('Technical')) {
          updates.interview_round = 'Technical';
        } else if (data.eventType.includes('HR')) {
          updates.interview_round = 'HR';
        } else if (data.eventType.includes('Final')) {
          updates.interview_round = 'Final';
        }
        if (Object.keys(updates).length > 0) {
          await dataService.updateApplication(app.id, updates);
          await refreshApplications();
        }
      } catch (updErr) {
        console.warn('Could not update application interview fields:', updErr);
      }
    }

    // 4. Trigger device push notification if requested
    if (data.push) {
      try {
        await notificationService.sendNotification(
          `🔔 Reminder Set: ${data.title}`,
          {
            body: `${data.eventType || 'Event'} with ${company} on ${data.date}. Scheduled alerts: ${daysList.join(', ')} days before.`,
          }
        );
      } catch (notifErr) {
        console.warn('Device notification error:', notifErr);
      }
    }

    await refreshReminders();
    showToast(`Reminder set for ${data.title}!`, 'success');
    return createdList[0];
  };

  const cancelReminder = async (reminderId: string) => {
    try {
      const list = reminders.map((r) =>
        r.id === reminderId ? { ...r, is_cancelled: true } : r
      );
      setReminders(list);
      showToast('Reminder dismissed', 'info');
    } catch (e) {
      showToast('Failed to dismiss reminder', 'error');
    }
  };

  const markAllRemindersRead = async () => {
    try {
      const list = reminders.map((r) => ({ ...r, is_cancelled: true }));
      setReminders(list);
      showToast('All notifications & reminders marked as read', 'info');
    } catch (e) {
      showToast('Failed to clear reminders', 'error');
    }
  };

  const updateNotificationPreferences = async (
    prefs: Partial<NotificationPreferences>
  ) => {
    if (!user) return;
    try {
      const updated = await dataService.updateNotificationPreferences(
        user.id,
        prefs
      );
      setNotificationPreferences(updated);
      showToast('Reminder preferences updated successfully', 'success');
    } catch (e) {
      showToast('Failed to save notification preferences', 'error');
    }
  };

  const addSampleApplication = async () => {
    if (!user) return;
    try {
      const sample = {
        ...SAMPLE_GOOGLE_APPLICATION,
        user_id: user.id,
      };
      const created = await dataService.createApplication(sample);
      try {
        const ev = await dataService.addTimelineEvent({
          application_id: created.id,
          user_id: user.id,
          event_type: 'Online Assessment',
          event_title: 'Online Assessment',
          event_description:
            'Google Online Coding Challenge (OA) on HackerRank.',
          event_date: '2026-10-05',
          event_time: '14:00',
          reminder_enabled: true,
          custom_reminder_days: [2, 1],
          is_completed: false,
        });

        await dataService.syncRemindersForEvent(
          user.id,
          created.id,
          ev,
          'Google',
          'Software Engineering Intern'
        );
      } catch (timelineErr) {
        console.warn('Could not record initial demo timeline:', timelineErr);
      }
      await refreshApplications();
      await refreshReminders();
      showToast('Sample Google Internship added with OA reminders!', 'success');
    } catch (err: unknown) {
      console.error('Add sample error:', err);
      const msg =
        err instanceof Error ? err.message : 'Failed to insert demo';
      showToast(msg, 'error');
    }
  };

  // Compute analytics
  const stats = useMemo(() => {
    const total = applications.length;
    let applied = 0;
    let inProgress = 0;
    let interviews = 0;
    let selected = 0;
    let rejected = 0;
    let shortlisted = 0;
    let offers = 0;
    let thisMonth = 0;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    applications.forEach((app) => {
      if (app.date_applied) {
        const d = new Date(app.date_applied);
        if (
          d.getFullYear() === currentYear &&
          d.getMonth() === currentMonth
        ) {
          thisMonth++;
        }
      }

      if (app.current_stage === 'Applied') applied++;
      if (app.current_stage === 'Shortlisted') shortlisted++;
      if (
        app.current_stage === 'Online Assessment' ||
        app.current_stage === 'Technical Interview' ||
        app.current_stage === 'HR Interview' ||
        app.current_stage === 'Final Interview'
      ) {
        interviews++;
        inProgress++;
      }
      if (app.current_stage === 'Offer Received') offers++;
      if (app.current_stage === 'Selected') selected++;
      if (app.current_stage === 'Rejected') rejected++;
    });

    return {
      total,
      applied,
      inProgress,
      interviews,
      selected,
      rejected,
      shortlisted,
      offers,
      thisMonth,
    };
  }, [applications]);

  // Follow-up applications
  const followUpApplications = useMemo(() => {
    return applications
      .filter((app) => app.follow_up_required && app.follow_up_date)
      .sort(
        (a, b) =>
          new Date(a.follow_up_date!).getTime() -
          new Date(b.follow_up_date!).getTime()
      );
  }, [applications]);

  // Upcoming interviews
  const upcomingInterviews = useMemo(() => {
    return applications
      .filter((app) => app.interview_date)
      .sort(
        (a, b) =>
          new Date(a.interview_date!).getTime() -
          new Date(b.interview_date!).getTime()
      );
  }, [applications]);

  // Unified upcoming tasks and reminders
  const upcomingTasks = useMemo(() => {
    const items: UpcomingTaskItem[] = [];
    const seenKeys = new Set<string>();

    // 1. Add active reminders
    reminders
      .filter((r) => !r.is_cancelled)
      .forEach((rem) => {
        const app = applications.find((a) => a.id === rem.application_id);
        const rel = getRelativeTimeLabel(rem.event_date);
        const eventKey = `${rem.application_id}-${rem.event_title}-${rem.event_date}`;
        
        // Prevent duplicate cards if an event has multiple reminders (e.g. 2d and 1d before)
        if (!seenKeys.has(eventKey)) {
          seenKeys.add(eventKey);
          seenKeys.add(`${rem.application_id}-Interview-${rem.event_date}`);
          seenKeys.add(`${rem.application_id}-${rem.event_type}-${rem.event_date}`);

          items.push({
            id: rem.id,
            reminderId: rem.id,
            timelineEventId: rem.timeline_event_id,
            applicationId: rem.application_id,
            eventType: rem.event_type,
            title: rem.event_title,
            companyName: rem.company_name || app?.company_name || 'Application',
            jobTitle: rem.job_title || app?.job_title || 'Role',
            eventDate: rem.event_date,
            eventTime: rem.event_time,
            reminderDate: rem.reminder_date,
            daysRemaining: rem.days_before,
            relativeLabel: rel.label,
            badgeClass: rel.badgeClass,
            isToday: rel.isToday,
            isTomorrow: rel.isTomorrow,
            isUrgent: rel.isUrgent,
          });
        }
      });

    // 2. Add follow-up dates if not already covered
    applications
      .filter((a) => a.follow_up_required && a.follow_up_date)
      .forEach((app) => {
        const key = `${app.id}-Follow-up-${app.follow_up_date}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          const rel = getRelativeTimeLabel(app.follow_up_date!);
          items.push({
            id: `fu-${app.id}`,
            applicationId: app.id,
            eventType: 'Follow-up',
            title: `Follow-up with ${app.company_name}`,
            companyName: app.company_name,
            jobTitle: app.job_title,
            eventDate: app.follow_up_date!,
            daysRemaining: 0,
            relativeLabel: rel.label,
            badgeClass: rel.badgeClass,
            isToday: rel.isToday,
            isTomorrow: rel.isTomorrow,
            isUrgent: rel.isUrgent,
          });
        }
      });

    // 3. Add interviews if not already covered
    applications
      .filter((a) => a.interview_date)
      .forEach((app) => {
        const roundTitle = app.interview_round ? `${app.interview_round} Interview` : 'Technical Interview';
        const key1 = `${app.id}-${roundTitle}-${app.interview_date}`;
        const key2 = `${app.id}-Interview-${app.interview_date}`;
        const key3 = `${app.id}-Technical Interview-${app.interview_date}`;
        if (!seenKeys.has(key1) && !seenKeys.has(key2) && !seenKeys.has(key3)) {
          seenKeys.add(key1);
          seenKeys.add(key2);
          seenKeys.add(key3);
          const rel = getRelativeTimeLabel(app.interview_date!);
          items.push({
            id: `int-${app.id}`,
            applicationId: app.id,
            eventType: roundTitle,
            title: roundTitle,
            companyName: app.company_name,
            jobTitle: app.job_title,
            eventDate: app.interview_date!,
            daysRemaining: 0,
            relativeLabel: rel.label,
            badgeClass: rel.badgeClass,
            isToday: rel.isToday,
            isTomorrow: rel.isTomorrow,
            isUrgent: rel.isUrgent,
          });
        }
      });

    // Sort ascending by event date
    return items.sort(
      (a, b) =>
        new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
    );
  }, [reminders, applications]);

  // Count active urgent/today/tomorrow reminders for badge counter
  const activeRemindersCount = useMemo(() => {
    return upcomingTasks.filter((t) => t.isToday || t.isTomorrow || t.isUrgent)
      .length;
  }, [upcomingTasks]);

  // Recent applications (last 5)
  const recentApplications = useMemo(() => {
    return [...applications]
      .sort(
        (a, b) =>
          new Date(b.date_applied || b.created_at).getTime() -
          new Date(a.date_applied || a.created_at).getTime()
      )
      .slice(0, 5);
  }, [applications]);

  return (
    <ApplicationContext.Provider
      value={{
        applications,
        loading,
        selectedApplication,
        setSelectedApplication,
        refreshApplications,
        createApplication,
        updateApplication,
        deleteApplication,
        quickUpdateStage,
        addTimelineEntry,
        deleteTimelineEntry,
        updateTimelineEntry,
        markTimelineEventCompleted,
        reminders,
        refreshReminders,
        createCustomReminder,
        cancelReminder,
        markAllRemindersRead,
        notificationPreferences,
        updateNotificationPreferences,
        upcomingTasks,
        activeRemindersCount,
        addSampleApplication,
        toasts,
        showToast,
        removeToast,
        stats,
        followUpApplications,
        upcomingInterviews,
        recentApplications,
      }}
    >
      {children}
    </ApplicationContext.Provider>
  );
};

export const useApplications = () => {
  const context = useContext(ApplicationContext);
  if (!context) {
    throw new Error(
      'useApplications must be used within an ApplicationProvider'
    );
  }
  return context;
};
