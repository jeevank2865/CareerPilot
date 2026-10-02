import { Application } from '../types/database';
import { getLocalProfile } from './supabase';
import { saveOrShareCSV } from './capacitor';

export interface UserProfileExportInfo {
  userName?: string | null;
  userEmail?: string | null;
  userId?: string | null;
  profilePhotoUrl?: string | null;
}

/**
 * Formats date into standard "30-Jul-2026" or "02-Aug-2026" format
 */
const formatDate = (dateStr?: string | null): string => {
  if (!dateStr) return '';
  try {
    // Handle both YYYY-MM-DD and ISO strings
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const monthIdx = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      if (!isNaN(year) && monthIdx >= 0 && monthIdx < 12 && !isNaN(day)) {
        const paddedDay = day < 10 ? `0${day}` : `${day}`;
        return `${paddedDay}-${months[monthIdx]}-${year}`;
      }
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const day = d.getDate() < 10 ? `0${d.getDate()}` : `${d.getDate()}`;
      return `${day}-${months[d.getMonth()]}-${d.getFullYear()}`;
    }
    return dateStr;
  } catch {
    return dateStr || '';
  }
};

/**
 * Stage ranking in recruitment progression
 */
const STAGE_RANKS: Record<string, number> = {
  Saved: 0,
  Applied: 1,
  'Application Viewed': 2,
  'Under Review': 2,
  Shortlisted: 3,
  'Assessment Pending': 4,
  'Online Assessment': 4,
  'Interview Scheduled': 5,
  'Technical Interview': 5,
  'HR Interview': 6,
  'Final Interview': 7,
  'Interview Completed': 7,
  'Offer Received': 8,
  Selected: 9,
};

/**
 * Evaluates the status of each pipeline stage for an application
 */
const evaluatePipelineStages = (app: Application) => {
  const currentStage = app.current_stage || 'Applied';
  const currentStatus = app.current_status || 'Applied';
  const isRejected = currentStage === 'Rejected' || currentStatus === 'Rejected';
  const isWithdrawn = currentStage === 'Withdrawn' || currentStatus === 'Withdrawn';
  const isSelected = currentStage === 'Selected' || currentStatus === 'Selected';

  // Compute maximum stage progress
  const stageRank = STAGE_RANKS[currentStage] ?? 1;
  const statusRank = STAGE_RANKS[currentStatus] ?? 1;
  const rank = Math.max(stageRank, statusRank);

  // 1. Application Viewed
  const applicationViewed = rank >= 2 ? 'Yes' : isWithdrawn ? 'N/A' : 'No';

  // 2. Shortlisted
  const shortlisted = rank >= 3 ? 'Yes' : isWithdrawn ? 'N/A' : 'No';

  // 3. Online Assessment
  let onlineAssessment = 'No';
  if (isWithdrawn && rank < 4) {
    onlineAssessment = 'N/A';
  } else if (rank > 4) {
    onlineAssessment = 'Completed';
  } else if (rank === 4) {
    onlineAssessment = currentStatus === 'Assessment Pending' ? 'Pending' : 'Scheduled';
  } else if (currentStatus === 'Assessment Pending') {
    onlineAssessment = 'Pending';
  }

  // 4. Technical Interview
  let technicalInterview = 'No';
  if (isWithdrawn && rank < 5) {
    technicalInterview = 'N/A';
  } else if (rank > 5) {
    technicalInterview = 'Completed';
  } else if (rank === 5) {
    technicalInterview = app.interview_done ? 'Completed' : 'Scheduled';
  } else if (app.interview_done && app.interview_round === 'Technical') {
    technicalInterview = 'Completed';
  }

  // 5. HR Interview
  let hrInterview = 'No';
  if (isWithdrawn && rank < 6) {
    hrInterview = 'N/A';
  } else if (rank > 6) {
    hrInterview = 'Completed';
  } else if (rank === 6) {
    hrInterview = app.interview_done ? 'Completed' : 'Scheduled';
  } else if (app.interview_done && app.interview_round === 'HR') {
    hrInterview = 'Completed';
  }

  // 6. Final Interview
  let finalInterview = 'No';
  if (isWithdrawn && rank < 7) {
    finalInterview = 'N/A';
  } else if (rank > 7) {
    finalInterview = 'Completed';
  } else if (rank === 7) {
    finalInterview = app.interview_done ? 'Completed' : 'Scheduled';
  } else if (app.interview_done && app.interview_round === 'Final') {
    finalInterview = 'Completed';
  }

  // 7. Offer Received
  let offerReceived = 'No';
  if (isWithdrawn && rank < 8) {
    offerReceived = 'N/A';
  } else if (isSelected || rank > 8) {
    offerReceived = 'Completed';
  } else if (rank === 8 || currentStage === 'Offer Received' || currentStatus === 'Offer Received') {
    offerReceived = 'Yes';
  }

  // 8. Selected
  const selected = isSelected ? 'Yes' : 'No';

  // 9. Rejected
  const rejected = isRejected ? 'Yes' : 'No';

  return {
    applicationViewed,
    shortlisted,
    onlineAssessment,
    technicalInterview,
    hrInterview,
    finalInterview,
    offerReceived,
    selected,
    rejected,
  };
};

