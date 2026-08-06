# Antigravity Working Rules - Crew Data App

These instructions are mandatory for every Antigravity/Gemini session working in this repository.

## 1. Production Context

- Repository: `sidean28-stack/crew-data-app`
- Production branch: `main`
- Production web: `https://sidean28-stack.github.io/crew-data-app/`
- Production Apps Script endpoint is defined only by `DEFAULT_GAS_URL` in `js/api.js`.
- Current production endpoint:
  `https://script.google.com/macros/s/AKfycbyrrukuwvqMkCgF7T9QRwRmzsdHbSeOXUf4g8XF4QqHZdwZqTATT7ce3kWbbk97dgzF/exec`
- Apps Script source: `google_apps_script.gs`
- Apps Script project configuration: `.clasp.json` and `appsscript.json`
- The modular scripts loaded by `index.html` are authoritative. Do not edit the legacy root `app.js` unless its continued use has first been proven.

## 2. Mandatory Start Procedure

Before proposing or changing code:

1. Read this file completely.
2. Run `git status --short` and `git log -3 --oneline`.
3. Inspect all local modifications and preserve changes that were not created in the current task.
4. Read the relevant code and confirm which script is actually loaded by `index.html`.
5. For production defects, reproduce or verify the current live behavior before editing when possible.

Never assume the worktree is clean, the local implementation is deployed, or a browser cache represents the latest commit.

## 3. Prohibited Operations

Do not perform any of these operations without an explicit, task-specific instruction from the project owner:

- `git reset --hard`, destructive checkout, history rewrite, rebase of shared history, or force-push.
- Deleting or overwriting production crew, Forms responses, spreadsheet rows, Drive files, deployments, or credentials.
- Changing spreadsheet structure, column order, API schema, production endpoint, access permissions, or OAuth configuration.
- Deploying, pushing, or merging unrelated local changes.
- Adding local-only fallback data as if it were synchronized production data.
- Exposing tokens, private crew data, document URLs, personal identifiers, or secrets in logs, commits, screenshots, or chat output.

Never bypass a failing test, suppress an error, or claim success merely because a request returned HTTP 200.

## 4. Change Discipline

- Keep changes narrowly scoped to the requested behavior.
- Follow the existing modular structure in `js/` and the existing visual design in `styles.css`.
- Preserve Indonesian and Mandarin behavior together. Any user-facing field, detail view, status, notification, or owner workflow must be checked in both languages.
- Escape user and spreadsheet data before inserting it into HTML.
- Do not use owner name alone as authorization when a token or persisted owner identity is available.
- `ON_BOAT` and `SELECTED` crew must remain hidden from unrelated owners. Only the matching owner/company or an administrator may see restricted crew and their history.
- All form fields must remain aligned with the production spreadsheet and Excel importer. Import mapping must use normalized headers, not fixed column positions.
- Multi-device state must come from the production backend. Local storage is cache only and must never silently override cloud data.
- Google Drive document URLs must be normalized through the existing image resolver.
- Document previews must stay above detail modals and retain previous/next, keyboard navigation, position counter, and download behavior.

## 5. Backend and Data Rules

- Treat `google_apps_script.gs` as production backend code.
- Keep existing sheet columns backward compatible. Add new columns only at the end unless a migration is explicitly approved.
- Validate action names, IDs, statuses, and payload fields on the backend.
- After any write operation, perform a fresh cloud read and verify the exact changed fields.
- A resolved `no-cors` request confirms dispatch only; it does not confirm persistence.
- Use one synthetic record for end-to-end tests. Give it a clear `SYNTH-` or `TEST-` identifier and remove it after verification.
- Never use real crew data for destructive tests.

## 6. Required Verification

For frontend changes:

- Run `node --check` on every modified JavaScript file.
- Run `git diff --check`.
- Test the affected workflow on desktop and mobile widths when layout or modals change.
- Check browser console errors and confirm that the critical error modal is inactive.
- Verify the exact cache-busted asset version loaded by the live page.

For Apps Script changes:

- Test the endpoint with `action=ping` and `action=getAllCrew`.
- Confirm `success`, crew count, and the expected response schema.
- After deployment, confirm the intended deployment ID and version.
- Test a synthetic write/read/delete cycle when the change affects persistence.

For owner visibility changes, test at least:

1. Anonymous/unrelated owner cannot see restricted crew.
2. Matching owner/company can see its selected or on-boat crew.
3. Admin can still see all crew.
4. Owner history and documents belong to the correct crew and owner.

## 7. Publishing Procedure

Do not publish until required checks pass.

1. Review `git diff` and confirm only intended files are included.
2. For backend changes, run `clasp push`, deploy the intended production deployment, and record its version.
3. Commit with a specific message that describes behavior, not generic text such as `fix` or `update`.
4. Push only the intended branch without force.
5. Wait for GitHub Pages to serve the new cache-busted assets.
6. Reload the production URL and verify the complete live workflow.
7. Run `git status --short` and leave the worktree clean unless pre-existing user changes remain.

## 8. Reporting Standard

Every completion report must state:

- What changed.
- Files changed.
- Tests performed and their actual results.
- Commit hash, push status, and Apps Script deployment version when applicable.
- Any remaining risk, untested scenario, or manual action.

Do not say `fixed`, `synchronized`, `safe`, or `live` without evidence from the production system.
