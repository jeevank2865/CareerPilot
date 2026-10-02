-- =====================================================================
-- JOB & INTERNSHIP TRACKER - COMPLETE SUPABASE SQL SCHEMA
-- =====================================================================
-- Run this in your Supabase SQL Editor to set up all tables, foreign keys,
-- Row Level Security (RLS) policies, and storage bucket security.

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------------
-- 1. PROFILES TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT,
    profile_photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS) for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- 2. APPLICATIONS TABLE
-- ---------------------------------------------------------------------
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

-- Row Level Security (RLS) for applications
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own applications"
    ON public.applications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own applications"
    ON public.applications FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own applications"
    ON public.applications FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own applications"
    ON public.applications FOR DELETE
    USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON public.applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_date_applied ON public.applications(date_applied);
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications(current_status);
CREATE INDEX IF NOT EXISTS idx_applications_stage ON public.applications(current_stage);

-- ---------------------------------------------------------------------
-- 3. APPLICATION TIMELINE TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.application_timeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL DEFAULT 'status_change',
    event_title TEXT NOT NULL,
    event_description TEXT,
    event_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    event_time TIME,
    reminder_enabled BOOLEAN DEFAULT FALSE,
    custom_reminder_days INTEGER[] DEFAULT '{2,1}',
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- If application_timeline already exists, ensure new columns are added:
ALTER TABLE public.application_timeline ADD COLUMN IF NOT EXISTS event_time TIME;
ALTER TABLE public.application_timeline ADD COLUMN IF NOT EXISTS reminder_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE public.application_timeline ADD COLUMN IF NOT EXISTS custom_reminder_days INTEGER[] DEFAULT '{2,1}';
ALTER TABLE public.application_timeline ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT FALSE;

-- Row Level Security (RLS) for application_timeline
ALTER TABLE public.application_timeline ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own timeline entries"
    ON public.application_timeline FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own timeline entries"
    ON public.application_timeline FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own timeline entries"
    ON public.application_timeline FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own timeline entries"
    ON public.application_timeline FOR DELETE
    USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_timeline_app_id ON public.application_timeline(application_id);
CREATE INDEX IF NOT EXISTS idx_timeline_user_id ON public.application_timeline(user_id);
CREATE INDEX IF NOT EXISTS idx_timeline_event_date ON public.application_timeline(event_date);

-- ---------------------------------------------------------------------
-- 4. UNIVERSAL REMINDERS TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    timeline_event_id UUID REFERENCES public.application_timeline(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    event_title TEXT NOT NULL,
    event_description TEXT,
    event_date DATE NOT NULL,
    event_time TIME,
    reminder_date DATE NOT NULL,
    days_before INTEGER NOT NULL,
    email_enabled BOOLEAN DEFAULT TRUE,
    in_app_enabled BOOLEAN DEFAULT TRUE,
    push_enabled BOOLEAN DEFAULT FALSE,
    email_sent BOOLEAN DEFAULT FALSE,
    notification_created BOOLEAN DEFAULT FALSE,
    is_cancelled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_reminder_event UNIQUE (application_id, timeline_event_id, reminder_date, days_before)
);

-- Row Level Security (RLS) for reminders
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reminders"
    ON public.reminders FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reminders"
    ON public.reminders FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reminders"
    ON public.reminders FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reminders"
    ON public.reminders FOR DELETE
    USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON public.reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_app_id ON public.reminders(application_id);
CREATE INDEX IF NOT EXISTS idx_reminders_reminder_date ON public.reminders(reminder_date);
CREATE INDEX IF NOT EXISTS idx_reminders_event_date ON public.reminders(event_date);
CREATE INDEX IF NOT EXISTS idx_reminders_status ON public.reminders(is_cancelled, reminder_date);

