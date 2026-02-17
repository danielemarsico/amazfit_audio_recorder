import { createWidget, widget, align, prop } from "@zos/ui";
import { push } from "@zos/router";
import { getDeviceInfo } from "@zos/device";
import { setPageBrightTime, pauseDropWristScreenOff } from "@zos/display";
import { BasePage } from "@zeppos/zml/base-page";
import {
  getRecordDuration, syncSingleFile, fetchSettings,
  playAudio, stopAudio, isAudioPlaying, destroyPlayer,
  startRecording, stopRecording, cancelRecording,
  isCurrentlyRecording, getCurrentFilename, destroyRecorder,
} from "./audioController.js";

const { width, height } = getDeviceInfo();

let countdownWidget = null;
let buttonWidget = null;
let playButtonWidget = null;
let listButtonWidget = null;
let cancelButtonWidget = null;

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

let pageRequest = null;

function doStartRecording() {
  showRecordingButtons();

  if (countdownWidget) {
    countdownWidget.setProperty(prop.TEXT, getRecordDuration().toString());
  }
  if (buttonWidget) {
    buttonWidget.setProperty(prop.TEXT, "STOP");
  }

  startRecording({
    onCountdown(value) {
      if (value >= 0 && countdownWidget) {
        countdownWidget.setProperty(prop.TEXT, value.toString());
      }
    },
    onStopped(filename) {
      if (buttonWidget) {
        buttonWidget.setProperty(prop.TEXT, "NEW");
      }
      showIdleButtons(true);

      // Auto-sync the recorded file
      const justFileName = filename.replace("data://dudus/", "");
      syncSingleFile(justFileName, pageRequest, (msg) => {
        if (countdownWidget) {
          countdownWidget.setProperty(prop.TEXT, msg);
        }
      });
    },
  });
}

function doTogglePlayback() {
  const filename = getCurrentFilename();
  if (!filename) return;

  if (isAudioPlaying()) {
    stopAudio();
    if (playButtonWidget) {
      playButtonWidget.setProperty(prop.TEXT, "PLAY");
    }
    return;
  }

  playAudio(filename, {
    onStart() {
      if (playButtonWidget) {
        playButtonWidget.setProperty(prop.TEXT, "STOP");
      }
      if (countdownWidget) {
        countdownWidget.setProperty(prop.TEXT, "Playing...");
      }
    },
    onComplete() {
      if (playButtonWidget) {
        playButtonWidget.setProperty(prop.TEXT, "PLAY");
      }
      if (countdownWidget) {
        countdownWidget.setProperty(prop.TEXT, "Done!");
      }
    },
    onError(msg) {
      if (countdownWidget) {
        countdownWidget.setProperty(prop.TEXT, msg);
      }
    },
  });
}

function doCancelRecording() {
  cancelRecording({
    onCancelled() {
      if (countdownWidget) {
        countdownWidget.setProperty(prop.TEXT, "Ready");
      }
      if (buttonWidget) {
        buttonWidget.setProperty(prop.TEXT, "NEW");
      }
      showIdleButtons(false);
    },
  });
}

const btnSize = Math.floor(width * 0.3);
const btnGap = Math.floor(width * 0.05);
const btnY = Math.floor(height / 2);

// Two buttons side by side: NEW (left) and PLAY (right)
const leftBtnX = Math.floor(width / 2 - btnSize - btnGap / 2);
const rightBtnX = Math.floor(width / 2 + btnGap / 2);

Page(BasePage({
  build() {
    setPageBrightTime({ brightTime: 600000 });
    pauseDropWristScreenOff({ duration: 600000 });

    pageRequest = this.request.bind(this);
    fetchSettings(pageRequest);
    // Countdown text - top half of screen
    countdownWidget = createWidget(widget.TEXT, {
      x: 0,
      y: Math.floor(height * 0.15),
      w: width,
      h: Math.floor(height * 0.3),
      text: getRecordDuration().toString(),
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
        if (isCurrentlyRecording()) {
          stopRecording();
        } else {
          stopAudio();
          doStartRecording();
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
        doTogglePlayback();
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
        doCancelRecording();
      },
    });
    cancelButtonWidget.setProperty(prop.VISIBLE, false);

    playButtonWidget.setProperty(prop.VISIBLE, false);

    // LIST button centered at bottom
    const bottomBtnW = Math.floor(width * 0.35);
    const bottomBtnH = 40;
    const bottomBtnY = btnY + btnSize + Math.floor(btnSize * 0.2);

    listButtonWidget = createWidget(widget.BUTTON, {
      x: Math.floor((width - bottomBtnW) / 2),
      y: bottomBtnY,
      w: bottomBtnW,
      h: bottomBtnH,
      radius: 8,
      normal_color: 0x444444,
      press_color: 0x666666,
      text: "LIST",
      text_size: 18,
      color: 0xffffff,
      click_func: () => {
        stopAudio();
        push({ url: "page/gt/home/audiolist.page" });
      },
    });
    listButtonWidget.setProperty(prop.VISIBLE, false);

    // Start first recording immediately
    doStartRecording();
  },

  onDestroy() {
    destroyRecorder();
    destroyPlayer();
    pageRequest = null;
    countdownWidget = null;
    buttonWidget = null;
    playButtonWidget = null;
    listButtonWidget = null;
    cancelButtonWidget = null;
  },
}));
