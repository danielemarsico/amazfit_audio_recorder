import { readdirSync, unlinkSync } from '@zos/fs';
import { playAudio } from '@zos/audio';

const AUDIO_FOLDER = 'dudus';

export function listAudioFiles() {
  try {
    console.log('[audioController] Tentativo di leggere cartella:', AUDIO_FOLDER);
    const files = readdirSync({ path: AUDIO_FOLDER });
    var items = files.map(fileName => ({ path: fileName, play: 'P',  delete: 'D' }));
    return items;
  } catch (e) {
    console.error('[audioController] Errore lettura cartella:', e);
    return [];
  }
}

export function deleteAudioFile(fileName) {
  try {
    const fullPath = AUDIO_FOLDER + fileName;
    console.log('[audioController] Eliminazione file:', fullPath);
    unlinkSync({ path: fullPath });
    return true;
  } catch (e) {
    console.error('[audioController] Errore eliminazione file:', e);
    return false;
  }
}

export function playAudioFile(fileName) {
  try {
    const fullPath = AUDIO_FOLDER + fileName;
    console.log('[audioController] Riproduzione file:', fullPath);
    playAudio({ path: fullPath });
  } catch (e) {
    console.error('[audioController] Errore riproduzione file:', e);
  }
}
