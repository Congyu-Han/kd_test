#!/usr/bin/env bash
set -euo pipefail

pnpm lint
pnpm typecheck
pnpm test

if command -v k6 >/dev/null 2>&1; then
  k6 run perf/k6-phase2.js
else
  echo "k6 not installed; skipping perf run"
fi
