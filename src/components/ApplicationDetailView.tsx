import React, { useState, useEffect, useRef } from 'react';
import {
  Application,
  ApplicationStage,
  ApplicationStatus,
  ApplicationType,
  ApplicationTimelineEvent,
  ALL_STAGES,
  ALL_STATUSES,
  APPLICATION_TYPES,
  INTERVIEW_ROUNDS,
  InterviewRound,
  REMINDER_EVENT_TYPES,
  ReminderEventType,
} from '../types/database';
import { useApplications } from '../context/ApplicationContext';
import { StageStepper } from './StageStepper';
import { StatusBadge } from './StatusBadge';
import { dataService } from '../lib/supabase';
import {
  ArrowLeft,
  Building,
  Briefcase,
  Calendar,
  MapPin,
  Globe,
  Linkedin,
  ExternalLink,
  Edit,
  Trash2,
  FileText,
  Download,
  Eye,
  RefreshCw,
  Plus,
  Clock,
  Sparkles,
  MessageSquare,
  HelpCircle,
  IndianRupee,
  CheckCircle2,
  CalendarPlus,
  Mail,
  Check,
  X,
  Phone,
  Upload,
  AlertCircle,
  FileUp,
  Bell,
} from 'lucide-react';

interface ApplicationDetailViewProps {
  application: Application;
  onBack: () => void;
  onEdit: (app: Application) => void;
  onReplaceResume: (app: Application) => void;
}

