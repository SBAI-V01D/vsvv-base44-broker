# VSVV Premium Broker — Plan: Remaining Fixes & Improvements

> **Status**: Frontend rendering fixed (see [What Was Fixed](#what-was-fixed)).  
> This plan covers remaining issues discovered during verification.

---

## What Was Fixed

| Issue | Fix | File(s) |
|-------|-----|---------|
| All pages blank except login/sidebar | `path="/"` → `path="/*"` in outer `<Routes>` (React Router v6 exact match vs prefix) | `src/App.jsx` |
| Portal pages also blank | Removed duplicate `path="/portal/*"` route (conflicted with `/*`) | `src/App.jsx` |
| Page content not rendering in `AppLayout` | Changed `<Outlet />` → `{children}` | `src/components/layout/AppLayout.jsx` |
| Orphaned `<Route>` outside `<Routes>` | Moved legacy redirects inside the `<Routes>` block | `src/App.jsx` |
| Double `/api/api/` prefix in API calls | Set `VITE_API_URL=` empty, fallback to `''` | `.env.local`, `src/api/client.js` |
| nginx backend proxy wrong port | Fixed `3001` → `3003` | sbai-gate nginx `custom_apps.conf` |

---

## Remaining Issues

### P1 — API 404: `/api/verkaufschances` (Entity Naming Mismatch)

**What**: Dashboard sidebar loads widgets that call entity proxy for "Verkaufschance". The auto-generated API path becomes `verkaufschances` (PascalCase → kebab + English `s`), but the backend entity is registered as `verkaufschancen` (German plural).

**How to fix**:

> **Option A (Backend — recommended)**: Add the English-plural path as an alias in the entity registry.
> 
> `docker exec avaai-backend cat /app/src/modules/entity-proxy/entity-registry.ts`
>
> Find the `verkaufschancen` entry and add an `aliases` field:
> ```ts
> { name: 'Verkaufschance', prefix: 'verkaufschancen', aliases: ['verkaufschances'], ... }
> ```
> Or register a duplicate entity or route redirect.

> **Option B (Frontend)**: Override the generated entity path in the frontend API layer so it calls `verkaufschancen` instead of `verkaufschances`.
>
> Find where the entity proxy base URL is built (likely in `avaaiClient.js` or a generated SDK file) and map `verkaufschance` → `verkaufschancen`.

---

### P1 — API 404: `/api/functions/getAllContractsForDashboard`

**What**: Dashboard calls `avaai.functions.invoke('getAllContractsForDashboard')` which hits `/api/functions/getAllContractsForDashboard` → 404. The backend doesn't register this Fastify function route.

**How to fix**:

> **Backend**: Register the function in the `/app/src/modules/functions/` module.
> 
> ```ts
> // /app/src/modules/functions/contractDashboard.ts (new file)
> export async function getAllContractsForDashboard(fastify, { organization_id }) {
>   const contracts = await prisma.contract.findMany({
>     where: { organization_id },
>     include: { customer: true, insurer: true },
>     orderBy: { created_at: 'desc' },
>     take: 50,
>   });
>   return { contracts };
> }
> ```
> Then register it in the functions module so it becomes available at `POST /api/functions/getAllContractsForDashboard`.

---

### P2 — nginx Missing `/socket.io/` Proxy Location

**What**: The frontend Socket.io client connects to `wss://vsvv.coredy.dev/socket.io/` which hits nginx, but nginx has no location block for `/socket.io/`, so it falls through to the `location /` block which proxies to Vite instead of the backend. Browser console shows repeated WebSocket connection failures.

**How to fix**:

> **sbai-gate nginx**: Add a `/socket.io/` location to proxy to the backend:
> ```nginx
> location /socket.io/ {
>     proxy_pass http://172.17.0.1:3003/socket.io/;
>     proxy_http_version 1.1;
>     proxy_set_header Upgrade $http_upgrade;
>     proxy_set_header Connection "upgrade";
>     proxy_set_header Host $host;
> }
> ```
> Then reload nginx: `docker exec sbai-gate nginx -s reload`

---

### P2 — nginx Proxy IP Uses `172.17.0.1`

**What**: The nginx config hardcodes `172.17.0.1` (docker0 bridge gateway) for both the Vite frontend and backend proxies. The sbai-gate container is on `sbai-net` (gateway `172.18.0.1`) and `avaai_avaai-network` (gateway `172.19.0.1`). Currently `172.17.0.1` works (host routing resolves it), but it may break if Docker networking changes or iptables rules are added.

**How to fix**:

> Use a Docker DNS-based approach or ensure the host gateway is stable.
> - Option A: Pin the container to the docker0 bridge (`--network bridge`)
> - Option B: Use `host.docker.internal` (Docker Desktop, not plain Docker Engine on Linux)
> - Option C: Keep `172.17.0.1` but monitor for breakage
>
> **Low priority** unless network issues arise.

---

### P3 — Vite Dev Server Stability

**What**: The Vite dev server (`npm run dev`) must be manually kept alive via `screen -dmS vite ...`. It occasionally crashes (process death with 502 errors in the browser). No process manager or watchdog.

**How to fix**:

> **Option A (Quick)**: Add a systemd service or a startup script to auto-restart Vite:
> ```bash
> # /etc/systemd/system/vite-vsvv.service
> [Unit]
> Description=Vite Dev Server — VSVV Premium Broker
> 
> [Service]
> Type=simple
> User=node
> WorkingDirectory=/workspaces/vsvv-premium-broker-main-v2
> ExecStart=/usr/bin/node node_modules/vite/bin/vite.js --host 0.0.0.0
> Restart=always
> RestartSec=5
> 
> [Install]
> WantedBy=multi-user.target
> ```

> **Option B (Production)**: Build the frontend (`npm run build`) and serve the static `dist/` folder directly by nginx instead of proxying to a Vite dev server. This is the proper production setup:
> ```nginx
> location / {
>     root /workspaces/vsvv-premium-broker-main-v2/dist;
>     try_files $uri $uri/ /index.html;
> }
> ```
> *Note*: Requires running `npm run build` after each frontend change.

---

### P3 — Hostname vs Dev/Prod Configuration

**What**: `.env.local` uses empty `VITE_API_URL=` which resolves to same-origin requests through nginx. The nginx proxy then routes `/api/` to the backend. This works but makes it impossible to run the frontend standalone without the nginx proxy.

**How to fix**:

> Ensure `.env.local` and the nginx config stay in sync. If the frontend is ever run without nginx (e.g., direct Vite in dev), the API calls will fail.
> - Dev setup (.env.local): `VITE_API_URL=` (empty = same-origin)
> - Standalone dev: `VITE_API_URL=http://localhost:3003`
>
> Document this in a README or env template.

---

### P3 — 404 for `/favicon.ico` & `/manifest.json`

**What**: Browser requests `/favicon.ico` and `/manifest.json` which return 404 (proxied to Vite, but Vite doesn't have these files). Cosmetic issue.

**How to fix**:

> Add placeholder files:
> ```bash
> touch src/favicon.ico src/manifest.json
> ```
> Or configure nginx to serve these from a static location.

---

## Summary

| Priority | Issue | Fix Location | Est. Effort |
|----------|-------|-------------|-------------|
| **P1** | `/api/verkaufschances` 404 | Backend entity registry | 30min |
| **P1** | `/api/functions/getAllContractsForDashboard` 404 | Backend functions module | 1-2h |
| **P2** | `/socket.io/` not proxied | nginx config | 15min |
| **P2** | nginx backend IP hardcoded | nginx config / network setup | 30min |
| **P3** | Vite dev server stability | systemd service or production build | 1h |
| **P3** | env config documentation | README / env template | 15min |
| **P3** | missing favicon/manifest.json | static files | 5min |
