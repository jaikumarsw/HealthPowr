# HealthPowr Project Audit

**Generated:** March 24, 2025  
**Purpose:** Onboarding document for new developers

---

## 1. Project Overview

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | React 18 |
| **Build Tool** | Vite 5 |
| **Language** | TypeScript |
| **Routing** | React Router v7 |
| **Styling** | Tailwind CSS 3 |
| **Backend/DB** | Supabase (PostgreSQL, Auth, Realtime) |
| **Animations** | Framer Motion |
| **Icons** | Lucide React |
| **PWA** | vite-plugin-pwa (Workbox) |
| **Utilities** | date-fns, clsx, tailwind-merge |

### Folder Structure

```
HealthPowr/
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── eslint.config.js
├── .env                    # (optional) VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
├── PHASE1_STATUS.md        # Phase 1 implementation status
├── PROJECT_AUDIT.md        # This file
│
├── public/
│   ├── logo.png
│   ├── sw.js               # Service worker (generated)
│   ├── manifest.webmanifest
│   └── icons/              # PWA icons
│
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   │
│   ├── api/                # Supabase API layer
│   │   ├── requests.ts     # Service requests CRUD
│   │   ├── messages.ts     # Conversations & messaging
│   │   ├── forum.ts        # Forum threads & comments
│   │   └── organizations.ts
│   │
│   ├── components/
│   │   ├── LandingPage.tsx
│   │   ├── auth/
│   │   │   └── LoginModal.tsx
│   │   ├── admin/
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── RequestsListView.tsx
│   │   │   └── OrganizationsListView.tsx
│   │   ├── client/
│   │   │   ├── ClientDashboard.tsx
│   │   │   ├── ClientHeader.tsx
│   │   │   ├── ClientSidebar.tsx
│   │   │   ├── ServicesView.tsx
│   │   │   ├── MapView.tsx
│   │   │   ├── ApplicationsView.tsx
│   │   │   ├── MessagesView.tsx
│   │   │   ├── ProfileView.tsx
│   │   │   ├── CommunityView.tsx
│   │   │   ├── FavoritesView.tsx
│   │   │   ├── FamilyManagement.tsx
│   │   │   └── ApplicationForm.tsx
│   │   ├── cbo/
│   │   │   ├── CBODashboard.tsx
│   │   │   ├── CBOHeader.tsx
│   │   │   ├── CBOSidebar.tsx
│   │   │   ├── CBOOverview.tsx
│   │   │   ├── ClientsView.tsx
│   │   │   ├── ReferralsView.tsx
│   │   │   ├── ServicesView.tsx
│   │   │   ├── MessagesView.tsx
│   │   │   ├── ReportsView.tsx
│   │   │   ├── CasePlanBuilder.tsx
│   │   │   ├── CustomFormBuilder.tsx
│   │   │   ├── SettingsView.tsx
│   │   │   ├── HelpSupportView.tsx
│   │   │   ├── EditClientModal.tsx
│   │   │   └── ClientProfileDrawerContent.tsx
│   │   ├── education/
│   │   │   ├── HealthLiteracyHub.tsx
│   │   │   ├── CommunityCalendar.tsx
│   │   │   ├── JobReadinessCenter.tsx
│   │   │   └── LearningQuiz.tsx
│   │   ├── gamification/
│   │   │   └── BadgeSystem.tsx
│   │   ├── emergency/
│   │   │   └── EmergencyButton.tsx
│   │   ├── pwa/
│   │   │   └── PWAInstallPrompt.tsx
│   │   ├── community/
│   │   │   └── CommunityHub.tsx
│   │   ├── communication/
│   │   │   └── InAppMessaging.tsx
│   │   ├── ai/
│   │   │   └── SmartRecommendations.tsx
│   │   ├── accessibility/
│   │   │   └── AccessibilityEnhancements.tsx
│   │   ├── ui/
│   │   │   └── Drawer.tsx
│   │   └── ...
│   │
│   ├── contexts/
│   │   ├── AuthContext.tsx     # Primary auth (uses supabaseClient)
│   │   └── NotificationContext.tsx
│   │
│   ├── context/               # Legacy/unused
│   │   └── AuthContext.tsx    # Alternate auth (uses supabase)
│   │
│   ├── hooks/
│   │   └── useGeolocation.ts
│   │
│   ├── lib/
│   │   ├── supabase.ts        # Supabase client (lenient env)
│   │   ├── supabaseClient.ts  # Supabase client (throws if env missing)
│   │   ├── auth.ts            # signUp, signIn, getCurrentProfile
│   │   ├── types.ts           # Profile, Organization, ServiceRequest, etc.
│   │   └── database.types.ts
│   │
│   ├── pages/
│   │   ├── LandingPage.tsx
│   │   ├── ClientDashboardPage.tsx
│   │   ├── CBODashboardPage.tsx
│   │   └── AdminDashboardPage.tsx
│   │
│   ├── routes/
│   │   └── RequireAuth.tsx
│   │
│   └── types/
│       └── user.ts            # UserRole, User interface
│
└── supabase/
    └── migrations/
        ├── 001_create_profiles.sql
        ├── 002_create_organizations.sql
        ├── 003_create_service_requests.sql
        ├── 004_create_messages.sql
        ├── 005_create_notes.sql
        ├── 006_create_forum.sql
        ├── 007_rls_policies.sql
        ├── 008_seed_data.sql
        └── 009_add_org_members_rls.sql
```

