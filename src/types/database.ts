export type ApplicationType =
  | 'Job'
  | 'Internship'
  | 'Full-Time'
  | 'Part-Time'
  | 'Freelance'
  | 'Other';

export type ApplicationStage =
  | 'Saved'
  | 'Applied'
  | 'Application Viewed'
  | 'Shortlisted'
  | 'Online Assessment'
  | 'Technical Interview'
  | 'HR Interview'
  | 'Final Interview'
  | 'Offer Received'
  | 'Selected'
  | 'Rejected'
  | 'Withdrawn';

export type ApplicationStatus =
  | 'Applied'
  | 'Under Review'
  | 'Shortlisted'
  | 'Interview Scheduled'
  | 'Interview Completed'
  | 'Assessment Pending'
  | 'Offer Received'
  | 'Selected'
  | 'Rejected'
  | 'Withdrawn'
  | 'On Hold';

export type InterviewRound =
  | 'HR'
  | 'Technical'
  | 'Managerial'
  | 'Coding'
  | 'Aptitude'
  | 'Final'
  | 'Other';

export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  profile_photo_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Application {
  id: string;
  user_id: string;
  application_type: ApplicationType;
  job_title: string;
  company_name: string;
  location?: string | null;
  date_applied: string;
  job_description?: string | null;
  what_i_learned?: string | null;
  company_website?: string | null;
  linkedin_url?: string | null;
  job_posting_url?: string | null;
  current_stage: ApplicationStage;
  current_status: ApplicationStatus;
  interview_done: boolean;
  interview_date?: string | null;
  interview_round?: InterviewRound | null;
  interviewer_name?: string | null;
  interview_feedback?: string | null;
  interview_notes?: string | null;
  resume_file_name?: string | null;
  resume_file_path?: string | null;
  resume_file_type?: string | null;
  resume_file_size?: number | null;
  resume_uploaded_at?: string | null;
  expected_salary?: string | null;
  offered_salary?: string | null;
  follow_up_required: boolean;
  follow_up_date?: string | null;
  follow_up_notes?: string | null;
  additional_notes?: string | null;
  is_sample?: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApplicationTimelineEvent {
  id: string;
  application_id: string;
  user_id: string;
  event_type: string;
  event_title: string;
  event_description?: string | null;
  event_date: string;
  event_time?: string | null;
  reminder_enabled?: boolean;
  custom_reminder_days?: number[];
  is_completed?: boolean;
  created_at: string;
}

export type ReminderEventType =
  | 'Application'
  | 'Application Viewed'
  | 'Shortlisted'
  | 'Online Assessment'
  | 'Technical Interview'
  | 'HR Interview'
  | 'Final Interview'
  | 'Offer Received'
  | 'Selected'
  | 'Rejected'
  | 'Follow-up'
  | 'Application Deadline'
  | 'Custom Reminder';

export interface Reminder {
  id: string;
  user_id: string;
  application_id: string;
  timeline_event_id?: string | null;
  event_type: ReminderEventType | string;
  event_title: string;
  event_description?: string | null;
  event_date: string;
  event_time?: string | null;
  reminder_date: string;
  days_before: number;
  email_enabled: boolean;
  in_app_enabled: boolean;
  push_enabled: boolean;
  email_sent: boolean;
  notification_created: boolean;
  is_cancelled: boolean;
  created_at: string;
  updated_at: string;
  company_name?: string;
  job_title?: string;
}

export interface NotificationPreferences {
  id?: string;
  user_id: string;
  default_days_before: number[]; // e.g. [2, 1]
  email_enabled: boolean;
  in_app_enabled: boolean;
  push_enabled: boolean;
  timezone: string; // 'Asia/Kolkata'
}

export const REMINDER_EVENT_TYPES: ReminderEventType[] = [
  'Application',
  'Application Viewed',
  'Shortlisted',
  'Online Assessment',
  'Technical Interview',
  'HR Interview',
  'Final Interview',
  'Offer Received',
  'Selected',
  'Rejected',
  'Follow-up',
  'Application Deadline',
  'Custom Reminder',
];

export const STAGES_ORDER: ApplicationStage[] = [
  'Saved',
  'Applied',
  'Application Viewed',
  'Shortlisted',
  'Online Assessment',
  'Technical Interview',
  'HR Interview',
  'Final Interview',
  'Offer Received',
  'Selected',
];

export const ALL_STAGES: ApplicationStage[] = [
  'Saved',
  'Applied',
  'Application Viewed',
  'Shortlisted',
  'Online Assessment',
  'Technical Interview',
  'HR Interview',
  'Final Interview',
  'Offer Received',
  'Selected',
  'Rejected',
  'Withdrawn',
];

export const ALL_STATUSES: ApplicationStatus[] = [
  'Applied',
  'Under Review',
  'Shortlisted',
  'Interview Scheduled',
  'Interview Completed',
  'Assessment Pending',
  'Offer Received',
  'Selected',
  'Rejected',
  'Withdrawn',
  'On Hold',
];

export const APPLICATION_TYPES: ApplicationType[] = [
  'Job',
  'Internship',
  'Full-Time',
  'Part-Time',
  'Freelance',
  'Other',
];

export const INTERVIEW_ROUNDS: InterviewRound[] = [
  'Technical',
  'HR',
  'Managerial',
  'Coding',
  'Aptitude',
  'Final',
  'Other',
];
