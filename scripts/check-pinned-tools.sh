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

nose_version="$(sed -nE 's/^nose_version="([^"]+)"/\1/p' scripts/install-nose.sh)"
osv_version="$(sed -nE 's/.*osv-scanner-action image v([^ ]+).*/\1/p' .github/workflows/security.yaml)"
semgrep_version="$(sed -nE 's/.*semgrep\/semgrep:([^ @]+).*/\1/p' .github/workflows/security.yaml | head -n 1)"

status=0
check_release nose "$nose_version" corca-ai/nose || status=1
check_release osv-scanner "$osv_version" google/osv-scanner || status=1
check_release semgrep "$semgrep_version" semgrep/semgrep || status=1
exit "$status"
