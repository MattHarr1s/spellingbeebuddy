# Spelling Bee Buddy — Business Plan

**Version**: 1.0
**Date**: February 2026
**Product**: Spelling Bee Buddy — Interactive Study App for the 2026 National Spanish Spelling Bee
**URL**: spellingbeebuddy.netlify.app (staging)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Monetization Strategy](#2-monetization-strategy)
3. [Technical Requirements](#3-technical-requirements)
4. [Launch Checklist](#4-launch-checklist)
5. [Growth Strategy](#5-growth-strategy)
6. [Revenue Projections](#6-revenue-projections)
7. [Competitive Analysis](#7-competitive-analysis)
8. [Product Roadmap](#8-product-roadmap)

---

## 1. Executive Summary

### What Is Spelling Bee Buddy?

Spelling Bee Buddy is a free, web-based study app purpose-built for the **National Spanish Spelling Bee (NSSB)**. It contains all **1,070 official competition words** organized into 14 spelling-challenge categories, with 4 study modes that mirror the real competition format. The app features bilingual definitions (English and Spanish), adjustable voice speed, and a special character toolbar for accents, tildes, and dieresis marks.

The NSSB is the largest Spanish spelling competition in the United States, drawing students in grades 4-8 from across the country. The 2026 national finals take place July 10-11 in Albuquerque, NM.

### Target Market

| Segment | Size Estimate | Description |
|---|---|---|
| **Primary: Students** | ~50,000-100,000 | Grades 4-8 actively preparing for local, regional, or national NSSB rounds |
| **Secondary: Parents** | ~100,000-200,000 | Parents of competing students seeking structured practice tools |
| **Tertiary: Spanish Teachers** | ~15,000-30,000 | Teachers running classroom spelling bee programs or dual-language curricula |
| **Emerging: Heritage Speakers** | Millions | Spanish-heritage students looking to formalize their spelling skills |

### The Problem

Students preparing for the NSSB have limited study tools:
- The official word list is distributed as a **static PDF booklet** with no interactive features
- No app exists with **all official competition words** in a practice format
- Parents and teachers have no way to track student progress or assign targeted practice
- Existing Spanish vocabulary apps (Duolingo, Quizlet) are not designed for spelling bee competition rules

### The Opportunity

- **Zero direct competition**: No app currently covers the NSSB word list with competition-format practice
- **Captive annual cycle**: The NSSB season runs October-July, creating a reliable annual engagement window
- **Growing market**: NSSB participation increases year-over-year as dual-language programs expand nationally
- **Low cost to serve**: Static web app with no backend means near-zero marginal cost per user

---

## 2. Monetization Strategy

### 2.1 Freemium Model Overview

The core study experience remains **free forever**. Monetization comes from two streams: advertising (free tier) and premium subscriptions (paid tier).

```
Free Tier (with ads)          Premium Tier (no ads)
-----------------------       -------------------------
All 1,070 words               All 1,070 words
All 4 study modes             All 4 study modes
5 rounds per day limit        Unlimited rounds
Basic progress (current       Full progress analytics
  session only)                 (historical data)
Standard voice                Priority voice selection
                              Teacher/parent dashboard
                              Head-to-head multiplayer
                              Custom word lists
                              Offline PDF exports
                              Ad-free experience
```

### 2.2 Ad Placement Strategy (Google AdSense)

**Core Principle**: Ads must NEVER interrupt active study or spelling. Students are in a focused learning state and interruptions degrade both the experience and learning outcomes.

| Placement | Format | Location | Frequency |
|---|---|---|---|
| **Menu Banner** | 320x50 or 728x90 responsive | Bottom of main menu screen | Always visible on menu |
| **Interstitial** | Full-screen interstitial | Between quiz rounds (transition screen) | Max 1 per 5 completed rounds |
| **Category Card** | Native ad card | Mixed into category selection list | 1 native ad per category list view |
| **Results Screen** | 300x250 medium rectangle | Below score summary after completing a round | After each round completion |

**Prohibited Placements** (never place ads here):
- During active spelling input (Listen & Spell, Type to Spell)
- On flashcard study screens
- Over the special character toolbar
- During audio playback
- As pop-ups or overlays during any study mode

**Expected Revenue**: $1-3 eCPM for education-category display ads. At 10,000 DAU with 3 ad impressions per session = $30-90/day = **$900-2,700/month** at scale.

### 2.3 Subscription Tiers

| Plan | Price | Billing | Target User | Key Value Prop |
|---|---|---|---|---|
| **Free** | $0 | N/A | Casual students | Full word list, 5 rounds/day, with ads |
| **Monthly Premium** | $4.99/mo | Monthly | Serious competitors | Unlimited practice, no ads, progress tracking |
| **Annual Premium** | $29.99/yr | Annual ($2.50/mo effective) | Committed students | Best individual value, full year coverage |
| **Family Plan** | $49.99/yr | Annual | Families with multiple children | Up to 5 student profiles, shared dashboard |
| **Teacher Plan** | $99.99/yr | Annual | Classroom teachers | Up to 30 student accounts, assignment tools, class analytics |

**Pricing Rationale**:
- Monthly is priced to encourage annual conversion (annual saves 50%)
- Family plan is priced at ~$10/student/year, below the impulse threshold for parents
- Teacher plan at ~$3.33/student/year is trivially inexpensive for school budgets and PTA fundraising
- All tiers undercut Quizlet Plus ($7.99/mo) and comparable education subscriptions

### 2.4 Premium Features Detail

**Unlimited Practice Sessions**
- Free tier: 5 rounds per day across all modes (resets at midnight local time)
- Premium: No limit on rounds, modes, or time

**Advanced Progress Analytics Dashboard**
- Historical accuracy by word, category, and mode
- Mastery level per word (New / Learning / Reviewing / Mastered)
- Weakest category identification with targeted practice suggestions
- Streak tracking and study time logging
- Exportable progress reports (PDF)

**Teacher/Parent Dashboard**
- View all connected student accounts
- Assign specific categories or word lists for practice
- View per-student progress, accuracy trends, and time spent
- Class-level analytics (average scores, most-missed words)
- Send encouragement notifications

**Head-to-Head Multiplayer**
- Real-time spelling competition between two students
- Matchmaking by grade level or skill rating
- Leaderboards (weekly, monthly, all-time)
- Practice mode (no ranking impact) and ranked mode

**Custom Word Lists**
- Create personal lists from the master 1,070 words
- Import/export word lists
- Share lists with other students or classrooms
- "Missed Words" auto-list from practice sessions

**Offline PDF Exports**
- Print-ready word lists by category
- Flashcard-format PDFs for offline study
- Progress summary reports for parent-teacher conferences

**Priority Voice Selection**
- Choose from all available Spanish voices on device
- Adjustable pitch, rate, and volume controls
- Voice preview before selection

---

## 3. Technical Requirements

### 3.1 Current Architecture

```
Vite + React (single-file App.jsx)
├── No backend / No auth
├── No database
├── Static deployment (Netlify)
├── Web Speech API for audio
└── All state in React hooks (no persistence)
```

### 3.2 Required Infrastructure by Feature

#### Authentication System (Required for: Premium, Dashboard, Multiplayer)

| Component | Recommendation | Rationale |
|---|---|---|
| **Auth Provider** | Firebase Authentication or Supabase Auth | Free tier covers initial scale; Google/email sign-in; SDKs for React |
| **User Database** | Firestore or Supabase Postgres | Store user profiles, subscription status, preferences |
| **Session Management** | Firebase SDK / Supabase client | Handles token refresh, session persistence |

**Build Estimate**: 2-3 weeks for auth flow, user profiles, protected routes

#### Payment Processing (Required for: Subscriptions)

| Component | Recommendation | Rationale |
|---|---|---|
| **Payment Gateway** | Stripe | Industry standard; supports subscriptions, family plans, education discounts |
| **Subscription Management** | Stripe Billing | Handles recurring charges, plan changes, cancellations |
| **Webhook Handler** | Netlify Functions or Cloudflare Workers | Process subscription events (payment success, cancellation, renewal) |
| **Entitlement Check** | Client-side + server-side validation | Check subscription status on app load and for premium features |

**Build Estimate**: 2-3 weeks for Stripe integration, subscription lifecycle, entitlement gating

#### Progress Tracking (Required for: Analytics Dashboard, Spaced Repetition)

| Component | Recommendation | Rationale |
|---|---|---|
| **Data Store** | Firestore or Supabase | Store per-word attempt history, scores, timestamps |
| **Local Cache** | localStorage + IndexedDB | Offline-capable progress tracking, sync when online |
| **Analytics Engine** | Client-side computation | Calculate mastery levels, trends, category performance |
| **Spaced Repetition** | SM-2 algorithm (client-side) | Schedule word review based on accuracy history |

**Data Schema**:
```
users/{userId}/
  profile: { name, grade, school, plan, createdAt }
  progress/{wordId}: { attempts, correct, lastSeen, nextReview, mastery }
  sessions/: { date, mode, category, score, duration, wordsAttempted[] }
  settings: { voicePreference, darkMode, dailyGoal }
```

**Build Estimate**: 3-4 weeks for progress system, analytics computation, sync logic

#### Teacher/Parent Dashboard (Required for: Teacher Plan, Family Plan)

| Component | Recommendation | Rationale |
|---|---|---|
| **Role System** | Custom claims in Firebase/Supabase | Roles: student, parent, teacher, admin |
| **Relationship Model** | parent-student / teacher-classroom linking | One parent links to multiple students; one teacher to one classroom |
| **Dashboard UI** | Separate routes within the React app | /dashboard/teacher, /dashboard/parent |
| **Notifications** | Firebase Cloud Messaging or email (SendGrid) | Assignment notifications, progress milestones |

**Build Estimate**: 4-5 weeks for role system, dashboard UI, assignment features, notifications

#### Head-to-Head Multiplayer (Required for: Premium Multiplayer)

| Component | Recommendation | Rationale |
|---|---|---|
| **Real-time Communication** | Firebase Realtime Database or Supabase Realtime | Low-latency sync for competitive spelling |
| **Matchmaking** | Serverless function (Netlify/Cloudflare) | Match by grade level, skill rating, queue management |
| **Game State** | Shared real-time document | Both players see same word, race to spell correctly |
| **Leaderboard** | Firestore collection with composite indexes | Weekly/monthly/all-time rankings |

**Build Estimate**: 4-6 weeks for matchmaking, real-time game loop, leaderboards

#### Ad Integration (Required for: Free Tier Revenue)

| Component | Recommendation | Rationale |
|---|---|---|
| **Ad Network** | Google AdSense | Largest fill rates; education-category targeting |
| **Ad Component** | Custom React wrapper | Controls placement, frequency capping, premium user exclusion |
| **Consent Management** | Cookie consent banner (GDPR/COPPA) | Required for under-13 users; parental consent flow |

**COPPA Compliance Note**: Since users are ages 8-14, the app must comply with COPPA:
- Parental consent required for ad personalization for users under 13
- Option for non-personalized ads (contextual only)
- Clear privacy policy accessible from all screens
- No collection of personal data from children without verifiable parental consent

**Build Estimate**: 1-2 weeks for ad integration; 2-3 weeks for COPPA compliance

#### PWA / Offline Support (Required for: Mobile App Store, Offline Use)

| Component | Recommendation | Rationale |
|---|---|---|
| **Service Worker** | Workbox (via Vite PWA plugin) | Cache word data, app shell, and assets for offline use |
| **Manifest** | Web App Manifest | Install prompt, app icon, splash screen |
| **Offline Sync** | Background Sync API | Queue progress updates for when connectivity returns |

**Build Estimate**: 1-2 weeks for PWA setup, offline caching, sync

### 3.3 Infrastructure Cost Estimates (Monthly)

| Service | Free Tier Limit | Estimated Cost at 10K MAU | At 50K MAU |
|---|---|---|---|
| **Netlify Hosting** | 100GB bandwidth | $0 | $19/mo (Pro) |
| **Firebase/Supabase** | 50K reads/day (Firestore) | $0-25/mo | $50-100/mo |
| **Stripe** | 2.9% + $0.30 per transaction | ~$15-50/mo | ~$75-250/mo |
| **SendGrid (email)** | 100 emails/day free | $0 | $20/mo |
| **Domain + SSL** | Included with Netlify | $12/yr | $12/yr |
| **Total** | | **$15-75/mo** | **$165-390/mo** |

---

## 4. Launch Checklist

### 4.1 Pre-Launch (Weeks 1-4)

#### SEO Optimization
- [ ] Register custom domain (spellingbeebuddy.com or similar)
- [ ] Add comprehensive `<meta>` tags: title, description, keywords, Open Graph, Twitter Cards
- [ ] Create `robots.txt` and `sitemap.xml`
- [ ] Target keywords: "Spanish spelling bee practice", "NSSB study guide", "National Spanish Spelling Bee words", "concurso de deletreo practice"
- [ ] Add structured data (JSON-LD) for educational application schema
- [ ] Ensure Core Web Vitals pass (LCP < 2.5s, CLS < 0.1, FID < 100ms)
- [ ] Create landing page with keyword-rich content explaining the app

#### Legal & Compliance
- [ ] Draft and publish Privacy Policy (COPPA-compliant)
- [ ] Draft and publish Terms of Service
- [ ] Implement cookie consent banner
- [ ] Verify COPPA parental consent flow (if collecting data from under-13)
- [ ] Review NSSB trademark usage guidelines -- do not use "National Spanish Spelling Bee" in the app name without permission

#### Analytics Setup
- [ ] Integrate Google Analytics 4 (or privacy-friendly alternative like Plausible)
- [ ] Set up conversion events: app_open, mode_start, round_complete, signup, subscription
- [ ] Configure funnel tracking: visit -> try free -> signup -> subscribe

### 4.2 Launch Week

#### Distribution
- [ ] Deploy to production on Netlify with custom domain
- [ ] Submit to Google Search Console
- [ ] Submit PWA to Google Play Store via TWA (Trusted Web Activity)
- [ ] Submit PWA to Microsoft Store
- [ ] List on Product Hunt (schedule for Tuesday morning launch)
- [ ] List on AlternativeTo, Slant, and education app directories

#### Social Media Presence
- [ ] Create Instagram account (@spellingbeebuddy)
- [ ] Create TikTok account (@spellingbeebuddy)
- [ ] Create Facebook page (target parent groups)
- [ ] Create X/Twitter account
- [ ] Prepare 10 launch-week posts: app demo clips, word-of-the-day, spelling tips

#### Community Outreach
- [ ] Contact NSSB organizers about potential partnership or endorsement
- [ ] Post in Spanish teacher Facebook groups (Maestros de Espanol, Dual Language Teachers)
- [ ] Post in homeschool Spanish curriculum forums
- [ ] Reach out to Spanish spelling bee coaches at state level
- [ ] Contact dual-language program coordinators at large school districts

### 4.3 Post-Launch (Weeks 5-8)

#### Paid Advertising
- [ ] Set up Google Ads campaign targeting "spanish spelling bee practice" ($5-10/day initial budget)
- [ ] Facebook/Instagram ads targeting parents of school-age children + interest in Spanish education
- [ ] Retargeting campaigns for users who visited but did not sign up

#### Content Marketing
- [ ] Publish "How to Prepare for the National Spanish Spelling Bee" blog post
- [ ] Publish "Top 50 Hardest Spanish Spelling Bee Words" listicle
- [ ] Create downloadable "NSSB Study Schedule" PDF (email capture lead magnet)
- [ ] Record 3-5 YouTube videos: spelling tips, app walkthrough, parent guide

---

## 5. Growth Strategy

### 5.1 School & District Partnerships

**Strategy**: Offer the Teacher Plan free for the first year to 50 pilot schools, then convert to paid.

**Execution**:
1. Identify the top 50 school districts by NSSB participation (data from state coordinators)
2. Email district world language coordinators with a free classroom license offer
3. Provide a "Spelling Bee Buddy Classroom Kit" -- PDF with lesson plans, usage guides, and printable word lists
4. Collect testimonials from pilot teachers for marketing
5. After pilot year, offer discounted renewal ($79.99/yr for returning schools)

**Target**: 50 pilot schools in Year 1, 200 paid schools by Year 2

### 5.2 Competition Season Marketing

The NSSB season creates a natural marketing calendar:

| Month | Event | Marketing Action |
|---|---|---|
| **October** | School year begins, bee registrations open | Back-to-school campaign, teacher outreach |
| **November-December** | Classroom-level bees | Content: "Prepare Your Classroom Bee" |
| **January-February** | School-level bees | Ramp up ads, "School Bee Prep" content |
| **March-April** | District/regional bees | Peak ad spend, "Last Chance to Qualify" |
| **May-June** | State bees, national qualifier prep | Premium conversion push, "Final Sprint" |
| **July** | National Finals (Albuquerque) | Live social coverage, champion spotlights |
| **August-September** | Off-season | Product development, testimonial collection |

**Budget Allocation**: 60% of annual ad spend concentrated in January-June

### 5.3 Referral Program

**Mechanics**:
- Every user gets a unique referral link
- When a friend signs up and completes 1 study session: **both users get 7 days of free Premium**
- Referral rewards stack up to 90 days of free Premium
- Premium subscribers who refer get an extra month added to their subscription

**Expected Impact**: Education apps see 15-25% of new users from referrals with properly incentivized programs

### 5.4 Content Marketing

**Blog Content Calendar** (2 posts per month):
- "X Hardest Words in the 2026 NSSB" series (one per category)
- "Spelling Bee Tips from Champions" interview series
- "Why Spanish Spelling Bees Matter for Bilingual Education" thought leadership
- "Parent's Guide to Supporting Your Spelling Bee Student"
- "Teacher's Guide to Running a Classroom Spelling Bee"

**Video Content** (YouTube + TikTok):
- 60-second "Word of the Day" TikToks (daily during season)
- 5-minute "How to Spell [tricky word]" YouTube tutorials
- App walkthrough and tips videos
- Student testimonial compilations
- Live spelling practice sessions

### 5.5 Strategic Partnerships

| Partner Type | Value Exchange | Target Organizations |
|---|---|---|
| **NSSB Organization** | Official endorsement in exchange for free student access | National Spanish Spelling Bee organizers |
| **Dual-Language Programs** | Curriculum integration, classroom licenses | ATDLE, NABE member schools |
| **Spanish Language Publishers** | Cross-promotion, content licensing | Santillana, Vista Higher Learning |
| **Education Influencers** | Sponsored content, affiliate commissions | Bilingual educator YouTubers, teacher TikTokers |
| **PTA/PTO Groups** | Group discount codes, fundraising partnerships | Local PTA organizations in high-participation districts |

---

## 6. Revenue Projections

### 6.1 Assumptions

| Metric | Conservative | Moderate | Optimistic |
|---|---|---|---|
| **Year 1 MAU** (end of year) | 5,000 | 15,000 | 40,000 |
| **Free-to-Premium Conversion** | 3% | 5% | 8% |
| **Average Revenue Per Paying User (monthly)** | $3.50 | $4.00 | $4.50 |
| **Ad eCPM** | $1.00 | $2.00 | $3.00 |
| **Ad Impressions per Free User per Month** | 30 | 40 | 50 |
| **Monthly Churn (Premium)** | 8% | 5% | 3% |
| **Teacher Plan Adoption (schools)** | 10 | 30 | 75 |
| **Family Plan Adoption** | 25 | 75 | 200 |

### 6.2 Year 1 Revenue Projections

#### Conservative Scenario

| Revenue Stream | Calculation | Monthly (at scale) | Annual |
|---|---|---|---|
| **Premium Subscriptions** | 5,000 x 3% = 150 users x $3.50 | $525 | $6,300 |
| **Ad Revenue** | 4,850 free users x 30 impressions x $1.00 eCPM / 1000 | $146 | $1,746 |
| **Teacher Plans** | 10 x $99.99 | -- | $1,000 |
| **Family Plans** | 25 x $49.99 | -- | $1,250 |
| **Total** | | | **$10,296** |

#### Moderate Scenario

| Revenue Stream | Calculation | Monthly (at scale) | Annual |
|---|---|---|---|
| **Premium Subscriptions** | 15,000 x 5% = 750 users x $4.00 | $3,000 | $36,000 |
| **Ad Revenue** | 14,250 free users x 40 impressions x $2.00 eCPM / 1000 | $1,140 | $13,680 |
| **Teacher Plans** | 30 x $99.99 | -- | $3,000 |
| **Family Plans** | 75 x $49.99 | -- | $3,750 |
| **Total** | | | **$56,430** |

#### Optimistic Scenario

| Revenue Stream | Calculation | Monthly (at scale) | Annual |
|---|---|---|---|
| **Premium Subscriptions** | 40,000 x 8% = 3,200 users x $4.50 | $14,400 | $172,800 |
| **Ad Revenue** | 36,800 free users x 50 impressions x $3.00 eCPM / 1000 | $5,520 | $66,240 |
| **Teacher Plans** | 75 x $99.99 | -- | $7,500 |
| **Family Plans** | 200 x $49.99 | -- | $10,000 |
| **Total** | | | **$256,540** |

### 6.3 Cost Structure (Year 1)

| Expense | Monthly Estimate | Annual |
|---|---|---|
| **Hosting (Netlify Pro)** | $19 | $228 |
| **Backend (Firebase/Supabase)** | $0-100 | $0-1,200 |
| **Domain + DNS** | $1 | $12 |
| **Stripe Fees** (2.9% + $0.30) | Variable | ~3% of subscription revenue |
| **Google Ads** | $150-500 | $1,800-6,000 |
| **Social Media Ads** | $100-300 | $1,200-3,600 |
| **Design Assets** (Canva Pro) | $13 | $156 |
| **Email Service (SendGrid)** | $0-20 | $0-240 |
| **Apple Developer Account** | $8.25 | $99 |
| **Google Play Developer** | One-time $25 | $25 |
| **Total** | **~$300-1,000** | **~$3,500-12,000** |

### 6.4 Break-Even Analysis

| Scenario | Year 1 Revenue | Year 1 Costs | Net |
|---|---|---|---|
| **Conservative** | $10,296 | $5,000 | +$5,296 |
| **Moderate** | $56,430 | $8,000 | +$48,430 |
| **Optimistic** | $256,540 | $12,000 | +$244,540 |

The low infrastructure costs of a static web app mean **even the conservative scenario is profitable in Year 1**. The primary risk is user acquisition, not cost management.

---

## 7. Competitive Analysis

### 7.1 Direct Competitors

There are **no direct competitors** offering an interactive app with the full official NSSB word list. The competitive landscape consists of adjacent tools:

| Product | Type | Spanish Bee Words? | Competition Format? | Price | Weakness vs. Us |
|---|---|---|---|---|---|
| **Official NSSB PDF Booklet** | Static document | Yes (all words) | No practice tools | Free | No interactivity, no audio, no progress tracking |
| **Quizlet (user-created sets)** | Flashcards | Partial (user-uploaded) | No | Free / $7.99 mo | Incomplete word lists, no competition-format practice, no Spanish audio |
| **SpellingCity.com** | English spelling | No | English only | $5.99/mo | English only, no Spanish bee content |
| **Duolingo** | Language learning | No | Vocabulary, not spelling | Free / $7.99 mo | General Spanish learning, not spelling bee preparation |
| **Spelling Bee Ninja** | English spelling | No | English only | Free | English only |
| **SpeakAPP** | Spanish practice | No | Conversation focus | Varies | Not spelling-focused |

### 7.2 Our Differentiators

| Differentiator | Detail | Defensibility |
|---|---|---|
| **Complete Official Word List** | All 1,070 words from the 2026 NSSB booklet | Must be updated annually; first-mover advantage |
| **Competition-Format Practice** | Listen & Spell mode mimics exact competition experience | Deep understanding of NSSB rules and format |
| **14 Spelling-Challenge Categories** | Words organized by the type of spelling difficulty, not just alphabetically | Pedagogically designed category system |
| **Bilingual Definitions** | English and Spanish definitions for every word | Supports both heritage and L2 learners |
| **Voice Speed Control** | Adjustable playback speed for pronunciation | Accessibility and differentiated learning |
| **Special Character Toolbar** | One-tap access to a, e, i, o, u (with accents), u (with dieresis), n (with tilde) | Removes a major friction point on mobile/desktop |
| **Intelligent Misspelling Generation** | Auto-generates plausible wrong answers based on actual Spanish spelling error patterns | More realistic than random wrong answers |
| **Free Core Experience** | All words and modes available for free | Lowers adoption barrier for schools and families |

### 7.3 Competitive Moat

1. **Data Moat**: Maintaining the complete, accurate, annually-updated NSSB word list with definitions, tips, and categories requires ongoing effort that casual competitors are unlikely to replicate.

2. **Community Moat**: First-mover in teacher/school partnerships creates switching costs. Once a teacher has set up a classroom and students have progress data, migration to a competitor is costly.

3. **Feature Moat**: Competition-format practice with voice, special characters, and intelligent misspellings is significantly more complex to build than simple flashcards.

4. **Brand Moat**: Being "the" Spanish spelling bee app creates category ownership. Goal: when someone says "NSSB prep," the answer is Spelling Bee Buddy.

---

## 8. Product Roadmap

### Phase 1: Launch with Ads (Current - April 2026)

**Goal**: Ship the monetizable free product and begin user acquisition

| Task | Priority | Status |
|---|---|---|
| Finalize 1,070 words with bilingual definitions | High | Done |
| All 4 study modes functional | High | Done |
| 14 spelling-challenge categories | High | Done |
| Voice speed control | High | Done |
| Special character toolbar | High | Done |
| Register custom domain | High | To Do |
| SEO optimization (meta tags, sitemap, structured data) | High | To Do |
| Google AdSense integration (menu banner, interstitial, results) | High | To Do |
| COPPA-compliant privacy policy and consent flow | High | To Do |
| Google Analytics 4 integration | Medium | To Do |
| PWA manifest and service worker (offline support) | Medium | To Do |
| Landing page with keyword-rich content | Medium | To Do |
| Social media accounts created | Medium | To Do |
| Product Hunt launch | Medium | To Do |

**Success Metrics**:
- 1,000 MAU by end of April 2026
- AdSense generating positive revenue
- PWA installable on Android

### Phase 2: Premium Features + Auth (May - August 2026)

**Goal**: Introduce authentication, progress tracking, and paid subscriptions to capture value from the competition season

| Task | Priority | Depends On |
|---|---|---|
| Firebase/Supabase authentication (email + Google sign-in) | High | -- |
| User profiles with grade level and school | High | Auth |
| Progress tracking (per-word accuracy, mastery levels) | High | Auth |
| localStorage fallback for offline progress | High | -- |
| Spaced repetition algorithm (SM-2) | High | Progress tracking |
| Missed words review mode | High | Progress tracking |
| Stripe integration for subscriptions | High | Auth |
| Free tier round limiting (5 rounds/day) | Medium | Auth |
| Progress analytics dashboard | Medium | Progress tracking |
| Referral program (invite link + reward tracking) | Medium | Auth |
| Premium entitlement gating | Medium | Stripe |
| Email notifications (progress milestones, reminders) | Low | Auth |

**Success Metrics**:
- 5,000 MAU by end of August 2026
- 3-5% free-to-premium conversion rate
- $500+/month subscription revenue
- Net Promoter Score > 50

### Phase 3: Multiplayer + Teacher Tools (September 2026 - February 2027)

**Goal**: Expand into the B2B education market and add social/competitive features for student engagement

| Task | Priority | Depends On |
|---|---|---|
| Teacher dashboard (class management, assignments) | High | Auth + roles |
| Parent dashboard (linked student accounts) | High | Auth + roles |
| Family Plan account linking | High | Stripe + Auth |
| Teacher Plan with classroom codes | High | Stripe + Auth |
| Head-to-head multiplayer (real-time) | Medium | Auth + real-time DB |
| Matchmaking by grade/skill level | Medium | Multiplayer |
| Leaderboards (weekly, monthly, all-time) | Medium | Auth |
| Custom word list creation | Medium | Auth |
| Offline PDF export of word lists | Low | -- |
| School/district bulk licensing | Low | Stripe |

**Success Metrics**:
- 15,000 MAU
- 30+ schools on Teacher Plans
- 75+ Family Plans active
- Multiplayer sessions > 500/week

### Phase 4: Mobile App + Content Expansion (March 2027+)

**Goal**: Expand platform reach and content beyond the NSSB to become the definitive Spanish spelling practice platform

| Task | Priority | Depends On |
|---|---|---|
| Native mobile app (React Native or Capacitor) | High | All prior phases |
| iOS App Store submission | High | Mobile app |
| Google Play Store submission (native, replacing TWA) | High | Mobile app |
| Timer mode (3-minute competition countdown) | Medium | -- |
| Whiteboard mode (drawing canvas for visualization) | Medium | -- |
| Part of speech data for all words | Medium | Data entry |
| Language of origin data for all words | Medium | Data entry |
| Sentence examples in Spanish for all words | Medium | Data entry |
| Dark mode | Low | -- |
| Content expansion: Regional Spanish bee word lists | Low | Research |
| Content expansion: English spelling bee prep (Scripps) | Low | Research + major feature work |
| AI-powered pronunciation scoring | Low | Audio ML integration |

**Success Metrics**:
- 40,000+ MAU across web and mobile
- 4.5+ star rating on App Store / Play Store
- 200+ schools on Teacher Plans
- $15,000+/month total revenue

---

## Appendix A: Key Metrics to Track

| Metric | Tool | Frequency |
|---|---|---|
| Monthly Active Users (MAU) | Google Analytics | Weekly |
| Daily Active Users (DAU) | Google Analytics | Daily |
| Session Duration | Google Analytics | Weekly |
| Rounds Completed per Session | Custom event tracking | Weekly |
| Free-to-Premium Conversion Rate | Stripe + Analytics | Monthly |
| Premium Churn Rate | Stripe | Monthly |
| Ad Revenue (eCPM, fill rate) | AdSense dashboard | Weekly |
| Referral Program Participation | Custom tracking | Monthly |
| Teacher Plan Adoption | Stripe | Monthly |
| App Store Ratings | App Store Connect / Play Console | Monthly |
| NPS Score | In-app survey | Quarterly |
| Most-Missed Words | Progress analytics | Monthly |

## Appendix B: Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **NSSB changes word list format** | Medium | Medium | Monitor NSSB announcements; build flexible data ingestion pipeline |
| **COPPA violation** | Low | High | Hire compliance consultant before collecting data from minors; use non-personalized ads by default |
| **Low user acquisition** | Medium | High | Diversify channels; invest in teacher partnerships (B2B is more reliable than B2C for education) |
| **Competitor enters market** | Low | Medium | First-mover advantage, community moat, and annual word list updates create defensibility |
| **Web Speech API inconsistency** | Medium | Medium | Add fallback TTS service (Google Cloud TTS or Amazon Polly) for premium users |
| **NSSB requests takedown** | Low | High | Proactively seek partnership; ensure word list usage falls under educational fair use; do not use NSSB trademarks in app name |
| **Ad revenue lower than projected** | Medium | Low | Ads are supplementary; premium subscriptions are the primary revenue driver |
| **Seasonal revenue dips** | High | Medium | Offer annual plans to smooth revenue; develop off-season content (general Spanish spelling practice) |

## Appendix C: COPPA Compliance Checklist

Since the target audience includes children under 13, COPPA compliance is mandatory:

- [ ] Privacy policy clearly describes data collection practices
- [ ] Obtain verifiable parental consent before collecting personal information from children under 13
- [ ] Provide parents the ability to review, modify, or delete their child's data
- [ ] Use non-personalized (contextual) ads by default for users under 13
- [ ] Do not condition app access on disclosure of more data than reasonably necessary
- [ ] Implement reasonable data security measures
- [ ] Data retention policy: delete inactive child accounts after 12 months of inactivity
- [ ] Designate a COPPA compliance officer or point of contact
- [ ] Annual compliance review
