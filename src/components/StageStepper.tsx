import React from 'react';
import { ApplicationStage, ApplicationStatus, STAGES_ORDER, ALL_STATUSES } from '../types/database';
import { Check, ChevronRight, Sparkles, AlertCircle } from 'lucide-react';

interface StageStepperProps {
  currentStage: ApplicationStage;
  currentStatus: ApplicationStatus;
  onUpdateStage?: (stage: ApplicationStage, status?: ApplicationStatus) => void;
  interactive?: boolean;
}

export const StageStepper: React.FC<StageStepperProps> = ({
  currentStage,
  currentStatus,
  onUpdateStage,
  interactive = false,
}) => {
  const isTerminalNegative = currentStage === 'Rejected' || currentStage === 'Withdrawn';
  const currentIndex = STAGES_ORDER.indexOf(currentStage);

  return (
    <div className="w-full space-y-4">
      {/* Current Highlight Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border border-blue-100 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600 text-white rounded-lg shadow-sm">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs uppercase font-semibold tracking-wider text-blue-600">Current Pipeline Stage</div>
            <div className="text-base font-bold text-slate-900 flex items-center gap-2">
              {currentStage}
              <span className="text-xs px-2 py-0.5 font-medium rounded-md bg-white border border-blue-200 text-blue-700">
                Status: {currentStatus}
              </span>
            </div>
          </div>
        </div>

        {interactive && onUpdateStage && (
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-600">Quick Change Stage:</label>
            <select
              value={currentStage}
              onChange={(e) => onUpdateStage(e.target.value as ApplicationStage)}
              className="text-xs font-semibold bg-white border border-slate-300 rounded-lg px-3 py-1.5 shadow-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {STAGES_ORDER.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
              <option value="Rejected">Rejected</option>
              <option value="Withdrawn">Withdrawn</option>
            </select>

            <select
              value={currentStatus}
              onChange={(e) => onUpdateStage(currentStage, e.target.value as ApplicationStatus)}
              className="text-xs font-semibold bg-white border border-slate-300 rounded-lg px-3 py-1.5 shadow-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {ALL_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {isTerminalNegative ? (
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/60 flex items-center gap-3 text-rose-800 text-sm font-medium">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>
            This application is marked as <strong>{currentStage}</strong>. You can still switch back to any previous or active stage anytime above.
          </span>
        </div>
      ) : (
        <div className="overflow-x-auto pb-3 pt-1">
          <div className="min-w-[760px] flex items-center justify-between relative px-2">
            {/* Connecting background line */}
            <div className="absolute left-6 right-6 top-4 -translate-y-1/2 h-1 bg-slate-200 -z-0 rounded" />
            
            {STAGES_ORDER.map((stage, idx) => {
              const isPast = currentIndex > -1 && idx < currentIndex;
              const isCurrent = idx === currentIndex;
              const isFuture = currentIndex === -1 || idx > currentIndex;

              return (
                <div key={stage} className="flex flex-col items-center relative z-10 group">
                  <button
                    type="button"
                    disabled={!interactive || !onUpdateStage}
                    onClick={() => interactive && onUpdateStage && onUpdateStage(stage)}
                    title={interactive ? `Click to advance to ${stage}` : stage}
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-200 ${
                      interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'
                    } ${
                      isCurrent
                        ? 'bg-blue-600 text-white ring-4 ring-blue-100 shadow-md scale-110'
                        : isPast
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-white border-2 border-slate-300 text-slate-400 hover:border-slate-400'
                    }`}
                  >
                    {isPast ? <Check className="w-4 h-4 stroke-[3]" /> : idx + 1}
                  </button>

                  <span
                    className={`mt-2 text-[11px] font-medium text-center max-w-[72px] leading-tight transition-colors ${
                      isCurrent
                        ? 'font-bold text-blue-700'
                        : isPast
                        ? 'text-slate-800 font-semibold'
                        : 'text-slate-400'
                    }`}
                  >
                    {stage}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
