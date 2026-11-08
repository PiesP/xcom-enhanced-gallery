# Optional Windows artifact fixture selector

For focused installed Chrome/Edge or temporary-installed Firefox extension
verification of native gallery UI, create the ignored, exclusive
`native-browser-ui.json` selector:


```json
{"scenario":"native-browser-ui"}
```

Run the prepared VM with `--browser firefox --installation extension`, the
final built `dist-extension-firefox` artifact, and no public `--live-url`.
This route uses a temporary installed extension, the existing experience page,
three generated JPEGs with matching intrinsic dimensions, and real Firefox
BiDi pointer/keyboard input. It records native modal and host inertness,
Tab/Shift+Tab, anchored tooltips on a scrolled host and resized viewport,
Arabic selection through the native select, narrow RTL tooltip layout,
Settings/help/gallery Escape ownership, host state and opener restoration, and
reopen. It retains `firefox-native-ui-observations.json`, screenshots, and the
common `firefox-installation.json` receipt on success or failure. The filename
download scenarios do not run in this focused route. Remove only this task-owned
selector after the attempt; retain failed receipts and screenshots.

For Chrome/Edge:

Run through the prepared-VM controller with `--installation extension`, no
public URL, and one installed browser at a time. The owned experience fixture
checks a scrolled host, native modal and real Tab focus, anchored tooltip
geometry and description, settings/help Escape ownership, native `scrollend`
after wheel displacement, host scroll/focus restoration and reopen. The
source-bound receipt is `native-browser-ui.json`; installation and cleanup
results remain in `installation-result.json`. Remove only this selector after
the run. It does not qualify live X or installed Safari.



The probe also captures page-native viewport PNGs with a focused English
Settings tooltip, then the actual Spanish ZIP tooltip at installed 200% tab
zoom in the normal and 840×592 viewports. The receipt records the browser zoom,
device-pixel ratio, CSS viewport size, tooltip/anchor geometry, description,
anchor linkage, and tooltip-center hit target. The fixture restores tab zoom,
viewport, and language before the wheel and close checks.

For the bounded #509 native-scrollbar takeover observation in the same installed
Chrome/Edge or temporary-installed Firefox session, use exactly:

```json
{"scenario":"native-browser-ui","scrollbarTakeover":true}
```

This extends the owned tall JPEG to 300×6000 pixels. The probe records the natural
scroll behavior, then enables smooth behavior only on the fixture scrollport and
uses real product Home/End input. Before that input, an isolated temporary
scrollport records computed behavior, reduced-motion state, and frame/event
positions for one `auto` and one explicit `smooth` call. This calibration only
diagnoses whether that browser session animates; it is removed before product
input and does not qualify takeover. Only the optional takeover selector starts
Chrome with its existing `--enable-smooth-scrolling` setting in the owned
temporary profile. The receipt records this launch condition, so this controlled
run is distinct from an unmodified default Chrome session. A visible, isolated
native scrollbar control first verifies that the OS pointer bridge can drag a
thumb to half its track; this control is removed before the product observation.
For current engines with overlay scrollbars, the bridge hovers over the inside
edge before pressing the thumb and records the zero layout gutter. The probe
requires one real wheel input to place the native thumb below the gallery's toolbar hover
strip before programmatic navigation. That wheel is outside the takeover interval.
The probe requires two distinct moving frames after End, remaining distance,
an exposed scrollport hit target, and no completion before input,
then uses a task-owned, DPI-aware Windows input helper to drag the actual native
scrollbar gutter or exposed overlay edge while holding the mouse button. The
helper requires a unique
owned browser window, one visible UI Automation document, and agreement between
the document's physical rectangle and the native CSS viewport at the browser's
reported pixel ratio. The optional Chromium route uses a separate fixture tab
without a device viewport override and temporarily sizes its native window to
540×850; the original UI tab retains its 1280×800 and zoom checks. Firefox
uses a bounded 420×700 BiDi viewport. The
helper rejects ambiguous or offscreen mapping
instead of guessing. It records bounded native events, including gallery-capture
pointer and click targets, and the
existing opt-in product alignment/viewport decisions; it never dispatches a
synthetic scroll event or writes the scroll position. A height-only viewport
change checks the later layout guard. `native-scrollbar-takeover.json` and PNGs
retain both passing and failed observations. Programmatic ownership is inferred
from the product's user/programmatic timestamps and independent media markers;
native `scrollend` does not label its cancellation reason. This does not claim
that the ordinary `auto` scrollport always animates, or qualify delayed HTTP
response ordering, live X, or another browser/platform.


