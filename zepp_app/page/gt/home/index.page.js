import { createWidget, widget, align, prop } from "@zos/ui";
import { create, id, codec } from "@zos/media";
import { push } from "@zos/router";
import { setTimeout, clearTimeout, setInterval, clearInterval } from "@zos/timer";
import { getDeviceInfo } from "@zos/device";
import { mkdirSync, rmSync } from "@zos/fs";

const RECORD_DURATION = 30;
const FOLDER_PATH = "data://dudus/";

const { width, height } = getDeviceInfo();

let recorder = null;
let player = null;
let isPlaying = false;
let stopTimeout = null;
let countdownInterval = null;
let countdownValue = RECORD_DURATION;
let isRecording = false;
let currentFilename = null;

let countdownWidget = null;
let buttonWidget = null;
let playButtonWidget = null;
let listButtonWidget = null;
let cancelButtonWidget = null;

function ensureFolder() {
  try {
    mkdirSync({ path: "dudus" });
  } catch (e) {
    // folder may already exist
  }
}

function generateFilename() {
  const now = new Date();
  const pad = (n) => n.toString().padStart(2, "0");
  const year = now.getFullYear();
  const month = pad(now.getMonth() + 1);
  const day = pad(now.getDate());
  const hours = pad(now.getHours());
  const minutes = pad(now.getMinutes());
  const seconds = pad(now.getSeconds());
  return FOLDER_PATH + `record_${year}${month}${day}_${hours}${minutes}${seconds}.opus`;
}

function showIdleButtons(showPlay) {
  if (playButtonWidget) {
    playButtonWidget.setProperty(prop.VISIBLE, showPlay);
  }
  if (listButtonWidget) {
    listButtonWidget.setProperty(prop.VISIBLE, true);
  }
  if (cancelButtonWidget) {
    cancelButtonWidget.setProperty(prop.VISIBLE, false);
  }
}

function showRecordingButtons() {
  if (playButtonWidget) {
    playButtonWidget.setProperty(prop.VISIBLE, false);
  }
  if (listButtonWidget) {
    listButtonWidget.setProperty(prop.VISIBLE, false);
  }
  if (cancelButtonWidget) {
    cancelButtonWidget.setProperty(prop.VISIBLE, true);
  }
}

function stopPlayer() {
  if (player && isPlaying) {
    try {
      player.stop();
    } catch (e) {}
    isPlaying = false;
    if (playButtonWidget) {
      playButtonWidget.setProperty(prop.TEXT, "PLAY");
    }
  }
}

function togglePlayback() {
  if (!currentFilename) return;

  if (isPlaying) {
    stopPlayer();
    return;
  }

  // Create a fresh player each time
  player = create(id.PLAYER);

  player.addEventListener(player.event.PREPARE, function (result) {
    if (result) {
      console.log("Player ready, starting playback");
      player.start();
      isPlaying = true;
      if (playButtonWidget) {
        playButtonWidget.setProperty(prop.TEXT, "STOP");
      }
    } else {
      console.log("Player prepare failed");
      if (countdownWidget) {
        countdownWidget.setProperty(prop.TEXT, "Play error");
      }
    }
  });

  player.addEventListener(player.event.COMPLETE, function () {
    console.log("Playback complete");
    isPlaying = false;
    if (playButtonWidget) {
      playButtonWidget.setProperty(prop.TEXT, "PLAY");
    }
    if (countdownWidget) {
      countdownWidget.setProperty(prop.TEXT, "Done!");
    }
  });

  player.setSource(player.source.FILE, { file: currentFilename });
  player.prepare();

  if (countdownWidget) {
    countdownWidget.setProperty(prop.TEXT, "Playing...");
  }
}

function cancelRecording() {
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
  } catch (e) {}

  // Delete the discarded file
  if (currentFilename) {
    try {
      // currentFilename is "data://dudus/file.opus", rmSync needs relative path "dudus/file.opus"
      const relativePath = currentFilename.replace("data://", "");
      rmSync({ path: relativePath });
      console.log("Cancelled recording deleted:", relativePath);
    } catch (e) {
      console.log("Error deleting cancelled file:", e);
    }
  }

  currentFilename = null;

  if (countdownWidget) {
    countdownWidget.setProperty(prop.TEXT, "Ready");
  }
  if (buttonWidget) {
    buttonWidget.setProperty(prop.TEXT, "NEW");
  }

  showIdleButtons(false);
}

