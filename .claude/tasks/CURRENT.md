# Task: Replace Todoist API Key with OAuth Authentication

## Goal
Replace the manual Todoist API key entry in the Zepp app settings with a proper OAuth flow using the Zepp `Auth` component. The Cloudflare worker and app-side code need no changes — only the settings UI changes.

## Prerequisites
- [ ] Register a Todoist app at https://app.todoist.com/app/settings/integrations/app-management
- [ ] Obtain `clientId` and `clientSecret`
- [ ] Add them to `zepp_app/secrets.js` (and `zepp_app/secrets.template.js`) as `TODOIST_CLIENT_ID` and `TODOIST_CLIENT_SECRET`

## Implementation Steps

- [ ] **`zepp_app/secrets.template.js`** — Add `TODOIST_CLIENT_ID` and `TODOIST_CLIENT_SECRET` placeholders; remove `TODOIST_KEY`
- [ ] **`zepp_app/secrets.js`** — Add actual `TODOIST_CLIENT_ID` and `TODOIST_CLIENT_SECRET` values; remove `TODOIST_KEY`
- [ ] **`zepp_app/setting/index.js`** — Remove the `TODOIST_KEY` import and the `TextInput` block for the API key (lines ~91-122); replace with an `Auth` component that writes the returned `access_token` to `settingsStorage` under the existing key `dudu_todoist_key`

## Auth Component Config
```js
Auth({
  title: 'Todoist',
  label: 'Connect Todoist',
  description: 'Authorize to create tasks from recordings',
  authorizeUrl: 'https://app.todoist.com/oauth/authorize',
  requestTokenUrl: 'https://api.todoist.com/oauth/access_token',
  clientId: TODOIST_CLIENT_ID,
  clientSecret: TODOIST_CLIENT_SECRET,
  scope: 'task:add',
  onAccessToken({ access_token }) {
    settingsStorage.setItem('dudu_todoist_key', access_token);
  }
})
```

## No Changes Needed
- `zepp_app/app-side/index.js` — already reads `dudu_todoist_key` and sends it as `todoistApiKey`
- `cloudfare_worker/worker.js` — already uses it as a Bearer token
- `scripts/test_debug_ogg.py` — manual key still works for testing
