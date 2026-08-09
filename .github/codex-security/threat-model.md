# X.com Enhanced Gallery threat model

## Scope and assets

X.com Enhanced Gallery is browser-only software distributed as a userscript and
as Chrome and Firefox MV3 extensions. It reads X.com DOM and API data, displays
media, and downloads individual files or locally generated ZIP archives. There
is no project-operated backend, account system, or application session.

Protect the integrity of the X.com page and authenticated X session, private post
and media data handled in the browser, local preferences, browser/tab
availability, download integrity, extension/userscript privileges, and release
artifacts.

## Trust boundaries and attacker input

- Treat X.com DOM, GraphQL responses, post and author metadata, media URLs,
  filenames, MIME types, and page location as untrusted structured data.
- The userscript can use userscript-manager storage, notification, download, and
  cross-origin request APIs. The MV3 content script instead delegates only
  allowlisted download and notification messages to a background worker with
  `downloads`, `storage`, and `notifications` permissions. Analyze these
  privilege models separately.
- MV3 messages cross from X.com content-script state to the privileged background
  worker. Message type, URL, blob origin, filename, headers, size, and
  cancellation identifiers must remain strictly validated.
- Media requests and downloads must remain limited to intended HTTPS X/Twitter
  page, API, and `pbs.twimg.com` or `video.twimg.com` media resources. Redirects,
  credentialed fetches, blob URLs, generated filenames, and ZIP entries are part
  of this boundary.
- The X API client derives same-service GraphQL endpoints and forwards page CSRF
  and authorization context. No attacker-controlled value may redirect those
  credentials or authenticated responses to another origin.
- The fallback guest bearer token in
  `src/shared/core/twitter-api/endpoint.ts` is public X web-client material, not
  a repository secret by itself. Report it only if code exposes a private token,
  expands its authority, or creates a concrete exfiltration path.
- Settings contain preferences, not credentials. Reassess storage and bridge
  severity before adding tokens, secrets, or broader privileged operations.
- `packages/core` is a pinned Git submodule and a separate repository trust
  boundary. Review how this repository calls it, but do not attribute an
  implementation-only core finding to XCOM without a reachable consumer path.

## Security invariants

- Untrusted content remains data; it must not reach executable HTML, script,
  SVG, unsafe CSS, string timers, or dynamic-code sinks.
- URL and host policy uses parsed origins and exact host/path rules. Privileged or
  credentialed requests must not be attacker-directed.
- Download filenames and ZIP entries cannot create traversal, overwrite, header
  injection, or content-confusion behavior.
- Background commands and extension permissions remain minimal and explicitly
  allowlisted. Page content must not gain a general fetch, storage, or extension
  API proxy.
- DOM/API traversal, response parsing, media caches, concurrent downloads, ZIP
  assembly, retries, timeouts, and cancellation remain bounded. A remote post or
  media payload must not reliably exhaust memory, CPU, disk, or the browser tab.
- ChatGPT/Codex scan artifacts are development outputs and must not disclose
  private X.com content beyond access-controlled, short-retention storage.
- Published userscript and extension artifacts must correspond to reviewed source
  and trusted build/release automation.

## Severity and exclusions

Prioritize remote code execution, X session or private-media disclosure,
privileged arbitrary downloads/requests, extension privilege escalation,
reliable remote tab failure, and release compromise. Same-origin visual spoofing
or modification of non-sensitive preferences is normally lower impact unless it
crosses another boundary.

Backend-only CSRF, SQL injection, server-side SSRF, RBAC bypass, and session
fixation are out of scope because this repository operates no backend authority.
Browser, X.com, CDN, store, and userscript-manager vulnerabilities are out of
scope unless this integration creates a reachable security impact.
