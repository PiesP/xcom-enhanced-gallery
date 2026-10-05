# Authenticated X layout captures

Each HTML file is the exact, complete `html` field of its namesake entry in a
bounded sanitized capture record, except `video-surface-controls.html`, which
is the `video-click-observed` record's `capture.html` for the
`block-controls-only` mode. Capture provenance:

| Record | Fixtures | UTC capture time |
| --- | --- | --- |
| `edge-shapes2/output/sanitized-captures.json` | `timeline-image`, `card`, `detail`, `reply` | 2026-10-05 13:04–13:05 |
| `edge-shapes3/output/sanitized-captures.json` | `inline-multi-media`, `native-viewer-carousel`, `timeline-after-mutation` | 2026-10-05 13:25 |
| `edge-shapes5/output/sanitized-captures.json` | `quote`, `profile-media-tile` | 2026-10-05 13:35 |
| `edge-bounded-states/output/sanitized-captures.json` | `video-before-interaction`, `video-after-native-interaction`, `x-article-media-ancestry` | 2026-10-05 13:37 |
| `edge-live-hit/output/live-acceptance.json` | `video-surface-controls` | Not separately stamped in the record |

The captures came from an authenticated X session in Microsoft Edge
154.0.4258.53 on Windows 11 Pro 26300. The X UI language was Korean and the
viewport was 1912 × 901. Other extensions were disabled for the `edge-shapes`
and `edge-bounded-states` captures, and XCOM was not enabled in those captures.
The `edge-live-hit` record was collected with the Chrome MV3 unpacked XCOM
extension 2.3.3 enabled in Edge. The repository source at capture was
`09b0b6734618ef25d58f5a73e1d2a3e13ea9b03c`.

The capture replaced author and post IDs, media URLs, unknown test IDs, and
private content with synthetic values. It contains no downloaded media,
authentication material, storage data, or original page text. The click tests
dispatch synthetic events to nested elements present in these captured shapes.
The original image click's separately captured event target was the inline
`tweetPhoto` image; these tests do not claim that their events are live clicks.

The fixtures cover an inline photo, two-photo inline row, native viewer
carousel, timeline after an observed DOM mutation, profile tile, detail card,
quote photos, pre-player and playing video surfaces, an X Article image
ancestry, and a reply without body media. The detail capture contains an
external card image but no body photo, so its test verifies native card routing.
The video states were observed in the same X context: before interaction the
video had `readyState=0`, was paused, had width zero, and displayed a poster;
after the native interaction it had `readyState=4`, was playing, had width
1280, and exposed two sliders. These state observations are separate from the
sanitized HTML. The 12-element X Article fixture retains the path through nine
ancestor levels to `twitterArticleReadView` while omitting sibling subtrees;
it proves the image's guarded context, not the full Article layout.

The inline row has Korean previous/next controls but no
`aria-roledescription="carousel"`; the native viewer has that role description
and `swipe-to-dismiss` descendants. The tests verify that these layouts stay
distinct without a selector change. The captured viewer is a bounded subtree;
native movement of its controls and live click outcomes require browser
evidence. These DOM fixture tests do not prove actual video playback or
downloaded bytes; both require separate live evidence.
