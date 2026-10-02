import React from 'react';
import { ApplicationStatus, ApplicationStage } from '../types/database';

interface StatusBadgeProps {
  status?: ApplicationStatus;
  stage?: ApplicationStage;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, stage, size = 'md' }) => {
  const text = status || stage || 'Unknown';

  const getColorClasses = (value: string) => {
    switch (value) {
      case 'Selected':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Offer Received':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Interview Scheduled':
      case 'Interview Completed':
      case 'Technical Interview':
      case 'HR Interview':
      case 'Final Interview':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Shortlisted':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Applied':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Under Review':
      case 'Application Viewed':
      case 'Online Assessment':
      case 'Assessment Pending':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Rejected':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'Withdrawn':
      case 'On Hold':
      case 'Saved':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-semibold tracking-wide',
    lg: 'text-sm px-3 py-1.5 font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border transition-all ${getColorClasses(
        text
      )} ${sizeClasses[size]}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {text}
    </span>
  );
};
