# Changelog

All notable changes to the DuDu ZeppOS app are tracked here. Dates are in
YYYY-MM-DD format.

## [Unreleased]

### Changed
- **AI post-processing task moved to the worker repo.** The "improve
  audio-to-note conversion with AI post-processing" item in `TASKS.md` moved
  to [dudu-worker](https://github.com/danielemarsico/dudu-worker) with the
  worker itself — it names `worker.js` functions and needs no `zepp_app/`
  change, and the T-Embed assistant now needs the same transcript→answer step
  on its own route, so it belongs where both consumers can see it. `TASKS.md`
  here keeps a pointer.
- **Transcription quality improved with no app change.** `/upload` moved
  server-side from `@cf/openai/whisper` to
  `@cf/openai/whisper-large-v3-turbo` (2026-09-05). Non-English audio
  transcribes noticeably better — the same Italian clip went from *"aggiungi
  latte alla lista della spesa di domani."* to *"Aggiungi il latte alla lista
  della spesa di domani."* Since the transcript becomes the Todoist task
  title verbatim, the difference is user-visible. The URL and API key are
  unchanged, so the watch needs no reconfiguration or re-flash.

- **The Cloudflare Worker moved to its own repository:**
  [danielemarsico/dudu-worker](https://github.com/danielemarsico/dudu-worker).
  `cloudfare_worker/` is removed here. The T-Embed assistant
  (`tembed_assistant`) needs the same worker, and a shared backend shouldn't
  live inside one of its consumers. **Nothing about this app changes** — the
  deployed worker keeps its name (`dudu-transcription`) and therefore its
  URL, so no watch settings need updating, and `/upload` and `/debug-ogg`
  are behaviourally identical.
  - The new repo documents the full HTTP contract in its `API.md`
    (endpoints, fields, and a complete error-response table that was never
    written down here), and carries an offline test suite (`npm test`)
    covering both routes.
  - Also dropped there: the stale `OPENAI_API_KEY` mention in `worker.js`'s
    header comment (no OpenAI key is used — transcription runs through the
    Workers AI binding), and the tracked
    `.wrangler/cache/wrangler-account.json`, which recorded the Cloudflare
    account id/name and shouldn't have been committed.
  - `README.md` here now points at the new repo for deployment, the HTTP
    API, local worker dev, and redeployment.

## [1.0.4] - 2026-07-27

### Fixed

- **Likely root cause of the packaged-app black screen (Symptom 1 in
  `.claude/CLAUDE.md`) found and fixed.** `zepp_app/app.json` listed three
  plain helper modules — `audioController.js`, `config.js`,
  `recorderFacade.js` — in the `bip6` target's `module.page.pages` array
  alongside the two real pages (`index.page`, `audiolist.page`). Per ZeppOS's
  app.json reference, `pages` is meant to hold only page entry points (files
  that call `Page(...)`); these three files never call `Page(...)`. Listing
  them there made Zeus/QJSC compile each one into its own orphaned, invalid
  page `.bin` with no page lifecycle registered.
  Confirmed by decompiling a local build:
  - **Before the fix:** the packaged `.zab` contained 5 top-level `.bin`
    files (`index.page.bin`, `audiolist.page.bin`, plus stray
    `audioController.bin`, `config.bin`, `recorderFacade.bin`).
  - **After the fix:** only the 2 real page `.bin` files remain, at the same
    byte sizes as before — confirming the helper modules are still correctly
    inlined into the two pages via normal Rollup `import` bundling, exactly
    as documented in `.claude/CLAUDE.md`'s bundling section. Nothing was lost;
    only the invalid duplicate page entries were removed.
  - These three entries were added in commit `3957494` ("release 1.0.2 bug
    fixing pre test") — the same commit meant to fix this exact crash. That
    change was well-intentioned but wrong: it didn't help, and plausibly made
    things worse.
  - This class of bug — declaring invalid pages that pass fine under `zeus
    preview` (which just launches `index.page` directly) but can trip stricter
    validation in a real packaged/installed app — matches the "works in
    preview, black screen when packaged" divergence exactly. Root cause
    confidence: high, but not proven on-device (no physical Bip 6 was
    available in this environment to confirm the crash is gone). Please
    re-test the packaged build on your Bip 6 and report back.

- **Settings page language selector silently ignored the saved value.** In
  `zepp_app/setting/index.js`, the `Select` component for "Transcription
  Language" was passed `defaultValue: currentLanguage`. Per ZeppOS's
  app-settings `Select` component reference, there is no `defaultValue` prop
  — the selected option is controlled exclusively via `value`. Changed to
  `value: currentLanguage`. Before this fix, reopening the settings page
  would not reliably show the previously-saved language selection. This is
  one plausible explanation for "the settings app does not work very well."

### Changed

- Bumped `@zeppos/zml` from `0.0.38` → `0.0.43` and `@zeppos/device-types`
  (dev-only, type declarations) from `^3.0.0` → `^4.0.0`. Verified the
  runtime-relevant exports (`BaseApp`, `BasePage`, `BaseSideService`,
  `settingsLib`) are unchanged between versions, and confirmed a clean
  rebuild afterwards. `@zos/media` (used for the recorder/player) still has
  no official TypeScript declarations in `@zeppos/device-types` in either
  version — this is a docs/typings gap upstream, not a bug in this project;
  it doesn't affect the runtime since ZeppOS provides `@zos/media` on-device
  regardless of type declarations.
- Bumped app version to 1.0.4 (code 4).

### Development environment

- Installed `@zeppos/zeus-cli` globally (`npm install -g @zeppos/zeus-cli`,
  v1.9.3). Note: the README's documented install command
  (`npm install -g @zeppos/zeus`) targets a package name that no longer
  publishes under that name on npm — the current CLI package is
  `@zeppos/zeus-cli`. The README should be updated (not changed in this pass
  since it was out of scope for the crash investigation).
  installed cleanly.
- Ran `npm install` inside `zepp_app/` — no prior `node_modules` existed on
  this machine.
- Created `zepp_app/secrets.js` from `zepp_app/secrets.template.js` so a
  local build could be produced and inspected. **This file only contains
  placeholder values** (`https://your-worker.workers.dev/upload`, etc.) — it
  is gitignored (confirmed via `git check-ignore`) and was never at risk of
  being committed, but you must edit it with your real Cloudflare Worker URL,
  API key, and Todoist OAuth credentials before publishing, or uploads/OAuth
  will not work even though the app itself will run fine.

### Investigated, no change made

- Checked whether ZeppOS's dynamic `requestPermission()` API (new-ish,
  `@zos/app`) is required for the mic permissions this app already declares
  statically (`data:os.mic.record`, `device:os.mic` in `app.json`). Per
  ZeppOS's permission-control docs, permissions declared in `app.json`'s
  static `permissions` array — which both of these already are — trigger an
  install-time consent dialog and do not require an additional runtime
  `requestPermission()` call. No change needed here.
- Checked the Amazfit Bip 6's actual OS: it shipped with ZeppOS 4.5 and was
  updated to ZeppOS 5 in mid-2025. This app's `app.json` declares
  `runtime.apiVersion` `compatible`/`target`/`minVersion` all as `"3.0"`.
  This is a floor, not a ceiling — ZeppOS API versioning is backward
  compatible, so a "3.0" app runs fine on a "5.0" device. Left as-is; raising
  the target would only make sense if you want to opt into newer APIs
  (e.g. `@zos/user`, `@zos/utils` additions in `@zeppos/device-types` 4.0.0),
  which nothing in this app currently needs.
- Reviewed the Todoist OAuth `Auth` settings component against ZeppOS docs:
  it has no `redirectUri`, `onError`, or `onReturn`-with-error prop — the
  redirect URI is fixed by the platform (as `.claude/CLAUDE.md` already
  documents) and the component gives no way to surface OAuth failures to the
  user beyond the existing "Status: Connected / Not configured" line. No
  further fix available on our side beyond the manual API-key fallback
  already implemented in v1.0.2.

## [1.0.3] - 2026-05-23 (prior release, see git history)

- Installed `@zeppos/zml` as a real local dependency so Rollup bundles it
  instead of treating it as external (previously caused `API NOT EXIST` on
  device).
- Fixed a stray `},` that broke a `try/catch` in `audiolist.page.js`.
- Removed unused `zepp_app/utils/index.js`.

## [1.0.2] and earlier

See git log for full history prior to this file's introduction. Notable
prior work is summarized in `.claude/CLAUDE.md` under "Packaged App vs Zeus
Preview — Known Divergence (v1.0.2)".