---

## 2. Pages & Routes

| Route | Portal | Status | Notes |
|-------|--------|--------|-------|
| `/` | Public | ✅ Working | Landing page; redirects logged-in users by role |
| `/client/*` | Client | ✅ Working | Single route; views switched via `currentView` state |
| `/cbo/*` | CBO | ✅ Working | Single route; views switched via `currentView` state |
| `/admin/*` | Admin | ✅ Working | Single route; tabs for Requests, Orgs, Users, Reports, Settings |
| `*` | — | ✅ Working | Redirects to `/` |

### Route-to-View Mapping (No Deep URLs)

**Client Portal** (`/client`): Views `services`, `map`, `applications`, `messages`, `profile`, `community`, `favorites`, `family`, `education`, `learning-calendar`, `job-readiness`, `quizzes`, `application-form` — all via state, not URL.

**CBO Portal** (`/cbo`): Views `overview`, `clients`, `referrals`, `services`, `messages`, `reports`, `case-plans`, `forms`, `settings`, `help` — all via state.

**Admin Portal** (`/admin`): Tabs `requests`, `orgs`, `users`, `reports`, `settings` — Users and Reports are placeholders.

---

## 3. Components

| Component | Path | Purpose | Data Source |
|-----------|------|---------|-------------|
| **LandingPage** | `components/LandingPage.tsx` | Public landing, hero, features, CTA | Static/hardcoded |
| **LoginModal** | `components/auth/LoginModal.tsx` | Sign in / sign up modal | Supabase Auth |
| **AdminDashboard** | `components/admin/AdminDashboard.tsx` | Admin layout, sidebar, tab content | Supabase (Requests, Orgs) |
| **RequestsListView** | `components/admin/RequestsListView.tsx` | List/export all service requests | `requestsApi.getAllRequests()` |
| **OrganizationsListView** | `components/admin/OrganizationsListView.tsx` | List CBO organizations | `orgsApi.getApproved()` (should use `getAll()` for admin) |
| **ClientDashboard** | `components/client/ClientDashboard.tsx` | Client layout, sidebar, view switcher | Auth context |
| **ClientHeader** | `components/client/ClientHeader.tsx` | Header, search, notifications | Hardcoded notifications |
| **ClientSidebar** | `components/client/ClientSidebar.tsx` | Sidebar nav | Static menu |
| **ServicesView** | `components/client/ServicesView.tsx` | Browse services, apply | `orgsApi.getApproved()`, `requestsApi.create()` |
| **MapView** | `components/client/MapView.tsx` | Map of services | **Hardcoded** services array |
| **ApplicationsView** | `components/client/ApplicationsView.tsx` | My applications/requests | `requestsApi.getMyRequests()` |
| **MessagesView** | `components/client/MessagesView.tsx` | Client messaging | `messagesApi` (Supabase) |
| **ProfileView** | `components/client/ProfileView.tsx` | User profile | Auth user + **hardcoded** profile fields |
| **CommunityView** | `components/client/CommunityView.tsx` | Forum threads/comments | `forumApi` (Supabase) |
| **FavoritesView** | `components/client/FavoritesView.tsx` | Saved services/events | **Hardcoded** favorites array |
| **FamilyManagement** | `components/client/FamilyManagement.tsx` | Family members, docs | **Hardcoded** family members |
| **ApplicationForm** | `components/client/ApplicationForm.tsx` | Multi-step application form | Config-driven (form schema) |
| **CBODashboard** | `components/cbo/CBODashboard.tsx` | CBO layout | Auth context |
| **CBOHeader** | `components/cbo/CBOHeader.tsx` | CBO header | Hardcoded notifications |
| **CBOSidebar** | `components/cbo/CBOSidebar.tsx` | CBO sidebar | Static menu |
| **CBOOverview** | `components/cbo/CBOOverview.tsx` | Stats, recent requests | `requestsApi.getOrgStatusCounts()`, `getOrgRequests()` |
| **ClientsView** | `components/cbo/ClientsView.tsx` | Service requests table | `requestsApi.getOrgRequests()` |
| **ReferralsView** | `components/cbo/ReferralsView.tsx` | Referrals list | **Hardcoded** referrals |
| **ServicesView** | `components/cbo/ServicesView.tsx` | Org services management | **Hardcoded** services |
| **MessagesView** | `components/cbo/MessagesView.tsx` | CBO messaging | `messagesApi.getMyOrgConversations()` |
| **ReportsView** | `components/cbo/ReportsView.tsx` | Reports/charts | **Hardcoded** metrics |
| **CasePlanBuilder** | `components/cbo/CasePlanBuilder.tsx` | Case plans | Likely hardcoded |
| **CustomFormBuilder** | `components/cbo/CustomFormBuilder.tsx` | Custom forms | Config-driven |
| **SettingsView** | `components/cbo/SettingsView.tsx` | Org settings | **Hardcoded** demo values |
| **HelpSupportView** | `components/cbo/HelpSupportView.tsx` | Help/support | **Hardcoded** support categories |
| **EditClientModal** | `components/cbo/EditClientModal.tsx` | Edit client details | Form/API |
| **ClientProfileDrawerContent** | `components/cbo/ClientProfileDrawerContent.tsx` | Client profile drawer | Static sections |
| **HealthLiteracyHub** | `components/education/HealthLiteracyHub.tsx` | Health education content | **Hardcoded** categories, topics |
| **CommunityCalendar** | `components/education/CommunityCalendar.tsx` | Events calendar | **Hardcoded** categories |
| **JobReadinessCenter** | `components/education/JobReadinessCenter.tsx` | Job resources | **Hardcoded** resources |
| **LearningQuiz** | `components/education/LearningQuiz.tsx` | Quizzes | **Hardcoded** categories |
| **BadgeSystem** | `components/gamification/BadgeSystem.tsx` | Leaderboard, badges | **Hardcoded** leaderboard |
| **EmergencyButton** | `components/emergency/EmergencyButton.tsx` | Emergency call | **Hardcoded** emergency types |
| **PWAInstallPrompt** | `components/pwa/PWAInstallPrompt.tsx` | PWA install banner | Browser APIs |
| **CommunityHub** | `components/community/CommunityHub.tsx` | Community hub | **Hardcoded** tabs, filters |
| **InAppMessaging** | `components/communication/InAppMessaging.tsx` | Messaging UI | **Hardcoded** tabs, emojis |
| **SmartRecommendations** | `components/ai/SmartRecommendations.tsx` | AI recommendations | **Hardcoded** tabs |
| **AccessibilityEnhancements** | `components/accessibility/AccessibilityEnhancements.tsx` | A11y options | **Hardcoded** languages |
| **Drawer** | `components/ui/Drawer.tsx` | Reusable drawer | UI only |
| **ProtectedRoute** | `components/ProtectedRoute.tsx` | Legacy route guard | Uses old `context/AuthContext` |
| **RequireAuth** | `routes/RequireAuth.tsx` | Route guard by role | Uses `contexts/AuthContext` |

