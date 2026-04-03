#!/usr/bin/env bash

set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

pattern='(^|/)(node_modules|dist)(/|$)|(^|/)\.DS_Store$|\.tsbuildinfo$'

if command -v rg >/dev/null 2>&1; then
  offenders="$(git ls-files | rg "${pattern}" || true)"
else
  offenders="$(git ls-files | grep -E "${pattern}" || true)"
fi

if [[ -n "${offenders}" ]]; then
  echo "Tracked repo hygiene violations found:"
  echo "${offenders}"
  echo
  echo "Remove tracked artifacts before committing."
  exit 1
fi

echo "Repo hygiene checks passed."
