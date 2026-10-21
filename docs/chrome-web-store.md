# Chrome Web Store submission reference

Use this reference for the Chrome extension. [PRIVACY.md](../PRIVACY.md) is the
canonical public privacy policy; this document supplies submission fields and
their evidence, not a second policy. Preparing these fields does not submit or
publish the extension.

## Checked baseline

Reviewed on 2026-10-21 against default-branch source
[`31686e58439f9465743be0fd3c1de7eba90044cf`](https://github.com/PiesP/xcom-enhanced-gallery/commit/31686e58439f9465743be0fd3c1de7eba90044cf)
and the public [v2.3.8 Chrome ZIP](https://github.com/PiesP/xcom-enhanced-gallery/releases/download/v2.3.8/xcom-enhanced-gallery-chrome.zip):
229,255 bytes, SHA-256
`846be500bc2b2a8f99ed674304f3df60370777a5c07790af1a96b0e94da13356`.
Release `metadata.json` identifies build source
`8a410efb02837933f8e4798ddcc2501b502c4005`, also the `v2.3.8` tag target.
The packaged manifest matches [the source manifest](../extension/manifest.json).
This review inspected source and package bytes; it did not perform a new
installed-browser test or inspect a signed-in store dashboard.

Before submitting a different ZIP, recheck its identity and these declarations
whenever permissions, storage, network behavior or functionality change. GitHub
release publication, store submission, approval and public availability are
separate steps. Verify an actual public listing before adding a store URL or
store-install/update instructions to the READMEs. Settings migration from an
unpacked copy to a store-installed copy is not established; do not promise it.

## Paste-ready fields

Copy only the text inside the blocks. Supporting rationale follows separately.
The official dashboard examples show a 1,000-character limit for
[single purpose](https://developer.chrome.com/static/docs/webstore/cws-dashboard-privacy/image/screenshot-the-single-p-9f95a66fd43d9.png)
and [each permission justification](https://developer.chrome.com/static/docs/webstore/cws-dashboard-privacy/image/screenshot-the-permissio-09572eee8a7c6.png),
and 16,000 for the [detailed listing description](https://developer.chrome.com/static/docs/webstore/cws-dashboard-listing/image/detailed-description-the-f8b5c9fda04b9.png).
These are published examples, not a live account check; confirm the dashboard's
counters when pasting. All blocks below fit those bounds. The manifest summary
has a separate [132-character limit](https://developer.chrome.com/docs/extensions/reference/manifest#description).

### Detailed store description

```text
Browse images and videos from X/Twitter posts in a focused desktop gallery and save supported media to your computer.

Open the gallery from an image or video on X/Twitter. Navigate with the keyboard, pointer or wheel; choose image-fit modes; and save theme, language, gallery and playback preferences. There is no toolbar popup.

Save a single item or create a ZIP of the media currently shown in the gallery. A partial recovery contains only the accessible items found, not necessarily every attachment of the post. Photo saves use a verified CDN original-size source when available; this does not promise the uploader's exact original file. If that source cannot be verified, saving fails rather than substituting a thumbnail. Video saves require a supported MP4 source; an HLS-only attachment is not converted. Recovered video sources may have limited quality.

The extension processes post text, author names/handles, post and media URLs, and X session authentication information for gallery display, metadata requests and downloads. It stores local preferences and download recovery records. It has no developer-operated backend, analytics or telemetry. Functional requests go to X/Twitter and its media providers. See the linked privacy policy for storage, retention and transport details.

Use an X account signed in through the normal X website when access requires it. The extension does not bypass access restrictions. Browser-native single-file saves and locally assembled ZIPs use different download routes. Browser download and notification settings still apply.
```

### Single purpose

```text
Display media from the current X/Twitter post in a desktop gallery and let the user save supported items individually or as a ZIP of the current gallery, with local viewing preferences and download recovery.
```

### Permission: downloads

```text
Save user-selected X/Twitter media and locally generated ZIP archives through the browser download manager. Observe download IDs and complete/interrupted states to report results, handle cancellation and recover an existing request after a background-worker restart without starting a duplicate save.
```

### Permission: storage

```text
Keep theme, language, gallery and playback preferences in local extension storage. Also keep download recovery records: request/download IDs, cancellation state and, for direct saves, originating tab ID, media-URL hash, timestamps and terminal state. These records reconcile downloads after background-worker restarts; they are not analytics or sync storage.
```

### Permission: notifications

```text
Show actionable gallery or download errors, partial-media recovery and partial-ZIP warnings, and help such as how to retry after a resource limit. Notifications explain problems or limitations encountered during the user's gallery/save operation. Routine successful downloads do not generate an extension completion notification.
```

### Host permissions

If the dashboard offers one combined host-justification field, paste all four
lines together; the combined text is also below 1,000 characters.

```text
https://x.com/*: Run the gallery content script on X pages and request X post metadata, using the page's session/CSRF context where required to resolve the post's media and author information.
https://twitter.com/*: Support Twitter-hosted pages and their post metadata route for the same gallery behavior and session-aware media extraction.
https://pbs.twimg.com/*: Display and retrieve X/Twitter images, including verified CDN original-size photo sources, for user-requested single saves and local ZIP creation.
https://video.twimg.com/*: Play and retrieve supported X/Twitter video/GIF media sources for gallery viewing and user-requested saves; this does not provide HLS conversion.
```

### Remote code

Select **No, I am not using remote code** for the checked package. If an
explanation is requested:

```text
All executable extension code is bundled in the submitted package, including content.js, background.js and local ZIP assembly code. The extension retrieves X/Twitter JSON metadata and image/video data, not remote JavaScript or WebAssembly to execute. It does not download executable updates outside the browser's extension update mechanism.
```

The checked ZIP's executable files are `content.js` and `background.js`; its
manifest loads those local files and declares `script-src 'self'`. Source and
bundle inspection also cover ZIP assembly. Remote media
and parsed JSON are data under the
[remote-code definition](https://developer.chrome.com/docs/extensions/develop/migrate/remote-hosted-code).
The userscript manager's separate update mechanism is not part of this Chrome
extension declaration.

## Data-use declarations and rationale

The [User Data FAQ](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq)
requires disclosure even for local processing and includes usernames, cookies,
website resources and URLs. The official
[dashboard category examples](https://developer.chrome.com/static/docs/webstore/cws-dashboard-privacy/image/screenshot-data-certifi-1955439870c37.png)
include social media posts under Personal communications. Categories can
overlap. The recommendations below are a product-specific interpretation of
those definitions, not a Google decision or an approval guarantee.

| Dashboard category | Confirmed handling | Recommended declaration and rationale |
| --- | --- | --- |
| Authentication information | Reads `ct0` and may resolve page authorization data for X API requests; keeps request/context values in memory, not application persistent stores. | Select. Authentication cookies are within the FAQ's examples. Describe the purpose, never publish actual cookie/token values or credentials. |
| Personally identifiable information | Reads author display names/handles and post identifiers for context and filenames. These may belong to other post authors. | Select. The FAQ includes names and usernames; public author identity remains identifying information. This does not claim that the extension asks for the user's identity profile. |
| Personal communications | Reads post text from the X page/API for post context and media extraction. | Select. The dashboard explicitly includes social media posts; lack of direct-message access does not exclude posts from this category. |
| Website content | Processes post text, links, images, video and metadata. | Select. These match the dashboard's text/media/hyperlink examples and support the gallery and saves. |
| Web history | Uses the current page address as post/request context and media URLs as display/save inputs. Download recovery can persist URL hashes and timestamps. It does not read the browser history API or maintain a visited-page history. | Conservatively select to disclose URL handling, which the FAQ treats as browsing activity. The dashboard example describes a visited-page list more narrowly; explain the current-page/download scope to reviewers rather than claiming historical browsing collection. Confirm this mapping against the actual dashboard/reviewer guidance. |
| User activity | Handles clicks, keys and scrolling to operate the UI; download IDs/state are used for recovery. No behavioral clickstream, keystroke log or analytics collection was found. | Leave unchecked for these functional controls alone. The dashboard examples concern monitoring/logging activity. Reassess if events are recorded or analyzed as behavior; this boundary is an interpretation, not an explicit exemption for all local events. |
| Health information; Financial and payment information; Location | No dedicated collection or extraction of these data types by the checked gallery functionality. Provider requests necessarily expose network information such as IP address to the provider, without an extension geolocation feature. | Leave unchecked for the checked functionality. Posts can incidentally contain sensitive content already disclosed as post/website content; recheck if a feature starts extracting these categories or collecting location. |

Do not equate “no developer analytics/backend” with “no user data handled.”
The data-use certifications should reflect the actual
[Limited Use statement](../PRIVACY.md#limited-use): no sale, no unrelated-purpose
use/transfer, and no creditworthiness/lending use. The
[Limited Use policy](https://developer.chrome.com/docs/webstore/program-policies/limited-use)
restricts purpose, transfers and human access, and requires an affirmative
statement. This extension does not use Google APIs; do not paste a template
claiming that it receives data from them. Review disclosures with the current
[privacy requirements](https://developer.chrome.com/docs/webstore/program-policies/privacy)
and [privacy-fields instructions](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy).

## Public links and reviewer instructions

- Privacy policy: [public PRIVACY.md](https://github.com/PiesP/xcom-enhanced-gallery/blob/master/PRIVACY.md)
- Homepage: [project README](https://github.com/PiesP/xcom-enhanced-gallery#readme)
- Support: [GitHub Issues](https://github.com/PiesP/xcom-enhanced-gallery/issues)

Provide real screenshots of the submitted build under the
[listing requirements](https://developer.chrome.com/docs/webstore/cws-dashboard-listing)
and [image specifications](https://developer.chrome.com/docs/webstore/images):
at least one, up to five, at 1280x800 or 640x400, showing the actual product.
Show a gallery opened from an X post, fit/navigation controls, settings, and
single/ZIP save controls as useful. Use content you can publish and remove
private account/post information; do not fabricate product screenshots. Supply
the required icon and small promotional tile separately. Existing GitHub
release availability is not evidence that store screenshots or submission are
complete.

Paste-ready reviewer notes:

```text
This extension has no toolbar popup. Open X/Twitter in desktop Chrome and sign in through X normally if the selected post requires access. Use a post you are authorized to view that contains ordinary images or a supported MP4 video; no account credentials are included in this submission text.

Click the post's image to open the gallery. Use arrow navigation and image-fit controls, then open settings and change a viewing preference. Save the current image and use the ZIP control to save the items currently shown. For video, use the saved click mode that opens the gallery and test a supported MP4 source. HLS-only sources are not converted. Check downloaded files with Chrome's download manager. Partial recovery/ZIP and error/help notifications appear only when their triggering condition occurs, subject to browser/OS notification settings.
```

If a reviewer needs a reproducible post, supply a currently accessible,
non-sensitive post link in the dashboard's private notes and verify it with the
submitted build. Never put passwords, session cookies or tokens in this public
document. A live X access limitation should be reported as such.

## Implementation evidence

- Authentication and post requests: [`twitter-auth.ts`](../src/shared/services/media/twitter-auth/twitter-auth.ts), `resolveRequestContext` / `TweetMetadataReuse` in [`twitter-api-client.ts`](../src/shared/services/media/twitter-api-client.ts).
- Author/text/media extraction and filenames: [`twitter-response-parser.ts`](../src/shared/services/media/twitter-parser/twitter-response-parser.ts), [`filename-utils.ts`](../src/shared/core/filename/filename-utils.ts).
- Preferences/fallback: [`persistent-storage.ts`](../src/shared/services/persistent-storage.ts); extension recovery/notification dispatch: [`download-tracking.ts`](../src/extension/download-tracking.ts), [`background.ts`](../src/extension/background.ts).
- Notification triggers: [`use-gallery-download.ts`](../src/features/gallery/hooks/use-gallery-download.ts), [`gallery-app.ts`](../src/features/gallery/gallery-app.ts).
- Save quality, transport and ZIP contracts: [media sources](./media-sources.md), [download ownership](./download-memory.md), [redirect handling](./network-redirects.md), [`zip-download.ts`](../src/shared/services/download/zip-download.ts).
