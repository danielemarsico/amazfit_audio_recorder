Audio Memo (ZeppOS) - Project Template
======================================

What you get:
- ZeppOS watch app (auto-record on open, 30s limit)
- Simple recordings list + playback + manual sync button
- Companion plugin skeleton to receive transferred files on the phone

Files of interest:
- app.json, app.js
- lib/recorder.js
- pages/index.page.js (auto-record)
- pages/list.page.js (list + sync)
- pages/play.page.js (playback + sync)
- companion/index.js (phone-side plugin skeleton)

Build / deploy notes:
1. Place the `zepp` folder content into your ZeppOS app project structure.
2. Use the Amazfit/Zepp developer tools to package and sideload the watch app.
3. The companion plugin code is a skeleton: adjust `hmApp.fileSystem.save` usage to the real Zepp App SDK APIs available in your environment.
4. Ensure microphone permissions / device compatibility (ZeppOS >= 3.0).
5. Test transfer on a paired device.

Limitations & Next steps:
- The companion plugin code is a template — Zepp Mobile SDK details vary by version and region. Adapt file paths & APIs.
- Add UI polish, progress indicators, and error handling for production.
- Consider implementing automatic sync on recording completion (call hmApp.transferFile from recorder stop).