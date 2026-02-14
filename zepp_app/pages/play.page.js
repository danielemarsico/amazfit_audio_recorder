Page({
  onInit(filePath) {
    console.log("Play page init", filePath);
    this.file = filePath;

    this.player = hmSensor.createAudioPlayer();
    try {
      this.player.setSource(filePath);
      this.player.play();
    } catch (e) {
      console.log("play error", e);
    }

    hmUI.createWidget(hmUI.widget.TEXT, {
      text: "Playing",
      x: 20, y: 30, w: 200, h: 30
    });

    hmUI.createWidget(hmUI.widget.BUTTON, {
      x: 20, y: 100, w: 150, h: 60,
      text: "Sync to Phone",
      click_func: () => {
        try {
          hmApp.transferFile(this.file);
          hmApp.sendMessage({ type: "sync", file: this.file });
        } catch (e) {
          console.log("sync error", e);
        }
      }
    });
  },

  onDestroy() {
    try { this.player.stop(); } catch(e){}
  }
});