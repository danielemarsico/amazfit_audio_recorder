import { BaseSideService } from "@zeppos/zml/base-side";
import { settingsLib } from "@zeppos/zml/base-side";

AppSideService(
  BaseSideService({
    onInit() {
      console.log("[side] DuDu side service started");
    },

    onRequest(req, res) {
      if (req && req.method === "get.settings") {
        const url         = settingsLib.getItem("dudu_upload_url") || "";
        const apiKey      = settingsLib.getItem("dudu_api_key") || "";
        const duration    = parseInt(settingsLib.getItem("dudu_duration")) || 30;
        const todoistKey  = settingsLib.getItem("dudu_todoist_key") || "";
        const language    = settingsLib.getItem("dudu_language") || "it";
        console.log("[side] get.settings -> url:", url, "apiKey:", apiKey ? "(set)" : "(empty)", "duration:", duration, "lang:", language, "todoist:", todoistKey ? "(set)" : "(empty)");
        res(null, { url, apiKey, duration, todoistKey, language });

      } else if (req instanceof ArrayBuffer) {
        // Binary audio upload — format: [4B LE meta length][meta JSON][raw opus bytes]
        const buf      = Buffer.from(req);
        const metaLen  = buf.readUInt32LE(0);
        const meta     = JSON.parse(buf.slice(4, 4 + metaLen).toString("utf-8"));
        const audio    = buf.slice(4 + metaLen);
        const base64   = audio.toString("base64");

        const url        = settingsLib.getItem("dudu_upload_url") || "";
        const apiKey     = settingsLib.getItem("dudu_api_key") || "";
        const language   = settingsLib.getItem("dudu_language") || "en";
        const todoistKey = settingsLib.getItem("dudu_todoist_key") || "";

        console.log("[side] audio.upload fileName:", meta.fileName, "audioBytes:", audio.length, "url:", url);

        const body = { fileName: meta.fileName, data: base64, language };
        if (apiKey)     body.apiKey        = apiKey;
        if (todoistKey) body.todoistApiKey = todoistKey;

        const headers = { "Content-Type": "application/json" };
        if (apiKey) headers["Authorization"] = "Bearer " + apiKey;

        this.fetch({ url, method: "POST", headers, body: JSON.stringify(body) })
          .then((r) => {
            if (r.status >= 200 && r.status < 300) {
              console.log("[side] upload ok, status:", r.status);
              try {
                const stored = settingsLib.getItem("dudu_files") || "[]";
                const list = JSON.parse(stored);
                list.push({ fileName: meta.fileName, receivedAt: Date.now() });
                settingsLib.setItem("dudu_files", JSON.stringify(list));
                console.log("[side] Metadata saved. Total files:", list.length);
              } catch (e) {
                console.log("[side] settingsLib error:", e);
              }
              res(null, { ok: true, status: r.status });
            } else {
              console.log("[side] upload failed, status:", r.status);
              res({ message: "HTTP " + r.status });
            }
          })
          .catch((e) => {
            console.log("[side] upload error:", e.message);
            res({ message: e.message });
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