-- ---------------------------------------------------------------------
-- 5. NOTIFICATION PREFERENCES TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    default_days_before INTEGER[] DEFAULT '{2,1}',
    email_enabled BOOLEAN DEFAULT TRUE,
    in_app_enabled BOOLEAN DEFAULT TRUE,
    push_enabled BOOLEAN DEFAULT FALSE,
    timezone TEXT DEFAULT 'Asia/Kolkata',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS) for notification_preferences
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their notification preferences"
    ON public.notification_preferences FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their notification preferences"
    ON public.notification_preferences FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their notification preferences"
    ON public.notification_preferences FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- 6. SERVER-SIDE SCHEDULER: DAILY REMINDER PROCESSOR (Asia/Kolkata)
-- ---------------------------------------------------------------------
-- This function processes active reminders for today in the Asia/Kolkata timezone.
CREATE OR REPLACE FUNCTION public.process_daily_reminders()
RETURNS TABLE (
    reminders_processed INTEGER,
    notifications_created INTEGER,
    emails_queued INTEGER
) AS $$
DECLARE
    today_kolkata DATE;
    v_processed INTEGER := 0;
    v_notifs INTEGER := 0;
    v_emails INTEGER := 0;
    r RECORD;
BEGIN
    -- Get current date in Asia/Kolkata
    today_kolkata := (NOW() AT TIME ZONE 'Asia/Kolkata')::DATE;

    FOR r IN
        SELECT rem.*, app.company_name, app.job_title, prof.email as user_email, prof.full_name as user_name
        FROM public.reminders rem
        JOIN public.applications app ON rem.application_id = app.id
        LEFT JOIN public.profiles prof ON rem.user_id = prof.user_id
        WHERE rem.reminder_date = today_kolkata
          AND rem.is_cancelled = FALSE
          AND (rem.notification_created = FALSE OR rem.email_sent = FALSE)
    LOOP
        v_processed := v_processed + 1;

        -- Mark in-app notification created
        IF r.in_app_enabled AND NOT r.notification_created THEN
            UPDATE public.reminders
            SET notification_created = TRUE, updated_at = NOW()
            WHERE id = r.id;
            v_notifs := v_notifs + 1;
        END IF;

        -- Mark email queued/sent
        IF r.email_enabled AND NOT r.email_sent THEN
            UPDATE public.reminders
            SET email_sent = TRUE, updated_at = NOW()
            WHERE id = r.id;
            v_emails := v_emails + 1;
        END IF;
    END LOOP;

    RETURN QUERY SELECT v_processed, v_notifs, v_emails;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- To run daily at 00:01 AM Asia/Kolkata using pg_cron (Supabase cron extension):
-- SELECT cron.schedule(
--   'process-daily-reminders',
--   '1 18 * * *', -- 18:01 UTC = 23:31 / 00:01 IST
--   $$SELECT public.process_daily_reminders();$$
-- );

-- ---------------------------------------------------------------------
-- 4. TRIGGER: AUTO-CREATE PROFILE ON USER SIGNUP
-- ---------------------------------------------------------------------
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
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------
-- 5. SUPABASE STORAGE BUCKETS & POLICIES
-- ---------------------------------------------------------------------
-- Storage buckets required:
-- 1) 'resumes' (Private)
-- 2) 'profile-photos' (Public or Authenticated)

INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-photos', 'profile-photos', true)
ON CONFLICT (id) DO NOTHING;

-- RLS for 'resumes' storage
-- Objects path structure: resumes/{user_id}/{application_id}/{filename}
CREATE POLICY "Users can upload their own resumes"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'resumes' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can view and download their own resumes"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'resumes' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can update their own resumes"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'resumes' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can delete their own resumes"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'resumes' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- RLS for 'profile-photos' storage
-- Objects path structure: profile-photos/{user_id}/profile-photo
CREATE POLICY "Users can upload their own profile photo"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'profile-photos' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Anyone can view profile photos"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'profile-photos');

CREATE POLICY "Users can update their own profile photo"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'profile-photos' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can delete their own profile photo"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'profile-photos' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );
