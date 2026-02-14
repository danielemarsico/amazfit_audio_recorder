// Simple recorder helper for ZeppOS
export class Recorder {
  constructor() {
    this.rec = hmSensor.createRecorder({
      format: "wav",
      sampleRate: 16000,
      channel: 1
    });
    this.currentFile = null;
    this.timer = null;
  }

  startAutoRecord(durationMs = 30000) {
    const filename = `voice_${Date.now()}.wav`;
    const path = `data/${filename}`;
    this.currentFile = path;

    try {
      this.rec.start({
        file: path,
        notify: (state, extra) => {
          console.log("Recorder state:", state, extra);
        }
      });
      console.log("Recording started ->", path);
    } catch (e) {
      console.log("rec.start error", e);
    }

    // schedule stop after durationMs
    this.timer = setTimeout(() => {
      this.stop();
    }, durationMs);

    return path;
  }

  stop() {
    try {
      this.rec.stop();
    } catch (e) {
      console.log("rec.stop error", e);
    }
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    if (this.currentFile) {
      // save metadata in SysPro storage
      try {
        const stored = hmFS.SysProGetString("voice_list") || "[]";
        const list = JSON.parse(stored);
        list.push({
          file: this.currentFile,
          time: Date.now(),
          synced: false
        });
        hmFS.SysProSetString("voice_list", JSON.stringify(list));
        console.log("Saved metadata for", this.currentFile);
      } catch (e) {
        console.log("metadata save error", e);
      }
      this.currentFile = null;
    }
  }

  cleanup() {
    if (this.timer) {
      clearTimeout(this.timer);
    }
    try { this.rec.stop(); } catch(e){}
  }
}