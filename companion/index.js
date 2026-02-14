// Companion plugin code (runs in Zepp Mobile app plugin environment)
App({
  onCreate() {
    console.log("Companion create");
    // file transfer receive handler
    if (hmApp && hmApp.fileTransfer && hmApp.fileTransfer.onReceive) {
      hmApp.fileTransfer.onReceive((fileInfo) => {
        try {
          console.log("Received file from watch:", fileInfo);
          // fileInfo: { path, fileName }
          const dest = "/storage/emulated/0/Zepp/AudioMemo/";
          // Try to save - API varies; this is a template to adapt per SDK
          if (hmApp.fileSystem && hmApp.fileSystem.save) {
            hmApp.fileSystem.save({
              source: fileInfo.path,
              target: dest + fileInfo.fileName
            });
          }
          // store metadata in localStorage (or plugin DB)
          let db = JSON.parse(localStorage.getItem("audio_memo_db") || "[]");
          db.push({ file: fileInfo.fileName, time: Date.now() });
          localStorage.setItem("audio_memo_db", JSON.stringify(db));
        } catch (e) {
          console.log("file receive handler error", e);
        }
      });
    } else {
      console.log("fileTransfer API not available in this environment");
    }

    // listen for messages from watch
    if (hmApp && hmApp.message && hmApp.message.onMessage) {
      hmApp.message.onMessage((msg) => {
        console.log("Message from watch:", msg);
      });
    }
  }
});