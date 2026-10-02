import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  Application,
  ApplicationTimelineEvent,
  UserProfile,
  Reminder,
  NotificationPreferences,
} from '../types/database';
import { calculateReminderDates } from './reminderService';

export const isUuid = (id: string): boolean => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
};

export const generateUuid = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Check environment or localStorage for credentials
const getEnvCredentials = () => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const localUrl = typeof window !== 'undefined' ? localStorage.getItem('custom_supabase_url') : null;
  const localKey = typeof window !== 'undefined' ? localStorage.getItem('custom_supabase_anon_key') : null;

  const url = (localUrl && localUrl.trim() !== '') ? localUrl : (envUrl && !envUrl.includes('your-project') ? envUrl : '');
  const key = (localKey && localKey.trim() !== '') ? localKey : (envKey && !envKey.includes('eyJhbGci') ? envKey : '');

  return { url, key };
};

const credentials = getEnvCredentials();

export const isSupabaseConfigured = (): boolean => {
  const { url, key } = getEnvCredentials();
  return Boolean(url && key && url.startsWith('http') && key.length > 20);
};

export const getStoredCredentials = () => getEnvCredentials();

export const saveCustomCredentials = (url: string, key: string) => {
  if (url && key) {
    localStorage.setItem('custom_supabase_url', url.trim());
    localStorage.setItem('custom_supabase_anon_key', key.trim());
    window.location.reload();
  }
};

export const clearCustomCredentials = () => {
  localStorage.removeItem('custom_supabase_url');
  localStorage.removeItem('custom_supabase_anon_key');
  window.location.reload();
};

export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(credentials.url, credentials.key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

// ============================================================================
// LOCAL STORAGE DEMO REPOSITORY (Provides instant interactivity when Supabase keys are pending)
// ============================================================================

const LOCAL_STORAGE_APPS_KEY = 'job_tracker_applications_v1';
const LOCAL_STORAGE_TIMELINE_KEY = 'job_tracker_timeline_v1';
const LOCAL_STORAGE_PROFILE_KEY = 'job_tracker_profile_v1';
const LOCAL_STORAGE_FILES_KEY = 'job_tracker_files_v1';

export const SAMPLE_GOOGLE_ID = 'a0000000-0000-4000-8000-000000000001';
export const DEMO_USER_ID = 'b0000000-0000-4000-8000-000000000001';

export const SAMPLE_GOOGLE_APPLICATION: Application = {
  id: SAMPLE_GOOGLE_ID,
  user_id: DEMO_USER_ID,
  application_type: 'Internship',
  job_title: 'Software Engineering Intern',
  company_name: 'Google',
  location: 'Bengaluru / Hybrid',
  date_applied: '2026-10-01',
  job_description:
    'Work with engineering teams to develop next-generation technologies. Focus on distributed systems, scalability, and algorithmic optimization. Collaborate with cross-functional teams to build high-impact features.',
  what_i_learned:
    'Deepened understanding of distributed system architecture, gRPC protocols, and concurrency primitives in Go/C++. Learned how large-scale indexing handles millions of queries per second and importance of clean API contract testing.',
  company_website: 'https://careers.google.com',
  linkedin_url: 'https://linkedin.com/company/google',
  job_posting_url: 'https://careers.google.com/jobs/results/sample-swe-intern',
  current_stage: 'Applied',
  current_status: 'Applied',
  interview_done: false,
  interview_date: null,
  interview_round: null,
  interviewer_name: null,
  interview_feedback: null,
  interview_notes: 'Brush up on Graph algorithms (BFS/DFS, Dijkstra), Dynamic Programming, and Concurrency patterns.',
  resume_file_name: 'Jeevan_K_Resume_DevOps.pdf',
  resume_file_path: 'demo/resumes/Jeevan_K_Resume_DevOps.pdf',
  resume_file_type: 'application/pdf',
  resume_file_size: 142850,
  resume_uploaded_at: '2026-10-01T10:30:00Z',
  expected_salary: null,
  offered_salary: '₹1,00,000/month',
  follow_up_required: true,
  follow_up_date: '2026-10-08',
  follow_up_notes: 'Check portal status or reach out to university recruiter if no update received after one week.',
  additional_notes: 'Referred by alumni through Google Student Network. Completed all pre-screening questions.',
  is_sample: true,
  created_at: '2026-10-01T09:00:00.000Z',
  updated_at: '2026-10-01T09:00:00.000Z',
};

const getLocalApps = (): Application[] => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_APPS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    // Sanitize any old legacy non-uuid demo IDs so they don't cause issues
    return parsed.map((app: Application) => {
      if (app.id === 'demo-google-intern-2026') {
        return { ...app, id: SAMPLE_GOOGLE_ID };
      }
      return app;
    });
  } catch (e) {
    console.error('Error reading local apps', e);
    return [];
  }
};

