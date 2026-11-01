# Optional Windows artifact fixture selector

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
The existing one-item, article-less source-limitation fixture checks wheel
containment when both the notice and the media list have no overflow.
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
