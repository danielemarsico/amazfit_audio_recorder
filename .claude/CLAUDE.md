# CLAUDE.md — Developer Notes for AI Assistants

## Build System

The watch app is built with **Zeus CLI** (`zeus build`). The command is interactive (checkbox
prompt to select device targets). Auto-accept all pre-checked targets with:

```bash
printf '\n' | zeus build
```

Built packages land in `zepp_app/dist/` as `.zab` files.

---

## ZAB Package Structure and Module Bundling

Understanding what ends up where inside a built `.zab` is important when diagnosing missing-module
issues or checking that local helper files are included.

### File hierarchy inside a `.zab`

```
<appId>-<name>-<version>.zab
  └── <deviceType>.zpk          (one per target, e.g. gtr4.zpk, bip6.zpk)
        ├── device.zip
        │     ├── app.js.bin             ← app lifecycle (bundled)
        │     └── page/gt/home/
        │           ├── index.page.bin   ← main page (bundled, see below)
        │           └── audiolist.page.bin
        └── app-side.zip
              └── app-side/index.js.bin  ← companion bridge (bundled)
  └── app-settings/
        └── index.js                     ← settings page (plain JS, not bytecode)
```

### What Rollup bundles into each `.bin`

Zeus uses **Rollup** to compile device-side JS pages. For each page entry point (e.g.
`index.page.js`), Rollup follows all **local** `import` statements and inlines them into a single
bundle, then the Zeus toolchain converts it to `.bin` bytecode.

Concretely for this project, `index.page.bin` contains the merged code of:

| Source file | Role |
|---|---|
| `page/gt/home/index.page.js` | Entry point — UI, lifecycle |
| `page/gt/home/audioController.js` | Recording, file ops, BLE sync |
| `page/gt/home/recorderFacade.js` | Recorder/player abstraction |
| `page/gt/home/config.js` | App-wide constants |
| `secrets.js` | Runtime secrets (URL, API key, language) |

Evidence: `index.page.js` is ~8 KB; `index.page.bin` is ~18 KB — the size increase comes from the
four inlined modules. The Zeus build log also reports `[ROLLUP] Transform 5 JS files`.

### What is NOT bundled (stays external)

`@zos/*` imports (e.g. `@zos/media`, `@zos/sensor`, `@zos/ble`) are marked as **external** by the
Rollup config. They are provided by the ZeppOS runtime on the device at runtime and must not be
bundled. The bytecode references them by name; the OS resolves them.

### Settings page

`setting/index.js` is **not** compiled to bytecode. It runs in a WebView inside the Zepp companion
app and is delivered as plain JavaScript. It is bundled similarly (Rollup), but the output is plain
`.js`, not `.bin`. All imports in `setting/index.js` must resolve to inline-able modules — there is
no OS-provided module loader in the WebView context.

---

## OAuth / Todoist Integration

- The `Auth` component (Zepp settings API) handles the full OAuth flow.
- **Redirect URI** that Zepp sends to Todoist: `https://zepp-os.zepp.com/app-settings/redirect.html`
  This is not documented; it was discovered by inspecting the browser URL bar when the OAuth flow
  opened. Register this exact URI in the Todoist App Management Console.
- OAuth access tokens are functionally identical to Todoist personal API tokens — the worker sends
  them as `Authorization: Bearer <token>` and requires no changes for OAuth vs. manual key.
- The token is stored via `props.settingsStorage.setItem("dudu_todoist_key", access_token)` in the
  settings page and read by `app-side/index.js` when building the upload request.
- **As of v1.0.2**, a manual API key `TextInput` is also shown in the settings page as a fallback.
  Both methods write to `dudu_todoist_key`. See the "Packaged App vs Zeus Preview" section for why
  the fallback was added.

---

## Packaged App vs Zeus Preview — Known Divergence (v1.0.2)

The app works correctly under `zeus preview` but exhibited two failures when submitted as a
packaged `.zab` to the Zepp App Store. This divergence is the root of the v1.0.2 effort.

### Symptom 1 — Black screen on launch

The main page (`index.page.js`) crashed silently on startup in the packaged version. Root cause
was not confirmed because the packaged app cannot be debugged directly (no console access without
zeus). Leading hypothesis: `create(id.RECORDER)` in `@zos/media` is called before the ZeppOS
media/mic subsystem is fully initialised, which takes longer in a cold-installed package than in
a zeus preview session (where the runtime is already warm).

