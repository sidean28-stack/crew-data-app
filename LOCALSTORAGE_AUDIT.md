# LOCALSTORAGE AUDIT & MIGRATION CHECKLIST
*CTO Emergency Directive P0 - Cloud Architecture Migration*

This document audits every instance of LocalStorage usage across the entire project, categorizing them into their current role (Primary Database) and mapping their required transition to the new architecture (Offline Cache Only).

## 1. ACTIVE JAVASCRIPT MODULES

### `js/api.js`
- **Line 8-91**: `function loadLocalDatabase()`
  - **Current**: Reads `crew_app_database`. If empty, it injects 3 Dummy Crew objects.
  - **Action Required**: Remove dummy crew injection. This function MUST ONLY read the cache. Rename/repurpose to strictly `loadCacheDatabase()` or strictly fallback without dummy seeding.
- **Line 93-95**: `function saveLocalDatabase()`
  - **Current**: Writes `window.crewDatabase` to `crew_app_database`.
  - **Action Required**: This is acceptable as a CACHE WRITE, but should only be called after a successful cloud fetch or a successful sync.

### `js/app.js` (Boot Sequence)
- **Line 75-87**: `bootstrap()` -> `loadCloudDatabase()` / `loadLocalDatabase()`
  - **Current**: Attempts cloud, falls back to local.
  - **Action Required**: The fallback logic is correct, but currently `loadLocalDatabase()` injects dummy data if cache is empty. We must ensure dummy data never surfaces in production.

### `js/candidate.js`
- **Line 191**: `if (typeof saveLocalDatabase === 'function') saveLocalDatabase();`
  - **Current**: Invoked during `submitCrewForm()`.
  - **Action Required**: When a crew submits, the local cache is updated immediately to reflect the new state, but it should be a Cache Update.

### `js/owner.js`
- **Line 222**: `if (typeof saveLocalDatabase === 'function') saveLocalDatabase();`
  - **Current**: Invoked during `setReviewStatus()` / `saveReviewNotes()`.
  - **Action Required**: Must act as a local cache update, but the authoritative push must go to GAS.

### `js/admin.js`
- **Line 119**: `if (typeof saveLocalDatabase === 'function') saveLocalDatabase();` (Inside Delete Crew)
- **Line 320**: `if (typeof saveLocalDatabase === 'function') saveLocalDatabase();` (Inside Import Excel)
  - **Action Required**: Admin edits/deletes update the cache. Ensure API fetch forces a refresh after these actions.

---

## 2. OBSOLETE FILES (To be deleted during Housekeeping)

### `app.js` (Root Directory)
- **Lines 198, 213, 222, 226, 709, 1020**: Multiple references to `loadLocalDatabase`, `crew_app_database`, `saveLocalDatabase`.
- **Status**: This file is a legacy monolithic prototype. It is NOT linked in `index.html` (which correctly uses `js/app.js`).
- **Action Required**: Flag for deletion. Exclude from migration.

---

## MIGRATION ROADMAP (Cloud Database Priority)

1. **Eliminate Dummy Data**: Strip the 3 dummy crew hardcoded array from `js/api.js` `loadLocalDatabase()`. 
2. **Promote `getAllCrew`**: The boot sequence MUST aggressively await `getAllCrew()` before rendering.
3. **CORS Fix**: Remove `mode: "no-cors"` from `js/candidate.js`, `js/owner.js`, and `js/admin.js` fetch calls. They must utilize `window.api.postData` correctly to parse responses.
4. **Cache Paradigm**: LocalStorage `crew_app_database` will only serve as a read-only offline fallback and will be aggressively overwritten upon every successful `getAllCrew()` response.
