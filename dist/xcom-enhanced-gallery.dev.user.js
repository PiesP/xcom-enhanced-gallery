// ==UserScript==
// @name         X.com Enhanced Gallery (Dev)
// @namespace    https://github.com/PiesP/xcom-enhanced-gallery
// @version      1.0.0-dev.2025.12.08.02.2
// @description  Media viewer and download functionality for X.com
// @author       PiesP
// @license      MIT
// @match        https://*.x.com/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_download
// @grant        GM_notification
// @grant        GM_xmlhttpRequest
// @connect      pbs.twimg.com
// @connect      video.twimg.com
// @connect      api.twitter.com
// @run-at       document-idle
// @noframes
// ==/UserScript==
(function(){try{var s=document.getElementById('xeg-styles');if(s)s.remove();s=document.createElement('style');s.id='xeg-styles';s.textContent=":where(.Button-module__unifiedButton__ML2Al){transition:var(--xeg-transition-interaction-fast)}.Button-module__unifiedButton__ML2Al{background:transparent;border:.0625rem solid transparent;border-radius:var(--xeg-radius-md);color:inherit;cursor:pointer;font-family:var(\n    --xeg-font-family-ui,-apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,sans-serif\n  );font-weight:var(--xeg-font-weight-medium);text-decoration:none;-webkit-user-select:none;-moz-user-select:none;user-select:none;&:focus-visible{border-color:var(--xeg-focus-indicator-color,var(--xeg-color-border-primary));z-index:1}&:disabled{cursor:not-allowed;opacity:var(--xeg-button-disabled-opacity,var(--xeg-opacity-disabled));transform:none}}.Button-module__size-sm__Y3P43{border-radius:var(--xeg-radius-sm);font-size:var(--xeg-font-size-sm);min-height:var(--xeg-size-button-sm);padding:var(--xeg-spacing-xs) var(--xeg-spacing-sm)}.Button-module__size-md__jqs0k{font-size:var(--xeg-font-size-base);min-height:var(--xeg-size-button-md);padding:var(--xeg-spacing-sm) var(--xeg-spacing-md)}.Button-module__size-lg__mD-hg{border-radius:var(--xeg-radius-lg);font-size:var(--xeg-font-size-lg);min-height:var(--xeg-size-button-lg);padding:var(--xeg-spacing-md) var(--xeg-spacing-lg)}.Button-module__variant-primary__XTTN4{background:var(--color-primary);border-color:var(--color-primary);color:var(--color-text-inverse)}.Button-module__variant-primary__XTTN4:hover:not(:disabled){background:var(--color-primary-hover);border-color:var(--color-primary-hover);transform:translateY(var(--xeg-button-lift))}.Button-module__variant-primary__XTTN4:active:not(:disabled){transform:translateY(0)}.Button-module__variant-secondary__wcXum{background:var(--xeg-color-neutral-100);border-color:var(--xeg-color-border-primary);color:var(--xeg-color-text-primary)}.Button-module__variant-secondary__wcXum:hover:not(:disabled){background:var(--xeg-color-neutral-200);border-color:var(--xeg-color-border-hover);transform:translateY(var(--xeg-button-lift))}.Button-module__variant-secondary__wcXum:active:not(:disabled){background:var(--xeg-color-neutral-100);transform:translateY(0)}.Button-module__variant-outline__JVluG{background:transparent;border-color:var(--xeg-color-border-primary);color:var(--xeg-color-text-primary)}.Button-module__variant-outline__JVluG:hover:not(:disabled){background:var(--xeg-color-neutral-100);border-color:var(--xeg-color-border-hover);transform:translateY(var(--xeg-button-lift))}.Button-module__variant-outline__JVluG:active:not(:disabled){background:var(--xeg-color-neutral-200);transform:translateY(0)}.Button-module__variant-ghost__d7MSS{background:transparent;border-color:transparent;color:var(--xeg-color-text-secondary)}.Button-module__variant-ghost__d7MSS:hover:not(:disabled){background:var(--xeg-color-neutral-100);color:var(--xeg-color-text-primary);transform:translateY(var(--xeg-button-lift))}.Button-module__variant-ghost__d7MSS:active:not(:disabled){background:var(--xeg-color-neutral-200);transform:translateY(0)}.Button-module__variant-danger__Pv532{background:var(--color-error);border-color:var(--color-error);color:var(--color-text-inverse)}.Button-module__variant-danger__Pv532:hover:not(:disabled){background:var(--color-error-hover);border-color:var(--color-error-hover);transform:translateY(var(--xeg-button-lift))}.Button-module__variant-danger__Pv532:active:not(:disabled){transform:translateY(0)}.Button-module__variant-icon__MR3gN{aspect-ratio:1;background:transparent;border-color:var(--xeg-color-border-primary);color:var(--xeg-color-text-secondary);padding:var(--xeg-spacing-sm)}.Button-module__variant-icon__MR3gN:hover:not(:disabled){background:var(--xeg-color-neutral-100);border-color:var(--xeg-color-border-hover);color:var(--xeg-color-text-primary);transform:translateY(var(--xeg-button-lift))}.Button-module__variant-icon__MR3gN:active:not(:disabled){background:var(--xeg-color-neutral-200);transform:translateY(0)}:where(.Button-module__variant-toolbar__Wgf7L,.Button-module__variant-navigation__pJyyf,.Button-module__variant-action__1sT0p,.Button-module__size-toolbar__GJYIU){aspect-ratio:1;height:var(--xeg-button-square-size,var(--xeg-size-button-md));min-height:var(--xeg-button-square-size,var(--xeg-size-button-md));min-width:var(--xeg-button-square-size,var(--xeg-size-button-md));padding:var(--xeg-button-square-padding,.5em);width:var(--xeg-button-square-size,var(--xeg-size-button-md))}.Button-module__variant-toolbar__Wgf7L{background:transparent;border-color:var(--xeg-color-border-primary);color:var(--xeg-color-text-primary)}.Button-module__variant-toolbar__Wgf7L:hover:not(:disabled){background:var(--xeg-color-neutral-100);border-color:var(--xeg-color-border-hover);transform:translateY(var(--xeg-button-lift))}.Button-module__variant-toolbar__Wgf7L:active:not(:disabled){background:var(--xeg-color-neutral-200);transform:translateY(0)}.Button-module__variant-navigation__pJyyf{background:var(--xeg-color-primary);border-color:var(--xeg-color-primary);color:var(--color-text-inverse)}.Button-module__variant-navigation__pJyyf:hover:not(:disabled){background:var(--color-primary-hover);border-color:var(--color-primary-hover);transform:translateY(var(--xeg-button-lift))}.Button-module__variant-navigation__pJyyf:active:not(:disabled){transform:translateY(0)}.Button-module__variant-action__1sT0p{background:var(--xeg-color-success);border-color:var(--xeg-color-success);color:var(--color-text-inverse)}.Button-module__variant-action__1sT0p:hover:not(:disabled){background:var(--color-success-hover);border-color:var(--color-success-hover);transform:translateY(var(--xeg-button-lift))}.Button-module__variant-action__1sT0p:active:not(:disabled){transform:translateY(0)}.Button-module__size-toolbar__GJYIU{--xeg-button-square-size:var(--xeg-size-button-md);--xeg-button-square-padding:0.5em;font-size:.875em}.Button-module__iconOnly__G-IyA{--xeg-icon-only-size:var(--xeg-size-button-md);aspect-ratio:1;height:var(--xeg-icon-only-size);min-height:var(--xeg-icon-only-size);min-width:var(--xeg-icon-only-size);padding:var(--xeg-spacing-sm);width:var(--xeg-icon-only-size)}.Button-module__iconOnly__G-IyA.Button-module__size-sm__Y3P43{--xeg-icon-only-size:var(--xeg-size-button-sm);padding:var(--xeg-spacing-xs)}.Button-module__iconOnly__G-IyA.Button-module__size-md__jqs0k{--xeg-icon-only-size:var(--xeg-size-button-md)}.Button-module__iconOnly__G-IyA.Button-module__size-lg__mD-hg{--xeg-icon-only-size:var(--xeg-size-button-lg);padding:var(--xeg-spacing-md)}.Button-module__intent-primary__-KgDr{border-color:var(--color-primary);color:var(--color-primary)}.Button-module__intent-primary__-KgDr:hover:not(:disabled){background:var(--color-info-bg);border-color:var(--color-primary-hover)}.Button-module__intent-success__eahy8{border-color:var(--color-success);color:var(--color-success)}.Button-module__intent-success__eahy8:hover:not(:disabled){background:var(--color-success-bg);border-color:var(--color-success-hover)}.Button-module__intent-danger__gdE-1{border-color:var(--color-error);color:var(--color-error)}.Button-module__intent-danger__gdE-1:hover:not(:disabled){background:var(--color-error-bg);border-color:var(--color-error-hover)}.Button-module__intent-neutral__CsRJH{border-color:var(--xeg-color-neutral-400);color:var(--xeg-color-text-secondary)}.Button-module__intent-neutral__CsRJH:hover:not(:disabled){background:var(--xeg-color-neutral-100);border-color:var(--xeg-color-neutral-500)}.Button-module__loading__KSzjx{cursor:wait;opacity:.8;pointer-events:none}.Button-module__disabled__ez-qT{cursor:not-allowed;opacity:var(--xeg-button-disabled-opacity,var(--xeg-opacity-disabled));transform:none}.Button-module__spinner__1zBS-{--xeg-spinner-size:1em;--xeg-spinner-track-color:transparent;--xeg-spinner-indicator-color:currentColor;margin-right:var(--xeg-spacing-xs)}@media (prefers-reduced-motion:reduce){.Button-module__spinner__1zBS-{animation:none}.Button-module__unifiedButton__ML2Al:hover:not(:disabled){transform:none}}.SettingsControls-module__body__eEJgF{display:flex;flex-direction:column;gap:var(--xeg-settings-gap);padding:var(--xeg-settings-padding)}.SettingsControls-module__bodyCompact__rFOgM{gap:var(--space-sm)}.SettingsControls-module__setting__qGIrM{display:flex;flex-direction:column;gap:var(--xeg-settings-control-gap)}.SettingsControls-module__settingCompact__OzkTl{gap:var(--space-xs)}.SettingsControls-module__label__u4OMs{color:var(--xeg-color-text-primary);font-size:var(--xeg-settings-label-font-size);font-weight:var(--xeg-settings-label-font-weight)}.SettingsControls-module__compactLabel__G-pHG{color:var(--xeg-color-text-secondary);font-size:var(--font-size-xs);letter-spacing:.04em;text-transform:uppercase}.SettingsControls-module__select__JsQ4a{background-color:var(--xeg-toolbar-panel-surface,var(--xeg-toolbar-surface));border:var(--border-width-thin) solid var(--xeg-toolbar-border);border-radius:var(--xeg-radius-md);color:var(--xeg-color-text-primary);cursor:pointer;font-size:var(--xeg-settings-select-font-size);line-height:1.375;min-height:2.5em;overflow:visible;padding:var(--xeg-settings-select-padding);transform:none;transition:border-color var(--xeg-duration-fast) var(--xeg-ease-standard),background-color var(--xeg-duration-fast) var(--xeg-ease-standard);width:100%}.SettingsControls-module__select__JsQ4a:hover{background-color:var(--xeg-toolbar-panel-surface,var(--xeg-toolbar-surface));border-color:var(--xeg-color-border-hover)}.SettingsControls-module__select__JsQ4a:focus,.SettingsControls-module__select__JsQ4a:focus-visible{border-color:var(--xeg-focus-indicator-color,var(--xeg-color-border-hover))}.SettingsControls-module__select__JsQ4a option{line-height:1.5;padding:.5em .75em}.Toolbar-module__toolbarButton__35EsR{background:var(\n    --toolbar-surface-base,var(--xeg-toolbar-panel-surface,var(--xeg-toolbar-surface))\n  );border-radius:var(--xeg-radius-md);color:var(--xeg-toolbar-text-color,var(--xeg-color-text-primary));cursor:pointer;font-size:.875em;font-weight:500;overflow:clip;position:relative;--toolbar-button-accent:var(--toolbar-surface-border,var(--xeg-toolbar-border));--toolbar-button-accent-hover:var(--xeg-color-border-hover);--toolbar-button-focus-border:var(\n    --xeg-focus-indicator-color,var(--toolbar-button-accent-hover)\n  );border:var(--border-width-thin) solid var(--toolbar-button-accent,var(--xeg-toolbar-border));transition:var(--xeg-transition-surface-fast),transform var(--xeg-duration-fast) var(--xeg-ease-standard)}.Toolbar-module__toolbarButton__35EsR:focus,.Toolbar-module__toolbarButton__35EsR:focus-visible{border-color:var(--toolbar-button-focus-border)}.Toolbar-module__galleryToolbar__O-JUs{--toolbar-surface-base:var(--xeg-toolbar-panel-surface,var(--xeg-toolbar-surface));--toolbar-surface-border:var(--xeg-toolbar-border);--xeg-button-disabled-opacity:1;align-items:center;background:var(--toolbar-surface-base);border:none;border-radius:var(--xeg-radius-lg);color:var(--xeg-toolbar-text-color,var(--xeg-color-text-primary));display:var(--toolbar-display,inline-flex);gap:0;height:3em;justify-content:space-between;left:50%;opacity:var(--toolbar-opacity,1);overscroll-behavior:contain;padding:.5em 1em;pointer-events:var(--toolbar-pointer-events,auto);position:fixed;top:1.25em;transform:translateX(-50%);transition:var(--xeg-transition-elevation-normal);-webkit-user-select:none;-moz-user-select:none;user-select:none;visibility:var(--toolbar-visibility,visible);z-index:var(--xeg-z-toolbar)}.Toolbar-module__galleryToolbar__O-JUs[data-settings-expanded=true],.Toolbar-module__galleryToolbar__O-JUs[data-tweet-panel-expanded=true]{border-radius:var(--xeg-radius-lg) var(--xeg-radius-lg) 0 0}.Toolbar-module__galleryToolbar__O-JUs:not([data-state]),.Toolbar-module__galleryToolbar__O-JUs[data-state=downloading],.Toolbar-module__galleryToolbar__O-JUs[data-state=error],.Toolbar-module__galleryToolbar__O-JUs[data-state=idle],.Toolbar-module__galleryToolbar__O-JUs[data-state=loading]{--toolbar-opacity:1;--toolbar-pointer-events:auto;--toolbar-visibility:visible;--toolbar-display:inline-flex}.Toolbar-module__toolbarContent__jUEEl{align-items:center;display:flex;justify-content:center;max-width:100%;overflow:hidden;width:100%}.Toolbar-module__toolbarControls__Vpuk7{align-items:center;display:flex;flex-wrap:wrap;gap:var(--space-xs);justify-content:center;width:100%}.Toolbar-module__toolbarControls__Vpuk7>*{flex:0 0 auto}.Toolbar-module__counterBlock__Kr2Ho{align-items:center;display:flex;justify-content:center;min-width:5em;padding-inline:var(--space-sm)}.Toolbar-module__separator__vIo-Y{color:var(--xeg-toolbar-text-muted,var(--xeg-color-text-primary));margin:0 .125em}:where(.Toolbar-module__toolbarButton__35EsR[data-active=true],.Toolbar-module__toolbarButton__35EsR[data-selected=true]){border-color:var(--toolbar-button-accent-hover)}.Toolbar-module__toolbarButton__35EsR[data-loading=true]{--button-opacity:0.7;--button-transform:scale(0.95)}.Toolbar-module__toolbarButton__35EsR[data-disabled=true]{--button-opacity:0.5;color:var(--xeg-toolbar-text-muted,var(--xeg-color-neutral-400));cursor:not-allowed}@media (hover:hover){.Toolbar-module__toolbarButton__35EsR:hover:not([data-disabled=true]){border-color:var(--toolbar-button-accent-hover);transform:translateY(var(--xeg-button-lift))}}:where(.Toolbar-module__toolbarButton__35EsR.Toolbar-module__primary__r-TUg,.Toolbar-module__downloadCurrent__Pw8W3){--toolbar-button-accent:var(--xeg-color-primary);--toolbar-button-accent-hover:var(--xeg-color-primary-hover);--toolbar-button-focus-border:var(--xeg-color-primary-hover)}:where(.Toolbar-module__toolbarButton__35EsR.Toolbar-module__success__q3VhV,.Toolbar-module__downloadAll__vbMYo){--toolbar-button-accent:var(--xeg-color-success);--toolbar-button-accent-hover:var(--xeg-color-success-hover);--toolbar-button-focus-border:var(--xeg-color-success-hover)}:where(.Toolbar-module__toolbarButton__35EsR.Toolbar-module__danger__gnomQ,.Toolbar-module__closeButton__l-JAZ){--toolbar-button-accent:var(--xeg-color-error);--toolbar-button-accent-hover:var(--xeg-color-error-hover);--toolbar-button-focus-border:var(--xeg-color-error-hover)}.Toolbar-module__mediaCounterWrapper__Hsyde{box-sizing:border-box;gap:0;min-height:2.5em;min-width:5em;padding-bottom:.5em;position:relative}.Toolbar-module__mediaCounter__41sx5{background:transparent;border:none;border-radius:var(--xeg-radius-md);color:var(--xeg-toolbar-text-color,var(--xeg-color-text-primary));font-size:var(--xeg-font-size-md);font-weight:600;line-height:1;padding:.25em .5em;text-align:center;white-space:nowrap}.Toolbar-module__currentIndex__9uqAk{font-weight:700}.Toolbar-module__currentIndex__9uqAk,.Toolbar-module__totalCount__iGFLl{color:var(--xeg-toolbar-text-color,var(--xeg-color-text-primary))}.Toolbar-module__progressBar__qXrXa{background:var(--xeg-toolbar-progress-track,var(--xeg-color-neutral-200));border-radius:var(--xeg-radius-sm);bottom:.125em;height:.125em;left:50%;overflow:clip;position:absolute;transform:translateX(-50%);width:3.75em}.Toolbar-module__progressFill__90aQN{background:var(--xeg-toolbar-text-color,var(--xeg-color-text-primary));border-radius:var(--xeg-radius-sm);height:100%;transform-origin:left;transition:var(--xeg-transition-width-normal);width:100%}.Toolbar-module__fitButton__bNT4p,button.Toolbar-module__fitButton__bNT4p{pointer-events:auto;position:relative;transition:var(--xeg-transition-interaction-fast);z-index:10}.Toolbar-module__fitButton__bNT4p[data-selected=true]{--toolbar-button-accent-hover:var(--xeg-color-primary);--toolbar-button-focus-border:var(--xeg-color-primary-hover)}.Toolbar-module__fitButton__bNT4p:focus,.Toolbar-module__fitButton__bNT4p:focus-visible{border-color:var(--toolbar-button-focus-border,var(--xeg-color-border-hover))}.Toolbar-module__downloadButton__m841I{position:relative}@media (prefers-reduced-transparency:reduce){.Toolbar-module__galleryToolbar__O-JUs,[data-theme=dark] .Toolbar-module__galleryToolbar__O-JUs{background:var(--xeg-toolbar-panel-surface,var(--xeg-toolbar-surface))}}@media (prefers-reduced-motion:reduce){.Toolbar-module__closeButton__l-JAZ:hover:not(:disabled),.Toolbar-module__downloadButton__m841I:hover:not(:disabled),.Toolbar-module__fitButton__bNT4p:hover,.Toolbar-module__toolbarButton__35EsR:hover:not(:disabled){transform:none}}:where(.Toolbar-module__settingsPanel__J99-k,.Toolbar-module__tweetPanel__KvY5r){background:var(\n    --toolbar-surface-base,var(--xeg-toolbar-panel-surface,var(--xeg-toolbar-surface))\n  );border-radius:0 0 var(--xeg-radius-lg) var(--xeg-radius-lg);border-top:var(--border-width-thin) solid var(--toolbar-surface-border,var(--xeg-toolbar-border));display:flex;flex-direction:column;gap:var(--space-md);left:0;max-height:var(--xeg-toolbar-panel-max-height);opacity:0;overflow:hidden;overscroll-behavior:contain;padding:var(--space-md);pointer-events:none;position:absolute;right:0;top:100%;transform:translateY(-.5em);transition:var(--xeg-toolbar-panel-transition),transform var(--xeg-duration-normal) var(--xeg-ease-standard),visibility 0s var(--xeg-duration-normal);visibility:hidden;width:100%;will-change:transform,opacity;z-index:var(--xeg-z-toolbar-panel)}.Toolbar-module__settingsPanel__J99-k{height:var(--xeg-toolbar-panel-height)}.Toolbar-module__tweetPanel__KvY5r{min-height:var(--xeg-toolbar-panel-height)}:where(.Toolbar-module__settingsPanel__J99-k,.Toolbar-module__tweetPanel__KvY5r)[data-expanded=true]{border-top-color:var(--toolbar-surface-border,var(--xeg-toolbar-border));height:auto;opacity:1;pointer-events:auto;transform:translateY(0);transition:var(--xeg-toolbar-panel-transition),transform var(--xeg-duration-normal) var(--xeg-ease-standard),visibility 0s 0s;visibility:visible;z-index:var(--xeg-z-toolbar-panel-active)}.Toolbar-module__tweetPanelBody__jGM-3{display:flex;flex-direction:column;gap:var(--space-sm)}.Toolbar-module__tweetContent__-9fJN{background:var(\n    --toolbar-surface-base,var(--xeg-toolbar-panel-surface,var(--xeg-toolbar-surface))\n  );border:var(--border-width-thin) solid var(--toolbar-surface-border,var(--xeg-toolbar-border));border-radius:var(--xeg-radius-md);color:var(--xeg-toolbar-text-color,var(--xeg-color-text-primary));font-size:var(--xeg-font-size-md);line-height:1.5;padding:var(--space-sm);white-space:pre-wrap;word-wrap:break-word;cursor:text;max-height:15em;overflow-y:auto;overscroll-behavior:contain;transition:var(--xeg-transition-surface-fast);-moz-user-select:text;user-select:text;-webkit-user-select:text}.Toolbar-module__tweetContent__-9fJN::-webkit-scrollbar{width:.5em}.Toolbar-module__tweetContent__-9fJN::-webkit-scrollbar-track{background:var(--xeg-toolbar-scrollbar-track,var(--xeg-color-neutral-200));border-radius:var(--xeg-radius-sm)}.Toolbar-module__tweetContent__-9fJN::-webkit-scrollbar-thumb{background:var(--xeg-toolbar-scrollbar-thumb,var(--xeg-color-neutral-400));border-radius:var(--xeg-radius-sm)}.Toolbar-module__tweetContent__-9fJN::-webkit-scrollbar-thumb:hover{background:var(--xeg-toolbar-element-bg-strong,var(--xeg-color-neutral-500))}:where(.Toolbar-module__tweetLink__C62D4,.Toolbar-module__tweetContent__-9fJN a){color:var(--xeg-color-primary);cursor:pointer;overflow-wrap:break-word;text-decoration:none;transition:color var(--xeg-duration-fast) var(--xeg-ease-standard),background-color var(--xeg-duration-fast) var(--xeg-ease-standard)}:where(.Toolbar-module__tweetLink__C62D4,.Toolbar-module__tweetContent__-9fJN a):hover{color:var(--xeg-color-primary-hover);text-decoration:underline}:where(.Toolbar-module__tweetLink__C62D4,.Toolbar-module__tweetContent__-9fJN a):focus,:where(.Toolbar-module__tweetLink__C62D4,.Toolbar-module__tweetContent__-9fJN a):focus-visible{background:var(--xeg-toolbar-element-bg-strong,var(--xeg-color-neutral-200));border-radius:var(--xeg-radius-xs);color:var(--xeg-color-primary-hover)}:where(.Toolbar-module__tweetLink__C62D4,.Toolbar-module__tweetContent__-9fJN a):active{color:var(--xeg-color-primary-active)}@layer base, components, utilities;.VerticalGalleryView-module__xegVerticalGalleryContainer__9hTS1{contain:layout style paint;contain-intrinsic-size:100vw 100vh;container-name:vertical-gallery;container-type:size;content-visibility:auto}@layer components{:root{--xeg-transition-toolbar:opacity var(--xeg-duration-toolbar) var(--xeg-easing-ease-out),transform var(--xeg-duration-toolbar) var(--xeg-easing-ease-out),visibility 0ms;--xeg-spacing-gallery:clamp(var(--xeg-spacing-sm),2.5vw,var(--xeg-spacing-lg));--xeg-spacing-mobile:clamp(var(--xeg-spacing-xs),2vw,var(--xeg-spacing-md));--xeg-spacing-compact:clamp(0.25rem,1.5vw,var(--xeg-spacing-sm));--xeg-toolbar-hidden-opacity:0;--xeg-toolbar-hidden-visibility:hidden;--xeg-toolbar-hidden-pointer-events:none}}@media (prefers-reduced-motion:reduce){@layer components{:root{--xeg-transition-toolbar:none}}}.VerticalGalleryView-module__container__Aiml7{background:var(--xeg-gallery-bg);contain:layout style paint;container-name:gallery-container;container-type:size;cursor:default;display:flex;flex-direction:column;height:100vh;left:0;opacity:1;overscroll-behavior:none;pointer-events:auto;position:fixed;scroll-behavior:smooth;top:0;transform:var(--xeg-gpu-hack);transition:var(--xeg-transition-elevation-normal);visibility:visible;width:100vw;will-change:opacity,transform;z-index:var(--xeg-z-gallery,10000)}.VerticalGalleryView-module__toolbarWrapper__p8FUg{backface-visibility:var(--xeg-backface-visibility);background:transparent;border:none;border-radius:0;contain:layout style;display:block;height:auto;left:0;margin:0;opacity:var(--toolbar-opacity,0);padding-block-end:var(--xeg-spacing-gallery);pointer-events:var(--toolbar-pointer-events,none);position:fixed;right:0;top:0;transform:var(--xeg-gpu-hack);transition:var(--xeg-transition-toolbar);visibility:var(--toolbar-visibility,hidden);will-change:transform,opacity,visibility;z-index:var(--xeg-z-toolbar)}.VerticalGalleryView-module__toolbarWrapper__p8FUg:hover{--toolbar-opacity:1;--toolbar-visibility:visible;--toolbar-pointer-events:auto;--toolbar-transform-y:0}.VerticalGalleryView-module__toolbarWrapper__p8FUg:focus-within{--toolbar-opacity:1;--toolbar-visibility:visible;--toolbar-pointer-events:auto;--toolbar-transform-y:0;transition:var(--xeg-transition-elevation-fast)}.VerticalGalleryView-module__toolbarWrapper__p8FUg *{pointer-events:inherit}.VerticalGalleryView-module__toolbarWrapper__p8FUg [data-gallery-element=settings-panel][data-expanded=true]{pointer-events:auto}.VerticalGalleryView-module__toolbarWrapper__p8FUg:has([data-gallery-element=settings-panel][data-expanded=true]){--toolbar-opacity:1;--toolbar-visibility:visible;--toolbar-pointer-events:auto}.VerticalGalleryView-module__container__Aiml7.VerticalGalleryView-module__uiHidden__pf-aH{cursor:none}.VerticalGalleryView-module__container__Aiml7.VerticalGalleryView-module__isScrolling__rlz2t[data-xeg-gallery=true][data-xeg-role=gallery] .VerticalGalleryView-module__toolbarWrapper__p8FUg{--toolbar-opacity:var(--xeg-toolbar-hidden-opacity,0);--toolbar-visibility:var(--xeg-toolbar-hidden-visibility,hidden);--toolbar-pointer-events:var(--xeg-toolbar-hidden-pointer-events,none)}.VerticalGalleryView-module__container__Aiml7 *{pointer-events:auto}.VerticalGalleryView-module__itemsContainer__YKfXj{contain:layout style;container-name:items-list;container-type:size;display:flex;flex:1;flex-direction:column;overflow:auto;overscroll-behavior:contain;pointer-events:auto;position:relative;scrollbar-gutter:stable;transform:var(--xeg-gpu-hack)}.VerticalGalleryView-module__itemsContainer__YKfXj::-webkit-scrollbar{width:var(--xeg-scrollbar-width)}.VerticalGalleryView-module__itemsContainer__YKfXj::-webkit-scrollbar-track{background:transparent}.VerticalGalleryView-module__itemsContainer__YKfXj::-webkit-scrollbar-thumb{background:var(--xeg-color-neutral-300);border-radius:var(\n    --xeg-scrollbar-border-radius\n  );-webkit-transition:background-color var(--xeg-duration-normal) var(--xeg-ease-standard);transition:background-color var(--xeg-duration-normal) var(--xeg-ease-standard)}.VerticalGalleryView-module__itemsContainer__YKfXj::-webkit-scrollbar-thumb:hover{background:var(--xeg-color-neutral-400)}.VerticalGalleryView-module__container__Aiml7.VerticalGalleryView-module__uiHidden__pf-aH .VerticalGalleryView-module__toolbarWrapper__p8FUg{opacity:0;pointer-events:none;transition:opacity var(--xeg-duration-fast) var(--xeg-easing-ease-out)}.VerticalGalleryView-module__container__Aiml7.VerticalGalleryView-module__uiHidden__pf-aH .VerticalGalleryView-module__itemsContainer__YKfXj,.VerticalGalleryView-module__container__Aiml7.VerticalGalleryView-module__uiHidden__pf-aH [data-xeg-role=items-list]{pointer-events:auto}.VerticalGalleryView-module__container__Aiml7.VerticalGalleryView-module__empty__jTwj2{align-items:center;justify-content:center}.VerticalGalleryView-module__galleryItem__Dd-4t{border-radius:var(--xeg-radius-lg,.5rem);contain:layout style;margin-bottom:var(--xeg-spacing-md,1rem);position:relative;transform:var(--xeg-gpu-hack);transition:var(--xeg-transition-elevation-normal)}.VerticalGalleryView-module__itemActive__if-HU{position:relative;z-index:1}.VerticalGalleryView-module__scrollSpacer__paR5C{background:transparent;contain:strict;content-visibility:auto;flex-shrink:0;height:calc(100vh - var(--xeg-toolbar-height, 3.75rem));min-height:50vh;opacity:0;pointer-events:none;-webkit-user-select:none;-moz-user-select:none;user-select:none}.VerticalGalleryView-module__container__Aiml7:has(.VerticalGalleryView-module__itemActive__if-HU){--has-active-item:1}.VerticalGalleryView-module__container__Aiml7:has(.VerticalGalleryView-module__toolbarWrapper__p8FUg:hover){--toolbar-interaction:1}.VerticalGalleryView-module__toolbarHoverZone__zOeUg{background:transparent;height:var(--xeg-hover-zone-height);left:0;pointer-events:auto;position:fixed;right:0;top:0;z-index:var(--xeg-z-toolbar-hover-zone)}.VerticalGalleryView-module__toolbarHoverZone__zOeUg:hover{background:var(--xeg-toolbar-hover-zone-bg,transparent);z-index:var(--xeg-z-toolbar-hover-zone)}.VerticalGalleryView-module__container__Aiml7.VerticalGalleryView-module__initialToolbarVisible__3342w:not([data-settings-expanded=true]) .VerticalGalleryView-module__toolbarHoverZone__zOeUg,.VerticalGalleryView-module__container__Aiml7:has(.VerticalGalleryView-module__toolbarWrapper__p8FUg:hover):not([data-settings-expanded=true]) .VerticalGalleryView-module__toolbarHoverZone__zOeUg{pointer-events:none}.VerticalGalleryView-module__container__Aiml7.VerticalGalleryView-module__initialToolbarVisible__3342w .VerticalGalleryView-module__toolbarWrapper__p8FUg,.VerticalGalleryView-module__container__Aiml7:has(.VerticalGalleryView-module__toolbarHoverZone__zOeUg:hover) .VerticalGalleryView-module__toolbarWrapper__p8FUg{--toolbar-opacity:1;--toolbar-visibility:visible;--toolbar-pointer-events:auto;--toolbar-transform-y:0}@supports not (selector(:has(*))){.VerticalGalleryView-module__toolbarWrapper__p8FUg:hover~.VerticalGalleryView-module__toolbarHoverZone__zOeUg{pointer-events:none}.VerticalGalleryView-module__container__Aiml7:hover .VerticalGalleryView-module__toolbarWrapper__p8FUg,.VerticalGalleryView-module__toolbarHoverZone__zOeUg:hover+.VerticalGalleryView-module__toolbarWrapper__p8FUg,.VerticalGalleryView-module__toolbarHoverZone__zOeUg:hover~.VerticalGalleryView-module__toolbarWrapper__p8FUg{--toolbar-opacity:1;--toolbar-visibility:visible;--toolbar-pointer-events:auto;--toolbar-transform-y:0}}.VerticalGalleryView-module__toolbarWrapper__p8FUg [class*=galleryToolbar],.VerticalGalleryView-module__toolbarWrapper__p8FUg [data-testid*=toolbar]{display:flex;opacity:var(--toolbar-opacity,0);pointer-events:var(--toolbar-pointer-events,none);visibility:var(--toolbar-visibility,hidden)}.VerticalGalleryView-module__toolbarWrapper__p8FUg .VerticalGalleryView-module__toolbarButton__M755U,.VerticalGalleryView-module__toolbarWrapper__p8FUg [role=button],.VerticalGalleryView-module__toolbarWrapper__p8FUg button{pointer-events:auto;position:relative;z-index:10}.VerticalGalleryView-module__emptyMessage__4gxWK{color:var(--xeg-color-text-secondary);max-inline-size:min(25rem,90vw);padding:clamp(1.875rem,5vw,2.5rem);text-align:center}.VerticalGalleryView-module__emptyMessage__4gxWK h3{color:var(--xeg-color-text-primary);font-size:clamp(1.25rem,4vw,1.5rem);font-weight:600;line-height:1.2;margin:0 0 clamp(.75rem,2vw,1rem)}.VerticalGalleryView-module__emptyMessage__4gxWK p{color:var(--xeg-color-text-tertiary);font-size:clamp(.875rem,2.5vw,1rem);line-height:1.5;margin:0}@container gallery-container (max-width: 48rem){.VerticalGalleryView-module__itemsContainer__YKfXj{gap:var(--xeg-spacing-mobile);padding:var(--xeg-spacing-mobile)}.VerticalGalleryView-module__toolbarWrapper__p8FUg{padding-block-end:var(--xeg-spacing-mobile)}}@container gallery-container (max-width: 30rem){.VerticalGalleryView-module__itemsContainer__YKfXj{gap:var(--xeg-spacing-compact);padding:var(--xeg-spacing-compact)}}@media (width \u003c= 760.5rem){.VerticalGalleryView-module__itemsContainer__YKfXj{gap:var(--xeg-spacing-mobile);padding:var(--xeg-spacing-mobile)}.VerticalGalleryView-module__toolbarWrapper__p8FUg{padding-block-end:var(--xeg-spacing-mobile)}}@media (width \u003c= 45rem){.VerticalGalleryView-module__itemsContainer__YKfXj{gap:var(--xeg-spacing-compact);padding:var(--xeg-spacing-compact)}}@media (prefers-reduced-motion:reduce){.VerticalGalleryView-module__itemsContainer__YKfXj{scroll-behavior:auto;transform:none;will-change:auto}}@media (prefers-reduced-motion:reduce){.VerticalGalleryView-module__toolbarWrapper__p8FUg:focus-within,.VerticalGalleryView-module__toolbarWrapper__p8FUg:hover{transform:none}}.VerticalGalleryView-module__container__Aiml7 [class*=galleryToolbar]:hover{--toolbar-opacity:1;--toolbar-pointer-events:auto}.VerticalImageItem-module__container__qRcUG{align-items:center;background:var(--xeg-color-bg-secondary);border:.0625rem solid var(--xeg-color-border-primary);border-radius:var(--xeg-radius-lg);contain:layout style;cursor:pointer;display:flex;flex-direction:column;margin-bottom:var(--xeg-spacing-md);margin-inline:auto;max-width:100%;overflow:visible;padding:var(--xeg-spacing-sm);pointer-events:auto;position:relative;text-align:center;transform:var(--xeg-gpu-hack);transition:var(--xeg-transition-interaction-fast);width:-moz-fit-content;width:fit-content;will-change:transform}.VerticalImageItem-module__container__qRcUG[data-fit-mode=original]{align-self:center;flex-shrink:0;max-width:none;width:-moz-max-content;width:max-content}.VerticalImageItem-module__container__qRcUG:hover{background:var(--xeg-color-surface-elevated);border-color:var(--xeg-glass-border-medium);transform:var(--xeg-hover-lift)}.VerticalImageItem-module__container__qRcUG:focus-visible{border-color:var(--xeg-focus-indicator-color,var(--xeg-color-border-primary))}.VerticalImageItem-module__container__qRcUG.VerticalImageItem-module__active__aWEB-{border-color:var(--xeg-glass-border-strong,var(--xeg-color-border-strong));transition:var(--xeg-transition-interaction-fast)}.VerticalImageItem-module__container__qRcUG.VerticalImageItem-module__active__aWEB-:focus-visible{border-color:var(--xeg-focus-indicator-color,var(--xeg-color-border-strong))}.VerticalImageItem-module__container__qRcUG.VerticalImageItem-module__focused__bxsv8{border-color:var(--xeg-focus-indicator-color,var(--xeg-color-border-primary));transition:var(--xeg-transition-interaction-fast)}.VerticalImageItem-module__imageWrapper__-kjRY{align-items:center;background:var(--xeg-color-bg-secondary);display:flex;justify-content:center;margin:0 auto;max-width:100%;position:relative;width:-moz-fit-content;width:fit-content}.VerticalImageItem-module__imageWrapper__-kjRY:has(.VerticalImageItem-module__image__cSYBD.VerticalImageItem-module__fitOriginal__t20HA),.VerticalImageItem-module__imageWrapper__-kjRY:has(.VerticalImageItem-module__video__5UXue.VerticalImageItem-module__fitOriginal__t20HA){max-width:none;width:auto}.VerticalImageItem-module__container__qRcUG[data-media-loaded=false] .VerticalImageItem-module__imageWrapper__-kjRY{aspect-ratio:var(--xeg-aspect-default,4/3);min-height:var(--xeg-spacing-3xl,3rem)}.VerticalImageItem-module__placeholder__qhYm5{align-items:center;background:var(--xeg-skeleton-bg);bottom:0;display:flex;justify-content:center;left:0;min-height:var(--xeg-spacing-3xl,3rem);position:absolute;right:0;top:0}.VerticalImageItem-module__loadingSpinner__Hozd6{--xeg-spinner-size:var(--xeg-spacing-lg);--xeg-spinner-border-width:0.125rem;--xeg-spinner-track-color:var(--xeg-color-border-primary);--xeg-spinner-indicator-color:var(--xeg-color-primary)}.VerticalImageItem-module__image__cSYBD,.VerticalImageItem-module__video__5UXue{border-radius:var(--xeg-radius-md);display:block;-o-object-fit:contain;object-fit:contain;pointer-events:auto;-webkit-user-select:none;-moz-user-select:none;user-select:none;-webkit-user-drag:none;transform:var(--xeg-gpu-hack);transition:opacity var(--xeg-duration-normal) var(--xeg-easing-ease-out);will-change:opacity}:is(.VerticalImageItem-module__image__cSYBD,.VerticalImageItem-module__video__5UXue).VerticalImageItem-module__loading__t4w5-{opacity:0}:is(.VerticalImageItem-module__image__cSYBD,.VerticalImageItem-module__video__5UXue).VerticalImageItem-module__loaded__vDV6N{opacity:1}.VerticalImageItem-module__video__5UXue{inline-size:100%;overflow:clip}:is(.VerticalImageItem-module__image__cSYBD,.VerticalImageItem-module__video__5UXue).VerticalImageItem-module__fitOriginal__t20HA{block-size:auto;inline-size:auto;max-block-size:none;max-inline-size:none;-o-object-fit:none;object-fit:none}:is(.VerticalImageItem-module__image__cSYBD,.VerticalImageItem-module__video__5UXue).VerticalImageItem-module__fitWidth__J7xHh{block-size:auto;inline-size:auto;max-block-size:none;max-inline-size:100%;-o-object-fit:scale-down;object-fit:scale-down}:is(.VerticalImageItem-module__image__cSYBD,.VerticalImageItem-module__video__5UXue).VerticalImageItem-module__fitHeight__aeywR{block-size:auto;inline-size:auto;max-block-size:var(--xeg-viewport-height-constrained,90vh);max-inline-size:calc(100vw - var(--xeg-spacing-lg, 1.5rem)*2);-o-object-fit:scale-down;object-fit:scale-down}:is(.VerticalImageItem-module__image__cSYBD,.VerticalImageItem-module__video__5UXue).VerticalImageItem-module__fitContainer__ecmXz{block-size:auto;inline-size:auto;max-block-size:var(--xeg-viewport-height-constrained,90vh);max-inline-size:100%;-o-object-fit:contain;object-fit:contain}.VerticalImageItem-module__errorState__TKC7D{align-items:center;background:var(--xeg-color-bg-secondary);color:var(--xeg-color-text-secondary);display:flex;flex-direction:column;justify-content:center;min-height:var(--xeg-spacing-3xl,3rem);padding:var(--xeg-spacing-3xl,3rem) var(--xeg-spacing-lg)}.VerticalImageItem-module__errorIcon__mJvHs{font-size:var(--xeg-font-size-2xl);margin-bottom:var(--xeg-spacing-sm)}.VerticalImageItem-module__errorText__noZXv{font-size:var(--xeg-font-size-sm);text-align:center}.VerticalImageItem-module__overlay__OQwvZ{display:flex;gap:var(--xeg-spacing-sm);opacity:0;position:absolute;right:var(--xeg-spacing-sm);top:var(--xeg-spacing-sm);transition:var(--xeg-transition-opacity)}.VerticalImageItem-module__container__qRcUG:hover .VerticalImageItem-module__overlay__OQwvZ{opacity:1}.VerticalImageItem-module__indexBadge__yBh8J{align-items:center;background:var(--xeg-color-overlay-medium);border-radius:var(--xeg-radius-lg);color:var(--xeg-color-text-inverse);display:flex;font-size:var(--xeg-font-size-xs);font-weight:var(--xeg-font-weight-semibold);height:var(--xeg-spacing-lg);justify-content:center;min-width:var(--xeg-spacing-lg);padding:0 var(--xeg-spacing-sm)}.VerticalImageItem-module__metadata__hI89j{background:var(--xeg-color-bg-primary);padding:var(--xeg-spacing-sm)}.VerticalImageItem-module__filename__t8N-l{color:var(--xeg-color-text-primary);font-size:var(--xeg-font-size-sm);font-weight:var(--xeg-font-weight-medium);margin-bottom:var(--xeg-spacing-xs);overflow:clip;text-overflow:ellipsis;white-space:nowrap}.VerticalImageItem-module__fileSize__zxmCp{color:var(--xeg-color-text-secondary);font-size:var(--xeg-font-size-xs)}.VerticalImageItem-module__error__nD2NQ{align-items:center;background:var(--color-error-bg);bottom:0;color:var(--color-error);display:flex;flex-direction:column;justify-content:center;left:0;min-height:var(--xeg-spacing-3xl);position:absolute;right:0;top:0}.VerticalImageItem-module__container__qRcUG.VerticalImageItem-module__loaded__vDV6N .VerticalImageItem-module__image__cSYBD{opacity:1}.VerticalImageItem-module__container__qRcUG.VerticalImageItem-module__error__nD2NQ{border:.0625rem solid var(--xeg-color-error)}.VerticalImageItem-module__container__qRcUG[data-fit-mode=original] .VerticalImageItem-module__image__cSYBD,.VerticalImageItem-module__container__qRcUG[data-fit-mode=original] .VerticalImageItem-module__image__cSYBD:active,.VerticalImageItem-module__container__qRcUG[data-fit-mode=original] .VerticalImageItem-module__video__5UXue,.VerticalImageItem-module__container__qRcUG[data-fit-mode=original] .VerticalImageItem-module__video__5UXue:active{cursor:pointer}.VerticalImageItem-module__container__qRcUG[data-media-loaded=false][data-fit-mode=original],.VerticalImageItem-module__container__qRcUG[data-media-loaded=false][data-fit-mode=original] .VerticalImageItem-module__image__cSYBD,.VerticalImageItem-module__container__qRcUG[data-media-loaded=false][data-fit-mode=original] .VerticalImageItem-module__video__5UXue{inline-size:min(var(--xeg-gallery-item-intrinsic-width,100%),100%);max-block-size:min(var(--xeg-gallery-item-intrinsic-height,var(--xeg-spacing-5xl)),var(--xeg-viewport-height-constrained,90vh));max-inline-size:min(var(--xeg-gallery-item-intrinsic-width,100%),100%)}.VerticalImageItem-module__container__qRcUG[data-media-loaded=false][data-has-intrinsic-size=true][data-fit-mode=fitContainer],.VerticalImageItem-module__container__qRcUG[data-media-loaded=false][data-has-intrinsic-size=true][data-fit-mode=fitHeight]{--xeg-gallery-fit-height-target:min(var(--xeg-gallery-item-intrinsic-height,var(--xeg-spacing-5xl)),var(--xeg-viewport-height-constrained,90vh));inline-size:min(100%,calc(var(--xeg-gallery-fit-height-target)*var(--xeg-gallery-item-intrinsic-ratio, 1)));max-block-size:var(--xeg-gallery-fit-height-target);max-inline-size:min(100%,calc(var(--xeg-gallery-fit-height-target)*var(--xeg-gallery-item-intrinsic-ratio, 1)))}.VerticalImageItem-module__container__qRcUG[data-media-loaded=false][data-has-intrinsic-size=true][data-fit-mode=fitContainer] .VerticalImageItem-module__image__cSYBD,.VerticalImageItem-module__container__qRcUG[data-media-loaded=false][data-has-intrinsic-size=true][data-fit-mode=fitContainer] .VerticalImageItem-module__video__5UXue,.VerticalImageItem-module__container__qRcUG[data-media-loaded=false][data-has-intrinsic-size=true][data-fit-mode=fitHeight] .VerticalImageItem-module__image__cSYBD,.VerticalImageItem-module__container__qRcUG[data-media-loaded=false][data-has-intrinsic-size=true][data-fit-mode=fitHeight] .VerticalImageItem-module__video__5UXue{max-block-size:var(--xeg-gallery-fit-height-target);max-inline-size:min(100%,calc(var(--xeg-gallery-fit-height-target)*var(--xeg-gallery-item-intrinsic-ratio, 1)))}.VerticalImageItem-module__eventBlocked__I55ty{pointer-events:none}@media (prefers-reduced-motion:reduce){.VerticalImageItem-module__container__qRcUG{will-change:auto}.VerticalImageItem-module__container__qRcUG:hover{transform:none}}@layer xeg.features{:where(.xeg-glass-surface,.glass-surface){background:var(--xeg-surface-glass-bg);border:var(--border-width-thin) solid var(--xeg-surface-glass-border);border-radius:var(--xeg-radius-2xl);isolation:isolate;transition:opacity var(--xeg-duration-normal) var(--xeg-ease-standard)}:where(.xeg-glass-surface,.glass-surface):hover{background:var(--xeg-surface-glass-bg-hover,var(--xeg-surface-glass-bg))}:where(.xeg-glass-surface-light,.glass-surface-light){background:var(--xeg-surface-glass-bg-light,var(--xeg-surface-glass-bg));border:var(--border-width-thin) solid var(--xeg-surface-glass-border-light,var(--xeg-surface-glass-border));border-radius:var(--xeg-radius-2xl);color:var(--xeg-surface-glass-text-light,var(--color-text-primary));isolation:isolate;transition:var(--xeg-transition-surface-normal)}:where(.xeg-glass-surface-dark,.glass-surface-dark){background:var(--xeg-surface-glass-bg-dark,var(--xeg-surface-glass-bg));border:var(--border-width-thin) solid var(--xeg-surface-glass-border-dark,var(--xeg-surface-glass-border));border-radius:var(--xeg-radius-2xl);color:var(--xeg-surface-glass-text-dark,var(--color-text-inverse));transition:var(--xeg-transition-surface-normal)}.xeg-gallery-error,.xeg-gallery-media,.xeg-gallery-nav-left,.xeg-gallery-nav-right,.xeg-gallery-overlay,.xeg-gallery-viewer{align-items:center;display:flex;justify-content:center}.xeg-gallery-overlay{background:var(--xeg-gallery-bg);inset:0;opacity:1;pointer-events:auto;position:fixed;transition:opacity var(--xeg-duration-normal) var(--xeg-ease-standard);z-index:var(--xeg-z-gallery)}.xeg-gallery-container{display:flex;flex-direction:column;height:100%;max-height:100vh;max-width:100vw;overflow-x:hidden;overflow-y:auto;position:relative;width:100%}.xeg-gallery-toolbar{align-items:center;background:var(--xeg-bg-toolbar);border-bottom:var(--border-width-thin) solid var(--xeg-color-border-primary);color:var(--xeg-toolbar-text-color,var(--xeg-color-text-primary));display:flex;height:3.75rem;justify-content:space-between;left:0;padding:0 var(--space-lg);position:absolute;right:0;top:0;transition:var(--xeg-transition-surface-normal),var(--xeg-transition-elevation-normal);z-index:var(--xeg-z-toolbar)}.xeg-toolbar-section-center,.xeg-toolbar-section-left,.xeg-toolbar-section-right{align-items:center;display:flex;gap:var(--space-sm)}.xeg-toolbar-section-center{flex:1;justify-content:center}.xeg-gallery-counter{background:var(--xeg-toolbar-element-bg,var(--color-bg-elevated));border:var(--border-width-thin) solid var(--xeg-toolbar-element-border,var(--color-border-default));border-radius:var(--xeg-radius-lg);color:var(--xeg-toolbar-text-color,var(--color-text-primary));font-size:var(--font-size-sm);font-weight:600;margin-left:var(--space-md);padding:.375em .75em}.xeg-fit-buttons,.xeg-gallery-counter{transition:var(--xeg-transition-surface-normal)}.xeg-fit-buttons{background:var(--xeg-toolbar-element-bg,var(--xeg-color-neutral-100));border:var(--border-width-thin) solid var(--xeg-toolbar-element-border,var(--xeg-color-neutral-200));border-radius:var(--xeg-radius-lg);display:flex;gap:.25em;padding:.25em}.xeg-download-progress{background:var(--xeg-bg-toolbar);border:var(--border-width-thin) solid var(--xeg-color-border-primary);border-radius:var(--xeg-radius-lg);bottom:-3.125rem;left:50%;min-width:12.5rem;padding:.75rem 1rem;position:absolute;text-align:center;transform:translateX(-50%);transition:opacity var(--xeg-duration-normal) var(--xeg-ease-standard)}.xeg-progress-bar{background:var(--xeg-toolbar-progress-track,var(--xeg-color-neutral-200));border-radius:var(--radius-xs);height:.25rem;margin-bottom:var(--space-sm);overflow:clip;width:100%}.xeg-progress-fill{background:var(--xeg-toolbar-text-color,var(--xeg-color-text-primary));height:100%;transition:var(--xeg-transition-width-normal)}.xeg-progress-text{color:var(--xeg-toolbar-text-color,var(--xeg-button-text));font-size:var(--font-size-xs);font-weight:500}.xeg-gallery-viewer{flex:1;padding:3.75rem 1.25rem 1.25rem;position:relative}.xeg-gallery-media{max-height:100%;max-width:100%}.xeg-gallery-image,.xeg-gallery-video{border-radius:var(--xeg-radius-lg);max-height:100%;max-width:100%;-o-object-fit:contain;object-fit:contain;transition:transform var(--xeg-duration-normal) var(--xeg-ease-standard)}.xeg-gallery-error{color:var(--color-text-error);font-size:var(--font-size-md)}.xeg-gallery-nav-left,.xeg-gallery-nav-right{background:var(--xeg-toolbar-element-bg,var(--xeg-color-neutral-100));border:var(--border-width-thin) solid var(--xeg-toolbar-element-border,var(--xeg-border-button));border-radius:var(--xeg-radius-full);color:var(--xeg-toolbar-text-color,var(--xeg-color-text-primary));cursor:pointer;font-size:var(--font-size-xl);height:3.125rem;position:absolute;top:50%;transform:translateY(-50%);transition:var(--xeg-transition-surface-normal),transform var(--xeg-duration-normal) var(--xeg-ease-standard);width:3.125rem;z-index:var(--xeg-z-gallery-overlay)}.xeg-gallery-nav-left{left:1.25rem}.xeg-gallery-nav-right{right:1.25rem}.xeg-gallery-nav-left:hover,.xeg-gallery-nav-right:hover{background:var(--xeg-toolbar-element-bg-strong,var(--xeg-color-neutral-200));transform:translateY(-50%) translateY(-.1875rem) scale(1.05)}.xeg-gallery-nav-left:active,.xeg-gallery-nav-right:active{transform:translateY(-50%) translateY(0)}.xeg-gallery-nav-left:disabled,.xeg-gallery-nav-right:disabled{cursor:not-allowed;opacity:.5;transform:translateY(-50%)}.xeg-gallery-thumbnails{bottom:1.25rem;left:50%;max-width:calc(100vw - 2.5rem);position:absolute;transform:translateX(-50%);z-index:var(--xeg-z-gallery-overlay)}.xeg-thumbnails-container{background:var(--xeg-bg-toolbar);border:var(--border-width-thin) solid var(--xeg-color-border-primary);border-radius:var(--xeg-radius-2xl);display:flex;gap:var(--space-sm);overflow-x:auto;padding:.875rem;scrollbar-width:none;-ms-overflow-style:none;transition:var(--xeg-transition-surface-normal)}.xeg-thumbnails-container::-webkit-scrollbar{display:none}.xeg-thumbnail{background:none;border:var(--border-width-sm) solid transparent;border-radius:var(--xeg-radius-xl);cursor:pointer;flex-shrink:0;overflow:clip;padding:0;position:relative;transition:var(--xeg-transition-surface-normal),transform var(--xeg-duration-normal) var(--xeg-ease-standard)}.xeg-thumbnail:hover{border-color:var(--xeg-color-neutral-400);transform:scale(1.08)}.xeg-thumbnail-active{border-color:var(--xeg-color-primary);transform:scale(1.12)}.xeg-thumbnail-image{border-radius:var(--xeg-radius-md);display:block;height:5rem;-o-object-fit:cover;object-fit:cover;width:5rem}.xeg-thumbnail-indicator{background:var(--xeg-color-primary);border:var(--border-width-sm) solid var(--xeg-toolbar-element-border,var(--xeg-color-border-primary));border-radius:var(--xeg-radius-full);height:.5rem;position:absolute;right:.25rem;top:.25rem;width:.5rem}.xeg-thumbnail:focus,.xeg-thumbnail:focus-visible{border-color:var(--xeg-focus-indicator-color,var(--xeg-color-border-primary))}.xeg-gallery-backdrop{cursor:pointer;inset:0;position:absolute;z-index:var(--xeg-z-gallery-overlay)}}@layer xeg.tokens{:where(:root,.xeg-theme-scope){--color-base-white:#fff;--color-base-black:#000;--color-gray-50:#f4f5f6;--color-gray-100:#e8edee;--color-gray-200:#d8dedf;--color-gray-300:#b8bebe;--color-gray-400:#9d9da1;--color-gray-500:#7f7f83;--color-gray-600:#5f5f63;--color-gray-700:#414144;--color-gray-800:#2f2f32;--color-gray-900:#1d1e21;--space-xs:0.25rem;--space-sm:0.5rem;--space-md:1rem;--space-lg:1.5rem;--space-xl:2rem;--space-2xl:3rem;--radius-xs:0.125em;--radius-sm:0.25em;--radius-md:0.375em;--radius-lg:0.5em;--radius-xl:0.75em;--radius-2xl:1em;--radius-pill:1.75em;--radius-full:50%;--font-family-primary:\"TwitterChirp\",-apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,sans-serif;--font-size-2xs:0.6875rem;--font-size-xs:0.75rem;--font-size-sm:0.875rem;--font-size-base:0.9375rem;--font-size-md:1rem;--font-size-lg:1.0625rem;--font-size-xl:1.125rem;--font-size-2xl:1.25rem;--font-size-3xl:1.5rem;--font-weight-normal:400;--font-weight-medium:500;--font-weight-semibold:600;--font-weight-bold:700;--duration-fast:150ms;--duration-normal:250ms;--duration-slow:300ms;--border-width-thin:0.0625rem;--border-width-sm:0.125rem;--opacity-hover:0.8;--opacity-overlay-light:0.1;--opacity-overlay-medium:0.3;--opacity-overlay-strong:0.8;--opacity-overlay-backdrop:0.85;--opacity-glass:0.85}@supports (color:oklab(0% 0 0%)){:where(:root,.xeg-theme-scope){--color-base-white:oklch(1 0 0);--color-base-black:oklch(0 0 0);--color-gray-50:oklch(0.97 0.002 206.2);--color-gray-100:oklch(0.943 0.006 206.2);--color-gray-200:oklch(0.896 0.006 206.2);--color-gray-300:oklch(0.796 0.006 206.2);--color-gray-400:oklch(0.696 0.006 286.3);--color-gray-500:oklch(0.598 0.006 286.3);--color-gray-600:oklch(0.488 0.006 286.3);--color-gray-700:oklch(0.378 0.005 286.3);--color-gray-800:oklch(0.306 0.005 282);--color-gray-900:oklch(0.234 0.006 277.8)}}}@layer xeg.tokens{:where(:root,.xeg-theme-scope){--color-bg-primary:var(--color-base-white);--color-bg-secondary:var(--color-gray-50);--color-bg-surface:var(--color-base-white);--color-bg-elevated:var(--color-base-white);--xeg-bg-toolbar:var(--color-bg-surface);--xeg-toolbar-border:var(--xeg-color-border-primary);--xeg-toolbar-bg:var(--xeg-bg-toolbar);--xeg-toolbar-surface:var(--xeg-bg-toolbar);--xeg-toolbar-panel-surface:var(--xeg-toolbar-surface);--xeg-color-bg-secondary:var(--color-bg-secondary);--xeg-gallery-bg-light:var(--color-bg-primary);--xeg-gallery-bg-dark:var(--color-gray-900);--xeg-gallery-bg:var(--xeg-gallery-bg-light);--xeg-color-background:#eee;--color-text-primary:var(--color-base-black);--color-text-secondary:var(\n      --color-gray-600\n    );--color-text-muted:var(--color-gray-500);--color-text-inverse:var(--color-base-white);--color-text-error:var(--color-base-white);--color-text-on-overlay:var(--color-base-white);--color-border-default:var(--color-gray-200);--color-border-muted:var(--color-gray-100);--color-border-subtle:var(--color-gray-100);--color-border-emphasis:var(--color-gray-500);--color-border-hover:var(--color-gray-300);--xeg-color-border-primary:var(--color-border-default);--xeg-color-border-hover:var(--color-border-hover);--xeg-button-bg:var(--color-bg-surface);--xeg-button-border:var(--color-border-default);--xeg-button-text:var(--color-text-primary);--xeg-button-bg-hover:var(--color-bg-secondary);--xeg-button-border-hover:var(--color-border-hover);--xeg-border-button:var(--xeg-color-border-primary);--xeg-modal-bg-dark:var(--color-gray-800);--xeg-modal-border-dark:var(--color-border-emphasis);--xeg-toolbar-text-color:var(--xeg-color-text-primary);--xeg-toolbar-text-muted:var(--xeg-color-text-secondary);--xeg-toolbar-element-bg:color-mix(in oklch,var(--xeg-bg-toolbar) 80%,var(--color-base-white) 20%);--xeg-toolbar-element-bg-strong:color-mix(in oklch,var(--xeg-bg-toolbar) 65%,var(--color-base-white) 35%);--xeg-toolbar-element-border:color-mix(in oklch,var(--xeg-toolbar-border) 85%,var(--color-base-white) 15%);--xeg-toolbar-progress-track:color-mix(in oklch,var(--xeg-toolbar-element-bg) 60%,var(--xeg-toolbar-element-border) 40%);--xeg-toolbar-scrollbar-track:color-mix(in oklch,var(--xeg-toolbar-element-bg) 50%,var(--color-base-white) 50%);--xeg-toolbar-scrollbar-thumb:color-mix(in oklch,var(--xeg-toolbar-element-border) 80%,var(--color-base-white) 20%);--color-success:var(--color-gray-800);--color-success-hover:var(--color-gray-900);--color-success-bg:var(--color-gray-100);--color-error:var(--color-gray-800);--color-error-hover:var(--color-gray-900);--color-error-bg:var(--color-gray-100);--color-warning:var(--color-gray-700);--color-warning-bg:var(--color-gray-50);--color-info:var(--color-gray-700);--color-info-bg:var(--color-gray-50);--xeg-color-error:var(--color-error);--xeg-color-error-hover:var(--color-error-hover);--xeg-color-success-hover:var(--color-success-hover);--color-primary:var(--color-gray-900);--color-primary-hover:var(--color-gray-700);--color-primary-active:var(--color-gray-800);--xeg-color-primary:var(--color-primary);--xeg-color-success:var(--color-success);--xeg-color-neutral-100:var(--color-gray-100);--xeg-color-neutral-200:var(--color-gray-200);--xeg-color-neutral-300:var(--color-gray-300);--xeg-color-neutral-400:var(--color-gray-400);--xeg-color-neutral-500:var(--color-gray-500);--xeg-color-text-primary:var(--color-text-primary);--xeg-color-text-secondary:var(--color-text-secondary);--xeg-color-text-tertiary:var(--color-text-muted);--xeg-color-text-inverse:var(--color-text-inverse);--xeg-color-bg-primary:var(--color-bg-primary);--color-overlay-light:var(--color-gray-100);--color-overlay-medium:var(--color-gray-300);--color-overlay-strong:var(--color-gray-500);--color-overlay-backdrop:var(--color-gray-900);--color-overlay-light-bg:var(--color-gray-50);--color-overlay-dark-bg:var(--color-gray-900);--color-overlay-button-light:var(--color-gray-200);--color-overlay-button-light-hover:var(--color-gray-300);--xeg-color-overlay-medium:var(--color-overlay-medium);--xeg-color-overlay-strong:var(--color-overlay-strong);--color-glass-bg:var(--color-bg-surface);--color-glass-border:var(--color-border-default);--spacing-component-margin:var(--space-sm);--spacing-section-gap:var(--space-lg);--size-button-height:2.5em;--size-button-sm:2em;--size-button-md:2.5em;--size-button-lg:3em;--size-button-touch:2.75em;--size-input-height:2.5em;--xeg-size-button-md:var(--size-button-md);--size-icon-sm:1em;--size-icon-md:1.25em;--size-icon-lg:1.5em;--transition-fast:var(--duration-fast) cubic-bezier(0.4,0,0.2,1);--transition-normal:var(--duration-normal) cubic-bezier(0.4,0,0.2,1);--transition-slow:var(--duration-slow) cubic-bezier(0.4,0,0.2,1);--shadow-gallery-image:none;--shadow-gallery-counter:none;--shadow-gallery-nav:none;--shadow-gallery-nav-hover:none;--shadow-thumbnail:none;--shadow-thumbnail-hover:none;--xeg-focus-indicator-color:var(--xeg-color-border-primary);--xeg-font-size-sm:0.875rem;--xeg-font-size-base:1rem;--xeg-font-size-lg:1.125rem;--xeg-font-weight-medium:500;--xeg-font-size-2xl:var(--font-size-2xl);--xeg-font-weight-semibold:var(--font-weight-semibold);--xeg-duration-fast:var(--duration-fast);--xeg-duration-slow:var(--duration-slow);--xeg-duration-normal:var(--duration-normal);--xeg-duration-toolbar:var(--duration-normal);--xeg-transition-opacity:opacity var(--xeg-duration-normal) var(--xeg-easing-ease-out);--xeg-surface-glass-bg:var(--color-glass-bg);--xeg-surface-glass-border:var(--color-glass-border);--xeg-surface-glass-shadow:none;--xeg-surface-glass-blur:none;--xeg-color-surface-elevated:var(--color-bg-elevated);--xeg-skeleton-bg:var(--color-bg-secondary);--xeg-glass-border-medium:var(--xeg-media-glass-border);--xeg-glass-shadow-medium:var(--xeg-media-glass-shadow);--xeg-z-stack-base:10000;--xeg-z-gallery:10000;--xeg-z-gallery-overlay:10008;--xeg-z-gallery-toolbar:10012;--xeg-z-toolbar-hover-zone:10018;--xeg-z-toolbar:10020;--xeg-z-toolbar-panel:10022;--xeg-z-toolbar-panel-active:10024;--xeg-z-overlay:10030;--xeg-z-modal-backdrop:10040;--xeg-z-modal:10045;--xeg-z-modal-foreground:10048;--xeg-z-tooltip:10060;--xeg-layer-root:var(--xeg-z-gallery);--xeg-easing-ease-out:cubic-bezier(0.4,0,0.2,1);--xeg-button-lift:-0.0625rem;--xeg-opacity-disabled:0.5;--xeg-hover-lift:translateY(-0.125rem);--xeg-radius-sm:var(--radius-sm);--xeg-radius-md:var(--radius-md);--xeg-radius-lg:var(--radius-lg);--xeg-radius-xl:var(--radius-xl);--xeg-radius-2xl:var(--radius-2xl);--xeg-radius-full:var(--radius-full)}@supports (color:oklab(0% 0 0%)){:where(:root,.xeg-theme-scope){--xeg-color-background:oklch(95% 0 0deg)}}:where(:root,.xeg-theme-scope)[data-theme=light]{--color-bg-primary:var(--color-base-white);--color-text-primary:var(--color-base-black);--color-text-secondary:var(--color-gray-600);--color-glass-bg:var(--color-bg-surface);--color-glass-border:var(--color-border-default);--xeg-gallery-bg:var(--xeg-gallery-bg-light);--xeg-modal-bg:var(--xeg-modal-bg-light);--xeg-modal-border:var(--xeg-modal-border-light);--xeg-color-border-primary:var(--color-border-default);--xeg-settings-gap:var(--space-md);--xeg-settings-padding:var(--space-md);--xeg-settings-control-gap:var(--space-sm);--xeg-settings-label-font-size:var(--font-size-sm);--xeg-settings-label-font-weight:var(--font-weight-medium);--xeg-settings-select-padding:var(--space-sm);--xeg-settings-select-font-size:var(--font-size-sm);--xeg-aspect-default:4/3;--xeg-color-background:#eee}@supports (color:oklab(0% 0 0%)){:where(:root,.xeg-theme-scope)[data-theme=light]{--xeg-color-background:oklch(95% 0 0deg)}}:where(:root,.xeg-theme-scope)[data-theme=dark]{--color-bg-primary:var(--color-gray-900);--color-bg-surface:var(--color-gray-900);--color-bg-elevated:var(--color-gray-700);--color-text-primary:var(--color-base-white);--color-text-secondary:var(\n      --color-gray-400\n    );--color-glass-bg:var(--color-gray-900);--color-glass-border:var(--color-gray-600);--xeg-bg-toolbar:var(--color-gray-800);--xeg-color-border-primary:var(\n      --color-gray-600\n    );--xeg-toolbar-border:var(--color-gray-600);--xeg-color-bg-secondary:var(--color-gray-800);--xeg-gallery-bg:var(--xeg-gallery-bg-dark);--xeg-button-bg:var(--color-gray-800);--xeg-button-border:var(--color-gray-600);--xeg-button-text:var(--color-text-primary);--xeg-button-bg-hover:var(--color-gray-700);--xeg-button-border-hover:var(--color-gray-600);--xeg-modal-bg:var(--xeg-modal-bg-dark);--xeg-modal-border:var(--xeg-modal-border-dark);--xeg-settings-select-padding:var(--space-sm);--xeg-settings-select-font-size:var(--font-size-sm);--xeg-toolbar-text-color:var(--color-text-primary);--xeg-toolbar-text-muted:var(--color-gray-300);--xeg-toolbar-element-bg:color-mix(in oklch,var(--xeg-bg-toolbar) 85%,var(--color-base-black) 15%);--xeg-toolbar-element-bg-strong:color-mix(in oklch,var(--xeg-bg-toolbar) 70%,var(--color-base-black) 30%);--xeg-toolbar-element-border:color-mix(in oklch,var(--xeg-toolbar-border) 75%,var(--color-base-black) 25%);--xeg-toolbar-progress-track:color-mix(in oklch,var(--xeg-toolbar-border) 65%,var(--xeg-bg-toolbar) 35%);--xeg-toolbar-scrollbar-track:color-mix(in oklch,var(--xeg-toolbar-element-bg) 80%,var(--color-base-black) 20%);--xeg-toolbar-scrollbar-thumb:color-mix(in oklch,var(--xeg-toolbar-element-border) 85%,var(--color-base-black) 15%);--xeg-color-background:#161616;--color-primary:var(--color-gray-100);--color-primary-hover:var(--color-gray-200);--color-primary-active:var(--color-gray-300)}@supports (color:oklab(0% 0 0%)){:where(:root,.xeg-theme-scope)[data-theme=dark]{--xeg-color-background:oklch(20% 0 0deg)}}@media (prefers-color-scheme:dark){:where(:root,.xeg-theme-scope):not([data-theme=light]){--color-bg-primary:var(--color-gray-900);--color-bg-surface:var(--color-gray-900);--color-bg-elevated:var(--color-gray-700);--color-text-primary:var(--color-base-white);--color-text-secondary:var(--color-gray-400);--color-glass-bg:var(--color-gray-900);--color-glass-border:var(--color-gray-600);--xeg-bg-toolbar:var(--color-gray-800);--xeg-color-border-primary:var(--color-gray-600);--xeg-toolbar-border:var(--color-gray-600);--xeg-surface-glass-bg:var(--color-gray-900);--xeg-color-bg-secondary:var(--color-gray-800);--xeg-gallery-bg:var(--xeg-gallery-bg-dark);--xeg-button-bg:var(--color-gray-800);--xeg-button-border:var(--color-gray-600);--xeg-button-text:var(--color-text-primary);--xeg-button-bg-hover:var(--color-gray-700);--xeg-button-border-hover:var(--color-gray-600);--xeg-modal-bg:var(--xeg-modal-bg-dark);--xeg-modal-border:var(--xeg-modal-border-dark);--xeg-toolbar-text-color:var(--color-text-primary);--xeg-toolbar-text-muted:var(--color-gray-300);--xeg-toolbar-element-bg:color-mix(in oklch,var(--xeg-bg-toolbar) 85%,var(--color-base-black) 15%);--xeg-toolbar-element-bg-strong:color-mix(in oklch,var(--xeg-bg-toolbar) 70%,var(--color-base-black) 30%);--xeg-toolbar-element-border:color-mix(in oklch,var(--xeg-toolbar-border) 75%,var(--color-base-black) 25%);--xeg-toolbar-progress-track:color-mix(in oklch,var(--xeg-toolbar-border) 65%,var(--xeg-bg-toolbar) 35%);--xeg-toolbar-scrollbar-track:color-mix(in oklch,var(--xeg-toolbar-element-bg) 80%,var(--color-base-black) 20%);--xeg-toolbar-scrollbar-thumb:color-mix(in oklch,var(--xeg-toolbar-element-border) 85%,var(--color-base-black) 15%);--xeg-settings-select-padding:var(--space-sm);--xeg-settings-select-font-size:var(--font-size-sm);--xeg-color-background:#161616;--color-primary:var(--color-gray-100);--color-primary-hover:var(--color-gray-200);--color-primary-active:var(--color-gray-300)}@supports (color:oklab(0% 0 0%)){:where(:root,.xeg-theme-scope):not([data-theme=light]){--xeg-color-background:oklch(20% 0 0deg)}}}@media (prefers-color-scheme:light){:where(:root,.xeg-theme-scope):not([data-theme=dark]){--color-bg-primary:var(--color-base-white);--color-text-primary:var(--color-base-black);--color-text-secondary:var(--color-gray-600);--color-glass-bg:var(--color-bg-surface);--xeg-bg-toolbar:var(--color-bg-surface);--xeg-color-border-primary:var(--color-border-default);--xeg-toolbar-border:var(--color-border-default);--xeg-color-bg-secondary:var(--color-bg-secondary);--xeg-gallery-bg:var(--xeg-gallery-bg-light);--xeg-modal-bg:var(--xeg-modal-bg-light);--xeg-modal-border:var(--xeg-modal-border-light);--xeg-settings-select-padding:var(--space-sm);--xeg-settings-select-font-size:var(--font-size-sm);--xeg-color-background:#eee}@supports (color:oklab(0% 0 0%)){:where(:root,.xeg-theme-scope):not([data-theme=dark]){--xeg-color-background:oklch(95% 0 0deg)}}}@media (prefers-reduced-motion:reduce){:where(:root,.xeg-theme-scope){--xeg-duration:0ms;--xeg-duration-fast:0ms;--xeg-duration-slow:0ms;--transition-fast:0ms;--transition-normal:0ms;--transition-slow:0ms;--xeg-transition-surface-normal:none;--xeg-transition-surface-fast:none;--xeg-transition-elevation-normal:none;--xeg-transition-elevation-fast:none;--xeg-transition-interaction-fast:none;--xeg-transition-width-normal:none;--animation-fade-in:none;--animation-fade-out:none;--animation-slide-in:none;--animation-slide-out:none;--animation-toolbar-show:none;--animation-toolbar-hide:none}}:where(:root,.xeg-theme-scope){--xeg-space-8:var(--space-sm);--xeg-space-12:0.75rem;--xeg-space-16:var(--space-md);--xeg-settings-gap:var(--space-md);--xeg-settings-padding:var(--space-md);--xeg-settings-control-gap:var(--space-sm);--xeg-settings-label-font-size:var(--font-size-sm);--xeg-settings-label-font-weight:var(\n      --font-weight-bold\n    );--xeg-settings-select-font-size:var(--font-size-sm);--xeg-settings-select-padding:var(--space-sm) var(--space-md);--xeg-toolbar-panel-shadow:var(--xeg-shadow-xs);--xeg-text-counter:var(--xeg-color-text-primary);--xeg-counter-text:var(--xeg-text-counter);--xeg-text-button:var(--xeg-color-text-primary);--xeg-text-button-navigation:var(--xeg-color-text-primary);--xeg-shadow-toolbar:var(--xeg-shadow-md);--xeg-toolbar-shadow:var(--xeg-shadow-toolbar);--xeg-media-glass-border:var(--color-glass-border);--xeg-media-glass-shadow:none;--xeg-media-glass-blur:none;--xeg-toolbar-wrapper-gradient-start:var(--xeg-bg-toolbar);--xeg-toolbar-wrapper-gradient-mid:color-mix(in oklab,var(--xeg-bg-toolbar) 85%,var(--color-gray-900) 15%);--xeg-toolbar-wrapper-gradient-end:var(--xeg-bg-toolbar);--xeg-toolbar-wrapper-border:none;--xeg-toolbar-wrapper-radius:0;--xeg-toolbar-wrapper-margin:0;--xeg-toolbar-hover-zone-bg:var(--hover-zone-bg,transparent);--xeg-neutral-100:var(--xeg-color-neutral-100);--xeg-neutral-200:var(--xeg-color-neutral-200);--xeg-neutral-300:var(--xeg-color-neutral-300);--xeg-neutral-400:var(--xeg-color-neutral-400);--xeg-comp-modal-backdrop:var(--color-overlay-backdrop);--xeg-modal-bg-light:var(--color-bg-elevated);--xeg-modal-border-light:var(--color-border-default);--xeg-modal-bg:var(--xeg-modal-bg-light);--xeg-modal-border:var(--xeg-modal-border-light)}:where(:root,.xeg-theme-scope)[data-theme=light]{--xeg-surface-glass-bg:var(--color-bg-surface);--xeg-surface-glass-border:var(--color-border-default);--xeg-surface-glass-shadow:none;--xeg-surface-glass-blur:none}:where(:root,.xeg-theme-scope)[data-theme=dark]{--xeg-surface-glass-bg:var(--color-gray-900);--xeg-surface-glass-border:var(--color-gray-600);--xeg-surface-glass-shadow:none;--xeg-surface-glass-blur:none}@media (prefers-color-scheme:dark){:where(:root,.xeg-theme-scope):not([data-theme=light]){--xeg-surface-glass-bg:var(--color-gray-900);--xeg-surface-glass-border:var(--color-gray-600);--xeg-surface-glass-shadow:none;--xeg-surface-glass-blur:none}}}@layer xeg.tokens{:where(:root,.xeg-theme-scope){--xeg-toolbar-panel-transition:height var(--xeg-duration-normal) var(--xeg-ease-standard),opacity var(--xeg-duration-fast) var(--xeg-ease-standard);--xeg-toolbar-panel-height:0;--xeg-toolbar-panel-max-height:17.5rem;--xeg-button-bg-primary-hover:var(--color-primary-hover);--xeg-button-bg-primary-active:var(--color-primary-active);--xeg-button-text-primary:var(--color-text-inverse);--xeg-button-text-secondary:var(--color-text-primary);--xeg-button-border:var(--color-border-default);--xeg-button-transition:var(--transition-fast);--xeg-panel-bg:var(--color-bg-elevated);--xeg-panel-border:var(--color-border-default);--xeg-panel-radius:var(--xeg-radius-lg);--xeg-panel-shadow:var(--shadow-sm);--xeg-glass-bg:var(--color-glass-bg);--xeg-glass-border:var(--color-glass-border);--xeg-glass-backdrop-filter:none;--xeg-glass-shadow:none;--xeg-media-border-radius:var(--xeg-radius-md);--xeg-media-loading-bg:var(--color-bg-secondary);--xeg-media-placeholder-text:var(--color-text-muted);--xeg-aspect-default:4/3;--xeg-scrollbar-width:0.5rem;--xeg-scrollbar-track-bg:var(--color-bg-secondary);--xeg-scrollbar-thumb-bg:var(--color-border-emphasis);--xeg-scrollbar-thumb-hover-bg:var(--color-text-secondary);--xeg-scrollbar-border-radius:var(--radius-sm);--xeg-hover-zone-height:7.5rem;--xeg-hover-zone-bg:transparent;--xeg-hover-zone-transition:var(--transition-fast);--xeg-animation-fade-in:fade-in var(--duration-normal) var(--transition-normal);--xeg-animation-fade-out:fade-out var(--duration-fast) cubic-bezier(0.4,0,1,1);--xeg-animation-slide-in:slide-in-bottom var(--duration-normal) var(--transition-normal);--xeg-animation-slide-out:slide-out-top var(--duration-fast) cubic-bezier(0.4,0,1,1);--xeg-spinner-size-default:1rem;--xeg-spinner-border-width:0.125rem;--xeg-spinner-track-color:color-mix(in oklch,var(--xeg-color-neutral-400) 60%,transparent);--xeg-spinner-indicator-color:var(--xeg-color-primary,currentColor);--xeg-spinner-duration:var(--xeg-duration-normal);--xeg-spinner-easing:var(--xeg-easing-linear);--xeg-transition-surface-normal:background-color var(--xeg-duration-normal) var(--xeg-ease-standard),border-color var(--xeg-duration-normal) var(--xeg-ease-standard),color var(--xeg-duration-normal) var(--xeg-ease-standard);--xeg-transition-surface-fast:background-color var(--xeg-duration-fast) var(--xeg-ease-standard),border-color var(--xeg-duration-fast) var(--xeg-ease-standard),color var(--xeg-duration-fast) var(--xeg-ease-standard);--xeg-transition-elevation-normal:transform var(--xeg-duration-normal) var(--xeg-ease-standard),opacity var(--xeg-duration-normal) var(--xeg-ease-standard);--xeg-transition-elevation-fast:transform var(--xeg-duration-fast) var(--xeg-ease-standard),opacity var(--xeg-duration-fast) var(--xeg-ease-standard);--xeg-transition-interaction-fast:background-color var(--xeg-duration-fast) var(--xeg-easing-ease-out),border-color var(--xeg-duration-fast) var(--xeg-easing-ease-out),color var(--xeg-duration-fast) var(--xeg-easing-ease-out),transform var(--xeg-duration-fast) var(--xeg-easing-ease-out);--xeg-transition-width-normal:width var(--xeg-duration-normal) var(--xeg-ease-standard);--xeg-icon-stroke-width:0.125rem;--xeg-icon-size:var(--size-icon-md);--xeg-icon-line-height:1;--xeg-icon-color:currentColor;--xeg-icon-size-sm:var(--size-icon-sm);--xeg-icon-size-md:var(--size-icon-md);--xeg-icon-size-lg:var(--size-icon-lg);--xeg-button-size-sm:var(--size-button-sm);--xeg-button-size-md:var(--size-button-md);--xeg-button-size-lg:var(--size-button-lg);--xeg-text-2xs:var(--font-size-2xs);--xeg-text-xs:var(--font-size-xs);--xeg-text-sm:var(--font-size-sm);--xeg-text-base:var(--font-size-base);--xeg-text-md:var(--font-size-md);--xeg-text-lg:var(--font-size-lg);--xeg-text-xl:var(--font-size-xl);--xeg-text-2xl:var(--font-size-2xl);--xeg-text-3xl:var(--font-size-3xl);--xeg-spacing-xs:var(--space-xs);--xeg-spacing-sm:var(--space-sm);--xeg-spacing-md:var(--space-md);--xeg-spacing-lg:var(--space-lg);--xeg-spacing-xl:var(--space-xl);--xeg-spacing-2xl:var(--space-2xl);--xeg-spacing-3xl:3rem;--xeg-spacing-5xl:5rem;--xeg-viewport-height-constrained:90vh}@media (prefers-reduced-transparency:reduce){:where(:root,.xeg-theme-scope){--color-glass-bg:var(--color-bg-primary);--xeg-glass-bg:var(--color-bg-primary);--xeg-surface-glass-bg:var(--color-bg-surface);--xeg-glass-backdrop-filter:none}}}@layer xeg.components{.xeg-glassmorphism{background:var(--xeg-glass-bg);border:.0625rem solid var(--xeg-glass-border);border-radius:var(--xeg-radius-lg)}.xeg-anim-fade-in{animation:xeg-fade-in var(--xeg-duration) var(--xeg-easing-ease-out)}.xeg-anim-fade-out{animation:xeg-fade-out var(--xeg-duration-fast) var(--xeg-easing-ease-in)}.xeg-spinner{animation:xeg-spin var(--xeg-spinner-duration) var(--xeg-spinner-easing) infinite;border:var(--xeg-spinner-border-width) solid var(--xeg-spinner-track-color);border-radius:var(--xeg-radius-full);border-top-color:var(--xeg-spinner-indicator-color);box-sizing:border-box;display:inline-block;height:var(--xeg-spinner-size,var(--xeg-spinner-size-default));width:var(--xeg-spinner-size,var(--xeg-spinner-size-default))}@media (prefers-reduced-motion:reduce){.xeg-spinner{animation:none}}}@layer xeg.components{@keyframes xeg-fade-in{0%{opacity:0}to{opacity:1}}@keyframes xeg-fade-out{0%{opacity:1}to{opacity:0}}@keyframes xeg-spin{0%{transform:rotate(0deg)}to{transform:rotate(1turn)}}@keyframes xeg-slide-out-top{0%{opacity:1;transform:translateY(0) scale(1)}to{opacity:0;transform:translateY(-1.25rem) scale(.95)}}}@layer xeg.tokens{:root{--xeg-ease-decelerate:cubic-bezier(0,0,0.2,1);--xeg-ease-accelerate:cubic-bezier(0.4,0,1,1);--xeg-ease-standard:cubic-bezier(0.4,0,0.2,1);--xeg-ease-entrance:var(--xeg-ease-decelerate);--xeg-gpu-hack:translate3d(0,0,0);--xeg-backface-visibility:hidden}}@layer xeg.base{:where(.xeg-gallery-root :before,.xeg-gallery-root :after),:where(.xeg-gallery-root,.xeg-gallery-root *){box-sizing:border-box;margin:0;padding:0}.xeg-gallery-root{background:var(--xeg-color-background,transparent);color:var(--xeg-color-text-primary,var(--color-text-primary,currentColor));font-family:var(\n      --font-family-primary,-apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,sans-serif\n    );line-height:var(--xeg-line-height-normal,1.5);scroll-behavior:smooth;-webkit-text-size-adjust:100%;-moz-text-size-adjust:100%;text-size-adjust:100%;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}.xeg-gallery-root button{background:none;border:none;color:inherit;cursor:pointer;font:inherit}.xeg-gallery-root a{color:inherit;text-decoration:none}.xeg-gallery-root img{display:block;height:auto;max-width:100%}.xeg-gallery-root ol,.xeg-gallery-root ul{list-style:none}.xeg-gallery-root input,.xeg-gallery-root select,.xeg-gallery-root textarea{background:transparent;color:inherit;font:inherit}.xeg-gallery-root ::-webkit-scrollbar{height:var(--xeg-scrollbar-width,.5rem);width:var(--xeg-scrollbar-width,.5rem)}.xeg-gallery-root ::-webkit-scrollbar-track{background:transparent}.xeg-gallery-root ::-webkit-scrollbar-thumb{background:var(--xeg-color-neutral-400,grey);border-radius:var(--xeg-radius-sm,.25em)}@supports (color:oklab(0% 0 0%)){.xeg-gallery-root ::-webkit-scrollbar-thumb{background:var(--xeg-color-neutral-400,oklch(60% 0 0deg))}}.xeg-gallery-root ::-webkit-scrollbar-thumb:hover{background:var(--xeg-color-neutral-500,#636363)}@supports (color:oklab(0% 0 0%)){.xeg-gallery-root ::-webkit-scrollbar-thumb:hover{background:var(--xeg-color-neutral-500,oklch(50% 0 0deg))}}}@layer xeg.utilities{.xeg-center-between,.xeg-row-center{align-items:center;display:flex}.xeg-center-between{justify-content:space-between}.xeg-inline-center{display:inline-flex}.xeg-flex-center,.xeg-inline-center{align-items:center;justify-content:center}.xeg-flex-center{display:flex}.xeg-flex-col,.xeg-flex-col-center{display:flex;flex-direction:column}.xeg-flex-col-center{align-items:center;justify-content:center}.xeg-gap-xs{gap:var(--xeg-spacing-xs)}.xeg-gap-sm{gap:var(--xeg-spacing-sm)}.xeg-gap-md{gap:var(--xeg-spacing-md)}.xeg-gap-lg{gap:var(--xeg-spacing-lg)}.xeg-p-sm{padding:var(--xeg-spacing-sm)}.xeg-p-md{padding:var(--xeg-spacing-md)}.xeg-px-sm{padding-inline:var(--xeg-spacing-sm)}.xeg-px-md{padding-inline:var(--xeg-spacing-md)}.xeg-py-sm{padding-block:var(--xeg-spacing-sm)}.xeg-py-md{padding-block:var(--xeg-spacing-md)}.xeg-w-full{width:100%}.xeg-h-full{height:100%}.xeg-relative{position:relative}.xeg-absolute{position:absolute}.xeg-fixed{position:fixed}.xeg-overflow-hidden{overflow:hidden}.xeg-overflow-clip{overflow:clip}.xeg-text-center{text-align:center}.xeg-select-none{-webkit-user-select:none;-moz-user-select:none;user-select:none}}@layer xeg.utilities{@keyframes xeg-slide-up{0%{opacity:0;transform:translateY(1.25rem) var(--xeg-gpu-hack)}to{opacity:1;transform:translateY(0) var(--xeg-gpu-hack)}}@keyframes xeg-scale-in{0%{opacity:0;transform:scale(.8) var(--xeg-gpu-hack)}to{opacity:1;transform:scale(1) var(--xeg-gpu-hack)}}.xeg-fade-in{animation:xeg-fade-in var(--xeg-duration-normal) var(--xeg-ease-entrance);animation-fill-mode:both}.xeg-slide-up{animation:xeg-slide-up var(--xeg-duration-normal) var(--xeg-ease-entrance);animation-fill-mode:both}.xeg-scale-in,.xeg-slide-up{backface-visibility:var(--xeg-backface-visibility)}.xeg-scale-in{animation:xeg-scale-in var(--xeg-duration-normal) var(--xeg-ease-entrance);animation-fill-mode:both}.xeg-transition{transition:transform var(--xeg-duration-normal) var(--xeg-ease-standard),opacity var(--xeg-duration-normal) var(--xeg-ease-standard);will-change:transform,opacity}.xeg-transition-hover{transition:transform var(--xeg-duration-fast) var(--xeg-ease-standard),opacity var(--xeg-duration-fast) var(--xeg-ease-standard),background-color var(--xeg-duration-fast) var(--xeg-ease-standard);will-change:transform,opacity,background-color}.xeg-transition-hover:hover{transform:translateY(var(--xeg-button-lift)) var(--xeg-gpu-hack)}.xeg-transition-focus{transition:box-shadow var(--xeg-duration-fast) var(--xeg-ease-standard),border-color var(--xeg-duration-fast) var(--xeg-ease-standard);will-change:box-shadow}@media (prefers-reduced-motion:reduce){.xeg-fade-in,.xeg-scale-in,.xeg-slide-up{animation:none}.xeg-transition,.xeg-transition-focus,.xeg-transition-hover{transition:none}.xeg-transition-hover:hover{transform:none}}:where(.xeg-no-animation,.xeg-no-animation *){animation:none;transition:none}.xeg-no-animation .xeg-transition-hover:hover{transform:none}}@layer xeg.features{.xeg-gallery-root{all:initial;background:var(--xeg-gallery-bg,var(--color-bg-primary));color:var(--xeg-color-text-primary,currentColor);contain:style paint;display:block;font-family:var(\n      --font-family-primary,-apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,Helvetica,Arial,sans-serif\n    );font-size:var(--font-size-base,.9375rem);height:100vh;inset:0;isolation:isolate;line-height:var(--xeg-line-height-normal,1.5);overscroll-behavior:contain;pointer-events:auto;position:fixed;transform:translateZ(0);-webkit-user-select:none;-moz-user-select:none;user-select:none;width:100vw;will-change:opacity,transform;z-index:var(--xeg-layer-root,10000)}.xeg-gallery-root,.xeg-gallery-root *,.xeg-gallery-root :after,.xeg-gallery-root :before{box-sizing:border-box}}/*$vite$:1*/";(document.head||document.documentElement).appendChild(s)}catch(e){var d=e instanceof Error?{message:e.message,stack:e.stack||''}:{message:String(e)},t=typeof window!=='undefined'?window:typeof globalThis!=='undefined'?globalThis:null;if(t&&t.dispatchEvent){var n;if(typeof CustomEvent==='function')n=new CustomEvent('xeg:style-error',{detail:d});else if(document&&document.createEvent){n=document.createEvent('CustomEvent');n.initCustomEvent('xeg:style-error',false,false,d)}if(n)t.dispatchEvent(n)}}})();
(function() {
'use strict';
(function() {
	var __defProp = Object.defineProperty;
	var __esmMin = (fn, res) => () => (fn && (res = fn(fn = 0)), res);
	var __export = (all, symbols) => {
		let target = {};
		for (var name in all) __defProp(target, name, {
			get: all[name],
			enumerable: true
		});
		if (symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
		return target;
	}, __vitePreload;
	var init_preload_helper = __esmMin((() => {
		__vitePreload = function preload(baseModule, deps, importerUrl) {
			let promise = Promise.resolve();
			function handlePreloadError(err$2) {
				const e$1 = new Event("vite:preloadError", { cancelable: true });
				e$1.payload = err$2;
				window.dispatchEvent(e$1);
				if (!e$1.defaultPrevented) throw err$2;
			}
			return promise.then((res) => {
				for (const item of res || []) {
					if (item.status !== "rejected") continue;
					handlePreloadError(item.reason);
				}
				return baseModule().catch(handlePreloadError);
			});
		};
	}));
	function parseEnvLogLevel() {
		const envLevel = (__vite_import_meta_env__$1?.VITE_LOG_LEVEL)?.toLowerCase();
		if (envLevel && isValidLogLevel(envLevel)) return envLevel;
		return null;
	}
	function initializeFromEnv() {
		const envLevel = parseEnvLogLevel();
		if (envLevel) currentLevel = envLevel;
	}
	function isValidLogLevel(level) {
		return VALID_LOG_LEVELS.includes(level);
	}
	function getLogLevel() {
		return currentLevel;
	}
	var __vite_import_meta_env__$1, DEFAULT_LOG_LEVEL, LOG_LEVEL_PRIORITY, VALID_LOG_LEVELS, currentLevel;
	var init_log_level = __esmMin((() => {
		__vite_import_meta_env__$1 = {
			"BASE_URL": "/",
			"DEV": false,
			"MODE": "development",
			"PROD": true,
			"SSR": false
		};
		DEFAULT_LOG_LEVEL = "debug";
		LOG_LEVEL_PRIORITY = {
			debug: 0,
			info: 1,
			warn: 2,
			error: 3
		};
		VALID_LOG_LEVELS = [
			"debug",
			"info",
			"warn",
			"error"
		];
		currentLevel = DEFAULT_LOG_LEVEL;
		initializeFromEnv();
	}));
	function createLogger(config = {}) {
		return createLoggerImpl(config);
	}
	var BASE_PREFIX, createLoggerImpl, logger;
	var init_logger = __esmMin((() => {
		init_log_level();
		BASE_PREFIX = "[XEG]";
		{
			const DEFAULT_CONFIG$1 = {
				level: DEFAULT_LOG_LEVEL,
				prefix: BASE_PREFIX
			};
			const shouldLog$1 = (level, _config) => {
				const currentLevel$1 = getLogLevel();
				return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[currentLevel$1];
			};
			const formatMessage = (config, ...args) => {
				return [config.prefix, ...args];
			};
			createLoggerImpl = (config = {}) => {
				const finalConfig = {
					...DEFAULT_CONFIG$1,
					...config
				};
				return {
					info: (...args) => {
						if (shouldLog$1("info", finalConfig)) console.info(...formatMessage(finalConfig, ...args));
					},
					warn: (...args) => {
						if (shouldLog$1("warn", finalConfig)) console.warn(...formatMessage(finalConfig, ...args));
					},
					error: (...args) => {
						if (shouldLog$1("error", finalConfig)) console.error(...formatMessage(finalConfig, ...args));
					},
					debug: (...args) => {
						if (shouldLog$1("debug", finalConfig)) console.info(...formatMessage(finalConfig, ...args));
					},
					trace: (...args) => {
						if (shouldLog$1("debug", finalConfig)) console.debug(...formatMessage(finalConfig, ...args));
					}
				};
			};
		}
		logger = createLogger({ level: DEFAULT_LOG_LEVEL });
	}));
	var init_logging = __esmMin((() => {
		init_log_level();
		init_logger();
	}));
	init_preload_helper();
	init_logging();
	function wireGlobalEvents(onBeforeUnload) {
		if (!(typeof window !== "undefined" && Boolean(window.addEventListener))) {
			logger.debug("[events] 🧩 Global events wiring skipped (no window context)");
			return () => {};
		}
		let disposed = false;
		const invokeOnce = () => {
			if (disposed) return;
			disposed = true;
			onBeforeUnload();
		};
		const handler = () => {
			invokeOnce();
		};
		window.addEventListener("pagehide", handler, {
			once: true,
			passive: true
		});
		logger.debug("[events] 🧩 Global events wired (pagehide only)");
		return () => {
			if (disposed) return;
			disposed = true;
			window.removeEventListener("pagehide", handler);
			logger.debug("[events] 🧩 Global events unwired");
		};
	}
	function createSingleton(factory) {
		let instance = null;
		return {
			get() {
				if (instance === null) instance = factory();
				return instance;
			},
			reset() {
				instance = null;
			}
		};
	}
	var init_singleton = __esmMin((() => {}));
	var service_manager_exports = /* @__PURE__ */ __export({
		CoreService: () => CoreService,
		serviceManager: () => serviceManager
	}, 1);
	function isDisposable(value) {
		return value !== null && typeof value === "object" && "destroy" in value && typeof value.destroy === "function";
	}
	var CoreService, serviceManager;
	var init_service_manager = __esmMin((() => {
		init_logging();
		init_singleton();
		CoreService = class CoreService {
			static singleton = createSingleton(() => new CoreService());
			services = /* @__PURE__ */ new Map();
			constructor() {}
			static getInstance() {
				return CoreService.singleton.get();
			}
			static resetForTests() {
				CoreService.singleton.get().reset();
				CoreService.singleton.reset();
			}
			register(key, instance) {
				this.services.set(key, instance);
			}
			get(key) {
				if (this.services.has(key)) return this.services.get(key);
				throw new Error(`Service not found: ${key}`);
			}
			tryGet(key) {
				if (this.services.has(key)) return this.services.get(key);
				return null;
			}
			has(key) {
				return this.services.has(key);
			}
			getRegisteredServices() {
				return Array.from(this.services.keys());
			}
			cleanup() {
				this.services.forEach((service) => {
					try {
						if (isDisposable(service)) service.destroy();
					} catch (e) {
						logger.error("Service cleanup failed", e);
					}
				});
				this.services.clear();
			}
			reset() {
				this.cleanup();
			}
		};
		serviceManager = CoreService.getInstance();
	}));
	function isBaseLanguageCode(value) {
		return value != null && LANGUAGE_CODE_LOOKUP.has(value);
	}
	var LANGUAGE_CODES, LANGUAGE_CODE_LOOKUP;
	var init_language_types = __esmMin((() => {
		LANGUAGE_CODES = [
			"en",
			"ko",
			"ja"
		];
		LANGUAGE_CODE_LOOKUP = new Set(LANGUAGE_CODES);
	}));
	var en;
	var init_en = __esmMin((() => {
		en = {
			toolbar: {
				previous: "Previous",
				next: "Next",
				download: "Download",
				downloadAll: "Download ZIP",
				settings: "Settings",
				close: "Close",
				tweetText: "Tweet text",
				tweetTextPanel: "Tweet text panel"
			},
			settings: {
				title: "Settings",
				theme: "Theme",
				language: "Language",
				themeAuto: "Auto",
				themeLight: "Light",
				themeDark: "Dark",
				languageAuto: "Auto / 자동 / 自動",
				languageKo: "한국어",
				languageEn: "English",
				languageJa: "日本語",
				close: "Close",
				gallery: { sectionTitle: "Gallery" }
			},
			messages: {
				errorBoundary: {
					title: "An error occurred",
					body: "An unexpected error occurred: {error}"
				},
				keyboardHelp: {
					title: "Keyboard shortcuts",
					navPrevious: "ArrowLeft: Previous media",
					navNext: "ArrowRight: Next media",
					close: "Escape: Close gallery",
					toggleHelp: "?: Show this help"
				},
				download: {
					single: { error: {
						title: "Download Failed",
						body: "Could not download the file: {error}"
					} },
					allFailed: {
						title: "Download Failed",
						body: "Failed to download all items."
					},
					partial: {
						title: "Partial Failure",
						body: "Failed to download {count} items."
					},
					retry: {
						action: "Retry",
						success: {
							title: "Retry Successful",
							body: "Successfully downloaded all previously failed items."
						}
					},
					cancelled: {
						title: "Download Cancelled",
						body: "The requested download was cancelled."
					}
				},
				gallery: {
					emptyTitle: "No media available",
					emptyDescription: "There are no images or videos to display.",
					failedToLoadImage: "Failed to load {type}"
				}
			}
		};
	}));
	var ko_exports = /* @__PURE__ */ __export({ ko: () => ko }, 1);
	var ko;
	var init_ko = __esmMin((() => {
		ko = {
			toolbar: {
				previous: "이전",
				next: "다음",
				download: "다운로드",
				downloadAll: "ZIP 다운로드",
				settings: "설정",
				close: "닫기",
				tweetText: "트윗 텍스트",
				tweetTextPanel: "트윗 텍스트 패널"
			},
			settings: {
				title: "설정",
				theme: "테마",
				language: "언어",
				themeAuto: "자동",
				themeLight: "라이트",
				themeDark: "다크",
				languageAuto: "자동 / Auto / 자동",
				languageKo: "한국어",
				languageEn: "English",
				languageJa: "日本語",
				close: "닫기",
				gallery: { sectionTitle: "갤러리" }
			},
			messages: {
				errorBoundary: {
					title: "오류가 발생했습니다",
					body: "예상치 못한 오류가 발생했습니다: {error}"
				},
				keyboardHelp: {
					title: "키보드 단축키",
					navPrevious: "ArrowLeft: 이전 미디어",
					navNext: "ArrowRight: 다음 미디어",
					close: "Escape: 갤러리 닫기",
					toggleHelp: "?: 이 도움말 표시"
				},
				download: {
					single: { error: {
						title: "다운로드 실패",
						body: "파일을 가져올 수 없습니다: {error}"
					} },
					allFailed: {
						title: "다운로드 실패",
						body: "모든 항목을 다운로드할 수 없었습니다."
					},
					partial: {
						title: "일부 실패",
						body: "{count}개 항목을 가져올 수 없었습니다."
					},
					retry: {
						action: "다시 시도",
						success: {
							title: "다시 시도 성공",
							body: "실패했던 모든 항목을 가져왔습니다."
						}
					},
					cancelled: {
						title: "다운로드가 취소되었습니다",
						body: "요청한 다운로드가 취소되었습니다."
					}
				},
				gallery: {
					emptyTitle: "미디어 없음",
					emptyDescription: "표시할 이미지 또는 동영상이 없습니다.",
					failedToLoadImage: "{type} 로드 실패"
				}
			}
		};
	}));
	var ja_exports = /* @__PURE__ */ __export({ ja: () => ja }, 1);
	var ja;
	var init_ja = __esmMin((() => {
		ja = {
			toolbar: {
				previous: "前へ",
				next: "次へ",
				download: "ダウンロード",
				downloadAll: "ZIPダウンロード",
				settings: "設定",
				close: "閉じる",
				tweetText: "ツイートテキスト",
				tweetTextPanel: "ツイートテキストパネル"
			},
			settings: {
				title: "設定",
				theme: "テーマ",
				language: "言語",
				themeAuto: "自動",
				themeLight: "ライト",
				themeDark: "ダーク",
				languageAuto: "自動 / Auto / 자동",
				languageKo: "한국어",
				languageEn: "English",
				languageJa: "日本語",
				close: "閉じる",
				gallery: { sectionTitle: "ギャラリー" }
			},
			messages: {
				errorBoundary: {
					title: "エラーが発生しました",
					body: "予期しないエラーが発生しました: {error}"
				},
				keyboardHelp: {
					title: "キーボードショートカット",
					navPrevious: "ArrowLeft: 前のメディア",
					navNext: "ArrowRight: 次のメディア",
					close: "Escape: ギャラリーを閉じる",
					toggleHelp: "?: このヘルプを表示"
				},
				download: {
					single: { error: {
						title: "ダウンロード失敗",
						body: "ファイルを取得できません: {error}"
					} },
					allFailed: {
						title: "ダウンロード失敗",
						body: "すべての項目をダウンロードできませんでした。"
					},
					partial: {
						title: "一部失敗",
						body: "{count}個の項目を取得できませんでした。"
					},
					retry: {
						action: "再試行",
						success: {
							title: "再試行成功",
							body: "失敗していた項目をすべて取得しました。"
						}
					},
					cancelled: {
						title: "ダウンロードがキャンセルされました",
						body: "要求したダウンロードはキャンセルされました。"
					}
				},
				gallery: {
					emptyTitle: "メディアがありません",
					emptyDescription: "表示する画像や動画がありません。",
					failedToLoadImage: "{type} の読み込みに失敗しました"
				}
			}
		};
	})), TRANSLATION_REGISTRY, LAZY_LANGUAGE_LOADERS;
	var init_translation_registry = __esmMin((() => {
		init_en();
		TRANSLATION_REGISTRY = Object.freeze({ en });
		LAZY_LANGUAGE_LOADERS = {
			ko: async () => {
				const { ko: ko$1 } = await __vitePreload(async () => {
					const { ko: ko$2 } = await Promise.resolve().then(() => (init_ko(), ko_exports));
					return { ko: ko$2 };
				}, void 0);
				return ko$1;
			},
			ja: async () => {
				const { ja: ja$1 } = await __vitePreload(async () => {
					const { ja: ja$2 } = await Promise.resolve().then(() => (init_ja(), ja_exports));
					return { ja: ja$2 };
				}, void 0);
				return ja$1;
			}
		};
	}));
	var TranslationCatalog;
	var init_translation_catalog = __esmMin((() => {
		init_translation_registry();
		TranslationCatalog = class {
			bundles = /* @__PURE__ */ new Map();
			fallbackLanguage;
			loadingPromises = /* @__PURE__ */ new Map();
			constructor(options = {}) {
				const { bundles = TRANSLATION_REGISTRY, fallbackLanguage = "en" } = options;
				this.fallbackLanguage = fallbackLanguage;
				this.registerBundles(bundles);
				if (!this.bundles.has(this.fallbackLanguage)) throw new Error(`Missing fallback language bundle: ${this.fallbackLanguage}`);
			}
			register(language, strings) {
				this.bundles.set(language, strings);
			}
			has(language) {
				return this.bundles.has(language);
			}
			get(language) {
				if (language && this.bundles.has(language)) return this.bundles.get(language);
				return this.bundles.get(this.fallbackLanguage);
			}
			async ensureLanguage(language) {
				if (this.bundles.has(language)) return false;
				const loader = LAZY_LANGUAGE_LOADERS[language];
				if (!loader) return false;
				const existingPromise = this.loadingPromises.get(language);
				if (existingPromise) {
					await existingPromise;
					return true;
				}
				const loadPromise = (async () => {
					const strings = await loader();
					this.register(language, strings);
				})();
				this.loadingPromises.set(language, loadPromise);
				try {
					await loadPromise;
					return true;
				} finally {
					this.loadingPromises.delete(language);
				}
			}
			canLazyLoad(language) {
				return language in LAZY_LANGUAGE_LOADERS;
			}
			keys() {
				return Array.from(this.bundles.keys());
			}
			availableLanguages() {
				const loaded$1 = new Set(this.bundles.keys());
				const lazyLoadable = Object.keys(LAZY_LANGUAGE_LOADERS);
				for (const lang of lazyLoadable) loaded$1.add(lang);
				return Array.from(loaded$1);
			}
			toRecord() {
				return Object.fromEntries(this.bundles.entries());
			}
			registerBundles(bundles) {
				for (const [language, strings] of Object.entries(bundles)) {
					if (!strings) continue;
					this.register(language, strings);
				}
			}
		};
	}));
	function resolveTranslationValue(dictionary, key) {
		const segments = key.split(".");
		let current = dictionary;
		for (const segment of segments) {
			if (!current || typeof current !== "object") return;
			current = current[segment];
		}
		return typeof current === "string" ? current : void 0;
	}
	var init_translation_utils = __esmMin((() => {}));
	var Translator;
	var init_translator = __esmMin((() => {
		init_language_types();
		init_translation_catalog();
		init_translation_utils();
		Translator = class {
			catalog;
			constructor(options = {}) {
				this.catalog = options instanceof TranslationCatalog ? options : new TranslationCatalog(options);
			}
			get languages() {
				return [...LANGUAGE_CODES];
			}
			async ensureLanguage(language) {
				await this.catalog.ensureLanguage(language);
			}
			translate(language, key, params) {
				const template$1 = resolveTranslationValue(this.catalog.get(language), key);
				if (!template$1) return key;
				if (!params) return template$1;
				return template$1.replace(/\{(\w+)\}/g, (_, placeholder$1) => {
					if (Object.hasOwn(params, placeholder$1)) return String(params[placeholder$1]);
					return `{${placeholder$1}}`;
				});
			}
		};
	}));
	var init_i18n$1 = __esmMin((() => {
		init_language_types();
		init_translation_registry();
		init_translation_catalog();
		init_translation_utils();
		init_translator();
	}));
	function createLifecycle(serviceName, options = {}) {
		const { onInitialize, onDestroy, silent = false } = options;
		let initialized = false;
		const noop = () => {};
		const log = silent || !logger?.info ? {
			info: noop,
			error: noop
		} : {
			info: logger.info.bind(logger),
			error: logger.error.bind(logger)
		};
		const initialize = async () => {
			if (initialized) return;
			log.info(`${serviceName} initializing...`);
			try {
				if (onInitialize) await onInitialize();
				initialized = true;
				log.info(`${serviceName} initialized`);
			} catch (error$1) {
				log.error(`${serviceName} initialization failed:`, error$1);
				throw error$1;
			}
		};
		const destroy = () => {
			if (!initialized) return;
			log.info(`${serviceName} destroying...`);
			try {
				if (onDestroy) onDestroy();
				log.info(`${serviceName} destroyed`);
			} catch (error$1) {
				log.error(`${serviceName} destroy failed:`, error$1);
			} finally {
				initialized = false;
			}
		};
		const isInitialized = () => initialized;
		return {
			initialize,
			destroy,
			isInitialized,
			serviceName
		};
	}
	var init_lifecycle = __esmMin((() => {
		init_logging();
	}));
	function safeParseInt(value, radix = 10) {
		const result = parseInt(value, radix);
		return Number.isNaN(result) ? 0 : result;
	}
	function clamp(value, min = 0, max = 1) {
		return Math.min(Math.max(value, min), max);
	}
	function clampIndex(index, length) {
		if (!Number.isFinite(index) || length <= 0) return 0;
		return clamp(Math.floor(index), 0, length - 1);
	}
	function isGMUserScriptInfo(obj) {
		if (obj === null || typeof obj !== "object") return false;
		const objRecord = obj;
		return "scriptHandler" in objRecord || Object.keys(objRecord).length > 0;
	}
	function cloneDeep(value) {
		if (typeof globalThis.structuredClone === "function") return globalThis.structuredClone(value);
		return JSON.parse(JSON.stringify(value));
	}
	var init_safety$1 = __esmMin((() => {}));
	function detectManager(global) {
		try {
			const info = typeof GM_info !== "undefined" ? GM_info : global.GM_info;
			const handler = isGMUserScriptInfo(info) ? info?.scriptHandler?.toLowerCase?.() : void 0;
			if (!handler) return "unknown";
			if (handler.includes("tamper")) return "tampermonkey";
			if (handler.includes("grease")) return "greasemonkey";
			if (handler.includes("violent")) return "violentmonkey";
			return "unknown";
		} catch {
			return "unknown";
		}
	}
	function safeInfo(global) {
		try {
			const info = typeof GM_info !== "undefined" ? GM_info : global.GM_info;
			return isGMUserScriptInfo(info) ? info : null;
		} catch {
			return null;
		}
	}
	function assertFunction(fn, errorMessage) {
		if (typeof fn !== "function") throw new Error(errorMessage);
		return fn;
	}
	function getUserscript() {
		const global = globalThis;
		const gmDownload = typeof GM_download !== "undefined" ? GM_download : typeof global.GM_download === "function" ? global.GM_download : void 0;
		const gmSetValue = typeof GM_setValue !== "undefined" ? GM_setValue : typeof global.GM_setValue === "function" ? global.GM_setValue : void 0;
		const gmGetValue = typeof GM_getValue !== "undefined" ? GM_getValue : typeof global.GM_getValue === "function" ? global.GM_getValue : void 0;
		const gmDeleteValue = typeof GM_deleteValue !== "undefined" ? GM_deleteValue : typeof global.GM_deleteValue === "function" ? global.GM_deleteValue : void 0;
		const gmListValues = typeof GM_listValues !== "undefined" ? GM_listValues : typeof global.GM_listValues === "function" ? global.GM_listValues : void 0;
		const gmAddStyle = typeof GM_addStyle !== "undefined" ? GM_addStyle : typeof global.GM_addStyle === "function" ? global.GM_addStyle : void 0;
		const gmXmlHttpRequest = typeof GM_xmlhttpRequest !== "undefined" ? GM_xmlhttpRequest : typeof global.GM_xmlhttpRequest === "function" ? global.GM_xmlhttpRequest : void 0;
		const gmCookie = typeof GM_cookie !== "undefined" ? GM_cookie : global.GM_cookie && typeof global.GM_cookie.list === "function" ? global.GM_cookie : void 0;
		const hasGM = Boolean(gmDownload || gmSetValue && gmGetValue || gmXmlHttpRequest);
		return Object.freeze({
			hasGM,
			manager: detectManager(global),
			info: () => safeInfo(global),
			async download(url, filename$1) {
				assertFunction(gmDownload, ERROR_MESSAGES.download)(url, filename$1);
			},
			async setValue(key, value) {
				const fn = assertFunction(gmSetValue, ERROR_MESSAGES.setValue);
				await Promise.resolve(fn(key, value));
			},
			async getValue(key, defaultValue) {
				const fn = assertFunction(gmGetValue, ERROR_MESSAGES.getValue);
				return await Promise.resolve(fn(key, defaultValue));
			},
			async deleteValue(key) {
				const fn = assertFunction(gmDeleteValue, ERROR_MESSAGES.deleteValue);
				await Promise.resolve(fn(key));
			},
			async listValues() {
				const fn = assertFunction(gmListValues, ERROR_MESSAGES.listValues);
				const values = await Promise.resolve(fn());
				return Array.isArray(values) ? values : [];
			},
			addStyle(css) {
				return assertFunction(gmAddStyle, ERROR_MESSAGES.addStyle)(css);
			},
			xmlHttpRequest(details) {
				return assertFunction(gmXmlHttpRequest, ERROR_MESSAGES.xmlHttpRequest)(details);
			},
			cookie: gmCookie
		});
	}
	var ERROR_MESSAGES;
	var init_adapter = __esmMin((() => {
		init_safety$1();
		ERROR_MESSAGES = {
			download: "GM_download not available - Tampermonkey/Greasemonkey environment required",
			setValue: "GM_setValue not available - Tampermonkey/Greasemonkey environment required",
			getValue: "GM_getValue not available - Tampermonkey/Greasemonkey environment required",
			deleteValue: "GM_deleteValue not available - Tampermonkey/Greasemonkey environment required",
			listValues: "GM_listValues not available - Tampermonkey/Greasemonkey environment required",
			addStyle: "GM_addStyle not available - Tampermonkey/Greasemonkey environment required",
			xmlHttpRequest: "GM_xmlhttpRequest not available - Tampermonkey/Greasemonkey environment required"
		};
	}));
	function isGMAPIAvailable(apiName) {
		const gm = globalThis;
		const checker = GM_API_CHECKS[apiName];
		if (!checker) return false;
		try {
			return checker(gm);
		} catch {
			return false;
		}
	}
	var GM_API_CHECKS;
	var init_environment_detector = __esmMin((() => {
		init_language_types();
		init_translation_registry();
		GM_API_CHECKS = {
			getValue: (gm) => typeof gm.GM_getValue === "function",
			setValue: (gm) => typeof gm.GM_setValue === "function",
			download: (gm) => typeof gm.GM_download === "function",
			notification: (gm) => typeof gm.GM_notification === "function",
			setClipboard: (gm) => typeof gm.GM_setClipboard === "function",
			registerMenuCommand: (gm) => typeof gm.GM_registerMenuCommand === "function",
			deleteValue: (gm) => typeof gm.GM_deleteValue === "function",
			listValues: (gm) => typeof gm.GM_listValues === "function",
			cookie: (gm) => typeof gm.GM_cookie?.list === "function"
		};
	}));
	var init_userscript = __esmMin((() => {
		init_adapter();
		init_environment_detector();
	}));
	var persistent_storage_exports = /* @__PURE__ */ __export({
		PersistentStorage: () => PersistentStorage,
		getPersistentStorage: () => getPersistentStorage
	}, 1);
	function getPersistentStorage() {
		return PersistentStorage.getInstance();
	}
	var PersistentStorage;
	var init_persistent_storage = __esmMin((() => {
		init_userscript();
		init_logging();
		init_singleton();
		PersistentStorage = class PersistentStorage {
			userscript = getUserscript();
			static singleton = createSingleton(() => new PersistentStorage());
			constructor() {}
			static getInstance() {
				return PersistentStorage.singleton.get();
			}
			static resetForTests() {
				PersistentStorage.singleton.reset();
			}
			async set(key, value) {
				try {
					const serialized = typeof value === "string" ? value : JSON.stringify(value);
					await this.userscript.setValue(key, serialized);
				} catch (error$1) {
					logger.error(`PersistentStorage.set failed for "${key}":`, error$1);
					throw error$1;
				}
			}
			async get(key, defaultValue) {
				try {
					const value = await this.userscript.getValue(key);
					if (value === void 0 || value === null) return defaultValue;
					try {
						return JSON.parse(value);
					} catch {
						return value;
					}
				} catch (error$1) {
					if (error$1 instanceof Error && error$1.message.includes("GM_getValue not available")) return defaultValue;
					logger.error(`PersistentStorage.get failed for "${key}":`, error$1);
					return defaultValue;
				}
			}
			async has(key) {
				try {
					const value = await this.userscript.getValue(key);
					return value !== void 0 && value !== null;
				} catch {
					return false;
				}
			}
			getSync(key, defaultValue) {
				try {
					const gmGetValue = typeof GM_getValue !== "undefined" ? GM_getValue : window.GM_getValue;
					if (!gmGetValue) return defaultValue;
					const value = gmGetValue(key);
					if (value instanceof Promise) return defaultValue;
					if (value === void 0 || value === null) return defaultValue;
					try {
						return JSON.parse(value);
					} catch {
						return value;
					}
				} catch {
					return defaultValue;
				}
			}
			async remove(key) {
				try {
					await this.userscript.deleteValue(key);
				} catch (error$1) {
					logger.error(`PersistentStorage.remove failed for "${key}":`, error$1);
					throw error$1;
				}
			}
		};
	}));
	var translationCatalog, translator, LanguageService;
	var init_language_service = __esmMin((() => {
		init_language_types();
		init_translation_registry();
		init_i18n$1();
		init_logging();
		init_lifecycle();
		init_persistent_storage();
		init_singleton();
		translationCatalog = new TranslationCatalog({
			bundles: TRANSLATION_REGISTRY,
			fallbackLanguage: "en"
		});
		translator = new Translator(translationCatalog);
		LanguageService = class LanguageService {
			lifecycle;
			static STORAGE_KEY = "xeg-language";
			static SUPPORTED_LANGUAGES = new Set(["auto", ...LANGUAGE_CODES]);
			currentLanguage = "auto";
			listeners = /* @__PURE__ */ new Set();
			storage = getPersistentStorage();
			static singleton = createSingleton(() => new LanguageService());
			static getInstance() {
				return LanguageService.singleton.get();
			}
			static resetForTests() {
				LanguageService.singleton.reset();
			}
			constructor() {
				this.lifecycle = createLifecycle("LanguageService", {
					onInitialize: () => this.onInitialize(),
					onDestroy: () => this.onDestroy()
				});
			}
			async initialize() {
				return this.lifecycle.initialize();
			}
			destroy() {
				this.lifecycle.destroy();
			}
			isInitialized() {
				return this.lifecycle.isInitialized();
			}
			async onInitialize() {
				try {
					const saved = await this.storage.get(LanguageService.STORAGE_KEY);
					const normalized = this.normalizeLanguage(saved);
					if (normalized !== this.currentLanguage) {
						this.currentLanguage = normalized;
						this.notifyListeners(normalized);
					}
					const effectiveLang = this.getEffectiveLanguage();
					await this.ensureLanguageLoaded(effectiveLang);
				} catch (error$1) {
					logger.warn("Failed to restore language setting from storage:", error$1);
				}
			}
			onDestroy() {
				this.listeners.clear();
			}
			detectLanguage() {
				const browserLang = typeof navigator !== "undefined" && navigator.language ? navigator.language.slice(0, 2) : "en";
				if (isBaseLanguageCode(browserLang)) return browserLang;
				return "en";
			}
			getCurrentLanguage() {
				return this.currentLanguage;
			}
			getAvailableLanguages() {
				return [...LANGUAGE_CODES];
			}
			setLanguage(language) {
				const normalized = this.normalizeLanguage(language);
				if (language !== normalized && language !== "auto") logger.warn(`Unsupported language: ${language}, falling back to '${normalized}'`);
				if (this.currentLanguage === normalized) return;
				this.currentLanguage = normalized;
				this.notifyListeners(normalized);
				this.persistLanguage(normalized);
				const effectiveLang = this.getEffectiveLanguage();
				this.ensureLanguageLoaded(effectiveLang);
				logger.debug(`Language changed to: ${normalized}`);
			}
			async ensureLanguageLoaded(language) {
				try {
					await translator.ensureLanguage(language);
				} catch (error$1) {
					logger.warn(`Failed to load language bundle: ${language}`, error$1);
				}
			}
			translate(key, params) {
				return translator.translate(this.getEffectiveLanguage(), key, params);
			}
			onLanguageChange(callback) {
				this.listeners.add(callback);
				return () => this.listeners.delete(callback);
			}
			normalizeLanguage(language) {
				if (!language) return "auto";
				if (LanguageService.SUPPORTED_LANGUAGES.has(language)) return language;
				return "en";
			}
			notifyListeners(language) {
				this.listeners.forEach((listener) => {
					try {
						listener(language);
					} catch (error$1) {
						logger.warn("Language change listener error:", error$1);
					}
				});
			}
			async persistLanguage(language) {
				try {
					await this.storage.set(LanguageService.STORAGE_KEY, language);
				} catch (error$1) {
					logger.warn("Failed to persist language setting:", error$1);
				}
			}
			getEffectiveLanguage() {
				return this.currentLanguage === "auto" ? this.detectLanguage() : this.currentLanguage;
			}
		};
	}));
	var HttpError, HttpRequestService;
	var init_http_request_service = __esmMin((() => {
		init_adapter();
		init_singleton();
		HttpError = class extends Error {
			constructor(message, status, statusText) {
				super(message);
				this.status = status;
				this.statusText = statusText;
				this.name = "HttpError";
			}
		};
		HttpRequestService = class HttpRequestService {
			static singleton = createSingleton(() => new HttpRequestService());
			defaultTimeout = 1e4;
			constructor() {}
			async request(method, url, options) {
				return new Promise((resolve$1, reject) => {
					try {
						const userscript = getUserscript();
						const details = {
							method,
							url,
							headers: options?.headers || {},
							timeout: options?.timeout ?? this.defaultTimeout,
							responseType: options?.responseType,
							onload: (response) => {
								const headers = {};
								if (response.responseHeaders) response.responseHeaders.split("\r\n").forEach((line) => {
									const parts = line.split(": ");
									if (parts.length >= 2 && parts[0]) headers[parts[0].toLowerCase()] = parts.slice(1).join(": ");
								});
								resolve$1({
									ok: response.status >= 200 && response.status < 300,
									status: response.status,
									statusText: response.statusText,
									data: response.response,
									headers
								});
							},
							onerror: (response) => {
								reject(new HttpError(response.statusText || "Network Error", response.status, response.statusText));
							},
							ontimeout: () => {
								reject(new HttpError("Request timeout", 0, "Timeout"));
							},
							onabort: () => {
								reject(/* @__PURE__ */ new Error("Request was aborted"));
							}
						};
						if (options && "data" in options && options.data) {
							const data = options.data;
							if (typeof data === "object" && !(data instanceof Blob) && !(data instanceof ArrayBuffer) && !(data instanceof Uint8Array) && !(data instanceof FormData) && !(data instanceof URLSearchParams)) {
								details.data = JSON.stringify(data);
								if (!details.headers["content-type"]) details.headers["content-type"] = "application/json";
							} else details.data = data;
						}
						if (options && options.contentType && !details.headers["content-type"]) details.headers["content-type"] = options.contentType;
						const control = userscript.xmlHttpRequest(details);
						if (options?.signal) options.signal.addEventListener("abort", () => {
							control.abort();
						});
					} catch (error$1) {
						reject(error$1);
					}
				});
			}
			static getInstance() {
				return HttpRequestService.singleton.get();
			}
			static resetForTests() {
				HttpRequestService.singleton.reset();
			}
			async get(url, options) {
				return this.request("GET", url, options);
			}
			async post(url, data, options) {
				return this.request("POST", url, {
					...options,
					data
				});
			}
			async put(url, data, options) {
				return this.request("PUT", url, {
					...options,
					data
				});
			}
			async delete(url, options) {
				return this.request("DELETE", url, options);
			}
			async patch(url, data, options) {
				return this.request("PATCH", url, {
					...options,
					data
				});
			}
			async postBinary(url, data, options) {
				const contentType = options?.contentType ?? "application/octet-stream";
				return await this.request("POST", url, {
					...options,
					data,
					contentType
				});
			}
		};
	}));
	var TimerManager, globalTimerManager;
	var init_timer_management = __esmMin((() => {
		TimerManager = class {
			timers = /* @__PURE__ */ new Set();
			setTimeout(callback, delay) {
				const id = window.setTimeout(() => {
					this.timers.delete(id);
					callback();
				}, delay);
				this.timers.add(id);
				return id;
			}
			clearTimeout(id) {
				if (this.timers.has(id)) {
					window.clearTimeout(id);
					this.timers.delete(id);
				}
			}
			cleanup() {
				this.timers.forEach((id) => window.clearTimeout(id));
				this.timers.clear();
			}
			getActiveTimersCount() {
				return this.timers.size;
			}
		};
		globalTimerManager = new TimerManager();
	}));
	function scheduleIdle(task) {
		const { ric, cic } = getIdleAPIs();
		if (ric) {
			const id = ric(() => {
				try {
					task();
				} catch {}
			});
			return { cancel: () => {
				cic?.(id);
			} };
		}
		const timerId = globalTimerManager.setTimeout(() => {
			try {
				task();
			} catch {}
		}, 0);
		return { cancel: () => {
			globalTimerManager.clearTimeout(timerId);
		} };
	}
	var getIdleAPIs;
	var init_idle_scheduler = __esmMin((() => {
		init_timer_management();
		getIdleAPIs = () => {
			const source = typeof globalThis !== "undefined" ? globalThis : void 0;
			return {
				ric: source && typeof source === "object" && "requestIdleCallback" in source ? source.requestIdleCallback || null : null,
				cic: source && typeof source === "object" && "cancelIdleCallback" in source ? source.cancelIdleCallback || null : null
			};
		};
	}));
	var observerPool, elementCallbackMap, callbackIdCounter, createObserverKey, getObserver, SharedObserver;
	var init_observer_pool = __esmMin((() => {
		observerPool = /* @__PURE__ */ new Map();
		elementCallbackMap = /* @__PURE__ */ new WeakMap();
		callbackIdCounter = 0;
		createObserverKey = (options = {}) => {
			return `${options.rootMargin ?? "0px"}|${Array.isArray(options.threshold) ? options.threshold.join(",") : `${options.threshold ?? 0}`}`;
		};
		getObserver = (key, options) => {
			let observer = observerPool.get(key);
			if (observer) return observer;
			observer = new IntersectionObserver((entries) => {
				entries.forEach((entry) => {
					const callbacks = elementCallbackMap.get(entry.target)?.get(key);
					if (!callbacks || callbacks.size === 0) return;
					callbacks.forEach((cb) => {
						try {
							cb(entry);
						} catch {}
					});
				});
			}, options);
			observerPool.set(key, observer);
			return observer;
		};
		SharedObserver = {
			observe(element, callback, options = {}) {
				const key = createObserverKey(options);
				const observer = getObserver(key, options);
				let callbacksByKey = elementCallbackMap.get(element);
				if (!callbacksByKey) {
					callbacksByKey = /* @__PURE__ */ new Map();
					elementCallbackMap.set(element, callbacksByKey);
				}
				let callbacks = callbacksByKey.get(key);
				if (!callbacks) {
					callbacks = /* @__PURE__ */ new Map();
					callbacksByKey.set(key, callbacks);
				}
				const callbackId = ++callbackIdCounter;
				const isFirstForKey = callbacks.size === 0;
				callbacks.set(callbackId, callback);
				if (isFirstForKey) observer.observe(element);
				let isActive = true;
				const unsubscribe = () => {
					if (!isActive) return;
					isActive = false;
					const callbacksByKeyCurrent = elementCallbackMap.get(element);
					const callbacksForKey = callbacksByKeyCurrent?.get(key);
					callbacksForKey?.delete(callbackId);
					if (callbacksForKey && callbacksForKey.size === 0) {
						callbacksByKeyCurrent?.delete(key);
						observer.unobserve(element);
					}
					if (!callbacksByKeyCurrent || callbacksByKeyCurrent.size === 0) elementCallbackMap.delete(element);
				};
				return unsubscribe;
			},
			unobserve(element) {
				const callbacksByKey = elementCallbackMap.get(element);
				if (!callbacksByKey) return;
				callbacksByKey.forEach((_callbacks, key) => {
					observerPool.get(key)?.unobserve(element);
				});
				elementCallbackMap.delete(element);
			}
		};
	}));
	function computePreloadIndices(currentIndex$1, total, count) {
		const safeTotal = Number.isFinite(total) && total > 0 ? Math.floor(total) : 0;
		const safeIndex = clampIndex(Math.floor(currentIndex$1), safeTotal);
		const safeCount = clamp(Math.floor(count), 0, 20);
		if (safeTotal === 0 || safeCount === 0) return [];
		const indices = [];
		for (let i = 1; i <= safeCount; i++) {
			const idx = safeIndex - i;
			if (idx >= 0) indices.push(idx);
			else break;
		}
		for (let i = 1; i <= safeCount; i++) {
			const idx = safeIndex + i;
			if (idx < safeTotal) indices.push(idx);
			else break;
		}
		return indices;
	}
	var init_preload$1 = __esmMin((() => {
		init_safety$1();
	}));
	var init_performance = __esmMin((() => {
		init_idle_scheduler();
		init_observer_pool();
		init_preload$1();
	}));
	var PrefetchManager;
	var init_prefetch_manager = __esmMin((() => {
		init_http_request_service();
		init_performance();
		PrefetchManager = class {
			cache = /* @__PURE__ */ new Map();
			activeRequests = /* @__PURE__ */ new Map();
			maxEntries;
			constructor(maxEntries = 20) {
				this.maxEntries = maxEntries;
			}
			async prefetch(media, schedule = "idle") {
				if (schedule === "immediate") {
					await this.prefetchSingle(media.url);
					return;
				}
				scheduleIdle(() => {
					this.prefetchSingle(media.url).catch(() => {});
				});
			}
			get(url) {
				return this.cache.get(url) ?? null;
			}
			has(url) {
				return this.cache.has(url);
			}
			cancelAll() {
				for (const controller of this.activeRequests.values()) controller.abort();
				this.activeRequests.clear();
			}
			clear() {
				this.cache.clear();
			}
			getCache() {
				return this.cache;
			}
			destroy() {
				this.cancelAll();
				this.clear();
			}
			async prefetchSingle(url) {
				if (this.cache.has(url)) return;
				const controller = new AbortController();
				this.activeRequests.set(url, controller);
				const fetchPromise = HttpRequestService.getInstance().get(url, {
					signal: controller.signal,
					responseType: "blob"
				}).then((response) => {
					if (!response.ok) throw new Error(`HTTP ${response.status}`);
					return response.data;
				}).finally(() => {
					this.activeRequests.delete(url);
				});
				if (this.cache.size >= this.maxEntries) this.evictOldest();
				this.cache.set(url, fetchPromise);
				fetchPromise.catch(() => {
					if (this.cache.get(url) === fetchPromise) this.cache.delete(url);
				});
				await fetchPromise.catch(() => {});
			}
			evictOldest() {
				const first = this.cache.keys().next().value;
				if (first) this.cache.delete(first);
			}
		};
	}));
	var CLASS_PREFIX, toSelector, toAttributeSelector, CLASSES, DATA_ATTRIBUTES, SELECTORS$1, INTERNAL_SELECTORS, SCOPES, CSS;
	var init_css = __esmMin((() => {
		CLASS_PREFIX = "xeg";
		toSelector = (className$1) => `.${className$1}`;
		toAttributeSelector = (attribute, value) => value ? `[${attribute}="${value}"]` : `[${attribute}]`;
		CLASSES = {
			OVERLAY: `${CLASS_PREFIX}-gallery-overlay`,
			CONTAINER: `${CLASS_PREFIX}-gallery-container`,
			ROOT: `${CLASS_PREFIX}-gallery-root`,
			RENDERER: `${CLASS_PREFIX}-gallery-renderer`,
			VERTICAL_VIEW: `${CLASS_PREFIX}-vertical-gallery`,
			ITEM: `${CLASS_PREFIX}-gallery-item`,
			LEGACY_SCOPE: `${CLASS_PREFIX}-gallery`
		};
		DATA_ATTRIBUTES = {
			GALLERY: "data-xeg-gallery",
			CONTAINER: "data-xeg-gallery-container",
			ELEMENT: "data-gallery-element",
			ROLE: "data-xeg-role",
			ROLE_COMPAT: "data-xeg-role-compat",
			GALLERY_TYPE: "data-xeg-gallery-type",
			GALLERY_VERSION: "data-xeg-gallery-version"
		};
		SELECTORS$1 = {
			OVERLAY: toSelector(CLASSES.OVERLAY),
			CONTAINER: toSelector(CLASSES.CONTAINER),
			ROOT: toSelector(CLASSES.ROOT),
			RENDERER: toSelector(CLASSES.RENDERER),
			VERTICAL_VIEW: toSelector(CLASSES.VERTICAL_VIEW),
			ITEM: toSelector(CLASSES.ITEM),
			LEGACY_SCOPE: toSelector(CLASSES.LEGACY_SCOPE),
			DATA_GALLERY: toAttributeSelector(DATA_ATTRIBUTES.GALLERY),
			DATA_CONTAINER: toAttributeSelector(DATA_ATTRIBUTES.CONTAINER),
			DATA_ELEMENT: toAttributeSelector(DATA_ATTRIBUTES.ELEMENT),
			DATA_ROLE: toAttributeSelector(DATA_ATTRIBUTES.ROLE),
			DATA_ROLE_COMPAT: toAttributeSelector(DATA_ATTRIBUTES.ROLE_COMPAT),
			DATA_GALLERY_TYPE: toAttributeSelector(DATA_ATTRIBUTES.GALLERY_TYPE),
			DATA_GALLERY_VERSION: toAttributeSelector(DATA_ATTRIBUTES.GALLERY_VERSION),
			ROLE_GALLERY: toAttributeSelector(DATA_ATTRIBUTES.ROLE, "gallery"),
			ROLE_ITEMS_CONTAINER: toAttributeSelector(DATA_ATTRIBUTES.ROLE, "items-container")
		};
		INTERNAL_SELECTORS = Object.freeze(Array.from(new Set([
			SELECTORS$1.OVERLAY,
			SELECTORS$1.CONTAINER,
			SELECTORS$1.ROOT,
			SELECTORS$1.RENDERER,
			SELECTORS$1.VERTICAL_VIEW,
			SELECTORS$1.ITEM,
			SELECTORS$1.LEGACY_SCOPE,
			SELECTORS$1.DATA_GALLERY,
			SELECTORS$1.DATA_CONTAINER,
			SELECTORS$1.DATA_ELEMENT,
			SELECTORS$1.DATA_ROLE,
			SELECTORS$1.DATA_ROLE_COMPAT,
			SELECTORS$1.DATA_GALLERY_TYPE,
			SELECTORS$1.DATA_GALLERY_VERSION,
			SELECTORS$1.ROLE_GALLERY,
			SELECTORS$1.ROLE_ITEMS_CONTAINER
		].filter(Boolean))));
		SCOPES = { HOSTS: Object.freeze(Array.from(new Set([
			SELECTORS$1.ROOT,
			SELECTORS$1.DATA_GALLERY,
			SELECTORS$1.CONTAINER,
			SELECTORS$1.DATA_CONTAINER
		]))) };
		CSS = {
			CLASSES,
			DATA_ATTRIBUTES,
			SELECTORS: SELECTORS$1,
			INTERNAL_SELECTORS,
			SCOPES
		};
	}));
	function queryWithFallback(container$2, primarySelector, fallbacks = []) {
		const primary$1 = container$2.querySelector(primarySelector);
		if (primary$1) return primary$1;
		for (const fallback of fallbacks) {
			const element = container$2.querySelector(fallback);
			if (element) return element;
		}
		return null;
	}
	function queryAllWithFallback(container$2, selectors) {
		const seen$1 = /* @__PURE__ */ new WeakSet();
		const results = [];
		for (const selector of selectors) try {
			const elements = container$2.querySelectorAll(selector);
			for (const element of elements) if (!seen$1.has(element)) {
				seen$1.add(element);
				results.push(element);
			}
		} catch {}
		return results;
	}
	var GALLERY_SELECTORS$1, SELECTORS, FALLBACK_SELECTORS, STABLE_SELECTORS;
	var init_selectors = __esmMin((() => {
		init_css();
		GALLERY_SELECTORS$1 = CSS.SELECTORS;
		SELECTORS = {
			TWEET: "article[data-testid=\"tweet\"]",
			TWEET_ARTICLE: "[data-testid=\"tweet\"], article",
			TWEET_PHOTO: "[data-testid=\"tweetPhoto\"]",
			TWEET_TEXT: "[data-testid=\"tweetText\"]",
			VIDEO_PLAYER: "[data-testid=\"videoPlayer\"]",
			STATUS_LINK: "a[href*=\"/status/\"]",
			TWITTER_IMAGE: "img[src*=\"pbs.twimg.com\"]",
			TWITTER_VIDEO: "video[src*=\"video.twimg.com\"]",
			TWITTER_MEDIA: "img[src*=\"pbs.twimg.com\"], video[src*=\"video.twimg.com\"]",
			GALLERY_OVERLAY: GALLERY_SELECTORS$1.OVERLAY,
			GALLERY_CONTAINER: GALLERY_SELECTORS$1.CONTAINER
		};
		FALLBACK_SELECTORS = {
			TWEET: [
				"article[role=\"article\"]",
				"article[aria-labelledby]",
				"[data-testid=\"cellInnerDiv\"] > div > article"
			],
			TWEET_PHOTO: [
				"[aria-label*=\"Image\"]",
				"[role=\"img\"][aria-label]",
				"a[href*=\"/photo/\"] img",
				"div[aria-label] img[src*=\"pbs.twimg.com\"]"
			],
			TWEET_TEXT: [
				"[lang][dir=\"auto\"]",
				"div[data-testid=\"tweetText\"]",
				"article [lang]"
			],
			VIDEO_PLAYER: [
				"[aria-label*=\"Video\"]",
				"[role=\"application\"] video",
				"div[data-testid=\"videoComponent\"]",
				"video[src*=\"video.twimg.com\"]"
			],
			MODAL: [
				"[aria-modal=\"true\"]",
				"[role=\"dialog\"]",
				"[aria-label*=\"Close\"]"
			],
			MEDIA_VIEWER: [
				"[aria-roledescription=\"carousel\"]",
				"[aria-label*=\"Gallery\"]",
				"[role=\"dialog\"][aria-modal=\"true\"]"
			]
		};
		STABLE_SELECTORS = {
			TWEET_CONTAINERS: [
				"article[data-testid=\"tweet\"]",
				"article[role=\"article\"]",
				"[data-testid=\"cellInnerDiv\"] article"
			],
			MEDIA_CONTAINERS: [
				"[data-testid=\"tweetPhoto\"]",
				"[data-testid=\"videoPlayer\"]",
				"[aria-label*=\"Image\"]",
				"[aria-label*=\"Video\"]",
				"a[href*=\"/photo/\"] > div"
			],
			VIDEO_CONTAINERS: [
				"[data-testid=\"videoPlayer\"]",
				"video",
				"[aria-label*=\"Video\"]",
				"[data-testid=\"videoComponent\"]"
			],
			IMAGE_CONTAINERS: [
				"[data-testid=\"tweetPhoto\"]",
				"img[src*=\"pbs.twimg.com\"]",
				"[aria-label*=\"Image\"] img",
				"a[href*=\"/photo/\"] img"
			],
			MEDIA_LINKS: [
				"a[href*=\"/status/\"][href*=\"/photo/\"]",
				"a[href*=\"/status/\"][href*=\"/video/\"]",
				"a[href*=\"/photo/\"][aria-label]",
				"a[href*=\"/video/\"][aria-label]"
			],
			MEDIA_VIEWERS: [
				"[data-testid=\"photoViewer\"]",
				"[aria-modal=\"true\"][data-testid=\"Drawer\"]",
				"[aria-roledescription=\"carousel\"]",
				"[role=\"dialog\"][aria-modal=\"true\"]",
				"[aria-label*=\"Gallery\"]"
			],
			MEDIA_PLAYERS: [
				"[data-testid=\"videoPlayer\"]",
				"video",
				"[role=\"application\"] video"
			],
			ACTION_BUTTONS: {
				like: "[data-testid=\"like\"]",
				retweet: "[data-testid=\"retweet\"]",
				reply: "[data-testid=\"reply\"]",
				share: "[data-testid=\"share\"]",
				bookmark: "[data-testid=\"bookmark\"]"
			},
			QUOTED_TWEET_ARTICLE: "article[data-testid=\"tweet\"] article[data-testid=\"tweet\"]",
			QUOTED_TWEET_FALLBACK: ["article[role=\"article\"] article[role=\"article\"]", "[data-testid=\"quoteTweet\"]"]
		};
	}));
	function removeDuplicates(items, keyExtractor) {
		const seen$1 = /* @__PURE__ */ new Set();
		const uniqueItems = [];
		for (const item of items) {
			if (!item) continue;
			const key = keyExtractor(item);
			if (!key) {
				logger.warn("Skipping item without key");
				continue;
			}
			if (!seen$1.has(key)) {
				seen$1.add(key);
				uniqueItems.push(item);
			}
		}
		return uniqueItems;
	}
	function removeDuplicateMediaItems(mediaItems) {
		if (!mediaItems?.length) return [];
		const result = removeDuplicates(mediaItems, (item) => item.originalUrl ?? item.url);
		{
			const removedCount = mediaItems.length - result.length;
			if (removedCount > 0) logger.debug("Removed duplicate media items:", {
				original: mediaItems.length,
				unique: result.length,
				removed: removedCount
			});
		}
		return result;
	}
	function extractVisualIndexFromUrl(url) {
		if (!url) return 0;
		const match = url.match(/\/(photo|video)\/(\d+)$/);
		const visualNumber = match?.[2] ? Number.parseInt(match[2], 10) : NaN;
		return Number.isFinite(visualNumber) && visualNumber > 0 ? visualNumber - 1 : 0;
	}
	function sortMediaByVisualOrder(mediaItems) {
		if (mediaItems.length <= 1) return mediaItems;
		const withVisualIndex = mediaItems.map((media) => {
			return {
				media,
				visualIndex: extractVisualIndexFromUrl(media.expanded_url || "")
			};
		});
		withVisualIndex.sort((a, b) => a.visualIndex - b.visualIndex);
		return withVisualIndex.map(({ media }, newIndex) => ({
			...media,
			index: newIndex
		}));
	}
	function extractDimensionsFromUrl(url) {
		if (!url) return null;
		const match = url.match(/\/(\d{2,6})x(\d{2,6})\//);
		if (!match) return null;
		const width = Number.parseInt(match[1] ?? "", 10);
		const height = Number.parseInt(match[2] ?? "", 10);
		if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) return null;
		return {
			width,
			height
		};
	}
	function normalizeDimension(value) {
		if (typeof value === "number" && Number.isFinite(value) && value > 0) return Math.round(value);
		if (typeof value === "string") {
			const parsed = Number.parseFloat(value);
			if (Number.isFinite(parsed) && parsed > 0) return Math.round(parsed);
		}
		return null;
	}
	function normalizeMediaUrl(url) {
		if (!url) return null;
		try {
			let filename$1 = new URL(url).pathname.split("/").pop();
			if (filename$1) {
				const dotIndex = filename$1.lastIndexOf(".");
				if (dotIndex !== -1) filename$1 = filename$1.substring(0, dotIndex);
			}
			return filename$1 && filename$1.length > 0 ? filename$1 : null;
		} catch {
			try {
				const lastSlash = url.lastIndexOf("/");
				if (lastSlash === -1) return null;
				let filenamePart = url.substring(lastSlash + 1);
				const queryIndex = filenamePart.indexOf("?");
				if (queryIndex !== -1) filenamePart = filenamePart.substring(0, queryIndex);
				const hashIndex = filenamePart.indexOf("#");
				if (hashIndex !== -1) filenamePart = filenamePart.substring(0, hashIndex);
				const dotIndex = filenamePart.lastIndexOf(".");
				if (dotIndex !== -1) filenamePart = filenamePart.substring(0, dotIndex);
				return filenamePart.length > 0 ? filenamePart : null;
			} catch {
				return null;
			}
		}
	}
	function scaleAspectRatio(widthRatio, heightRatio) {
		if (heightRatio <= 0 || widthRatio <= 0) return DEFAULT_DIMENSIONS;
		const scaledHeight = STANDARD_GALLERY_HEIGHT;
		return {
			width: Math.max(1, Math.round(widthRatio / heightRatio * scaledHeight)),
			height: scaledHeight
		};
	}
	function extractDimensionsFromMetadataObject(dimensions) {
		if (!dimensions) return null;
		const width = normalizeDimension(dimensions.width);
		const height = normalizeDimension(dimensions.height);
		if (width && height) return {
			width,
			height
		};
		return null;
	}
	function extractDimensionsFromUrlCandidate(candidate) {
		if (typeof candidate !== "string" || !candidate) return null;
		return extractDimensionsFromUrl(candidate);
	}
	function deriveDimensionsFromMetadata(metadata$1) {
		if (!metadata$1) return null;
		const dimensions = extractDimensionsFromMetadataObject(metadata$1.dimensions);
		if (dimensions) return dimensions;
		const apiData = metadata$1.apiData;
		if (!apiData) return null;
		const originalWidth = normalizeDimension(apiData.original_width ?? apiData.originalWidth);
		const originalHeight = normalizeDimension(apiData.original_height ?? apiData.originalHeight);
		if (originalWidth && originalHeight) return {
			width: originalWidth,
			height: originalHeight
		};
		const fromDownloadUrl = extractDimensionsFromUrlCandidate(apiData.download_url);
		if (fromDownloadUrl) return fromDownloadUrl;
		const fromPreviewUrl = extractDimensionsFromUrlCandidate(apiData.preview_url);
		if (fromPreviewUrl) return fromPreviewUrl;
		const aspectRatio = apiData.aspect_ratio;
		if (Array.isArray(aspectRatio) && aspectRatio.length >= 2) {
			const ratioWidth = normalizeDimension(aspectRatio[0]);
			const ratioHeight = normalizeDimension(aspectRatio[1]);
			if (ratioWidth && ratioHeight) return scaleAspectRatio(ratioWidth, ratioHeight);
		}
		return null;
	}
	function deriveDimensionsFromMediaUrls(media) {
		const candidates = [
			media.url,
			media.originalUrl,
			media.thumbnailUrl
		];
		for (const candidate of candidates) {
			const dimensions = extractDimensionsFromUrlCandidate(candidate);
			if (dimensions) return dimensions;
		}
		return null;
	}
	function resolveMediaDimensions(media) {
		if (!media) return DEFAULT_DIMENSIONS;
		const directWidth = normalizeDimension(media.width);
		const directHeight = normalizeDimension(media.height);
		if (directWidth && directHeight) return {
			width: directWidth,
			height: directHeight
		};
		const fromMetadata = deriveDimensionsFromMetadata(media.metadata);
		if (fromMetadata) return fromMetadata;
		const fromUrls = deriveDimensionsFromMediaUrls(media);
		if (fromUrls) return fromUrls;
		return DEFAULT_DIMENSIONS;
	}
	function toRem(pixels) {
		return `${(pixels / 16).toFixed(4)}rem`;
	}
	function createIntrinsicSizingStyle(dimensions) {
		const ratio = dimensions.height > 0 ? dimensions.width / dimensions.height : 1;
		return {
			"--xeg-aspect-default": `${dimensions.width} / ${dimensions.height}`,
			"--xeg-gallery-item-intrinsic-width": toRem(dimensions.width),
			"--xeg-gallery-item-intrinsic-height": toRem(dimensions.height),
			"--xeg-gallery-item-intrinsic-ratio": ratio.toFixed(6)
		};
	}
	function adjustClickedIndexAfterDeduplication(originalItems, uniqueItems, originalClickedIndex) {
		if (uniqueItems.length === 0) return 0;
		const clickedItem = originalItems[clampIndex(originalClickedIndex, originalItems.length)];
		if (!clickedItem) return 0;
		const clickedKey = clickedItem.originalUrl ?? clickedItem.url;
		const newIndex = uniqueItems.findIndex((item) => {
			return (item.originalUrl ?? item.url) === clickedKey;
		});
		return newIndex >= 0 ? newIndex : 0;
	}
	var STANDARD_GALLERY_HEIGHT, DEFAULT_DIMENSIONS;
	var init_media_utils = __esmMin((() => {
		init_logging();
		init_safety$1();
		STANDARD_GALLERY_HEIGHT = 720;
		DEFAULT_DIMENSIONS = {
			width: 540,
			height: STANDARD_GALLERY_HEIGHT
		};
	}));
	function tryParseUrl(value, base = FALLBACK_BASE_URL) {
		if (value instanceof URL) return value;
		if (typeof value !== "string") return null;
		const trimmed = value.trim();
		if (!trimmed) return null;
		try {
			if (trimmed.startsWith("//")) return new URL(`https:${trimmed}`);
			return new URL(trimmed, base);
		} catch {
			return null;
		}
	}
	function isHostMatching(value, allowedHosts, options = {}) {
		if (!Array.isArray(allowedHosts)) return false;
		const parsed = tryParseUrl(value);
		if (!parsed) return false;
		const hostname = parsed.hostname.toLowerCase();
		const allowSubdomains = options.allowSubdomains === true;
		return allowedHosts.some((host) => {
			const normalized = host.toLowerCase();
			if (hostname === normalized) return true;
			return allowSubdomains && hostname.endsWith(`.${normalized}`);
		});
	}
	function extractUsernameFromUrl(url, options = {}) {
		if (!url || typeof url !== "string") return null;
		try {
			let path;
			if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("//")) {
				const parsed = tryParseUrl(url);
				if (!parsed) return null;
				if (options.strictHost) {
					if (!isHostMatching(parsed, TWITTER_HOSTS, { allowSubdomains: true })) return null;
				}
				path = parsed.pathname;
			} else path = url;
			const segments = path.split("/").filter(Boolean);
			if (segments.length >= 3 && segments[1] === "status") {
				const username = segments[0];
				if (!username) return null;
				if (RESERVED_TWITTER_PATHS.has(username.toLowerCase())) return null;
				if (TWITTER_USERNAME_PATTERN.test(username)) return username;
			}
			return null;
		} catch {
			return null;
		}
	}
	var FALLBACK_BASE_URL, RESERVED_TWITTER_PATHS, TWITTER_USERNAME_PATTERN, TWITTER_HOSTS;
	var init_host = __esmMin((() => {
		FALLBACK_BASE_URL = "https://x.com";
		RESERVED_TWITTER_PATHS = new Set([
			"home",
			"explore",
			"notifications",
			"messages",
			"search",
			"settings",
			"i",
			"intent",
			"compose",
			"hashtag"
		]);
		TWITTER_USERNAME_PATTERN = /^[a-zA-Z0-9_]{1,15}$/;
		TWITTER_HOSTS = ["twitter.com", "x.com"];
	}));
	function isUrlAllowed(rawUrl, policy) {
		if (!rawUrl || typeof rawUrl !== "string") return false;
		const normalized = rawUrl.replace(CONTROL_CHARS_REGEX, "").trim();
		if (!normalized) return false;
		if (startsWithBlockedProtocolHint(normalized, policy.blockedProtocolHints ?? DEFAULT_BLOCKED_PROTOCOL_HINTS)) return false;
		const lower = normalized.toLowerCase();
		if (lower.startsWith("data:")) return policy.allowDataUrls === true && isAllowedDataUrl(lower, policy.allowedDataMimePrefixes);
		if (lower.startsWith("//")) return handleProtocolRelative(normalized, policy);
		if (policy.allowFragments && lower.startsWith("#")) return true;
		if (!EXPLICIT_SCHEME_REGEX.test(normalized)) return policy.allowRelative === true;
		try {
			const parsed = new URL(normalized);
			return policy.allowedProtocols.has(parsed.protocol);
		} catch {
			return false;
		}
	}
	function startsWithBlockedProtocolHint(value, hints) {
		return buildProbeVariants(value.slice(0, MAX_SCHEME_PROBE_LENGTH)).some((candidate) => hints.some((hint) => candidate.startsWith(hint)));
	}
	function buildProbeVariants(value) {
		const variants = /* @__PURE__ */ new Set();
		const base = value.toLowerCase();
		variants.add(base);
		variants.add(base.replace(SCHEME_WHITESPACE_REGEX, ""));
		let decoded = base;
		for (let i = 0; i < MAX_DECODE_ITERATIONS; i += 1) try {
			decoded = decodeURIComponent(decoded);
			variants.add(decoded);
			variants.add(decoded.replace(SCHEME_WHITESPACE_REGEX, ""));
		} catch {
			break;
		}
		return Array.from(variants.values());
	}
	function isAllowedDataUrl(lowerCaseValue, allowedPrefixes) {
		if (!allowedPrefixes || allowedPrefixes.length === 0) return false;
		const [mime] = lowerCaseValue.slice(5).split(";", 1);
		if (!mime) return false;
		return allowedPrefixes.some((prefix) => mime.startsWith(prefix));
	}
	function handleProtocolRelative(url, policy) {
		if (!policy.allowProtocolRelative) return false;
		const fallbackProtocol = policy.allowedProtocols.has("https:") ? "https:" : policy.allowedProtocols.has("http:") ? "http:" : "https:";
		try {
			const resolved = new URL(`${fallbackProtocol}${url}`);
			return policy.allowedProtocols.has(resolved.protocol);
		} catch {
			return false;
		}
	}
	var CONTROL_CHARS_REGEX, SCHEME_WHITESPACE_REGEX, EXPLICIT_SCHEME_REGEX, MAX_DECODE_ITERATIONS, MAX_SCHEME_PROBE_LENGTH, DEFAULT_BLOCKED_PROTOCOL_HINTS, HTML_ATTR_SAFE_PROTOCOLS, HTML_ATTRIBUTE_URL_POLICY;
	var init_safety = __esmMin((() => {
		CONTROL_CHARS_REGEX = /[\u0000-\u001F\u007F]/g;
		SCHEME_WHITESPACE_REGEX = /[\u0000-\u001F\u007F\s]+/g;
		EXPLICIT_SCHEME_REGEX = /^[a-zA-Z][a-zA-Z0-9+.-]*:/;
		MAX_DECODE_ITERATIONS = 3;
		MAX_SCHEME_PROBE_LENGTH = 64;
		DEFAULT_BLOCKED_PROTOCOL_HINTS = Object.freeze([
			"javascript:",
			"vbscript:",
			"file:",
			"filesystem:",
			"ms-appx:",
			"ms-appx-web:",
			"about:",
			"intent:",
			"mailto:",
			"tel:",
			"sms:",
			"wtai:",
			"chrome:",
			"chrome-extension:",
			"opera:",
			"resource:",
			"data:text",
			"data:application",
			"data:video",
			"data:audio"
		]);
		new Set([
			"http:",
			"https:",
			"blob:"
		]);
		HTML_ATTR_SAFE_PROTOCOLS = new Set(["http:", "https:"]);
		Object.freeze([
			"image/png",
			"image/jpeg",
			"image/jpg",
			"image/gif",
			"image/webp",
			"image/avif"
		]);
		HTML_ATTRIBUTE_URL_POLICY = {
			allowedProtocols: HTML_ATTR_SAFE_PROTOCOLS,
			allowRelative: true,
			allowProtocolRelative: true,
			allowFragments: true,
			allowDataUrls: false
		};
	}));
	function isValidMediaUrl(url) {
		if (typeof url !== "string" || url.length > MAX_URL_LENGTH) return false;
		let parsed;
		try {
			parsed = new URL(url);
		} catch {
			return false;
		}
		if (!verifyUrlProtocol(parsed.protocol)) return false;
		if (parsed.hostname === "pbs.twimg.com") return checkPbsMediaPath(parsed.pathname);
		if (parsed.hostname === "video.twimg.com") return true;
		return false;
	}
	function verifyUrlProtocol(protocol) {
		return protocol === "https:" || protocol === "http:";
	}
	function checkPbsMediaPath(pathname) {
		return pathname.startsWith("/media/") || pathname.startsWith("/ext_tw_video_thumb/") || pathname.startsWith("/tweet_video_thumb/") || pathname.startsWith("/video_thumb/");
	}
	var MAX_URL_LENGTH;
	var init_validator = __esmMin((() => {
		new Set(["pbs.twimg.com", "video.twimg.com"]);
		MAX_URL_LENGTH = 2048;
	}));
	var init_url = __esmMin((() => {
		init_host();
		init_safety();
		init_validator();
	}));
	var extractFromElement, extractFromDOM, extractFromMediaGridItem, TweetInfoExtractor;
	var init_tweet_info_extractor = __esmMin((() => {
		init_selectors();
		init_logging();
		init_url();
		extractFromElement = (element) => {
			const dataId = element.dataset.tweetId;
			if (dataId && /^\d+$/.test(dataId)) return {
				tweetId: dataId,
				username: element.dataset.user ?? "unknown",
				tweetUrl: `https://twitter.com/i/status/${dataId}`,
				extractionMethod: "element-attribute",
				confidence: .9
			};
			const href = element.getAttribute("href");
			if (href) {
				const match = href.match(/\/status\/(\d+)/);
				if (match?.[1]) return {
					tweetId: match[1],
					username: extractUsernameFromUrl(href) ?? "unknown",
					tweetUrl: href.startsWith("http") ? href : `https://twitter.com${href}`,
					extractionMethod: "element-href",
					confidence: .8
				};
			}
			return null;
		};
		extractFromDOM = (element) => {
			const container$2 = element.closest(SELECTORS.TWEET_ARTICLE);
			if (!container$2) return null;
			const statusLink = container$2.querySelector(SELECTORS.STATUS_LINK);
			if (!statusLink) return null;
			const href = statusLink.getAttribute("href");
			if (!href) return null;
			const match = href.match(/\/status\/(\d+)/);
			if (!match || !match[1]) return null;
			return {
				tweetId: match[1],
				username: extractUsernameFromUrl(href) ?? "unknown",
				tweetUrl: href.startsWith("http") ? href : `https://twitter.com${href}`,
				extractionMethod: "dom-structure",
				confidence: .85,
				metadata: { containerTag: container$2.tagName.toLowerCase() }
			};
		};
		extractFromMediaGridItem = (element) => {
			const link = element.closest("a");
			if (!link) return null;
			const href = link.getAttribute("href");
			if (!href) return null;
			const match = href.match(/\/status\/(\d+)/);
			if (!match || !match[1]) return null;
			return {
				tweetId: match[1],
				username: extractUsernameFromUrl(href) ?? "unknown",
				tweetUrl: href.startsWith("http") ? href : `https://twitter.com${href}`,
				extractionMethod: "media-grid-item",
				confidence: .8
			};
		};
		TweetInfoExtractor = class {
			strategies = [
				extractFromElement,
				extractFromDOM,
				extractFromMediaGridItem
			];
			async extract(element) {
				for (const strategy of this.strategies) try {
					const result = strategy(element);
					if (result && this.isValid(result)) {
						logger.debug(`[TweetInfoExtractor] Success: ${result.extractionMethod}`, { tweetId: result.tweetId });
						return result;
					}
				} catch {}
				return null;
			}
			isValid(info) {
				return !!info.tweetId && /^\d+$/.test(info.tweetId) && info.tweetId !== "unknown";
			}
		};
	}));
	function resolveDimensionsFromApiMedia(apiMedia) {
		const widthFromOriginal = normalizeDimension(apiMedia.original_width);
		const heightFromOriginal = normalizeDimension(apiMedia.original_height);
		if (widthFromOriginal && heightFromOriginal) return {
			width: widthFromOriginal,
			height: heightFromOriginal
		};
		return null;
	}
	function createMediaInfoFromAPI(apiMedia, tweetInfo, index, tweetTextHTML) {
		try {
			const mediaType = apiMedia.type === "photo" ? "image" : "video";
			const dimensions = resolveDimensionsFromApiMedia(apiMedia);
			const metadata$1 = {
				apiIndex: index,
				apiData: apiMedia
			};
			if (dimensions) metadata$1.dimensions = dimensions;
			const username = apiMedia.screen_name || tweetInfo.username;
			return {
				id: `${tweetInfo.tweetId}_api_${index}`,
				url: apiMedia.download_url,
				type: mediaType,
				filename: "",
				tweetUsername: username,
				tweetId: tweetInfo.tweetId,
				tweetUrl: tweetInfo.tweetUrl,
				tweetText: apiMedia.tweet_text,
				tweetTextHTML,
				originalUrl: apiMedia.download_url,
				thumbnailUrl: apiMedia.preview_url,
				alt: `${mediaType} ${index + 1}`,
				...dimensions && {
					width: dimensions.width,
					height: dimensions.height
				},
				metadata: metadata$1
			};
		} catch (error$1) {
			logger.error("Failed to create API MediaInfo:", error$1);
			return null;
		}
	}
	async function convertAPIMediaToMediaInfo(apiMedias, tweetInfo, tweetTextHTML) {
		const mediaItems = [];
		for (let i = 0; i < apiMedias.length; i++) {
			const apiMedia = apiMedias[i];
			if (!apiMedia) continue;
			const mediaInfo = createMediaInfoFromAPI(apiMedia, tweetInfo, i, tweetTextHTML);
			if (mediaInfo) mediaItems.push(mediaInfo);
		}
		return mediaItems;
	}
	var init_media_factory = __esmMin((() => {
		init_logging();
		init_media_utils();
	}));
	function createDefaultSettings(timestamp = Date.now()) {
		return {
			gallery: cloneDeep(DEFAULT_SETTINGS.gallery),
			toolbar: cloneDeep(DEFAULT_SETTINGS.toolbar),
			download: cloneDeep(DEFAULT_SETTINGS.download),
			tokens: cloneDeep(DEFAULT_SETTINGS.tokens),
			accessibility: cloneDeep(DEFAULT_SETTINGS.accessibility),
			features: cloneDeep(DEFAULT_SETTINGS.features),
			version: DEFAULT_SETTINGS.version,
			lastModified: timestamp
		};
	}
	var STATIC_DEFAULT_SETTINGS, DEFAULT_SETTINGS;
	var init_default_settings = __esmMin((() => {
		init_safety$1();
		STATIC_DEFAULT_SETTINGS = {
			gallery: {
				autoScrollSpeed: 5,
				infiniteScroll: true,
				preloadCount: 3,
				imageFitMode: "fitWidth",
				theme: "auto",
				animations: true,
				enableKeyboardNav: true,
				videoVolume: 1,
				videoMuted: false
			},
			toolbar: { autoHideDelay: 3e3 },
			download: {
				filenamePattern: "original",
				imageQuality: "original",
				maxConcurrentDownloads: 3,
				autoZip: false,
				folderStructure: "flat"
			},
			tokens: {
				autoRefresh: true,
				expirationMinutes: 60
			},
			accessibility: {
				reduceMotion: false,
				screenReaderSupport: true,
				focusIndicators: true
			},
			features: {
				gallery: true,
				settings: true,
				download: true,
				mediaExtraction: true,
				accessibility: true
			},
			version: "1.0.1",
			lastModified: 0
		};
		DEFAULT_SETTINGS = STATIC_DEFAULT_SETTINGS;
	}));
	var MEDIA;
	var init_media = __esmMin((() => {
		MEDIA = {
			DOMAINS: [
				"pbs.twimg.com",
				"video.twimg.com",
				"abs.twimg.com"
			],
			TYPES: {
				IMAGE: "image",
				VIDEO: "video",
				GIF: "gif"
			},
			EXTENSIONS: {
				JPEG: "jpg",
				PNG: "png",
				WEBP: "webp",
				GIF: "gif",
				MP4: "mp4",
				ZIP: "zip"
			},
			QUALITY: {
				ORIGINAL: "orig",
				LARGE: "large",
				MEDIUM: "medium",
				SMALL: "small"
			}
		};
	}));
	var SERVICE_KEYS;
	var init_service_keys = __esmMin((() => {
		SERVICE_KEYS = {
			BULK_DOWNLOAD: "core.bulkDownload",
			LANGUAGE: "language.service",
			GALLERY_DOWNLOAD: "gallery.download",
			GALLERY_RENDERER: "gallery.renderer",
			MEDIA_FILENAME: "media.filename",
			MEDIA_SERVICE: "media.service",
			SETTINGS: "settings.manager",
			THEME: "theme.auto"
		};
	}));
	var APP_SETTINGS_STORAGE_KEY;
	var init_storage = __esmMin((() => {
		APP_SETTINGS_STORAGE_KEY = "xeg-app-settings";
	}));
	var TWITTER_API_CONFIG;
	var init_twitter_api = __esmMin((() => {
		TWITTER_API_CONFIG = {
			GUEST_AUTHORIZATION: "Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA",
			TWEET_RESULT_BY_REST_ID_QUERY_ID: "zAz9764BcLZOJ0JU2wrd1A",
			USER_BY_SCREEN_NAME_QUERY_ID: "1VOOyvKkiI3FMmkeDNxM9A"
		};
	}));
	var VIDEO_CONTROL_SELECTORS, VIDEO_CONTROL_DATASET_PREFIXES, VIDEO_CONTROL_ROLES, VIDEO_CONTROL_ARIA_TOKENS, SYSTEM_PAGES, VIEW_MODES;
	var init_video_controls = __esmMin((() => {
		VIDEO_CONTROL_SELECTORS = [
			"[data-testid=\"playButton\"]",
			"[data-testid=\"pauseButton\"]",
			"[data-testid=\"muteButton\"]",
			"[data-testid=\"unmuteButton\"]",
			"[data-testid=\"volumeButton\"]",
			"[data-testid=\"volumeSlider\"]",
			"[data-testid=\"volumeControl\"]",
			"[data-testid=\"videoProgressSlider\"]",
			"[data-testid=\"seekBar\"]",
			"[data-testid=\"scrubber\"]",
			"[data-testid=\"videoPlayer\"] [role=\"slider\"]",
			"[data-testid=\"videoPlayer\"] [role=\"progressbar\"]",
			"[data-testid=\"videoPlayer\"] [data-testid=\"SliderRail\"]",
			"[data-testid=\"videoPlayer\"] input[type=\"range\"]",
			"[data-testid=\"videoPlayer\"] [aria-label*=\"Volume\"]",
			".video-controls button",
			".video-progress button",
			"video::-webkit-media-controls-play-button",
			"video::-webkit-media-controls-mute-button"
		];
		VIDEO_CONTROL_DATASET_PREFIXES = [
			"play",
			"pause",
			"mute",
			"unmute",
			"volume",
			"slider",
			"seek",
			"scrub",
			"progress"
		];
		VIDEO_CONTROL_ROLES = ["slider", "progressbar"];
		VIDEO_CONTROL_ARIA_TOKENS = [
			"volume",
			"mute",
			"unmute",
			"seek",
			"scrub",
			"timeline",
			"progress"
		];
		SYSTEM_PAGES = [
			"home",
			"explore",
			"notifications",
			"messages",
			"bookmarks",
			"lists",
			"profile",
			"settings",
			"help",
			"search",
			"login",
			"signup"
		];
		VIEW_MODES = ["verticalList"];
	}));
	var constants_exports = /* @__PURE__ */ __export({
		APP_SETTINGS_STORAGE_KEY: () => APP_SETTINGS_STORAGE_KEY,
		CSS: () => CSS,
		DEFAULT_SETTINGS: () => DEFAULT_SETTINGS,
		FALLBACK_SELECTORS: () => FALLBACK_SELECTORS,
		MEDIA: () => MEDIA,
		SELECTORS: () => SELECTORS,
		SERVICE_KEYS: () => SERVICE_KEYS,
		STABLE_SELECTORS: () => STABLE_SELECTORS,
		SYSTEM_PAGES: () => SYSTEM_PAGES,
		TWITTER_API_CONFIG: () => TWITTER_API_CONFIG,
		VIDEO_CONTROL_ARIA_TOKENS: () => VIDEO_CONTROL_ARIA_TOKENS,
		VIDEO_CONTROL_DATASET_PREFIXES: () => VIDEO_CONTROL_DATASET_PREFIXES,
		VIDEO_CONTROL_ROLES: () => VIDEO_CONTROL_ROLES,
		VIDEO_CONTROL_SELECTORS: () => VIDEO_CONTROL_SELECTORS,
		VIEW_MODES: () => VIEW_MODES,
		createDefaultSettings: () => createDefaultSettings,
		queryAllWithFallback: () => queryAllWithFallback,
		queryWithFallback: () => queryWithFallback
	}, 1);
	var init_constants$1 = __esmMin((() => {
		init_css();
		init_default_settings();
		init_media();
		init_selectors();
		init_service_keys();
		init_storage();
		init_twitter_api();
		init_video_controls();
	}));
	function promisifyCallback(executor, options) {
		return new Promise((resolve$1, reject) => {
			try {
				executor((result, error$1) => {
					if (error$1) {
						if (options?.fallback) resolve$1(Promise.resolve(options.fallback()));
						else reject(new Error(String(error$1)));
						return;
					}
					resolve$1(result);
				});
			} catch (error$1) {
				if (options?.fallback) resolve$1(Promise.resolve(options.fallback()));
				else reject(error$1 instanceof Error ? error$1 : new Error(String(error$1)));
			}
		});
	}
	var init_promise_helpers = __esmMin((() => {}));
	var init_async = __esmMin((() => {
		init_promise_helpers();
	}));
	function escapeRegex(value) {
		return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	}
	function decode(value) {
		if (!value) return void 0;
		try {
			return decodeURIComponent(value);
		} catch {
			return value;
		}
	}
	function resolveCookieAPI() {
		try {
			const userscript = getUserscript();
			if (userscript.cookie) return userscript.cookie;
		} catch {}
		const global = globalThis;
		if (global.GM_cookie && typeof global.GM_cookie.list === "function") return global.GM_cookie;
		return null;
	}
	function getCookieAPI() {
		if (cachedCookieAPI === void 0) cachedCookieAPI = resolveCookieAPI();
		return cachedCookieAPI;
	}
	function listFromDocument(options) {
		if (typeof document === "undefined" || typeof document.cookie !== "string") return [];
		const domain = typeof document.location?.hostname === "string" ? document.location.hostname : void 0;
		const records = document.cookie.split(";").map((entry) => entry.trim()).filter(Boolean).map((entry) => {
			const [rawName, ...rest] = entry.split("=");
			const nameDecoded = decode(rawName);
			if (!nameDecoded) return null;
			return {
				name: nameDecoded,
				value: decode(rest.join("=")) ?? "",
				path: "/",
				session: true,
				...domain ? { domain } : {}
			};
		}).filter((record) => Boolean(record));
		return options?.name ? records.filter((record) => record.name === options.name) : records;
	}
	async function listCookies(options) {
		const gmCookie = getCookieAPI();
		if (!gmCookie?.list) return listFromDocument(options);
		return promisifyCallback((callback) => gmCookie?.list(options, (cookies, error$1) => {
			if (error$1) logger.warn("GM_cookie.list failed; falling back to document.cookie", error$1);
			callback(error$1 ? void 0 : (cookies ?? []).map((c) => ({ ...c })), error$1);
		}), { fallback: () => listFromDocument(options) });
	}
	async function getCookieValue(name, options) {
		if (!name) return void 0;
		if (getCookieAPI()?.list) {
			const value = (await listCookies({
				...options,
				name
			}))[0]?.value;
			if (value) return value;
		}
		return getCookieValueSync(name);
	}
	function getCookieValueSync(name) {
		if (!name) return void 0;
		if (typeof document === "undefined" || typeof document.cookie !== "string") return;
		const pattern = /* @__PURE__ */ new RegExp(`(?:^|;\\s*)${escapeRegex(name)}=([^;]*)`);
		return decode(document.cookie.match(pattern)?.[1]);
	}
	var cachedCookieAPI;
	var init_cookie_utils = __esmMin((() => {
		init_userscript();
		init_logging();
		init_async();
	}));
	var init_cookie = __esmMin((() => {
		init_cookie_utils();
	}));
	function initializeTokens() {
		if (_tokensInitialized) return;
		_csrfToken = getCookieValueSync("ct0");
		getCookieValue("ct0").then((value) => {
			if (value) _csrfToken = value;
		}).catch((error$1) => {
			logger.debug("Failed to hydrate CSRF token from GM_cookie", error$1);
		});
		_tokensInitialized = true;
	}
	function getCsrfToken() {
		initializeTokens();
		return _csrfToken;
	}
	var _csrfToken, _tokensInitialized;
	var init_twitter_auth$1 = __esmMin((() => {
		init_logging();
		init_cookie();
		_tokensInitialized = false;
	}));
	var init_twitter_auth = __esmMin((() => {
		init_twitter_auth$1();
	}));
	function resolveDimensions(media, mediaUrl) {
		const dimensionsFromUrl = extractDimensionsFromUrl(mediaUrl);
		const widthFromOriginal = normalizeDimension(media.original_info?.width);
		const heightFromOriginal = normalizeDimension(media.original_info?.height);
		const widthFromUrl = normalizeDimension(dimensionsFromUrl?.width);
		const heightFromUrl = normalizeDimension(dimensionsFromUrl?.height);
		const width = widthFromOriginal ?? widthFromUrl;
		const height = heightFromOriginal ?? heightFromUrl;
		const result = {};
		if (width !== null && width !== void 0) result.width = width;
		if (height !== null && height !== void 0) result.height = height;
		return result;
	}
	function resolveAspectRatio(media, dimensions) {
		const aspectRatioValues = Array.isArray(media.video_info?.aspect_ratio) ? media.video_info?.aspect_ratio : void 0;
		const aspectRatioWidth = normalizeDimension(aspectRatioValues?.[0]);
		const aspectRatioHeight = normalizeDimension(aspectRatioValues?.[1]);
		if (aspectRatioWidth && aspectRatioHeight) return [aspectRatioWidth, aspectRatioHeight];
		if (dimensions.width && dimensions.height) return [dimensions.width, dimensions.height];
	}
	function getPhotoHighQualityUrl(mediaUrlHttps) {
		return mediaUrlHttps.includes("?format=") ? mediaUrlHttps : mediaUrlHttps.replace(/\.(jpg|png)$/, "?format=$1&name=orig");
	}
	function getVideoHighQualityUrl(media) {
		const mp4Variants = (media.video_info?.variants ?? []).filter((v) => v.content_type === "video/mp4");
		if (mp4Variants.length === 0) return null;
		return mp4Variants.reduce((best, current) => {
			const bestBitrate = best.bitrate ?? 0;
			return (current.bitrate ?? 0) > bestBitrate ? current : best;
		}).url;
	}
	function getHighQualityMediaUrl(media) {
		if (media.type === "photo") return getPhotoHighQualityUrl(media.media_url_https);
		if (media.type === "video" || media.type === "animated_gif") return getVideoHighQualityUrl(media);
		return null;
	}
	function createMediaEntry(media, mediaUrl, screenName, tweetId, tweetText, index, typeIndex, typeIndexOriginal, sourceLocation) {
		const mediaType = media.type === "animated_gif" ? "video" : media.type;
		const dimensions = resolveDimensions(media, mediaUrl);
		const aspectRatio = resolveAspectRatio(media, dimensions);
		const entry = {
			screen_name: screenName,
			tweet_id: tweetId,
			download_url: mediaUrl,
			type: mediaType,
			typeOriginal: media.type,
			index,
			typeIndex,
			typeIndexOriginal,
			preview_url: media.media_url_https,
			media_id: media.id_str,
			media_key: media.media_key ?? "",
			expanded_url: media.expanded_url ?? "",
			short_expanded_url: media.display_url ?? "",
			short_tweet_url: media.url ?? "",
			tweet_text: tweetText,
			sourceLocation
		};
		if (dimensions.width) entry.original_width = dimensions.width;
		if (dimensions.height) entry.original_height = dimensions.height;
		if (aspectRatio) entry.aspect_ratio = aspectRatio;
		return entry;
	}
	function extractMediaFromTweet(tweetResult, tweetUser, sourceLocation = "original") {
		if (!tweetResult.extended_entities?.media) return [];
		const mediaItems = [];
		const typeIndex = {};
		const screenName = tweetUser.screen_name ?? "";
		const tweetId = tweetResult.rest_id ?? tweetResult.id_str ?? "";
		for (let index = 0; index < tweetResult.extended_entities.media.length; index++) {
			const media = tweetResult.extended_entities.media[index];
			if (!media?.type || !media.id_str || !media.media_url_https) continue;
			try {
				const mediaUrl = getHighQualityMediaUrl(media);
				if (!mediaUrl) continue;
				const mediaType = media.type === "animated_gif" ? "video" : media.type;
				typeIndex[mediaType] = (typeIndex[mediaType] ?? -1) + 1;
				typeIndex[media.type] = typeIndex[media.type] ?? typeIndex[mediaType];
				const entry = createMediaEntry(media, mediaUrl, screenName, tweetId, (tweetResult.full_text ?? "").replace(` ${media.url}`, "").trim(), index, typeIndex[mediaType] ?? 0, typeIndex[media.type] ?? 0, sourceLocation);
				mediaItems.push(entry);
			} catch (error$1) {
				logger.warn(`Failed to process media ${media.id_str}:`, error$1);
			}
		}
		return mediaItems;
	}
	function normalizeLegacyTweet(tweet) {
		if (tweet.legacy) {
			if (!tweet.extended_entities && tweet.legacy.extended_entities) tweet.extended_entities = tweet.legacy.extended_entities;
			if (!tweet.full_text && tweet.legacy.full_text) tweet.full_text = tweet.legacy.full_text;
			if (!tweet.id_str && tweet.legacy.id_str) tweet.id_str = tweet.legacy.id_str;
		}
		const noteTweetText = tweet.note_tweet?.note_tweet_results?.result?.text;
		if (noteTweetText) tweet.full_text = noteTweetText;
	}
	function normalizeLegacyUser(user) {
		if (user.legacy) {
			if (!user.screen_name && user.legacy.screen_name) user.screen_name = user.legacy.screen_name;
			if (!user.name && user.legacy.name) user.name = user.legacy.name;
		}
	}
	var init_twitter_response_parser = __esmMin((() => {
		init_logging();
		init_media_utils();
	}));
	var init_twitter_parser = __esmMin((() => {
		init_twitter_response_parser();
	}));
	var TwitterAPI;
	var init_twitter_api_client = __esmMin((() => {
		init_constants$1();
		init_logging();
		init_media_utils();
		init_http_request_service();
		init_twitter_auth();
		init_twitter_parser();
		TwitterAPI = class TwitterAPI {
			static requestCache = /* @__PURE__ */ new Map();
			static CACHE_LIMIT = 16;
			static async getTweetMedias(tweetId) {
				const url = TwitterAPI.createTweetEndpointUrl(tweetId);
				const json = await TwitterAPI.apiRequest(url);
				if (!json.data?.tweetResult?.result) return [];
				let tweetResult = json.data.tweetResult.result;
				if (tweetResult.tweet) tweetResult = tweetResult.tweet;
				const tweetUser = tweetResult.core?.user_results?.result;
				normalizeLegacyTweet(tweetResult);
				if (!tweetUser) return [];
				normalizeLegacyUser(tweetUser);
				let result = extractMediaFromTweet(tweetResult, tweetUser, "original");
				result = sortMediaByVisualOrder(result);
				if (tweetResult.quoted_status_result?.result) {
					let quotedTweet = tweetResult.quoted_status_result.result;
					if (quotedTweet.tweet) quotedTweet = quotedTweet.tweet;
					const quotedUser = quotedTweet.core?.user_results?.result;
					if (quotedTweet && quotedUser) {
						normalizeLegacyTweet(quotedTweet);
						normalizeLegacyUser(quotedUser);
						const sortedQuotedMedia = sortMediaByVisualOrder(extractMediaFromTweet(quotedTweet, quotedUser, "quoted"));
						const adjustedResult = result.map((media) => ({
							...media,
							index: media.index + sortedQuotedMedia.length
						}));
						result = [...sortedQuotedMedia, ...adjustedResult];
					}
				}
				return result;
			}
			static async apiRequest(url) {
				const _url = url.toString();
				if (TwitterAPI.requestCache.has(_url)) return TwitterAPI.requestCache.get(_url);
				const headers = new Headers({
					authorization: TWITTER_API_CONFIG.GUEST_AUTHORIZATION,
					"x-csrf-token": getCsrfToken() ?? "",
					"x-twitter-client-language": "en",
					"x-twitter-active-user": "yes",
					"content-type": "application/json",
					"x-twitter-auth-type": "OAuth2Session"
				});
				if (typeof window !== "undefined") {
					headers.append("referer", window.location.href);
					headers.append("origin", window.location.origin);
				}
				try {
					const response = await HttpRequestService.getInstance().get(_url, {
						headers: Object.fromEntries(headers.entries()),
						responseType: "json"
					});
					if (!response.ok) {
						logger.warn(`Twitter API request failed: ${response.status} ${response.statusText}`, response.data);
						throw new Error(`Twitter API request failed: ${response.status} ${response.statusText}`);
					}
					const json = response.data;
					if (json.errors && json.errors.length > 0) logger.warn("Twitter API returned errors:", json.errors);
					if (TwitterAPI.requestCache.size >= TwitterAPI.CACHE_LIMIT) {
						const firstKey = TwitterAPI.requestCache.keys().next().value;
						if (firstKey) TwitterAPI.requestCache.delete(firstKey);
					}
					TwitterAPI.requestCache.set(_url, json);
					return json;
				} catch (error$1) {
					logger.error("Twitter API request failed:", error$1);
					throw error$1;
				}
			}
			static createTweetEndpointUrl(tweetId) {
				const sitename = window.location.hostname.replace(".com", "");
				const variables = {
					tweetId,
					withCommunity: false,
					includePromotedContent: false,
					withVoice: false
				};
				const features = {
					creator_subscriptions_tweet_preview_api_enabled: true,
					premium_content_api_read_enabled: false,
					communities_web_enable_tweet_community_results_fetch: true,
					c9s_tweet_anatomy_moderator_badge_enabled: true,
					responsive_web_grok_analyze_button_fetch_trends_enabled: false,
					responsive_web_grok_analyze_post_followups_enabled: false,
					responsive_web_jetfuel_frame: false,
					responsive_web_grok_share_attachment_enabled: true,
					articles_preview_enabled: true,
					responsive_web_edit_tweet_api_enabled: true,
					graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
					view_counts_everywhere_api_enabled: true,
					longform_notetweets_consumption_enabled: true,
					responsive_web_twitter_article_tweet_consumption_enabled: true,
					tweet_awards_web_tipping_enabled: false,
					responsive_web_grok_show_grok_translated_post: false,
					responsive_web_grok_analysis_button_from_backend: false,
					creator_subscriptions_quote_tweet_preview_enabled: false,
					freedom_of_speech_not_reach_fetch_enabled: true,
					standardized_nudges_misinfo: true,
					tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
					longform_notetweets_rich_text_read_enabled: true,
					longform_notetweets_inline_media_enabled: true,
					profile_label_improvements_pcf_label_in_post_enabled: true,
					rweb_tipjar_consumption_enabled: true,
					verified_phone_label_enabled: false,
					responsive_web_grok_image_annotation_enabled: true,
					responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
					responsive_web_graphql_timeline_navigation_enabled: true,
					responsive_web_enhance_cards_enabled: false
				};
				const fieldToggles = {
					withArticleRichContentState: true,
					withArticlePlainText: false,
					withGrokAnalyze: false,
					withDisallowedReplyControls: false
				};
				const urlBase = `https://${sitename}.com/i/api/graphql/${TWITTER_API_CONFIG.TWEET_RESULT_BY_REST_ID_QUERY_ID}/TweetResultByRestId`;
				const urlObj = new URL(urlBase);
				urlObj.searchParams.set("variables", JSON.stringify(variables));
				urlObj.searchParams.set("features", JSON.stringify(features));
				urlObj.searchParams.set("fieldToggles", JSON.stringify(fieldToggles));
				return urlObj.toString();
			}
		};
	}));
	function isMediaElement(element) {
		if (!element) return false;
		return element.tagName === "IMG" || element.tagName === "VIDEO";
	}
	function findMediaElementInDOM(target, options = {}) {
		const { maxDescendantDepth, maxAncestorHops } = {
			...DEFAULT_TRAVERSAL_OPTIONS,
			...options
		};
		if (isMediaElement(target)) return target;
		const descendant = findMediaDescendant(target, {
			includeRoot: false,
			maxDepth: maxDescendantDepth
		});
		if (descendant) return descendant;
		let branch = target;
		for (let hops = 0; hops < maxAncestorHops && branch; hops++) {
			branch = branch.parentElement;
			if (!branch) break;
			const ancestorMedia = findMediaDescendant(branch, {
				includeRoot: true,
				maxDepth: maxDescendantDepth
			});
			if (ancestorMedia) return ancestorMedia;
		}
		return null;
	}
	function extractMediaUrlFromElement(element) {
		if (element instanceof HTMLImageElement) return pickFirstTruthy([
			element.currentSrc,
			element.src,
			element.getAttribute("src")
		]);
		if (element instanceof HTMLVideoElement) return pickFirstTruthy([
			element.currentSrc,
			element.src,
			element.getAttribute("src"),
			element.poster,
			element.getAttribute("poster")
		]);
		return null;
	}
	function findMediaDescendant(root, { includeRoot, maxDepth }) {
		const queue = [{
			node: root,
			depth: 0
		}];
		while (queue.length) {
			const current = queue.shift();
			if (!current) break;
			const { node, depth } = current;
			if ((includeRoot || node !== root) && isMediaElement(node)) return node;
			if (depth >= maxDepth) continue;
			for (const child of Array.from(node.children)) if (child instanceof HTMLElement) queue.push({
				node: child,
				depth: depth + 1
			});
		}
		return null;
	}
	function pickFirstTruthy(values) {
		for (const value of values) if (value) return value;
		return null;
	}
	var DEFAULT_MAX_DESCENDANT_DEPTH, DEFAULT_MAX_ANCESTOR_HOPS, DEFAULT_TRAVERSAL_OPTIONS;
	var init_media_element_utils = __esmMin((() => {
		DEFAULT_MAX_DESCENDANT_DEPTH = 6;
		DEFAULT_MAX_ANCESTOR_HOPS = 3;
		DEFAULT_TRAVERSAL_OPTIONS = {
			maxDescendantDepth: DEFAULT_MAX_DESCENDANT_DEPTH,
			maxAncestorHops: DEFAULT_MAX_ANCESTOR_HOPS
		};
	}));
	function determineClickedIndex(clickedElement, mediaItems) {
		try {
			const mediaElement = findMediaElementInDOM(clickedElement);
			if (!mediaElement) return 0;
			const elementUrl = extractMediaUrlFromElement(mediaElement);
			if (!elementUrl) return 0;
			const normalizedElementUrl = normalizeMediaUrl(elementUrl);
			if (!normalizedElementUrl) return 0;
			const index = mediaItems.findIndex((item, i) => {
				if (!item) return false;
				const itemUrl = item.url || item.originalUrl;
				if (itemUrl && normalizeMediaUrl(itemUrl) === normalizedElementUrl) {
					logger.debug(`[determineClickedIndex] Matched clicked media at index ${i}: ${normalizedElementUrl}`);
					return true;
				}
				if (item.thumbnailUrl && normalizeMediaUrl(item.thumbnailUrl) === normalizedElementUrl) {
					logger.debug(`[determineClickedIndex] Matched clicked media (thumbnail) at index ${i}: ${normalizedElementUrl}`);
					return true;
				}
				return false;
			});
			if (index !== -1) return index;
			logger.warn(`[determineClickedIndex] No matching media found for URL: ${normalizedElementUrl}, defaulting to 0`);
			return 0;
		} catch (error$1) {
			logger.warn("[determineClickedIndex] Error calculating clicked index:", error$1);
			return 0;
		}
	}
	var init_determine_clicked_index = __esmMin((() => {
		init_logging();
		init_media_utils();
		init_media_element_utils();
	}));
	function sanitizeHTML(html, config = DEFAULT_CONFIG) {
		if (!html || typeof html !== "string") return "";
		const doc = new DOMParser().parseFromString(html, "text/html");
		function sanitizeNode(node) {
			if (node.nodeType === Node.TEXT_NODE) return node.cloneNode(false);
			if (node.nodeType !== Node.ELEMENT_NODE) return null;
			const element = node;
			const tagName = element.tagName.toLowerCase();
			if (!config.allowedTags.includes(tagName)) {
				const textContent = element.textContent || "";
				return document.createTextNode(textContent);
			}
			const sanitized = document.createElement(tagName);
			const allowedAttrs = config.allowedAttributes[tagName] || [];
			for (const attr of Array.from(element.attributes)) {
				const attrName = attr.name.toLowerCase();
				if (attrName.startsWith("on")) continue;
				if (!allowedAttrs.includes(attrName)) continue;
				if ((attrName === "href" || attrName === "src") && !isSafeAttributeUrl(attr.value)) continue;
				sanitized.setAttribute(attrName, attr.value);
			}
			if (tagName === "a" && sanitized.getAttribute("target") === "_blank") sanitized.setAttribute("rel", "noopener noreferrer");
			for (const child of Array.from(element.childNodes)) {
				const sanitizedChild = sanitizeNode(child);
				if (sanitizedChild) sanitized.appendChild(sanitizedChild);
			}
			return sanitized;
		}
		const bodyContent = doc.body;
		const sanitizedBody = document.createElement("div");
		for (const child of Array.from(bodyContent.childNodes)) {
			const sanitized = sanitizeNode(child);
			if (sanitized) sanitizedBody.appendChild(sanitized);
		}
		return sanitizedBody.innerHTML;
	}
	function isSafeAttributeUrl(url) {
		return isUrlAllowed(url, HTML_ATTRIBUTE_URL_POLICY);
	}
	var DEFAULT_CONFIG;
	var init_html_sanitizer = __esmMin((() => {
		init_url();
		DEFAULT_CONFIG = {
			allowedTags: [
				"a",
				"span",
				"br",
				"strong",
				"em",
				"img"
			],
			allowedAttributes: {
				a: [
					"href",
					"title",
					"rel",
					"target",
					"dir"
				],
				span: ["class", "dir"],
				img: [
					"alt",
					"src",
					"draggable"
				]
			}
		};
	}));
	function extractTweetTextHTML(tweetArticle) {
		if (!tweetArticle) return void 0;
		try {
			const tweetTextElement = tweetArticle.querySelector(SELECTORS.TWEET_TEXT);
			if (!tweetTextElement) {
				logger.debug("[extractTweetTextHTML] tweetText element not found");
				return;
			}
			const rawHTML = tweetTextElement.innerHTML;
			if (!rawHTML?.trim()) {
				logger.debug("[extractTweetTextHTML] Empty HTML content");
				return;
			}
			const sanitized = sanitizeHTML(rawHTML);
			if (!sanitized?.trim()) {
				logger.debug("[extractTweetTextHTML] HTML sanitization resulted in empty content");
				return;
			}
			logger.debug("[extractTweetTextHTML] Successfully extracted and sanitized HTML", {
				originalLength: rawHTML.length,
				sanitizedLength: sanitized.length
			});
			return sanitized;
		} catch (error$1) {
			logger.error("[extractTweetTextHTML] Error extracting tweet text HTML:", error$1);
			return;
		}
	}
	function extractTweetTextHTMLFromClickedElement(element, maxDepth = 10) {
		let current = element;
		let depth = 0;
		while (current && depth < maxDepth) {
			if (current.tagName === "ARTICLE" && (current.hasAttribute("data-testid") || current.querySelector(SELECTORS.TWEET))) return extractTweetTextHTML(current);
			current = current.parentElement;
			depth++;
		}
		logger.debug("[extractTweetTextHTMLFromClickedElement] Tweet article not found within depth", { maxDepth });
	}
	var init_tweet_extractor = __esmMin((() => {
		init_constants$1();
		init_logging();
		init_html_sanitizer();
	}));
	var TwitterAPIExtractor;
	var init_twitter_api_extractor = __esmMin((() => {
		init_logging();
		init_media_factory();
		init_twitter_api_client();
		init_determine_clicked_index();
		init_tweet_extractor();
		TwitterAPIExtractor = class {
			async extract(tweetInfo, clickedElement, _options, extractionId) {
				try {
					logger.debug(`[APIExtractor] ${extractionId}: Starting API extraction`, { tweetId: tweetInfo.tweetId });
					const apiMedias = await TwitterAPI.getTweetMedias(tweetInfo.tweetId);
					if (!apiMedias || apiMedias.length === 0) return this.createFailureResult("No media found in API response");
					const mediaItems = await convertAPIMediaToMediaInfo(apiMedias, tweetInfo, extractTweetTextHTMLFromClickedElement(clickedElement));
					return {
						success: true,
						mediaItems,
						clickedIndex: determineClickedIndex(clickedElement, mediaItems),
						metadata: {
							extractedAt: Date.now(),
							sourceType: "twitter-api",
							strategy: "api-extraction",
							totalProcessingTime: 0,
							apiMediaCount: apiMedias.length
						},
						tweetInfo
					};
				} catch (error$1) {
					logger.warn(`[APIExtractor] ${extractionId}: API extraction failed:`, error$1);
					return this.createFailureResult(error$1 instanceof Error ? error$1.message : "API extraction failed");
				}
			}
			createFailureResult(error$1) {
				return {
					success: false,
					mediaItems: [],
					clickedIndex: 0,
					metadata: {
						extractedAt: Date.now(),
						sourceType: "twitter-api",
						strategy: "api-extraction-failed",
						error: error$1
					},
					tweetInfo: null
				};
			}
		};
	})), ExtractionError;
	var init_media_types = __esmMin((() => {
		ExtractionError = class extends Error {
			constructor(code, message, originalError) {
				super(message);
				this.code = code;
				this.originalError = originalError;
				this.name = "ExtractionError";
			}
		};
	}));
	function success(data, meta) {
		return {
			status: "success",
			data,
			code: ErrorCode.NONE,
			...meta && { meta }
		};
	}
	function failure(error$1, code = ErrorCode.UNKNOWN, options) {
		return {
			status: "error",
			error: error$1,
			code,
			...options
		};
	}
	var ErrorCode;
	var init_result_types = __esmMin((() => {
		ErrorCode = {
			NONE: "NONE",
			CANCELLED: "CANCELLED",
			NETWORK: "NETWORK",
			TIMEOUT: "TIMEOUT",
			EMPTY_INPUT: "EMPTY_INPUT",
			ALL_FAILED: "ALL_FAILED",
			PARTIAL_FAILED: "PARTIAL_FAILED",
			UNKNOWN: "UNKNOWN",
			ELEMENT_NOT_FOUND: "ELEMENT_NOT_FOUND",
			INVALID_ELEMENT: "INVALID_ELEMENT",
			NO_MEDIA_FOUND: "NO_MEDIA_FOUND",
			INVALID_URL: "INVALID_URL",
			PERMISSION_DENIED: "PERMISSION_DENIED"
		};
	}));
	var media_extraction_service_exports = /* @__PURE__ */ __export({ MediaExtractionService: () => MediaExtractionService }, 1);
	var MediaExtractionService;
	var init_media_extraction_service = __esmMin((() => {
		init_selectors();
		init_logging();
		init_media_utils();
		init_tweet_info_extractor();
		init_twitter_api_extractor();
		init_media_types();
		init_result_types();
		MediaExtractionService = class {
			tweetInfoExtractor;
			apiExtractor;
			constructor() {
				this.tweetInfoExtractor = new TweetInfoExtractor();
				this.apiExtractor = new TwitterAPIExtractor();
			}
			async extractFromClickedElement(element, options = {}) {
				const extractionId = this.generateExtractionId();
				logger.info(`[MediaExtractor] ${extractionId}: Extraction started`);
				try {
					const tweetInfo = await this.tweetInfoExtractor.extract(element);
					if (!tweetInfo?.tweetId) {
						logger.warn(`[MediaExtractor] ${extractionId}: No tweet info found`);
						return this.createErrorResult("No tweet information found");
					}
					const apiResult = await this.apiExtractor.extract(tweetInfo, element, options, extractionId);
					if (apiResult.success && apiResult.mediaItems.length > 0) return this.finalizeResult({
						...apiResult,
						tweetInfo: this.mergeTweetInfoMetadata(tweetInfo, apiResult.tweetInfo)
					});
					logger.error(`[MediaExtractor] ${extractionId}: API extraction failed`);
					return this.createErrorResult("API extraction failed");
				} catch (error$1) {
					logger.error(`[MediaExtractor] ${extractionId}: Extraction error`, error$1);
					return this.createErrorResult(error$1);
				}
			}
			async extractAllFromContainer(container$2, options = {}) {
				try {
					const firstMedia = container$2.querySelector(SELECTORS.TWITTER_MEDIA);
					if (!firstMedia) return this.createErrorResult("No media found in container");
					return this.extractFromClickedElement(firstMedia, options);
				} catch (error$1) {
					return this.createErrorResult(error$1);
				}
			}
			generateExtractionId() {
				if (typeof crypto !== "undefined" && crypto.randomUUID) return `simp_${crypto.randomUUID()}`;
				return `simp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
			}
			createErrorResult(error$1) {
				const errorMessage = error$1 instanceof Error ? error$1.message : typeof error$1 === "string" ? error$1 : "Unknown error";
				return {
					success: false,
					mediaItems: [],
					clickedIndex: 0,
					metadata: {
						extractedAt: Date.now(),
						sourceType: "extraction-failed",
						strategy: "media-extraction",
						error: errorMessage
					},
					tweetInfo: null,
					errors: [new ExtractionError(ErrorCode.NO_MEDIA_FOUND, errorMessage)]
				};
			}
			finalizeResult(result) {
				if (!result.success) return result;
				const uniqueItems = removeDuplicateMediaItems(result.mediaItems);
				if (uniqueItems.length === 0) return {
					...result,
					mediaItems: [],
					clickedIndex: 0
				};
				const adjustedIndex = adjustClickedIndexAfterDeduplication(result.mediaItems, uniqueItems, result.clickedIndex ?? 0);
				return {
					...result,
					mediaItems: uniqueItems,
					clickedIndex: adjustedIndex
				};
			}
			mergeTweetInfoMetadata(base, override) {
				if (!base) return override ?? null;
				if (!override) return base;
				return {
					...base,
					...override,
					metadata: {
						...base.metadata ?? {},
						...override.metadata ?? {}
					}
				};
			}
		};
	}));
	function getErrorMessage(error$1) {
		if (error$1 instanceof Error) return error$1.message;
		if (typeof error$1 === "string") return error$1;
		if (error$1 && typeof error$1 === "object" && "message" in error$1) {
			const message = error$1.message;
			return typeof message === "string" ? message : String(message ?? "");
		}
		if (error$1 == null) return "";
		return String(error$1);
	}
	var init_utils$2 = __esmMin((() => {}));
	function detectDownloadCapability() {
		const gmDownload = resolveGMDownload();
		const hasGMDownload = typeof gmDownload === "function";
		const hasFetch = typeof fetch === "function";
		const hasBlob = typeof Blob !== "undefined" && typeof URL !== "undefined" && typeof URL.createObjectURL === "function";
		let method = "none";
		if (hasGMDownload) method = "gm_download";
		else if (hasFetch && hasBlob) method = "fetch_blob";
		return {
			hasGMDownload,
			hasFetch,
			hasBlob,
			method,
			gmDownload
		};
	}
	function resolveGMDownload() {
		if (typeof GM_download !== "undefined" && typeof GM_download === "function") return GM_download;
		const fromGlobal = globalThis.GM_download;
		if (typeof fromGlobal === "function") return fromGlobal;
	}
	async function downloadWithFetchBlob(url, filename$1, options = {}) {
		const { signal, onProgress, timeout = 3e4 } = options;
		if (signal?.aborted) return {
			success: false,
			error: "Download cancelled"
		};
		onProgress?.({
			phase: "preparing",
			current: 0,
			total: 1,
			percentage: 0,
			filename: filename$1
		});
		try {
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), timeout);
			if (signal) signal.addEventListener("abort", () => controller.abort());
			const response = await fetch(url, {
				signal: controller.signal,
				mode: "cors",
				credentials: "omit"
			});
			clearTimeout(timeoutId);
			if (!response.ok) return {
				success: false,
				error: `HTTP ${response.status}: ${response.statusText}`
			};
			const contentLength = response.headers.get("content-length");
			const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;
			let blob;
			if (totalBytes > 0 && response.body) {
				const reader = response.body.getReader();
				const chunks = [];
				let receivedBytes = 0;
				while (true) {
					const { done, value } = await reader.read();
					if (done) break;
					if (value) {
						chunks.push(value);
						receivedBytes += value.length;
						onProgress?.({
							phase: "downloading",
							current: 0,
							total: 1,
							percentage: Math.round(receivedBytes / totalBytes * 100),
							filename: filename$1
						});
					}
				}
				blob = new Blob(chunks, { type: response.headers.get("content-type") || "application/octet-stream" });
			} else blob = await response.blob();
			const blobUrl = URL.createObjectURL(blob);
			try {
				await triggerAnchorDownload(blobUrl, filename$1);
				onProgress?.({
					phase: "complete",
					current: 1,
					total: 1,
					percentage: 100,
					filename: filename$1
				});
				logger.debug(`[FallbackDownload] Download complete: ${filename$1}`);
				return {
					success: true,
					filename: filename$1
				};
			} finally {
				URL.revokeObjectURL(blobUrl);
			}
		} catch (error$1) {
			const errorMsg = getErrorMessage(error$1);
			if (errorMsg.includes("abort") || errorMsg.includes("cancel")) return {
				success: false,
				error: "Download cancelled"
			};
			logger.error("[FallbackDownload] Download failed:", error$1);
			onProgress?.({
				phase: "complete",
				current: 1,
				total: 1,
				percentage: 0,
				filename: filename$1
			});
			return {
				success: false,
				error: errorMsg
			};
		}
	}
	async function triggerAnchorDownload(url, filename$1) {
		return new Promise((resolve$1, reject) => {
			try {
				const anchor = document.createElement("a");
				anchor.href = url;
				anchor.download = filename$1;
				anchor.style.display = "none";
				document.body.appendChild(anchor);
				anchor.click();
				setTimeout(() => {
					document.body.removeChild(anchor);
					resolve$1();
				}, 100);
			} catch (error$1) {
				reject(error$1);
			}
		});
	}
	async function downloadBlobWithAnchor(blob, filename$1, options = {}) {
		const { onProgress } = options;
		onProgress?.({
			phase: "preparing",
			current: 0,
			total: 1,
			percentage: 0,
			filename: filename$1
		});
		const blobUrl = URL.createObjectURL(blob);
		try {
			await triggerAnchorDownload(blobUrl, filename$1);
			onProgress?.({
				phase: "complete",
				current: 1,
				total: 1,
				percentage: 100,
				filename: filename$1
			});
			logger.debug(`[FallbackDownload] Blob download complete: ${filename$1}`);
			return {
				success: true,
				filename: filename$1
			};
		} catch (error$1) {
			const errorMsg = getErrorMessage(error$1);
			logger.error("[FallbackDownload] Blob download failed:", error$1);
			onProgress?.({
				phase: "complete",
				current: 1,
				total: 1,
				percentage: 0,
				filename: filename$1
			});
			return {
				success: false,
				error: errorMsg
			};
		} finally {
			URL.revokeObjectURL(blobUrl);
		}
	}
	var init_fallback_download = __esmMin((() => {
		init_utils$2();
		init_logging();
	}));
	function sanitize(name) {
		return name.replace(/[<>:"/\\|?*]/g, "_").replace(/^[\s.]+|[\s.]+$/g, "").slice(0, 255) || "media";
	}
	function getExtension(url) {
		try {
			const path = url.split("?")[0];
			if (!path) return "jpg";
			const ext = path.split(".").pop();
			if (ext && /^(jpg|jpeg|png|gif|webp|mp4|mov|avi)$/i.test(ext)) return ext.toLowerCase();
		} catch {}
		return "jpg";
	}
	function getIndexFromMediaId(mediaId) {
		if (!mediaId) return null;
		const match = mediaId.match(/_media_(\d+)$/) || mediaId.match(/_(\d+)$/);
		if (match) {
			const idx = safeParseInt(match[1], 10);
			return mediaId.includes("_media_") ? (idx + 1).toString() : match[1] ?? null;
		}
		return null;
	}
	function normalizeIndex(index) {
		if (index === void 0 || index === null) return "1";
		const num = typeof index === "string" ? safeParseInt(index, 10) : index;
		return Number.isNaN(num) || num < 1 ? "1" : num.toString();
	}
	function resolveMetadata(media, fallbackUsername) {
		let username = null;
		let tweetId = null;
		if (media.sourceLocation === "quoted" && media.quotedUsername && media.quotedTweetId) {
			username = media.quotedUsername;
			tweetId = media.quotedTweetId;
		} else {
			tweetId = media.tweetId ?? null;
			if (media.tweetUsername && media.tweetUsername !== "unknown") username = media.tweetUsername;
			else {
				const url = ("originalUrl" in media ? media.originalUrl : null) || media.url;
				if (typeof url === "string") username = extractUsernameFromUrl(url, { strictHost: true });
			}
		}
		if (!username && fallbackUsername) username = fallbackUsername;
		return {
			username,
			tweetId
		};
	}
	function generateMediaFilename(media, options = {}) {
		try {
			if (media.filename) return sanitize(media.filename);
			const originalUrl = media.originalUrl;
			const extension = options.extension ?? getExtension(originalUrl ?? media.url);
			const index = getIndexFromMediaId(media.id) ?? normalizeIndex(options.index);
			const { username, tweetId } = resolveMetadata(media, options.fallbackUsername);
			if (username && tweetId) return sanitize(`${username}_${tweetId}_${index}.${extension}`);
			if (tweetId && /^\d+$/.test(tweetId)) return sanitize(`tweet_${tweetId}_${index}.${extension}`);
			return sanitize(`${options.fallbackPrefix ?? "media"}_${Date.now()}_${index}.${extension}`);
		} catch {
			return `media_${Date.now()}.${options.extension || "jpg"}`;
		}
	}
	function generateZipFilename(mediaItems, options = {}) {
		try {
			const firstItem = mediaItems[0];
			if (firstItem) {
				const { username, tweetId } = resolveMetadata(firstItem);
				if (username && tweetId) return sanitize(`${username}_${tweetId}.zip`);
			}
			return sanitize(`${options.fallbackPrefix ?? "xcom_gallery"}_${Date.now()}.zip`);
		} catch {
			return `download_${Date.now()}.zip`;
		}
	}
	var init_filename_utils = __esmMin((() => {
		init_safety$1();
		init_url();
	}));
	var init_filename = __esmMin((() => {
		init_filename_utils();
	}));
	async function downloadSingleFile(media, options = {}, capability) {
		if (options.signal?.aborted) return {
			success: false,
			error: "User cancelled download"
		};
		const filename$1 = generateMediaFilename(media);
		const effectiveCapability = capability ?? detectDownloadCapability();
		if (effectiveCapability.method === "fetch_blob") {
			logger.debug("[SingleDownload] Using fetch+blob fallback (GM_download not available)");
			if (options.blob) return downloadBlobWithAnchor(options.blob, filename$1, {
				signal: options.signal,
				onProgress: options.onProgress
			});
			return downloadWithFetchBlob(media.url, filename$1, {
				signal: options.signal,
				onProgress: options.onProgress,
				timeout: 3e4
			});
		}
		if (effectiveCapability.method === "none") return {
			success: false,
			error: "No download method available in this environment"
		};
		const gmDownload = effectiveCapability.gmDownload;
		if (!gmDownload) return {
			success: false,
			error: "GM_download not available"
		};
		let url = media.url;
		let isBlobUrl = false;
		if (options.blob) {
			url = URL.createObjectURL(options.blob);
			isBlobUrl = true;
		}
		return new Promise((resolve$1) => {
			const cleanup$1 = () => {
				if (isBlobUrl) URL.revokeObjectURL(url);
				globalTimerManager.clearTimeout(timer);
			};
			const timer = globalTimerManager.setTimeout(() => {
				options.onProgress?.({
					phase: "complete",
					current: 1,
					total: 1,
					percentage: 0
				});
				cleanup$1();
				resolve$1({
					success: false,
					error: "Download timeout"
				});
			}, 3e4);
			try {
				gmDownload({
					url,
					name: filename$1,
					onload: () => {
						logger.debug(`[SingleDownload] Download complete: ${filename$1}`);
						options.onProgress?.({
							phase: "complete",
							current: 1,
							total: 1,
							percentage: 100
						});
						cleanup$1();
						resolve$1({
							success: true,
							filename: filename$1
						});
					},
					onerror: (error$1) => {
						const errorMsg = getErrorMessage(error$1);
						logger.error("[SingleDownload] Download failed:", error$1);
						options.onProgress?.({
							phase: "complete",
							current: 1,
							total: 1,
							percentage: 0
						});
						cleanup$1();
						resolve$1({
							success: false,
							error: errorMsg
						});
					},
					ontimeout: () => {
						options.onProgress?.({
							phase: "complete",
							current: 1,
							total: 1,
							percentage: 0
						});
						cleanup$1();
						resolve$1({
							success: false,
							error: "Download timeout"
						});
					},
					onprogress: (progress) => {
						if (options.onProgress && progress.total > 0) options.onProgress({
							phase: "downloading",
							current: 1,
							total: 1,
							percentage: Math.round(progress.loaded / progress.total * 100)
						});
					}
				});
			} catch (error$1) {
				const errorMsg = getErrorMessage(error$1);
				cleanup$1();
				resolve$1({
					success: false,
					error: errorMsg
				});
			}
		});
	}
	var init_single_download = __esmMin((() => {
		init_utils$2();
		init_logging();
		init_filename();
		init_timer_management();
		init_fallback_download();
	}));
	async function sleep(ms, signal) {
		if (ms <= 0) return;
		return new Promise((resolve$1, reject) => {
			const timer = globalTimerManager.setTimeout(() => {
				cleanup$1();
				resolve$1();
			}, ms);
			const onAbort = () => {
				cleanup$1();
				reject(/* @__PURE__ */ new Error("Download cancelled by user"));
			};
			const cleanup$1 = () => {
				globalTimerManager.clearTimeout(timer);
				signal?.removeEventListener("abort", onAbort);
			};
			if (signal) signal.addEventListener("abort", onAbort);
		});
	}
	async function fetchArrayBufferWithRetry(url, retries, signal, backoffBaseMs = 200) {
		const httpService = HttpRequestService.getInstance();
		let attempt = 0;
		while (true) {
			if (signal?.aborted) throw new Error("Download cancelled by user");
			try {
				const options = {
					responseType: "arraybuffer",
					timeout: 3e4,
					...signal ? { signal } : {}
				};
				const response = await httpService.get(url, options);
				if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
				return new Uint8Array(response.data);
			} catch (err$1) {
				if (attempt >= retries) throw err$1;
				attempt += 1;
				await sleep(Math.max(0, Math.floor(backoffBaseMs * 2 ** (attempt - 1))), signal);
			}
		}
	}
	var init_retry_fetch = __esmMin((() => {
		init_http_request_service();
		init_timer_management();
	}));
	function ensureUniqueFilenameFactory() {
		const usedNames = /* @__PURE__ */ new Set();
		const baseCounts = /* @__PURE__ */ new Map();
		return (desired) => {
			if (!usedNames.has(desired)) {
				usedNames.add(desired);
				baseCounts.set(desired, 0);
				return desired;
			}
			const lastDot = desired.lastIndexOf(".");
			const name = lastDot > 0 ? desired.slice(0, lastDot) : desired;
			const ext = lastDot > 0 ? desired.slice(lastDot) : "";
			const baseKey = desired;
			let count = baseCounts.get(baseKey) ?? 0;
			while (true) {
				count += 1;
				const candidate = `${name}-${count}${ext}`;
				if (!usedNames.has(candidate)) {
					baseCounts.set(baseKey, count);
					usedNames.add(candidate);
					return candidate;
				}
			}
		};
	}
	var init_download_utils = __esmMin((() => {}));
	function ensureCRC32Table() {
		if (crc32Table) return crc32Table;
		const table = new Uint32Array(256);
		const polynomial = 3988292384;
		for (let i = 0; i < 256; i++) {
			let crc = i;
			for (let j = 0; j < 8; j++) crc = crc & 1 ? crc >>> 1 ^ polynomial : crc >>> 1;
			table[i] = crc >>> 0;
		}
		crc32Table = table;
		return table;
	}
	function encodeUtf8(value) {
		return textEncoder.encode(value);
	}
	function calculateCRC32(data) {
		const table = ensureCRC32Table();
		let crc = 4294967295;
		for (let i = 0; i < data.length; i++) crc = crc >>> 8 ^ (table[(crc ^ data[i]) & 255] ?? 0);
		return (crc ^ 4294967295) >>> 0;
	}
	function writeUint16LEToBuffer(buffer, offset, value) {
		buffer[offset] = value & 255;
		buffer[offset + 1] = value >>> 8 & 255;
	}
	function writeUint32LEToBuffer(buffer, offset, value) {
		buffer[offset] = value & 255;
		buffer[offset + 1] = value >>> 8 & 255;
		buffer[offset + 2] = value >>> 16 & 255;
		buffer[offset + 3] = value >>> 24 & 255;
	}
	function writeUint16LE(value) {
		const bytes = new Uint8Array(2);
		writeUint16LEToBuffer(bytes, 0, value);
		return bytes;
	}
	function writeUint32LE(value) {
		const bytes = new Uint8Array(4);
		writeUint32LEToBuffer(bytes, 0, value);
		return bytes;
	}
	var textEncoder, crc32Table;
	var init_zip_utils = __esmMin((() => {
		textEncoder = new TextEncoder();
		crc32Table = null;
	}));
	var concat, StreamingZipWriter;
	var init_streaming_zip_writer = __esmMin((() => {
		init_zip_utils();
		concat = (arrays) => {
			let len = 0;
			for (let i = 0; i < arrays.length; i++) len += arrays[i].length;
			const result = new Uint8Array(len);
			let offset = 0;
			for (let i = 0; i < arrays.length; i++) {
				result.set(arrays[i], offset);
				offset += arrays[i].length;
			}
			return result;
		};
		StreamingZipWriter = class {
			chunks = [];
			entries = [];
			currentOffset = 0;
			addFile(filename$1, data) {
				const filenameBytes = encodeUtf8(filename$1);
				const crc32 = calculateCRC32(data);
				const localHeader = concat([
					new Uint8Array([
						80,
						75,
						3,
						4
					]),
					writeUint16LE(20),
					writeUint16LE(2048),
					writeUint16LE(0),
					writeUint16LE(0),
					writeUint16LE(0),
					writeUint32LE(crc32),
					writeUint32LE(data.length),
					writeUint32LE(data.length),
					writeUint16LE(filenameBytes.length),
					writeUint16LE(0),
					filenameBytes
				]);
				this.chunks.push(localHeader, data);
				this.entries.push({
					filename: filename$1,
					data,
					offset: this.currentOffset,
					crc32
				});
				this.currentOffset += localHeader.length + data.length;
			}
			finalize() {
				const centralDirStart = this.currentOffset;
				const centralDirChunks = [];
				for (const entry of this.entries) {
					const filenameBytes = encodeUtf8(entry.filename);
					centralDirChunks.push(concat([
						new Uint8Array([
							80,
							75,
							1,
							2
						]),
						writeUint16LE(20),
						writeUint16LE(20),
						writeUint16LE(2048),
						writeUint16LE(0),
						writeUint16LE(0),
						writeUint16LE(0),
						writeUint32LE(entry.crc32),
						writeUint32LE(entry.data.length),
						writeUint32LE(entry.data.length),
						writeUint16LE(filenameBytes.length),
						writeUint16LE(0),
						writeUint16LE(0),
						writeUint16LE(0),
						writeUint16LE(0),
						writeUint32LE(0),
						writeUint32LE(entry.offset),
						filenameBytes
					]));
				}
				const centralDir = concat(centralDirChunks);
				const endOfCentralDir = concat([
					new Uint8Array([
						80,
						75,
						5,
						6
					]),
					writeUint16LE(0),
					writeUint16LE(0),
					writeUint16LE(this.entries.length),
					writeUint16LE(this.entries.length),
					writeUint32LE(centralDir.length),
					writeUint32LE(centralDirStart),
					writeUint16LE(0)
				]);
				return concat([
					...this.chunks,
					centralDir,
					endOfCentralDir
				]);
			}
			getEntryCount() {
				return this.entries.length;
			}
			getCurrentSize() {
				return this.currentOffset;
			}
		};
	}));
	var zip_exports = /* @__PURE__ */ __export({ StreamingZipWriter: () => StreamingZipWriter }, 1);
	var init_zip = __esmMin((() => {
		init_streaming_zip_writer();
	}));
	async function downloadAsZip(items, options = {}) {
		const { StreamingZipWriter: StreamingZipWriter$1 } = await __vitePreload(async () => {
			const { StreamingZipWriter: StreamingZipWriter$2 } = await Promise.resolve().then(() => (init_zip(), zip_exports));
			return { StreamingZipWriter: StreamingZipWriter$2 };
		}, void 0);
		const writer = new StreamingZipWriter$1();
		const concurrency = Math.min(8, Math.max(1, options.concurrency ?? 6));
		const retries = Math.max(0, options.retries ?? 0);
		const abortSignal = options.signal;
		const total = items.length;
		let processed = 0;
		let successful = 0;
		const failures = [];
		const usedFilenames = [];
		const ensureUniqueFilename = ensureUniqueFilenameFactory();
		let currentIndex$1 = 0;
		const runNext = async () => {
			while (currentIndex$1 < total) {
				if (abortSignal?.aborted) return;
				const item = items[currentIndex$1++];
				if (!item) continue;
				options.onProgress?.({
					phase: "downloading",
					current: processed + 1,
					total,
					percentage: Math.min(100, Math.max(0, Math.round((processed + 1) / total * 100))),
					filename: item.desiredName
				});
				try {
					let data;
					if (item.blob) {
						const blob = item.blob instanceof Promise ? await item.blob : item.blob;
						data = new Uint8Array(await blob.arrayBuffer());
					} else data = await fetchArrayBufferWithRetry(item.url, retries, abortSignal, 200);
					const filename$1 = ensureUniqueFilename(item.desiredName);
					writer.addFile(filename$1, data);
					usedFilenames.push(filename$1);
					successful++;
				} catch (error$1) {
					if (abortSignal?.aborted) throw new Error("Download cancelled by user");
					failures.push({
						url: item.url,
						error: getErrorMessage(error$1)
					});
				} finally {
					processed++;
				}
			}
		};
		const workers = Array.from({ length: concurrency }, () => runNext());
		await Promise.all(workers);
		const zipBytes = writer.finalize();
		return {
			filesSuccessful: successful,
			failures,
			zipData: zipBytes,
			usedFilenames
		};
	}
	var init_zip_download = __esmMin((() => {
		init_preload_helper();
		init_utils$2();
		init_retry_fetch();
		init_download_utils();
	}));
	var download_orchestrator_exports = /* @__PURE__ */ __export({ DownloadOrchestrator: () => DownloadOrchestrator }, 1);
	var DownloadOrchestrator;
	var init_download_orchestrator = __esmMin((() => {
		init_logging();
		init_fallback_download();
		init_single_download();
		init_zip_download();
		init_filename();
		init_lifecycle();
		init_result_types();
		init_singleton();
		DownloadOrchestrator = class DownloadOrchestrator {
			lifecycle;
			static singleton = createSingleton(() => new DownloadOrchestrator());
			capability = null;
			constructor() {
				this.lifecycle = createLifecycle("DownloadOrchestrator", {
					onInitialize: () => this.onInitialize(),
					onDestroy: () => this.onDestroy()
				});
			}
			static getInstance() {
				return DownloadOrchestrator.singleton.get();
			}
			static resetForTests() {
				DownloadOrchestrator.singleton.reset();
			}
			async initialize() {
				return this.lifecycle.initialize();
			}
			destroy() {
				this.lifecycle.destroy();
			}
			isInitialized() {
				return this.lifecycle.isInitialized();
			}
			async onInitialize() {
				logger.debug("[DownloadOrchestrator] Initialized");
			}
			onDestroy() {
				this.capability = null;
			}
			getCapability() {
				if (!this.capability) this.capability = detectDownloadCapability();
				return this.capability;
			}
			async downloadSingle(media, options = {}) {
				return downloadSingleFile(media, options, this.getCapability());
			}
			async downloadBulk(mediaItems, options = {}) {
				const items = mediaItems.map((media) => ({
					url: media.url,
					desiredName: generateMediaFilename(media),
					blob: options.prefetchedBlobs?.get(media.url)
				}));
				try {
					const result = await downloadAsZip(items, options);
					if (result.filesSuccessful === 0) return {
						success: false,
						status: "error",
						filesProcessed: items.length,
						filesSuccessful: 0,
						error: "No files downloaded",
						failures: result.failures,
						code: ErrorCode.ALL_FAILED
					};
					const zipBlob = new Blob([result.zipData], { type: "application/zip" });
					const filename$1 = options.zipFilename || generateZipFilename(mediaItems);
					const saveResult = await this.saveZipBlob(zipBlob, filename$1, options);
					if (!saveResult.success) return {
						success: false,
						status: "error",
						filesProcessed: items.length,
						filesSuccessful: result.filesSuccessful,
						error: saveResult.error || "Failed to save ZIP file",
						failures: result.failures,
						code: ErrorCode.ALL_FAILED
					};
					return {
						success: true,
						status: result.filesSuccessful === items.length ? "success" : "partial",
						filesProcessed: items.length,
						filesSuccessful: result.filesSuccessful,
						filename: filename$1,
						failures: result.failures,
						code: ErrorCode.NONE
					};
				} catch (error$1) {
					return {
						success: false,
						status: "error",
						filesProcessed: items.length,
						filesSuccessful: 0,
						error: error$1 instanceof Error ? error$1.message : "Unknown error",
						code: ErrorCode.ALL_FAILED
					};
				}
			}
			async saveZipBlob(zipBlob, filename$1, options) {
				const capability = this.getCapability();
				if (capability.method === "gm_download" && capability.gmDownload) return this.saveWithGMDownload(capability.gmDownload, zipBlob, filename$1);
				if (capability.method === "fetch_blob") {
					logger.debug("[DownloadOrchestrator] Using anchor fallback for ZIP download");
					const fallbackResult = await downloadBlobWithAnchor(zipBlob, filename$1, {
						signal: options.signal,
						onProgress: options.onProgress
					});
					return fallbackResult.error ? {
						success: fallbackResult.success,
						error: fallbackResult.error
					} : { success: fallbackResult.success };
				}
				return {
					success: false,
					error: "No download method available"
				};
			}
			async saveWithGMDownload(gmDownload, blob, filename$1) {
				const url = URL.createObjectURL(blob);
				try {
					await new Promise((resolve$1, reject) => {
						gmDownload({
							url,
							name: filename$1,
							onload: () => resolve$1(),
							onerror: (err$1) => reject(err$1),
							ontimeout: () => reject(/* @__PURE__ */ new Error("Timeout"))
						});
					});
					return { success: true };
				} catch (error$1) {
					return {
						success: false,
						error: error$1 instanceof Error ? error$1.message : "GM_download failed"
					};
				} finally {
					URL.revokeObjectURL(url);
				}
			}
		};
	}));
	var MediaService;
	var init_media_service = __esmMin((() => {
		init_preload_helper();
		init_lifecycle();
		init_prefetch_manager();
		init_singleton();
		MediaService = class MediaService {
			lifecycle;
			static singleton = createSingleton(() => new MediaService());
			mediaExtraction = null;
			webpSupported = null;
			prefetchManager = new PrefetchManager(20);
			currentAbortController;
			constructor(_options = {}) {
				this.lifecycle = createLifecycle("MediaService", {
					onInitialize: () => this.onInitialize(),
					onDestroy: () => this.onDestroy()
				});
			}
			async initialize() {
				return this.lifecycle.initialize();
			}
			destroy() {
				this.lifecycle.destroy();
			}
			isInitialized() {
				return this.lifecycle.isInitialized();
			}
			async onInitialize() {
				{
					const { MediaExtractionService: MediaExtractionService$1 } = await __vitePreload(async () => {
						const { MediaExtractionService: MediaExtractionService$2 } = await Promise.resolve().then(() => (init_media_extraction_service(), media_extraction_service_exports));
						return { MediaExtractionService: MediaExtractionService$2 };
					}, void 0);
					this.mediaExtraction = new MediaExtractionService$1();
				}
				await this.detectWebPSupport();
			}
			onDestroy() {
				this.prefetchManager.destroy();
			}
			static getInstance(_options) {
				return MediaService.singleton.get();
			}
			static resetForTests() {
				MediaService.singleton.reset();
			}
			async extractFromClickedElement(element, options = {}) {
				if (!this.mediaExtraction) throw new Error("Media Extraction not initialized");
				const result = await this.mediaExtraction.extractFromClickedElement(element, options);
				if (result.success && result.mediaItems.length > 0) {
					const firstItem = result.mediaItems[0];
					if (firstItem) this.prefetchMedia(firstItem, "immediate");
					result.mediaItems.slice(1).forEach((item) => {
						this.prefetchMedia(item, "idle");
					});
				}
				return result;
			}
			async extractAllFromContainer(container$2, options = {}) {
				if (!this.mediaExtraction) throw new Error("Media Extraction not initialized");
				return this.mediaExtraction.extractAllFromContainer(container$2, options);
			}
			async detectWebPSupport() {
				if (typeof document === "undefined") {
					this.webpSupported = false;
					return;
				}
				const canvas = document.createElement("canvas");
				if (typeof canvas.toDataURL !== "function") {
					this.webpSupported = false;
					return;
				}
				this.webpSupported = canvas.toDataURL("image/webp").indexOf("data:image/webp") === 0;
			}
			isWebPSupported() {
				return this.webpSupported ?? false;
			}
			getOptimizedImageUrl(originalUrl) {
				if (!this.isWebPSupported()) return originalUrl;
				try {
					const url = new URL(originalUrl);
					if (url.hostname === "pbs.twimg.com") {
						if (url.searchParams.get("format") === "webp") return originalUrl;
						url.searchParams.set("format", "webp");
						return url.toString();
					}
				} catch {
					return originalUrl;
				}
				return originalUrl;
			}
			optimizeWebP(url) {
				return this.getOptimizedImageUrl(url);
			}
			async prefetchMedia(media, schedule = "idle") {
				return this.prefetchManager.prefetch(media, schedule);
			}
			getCachedMedia(url) {
				return this.prefetchManager.get(url);
			}
			cancelAllPrefetch() {
				this.prefetchManager.cancelAll();
			}
			clearPrefetchCache() {
				this.prefetchManager.clear();
			}
			async downloadSingle(media, options = {}) {
				const { DownloadOrchestrator: DownloadOrchestrator$1 } = await __vitePreload(async () => {
					const { DownloadOrchestrator: DownloadOrchestrator$2 } = await Promise.resolve().then(() => (init_download_orchestrator(), download_orchestrator_exports));
					return { DownloadOrchestrator: DownloadOrchestrator$2 };
				}, void 0);
				const downloadService = DownloadOrchestrator$1.getInstance();
				const pendingPromise = this.prefetchManager.get(media.url);
				let blob;
				if (pendingPromise) try {
					blob = await pendingPromise;
				} catch {}
				return downloadService.downloadSingle(media, {
					...options,
					...blob ? { blob } : {}
				});
			}
			async downloadMultiple(items, options = {}) {
				const { DownloadOrchestrator: DownloadOrchestrator$1 } = await __vitePreload(async () => {
					const { DownloadOrchestrator: DownloadOrchestrator$2 } = await Promise.resolve().then(() => (init_download_orchestrator(), download_orchestrator_exports));
					return { DownloadOrchestrator: DownloadOrchestrator$2 };
				}, void 0);
				return DownloadOrchestrator$1.getInstance().downloadBulk(items, {
					...options,
					prefetchedBlobs: this.prefetchManager.getCache()
				});
			}
			async downloadBulk(items, options = {}) {
				return this.downloadMultiple(Array.from(items), options);
			}
			cancelDownload() {
				this.currentAbortController?.abort();
			}
			isDownloading() {
				return !!this.currentAbortController;
			}
			async cleanup() {
				this.cancelAllPrefetch();
				this.clearPrefetchCache();
				this.onDestroy();
			}
		};
	}));
	var init_i18n = __esmMin((() => {
		init_language_types();
		init_translation_registry();
	})), THEME_DOM_ATTRIBUTE;
	var init_theme$1 = __esmMin((() => {
		THEME_DOM_ATTRIBUTE = "data-theme";
	}));
	var init_constants = __esmMin((() => {
		init_i18n();
		init_theme$1();
	}));
	function syncThemeAttributes(theme, options = {}) {
		if (typeof document === "undefined") return;
		const { scopes, includeDocumentRoot = false } = options;
		if (includeDocumentRoot) document.documentElement?.setAttribute(THEME_DOM_ATTRIBUTE, theme);
		const targets = scopes ?? document.querySelectorAll(".xeg-theme-scope");
		for (const target of Array.from(targets)) if (target instanceof HTMLElement) target.setAttribute(THEME_DOM_ATTRIBUTE, theme);
	}
	var init_theme = __esmMin((() => {
		init_constants();
	}));
	var lazy_services_exports = /* @__PURE__ */ __export({
		__resetLazyServiceRegistration: () => __resetLazyServiceRegistration,
		ensureDownloadServiceRegistered: () => ensureDownloadServiceRegistered
	}, 1);
	async function ensureDownloadServiceRegistered() {
		if (downloadServiceRegistered) return;
		try {
			const { DownloadOrchestrator: DownloadOrchestrator$1 } = await __vitePreload(async () => {
				const { DownloadOrchestrator: DownloadOrchestrator$2 } = await Promise.resolve().then(() => (init_download_orchestrator(), download_orchestrator_exports));
				return { DownloadOrchestrator: DownloadOrchestrator$2 };
			}, void 0);
			const downloadService = DownloadOrchestrator$1.getInstance();
			const { CoreService: CoreService$1 } = await __vitePreload(async () => {
				const { CoreService: CoreService$2 } = await Promise.resolve().then(() => (init_service_manager(), service_manager_exports));
				return { CoreService: CoreService$2 };
			}, void 0);
			const { SERVICE_KEYS: SERVICE_KEYS$1 } = await __vitePreload(async () => {
				const { SERVICE_KEYS: SERVICE_KEYS$2 } = await Promise.resolve().then(() => (init_constants$1(), constants_exports));
				return { SERVICE_KEYS: SERVICE_KEYS$2 };
			}, void 0);
			const serviceManager$1 = CoreService$1.getInstance();
			serviceManager$1.register(SERVICE_KEYS$1.GALLERY_DOWNLOAD, downloadService);
			serviceManager$1.register(SERVICE_KEYS$1.BULK_DOWNLOAD, downloadService);
			downloadServiceRegistered = true;
			logger.info("✅ DownloadService lazily registered (first download)");
		} catch (error$1) {
			const message = error$1 instanceof Error ? error$1.message : String(error$1);
			logger.error("❌ Failed to lazily register DownloadService:", message);
			throw error$1;
		}
	}
	function __resetLazyServiceRegistration() {
		downloadServiceRegistered = false;
	}
	var downloadServiceRegistered;
	var init_lazy_services = __esmMin((() => {
		init_preload_helper();
		init_logging();
		downloadServiceRegistered = false;
	}));
	var service_accessors_exports = /* @__PURE__ */ __export({
		CORE_BASE_SERVICE_IDENTIFIERS: () => CORE_BASE_SERVICE_IDENTIFIERS,
		LANGUAGE_SERVICE_IDENTIFIER: () => LANGUAGE_SERVICE_IDENTIFIER,
		MEDIA_SERVICE_IDENTIFIER: () => MEDIA_SERVICE_IDENTIFIER,
		THEME_SERVICE_IDENTIFIER: () => THEME_SERVICE_IDENTIFIER,
		getDownloadOrchestrator: () => getDownloadOrchestrator,
		getGalleryRenderer: () => getGalleryRenderer,
		getLanguageService: () => getLanguageService,
		getMediaService: () => getMediaService,
		getThemeService: () => getThemeService,
		registerGalleryRenderer: () => registerGalleryRenderer,
		registerSettingsManager: () => registerSettingsManager,
		tryGetSettingsManager: () => tryGetSettingsManager,
		warmupCriticalServices: () => warmupCriticalServices,
		warmupNonCriticalServices: () => warmupNonCriticalServices
	}, 1);
	function tryGetFromCoreService(key) {
		try {
			const coreService = CoreService.getInstance();
			if (coreService.has(key)) return coreService.get(key);
		} catch {}
		return null;
	}
	function getThemeService() {
		return tryGetFromCoreService(SERVICE_KEYS.THEME) ?? getThemeServiceInstance();
	}
	function getLanguageService() {
		return tryGetFromCoreService(SERVICE_KEYS.LANGUAGE) ?? getLanguageServiceInstance();
	}
	function getMediaService() {
		return tryGetFromCoreService(SERVICE_KEYS.MEDIA_SERVICE) ?? getMediaServiceInstance();
	}
	function getGalleryRenderer() {
		return CoreService.getInstance().get(SERVICE_KEYS.GALLERY_RENDERER);
	}
	async function getDownloadOrchestrator() {
		const { ensureDownloadServiceRegistered: ensureDownloadServiceRegistered$1 } = await __vitePreload(async () => {
			const { ensureDownloadServiceRegistered: ensureDownloadServiceRegistered$2 } = await Promise.resolve().then(() => (init_lazy_services(), lazy_services_exports));
			return { ensureDownloadServiceRegistered: ensureDownloadServiceRegistered$2 };
		}, void 0);
		await ensureDownloadServiceRegistered$1();
		const { DownloadOrchestrator: DownloadOrchestrator$1 } = await __vitePreload(async () => {
			const { DownloadOrchestrator: DownloadOrchestrator$2 } = await Promise.resolve().then(() => (init_download_orchestrator(), download_orchestrator_exports));
			return { DownloadOrchestrator: DownloadOrchestrator$2 };
		}, void 0);
		return DownloadOrchestrator$1.getInstance();
	}
	function registerGalleryRenderer(renderer) {
		CoreService.getInstance().register(SERVICE_KEYS.GALLERY_RENDERER, renderer);
	}
	function registerSettingsManager(settings) {
		CoreService.getInstance().register(SERVICE_KEYS.SETTINGS, settings);
	}
	function tryGetSettingsManager() {
		return CoreService.getInstance().tryGet(SERVICE_KEYS.SETTINGS);
	}
	function warmupCriticalServices() {
		try {
			getMediaService();
		} catch {}
	}
	function warmupNonCriticalServices() {
		try {
			getThemeService();
		} catch {}
	}
	var THEME_SERVICE_IDENTIFIER, LANGUAGE_SERVICE_IDENTIFIER, MEDIA_SERVICE_IDENTIFIER, CORE_BASE_SERVICE_IDENTIFIERS;
	var init_service_accessors = __esmMin((() => {
		init_preload_helper();
		init_constants$1();
		init_service_manager();
		init_singletons();
		THEME_SERVICE_IDENTIFIER = SERVICE_KEYS.THEME;
		LANGUAGE_SERVICE_IDENTIFIER = SERVICE_KEYS.LANGUAGE;
		MEDIA_SERVICE_IDENTIFIER = SERVICE_KEYS.MEDIA_SERVICE;
		CORE_BASE_SERVICE_IDENTIFIERS = [
			THEME_SERVICE_IDENTIFIER,
			LANGUAGE_SERVICE_IDENTIFIER,
			MEDIA_SERVICE_IDENTIFIER
		];
	}));
	var ThemeService;
	var init_theme_service = __esmMin((() => {
		init_preload_helper();
		init_constants$1();
		init_theme();
		init_logging();
		init_lifecycle();
		init_persistent_storage();
		init_singleton();
		ThemeService = class ThemeService {
			lifecycle;
			storage = getPersistentStorage();
			mediaQueryList = null;
			currentTheme = "light";
			themeSetting = "auto";
			listeners = /* @__PURE__ */ new Set();
			boundSettingsService = null;
			settingsUnsubscribe = null;
			observer = null;
			static singleton = createSingleton(() => new ThemeService());
			static getInstance() {
				return ThemeService.singleton.get();
			}
			static resetForTests() {
				ThemeService.singleton.reset();
			}
			constructor() {
				this.lifecycle = createLifecycle("ThemeService", {
					onInitialize: () => this.onInitialize(),
					onDestroy: () => this.onDestroy()
				});
				if (typeof window !== "undefined") {
					this.mediaQueryList = window.matchMedia("(prefers-color-scheme: dark)");
					this.observer = new MutationObserver((mutations) => {
						for (const m of mutations) m.addedNodes.forEach((node) => {
							if (node instanceof Element) {
								if (node.classList.contains("xeg-theme-scope")) syncThemeAttributes(this.currentTheme, { scopes: [node] });
								node.querySelectorAll(".xeg-theme-scope").forEach((scope) => {
									syncThemeAttributes(this.currentTheme, { scopes: [scope] });
								});
							}
						});
					});
					if (document.documentElement) this.observer.observe(document.documentElement, {
						childList: true,
						subtree: true
					});
					else logger.warn("[ThemeService] document.documentElement not available for observation");
				}
				this.themeSetting = this.loadThemeSync();
				this.applyCurrentTheme(true);
				Promise.resolve().then(async () => {
					const saved = await this.loadThemeAsync();
					if (saved && saved !== this.themeSetting) {
						this.themeSetting = saved;
						this.applyCurrentTheme(true);
					}
					this.initializeSystemDetection();
				});
			}
			async initialize() {
				return this.lifecycle.initialize();
			}
			destroy() {
				this.lifecycle.destroy();
			}
			isInitialized() {
				return this.lifecycle.isInitialized();
			}
			async onInitialize() {
				const saved = await this.loadThemeAsync();
				if (saved && saved !== this.themeSetting) {
					this.themeSetting = saved;
					this.applyCurrentTheme(true);
				}
				this.initializeSystemDetection();
				try {
					const { tryGetSettingsManager: tryGetSettingsManager$1 } = await __vitePreload(async () => {
						const { tryGetSettingsManager: tryGetSettingsManager$2 } = await Promise.resolve().then(() => (init_service_accessors(), service_accessors_exports));
						return { tryGetSettingsManager: tryGetSettingsManager$2 };
					}, void 0);
					const settingsService = tryGetSettingsManager$1();
					if (settingsService) this.bindSettingsService(settingsService);
				} catch (err$1) {
					logger.debug("[ThemeService] SettingsService not available", err$1);
				}
			}
			bindSettingsService(settingsService) {
				if (!settingsService || this.boundSettingsService === settingsService) return;
				if (this.settingsUnsubscribe) this.settingsUnsubscribe();
				this.boundSettingsService = settingsService;
				const settingsTheme = settingsService.get?.("gallery.theme");
				if (settingsTheme && [
					"light",
					"dark",
					"auto"
				].includes(settingsTheme)) {
					if (settingsTheme !== this.themeSetting) {
						this.themeSetting = settingsTheme;
						this.applyCurrentTheme(true);
					}
				}
				if (typeof settingsService.subscribe === "function") this.settingsUnsubscribe = settingsService.subscribe((event) => {
					if (event?.key === "gallery.theme") {
						const newVal = event.newValue;
						if ([
							"light",
							"dark",
							"auto"
						].includes(newVal) && newVal !== this.themeSetting) {
							this.themeSetting = newVal;
							this.applyCurrentTheme();
						}
					}
				});
			}
			setTheme(setting$1, options) {
				this.themeSetting = [
					"light",
					"dark",
					"auto"
				].includes(setting$1) ? setting$1 : "light";
				if (options?.persist !== false && this.boundSettingsService?.set) this.boundSettingsService.set("gallery.theme", this.themeSetting);
				if (!this.applyCurrentTheme(options?.force)) this.notifyListeners();
			}
			getEffectiveTheme() {
				if (this.themeSetting === "auto") return this.mediaQueryList?.matches ? "dark" : "light";
				return this.themeSetting;
			}
			getCurrentTheme() {
				return this.themeSetting;
			}
			isDarkMode() {
				return this.getEffectiveTheme() === "dark";
			}
			onThemeChange(listener) {
				this.listeners.add(listener);
				return () => this.listeners.delete(listener);
			}
			onDestroy() {
				if (this.settingsUnsubscribe) this.settingsUnsubscribe();
				this.listeners.clear();
				this.observer?.disconnect();
			}
			initializeSystemDetection() {
				if (this.mediaQueryList) this.mediaQueryList.addEventListener("change", () => {
					if (this.themeSetting === "auto") this.applyCurrentTheme();
				});
			}
			applyCurrentTheme(force = false) {
				const effective = this.getEffectiveTheme();
				if (force || this.currentTheme !== effective) {
					this.currentTheme = effective;
					syncThemeAttributes(this.currentTheme);
					this.notifyListeners();
					return true;
				}
				return false;
			}
			notifyListeners() {
				this.listeners.forEach((l) => l(this.currentTheme, this.themeSetting));
			}
			loadThemeSync() {
				try {
					return this.storage.getSync(APP_SETTINGS_STORAGE_KEY)?.gallery?.theme ?? "auto";
				} catch {
					return "auto";
				}
			}
			async loadThemeAsync() {
				try {
					return (await this.storage.get(APP_SETTINGS_STORAGE_KEY))?.gallery?.theme ?? null;
				} catch {
					return null;
				}
			}
		};
	}));
	function getThemeServiceInstance() {
		return ThemeService.getInstance();
	}
	function getLanguageServiceInstance() {
		return LanguageService.getInstance();
	}
	function getMediaServiceInstance() {
		return MediaService.getInstance();
	}
	var init_singletons = __esmMin((() => {
		init_language_service();
		init_media_service();
		init_theme_service();
	}));
	var service_initialization_exports = /* @__PURE__ */ __export({ registerCoreServices: () => registerCoreServices }, 1);
	async function registerCoreServices() {
		const core = CoreService.getInstance();
		core.register(SERVICE_KEYS.THEME, getThemeServiceInstance());
		core.register(SERVICE_KEYS.LANGUAGE, getLanguageServiceInstance());
		core.register(SERVICE_KEYS.MEDIA_SERVICE, getMediaServiceInstance());
	}
	var init_service_initialization = __esmMin((() => {
		init_constants$1();
		init_service_manager();
		init_singletons();
	}));
	var init_harness = __esmMin((() => {
		init_preload_helper();
		init_service_manager();
		init_singletons();
	}));
	var init_container = __esmMin((() => {
		init_harness();
		init_service_accessors();
	}));
	function normalizeErrorMessage$1(error$1) {
		if (error$1 instanceof Error) return error$1.message || error$1.name || "Error";
		if (typeof error$1 === "string" && error$1.length > 0) return error$1;
		if (error$1 && typeof error$1 === "object") {
			if ("message" in error$1 && typeof error$1.message === "string") return error$1.message;
			try {
				return JSON.stringify(error$1);
			} catch {
				return String(error$1);
			}
		}
		if (error$1 === null) return "null";
		if (error$1 === void 0) return "undefined";
		return String(error$1);
	}
	function extractStackTrace(error$1) {
		if (error$1 instanceof Error && error$1.stack) return error$1.stack;
	}
	function formatContextTag(context, code) {
		const base = `[${context.charAt(0).toUpperCase() + context.slice(1)}]`;
		return code ? `${base}[${code}]` : base;
	}
	var SEVERITY_LOG_MAP, DEFAULT_SEVERITY, AppErrorReporter, bootstrapErrorReporter, galleryErrorReporter, mediaErrorReporter, downloadErrorReporter, settingsErrorReporter, eventErrorReporter, networkErrorReporter, storageErrorReporter, uiErrorReporter;
	var init_app_error_reporter = __esmMin((() => {
		init_logging();
		SEVERITY_LOG_MAP = {
			critical: "error",
			error: "error",
			warning: "warn",
			info: "info"
		};
		DEFAULT_SEVERITY = "error";
		AppErrorReporter = class AppErrorReporter {
			static notificationCallback = null;
			static setNotificationCallback(callback) {
				AppErrorReporter.notificationCallback = callback;
			}
			static report(error$1, options) {
				const severity = options.severity ?? DEFAULT_SEVERITY;
				const message = normalizeErrorMessage$1(error$1);
				const tag = formatContextTag(options.context, options.code);
				const logLevel = SEVERITY_LOG_MAP[severity];
				const stack = extractStackTrace(error$1);
				const logPayload = {
					context: options.context,
					severity
				};
				if (options.metadata) logPayload.metadata = options.metadata;
				if (stack && severity !== "info") logPayload.stack = stack;
				logger[logLevel](`${tag} ${message}`, logPayload);
				if (options.notify && AppErrorReporter.notificationCallback) AppErrorReporter.notificationCallback(message, options.context);
				const result = {
					reported: true,
					message,
					context: options.context,
					severity
				};
				if (severity === "critical") throw error$1 instanceof Error ? error$1 : new Error(message);
				return result;
			}
			static reportAndReturn(error$1, options, defaultValue) {
				const effectiveOptions = {
					...options,
					severity: options.severity === "critical" ? "error" : options.severity
				};
				AppErrorReporter.report(error$1, effectiveOptions);
				return defaultValue;
			}
			static forContext(context) {
				return {
					critical: (error$1, options) => AppErrorReporter.report(error$1, {
						...options,
						context,
						severity: "critical"
					}),
					error: (error$1, options) => AppErrorReporter.report(error$1, {
						...options,
						context,
						severity: "error"
					}),
					warn: (error$1, options) => AppErrorReporter.report(error$1, {
						...options,
						context,
						severity: "warning"
					}),
					info: (error$1, options) => AppErrorReporter.report(error$1, {
						...options,
						context,
						severity: "info"
					})
				};
			}
		};
		bootstrapErrorReporter = AppErrorReporter.forContext("bootstrap");
		galleryErrorReporter = AppErrorReporter.forContext("gallery");
		mediaErrorReporter = AppErrorReporter.forContext("media");
		downloadErrorReporter = AppErrorReporter.forContext("download");
		settingsErrorReporter = AppErrorReporter.forContext("settings");
		eventErrorReporter = AppErrorReporter.forContext("event");
		networkErrorReporter = AppErrorReporter.forContext("network");
		storageErrorReporter = AppErrorReporter.forContext("storage");
		uiErrorReporter = AppErrorReporter.forContext("ui");
	}));
	var GlobalErrorHandler, globalErrorHandler;
	var init_error_handler = __esmMin((() => {
		init_logging();
		init_singleton();
		GlobalErrorHandler = class GlobalErrorHandler {
			static singleton = createSingleton(() => new GlobalErrorHandler());
			isInitialized = false;
			errorListener = (event) => {
				const message = event.message ?? "Unknown error occurred";
				const location = event.filename ? `${event.filename}:${event.lineno ?? 0}:${event.colno ?? 0}` : void 0;
				logger.error(`[UncaughtError] ${message}`, {
					type: "uncaught-error",
					location
				});
				event.preventDefault();
			};
			rejectionListener = (event) => {
				const { reason } = event;
				const message = reason instanceof Error ? reason.message : typeof reason === "string" ? reason : `Unhandled rejection: ${String(reason)}`;
				logger.error(`[UnhandledRejection] ${message}`, {
					type: "unhandled-rejection",
					reason
				});
				event.preventDefault();
			};
			static getInstance() {
				return GlobalErrorHandler.singleton.get();
			}
			static resetForTests() {
				GlobalErrorHandler.singleton.reset();
			}
			constructor() {}
			initialize() {
				if (this.isInitialized || typeof window === "undefined") return;
				window.addEventListener("error", this.errorListener);
				window.addEventListener("unhandledrejection", this.rejectionListener);
				this.isInitialized = true;
			}
			destroy() {
				if (!this.isInitialized || typeof window === "undefined") return;
				window.removeEventListener("error", this.errorListener);
				window.removeEventListener("unhandledrejection", this.rejectionListener);
				this.isInitialized = false;
			}
		};
		globalErrorHandler = GlobalErrorHandler.getInstance();
	}));
	function withErrorHandling(fn, options) {
		const { fallback, rethrow = false, transformError, metadata: metadataFn, ...reportOptions } = options;
		return async (...args) => {
			try {
				return await fn(...args);
			} catch (rawError) {
				const error$1 = transformError ? transformError(rawError) : rawError;
				const dynamicMetadata = metadataFn ? metadataFn(error$1) : null;
				const fullOptions = dynamicMetadata ? {
					...reportOptions,
					metadata: dynamicMetadata
				} : reportOptions;
				if (rethrow) {
					AppErrorReporter.report(error$1, fullOptions);
					throw error$1;
				}
				return AppErrorReporter.reportAndReturn(error$1, fullOptions, fallback);
			}
		};
	}
	function withSyncErrorHandling(fn, options) {
		const { fallback, rethrow = false, transformError, metadata: metadataFn, ...reportOptions } = options;
		return (...args) => {
			try {
				return fn(...args);
			} catch (rawError) {
				const error$1 = transformError ? transformError(rawError) : rawError;
				const dynamicMetadata = metadataFn ? metadataFn(error$1) : null;
				const fullOptions = dynamicMetadata ? {
					...reportOptions,
					metadata: dynamicMetadata
				} : reportOptions;
				if (rethrow) {
					AppErrorReporter.report(error$1, fullOptions);
					throw error$1;
				}
				return AppErrorReporter.reportAndReturn(error$1, fullOptions, fallback);
			}
		};
	}
	function withErrorResult(fn, options) {
		const { transformError, metadata: metadataFn, ...reportOptions } = options;
		return async (...args) => {
			try {
				return {
					success: true,
					value: await fn(...args)
				};
			} catch (rawError) {
				const error$1 = transformError ? transformError(rawError) : rawError;
				const dynamicMetadata = metadataFn ? metadataFn(error$1) : null;
				const fullOptions = dynamicMetadata ? {
					...reportOptions,
					metadata: dynamicMetadata
				} : reportOptions;
				AppErrorReporter.report(error$1, fullOptions);
				return {
					success: false,
					value: void 0,
					error: error$1
				};
			}
		};
	}
	function withSyncErrorResult(fn, options) {
		const { transformError, metadata: metadataFn, ...reportOptions } = options;
		return (...args) => {
			try {
				return {
					success: true,
					value: fn(...args)
				};
			} catch (rawError) {
				const error$1 = transformError ? transformError(rawError) : rawError;
				const dynamicMetadata = metadataFn ? metadataFn(error$1) : null;
				const fullOptions = dynamicMetadata ? {
					...reportOptions,
					metadata: dynamicMetadata
				} : reportOptions;
				AppErrorReporter.report(error$1, fullOptions);
				return {
					success: false,
					value: void 0,
					error: error$1
				};
			}
		};
	}
	async function tryAsync(fn, options) {
		return withErrorHandling(fn, options)();
	}
	function trySync(fn, options) {
		return withSyncErrorHandling(fn, options)();
	}
	function mapErrorToCode(error$1) {
		if (error$1 instanceof DOMException && error$1.name === "AbortError") return ErrorCode.CANCELLED;
		if (error$1 instanceof TypeError) {
			const message = error$1.message.toLowerCase();
			if (message.includes("fetch") || message.includes("network")) return ErrorCode.NETWORK;
		}
		if (error$1 instanceof Error && error$1.name === "TimeoutError") return ErrorCode.TIMEOUT;
		return ErrorCode.UNKNOWN;
	}
	function normalizeError(error$1) {
		if (error$1 instanceof Error) return error$1.message;
		if (typeof error$1 === "string") return error$1;
		return String(error$1);
	}
	function withResultHandling(fn, options) {
		const { code: overrideCode, errorCodeMapper = mapErrorToCode, transformError, metadata: metadataFn, ...reportOptions } = options;
		return async (...args) => {
			try {
				return success(await fn(...args));
			} catch (rawError) {
				const error$1 = transformError ? transformError(rawError) : rawError;
				const errorMessage = normalizeError(error$1);
				const errorCode = overrideCode ?? errorCodeMapper(error$1);
				const dynamicMetadata = metadataFn ? metadataFn(error$1) : void 0;
				const fullOptions = {
					...reportOptions,
					code: String(errorCode),
					...dynamicMetadata && { metadata: dynamicMetadata }
				};
				AppErrorReporter.report(error$1, fullOptions);
				return failure(errorMessage, errorCode, {
					cause: error$1,
					...dynamicMetadata && { meta: dynamicMetadata }
				});
			}
		};
	}
	function withSyncResultHandling(fn, options) {
		const { code: overrideCode, errorCodeMapper = mapErrorToCode, transformError, metadata: metadataFn, ...reportOptions } = options;
		return (...args) => {
			try {
				return success(fn(...args));
			} catch (rawError) {
				const error$1 = transformError ? transformError(rawError) : rawError;
				const errorMessage = normalizeError(error$1);
				const errorCode = overrideCode ?? errorCodeMapper(error$1);
				const dynamicMetadata = metadataFn ? metadataFn(error$1) : void 0;
				const fullOptions = {
					...reportOptions,
					code: String(errorCode),
					...dynamicMetadata && { metadata: dynamicMetadata }
				};
				AppErrorReporter.report(error$1, fullOptions);
				return failure(errorMessage, errorCode, {
					cause: error$1,
					...dynamicMetadata && { meta: dynamicMetadata }
				});
			}
		};
	}
	function createErrorHandlers(context) {
		return {
			wrap: (fn, options) => withErrorHandling(fn, {
				...options,
				context
			}),
			wrapSync: (fn, options) => withSyncErrorHandling(fn, {
				...options,
				context
			}),
			wrapResult: (fn, options) => withErrorResult(fn, {
				...options,
				context
			}),
			wrapWithResult: (fn, options) => withResultHandling(fn, {
				...options,
				context
			}),
			wrapSyncWithResult: (fn, options) => withSyncResultHandling(fn, {
				...options,
				context
			}),
			tryAsync: (fn, options) => tryAsync(fn, {
				...options,
				context
			}),
			trySync: (fn, options) => trySync(fn, {
				...options,
				context
			})
		};
	}
	var bootstrapErrors, galleryErrors, mediaErrors, downloadErrors, settingsErrors, eventErrors, networkErrors, storageErrors, uiErrors;
	var init_error_handling_hof = __esmMin((() => {
		init_result_types();
		init_app_error_reporter();
		bootstrapErrors = createErrorHandlers("bootstrap");
		galleryErrors = createErrorHandlers("gallery");
		mediaErrors = createErrorHandlers("media");
		downloadErrors = createErrorHandlers("download");
		settingsErrors = createErrorHandlers("settings");
		eventErrors = createErrorHandlers("event");
		networkErrors = createErrorHandlers("network");
		storageErrors = createErrorHandlers("storage");
		uiErrors = createErrorHandlers("ui");
	}));
	var error_exports = /* @__PURE__ */ __export({
		AppErrorReporter: () => AppErrorReporter,
		GlobalErrorHandler: () => GlobalErrorHandler,
		bootstrapErrorReporter: () => bootstrapErrorReporter,
		bootstrapErrors: () => bootstrapErrors,
		createErrorHandlers: () => createErrorHandlers,
		downloadErrorReporter: () => downloadErrorReporter,
		downloadErrors: () => downloadErrors,
		eventErrorReporter: () => eventErrorReporter,
		eventErrors: () => eventErrors,
		galleryErrorReporter: () => galleryErrorReporter,
		galleryErrors: () => galleryErrors,
		globalErrorHandler: () => globalErrorHandler,
		mediaErrorReporter: () => mediaErrorReporter,
		mediaErrors: () => mediaErrors,
		networkErrorReporter: () => networkErrorReporter,
		networkErrors: () => networkErrors,
		normalizeErrorMessage: () => normalizeErrorMessage$1,
		settingsErrorReporter: () => settingsErrorReporter,
		settingsErrors: () => settingsErrors,
		storageErrorReporter: () => storageErrorReporter,
		storageErrors: () => storageErrors,
		tryAsync: () => tryAsync,
		trySync: () => trySync,
		uiErrorReporter: () => uiErrorReporter,
		uiErrors: () => uiErrors,
		withErrorHandling: () => withErrorHandling,
		withErrorResult: () => withErrorResult,
		withResultHandling: () => withResultHandling,
		withSyncErrorHandling: () => withSyncErrorHandling,
		withSyncErrorResult: () => withSyncErrorResult,
		withSyncResultHandling: () => withSyncResultHandling
	}, 1);
	var init_error = __esmMin((() => {
		init_app_error_reporter();
		init_error_handler();
		init_error_handling_hof();
	}));
	function getContextId(count) {
		const num = String(count), len = num.length - 1;
		return sharedConfig.context.id + (len ? String.fromCharCode(96 + len) : "") + num;
	}
	function setHydrateContext(context) {
		sharedConfig.context = context;
	}
	function nextHydrateContext() {
		return {
			...sharedConfig.context,
			id: sharedConfig.getNextContextId(),
			count: 0
		};
	}
	function createRoot(fn, detachedOwner) {
		const listener = Listener, owner = Owner, unowned = fn.length === 0, current = detachedOwner === void 0 ? owner : detachedOwner, root = unowned ? {
			owned: null,
			cleanups: null,
			context: null,
			owner: null
		} : {
			owned: null,
			cleanups: null,
			context: current ? current.context : null,
			owner: current
		}, updateFn = unowned ? () => fn(() => {
			throw new Error("Dispose method must be an explicit argument to createRoot function");
		}) : () => fn(() => untrack(() => cleanNode(root)));
		DevHooks.afterCreateOwner && DevHooks.afterCreateOwner(root);
		Owner = root;
		Listener = null;
		try {
			return runUpdates(updateFn, true);
		} finally {
			Listener = listener;
			Owner = owner;
		}
	}
	function createSignal(value, options) {
		options = options ? Object.assign({}, signalOptions, options) : signalOptions;
		const s = {
			value,
			observers: null,
			observerSlots: null,
			comparator: options.equals || void 0
		};
		if (options.name) s.name = options.name;
		if (options.internal) s.internal = true;
		else {
			registerGraph(s);
			if (DevHooks.afterCreateSignal) DevHooks.afterCreateSignal(s);
		}
		const setter = (value$1) => {
			if (typeof value$1 === "function") if (Transition && Transition.running && Transition.sources.has(s)) value$1 = value$1(s.tValue);
			else value$1 = value$1(s.value);
			return writeSignal(s, value$1);
		};
		return [readSignal.bind(s), setter];
	}
	function createComputed(fn, value, options) {
		const c = createComputation(fn, value, true, STALE, options);
		if (Scheduler && Transition && Transition.running) Updates.push(c);
		else updateComputation(c);
	}
	function createRenderEffect(fn, value, options) {
		const c = createComputation(fn, value, false, STALE, options);
		if (Scheduler && Transition && Transition.running) Updates.push(c);
		else updateComputation(c);
	}
	function createEffect(fn, value, options) {
		runEffects = runUserEffects;
		const c = createComputation(fn, value, false, STALE, options), s = SuspenseContext && useContext(SuspenseContext);
		if (s) c.suspense = s;
		if (!options || !options.render) c.user = true;
		Effects ? Effects.push(c) : updateComputation(c);
	}
	function createMemo(fn, value, options) {
		options = options ? Object.assign({}, signalOptions, options) : signalOptions;
		const c = createComputation(fn, value, true, 0, options);
		c.observers = null;
		c.observerSlots = null;
		c.comparator = options.equals || void 0;
		if (Scheduler && Transition && Transition.running) {
			c.tState = STALE;
			Updates.push(c);
		} else updateComputation(c);
		return readSignal.bind(c);
	}
	function isPromise(v) {
		return v && typeof v === "object" && "then" in v;
	}
	function createResource(pSource, pFetcher, pOptions) {
		let source;
		let fetcher;
		let options;
		if (typeof pFetcher === "function") {
			source = pSource;
			fetcher = pFetcher;
			options = pOptions || {};
		} else {
			source = true;
			fetcher = pSource;
			options = pFetcher || {};
		}
		let pr = null, initP = NO_INIT, id = null, loadedUnderTransition = false, scheduled = false, resolved = "initialValue" in options, dynamic = typeof source === "function" && createMemo(source);
		const contexts = /* @__PURE__ */ new Set(), [value, setValue] = (options.storage || createSignal)(options.initialValue), [error$1, setError$1] = createSignal(void 0), [track, trigger] = createSignal(void 0, { equals: false }), [state, setState] = createSignal(resolved ? "ready" : "unresolved");
		if (sharedConfig.context) {
			id = sharedConfig.getNextContextId();
			if (options.ssrLoadFrom === "initial") initP = options.initialValue;
			else if (sharedConfig.load && sharedConfig.has(id)) initP = sharedConfig.load(id);
		}
		function loadEnd(p, v, error$2, key) {
			if (pr === p) {
				pr = null;
				key !== void 0 && (resolved = true);
				if ((p === initP || v === initP) && options.onHydrated) queueMicrotask(() => options.onHydrated(key, { value: v }));
				initP = NO_INIT;
				if (Transition && p && loadedUnderTransition) {
					Transition.promises.delete(p);
					loadedUnderTransition = false;
					runUpdates(() => {
						Transition.running = true;
						completeLoad(v, error$2);
					}, false);
				} else completeLoad(v, error$2);
			}
			return v;
		}
		function completeLoad(v, err$1) {
			runUpdates(() => {
				if (err$1 === void 0) setValue(() => v);
				setState(err$1 !== void 0 ? "errored" : resolved ? "ready" : "unresolved");
				setError$1(err$1);
				for (const c of contexts.keys()) c.decrement();
				contexts.clear();
			}, false);
		}
		function read() {
			const c = SuspenseContext && useContext(SuspenseContext), v = value(), err$1 = error$1();
			if (err$1 !== void 0 && !pr) throw err$1;
			if (Listener && !Listener.user && c) createComputed(() => {
				track();
				if (pr) {
					if (c.resolved && Transition && loadedUnderTransition) Transition.promises.add(pr);
					else if (!contexts.has(c)) {
						c.increment();
						contexts.add(c);
					}
				}
			});
			return v;
		}
		function load(refetching = true) {
			if (refetching !== false && scheduled) return;
			scheduled = false;
			const lookup = dynamic ? dynamic() : source;
			loadedUnderTransition = Transition && Transition.running;
			if (lookup == null || lookup === false) {
				loadEnd(pr, untrack(value));
				return;
			}
			if (Transition && pr) Transition.promises.delete(pr);
			let error$2;
			const p = initP !== NO_INIT ? initP : untrack(() => {
				try {
					return fetcher(lookup, {
						value: value(),
						refetching
					});
				} catch (fetcherError) {
					error$2 = fetcherError;
				}
			});
			if (error$2 !== void 0) {
				loadEnd(pr, void 0, castError(error$2), lookup);
				return;
			} else if (!isPromise(p)) {
				loadEnd(pr, p, void 0, lookup);
				return p;
			}
			pr = p;
			if ("v" in p) {
				if (p.s === 1) loadEnd(pr, p.v, void 0, lookup);
				else loadEnd(pr, void 0, castError(p.v), lookup);
				return p;
			}
			scheduled = true;
			queueMicrotask(() => scheduled = false);
			runUpdates(() => {
				setState(resolved ? "refreshing" : "pending");
				trigger();
			}, false);
			return p.then((v) => loadEnd(p, v, void 0, lookup), (e) => loadEnd(p, void 0, castError(e), lookup));
		}
		Object.defineProperties(read, {
			state: { get: () => state() },
			error: { get: () => error$1() },
			loading: { get() {
				const s = state();
				return s === "pending" || s === "refreshing";
			} },
			latest: { get() {
				if (!resolved) return read();
				const err$1 = error$1();
				if (err$1 && !pr) throw err$1;
				return value();
			} }
		});
		let owner = Owner;
		if (dynamic) createComputed(() => (owner = Owner, load(false)));
		else load(false);
		return [read, {
			refetch: (info) => runWithOwner(owner, () => load(info)),
			mutate: setValue
		}];
	}
	function batch(fn) {
		return runUpdates(fn, false);
	}
	function untrack(fn) {
		if (!ExternalSourceConfig && Listener === null) return fn();
		const listener = Listener;
		Listener = null;
		try {
			if (ExternalSourceConfig) return ExternalSourceConfig.untrack(fn);
			return fn();
		} finally {
			Listener = listener;
		}
	}
	function on(deps, fn, options) {
		const isArray$1 = Array.isArray(deps);
		let prevInput;
		let defer = options && options.defer;
		return (prevValue) => {
			let input;
			if (isArray$1) {
				input = Array(deps.length);
				for (let i = 0; i < deps.length; i++) input[i] = deps[i]();
			} else input = deps();
			if (defer) {
				defer = false;
				return prevValue;
			}
			const result = untrack(() => fn(input, prevInput, prevValue));
			prevInput = input;
			return result;
		};
	}
	function onMount(fn) {
		createEffect(() => untrack(fn));
	}
	function onCleanup(fn) {
		if (Owner === null) console.warn("cleanups created outside a `createRoot` or `render` will never be run");
		else if (Owner.cleanups === null) Owner.cleanups = [fn];
		else Owner.cleanups.push(fn);
		return fn;
	}
	function catchError(fn, handler) {
		ERROR || (ERROR = Symbol("error"));
		Owner = createComputation(void 0, void 0, true);
		Owner.context = {
			...Owner.context,
			[ERROR]: [handler]
		};
		if (Transition && Transition.running) Transition.sources.add(Owner);
		try {
			return fn();
		} catch (err$1) {
			handleError(err$1);
		} finally {
			Owner = Owner.owner;
		}
	}
	function getOwner() {
		return Owner;
	}
	function runWithOwner(o, fn) {
		const prev = Owner;
		const prevListener = Listener;
		Owner = o;
		Listener = null;
		try {
			return runUpdates(fn, true);
		} catch (err$1) {
			handleError(err$1);
		} finally {
			Owner = prev;
			Listener = prevListener;
		}
	}
	function startTransition(fn) {
		if (Transition && Transition.running) {
			fn();
			return Transition.done;
		}
		const l = Listener;
		const o = Owner;
		return Promise.resolve().then(() => {
			Listener = l;
			Owner = o;
			let t;
			if (Scheduler || SuspenseContext) {
				t = Transition || (Transition = {
					sources: /* @__PURE__ */ new Set(),
					effects: [],
					promises: /* @__PURE__ */ new Set(),
					disposed: /* @__PURE__ */ new Set(),
					queue: /* @__PURE__ */ new Set(),
					running: true
				});
				t.done || (t.done = new Promise((res) => t.resolve = res));
				t.running = true;
			}
			runUpdates(fn, false);
			Listener = Owner = null;
			return t ? t.done : void 0;
		});
	}
	function resumeEffects(e) {
		Effects.push.apply(Effects, e);
		e.length = 0;
	}
	function devComponent(Comp, props) {
		const c = createComputation(() => untrack(() => {
			Object.assign(Comp, { [$DEVCOMP]: true });
			return Comp(props);
		}), void 0, true, 0);
		c.props = props;
		c.observers = null;
		c.observerSlots = null;
		c.name = Comp.name;
		c.component = Comp;
		updateComputation(c);
		return c.tValue !== void 0 ? c.tValue : c.value;
	}
	function registerGraph(value) {
		if (Owner) {
			if (Owner.sourceMap) Owner.sourceMap.push(value);
			else Owner.sourceMap = [value];
			value.graph = Owner;
		}
		if (DevHooks.afterRegisterGraph) DevHooks.afterRegisterGraph(value);
	}
	function createContext(defaultValue, options) {
		const id = Symbol("context");
		return {
			id,
			Provider: createProvider(id, options),
			defaultValue
		};
	}
	function useContext(context) {
		let value;
		return Owner && Owner.context && (value = Owner.context[context.id]) !== void 0 ? value : context.defaultValue;
	}
	function children(fn) {
		const children$1 = createMemo(fn);
		const memo$1 = createMemo(() => resolveChildren(children$1()), void 0, { name: "children" });
		memo$1.toArray = () => {
			const c = memo$1();
			return Array.isArray(c) ? c : c != null ? [c] : [];
		};
		return memo$1;
	}
	function getSuspenseContext() {
		return SuspenseContext || (SuspenseContext = createContext());
	}
	function readSignal() {
		const runningTransition = Transition && Transition.running;
		if (this.sources && (runningTransition ? this.tState : this.state)) if ((runningTransition ? this.tState : this.state) === STALE) updateComputation(this);
		else {
			const updates = Updates;
			Updates = null;
			runUpdates(() => lookUpstream(this), false);
			Updates = updates;
		}
		if (Listener) {
			const sSlot = this.observers ? this.observers.length : 0;
			if (!Listener.sources) {
				Listener.sources = [this];
				Listener.sourceSlots = [sSlot];
			} else {
				Listener.sources.push(this);
				Listener.sourceSlots.push(sSlot);
			}
			if (!this.observers) {
				this.observers = [Listener];
				this.observerSlots = [Listener.sources.length - 1];
			} else {
				this.observers.push(Listener);
				this.observerSlots.push(Listener.sources.length - 1);
			}
		}
		if (runningTransition && Transition.sources.has(this)) return this.tValue;
		return this.value;
	}
	function writeSignal(node, value, isComp) {
		let current = Transition && Transition.running && Transition.sources.has(node) ? node.tValue : node.value;
		if (!node.comparator || !node.comparator(current, value)) {
			if (Transition) {
				const TransitionRunning = Transition.running;
				if (TransitionRunning || !isComp && Transition.sources.has(node)) {
					Transition.sources.add(node);
					node.tValue = value;
				}
				if (!TransitionRunning) node.value = value;
			} else node.value = value;
			if (node.observers && node.observers.length) runUpdates(() => {
				for (let i = 0; i < node.observers.length; i += 1) {
					const o = node.observers[i];
					const TransitionRunning = Transition && Transition.running;
					if (TransitionRunning && Transition.disposed.has(o)) continue;
					if (TransitionRunning ? !o.tState : !o.state) {
						if (o.pure) Updates.push(o);
						else Effects.push(o);
						if (o.observers) markDownstream(o);
					}
					if (!TransitionRunning) o.state = STALE;
					else o.tState = STALE;
				}
				if (Updates.length > 1e6) {
					Updates = [];
					throw new Error("Potential Infinite Loop Detected.");
				}
			}, false);
		}
		return value;
	}
	function updateComputation(node) {
		if (!node.fn) return;
		cleanNode(node);
		const time = ExecCount;
		runComputation(node, Transition && Transition.running && Transition.sources.has(node) ? node.tValue : node.value, time);
		if (Transition && !Transition.running && Transition.sources.has(node)) queueMicrotask(() => {
			runUpdates(() => {
				Transition && (Transition.running = true);
				Listener = Owner = node;
				runComputation(node, node.tValue, time);
				Listener = Owner = null;
			}, false);
		});
	}
	function runComputation(node, value, time) {
		let nextValue;
		const owner = Owner, listener = Listener;
		Listener = Owner = node;
		try {
			nextValue = node.fn(value);
		} catch (err$1) {
			if (node.pure) if (Transition && Transition.running) {
				node.tState = STALE;
				node.tOwned && node.tOwned.forEach(cleanNode);
				node.tOwned = void 0;
			} else {
				node.state = STALE;
				node.owned && node.owned.forEach(cleanNode);
				node.owned = null;
			}
			node.updatedAt = time + 1;
			return handleError(err$1);
		} finally {
			Listener = listener;
			Owner = owner;
		}
		if (!node.updatedAt || node.updatedAt <= time) {
			if (node.updatedAt != null && "observers" in node) writeSignal(node, nextValue, true);
			else if (Transition && Transition.running && node.pure) {
				Transition.sources.add(node);
				node.tValue = nextValue;
			} else node.value = nextValue;
			node.updatedAt = time;
		}
	}
	function createComputation(fn, init, pure, state = STALE, options) {
		const c = {
			fn,
			state,
			updatedAt: null,
			owned: null,
			sources: null,
			sourceSlots: null,
			cleanups: null,
			value: init,
			owner: Owner,
			context: Owner ? Owner.context : null,
			pure
		};
		if (Transition && Transition.running) {
			c.state = 0;
			c.tState = state;
		}
		if (Owner === null) console.warn("computations created outside a `createRoot` or `render` will never be disposed");
		else if (Owner !== UNOWNED) if (Transition && Transition.running && Owner.pure) if (!Owner.tOwned) Owner.tOwned = [c];
		else Owner.tOwned.push(c);
		else if (!Owner.owned) Owner.owned = [c];
		else Owner.owned.push(c);
		if (options && options.name) c.name = options.name;
		if (ExternalSourceConfig && c.fn) {
			const [track, trigger] = createSignal(void 0, { equals: false });
			const ordinary = ExternalSourceConfig.factory(c.fn, trigger);
			onCleanup(() => ordinary.dispose());
			const triggerInTransition = () => startTransition(trigger).then(() => inTransition.dispose());
			const inTransition = ExternalSourceConfig.factory(c.fn, triggerInTransition);
			c.fn = (x) => {
				track();
				return Transition && Transition.running ? inTransition.track(x) : ordinary.track(x);
			};
		}
		DevHooks.afterCreateOwner && DevHooks.afterCreateOwner(c);
		return c;
	}
	function runTop(node) {
		const runningTransition = Transition && Transition.running;
		if ((runningTransition ? node.tState : node.state) === 0) return;
		if ((runningTransition ? node.tState : node.state) === PENDING) return lookUpstream(node);
		if (node.suspense && untrack(node.suspense.inFallback)) return node.suspense.effects.push(node);
		const ancestors = [node];
		while ((node = node.owner) && (!node.updatedAt || node.updatedAt < ExecCount)) {
			if (runningTransition && Transition.disposed.has(node)) return;
			if (runningTransition ? node.tState : node.state) ancestors.push(node);
		}
		for (let i = ancestors.length - 1; i >= 0; i--) {
			node = ancestors[i];
			if (runningTransition) {
				let top = node, prev = ancestors[i + 1];
				while ((top = top.owner) && top !== prev) if (Transition.disposed.has(top)) return;
			}
			if ((runningTransition ? node.tState : node.state) === STALE) updateComputation(node);
			else if ((runningTransition ? node.tState : node.state) === PENDING) {
				const updates = Updates;
				Updates = null;
				runUpdates(() => lookUpstream(node, ancestors[0]), false);
				Updates = updates;
			}
		}
	}
	function runUpdates(fn, init) {
		if (Updates) return fn();
		let wait = false;
		if (!init) Updates = [];
		if (Effects) wait = true;
		else Effects = [];
		ExecCount++;
		try {
			const res = fn();
			completeUpdates(wait);
			return res;
		} catch (err$1) {
			if (!wait) Effects = null;
			Updates = null;
			handleError(err$1);
		}
	}
	function completeUpdates(wait) {
		if (Updates) {
			if (Scheduler && Transition && Transition.running) scheduleQueue(Updates);
			else runQueue(Updates);
			Updates = null;
		}
		if (wait) return;
		let res;
		if (Transition) {
			if (!Transition.promises.size && !Transition.queue.size) {
				const sources = Transition.sources;
				const disposed = Transition.disposed;
				Effects.push.apply(Effects, Transition.effects);
				res = Transition.resolve;
				for (const e$1 of Effects) {
					"tState" in e$1 && (e$1.state = e$1.tState);
					delete e$1.tState;
				}
				Transition = null;
				runUpdates(() => {
					for (const d of disposed) cleanNode(d);
					for (const v of sources) {
						v.value = v.tValue;
						if (v.owned) for (let i = 0, len = v.owned.length; i < len; i++) cleanNode(v.owned[i]);
						if (v.tOwned) v.owned = v.tOwned;
						delete v.tValue;
						delete v.tOwned;
						v.tState = 0;
					}
					setTransPending(false);
				}, false);
			} else if (Transition.running) {
				Transition.running = false;
				Transition.effects.push.apply(Transition.effects, Effects);
				Effects = null;
				setTransPending(true);
				return;
			}
		}
		const e = Effects;
		Effects = null;
		if (e.length) runUpdates(() => runEffects(e), false);
		else DevHooks.afterUpdate && DevHooks.afterUpdate();
		if (res) res();
	}
	function runQueue(queue) {
		for (let i = 0; i < queue.length; i++) runTop(queue[i]);
	}
	function scheduleQueue(queue) {
		for (let i = 0; i < queue.length; i++) {
			const item = queue[i];
			const tasks = Transition.queue;
			if (!tasks.has(item)) {
				tasks.add(item);
				Scheduler(() => {
					tasks.delete(item);
					runUpdates(() => {
						Transition.running = true;
						runTop(item);
					}, false);
					Transition && (Transition.running = false);
				});
			}
		}
	}
	function runUserEffects(queue) {
		let i, userLength = 0;
		for (i = 0; i < queue.length; i++) {
			const e = queue[i];
			if (!e.user) runTop(e);
			else queue[userLength++] = e;
		}
		if (sharedConfig.context) {
			if (sharedConfig.count) {
				sharedConfig.effects || (sharedConfig.effects = []);
				sharedConfig.effects.push(...queue.slice(0, userLength));
				return;
			}
			setHydrateContext();
		}
		if (sharedConfig.effects && (sharedConfig.done || !sharedConfig.count)) {
			queue = [...sharedConfig.effects, ...queue];
			userLength += sharedConfig.effects.length;
			delete sharedConfig.effects;
		}
		for (i = 0; i < userLength; i++) runTop(queue[i]);
	}
	function lookUpstream(node, ignore) {
		const runningTransition = Transition && Transition.running;
		if (runningTransition) node.tState = 0;
		else node.state = 0;
		for (let i = 0; i < node.sources.length; i += 1) {
			const source = node.sources[i];
			if (source.sources) {
				const state = runningTransition ? source.tState : source.state;
				if (state === STALE) {
					if (source !== ignore && (!source.updatedAt || source.updatedAt < ExecCount)) runTop(source);
				} else if (state === PENDING) lookUpstream(source, ignore);
			}
		}
	}
	function markDownstream(node) {
		const runningTransition = Transition && Transition.running;
		for (let i = 0; i < node.observers.length; i += 1) {
			const o = node.observers[i];
			if (runningTransition ? !o.tState : !o.state) {
				if (runningTransition) o.tState = PENDING;
				else o.state = PENDING;
				if (o.pure) Updates.push(o);
				else Effects.push(o);
				o.observers && markDownstream(o);
			}
		}
	}
	function cleanNode(node) {
		let i;
		if (node.sources) while (node.sources.length) {
			const source = node.sources.pop(), index = node.sourceSlots.pop(), obs = source.observers;
			if (obs && obs.length) {
				const n = obs.pop(), s = source.observerSlots.pop();
				if (index < obs.length) {
					n.sourceSlots[s] = index;
					obs[index] = n;
					source.observerSlots[index] = s;
				}
			}
		}
		if (node.tOwned) {
			for (i = node.tOwned.length - 1; i >= 0; i--) cleanNode(node.tOwned[i]);
			delete node.tOwned;
		}
		if (Transition && Transition.running && node.pure) reset(node, true);
		else if (node.owned) {
			for (i = node.owned.length - 1; i >= 0; i--) cleanNode(node.owned[i]);
			node.owned = null;
		}
		if (node.cleanups) {
			for (i = node.cleanups.length - 1; i >= 0; i--) node.cleanups[i]();
			node.cleanups = null;
		}
		if (Transition && Transition.running) node.tState = 0;
		else node.state = 0;
		delete node.sourceMap;
	}
	function reset(node, top) {
		if (!top) {
			node.tState = 0;
			Transition.disposed.add(node);
		}
		if (node.owned) for (let i = 0; i < node.owned.length; i++) reset(node.owned[i]);
	}
	function castError(err$1) {
		if (err$1 instanceof Error) return err$1;
		return new Error(typeof err$1 === "string" ? err$1 : "Unknown error", { cause: err$1 });
	}
	function runErrors(err$1, fns, owner) {
		try {
			for (const f of fns) f(err$1);
		} catch (e) {
			handleError(e, owner && owner.owner || null);
		}
	}
	function handleError(err$1, owner = Owner) {
		const fns = ERROR && owner && owner.context && owner.context[ERROR];
		const error$1 = castError(err$1);
		if (!fns) throw error$1;
		if (Effects) Effects.push({
			fn() {
				runErrors(error$1, fns, owner);
			},
			state: STALE
		});
		else runErrors(error$1, fns, owner);
	}
	function resolveChildren(children$1) {
		if (typeof children$1 === "function" && !children$1.length) return resolveChildren(children$1());
		if (Array.isArray(children$1)) {
			const results = [];
			for (let i = 0; i < children$1.length; i++) {
				const result = resolveChildren(children$1[i]);
				Array.isArray(result) ? results.push.apply(results, result) : results.push(result);
			}
			return results;
		}
		return children$1;
	}
	function createProvider(id, options) {
		return function provider(props) {
			let res;
			createRenderEffect(() => res = untrack(() => {
				Owner.context = {
					...Owner.context,
					[id]: props.value
				};
				return children(() => props.children);
			}), void 0, options);
			return res;
		};
	}
	function mutateContext(o, key, value) {
		if (o.owned) for (let i = 0; i < o.owned.length; i++) {
			if (o.owned[i].context === o.context) mutateContext(o.owned[i], key, value);
			if (!o.owned[i].context) {
				o.owned[i].context = o.context;
				mutateContext(o.owned[i], key, value);
			} else if (!o.owned[i].context[key]) {
				o.owned[i].context[key] = value;
				mutateContext(o.owned[i], key, value);
			}
		}
	}
	function dispose(d) {
		for (let i = 0; i < d.length; i++) d[i]();
	}
	function mapArray(list, mapFn, options = {}) {
		let items = [], mapped = [], disposers = [], len = 0, indexes = mapFn.length > 1 ? [] : null;
		onCleanup(() => dispose(disposers));
		return () => {
			let newItems = list() || [], newLen = newItems.length, i, j;
			newItems[$TRACK];
			return untrack(() => {
				let newIndices, newIndicesNext, temp, tempdisposers, tempIndexes, start, end, newEnd, item;
				if (newLen === 0) {
					if (len !== 0) {
						dispose(disposers);
						disposers = [];
						items = [];
						mapped = [];
						len = 0;
						indexes && (indexes = []);
					}
					if (options.fallback) {
						items = [FALLBACK];
						mapped[0] = createRoot((disposer) => {
							disposers[0] = disposer;
							return options.fallback();
						});
						len = 1;
					}
				} else if (len === 0) {
					mapped = new Array(newLen);
					for (j = 0; j < newLen; j++) {
						items[j] = newItems[j];
						mapped[j] = createRoot(mapper);
					}
					len = newLen;
				} else {
					temp = new Array(newLen);
					tempdisposers = new Array(newLen);
					indexes && (tempIndexes = new Array(newLen));
					for (start = 0, end = Math.min(len, newLen); start < end && items[start] === newItems[start]; start++);
					for (end = len - 1, newEnd = newLen - 1; end >= start && newEnd >= start && items[end] === newItems[newEnd]; end--, newEnd--) {
						temp[newEnd] = mapped[end];
						tempdisposers[newEnd] = disposers[end];
						indexes && (tempIndexes[newEnd] = indexes[end]);
					}
					newIndices = /* @__PURE__ */ new Map();
					newIndicesNext = new Array(newEnd + 1);
					for (j = newEnd; j >= start; j--) {
						item = newItems[j];
						i = newIndices.get(item);
						newIndicesNext[j] = i === void 0 ? -1 : i;
						newIndices.set(item, j);
					}
					for (i = start; i <= end; i++) {
						item = items[i];
						j = newIndices.get(item);
						if (j !== void 0 && j !== -1) {
							temp[j] = mapped[i];
							tempdisposers[j] = disposers[i];
							indexes && (tempIndexes[j] = indexes[i]);
							j = newIndicesNext[j];
							newIndices.set(item, j);
						} else disposers[i]();
					}
					for (j = start; j < newLen; j++) if (j in temp) {
						mapped[j] = temp[j];
						disposers[j] = tempdisposers[j];
						if (indexes) {
							indexes[j] = tempIndexes[j];
							indexes[j](j);
						}
					} else mapped[j] = createRoot(mapper);
					mapped = mapped.slice(0, len = newLen);
					items = newItems.slice(0);
				}
				return mapped;
			});
			function mapper(disposer) {
				disposers[j] = disposer;
				if (indexes) {
					const [s, set] = createSignal(j, { name: "index" });
					indexes[j] = set;
					return mapFn(newItems[j], s);
				}
				return mapFn(newItems[j]);
			}
		};
	}
	function createComponent(Comp, props) {
		if (hydrationEnabled) {
			if (sharedConfig.context) {
				const c = sharedConfig.context;
				setHydrateContext(nextHydrateContext());
				const r = devComponent(Comp, props || {});
				setHydrateContext(c);
				return r;
			}
		}
		return devComponent(Comp, props || {});
	}
	function trueFn() {
		return true;
	}
	function resolveSource(s) {
		return !(s = typeof s === "function" ? s() : s) ? {} : s;
	}
	function resolveSources() {
		for (let i = 0, length = this.length; i < length; ++i) {
			const v = this[i]();
			if (v !== void 0) return v;
		}
	}
	function mergeProps(...sources) {
		let proxy = false;
		for (let i = 0; i < sources.length; i++) {
			const s = sources[i];
			proxy = proxy || !!s && $PROXY in s;
			sources[i] = typeof s === "function" ? (proxy = true, createMemo(s)) : s;
		}
		if (SUPPORTS_PROXY && proxy) return new Proxy({
			get(property) {
				for (let i = sources.length - 1; i >= 0; i--) {
					const v = resolveSource(sources[i])[property];
					if (v !== void 0) return v;
				}
			},
			has(property) {
				for (let i = sources.length - 1; i >= 0; i--) if (property in resolveSource(sources[i])) return true;
				return false;
			},
			keys() {
				const keys = [];
				for (let i = 0; i < sources.length; i++) keys.push(...Object.keys(resolveSource(sources[i])));
				return [...new Set(keys)];
			}
		}, propTraps);
		const sourcesMap = {};
		const defined = Object.create(null);
		for (let i = sources.length - 1; i >= 0; i--) {
			const source = sources[i];
			if (!source) continue;
			const sourceKeys = Object.getOwnPropertyNames(source);
			for (let i$1 = sourceKeys.length - 1; i$1 >= 0; i$1--) {
				const key = sourceKeys[i$1];
				if (key === "__proto__" || key === "constructor") continue;
				const desc = Object.getOwnPropertyDescriptor(source, key);
				if (!defined[key]) defined[key] = desc.get ? {
					enumerable: true,
					configurable: true,
					get: resolveSources.bind(sourcesMap[key] = [desc.get.bind(source)])
				} : desc.value !== void 0 ? desc : void 0;
				else {
					const sources$1 = sourcesMap[key];
					if (sources$1) {
						if (desc.get) sources$1.push(desc.get.bind(source));
						else if (desc.value !== void 0) sources$1.push(() => desc.value);
					}
				}
			}
		}
		const target = {};
		const definedKeys = Object.keys(defined);
		for (let i = definedKeys.length - 1; i >= 0; i--) {
			const key = definedKeys[i], desc = defined[key];
			if (desc && desc.get) Object.defineProperty(target, key, desc);
			else target[key] = desc ? desc.value : void 0;
		}
		return target;
	}
	function splitProps(props, ...keys) {
		const len = keys.length;
		if (SUPPORTS_PROXY && $PROXY in props) {
			const blocked = len > 1 ? keys.flat() : keys[0];
			const res = keys.map((k) => {
				return new Proxy({
					get(property) {
						return k.includes(property) ? props[property] : void 0;
					},
					has(property) {
						return k.includes(property) && property in props;
					},
					keys() {
						return k.filter((property) => property in props);
					}
				}, propTraps);
			});
			res.push(new Proxy({
				get(property) {
					return blocked.includes(property) ? void 0 : props[property];
				},
				has(property) {
					return blocked.includes(property) ? false : property in props;
				},
				keys() {
					return Object.keys(props).filter((k) => !blocked.includes(k));
				}
			}, propTraps));
			return res;
		}
		const objects = [];
		for (let i = 0; i <= len; i++) objects[i] = {};
		for (const propName of Object.getOwnPropertyNames(props)) {
			let keyIndex = len;
			for (let i = 0; i < keys.length; i++) if (keys[i].includes(propName)) {
				keyIndex = i;
				break;
			}
			const desc = Object.getOwnPropertyDescriptor(props, propName);
			!desc.get && !desc.set && desc.enumerable && desc.writable && desc.configurable ? objects[keyIndex][propName] = desc.value : Object.defineProperty(objects[keyIndex], propName, desc);
		}
		return objects;
	}
	function lazy(fn) {
		let comp;
		let p;
		const wrap = (props) => {
			const ctx = sharedConfig.context;
			if (ctx) {
				const [s, set] = createSignal();
				sharedConfig.count || (sharedConfig.count = 0);
				sharedConfig.count++;
				(p || (p = fn())).then((mod) => {
					!sharedConfig.done && setHydrateContext(ctx);
					sharedConfig.count--;
					set(() => mod.default);
					setHydrateContext();
				});
				comp = s;
			} else if (!comp) {
				const [s] = createResource(() => (p || (p = fn())).then((mod) => mod.default));
				comp = s;
			}
			let Comp;
			return createMemo(() => (Comp = comp()) ? untrack(() => {
				Object.assign(Comp, { [$DEVCOMP]: true });
				if (!ctx || sharedConfig.done) return Comp(props);
				const c = sharedConfig.context;
				setHydrateContext(ctx);
				const r = Comp(props);
				setHydrateContext(c);
				return r;
			}) : "");
		};
		wrap.preload = () => p || ((p = fn()).then((mod) => comp = () => mod.default), p);
		return wrap;
	}
	function For(props) {
		const fallback = "fallback" in props && { fallback: () => props.fallback };
		return createMemo(mapArray(() => props.each, props.children, fallback || void 0), void 0, { name: "value" });
	}
	function Show(props) {
		const keyed = props.keyed;
		const conditionValue = createMemo(() => props.when, void 0, { name: "condition value" });
		const condition = keyed ? conditionValue : createMemo(conditionValue, void 0, {
			equals: (a, b) => !a === !b,
			name: "condition"
		});
		return createMemo(() => {
			const c = condition();
			if (c) {
				const child = props.children;
				return typeof child === "function" && child.length > 0 ? untrack(() => child(keyed ? c : () => {
					if (!untrack(condition)) throw narrowedError("Show");
					return conditionValue();
				})) : child;
			}
			return props.fallback;
		}, void 0, { name: "value" });
	}
	function Switch(props) {
		const chs = children(() => props.children);
		const switchFunc = createMemo(() => {
			const ch = chs();
			const mps = Array.isArray(ch) ? ch : [ch];
			let func = () => void 0;
			for (let i = 0; i < mps.length; i++) {
				const index = i;
				const mp = mps[i];
				const prevFunc = func;
				const conditionValue = createMemo(() => prevFunc() ? void 0 : mp.when, void 0, { name: "condition value" });
				const condition = mp.keyed ? conditionValue : createMemo(conditionValue, void 0, {
					equals: (a, b) => !a === !b,
					name: "condition"
				});
				func = () => prevFunc() || (condition() ? [
					index,
					conditionValue,
					mp
				] : void 0);
			}
			return func;
		});
		return createMemo(() => {
			const sel = switchFunc()();
			if (!sel) return props.fallback;
			const [index, conditionValue, mp] = sel;
			const child = mp.children;
			return typeof child === "function" && child.length > 0 ? untrack(() => child(mp.keyed ? conditionValue() : () => {
				if (untrack(switchFunc)()?.[0] !== index) throw narrowedError("Match");
				return conditionValue();
			})) : child;
		}, void 0, { name: "eval conditions" });
	}
	function Match(props) {
		return props;
	}
	function ErrorBoundary$1(props) {
		let err$1;
		if (sharedConfig.context && sharedConfig.load) err$1 = sharedConfig.load(sharedConfig.getContextId());
		const [errored, setErrored] = createSignal(err$1, { name: "errored" });
		Errors || (Errors = /* @__PURE__ */ new Set());
		Errors.add(setErrored);
		onCleanup(() => Errors.delete(setErrored));
		return createMemo(() => {
			let e;
			if (e = errored()) {
				const f = props.fallback;
				if (typeof f !== "function" || f.length == 0) console.error(e);
				return typeof f === "function" && f.length ? untrack(() => f(e, () => setErrored())) : f;
			}
			return catchError(() => props.children, setErrored);
		}, void 0, { name: "value" });
	}
	function Suspense(props) {
		let counter$1 = 0, show, ctx, p, flicker, error$1;
		const [inFallback, setFallback] = createSignal(false), SuspenseContext$1 = getSuspenseContext(), store = {
			increment: () => {
				if (++counter$1 === 1) setFallback(true);
			},
			decrement: () => {
				if (--counter$1 === 0) setFallback(false);
			},
			inFallback,
			effects: [],
			resolved: false
		}, owner = getOwner();
		if (sharedConfig.context && sharedConfig.load) {
			const key = sharedConfig.getContextId();
			let ref = sharedConfig.load(key);
			if (ref) if (typeof ref !== "object" || ref.s !== 1) p = ref;
			else sharedConfig.gather(key);
			if (p && p !== "$$f") {
				const [s, set] = createSignal(void 0, { equals: false });
				flicker = s;
				p.then(() => {
					if (sharedConfig.done) return set();
					sharedConfig.gather(key);
					setHydrateContext(ctx);
					set();
					setHydrateContext();
				}, (err$1) => {
					error$1 = err$1;
					set();
				});
			}
		}
		const listContext = useContext(SuspenseListContext);
		if (listContext) show = listContext.register(store.inFallback);
		let dispose$1;
		onCleanup(() => dispose$1 && dispose$1());
		return createComponent(SuspenseContext$1.Provider, {
			value: store,
			get children() {
				return createMemo(() => {
					if (error$1) throw error$1;
					ctx = sharedConfig.context;
					if (flicker) {
						flicker();
						flicker = void 0;
						return;
					}
					if (ctx && p === "$$f") setHydrateContext();
					const rendered = createMemo(() => props.children);
					return createMemo((prev) => {
						const inFallback$1 = store.inFallback(), { showContent = true, showFallback = true } = show ? show() : {};
						if ((!inFallback$1 || p && p !== "$$f") && showContent) {
							store.resolved = true;
							dispose$1 && dispose$1();
							dispose$1 = ctx = p = void 0;
							resumeEffects(store.effects);
							return rendered();
						}
						if (!showFallback) return;
						if (dispose$1) return prev;
						return createRoot((disposer) => {
							dispose$1 = disposer;
							if (ctx) {
								setHydrateContext({
									id: ctx.id + "F",
									count: 0
								});
								ctx = void 0;
							}
							return props.fallback;
						}, owner);
					});
				});
			}
		});
	}
	var sharedConfig, equalFn, $PROXY, SUPPORTS_PROXY, $TRACK, $DEVCOMP, signalOptions, ERROR, runEffects, STALE, PENDING, UNOWNED, NO_INIT, Owner, Transition, Scheduler, ExternalSourceConfig, Listener, Updates, Effects, ExecCount, DevHooks, transPending, setTransPending, SuspenseContext, FALLBACK, hydrationEnabled, propTraps, narrowedError, Errors, SuspenseListContext;
	var init_dev$1 = __esmMin((() => {
		sharedConfig = {
			context: void 0,
			registry: void 0,
			effects: void 0,
			done: false,
			getContextId() {
				return getContextId(this.context.count);
			},
			getNextContextId() {
				return getContextId(this.context.count++);
			}
		};
		equalFn = (a, b) => a === b;
		$PROXY = Symbol("solid-proxy");
		SUPPORTS_PROXY = typeof Proxy === "function";
		$TRACK = Symbol("solid-track");
		$DEVCOMP = Symbol("solid-dev-component");
		signalOptions = { equals: equalFn };
		ERROR = null;
		runEffects = runQueue;
		STALE = 1;
		PENDING = 2;
		UNOWNED = {
			owned: null,
			cleanups: null,
			context: null,
			owner: null
		};
		NO_INIT = {};
		Owner = null;
		Transition = null;
		Scheduler = null;
		ExternalSourceConfig = null;
		Listener = null;
		Updates = null;
		Effects = null;
		ExecCount = 0;
		DevHooks = {
			afterUpdate: null,
			afterCreateOwner: null,
			afterCreateSignal: null,
			afterRegisterGraph: null
		};
		[transPending, setTransPending] = /* @__PURE__ */ createSignal(false);
		FALLBACK = Symbol("fallback");
		hydrationEnabled = false;
		propTraps = {
			get(_, property, receiver) {
				if (property === $PROXY) return receiver;
				return _.get(property);
			},
			has(_, property) {
				if (property === $PROXY) return true;
				return _.has(property);
			},
			set: trueFn,
			deleteProperty: trueFn,
			getOwnPropertyDescriptor(_, property) {
				return {
					configurable: true,
					enumerable: true,
					get() {
						return _.get(property);
					},
					set: trueFn,
					deleteProperty: trueFn
				};
			},
			ownKeys(_) {
				return _.keys();
			}
		};
		narrowedError = (name) => `Attempting to access a stale value from <${name}> that could possibly be undefined. This may occur because you are reading the accessor returned from the component at a time where it has already been unmounted. We recommend cleaning up any stale timers or async, or reading from the initial condition.`;
		SuspenseListContext = /* @__PURE__ */ createContext();
		if (globalThis) if (!globalThis.Solid$$) globalThis.Solid$$ = true;
		else console.warn("You appear to have multiple instances of Solid. This can lead to unexpected behavior.");
	}));
	function getPropAlias(prop, tagName) {
		const a = PropAliases[prop];
		return typeof a === "object" ? a[tagName] ? a["$"] : void 0 : a;
	}
	function reconcileArrays(parentNode, a, b) {
		let bLength = b.length, aEnd = a.length, bEnd = bLength, aStart = 0, bStart = 0, after = a[aEnd - 1].nextSibling, map$1 = null;
		while (aStart < aEnd || bStart < bEnd) {
			if (a[aStart] === b[bStart]) {
				aStart++;
				bStart++;
				continue;
			}
			while (a[aEnd - 1] === b[bEnd - 1]) {
				aEnd--;
				bEnd--;
			}
			if (aEnd === aStart) {
				const node = bEnd < bLength ? bStart ? b[bStart - 1].nextSibling : b[bEnd - bStart] : after;
				while (bStart < bEnd) parentNode.insertBefore(b[bStart++], node);
			} else if (bEnd === bStart) while (aStart < aEnd) {
				if (!map$1 || !map$1.has(a[aStart])) a[aStart].remove();
				aStart++;
			}
			else if (a[aStart] === b[bEnd - 1] && b[bStart] === a[aEnd - 1]) {
				const node = a[--aEnd].nextSibling;
				parentNode.insertBefore(b[bStart++], a[aStart++].nextSibling);
				parentNode.insertBefore(b[--bEnd], node);
				a[aEnd] = b[bEnd];
			} else {
				if (!map$1) {
					map$1 = /* @__PURE__ */ new Map();
					let i = bStart;
					while (i < bEnd) map$1.set(b[i], i++);
				}
				const index = map$1.get(a[aStart]);
				if (index != null) if (bStart < index && index < bEnd) {
					let i = aStart, sequence = 1, t;
					while (++i < aEnd && i < bEnd) {
						if ((t = map$1.get(a[i])) == null || t !== index + sequence) break;
						sequence++;
					}
					if (sequence > index - bStart) {
						const node = a[aStart];
						while (bStart < index) parentNode.insertBefore(b[bStart++], node);
					} else parentNode.replaceChild(b[bStart++], a[aStart++]);
				} else aStart++;
				else a[aStart++].remove();
			}
		}
	}
	function render(code, element, init, options = {}) {
		if (!element) throw new Error("The `element` passed to `render(..., element)` doesn't exist. Make sure `element` exists in the document.");
		let disposer;
		createRoot((dispose$1) => {
			disposer = dispose$1;
			element === document ? code() : insert(element, code(), element.firstChild ? null : void 0, init);
		}, options.owner);
		return () => {
			disposer();
			element.textContent = "";
		};
	}
	function template(html, isImportNode, isSVG, isMathML) {
		let node;
		const create = () => {
			if (isHydrating()) throw new Error("Failed attempt to create new DOM elements during hydration. Check that the libraries you are using support hydration.");
			const t = isMathML ? document.createElementNS("http://www.w3.org/1998/Math/MathML", "template") : document.createElement("template");
			t.innerHTML = html;
			return isSVG ? t.content.firstChild.firstChild : isMathML ? t.firstChild : t.content.firstChild;
		};
		const fn = isImportNode ? () => untrack(() => document.importNode(node || (node = create()), true)) : () => (node || (node = create())).cloneNode(true);
		fn.cloneNode = fn;
		return fn;
	}
	function delegateEvents(eventNames, document$1 = window.document) {
		const e = document$1[$$EVENTS] || (document$1[$$EVENTS] = /* @__PURE__ */ new Set());
		for (let i = 0, l = eventNames.length; i < l; i++) {
			const name = eventNames[i];
			if (!e.has(name)) {
				e.add(name);
				document$1.addEventListener(name, eventHandler);
			}
		}
	}
	function setAttribute(node, name, value) {
		if (isHydrating(node)) return;
		if (value == null) node.removeAttribute(name);
		else node.setAttribute(name, value);
	}
	function setAttributeNS(node, namespace, name, value) {
		if (isHydrating(node)) return;
		if (value == null) node.removeAttributeNS(namespace, name);
		else node.setAttributeNS(namespace, name, value);
	}
	function setBoolAttribute(node, name, value) {
		if (isHydrating(node)) return;
		value ? node.setAttribute(name, "") : node.removeAttribute(name);
	}
	function className(node, value) {
		if (isHydrating(node)) return;
		if (value == null) node.removeAttribute("class");
		else node.className = value;
	}
	function addEventListener(node, name, handler, delegate) {
		if (delegate) if (Array.isArray(handler)) {
			node[`$$${name}`] = handler[0];
			node[`$$${name}Data`] = handler[1];
		} else node[`$$${name}`] = handler;
		else if (Array.isArray(handler)) {
			const handlerFn = handler[0];
			node.addEventListener(name, handler[0] = (e) => handlerFn.call(node, handler[1], e));
		} else node.addEventListener(name, handler, typeof handler !== "function" && handler);
	}
	function classList(node, value, prev = {}) {
		const classKeys = Object.keys(value || {}), prevKeys = Object.keys(prev);
		let i, len;
		for (i = 0, len = prevKeys.length; i < len; i++) {
			const key = prevKeys[i];
			if (!key || key === "undefined" || value[key]) continue;
			toggleClassKey(node, key, false);
			delete prev[key];
		}
		for (i = 0, len = classKeys.length; i < len; i++) {
			const key = classKeys[i], classValue = !!value[key];
			if (!key || key === "undefined" || prev[key] === classValue || !classValue) continue;
			toggleClassKey(node, key, true);
			prev[key] = classValue;
		}
		return prev;
	}
	function style(node, value, prev) {
		if (!value) return prev ? setAttribute(node, "style") : value;
		const nodeStyle = node.style;
		if (typeof value === "string") return nodeStyle.cssText = value;
		typeof prev === "string" && (nodeStyle.cssText = prev = void 0);
		prev || (prev = {});
		value || (value = {});
		let v, s;
		for (s in prev) {
			value[s] ?? nodeStyle.removeProperty(s);
			delete prev[s];
		}
		for (s in value) {
			v = value[s];
			if (v !== prev[s]) {
				nodeStyle.setProperty(s, v);
				prev[s] = v;
			}
		}
		return prev;
	}
	function setStyleProperty(node, name, value) {
		value != null ? node.style.setProperty(name, value) : node.style.removeProperty(name);
	}
	function spread(node, props = {}, isSVG, skipChildren) {
		const prevProps = {};
		if (!skipChildren) createRenderEffect(() => prevProps.children = insertExpression(node, props.children, prevProps.children));
		createRenderEffect(() => typeof props.ref === "function" && use(props.ref, node));
		createRenderEffect(() => assign(node, props, isSVG, true, prevProps, true));
		return prevProps;
	}
	function use(fn, element, arg) {
		return untrack(() => fn(element, arg));
	}
	function insert(parent, accessor, marker, initial) {
		if (marker !== void 0 && !initial) initial = [];
		if (typeof accessor !== "function") return insertExpression(parent, accessor, initial, marker);
		createRenderEffect((current) => insertExpression(parent, accessor(), current, marker), initial);
	}
	function assign(node, props, isSVG, skipChildren, prevProps = {}, skipRef = false) {
		props || (props = {});
		for (const prop in prevProps) if (!(prop in props)) {
			if (prop === "children") continue;
			prevProps[prop] = assignProp(node, prop, null, prevProps[prop], isSVG, skipRef, props);
		}
		for (const prop in props) {
			if (prop === "children") {
				if (!skipChildren) insertExpression(node, props.children);
				continue;
			}
			const value = props[prop];
			prevProps[prop] = assignProp(node, prop, value, prevProps[prop], isSVG, skipRef, props);
		}
	}
	function isHydrating(node) {
		return !!sharedConfig.context && !sharedConfig.done && (!node || node.isConnected);
	}
	function toPropertyName(name) {
		return name.toLowerCase().replace(/-([a-z])/g, (_, w) => w.toUpperCase());
	}
	function toggleClassKey(node, key, value) {
		const classNames = key.trim().split(/\s+/);
		for (let i = 0, nameLen = classNames.length; i < nameLen; i++) node.classList.toggle(classNames[i], value);
	}
	function assignProp(node, prop, value, prev, isSVG, skipRef, props) {
		let isCE, isProp, isChildProp, propAlias, forceProp;
		if (prop === "style") return style(node, value, prev);
		if (prop === "classList") return classList(node, value, prev);
		if (value === prev) return prev;
		if (prop === "ref") {
			if (!skipRef) value(node);
		} else if (prop.slice(0, 3) === "on:") {
			const e = prop.slice(3);
			prev && node.removeEventListener(e, prev, typeof prev !== "function" && prev);
			value && node.addEventListener(e, value, typeof value !== "function" && value);
		} else if (prop.slice(0, 10) === "oncapture:") {
			const e = prop.slice(10);
			prev && node.removeEventListener(e, prev, true);
			value && node.addEventListener(e, value, true);
		} else if (prop.slice(0, 2) === "on") {
			const name = prop.slice(2).toLowerCase();
			const delegate = DelegatedEvents.has(name);
			if (!delegate && prev) {
				const h = Array.isArray(prev) ? prev[0] : prev;
				node.removeEventListener(name, h);
			}
			if (delegate || value) {
				addEventListener(node, name, value, delegate);
				delegate && delegateEvents([name]);
			}
		} else if (prop.slice(0, 5) === "attr:") setAttribute(node, prop.slice(5), value);
		else if (prop.slice(0, 5) === "bool:") setBoolAttribute(node, prop.slice(5), value);
		else if ((forceProp = prop.slice(0, 5) === "prop:") || (isChildProp = ChildProperties.has(prop)) || !isSVG && ((propAlias = getPropAlias(prop, node.tagName)) || (isProp = Properties.has(prop))) || (isCE = node.nodeName.includes("-") || "is" in props)) {
			if (forceProp) {
				prop = prop.slice(5);
				isProp = true;
			} else if (isHydrating(node)) return value;
			if (prop === "class" || prop === "className") className(node, value);
			else if (isCE && !isProp && !isChildProp) node[toPropertyName(prop)] = value;
			else node[propAlias || prop] = value;
		} else {
			const ns = isSVG && prop.indexOf(":") > -1 && SVGNamespace[prop.split(":")[0]];
			if (ns) setAttributeNS(node, ns, prop, value);
			else setAttribute(node, Aliases[prop] || prop, value);
		}
		return value;
	}
	function eventHandler(e) {
		if (sharedConfig.registry && sharedConfig.events) {
			if (sharedConfig.events.find(([el, ev]) => ev === e)) return;
		}
		let node = e.target;
		const key = `$$${e.type}`;
		const oriTarget = e.target;
		const oriCurrentTarget = e.currentTarget;
		const retarget = (value) => Object.defineProperty(e, "target", {
			configurable: true,
			value
		});
		const handleNode = () => {
			const handler = node[key];
			if (handler && !node.disabled) {
				const data = node[`${key}Data`];
				data !== void 0 ? handler.call(node, data, e) : handler.call(node, e);
				if (e.cancelBubble) return;
			}
			node.host && typeof node.host !== "string" && !node.host._$host && node.contains(e.target) && retarget(node.host);
			return true;
		};
		const walkUpTree = () => {
			while (handleNode() && (node = node._$host || node.parentNode || node.host));
		};
		Object.defineProperty(e, "currentTarget", {
			configurable: true,
			get() {
				return node || document;
			}
		});
		if (sharedConfig.registry && !sharedConfig.done) sharedConfig.done = _$HY.done = true;
		if (e.composedPath) {
			const path = e.composedPath();
			retarget(path[0]);
			for (let i = 0; i < path.length - 2; i++) {
				node = path[i];
				if (!handleNode()) break;
				if (node._$host) {
					node = node._$host;
					walkUpTree();
					break;
				}
				if (node.parentNode === oriCurrentTarget) break;
			}
		} else walkUpTree();
		retarget(oriTarget);
	}
	function insertExpression(parent, value, current, marker, unwrapArray) {
		const hydrating = isHydrating(parent);
		if (hydrating) {
			!current && (current = [...parent.childNodes]);
			let cleaned = [];
			for (let i = 0; i < current.length; i++) {
				const node = current[i];
				if (node.nodeType === 8 && node.data.slice(0, 2) === "!$") node.remove();
				else cleaned.push(node);
			}
			current = cleaned;
		}
		while (typeof current === "function") current = current();
		if (value === current) return current;
		const t = typeof value, multi = marker !== void 0;
		parent = multi && current[0] && current[0].parentNode || parent;
		if (t === "string" || t === "number") {
			if (hydrating) return current;
			if (t === "number") {
				value = value.toString();
				if (value === current) return current;
			}
			if (multi) {
				let node = current[0];
				if (node && node.nodeType === 3) node.data !== value && (node.data = value);
				else node = document.createTextNode(value);
				current = cleanChildren(parent, current, marker, node);
			} else if (current !== "" && typeof current === "string") current = parent.firstChild.data = value;
			else current = parent.textContent = value;
		} else if (value == null || t === "boolean") {
			if (hydrating) return current;
			current = cleanChildren(parent, current, marker);
		} else if (t === "function") {
			createRenderEffect(() => {
				let v = value();
				while (typeof v === "function") v = v();
				current = insertExpression(parent, v, current, marker);
			});
			return () => current;
		} else if (Array.isArray(value)) {
			const array = [];
			const currentArray = current && Array.isArray(current);
			if (normalizeIncomingArray(array, value, current, unwrapArray)) {
				createRenderEffect(() => current = insertExpression(parent, array, current, marker, true));
				return () => current;
			}
			if (hydrating) {
				if (!array.length) return current;
				if (marker === void 0) return current = [...parent.childNodes];
				let node = array[0];
				if (node.parentNode !== parent) return current;
				const nodes = [node];
				while ((node = node.nextSibling) !== marker) nodes.push(node);
				return current = nodes;
			}
			if (array.length === 0) {
				current = cleanChildren(parent, current, marker);
				if (multi) return current;
			} else if (currentArray) if (current.length === 0) appendNodes(parent, array, marker);
			else reconcileArrays(parent, current, array);
			else {
				current && cleanChildren(parent);
				appendNodes(parent, array);
			}
			current = array;
		} else if (value.nodeType) {
			if (hydrating && value.parentNode) return current = multi ? [value] : value;
			if (Array.isArray(current)) {
				if (multi) return current = cleanChildren(parent, current, marker, value);
				cleanChildren(parent, current, null, value);
			} else if (current == null || current === "" || !parent.firstChild) parent.appendChild(value);
			else parent.replaceChild(value, parent.firstChild);
			current = value;
		} else console.warn(`Unrecognized value. Skipped inserting`, value);
		return current;
	}
	function normalizeIncomingArray(normalized, array, current, unwrap) {
		let dynamic = false;
		for (let i = 0, len = array.length; i < len; i++) {
			let item = array[i], prev = current && current[normalized.length], t;
			if (item == null || item === true || item === false);
			else if ((t = typeof item) === "object" && item.nodeType) normalized.push(item);
			else if (Array.isArray(item)) dynamic = normalizeIncomingArray(normalized, item, prev) || dynamic;
			else if (t === "function") if (unwrap) {
				while (typeof item === "function") item = item();
				dynamic = normalizeIncomingArray(normalized, Array.isArray(item) ? item : [item], Array.isArray(prev) ? prev : [prev]) || dynamic;
			} else {
				normalized.push(item);
				dynamic = true;
			}
			else {
				const value = String(item);
				if (prev && prev.nodeType === 3 && prev.data === value) normalized.push(prev);
				else normalized.push(document.createTextNode(value));
			}
		}
		return dynamic;
	}
	function appendNodes(parent, array, marker = null) {
		for (let i = 0, len = array.length; i < len; i++) parent.insertBefore(array[i], marker);
	}
	function cleanChildren(parent, current, marker, replacement) {
		if (marker === void 0) return parent.textContent = "";
		const node = replacement || document.createTextNode("");
		if (current.length) {
			let inserted = false;
			for (let i = current.length - 1; i >= 0; i--) {
				const el = current[i];
				if (node !== el) {
					const isParent = el.parentNode === parent;
					if (!inserted && !i) isParent ? parent.replaceChild(node, el) : parent.insertBefore(node, marker);
					else isParent && el.remove();
				} else inserted = true;
			}
		} else parent.insertBefore(node, marker);
		return [node];
	}
	function throwInBrowser(func) {
		const err$1 = /* @__PURE__ */ new Error(`${func.name} is not supported in the browser, returning undefined`);
		console.error(err$1);
	}
	function renderToString(fn, options) {
		throwInBrowser(renderToString);
	}
	function renderToStringAsync(fn, options) {
		throwInBrowser(renderToStringAsync);
	}
	function renderToStream(fn, options) {
		throwInBrowser(renderToStream);
	}
	var Properties, ChildProperties, Aliases, PropAliases, DelegatedEvents, SVGNamespace, memo, $$EVENTS;
	var init_dev = __esmMin((() => {
		init_dev$1();
		Properties = /* @__PURE__ */ new Set([
			"className",
			"value",
			"readOnly",
			"noValidate",
			"formNoValidate",
			"isMap",
			"noModule",
			"playsInline",
			"adAuctionHeaders",
			"allowFullscreen",
			"browsingTopics",
			"defaultChecked",
			"defaultMuted",
			"defaultSelected",
			"disablePictureInPicture",
			"disableRemotePlayback",
			"preservesPitch",
			"shadowRootClonable",
			"shadowRootCustomElementRegistry",
			"shadowRootDelegatesFocus",
			"shadowRootSerializable",
			"sharedStorageWritable",
			...[
				"allowfullscreen",
				"async",
				"alpha",
				"autofocus",
				"autoplay",
				"checked",
				"controls",
				"default",
				"disabled",
				"formnovalidate",
				"hidden",
				"indeterminate",
				"inert",
				"ismap",
				"loop",
				"multiple",
				"muted",
				"nomodule",
				"novalidate",
				"open",
				"playsinline",
				"readonly",
				"required",
				"reversed",
				"seamless",
				"selected",
				"adauctionheaders",
				"browsingtopics",
				"credentialless",
				"defaultchecked",
				"defaultmuted",
				"defaultselected",
				"defer",
				"disablepictureinpicture",
				"disableremoteplayback",
				"preservespitch",
				"shadowrootclonable",
				"shadowrootcustomelementregistry",
				"shadowrootdelegatesfocus",
				"shadowrootserializable",
				"sharedstoragewritable"
			]
		]);
		ChildProperties = /* @__PURE__ */ new Set([
			"innerHTML",
			"textContent",
			"innerText",
			"children"
		]);
		Aliases = /* @__PURE__ */ Object.assign(Object.create(null), {
			className: "class",
			htmlFor: "for"
		});
		PropAliases = /* @__PURE__ */ Object.assign(Object.create(null), {
			class: "className",
			novalidate: {
				$: "noValidate",
				FORM: 1
			},
			formnovalidate: {
				$: "formNoValidate",
				BUTTON: 1,
				INPUT: 1
			},
			ismap: {
				$: "isMap",
				IMG: 1
			},
			nomodule: {
				$: "noModule",
				SCRIPT: 1
			},
			playsinline: {
				$: "playsInline",
				VIDEO: 1
			},
			readonly: {
				$: "readOnly",
				INPUT: 1,
				TEXTAREA: 1
			},
			adauctionheaders: {
				$: "adAuctionHeaders",
				IFRAME: 1
			},
			allowfullscreen: {
				$: "allowFullscreen",
				IFRAME: 1
			},
			browsingtopics: {
				$: "browsingTopics",
				IMG: 1
			},
			defaultchecked: {
				$: "defaultChecked",
				INPUT: 1
			},
			defaultmuted: {
				$: "defaultMuted",
				AUDIO: 1,
				VIDEO: 1
			},
			defaultselected: {
				$: "defaultSelected",
				OPTION: 1
			},
			disablepictureinpicture: {
				$: "disablePictureInPicture",
				VIDEO: 1
			},
			disableremoteplayback: {
				$: "disableRemotePlayback",
				AUDIO: 1,
				VIDEO: 1
			},
			preservespitch: {
				$: "preservesPitch",
				AUDIO: 1,
				VIDEO: 1
			},
			shadowrootclonable: {
				$: "shadowRootClonable",
				TEMPLATE: 1
			},
			shadowrootdelegatesfocus: {
				$: "shadowRootDelegatesFocus",
				TEMPLATE: 1
			},
			shadowrootserializable: {
				$: "shadowRootSerializable",
				TEMPLATE: 1
			},
			sharedstoragewritable: {
				$: "sharedStorageWritable",
				IFRAME: 1,
				IMG: 1
			}
		});
		DelegatedEvents = /* @__PURE__ */ new Set([
			"beforeinput",
			"click",
			"dblclick",
			"contextmenu",
			"focusin",
			"focusout",
			"input",
			"keydown",
			"keyup",
			"mousedown",
			"mousemove",
			"mouseout",
			"mouseover",
			"mouseup",
			"pointerdown",
			"pointermove",
			"pointerout",
			"pointerover",
			"pointerup",
			"touchend",
			"touchmove",
			"touchstart"
		]);
		SVGNamespace = {
			xlink: "http://www.w3.org/1999/xlink",
			xml: "http://www.w3.org/XML/1998/namespace"
		};
		memo = (fn) => createMemo(() => fn());
		$$EVENTS = "_$DX_DELEGATE";
	}));
	function Icon({ size = "var(--xeg-icon-size)", className: className$1 = "", children: children$1, "aria-label": ariaLabel, ...otherProps }) {
		const accessibilityProps = {};
		if (ariaLabel) {
			accessibilityProps.role = "img";
			accessibilityProps["aria-label"] = ariaLabel;
		} else accessibilityProps["aria-hidden"] = "true";
		const sizeValue = typeof size === "number" ? `${size}px` : size;
		return (() => {
			var _el$ = _tmpl$$10();
			setAttribute(_el$, "width", sizeValue);
			setAttribute(_el$, "height", sizeValue);
			setAttribute(_el$, "class", className$1);
			spread(_el$, mergeProps(accessibilityProps, otherProps), true, true);
			insert(_el$, children$1);
			return _el$;
		})();
	}
	var _tmpl$$10;
	var init_Icon$1 = __esmMin((() => {
		init_dev();
		_tmpl$$10 = /* @__PURE__ */ template(`<svg xmlns=http://www.w3.org/2000/svg viewBox="0 0 24 24"fill=none stroke="var(--xeg-icon-color, currentColor)"stroke-width=var(--xeg-icon-stroke-width) stroke-linecap=round stroke-linejoin=round>`);
	}));
	var ICON_PATHS, MULTI_PATH_ICONS;
	var init_icon_paths = __esmMin((() => {
		ICON_PATHS = {
			download: "M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3",
			arrowSmallLeft: "M19.5 12H4.5m0 0l6.75 6.75M4.5 12l6.75-6.75",
			arrowSmallRight: "M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75",
			arrowsPointingIn: "M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5M15 15l5.25 5.25",
			arrowsPointingOut: "M3.75 3.75v4.5m0-4.5h4.5M3.75 3.75L9 9m-5.25 11.25v-4.5m0 4.5h4.5M3.75 20.25L9 15m11.25-11.25h-4.5m4.5 0v4.5M20.25 3.75L15 9m5.25 11.25h-4.5m4.5 0v-4.5M20.25 20.25L15 15",
			arrowsRightLeft: "M7.5 21L3 16.5M3 16.5l4.5-4.5M3 16.5h13.5M16.5 3l4.5 4.5M21 7.5l-4.5 4.5M21 7.5H7.5",
			arrowsUpDown: "M3 7.5l4.5-4.5M7.5 3l4.5 4.5M7.5 3v13.5M21 16.5l-4.5 4.5M16.5 21l-4.5-4.5M16.5 21V7.5",
			arrowDownOnSquareStack: "M7.5 7.5h-.75a2.25 2.25 0 00-2.25 2.25v7.5a2.25 2.25 0 002.25 2.25h7.5a2.25 2.25 0 002.25-2.25v-7.5a2.25 2.25 0 00-2.25-2.25h-.75m-6 3.75l3 3m0 0l3-3m-3 3V1.5m6 9h.75a2.25 2.25 0 012.25 2.25v7.5a2.25 2.25 0 01-2.25 2.25h-7.5a2.25 2.25 0 01-2.25-2.25v-.75",
			arrowLeftOnRectangle: "M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m-3.75-6l-3 3m0 0l3 3m-3-3H21.75",
			chatBubbleLeftRight: "M20.25 8.511a1.5 1.5 0 011.5 1.497v4.286a1.5 1.5 0 01-1.33 1.488c-.31.025-.62.047-.93.064v3.091L15.75 17.25c-1.353 0-2.693-.055-4.02-.163a1.5 1.5 0 01-.825-.241m9.345-8.335a4.125 4.125 0 00-.477-.095A59.924 59.924 0 0015.75 8.25c-1.355 0-2.697.056-4.023.167A1.5 1.5 0 009.75 10.608v4.286c0 .838.46 1.582 1.155 1.952m9.345-8.335V6.637a3.375 3.375 0 00-2.76-3.235A60.508 60.508 0 0011.25 3C9.135 3 7.052 3.137 5.01 3.402A3.375 3.375 0 002.25 6.637v6.225a3.375 3.375 0 002.76 3.236c.577.075 1.157.14 1.74.194V21l4.155-4.155"
		};
		MULTI_PATH_ICONS = { cog6Tooth: ["M9.593 3.94a1.125 1.125 0 011.11-.94h2.594a1.125 1.125 0 011.11.94l.214 1.281a1.125 1.125 0 00.644.87l.22.122a1.125 1.125 0 001.076-.053l1.216-.456a1.125 1.125 0 011.369.487l1.297 2.247a1.125 1.125 0 01-.259 1.41l-1.004.827a1.125 1.125 0 00-.429.908l.001.127v.255c0 .042 0 .084-.001.127a1.125 1.125 0 00.429.908l1.004.827a1.125 1.125 0 01.259 1.41l-1.297 2.246a1.125 1.125 0 01-1.369.488l-1.216-.457a1.125 1.125 0 00-1.076-.053l-.22.122a1.125 1.125 0 00-.644.87l-.214 1.281a1.125 1.125 0 01-1.11.94H10.703a1.125 1.125 0 01-1.11-.94l-.214-1.281a1.125 1.125 0 00-.644-.87l-.22-.122a1.125 1.125 0 00-1.076.053l-1.216.457a1.125 1.125 0 01-1.369-.488L3.757 15.38a1.125 1.125 0 01.259-1.41l1.005-.827a1.125 1.125 0 00.429-.908c0-.042-.001-.084-.001-.127v-.255c0-.042 0-.084.001-.127a1.125 1.125 0 00-.429-.908L4.016 9.81a1.125 1.125 0 01-.259-1.41l1.297-2.247a1.125 1.125 0 011.369-.487l1.216.456a1.125 1.125 0 001.076.052l.22-.121a1.125 1.125 0 00.644-.871L9.593 3.94z", "M15 12a3 3 0 11-6 0 3 3 0 016 0z"] };
	}));
	function createSinglePathIcon(name) {
		return function IconComponent(props) {
			return createComponent(Icon, mergeProps(props, { get children() {
				var _el$ = _tmpl$$9();
				createRenderEffect(() => setAttribute(_el$, "d", ICON_PATHS[name]));
				return _el$;
			} }));
		};
	}
	function createMultiPathIcon(name) {
		return function IconComponent(props) {
			return createComponent(Icon, mergeProps(props, { get children() {
				return MULTI_PATH_ICONS[name].map((pathData) => (() => {
					var _el$2 = _tmpl$$9();
					setAttribute(_el$2, "d", pathData);
					return _el$2;
				})());
			} }));
		};
	}
	var _tmpl$$9, HeroDownload, HeroArrowSmallLeft, HeroArrowSmallRight, HeroArrowsPointingIn, HeroArrowsPointingOut, HeroArrowsRightLeft, HeroArrowsUpDown, HeroArrowDownOnSquareStack, HeroArrowLeftOnRectangle, HeroChatBubbleLeftRight, HeroCog6Tooth;
	var init_hero_icons = __esmMin((() => {
		init_dev();
		init_Icon$1();
		init_icon_paths();
		_tmpl$$9 = /* @__PURE__ */ template(`<svg><path></svg>`, false, true, false);
		HeroDownload = createSinglePathIcon("download");
		HeroArrowSmallLeft = createSinglePathIcon("arrowSmallLeft");
		HeroArrowSmallRight = createSinglePathIcon("arrowSmallRight");
		HeroArrowsPointingIn = createSinglePathIcon("arrowsPointingIn");
		HeroArrowsPointingOut = createSinglePathIcon("arrowsPointingOut");
		HeroArrowsRightLeft = createSinglePathIcon("arrowsRightLeft");
		HeroArrowsUpDown = createSinglePathIcon("arrowsUpDown");
		HeroArrowDownOnSquareStack = createSinglePathIcon("arrowDownOnSquareStack");
		HeroArrowLeftOnRectangle = createSinglePathIcon("arrowLeftOnRectangle");
		HeroChatBubbleLeftRight = createSinglePathIcon("chatBubbleLeftRight");
		HeroCog6Tooth = createMultiPathIcon("cog6Tooth");
	}));
	var init_Icon = __esmMin((() => {
		init_hero_icons();
		init_icon_paths();
		init_Icon$1();
	}));
	function resolve(value) {
		return typeof value === "function" ? value() : value;
	}
	function resolveOptional(value) {
		if (value === void 0) return;
		return resolve(value);
	}
	function toAccessor(value) {
		return typeof value === "function" ? value : () => value;
	}
	function toRequiredAccessor(resolver, fallback) {
		return () => {
			return resolveOptional(resolver()) ?? fallback;
		};
	}
	function toOptionalAccessor(resolver) {
		return () => resolveOptional(resolver());
	}
	var init_accessor_utils = __esmMin((() => {}));
	var init_solid_helpers = __esmMin((() => {
		init_accessor_utils();
	}));
	function formatTweetText(text) {
		if (!text) return [];
		const tokens = [];
		const lines = text.split("\n");
		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			if (!line) {
				if (i < lines.length - 1) tokens.push({ type: "break" });
				continue;
			}
			let lastIndex = 0;
			let match;
			ENTITY_PATTERN.lastIndex = 0;
			while ((match = ENTITY_PATTERN.exec(line)) !== null) {
				const entity = match[0];
				const matchIndex = match.index;
				if (matchIndex > lastIndex) {
					const textContent = line.slice(lastIndex, matchIndex);
					if (textContent) tokens.push({
						type: "text",
						content: textContent
					});
				}
				tokens.push(createEntityToken(entity));
				lastIndex = matchIndex + entity.length;
			}
			if (lastIndex < line.length) {
				const textContent = line.slice(lastIndex);
				if (textContent) tokens.push({
					type: "text",
					content: textContent
				});
			}
			if (i < lines.length - 1) tokens.push({ type: "break" });
		}
		return tokens;
	}
	function createEntityToken(entity) {
		if (entity.startsWith("http")) return {
			type: "link",
			content: entity,
			href: entity
		};
		if (entity.startsWith("@")) return {
			type: "mention",
			content: entity,
			href: `https://x.com/${entity.slice(1)}`
		};
		if (entity.startsWith("#")) {
			const tag = entity.slice(1);
			return {
				type: "hashtag",
				content: entity,
				href: `https://x.com/hashtag/${encodeURIComponent(tag)}`
			};
		}
		if (entity.startsWith("$")) {
			const symbol = entity.slice(1);
			return {
				type: "cashtag",
				content: entity,
				href: `https://x.com/search?q=${encodeURIComponent(`$${symbol}`)}`
			};
		}
		return {
			type: "text",
			content: entity
		};
	}
	function shortenUrl(url, maxLength = 50) {
		if (url.length <= maxLength) return url;
		try {
			const urlObj = new URL(url);
			const domain = urlObj.hostname;
			const path = urlObj.pathname;
			const segments = path.split("/").filter(Boolean);
			const base = `${urlObj.protocol}//${domain}`;
			const allowedPathLen = maxLength - base.length;
			if (base.length >= maxLength) return `${base}${path}`;
			if (segments.length <= 2 || path.length <= Math.min(20, Math.max(0, allowedPathLen))) return `${base}${path}`;
			if (url.length > maxLength && segments.length > 2) return `${base}/${segments[0]}/.../${segments[segments.length - 1]}`;
			return `${urlObj.protocol}//${domain}${path}`;
		} catch {
			return url.length > maxLength ? `${url.slice(0, maxLength)}...` : url;
		}
	}
	function cx(...inputs) {
		const classes = [];
		for (const input of inputs) {
			if (!input) continue;
			if (typeof input === "string") classes.push(input);
			else if (typeof input === "number") classes.push(String(input));
			else if (Array.isArray(input)) {
				const nested = cx(...input);
				if (nested) classes.push(nested);
			} else if (typeof input === "object") {
				for (const [key, value] of Object.entries(input)) if (value) classes.push(key);
			}
		}
		return classes.join(" ");
	}
	var ENTITY_PATTERN;
	var init_formatting = __esmMin((() => {
		ENTITY_PATTERN = /(https?:\/\/[^\s]+|@[a-zA-Z0-9_]{1,15}|#[\p{L}\p{N}_]{1,50}|\$[A-Z]{1,6}(?:\.[A-Z]{1,2})?)/gu;
	}));
	var unifiedButton, sizeSm, sizeMd, sizeLg, variantPrimary, variantSecondary, variantOutline, variantGhost, variantDanger, variantIcon, variantToolbar, variantNavigation, variantAction, sizeToolbar, iconOnly, intentPrimary, intentSuccess, intentDanger, intentNeutral, loading$1, disabled, spinner, Button_module_default;
	var init_Button_module = __esmMin((() => {
		unifiedButton = "Button-module__unifiedButton__ML2Al";
		sizeSm = "Button-module__size-sm__Y3P43";
		sizeMd = "Button-module__size-md__jqs0k";
		sizeLg = "Button-module__size-lg__mD-hg";
		variantPrimary = "Button-module__variant-primary__XTTN4";
		variantSecondary = "Button-module__variant-secondary__wcXum";
		variantOutline = "Button-module__variant-outline__JVluG";
		variantGhost = "Button-module__variant-ghost__d7MSS";
		variantDanger = "Button-module__variant-danger__Pv532";
		variantIcon = "Button-module__variant-icon__MR3gN";
		variantToolbar = "Button-module__variant-toolbar__Wgf7L";
		variantNavigation = "Button-module__variant-navigation__pJyyf";
		variantAction = "Button-module__variant-action__1sT0p";
		sizeToolbar = "Button-module__size-toolbar__GJYIU";
		iconOnly = "Button-module__iconOnly__G-IyA";
		intentPrimary = "Button-module__intent-primary__-KgDr";
		intentSuccess = "Button-module__intent-success__eahy8";
		intentDanger = "Button-module__intent-danger__gdE-1";
		intentNeutral = "Button-module__intent-neutral__CsRJH";
		loading$1 = "Button-module__loading__KSzjx";
		disabled = "Button-module__disabled__ez-qT";
		spinner = "Button-module__spinner__1zBS-";
		Button_module_default = {
			unifiedButton,
			sizeSm,
			sizeMd,
			sizeLg,
			variantPrimary,
			variantSecondary,
			variantOutline,
			variantGhost,
			variantDanger,
			variantIcon,
			variantToolbar,
			variantNavigation,
			variantAction,
			sizeToolbar,
			iconOnly,
			intentPrimary,
			intentSuccess,
			intentDanger,
			intentNeutral,
			loading: loading$1,
			disabled,
			spinner
		};
	}));
	function Button(rawProps) {
		const [local, rest] = splitProps(mergeProps(defaultProps, rawProps), [
			"children",
			"variant",
			"size",
			"intent",
			"iconOnly",
			"loading",
			"ref",
			"className",
			"class",
			"id",
			"type",
			"form",
			"autoFocus",
			"disabled",
			"tabIndex",
			"title",
			"onClick",
			"onMouseDown",
			"onMouseUp",
			"onFocus",
			"onBlur",
			"onKeyDown",
			"onMouseEnter",
			"onMouseLeave",
			"aria-label",
			"aria-labelledby",
			"aria-describedby",
			"aria-pressed",
			"aria-expanded",
			"aria-controls",
			"aria-haspopup",
			"aria-busy",
			"data-testid",
			"data-gallery-element",
			"data-disabled",
			"data-selected",
			"data-loading"
		]);
		const fallbackProps = local;
		const resolvePropAccessor = (key) => () => rawProps[key] ?? fallbackProps[key];
		const iconOnlyAccessor = toAccessor(resolvePropAccessor("iconOnly"));
		const loadingAccessor = toAccessor(resolvePropAccessor("loading"));
		const disabledAccessor = toAccessor(resolvePropAccessor("disabled"));
		const ariaBusyAccessor = toAccessor(resolvePropAccessor("aria-busy"));
		const ariaPressedAccessor = toAccessor(resolvePropAccessor("aria-pressed"));
		const ariaDescribedbyAccessor = toAccessor(resolvePropAccessor("aria-describedby"));
		const titleAccessor = toAccessor(resolvePropAccessor("title"));
		const ariaLabelAccessor = toAccessor(resolvePropAccessor("aria-label"));
		const ariaLabelledByAccessor = toAccessor(resolvePropAccessor("aria-labelledby"));
		const isLoading$1 = createMemo(() => !!loadingAccessor());
		const isDisabled = createMemo(() => !!disabledAccessor() || isLoading$1());
		createEffect(() => {
			if (!iconOnlyAccessor()) return;
			if (!(ariaLabelAccessor() ?? ariaLabelledByAccessor() ?? titleAccessor())) logger.warn("Icon-only buttons must have accessible labels (aria-label or aria-labelledby).", {
				component: "UnifiedButton",
				variant: local.variant,
				iconOnly: true
			});
		});
		onCleanup(() => {
			local.ref?.(null);
		});
		const [elementRef, setElementRef] = createSignal(null);
		const handleClick = (event) => {
			if (isDisabled() || isLoading$1()) {
				event.preventDefault();
				event.stopPropagation();
				return;
			}
			local.onClick?.(event);
		};
		const handleMouseDown = (event) => {
			if (isDisabled()) return;
			local.onMouseDown?.(event);
		};
		const handleMouseUp = (event) => {
			if (isDisabled()) return;
			local.onMouseUp?.(event);
		};
		const handleKeyDown = (event) => {
			if (isDisabled()) return;
			local.onKeyDown?.(event);
		};
		const buttonClasses = () => cx(Button_module_default.unifiedButton, Button_module_default[`variant-${local.variant}`], Button_module_default[`size-${local.size}`], local.intent ? Button_module_default[`intent-${local.intent}`] : void 0, iconOnlyAccessor() ? Button_module_default.iconOnly : void 0, isLoading$1() ? Button_module_default.loading : void 0, isDisabled() ? Button_module_default.disabled : void 0, "xeg-inline-center", "xeg-gap-sm", typeof local.className === "function" ? local.className() : local.className, typeof local.class === "function" ? local.class() : local.class);
		const loadingClassName = Button_module_default.loading;
		createEffect(() => {
			const el = elementRef();
			const disabledNow = isDisabled();
			const loadingNow = isLoading$1();
			if (!el) return;
			el.disabled = disabledNow;
			el.setAttribute("aria-disabled", String(disabledNow));
			el.dataset.debugIsdisabled = String(disabledNow);
			el.dataset.debugPropertyDisabled = String(el.disabled);
			el.dataset.debugAttrDisabled = String(el.hasAttribute("disabled"));
			if (loadingClassName) el.classList.toggle(loadingClassName, loadingNow);
		});
		return (() => {
			var _el$ = _tmpl$$8();
			use((element) => {
				setElementRef(element ?? null);
				if (typeof local.ref === "function") local.ref(element ?? null);
			}, _el$);
			spread(_el$, mergeProps(rest, {
				get disabled() {
					return isDisabled();
				},
				get type() {
					return local.type;
				},
				get ["class"]() {
					return buttonClasses();
				},
				get id() {
					return local.id;
				},
				get ["aria-expanded"]() {
					return local["aria-expanded"];
				},
				get ["aria-pressed"]() {
					return ariaPressedAccessor() ?? void 0;
				},
				get ["aria-describedby"]() {
					return ariaDescribedbyAccessor() ?? void 0;
				},
				get ["aria-label"]() {
					return ariaLabelAccessor() ?? void 0;
				},
				get ["aria-controls"]() {
					return local["aria-controls"];
				},
				get ["aria-haspopup"]() {
					return local["aria-haspopup"];
				},
				get ["aria-busy"]() {
					return ariaBusyAccessor() ?? isLoading$1();
				},
				get ["aria-disabled"]() {
					return isDisabled();
				},
				get tabIndex() {
					return memo(() => !!isDisabled())() ? -1 : memo(() => typeof local.tabIndex === "function")() ? local.tabIndex() : local.tabIndex;
				},
				get ["data-testid"]() {
					return local["data-testid"];
				},
				get ["data-gallery-element"]() {
					return local["data-gallery-element"];
				},
				get ["data-disabled"]() {
					return local["data-disabled"];
				},
				get ["data-selected"]() {
					return local["data-selected"];
				},
				get ["data-loading"]() {
					return local["data-loading"];
				},
				get title() {
					return local.title;
				},
				"onClick": handleClick,
				"onMouseDown": handleMouseDown,
				"onMouseUp": handleMouseUp,
				get onFocus() {
					return local.onFocus;
				},
				get onBlur() {
					return local.onBlur;
				},
				"onKeyDown": handleKeyDown,
				get onMouseEnter() {
					return local.onMouseEnter;
				},
				get onMouseLeave() {
					return local.onMouseLeave;
				}
			}), false, true);
			insert(_el$, (() => {
				var _c$ = memo(() => !!isLoading$1());
				return () => _c$() && (() => {
					var _el$2 = _tmpl$2$5();
					createRenderEffect(() => className(_el$2, cx("xeg-spinner", Button_module_default.spinner)));
					return _el$2;
				})();
			})(), null);
			insert(_el$, () => local.children, null);
			return _el$;
		})();
	}
	var _tmpl$$8, _tmpl$2$5, defaultProps;
	var init_Button = __esmMin((() => {
		init_dev();
		init_logging();
		init_solid_helpers();
		init_formatting();
		init_dev$1();
		init_Button_module();
		_tmpl$$8 = /* @__PURE__ */ template(`<button>`), _tmpl$2$5 = /* @__PURE__ */ template(`<span aria-hidden=true>`);
		defaultProps = {
			variant: "primary",
			size: "md",
			type: "button",
			iconOnly: false,
			disabled: false,
			loading: false
		};
	}));
	function IconButton(props) {
		const [local, rest] = splitProps(props, ["size", "children"]);
		const isValidSize = (value) => typeof value === "string" && ALLOWED_ICON_SIZES.has(value);
		const sizeAccessor = toAccessor(local.size ?? "md");
		const safeSize = createMemo(() => {
			const current = sizeAccessor();
			return isValidSize(current) ? current : "md";
		});
		return createComponent(Button, mergeProps(rest, {
			get size() {
				return safeSize();
			},
			variant: "icon",
			iconOnly: true,
			get children() {
				return local.children;
			}
		}));
	}
	var ALLOWED_ICON_SIZES;
	var init_IconButton = __esmMin((() => {
		init_dev();
		init_Button();
		init_solid_helpers();
		init_dev$1();
		ALLOWED_ICON_SIZES = new Set([
			"sm",
			"md",
			"lg",
			"toolbar"
		]);
	}));
	var body, bodyCompact, setting, settingCompact, label, compactLabel, select, SettingsControls_module_default;
	var init_SettingsControls_module = __esmMin((() => {
		body = "SettingsControls-module__body__eEJgF";
		bodyCompact = "SettingsControls-module__bodyCompact__rFOgM";
		setting = "SettingsControls-module__setting__qGIrM";
		settingCompact = "SettingsControls-module__settingCompact__OzkTl";
		label = "SettingsControls-module__label__u4OMs";
		compactLabel = "SettingsControls-module__compactLabel__G-pHG";
		select = "SettingsControls-module__select__JsQ4a";
		SettingsControls_module_default = {
			body,
			bodyCompact,
			setting,
			settingCompact,
			label,
			compactLabel,
			select
		};
	}));
	var SettingsControls_exports = /* @__PURE__ */ __export({ SettingsControls: () => SettingsControls }, 1);
	function SettingsControls(props) {
		const languageService = getLanguageService();
		const [revision, setRevision] = createSignal(0);
		onMount(() => {
			onCleanup(languageService.onLanguageChange(() => setRevision((v) => v + 1)));
		});
		const strings = createMemo(() => {
			revision();
			return {
				theme: {
					title: languageService.translate("settings.theme"),
					labels: {
						auto: languageService.translate("settings.themeAuto"),
						light: languageService.translate("settings.themeLight"),
						dark: languageService.translate("settings.themeDark")
					}
				},
				language: {
					title: languageService.translate("settings.language"),
					labels: {
						auto: languageService.translate("settings.languageAuto"),
						ko: languageService.translate("settings.languageKo"),
						en: languageService.translate("settings.languageEn"),
						ja: languageService.translate("settings.languageJa")
					}
				}
			};
		});
		const selectClass = cx("xeg-inline-center", SettingsControls_module_default.select);
		const containerClass = cx(SettingsControls_module_default.body, props.compact && SettingsControls_module_default.bodyCompact);
		const settingClass = cx(SettingsControls_module_default.setting, props.compact && SettingsControls_module_default.settingCompact);
		const labelClass = cx(SettingsControls_module_default.label, props.compact && SettingsControls_module_default.compactLabel);
		const themeValue = createMemo(() => resolve(props.currentTheme));
		const languageValue = createMemo(() => resolve(props.currentLanguage));
		const themeSelectId = props["data-testid"] ? `${props["data-testid"]}-theme-select` : "settings-theme-select";
		const languageSelectId = props["data-testid"] ? `${props["data-testid"]}-language-select` : "settings-language-select";
		const themeStrings = () => strings().theme;
		const languageStrings = () => strings().language;
		return (() => {
			var _el$ = _tmpl$$7(), _el$2 = _el$.firstChild, _el$3 = _el$2.firstChild, _el$4 = _el$3.nextSibling, _el$5 = _el$2.nextSibling, _el$6 = _el$5.firstChild, _el$7 = _el$6.nextSibling;
			className(_el$, containerClass);
			className(_el$2, settingClass);
			setAttribute(_el$3, "for", themeSelectId);
			className(_el$3, labelClass);
			insert(_el$3, () => themeStrings().title);
			addEventListener(_el$4, "change", props.onThemeChange);
			setAttribute(_el$4, "id", themeSelectId);
			className(_el$4, selectClass);
			insert(_el$4, () => THEME_OPTIONS.map((option) => (() => {
				var _el$8 = _tmpl$2$4();
				_el$8.value = option;
				insert(_el$8, () => themeStrings().labels[option]);
				return _el$8;
			})()));
			className(_el$5, settingClass);
			setAttribute(_el$6, "for", languageSelectId);
			className(_el$6, labelClass);
			insert(_el$6, () => languageStrings().title);
			addEventListener(_el$7, "change", props.onLanguageChange);
			setAttribute(_el$7, "id", languageSelectId);
			className(_el$7, selectClass);
			insert(_el$7, () => LANGUAGE_OPTIONS.map((option) => (() => {
				var _el$9 = _tmpl$2$4();
				_el$9.value = option;
				insert(_el$9, () => languageStrings().labels[option]);
				return _el$9;
			})()));
			createRenderEffect((_p$) => {
				var _v$ = props["data-testid"], _v$2 = themeStrings().title, _v$3 = themeStrings().title, _v$4 = props["data-testid"] ? `${props["data-testid"]}-theme` : void 0, _v$5 = languageStrings().title, _v$6 = languageStrings().title, _v$7 = props["data-testid"] ? `${props["data-testid"]}-language` : void 0;
				_v$ !== _p$.e && setAttribute(_el$, "data-testid", _p$.e = _v$);
				_v$2 !== _p$.t && setAttribute(_el$4, "aria-label", _p$.t = _v$2);
				_v$3 !== _p$.a && setAttribute(_el$4, "title", _p$.a = _v$3);
				_v$4 !== _p$.o && setAttribute(_el$4, "data-testid", _p$.o = _v$4);
				_v$5 !== _p$.i && setAttribute(_el$7, "aria-label", _p$.i = _v$5);
				_v$6 !== _p$.n && setAttribute(_el$7, "title", _p$.n = _v$6);
				_v$7 !== _p$.s && setAttribute(_el$7, "data-testid", _p$.s = _v$7);
				return _p$;
			}, {
				e: void 0,
				t: void 0,
				a: void 0,
				o: void 0,
				i: void 0,
				n: void 0,
				s: void 0
			});
			createRenderEffect(() => _el$4.value = themeValue());
			createRenderEffect(() => _el$7.value = languageValue());
			return _el$;
		})();
	}
	var _tmpl$$7, _tmpl$2$4, THEME_OPTIONS, LANGUAGE_OPTIONS;
	var init_SettingsControls = __esmMin((() => {
		init_dev();
		init_service_accessors();
		init_accessor_utils();
		init_formatting();
		init_dev$1();
		init_SettingsControls_module();
		_tmpl$$7 = /* @__PURE__ */ template(`<div><div><label></label><select></select></div><div><label></label><select>`), _tmpl$2$4 = /* @__PURE__ */ template(`<option>`);
		THEME_OPTIONS = [
			"auto",
			"light",
			"dark"
		];
		LANGUAGE_OPTIONS = [
			"auto",
			"ko",
			"en",
			"ja"
		];
	}));
	var _tmpl$$6, LazySettingsControls, SettingsControlsFallback, SettingsControlsLazy;
	var init_SettingsControlsLazy = __esmMin((() => {
		init_preload_helper();
		init_dev();
		init_dev$1();
		_tmpl$$6 = /* @__PURE__ */ template(`<div style=height:7.5rem>`);
		LazySettingsControls = lazy(() => __vitePreload(() => Promise.resolve().then(() => (init_SettingsControls(), SettingsControls_exports)), void 0).then((module) => ({ default: module.SettingsControls })));
		SettingsControlsFallback = () => {
			return _tmpl$$6();
		};
		SettingsControlsLazy = (props) => createComponent(Suspense, {
			get fallback() {
				return createComponent(SettingsControlsFallback, {});
			},
			get children() {
				return createComponent(LazySettingsControls, props);
			}
		});
	}));
	function safeEventPrevent(event) {
		if (!event) return;
		event.preventDefault();
		event.stopPropagation();
	}
	function safeEventPreventAll(event) {
		if (!event) return;
		event.preventDefault();
		event.stopPropagation();
		event.stopImmediatePropagation?.();
	}
	var init_utils$1 = __esmMin((() => {}));
	var toolbarButton$1, galleryToolbar, toolbarContent, toolbarControls, counterBlock, separator, primary, downloadCurrent, success$1, downloadAll, danger, closeButton, downloadButton, mediaCounterWrapper, mediaCounter, currentIndex, totalCount, progressBar, progressFill, fitButton, settingsPanel, tweetPanel, tweetPanelBody, tweetContent, tweetLink, Toolbar_module_default;
	var init_Toolbar_module = __esmMin((() => {
		toolbarButton$1 = "Toolbar-module__toolbarButton__35EsR";
		galleryToolbar = "Toolbar-module__galleryToolbar__O-JUs";
		toolbarContent = "Toolbar-module__toolbarContent__jUEEl";
		toolbarControls = "Toolbar-module__toolbarControls__Vpuk7";
		counterBlock = "Toolbar-module__counterBlock__Kr2Ho";
		separator = "Toolbar-module__separator__vIo-Y";
		primary = "Toolbar-module__primary__r-TUg";
		downloadCurrent = "Toolbar-module__downloadCurrent__Pw8W3";
		success$1 = "Toolbar-module__success__q3VhV";
		downloadAll = "Toolbar-module__downloadAll__vbMYo";
		danger = "Toolbar-module__danger__gnomQ";
		closeButton = "Toolbar-module__closeButton__l-JAZ";
		downloadButton = "Toolbar-module__downloadButton__m841I";
		mediaCounterWrapper = "Toolbar-module__mediaCounterWrapper__Hsyde";
		mediaCounter = "Toolbar-module__mediaCounter__41sx5";
		currentIndex = "Toolbar-module__currentIndex__9uqAk";
		totalCount = "Toolbar-module__totalCount__iGFLl";
		progressBar = "Toolbar-module__progressBar__qXrXa";
		progressFill = "Toolbar-module__progressFill__90aQN";
		fitButton = "Toolbar-module__fitButton__bNT4p";
		settingsPanel = "Toolbar-module__settingsPanel__J99-k";
		tweetPanel = "Toolbar-module__tweetPanel__KvY5r";
		tweetPanelBody = "Toolbar-module__tweetPanelBody__jGM-3";
		tweetContent = "Toolbar-module__tweetContent__-9fJN";
		tweetLink = "Toolbar-module__tweetLink__C62D4";
		Toolbar_module_default = {
			toolbarButton: toolbarButton$1,
			galleryToolbar,
			toolbarContent,
			toolbarControls,
			counterBlock,
			separator,
			primary,
			downloadCurrent,
			success: success$1,
			downloadAll,
			danger,
			closeButton,
			downloadButton,
			mediaCounterWrapper,
			mediaCounter,
			currentIndex,
			totalCount,
			progressBar,
			progressFill,
			fitButton,
			settingsPanel,
			tweetPanel,
			tweetPanelBody,
			tweetContent,
			tweetLink
		};
	}));
	var TweetTextPanel_exports = /* @__PURE__ */ __export({ default: () => TweetTextPanel }, 1);
	function renderTweetAnchor(accessor, kind, displayText) {
		const token = accessor();
		return (() => {
			var _el$ = _tmpl$$5();
			_el$.$$click = (e) => e.stopPropagation();
			setAttribute(_el$, "data-kind", kind);
			insert(_el$, () => displayText ?? token.content);
			createRenderEffect((_p$) => {
				var _v$ = token.href, _v$2 = Toolbar_module_default.tweetLink;
				_v$ !== _p$.e && setAttribute(_el$, "href", _p$.e = _v$);
				_v$2 !== _p$.t && className(_el$, _p$.t = _v$2);
				return _p$;
			}, {
				e: void 0,
				t: void 0
			});
			return _el$;
		})();
	}
	function TweetTextPanel(props) {
		return (() => {
			var _el$2 = _tmpl$2$3(), _el$3 = _el$2.firstChild, _el$4 = _el$3.firstChild, _el$5 = _el$3.nextSibling;
			insert(_el$4, () => getLanguageService().translate("toolbar.tweetText") || "Tweet text");
			insert(_el$5, (() => {
				var _c$ = memo(() => !!props.tweetTextHTML);
				return () => _c$() ? (() => {
					var _el$6 = _tmpl$3$1();
					createRenderEffect(() => _el$6.innerHTML = sanitizeHTML(props.tweetTextHTML));
					return _el$6;
				})() : createComponent(For, {
					get each() {
						return formatTweetText(props.tweetText ?? "");
					},
					children: (token) => createComponent(Switch, { get children() {
						return [
							createComponent(Match, {
								get when() {
									return token.type === "link" && token;
								},
								children: (linkToken) => renderTweetAnchor(linkToken, "url", shortenUrl(linkToken().content, 40))
							}),
							createComponent(Match, {
								get when() {
									return token.type === "mention" && token;
								},
								children: (mentionToken) => renderTweetAnchor(mentionToken, "mention")
							}),
							createComponent(Match, {
								get when() {
									return token.type === "hashtag" && token;
								},
								children: (hashtagToken) => renderTweetAnchor(hashtagToken, "hashtag")
							}),
							createComponent(Match, {
								get when() {
									return token.type === "cashtag" && token;
								},
								children: (cashtagToken) => renderTweetAnchor(cashtagToken, "cashtag")
							}),
							createComponent(Match, {
								get when() {
									return token.type === "break";
								},
								get children() {
									return _tmpl$4$1();
								}
							}),
							createComponent(Match, {
								get when() {
									return token.type === "text" && token;
								},
								children: (textToken) => (() => {
									var _el$8 = _tmpl$5$1();
									insert(_el$8, () => textToken().content);
									return _el$8;
								})()
							})
						];
					} })
				});
			})());
			createRenderEffect((_p$) => {
				var _v$3 = Toolbar_module_default.tweetPanelBody, _v$4 = Toolbar_module_default.tweetTextHeader, _v$5 = Toolbar_module_default.tweetTextLabel, _v$6 = Toolbar_module_default.tweetContent;
				_v$3 !== _p$.e && className(_el$2, _p$.e = _v$3);
				_v$4 !== _p$.t && className(_el$3, _p$.t = _v$4);
				_v$5 !== _p$.a && className(_el$4, _p$.a = _v$5);
				_v$6 !== _p$.o && className(_el$5, _p$.o = _v$6);
				return _p$;
			}, {
				e: void 0,
				t: void 0,
				a: void 0,
				o: void 0
			});
			return _el$2;
		})();
	}
	var _tmpl$$5, _tmpl$2$3, _tmpl$3$1, _tmpl$4$1, _tmpl$5$1;
	var init_TweetTextPanel = __esmMin((() => {
		init_dev();
		init_service_accessors();
		init_formatting();
		init_html_sanitizer();
		init_dev$1();
		init_Toolbar_module();
		_tmpl$$5 = /* @__PURE__ */ template(`<a target=_blank rel="noopener noreferrer">`), _tmpl$2$3 = /* @__PURE__ */ template(`<div><div><span></span></div><div data-gallery-element=tweet-content data-gallery-scrollable=true>`), _tmpl$3$1 = /* @__PURE__ */ template(`<div>`), _tmpl$4$1 = /* @__PURE__ */ template(`<br>`), _tmpl$5$1 = /* @__PURE__ */ template(`<span>`);
		delegateEvents(["click"]);
	}));
	function ToolbarView(props) {
		const totalCount$1 = createMemo(() => resolve(props.totalCount));
		const currentIndex$1 = createMemo(() => resolve(props.currentIndex));
		const displayedIndex = createMemo(() => props.displayedIndex());
		const isToolbarDisabled = createMemo(() => Boolean(resolveOptional(props.disabled)));
		const activeFitMode = createMemo(() => props.activeFitMode());
		const tweetText = createMemo(() => resolveOptional(props.tweetText) ?? null);
		const tweetTextHTML = createMemo(() => resolveOptional(props.tweetTextHTML) ?? null);
		const [toolbarElement, setToolbarElement] = createSignal(null);
		const [counterElement, setCounterElement] = createSignal(null);
		const prevDisabled = createMemo(() => props.navState().prevDisabled);
		const nextDisabled = createMemo(() => props.navState().nextDisabled);
		const downloadDisabled = createMemo(() => props.navState().downloadDisabled);
		const canDownloadAll = createMemo(() => props.navState().canDownloadAll);
		const anyActionDisabled = createMemo(() => props.navState().anyActionDisabled);
		const assignToolbarRef = (element) => {
			setToolbarElement(element);
			props.settingsController.assignToolbarRef(element);
		};
		createEffect(() => {
			const element = toolbarElement();
			if (!element) return;
			element.dataset.currentIndex = String(currentIndex$1());
			element.dataset.focusedIndex = String(displayedIndex());
		});
		createEffect(() => {
			const element = counterElement();
			if (!element) return;
			element.dataset.currentIndex = String(currentIndex$1());
			element.dataset.focusedIndex = String(displayedIndex());
		});
		const hasTweetContent = () => Boolean(tweetTextHTML() ?? tweetText());
		const toolbarButtonClass = (...extra) => cx(Toolbar_module_default.toolbarButton, "xeg-inline-center", ...extra);
		const preventScrollChaining = (event) => {
			if (shouldAllowWheelDefault(event)) return;
			safeEventPreventAll(event);
		};
		return (() => {
			var _el$ = _tmpl$$4(), _el$2 = _el$.firstChild, _el$3 = _el$2.firstChild, _el$4 = _el$3.firstChild, _el$5 = _el$4.firstChild, _el$6 = _el$5.firstChild, _el$7 = _el$6.firstChild, _el$8 = _el$7.nextSibling, _el$9 = _el$8.nextSibling, _el$0 = _el$6.nextSibling, _el$1 = _el$0.firstChild, _el$10 = _el$2.nextSibling, _el$11 = _el$10.nextSibling;
			addEventListener(_el$, "wheel", preventScrollChaining);
			addEventListener(_el$, "keydown", props.settingsController.handleToolbarKeyDown, true);
			addEventListener(_el$, "blur", props.onBlur);
			addEventListener(_el$, "focus", props.onFocus);
			use(assignToolbarRef, _el$);
			insert(_el$3, createComponent(IconButton, {
				get ["class"]() {
					return toolbarButtonClass();
				},
				size: "toolbar",
				"aria-label": "Previous Media",
				title: "Previous Media (Left Arrow)",
				get disabled() {
					return prevDisabled();
				},
				get onClick() {
					return props.onPreviousClick;
				},
				"data-gallery-element": "nav-previous",
				get ["data-disabled"]() {
					return prevDisabled();
				},
				get ["data-action-disabled"]() {
					return anyActionDisabled();
				},
				get children() {
					return createComponent(HeroArrowSmallLeft, { size: 18 });
				}
			}), _el$4);
			insert(_el$3, createComponent(IconButton, {
				get ["class"]() {
					return toolbarButtonClass();
				},
				size: "toolbar",
				"aria-label": "Next Media",
				title: "Next Media (Right Arrow)",
				get disabled() {
					return nextDisabled();
				},
				get onClick() {
					return props.onNextClick;
				},
				"data-gallery-element": "nav-next",
				get ["data-disabled"]() {
					return nextDisabled();
				},
				get ["data-action-disabled"]() {
					return anyActionDisabled();
				},
				get children() {
					return createComponent(HeroArrowSmallRight, { size: 18 });
				}
			}), _el$4);
			use((element) => {
				setCounterElement(element);
			}, _el$6);
			insert(_el$7, () => displayedIndex() + 1);
			insert(_el$9, totalCount$1);
			insert(_el$3, () => props.fitModeOrder.map(({ mode: mode$1, Icon: Icon$1 }) => {
				const label$1 = props.fitModeLabels[mode$1];
				return createComponent(IconButton, {
					get ["class"]() {
						return toolbarButtonClass(Toolbar_module_default.fitButton);
					},
					size: "toolbar",
					get onClick() {
						return props.handleFitModeClick(mode$1);
					},
					get disabled() {
						return props.isFitDisabled(mode$1);
					},
					get ["aria-label"]() {
						return label$1.label;
					},
					get title() {
						return label$1.title;
					},
					"data-gallery-element": `fit-${mode$1}`,
					get ["data-selected"]() {
						return activeFitMode() === mode$1;
					},
					get ["data-disabled"]() {
						return props.isFitDisabled(mode$1);
					},
					get children() {
						return createComponent(Icon$1, { size: 18 });
					}
				});
			}), null);
			insert(_el$3, createComponent(IconButton, {
				get ["class"]() {
					return toolbarButtonClass(Toolbar_module_default.downloadButton, Toolbar_module_default.downloadCurrent);
				},
				size: "toolbar",
				get onClick() {
					return props.onDownloadCurrent;
				},
				get disabled() {
					return downloadDisabled();
				},
				"aria-label": "Download Current File",
				title: "Download Current File (Ctrl+D)",
				"data-gallery-element": "download-current",
				get ["data-disabled"]() {
					return downloadDisabled();
				},
				get ["data-action-disabled"]() {
					return anyActionDisabled();
				},
				get children() {
					return createComponent(HeroDownload, { size: 18 });
				}
			}), null);
			insert(_el$3, (() => {
				var _c$ = memo(() => !!canDownloadAll());
				return () => _c$() && createComponent(IconButton, {
					get ["class"]() {
						return toolbarButtonClass(Toolbar_module_default.downloadButton, Toolbar_module_default.downloadAll);
					},
					size: "toolbar",
					get onClick() {
						return props.onDownloadAll;
					},
					get disabled() {
						return downloadDisabled();
					},
					get ["aria-label"]() {
						return `Download all ${totalCount$1()} files as ZIP`;
					},
					get title() {
						return `Download all ${totalCount$1()} files as ZIP`;
					},
					"data-gallery-element": "download-all",
					get ["data-disabled"]() {
						return downloadDisabled();
					},
					get ["data-action-disabled"]() {
						return anyActionDisabled();
					},
					get children() {
						return createComponent(HeroArrowDownOnSquareStack, { size: 18 });
					}
				});
			})(), null);
			insert(_el$3, (() => {
				var _c$2 = memo(() => !!props.showSettingsButton);
				return () => _c$2() && createComponent(IconButton, {
					ref(r$) {
						var _ref$2 = props.settingsController.assignSettingsButtonRef;
						typeof _ref$2 === "function" ? _ref$2(r$) : props.settingsController.assignSettingsButtonRef = r$;
					},
					id: "settings-button",
					get ["class"]() {
						return toolbarButtonClass();
					},
					size: "toolbar",
					"aria-label": "Open Settings",
					get ["aria-expanded"]() {
						return props.settingsController.isSettingsExpanded() ? "true" : "false";
					},
					"aria-controls": "toolbar-settings-panel",
					title: "Settings",
					get disabled() {
						return isToolbarDisabled();
					},
					get onMouseDown() {
						return props.settingsController.handleSettingsMouseDown;
					},
					get onClick() {
						return props.settingsController.handleSettingsClick;
					},
					"data-gallery-element": "settings",
					get ["data-disabled"]() {
						return isToolbarDisabled();
					},
					get children() {
						return createComponent(HeroCog6Tooth, { size: 18 });
					}
				});
			})(), null);
			insert(_el$3, (() => {
				var _c$3 = memo(() => !!hasTweetContent());
				return () => _c$3() && createComponent(IconButton, {
					id: "tweet-text-button",
					get ["class"]() {
						return toolbarButtonClass();
					},
					size: "toolbar",
					get ["aria-label"]() {
						return getLanguageService().translate("toolbar.tweetText") || "View tweet text";
					},
					get ["aria-expanded"]() {
						return props.isTweetPanelExpanded() ? "true" : "false";
					},
					"aria-controls": "toolbar-tweet-panel",
					get title() {
						return getLanguageService().translate("toolbar.tweetText") || "Tweet text";
					},
					get disabled() {
						return isToolbarDisabled();
					},
					get onClick() {
						return props.toggleTweetPanelExpanded;
					},
					"data-gallery-element": "tweet-text",
					get ["data-disabled"]() {
						return isToolbarDisabled();
					},
					get children() {
						return createComponent(HeroChatBubbleLeftRight, { size: 18 });
					}
				});
			})(), null);
			insert(_el$3, createComponent(IconButton, {
				get ["class"]() {
					return toolbarButtonClass(Toolbar_module_default.closeButton);
				},
				size: "toolbar",
				intent: "danger",
				"aria-label": "Close Gallery",
				title: "Close Gallery (Esc)",
				get disabled() {
					return isToolbarDisabled();
				},
				get onClick() {
					return props.onCloseClick;
				},
				"data-gallery-element": "close",
				get ["data-disabled"]() {
					return isToolbarDisabled();
				},
				get children() {
					return createComponent(HeroArrowLeftOnRectangle, { size: 18 });
				}
			}), null);
			addEventListener(_el$10, "wheel", preventScrollChaining);
			addEventListener(_el$10, "click", props.settingsController.handlePanelClick, true);
			addEventListener(_el$10, "mousedown", props.settingsController.handlePanelMouseDown, true);
			var _ref$ = props.settingsController.assignSettingsPanelRef;
			typeof _ref$ === "function" ? use(_ref$, _el$10) : props.settingsController.assignSettingsPanelRef = _el$10;
			insert(_el$10, createComponent(Show, {
				get when() {
					return props.settingsController.isSettingsExpanded();
				},
				get children() {
					return createComponent(SettingsControlsLazy, {
						get currentTheme() {
							return props.settingsController.currentTheme;
						},
						get currentLanguage() {
							return props.settingsController.currentLanguage;
						},
						get onThemeChange() {
							return props.settingsController.handleThemeChange;
						},
						get onLanguageChange() {
							return props.settingsController.handleLanguageChange;
						},
						compact: true,
						"data-testid": "settings-controls"
					});
				}
			}));
			addEventListener(_el$11, "wheel", preventScrollChaining);
			insert(_el$11, createComponent(Show, {
				get when() {
					return memo(() => !!props.isTweetPanelExpanded())() && hasTweetContent();
				},
				get children() {
					return createComponent(Suspense, {
						get fallback() {
							return (() => {
								var _el$12 = _tmpl$2$2();
								createRenderEffect(() => className(_el$12, Toolbar_module_default.tweetPanelLoading));
								return _el$12;
							})();
						},
						get children() {
							return createComponent(TweetTextPanelLazy, {
								get tweetText() {
									return tweetText() ?? void 0;
								},
								get tweetTextHTML() {
									return tweetTextHTML() ?? void 0;
								}
							});
						}
					});
				}
			}));
			createRenderEffect((_p$) => {
				var _v$ = props.toolbarClass(), _v$2 = props.role ?? "toolbar", _v$3 = props["aria-label"] ?? "Gallery Toolbar", _v$4 = props["aria-describedby"], _v$5 = isToolbarDisabled(), _v$6 = props["data-testid"], _v$7 = props.toolbarDataState(), _v$8 = isToolbarDisabled(), _v$9 = props.settingsController.isSettingsExpanded(), _v$0 = props.isTweetPanelExpanded(), _v$1 = displayedIndex(), _v$10 = currentIndex$1(), _v$11 = props.tabIndex, _v$12 = cx(Toolbar_module_default.toolbarContent, "xeg-row-center"), _v$13 = Toolbar_module_default.toolbarControls, _v$14 = Toolbar_module_default.counterBlock, _v$15 = cx(Toolbar_module_default.mediaCounterWrapper, "xeg-inline-center"), _v$16 = cx(Toolbar_module_default.mediaCounter, "xeg-inline-center"), _v$17 = displayedIndex(), _v$18 = currentIndex$1(), _v$19 = Toolbar_module_default.currentIndex, _v$20 = Toolbar_module_default.separator, _v$21 = Toolbar_module_default.totalCount, _v$22 = Toolbar_module_default.progressBar, _v$23 = Toolbar_module_default.progressFill, _v$24 = props.progressWidth(), _v$25 = Toolbar_module_default.settingsPanel, _v$26 = props.settingsController.isSettingsExpanded(), _v$27 = Toolbar_module_default.tweetPanel, _v$28 = props.isTweetPanelExpanded(), _v$29 = getLanguageService().translate("toolbar.tweetTextPanel") || "Tweet text panel";
				_v$ !== _p$.e && className(_el$, _p$.e = _v$);
				_v$2 !== _p$.t && setAttribute(_el$, "role", _p$.t = _v$2);
				_v$3 !== _p$.a && setAttribute(_el$, "aria-label", _p$.a = _v$3);
				_v$4 !== _p$.o && setAttribute(_el$, "aria-describedby", _p$.o = _v$4);
				_v$5 !== _p$.i && setAttribute(_el$, "aria-disabled", _p$.i = _v$5);
				_v$6 !== _p$.n && setAttribute(_el$, "data-testid", _p$.n = _v$6);
				_v$7 !== _p$.s && setAttribute(_el$, "data-state", _p$.s = _v$7);
				_v$8 !== _p$.h && setAttribute(_el$, "data-disabled", _p$.h = _v$8);
				_v$9 !== _p$.r && setAttribute(_el$, "data-settings-expanded", _p$.r = _v$9);
				_v$0 !== _p$.d && setAttribute(_el$, "data-tweet-panel-expanded", _p$.d = _v$0);
				_v$1 !== _p$.l && setAttribute(_el$, "data-focused-index", _p$.l = _v$1);
				_v$10 !== _p$.u && setAttribute(_el$, "data-current-index", _p$.u = _v$10);
				_v$11 !== _p$.c && setAttribute(_el$, "tabindex", _p$.c = _v$11);
				_v$12 !== _p$.w && className(_el$2, _p$.w = _v$12);
				_v$13 !== _p$.m && className(_el$3, _p$.m = _v$13);
				_v$14 !== _p$.f && className(_el$4, _p$.f = _v$14);
				_v$15 !== _p$.y && className(_el$5, _p$.y = _v$15);
				_v$16 !== _p$.g && className(_el$6, _p$.g = _v$16);
				_v$17 !== _p$.p && setAttribute(_el$6, "data-focused-index", _p$.p = _v$17);
				_v$18 !== _p$.b && setAttribute(_el$6, "data-current-index", _p$.b = _v$18);
				_v$19 !== _p$.T && className(_el$7, _p$.T = _v$19);
				_v$20 !== _p$.A && className(_el$8, _p$.A = _v$20);
				_v$21 !== _p$.O && className(_el$9, _p$.O = _v$21);
				_v$22 !== _p$.I && className(_el$0, _p$.I = _v$22);
				_v$23 !== _p$.S && className(_el$1, _p$.S = _v$23);
				_v$24 !== _p$.W && setStyleProperty(_el$1, "width", _p$.W = _v$24);
				_v$25 !== _p$.C && className(_el$10, _p$.C = _v$25);
				_v$26 !== _p$.B && setAttribute(_el$10, "data-expanded", _p$.B = _v$26);
				_v$27 !== _p$.v && className(_el$11, _p$.v = _v$27);
				_v$28 !== _p$.k && setAttribute(_el$11, "data-expanded", _p$.k = _v$28);
				_v$29 !== _p$.x && setAttribute(_el$11, "aria-label", _p$.x = _v$29);
				return _p$;
			}, {
				e: void 0,
				t: void 0,
				a: void 0,
				o: void 0,
				i: void 0,
				n: void 0,
				s: void 0,
				h: void 0,
				r: void 0,
				d: void 0,
				l: void 0,
				u: void 0,
				c: void 0,
				w: void 0,
				m: void 0,
				f: void 0,
				y: void 0,
				g: void 0,
				p: void 0,
				b: void 0,
				T: void 0,
				A: void 0,
				O: void 0,
				I: void 0,
				S: void 0,
				W: void 0,
				C: void 0,
				B: void 0,
				v: void 0,
				k: void 0,
				x: void 0
			});
			return _el$;
		})();
	}
	var _tmpl$$4, _tmpl$2$2, TweetTextPanelLazy, SCROLLABLE_SELECTOR, SCROLL_LOCK_TOLERANCE, findScrollableAncestor, canConsumeWheelEvent, shouldAllowWheelDefault;
	var init_ToolbarView = __esmMin((() => {
		init_preload_helper();
		init_dev();
		init_IconButton();
		init_Icon();
		init_SettingsControlsLazy();
		init_service_accessors();
		init_utils$1();
		init_accessor_utils();
		init_formatting();
		init_dev$1();
		init_Toolbar_module();
		_tmpl$$4 = /* @__PURE__ */ template(`<div data-gallery-element=toolbar><div data-gallery-element=toolbar-content><div data-gallery-element=toolbar-controls><div data-gallery-element=counter-section><div><span aria-live=polite data-gallery-element=counter><span></span><span>/</span><span></span></span><div><div></div></div></div></div></div></div><div id=toolbar-settings-panel data-gallery-scrollable=true role=region aria-label="Settings Panel"aria-labelledby=settings-button data-gallery-element=settings-panel></div><div id=toolbar-tweet-panel role=region aria-labelledby=tweet-text-button data-gallery-element=tweet-panel>`), _tmpl$2$2 = /* @__PURE__ */ template(`<div>Loading...`);
		TweetTextPanelLazy = lazy(() => __vitePreload(() => Promise.resolve().then(() => (init_TweetTextPanel(), TweetTextPanel_exports)), void 0));
		SCROLLABLE_SELECTOR = "[data-gallery-scrollable=\"true\"]";
		SCROLL_LOCK_TOLERANCE = 1;
		findScrollableAncestor = (target) => {
			if (!(target instanceof HTMLElement)) return null;
			return target.closest(SCROLLABLE_SELECTOR);
		};
		canConsumeWheelEvent = (element, deltaY) => {
			const overflow = element.scrollHeight - element.clientHeight;
			if (overflow <= SCROLL_LOCK_TOLERANCE) return false;
			if (deltaY < 0) return element.scrollTop > SCROLL_LOCK_TOLERANCE;
			if (deltaY > 0) {
				const maxScrollTop = overflow;
				return element.scrollTop < maxScrollTop - SCROLL_LOCK_TOLERANCE;
			}
			return true;
		};
		shouldAllowWheelDefault = (event) => {
			const scrollable = findScrollableAncestor(event.target);
			if (!scrollable) return false;
			return canConsumeWheelEvent(scrollable, event.deltaY);
		};
		delegateEvents([
			"keydown",
			"mousedown",
			"click"
		]);
	}));
	function useToolbarSettingsController(options) {
		const { isSettingsExpanded, setSettingsExpanded, toggleSettingsExpanded, documentRef = typeof document !== "undefined" ? document : void 0, themeService: providedThemeService, languageService: providedLanguageService, focusDelayMs = DEFAULT_FOCUS_DELAY_MS, selectChangeGuardMs = DEFAULT_SELECT_GUARD_MS } = options;
		const themeManager = providedThemeService ?? getThemeService();
		const languageService = providedLanguageService ?? getLanguageService();
		const scheduleTimeout = (callback, delay) => {
			return globalTimerManager.setTimeout(callback, delay);
		};
		const clearScheduledTimeout = (handle) => {
			if (handle == null) return;
			globalTimerManager.clearTimeout(handle);
		};
		const [toolbarRef, setToolbarRef] = createSignal(void 0);
		const [settingsPanelRef, setSettingsPanelRef] = createSignal(void 0);
		const [settingsButtonRef, setSettingsButtonRef] = createSignal(void 0);
		const toThemeOption = (value) => {
			return value === "light" || value === "dark" ? value : "auto";
		};
		const getInitialTheme = () => {
			try {
				return toThemeOption(themeManager.getCurrentTheme());
			} catch (error$1) {
				logger.debug("[ToolbarSettingsController] Failed to read initial theme", error$1);
			}
			return "auto";
		};
		const [currentTheme, setCurrentTheme] = createSignal(getInitialTheme());
		const [currentLanguage, setCurrentLanguage] = createSignal(languageService.getCurrentLanguage());
		const syncThemeFromService = () => {
			try {
				setCurrentTheme(toThemeOption(themeManager.getCurrentTheme()));
			} catch (error$1) {
				logger.warn("[ToolbarSettingsController] Failed to read theme from service", error$1);
			}
		};
		syncThemeFromService();
		if (typeof themeManager.isInitialized === "function" && !themeManager.isInitialized()) themeManager.initialize().then(syncThemeFromService).catch((error$1) => {
			logger.warn("[ToolbarSettingsController] ThemeService initialization failed", error$1);
		});
		createEffect(() => {
			const unsubscribe = themeManager.onThemeChange((_, setting$1) => {
				setCurrentTheme(toThemeOption(setting$1));
			});
			onCleanup(() => {
				unsubscribe?.();
			});
		});
		createEffect(() => {
			const unsubscribe = languageService.onLanguageChange((next) => {
				setCurrentLanguage(next);
			});
			onCleanup(() => {
				unsubscribe();
			});
		});
		createEffect(() => {
			if (!documentRef) return;
			const expanded = isSettingsExpanded();
			const panel = settingsPanelRef();
			if (!expanded || !panel) return;
			let isSelectActive = false;
			let selectGuardTimeout = null;
			const handleSelectFocus = () => {
				isSelectActive = true;
			};
			const handleSelectBlur = () => {
				scheduleTimeout(() => {
					isSelectActive = false;
				}, 100);
			};
			const handleSelectChange = () => {
				isSelectActive = true;
				clearScheduledTimeout(selectGuardTimeout);
				selectGuardTimeout = scheduleTimeout(() => {
					isSelectActive = false;
					selectGuardTimeout = null;
				}, selectChangeGuardMs);
			};
			const selects = Array.from(panel.querySelectorAll("select"));
			selects.forEach((select$1) => {
				select$1.addEventListener("focus", handleSelectFocus);
				select$1.addEventListener("blur", handleSelectBlur);
				select$1.addEventListener("change", handleSelectChange);
			});
			const handleOutsideClick = (event) => {
				const target = event.target;
				const settingsButton = settingsButtonRef();
				const toolbarElement = toolbarRef();
				if (!target) return;
				if (isSelectActive) return;
				const targetElement = target;
				if (toolbarElement?.contains(targetElement)) return;
				if (settingsButton?.contains(targetElement)) return;
				if (panel.contains(targetElement)) return;
				let currentNode = targetElement;
				while (currentNode) {
					if (currentNode.tagName === "SELECT" || currentNode.tagName === "OPTION") return;
					currentNode = currentNode.parentElement;
				}
				setSettingsExpanded(false);
			};
			documentRef.addEventListener("mousedown", handleOutsideClick, false);
			onCleanup(() => {
				clearScheduledTimeout(selectGuardTimeout);
				documentRef.removeEventListener("mousedown", handleOutsideClick, false);
				selects.forEach((select$1) => {
					select$1.removeEventListener("focus", handleSelectFocus);
					select$1.removeEventListener("blur", handleSelectBlur);
					select$1.removeEventListener("change", handleSelectChange);
				});
			});
		});
		const handleSettingsClick = (event) => {
			event.stopImmediatePropagation?.();
			const wasExpanded = isSettingsExpanded();
			toggleSettingsExpanded();
			if (!wasExpanded) scheduleTimeout(() => {
				const firstControl = settingsPanelRef()?.querySelector("select");
				if (firstControl) firstControl.focus({ preventScroll: true });
			}, focusDelayMs);
		};
		const handleSettingsMouseDown = (event) => {
			event.stopPropagation();
		};
		const handleToolbarKeyDown = (event) => {
			if (event.key === "Escape" && isSettingsExpanded()) {
				event.preventDefault();
				event.stopPropagation();
				setSettingsExpanded(false);
				scheduleTimeout(() => {
					const settingsButton = settingsButtonRef();
					if (settingsButton) settingsButton.focus({ preventScroll: true });
				}, focusDelayMs);
			}
		};
		const handlePanelMouseDown = (event) => {
			event.stopPropagation();
		};
		const handlePanelClick = (event) => {
			event.stopPropagation();
		};
		const handleThemeChange = (event) => {
			const select$1 = event.target;
			if (!select$1) return;
			const theme = toThemeOption(select$1.value);
			setCurrentTheme(theme);
			themeManager.setTheme(theme);
			try {
				const settingsService = tryGetSettingsManager();
				if (settingsService) settingsService.set("gallery.theme", theme).catch((error$1) => {
					logger.warn("[ToolbarSettingsController] Failed to sync theme to SettingsService:", error$1);
				});
			} catch (error$1) {
				logger.debug("[ToolbarSettingsController] SettingsService not available for theme sync:", error$1);
			}
		};
		const handleLanguageChange = (event) => {
			const select$1 = event.target;
			if (!select$1) return;
			const language = select$1.value || "auto";
			setCurrentLanguage(language);
			languageService.setLanguage(language);
		};
		return {
			assignToolbarRef: (element) => {
				setToolbarRef(element ?? void 0);
			},
			assignSettingsPanelRef: (element) => {
				setSettingsPanelRef(element ?? void 0);
			},
			assignSettingsButtonRef: (element) => {
				setSettingsButtonRef(element ?? void 0);
			},
			isSettingsExpanded,
			currentTheme,
			currentLanguage,
			handleSettingsClick,
			handleSettingsMouseDown,
			handleToolbarKeyDown,
			handlePanelMouseDown,
			handlePanelClick,
			handleThemeChange,
			handleLanguageChange
		};
	}
	var DEFAULT_FOCUS_DELAY_MS, DEFAULT_SELECT_GUARD_MS;
	var init_use_toolbar_settings_controller = __esmMin((() => {
		init_service_accessors();
		init_logging();
		init_timer_management();
		init_dev$1();
		DEFAULT_FOCUS_DELAY_MS = 50;
		DEFAULT_SELECT_GUARD_MS = 300;
	}));
	function useToolbarState() {
		const [isDownloading, setIsDownloading] = createSignal(INITIAL_STATE$2.isDownloading);
		const [isLoading$1, setIsLoading] = createSignal(INITIAL_STATE$2.isLoading);
		const [hasError, setHasError] = createSignal(INITIAL_STATE$2.hasError);
		let lastDownloadToggle = 0;
		let downloadTimeoutRef = null;
		const clearDownloadTimeout = () => {
			if (downloadTimeoutRef !== null) {
				globalTimerManager.clearTimeout(downloadTimeoutRef);
				downloadTimeoutRef = null;
			}
		};
		const setDownloading = (downloading) => {
			const now = Date.now();
			if (downloading) {
				lastDownloadToggle = now;
				clearDownloadTimeout();
				setIsDownloading(true);
				setHasError(false);
				return;
			}
			const timeSinceStart = now - lastDownloadToggle;
			const minDisplayTime = 300;
			if (timeSinceStart < minDisplayTime) {
				clearDownloadTimeout();
				downloadTimeoutRef = globalTimerManager.setTimeout(() => {
					setIsDownloading(false);
					downloadTimeoutRef = null;
				}, minDisplayTime - timeSinceStart);
				return;
			}
			setIsDownloading(false);
		};
		const setLoading$1 = (loading$2) => {
			setIsLoading(loading$2);
			if (loading$2) setHasError(false);
		};
		const setError$1 = (errorState$1) => {
			setHasError(errorState$1);
			if (errorState$1) {
				setIsLoading(false);
				setIsDownloading(false);
			}
		};
		const resetState = () => {
			clearDownloadTimeout();
			lastDownloadToggle = 0;
			setIsDownloading(INITIAL_STATE$2.isDownloading);
			setIsLoading(INITIAL_STATE$2.isLoading);
			setHasError(INITIAL_STATE$2.hasError);
		};
		onCleanup(() => {
			clearDownloadTimeout();
		});
		return [{
			get isDownloading() {
				return isDownloading();
			},
			get isLoading() {
				return isLoading$1();
			},
			get hasError() {
				return hasError();
			}
		}, {
			setDownloading,
			setLoading: setLoading$1,
			setError: setError$1,
			resetState
		}];
	}
	var INITIAL_STATE$2;
	var init_use_toolbar_state = __esmMin((() => {
		init_timer_management();
		init_dev$1();
		INITIAL_STATE$2 = {
			isDownloading: false,
			isLoading: false,
			hasError: false
		};
	}));
	var init_hooks = __esmMin((() => {
		init_use_toolbar_settings_controller();
		init_use_toolbar_state();
	}));
	function getToolbarDataState(state) {
		if (state.hasError) return "error";
		if (state.isDownloading) return "downloading";
		if (state.isLoading) return "loading";
		return "idle";
	}
	function ToolbarContainer(rawProps) {
		const props = mergeProps(DEFAULT_PROPS, rawProps);
		const currentIndex$1 = toRequiredAccessor(() => props.currentIndex, 0);
		const totalCount$1 = toRequiredAccessor(() => props.totalCount, 0);
		const focusedIndex = toRequiredAccessor(() => props.focusedIndex, null);
		const isDownloadingProp = toRequiredAccessor(() => props.isDownloading, false);
		const isDisabled = toRequiredAccessor(() => props.disabled, false);
		const currentFitMode = toOptionalAccessor(() => props.currentFitMode);
		const tweetText = toOptionalAccessor(() => props.tweetText);
		const tweetTextHTML = toOptionalAccessor(() => props.tweetTextHTML);
		const [toolbarState, toolbarActions] = useToolbarState();
		const [settingsExpandedSignal, setSettingsExpandedSignal] = createSignal(false);
		const [tweetExpanded, setTweetExpanded] = createSignal(false);
		const setSettingsExpanded = (expanded) => {
			setSettingsExpandedSignal(expanded);
			if (expanded) setTweetExpanded(false);
		};
		const toggleSettings = () => {
			setSettingsExpanded(!settingsExpandedSignal());
		};
		const toggleTweet = () => {
			setTweetExpanded((prev) => {
				const next = !prev;
				if (next) setSettingsExpanded(false);
				return next;
			});
		};
		createEffect(on(isDownloadingProp, (value) => {
			toolbarActions.setDownloading(Boolean(value));
		}));
		const baseSettingsController = useToolbarSettingsController({
			isSettingsExpanded: settingsExpandedSignal,
			setSettingsExpanded,
			toggleSettingsExpanded: toggleSettings
		});
		const settingsController = {
			...baseSettingsController,
			handleSettingsClick: (event) => {
				const wasOpen = settingsExpandedSignal();
				baseSettingsController.handleSettingsClick(event);
				if (!wasOpen && settingsExpandedSignal()) props.handlers.lifecycle.onOpenSettings?.();
			}
		};
		const toolbarClass = createMemo(() => cx(Toolbar_module_default.toolbar, Toolbar_module_default.galleryToolbar, props.className));
		const totalItems = createMemo(() => Math.max(0, totalCount$1()));
		const currentIndexForNav = createMemo(() => clampIndex(currentIndex$1(), totalItems()));
		const displayedIndex = createMemo(() => resolveDisplayedIndex({
			total: totalItems(),
			currentIndex: currentIndexForNav(),
			focusedIndex: focusedIndex()
		}));
		const progressWidth = createMemo(() => calculateProgressWidth(displayedIndex(), totalItems()));
		const toolbarDataState = createMemo(() => getToolbarDataState(toolbarState));
		const navState = createMemo(() => computeNavigationState({
			total: totalItems(),
			toolbarDisabled: Boolean(isDisabled()),
			downloadBusy: Boolean(isDownloadingProp() || toolbarState.isDownloading)
		}));
		const fitModeHandlers = createMemo(() => ({
			original: props.handlers.fitMode?.onFitOriginal,
			fitWidth: props.handlers.fitMode?.onFitWidth,
			fitHeight: props.handlers.fitMode?.onFitHeight,
			fitContainer: props.handlers.fitMode?.onFitContainer
		}));
		const activeFitMode = createMemo(() => currentFitMode() ?? FIT_MODE_ORDER[0]?.mode ?? "original");
		const isToolbarDisabled = () => Boolean(isDisabled());
		const handleFitModeClick = (mode$1) => (event) => {
			safeEventPreventAll(event);
			if (isToolbarDisabled()) return;
			fitModeHandlers()[mode$1]?.(event);
		};
		const isFitDisabled = (mode$1) => {
			if (isToolbarDisabled()) return true;
			if (!fitModeHandlers()[mode$1]) return true;
			return activeFitMode() === mode$1;
		};
		const handlePrevious = createGuardedHandler(() => navState().prevDisabled, props.handlers.navigation.onPrevious);
		const handleNext = createGuardedHandler(() => navState().nextDisabled, props.handlers.navigation.onNext);
		const handleDownloadCurrent = createGuardedHandler(() => navState().downloadDisabled, props.handlers.download.onDownloadCurrent);
		const handleDownloadAll = createGuardedHandler(() => navState().downloadDisabled, props.handlers.download.onDownloadAll);
		const handleClose = (event) => {
			safeEventPrevent(event);
			props.handlers.lifecycle.onClose();
		};
		return createComponent(ToolbarView, {
			currentIndex: currentIndex$1,
			focusedIndex,
			totalCount: totalCount$1,
			isDownloading: isDownloadingProp,
			disabled: isDisabled,
			get ["aria-label"]() {
				return props["aria-label"];
			},
			get ["aria-describedby"]() {
				return props["aria-describedby"];
			},
			get role() {
				return props.role;
			},
			get tabIndex() {
				return props.tabIndex;
			},
			get ["data-testid"]() {
				return props["data-testid"];
			},
			get onFocus() {
				return props.handlers.focus?.onFocus;
			},
			get onBlur() {
				return props.handlers.focus?.onBlur;
			},
			tweetText,
			tweetTextHTML,
			toolbarClass,
			toolbarState,
			toolbarDataState,
			navState,
			displayedIndex,
			progressWidth,
			fitModeOrder: FIT_MODE_ORDER,
			fitModeLabels: FIT_MODE_LABELS,
			activeFitMode,
			handleFitModeClick,
			isFitDisabled,
			onPreviousClick: handlePrevious,
			onNextClick: handleNext,
			onDownloadCurrent: handleDownloadCurrent,
			onDownloadAll: handleDownloadAll,
			onCloseClick: handleClose,
			settingsController,
			get showSettingsButton() {
				return typeof props.handlers.lifecycle.onOpenSettings === "function";
			},
			isTweetPanelExpanded: tweetExpanded,
			toggleTweetPanelExpanded: toggleTweet
		});
	}
	var DEFAULT_PROPS, FIT_MODE_LABELS, FIT_MODE_ORDER, resolveDisplayedIndex, calculateProgressWidth, computeNavigationState, createGuardedHandler, Toolbar;
	var init_Toolbar = __esmMin((() => {
		init_dev();
		init_Icon();
		init_ToolbarView();
		init_hooks();
		init_utils$1();
		init_solid_helpers();
		init_formatting();
		init_safety$1();
		init_dev$1();
		init_Toolbar_module();
		DEFAULT_PROPS = {
			isDownloading: false,
			disabled: false,
			className: ""
		};
		FIT_MODE_LABELS = {
			original: {
				label: "Original",
				title: "Original Size (1:1)"
			},
			fitWidth: {
				label: "Fit Width",
				title: "Fit to Width"
			},
			fitHeight: {
				label: "Fit Height",
				title: "Fit to Height"
			},
			fitContainer: {
				label: "Fit Window",
				title: "Fit to Window"
			}
		};
		FIT_MODE_ORDER = [
			{
				mode: "original",
				Icon: HeroArrowsPointingOut
			},
			{
				mode: "fitWidth",
				Icon: HeroArrowsRightLeft
			},
			{
				mode: "fitHeight",
				Icon: HeroArrowsUpDown
			},
			{
				mode: "fitContainer",
				Icon: HeroArrowsPointingIn
			}
		];
		resolveDisplayedIndex = ({ total, currentIndex: currentIndex$1, focusedIndex }) => {
			if (total <= 0) return 0;
			if (typeof focusedIndex === "number" && focusedIndex >= 0 && focusedIndex < total) return focusedIndex;
			return clampIndex(currentIndex$1, total);
		};
		calculateProgressWidth = (index, total) => {
			if (total <= 0) return "0%";
			return `${(index + 1) / total * 100}%`;
		};
		computeNavigationState = ({ total, toolbarDisabled, downloadBusy }) => {
			const hasItems = total > 0;
			const canNavigate = hasItems && total > 1;
			return {
				prevDisabled: toolbarDisabled || !canNavigate,
				nextDisabled: toolbarDisabled || !canNavigate,
				canDownloadAll: total > 1,
				downloadDisabled: toolbarDisabled || downloadBusy || !hasItems,
				anyActionDisabled: toolbarDisabled
			};
		};
		createGuardedHandler = (guard, action) => {
			return (event) => {
				safeEventPrevent(event);
				if (guard()) return;
				action?.();
			};
		};
		Toolbar = ToolbarContainer;
	}));
	function requireSettingsService() {
		const service = tryGetSettingsManager();
		if (!service) throw new Error("SettingsService is not registered. Ensure bootstrap registers it before usage.");
		return service;
	}
	function getTypedSettingOr(path, fallback) {
		const value = requireSettingsService().get(path);
		return value === void 0 ? fallback : value;
	}
	function setTypedSetting(path, value) {
		return requireSettingsService().set(path, value);
	}
	var init_typed_settings = __esmMin((() => {
		init_service_accessors();
	}));
	var init_settings_access = __esmMin((() => {
		init_service_accessors();
		init_typed_settings();
	}));
	function createSignalSafe(initial) {
		const [read, write] = createSignal(initial, { equals: false });
		const signalObject = { subscribe(callback) {
			return createRoot((dispose$1) => {
				createEffect(() => callback(read()));
				return dispose$1;
			});
		} };
		Object.defineProperty(signalObject, "value", {
			get: () => read(),
			set: (v) => write(() => v),
			enumerable: true
		});
		return signalObject;
	}
	function effectSafe(fn) {
		return createRoot((dispose$1) => {
			createEffect(() => fn());
			return dispose$1;
		});
	}
	var init_signal_factory = __esmMin((() => {
		init_dev$1();
	}));
	function getDownloadState() {
		if (!downloadStateSignal) downloadStateSignal = createSignalSafe(INITIAL_STATE$1);
		return downloadStateSignal;
	}
	function setProcessingFlag(isProcessing) {
		const currentState = downloadState.value;
		if (currentState.isProcessing === isProcessing) return;
		downloadState.value = {
			...currentState,
			isProcessing
		};
	}
	function acquireDownloadLock() {
		setProcessingFlag(true);
		return () => {
			const { queue, activeTasks } = downloadState.value;
			if (queue.length === 0 && activeTasks.size === 0) setProcessingFlag(false);
		};
	}
	function isDownloadLocked() {
		return downloadState.value.isProcessing;
	}
	var INITIAL_STATE$1, downloadStateSignal, downloadState;
	var init_download_signals = __esmMin((() => {
		init_logging();
		init_result_types();
		init_safety$1();
		init_signal_factory();
		INITIAL_STATE$1 = {
			activeTasks: /* @__PURE__ */ new Map(),
			queue: [],
			isProcessing: false
		};
		downloadStateSignal = null;
		downloadState = {
			get value() {
				return getDownloadState().value;
			},
			set value(newState) {
				getDownloadState().value = newState;
			},
			subscribe(callback) {
				return getDownloadState().subscribe(callback);
			}
		};
	}));
	function isValidNavigationSource(value) {
		return typeof value === "string" && VALID_NAVIGATION_SOURCES.includes(value);
	}
	function isValidNavigationTrigger(value) {
		return typeof value === "string" && VALID_NAVIGATION_TRIGGERS.includes(value);
	}
	function isManualSource(source) {
		return source === "button" || source === "keyboard";
	}
	function createNavigationActionError(context, reason) {
		return /* @__PURE__ */ new Error(`[Gallery] Invalid navigation action (${context}): ${reason}`);
	}
	function validateNavigationParams(targetIndex, source, trigger, context) {
		if (typeof targetIndex !== "number" || Number.isNaN(targetIndex)) throw createNavigationActionError(context, "Navigate payload targetIndex invalid");
		if (!isValidNavigationSource(source)) throw createNavigationActionError(context, `Navigate payload source invalid: ${String(source)}`);
		if (!isValidNavigationTrigger(trigger)) throw createNavigationActionError(context, `Navigate payload trigger invalid: ${String(trigger)}`);
	}
	function recordNavigation(targetIndex, source) {
		const timestamp = Date.now();
		const currentIndex$1 = navigationSignals.lastNavigatedIndex.value;
		const currentSource = navigationSignals.lastSource.value;
		if (targetIndex === currentIndex$1 && isManualSource(source) && isManualSource(currentSource)) {
			navigationSignals.lastTimestamp.value = timestamp;
			return { isDuplicate: true };
		}
		navigationSignals.lastSource.value = source;
		navigationSignals.lastTimestamp.value = timestamp;
		navigationSignals.lastNavigatedIndex.value = targetIndex;
		return { isDuplicate: false };
	}
	function resetNavigation() {
		navigationSignals.lastSource.value = INITIAL_NAVIGATION_STATE.lastSource;
		navigationSignals.lastTimestamp.value = Date.now();
		navigationSignals.lastNavigatedIndex.value = INITIAL_NAVIGATION_STATE.lastNavigatedIndex;
	}
	function resolveNavigationSource(trigger) {
		if (trigger === "scroll") return "scroll";
		if (trigger === "keyboard") return "keyboard";
		return "button";
	}
	var INITIAL_NAVIGATION_STATE, VALID_NAVIGATION_SOURCES, VALID_NAVIGATION_TRIGGERS, navigationSignals;
	var init_navigation_state = __esmMin((() => {
		init_signal_factory();
		INITIAL_NAVIGATION_STATE = {
			lastSource: "auto-focus",
			lastTimestamp: Date.now(),
			lastNavigatedIndex: null
		};
		VALID_NAVIGATION_SOURCES = [
			"button",
			"keyboard",
			"scroll",
			"auto-focus"
		];
		VALID_NAVIGATION_TRIGGERS = [
			"button",
			"click",
			"keyboard",
			"scroll"
		];
		navigationSignals = {
			lastSource: createSignalSafe(INITIAL_NAVIGATION_STATE.lastSource),
			lastTimestamp: createSignalSafe(INITIAL_NAVIGATION_STATE.lastTimestamp),
			lastNavigatedIndex: createSignalSafe(INITIAL_NAVIGATION_STATE.lastNavigatedIndex)
		};
	}));
	function setError(error$1) {
		uiSignals.error.value = error$1;
		if (error$1) {
			uiSignals.isLoading.value = false;
			logger$2.error(`[Gallery UI] Error: ${error$1}`);
		}
	}
	var logger$2, INITIAL_UI_STATE, uiSignals;
	var init_ui_state = __esmMin((() => {
		init_logging();
		init_signal_factory();
		logger$2 = logger;
		INITIAL_UI_STATE = {
			viewMode: "vertical",
			isLoading: false,
			error: null
		};
		uiSignals = {
			viewMode: createSignalSafe(INITIAL_UI_STATE.viewMode),
			isLoading: createSignalSafe(INITIAL_UI_STATE.isLoading),
			error: createSignalSafe(INITIAL_UI_STATE.error)
		};
	}));
	function createEventEmitter() {
		const listeners$2 = /* @__PURE__ */ new Map();
		return {
			on(event, callback) {
				if (!listeners$2.has(event)) listeners$2.set(event, /* @__PURE__ */ new Set());
				listeners$2.get(event).add(callback);
				return () => {
					listeners$2.get(event)?.delete(callback);
				};
			},
			emit(event, data) {
				const eventListeners = listeners$2.get(event);
				if (!eventListeners) return;
				eventListeners.forEach((callback) => {
					try {
						callback(data);
					} catch (error$1) {
						logger.error(`[EventEmitter] Listener error for event "${String(event)}":`, error$1);
					}
				});
			},
			dispose() {
				listeners$2.clear();
			}
		};
	}
	var init_emitter = __esmMin((() => {
		init_logging();
	}));
	function openGallery(items, startIndex = 0) {
		const validIndex = clampIndex(startIndex, items.length);
		galleryState.value = {
			...galleryState.value,
			isOpen: true,
			mediaItems: items,
			currentIndex: validIndex,
			error: null
		};
		gallerySignals.focusedIndex.value = validIndex;
		resetNavigation();
		logger$1.debug(`[Gallery] Opened with ${items.length} items, starting at index ${validIndex}`);
	}
	function closeGallery() {
		galleryState.value = {
			...galleryState.value,
			isOpen: false,
			currentIndex: 0,
			mediaItems: [],
			error: null
		};
		gallerySignals.focusedIndex.value = null;
		gallerySignals.currentVideoElement.value = null;
		resetNavigation();
		logger$1.debug("[Gallery] Closed");
	}
	function navigateToItem(index, trigger = "button", source) {
		const state = galleryState.value;
		const validIndex = clampIndex(index, state.mediaItems.length);
		const navigationSource = source ?? resolveNavigationSource(trigger);
		validateNavigationParams(validIndex, navigationSource, trigger, "navigateToItem");
		if (recordNavigation(validIndex, navigationSource).isDuplicate) {
			logger$1.debug(`[Gallery] Already at index ${index} (source: ${navigationSource}), ensuring sync`);
			gallerySignals.focusedIndex.value = validIndex;
			return;
		}
		galleryIndexEvents.emit("navigate:start", {
			from: state.currentIndex,
			to: validIndex,
			trigger
		});
		batch$1(() => {
			galleryState.value = {
				...state,
				currentIndex: validIndex
			};
			gallerySignals.focusedIndex.value = validIndex;
		});
		galleryIndexEvents.emit("navigate:complete", {
			index: validIndex,
			trigger
		});
		logger$1.debug(`[Gallery] Navigated to item: ${index} (trigger: ${trigger}, source: ${navigationSource})`);
	}
	function navigatePrevious(trigger = "button") {
		const state = galleryState.value;
		const baseIndex = getCurrentActiveIndex();
		navigateToItem(baseIndex > 0 ? baseIndex - 1 : state.mediaItems.length - 1, trigger, resolveNavigationSource(trigger));
	}
	function navigateNext(trigger = "button") {
		const state = galleryState.value;
		const baseIndex = getCurrentActiveIndex();
		navigateToItem(baseIndex < state.mediaItems.length - 1 ? baseIndex + 1 : 0, trigger, resolveNavigationSource(trigger));
	}
	function getCurrentActiveIndex() {
		return gallerySignals.focusedIndex.value ?? galleryState.value.currentIndex;
	}
	var logger$1, batch$1, INITIAL_STATE, galleryIndexEvents, gallerySignals, galleryState;
	var init_gallery_signals = __esmMin((() => {
		init_logging();
		init_navigation_state();
		init_signal_factory();
		init_ui_state();
		init_emitter();
		init_safety$1();
		init_dev$1();
		logger$1 = logger;
		batch$1 = batch;
		INITIAL_STATE = {
			isOpen: false,
			mediaItems: [],
			currentIndex: 0,
			isLoading: false,
			error: null,
			viewMode: "vertical"
		};
		galleryIndexEvents = createEventEmitter();
		gallerySignals = {
			isOpen: createSignalSafe(INITIAL_STATE.isOpen),
			mediaItems: createSignalSafe(INITIAL_STATE.mediaItems),
			currentIndex: createSignalSafe(INITIAL_STATE.currentIndex),
			isLoading: uiSignals.isLoading,
			error: uiSignals.error,
			viewMode: uiSignals.viewMode,
			focusedIndex: createSignalSafe(null),
			currentVideoElement: createSignalSafe(null)
		};
		galleryState = {
			get value() {
				return {
					isOpen: gallerySignals.isOpen.value,
					mediaItems: gallerySignals.mediaItems.value,
					currentIndex: gallerySignals.currentIndex.value,
					isLoading: gallerySignals.isLoading.value,
					error: gallerySignals.error.value,
					viewMode: gallerySignals.viewMode.value
				};
			},
			set value(state) {
				batch$1(() => {
					gallerySignals.isOpen.value = state.isOpen;
					gallerySignals.mediaItems.value = state.mediaItems;
					gallerySignals.currentIndex.value = state.currentIndex;
					gallerySignals.isLoading.value = state.isLoading;
					gallerySignals.error.value = state.error;
					gallerySignals.viewMode.value = state.viewMode;
				});
			},
			subscribe(callback) {
				return effectSafe(() => {
					callback(galleryState.value);
				});
			}
		};
	}));
	function isDownloadUiBusy(context) {
		return Boolean(context.downloadProcessing);
	}
	var init_download_ui_state = __esmMin((() => {}));
	var DEFAULTS, FocusCoordinator;
	var init_focus_coordinator = __esmMin((() => {
		init_performance();
		DEFAULTS = {
			THRESHOLD: [
				0,
				.1,
				.2,
				.3,
				.4,
				.5,
				.6,
				.7,
				.8,
				.9,
				1
			],
			ROOT_MARGIN: "0px"
		};
		FocusCoordinator = class {
			items = /* @__PURE__ */ new Map();
			observerOptions;
			constructor(options) {
				this.options = options;
				this.observerOptions = {
					threshold: options.threshold ?? [...DEFAULTS.THRESHOLD],
					rootMargin: options.rootMargin ?? DEFAULTS.ROOT_MARGIN
				};
			}
			registerItem(index, element) {
				this.items.get(index)?.unsubscribe?.();
				if (!element) {
					this.items.delete(index);
					return;
				}
				const trackedItem = {
					element,
					isVisible: false
				};
				trackedItem.unsubscribe = SharedObserver.observe(element, (entry) => {
					const item = this.items.get(index);
					if (item) {
						item.entry = entry;
						item.isVisible = entry.isIntersecting;
					}
				}, this.observerOptions);
				this.items.set(index, trackedItem);
			}
			updateFocus(force = false) {
				if (!force && !this.options.isEnabled()) return;
				const container$2 = this.options.container();
				if (!container$2) return;
				const containerRect = container$2.getBoundingClientRect();
				const selection = this.selectBestCandidate(containerRect);
				if (!selection) return;
				if (this.options.activeIndex() !== selection.index) this.options.onFocusChange(selection.index, "auto");
			}
			cleanup() {
				for (const item of this.items.values()) item.unsubscribe?.();
				this.items.clear();
			}
			selectBestCandidate(containerRect) {
				const viewportHeight = Math.max(containerRect.height, 1);
				const viewportTop = containerRect.top;
				const viewportBottom = viewportTop + viewportHeight;
				const viewportCenter = viewportTop + viewportHeight / 2;
				const topProximityThreshold = 50;
				let bestCandidate = null;
				let topAlignedCandidate = null;
				let highestVisibilityCandidate = null;
				for (const [index, item] of this.items) {
					if (!item.isVisible || !item.element.isConnected) continue;
					const rect = item.element.getBoundingClientRect();
					const itemTop = rect.top;
					const itemHeight = rect.height;
					const itemBottom = itemTop + itemHeight;
					const itemCenter = itemTop + itemHeight / 2;
					const visibleTop = Math.max(itemTop, viewportTop);
					const visibleBottom = Math.min(itemBottom, viewportBottom);
					const visibleHeight = Math.max(0, visibleBottom - visibleTop);
					const visibilityRatio = itemHeight > 0 ? visibleHeight / itemHeight : 0;
					const centerDistance = Math.abs(itemCenter - viewportCenter);
					const topDistance = Math.abs(itemTop - viewportTop);
					if (topDistance <= topProximityThreshold && visibilityRatio > .1) {
						if (!topAlignedCandidate || topDistance < topAlignedCandidate.distance) topAlignedCandidate = {
							index,
							distance: topDistance
						};
					}
					if (visibilityRatio > .1) {
						if (!highestVisibilityCandidate || visibilityRatio > highestVisibilityCandidate.ratio || visibilityRatio === highestVisibilityCandidate.ratio && centerDistance < highestVisibilityCandidate.centerDistance) highestVisibilityCandidate = {
							index,
							ratio: visibilityRatio,
							centerDistance
						};
					}
					if (!bestCandidate || centerDistance < bestCandidate.distance) bestCandidate = {
						index,
						distance: centerDistance
					};
				}
				if (topAlignedCandidate) return topAlignedCandidate;
				if (highestVisibilityCandidate) return {
					index: highestVisibilityCandidate.index,
					distance: 0
				};
				return bestCandidate;
			}
		};
	}));
	function useGalleryFocusTracker(options) {
		const isEnabled = toAccessor(options.isEnabled);
		const container$2 = toAccessor(options.container);
		const isScrolling$1 = options.isScrolling;
		const lastNavigationTrigger = options.lastNavigationTrigger;
		const shouldTrack = () => {
			return isEnabled() && (isScrolling$1() || lastNavigationTrigger() === "scroll");
		};
		const coordinator = new FocusCoordinator({
			isEnabled: shouldTrack,
			container: container$2,
			activeIndex: () => galleryState.value.currentIndex,
			...options.threshold !== void 0 && { threshold: options.threshold },
			rootMargin: options.rootMargin ?? "0px",
			onFocusChange: (index, source) => {
				if (source === "auto" && index !== null) navigateToItem(index, "scroll", "auto-focus");
			}
		});
		onCleanup(() => coordinator.cleanup());
		const handleItemFocus = (index) => {
			navigateToItem(index, "keyboard");
		};
		return {
			focusedIndex: () => gallerySignals.focusedIndex.value,
			registerItem: (index, element) => coordinator.registerItem(index, element),
			handleItemFocus,
			forceSync: () => coordinator.updateFocus(true)
		};
	}
	var init_useGalleryFocusTracker = __esmMin((() => {
		init_focus_coordinator();
		init_gallery_signals();
		init_accessor_utils();
		init_dev$1();
	}));
	function useGalleryItemScroll(containerRef, currentIndex$1, totalItems, options = {}) {
		const containerAccessor = typeof containerRef === "function" ? containerRef : () => containerRef.current;
		const enabled = toAccessor(options.enabled ?? true);
		const behavior = toAccessor(options.behavior ?? "auto");
		const block = toAccessor(options.block ?? "start");
		const alignToCenter = toAccessor(options.alignToCenter ?? false);
		const isScrolling$1 = toAccessor(options.isScrolling ?? false);
		const currentIndexAccessor = toAccessor(currentIndex$1);
		const totalItemsAccessor = toAccessor(totalItems);
		const scrollToItem = (index) => {
			const container$2 = containerAccessor();
			if (!enabled() || !container$2 || index < 0 || index >= totalItemsAccessor()) return;
			const itemsRoot = container$2.querySelector("[data-xeg-role=\"items-list\"], [data-xeg-role=\"items-container\"]");
			if (!itemsRoot) return;
			const target = itemsRoot.querySelectorAll("[data-xeg-role=\"gallery-item\"]")[index];
			if (target) {
				options.onScrollStart?.();
				target.scrollIntoView({
					behavior: behavior(),
					block: alignToCenter() ? "center" : block(),
					inline: "nearest"
				});
			} else requestAnimationFrame(() => {
				const retryTarget = itemsRoot.querySelectorAll("[data-xeg-role=\"gallery-item\"]")[index];
				if (retryTarget) {
					options.onScrollStart?.();
					retryTarget.scrollIntoView({
						behavior: behavior(),
						block: alignToCenter() ? "center" : block(),
						inline: "nearest"
					});
				}
			});
		};
		createEffect(() => {
			const index = currentIndexAccessor();
			const container$2 = containerAccessor();
			const total = totalItemsAccessor();
			if (!container$2 || total <= 0) return;
			if (untrack(enabled) && !untrack(isScrolling$1)) scrollToItem(index);
		});
		return {
			scrollToItem,
			scrollToCurrentItem: () => scrollToItem(currentIndexAccessor())
		};
	}
	var init_useGalleryItemScroll = __esmMin((() => {
		init_accessor_utils();
		init_dev$1();
	}));
	function createEventListener(handler) {
		return (event) => {
			handler(event);
		};
	}
	function isHTMLElement(element) {
		return element instanceof HTMLElement;
	}
	function isRecord(value) {
		return typeof value === "object" && value !== null && !Array.isArray(value);
	}
	var init_guards = __esmMin((() => {}));
	function ensureGalleryScrollAvailable(element) {
		if (!element) return;
		element.querySelectorAll("[data-xeg-role=\"items-list\"], .itemsList, .content").forEach((el) => {
			if (el.style.overflowY !== "auto" && el.style.overflowY !== "scroll") el.style.overflowY = "auto";
		});
	}
	function isWithinVideoPlayer(element) {
		return VIDEO_PLAYER_CONTEXT_SELECTORS.some((selector) => {
			try {
				return element.closest(selector) !== null;
			} catch {
				return false;
			}
		});
	}
	function matchesVideoControlSelectors(element) {
		return VIDEO_CONTROL_SELECTORS.some((selector) => {
			try {
				return element.matches(selector) || element.closest(selector) !== null;
			} catch {
				return false;
			}
		});
	}
	function hasInputRangeSignature(element) {
		if (typeof element.matches !== "function") return false;
		try {
			return element.matches("input[type=\"range\"]");
		} catch {
			return false;
		}
	}
	function getNearestAttributeValue(element, attribute) {
		if (element.hasAttribute(attribute)) return element.getAttribute(attribute);
		try {
			return element.closest(`[${attribute}]`)?.getAttribute(attribute) ?? null;
		} catch {
			return null;
		}
	}
	function containsControlToken(value, tokens) {
		if (!value) return false;
		const normalized = value.toLowerCase();
		return tokens.some((token) => normalized.includes(token));
	}
	function collectControlAttributeSnapshot(element) {
		return {
			role: element.getAttribute("role"),
			dataTestId: getNearestAttributeValue(element, "data-testid"),
			ariaLabel: getNearestAttributeValue(element, "aria-label")
		};
	}
	function gatherVideoControlEvidence(element) {
		if (matchesVideoControlSelectors(element)) return {
			selectorMatch: true,
			datasetToken: false,
			ariaToken: false,
			playerScoped: true,
			roleMatch: false,
			rangeSignature: hasInputRangeSignature(element)
		};
		const attributes = collectControlAttributeSnapshot(element);
		const datasetToken = containsControlToken(attributes.dataTestId, VIDEO_CONTROL_DATASET_PREFIXES);
		const ariaToken = containsControlToken(attributes.ariaLabel, VIDEO_CONTROL_ARIA_TOKENS);
		const roleMatch = attributes.role ? VIDEO_CONTROL_ROLE_SET.has(attributes.role.toLowerCase()) : false;
		return {
			selectorMatch: false,
			datasetToken,
			ariaToken,
			playerScoped: isWithinVideoPlayer(element),
			roleMatch,
			rangeSignature: hasInputRangeSignature(element)
		};
	}
	function isVideoControlElement(element) {
		if (!isHTMLElement(element)) return false;
		if (element.tagName.toLowerCase() === "video") return true;
		const evidence = gatherVideoControlEvidence(element);
		if (evidence.selectorMatch) return true;
		if (evidence.datasetToken || evidence.ariaToken) return true;
		if (!evidence.playerScoped) return false;
		if (evidence.roleMatch || evidence.rangeSignature) return true;
		return false;
	}
	function isGalleryInternalElement(element) {
		if (!element) return false;
		if (!(element instanceof HTMLElement)) return false;
		if (typeof element.matches !== "function") {
			logger.warn("Invalid element: matches is not a function", element);
			return false;
		}
		return GALLERY_SELECTORS.some((selector) => {
			try {
				return element.matches(selector) || element.closest(selector) !== null;
			} catch (error$1) {
				logger.warn("Invalid selector:", selector, error$1);
				return false;
			}
		});
	}
	function isGalleryInternalEvent(event) {
		const target = event.target;
		if (!isHTMLElement(target)) return false;
		return isGalleryInternalElement(target);
	}
	var GALLERY_SELECTORS, VIDEO_PLAYER_CONTEXT_SELECTORS, VIDEO_CONTROL_ROLE_SET;
	var init_utils = __esmMin((() => {
		init_constants$1();
		init_logging();
		init_guards();
		GALLERY_SELECTORS = CSS.INTERNAL_SELECTORS;
		VIDEO_PLAYER_CONTEXT_SELECTORS = [
			SELECTORS.VIDEO_PLAYER,
			"[data-testid=\"videoComponent\"]",
			"[data-testid=\"videoPlayerControls\"]",
			"[data-testid=\"videoPlayerOverlay\"]",
			"[role=\"application\"]",
			"[aria-label*=\"Video\"]"
		];
		VIDEO_CONTROL_ROLE_SET = new Set(VIDEO_CONTROL_ROLES.map((role) => role.toLowerCase()));
	}));
	var listener_manager_exports = /* @__PURE__ */ __export({
		__testGetListener: () => __testGetListener,
		__testHasListener: () => __testHasListener,
		__testRegistryUnregister: () => __testRegistryUnregister,
		addListener: () => addListener,
		getEventListenerStatus: () => getEventListenerStatus,
		removeAllEventListeners: () => removeAllEventListeners,
		removeEventListenerManaged: () => removeEventListenerManaged,
		removeEventListenersByContext: () => removeEventListenersByContext
	}, 1);
	function generateListenerId(ctx) {
		const r = Math.random().toString(36).slice(2, 11);
		return ctx ? `${ctx}:${r}` : r;
	}
	function addListener(element, type, listener, options, context) {
		const id = generateListenerId(context);
		if (!element || typeof element.addEventListener !== "function") {
			logger.warn("Invalid element passed to addListener", {
				type,
				context
			});
			return id;
		}
		try {
			element.addEventListener(type, listener, options);
			const eventContext = {
				id,
				element,
				type,
				listener,
				options,
				context,
				created: Date.now()
			};
			listeners.set(id, eventContext);
			logger.debug(`Listener registered: ${type} (${id})`, { context });
			return id;
		} catch (error$1) {
			logger.error(`Failed to add listener: ${type}`, {
				error: error$1,
				context
			});
			return id;
		}
	}
	function removeEventListenerManaged(id) {
		const ctx = listeners.get(id);
		if (!ctx) {
			logger.warn(`Listener not found for removal: ${id}`);
			return false;
		}
		try {
			ctx.element.removeEventListener(ctx.type, ctx.listener, ctx.options);
			listeners.delete(id);
			logger.debug(`Listener removed: ${ctx.type} (${id})`);
			return true;
		} catch (error$1) {
			logger.error(`Failed to remove listener: ${id}`, error$1);
			return false;
		}
	}
	function removeEventListenersByContext(context) {
		const toRemove = [];
		for (const [id, ctx] of listeners) if (ctx.context === context) toRemove.push(id);
		let count = 0;
		for (const id of toRemove) if (removeEventListenerManaged(id)) count++;
		if (count > 0) logger.debug(`Removed ${count} listeners for context: ${context}`);
		return count;
	}
	function removeAllEventListeners() {
		if (listeners.size === 0) return;
		const all = Array.from(listeners.values());
		listeners.clear();
		let count = 0;
		for (const ctx of all) try {
			ctx.element.removeEventListener(ctx.type, ctx.listener, ctx.options);
			count++;
		} catch (error$1) {
			logger.warn(`Failed to remove listener: ${ctx.type}`, {
				error: error$1,
				context: ctx.context
			});
		}
		logger.debug(`Removed all ${count} listeners`);
	}
	function getEventListenerStatus() {
		const byContext = {};
		const byType = {};
		for (const ctx of listeners.values()) {
			const c = ctx.context || "default";
			byContext[c] = (byContext[c] || 0) + 1;
			byType[ctx.type] = (byType[ctx.type] || 0) + 1;
		}
		return {
			total: listeners.size,
			byContext,
			byType
		};
	}
	function __testHasListener(id) {
		return listeners.has(id);
	}
	function __testGetListener(id) {
		return listeners.get(id);
	}
	function __testRegistryUnregister(id) {
		return listeners.delete(id);
	}
	var listeners;
	var init_listener_manager = __esmMin((() => {
		init_logging();
		listeners = /* @__PURE__ */ new Map();
	}));
	var EventManager;
	var init_event_manager = __esmMin((() => {
		init_logging();
		init_lifecycle();
		init_listener_manager();
		init_singleton();
		EventManager = class EventManager {
			lifecycle;
			static singleton = createSingleton(() => new EventManager());
			isDestroyed = false;
			constructor() {
				this.lifecycle = createLifecycle("EventManager", {
					onInitialize: () => this.onInitialize(),
					onDestroy: () => this.onDestroy()
				});
			}
			static getInstance() {
				return EventManager.singleton.get();
			}
			static resetForTests() {
				EventManager.singleton.reset();
			}
			async initialize() {
				return this.lifecycle.initialize();
			}
			destroy() {
				this.lifecycle.destroy();
			}
			isInitialized() {
				return this.lifecycle.isInitialized();
			}
			async onInitialize() {
				logger.debug("EventManager initialized");
			}
			onDestroy() {
				this.cleanup();
			}
			addListener(element, type, listener, options, context) {
				if (this.isDestroyed) {
					logger.warn("EventManager: addListener called on destroyed instance");
					return "";
				}
				return addListener(element, type, listener, options, context);
			}
			removeListener(id) {
				return removeEventListenerManaged(id);
			}
			removeByContext(context) {
				return removeEventListenersByContext(context);
			}
			getIsDestroyed() {
				return this.isDestroyed;
			}
			getListenerStatus() {
				return getEventListenerStatus();
			}
			cleanup() {
				if (this.isDestroyed) return;
				this.isDestroyed = true;
				logger.debug("EventManager cleanup completed");
			}
		};
	}));
	function useGalleryScroll({ container: container$2, scrollTarget, onScroll, onScrollEnd, enabled = true, programmaticScrollTimestamp }) {
		const containerAccessor = toAccessor(container$2);
		const scrollTargetAccessor = toAccessor(scrollTarget ?? containerAccessor);
		const enabledAccessor = toAccessor(enabled);
		const programmaticTimestampAccessor = toAccessor(programmaticScrollTimestamp ?? 0);
		const isGalleryOpen$1 = createMemo(() => galleryState.value.isOpen);
		const [isScrolling$1, setIsScrolling] = createSignal(false);
		const [lastScrollTime, setLastScrollTime] = createSignal(0);
		let scrollIdleTimerId = null;
		const clearScrollIdleTimer = () => {
			if (scrollIdleTimerId !== null) {
				globalTimerManager.clearTimeout(scrollIdleTimerId);
				scrollIdleTimerId = null;
			}
		};
		const markScrolling = () => {
			setIsScrolling(true);
			setLastScrollTime(Date.now());
		};
		const scheduleScrollEnd = () => {
			clearScrollIdleTimer();
			scrollIdleTimerId = globalTimerManager.setTimeout(() => {
				setIsScrolling(false);
				logger.debug("useGalleryScroll: Scroll ended");
				onScrollEnd?.();
			}, 250);
		};
		const shouldIgnoreScroll = () => Date.now() - programmaticTimestampAccessor() < PROGRAMMATIC_SCROLL_WINDOW;
		const handleWheel = (event) => {
			if (!isGalleryOpen$1() || !isGalleryInternalEvent(event)) return;
			markScrolling();
			onScroll?.();
			scheduleScrollEnd();
		};
		const handleScroll = () => {
			if (!isGalleryOpen$1() || shouldIgnoreScroll()) return;
			markScrolling();
			onScroll?.();
			scheduleScrollEnd();
		};
		createEffect(() => {
			const isEnabled = enabledAccessor();
			const containerElement = containerAccessor();
			const eventTarget = scrollTargetAccessor() ?? containerElement;
			if (!isEnabled || !eventTarget) {
				setIsScrolling(false);
				clearScrollIdleTimer();
				return;
			}
			const eventManager = EventManager.getInstance();
			const listenerContext = `${LISTENER_CONTEXT_PREFIX}:${Date.now().toString(36)}:${Math.random().toString(36).slice(2)}`;
			const listenerIds = [];
			const registerListener = (type, handler) => {
				const id = eventManager.addListener(eventTarget, type, handler, { passive: true }, listenerContext);
				if (id) {
					listenerIds.push(id);
					logger.debug("useGalleryScroll: listener registered", {
						type,
						id,
						context: listenerContext
					});
				}
			};
			registerListener("wheel", handleWheel);
			registerListener("scroll", handleScroll);
			logger.debug("useGalleryScroll: Listeners registered");
			onCleanup(() => {
				for (const id of listenerIds) {
					eventManager.removeListener(id);
					logger.debug("useGalleryScroll: listener removed", {
						id,
						context: listenerContext
					});
				}
				clearScrollIdleTimer();
				setIsScrolling(false);
			});
		});
		onCleanup(clearScrollIdleTimer);
		return {
			isScrolling: isScrolling$1,
			lastScrollTime
		};
	}
	var PROGRAMMATIC_SCROLL_WINDOW, LISTENER_CONTEXT_PREFIX;
	var init_useGalleryScroll = __esmMin((() => {
		init_utils();
		init_logging();
		init_event_manager();
		init_gallery_signals();
		init_accessor_utils();
		init_timer_management();
		init_dev$1();
		PROGRAMMATIC_SCROLL_WINDOW = 100;
		LISTENER_CONTEXT_PREFIX = "useGalleryScroll";
	}));
	function useGalleryKeyboard({ onClose }) {
		createEffect(() => {
			if (typeof document === "undefined") return;
			const isEditableTarget = (target) => {
				const element = target;
				if (!element) return false;
				const tag = element.tagName?.toUpperCase();
				if (tag === "INPUT" || tag === "TEXTAREA") return true;
				return Boolean(element.isContentEditable);
			};
			const handleKeyDown = (event) => {
				const keyboardEvent = event;
				if (isEditableTarget(keyboardEvent.target)) return;
				let handled = false;
				if (keyboardEvent.key === "Escape") {
					onClose();
					handled = true;
				}
				if (handled) {
					keyboardEvent.preventDefault();
					keyboardEvent.stopPropagation();
				}
			};
			const eventManager = EventManager.getInstance();
			const listenerId = eventManager.addListener(document, "keydown", handleKeyDown, { capture: true }, "gallery-keyboard-navigation");
			onCleanup(() => {
				if (listenerId) eventManager.removeListener(listenerId);
			});
		});
	}
	var init_useGalleryKeyboard = __esmMin((() => {
		init_event_manager();
		init_dev$1();
	}));
	function computeViewportConstraints(rect, chrome = {}) {
		const vw = Math.max(0, Math.floor(rect.width));
		const vh = Math.max(0, Math.floor(rect.height));
		const top = Math.max(0, Math.floor(chrome.paddingTop ?? 0));
		const bottom = Math.max(0, Math.floor(chrome.paddingBottom ?? 0));
		const toolbar = Math.max(0, Math.floor(chrome.toolbarHeight ?? 0));
		return {
			viewportW: vw,
			viewportH: vh,
			constrainedH: Math.max(0, vh - top - bottom - toolbar)
		};
	}
	function applyViewportCssVars(el, v) {
		el.style.setProperty("--xeg-viewport-w", `${v.viewportW}px`);
		el.style.setProperty("--xeg-viewport-h", `${v.viewportH}px`);
		el.style.setProperty("--xeg-viewport-height-constrained", `${v.constrainedH}px`);
	}
	function observeViewportCssVars(el, getChrome) {
		let disposed = false;
		const calcAndApply = () => {
			if (disposed) return;
			const rect = el.getBoundingClientRect();
			applyViewportCssVars(el, computeViewportConstraints({
				width: rect.width,
				height: rect.height
			}, getChrome()));
		};
		let pending = false;
		const schedule = () => {
			if (pending) return;
			pending = true;
			if (typeof requestAnimationFrame === "function") requestAnimationFrame(() => {
				pending = false;
				calcAndApply();
			});
			else globalTimerManager.setTimeout(() => {
				pending = false;
				calcAndApply();
			}, 0);
		};
		calcAndApply();
		let ro = null;
		if (typeof ResizeObserver !== "undefined") {
			ro = new ResizeObserver(() => schedule());
			try {
				ro.observe(el);
			} catch {}
		}
		const onResize = () => schedule();
		let resizeListenerId = null;
		if (typeof window !== "undefined") resizeListenerId = EventManager.getInstance().addListener(window, "resize", createEventListener(onResize), { passive: true }, "viewport:resize");
		return () => {
			disposed = true;
			if (ro) try {
				ro.disconnect();
			} catch {}
			if (resizeListenerId) {
				EventManager.getInstance().removeListener(resizeListenerId);
				resizeListenerId = null;
			}
		};
	}
	var init_viewport = __esmMin((() => {
		init_event_manager();
		init_timer_management();
		init_guards();
	}));
	function isBrowserEnvironment() {
		return typeof document !== "undefined" && typeof document.createElement === "function";
	}
	function getExistingElement(id) {
		const entry = styleMap.get(id);
		if (entry) return entry;
		if (!isBrowserEnvironment()) return null;
		const domEntry = document.getElementById(id);
		if (domEntry instanceof HTMLStyleElement) {
			styleMap.set(id, domEntry);
			return domEntry;
		}
		return null;
	}
	function registerStyle(options) {
		if (!isBrowserEnvironment()) {
			logger.warn("[StyleRegistry] Unable to register style outside browser environment", options.id);
			return null;
		}
		const trimmedCss = options.cssText.trim();
		if (!trimmedCss) {
			logger.warn("[StyleRegistry] Ignoring empty style registration", options.id);
			return null;
		}
		const existing = getExistingElement(options.id);
		if (existing && options.replaceExisting !== false) {
			existing.textContent = trimmedCss;
			return {
				id: options.id,
				element: existing,
				replaced: true
			};
		}
		if (existing) return {
			id: options.id,
			element: existing,
			replaced: false
		};
		let styleElement;
		try {
			styleElement = getUserscript().addStyle(trimmedCss);
		} catch {
			styleElement = document.createElement("style");
			styleElement.textContent = trimmedCss;
			(document.head || document.documentElement).appendChild(styleElement);
		}
		styleElement.id = options.id;
		if (options.attributes) Object.entries(options.attributes).forEach(([key, value]) => {
			if (value === void 0) return;
			styleElement.setAttribute(key, String(value));
		});
		styleMap.set(options.id, styleElement);
		logger.debug("[StyleRegistry] Registered style", options.id);
		return {
			id: options.id,
			element: styleElement,
			replaced: false
		};
	}
	function hasStyle(id) {
		return styleMap.has(id) || Boolean(getExistingElement(id));
	}
	var styleMap;
	var init_style_utils = __esmMin((() => {
		init_adapter();
		init_logging();
		styleMap = /* @__PURE__ */ new Map();
	}));
	var init_styles = __esmMin((() => {
		init_style_utils();
	}));
	function injectAnimationStyles() {
		if (hasStyle(ANIMATION_STYLE_ID)) return;
		const cssText = buildScopedAnimationCss();
		registerStyle({
			id: ANIMATION_STYLE_ID,
			cssText
		});
		logger.debug("CSS animation styles registered via StyleRegistry.");
	}
	function buildScopedAnimationCss() {
		const scopedClass = (className$1) => GALLERY_SCOPE_HOSTS.map((scope) => `${scope} .${className$1}`).join(", ");
		const reducedMotionSelectors = [
			ANIMATION_CLASSES.FADE_IN,
			ANIMATION_CLASSES.FADE_OUT,
			ANIMATION_CLASSES.SLIDE_IN_BOTTOM,
			ANIMATION_CLASSES.SLIDE_OUT_TOP,
			ANIMATION_CLASSES.SCALE_IN,
			ANIMATION_CLASSES.SCALE_OUT,
			ANIMATION_CLASSES.IMAGE_LOAD
		].map(scopedClass).join(",\n      ");
		return `
@layer ${ANIMATION_LAYER} {
  @keyframes ${KEYFRAMES.FADE_IN} { from { opacity: 0; } to { opacity: 1; } }
  @keyframes ${KEYFRAMES.FADE_OUT} { from { opacity: 1; } to { opacity: 0; } }
  @keyframes ${KEYFRAMES.SLIDE_IN_BOTTOM} {
    from { opacity: 0; transform: translateY(1.25rem); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes ${KEYFRAMES.SLIDE_OUT_TOP} {
    from { opacity: 1; transform: translateY(0); }
    to { opacity: 0; transform: translateY(-1.25rem); }
  }
  @keyframes ${KEYFRAMES.SCALE_IN} {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }
  @keyframes ${KEYFRAMES.SCALE_OUT} {
    from { opacity: 1; transform: scale(1); }
    to { opacity: 0; transform: scale(0.95); }
  }
  @keyframes ${KEYFRAMES.IMAGE_LOAD} {
    from { opacity: 0; transform: scale(0.98); }
    to { opacity: 1; transform: scale(1); }
  }

  ${scopedClass(ANIMATION_CLASSES.FADE_IN)} {
    animation: ${KEYFRAMES.FADE_IN} var(--xeg-duration-normal) var(--xeg-ease-standard) forwards;
  }
  ${scopedClass(ANIMATION_CLASSES.FADE_OUT)} {
    animation: ${KEYFRAMES.FADE_OUT} var(--xeg-duration-fast) var(--xeg-ease-accelerate) forwards;
  }
  ${scopedClass(ANIMATION_CLASSES.SLIDE_IN_BOTTOM)} {
    animation: ${KEYFRAMES.SLIDE_IN_BOTTOM} var(--xeg-duration-normal) var(--xeg-ease-decelerate) forwards;
  }
  ${scopedClass(ANIMATION_CLASSES.SLIDE_OUT_TOP)} {
    animation: ${KEYFRAMES.SLIDE_OUT_TOP} var(--xeg-duration-fast) var(--xeg-ease-accelerate) forwards;
  }
  ${scopedClass(ANIMATION_CLASSES.SCALE_IN)} {
    animation: ${KEYFRAMES.SCALE_IN} var(--xeg-duration-normal) var(--xeg-ease-standard) forwards;
  }
  ${scopedClass(ANIMATION_CLASSES.SCALE_OUT)} {
    animation: ${KEYFRAMES.SCALE_OUT} var(--xeg-duration-fast) var(--xeg-ease-accelerate) forwards;
  }
  ${scopedClass(ANIMATION_CLASSES.IMAGE_LOAD)} {
    animation: ${KEYFRAMES.IMAGE_LOAD} var(--xeg-duration-slow) var(--xeg-ease-decelerate) forwards;
  }

  @media (prefers-reduced-motion: reduce) {
      ${reducedMotionSelectors} {
        animation: none;
      }
  }
}
`;
	}
	async function animateGalleryEnter(element, options = {}) {
		injectAnimationStyles();
		return new Promise((resolve$1) => {
			try {
				const handleAnimationEnd = () => {
					element.removeEventListener("animationend", handleAnimationEnd);
					element.classList.remove(ANIMATION_CLASSES.FADE_IN);
					options.onComplete?.();
					resolve$1();
				};
				element.addEventListener("animationend", handleAnimationEnd);
				element.classList.add(ANIMATION_CLASSES.FADE_IN);
			} catch (error$1) {
				logger.warn("Gallery entry animation failed:", error$1);
				resolve$1();
			}
		});
	}
	async function animateGalleryExit(element, options = {}) {
		injectAnimationStyles();
		return new Promise((resolve$1) => {
			try {
				const handleAnimationEnd = () => {
					element.removeEventListener("animationend", handleAnimationEnd);
					element.classList.remove(ANIMATION_CLASSES.FADE_OUT);
					options.onComplete?.();
					resolve$1();
				};
				element.addEventListener("animationend", handleAnimationEnd);
				element.classList.add(ANIMATION_CLASSES.FADE_OUT);
			} catch (error$1) {
				logger.warn("Gallery exit animation failed:", error$1);
				resolve$1();
			}
		});
	}
	var ANIMATION_CLASSES, ANIMATION_STYLE_ID, ANIMATION_LAYER, GALLERY_SCOPE_HOSTS, KEYFRAMES;
	var init_css_animations = __esmMin((() => {
		init_constants$1();
		init_logging();
		init_styles();
		ANIMATION_CLASSES = {
			FADE_IN: "animate-fade-in",
			FADE_OUT: "animate-fade-out",
			SLIDE_IN_BOTTOM: "animate-slide-in-bottom",
			SLIDE_OUT_TOP: "animate-slide-out-top",
			SCALE_IN: "animate-scale-in",
			SCALE_OUT: "animate-scale-out",
			IMAGE_LOAD: "animate-image-load",
			REDUCED_MOTION: "reduced-motion"
		};
		ANIMATION_STYLE_ID = "xeg-animation-styles";
		ANIMATION_LAYER = "xeg.utilities";
		GALLERY_SCOPE_HOSTS = CSS.SCOPES.HOSTS;
		KEYFRAMES = {
			FADE_IN: "xeg-fade-in",
			FADE_OUT: "xeg-fade-out",
			SLIDE_IN_BOTTOM: "xeg-slide-in-bottom",
			SLIDE_OUT_TOP: "xeg-slide-out-top",
			SCALE_IN: "xeg-scale-in",
			SCALE_OUT: "xeg-scale-out",
			IMAGE_LOAD: "xeg-image-load"
		};
	}));
	function useGalleryLifecycle(options) {
		const { containerEl, toolbarWrapperEl, isVisible } = options;
		createEffect(on(containerEl, (element) => {
			if (element) ensureGalleryScrollAvailable(element);
		}));
		createEffect(on([containerEl, isVisible], ([container$2, visible]) => {
			if (!container$2) return;
			if (visible) animateGalleryEnter(container$2);
			else {
				animateGalleryExit(container$2);
				const logCleanupFailure = (error$1) => {
					logger.warn("video cleanup failed", { error: error$1 });
				};
				container$2.querySelectorAll("video").forEach((video$1) => {
					try {
						video$1.pause();
					} catch (error$1) {
						logCleanupFailure(error$1);
					}
					try {
						if (video$1.currentTime !== 0) video$1.currentTime = 0;
					} catch (error$1) {
						logCleanupFailure(error$1);
					}
				});
			}
		}, { defer: true }));
		createEffect(() => {
			const container$2 = containerEl();
			const wrapper = toolbarWrapperEl();
			if (!container$2 || !wrapper) return;
			const cleanup$1 = observeViewportCssVars(container$2, () => {
				return {
					toolbarHeight: wrapper ? Math.floor(wrapper.getBoundingClientRect().height) : 0,
					paddingTop: 0,
					paddingBottom: 0
				};
			});
			onCleanup(() => {
				cleanup$1?.();
			});
		});
	}
	var init_useGalleryLifecycle = __esmMin((() => {
		init_utils();
		init_viewport();
		init_logging();
		init_css_animations();
		init_dev$1();
	}));
	function useGalleryNavigation(options) {
		const { isVisible, scrollToItem } = options;
		const [lastNavigationTrigger, setLastNavigationTrigger] = createSignal(null);
		const [programmaticScrollTimestamp, setProgrammaticScrollTimestamp] = createSignal(0);
		createEffect(on(isVisible, (visible) => {
			if (!visible) return;
			onCleanup(registerNavigationEvents({
				onTriggerChange: setLastNavigationTrigger,
				onNavigateComplete: ({ index, trigger }) => {
					if (trigger === "scroll") return;
					scrollToItem(index);
				}
			}));
		}));
		return {
			lastNavigationTrigger,
			setLastNavigationTrigger,
			programmaticScrollTimestamp,
			setProgrammaticScrollTimestamp
		};
	}
	function registerNavigationEvents({ onTriggerChange, onNavigateComplete }) {
		const stopStart = galleryIndexEvents.on("navigate:start", (payload) => onTriggerChange(payload.trigger));
		const stopComplete = galleryIndexEvents.on("navigate:complete", (payload) => {
			onTriggerChange(payload.trigger);
			onNavigateComplete(payload);
		});
		return () => {
			stopStart();
			stopComplete();
		};
	}
	var init_useGalleryNavigation = __esmMin((() => {
		init_gallery_signals();
		init_dev$1();
	}));
	function useToolbarAutoHide(options) {
		const { isVisible, hasItems } = options;
		const computeInitialVisibility = () => Boolean(isVisible() && hasItems());
		const [isInitialToolbarVisible, setIsInitialToolbarVisible] = createSignal(computeInitialVisibility());
		let activeTimer = null;
		const clearActiveTimer = () => {
			if (activeTimer === null) return;
			globalTimerManager.clearTimeout(activeTimer);
			activeTimer = null;
		};
		createEffect(() => {
			onCleanup(clearActiveTimer);
			if (!computeInitialVisibility()) {
				setIsInitialToolbarVisible(false);
				return;
			}
			setIsInitialToolbarVisible(true);
			const autoHideDelay = getTypedSettingOr("toolbar.autoHideDelay", 3e3);
			if (autoHideDelay === 0) {
				setIsInitialToolbarVisible(false);
				return;
			}
			activeTimer = globalTimerManager.setTimeout(() => {
				setIsInitialToolbarVisible(false);
				activeTimer = null;
			}, autoHideDelay);
		});
		return {
			isInitialToolbarVisible,
			setIsInitialToolbarVisible
		};
	}
	var init_useToolbarAutoHide = __esmMin((() => {
		init_settings_access();
		init_timer_management();
		init_dev$1();
	}));
	function useVerticalGallery(options) {
		const { isVisible, currentIndex: currentIndex$1, mediaItemsCount, containerEl, toolbarWrapperEl, itemsContainerEl, onClose } = options;
		const [focusSyncCallback, setFocusSyncCallback] = createSignal(null);
		const { isInitialToolbarVisible, setIsInitialToolbarVisible } = useToolbarAutoHide({
			isVisible,
			hasItems: () => mediaItemsCount() > 0
		});
		let scrollToItemRef = null;
		const navigationState = useGalleryNavigation({
			isVisible,
			scrollToItem: (index) => scrollToItemRef?.(index)
		});
		const { isScrolling: isScrolling$1 } = useGalleryScroll({
			container: containerEl,
			scrollTarget: itemsContainerEl,
			enabled: isVisible,
			programmaticScrollTimestamp: () => navigationState.programmaticScrollTimestamp(),
			onScrollEnd: () => focusSyncCallback()?.()
		});
		const { scrollToItem, scrollToCurrentItem } = useGalleryItemScroll(containerEl, currentIndex$1, mediaItemsCount, {
			enabled: () => !isScrolling$1() && navigationState.lastNavigationTrigger() !== "scroll",
			block: "start",
			isScrolling: isScrolling$1,
			onScrollStart: () => navigationState.setProgrammaticScrollTimestamp(Date.now())
		});
		scrollToItemRef = scrollToItem;
		const { focusedIndex, registerItem: registerFocusItem, handleItemFocus, forceSync: focusTrackerForceSync } = useGalleryFocusTracker({
			container: containerEl,
			isEnabled: isVisible,
			isScrolling: isScrolling$1,
			lastNavigationTrigger: navigationState.lastNavigationTrigger
		});
		createEffect(() => setFocusSyncCallback(() => focusTrackerForceSync));
		useGalleryLifecycle({
			containerEl,
			toolbarWrapperEl,
			isVisible
		});
		createEffect(() => {
			if (isScrolling$1()) setIsInitialToolbarVisible(false);
		});
		useGalleryKeyboard({ onClose: onClose ?? (() => {}) });
		return {
			scroll: {
				isScrolling: isScrolling$1,
				scrollToItem,
				scrollToCurrentItem
			},
			navigation: {
				lastNavigationTrigger: navigationState.lastNavigationTrigger,
				setLastNavigationTrigger: navigationState.setLastNavigationTrigger,
				programmaticScrollTimestamp: navigationState.programmaticScrollTimestamp,
				setProgrammaticScrollTimestamp: navigationState.setProgrammaticScrollTimestamp
			},
			focus: {
				focusedIndex,
				registerItem: registerFocusItem,
				handleItemFocus,
				forceSync: focusTrackerForceSync
			},
			toolbar: {
				isInitialToolbarVisible,
				setIsInitialToolbarVisible
			}
		};
	}
	var init_useVerticalGallery = __esmMin((() => {
		init_useGalleryFocusTracker();
		init_useGalleryItemScroll();
		init_useGalleryScroll();
		init_dev$1();
		init_useGalleryKeyboard();
		init_useGalleryLifecycle();
		init_useGalleryNavigation();
		init_useToolbarAutoHide();
	}));
	var xegVerticalGalleryContainer, container$1, toolbarWrapper, uiHidden, isScrolling, itemsContainer, empty, galleryItem, itemActive, scrollSpacer, toolbarHoverZone, initialToolbarVisible, toolbarButton, emptyMessage, VerticalGalleryView_module_default;
	var init_VerticalGalleryView_module = __esmMin((() => {
		xegVerticalGalleryContainer = "VerticalGalleryView-module__xegVerticalGalleryContainer__9hTS1";
		container$1 = "VerticalGalleryView-module__container__Aiml7";
		toolbarWrapper = "VerticalGalleryView-module__toolbarWrapper__p8FUg";
		uiHidden = "VerticalGalleryView-module__uiHidden__pf-aH";
		isScrolling = "VerticalGalleryView-module__isScrolling__rlz2t";
		itemsContainer = "VerticalGalleryView-module__itemsContainer__YKfXj";
		empty = "VerticalGalleryView-module__empty__jTwj2";
		galleryItem = "VerticalGalleryView-module__galleryItem__Dd-4t";
		itemActive = "VerticalGalleryView-module__itemActive__if-HU";
		scrollSpacer = "VerticalGalleryView-module__scrollSpacer__paR5C";
		toolbarHoverZone = "VerticalGalleryView-module__toolbarHoverZone__zOeUg";
		initialToolbarVisible = "VerticalGalleryView-module__initialToolbarVisible__3342w";
		toolbarButton = "VerticalGalleryView-module__toolbarButton__M755U";
		emptyMessage = "VerticalGalleryView-module__emptyMessage__4gxWK";
		VerticalGalleryView_module_default = {
			xegVerticalGalleryContainer,
			container: container$1,
			toolbarWrapper,
			uiHidden,
			isScrolling,
			itemsContainer,
			empty,
			galleryItem,
			itemActive,
			scrollSpacer,
			toolbarHoverZone,
			initialToolbarVisible,
			toolbarButton,
			emptyMessage
		};
	}));
	function useVideoVisibility(options) {
		const { container: container$2, video: video$1, isVideo } = options;
		let wasPlayingBeforeHidden = false;
		let wasMutedBeforeHidden = null;
		let unsubscribeObserver;
		let hasRunUnsubscribe = false;
		const runUnsubscribe = () => {
			if (hasRunUnsubscribe) return;
			hasRunUnsubscribe = true;
			if (typeof unsubscribeObserver === "function") unsubscribeObserver();
		};
		createEffect(() => {
			if (!isVideo) return;
			const videoEl = video$1();
			if (videoEl && typeof videoEl.muted === "boolean") try {
				videoEl.muted = true;
			} catch (err$1) {
				logger.warn("Failed to mute video", { error: err$1 });
			}
		});
		createEffect(() => {
			if (!isVideo) return;
			const containerEl = container$2();
			const videoEl = video$1();
			if (!containerEl || !videoEl) return;
			const pauseVideo = () => {
				if (typeof videoEl.pause === "function") videoEl.pause();
			};
			const playVideo = () => {
				if (typeof videoEl.play === "function") videoEl.play();
			};
			const handleVisibilityChange = (entry) => {
				if (!entry.isIntersecting) try {
					wasPlayingBeforeHidden = !videoEl.paused;
					wasMutedBeforeHidden = videoEl.muted;
					videoEl.muted = true;
					if (!videoEl.paused) pauseVideo();
				} catch (err$1) {
					logger.warn("Failed to pause video", { error: err$1 });
				}
				else try {
					if (wasMutedBeforeHidden !== null) videoEl.muted = wasMutedBeforeHidden;
					if (wasPlayingBeforeHidden) playVideo();
				} catch (err$1) {
					logger.warn("Failed to resume video", { error: err$1 });
				} finally {
					wasPlayingBeforeHidden = false;
					wasMutedBeforeHidden = null;
				}
			};
			hasRunUnsubscribe = false;
			unsubscribeObserver = SharedObserver.observe(containerEl, handleVisibilityChange, {
				threshold: 0,
				rootMargin: "0px"
			});
			onCleanup(runUnsubscribe);
		});
	}
	var init_useVideoVisibility = __esmMin((() => {
		init_logging();
		init_performance();
		init_dev$1();
	}));
	function cleanFilename(filename$1) {
		if (!filename$1) return "Untitled";
		let cleaned = filename$1.replace(/^twitter_media_\d{8}T\d{6}_/, "").replace(/^\/media\//, "").replace(/^\.\//g, "");
		const lastSegment = cleaned.split(/[\\/]/).pop();
		if (lastSegment) cleaned = lastSegment;
		if (/^[\\/]+$/.test(cleaned)) cleaned = "";
		if (cleaned.length > 40 || !cleaned) cleaned = filename$1.match(/([^/\\]+)$/)?.[1] ?? "Image";
		return cleaned;
	}
	function isVideoMedia(media) {
		const urlLowerCase = media.url.toLowerCase();
		if (VIDEO_EXTENSIONS.some((ext) => urlLowerCase.includes(ext))) return true;
		if (media.filename) {
			const filenameLowerCase = media.filename.toLowerCase();
			if (VIDEO_EXTENSIONS.some((ext) => filenameLowerCase.endsWith(ext))) return true;
		}
		try {
			return new URL(media.url).hostname === "video.twimg.com";
		} catch {
			return false;
		}
	}
	var VIDEO_EXTENSIONS;
	var init_VerticalImageItem_helpers = __esmMin((() => {
		VIDEO_EXTENSIONS = [
			".mp4",
			".webm",
			".mov",
			".avi"
		];
	}));
	var container, active, focused, imageWrapper, image, fitOriginal, video, placeholder, loadingSpinner, loading, loaded, fitWidth, fitHeight, fitContainer, errorState, errorIcon, errorText, overlay, indexBadge, metadata, filename, fileSize, error, eventBlocked, VerticalImageItem_module_default;
	var init_VerticalImageItem_module = __esmMin((() => {
		container = "VerticalImageItem-module__container__qRcUG";
		active = "VerticalImageItem-module__active__aWEB-";
		focused = "VerticalImageItem-module__focused__bxsv8";
		imageWrapper = "VerticalImageItem-module__imageWrapper__-kjRY";
		image = "VerticalImageItem-module__image__cSYBD";
		fitOriginal = "VerticalImageItem-module__fitOriginal__t20HA";
		video = "VerticalImageItem-module__video__5UXue";
		placeholder = "VerticalImageItem-module__placeholder__qhYm5";
		loadingSpinner = "VerticalImageItem-module__loadingSpinner__Hozd6";
		loading = "VerticalImageItem-module__loading__t4w5-";
		loaded = "VerticalImageItem-module__loaded__vDV6N";
		fitWidth = "VerticalImageItem-module__fitWidth__J7xHh";
		fitHeight = "VerticalImageItem-module__fitHeight__aeywR";
		fitContainer = "VerticalImageItem-module__fitContainer__ecmXz";
		errorState = "VerticalImageItem-module__errorState__TKC7D";
		errorIcon = "VerticalImageItem-module__errorIcon__mJvHs";
		errorText = "VerticalImageItem-module__errorText__noZXv";
		overlay = "VerticalImageItem-module__overlay__OQwvZ";
		indexBadge = "VerticalImageItem-module__indexBadge__yBh8J";
		metadata = "VerticalImageItem-module__metadata__hI89j";
		filename = "VerticalImageItem-module__filename__t8N-l";
		fileSize = "VerticalImageItem-module__fileSize__zxmCp";
		error = "VerticalImageItem-module__error__nD2NQ";
		eventBlocked = "VerticalImageItem-module__eventBlocked__I55ty";
		VerticalImageItem_module_default = {
			container,
			active,
			focused,
			imageWrapper,
			image,
			fitOriginal,
			video,
			placeholder,
			loadingSpinner,
			loading,
			loaded,
			fitWidth,
			fitHeight,
			fitContainer,
			errorState,
			errorIcon,
			errorText,
			overlay,
			indexBadge,
			metadata,
			filename,
			fileSize,
			error,
			eventBlocked
		};
	}));
	function VerticalImageItem(props) {
		const { media, index, isActive, isFocused = false, forceVisible = false, onClick, onImageContextMenu, className: className$1 = "", onMediaLoad, "data-testid": testId, "aria-label": ariaLabel, "aria-describedby": ariaDescribedBy, registerContainer, role, tabIndex, onFocus, onBlur, onKeyDown } = props;
		const isVideo = isVideoMedia(media);
		const [isLoaded, setIsLoaded] = createSignal(false);
		const [isError, setIsError] = createSignal(false);
		const [isVisible, setIsVisible] = createSignal(forceVisible);
		const [containerRef, setContainerRef] = createSignal(null);
		const [imageRef, setImageRef] = createSignal(null);
		const [videoRef, setVideoRef] = createSignal(null);
		const dimensions = createMemo(() => resolveMediaDimensions(media));
		const intrinsicSizingStyle = createMemo(() => {
			return createIntrinsicSizingStyle(dimensions());
		});
		useVideoVisibility({
			container: containerRef,
			video: videoRef,
			isVideo
		});
		const [videoVolume, setVideoVolume] = createSignal(getTypedSettingOr("gallery.videoVolume", 1));
		const [videoMuted, setVideoMuted] = createSignal(getTypedSettingOr("gallery.videoMuted", false));
		let isApplyingVideoSettings = false;
		createEffect(() => {
			const video$1 = videoRef();
			if (video$1 && isVideo) {
				isApplyingVideoSettings = true;
				try {
					video$1.muted = videoMuted();
					video$1.volume = videoVolume();
				} finally {
					isApplyingVideoSettings = false;
				}
			}
		});
		const handleVolumeChange = (event) => {
			if (isApplyingVideoSettings) return;
			const video$1 = event.currentTarget;
			const newVolume = video$1.volume;
			const newMuted = video$1.muted;
			setVideoVolume(newVolume);
			setVideoMuted(newMuted);
			setTypedSetting("gallery.videoVolume", newVolume);
			setTypedSetting("gallery.videoMuted", newMuted);
		};
		const handleClick = () => {
			containerRef()?.focus?.({ preventScroll: true });
			onClick?.();
		};
		const handleContainerClick = (event) => {
			event?.stopImmediatePropagation?.();
			handleClick();
		};
		const handleMediaLoad = () => {
			if (!isLoaded()) {
				setIsLoaded(true);
				setIsError(false);
				onMediaLoad?.(media.url, index);
			}
		};
		const handleMediaError = () => {
			setIsError(true);
			setIsLoaded(false);
		};
		const handleContextMenu = (event) => {
			onImageContextMenu?.(event, media);
		};
		createEffect(() => {
			if (forceVisible && !isVisible()) setIsVisible(true);
		});
		createEffect(() => {
			const container$2 = containerRef();
			if (!container$2 || isVisible() || forceVisible) return;
			let unsubscribe = null;
			const handleEntry = (entry) => {
				if (entry.isIntersecting) {
					setIsVisible(true);
					unsubscribe?.();
					unsubscribe = null;
				}
			};
			unsubscribe = SharedObserver.observe(container$2, handleEntry, {
				threshold: .1,
				rootMargin: "100px"
			});
			onCleanup(() => {
				unsubscribe?.();
				unsubscribe = null;
			});
		});
		createEffect(() => {
			if (!isVisible() || isLoaded()) return;
			if (isVideo) {
				const video$1 = videoRef();
				if (video$1 && video$1.readyState >= 1) handleMediaLoad();
			} else if (imageRef()?.complete) handleMediaLoad();
		});
		const resolvedFitMode = createMemo(() => {
			const value = props.fitMode;
			if (typeof value === "function") return value() ?? "fitWidth";
			return value ?? "fitWidth";
		});
		const fitModeClass = createMemo(() => FIT_MODE_CLASSES[resolvedFitMode()] ?? "");
		const containerClasses = createMemo(() => cx("xeg-gallery", "xeg-gallery-item", "vertical-item", VerticalImageItem_module_default.container, VerticalImageItem_module_default.imageWrapper, isActive ? VerticalImageItem_module_default.active : void 0, isFocused ? VerticalImageItem_module_default.focused : void 0, fitModeClass(), className$1));
		const imageClasses = createMemo(() => cx(VerticalImageItem_module_default.image, fitModeClass()));
		const ariaProps = {
			"aria-label": ariaLabel || `Media ${index + 1}: ${cleanFilename(media.filename)}`,
			"aria-describedby": ariaDescribedBy,
			role: role || "button",
			tabIndex: tabIndex ?? 0
		};
		const testProps = testId ? { "data-testid": testId } : {};
		const assignContainerRef = (element) => {
			setContainerRef(element);
			registerContainer?.(element);
		};
		return (() => {
			var _el$ = _tmpl$$3();
			addEventListener(_el$, "keydown", onKeyDown, true);
			addEventListener(_el$, "blur", onBlur);
			addEventListener(_el$, "focus", onFocus);
			_el$.$$click = handleContainerClick;
			use(assignContainerRef, _el$);
			setAttribute(_el$, "data-index", index);
			setAttribute(_el$, "data-item-index", index);
			spread(_el$, mergeProps({
				get ["class"]() {
					return containerClasses();
				},
				get ["data-fit-mode"]() {
					return resolvedFitMode();
				},
				get ["data-media-loaded"]() {
					return isLoaded() ? "true" : "false";
				},
				get style() {
					return intrinsicSizingStyle();
				}
			}, ariaProps, testProps), false, true);
			insert(_el$, (() => {
				var _c$ = memo(() => !!isVisible());
				return () => _c$() && [
					memo(() => memo(() => !!(!isLoaded() && !isError() && !isVideo))() && (() => {
						var _el$2 = _tmpl$2$1(), _el$3 = _el$2.firstChild;
						createRenderEffect((_p$) => {
							var _v$ = VerticalImageItem_module_default.placeholder, _v$2 = cx("xeg-spinner", VerticalImageItem_module_default.loadingSpinner);
							_v$ !== _p$.e && className(_el$2, _p$.e = _v$);
							_v$2 !== _p$.t && className(_el$3, _p$.t = _v$2);
							return _p$;
						}, {
							e: void 0,
							t: void 0
						});
						return _el$2;
					})()),
					isVideo ? (() => {
						var _el$4 = _tmpl$3();
						_el$4.addEventListener("volumechange", handleVolumeChange);
						_el$4.addEventListener("dragstart", (e) => e.preventDefault());
						_el$4.$$contextmenu = handleContextMenu;
						_el$4.addEventListener("error", handleMediaError);
						_el$4.addEventListener("canplay", handleMediaLoad);
						_el$4.addEventListener("loadeddata", handleMediaLoad);
						_el$4.addEventListener("loadedmetadata", handleMediaLoad);
						use(setVideoRef, _el$4);
						_el$4.autoplay = false;
						createRenderEffect((_p$) => {
							var _v$3 = media.url, _v$4 = cx(VerticalImageItem_module_default.video, fitModeClass(), isLoaded() ? VerticalImageItem_module_default.loaded : VerticalImageItem_module_default.loading), _v$5 = resolvedFitMode();
							_v$3 !== _p$.e && setAttribute(_el$4, "src", _p$.e = _v$3);
							_v$4 !== _p$.t && className(_el$4, _p$.t = _v$4);
							_v$5 !== _p$.a && setAttribute(_el$4, "data-fit-mode", _p$.a = _v$5);
							return _p$;
						}, {
							e: void 0,
							t: void 0,
							a: void 0
						});
						return _el$4;
					})() : (() => {
						var _el$5 = _tmpl$4();
						_el$5.addEventListener("dragstart", (e) => e.preventDefault());
						_el$5.$$contextmenu = handleContextMenu;
						_el$5.addEventListener("error", handleMediaError);
						_el$5.addEventListener("load", handleMediaLoad);
						use(setImageRef, _el$5);
						createRenderEffect((_p$) => {
							var _v$6 = media.url, _v$7 = cleanFilename(media.filename) || getLanguageService().translate("messages.gallery.failedToLoadImage", { type: "image" }), _v$8 = cx(imageClasses(), isLoaded() ? VerticalImageItem_module_default.loaded : VerticalImageItem_module_default.loading), _v$9 = resolvedFitMode();
							_v$6 !== _p$.e && setAttribute(_el$5, "src", _p$.e = _v$6);
							_v$7 !== _p$.t && setAttribute(_el$5, "alt", _p$.t = _v$7);
							_v$8 !== _p$.a && className(_el$5, _p$.a = _v$8);
							_v$9 !== _p$.o && setAttribute(_el$5, "data-fit-mode", _p$.o = _v$9);
							return _p$;
						}, {
							e: void 0,
							t: void 0,
							a: void 0,
							o: void 0
						});
						return _el$5;
					})(),
					memo(() => memo(() => !!isError())() && (() => {
						var _el$6 = _tmpl$5(), _el$7 = _el$6.firstChild, _el$8 = _el$7.nextSibling;
						insert(_el$8, () => getLanguageService().translate("messages.gallery.failedToLoadImage", { type: isVideo ? "video" : "image" }));
						createRenderEffect((_p$) => {
							var _v$0 = VerticalImageItem_module_default.error, _v$1 = VerticalImageItem_module_default.errorIcon, _v$10 = VerticalImageItem_module_default.errorText;
							_v$0 !== _p$.e && className(_el$6, _p$.e = _v$0);
							_v$1 !== _p$.t && className(_el$7, _p$.t = _v$1);
							_v$10 !== _p$.a && className(_el$8, _p$.a = _v$10);
							return _p$;
						}, {
							e: void 0,
							t: void 0,
							a: void 0
						});
						return _el$6;
					})())
				];
			})());
			return _el$;
		})();
	}
	var _tmpl$$3, _tmpl$2$1, _tmpl$3, _tmpl$4, _tmpl$5, FIT_MODE_CLASSES;
	var init_VerticalImageItem = __esmMin((() => {
		init_dev();
		init_service_accessors();
		init_settings_access();
		init_media_utils();
		init_performance();
		init_formatting();
		init_dev$1();
		init_useVideoVisibility();
		init_VerticalImageItem_helpers();
		init_VerticalImageItem_module();
		_tmpl$$3 = /* @__PURE__ */ template(`<div data-xeg-role=gallery-item data-xeg-gallery=true data-xeg-gallery-type=item data-xeg-gallery-version=2.0 data-xeg-component=vertical-image-item data-xeg-block-twitter=true>`), _tmpl$2$1 = /* @__PURE__ */ template(`<div><div>`), _tmpl$3 = /* @__PURE__ */ template(`<video controls>`), _tmpl$4 = /* @__PURE__ */ template(`<img loading=lazy decoding=async>`, true, false, false), _tmpl$5 = /* @__PURE__ */ template(`<div><span>⚠️</span><span>`);
		FIT_MODE_CLASSES = {
			original: VerticalImageItem_module_default.fitOriginal,
			fitHeight: VerticalImageItem_module_default.fitHeight,
			fitWidth: VerticalImageItem_module_default.fitWidth,
			fitContainer: VerticalImageItem_module_default.fitContainer
		};
		delegateEvents([
			"click",
			"keydown",
			"contextmenu"
		]);
	}));
	function VerticalGalleryViewCore({ onClose, className: className$1 = "", onPrevious, onNext, onDownloadCurrent, onDownloadAll }) {
		const mediaItems = createMemo(() => galleryState.value.mediaItems);
		const currentIndex$1 = createMemo(() => galleryState.value.currentIndex);
		const isDownloading = createMemo(() => isDownloadUiBusy({ downloadProcessing: downloadState.value.isProcessing }));
		const [containerEl, setContainerEl] = createSignal(null);
		const [toolbarWrapperEl, setToolbarWrapperEl] = createSignal(null);
		const [itemsContainerEl, setItemsContainerEl] = createSignal(null);
		const isVisible = createMemo(() => mediaItems().length > 0);
		const activeMedia = createMemo(() => {
			return mediaItems()[currentIndex$1()] ?? null;
		});
		const preloadIndices = createMemo(() => {
			const count = getTypedSettingOr("gallery.preloadCount", 0);
			return computePreloadIndices(currentIndex$1(), mediaItems().length, count);
		});
		const { scroll, navigation, focus, toolbar } = useVerticalGallery({
			isVisible,
			currentIndex: currentIndex$1,
			mediaItemsCount: () => mediaItems().length,
			containerEl,
			toolbarWrapperEl,
			itemsContainerEl,
			onClose
		});
		createEffect(() => {
			if (!isVisible() || navigation.lastNavigationTrigger()) return;
			navigateToItem(currentIndex$1(), "click");
		});
		const getInitialFitMode = () => {
			return getTypedSettingOr("gallery.imageFitMode", "fitWidth");
		};
		const [imageFitMode, setImageFitMode] = createSignal(getInitialFitMode());
		const persistFitMode = (mode$1) => setTypedSetting("gallery.imageFitMode", mode$1).catch((error$1) => {
			logger.warn("Failed to save fit mode", {
				error: error$1,
				mode: mode$1
			});
		});
		const applyFitMode = (mode$1, event) => {
			safeEventPrevent(event);
			setImageFitMode(mode$1);
			persistFitMode(mode$1);
			scroll.scrollToCurrentItem();
			navigateToItem(currentIndex$1(), "click");
		};
		const handleDownloadCurrent = () => onDownloadCurrent?.();
		const handleDownloadAll = () => onDownloadAll?.();
		const handleFitOriginal = (event) => applyFitMode("original", event);
		const handleFitWidth = (event) => applyFitMode("fitWidth", event);
		const handleFitHeight = (event) => applyFitMode("fitHeight", event);
		const handleFitContainer = (event) => applyFitMode("fitContainer", event);
		const handlePrevious = () => {
			const current = currentIndex$1();
			if (current > 0) navigateToItem(current - 1, "click");
		};
		const handleNext = () => {
			const current = currentIndex$1();
			if (current < mediaItems().length - 1) navigateToItem(current + 1, "click");
		};
		const handleBackgroundClick = (event) => {
			const target = event.target;
			if (target.closest("[data-role=\"toolbar\"]") || target.closest("[data-role=\"toolbar-hover-zone\"]") || target.closest("[data-gallery-element=\"toolbar\"]") || target.closest("[data-gallery-element]")) return;
			if (target.closest("[data-xeg-role=\"gallery-item\"]")) return;
			if (target.closest("[data-xeg-role=\"scroll-spacer\"]")) return;
			onClose?.();
		};
		const handleMediaItemClick = (index) => {
			const items = mediaItems();
			const current = currentIndex$1();
			if (index >= 0 && index < items.length && index !== current) navigateToItem(index, "click");
		};
		const handleContainerWheel = (event) => {
			const itemsContainer$1 = itemsContainerEl();
			if (!itemsContainer$1) return;
			const target = event.target;
			if (itemsContainer$1.contains(target)) return;
			event.preventDefault();
			event.stopPropagation();
			itemsContainer$1.scrollTop += event.deltaY;
		};
		if (!isVisible() || mediaItems().length === 0) {
			const languageService = getLanguageService();
			const emptyTitle = languageService.translate("messages.gallery.emptyTitle");
			const emptyDesc = languageService.translate("messages.gallery.emptyDescription");
			return (() => {
				var _el$ = _tmpl$$2(), _el$2 = _el$.firstChild, _el$3 = _el$2.firstChild, _el$4 = _el$3.nextSibling;
				insert(_el$3, emptyTitle);
				insert(_el$4, emptyDesc);
				createRenderEffect((_p$) => {
					var _v$ = cx(VerticalGalleryView_module_default.container, VerticalGalleryView_module_default.empty, className$1), _v$2 = VerticalGalleryView_module_default.emptyMessage;
					_v$ !== _p$.e && className(_el$, _p$.e = _v$);
					_v$2 !== _p$.t && className(_el$2, _p$.t = _v$2);
					return _p$;
				}, {
					e: void 0,
					t: void 0
				});
				return _el$;
			})();
		}
		return (() => {
			var _el$5 = _tmpl$2(), _el$6 = _el$5.firstChild, _el$7 = _el$6.nextSibling, _el$8 = _el$7.nextSibling, _el$9 = _el$8.firstChild;
			_el$5.addEventListener("wheel", handleContainerWheel);
			_el$5.$$click = handleBackgroundClick;
			use((el) => setContainerEl(el ?? null), _el$5);
			use((el) => setToolbarWrapperEl(el ?? null), _el$7);
			insert(_el$7, createComponent(Toolbar, {
				currentIndex: currentIndex$1,
				get focusedIndex() {
					return focus.focusedIndex;
				},
				totalCount: () => mediaItems().length,
				isDownloading,
				get currentFitMode() {
					return imageFitMode();
				},
				tweetText: () => activeMedia()?.tweetText,
				tweetTextHTML: () => activeMedia()?.tweetTextHTML,
				get className() {
					return VerticalGalleryView_module_default.toolbar || "";
				},
				handlers: {
					navigation: {
						onPrevious: onPrevious || handlePrevious,
						onNext: onNext || handleNext
					},
					download: {
						onDownloadCurrent: handleDownloadCurrent,
						onDownloadAll: handleDownloadAll
					},
					fitMode: {
						onFitOriginal: handleFitOriginal,
						onFitWidth: handleFitWidth,
						onFitHeight: handleFitHeight,
						onFitContainer: handleFitContainer
					},
					lifecycle: {
						onClose: onClose || (() => {}),
						onOpenSettings: () => logger.debug("[VerticalGalleryView] Settings opened")
					}
				}
			}));
			use((el) => setItemsContainerEl(el ?? null), _el$8);
			insert(_el$8, createComponent(For, {
				get each() {
					return mediaItems();
				},
				children: (item, index) => {
					const actualIndex = index();
					return createComponent(VerticalImageItem, mergeProps({
						media: item,
						index: actualIndex,
						get isActive() {
							return actualIndex === currentIndex$1();
						},
						get isFocused() {
							return actualIndex === focus.focusedIndex();
						},
						forceVisible: preloadIndices().includes(actualIndex),
						fitMode: imageFitMode,
						onClick: () => handleMediaItemClick(actualIndex),
						get className() {
							return cx(VerticalGalleryView_module_default.galleryItem, actualIndex === currentIndex$1() && VerticalGalleryView_module_default.itemActive);
						},
						"data-index": actualIndex,
						"data-xeg-role": "gallery-item",
						registerContainer: (element) => focus.registerItem(actualIndex, element)
					}, onDownloadCurrent ? { onDownload: handleDownloadCurrent } : {}, { onFocus: () => focus.handleItemFocus(actualIndex) }));
				}
			}), _el$9);
			createRenderEffect((_p$) => {
				var _v$3 = cx(VerticalGalleryView_module_default.container, toolbar.isInitialToolbarVisible() && VerticalGalleryView_module_default.initialToolbarVisible, scroll.isScrolling() && VerticalGalleryView_module_default.isScrolling, className$1), _v$4 = VerticalGalleryView_module_default.toolbarHoverZone, _v$5 = VerticalGalleryView_module_default.toolbarWrapper, _v$6 = VerticalGalleryView_module_default.itemsContainer, _v$7 = VerticalGalleryView_module_default.scrollSpacer;
				_v$3 !== _p$.e && className(_el$5, _p$.e = _v$3);
				_v$4 !== _p$.t && className(_el$6, _p$.t = _v$4);
				_v$5 !== _p$.a && className(_el$7, _p$.a = _v$5);
				_v$6 !== _p$.o && className(_el$8, _p$.o = _v$6);
				_v$7 !== _p$.i && className(_el$9, _p$.i = _v$7);
				return _p$;
			}, {
				e: void 0,
				t: void 0,
				a: void 0,
				o: void 0,
				i: void 0
			});
			return _el$5;
		})();
	}
	var _tmpl$$2, _tmpl$2, VerticalGalleryView;
	var init_VerticalGalleryView = __esmMin((() => {
		init_dev();
		init_Toolbar();
		init_service_accessors();
		init_settings_access();
		init_logging();
		init_download_signals();
		init_gallery_signals();
		init_download_ui_state();
		init_utils$1();
		init_performance();
		init_formatting();
		init_dev$1();
		init_useVerticalGallery();
		init_VerticalGalleryView_module();
		init_VerticalImageItem();
		_tmpl$$2 = /* @__PURE__ */ template(`<div><div><h3></h3><p>`), _tmpl$2 = /* @__PURE__ */ template(`<div data-xeg-gallery=true data-xeg-role=gallery><div data-role=toolbar-hover-zone></div><div data-role=toolbar></div><div data-xeg-role=items-container data-xeg-role-compat=items-list><div aria-hidden=true data-xeg-role=scroll-spacer>`);
		VerticalGalleryView = VerticalGalleryViewCore;
		delegateEvents(["click"]);
	}));
	function GalleryContainer({ children: children$1, onClose, className: className$1, registerEscapeListener }) {
		const classes = cx("xeg-gallery-overlay", "xeg-gallery-container", className$1);
		const hasCloseHandler = typeof onClose === "function";
		const escapeListener = (event) => {
			if (!hasCloseHandler) return;
			const keyboardEvent = event;
			if (keyboardEvent.key === "Escape") {
				keyboardEvent.preventDefault();
				keyboardEvent.stopPropagation();
				onClose?.();
			}
		};
		if (hasCloseHandler && registerEscapeListener && typeof window !== "undefined") {
			const captureWindow = window;
			captureWindow[ESCAPE_LISTENER_STORAGE_KEY] = escapeListener;
			registerEscapeListener(escapeListener);
		}
		createEffect(() => {
			if (!hasCloseHandler) return;
			const eventManager = EventManager.getInstance();
			const listenerId = eventManager.addListener(document, "keydown", escapeListener);
			onCleanup(() => {
				eventManager.removeListener(listenerId);
			});
		});
		return (() => {
			var _el$ = _tmpl$$1();
			className(_el$, classes);
			insert(_el$, children$1);
			return _el$;
		})();
	}
	var _tmpl$$1, ESCAPE_LISTENER_STORAGE_KEY;
	var init_GalleryContainer = __esmMin((() => {
		init_dev();
		init_event_manager();
		init_formatting();
		init_dev$1();
		_tmpl$$1 = /* @__PURE__ */ template(`<div data-xeg-gallery-container>`);
		ESCAPE_LISTENER_STORAGE_KEY = "__xegCapturedEscapeListener";
	}));
	var init_isolation = __esmMin((() => {
		init_GalleryContainer();
	}));
	var NotificationService;
	var init_notification_service = __esmMin((() => {
		init_logging();
		init_singleton();
		NotificationService = class NotificationService {
			static singleton = createSingleton(() => new NotificationService());
			constructor() {}
			static getInstance() {
				return NotificationService.singleton.get();
			}
			static resetForTests() {
				NotificationService.singleton.reset();
			}
			gmNotify(options) {
				const gm = globalThis.GM_notification;
				if (!gm) return;
				try {
					const details = { title: options.title };
					if (typeof options.text !== "undefined") details.text = options.text;
					if (typeof options.image !== "undefined") details.image = options.image;
					if (typeof options.timeout !== "undefined") details.timeout = options.timeout;
					if (typeof options.onclick === "function") details.onclick = options.onclick;
					gm(details, void 0);
				} catch (e) {
					logger.warn("[NotificationService] GM_notification failed (silent lean mode)", e);
				}
			}
			async show(options) {
				if (globalThis.GM_notification) {
					this.gmNotify(options);
					logger.debug(`Notification (gm): ${options.title}`);
				} else logger.debug(`Notification skipped (no GM_notification): ${options.title}`);
			}
			async error(title, text, timeout = 5e3) {
				await this.show({
					title,
					text: text ?? "An error occurred.",
					timeout
				});
			}
		};
	}));
	function stringifyError(error$1) {
		if (error$1 instanceof Error && error$1.message) return error$1.message;
		try {
			return String(error$1);
		} catch {
			return "Unknown error";
		}
	}
	function translateError(error$1) {
		try {
			const languageService = getLanguageService();
			return {
				title: languageService.translate("messages.errorBoundary.title"),
				body: languageService.translate("messages.errorBoundary.body", { error: stringifyError(error$1) })
			};
		} catch {
			return {
				title: "Unexpected error",
				body: stringifyError(error$1)
			};
		}
	}
	function ErrorBoundary(props) {
		let lastReportedError;
		const [caughtError, setCaughtError] = createSignal(void 0);
		const [boundaryMounted, setBoundaryMounted] = createSignal(true);
		const notifyError = (error$1) => {
			if (lastReportedError === error$1) return;
			lastReportedError = error$1;
			try {
				const copy = translateError(error$1);
				NotificationService.getInstance().error(copy.title, copy.body);
			} catch {}
		};
		const handleRetry = () => {
			lastReportedError = void 0;
			setCaughtError(void 0);
			setBoundaryMounted(false);
			queueMicrotask(() => setBoundaryMounted(true));
		};
		const renderFallback = (error$1) => {
			let title = "Unexpected error";
			let body$1 = stringifyError(error$1);
			try {
				const copy = translateError(error$1);
				title = copy.title;
				body$1 = copy.body;
			} catch {}
			return (() => {
				var _el$ = _tmpl$(), _el$2 = _el$.firstChild, _el$3 = _el$2.nextSibling, _el$4 = _el$3.nextSibling;
				insert(_el$2, title);
				insert(_el$3, body$1);
				_el$4.$$click = handleRetry;
				return _el$;
			})();
		};
		return [createComponent(Show, {
			get when() {
				return boundaryMounted();
			},
			get children() {
				return createComponent(ErrorBoundary$1, {
					fallback: (boundaryError) => {
						notifyError(boundaryError);
						setCaughtError(boundaryError);
						return null;
					},
					get children() {
						return props.children;
					}
				});
			}
		}), createComponent(Show, {
			get when() {
				return caughtError();
			},
			children: (error$1) => renderFallback(error$1())
		})];
	}
	var _tmpl$;
	var init_ErrorBoundary = __esmMin((() => {
		init_dev();
		init_service_accessors();
		init_notification_service();
		init_dev$1();
		_tmpl$ = /* @__PURE__ */ template(`<div role=alert data-xeg-error-boundary aria-live=polite><p class=xeg-error-boundary__title></p><p class=xeg-error-boundary__body></p><button type=button class=xeg-error-boundary__action>Retry`);
		delegateEvents(["click"]);
	}));
	function resolveRoot(root) {
		if (root && typeof root.querySelectorAll === "function") return root;
		return typeof document !== "undefined" && typeof document.querySelectorAll === "function" ? document : null;
	}
	function isVideoPlaying(video$1) {
		try {
			return !video$1.paused && !video$1.ended;
		} catch {
			return false;
		}
	}
	function shouldPauseVideo(video$1, force = false) {
		return video$1 instanceof HTMLVideoElement && !isGalleryInternalElement(video$1) && video$1.isConnected && (force || isVideoPlaying(video$1));
	}
	function tryPauseVideo(video$1) {
		try {
			video$1.pause?.();
			return true;
		} catch (error$1) {
			logger.debug("[AmbientVideo] Failed to pause Twitter video", { error: error$1 });
			return false;
		}
	}
	function pauseActiveTwitterVideos(options = {}) {
		const root = resolveRoot(options.root ?? null);
		if (!root) return ZERO_RESULT;
		const videos = Array.from(root.querySelectorAll("video"));
		const inspectedCount = videos.length;
		if (inspectedCount === 0) return ZERO_RESULT;
		let pausedCount = 0;
		let totalCandidates = 0;
		for (const video$1 of videos) {
			if (!shouldPauseVideo(video$1, options.force)) continue;
			totalCandidates += 1;
			if (tryPauseVideo(video$1)) pausedCount += 1;
		}
		const result = {
			pausedCount,
			totalCandidates,
			skippedCount: inspectedCount - pausedCount
		};
		if (result.pausedCount > 0) logger.debug("[AmbientVideo] Ambient Twitter videos paused", {
			...result,
			inspected: inspectedCount
		});
		return result;
	}
	var ZERO_RESULT;
	var init_twitter_video_pauser = __esmMin((() => {
		init_utils();
		init_logging();
		ZERO_RESULT = Object.freeze({
			pausedCount: 0,
			totalCandidates: 0,
			skippedCount: 0
		});
	}));
	function findTweetContainer(element) {
		if (!element) return null;
		for (const selector of STABLE_SELECTORS.TWEET_CONTAINERS) try {
			const container$2 = element.closest(selector);
			if (container$2 instanceof HTMLElement) return container$2;
		} catch {}
		return null;
	}
	function resolvePauseContext(request) {
		if (request.root !== void 0) return {
			root: request.root ?? null,
			scope: "custom"
		};
		if (findTweetContainer(request.sourceElement)) return {
			root: null,
			scope: "tweet"
		};
		return {
			root: null,
			scope: "document"
		};
	}
	function isVideoTriggerElement(element) {
		if (!element) return false;
		if (element.tagName === "VIDEO") return true;
		for (const selector of VIDEO_TRIGGER_SCOPES) try {
			if (element.matches(selector) || element.closest(selector)) return true;
		} catch {}
		return false;
	}
	function isImageTriggerElement(element) {
		if (!element) return false;
		if (element.tagName === "IMG") return true;
		for (const selector of IMAGE_TRIGGER_SCOPES) try {
			if (element.matches(selector) || element.closest(selector)) return true;
		} catch {}
		return false;
	}
	function inferAmbientVideoTrigger(element) {
		if (isVideoTriggerElement(element)) return "video-click";
		if (isImageTriggerElement(element)) return "image-click";
		return "unknown";
	}
	function pauseAmbientVideosForGallery(request = {}) {
		const trigger = request.trigger ?? inferAmbientVideoTrigger(request.sourceElement);
		const force = request.force ?? true;
		const reason = request.reason ?? trigger;
		const { root, scope } = resolvePauseContext(request);
		let result;
		try {
			result = pauseActiveTwitterVideos({
				root,
				force
			});
		} catch (error$1) {
			logger.warn("[AmbientVideoCoordinator] Failed to pause ambient videos", {
				error: error$1,
				trigger
			});
			return {
				...PAUSE_RESULT_DEFAULT,
				trigger,
				forced: force,
				reason,
				scope
			};
		}
		if (result.totalCandidates > 0 || result.pausedCount > 0) logger.debug("[AmbientVideoCoordinator] Ambient videos paused", {
			...result,
			reason,
			trigger,
			forced: force,
			scope
		});
		return {
			...result,
			trigger,
			forced: force,
			reason,
			scope
		};
	}
	var VIDEO_TRIGGER_SCOPES, IMAGE_TRIGGER_SCOPES, PAUSE_RESULT_DEFAULT;
	var init_ambient_video_coordinator = __esmMin((() => {
		init_selectors();
		init_logging();
		init_twitter_video_pauser();
		VIDEO_TRIGGER_SCOPES = new Set([SELECTORS.VIDEO_PLAYER, ...STABLE_SELECTORS.VIDEO_CONTAINERS]);
		IMAGE_TRIGGER_SCOPES = new Set([SELECTORS.TWEET_PHOTO, ...STABLE_SELECTORS.IMAGE_CONTAINERS]);
		PAUSE_RESULT_DEFAULT = Object.freeze({
			pausedCount: 0,
			totalCandidates: 0,
			skippedCount: 0
		});
	}));
	var init_gallery_global = __esmMin((() => {}));
	var GalleryRenderer;
	var init_GalleryRenderer$1 = __esmMin((() => {
		init_preload_helper();
		init_dev();
		init_VerticalGalleryView();
		init_isolation();
		init_ErrorBoundary();
		init_service_accessors();
		init_userscript();
		init_logging();
		init_download_signals();
		init_gallery_signals();
		init_ui_state();
		init_ambient_video_coordinator();
		init_dev$1();
		init_gallery_global();
		GalleryRenderer = class {
			container = null;
			isRenderingFlag = false;
			stateUnsubscribe = null;
			onCloseCallback;
			disposeApp = null;
			constructor() {
				this.setupStateSubscription();
			}
			setOnCloseCallback(onClose) {
				this.onCloseCallback = onClose;
			}
			setupStateSubscription() {
				this.stateUnsubscribe = gallerySignals.isOpen.subscribe((isOpen) => {
					if (isOpen && !this.container) this.renderGallery();
					else if (!isOpen && this.container) this.cleanupGallery();
				});
			}
			renderGallery() {
				if (this.isRenderingFlag || this.container) return;
				const { isOpen, mediaItems } = gallerySignals;
				if (!isOpen.value || mediaItems.value.length === 0) return;
				this.isRenderingFlag = true;
				logger.info("[GalleryRenderer] Rendering started");
				try {
					this.createContainer();
					this.renderComponent();
					logger.debug("[GalleryRenderer] Component rendering complete");
				} catch (error$1) {
					logger.error("[GalleryRenderer] Rendering failed:", error$1);
					setError("Gallery rendering failed");
				} finally {
					this.isRenderingFlag = false;
				}
			}
			createContainer() {
				this.cleanupContainer();
				this.container = document.createElement("div");
				this.container.className = "xeg-gallery-renderer";
				this.container.setAttribute("data-renderer", "gallery");
				document.body.appendChild(this.container);
			}
			renderComponent() {
				if (!this.container) return;
				const themeService = getThemeService();
				const languageService = getLanguageService();
				const handleClose = () => {
					closeGallery();
					this.onCloseCallback?.();
				};
				const handleDownload = (type) => this.handleDownload(type);
				const Root = () => {
					const [currentTheme, setCurrentTheme] = createSignal(themeService.getCurrentTheme());
					const [currentLanguage, setCurrentLanguage] = createSignal(languageService.getCurrentLanguage());
					createEffect(() => {
						const unbindTheme = themeService.onThemeChange((_, setting$1) => setCurrentTheme(setting$1));
						const unbindLanguage = languageService.onLanguageChange((lang) => setCurrentLanguage(lang));
						onCleanup(() => {
							unbindTheme();
							unbindLanguage();
						});
					});
					return createComponent(GalleryContainer, {
						onClose: handleClose,
						className: "xeg-gallery-renderer xeg-gallery-root xeg-theme-scope",
						get ["data-theme"]() {
							return currentTheme();
						},
						get ["data-language"]() {
							return currentLanguage();
						},
						get children() {
							return createComponent(ErrorBoundary, { get children() {
								return createComponent(VerticalGalleryView, {
									onClose: handleClose,
									onPrevious: () => navigatePrevious("button"),
									onNext: () => navigateNext("button"),
									onDownloadCurrent: () => handleDownload("current"),
									onDownloadAll: () => handleDownload("all"),
									className: "xeg-vertical-gallery"
								});
							} });
						}
					});
				};
				this.disposeApp = render(() => createComponent(Root, {}), this.container);
				logger.info("[GalleryRenderer] Gallery mounted");
			}
			async handleDownload(type) {
				logger.info(`[GalleryRenderer] handleDownload called with type: ${type}`);
				if (!isGMAPIAvailable("download")) {
					logger.warn("[GalleryRenderer] GM_download not available");
					setError("Tampermonkey required for downloads.");
					return;
				}
				if (isDownloadLocked()) return;
				const releaseLock = acquireDownloadLock();
				try {
					const mediaItems = gallerySignals.mediaItems.value;
					const downloadService = await this.getDownloadService();
					if (type === "current") {
						const currentMedia = mediaItems[gallerySignals.currentIndex.value];
						if (currentMedia) {
							const result = await downloadService.downloadSingle(currentMedia);
							if (!result.success) setError(result.error || "Download failed.");
						}
					} else {
						const result = await downloadService.downloadBulk([...mediaItems]);
						if (!result.success) setError(result.error || "Download failed.");
					}
				} catch (error$1) {
					logger.error(`[GalleryRenderer] ${type} download failed:`, error$1);
					setError("Download failed.");
				} finally {
					releaseLock();
				}
			}
			async getDownloadService() {
				const { ensureDownloadServiceRegistered: ensureDownloadServiceRegistered$1 } = await __vitePreload(async () => {
					const { ensureDownloadServiceRegistered: ensureDownloadServiceRegistered$2 } = await Promise.resolve().then(() => (init_lazy_services(), lazy_services_exports));
					return { ensureDownloadServiceRegistered: ensureDownloadServiceRegistered$2 };
				}, void 0);
				await ensureDownloadServiceRegistered$1();
				const { DownloadOrchestrator: DownloadOrchestrator$1 } = await __vitePreload(async () => {
					const { DownloadOrchestrator: DownloadOrchestrator$2 } = await Promise.resolve().then(() => (init_download_orchestrator(), download_orchestrator_exports));
					return { DownloadOrchestrator: DownloadOrchestrator$2 };
				}, void 0);
				return DownloadOrchestrator$1.getInstance();
			}
			cleanupGallery() {
				logger.debug("[GalleryRenderer] Cleanup started");
				this.isRenderingFlag = false;
				this.cleanupContainer();
			}
			cleanupContainer() {
				if (this.container) {
					try {
						this.disposeApp?.();
						this.disposeApp = null;
						if (document.contains(this.container)) this.container.remove();
					} catch (error$1) {
						logger.warn("[GalleryRenderer] Container cleanup failed:", error$1);
					}
					this.container = null;
				}
			}
			async render(mediaItems, renderOptions) {
				const pauseContext = renderOptions?.pauseContext ?? { reason: "programmatic" };
				try {
					pauseAmbientVideosForGallery(pauseContext);
				} catch (error$1) {
					logger.warn("[GalleryRenderer] Ambient video pause failed", { error: error$1 });
				}
				openGallery(mediaItems, renderOptions?.startIndex ?? 0);
			}
			close() {
				closeGallery();
			}
			isRendering() {
				return this.isRenderingFlag;
			}
			destroy() {
				logger.info("[GalleryRenderer] Full cleanup started");
				this.stateUnsubscribe?.();
				this.cleanupGallery();
			}
		};
	}));
	var GalleryRenderer_exports = /* @__PURE__ */ __export({ GalleryRenderer: () => GalleryRenderer }, 1);
	var init_GalleryRenderer = __esmMin((() => {
		init_GalleryRenderer$1();
	}));
	function isSafeKey(key) {
		return !FORBIDDEN_KEYS.has(key);
	}
	function resolveNestedPath(source, path) {
		if (!source || typeof source !== "object" || !path) return;
		const keys = path.split(".");
		let current = source;
		for (const key of keys) {
			if (!isSafeKey(key)) return;
			if (current === null || current === void 0 || typeof current !== "object") return;
			current = current[key];
		}
		return current;
	}
	function assignNestedPath(target, path, value, options) {
		if (!target || typeof target !== "object" || !path) return false;
		const keys = path.split(".");
		if (keys.length === 0) return false;
		for (const key of keys) if (!isSafeKey(key)) return false;
		const createIntermediate = options?.createIntermediate !== false;
		let current = target;
		for (let i = 0; i < keys.length - 1; i++) {
			const key = keys[i];
			if (!key || !isSafeKey(key)) continue;
			const descriptor = Object.getOwnPropertyDescriptor(current, key);
			const hasOwnKey = descriptor !== void 0;
			const existingValue = hasOwnKey ? descriptor.value : void 0;
			if (!hasOwnKey || typeof existingValue !== "object" || existingValue === null) {
				if (!createIntermediate) return false;
				const newObj = Object.create(null);
				Object.defineProperty(current, key, {
					value: newObj,
					writable: true,
					enumerable: true,
					configurable: true
				});
				current = newObj;
			} else current = existingValue;
		}
		const lastKey = keys[keys.length - 1];
		if (lastKey && isSafeKey(lastKey)) {
			Object.defineProperty(current, lastKey, {
				value,
				writable: true,
				enumerable: true,
				configurable: true
			});
			return true;
		}
		return false;
	}
	var FORBIDDEN_KEYS;
	var init_object_path = __esmMin((() => {
		FORBIDDEN_KEYS = new Set([
			"__proto__",
			"constructor",
			"prototype"
		]);
	}));
	function pruneWithTemplate(input, template$1) {
		if (!isRecord(input)) return {};
		const out = {};
		for (const key of Object.keys(template$1)) {
			const tplVal = template$1[key];
			const inVal = input[key];
			if (inVal === void 0) continue;
			if (isRecord(tplVal) && !Array.isArray(tplVal)) out[key] = pruneWithTemplate(inVal, tplVal);
			else out[key] = inVal;
		}
		return out;
	}
	function fillWithDefaults(settings) {
		const pruned = pruneWithTemplate(settings, DEFAULT_SETTINGS);
		const categories = {
			gallery: DEFAULT_SETTINGS.gallery,
			toolbar: DEFAULT_SETTINGS.toolbar,
			download: DEFAULT_SETTINGS.download,
			tokens: DEFAULT_SETTINGS.tokens,
			accessibility: DEFAULT_SETTINGS.accessibility,
			features: DEFAULT_SETTINGS.features
		};
		const merged = {
			...DEFAULT_SETTINGS,
			...pruned
		};
		for (const [key, defaults] of Object.entries(categories)) merged[key] = {
			...defaults,
			...pruned[key] ?? {}
		};
		return {
			...merged,
			version: DEFAULT_SETTINGS.version,
			lastModified: Date.now()
		};
	}
	function migrateSettings(input) {
		let working = { ...input };
		const currentVersion = input.version;
		const mig = migrations[currentVersion];
		if (typeof mig === "function") try {
			working = mig(working);
		} catch {}
		return fillWithDefaults(working);
	}
	var migrations;
	var init_settings_migration = __esmMin((() => {
		init_constants$1();
		init_guards();
		migrations = { "1.0.0": (input) => {
			const next = { ...input };
			next.gallery = {
				...next.gallery,
				enableKeyboardNav: true
			};
			return next;
		} };
	}));
	function computeHash(input) {
		const str = JSON.stringify(input);
		let hash = 0;
		for (let i = 0; i < str.length; i++) {
			const char = str.charCodeAt(i);
			hash = (hash << 5) - hash + char;
			hash = hash & hash;
		}
		return Math.abs(hash).toString(16);
	}
	function computeSettingsSchemaHashFrom(obj) {
		const filtered = obj && typeof obj === "object" ? obj : {};
		return computeHash(JSON.stringify(filtered, (key, value) => key === "__schemaHash" ? void 0 : value));
	}
	function computeCurrentSettingsSchemaHash() {
		return computeSettingsSchemaHashFrom(DEFAULT_SETTINGS);
	}
	var init_settings_schema = __esmMin((() => {
		init_constants$1();
	}));
	var PersistentSettingsRepository;
	var init_settings_repository = __esmMin((() => {
		init_constants$1();
		init_logging();
		init_persistent_storage();
		init_safety$1();
		init_settings_migration();
		init_settings_schema();
		PersistentSettingsRepository = class {
			storage = getPersistentStorage();
			schemaHash = computeCurrentSettingsSchemaHash();
			async load() {
				try {
					const stored = await this.storage.get(APP_SETTINGS_STORAGE_KEY);
					if (!stored) {
						const defaults = createDefaultSettings();
						await this.persist(defaults);
						return cloneDeep(defaults);
					}
					const migrated = migrateSettings(stored);
					if (stored.__schemaHash !== this.schemaHash) await this.persist(migrated);
					return cloneDeep(migrated);
				} catch (error$1) {
					logger.warn("[SettingsRepository] load failed, falling back to defaults", error$1);
					const defaults = createDefaultSettings();
					await this.persist(defaults);
					return cloneDeep(defaults);
				}
			}
			async save(settings) {
				try {
					await this.persist(settings);
				} catch (error$1) {
					logger.error("[SettingsRepository] save failed", error$1);
					throw error$1;
				}
			}
			async persist(settings) {
				await this.storage.set(APP_SETTINGS_STORAGE_KEY, {
					...settings,
					__schemaHash: this.schemaHash
				});
			}
		};
	}));
	var settings_service_exports = /* @__PURE__ */ __export({ SettingsService: () => SettingsService }, 1);
	function normalizeFeatureFlags(features) {
		return Object.keys(FEATURE_DEFAULTS).reduce((acc, key) => {
			const candidate = features?.[key];
			acc[key] = typeof candidate === "boolean" ? candidate : FEATURE_DEFAULTS[key];
			return acc;
		}, {});
	}
	var FEATURE_DEFAULTS, SettingsService;
	var init_settings_service = __esmMin((() => {
		init_constants$1();
		init_logging();
		init_lifecycle();
		init_object_path();
		init_safety$1();
		init_singleton();
		init_settings_migration();
		init_settings_repository();
		FEATURE_DEFAULTS = Object.freeze({ ...DEFAULT_SETTINGS.features });
		SettingsService = class SettingsService {
			lifecycle;
			static singleton = createSingleton(() => new SettingsService());
			static getInstance() {
				return SettingsService.singleton.get();
			}
			static resetForTests() {
				SettingsService.singleton.reset();
			}
			settings = createDefaultSettings();
			featureMap = normalizeFeatureFlags(this.settings.features);
			listeners = /* @__PURE__ */ new Set();
			constructor(repository = new PersistentSettingsRepository()) {
				this.repository = repository;
				this.lifecycle = createLifecycle("SettingsService", {
					onInitialize: () => this.onInitialize(),
					onDestroy: () => this.onDestroy()
				});
			}
			async initialize() {
				return this.lifecycle.initialize();
			}
			destroy() {
				this.lifecycle.destroy();
			}
			isInitialized() {
				return this.lifecycle.isInitialized();
			}
			async onInitialize() {
				this.settings = await this.repository.load();
				this.refreshFeatureMap();
			}
			onDestroy() {
				this.listeners.clear();
				this.repository.save(this.settings);
			}
			getAllSettings() {
				this.assertInitialized();
				return cloneDeep(this.settings);
			}
			get(key) {
				this.assertInitialized();
				const value = resolveNestedPath(this.settings, key);
				return value === void 0 ? this.getDefaultValue(key) : value;
			}
			async set(key, value) {
				this.assertInitialized();
				if (!this.isValid(key, value)) throw new Error(`Invalid setting value for ${key}`);
				const oldValue = this.get(key);
				assignNestedPath(this.settings, key, value);
				this.settings.lastModified = Date.now();
				this.refreshFeatureMap();
				this.notifyListeners({
					key,
					oldValue,
					newValue: value,
					timestamp: Date.now(),
					status: "success"
				});
				await this.persist();
			}
			async updateBatch(updates) {
				this.assertInitialized();
				const entries = Object.entries(updates);
				for (const [key, value] of entries) if (!this.isValid(key, value)) throw new Error(`Invalid setting value for ${key}`);
				const timestamp = Date.now();
				entries.forEach(([key, value]) => {
					const oldValue = this.get(key);
					assignNestedPath(this.settings, key, value);
					this.notifyListeners({
						key,
						oldValue,
						newValue: value,
						timestamp,
						status: "success"
					});
				});
				this.settings.lastModified = timestamp;
				this.refreshFeatureMap();
				await this.persist();
			}
			async resetToDefaults(category) {
				this.assertInitialized();
				const previous = this.getAllSettings();
				if (!category) this.settings = createDefaultSettings();
				else if (category in DEFAULT_SETTINGS) this.settings[category] = cloneDeep(DEFAULT_SETTINGS[category]);
				this.settings.lastModified = Date.now();
				this.refreshFeatureMap();
				this.notifyListeners({
					key: category ?? "all",
					oldValue: previous,
					newValue: this.getAllSettings(),
					timestamp: Date.now(),
					status: "success"
				});
				await this.persist();
			}
			subscribe(listener) {
				this.listeners.add(listener);
				return () => {
					this.listeners.delete(listener);
				};
			}
			exportSettings() {
				this.assertInitialized();
				return JSON.stringify(this.settings, null, 2);
			}
			async importSettings(jsonString) {
				this.assertInitialized();
				try {
					const imported = JSON.parse(jsonString);
					if (!imported || typeof imported !== "object") throw new Error("Invalid settings");
					const previous = this.getAllSettings();
					this.settings = migrateSettings(imported);
					this.settings.lastModified = Date.now();
					this.refreshFeatureMap();
					this.notifyListeners({
						key: "all",
						oldValue: previous,
						newValue: this.getAllSettings(),
						timestamp: Date.now(),
						status: "success"
					});
					await this.persist();
				} catch (error$1) {
					logger.error("Settings import failed:", error$1);
					throw error$1;
				}
			}
			getFeatureMap() {
				this.assertInitialized();
				return Object.freeze({ ...this.featureMap });
			}
			refreshFeatureMap() {
				this.featureMap = normalizeFeatureFlags(this.settings.features);
			}
			async persist() {
				await this.repository.save(this.settings);
			}
			isValid(key, value) {
				const def = this.getDefaultValue(key);
				if (def === void 0) return true;
				const type = Array.isArray(def) ? "array" : typeof def;
				if (type === "array") return Array.isArray(value);
				if (type === "object") return typeof value === "object" && value !== null;
				return typeof value === type;
			}
			getDefaultValue(key) {
				return resolveNestedPath(DEFAULT_SETTINGS, key);
			}
			notifyListeners(event) {
				this.listeners.forEach((listener) => {
					try {
						listener(event);
					} catch (error$1) {
						logger.error("Settings listener error:", error$1);
					}
				});
			}
			assertInitialized() {
				if (!this.isInitialized()) throw new Error("SettingsService must be initialized before use");
			}
		};
	}));
	function ensureGuardEffect() {
		if (guardDispose) return;
		guardDispose = effectSafe(() => {
			if (!gallerySignals.isOpen.value) return;
			const result = pauseAmbientVideosForGallery({
				trigger: "guard",
				reason: "guard"
			});
			if (result.pausedCount > 0) logger.debug("[AmbientVideoGuard] Ambient pause triggered by guard", result);
		});
	}
	function startAmbientVideoGuard() {
		guardSubscribers += 1;
		ensureGuardEffect();
		return () => {
			stopAmbientVideoGuard();
		};
	}
	function stopAmbientVideoGuard() {
		if (guardSubscribers === 0) return;
		guardSubscribers -= 1;
		if (guardSubscribers > 0) return;
		guardDispose?.();
		guardDispose = null;
	}
	function withAmbientVideoGuard() {
		return { dispose: startAmbientVideoGuard() };
	}
	var guardDispose, guardSubscribers;
	var init_ambient_video_guard = __esmMin((() => {
		init_logging();
		init_gallery_signals();
		init_signal_factory();
		init_ambient_video_coordinator();
		guardDispose = null;
		guardSubscribers = 0;
	}));
	function getCurrentGalleryVideo(video$1) {
		if (video$1) return video$1;
		const signaled = gallerySignals.currentVideoElement.value;
		if (signaled instanceof HTMLVideoElement) return signaled;
		try {
			const doc = typeof document !== "undefined" ? document : globalThis.document;
			if (!(doc instanceof Document)) return null;
			const hostSelectors = [
				CSS.SELECTORS.DATA_GALLERY,
				CSS.SELECTORS.ROOT,
				CSS.SELECTORS.CONTAINER,
				CSS.SELECTORS.DATA_CONTAINER
			];
			let container$2 = null;
			for (const selector of hostSelectors) {
				const match = doc.querySelector(selector);
				if (match) {
					container$2 = match;
					break;
				}
			}
			if (!container$2) return null;
			const items = container$2.querySelector("[data-xeg-role=\"items-container\"]");
			if (!items) return null;
			const index = gallerySignals.currentIndex.value;
			const target = items.children?.[index];
			if (!target) return null;
			const fallbackVideo = target.querySelector("video");
			return fallbackVideo instanceof HTMLVideoElement ? fallbackVideo : null;
		} catch (error$1) {
			logger.debug("Failed to get current gallery video:", error$1);
			return null;
		}
	}
	function executeVideoControl(action, options = {}) {
		const { video: video$1, context } = options;
		try {
			const videoElement = getCurrentGalleryVideo(video$1);
			if (!videoElement) {
				logger.debug("[VideoControl] No video element found", {
					action,
					context
				});
				return;
			}
			switch (action) {
				case "play":
					videoElement.play?.().catch(() => {
						logger.debug("[VideoControl] Play failed", { context });
					});
					videoPlaybackStateMap.set(videoElement, { playing: true });
					break;
				case "pause":
					videoElement.pause?.();
					videoPlaybackStateMap.set(videoElement, { playing: false });
					break;
				case "togglePlayPause": {
					const next = !(videoPlaybackStateMap.get(videoElement)?.playing ?? !videoElement.paused);
					if (next) videoElement.play?.().catch(() => {
						logger.debug("[VideoControl] Play failed during toggle", { context });
					});
					else videoElement.pause?.();
					videoPlaybackStateMap.set(videoElement, { playing: next });
					break;
				}
				case "volumeUp": {
					const newVolume = Math.min(1, Math.round((videoElement.volume + .1) * 100) / 100);
					videoElement.volume = newVolume;
					if (newVolume > 0 && videoElement.muted) videoElement.muted = false;
					break;
				}
				case "volumeDown": {
					const newVolume = Math.max(0, Math.round((videoElement.volume - .1) * 100) / 100);
					videoElement.volume = newVolume;
					if (newVolume === 0 && !videoElement.muted) videoElement.muted = true;
					break;
				}
				case "mute":
					videoElement.muted = true;
					break;
				case "toggleMute":
					videoElement.muted = !videoElement.muted;
					break;
			}
			logger.debug("[VideoControl] Action executed", {
				action,
				context,
				method: "video-element"
			});
		} catch (error$1) {
			logger.error("[VideoControl] Unexpected error", {
				error: error$1,
				action,
				context
			});
		}
	}
	var videoPlaybackStateMap;
	var init_video_control_helper = __esmMin((() => {
		init_constants$1();
		init_logging();
		init_gallery_signals();
		videoPlaybackStateMap = /* @__PURE__ */ new WeakMap();
	}));
	function shouldExecuteKeyboardAction(key, minInterval = 100) {
		const now = Date.now();
		const timeSinceLastExecution = now - debounceState.lastExecutionTime;
		if (key === debounceState.lastKey && timeSinceLastExecution < minInterval) {
			logger.debug(`[Keyboard Debounce] Blocked ${key} (${timeSinceLastExecution}ms < ${minInterval}ms)`);
			return false;
		}
		debounceState.lastExecutionTime = now;
		debounceState.lastKey = key;
		return true;
	}
	function shouldExecuteVideoControlKey(key) {
		if (![
			"ArrowUp",
			"ArrowDown",
			"m",
			"M"
		].includes(key)) return true;
		return shouldExecuteKeyboardAction(key, 100);
	}
	function shouldExecutePlayPauseKey(key) {
		if (key !== " " && key !== "Space") return true;
		return shouldExecuteKeyboardAction(key, 150);
	}
	function resetKeyboardDebounceState() {
		debounceState.lastExecutionTime = 0;
		debounceState.lastKey = "";
		logger.debug("[Keyboard Debounce] State reset");
	}
	var debounceState;
	var init_keyboard_debounce = __esmMin((() => {
		init_logging();
		debounceState = {
			lastExecutionTime: 0,
			lastKey: ""
		};
	}));
	function checkGalleryOpen() {
		return gallerySignals.isOpen.value;
	}
	function handleKeyboardEvent(event, handlers, options) {
		if (!options.enableKeyboard) return;
		try {
			if (checkGalleryOpen()) {
				const key = event.key;
				if (key === "Home" || key === "End" || key === "PageDown" || key === "PageUp" || key === "ArrowLeft" || key === "ArrowRight" || key === " " || key === "Space" || key === " " || key === "Space" || key === "ArrowUp" || key === "ArrowDown" || key === "m" || key === "M") {
					event.preventDefault();
					event.stopPropagation();
					switch (key) {
						case " ":
						case "Space":
							if (shouldExecutePlayPauseKey(event.key)) executeVideoControl("togglePlayPause");
							break;
						case "ArrowLeft":
							navigatePrevious("keyboard");
							break;
						case "ArrowRight":
							navigateNext("keyboard");
							break;
						case "Home":
							navigateToItem(0, "keyboard");
							break;
						case "End":
							navigateToItem(Math.max(0, gallerySignals.mediaItems.value.length - 1), "keyboard");
							break;
						case "PageDown":
							navigateToItem(Math.min(gallerySignals.mediaItems.value.length - 1, gallerySignals.currentIndex.value + 5), "keyboard");
							break;
						case "PageUp":
							navigateToItem(Math.max(0, gallerySignals.currentIndex.value - 5), "keyboard");
							break;
						case "ArrowUp":
							if (shouldExecuteVideoControlKey(event.key)) executeVideoControl("volumeUp");
							break;
						case "ArrowDown":
							if (shouldExecuteVideoControlKey(event.key)) executeVideoControl("volumeDown");
							break;
						case "m":
						case "M":
							if (shouldExecuteVideoControlKey(event.key)) executeVideoControl("toggleMute");
							break;
					}
					if (handlers.onKeyboardEvent) handlers.onKeyboardEvent(event);
					return;
				}
			}
			if (event.key === "Escape" && checkGalleryOpen()) {
				handlers.onGalleryClose();
				event.preventDefault();
				event.stopPropagation();
				return;
			}
			if (handlers.onKeyboardEvent) handlers.onKeyboardEvent(event);
		} catch (error$1) {
			logger.error("Error handling keyboard event:", error$1);
		}
	}
	var init_keyboard = __esmMin((() => {
		init_logging();
		init_gallery_signals();
		init_video_control_helper();
		init_keyboard_debounce();
	}));
	function isValidMediaSource(url) {
		if (!url) return false;
		if (url.startsWith("blob:")) return true;
		return isValidMediaUrl(url);
	}
	function shouldBlockMediaTrigger(target) {
		if (!target) return false;
		if (isVideoControlElement(target)) return true;
		if (target.closest(CSS.SELECTORS.ROOT) || target.closest(CSS.SELECTORS.OVERLAY)) return true;
		const interactive = target.closest(INTERACTIVE_SELECTOR);
		if (interactive) return !(interactive.matches(MEDIA_SELECTORS.MEDIA_LINK) || interactive.querySelector(MEDIA_SELECTORS.TWEET_PHOTO) !== null || interactive.querySelector(MEDIA_SELECTORS.VIDEO_PLAYER) !== null);
		return false;
	}
	function isProcessableMedia(target) {
		if (!target) return false;
		if (gallerySignals.isOpen.value) return false;
		if (shouldBlockMediaTrigger(target)) return false;
		const mediaElement = findMediaElementInDOM(target);
		if (mediaElement) {
			if (isValidMediaSource(extractMediaUrlFromElement(mediaElement))) return true;
		}
		return Boolean(target.closest(MEDIA_SELECTORS.TWEET_PHOTO) || target.closest(MEDIA_SELECTORS.VIDEO_PLAYER));
	}
	var MEDIA_SELECTORS, INTERACTIVE_SELECTOR;
	var init_media_click_detector = __esmMin((() => {
		init_css();
		init_selectors();
		init_utils();
		init_gallery_signals();
		init_media_element_utils();
		init_url();
		MEDIA_SELECTORS = {
			TWEET_PHOTO: SELECTORS.TWEET_PHOTO,
			VIDEO_PLAYER: SELECTORS.VIDEO_PLAYER,
			MEDIA_LINK: SELECTORS.STATUS_LINK
		};
		INTERACTIVE_SELECTOR = [
			"button",
			"a",
			"[role=\"button\"]",
			"[data-testid=\"like\"]",
			"[data-testid=\"retweet\"]",
			"[data-testid=\"reply\"]",
			"[data-testid=\"share\"]",
			"[data-testid=\"bookmark\"]"
		].join(", ");
	}));
	async function handleMediaClick(event, handlers, options) {
		if (!options.enableMediaDetection) return {
			handled: false,
			reason: "Media detection disabled"
		};
		const target = event.target;
		if (!isHTMLElement(target)) return {
			handled: false,
			reason: "Invalid target (not HTMLElement)"
		};
		if (gallerySignals.isOpen.value && isGalleryInternalElement(target)) return {
			handled: false,
			reason: "Gallery internal event"
		};
		if (isVideoControlElement(target)) return {
			handled: false,
			reason: "Video control element"
		};
		if (!isProcessableMedia(target)) return {
			handled: false,
			reason: "Non-processable media target"
		};
		event.stopImmediatePropagation();
		event.preventDefault();
		await handlers.onMediaClick(target, event);
		return {
			handled: true,
			reason: "Media click handled"
		};
	}
	var init_media_click = __esmMin((() => {
		init_utils();
		init_gallery_signals();
		init_media_click_detector();
		init_guards();
	}));
	var gallery_lifecycle_exports = /* @__PURE__ */ __export({
		cleanupGalleryEvents: () => cleanupGalleryEvents,
		getGalleryEventSnapshot: () => getGalleryEventSnapshot,
		initializeGalleryEvents: () => initializeGalleryEvents,
		updateGalleryEventOptions: () => updateGalleryEventOptions
	}, 1);
	function sanitizeContext(context) {
		const trimmed = context?.trim();
		return trimmed && trimmed.length > 0 ? trimmed : DEFAULT_GALLERY_EVENT_OPTIONS.context;
	}
	function resolveInitializationInput(optionsOrRoot) {
		if (optionsOrRoot instanceof HTMLElement) return {
			options: { ...DEFAULT_GALLERY_EVENT_OPTIONS },
			root: optionsOrRoot
		};
		const partial = optionsOrRoot ?? {};
		const merged = {
			...DEFAULT_GALLERY_EVENT_OPTIONS,
			...partial
		};
		merged.context = sanitizeContext(merged.context);
		return {
			options: merged,
			root: null
		};
	}
	function resolveEventTarget(explicitRoot) {
		return explicitRoot || document.body || document.documentElement || document;
	}
	async function initializeGalleryEvents(handlers, optionsOrRoot) {
		if (lifecycleState$1.initialized) {
			logger.warn("[GalleryLifecycle] Already initialized, re-initializing");
			cleanupGalleryEvents();
		}
		if (!handlers) {
			logger.error("[GalleryLifecycle] Missing handlers");
			return () => {};
		}
		const { options: finalOptions, root: explicitGalleryRoot } = resolveInitializationInput(optionsOrRoot);
		const listenerContext = sanitizeContext(finalOptions.context);
		const keyHandler = (evt) => {
			handleKeyboardEvent(evt, handlers, finalOptions);
		};
		const clickHandler = async (evt) => {
			const event = evt;
			if ((await handleMediaClick(event, handlers, finalOptions)).handled && finalOptions.preventBubbling) {
				event.stopPropagation();
				event.preventDefault();
			}
		};
		const target = resolveEventTarget(explicitGalleryRoot);
		const listenerOptions = {
			capture: true,
			passive: false
		};
		const eventManager = EventManager.getInstance();
		if (finalOptions.enableKeyboard) eventManager.addListener(target, "keydown", keyHandler, listenerOptions, listenerContext);
		if (finalOptions.enableMediaDetection) eventManager.addListener(target, "click", clickHandler, listenerOptions, listenerContext);
		resetKeyboardDebounceState();
		lifecycleState$1 = {
			initialized: true,
			options: finalOptions,
			handlers,
			keyListener: keyHandler,
			clickListener: clickHandler,
			listenerContext,
			eventTarget: target
		};
		if (finalOptions.debugMode) logger.debug("[GalleryEvents] Event listeners registered", { context: listenerContext });
		return () => {
			cleanupGalleryEvents();
		};
	}
	function cleanupGalleryEvents() {
		if (!lifecycleState$1.initialized) return;
		if (lifecycleState$1.listenerContext) EventManager.getInstance().removeByContext(lifecycleState$1.listenerContext);
		resetKeyboardDebounceState();
		lifecycleState$1 = { ...initialLifecycleState };
	}
	function updateGalleryEventOptions(newOptions) {
		if (lifecycleState$1.options) lifecycleState$1.options = {
			...lifecycleState$1.options,
			...newOptions
		};
	}
	function getGalleryEventSnapshot() {
		return {
			initialized: lifecycleState$1.initialized,
			options: lifecycleState$1.options,
			isConnected: lifecycleState$1.initialized
		};
	}
	var DEFAULT_GALLERY_EVENT_OPTIONS, initialLifecycleState, lifecycleState$1;
	var init_gallery_lifecycle = __esmMin((() => {
		init_logging();
		init_event_manager();
		init_keyboard();
		init_media_click();
		init_keyboard_debounce();
		DEFAULT_GALLERY_EVENT_OPTIONS = {
			enableKeyboard: true,
			enableMediaDetection: true,
			debugMode: false,
			preventBubbling: true,
			context: "gallery"
		};
		initialLifecycleState = {
			initialized: false,
			options: null,
			handlers: null,
			keyListener: null,
			clickListener: null,
			listenerContext: null,
			eventTarget: null
		};
		lifecycleState$1 = { ...initialLifecycleState };
	}));
	var GalleryApp_exports = /* @__PURE__ */ __export({ GalleryApp: () => GalleryApp }, 1);
	var GalleryApp;
	var init_GalleryApp = __esmMin((() => {
		init_preload_helper();
		init_service_accessors();
		init_error();
		init_logging();
		init_notification_service();
		init_gallery_signals();
		init_ambient_video_coordinator();
		init_ambient_video_guard();
		init_safety$1();
		GalleryApp = class {
			galleryRenderer = null;
			isInitialized = false;
			notificationService = NotificationService.getInstance();
			ambientVideoGuardHandle = null;
			constructor() {
				logger.info("[GalleryApp] Constructor called");
			}
			async initialize() {
				try {
					logger.info("[GalleryApp] Initialization started");
					this.galleryRenderer = getGalleryRenderer();
					this.galleryRenderer?.setOnCloseCallback(() => this.closeGallery());
					await this.setupEventHandlers();
					this.ambientVideoGuardHandle = this.ambientVideoGuardHandle ?? withAmbientVideoGuard();
					this.isInitialized = true;
					logger.info("[GalleryApp] ✅ Initialization complete");
				} catch (error$1) {
					galleryErrorReporter.critical(error$1, { code: "GALLERY_APP_INIT_FAILED" });
				}
			}
			async setupEventHandlers() {
				try {
					const { initializeGalleryEvents: initializeGalleryEvents$1 } = await __vitePreload(async () => {
						const { initializeGalleryEvents: initializeGalleryEvents$2 } = await Promise.resolve().then(() => (init_gallery_lifecycle(), gallery_lifecycle_exports));
						return { initializeGalleryEvents: initializeGalleryEvents$2 };
					}, void 0);
					await initializeGalleryEvents$1({
						onMediaClick: (element, event) => this.handleMediaClick(element, event),
						onGalleryClose: () => this.closeGallery(),
						onKeyboardEvent: (event) => {
							if (event.key === "Escape" && gallerySignals.isOpen.value) this.closeGallery();
						}
					}, {
						enableKeyboard: tryGetSettingsManager()?.get("gallery.enableKeyboardNav") ?? true,
						enableMediaDetection: true,
						debugMode: false,
						preventBubbling: true,
						context: "gallery"
					});
					logger.info("[GalleryApp] ✅ Event handlers setup complete");
				} catch (error$1) {
					galleryErrorReporter.critical(error$1, { code: "EVENT_HANDLERS_SETUP_FAILED" });
				}
			}
			async handleMediaClick(element, _event) {
				try {
					const result = await getMediaService().extractFromClickedElement(element);
					if (result.success && result.mediaItems.length > 0) await this.openGallery(result.mediaItems, result.clickedIndex, { pauseContext: {
						sourceElement: element,
						reason: "media-click"
					} });
					else {
						mediaErrorReporter.warn(/* @__PURE__ */ new Error("Media extraction returned no items"), {
							code: "MEDIA_EXTRACTION_EMPTY",
							metadata: { success: result.success }
						});
						this.notificationService.error("Failed to load media", "Could not find images or videos.");
					}
				} catch (error$1) {
					mediaErrorReporter.error(error$1, {
						code: "MEDIA_EXTRACTION_ERROR",
						notify: true
					});
					this.notificationService.error("Error occurred", error$1 instanceof Error ? error$1.message : "Unknown error");
				}
			}
			async openGallery(mediaItems, startIndex = 0, options = {}) {
				if (!this.isInitialized) {
					logger.warn("[GalleryApp] Gallery not initialized.");
					this.notificationService.error("Gallery unavailable", "Tampermonkey or similar userscript manager is required.");
					return;
				}
				if (!mediaItems?.length) return;
				try {
					const validIndex = clampIndex(startIndex, mediaItems.length);
					const providedContext = options.pauseContext ?? null;
					const pauseContext = {
						...providedContext,
						reason: providedContext?.reason ?? (providedContext ? "media-click" : "programmatic")
					};
					try {
						pauseAmbientVideosForGallery(pauseContext);
					} catch (error$1) {
						logger.warn("[GalleryApp] Ambient video coordinator failed", error$1);
					}
					openGallery(mediaItems, validIndex);
				} catch (error$1) {
					galleryErrorReporter.error(error$1, {
						code: "GALLERY_OPEN_FAILED",
						metadata: {
							itemCount: mediaItems.length,
							startIndex
						},
						notify: true
					});
					this.notificationService.error("Failed to load gallery", error$1 instanceof Error ? error$1.message : "Unknown error");
					throw error$1;
				}
			}
			closeGallery() {
				try {
					if (gallerySignals.isOpen.value) closeGallery();
				} catch (error$1) {
					galleryErrorReporter.error(error$1, { code: "GALLERY_CLOSE_FAILED" });
				}
			}
			async cleanup() {
				try {
					logger.info("[GalleryApp] Cleanup started");
					if (gallerySignals.isOpen.value) this.closeGallery();
					this.ambientVideoGuardHandle?.dispose();
					this.ambientVideoGuardHandle = null;
					try {
						const { cleanupGalleryEvents: cleanupGalleryEvents$1 } = await __vitePreload(async () => {
							const { cleanupGalleryEvents: cleanupGalleryEvents$2 } = await Promise.resolve().then(() => (init_gallery_lifecycle(), gallery_lifecycle_exports));
							return { cleanupGalleryEvents: cleanupGalleryEvents$2 };
						}, void 0);
						cleanupGalleryEvents$1();
					} catch (error$1) {
						logger.warn("[GalleryApp] Event cleanup failed:", error$1);
					}
					this.galleryRenderer = null;
					this.isInitialized = false;
					delete globalThis.xegGalleryDebug;
					logger.info("[GalleryApp] ✅ Cleanup complete");
				} catch (error$1) {
					galleryErrorReporter.error(error$1, { code: "GALLERY_CLEANUP_FAILED" });
				}
			}
		};
	}));
	init_preload_helper();
	init_container();
	init_error();
	init_userscript();
	init_logging();
	var rendererRegistrationTask = null;
	async function registerRenderer() {
		if (!rendererRegistrationTask) rendererRegistrationTask = (async () => {
			const { GalleryRenderer: GalleryRenderer$1 } = await __vitePreload(async () => {
				const { GalleryRenderer: GalleryRenderer$2 } = await Promise.resolve().then(() => (init_GalleryRenderer(), GalleryRenderer_exports));
				return { GalleryRenderer: GalleryRenderer$2 };
			}, void 0);
			registerGalleryRenderer(new GalleryRenderer$1());
		})().finally(() => {
			rendererRegistrationTask = null;
		});
		await rendererRegistrationTask;
	}
	async function initializeServices() {
		if (!(isGMAPIAvailable("download") || isGMAPIAvailable("setValue"))) bootstrapErrorReporter.warn(/* @__PURE__ */ new Error("Tampermonkey APIs limited"), { code: "GM_API_LIMITED" });
		let settingsService = null;
		try {
			const { SettingsService: SettingsService$1 } = await __vitePreload(async () => {
				const { SettingsService: SettingsService$2 } = await Promise.resolve().then(() => (init_settings_service(), settings_service_exports));
				return { SettingsService: SettingsService$2 };
			}, void 0);
			const service = new SettingsService$1();
			await service.initialize();
			registerSettingsManager(service);
			settingsService = service;
			logger.debug("[Bootstrap] ✅ SettingsService initialized");
		} catch (error$1) {
			settingsErrorReporter.warn(error$1, { code: "SETTINGS_SERVICE_INIT_FAILED" });
		}
		try {
			const { getThemeService: getThemeService$1 } = await __vitePreload(async () => {
				const { getThemeService: getThemeService$2 } = await Promise.resolve().then(() => (init_service_accessors(), service_accessors_exports));
				return { getThemeService: getThemeService$2 };
			}, void 0);
			const themeService = getThemeService$1();
			if (!themeService.isInitialized()) await themeService.initialize();
			if (settingsService) {
				themeService.bindSettingsService(settingsService);
				const storedTheme = themeService.getCurrentTheme();
				themeService.setTheme(storedTheme, {
					force: true,
					persist: false
				});
			}
			logger.debug(`[Bootstrap] Theme confirmed: ${themeService.getCurrentTheme()}`);
		} catch (error$1) {
			bootstrapErrorReporter.warn(error$1, { code: "THEME_SYNC_FAILED" });
		}
	}
	async function initializeGalleryApp() {
		try {
			logger.info("🎨 Gallery app lazy initialization starting");
			await Promise.all([registerRenderer(), initializeServices()]);
			const { GalleryApp: GalleryApp$1 } = await __vitePreload(async () => {
				const { GalleryApp: GalleryApp$2 } = await Promise.resolve().then(() => (init_GalleryApp(), GalleryApp_exports));
				return { GalleryApp: GalleryApp$2 };
			}, void 0);
			const galleryApp = new GalleryApp$1();
			await galleryApp.initialize();
			logger.info("✅ Gallery app initialization complete");
			return galleryApp;
		} catch (error$1) {
			galleryErrorReporter.critical(error$1, { code: "GALLERY_APP_INIT_FAILED" });
			throw error$1;
		}
	}
	init_error();
	init_logging();
	async function executeStage(stage) {
		const startTime = performance.now();
		if (stage.shouldRun && !stage.shouldRun()) {
			logger.debug(`[bootstrap] ⏭️ ${stage.label} (skipped)`);
			return {
				label: stage.label,
				success: true,
				durationMs: 0
			};
		}
		try {
			logger.debug(`[bootstrap] ➡️ ${stage.label}`);
			await Promise.resolve(stage.run());
			const durationMs = performance.now() - startTime;
			logger.debug(`[bootstrap] ✅ ${stage.label} (${durationMs.toFixed(1)}ms)`);
			return {
				label: stage.label,
				success: true,
				durationMs
			};
		} catch (error$1) {
			const durationMs = performance.now() - startTime;
			if (stage.optional) bootstrapErrorReporter.warn(error$1, {
				code: "STAGE_OPTIONAL_FAILED",
				metadata: {
					stage: stage.label,
					durationMs
				}
			});
			else bootstrapErrorReporter.error(error$1, {
				code: "STAGE_FAILED",
				metadata: {
					stage: stage.label,
					durationMs
				}
			});
			return {
				label: stage.label,
				success: false,
				error: error$1,
				durationMs
			};
		}
	}
	async function executeStages(stages, options) {
		const results = [];
		const stopOnFailure = options?.stopOnFailure ?? true;
		for (const stage of stages) {
			const result = await executeStage(stage);
			results.push(result);
			if (!result.success && !stage.optional && stopOnFailure) {
				logger.error(`[bootstrap] ❌ Critical stage failed: ${stage.label}`);
				break;
			}
		}
		return results;
	}
	var __vite_import_meta_env__ = {
		"BASE_URL": "/",
		"DEV": false,
		"MODE": "development",
		"PROD": true,
		"SSR": false
	};
	var FALLBACK_VERSION = "0.4.15";
	var APP_NAME = "X.com Enhanced Gallery";
	var MAX_GALLERY_ITEMS = 100;
	var DEFAULT_ANIMATION_DURATION = "var(--xeg-duration-normal)";
	var DEFAULT_SERVICE_TIMEOUT_MS = 1e4;
	var DEFAULT_BOOTSTRAP_RETRY_ATTEMPTS = 3;
	var DEFAULT_BOOTSTRAP_RETRY_DELAY_MS = 100;
	var importMetaEnv = resolveImportMetaEnv();
	var nodeEnv = resolveNodeEnv();
	var rawVersion = resolveStringValue(importMetaEnv.VITE_VERSION, nodeEnv.VITE_VERSION, nodeEnv.npm_package_version) ?? FALLBACK_VERSION;
	var devFlag = parseBooleanFlag(importMetaEnv.DEV);
	var nodeDevFlag = parseBooleanFlag(nodeEnv.DEV);
	var mode = importMetaEnv.MODE ?? nodeEnv.NODE_ENV ?? "production";
	var isTest = mode === "test";
	var isDev = devFlag ?? nodeDevFlag ?? (!isTest && mode !== "production");
	var isProd = !isDev && !isTest;
	var autoStartFlag = parseBooleanFlag(importMetaEnv.VITE_AUTO_START ?? nodeEnv.VITE_AUTO_START);
	var debugToolsFlag = parseBooleanFlag(importMetaEnv.VITE_ENABLE_DEBUG_TOOLS ?? nodeEnv.VITE_ENABLE_DEBUG_TOOLS);
	var APP_CONFIG = Object.freeze({
		meta: {
			name: APP_NAME,
			version: rawVersion
		},
		environment: {
			mode,
			isDev,
			isTest,
			isProduction: isProd
		},
		runtime: { autoStart: autoStartFlag ?? true },
		limits: { maxGalleryItems: MAX_GALLERY_ITEMS },
		ui: { animationDuration: DEFAULT_ANIMATION_DURATION },
		features: {
			gallery: true,
			downloads: true,
			settings: true,
			accessibility: true,
			debugTools: debugToolsFlag ?? isDev
		},
		diagnostics: {
			enableLogger: true,
			enableVerboseLogs: isDev
		},
		bootstrap: {
			serviceTimeoutMs: DEFAULT_SERVICE_TIMEOUT_MS,
			retryAttempts: DEFAULT_BOOTSTRAP_RETRY_ATTEMPTS,
			retryDelayMs: DEFAULT_BOOTSTRAP_RETRY_DELAY_MS
		}
	});
	function getAppConfig() {
		return APP_CONFIG;
	}
	function createAppConfig() {
		const config = getAppConfig();
		return {
			version: config.meta.version,
			isDevelopment: config.environment.isDev,
			debug: config.features.debugTools,
			autoStart: config.runtime.autoStart
		};
	}
	function resolveImportMetaEnv() {
		if (typeof globalThis !== "undefined" && globalThis.__XEG_IMPORT_META_ENV__) return globalThis.__XEG_IMPORT_META_ENV__;
		try {
			return __vite_import_meta_env__ ?? {};
		} catch {
			return {};
		}
	}
	function resolveNodeEnv() {
		if (typeof process !== "undefined" && {}) return {};
		return {};
	}
	function parseBooleanFlag(value) {
		if (typeof value === "boolean") return value;
		if (typeof value === "string") {
			const normalized = value.trim().toLowerCase();
			if (!normalized) return;
			if ([
				"1",
				"true",
				"yes",
				"on"
			].includes(normalized)) return true;
			if ([
				"0",
				"false",
				"no",
				"off"
			].includes(normalized)) return false;
		}
	}
	function resolveStringValue(...values) {
		for (const value of values) if (typeof value === "string") {
			const normalized = value.trim();
			if (normalized.length > 0) return normalized;
		}
	}
	var windowLoadPromise = null;
	var hasBrowserContext = typeof window !== "undefined" && typeof document !== "undefined";
	function isWindowLoaded() {
		if (!hasBrowserContext) return true;
		return document.readyState === "complete";
	}
	function createWindowLoadPromise() {
		if (windowLoadPromise) return windowLoadPromise;
		windowLoadPromise = new Promise((resolve$1) => {
			const handleLoad = () => {
				window.removeEventListener("load", handleLoad);
				resolve$1();
				windowLoadPromise = Promise.resolve();
			};
			window.addEventListener("load", handleLoad, {
				once: true,
				passive: true
			});
		});
		return windowLoadPromise;
	}
	function waitForWindowLoad() {
		if (isWindowLoaded()) return Promise.resolve();
		return createWindowLoadPromise();
	}
	function runAfterWindowLoad(callback) {
		return waitForWindowLoad().then(() => Promise.resolve(callback())).then(() => void 0);
	}
	var vendors_exports = /* @__PURE__ */ __export({
		cleanupVendors: () => cleanupVendors,
		initializeVendors: () => initializeVendors,
		isVendorsInitialized: () => isVendorsInitialized,
		registerVendorCleanupOnUnload: () => registerVendorCleanupOnUnload
	}, 1);
	async function initializeVendors() {}
	function cleanupVendors() {}
	function registerVendorCleanupOnUnload() {}
	function isVendorsInitialized() {
		return true;
	}
	var init_vendors = __esmMin((() => {}));
	var critical_systems_exports = /* @__PURE__ */ __export({ initializeCriticalSystems: () => initializeCriticalSystems }, 1);
	async function initializeCriticalSystems() {
		devLogger?.debug("[critical] initialization started");
		try {
			const { registerCoreServices: registerCoreServices$1 } = await __vitePreload(async () => {
				const { registerCoreServices: registerCoreServices$2 } = await Promise.resolve().then(() => (init_service_initialization(), service_initialization_exports));
				return { registerCoreServices: registerCoreServices$2 };
			}, void 0);
			await registerCoreServices$1();
			warmupCriticalServices();
			devLogger?.debug("[critical] initialization complete");
		} catch (error$1) {
			bootstrapErrorReporter.critical(error$1, { code: "CRITICAL_SYSTEMS_INIT_FAILED" });
		}
	}
	var devLogger;
	var init_critical_systems = __esmMin((() => {
		init_preload_helper();
		init_container();
		init_error();
		init_logging();
		devLogger = null;
	}));
	function reportBootstrapError(error$1, options) {
		const severity = options.severity ?? "recoverable";
		const behavior = ERROR_BEHAVIOR_MAP[severity];
		const message = `[${options.context}] initialization failed: ${normalizeErrorMessage(error$1)}`;
		options.logger[behavior.logLevel](message, error$1);
		if (behavior.throwOnError) throw error$1 instanceof Error ? error$1 : new Error(message);
	}
	var ERROR_BEHAVIOR_MAP, normalizeErrorMessage;
	var init_types = __esmMin((() => {
		ERROR_BEHAVIOR_MAP = {
			critical: {
				logLevel: "error",
				throwOnError: true
			},
			recoverable: {
				logLevel: "warn",
				throwOnError: false
			}
		};
		normalizeErrorMessage = (error$1) => {
			if (error$1 instanceof Error && error$1.message) return error$1.message;
			if (typeof error$1 === "string" && error$1.length > 0) return error$1;
			return "Unknown bootstrap error";
		};
	}));
	var features_exports = /* @__PURE__ */ __export({
		registerFeatureLoader: () => registerFeatureLoader,
		registerFeatureServicesLazy: () => registerFeatureServicesLazy,
		resetFeatureLoaders: () => resetFeatureLoaders
	}, 1);
	function coerceBoolean(value, fallback) {
		if (typeof value === "boolean") return value;
		return fallback;
	}
	function readFlag(settings, feature) {
		return coerceBoolean((settings?.features ?? {})[feature], DEFAULT_FEATURE_STATE[feature]);
	}
	function resolveFeatureStates(settings) {
		return FEATURE_KEYS.reduce((state, key) => {
			state[key] = readFlag(settings ?? void 0, key);
			return state;
		}, {});
	}
	function registerFeatureLoader(loader) {
		featureLoaders.push(loader);
	}
	function resetFeatureLoaders() {
		featureLoaders.splice(0, featureLoaders.length);
	}
	async function loadFeatureSettings() {
		try {
			const { getPersistentStorage: getPersistentStorage$1 } = await __vitePreload(async () => {
				const { getPersistentStorage: getPersistentStorage$2 } = await Promise.resolve().then(() => (init_persistent_storage(), persistent_storage_exports));
				return { getPersistentStorage: getPersistentStorage$2 };
			}, void 0);
			const stored = await getPersistentStorage$1().get(APP_SETTINGS_STORAGE_KEY);
			if (stored && typeof stored === "object" && "features" in stored) {
				const candidate = stored.features;
				if (candidate && typeof candidate === "object") {
					debug$1("[features] Settings loaded successfully");
					return { features: {
						...DEFAULT_FEATURE_SETTINGS.features,
						...candidate
					} };
				}
			}
		} catch (error$1) {
			logger.warn("[features] Settings loading failed - using defaults:", error$1);
		}
		return cloneDefaultFeatureSettings();
	}
	async function registerFeatureServicesLazy() {
		try {
			debug$1("[features] Registering feature services");
			const featureStates = resolveFeatureStates(await loadFeatureSettings());
			for (const loader of featureLoaders) {
				if (loader.devOnly && !isDevelopmentBuild()) continue;
				if (!featureStates[loader.flag]) {
					debug$1(`[features] ℹ️ ${loader.name} disabled (${loader.flag}: false)`);
					continue;
				}
				try {
					await loader.load();
					debug$1(`[features] ✅ ${loader.name} registered`);
				} catch (error$1) {
					logger.warn(`[features] ⚠️ ${loader.name} registration failed (continuing):`, error$1);
				}
			}
			debug$1("[features] ✅ Feature services registered");
		} catch (error$1) {
			reportBootstrapError(error$1, {
				context: "features",
				logger
			});
		}
	}
	var FEATURE_KEYS, DEFAULT_FEATURE_STATE, getDevOverride, isDevelopmentBuild, debug$1, featureLoaders, DEFAULT_FEATURE_SETTINGS, cloneDefaultFeatureSettings;
	var init_features = __esmMin((() => {
		init_preload_helper();
		init_types();
		init_constants$1();
		init_logging();
		FEATURE_KEYS = [
			"gallery",
			"settings",
			"download",
			"mediaExtraction",
			"accessibility"
		];
		DEFAULT_FEATURE_STATE = {
			gallery: true,
			settings: true,
			download: true,
			mediaExtraction: true,
			accessibility: true
		};
		getDevOverride = () => {
			const scopedGlobal = globalThis;
			if (scopedGlobal && typeof scopedGlobal.__XEG_DEV__ === "boolean") return scopedGlobal.__XEG_DEV__;
		};
		isDevelopmentBuild = () => {
			const override = getDevOverride();
			if (typeof override === "boolean") return override;
			return true;
		};
		debug$1 = (message) => {
			if (isDevelopmentBuild()) logger.debug(message);
		};
		featureLoaders = [];
		DEFAULT_FEATURE_SETTINGS = Object.freeze({ features: { ...DEFAULT_SETTINGS.features } });
		cloneDefaultFeatureSettings = () => ({ features: { ...DEFAULT_FEATURE_SETTINGS.features } });
	}));
	var environment_exports = /* @__PURE__ */ __export({ initializeEnvironment: () => initializeEnvironment }, 1);
	async function initializeEnvironment() {
		try {
			const { initializeVendors: initializeVendors$1 } = await __vitePreload(async () => {
				const { initializeVendors: initializeVendors$2 } = await Promise.resolve().then(() => (init_vendors(), vendors_exports));
				return { initializeVendors: initializeVendors$2 };
			}, void 0);
			await initializeVendors$1();
		} catch (error$1) {
			reportBootstrapError(error$1, {
				context: "environment",
				severity: "critical",
				logger
			});
		}
	}
	var init_environment = __esmMin((() => {
		init_preload_helper();
		init_types();
		init_logging();
	}));
	var base_services_exports = /* @__PURE__ */ __export({ initializeCoreBaseServices: () => initializeCoreBaseServices }, 1);
	function registerMissingBaseServices(coreService) {
		let registeredCount = 0;
		for (const [key, getService] of BASE_SERVICE_REGISTRATIONS) if (!coreService.has(key)) {
			coreService.register(key, getService());
			registeredCount += 1;
		}
		return registeredCount;
	}
	async function initializeCoreBaseServices() {
		const coreService = CoreService.getInstance();
		try {
			const newlyRegistered = registerMissingBaseServices(coreService);
			if (newlyRegistered > 0 && true) logger.debug(`[base-services] Registered ${newlyRegistered} base services`);
			for (const identifier of CORE_BASE_SERVICE_IDENTIFIERS) {
				const service = coreService.get(identifier);
				if (service && typeof service.initialize === "function") await service.initialize();
			}
			logger.debug("[base-services] Base services ready");
		} catch (error$1) {
			reportBootstrapError(error$1, {
				context: "base-services",
				logger
			});
		}
	}
	var BASE_SERVICE_REGISTRATIONS;
	var init_base_services = __esmMin((() => {
		init_types();
		init_service_accessors();
		init_logging();
		init_service_manager();
		init_singletons();
		BASE_SERVICE_REGISTRATIONS = [
			[THEME_SERVICE_IDENTIFIER, getThemeServiceInstance],
			[LANGUAGE_SERVICE_IDENTIFIER, getLanguageServiceInstance],
			[MEDIA_SERVICE_IDENTIFIER, getMediaServiceInstance]
		];
	}));
	var init_design_tokens_primitive = __esmMin((() => {}));
	var init_design_tokens_semantic = __esmMin((() => {}));
	var init_design_tokens_component = __esmMin((() => {}));
	var init_animation = __esmMin((() => {}));
	var init_reset = __esmMin((() => {}));
	var init_layout = __esmMin((() => {}));
	var init_animations = __esmMin((() => {}));
	var init_isolated_gallery = __esmMin((() => {}));
	var globals_exports = {};
	var init_globals = __esmMin((() => {
		init_design_tokens_primitive();
		init_design_tokens_semantic();
		init_design_tokens_component();
		init_animation();
		init_reset();
		init_layout();
		init_animations();
		init_isolated_gallery();
	}));
	var dev_tools_exports = /* @__PURE__ */ __export({ initializeDevTools: () => initializeDevTools }, 1);
	async function initializeDevTools() {}
	var init_dev_tools = __esmMin((() => {
		init_types();
		init_logging();
		Boolean(typeof process !== "undefined" && {}?.VITEST);
	}));
	var gallery_exports = {};
	var init_gallery = __esmMin((() => {}));
	var preload_exports = /* @__PURE__ */ __export({ executePreloadStrategy: () => executePreloadStrategy }, 1);
	async function runPreloadTask(task, deps) {
		debug(`[preload] loading ${task.label}`);
		try {
			await task.loader();
			debug(`[preload] ${task.label} ready`);
		} catch (error$1) {
			deps.logWarn(`[preload] ${task.label} preload failed`, error$1);
		}
	}
	async function executePreloadStrategy(tasks = PRELOAD_TASKS, deps = DEFAULT_PRELOAD_DEPENDENCIES) {
		for (const task of tasks) await runPreloadTask(task, deps);
	}
	var PRELOAD_TASKS, debug, DEFAULT_PRELOAD_DEPENDENCIES;
	var init_preload = __esmMin((() => {
		init_preload_helper();
		init_logging();
		PRELOAD_TASKS = Object.freeze([{
			label: "gallery core",
			loader: () => __vitePreload(() => Promise.resolve().then(() => (init_gallery(), gallery_exports)), void 0)
		}]);
		debug = (message) => logger.debug(message);
		DEFAULT_PRELOAD_DEPENDENCIES = Object.freeze({ logWarn: (message, error$1) => {
			logger.warn(message, error$1);
		} });
	}));
	function ensureDevNamespace() {
		if (!_env.DEV) return;
		const host = globalThis;
		host.__XEG__ = host.__XEG__ ?? {};
		return host.__XEG__;
	}
	function mutateDevNamespace(mutator) {
		const namespace = ensureDevNamespace();
		if (!namespace) return;
		mutator(namespace);
	}
	var _env;
	var init_dev_namespace$1 = __esmMin((() => {
		_env = { get DEV() {
			return false;
		} };
	}));
	var dev_namespace_exports = /* @__PURE__ */ __export({ setupDevNamespace: () => setupDevNamespace }, 1);
	function setupDevNamespace(galleryAppInstance, actions) {
		mutateDevNamespace((namespace) => {
			const mainNamespace = namespace.main ?? (namespace.main = { ...actions });
			mainNamespace.start = actions.start;
			mainNamespace.createConfig = actions.createConfig;
			mainNamespace.cleanup = actions.cleanup;
			if (galleryAppInstance !== void 0) if (galleryAppInstance) mainNamespace.galleryApp = galleryAppInstance;
			else delete mainNamespace.galleryApp;
		});
	}
	var init_dev_namespace = __esmMin((() => {
		init_dev_namespace$1();
	}));
	init_preload_helper();
	init_service_accessors();
	init_error();
	init_vendors();
	init_logging();
	init_service_manager();
	init_timer_management();
	const lifecycleState = {
		started: false,
		startPromise: null,
		galleryApp: null
	};
	var warnCleanupLog = (message, error$1) => {
		logger.warn(message, error$1);
	};
	var debugCleanupLog = (message, error$1) => {
		logger.debug(message, error$1);
	};
	var globalEventTeardown = null;
	function tearDownGlobalEventHandlers() {
		if (!globalEventTeardown) return;
		const teardown = globalEventTeardown;
		globalEventTeardown = null;
		try {
			teardown();
		} catch (error$1) {
			logger.debug("[events] Error while tearing down global handlers", error$1);
		}
	}
	async function runOptionalCleanup(label$1, task, log = warnCleanupLog) {
		try {
			await task();
		} catch (error$1) {
			log(label$1, error$1);
		}
	}
	var bootstrapStages = [
		{
			label: "Global styles",
			run: loadGlobalStyles
		},
		{
			label: "Developer tooling",
			run: initializeDevToolsIfNeeded,
			shouldRun: () => true
		},
		{
			label: "Infrastructure",
			run: initializeInfrastructure
		},
		{
			label: "Critical systems",
			run: async () => {
				const { initializeCriticalSystems: initializeCriticalSystems$1 } = await __vitePreload(async () => {
					const { initializeCriticalSystems: initializeCriticalSystems$2 } = await Promise.resolve().then(() => (init_critical_systems(), critical_systems_exports));
					return { initializeCriticalSystems: initializeCriticalSystems$2 };
				}, void 0);
				await initializeCriticalSystems$1();
			}
		},
		{
			label: "Base services",
			run: initializeBaseServicesStage
		},
		{
			label: "Theme synchronization",
			run: applyInitialThemeSetting
		},
		{
			label: "Feature service registration",
			run: async () => {
				const { registerFeatureServicesLazy: registerFeatureServicesLazy$1 } = await __vitePreload(async () => {
					const { registerFeatureServicesLazy: registerFeatureServicesLazy$2 } = await Promise.resolve().then(() => (init_features(), features_exports));
					return { registerFeatureServicesLazy: registerFeatureServicesLazy$2 };
				}, void 0);
				await registerFeatureServicesLazy$1();
			}
		},
		{
			label: "Global event wiring",
			run: () => setupGlobalEventHandlers()
		},
		{
			label: "Gallery initialization",
			run: initializeGalleryIfPermitted
		},
		{
			label: "Non-critical systems",
			run: () => initializeNonCriticalSystems()
		}
	];
	async function runBootstrapStages() {
		const failedStage = (await executeStages(bootstrapStages, { stopOnFailure: true })).find((r) => !r.success);
		if (failedStage) throw failedStage.error ?? /* @__PURE__ */ new Error(`Bootstrap stage failed: ${failedStage.label}`);
	}
	async function initializeInfrastructure() {
		try {
			const { initializeEnvironment: initializeEnvironment$1 } = await __vitePreload(async () => {
				const { initializeEnvironment: initializeEnvironment$2 } = await Promise.resolve().then(() => (init_environment(), environment_exports));
				return { initializeEnvironment: initializeEnvironment$2 };
			}, void 0);
			await initializeEnvironment$1();
			logger.debug("✅ Vendor library initialization complete");
		} catch (error$1) {
			bootstrapErrorReporter.critical(error$1, { code: "INFRASTRUCTURE_INIT_FAILED" });
		}
	}
	async function initializeBaseServicesStage() {
		try {
			const { initializeCoreBaseServices: initializeCoreBaseServices$1 } = await __vitePreload(async () => {
				const { initializeCoreBaseServices: initializeCoreBaseServices$2 } = await Promise.resolve().then(() => (init_base_services(), base_services_exports));
				return { initializeCoreBaseServices: initializeCoreBaseServices$2 };
			}, void 0);
			await initializeCoreBaseServices$1();
			logger.debug("✅ Base services initialization complete");
		} catch (error$1) {
			bootstrapErrorReporter.warn(error$1, { code: "BASE_SERVICES_INIT_FAILED" });
		}
	}
	async function applyInitialThemeSetting() {
		try {
			const { getThemeService: getThemeService$1 } = await __vitePreload(async () => {
				const { getThemeService: getThemeService$2 } = await Promise.resolve().then(() => (init_service_accessors(), service_accessors_exports));
				return { getThemeService: getThemeService$2 };
			}, void 0);
			const themeService = getThemeService$1();
			if (typeof themeService.isInitialized === "function" && !themeService.isInitialized()) await themeService.initialize();
			const savedSetting = themeService.getCurrentTheme();
			themeService.setTheme(savedSetting, {
				force: true,
				persist: false
			});
			logger.debug(`[theme-sync] Applied saved theme: ${savedSetting}`);
		} catch (error$1) {
			logger.warn("[theme-sync] Initial theme application skipped:", error$1);
		}
	}
	function initializeNonCriticalSystems() {
		try {
			logger.info("Starting non-critical system initialization");
			warmupNonCriticalServices();
			logger.info("✅ Non-critical system initialization complete");
		} catch (error$1) {
			logger.warn("Error during non-critical system initialization:", error$1);
		}
	}
	function setupGlobalEventHandlers() {
		tearDownGlobalEventHandlers();
		globalEventTeardown = wireGlobalEvents(() => {
			cleanup().catch((error$1) => logger.error("Error during page unload cleanup:", error$1));
		});
	}
	async function loadGlobalStyles() {
		await __vitePreload(() => Promise.resolve().then(() => (init_globals(), globals_exports)), void 0);
	}
	async function initializeDevToolsIfNeeded() {
		const { initializeDevTools: initializeDevTools$1 } = await __vitePreload(async () => {
			const { initializeDevTools: initializeDevTools$2 } = await Promise.resolve().then(() => (init_dev_tools(), dev_tools_exports));
			return { initializeDevTools: initializeDevTools$2 };
		}, void 0);
		await initializeDevTools$1();
	}
	async function initializeGalleryIfPermitted() {
		await initializeGallery();
	}
	function triggerPreloadStrategy() {
		runAfterWindowLoad(async () => {
			try {
				const { executePreloadStrategy: executePreloadStrategy$1 } = await __vitePreload(async () => {
					const { executePreloadStrategy: executePreloadStrategy$2 } = await Promise.resolve().then(() => (init_preload(), preload_exports));
					return { executePreloadStrategy: executePreloadStrategy$2 };
				}, void 0);
				await executePreloadStrategy$1();
			} catch (error$1) {
				logger.warn("[Phase 326] Error executing preload strategy:", error$1);
			}
		});
	}
	async function cleanup() {
		try {
			logger.info("🧹 Starting application cleanup");
			tearDownGlobalEventHandlers();
			await runOptionalCleanup("Gallery cleanup", async () => {
				if (!lifecycleState.galleryApp) return;
				await lifecycleState.galleryApp.cleanup();
				lifecycleState.galleryApp = null;
				{
					const { setupDevNamespace: setupDevNamespace$1 } = await __vitePreload(async () => {
						const { setupDevNamespace: setupDevNamespace$2 } = await Promise.resolve().then(() => (init_dev_namespace(), dev_namespace_exports));
						return { setupDevNamespace: setupDevNamespace$2 };
					}, void 0);
					setupDevNamespace$1(null, {
						start: startApplication,
						createConfig: createAppConfig,
						cleanup
					});
				}
			});
			await runOptionalCleanup("CoreService cleanup", () => {
				CoreService.getInstance().cleanup();
			});
			await runOptionalCleanup("Vendor cleanup", () => {});
			await runOptionalCleanup("Global timer cleanup", () => {
				globalTimerManager.cleanup();
			});
			await runOptionalCleanup("Global error handler cleanup", async () => {
				const { GlobalErrorHandler: GlobalErrorHandler$1 } = await __vitePreload(async () => {
					const { GlobalErrorHandler: GlobalErrorHandler$2 } = await Promise.resolve().then(() => (init_error(), error_exports));
					return { GlobalErrorHandler: GlobalErrorHandler$2 };
				}, void 0);
				GlobalErrorHandler$1.getInstance().destroy();
			}, debugCleanupLog);
			await runOptionalCleanup("[cleanup] Event listener status check", async () => {
				const { getEventListenerStatus: getEventListenerStatus$1 } = await __vitePreload(async () => {
					const { getEventListenerStatus: getEventListenerStatus$2 } = await Promise.resolve().then(() => (init_listener_manager(), listener_manager_exports));
					return { getEventListenerStatus: getEventListenerStatus$2 };
				}, void 0);
				const status = getEventListenerStatus$1();
				if (status.total > 0) logger.warn("[cleanup] ⚠️ Warning: uncleared event listeners remain:", {
					total: status.total,
					byType: status.byType,
					byContext: status.byContext
				});
				else logger.debug("[cleanup] ✅ All event listeners cleared successfully");
			}, debugCleanupLog);
			lifecycleState.started = false;
			logger.info("✅ Application cleanup complete");
		} catch (error$1) {
			bootstrapErrorReporter.error(error$1, { code: "CLEANUP_FAILED" });
			throw error$1;
		}
	}
	async function startApplication() {
		if (lifecycleState.started) {
			logger.debug("Application: Already started");
			return;
		}
		if (lifecycleState.startPromise) {
			logger.debug("Application: Start in progress - reusing promise");
			return lifecycleState.startPromise;
		}
		lifecycleState.startPromise = (async () => {
			logger.info("🚀 Starting X.com Enhanced Gallery...");
			await runBootstrapStages();
			triggerPreloadStrategy();
			lifecycleState.started = true;
			logger.info("✅ Application initialization complete");
			{
				const { setupDevNamespace: setupDevNamespace$1 } = await __vitePreload(async () => {
					const { setupDevNamespace: setupDevNamespace$2 } = await Promise.resolve().then(() => (init_dev_namespace(), dev_namespace_exports));
					return { setupDevNamespace: setupDevNamespace$2 };
				}, void 0);
				setupDevNamespace$1(lifecycleState.galleryApp, {
					start: startApplication,
					createConfig: createAppConfig,
					cleanup
				});
			}
		})().catch((error$1) => {
			bootstrapErrorReporter.error(error$1, {
				code: "APP_INIT_FAILED",
				metadata: { leanMode: true }
			});
		}).finally(() => {
			lifecycleState.startPromise = null;
		});
		return lifecycleState.startPromise;
	}
	async function initializeGallery() {
		try {
			logger.debug("🎯 Starting gallery immediate initialization");
			lifecycleState.galleryApp = await initializeGalleryApp();
			logger.debug("✅ Gallery immediate initialization complete");
		} catch (error$1) {
			galleryErrorReporter.critical(error$1, { code: "GALLERY_INIT_FAILED" });
		}
	}
	startApplication();
	__vitePreload(async () => {
		const { setupDevNamespace: setupDevNamespace$1 } = await Promise.resolve().then(() => (init_dev_namespace(), dev_namespace_exports));
		return { setupDevNamespace: setupDevNamespace$1 };
	}, void 0).then(({ setupDevNamespace: setupDevNamespace$1 }) => {
		setupDevNamespace$1(void 0, {
			start: startApplication,
			createConfig: createAppConfig,
			cleanup
		});
	});
})();


})();
//# sourceMappingURL=xcom-enhanced-gallery.dev.user.js.map