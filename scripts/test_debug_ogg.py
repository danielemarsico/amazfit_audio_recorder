"""
Test the Cloudflare Worker endpoints.
Usage:
  python test_debug_ogg.py <path-to-opus-file>                    # test Ogg conversion only
  python test_debug_ogg.py <path-to-opus-file> --upload           # transcribe (auto-detect language)
  python test_debug_ogg.py <path-to-opus-file> --upload --lang it # transcribe with language hint
"""

import sys
import base64
import json
import urllib.request

BASE_URL = "https://dudu-transcription.marsicod.workers.dev"
API_KEY  = "a3d1c00b-6427-4133-a417-1d2c04c8e193"

def main():
    if len(sys.argv) < 2:
        print("Usage: python test_debug_ogg.py <path-to-opus-file> [--upload]")
        sys.exit(1)

    opus_path = sys.argv[1]
    upload_mode = "--upload" in sys.argv

    language = None
    if "--lang" in sys.argv:
        lang_idx = sys.argv.index("--lang")
        if lang_idx + 1 < len(sys.argv):
            language = sys.argv[lang_idx + 1]

    endpoint = "/upload" if upload_mode else "/debug-ogg"
    url = BASE_URL + endpoint
    print(f"Endpoint: {url}")

    with open(opus_path, "rb") as f:
        raw = f.read()

    print(f"Read {len(raw)} bytes from {opus_path}")

    b64 = base64.b64encode(raw).decode("ascii")
    print(f"Base64 length: {len(b64)} chars")

    payload = {"fileName": "test.opus", "data": b64}
    if language:
        payload["language"] = language
        print(f"Language hint: {language}")
    body = json.dumps(payload).encode("utf-8")
    print(f"Request body size: {len(body)} bytes")

    req = urllib.request.Request(
        url,
        data=body,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {API_KEY}",
            "User-Agent": "curl/8.16.0",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req) as resp:
            status = resp.status
            headers = dict(resp.headers)
            data = resp.read()
    except urllib.error.HTTPError as e:
        status = e.code
        headers = dict(e.headers)
        data = e.read()

    print(f"HTTP status: {status}")
    content_type = headers.get('Content-Type') or headers.get('content-type', 'n/a')
    print(f"Content-Type:  {content_type}")

    if upload_mode:
        print("Response:", data.decode("utf-8", errors="replace"))
    else:
        print(f"X-Frame-Count: {headers.get('X-Frame-Count') or headers.get('x-frame-count', 'n/a')}")
        print(f"X-Ogg-Size:    {headers.get('X-Ogg-Size') or headers.get('x-ogg-size', 'n/a')}")
        print(f"Response size: {len(data)} bytes")
        if status == 200:
            out_path = "converted.ogg"
            with open(out_path, "wb") as f:
                f.write(data)
            print(f"Saved to {out_path} — open in VLC to verify")
        else:
            print("Error response:", data.decode("utf-8", errors="replace"))

if __name__ == "__main__":
    main()
