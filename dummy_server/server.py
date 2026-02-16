"""
Simple HTTP server to receive DuDu audio uploads.

Usage:
    python server.py [--port 8080] [--output-dir ./recordings]

The server listens for POST requests on /upload and saves the raw body
as an audio file. The filename comes from the X-Filename header.
"""

import argparse
import base64
import json
import os
from datetime import datetime
from http.server import HTTPServer, BaseHTTPRequestHandler


class UploadHandler(BaseHTTPRequestHandler):
    output_dir = "./recordings"

    def do_POST(self):
        content_length = int(self.headers.get("Content-Length", 0))
        if content_length == 0:
            self.send_response(400)
            self.end_headers()
            self.wfile.write(b"Empty body")
            return

        raw_body = self.rfile.read(content_length)
        content_type = self.headers.get("Content-Type", "")

        # Handle base64-encoded JSON from ZeppOS watch
        if "application/json" in content_type:
            try:
                payload = json.loads(raw_body)
                filename = payload.get("fileName", "")
                body = base64.b64decode(payload.get("data", ""))
                print(f"Received JSON upload: {filename} ({len(body)} bytes decoded from base64)")
            except (json.JSONDecodeError, Exception) as e:
                print(f"JSON decode error: {e}")
                self.send_response(400)
                self.end_headers()
                self.wfile.write(b"Invalid JSON")
                return
        else:
            # Raw binary upload
            body = raw_body
            filename = self.headers.get("X-Filename", "")

        if not filename:
            filename = datetime.now().strftime("dudu_%Y%m%d_%H%M%S.opus")

        # Sanitize filename
        filename = os.path.basename(filename)

        os.makedirs(self.output_dir, exist_ok=True)
        filepath = os.path.join(self.output_dir, filename)

        # Avoid overwriting
        base, ext = os.path.splitext(filepath)
        counter = 1
        while os.path.exists(filepath):
            filepath = f"{base}_{counter}{ext}"
            counter += 1

        with open(filepath, "wb") as f:
            f.write(body)

        print(f"Saved: {filepath} ({len(body)} bytes)")

        # Auto-convert ZeppOS opus to standard Ogg-Opus
        if filepath.endswith(".opus"):
            try:
                from opus_convert import convert_zeppos_opus_to_ogg
                ogg_path = convert_zeppos_opus_to_ogg(filepath)
                if ogg_path:
                    print(f"Converted: {ogg_path}")
            except Exception as e:
                print(f"  Conversion failed: {e}")

        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(f'{{"ok":true,"file":"{os.path.basename(filepath)}","size":{len(body)}}}'.encode())

    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-Type", "text/plain")
        self.end_headers()
        self.wfile.write(b"DuDu upload server is running. POST audio to /upload.")


def main():
    parser = argparse.ArgumentParser(description="DuDu audio upload server")
    parser.add_argument("--port", type=int, default=8080)
    parser.add_argument("--output-dir", default="./recordings")
    args = parser.parse_args()

    UploadHandler.output_dir = args.output_dir

    server = HTTPServer(("0.0.0.0", args.port), UploadHandler)
    print(f"Listening on http://0.0.0.0:{args.port}")
    print(f"Saving files to: {os.path.abspath(args.output_dir)}")
    print("Press Ctrl+C to stop")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down.")
        server.server_close()


if __name__ == "__main__":
    main()
