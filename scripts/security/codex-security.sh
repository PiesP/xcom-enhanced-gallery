#!/usr/bin/env bash

set -euo pipefail

usage() {
  cat <<'EOF'
Usage: scripts/security/codex-security.sh <dry-run|working-tree|branch|full> [base-revision]

Environment overrides:
  CODEX_SECURITY_AUTH        Authentication mode (default: chatgpt)
  CODEX_SECURITY_CACHE_DIR   Outside-repository CLI installation directory
  CODEX_SECURITY_MAX_COST    Scan cost limit in USD (default: 5)
  CODEX_SECURITY_OUTPUT_ROOT Outside-repository result directory parent
  CODEX_SECURITY_STATE_DIR   Persistent outside-repository scan state directory
EOF
}

mode="${1:-}"
case "$mode" in
  dry-run | working-tree | branch | full) ;;
  *)
    usage >&2
    exit 2
    ;;
esac
shift
if (($# > 1)) || { [[ "$mode" != branch ]] && (($# > 0)); }; then
  usage >&2
  exit 2
fi

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
repo_root="$(git -C "$script_dir" rev-parse --show-toplevel)"
repo_name="$(basename -- "$repo_root")"
workflow="$repo_root/.github/workflows/codex-security.yaml"
scan_prompt="$repo_root/.github/codex-security/scan.md"

cli_version="$(sed -nE 's/^[[:space:]]*CODEX_SECURITY_VERSION:[[:space:]]*"([^"[:space:]]+)".*/\1/p' "$workflow")"
if [[ -z "$cli_version" || "$(printf '%s\n' "$cli_version" | wc -l)" -ne 1 ]]; then
  printf 'Unable to read one exact CODEX_SECURITY_VERSION from %s.\n' "$workflow" >&2
  exit 2
fi

node_version="$(node --version 2>/dev/null || true)"
if [[ ! "$node_version" =~ ^v([0-9]+)\.([0-9]+)\.([0-9]+) ]]; then
  echo "Node.js is required to run Codex Security." >&2
  exit 2
fi
node_major="${BASH_REMATCH[1]}"
node_minor="${BASH_REMATCH[2]}"
if ((node_major < 22 || (node_major == 22 && node_minor < 13))); then
  printf 'Codex Security %s requires Node.js >=22.13.0; found %s.\n' "$cli_version" "$node_version" >&2
  exit 2
fi

tmp_root="${TMPDIR:-/tmp}"
cache_dir="${CODEX_SECURITY_CACHE_DIR:-${XDG_CACHE_HOME:-$tmp_root}/codex-security/$repo_name/cli-$cli_version}"
output_root="${CODEX_SECURITY_OUTPUT_ROOT:-$tmp_root/codex-security-results/$repo_name}"
state_dir="${CODEX_SECURITY_STATE_DIR:-${XDG_STATE_HOME:-$tmp_root}/codex-security/$repo_name/state}"

for outside_path in "$cache_dir" "$output_root" "$state_dir"; do
  if [[ "$outside_path" != /* ]]; then
    printf 'Codex Security paths must be absolute: %s\n' "$outside_path" >&2
    exit 2
  fi
  case "$outside_path/" in
    "$repo_root/"*)
      printf 'Codex Security paths must be outside the repository: %s\n' "$outside_path" >&2
      exit 2
      ;;
  esac
done

install -d -m 0700 "$cache_dir" "$output_root" "$state_dir"
cli_bin="$cache_dir/node_modules/.bin/codex-security"
if [[ ! -x "$cli_bin" ]]; then
  npm install \
    --prefix "$cache_dir" \
    --ignore-scripts \
    --no-audit \
    --no-fund \
    --package-lock=false \
    "@openai/codex-security@$cli_version"
fi

installed_version="$($cli_bin --version | sed -nE 's/[^0-9]*([0-9]+\.[0-9]+\.[0-9]+).*/\1/p' | head -n 1)"
if [[ "$installed_version" != "$cli_version" ]]; then
  printf 'Expected Codex Security %s, found %s.\n' "$cli_version" "${installed_version:-unknown}" >&2
  exit 2
fi

run_id="$(date -u +%Y%m%dT%H%M%SZ)-$$"
scan_dir="$output_root/$mode-$run_id"
install -d -m 0700 "$scan_dir"
export CODEX_SECURITY_STATE_DIR="$state_dir"

args=(
  scan
  "$repo_root"
  --output-dir "$scan_dir"
  --scan-prompt-file "$scan_prompt"
)
for knowledge_base in \
  "$repo_root/.github/codex-security/threat-model.md" \
  "$repo_root/.github/SECURITY.md" \
  "$repo_root/PRIVACY.md"; do
  if [[ -f "$knowledge_base" ]]; then
    args+=(--knowledge-base "$knowledge_base")
  fi
done

case "$mode" in
  dry-run)
    args+=(--dry-run)
    ;;
  working-tree)
    args+=(--working-tree --base HEAD --auth "${CODEX_SECURITY_AUTH:-chatgpt}")
    ;;
  branch)
    base_ref="${1:-origin/master}"
    merge_base="$(git -C "$repo_root" merge-base "$base_ref" HEAD)"
    args+=(--diff "$merge_base" --head HEAD --auth "${CODEX_SECURITY_AUTH:-chatgpt}")
    ;;
  full)
    args+=(--mode standard --auth "${CODEX_SECURITY_AUTH:-chatgpt}")
    ;;
esac

if [[ "$mode" != dry-run ]]; then
  args+=(--max-cost "${CODEX_SECURITY_MAX_COST:-5}")
fi

printf 'Codex Security %s mode=%s output=%s state=%s\n' \
  "$cli_version" "$mode" "$scan_dir" "$state_dir" >&2
exec "$cli_bin" "${args[@]}"
