#!/usr/bin/env python3
from __future__ import annotations

import json
import os
import subprocess
import threading
from datetime import datetime, timezone
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

ROOT = Path(__file__).resolve().parent.parent
NATIVE_SRC = ROOT / "backend" / "native" / "speakset_native.cpp"
NATIVE_BIN = ROOT / "backend" / "native" / "speakset_native"

_messages_lock = threading.Lock()
_messages_by_channel: dict[str, list[dict]] = {
    "text:general": [
        {
            "id": "seed_1",
            "author": "alex",
            "text": "Welcome to Speakset 👋",
            "at": datetime.now(timezone.utc).isoformat(),
            "reactions": {},
        },
        {
            "id": "seed_2",
            "author": "rhea",
            "text": "Backend is live with Python + C++ 🔥",
            "at": datetime.now(timezone.utc).isoformat(),
            "reactions": {"🔥": 2},
        },
    ]
}


def ensure_native_binary() -> None:
    if NATIVE_BIN.exists() and NATIVE_BIN.stat().st_mtime >= NATIVE_SRC.stat().st_mtime:
        return
    compile_cmd = [
        "g++",
        "-std=c++17",
        "-O2",
        str(NATIVE_SRC),
        "-o",
        str(NATIVE_BIN),
    ]
    subprocess.run(compile_cmd, check=True)


def run_native(*args: str) -> str:
    ensure_native_binary()
    output = subprocess.check_output([str(NATIVE_BIN), *args], text=True)
    return output.strip()


class SpeaksetHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_json(self, status: int, payload: dict) -> None:
        raw = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def parse_json_body(self) -> dict:
        length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(length) if length else b"{}"
        return json.loads(raw.decode("utf-8"))

    def do_GET(self):
        parsed = urlparse(self.path)

        if parsed.path == "/api/health":
            self.end_json(HTTPStatus.OK, {"ok": True, "backend": "python+cpp"})
            return

        if parsed.path == "/api/messages":
            params = parse_qs(parsed.query)
            channel = params.get("channel", ["text:general"])[0]
            with _messages_lock:
                messages = list(_messages_by_channel.get(channel, []))
            self.end_json(HTTPStatus.OK, {"channel": channel, "messages": messages})
            return

        return super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)

        if parsed.path == "/api/login":
            body = self.parse_json_body()
            username = str(body.get("username", "")).strip()
            password = str(body.get("password", "")).strip()
            if not username or not password:
                self.end_json(HTTPStatus.BAD_REQUEST, {"error": "username and password are required"})
                return

            token = run_native("token", username)
            self.end_json(
                HTTPStatus.OK,
                {
                    "token": token,
                    "username": username,
                    "issuedAt": datetime.now(timezone.utc).isoformat(),
                },
            )
            return

        if parsed.path == "/api/messages":
            body = self.parse_json_body()
            channel = str(body.get("channel", "text:general")).strip() or "text:general"
            author = str(body.get("author", "anonymous")).strip() or "anonymous"
            text = str(body.get("text", "")).strip()
            if not text:
                self.end_json(HTTPStatus.BAD_REQUEST, {"error": "text is required"})
                return

            message_id = run_native("message_id", author, text, channel)
            message = {
                "id": message_id,
                "author": author,
                "text": text,
                "at": datetime.now(timezone.utc).isoformat(),
                "reactions": {},
            }
            with _messages_lock:
                _messages_by_channel.setdefault(channel, []).append(message)
            self.end_json(HTTPStatus.CREATED, {"message": message})
            return

        self.end_json(HTTPStatus.NOT_FOUND, {"error": "unknown endpoint"})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "4173"))
    server = ThreadingHTTPServer(("0.0.0.0", port), SpeaksetHandler)
    print(f"Speakset backend listening on http://0.0.0.0:{port}")
    server.serve_forever()
