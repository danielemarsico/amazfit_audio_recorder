import { readdirSync, rmSync, mkdirSync, readFileSync } from '@zos/fs';
import { createRecorder, createPlayer, codec } from './recorderFacade.js';
import { setTimeout, clearTimeout, setInterval, clearInterval } from '@zos/timer';
import TransferFile from "@zos/ble/TransferFile";

export const FOLDER_PATH = "data://dudus/";

let _recordDuration = 30;
let _uploadUrl = "http://192.168.100.123:9000/upload";
let _apiKey = "TESTAPIKEY";

export function getRecordDuration() {
  return _recordDuration;
}

export function fetchSettings(requestFn, callback) {
  if (!requestFn) {
    if (callback) callback();
    return;
  }
  requestFn({ method: "get.settings" })
    .then(function (result) {
      if (result && result.url) {
        _uploadUrl = result.url;
        console.log("[settings] URL:", _uploadUrl);
      }
      if (result && result.apiKey) {
        _apiKey = result.apiKey;
        console.log("[settings] API key set");
      }
      if (result && result.duration) {
        _recordDuration = result.duration;
        console.log("[settings] Duration:", _recordDuration);
      }
      if (callback) callback();
    })
    .catch(function (e) {
      console.log("[settings] fetch error:", e);
      if (callback) callback();
    });
}

function getUploadHeaders() {
  const headers = { "Content-Type": "application/json" };
  if (_apiKey) {
    headers["Authorization"] = "Bearer " + _apiKey;
  }
  return headers;
}

function makeUploadBody(fileName, base64) {
  const body = { fileName: fileName, data: base64 };
  if (_apiKey) {
    body.apiKey = _apiKey;
  }
  return JSON.stringify(body);
}

const AUDIO_FOLDER = 'dudus';

export function ensureFolder() {
  try {
    mkdirSync({ path: AUDIO_FOLDER });
  } catch (e) {
    // folder may already exist
  }
}

export function generateFilename() {
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

const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

export function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let result = "";
  const len = bytes.length;
  for (let i = 0; i < len; i += 3) {
    const a = bytes[i];
    const b = i + 1 < len ? bytes[i + 1] : 0;
    const c = i + 2 < len ? bytes[i + 2] : 0;
    result += B64[a >> 2];
    result += B64[((a & 3) << 4) | (b >> 4)];
    result += i + 1 < len ? B64[((b & 15) << 2) | (c >> 6)] : "=";
    result += i + 2 < len ? B64[c & 63] : "=";
  }
  return result;
}

let transferFileInstance = null;

function getOutbox() {
  if (!transferFileInstance) {
    transferFileInstance = new TransferFile();
  }
  return transferFileInstance.getOutbox();
}

export function syncAllFiles(requestFn, statusCallback, doneCallback) {
  const files = listAudioFiles();
  if (files.length === 0) {
    statusCallback("No files");
    if (doneCallback) doneCallback();
    return;
  }

  let index = 0;
  let hadError = false;

  function syncNext() {
    if (index >= files.length) {
      statusCallback(hadError ? "SYNC ERROR!" : "Synced!");
      if (doneCallback) doneCallback();
      return;
    }
    const fileName = files[index];
    statusCallback((index + 1) + "/" + files.length + " " + fileName);
    syncSingleFile(fileName, requestFn, (msg) => {
      statusCallback((index + 1) + "/" + files.length + " " + msg);
    }, (msg) => {
      console.log("[syncAll]", fileName, "->", msg);
      if (msg.indexOf("ERROR") !== -1) hadError = true;
      index++;
      syncNext();
    });
  }

  syncNext();
}

export function syncSingleFile(fileName, requestFn, statusCallback, doneCallback) {
  statusCallback("Uploading...");

  function finish(msg) {
    statusCallback(msg);
    if (doneCallback) doneCallback(msg);
  }

  function doBleTransfer(uploadOk) {
    statusCallback("Transferring...");
    let transferTimeout = null;
    let transferDone = false;

    try {
      const outbox = getOutbox();
      const filePath = FOLDER_PATH + fileName;
      const fileObject = outbox.enqueueFile(filePath, { fileName: fileName });
      console.log("[sync] Transfer enqueued:", fileName);

      transferTimeout = setTimeout(() => {
        if (!transferDone) {
          console.log("[sync] Transfer timeout:", fileName);
          transferDone = true;
          finish(uploadOk ? "Upload OK, transfer timeout" : "SYNC ERROR!");
        }
      }, 15000);

      fileObject.on("change", (event) => {
        if (transferDone) return;
        if (event.data.readyState === "transferred") {
          console.log("[sync] Transfer OK:", fileName);
          if (transferTimeout) clearTimeout(transferTimeout);
          transferDone = true;
          finish(uploadOk ? "Synced!" : "Transfer OK, upload failed");
        } else if (event.data.readyState === "error") {
          console.log("[sync] Transfer error:", fileName);
          if (transferTimeout) clearTimeout(transferTimeout);
          transferDone = true;
          finish("SYNC ERROR!");
        }
      });
    } catch (e) {
      console.log("[sync] Transfer enqueue error:", fileName, e);
      if (transferTimeout) clearTimeout(transferTimeout);
      finish(uploadOk ? "Upload OK, transfer error" : "SYNC ERROR!");
    }
  }

  // HTTP upload first, then BLE transfer
  if (!requestFn) {
    console.log("[sync] messaging not ready");
    doBleTransfer(false);
    return;
  }

  try {
    const data = readFileSync({ path: AUDIO_FOLDER + "/" + fileName });
    if (!data) {
      console.log("[sync] readFileSync returned null:", fileName);
      doBleTransfer(false);
      return;
    }

    console.log("[sync] Read", fileName, "size:", data.byteLength);
    const base64 = arrayBufferToBase64(data);

    requestFn({
      method: "http.request",
      params: {
        url: _uploadUrl,
        method: "POST",
        headers: getUploadHeaders(),
        body: makeUploadBody(fileName, base64),
      },
    })
      .then(function (res) {
        console.log("[sync] Upload OK:", fileName, JSON.stringify(res));
        doBleTransfer(true);
      })
      .catch(function (e) {
        console.log("[sync] Upload error:", fileName, JSON.stringify(e));
        doBleTransfer(false);
      });
  } catch (e) {
    console.log("[sync] File read error:", fileName, e);
    doBleTransfer(false);
  }
}

