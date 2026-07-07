# PLAN FIX — Empty Pages (Whitescreen) Root Cause Analysis

## Symptom

- **Observed**: Visiting `https://vsvv.coredy.ai/portal` or `https://vsvv.coredy.ai/portal/setup` renders a completely empty page. The DOM contains only the `<Toaster />` component; no app content appears.
- **Observed**: Visiting `https://vsvv.coredy.ai/` → redirects to `/login` → login page renders correctly.
- **No JavaScript errors, no CSP violations, no network errors** in the browser console.
- **Expected**: Portal pages should show their respective content (PortalSetup login form, PortalDashboard, etc.).

## Root Cause: React Router v6 Absolute Paths in Nested `<Routes>`

The deployed build uses this top-level routing (verified from the production JS bundle):

```jsx
<Routes>
  <Route path="/" element={<AuthenticatedApp />} />
  <Route path="/login" element={<Login />} />
  <Route path="/portal/*" element={<AuthenticatedApp />} />
</Routes>
```

Inside `AuthenticatedApp`, the portal branch renders a **nested `<Routes>`** with **absolute paths**:

```jsx
// Inside AuthenticatedApp (when pathname starts with /portal):
<Routes>
  <Route path="/portal/setup" element={<PortalSetup />} />
  <Route path="/portal/reset-password" element={<PortalResetPassword />} />
  <Route path="/portal" element={<PortalRoot />}> ... </Route>
</Routes>
```

**In React Router v6, when a parent `<Route>` uses `path="/*"` (wildcard/splat), the nested `<Routes>` receives the captured path (minus the matched prefix) for matching.** For URL `/portal/setup`:

1. Parent `path="/portal/*"` matches, `*` captures `setup`
2. The nested `<Routes>` receives `setup` as the path to match against
3. `path="/portal/setup"` (absolute, starts with `/`) tries to match `setup` → **NO MATCH**
4. All portal routes fail to match → `<Routes>` renders nothing → **empty page**

**React Component Fiber Tree confirms**: `AK` (AuthenticatedApp) renders a nested `KE` (Routes) component, but that Routes component has **no matching Route children** (no child fiber nodes below it), proving no portal route matched.

### Secondary Issue: Top-Level Route `path="/"` Doesn't Match Sub-paths

The top-level route `path="/"` only matches the root URL `/`. Any direct navigation or page refresh on routes like `/kunden`, `/vertraege`, etc. will also result in empty pages because no top-level route matches them. This affects the entire app, not just the portal.

## Fix Plan

### Fix 1: Change Portal Routes to Relative Paths (Critical)

In `src/App.jsx`, inside `AuthenticatedApp`, change the portal `<Routes>` children from absolute paths to relative paths:

```jsx
// BEFORE (broken — absolute paths in nested Routes):
<Routes>
  <Route path="/portal/setup" element={<PortalSetup />} />
  <Route path="/portal/reset-password" element={<PortalResetPassword />} />
  <Route path="/portal" element={<PortalRoot />}>
    <Route index element={<PortalDashboard />} />
    <Route path="vertraege" element={<PortalContracts />} />
    ...
  </Route>
</Routes>

// AFTER (fixed — relative paths match the *-captured remainder):
<Routes>
  <Route path="setup" element={<PortalSetup />} />
  <Route path="reset-password" element={<PortalResetPassword />} />
  <Route index element={<PortalRoot />}>
    <Route index element={<PortalDashboard />} />
    <Route path="vertraege" element={<PortalContracts />} />
    ...
  </Route>
</Routes>
```

This way:
- `/portal/setup` → parent `*` captures `setup` → child `path="setup"` matches ✅
- `/portal/reset-password` → parent `*` captures `reset-password` → child `path="reset-password"` matches ✅
- `/portal` → parent `*` captures `` → child `index` matches ✅

### Fix 2: Change Top-Level Route to Wildcard (Critical)

In `src/App.jsx`, change the top-level main app route from `path="/"` to `path="/*"` to match all sub-paths:

```jsx
// BEFORE:
<Route path="/" element={<AuthenticatedApp />} />

// AFTER:
<Route path="/*" element={<AuthenticatedApp />} />
```

This ensures that direct navigation or page refresh on ANY route (e.g., `/kunden`, `/vertraege`) renders the app instead of an empty page.

### Why This Was Working Before / What Changed

The production build currently deployed is from an older version where `path="/"` was used. The most recent commit (f836539) added `path="/*"` to fix the top-level matching, but this change was only in the local repo — the deployed build was never updated. Both issues (top-level `path="/"` and nested absolute portal routes) need to be shipped together.

## How to Verify

1. After rebuilding and deploying, visit `https://vsvv.coredy.ai/portal/setup` — should show the portal login form
2. Visit `https://vsvv.coredy.ai/portal` — should show PortalDashboard or redirect appropriately
3. Visit `https://vsvv.coredy.ai/kunden` (when authenticated) — should show the customers page, not blank
4. Refresh on any non-root page — should not result in empty page