const saveLocalApps = (apps: Application[]) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_APPS_KEY, JSON.stringify(apps));
  } catch (e) {
    console.error('Error saving local apps', e);
  }
};

const getLocalTimeline = (): ApplicationTimelineEvent[] => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_TIMELINE_KEY);
    if (!raw) {
      const sampleEvents: ApplicationTimelineEvent[] = [
        {
          id: 'c0000000-0000-4000-8000-000000000001',
          application_id: SAMPLE_GOOGLE_ID,
          user_id: DEMO_USER_ID,
          event_type: 'status_change',
          event_title: 'Application Submitted',
          event_description: 'Applied via Google Careers Portal for Software Engineering Internship.',
          event_date: '2026-10-01T10:00:00Z',
          created_at: '2026-10-01T10:00:00Z',
        },
      ];
      localStorage.setItem(LOCAL_STORAGE_TIMELINE_KEY, JSON.stringify(sampleEvents));
      return sampleEvents;
    }
    const parsed = JSON.parse(raw);
    return parsed.map((e: ApplicationTimelineEvent) => {
      if (e.application_id === 'demo-google-intern-2026') {
        return { ...e, application_id: SAMPLE_GOOGLE_ID };
      }
      return e;
    });
  } catch (e) {
    return [];
  }
};

const saveLocalTimeline = (events: ApplicationTimelineEvent[]) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_TIMELINE_KEY, JSON.stringify(events));
  } catch (e) {
    console.error('Error saving timeline', e);
  }
};

const LOCAL_STORAGE_REMINDERS_KEY = 'job_tracker_reminders_v1';
const LOCAL_STORAGE_NOTIF_PREFS_KEY = 'job_tracker_notif_prefs_v1';

const getLocalReminders = (): Reminder[] => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_REMINDERS_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Filter out any legacy dummy/demo reminders
    return parsed.filter(
      (r: Reminder) =>
        r &&
        r.id &&
        !r.id.startsWith('rem-00000000-0000-4000-8000') &&
        r.user_id !== DEMO_USER_ID
    );
  } catch (e) {
    return [];
  }
};

const saveLocalReminders = (reminders: Reminder[]) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_REMINDERS_KEY, JSON.stringify(reminders));
  } catch (e) {
    console.error('Error saving reminders', e);
  }
};

const getLocalPreferences = (): NotificationPreferences => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_NOTIF_PREFS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // fallback
  }
  return {
    user_id: DEMO_USER_ID,
    default_days_before: [2, 1],
    email_enabled: true,
    in_app_enabled: true,
    push_enabled: false,
    timezone: 'Asia/Kolkata',
  };
};

const saveLocalPreferences = (prefs: NotificationPreferences) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_NOTIF_PREFS_KEY, JSON.stringify(prefs));
  } catch (e) {
    console.error('Error saving preferences', e);
  }
};

export const getLocalProfile = (): UserProfile => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_PROFILE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // fallback
  }
  return {
    id: DEMO_USER_ID,
    user_id: DEMO_USER_ID,
    full_name: 'Jeevan Kumar',
    email: 'jeevan.k@example.com',
    profile_photo_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
};

export const saveLocalProfile = (profile: Partial<UserProfile>): UserProfile => {
  const current = getLocalProfile();
  const updated = {
    ...current,
    ...profile,
    updated_at: new Date().toISOString(),
  };
  localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(updated));
  return updated;
};

