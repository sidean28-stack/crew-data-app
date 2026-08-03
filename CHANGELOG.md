# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0-rc.1] - 2026-08-03
### Added
- Complete Mandarin-Indonesian bilingual translation dictionary in `js/i18n.js`.
- Owner Profile & Review Modal localization in `js/owner.js`.
- Dynamic Google Apps Script configuration modal for live endpoint injection (`js/api.js` & `index.html`).

### Changed
- `js/admin.js` Excel Import and Export functions completely overhauled. Column capacity increased from 13 to 40, ensuring 1:1 mapping with the database.
- `js/candidate.js` Image Gallery rendering modified to support parsing raw Google Drive URLs (from Excel mapping).
- `js/app.js` Boot sequence updated to Cloud-First priority.
- Cache buster versions updated across `index.html` to force clear stale cache in production.

### Fixed
- Fixed bug where `streetAddress` would disappear on Edit Form when data originated from Excel `combinedAddress` mapping.
- Fixed bug where `Nama Kapal` overwrote `Nama Kru` due to generic `.includes("nama")` string matching.
- Fixed bug where Google Apps Script `DEFAULT_GAS_URL` was volatile and missing.
- Fixed bug where bilingual translations on Owner Modal failed to render on live Github Pages due to hardcoded strings.
