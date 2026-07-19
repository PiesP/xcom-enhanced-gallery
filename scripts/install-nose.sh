#!/usr/bin/env bash

set -euo pipefail

: "${GH_TOKEN:?GH_TOKEN is required}"
: "${GITHUB_PATH:?GITHUB_PATH is required}"

nose_version="0.17.0"
installer="${RUNNER_TEMP:-${TMPDIR:-/tmp}}/nose-cli-installer.sh"

curl --fail --silent --show-error --location --proto '=https' --tlsv1.2 \
  "https://github.com/corca-ai/nose/releases/download/v${nose_version}/nose-cli-installer.sh" \
  --output "$installer"

expected_digest="$(gh api \
  "repos/corca-ai/nose/releases/tags/v${nose_version}" \
  --jq '.assets[] | select(.name == "nose-cli-installer.sh") | .digest' \
  | sed 's/^sha256://')"
if [[ ! "$expected_digest" =~ ^[0-9a-fA-F]{64}$ ]]; then
  echo "❌ Missing or invalid SHA-256 digest for nose installer" >&2
  exit 1
fi

printf '%s  %s\n' "$expected_digest" "$installer" | sha256sum --check --status
sh "$installer"
printf '%s\n' "$HOME/.cargo/bin" >> "$GITHUB_PATH"
