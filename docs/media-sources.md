# Media display and save sources

`MediaInfo.url` is the display source. `downloadSource` separately records the
preferred save URL, quality and API/DOM provenance. The renderer never replaces
the preferred save source when it displays another candidate. Single saves,
ZIP planning, filename extensions and the image download cache use the same
preferred source selector; display bytes cannot satisfy a different save URL.

| Extracted source | Display | Default save |
| --- | --- | --- |
| API ordinary CDN photo | Existing original-quality policy | Verified CDN original |
| DOM ordinary CDN photo | Observed image URL | Verified CDN original |
| Unverified photo | Observed image URL | Explicit original-source failure; no smaller substitute |
| API MP4 video or animated GIF | Existing best-MP4 policy | Preferred best MP4, independent of display recovery |
| DOM video with a direct MP4 source | Observed video URL | Observed MP4 URL, with the quality limitation disclosed |
| DOM video with a playlist, unknown format or conflicting format control | Host video remains outside the gallery | No admitted save source |
| Positively selected HLS-only API attachment | Unsupported-source diagnostic | Unavailable |

The pure normalizer accepts validated HTTPS `pbs.twimg.com/media/` photo
identities in extension, query-format or known legacy size forms. It preserves
encoded identity and other query data and is idempotent. Identical case-varied
control parameters collapse; conflicting duplicates, unknown formats/sizes,
credentials, non-default ports, fragments, foreign hosts, posters, cards and profile images
cannot establish an original. Rejected normalization does not authorize another
attachment. Default saves refuse unverified originals before requesting bytes.
ZIP results retain original-source and resource-limit causes together and
report honest successful/failed counts. No lower-quality photo save action is
implemented.

CDN-original means the CDN's original-size representation, not necessarily the
uploader's byte-identical file. Best MP4 means the highest-ranked validated MP4
provided for that attachment, not a claim about an unavailable upload source.

API MP4 candidates retain up to 32 distinct validated URLs in stable,
best-bitrate-first order. MIME, nonnegative safe-integer bitrate and dimensions
are recorded only when present or safely parsed from the URL path. Equal or
absent bitrates preserve source order. Query data and posters cannot supply
video dimensions. Click-time source evidence, requested/quoted owner separation,
stale-click checks and originating-post filename attribution still govern
selection; a candidate list is not a second owner-discovery mechanism.

The API video parser requires declared `video/mp4` metadata. Both API and DOM
video admission require a validated `video.twimg.com` URL with a direct `.mp4`
path and either no `format` control or one matching `format=mp4`; control names
are compared case-insensitively. After provider failure, DOM recovery applies
that same rule to the selected owner-local video URL.
A playlist, extensionless path, image path or contradictory/duplicate format
control is rejected before filename planning, so single-save and ZIP naming
cannot assign an image extension to the video. An ordinary image's supported
extensionless `?format=` URL remains eligible. This rule relies on the
direct-source URL contract; it does not inspect response MIME or relabel an
unknown container. Controlled installed evidence for the actual native name,
MP4 bytes and ZIP entries is tracked separately from these source rules.

## Attachment filenames

Single downloads and ZIP entries use the attachment's owning handle and post ID,
followed by a zero-based owner-local attachment number:
`{owningHandle}_{owningPostId}_{attachmentOrdinal}.{actualExtension}`.
The API establishes positions in the complete owner collection before filtering.
A complete note inline list with unique media IDs and nonnegative, unique integer
positions defines source order; otherwise entity array order defines it. Repeated,
conflicting, foreign or out-of-range navigation hints cannot override that order.
Collection-wide unique, in-range navigation links for the correct owner and
media kind may sort presentation later; they never change this source identity.

