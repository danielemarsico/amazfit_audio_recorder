import { createWidget, widget, align, prop } from "@zos/ui";
import { push, back, replace } from "@zos/router";
import { create, id, codec } from "@zos/media";
import { getDeviceInfo } from "@zos/device";
import { listAudioFiles, deleteAudioFile } from "./audioController.js";

const { width, height } = getDeviceInfo();
const FOLDER_PATH = "data://dudus/";

const ROW_HEIGHT = 60;
const BTN_W = 50;
const PADDING = 10;
const START_Y = 60;

let player = null;
let isPlaying = false;
let activePlayBtn = null;

function stopPlayer() {
  if (player && isPlaying) {
    try { player.stop(); } catch (e) {}
    isPlaying = false;
    if (activePlayBtn) {
      activePlayBtn.setProperty(prop.TEXT, "P");
      activePlayBtn = null;
    }
  }
}

function playFile(filePath, playBtn) {
  if (isPlaying) {
    stopPlayer();
    // If same button tapped again, just stop
    if (activePlayBtn === playBtn) return;
  }

  player = create(id.PLAYER);
  activePlayBtn = playBtn;

  player.addEventListener(player.event.PREPARE, function (result) {
    if (result) {
      player.start();
      isPlaying = true;
      playBtn.setProperty(prop.TEXT, "S");
    } else {
      console.log("[audiolist] Player prepare failed");
    }
  });

  player.addEventListener(player.event.COMPLETE, function () {
    isPlaying = false;
    playBtn.setProperty(prop.TEXT, "P");
    activePlayBtn = null;
  });

  player.setSource(player.source.FILE, { file: filePath });
  player.prepare();
}

Page({
  build() {
    const files = listAudioFiles();

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

    // Back button
    const backBtnW = Math.floor(width * 0.3);
    createWidget(widget.BUTTON, {
      x: Math.floor((width - backBtnW) / 2),
      y: height - 60,
      w: backBtnW,
      h: 40,
      radius: 8,
      normal_color: 0x444444,
      press_color: 0x666666,
      text: "BACK",
      text_size: 18,
      color: 0xffffff,
      click_func: () => {
        stopPlayer();
        back();
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
          stopPlayer();
          deleteAudioFile(fileName);
          replace({ url: "page/gt/home/audiolist.page" });
        },
      });
    }
  },

  onDestroy() {
    stopPlayer();
    player = null;
  },
});
