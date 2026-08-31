#!/usr/bin/env bash

set -euo pipefail

outputs=(
  quality
  unit
  e2e
  build
  duplication
  osv
  semgrep
  codeql_actions
  codeql_javascript
)

declare -A selected=()
for output in "${outputs[@]}"; do
  selected["$output"]="false"
done

select_output() {
  selected["$1"]="true"
}

select_all() {
  for output in "${outputs[@]}"; do
    selected["$output"]="true"
  done
}

select_ci_all() {
  for output in quality unit e2e build duplication; do
    select_output "$output"
  done
}

select_security_all() {
  for output in osv semgrep codeql_actions codeql_javascript; do
    select_output "$output"
  done
}

classify_path() {
  local path="$1"
  local known=false

  # Semgrep includes a secrets ruleset, so every tracked text change remains
  # security-relevant. The only narrow exception is the repository's binary
  # icon set, which Semgrep cannot meaningfully inspect.
  case "$path" in
    assets/icons/*.png) ;;
    *) select_output semgrep ;;
  esac

  case "$path" in
    packages/core | .gitmodules | package.json | pnpm-lock.yaml | pnpm-workspace.yaml)
      known=true
      select_ci_all
      select_output osv
      select_output codeql_javascript
      ;;
  esac

  case "$path" in
    src/*)
      known=true
      select_ci_all
      select_output codeql_javascript
      ;;
    scripts/* | tooling/*)
      known=true
      for output in quality unit e2e build codeql_javascript; do
        select_output "$output"
      done
      ;;
    test/unit/* | test/setup.ts | vitest.config.ts | tsconfig.test.json)
      known=true
      select_output unit
      select_output codeql_javascript
      ;;
    test/e2e/firefox-extension-runtime.test.ts | test/e2e/fixtures/artifacts.ts)
      known=true
      select_output quality
      select_output e2e
      select_output codeql_javascript
      ;;
    test/e2e/playwright*.config.ts | test/e2e/specs/accessibility.spec.ts)
      known=true
      select_output unit
      select_output e2e
      select_output codeql_javascript
      ;;
    test/e2e/*)
      known=true
      select_output e2e
      select_output codeql_javascript
      ;;
    test/fixtures/*)
      known=true
      select_output unit
      select_output e2e
      select_output codeql_javascript
      ;;
    test/visual/*)
      known=true
      select_output codeql_javascript
      ;;
    extension/*)
      known=true
      select_output unit
      select_output e2e
      select_output build
      ;;
    assets/*)
      known=true
      select_output e2e
      select_output build
      ;;
  esac

  case "$path" in
    vite*.ts | tsconfig.json | tsconfig.e2e.json | biome.json | knip.json)
      known=true
      for output in quality unit e2e build codeql_javascript; do
        select_output "$output"
      done
      ;;
    .nose-baseline.json | nose.toml | scripts/ci/install-nose.sh)
      known=true
      select_output quality
      select_output duplication
      ;;
    stryker.conf.json | stryker.conf.fast.json)
      known=true
      select_output unit
      ;;
    README.md)
      known=true
      # Browser compatibility is a tested README contract.
      select_output unit
      ;;
  esac

  case "$path" in
    .github/workflows/ci.yaml | scripts/ci/classify-changes.sh)
      known=true
      select_ci_all
      ;;
    .github/workflows/security.yaml)
      known=true
      select_output unit
      select_security_all
      ;;
    .github/workflows/deep-checks.yaml | .github/workflows/release.yaml)
      known=true
      select_output unit
      ;;
    .github/workflows/dependabot-auto-merge.yaml | \
      .github/workflows/dependabot-auto-merge-apply.yaml | \
      .github/workflows/codex-security.yaml | \
      .github/actions/*)
      known=true
      select_output unit
      ;;
    .github/codex-security/*)
      known=true
      select_output unit
      select_output osv
      ;;
  esac

  case "$path" in
    .github/workflows/* | .github/actions/* | .github/settings.yaml)
      known=true
      # Workflow and required-context contracts are exercised by Vitest.
      select_output unit
      ;;
  esac

  case "$path" in
    .github/workflows/* | .github/actions/*)
      known=true
      select_output codeql_actions
      ;;
    scripts/security/codex-security/package.json | scripts/security/codex-security/package-lock.json)
      known=true
      select_output osv
      ;;
  esac

  case "$path" in
    CHANGELOG.md | CODE_OF_CONDUCT.md | CONTRIBUTING.md | LICENSE | PRIVACY.md | SECURITY.md | SUPPORT.md | \
      docs/* | .github/ISSUE_TEMPLATE/* | .github/pull_request_template.md | .github/SECURITY.md | \
      .github/CODEOWNERS | .github/dependabot.yaml | .gitignore | .gitattributes)
      known=true
      ;;
  esac

  if [[ "$known" != true ]]; then
    echo "Unknown changed path; enabling every check: $path" >&2
    select_all
  fi
}

emit_outputs() {
  local reason="$1"
  local destination="${GITHUB_OUTPUT:-/dev/stdout}"

  {
    for output in "${outputs[@]}"; do
      printf '%s=%s\n' "$output" "${selected[$output]}"
    done
    printf 'reason=%s\n' "$reason"
  } >> "$destination"
}

if [[ "${1:-}" == "--files" ]]; then
  shift
  for path in "$@"; do
    classify_path "$path"
  done
  emit_outputs "explicit-file-list"
  exit 0
fi

event_name="${GITHUB_EVENT_NAME:-unknown}"
case "$event_name" in
  workflow_dispatch | schedule)
    select_all
    emit_outputs "$event_name-full"
    exit 0
    ;;
  push | pull_request | merge_group) ;;
  *)
    select_all
    emit_outputs "unknown-event-full"
    exit 0
    ;;
esac

base_sha="${BASE_SHA:-}"
head_sha="${HEAD_SHA:-}"
if [[ ! "$base_sha" =~ ^[0-9a-f]{40}$ || ! "$head_sha" =~ ^[0-9a-f]{40}$ || "$base_sha" =~ ^0+$ ]]; then
  select_all
  emit_outputs "invalid-revision-full"
  exit 0
fi

diff_range="$base_sha..$head_sha"
if [[ "$event_name" == "pull_request" || "$event_name" == "merge_group" ]]; then
  diff_range="$base_sha...$head_sha"
fi

if ! diff_file="$(mktemp)"; then
  select_all
  emit_outputs "temporary-file-failed-full"
  exit 0
fi
trap 'rm -f "$diff_file"' EXIT
if ! git diff --name-only -z "$diff_range" > "$diff_file" 2>/dev/null; then
  select_all
  emit_outputs "diff-failed-full"
  exit 0
fi

changed_files=()
while IFS= read -r -d '' path; do
  changed_files+=("$path")
done < "$diff_file"

if (( ${#changed_files[@]} == 0 )); then
  select_all
  emit_outputs "empty-diff-full"
  exit 0
fi

for path in "${changed_files[@]}"; do
  classify_path "$path"
done

emit_outputs "classified-${#changed_files[@]}-files"
