# Windows stable-browser gallery validation

This optional validation has four separate evidence tiers. None substitutes
for another, and none is a required CI lane.

1. **Artifact-only smoke:** injects the production userscript into a
   deterministic fixture and checks Windows browser rendering and mocked
   download behavior.
2. **Installed Chrome/Edge profile:** loads the production unpacked extension
   in a fresh task-owned browser profile and checks the real privileged download
   and extension lifecycle paths against a deterministic fixture. Its gallery
   experience case also checks native keyboard activation and a return from
   manually scrolled focus to the last requested item. A declared
   public-release input first exercises a same-profile unpacked update.
3. **Installed Chrome Tampermonkey profile:** installs the exact production
   `.user.js` through the reviewed manager UI in a fresh owned profile. A declared
   public-release input first exercises the manager's update confirmation. It checks
   repeated native singles and ZIPs, a partial ZIP, routed transport failure,
   cancellation before dispatch, gallery close/reopen, and reload recovery with
   independently read saved files. It configures Browser API mode in the
   task-owned Tampermonkey options UI, checks the existing JPG/ZIP whitelist,
   and confirms the manager's own permission page when shown. That UI may
   request Tampermonkey's optional downloads permission. On Chrome, a bounded
   Windows UI Automation step may invoke the ordinary **Allow** button only
   for the fully recognized downloads-only prompt in that fresh owned profile.
   It rechecks the browser process, session and foreground window before acting;
   unrecognized, incomplete or changed prompts are skipped. Edge prompts are
   not automated. An independent manager permission probe records whether the
   permission was actually granted or remains pending. Native completion and
   saved bytes require separate evidence.
   The fresh manager profile sets General > LogLevel to Info (60) through its
   options UI, and the manager-console receipt keeps only bounded known branch counts.
   That setting is removed with the owned profile after browser closure; failed
   cleanup preserves the profile and receipt for review.
   The production byte budget is unchanged.
4. **Optional public-page observation:** observes up to three unchanged public
   X/Twitter status URLs after the installed deterministic fixture. It remains
   observational and can finish as `unverified`. A separate ignored
   `inputs/live-acceptance.json` selector opts the installed extension into
   actual-site image navigation, downloads, settings, and status-navigation checks.

The native regression suite under `validation/windows/` runs with
`vp run test:e2e:native` after the project dependencies and Playwright Chromium
are installed. This command selects the Vite+ Windows native Node project,
including Chromium
tests, and is included in `test:e2e:all`, CI E2E, and `verify:full`. It checks
fixture and cleanup contracts; the installed Windows tiers below still require
their separate prepared-VM evidence.

## Retained acceptance evidence

