import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApplications } from '../context/ApplicationContext';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { NotificationCenterDropdown } from './NotificationCenterDropdown';
import {
  Briefcase,
  Download,
  LogOut,
  Menu,
  X,
  Bell,
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  onAddNew?: () => void;
  onOpenSupabaseModal?: () => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onNavigate,
  mobileMenuOpen,
  setMobileMenuOpen,
}) => {
  const { user, profile, signOut } = useAuth();
  const {
    applications,
    followUpApplications,
    activeRemindersCount,
    setSelectedApplication,
  } = useApplications();
  const { canInstall, installApp } = usePWAInstall();
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const urgentCount = followUpApplications.length;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <button
              onClick={() => onNavigate('dashboard')}
              className="flex items-center gap-2.5 text-left group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <span className="font-black text-sm sm:text-base text-slate-900 tracking-tight block leading-tight">
                  Job & Internship Tracker
                </span>
                <span className="text-[10px] font-semibold text-blue-600 uppercase tracking-widest block">
                  Career Portal
                </span>
              </div>
            </button>
          </div>

          {/* Desktop Nav Links: Dashboard, Applications, Calendar & Follow-ups, Profile */}
          <nav className="hidden md:flex items-center gap-1 text-xs font-bold text-slate-600">
            <button
              onClick={() => onNavigate('dashboard')}
              className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                currentTab === 'dashboard'
                  ? 'bg-blue-50 text-blue-600 font-extrabold'
                  : 'hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Dashboard
            </button>

            <button
              onClick={() => onNavigate('applications')}
              className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                currentTab === 'applications'
                  ? 'bg-blue-50 text-blue-600 font-extrabold'
                  : 'hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Applications
              <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded-full font-bold">
                {applications.length}
              </span>
            </button>

            <button
              onClick={() => onNavigate('followups')}
              className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                currentTab === 'followups'
                  ? 'bg-blue-50 text-blue-600 font-extrabold'
                  : 'hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Calendar & Follow-ups
              {urgentCount > 0 && (
                <span className="text-[10px] bg-amber-500 text-white px-1.5 py-0.2 rounded-full font-bold">
                  {urgentCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onNavigate('profile')}
              className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                currentTab === 'profile'
                  ? 'bg-blue-50 text-blue-600 font-extrabold'
                  : 'hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Profile
            </button>
          </nav>

          {/* Right: Clean User Profile Avatar & Logout */}
          <div className="flex items-center gap-2 relative">
            {/* Universal Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className={`p-2 rounded-xl border transition-all cursor-pointer relative ${
                  notificationsOpen
                    ? 'bg-blue-50 border-blue-300 text-blue-600'
                    : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-600'
                }`}
                title="Notifications & Reminders"
              >
                <Bell className="w-4 h-4" />
                {activeRemindersCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-white rounded-full text-[9px] font-black flex items-center justify-center shadow-xs animate-pulse">
                    {activeRemindersCount > 9 ? '9+' : activeRemindersCount}
                  </span>
                )}
              </button>

              <NotificationCenterDropdown
                isOpen={notificationsOpen}
                onClose={() => setNotificationsOpen(false)}
                onSelectApplication={(app) => {
                  setSelectedApplication(app);
                  onNavigate('applications');
                }}
              />
            </div>

            {canInstall && (
              <button
                onClick={installApp}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                title="Install App on Phone"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Install App</span>
                <span className="sm:hidden">Install</span>
              </button>
            )}

            <button
              onClick={() => onNavigate('profile')}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer text-left"
              title="View & Edit Profile"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs border-2 border-white ring-1 ring-slate-200">
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
              <div className="hidden sm:block">
                <div className="text-xs font-bold text-slate-800 leading-tight">
                  {profile?.full_name || 'My Profile'}
                </div>
                <div className="text-[10px] text-slate-400 truncate max-w-[130px]">
                  {profile?.email || user?.email}
                </div>
              </div>
            </button>

            <button
              onClick={signOut}
              title="Log out"
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Collapsible Navigation Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1.5 animate-in slide-in-from-top-2">
          <button
            onClick={() => {
              onNavigate('dashboard');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold ${
              currentTab === 'dashboard' ? 'bg-blue-50 text-blue-600' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => {
              onNavigate('applications');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex justify-between items-center ${
              currentTab === 'applications' ? 'bg-blue-50 text-blue-600' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span>Applications</span>
            <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-bold">
              {applications.length}
            </span>
          </button>
          <button
            onClick={() => {
              onNavigate('followups');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex justify-between items-center ${
              currentTab === 'followups' ? 'bg-blue-50 text-blue-600' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span>Calendar & Follow-ups</span>
            {urgentCount > 0 && (
              <span className="text-[10px] bg-amber-500 text-white px-2 py-0.5 rounded-full font-bold">
                {urgentCount}
              </span>
            )}
          </button>
          <button
            onClick={() => {
              onNavigate('profile');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold ${
              currentTab === 'profile' ? 'bg-blue-50 text-blue-600' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            Profile & Settings
          </button>

          {canInstall && (
            <button
              onClick={() => {
                installApp();
                setMobileMenuOpen(false);
              }}
              className="w-full mt-2 flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 text-white shadow-xs hover:bg-blue-700 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Install App on Phone</span>
            </button>
          )}
        </div>
      )}
    </header>
  );
};