---

## 4. Hardcoded Data

| Variable | File | Line(s) | Replace With |
|----------|------|---------|--------------|
| `features` | `src/components/LandingPage.tsx` | 40+ | Static marketing copy (acceptable) |
| `stats` (stats bar) | `src/components/LandingPage.tsx` | ~159 | Dynamic stats from API or config |
| `notifications` | `src/components/client/ClientHeader.tsx` | 16+ | `useNotifications()` or notifications API |
| `notifications` | `src/components/cbo/CBOHeader.tsx` | 16+ | Same as above |
| `boroughs` | `src/components/client/ServicesView.tsx` | 76 | `boroughs` table or `service_categories` |
| `categories` | `src/components/client/ServicesView.tsx` | 224 | `service_categories` table |
| `services` | `src/components/client/MapView.tsx` | 72–180+ | `orgsApi.getApproved()` + services, with lat/lng |
| `categories` | `src/components/client/MapView.tsx` | 72 | `service_categories` (acceptable as UI config) |
| `favorites` | `src/components/client/FavoritesView.tsx` | 18–70 | User favorites table/API |
| `categories` | `src/components/client/FavoritesView.tsx` | 74 | Derived from favorites |
| `profileData` (phone, address, etc.) | `src/components/client/ProfileView.tsx` | 22–30 | `profiles` table via Supabase |
| `familyMembers` | `src/components/client/FamilyManagement.tsx` | 68–90+ | Family/household table/API |
| `referrals` | `src/components/cbo/ReferralsView.tsx` | 10–63 | Referrals table/API |
| `services` | `src/components/cbo/ServicesView.tsx` | 19–71 | `services` table for org |
| `periods`, `categories`, `keyMetrics`, etc. | `src/components/cbo/ReportsView.tsx` | 11–50 | Reports API or analytics |
| `defaultValue` inputs | `src/components/cbo/SettingsView.tsx` | 67–109 | Profile/org from Supabase |
| `supportCategories` | `src/components/cbo/HelpSupportView.tsx` | 4+ | Support categories API/config |
| `menuItems` | `src/components/admin/AdminDashboard.tsx` | 16 | Static (acceptable) |
| `stats` (change %, etc.) | `src/components/cbo/CBOOverview.tsx` | 46 | Analytics API |
| `resourceCategories`, `resourceTypes`, `tabs` | `src/components/education/JobReadinessCenter.tsx` | 358–376 | Education content API |
| `categories` | `src/components/education/CommunityCalendar.tsx` | 337 | Events/categories API |
| `categories`, `contentTypes`, `trendingTopics` | `src/components/education/HealthLiteracyHub.tsx` | 64–235 | Content API |
| `categories` | `src/components/education/LearningQuiz.tsx` | 282 | Quiz/content API |
| `leaderboard`, `categories` | `src/components/gamification/BadgeSystem.tsx` | 172–180 | Gamification API |
| `emergencyTypes` | `src/components/emergency/EmergencyButton.tsx` | 26 | Config or API |
| `tabs`, `eventFilters` | `src/components/community/CommunityHub.tsx` | 326–333 | Config/API |
| `tabs`, `emojis` | `src/components/communication/InAppMessaging.tsx` | 317–324 | Config (emojis static OK) |
| `tabs` | `src/components/ai/SmartRecommendations.tsx` | 291 | Recommendations API |
| `languages` | `src/components/accessibility/AccessibilityEnhancements.tsx` | 223 | i18n config |
| `notifications` | `src/contexts/NotificationContext.tsx` | 24–48 | Notifications table/API or event-driven |