// Database Column List for Supabase Applications table
const DB_APPLICATION_COLUMNS = [
  'application_type',
  'job_title',
  'company_name',
  'location',
  'date_applied',
  'job_description',
  'what_i_learned',
  'company_website',
  'linkedin_url',
  'job_posting_url',
  'current_stage',
  'current_status',
  'interview_done',
  'interview_date',
  'interview_round',
  'interviewer_name',
  'interview_feedback',
  'interview_notes',
  'resume_file_name',
  'resume_file_path',
  'resume_file_type',
  'resume_file_size',
  'resume_uploaded_at',
  'expected_salary',
  'offered_salary',
  'follow_up_required',
  'follow_up_date',
  'follow_up_notes',
  'additional_notes',
] as const;

export const sanitizeApplicationForDb = (
  appData: Record<string, any>,
  isUpdate = false
): Record<string, any> => {
  const result: Record<string, any> = {};

  if (!isUpdate && appData.user_id && isUuid(appData.user_id)) {
    result.user_id = appData.user_id;
  }

  for (const col of DB_APPLICATION_COLUMNS) {
    if (col in appData) {
      let val = appData[col];

      // Handle date fields: never send empty strings to Postgres DATE / TIMESTAMP columns
      if (col === 'interview_date' || col === 'follow_up_date' || col === 'resume_uploaded_at') {
        if (!val || (typeof val === 'string' && val.trim() === '')) {
          val = null;
        } else if (typeof val === 'string') {
          val = val.trim();
        }
      }

      // Handle date_applied
      if (col === 'date_applied') {
        if (!val || (typeof val === 'string' && val.trim() === '')) {
          val = new Date().toISOString().split('T')[0];
        } else if (typeof val === 'string') {
          val = val.trim();
        }
      }

      // Handle booleans
      if (col === 'interview_done' || col === 'follow_up_required') {
        val = Boolean(val);
      }

      // Handle numeric size
      if (col === 'resume_file_size') {
        if (val === null || val === undefined || val === '') {
          val = null;
        } else {
          val = Number(val) || null;
        }
      }

      // Handle text fields: trim, convert empty strings to null for clean DB records
      if (typeof val === 'string') {
        val = val.trim();
        if (
          val === '' &&
          [
            'location',
            'job_description',
            'what_i_learned',
            'company_website',
            'linkedin_url',
            'job_posting_url',
            'interviewer_name',
            'interview_feedback',
            'interview_notes',
            'resume_file_name',
            'resume_file_path',
            'resume_file_type',
            'expected_salary',
            'offered_salary',
            'follow_up_notes',
            'additional_notes',
          ].includes(col)
        ) {
          val = null;
        }
      }

      result[col] = val;
    }
  }

  return result;
};

// ============================================================================
// UNIFIED DATA OPERATIONS (SUPABASE WITH RESILIENT LOCAL FALLBACK)
// ============================================================================

