DuDu - Voice Memo Recorder for Amazfit Smartwatches
=====================================================

Records voice memos on ZeppOS 3.0 watches, syncs them to your phone via BLE,
and uploads them to a Cloudflare Worker that transcribes the audio using
Cloudflare Workers AI (Whisper).


HOW IT WORKS
------------
1. Open DuDu on the watch → starts recording immediately
2. Recording stops after the configured duration (default 30s) or when you tap STOP
3. Open the recordings list, tap SYNC → the file is uploaded to your Cloudflare
   Worker via HTTP and also sent to the Zepp phone app via BLE
4. The worker converts the audio and returns a transcription
5. Tap X on the list to delete a recording from the watch once synced


PROJECT STRUCTURE
-----------------
zepp_app/
  app.js                        App lifecycle
  app.json                      App config, page routes, permissions
  setting/index.js              Companion app settings page (URL, API key, duration)
  page/gt/home/
    index.page.js               Main recording page
    audiolist.page.js           Recordings list (play, sync, delete)
    audioController.js          Core logic: recording, file ops, sync, BLE transfer
    recorderFacade.js           Recorder/player abstraction
  assets/                       Icons per screen shape (round/square/bip)

cloudfare_worker/
  worker.js                     Cloudflare Worker: receives upload, converts
                                ZeppOS Opus → Ogg-Opus in memory, transcribes
                                with Cloudflare Workers AI (@cf/openai/whisper)
  wrangler.toml                 Worker config (name, AI binding)
  package.json                  Dev dependencies (wrangler)

dummy_server/
  server.py                     Local Python server for testing uploads without
                                the Cloudflare Worker (saves files to disk)
  opus_convert.py               Converts ZeppOS Opus to standard Ogg-Opus


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


2. Install watch app dependencies
   --------------------------------
   cd zepp_app
   npm install
   cd ..


3. Deploy the Cloudflare Worker
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


4. Configure the watch app settings
   ------------------------------------
   Open the Zepp phone app → My Devices → your watch → DuDu → Settings

   - Upload URL:  https://dudu-transcription.<your-subdomain>.workers.dev/upload
   - API Key:     the same key you set in step 3c (or leave as-is if you
                  skipped that step and left the worker unprotected)
   - Duration:    recording length in seconds (5–60, default 30)


5. Build and sideload the watch app
   ------------------------------------
   cd zepp_app
   zeus build
   # Then install the built .zab file via the Zepp developer tools or simulator


TESTING THE WORKER LOCALLY
---------------------------
The Cloudflare Workers AI binding requires a real Cloudflare connection,
so local testing runs against the live infrastructure (needs login):

   cd cloudfare_worker
   npm run dev          # starts at http://localhost:8787

Quick curl test (health check):
   curl http://localhost:8787/

Quick curl test (upload, using a converted .ogg file as placeholder):
   curl -X POST http://localhost:8787/upload \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_API_KEY" \
     -d "{\"fileName\":\"test.opus\",\"data\":\"$(base64 -w0 dummy_server/recordings/record_20260222_092548.opus)\"}"


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
