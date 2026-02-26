/**
 * DuDu Cloudflare Worker
 *
 * Receives audio uploads from the ZeppOS watch app, converts the custom
 * ZeppOS Opus container to standard Ogg-Opus in memory, transcribes it
 * with OpenAI Whisper, and returns the transcription. No files are saved.
 *
 * Required secrets (set via: wrangler secret put <NAME>):
 *   OPENAI_API_KEY  - Your OpenAI API key
 *   API_KEY         - (optional) Bearer token the watch must send
 */

// ---------------------------------------------------------------------------
// Ogg CRC-32
// ---------------------------------------------------------------------------

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let val = i << 24;
    for (let j = 0; j < 8; j++) {
      val = val & 0x80000000 ? (((val << 1) ^ 0x04c11db7) >>> 0) : (val << 1) >>> 0;
    }
    table[i] = val;
  }
  return table;
})();

function oggCrc(data) {
  let crc = 0;
  for (const b of data) {
    crc = (((crc << 8) ^ CRC_TABLE[((crc >>> 24) & 0xff) ^ b]) >>> 0);
  }
  return crc;
}

// ---------------------------------------------------------------------------
// Ogg page builder
// ---------------------------------------------------------------------------

/**
 * Build a single Ogg page.
 * @param {number}     headerType  - 0x00 continuation, 0x02 BOS, 0x04 EOS
 * @param {number}     granule     - granule position (53-bit safe integer)
 * @param {number}     serial      - stream serial number
 * @param {number}     pageSeq     - page sequence number
 * @param {Uint8Array} segTable    - pre-built lacing segment table
 * @param {Uint8Array} payload     - packet data matching the segment table
 */
function buildOggPage(headerType, granule, serial, pageSeq, segTable, payload) {
  const size = 27 + segTable.length + payload.length;
  const page = new Uint8Array(size);
  const view = new DataView(page.buffer);

  // Capture pattern "OggS"
  page[0] = 0x4f; page[1] = 0x67; page[2] = 0x67; page[3] = 0x53;
  page[4] = 0;             // version
  page[5] = headerType;
  // granule position as two 32-bit LE words (granule fits in 32 bits for our files)
  view.setUint32(6, granule >>> 0, true);
  view.setUint32(10, 0, true);           // high 32 bits (always 0 for us)
  view.setUint32(14, serial >>> 0, true);
  view.setUint32(18, pageSeq >>> 0, true);
  view.setUint32(22, 0, true);           // CRC placeholder
  page[26] = segTable.length;

  page.set(segTable, 27);
  page.set(payload, 27 + segTable.length);

  const crc = oggCrc(page);
  view.setUint32(22, crc, true);

  return page;
}

/** Build a segment table that splits a single packet into 255-byte lacings. */
function simpleSegTable(payloadLen) {
  const segs = [];
  let rem = payloadLen;
  while (rem >= 255) { segs.push(255); rem -= 255; }
  segs.push(rem);
  return new Uint8Array(segs);
}

// ---------------------------------------------------------------------------
// Ogg-Opus header packets
// ---------------------------------------------------------------------------

function buildOpusHead(channels = 1, preSkip = 312, sampleRate = 16000) {
  // 19 bytes: "OpusHead" + version + channels + pre_skip + sample_rate + gain + mapping
  const buf = new Uint8Array(19);
  const view = new DataView(buf.buffer);
  buf.set([0x4f, 0x70, 0x75, 0x73, 0x48, 0x65, 0x61, 0x64]); // "OpusHead"
  buf[8] = 1;            // version
  buf[9] = channels;
  view.setUint16(10, preSkip, true);
  view.setUint32(12, sampleRate, true);
  view.setInt16(16, 0, true);  // output gain
  buf[18] = 0;           // channel mapping family
  return buf;
}

function buildOpusTags() {
  const vendor = new TextEncoder().encode('DuDu Worker');
  const buf = new Uint8Array(8 + 4 + vendor.length + 4);
  const view = new DataView(buf.buffer);
  buf.set([0x4f, 0x70, 0x75, 0x73, 0x54, 0x61, 0x67, 0x73]); // "OpusTags"
  view.setUint32(8, vendor.length, true);
  buf.set(vendor, 12);
  view.setUint32(12 + vendor.length, 0, true); // zero user comments
  return buf;
}

// ---------------------------------------------------------------------------
// ZeppOS Opus → Ogg-Opus (port of opus_convert.py)
// ---------------------------------------------------------------------------

/**
 * Parse the ZeppOS custom opus container.
 * Each frame: 4-byte BE payload length + 4 bytes flags + opus payload.
 */
function parseZeppOsOpus(data) {
  const frames = [];
  let offset = 0;
  while (offset + 8 <= data.length) {
    const payloadLen =
      (data[offset] << 24 | data[offset + 1] << 16 | data[offset + 2] << 8 | data[offset + 3]) >>> 0;
    offset += 8; // skip length field (4) + flags (4)
    if (payloadLen === 0 || offset + payloadLen > data.length) break;
    frames.push(data.slice(offset, offset + payloadLen));
    offset += payloadLen;
  }
  return frames;
}

/**
 * Convert ZeppOS opus bytes to a standard Ogg-Opus Uint8Array in memory.
 * Audio parameters: 16 kHz, mono, 20 ms frames (320 samples/frame).
 * Uses one Ogg page per Opus frame — simpler and always valid.
 */
