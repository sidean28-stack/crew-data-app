# FEATURE FREEZE
*Crew Management System*

## Current Version
**v1.1.2**

## Current Build Status
**Development Candidate**

---

## 1. Completed Features
- **Full Bilingual UI Standardization (v1.1.1):** Replaced all hardcoded text. Implemented dynamic language engine (`i18n.js`).
- **Physical Data Standardization (v1.1.2):** Integrated `heightCm` and `weightKg` across UI, Forms, Print CV, Import/Export, and Google Apps Script endpoints.
- **Backward Compatibility Validation:** Expanded Google Sheets column mapping (up to index 40) non-destructively, ensuring older 38-column rows do not break.

## 2. Pending Features
- **Cloud Synchronization (Phase 3):** Specifically the `loadCloudDatabase()` routine which dictates Boot -> Cloud Check -> Local Cache update. (Currently PAUSED per CTO directive).

## 3. Deferred Features
- **Role Management / Login:** Deferred to CrewERP v2 roadmap.
- **Advanced 2-Way Conflict Resolution:** Deferred until Cloud Sync foundation is established.

## 4. Known Bugs
- *None identified during current Quality Gate review.*

## 5. Known Limitations
- Application startup currently strictly loads `loadLocalDatabase()` as a blocking render requirement, meaning a fresh browser without localStorage relies entirely on an immediate Cloud Sync.
- Print CV is strictly trilingual and hardcoded for physical paper printing, which diverges from the dynamic UI language toggler, though this is the intended business behavior.

## 6. Regression Risks
- Adding columns (Height/Weight) to Google Sheets via `doPost` implies older records will simply have blank values. Any future script looping backward must gracefully handle `null` or `undefined` for these fields.
- Excel Import mapping relies heavily on accurate keyword headers. Mismatched column names by third-party Owners could result in unmapped variables.

## 7. Technical Debt
- Some legacy experimental functions might still exist unreferenced in `admin.js` or `owner.js` from previous prototyping. This will be targeted during the upcoming Housekeeping phase.

## 8. Architecture Notes
- The translation engine (`t()`) relies on a global variable dictionary. 
- Form submission relies on capturing base64 encoded strings and delivering via `text/plain` payload to circumvent CORS constraints on Google Apps Script.
- Spreadsheets serve as a robust yet decoupled persistence layer.

## 9. Future Backlog
- Complete Cloud Synchronization (Phase 3).
- Crew Authentication & Security layer.
- Master Data Management (e.g., dynamic vessel dropdowns directly sourced from Cloud).

## 10. Release Recommendation
- **Recommendation:** Proceed to Housekeeping. No further feature development is required for the v1.1.2 branch.
- **Freeze Status:** Repository is frozen at this checkpoint for production migration planning. All UAT/debug/fix references are summarized in `FREEZE_BACKUP.md`.

## 11. Production Readiness Notes
- `js/app.js` already implements a cloud-first bootstrap.
- `js/api.js` now treats localStorage as an offline cache only, removing any development dummy injection from `loadLocalDatabase()`.
- `js/config.js` is configured for `ENVIRONMENT: "production"`.
- Real online deployment requires proper CORS and Apps Script endpoint configuration beyond this freeze.

---
*Status locked. Awaiting CTO approval for FINAL BUILD APPROVED.*
