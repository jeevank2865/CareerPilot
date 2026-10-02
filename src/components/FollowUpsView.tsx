import React, { useState, useMemo, useEffect } from 'react';
import { Application } from '../types/database';
import { useApplications, UpcomingTaskItem } from '../context/ApplicationContext';
import { useAuth } from '../context/AuthContext';
import { AddCustomReminderModal } from './AddCustomReminderModal';
import { notificationService, NotificationPermissionStatus } from '../lib/notificationService';
import { getEventTypeBadge, formatEmailNotification } from '../lib/reminderService';
import {
  Clock,
  Calendar,
  Building,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Mail,
  Bell,
  CalendarPlus,
  Send,
  Plus,
  Filter,
  Check,
  Smartphone,
  CheckCheck,
} from 'lucide-react';

interface FollowUpsViewProps {
  onSelectApplication: (app: Application) => void;
  onEditApplication: (app: Application) => void;
}

export const FollowUpsView: React.FC<FollowUpsViewProps> = ({
  onSelectApplication,
  onEditApplication,
}) => {
  const { user } = useAuth();
  const {
    followUpApplications,
    upcomingInterviews,
    upcomingTasks,
    applications,
    updateApplication,
    showToast,
  } = useApplications();

  const [showAddReminderModal, setShowAddReminderModal] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermissionStatus>('default');
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    setPermissionStatus(notificationService.getPermission());
  }, []);

  const handleRequestPushPermission = async () => {
    const res = await notificationService.requestPermission();
    setPermissionStatus(res);
    if (res === 'granted') {
      showToast('Push notifications enabled for this phone/device!', 'success');
      await notificationService.sendTestNotification();
    } else {
      showToast('Please enable notifications in your browser or phone settings', 'info');
    }
  };

  const handleSendTestPush = async () => {
    const success = await notificationService.sendTestNotification();
    if (success) {
      showToast('Test notification sent to your phone/device!', 'success');
    } else {
      showToast('Could not send notification. Please enable permissions first.', 'error');
    }
  };

  const handleSendEmailReminder = (task: UpcomingTaskItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const targetEmail = user?.email || 'srangaswamy042@gmail.com';
    const emailData = formatEmailNotification(
      user?.user_metadata?.full_name || 'Candidate',
      task.eventType,
      task.companyName,
      task.jobTitle,
      task.eventDate,
      task.daysRemaining,
      `Reminder scheduled in Job & Internship Tracker.`
    );
    notificationService.openEmailReminder(targetEmail, emailData.subject, emailData.body);
    showToast(`Opening email draft for ${targetEmail}...`, 'info');
  };

  const handleSendInstantPhoneAlert = async (task: UpcomingTaskItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const success = await notificationService.sendNotification(
      `🔔 ${task.eventType}: ${task.companyName}`,
      {
        body: `${task.title} is scheduled for ${task.eventDate}. (${task.relativeLabel})`,
      }
    );
    if (success) {
      showToast(`Phone alert sent for ${task.title}!`, 'success');
    } else {
      handleRequestPushPermission();
    }
  };

  const handleClearFollowUp = async (app: Application, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await updateApplication(app.id, {
        follow_up_required: false,
        follow_up_notes: app.follow_up_notes
          ? `Completed: ${app.follow_up_notes}`
          : 'Completed follow-up',
      });
      showToast(`Marked follow-up for ${app.company_name} as done!`, 'success');
    } catch (e) {
      showToast('Failed to update follow-up', 'error');
    }
  };

  const getGoogleCalendarUrl = (title: string, details: string, dateStr: string, timeStr?: string | null) => {
    return notificationService.getGoogleCalendarUrl(title, details, dateStr, timeStr);
  };

  const getFollowUpMailto = (company: string, role: string, notes?: string | null) => {
    const subject = encodeURIComponent(`Following up on application: ${role} - ${company}`);
    const body = encodeURIComponent(
      `Dear Hiring Team at ${company},\n\nI hope you are doing well.\n\nI am writing to respectfully follow up regarding my application for the ${role} position. I remain enthusiastic about the opportunity to contribute to ${company}.\n\nPlease let me know if there are any updates regarding my application status or if you require any additional information from my side.\n\nThank you for your time and consideration.\n\nBest regards,\n${user?.user_metadata?.full_name || '[Your Name]'}`
    );
    return `mailto:${encodeURIComponent(user?.email || 'srangaswamy042@gmail.com')}?subject=${subject}&body=${body}`;
  };

  // Filter universal reminder events - searches both eventType and title
  const filteredUniversalTasks = useMemo(() => {
    if (selectedFilter === 'all') return upcomingTasks;
    if (selectedFilter === 'assessment')
      return upcomingTasks.filter(
        (t) =>
          t.eventType.toLowerCase().includes('assessment') ||
          t.title.toLowerCase().includes('assessment') ||
          t.title.toLowerCase().includes('coding') ||
          t.title.toLowerCase().includes('oa')
      );
    if (selectedFilter === 'technical')
      return upcomingTasks.filter(
        (t) =>
          t.eventType.toLowerCase().includes('technical') ||
          t.title.toLowerCase().includes('technical') ||
          (t.eventType.toLowerCase().includes('interview') && !t.eventType.toLowerCase().includes('hr'))
      );
    if (selectedFilter === 'hr')
      return upcomingTasks.filter(
        (t) =>
          t.eventType.toLowerCase().includes('hr') ||
          t.eventType.toLowerCase().includes('final') ||
          t.title.toLowerCase().includes('hr') ||
          t.title.toLowerCase().includes('final')
      );
    if (selectedFilter === 'deadline')
      return upcomingTasks.filter(
        (t) =>
          t.eventType.toLowerCase().includes('deadline') ||
          t.title.toLowerCase().includes('deadline') ||
          t.title.toLowerCase().includes('due')
      );
    if (selectedFilter === 'followup')
      return upcomingTasks.filter(
        (t) =>
          t.eventType.toLowerCase().includes('follow-up') ||
          t.eventType.toLowerCase().includes('followup') ||
          t.title.toLowerCase().includes('follow-up')
      );
    if (selectedFilter === 'custom')
      return upcomingTasks.filter(
        (t) =>
          t.eventType.toLowerCase().includes('custom') ||
          t.eventType.toLowerCase().includes('task')
      );
    return upcomingTasks;
  }, [upcomingTasks, selectedFilter]);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Universal Calendar & Reminders
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Automated reminders for assessments, interviews, application deadlines, and recruiter follow-ups
          </p>
        </div>

        <button
          onClick={() => setShowAddReminderModal(true)}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-extrabold shadow-md transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Reminder</span>
        </button>
      </div>

      {/* Reminder System Information & Phone Push Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-gradient-to-r from-blue-50 via-indigo-50 to-amber-50 rounded-2xl p-5 border border-blue-200/80 shadow-xs space-y-3">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-600 text-white rounded-xl shadow-xs shrink-0 mt-0.5">
              <Bell className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                Universal Multi-Stage Reminders Active
                <span className="text-[10px] font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                  Asia/Kolkata
                </span>
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Every important milestone (Online Assessment, Technical Interview, HR Round, Deadline, or Follow-up) automatically schedules reminders <strong>2 days before</strong> and <strong>1 day before</strong>:
              </p>
              <ul className="text-xs text-slate-600 space-y-1 pt-1 list-disc pl-4">
                <li>
                  <strong>In-App Alerts:</strong> Shown in your top bell menu and main dashboard with <span className="text-amber-800 font-semibold bg-amber-100 px-1.5 py-0.5 rounded">Due Today</span> and <span className="text-blue-800 font-semibold bg-blue-100 px-1.5 py-0.5 rounded">Tomorrow</span> badges.
                </li>
                <li>
                  <strong>Email & Phone Alerts:</strong> Use the 1-click Email & Phone Alert buttons below to receive reminders directly on your mobile device.
                </li>
                <li>
                  <strong>Google Calendar Sync:</strong> Click <span className="font-semibold text-blue-700">"Calendar"</span> on any card to sync Google Calendar notifications to your phone.
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Device Push Notification Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-blue-600" />
                Phone Notifications
              </span>
              {permissionStatus === 'granted' ? (
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCheck className="w-3 h-3" /> Active
                </span>
              ) : (
                <span className="text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full">
                  Not Enabled
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Enable browser & Android PWA system notifications to receive instant countdown alerts on your phone.
            </p>
          </div>

          <div className="space-y-2 pt-2">
            {permissionStatus !== 'granted' ? (
              <button
                onClick={handleRequestPushPermission}
                className="w-full inline-flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Enable Phone Alerts</span>
              </button>
            ) : (
              <button
                onClick={handleSendTestPush}
                className="w-full inline-flex items-center justify-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold px-3 py-2 rounded-xl transition-all cursor-pointer"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Send Test Alert to Phone</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filter Tabs for Events */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold text-slate-600">
        {[
          { id: 'all', label: 'All Scheduled Events', count: upcomingTasks.length },
          { id: 'assessment', label: 'Assessments', count: upcomingTasks.filter((t) => t.eventType.toLowerCase().includes('assessment')).length },
          { id: 'technical', label: 'Technical Rounds', count: upcomingTasks.filter((t) => t.eventType.toLowerCase().includes('technical')).length },
          { id: 'hr', label: 'HR & Final', count: upcomingTasks.filter((t) => t.eventType.toLowerCase().includes('hr') || t.eventType.toLowerCase().includes('final')).length },
          { id: 'deadline', label: 'Deadlines', count: upcomingTasks.filter((t) => t.eventType.toLowerCase().includes('deadline')).length },
          { id: 'followup', label: 'Follow-ups', count: upcomingTasks.filter((t) => t.eventType.toLowerCase().includes('follow-up') || t.eventType.toLowerCase().includes('followup')).length },
          { id: 'custom', label: 'Custom Tasks', count: upcomingTasks.filter((t) => t.eventType.toLowerCase().includes('custom')).length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedFilter(tab.id)}
            className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              selectedFilter === tab.id
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                selectedFilter === tab.id ? 'bg-blue-800 text-blue-100' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* UNIVERSAL EVENT REMINDER CARDS */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            Universal Events Schedule ({filteredUniversalTasks.length})
          </h3>
        </div>

        {filteredUniversalTasks.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-slate-200 rounded-2xl">
            <p className="text-xs text-slate-400">
              No events match this filter. Click "+ Add Reminder" to schedule any stage date or task!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUniversalTasks.map((task) => {
              const app = applications.find((a) => a.id === task.applicationId);
              const badge = getEventTypeBadge(task.eventType);

              return (
                <div
                  key={task.id}
                  onClick={() => app && onSelectApplication(app)}
                  className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-blue-400 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-3 group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.bgClass}`}>
                        {task.eventType}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${task.badgeClass}`}>
                        {task.relativeLabel}
                      </span>
                    </div>

                    <div>
                      <div className="font-extrabold text-sm text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                        {task.title}
                      </div>
                      <div className="text-xs text-slate-600 font-medium mt-0.5 flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-bold text-slate-800">{task.companyName}</span>
                        <span>•</span>
                        <span className="truncate">{task.jobTitle}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500 pt-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {new Date(task.eventDate + 'T00:00:00').toLocaleDateString('en-IN', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                      {task.eventTime && (
                        <>
                          <Clock className="w-3.5 h-3.5 text-slate-400 ml-1" />
                          <span>{task.eventTime}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div
                    className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-1.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-1.5">
                      <a
                        href={getGoogleCalendarUrl(
                          `${task.eventType}: ${task.companyName} (${task.jobTitle})`,
                          `Job & Internship Tracker Reminder:\n${task.title}\nCompany: ${task.companyName}\nDate: ${task.eventDate}`,
                          task.eventDate,
                          task.eventTime
                        )}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:text-blue-800 bg-blue-50/60 hover:bg-blue-100/70 border border-blue-200 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                        title="Add to Google Calendar (syncs phone notifications)"
                      >
                        <CalendarPlus className="w-3.5 h-3.5" />
                        <span>Calendar</span>
                      </a>

                      <button
                        onClick={(e) => handleSendEmailReminder(task, e)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 hover:text-indigo-800 bg-indigo-50/60 hover:bg-indigo-100/70 border border-indigo-200 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                        title={`Send formatted reminder email to ${user?.email || 'your email'}`}
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Email Me</span>
                      </button>

                      <button
                        onClick={(e) => handleSendInstantPhoneAlert(task, e)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50/60 hover:bg-emerald-100/70 border border-emerald-200 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                        title="Trigger test alert on this phone/device"
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>Phone Alert</span>
                      </button>
                    </div>

                    <button
                      onClick={() => app && onSelectApplication(app)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-2 py-1 rounded-lg transition-colors cursor-pointer ml-auto"
                    >
                      <span>View</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Grid: Scheduled Interviews & Follow-up Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* INTERVIEW SCHEDULE */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" /> Scheduled Interviews ({upcomingInterviews.length})
            </h3>
          </div>

          {upcomingInterviews.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-slate-200 rounded-2xl">
              <p className="text-xs text-slate-400">No interviews currently scheduled.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingInterviews.map((app) => (
                <div
                  key={app.id}
                  onClick={() => onSelectApplication(app)}
                  className="p-4 rounded-2xl bg-blue-50/40 border border-blue-100 hover:border-blue-300 transition-all cursor-pointer space-y-3 group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                          {app.company_name}
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-white border border-blue-200 font-semibold text-blue-700">
                          {app.interview_round || 'Technical'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 font-medium">{app.job_title}</div>
                      {app.interviewer_name && (
                        <div className="text-[11px] text-slate-500">Interviewer: {app.interviewer_name}</div>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-blue-700 bg-white px-2.5 py-1 rounded-lg border border-blue-200 inline-block shadow-xs">
                        {app.interview_date}
                      </span>
                    </div>
                  </div>

                  {app.interview_date && (
                    <div
                      className="pt-2 border-t border-blue-100 flex items-center justify-between"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="text-[11px] text-slate-500">Interview Reminder</span>
                      <a
                        href={getGoogleCalendarUrl(
                          `Interview with ${app.company_name} (${app.job_title})`,
                          `Round: ${app.interview_round || 'General'}\nInterviewer: ${app.interviewer_name || 'N/A'}\nNotes: ${app.interview_notes || 'Preparation notes'}`,
                          app.interview_date
                        )}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-800 bg-white hover:bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                        title="Add to Google Calendar for email reminder"
                      >
                        <CalendarPlus className="w-3.5 h-3.5" />
                        <span>Add to Google Calendar</span>
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FOLLOW-UP REMINDERS */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" /> Pending Follow-ups ({followUpApplications.length})
            </h3>
          </div>

          {followUpApplications.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-slate-200 rounded-2xl">
              <p className="text-xs text-slate-400">All follow-ups are clear! Great job staying organized.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {followUpApplications.map((app) => {
                const isOverdue = app.follow_up_date && app.follow_up_date < today;
                const isToday = app.follow_up_date === today;

                return (
                  <div
                    key={app.id}
                    onClick={() => onSelectApplication(app)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                      isOverdue
                        ? 'bg-rose-50/50 border-rose-200 hover:border-rose-400'
                        : isToday
                        ? 'bg-amber-50/60 border-amber-200 hover:border-amber-400'
                        : 'bg-slate-50/70 border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-slate-900">{app.company_name}</span>
                          {isOverdue && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
                              Overdue
                            </span>
                          )}
                          {isToday && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                              Due Today
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-600">{app.job_title}</div>
                        {app.follow_up_notes && (
                          <p className="text-xs text-slate-700 bg-white/80 p-2 rounded-lg border border-slate-200/80">
                            {app.follow_up_notes}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className="text-xs font-bold text-slate-800 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                          {app.follow_up_date}
                        </span>
                        <button
                          onClick={(e) => handleClearFollowUp(app, e)}
                          className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-white hover:bg-emerald-50 border border-emerald-300 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                          title="Mark follow-up done"
                        >
                          ✓ Mark Done
                        </button>
                      </div>
                    </div>

                    {/* Action Bar for Follow-up: Add to Google Calendar & Send Email Draft */}
                    <div
                      className="pt-2 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <a
                        href={getFollowUpMailto(app.company_name, app.job_title, app.follow_up_notes)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                        title="Draft a professional follow-up email in your mail app"
                      >
                        <Mail className="w-3.5 h-3.5 text-blue-600" />
                        <span>Draft Follow-up Email</span>
                      </a>

                      {app.follow_up_date && (
                        <a
                          href={getGoogleCalendarUrl(
                            `Follow up with ${app.company_name} (${app.job_title})`,
                            `Company: ${app.company_name}\nRole: ${app.job_title}\nFollow-up notes: ${app.follow_up_notes || 'Follow up with recruiter or check status'}`,
                            app.follow_up_date
                          )}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 hover:text-amber-900 bg-white hover:bg-amber-100/50 border border-amber-300 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                          title="Add to Google Calendar to receive automated email & phone reminders"
                        >
                          <CalendarPlus className="w-3.5 h-3.5 text-amber-600" />
                          <span>Google Calendar Reminder</span>
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal for adding custom reminder */}
      <AddCustomReminderModal
        isOpen={showAddReminderModal}
        onClose={() => setShowAddReminderModal(false)}
      />
    </div>
  );
};
