import React, { useMemo } from 'react';
import { Application } from '../types/database';
import { useApplications } from '../context/ApplicationContext';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from './StatusBadge';
import { exportApplicationsToCSV } from '../lib/csvExport';
import {
  Briefcase,
  Send,
  Loader2,
  Users,
  CheckCircle,
  XCircle,
  Calendar,
  Clock,
  ArrowRight,
  Plus,
  Sparkles,
  TrendingUp,
  FileSpreadsheet,
  AlertCircle,
  ChevronRight,
  Award,
  Bell,
} from 'lucide-react';

interface DashboardViewProps {
  onNavigateToApplications: () => void;
  onSelectApplication: (app: Application) => void;
  onAddNew: () => void;
  onNavigateToFollowUps: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateToApplications,
  onSelectApplication,
  onAddNew,
  onNavigateToFollowUps,
}) => {
  const { user, profile } = useAuth();
  const {
    applications,
    stats,
    followUpApplications,
    upcomingInterviews,
    recentApplications,
    addSampleApplication,
    upcomingTasks,
  } = useApplications();

  // Distribution for Application Pipeline Chart
  const pipelineStats = useMemo(() => {
    const counts: Record<string, number> = {
      Applied: 0,
      'Application Viewed': 0,
      Shortlisted: 0,
      'Online Assessment': 0,
      'Technical Interview': 0,
      'HR Interview': 0,
      'Offer Received': 0,
      Selected: 0,
      Rejected: 0,
    };
    applications.forEach((app) => {
      if (counts[app.current_stage] !== undefined) {
        counts[app.current_stage]++;
      }
    });
    return counts;
  }, [applications]);

  // Jobs vs Internships
  const typeCounts = useMemo(() => {
    let jobs = 0;
    let internships = 0;
    let others = 0;
    applications.forEach((a) => {
      if (a.application_type === 'Internship') internships++;
      else if (a.application_type === 'Job' || a.application_type === 'Full-Time') jobs++;
      else others++;
    });
    return { jobs, internships, others };
  }, [applications]);

  // Applications by Month (Last 6 Months)
  const monthlyStats = useMemo(() => {
    const monthsMap: Record<string, number> = {};
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Initialize past 6 months
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`;
      monthsMap[key] = 0;
    }

    applications.forEach((app) => {
      if (app.date_applied) {
        const d = new Date(app.date_applied);
        const key = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`;
        if (monthsMap[key] !== undefined) {
          monthsMap[key]++;
        }
      }
    });

    return Object.entries(monthsMap).map(([month, count]) => ({ month, count }));
  }, [applications]);

  // Check if any follow-up is due today or overdue
  const todayStr = new Date().toISOString().split('T')[0];
  const urgentFollowUps = followUpApplications.filter((app) => app.follow_up_date && app.follow_up_date <= todayStr);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white p-6 sm:p-8 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold text-blue-100">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Personal Career Intelligence
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Job & Internship Application Tracker
          </h1>
          <p className="text-sm text-blue-100 max-w-xl">
            Track every submission, interview round, recruiter feedback, learning insights, and exact resume version in one central system.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-3">
          <button
            onClick={() =>
              exportApplicationsToCSV(applications, {
                userName: profile?.full_name || user?.user_metadata?.full_name,
                userEmail: profile?.email || user?.email,
                userId: user?.id || profile?.user_id,
                profilePhotoUrl: profile?.profile_photo_url,
              })
            }
            disabled={applications.length === 0}
            className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 px-4 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" /> Export CSV
          </button>
          <button
            onClick={onAddNew}
            className="inline-flex items-center gap-2 bg-white text-blue-700 hover:bg-blue-50 px-5 py-2.5 rounded-xl text-xs font-extrabold shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Application
          </button>
        </div>
      </div>

      {/* URGENT FOLLOW-UP NOTIFICATION (Section 10) */}
      {urgentFollowUps.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 shadow-xs flex items-center justify-between gap-4 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-xs shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                Follow-ups Requiring Immediate Attention ({urgentFollowUps.length})
              </h4>
              <p className="text-xs text-amber-800 mt-0.5">
                {urgentFollowUps[0].follow_up_date === todayStr
                  ? `Follow up with ${urgentFollowUps[0].company_name} today!`
                  : `Follow up with ${urgentFollowUps[0].company_name} was due on ${urgentFollowUps[0].follow_up_date}`}
                {urgentFollowUps[0].follow_up_notes && ` — "${urgentFollowUps[0].follow_up_notes}"`}
              </p>
            </div>
          </div>
          <button
            onClick={onNavigateToFollowUps}
            className="inline-flex items-center gap-1 text-xs font-bold text-amber-900 bg-white border border-amber-300 hover:bg-amber-100 px-3.5 py-1.5 rounded-xl transition-colors shrink-0 cursor-pointer"
          >
            View Follow-ups <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* COMPACT UPCOMING TASKS & REMINDERS (Universal Reminders for all stages) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-xl shadow-xs">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
                Upcoming Tasks & Reminders
                {upcomingTasks.length > 0 && (
                  <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    {upcomingTasks.length} active
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500">Universal reminders for assessments, interviews, deadlines & follow-ups</p>
            </div>
          </div>

          <button
            onClick={onNavigateToFollowUps}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
          >
            View Calendar <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {upcomingTasks.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
            No upcoming tasks or reminders. Schedule an online assessment, interview, or follow-up date to see reminders here.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {upcomingTasks.slice(0, 8).map((task) => {
              const app = applications.find((a) => a.id === task.applicationId);
              return (
                <div
                  key={task.id}
                  onClick={() => app && onSelectApplication(app)}
                  className="p-3 bg-slate-50/80 hover:bg-blue-50/60 border border-slate-200/70 hover:border-blue-200 rounded-2xl transition-all cursor-pointer group space-y-1.5"
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-extrabold text-slate-700 flex items-center gap-1">
                      <span className="text-blue-600 font-black">•</span>
                      {task.relativeLabel}
                    </span>
                    <span className={`px-1.5 py-0.2 rounded-md font-bold ${task.badgeClass}`}>
                      {task.eventType}
                    </span>
                  </div>
                  <div className="text-xs font-black text-slate-900 leading-snug group-hover:text-blue-700 truncate">
                    {task.title}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                    <span className="font-semibold text-slate-700">{task.companyName}</span>
                    <span>—</span>
                    <span className="truncate">{task.jobTitle}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 6 KEY SUMMARY CARDS (Section 3) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* 1. Total Applications */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">{stats.total}</div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">{stats.thisMonth} this month</div>
        </div>

        {/* 2. Applied */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Applied</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Send className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-blue-600">{stats.applied}</div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">Initial stage</div>
        </div>

        {/* 3. In Progress */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">In Progress</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Loader2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-indigo-600">{stats.inProgress}</div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">Review / Tests</div>
        </div>

        {/* 4. Interviews */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Interviews</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600">{stats.interviews}</div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">Completed & scheduled</div>
        </div>

        {/* 5. Selected / Offers */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Selected</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600">
            {stats.selected + stats.offers}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">
            {stats.offers > 0 ? `${stats.offers} offers, ${stats.selected} selected` : 'Offers & selected'}
          </div>
        </div>

        {/* 6. Rejected */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-rose-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Rejected</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-600">{stats.rejected}</div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">Learning steps</div>
        </div>
      </div>

      {/* DASHBOARD ANALYTICS CHARTS (Section 19) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Pipeline Funnel / Distribution */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Application Pipeline Breakdown
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Current stage distribution across all applications</p>
            </div>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>

          <div className="space-y-3 pt-2">
            {Object.entries(pipelineStats).map(([stage, count]) => {
              const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
              return (
                <div key={stage} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium text-slate-700">
                    <span>{stage}</span>
                    <span className="text-slate-500">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        stage === 'Selected' || stage === 'Offer Received'
                          ? 'bg-emerald-500'
                          : stage === 'Technical Interview' || stage === 'HR Interview'
                          ? 'bg-amber-500'
                          : stage === 'Shortlisted' || stage === 'Online Assessment'
                          ? 'bg-purple-500'
                          : stage === 'Rejected'
                          ? 'bg-rose-400'
                          : 'bg-blue-600'
                      }`}
                      style={{ width: `${Math.max(pct, count > 0 ? 5 : 0)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 2: Jobs vs Internships & Monthly Activity */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              Application Types
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Full-time jobs vs Internships</p>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 text-center">
                <div className="text-xs font-bold text-blue-600 uppercase">Jobs</div>
                <div className="text-2xl font-black text-slate-900 mt-1">{typeCounts.jobs}</div>
              </div>
              <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-100 text-center">
                <div className="text-xs font-bold text-purple-600 uppercase">Internships</div>
                <div className="text-2xl font-black text-slate-900 mt-1">{typeCounts.internships}</div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
              Applications by Month
            </h4>
            <div className="flex items-end justify-between gap-2 h-28 pt-2">
              {monthlyStats.map((item) => {
                const maxCount = Math.max(...monthlyStats.map((m) => m.count), 1);
                const heightPct = Math.round((item.count / maxCount) * 80) + 15;
                return (
                  <div key={item.month} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                    <span className="text-[10px] font-bold text-slate-700">{item.count}</span>
                    <div
                      className="w-full bg-blue-600 rounded-t-md hover:bg-blue-700 transition-colors"
                      style={{ height: `${heightPct}%` }}
                    />
                    <span className="text-[9px] font-medium text-slate-400 truncate w-full text-center">
                      {item.month}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* TWO COLUMNS: Recent Applications & Upcoming Interviews */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Applications (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Recent Applications
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Latest submitted applications and updates</p>
            </div>
            <button
              onClick={onNavigateToApplications}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
            >
              View All ({applications.length}) <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentApplications.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl space-y-3">
              <p className="text-xs text-slate-500">No applications tracked yet.</p>
              <div className="flex justify-center gap-2">
                <button
                  onClick={onAddNew}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 rounded-xl cursor-pointer"
                >
                  + Add First Application
                </button>
                <button
                  onClick={addSampleApplication}
                  className="px-3.5 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  + Add Demo Google Sample
                </button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentApplications.map((app) => (
                <div
                  key={app.id}
                  onClick={() => onSelectApplication(app)}
                  className="py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/80 -mx-2 px-2 rounded-xl transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm shrink-0">
                      {app.company_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {app.company_name}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium">
                          {app.application_type}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 font-medium mt-0.5">{app.job_title}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                      <div className="text-xs font-semibold text-slate-700">{app.current_stage}</div>
                      <div className="text-[11px] text-slate-400">
                        {new Date(app.date_applied).toLocaleDateString()}
                      </div>
                    </div>
                    <StatusBadge status={app.current_status} size="sm" />
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Interviews & Follow-ups (1 col) */}
        <div className="space-y-6">
          {/* Upcoming Interview Dates */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-600" /> Upcoming Interviews
              </h3>
              <span className="text-xs font-bold text-slate-400">{upcomingInterviews.length}</span>
            </div>

            {upcomingInterviews.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No interviews scheduled yet.</p>
            ) : (
              <div className="space-y-3">
                {upcomingInterviews.slice(0, 4).map((app) => (
                  <div
                    key={app.id}
                    onClick={() => onSelectApplication(app)}
                    className="p-3 rounded-xl bg-blue-50/40 border border-blue-100 hover:border-blue-300 transition-all cursor-pointer space-y-1"
                  >
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-900">{app.company_name}</span>
                      <span className="font-bold text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200 text-[11px]">
                        {app.interview_date}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 font-medium">
                      Round: {app.interview_round || 'General'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Follow-up Section */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-600" /> Follow-up Tracker
              </h3>
              <button
                onClick={onNavigateToFollowUps}
                className="text-xs font-bold text-amber-700 hover:underline cursor-pointer"
              >
                View all ({followUpApplications.length})
              </button>
            </div>

            {followUpApplications.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No follow-ups pending.</p>
            ) : (
              <div className="space-y-2.5">
                {followUpApplications.slice(0, 3).map((app) => (
                  <div
                    key={app.id}
                    onClick={() => onSelectApplication(app)}
                    className="p-3 rounded-xl bg-amber-50/50 border border-amber-200 hover:border-amber-300 transition-all cursor-pointer"
                  >
                    <div className="flex justify-between items-center text-xs font-bold text-amber-900">
                      <span>{app.company_name}</span>
                      <span className="text-[11px] font-semibold">{app.follow_up_date}</span>
                    </div>
                    {app.follow_up_notes && (
                      <p className="text-xs text-slate-700 mt-1 line-clamp-1">{app.follow_up_notes}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
