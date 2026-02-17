import { create, id, codec } from '@zos/media';
import { writeFileSync } from '@zos/fs';

const DEBUG = true;

// Minimal valid Opus silence frame (mono, 16kHz, 20ms)
// TOC byte 0xF8 = config 31 (Hybrid, 20ms), mono, 0 frames code => silence
// followed by a single zero byte for the frame
const SILENCE_FRAME = [0xf8, 0xff, 0xfe];
const FRAMES_COUNT = 100; // 100 frames × 20ms = 2 seconds

function createFakeRecorder() {
  let targetFile = null;

  return {
    setFormat(codecType, options) {
      targetFile = options.target_file;
      console.log("[fakeRecorder] setFormat, target:", targetFile);
    },
    start() {
      console.log("[fakeRecorder] start (no-op, file written on stop)");
    },
    stop() {
      console.log("[fakeRecorder] stop, writing fake opus to:", targetFile);
      if (!targetFile) return;

      // Build ZeppOS opus container: each frame = 4-byte BE length + 4-byte flags + opus payload
      const framePayloadLen = SILENCE_FRAME.length;
      const frameSize = 4 + 4 + framePayloadLen; // header + flags + payload
      const totalSize = frameSize * FRAMES_COUNT;
      const buffer = new ArrayBuffer(totalSize);
      const view = new DataView(buffer);
      const bytes = new Uint8Array(buffer);

      for (let i = 0; i < FRAMES_COUNT; i++) {
        const offset = i * frameSize;
        // 4-byte big-endian payload length
        view.setUint32(offset, framePayloadLen, false);
        // 4-byte flags (zeros)
        view.setUint32(offset + 4, 0, false);
        // Opus payload
        for (let j = 0; j < framePayloadLen; j++) {
          bytes[offset + 8 + j] = SILENCE_FRAME[j];
        }
      }

      // Write relative to data:// — strip the prefix
      const relativePath = targetFile.replace("data://", "");
      writeFileSync({ path: relativePath, data: buffer });
      console.log("[fakeRecorder] Wrote", totalSize, "bytes to", relativePath);
    },
  };
}

export function createRecorder() {
  if (DEBUG) {
    console.log("[recorderFacade] Using FAKE recorder (DEBUG mode)");
    return createFakeRecorder();
  }
  console.log("[recorderFacade] Using real recorder");
  return create(id.RECORDER);
}

export { codec };
