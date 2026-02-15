import { BaseSideService } from "@zeppos/zml/base-side";
import { settingsLib } from "@zeppos/zml/base-side";

AppSideService(
  BaseSideService({
    onInit() {
      console.log("[side] DuDu side service started");
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

    onDestroy() {
      console.log("[side] DuDu side service destroyed");
    },
  })
);
