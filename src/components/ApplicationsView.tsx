import React, { useState, useMemo } from 'react';
import { Application, ApplicationType, ApplicationStage, ApplicationStatus, APPLICATION_TYPES, ALL_STAGES, ALL_STATUSES } from '../types/database';
import { useApplications } from '../context/ApplicationContext';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from './StatusBadge';
import { exportApplicationsToCSV } from '../lib/csvExport';
import { dataService } from '../lib/supabase';
import {
  Search,
  Filter,
  ArrowUpDown,
  Download,
  Plus,
  LayoutGrid,
  List,
  Eye,
  Edit,
  Trash2,
  FileText,
  Building,
  Briefcase,
  Calendar,
  MapPin,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';

interface ApplicationsViewProps {
  onSelectApplication: (app: Application) => void;
  onEditApplication: (app: Application) => void;
  onAddNew: () => void;
}

export const ApplicationsView: React.FC<ApplicationsViewProps> = ({
  onSelectApplication,
  onEditApplication,
  onAddNew,
}) => {
  const { user, profile } = useAuth();
  const { applications, deleteApplication, showToast, addSampleApplication } = useApplications();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [stageFilter, setStageFilter] = useState<string>('ALL');
  const [interviewFilter, setInterviewFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'company' | 'status' | 'updated'>('newest');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Filter & Search Logic
  const filteredApplications = useMemo(() => {
    return applications
      .filter((app) => {
        // Search
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchCompany = app.company_name.toLowerCase().includes(q);
          const matchTitle = app.job_title.toLowerCase().includes(q);
          const matchDesc = (app.job_description || '').toLowerCase().includes(q);
          const matchLearned = (app.what_i_learned || '').toLowerCase().includes(q);
          const matchNotes = (app.additional_notes || '').toLowerCase().includes(q);
          const matchLocation = (app.location || '').toLowerCase().includes(q);
          if (!matchCompany && !matchTitle && !matchDesc && !matchLearned && !matchNotes && !matchLocation) {
            return false;
          }
        }

        // Type filter
        if (typeFilter !== 'ALL' && app.application_type !== typeFilter) return false;

        // Status filter
        if (statusFilter !== 'ALL' && app.current_status !== statusFilter) return false;

        // Stage filter
        if (stageFilter !== 'ALL' && app.current_stage !== stageFilter) return false;

        // Interview filter
        if (interviewFilter === 'YES' && !app.interview_done) return false;
        if (interviewFilter === 'NO' && app.interview_done) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.date_applied || b.created_at).getTime() - new Date(a.date_applied || a.created_at).getTime();
        }
        if (sortBy === 'oldest') {
          return new Date(a.date_applied || a.created_at).getTime() - new Date(b.date_applied || b.created_at).getTime();
        }
        if (sortBy === 'company') {
          return a.company_name.localeCompare(b.company_name);
        }
        if (sortBy === 'status') {
          return a.current_status.localeCompare(b.current_status);
        }
        if (sortBy === 'updated') {
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        }
        return 0;
      });
  }, [applications, searchTerm, typeFilter, statusFilter, stageFilter, interviewFilter, sortBy]);

  const handleDownloadResume = async (app: Application, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!app.resume_file_path) {
      showToast('No resume file attached to this application', 'info');
      return;
    }
    const url = await dataService.getResumeDownloadUrl(app.resume_file_path);
    if (url) {
      const link = document.createElement('a');
      link.href = url;
      link.download = app.resume_file_name || 'resume.pdf';
      link.target = '_blank';
      link.rel = 'noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast(`Downloading resume for ${app.company_name}`, 'info');
    } else {
      showToast('Could not fetch resume download link', 'error');
    }
  };

  const handleDelete = async (app: Application, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Delete application for ${app.company_name} - ${app.job_title}?`)) {
      await deleteApplication(app.id);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Page Title & Top Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Applications</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage, filter, and track all submitted job and internship applications ({filteredApplications.length}{' '}
            {filteredApplications.length === 1 ? 'record' : 'records'})
          </p>
        </div>

        <div className="flex items-center gap-2.5">
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
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 px-3.5 py-2.5 rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>

          <button
            onClick={onAddNew}
            className="inline-flex items-center gap-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Application
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by company, role, skills, notes, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center border border-slate-200 rounded-xl p-1 bg-slate-50 shrink-0">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'table' ? 'bg-white shadow-xs text-blue-600' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Table view"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'cards' ? 'bg-white shadow-xs text-blue-600' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Card view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filters Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-2 border-t border-slate-100 text-xs">
          {/* Type Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">All Types</option>
              {APPLICATION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">All Statuses</option>
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Stage Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Stage</label>
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">All Stages</option>
              {ALL_STAGES.map((stg) => (
                <option key={stg} value={stg}>
                  {stg}
                </option>
              ))}
            </select>
          </div>

          {/* Interview Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Interview Done?</label>
            <select
              value={interviewFilter}
              onChange={(e) => setInterviewFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">All</option>
              <option value="YES">Yes</option>
              <option value="NO">No</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="newest">Newest Date Applied</option>
              <option value="oldest">Oldest Date Applied</option>
              <option value="updated">Recently Updated</option>
              <option value="company">Company (A-Z)</option>
              <option value="status">Status</option>
            </select>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filteredApplications.length === 0 && (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-4">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
            <Briefcase className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">No applications match your search or filter</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Try adjusting your filter options or add your first job/internship application.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={onAddNew}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs cursor-pointer"
            >
              + Add Application
            </button>
            <button
              onClick={addSampleApplication}
              className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
            >
              + Add Demo Sample (Google)
            </button>
          </div>
        </div>
      )}

      {/* TABLE VIEW (Section 11) */}
      {filteredApplications.length > 0 && viewMode === 'table' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Company</th>
                  <th className="py-3.5 px-4">Job / Internship</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Date Applied</th>
                  <th className="py-3.5 px-4">Current Stage</th>
                  <th className="py-3.5 px-4">Current Status</th>
                  <th className="py-3.5 px-4">Interview</th>
                  <th className="py-3.5 px-4">Resume</th>
                  <th className="py-3.5 px-4">Last Updated</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredApplications.map((app) => (
                  <tr
                    key={app.id}
                    onClick={() => onSelectApplication(app)}
                    className="hover:bg-blue-50/30 transition-colors cursor-pointer group"
                  >
                    {/* Company */}
                    <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 font-black flex items-center justify-center text-xs shrink-0">
                          {app.company_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div>{app.company_name}</div>
                          {app.is_sample && (
                            <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded font-medium">
                              Demo
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Job Title */}
                    <td className="py-3 px-4 font-semibold text-slate-800 whitespace-nowrap">
                      {app.job_title}
                    </td>

                    {/* Type */}
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-[11px]">
                        {app.application_type}
                      </span>
                    </td>

                    {/* Date Applied */}
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      {new Date(app.date_applied).toLocaleDateString('en-US', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>

                    {/* Current Stage */}
                    <td className="py-3 px-4 font-medium text-slate-800 whitespace-nowrap">
                      {app.current_stage}
                    </td>

                    {/* Current Status Badge */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <StatusBadge status={app.current_status} size="sm" />
                    </td>

                    {/* Interview */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {app.interview_done ? (
                        <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Yes {app.interview_round ? `(${app.interview_round})` : ''}
                        </span>
                      ) : (
                        <span className="text-slate-400">No</span>
                      )}
                    </td>

                    {/* Resume */}
                    <td className="py-3 px-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      {app.resume_file_name ? (
                        <button
                          onClick={(e) => handleDownloadResume(app, e)}
                          title={`Download ${app.resume_file_name}`}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline max-w-[120px] truncate"
                        >
                          <FileText className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{app.resume_file_name}</span>
                        </button>
                      ) : (
                        <span className="text-slate-300 italic">None</span>
                      )}
                    </td>

                    {/* Last Updated */}
                    <td className="py-3 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                      {new Date(app.updated_at || app.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onSelectApplication(app)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View application details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEditApplication(app)}
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Edit application"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(app, e)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete application"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CARD VIEW */}
      {filteredApplications.length > 0 && viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredApplications.map((app) => (
            <div
              key={app.id}
              onClick={() => onSelectApplication(app)}
              className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0">
                      {app.company_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                        {app.company_name}
                      </h3>
                      <div className="text-xs text-slate-500 font-medium">{app.job_title}</div>
                    </div>
                  </div>
                  <StatusBadge status={app.current_status} size="sm" />
                </div>

                <div className="space-y-1.5 pt-2 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Stage:</span>
                    <span className="font-semibold text-slate-800">{app.current_stage}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Applied:</span>
                    <span>{new Date(app.date_applied).toLocaleDateString()}</span>
                  </div>
                  {app.location && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Location:</span>
                      <span className="truncate max-w-[150px]">{app.location}</span>
                    </div>
                  )}
                  {app.follow_up_required && app.follow_up_date && (
                    <div className="flex items-center justify-between text-amber-700 bg-amber-50 p-1.5 rounded-lg border border-amber-200 font-medium">
                      <span>Follow-up:</span>
                      <span>{app.follow_up_date}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-500">
                  {app.resume_file_name ? (
                    <span className="flex items-center gap-1 text-blue-600 font-semibold">
                      <FileText className="w-3.5 h-3.5" /> Resume
                    </span>
                  ) : (
                    <span className="text-slate-400 text-[11px]">No resume</span>
                  )}
                </div>

                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onEditApplication(app)}
                    className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => handleDelete(app, e)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onSelectApplication(app)}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
