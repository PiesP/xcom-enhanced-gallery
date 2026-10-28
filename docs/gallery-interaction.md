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
rules, and [video click policy](video-click-policy.md) owns click behavior.
[`GalleryContainer.tsx`](../src/shared/components/isolation/GalleryContainer.tsx)
owns opener focus restoration, while the lifecycle listener and focus tracker
remove their listeners and observers on cleanup. The maintained
[`keyboard-navigation.spec.ts`](../test/e2e/specs/keyboard-navigation.spec.ts)
exercises the rendered userscript flow; browser component tests and the Windows
profile cover their own narrower environments. Installed extension and live X
behavior require separate source-bound observations.

The correction keeps the existing displayed-index selector and gallery signal
commands as the common target policy. A narrow patch in each toolbar and keyboard
caller would repeat the rule and allow their no-op and page targets to diverge
again. A new command layer shared with video control would duplicate state and
lifecycle ownership for little gain: the existing selector already gives those
callers one displayed identity without coupling viewport observation to requested
navigation. Keeping the established commands also preserves their event, scroll,
and cleanup paths and lets the same browser regressions exercise every caller.

[`package.json`](../package.json) is the authority for the current TypeScript,
Solid, Vite Plus, Vitest, Playwright, and browser-core dependency versions;
[`tsconfig.base.json`](../tsconfig.base.json) owns strict TypeScript settings.
[`vite.config.ts`](../vite.config.ts) defines the build and verification tasks;
[`vitest.config.ts`](../vitest.config.ts) and its
[`after-policy` coverage entrypoint](../tooling/vitest.after-policy.config.ts)
select the maintained Node and Chromium Browser Mode lanes. The
userscript and installed Chrome Playwright lanes are configured in
[`playwright.config.ts`](../test/e2e/playwright.config.ts) and
[`playwright.extension.config.ts`](../test/e2e/playwright.extension.config.ts);
the Firefox and Windows lanes are routed by the package scripts. The prepared
Windows installed profile lives in
[`install-profile.ts`](../validation/windows/install-profile.ts). The consumed
[shared design](../packages/core/docs/DESIGN.md) and
[shortcut eligibility helper](../packages/core/src/design/shortcut.ts) define
shared eligibility; this product keeps native-control ownership here.
