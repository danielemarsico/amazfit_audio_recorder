import { createWidget, widget, align } from "@zos/ui";
import { push } from "@zos/router";
import { getDeviceInfo } from "@zos/device";
import { listAudioFiles, deleteAudioFile, playAudioFile } from "./audioController.js";

const { width, height } = getDeviceInfo();

Page({
  build() {
    const items = listAudioFiles()

    const rootContainer = createWidget(widget.VIRTUAL_CONTAINER, {
      layout: {
        display: 'flex',
        'flex-flow': 'column',
        x: 0,
        y: 0,
        width: '100vw',
        height: '100vh',
        'justify-content': 'flex-start',
        'align-items': 'center'
      }
    });

    createWidget(widget.TEXT, {
      parent: rootContainer,
      text: "Memo salvati:",
      text_size: 48,
      color: 0xffffff,
      x: 0,
      y: 100,
      w: width,
      h: 100,
    });

    createWidget(widget.SCROLL_LIST, {
      parent: rootContainer,
      x: 0,
      y: 100,
      w: width,
      h: height - 100,
      item_space: 20,
      snap_to_center: false,
      data_array: items,
      data_count: items.length,
      item_config: [
        {
          type_id: 1,
          item_bg_color: 0x222222,
          item_bg_radius: 10,
          item_height: 30,
          text_view: [
            { x: 0,  y: 0, w: width-40, h: 30, key: 'path', color: 0xffffff, text_size: 24 }, // nome file
            { x: width-40, y: 0, w: 20, h: 30, key: 'play', color: 0xffffff, text_size: 24 }, // Play
            { x: width-20, y: 0, w: 20, h: 30, key: 'delete', color: 0xffffff, text_size: 24 }  // Delete
          ],
          text_view_count: 3
        }
      ],
      item_config_count: 1,
      item_click_func: (index, clickX, clickY) => {
        const fileName = "";
        console.log('[audioLIst] clicked file:');
        // Coordinate Play
        if (clickX > width * 0.6 && clickX < width * 0.6 + 60) {
          playAudioFile(fileName);
        }
        // Coordinate Delete
        else if (clickX > width * 0.7 && clickX < width * 0.7 + 60) {
          if (deleteAudioFile(fileName)) {
            push({ url: "page/gt/home/audiolist.page" }); // refresh lista
          }
        }
      }
    });
  }
});