DOM recovery is a partial observation, even when an article contains several tiles.
A uniquely bound, same-owner `/photo/N` or `/video/N` link can establish a position;
a lone `/photo/2` remains attachment 1 regardless of visible tile count. Distinct
observed sources sharing a position, or one source with conflicting positions,
leave that position unknown. Equivalent representations can share an unambiguous
source-bound position. Sorting the gallery, opening A's quote of B, or filtering an
unavailable earlier attachment does not renumber B's attachments. A mixed-owner
ZIP keeps each entry's owner and attachment identity. Entry names are assigned
in input order before asynchronous work; the ZIP archive name follows the first
item in gallery order, independently of the active selection. Physical ZIP member
order is not an input-order service guarantee: known-size, already-owned or
cached Blobs may be read concurrently, and local headers and central-directory
entries follow their commit order. The ordinary gallery currently supplies a
Blob provider whose unknown-size work is admitted serially; no reordering has
been demonstrated in that path. Completion order does not change assigned names
or filename-to-byte pairing.

If DOM recovery sees only part of a post and has no unambiguous position link,
the filename uses `source-` plus a 16-digit hexadecimal key derived from the
validated CDN path. Display-size and query variants of one image share the key;
different sources are separated by a 64-bit hash rather than a DOM candidate
position. A hash collision remains theoretically possible, so this key does
not assert the missing original position or guarantee equality with an API
filename. This is an explicit nonnumeric fallback, not compliance with the normal
numeric filename format. The existing bounded, cancellation-aware API attempt is
the opportunity to recover complete owner metadata before DOM fallback; no extra
request or visible-subset renumbering fabricates an unknown position. Strict
numeric naming remains unavailable until complete owner metadata or an
unambiguous source-bound position is available. The selected item and preferred
save URL are unchanged by naming.

Validated photo extension/query spellings and all supported legacy sizes share
canonical source identity. Deduplication also retains encoding, owner and the
verified API entity ID (or otherwise the established ordinal). Duplicate `.jpg`
and `?format=jpg` representations of one entity collapse, while different verified
attachments or owners reusing one URL survive. A repeated API entity retains its
first source position; later source positions are not renumbered after removal.
WebP original recovery may change the save extension while preserving identity.

## DOM WebP originals

An extensionless DOM WebP can be a display encoding whose `name=orig` URL is
unavailable. DOM recovery confirms the first bounded set of originals before
returning the gallery; deferred items are checked when saved. A successful WebP
original remains WebP. Only HTTP 404 or 410 permits
checking JPEG, then PNG originals of the same validated attachment, preserving
the encoded identity, `name=orig`, and other query data. A candidate must return
HTTP 200 with its expected image MIME type at the exact requested URL.

The resolver uses bounded HEAD requests through the platform adapter and honors
extraction and save cancellation. Only same-source 404/410 responses for all
three encodings establish that the original is unavailable. A forbidden
response, redirect, MIME mismatch, network failure, timeout, or missing source
metadata leaves the result inconclusive and retryable. The
observed display, owner, attachment identity, and gallery order remain intact.
Single and ZIP plans receive the source-check outcome and derive extensions
from a verified preferred source. Resolution happens before any native save; it does not
retry or overwrite a completed transfer.

The extractor checks at most four distinct source URLs eagerly, giving the
clicked photo first access. A later photo remains pending, not unavailable.
Single save checks that photo on demand; ZIP checks all pending photos through
an operation-local queue with at most four active source probes. Shared URLs
reuse one probe result within the operation, while each media item keeps its
own post and attachment identity. A failed check can be retried by a later
explicit save, and cancellation does not retain a negative result. Source
selection precedes filename and ZIP planning, so a verified JPEG alternative
receives a JPEG filename. The existing byte and download concurrency limits
remain separate from the source-probe queue.

`resolveDomImageOriginal` in
[`dom-image-original.ts`](../src/shared/services/media-extraction/extractors/dom-image-original.ts)
owns probe scope and limits. The DOM extractor bounds concurrency and rechecks
the clicked source and owner after asynchronous work. Resolution observations
retain only candidate URLs, HTTP status, and normalized image MIME metadata.

## HLS feasibility decision

HLS playback and standalone HLS downloads are deferred. The current flow
preserves bounded HLS identity hints for matching an API-owned attachment, then
reports a healthy unsupported-source outcome when the clicked attachment has
no validated MP4. This is distinct from an API outage and suppresses DOM
substitution for that positively selected unsupported attachment.

