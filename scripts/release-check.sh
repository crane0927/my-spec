#!/usr/bin/env bash
set -euo pipefail

npm run typecheck
npm run test
npm run build
npm pack --dry-run