---

## 5. Supabase Integration

### Database Tables (from migrations)

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles (id, email, full_name, phone, role, borough, etc.) |
| `organizations` | CBOs (name, status, borough, category, etc.) |
| `organization_members` | Links profiles to organizations |
| `services` | Services offered by organizations |
| `service_requests` | Member applications for services |
| `request_status_history` | Status change log |
| `request_notes` | Internal/external notes on requests |
| `conversations` | 1:1 per request (member ↔ org) |
| `messages` | Messages in conversations |
| `forum_threads` | Forum discussion threads |
| `forum_comments` | Comments on threads |
| `boroughs` | NYC boroughs |
| `service_categories` | Service category reference |

### API Files (`src/api/`)

| File | Functions | Tables Used |
|------|-----------|-------------|
| `requests.ts` | `create`, `getMyRequests`, `getOrgRequests`, `getAllRequests`, `updateStatus`, `assignToOrg`, `exportCsv`, `getStatusCounts`, `getOrgStatusCounts` | service_requests, request_status_history |
| `messages.ts` | `getOrCreateConversation`, `getMessages`, `send`, `getMyConversations`, `getMyOrgConversations`, `subscribeToMessages` | conversations, messages |
| `forum.ts` | `getThreads`, `createThread`, `getComments`, `addComment` | forum_threads, forum_comments |
| `organizations.ts` | `getApproved`, `getAll`, `updateStatus` | organizations |

