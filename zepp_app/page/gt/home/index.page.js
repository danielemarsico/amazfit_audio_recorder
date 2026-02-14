import { create, id, codec } from "@zos/media";
import { setTimeout, clearTimeout, setInterval, clearInterval } from "@zos/timer";
import { getDeviceInfo } from "@zos/device";
import { mkdirSync } from '@zos/fs';
import { push } from "@zos/router";
import TransferFile from "@zos/ble/TransferFile";
import AutoGUI from "@silver-zepp/autogui";

const RECORD_DURATION = 30;
const FOLDER_PATH = 'data://dudus/';
const transferFile = new TransferFile();

const { width, height } = getDeviceInfo();

let recorder = null;
let stopTimeout = null;
let countdownInterval = null;
let countdownValue = RECORD_DURATION;
let isRecording = false;
let currentFilename = null;

let gui = null;
let my_text = null;
let rec_button = null;

function ensureFolder() {
  try {
    mkdirSync({ path: 'dudus' });
  } catch (e) {
    // folder may already exist, that's fine
  }
}

function generateFilename() {
  const now = new Date();
  const pad = n => n.toString().padStart(2, '0');
  const year = now.getFullYear();
  const month = pad(now.getMonth() + 1);
  const day = pad(now.getDate());
  const hours = pad(now.getHours());
  const minutes = pad(now.getMinutes());
  const seconds = pad(now.getSeconds());
  return FOLDER_PATH + `record_${year}${month}${day}_${hours}${minutes}${seconds}.opus`;
}

function stopRecording() {
  if (!isRecording) return;
  isRecording = false;

  if (stopTimeout) {
    clearTimeout(stopTimeout);
    stopTimeout = null;
  }
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }

  try {
    recorder.stop();
    console.log("Recording stopped and saved.");
  } catch (err) {
    console.log("Error stopping recorder:", err);
  }

  // Auto-transfer to phone via Zepp app
  if (currentFilename) {
    try {
      transferFile.sendFile(currentFilename, {
        type: "voice_memo",
        recordedAt: Date.now().toString()
      });
      console.log("File transfer initiated:", currentFilename);
    } catch (err) {
      console.log("File transfer error:", err);
    }
  }

  if (rec_button) {
    rec_button.update({ text: "Done" });
  }
  if (my_text) {
    my_text.update({ text: "Syncing..." });
  }
}

Page({
  build() {
    // Reset state for fresh page entry
    countdownValue = RECORD_DURATION;
    isRecording = false;

    ensureFolder();

    currentFilename = generateFilename();
    console.log("Saving to file:", currentFilename);

    // Create recorder and configure
    recorder = create(id.RECORDER);
    recorder.setFormat(codec.OPUS, {
      target_file: currentFilename
    });

    // Build UI
    gui = new AutoGUI();
    my_text = gui.text(countdownValue.toString());
    gui.newRow();
    rec_button = gui.button("STOP", () => {
      stopRecording();
    }, { radius: 100 });
    gui.render();

    // Start recording immediately
    recorder.start();
    isRecording = true;
    console.log("Recording started ->", currentFilename);

    // Countdown display
    countdownInterval = setInterval(() => {
      countdownValue--;
      if (countdownValue >= 0 && my_text) {
        my_text.update({ text: countdownValue.toString() });
      }
      if (countdownValue <= 0) {
        stopRecording();
      }
    }, 1000);

    // Safety timeout to guarantee stop
    stopTimeout = setTimeout(() => {
      stopRecording();
    }, RECORD_DURATION * 1000);
  },

  onDestroy() {
    // Clean up if page is closed while recording
    stopRecording();
    recorder = null;
    gui = null;
    my_text = null;
    rec_button = null;
  }
});
