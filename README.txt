DuDu - Voice Memo Recorder for Amazfit Smartwatches
=====================================================

Records voice memos on ZeppOS 3.0 watches, syncs them to your phone via BLE,
and uploads them to a Cloudflare Worker that transcribes the audio using
Cloudflare Workers AI (Whisper). Optionally creates a Todoist task from the
transcription.


HOW IT WORKS
------------
1. Open DuDu on the watch → starts recording immediately
2. Recording stops after the configured duration (default 30s) or when you tap STOP
3. Open the recordings list, tap SYNC → the file is uploaded to your Cloudflare
   Worker via HTTP and also sent to the Zepp phone app via BLE
4. The worker converts the audio, transcribes it, and optionally creates a
   Todoist task — then returns the transcription to the watch
5. Tap X on the list to delete a recording from the watch once synced


PROJECT STRUCTURE
-----------------
zepp_app/
  app.js                        App lifecycle
  app.json                      App config, page routes, permissions
  secrets.js                    Local secrets (gitignored) — copy from secrets.template.js
  secrets.template.js           Template for secrets.js
  setting/index.js              Companion app settings page (URL, API key, language,
                                Todoist key, recording duration)
  page/gt/home/
    index.page.js               Main recording page
    audiolist.page.js           Recordings list (play, sync, delete)
    audioController.js          Core logic: recording, file ops, sync, BLE transfer
    recorderFacade.js           Recorder/player abstraction
  assets/                       Icons per screen shape (round/square/bip)

cloudfare_worker/
  worker.js                     Cloudflare Worker: receives upload, converts
                                ZeppOS Opus → Ogg-Opus in memory, transcribes
                                with Cloudflare Workers AI (@cf/openai/whisper),
                                optionally creates a Todoist task
  wrangler.toml                 Worker config (name, AI binding)
  package.json                  Dev dependencies (wrangler)

dummy_server/
  server.py                     Local Python server for testing uploads without
                                the Cloudflare Worker (saves files to disk)
  opus_convert.py               Converts ZeppOS Opus to standard Ogg-Opus

scripts/
  test_debug_ogg.py             Test script for the worker endpoints
  test-ogg.txt                  Quick curl/python command references


PREREQUISITES
-------------
- Node.js >= 18  (https://nodejs.org)
- Zeus CLI       (npm install -g @zepp-os/zeus)
- Zepp app on your phone with developer mode enabled
- A Cloudflare account (free tier is enough)  (https://cloudflare.com)
- A ZeppOS 3.0 watch (Amazfit Bip 6, GT3, GT4, GTS3, GTS4, etc.)


SETUP ON A NEW MACHINE
----------------------

1. Clone the repository
   -----------------------
   git clone https://github.com/danielemarsico/amazfit_audio_recorder.git
   cd amazfit_audio_recorder


2. Create your secrets file
   --------------------------
   cp zepp_app/secrets.template.js zepp_app/secrets.js
   # Edit zepp_app/secrets.js and fill in your values (see secrets.template.js)


3. Install watch app dependencies
   --------------------------------
   cd zepp_app
   npm install
   cd ..


4. Deploy the Cloudflare Worker
   --------------------------------
   a) Install worker dependencies:
      cd cloudfare_worker
      npm install

   b) Log in to Cloudflare (opens a browser):
      npx wrangler login

   c) (Recommended) Set a secret API key to protect your endpoint.
      Choose any long random string and SAVE IT somewhere (you cannot
      retrieve it from Cloudflare later):
      npx wrangler secret put API_KEY
      [paste your key and press Enter]

   d) Deploy the worker:
      npm run deploy

      At the end you will see your worker URL, e.g.:
        https://dudu-transcription.<your-subdomain>.workers.dev

   e) Go back to the repo root:
      cd ..


5. Configure the watch app settings
   ------------------------------------
   Open the Zepp phone app → My Devices → your watch → DuDu → Settings

   - Upload URL:     https://dudu-transcription.<your-subdomain>.workers.dev/upload
   - API Key:        the same key you set in step 4c (or leave blank if you
                     skipped that step and left the worker unprotected)
   - Todoist Key:    (optional) your Todoist API token — if set, each transcription
                     automatically creates a Todoist task due today
   - Language:       transcription language hint sent to Whisper (default: English)
   - Duration:       recording length in seconds (5–60, default 30)


6. Build and sideload the watch app
   ------------------------------------
   cd zepp_app
   zeus build
   # Then install the built .zab file via the Zepp developer tools or simulator


WORKER HTTP API
---------------
POST /upload
  Transcribes audio and optionally creates a Todoist task.

  Request body (JSON):
    fileName      string   (optional) original file name, returned in response
    data          string   REQUIRED — base64-encoded ZeppOS Opus audio
    apiKey        string   (optional) API key if not sent via Authorization header
    language      string   (optional) BCP-47 language code for Whisper, e.g. "en",
                           "it", "es". Defaults to "en" if omitted.
    todoistApiKey string   (optional) Todoist API token. If provided, a task is
                           created from the transcription text, due today.

  Authorization header (alternative to apiKey in body):
    Authorization: Bearer <API_KEY>

  Response (JSON):
    ok            bool     true on success
    file          string   echoed fileName
    size          number   raw audio size in bytes
    transcription string   transcribed text
    todoistTask   object   Todoist task object, or null if not requested

POST /debug-ogg
  Same request format as /upload, but returns the converted Ogg-Opus file
  instead of transcribing — useful for verifying audio conversion.

  Response: audio/ogg binary with headers:
    X-Frame-Count   number of Opus frames parsed
    X-Ogg-Size      size of the output Ogg file in bytes

GET /
  Health check — returns a plain-text confirmation that the worker is running.


TESTING THE WORKER
------------------
Use scripts/test_debug_ogg.py to test the worker from the command line.
All secrets are passed as arguments — nothing is hardcoded in the script.

  # Test Ogg conversion only (downloads converted.ogg):
  python scripts/test_debug_ogg.py <path-to-opus> \
    --url https://dudu-transcription.<your-subdomain>.workers.dev \
    --api-key <API_KEY>

  # Transcribe with language hint:
  python scripts/test_debug_ogg.py <path-to-opus> \
    --url https://dudu-transcription.<your-subdomain>.workers.dev \
    --api-key <API_KEY> \
    --upload --lang it

  # Transcribe and create a Todoist task:
  python scripts/test_debug_ogg.py <path-to-opus> \
    --url https://dudu-transcription.<your-subdomain>.workers.dev \
    --api-key <API_KEY> \
    --upload --lang it --todoist-key <TODOIST_KEY>

Local dev server (requires Cloudflare login — AI binding needs a real connection):
   cd cloudfare_worker
   npm run dev          # starts at http://localhost:8787


TESTING WITH THE LOCAL DUMMY SERVER (no Cloudflare needed)
-----------------------------------------------------------
The dummy server saves uploads to disk without transcription — useful for
checking that the watch upload works before involving the cloud.

   cd dummy_server
   pip install -r requirements.txt   # (no external deps needed actually)
   python server.py --port 9000

   Then set the watch app Upload URL to:
     http://<your-local-ip>:9000/upload

   Converted .ogg files appear alongside the .opus files in dummy_server/recordings/.


REDEPLOYMENT
------------
After any code change to worker.js:
   cd cloudfare_worker
   npm run deploy

After any change to the watch app:
   cd zepp_app
   zeus build
   # reinstall on watch
