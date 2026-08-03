# FREEZE BACKUP

## 1. Snapshot
- **Date:** 2026-08-03
- **Repository:** crew-data-app
- **Freeze point:** production migration planning checkpoint
- **Build metadata:** `js/config.js` sets `ENVIRONMENT: "production"`
- **Primary online connection:** `js/api.js` uses `DEFAULT_GAS_URL` and `getGasUrl()` for Google Apps Script endpoint

## 2. Backup Scope
- `FEATURE_FREEZE.md`
- `LOCALSTORAGE_AUDIT.md`
- `FREEZE_BACKUP.md`
- `js/config.js`
- `js/api.js`
- `js/app.js`
- `js/admin.js`
- `js/owner.js`
- `index.html`
- `google_apps_script.gs`
- `scratch_audit.js`

## 3. Freeze Status Review (Antigravity Confirmation)
- **`js/app.js` (Cloud-First Boot):** Confirmed. `window.api.loadCloudDatabase()` is called first during `initApp()`. If it fails, the app falls back to `localStorage` cache.
- **`js/api.js` (LocalStorage as Cache):** Confirmed. `localStorage.setItem('crew_app_database', ...)` is only used to mirror successful cloud fetches.
- **`js/config.js` (Production Environment):** Confirmed. `ENVIRONMENT: "production"` is active. Dummy data injections are disabled.

## 4. UAT Checklist
- [x] Confirm `js/app.js` boot successfully loads `window.api.loadCloudDatabase()` before rendering.
- [x] Validate `js/config.js` production environment is active in deployed build.
- [x] Verify the GAS endpoint in `js/api.js` is reachable and returns `success: true`.
- [ ] Test offline fallback: disable network, reload app, confirm `window.crewDatabase` loads from `crew_app_database` if available.
- [ ] Test cloud sync: submit, update, delete actions propagate to backend and refresh local cache.
- [ ] Test file import/export flows in `js/admin.js` and review sync in `js/owner.js`.
- [ ] Check `index.html` Google Setup modal instructions against actual Apps Script deployment steps.
- [ ] Confirm `loadCloudDatabase()` does not overwrite valid local cache when cloud returns zero rows.

## 5. Known Bugs / Issues
- `LOCALSTORAGE_AUDIT.md` notes the current fallback logic must not surface dummy data in production.
- **CORS Issue (Critical):** `js/api.js` uses `fetch(..., { mode: "no-cors" })` in `postData()`. Because of this, the response is opaque. The UI will incorrectly report a "Success" even if the backend fails (e.g., HTTP 500), as long as the network request connects. 
- **CORS Issue (Backend):** Google Apps Script doesn't return CORS headers by default for POST requests unless properly configured with `Content-Type: text/plain` handling.
- **Limitation:** Print CV remains hardcoded for trilingual physical printing while UI is dynamic.

## 6. Fix / Improvement Notes
- **Standardize POST:** `window.api.postData()` is the standardized mechanism. No rogue `fetch` calls exist for POST.
- **Remove `no-cors`:** To achieve true production reliability, `mode: "no-cors"` **must** be removed. 
- **GAS CORS Strategy (Production Ready):** 
  1. In `google_apps_script.gs`, ensure `doPost(e)` returns a valid `ContentService.createTextOutput(JSON.stringify(response)).setMimeType(ContentService.MimeType.JSON)`.
  2. Send requests with `Content-Type: text/plain` from the frontend (which avoids the Preflight OPTIONS request).
  3. Deploy the Google Apps Script as "Execute as: Me" and "Who has access: Anyone".
  4. Once configured, remove `mode: "no-cors"` from `js/api.js` so the frontend can read the `{ success: true }` JSON response natively.

## 7. Production Migration Plan
1. Freeze current code and create production branch from this checkpoint.
2. Update Google Apps Script deployment to a stable `exec` URL.
3. Verify `DEFAULT_GAS_URL` and `getGasUrl()` with the real production URL.
4. Deploy web app to a public host (GitHub Pages) with HTTPS.
5. Run UAT on staging/production endpoint, including offline cache behavior.
6. Collect bug reports from UAT and log them in this file before moving to release.
7. After successful UAT, promote to live production.
