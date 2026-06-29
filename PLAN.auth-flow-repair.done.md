# PLAN: Auth-Flow Reparatur

**Stand:** 2026-06-25  
**Status:** Genehmigt → Implementierung läuft

---

## 1. PROBLEME

### 1.1 Kein Login-Prompt bei fehlendem Token
Wenn kein JWT-Token in localStorage existiert, wird die App trotzdem gerendert. Es gibt keinen Redirect zu einer Login-Seite.

**Ursache:** `App.jsx` prüft nur `authError` (der nur bei fehlgeschlagenem API-Call gesetzt wird), nicht aber `isAuthenticated`.

### 1.2 Keine `/login`-Seite existiert
`AuthContext.navigateToLogin()` macht `window.location.href = '/login'` — aber `/login` ist weder als Route in App.jsx noch als nginx-Static vorhanden.

### 1.3 Logout-Button funktioniert nicht
`logout()` löscht Tokens und lädt die aktuelle Seite neu → ohne Token wird wieder die App ohne Login angezeigt (Problem 1.1).

### 1.4 Auth-Check greift nur bei API-Fehlern
`checkUserAuth()` wird nur aufgerufen wenn ein Token existiert. Ohne Token: `isAuthenticated = false`, kein Error → App wird normal gerendert.

---

## 2. LÖSUNG

### 2.1 Neue Datei: `src/pages/Login.jsx`
- Email + Passwort Formular
- Ruft `POST /api/auth/login` auf
- Speichert Tokens via `setTokens()` und setzt User via AuthContext
- Unterstützt `?redirect=` Parameter für Return-URL nach Login
- Styling identisch zur App (Tailwind)

### 2.2 App.jsx Änderungen
- `/login` als PUBLIC Route (vor Auth-Check)
- Public Routes Array: `['/login', '/portal']`
- Auth Guard: wenn `!isAuthenticated && !isPublicRoute` → `<Navigate to="/login" />`
- `authError.type === 'auth_required'` → redirect zu `/login`

### 2.3 AuthContext Fix
- `logout()` → redirect zu `/login` statt aktueller Seite
- `navigateToLogin()` → `window.location.href = '/login'`

### 2.4 API Client Fix
- Bei 401 + Refresh-Fail → `auth:logout` Event → redirect zu `/login`

---

## 3. DATEIEN

| Datei | Aktion |
|-------|--------|
| `src/pages/Login.jsx` | **NEU** — Login-Formular |
| `src/App.jsx` | **EDIT** — Login-Route + Auth-Guard |
| `src/lib/AuthContext.jsx` | **EDIT** — Logout-Redirect |
| `src/api/client.js` | **EDIT** — redirectToLogin target |

---

## 4. EXIT-CRITERIA

- [ ] Kein Token → Login-Seite (`http://server:3004/login`)
- [ ] Login mit gültigen Credentials → Dashboard + Sidebar
- [ ] Login mit admin-Rolle → "Administration"-Gruppe im Sidebar
- [ ] Logout → zurück zur Login-Seite
- [ ] Falsche Credentials → Fehlermeldung auf Login-Seite
- [ ] Token abgelaufen → automatisch zur Login-Seite
- [ ] Nach erfolgreichem Login: `?redirect=` wird beachtet
