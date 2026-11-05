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

The API video parser admits a variant only when its declared MIME is
`video/mp4` and its validated `video.twimg.com` path ends in `.mp4`. After a
provider failure, DOM recovery admits only the selected owner-local video URL
with a direct `.mp4` path and no `format` control or one matching `format=mp4`.
A playlist, extensionless path, image path or contradictory/duplicate format
control yields no DOM media item for that click, so single-save and ZIP naming
cannot assign an image extension to the video. An ordinary image's supported
extensionless `?format=` URL remains eligible. The DOM rule relies on the
direct-source URL contract; it does not inspect response MIME or relabel an
unknown container. Controlled installed evidence for the actual native name,
MP4 bytes and ZIP entries is tracked separately from these source rules.

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

## In-gallery limitations

A gallery recovered only from the clicked visible tile retains that scope for
its own session. Its media details disclosure states the shown-item count,
without inventing the total number of attachments in the post. The disclosure
also follows the displayed item's preferred save source: observed video quality
and an unavailable verified image original remain visible in its summary.
Playback fallback does not change these save-source details. Complete API and
verified DOM collections add no warning solely because of their extraction path.
Closing or replacing a gallery clears the prior acquisition scope; navigating
to another item closes the disclosure and updates the current source details.
