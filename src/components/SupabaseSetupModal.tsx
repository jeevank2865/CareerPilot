import React, { useState } from 'react';
import {
  isSupabaseConfigured,
  getStoredCredentials,
  saveCustomCredentials,
  clearCustomCredentials,
} from '../lib/supabase';
import {
  Database,
  CheckCircle2,
  Copy,
  ExternalLink,
  Key,
  Shield,
  Layers,
  Server,
  X,
  Code2,
} from 'lucide-react';

interface SupabaseSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SUPABASE_SQL_SCRIPT = `-- =====================================================================
-- JOB & INTERNSHIP TRACKER - COMPLETE SUPABASE SQL SCHEMA
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT,
    profile_photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 2. APPLICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    application_type TEXT NOT NULL DEFAULT 'Job',
    job_title TEXT NOT NULL,
    company_name TEXT NOT NULL,
    location TEXT,
    date_applied DATE NOT NULL DEFAULT CURRENT_DATE,
    job_description TEXT,
    what_i_learned TEXT,
    company_website TEXT,
    linkedin_url TEXT,
    job_posting_url TEXT,
    current_stage TEXT NOT NULL DEFAULT 'Applied',
    current_status TEXT NOT NULL DEFAULT 'Applied',
    interview_done BOOLEAN DEFAULT FALSE,
    interview_date DATE,
    interview_round TEXT,
    interviewer_name TEXT,
    interview_feedback TEXT,
    interview_notes TEXT,
    resume_file_name TEXT,
    resume_file_path TEXT,
    resume_file_type TEXT,
    resume_file_size BIGINT,
    resume_uploaded_at TIMESTAMP WITH TIME ZONE,
    expected_salary TEXT,
    offered_salary TEXT,
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_date DATE,
    follow_up_notes TEXT,
    additional_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own applications"
    ON public.applications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own applications"
    ON public.applications FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own applications"
    ON public.applications FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own applications"
    ON public.applications FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_applications_user_id ON public.applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_date_applied ON public.applications(date_applied);

-- 3. APPLICATION TIMELINE TABLE
CREATE TABLE IF NOT EXISTS public.application_timeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL DEFAULT 'status_change',
    event_title TEXT NOT NULL,
    event_description TEXT,
    event_date DATE NOT NULL DEFAULT CURRENT_DATE,
    event_time TEXT,
    reminder_enabled BOOLEAN DEFAULT TRUE,
    custom_reminder_days INT[] DEFAULT '{2,1}',
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.application_timeline ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own timeline entries"
    ON public.application_timeline FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own timeline entries"
    ON public.application_timeline FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own timeline entries"
    ON public.application_timeline FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own timeline entries"
    ON public.application_timeline FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_timeline_app_id ON public.application_timeline(application_id);
CREATE INDEX IF NOT EXISTS idx_timeline_user_id ON public.application_timeline(user_id);

-- 4. UNIVERSAL REMINDERS TABLE
CREATE TABLE IF NOT EXISTS public.reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    timeline_event_id UUID REFERENCES public.application_timeline(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    event_title TEXT NOT NULL,
    event_description TEXT,
    event_date DATE NOT NULL,
    event_time TEXT,
    reminder_date DATE NOT NULL,
    days_before INT NOT NULL,
    email_enabled BOOLEAN DEFAULT TRUE,
    in_app_enabled BOOLEAN DEFAULT TRUE,
    push_enabled BOOLEAN DEFAULT FALSE,
    email_sent BOOLEAN DEFAULT FALSE,
    notification_created BOOLEAN DEFAULT FALSE,
    is_cancelled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reminders"
    ON public.reminders FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reminders"
    ON public.reminders FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reminders"
    ON public.reminders FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reminders"
    ON public.reminders FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON public.reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_app_id ON public.reminders(application_id);
CREATE INDEX IF NOT EXISTS idx_reminders_reminder_date ON public.reminders(reminder_date);

-- 5. NOTIFICATION PREFERENCES TABLE
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    default_days_before INT[] DEFAULT '{2,1}',
    email_enabled BOOLEAN DEFAULT TRUE,
    in_app_enabled BOOLEAN DEFAULT TRUE,
    push_enabled BOOLEAN DEFAULT FALSE,
    timezone TEXT DEFAULT 'Asia/Kolkata',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notification preferences"
    ON public.notification_preferences FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification preferences"
    ON public.notification_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification preferences"
    ON public.notification_preferences FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 6. PROFILE AUTO-CREATION TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, user_id, full_name, email)
    VALUES (
        NEW.id,
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.email
    )
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.notification_preferences (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. STORAGE BUCKETS & RLS
INSERT INTO storage.buckets (id, name, public) VALUES ('resumes', 'resumes', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('profile-photos', 'profile-photos', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload their own resumes"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view and download their own resumes"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can upload their own profile photo"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'profile-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Anyone can view profile photos"
    ON storage.objects FOR SELECT USING (bucket_id = 'profile-photos');
`;

