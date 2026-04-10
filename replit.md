# HealthPowr — Replit Project

## Overview
A community services platform connecting NYC residents with local CBO (Community Based Organization) providers. Built with React + Vite + TypeScript, using Supabase as the backend.

## Architecture
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **Routing**: React Router v7 — URL-based sub-routing inside each portal (`/cbo/messages`, `/client/services`, etc.)
- **State**: React Context (AuthContext, NotificationContext)
- **Maps**: Leaflet / React Leaflet

## User Roles
| Role | Portal | Notes |
|------|--------|-------|
| `community_member` | `/client/*` | Residents submitting service requests |
| `organization` | `/cbo/*` | CBO directors & staff managing requests |
| `admin` | `/admin/*` | Platform admin, protected by passkey |

## Project Structure
```
src/
  App.tsx                        # Root router — imports components directly
  api/                           # Supabase data access layer
    auth.ts                      # Auth helpers (fetchProfile, upsertProfile, etc.)
    forum.ts                     # Community forum threads/comments
    messages.ts                  # Messaging between users
    organizations.ts             # Org CRUD (admin use)
    requests.ts                  # Service request CRUD, assignments, notes
    staff.ts                     # Staff account creation via Edge Function
  components/
    LandingPage.tsx              # Public landing page
    admin/                       # Admin portal views
    auth/LoginModal.tsx          # Sign in / sign up modal
    cbo/                         # CBO/Staff portal views
    client/                      # Client portal views
    shared/AccountSettingsView.tsx  # Shared account settings (all user types)
    ui/Drawer.tsx                # Reusable drawer/panel component
  contexts/
    AuthContext.tsx              # Auth state, session, refreshProfile
    NotificationContext.tsx      # In-app notifications
  hooks/
    useAdminOrganizations.ts     # Admin org list with filtering
    useGeolocation.ts            # Browser geolocation
    useOrganizations.ts          # CBO org data
    useServices.ts               # Service listings
  lib/
    organzationsApi.ts           # Org setup/CRUD (legacy filename, do not rename)
    orgSlug.ts                   # Org slug generation utilities
    siteUrl.ts                   # Dynamic site URL helper
    supabase.ts                  # Supabase client singleton
    types.ts                     # Shared TypeScript types
    utils.ts                     # cn() utility (clsx + tailwind-merge)
  pages/                         # Only real full-page routes (no thin wrappers)
    AdminLoginPage.tsx
    AdminPasskeyPage.tsx
    StaffAuthPage.tsx
  routes/RequireAuth.tsx         # Role-gated route wrapper
  types/user.ts                  # User / UserRole types
```

## Portal URL Routes
| Portal | URL | View |
|--------|-----|------|
| CBO | `/cbo/overview` `/cbo/clients` `/cbo/services` `/cbo/messages` `/cbo/settings` `/cbo/account` `/cbo/help` | — |
| Staff (member role) | `/cbo/assigned` `/cbo/messages` `/cbo/account` `/cbo/help` | restricted subset |
| Client | `/client/services` `/client/map` `/client/applications` `/client/messages` `/client/profile` `/client/community` `/client/account` | — |
| Admin | `/admin/requests` `/admin/orgs` `/admin/reports` | — |

## Key Implementation Notes
- `src/lib/organzationsApi.ts` has a typo in the filename — intentional legacy, **do not rename**
- `VITE_SITE_URL` is intentionally NOT set — `siteUrl.ts` uses `window.location.origin` dynamically
- Staff accounts use login email (`username@org-slug.healthpowr.app`) as Supabase auth email
- `maybeSingle()` pattern: any query on `organization_members` filtered only by `profile_id` must use `.order("joined_at").limit(1)` first

## CBO Staff & Team Management
- **Multiple staff per org**: via `organization_members` table; each staff member is a separate Supabase auth user
- **Staff roles**: `owner` (director), `admin`, `member` (staff)
- **Staff view restriction**: `member` role only sees requests assigned to them (`/cbo/assigned`)
- **Case notes**: stored in `request_notes` with `is_internal: true`

## Account Settings & Avatar Upload
- **Component**: `src/components/shared/AccountSettingsView.tsx` — shared for all user types
- **Avatar storage**: Supabase Storage `avatars` bucket (public, 2MB limit); path `avatars/{user_id}/avatar.{ext}`
- **Profile sync**: `AuthContext.refreshProfile()` re-fetches profile after any save so headers/avatars update immediately
- **Borough field**: hidden for org/staff users via `hideBorough` prop

## Environment Variables
| Variable | Scope | Purpose |
|----------|-------|---------|
| `VITE_SUPABASE_URL` | shared env | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | shared env | Supabase anon/public key |
| `VITE_ADMIN_PASSKEY` | secret | Admin portal gate |
| `SUPABASE_SERVICE_ROLE_KEY` | secret | Service role key for Edge Functions |

## Supabase Edge Functions
- `create-staff-account` — creates auth user + profile + org membership; returns temp password to owner

## Development
```bash
npm run dev    # start dev server on port 5000
npm run build  # production build
```