**Mitigations applied (v1.0.2):**
- `countdownWidget` is created first and always visible, even before settings are fetched, so the
  screen is never blank — it shows "Starting..." then the duration, or an error message.
- A 500 ms initial delay is inserted before the first `doStartRecording()` call (inside the
  `fetchSettings` callback) to give the runtime more time to initialise.
- `doStartRecordingWithRetry(3)` wraps the recorder init: on failure it waits 1 s and retries up
  to 3 times (3.5 s total window). Each failure is logged via `console.log` with the full error
  string and attempt number so that if zeus preview can reproduce it the cause is visible.
- The entire widget-creation block is wrapped in `try/catch`; any uncaught init error writes
  `"INIT ERR: <message>"` to the countdown widget instead of leaving a black screen.
- `audiolist.page.js` received the same treatment: `statusWidget` is created as the very first
  widget so it is available as an error surface for any subsequent build failure.

### Symptom 2 — Todoist OAuth showed `invalid_client`

The OAuth authorize URL contained `client_id=` (empty). Not reproduced in preview because the
OAuth flow was never tested there. The packaged `app-settings/index.js` had the correct client_id
bundled (confirmed by inspecting `secrets.js`). Exact root cause not isolated — possibly a Zepp
platform issue with the `Auth` component under certain conditions.

**Mitigation applied (v1.0.2):**
- The Todoist section in `setting/index.js` now offers **both** OAuth and a manual API key
  TextInput. Both write to `dudu_todoist_key`, which `app-side/index.js` already reads. The last
  value written wins. This makes Todoist integration work even if OAuth continues to fail.
- A status line ("Status: Connected" / "Status: Not configured") shows the current state based on
  whether `dudu_todoist_key` is set in `settingsStorage`.

### General debugging constraint

**There is no way to attach a debugger to a packaged ZeppOS app.** Console output is only
visible during `zeus preview`. When diagnosing packaged-only failures:
1. Add `console.log` calls with full error strings before building.
2. Reproduce under `zeus preview` where possible (not all failures reproduce).
3. Use on-screen widget text as a last-resort crash indicator.

---

## Todoist Authentication

Two methods are supported and both write to `settingsStorage` key `dudu_todoist_key`:

| Method | Component | Notes |
|---|---|---|
| OAuth | `Auth` (Zepp settings API) | Full flow via Todoist authorize endpoint. May fail in packaged app — see above. |
| API key | `TextInput` | Paste a Todoist personal API token directly. Reliable fallback. |

`app-side/index.js` reads `dudu_todoist_key` and sends it as `body.todoistApiKey` in the upload
request to the Cloudflare worker. No app-side changes are needed regardless of which auth method
was used.

---

## Known Pitfalls

### Base64 embedding in setting/index.js

Never embed large base64 strings by manually transcribing them through the Edit tool — the tool
renders PNG files visually, so the base64 gets corrupted. Instead use a Python script that reads
the PNG file directly:

```python
import base64, re

with open("deployment_resources/todoist.png", "rb") as f:
    b64 = base64.b64encode(f.read()).decode("ascii")

with open("zepp_app/setting/index.js", "r", encoding="utf-8") as f:
    js = f.read()

# locate and replace the existing base64 payload
start = js.index('data:image/png;base64,') + len('data:image/png;base64,')
end   = js.index('"', start)
js = js[:start] + b64 + js[end:]

with open("zepp_app/setting/index.js", "w", encoding="utf-8") as f:
    f.write(js)
```

### `Image` vs `Img`

The correct Zepp settings API component name for displaying an image is **`Image`**, not `Img`.
Using `Img` causes a silent crash (settings WebView exits within ~3 seconds, reasonCode 11→12 in
the debug log).

### Icon dimensions

ZeppOS app store requires watch icons to be exactly **240×240 px**. The gt.r and gt.s icons were
generated at 248×248 and caused a rejection. Fix with a pure-Python PNG centre-crop (no PIL
needed) — see `scripts/` or git history for the crop script used.

### Interactive zeus build

`zeus build` opens an interactive checkbox prompt and hangs in non-TTY environments. Use:
```bash
printf '\n' | zeus build
```
