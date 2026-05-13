## Plan: Hide admin access

### Changes

1. **Remove Admin button from frontpage** (`src/routes/index.tsx`)
   - Delete the `<Link to="/admin">` Settings icon button in `TopBar` (lines ~167-172). Keep only `ThemeToggle`.

2. **Rename route file** `src/routes/admin.tsx` → `src/routes/adminadmin.tsx`
   - Update `createFileRoute("/admin")` → `createFileRoute("/adminadmin")`.
   - `src/routeTree.gen.ts` regenerates automatically.

3. **Update post-login redirect** (`src/routes/login.tsx`)
   - Change `navigate({ to: "/admin" })` → `navigate({ to: "/adminadmin" })` so signing in still lands on the admin dashboard at its new URL (no auto-redirect from `/admin` exists; the old path will simply 404).

4. **Update sign-out redirect target check** — `admin.tsx` already navigates to `/login` on sign out; no change needed.

5. **Update robots.txt** (`src/routes/robots[.]txt.tsx`)
   - Replace `Disallow: /admin` with `Disallow: /adminadmin` to keep the page out of search indexes.

### Notes
- No header/footer component contains an admin link beyond the frontpage TopBar — verified via grep.
- Admin functionality (auth gate, role check, tabs) is untouched.
- `/admin` will return 404; only `/adminadmin` works.
