"""
Convert ZeppOS custom opus files to standard Ogg-Opus.

ZeppOS opus container format:
  - Each frame: 4-byte big-endian payload length + 4 bytes (flags/unknown) + opus payload
  - Sample rate: 16000 Hz, Mono, 20ms frames

Output: standard Ogg-Opus file playable by VLC, Windows, Chrome, ffmpeg, etc.
No native dependencies required.

Usage:
    python opus_convert.py input.opus output.ogg
    python opus_convert.py input.opus  # outputs input.ogg
"""

import struct
import sys


def _crc32_ogg_table():
    table = []
    for i in range(256):
        val = i << 24
        for _ in range(8):
            if val & 0x80000000:
                val = ((val << 1) ^ 0x04C11DB7) & 0xFFFFFFFF
            else:
                val = (val << 1) & 0xFFFFFFFF
        table.append(val)
    return table


_CRC_TABLE = _crc32_ogg_table()


def _ogg_crc(data):
    crc = 0
    for b in data:
        crc = ((crc << 8) ^ _CRC_TABLE[((crc >> 24) & 0xFF) ^ b]) & 0xFFFFFFFF
    return crc


def _ogg_page(header_type, granule, serial, page_seq, payload):
    """Build a single Ogg page."""
    # Segment table: split payload into 255-byte segments
    remaining = len(payload)
    segments = []
    while remaining >= 255:
        segments.append(255)
        remaining -= 255
    segments.append(remaining)

    seg_count = len(segments)
    seg_table = bytes(segments)

    # Build header with CRC=0 first
    header = struct.pack(
        "<4sBBqIIIB",
        b"OggS",       # capture pattern
        0,             # version
        header_type,   # header type flags
        granule,       # granule position
        serial,        # serial number
        page_seq,      # page sequence number
        0,             # CRC (placeholder)
        seg_count,     # number of segments
    )
    page_no_crc = header + seg_table + payload

    # Calculate CRC and rebuild
    crc = _ogg_crc(page_no_crc)
    header = struct.pack(
        "<4sBBqIIIB",
        b"OggS", 0, header_type, granule, serial, page_seq, crc, seg_count,
    )
    return header + seg_table + payload


def _opus_head(channels=1, pre_skip=312, sample_rate=16000):
    """OpusHead header packet."""
    return struct.pack(
        "<8sBBHIhB",
        b"OpusHead",
        1,             # version
        channels,
        pre_skip,      # pre-skip (encoder delay)
        sample_rate,   # input sample rate
        0,             # output gain
        0,             # channel mapping family
    )


def _opus_tags():
    """OpusTags header packet."""
    vendor = b"DuDu Converter"
    return struct.pack("<8sI", b"OpusTags", len(vendor)) + vendor + struct.pack("<I", 0)


def parse_zeppos_opus(data):
    """Extract opus frames from ZeppOS custom container."""
    frames = []
    offset = 0
    while offset + 8 <= len(data):
        payload_len = struct.unpack(">I", data[offset:offset + 4])[0]
        offset += 8  # skip length (4) + flags (4)

        if payload_len <= 0 or offset + payload_len > len(data):
            break

        frames.append(data[offset:offset + payload_len])
        offset += payload_len

    return frames


def convert_zeppos_opus_to_ogg(input_path, output_path=None):
    """Convert ZeppOS opus to standard Ogg-Opus."""
    if output_path is None:
        output_path = input_path.rsplit(".", 1)[0] + ".ogg"

    with open(input_path, "rb") as f:
        data = f.read()

    print(f"Input: {input_path} ({len(data)} bytes)")

    frames = parse_zeppos_opus(data)
    print(f"Extracted {len(frames)} opus frames")

    if not frames:
        print("No frames found!")
        return None

    serial = 0x44754475  # "DuDu"
    page_seq = 0

    pages = []

    # Page 0: OpusHead (BOS = beginning of stream)
    pages.append(_ogg_page(0x02, 0, serial, page_seq, _opus_head()))
    page_seq += 1

    # Page 1: OpusTags
    pages.append(_ogg_page(0x00, 0, serial, page_seq, _opus_tags()))
    page_seq += 1

    # Audio pages: pack multiple frames per page (up to ~4000 bytes)
    # At 16kHz, 20ms frames = 320 samples per frame
    samples_per_frame = 320
    pre_skip = 312
    granule = pre_skip  # start after pre-skip
    page_payload = bytearray()
    frame_sizes = []
    frames_in_page = 0

    for i, frame in enumerate(frames):
        is_last = (i == len(frames) - 1)

        page_payload.extend(frame)
        frame_sizes.append(len(frame))
        frames_in_page += 1
        granule += samples_per_frame

        # Flush page if payload is getting large or last frame
        if len(page_payload) > 3000 or is_last:
            # Build segment table for multiple packets in one page
            seg_table = bytearray()
            for size in frame_sizes:
                while size >= 255:
                    seg_table.append(255)
                    size -= 255
                seg_table.append(size)

            header_type = 0x04 if is_last else 0x00  # EOS flag on last page
            header = struct.pack(
                "<4sBBqIIIB",
                b"OggS", 0, header_type, granule, serial, page_seq, 0, len(seg_table),
            )
            page_data = header + bytes(seg_table) + bytes(page_payload)
            crc = _ogg_crc(page_data)
            header = struct.pack(
                "<4sBBqIIIB",
                b"OggS", 0, header_type, granule, serial, page_seq, crc, len(seg_table),
            )
            pages.append(header + bytes(seg_table) + bytes(page_payload))
            page_seq += 1
            page_payload = bytearray()
            frame_sizes = []
            frames_in_page = 0

    with open(output_path, "wb") as f:
        for page in pages:
            f.write(page)

    duration = (len(frames) * samples_per_frame) / 16000
    print(f"Output: {output_path} ({duration:.1f}s, {len(pages)} pages)")
    return output_path


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python opus_convert.py input.opus [output.ogg]")
        sys.exit(1)

    input_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else None
    convert_zeppos_opus_to_ogg(input_file, output_file)
