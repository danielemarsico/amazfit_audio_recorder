DuDu - Voice Memo App for Amazfit Smartwatches
===============================================

A quick voice memo recorder for ZeppOS 3.0 smartwatches (Amazfit GT series).
Open the app, and it immediately starts recording a 30-second voice memo.

Features
--------
- Instant recording: starts capturing audio the moment the app opens
- Fixed 30-second duration with on-screen countdown
- Manual early stop via the STOP button
- OPUS codec for small file sizes at good quality (16 kHz)
- Auto-generated filenames with timestamp (e.g. record_20260214_153045.opus)
- Recordings stored locally in data://dudus/
- Audio list page: browse all saved recordings
- Playback: tap a recording to play it back on the watch
- Delete: remove recordings you no longer need
- Clean resource cleanup when leaving the app mid-recording

Project Structure
-----------------
zepp_app/
  app.js                          - App lifecycle (init/destroy)
  app.json                        - App config, page routes, mic permission
  page/gt/home/
    index.page.js                 - Main page: auto-record + countdown UI
    audiolist.page.js             - Saved recordings list with play/delete
    audioController.js            - File operations (list, play, delete)
    index.page.r.layout.js        - Round screen layout
    index.page.s.layout.js        - Square screen layout
  assets/gt.r/, assets/gt.s/      - Icons and images per screen shape
  page/i18n/                      - Translations (EN, ZH)

Requirements
------------
- ZeppOS >= 3.0
- Device with microphone (Amazfit GT series)
- Microphone permission (data:os.mic.record) - declared in app.json
- Node.js + zeus CLI for building and simulator testing

Build & Deploy
--------------
1. Install dependencies:  cd zepp_app && npm install
2. Build:                 zeus build
3. Run in simulator:      zeus dev
4. Sideload to watch via Zepp developer tools

Limitations & Next Steps
------------------------
- Companion plugin (companion/) is a skeleton for phone-side file sync
- Audio list page play/delete hit detection needs refinement
- No automatic sync to phone yet (could trigger on recording stop)
- Recording duration is fixed at 30s (configurable via RECORD_DURATION constant)