/**
 * Escapes values for safe CSV representation
 */
const escapeCSV = (value: unknown): string => {
  if (value === null || value === undefined) return '""';
  const str = String(value).trim();
  return `"${str.replace(/"/g, '""')}"`;
};

/**
 * Exports clean, essential application tracking report with User Profile header
 * and exact 16-column application pipeline table
 */
export const exportApplicationsToCSV = (
  applications: Application[],
  userInfo?: UserProfileExportInfo | null
) => {
  // Resolve user / profile information from authenticated session, profile record, or fallback
  const localProfile = getLocalProfile();

  const userName =
    userInfo?.userName ||
    localProfile?.full_name ||
    'Not provided';

  const userEmail =
    userInfo?.userEmail ||
    localProfile?.email ||
    'Not provided';

  const userId =
    userInfo?.userId ||
    localProfile?.user_id ||
    (applications.length > 0 ? applications[0].user_id : 'Not available');

  const profilePhotoUrl =
    userInfo?.profilePhotoUrl !== undefined
      ? userInfo.profilePhotoUrl || 'Not available'
      : localProfile?.profile_photo_url || 'Not available';

  // User Profile Header lines at the top of the CSV
  const userHeaderLines = [
    `"User Name:","${userName.replace(/"/g, '""')}"`,
    `"User Email:","${userEmail.replace(/"/g, '""')}"`,
    `"User ID:","${userId.replace(/"/g, '""')}"`,
    `"Profile Photo URL:","${profilePhotoUrl.replace(/"/g, '""')}"`,
    '""', // Blank line between User Profile and Application Pipeline table
  ];

  // Complete Detailed & Pipeline Columns (All 30+ Fields)
  const headers = [
    'Application ID',
    'Company Name',
    'Job Role',
    'Application Type',
    'Location',
    'Applied Date',
    'Current Stage',
    'Current Status',
    'Application Viewed',
    'Shortlisted',
    'Online Assessment',
    'Technical Interview',
    'HR Interview',
    'Final Interview',
    'Offer Received',
    'Selected',
    'Rejected',
    'Interview Conducted',
    'Interview Date',
    'Interview Round',
    'Interviewer Name',
    'Interview Feedback',
    'Interview Notes',
    'Resume File Name',
    'Offered Salary / Stipend',
    'Follow-up Required',
    'Follow-up Date',
    'Follow-up Notes',
    'Company Website',
    'Company LinkedIn',
    'Job Posting Link',
    'What I Learned',
    'Job Description',
    'Additional Notes',
    'Created At',
    'Updated At',
  ];

  const rows = applications.map((app) => {
    const stages = evaluatePipelineStages(app);
    const currentStatusDisplay = app.current_status || app.current_stage || 'Applied';

    return [
      escapeCSV(app.id),
      escapeCSV(app.company_name),
      escapeCSV(app.job_title),
      escapeCSV(app.application_type || 'Job'),
      escapeCSV(app.location || ''),
      escapeCSV(formatDate(app.date_applied)),
      escapeCSV(app.current_stage || 'Applied'),
      escapeCSV(currentStatusDisplay),
      escapeCSV(stages.applicationViewed),
      escapeCSV(stages.shortlisted),
      escapeCSV(stages.onlineAssessment),
      escapeCSV(stages.technicalInterview),
      escapeCSV(stages.hrInterview),
      escapeCSV(stages.finalInterview),
      escapeCSV(stages.offerReceived),
      escapeCSV(stages.selected),
      escapeCSV(stages.rejected),
      escapeCSV(app.interview_done ? 'Yes' : 'No'),
      escapeCSV(app.interview_date ? formatDate(app.interview_date) : ''),
      escapeCSV(app.interview_round || ''),
      escapeCSV(app.interviewer_name || ''),
      escapeCSV(app.interview_feedback || ''),
      escapeCSV(app.interview_notes || ''),
      escapeCSV(app.resume_file_name || ''),
      escapeCSV(app.offered_salary || ''),
      escapeCSV(app.follow_up_required ? 'Yes' : 'No'),
      escapeCSV(app.follow_up_date ? formatDate(app.follow_up_date) : ''),
      escapeCSV(app.follow_up_notes || ''),
      escapeCSV(app.company_website || ''),
      escapeCSV(app.linkedin_url || ''),
      escapeCSV(app.job_posting_url || ''),
      escapeCSV(app.what_i_learned || ''),
      escapeCSV(app.job_description || ''),
      escapeCSV(app.additional_notes || ''),
      escapeCSV(app.created_at || ''),
      escapeCSV(app.updated_at || ''),
    ];
  });

  const csvContent = [
    ...userHeaderLines,
    headers.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\r\n');

  const today = new Date().toISOString().split('T')[0];
  const filename = `job-applications-report-${today}.csv`;

  // Supports native Android sharing/saving via Capacitor, with graceful browser fallback
  saveOrShareCSV(filename, csvContent);
};
