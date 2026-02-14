Page({
  build() {
    // load list from SysPro storage
    let stored = hmFS.SysProGetString("voice_list") || "[]";
    let list = [];
    try { list = JSON.parse(stored); } catch(e){ list = []; }

    // show title
    hmUI.createWidget(hmUI.widget.TEXT, {
      text: "Recordings",
      x: 20, y: 10, w: 200, h: 30
    });

    if (list.length === 0) {
      hmUI.createWidget(hmUI.widget.TEXT, {
        text: "No recordings yet",
        x: 20, y: 50, w: 200, h: 30
      });
      return;
    }

    // build simple list using buttons (watch UI is limited)
    for (let i = 0; i < list.length; i++) {
      const item = list[i];
      const y = 60 + i*50;
      const label = new Date(item.time).toLocaleString();
      hmUI.createWidget(hmUI.widget.BUTTON, {
        x: 10, y: y, w: 170, h: 44,
        text: label,
        click_func: () => {
          // pass file path to play page
          hmApp.gotoPage({ url: "pages/play.page", param: item.file });
        }
      });

      // small sync button next to it
      hmUI.createWidget(hmUI.widget.BUTTON, {
        x: 190, y: y, w: 70, h: 44,
        text: item.synced ? "Synced" : "Sync",
        click_func: () => {
          if (!item.synced) {
            try {
              hmApp.transferFile(item.file);
              hmApp.sendMessage({ type: "sync", file: item.file });
              // mark synced locally
              item.synced = true;
              // save list back
              const stored2 = hmFS.SysProGetString("voice_list") || "[]";
              let arr = JSON.parse(stored2);
              for (let k=0;k<arr.length;k++){
                if (arr[k].file === item.file) { arr[k].synced = true; break; }
              }
              hmFS.SysProSetString("voice_list", JSON.stringify(arr));
            } catch (e) {
              console.log("transferFile error", e);
            }
          }
        }
      });
    }
  }
});