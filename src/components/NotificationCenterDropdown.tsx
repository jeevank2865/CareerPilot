import React, { useRef, useEffect } from 'react';
import { useApplications, UpcomingTaskItem } from '../context/ApplicationContext';
import { Application } from '../types/database';
import {
  Bell,
  Calendar,
  Clock,
  ExternalLink,
  CheckCircle2,
  CalendarPlus,
  Building,
  Sparkles,
  X,
} from 'lucide-react';
import { getEventTypeBadge } from '../lib/reminderService';

interface NotificationCenterDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectApplication: (app: Application) => void;
}

export const NotificationCenterDropdown: React.FC<NotificationCenterDropdownProps> = ({
  isOpen,
  onClose,
  onSelectApplication,
}) => {
  const { upcomingTasks, applications, cancelReminder, markAllRemindersRead } = useApplications();
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Group tasks into Today, Tomorrow, In 2 days, and Upcoming
  const todayTasks = upcomingTasks.filter((t) => t.isToday || t.isUrgent);
  const tomorrowTasks = upcomingTasks.filter((t) => t.isTomorrow);
  const in2DaysTasks = upcomingTasks.filter((t) => t.relativeLabel === 'In 2 days');
  const futureTasks = upcomingTasks.filter(
    (t) => !t.isToday && !t.isTomorrow && !t.isUrgent && t.relativeLabel !== 'In 2 days'
  );

  const handleOpenApp = (appId: string) => {
    const app = applications.find((a) => a.id === appId);
    if (app) {
      onSelectApplication(app);
      onClose();
    }
  };

  const getCalendarUrl = (task: UpcomingTaskItem) => {
    const cleanDate = task.eventDate.replace(/-/g, '');
    const title = encodeURIComponent(`${task.eventType} - ${task.companyName}`);
    const details = encodeURIComponent(
      `Job & Internship Tracker Reminder:\n${task.title}\nRole: ${task.jobTitle}\nCompany: ${task.companyName}\nDate: ${task.eventDate}`
    );
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&dates=${cleanDate}/${cleanDate}`;
  };

  const renderTaskCard = (task: UpcomingTaskItem) => {
    const badge = getEventTypeBadge(task.eventType);

    return (
      <div
        key={task.id}
        onClick={() => handleOpenApp(task.applicationId)}
        className="group p-3 sm:p-3.5 bg-white hover:bg-slate-50 border border-slate-100 rounded-2xl transition-all cursor-pointer shadow-2xs hover:shadow-xs space-y-2"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.bgClass}`}
            >
              {task.eventType}
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${task.badgeClass}`}
            >
              {task.relativeLabel}
            </span>
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <a
              href={getCalendarUrl(task)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              title="Add to Google Calendar"
              className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <CalendarPlus className="w-3.5 h-3.5" />
            </a>
            {task.reminderId && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  cancelReminder(task.reminderId!);
                }}
                title="Dismiss reminder"
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div>
          <div className="text-xs font-black text-slate-900 leading-snug group-hover:text-blue-600 transition-colors">
            {task.title}
          </div>
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
            <span className="font-semibold text-slate-700">{task.companyName}</span>
            <span>•</span>
            <span className="truncate">{task.jobTitle}</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-50">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-slate-400" />
            <span>
              {new Date(task.eventDate + 'T00:00:00').toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
            {task.eventTime && (
              <>
                <Clock className="w-3 h-3 text-slate-400 ml-1.5" />
                <span>{task.eventTime}</span>
              </>
            )}
          </div>

          <span className="text-blue-600 font-bold group-hover:underline flex items-center gap-0.5">
            View App <ExternalLink className="w-2.5 h-2.5" />
          </span>
        </div>
      </div>
    );
  };

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white/98 backdrop-blur-md rounded-3xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-600 text-white rounded-xl shadow-2xs">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Notifications & Reminders
            </h3>
            <p className="text-[10px] text-slate-500">
              {upcomingTasks.length} upcoming stage & event reminder{upcomingTasks.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-xl transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content list */}
      <div className="max-h-[420px] overflow-y-auto p-3 space-y-4 divide-y divide-slate-100/80">
        {upcomingTasks.length === 0 ? (
          <div className="py-10 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="text-xs font-bold text-slate-700">All caught up!</div>
            <p className="text-[11px] text-slate-400 max-w-[200px] mx-auto">
              No active or upcoming reminders. When you schedule an assessment, interview, or deadline, reminders appear here.
            </p>
          </div>
        ) : (
          <>
            {/* Today */}
            {todayTasks.length > 0 && (
              <div className="space-y-2 pt-2 first:pt-0">
                <div className="text-[10px] font-black uppercase tracking-wider text-amber-700 flex items-center gap-1.5 px-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  Today / Due
                </div>
                <div className="space-y-2">{todayTasks.map(renderTaskCard)}</div>
              </div>
            )}

            {/* Tomorrow */}
            {tomorrowTasks.length > 0 && (
              <div className="space-y-2 pt-3">
                <div className="text-[10px] font-black uppercase tracking-wider text-blue-700 flex items-center gap-1.5 px-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  Tomorrow
                </div>
                <div className="space-y-2">{tomorrowTasks.map(renderTaskCard)}</div>
              </div>
            )}

            {/* In 2 Days */}
            {in2DaysTasks.length > 0 && (
              <div className="space-y-2 pt-3">
                <div className="text-[10px] font-black uppercase tracking-wider text-indigo-700 flex items-center gap-1.5 px-1">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  In 2 Days
                </div>
                <div className="space-y-2">{in2DaysTasks.map(renderTaskCard)}</div>
              </div>
            )}

            {/* Later Upcoming */}
            {futureTasks.length > 0 && (
              <div className="space-y-2 pt-3">
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5 px-1">
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  Upcoming
                </div>
                <div className="space-y-2">{futureTasks.map(renderTaskCard)}</div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
        <div className="text-[10px] text-slate-500 flex items-center justify-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-500" />
          <span>Multi-stage universal reminders active (Asia/Kolkata)</span>
        </div>
      </div>
    </div>
  );
};
