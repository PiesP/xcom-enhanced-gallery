# XCOM Codex Security scan instructions

Review only findings supported by a reachable source-to-sink path in this
repository. For every reported finding, identify attacker control, validation or
normalization steps, the effective sink and privilege, required user action,
browser/distribution differences, and concrete security impact. Cite exact files
and lines and explain why existing controls do not break the path.

Prioritize:

- X.com DOM, GraphQL, post metadata, and media data flowing into DOM, style, URL,
  filename, archive, notification, logging, or download sinks;
- parsed-host and path allowlists, redirects, credentialed fetches, X API/CSRF
  handling, userscript cross-origin requests, and media download fallbacks;
- the MV3 content-script/background message protocol and privileged download,
  notification, and storage APIs;
- traversal or content confusion in filenames and ZIP entries;
- bounded parsing, caching, download concurrency, media sizes, ZIP assembly,
  cancellation, timeout, and lifecycle cleanup;
- manifest/userscript permissions, build-time environment substitution,
  release automation, update metadata, and the pinned `packages/core` consumer
  boundary.

Do not report:

- backend-only vulnerability classes where no backend authority or sink exists;
- the documented public X web-client guest bearer token as a secret without a
  separate private credential or concrete escalation path;
- dependency advisories based only on a package name or lockfile entry; OSV and
  Dependabot own dependency discovery, while this scan may report a demonstrated
  reachable source-level consequence;
- unsupported hypotheses, best-practice suggestions, regex sightings, dangerous
  API names, or product reliability defects without a security boundary impact;
- findings located only inside `packages/core` without proving reachability and
  impact through the pinned XCOM consumer API.

Record incomplete evidence as deferred coverage rather than a vulnerability.
Explicitly list work requiring a real browser or extension context, live X.com
session, CDN redirect/CORS behavior, browser-store packaging review, or
userscript-manager behavior. Static analysis must not claim those surfaces were
dynamically verified.
