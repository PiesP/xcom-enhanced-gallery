# Privacy

X.com Enhanced Gallery is distributed as a userscript and as Chrome and Firefox
extension builds. It does not use a developer-operated backend, analytics, or
telemetry service.

## Data handled in the browser

The application reads the X.com page and related X/Twitter responses needed to
identify media, display post context, and create download filenames. Images and
videos are processed for display or download in the browser and are not sent to
a server operated by this project.

## Storage

- Extension builds store settings in the browser extension's local storage.
- The userscript stores settings through the installed userscript manager's
  `GM_*` storage APIs.
- Storage contains preferences such as theme, language, gallery behavior, and
  playback settings; it is not used for analytics.

Removing the userscript or extension may not remove its settings automatically.
Use the userscript manager or browser extension storage controls when a complete
reset is required.

## Network access

Runtime requests are limited to X/Twitter pages, APIs, and media hosts needed
for gallery extraction and downloads, including `x.com`, `twitter.com`,
`api.twitter.com`, `pbs.twimg.com`, and `video.twimg.com` according to the
selected distribution's metadata or manifest.

The userscript manager may separately check GitHub Releases or jsDelivr URLs
embedded in the userscript header for updates. Browser vendors and installed
extensions have their own privacy policies.

## Downloads

Single media downloads and generated ZIP archives are created locally and sent
to the browser's download system. The chosen download directory and browser
history are controlled by the browser or userscript manager.

## Security reports

Do not include private account, post, or authentication data in a public issue.
Report suspected vulnerabilities through the [security policy](./.github/SECURITY.md).
