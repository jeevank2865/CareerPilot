# Job & Internship Tracker — Android Production Guide

This guide details how to build, run, test, and release the **Job & Internship Tracker** as a native Android application using Capacitor while keeping 100% of the existing web application and Supabase backend intact.

---

## 1. Project Overview & Architecture

- **App Name:** Job & Internship Tracker
- **Android Package Name (Application ID):** `com.jobinternship.tracker`
- **Native Platform:** Capacitor Android (`@capacitor/android` v8.x)
- **Shared Backend:** Supabase (Auth, PostgreSQL DB, Storage `resumes` bucket, Row Level Security)
- **Deep Link URL Scheme:** `com.jobinternship.tracker://`

```
project/
├── src/                    # Shared React + TypeScript source code
├── public/                 # Static web assets
├── dist/                   # Production web build (synced into Android)
├── capacitor.config.ts     # Capacitor configuration
├── android/                # Native Android Gradle Project
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── AndroidManifest.xml   # Permissions, deep links, theme
│   │   │   ├── assets/public/       # Packaged production web assets
│   │   │   ├── java/                # Native MainActivity
│   │   │   └── res/                 # App icons, splash screens, colors, strings
│   │   └── build.gradle
│   ├── build.gradle
│   └── gradlew
└── package.json
```

---

## 2. Supabase Configuration for Android

Your existing Supabase project works out-of-the-box for both the website and Android app. To ensure authentication callbacks (e.g., password reset, magic links) work on Android devices:

1. Open your **Supabase Dashboard** -> **Authentication** -> **URL Configuration**.
2. Under **Redirect URLs**, add:
   - `com.jobinternship.tracker://*`
   - `http://localhost:3000` (for web development)
   - `https://your-domain.com` (for production web)
3. Save changes.

---

## 3. How to Open & Run in Android Studio

### Prerequisites:
- [Android Studio Iguana / Ladybug or newer](https://developer.android.com/studio)
- Android SDK (API 34 or newer)
- Java 17 or Java 21 JDK

### Step-by-Step:
1. Whenever you make web code changes in `src/`, compile and sync them to Android:
   ```bash
   npm run build
   npx cap sync android
   ```
2. Open the Android project in Android Studio:
   ```bash
   npx cap open android
   ```
   *(Alternatively, open Android Studio -> File -> Open -> select the `android` folder).*
3. Wait for Gradle to finish indexing and syncing dependencies.
4. Connect an Android phone (with USB debugging enabled) or start an Android Emulator.
5. Click the green **Run (▶)** button in Android Studio to install and run the app.

---

## 4. Building the Debug APK (For Testing)

To build a standalone `.apk` for testing on your phone:

### Via Android Studio:
1. In Android Studio, go to **Build** -> **Build Bundle(s) / APK(s)** -> **Build APK(s)**.
2. When finished, click **locate** in the popup.
3. The APK will be located at:
   ```
   android/app/build/outputs/apk/debug/app-debug.apk
   ```

### Via Terminal / Command Line:
```bash
cd android
./gradlew assembleDebug
```
Copy `app-debug.apk` to any Android phone and install it directly!

---

## 5. Building the Production Release APK / AAB (For Google Play)

### Step 1: Generate a Release Keystore (if you do not have one):
```bash
keytool -genkey -v -keystore my-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias my-key-alias
```

### Step 2: Build Signed Android App Bundle (AAB):
1. In Android Studio, go to **Build** -> **Generate Signed Bundle / APK...**
2. Select **Android App Bundle** (required by Google Play Store).
3. Choose your `my-release-key.jks` keystore and enter your credentials.
4. Select `release` build variant.
5. Click **Finish**.
6. The bundle file (`app-release.aab`) will be generated at:
   ```
   android/app/build/outputs/bundle/release/app-release.aab
   ```

---

## 6. Android Native Features Implemented

| Feature | Implementation | Behavior |
|---|---|---|
| **Android Back Button** | `@capacitor/app` listener in `src/App.tsx` | Closes modals if open; returns from detail view to list; returns to Dashboard; exits on root. |
| **Offline Detection** | `@capacitor/network` in `src/lib/capacitor.ts` | Displays user-friendly alert when internet is lost and resumes on reconnect. |
| **Status Bar & Splash** | `@capacitor/status-bar` & `@capacitor/splash-screen` | Dark status bar (`#1e3a8a`), auto-hiding splash screen matching app palette. |
| **Native CSV Sharing** | `@capacitor/share` & `@capacitor/filesystem` | On Android, generates the CSV and opens the native Android Share/Save sheet. On web, uses standard browser download. |
| **Deep Linking** | `com.jobinternship.tracker` in `AndroidManifest.xml` | Handles auth confirmation and password recovery redirects back into the app. |
| **Multi-User Security** | Supabase RLS | User isolation enforced strictly at the database layer; users only see their own applications and files. |
