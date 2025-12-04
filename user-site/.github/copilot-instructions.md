<!-- Copilot instructions for Julie-craft-usersite - concise, actionable -->
# Copilot / AI Agent Instructions

This project is a Next.js (App Router) storefront and admin console. The goal of this document is to help an AI coding agent become productive quickly by calling out architecture, important files, developer flows, conventions, integration points, and concrete examples from this repo.

1. Quick start (dev)
- Root of app: `user-site/` (run commands from `d:\user-site\user-site`).
- Common dev commands:
  - Install: `npm install`
  - Dev server: `npm run dev` (starts Next.js app router)
  - Build: `npm run build`
  - Start (production): `npm run start`
  - Lint: `npm run lint`

2. Big picture
- Next.js App Router in `app/` — server components by default, pages and API routes live under `app/`.
- UI components in `components/` and split by area (`admin/`, `auth/`, `notifications/`, `ui/`).
- Shared runtime helpers in `lib/` (e.g. `lib/supabase.ts` provides `supabase` and `supabaseAdmin`).
- Global middleware lives in `middleware.ts` and enforces auth/admin checks and header injection for API requests.
- Database schema & migrations under `database/` and `database-migrations/` (SQL files and RPC functions). Supabase is the primary backend.

3. Key integration points & environment
- Supabase: see `lib/supabase.ts`. Required env vars for full functionality:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (server-side)
- Email: `nodemailer` appears in dependencies; check `lib/` and `app/api` for email usage.
- JWT / auth: middleware and API routes read `Authorization: Bearer <token>` or `julie-crafts-token` cookie.

4. Conventions and patterns
- App router: Route handlers for server APIs live under `app/api/*/route.ts`. Handlers commonly use the signature:
  `export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) { ... }`
  Always accept the second `{ params }` argument when you need route params.
- Middleware: `middleware.ts` centralizes auth/role checks. It often injects `x-user-id` and `x-user-role` headers for internal API requests during dev or validated admin access. When modifying APIs, preserve compatibility with this header pattern.
- Supabase admin client: `supabaseAdmin` is optionally null if envs aren't set; code checks `isSupabaseConfigured` before calling DB. Follow the existing pattern for safe server-side DB access.
- Server vs Client components: `app/` files are server components by default. Files that need browser APIs or hooks use `'use client'` at the top (see `components/theme-provider.tsx`).
- Contexts: `contexts/` contains React contexts (`auth-context.tsx`, `cart-context.tsx`, etc.) intended for client usage.

5. Database and RPCs
- SQL functions and migrations exist under `database/functions/` and `database-migrations/` — e.g. RPC `mark_notification_read` is used by `app/api/notifications/[id]/route.ts`.
- Prefer existing RPCs for business logic (notification read, inventory adjustments) instead of reimplementing logic in route handlers.

6. Component & admin patterns (examples)
- Customer/admin pages:
  - Admin pages are under `app/admin/*`. The UI uses shared components from `components/admin/` and relies on middleware->header injection for user role.
  - Example bug pattern fixed earlier: prefer `paginatedCustomers` (current page slice) when computing bulk-selection counts rather than an undefined `filteredCustomers` variable.
- Notification drawer:
  - API endpoints: `app/api/notifications/*` handle PATCH/DELETE, fetch and RPC usage. When updating UI to call PATCH, include `Authorization` header or rely on cookie as middleware expects.

7. Debugging & developer workflows
- Dev server logs & browser console are primary sources for runtime exceptions (e.g., undefined variables in client components).
- When debugging API routes, use the middleware behavior as a reference — tests may need to provide `Authorization` header or mock `supabaseAdmin`.
- To run targeted checks: open the dev console for client-side exceptions; check terminal running `npm run dev` for server logs.

8. What to avoid / watch for
- Don't assume `supabaseAdmin` is always available — check `isSupabaseConfigured` before using.
- Follow existing patterns for route handler signatures (`(request, { params })`) to avoid undefined `params` errors.
- Respect server/component boundary: avoid using browser-only APIs in server components.

9. Where to look for examples
- App router & API: `app/api/notifications/[id]/route.ts`, `app/api/orders/*` and similar route handlers.
- Middleware & auth: `middleware.ts`.
- Supabase client: `lib/supabase.ts`.
- UI components: `components/` (look at `components/theme-provider.tsx` and admin components under `components/admin/`).

10. If you need to change behavior
- Prefer small, focused edits. Update or add tests where appropriate. If adding new API behavior that requires role checks, update `middleware.ts` patterns and existing callers (admin pages and API consumers).

If anything above is ambiguous or you want more examples (specific files or code snippets), tell me which area to expand and I will iterate.
