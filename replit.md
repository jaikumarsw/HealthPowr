# HealthPowr — Replit Project

## Overview
A community services platform connecting NYC residents with local CBO (Community Based Organization) providers. Built with React + Vite + TypeScript, using Supabase as the backend.

## Architecture
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Framer Motion
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions + Realtime)
- **Routing**: React Router v7
- **State**: React Context (AuthContext, NotificationContext)
- **Maps**: Leaflet / React Leaflet

## User Roles
| Role | Portal | Notes |
|------|--------|-------|
| `community_member` | `/client` | Residents submitting service requests |
| `organization` | `/cbo` | CBO directors & staff managing requests |
| `admin` | `/admin` | Platform admin, protected by passkey |

## Key Files
- `src/contexts/AuthContext.tsx` — auth state, signup, org bootstrap on email verification
- `src/lib/organzationsApi.ts` — org CRUD (note: typo in filename is intentional legacy)
- `src/api/requests.ts` — service request CRUD, staff assignment, notes, status history
- `src/api/staff.ts` — staff account creation via Supabase Edge Function
- `src/components/auth/LoginModal.tsx` — sign in / sign up modal with role toggle
- `src/pages/StaffAuthPage.tsx` — staff login via username + org

## CBO Staff & Team Management
- **Multiple staff per org**: Yes — via `organization_members` table. Each staff member is a separate Supabase auth user.
- **Staff roles**: `owner` (director), `admin`, `member` (staff)
- **Assign requests to staff**: Yes — `requestsApi.assignToStaff()`. Only owners/admins can assign.
- **Staff view**: Staff (`member` role) only see requests assigned to them.
- **Internal case notes**: Yes — stored in `request_notes` with `is_internal: true`, visible to all org members.
- **Team activity feed**: Yes — `requestsApi.getOrgTeamActivity()` merges notes + status history into a unified timeline.

## Environment Variables
| Variable | Scope | Purpose |
|----------|-------|---------|
| `VITE_SUPABASE_URL` | shared env | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | shared env | Supabase anon/public key |
| `VITE_ADMIN_PASSKEY` | secret | Admin portal gate |
| `SUPABASE_SERVICE_ROLE_KEY` | secret | Service role key for Edge Functions |

`VITE_SITE_URL` is intentionally NOT set — the app uses `window.location.origin` dynamically so email verification links always redirect to the correct host.

## Development
```bash
npm run dev       # start dev server on port 5000
npm run build     # production build
```

## Known CBO Org Verification Flow
1. Director signs up via Provider Portal → Supabase sends verification email
2. Director clicks link → lands on `/`, `onAuthStateChange` fires with session
3. `maybeBootstrapOrganization` creates the org row + membership in DB
4. LandingPage auto-redirects authenticated org users to `/cbo`
5. Director sees dashboard; org status is `pending` until admin approves

## Account Settings & Avatar Upload
- **Shared component**: `src/components/shared/AccountSettingsView.tsx` — works for all user types (client, CBO, staff)
- **Avatar upload**: Uses Supabase Storage `avatars` bucket (public, 2MB limit). Files stored at `avatars/{user_id}/avatar.{ext}`. URL saved to `profiles.avatar_url`.
- **Storage RLS policies**: Authenticated users can upload/update/delete their own folder (`{user_id}/`); public SELECT for all.
- **Profile editing**: Full name, phone, borough (clients only, hidden via `hideBorough` prop for org/staff).
- **Password change**: Re-verifies current password via `signInWithPassword` before calling `updateUser`.
- **Wired into**: CBODashboard (`account` view), ClientDashboard (`account` view). Both header dropdowns and sidebars link to it.
- **Staff sidebar**: Staff members (`member` role) now see Account Settings in their footer nav.

## Supabase Edge Functions
- `create-staff-account`: Creates a Supabase auth user for a staff member, adds them to `organization_members`, sends invite email