A playlist references media segments and potentially initialization data;
saving its URL does not produce a standalone MP4. An HLS save implementation
would need segment acquisition and a verified playable output container.
[RFC 8216, sections 2–4](https://www.rfc-editor.org/rfc/rfc8216/#section-2)
defines the playlist and segment relationship.

Native support varies by browser and environment; MDN documents Safari support
and distinguishes desktop Firefox from Firefox for Android.
[Streaming audio and video](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Streaming#https_live_streaming)
was consulted on 2026-10-12. No installed Edge/Chromium HLS capability is claimed.
The runtime MIME/codec hint from
[MediaSource.isTypeSupported()](https://developer.mozilla.org/en-US/docs/Web/API/MediaSource/isTypeSupported_static)
does not prove that all segments will decode or that a saved file will play.
A library would add playlist selection and segment/playback machinery where
native playback is unavailable; it would not by itself establish a safe
standalone download or remove the browser/manager compatibility work.

Before implementing either path, validate playlist/segment origins, redirects,
range requests, credentials and CORS in each extension and userscript context;
rendition and audio/video track ownership for the selected attachment;
codec/MIME support in the actual browser; bounded segment count and shared
live-byte admission; cancellation and URL/transport release; and explicit
failure diagnostics. Require source-bound native-file byte and playback tests,
plus Firefox and userscript compatibility evidence. This change adds no HLS
engine, dependency, permission or unbounded fallback.

The [download ownership contract](download-memory.md) governs accepted binary
storage and handoffs. Deterministic installed Edge fixtures compare small
display payloads with original single-save and ZIP entry bytes; those fixtures
do not prove live-X authentication, DOM availability or production-CDN access.

## Saved filename boundary

Single-media, ZIP-entry and archive filenames use one final basename policy.
The validator bounds its output to 255 UTF-16 code units, without splitting a
Unicode surrogate pair. This is an application convention, not a universal
filesystem or UTF-8 byte limit. It replaces Windows-reserved punctuation,
ASCII controls (including NUL and newline), DEL and lone surrogates; trims
leading/trailing spaces and periods; and prefixes reserved device basenames
with `_`. The device list includes `CON`, `PRN`, `AUX`, `NUL`, `COM1`–`COM9`,
`LPT1`–`LPT9`, and the documented `COM`/`LPT` superscript-digit forms, with
or without an extension. These rules follow [Microsoft's file naming
guidance](https://learn.microsoft.com/en-us/windows/win32/fileio/naming-a-file).

Generated names reserve the verified media extension and post/attachment
identity before shortening the author or fallback prefix. ZIP duplicate
allocation reserves `-N` and compares each finalized basename without its final
extension, case-insensitively, while also retaining complete-name uniqueness.
Different formats cannot reuse one stem, including an already present `-1` name.
This generic caller boundary does not correct an invalid semantic ordinal.
Allocation is bounded by the names already reserved. If an overlong generated
identity cannot retain its collision counter, the plan fails before asynchronous
work or saving; ordinary X post IDs are not claimed to reach that synthetic limit.
Assigned names for failed entries with verified sources are reused exactly during
failed-only recovery. An unverified DOM original has no final assigned name:
its source and format are checked on explicit retry before planning its ZIP
entry. The supplementary ZIP reserves names already committed to prior archives,
so a late JPEG cannot rename a successful entry or collide with its stem.
A supplied legacy recovery plan with conflicting stems or noncanonical names is rejected before
saving rather than silently renamed. Supplementary archives reserve
`-missing[-N].zip` before truncation. Explicit caller-provided names retain up
to 32 UTF-16 units from the end of an overlong stem as a best-effort way to
keep a trailing identifier; arbitrary text in that tail is not treated as a
verified post or attachment identity. Reapplying finalization to an assigned
name is idempotent.

Ordinary extracted media currently starts with an empty filename and usually
produces short handle/post/ordinal names. The length, control-character and
device-name cases are supported utility and caller boundaries; no previous
Windows save failure is inferred from their unit tests. Parsed-ZIP tests cover
entry bytes, duplicate names and failed-entry recovery. These utility tests alone
do not verify native saved basenames or Windows filesystem behavior.

The Chrome extension passes the requested filename to the native download API.
For a completed direct download, the result keeps that request separate from the
native observed basename. `requestedFilename` comes from the request bound to the
actual native ID. Optional `observedFilename` and `filenameConforms` require an
exact download ID, original URL, and initiating extension match. Numeric ` (N)`
and `(N)` conflict suffixes are conforming; the prepared Windows runs observed
the spaced form in Chrome/Edge and the unspaced form in Firefox.
If native history is unavailable, the completed transfer remains complete and
the observed filename stays unknown. A mismatched basename does not start another
download or overwrite the saved file. A confirmed native basename is shown in a
polite in-gallery notice. A mismatch adds a separate explanation while the transfer
remains successful. Unknown native names keep the ordinary handoff status. The
notice can be dismissed and clears on the next download or gallery session.

Userscripts pass the generated name to the selected manager download API or a
Blob anchor's `download` attribute. Manager completion callbacks and anchor
dispatch do not expose the final native basename to the product; its observed
name remains unknown. Installed verification must inspect the original native
file independently. API selection and cancellation follow the
[transport contract](network-redirects.md); a manager setting alone does not
establish which product route executed.

### External filename interference

During manual reproduction on 2026-11-06, the user isolated
[FetchV 4.0.3](https://chromewebstore.google.com/detail/fetchv-video-downloader-f/nfmmmhanepmpifddlkkmihkalkoekpfd)
as the interfering extension: disabling it restored the generated filenames for
both the XEG extension and userscript. This identifies the cause in that tested
profile. The earlier reported profile was unavailable for the same comparison.
The filename-listener callback order was not captured. FetchV's own
[filename notice](https://v4.fetchv.net/announcement/en.html) describes native
download filename interference and its 4.0.3 protection logic; its stated intent
to change only its own downloads does not establish the original event sequence.
The user-confirmed workaround is to disable FetchV during XEG downloads.

In a controlled experiment, Chrome 156.0.8078.80, recorded revision
`fb096c0011f9d50f0a264a9376420cdea9c421e3`, reproduced CDN fallback with a
separate passive filename listener. Its [binding sends empty name/action values
for no suggestion](https://github.com/chromium/chromium/blob/fb096c0011f9d50f0a264a9376420cdea9c421e3/chrome/renderer/resources/extensions/downloads_custom_bindings.js).
The [internal API parses that action](https://github.com/chromium/chromium/blob/fb096c0011f9d50f0a264a9376420cdea9c421e3/chrome/browser/extensions/api/downloads_internal/downloads_internal_api.cc)
into the enum's absent value; [native arbitration treats it as non-default and
can clear the creator filename](https://github.com/chromium/chromium/blob/fb096c0011f9d50f0a264a9376420cdea9c421e3/chrome/browser/extensions/api/downloads/downloads_api.cc).
A scoped explicit XEG suggestion also lost to the later-installed helper in the
controlled run. XEG therefore preserves automatic native saving and reports the
actual result; it installs no filename-renaming listener and claims no priority
over other extensions. This version-specific experiment demonstrates a mechanism;
it is not a replay of FetchV 4.0.3 in the user's tested profile.

The userscript cancellation correction in
[#496](https://github.com/PiesP/xcom-enhanced-gallery/pull/496) addresses a
separate legacy-only API routing defect. A clean-profile baseline already saved
the requested name through the modern API, so that correction is not evidence
that XEG fixed the FetchV filename conflict.

## In-gallery limitations

A gallery recovered from an observed article or visible tile retains that
unknown-total scope for its own session. Its media details disclosure states
the collected-item count, without inventing the total number of attachments
in the post. The disclosure also follows the displayed item's preferred save
source: observed video quality, a pending image check, an inconclusive source
check, or an unavailable original remain visible in its summary.
Playback fallback does not change these save-source details. Complete API
collections add no warning solely because of their extraction path. An
article-local DOM observation cannot establish complete attachment coverage.
When the API reports a recognized unsupported entry alongside supported
entries, the gallery identifies the supported subset without treating the
parsed entry count as the post's raw attachment total. Supported items retain
their owner-local attachment ordinals, including gaps.
Closing or replacing a gallery clears the prior acquisition scope; navigating
to another item closes the disclosure and updates the current source details.
