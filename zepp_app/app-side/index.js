import { BaseSideService } from "@zeppos/zml/base-side";
import { settingsLib } from "@zeppos/zml/base-side";

AppSideService(
  BaseSideService({
    onInit() {
      console.log("[side] DuDu side service started");
    },

    onRequest(req, res) {
      if (req.method === "get.settings") {
        const duration = parseInt(settingsLib.getItem("dudu_duration")) || 30;
        console.log("[side] get.settings -> duration:", duration);
        res(null, { duration });

      } else if (req.method === "check.connection") {
        const url = settingsLib.getItem("dudu_upload_url") || "";
        if (!url) {
          console.log("[side] check.connection -> no URL configured");
          res(null, { connected: false });
          return;
        }
        fetch(url)
          .then(() => {
            console.log("[side] check.connection -> OK");
            res(null, { connected: true });
          })
          .catch(() => {
            console.log("[side] check.connection -> failed");
            res(null, { connected: false });
          });

      } else if (req.method === "upload.file") {
        const { fileName, base64 } = req.params;
        const url        = settingsLib.getItem("dudu_upload_url") || "";
        const apiKey     = settingsLib.getItem("dudu_api_key") || "";
        const language   = settingsLib.getItem("dudu_language") || "en";
        const todoistKey = settingsLib.getItem("dudu_todoist_key") || "";

        if (!url) {
          console.log("[side] upload.file -> no URL configured");
          res("no upload URL configured");
          return;
        }

        const headers = { "Content-Type": "application/json" };
        if (apiKey) headers["Authorization"] = "Bearer " + apiKey;

        const body = { fileName, data: base64, language };
        if (apiKey)     body.apiKey        = apiKey;
        if (todoistKey) body.todoistApiKey = todoistKey;

        console.log("[side] upload.file ->", fileName, "to", url);
        fetch(url, { method: "POST", headers, body: JSON.stringify(body) })
          .then(() => {
            console.log("[side] upload.file OK:", fileName);
            try {
              const stored = settingsLib.getItem("dudu_files") || "[]";
              const list = JSON.parse(stored);
              const idx = list.findIndex((f) => f.fileName === fileName);
              const entry = { fileName, uploadedAt: Date.now() };
              if (idx >= 0) list[idx] = entry; else list.push(entry);
              settingsLib.setItem("dudu_files", JSON.stringify(list));
              settingsLib.setItem("dudu_data_" + fileName, base64);
            } catch (e) {
              console.log("[side] settingsLib save error:", e);
            }
            res(null, { ok: true });
          })
          .catch((e) => {
            console.log("[side] upload.file error:", fileName, e);
            res(e && e.message ? e.message : "upload failed");
          });
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
