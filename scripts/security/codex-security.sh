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
cli_package="$repo_root/.github/codex-security/package.json"
cli_lock="$repo_root/.github/codex-security/package-lock.json"
scan_prompt="$repo_root/.github/codex-security/scan.md"

node_version="$(node --version 2>/dev/null || true)"
if [[ ! "$node_version" =~ ^v([0-9]+)\.([0-9]+)\.([0-9]+) ]]; then
  echo "Node.js is required to run Codex Security." >&2
  exit 2
fi
node_major="${BASH_REMATCH[1]}"
node_minor="${BASH_REMATCH[2]}"
case "$node_major" in
  22)
    if ((node_minor < 13)); then
      printf 'Codex Security requires Node.js 22.13+, 24, or 26; found %s.\n' \
        "$node_version" >&2
      exit 2
    fi
    ;;
  24 | 26) ;;
  *)
    printf 'Codex Security requires Node.js 22.13+, 24, or 26; found %s.\n' \
      "$node_version" >&2
    exit 2
    ;;
esac

cli_metadata="$(node - "$cli_package" "$cli_lock" <<'NODE'
const crypto = require('node:crypto');
const fs = require('node:fs');

const packagePath = process.argv[2];
const lockPath = process.argv[3];
const packageText = fs.readFileSync(packagePath, 'utf8');
const manifest = JSON.parse(packageText);
const lockText = fs.readFileSync(lockPath, 'utf8');
const lock = JSON.parse(lockText);
const version = manifest.dependencies?.['@openai/codex-security'];
const rootVersion = lock.packages?.['']?.dependencies?.['@openai/codex-security'];
const lockedVersion = lock.packages?.['node_modules/@openai/codex-security']?.version;

if (!/^\d+\.\d+\.\d+$/.test(version) || version !== rootVersion || version !== lockedVersion) {
  throw new Error('Codex Security package and lock versions must be one matching exact version.');
}

const digest = crypto
  .createHash('sha256')
  .update(packageText)
  .update('\0')
  .update(lockText)
  .digest('hex');
console.log(`${version} ${digest}`);
NODE
)"
cli_version="${cli_metadata%% *}"
install_digest="${cli_metadata#* }"

ensure_private_directory() {
  local path="$1"
  local owner permissions

  if [[ ! -e "$path" ]]; then
    install -d -m 0700 "$path"
  fi
  if [[ -L "$path" || ! -d "$path" ]]; then
    printf 'Codex Security path must be a real directory, not a symlink: %s\n' "$path" >&2
    exit 2
  fi
  read -r owner permissions < <(node - "$path" <<'NODE'
const fs = require('node:fs');
const stats = fs.lstatSync(process.argv[2]);
console.log(`${stats.uid} ${(stats.mode & 0o777).toString(8)}`);
NODE
  )
  if [[ "$owner" != "$(id -u)" ]] || (((8#$permissions & 077) != 0)); then
    printf 'Codex Security path must be owned by the current user with private permissions: %s\n' "$path" >&2
    exit 2
  fi
}

canonicalize_path() {
  node - "$1" <<'NODE'
const fs = require('node:fs');
const path = require('node:path');

let existing = path.resolve(process.argv[2]);
const missing = [];
while (!fs.existsSync(existing)) {
  missing.unshift(path.basename(existing));
  existing = path.dirname(existing);
}
console.log(path.join(fs.realpathSync(existing), ...missing));
NODE
}

umask 077
tmp_root="${TMPDIR:-/tmp}"
cache_dir="${CODEX_SECURITY_CACHE_DIR:-${XDG_CACHE_HOME:-$tmp_root}/codex-security/$repo_name/cli-$cli_version-$install_digest}"
output_root="${CODEX_SECURITY_OUTPUT_ROOT:-$tmp_root/codex-security-results/$repo_name}"
state_dir="${CODEX_SECURITY_STATE_DIR:-${XDG_STATE_HOME:-$tmp_root}/codex-security/$repo_name/state}"

for outside_path in "$cache_dir" "$output_root" "$state_dir"; do
  if [[ "$outside_path" != /* ]]; then
    printf 'Codex Security paths must be absolute: %s\n' "$outside_path" >&2
    exit 2
  fi
  if [[ -L "$outside_path" ]]; then
    printf 'Codex Security paths must not be symlinks: %s\n' "$outside_path" >&2
    exit 2
  fi
done

cache_dir="$(canonicalize_path "$cache_dir")"
output_root="$(canonicalize_path "$output_root")"
state_dir="$(canonicalize_path "$state_dir")"
for outside_path in "$cache_dir" "$output_root" "$state_dir"; do
  case "$outside_path/" in
    "$repo_root/"*)
      printf 'Codex Security paths must be outside the repository: %s\n' "$outside_path" >&2
      exit 2
      ;;
  esac
done

ensure_private_directory "$cache_dir"
ensure_private_directory "$output_root"
ensure_private_directory "$state_dir"
cli_bin="$cache_dir/node_modules/.bin/codex-security"
install_marker="$cache_dir/.install-recipe.sha256"
installed_digest=""
if [[ -f "$install_marker" ]]; then
  installed_digest="$(<"$install_marker")"
fi
if [[ ! -x "$cli_bin" || "$installed_digest" != "$install_digest" ]]; then
  install -m 0600 "$cli_package" "$cache_dir/package.json"
  install -m 0600 "$cli_lock" "$cache_dir/package-lock.json"
  npm ci \
    --prefix "$cache_dir" \
    --ignore-scripts \
    --no-audit \
    --no-fund
  printf '%s\n' "$install_digest" > "$install_marker"
fi

installed_version="$($cli_bin --version | sed -nE 's/[^0-9]*([0-9]+\.[0-9]+\.[0-9]+).*/\1/p' | head -n 1)"
if [[ "$installed_version" != "$cli_version" ]]; then
  printf 'Expected Codex Security %s, found %s.\n' "$cli_version" "${installed_version:-unknown}" >&2
  exit 2
fi

scan_dir="$(mktemp -d "$output_root/$mode.XXXXXX")"
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