export const SupabaseSetupModal: React.FC<SupabaseSetupModalProps> = ({ isOpen, onClose }) => {
  const isConfigured = isSupabaseConfigured();
  const currentCreds = getStoredCredentials();
  const [url, setUrl] = useState(currentCreds.url || '');
  const [anonKey, setAnonKey] = useState(currentCreds.key || '');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'credentials' | 'sql'>('credentials');

  if (!isOpen) return null;

  const handleCopySQL = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCRIPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim() && anonKey.trim()) {
      saveCustomCredentials(url, anonKey);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-sm">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                Supabase PostgreSQL & Storage Setup
                {isConfigured ? (
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
                    Connected
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-blue-700 bg-blue-100 border border-blue-300 px-2 py-0.5 rounded-full">
                    Demo Mode Active
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500">
                Connect your live Supabase project for PostgreSQL persistence, Auth & Storage
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

        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/50 px-6 gap-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('credentials')}
            className={`py-3 px-3 border-b-2 transition-all ${
              activeTab === 'credentials'
                ? 'border-emerald-600 text-emerald-700 font-bold bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            1. Connect Credentials
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`py-3 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'sql'
                ? 'border-emerald-600 text-emerald-700 font-bold bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" /> 2. SQL Schema & RLS Script
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'credentials' && (
            <div className="space-y-6">
              {/* Instructions */}
              <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200 text-xs text-emerald-950 space-y-2 leading-relaxed">
                <div className="font-bold flex items-center gap-1.5 text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Fast 2-Minute Supabase Setup
                </div>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>
                    Go to{' '}
                    <a
                      href="https://supabase.com/dashboard"
                      target="_blank"
                      rel="noreferrer"
                      className="underline font-bold text-emerald-800 inline-flex items-center gap-0.5"
                    >
                      supabase.com/dashboard <ExternalLink className="w-3 h-3 inline" />
                    </a>{' '}
                    and create a new project.
                  </li>
                  <li>Go to <strong>SQL Editor</strong>, paste the script from the <strong>"SQL Schema"</strong> tab, and click <strong>Run</strong>.</li>
                  <li>Copy your <strong>Project URL</strong> and <strong>anon public key</strong> from <em>Project Settings → API</em>.</li>
                  <li>Paste below to connect live PostgreSQL and Storage immediately!</li>
                </ol>
              </div>

              {/* Form */}
              <form onSubmit={handleSaveCredentials} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Project URL (VITE_SUPABASE_URL)
                  </label>
                  <input
                    type="url"
                    placeholder="https://xyzcompany.supabase.co"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Anon Public Key (VITE_SUPABASE_ANON_KEY)
                  </label>
                  <input
                    type="password"
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    value={anonKey}
                    onChange={(e) => setAnonKey(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    required
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  {isConfigured && (
                    <button
                      type="button"
                      onClick={clearCustomCredentials}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
                    >
                      Disconnect / Revert to Demo Mode
                    </button>
                  )}
                  <div className="flex items-center gap-2 ml-auto">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                    >
                      Close
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-all cursor-pointer"
                    >
                      Save & Connect
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'sql' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Full Supabase PostgreSQL Schema Script
                  </h4>
                  <p className="text-xs text-slate-500">
                    Includes tables, RLS policies for auth.uid(), buckets (resumes & profile-photos), and auth trigger.
                  </p>
                </div>
                <button
                  onClick={handleCopySQL}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors cursor-pointer"
                >
                  {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied to Clipboard!' : 'Copy SQL Script'}
                </button>
              </div>

              <pre className="p-4 bg-slate-900 text-emerald-400 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-96 leading-relaxed border border-slate-800">
                {SUPABASE_SQL_SCRIPT}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
