Page({
  onInit() {
    // Start recording immediately when the page opens (auto-start)
    console.log("Index page init - auto recording");
    try {
      const app = getApp();
      if (!app.globalData) app.globalData = {};
      if (!app.globalData.recorder) {
        const Recorder = require('lib/recorder.js').Recorder;
        app.globalData.recorder = new Recorder();
      }
      this.path = app.globalData.recorder.startAutoRecord(30000);
    } catch (e) {
      console.log("startAutoRecord error", e);
    }

    // Simple UI text
    hmUI.createWidget(hmUI.widget.TEXT, {
      text: "Recording… (30s)",
      x: 20, y: 60, w: 200, h: 40,
      align: hmUI.ALIGN.LEFT
    });

    // button to go to list
    hmUI.createWidget(hmUI.widget.BUTTON, {
      x: 20, y: 140, w: 150, h: 60,
      text: "List Recordings",
      click_func: () => {
        hmApp.gotoPage({ url: "pages/list.page" });
      }
    });
  },

  onDestroy() {
    // ensure stop called
    console.log("Index page destroy");
  }
});