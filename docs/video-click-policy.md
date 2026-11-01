# Video clicks and native playback

`gallery.videoClickMode` keeps its existing values and default. The setting is
part of persisted XEG gallery settings. Use **Settings → Video clicks** to select
the mode; saved enum values and migration behavior stay the same.

| Value                           | Video click behavior                                                                                                                                                                             |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `block-controls-only` (default) | **Open gallery from the video area.** Eligible video surfaces open the gallery; ordinary player controls stay in X.                                                                              |
| `block-all`                     | **Keep video clicks in X.** Video interactions stay in X, including videos without a marked player wrapper.                                                                                      |
| `allow-all`                     | **Also open from supported play buttons.** Eligible surfaces and validated unmarked play buttons may open the gallery. Ordinary player controls, sliders, links and unrelated actions stay in X. |

A button's padding, text and SVG icon use the same control boundaries. An image
or link does not become a video interaction because another video shares its post.
Classification does not establish media ownership: extraction still requires the
exact selected media and a supported source under the [media source policy](media-sources.md).

Opening the gallery creates a **separate paused player at the beginning**. It
uses the gallery's saved volume and mute settings. Closing the gallery does not
automatically resume playback in X. The gallery does not carry over X's current
position, playing state or audio settings. Existing
[same-gallery source recovery](media-video-loading.md) retains the gallery
player's current intent instead.

Extraction can take time or fail even when X's video is playing. While extraction
is pending, XEG does not pause the host. A failure reports its specific cause and
offers native-player recovery: use X's video play/pause controls to continue
watching, or press **Alt+Shift+V** after the failed video click to save `block-all`.
The shortcut is available for the current failure when settings are loaded,
ignores synthetic input and editable fields, and expires on a new media click,
close, navigation or cleanup. Change **Video clicks** in gallery settings to restore another
mode. XEG does not replay the intercepted click or replace an unconfirmed
video with a poster, a different attachment, or an unknown streaming source.

While the modal is mounted, XEG pauses host videos on opening, later playback,
and insertion of already-playing videos. Gallery-owned videos remain usable.
Closing, cleanup, or modeless renderer recovery removes suppression without
restarting host videos. X may independently replay its own player after close.
