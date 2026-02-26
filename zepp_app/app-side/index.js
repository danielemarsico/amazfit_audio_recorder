import { BaseSideService } from "@zeppos/zml/base-side";
import { settingsLib } from "@zeppos/zml/base-side";

AppSideService(
  BaseSideService({
    onInit() {
      console.log("[side] DuDu side service started");
    },

    onRequest(req, res) {
      if (req.method === "get.settings") {
        const url         = settingsLib.getItem("dudu_upload_url") || "";
        const apiKey      = settingsLib.getItem("dudu_api_key") || "";
        const duration    = parseInt(settingsLib.getItem("dudu_duration")) || 30;
        const todoistKey  = settingsLib.getItem("dudu_todoist_key") || "";
        const language    = settingsLib.getItem("dudu_language") || "it";
        console.log("[side] get.settings -> url:", url, "apiKey:", apiKey ? "(set)" : "(empty)", "duration:", duration, "lang:", language, "todoist:", todoistKey ? "(set)" : "(empty)");
        res(null, { url, apiKey, duration, todoistKey, language });
      }
    },

    onReceivedFile(fileObject) {
      console.log("[side] File received:", JSON.stringify(fileObject));

      const fileName = fileObject.params?.fileName || fileObject.fileName || "unknown";
      const filePath = fileObject.filePath || "";

      console.log("[side] fileName:", fileName, "filePath:", filePath);

      try {
        const stored = settingsLib.getItem("dudu_files") || "[]";
        const list = JSON.parse(stored);
        list.push({
          fileName: fileName,
          filePath: filePath,
          receivedAt: Date.now(),
        });
        settingsLib.setItem("dudu_files", JSON.stringify(list));
        console.log("[side] Metadata saved. Total files:", list.length);
      } catch (e) {
        console.log("[side] settingsLib error:", e);
      }
    },

    onSettingsChange({ key, newValue, oldValue }) {
      console.log("[side] Settings changed:", key, "->", newValue);
    },

    onDestroy() {
      console.log("[side] DuDu side service destroyed");
    },
  })
);
