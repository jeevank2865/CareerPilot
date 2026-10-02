# 💼 Job & Internship Tracker

A modern, full-featured career application management system designed to track jobs, internships, interview rounds, assessments, deadlines, notes, and resumes with automated multi-stage reminders and analytics.

## 🚀 Live Demo

👉 **[Try Job & Internship Tracker](https://ais-pre-cnicwgfalokv3lgttj4tko-705269896616.asia-southeast1.run.app)**

Explore the live application and manage your complete job and internship application journey in one place.

## 🌟 Key Features

- **Multi-Type Tracking:** Track both **Full-time Jobs** and **Internships** with dedicated fields (Title, Company, Location, Date Applied, Job Description, Salary/Stipend, URLs).
- **11-Stage Recruitment Pipeline:**
  1. Applied
  2. Application Viewed
  3. Shortlisted
  4. Online Assessment
  5. Technical Interview
  6. HR Interview
  7. Final Interview
  8. Offer Received
  9. Selected
  10. Rejected
  11. Withdrawn
- **Interactive Stage Stepper & Transition Modal:** One-click stage progression with milestone target dates, notes, and automatic reminder scheduling.
- **Universal Multi-Stage Reminders:**
  - Automated alerts scheduled **2 days before**, **1 day before**, and **on the event day** for any recruitment milestone (Assessments, Technical/HR Rounds, Deadlines, Follow-ups, Custom Tasks).
  - Multi-channel delivery: **In-App Bell Alerts**, **Google Calendar 1-click sync**, **1-click Email Drafts**, and **Device Push Notifications** (Web Push & Android PWA).
- **Universal Calendar & Follow-up Agenda:** Filterable agenda with categories (Assessments, Technical, HR/Final, Deadlines, Follow-ups, Custom Tasks).
- **Resume Management:** Upload and manage PDF, DOC, and DOCX resumes with secure storage isolation and download capabilities.
- **Learning & Interview Notes:** Document key takeaways ("What I Learned"), interviewer feedback, and round-specific notes.
- **Visual Analytics & KPI Dashboard:** Real-time metrics for total applications, active interviews, conversion rates, stage breakdown charts, and urgent follow-up notifications.
- **Multi-View Application Explorer:** Kanban board, table list, and grid view with real-time multi-field search (company, title, location, notes) and multi-level filtering.
- **Multi-Tenant Security (Row Level Security - RLS):** Strict PostgreSQL RLS policies guarantee each user only accesses their own applications, resumes, timeline events, and reminders.
- **CSV Data Export:** One-click CSV export of user data.
- **PWA & Android Ready:** Installable as a Progressive Web App (PWA) and packaged with Capacitor for native Android deployment.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | React 19 (Functional components, Hooks, Context API) |
| **Language & Typings** | TypeScript (Strict type definitions across all models) |
| **Build Tool & Bundler** | Vite 8 + `@vitejs/plugin-react` |
| **Styling & UI** | Tailwind CSS v4 + `@tailwindcss/vite` |
| **Icons & UI FX** | Lucide React, Canvas Confetti |
| **Database & Auth** | Supabase (PostgreSQL, Supabase Auth, Row Level Security) |
| **File Storage** | Supabase Storage (`resumes` & `profile-photos` buckets) |
| **Mobile & PWA** | Capacitor 8 (Android), Web Manifest, Service Worker |

---

## 📁 Project Architecture

```
├── .env.example               # Environment variable templates
├── .gitignore                 # Git ignore rules for node, dist, and secrets
├── ANDROID_GUIDE.md           # Android APK build and Capacitor documentation
├── android/                   # Native Android project configuration (Capacitor)
├── capacitor.config.ts        # Capacitor native app configuration
├── index.html                 # HTML entry point with PWA meta tags & fonts
├── package.json               # Dependencies and scripts
├── public/                    # Static assets, icons, manifest.json, sw.js
├── scripts/                   # Helper build scripts (icon generator)
├── src/
│   ├── components/
│   │   ├── AddCustomReminderModal.tsx   # Standalone custom reminder modal
│   │   ├── AddEditApplicationModal.tsx  # 4-Tab application creation/edit modal
│   │   ├── AnalyticsView.tsx            # Visual analytics & conversion charts
│   │   ├── ApplicationDetailView.tsx    # Detailed view with timeline & stage stepper
│   │   ├── ApplicationsView.tsx         # Kanban board, Table, and Grid explorer
│   │   ├── AuthView.tsx                 # Sign In, Sign Up, & Password Recovery
│   │   ├── DashboardView.tsx            # Metric cards, upcoming tasks, & urgent alerts
│   │   ├── ErrorBoundary.tsx            # App-level crash recovery boundary
│   │   ├── FollowUpsView.tsx            # Universal calendar & reminder management
│   │   ├── Navbar.tsx                   # Top navigation with live reminder bell
│   │   ├── NotificationCenterDropdown.tsx# Notification popover with status badges
│   │   ├── ProfileSettingsView.tsx      # User profile, photo upload, & reminder prefs
│   │   ├── Sidebar.tsx                  # Collapsible desktop sidebar navigation
│   │   ├── StageStepper.tsx             # Interactive pipeline step indicator
│   │   ├── StatusBadge.tsx              # Color-coded application status chips
│   │   ├── SupabaseSetupModal.tsx       # Built-in SQL setup runner & instructions
│   │   └── ToastContainer.tsx           # Global notification toast system
│   ├── context/
│   │   ├── ApplicationContext.tsx       # Applications, reminders, & task state
│   │   └── AuthContext.tsx              # Supabase session, profile, & demo fallback
│   ├── hooks/
│   │   └── usePWAInstall.ts             # PWA install prompt handler
│   ├── lib/
│   │   ├── capacitor.ts                 # Capacitor status bar, back button, network
│   │   ├── notificationService.ts       # Web Push & Device notification service
│   │   ├── reminderService.ts           # Universal reminder engine & date calculations
│   │   └── supabase.ts                  # Supabase client, storage, & local offline fallback
│   ├── types/
│   │   └── database.ts                  # Type definitions for applications, reminders, etc.
│   ├── App.tsx                          # Root application layout & route switcher
│   ├── index.css                        # Tailwind CSS imports & global design tokens
│   └── main.tsx                         # React entry point with service worker registration
├── tsconfig.json              # TypeScript compiler configuration
└── vite.config.ts             # Vite configuration
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm** or **bun** / **yarn** / **pnpm**

### Installation

1. **Clone the repository:**
   ```bash
   git clone <YOUR_GITHUB_REPOSITORY_URL>
   cd job-internship-tracker
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy the `.env.example` template:
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your Supabase credentials (optional — the app includes an interactive demo mode if credentials are not provided):
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🗄️ Database & Supabase Setup

To use live cloud persistence and authentication with Supabase:

1. Create a project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in your Supabase dashboard.
3. Run the following schema script to create the tables, indexes, and Row Level Security (RLS) policies:

```sql
-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. APPLICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    application_type TEXT NOT NULL DEFAULT 'Job' CHECK (application_type IN ('Job', 'Internship', 'Other')),
    job_title TEXT NOT NULL,
    company_name TEXT NOT NULL,
    location TEXT,
    date_applied DATE DEFAULT CURRENT_DATE,
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
    resume_file_size INTEGER,
    resume_uploaded_at TIMESTAMP WITH TIME ZONE,
    offered_salary TEXT,
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_date DATE,
    follow_up_notes TEXT,
    additional_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own applications" ON public.applications
    FOR ALL USING (auth.uid() = user_id);

-- 3. APPLICATION TIMELINE TABLE
CREATE TABLE IF NOT EXISTS public.application_timeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    event_title TEXT NOT NULL,
    event_description TEXT,
    event_date DATE NOT NULL,
    event_time TEXT,
    reminder_enabled BOOLEAN DEFAULT TRUE,
    custom_reminder_days INTEGER[] DEFAULT ARRAY[2, 1],
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.application_timeline ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own timeline" ON public.application_timeline
    FOR ALL USING (auth.uid() = user_id);

-- 4. REMINDERS TABLE (Universal Multi-Stage Reminders)
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
    days_before INTEGER NOT NULL,
    email_enabled BOOLEAN DEFAULT TRUE,
    in_app_enabled BOOLEAN DEFAULT TRUE,
    push_enabled BOOLEAN DEFAULT FALSE,
    email_sent BOOLEAN DEFAULT FALSE,
    notification_created BOOLEAN DEFAULT FALSE,
    is_cancelled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own reminders" ON public.reminders
    FOR ALL USING (auth.uid() = user_id);

-- 5. NOTIFICATION PREFERENCES TABLE
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    default_days_before INTEGER[] DEFAULT ARRAY[2, 1],
    email_enabled BOOLEAN DEFAULT TRUE,
    in_app_enabled BOOLEAN DEFAULT TRUE,
    push_enabled BOOLEAN DEFAULT FALSE,
    timezone TEXT DEFAULT 'Asia/Kolkata',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own notification preferences" ON public.notification_preferences
    FOR ALL USING (auth.uid() = user_id);
```

4. **Create Supabase Storage Buckets:**
   - Create a private bucket named `resumes`.
   - Create a public bucket named `profile-photos` (or `avatars`).

---

## 📱 Android & PWA Build

### PWA Installation
- Open the application in Chrome (Android) or Safari (iOS).
- Tap **"Install App"** in the top navigation or use browser settings **"Add to Home Screen"**.

### Native Android Build (Capacitor)
```bash
# 1. Build web distribution
npm run build

# 2. Sync web assets with Android project
npx cap sync android

# 3. Open in Android Studio to build APK
npx cap open android
```

---

## 🔒 Security & Privacy

- **No Hardcoded Secrets:** All credentials are kept in environment variables or client-side storage per session.
- **Row Level Security (RLS):** Database queries are guarded at the database level by PostgreSQL policies (`auth.uid() = user_id`).
- **File Storage Isolation:** Resume uploads use user-specific path namespacing (`{userId}/{applicationId}/{filename}`).

---

## 📜 License

This project is open source and available under the [MIT License](LICENSE).
