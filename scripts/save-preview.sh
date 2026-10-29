#!/usr/bin/env bash
# Plan morning-digest § 3: save one rig page as a single HTML file (ADR 0001, 0003).
# Usage: scripts/save-preview.sh [night] [out]. LANE_MARKER comes from the environment;
# unset it to save the clean copy (§ 4).
set -euo pipefail
night="${1:-2026-10-28}"
out="${2:-preview/index.html}"
port="${PORT:-8787}"

PORT="$port" npx tsx --env-file-if-exists=.env src/server.ts >/dev/null 2>&1 &
pid=$!
trap 'kill $pid 2>/dev/null' EXIT
for _ in $(seq 1 50); do curl -fs "http://localhost:$port/health" >/dev/null && break; sleep 0.2; done

mkdir -p "$(dirname "$out")"
curl -fsS "http://localhost:$port/digest/$night" -o "$out"
echo "saved /digest/$night -> $out"
