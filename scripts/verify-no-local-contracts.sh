#!/usr/bin/env bash
set -euo pipefail

PATTERN='^\s*(export\s+)?(interface|type)\s+(ApiResponse|SourceArticle|StoryCluster|TickerSnapshot|Briefing|WatchlistItem|Alert)\b'
TARGETS=("apps/desktop" "services/intelligence")

if rg --line-number --glob '!**/node_modules/**' --regexp "$PATTERN" "${TARGETS[@]}"; then
  echo "\nFound local runtime contract redefinitions. Import from @situation-monitor/shared-types instead." >&2
  exit 1
fi

echo "No local runtime contract redefinitions found in apps/desktop or services/intelligence."
