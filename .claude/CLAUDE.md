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