For the bounded #502 installed-Edge image recovery comparison, create the
ignored, exclusive `source-image-failures.json` selector:

```json
{"scenario":"source-image-failures"}
```

Use `--browser msedge --mode desktop --installation extension` through the
prepared-VM controller. This invokes the existing full-flow 404, empty and
corrupt image helper with unchanged fault bytes, selection, recovery, retry,
request and hit-target assertions. It retains
`focused-source-image-failures.json` on success or failure and owns its pages,
routes, listeners, extension profile and loopback cleanup. Other focused
selectors, upgrades and public URLs cannot share this run.

Optional `"trace": true` records bounded image/layout/scroll/rectangle and
hit-target observations from before the click. It also collects JSON-string
`xeg:gallery-scroll-trace` events while its owned `data-xeg-scroll-trace` marker
is armed. `VerticalImageItem` supplies `data-media-id`, `data-media-active` and
`data-media-focused` from its real media and role props. The collector resolves
active and focused indices independently from uniquely marked items, then maps
those and the selected index to media IDs. Toolbar indices are retained as
separate metadata: its `data-focused-index` represents displayed media and can
fall back to the active index when actual focus is null. Missing or ambiguous
item mappings report `identityValid: false`; no toolbar fallback supplies focus.
Identity validity is separate from `coverageComplete`, which describes only
observation of the assertion interval.

The current opt-in producers emit actual `viewport-decision` records from
`useVerticalGallery` and `align-done` after `useGalleryItemScroll` calls native
alignment. An accepted viewport payload includes its target `index` and the
independently read `currentIndex` and nullable `focusedIndex`; a target is not a
substitute for either identity. JSON payloads are collected without filling in
missing fields. The gate requires both independent indices to identify the
selected item and two stable frames with valid matching media identities.
The retained temporary source `4aba255` omitted those independent fields; its
records cannot qualify this corrected contract or be relabeled as a successful
ordering comparison. This is a current-source contract, not an exact historical
replay. Unarmed ordinary execution emits no diagnostic events. DOM observations
alone must not be described as direct product guard decisions.
Overflow remains a failure and the original visibility assertions still apply.
The observer remains active through the actual paint assertion intervals rather
than stopping five seconds after the click. Receipts identify each assertion's
start, unchanged five-second deadline, end, budget and coverage completeness,
plus the trace stop reason. A 15-second lifetime, 1,800 frame, 192 changed-state
sample and 512 product-event cap remain explicit. A bound or missing interval
makes diagnostic coverage incomplete, including when an assertion starts
before trace attachment; an early successful assertion need not consume its
whole deadline.

