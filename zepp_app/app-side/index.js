import { BaseSideService } from "@zeppos/zml/base-side";
import { settingsLib } from "@zeppos/zml/base-side";

AppSideService(
  BaseSideService({
    onInit() {
      console.log("[side] DuDu side service started");
    },

    onRequest(req, res) {
      if (req instanceof ArrayBuffer) {
        const buf     = Buffer.from(req);
        const metaLen = buf.readUInt32LE(0);
        const meta    = JSON.parse(buf.slice(4, 4 + metaLen).toString("utf-8"));
        const audio   = buf.slice(4 + metaLen);
        const fileName = meta.fileName;
        const base64   = audio.toString("base64");

        console.log("[side] binary upload:", fileName, "size:", audio.length);

        const url        = settingsLib.getItem("dudu_upload_url") || "";
        const apiKey     = settingsLib.getItem("dudu_api_key") || "";
        const language   = settingsLib.getItem("dudu_language") || "en";
        const todoistKey = settingsLib.getItem("dudu_todoist_key") || "";

        if (!url) {
          console.log("[side] no upload URL configured");
          res(null, { ok: false, error: "no upload URL configured" }, { dataType: 'json' });
          return;
        }

        const headers = { "Content-Type": "application/json" };
        if (apiKey) headers["Authorization"] = "Bearer " + apiKey;

        const body = { fileName, data: base64, language };
        if (apiKey)     body.apiKey        = apiKey;
        if (todoistKey) body.todoistApiKey = todoistKey;

        fetch(url, { method: "POST", headers, body: JSON.stringify(body) })
          .then((r) => {
            if (r.status >= 200 && r.status < 300) {
              console.log("[side] upload ok:", fileName, "status:", r.status);
              try {
                const stored = settingsLib.getItem("dudu_files") || "[]";
                const list = JSON.parse(stored);
                list.push({ fileName, uploadedAt: Date.now() });
                settingsLib.setItem("dudu_files", JSON.stringify(list));
              } catch (e) {
                console.log("[side] settingsLib error:", e);
              }
              res(null, { ok: true }, { dataType: 'json' });
            } else {
              console.log("[side] upload failed:", fileName, "status:", r.status);
              res(null, { ok: false, error: "HTTP " + r.status }, { dataType: 'json' });
            }
          })
          .catch((e) => {
            console.log("[side] upload error:", fileName, e && e.message);
            res(null, { ok: false, error: (e && e.message) || "upload failed" }, { dataType: 'json' });
          });

      } else if (req.method === "get.settings") {
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
