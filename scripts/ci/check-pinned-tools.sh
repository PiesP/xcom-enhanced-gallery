#!/usr/bin/env bash

set -euo pipefail

: "${GH_TOKEN:?GH_TOKEN is required}"

cooling_hours=24
cutoff_epoch="$(date -u -d "$cooling_hours hours ago" +%s)"

latest_mature_release() {
  local repository="$1"
  local tag published published_epoch

  while IFS=$'\t' read -r tag published; do
    published_epoch="$(date -u -d "$published" +%s)"
    if ((published_epoch <= cutoff_epoch)); then
      printf '%s\n' "${tag#v}"
      return 0
    fi
  done < <(
    gh api "repos/$repository/releases?per_page=100" \
      --jq '.[] | select(.draft == false and .prerelease == false) | [.tag_name, .published_at] | @tsv'
  )

  printf 'No stable %s release older than %s hours was found.\n' \
    "$repository" "$cooling_hours" >&2
  return 1
}

check_release() {
  local name="$1"
  local current="$2"
  local repository="$3"
  local expected

  expected="$(latest_mature_release "$repository")"
  if [[ "$current" != "$expected" ]]; then
    printf '::error title=%s update available::Pinned %s; latest stable release older than %sh is %s.\n' \
      "$name" "$current" "$cooling_hours" "$expected"
    return 1
  fi

  printf '✓ %s %s is current after the %sh cooling window.\n' \
    "$name" "$current" "$cooling_hours"
}

check_release_asset_digest() {
  local name="$1"
  local repository="$2"
  local version="$3"
  local asset_name="$4"
  local expected_digest="$5"
  local actual_digest

  if [[ ! "$expected_digest" =~ ^[0-9a-fA-F]{64}$ ]]; then
    printf '::error title=%s digest invalid::Pinned SHA-256 digest is missing or malformed.\n' \
      "$name"
    return 1
  fi

  actual_digest="$(gh api "repos/$repository/releases/tags/v$version" \
    --jq ".assets[] | select(.name == \"$asset_name\") | .digest" \
    | sed 's/^sha256://')"
  if [[ "$actual_digest" != "$expected_digest" ]]; then
    printf '::error title=%s digest mismatch::Pinned digest %s; v%s asset resolves to %s.\n' \
      "$name" "$expected_digest" "$version" "$actual_digest"
    return 1
  fi

  printf '✓ %s v%s installer digest matches the pinned SHA-256.\n' "$name" "$version"
}

check_npm_mature_release() {
  local name="$1"
  local package_name="$2"
  local current="$3"
  local expected

  expected="$(npm view "$package_name" time --json | jq -er \
    --argjson cutoff "$cutoff_epoch" '
      to_entries
      | map(select(.key | test("^[0-9]+\\.[0-9]+\\.[0-9]+$")))
      | map(. + {epoch: (.value | sub("\\.[0-9]+Z$"; "Z") | fromdateiso8601)})
      | map(select(.epoch <= $cutoff))
      | sort_by(.epoch)
      | last.key
    ')"
  if [[ "$current" != "$expected" ]]; then
    printf '::error title=%s update available::Pinned %s; latest npm release older than %sh is %s.\n' \
      "$name" "$current" "$cooling_hours" "$expected"
    return 1
  fi

  printf '✓ %s %s is current after the %sh cooling window.\n' \
    "$name" "$current" "$cooling_hours"
}

check_npm_lock() {
  local name="$1"
  local package_name="$2"
  local manifest="$3"
  local lockfile="$4"
  local declared root_declared locked_version missing_integrity

  declared="$(jq -er --arg package "$package_name" \
    '.dependencies[$package] | select(test("^[0-9]+\\.[0-9]+\\.[0-9]+$"))' "$manifest")"
  root_declared="$(jq -er --arg package "$package_name" \
    '.packages[""].dependencies[$package]' "$lockfile")"
  locked_version="$(jq -er --arg path "node_modules/$package_name" \
    '.packages[$path].version' "$lockfile")"
  missing_integrity="$(jq -r '
    [.packages | to_entries[]
      | select(.key != "" and .value.link != true)
      | select((.value.integrity // "") | test("^sha512-") | not)]
    | length
  ' "$lockfile")"

  if [[ "$declared" != "$root_declared" || "$declared" != "$locked_version" ||
        "$missing_integrity" != 0 ]]; then
    printf '::error title=%s lock invalid::Manifest=%s root-lock=%s installed=%s missing-integrity=%s.\n' \
      "$name" "$declared" "$root_declared" "$locked_version" "$missing_integrity"
    return 1
  fi

  printf '✓ %s %s has a complete integrity-locked npm closure.\n' "$name" "$declared"
}

check_osv_image_digest() {
  local version="$1"
  local image token expected_digest actual_digest

  image="$(sed -nE 's/.*OSV_SCANNER_IMAGE: "([^"]+)".*/\1/p' .github/workflows/security.yaml)"
  expected_digest="${image##*@}"
  if [[ -z "$image" || "$expected_digest" == "$image" ]]; then
    printf '::error title=osv-scanner digest missing::OSV_SCANNER_IMAGE must use an immutable digest.\n'
    return 1
  fi

  token="$(curl --fail --silent --show-error \
    "https://ghcr.io/token?scope=repository:google/osv-scanner-action:pull" | jq -er '.token')"
  actual_digest="$(curl --fail --silent --show-error --dump-header - --output /dev/null \
    --header "Authorization: Bearer $token" \
    --header 'Accept: application/vnd.docker.distribution.manifest.v2+json' \
    "https://ghcr.io/v2/google/osv-scanner-action/manifests/v$version" \
    | awk 'tolower($1) == "docker-content-digest:" { gsub("\\r", "", $2); print $2 }')"

  if [[ -z "$actual_digest" || "$expected_digest" != "$actual_digest" ]]; then
    printf '::error title=osv-scanner digest mismatch::Pinned digest %s; v%s resolves to %s.\n' \
      "$expected_digest" "$version" "${actual_digest:-unknown}"
    return 1
  fi

  printf '✓ osv-scanner v%s runtime digest matches GHCR.\n' "$version"
}

nose_version="$(sed -nE 's/^nose_version="([^"]+)"/\1/p' scripts/ci/install-nose.sh)"
nose_installer_sha256="$(sed -nE 's/^nose_installer_sha256="([0-9a-fA-F]{64})"/\1/p' scripts/ci/install-nose.sh)"
osv_version="$(sed -nE 's/.*osv-scanner-action image v([^ ]+).*/\1/p' .github/workflows/security.yaml)"
semgrep_version="$(sed -nE 's/.*semgrep\/semgrep:([^ @]+).*/\1/p' .github/workflows/security.yaml | head -n 1)"
codex_security_package=.github/codex-security/package.json
codex_security_lock=.github/codex-security/package-lock.json
codex_security_version="$(jq -er '.dependencies["@openai/codex-security"]' "$codex_security_package")"

status=0
check_release nose "$nose_version" corca-ai/nose || status=1
check_release_asset_digest nose-installer corca-ai/nose \
  "$nose_version" nose-cli-installer.sh "$nose_installer_sha256" || status=1
check_release osv-scanner "$osv_version" google/osv-scanner || status=1
check_osv_image_digest "$osv_version" || status=1
check_release semgrep "$semgrep_version" semgrep/semgrep || status=1
check_npm_lock codex-security @openai/codex-security \
  "$codex_security_package" "$codex_security_lock" || status=1
check_npm_mature_release codex-security @openai/codex-security "$codex_security_version" || status=1
exit "$status"