### Components Using Supabase vs Fake Data

| Uses Supabase | Uses Hardcoded |
|---------------|----------------|
| LoginModal, AuthContext | LandingPage (features, stats) |
| ServicesView (client) | MapView |
| ApplicationsView | FavoritesView |
| MessagesView (client, cbo) | ProfileView (extra fields) |
| CommunityView | FamilyManagement |
| CBOOverview | ReferralsView |
| ClientsView | CBO ServicesView |
| Admin RequestsListView | ReportsView |
| Admin OrganizationsListView | SettingsView, HelpSupportView |
| | All education components |
| | BadgeSystem, EmergencyButton |
| | CommunityHub, InAppMessaging |
| | SmartRecommendations |

---

## 6. Authentication

### Flow

1. **Supabase Auth** for sign in / sign up.
2. **AuthContext** (`contexts/AuthContext.tsx`):
   - Maps Supabase user to app `User` (id, email, name, role, organization).
   - Role from `user_metadata.role` or `profiles.role`.
   - `isLoading`, `isSubmitting`, `signIn`, `signUp`, `signOut`.
3. **RequireAuth** (`routes/RequireAuth.tsx`):
   - Redirects unauthenticated users to `/`.
   - Redirects by role: admin → `/admin`, org → `/cbo`, else `/client`.
4. **LandingPage**:
   - Redirects logged-in users by role.

### Role Values

- `community_member` → Client portal
- `organization` → CBO portal
- `admin` → Admin portal

### Issues / Gaps

1. **Profiles.organization_id**: AuthContext signUp upserts `organization_id` to `profiles`, but `profiles` has no such column. Org linking uses `organization_members` instead.
2. **Duplicate AuthContext**: `context/AuthContext.tsx` uses `profile` and `loading`; `contexts/AuthContext.tsx` uses `user` and `isLoading`. App uses `contexts/`; `ProtectedRoute` uses the old one.
3. **Supabase client duplication**: `lib/supabase.ts` (lenient) vs `lib/supabaseClient.ts` (strict). AuthContext uses `supabaseClient`.
4. **Admin creation**: No UI to create admin users; must be done in DB or Supabase Dashboard.

---

## 7. What Works

- TypeScript compiles, ESLint passes, production build succeeds
- Landing page with sign in/sign up modal
- Role-based redirect (community_member → /client, organization → /cbo, admin → /admin)
- Client: Find Services (Supabase), Apply (creates `service_requests`), Applications list, Messages, Community forum
- CBO: Overview (request counts), Clients (assigned requests), Messages
- Admin: Requests list, CSV export, Organizations list
- PWA setup (service worker, manifest)
- RLS policies for profiles, orgs, requests, messages, forum

---

## 8. What Is Broken