function startNewRecording() {
  stopPlayer();
  showRecordingButtons();

  countdownValue = RECORD_DURATION;
  ensureFolder();

  currentFilename = generateFilename();
  console.log("Saving to file:", currentFilename);

  // Reuse existing recorder or create a new one
  if (!recorder) {
    recorder = create(id.RECORDER);
  }
  recorder.setFormat(codec.OPUS, {
    target_file: currentFilename,
  });

  if (countdownWidget) {
    countdownWidget.setProperty(prop.TEXT, countdownValue.toString());
  }
  if (buttonWidget) {
    buttonWidget.setProperty(prop.TEXT, "STOP");
  }

  recorder.start();
  isRecording = true;
  console.log("Recording started ->", currentFilename);

  countdownInterval = setInterval(() => {
    countdownValue--;
    if (countdownValue >= 0 && countdownWidget) {
      countdownWidget.setProperty(prop.TEXT, countdownValue.toString());
    }
    if (countdownValue <= 0) {
      stopRecording();
    }
  }, 1000);

  stopTimeout = setTimeout(() => {
    stopRecording();
  }, RECORD_DURATION * 1000);
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

  if (countdownWidget) {
    countdownWidget.setProperty(prop.TEXT, "Saved!");
  }
  if (buttonWidget) {
    buttonWidget.setProperty(prop.TEXT, "NEW");
  }

  showIdleButtons(true);
}

const btnSize = Math.floor(width * 0.3);
const btnGap = Math.floor(width * 0.05);
const btnY = Math.floor(height / 2);

// Two buttons side by side: NEW (left) and PLAY (right)
const leftBtnX = Math.floor(width / 2 - btnSize - btnGap / 2);
const rightBtnX = Math.floor(width / 2 + btnGap / 2);

Page({
  build() {
    // Countdown text - top half of screen
    countdownWidget = createWidget(widget.TEXT, {
      x: 0,
      y: Math.floor(height * 0.15),
      w: width,
      h: Math.floor(height * 0.3),
      text: RECORD_DURATION.toString(),
      text_size: 72,
      color: 0xffffff,
      align_h: align.CENTER_H,
      align_v: align.CENTER_V,
    });

    // Main button (STOP during recording, NEW after)
    buttonWidget = createWidget(widget.BUTTON, {
      x: leftBtnX,
      y: btnY,
      w: btnSize,
      h: btnSize,
      radius: Math.floor(btnSize / 2),
      normal_color: 0xfc6950,
      press_color: 0xfeb4a8,
      text: "STOP",
      text_size: 22,
      color: 0xffffff,
      click_func: () => {
        if (isRecording) {
          stopRecording();
        } else {
          startNewRecording();
        }
      },
    });

    // Play button (hidden until a recording is saved)
    playButtonWidget = createWidget(widget.BUTTON, {
      x: rightBtnX,
      y: btnY,
      w: btnSize,
      h: btnSize,
      radius: Math.floor(btnSize / 2),
      normal_color: 0x2196f3,
      press_color: 0x64b5f6,
      text: "PLAY",
      text_size: 22,
      color: 0xffffff,
      click_func: () => {
        togglePlayback();
      },
    });
    // Cancel button (visible only during recording, replaces PLAY position)
    cancelButtonWidget = createWidget(widget.BUTTON, {
      x: rightBtnX,
      y: btnY,
      w: btnSize,
      h: btnSize,
      radius: Math.floor(btnSize / 2),
      normal_color: 0x888888,
      press_color: 0xaaaaaa,
      text: "CANCEL",
      text_size: 16,
      color: 0xffffff,
      click_func: () => {
        cancelRecording();
      },
    });
    cancelButtonWidget.setProperty(prop.VISIBLE, false);

    playButtonWidget.setProperty(prop.VISIBLE, false);

    // List button - navigate to recordings list
    const listBtnW = Math.floor(width * 0.4);
    const listBtnH = 40;
    listButtonWidget = createWidget(widget.BUTTON, {
      x: Math.floor((width - listBtnW) / 2),
      y: btnY + btnSize + Math.floor(btnSize * 0.2),
      w: listBtnW,
      h: listBtnH,
      radius: 8,
      normal_color: 0x444444,
      press_color: 0x666666,
      text: "LIST",
      text_size: 18,
      color: 0xffffff,
      click_func: () => {
        stopPlayer();
        push({ url: "page/gt/home/audiolist.page" });
      },
    });
    listButtonWidget.setProperty(prop.VISIBLE, false);

    // Start first recording immediately
    startNewRecording();
  },

  onDestroy() {
    stopRecording();
    stopPlayer();
    recorder = null;
    player = null;
    countdownWidget = null;
    buttonWidget = null;
    playButtonWidget = null;
    listButtonWidget = null;
    cancelButtonWidget = null;
  },
});
