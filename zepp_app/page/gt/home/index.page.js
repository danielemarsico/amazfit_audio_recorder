import { createWidget, widget, align, prop } from '@zos/ui'
import { create, id, codec } from "@zos/media";
import { setTimeout, clearTimeout, setInterval, clearInterval } from "@zos/timer";
import { getDeviceInfo } from "@zos/device";
import { openSync, writeSync, closeSync, mkdirSync, O_RDWR, O_CREAT } from '@zos/fs';
import { push } from "@zos/router";

const recorder = create(id.RECORDER);
let stopTimeout = null;
let countdownInterval = null;

let countdownValue = 30;
let countdownWidget = null;
let buttonWidget = null;


import AutoGUI from "@silver-zepp/autogui"
const gui = new AutoGUI;

let my_text= null;
let rec_button = null;

// Ottieni dimensioni schermo
const { width, height } = getDeviceInfo()

// Calcola dinamicamente le posizioni
const buttonSize = 100;
const buttonY = Math.floor(height / 2 + 0);
const buttonX = Math.floor((width - buttonSize) / 2);
const textY = Math.floor(height / 2 - 100); // più in alto del centro


const folderPath = 'data://dudus/';

const result = mkdirSync({
  path: 'dudus',
})

if (result === 0) {
  console.log('mkdirSync success')
}else{
  console.log('failed to create dudu folder:'+ result)
}


// Generazione nome file
function generateFilename() {
  const now = new Date();
  const pad = n => n.toString().padStart(2, '0');

  const year = now.getFullYear();
  const month = pad(now.getMonth() + 1);
  const day = pad(now.getDate());
  const hours = pad(now.getHours());
  const minutes = pad(now.getMinutes());
  const seconds = pad(now.getSeconds());

  return folderPath +`record_${year}${month}${day}_${hours}${minutes}${seconds}.opus`;
}


function getTimestamp() {
  const now = new Date();
  const pad = (n) => (n < 10 ? '0' + n : n);
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

function createDummyFile() {
  const folderPath = 'data://dudus/';
  const fileName = `dummy_${getTimestamp()}.txt`;
  const filePath = folderPath + fileName;
  
  try {
    const fd = openSync({
      path: filePath,
      flag: O_RDWR | O_CREAT,
    });

    const message = 'File creato da Dudu!';
    const buffer = new ArrayBuffer(message.length);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < message.length; i++) {
      view[i] = message.charCodeAt(i);
    }

    writeSync({
      fd,
      buffer,
    });

    closeSync({ fd });

    console.log("Dummy file creato:", filePath);
  } catch (err) {
    console.error("Errore nella creazione del dummy file:", err);
  }
}



function stopRecording() {
    if (stopTimeout) {
      clearTimeout(stopTimeout);
      stopTimeout = null;
    }
    if (countdownInterval) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }
	
	rec_button.update({ text: "End" });
    //try {
    //  recorder.stop();
    //  console.log("Recording stopped and saved.");
    //  countdownWidget.setProperty(prop.TEXT, "Registrato");
    //  buttonWidget.setProperty(prop.TEXT, "ok");
    //} catch (err) {
    //  console.error("Error stopping recorder:", err);
    //}
  }

Page({
  build() {
	  
	const filename = generateFilename();
    console.log("Saving to file:", filename);

    recorder.setFormat(codec.OPUS, {
      target_file: filename
    });
	  
	my_text = gui.text(countdownValue.toString());
	gui.newRow(); // ---
	rec_button = gui.button("REC", () => {
		stopRecording();
	},{ radius: 100,});
	gui.render();
	
	    // Avvia registrazione
    recorder.start();
    console.log("Recording started");

	
	// Countdown
	countdownInterval = setInterval(() => {
		countdownValue--;
		if (countdownValue >= 0) {
			my_text.update({ text: countdownValue.toString() });
		}
		if (countdownValue <= 0) {
			stopRecording();
			
		}
	}, 1000);
	
	stopTimeout = setTimeout(() => {
      stopRecording();
    }, 30 * 1000);
  },	  
	  
});





/**
Page({
  build() {
    

    
    const rootContainer = createWidget(widget.VIRTUAL_CONTAINER, {
      layout: {
        display: 'flex',
        'flex-flow': 'column',
        x: '0px',
        y: '0px',
        width: '100vw',
        height: '100vh',
        'justify-content': 'space-between',
        'align-items': 'center'
      }
    })

    // Countdown testo
    countdownWidget = createWidget(widget.TEXT, {
      parent: rootContainer,
      text_size: 48,
      text: countdownValue.toString(),
      color: 0xffffff,
      align_h: align.CENTER_H,
      align_v: align.CENTER_V,
      layout:{
        width:'200',
        height:'33%',
      }
    });

    // Pulsante rosso
    buttonWidget = createWidget(widget.BUTTON, {
      parent: rootContainer,
      radius: buttonSize / 2,
      normal_color: 0xfc6950,
      press_color: 0xfeb4a8,
      text: "rec",
      align_h: align.CENTER_H,
      align_v: align.CENTER_V,
      layout:{
        width:buttonSize,
        height:'33%',
      },
      click_func: () => {
        console.log("Red circle tapped, stopping recorder...");
        this.stopRecording();
        createDummyFile(); // 
      }
    });

    // Secondo pulsante sotto per mostrare la lista file
    createWidget(widget.BUTTON, {
      parent: rootContainer,
      radius: 10,
      normal_color: 0x555555,
      press_color: 0x999999,
      text: 'Show files',
      align_h: align.CENTER_H,
      align_v: align.CENTER_V,
      layout:{
        width:width,
        height:'33%',
      },
      click_func: () => {
        push({ url: "page/gt/home/audiolist.page" });
      }
    });



    
  
  
  },

  

 
  
});
**/

