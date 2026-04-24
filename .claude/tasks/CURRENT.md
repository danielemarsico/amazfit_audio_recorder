# Task: Replace Todoist API Key with OAuth Authentication — COMPLETED

## Goal
Replace the manual Todoist API key entry with a proper OAuth flow using the Zepp `Auth` component.

## Prerequisites
- [x] Register a Todoist app at https://app.todoist.com/app/settings/integrations/app-management
- [x] Obtain `clientId` and `clientSecret`
- [x] Add to `zepp_app/secrets.js` and `zepp_app/secrets.template.js` as `TODOIST_CLIENT_ID` / `TODOIST_CLIENT_SECRET`

## Implementation Steps
- [x] **`zepp_app/secrets.template.js`** — removed `TODOIST_KEY`, added `TODOIST_CLIENT_ID` / `TODOIST_CLIENT_SECRET`
- [x] **`zepp_app/secrets.js`** — removed `TODOIST_KEY`, added real `TODOIST_CLIENT_ID` / `TODOIST_CLIENT_SECRET`
- [x] **`zepp_app/setting/index.js`** — replaced `TextInput` with `Auth` component; OAuth token saved to `dudu_todoist_key`
- [x] **Redirect URI** — registered `https://zepp-os.zepp.com/app-settings/redirect.html` in Todoist App Management Console
- [x] **Todoist icon** — `Image` component with base64-encoded `todoist.png` added next to section label

## Notes
- `cloudfare_worker/worker.js` and `app-side/index.js` required no changes — OAuth tokens are Bearer tokens identical to API keys
- Zepp uses `https://zepp-os.zepp.com/app-settings/redirect.html` as the redirect URI (visible in the authorize URL query string)
- Use `Image` not `Img` — correct Zepp settings component name

---

# Task: App Store Rejection Fixes (v1.0.1) — COMPLETED

### 1. Black screen on square device — FIXED
- [x] Wrapped `setPageBrightTime` and `pauseDropWristScreenOff` in try/catch in `index.page.js` and `audiolist.page.js`

### 2. Icon not displaying — FIXED
- [x] gt.r and gt.s icons were 248×248; centre-cropped to 240×240 (bip6 was already correct)

### 3. Settings white screen — FIXED
- [x] Added `|| ''` fallback guards on all secret imports in `setting/index.js`
- [x] Added `backgroundColor: "#1a4a8a"` to all `Section` components (were rendering white over the dark background)
- [x] Corrected `DEFAULT_LANG` usage (was hardcoded `"en"`)

### 4. Preview image corners — PENDING (manual)
- [x] Re-export store preview images at 360×360px with rounded transparent corners and re-upload to store listing

---

# Task: review debug and utils — COMPLETED

- [x] Update README.md with the instruction on how to submit a file to the worker and manage TODOIST api key in the command line
- [x] Update CLAUDE.md with the result of the analysis of what files are being included in the zab archive inside the .bin file and which are kept outside

# Task: v1.0.1 Submission

- [X] Perform user testing on physical device (GTR / GTS / Bip6) - manual
- [X] Submit v1.0.1 to the Zepp app store