export function listAudioFiles() {
  try {
    const files = readdirSync({ path: AUDIO_FOLDER });
    if (!files || !Array.isArray(files)) return [];
    return files;
  } catch (e) {
    console.log('[audioController] Error reading folder:', e);
    return [];
  }
}

export function deleteAudioFile(fileName) {
  try {
    const fullPath = AUDIO_FOLDER + '/' + fileName;
    console.log('[audioController] Deleting file:', fullPath);
    rmSync({ path: fullPath });
    return true;
  } catch (e) {
    console.log('[audioController] Error deleting file:', e);
    return false;
  }
}

// --- Player API ---

let player = null;
let _isPlaying = false;

export function playAudio(filename, callbacks) {
  stopAudio();

  player = createPlayer();

  player.addEventListener(player.event.PREPARE, function (result) {
    if (result) {
      console.log("[player] Ready, starting playback");
      player.start();
      _isPlaying = true;
      if (callbacks.onStart) callbacks.onStart();
    } else {
      console.log("[player] Prepare failed");
      if (callbacks.onError) callbacks.onError("Play error");
    }
  });

  player.addEventListener(player.event.COMPLETE, function () {
    console.log("[player] Playback complete");
    _isPlaying = false;
    if (callbacks.onComplete) callbacks.onComplete();
  });

  player.setSource(player.source.FILE, { file: filename });
  player.prepare();
}

export function stopAudio() {
  if (player && _isPlaying) {
    try { player.stop(); } catch (e) {}
    _isPlaying = false;
  }
}

export function isAudioPlaying() {
  return _isPlaying;
}

export function destroyPlayer() {
  stopAudio();
  player = null;
}

// --- Recorder API ---

let recorder = null;
let _isRecording = false;
let _currentFilename = null;
let _countdownInterval = null;
let _storedCallbacks = null;

export function startRecording(callbacks) {
  stopAudio();
  _storedCallbacks = callbacks;

  let countdownValue = _recordDuration;
  ensureFolder();

  _currentFilename = generateFilename();
  console.log("[recorder] Saving to:", _currentFilename);

  if (!recorder) {
    recorder = createRecorder();
  }
  recorder.setFormat(codec.OPUS, { target_file: _currentFilename });

  recorder.start();
  _isRecording = true;
  console.log("[recorder] Started ->", _currentFilename);

  _countdownInterval = setInterval(() => {
    countdownValue--;
    if (callbacks.onCountdown) callbacks.onCountdown(countdownValue);
    if (countdownValue <= 0) {
      stopRecording();
    }
  }, 1000);
}

export function stopRecording() {
  if (!_isRecording) return;
  _isRecording = false;

  if (_countdownInterval) {
    clearInterval(_countdownInterval);
    _countdownInterval = null;
  }

  try {
    recorder.stop();
    console.log("[recorder] Stopped and saved.");
  } catch (err) {
    console.log("[recorder] Error stopping:", err);
  }

  if (_storedCallbacks && _storedCallbacks.onStopped) {
    _storedCallbacks.onStopped(_currentFilename);
  }
}

export function cancelRecording(callbacks) {
  if (!_isRecording) return;
  _isRecording = false;

  if (_countdownInterval) {
    clearInterval(_countdownInterval);
    _countdownInterval = null;
  }

  try { recorder.stop(); } catch (e) {}

  if (_currentFilename) {
    try {
      const relativePath = _currentFilename.replace("data://", "");
      rmSync({ path: relativePath });
      console.log("[recorder] Cancelled, deleted:", relativePath);
    } catch (e) {
      console.log("[recorder] Error deleting cancelled file:", e);
    }
  }

  _currentFilename = null;
  if (callbacks && callbacks.onCancelled) callbacks.onCancelled();
}

export function isCurrentlyRecording() {
  return _isRecording;
}

export function getCurrentFilename() {
  return _currentFilename;
}

export function destroyRecorder() {
  if (_isRecording) {
    stopRecording();
  }
  recorder = null;
  _storedCallbacks = null;
}
