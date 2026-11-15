# DARK ACADEMIA — Commercial App Store & Google Play Publishing Kit

## 1. Application Identifiers
- **App Name**: DARK ACADEMIA
- **Subtitle / Short Description**: Discipline is the architecture of knowledge.
- **Category**: Education / Productivity
- **Android Application ID**: `com.darkacademia.study`
- **iOS Bundle Identifier**: `com.darkacademia.study`
- **Minimum Targets**: Android 8.0 (API 26+) · iOS 15.0+

## 2. Store Listing Copy

### Short Description (80 chars max — Google Play)
Scholarly study planner, focus timer, notes library, backlog rescue & exam prep.

### Full Description (Google Play & Apple App Store)
**DARK ACADEMIA** is a serene, disciplined study sanctum crafted for high-school students, university scholars, and independent learners.

Step away from noisy, neon productivity trackers into an atmosphere of quiet rigor—warm parchment typography, deep midnight walnut surfaces, and tools engineered to turn overwhelming syllabi into calm daily mastery.

**KEY CAPABILITIES**
- **Home Sanctum Dashboard**: Track daily study goals, earned XP, academic rank progression, study streaks, weekly productivity charts, upcoming exams, and daily missions at a glance.
- **Personal Library**: Organize subjects and chapters, mark completion, flag challenging topics, and store structured study notes and formulas with instant search and filtering.
- **Focus Room**: Customizable Pomodoro and deep-work sessions, short and long breaks, session history, and offline Web Audio ambient soundscapes (Library Rain, Crackling Hearth, Quiet Archive, 40Hz Binaural Hum).
- **Mission Board**: Daily academic challenges, custom missions, and scholarly achievement badges with anti-duplicate XP safeguards.
- **Backlog Rescue**: Capture unfinished chapters, assign deadlines and priority tiers, break work into small micro-tasks, and generate realistic daily revision schedules.
- **Boss Battle Quizzes**: Timed chapter quizzes with immediate scholarly explanations, score history, and automated weak-topic analysis that routes weak areas straight into Backlog Rescue.
- **Progress Vault**: Daily and monthly study-hour analytics, chapter completion rates, quiz performance trends, and streak records.
- **ADHD-Friendly Mode**: One-task-at-a-time calm view, flexible 10–20 minute micro-sprints, gentle break suggestions, and zero punishment for missed days.
- **Exam Countdown**: Track exam dates, syllabus completion units, and calculated daily revision targets.

**FREEMIUM & SUBSCRIPTIONS**
- **Free Plan**: Basic focus timer, subject & chapter tracking, daily missions, core progress dashboard, and introductory quizzes.
- **Premium Plan ($6.99/month or $49.99/year with 7-day free trial)**: Unlimited study notes, unlimited custom quizzes & weak-topic diagnostics, advanced analytics & revision schedules, and exclusive Candlelit Walnut & Bodleian Slate themes.

## 3. Required Billing & Store Credentials Before Production Release
1. **Web / PWA (Stripe)**:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_PRICE_MONTHLY`
   - `STRIPE_PRICE_ANNUAL`
   - `STRIPE_WEBHOOK_SECRET`
2. **Google Play Console (Android App Bundle `.aab`)**:
   - Create subscription IDs `dark_academia_premium_monthly` and `dark_academia_premium_annual` in Play Console Monetize.
   - Sign `.aab` with Upload Key (`keytool` + Play App Signing enabled).
3. **Apple App Store Connect (iOS `.ipa`)**:
   - Configure In-App Purchase Auto-Renewable Subscriptions (`dark_academia_premium_monthly`, `dark_academia_premium_annual`) under a single Subscription Group.
   - Include working **Restore Purchases** button (already implemented in Profile & Subscription modal) and direct **Account Deletion** (Apple Review Guideline 5.1.1(v) — already implemented in Profile).

## 4. Production Build & Release Commands
```bash
# 1. Build web bundle & PWA assets
npm run build

# 2. Wrap into Android AAB & iOS IPA with Capacitor
npx cap add android
npx cap add ios
npx cap sync

# 3. Android Release Bundle (.aab)
cd android && ./gradlew bundleRelease

# 4. iOS Release Archive (.ipa)
npx cap open ios # Archive & Distribute in Xcode
```

## 5. App Store Compliance Checklist
- [x] **Minimal Permissions**: Only optional local/browser notification permission requested upon explicit user toggle. Zero camera, microphone, contacts, or location requests.
- [x] **In-App Account & Data Deletion**: Full Firestore user subcollection purge + Firebase Auth deletion implemented.
- [x] **Privacy Policy & Terms of Service**: Accessible both before sign-in and inside User Profile.
- [x] **Restore Purchases**: Available in Subscription Management view.
- [x] **Icons & Splash Screens**: `public/pwa-192x192.png`, `public/pwa-512x512.png`, `public/pwa-maskable-512x512.png`, `public/apple-touch-icon.png`.
