import { readdirSync, rmSync } from '@zos/fs';

const AUDIO_FOLDER = 'dudus';

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
