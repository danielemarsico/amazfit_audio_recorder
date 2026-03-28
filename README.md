# DuDu — Voice Memo Recorder for Amazfit Smartwatches

Records voice memos on ZeppOS 3.0 watches, syncs them to your phone via BLE,
and uploads them to a Cloudflare Worker that transcribes the audio using
Cloudflare Workers AI (Whisper). Optionally creates a Todoist task from the
transcription.

**Supported watches:** Amazfit Bip 6, GTR Mini, GTR 3, GTR 3 Pro, GTR 4, GTS 3, GTS 4, GTS 4 Mini

---

## How It Works

1. Open DuDu on the watch — recording starts immediately
2. Recording stops after the configured duration (default 30 s) or when you tap **STOP**
3. Open the recordings list, tap **SYNC** — the file is uploaded to your Cloudflare Worker via HTTP
4. The worker converts the audio, transcribes it with Whisper, and optionally creates a Todoist task due today — then returns the transcription to the watch
5. Tap **X** on the list to delete a recording from the watch once synced

---

## Project Structure

```
zepp_app/
  app.js                      App lifecycle
  app.json                    App config, page routes, permissions
  secrets.js                  Local secrets (gitignored) — copy from secrets.template.js
  secrets.template.js         Template for secrets.js
  setting/index.js            Companion app settings page (URL, API key, language,
                              Todoist key, recording duration)
  page/gt/home/
    index.page.js             Main recording page
    audiolist.page.js         Recordings list (play, sync, delete)
    audioController.js        Core logic: recording, file ops, sync, BLE transfer
    recorderFacade.js         Recorder/player abstraction
  assets/                     Icons per screen shape (round/square/bip)

cloudfare_worker/
  worker.js                   Cloudflare Worker: receives upload, converts
                              ZeppOS Opus → Ogg-Opus in memory, transcribes
                              with Cloudflare Workers AI (@cf/openai/whisper),
                              optionally creates a Todoist task
  wrangler.toml               Worker config (name, AI binding)
  package.json                Dev dependencies (wrangler)

dummy_server/
  server.py                   Local Python server for testing uploads without
                              the Cloudflare Worker (saves files to disk)
  opus_convert.py             Converts ZeppOS Opus to standard Ogg-Opus

scripts/
  test_debug_ogg.py           Test script for the worker endpoints
  test-ogg.txt                Quick curl/python command references
```

---

## Prerequisites

- **Node.js >= 18** — https://nodejs.org
- **Zeus CLI** — `npm install -g @zepp-os/zeus`
- **Zepp app** on your phone with developer mode enabled
- **Cloudflare account** (free tier is sufficient) — https://cloudflare.com
- **ZeppOS 3.0 watch** (see supported watches above)

---

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/danielemarsico/amazfit_audio_recorder.git
cd amazfit_audio_recorder
```

### 2. Create your secrets file

```bash
cp zepp_app/secrets.template.js zepp_app/secrets.js
# Edit zepp_app/secrets.js and fill in your values
```

`secrets.js` is gitignored and will never be committed.

### 3. Install watch app dependencies

```bash
cd zepp_app
npm install
cd ..
```

### 4. Deploy the Cloudflare Worker

```bash
cd cloudfare_worker
npm install

# Log in to Cloudflare (opens a browser)
npx wrangler login

# (Recommended) Set a secret API key to protect your endpoint.
# Choose any long random string and save it — you cannot retrieve it from Cloudflare later.
npx wrangler secret put API_KEY

# Deploy
npm run deploy
```

At the end you will see your worker URL, e.g.:
```
https://dudu-transcription.<your-subdomain>.workers.dev
```

```bash
cd ..
```

### 5. Configure the watch app settings

Open the **Zepp phone app → My Devices → your watch → DuDu → Settings**:

| Setting | Value |
|---|---|
| Upload URL | `https://dudu-transcription.<your-subdomain>.workers.dev/upload` |
| API Key | the key you set in step 4 (or leave blank to skip auth) |
| Todoist Key | *(optional)* your Todoist API token — creates a task from each transcription |
| Language | transcription language hint sent to Whisper (default: English) |
| Duration | recording length in seconds, 5–60 (default 30) |

### 6. Build and sideload the watch app

```bash
cd zepp_app
zeus build
# Install the built .zab file via the Zepp developer tools or simulator
```

---

## Worker HTTP API

### `POST /upload`

Transcribes audio and optionally creates a Todoist task.

**Request body (JSON):**

| Field | Type | Required | Description |
|---|---|---|---|
| `data` | string | yes | Base64-encoded ZeppOS Opus audio |
| `fileName` | string | no | Original file name, echoed in response |
| `apiKey` | string | no | API key (alternative to `Authorization` header) |
| `language` | string | no | BCP-47 language code for Whisper, e.g. `"en"`, `"it"`. Defaults to `"en"` |
| `todoistApiKey` | string | no | Todoist API token — if provided, a task is created from the transcription |

**Authorization header (alternative to `apiKey` in body):**
```
Authorization: Bearer <API_KEY>
```

**Response (JSON):**

| Field | Type | Description |
|---|---|---|
| `ok` | bool | `true` on success |
| `file` | string | echoed `fileName` |
| `size` | number | raw audio size in bytes |
| `transcription` | string | transcribed text |
| `todoistTask` | object\|null | Todoist task object, or `null` if not requested |

---

### `POST /debug-ogg`

Same request format as `/upload`, but returns the converted Ogg-Opus file instead of transcribing — useful for verifying audio conversion.

**Response:** `audio/ogg` binary with headers:
- `X-Frame-Count` — number of Opus frames parsed
- `X-Ogg-Size` — size of the output Ogg file in bytes

---

### `GET /`

Health check — returns a plain-text confirmation that the worker is running.

---

## Testing

### Test the worker from the command line

```bash
# Test Ogg conversion only (downloads converted.ogg)
python scripts/test_debug_ogg.py <path-to-opus> \
  --url https://dudu-transcription.<your-subdomain>.workers.dev \
  --api-key <API_KEY>

# Transcribe with language hint
python scripts/test_debug_ogg.py <path-to-opus> \
  --url https://dudu-transcription.<your-subdomain>.workers.dev \
  --api-key <API_KEY> --upload --lang it

# Transcribe and create a Todoist task
python scripts/test_debug_ogg.py <path-to-opus> \
  --url https://dudu-transcription.<your-subdomain>.workers.dev \
  --api-key <API_KEY> --upload --lang it --todoist-key <TODOIST_KEY>
```

### Local worker dev server

Requires a Cloudflare login — the AI binding needs a real connection:

```bash
cd cloudfare_worker
npm run dev   # starts at http://localhost:8787
```

### Local dummy server (no Cloudflare needed)

Saves uploads to disk without transcription — useful for verifying the watch upload before involving the cloud:

```bash
cd dummy_server
python server.py --port 9000
# Set the watch app Upload URL to: http://<your-local-ip>:9000/upload
# Converted .ogg files appear alongside the .opus files in dummy_server/recordings/
```

---

## Redeployment

After changes to `worker.js`:
```bash
cd cloudfare_worker && npm run deploy
```

After changes to the watch app:
```bash
cd zepp_app && zeus build
# reinstall on watch
```

---

## Security Notes

- `secrets.js` is gitignored — never commit it
- Set `API_KEY` via `wrangler secret put` to protect your worker endpoint
- Your Todoist API key is transmitted at runtime over HTTPS and never stored server-side
- The worker never saves audio to disk — all processing is in-memory

---

## License

MIT — see [LICENSE](LICENSE). Free to use, modify, and deploy.
