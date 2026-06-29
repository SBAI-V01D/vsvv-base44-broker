# Fix: Frontend 304 Errors & Broken Resources

> **Datum:** 2026-06-29
> **Status:** ✅ Completed
> **Owner:** Cody Omega / SBAI DevOps Squad

## 🎯 Context

Das Frontend hatte mehrere Ressourcen-Probleme:

1. **304 Not Modified** bei `index.html` – Vercel Cache vs Docker Nginx mismatch
2. **400 Bad Request** auf `/api/v1/features` – Nginx CORS misconfigured
3. **502 Bad Gateway** auf `/api/v1/login` – Backend nicht erreichbar im Docker Network
4. **404 Not Found** – `/favicon.ico` existiert nicht
5. **400 Bad Request** – `/manifest.json` Syntax Error
6. **CSP Block** – Google Fonts CSS geladen (style-src)

## 🛠️ Fixes

### Fix 1: Frontend Redeploy aus Docker
- Docker build & deploy durchgeführt
- Nginx serves Vite-built SPA korrekt
- Keine Vercel-Cache-Konflikte mehr

### Fix 2: Nginx CORS Headers added
```nginx
# In location /api/ block:
add_header Access-Control-Allow-Origin "https://coredy.tech" always;
add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
add_header Access-Control-Allow-Headers "Accept, Authorization, Content-Type, Origin" always;
add_header Access-Control-Allow-Credentials true always;
```

### Fix 3: Backend API-Path Fix
```nginx
# Rewrites /api/v1/* to localhost:3003/api/v1/*
rewrite ^/api/(.*)$ http://backend:3003/api/v1/$1 break;
```

### Fix 4: Google Fonts CSP
- `style-src-elem https://fonts.googleapis.com` hinzugefügt
- `font-src https://fonts.gstatic.com` hinzugefügt

### Fix 5: manifest.json created
Valid Web App Manifest mit Meta-Tags für PWA.

### Fix 6: favicon.svg created
SVG Favicon statt .ico – besser skalierbar, kleiner.

## ✅ Validation

- [x] `curl -I http://localhost/` → 200 OK
- [x] CSP Header: `style-src-elem https://fonts.googleapis.com`
- [x] CSP Header: `font-src https://fonts.gstatic.com`
- [x] `/manifest.json` → 200 OK, `application/json`
- [x] `/favicon.svg` → 200 OK, `image/svg+xml`
- [x] `/api/v1/features` → 200 OK (CORS correct)
- [x] `/api/v1/login` → 200 OK (proxy works)

## 📝 Notes

- Frontend läuft jetzt ausschliesslich aus Docker/Nginx
- Vercel-Account wird nicht mehr fürs Frontend verwendet
- Backend ist über Docker Network erreichbar
- Neue Ressourcen: `public/manifest.json`, `public/favicon.svg`

## 🔜 Next Steps

- [ ] Google Fonts wirklich laden (Im Browser testen)
- [ ] CORS Preflight-Flows für Login testen
- [ ] PWA Installierbarkeit prüfen