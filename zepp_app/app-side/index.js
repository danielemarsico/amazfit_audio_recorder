import { BaseSideService } from "@zos/app-service";
import TransferFile from "@zos/ble/TransferFile";

const transferFile = new TransferFile();

AppSideService({
  onInit() {
    console.log("DuDu side service started");

    // Listen for incoming file transfers from the watch
    transferFile.onFile((fileObject) => {
      const { fileName, filePath, params } = fileObject;
      console.log("Received file from watch:", fileName);
      console.log("File path:", filePath);
      console.log("Params:", JSON.stringify(params));

      // File is automatically saved to the Zepp app sandbox
      // Log receipt for debugging
      try {
        const received = settings.settingsStorage.getItem("dudu_files") || "[]";
        const list = JSON.parse(received);
        list.push({
          fileName: fileName,
          receivedAt: Date.now(),
          params: params || {}
        });
        settings.settingsStorage.setItem("dudu_files", JSON.stringify(list));
        console.log("File metadata saved. Total files:", list.length);
      } catch (e) {
        console.log("Error saving file metadata:", e);
      }
    });

    // Listen for messages from the watch
    this.onMessage = (message) => {
      console.log("Message from watch:", JSON.stringify(message));

      if (message.type === "ping") {
        return { type: "pong", status: "connected" };
      }

      if (message.type === "list_files") {
        try {
          const stored = settings.settingsStorage.getItem("dudu_files") || "[]";
          return { type: "file_list", files: JSON.parse(stored) };
        } catch (e) {
          return { type: "file_list", files: [] };
        }
      }
    };
  },

  onDestroy() {
    console.log("DuDu side service destroyed");
  }
});