export const dataService = {
  // Profiles
  async getProfile(userId: string): Promise<UserProfile> {
    if (supabase && isSupabaseConfigured() && isUuid(userId)) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching Supabase profile:', error);
      }
      if (data) return data as UserProfile;
    }
    return getLocalProfile();
  },

  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    if (supabase && isSupabaseConfigured() && isUuid(userId)) {
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          user_id: userId,
          id: userId,
          full_name: updates.full_name,
          email: updates.email,
          profile_photo_url: updates.profile_photo_url,
          updated_at: new Date().toISOString(),
        })
        .select()
        .maybeSingle();

      if (error) {
        console.error('Error updating Supabase profile:', error);
        throw new Error(error.message || 'Failed to update profile in database');
      }
      if (data) return data as UserProfile;
    }
    return saveLocalProfile(updates);
  },

  // Applications
  async getApplications(userId: string): Promise<Application[]> {
    if (supabase && isSupabaseConfigured() && isUuid(userId)) {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .eq('user_id', userId)
        .order('date_applied', { ascending: false });

      if (error) {
        console.error('Error fetching Supabase applications:', error);
        throw new Error(error.message || 'Failed to load applications from database');
      }
      if (data && data.length > 0) {
        return data as Application[];
      }
    }

    const apps = getLocalApps();
    if (apps.length === 0) {
      const defaultApps = [SAMPLE_GOOGLE_APPLICATION];
      saveLocalApps(defaultApps);
      return defaultApps;
    }
    return apps;
  },

  async getApplicationById(id: string): Promise<Application | null> {
    if (supabase && isSupabaseConfigured() && isUuid(id)) {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (!error && data) {
        return data as Application;
      }
    }
    const apps = getLocalApps();
    return apps.find((a) => a.id === id) || null;
  },

  async createApplication(app: Omit<Application, 'id' | 'created_at' | 'updated_at'>): Promise<Application> {
    const timestamp = new Date().toISOString();
    const sanitizedDbPayload = sanitizeApplicationForDb(app, false);
    sanitizedDbPayload.created_at = timestamp;
    sanitizedDbPayload.updated_at = timestamp;

    if (supabase && isSupabaseConfigured() && app.user_id && isUuid(app.user_id)) {
      sanitizedDbPayload.user_id = app.user_id;

      const { data, error } = await supabase
        .from('applications')
        .insert([sanitizedDbPayload])
        .select()
        .maybeSingle();

      if (error) {
        console.error('Error creating application in Supabase:', error);
        throw new Error(error.message || 'Failed to create application in database');
      }
      if (data) {
        return data as Application;
      }
    }

    const newApp: Application = {
      ...app,
      id: generateUuid(),
      user_id: app.user_id || DEMO_USER_ID,
      created_at: timestamp,
      updated_at: timestamp,
    };
    const current = getLocalApps();
    saveLocalApps([newApp, ...current]);
    return newApp;
  },

  async updateApplication(id: string, updates: Partial<Application>): Promise<Application> {
    const timestamp = new Date().toISOString();
    const sanitizedDbPayload = sanitizeApplicationForDb(updates, true);
    sanitizedDbPayload.updated_at = timestamp;

    // Check if ID is a valid UUID before attempting to query Supabase
    if (supabase && isSupabaseConfigured() && isUuid(id)) {
      try {
        const { data, error } = await supabase
          .from('applications')
          .update(sanitizedDbPayload)
          .eq('id', id)
          .select()
          .maybeSingle();

        if (error) {
          console.error('Error updating application in Supabase:', error);
          // Check if it exists in local storage fallback
          const apps = getLocalApps();
          const localIndex = apps.findIndex((a) => a.id === id);
          if (localIndex !== -1) {
            const updatedApp: Application = {
              ...apps[localIndex],
              ...updates,
              updated_at: timestamp,
            };
            apps[localIndex] = updatedApp;
            saveLocalApps(apps);
            return updatedApp;
          }
          throw new Error(error.message || 'Database error while updating application');
        }

        if (data) {
          return data as Application;
        }
      } catch (err: unknown) {
        // If not found in Supabase or network issue, check local store
        const apps = getLocalApps();
        const localIndex = apps.findIndex((a) => a.id === id);
        if (localIndex !== -1) {
          const updatedApp: Application = {
            ...apps[localIndex],
            ...updates,
            updated_at: timestamp,
          };
          apps[localIndex] = updatedApp;
          saveLocalApps(apps);
          return updatedApp;
        }
        throw err;
      }
    }

    // Local storage update
    const apps = getLocalApps();
    const index = apps.findIndex((a) => a.id === id);
    if (index === -1) {
      // Check if it's the demo sample
      const demoIndex = apps.findIndex(
        (a) => a.is_sample || a.id === SAMPLE_GOOGLE_ID || a.id.startsWith('demo-')
      );
      if (demoIndex !== -1) {
        const updatedApp: Application = {
          ...apps[demoIndex],
          ...updates,
          updated_at: timestamp,
        };
        apps[demoIndex] = updatedApp;
        saveLocalApps(apps);
        return updatedApp;
      }
      throw new Error(`Application with ID "${id}" was not found.`);
    }

    const updatedApp: Application = {
      ...apps[index],
      ...updates,
      updated_at: timestamp,
    };
    apps[index] = updatedApp;
    saveLocalApps(apps);
    return updatedApp;
  },

  async deleteApplication(id: string): Promise<void> {
    if (supabase && isSupabaseConfigured() && isUuid(id)) {
      const { error } = await supabase.from('applications').delete().eq('id', id);
      if (error) {
        console.error('Error deleting application:', error);
      }
    }
    const apps = getLocalApps().filter((a) => a.id !== id);
    saveLocalApps(apps);
    // Cleanup timeline
    const events = getLocalTimeline().filter((e) => e.application_id !== id);
    saveLocalTimeline(events);
  },

  // Timeline
  async getTimeline(applicationId: string): Promise<ApplicationTimelineEvent[]> {
    if (supabase && isSupabaseConfigured() && isUuid(applicationId)) {
      try {
        const { data, error } = await supabase
          .from('application_timeline')
          .select('*')
          .eq('application_id', applicationId)
          .order('event_date', { ascending: false });

        if (!error && data && data.length > 0) {
          return data as ApplicationTimelineEvent[];
        }
      } catch (e) {
        console.warn('Could not fetch timeline from Supabase:', e);
      }
    }
    return getLocalTimeline().filter((e) => e.application_id === applicationId);
  },

  async addTimelineEvent(
    event: Omit<ApplicationTimelineEvent, 'id' | 'created_at'>
  ): Promise<ApplicationTimelineEvent> {
    const timestamp = new Date().toISOString();
    let supabaseResult: ApplicationTimelineEvent | null = null;

    if (
      supabase &&
      isSupabaseConfigured() &&
      isUuid(event.application_id) &&
      isUuid(event.user_id)
    ) {
      try {
        // Try inserting full event payload
        const payload: Record<string, any> = {
          application_id: event.application_id,
          user_id: event.user_id,
          event_type: event.event_type || 'Custom Reminder',
          event_title: event.event_title,
          event_description: event.event_description || null,
          event_date: event.event_date || timestamp,
          created_at: timestamp,
        };
        if (event.event_time) payload.event_time = event.event_time;
        if (event.reminder_enabled !== undefined) payload.reminder_enabled = event.reminder_enabled;
        if (event.custom_reminder_days) payload.custom_reminder_days = event.custom_reminder_days;
        if (event.is_completed !== undefined) payload.is_completed = event.is_completed;

        let { data, error } = await supabase
          .from('application_timeline')
          .insert([payload])
          .select()
          .maybeSingle();

        // If insert failed (e.g. extra column not yet in DB schema), retry with base fields
        if (error) {
          const fallbackPayload = {
            application_id: event.application_id,
            user_id: event.user_id,
            event_type: event.event_type || 'Custom Reminder',
            event_title: event.event_title,
            event_description: event.event_description || null,
            event_date: event.event_date || timestamp,
            created_at: timestamp,
          };
          const retry = await supabase
            .from('application_timeline')
            .insert([fallbackPayload])
            .select()
            .maybeSingle();
          if (!retry.error && retry.data) {
            data = retry.data;
            error = null;
          }
        }

        if (!error && data) {
          supabaseResult = {
            ...data,
            reminder_enabled: event.reminder_enabled ?? data.reminder_enabled ?? true,
            custom_reminder_days: event.custom_reminder_days ?? data.custom_reminder_days ?? [2, 1],
            event_time: event.event_time ?? data.event_time ?? null,
            is_completed: event.is_completed ?? data.is_completed ?? false,
          } as ApplicationTimelineEvent;
        }
      } catch (e) {
        console.warn('Could not insert timeline into Supabase, saving locally:', e);
      }
    }

    const newEvent: ApplicationTimelineEvent = supabaseResult || {
      ...event,
      id: generateUuid(),
      created_at: timestamp,
      reminder_enabled: event.reminder_enabled ?? true,
      custom_reminder_days: event.custom_reminder_days ?? [2, 1],
      is_completed: event.is_completed ?? false,
    };

    const events = getLocalTimeline();
    saveLocalTimeline([newEvent, ...events.filter((e) => e.id !== newEvent.id)]);
    return newEvent;
  },

  async updateTimelineEvent(
    id: string,
    updates: Partial<ApplicationTimelineEvent>
  ): Promise<ApplicationTimelineEvent> {
    let supabaseResult: ApplicationTimelineEvent | null = null;
    if (supabase && isSupabaseConfigured() && isUuid(id)) {
      try {
        const updatePayload: Record<string, any> = {
          event_type: updates.event_type,
          event_title: updates.event_title,
          event_description: updates.event_description,
          event_date: updates.event_date,
        };
        if (updates.event_time !== undefined) updatePayload.event_time = updates.event_time;
        if (updates.reminder_enabled !== undefined) updatePayload.reminder_enabled = updates.reminder_enabled;
        if (updates.custom_reminder_days !== undefined) updatePayload.custom_reminder_days = updates.custom_reminder_days;
        if (updates.is_completed !== undefined) updatePayload.is_completed = updates.is_completed;

        let { data, error } = await supabase
          .from('application_timeline')
          .update(updatePayload)
          .eq('id', id)
          .select()
          .maybeSingle();

        if (error) {
          // Retry with standard columns
          const retry = await supabase
            .from('application_timeline')
            .update({
              event_type: updates.event_type,
              event_title: updates.event_title,
              event_description: updates.event_description,
              event_date: updates.event_date,
            })
            .eq('id', id)
            .select()
            .maybeSingle();
          if (!retry.error && retry.data) {
            data = retry.data;
            error = null;
          }
        }

        if (!error && data) {
          supabaseResult = {
            ...data,
            ...updates,
          } as ApplicationTimelineEvent;
        }
      } catch (e) {
        console.warn('Could not update timeline in Supabase, updating locally:', e);
      }
    }

    const events = getLocalTimeline();
    const index = events.findIndex((e) => e.id === id);
    if (index !== -1) {
      const updated = { ...events[index], ...updates };
      events[index] = updated;
      saveLocalTimeline(events);
      return updated;
    }
    if (supabaseResult) return supabaseResult;
    throw new Error('Timeline event not found');
  },

  async deleteTimelineEvent(id: string): Promise<void> {
    if (supabase && isSupabaseConfigured() && isUuid(id)) {
      const { error } = await supabase.from('application_timeline').delete().eq('id', id);
      if (error) console.error('Error deleting timeline event:', error);
    }
    const events = getLocalTimeline().filter((e) => e.id !== id);
    saveLocalTimeline(events);
  },

  // Storage: Upload Resume
  async uploadResume(
    userId: string,
    applicationId: string,
    file: File
  ): Promise<{ path: string; name: string; size: number; type: string; downloadUrl: string }> {
    const safeFileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const storagePath = `${userId}/${applicationId}/${safeFileName}`;

    if (supabase && isSupabaseConfigured() && isUuid(userId)) {
      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (!uploadError) {
        const { data: signedData } = await supabase.storage
          .from('resumes')
          .createSignedUrl(storagePath, 86400);

        const downloadUrl = signedData?.signedUrl || '';
        return {
          path: storagePath,
          name: file.name,
          size: file.size,
          type: file.type || 'application/pdf',
          downloadUrl,
        };
      }
      console.warn('Supabase storage upload error, saving locally:', uploadError);
    }

    // Local Storage mock file persistence
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const base64 = reader.result as string;
          const fileRecord = {
            id: storagePath,
            name: file.name,
            size: file.size,
            type: file.type,
            dataUrl: base64,
            uploadedAt: new Date().toISOString(),
          };
          const rawFiles = localStorage.getItem(LOCAL_STORAGE_FILES_KEY) || '{}';
          const files = JSON.parse(rawFiles);
          files[storagePath] = fileRecord;
          localStorage.setItem(LOCAL_STORAGE_FILES_KEY, JSON.stringify(files));

          resolve({
            path: storagePath,
            name: file.name,
            size: file.size,
            type: file.type,
            downloadUrl: base64,
          });
        } catch (e) {
          reject(e);
        }
      };
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  },

  async getResumeDownloadUrl(path: string): Promise<string> {
    if (!path) return '';
    if (path.startsWith('demo/')) {
      return 'data:application/pdf;base64,JVBERi0xLjQKJcTl8uXr...';
    }

    if (supabase && isSupabaseConfigured()) {
      const { data, error } = await supabase.storage
        .from('resumes')
        .createSignedUrl(path, 3600);

      if (!error && data?.signedUrl) {
        return data.signedUrl;
      }
      const { data: pubData } = supabase.storage.from('resumes').getPublicUrl(path);
      if (pubData?.publicUrl) return pubData.publicUrl;
    }

    // Local Storage check
    try {
      const rawFiles = localStorage.getItem(LOCAL_STORAGE_FILES_KEY);
      if (rawFiles) {
        const files = JSON.parse(rawFiles);
        if (files[path]?.dataUrl) {
          return files[path].dataUrl;
        }
      }
    } catch (e) {
      // ignore
    }
    return '';
  },

  // Storage: Upload Profile Photo
  async uploadProfilePhoto(userId: string, file: File): Promise<string> {
    const extension = file.name.split('.').pop() || 'jpg';
    const storagePath = `${userId}/profile-photo.${extension}`;

    if (supabase && isSupabaseConfigured() && isUuid(userId)) {
      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (!uploadError) {
        const { data } = supabase.storage.from('profile-photos').getPublicUrl(storagePath);
        return data.publicUrl;
      }
    }

    // Local Storage mock
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        resolve(dataUrl);
      };
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  },

  // Universal Reminders
  async getReminders(userId: string): Promise<Reminder[]> {
    let supabaseReminders: Reminder[] = [];
    if (supabase && isSupabaseConfigured() && isUuid(userId)) {
      try {
        const { data, error } = await supabase
          .from('reminders')
          .select('*, applications(company_name, job_title)')
          .eq('user_id', userId)
          .order('reminder_date', { ascending: true });

        if (!error && data) {
          supabaseReminders = data.map((r: any) => ({
            ...r,
            company_name: r.applications?.company_name || r.company_name,
            job_title: r.applications?.job_title || r.job_title,
          })) as Reminder[];
        }
      } catch (e) {
        console.warn('Could not fetch Supabase reminders, falling back to local:', e);
      }
    }

    // Merge Supabase and local reminders, deduplicating by unique event + reminder date
    const local = getLocalReminders().filter((r) => r.user_id === userId);
    const map = new Map<string, Reminder>();

    local.forEach((r) => {
      const key = `${r.application_id}-${r.event_title}-${r.reminder_date}`;
      map.set(key, r);
    });

    supabaseReminders.forEach((r) => {
      const key = `${r.application_id}-${r.event_title}-${r.reminder_date}`;
      map.set(key, r);
    });

    return Array.from(map.values()).sort(
      (a, b) => new Date(a.reminder_date).getTime() - new Date(b.reminder_date).getTime()
    );
  },

  async createReminder(
    reminder: Omit<Reminder, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Reminder> {
    const timestamp = new Date().toISOString();
    let supabaseReminder: Reminder | null = null;

    if (
      supabase &&
      isSupabaseConfigured() &&
      isUuid(reminder.user_id) &&
      isUuid(reminder.application_id)
    ) {
      try {
        const { data, error } = await supabase
          .from('reminders')
          .insert([
            {
              user_id: reminder.user_id,
              application_id: reminder.application_id,
              timeline_event_id: isUuid(reminder.timeline_event_id || '') ? reminder.timeline_event_id : null,
              event_type: reminder.event_type,
              event_title: reminder.event_title,
              event_description: reminder.event_description || null,
              event_date: reminder.event_date,
              event_time: reminder.event_time || null,
              reminder_date: reminder.reminder_date,
              days_before: reminder.days_before,
              email_enabled: reminder.email_enabled ?? true,
              in_app_enabled: reminder.in_app_enabled ?? true,
              push_enabled: reminder.push_enabled ?? false,
              email_sent: false,
              notification_created: false,
              is_cancelled: false,
            },
          ])
          .select('*, applications(company_name, job_title)')
          .maybeSingle();

        if (!error && data) {
          supabaseReminder = {
            ...data,
            company_name: data.applications?.company_name || reminder.company_name,
            job_title: data.applications?.job_title || reminder.job_title,
          } as Reminder;
        } else if (error) {
          console.warn('Error inserting reminder in Supabase, using local mirror:', error.message || error);
        }
      } catch (e) {
        console.warn('Error inserting reminder in Supabase, using local fallback:', e);
      }
    }

    const finalReminder: Reminder = supabaseReminder || {
      ...reminder,
      id: generateUuid(),
      email_sent: false,
      notification_created: false,
      is_cancelled: false,
      created_at: timestamp,
      updated_at: timestamp,
    };

    const list = getLocalReminders();
    saveLocalReminders([...list.filter((r) => r.id !== finalReminder.id), finalReminder]);
    return finalReminder;
  },

  async cancelRemindersForTimelineEvent(timelineEventId: string): Promise<void> {
    if (supabase && isSupabaseConfigured() && isUuid(timelineEventId)) {
      try {
        await supabase
          .from('reminders')
          .update({ is_cancelled: true, updated_at: new Date().toISOString() })
          .eq('timeline_event_id', timelineEventId);
      } catch (e) {
        console.warn('Error cancelling reminders in Supabase:', e);
      }
    }
    const list = getLocalReminders().map((r) =>
      r.timeline_event_id === timelineEventId ? { ...r, is_cancelled: true } : r
    );
    saveLocalReminders(list);
  },

  async deleteRemindersForTimelineEvent(timelineEventId: string): Promise<void> {
    if (supabase && isSupabaseConfigured() && isUuid(timelineEventId)) {
      try {
        await supabase.from('reminders').delete().eq('timeline_event_id', timelineEventId);
      } catch (e) {
        console.warn('Error deleting reminders in Supabase:', e);
      }
    }
    const list = getLocalReminders().filter((r) => r.timeline_event_id !== timelineEventId);
    saveLocalReminders(list);
  },

  async syncRemindersForEvent(
    userId: string,
    applicationId: string,
    event: {
      id: string;
      event_type: string;
      event_title: string;
      event_description?: string | null;
      event_date: string;
      event_time?: string | null;
      reminder_enabled?: boolean;
      custom_reminder_days?: number[];
      is_completed?: boolean;
    },
    companyName: string,
    jobTitle: string
  ): Promise<Reminder[]> {
    // 1. Remove existing reminders for this event so we don't duplicate
    if (event.id) {
      await this.deleteRemindersForTimelineEvent(event.id);
    }

    // 2. If reminder is explicitly disabled or event is completed, stop here
    if (event.reminder_enabled === false || event.is_completed || !event.event_date) {
      return [];
    }

    // 3. Calculate reminder dates
    const daysBeforeList =
      event.custom_reminder_days && event.custom_reminder_days.length > 0
        ? event.custom_reminder_days
        : [2, 1];

    const pairs = calculateReminderDates(event.event_date, daysBeforeList);
    const created: Reminder[] = [];

    for (const p of pairs) {
      const rem = await this.createReminder({
        user_id: userId,
        application_id: applicationId,
        timeline_event_id: event.id,
        event_type: event.event_type,
        event_title: event.event_title,
        event_description: event.event_description,
        event_date: event.event_date,
        event_time: event.event_time || null,
        reminder_date: p.reminderDate,
        days_before: p.daysBefore,
        email_enabled: true,
        in_app_enabled: true,
        push_enabled: false,
        email_sent: false,
        notification_created: false,
        is_cancelled: false,
        company_name: companyName,
        job_title: jobTitle,
      });
      created.push(rem);
    }

    return created;
  },

  // Notification Preferences
  async getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
    if (supabase && isSupabaseConfigured() && isUuid(userId)) {
      try {
        const { data, error } = await supabase
          .from('notification_preferences')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (!error && data) {
          return data as NotificationPreferences;
        }
      } catch (e) {
        console.warn('Error fetching notification preferences from Supabase:', e);
      }
    }
    return getLocalPreferences();
  },

  async updateNotificationPreferences(
    userId: string,
    updates: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    const timestamp = new Date().toISOString();
    if (supabase && isSupabaseConfigured() && isUuid(userId)) {
      try {
        const { data, error } = await supabase
          .from('notification_preferences')
          .upsert({
            user_id: userId,
            ...updates,
            updated_at: timestamp,
          })
          .select()
          .maybeSingle();

        if (!error && data) {
          return data as NotificationPreferences;
        }
      } catch (e) {
        console.warn('Error updating notification preferences in Supabase:', e);
      }
    }

    const current = getLocalPreferences();
    const updated: NotificationPreferences = {
      ...current,
      ...updates,
      user_id: userId,
    };
    saveLocalPreferences(updated);
    return updated;
  },
};
