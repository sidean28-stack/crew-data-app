# CrewERP Build Workflow & Rules

The following rules dictate the strict Enterprise build process for the CrewERP project. Antigravity must follow these rules at all times.

## 1. Development Phase
- **Action**: Antigravity is allowed to make as many changes as needed.
- **Status**: `Development`
- **Constraint**: DO NOT commit. DO NOT consider changes "Accepted".

## 2. Review Phase
- **Action**: All modified files (e.g., `candidate.js`, `admin.js`, `index.html`) enter Review Changes.
- **Constraint**: The CTO will audit the changes. NO files are "Accepted" at this stage.

## 3. Quality Gate Phase
- **Action**: Perform comprehensive checks before any build is finalized.
- **Checklist**:
  - [ ] Architecture
  - [ ] Regression
  - [ ] UI
  - [ ] Google Sheets
  - [ ] Google Drive
  - [ ] Bilingual (100% coverage, no hardcoded texts)
  - [ ] Print CV
  - [ ] Import Excel
  - [ ] Export CSV
  - [ ] Edit
  - [ ] Delete
  - [ ] Owner Profile
  - [ ] Candidate Form
  - [ ] Admin Dashboard
- **Constraint**: If any revisions are needed, immediately return to **Development Phase**.

## 4. Final Review & Housekeeping
- **Trigger**: Only activated when the CTO explicitly states: `FINAL BUILD APPROVED`
- **Action**: Execute Housekeeping protocol:
  1. Compare every modified file.
  2. Identify obsolete files.
  3. Identify duplicate files.
  4. Identify temporary files.
  5. Identify experimental code.
  6. Identify unused functions.
  7. Identify dead code.
  8. Identify duplicated translations.
  9. Identify duplicated CSS.
  10. Identify duplicated JS.
  11. Remove everything that is no longer referenced.
  12. Keep project structure clean.
  13. Review imports.
  14. Review dependencies.
  15. Review folder structure.
  16. Review naming consistency.
  17. Only keep production-ready files.
  18. Never delete anything still referenced.
  19. Produce `CLEANUP_REPORT.md`
- **Constraint**: Do not automatically Accept changes. Wait for CTO approval.

## 5. Final Production Build
- **Trigger**: Only activated when the CTO explicitly states: `FINAL PRODUCTION BUILD`
- **Action**: 
  - Accept ONLY production-ready files.
  - Reject every experimental, temporary, duplicated, obsolete, debug, test, and prototype file.
  - Generate final artifacts: `BUILD_REPORT.md`, `CHANGELOG.md`, `VERSION.md`, `PROJECT_STATUS.md`.
- **Status**: The build is now considered **RELEASE READY**.

---
*By strictly adhering to this workflow, the repository remains pristine, preventing codebase rot and ensuring a solid foundation for future scaling.*
