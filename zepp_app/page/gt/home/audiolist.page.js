import { createWidget, widget, align, prop } from "@zos/ui";
import { push, back, replace } from "@zos/router";
import { getDeviceInfo } from "@zos/device";
import { setPageBrightTime, pauseDropWristScreenOff } from "@zos/display";
import { BasePage } from "@zeppos/zml/base-page";
import {
  listAudioFiles, deleteAudioFile, syncAllFiles, fetchSettings, FOLDER_PATH,
  playAudio, stopAudio, isAudioPlaying, destroyPlayer,
} from "./audioController.js";

const { width, height } = getDeviceInfo();

const ROW_HEIGHT = 60;
const BTN_W = 50;
const PADDING = 10;
const START_Y = 60;



let activePlayBtn = null;
let statusWidget = null;

function stopPlayerUI() {
  stopAudio();
  if (activePlayBtn) {
    activePlayBtn.setProperty(prop.TEXT, "P");
    activePlayBtn = null;
  }
}

function playFile(filePath, playBtn) {
  if (isAudioPlaying()) {
    const wasPlaying = activePlayBtn;
    stopPlayerUI();
    // If same button tapped again, just stop
    if (wasPlaying === playBtn) return;
  }

  activePlayBtn = playBtn;

  playAudio(filePath, {
    onStart() {
      playBtn.setProperty(prop.TEXT, "S");
    },
    onComplete() {
      playBtn.setProperty(prop.TEXT, "P");
      activePlayBtn = null;
    },
    onError(msg) {
      console.log("[audiolist] Play error:", msg);
      activePlayBtn = null;
    },
  });
}

Page(BasePage({
  build() {
    setPageBrightTime({ brightTime: 600000 });
    pauseDropWristScreenOff({ duration: 600000 });

    const files = listAudioFiles();
    const pageRequest = this.request.bind(this);
    fetchSettings(pageRequest);

    // Title
    createWidget(widget.TEXT, {
      x: 0,
      y: PADDING,
      w: width,
      h: 40,
      text: "Recordings",
      text_size: 28,
      color: 0xffffff,
      align_h: align.CENTER_H,
    });

    // Status text for upload feedback
    statusWidget = createWidget(widget.TEXT, {
      x: 0,
      y: height - 100,
      w: width,
      h: 30,
      text: "",
      text_size: 16,
      color: 0xaaaaaa,
      align_h: align.CENTER_H,
    });

    // Bottom buttons: BACK and SYNC side by side
    const bottomBtnW = Math.floor(width * 0.35);
    const bottomBtnH = 40;
    const bottomBtnY = height - 60;
    const bottomGap = Math.floor(width * 0.04);
    const bottomLeftX = Math.floor(width / 2 - bottomBtnW - bottomGap / 2);
    const bottomRightX = Math.floor(width / 2 + bottomGap / 2);

    createWidget(widget.BUTTON, {
      x: bottomLeftX,
      y: bottomBtnY,
      w: bottomBtnW,
      h: bottomBtnH,
      radius: 8,
      normal_color: 0x444444,
      press_color: 0x666666,
      text: "BACK",
      text_size: 18,
      color: 0xffffff,
      click_func: () => {
        stopPlayerUI();
        back();
      },
    });

    createWidget(widget.BUTTON, {
      x: bottomRightX,
      y: bottomBtnY,
      w: bottomBtnW,
      h: bottomBtnH,
      radius: 8,
      normal_color: 0x4caf50,
      press_color: 0x81c784,
      text: "SYNC",
      text_size: 18,
      color: 0xffffff,
      click_func: () => {
        syncAllFiles(pageRequest, (message) => {
          if (statusWidget) {
            statusWidget.setProperty(prop.TEXT, message);
          }
        }, () => {
          replace({ url: "page/gt/home/audiolist.page" });
        });
      },
    });

    if (files.length === 0) {
      createWidget(widget.TEXT, {
        x: 0,
        y: Math.floor(height / 2) - 20,
        w: width,
        h: 40,
        text: "No recordings",
        text_size: 24,
        color: 0x888888,
        align_h: align.CENTER_H,
      });
      return;
    }

    const textW = width - BTN_W * 2 - PADDING * 3;

    for (let i = 0; i < files.length; i++) {
      const fileName = files[i];
      const y = START_Y + i * (ROW_HEIGHT + PADDING);

      // Filename label - strip extension for display
      const displayName = fileName.replace('.opus', '');
      createWidget(widget.TEXT, {
        x: PADDING,
        y: y,
        w: textW,
        h: ROW_HEIGHT,
        text: displayName,
        text_size: 18,
        color: 0xffffff,
        align_v: align.CENTER_V,
      });

      // Play button
      const playBtn = createWidget(widget.BUTTON, {
        x: PADDING + textW,
        y: y,
        w: BTN_W,
        h: ROW_HEIGHT,
        radius: 8,
        normal_color: 0x2196f3,
        press_color: 0x64b5f6,
        text: "P",
        text_size: 20,
        color: 0xffffff,
        click_func: () => {
          playFile(FOLDER_PATH + fileName, playBtn);
        },
      });

      // Delete button
      createWidget(widget.BUTTON, {
        x: PADDING + textW + BTN_W,
        y: y,
        w: BTN_W,
        h: ROW_HEIGHT,
        radius: 8,
        normal_color: 0xf44336,
        press_color: 0xef9a9a,
        text: "X",
        text_size: 20,
        color: 0xffffff,
        click_func: () => {
          stopPlayerUI();
          deleteAudioFile(fileName);
          replace({ url: "page/gt/home/audiolist.page" });
        },
      });
    }
  },

  onDestroy() {
    destroyPlayer();
    activePlayBtn = null;
    statusWidget = null;
  },
}));
