import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useApplications } from '../context/ApplicationContext';
import { exportApplicationsToCSV } from '../lib/csvExport';
import {
  LayoutDashboard,
  Briefcase,
  PlusCircle,
  CalendarClock,
  User,
  Settings,
  Database,
  FileSpreadsheet,
  LogOut,
  Sparkles,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  onAddNew: () => void;
  onOpenSupabaseModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onNavigate,
  onAddNew,
  onOpenSupabaseModal,
}) => {
  const { user, profile, signOut, isConfigured } = useAuth();
  const { applications, followUpApplications, addSampleApplication } = useApplications();

  const urgentCount = followUpApplications.length;

  return (
    <aside className="w-64 bg-white border-r border-slate-200 hidden lg:flex flex-col justify-between shrink-0 h-screen sticky top-0">
      {/* Top Header & Logo */}
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-700 text-white flex items-center justify-center shadow-md shrink-0">
            <Briefcase className="w-5 h-5" />
          </div>
          <div className="overflow-hidden">
            <h1 className="font-extrabold text-sm text-slate-900 tracking-tight leading-tight truncate">
              Job & Internship
            </h1>
            <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block">
              Application Tracker
            </span>
          </div>
        </div>

        {/* Add Application CTA */}
        <button
          onClick={onAddNew}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-md transition-all cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Application</span>
        </button>

        {/* Navigation Items */}
        <nav className="space-y-1.5 text-xs font-bold text-slate-600">
          <button
            onClick={() => onNavigate('dashboard')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
              currentTab === 'dashboard'
                ? 'bg-blue-50 text-blue-600 font-extrabold shadow-2xs'
                : 'hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </div>
          </button>

          <button
            onClick={() => onNavigate('applications')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
              currentTab === 'applications'
                ? 'bg-blue-50 text-blue-600 font-extrabold shadow-2xs'
                : 'hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <Briefcase className="w-4 h-4" />
              <span>Applications</span>
            </div>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                currentTab === 'applications'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {applications.length}
            </span>
          </button>

          <button
            onClick={() => onNavigate('followups')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
              currentTab === 'followups'
                ? 'bg-blue-50 text-blue-600 font-extrabold shadow-2xs'
                : 'hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <CalendarClock className="w-4 h-4" />
              <span>Calendar & Follow-ups</span>
            </div>
            {urgentCount > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500 text-white animate-pulse">
                {urgentCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onNavigate('profile')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
              currentTab === 'profile'
                ? 'bg-blue-50 text-blue-600 font-extrabold shadow-2xs'
                : 'hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <User className="w-4 h-4" />
              <span>Profile & Settings</span>
            </div>
          </button>
        </nav>

        {/* Tools & Utilities */}
        <div className="pt-4 border-t border-slate-100 space-y-1.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3.5 mb-1">
            System & Tools
          </div>

          <button
            onClick={onOpenSupabaseModal}
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-emerald-700 hover:bg-emerald-50/60 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Database className="w-4 h-4 text-emerald-600" />
              <span>Supabase Database</span>
            </div>
            <span
              className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                isConfigured
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {isConfigured ? 'Active' : 'Setup'}
            </span>
          </button>

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
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-40"
          >
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-4 h-4 text-slate-500" />
              <span>Export CSV</span>
            </div>
          </button>

          {applications.length === 0 && (
            <button
              onClick={addSampleApplication}
              className="w-full flex items-center gap-2 px-3.5 py-2 rounded-xl text-[11px] font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>+ Add Demo Google Sample</span>
            </button>
          )}
        </div>
      </div>

      {/* Bottom User Profile Section (Section 2 & 21) */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/60 space-y-3">
        <div
          onClick={() => onNavigate('profile')}
          className="flex items-center gap-3 p-2 rounded-xl hover:bg-white transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs border-2 border-white ring-1 ring-slate-200 shrink-0">
            {profile?.profile_photo_url ? (
              <img
                src={profile.profile_photo_url}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              (profile?.full_name || user?.email || 'U').charAt(0).toUpperCase()
            )}
          </div>
          <div className="overflow-hidden flex-1">
            <div className="text-xs font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
              {profile?.full_name || 'My Profile'}
            </div>
            <div className="text-[11px] text-slate-400 truncate">
              {profile?.email || user?.email || 'user@example.com'}
            </div>
          </div>
        </div>

        <button
          onClick={signOut}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