| Feature | Cause |
|---------|-------|
| CBO ClientsView / CBOOverview member names | API returns `member`, components use `req.profiles` (e.g. `req.profiles?.full_name`). Should use `req.member?.full_name`. |
| Org sign-up | AuthContext upserts `organization_id` into `profiles`, but column does not exist. |
| Admin Organizations list | Uses `orgsApi.getApproved()` instead of `orgsApi.getAll()`, so pending orgs are hidden. |
| CBO getOrgRequests filtering | API does not filter by org; relies on RLS. If `get_user_org_id()` returns null (user not in `organization_members`), no rows. |
| MapView services | Uses hardcoded array; does not load from Supabase. |
| ProfileView save | `handleSave` is a no-op; profile updates not sent to Supabase. |
| FavoritesView remove | `removeFavorite` only logs to console. |
| Deep linking | No URLs for individual views (e.g. `/client/map`, `/client/community`). |

---

## 9. What Is Missing

### From Phase 1 / Expected Features

- **User Management** (Admin): Tab exists but shows “User Management is under construction”
- **Analytics / Reports** (Admin): Placeholder cards only
- **Referrals system**: No DB table or API; ReferralsView is fully hardcoded
- **Favorites**: No `user_favorites` (or similar) table or API
- **Family/Household**: No `family_members` or household tables
- **Org services CRUD**: CBO ServicesView uses hardcoded data; no create/edit/delete
- **Request assignment UI**: Admin can assign in API, but no assign-to-org UI in RequestsListView
- **Org approval UI**: No approve/reject in OrganizationsListView despite `orgsApi.updateStatus`
- **Profile updates**: No Supabase update for profile fields
- **Realtime for requests**: No subscription for new/updated requests
- **Test accounts**: member@test.com, org@test.com, admin@test.com not seeded

### UI / UX

- Error toasts for API failures
- Loading skeletons
- Empty states for some views
- Responsive tweaks for some layouts

---

## 10. Dependencies

### Production (`package.json`)

| Package | Version | Purpose |
|---------|---------|---------|
| `@supabase/supabase-js` | ^2.99.2 | Supabase client (auth, db, realtime) |
| `clsx` | ^2.1.1 | Conditional class names |
| `date-fns` | ^4.1.0 | Date formatting/parsing |
| `framer-motion` | ^12.38.0 | Animations |
| `lucide-react` | ^0.344.0 | Icons |
| `react` | ^18.3.1 | UI framework |
| `react-dom` | ^18.3.1 | React DOM renderer |
| `react-router-dom` | ^7.13.1 | Routing |
| `tailwind-merge` | ^3.5.0 | Merge Tailwind classes |

### Dev Dependencies

| Package | Purpose |
|---------|---------|
| `@eslint/js` | ESLint base config |
| `@types/react`, `@types/react-dom` | TypeScript types for React |
| `@vitejs/plugin-react` | Vite React plugin |
| `autoprefixer` | CSS vendor prefixes |
| `eslint` | Linting |
| `eslint-plugin-react-hooks` | React Hooks rules |
| `eslint-plugin-react-refresh` | Fast Refresh support |
| `globals` | ESLint env globals |
| `postcss` | PostCSS (Tailwind) |
| `tailwindcss` | Tailwind CSS |
| `typescript` | TypeScript compiler |
| `typescript-eslint` | TypeScript ESLint rules |
| `vite` | Build tool |
| `vite-plugin-pwa` | PWA/Workbox |
| `workbox-window` | Workbox runtime (used by PWA plugin) |

---

## Quick Fixes for New Developers

1. **CBO member display**: In `ClientsView.tsx` and `CBOOverview.tsx`, replace `req.profiles` with `req.member`.
2. **Admin orgs**: In `OrganizationsListView.tsx`, use `orgsApi.getAll()` instead of `orgsApi.getApproved()`.
3. **Profile upsert**: Remove `organization_id` from AuthContext signUp profile upsert, or add `organization_id` to `profiles` via migration.
4. **Env**: Ensure `.env` has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` before running.

---

*End of audit*
