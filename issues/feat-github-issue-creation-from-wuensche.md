# feat: GitHub Issue creation from Wünsche-Seite (Admin Panel integration)

## Summary

Posts from the public "Wünsche & Anregungen" page (`/wuensche`) that do not
have a `*** GEFIXT ***` comment should be pushable to GitHub Issues directly
from the Admin Panel — with one click, no manual copy-paste.

## Acceptance Criteria

- [ ] Admin Panel shows a "Als GitHub Issue anlegen" button per SupportMessage
- [ ] Button is hidden if `github_issue_number` is already set (no duplicates)
- [ ] Button is hidden if any comment contains `*** GEFIXT ***`
- [ ] Clicking the button calls `POST /api/support/{id}/github-issue`
- [ ] Created issue uses the SupportMessage category as GitHub label
      (`Funktionswunsch` → `enhancement`, `Fehlermeldung` → `bug`, others → `feedback`)
- [ ] The returned issue number is stored in `SupportMessage.github_issue_number`
- [ ] When a `*** GEFIXT ***` comment is added, the linked GitHub Issue is closed automatically

## Implementation Plan

### Backend

1. **Migration** — add column to `SupportMessage`:
   ```python
   github_issue_number = Column(Integer, nullable=True)
   ```
   Register in `_migrate_columns()` in `main.py`.

2. **Config** — add to `.env` + `config.py`:
   ```env
   GITHUB_TOKEN=ghp_...
   GITHUB_REPO=nicolaybraetter/lsmanagement
   ```

3. **New endpoint** in `backend/app/routers/support.py`:
   ```
   POST /api/support/{id}/github-issue   (admin-only)
   ```
   Calls GitHub REST API `POST /repos/{owner}/{repo}/issues` with:
   - `title`: SupportMessage.subject
   - `body`: formatted markdown with category, message, submitter email (masked), date
   - `labels`: mapped from category

4. **Auto-close hook** — when a comment containing `*** GEFIXT ***` is saved,
   call GitHub API `PATCH /repos/{owner}/{repo}/issues/{number}` with `state: closed`.

### Frontend (Admin Panel)

- In the SupportMessage list/detail view, add button:
  `"Als GitHub Issue anlegen"` (only if `github_issue_number` is null and no GEFIXT comment)
- After success, show badge: `#<issue_number>` linking to the GitHub issue

## Technical Notes

- Use `httpx` (already available via FastAPI ecosystem) for async GitHub API calls
- GitHub PAT requires scope: `public_repo` (or `repo` for private repos)
- Admin-only: protect endpoint with existing admin auth middleware
- Model: `backend/app/models/support.py` — class `SupportMessage`
- Migration helper: `backend/app/main.py` — function `_migrate_columns()`
- Admin router: `backend/app/routers/admin.py` or `support.py`

## Labels

`enhancement` · `admin` · `github-integration`
