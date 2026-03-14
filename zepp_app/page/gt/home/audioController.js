import { readdirSync, rmSync, mkdirSync, readFileSync } from '@zos/fs';
import { createRecorder, createPlayer, codec } from './recorderFacade.js';
import { setInterval, clearInterval } from '@zos/timer';
import { SIMULATOR_MODE } from './config.js';

const AUDIO_FOLDER = 'dudus';
export const FOLDER_PATH = `data://${AUDIO_FOLDER}/`;


let _recordDuration = 30;




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


export function syncAllFiles(requestFn, statusCallback, doneCallback) {
  const files = listAudioFiles();
  if (files.length === 0) {
    statusCallback("No files");
    if (doneCallback) doneCallback();
    return;
  }

  doSyncAll(files, requestFn, statusCallback, doneCallback);
}

function doSyncAll(files, requestFn, statusCallback, doneCallback) {
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
  if (fileName.startsWith(FOLDER_PATH)) {
    fileName = fileName.slice(FOLDER_PATH.length);
  }
  statusCallback("Uploading...");

  function finish(msg) {
    statusCallback(msg);
    if (doneCallback) doneCallback(msg);
  }

  if (!requestFn) {
    console.log("[sync] messaging not ready");
    finish("SYNC ERROR!");
    return;
  }

  try {
    const data = readFileSync({ path: AUDIO_FOLDER + "/" + fileName });
    if (!data) {
      console.log("[sync] readFileSync returned null:", fileName);
      finish("SYNC ERROR!");
      return;
    }

    console.log("[sync] Read", fileName, "size:", data.byteLength);
    const base64 = arrayBufferToBase64(data);

    requestFn({
      method: "upload.file",
      params: { fileName, base64 },
    })
      .then(function (res) {
        console.log("[sync] Upload OK:", fileName, JSON.stringify(res));
        finish("Synced!");
      })
      .catch(function (e) {
        console.log("[sync] Upload error:", fileName, JSON.stringify(e));
        finish("SYNC ERROR!");
      });
  } catch (e) {
    console.log("[sync] File read error:", fileName, e);
    finish("SYNC ERROR!");
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