export const ApplicationDetailView: React.FC<ApplicationDetailViewProps> = ({
  application,
  onBack,
}) => {
  const {
    updateApplication,
    deleteApplication,
    quickUpdateStage,
    showToast,
    addTimelineEntry,
    deleteTimelineEntry,
    updateTimelineEntry,
    markTimelineEventCompleted,
  } = useApplications();

  // Active inline editing field identifier
  const [editingField, setEditingField] = useState<string | null>(null);
  const [fieldValue, setFieldValue] = useState<any>('');
  const [fieldSecondaryValue, setFieldSecondaryValue] = useState<any>('');
  const [savingField, setSavingField] = useState(false);
  const [savedSuccessField, setSavedSuccessField] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);

  // Timeline events state
  const [timelineEvents, setTimelineEvents] = useState<ApplicationTimelineEvent[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventType, setNewEventType] = useState<string>('Online Assessment');
  const [newEventDesc, setNewEventDesc] = useState('');
  const [newEventDate, setNewEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [newEventTime, setNewEventTime] = useState('');
  const [newEventReminderEnabled, setNewEventReminderEnabled] = useState(true);
  const [newEventReminderDays, setNewEventReminderDays] = useState<number[]>([2, 1]);

  // Timeline event editing state
  const [editingTimelineId, setEditingTimelineId] = useState<string | null>(null);
  const [editTimelineTitle, setEditTimelineTitle] = useState('');
  const [editTimelineStatus, setEditTimelineStatus] = useState('');
  const [editTimelineDate, setEditTimelineDate] = useState('');
  const [editTimelineTime, setEditTimelineTime] = useState('');
  const [editTimelineDesc, setEditTimelineDesc] = useState('');
  const [editTimelineReminderEnabled, setEditTimelineReminderEnabled] = useState(true);
  const [editTimelineReminderDays, setEditTimelineReminderDays] = useState<number[]>([2, 1]);

  // Stage transition modal
  const [stageTransitionModal, setStageTransitionModal] = useState<{
    open: boolean;
    stage: ApplicationStage;
    status?: ApplicationStatus;
  }>({ open: false, stage: 'Applied' });
  const [stageDate, setStageDate] = useState(new Date().toISOString().split('T')[0]);
  const [stageTime, setStageTime] = useState('');
  const [stageReminderEnabled, setStageReminderEnabled] = useState(true);
  const [stageReminderDays, setStageReminderDays] = useState<number[]>([2, 1]);
  const [stageNotes, setStageNotes] = useState('');

  const handleStageTransitionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await quickUpdateStage(
      application.id,
      stageTransitionModal.stage,
      stageTransitionModal.status,
      stageDate,
      stageReminderEnabled ? stageReminderDays : []
    );
    if (stageNotes.trim() || stageTime) {
      // If notes or time are provided, also update the latest timeline event description/time
      try {
        const events = await dataService.getTimeline(application.id);
        if (events.length > 0 && events[0].event_type === stageTransitionModal.stage) {
          await updateTimelineEntry(events[0].id, application.id, {
            event_time: stageTime || null,
            event_description: stageNotes.trim() || events[0].event_description,
          });
        }
      } catch (err) {
        console.warn('Could not attach notes to stage event:', err);
      }
    }
    setStageTransitionModal({ open: false, stage: 'Applied' });
    await loadTimeline();
  };

  // Resume state
  const [resumeDownloadUrl, setResumeDownloadUrl] = useState<string>('');
  const [uploadingResume, setUploadingResume] = useState(false);
  const resumeInputRef = useRef<HTMLInputElement | null>(null);

  const today = new Date().toISOString().split('T')[0];

  const loadTimeline = async () => {
    setLoadingTimeline(true);
    try {
      const events = await dataService.getTimeline(application.id);
      setTimelineEvents(events);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTimeline(false);
    }
  };

  useEffect(() => {
    loadTimeline();
    if (application.resume_file_path) {
      dataService.getResumeDownloadUrl(application.resume_file_path).then((url) => {
        setResumeDownloadUrl(url);
      });
    } else {
      setResumeDownloadUrl('');
    }
  }, [application.id, application.resume_file_path]);

  // Trigger inline saved feedback
  const triggerSavedFeedback = (fieldName: string) => {
    setSavedSuccessField(fieldName);
    showToast('Saved successfully', 'success');
    setTimeout(() => {
      setSavedSuccessField(null);
    }, 2500);
  };

  // Start inline editing for a field
  const startEditing = (field: string, initialValue: any, secondaryValue: any = '') => {
    setEditingField(field);
    setFieldValue(initialValue ?? '');
    setFieldSecondaryValue(secondaryValue ?? '');
    setFieldError(null);
  };

  // Cancel inline editing
  const cancelEditing = () => {
    setEditingField(null);
    setFieldValue('');
    setFieldSecondaryValue('');
    setFieldError(null);
  };

  // URL Validation helper
  const isValidUrl = (url: string) => {
    if (!url || !url.trim()) return true;
    try {
      const formatted = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
      const parsed = new URL(formatted);
      return Boolean(parsed.hostname);
    } catch {
      return false;
    }
  };

  // Save inline field update
  const saveField = async (field: string, customUpdates?: Partial<Application>) => {
    setFieldError(null);
    setSavingField(true);

    try {
      let updates: Partial<Application> = {};

      if (customUpdates) {
        updates = customUpdates;
      } else {
        switch (field) {
          case 'job_title':
            if (!fieldValue || !String(fieldValue).trim()) {
              setFieldError('Job title cannot be empty');
              setSavingField(false);
              return;
            }
            updates.job_title = String(fieldValue).trim();
            break;

          case 'company_name':
            if (!fieldValue || !String(fieldValue).trim()) {
              setFieldError('Company name cannot be empty');
              setSavingField(false);
              return;
            }
            updates.company_name = String(fieldValue).trim();
            break;

          case 'application_type':
            updates.application_type = fieldValue as ApplicationType;
            break;

          case 'location':
            updates.location = fieldValue ? String(fieldValue).trim() : null;
            break;

          case 'date_applied':
            if (!fieldValue) {
              setFieldError('Date applied is required');
              setSavingField(false);
              return;
            }
            updates.date_applied = String(fieldValue);
            break;

          case 'job_description':
            updates.job_description = fieldValue ? String(fieldValue).trim() : null;
            break;

          case 'what_i_learned':
            updates.what_i_learned = fieldValue ? String(fieldValue).trim() : null;
            break;

          case 'company_website':
            if (fieldValue && !isValidUrl(fieldValue)) {
              setFieldError('Please enter a valid website URL (e.g. https://company.com)');
              setSavingField(false);
              return;
            }
            updates.company_website = fieldValue ? String(fieldValue).trim() : null;
            break;

          case 'linkedin_url':
            if (fieldValue && !isValidUrl(fieldValue)) {
              setFieldError('Please enter a valid LinkedIn URL');
              setSavingField(false);
              return;
            }
            updates.linkedin_url = fieldValue ? String(fieldValue).trim() : null;
            break;

          case 'job_posting_url':
            if (fieldValue && !isValidUrl(fieldValue)) {
              setFieldError('Please enter a valid URL');
              setSavingField(false);
              return;
            }
            updates.job_posting_url = fieldValue ? String(fieldValue).trim() : null;
            break;

          case 'current_stage':
            if (fieldValue !== application.current_stage) {
              await quickUpdateStage(application.id, fieldValue as ApplicationStage);
              triggerSavedFeedback('current_stage');
              setEditingField(null);
              setSavingField(false);
              return;
            }
            setEditingField(null);
            setSavingField(false);
            return;

          case 'interview_status':
            // Status or done flag
            updates.interview_done = Boolean(fieldValue !== 'Cancelled' && fieldValue !== 'No');
            updates.current_status = fieldValue === 'Completed' ? 'Interview Completed' : 'Interview Scheduled';
            break;

          case 'interview_round':
            updates.interview_round = fieldValue as InterviewRound;
            updates.interview_done = true;
            break;

          case 'interview_date':
            updates.interview_date = fieldValue ? String(fieldValue).trim() : null;
            updates.interview_done = Boolean(fieldValue);
            break;

          case 'interview_time':
            // Stored in interview_notes or as prefix
            const existingNotes = application.interview_notes || '';
            const cleanedNotes = existingNotes.replace(/^Time: [^\n]+\n?/, '');
            updates.interview_notes = fieldValue ? `Time: ${fieldValue}\n${cleanedNotes}`.trim() : cleanedNotes;
            break;

          case 'interviewer_name':
            updates.interviewer_name = fieldValue ? String(fieldValue).trim() : null;
            break;

          case 'interview_feedback':
            updates.interview_feedback = fieldValue ? String(fieldValue).trim() : null;
            break;

          case 'interview_notes':
            updates.interview_notes = fieldValue ? String(fieldValue).trim() : null;
            break;

          case 'offered_salary':
            const salaryAmt = String(fieldValue).trim();
            const salaryType = fieldSecondaryValue ? ` (${fieldSecondaryValue})` : '';
            updates.offered_salary = salaryAmt ? `${salaryAmt}${salaryType}` : null;
            break;

          case 'follow_up':
            updates.follow_up_required = Boolean(fieldValue === true || fieldValue === 'Yes');
            updates.follow_up_date = fieldSecondaryValue?.date ? String(fieldSecondaryValue.date) : application.follow_up_date;
            updates.follow_up_notes = fieldSecondaryValue?.notes ? String(fieldSecondaryValue.notes) : application.follow_up_notes;
            break;

          case 'additional_notes':
            updates.additional_notes = fieldValue ? String(fieldValue).trim() : null;
            break;

          default:
            break;
        }
      }

      await updateApplication(application.id, updates);
      triggerSavedFeedback(field);
      setEditingField(null);
    } catch (err: unknown) {
      console.error(err);
      setFieldError(err instanceof Error ? err.message : 'Error saving changes');
    } finally {
      setSavingField(false);
    }
  };

  // Resume handlers
  const handleResumeFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadingResume(true);
      try {
        await updateApplication(application.id, {}, file);
        showToast('Resume uploaded and updated successfully!', 'success');
        triggerSavedFeedback('resume');
      } catch (err) {
        showToast('Failed to upload resume', 'error');
      } finally {
        setUploadingResume(false);
      }
    }
  };

  const handleDeleteResume = async () => {
    if (window.confirm('Are you sure you want to remove the resume from this application?')) {
      setSavingField(true);
      try {
        await updateApplication(application.id, {
          resume_file_name: null,
          resume_file_path: null,
          resume_file_type: null,
          resume_file_size: null,
          resume_uploaded_at: null,
        });
        setResumeDownloadUrl('');
        showToast('Resume removed successfully', 'info');
        triggerSavedFeedback('resume');
      } catch (err) {
        showToast('Failed to remove resume', 'error');
      } finally {
        setSavingField(false);
      }
    }
  };

  const handleDownloadResume = () => {
    if (resumeDownloadUrl) {
      const link = document.createElement('a');
      link.href = resumeDownloadUrl;
      link.download = application.resume_file_name || 'resume.pdf';
      link.target = '_blank';
      link.rel = 'noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Downloading resume...', 'info');
    } else {
      showToast('Resume link not ready or file missing', 'error');
    }
  };

  // Timeline handlers
  const handleAddTimelineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;
    await addTimelineEntry(application.id, {
      event_title: newEventTitle.trim(),
      event_type: newEventType,
      event_description: newEventDesc.trim() || undefined,
      event_date: newEventDate,
      event_time: newEventTime || null,
      reminder_enabled: newEventReminderEnabled,
      custom_reminder_days: newEventReminderDays,
    });
    setNewEventTitle('');
    setNewEventDesc('');
    setNewEventTime('');
    setShowAddEventModal(false);
    await loadTimeline();
  };

  const startEditTimeline = (event: ApplicationTimelineEvent) => {
    setEditingTimelineId(event.id);
    setEditTimelineTitle(event.event_title);
    setEditTimelineStatus(event.event_type || 'Custom Reminder');
    setEditTimelineDate(event.event_date ? event.event_date.split('T')[0] : '');
    setEditTimelineTime(event.event_time || '');
    setEditTimelineDesc(event.event_description || '');
    setEditTimelineReminderEnabled(event.reminder_enabled ?? true);
    setEditTimelineReminderDays(event.custom_reminder_days || [2, 1]);
  };

  const saveEditTimeline = async (eventId: string) => {
    if (!editTimelineTitle.trim()) return;
    try {
      await updateTimelineEntry(eventId, application.id, {
        event_title: editTimelineTitle.trim(),
        event_type: editTimelineStatus,
        event_date: editTimelineDate,
        event_time: editTimelineTime || null,
        event_description: editTimelineDesc.trim() || null,
        reminder_enabled: editTimelineReminderEnabled,
        custom_reminder_days: editTimelineReminderDays,
      });
      setEditingTimelineId(null);
      await loadTimeline();
    } catch (err) {
      showToast('Failed to update timeline event', 'error');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (window.confirm('Delete this timeline event?')) {
      await deleteTimelineEntry(eventId, application.id);
      await loadTimeline();
    }
  };

  const handleDeleteApplication = async () => {
    if (window.confirm(`Are you sure you want to delete application for ${application.company_name}?`)) {
      await deleteApplication(application.id);
      onBack();
    }
  };

  // Helpers for calendar & mail links
  const getGoogleCalendarUrl = (title: string, details: string, dateStr: string) => {
    const cleanDate = dateStr.replace(/-/g, '');
    const encodedTitle = encodeURIComponent(title);
    const encodedDetails = encodeURIComponent(details);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodedTitle}&details=${encodedDetails}&dates=${cleanDate}/${cleanDate}`;
  };

  const getFollowUpMailto = () => {
    const subject = encodeURIComponent(`Following up on application: ${application.job_title} - ${application.company_name}`);
    const body = encodeURIComponent(
      `Dear Hiring Team at ${application.company_name},\n\nI hope you are doing well.\n\nI am writing to respectfully follow up regarding my application for the ${application.job_title} position. I remain enthusiastic about the opportunity to contribute to ${application.company_name}.\n\nPlease let me know if there are any updates regarding my application status or if you require any additional information from my side.\n\nThank you for your time and consideration.\n\nBest regards,\n[Your Name]`
    );
    return `mailto:?subject=${subject}&body=${body}`;
  };

  // Inline action buttons component
  const InlineControls = ({ onSave, onCancel }: { onSave: () => void; onCancel: () => void }) => (
    <div className="flex items-center gap-1.5 shrink-0 ml-2">
      <button
        type="button"
        disabled={savingField}
        onClick={onSave}
        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-2xs transition-colors cursor-pointer"
        title="Save changes"
      >
        <Check className="w-3.5 h-3.5" />
        <span>Save</span>
      </button>
      <button
        type="button"
        disabled={savingField}
        onClick={onCancel}
        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
        title="Cancel"
      >
        <X className="w-3.5 h-3.5" />
        <span>Cancel</span>
      </button>
    </div>
  );

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-200">
      {/* Top Bar Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3.5 py-2 rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Applications
        </button>

        <div className="flex items-center gap-2">
          {application.is_sample && (
            <span className="text-xs font-semibold px-2.5 py-1 bg-amber-100 text-amber-800 border border-amber-300 rounded-lg">
              Demo Sample
            </span>
          )}
          <span className="text-xs font-medium text-slate-400 hidden sm:inline">
            Direct Inline Editing Active (Click ✏️ on any field)
          </span>
          <button
            onClick={handleDeleteApplication}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
        </div>
      </div>

      {/* Main Header Card with Inline Role & Company Editing */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="flex items-start gap-4 flex-1">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-700 text-white flex items-center justify-center text-2xl font-black shadow-md shrink-0">
              {application.company_name.charAt(0).toUpperCase()}
            </div>

            <div className="space-y-2 flex-1">
              {/* Job Title / Role */}
              <div className="flex items-center gap-2 flex-wrap">
                {editingField === 'job_title' ? (
                  <div className="flex items-center gap-2 w-full max-w-lg">
                    <input
                      type="text"
                      value={fieldValue}
                      onChange={(e) => setFieldValue(e.target.value)}
                      className="flex-1 bg-blue-50/50 border border-blue-400 rounded-xl px-3 py-1.5 text-lg font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                    <InlineControls onSave={() => saveField('job_title')} onCancel={cancelEditing} />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 group">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                      {application.job_title}
                    </h1>
                    <button
                      onClick={() => startEditing('job_title', application.job_title)}
                      className="opacity-60 group-hover:opacity-100 text-slate-400 hover:text-blue-600 p-1 rounded hover:bg-slate-100 transition-all cursor-pointer"
                      title="Edit job role"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    {savedSuccessField === 'job_title' && (
                      <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md animate-in fade-in">
                        ✓ Saved
                      </span>
                    )}
                  </div>
                )}

                {/* Application Type */}
                {editingField === 'application_type' ? (
                  <div className="inline-flex items-center gap-1.5">
                    <select
                      value={fieldValue}
                      onChange={(e) => setFieldValue(e.target.value)}
                      className="text-xs font-bold uppercase tracking-wider bg-white border border-blue-400 rounded-lg px-2 py-1 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {APPLICATION_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                    <InlineControls onSave={() => saveField('application_type')} onCancel={cancelEditing} />
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1 group">
                    <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                      {application.application_type}
                    </span>
                    <button
                      onClick={() => startEditing('application_type', application.application_type)}
                      className="opacity-40 group-hover:opacity-100 text-slate-400 hover:text-blue-600 p-0.5 rounded hover:bg-slate-100 transition-all cursor-pointer"
                      title="Edit job type"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Sub-header: Company, Location, Date Applied */}
              <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-600">
                {/* Company Name */}
                {editingField === 'company_name' ? (
                  <div className="inline-flex items-center gap-1.5">
                    <input
                      type="text"
                      value={fieldValue}
                      onChange={(e) => setFieldValue(e.target.value)}
                      className="bg-white border border-blue-400 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                    <InlineControls onSave={() => saveField('company_name')} onCancel={cancelEditing} />
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 group">
                    <Building className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-slate-800">{application.company_name}</span>
                    <button
                      onClick={() => startEditing('company_name', application.company_name)}
                      className="opacity-40 group-hover:opacity-100 text-slate-400 hover:text-blue-600 p-0.5 rounded hover:bg-slate-100 transition-all cursor-pointer"
                      title="Edit company name"
                    >
                      <Edit className="w-3 h-3" />
                    </button>
                    {savedSuccessField === 'company_name' && (
                      <span className="text-[11px] font-semibold text-emerald-600">✓ Saved</span>
                    )}
                  </div>
                )}

                {/* Location */}
                {editingField === 'location' ? (
                  <div className="inline-flex items-center gap-1.5">
                    <input
                      type="text"
                      placeholder="e.g. Bengaluru, Remote"
                      value={fieldValue}
                      onChange={(e) => setFieldValue(e.target.value)}
                      className="bg-white border border-blue-400 rounded-lg px-2.5 py-1 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                    <InlineControls onSave={() => saveField('location')} onCancel={cancelEditing} />
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1 group">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{application.location || 'Location not specified'}</span>
                    <button
                      onClick={() => startEditing('location', application.location || '')}
                      className="opacity-40 group-hover:opacity-100 text-slate-400 hover:text-blue-600 p-0.5 rounded hover:bg-slate-100 transition-all cursor-pointer"
                      title="Edit location"
                    >
                      <Edit className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {/* Date Applied */}
                {editingField === 'date_applied' ? (
                  <div className="inline-flex items-center gap-1.5">
                    <input
                      type="date"
                      value={fieldValue}
                      onChange={(e) => setFieldValue(e.target.value)}
                      className="bg-white border border-blue-400 rounded-lg px-2 py-1 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                    <InlineControls onSave={() => saveField('date_applied')} onCancel={cancelEditing} />
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1 group">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      Applied on{' '}
                      {new Date(application.date_applied).toLocaleDateString('en-US', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                    <button
                      onClick={() => startEditing('date_applied', application.date_applied)}
                      className="opacity-40 group-hover:opacity-100 text-slate-400 hover:text-blue-600 p-0.5 rounded hover:bg-slate-100 transition-all cursor-pointer"
                      title="Edit application date"
                    >
                      <Edit className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Status Badge */}
          <div className="flex flex-col sm:items-end gap-2 shrink-0">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</div>
            <StatusBadge status={application.current_status} size="lg" />
          </div>
        </div>

        {/* SECTION 8: APPLICATION PIPELINE PROGRESS (Directly Editable Pipeline Stage) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                8. Application Pipeline Progress
              </h3>
              <button
                onClick={() => {
                  setStageTransitionModal({
                    open: true,
                    stage: application.current_stage,
                    status: application.current_status,
                  });
                  setStageDate(new Date().toISOString().split('T')[0]);
                  setStageTime('');
                  setStageReminderEnabled(true);
                  setStageReminderDays([2, 1]);
                  setStageNotes('');
                }}
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-md hover:bg-blue-100 transition-colors cursor-pointer"
              >
                <Edit className="w-3 h-3" /> Change Stage ✏️
              </button>
              <button
                onClick={() => {
                  setStageTransitionModal({
                    open: true,
                    stage: application.current_stage,
                    status: application.current_status,
                  });
                  setStageDate(new Date().toISOString().split('T')[0]);
                  setStageTime('');
                  setStageReminderEnabled(true);
                  setStageReminderDays([2, 1]);
                  setStageNotes('');
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-200 hover:bg-indigo-100 transition-colors cursor-pointer"
              >
                <Bell className="w-3.5 h-3.5 text-indigo-600" /> + Stage Date & Reminders
              </button>
              {savedSuccessField === 'current_stage' && (
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                  ✓ Stage Saved & Timeline Recorded
                </span>
              )}
            </div>
            <span className="text-xs text-slate-400">Click any step or ✏️ to update pipeline & set reminders</span>
          </div>

          <StageStepper
            currentStage={application.current_stage}
            currentStatus={application.current_status}
            interactive={true}
            onUpdateStage={(stg, sts) => {
              setStageTransitionModal({ open: true, stage: stg, status: sts });
              setStageDate(new Date().toISOString().split('T')[0]);
              setStageTime('');
              setStageReminderEnabled(true);
              setStageReminderDays([2, 1]);
              setStageNotes('');
            }}
          />
        </div>
      </div>

      {/* Grid of Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* SECTION 1: Job Description */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-blue-600" /> 1. Job Description
              </h3>
              {editingField !== 'job_description' && (
                <button
                  onClick={() => startEditing('job_description', application.job_description || '')}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-blue-600 hover:bg-blue-50 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  <Edit className="w-3.5 h-3.5" /> Edit Description ✏️
                </button>
              )}
            </div>

            {editingField === 'job_description' ? (
              <div className="space-y-3">
                <textarea
                  rows={6}
                  placeholder="Paste or write key responsibilities, role overview, or requirements..."
                  value={fieldValue}
                  onChange={(e) => setFieldValue(e.target.value)}
                  className="w-full bg-blue-50/20 border border-blue-400 rounded-xl p-3 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none leading-relaxed"
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={cancelEditing}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                  >
                    Cancel ✕
                  </button>
                  <button
                    onClick={() => saveField('job_description')}
                    className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs cursor-pointer"
                  >
                    Save Description ✓
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {application.job_description ? (
                  <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed bg-slate-50/60 p-4 rounded-xl border border-slate-100">
                    {application.job_description}
                  </p>
                ) : (
                  <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
                    <p className="text-xs text-slate-400 italic">No job description added yet.</p>
                    <button
                      onClick={() => startEditing('job_description', '')}
                      className="mt-1 text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                    >
                      + Add Job Description
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SECTION 6: What I Learned */}
          <div className="bg-gradient-to-br from-amber-50/50 to-orange-50/30 rounded-3xl p-6 border border-amber-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-amber-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600" /> 6. What I Learned
              </h3>
              {editingField !== 'what_i_learned' && (
                <button
                  onClick={() => startEditing('what_i_learned', application.what_i_learned || '')}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 hover:text-amber-950 bg-white/80 hover:bg-white border border-amber-300 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  <Edit className="w-3.5 h-3.5" /> Edit Learning Notes ✏️
                </button>
              )}
            </div>

            <p className="text-xs text-amber-800/80">
              Skills learned, DSA topics, interview questions, technical concepts, personal observations & areas to improve.
            </p>

            {editingField === 'what_i_learned' ? (
              <div className="space-y-3">
                <textarea
                  rows={5}
                  placeholder="e.g. Learned about system design tradeoffs, Redis caching patterns, and Go concurrency. Interviewer emphasized clean unit tests..."
                  value={fieldValue}
                  onChange={(e) => setFieldValue(e.target.value)}
                  className="w-full bg-white border border-amber-400 rounded-xl p-3 text-sm text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none leading-relaxed"
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={cancelEditing}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                  >
                    Cancel ✕
                  </button>
                  <button
                    onClick={() => saveField('what_i_learned')}
                    className="px-4 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs cursor-pointer"
                  >
                    Save What I Learned ✓
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {application.what_i_learned ? (
                  <div className="text-sm text-slate-800 whitespace-pre-line leading-relaxed bg-white p-4 rounded-xl border border-amber-200 shadow-2xs">
                    {application.what_i_learned}
                  </div>
                ) : (
                  <div className="p-4 bg-white/70 rounded-xl border border-dashed border-amber-200 text-center">
                    <p className="text-xs text-slate-400 italic">No learning notes recorded yet.</p>
                    <button
                      onClick={() => startEditing('what_i_learned', '')}
                      className="mt-1 text-xs font-bold text-amber-700 hover:underline cursor-pointer"
                    >
                      + Add What I Learned
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SECTION 5 & 7: Interview Details & Feedback (Every field individually editable) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-600" /> 5 & 7. Interview Details & Feedback
              </h3>
              <span className="text-xs text-slate-400">Directly editable</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 p-4 bg-slate-50/80 rounded-2xl border border-slate-200 text-xs">
              {/* Interview Status */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-500">Interview Status:</span>
                  {editingField !== 'interview_status' && (
                    <button
                      onClick={() =>
                        startEditing(
                          'interview_status',
                          application.interview_done ? 'Completed' : 'Scheduled'
                        )
                      }
                      className="text-slate-400 hover:text-blue-600 p-0.5"
                    >
                      <Edit className="w-3 h-3" />
                    </button>
                  )}
                </div>
                {editingField === 'interview_status' ? (
                  <div className="space-y-1.5">
                    <select
                      value={fieldValue}
                      onChange={(e) => setFieldValue(e.target.value)}
                      className="w-full bg-white border border-blue-400 rounded-lg px-2 py-1 text-xs font-bold text-slate-900"
                    >
                      <option value="Scheduled">Scheduled</option>
                      <option value="Completed">Completed</option>
                      <option value="Rescheduled">Rescheduled</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                    <InlineControls onSave={() => saveField('interview_status')} onCancel={cancelEditing} />
                  </div>
                ) : (
                  <div className="font-bold text-emerald-700">
                    {application.interview_done ? 'Completed / Scheduled' : 'Not Scheduled'}
                  </div>
                )}
              </div>

              {/* Interview Round */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-500">Round:</span>
                  {editingField !== 'interview_round' && (
                    <button
                      onClick={() => startEditing('interview_round', application.interview_round || 'Technical')}
                      className="text-slate-400 hover:text-blue-600 p-0.5"
                    >
                      <Edit className="w-3 h-3" />
                    </button>
                  )}
                </div>
                {editingField === 'interview_round' ? (
                  <div className="space-y-1.5">
                    <select
                      value={fieldValue}
                      onChange={(e) => setFieldValue(e.target.value)}
                      className="w-full bg-white border border-blue-400 rounded-lg px-2 py-1 text-xs font-bold text-slate-900"
                    >
                      <option value="Online Assessment">Online Assessment</option>
                      <option value="Technical">Technical</option>
                      <option value="HR">HR</option>
                      <option value="Final">Final</option>
                      <option value="Managerial">Managerial</option>
                      <option value="Coding">Coding</option>
                      <option value="Aptitude">Aptitude</option>
                      <option value="Other">Other</option>
                    </select>
                    <InlineControls onSave={() => saveField('interview_round')} onCancel={cancelEditing} />
                  </div>
                ) : (
                  <div className="font-bold text-slate-800">{application.interview_round || 'General / None'}</div>
                )}
              </div>

              {/* Interview Date */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-500">Interview Date:</span>
                  {editingField !== 'interview_date' && (
                    <button
                      onClick={() => startEditing('interview_date', application.interview_date || '')}
                      className="text-slate-400 hover:text-blue-600 p-0.5"
                    >
                      <Edit className="w-3 h-3" />
                    </button>
                  )}
                </div>
                {editingField === 'interview_date' ? (
                  <div className="space-y-1.5">
                    <input
                      type="date"
                      value={fieldValue}
                      onChange={(e) => setFieldValue(e.target.value)}
                      className="w-full bg-white border border-blue-400 rounded-lg px-2 py-1 text-xs text-slate-900"
                    />
                    <InlineControls onSave={() => saveField('interview_date')} onCancel={cancelEditing} />
                  </div>
                ) : (
                  <div className="font-bold text-slate-800">{application.interview_date || 'N/A'}</div>
                )}
              </div>

              {/* Interviewer Name */}
              <div className="space-y-1 sm:col-span-2 md:col-span-3 pt-1 border-t border-slate-200/70">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-500">Interviewer:</span>
                  {editingField !== 'interviewer_name' && (
                    <button
                      onClick={() => startEditing('interviewer_name', application.interviewer_name || '')}
                      className="text-slate-400 hover:text-blue-600 p-0.5"
                    >
                      <Edit className="w-3 h-3" />
                    </button>
                  )}
                </div>
                {editingField === 'interviewer_name' ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="e.g. John Doe (Tech Lead)"
                      value={fieldValue}
                      onChange={(e) => setFieldValue(e.target.value)}
                      className="flex-1 bg-white border border-blue-400 rounded-lg px-2.5 py-1 text-xs text-slate-900"
                      autoFocus
                    />
                    <InlineControls onSave={() => saveField('interviewer_name')} onCancel={cancelEditing} />
                  </div>
                ) : (
                  <div className="font-bold text-slate-800">{application.interviewer_name || 'Not provided'}</div>
                )}
              </div>
            </div>

            {/* Interviewer Feedback */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Interviewer Feedback
                </h4>
                {editingField !== 'interview_feedback' && (
                  <button
                    onClick={() => startEditing('interview_feedback', application.interview_feedback || '')}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-blue-600"
                  >
                    <Edit className="w-3 h-3" /> Edit Feedback ✏️
                  </button>
                )}
              </div>

              {editingField === 'interview_feedback' ? (
                <div className="space-y-2">
                  <textarea
                    rows={4}
                    placeholder="Record interviewer's positive feedback, areas to improve, questions asked..."
                    value={fieldValue}
                    onChange={(e) => setFieldValue(e.target.value)}
                    className="w-full bg-blue-50/20 border border-blue-400 rounded-xl p-3 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none leading-relaxed"
                    autoFocus
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={cancelEditing}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                    >
                      Cancel ✕
                    </button>
                    <button
                      onClick={() => saveField('interview_feedback')}
                      className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs cursor-pointer"
                    >
                      Save Feedback ✓
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  {application.interview_feedback ? (
                    <div className="text-sm text-slate-800 whitespace-pre-line leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
                      {application.interview_feedback}
                    </div>
                  ) : (
                    <p className="text-xs italic text-slate-400 bg-slate-50 p-3 rounded-xl border border-dashed border-slate-200">
                      No feedback entered yet. Click ✏️ to record feedback.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Preparation / Notes */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-500" /> Interview Preparation / Notes
                </h4>
                {editingField !== 'interview_notes' && (
                  <button
                    onClick={() => startEditing('interview_notes', application.interview_notes || '')}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-blue-600"
                  >
                    <Edit className="w-3 h-3" /> Edit Notes ✏️
                  </button>
                )}
              </div>

              {editingField === 'interview_notes' ? (
                <div className="space-y-2">
                  <textarea
                    rows={3}
                    placeholder="Notes on questions to ask interviewer, recent company announcements, tech prep..."
                    value={fieldValue}
                    onChange={(e) => setFieldValue(e.target.value)}
                    className="w-full bg-blue-50/20 border border-blue-400 rounded-xl p-3 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none leading-relaxed"
                    autoFocus
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={cancelEditing}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                    >
                      Cancel ✕
                    </button>
                    <button
                      onClick={() => saveField('interview_notes')}
                      className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs cursor-pointer"
                    >
                      Save Notes ✓
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  {application.interview_notes ? (
                    <div className="text-sm text-slate-700 whitespace-pre-line leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
                      {application.interview_notes}
                    </div>
                  ) : (
                    <p className="text-xs italic text-slate-400">No interview prep notes.</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* SECTION 3: Application Timeline (Directly editable events) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" /> 3. Application Timeline
              </h3>
              <button
                onClick={() => setShowAddEventModal(true)}
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-2.5 py-1.5 rounded-lg border border-blue-200 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> + Add Timeline Event
              </button>
            </div>

            {loadingTimeline ? (
              <div className="py-4 text-center text-xs text-slate-400">Loading timeline...</div>
            ) : timelineEvents.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No timeline entries yet.</p>
            ) : (
              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {timelineEvents.map((event) => (
                  <div key={event.id} className="relative group">
                    <div
                      className={`absolute -left-6 top-1 w-4 h-4 rounded-full ring-4 ring-white ${
                        event.is_completed ? 'bg-emerald-600' : 'bg-blue-600'
                      }`}
                    />

                    {editingTimelineId === event.id ? (
                      /* Inline Timeline Editor */
                      <div className="p-4 bg-blue-50/60 border border-blue-300 rounded-2xl space-y-3 animate-in fade-in">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div>
                            <label className="font-bold text-slate-700 block mb-1">Stage / Title:</label>
                            <input
                              type="text"
                              value={editTimelineTitle}
                              onChange={(e) => setEditTimelineTitle(e.target.value)}
                              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-semibold"
                            />
                          </div>
                          <div>
                            <label className="font-bold text-slate-700 block mb-1">Event Type:</label>
                            <select
                              value={editTimelineStatus}
                              onChange={(e) => setEditTimelineStatus(e.target.value)}
                              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-semibold"
                            >
                              {REMINDER_EVENT_TYPES.map((t) => (
                                <option key={t} value={t}>
                                  {t}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div>
                            <label className="font-bold text-slate-700 block mb-1">Event Date:</label>
                            <input
                              type="date"
                              value={editTimelineDate}
                              onChange={(e) => setEditTimelineDate(e.target.value)}
                              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                            />
                          </div>
                          <div>
                            <label className="font-bold text-slate-700 block mb-1">Event Time:</label>
                            <input
                              type="time"
                              value={editTimelineTime}
                              onChange={(e) => setEditTimelineTime(e.target.value)}
                              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                            />
                          </div>
                        </div>

                        {/* Reminder Settings */}
                        <div className="p-3 bg-white/90 rounded-xl border border-blue-200 space-y-2">
                          <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editTimelineReminderEnabled}
                              onChange={(e) => setEditTimelineReminderEnabled(e.target.checked)}
                              className="rounded text-blue-600 focus:ring-0"
                            />
                            <Bell className="w-3.5 h-3.5 text-blue-600" />
                            <span>Enable Universal Reminders for this event</span>
                          </label>

                          {editTimelineReminderEnabled && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {[
                                { days: 7, label: '7d' },
                                { days: 3, label: '3d' },
                                { days: 2, label: '2d before' },
                                { days: 1, label: '1d before' },
                                { days: 0, label: 'On day' },
                              ].map(({ days, label }) => {
                                const active = editTimelineReminderDays.includes(days);
                                return (
                                  <button
                                    type="button"
                                    key={days}
                                    onClick={() => {
                                      if (active) {
                                        setEditTimelineReminderDays(
                                          editTimelineReminderDays.filter((d) => d !== days)
                                        );
                                      } else {
                                        setEditTimelineReminderDays(
                                          [...editTimelineReminderDays, days].sort((a, b) => b - a)
                                        );
                                      }
                                    }}
                                    className={`text-[11px] px-2.5 py-1 rounded-lg border font-bold transition-all cursor-pointer ${
                                      active
                                        ? 'bg-blue-600 text-white border-blue-600'
                                        : 'bg-slate-50 text-slate-600 border-slate-200'
                                    }`}
                                  >
                                    {label}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="font-bold text-slate-700 block mb-1 text-xs">Notes / Details:</label>
                          <textarea
                            rows={2}
                            value={editTimelineDesc}
                            onChange={(e) => setEditTimelineDesc(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-900"
                          />
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setEditingTimelineId(null)}
                            className="px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg cursor-pointer"
                          >
                            Cancel ✕
                          </button>
                          <button
                            type="button"
                            onClick={() => saveEditTimeline(event.id)}
                            className="px-3.5 py-1 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs cursor-pointer"
                          >
                            Save Event & Reminders ✓
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Display Mode */
                      <div className="flex items-start justify-between gap-3 p-3 rounded-2xl hover:bg-slate-50/90 border border-transparent hover:border-slate-200 transition-all group">
                        <div className="flex items-start gap-3">
                          {/* Checkbox marker: ✓ if completed, ○ if pending */}
                          <button
                            type="button"
                            onClick={() =>
                              markTimelineEventCompleted(
                                event.id,
                                application.id,
                                !event.is_completed
                              )
                            }
                            className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                              event.is_completed
                                ? 'bg-emerald-600 text-white shadow-2xs'
                                : 'border-2 border-slate-300 hover:border-blue-500 text-transparent hover:text-blue-500'
                            }`}
                            title={event.is_completed ? 'Mark event incomplete' : 'Mark event completed'}
                          >
                            <Check className="w-3 h-3 stroke-[3]" />
                          </button>

                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`text-xs font-bold ${
                                  event.is_completed
                                    ? 'line-through text-slate-400'
                                    : 'text-slate-900'
                                }`}
                              >
                                {event.event_title}
                              </span>
                              {event.reminder_enabled && !event.is_completed && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
                                  <Bell className="w-2.5 h-2.5 text-blue-600" />
                                  Reminders enabled
                                </span>
                              )}
                              {event.is_completed && (
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  Completed
                                </span>
                              )}
                            </div>

                            <div className="text-[11px] text-slate-400 flex items-center gap-2">
                              <span className="font-semibold text-slate-600">
                                {new Date(
                                  event.event_date + (event.event_date.includes('T') ? '' : 'T00:00:00')
                                ).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </span>
                              {event.event_time && (
                                <>
                                  <span>•</span>
                                  <span>{event.event_time}</span>
                                </>
                              )}
                            </div>

                            {event.event_description && (
                              <p className="text-xs text-slate-600 mt-1 leading-relaxed bg-slate-50 p-2 rounded-xl border border-slate-100">
                                {event.event_description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                          {event.event_date && (
                            <a
                              href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
                                `${event.event_title} - ${application.company_name}`
                              )}&dates=${event.event_date.replace(/-/g, '').slice(0, 8)}/${event.event_date.replace(/-/g, '').slice(0, 8)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-slate-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                              title="Add to Google Calendar"
                            >
                              <CalendarPlus className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <button
                            onClick={() => startEditTimeline(event)}
                            className="text-slate-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                            title="Edit event"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteEvent(event.id)}
                            className="text-slate-300 hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete event"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 Col) */}
        <div className="space-y-6">
          {/* SECTION 4: Resume Used (Download, Replace, Delete) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" /> 4. Resume Used
              </h3>
              {savedSuccessField === 'resume' && (
                <span className="text-xs font-semibold text-emerald-600">✓ Updated</span>
              )}
            </div>

            {/* Hidden file input for resume replace/upload */}
            <input
              type="file"
              ref={resumeInputRef}
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleResumeFileSelect}
              className="hidden"
            />

            {application.resume_file_name ? (
              <div className="space-y-3">
                <div className="p-4 rounded-2xl border border-blue-200 bg-blue-50/50 flex items-start gap-3">
                  <div className="p-2.5 bg-blue-600 text-white rounded-xl shrink-0 mt-0.5">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="overflow-hidden flex-1">
                    <div className="text-xs font-bold text-slate-900 truncate" title={application.resume_file_name}>
                      {application.resume_file_name}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {application.resume_file_size
                        ? `${(application.resume_file_size / 1024).toFixed(1)} KB`
                        : 'Resume document'}
                      {application.resume_uploaded_at &&
                        ` • ${new Date(application.resume_uploaded_at).toLocaleDateString()}`}
                    </div>
                  </div>
                </div>

                {/* Action Buttons: Download, Replace, Delete */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={handleDownloadResume}
                    className="flex items-center justify-center gap-1 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 py-2 px-2 rounded-xl shadow-xs transition-colors cursor-pointer"
                    title="Download resume"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>

                  <button
                    disabled={uploadingResume}
                    onClick={() => resumeInputRef.current?.click()}
                    className="flex items-center justify-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 py-2 px-2 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                    title="Replace with new file"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${uploadingResume ? 'animate-spin' : ''}`} />
                    <span>{uploadingResume ? '...' : 'Replace'}</span>
                  </button>

                  <button
                    onClick={handleDeleteResume}
                    className="flex items-center justify-center gap-1 text-xs font-semibold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 py-2 px-2 rounded-xl border border-rose-200 transition-colors cursor-pointer"
                    title="Delete resume"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl border border-dashed border-slate-200 text-center space-y-2">
                <p className="text-xs text-slate-500">No resume attached to this application.</p>
                <button
                  disabled={uploadingResume}
                  onClick={() => resumeInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-xl cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploadingResume ? 'Uploading...' : 'Upload Resume'}</span>
                </button>
              </div>
            )}
          </div>

          {/* SECTION 2: Company Links (Individually Editable) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-600" /> 2. Company Links
            </h3>

            <div className="space-y-3 text-xs">
              {/* Company Website */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-slate-500 font-semibold">
                  <span className="flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5" /> Company Website:
                  </span>
                  {editingField !== 'company_website' && (
                    <button
                      onClick={() => startEditing('company_website', application.company_website || '')}
                      className="text-slate-400 hover:text-blue-600 p-0.5"
                    >
                      <Edit className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {editingField === 'company_website' ? (
                  <div className="space-y-1">
                    <input
                      type="url"
                      placeholder="https://company.com"
                      value={fieldValue}
                      onChange={(e) => setFieldValue(e.target.value)}
                      className="w-full bg-white border border-blue-400 rounded-lg px-2.5 py-1 text-xs text-slate-900"
                      autoFocus
                    />
                    {fieldError && <p className="text-[11px] text-rose-600">{fieldError}</p>}
                    <InlineControls onSave={() => saveField('company_website')} onCancel={cancelEditing} />
                  </div>
                ) : application.company_website ? (
                  <a
                    href={application.company_website}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-blue-50 text-blue-600 font-semibold transition-colors"
                  >
                    <span className="truncate">{application.company_website}</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  </a>
                ) : (
                  <div className="text-slate-400 italic">No website URL set.</div>
                )}
              </div>

              {/* LinkedIn Profile */}
              <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between text-slate-500 font-semibold">
                  <span className="flex items-center gap-1">
                    <Linkedin className="w-3.5 h-3.5 text-blue-600" /> LinkedIn Profile:
                  </span>
                  {editingField !== 'linkedin_url' && (
                    <button
                      onClick={() => startEditing('linkedin_url', application.linkedin_url || '')}
                      className="text-slate-400 hover:text-blue-600 p-0.5"
                    >
                      <Edit className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {editingField === 'linkedin_url' ? (
                  <div className="space-y-1">
                    <input
                      type="url"
                      placeholder="https://linkedin.com/company/..."
                      value={fieldValue}
                      onChange={(e) => setFieldValue(e.target.value)}
                      className="w-full bg-white border border-blue-400 rounded-lg px-2.5 py-1 text-xs text-slate-900"
                      autoFocus
                    />
                    {fieldError && <p className="text-[11px] text-rose-600">{fieldError}</p>}
                    <InlineControls onSave={() => saveField('linkedin_url')} onCancel={cancelEditing} />
                  </div>
                ) : application.linkedin_url ? (
                  <a
                    href={application.linkedin_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-blue-50 text-blue-600 font-semibold transition-colors"
                  >
                    <span className="truncate">{application.linkedin_url}</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  </a>
                ) : (
                  <div className="text-slate-400 italic">No LinkedIn link set.</div>
                )}
              </div>

              {/* Job Posting URL */}
              <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between text-slate-500 font-semibold">
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5" /> Job Posting URL:
                  </span>
                  {editingField !== 'job_posting_url' && (
                    <button
                      onClick={() => startEditing('job_posting_url', application.job_posting_url || '')}
                      className="text-slate-400 hover:text-blue-600 p-0.5"
                    >
                      <Edit className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {editingField === 'job_posting_url' ? (
                  <div className="space-y-1">
                    <input
                      type="url"
                      placeholder="https://careers.../job/123"
                      value={fieldValue}
                      onChange={(e) => setFieldValue(e.target.value)}
                      className="w-full bg-white border border-blue-400 rounded-lg px-2.5 py-1 text-xs text-slate-900"
                      autoFocus
                    />
                    {fieldError && <p className="text-[11px] text-rose-600">{fieldError}</p>}
                    <InlineControls onSave={() => saveField('job_posting_url')} onCancel={cancelEditing} />
                  </div>
                ) : application.job_posting_url ? (
                  <a
                    href={application.job_posting_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-blue-50 text-blue-600 font-semibold transition-colors"
                  >
                    <span className="truncate">{application.job_posting_url}</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  </a>
                ) : (
                  <div className="text-slate-400 italic">No job posting URL set.</div>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 9: Salary / Stipend (Directly Editable with Type Selector) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <IndianRupee className="w-4 h-4 text-blue-600" /> 9. Salary / Stipend (INR)
              </h3>
              {editingField !== 'offered_salary' && (
                <button
                  onClick={() => startEditing('offered_salary', application.offered_salary || '', 'Monthly')}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-blue-600"
                >
                  <Edit className="w-3 h-3" /> Edit ✏️
                </button>
              )}
            </div>

            {editingField === 'offered_salary' ? (
              <div className="p-3 bg-blue-50/50 rounded-2xl border border-blue-300 space-y-2 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Amount:</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold">₹</span>
                    <input
                      type="text"
                      placeholder="e.g. 25,000"
                      value={fieldValue}
                      onChange={(e) => setFieldValue(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg pl-7 pr-3 py-1.5 text-xs font-bold text-slate-900"
                      autoFocus
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Type Selector:</label>
                  <select
                    value={fieldSecondaryValue}
                    onChange={(e) => setFieldSecondaryValue(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-medium"
                  >
                    <option value="Monthly Salary">Monthly Salary</option>
                    <option value="Annual Salary">Annual Salary (LPA)</option>
                    <option value="Internship Stipend">Internship Stipend</option>
                    <option value="Hourly">Hourly</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    onClick={cancelEditing}
                    className="px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg"
                  >
                    Cancel ✕
                  </button>
                  <button
                    onClick={() => saveField('offered_salary')}
                    className="px-3.5 py-1 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs"
                  >
                    Save ✓
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-center p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                <span className="text-slate-500 font-medium">Offered Salary / Stipend:</span>
                <span className="font-bold text-emerald-700">
                  {application.offered_salary || 'Not specified'}
                </span>
              </div>
            )}
          </div>

          {/* SECTION 10: Follow-up (Interactive Yes/No, Date, Method, Status) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" /> 10. Follow-up
              </h3>
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs font-bold">
                <button
                  onClick={() =>
                    saveField('follow_up', {
                      follow_up_required: true,
                      follow_up_date: application.follow_up_date || today,
                    })
                  }
                  className={`px-2.5 py-0.5 rounded-md transition-all ${
                    application.follow_up_required
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Yes
                </button>
                <button
                  onClick={() => saveField('follow_up', { follow_up_required: false })}
                  className={`px-2.5 py-0.5 rounded-md transition-all ${
                    !application.follow_up_required
                      ? 'bg-slate-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  No
                </button>
              </div>
            </div>

            {application.follow_up_required ? (
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-3 text-xs">
                {/* Due Badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold">
                    {application.follow_up_date && application.follow_up_date < today ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
                        🔴 Overdue
                      </span>
                    ) : application.follow_up_date === today ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                        🟡 Due Today
                      </span>
                    ) : (
                      <span className="text-amber-800">Pending</span>
                    )}
                  </div>

                  {editingField !== 'follow_up_details' && (
                    <button
                      onClick={() =>
                        startEditing('follow_up_details', application.follow_up_date || today, {
                          notes: application.follow_up_notes || '',
                        })
                      }
                      className="text-amber-800 hover:text-amber-950 font-semibold"
                    >
                      <Edit className="w-3 h-3 inline mr-1" /> Edit Date & Notes
                    </button>
                  )}
                </div>

                {editingField === 'follow_up_details' ? (
                  <div className="space-y-2 bg-white p-3 rounded-xl border border-amber-300">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Follow-up Date:</label>
                      <input
                        type="date"
                        value={fieldValue}
                        onChange={(e) => setFieldValue(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-xs"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Notes / Action:</label>
                      <textarea
                        rows={2}
                        value={fieldSecondaryValue.notes}
                        onChange={(e) =>
                          setFieldSecondaryValue({ ...fieldSecondaryValue, notes: e.target.value })
                        }
                        placeholder="e.g. Email HR regarding round 1 results..."
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button onClick={cancelEditing} className="px-2.5 py-1 text-xs text-slate-600">
                        Cancel ✕
                      </button>
                      <button
                        onClick={() =>
                          saveField('follow_up_details', {
                            follow_up_date: fieldValue,
                            follow_up_notes: fieldSecondaryValue.notes,
                          })
                        }
                        className="px-3 py-1 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg"
                      >
                        Save ✓
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="text-slate-800 font-medium">
                      Date: <span className="font-bold">{application.follow_up_date || 'Not set'}</span>
                    </div>
                    {application.follow_up_notes && (
                      <p className="mt-1 text-slate-700 bg-white/80 p-2 rounded-lg border border-amber-200">
                        {application.follow_up_notes}
                      </p>
                    )}
                  </div>
                )}

                {/* Quick Reminders Action Bar */}
                <div className="pt-2 border-t border-amber-200/80 flex flex-col gap-2">
                  <a
                    href={getFollowUpMailto()}
                    className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 py-1.5 px-3 rounded-xl transition-colors cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5 text-blue-600" />
                    <span>Draft Follow-up Email</span>
                  </a>

                  {application.follow_up_date && (
                    <a
                      href={getGoogleCalendarUrl(
                        `Follow up with ${application.company_name} (${application.job_title})`,
                        `Company: ${application.company_name}\nRole: ${application.job_title}\nNotes: ${application.follow_up_notes || 'Follow up with recruiter or check portal status'}`,
                        application.follow_up_date
                      )}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-amber-900 bg-white hover:bg-amber-100/60 border border-amber-300 py-1.5 px-3 rounded-xl transition-colors cursor-pointer"
                    >
                      <CalendarPlus className="w-3.5 h-3.5 text-amber-600" />
                      <span>Google Calendar Reminder</span>
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      saveField('follow_up', {
                        follow_up_required: false,
                        follow_up_notes: application.follow_up_notes
                          ? `Completed: ${application.follow_up_notes}`
                          : 'Completed follow-up',
                      })
                    }
                    className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 py-1.5 px-3 rounded-xl transition-colors cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>✓ Mark Follow-up as Done</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center space-y-1">
                <p className="text-xs text-slate-400 italic">No follow-up required.</p>
                <button
                  onClick={() =>
                    saveField('follow_up', {
                      follow_up_required: true,
                      follow_up_date: today,
                    })
                  }
                  className="text-xs font-bold text-amber-700 hover:underline cursor-pointer"
                >
                  + Enable Follow-up Reminder
                </button>
              </div>
            )}
          </div>

          {/* SECTION 11: Additional Notes (Directly Editable) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-600" /> 11. Additional Notes
              </h3>
              {editingField !== 'additional_notes' && (
                <button
                  onClick={() => startEditing('additional_notes', application.additional_notes || '')}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-blue-600"
                >
                  <Edit className="w-3 h-3" /> Edit ✏️
                </button>
              )}
            </div>

            {editingField === 'additional_notes' ? (
              <div className="space-y-2">
                <textarea
                  rows={4}
                  placeholder="Recruiter contact info, referral details, portal credentials, personal notes..."
                  value={fieldValue}
                  onChange={(e) => setFieldValue(e.target.value)}
                  className="w-full bg-slate-50 border border-blue-400 rounded-xl p-3 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none leading-relaxed"
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <button onClick={cancelEditing} className="px-3 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded-lg">
                    Cancel ✕
                  </button>
                  <button
                    onClick={() => saveField('additional_notes')}
                    className="px-3.5 py-1 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs"
                  >
                    Save Notes ✓
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {application.additional_notes ? (
                  <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    {application.additional_notes}
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 italic">No additional notes.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Add Timeline Event / Milestone */}
      {showAddEventModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 animate-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-600 text-white rounded-xl shadow-xs">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Add Timeline Event & Reminder</h3>
                  <p className="text-xs text-slate-500">Record a stage, interview, test, or custom deadline</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddEventModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddTimelineSubmit} className="space-y-4 overflow-y-auto flex-1 pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Event Stage / Type *
                  </label>
                  <select
                    value={newEventType}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewEventType(val);
                      if (!newEventTitle || REMINDER_EVENT_TYPES.includes(newEventTitle as any)) {
                        setNewEventTitle(val);
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {REMINDER_EVENT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Event Title *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Technical Interview Round 1"
                    value={newEventTitle}
                    onChange={(e) => setNewEventTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Time (Optional)
                  </label>
                  <input
                    type="time"
                    value={newEventTime}
                    onChange={(e) => setNewEventTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Reminders Toggle & Intervals */}
              <div className="p-3.5 bg-blue-50/60 rounded-2xl border border-blue-200/80 space-y-2.5">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newEventReminderEnabled}
                    onChange={(e) => setNewEventReminderEnabled(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-0 w-4 h-4 cursor-pointer"
                  />
                  <Bell className="w-4 h-4 text-blue-600" />
                  <span>Enable Universal Reminders for this event</span>
                </label>

                {newEventReminderEnabled && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-semibold text-slate-600 block">
                      Reminder intervals before event:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { days: 7, label: '7 days before' },
                        { days: 3, label: '3 days before' },
                        { days: 2, label: '2 days before (Recommended)' },
                        { days: 1, label: '1 day before (Tomorrow)' },
                        { days: 0, label: 'On the day' },
                      ].map(({ days, label }) => {
                        const active = newEventReminderDays.includes(days);
                        return (
                          <button
                            type="button"
                            key={days}
                            onClick={() => {
                              if (active) {
                                setNewEventReminderDays(newEventReminderDays.filter((d) => d !== days));
                              } else {
                                setNewEventReminderDays([...newEventReminderDays, days].sort((a, b) => b - a));
                              }
                            }}
                            className={`text-[11px] px-2.5 py-1 rounded-lg border font-bold transition-all cursor-pointer ${
                              active
                                ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            {active ? '✓ ' : ''}{label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Description / Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Notes about what took place, recruiter questions, or instructions..."
                  value={newEventDesc}
                  onChange={(e) => setNewEventDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddEventModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Add Event & Reminders ✓
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Stage Transition with Date & Reminders */}
      {stageTransitionModal.open && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-600 text-white rounded-xl shadow-xs">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Update Stage & Reminders
                  </h3>
                  <p className="text-xs text-slate-500">
                    Set date and automated alerts for this recruitment milestone
                  </p>
                </div>
              </div>
              <button
                onClick={() => setStageTransitionModal({ open: false, stage: 'Applied' })}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleStageTransitionSubmit} className="space-y-4 overflow-y-auto flex-1 pr-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Selected Stage *
                </label>
                <select
                  value={stageTransitionModal.stage}
                  onChange={(e) =>
                    setStageTransitionModal((prev) => ({
                      ...prev,
                      stage: e.target.value as ApplicationStage,
                    }))
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {ALL_STAGES.map((stg) => (
                    <option key={stg} value={stg}>
                      {stg}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Stage Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={stageDate}
                    onChange={(e) => setStageDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Time (Optional)
                  </label>
                  <input
                    type="time"
                    value={stageTime}
                    onChange={(e) => setStageTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Reminders Toggle & Intervals */}
              <div className="p-3.5 bg-blue-50/60 rounded-2xl border border-blue-200/80 space-y-2.5">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={stageReminderEnabled}
                    onChange={(e) => setStageReminderEnabled(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-0 w-4 h-4 cursor-pointer"
                  />
                  <Bell className="w-4 h-4 text-blue-600" />
                  <span>Enable Reminders for this stage</span>
                </label>

                {stageReminderEnabled && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-semibold text-slate-600 block">
                      Reminder alerts before event:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { days: 7, label: '7 days before' },
                        { days: 3, label: '3 days before' },
                        { days: 2, label: '2 days before (Default)' },
                        { days: 1, label: '1 day before (Tomorrow)' },
                        { days: 0, label: 'On the day' },
                      ].map(({ days, label }) => {
                        const active = stageReminderDays.includes(days);
                        return (
                          <button
                            type="button"
                            key={days}
                            onClick={() => {
                              if (active) {
                                setStageReminderDays(stageReminderDays.filter((d) => d !== days));
                              } else {
                                setStageReminderDays([...stageReminderDays, days].sort((a, b) => b - a));
                              }
                            }}
                            className={`text-[11px] px-2.5 py-1 rounded-lg border font-bold transition-all cursor-pointer ${
                              active
                                ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            {active ? '✓ ' : ''}{label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Notes / Details (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Topics to brush up on, meeting link, interviewer names..."
                  value={stageNotes}
                  onChange={(e) => setStageNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStageTransitionModal({ open: false, stage: 'Applied' })}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Save Stage & Reminders ✓
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
