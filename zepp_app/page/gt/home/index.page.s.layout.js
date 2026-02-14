import * as hmUI from "@zos/ui";
import { getText } from "@zos/i18n";
import { getDeviceInfo } from "@zos/device";
import { px } from "@zos/utils";

export const { width: DEVICE_WIDTH, height: DEVICE_HEIGHT } = getDeviceInfo();

export const layout = {
  name: "main",
  elements: [
    {
      type: "button",
      prop: {
        id: "btn_stop",
        x: 96,
        y: 160,
        w: 88,
        h: 88,
        radius: 44,
        color: 0xff0000,
        border_color: 0xff0000,
      },
    },
  ],
};
