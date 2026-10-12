# Video clicks and native playback

`gallery.videoClickMode` keeps its existing values and default. The setting is
part of persisted XEG gallery settings. Use **Settings → Video clicks** to select
the mode; saved enum values and migration behavior stay the same.

| Value | English | 한국어 | 日本語 |
| --- | --- | --- | --- |
| `block-controls-only` (default) | Eligible media surfaces open the gallery; native controls stay native. | 미디어 영역을 누르면 갤러리가 열리고, 재생 컨트롤은 X에서 동작합니다. | メディア領域からギャラリーを開き、再生コントロールはXで動作します。 |
| `block-all` | Video interactions stay in X, including videos without a marked player wrapper. | 플레이어 표시가 없는 동영상을 포함해 동영상 클릭은 X에서 동작합니다. | プレーヤーの識別情報がない動画を含め、動画の操作はXで動作します。 |
| `allow-all` | Eligible surfaces and bounded unmarked video buttons may open the gallery. Recognized player controls, sliders, links and unrelated actions stay native. | 미디어 영역과 확인된 일부 미표시 동영상 버튼에서 갤러리를 열 수 있습니다. 인식된 재생 컨트롤, 슬라이더, 링크와 관련 없는 동작은 X에서 처리합니다. | メディア領域と確認済みの一部の未識別動画ボタンからギャラリーを開けます。識別済みの再生コントロール、スライダー、リンクと無関係な操作はXで処理します。 |

A button's padding, text and SVG icon use the same control boundaries. An image
or link does not become a video interaction because another video shares its post.
Classification does not establish media ownership: extraction still requires the
exact selected media and a supported source under the [media source policy](media-sources.md).

Opening creates a separate, paused player at the beginning, using XEG's saved
volume and mute preferences. It does not transfer X's playback position, playing
state, volume or mute. Continuing from the host's position would be a separate
enhancement. Existing [same-gallery source recovery](media-video-loading.md)
retains that gallery player's current intent instead.

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