function convertZeppOsOpusToOgg(audioBytes) {
  const frames = parseZeppOsOpus(audioBytes);
  if (frames.length === 0) throw new Error('No opus frames found in ZeppOS container');

  const SERIAL = 0x44754475; // "DuDu"
  const SAMPLES_PER_FRAME = 320;
  const PRE_SKIP = 312;

  let pageSeq = 0;
  const pages = [];

  // Page 0: OpusHead (beginning of stream)
  const head = buildOpusHead();
  pages.push(buildOggPage(0x02, 0, SERIAL, pageSeq++, simpleSegTable(head.length), head));

  // Page 1: OpusTags
  const tags = buildOpusTags();
  pages.push(buildOggPage(0x00, 0, SERIAL, pageSeq++, simpleSegTable(tags.length), tags));

  // One Ogg page per Opus frame — avoids multi-packet lacing complexity
  let granule = PRE_SKIP;
  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];
    const isLast = i === frames.length - 1;
    granule += SAMPLES_PER_FRAME;
    const headerType = isLast ? 0x04 : 0x00; // EOS on last page
    pages.push(buildOggPage(headerType, granule, SERIAL, pageSeq++, simpleSegTable(frame.length), frame));
  }

  // Concatenate all pages into one buffer
  const totalSize = pages.reduce((sum, p) => sum + p.length, 0);
  const result = new Uint8Array(totalSize);
  let offset = 0;
  for (const page of pages) { result.set(page, offset); offset += page.length; }
  return result;
}

// ---------------------------------------------------------------------------
// Base64 decode (works in Cloudflare Workers via atob)
// ---------------------------------------------------------------------------

function base64ToUint8Array(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// ---------------------------------------------------------------------------
// Cloudflare Workers AI transcription
// ---------------------------------------------------------------------------

async function transcribeWithCfAi(oggBytes, ai, language) {
  const input = { audio: [...oggBytes] };
  if (language) input.language = language;
  const result = await ai.run('@cf/openai/whisper', input);
  return result.text;
}

// ---------------------------------------------------------------------------
// Todoist integration
// ---------------------------------------------------------------------------

const TODOIST_MAX_TITLE = 500;

async function createTodoistTask(transcription, todoistApiKey) {
  const title = transcription.length > TODOIST_MAX_TITLE
    ? transcription.slice(0, TODOIST_MAX_TITLE - 1) + '…'
    : transcription;

  const resp = await fetch('https://api.todoist.com/api/v1/tasks', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${todoistApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      content: title,
      description: transcription,
      due_string: 'today',
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Todoist API error ${resp.status}: ${err}`);
  }

  return await resp.json();
}

// ---------------------------------------------------------------------------
// Worker entry point
// ---------------------------------------------------------------------------

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'GET') {
      return new Response('DuDu transcription worker is running. POST audio to /upload.', {
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    if (request.method !== 'POST' || (url.pathname !== '/upload' && url.pathname !== '/debug-ogg')) {
      return new Response('Not Found', { status: 404 });
    }

    // --- Auth ---
    const authHeader = request.headers.get('Authorization') || '';
    const bearerKey = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

    let body;
    try {
      body = await request.json();
    } catch {
      return json400('Invalid JSON body');
    }

    const providedKey = bearerKey || body.apiKey || '';
    if (env.API_KEY && providedKey !== env.API_KEY) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { fileName, data: base64Data, language, todoistApiKey } = body;
    if (!base64Data) return json400('Missing data field');

    // --- Decode ---
    let audioBytes;
    try {
      audioBytes = base64ToUint8Array(base64Data);
    } catch (e) {
      return json400('Invalid base64 data: ' + e.message);
    }

    // --- Convert ZeppOS Opus → Ogg-Opus ---
    let oggBytes;
    let frameCount;
    try {
      const frames = parseZeppOsOpus(audioBytes);
      frameCount = frames.length;
      if (frameCount === 0) return json500('No opus frames found in ZeppOS container');
      oggBytes = convertZeppOsOpusToOgg(audioBytes);
    } catch (e) {
      return json500('Opus conversion failed: ' + e.message);
    }

    // --- Debug endpoint: return raw Ogg for manual inspection ---
    if (url.pathname === '/debug-ogg') {
      return new Response(oggBytes, {
        headers: {
          'Content-Type': 'audio/ogg',
          'Content-Disposition': `attachment; filename="${(fileName || 'audio').replace(/\.opus$/i, '')}.ogg"`,
          'X-Frame-Count': String(frameCount),
          'X-Ogg-Size': String(oggBytes.length),
        },
      });
    }

    // --- Transcribe ---
    let transcription;
    try {
      transcription = await transcribeWithCfAi(oggBytes, env.AI, language);
    } catch (e) {
      return json500('Transcription failed: ' + e.message);
    }

    // --- Create Todoist task (optional) ---
    let todoistTask = null;
    if (todoistApiKey) {
      try {
        todoistTask = await createTodoistTask(transcription, todoistApiKey);
      } catch (e) {
        return json500('Todoist error: ' + e.message);
      }
    }

    return new Response(
      JSON.stringify({ ok: true, file: fileName, size: audioBytes.length, transcription, todoistTask }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  },
};

function json400(msg) {
  return new Response(JSON.stringify({ error: msg }), {
    status: 400, headers: { 'Content-Type': 'application/json' },
  });
}

function json500(msg) {
  return new Response(JSON.stringify({ error: msg }), {
    status: 500, headers: { 'Content-Type': 'application/json' },
  });
}