The diagnostic-only `"faultRelease": "after-initial-alignment"` option requires
`"trace": true` and the bound opt-in source producers. It holds only the first fault
response until the second viewport alignment and two stable observed frames;
missing probes, expiry or overflow fail. Retries and fault bodies remain
unchanged. This is one timing discriminator, not replacement acceptance or a
product wait. The diagnostic source revisions and the comparison findings are
recorded in [#502](https://github.com/PiesP/xcom-enhanced-gallery/issues/502).

For the late-index-0 layout transition and the same full three-fault contract,
use this exclusive input:

```json
{"scenario":"source-image-failures","trace":true,"lateIndex0":true}
```

This mode requires the unchanged generated JPEG fixtures. It holds the first
original responses for indices 0 and 2, while the selected index-1 fault is also
pending. After actual initial product alignment and stable matching identities,
it releases index 0. A trusted native 480×320 completion, semantic loaded state
and two subsequent stable frames must show matching pending/loaded row and
wrapper sizes, with the selected item still aligned while index 2 stays held.
The existing identity and geometric tolerances and trace-start + 5,000ms bound
remain in force. A new post-load alignment event is unnecessary when sizing
preserves the already aligned position; an observed anchor change requires an
eligible product-owned repair.

Once that transition passes, the helper releases index 2 and the unchanged
selected fault response, then executes the existing visibility/hit checks,
two retries, healthy-neighbor navigation and same-document healthy reopen for
404, empty and corrupt inputs. Each case records its initial/post-load layout,
native image events, relevant response hashes and owned cleanup in
`focused-source-image-failures.json`. The original five-second paint deadlines
remain separate from layout readiness. No assertion scroll, synthetic load or
viewport callback is used. This mode cannot share another fault-release
discriminator. A failed prerequisite or incomplete/overflowed observation is
a failure, not a successful ordering comparison or historical attribution.

A controlled event-order comparison requires its own fresh layout readiness,
accounting for index 0 and other fixture loads while neighbor index 2 stays
held. Identity-contract tests alone do not establish that condition or native
event order. A further pair is conditional on the remaining question recorded
in [#502](https://github.com/PiesP/xcom-enhanced-gallery/issues/502); the layout
acceptance mode does not automatically start one.

Keep original failures failed. Passing a new comparison does not establish the
cause of an older visibility failure. Remove only the task-owned selector after
the attempt; retain private evidence outside Git.

For focused installed Chrome/Edge extension verification of #499/#500 API
metadata reuse and response accounting, create the ignored, exclusive
`media-api-reuse.json` selector with exactly:

```json
{"scenario":"media-api-reuse"}
```

Run with `--installation extension` and no public `--live-url`. The route uses
the full flow's installed package, task-owned HTTPS loopback, three-photo quality
fixture, and unchanged `media-api-reuse-profile.ts` assertions. It retains
`api-reuse-observations.json` and `installation-result.json`, including failure
and cleanup outcomes. Other full-flow scenarios, live X, and the original
profile are outside this focused result. Remove only this task-owned selector
after the attempt.

For the focused #482 installed filename scenario, create ignored
`attachment-filenames.json` with exactly:

```json
{"scenario":"attachment-filenames"}
```

With `--installation extension`, this runs the owned A/B/C quote, DOM, ZIP,
conflict and failed-only recovery cycle in Chrome/Edge. Firefox uses its separate
focused installed filename, collision and notice fixture. With `--installation userscript`, it
runs a smaller manager-backed visible `/photo/2` save and checks the native
filename, source and bytes. Remove the selector after the attempt. The filename
cycle uses controlled fixtures. Extension runs may append separate public-status
observations with `--live-url`; the live observer does not save files.

For a diagnosis that must retain nonconforming native names and continue to the
public observation, add `"diagnosticOnly": true` to this selector. Only that
explicit mode records known CDN/active-control basenames without accepting
filename conformance. Default qualification requires intended XEG-only names and visible actual-name
reporting for browser filename overrides. Active controls use a distinct literal
basename and verify the native bytes; a completed mismatch never starts another save.

To qualify the reported photo's actual native save after gallery entry, use
the exclusive ignored `reported-live-filename.json` selector:

```json
{"scenario":"reported-live-filename"}
```

Use `--installation extension --browser chrome` with only
`--live-url https://x.com/yukurach/status/2118323627615785399`. This focused route uses the
ordinary image click without admission logpoints and captures the selected
MediaInfo and its preferred save URL during the real Download click. It
compares the original native file with an independent bounded GET of that
exact preferred source. The JSON receipt retains native IDs, original
basenames, requested/actual names, provenance, and the notice. Flat binary
copies satisfy the maintained evidence transport's filename restrictions.
A second explicit toolbar save runs after the download observers are removed;
all extension-owned native IDs are checked for duplicate saves. Each inspected
original and reference body is limited to 4 MiB. Original receipts and files
are inspected before any evidence copy. Generic live API/host diagnostics retain
their separate verdict;
this focused result does not qualify an authenticated session or the original
user's profile cause. Remove the selector after the attempt.

For the #495 Jeppi photo, use the same ignored selector with an explicit
task-owned target:

```json
{
  "scenario": "reported-live-filename",
  "target": {
    "pageUrl": "https://x.com/Jeppi_tan/status/2118423501095030841",
    "mediaBasename": "HWYmWugaUAAi_4m"
  }
}
```

Use that exact page as the sole `--live-url`. The explicit target also admits
installed Edge extension validation. With `--installation userscript` and an
unpacked reviewed Tampermonkey directory, the controlled fixture runs first,
then a fresh owned profile installs the same userscript through the manager UI
and visits the public page without fixture host mappings or certificate
exceptions. The live receipt records the installed sandbox's GM availability,
selected MediaInfo, actual native ID and file, and an independently fetched
original before comparing the requested and observed filename. After the first
file is retained, a distinct-byte sentinel occupies its next conflict name.
The repeat runs after the diagnostic breakpoints are removed and verifies that
both the original file and sentinel remain unchanged. The original user profile cause
remains outside this controlled scope.
The separate live phase stages its evidence outside the flat output folder.
After either success or failure, bounded regular files are copied under the
`userscript-live-` prefix and listed in `userscript-live-artifacts.json`.
If a copy cannot be verified, the task-owned stage is preserved and the run
fails before collection.

To check issue #484's video save format through the installed Chrome/Edge
extension, create the ignored `video-save-format.json` file here with exactly:

```json
{"scenario":"video-save-format"}
```

Run `vmctl.py` with `--installation extension` and no live URLs. This focused
owned fixture first denies the provider response and clicks a direct MP4 and
three unsupported or ambiguous DOM video sources. It then serves API-shaped
responses for a direct video, a video-encoded GIF, and conflicting or duplicate
format queries. The API rejection cases include a valid sibling photo to check
that the clicked video does not borrow its save. The scenario checks native MP4
filenames and bytes, mixed ZIP member names and contents, API response status,
and no gallery or native save for rejected sources. The source-bound receipt
and copied files are retained outside Git. This does not establish live X
behavior. Remove the selector after the attempt.

For explicit installed-extension acceptance on public X statuses, create the
ignored `live-acceptance.json` file here with exactly:

```json
{"scenario":"actual-site-acceptance"}
```

Pass up to three public `--live-url` status URLs: a two-to-four-image post, a
mixed image/video post for actual video navigation, and an image post with an
existing preceding status link for the post-close same-document navigation probe. The normal
installed fixture still runs first.
This selector enables bounded real toolbar downloads and settings changes only
in the task-owned profile; failed receipts are retained outside Git. Remove the
selector after the attempt. See `../README.md` for evidence and byte limits.

To run only the built userscript settings-persistence fixture, create the ignored
`settings-persistence.json` file in this directory with this exact content:

```json
{"scenario":"settings-persistence"}
```

The shared VM controller packages this directory with the source-bound artifact.
Remove the selector after the attempt. The artifact fixture intercepts GM
storage and localStorage on an owned X.com page and exercises language
denial/retry/reload plus schema preservation. It also rejects a fit-mode save
while Settings is closed, checks the toolbar unsaved cue, reopens Settings from
that cue, and verifies durable retry, including a delayed failure after Settings
closes. With
`--installation extension`, the same selector runs a focused installed-package
fixture for healthy language persistence/reload, controlled fit-mode storage
failures and retries, and unsupported-schema session edits/retry/raw preservation.
The installed fixture intercepts only the exact fit-mode keys in the extension
content script's primary and X-origin fallback storage paths. It checks healthy
primary and fallback saves, denial with Settings closed, and a delayed denial
after closing Settings. Neither mode establishes live X.com behavior or a
userscript-manager installation.

To run only the issue #381 opening-feedback fixture with the installed
Chrome/Edge extension, create the ignored `opening-feedback.json` file here:

```json
{"scenario":"opening-feedback"}
```

Run the VM browser validation with `--installation extension`. The fixture holds
the real provider response for five seconds, records the rendered pending state
and host playback, then checks fast opening, later A completion or failure after
B opens, navigation, and failure recovery. The failure case suppresses native
notifications and requires a persistent, dismissible source notice after the
held request settles. The result is a controlled installed
extension observation; it does not establish live X.com behavior. Remove this
selector after the attempt.

To run only the issue #383 gallery experience baseline in the installed
Chrome/Edge extension, create the ignored `gallery-experience.json` file:

```json
{"scenario":"gallery-experience"}
```

Run the VM browser validation with `--installation extension`. The focused
receipt `gallery-experience.json` separates toolbar keyboard and native save
actions (X02), native host video controls across click modes (X05), and mixed
aspect ratio layout with actual 200% browser tab zoom (X06).
The run also checks pointer and eligible `?` help, nested Escape, a 401×360
short viewport, and bounded theme, language, forced-colors and reduced-motion
states. `gallery-overview.png` and `gallery-constrained.png` are clean UI
captures from the English fixture for documentation review. The page and media
are deterministic owned fixtures; the observations do not claim live X.com
behavior or a human study. Remove the selector after the attempt.

To run only the issue #382 media and download recovery baseline in the installed
Chrome/Edge extension, create the ignored `media-download-recovery.json` file:

```json
{"scenario":"media-download-recovery"}
```

The focused run uses the three-item source-quality fixture. It records a
one-response display failure, persistent display failures, denied verified
originals, a partial ZIP after an injected byte limit, and a complete ZIP
failure followed by healthy acquisition. Native extension notifications are
suppressed only inside this owned run, so the retained screenshots show what
remains on the page after five seconds. ZIPs are checked against the fixture's
independent entry list and copied into the evidence directory. Remove the
selector after the attempt.

The same run also checks a bounded article-less tile with one original URL that
cannot be verified and an observed video tile. Each opens through the installed
extension after a real provider rejection; the rendered source details must
name the limited scope or quality. Verified API and article DOM fixtures must
remain free of limitation details. ZIP result reasons must be visible when their
native details control is opened.

To inspect opened help and source details with one bounded installed Edge profile,
create the ignored `ux-details.json` file here with exactly:

```json
{"scenario":"ux-details"}
```

Run with `--installation extension`, without live URLs, live acceptance, upgrade
inputs, or another focused selector. This case uses only the owned rapid-A post
fixture. A real provider 403 opens its one-image/one-video DOM recovery gallery.
It checks the opened source details and keyboard help in Korean at 401×592 and
English at actual 200% tab zoom, including native keys, visible controls, and
wheel ownership when a panel overflows. It also checks toolbar-focused Settings
and Help Escape against media-focused Escape while Help is open. Separate owned
source-quality documents produce a real native single-save failure in Korean at
401×360 and a partial ZIP with expanded details in English at actual 200% tab
zoom. The result probes measure positive panel and media overflow, real wheel
movement over text, controls, and the ZIP summary, top and bottom containment,
non-overflow containment, and normal media-wheel scrolling after dismissal.
The existing one-item, article-less source-limitation fixture checks notice
containment without notice overflow and records the media list's spacer, item,
and viewport geometry. The real gallery intentionally keeps its media list
scrollable with a last-item alignment spacer; the media-no-overflow branch is
covered by the focused synthetic regression, not claimed from this GUI case.
Each case keeps a receipt even when its assertion fails, so baseline and
candidate behavior can be compared without hiding the second panel. A fresh fixture document
returns HTTP 503 for the exact known video source after opening the gallery;
the terminal video alert must provide a canonical original-post link that a
trusted Enter key opens in a new owned fixture tab. Screenshots and request,
error, zoom, and cleanup observations remain in the private run output.
This is fixture evidence, not live X or screen-reader speech evidence. Remove
the selector after the attempt.

To run only the issue #392 failed-entry ZIP acceptance in the installed Edge
extension, create the ignored `failed-entry-recovery.json` file here:

```json
{"scenario":"failed-entry-recovery"}
```

Run with `--installation extension`. The installed package's gallery saves a
partial ZIP after one bounded fixture response denial. Its visible recovery
button then encounters HTTP 503 and resource-limit failures before native saving;
both explicit failures must retain recovery without a new native download.
The third explicit attempt saves only the omitted item in `-missing-3.zip`. The receipt
checks native download IDs, saved file identity, entry order, CRC, bytes, hashes,
request count, result dismissal, session reopening, and exact cleanup. Retain
failed receipts outside Git and remove the selector after the attempt.

After that campaign, two fresh owned-fixture sessions check #442's control meanings.
Each produces and byte-verifies a separate partial ZIP. The first holds a new
ordinary ZIP source through the native loopback: dismissing the previous result
must leave the new request running, and closing the gallery then aborts that
owned source. The second holds a missing-item recovery: the visible control must
say it cancels recovery and dismisses the result, and activating it must abort
the held source without a replacement native ZIP or a late result. The receipt
records the exact native events, download IDs, screenshots, and cleanup. This is
installed fixture evidence, not a claim about a live X.com transfer or disk
completion after a browser handoff.

For a focused current-X language/theme check, use the existing ignored
`live-acceptance.json` with exactly:

```json
{"scenario":"actual-site-settings-acceptance"}
```

Run with extension installation and one to three unchanged, currently qualified
public image status URLs. This selector exercises only the affected settings
fixture followed by language/theme selection, durable and fresh-document readback,
and exact prior preference restoration on X. It does not run the previous full
live download, keyboard, video or site-navigation campaign. Login, consent and
challenge prerequisites remain untouched; a missing prerequisite is blocked.
