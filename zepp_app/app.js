App({
  onInit() {
    console.log("Audio Memo App init");
    // initialize recorder helper
    try {
      const Recorder = require('lib/recorder.js').Recorder;
      this.recorder = new Recorder();
    } catch (e) {
      console.log("Recorder init error", e);
    }
  },
  onDestroy() {
    if (this.recorder && this.recorder.cleanup) {
      this.recorder.cleanup();
    }
    console.log("App destroyed");
  }
});