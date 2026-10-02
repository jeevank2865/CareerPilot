import React, { useState, useEffect } from 'react';
import {
  Application,
  ApplicationType,
  ApplicationStage,
  ApplicationStatus,
  InterviewRound,
  APPLICATION_TYPES,
  ALL_STAGES,
  ALL_STATUSES,
  INTERVIEW_ROUNDS,
} from '../types/database';
import { useApplications } from '../context/ApplicationContext';
import {
  X,
  Upload,
  FileText,
  Building,
  Briefcase,
  Calendar,
  MapPin,
  Globe,
  Linkedin,
  ExternalLink,
  IndianRupee,
  Clock,
  Sparkles,
  MessageSquare,
  HelpCircle,
  CheckCircle2,
  Bell,
} from 'lucide-react';

interface AddEditApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationToEdit?: Application | null;
}

export const AddEditApplicationModal: React.FC<AddEditApplicationModalProps> = ({
  isOpen,
  onClose,
  applicationToEdit,
}) => {
  const { createApplication, updateApplication, quickUpdateStage } = useApplications();
  const [activeTab, setActiveTab] = useState<'details' | 'pipeline' | 'interview' | 'resume' | 'salary_notes'>('details');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form Fields
  const [applicationType, setApplicationType] = useState<ApplicationType>('Job');
  const [jobTitle, setJobTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [location, setLocation] = useState('');
  const [dateApplied, setDateApplied] = useState(new Date().toISOString().split('T')[0]);
  const [jobDescription, setJobDescription] = useState('');
  const [whatILearned, setWhatILearned] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [jobPostingUrl, setJobPostingUrl] = useState('');

  // Status & Stage
  const [currentStage, setCurrentStage] = useState<ApplicationStage>('Applied');
  const [currentStatus, setCurrentStatus] = useState<ApplicationStatus>('Applied');

  // Interview
  const [interviewDone, setInterviewDone] = useState(false);
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewRound, setInterviewRound] = useState<InterviewRound>('Technical');
  const [interviewerName, setInterviewerName] = useState('');
  const [interviewFeedback, setInterviewFeedback] = useState('');
  const [interviewNotes, setInterviewNotes] = useState('');

  // Resume
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [existingResumeName, setExistingResumeName] = useState<string | null>(null);
  const [existingResumePath, setExistingResumePath] = useState<string | null>(null);

  // Salary
  const [offeredSalary, setOfferedSalary] = useState('');

  // Follow-up
  const [followUpRequired, setFollowUpRequired] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpNotes, setFollowUpNotes] = useState('');

  // Stage & Milestone Date + Reminders (Universal for any stage)
  const [stageDate, setStageDate] = useState('');
  const [stageReminderEnabled, setStageReminderEnabled] = useState(true);
  const [stageReminderDays, setStageReminderDays] = useState<number[]>([2, 1]);

  // Notes
  const [additionalNotes, setAdditionalNotes] = useState('');

  useEffect(() => {
    if (applicationToEdit) {
      setApplicationType(applicationToEdit.application_type);
      setJobTitle(applicationToEdit.job_title);
      setCompanyName(applicationToEdit.company_name);
      setLocation(applicationToEdit.location || '');
      setDateApplied(applicationToEdit.date_applied || new Date().toISOString().split('T')[0]);
      setJobDescription(applicationToEdit.job_description || '');
      setWhatILearned(applicationToEdit.what_i_learned || '');
      setCompanyWebsite(applicationToEdit.company_website || '');
      setLinkedinUrl(applicationToEdit.linkedin_url || '');
      setJobPostingUrl(applicationToEdit.job_posting_url || '');
      setCurrentStage(applicationToEdit.current_stage);
      setCurrentStatus(applicationToEdit.current_status);
      setStageDate('');
      setStageReminderEnabled(true);
      setStageReminderDays([2, 1]);
      setInterviewDone(applicationToEdit.interview_done);
      setInterviewDate(applicationToEdit.interview_date || '');
      setInterviewRound(applicationToEdit.interview_round || 'Technical');
      setInterviewerName(applicationToEdit.interviewer_name || '');
      setInterviewFeedback(applicationToEdit.interview_feedback || '');
      setInterviewNotes(applicationToEdit.interview_notes || '');
      setExistingResumeName(applicationToEdit.resume_file_name || null);
      setExistingResumePath(applicationToEdit.resume_file_path || null);
      setOfferedSalary(applicationToEdit.offered_salary || '');
      setFollowUpRequired(applicationToEdit.follow_up_required);
      setFollowUpDate(applicationToEdit.follow_up_date || '');
      setFollowUpNotes(applicationToEdit.follow_up_notes || '');
      setAdditionalNotes(applicationToEdit.additional_notes || '');
      setResumeFile(null);
    } else {
      // Reset form
      setApplicationType('Job');
      setJobTitle('');
      setCompanyName('');
      setLocation('');
      setDateApplied(new Date().toISOString().split('T')[0]);
      setJobDescription('');
      setWhatILearned('');
      setCompanyWebsite('');
      setLinkedinUrl('');
      setJobPostingUrl('');
      setCurrentStage('Applied');
      setCurrentStatus('Applied');
      setStageDate('');
      setStageReminderEnabled(true);
      setStageReminderDays([2, 1]);
      setInterviewDone(false);
      setInterviewDate('');
      setInterviewRound('Technical');
      setInterviewerName('');
      setInterviewFeedback('');
      setInterviewNotes('');
      setExistingResumeName(null);
      setExistingResumePath(null);
      setResumeFile(null);
      setOfferedSalary('');
      setFollowUpRequired(false);
      setFollowUpDate('');
      setFollowUpNotes('');
      setAdditionalNotes('');
    }
    setErrors({});
    setActiveTab('details');
  }, [applicationToEdit, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!jobTitle.trim()) errs.jobTitle = 'Job/Internship Title is required';
    if (!companyName.trim()) errs.companyName = 'Company name is required';
    if (!dateApplied) errs.dateApplied = 'Application date is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      setActiveTab('details');
      return;
    }

    setSubmitting(true);
    try {
      const payload: Partial<Application> = {
        application_type: applicationType,
        job_title: jobTitle.trim(),
        company_name: companyName.trim(),
        location: location.trim() || null,
        date_applied: dateApplied || new Date().toISOString().split('T')[0],
        job_description: jobDescription.trim() || null,
        what_i_learned: whatILearned.trim() || null,
        company_website: companyWebsite.trim() || null,
        linkedin_url: linkedinUrl.trim() || null,
        job_posting_url: jobPostingUrl.trim() || null,
        current_stage: currentStage,
        current_status: currentStatus,
        interview_done: Boolean(interviewDone),
        interview_date: interviewDone && interviewDate && interviewDate.trim() ? interviewDate.trim() : null,
        interview_round: interviewDone ? interviewRound : null,
        interviewer_name: interviewDone && interviewerName.trim() ? interviewerName.trim() : null,
        interview_feedback: interviewDone && interviewFeedback.trim() ? interviewFeedback.trim() : null,
        interview_notes: interviewNotes.trim() || null,
        resume_file_name: existingResumeName,
        resume_file_path: existingResumePath,
        offered_salary: offeredSalary.trim() || null,
        follow_up_required: Boolean(followUpRequired),
        follow_up_date: followUpRequired && followUpDate && followUpDate.trim() ? followUpDate.trim() : null,
        follow_up_notes: followUpRequired && followUpNotes.trim() ? followUpNotes.trim() : null,
        additional_notes: additionalNotes.trim() || null,
      };

      if (applicationToEdit) {
        const updated = await updateApplication(applicationToEdit.id, payload, resumeFile);
        if (stageDate) {
          await quickUpdateStage(
            updated.id,
            currentStage,
            currentStatus,
            stageDate,
            stageReminderEnabled ? stageReminderDays : []
          );
        }
      } else {
        const created = await createApplication(
          payload as Omit<Application, 'id' | 'created_at' | 'updated_at'>,
          resumeFile
        );
        if (stageDate && created) {
          await quickUpdateStage(
            created.id,
            currentStage,
            currentStatus,
            stageDate,
            stageReminderEnabled ? stageReminderDays : []
          );
        }
      }

      onClose();
    } catch (err) {
      console.error('Failed to submit application form:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Supported: PDF, DOC, DOCX
      const validTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ];
      if (!validTypes.includes(file.type) && !file.name.match(/\.(pdf|doc|docx)$/i)) {
        alert('Please upload a PDF, DOC, or DOCX document.');
        return;
      }
      setResumeFile(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 text-white rounded-xl shadow-sm">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {applicationToEdit ? 'Edit Application' : 'Add New Application'}
              </h2>
              <p className="text-xs text-slate-500">
                Track your job or internship details, stages, notes, and exact resume
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50/40 px-6 gap-2 overflow-x-auto text-xs font-semibold">
          {[
            { id: 'details', label: '1. Role & Company' },
            { id: 'pipeline', label: '2. Stage & Pipeline' },
            { id: 'interview', label: '3. Interview Details' },
            { id: 'resume', label: '4. Resume Used' },
            { id: 'salary_notes', label: '5. Salary & Follow-ups' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`py-3 px-3 border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 font-bold bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: Role & Company */}
          {activeTab === 'details' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Application Type */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Application Type *
                  </label>
                  <select
                    value={applicationType}
                    onChange={(e) => setApplicationType(e.target.value as ApplicationType)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {APPLICATION_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date Applied */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    Date Applied *
                  </label>
                  <input
                    type="date"
                    value={dateApplied}
                    onChange={(e) => setDateApplied(e.target.value)}
                    className={`w-full bg-slate-50 border rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                      errors.dateApplied ? 'border-rose-500 bg-rose-50/30' : 'border-slate-300'
                    }`}
                  />
                  {errors.dateApplied && <p className="text-xs text-rose-600 mt-1">{errors.dateApplied}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Job Title */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                    Job / Internship Title *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Software Developer Intern"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    className={`w-full bg-slate-50 border rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                      errors.jobTitle ? 'border-rose-500 bg-rose-50/30' : 'border-slate-300'
                    }`}
                  />
                  {errors.jobTitle && <p className="text-xs text-rose-600 mt-1">{errors.jobTitle}</p>}
                </div>

                {/* Company Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-blue-600" />
                    Company Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Google, Microsoft, Startup XYZ"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className={`w-full bg-slate-50 border rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                      errors.companyName ? 'border-rose-500 bg-rose-50/30' : 'border-slate-300'
                    }`}
                  />
                  {errors.companyName && <p className="text-xs text-rose-600 mt-1">{errors.companyName}</p>}
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  Job Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bengaluru, Remote, Hyderabad, Pune"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* URLs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-slate-400" /> Company Website
                  </label>
                  <input
                    type="url"
                    placeholder="https://company.com"
                    value={companyWebsite}
                    onChange={(e) => setCompanyWebsite(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                    <Linkedin className="w-3.5 h-3.5 text-blue-600" /> LinkedIn Profile
                  </label>
                  <input
                    type="url"
                    placeholder="https://linkedin.com/company/..."
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" /> Job Posting URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://careers.../job/123"
                    value={jobPostingUrl}
                    onChange={(e) => setJobPostingUrl(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Job Description */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Job Description
                </label>
                <textarea
                  rows={4}
                  placeholder="Paste key responsibilities, role overview, or team description..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none leading-relaxed"
                />
              </div>

              {/* What I Learned (Section 4G) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  What I Learned
                </label>
                <p className="text-xs text-slate-500 mb-1.5">
                  What did you learn from the JD? Required skills, technologies mentioned, interview insights, or important observations.
                </p>
                <textarea
                  rows={4}
                  placeholder="e.g. Learned about system design tradeoffs, Redis caching patterns, and Go concurrency. The JD emphasized CI/CD pipelines and unit test coverage..."
                  value={whatILearned}
                  onChange={(e) => setWhatILearned(e.target.value)}
                  className="w-full bg-amber-50/30 border border-amber-200 rounded-xl p-3 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* TAB 2: Stage & Pipeline */}
          {activeTab === 'pipeline' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Current Stage in Pipeline
                  </label>
                  <p className="text-xs text-slate-500">
                    Track exactly where you are in the recruitment process.
                  </p>
                  <select
                    value={currentStage}
                    onChange={(e) => setCurrentStage(e.target.value as ApplicationStage)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {ALL_STAGES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Current Status Badge
                  </label>
                  <p className="text-xs text-slate-500">
                    General status representation shown on cards and tables.
                  </p>
                  <select
                    value={currentStatus}
                    onChange={(e) => setCurrentStatus(e.target.value as ApplicationStatus)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {ALL_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Optional Stage Date & Universal Reminders */}
              <div className="p-4 rounded-2xl border border-blue-200 bg-blue-50/50 space-y-3">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-blue-600" />
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Stage Date & Reminders (Optional)
                  </h4>
                </div>
                <p className="text-xs text-slate-500">
                  Set a target date for this stage (e.g. Assessment date, Interview date, or Offer deadline) to schedule automated reminders.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Date for "{currentStage}"
                    </label>
                    <input
                      type="date"
                      value={stageDate}
                      onChange={(e) => setStageDate(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  {stageDate && (
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer pt-2 sm:pt-6">
                        <input
                          type="checkbox"
                          checked={stageReminderEnabled}
                          onChange={(e) => setStageReminderEnabled(e.target.checked)}
                          className="rounded text-blue-600 focus:ring-0 w-4 h-4 cursor-pointer"
                        />
                        <span>Enable automated reminders</span>
                      </label>
                    </div>
                  )}
                </div>

                {stageDate && stageReminderEnabled && (
                  <div className="pt-2 border-t border-blue-200/80 space-y-1.5">
                    <span className="text-[11px] font-semibold text-slate-600 block">
                      Reminder alerts before {currentStage}:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { days: 7, label: '7 days before' },
                        { days: 3, label: '3 days before' },
                        { days: 2, label: '2 days before (Recommended)' },
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

              <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/40 text-xs text-blue-900 leading-relaxed">
                <strong>Tip:</strong> Stages don’t have to follow a strict order. You can jump directly to Technical Interview, Online Assessment, or Offer Received anytime!
              </div>
            </div>
          )}

          {/* TAB 3: Interview Details */}
          {activeTab === 'interview' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/60">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Has an Interview Taken Place or Scheduled?</h4>
                  <p className="text-xs text-slate-500">Toggle on to record interview date, round, feedback, and notes.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={interviewDone}
                    onChange={(e) => setInterviewDone(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {interviewDone && (
                <div className="space-y-4 pt-2 border-t border-slate-200">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-blue-600" /> Interview Date
                      </label>
                      <input
                        type="date"
                        value={interviewDate}
                        onChange={(e) => setInterviewDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Interview Round
                      </label>
                      <select
                        value={interviewRound}
                        onChange={(e) => setInterviewRound(e.target.value as InterviewRound)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        {INTERVIEW_ROUNDS.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Interviewer Name (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. John Doe (Engineering Lead)"
                        value={interviewerName}
                        onChange={(e) => setInterviewerName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4 text-blue-600" />
                      What feedback did I receive from the interviewer?
                    </label>
                    <p className="text-xs text-slate-500 mb-1">
                      Positive feedback, areas to improve, questions asked, technical topics discussed, HR feedback, observations.
                    </p>
                    <textarea
                      rows={4}
                      placeholder="e.g. Liked explanation of database indexing. Advised studying Redis caching and distributed transactions. Asked 2 LeetCode medium questions on BST traversal..."
                      value={interviewFeedback}
                      onChange={(e) => setInterviewFeedback(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none leading-relaxed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-indigo-600" />
                      Interview Preparation / Notes
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Notes on questions to ask interviewer, company recent news, tech stack prep..."
                      value={interviewNotes}
                      onChange={(e) => setInterviewNotes(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none leading-relaxed"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Resume Used */}
          {activeTab === 'resume' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div>
                <h4 className="text-sm font-bold text-slate-900 mb-1">Resume Used for This Application</h4>
                <p className="text-xs text-slate-500">
                  Upload the exact resume or CV tailored for this position. Supported formats: PDF, DOC, DOCX.
                </p>
              </div>

              {existingResumeName && !resumeFile && (
                <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-600 text-white rounded-lg">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900">{existingResumeName}</div>
                      <div className="text-xs text-slate-500">Currently saved resume for this application</div>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-blue-700 bg-white border border-blue-200 px-3 py-1 rounded-lg">
                    Attached
                  </span>
                </div>
              )}

              <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-8 text-center bg-slate-50/50 hover:bg-blue-50/20 transition-all cursor-pointer relative group">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center">
                  <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-xs group-hover:scale-110 transition-transform mb-3">
                    <Upload className="w-6 h-6 text-blue-600" />
                  </div>
                  <span className="text-sm font-bold text-slate-800">
                    {resumeFile ? resumeFile.name : 'Click to select or drag and drop your resume file'}
                  </span>
                  <span className="text-xs text-slate-500 mt-1">
                    {resumeFile
                      ? `${(resumeFile.size / 1024).toFixed(1)} KB — Ready to upload`
                      : 'PDF, DOC, DOCX up to 10MB'}
                  </span>
                </div>
              </div>

              {resumeFile && (
                <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  New file selected: {resumeFile.name}. It will be safely uploaded to Supabase Storage upon saving.
                </div>
              )}
            </div>
          )}

          {/* TAB 5: Salary & Follow-ups */}
          {activeTab === 'salary_notes' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Salary Section */}
              <div>
                <h4 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                  <IndianRupee className="w-4 h-4 text-blue-600" /> Offered Salary / Stipend (Optional)
                </h4>
                <p className="text-xs text-slate-500 mb-3">Currency: INR (₹) or mention terms (e.g. ₹35,000/month, ₹10 LPA)</p>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Offered Salary / Stipend
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ₹35,000/month or ₹10 LPA"
                    value={offeredSalary}
                    onChange={(e) => setOfferedSalary(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Follow-up Section */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-600" /> Follow-up Required?
                    </h4>
                    <p className="text-xs text-slate-500">Track due date for follow-up emails or recruiter calls.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={followUpRequired}
                      onChange={(e) => setFollowUpRequired(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {followUpRequired && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Follow-up Due Date
                      </label>
                      <input
                        type="date"
                        value={followUpDate}
                        onChange={(e) => setFollowUpDate(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Follow-up Notes
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Email HR regarding shortlisting results"
                        value={followUpNotes}
                        onChange={(e) => setFollowUpNotes(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Additional Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Additional Notes
                </label>
                <p className="text-xs text-slate-500 mb-1.5">
                  Recruiter contact info, referral details, portal credentials, personal observations.
                </p>
                <textarea
                  rows={3}
                  placeholder="e.g. Recruiter: Priya Sharma (priya@...). Applied through referral by John on LinkedIn..."
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <div className="flex items-center gap-3">
              {activeTab !== 'salary_notes' && (
                <button
                  type="button"
                  onClick={() => {
                    if (activeTab === 'details') setActiveTab('pipeline');
                    else if (activeTab === 'pipeline') setActiveTab('interview');
                    else if (activeTab === 'interview') setActiveTab('resume');
                    else if (activeTab === 'resume') setActiveTab('salary_notes');
                  }}
                  className="px-4 py-2 text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors cursor-pointer"
                >
                  Next Step →
                </button>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-md transition-all cursor-pointer"
              >
                {submitting ? 'Saving...' : applicationToEdit ? 'Save Changes' : 'Create Application'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
