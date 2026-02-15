import { BaseApp } from "@zeppos/zml/base-app";

App(
  BaseApp({
    onCreate() {
      console.log("DuDu App init");
    },
    onDestroy() {
      console.log("App destroyed");
    },
  })
);
