# Gallery interaction ownership

The gallery keeps explicit navigation intent separate from the item observed in
the scrollport. `currentIndex` in
[`gallery.signals.ts`](../src/shared/state/signals/gallery.signals.ts) is the last
requested destination. `focusedIndex` is the viewport observation published by
[`use-gallery-focus-tracker.ts`](../src/features/gallery/hooks/use-gallery-focus-tracker.ts)
without issuing a navigation request. The displayed item is the valid focused
index, or the requested index when focus is unavailable; the toolbar counter,
post attribution and current-item download use that identity. Manual wheel
scrolling must not snap back to the requested index.

| Input | Owner | Effect |
| --- | --- | --- |
| Toolbar Previous/Next and gallery arrow keys | [`gallery.signals.ts`](../src/shared/state/signals/gallery.signals.ts) | Move relative to the displayed item and commit a requested destination. |
| Home/End and PageUp/PageDown | [`keyboard.ts`](../src/shared/utils/events/handlers/keyboard.ts) and gallery signals | Resolve an absolute or page target from the displayed item; a destination is redundant only when it is both displayed and already requested. |
| Manual scroll | [`focus-coordinator.ts`](../src/features/gallery/logic/focus-coordinator.ts) | Publish a new viewport observation without committing a navigation request or scrolling again. |
| Current-item download and video shortcut | [`use-gallery-download.ts`](../src/features/gallery/hooks/use-gallery-download.ts) and [`VerticalImageItem.tsx`](../src/features/gallery/components/vertical-gallery-view/VerticalImageItem.tsx) | Target only the displayed media identity. Video admission and programmatic scroll correction keep their separate lifecycle rules in [video loading](media-video-loading.md). |

The gallery's body capture listener in
[`gallery-lifecycle.ts`](../src/shared/utils/events/lifecycle/gallery-lifecycle.ts)
admits only trusted browser events. The shared shortcut guard determines whether
composition, an already-handled event, or editable content makes a global
shortcut ineligible. Product key ownership is narrower: focused native buttons,
links, form controls and nested panels keep their own keyboard behavior. In
particular, Space and Enter activate a focused button; Space on the gallery
media surface remains a playback command. The gallery can claim an eligible
navigation key only after checking the event's composed path and modifier
chord. [W3C button keyboard interaction](https://www.w3.org/WAI/ARIA/apg/patterns/button/#keyboard-interaction)
defines the native-control expectation.

[`VerticalGalleryView.tsx`](../src/features/gallery/components/vertical-gallery-view/VerticalGalleryView.tsx)
connects the toolbar and media items. The navigation event drives the owned
scroll effect. Focus observation, video visibility and playback recovery remain
separate; [video loading](media-video-loading.md) owns admission and pause/resume
rules. [`GalleryContainer.tsx`](../src/shared/components/isolation/GalleryContainer.tsx)
owns opener focus restoration, while the lifecycle listener and focus tracker
remove their listeners and observers on cleanup. The maintained
[`keyboard-navigation.spec.ts`](../test/e2e/specs/keyboard-navigation.spec.ts)
exercises the rendered userscript flow; browser component tests and the Windows
profile cover their own narrower environments. Installed extension and live X
behavior require separate source-bound observations.
