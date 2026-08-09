#!/usr/bin/env bash

# Keep this bootstrap in shell: CI must install Nose before project dependencies are available.
set -euo pipefail

: "${GITHUB_PATH:?GITHUB_PATH is required}"

nose_version="0.20.0"
nose_installer_sha256="1b8c99b810ffc946e861bee0dad3ccb8140751e0f03ed4531da819043d64f3ee"
installer="${RUNNER_TEMP:-${TMPDIR:-/tmp}}/nose-cli-installer.sh"

curl --fail --silent --show-error --location --proto '=https' --tlsv1.2 \
  "https://github.com/corca-ai/nose/releases/download/v${nose_version}/nose-cli-installer.sh" \
  --output "$installer"

printf '%s  %s\n' "$nose_installer_sha256" "$installer" | sha256sum --check --status
env -u GH_TOKEN -u GITHUB_TOKEN -u NOSE_CLI_GITHUB_TOKEN sh "$installer"
printf '%s\n' "$HOME/.cargo/bin" >> "$GITHUB_PATH"