The historical migration review is recorded in
[#327](https://github.com/PiesP/xcom-enhanced-gallery/issues/327). Its private
evidence reference is
`piesp-windows-acceptance/20261017-migration-review/xcom-enhanced-gallery-327`.
PiesP is the custodian; authorized reviewers obtain the index through the
maintainer's configured local Windows-controller workspace and owner-account
storage. Original and failed receipts remain private and are retained until
the maintainer explicitly authorizes cleanup, without automatic expiry.

The index binds source/core and controller/profile identities, artifact sizes
and newly recomputed SHA-256 digests to the original attempts. An additive
review records the inspected results, screenshots, comparison method and limits.
Check scenario completion, collection, guest cleanup and host desktop teardown
separately. An outer wrapper failure does not establish a product failure or
prove cleanup; preserve an unknown termination cause and its required next
observation rather than relabeling it as expected.

[#332](https://github.com/PiesP/xcom-enhanced-gallery/issues/332) has four
separate installed-extension and installed-userscript attempts, including the
final attempts. A dated addendum in the existing private index records their
identities, hashes and selected visual review, together with the three #335
attempts. Authorized reviewers obtain it through the PiesP custodian route above
using reference
`piesp-windows-acceptance/20261017-migration-review/xcom-enhanced-gallery-327/addenda/20261018-332-335`.
Its SHA-256 is
`41e1a82155cde4e867f346dee500bba1f35487d3c13dd963e6a5f3c833015d92`,
and its verified predecessor index remains unchanged at
`2c934d554d3611af1a8c01e83e0928ca4b36655ec1e148eaaf67a43aed3a5d99`.
The final extension and userscript
bundle manifests have SHA-256 digests
`56a9f0ed538b6628971c584d0d35799ff6b2c40a0accd06c5512ae2f8cbf13dd`
and `f60d09cb4edf3572b79e2c1a1253bce8b74fff532028e9a5e4d2064967afefce`.
The final attempts tested candidate `6940d537821642e97a4d87744e96bf8e2e740785`
and core `77d30da018089be7e2a5e3b2197a200890547aee`; the candidate and
landed `ff6496104b45def12bba5f604cba1add07155f01` have the same source
tree `6939f37cb9fbfe018b7f7d3225f75cbdd0c46450`. Earlier attempts retain their
individual source attribution in the additive reconciliation. Original visual review
fields remain pending; additive review covers selected screenshots only. The
restoration consolidation in [#335](https://github.com/PiesP/xcom-enhanced-gallery/issues/335)
has separate installed Edge acceptance at runtime candidate
`f7b23dc6e2bddeae7e7d61191d2fca395b79cf61`, with bundle SHA-256
`38943ef59677939d967f297ddb62c125ed6b8e1a2c8435e13aae1ac58a94be6d`.
The subsequent README-only candidate `8bc244de4afa924743420e46d4cfeec5cbfec062`
and landed `7d253da05590ff7fef046e5e7a51f50c85713802` share a source tree;
the runtime receipt retains its original tested-source attribution. The addendum
keeps scenario, collection, guest cleanup and host teardown separate, including
the earlier failed attempt and its unchanged raw transport fields.

## Artifact-only smoke

From a clean checkout, initialize the recorded submodule, install with
`vp install --frozen-lockfile -- --no-runtime`, then run `vp run verify`. Package the assets listed
in `profile.json` together with this profile. A controller with portable Node
matching the repository's `.node-version` pin and Playwright must call
`run({ browser, root, output })`, where `browser` is an installed Chrome/Edge
Playwright Browser, `root` contains the declared assets, and `output` is a new
external evidence directory. Use the configured controller in the prepared
Windows validation environment.

The production userscript is injected into the existing X fixture with the test
GM host. Visible portrait/panorama PNGs are generated by Canvas, and unrelated
network traffic is blocked. The profile opens the gallery, advances by keyboard,
checks the selected fit control's computed styles across hover, keyboard focus,
disabled, and forced-colors states, captures browser-content screenshots,
downloads through an explicitly mocked GM bridge, verifies the actual downloaded
bytes, and closes with Escape. A failed assertion throws; screenshot review is a
separate decision.

This artifact-only result records browser zoom as `not-run`: the injected
userscript has no installed extension worker with access to the browser tab's
actual zoom setting. CSS zoom or pinch emulation is not used as a substitute.

This does not test userscript-manager installation, unpacked extension installation,
privileged extension downloads, live authenticated X.com, Windows native Save As,
Explorer, OS compositor, actual DPI changes, or physical GPU performance. A headless
run is functional diagnostics only, not desktop visual acceptance.

Run `node --experimental-strip-types --check validation/windows/profile.ts` for the profile syntax check.

## Installed Chrome/Edge extension flow

The opt-in installed flow uses a fresh task-owned browser profile, enables
extension developer mode, and loads the production unpacked MV3 distribution
through CDP `Extensions.loadUnpacked`. It serves the existing deterministic X
fixture and three distinct image payloads. A task-owned HTTPS listener binds
ephemeral `127.0.0.1` and serves only synthetic original JPEG and MP4 paths,
plus the declared recovery-intent fixture documents. The fresh browser profile
maps `pbs.twimg.com:443`, `video.twimg.com:443` and `x.com:443` to that listener
and accepts its one-run SPKI certificate for those three names.
The key is ephemeral; no OS trust or hosts setting changes. Each ordinary
single requires one completed browser download ID, selected initial and final
URL, matching listener transfer, exact filename and saved bytes, and no
whole-file page fetch. ZIPs use the bounded provider and Blob handoff. No
application script, download mock, GM bridge, or live-site response is injected.

The flow repeats open, keyboard navigation, privileged `chrome.downloads`
completion, and close three times. It proves the selected item's exact filename
and bytes, checks both Escape and the close button, and verifies focus, scroll,
body styles, late-added background isolation, and gallery teardown. The first
cycle deliberately moves the focused trigger while the gallery is open. This
keeps the scroll-versus-focus restoration order observable instead of hiding a
host layout-shift regression. Page screenshots, per-cycle timings, file hashes,
and cleanup metadata are retained as evidence; the timings are observations,
not a performance claim.

The first native single holds its response after a prefix of at most 1 KiB for
at least 3.5 seconds, records native start separately from full completion, and requires
the same download ID and busy controls throughout. Releasing that bounded
response must yield the exact original file. This distinguishes a confirmed
active transfer from an uncertain worker reply without a throughput claim.

The extension-only classic route serves smaller display JPEGs, including one
extensionless query-format photo URL, and separate original JPEGs. Each DOM
recovery cycle asserts the observed display URL and natural dimensions, then
checks that the native current save contains the original bytes. A separate
healthy production-shaped API photo response starts from the same small sources,
opens the second of three owned images, preserves original-quality API display,
and verifies its source link, current filename and exact original bytes. Its ZIP
must contain all three original entries with expected filenames, order, contents
and CRC. Screenshots, source URLs, request observations, timings and hashes remain
in normal and partial failure receipts. Shared HTML and userscript routes retain
their existing allowlisted paths. This is fixture evidence, not live-CDN proof.

`installed-compact-quote-photo-page.html` preserves the observed nested B article,
inner C quote region, avatar/header branches and small photo with a same-C status
link over it. Its IDs, captions and media bytes are synthetic. A normal hit-tested
click requests C, selects its second API photo and checks its caption and origin.
Another controlled branch gives B and C the same photo source: B must remain the
second item with B's caption and origin. Native single downloads and both ZIPs
are read independently for exact bytes, owner filenames and entry order. A fresh
document forces C's API request to return 403 and checks recovery of only the
visible C photo without B's caption. Synthetic text, a post link and padding
beside the photo must navigate natively without requesting media. The cycle
also checks keyboard activation of the media link, native B/C header navigation,
gallery navigation, close/reopen and host-state restoration. Its
bounded requests and partial failure observations remain separate from live X.

The same installed profile invokes `media-api-reuse-profile.ts` to compare
physical API requests across successive clicks, navigation, reload and a fresh
page. It checks independent selected-photo identity, uncached provider failures,
and the exact controlled 403/429/unreadable-503 retry guidance. Owned pages have
bounded script and console observations, and the helper retains its JSON receipt
and a screenshot on failure. `video-loading-profile.ts` opens eight synthetic
videos with a high image-preload setting, checks geometry-based admission and
far entries without attached sources, and verifies metadata, first frame,
playback progress and same-attachment decode recovery. The separate HTTPS
loopback verifies that a current save still uses the preferred MP4 bytes. A
native eight-video ZIP is independently read for entry order, names, bytes and
CRC after playback fallback; its first entry must retain the preferred source.
The helper records active-source, metadata, first-frame and completion timings
as fixture observations, including the deliberately gated response boundary.
The API helper also rejects a controlled response above 2 MiB without caching it
and checks that a 302 response is not followed by the installed MV3 Fetch path.
After the production gallery cases, a separate direct `chrome.downloads` diagnostic
records whether the native browser downloader follows one declared JPEG-to-JPEG
302 and whether the saved bytes and final URL match the destination. It does not
exercise the production message sender boundary; the gallery download cycles
above retain that coverage.
The API helper also runs three response-contract failures before a fourth action
in the same document: foreign owner responses, two server failures followed by a
foreign owner, and missing result envelopes. It independently counts physical
requests and requires the fourth action to remain suppressed before the normal
circuit cooldown. Legitimate unavailable responses and a valid-owner click
mismatch provide healthy controls whose fourth request must still run.

The video helper checks unselected, unfocused videos just above and below the
actual gallery scrollport, farther source-free items, height changes, and
close/reopen root replacement. It records real element rectangles and requests;
admission ahead of view must leave playback paused. Its recovery-intent cases
hold later samples of the declared MP4 after valid initial frames, start playback
through a normal control, then release a deliberately corrupt tail. A trusted
native code-3 error must precede the held same-item replacement request. Real
wheel scrolling tests metadata arrival outside view and reentry before metadata;
supported keyboard controls test a later pause, mute and volume change. Paused
observations require settled seeking and no playback progress. The recovery
document and its held media use real HTTPS responses from the same loopback
listener, so the browser can classify the document's network address space.
No permission is overridden; TLS, CORS and OS protections stay enabled. These
cases do not validate public-to-loopback permission behavior.
The selected-fault request budget covers two opens of eight best sources and
one selected lower-source recovery. Each open rejects duplicate source requests;
the healthy reopen cannot request a lower rendition. Unexpected URLs and console
errors still fail the run.

The native range overlap case uses two distinct videos from one owned post.
It gates A's first prefix on the actual server arrival of the declared B GET,
holding B's body until A arrives if B is first. It then holds A's late bytes while
adjacent B must be naturally admitted and complete its own 206. A must then resume ordinary Play and a
settled native seek with decoded progress. Exact A-abort/B-completion server
and CDP intervals must intersect; this proves cross-attachment overlap only.
Earlier single-player open-ended and finite held-range attempts produced a
sequential replacement or a seek waiting on the same pending read. Their failed
receipts remain separate and do not establish same-player overlap. The distinct
stalled-transfer case holds samples from the 3.5-second packet until controlled
disconnect.

The streaming asset is `test/e2e/fixtures/installed-recovery-intent.mp4`: a
four-second, 24 fps, 320×180 H.264 test pattern below the 256 KiB fixture cap.
It keeps metadata at the front and enough complete initial samples for native
startup while the final second is held. Its source hash and late VCL length
offsets are checked by `delayedDecodeFailure()`; update both when replacing the
asset. The bounded fixture can be regenerated with:

```bash
ffmpeg -f lavfi -i 'testsrc2=size=320x180:rate=24:duration=4' -frames:v 96 -an \
  -c:v libx264 -preset medium -profile:v baseline -level:v 3.0 -pix_fmt yuv420p \
  -b:v 384k -minrate 384k -maxrate 384k -bufsize 384k \
  -x264-params 'nal-hrd=cbr:force-cfr=1:scenecut=0:keyint=24:min-keyint=24:bframes=0' \
  -movflags +faststart -map_metadata -1 -metadata creation_time=1970-01-01T00:00:00Z \
  -f mp4 test/e2e/fixtures/installed-recovery-intent.mp4
```

OWN-12 uses `test/e2e/fixtures/installed-native-controls-av.mp4` only for the
rapid B host video's exact `quote-two.mp4` transport path while its native
controls run. The ordinary quote-two fixture and gallery download bytes stay
unchanged; the route is restored in `finally`, and the OWN-12 receipt records
both hashes and restoration. The A/V asset copies the original four-second
H.264 stream and adds a four-second silent mono AAC stream so the installed
browser exposes its native volume control. Its SHA-256 is
`b05db1a1cf0f7c112d66069938285c1a91e3c29d758b8e40b6176a3cd46c8cea`.
Regenerate it with:

```bash
ffmpeg -hide_banner -loglevel error -threads 1 \
  -i test/e2e/fixtures/installed-quote-two.mp4 \
  -f lavfi -i 'anullsrc=channel_layout=mono:sample_rate=48000' \
  -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 32k -t 4 \
  -movflags +faststart -map_metadata -1 \
  -metadata creation_time=1970-01-01T00:00:00Z -threads 1 -y \
  test/e2e/fixtures/installed-native-controls-av.mp4
```

The single `own12-native-controls-observations.json` receipt has fixed
`block-controls-only`, `allow-all`, and `block-all` mode records. Each mode uses
a fresh page and checks trusted, hit-tested native Play, Pause, seek and volume
actions without a gallery or metadata request, then reloads the fixture for an
ordinary click on B's adjacent photo. That photo must select B's exact image and
restore the host state in every mode. The `block-all` record also checks that a
video-surface click stays native. Each controlled setting is read back and the
prior full settings value is restored, including when a case fails; the scoped
A/V route and its original bytes are restored after the mode records.

These helpers restore owned routes, pages, response gates and settings, and
verify that permission state stays unchanged. Their bounded event and request
receipts retain failures as well as successes. Provider access, live-CDN compatibility and audible output remain
outside the fixture evidence.

The separate `installed-metadata-readiness.mp4` is a 117,289-byte, two-second
VP9 Profile 0 MP4 with 48 real coded samples at 24 fps. Its dimensions are
320×192; this case's API declares the same size and 5:3 aspect ratio. The
synthetic `320x180` route name does not describe decoded dimensions. SHA-256:
`d4ac575d4f6ce11458e61f948fab6becd37ae5530afc66db7141dcdde012e8a2`.

The producer accepts only the immutable 92,715-byte base MP4 (SHA-256
`5c2d73ce56a49e7ce51ce9edbbc780e3fe35daa3e00bbe5d5adeac871cc4b018`)
and its exact layout. The [VP9 uncompressed header syntax, section 6.2](https://storage.googleapis.com/downloads.webmproject.org/docs/vp9/vp9-bitstream-specification-v0.6-20160331-draft.pdf)
includes `show_frame` for key frames. The producer clears that bit in the first
real coded key picture, leaving the reference picture coded but hidden. It
enlarges the existing `free` box and adjusts the single `stco` offset to place
that 7,172-byte key sample at bytes 25,596–32,767. The held native response
ends at exclusive byte 32,768; all later samples remain behind it. The complete
`moov` and VP9 sample description are available before the hold.

The installed profile holds the response at that prefix and requires at least
700 ms of selected, paused `readyState === 1`, nonzero dimensions, metadata
readiness, no first-frame readiness, no presented callback, and zero decoded
frames. After releasing the tail, it requires a native first-frame callback and
at least 700 ms of first-frame readiness while still paused at the beginning.
Ordinary Play must then advance time without an error. A separate playing
capture supports scoped pixel review; paused poster captures alone do not prove
that encoded pixels are visible.

Each selected source request must settle. One complete no-Range `200`, or
byte-complete `206` ranges, is valid. A post-release `net::ERR_ABORTED` is accepted
only with an exact subsequent Range completing all remaining bytes; the receipt
still labels the first request aborted. Missing bytes, early or unknown aborts,
pending or duplicate terminals, and out-of-range transfers fail. Native served
range lengths and hashes are checked separately from CDP received-byte totals.
The profile preserves host focus/scroll/styles and permission state, and disposes
owned routes, response gates, frame callbacks, observers, sessions, and pages.

The checked candidate was generated from FFmpeg 7.1.5 and libvpx-vp9:

```bash
ffmpeg -hide_banner -loglevel warning -threads 1 -f lavfi \
  -i 'testsrc2=size=320x192:rate=24:duration=2' -frames:v 48 -an \
  -c:v libvpx-vp9 -threads 1 -deadline realtime -cpu-used 8 \
  -lag-in-frames 0 -auto-alt-ref 0 -g 48 -b:v 0 -crf 32 -pix_fmt yuv420p \
  -movflags +faststart -map_metadata -1 -metadata creation_time=1970-01-01T00:00:00Z \
  -f mp4 /tmp/xeg-metadata-base.mp4
python3 validation/windows/create-metadata-hidden-vp9-fixture.py \
  /tmp/xeg-metadata-base.mp4 test/e2e/fixtures/installed-metadata-readiness.mp4 \
  /tmp/xeg-metadata-hidden-vp9.json
sha256sum test/e2e/fixtures/installed-metadata-readiness.mp4
```

The installed profile also serves the declared small MP4 assets and
`installed-quoted-video-page.html` with deterministic `TweetResultByRestId`
responses from `installed-quoted-video-api.ts`. Its quote cases cover a marked
branch without a permalink, an unmarked clickable branch with an outer video
(playing video to role link: 18 hops; article: 24 hops),
an explicit quoted permalink, and nested quotes opened from the outer post or
the directly quoted post. Each case opens the preview before native playback,
then uses the blob-backed host player. It checks the selected API video path,
originating-post toolbar link, collection/current/focused indices, dimensions,
readiness, media errors, and playback after a gesture. Navigation away and back,
privileged MP4 filename and exact byte/hash checks, Escape/button close,
focus/scroll/body/isolation restoration, and teardown are recorded per case.
The outer-video control proves that selecting A and B remains independent.

The source-credit control gives the clicked B preview its own enclosing B
`/video/2` permalink, while C's credit stays outside that media action. It checks
the direct B request and selection, native pointer/keyboard C credit navigation,
and a separate C-owned media action. The enclosing link proves only the B preview
action; it does not establish ownership for sibling native controls. A B header
and C credit that both sit outside the clicked media remain ambiguous and are
covered by the maintained refusal tests.
An additional installed pre-player case mirrors the bounded public-page shape:
two same-ID A header links without `<time>`, an unmarked role-link quote with a
nested B article, and a narrow wrapper containing a non-enclosing C credit
link. Two ordinary avatar images and one trusted B video thumbnail share the
media shell two ancestors above a bare button; no host `<video>` exists before
the click. It temporarily
sets the supported `allow-all` video-click mode in the task-owned extension
storage, reloads the fixture, and restores the exact previous value in `finally`.
An ordinary hit-tested click on the bare preview button must request A, select
and attribute B's video, preserve B's text and source link, play with nonzero
progress, exclude C, and download B's exact MP4 bytes and filename. The case
also checks navigation and host-state restoration. These fixture IDs are
synthetic and do not identify posts on the reported public page.
Fixture routes supply transport and host media only; extraction and downloads
use the installed production extension. These results do not establish the
reported live page's quote relationship or availability.

Issue #284 extends those installed quoted-video cycles. The fixture records the
actual trusted click target and composed-path tags for the preview, native Play
button, and blob-backed host video. It proves decoded host playback advances
before opening, then checks the host pauses only after the gallery opens. The
new gallery video must start at zero, paused, with XEG's saved volume and mute
settings; an ordinary video click must then advance playback. While it plays,
controlled host replay, insertion of a video already playing, and replacement
of an existing host video must stop without stopping the gallery video. Closing
must release suppression so the original and replacement videos can play again.
The four-second fixture videos loop only for this prolonged host-action check;
the receipt keeps the fresh gallery video's original non-looping state. A host
counts as stopped only while decoded, unended and paused, and gallery progress
is measured inside a short interval before the next loop boundary.
The first gallery also opens its real Video clicks settings control, changes all
three modes with trusted keyboard input, checks persisted values and visible
help, then restores the exact prior stored value. It then saves `allow-all`
through that control, verifies the native per-field storage record, and checks
that a newly opened fixture document reads `allow-all` in its gallery Settings.
The new document closes and the full prior storage state is restored before
the original gallery's download checks. The profile composes the production
legacy and per-field JSON storage envelopes while preserving raw values for
restoration. This checks playback state and time progression, not audible
output or host-to-gallery time transfer.

The same production installation routes a direct, unmarked MP4 under a valid
post owner. Its `block-all` click must reach the native video without a gallery
or provider request. A missing setting, explicit `block-controls-only`, and
`allow-all` must each open the exact owner-specific gallery video from that
eligible video surface. A separate `allow-all` quote fixture clicks button
padding, text, SVG background and path through ordinary hit-tested input. Each
must retain its actual `event.target`, open the same B video, and restore host
focus, scroll and isolation after closing. These are bounded fixture cases;
other browser installation modes and live X remain separate evidence tiers.

A held 403 response against a blob-only playing host video checks that the
intercepted click does not pause the host during extraction. After release, the
installed notification must describe the native play/pause recovery and
Alt+Shift+V shortcut. Ordinary trusted input must persist `block-all`, leave a
subsequent video click native without another API request, and restore the full
prior task-owned setting after the check. A bounded service-worker observer
records the message at the actual `chrome.notifications.create` boundary,
calls through to native delivery, and pairs its ID with `getAll`; it restores
the original API in `finally`. A second held request is released after
navigation to prove the old session cannot open a gallery or notify the new
page. Its observer cursor starts before the click and survives navigation;
the verdict requires zero subsequent creation calls independently of the active
notification list. It waits for the exact request's finished/failed event and
the held route's settlement, then reads the native worker boundary. Observer
loss, replacement, overflow, or incomplete history fail the check.
A bounded negative control sends two native notifications with the same owned
ID through the installed background handler, clears the ID, and requires the
same verdict to reject both creations after the control ID disappears from the
active list. Pre-existing notifications remain untouched; a unit negative control
also exercises a completely empty active list. The receipt
retains that control, the legitimate failure notification history, observed
active IDs, cursor counts, settlement, and observer restoration.
Two valid owner-specific videos on one document also exercise a held A
response followed by an ordinary B click; after A completes or aborts, B must
remain selected, focused and current, and its native download must match B's
preferred MP4 source and bytes. The native loopback serves that exact synthetic
B path. The controlled renderer-fault case injects a
single `CSSStyleDeclaration.setProperty('--xeg-viewport-w', ...)` failure into
the installed extension's own isolated execution context through CDP. It
restores and verifies the original prototype descriptor in `finally`, checks
the production modeless recovery surface and native host playback while that
surface remains visible, then exercises a new gallery session and normal close.
Click-boundary JSON checkpoints retain the fixture's actual event targets and
paths, provider requests, gallery selection and host media state even when a
later gallery assertion fails.

The installed profile also opens one routed unavailable-sequence document under
the same extension installation. Three ordinary `allow-all` preview clicks
request distinct synthetic post IDs whose `TweetResultByRestId` replies are HTTP
200 with no provider errors: `TweetUnavailable`, `TweetTombstone`, and two nested
visibility wrappers around `TweetUnavailable`. Each preview has a trusted video poster
but no playable DOM source or image fallback. The profile waits for each normal
extension notification before the next click and requires extraction to finish
without opening fallback media. A fourth click on the same document, before the
circuit reset interval, must make a fresh HTTP request and open the directly
quoted B video with its exact source, owner, text, collection indices, nonzero
dimensions, error-free playback progress, and normal close restoration. It
records bounded request IDs, HTTP and provider outcomes, timestamps, each step,
settings restoration, and partial failure evidence. This is a deterministic
routed fixture, not an observation of live X availability.

A separate no-DOM-fallback preview on that document receives an HTTP 200 JSON
body above 2 MiB. The installed extension must show its metadata resource-limit
notification, distinct from the ordinary unavailable-post notification, without
opening a gallery or retrying the request.

After those cycles, the installed profile uses the exact installed extension
worker and exact owned fixture tab to set real `chrome.tabs` zoom to 200%, then
restores the prior factor and tab zoom settings in `finally`. At that zoom it
selects Spanish through the product settings, navigates by keyboard, checks the
displayed position and visible-item count against the selected media and current
download, verifies the effective fit label and essential controls fit and remain
keyboard reachable, and checks the privileged downloaded bytes. It captures
the gallery and the closed host, including focus, scroll, body-style, and
background-isolation restoration. This is browser tab zoom in the fresh task
profile; it does not claim an OS DPI change or a live X.com observation.

The installed profile first starts a direct image download through real media and
toolbar clicks. The loopback listener holds its original-image response after
a bounded header prefix while the smaller display image stays on the page route. A native
`onDeterminingFilename` listener holds that exact new download active until
cancellation; its asynchronous `suggest()` callback
is released exactly once during cleanup. The native item must be paused and
`in_progress` with its private direct request binding and bytes remaining.
Page-synthetic Escape/help, outside/backdrop,
toolbar Download/Close and a temporarily reparented Close button must leave the
same download active and the gallery open. Genuine keyboard help reaches a
notification-count seam that suppresses OS delivery for this case; synthetic
input must not increase it. Genuine Escape must cancel that exact download with
`USER_CANCELED`, persist its terminal direct status, and leave no output or partial file. The
profile restores the notification seam, held response and button and removes only its
owned download/history/files. Missing gate ownership or an item reaching a
terminal state before genuine cancellation fails this regression. Download
creation, pause, search, cancellation and history remain the real Edge APIs.

The deterministic fixture also exercises the MV3 download restart boundary. A
bounded 256 MiB Blob belongs to the routed `https://x.com` fixture and enters the
existing `DOWNLOAD_BLOB_URL_REQUEST` path. An extension utility page listens for
the exact Blob URL through `chrome.downloads.onCreated` and immediately invokes
the real `chrome.downloads.pause`. If all Blob bytes arrive before pause takes
effect, the profile records that failed preparation and permits at most three
preparations, each after confirmed cleanup of its download, tracking, listener,
Blob URL and added files. The qualifying preparation still requires bytes
remaining. Any Worker-stop or cancellation failure ends the regression without
retry. It then requires a new Chrome download ID, exact filename, `in_progress` and
`paused` browser state, and the matching persisted tracking record before
invoking CDP `ServiceWorker.stopWorker`.

Browser-level CDP tracks targets, while an extension utility-page CDP session
owns the ServiceWorker domain. The profile's protocol code does not explicitly
attach to or evaluate the Worker target and does not substitute
`Target.closeTarget`; Playwright can still maintain its standard automation
sessions. The old Worker must report `stopped` while the real download remains
paused. Target enumeration and creation events are retained as diagnostics, but
the ordered, complete ServiceWorker version updates establish the lifecycle
boundary because Chromium can retain the DevTools target across Worker
stop/start. The profile must observe a strictly later `running` update for the
same script and version that matches the current Worker target. That replacement
may be observed before or after the cancellation dispatch; the evidence records
the ordering without attributing the wake-up to cancellation. Immediately before
sending the production `DOWNLOAD_CANCEL_REQUEST`, the profile rechecks the one
owned download ID, its `in_progress` and `paused` state, and the exact persisted
request-to-download relationship. The request must leave the browser download
`interrupted` with `USER_CANCELED` and remove the tracking record. Chromium keeps
the ServiceWorker DevTools agent host across Worker stop/start, so reuse of the
target ID is recorded evidence rather than a failure. The task download directory
must contain neither a completed payload nor a `.crdownload` residue.
The exact task-owned file path and directory are checked on the filesystem before
manual cleanup. Chrome's [`DownloadItem.exists`](https://developer.chrome.com/docs/extensions/reference/api/downloads#property-DownloadItem-exists)
is retained as diagnostic metadata because `search` can return before its cached
file-existence value is refreshed.

The profile identifies the browser item independently by its unique Blob URL and
later requires the exact filename before requiring the matching storage binding,
so an early persistence failure still retains an owned item for diagnosis and
cleanup. The original request channel outcome is a bounded diagnostic and may be
recorded as pending. The on-created listener, page Blob URL, exact download
history item, tracking record, route, pages, and any task-created partial file
are cleaned in `finally`, including failed runs.

The profile also stops the Worker during a separate, held direct JPEG transfer
started by the gallery in the original fixture tab. It requires the one new
native ID, matching source URL and persisted tab/hash ownership, an incomplete
transfer before and after the stop, and the same ID after a real Escape from
that tab. The replacement Worker must be observed, the download must finish
`interrupted` with `USER_CANCELED`, and its single loopback connection must
close without a page fetch or saved residue. The direct terminal record may
remain until its bounded expiry. This test does not forge a content-script
sender from an extension utility page or claim a known caller reply after the
Worker stopped.

Immediately after the Worker-restart and trusted-input checks, the same installed
fixture page exercises the application-owned ZIP memory limit. Only the three fixture image
`fetch`/XHR requests receive a temporary page route; visible `<img>` requests
continue through the normal fixture route. The first selected-image response
declares a `Content-Length` greater than the limit read from the packaged
`live-byte-budget.ts`, while its actual body stays below one MiB. The browser
must observe that header, the gallery must show localized resource guidance,
and the native partial ZIP must include exactly the two remaining images with
correct names, order, CRC and bytes. Its verified file is removed through the
native API before reusing the same output name; its saved evidence is retained.
The on-page missing-items action must then save a separate native `-missing.zip`
containing only the omitted original filename and bytes. Its exact download ID,
on-disk identity, entry order, CRC, bytes, and SHA-256 are verified independently.
Only the omitted image may be fetched for that action; the two successful items
must not be requested again. Without reloading or replacing the gallery,
keyboard navigation and a small direct single download must still work. A
subsequent bulk action must save another native ZIP download with the exact
three image names and contents; the profile verifies its stored-entry boundaries,
local and central order, CRCs, and bytes. All three entries are reused from the
same page's media cache. The completed result can be dismissed, and a reopened
gallery session must have no old recovery action or ZIP result. The profile
records exact Chrome download IDs, elapsed times, request phases, page time
origin, screenshots, and exact route cleanup.
The declared limit is an admission-policy check; browser heap and RSS are not
measured, and the oversized body is never allocated.

Installed Chrome or Edge supports `--installation extension` and the separate
`--installation userscript` Tampermonkey fixture. Firefox userscript installation,
Violentmonkey, authenticated X.com, native Save As,
Explorer, OS theme/DPI matrices, and physical GPU behavior remain outside this
profile. These restart checks cover explicit forced stops in the generated
Chromium MV3 extension, including one held direct HTTP response. They do not
exercise natural idle termination, browser shutdown, OS crash recovery, or a
continuously streaming network transfer during the stop boundary.

After committing a clean named checkout and running the repository gates, use
the configured controller in the prepared Windows validation environment to run
the installed Chrome or Edge extension profile. Keep its evidence output
outside the checkout.

The entry uninstalls the extension and removes its profile after the owned
browser closes. If browser cleanup fails, it preserves that profile for bounded
diagnosis rather than terminating unrelated processes.

### Optional public-to-candidate upgrade input

For v2.3.9 release qualification, copy the checksum-verified public v2.3.8 userscript to
`validation/windows/release-upgrade/v2.3.8.user.js` and extract the verified public
Chrome ZIP to `validation/windows/release-upgrade/v2.3.8-extension/`. Compute the
unpacked file inventory with `extensionInventorySha256(path)` from
`validation/windows/release-upgrade/source.ts`. Add the ignored
`validation/windows/release-upgrade/input.json` with the exact paths, release URLs,
provider-verified public userscript SHA-256 and the extracted Chrome ZIP inventory
SHA-256. Use `schema: 1`, `previousVersion: "2.3.8"`,
`candidateVersion: "2.3.9"`, `previousUserscript: { path, sha256, url }`, and
`previousExtension: { path, inventorySha256, url }`. The input parser requires a
production v2.3.9 userscript and extension
manifest. Keep the public assets and input outside Git; the installation asset
declaration bundles them
only for the selected Windows run. Without `input.json`, the original fresh
installation runs unchanged. The historical v2.3.7→v2.3.8 input remains supported
with its original fixed paths and URLs; the separate v2.3.8 same-version
attribution input below is not an upgrade input.

The extension control loads v2.3.8 from an owned profile path, changes fit and
language through the gallery controls and video volume through the gallery's
trusted Arrow Down shortcut, copies the candidate over that same path, invokes
the extension's documented `chrome.runtime.reload()` API, and checks the same
extension ID, v2.3.9 manifest, exact candidate file inventory and saved settings.
Both controls check the public v2.3.8 gallery's default video-click setting and
enabled keyboard navigation before and after the update. They exercise the
candidate's nondefault click setting separately, then restore it; they do not
establish nondefault click-mode preservation across this update. The Tampermonkey
control imports v2.3.8 through its UI, changes the same available gallery
controls, imports the candidate through the manager's Update confirmation, and
checks one script row with the new version plus saved settings in newly opened
galleries. It reads the manager's visible CodeMirror editor before and after the
update and matches the full installed source hashes and script identity against
the bundled public and candidate files. The public and candidate headers must
both use the Latest download URL. This flow exercises a manual manager update
and does not prove automatic discovery or installation of v2.3.9. Both restore
fixture defaults through the app UI before the existing download and lifecycle
suite. Receipts are
`extension-upgrade.json` or `userscript-upgrade.json`; a missing or unfamiliar UI
fails the control. These controls do not establish that a browser or userscript
manager will download and apply updates automatically.

### Optional same-version artifact attribution

To compare the public, older source, and current candidate Chrome extensions at
version 2.3.8, run the installed extension profile three times, each with a fresh
owned browser profile and a separate evidence output directory. For one run,
place `validation/windows/release-upgrade/same-version-input.json` beside exactly
one declared extension directory. The `role` is `public`, `stale`, or `candidate`;
their paths are fixed in `release-upgrade/source.ts`. The two copied historical
directories and input are ignored by Git. The current build supplies
`dist-extension` for `candidate`.

The input has schema 1, `role`, `version: "2.3.8"`, exact `sourceSha` and
`coreSha`, and `extension: { path, inventorySha256, contentSha256 }`. Set the
candidate `sourceSha` to the current clean checkout commit recorded in the
Windows bundle. Use `extensionInventorySha256(path)` for its inventory. The
parser fixes the public and stale source, core, content and inventory hashes,
and pins the candidate's complete inventory and content hash to the maintained
clean-source build. It also verifies the selected directory, manifest and bundle
identity. The public directory must contain the independently
verified public v2.3.8 Chrome ZIP contents. A missing input leaves the normal
installed suite unchanged; malformed input or coexistence with `input.json`
stops the run.

Each attribution run loads only its declared bytes, then exercises `recognized`
as the healthy quoted-video control, `unmarked` as the normal `quote_two` download
case, and `unmarked-no-outer` as the target preview, playing and paused case.
Each case uses a fresh page in the same profile. A successful `unmarked` download
retains the filename that Chrome uniquifies for `unmarked-no-outer`. The receipt
keeps the installed manifest, file inventory, content digest, script bytes
observed through the page debugger, case outcomes and owned cleanup under
`same-version-attribution.json`. A failed case does not skip later cases; the
failure remains in the aggregate result. The three receipts compare
artifact identity and observed behavior; equal version labels do not imply an
upgrade or identify a product regression without the case evidence.

## Installed Tampermonkey userscript flow

Prepare a reviewed unpacked Tampermonkey package outside the checkout, then
pass that directory as `--manager-directory` to the shared controller. The
maintained YT `validation/windows/prepare-userscript-manager.py` helper pins
5.5.1 and must not be used for a different Store version. The controller
validates the manager identity and bundles its exact file hashes. Record the
original package digest and installation source separately. Use a clean
committed checkout and run:

```bash
python3 /home/piesp/projects/windows-acceptance/vmctl.py run \
  --repo /home/piesp/projects/xcom-enhanced-gallery \
  --browser chrome --mode desktop --installation userscript \
  --manager-directory /path/to/unpacked/tampermonkey \
  --output /path/to/private/xcom-userscript-evidence
```

The HTTPS userscript fixture currently supports Chrome only; Edge userscript
acceptance remains unverified. The manager is imported as an unpacked
extension, the production userscript is installed through its confirmation UI,
and native downloads use the owned browser directory. The fixture starts a
task-owned HTTPS listener on ephemeral `127.0.0.1` before launching the fresh
profile. A one-run SPKI exception and exact `pbs.twimg.com:443` and `x.com:443`
host mappings let the real manager and browser use only declared JPEG and
`TweetResultByRestId` routes. The default API smoke still receives a routed 403.
After download recovery, explicit API modes serve one small valid JSON body,
one response above 2 MiB, and two single-hop redirects through the HTTPS
listener. The redirect receivers return the same small healthy JSON: one ends
on allowed `pbs.twimg.com`, the other on a disallowed non-API `x.com` path.
The receipt records both physical GM hops and selected original or fallback
image quality, establishing response-use admission after the manager follows
the redirect. A separate no-DOM video preview checks the actual manager
notification for the localized metadata resource-limit category after the
oversized response. The oversized body is bounded by a separate 3 MiB fixture
budget. This tests the installed Tampermonkey path without claiming a bound on
manager-owned buffers or pre-hop credential exposure.
One further owned single-image action arms an exact same-host media 302. The
manager's native download history must retain the original URL and report the
declared final URL; the existing filename, completed state, owned saved path and
byte-equality checks still apply. The HTTPS listener records the one redirect
and one final JPEG response. This is browser-controlled redirect observation,
not pre-follow destination enforcement.
The generated private key stays in process memory; no OS trust or hosts setting
is changed. For each single image, a read-only query from the exact manager
options page requires one new native download ID for the fixture URL, a complete
state, the exact owned saved path and name, and the expected file size. The
only new owned file is then read and checked against the fixture bytes. CDP
download events are checked when present for these manager API downloads, but
their absence is recorded separately. ZIPs still require browser-level CDP
`completed` for each unique GUID and an independently read owned file. The ZIP
reader checks stored entries, central directory, order, CRCs, names, and bytes.
Queries return only bounded IDs, states, interrupt enums, and match booleans;
unavailable or ambiguous history fails the native completion gate. A completed
native save does not release the userscript's page-owned Blob reservation: that
reservation remains until genuine page teardown. Gallery reopen alone cannot
recover it. The 512 MiB ledger covers all live reservations, so it is not a
per-file allowance. After no download is active, a real reload starts a new
page lifetime. Normal, failed, partial, and held transfers use distinct fixture
media IDs, and each phase opens its own article in the same document; completed
media cache entries cannot mask the later transport cases. The first normal ZIP
requires three loopback responses. Its same-page repeat may reuse completed
media cache entries and is verified by the saved ZIP inventory and bytes. The
cancellation case holds one armed loopback response and requires its connection
to close after gallery
cancellation, then keeps the same document alive for a bounded two-second
observation, checking browser
download events and owned files repeatedly. It does not prove that an
unobservable manager callback can never arrive later. ZIP receipts record only
the source scheme and origin and require the expected X.com page Blob origin;
they omit the Blob UUID. This fixture records policy behavior; exact and over-limit
arithmetic, BFCache, and synthetic event boundaries belong to production unit
tests. It measures neither heap nor RSS and makes no elapsed-time completion
claim. Firefox userscript and Violentmonkey remain untested by this controller.

### Optional public status observation

Up to three exact public status URLs may be supplied with repeatable
`--live-url` arguments. Accepted URLs are
`https://x.com/<handle>/status/<digits>` and the equivalent `twitter.com` form;
credentials, ports, query strings, fragments, whitespace, backslashes, trailing
paths, and handles outside X's 1–15 character public format are rejected. XCOM
does not support the controller's duration observation mode.
The fixture browser and HTTPS listener close before this observation. The same
task-owned profile reopens as a fresh browser process without fixture host
rules or SPKI exception, and the unpacked extension is loaded again.

The deterministic installed fixture always runs first with strict console and
page-error checks. The profile then removes every fixture route before opening
the caller's unchanged URL. The default public observation does not intercept
traffic, add authentication, accept consent or CAPTCHA prompts, start downloads,
force clicks, or edit the host DOM. For an image it checks the exact status-owned photo action and loaded
gallery image. For a visible video or video preview in that status's quote card, it records a
bounded ownership path and observed status links, uses an ordinary hit-tested
click, and checks the selected gallery video, playable source, dimensions,
readiness, error state, and playback progress. A video in an unmarked branch is
only a candidate until observed API relationships and its selected playable
variant establish the directly quoted owner. Both paths check dialog opening,
Escape close, focus, scroll, and body-style restoration. The video observer
records the focused host element at the trusted gallery activation click,
after native pointer focus changes, and checks that exact element after Escape.
It also requires a meaningful prepared focus target before the click.

The image observer also recognizes a bounded compact C quote inside the direct
B article. It requires a unique trusted photo and overlapping same-C status
action, rechecks the B/C boundaries before an ordinary click, and compares the
selected source and index with C's observed successful API response. An API 403
keeps the observation unverified even if the visible photo opens through DOM
recovery. This path does not authorize recursive quote traversal or turn a
neighboring news card into an owned attachment.
The compact region may mix C's base status permalink with `/photo/N` links.
Both photo links must retain the exact same action path, and the observer uses
that actual path again when checking the click target immediately before input.

The authenticated flat layout can expose a nested C photo as a native
`nestedQuotePreviewMedia` anchor without an image in A's article. The separate
observer path requires one visible, top-hit `/photo/N` action inside the marked
nested preview, then checks C's own successful API photo at index `N - 1`, the
selected gallery source and index, and the canonical C status link in the
opened tweet panel. It does not infer B-to-C ownership from the unmarked
wrapper. Missing, conflicting, or rejected C API evidence cannot establish
this path; a provider rejection remains unverified rather than a product defect.

When a native player covers every point with controls, the observer first
makes a bounded ordinary Play click and records host-video readiness and
playback separately. If it plays but no non-control gallery point remains,
the observer retries the unchanged URL in the same fresh owned profile with
the supported `gallery.videoClickMode: allow-all` setting. It records both
attempts, verifies the stored mode, and restores the complete prior extension
setting in `finally`. The original user's installed setting is unknown; the
controlled result applies only to the recorded mode. Native playback alone
never counts as an XEG gallery pass.

An observer attached to an existing authenticated extension context calls
`observeLiveUrls` with `session: 'borrowed'`. This mode reads the installed
extension's `xeg-app-settings` through an observer-owned extension page and the
`xeg-fallback:xeg-app-settings` copy from the observed X page's localStorage.
It applies the production revision ordering and records whether the effective
video click mode came from the primary copy, a newer or sole fallback copy, or
the production default when both copies are absent. Unknown values and unreadable
fallback storage fail closed. Both copies are checked again after page readiness
and immediately before media activation. The observer closes only pages it
created and never changes extension settings. It does not run the controlled
`allow-all` retry; native playback without a gallery action remains a failed
observation.

Each page writes a partial JSON record and screenshots even when a required
assertion is missing; the profile then fails rather than treating an unavailable
guest page as success. Host console, HTTP, and request diagnostics are retained
separately from extension-origin errors with URL queries and credentials
removed. A `TweetResultByRestId` 403 can coexist with an observed gallery flow,
but leaves the overall live evidence `unverified` instead of classifying the
response as a product defect. The JSON records only allowlisted
`TweetResultByRestId` operation, requested ID, HTTP outcome, direct quote and
nested quote IDs, media IDs/types, and approved poster/video source paths; it
does not retain response bodies, text, headers, or URL queries. A blocked page,
missing quote, unavailable API relation, or nonplaying video remains unverified.
When all quoted-video assertions pass, an aborted request for a chunk of the
selected, directly quoted video may be counted as an expected host media
lifecycle cancellation. The request must be from the same `video.twimg.com`
media family and media ID as the selected source. Other host diagnostics,
diagnostic overflow, or any failed assertion keep the evidence unverified.
For a **new** borrowed-session run, the private caller may provide a
`BorrowedHostDiagnosticProof` built from a fresh, same-profile observation of
the exact URLs while XEG is absent. Before passing it, the caller must verify
the raw baseline receipt SHA-256 and the actual source/core/bundle, browser
PID, birth, session and SID, profile, debug-port, unchanged unrelated extension
inventory, installed extension path, and all 12 runtime resources. The live
observer checks the packet's matching identities, baseline age of at most two
hours, complete baseline, URL set, and a bounded exact multiset of the known X
`loader.TimelineRenderer` inline-handler
CSP message hashes and script locations. A new baseline independently checked
with repeated visits may also supply an optional nonce canonical hash for each
full message. The observer replaces only valid quoted nonce values inside the
single `script-src` directive, then requires the entire canonical message hash,
exact script, original UTF-8 message length, nonce count and lengths, and
diagnostic multiset to match. Full message hashes remain in the evidence.
Malformed nonce sources, changed policy bytes, and unknown diagnostics remain
unverified. A matching baseline shows that those
messages can occur without XEG; it does not assign them exclusively to X or
other installed extensions. A query-bearing `ERR_ABORTED` is qualified only
when the full HTTPS URL is byte-for-byte identical to the selected gallery
video source and a video/mp4 API variant for the uniquely established direct
quote and media item; conflicting full URLs for that same API variant path
remain unverified. Full URLs are compared only in memory and discarded
after the page; the receipt retains sanitized paths, hashes, and match flags,
never query values or credentials. The borrowed summary records proof validity
and the bound baseline receipt SHA-256. Missing or mismatched proof, a changed CSP
message/count, any unknown host diagnostic, oversized input, overflow, or a
failed required assertion remains unverified. The optional proof has no effect
on owned-profile observations. Earlier receipts lack the full fingerprints and
cannot be upgraded retroactively; a new source-bound run is required.
Review the retained screenshots separately before making a live-page claim.

The explicit `{"scenario":"actual-site-acceptance"}` selector is accepted only
with an installed extension, at least one validated public `--live-url`, an
owned profile, and no other focused selector or upgrade input. The ordinary
fixture and live core-flow gates still run. One eligible public image gallery
must contain two to four distinct public images. The lane verifies actual
Next/Previous selected and focused identities, a single toolbar download, and
a ZIP toolbar download with exactly that many stored entries. It requires new
completed Chrome download IDs, files inside the task-owned download directory,
bounded file reads, SHA-256, ZIP central-directory/CRC checks, and every ZIP
item's size and hash against an independent bounded public original GET. The
selected single file must match its original as well. Each original comes from an exact
requested-status HTTP 200 provider photo path and format; the gallery display format
is not treated as original proof. Public image HEAD responses must declare
each source at no more than 64 MiB and a projected single plus ZIP total below
128 MiB; absent or larger declarations leave the lane unverified before any
download click. Chrome progress is watched and an over-budget download is
cancelled; a failed attempt retains a partial receipt and the normal owned
profile cleanup. These are acceptance and retained-file bounds, not a hard
instantaneous network-byte guarantee.

The same lane changes the theme through the visible settings control, reads
extension storage, confirms it in a reloaded new document, restores the exact
prior stored settings, and checks the restored UI after another reload. It then
performs a full-document visit to a second supplied public status and records
that scope separately. A distinct post-close same-document navigation probe clicks an existing
preceding same-author public status anchor on an observed image page, if one is
available and top hit-tested. A public login barrier leaves this probe unverified.
The gallery is already closed by Escape before this click,
and the receipt records that boundary. The probe requires the same document time origin
and no reappearing gallery or changed body style or scroll policy. It does not establish
that navigation closes an open gallery. A video gallery with at least
two items must show actual Next/Previous navigation, selected/focused media
identity, a paused nonselected player, and return to the same source-bound
current video. For an opt-in direct mixed post, the observer may enter through its
owned photo action and verify photo-to-video-to-photo navigation with real gallery
video playback controls; the receipt names this entry. This mixed post does not
qualify for image-only downloads. The existing direct-quote ownership and playback checks still
apply. An unmarked candidate without quoted status IDs instead requires unique direct
status ownership from the exact playable provider variant. A controlled allow-all retry
still applies when needed. The summary has
separate coverage flags for multi-image downloads/settings, video navigation,
and post-close same-document navigation; all three are required for actual-site acceptance.
Absent source size, native completion, eligible video neighbor or same-document
status link leaves this opt-in acceptance unverified. Default no-download
diagnostics remain separate. No authentication, consent, CAPTCHA, traffic rewriting, Explorer,
native Save As, or performance claim is made by this lane.

Run `node --experimental-strip-types --check validation/windows/install-preparation.ts` and
`node --experimental-strip-types --check validation/windows/install-profile.ts` for the installed
profile syntax check.

For a focused installed-extension opening-feedback comparison, the ignored
`validation/windows/inputs/opening-feedback.json` selector described in that
directory's README runs only the delayed-opening cases and records pending and
terminal screenshots. The controller still binds the built package and cleans
up the owned browser profile. Keep the selector outside Git.

The #381 baseline on installed Edge opened the healthy B gallery in 272.39 ms
and repeated it in 204.65 ms; the held A response remained pending for 5 s
without an acknowledgement. The 500 ms delay keeps those measured fast paths
quiet while giving a held extraction a visible, source-adjacent status. The
focused probe records trusted click, status insertion, and removal times and
checks that no retired status survives a later action or navigation.

The optional #382 recovery selector in `validation/windows/inputs/README.md`
reuses the installed extension's three-image quality, original-availability,
and bounded memory fixtures. It records the current on-page failure and save
result after notifications are suppressed and more than five seconds have
passed. Saved partial and healthy ZIPs retain their exact entry, CRC, byte, and
SHA-256 checks. This focused baseline does not change product recovery behavior.
