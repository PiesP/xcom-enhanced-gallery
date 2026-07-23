// ==UserScript==
// @name X.com Enhanced Gallery
// @namespace https://github.com/PiesP/xcom-enhanced-gallery
// @version 2.2.0
// @description Media viewer and download functionality for X.com
// @author PiesP
// @license MIT
// Copyright (c) 2024-2026 PiesP
// @homepageURL https://github.com/PiesP/xcom-enhanced-gallery
// @match https://x.com/*
// @match https://twitter.com/*
// @match https://*.x.com/*
// @grant GM_setValue
// @grant GM_getValue
// @grant GM_deleteValue
// @grant GM_listValues
// @grant GM_download
// @grant GM_notification
// @grant GM_xmlhttpRequest
// @grant GM_cookie
// @connect pbs.twimg.com
// @connect video.twimg.com
// @connect api.twitter.com
// @run-at document-idle
// @supportURL https://github.com/PiesP/xcom-enhanced-gallery/issues
// @downloadURL https://cdn.jsdelivr.net/gh/PiesP/xcom-enhanced-gallery@release/dist/xcom-enhanced-gallery.user.js
// @updateURL https://cdn.jsdelivr.net/gh/PiesP/xcom-enhanced-gallery@release/dist/xcom-enhanced-gallery.meta.js
// @compatible chrome 117+
// @compatible firefox 119+
// @compatible edge 117+
// @compatible safari 17+
// @noframes
// ==/UserScript==
(function(){if(typeof document==='undefined')return;var e=document.getElementById("xeg-injected-styles");if(!e){e=document.createElement('style');e.id="xeg-injected-styles";document.head.appendChild(e);}e.textContent="@layer xeg.components{:root{--xeg-transition-toolbar:opacity var(--xeg-duration-toolbar) var(--xeg-ease-standard), transform var(--xeg-duration-toolbar) var(--xeg-ease-standard), visibility 0s;--xeg-spacing-gallery:clamp(var(--xeg-spacing-sm), 2.5vw, var(--xeg-spacing-lg));--xeg-spacing-mobile:clamp(var(--xeg-spacing-xs), 2vw, var(--xeg-spacing-md));--xeg-spacing-compact:clamp(.25rem, 1.5vw, var(--xeg-spacing-sm));--xeg-toolbar-hidden-opacity:0;--xeg-toolbar-hidden-visibility:hidden;--xeg-toolbar-hidden-pointer-events:none}.xeg-spinner{width:var(--xeg-spinner-size,var(--xeg-spinner-size-default));height:var(--xeg-spinner-size,var(--xeg-spinner-size-default));border-radius:var(--xeg-radius-full);border:var(--xeg-spinner-border-width) solid var(--xeg-spinner-track-color);border-top-color:var(--xeg-spinner-indicator-color);animation:xeg-spin var(--xeg-spinner-duration) var(--xeg-spinner-easing) infinite;box-sizing:border-box;display:inline-block}@media (prefers-reduced-motion:reduce){.xeg-spinner{animation:none}}@keyframes xeg-fade-in{0%{opacity:0}to{opacity:1}}@keyframes xeg-fade-out{0%{opacity:1}to{opacity:0}}@keyframes xeg-spin{0%{transform:rotate(0)}to{transform:rotate(360deg)}}}@media (prefers-reduced-motion:reduce){@layer xeg.components{:root{--xeg-transition-toolbar:none}.xg-X9gZ{scroll-behavior:auto;transition:none}.xg-meO3{transition:none}.xg-gmRW{scroll-behavior:auto;will-change:auto;transform:none}.xg-meO3:hover,.xg-meO3:focus-within{transform:none}}}.xg-X9gZ{width:100vw;height:100vh;z-index:var(--xeg-z-gallery,10000);background:var(--xeg-gallery-bg);will-change:opacity, transform;contain:layout style paint;opacity:1;visibility:visible;transition:var(--xeg-transition-elevation-normal);cursor:default;pointer-events:auto;scroll-behavior:smooth;overscroll-behavior:none;flex-direction:column;display:flex;position:fixed;top:0;left:0;container:gallery-container\u002Fsize}.xg-meO3{height:auto;z-index:var(--xeg-z-toolbar,2147480000);opacity:var(--toolbar-opacity,0);visibility:var(--toolbar-visibility,hidden);transition:var(--xeg-transition-toolbar);will-change:transform;contain:layout style;pointer-events:var(--toolbar-pointer-events,none);background:0 0;border:none;border-radius:0;margin:0;padding-block-end:var(--xeg-spacing-gallery);display:block;position:fixed;top:0;left:0;right:0}.xg-meO3:is(:hover,:focus-within){--toolbar-opacity:1;--toolbar-visibility:visible;--toolbar-pointer-events:auto;--toolbar-transform-y:0}.xg-meO3:focus-within{transition:var(--xeg-transition-elevation-fast)}.xg-meO3 *{pointer-events:inherit}.xg-meO3 [data-gallery-element=settings-panel][data-expanded=true]{pointer-events:auto}.xg-meO3:has([data-gallery-element=settings-panel][data-expanded=true]){--toolbar-opacity:1;--toolbar-visibility:visible;--toolbar-pointer-events:auto}.xg-X9gZ.xg-9abg{cursor:none}.xg-X9gZ.xg-sOsS[data-xeg-gallery=true] .xg-meO3{--toolbar-opacity:var(--xeg-toolbar-hidden-opacity,0);--toolbar-visibility:var(--xeg-toolbar-hidden-visibility,hidden);--toolbar-pointer-events:var(--xeg-toolbar-hidden-pointer-events,none)}.xg-X9gZ *{pointer-events:auto}.xg-gmRW{z-index:0;contain:layout style;overscroll-behavior:contain;scrollbar-gutter:stable;pointer-events:auto;flex-direction:column;flex:1;display:flex;position:relative;overflow:auto;-webkit-mask-image:linear-gradient(#000 95%,#0000 100%);mask-image:linear-gradient(#000 95%,#0000 100%);container:items-list\u002Fsize}.xg-gmRW::-webkit-scrollbar{width:var(--xeg-scrollbar-width)}.xg-gmRW::-webkit-scrollbar-track{background:0 0}.xg-gmRW::-webkit-scrollbar-thumb{background:var(--xeg-scrollbar-thumb-color,var(--xeg-color-neutral-300));border-radius:var(--xeg-scrollbar-border-radius);transition:background-color var(--xeg-duration-normal) var(--xeg-ease-standard)}.xg-gmRW::-webkit-scrollbar-thumb:hover{background:var(--xeg-scrollbar-thumb-hover-color,var(--xeg-color-neutral-400))}.xg-X9gZ.xg-9abg .xg-meO3{pointer-events:none;opacity:0;transition:opacity var(--xeg-duration-fast) var(--xeg-ease-standard)}.xg-X9gZ.xg-9abg .xg-gmRW{pointer-events:auto}.xg-X9gZ.xg-yhK-{justify-content:center;align-items:center}.xg-EfVa{margin-bottom:var(--xeg-spacing-md,1rem);border-radius:var(--xeg-radius-lg,.5rem);transition:var(--xeg-transition-elevation-normal);contain:layout style;position:relative}.xg-LxHL{z-index:1;position:relative}.xg-sfF0{height:calc(100vh - var(--xeg-toolbar-height,3.75rem));pointer-events:none;-webkit-user-select:none;user-select:none;opacity:0;content-visibility:auto;background:0 0;flex-shrink:0;min-height:50vh}.xg-gC-m{height:var(--xeg-hover-zone-height);z-index:var(--xeg-z-toolbar-hover-zone,2147480000);pointer-events:auto;background:0 0;position:fixed;top:0;left:0;right:0}.xg-X9gZ.xg-Canm:not([data-settings-expanded=true]) .xg-gC-m,.xg-X9gZ:has(.xg-meO3:hover):not([data-settings-expanded=true]) .xg-gC-m{pointer-events:none}.xg-X9gZ.xg-Canm .xg-meO3,.xg-X9gZ:has(.xg-gC-m:hover) .xg-meO3{--toolbar-opacity:1;--toolbar-visibility:visible;--toolbar-pointer-events:auto;--toolbar-transform-y:0}.xg-meO3 [class*=galleryToolbar]{opacity:var(--toolbar-opacity,0);visibility:var(--toolbar-visibility,hidden);pointer-events:var(--toolbar-pointer-events,none);display:flex}.xg-meO3 button,.xg-meO3 [role=button],.xg-meO3 .xg-e06X{pointer-events:auto;z-index:10;position:relative}.xg-fwsr{text-align:center;color:var(--xeg-color-text-secondary);max-inline-size:min(25rem,90vw);padding:clamp(1.875rem,5vw,2.5rem)}.xg-fwsr h3{font-size:clamp(1.25rem,4vw,1.5rem);font-weight:var(--xeg-font-weight-semibold);color:var(--xeg-color-text-primary);line-height:var(--xeg-line-height-tight);margin:0 0 clamp(.75rem,2vw,1rem)}.xg-fwsr p{font-size:clamp(.875rem,2.5vw,1rem);line-height:var(--xeg-line-height-normal);color:var(--xeg-color-text-tertiary);margin:0}@container gallery-container (width\u003C=48rem){.xg-gmRW{padding:var(--xeg-spacing-mobile);gap:var(--xeg-spacing-mobile)}.xg-meO3{padding-block-end:var(--xeg-spacing-mobile)}}@container gallery-container (width\u003C=30rem){.xg-gmRW{padding:var(--xeg-spacing-compact);gap:var(--xeg-spacing-compact)}}.xg-X9gZ [class*=galleryToolbar]:hover{--toolbar-opacity:1;--toolbar-pointer-events:auto}.xg-huYo{margin-bottom:var(--xeg-spacing-md);border-radius:var(--xeg-radius-lg);transition:var(--xeg-transition-interaction-fast);cursor:pointer;border:.0625rem solid var(--xeg-color-border-primary);background:var(--xeg-color-bg-secondary);padding:var(--xeg-spacing-sm);text-align:center;pointer-events:auto;content-visibility:auto;contain-intrinsic-size:var(--xeg-cis-override,auto none auto 300px);flex-direction:column;align-items:center;width:fit-content;max-width:100%;margin-inline:auto;display:flex;position:relative;overflow:visible}.xg-huYo[data-fit-mode=original]{flex-shrink:0;align-self:center;width:max-content;max-width:none}.xg-huYo:hover{transform:var(--xeg-hover-lift);background:var(--xeg-color-surface-elevated);border-color:var(--xeg-border-emphasis)}.xg-huYo:focus-visible{border-color:var(--xeg-focus-indicator-color,var(--xeg-color-border-primary))}.xg-huYo.xg-xm-1{border-color:var(--xeg-border-emphasis,var(--xeg-color-border-strong));transition:var(--xeg-transition-interaction-fast);content-visibility:visible;will-change:transform}.xg-huYo.xg-xm-1:focus-visible{border-color:var(--xeg-focus-indicator-color,var(--xeg-color-border-strong))}.xg-huYo.xg-luqi{border-color:var(--xeg-focus-indicator-color,var(--xeg-color-border-primary));transition:var(--xeg-transition-interaction-fast);content-visibility:visible}.xg-8-c8{background:var(--xeg-color-bg-secondary);contain:layout paint;justify-content:center;align-items:center;width:fit-content;max-width:100%;margin:0 auto;display:flex;position:relative}.xg-huYo[data-fit-mode=original] .xg-8-c8{width:auto;max-width:none}.xg-huYo[data-media-loaded=false] .xg-8-c8{min-height:var(--xeg-spacing-3xl);aspect-ratio:var(--xeg-gallery-item-intrinsic-ratio,var(--xeg-aspect-default))}.xg-lhkE{background:var(--xeg-skeleton-bg);min-height:var(--xeg-spacing-3xl);justify-content:center;align-items:center;display:flex;position:absolute;inset:0}.xg-6YYD{--xeg-spinner-size:var(--xeg-spacing-lg);--xeg-spinner-border-width:.125rem;--xeg-spinner-track-color:var(--xeg-color-border-primary);--xeg-spinner-indicator-color:var(--xeg-color-primary)}.xg-FWlk,.xg-GUev{border-radius:var(--xeg-radius-md);object-fit:contain;pointer-events:auto;-webkit-user-select:none;user-select:none;-webkit-user-drag:none;will-change:opacity;transition:opacity var(--xeg-duration-normal) var(--xeg-ease-standard);display:block}@starting-style{:is(.xg-FWlk,.xg-GUev){opacity:0}}:is(.xg-FWlk,.xg-GUev).xg-8Z3S{opacity:0}:is(.xg-FWlk,.xg-GUev).xg-y9iP{opacity:1}.xg-GUev{inline-size:100%;overflow:clip}:is(.xg-FWlk,.xg-GUev).xg-yYtG{object-fit:none;block-size:auto;max-block-size:none;inline-size:auto;max-inline-size:none}:is(.xg-FWlk,.xg-GUev).xg-Uc0o{object-fit:scale-down;block-size:auto;max-block-size:none;inline-size:auto;max-inline-size:100%}:is(.xg-FWlk,.xg-GUev).xg-M9Z6{block-size:auto;inline-size:auto;max-inline-size:calc(100vw - var(--xeg-spacing-lg) * 2);max-block-size:var(--xeg-viewport-height-constrained);object-fit:scale-down}:is(.xg-FWlk,.xg-GUev).xg--Mlr{block-size:auto;inline-size:auto;max-inline-size:100%;max-block-size:var(--xeg-viewport-height-constrained);object-fit:contain}.xg-Wno7{font-size:var(--xeg-font-size-2xl);margin-bottom:var(--xeg-spacing-sm)}.xg-8-wi{font-size:var(--xeg-font-size-sm);text-align:center}.xg-Gswe{background:var(--xeg-color-error-bg);color:var(--xeg-color-error);min-height:var(--xeg-spacing-3xl);flex-direction:column;justify-content:center;align-items:center;display:flex;position:absolute;inset:0}.xg-huYo[data-media-loaded=false][data-fit-mode=original],.xg-huYo[data-media-loaded=false][data-fit-mode=original] .xg-FWlk,.xg-huYo[data-media-loaded=false][data-fit-mode=original] .xg-GUev{inline-size:min(var(--xeg-gallery-item-intrinsic-width,100%), 100%);max-inline-size:min(var(--xeg-gallery-item-intrinsic-width,100%), 100%);max-block-size:min(var(--xeg-gallery-item-intrinsic-height,var(--xeg-spacing-5xl)), var(--xeg-viewport-height-constrained))}.xg-huYo[data-media-loaded=false][data-has-intrinsic-size=true][data-fit-mode=fitHeight],.xg-huYo[data-media-loaded=false][data-has-intrinsic-size=true][data-fit-mode=fitContainer]{--xeg-gallery-fit-height-target:min(var(--xeg-gallery-item-intrinsic-height,var(--xeg-spacing-5xl)), var(--xeg-viewport-height-constrained));max-block-size:var(--xeg-gallery-fit-height-target);inline-size:min(100%, calc(var(--xeg-gallery-fit-height-target) * var(--xeg-gallery-item-intrinsic-ratio,1)));max-inline-size:min(100%, calc(var(--xeg-gallery-fit-height-target) * var(--xeg-gallery-item-intrinsic-ratio,1)))}.xg-huYo[data-media-loaded=false][data-has-intrinsic-size=true]:is([data-fit-mode=fitHeight],[data-fit-mode=fitContainer]) :is(.xg-FWlk,.xg-GUev){max-block-size:var(--xeg-gallery-fit-height-target);max-inline-size:min(100%, calc(var(--xeg-gallery-fit-height-target) * var(--xeg-gallery-item-intrinsic-ratio,1)))}.xg-huYo[data-media-loaded=false][data-has-intrinsic-size=true][data-fit-mode=fitWidth]{inline-size:100%;max-inline-size:100%}.xg-huYo[data-media-loaded=false][data-has-intrinsic-size=true][data-fit-mode=fitWidth] .xg-8-c8{inline-size:100%}.xg-huYo[data-media-loaded=false][data-has-intrinsic-size=true][data-fit-mode=fitWidth] :is(.xg-FWlk,.xg-GUev){inline-size:100%;max-inline-size:100%}@media (prefers-reduced-motion:reduce){.xg-huYo{transition:none}.xg-huYo.xg-xm-1{will-change:auto}.xg-huYo:hover{transform:none}:where(.xg-FWlk,.xg-GUev){will-change:auto;transition:none}}.xg-wQ6O{display:contents}.xg-rNmA{z-index:var(--xeg-z-tooltip,10005);max-width:16em;font-size:var(--xeg-tooltip-font-size,.75em);font-family:var(--xeg-font-family-ui);font-weight:var(--xeg-font-weight-normal);line-height:var(--xeg-line-height-snug);color:var(--xeg-tooltip-text,var(--xeg-toolbar-text-color,var(--xeg-color-text-primary)));text-align:center;white-space:nowrap;pointer-events:none;-webkit-user-select:none;user-select:none;background:var(--xeg-tooltip-bg,var(--xeg-toolbar-surface,var(--xeg-color-bg-elevated)));border:1px solid var(--xeg-tooltip-border,var(--xeg-toolbar-border));border-radius:var(--xeg-tooltip-radius,var(--xeg-radius-sm));box-shadow:var(--xeg-shadow-tooltip,0 2px 8px #00000026);opacity:0;transition:opacity var(--xeg-duration-fast,.15s) var(--xeg-ease-standard), transform var(--xeg-duration-fast,.15s) var(--xeg-ease-standard);padding:.35em .65em;position:fixed;transform:translate(-50%,.25em)}.xg-rNmA.xg-ge-p{transform:translate(-50%,.25em)}.xg-rNmA.xg-kpNX{transform:translate(-50%,-.25em)}.xg-rNmA.xg-JV6L{opacity:1;transform:translate(-50%)}.xg-guqM{border-style:solid;width:0;height:0;position:absolute;left:50%}.xg-46Rg{border-width:0 4px 5px;border-color:transparent transparent var(--xeg-tooltip-border,var(--xeg-toolbar-border)) transparent;top:-5px;transform:translate(-50%)}.xg-GobA{border-width:5px 4px 0;border-color:var(--xeg-tooltip-border,var(--xeg-toolbar-border)) transparent transparent transparent;bottom:-5px;transform:translate(-50%)}.xg-RfHK{border-style:solid;width:0;height:0;position:absolute;left:50%}.xg-a50g{border-width:0 3px 4px;border-color:transparent transparent var(--xeg-tooltip-bg,var(--xeg-toolbar-surface,var(--xeg-color-bg-elevated))) transparent;top:-4px;transform:translate(-50%)}.xg-t4Y3{border-width:4px 3px 0;border-color:var(--xeg-tooltip-bg,var(--xeg-toolbar-surface,var(--xeg-color-bg-elevated))) transparent transparent transparent;bottom:-4px;transform:translate(-50%)}@media (prefers-reduced-motion:reduce){.xg-rNmA{transition:none}}.xg-EeSh{gap:var(--xeg-settings-gap);padding:var(--xeg-settings-padding);flex-direction:column;display:flex}.xg-nm9B{gap:var(--space-sm)}.xg-PI5C{gap:var(--xeg-settings-control-gap);flex-direction:column;display:flex}.xg-VUTt{gap:var(--space-xs)}.xg-vhT3{font-size:var(--xeg-settings-label-font-size);font-weight:var(--xeg-settings-label-font-weight);color:var(--xeg-color-text-primary)}.xg-Y62M{font-size:var(--font-size-xs);color:var(--xeg-color-text-secondary);letter-spacing:var(--xeg-letter-spacing-wide);text-transform:uppercase}.xg-jpiS{width:100%;padding:var(--xeg-settings-select-padding);font-size:var(--xeg-settings-select-font-size);color:var(--xeg-color-text-primary);background-color:var(--xeg-toolbar-element-bg);border:var(--border-width-thin) solid var(--xeg-toolbar-border);border-radius:var(--xeg-radius-md);cursor:pointer;line-height:var(--xeg-line-height-snug);min-height:2.75em;transition:border-color var(--xeg-duration-fast) var(--xeg-ease-standard), background-color var(--xeg-duration-fast) var(--xeg-ease-standard), box-shadow var(--xeg-duration-fast) var(--xeg-ease-standard);overflow:visible;transform:none}.xg-jpiS:hover{border-color:var(--xeg-color-border-hover);background-color:var(--xeg-toolbar-element-bg-strong);box-shadow:0 0 0 2px color-mix(in oklch, var(--xeg-toolbar-border) 20%, transparent 80%)}.xg-jpiS:user-invalid{border-color:var(--xeg-color-error);box-shadow:0 0 0 3px color-mix(in oklch, var(--xeg-color-error) 25%, transparent 75%)}.xg-jpiS:focus,.xg-jpiS:focus-visible{border-color:var(--xeg-focus-indicator-color);box-shadow:0 0 0 3px color-mix(in oklch, var(--xeg-focus-indicator-color) 25%, transparent 75%)}.xg-jpiS option{line-height:var(--xeg-line-height-normal);padding:.5em .75em}@media (prefers-reduced-motion:reduce){.xg-jpiS{transition:none}}.xg-4eoj{color:var(--xeg-toolbar-text-color,var(--xeg-color-text-primary));cursor:pointer;font-size:.875em;font-weight:var(--xeg-font-weight-medium);width:var(--xeg-size-button-md);height:var(--xeg-size-button-md);min-width:var(--xeg-size-button-md);min-height:var(--xeg-size-button-md);aspect-ratio:1;border-radius:var(--xeg-radius-md);transition:var(--xeg-transition-surface-fast), transform var(--xeg-duration-fast) var(--xeg-ease-standard);background:0 0;border:none;padding:.5em;position:relative;overflow:clip}.xg-4eoj:focus{background:var(--xeg-toolbar-element-bg,var(--xeg-color-neutral-100))}.xg-4eoj:focus-visible{background:var(--xeg-toolbar-element-bg,var(--xeg-color-neutral-100));outline:2px solid var(--xeg-focus-indicator-color,currentColor);outline-offset:2px}.xg-fLg7{--toolbar-surface-base:var(--xeg-toolbar-panel-surface,var(--xeg-toolbar-surface,var(--xeg-color-bg-primary,Canvas)));--toolbar-surface-border:var(--xeg-toolbar-border);--xeg-button-disabled-opacity:1;background:var(--toolbar-surface-base);border-radius:var(--xeg-radius-lg);z-index:var(--xeg-z-toolbar,2147480000);display:var(--toolbar-display,inline-flex);height:3em;color:var(--xeg-toolbar-text-color,var(--xeg-color-text-primary));visibility:var(--toolbar-visibility,visible);opacity:var(--toolbar-opacity,1);pointer-events:var(--toolbar-pointer-events,auto);transition:var(--xeg-transition-elevation-normal);-webkit-user-select:none;user-select:none;overscroll-behavior:contain;border:none;justify-content:space-between;align-items:center;gap:0;padding:.5em 1em;position:fixed;top:1.25em;left:50%;transform:translate(-50%)}.xg-fLg7.xg-ZpP8,.xg-fLg7.xg-t4eq{border-radius:var(--xeg-radius-lg) var(--xeg-radius-lg) 0 0}.xg-fLg7.xg-ojCW,.xg-fLg7.xg-Y6KF,.xg-fLg7.xg-n-ab,.xg-fLg7.xg-bEzl{--toolbar-opacity:1;--toolbar-pointer-events:auto;--toolbar-visibility:visible;--toolbar-display:inline-flex}.xg-f8g4{justify-content:center;align-items:center;width:100%;max-width:100%;display:flex;overflow:hidden}.xg-Ix3j{justify-content:center;align-items:center;gap:var(--xeg-spacing-xs);flex-wrap:wrap;width:100%;display:flex}.xg-Ix3j\u003E.xg-4eoj{flex:none}.xg-0EHq{padding-inline:var(--xeg-spacing-sm);justify-content:center;align-items:center;min-width:5em;display:flex}.xg-FKnO{color:var(--xeg-toolbar-text-muted,var(--xeg-color-text-primary));margin:0 .125em}:where(.xg-4eoj[aria-pressed=true]){background:var(--xeg-toolbar-element-bg-strong,var(--xeg-color-neutral-200))}.xg-4eoj:disabled{--button-opacity:.5;color:var(--xeg-toolbar-text-muted,var(--xeg-color-neutral-400));cursor:not-allowed}@media (hover:hover){.xg-4eoj:hover:not(:disabled){background:var(--xeg-toolbar-element-bg,var(--xeg-color-neutral-100));transform:translateY(var(--xeg-button-lift))}}.xg-4eoj:active:not(:disabled){background:var(--xeg-toolbar-element-bg-strong,var(--xeg-color-neutral-200));transform:translateY(0)}.xg-atmJ{position:relative}.xg-GG86{box-sizing:border-box;gap:0;min-width:5em;min-height:2.5em;padding-bottom:.5em;position:relative}.xg-2cjm{color:var(--xeg-toolbar-text-color,var(--xeg-color-text-primary));font-size:var(--xeg-font-size-md);font-weight:var(--xeg-font-weight-semibold);text-align:center;white-space:nowrap;border-radius:var(--xeg-radius-md);background:0 0;border:none;padding:.25em .5em;line-height:1}.xg-JEXm{color:var(--xeg-toolbar-text-color,var(--xeg-color-text-primary));font-weight:var(--xeg-font-weight-bold)}.xg-d1et{color:var(--xeg-toolbar-text-color,var(--xeg-color-text-primary))}.xg-vB6N{background:var(--xeg-toolbar-progress-track,var(--xeg-color-neutral-200));border-radius:var(--xeg-radius-sm);width:3.75em;height:.125em;position:absolute;bottom:.125em;left:50%;overflow:clip;transform:translate(-50%)}.xg-LWQw{background:var(--xeg-toolbar-text-color,var(--xeg-color-text-primary));border-radius:var(--xeg-radius-sm);width:100%;height:100%;transition:var(--xeg-transition-width-normal);transform-origin:0}.xg-Q7dU,button.xg-Q7dU{transition:var(--xeg-transition-interaction-fast);z-index:10;pointer-events:auto;position:relative}.xg-Q7dU[data-selected=true]{--toolbar-button-accent-hover:var(--xeg-color-primary);--toolbar-button-focus-border:var(--xeg-color-primary-hover)}.xg-Q7dU:focus,.xg-Q7dU:focus-visible{border:none}@media (prefers-reduced-transparency:reduce){.xg-fLg7,[data-theme=dark] .xg-fLg7{background:var(--xeg-toolbar-panel-surface,var(--xeg-toolbar-surface))}}@media (prefers-reduced-motion:reduce){.xg-4eoj:hover:not(:disabled),.xg-atmJ:hover:not(:disabled),.xg-Vn14:hover:not(:disabled),.xg-Q7dU:hover{transform:none}.xg-fLg7,:where(.xg-JcF-,.xg-yRtv),:where(.xg-JcF-,.xg-yRtv).xg-4a2L,.xg-LWQw,.xg-AVKe,.xg-jmjG{transition:none}}:where(.xg-JcF-,.xg-yRtv){gap:var(--xeg-spacing-md);width:100%;padding:var(--xeg-spacing-lg);max-height:var(--xeg-toolbar-panel-max-height);opacity:0;visibility:hidden;pointer-events:none;transition:var(--xeg-toolbar-panel-transition), transform var(--xeg-duration-normal) var(--xeg-ease-standard), visibility 0s var(--xeg-duration-normal);background:var(--toolbar-surface-base,var(--xeg-toolbar-panel-surface,var(--xeg-toolbar-surface)));border-top:var(--border-width-thin) solid var(--toolbar-surface-border,var(--xeg-toolbar-border));border-radius:0 0 var(--xeg-radius-lg) var(--xeg-radius-lg);z-index:var(--xeg-z-toolbar-panel);will-change:transform, opacity;overscroll-behavior:contain;flex-direction:column;display:flex;position:absolute;top:100%;left:0;right:0;overflow:hidden;transform:translateY(-.5em)}.xg-JcF-{height:var(--xeg-toolbar-panel-height)}.xg-yRtv{min-height:var(--xeg-toolbar-panel-height)}:where(.xg-JcF-,.xg-yRtv).xg-4a2L{opacity:1;visibility:visible;pointer-events:auto;border-top-color:var(--toolbar-surface-border,var(--xeg-toolbar-border));height:auto;transition:var(--xeg-toolbar-panel-transition), transform var(--xeg-duration-normal) var(--xeg-ease-standard), visibility 0s 0s;z-index:var(--xeg-z-toolbar-panel-active);transform:translateY(0)}.xg-w56C{gap:var(--xeg-spacing-sm);flex-direction:column;display:flex}.xg-rSWg{padding-bottom:var(--xeg-spacing-xs);border-bottom:var(--border-width-thin) solid var(--toolbar-surface-border);margin-bottom:var(--xeg-spacing-sm);align-items:center;display:flex}.xg-jd-V{font-size:var(--xeg-font-size-sm);font-weight:var(--xeg-font-weight-semibold);color:var(--xeg-toolbar-text-color);text-transform:uppercase;letter-spacing:var(--xeg-letter-spacing-wide)}.xg-jmjG{padding:var(--xeg-spacing-sm) var(--xeg-spacing-md);font-size:var(--xeg-font-size-base);line-height:var(--xeg-line-height-snug);color:var(--xeg-toolbar-text-color,var(--xeg-color-text-primary));background:var(--toolbar-surface-base,var(--xeg-toolbar-panel-surface,var(--xeg-toolbar-surface)));border:var(--border-width-thin) solid var(--toolbar-surface-border,var(--xeg-toolbar-border));border-radius:var(--xeg-radius-md);white-space:pre-wrap;word-wrap:break-word;overscroll-behavior:contain;max-height:18em;transition:var(--xeg-transition-surface-fast);-webkit-user-select:text;user-select:text;cursor:text;overflow-y:auto}.xg-jmjG::-webkit-scrollbar{width:.5em}.xg-jmjG::-webkit-scrollbar-track{background:var(--xeg-toolbar-scrollbar-track,var(--xeg-color-neutral-200));border-radius:var(--xeg-radius-sm)}.xg-jmjG::-webkit-scrollbar-thumb{background:var(--xeg-toolbar-scrollbar-thumb,var(--xeg-color-neutral-400));border-radius:var(--xeg-radius-sm)}.xg-jmjG::-webkit-scrollbar-thumb:hover{background:var(--xeg-toolbar-element-bg-strong,var(--xeg-color-neutral-500))}.xg-jmjG a{color:var(--xeg-color-primary);font-weight:var(--xeg-font-weight-medium);border-radius:var(--xeg-radius-xs);overflow-wrap:break-word;transition:color var(--xeg-duration-fast) var(--xeg-ease-standard), background-color var(--xeg-duration-fast) var(--xeg-ease-standard);cursor:pointer;margin:-.125em -.25em;padding:.125em .25em;text-decoration:none}.xg-jmjG a:hover{color:var(--xeg-color-primary-hover);background:var(--xeg-toolbar-element-bg);text-underline-offset:.125em;text-decoration:underline;text-decoration-thickness:.0625rem}.xg-jmjG a:focus,.xg-jmjG a:focus-visible{background:var(--xeg-toolbar-element-bg-strong,var(--xeg-color-neutral-200));color:var(--xeg-color-primary-hover);border-radius:var(--xeg-radius-xs)}.xg-jmjG a:active{color:var(--xeg-color-primary-active)}.xg-0Eeq{align-items:center;gap:var(--xeg-spacing-xs);padding:var(--xeg-spacing-sm);margin-bottom:var(--xeg-spacing-sm);background:var(--xeg-toolbar-element-bg-strong);border:var(--border-width-thin) solid var(--toolbar-surface-border,var(--xeg-toolbar-border));border-radius:var(--xeg-radius-sm);transition:var(--xeg-transition-surface-fast);display:flex}.xg-0Eeq:hover{background:color-mix(in oklch, var(--xeg-toolbar-element-bg-strong) 85%, var(--xeg-color-primary) 15%);border-color:var(--xeg-color-border-hover)}.xg-AVKe{width:100%;color:var(--xeg-color-primary);font-size:var(--xeg-font-size-sm);font-weight:var(--xeg-font-weight-medium);transition:color var(--xeg-duration-fast) var(--xeg-ease-standard);align-items:center;gap:.375em;text-decoration:none;display:flex}.xg-AVKe:hover{color:var(--xeg-color-primary-hover)}.xg-AVKe:focus,.xg-AVKe:focus-visible{outline:.125rem solid var(--xeg-focus-indicator-color);outline-offset:.125rem;border-radius:var(--xeg-radius-xs)}.xg-5RjR{stroke:currentColor;flex-shrink:0;width:.875em;height:.875em}.xg-8Stf{color:var(--xeg-toolbar-text-muted,var(--xeg-color-text-secondary));font-weight:var(--xeg-font-weight-semibold);flex-shrink:0}.xg-3pwZ{color:var(--xeg-color-primary);text-overflow:ellipsis;white-space:nowrap;flex:1;overflow:hidden}.xg-sltl{width:100%;height:var(--border-width-thin);background:color-mix(in oklch, var(--toolbar-surface-border) 60%, transparent 40%);margin:var(--xeg-spacing-md) 0;border-radius:var(--xeg-radius-sm)}.xg-Rr2-{margin-bottom:.5rem;font-size:1rem;font-weight:600}.xg-yRlq{color:var(--xeg-color-text-secondary);max-width:32ch;margin-bottom:1rem}.xg-hFWG,.xg-Mhri{cursor:pointer;background:var(--xeg-color-bg-surface);border:1px solid var(--xeg-color-border-default);border-radius:var(--xeg-radius-md);padding:.5rem 1rem}.xg-hFWG:focus-visible,.xg-Mhri:focus-visible{outline:2px solid var(--xeg-color-primary);outline-offset:2px}.xg-Mhri{color:var(--xeg-color-text-secondary);border-color:var(--xeg-color-border-emphasis)}@layer xeg.features{.xeg-gallery-renderer[data-renderer=gallery]{width:0;height:0;display:block;overflow:visible}.xeg-gallery-overlay{z-index:var(--xeg-z-gallery,10000);background:var(--xeg-gallery-bg);opacity:1;transition:opacity var(--xeg-duration-normal) var(--xeg-ease-standard);pointer-events:auto;justify-content:center;align-items:center;display:flex;position:fixed;inset:0}.xeg-gallery-container{overscroll-behavior:contain;scrollbar-gutter:stable both-edges;flex-direction:column;width:100%;max-width:100vw;height:100%;max-height:100vh;display:flex;position:relative;overflow:hidden auto}}@media (prefers-reduced-motion:reduce){.xeg-gallery-overlay{transition:none}}@layer xeg.tokens{:where(:root,.xeg-theme-scope){--color-base-white:oklch(100% 0 0);--color-base-black:oklch(0% 0 0);--color-gray-50:oklch(97% .002 206.2);--color-gray-100:oklch(94.3% .006 206.2);--color-gray-200:oklch(89.6% .006 206.2);--color-gray-300:oklch(79.6% .006 206.2);--color-gray-400:oklch(69.6% .006 286.3);--color-gray-500:oklch(59.8% .006 286.3);--color-gray-600:oklch(48.8% .006 286.3);--color-gray-700:oklch(37.8% .005 286.3);--color-gray-800:oklch(30.6% .005 282);--color-gray-900:oklch(23.4% .006 277.8);--space-none:0;--space-xs:.25rem;--space-sm:.5rem;--space-md:1rem;--space-lg:1.5rem;--space-xl:2rem;--space-2xl:3rem;--space-3xl:4rem;--space-4xl:5rem;--radius-xs:.125em;--radius-sm:.25em;--radius-md:.375em;--radius-lg:.5em;--radius-2xl:1em;--radius-full:50%;--font-family-primary:\"TwitterChirp\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif;--font-size-xs:.75rem;--font-size-sm:.875rem;--font-size-base:.9375rem;--font-size-md:1rem;--font-size-lg:1.125rem;--font-size-xl:1.25rem;--font-size-2xl:1.5rem;--font-weight-normal:400;--font-weight-medium:500;--font-weight-semibold:600;--font-weight-bold:700;--duration-instant:.1s;--duration-fast:.15s;--duration-normal:.25s;--duration-slow:.3s;--duration-slower:.4s;--border-width-thin:.0625rem;--line-height-tight:1.25;--line-height-snug:1.375;--line-height-normal:1.5;--line-height-relaxed:1.75;--lightningcss-light:initial;--lightningcss-dark: ;--lightningcss-light:initial;--lightningcss-dark: ;color-scheme:light dark;--xeg-color-bg-primary:var(--lightningcss-light,var(--color-base-white))var(--lightningcss-dark,var(--color-gray-900));--xeg-color-bg-secondary:var(--lightningcss-light,var(--color-gray-50))var(--lightningcss-dark,var(--color-gray-800));--xeg-color-bg-surface:var(--lightningcss-light,var(--color-base-white))var(--lightningcss-dark,var(--color-gray-900));--xeg-color-bg-elevated:var(--lightningcss-light,var(--color-base-white))var(--lightningcss-dark,var(--color-gray-700));--xeg-bg-toolbar:var(--lightningcss-light,var(--color-base-white))var(--lightningcss-dark,var(--color-gray-800));--xeg-toolbar-border:var(--lightningcss-light,var(--color-gray-200))var(--lightningcss-dark,var(--color-gray-600));--xeg-toolbar-surface:var(--xeg-bg-toolbar);--xeg-toolbar-panel-surface:var(--xeg-toolbar-surface);--xeg-gallery-bg-light:var(--xeg-color-bg-primary);--xeg-gallery-bg-dark:var(--color-gray-900);--xeg-gallery-bg:var(--xeg-gallery-bg-light);--xeg-color-background:var(--lightningcss-light,var(--color-gray-50))var(--lightningcss-dark,var(--color-gray-900));--xeg-aspect-default:4 \u002F 3;--xeg-color-text-primary:var(--lightningcss-light,var(--color-base-black))var(--lightningcss-dark,var(--color-base-white));--xeg-color-text-secondary:var(--lightningcss-light,var(--color-gray-600))var(--lightningcss-dark,var(--color-gray-400));--xeg-color-border-default:var(--lightningcss-light,var(--color-gray-200))var(--lightningcss-dark,var(--color-gray-600));--xeg-color-border-emphasis:var(--lightningcss-light,var(--color-gray-500))var(--lightningcss-dark,var(--color-gray-400));--xeg-color-border-primary:var(--xeg-color-border-default);--xeg-color-border-hover:var(--lightningcss-light,var(--color-gray-300))var(--lightningcss-dark,var(--color-gray-500));--xeg-color-border-strong:var(--xeg-color-border-emphasis);--xeg-toolbar-text-color:var(--xeg-color-text-primary);--xeg-toolbar-text-muted:var(--lightningcss-light,var(--color-gray-500))var(--lightningcss-dark,var(--color-gray-300));--xeg-toolbar-element-bg:color-mix(in oklch, var(--xeg-bg-toolbar) 80%, var(--color-base-white) 20%);--xeg-toolbar-element-bg-strong:color-mix(in oklch, var(--xeg-bg-toolbar) 65%, var(--color-base-white) 35%);--xeg-toolbar-element-border:color-mix(in oklch, var(--xeg-toolbar-border) 85%, var(--color-base-white) 15%);--xeg-toolbar-progress-track:color-mix(in oklch, var(--xeg-toolbar-element-bg) 60%, var(--xeg-toolbar-element-border) 40%);--xeg-toolbar-scrollbar-track:color-mix(in oklch, var(--xeg-toolbar-element-bg) 50%, var(--color-base-white) 50%);--xeg-toolbar-scrollbar-thumb:color-mix(in oklch, var(--xeg-toolbar-element-border) 80%, var(--color-base-white) 20%);--xeg-color-success:oklch(55% .18 145);--xeg-color-success-hover:oklch(48% .18 145);--xeg-color-success-bg:oklch(90% .08 145);--xeg-color-error:oklch(50% .22 25);--xeg-color-error-hover:oklch(43% .22 25);--xeg-color-error-bg:oklch(90% .08 25);--xeg-color-info-bg:var(--lightningcss-light,var(--color-gray-50))var(--lightningcss-dark,var(--color-gray-800));--xeg-color-primary:var(--lightningcss-light,var(--color-gray-900))var(--lightningcss-dark,var(--color-gray-100));--xeg-color-primary-hover:var(--lightningcss-light,var(--color-gray-700))var(--lightningcss-dark,var(--color-gray-200));--xeg-color-primary-active:var(--lightningcss-light,var(--color-gray-800))var(--lightningcss-dark,var(--color-gray-300));--xeg-color-neutral-100:var(--color-gray-100);--xeg-color-neutral-200:var(--color-gray-200);--xeg-color-neutral-300:var(--color-gray-300);--xeg-color-neutral-400:var(--color-gray-400);--xeg-color-neutral-500:var(--color-gray-500);--xeg-color-text-tertiary:var(--lightningcss-light,var(--color-gray-500))var(--lightningcss-dark,var(--color-gray-400));--xeg-color-text-inverse:var(--color-base-white);--xeg-size-button-sm:2rem;--xeg-size-button-md:2.5em;--xeg-size-button-lg:3rem;--xeg-focus-indicator-color:var(--xeg-color-border-primary);--xeg-font-size-sm:var(--font-size-sm);--xeg-font-size-base:var(--font-size-base);--xeg-font-size-md:var(--font-size-md);--xeg-font-size-lg:var(--font-size-lg);--xeg-font-size-xl:var(--font-size-xl);--xeg-font-size-2xl:var(--font-size-2xl);--xeg-font-family-ui:-apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif;--xeg-font-weight-normal:var(--font-weight-normal);--xeg-font-weight-medium:var(--font-weight-medium);--xeg-font-weight-semibold:var(--font-weight-semibold);--xeg-font-weight-bold:var(--font-weight-bold);--xeg-line-height-tight:var(--line-height-tight);--xeg-line-height-snug:var(--line-height-snug);--xeg-line-height-relaxed:var(--line-height-relaxed);--xeg-letter-spacing-wide:.04em;--xeg-duration-fast:var(--duration-fast);--xeg-duration-normal:var(--duration-normal);--xeg-duration-toolbar:var(--duration-normal);--xeg-surface-bg:var(--lightningcss-light,var(--color-gray-50))var(--lightningcss-dark,var(--color-gray-900));--xeg-surface-border:var(--lightningcss-light,var(--color-gray-200))var(--lightningcss-dark,var(--color-gray-600));--xeg-surface-bg-hover:var(--lightningcss-light,var(--color-gray-50))var(--lightningcss-dark,var(--color-gray-800));--xeg-color-surface-elevated:var(--xeg-color-bg-elevated);--xeg-skeleton-bg:var(--xeg-color-bg-secondary);--xeg-border-emphasis:var(--xeg-color-border-emphasis);--xeg-z-gallery:9999;--xeg-z-toolbar-hover-zone:10001;--xeg-z-toolbar:10002;--xeg-z-toolbar-panel:10003;--xeg-z-toolbar-panel-active:10004;--xeg-z-tooltip:10005;--xeg-ease-standard:cubic-bezier(.4, 0, .2, 1);--xeg-ease-decelerate:cubic-bezier(0, 0, .2, 1);--xeg-ease-accelerate:cubic-bezier(.4, 0, 1, 1);--xeg-easing-linear:linear;--xeg-line-height-normal:var(--line-height-normal);--xeg-shadow-tooltip:0 2px 8px #00000026;--xeg-button-lift:-.0625rem;--xeg-opacity-disabled:.5;--xeg-opacity-loading:.8;--xeg-hover-lift:translateY(-.125rem);--xeg-spacing-none:var(--space-none);--xeg-spacing-xl:var(--space-xl);--xeg-spacing-5xl:var(--space-2xl);--xeg-radius-sm:var(--radius-sm);--xeg-radius-md:var(--radius-md);--xeg-radius-lg:var(--radius-lg);--xeg-radius-2xl:var(--radius-2xl);--xeg-radius-full:var(--radius-full);--xeg-scrollbar-thumb-color:var(--lightningcss-light,var(--color-gray-400))var(--lightningcss-dark,var(--color-gray-500));--xeg-scrollbar-thumb-hover-color:var(--lightningcss-light,var(--color-gray-500))var(--lightningcss-dark,var(--color-gray-400));--xeg-scrollbar-track-color:var(--lightningcss-light,var(--color-gray-200))var(--lightningcss-dark,var(--color-gray-700))}@media (prefers-color-scheme:dark){:where(:root,.xeg-theme-scope){--lightningcss-light: ;--lightningcss-dark:initial}}:where(:root,.xeg-theme-scope)[data-theme=dark]{--lightningcss-light: ;--lightningcss-dark:initial;color-scheme:dark;--xeg-gallery-bg:var(--xeg-gallery-bg-dark);--xeg-toolbar-text-color:var(--xeg-color-text-primary);--xeg-toolbar-element-bg:color-mix(in oklch, var(--xeg-bg-toolbar) 85%, var(--color-base-black) 15%);--xeg-toolbar-element-bg-strong:color-mix(in oklch, var(--xeg-bg-toolbar) 70%, var(--color-base-black) 30%);--xeg-toolbar-element-border:color-mix(in oklch, var(--xeg-toolbar-border) 75%, var(--color-base-black) 25%);--xeg-toolbar-progress-track:color-mix(in oklch, var(--xeg-toolbar-border) 65%, var(--xeg-bg-toolbar) 35%);--xeg-toolbar-scrollbar-track:color-mix(in oklch, var(--xeg-toolbar-element-bg) 80%, var(--color-base-black) 20%);--xeg-toolbar-scrollbar-thumb:color-mix(in oklch, var(--xeg-toolbar-element-border) 85%, var(--color-base-black) 15%)}:where(:root,.xeg-theme-scope)[data-theme=light]{--lightningcss-light:initial;--lightningcss-dark: ;color-scheme:light;--xeg-gallery-bg:var(--xeg-gallery-bg-light)}@media (prefers-reduced-motion:reduce){:where(:root,.xeg-theme-scope){--xeg-duration-fast:0s;--xeg-transition-surface-fast:none;--xeg-transition-elevation-normal:none;--xeg-transition-elevation-fast:none;--xeg-transition-interaction-fast:none;--xeg-transition-width-normal:none}}:where(:root,.xeg-theme-scope){--xeg-settings-gap:var(--space-md);--xeg-settings-padding:var(--space-md);--xeg-settings-control-gap:var(--space-sm);--xeg-settings-label-font-size:var(--font-size-sm);--xeg-settings-label-font-weight:var(--font-weight-bold);--xeg-settings-select-font-size:var(--font-size-sm);--xeg-settings-select-padding:var(--space-sm) var(--space-md);--xeg-toolbar-panel-transition:height var(--xeg-duration-normal) var(--xeg-ease-standard), opacity var(--xeg-duration-fast) var(--xeg-ease-standard);--xeg-toolbar-panel-height:0;--xeg-toolbar-panel-max-height:17.5rem;--xeg-scrollbar-width:.5rem;--xeg-scrollbar-border-radius:0;--xeg-hover-zone-height:7.5rem;--xeg-spinner-size-default:1rem;--xeg-spinner-border-width:.125rem;--xeg-spinner-track-color:color-mix(in oklch, var(--xeg-color-neutral-400) 60%, transparent);--xeg-spinner-indicator-color:var(--xeg-color-primary,currentColor);--xeg-spinner-duration:var(--xeg-duration-normal);--xeg-spinner-easing:var(--xeg-easing-linear);--xeg-transition-surface-fast:background-color var(--xeg-duration-fast) var(--xeg-ease-standard), border-color var(--xeg-duration-fast) var(--xeg-ease-standard), color var(--xeg-duration-fast) var(--xeg-ease-standard);--xeg-transition-elevation-normal:transform var(--xeg-duration-normal) var(--xeg-ease-standard), opacity var(--xeg-duration-normal) var(--xeg-ease-standard);--xeg-transition-elevation-fast:transform var(--xeg-duration-fast) var(--xeg-ease-standard), opacity var(--xeg-duration-fast) var(--xeg-ease-standard);--xeg-transition-interaction-fast:background-color var(--xeg-duration-fast) var(--xeg-ease-standard), border-color var(--xeg-duration-fast) var(--xeg-ease-standard), color var(--xeg-duration-fast) var(--xeg-ease-standard), transform var(--xeg-duration-fast) var(--xeg-ease-standard);--xeg-transition-width-normal:width var(--xeg-duration-normal) var(--xeg-ease-standard);--xeg-icon-stroke-width:.125rem;--xeg-icon-size:1.25em;--xeg-toolbar-icon-size:1.125rem;--xeg-spacing-xs:var(--space-xs);--xeg-spacing-sm:var(--space-sm);--xeg-spacing-md:var(--space-md);--xeg-spacing-lg:var(--space-lg);--xeg-spacing-3xl:var(--space-3xl);--xeg-viewport-height-constrained:90vh}}@layer xeg.base{:where(.xeg-gallery-root,.xeg-gallery-root *),:where(){box-sizing:border-box;margin:0;padding:0}.xeg-gallery-root button{cursor:pointer;font:inherit;color:inherit;background:0 0;border:none}.xeg-gallery-root a{color:inherit;text-decoration:none}.xeg-gallery-root img{max-width:100%;height:auto;display:block}.xeg-gallery-root ul,.xeg-gallery-root ol{list-style:none}.xeg-gallery-root input,.xeg-gallery-root textarea,.xeg-gallery-root select{font:inherit;color:inherit;background:0 0}.xeg-gallery-root ::-webkit-scrollbar{width:var(--xeg-scrollbar-width,.5rem);height:var(--xeg-scrollbar-width,.5rem)}.xeg-gallery-root ::-webkit-scrollbar-track{background:0 0}.xeg-gallery-root ::-webkit-scrollbar-thumb{background:var(--xeg-scrollbar-thumb-color);border-radius:var(--xeg-radius-sm,.25rem)}.xeg-gallery-root ::-webkit-scrollbar-thumb:hover{background:var(--xeg-scrollbar-thumb-hover-color)}.xeg-gallery-root{all:initial;--xeg-inherited:inherit;box-sizing:border-box;scroll-behavior:smooth;font-family:var(--font-family-primary);font-size:var(--font-size-base,.9375rem);line-height:var(--xeg-line-height-normal,1.5);color:var(--xeg-color-text-primary,currentColor);width:100vw;height:100vh;z-index:var(--xeg-z-gallery,10000);isolation:isolate;contain:style paint;overscroll-behavior:contain;background:var(--xeg-gallery-bg,var(--xeg-color-bg-primary,Canvas));pointer-events:auto;-webkit-user-select:none;user-select:none;will-change:opacity, transform;-moz-text-size-adjust:100%;text-size-adjust:100%;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;display:block;position:fixed;inset:0}}@layer xeg.utilities{.xeg-row-center{align-items:center;display:flex}.xeg-inline-center{justify-content:center;align-items:center;display:inline-flex}.xeg-gap-sm{gap:var(--xeg-spacing-sm)}.xeg-sr-only{clip:rect(0, 0, 0, 0);white-space:nowrap;border:0;width:1px;height:1px;margin:-1px;padding:0;position:absolute;overflow:hidden}.xeg-fade-in{animation:xeg-fade-in var(--xeg-duration-normal) var(--xeg-ease-decelerate);animation-fill-mode:both}.xeg-fade-out{animation:xeg-fade-out var(--xeg-duration-fast) var(--xeg-ease-accelerate);animation-fill-mode:both}@media (prefers-reduced-motion:reduce){.xeg-fade-in,.xeg-fade-out{animation:none}}}@layer xeg.overrides;\n\u002F*$vite$:1*\u002F";})();
var XcomEnhancedGallery = (function(exports) {
	Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
	//#region src/platform/detect.ts
	function detectPlatform() {
		try {
			if (typeof chrome !== "undefined" && chrome.runtime?.id && typeof chrome.storage?.local !== "undefined") return "mv3-extension";
		} catch {}
		return "userscript";
	}
	var IS_MV3 = detectPlatform() === "mv3-extension";
	//#endregion
	//#region src/constants/performance.ts
	/** Default request timeout for fetch-based downloads */
	var DEFAULT_REQUEST_TIMEOUT_MS = 3e4;
	/**
	* Delay (ms) before revoking a blob object URL after the background SW
	* confirms it has started the download. This prevents a race condition
	* where Chrome's download manager hasn't begun reading the blob data
	* before the URL is revoked, resulting in 0-byte or corrupted files.
	*
	* 2000ms is conservative — Chrome typically starts reading blobs within
	* a few hundred ms, but the delay only affects cleanup (JS heap) not
	* user-facing latency, so a generous margin is safe.
	*/
	var BLOB_URL_REVOKE_DELAY_MS = 2e3;
	/** GM download timeout in milliseconds (userscript adapter) */
	var GM_DOWNLOAD_TIMEOUT_MS = 6e4;
	//#endregion
	//#region src/shared/external/userscript/adapter.ts
	/**
	* @fileoverview Userscript API adapter with robust download strategy.
	*
	* Download strategy (in priority order):
	* 1. GM.download (GM4+/Tampermonkey Promise-based) — if available
	* 2. GM_download options-object form — works in TM/VM/GM
	* 3. Blob-based fallback via GM_xmlhttpRequest + anchor download — universal
	*
	* The URL-only form GM_download(url, filename) is NEVER used because:
	* - Greasemonkey 4.x doesn't support it
	* - Tampermonkey may ignore filename (uses CDN Content-Disposition)
	* - Violentmonkey only supports options-object form
	*
	* Blob URL handling:
	* GM.download ignores the `filename` parameter for blob: URLs, instead
	* extracting the UUID from the URL path. All blob downloads use anchor
	* element download (`<a download>`) to guarantee correct filenames.
	*
	* Anchor placement:
	* Anchors are appended to `.xeg-gallery-root` (when present) instead of
	* `document.body` to prevent gallery close-on-outside-click handlers
	* from detecting the synthetic click as an "outside" click.
	*/
	function getGMAPIs() {
		const g = globalThis;
		return {
			download: typeof g.GM !== "undefined" && g.GM !== null ? g.GM.download : void 0,
			downloadLegacy: g.GM_download,
			setValue: g.GM_setValue,
			getValue: g.GM_getValue,
			deleteValue: g.GM_deleteValue,
			listValues: g.GM_listValues,
			xmlHttpRequest: g.GM_xmlhttpRequest,
			notification: g.GM_notification,
			cookie: g.GM_cookie
		};
	}
	function asFunction(value) {
		return typeof value === "function" ? value : void 0;
	}
	/**
	* Anchor-based download using `<a download>` element.
	*
	* Appends to gallery root when present to avoid triggering
	* document.body capture-phase listeners (gallery close-on-outside-click).
	* Falls back to document.body when gallery is not open.
	*/
	function anchorDownload(url, filename) {
		return new Promise((resolve, reject) => {
			try {
				const a = document.createElement("a");
				a.href = url;
				a.download = filename;
				a.style.display = "none";
				(document.querySelector(".xeg-gallery-root") ?? document.body).appendChild(a);
				a.click();
				queueMicrotask(() => {
					a.remove();
					resolve();
				});
			} catch (error) {
				reject(error);
			}
		});
	}
	/**
	* Blob-based download fallback using GM_xmlhttpRequest + anchor element.
	* Works in all userscript environments regardless of GM_download support.
	*/
	async function downloadViaBlob(url, filename, xmlHttpRequest) {
		return new Promise((resolve, reject) => {
			let objectUrl = null;
			const control = xmlHttpRequest({
				method: "GET",
				url,
				responseType: "blob",
				timeout: GM_DOWNLOAD_TIMEOUT_MS,
				onload: (response) => {
					try {
						objectUrl = URL.createObjectURL(response.response);
						anchorDownload(objectUrl, filename).then(resolve).catch(reject).finally(() => {
							if (objectUrl) URL.revokeObjectURL(objectUrl);
						});
					} catch (error) {
						if (objectUrl) URL.revokeObjectURL(objectUrl);
						reject(error);
					}
				},
				onerror: () => {
					control.abort();
					reject(/* @__PURE__ */ new Error("GM_xmlhttpRequest failed"));
				},
				ontimeout: () => {
					control.abort();
					reject(/* @__PURE__ */ new Error("GM_xmlhttpRequest timed out"));
				},
				onabort: () => reject(new DOMException("Aborted", "AbortError"))
			});
		});
	}
	var cachedUserscriptAPI = null;
	function getUserscript() {
		if (cachedUserscriptAPI) return cachedUserscriptAPI;
		const g = getGMAPIs();
		const gmDownloadModern = asFunction(g.download);
		const gmDownloadLegacy = asFunction(g.downloadLegacy);
		const gmSetValue = asFunction(g.setValue);
		const gmGetValue = asFunction(g.getValue);
		const gmDeleteValue = asFunction(g.deleteValue);
		const gmListValues = asFunction(g.listValues);
		const gmXmlHttpRequest = asFunction(g.xmlHttpRequest);
		const gmNotification = asFunction(g.notification);
		if (!gmDownloadModern && !gmDownloadLegacy) throw new Error("GM_download unavailable");
		if (!gmXmlHttpRequest) throw new Error("GM_xmlhttpRequest unavailable");
		const cookieCandidate = g.cookie;
		cachedUserscriptAPI = {
			async download(url, filename) {
				if (url.startsWith("blob:")) return anchorDownload(url, filename);
				if (gmDownloadModern) return new Promise((resolve, reject) => {
					try {
						gmDownloadModern({
							url,
							filename,
							saveAs: false,
							timeout: GM_DOWNLOAD_TIMEOUT_MS,
							onload: () => resolve(),
							onerror: (error) => reject(error),
							ontimeout: () => reject(/* @__PURE__ */ new Error("GM_download timed out"))
						});
					} catch (error) {
						reject(error);
					}
				});
				if (gmDownloadLegacy) return new Promise((resolve, reject) => {
					gmDownloadLegacy({
						url,
						filename,
						saveAs: false,
						timeout: GM_DOWNLOAD_TIMEOUT_MS,
						onload: () => resolve(),
						onerror: (error) => reject(error),
						ontimeout: () => reject(/* @__PURE__ */ new Error("GM_download timed out"))
					});
				});
				return downloadViaBlob(url, filename, gmXmlHttpRequest);
			},
			async downloadBlob(blob, filename) {
				const url = URL.createObjectURL(blob);
				try {
					await anchorDownload(url, filename);
				} finally {
					URL.revokeObjectURL(url);
				}
			},
			async setValue(key, value) {
				if (!gmSetValue) throw new Error("GM_setValue unavailable");
				await Promise.resolve(gmSetValue(key, value));
			},
			async getValue(key, defaultValue) {
				if (!gmGetValue) throw new Error("GM_getValue unavailable");
				return await Promise.resolve(gmGetValue(key, defaultValue));
			},
			getValueSync(key, defaultValue) {
				if (!gmGetValue) return defaultValue;
				const value = gmGetValue(key, defaultValue);
				if (value instanceof Promise) return defaultValue;
				return value;
			},
			async deleteValue(key) {
				if (!gmDeleteValue) throw new Error("GM_deleteValue unavailable");
				await Promise.resolve(gmDeleteValue(key));
			},
			async listValues() {
				if (!gmListValues) throw new Error("GM_listValues unavailable");
				const values = await Promise.resolve(gmListValues());
				return Array.isArray(values) ? values : [];
			},
			xmlHttpRequest(details) {
				if (!gmXmlHttpRequest) throw new Error("GM_xmlhttpRequest unavailable");
				return gmXmlHttpRequest(details);
			},
			notification(details) {
				if (!gmNotification) return;
				try {
					gmNotification(details, void 0);
				} catch {}
			},
			cookie: cookieCandidate && typeof cookieCandidate.list === "function" ? cookieCandidate : void 0
		};
		return cachedUserscriptAPI;
	}
	//#endregion
	//#region src/constants/media.ts
	/** @fileoverview Media-related constants for X.com media handling. */
	var MEDIA_HOSTS = { MEDIA_CDN: ["pbs.twimg.com", "video.twimg.com"] };
	var MEDIA = {
		DOMAINS: [...MEDIA_HOSTS.MEDIA_CDN, "abs.twimg.com"],
		HOSTS: MEDIA_HOSTS,
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
		}
	};
	/** Default fallback dimensions when media size cannot be determined. */
	var DEFAULT_MEDIA_DIMENSIONS = {
		width: 540,
		height: 720
	};
	/** Epsilon for volume comparison with floating-point tolerance. */
	var VOLUME_EPSILON = .001;
	//#endregion
	//#region src/shared/utils/url/host.ts
	/**
	* Host validation utilities to prevent substring-based URL checks.
	*
	* Provides helpers for parsing URLs safely (with protocol-relative and
	* relative support) and matching against allow-listed hostnames.
	*/
	var FALLBACK_BASE_URL = "https://x.com";
	/**
	* Attempt to parse any URL-like value into a `URL` instance.
	*
	* - Supports absolute URLs
	* - Supports protocol-relative URLs (//cdn.example.com/...)
	* - Supports relative paths resolved against https://x.com
	*/
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
	/**
	* Determine whether a URL belongs to a trusted host list without relying on substring checks.
	*
	* Performs exact hostname comparison, with optional subdomain matching.
	* Both the input hostname and the allow-list entries are lowercased before comparison.
	*
	* @param value - URL string, URL object, or null/undefined
	* @param allowedHosts - List of trusted hostnames
	* @param options - Matching options (e.g., allowSubdomains)
	* @returns True if the hostname matches an allowed host
	*/
	function isHostMatching(value, allowedHosts, options = {}) {
		if (!Array.isArray(allowedHosts)) return false;
		const parsed = value instanceof URL ? value : tryParseUrl(value);
		if (!parsed) return false;
		const hostname = parsed.hostname.toLowerCase();
		const allowSubdomains = options.allowSubdomains === true;
		return allowedHosts.some((host) => {
			const normalized = host.toLowerCase();
			return hostname === normalized || allowSubdomains && hostname.endsWith(`.${normalized}`);
		});
	}
	/** Reserved Twitter/X.com paths that are not usernames */
	var RESERVED_TWITTER_PATHS_ARRAY = Object.freeze([
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
	var RESERVED_TWITTER_PATHS = new Set(RESERVED_TWITTER_PATHS_ARRAY);
	/** Valid Twitter username pattern: 1-15 alphanumeric or underscore characters */
	var TWITTER_USERNAME_PATTERN = /^[a-zA-Z0-9_]{1,15}$/;
	/** Minimum number of path segments required for username extraction (/username/status/id). */
	var MIN_USERNAME_PATH_SEGMENTS = 3;
	/** Trusted Twitter/X.com hosts */
	var TWITTER_HOSTS = Object.freeze(["twitter.com", "x.com"]);
	/**
	* Extract Twitter username from a URL path.
	*
	* Supports both absolute URLs (https://twitter.com/user/status/123)
	* and relative paths (/user/status/123).
	*
	* Only extracts username when path follows the pattern /username/status/id
	* where 'status' is the second segment.
	*
	* @param url - URL or path to extract username from
	* @param options - Extraction options
	* @returns Username or null if not found/invalid
	*/
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
			if (segments.length >= MIN_USERNAME_PATH_SEGMENTS && segments[1] === "status") {
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
	//#endregion
	//#region src/shared/utils/url/url-safety.ts
	/**
	* @fileoverview Centralized SSRF-prevention URL whitelist.
	*
	* Single source of truth for ALLOWED_HOSTS so that both the MV3 background
	* SW and the GM HTTP request adapter enforce the same policy. Never
	* independently maintain a duplicate host list elsewhere.
	*/
	/**
	* Canonical set of hostnames allowed for cross-origin requests.
	* Shared by the MV3 background SW and the GM HTTP request adapter.
	* Do NOT duplicate this set elsewhere — import it.
	*/
	var ALLOWED_HOSTS = /* @__PURE__ */ new Set([...TWITTER_HOSTS, ...MEDIA.DOMAINS]);
	/**
	* Validate that a URL targets an allowed host, with additional path-level
	* restriction for Twitter hosts (only /i/api/ paths are permitted).
	*
	* DESIGN NOTE: Twitter/X hosts are restricted to /i/api/ paths because
	* the download relay only handles media downloads (which use the API).
	* Non-API URLs (e.g., https://twitter.com/some-tweet) are intentionally
	* blocked. Media downloads from pbs.twimg.com and video.twimg.com always
	* pass since those domains are in MEDIA.DOMAINS and bypass the path check.
	* If non-API downloads from twitter.com/x.com are needed in the future,
	* this path restriction must be relaxed or extended.
	*
	* @param url - The URL to validate
	* @returns true if the URL is valid and its host is in the allowed whitelist
	*          (with Twitter path restrictions applied)
	*/
	function isAllowedUrl(url) {
		try {
			const parsed = new URL(url);
			if (parsed.protocol !== "https:") return false;
			if (parsed.port !== "" && parsed.port !== "443") return false;
			if (!ALLOWED_HOSTS.has(parsed.hostname)) return false;
			if (TWITTER_HOSTS.includes(parsed.hostname)) return parsed.pathname.startsWith("/i/api/");
			return true;
		} catch {
			return false;
		}
	}
	//#endregion
	//#region src/platform/gm-http-request-adapter.ts
	/**
	* GM (userscript) HTTP request adapter.
	*
	* Wraps GM_xmlhttpRequest for cross-origin HTTP requests in userscript environments.
	*/
	/**
	* Validate that a URL target is allowed by the shared SSRF prevention policy.
	* Throws synchronously if the URL is invalid, not in the allowed host set,
	* or violates path-level restrictions for Twitter hosts.
	*/
	function validateUrl(url) {
		if (!isAllowedUrl(url)) throw new Error(`URL not in allowed whitelist: ${url}`);
	}
	var GMHttpRequestAdapter = class {
		request(details) {
			validateUrl(details.url);
			const gm = getUserscript();
			const gmDetails = { url: details.url };
			if (details.method !== void 0) gmDetails.method = details.method;
			if (details.headers !== void 0) gmDetails.headers = details.headers;
			if (details.data !== void 0) gmDetails.data = details.data;
			if (details.responseType !== void 0) gmDetails.responseType = details.responseType;
			if (details.timeout !== void 0) gmDetails.timeout = details.timeout;
			if (details.onload !== void 0) gmDetails.onload = details.onload;
			if (details.onerror !== void 0) gmDetails.onerror = details.onerror;
			if (details.ontimeout !== void 0) gmDetails.ontimeout = details.ontimeout;
			if (details.onabort !== void 0) gmDetails.onabort = details.onabort;
			if (details.onprogress !== void 0) gmDetails.onprogress = details.onprogress;
			let gmControl;
			try {
				gmControl = gm.xmlHttpRequest(gmDetails);
			} catch (_error) {
				details.onerror?.({
					finalUrl: details.url,
					readyState: 0,
					status: 0,
					statusText: "NETWORK_ERROR",
					responseHeaders: "",
					response: null,
					responseText: ""
				});
				return { abort: () => {} };
			}
			return { abort: () => gmControl.abort() };
		}
	};
	//#endregion
	//#region src/platform/gm-notification-adapter.ts
	/**
	* GM (userscript) notification adapter.
	*
	* Wraps GM_notification for userscript environments.
	*/
	var GMNotificationAdapter = class {
		notify(title, message, imageUrl) {
			getUserscript().notification({
				title,
				text: message,
				image: imageUrl
			});
		}
	};
	//#endregion
	//#region src/platform/gm-storage-adapter.ts
	/**
	* GM (userscript) storage adapter.
	*
	* Wraps GM_setValue/GM_getValue/GM_deleteValue/GM_listValues.
	* Provides synchronous getSync() — a userscript-only feature.
	*/
	var GMStorageAdapter = class {
		get gm() {
			return getUserscript();
		}
		async get(key, defaultValue) {
			return this.gm.getValue(key, defaultValue);
		}
		async set(key, value) {
			await this.gm.setValue(key, value);
		}
		async remove(key) {
			await this.gm.deleteValue(key);
		}
		async listKeys() {
			return this.gm.listValues();
		}
		getSync(key, defaultValue) {
			return this.gm.getValueSync(key, defaultValue);
		}
	};
	//#endregion
	//#region src/shared/error/cancellation.ts
	var USER_CANCELLED_MESSAGE = "Download cancelled by user";
	function isAbortError(value) {
		return value instanceof DOMException && (value.name === "AbortError" || value.name === "TimeoutError");
	}
	function isUserCancelledAbortError(error) {
		return error instanceof DOMException && error.name === "AbortError" && error.message === "Download cancelled by user";
	}
	function createAbortError(message, cause) {
		const error = new DOMException(message, "AbortError");
		if (cause !== void 0) error.cause = cause;
		return error;
	}
	function createUserCancelledAbortError(cause) {
		return createAbortError(USER_CANCELLED_MESSAGE, cause);
	}
	function getUserCancelledAbortErrorFromSignal(signal) {
		const reason = signal?.reason;
		if (reason instanceof DOMException) {
			if (reason.name === "TimeoutError" || isUserCancelledAbortError(reason)) return reason;
		}
		if (reason instanceof Error) {
			if (reason.name === "TimeoutError" || isUserCancelledAbortError(reason)) return reason;
		}
		return createUserCancelledAbortError(reason);
	}
	function getAbortReasonOrAbortErrorFromSignal(signal) {
		const reason = signal?.reason;
		if (reason instanceof DOMException) return reason;
		if (reason instanceof Error) return reason;
		return createAbortError("This operation was aborted", reason);
	}
	//#endregion
	//#region src/platform/chrome-runtime.ts
	var browserApi = globalThis.browser ?? globalThis.chrome;
	//#endregion
	//#region src/platform/mv3-download-adapters.ts
	/**
	* MV3 extension download adapter.
	*
	* Relays download requests to the background service worker via
	* chrome.runtime.sendMessage (Promise-based).
	* The SW handles chrome.downloads.download() which requires permissions
	* unavailable in content scripts directly.
	*
	* Architecture notes:
	* - URL.createObjectURL is NOT available in Service Workers, so blob
	*   downloads create the object URL in the content script context.
	*   The object URL (string) is sent to the SW, which passes it to
	*   chrome.downloads.download(). This is critical: content-script blob
	*   URLs persist with the PAGE lifetime, whereas SW-created blob URLs
	*   become invalid when the ephemeral SW is terminated by Chrome's MV3
	*   idle timeout, causing silent download failures.
	* - Promise-based sendMessage is required; the callback pattern (3rd arg)
	*   does not work when the receiver responds asynchronously.
	* - URL revocation for blob downloads is delayed to avoid a race condition
	*   where Chrome's download manager hasn't started reading the blob data
	*   before the object URL is revoked, resulting in 0-byte or corrupted files.
	* - Timeout is handled exclusively by the SW's waitForDownloadComplete.
	*   The adapter does not impose its own timeout — the SW's 5-minute timeout
	*   is the single point of timeout responsibility.
	*/
	/**
	* Check if a sendMessage response indicates success.
	* Returns the structured error string on failure, or undefined on success.
	*/
	function unwrapResponse(response) {
		if (!response || typeof response !== "object") return "Empty or invalid response from background SW";
		const r = response;
		if (r.success === true) return void 0;
		return typeof r.error === "string" && r.error.length > 0 ? r.error : "Download failed";
	}
	function sendCancelRequest(requestId) {
		browserApi.runtime.sendMessage({
			type: "DOWNLOAD_CANCEL_REQUEST",
			payload: { requestId }
		}).catch(() => void 0);
	}
	var MV3DownloadAdapter = class {
		/** MV3 background SW cannot download twimg.com URLs directly — needs content-script fetch */
		needsBlobFallback() {
			return true;
		}
		async download(url, filename, headers, signal) {
			await this.sendDownloadRequest({
				type: "DOWNLOAD_REQUEST",
				payload: {
					url,
					filename,
					...headers ? { headers } : {}
				}
			}, signal);
		}
		async downloadBlob(blob, filename, signal) {
			const objectUrl = URL.createObjectURL(blob);
			try {
				await this.sendDownloadRequest({
					type: "DOWNLOAD_BLOB_URL_REQUEST",
					payload: {
						objectUrl,
						filename,
						mimeType: blob.type
					}
				}, signal);
			} finally {
				setTimeout(() => {
					URL.revokeObjectURL(objectUrl);
				}, BLOB_URL_REVOKE_DELAY_MS);
			}
		}
		async sendDownloadRequest(message, signal) {
			const requestId = crypto.randomUUID();
			const request = {
				...message,
				payload: {
					...message.payload,
					requestId
				}
			};
			let rejectAbort = null;
			const abortPromise = signal ? new Promise((_, reject) => {
				rejectAbort = reject;
			}) : null;
			const onAbort = () => {
				sendCancelRequest(requestId);
				rejectAbort?.(getUserCancelledAbortErrorFromSignal(signal));
			};
			signal?.addEventListener("abort", onAbort, { once: true });
			try {
				if (signal?.aborted) {
					onAbort();
					await abortPromise;
					return;
				}
				const responsePromise = browserApi.runtime.sendMessage(request).then((response) => response);
				const error = unwrapResponse(await (abortPromise ? Promise.race([responsePromise, abortPromise]) : responsePromise));
				if (error) throw new Error(error);
			} finally {
				signal?.removeEventListener("abort", onAbort);
			}
		}
	};
	//#endregion
	//#region src/platform/mv3-http-request-adapters.ts
	/**
	* MV3 extension HTTP request adapter.
	*
	* Uses fetch() directly for same-origin requests.
	* For cross-origin requests, docstring previously claimed SW relay but
	* cross-origin requests go through fetch() directly in the content script
	* context (which has host_permissions to bypass CORS for allowed hosts).
	* If Twitter's CSP or CORS headers ever block content-script fetch(),
	* a SW relay can be implemented by extending the message protocol.
	*/
	var MV3HttpRequestAdapter = class {
		request(details) {
			if (!isAllowedUrl(details.url)) {
				details.onerror?.(this.createErrorResponse(details.url, 0));
				return { abort: () => {} };
			}
			const controller = new AbortController();
			let timedOut = false;
			const timeoutId = setTimeout(() => {
				timedOut = true;
				controller.abort();
			}, details.timeout ?? 3e4);
			this.fetchWithController(details, controller).then((response) => {
				clearTimeout(timeoutId);
				details.onload?.(response);
			}).catch((error) => {
				clearTimeout(timeoutId);
				if (timedOut) details.ontimeout?.(this.createErrorResponse(details.url, 0));
				else if (error instanceof DOMException && error.name === "AbortError") details.onabort?.(this.createErrorResponse(details.url, 0));
				else details.onerror?.(this.createErrorResponse(details.url, 0));
			});
			return { abort: () => {
				clearTimeout(timeoutId);
				controller.abort();
			} };
		}
		async fetchWithController(details, controller) {
			const fetchInit = {
				method: details.method ?? "GET",
				signal: controller.signal
			};
			if (details.headers !== void 0) fetchInit.headers = details.headers;
			if (details.data !== void 0 && details.method !== "GET" && details.method !== "HEAD") fetchInit.body = typeof details.data === "string" || details.data instanceof Blob || details.data instanceof ArrayBuffer || details.data instanceof URLSearchParams ? details.data : typeof details.data === "object" ? JSON.stringify(details.data) : details.data;
			const response = await fetch(details.url, fetchInit);
			let responseBody;
			const responseType = details.responseType ?? "text";
			switch (responseType) {
				case "json":
					responseBody = await response.json();
					break;
				case "blob":
					responseBody = await response.blob();
					break;
				case "arraybuffer":
					responseBody = await response.arrayBuffer();
					break;
				default: responseBody = await response.text();
			}
			const headersArray = [];
			response.headers.forEach((value, key) => {
				headersArray.push(`${key}: ${value}`);
			});
			return {
				finalUrl: response.url,
				readyState: 4,
				status: response.status,
				statusText: response.statusText,
				responseHeaders: headersArray.join("\r\n"),
				response: responseBody,
				responseText: responseType === "text" || responseType === "json" || responseType === void 0 ? typeof responseBody === "string" ? responseBody : JSON.stringify(responseBody) : ""
			};
		}
		createErrorResponse(url, status) {
			return {
				finalUrl: url,
				readyState: 0,
				status,
				statusText: status === 0 ? "NETWORK_ERROR" : `HTTP_${status}`,
				responseHeaders: "",
				response: null,
				responseText: ""
			};
		}
	};
	//#endregion
	//#region src/platform/mv3-notification-adapters.ts
	/**
	* MV3 extension notification adapter.
	*
	* Relays notification requests to the background service worker via
	* chrome.runtime.sendMessage. ISOLATED world content scripts cannot
	* access chrome.notifications directly — it's only available in
	* extension pages (background SW, popup, options).
	*/
	var MV3NotificationAdapter = class {
		idCounter = 0;
		notify(title, message, imageUrl) {
			const id = `xeg-${Date.now()}-${++this.idCounter}`;
			browserApi.runtime.sendMessage({
				type: "SHOW_NOTIFICATION",
				payload: {
					id,
					title,
					message,
					imageUrl
				}
			}).catch(() => {});
		}
	};
	//#endregion
	//#region src/platform/mv3-storage-adapters.ts
	/**
	* MV3 extension storage adapter.
	*
	* Uses chrome.storage.local for persistent storage.
	* All methods are async — no synchronous getSync() support.
	*/
	var MV3StorageAdapter = class {
		async get(key, defaultValue) {
			const value = (await browserApi.storage.local.get(key))[key];
			if (value === void 0 || value === null) return defaultValue;
			return value;
		}
		async set(key, value) {
			await browserApi.storage.local.set({ [key]: value });
		}
		async remove(key) {
			await browserApi.storage.local.remove(key);
		}
		async listKeys() {
			const result = await browserApi.storage.local.get(null);
			return Object.keys(result);
		}
	};
	//#endregion
	//#region src/platform/platform-adapters.ts
	/**
	* @fileoverview Consolidated platform adapter singletons.
	*
	* Provides lazy singleton adapter factories for all platform abstractions
	* (storage, download, HTTP request, notification) that dispatch between
	* MV3 extension and userscript (GM) implementations.
	*
	* Previously split across adapter-factory.ts + 4 wrapper files, consolidated
	* here to eliminate over-engineering.
	*/
	/**
	* Create a lazy singleton adapter that dispatches between MV3 and userscript.
	* Memoizes the instance on first call.
	*/
	function createAdapter(mv3Factory, gmFactory) {
		let instance = null;
		return () => {
			if (!instance) instance = IS_MV3 ? mv3Factory() : gmFactory();
			return instance;
		};
	}
	/**
	* Returns the singleton storage adapter for the current platform.
	* - MV3 extension: chrome.storage.local
	* - Userscript: GM_getValue/GM_setValue
	*/
	var getStorageAdapter = createAdapter(() => new MV3StorageAdapter(), () => new GMStorageAdapter());
	/**
	* Returns the singleton download adapter for the current platform.
	* - MV3 extension: MV3DownloadAdapter (chrome.downloads via background SW)
	* - Userscript: GM_download directly
	*/
	var getDownloadAdapter = createAdapter(() => new MV3DownloadAdapter(), () => {
		const api = getUserscript();
		return {
			download: (url, filename, _headers, _signal) => api.download(url, filename),
			downloadBlob: (blob, filename, _signal) => api.downloadBlob(blob, filename),
			needsBlobFallback: () => false
		};
	});
	/**
	* Returns the singleton HTTP request adapter for the current platform.
	* - MV3 extension: fetch-based
	* - Userscript: GM_xmlhttpRequest
	*/
	var getHttpRequestAdapter = createAdapter(() => new MV3HttpRequestAdapter(), () => new GMHttpRequestAdapter());
	/**
	* Returns the singleton notification adapter for the current platform.
	* - MV3 extension: chrome.notifications
	* - Userscript: GM_notification
	*/
	var getNotificationAdapter = createAdapter(() => new MV3NotificationAdapter(), () => new GMNotificationAdapter());
	//#endregion
	//#region src/shared/container/settings-registry.ts
	/**
	* Singleton settings registry.
	* Set via registerSettings() before any consumer calls.
	* Reset via clearSettings() in test cleanup.
	* @internal Module-level mutable state — intentional singleton pattern.
	*/
	var _settings = null;
	function registerSettings(s) {
		_settings = s;
	}
	function tryGetSettings() {
		return _settings;
	}
	/** Clear settings reference (called during cleanup) */
	function clearSettings() {
		_settings = null;
	}
	function requireSettingsService() {
		const service = tryGetSettings();
		if (!service) throw new Error("SettingsService not registered.");
		return service;
	}
	/** Get a typed setting value, falling back to default if unset */
	function getTypedSettingOr(path, fallback) {
		const value = requireSettingsService().get(path);
		return value === void 0 ? fallback : value;
	}
	/** Set a typed setting value */
	function setTypedSetting(path, value) {
		return requireSettingsService().set(path, value);
	}
	//#endregion
	//#region src/shared/logging/logger.ts
	var BASE_PREFIX = "[XEG]";
	var noop = () => {};
	var createErrorOnlyLogger = (prefix) => ({
		info: noop,
		debug: noop,
		trace: noop,
		warn: (...args) => {
			console.warn(prefix, ...args);
		},
		error: (...args) => {
			console.error(prefix, ...args);
		}
	});
	function buildLogger(prefix) {
		return createErrorOnlyLogger(prefix);
	}
	function createLogger(arg = {}) {
		return buildLogger((typeof arg === "string" ? { prefix: `[${arg}]` } : arg).prefix ?? BASE_PREFIX);
	}
	var logger = createLogger();
	//#endregion
	//#region src/shared/error/app-error-reporter.ts
	function normalizeErrorMessage(error) {
		if (error instanceof Error) return error.message || error.name || "Error";
		if (typeof error === "string") return error;
		if (error == null) return "Unknown error";
		if (typeof error === "object") {
			const msg = error.message;
			if (typeof msg === "string") return msg;
			return String(error);
		}
		return String(error);
	}
	function createReporter(context) {
		const report = (severity) => (error, options) => {
			const message = normalizeErrorMessage(error);
			const payload = {
				context,
				severity
			};
			if (options?.code) payload.code = options.code;
			if (options?.metadata) payload.metadata = options.metadata;
			if (severity === "critical") console.error("[Critical Error]", message, payload);
		};
		return {
			critical: report("critical"),
			error: report("error"),
			warn: report("warning"),
			info: report("info")
		};
	}
	var bootstrapErrorReporter = createReporter("bootstrap");
	var galleryErrorReporter = createReporter("gallery");
	var mediaErrorReporter = createReporter("media");
	var settingsErrorReporter = createReporter("settings");
	/** Array of locale codes (not auto) */
	var LOCALE_CODES = [
		{
			code: "en",
			name: "English",
			dir: "ltr"
		},
		{
			code: "ko",
			name: "한국어",
			dir: "ltr"
		},
		{
			code: "ja",
			name: "日本語",
			dir: "ltr"
		},
		{
			code: "zh-CN",
			name: "简体中文",
			dir: "ltr"
		},
		{
			code: "es",
			name: "Español",
			dir: "ltr"
		},
		{
			code: "ar",
			name: "العربية",
			dir: "rtl"
		}
	].map((l) => l.code);
	//#endregion
	//#region node_modules/.pnpm/@piesp+browser-core@file+packages+core/node_modules/@piesp/browser-core/src/locale/detect.ts
	/**
	* Locale detection — unified browser locale detection across all projects.
	*
	* Priority order:
	* 1. Platform-provided UI language hint (chrome.i18n.getUILanguage() in extension context)
	* 2. navigator.languages[] — user's ordered accept-language list
	* 3. navigator.language — single fallback
	*
	* MIT License
	* Copyright (c) 2025-2026 PiesP
	*/
	/**
	* Normalize a raw locale string to a supported Locale code.
	* Returns null if no supported locale can be derived.
	*
	* Matching strategy:
	* 1. Exact match (e.g. 'ko' → 'ko')
	* 2. Language-region abbreviation match (e.g. 'zh-CN' → 'zh-CN')
	* 3. 2-letter base prefix match (e.g. 'zh-TW' → 'zh-CN')
	*/
	function normalizeLocale(code) {
		const lower = code.toLowerCase();
		const exact = LOCALE_CODES.find((l) => l.toLowerCase() === lower);
		if (exact) return exact;
		if (lower.includes("-")) {
			const region = code.slice(0, 5);
			const regionMatch = LOCALE_CODES.find((l) => l.toLowerCase() === region.toLowerCase());
			if (regionMatch) return regionMatch;
		}
		const base = lower.slice(0, 2);
		const baseMatch = LOCALE_CODES.find((l) => l.toLowerCase().startsWith(base));
		if (baseMatch) return baseMatch;
		return null;
	}
	/**
	* Detect the best-supported locale from the browser environment.
	*
	* Priority order:
	* 1. Platform-provided UI language (chrome.i18n.getUILanguage in extension context)
	* 2. navigator.languages[] — user's ordered preference list
	* 3. navigator.language — single fallback
	*
	* Falls back to DEFAULT_LOCALE if nothing matches.
	*/
	function detectLocale(options = {}) {
		if (options.platformUILanguage) {
			const normalized = normalizeLocale(options.platformUILanguage);
			if (normalized) return normalized;
		}
		const navLanguages = options.languages;
		if (navLanguages && navLanguages.length > 0) for (const lang of navLanguages) {
			if (!lang) continue;
			const normalized = normalizeLocale(lang);
			if (normalized) return normalized;
		}
		const single = options.singleLanguage;
		if (single) {
			const normalized = normalizeLocale(single);
			if (normalized) return normalized;
		}
		if (typeof navigator !== "undefined") try {
			const uiLang = (typeof chrome !== "undefined" ? chrome : void 0)?.i18n?.getUILanguage?.() ?? void 0;
			if (uiLang) {
				const normalized = normalizeLocale(uiLang);
				if (normalized) return normalized;
			}
			const navLangs = navigator.languages;
			const browserLangs = navLangs ?? (navigator.language ? [navigator.language] : []);
			if (browserLangs.length > 0) for (const lang of browserLangs) {
				if (!lang) continue;
				const normalized = normalizeLocale(lang);
				if (normalized) return normalized;
			}
			if (navLangs && navLangs.length === 0 && navigator.language) {
				const normalized = normalizeLocale(navigator.language);
				if (normalized) return normalized;
			}
		} catch {}
		return options.defaultLocale ?? "en";
	}
	//#endregion
	//#region src/shared/constants/i18n/language-types.ts
	/**
	* Supported language codes for the application
	* These must match the available language files in the languages directory
	*/
	var LANGUAGE_CODES = [
		"en",
		"ko",
		"ja",
		"zh-CN",
		"es",
		"ar"
	];
	/**
	* Type guard to check if a value is a valid base language code.
	* Normalizes case before comparison so BCP 47 variants (e.g., `zh-CN`) are accepted.
	* @param value - Value to check
	* @returns True if value is a valid BaseLanguageCode
	*/
	function isBaseLanguageCode(value) {
		if (!value) return false;
		const lower = value.toLowerCase();
		return lower === "en" || lower === "ko" || lower === "ja" || lower === "zh-cn" || lower === "zh-CN" || lower === "es" || lower === "ar";
	}
	//#endregion
	//#region src/shared/constants/i18n/languages/ar.ts
	/**
	* Arabic language strings for the application
	*/
	var ar = {
		tb: {
			prev: "السابق",
			next: "التالي",
			dl: "تنزيل",
			dlAllCt: "تنزيل جميع {count} ملفات كـ ZIP",
			setOpen: "فتح الإعدادات",
			cls: "إغلاق",
			twTxt: "عرض التغريدة",
			twPanel: "لوحة نص التغريدة",
			twUrl: "عرض التغريدة الأصلية",
			fitOri: "الأصلي",
			fitW: "ملاءمة العرض",
			fitH: "ملاءمة الارتفاع",
			fitC: "ملاءمة النافذة",
			galleryToolbar: "شريط أدوات المعرض",
			progress: "التقدم",
			settingsPanel: "لوحة الإعدادات"
		},
		st: {
			th: "المظهر",
			lang: "اللغة",
			thAuto: "تلقائي",
			thLt: "فاتح",
			thDk: "داكن",
			langAuto: "تلقائي",
			langKo: "الكورية",
			langEn: "الإنجليزية",
			langJa: "اليابانية",
			langZhCn: "الصينية المبسطة",
			langEs: "الإسبانية",
			langAr: "العربية"
		},
		msg: {
			err: {
				t: "حدث خطأ",
				b: "حدث خطأ غير متوقع: {error}",
				loadMedia: {
					title: "فشل تحميل الوسائط",
					body: "تعذر العثور على صور أو مقاطع فيديو."
				},
				generic: "حدث خطأ",
				loadGallery: "فشل تحميل المعرض",
				settingsUnavailable: {
					title: "الإعدادات غير متاحة",
					body: "سيتم استخدام القيم الافتراضية حتى يتم تحميل الإعدادات."
				},
				retry: "إعادة المحاولة",
				noMoreRetries: "لا توجد محاولات إضافية",
				reset: "إعادة تعيين"
			},
			kb: {
				t: "اختصارات لوحة المفاتيح",
				prev: "ArrowLeft: الوسائط السابقة",
				next: "ArrowRight: الوسائط التالية",
				cls: "Escape: إغلاق المعرض",
				toggle: "؟: عرض هذه المساعدة"
			},
			dl: {
				one: { err: {
					t: "فشل التنزيل",
					b: "تعذر تنزيل الملف: {error}"
				} },
				allFail: {
					t: "فشل التنزيل",
					b: "فشل تنزيل جميع العناصر."
				},
				part: {
					t: "فشل جزئي",
					b: "فشل تنزيل {count} عناصر."
				},
				noMedia: "لا توجد وسائط محددة. يرجى إعادة فتح المعرض والمحاولة مجدداً.",
				zipFail: "فشل حفظ ملف ZIP"
			},
			gal: {
				emptyT: "لا توجد وسائط متاحة",
				emptyD: "لا توجد صور أو مقاطع فيديو لعرضها.",
				itemLbl: "وسائط {index}: {filename}",
				loadFail: "فشل تحميل {type}",
				imageGallery: "معرض الصور",
				loading: "جارٍ التحميل",
				videoCount: "فيديو {index} من {total}",
				imageCount: "صورة {index} من {total}: {alt}",
				hashtagLabel: "وسم {value}"
			}
		}
	};
	//#endregion
	//#region src/shared/constants/i18n/languages/en.ts
	/**
	* English language strings for the application
	*/
	var en = {
		tb: {
			prev: "Previous",
			next: "Next",
			dl: "Download",
			dlAllCt: "Download all {count} files as ZIP",
			setOpen: "Open Settings",
			cls: "Close",
			twTxt: "View tweet",
			twPanel: "Tweet text panel",
			twUrl: "View original tweet",
			fitOri: "Original",
			fitW: "Fit Width",
			fitH: "Fit Height",
			fitC: "Fit Window",
			galleryToolbar: "Gallery Toolbar",
			progress: "Progress",
			settingsPanel: "Settings Panel"
		},
		st: {
			th: "Theme",
			lang: "Language",
			thAuto: "Auto",
			thLt: "Light",
			thDk: "Dark",
			langAuto: "Auto / 자동 / 自動 / Auto / تلقائي",
			langKo: "Korean",
			langEn: "English",
			langJa: "Japanese",
			langZhCn: "Simplified Chinese",
			langEs: "Spanish",
			langAr: "Arabic"
		},
		msg: {
			err: {
				t: "An error occurred",
				b: "An unexpected error occurred: {error}",
				loadMedia: {
					title: "Failed to load media",
					body: "Could not find images or videos."
				},
				generic: "Error occurred",
				loadGallery: "Failed to load gallery",
				settingsUnavailable: {
					title: "Settings unavailable",
					body: "Defaults will be used until settings load."
				},
				retry: "Retry",
				noMoreRetries: "No more retries",
				reset: "Reset"
			},
			kb: {
				t: "Keyboard shortcuts",
				prev: "ArrowLeft: Previous media",
				next: "ArrowRight: Next media",
				cls: "Escape: Close gallery",
				toggle: "?: Show this help"
			},
			dl: {
				one: { err: {
					t: "Download Failed",
					b: "Could not download the file: {error}"
				} },
				allFail: {
					t: "Download Failed",
					b: "Failed to download all items."
				},
				part: {
					t: "Partial Failure",
					b: "Failed to download {count} items."
				},
				noMedia: "No media item selected. Please re-open the gallery and try again.",
				zipFail: "Failed to save ZIP file"
			},
			gal: {
				emptyT: "No media available",
				emptyD: "There are no images or videos to display.",
				itemLbl: "Media {index}: {filename}",
				loadFail: "Failed to load {type}",
				imageGallery: "Image gallery",
				loading: "Loading",
				videoCount: "Video {index} of {total}",
				imageCount: "Image {index} of {total}: {alt}",
				hashtagLabel: "Hashtag {value}"
			}
		}
	};
	//#endregion
	//#region src/shared/constants/i18n/languages/es.ts
	/**
	* Spanish language strings for the application
	*/
	var es = {
		tb: {
			prev: "Anterior",
			next: "Siguiente",
			dl: "Descargar",
			dlAllCt: "Descargar los {count} archivos como ZIP",
			setOpen: "Abrir configuración",
			cls: "Cerrar",
			twTxt: "Ver tweet",
			twPanel: "Panel de texto del tweet",
			twUrl: "Ver tweet original",
			fitOri: "Original",
			fitW: "Ajustar ancho",
			fitH: "Ajustar alto",
			fitC: "Ajustar ventana",
			galleryToolbar: "Barra de herramientas de la galería",
			progress: "Progreso",
			settingsPanel: "Panel de configuración"
		},
		st: {
			th: "Tema",
			lang: "Idioma",
			thAuto: "Automático",
			thLt: "Claro",
			thDk: "Oscuro",
			langAuto: "Automático",
			langKo: "Coreano",
			langEn: "Inglés",
			langJa: "Japonés",
			langZhCn: "Chino simplificado",
			langEs: "Español",
			langAr: "Árabe"
		},
		msg: {
			err: {
				t: "Ocurrió un error",
				b: "Ocurrió un error inesperado: {error}",
				loadMedia: {
					title: "Error al cargar contenido multimedia",
					body: "No se encontraron imágenes ni videos."
				},
				generic: "Ocurrió un error",
				loadGallery: "Error al cargar la galería",
				settingsUnavailable: {
					title: "Configuración no disponible",
					body: "Se usarán valores predeterminados hasta que se cargue la configuración."
				},
				retry: "Reintentar",
				noMoreRetries: "No hay más reintentos",
				reset: "Restablecer"
			},
			kb: {
				t: "Atajos de teclado",
				prev: "ArrowLeft: Medio anterior",
				next: "ArrowRight: Medio siguiente",
				cls: "Escape: Cerrar galería",
				toggle: "?: Mostrar esta ayuda"
			},
			dl: {
				one: { err: {
					t: "Descarga fallida",
					b: "No se pudo descargar el archivo: {error}"
				} },
				allFail: {
					t: "Descarga fallida",
					b: "No se pudo descargar ningún elemento."
				},
				part: {
					t: "Fallo parcial",
					b: "No se pudieron descargar {count} elementos."
				},
				noMedia: "Ningún elemento multimedia seleccionado. Reabra la galería e intente de nuevo.",
				zipFail: "Error al guardar el archivo ZIP"
			},
			gal: {
				emptyT: "Sin medios disponibles",
				emptyD: "No hay imágenes ni videos para mostrar.",
				itemLbl: "Medio {index}: {filename}",
				loadFail: "Error al cargar {type}",
				imageGallery: "Galería de imágenes",
				loading: "Cargando",
				videoCount: "Video {index} de {total}",
				imageCount: "Imagen {index} de {total}: {alt}",
				hashtagLabel: "Hashtag {value}"
			}
		}
	};
	//#endregion
	//#region src/shared/constants/i18n/languages/ja.ts
	/**
	* Japanese language strings for the application
	*/
	var ja = {
		tb: {
			prev: "前へ",
			next: "次へ",
			dl: "ダウンロード",
			dlAllCt: "すべての{count}件をZIPでダウンロード",
			setOpen: "設定を開く",
			cls: "閉じる",
			twTxt: "ツイートを見る",
			twPanel: "ツイートテキストパネル",
			twUrl: "元のツイートを見る",
			fitOri: "原寸",
			fitW: "幅に合わせる",
			fitH: "高さに合わせる",
			fitC: "ウィンドウに合わせる",
			galleryToolbar: "ギャラリーツールバー",
			progress: "進捗",
			settingsPanel: "設定パネル"
		},
		st: {
			th: "テーマ",
			lang: "言語",
			thAuto: "自動",
			thLt: "ライト",
			thDk: "ダーク",
			langAuto: "自動",
			langKo: "韓国語",
			langEn: "英語",
			langJa: "日本語",
			langZhCn: "簡体字中国語",
			langEs: "スペイン語",
			langAr: "アラビア語"
		},
		msg: {
			err: {
				t: "エラーが発生しました",
				b: "予期しないエラーが発生しました: {error}",
				loadMedia: {
					title: "メディアの読み込みに失敗しました",
					body: "画像や動画が見つかりませんでした。"
				},
				generic: "エラーが発生しました",
				loadGallery: "ギャラリーの読み込みに失敗しました",
				settingsUnavailable: {
					title: "設定を利用できません",
					body: "設定が読み込まれるまでデフォルト値が使用されます。"
				},
				retry: "再試行",
				noMoreRetries: "再試行できません",
				reset: "リセット"
			},
			kb: {
				t: "キーボードショートカット",
				prev: "ArrowLeft: 前のメディア",
				next: "ArrowRight: 次のメディア",
				cls: "Escape: ギャラリーを閉じる",
				toggle: "?: このヘルプを表示"
			},
			dl: {
				one: { err: {
					t: "ダウンロード失敗",
					b: "ファイルを取得できません: {error}"
				} },
				allFail: {
					t: "ダウンロード失敗",
					b: "すべての項目をダウンロードできませんでした。"
				},
				part: {
					t: "一部失敗",
					b: "{count}個の項目を取得できませんでした。"
				},
				noMedia: "メディアが選択されていません。ギャラリーを開き直してお試しください。",
				zipFail: "ZIPファイルの保存に失敗しました"
			},
			gal: {
				emptyT: "メディアがありません",
				emptyD: "表示する画像や動画がありません。",
				itemLbl: "メディア {index}: {filename}",
				loadFail: "{type} の読み込みに失敗しました",
				imageGallery: "画像ギャラリー",
				loading: "読み込み中",
				videoCount: "動画 {index}/{total}",
				imageCount: "画像 {index}/{total}: {alt}",
				hashtagLabel: "ハッシュタグ {value}"
			}
		}
	};
	//#endregion
	//#region src/shared/constants/i18n/languages/ko.ts
	/**
	* Korean language strings for the application
	*/
	var ko = {
		tb: {
			prev: "이전",
			next: "다음",
			dl: "다운로드",
			dlAllCt: "모든 {count}개 파일을 ZIP으로 다운로드",
			setOpen: "설정 열기",
			cls: "닫기",
			twTxt: "트윗 보기",
			twPanel: "트윗 텍스트 패널",
			twUrl: "원본 트윗 보기",
			fitOri: "원본",
			fitW: "너비 맞춤",
			fitH: "높이 맞춤",
			fitC: "창 맞춤",
			galleryToolbar: "갤러리 도구 모음",
			progress: "진행",
			settingsPanel: "설정 패널"
		},
		st: {
			th: "테마",
			lang: "언어",
			thAuto: "자동",
			thLt: "라이트",
			thDk: "다크",
			langAuto: "자동",
			langKo: "한국어",
			langEn: "영어",
			langJa: "일본어",
			langZhCn: "중국어 간체",
			langEs: "스페인어",
			langAr: "아랍어"
		},
		msg: {
			err: {
				t: "오류가 발생했습니다",
				b: "예상치 못한 오류가 발생했습니다: {error}",
				loadMedia: {
					title: "미디어를 불러오지 못했습니다",
					body: "이미지나 동영상을 찾을 수 없습니다."
				},
				generic: "오류가 발생했습니다",
				loadGallery: "갤러리를 불러오지 못했습니다",
				settingsUnavailable: {
					title: "설정을 사용할 수 없음",
					body: "설정이 로드될 때까지 기본값이 사용됩니다."
				},
				retry: "다시 시도",
				noMoreRetries: "더 이상 재시도할 수 없음",
				reset: "초기화"
			},
			kb: {
				t: "키보드 단축키",
				prev: "ArrowLeft: 이전 미디어",
				next: "ArrowRight: 다음 미디어",
				cls: "Escape: 갤러리 닫기",
				toggle: "?: 이 도움말 표시"
			},
			dl: {
				one: { err: {
					t: "다운로드 실패",
					b: "파일을 가져올 수 없습니다: {error}"
				} },
				allFail: {
					t: "다운로드 실패",
					b: "모든 항목을 다운로드할 수 없었습니다."
				},
				part: {
					t: "일부 실패",
					b: "{count}개 항목을 가져올 수 없었습니다."
				},
				noMedia: "선택된 미디어가 없습니다. 갤러리를 다시 열고 시도해 주세요.",
				zipFail: "ZIP 파일 저장에 실패했습니다"
			},
			gal: {
				emptyT: "미디어 없음",
				emptyD: "표시할 이미지 또는 동영상이 없습니다.",
				itemLbl: "미디어 {index}: {filename}",
				loadFail: "{type} 로드 실패",
				imageGallery: "이미지 갤러리",
				loading: "로딩 중",
				videoCount: "동영상 {index}/{total}",
				imageCount: "이미지 {index}/{total}: {alt}",
				hashtagLabel: "해시태그 {value}"
			}
		}
	};
	//#endregion
	//#region src/shared/constants/i18n/languages/zh-CN.ts
	/**
	* Simplified Chinese language strings for the application
	*/
	var zhCn = {
		tb: {
			prev: "上一个",
			next: "下一个",
			dl: "下载",
			dlAllCt: "将全部 {count} 个文件下载为 ZIP",
			setOpen: "打开设置",
			cls: "关闭",
			twTxt: "查看推文",
			twPanel: "推文文本面板",
			twUrl: "查看原始推文",
			fitOri: "原始大小",
			fitW: "适应宽度",
			fitH: "适应高度",
			fitC: "适应窗口",
			galleryToolbar: "图库工具栏",
			progress: "进度",
			settingsPanel: "设置面板"
		},
		st: {
			th: "主题",
			lang: "语言",
			thAuto: "自动",
			thLt: "浅色",
			thDk: "深色",
			langAuto: "自动",
			langKo: "韩语",
			langEn: "英语",
			langJa: "日语",
			langZhCn: "简体中文",
			langEs: "西班牙语",
			langAr: "阿拉伯语"
		},
		msg: {
			err: {
				t: "发生错误",
				b: "发生了意外错误：{error}",
				loadMedia: {
					title: "加载媒体失败",
					body: "找不到图片或视频。"
				},
				generic: "发生错误",
				loadGallery: "加载图库失败",
				settingsUnavailable: {
					title: "设置不可用",
					body: "设置加载完成前将使用默认值。"
				},
				retry: "重试",
				noMoreRetries: "无法继续重试",
				reset: "重置"
			},
			kb: {
				t: "键盘快捷键",
				prev: "ArrowLeft：上一个媒体",
				next: "ArrowRight：下一个媒体",
				cls: "Escape：关闭画廊",
				toggle: "？：显示此帮助"
			},
			dl: {
				one: { err: {
					t: "下载失败",
					b: "无法下载文件：{error}"
				} },
				allFail: {
					t: "下载失败",
					b: "所有项目下载失败。"
				},
				part: {
					t: "部分失败",
					b: "{count} 个项目下载失败。"
				},
				noMedia: "未选择媒体项。请重新打开图库后重试。",
				zipFail: "ZIP 文件保存失败"
			},
			gal: {
				emptyT: "无可用媒体",
				emptyD: "没有可显示的图片或视频。",
				itemLbl: "媒体 {index}：{filename}",
				loadFail: "{type} 加载失败",
				imageGallery: "图片库",
				loading: "加载中",
				videoCount: "视频 {index}/{total}",
				imageCount: "图片 {index}/{total}：{alt}",
				hashtagLabel: "话题标签 {value}"
			}
		}
	};
	//#endregion
	//#region src/shared/utils/object/path.ts
	/**
	* @fileoverview Object path utilities — resolve nested properties by dot-notation path
	*/
	/** Resolve nested object property by dot-notation path */
	function resolveNestedPath(source, path) {
		if (typeof path !== "string" || path === "") return void 0;
		let current = source;
		for (const segment of path.split(".")) {
			if (!segment || current === null || typeof current !== "object") return void 0;
			current = current[segment];
		}
		return current;
	}
	//#endregion
	//#region src/shared/i18n/translator.ts
	var TRANSLATION_REGISTRY = {
		en,
		ko,
		ja,
		"zh-CN": zhCn,
		es,
		ar
	};
	/** Create a translator instance with the given language bundles. */
	function createTranslator(options = {}) {
		const { bundles = TRANSLATION_REGISTRY, fallbackLanguage = "en" } = options;
		const bundleMap = {};
		for (const [lang, strings] of Object.entries(bundles)) if (strings) bundleMap[lang] = strings;
		if (!bundleMap[fallbackLanguage]) throw new Error(`Missing fallback language bundle: ${fallbackLanguage}`);
		return {
			get languages() {
				return LANGUAGE_CODES;
			},
			translate(language, key, params) {
				const template = resolveNestedPath(bundleMap[language] ?? bundleMap[fallbackLanguage], key);
				if (!template) return key;
				if (!params) return template;
				return template.replace(/\{(\w+)\}/g, (match, placeholder) => Object.hasOwn(params, placeholder) ? String(params[placeholder]) : match);
			}
		};
	}
	//#endregion
	//#region src/shared/services/persistent-storage.ts
	createLogger("PersistentStorage");
	/**
	* localStorage fallback prefix — used when the primary storage adapter
	* (GM_setValue / chrome.storage.local) fails, providing a last-resort
	* persistence layer that works across reloads.
	*/
	var LS_FALLBACK_PREFIX = "xeg-fallback:";
	var STORAGE_ENVELOPE_VERSION = 1;
	function lsReadRaw(key) {
		try {
			return localStorage.getItem(LS_FALLBACK_PREFIX + key);
		} catch {
			return null;
		}
	}
	function lsWriteRaw(key, value) {
		try {
			localStorage.setItem(LS_FALLBACK_PREFIX + key, value);
		} catch {}
	}
	function lsRemove(key) {
		try {
			localStorage.removeItem(LS_FALLBACK_PREFIX + key);
		} catch {}
	}
	function isRecord$1(value) {
		return typeof value === "object" && value !== null;
	}
	function encodeValue(value) {
		return JSON.stringify({
			__xegStorageEnvelope: STORAGE_ENVELOPE_VERSION,
			updatedAt: Date.now(),
			value
		});
	}
	function decodeValue(raw) {
		let parsed = raw;
		if (typeof raw === "string") try {
			parsed = JSON.parse(raw);
		} catch {
			return null;
		}
		if (isRecord$1(parsed) && parsed.__xegStorageEnvelope === STORAGE_ENVELOPE_VERSION && typeof parsed.updatedAt === "number" && Object.hasOwn(parsed, "value")) return {
			value: parsed.value,
			updatedAt: parsed.updatedAt
		};
		return {
			value: parsed,
			updatedAt: void 0
		};
	}
	var PersistentStorage = class {
		get adapter() {
			return getStorageAdapter();
		}
		async set(key, value) {
			if (value === void 0) {
				await this.remove(key);
				return;
			}
			const serialized = encodeValue(value);
			try {
				await this.adapter.set(key, serialized);
				lsRemove(key);
			} catch (error) {
				lsWriteRaw(key, serialized);
			}
		}
		async get(key, defaultValue) {
			let value;
			try {
				value = await this.adapter.get(key);
			} catch (_error) {
				return this.readFallbackOrDefault(key, defaultValue);
			}
			const primary = value === void 0 || value === null ? null : decodeValue(value);
			const fallback = this.readFallbackValue(key);
			if (!primary) return fallback?.value ?? defaultValue;
			if (fallback && fallback.updatedAt !== void 0 && (primary.updatedAt === void 0 || fallback.updatedAt > primary.updatedAt)) return fallback.value;
			return primary.value;
		}
		readFallbackOrDefault(key, defaultValue) {
			return this.readFallbackValue(key)?.value ?? defaultValue;
		}
		readFallbackValue(key) {
			const raw = lsReadRaw(key);
			return raw === null ? null : decodeValue(raw);
		}
		async getString(key, defaultValue) {
			const value = await this.get(key);
			if (value === void 0 || value === null) return defaultValue;
			if (typeof value === "string") return value;
			if (typeof value === "object") try {
				return JSON.stringify(value);
			} catch {
				return String(value);
			}
			return String(value);
		}
		async has(key) {
			const value = await this.adapter.get(key);
			return value !== void 0 && value !== null;
		}
		/**
		* Synchronous storage access via UserscriptAPI adapter.
		*
		* [WARNING] Only reliable in Tampermonkey and Violentmonkey.
		* MV3 extensions do NOT support this — returns defaultValue.
		* Use ONLY for critical initialization paths (e.g., theme to prevent FOUC).
		*/
		getSync(key, defaultValue) {
			if (!this.adapter.getSync) return defaultValue;
			try {
				const value = this.adapter.getSync(key);
				if (value == null) return defaultValue;
				return decodeValue(value)?.value ?? defaultValue;
			} catch {
				return defaultValue;
			}
		}
		async remove(key) {
			try {
				await this.adapter.remove(key);
			} catch {}
			lsRemove(key);
		}
	};
	var storageInstance = null;
	function getPersistentStorage() {
		if (!storageInstance) storageInstance = new PersistentStorage();
		return storageInstance;
	}
	//#endregion
	//#region src/shared/services/singleton-base.ts
	/**
	* Create a singleton service with automatic instance management.
	* Eliminates the boilerplate of module-level `_instance` variables
	* and static `getInstance()`/`resetForTests()` methods.
	*/
	function createSingleton(factory) {
		let instance = null;
		return {
			getInstance() {
				const inst = instance;
				if (inst) return inst;
				const newInst = factory();
				instance = newInst;
				return newInst;
			},
			resetForTests() {
				instance?.destroy();
				instance = null;
			}
		};
	}
	//#endregion
	//#region src/shared/services/language-service.ts
	/**
	* @fileoverview Multilingual Support Service
	* @description TDD-based simple i18n system with lazy language loading
	*/
	var LanguageService = class LanguageService {
		static STORAGE_KEY = "xeg-language";
		_initialized = false;
		currentLanguage = "auto";
		listeners = /* @__PURE__ */ new Set();
		storage = getPersistentStorage();
		translator;
		_nav;
		constructor(nav) {
			this.translator = createTranslator();
			this._nav = nav ?? (typeof navigator !== "undefined" ? navigator : void 0);
		}
		/** Initialize service (idempotent) */
		async initialize() {
			if (this._initialized) return;
			try {
				const saved = await this.storage.get(LanguageService.STORAGE_KEY);
				const normalized = this.normalizeLanguage(saved);
				if (normalized !== this.currentLanguage) {
					this.currentLanguage = normalized;
					this.notifyListeners(normalized);
				}
			} catch (error) {}
			this._initialized = true;
		}
		/** Destroy service (idempotent) */
		destroy() {
			this.listeners.clear();
			this._initialized = false;
		}
		/** Check if service is initialized */
		isInitialized() {
			return this._initialized;
		}
		detectLanguage() {
			const browserLangs = this._nav && "languages" in this._nav && Array.isArray(this._nav.languages) ? this._nav.languages : this._nav && typeof this._nav.language === "string" ? [this._nav.language] : void 0;
			return detectLocale(browserLangs ? { languages: browserLangs } : {});
		}
		getCurrentLanguage() {
			return this.currentLanguage;
		}
		setLanguage(language) {
			const normalized = this.normalizeLanguage(language);
			if (language !== normalized && language !== "auto") {}
			if (this.currentLanguage === normalized) return;
			this.currentLanguage = normalized;
			this.notifyListeners(normalized);
			this.persistLanguage(normalized);
		}
		translate(key, params) {
			const language = this.getEffectiveLanguage();
			return this.translator.translate(language, key, params);
		}
		onLanguageChange(callback) {
			this.listeners.add(callback);
			return () => this.listeners.delete(callback);
		}
		normalizeLanguage(language) {
			if (!language) return "auto";
			if (language === "auto") return "auto";
			const lower = language.toLowerCase();
			if (isBaseLanguageCode(lower)) return lower;
			if (isBaseLanguageCode(language)) return language;
			return "en";
		}
		notifyListeners(language) {
			this.listeners.forEach((listener) => {
				try {
					listener(language);
				} catch (error) {}
			});
		}
		async persistLanguage(language) {
			try {
				await this.storage.set(LanguageService.STORAGE_KEY, language);
			} catch (error) {}
		}
		getEffectiveLanguage() {
			return this.currentLanguage === "auto" ? this.detectLanguage() : this.currentLanguage;
		}
	};
	var { getInstance: getLanguageService, resetForTests: resetLanguageServiceForTests } = createSingleton(() => new LanguageService());
	//#endregion
	//#region src/shared/utils/async/promise-helpers.ts
	function createDeferred() {
		let resolve;
		let reject;
		return {
			promise: new Promise((res, rej) => {
				resolve = res;
				reject = rej;
			}),
			resolve,
			reject
		};
	}
	//#endregion
	//#region src/shared/services/http-request-service.ts
	/**
	* @fileoverview HTTP client using GM_xmlhttpRequest for cross-origin support.
	*/
	var HttpRequestService = class {
		/**
		* Default timeout for GM_xmlhttpRequest-based API calls (Twitter GraphQL etc.).
		*
		* NOTE: 10s vs DEFAULT_REQUEST_TIMEOUT_MS (30s) in @constants/performance:
		* - 10s (this): Short timeout for light JSON API requests (Twitter GraphQL calls
		*   via GM_xmlhttpRequest). These should complete in <3s; 10s is generous.
		* - 30s (DEFAULT_REQUEST_TIMEOUT_MS): Longer timeout used for media-download
		*   fetch operations (single-download, retry-fetch) and as the MV3 adapter's
		*   fallback default. Media files are larger and take longer to transfer.
		* Both values are intentionally different — not a drift bug.
		*/
		defaultTimeout = 1e4;
		async get(url, options) {
			return this.request("GET", url, options);
		}
		async request(method, url, options) {
			const deferred = createDeferred();
			const signal = options?.signal;
			let settled = false;
			let control = null;
			const onAbort = () => {
				if (settled) return;
				settled = true;
				control?.abort();
				deferred.reject(getAbortReasonOrAbortErrorFromSignal(signal));
			};
			signal?.addEventListener("abort", onAbort, { once: true });
			if (signal?.aborted) {
				onAbort();
				return deferred.promise;
			}
			const settle = (fn) => {
				if (settled) return;
				settled = true;
				signal?.removeEventListener("abort", onAbort);
				fn();
			};
			const details = {
				method,
				url,
				timeout: options?.timeout ?? this.defaultTimeout,
				...options?.headers ? { headers: options.headers } : {},
				responseType: options?.responseType,
				...options?.data !== void 0 ? { data: options.data } : {},
				onload: (response) => {
					settle(() => {
						deferred.resolve({
							ok: response.status >= 200 && response.status < 300,
							status: response.status,
							data: response.response
						});
					});
				},
				onerror: (response) => {
					settle(() => {
						const status = response.status ?? 0;
						const error = /* @__PURE__ */ new Error(status === 0 ? "NET" : `HTTP:${status}`);
						error.status = status;
						deferred.reject(error);
					});
				},
				ontimeout: () => {
					settle(() => {
						const error = /* @__PURE__ */ new Error("TIMEOUT");
						error.status = 0;
						deferred.reject(error);
					});
				},
				onabort: () => {
					settle(() => {
						if (signal) deferred.reject(getAbortReasonOrAbortErrorFromSignal(signal));
						else deferred.reject(new DOMException("Aborted", "AbortError"));
					});
				}
			};
			control = getHttpRequestAdapter().request(details);
			return deferred.promise.finally(() => {
				signal?.removeEventListener("abort", onAbort);
			});
		}
	};
	var httpServiceInstance = null;
	function getHttpRequestService() {
		if (!httpServiceInstance) httpServiceInstance = new HttpRequestService();
		return httpServiceInstance;
	}
	//#endregion
	//#region src/shared/services/media/prefetch-manager.ts
	/** Schedules a task to run during browser idle time. Falls back to setTimeout for Safari. */
	function scheduleIdle(task) {
		if (typeof requestIdleCallback === "function") {
			const id = requestIdleCallback(() => {
				try {
					task();
				} catch (error) {}
			}, { timeout: 2e3 });
			return { cancel: () => cancelIdleCallback(id) };
		}
		const id = setTimeout(() => {
			try {
				task();
			} catch (error) {}
		}, 1);
		return { cancel: () => clearTimeout(id) };
	}
	/** Default maximum number of entries in the prefetch cache. */
	var DEFAULT_CACHE_MAX_ENTRIES = 5;
	/**
	* Manages media prefetching and caching.
	* Extracted from MediaService for better separation of concerns.
	*
	* Uses a doubly-linked list + Map for O(1) LRU eviction instead of
	* scanning all cache entries on each eviction.
	*/
	var PrefetchManager = class {
		cache = /* @__PURE__ */ new Map();
		activeRequests = /* @__PURE__ */ new Map();
		maxEntries;
		maxBytes;
		totalBytes = 0;
		disposed = false;
		idleHandles = /* @__PURE__ */ new Set();
		resolvedSizes = /* @__PURE__ */ new Map();
		head = null;
		tail = null;
		nodeMap = /* @__PURE__ */ new Map();
		constructor(maxEntries = DEFAULT_CACHE_MAX_ENTRIES, maxBytes = 100 * 1024 * 1024) {
			this.maxEntries = maxEntries;
			this.maxBytes = maxBytes;
		}
		/**
		* Prefetch media with specified scheduling strategy.
		* Videos are skipped — they can be hundreds of MB and are not suitable
		* for blob-level caching.
		*/
		async prefetch(media, schedule = "idle") {
			if (media.type === "video" || media.type === "gif") return;
			if (this.cache.has(media.url) || this.activeRequests.has(media.url)) return;
			if (schedule === "immediate") {
				await this.prefetchSingle(media.url);
				return;
			}
			const handle = scheduleIdle(() => {
				this.idleHandles.delete(handle);
				if (this.disposed) return;
				this.prefetchSingle(media.url).catch(() => {});
			});
			this.idleHandles.add(handle);
		}
		/**
		* Get cached media blob
		*/
		get(url) {
			const entry = this.cache.get(url);
			if (!entry) return null;
			this.moveToTail(url);
			return entry;
		}
		/**
		* Cancel all active prefetch requests
		*/
		cancelAll() {
			for (const controller of this.activeRequests.values()) controller.abort();
			this.activeRequests.clear();
			for (const handle of this.idleHandles) handle.cancel();
			this.idleHandles.clear();
		}
		/**
		* Clear the prefetch cache
		/** Clear the prefetch cache and reset byte tracking */
		clear() {
			this.cache.clear();
			this.nodeMap.clear();
			this.resolvedSizes.clear();
			this.head = null;
			this.tail = null;
			this.totalBytes = 0;
		}
		/**
		* Cleanup resources
		*/
		destroy() {
			this.disposed = true;
			for (const handle of this.idleHandles) handle.cancel();
			this.idleHandles.clear();
			this.cancelAll();
			this.clear();
		}
		async prefetchSingle(url) {
			const existing = this.cache.get(url);
			if (existing) {
				try {
					await existing;
				} catch {
					this.cache.delete(url);
					this.removeFromLRU(url);
				}
				if (this.cache.has(url)) return;
			}
			const controller = new AbortController();
			this.activeRequests.set(url, controller);
			if (this.cache.size >= this.maxEntries) this.evictOldest();
			const fetchPromise = getHttpRequestService().get(url, {
				signal: controller.signal,
				responseType: "blob"
			}).then((response) => {
				if (!response.ok) throw new Error(`HTTP ${response.status}`);
				return response.data;
			}).finally(() => {
				this.activeRequests.delete(url);
			});
			this.cache.set(url, fetchPromise);
			this.addToLRU(url);
			try {
				const blob = await fetchPromise;
				this.totalBytes += blob.size;
				this.resolvedSizes.set(url, blob.size);
				this.evictByByteBudget();
			} catch (error) {
				if (this.cache.get(url) === fetchPromise) {
					this.cache.delete(url);
					this.removeFromLRU(url);
				}
			}
		}
		evictOldest() {
			let node = this.head;
			while (node) {
				if (!this.activeRequests.has(node.url)) {
					const size = this.resolvedSizes.get(node.url);
					if (size !== void 0) {
						this.totalBytes -= size;
						this.resolvedSizes.delete(node.url);
					}
					this.cache.delete(node.url);
					this.removeNode(node);
					return;
				}
				node = node.next;
			}
			if (this.head) {
				const url = this.head.url;
				const controller = this.activeRequests.get(url);
				if (controller) {
					controller.abort();
					this.activeRequests.delete(url);
				}
				this.resolvedSizes.delete(url);
				this.cache.delete(url);
				this.removeNode(this.head);
			}
		}
		evictByByteBudget() {
			while (this.totalBytes > this.maxBytes && this.head) this.evictOldest();
		}
		addToLRU(url) {
			if (this.nodeMap.get(url)) {
				this.moveToTail(url);
				return;
			}
			const node = {
				url,
				prev: this.tail,
				next: null
			};
			if (this.tail) this.tail.next = node;
			this.tail = node;
			if (!this.head) this.head = node;
			this.nodeMap.set(url, node);
		}
		moveToTail(url) {
			const node = this.nodeMap.get(url);
			if (!node || this.tail === node) return;
			this.removeNode(node);
			node.prev = this.tail;
			node.next = null;
			if (this.tail) this.tail.next = node;
			this.tail = node;
			if (!this.head) this.head = node;
		}
		removeNode(node) {
			if (node.prev) node.prev.next = node.next;
			if (node.next) node.next.prev = node.prev;
			if (this.head === node) this.head = node.next;
			if (this.tail === node) this.tail = node.prev;
			this.nodeMap.delete(node.url);
		}
		removeFromLRU(url) {
			const node = this.nodeMap.get(url);
			if (node) this.removeNode(node);
		}
	};
	//#endregion
	//#region src/constants/selectors.ts
	/** @fileoverview DOM selector constants for X.com elements. */
	var TWEET_SELECTOR = "article[data-testid=\"tweet\"]";
	var TWEET_PHOTO_SELECTOR = "[data-testid=\"tweetPhoto\"]";
	var TWEET_TEXT_SELECTOR = "[data-testid=\"tweetText\"]";
	var VIDEO_PLAYER_SELECTOR = "[data-testid=\"videoPlayer\"]";
	var VIDEO_PLAYER_CONTEXT_SELECTOR = `${VIDEO_PLAYER_SELECTOR},[data-testid="videoComponent"],[data-testid="videoPlayerControls"],[data-testid="videoPlayerOverlay"],[role="application"],[aria-label*="Video"]`;
	var STATUS_LINK_SELECTOR = "a[href*=\"/status/\"]";
	var TWITTER_MEDIA_SELECTOR = "img[src*=\"pbs.twimg.com\"], video[src*=\"video.twimg.com\"]";
	var TWEET_CONTAINER_SELECTORS = [TWEET_SELECTOR, "article[role=\"article\"]"];
	var MEDIA_CONTAINER_SELECTORS = [TWEET_PHOTO_SELECTOR, VIDEO_PLAYER_SELECTOR];
	var VIDEO_CONTAINER_SELECTORS = [VIDEO_PLAYER_SELECTOR, "video"];
	var IMAGE_CONTAINER_SELECTORS = [TWEET_PHOTO_SELECTOR, "img[src*=\"pbs.twimg.com\"]"];
	var MEDIA_VIEWER_SELECTORS = [
		"[data-testid=\"photoViewer\"]",
		"[aria-modal=\"true\"][data-testid=\"Drawer\"]",
		"[aria-roledescription=\"carousel\"]"
	];
	//#endregion
	//#region src/shared/types/media.types.ts
	/**
	* @fileoverview Integrated media type definitions
	*/
	/**
	* Error codes for machine-readable error identification.
	*
	* Using const object instead of enum for tree-shaking optimization.
	*/
	var ErrorCode = {
		NONE: "NONE",
		CANCELLED: "CANCELLED",
		EMPTY_INPUT: "EMPTY_INPUT",
		ALL_FAILED: "ALL_FAILED",
		NO_MEDIA_FOUND: "NO_MEDIA_FOUND"
	};
	/** Extraction error class */
	var ExtractionError = class extends Error {
		code;
		originalError;
		constructor(code, message, originalError) {
			super(message);
			this.code = code;
			this.originalError = originalError;
			this.name = "ExtractionError";
		}
	};
	/**
	* Creates a standardized failure result for media extraction.
	* Used by extractors when extraction fails at any stage.
	*/
	function createFailureResult(error, sourceType, strategy) {
		return {
			success: false,
			mediaItems: [],
			clickedIndex: 0,
			metadata: {
				extractedAt: performance.now(),
				sourceType,
				strategy,
				error
			},
			tweetInfo: null
		};
	}
	//#endregion
	//#region src/shared/utils/dom/query-helpers.ts
	function closestWithFallback(element, selectors) {
		for (const selector of selectors) try {
			const match = element.closest(selector);
			if (match) return match;
		} catch (error) {}
		return null;
	}
	//#endregion
	//#region src/shared/utils/dom/tweet-extractor.ts
	/**
	* Extracts tweet text content from DOM elements
	*/
	/**
	* Extracts tweet text from tweet article element
	*
	* @param tweetArticle - Tweet article element
	* @returns Text content or undefined if not found
	*/
	function extractTweetText(tweetArticle) {
		if (!tweetArticle) return void 0;
		try {
			const tweetTextElement = tweetArticle.querySelector(TWEET_TEXT_SELECTOR);
			if (!tweetTextElement) return void 0;
			const text = tweetTextElement.textContent?.trim();
			if (!text) return void 0;
			return text;
		} catch (error) {
			logger.debug("[tweet] extract failed", error);
			return;
		}
	}
	/**
	* Extracts tweet text from clicked element by traversing up
	*
	* @param element - Clicked element
	* @returns Tweet text or undefined
	*/
	function extractTweetTextHTMLFromClickedElement(element) {
		const tweetArticle = closestWithFallback(element, TWEET_CONTAINER_SELECTORS);
		if (tweetArticle) return extractTweetText(tweetArticle);
	}
	//#endregion
	//#region src/shared/utils/media/media-element-utils.ts
	/**
	* @fileoverview Media element utilities: DOM traversal for finding media descendants and ancestors.
	*/
	var DEFAULT_TRAVERSAL_OPTIONS = {
		maxDescendantDepth: 6,
		maxAncestorHops: 3
	};
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
		if (element instanceof HTMLImageElement) {
			const attr = element.getAttribute("src");
			return pickFirstTruthy([
				element.currentSrc || null,
				attr ? element.src : null,
				attr
			]);
		}
		const attr = element.getAttribute("src");
		const posterAttr = element.getAttribute("poster");
		return pickFirstTruthy([
			element.currentSrc || null,
			attr ? element.src : null,
			attr,
			posterAttr ? element.poster : null,
			posterAttr
		]);
	}
	function findMediaDescendant(root, { includeRoot, maxDepth }) {
		const queue = [{
			node: root,
			depth: 0
		}];
		let head = 0;
		while (head < queue.length) {
			const current = queue[head++];
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
	//#endregion
	//#region src/shared/utils/url/validator.ts
	/**
	* Media URL validation utilities.
	*/
	/**
	* Maximum allowed URL length for media validation.
	*
	* @remarks
	* Prevents excessively long URLs that may indicate malformed or malicious input.
	* Set to 2048 — Twitter/X media URLs rarely exceed 200 characters; this provides
	* ample headroom for query parameters while blocking abuse.
	*
	* @see MAX_MEDIA_URL_LENGTH
	*/
	/**
	* Allowed media CDN hosts for Twitter/X media.
	*
	* @remarks
	* This is derived from the media constant. Kept as a separate variable for
	* performance optimization and clarity in the validation logic.
	*/
	var ALLOWED_MEDIA_HOSTS = Object.freeze(MEDIA.HOSTS.MEDIA_CDN);
	/**
	* Validate Twitter media URL
	*
	* Multi-layer validation:
	* 1. Basic validation (null, length, protocol)
	* 2. Domain validation (pbs.twimg.com, video.twimg.com)
	* 3. Path validation (media/, video_thumb/, exclude profile)
	*
	* @param url - URL to validate
	* @returns Whether URL is valid
	*
	* @example
	* ```ts
	* isValidMediaUrl('https://pbs.twimg.com/media/ABC?format=jpg') // true
	* isValidMediaUrl('https://video.twimg.com/ext_tw_video/123/pu/vid.mp4') // true
	* isValidMediaUrl('https://pbs.twimg.com/profile_images/123.jpg') // false (profile)
	* isValidMediaUrl('https://example.com/image.jpg') // false (domain mismatch)
	* ```
	*/
	function isValidMediaUrl(url) {
		if (typeof url !== "string" || url.length > 2048) return false;
		const parsed = tryParseUrl(url);
		if (!parsed) return false;
		if (!isHttpProtocol(parsed.protocol)) return false;
		if (!isHostMatching(parsed, ALLOWED_MEDIA_HOSTS)) return false;
		return isAllowedMediaPath(parsed.hostname, parsed.pathname);
	}
	/**
	* Validate URL protocol.
	*
	* @param protocol - URL protocol (example: 'https:', 'http:')
	* @returns Whether protocol is https or http
	*
	* @remarks
	* `tryParseUrl()` supports protocol-relative URLs by coercing to `https:`.
	*
	* @internal
	*/
	var isHttpProtocol = (protocol) => protocol === "https:" || protocol === "http:";
	/**
	* Enforce host-specific path policy for media URLs.
	*
	* This function routes validation to host-specific path checkers, keeping
	* host allow-listing and path policy separate to prevent policy drift.
	*
	* @param hostname - The hostname to validate (e.g., 'pbs.twimg.com')
	* @param pathname - The pathname to validate against host-specific rules
	* @returns Whether the pathname is allowed for the given hostname
	*
	* @internal
	*/
	function isAllowedMediaPath(hostname, pathname) {
		if (hostname === "pbs.twimg.com") return checkPbsMediaPath(pathname);
		if (hostname === "video.twimg.com") return checkVideoMediaPath(pathname);
		return false;
	}
	/**
	* Validate pbs.twimg.com path for allowed media prefixes.
	*
	* Uses strict prefix matching to prevent substring-based bypasses.
	* Allowed prefixes include media, thumbnails, card images, and video metadata paths.
	*
	* @param pathname - URL pathname to validate
	* @returns Whether the pathname matches an allowed media prefix for pbs.twimg.com
	*
	* @internal
	*/
	var checkPbsMediaPath = (pathname) => pathname.startsWith("/media/") || pathname.startsWith("/ext_tw_video_thumb/") || pathname.startsWith("/tweet_video_thumb/") || pathname.startsWith("/video_thumb/") || pathname.startsWith("/amplify_video_thumb/") || pathname.startsWith("/card_img/");
	/**
	* Validate video.twimg.com path for allowed media prefixes.
	*
	* Uses strict prefix matching to prevent substring-based bypasses.
	* Only known media path prefixes (video, thumbnails, DM videos) are allowed.
	* We intentionally do not accept arbitrary paths on video.twimg.com.
	*
	* @param pathname - URL pathname to validate
	* @returns Whether the pathname matches an allowed media prefix for video.twimg.com
	*
	* @internal
	*/
	var checkVideoMediaPath = (pathname) => pathname.startsWith("/ext_tw_video/") || pathname.startsWith("/tweet_video/") || pathname.startsWith("/amplify_video/") || pathname.startsWith("/dm_video/");
	//#endregion
	//#region src/shared/services/media-extraction/extractors/dom-fallback-extractor.ts
	/**
	* @fileoverview DOM Fallback Media Extractor
	* @description Extracts media directly from DOM when API extraction fails.
	* Primary use case: card images and other media not available via API.
	*/
	/**
	* Find all media elements in the tweet container
	* @param container - Tweet article container or parent element
	* @returns Array of media elements (img, video)
	*/
	function findAllMediaInContainer(container) {
		const mediaElements = [];
		const cdnSelector = MEDIA.HOSTS.MEDIA_CDN.map((h) => `img[src*="${h}"]`).join(", ");
		const images = container.querySelectorAll(cdnSelector);
		for (const img of images) if (isMediaElement(img)) mediaElements.push(img);
		const videos = container.querySelectorAll("video");
		for (const video of videos) if (isMediaElement(video)) mediaElements.push(video);
		return mediaElements;
	}
	/**
	* Create MediaInfo from DOM media element
	* @param element - Media element (img or video)
	* @param tweetInfo - Tweet metadata
	* @param index - Media index in array
	* @param tweetTextContent - Tweet text content
	*/
	function createMediaInfoFromDOM(element, tweetInfo, index, tweetTextContent) {
		try {
			const mediaUrl = extractMediaUrlFromElement(element);
			if (!mediaUrl || !isValidMediaUrl(mediaUrl)) return null;
			const mediaType = element.tagName.toLowerCase() === "video" ? "video" : "image";
			let width;
			let height;
			if (element instanceof HTMLImageElement) {
				width = element.naturalWidth || element.width || void 0;
				height = element.naturalHeight || element.height || void 0;
			} else if (element instanceof HTMLVideoElement) {
				width = element.videoWidth || element.width || void 0;
				height = element.videoHeight || element.height || void 0;
			}
			const domAlt = element instanceof HTMLImageElement && element.alt?.trim() ? element.alt.trim() : void 0;
			return {
				id: `${tweetInfo.tweetId}_dom_${index}`,
				url: mediaUrl,
				type: mediaType,
				filename: "",
				tweetUsername: tweetInfo.username,
				tweetId: tweetInfo.tweetId,
				tweetUrl: tweetInfo.tweetUrl,
				tweetText: void 0,
				tweetTextContent,
				originalUrl: mediaUrl,
				thumbnailUrl: mediaUrl,
				alt: domAlt || `${mediaType} ${index + 1}`,
				...width && height && {
					width,
					height
				},
				metadata: {
					domIndex: index,
					extractionSource: "dom-fallback",
					elementTag: element.tagName.toLowerCase()
				}
			};
		} catch (error) {
			return null;
		}
	}
	/**
	* DOM Fallback Extractor
	* Extracts media directly from DOM when API is unavailable.
	*/
	var DOMFallbackExtractor = class {
		async extract(tweetInfo, clickedElement, _options, extractionId) {
			try {
				const tweetContainer = closestWithFallback(clickedElement, TWEET_CONTAINER_SELECTORS);
				if (!tweetContainer || !(tweetContainer instanceof HTMLElement)) return createFailureResult("No tweet container found", "dom-fallback", "dom-extraction-failed");
				const tweetTextContent = extractTweetTextHTMLFromClickedElement(clickedElement);
				const mediaElements = findAllMediaInContainer(tweetContainer);
				if (mediaElements.length === 0) return createFailureResult("No media elements found in DOM", "dom-fallback", "dom-extraction-failed");
				const mediaItems = [];
				const elementToIndexMap = /* @__PURE__ */ new Map();
				for (let i = 0; i < mediaElements.length; i++) {
					const element = mediaElements[i];
					if (!element) continue;
					const mediaInfo = createMediaInfoFromDOM(element, tweetInfo, i, tweetTextContent);
					if (mediaInfo) {
						elementToIndexMap.set(element, mediaItems.length);
						mediaItems.push(mediaInfo);
					}
				}
				if (mediaItems.length === 0) return createFailureResult("No valid media items extracted from DOM", "dom-fallback", "dom-extraction-failed");
				const clickedMedia = findMediaElementInDOM(clickedElement);
				let clickedIndex = 0;
				if (clickedMedia) {
					const mappedIndex = elementToIndexMap.get(clickedMedia);
					if (mappedIndex !== void 0) clickedIndex = mappedIndex;
				}
				return {
					success: true,
					mediaItems,
					clickedIndex,
					metadata: {
						extractedAt: performance.now(),
						sourceType: "dom-fallback",
						strategy: "dom-extraction",
						domMediaCount: mediaItems.length
					},
					tweetInfo
				};
			} catch (error) {
				return createFailureResult(normalizeErrorMessage(error), "dom-fallback", "dom-extraction-failed");
			}
		}
	};
	//#endregion
	//#region src/shared/services/media-extraction/extractors/tweet-info-extractor.ts
	/**
	* @fileoverview Tweet Info Extractor - Simplified Functional Pipeline
	* @description Extracts tweet metadata using a concise strategy pipeline.
	*/
	var DEFAULT_TWEET_ORIGIN = "https://x.com";
	var normalizeTweetUrl$1 = (inputUrl) => {
		try {
			const url = new URL(inputUrl, DEFAULT_TWEET_ORIGIN);
			if (isHostMatching(url.hostname.toLowerCase(), TWITTER_HOSTS, { allowSubdomains: true })) {
				url.hostname = "x.com";
				url.protocol = "https:";
			}
			return url.toString();
		} catch {
			return inputUrl.startsWith("/") ? `${DEFAULT_TWEET_ORIGIN}${inputUrl}` : inputUrl;
		}
	};
	/** Strategy 1: Direct Element Attributes (Fastest) */
	var extractFromElement = (element) => {
		const dataId = element.dataset.tweetId;
		if (dataId && /^\d+$/.test(dataId)) return {
			tweetId: dataId,
			username: element.dataset.user ?? "unknown",
			tweetUrl: `https://x.com/i/status/${dataId}`,
			extractionMethod: "element-attribute",
			confidence: .9
		};
		const href = element.getAttribute("href");
		if (href) {
			const match = href.match(/\/status\/(\d+)/);
			if (match?.[1]) return {
				tweetId: match[1],
				username: extractUsernameFromUrl(href) ?? "unknown",
				tweetUrl: normalizeTweetUrl$1(href),
				extractionMethod: "element-href",
				confidence: .8
			};
		}
		return null;
	};
	/** Strategy 2: DOM Structure (Most Reliable) */
	var extractFromDOM = (element) => {
		const container = closestWithFallback(element, TWEET_CONTAINER_SELECTORS);
		if (!container) return null;
		const statusLink = container.querySelector(STATUS_LINK_SELECTOR);
		if (!statusLink) return null;
		const href = statusLink.getAttribute("href");
		if (!href) return null;
		const match = href.match(/\/status\/(\d+)/);
		if (!match?.[1]) return null;
		return {
			tweetId: match[1],
			username: extractUsernameFromUrl(href) ?? "unknown",
			tweetUrl: normalizeTweetUrl$1(href),
			extractionMethod: "dom-structure",
			confidence: .85,
			metadata: { containerTag: container.tagName.toLowerCase() }
		};
	};
	/** Strategy 3: Media Grid Item (For Media Tab) */
	var extractFromMediaGridItem = (element) => {
		const link = element.closest("a");
		if (!link) return null;
		const href = link.getAttribute("href");
		if (!href) return null;
		const match = href.match(/\/status\/(\d+)/);
		if (!match?.[1]) return null;
		return {
			tweetId: match[1],
			username: extractUsernameFromUrl(href) ?? "unknown",
			tweetUrl: normalizeTweetUrl$1(href),
			extractionMethod: "media-grid-item",
			confidence: .8
		};
	};
	var strategies = [
		extractFromElement,
		extractFromDOM,
		extractFromMediaGridItem
	];
	function isValidTweetInfo(info) {
		return !!info.tweetId && /^\d+$/.test(info.tweetId) && info.tweetId !== "unknown";
	}
	/**
	* Extract tweet info from a DOM element using a strategy pipeline.
	* Tries strategies in order: element attributes → DOM structure → media grid.
	*/
	function extractTweetInfo(element) {
		for (const strategy of strategies) try {
			const result = strategy(element);
			if (result && isValidTweetInfo(result)) return result;
		} catch {}
		return null;
	}
	var TweetInfoExtractor = class {
		extract(element) {
			return extractTweetInfo(element);
		}
	};
	//#endregion
	//#region src/shared/utils/media/media-url-utils.ts
	var dedupKeyCache = /* @__PURE__ */ new WeakMap();
	function hasValidUrlPrefix(str) {
		return /^(?:https?:\/\/|\/\/|\/)/u.test(str);
	}
	function extractFilenameFromUrl(url) {
		if (!url) return null;
		const trimmed = url.trim();
		if (!trimmed || !hasValidUrlPrefix(trimmed)) return null;
		const parsed = tryParseUrl(trimmed, "https://example.invalid");
		if (!parsed) return null;
		const filename = parsed.pathname.split("/").pop();
		return filename && filename.length > 0 ? filename : null;
	}
	function getMediaDedupKey(media) {
		const cached = dedupKeyCache.get(media);
		if (cached !== void 0) return cached;
		const urlCandidate = typeof media.originalUrl === "string" && media.originalUrl.length > 0 ? media.originalUrl : typeof media.url === "string" && media.url.length > 0 ? media.url : null;
		if (!urlCandidate) {
			dedupKeyCache.set(media, null);
			return null;
		}
		const typePrefix = media.type === "image" || media.type === "video" || media.type === "gif" ? `${media.type}:` : "";
		const parsed = tryParseUrl(urlCandidate, "https://example.invalid");
		if (parsed) {
			const host = parsed.hostname;
			const path = parsed.pathname;
			const format = parsed.searchParams.get("format");
			if (host && path) {
				const key = `${typePrefix}${host}${path}${format ? `?format=${format}` : ""}`;
				dedupKeyCache.set(media, key);
				return key;
			}
		}
		const filename = extractFilenameFromUrl(urlCandidate);
		const key = filename ? `${typePrefix}${filename}` : `${typePrefix}${urlCandidate}`;
		dedupKeyCache.set(media, key);
		return key;
	}
	function extractVisualIndexFromUrl(url) {
		if (!url) return 0;
		const match = url.match(/\/(photo|video)\/(\d+)(?:[?#].*)?$/);
		const visualNumber = match?.[2] ? Number.parseInt(match[2], 10) : NaN;
		return Number.isFinite(visualNumber) && visualNumber > 0 ? visualNumber - 1 : 0;
	}
	function normalizeMediaUrl(url) {
		if (!url) return null;
		const trimmed = url.trim();
		if (!trimmed || !hasValidUrlPrefix(trimmed)) return null;
		const parsed = tryParseUrl(trimmed, "https://example.invalid");
		if (!parsed) return null;
		let filename = parsed.pathname.split("/").pop();
		if (!filename) return null;
		const dotIndex = filename.lastIndexOf(".");
		if (dotIndex !== -1) filename = filename.substring(0, dotIndex);
		return filename && filename.length > 0 ? filename : null;
	}
	//#endregion
	//#region node_modules/.pnpm/@piesp+browser-core@file+packages+core/node_modules/@piesp/browser-core/src/util/clamp.ts
	/**
	* Clamp a number between `min` and `max` (inclusive).
	*
	* @param value - The value to clamp
	* @param min - Minimum bound
	* @param max - Maximum bound
	* @returns The clamped value
	*/
	function clamp(value, min, max) {
		return Math.min(Math.max(value, min), max);
	}
	/**
	* Safely clamp an index to valid array bounds.
	* Handles non-finite values and invalid lengths.
	*
	* @param index - Index to validate
	* @param length - Array length
	* @returns Valid index in [0, length-1] or 0 on invalid input
	*/
	function clampIndex(index, length) {
		if (!Number.isFinite(index) || length <= 0) return 0;
		return clamp(Math.floor(index), 0, length - 1);
	}
	//#endregion
	//#region src/shared/utils/media/media-dimensions.ts
	/**
	* @fileoverview Media dimension resolution: extracting dimensions from URLs, metadata, and aspect ratios.
	*/
	var FALLBACK_VIEWPORT_HEIGHT = `720px`;
	function removeDuplicateMediaItems(mediaItems) {
		if (!mediaItems?.length) return [];
		const seen = /* @__PURE__ */ new Set();
		const result = [];
		for (const item of mediaItems) {
			if (item == null) continue;
			const key = getMediaDedupKey(item);
			if (!key) continue;
			if (!seen.has(key)) {
				seen.add(key);
				result.push(item);
			}
		}
		return result;
	}
	function sortMediaByVisualOrder(mediaItems) {
		if (mediaItems.length <= 1) return mediaItems;
		return mediaItems.map((media) => ({
			media,
			visualIndex: extractVisualIndexFromUrl(media.expanded_url || "")
		})).sort((a, b) => a.visualIndex - b.visualIndex).map(({ media }, newIndex) => ({
			...media,
			index: newIndex
		}));
	}
	function extractDimensionsFromUrl(url) {
		if (!url) return null;
		const match = url.match(/\/(\d{2,6})x(\d{2,6})(?:\/|\.|$)/);
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
	function scaleAspectRatio(widthRatio, heightRatio) {
		if (heightRatio <= 0 || widthRatio <= 0) return DEFAULT_MEDIA_DIMENSIONS;
		return {
			width: Math.max(1, Math.round(widthRatio / heightRatio * 720)),
			height: 720
		};
	}
	function deriveDimensionsFromMetadata(metadata) {
		if (!metadata) return null;
		const dims = metadata.dimensions;
		const w = normalizeDimension(dims?.width);
		const h = normalizeDimension(dims?.height);
		if (w && h) return {
			width: w,
			height: h
		};
		const apiData = metadata.apiData;
		if (!apiData) return null;
		const origW = normalizeDimension(apiData.original_width ?? apiData.originalWidth);
		const origH = normalizeDimension(apiData.original_height ?? apiData.originalHeight);
		if (origW && origH) return {
			width: origW,
			height: origH
		};
		const downloadUrl = apiData.download_url;
		if (typeof downloadUrl === "string" && downloadUrl) {
			const fromUrl = extractDimensionsFromUrl(downloadUrl);
			if (fromUrl) return fromUrl;
		}
		const previewUrl = apiData.preview_url;
		if (typeof previewUrl === "string" && previewUrl) {
			const fromUrl = extractDimensionsFromUrl(previewUrl);
			if (fromUrl) return fromUrl;
		}
		const aspectRatio = apiData.aspect_ratio;
		if (Array.isArray(aspectRatio) && aspectRatio.length >= 2) {
			const ratioW = normalizeDimension(aspectRatio[0]);
			const ratioH = normalizeDimension(aspectRatio[1]);
			if (ratioW && ratioH) return scaleAspectRatio(ratioW, ratioH);
		}
		return null;
	}
	function deriveDimensionsFromMediaUrls(media) {
		for (const candidate of [
			media.url,
			media.originalUrl,
			media.thumbnailUrl
		]) if (typeof candidate === "string" && candidate) {
			const dimensions = extractDimensionsFromUrl(candidate);
			if (dimensions) return dimensions;
		}
		return null;
	}
	function resolveMediaDimensionsWithIntrinsicFlag(media) {
		if (!media) return {
			dimensions: DEFAULT_MEDIA_DIMENSIONS,
			hasIntrinsicSize: false
		};
		const directW = normalizeDimension(media.width);
		const directH = normalizeDimension(media.height);
		if (directW && directH) return {
			dimensions: {
				width: directW,
				height: directH
			},
			hasIntrinsicSize: true
		};
		const fromMetadata = deriveDimensionsFromMetadata(media.metadata);
		if (fromMetadata) return {
			dimensions: fromMetadata,
			hasIntrinsicSize: true
		};
		const fromUrls = deriveDimensionsFromMediaUrls(media);
		if (fromUrls) return {
			dimensions: fromUrls,
			hasIntrinsicSize: true
		};
		return {
			dimensions: DEFAULT_MEDIA_DIMENSIONS,
			hasIntrinsicSize: false
		};
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
	/**
	* Compute `--xeg-cis-override` CSS custom property value for `contain-intrinsic-size`.
	*
	* When `content-visibility: auto` defers layout for off-screen gallery items,
	* `contain-intrinsic-size` provides the fallback sizing. The old hardcoded
	* `auto none auto 300px` ignored the fit mode and actual image dimensions,
	* causing off-screen items to all render at 300px height.
	*
	* This function returns a CSS value using `calc()` expressions that reference
	* viewport custom properties (`--xeg-viewport-w`, `--xeg-viewport-height-constrained`)
	* so the sizing updates on viewport resize without JS recomputation.
	*
	* Returns `null` when intrinsic size is unavailable — the CSS falls back to the
	* default `auto none auto 300px`.
	*/
	function computeContainIntrinsicSizeOverride(input) {
		const { intrinsicWidth, intrinsicHeight, hasIntrinsicSize, fitMode } = input;
		if (!hasIntrinsicSize) return null;
		const ratioStr = (intrinsicHeight > 0 ? intrinsicWidth / intrinsicHeight : 16 / 9).toFixed(6);
		const aw = "100%";
		switch (fitMode) {
			case "fitWidth": return `auto ${aw} auto ${`calc(${aw} / ${ratioStr})`}`;
			case "fitHeight": {
				const vh = `var(--xeg-viewport-height-constrained, ${FALLBACK_VIEWPORT_HEIGHT})`;
				return `auto ${`min(${aw}, calc(${vh} * ${ratioStr}))`} auto ${vh}`;
			}
			case "fitContainer": {
				const vh = `var(--xeg-viewport-height-constrained, ${FALLBACK_VIEWPORT_HEIGHT})`;
				return `auto ${`min(${aw}, ${`calc(${vh} * ${ratioStr})`})`} auto ${`min(${intrinsicHeight}px, ${vh})`}`;
			}
			case "original": {
				const cw = `min(${intrinsicWidth}px, ${aw})`;
				return `auto ${cw} auto ${`calc(${cw} / ${ratioStr})`}`;
			}
			default: return null;
		}
	}
	function adjustClickedIndexAfterDeduplication(originalItems, uniqueItems, originalClickedIndex) {
		if (uniqueItems.length === 0) return 0;
		const clickedItem = originalItems[clampIndex(originalClickedIndex, originalItems.length)];
		if (!clickedItem) return 0;
		const clickedKey = getMediaDedupKey(clickedItem);
		if (!clickedKey) return 0;
		const newIndex = uniqueItems.findIndex((item) => getMediaDedupKey(item) === clickedKey);
		return newIndex >= 0 ? newIndex : 0;
	}
	//#endregion
	//#region src/shared/services/media/media-factory.ts
	/**
	* Create MediaInfo from API Response
	*/
	function createMediaInfoFromAPI(apiMedia, tweetInfo, index, tweetTextContent) {
		try {
			const mediaType = apiMedia.type === "photo" ? "image" : "video";
			const width = normalizeDimension(apiMedia.original_width);
			const height = normalizeDimension(apiMedia.original_height);
			const dimensions = width && height ? {
				width,
				height
			} : null;
			const metadata = {
				apiIndex: index,
				apiData: apiMedia
			};
			if (dimensions) metadata.dimensions = dimensions;
			const username = apiMedia.screen_name ?? tweetInfo.username;
			if (!isValidMediaUrl(apiMedia.download_url)) return null;
			return {
				id: `${tweetInfo.tweetId}_api_${index}`,
				url: apiMedia.download_url,
				type: mediaType,
				filename: "",
				tweetUsername: username,
				tweetId: tweetInfo.tweetId,
				tweetUrl: tweetInfo.tweetUrl,
				tweetText: apiMedia.tweet_text,
				tweetTextContent,
				originalUrl: apiMedia.download_url,
				thumbnailUrl: apiMedia.preview_url,
				alt: apiMedia.alt_text?.trim() || `${mediaType} ${index + 1}`,
				...dimensions && {
					width: dimensions.width,
					height: dimensions.height
				},
				metadata
			};
		} catch (error) {
			return null;
		}
	}
	/**
	* Transform API Media to MediaInfo Array
	*/
	function convertAPIMediaToMediaInfo(apiMedias, tweetInfo, tweetTextContent) {
		const mediaItems = [];
		for (let i = 0; i < apiMedias.length; i++) {
			const apiMedia = apiMedias[i];
			if (!apiMedia) continue;
			const mediaInfo = createMediaInfoFromAPI(apiMedia, tweetInfo, i, tweetTextContent);
			if (mediaInfo) mediaItems.push(mediaInfo);
		}
		return mediaItems;
	}
	//#endregion
	//#region src/constants/app-config.ts
	function parseBooleanFlag(value) {
		if (typeof value === "boolean") return value;
		if (typeof value !== "string") return void 0;
		const normalized = value.trim().toLowerCase();
		if (!normalized) return void 0;
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
	var env = {
		"BASE_URL": "/",
		"DEV": false,
		"MODE": "production",
		"PROD": true,
		"SSR": false
	};
	var version = "2.2.0";
	var devFlag = parseBooleanFlag(env.DEV);
	var mode = env.MODE ?? "production";
	var isDev = devFlag ?? (mode !== "production" && mode !== "test");
	Object.freeze({
		meta: { version },
		environment: { isDev },
		features: { debugTools: parseBooleanFlag(env.VITE_ENABLE_DEBUG_TOOLS) ?? isDev },
		runtime: { autoStart: parseBooleanFlag(env.VITE_AUTO_START) ?? true }
	});
	var TWITTER_API_CONFIG = {
		/** @deprecated Use resolveBearerToken() from twitter-auth instead. Kept for fallback only. */
		GUEST_AUTHORIZATION: `Bearer ${(typeof env.VITE_TWITTER_GUEST_TOKEN === "string" && env.VITE_TWITTER_GUEST_TOKEN.length > 0 ? env.VITE_TWITTER_GUEST_TOKEN : void 0) || "AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA"}`,
		TWEET_RESULT_BY_REST_ID_QUERY_ID: "zAz9764BcLZOJ0JU2wrd1A",
		USER_BY_SCREEN_NAME_QUERY_ID: "1VOOyvKkiI3FMmkeDNxM9A",
		SUPPORTED_HOSTS: TWITTER_HOSTS,
		DEFAULT_HOST: "x.com"
	};
	/**
	* Serialize query parameters to JSON string.
	* Returns string as-is, or converts object to JSON.
	* @param value - Query parameters to serialize
	* @returns JSON string representation
	*/
	function serializeQueryParams(value) {
		return typeof value === "string" ? value : JSON.stringify(value);
	}
	/**
	* Build complete URL for Twitter GraphQL TweetResultByRestId endpoint.
	* Serializes all query parameters (variables, features, fieldToggles) as JSON.
	* @param args - Configuration object for URL construction
	* @returns Fully qualified URL string with encoded query parameters
	*/
	function buildTweetResultByRestIdUrl(args) {
		const { host, queryId, variables, features, fieldToggles } = args;
		const urlObj = new URL(`https://${host}/i/api/graphql/${queryId}/TweetResultByRestId`);
		urlObj.searchParams.set("variables", serializeQueryParams(variables));
		urlObj.searchParams.set("features", serializeQueryParams(features));
		urlObj.searchParams.set("fieldToggles", serializeQueryParams(fieldToggles));
		return urlObj.toString();
	}
	//#endregion
	//#region src/shared/utils/text/formatting.ts
	/**
	* Escapes special regex characters in strings.
	*/
	function escapeRegExp(value) {
		return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	}
	/**
	* Combines class names with conditional logic, handling strings, arrays, and objects.
	*/
	function cx(...inputs) {
		const classes = [];
		for (const input of inputs) {
			if (!input) continue;
			if (typeof input === "string" || typeof input === "number") classes.push(String(input));
			else if (Array.isArray(input)) {
				const nested = cx(...input);
				if (nested) classes.push(nested);
			} else if (typeof input === "object") {
				for (const [key, value] of Object.entries(input)) if (value) classes.push(key);
			}
		}
		return classes.join(" ");
	}
	//#endregion
	//#region src/shared/services/cookie/cookie-utils.ts
	/**
	* @fileoverview Cookie utilities: GM_cookie adapter with document.cookie fallback.
	*/
	function promisifyCallback(executor, options) {
		return new Promise((resolve, reject) => {
			try {
				executor((result, error) => {
					if (error) {
						if (options?.fallback) resolve(options.fallback());
						else reject(new Error(String(error)));
						return;
					}
					resolve(result);
				});
			} catch (error) {
				if (options?.fallback) resolve(options.fallback());
				else reject(error instanceof Error ? error : new Error(String(error)));
			}
		});
	}
	/**
	* Resolve the GM_cookie API through the canonical UserscriptAPI adapter.
	* In MV3 extension context, the userscript GM_* APIs are unavailable —
	* getUserscript() throws, so we catch and return null.
	* The cookie functionality falls back to document.cookie.
	*/
	function resolveGMCookieAPI() {
		try {
			return getUserscript().cookie ?? null;
		} catch {
			return null;
		}
	}
	var cachedCookieAPI;
	function getCookieAPI() {
		if (cachedCookieAPI === void 0) cachedCookieAPI = resolveGMCookieAPI();
		return cachedCookieAPI;
	}
	/**
	* Parse cookies from a cookie string (defaults to document.cookie).
	* Accepts an explicit cookie string for testability/referentially transparent usage.
	*/
	function parseDocumentCookies(filterName, cookieString) {
		const raw = cookieString ?? (typeof document !== "undefined" ? document.cookie : "");
		if (!raw) return [];
		return raw.split(";").map((entry) => entry.trim()).filter(Boolean).map((entry) => {
			const eqIdx = entry.indexOf("=");
			return {
				name: eqIdx >= 0 ? entry.slice(0, eqIdx) : entry,
				value: eqIdx >= 0 ? entry.slice(eqIdx + 1) : "",
				path: "/",
				session: true
			};
		}).filter((r) => !filterName || r.name === filterName);
	}
	async function listCookies(options, hostname) {
		try {
			const gm = getCookieAPI();
			if (!gm?.list) return parseDocumentCookies(options?.name);
			const scopedOptions = {
				...options,
				domain: options?.domain ?? hostname ?? document.location?.hostname ?? void 0
			};
			return promisifyCallback((cb) => gm.list(scopedOptions, (cookies, error) => {
				if (error) return cb(void 0, error);
				cb((cookies ?? []).map((c) => ({ ...c })), void 0);
			}), { fallback: () => parseDocumentCookies(options?.name) });
		} catch {
			return parseDocumentCookies(options?.name);
		}
	}
	async function getCookieValue(name) {
		if (!name) return void 0;
		if (getCookieAPI()?.list) {
			const value = (await listCookies({ name }))[0]?.value;
			if (value !== void 0) return value;
		}
		return getCookieValueSync(name);
	}
	function getCookieValueSync(name, cookieString) {
		if (!name) return void 0;
		const match = (cookieString ?? (typeof document !== "undefined" ? document.cookie : "")).match(new RegExp(`(?:^|;\\s*)${escapeRegExp(name)}=([^;]*)`));
		if (!match?.[1]) return void 0;
		try {
			return decodeURIComponent(match[1]);
		} catch {
			return match[1];
		}
	}
	//#endregion
	//#region src/shared/services/media/twitter-auth/twitter-auth.ts
	async function getCsrfTokenAsync() {
		const syncToken = getCookieValueSync("ct0");
		if (syncToken) return syncToken;
		return await getCookieValue("ct0") ?? void 0;
	}
	/**
	* Resolve a Bearer token from __NEXT_DATA__ DOM element.
	*
	* @param document_ - Document instance (injectable for testability).
	*                     Defaults to `globalThis.document`. Pass a mock or
	*                     null in non-browser environments.
	* @returns Bearer token string (e.g. `Bearer AAAA...`) or the static
	*          guest authorization fallback.
	*/
	function resolveBearerToken(document_) {
		try {
			const doc = document_ ?? globalThis.document;
			if (!doc) return TWITTER_API_CONFIG.GUEST_AUTHORIZATION;
			const nextDataScript = doc.getElementById("__NEXT_DATA__");
			if (nextDataScript?.textContent) {
				const token = JSON.parse(nextDataScript.textContent)?.props?.pageProps?.token?.Bearer;
				if (token && typeof token === "string" && isValidJwt(token)) return `Bearer ${token}`;
			}
		} catch {}
		return TWITTER_API_CONFIG.GUEST_AUTHORIZATION;
	}
	/**
	* Basic JWT structure validation.
	* Checks for 3 dot-separated parts and verifies the exp claim is present and not expired.
	*/
	function isValidJwt(token) {
		const parts = token.split(".");
		if (parts.length !== 3) return false;
		try {
			const payload = JSON.parse(atob(parts[1]));
			if (typeof payload.exp !== "number") return false;
			return payload.exp * 1e3 > Date.now();
		} catch {
			return false;
		}
	}
	//#endregion
	//#region src/shared/services/media/twitter-parser/twitter-response-parser.ts
	function resolveDimensions(media, mediaUrl) {
		const fromUrl = extractDimensionsFromUrl(mediaUrl);
		const w = normalizeDimension(media.original_info?.width) ?? fromUrl?.width;
		const h = normalizeDimension(media.original_info?.height) ?? fromUrl?.height;
		const result = {};
		if (w) result.width = w;
		if (h) result.height = h;
		return result;
	}
	function removeUrlTokensFromText(text, urls) {
		let result = text;
		for (const url of urls) {
			if (!url) continue;
			const token = escapeRegExp(url);
			result = result.replace(new RegExp(`(^|\\s+)${token}(?=\\s+|$)`, "g"), (_, ws) => ws);
		}
		return result.replace(/[ \t\f\v\u00A0]{2,}/g, " ").replace(/ ?\n ?/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
	}
	function resolveAspectRatio(media, dims) {
		const ratio = Array.isArray(media.video_info?.aspect_ratio) ? media.video_info.aspect_ratio : void 0;
		const rw = normalizeDimension(ratio?.[0]);
		const rh = normalizeDimension(ratio?.[1]);
		if (rw && rh) return [rw, rh];
		if (dims.width && dims.height) return [dims.width, dims.height];
	}
	function buildHighQualityUrl(path, query) {
		const extMatch = path.match(/\.(jpe?g|png)$/i);
		if (!extMatch) return `${path}?${query}`;
		const ext = extMatch[1].toLowerCase();
		const params = new URLSearchParams(query);
		if (!Array.from(params.keys()).some((k) => k.toLowerCase() === "format")) params.set("format", ext);
		params.set("name", "orig");
		const q = params.toString();
		return q ? `${path}?${q}` : path;
	}
	function getPhotoHighQualityUrl(mediaUrlHttps) {
		if (!mediaUrlHttps) return mediaUrlHttps;
		const isAbsolute = /^(https?:)?\/\//i.test(mediaUrlHttps);
		const parsed = tryParseUrl(mediaUrlHttps, "https://pbs.twimg.com");
		if (!parsed) {
			const [path = "", query = ""] = mediaUrlHttps.split("?");
			return buildHighQualityUrl(path, query);
		}
		const setParamCI = (key, value) => {
			for (const k of Array.from(parsed.searchParams.keys())) if (k !== key && k.toLowerCase() === key) parsed.searchParams.delete(k);
			parsed.searchParams.set(key, value);
		};
		const pathMatch = parsed.pathname.match(/\.(jpe?g|png)$/i);
		if (!pathMatch) return mediaUrlHttps;
		const ext = pathMatch[1].toLowerCase();
		if (!Array.from(parsed.searchParams.keys()).some((k) => k.toLowerCase() === "format")) setParamCI("format", ext);
		setParamCI("name", "orig");
		return isAbsolute ? parsed.toString() : `${parsed.pathname}${parsed.search}`;
	}
	function getVideoHighQualityUrl(media) {
		const mp4s = (media.video_info?.variants ?? []).filter((v) => v.content_type === "video/mp4");
		if (mp4s.length === 0) return null;
		return mp4s.reduce((best, cur) => (cur.bitrate ?? 0) > (best.bitrate ?? 0) ? cur : best).url;
	}
	function getHighQualityMediaUrl(media) {
		if (media.type === "photo") return getPhotoHighQualityUrl(media.media_url_https) ?? null;
		if (media.type === "video" || media.type === "animated_gif") return getVideoHighQualityUrl(media);
		return null;
	}
	function createMediaEntry(media, mediaUrl, screenName, tweetId, tweetText, index, sourceLocation) {
		const mediaType = media.type === "animated_gif" ? "video" : media.type;
		const dims = resolveDimensions(media, mediaUrl);
		const aspectRatio = resolveAspectRatio(media, dims);
		return {
			screen_name: screenName,
			tweet_id: tweetId,
			download_url: mediaUrl,
			type: mediaType,
			typeOriginal: media.type,
			index,
			preview_url: media.media_url_https,
			media_id: media.id_str,
			media_key: media.media_key ?? "",
			expanded_url: media.expanded_url ?? "",
			short_expanded_url: media.display_url ?? "",
			short_tweet_url: media.url ?? "",
			tweet_text: tweetText,
			sourceLocation,
			...media.ext_alt_text?.trim() ? { alt_text: media.ext_alt_text.trim() } : {},
			...dims.width && { original_width: dims.width },
			...dims.height && { original_height: dims.height },
			...aspectRatio && { aspect_ratio: aspectRatio }
		};
	}
	function sortByInlineOrder(mediaList, inlineMedia) {
		const orderMap = /* @__PURE__ */ new Map();
		if (Array.isArray(inlineMedia)) {
			for (const item of inlineMedia) if (item.media_id && typeof item.index === "number") orderMap.set(item.media_id, item.index);
		}
		if (orderMap.size === 0) return mediaList;
		return mediaList.map((media, i) => ({
			media,
			originalIndex: i
		})).sort((a, b) => {
			const li = orderMap.get(a.media.id_str);
			const ri = orderMap.get(b.media.id_str);
			if (li !== void 0 && ri !== void 0) return li - ri;
			if (li !== void 0) return -1;
			if (ri !== void 0) return 1;
			return a.originalIndex - b.originalIndex;
		}).map((e) => e.media);
	}
	function extractMediaFromTweet(tweetResult, tweetUser, sourceLocation = "original") {
		const quotedResult = tweetResult.quoted_status_result?.result;
		const target = sourceLocation === "quoted" && quotedResult ? quotedResult : tweetResult;
		if (!target.extended_entities?.media) return [];
		const screenName = tweetUser.screen_name ?? "";
		const tweetId = target.rest_id ?? target.id_str ?? "";
		const inlineMedia = target.note_tweet?.note_tweet_results?.result?.media?.inline_media;
		const orderedMedia = sortByInlineOrder(target.extended_entities.media, inlineMedia);
		const normalizedTweetText = removeUrlTokensFromText((target.full_text ?? "").trim(), orderedMedia.map((m) => m.url).filter((u) => typeof u === "string" && u.length > 0));
		const mediaItems = [];
		for (let i = 0; i < orderedMedia.length; i++) {
			const media = orderedMedia[i];
			if (!media?.type || !media.id_str || !media.media_url_https) continue;
			try {
				const mediaUrl = getHighQualityMediaUrl(media);
				if (!mediaUrl) continue;
				mediaItems.push(createMediaEntry(media, mediaUrl, screenName, tweetId, normalizedTweetText, i, sourceLocation));
			} catch (error) {}
		}
		return mediaItems;
	}
	function normalizeLegacyTweet(tweet) {
		if (!tweet.legacy && !tweet.note_tweet?.note_tweet_results?.result?.text) return tweet;
		const result = { ...tweet };
		if (tweet.legacy) {
			if (!result.extended_entities && tweet.legacy.extended_entities) result.extended_entities = tweet.legacy.extended_entities;
			if (!result.full_text && tweet.legacy.full_text) result.full_text = tweet.legacy.full_text;
			if (!result.id_str && tweet.legacy.id_str) result.id_str = tweet.legacy.id_str;
		}
		const noteText = tweet.note_tweet?.note_tweet_results?.result?.text;
		if (noteText) result.full_text = noteText;
		return result;
	}
	function normalizeLegacyUser(user) {
		if (!user.legacy) return user;
		const result = { ...user };
		if (!result.screen_name && user.legacy.screen_name) result.screen_name = user.legacy.screen_name;
		if (!result.name && user.legacy.name) result.name = user.legacy.name;
		return result;
	}
	//#endregion
	//#region src/shared/services/media/twitter-api-client.ts
	/**
	* @fileoverview Twitter Video Extractor - GraphQL API Integration
	* @description Facade for Twitter API interactions, delegating to specialized services.
	*/
	/** Resolve location info from globalThis.location (browser default). */
	function resolveLocationConfig() {
		const loc = typeof globalThis !== "undefined" ? globalThis.location : void 0;
		return {
			hostname: loc?.hostname,
			href: loc?.href,
			origin: loc?.origin
		};
	}
	function resolveTwitterApiHost(hostname, supportedHosts, defaultHost) {
		if (!hostname) return defaultHost;
		const normalized = hostname.toLowerCase();
		for (const host of supportedHosts) if (normalized === host || normalized.endsWith(`.${host}`)) return host;
		return defaultHost;
	}
	function getSafeHost(location) {
		return resolveTwitterApiHost((location ?? resolveLocationConfig()).hostname, TWITTER_API_CONFIG.SUPPORTED_HOSTS, TWITTER_API_CONFIG.DEFAULT_HOST);
	}
	function createTweetEndpointUrl(tweetId, location) {
		return buildTweetResultByRestIdUrl({
			host: getSafeHost(location),
			queryId: TWITTER_API_CONFIG.TWEET_RESULT_BY_REST_ID_QUERY_ID,
			variables: {
				tweetId,
				withCommunity: false,
				includePromotedContent: false,
				withVoice: false
			},
			features: {
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
			},
			fieldToggles: {
				withArticleRichContentState: true,
				withArticlePlainText: false,
				withGrokAnalyze: false,
				withDisallowedReplyControls: false
			}
		});
	}
	async function apiRequest(url, location, signal) {
		const csrfToken = await getCsrfTokenAsync() ?? "";
		const authorization = resolveBearerToken();
		const headers = new Headers({
			authorization,
			"x-csrf-token": csrfToken,
			"x-twitter-client-language": "en",
			"x-twitter-active-user": "yes",
			"content-type": "application/json",
			"x-twitter-auth-type": "OAuth2Session"
		});
		const loc = location ?? resolveLocationConfig();
		if (loc.href) headers.append("referer", loc.href);
		if (loc.origin) headers.append("origin", loc.origin);
		const response = await getHttpRequestService().get(url, {
			headers: Object.fromEntries(headers.entries()),
			responseType: "json",
			...signal ? { signal } : {}
		});
		if (!response.ok) throw new Error(`TW:${response.status}`);
		return response.data;
	}
	/**
	* Get Tweet Medias - Main API Entry Point
	*/
	async function getTweetMedias(tweetId, location, signal) {
		const json = await apiRequest(createTweetEndpointUrl(tweetId, location), location, signal);
		if (!json.data?.tweetResult?.result) return [];
		let tweetResult = json.data.tweetResult.result;
		if (tweetResult.tweet) tweetResult = tweetResult.tweet;
		let tweetUser = tweetResult.core?.user_results?.result;
		tweetResult = normalizeLegacyTweet(tweetResult);
		if (!tweetUser) return [];
		tweetUser = normalizeLegacyUser(tweetUser);
		let result = extractMediaFromTweet(tweetResult, tweetUser, "original");
		result = sortMediaByVisualOrder(result);
		if (tweetResult.quoted_status_result?.result) {
			let quotedTweet = tweetResult.quoted_status_result.result;
			if (quotedTweet.tweet) quotedTweet = quotedTweet.tweet;
			let quotedUser = quotedTweet.core?.user_results?.result;
			if (quotedTweet && quotedUser) {
				quotedTweet = normalizeLegacyTweet(quotedTweet);
				quotedUser = normalizeLegacyUser(quotedUser);
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
	//#endregion
	//#region src/shared/services/media-extraction/determine-clicked-index.ts
	function determineClickedIndex(clickedElement, mediaItems) {
		try {
			const elementUrl = resolveClickedElementUrl(clickedElement);
			if (!elementUrl) return 0;
			const normalizedElementUrl = normalizeMediaUrl(elementUrl);
			if (!normalizedElementUrl) return 0;
			const index = mediaItems.findIndex((item) => {
				if (!item) return false;
				return getNormalizedMediaCandidates(item).includes(normalizedElementUrl);
			});
			return index >= 0 ? index : 0;
		} catch (error) {
			return 0;
		}
	}
	function resolveClickedElementUrl(clickedElement) {
		const mediaElement = findMediaElementInDOM(clickedElement);
		const elementUrl = mediaElement ? extractMediaUrlFromElement(mediaElement) : null;
		if (elementUrl) return elementUrl;
		return extractBackgroundImageUrl(mediaElement ?? clickedElement, 3);
	}
	function extractBackgroundImageUrl(element, maxAncestorHops) {
		if (!element) return null;
		let current = element;
		for (let hops = 0; hops <= maxAncestorHops && current; hops++) {
			const url = extractUrlFromCssValue((globalThis.getComputedStyle?.(current))?.backgroundImage ?? "");
			if (url) return url;
			current = current.parentElement;
		}
		return null;
	}
	function extractUrlFromCssValue(value) {
		if (!value || value === "none") return null;
		return value.match(/url\((?:'|")?(.*?)(?:'|")?\)/i)?.[1]?.trim() || null;
	}
	function getNormalizedMediaCandidates(item) {
		const candidates = [
			item.url,
			item.originalUrl,
			item.thumbnailUrl
		];
		const apiData = item.metadata?.apiData;
		if (apiData) candidates.push(typeof apiData.download_url === "string" && apiData.download_url.trim() ? apiData.download_url : null, typeof apiData.preview_url === "string" && apiData.preview_url.trim() ? apiData.preview_url : null);
		const normalized = candidates.map((candidate) => candidate ? normalizeMediaUrl(candidate) : null).filter((candidate) => !!candidate);
		return Array.from(new Set(normalized));
	}
	//#endregion
	//#region src/shared/services/media-extraction/extractors/twitter-api-extractor.ts
	/**
	* @fileoverview Twitter API-Based Media Extractor (Primary Strategy)
	*/
	var TwitterAPIExtractor = class {
		async extract(tweetInfo, clickedElement, options, extractionId) {
			try {
				const apiMedias = await getTweetMedias(tweetInfo.tweetId, void 0, options.signal);
				if (!apiMedias || apiMedias.length === 0) return createFailureResult("No media found in API response", "twitter-api", "api-extraction-failed");
				const mediaItems = convertAPIMediaToMediaInfo(apiMedias, tweetInfo, extractTweetTextHTMLFromClickedElement(clickedElement));
				return {
					success: true,
					mediaItems,
					clickedIndex: determineClickedIndex(clickedElement, mediaItems),
					metadata: {
						extractedAt: performance.now(),
						sourceType: "twitter-api",
						strategy: "api-extraction",
						apiMediaCount: apiMedias.length
					},
					tweetInfo
				};
			} catch (error) {
				return createFailureResult(normalizeErrorMessage(error), "twitter-api", "api-extraction-failed");
			}
		}
	};
	//#endregion
	//#region src/shared/utils/id.ts
	/**
	* @fileoverview Unique ID generation utilities.
	*
	* Provides functions for creating unique identifiers with optional prefixes.
	* Used across services and hooks to generate stable, collision-free IDs.
	*/
	/**
	* Generates a unique ID using crypto.randomUUID with fallback for
	* non-secure contexts where crypto.randomUUID() may throw.
	*
	* Accepts an optional `seed` parameter for determinism in tests.
	* When `seed` is provided, it is returned directly (no randomness).
	*
	* @param seed - Optional deterministic seed (returned as-is for testability)
	* @returns Compact unique identifier without dashes.
	*/
	function generateUniqueId(seed) {
		if (seed) return seed;
		try {
			return crypto.randomUUID().replaceAll("-", "");
		} catch {
			return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}-${performance.now()}`;
		}
	}
	/** @deprecated Use `generateUniqueId(seed?)` instead — kept for backward compat */
	var createId = generateUniqueId;
	/**
	* Generates a prefixed unique ID.
	* @param prefix - The prefix for the ID
	* @param separator - Separator between prefix and ID (default: '_')
	* @returns Prefixed ID in format: `{prefix}{separator}{id}`
	*/
	function createPrefixedId(prefix, separator = "_") {
		return `${prefix}${separator}${generateUniqueId()}`;
	}
	//#endregion
	//#region src/shared/utils/performance/scheduler-yield.ts
	/**
	* @fileoverview scheduler.yield() utility with feature detection
	* @description Breaks up long tasks by yielding to the main thread.
	*              Uses `scheduler.yield()` where available (Chromium 115+),
	*              falls back to `setTimeout(fn, 50)` for other browsers.
	*/
	/**
	* Yield to the main thread, allowing the browser to process pending
	* rendering and input events before resuming the current task.
	*
	* Usage:
	* ```ts
	* for (const item of items) {
	*   await schedulerYield();
	*   process(item);
	* }
	* ```
	*
	* @param deadlineMs - Fallback deadline in ms (used when scheduler.yield() is
	*                     unavailable). Default matches {@linkcode SCHEDULER_YIELD_DEADLINE_MS}.
	* @returns Promise that resolves when the task can resume
	*/
	async function schedulerYield(deadlineMs = 50) {
		if (typeof window !== "undefined" && "scheduler" in window && typeof window.scheduler.yield === "function") return window.scheduler.yield();
		return new Promise((resolve) => setTimeout(resolve, deadlineMs));
	}
	//#endregion
	//#region src/shared/services/media-extraction/media-extraction-service.ts
	var generateExtractionId = () => createPrefixedId("simp");
	function createErrorResult(error, code = ErrorCode.NO_MEDIA_FOUND) {
		const errorMessage = normalizeErrorMessage(error);
		return {
			success: false,
			mediaItems: [],
			clickedIndex: 0,
			metadata: {
				extractedAt: performance.now(),
				sourceType: "extraction-failed",
				strategy: "media-extraction",
				error: errorMessage
			},
			tweetInfo: null,
			errors: [new ExtractionError(code, errorMessage)]
		};
	}
	function mergeTweetInfo(base, override) {
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
	function finalizeResult(result) {
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
	var MediaExtractionService = class MediaExtractionService {
		tweetInfoExtractor;
		apiExtractor;
		domFallbackExtractor;
		apiFailureCount = 0;
		apiCircuitOpen = false;
		lastApiFailureTime = 0;
		static CIRCUIT_THRESHOLD = 3;
		static CIRCUIT_RESET_MS = 6e4;
		constructor() {
			this.tweetInfoExtractor = new TweetInfoExtractor();
			this.apiExtractor = new TwitterAPIExtractor();
			this.domFallbackExtractor = new DOMFallbackExtractor();
		}
		isApiCircuitOpen() {
			if (!this.apiCircuitOpen) return false;
			if (Date.now() - this.lastApiFailureTime > MediaExtractionService.CIRCUIT_RESET_MS) {
				this.apiCircuitOpen = false;
				this.apiFailureCount = 0;
				return false;
			}
			return true;
		}
		recordApiFailure() {
			this.apiFailureCount++;
			this.lastApiFailureTime = Date.now();
			if (this.apiFailureCount >= MediaExtractionService.CIRCUIT_THRESHOLD) this.apiCircuitOpen = true;
		}
		async extractFromClickedElement(element, options = {}) {
			const extractionId = generateExtractionId();
			if (options.signal?.aborted) return createErrorResult("Extraction cancelled");
			try {
				const tweetInfo = this.tweetInfoExtractor.extract(element);
				if (!tweetInfo?.tweetId) return createErrorResult("No tweet information found");
				const apiResult = this.isApiCircuitOpen() ? {
					success: false,
					mediaItems: [],
					clickedIndex: 0,
					metadata: { sourceType: "circuit-open" },
					tweetInfo: null,
					errors: []
				} : await this.apiExtractor.extract(tweetInfo, element, options, extractionId);
				if (apiResult.success && apiResult.mediaItems.length > 0) {
					this.apiFailureCount = 0;
					this.apiCircuitOpen = false;
					return finalizeResult({
						...apiResult,
						tweetInfo: mergeTweetInfo(tweetInfo, apiResult.tweetInfo)
					});
				}
				if (options.signal?.aborted) return createErrorResult("Extraction cancelled");
				if (!apiResult.success) this.recordApiFailure();
				await schedulerYield(50);
				const domResult = await this.domFallbackExtractor.extract(tweetInfo, element, options, extractionId);
				if (options.signal?.aborted) return createErrorResult("Extraction cancelled");
				if (domResult.success && domResult.mediaItems.length > 0) return finalizeResult({
					...domResult,
					tweetInfo: mergeTweetInfo(tweetInfo, domResult.tweetInfo)
				});
				const base = createErrorResult(apiResult.metadata?.error ?? apiResult.errors?.[0]?.message ?? "API extraction failed", ErrorCode.ALL_FAILED);
				return {
					...base,
					clickedIndex: apiResult.clickedIndex ?? 0,
					metadata: {
						...base.metadata,
						...apiResult.metadata ?? {},
						strategy: "api-extraction",
						sourceType: "extraction-failed"
					},
					tweetInfo: mergeTweetInfo(tweetInfo, apiResult.tweetInfo)
				};
			} catch (error) {
				return createErrorResult(error);
			}
		}
		async extractAllFromContainer(container, options = {}) {
			try {
				const firstMedia = container.querySelector(TWITTER_MEDIA_SELECTOR);
				if (!firstMedia || !(firstMedia instanceof HTMLElement)) return createErrorResult("No media found in container");
				return this.extractFromClickedElement(firstMedia, options);
			} catch (error) {
				return createErrorResult(error);
			}
		}
	};
	//#endregion
	//#region src/shared/services/media-service.ts
	var MediaService = class {
		mediaExtraction = null;
		prefetchManager = new PrefetchManager(20);
		didCleanup = false;
		_initialized = false;
		/** Initialize service (idempotent) */
		async initialize() {
			if (this._initialized) return;
			this.didCleanup = false;
			this.mediaExtraction = new MediaExtractionService();
			this._initialized = true;
		}
		/** Destroy service (idempotent) */
		destroy() {
			this.cleanupOnce();
			this._initialized = false;
		}
		/** Check if service is initialized */
		isInitialized() {
			return this._initialized;
		}
		cleanupOnce() {
			if (this.didCleanup) return;
			this.didCleanup = true;
			this.prefetchManager.destroy();
		}
		async extractFromClickedElement(element, options = {}) {
			if (!this.mediaExtraction) throw new Error("Media Extraction not initialized");
			const result = await this.mediaExtraction.extractFromClickedElement(element, options);
			if (result.success && result.mediaItems.length > 0) {
				const items = result.mediaItems;
				const clickedIndex = clampIndex(result.clickedIndex ?? 0, items.length);
				const scheduled = /* @__PURE__ */ new Set();
				const clickedItem = items[clickedIndex];
				if (clickedItem) {
					scheduled.add(clickedItem.url);
					this.prefetchMedia(clickedItem, "immediate");
				}
				items.forEach((item, index) => {
					if (!item) return;
					if (index === clickedIndex) return;
					if (scheduled.has(item.url)) return;
					scheduled.add(item.url);
					this.prefetchMedia(item, "idle");
				});
			}
			return result;
		}
		async extractAllFromContainer(container, options = {}) {
			if (!this.mediaExtraction) throw new Error("Media Extraction not initialized");
			return this.mediaExtraction.extractAllFromContainer(container, options);
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
	};
	var { getInstance: getMediaService, resetForTests: resetMediaServiceForTests } = createSingleton(() => new MediaService());
	//#endregion
	//#region src/shared/utils/events/emitter.ts
	/**
	* Creates a type-safe event emitter for feature-local coordination.
	* Listener exceptions are isolated — one failing callback does not affect others.
	*
	* @returns An EventEmitter with on(), emit(), and dispose() methods
	*/
	function createEventEmitter() {
		const listeners = /* @__PURE__ */ new Map();
		let disposed = false;
		return {
			on(event, callback) {
				const eventListeners = listeners.get(event);
				if (eventListeners) eventListeners.add(callback);
				else listeners.set(event, /* @__PURE__ */ new Set([callback]));
				return () => {
					const currentListeners = listeners.get(event);
					if (currentListeners) currentListeners.delete(callback);
				};
			},
			emit(event, data) {
				if (disposed) return;
				const eventListeners = listeners.get(event);
				if (!eventListeners) return;
				for (const callback of eventListeners) try {
					callback(data);
				} catch (error) {}
			},
			dispose() {
				listeners.clear();
				disposed = true;
			}
		};
	}
	//#endregion
	//#region node_modules/.pnpm/solid-js@1.9.14/node_modules/solid-js/dist/solid.js
	var sharedConfig = {
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
	var equalFn = (a, b) => a === b;
	var $PROXY = Symbol("solid-proxy");
	var SUPPORTS_PROXY = typeof Proxy === "function";
	var signalOptions = { equals: equalFn };
	var ERROR = null;
	var runEffects = runQueue;
	var STALE = 1;
	var PENDING = 2;
	var UNOWNED = {
		owned: null,
		cleanups: null,
		context: null,
		owner: null
	};
	var Owner = null;
	var Transition = null;
	var Scheduler = null;
	var ExternalSourceConfig = null;
	var Listener = null;
	var Updates = null;
	var Effects = null;
	var ExecCount = 0;
	function createRoot(fn, detachedOwner) {
		const listener = Listener, owner = Owner, unowned = fn.length === 0, current = detachedOwner === void 0 ? owner : detachedOwner, root = unowned ? UNOWNED : {
			owned: null,
			cleanups: null,
			context: current ? current.context : null,
			owner: current
		}, updateFn = unowned ? fn : () => fn(() => untrack(() => cleanNode(root)));
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
		const setter = (value) => {
			if (typeof value === "function") if (Transition && Transition.running && Transition.sources.has(s)) value = value(s.tValue);
			else value = value(s.value);
			return writeSignal(s, value);
		};
		return [readSignal.bind(s), setter];
	}
	function createComputed(fn, value, options) {
		const c = createComputation(fn, value, true, STALE);
		if (Scheduler && Transition && Transition.running) Updates.push(c);
		else updateComputation(c);
	}
	function createRenderEffect(fn, value, options) {
		const c = createComputation(fn, value, false, STALE);
		if (Scheduler && Transition && Transition.running) Updates.push(c);
		else updateComputation(c);
	}
	function createEffect(fn, value, options) {
		runEffects = runUserEffects;
		const c = createComputation(fn, value, false, STALE), s = SuspenseContext && useContext(SuspenseContext);
		if (s) c.suspense = s;
		if (!options || !options.render) c.user = true;
		Effects ? Effects.push(c) : updateComputation(c);
	}
	function createMemo(fn, value, options) {
		options = options ? Object.assign({}, signalOptions, options) : signalOptions;
		const c = createComputation(fn, value, true, 0);
		c.observers = null;
		c.observerSlots = null;
		c.comparator = options.equals || void 0;
		if (Scheduler && Transition && Transition.running) {
			c.tState = STALE;
			Updates.push(c);
		} else updateComputation(c);
		return readSignal.bind(c);
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
		const isArray = Array.isArray(deps);
		let prevInput;
		let defer = options && options.defer;
		return (prevValue) => {
			let input;
			if (isArray) {
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
		if (Owner === null);
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
		} catch (err) {
			handleError(err);
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
		} catch (err) {
			handleError(err);
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
	var [transPending, setTransPending] = /*@__PURE__*/ createSignal(false);
	function useContext(context) {
		let value;
		return Owner && Owner.context && (value = Owner.context[context.id]) !== void 0 ? value : context.defaultValue;
	}
	var SuspenseContext;
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
			const observers = this.observers;
			if (!observers || observers[observers.length - 1] !== Listener) {
				const sSlot = observers ? observers.length : 0;
				if (!Listener.sources) {
					Listener.sources = [this];
					Listener.sourceSlots = [sSlot];
				} else {
					Listener.sources.push(this);
					Listener.sourceSlots.push(sSlot);
				}
				if (!observers) {
					this.observers = [Listener];
					this.observerSlots = [Listener.sources.length - 1];
				} else {
					observers.push(Listener);
					this.observerSlots.push(Listener.sources.length - 1);
				}
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
					throw new Error();
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
		} catch (err) {
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
			return handleError(err);
		} finally {
			Listener = listener;
			Owner = owner;
		}
		if (!node.updatedAt || node.updatedAt <= time) {
			if (node.updatedAt != null && "observers" in node) writeSignal(node, nextValue, true);
			else if (Transition && Transition.running && node.pure) {
				if (!Transition.sources.has(node)) node.value = nextValue;
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
		if (Owner === null);
		else if (Owner !== UNOWNED) if (Transition && Transition.running && Owner.pure) if (!Owner.tOwned) Owner.tOwned = [c];
		else Owner.tOwned.push(c);
		else if (!Owner.owned) Owner.owned = [c];
		else Owner.owned.push(c);
		if (ExternalSourceConfig && c.fn) {
			const sourceFn = c.fn;
			const [track, trigger] = createSignal(void 0, { equals: false });
			const ordinary = ExternalSourceConfig.factory(sourceFn, trigger);
			onCleanup(() => ordinary.dispose());
			let inTransition;
			const triggerInTransition = () => startTransition(trigger).then(() => {
				if (inTransition) {
					inTransition.dispose();
					inTransition = void 0;
				}
			});
			c.fn = (x) => {
				track();
				if (Transition && Transition.running) {
					if (!inTransition) inTransition = ExternalSourceConfig.factory(sourceFn, triggerInTransition);
					return inTransition.track(x);
				}
				return ordinary.track(x);
			};
		}
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
		} catch (err) {
			if (!wait) Effects = null;
			Updates = null;
			handleError(err);
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
				for (const e of Effects) {
					"tState" in e && (e.state = e.tState);
					delete e.tState;
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
	}
	function reset(node, top) {
		if (!top) {
			node.tState = 0;
			Transition.disposed.add(node);
		}
		if (node.owned) for (let i = 0; i < node.owned.length; i++) reset(node.owned[i]);
	}
	function castError(err) {
		if (err instanceof Error) return err;
		return new Error(typeof err === "string" ? err : "Unknown error", { cause: err });
	}
	function runErrors(err, fns, owner) {
		try {
			for (const f of fns) f(err);
		} catch (e) {
			handleError(e, owner && owner.owner || null);
		}
	}
	function handleError(err, owner = Owner) {
		const fns = ERROR && owner && owner.context && owner.context[ERROR];
		const error = castError(err);
		if (!fns) throw error;
		if (Effects) Effects.push({
			fn() {
				runErrors(error, fns, owner);
			},
			state: STALE
		});
		else runErrors(error, fns, owner);
	}
	var FALLBACK = Symbol("fallback");
	function dispose(d) {
		for (let i = 0; i < d.length; i++) d[i]();
	}
	function mapArray(list, mapFn, options = {}) {
		let items = [], mapped = [], disposers = [], len = 0, indexes = mapFn.length > 1 ? [] : null;
		onCleanup(() => dispose(disposers));
		return () => {
			let newItems = list() || [], newLen = newItems.length, i, j;
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
					const [s, set] = createSignal(j);
					indexes[j] = set;
					return mapFn(newItems[j], s);
				}
				return mapFn(newItems[j]);
			}
		};
	}
	var hydrationEnabled = false;
	function createComponent(Comp, props) {
		if (hydrationEnabled) {
			if (sharedConfig.context) {
				const c = sharedConfig.context;
				setHydrateContext(nextHydrateContext());
				const r = untrack(() => Comp(props || {}));
				setHydrateContext(c);
				return r;
			}
		}
		return untrack(() => Comp(props || {}));
	}
	function trueFn() {
		return true;
	}
	var propTraps = {
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
	var counter = 0;
	function createUniqueId() {
		return sharedConfig.context ? sharedConfig.getNextContextId() : `cl-${counter++}`;
	}
	var narrowedError = (name) => `Stale read from <${name}>.`;
	function For(props) {
		const fallback = "fallback" in props && { fallback: () => props.fallback };
		return createMemo(mapArray(() => props.each, props.children, fallback || void 0));
	}
	function Show(props) {
		const keyed = props.keyed;
		const conditionValue = createMemo(() => props.when, void 0, void 0);
		const condition = keyed ? conditionValue : createMemo(conditionValue, void 0, { equals: (a, b) => !a === !b });
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
		}, void 0, void 0);
	}
	var Errors;
	function ErrorBoundary$1(props) {
		let err;
		if (sharedConfig.context && sharedConfig.load) err = sharedConfig.load(sharedConfig.getContextId());
		const [errored, setErrored] = createSignal(err, void 0);
		Errors || (Errors = /* @__PURE__ */ new Set());
		Errors.add(setErrored);
		onCleanup(() => Errors.delete(setErrored));
		return createMemo(() => {
			let e;
			if (e = errored()) {
				const f = props.fallback;
				return typeof f === "function" && f.length ? untrack(() => f(e, () => setErrored())) : f;
			}
			return catchError(() => props.children, setErrored);
		}, void 0, void 0);
	}
	//#endregion
	//#region src/shared/state/signals/gallery-download-signals.ts
	/**
	* Gallery download state management signals.
	*
	* Tracks whether a download operation is in progress to disable
	* UI controls and prevent concurrent downloads. Separated from
	* core gallery signals to keep the main signal file focused on
	* gallery lifecycle.
	*/
	var [_isProcessing, _setIsProcessing] = createSignal(false);
	var downloadState = { get isProcessing() {
		return _isProcessing();
	} };
	/**
	* Sets the download processing state.
	* Used by download hooks to signal that a download operation is in progress,
	* which disables UI controls to prevent concurrent downloads.
	*
	* @param value - `true` when a download starts, `false` when it completes
	*/
	function setDownloading(value) {
		_setIsProcessing(value);
	}
	//#endregion
	//#region src/shared/state/signals/gallery-navigation-signals.ts
	/**
	* Gallery navigation state management signals.
	*
	* Tracks navigation source, timestamp, and focused index for gallery
	* item transitions. Separated from core gallery signals to keep the
	* main signal file focused on gallery lifecycle.
	*/
	var INITIAL_NAV_SOURCE = "auto-focus";
	var [_navSource, setNavSource] = createSignal(INITIAL_NAV_SOURCE);
	var [_navTimestamp, setNavTimestamp] = createSignal(0);
	var [_navIndex, setNavIndex] = createSignal(null);
	var isManualSource = (source) => source === "button" || source === "keyboard";
	/**
	* Records a navigation event with target index, source, and timestamp.
	* Skips duplicate manual-source navigations to the same index (only updates timestamp).
	*
	* @param targetIndex - The navigation target item index
	* @param source - How the navigation was triggered (button, keyboard, scroll, etc.)
	* @param nowMs - Optional timestamp in milliseconds for determinism.
	*   Pass for test reproducibility. Defaults to performance.now() (non-RT).
	*/
	function recordNavigation(targetIndex, source, nowMs) {
		const timestamp = nowMs ?? performance.now();
		const currentIndex = _navIndex();
		const currentSource = _navSource();
		if (targetIndex === currentIndex && isManualSource(source) && isManualSource(currentSource)) {
			setNavTimestamp(timestamp);
			return;
		}
		setNavSource(source);
		setNavTimestamp(timestamp);
		setNavIndex(targetIndex);
	}
	/**
	* Resets navigation state to initial values.
	* Typically called on gallery open/close to clear the previous session's navigation history.
	*
	* @param nowMs - Optional timestamp in milliseconds for determinism.
	*   Pass for test reproducibility. Defaults to performance.now() (non-RT).
	*/
	function resetNavigation(nowMs) {
		setNavSource(INITIAL_NAV_SOURCE);
		setNavTimestamp(nowMs ?? performance.now());
		setNavIndex(null);
	}
	//#endregion
	//#region src/shared/state/signals/gallery.signals.ts
	var INITIAL_STATE = {
		isOpen: false,
		mediaItems: [],
		currentIndex: 0,
		error: null
	};
	var _galleryIndexEvents = null;
	function getGalleryIndexEvents() {
		if (!_galleryIndexEvents) _galleryIndexEvents = createEventEmitter();
		return _galleryIndexEvents;
	}
	var galleryIndexEvents = {
		get on() {
			return getGalleryIndexEvents().on.bind(getGalleryIndexEvents());
		},
		get emit() {
			return getGalleryIndexEvents().emit.bind(getGalleryIndexEvents());
		},
		dispose() {
			_galleryIndexEvents?.dispose();
			_galleryIndexEvents = null;
		}
	};
	var [isOpenSig, setIsOpenSig] = createSignal(INITIAL_STATE.isOpen);
	var [mediaItemsSig, setMediaItems] = createSignal(INITIAL_STATE.mediaItems);
	var [currentIndexSig, setCurrentIndex] = createSignal(INITIAL_STATE.currentIndex);
	var [focusedIndexSig, _setFocusedIndex] = createSignal(null);
	/**
	* Set the focused index directly without triggering navigation events.
	* Used for UI-only focus tracking updates (e.g., IntersectionObserver-based
	* auto-focus) where scroll-to-item behavior is undesirable.
	*/
	function setFocusedIndexOnly(index) {
		_setFocusedIndex(index);
	}
	var [currentVideoElementSig, setCurrentVideoElement] = createSignal(null);
	var [_errorSig, _setErrorSig] = createSignal(INITIAL_STATE.error);
	/**
	* Gallery state proxy object.
	*
	* ⚠️ IMPORTANT: This object's getters read signals and are ONLY reactive
	* inside Solid.js tracking scopes (createEffect, createMemo, JSX).
	* Reading these properties outside a tracking scope returns stale values.
	*
	* For direct signal access, use the exported signal accessors instead.
	*/
	var gallerySignals = {
		get isOpen() {
			return isOpenSig();
		},
		get mediaItems() {
			return mediaItemsSig();
		},
		get currentIndex() {
			return currentIndexSig();
		},
		get error() {
			return _errorSig();
		},
		get focusedIndex() {
			return focusedIndexSig();
		},
		get currentVideoElement() {
			return currentVideoElementSig();
		}
	};
	/**
	* Sets or clears the gallery error message.
	* Pass `null` to clear a previously set error.
	*
	* @param error - Error message string, or `null` to clear
	*/
	function setError(error) {
		batch(() => {
			_setErrorSig(error);
		});
	}
	function applyGallerySessionUpdate(state) {
		batch(() => {
			setMediaItems(state.mediaItems);
			setCurrentIndex(state.currentIndex);
			_setFocusedIndex(state.focusedIndex);
			setCurrentVideoElement(state.currentVideoElement);
			_setErrorSig(state.error);
			setIsOpenSig(state.isOpen);
		});
	}
	/**
	* Opens the gallery with the given media items.
	* Resets navigation state and clears any previous error.
	* All state updates are batched so subscribers receive a single snapshot.
	*
	* @param items - Media items to display in the gallery
	* @param startIndex - Initial focused item index (default: 0, clamped to valid range)
	*/
	function openGallery(items, startIndex = 0) {
		const validIndex = clampIndex(startIndex, items.length);
		applyGallerySessionUpdate({
			isOpen: true,
			mediaItems: items,
			currentIndex: validIndex,
			focusedIndex: validIndex,
			currentVideoElement: null,
			error: null
		});
		resetNavigation();
	}
	/**
	* Closes the gallery and resets all session state.
	* Media items are cleared, indices reset, and navigation state is re-initialized.
	*/
	function closeGallery() {
		applyGallerySessionUpdate({
			isOpen: false,
			currentIndex: 0,
			mediaItems: [],
			focusedIndex: null,
			currentVideoElement: null,
			error: null
		});
		resetNavigation();
	}
	/**
	* Resolves the anchor index for prev/next navigation.
	* Prefers focusedIndexSig (what the user is actually looking at via
	* IntersectionObserver) over currentIndexSig (last explicitly navigated to).
	* Only uses focusedIndex when it is a valid in-bounds value.
	*/
	function _resolveNavAnchor() {
		const focus = focusedIndexSig();
		const items = mediaItemsSig();
		if (typeof focus === "number" && focus >= 0 && focus < items.length) return focus;
		return currentIndexSig();
	}
	/**
	* Navigates to the next item in the gallery.
	* Uses focusedIndex as anchor when available (what the user is looking at),
	* falling back to currentIndex. No-op when at the last item or ≤1 items.
	* Emits `navigate:complete` event on success.
	*
	* @param trigger - How the navigation was triggered (default: `'click'`)
	*/
	function navigateNext(trigger = "click") {
		const items = mediaItemsSig();
		const current = _resolveNavAnchor();
		if (items.length <= 1) return;
		const next = current + 1;
		if (next >= items.length) return;
		batch(() => {
			setCurrentIndex(next);
			_setFocusedIndex(next);
		});
		recordNavigation(next, trigger);
		galleryIndexEvents.emit("navigate:complete", {
			index: next,
			trigger
		});
	}
	/**
	* Navigates to the previous item in the gallery.
	* Uses focusedIndex as anchor when available (what the user is looking at),
	* falling back to currentIndex. No-op when at the first item or ≤1 items.
	* Emits `navigate:complete` event on success.
	*
	* @param trigger - How the navigation was triggered (default: `'click'`)
	*/
	function navigatePrevious(trigger = "click") {
		const items = mediaItemsSig();
		const current = _resolveNavAnchor();
		if (items.length <= 1) return;
		const prev = current - 1;
		if (prev < 0) return;
		batch(() => {
			setCurrentIndex(prev);
			_setFocusedIndex(prev);
		});
		recordNavigation(prev, trigger);
		galleryIndexEvents.emit("navigate:complete", {
			index: prev,
			trigger
		});
	}
	/**
	* Navigates directly to a specific item index.
	* The target index is clamped to the valid range. No-op when already at the target.
	* Emits `navigate:complete` event on success.
	*
	* @param targetIndex - Desired item index (clamped to `[0, items.length)`)
	* @param source - How the navigation was triggered
	*/
	function navigateToItem(targetIndex, source) {
		const clampedIndex = clampIndex(targetIndex, mediaItemsSig().length);
		if (clampedIndex === currentIndexSig()) return;
		batch(() => {
			setCurrentIndex(clampedIndex);
			_setFocusedIndex(clampedIndex);
		});
		recordNavigation(clampedIndex, source);
		galleryIndexEvents.emit("navigate:complete", {
			index: clampedIndex,
			trigger: source
		});
	}
	/**
	* Resets all gallery signals to their initial state.
	* Called during cleanup to prevent stale state across sessions.
	*/
	function disposeGallerySignals() {
		galleryIndexEvents.dispose();
		batch(() => {
			setIsOpenSig(INITIAL_STATE.isOpen);
			setMediaItems(INITIAL_STATE.mediaItems);
			setCurrentIndex(INITIAL_STATE.currentIndex);
			_setFocusedIndex(null);
			setCurrentVideoElement(null);
			setNavIndex(null);
			setNavSource(INITIAL_NAV_SOURCE);
			setNavTimestamp(0);
		});
		_setIsProcessing(false);
	}
	//#endregion
	//#region src/shared/utils/events/handlers/video-control-helper.ts
	/**
	* @fileoverview Unified video control helper with Service/Video fallback pattern
	* @description Integration point for video control logic.
	*/
	/**
	* Executes video control action on gallery video element.
	*
	* Unified integration point for video control using Service → Video fallback pattern.
	* Supports play, pause, toggle, volume adjustment, and mute operations.
	*
	* @param action - Video control action to execute
	* @param options - Configuration with video element and context
	*
	* @example
	* ```ts
	* executeVideoControl('togglePlayPause');
	* executeVideoControl('volumeUp', { context: 'keyboard' });
	* executeVideoControl('mute', { video: videoElement });
	* ```
	*/
	function executeVideoControl(action, options = {}) {
		try {
			const video = getGalleryVideo(options.video);
			if (!video) return;
			switch (action) {
				case "play":
					playVideo(video, options.context);
					break;
				case "pause":
					pauseVideo(video);
					break;
				case "togglePlayPause":
					togglePlayPause(video, options.context);
					break;
				case "volumeUp":
					adjustVolume(video, .1);
					break;
				case "volumeDown":
					adjustVolume(video, -.1);
					break;
				case "toggleMute":
					video.muted = !video.muted;
					break;
				case "mute":
					video.muted = true;
					break;
			}
		} catch (error) {
			logger.error("Video control error", {
				error,
				action,
				context: options.context
			});
		}
	}
	/**
	* Gets gallery video element from signal or parameter.
	* @internal
	*/
	function getGalleryVideo(video) {
		if (video instanceof HTMLVideoElement) return video;
		const signaled = gallerySignals.currentVideoElement;
		return signaled instanceof HTMLVideoElement ? signaled : null;
	}
	/**
	* Plays video with playback state tracking.
	* @internal
	*/
	function playVideo(video, context) {
		video.play?.().catch(() => {});
	}
	/**
	* Pauses video and updates state.
	* @internal
	*/
	function pauseVideo(video) {
		video.pause?.();
	}
	/**
	* Toggles play/pause state.
	* @internal
	*/
	function togglePlayPause(video, context) {
		if (!video.paused) pauseVideo(video);
		else playVideo(video, context);
	}
	/**
	* Adjusts volume by delta, auto-unmutes if increasing from zero.
	* @internal
	*/
	function adjustVolume(video, delta) {
		const newVolume = Math.round(Math.max(0, Math.min(1, video.volume + delta)) * 100) / 100;
		video.volume = newVolume;
		if (newVolume > 0 && video.muted) video.muted = false;
		if (newVolume === 0 && !video.muted) video.muted = true;
	}
	//#endregion
	//#region src/shared/utils/events/handlers/keyboard.ts
	/**
	* @fileoverview Keyboard event handler for gallery navigation and video control
	* PC-only policy: Handles keyboard events only
	*/
	function createKeyboardDebouncer() {
		let state = {
			lastExecutionTime: 0,
			lastKey: ""
		};
		let disposed = false;
		function shouldExecute(key, minIntervalMs) {
			if (disposed) return false;
			const now = performance.now();
			const timeSinceLastExecution = now - state.lastExecutionTime;
			if (key === state.lastKey && timeSinceLastExecution < minIntervalMs) return false;
			state = {
				lastExecutionTime: now,
				lastKey: key
			};
			return true;
		}
		function reset() {
			state = {
				lastExecutionTime: 0,
				lastKey: ""
			};
			disposed = false;
		}
		function dispose() {
			reset();
			disposed = true;
		}
		return {
			shouldExecute,
			reset,
			dispose
		};
	}
	var keyboardDebouncer = createKeyboardDebouncer();
	var resetKeyboardDebounceState = keyboardDebouncer.reset;
	/**
	* Disposes the keyboard debouncer, clearing internal state and rejecting
	* subsequent calls to shouldExecute(). Called during permanent teardown
	* (BUG-01: module-level debouncer now has a destroy/dispose path).
	*/
	var disposeKeyboardDebouncer = keyboardDebouncer.dispose;
	/** Navigation and help keys: Home, End, PageUp/Down, Arrows, ? */
	var NAVIGATION_KEYS = /* @__PURE__ */ new Set([
		"Home",
		"End",
		"PageDown",
		"PageUp",
		"ArrowLeft",
		"ArrowRight",
		"ArrowUp",
		"ArrowDown",
		"?"
	]);
	/** Video control keys: ArrowUp/Down, M (mute) */
	var VIDEO_CONTROL_KEYS = /* @__PURE__ */ new Set([
		"ArrowUp",
		"ArrowDown",
		"m",
		"M"
	]);
	function isEditableTarget(target) {
		const element = target;
		if (!element) return false;
		const tag = element.tagName?.toUpperCase();
		return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || !!element.isContentEditable;
	}
	/**
	* Handles keyboard events for gallery navigation and video control.
	* Routes keys to appropriate handlers based on gallery state.
	*
	* @param event - KeyboardEvent to process
	* @param handlers - Callbacks for custom handlers
	* @param options - Configuration options
	*/
	function handleKeyboardEvent(event, handlers, options) {
		if (!options.enableKeyboard) return;
		try {
			const key = event.key;
			const isGalleryOpen = gallerySignals.isOpen;
			if (key === "Escape" && isGalleryOpen) {
				if (isEditableTarget(event.target)) return;
				handlers.onGalleryClose();
				event.preventDefault();
				event.stopPropagation();
				return;
			}
			if (!isGalleryOpen) {
				handlers.onKeyboardEvent?.(event);
				return;
			}
			const isNavKey = NAVIGATION_KEYS.has(key) || key === " ";
			const isVideoKey = VIDEO_CONTROL_KEYS.has(key) || key === " ";
			if (!isNavKey && !isVideoKey) {
				handlers.onKeyboardEvent?.(event);
				return;
			}
			event.preventDefault();
			event.stopPropagation();
			if (key === "?") showKeyboardHelp();
			else if (key === " ") handleVideoControl(key);
			else if ((key === "ArrowUp" || key === "ArrowDown") && gallerySignals.currentVideoElement) handleVideoControl(key);
			else if (NAVIGATION_KEYS.has(key)) handleNavigation(key);
			else if (isVideoKey) handleVideoControl(key);
			handlers.onKeyboardEvent?.(event);
		} catch (error) {}
	}
	/**
	* Handles navigation keys (arrows, Home, End, PageUp/Down).
	* @internal
	*/
	function handleNavigation(key) {
		const current = gallerySignals.currentIndex;
		const total = gallerySignals.mediaItems.length;
		switch (key) {
			case "ArrowLeft":
				navigatePrevious("keyboard");
				break;
			case "ArrowRight":
				navigateNext("keyboard");
				break;
			case "ArrowUp":
				navigatePrevious("keyboard");
				break;
			case "ArrowDown":
				navigateNext("keyboard");
				break;
			case "Home":
				navigateToItem(0, "keyboard");
				break;
			case "End":
				navigateToItem(Math.max(0, total - 1), "keyboard");
				break;
			case "PageUp":
				navigateToItem(Math.max(0, current - 5), "keyboard");
				break;
			case "PageDown":
				navigateToItem(Math.min(total - 1, current + 5), "keyboard");
				break;
		}
	}
	/**
	* Handles video control keys (Space, Arrow Up/Down, M).
	* @internal
	*/
	function handleVideoControl(key) {
		switch (key) {
			case "Space":
				if (keyboardDebouncer.shouldExecute("Space", 150)) executeVideoControl("togglePlayPause");
				break;
			case "ArrowUp":
				if (keyboardDebouncer.shouldExecute("ArrowUp", 100)) executeVideoControl("volumeUp");
				break;
			case "ArrowDown":
				if (keyboardDebouncer.shouldExecute("ArrowDown", 100)) executeVideoControl("volumeDown");
				break;
			case "m":
			case "M":
				if (keyboardDebouncer.shouldExecute("M", 100)) executeVideoControl("toggleMute");
				break;
		}
	}
	/**
	* Shows keyboard help notification with debouncing to prevent spam.
	* @internal
	*/
	function showKeyboardHelp() {
		if (!keyboardDebouncer.shouldExecute("?", 500)) return;
		try {
			const lang = getLanguageService();
			getNotificationAdapter().notify(lang.translate("msg.kb.t"), [
				lang.translate("msg.kb.prev"),
				lang.translate("msg.kb.next"),
				lang.translate("msg.kb.cls"),
				lang.translate("msg.kb.toggle")
			].join("\n"));
		} catch {}
	}
	//#endregion
	//#region src/shared/services/event-manager.ts
	var elementIds = /* @__PURE__ */ new WeakMap();
	var nextElementId = 0;
	var listenerIds = /* @__PURE__ */ new WeakMap();
	var nextListenerId = 0;
	/** Composite key for duplicate detection: `${type}::${elementId}::${listenerId}` */
	function makeCompositeKey(element, type, listener) {
		let eid = elementIds.get(element);
		if (eid === void 0) {
			eid = nextElementId++;
			elementIds.set(element, eid);
		}
		let lid = listenerIds.get(listener);
		if (lid === void 0) {
			lid = nextListenerId++;
			listenerIds.set(listener, lid);
		}
		return `${type}::${eid}::${lid}`;
	}
	var EventManager = class {
		listeners = /* @__PURE__ */ new Map();
		listenerKeys = /* @__PURE__ */ new Map();
		/** Destroy service */
		destroy() {
			this.cleanup();
		}
		addEventListener(element, type, listener, options) {
			const { context, ...listenerOptions } = options ?? {};
			if (!element || typeof element.addEventListener !== "function") return null;
			if (typeof listener !== "function") return null;
			const compositeKey = makeCompositeKey(element, type, listener);
			if (this.listenerKeys.get(type)?.has(compositeKey)) return null;
			const signal = listenerOptions.signal;
			if (signal?.aborted) return null;
			try {
				element.addEventListener(type, listener, listenerOptions);
				const id = context ? createPrefixedId(context) : createId();
				this.listeners.set(id, {
					id,
					element,
					type,
					listener,
					options: listenerOptions,
					context
				});
				if (!this.listenerKeys.has(type)) this.listenerKeys.set(type, /* @__PURE__ */ new Set());
				this.listenerKeys.get(type).add(compositeKey);
				if (signal) {
					const onSignalAbort = () => {
						signal.removeEventListener("abort", onSignalAbort);
						this.listeners.delete(id);
						const keys = this.listenerKeys.get(type);
						if (keys) {
							keys.delete(compositeKey);
							if (keys.size === 0) this.listenerKeys.delete(type);
						}
					};
					signal.addEventListener("abort", onSignalAbort);
				}
				return id;
			} catch (error) {
				return null;
			}
		}
		removeListener(id) {
			if (!this.listeners.has(id)) return false;
			return this.removeListenerById(id);
		}
		removeByContext(context) {
			const toRemove = [];
			for (const [id, ctx] of this.listeners) if (ctx.context === context) toRemove.push(id);
			let count = 0;
			for (const id of toRemove) if (this.removeListenerById(id)) count++;
			return count;
		}
		getListenerStatus() {
			return this.listeners.size;
		}
		cleanup() {
			const entries = Array.from(this.listeners.entries());
			this.listeners.clear();
			this.listenerKeys.clear();
			for (const [, ctx] of entries) try {
				ctx.element.removeEventListener(ctx.type, ctx.listener, ctx.options);
			} catch {}
		}
		removeListenerById(id) {
			const ctx = this.listeners.get(id);
			if (!ctx) return false;
			try {
				ctx.element.removeEventListener(ctx.type, ctx.listener, ctx.options);
				this.listeners.delete(id);
				const compositeKey = makeCompositeKey(ctx.element, ctx.type, ctx.listener);
				const typeKeys = this.listenerKeys.get(ctx.type);
				if (typeKeys) {
					typeKeys.delete(compositeKey);
					if (typeKeys.size === 0) this.listenerKeys.delete(ctx.type);
				}
				return true;
			} catch (error) {
				return false;
			}
		}
	};
	var { getInstance: getEventManager, resetForTests: resetEventManagerForTests } = createSingleton(() => new EventManager());
	//#endregion
	//#region src/constants/css.ts
	/**
	* @fileoverview Gallery DOM tokens (class names, data attributes, selectors).
	*
	* Single source of truth for CSS classes, data attributes, and DOM selectors.
	* All classes use `xeg-` prefix to avoid conflicts with Twitter's styles.
	*
	* @module constants/css
	*/
	var CLASSES = {
		OVERLAY: "xeg-gallery-overlay",
		CONTAINER: "xeg-gallery-container",
		ROOT: "xeg-gallery-root",
		RENDERER: "xeg-gallery-renderer",
		VERTICAL_VIEW: "xeg-vertical-gallery",
		ITEM: "xeg-gallery-item"
	};
	var DATA_ATTRIBUTES = { GALLERY: "data-xeg-gallery" };
	var ARIA_ROLES = {
		GALLERY: "[role=\"dialog\"]",
		LIST: "[role=\"list\"]",
		LIST_ITEM: "[role=\"listitem\"]"
	};
	var SELECTORS = {
		OVERLAY: `.${CLASSES.OVERLAY}`,
		CONTAINER: `.${CLASSES.CONTAINER}`,
		ROOT: `.${CLASSES.ROOT}`,
		RENDERER: `.${CLASSES.RENDERER}`,
		VERTICAL_VIEW: `.${CLASSES.VERTICAL_VIEW}`,
		ITEM: `.${CLASSES.ITEM}`,
		DATA_GALLERY: `[${DATA_ATTRIBUTES.GALLERY}]`,
		ROLE_GALLERY: ARIA_ROLES.GALLERY,
		ROLE_LIST: ARIA_ROLES.LIST,
		ROLE_LIST_ITEM: ARIA_ROLES.LIST_ITEM
	};
	var CSS = {
		CLASSES,
		DATA_ATTRIBUTES,
		SELECTORS,
		INTERNAL_SELECTORS: [
			SELECTORS.OVERLAY,
			SELECTORS.CONTAINER,
			SELECTORS.ROOT,
			SELECTORS.RENDERER,
			SELECTORS.VERTICAL_VIEW,
			SELECTORS.ITEM,
			SELECTORS.DATA_GALLERY,
			"[data-gallery-element]",
			SELECTORS.ROLE_LIST_ITEM,
			"[data-role=\"toolbar\"]",
			"[data-role=\"toolbar-hover-zone\"]"
		],
		GALLERY_ELEMENT_SELECTORS: [
			SELECTORS.ITEM,
			"[data-gallery-element]",
			SELECTORS.ROLE_LIST_ITEM,
			"[data-role=\"toolbar\"]",
			"[data-role=\"toolbar-hover-zone\"]"
		]
	};
	/** CSS custom property for toolbar icon size. Use in CSS as `var(--xeg-toolbar-icon-size)`. */
	var TOOLBAR_ICON_SIZE_VAR = "var(--xeg-toolbar-icon-size)";
	//#endregion
	//#region src/shared/utils/types/guards.ts
	/**
	* @fileoverview Minimal type guards used by the runtime.
	* Keep this module small; prefer inlining simple instanceof checks.
	*/
	/**
	* Create a typed EventListener wrapper.
	* @template T - Event type to narrow to
	* @param handler - Handler with narrowed event type
	* @returns EventListener compatible with DOM event binding
	*/
	function createEventListener(handler) {
		return (event) => {
			handler(event);
		};
	}
	/**
	* HTML element type guard.
	* @param element - Value to check
	* @returns True if value is HTMLElement
	*/
	function isHTMLElement(element) {
		return element instanceof HTMLElement;
	}
	/**
	* Record object type guard.
	* @param value - Value to check
	* @returns True if value is a plain object (excludes arrays and null)
	*/
	function isRecord(value) {
		return typeof value === "object" && value !== null && !Array.isArray(value);
	}
	//#endregion
	//#region src/shared/dom/utils.ts
	/**
	* @fileoverview Gallery DOM utilities
	* @description DOM inspection and element detection for gallery feature.
	*/
	var VIDEO_CONTROL_DATASET_PREFIXES = [
		"play",
		"pause",
		"mute",
		"unmute",
		"volume",
		"slider",
		"seek",
		"scrub",
		"progress",
		"fullscreen",
		"pip",
		"settings",
		"captions",
		"subtitles",
		"cc"
	];
	var VIDEO_CONTROL_ROLES = ["slider", "progressbar"];
	var VIDEO_CONTROL_ARIA_TOKENS = [
		"volume",
		"mute",
		"unmute",
		"seek",
		"scrub",
		"timeline",
		"progress",
		"fullscreen",
		"caption"
	];
	var GALLERY_SELECTORS = CSS.INTERNAL_SELECTORS;
	var VIDEO_CONTROL_SELECTORS = [".video-controls", ".video-progress button"];
	/** Characters treated as word boundaries for token matching */
	var WORD_SEPARATORS = [
		"-",
		"_",
		" "
	];
	/**
	* Check if string value contains any control tokens (case-insensitive).
	* Uses word-boundary matching to avoid false positives
	* (e.g., "display" will NOT match token "play").
	*
	* Optimized: pre-tokenizes the input value into a Set of word-boundary-delimited
	* tokens, then checks membership in O(1) per token instead of O(n*m) scanning.
	*/
	function containsControlToken(value, tokens) {
		if (!value) return false;
		const normalized = value.toLowerCase();
		if (tokens.includes(normalized)) return true;
		const valueTokens = /* @__PURE__ */ new Set();
		const parts = normalized.split(/[-_\s]+/);
		for (const part of parts) if (part) valueTokens.add(part);
		return tokens.some((token) => {
			const tokenLower = token.toLowerCase();
			if (valueTokens.has(tokenLower)) return true;
			let searchIndex = 0;
			while (searchIndex < normalized.length) {
				const foundIndex = normalized.indexOf(tokenLower, searchIndex);
				if (foundIndex === -1) break;
				const beforeOk = foundIndex === 0 || WORD_SEPARATORS.includes(normalized[foundIndex - 1] ?? "");
				const afterEnd = foundIndex + tokenLower.length;
				const afterOk = afterEnd >= normalized.length || WORD_SEPARATORS.includes(normalized[afterEnd] ?? "");
				if (beforeOk && afterOk) return true;
				searchIndex = foundIndex + 1;
			}
			return false;
		});
	}
	/**
	* Get attribute value from element or nearest ancestor.
	*/
	function getNearestAttributeValue(element, attribute) {
		return element.closest(`[${attribute}]`)?.getAttribute(attribute) ?? null;
	}
	function isWithinVideoPlayer(element) {
		return element.closest(VIDEO_PLAYER_CONTEXT_SELECTOR) !== null;
	}
	function matchesVideoControlSelectors(element) {
		return VIDEO_CONTROL_SELECTORS.some((selector) => element.matches(selector) || element.closest(selector) !== null);
	}
	/**
	* Determine if element is a video control UI element.
	*
	* Detects interactive video player controls (play, pause, volume, seek,
	* fullscreen, etc.) while allowing clicks on the video media area itself
	* to trigger the gallery viewer.
	*
	* Detection strategy (in order):
	* 1. Known CSS control selectors (.video-controls, .video-progress button)
	* 2. data-testid attribute containing control tokens (on element or nearest ancestor)
	* 3. aria-label containing control tokens (on element or nearest ancestor)
	* 4. Inside video player context: role="slider"/"progressbar" or <input[type="range"]>
	*
	* Elements NOT considered controls:
	* - <video> tag itself (this is the media area, gallery launch is allowed)
	* - Generic elements inside the video player context without control tokens
	*   (these are typically overlay areas, poster images, or dead space)
	*/
	function isVideoControlElement(element) {
		if (!isHTMLElement(element)) return false;
		if (element.tagName.toLowerCase() === "video") return false;
		if (typeof element.matches !== "function") return false;
		if (matchesVideoControlSelectors(element)) return true;
		if (containsControlToken(getNearestAttributeValue(element, "data-testid"), VIDEO_CONTROL_DATASET_PREFIXES)) return true;
		if (containsControlToken(getNearestAttributeValue(element, "aria-label"), VIDEO_CONTROL_ARIA_TOKENS)) return true;
		if (!isWithinVideoPlayer(element)) return false;
		const role = element.getAttribute("role");
		if (role && VIDEO_CONTROL_ROLES.includes(role.toLowerCase())) return true;
		if (element.matches("input[type=\"range\"]")) return true;
		return false;
	}
	/**
	* Determine if any element in the event's composed path is a video control UI.
	*
	* Traverses the event's composed path (event.target → ancestors) to detect
	* video player control elements (volume slider, play button, seek bar, etc.).
	* Elements that are inside a video player context but do NOT match any
	* control token (e.g., video media area, poster, overlay) are NOT flagged.
	*
	* This is more robust than isVideoControlElement alone because it checks the
	* entire event path (from target up through ancestors), catching cases where
	* the immediate target is a generic element inside a video control container.
	*
	* @param element - The event target element
	* @param getComposedPath - Optional function returning the event's composed path
	*                          (pass event.composedPath() when available)
	* @returns true if any element in the path is a video control UI element
	*/
	function isVideoControlEvent(element, getComposedPath) {
		if (!isHTMLElement(element)) return false;
		if (isVideoControlElement(element)) return true;
		if (typeof getComposedPath === "function") try {
			const path = getComposedPath();
			if (Array.isArray(path)) for (const pathTarget of path) {
				if (!(pathTarget instanceof HTMLElement)) continue;
				if (!isWithinVideoPlayer(pathTarget)) break;
				if (isVideoControlElement(pathTarget)) return true;
			}
		} catch {}
		return false;
	}
	/**
	* Check if a click on a video player element should be allowed to trigger
	* gallery launch, based on the configured VideoClickMode.
	*
	* This is the single entry point for video-click decision logic — all
	* callers (L1 capture handler, L2b secondary check) should use this function
	* instead of calling isVideoControlElement/isVideoControlEvent directly.
	*
	* @param element - The click target element
	* @param getComposedPath - Event.composedPath() accessor (for composedPath traversal)
	* @param mode - Video click handling mode from user settings
	* @returns true if the click should be allowed (gallery launch), false if blocked
	*/
	function isVideoClickAllowed(element, getComposedPath, mode) {
		if (!isHTMLElement(element)) return true;
		switch (mode) {
			case "allow-all": return true;
			case "block-all": return !isAnyInVideoPlayerPath(element, getComposedPath);
			case "block-controls-only": return !isVideoControlEvent(element, getComposedPath);
			default: return !isVideoControlEvent(element, getComposedPath);
		}
	}
	/** Check if any element in element + composedPath is inside a video player context */
	function isAnyInVideoPlayerPath(element, getComposedPath) {
		if (isWithinVideoPlayer(element)) return true;
		if (typeof getComposedPath === "function") try {
			const path = getComposedPath();
			if (Array.isArray(path)) {
				for (const pathTarget of path) if (pathTarget instanceof HTMLElement && isWithinVideoPlayer(pathTarget)) return true;
			}
		} catch {}
		return false;
	}
	/**
	* Check if element is inside the gallery UI.
	*/
	function isGalleryInternalElement(element) {
		if (!(element instanceof Element)) return false;
		if (typeof element.matches !== "function") return false;
		return GALLERY_SELECTORS.some((selector) => {
			return element.matches(selector) || element.closest(selector) !== null;
		});
	}
	/**
	* Check if a click event targets a video element or any of its descendants.
	*
	* Uses both `Element.contains()` and `Event.composedPath()` for robustness
	* with Shadow DOM and nested components. Returns true when the click
	* is on the video element itself or any of its children (including native
	* controls rendered by the browser).
	*
	* @param event - The click event
	* @param video - The video element to check against
	* @returns true if the click target is inside the video element
	*/
	function isClickOnVideoElement(event, video) {
		if (event.target instanceof Node && video.contains(event.target)) return true;
		if (typeof event.composedPath === "function") try {
			const path = event.composedPath();
			if (Array.isArray(path)) for (const pathTarget of path) {
				if (pathTarget === video) return true;
				if (pathTarget instanceof Node && video.contains(pathTarget)) return true;
			}
		} catch {}
		return false;
	}
	//#endregion
	//#region src/constants/settings.ts
	var APP_SETTINGS_STORAGE_KEY = "xeg-app-settings";
	var DEFAULT_SETTINGS = {
		gallery: {
			preloadCount: 3,
			imageFitMode: "fitWidth",
			theme: "auto",
			animations: true,
			enableKeyboardNav: true,
			videoVolume: 1,
			videoMuted: false,
			videoClickMode: "block-controls-only"
		},
		toolbar: { autoHideDelay: 3e3 },
		download: {},
		accessibility: {},
		features: {
			gallery: true,
			settings: true,
			download: true,
			mediaExtraction: true,
			accessibility: true
		},
		version: "1",
		lastModified: 0
	};
	function createDefaultSettings(timestamp) {
		return globalThis.structuredClone({
			...DEFAULT_SETTINGS,
			lastModified: timestamp
		});
	}
	//#endregion
	//#region src/shared/utils/media/media-click-detector.ts
	/**
	* @fileoverview Media click detector: validates clicks for gallery trigger.
	* Blocks triggers in contexts where native navigation should be preserved
	* (link cards, X Articles, media viewers, interactive elements).
	*/
	var MEDIA_LINK_SELECTOR = [
		STATUS_LINK_SELECTOR,
		"a[href*=\"/photo/\"]",
		"a[href*=\"/video/\"]"
	].join(", ");
	var MEDIA_CONTAINER_SELECTOR = MEDIA_CONTAINER_SELECTORS.join(", ");
	var INTERACTIVE_SELECTOR = [
		"button",
		"a",
		"[role=\"button\"]",
		"[data-testid=\"like\"]",
		"[data-testid=\"retweet\"]",
		"[data-testid=\"reply\"]",
		"[data-testid=\"share\"]",
		"[data-testid=\"bookmark\"]"
	].join(", ");
	var STATUS_MEDIA_RE = /\/status\/\d+|\/photo\/\d+|\/video\/\d+/iu;
	function isNativeStatusMediaLink(href) {
		if (!href) return false;
		const parsed = tryParseUrl(href);
		if (!parsed || !isHostMatching(parsed, TWITTER_HOSTS)) return false;
		return STATUS_MEDIA_RE.test(parsed.pathname);
	}
	function isMediaCard(cardWrapper) {
		for (const link of cardWrapper.querySelectorAll("a[href]")) if (!isNativeStatusMediaLink(link.getAttribute("href"))) return false;
		if (cardWrapper.querySelector("img[src*=\"pbs.twimg.com/card_img\"]")) return true;
		return cardWrapper.querySelector("img, video") !== null;
	}
	function closestSafe(element, selector) {
		try {
			return element?.closest(selector) ?? null;
		} catch {
			return null;
		}
	}
	function shouldBlockMediaTrigger(target, event) {
		if (!target) return false;
		const videoMode = tryGetSettings() ? getTypedSettingOr("gallery.videoClickMode", DEFAULT_SETTINGS.gallery.videoClickMode) : DEFAULT_SETTINGS.gallery.videoClickMode;
		if (!isVideoClickAllowed(target, event ? () => event.composedPath() : void 0, videoMode)) return true;
		if (closestSafe(target, CSS.SELECTORS.ROOT) || closestSafe(target, CSS.SELECTORS.OVERLAY)) return true;
		const cardWrapper = target.closest("[data-testid=\"card.wrapper\"]");
		if (cardWrapper instanceof HTMLElement) return !isMediaCard(cardWrapper);
		const blockedContext = [
			"[data-testid=\"twitterArticleReadView\"]",
			"[data-testid=\"longformRichTextComponent\"]",
			"[data-testid=\"twitterArticleRichTextView\"]",
			"[data-testid=\"article-cover-image\"]",
			...MEDIA_VIEWER_SELECTORS,
			"[data-testid=\"swipe-to-dismiss\"]",
			"[data-testid=\"mask\"]"
		].join(", ");
		if (target.closest(blockedContext)) return true;
		const interactive = target.closest(INTERACTIVE_SELECTOR);
		if (interactive) {
			if (interactive instanceof HTMLAnchorElement && !isNativeStatusMediaLink(interactive.getAttribute("href"))) return true;
			return !(interactive instanceof HTMLAnchorElement ? isNativeStatusMediaLink(interactive.getAttribute("href")) : interactive.matches(MEDIA_LINK_SELECTOR) || interactive.matches(MEDIA_CONTAINER_SELECTOR) || interactive.querySelector(MEDIA_CONTAINER_SELECTOR) !== null);
		}
		return false;
	}
	function isProcessableMedia(target, event) {
		if (!target || gallerySignals.isOpen || shouldBlockMediaTrigger(target, event)) return false;
		const mediaElement = findMediaElementInDOM(target);
		if (mediaElement) {
			const url = extractMediaUrlFromElement(mediaElement);
			if (url && (url.startsWith("blob:") || isValidMediaUrl(url))) return true;
		}
		return !!target.closest(MEDIA_CONTAINER_SELECTOR);
	}
	//#endregion
	//#region src/shared/utils/events/handlers/media-click.ts
	/**
	* @fileoverview Media click event handler with multi-stage validation.
	* Single delegated handler for detecting and processing external media clicks.
	* Prevents Twitter's native gallery and triggers custom gallery behavior.
	*/
	/** Resolve video click mode safely, falling back when settings unavailable */
	function resolveVideoClickMode() {
		if (!tryGetSettings()) return "block-controls-only";
		return getTypedSettingOr("gallery.videoClickMode", "block-controls-only");
	}
	async function handleMediaClick(event, handlers, options) {
		if (!options.enableMediaDetection) return;
		const target = event.target;
		if (!(target instanceof Element)) return;
		if (gallerySignals.isOpen) {
			if (isGalleryInternalElement(target)) return;
			handlers.onGalleryClose();
			event.stopImmediatePropagation();
			event.preventDefault();
			return;
		}
		if (!isHTMLElement(target)) return;
		if (!isVideoClickAllowed(target, () => event.composedPath(), resolveVideoClickMode())) return;
		if (!isProcessableMedia(target, event)) return;
		event.stopImmediatePropagation();
		event.preventDefault();
		try {
			await handlers.onMediaClick(target, event);
		} catch (error) {
			logger.warn("onMediaClick failed", error);
		}
	}
	//#endregion
	//#region src/shared/utils/events/lifecycle/gallery-lifecycle.ts
	/**
	* Create a self-contained gallery lifecycle with instance-scoped state.
	* Each call creates an independent lifecycle — safe for multiple gallery instances.
	*/
	function createGalleryLifecycle() {
		let initialized = false;
		let currentContext = null;
		/**
		* Initialize gallery lifecycle. Not idempotent — each call removes old
		* listeners and registers new ones. Call cleanup() before re-initializing.
		*/
		function initialize(handlers, options) {
			if (initialized) cleanup();
			if (!handlers) return cleanup;
			const context = options?.context?.trim() || "gallery";
			const mergedOptions = {
				enableKeyboard: true,
				enableMediaDetection: true,
				debugMode: false,
				preventBubbling: true,
				...options,
				context
			};
			const target = document.body;
			const eventManager = getEventManager();
			const listenerOptions = {
				capture: true,
				passive: false
			};
			if (mergedOptions.enableKeyboard) {
				const keyHandler = (evt) => {
					handleKeyboardEvent(evt, handlers, mergedOptions);
				};
				eventManager.addEventListener(target, "keydown", keyHandler, {
					...listenerOptions,
					context
				});
			}
			if (mergedOptions.enableMediaDetection) {
				const clickHandler = async (evt) => {
					await handleMediaClick(evt, handlers, mergedOptions);
				};
				eventManager.addEventListener(target, "click", clickHandler, {
					...listenerOptions,
					context
				});
			}
			resetKeyboardDebounceState();
			initialized = true;
			currentContext = context;
			return cleanup;
		}
		function cleanup() {
			if (!initialized) return;
			if (currentContext) getEventManager().removeByContext(currentContext);
			resetKeyboardDebounceState();
			initialized = false;
			currentContext = null;
		}
		return {
			initialize,
			cleanup
		};
	}
	//#endregion
	//#region src/shared/utils/media/twitter-video-pauser.ts
	/**
	* Pauses active videos in timeline before gallery opens
	*/
	var ZERO_RESULT = {
		pausedCount: 0,
		totalCandidates: 0,
		skippedCount: 0
	};
	/** Resolves queryable root, defaults to document */
	function resolveRoot(root) {
		if (root && typeof root.querySelectorAll === "function") return root;
		return document;
	}
	/** Checks if video is actively playing */
	function isVideoPlaying(video) {
		try {
			return !video.paused && !video.ended;
		} catch {
			return false;
		}
	}
	/** Determines if video should be paused */
	function shouldPauseVideo(video, force = false) {
		return video instanceof HTMLVideoElement && !isGalleryInternalElement(video) && video.isConnected && (force || isVideoPlaying(video));
	}
	/** Attempts to pause video */
	function tryPauseVideo(video) {
		try {
			video.pause?.();
			return true;
		} catch (error) {
			return false;
		}
	}
	/**
	* Pauses active videos in timeline, skips gallery-owned videos
	*/
	function pauseActiveTwitterVideos(options = {}) {
		const root = resolveRoot(options.root ?? null);
		if (!root) return ZERO_RESULT;
		const videos = Array.from(root.querySelectorAll("video"));
		if (videos.length === 0) return ZERO_RESULT;
		let pausedCount = 0;
		let totalCandidates = 0;
		for (const video of videos) {
			if (!shouldPauseVideo(video, options.force)) continue;
			totalCandidates += 1;
			if (tryPauseVideo(video)) pausedCount += 1;
		}
		const result = {
			pausedCount,
			totalCandidates,
			skippedCount: totalCandidates - pausedCount
		};
		if (result.pausedCount > 0) {}
		return result;
	}
	//#endregion
	//#region src/shared/utils/solid/accessor-utils.ts
	/**
	* Resolve a MaybeAccessor to its value.
	* @param value - A value or accessor function
	* @returns The resolved value
	* @example
	* ```ts
	* resolve(42); // 42
	* resolve(() => 'Alice'); // 'Alice'
	* ```
	*/
	function resolve(value) {
		return toAccessor(value)();
	}
	/**
	* Convert a MaybeAccessor to an Accessor function.
	* @param value - A value or accessor function
	* @returns An accessor function that returns the value
	*/
	function toAccessor(value) {
		return typeof value === "function" ? value : () => value;
	}
	/**
	* Create a Solid.js reactive effect rooted in a createRoot.
	* Returns a dispose function for cleanup.
	*
	* This is the canonical way to create an effect-safe reactive root
	* outside of component trees. Use this instead of duplicating
	* createRoot + createComputed patterns.
	*/
	function createEffectRoot(fn) {
		return createRoot((dispose) => {
			createComputed(fn);
			return dispose;
		});
	}
	//#endregion
	//#region src/shared/utils/media/ambient-video-coordinator.ts
	/**
	* @fileoverview Ambient video pauser: silences background videos when gallery opens.
	*/
	function findTweetContainer(element) {
		if (!element) return null;
		return closestWithFallback(element, TWEET_CONTAINER_SELECTORS);
	}
	function resolveContext(request) {
		if (request.root !== void 0) return {
			root: request.root ?? null,
			scope: "custom"
		};
		const tweet = findTweetContainer(request.sourceElement);
		if (tweet) return {
			root: tweet,
			scope: "tweet"
		};
		return {
			root: null,
			scope: "document"
		};
	}
	function isVideoTrigger(el) {
		if (!el) return false;
		if (el.tagName === "VIDEO") return true;
		return closestWithFallback(el, VIDEO_CONTAINER_SELECTORS) !== null;
	}
	function isImageTrigger(el) {
		if (!el) return false;
		if (el.tagName === "IMG") return true;
		return closestWithFallback(el, IMAGE_CONTAINER_SELECTORS) !== null;
	}
	function inferTrigger(el) {
		if (isVideoTrigger(el)) return "video-click";
		if (isImageTrigger(el)) return "image-click";
		return "unknown";
	}
	function pauseAmbientVideosForGallery(request = {}) {
		const trigger = request.trigger ?? inferTrigger(request.sourceElement);
		const force = request.force ?? true;
		const reason = request.reason ?? trigger;
		const { root, scope } = resolveContext(request);
		let result;
		try {
			result = pauseActiveTwitterVideos({
				root,
				force
			});
		} catch (error) {
			logger.warn("[AmbientVideoCoordinator] Failed to pause ambient videos", {
				error,
				trigger
			});
			return {
				pausedCount: 0,
				totalCandidates: 0,
				skippedCount: 0,
				failed: true,
				trigger,
				forced: force,
				reason,
				scope
			};
		}
		return {
			...result,
			failed: false,
			trigger,
			forced: force,
			reason,
			scope
		};
	}
	function startAmbientVideoGuard() {
		let active = true;
		const dispose = createEffectRoot(() => {
			if (!gallerySignals.isOpen) return;
			if (pauseAmbientVideosForGallery({
				trigger: "guard",
				reason: "guard"
			}).pausedCount > 0) {}
		});
		return () => {
			if (!active) return;
			active = false;
			dispose();
		};
	}
	//#endregion
	//#region src/features/gallery/gallery-app.ts
	var GalleryApp = class {
		initialized = false;
		ambientVideoGuardDispose = null;
		lifecycle = createGalleryLifecycle();
		renderer;
		mediaClickCounter = 0;
		sessionEpoch = 0;
		sessionAbortController = null;
		constructor(renderer) {
			this.renderer = renderer;
		}
		async initialize() {
			if (this.initialized) return;
			this.sessionEpoch++;
			this.sessionAbortController = new AbortController();
			try {
				await this.setupEventHandlers();
				if (!this.ambientVideoGuardDispose) this.ambientVideoGuardDispose = startAmbientVideoGuard();
				this.initialized = true;
			} catch (error) {
				galleryErrorReporter.critical(error, { code: "GALLERY_APP_INIT_FAILED" });
				throw error;
			}
		}
		async setupEventHandlers() {
			const settings = tryGetSettings();
			const enableKeyboard = typeof settings?.get("gallery.enableKeyboardNav") === "boolean" ? settings.get("gallery.enableKeyboardNav") : true;
			this.lifecycle.initialize({
				onMediaClick: (element, event) => this.handleMediaClick(element, event),
				onGalleryClose: () => this.close()
			}, {
				enableKeyboard,
				enableMediaDetection: true,
				debugMode: false,
				preventBubbling: true,
				context: "gallery"
			});
		}
		async handleMediaClick(element, _event) {
			const opId = ++this.mediaClickCounter;
			const epoch = this.sessionEpoch;
			try {
				const result = await getMediaService().extractFromClickedElement(element, { signal: this.sessionAbortController?.signal });
				if (opId !== this.mediaClickCounter) return;
				if (epoch !== this.sessionEpoch || !this.initialized) return;
				if (result.success && result.mediaItems.length > 0) this.openGallery(result.mediaItems, result.clickedIndex, { reason: "media-click" });
				else {
					mediaErrorReporter.warn(/* @__PURE__ */ new Error("Media extraction returned no items"), {
						code: "MEDIA_EXTRACTION_EMPTY",
						metadata: { success: result.success }
					});
					const lang = getLanguageService();
					getNotificationAdapter().notify(lang.translate("msg.err.loadMedia.title"), lang.translate("msg.err.loadMedia.body"));
				}
			} catch (error) {
				mediaErrorReporter.error(error, { code: "MEDIA_EXTRACTION_ERROR" });
				const lang = getLanguageService();
				getNotificationAdapter().notify(lang.translate("msg.err.generic"), normalizeErrorMessage(error));
			}
		}
		openGallery(mediaItems, startIndex = 0, pauseContext) {
			if (mediaItems.length === 0) return;
			try {
				const validIndex = clampIndex(startIndex, mediaItems.length);
				pauseAmbientVideosForGallery({ reason: pauseContext?.reason ?? "media-click" });
				openGallery(mediaItems, validIndex);
			} catch (error) {
				galleryErrorReporter.error(error, {
					code: "GALLERY_OPEN_FAILED",
					metadata: {
						itemCount: mediaItems.length,
						startIndex
					}
				});
				const lang = getLanguageService();
				getNotificationAdapter().notify(lang.translate("msg.err.loadGallery"), normalizeErrorMessage(error));
				throw error;
			}
		}
		close() {
			if (gallerySignals.isOpen) closeGallery();
		}
		async cleanup() {
			if (gallerySignals.isOpen) this.close();
			this.sessionAbortController?.abort();
			this.sessionAbortController = null;
			this.ambientVideoGuardDispose?.();
			this.ambientVideoGuardDispose = null;
			try {
				this.lifecycle.cleanup();
			} catch (error) {}
			this.renderer.destroy();
			disposeGallerySignals();
			disposeKeyboardDebouncer();
			getMediaService().cancelAllPrefetch();
			this.initialized = false;
			delete globalThis.xegGalleryDebug;
		}
	};
	//#endregion
	//#region node_modules/.pnpm/solid-js@1.9.14/node_modules/solid-js/web/dist/web.js
	var memo = (fn) => createMemo(() => fn());
	function reconcileArrays(parentNode, a, b) {
		let bLength = b.length, aEnd = a.length, bEnd = bLength, aStart = 0, bStart = 0, after = a[aEnd - 1].nextSibling, map = null;
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
				if (!map || !map.has(a[aStart])) a[aStart].remove();
				aStart++;
			}
			else if (a[aStart] === b[bEnd - 1] && b[bStart] === a[aEnd - 1]) {
				const node = a[--aEnd].nextSibling;
				parentNode.insertBefore(b[bStart++], a[aStart++].nextSibling);
				parentNode.insertBefore(b[--bEnd], node);
				a[aEnd] = b[bEnd];
			} else {
				if (!map) {
					map = /* @__PURE__ */ new Map();
					let i = bStart;
					while (i < bEnd) map.set(b[i], i++);
				}
				const index = map.get(a[aStart]);
				if (index != null) if (bStart < index && index < bEnd) {
					let i = aStart, sequence = 1, t;
					while (++i < aEnd && i < bEnd) {
						if ((t = map.get(a[i])) == null || t !== index + sequence) break;
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
	var $$EVENTS = "_$DX_DELEGATE";
	function render(code, element, init, options = {}) {
		let disposer;
		createRoot((dispose) => {
			disposer = dispose;
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
			const t = isMathML ? document.createElementNS("http://www.w3.org/1998/Math/MathML", "template") : document.createElement("template");
			t.innerHTML = html;
			return isSVG ? t.content.firstChild.firstChild : isMathML ? t.firstChild : t.content.firstChild;
		};
		const fn = isImportNode ? () => untrack(() => document.importNode(node || (node = create()), true)) : () => (node || (node = create())).cloneNode(true);
		fn.cloneNode = fn;
		return fn;
	}
	function delegateEvents(eventNames, document = window.document) {
		const e = document[$$EVENTS] || (document[$$EVENTS] = /* @__PURE__ */ new Set());
		for (let i = 0, l = eventNames.length; i < l; i++) {
			const name = eventNames[i];
			if (!e.has(name)) {
				e.add(name);
				document.addEventListener(name, eventHandler);
			}
		}
	}
	function setAttribute(node, name, value) {
		if (isHydrating(node)) return;
		if (value == null) node.removeAttribute(name);
		else node.setAttribute(name, value);
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
	function use(fn, element, arg) {
		return untrack(() => fn(element, arg));
	}
	function insert(parent, accessor, marker, initial) {
		if (marker !== void 0 && !initial) initial = [];
		if (typeof accessor !== "function") return insertExpression(parent, accessor, initial, marker);
		createRenderEffect((current) => insertExpression(parent, accessor(), current, marker), initial);
	}
	function isHydrating(node) {
		return !!sharedConfig.context && !sharedConfig.done && (!node || node.isConnected);
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
		}
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
	var SVG_NAMESPACE = "http://www.w3.org/2000/svg";
	function createElement(tagName, isSVG = false, is = void 0) {
		return isSVG ? document.createElementNS(SVG_NAMESPACE, tagName) : document.createElement(tagName, { is });
	}
	function Portal(props) {
		const { useShadow } = props, marker = document.createTextNode(""), mount = () => props.mount || document.body, owner = getOwner();
		let content;
		let hydrating = !!sharedConfig.context;
		createEffect(() => {
			if (hydrating) getOwner().user = hydrating = false;
			content || (content = runWithOwner(owner, () => createMemo(() => props.children)));
			const el = mount();
			if (el instanceof HTMLHeadElement) {
				const [clean, setClean] = createSignal(false);
				const cleanup = () => setClean(true);
				createRoot((dispose) => insert(el, () => !clean() ? content() : dispose(), null));
				onCleanup(cleanup);
			} else {
				const container = createElement(props.isSVG ? "g" : "div", props.isSVG), renderRoot = useShadow && container.attachShadow ? container.attachShadow({ mode: "open" }) : container;
				Object.defineProperty(container, "_$host", {
					get() {
						return marker.parentNode;
					},
					configurable: true
				});
				insert(renderRoot, content);
				el.appendChild(container);
				props.ref && props.ref(container);
				onCleanup(() => el.contains(container) && el.removeChild(container));
			}
		}, void 0, { render: !hydrating });
		return marker;
	}
	//#endregion
	//#region src/features/gallery/components/vertical-gallery-view/hooks/use-gallery-fit-mode.ts
	/**
	* @fileoverview Fit mode state hook — manages image fit mode signal,
	* persistence to settings, and fit mode toggle handlers.
	*/
	/**
	* Manages image fit mode state with persistence to gallery settings.
	* Provides toggle handlers for each fit mode: original, fitWidth,
	* fitHeight, and fitContainer.
	*
	* @param options - Hook configuration with scroll handler and index accessor
	* @returns Fit mode signal and toggle handler functions
	*/
	function useGalleryFitMode(options) {
		const { scrollToCurrentItem } = options;
		const getInitialFitMode = () => {
			return getTypedSettingOr("gallery.imageFitMode", "fitWidth");
		};
		const [imageFitMode, setImageFitMode] = createSignal(getInitialFitMode());
		createEffect(() => {
			const settings = tryGetSettings();
			if (!settings?.subscribe) return;
			onCleanup(settings.subscribe((event) => {
				if (event.key === "gallery.imageFitMode" && typeof event.newValue === "string") setImageFitMode(event.newValue);
			}));
		});
		const persistFitMode = (mode) => setTypedSetting("gallery.imageFitMode", mode).catch((error) => {});
		const applyFitMode = (mode, event) => {
			event?.preventDefault();
			event?.stopPropagation();
			setImageFitMode(mode);
			persistFitMode(mode);
			scrollToCurrentItem();
		};
		const handleFitOriginal = (event) => applyFitMode("original", event);
		const handleFitWidth = (event) => applyFitMode("fitWidth", event);
		const handleFitHeight = (event) => applyFitMode("fitHeight", event);
		const handleFitContainer = (event) => applyFitMode("fitContainer", event);
		return {
			imageFitMode,
			handleFitOriginal,
			handleFitWidth,
			handleFitHeight,
			handleFitContainer
		};
	}
	//#endregion
	//#region src/features/gallery/components/vertical-gallery-view/hooks/use-gallery-navigation-handlers.ts
	/**
	* @fileoverview Navigation handlers hook — provides click/event handlers
	* for gallery navigation (previous/next), background click to close,
	* and media item click navigation.
	*/
	/**
	* Wraps a DOM state change in startViewTransition if supported.
	* Progressive enhancement — falls through to direct call when unavailable.
	*/
	function withViewTransition(update) {
		if (typeof document !== "undefined" && typeof document.startViewTransition === "function") document.startViewTransition(() => {
			update();
		});
		else update();
	}
	/**
	* Provides event handlers for gallery navigation actions.
	* Handles boundary checking, background click dismissal, and
	* media item click navigation via the shared navigateToItem function.
	*
	* @param options - Hook configuration with state accessors and close callback
	* @returns Navigation handler functions
	*/
	function useGalleryNavigationHandlers(options) {
		const { currentIndex, focusedIndex, mediaItems, onClose } = options;
		/**
		* Returns the index to use as the navigation anchor for prev/next buttons.
		* Prefers focusedIndex (what the user is actually looking at via
		* IntersectionObserver) over currentIndex (last explicitly navigated to).
		* Falls back to currentIndex when focusedIndex is null or out of bounds.
		*/
		const resolveNavAnchor = () => {
			const focus = focusedIndex?.() ?? null;
			const items = mediaItems();
			if (typeof focus === "number" && focus >= 0 && focus < items.length) return focus;
			return currentIndex();
		};
		const handlePrevious = () => {
			const anchor = resolveNavAnchor();
			if (anchor > 0) withViewTransition(() => navigateToItem(anchor - 1, "button"));
		};
		const handleNext = () => {
			const anchor = resolveNavAnchor();
			if (anchor < mediaItems().length - 1) withViewTransition(() => navigateToItem(anchor + 1, "button"));
		};
		const handleBackgroundClick = (event) => {
			const target = event.target;
			if (!(target instanceof Element)) return;
			if (CSS.GALLERY_ELEMENT_SELECTORS.some((sel) => target.closest(sel))) return;
			onClose();
		};
		const handleMediaItemClick = (index) => {
			const items = mediaItems();
			const current = currentIndex();
			if (index >= 0 && index < items.length && index !== current) withViewTransition(() => navigateToItem(index, "scroll"));
		};
		return {
			handlePrevious,
			handleNext,
			handleBackgroundClick,
			handleMediaItemClick
		};
	}
	//#endregion
	//#region node_modules/.pnpm/@piesp+browser-core@file+packages+core/node_modules/@piesp/browser-core/src/async/sleep.ts
	/**
	* Returns a promise that resolves after `ms` milliseconds.
	*
	* Supports cancellation via AbortSignal — when the signal is aborted,
	* the promise rejects with an AbortError DOMException.
	*
	* @param ms - Delay duration in milliseconds
	* @param signal - Optional AbortSignal for cancellation
	* @returns Promise that resolves after the delay or rejects on abort
	*/
	function sleep(ms, signal) {
		if (ms <= 0) {
			if (signal?.aborted) return Promise.reject(signal.reason instanceof DOMException ? signal.reason : new DOMException("The operation was aborted.", "AbortError"));
			return Promise.resolve();
		}
		return new Promise((resolve, reject) => {
			if (signal?.aborted) {
				reject(signal.reason instanceof DOMException ? signal.reason : new DOMException("The operation was aborted.", "AbortError"));
				return;
			}
			const timeoutId = setTimeout(() => {
				signal?.removeEventListener("abort", handleAbort);
				resolve();
			}, ms);
			const handleAbort = () => {
				clearTimeout(timeoutId);
				reject(signal?.reason instanceof DOMException ? signal.reason : new DOMException("The operation was aborted.", "AbortError"));
			};
			signal?.addEventListener("abort", handleAbort, { once: true });
		});
	}
	//#endregion
	//#region node_modules/.pnpm/@piesp+browser-core@file+packages+core/node_modules/@piesp/browser-core/src/async/debounce.ts
	/**
	* Create a debounced version of a function.
	*
	* Delays invoking `fn` until after `wait` milliseconds have elapsed
	* since the last invocation. Each new call resets the timer.
	*
	* @param fn - The function to debounce
	* @param wait - Delay in milliseconds before invoking
	* @returns Debounced function with `cancel()` and `flush()` methods
	*/
	function debounce(fn, wait) {
		let timeoutId = null;
		let lastArgs = null;
		const cancel = () => {
			if (timeoutId !== null) {
				clearTimeout(timeoutId);
				timeoutId = null;
			}
			lastArgs = null;
		};
		const flush = () => {
			if (timeoutId !== null) {
				clearTimeout(timeoutId);
				timeoutId = null;
			}
			if (lastArgs !== null) {
				const args = lastArgs;
				lastArgs = null;
				fn(...args);
			}
		};
		const debounced = (...args) => {
			lastArgs = args;
			if (timeoutId !== null) clearTimeout(timeoutId);
			timeoutId = setTimeout(() => {
				timeoutId = null;
				flush();
			}, wait);
		};
		debounced.cancel = cancel;
		debounced.flush = flush;
		return debounced;
	}
	//#endregion
	//#region src/shared/async/debounce.ts
	/** @deprecated Import debounce from @piesp/browser-core/async instead */
	function createDebounced(fn, delayMs = 300) {
		return debounce(fn, delayMs);
	}
	//#endregion
	//#region src/features/gallery/components/vertical-gallery-view/hooks/use-gallery-scroll-correction.ts
	/**
	* @fileoverview Scroll correction hook — debounces scroll position adjustment
	* after media items load, ensuring smooth visual corrections without
	* disrupting the user's current view.
	*/
	/**
	* Creates a debounced scroll correction that delays scroll position adjustment
	* after media load events. This prevents jarring scroll jumps when media
	* items load asynchronously and change the layout.
	*
	* @param options - Hook configuration with state accessors and scroll handler
	* @returns Object containing the debounced scroll correction function
	*/
	function useGalleryScrollCorrection(options) {
		const { isVisible, currentIndex, activeMedia, scrollToItem } = options;
		const debouncedScrollCorrection = createDebounced((index, mediaId) => {
			if (!isVisible()) return;
			if (index !== currentIndex() || activeMedia()?.id !== mediaId) return;
			scrollToItem(index);
		}, 120);
		onCleanup(() => {
			debouncedScrollCorrection.cancel();
		});
		return { debouncedScrollCorrection };
	}
	//#endregion
	//#region src/features/gallery/components/vertical-gallery-view/hooks/use-gallery-wheel-redirect.ts
	/**
	* @fileoverview Wheel redirect hook — intercepts wheel events on the gallery
	* container and redirects them to the items container when the event
	* originates outside of it. Prevents the underlying Twitter page from
	* scrolling while the gallery is open.
	*/
	/**
	* Handles wheel event redirection from gallery container to items container.
	* When the user scrolls outside the items area (e.g. on the toolbar or
	* empty space), the scroll is redirected to prevent the underlying Twitter
	* page from scrolling.
	*/
	function handleContainerWheel(event, itemsContainerEl) {
		const itemsContainer = itemsContainerEl();
		if (!itemsContainer) return;
		const target = event.target;
		if (!(target instanceof Element)) return;
		if (itemsContainer.contains(target)) return;
		event.preventDefault();
		event.stopPropagation();
		if (itemsContainer.scrollHeight - itemsContainer.clientHeight <= 1) return;
		itemsContainer.scrollTop += Math.max(-150, Math.min(150, event.deltaY));
	}
	/**
	* Sets up wheel event redirection from the gallery container to the
	* items container. When the user scrolls outside the items area
	* (e.g. on the toolbar or empty space), the scroll is redirected so
	* the underlying Twitter page does not scroll.
	*
	* Uses a non-passive event listener via EventManager to allow
	* preventDefault() on the wheel event.
	*
	* @param options - Hook configuration with element refs
	*/
	function useGalleryWheelRedirect(options) {
		const { containerEl, itemsContainerEl } = options;
		createEffect(() => {
			const container = containerEl();
			if (!container) return;
			const eventManager = getEventManager();
			const listener = (event) => {
				handleContainerWheel(event, itemsContainerEl);
			};
			eventManager.addEventListener(container, "wheel", listener, {
				passive: false,
				context: "gallery:wheel:container-redirect"
			});
			onCleanup(() => eventManager.removeByContext("gallery:wheel:container-redirect"));
		});
	}
	//#endregion
	//#region src/shared/utils/performance/observer-pool.ts
	/**
	* True shared IntersectionObserver pool — keyed by options.
	*
	* Before: each `observe()` call created a NEW `IntersectionObserver` instance,
	* resulting in N+V observers per gallery open (one per item + one per video).
	*
	* After: observers are pooled by serialized options. Only one observer exists
	* per unique configuration, regardless of how many elements are observed.
	* For this project: 2 unique configs → exactly 2 observers (not N+V).
	*/
	/** Map from serialized options → shared observer + per-element callbacks. */
	var observerPool = /* @__PURE__ */ new Map();
	/** Serialize options into a stable key (sorted keys for determinism). */
	function optionsKey(options) {
		const threshold = options.threshold;
		const rootMargin = options.rootMargin ?? "0px";
		return `t:${typeof threshold === "number" ? threshold : Array.isArray(threshold) ? threshold.join(",") : "0"}|m:${rootMargin}`;
	}
	var SharedObserver = {
		observe(element, callback, options = {}) {
			const key = optionsKey(options);
			let entry = observerPool.get(key);
			if (!entry) {
				const callbacks = /* @__PURE__ */ new WeakMap();
				const refCount = /* @__PURE__ */ new Map();
				entry = {
					observer: new IntersectionObserver((entries) => {
						for (const e of entries) {
							if (!e.target.isConnected) {
								callbacks.delete(e.target);
								refCount.delete(e.target);
								continue;
							}
							const cb = callbacks.get(e.target);
							if (cb) try {
								cb(e);
							} catch (error) {}
						}
					}, options),
					callbacks,
					refCount
				};
				observerPool.set(key, entry);
			}
			const alreadyTracked = entry.callbacks.has(element);
			entry.callbacks.set(element, callback);
			entry.refCount.set(element, (entry.refCount.get(element) ?? 0) + 1);
			if (!alreadyTracked) entry.observer.observe(element);
			let disposed = false;
			return () => {
				if (disposed) return;
				disposed = true;
				const poolEntry = observerPool.get(key);
				if (!poolEntry) return;
				const count = (poolEntry.refCount.get(element) ?? 1) - 1;
				if (count <= 0) {
					poolEntry.callbacks.delete(element);
					poolEntry.refCount.delete(element);
					poolEntry.observer.unobserve(element);
				} else poolEntry.refCount.set(element, count);
				if (poolEntry.refCount.size === 0) {
					poolEntry.observer.disconnect();
					observerPool.delete(key);
				}
			};
		},
		/**
		* MED-3: Garbage collect stale observer pool entries.
		*
		* Iterates all pool entries and removes elements that have been
		* disconnected from the DOM. If an observer ends up with zero
		* tracked elements, it is fully disconnected and removed from the pool.
		*
		* Call this when closing a gallery session (e.g. on overlay close)
		* to prevent accumulation of stale entries across sessions.
		*/
		gc() {
			let cleaned = 0;
			for (const [key, poolEntry] of observerPool) {
				const stale = [];
				for (const element of poolEntry.refCount.keys()) if (!element.isConnected) stale.push(element);
				for (const element of stale) {
					poolEntry.callbacks.delete(element);
					poolEntry.refCount.delete(element);
					poolEntry.observer.unobserve(element);
					cleaned++;
				}
				if (poolEntry.refCount.size === 0) {
					poolEntry.observer.disconnect();
					observerPool.delete(key);
				}
			}
			return cleaned;
		}
	};
	//#endregion
	//#region src/features/gallery/logic/focus-coordinator.ts
	/** @fileoverview Scroll-based focus selection via IntersectionObserver. Selects most visible gallery item. */
	var DEFAULTS$2 = {
		THRESHOLD: [
			0,
			.5,
			1
		],
		ROOT_MARGIN: "0px",
		TOP_PROXIMITY: 50
	};
	var FocusCoordinator = class {
		options;
		items = /* @__PURE__ */ new Map();
		observerOptions;
		_rafId = null;
		constructor(options) {
			this.options = options;
			const threshold = options.threshold;
			let resolvedThreshold;
			if (typeof threshold === "number") resolvedThreshold = threshold;
			else if (Array.isArray(threshold)) resolvedThreshold = [...threshold];
			else resolvedThreshold = [...DEFAULTS$2.THRESHOLD];
			this.observerOptions = {
				threshold: resolvedThreshold,
				rootMargin: options.rootMargin ?? DEFAULTS$2.ROOT_MARGIN
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
		/**
		* Request a focus update. Throttled via requestAnimationFrame —
		* multiple calls within the same frame are coalesced into one.
		* NOT idempotent across frames (by design).
		*/
		updateFocus(force = false) {
			if (!force && !this.options.isEnabled()) return;
			if (this._rafId !== null) return;
			this._rafId = requestAnimationFrame(() => {
				this._rafId = null;
				const container = this.options.container();
				if (!container) return;
				const selection = this.selectBestCandidate(container.getBoundingClientRect());
				if (!selection) return;
				if (this.options.activeIndex() !== selection.index) this.options.onFocusChange(selection.index, "auto");
			});
		}
		cleanup() {
			if (this._rafId !== null) {
				cancelAnimationFrame(this._rafId);
				this._rafId = null;
			}
			for (const item of this.items.values()) item.unsubscribe?.();
			this.items.clear();
		}
		selectBestCandidate(containerRect) {
			const viewportHeight = Math.max(containerRect.height, 1);
			const viewportTop = containerRect.top;
			const viewportBottom = viewportTop + viewportHeight;
			const viewportCenter = viewportTop + viewportHeight / 2;
			const topProximityThreshold = DEFAULTS$2.TOP_PROXIMITY;
			const itemRects = /* @__PURE__ */ new Map();
			for (const [index, item] of this.items) {
				if (!item.isVisible || !item.element.isConnected) continue;
				const rect = item.element.getBoundingClientRect();
				const top = rect.top;
				const height = rect.height;
				itemRects.set(index, {
					top,
					height,
					bottom: top + height,
					center: top + height / 2
				});
			}
			let bestCandidate = null;
			let topAlignedCandidate = null;
			let highestVisibilityCandidate = null;
			for (const [index, itemRect] of itemRects) {
				const itemTop = itemRect.top;
				const itemHeight = itemRect.height;
				const itemBottom = itemRect.bottom;
				const itemCenter = itemRect.center;
				const visibleHeight = Math.max(0, Math.min(itemBottom, viewportBottom) - Math.max(itemTop, viewportTop));
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
	//#endregion
	//#region src/features/gallery/hooks/use-gallery-focus-tracker.ts
	/**
	* Tracks focused gallery item based on scroll position using IntersectionObserver.
	*/
	function useGalleryFocusTracker(options) {
		const isEnabled = toAccessor(options.isEnabled);
		const container = toAccessor(options.container);
		const isScrolling = options.isScrolling;
		const lastNavigationTrigger = options.lastNavigationTrigger;
		const shouldTrack = () => {
			return isEnabled() && (isScrolling() || lastNavigationTrigger() === "scroll");
		};
		const coordinator = new FocusCoordinator({
			isEnabled: shouldTrack,
			container,
			activeIndex: () => gallerySignals.currentIndex,
			...options.threshold !== void 0 && { threshold: options.threshold },
			rootMargin: options.rootMargin ?? "0px",
			onFocusChange: (index, source) => {
				if (source === "auto" && index !== null) batch(() => {
					setFocusedIndexOnly(index);
				});
			}
		});
		onCleanup(() => coordinator.cleanup());
		const handleItemFocus = (index) => {
			navigateToItem(index, "keyboard");
		};
		return {
			focusedIndex: () => gallerySignals.focusedIndex,
			registerItem: (index, element) => coordinator.registerItem(index, element),
			handleItemFocus,
			forceSync: () => coordinator.updateFocus(true)
		};
	}
	//#endregion
	//#region src/features/gallery/hooks/use-gallery-item-scroll.ts
	/**
	* Hook for programmatic scrolling to a specific gallery item.
	*
	* Smooth-scrolls the container to bring the target item into view, with
	* configurable duration and easing. Tracks programmatic scrolls to
	* distinguish them from user-initiated scrolling.
	*
	* @param containerRef - Container element ref or accessor
	* @param currentIndex - Reactive current index
	* @param totalItems - Reactive total item count
	* @param options - Scroll behavior configuration
	* @returns Scroll control functions
	*/
	function useGalleryItemScroll(containerRef, currentIndex, totalItems, options = {}) {
		const containerAccessor = typeof containerRef === "function" ? containerRef : () => containerRef.current;
		const enabled = toAccessor(options.enabled ?? true);
		const behavior = toAccessor(options.behavior ?? "auto");
		const block = toAccessor(options.block ?? "start");
		const alignToCenter = toAccessor(options.alignToCenter ?? false);
		const isScrolling = toAccessor(options.isScrolling ?? false);
		const currentIndexAccessor = toAccessor(currentIndex);
		const totalItemsAccessor = toAccessor(totalItems);
		const itemsCache = /* @__PURE__ */ new Map();
		const pendingRafIds = /* @__PURE__ */ new Set();
		onCleanup(() => {
			itemsCache.clear();
			for (const id of pendingRafIds) cancelAnimationFrame(id);
			pendingRafIds.clear();
		});
		const getCachedItem = (index, itemsRoot) => {
			const cached = itemsCache.get(index)?.deref();
			if (cached?.isConnected) return cached;
			const element = itemsRoot.querySelectorAll("[role=\"listitem\"]")[index];
			if (element) itemsCache.set(index, new WeakRef(element));
			return element ?? null;
		};
		const scrollToItem = (index) => {
			const container = containerAccessor();
			if (!enabled() || !container || index < 0 || index >= totalItemsAccessor()) return;
			const itemsRoot = container.querySelector("[role=\"list\"]");
			if (!itemsRoot) return;
			const target = getCachedItem(index, itemsRoot);
			if (target) {
				options.onScrollStart?.();
				target.scrollIntoView({
					behavior: behavior(),
					block: alignToCenter() ? "center" : block(),
					inline: "nearest"
				});
			} else {
				const rafId = requestAnimationFrame(() => {
					pendingRafIds.delete(rafId);
					if (!itemsRoot.isConnected) return;
					const retryTarget = getCachedItem(index, itemsRoot);
					if (retryTarget) {
						options.onScrollStart?.();
						retryTarget.scrollIntoView({
							behavior: behavior(),
							block: alignToCenter() ? "center" : block(),
							inline: "nearest"
						});
					}
				});
				pendingRafIds.add(rafId);
			}
		};
		createEffect(() => {
			const index = currentIndexAccessor();
			const container = containerAccessor();
			const total = totalItemsAccessor();
			if (!container || total <= 0) return;
			if (untrack(enabled) && !untrack(isScrolling)) scrollToItem(index);
		});
		return {
			scrollToItem,
			scrollToCurrentItem: () => scrollToItem(currentIndexAccessor())
		};
	}
	//#endregion
	//#region src/shared/hooks/use-timer.ts
	/**
	* @fileoverview Shared timeout management utility for Solid.js hooks.
	*
	* Provides a createTimeout() helper that returns `{ set, clear }` with
	* automatic cleanup via onCleanup. Eliminates duplicated timer patterns
	* across multiple hooks.
	*/
	/**
	* Creates a managed timeout handle with automatic cleanup.
	*
	* @returns A TimeoutHandle with `set` and `clear` methods.
	*          The timeout is automatically cleared on cleanup.
	*
	* @example
	* const timer = createTimeout();
	* timer.set(() => setIsVisible(false), 3000);
	* // Later, to cancel:
	* timer.clear();
	*/
	function createTimeout() {
		let timerId = null;
		const clear = () => {
			if (timerId !== null) {
				clearTimeout(timerId);
				timerId = null;
			}
		};
		const set = (callback, delay) => {
			clear();
			timerId = setTimeout(() => {
				timerId = null;
				callback();
			}, delay);
		};
		onCleanup(clear);
		return {
			set,
			clear
		};
	}
	//#endregion
	//#region src/features/gallery/hooks/use-gallery-scroll.ts
	/**
	* Tracks user scroll activity and reports scroll state for focus tracking.
	*/
	/** Idle timeout after scroll ends (ms) */
	var SCROLL_IDLE_TIMEOUT = 250;
	/** Window to ignore programmatic scroll events (ms) */
	var PROGRAMMATIC_SCROLL_WINDOW = 100;
	/** Listener context prefix used for managed EventManager entries */
	var LISTENER_CONTEXT_PREFIX = "useGalleryScroll";
	/**
	* Hook for tracking user scroll activity on the gallery container.
	*
	* Monitors scroll events with idle detection — after scrolling stops for
	* a configurable timeout, the `isScrolling` signal flips to false and
	* the `onScrollEnd` callback fires.
	*
	* @param options - Container, scroll target, and end-of-scroll callback
	* @returns Reactive isScrolling signal and lastScrollTime timestamp
	*/
	function useGalleryScroll({ container, scrollTarget, onScrollEnd, enabled = true, programmaticScrollTimestamp }) {
		const containerAccessor = toAccessor(container);
		const scrollTargetAccessor = toAccessor(scrollTarget ?? containerAccessor);
		const enabledAccessor = toAccessor(enabled);
		const programmaticTimestampAccessor = toAccessor(programmaticScrollTimestamp ?? 0);
		const isGalleryOpen = createMemo(() => gallerySignals.isOpen);
		const [isScrolling, setIsScrolling] = createSignal(false);
		const [lastScrollTime, setLastScrollTime] = createSignal(0);
		const scrollIdleTimer = createTimeout();
		const markScrolling = () => {
			setIsScrolling(true);
			setLastScrollTime(performance.now());
		};
		const scheduleScrollEnd = () => {
			scrollIdleTimer.set(() => {
				setIsScrolling(false);
				onScrollEnd?.();
			}, SCROLL_IDLE_TIMEOUT);
		};
		const shouldIgnoreScroll = () => performance.now() - programmaticTimestampAccessor() < PROGRAMMATIC_SCROLL_WINDOW;
		/**
		* Check if wheel event originated from toolbar or its panels
		* Toolbar scroll should not trigger gallery scroll state
		*/
		const isToolbarScroll = (event) => {
			const target = event.target;
			if (!(target instanceof HTMLElement)) return false;
			return !!(target.closest("[data-gallery-element=\"toolbar\"]") || target.closest("[data-gallery-element=\"settings-panel\"]") || target.closest("[data-gallery-element=\"tweet-panel\"]") || target.closest("[data-role=\"toolbar\"]"));
		};
		const handleWheel = (event) => {
			if (!isGalleryOpen()) return;
			const path = typeof event.composedPath === "function" ? event.composedPath() : [event.target];
			if (!(Array.isArray(path) && path.some((el) => el instanceof HTMLElement && isGalleryInternalElement(el)))) return;
			if (isToolbarScroll(event)) return;
			markScrolling();
			scheduleScrollEnd();
		};
		const handleScroll = () => {
			if (!isGalleryOpen() || shouldIgnoreScroll()) return;
			markScrolling();
			scheduleScrollEnd();
		};
		createEffect(() => {
			const isEnabled = enabledAccessor();
			const containerElement = containerAccessor();
			const eventTarget = scrollTargetAccessor() ?? containerElement;
			if (!isEnabled || !eventTarget) {
				setIsScrolling(false);
				scrollIdleTimer.clear();
				return;
			}
			const eventManager = getEventManager();
			const listenerContext = createPrefixedId(LISTENER_CONTEXT_PREFIX, ":");
			const registerListener = (type, handler) => {
				eventManager.addEventListener(eventTarget, type, handler, {
					passive: true,
					context: listenerContext
				});
			};
			registerListener("wheel", handleWheel);
			registerListener("scroll", handleScroll);
			onCleanup(() => {
				eventManager.removeByContext(listenerContext);
				scrollIdleTimer.clear();
				setIsScrolling(false);
			});
		});
		return {
			isScrolling,
			lastScrollTime
		};
	}
	//#endregion
	//#region src/shared/dom/viewport.ts
	/**
	* @fileoverview Viewport/Container constraint helpers (PC-only)
	* @description Pure calculator and DOM hook to expose viewport values via CSS variables.
	*/
	/**
	* Compute viewport constraints after applying chrome offsets.
	* All measurements are floored for pixel-perfect rendering.
	* @param rect - Element bounding rectangle (width/height)
	* @param chrome - UI chrome offsets (toolbar, padding) in pixels
	* @returns Calculated viewport constraints
	*/
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
	/**
	* Apply viewport constraints as CSS custom properties.
	* Sets --xeg-viewport-w, --xeg-viewport-h, and --xeg-viewport-height-constrained.
	* @param el - Target HTML element (typically gallery container root)
	* @param v - Viewport constraints to apply
	*/
	function applyViewportCssVars(el, v) {
		el.style.setProperty("--xeg-viewport-w", `${v.viewportW}px`);
		el.style.setProperty("--xeg-viewport-h", `${v.viewportH}px`);
		el.style.setProperty("--xeg-viewport-height-constrained", `${v.constrainedH}px`);
	}
	/**
	* Observe viewport changes and update CSS custom properties.
	* Uses ResizeObserver and window resize events, RAF-throttled.
	* @param el - Target HTML element to observe and apply CSS vars to
	* @param getChrome - Function returning current chrome offsets
	* @returns Cleanup function to disconnect observers and remove listeners
	*/
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
		let rafId = null;
		let timerId = null;
		const schedule = () => {
			if (pending) return;
			pending = true;
			if (typeof requestAnimationFrame === "function") rafId = requestAnimationFrame(() => {
				rafId = null;
				pending = false;
				calcAndApply();
			});
			else timerId = setTimeout(() => {
				timerId = null;
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
		if (typeof window !== "undefined" && !ro) resizeListenerId = getEventManager().addEventListener(window, "resize", createEventListener(onResize), {
			passive: true,
			context: "viewport:resize"
		});
		return () => {
			disposed = true;
			if (rafId !== null) {
				cancelAnimationFrame(rafId);
				rafId = null;
			}
			if (timerId !== null) {
				clearTimeout(timerId);
				timerId = null;
			}
			if (ro) try {
				ro.disconnect();
			} catch {}
			if (resizeListenerId) {
				getEventManager().removeListener(resizeListenerId);
				resizeListenerId = null;
			}
		};
	}
	//#endregion
	//#region src/shared/utils/css/css-animations.ts
	/**
	* @fileoverview CSS animation helpers for gallery entrance/exit effects.
	*/
	var ANIMATION_CLASSES = {
		FADE_IN: "xeg-fade-in",
		FADE_OUT: "xeg-fade-out"
	};
	function runCssAnimation(element, className) {
		return new Promise((resolve) => {
			let settled = false;
			let timer;
			let observer;
			const settle = () => {
				if (settled) return;
				settled = true;
				if (timer) clearTimeout(timer);
				if (observer) observer.disconnect();
				element.classList.remove(className);
				element.removeEventListener("animationend", settle);
				element.removeEventListener("animationcancel", settle);
				resolve();
			};
			timer = setTimeout(settle, 500);
			element.addEventListener("animationend", settle);
			element.addEventListener("animationcancel", settle);
			if (element.isConnected && typeof MutationObserver !== "undefined") {
				observer = new MutationObserver(() => {
					if (!element.isConnected) settle();
				});
				if (element.parentElement) observer.observe(element.parentElement, {
					childList: true,
					subtree: false
				});
			}
			if (!element.isConnected) {
				settle();
				return;
			}
			try {
				element.classList.add(className);
			} catch {
				settle();
			}
		});
	}
	function animateGalleryEnter(element) {
		return runCssAnimation(element, ANIMATION_CLASSES.FADE_IN);
	}
	function animateGalleryExit(element) {
		return runCssAnimation(element, ANIMATION_CLASSES.FADE_OUT);
	}
	//#endregion
	//#region src/features/gallery/components/vertical-gallery-view/hooks/use-gallery-lifecycle.ts
	/**
	* @fileoverview Lifecycle management: animations, video cleanup, viewport tracking.
	* Three coordinated effects: scroll setup, animation timing, viewport observer.
	*/
	/**
	* Ensure gallery and content containers have scrollable overflow enabled.
	*/
	function ensureGalleryScrollAvailable(element) {
		if (!element) return;
		element.querySelectorAll("[role=\"list\"]").forEach((el) => {
			if (el.style.overflowY !== "auto" && el.style.overflowY !== "scroll") el.style.overflowY = "auto";
		});
	}
	function useGalleryLifecycle(options) {
		const { containerEl, toolbarWrapperEl, isVisible } = options;
		createEffect(on(containerEl, (element) => {
			if (element) ensureGalleryScrollAvailable(element);
		}));
		createEffect(on([containerEl, isVisible], ([container, visible]) => {
			if (!container) return;
			if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false) return;
			if (visible) animateGalleryEnter(container).catch(() => {});
			else {
				animateGalleryExit(container).catch(() => {});
				container.querySelectorAll("video").forEach((video) => {
					try {
						video.pause();
					} catch (error) {}
					try {
						if (video.currentTime !== 0) video.currentTime = 0;
					} catch (error) {}
				});
			}
		}, { defer: true }));
		createEffect(() => {
			const container = containerEl();
			const wrapper = toolbarWrapperEl();
			if (!container || !wrapper) return;
			const cleanup = observeViewportCssVars(container, () => {
				return {
					toolbarHeight: wrapper ? Math.floor(wrapper.getBoundingClientRect().height) : 0,
					paddingTop: 0,
					paddingBottom: 0
				};
			});
			onCleanup(() => cleanup?.());
		});
	}
	//#endregion
	//#region src/features/gallery/components/vertical-gallery-view/hooks/use-gallery-navigation.ts
	function registerNavigationEvents({ onTriggerChange, onNavigateComplete }) {
		const stopComplete = galleryIndexEvents.on("navigate:complete", (payload) => {
			onTriggerChange(payload.trigger);
			onNavigateComplete(payload);
		});
		return () => {
			stopComplete();
		};
	}
	function useGalleryNavigation(options) {
		const { isVisible, scrollToItem } = options;
		const [lastNavigationTrigger, setLastNavigationTrigger] = createSignal(null);
		const [programmaticScrollTimestamp, setProgrammaticScrollTimestamp] = createSignal(0);
		createEffect(on(isVisible, (visible) => {
			if (!visible) return;
			onCleanup(registerNavigationEvents({
				onTriggerChange: setLastNavigationTrigger,
				onNavigateComplete: ({ index, trigger }) => {
					if (trigger === "scroll" || trigger === "auto-focus") return;
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
	//#endregion
	//#region src/features/gallery/components/vertical-gallery-view/hooks/use-toolbar-auto-hide.ts
	/** @fileoverview Toolbar auto-hide with configurable delay. */
	function useToolbarAutoHide(options) {
		const { isVisible, hasItems } = options;
		const computeInitialVisibility = () => !!(isVisible() && hasItems());
		const [isInitialToolbarVisible, setIsInitialToolbarVisible] = createSignal(computeInitialVisibility());
		const timer = createTimeout();
		createEffect(() => {
			if (!computeInitialVisibility()) {
				setIsInitialToolbarVisible(false);
				return;
			}
			setIsInitialToolbarVisible(true);
			const rawAutoHideDelay = getTypedSettingOr("toolbar.autoHideDelay", DEFAULT_SETTINGS.toolbar.autoHideDelay);
			const autoHideDelay = Math.max(0, typeof rawAutoHideDelay === "number" ? rawAutoHideDelay : 0);
			if (autoHideDelay === 0) {
				setIsInitialToolbarVisible(false);
				return;
			}
			timer.set(() => {
				setIsInitialToolbarVisible(false);
			}, autoHideDelay);
		});
		return {
			isInitialToolbarVisible,
			setIsInitialToolbarVisible
		};
	}
	//#endregion
	//#region src/features/gallery/components/vertical-gallery-view/hooks/use-vertical-gallery.ts
	/**
	* @fileoverview Composed hook combining all gallery functionality into a single interface
	*
	* Integrates toolbar auto-hide, scroll state, navigation, focus tracking, lifecycle, and keyboard handling.
	*/
	/**
	* Composed hook combining all gallery sub-hooks into a unified interface
	*
	* Manages dependencies between toolbar, navigation, scroll, focus, lifecycle, and keyboard hooks.
	*
	* @param options - Hook configuration with element refs and state accessors
	* @returns Composed state and handlers organized by functional domain
	*/
	function useVerticalGallery(options) {
		const { isVisible, currentIndex, mediaItemsCount, containerEl, toolbarWrapperEl, itemsContainerEl } = options;
		let focusSyncCallback = null;
		const { isInitialToolbarVisible, setIsInitialToolbarVisible } = useToolbarAutoHide({
			isVisible,
			hasItems: () => mediaItemsCount() > 0
		});
		let scrollToItemRef = null;
		const navigationState = useGalleryNavigation({
			isVisible,
			scrollToItem: (index) => scrollToItemRef?.(index)
		});
		const { isScrolling } = useGalleryScroll({
			container: containerEl,
			scrollTarget: itemsContainerEl,
			enabled: isVisible,
			programmaticScrollTimestamp: () => navigationState.programmaticScrollTimestamp(),
			onScrollEnd: () => focusSyncCallback?.()
		});
		const { scrollToItem, scrollToCurrentItem } = useGalleryItemScroll(containerEl, currentIndex, mediaItemsCount, {
			enabled: () => !isScrolling() && navigationState.lastNavigationTrigger() !== "scroll",
			block: "start",
			isScrolling,
			onScrollStart: () => navigationState.setProgrammaticScrollTimestamp(performance.now())
		});
		scrollToItemRef = scrollToItem;
		const { focusedIndex, registerItem: registerFocusItem, handleItemFocus, forceSync: focusTrackerForceSync } = useGalleryFocusTracker({
			container: containerEl,
			isEnabled: isVisible,
			isScrolling,
			lastNavigationTrigger: navigationState.lastNavigationTrigger
		});
		focusSyncCallback = focusTrackerForceSync;
		useGalleryLifecycle({
			containerEl,
			toolbarWrapperEl,
			isVisible
		});
		createEffect(() => {
			if (isScrolling()) setIsInitialToolbarVisible(false);
		});
		return {
			scroll: {
				isScrolling,
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
	var VerticalGalleryView_module_default = {
		container: "xg-X9gZ",
		toolbarWrapper: "xg-meO3",
		itemsContainer: "xg-gmRW",
		uiHidden: "xg-9abg",
		isScrolling: "xg-sOsS",
		empty: "xg-yhK-",
		galleryItem: "xg-EfVa",
		itemActive: "xg-LxHL",
		scrollSpacer: "xg-sfF0",
		toolbarHoverZone: "xg-gC-m",
		initialToolbarVisible: "xg-Canm",
		toolbarButton: "xg-e06X",
		emptyMessage: "xg-fwsr"
	};
	//#endregion
	//#region src/features/gallery/components/vertical-gallery-view/hooks/use-video-visibility.ts
	function createVideoVisibilityController(options) {
		const { video, setMuted } = options;
		let wasPlayingBeforeHidden = false;
		let wasMutedBeforeHidden = null;
		let didAutoMute = false;
		const pauseVideo = () => {
			if (typeof video.pause === "function") video.pause();
		};
		const playVideo = () => {
			if (typeof video.play !== "function") return;
			try {
				const result = video.play();
				if (result && typeof result.catch === "function") result.catch((err) => {});
			} catch (err) {}
		};
		const applyMuted = (nextMuted) => {
			if (typeof setMuted === "function") {
				setMuted(video, nextMuted);
				return;
			}
			video.muted = nextMuted;
		};
		return { handleEntry(entry) {
			if (!entry.isIntersecting) try {
				if (wasMutedBeforeHidden === null) {
					wasPlayingBeforeHidden = !video.paused;
					wasMutedBeforeHidden = video.muted;
					didAutoMute = false;
				}
				if (!video.muted) {
					applyMuted(true);
					didAutoMute = true;
				}
				if (!video.paused) pauseVideo();
			} catch (err) {}
			else try {
				if (wasMutedBeforeHidden !== null) {
					if (didAutoMute && video.muted === true && wasMutedBeforeHidden === false) applyMuted(false);
				}
				if (wasPlayingBeforeHidden) playVideo();
			} catch (err) {} finally {
				wasPlayingBeforeHidden = false;
				wasMutedBeforeHidden = null;
				didAutoMute = false;
			}
		} };
	}
	function useVideoVisibility(options) {
		const { container, video, isVideo, setMuted } = options;
		createEffect(() => {
			if (!isVideo()) return;
			const containerEl = container();
			const videoEl = video();
			if (!containerEl || !videoEl) return;
			const controller = createVideoVisibilityController(typeof setMuted === "function" ? {
				video: videoEl,
				setMuted
			} : { video: videoEl });
			const unsubscribeObserver = SharedObserver.observe(containerEl, controller.handleEntry, {
				threshold: 0,
				rootMargin: "0px"
			});
			onCleanup(() => {
				unsubscribeObserver();
			});
		});
	}
	//#endregion
	//#region src/features/gallery/components/vertical-gallery-view/utils/video-volume-change-guard.ts
	var DEFAULT_VOLUME_EPSILON = VOLUME_EPSILON;
	/** Compare volume values with epsilon for rounding tolerance */
	function areVolumesEquivalent(a, b) {
		if (!Number.isFinite(a) || !Number.isFinite(b)) return a === b;
		return Math.abs(a - b) <= DEFAULT_VOLUME_EPSILON;
	}
	/** Monotonic timestamp in milliseconds (performance.now() with Date.now() fallback) */
	function nowMs() {
		return typeof performance !== "undefined" && typeof performance.now === "function" ? performance.now() : Date.now();
	}
	/**
	* Creates a guard that distinguishes user-initiated volume changes from programmatic ones.
	*
	* Uses a grace period after programmatic `video.volume = x` assignments to prevent
	* the native `volumechange` event from being misattributed to user interaction.
	*
	* @param options - Guard configuration (debounce window, grace period)
	* @returns Guard with isVolumeChangeEventFromUser() method
	*/
	function createVideoVolumeChangeGuard(options = {}) {
		const windowMsInput = options.windowMs;
		const windowMs = typeof windowMsInput === "number" && Number.isFinite(windowMsInput) ? Math.max(0, windowMsInput) : 500;
		const MAX_EXPECTED_MARKS = 4;
		let expectedMarks = [];
		const pruneExpiredMarks = (now) => {
			if (expectedMarks.length === 0) return;
			expectedMarks = expectedMarks.filter((mark) => {
				const age = now - mark.markedAt;
				if (age < 0) return false;
				return age <= windowMs;
			});
		};
		return {
			markProgrammaticChange(expected) {
				const now = nowMs();
				pruneExpiredMarks(now);
				expectedMarks = [...expectedMarks, {
					snapshot: expected,
					markedAt: now
				}];
				if (expectedMarks.length > MAX_EXPECTED_MARKS) expectedMarks = expectedMarks.slice(-4);
			},
			shouldIgnoreChange(current) {
				if (expectedMarks.length === 0) return false;
				const now = nowMs();
				pruneExpiredMarks(now);
				if (expectedMarks.length === 0) return false;
				return expectedMarks.some((mark) => areVolumesEquivalent(current.volume, mark.snapshot.volume) && current.muted === mark.snapshot.muted);
			}
		};
	}
	//#endregion
	//#region src/features/gallery/components/vertical-gallery-view/VerticalImageItem.helpers.ts
	var CLEAN_FILENAME_MAX_LENGTH = 40;
	var CLEAN_FILENAME_TRUNCATION_MARKER = "...";
	var CLEAN_FILENAME_EXTENSION_REGEX = /(?:\.[^./\\]{1,10})$/;
	var CLEAN_FILENAME_TWITTER_PREFIX_REGEX = /^twitter_media_\d{8}T\d{6}_/;
	var CLEAN_FILENAME_MEDIA_PREFIX_REGEX = /^\/media\//;
	var CLEAN_FILENAME_RELATIVE_PREFIX_REGEX = /^\.\//;
	function cleanFilename(filename) {
		if (!filename) return "Untitled";
		const truncateMiddlePreservingExtension = (value) => {
			if (value.length <= CLEAN_FILENAME_MAX_LENGTH) return value;
			const extension = value.match(CLEAN_FILENAME_EXTENSION_REGEX)?.[0] ?? "";
			const base = extension ? value.slice(0, -extension.length) : value;
			const available = CLEAN_FILENAME_MAX_LENGTH - extension.length - 3;
			if (available <= 1) return value.slice(0, CLEAN_FILENAME_MAX_LENGTH);
			const headLen = Math.max(1, Math.floor(available / 2));
			const tailLen = Math.max(1, available - headLen);
			return `${base.slice(0, headLen)}${CLEAN_FILENAME_TRUNCATION_MARKER}${base.slice(Math.max(0, base.length - tailLen))}${extension}`;
		};
		let cleaned = filename.replace(CLEAN_FILENAME_TWITTER_PREFIX_REGEX, "").replace(CLEAN_FILENAME_MEDIA_PREFIX_REGEX, "").replace(CLEAN_FILENAME_RELATIVE_PREFIX_REGEX, "");
		const lastSegment = cleaned.split(/[\\/]/).pop();
		if (lastSegment) cleaned = lastSegment;
		if (/^[\\/]+$/.test(cleaned)) cleaned = "";
		cleaned = cleaned.trim();
		if (!cleaned) return "Untitled";
		return truncateMiddlePreservingExtension(cleaned);
	}
	/**
	* Normalize persisted video volume setting.
	*
	* The stored value may be corrupted (e.g. string, NaN, out-of-range).
	* This function ensures the returned value is always a finite number in [0, 1].
	*/
	function normalizeVideoVolumeSetting(value, fallback = 1) {
		const candidate = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
		if (!Number.isFinite(candidate)) return fallback;
		return Math.min(1, Math.max(0, candidate));
	}
	/**
	* Normalize persisted video muted setting.
	*
	* The stored value may be corrupted (e.g. number or string values).
	* This function ensures the returned value is always a boolean.
	*/
	function normalizeVideoMutedSetting(value, fallback = false) {
		if (typeof value === "boolean") return value;
		if (typeof value === "number") return value !== 0;
		if (typeof value === "string") {
			const normalized = value.trim().toLowerCase();
			if (normalized === "true" || normalized === "1") return true;
			if (normalized === "false" || normalized === "0") return false;
		}
		return fallback;
	}
	//#endregion
	//#region src/features/gallery/components/vertical-gallery-view/hooks/use-video-volume-persistence.ts
	/**
	* @fileoverview Video volume persistence hook
	* @description Manages video volume/muted state with settings persistence
	* and guards against programmatic vs user-driven volume changes.
	*/
	/**
	* Hook to manage video volume state with settings persistence.
	*
	* Reads initial volume/muted from settings, applies them when the video
	* element becomes ready, and persists any user-driven changes back to
	* settings with debounce.
	*/
	function useVideoVolumePersistence(options) {
		const { videoRef, isVideo } = options;
		const [videoVolume, setVideoVolume] = createSignal(normalizeVideoVolumeSetting(getTypedSettingOr("gallery.videoVolume", 1), 1));
		const [videoMuted, setVideoMuted] = createSignal(normalizeVideoMutedSetting(getTypedSettingOr("gallery.videoMuted", false), false));
		const [isApplyingVideoSettings, setIsApplyingVideoSettings] = createSignal(false);
		const volumeChangeGuard = createVideoVolumeChangeGuard();
		const applyMutedProgrammatically = (videoEl, muted) => {
			volumeChangeGuard.markProgrammaticChange({
				volume: videoEl.volume,
				muted
			});
			videoEl.muted = muted;
		};
		const applyVolumeProgrammatically = (videoEl, volume) => {
			volumeChangeGuard.markProgrammaticChange({
				volume,
				muted: videoEl.muted
			});
			videoEl.volume = volume;
		};
		createEffect(() => {
			const video = videoRef();
			if (video && isVideo()) {
				setIsApplyingVideoSettings(true);
				try {
					untrack(() => {
						const nextMuted = normalizeVideoMutedSetting(videoMuted(), false);
						const nextVolume = normalizeVideoVolumeSetting(videoVolume(), 1);
						if (nextMuted !== videoMuted()) setVideoMuted(nextMuted);
						if (nextVolume !== videoVolume()) setVideoVolume(nextVolume);
						applyMutedProgrammatically(video, nextMuted);
						applyVolumeProgrammatically(video, nextVolume);
					});
				} finally {
					setIsApplyingVideoSettings(false);
				}
			}
		});
		const debouncedSaveVolume = createDebounced((volume, muted) => {
			setTypedSetting("gallery.videoVolume", volume).catch((error) => {});
			setTypedSetting("gallery.videoMuted", muted).catch((error) => {});
		}, 300);
		onCleanup(() => {
			debouncedSaveVolume.flush();
		});
		const handleVolumeChange = (event) => {
			const video = event.currentTarget;
			const snapshot = {
				volume: video.volume,
				muted: video.muted
			};
			if (isApplyingVideoSettings() || volumeChangeGuard.shouldIgnoreChange(snapshot)) return;
			const newVolume = normalizeVideoVolumeSetting(snapshot.volume, 1);
			const newMuted = normalizeVideoMutedSetting(snapshot.muted, false);
			setVideoVolume(newVolume);
			setVideoMuted(newMuted);
			debouncedSaveVolume(newVolume, newMuted);
		};
		return {
			volumeChangeGuard,
			applyMutedProgrammatically,
			applyVolumeProgrammatically,
			handleVolumeChange
		};
	}
	var VerticalImageItem_module_default = {
		container: "xg-huYo",
		active: "xg-xm-1",
		focused: "xg-luqi",
		imageWrapper: "xg-8-c8",
		placeholder: "xg-lhkE",
		loadingSpinner: "xg-6YYD",
		image: "xg-FWlk",
		video: "xg-GUev",
		loading: "xg-8Z3S",
		loaded: "xg-y9iP",
		fitOriginal: "xg-yYtG",
		fitWidth: "xg-Uc0o",
		fitHeight: "xg-M9Z6",
		fitContainer: "xg--Mlr",
		errorIcon: "xg-Wno7",
		errorText: "xg-8-wi",
		error: "xg-Gswe"
	};
	//#endregion
	//#region src/shared/hooks/use-translation.ts
	/**
	* Custom hook for reactive translations (auto-updates on language change)
	* @returns Translation function that updates when language changes
	*/
	function useTranslation() {
		const languageService = getLanguageService();
		const [revision, setRevision] = createSignal(0);
		onCleanup(languageService.onLanguageChange(() => {
			setRevision((value) => value + 1);
		}));
		return (key, params) => {
			revision();
			return languageService.translate(key, params);
		};
	}
	//#endregion
	//#region src/shared/utils/url/safety.ts
	/**
	* @fileoverview Centralized URL safety utilities
	*/
	var CONTROL_CHARS_REGEX = /[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u2060\ufeff]/g;
	var SCHEME_WHITESPACE_REGEX = /[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u2060\ufeff\s]+/g;
	var EXPLICIT_SCHEME_REGEX = /^[a-zA-Z][a-zA-Z0-9+.-]*:/;
	var MAX_DECODE_ITERATIONS = 3;
	var MAX_SCHEME_PROBE_LENGTH = 64;
	var DEFAULT_BLOCKED_PROTOCOL_HINTS = [
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
	];
	var MEDIA_URL_POLICY = {
		allowedProtocols: Object.freeze(/* @__PURE__ */ new Set(["http:", "https:"])),
		allowRelative: true,
		allowProtocolRelative: true,
		allowFragments: false,
		allowDataUrls: true,
		allowedDataMimePrefixes: [
			"image/png",
			"image/jpeg",
			"image/jpg",
			"image/gif",
			"image/webp",
			"image/avif"
		]
	};
	/**
	* ⚠️ MEDIA_URL_POLICY is for media rendering sinks ONLY (<img>, <video>).
	* Do NOT reuse for <iframe>, <a href>, or any script-injectable context.
	* The allowDataUrls flag is safe for media elements but dangerous if applied
	* to other sinks. For non-media URL validation, create a separate policy
	* with allowDataUrls: false.
	*/
	/**
	* Check whether a raw URL value is allowed under the given safety policy.
	*
	* Performs control-character stripping, blocked-protocol-hint detection,
	* data URL MIME filtering, and protocol allow-listing.
	*
	* @param rawUrl - The URL string to check (null/undefined returns false)
	* @param policy - The safety policy to enforce
	* @returns True if the URL is allowed, false otherwise
	*/
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
	/**
	* Check whether a value begins with a blocked protocol hint.
	*
	* Decodes URL-encoded characters up to MAX_DECODE_ITERATIONS times
	* to catch obfuscated protocol identifiers (e.g., "jav%61script:").
	*
	* @param value - The string to probe
	* @param hints - Protocol hint prefixes to check against
	* @returns True if a blocked protocol hint is detected
	*/
	function startsWithBlockedProtocolHint(value, hints) {
		const probe = value.slice(0, MAX_SCHEME_PROBE_LENGTH);
		const schemeEnd = probe.indexOf(":");
		const schemeRegion = schemeEnd >= 0 ? probe.slice(0, schemeEnd) : probe;
		if (/%(?![0-9A-Fa-f]{2})/.test(schemeRegion)) return true;
		return buildProbeVariants(probe).some((candidate) => hints.some((hint) => candidate.startsWith(hint)));
	}
	function buildProbeVariants(value) {
		const variants = /* @__PURE__ */ new Set();
		const base = value.toLowerCase();
		variants.add(base);
		variants.add(base.replace(SCHEME_WHITESPACE_REGEX, ""));
		let decoded = base;
		for (let i = 0; i < MAX_DECODE_ITERATIONS; i++) try {
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
		return allowedPrefixes.some((prefix) => mime === prefix || mime.startsWith(`${prefix}+`) || mime.startsWith(`${prefix}-`));
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
	//#endregion
	//#region src/features/gallery/components/vertical-gallery-view/VerticalImageItem.tsx
	/**
	* @fileoverview Vertical Image/Video Item Component (Solid.js)
	* @description Renders individual media items with fit mode, visibility/loading states,
	* video auto-pause, and accessibility support via useVideoVisibility hook.
	*/
	var _tmpl$$11 = /*#__PURE__*/ template(`<div><div>`);
	var _tmpl$2$6 = /*#__PURE__*/ template(`<div><div role=status aria-live=polite>`);
	var _tmpl$3$2 = /*#__PURE__*/ template(`<video controls>`);
	var _tmpl$4$1 = /*#__PURE__*/ template(`<img decoding=async>`, true, false, false);
	var _tmpl$5 = /*#__PURE__*/ template(`<div role=alert><span>⚠️</span><span>`);
	var FIT_MODE_CLASSES = {
		original: VerticalImageItem_module_default.fitOriginal,
		fitHeight: VerticalImageItem_module_default.fitHeight,
		fitWidth: VerticalImageItem_module_default.fitWidth,
		fitContainer: VerticalImageItem_module_default.fitContainer
	};
	function VerticalImageItem(props) {
		const [local, rest] = splitProps(props, [
			"media",
			"index",
			"isActive",
			"isFocused",
			"forceVisible",
			"onClick",
			"className",
			"onMediaLoad",
			"fitMode",
			"style",
			"registerContainer",
			"onFocus",
			"aria-label",
			"aria-describedby",
			"role",
			"tabIndex"
		]);
		const isFocused = () => local.isFocused ?? false;
		const className$1 = () => local.className ?? "";
		const shouldEagerLoad = () => (local.forceVisible ?? false) || (local.isActive ?? false);
		const translate = useTranslation();
		/** Priority hint for media fetch — high for above-the-fold (active, focused, preloaded),
		*  low for below-the-fold items yet to be scrolled into view. */
		const fetchPriority = () => shouldEagerLoad() ? "high" : "low";
		const isVideo = () => local.media.type === "video" || local.media.type === "gif";
		/**
		* Resolve the image source URL for display.
		*
		* Uses media.url for all types. Non-active images previously used
		* thumbnailUrl (perf optimization B5), but this caused dimension
		* mismatches requiring complex workarounds. loading=\"lazy\" already
		* defers off-screen network requests, making thumbnail URLs redundant.
		*/
		const displaySrc = createMemo(() => local.media.url);
		const [isLoaded, setIsLoaded] = createSignal(false);
		const [isError, setIsError] = createSignal(false);
		const isDisplaySrcValid = createMemo(() => isUrlAllowed(displaySrc(), MEDIA_URL_POLICY));
		createEffect(() => {
			setIsLoaded(false);
			setIsError(false);
		});
		const [containerRef, setContainerRef] = createSignal(null);
		const [imageRef, setImageRef] = createSignal(null);
		const [videoRef, setVideoRef] = createSignal(null);
		const resolvedDimensions = createMemo(() => resolveMediaDimensionsWithIntrinsicFlag(local.media));
		const dimensions = () => resolvedDimensions().dimensions;
		const hasIntrinsicSize = () => resolvedDimensions().hasIntrinsicSize;
		const intrinsicSizingStyle = createMemo(() => createIntrinsicSizingStyle(dimensions()));
		const { applyMutedProgrammatically, handleVolumeChange } = useVideoVolumePersistence({
			videoRef,
			isVideo
		});
		useVideoVisibility({
			container: containerRef,
			video: videoRef,
			isVideo,
			setMuted: applyMutedProgrammatically
		});
		createEffect(() => {
			const video = videoRef();
			if (local.isActive && video) {
				if (!untrack(() => gallerySignals.currentVideoElement === video)) setCurrentVideoElement(video);
				return;
			}
			if (untrack(() => gallerySignals.currentVideoElement === video)) setCurrentVideoElement(null);
		});
		createEffect(() => {
			const priority = fetchPriority();
			const video = videoRef();
			const image = imageRef();
			if (video && isVideo()) video.setAttribute("fetchpriority", priority);
			if (image && !isVideo()) image.setAttribute("fetchpriority", priority);
		});
		const preventDragStart = (event) => event.preventDefault();
		const handleContainerClick = (event) => {
			event.stopPropagation();
			if (isVideo()) {
				const video = videoRef();
				if (video && isClickOnVideoElement(event, video)) return;
			}
			containerRef()?.focus?.({ preventScroll: true });
			local.onClick();
		};
		const handleContainerKeyDown = (event) => {
			if (rest.onKeyDown) {
				rest.onKeyDown(event);
				return;
			}
			if (local.role !== void 0 && local.role !== "button") return;
			if (event.key === "Enter") {
				event.preventDefault();
				event.stopPropagation();
				local.onClick();
			}
		};
		const handleContainerKeyUp = (event) => {
			if (event.key === " ") {
				event.preventDefault();
				event.stopPropagation();
				local.onClick();
			}
		};
		const handleMediaLoad = () => {
			if (!isLoaded()) {
				setIsLoaded(true);
				setIsError(false);
				local.onMediaLoad?.(local.media.id, local.index);
			}
		};
		const handleMediaError = () => {
			setIsError(true);
			setIsLoaded(false);
		};
		createEffect(() => {
			if (isVideo()) {
				const video = videoRef();
				if (video && video.readyState >= 1 && !isLoaded()) handleMediaLoad();
			} else {
				const image = imageRef();
				if (image?.complete && !isLoaded()) if (image.naturalWidth > 0) handleMediaLoad();
				else handleMediaError();
			}
		});
		const resolvedFitMode = createMemo(() => {
			const value = local.fitMode;
			if (typeof value === "function") return value();
			return value ?? "fitWidth";
		});
		const fitModeClass = () => FIT_MODE_CLASSES[resolvedFitMode()];
		const cisOverrideStyle = createMemo(() => {
			const dims = dimensions();
			const value = computeContainIntrinsicSizeOverride({
				intrinsicWidth: dims.width,
				intrinsicHeight: dims.height,
				hasIntrinsicSize: hasIntrinsicSize(),
				fitMode: resolvedFitMode()
			});
			if (!value) return {};
			return { "--xeg-cis-override": value };
		});
		const mergedStyle = createMemo(() => ({
			...intrinsicSizingStyle(),
			...cisOverrideStyle(),
			...local.style ?? {}
		}));
		const containerClasses = createMemo(() => cx("xeg-gallery", CSS.CLASSES.ITEM, VerticalImageItem_module_default.container, local.isActive ? VerticalImageItem_module_default.active : void 0, isFocused() ? VerticalImageItem_module_default.focused : void 0, className$1()));
		const assignContainerRef = (element) => {
			setContainerRef(element);
			local.registerContainer?.(element);
		};
		const defaultContainerRole = () => "listitem";
		const resolvedContainerRole = () => local.role ?? defaultContainerRole();
		const totalItems = () => gallerySignals.mediaItems.length;
		const imageAltText = createMemo(() => isVideo() ? translate("msg.gal.videoCount", {
			index: local.index + 1,
			total: totalItems()
		}) : translate("msg.gal.imageCount", {
			index: local.index + 1,
			total: totalItems(),
			alt: local.media.alt || cleanFilename(local.media.filename)
		}));
		return (() => {
			var _el$ = _tmpl$$11(), _el$2 = _el$.firstChild;
			_el$.$$keyup = handleContainerKeyUp;
			_el$.$$keydown = handleContainerKeyDown;
			addEventListener(_el$, "blur", rest.onBlur);
			addEventListener(_el$, "focus", local.onFocus);
			_el$.$$click = handleContainerClick;
			use(assignContainerRef, _el$);
			insert(_el$2, (() => {
				var _c$ = memo(() => !!(!isLoaded() && !isError()));
				return () => _c$() && (() => {
					var _el$3 = _tmpl$2$6(), _el$4 = _el$3.firstChild;
					createRenderEffect((_p$) => {
						var _v$13 = VerticalImageItem_module_default.placeholder, _v$14 = cx("xeg-spinner", VerticalImageItem_module_default.loadingSpinner), _v$15 = translate("msg.gal.loading");
						_v$13 !== _p$.e && className(_el$3, _p$.e = _v$13);
						_v$14 !== _p$.t && className(_el$4, _p$.t = _v$14);
						_v$15 !== _p$.a && setAttribute(_el$4, "aria-label", _p$.a = _v$15);
						return _p$;
					}, {
						e: void 0,
						t: void 0,
						a: void 0
					});
					return _el$3;
				})();
			})(), null);
			insert(_el$2, (() => {
				var _c$2 = memo(() => !!(isVideo() && isDisplaySrcValid()));
				return () => _c$2() ? (() => {
					var _el$5 = _tmpl$3$2();
					addEventListener(_el$5, "volumechange", handleVolumeChange);
					_el$5.addEventListener("dragstart", preventDragStart);
					_el$5.addEventListener("error", handleMediaError);
					_el$5.addEventListener("loadedmetadata", handleMediaLoad);
					use(setVideoRef, _el$5);
					createRenderEffect((_p$) => {
						var _v$16 = displaySrc(), _v$17 = cx(VerticalImageItem_module_default.video, fitModeClass(), isLoaded() ? VerticalImageItem_module_default.loaded : VerticalImageItem_module_default.loading), _v$18 = translate("msg.gal.videoCount", {
							index: local.index + 1,
							total: totalItems()
						});
						_v$16 !== _p$.e && setAttribute(_el$5, "src", _p$.e = _v$16);
						_v$17 !== _p$.t && className(_el$5, _p$.t = _v$17);
						_v$18 !== _p$.a && setAttribute(_el$5, "aria-label", _p$.a = _v$18);
						return _p$;
					}, {
						e: void 0,
						t: void 0,
						a: void 0
					});
					return _el$5;
				})() : memo(() => !!(!isVideo() && isDisplaySrcValid()))() ? (() => {
					var _el$6 = _tmpl$4$1();
					_el$6.addEventListener("dragstart", preventDragStart);
					_el$6.addEventListener("error", handleMediaError);
					_el$6.addEventListener("load", handleMediaLoad);
					use(setImageRef, _el$6);
					createRenderEffect((_p$) => {
						var _v$19 = displaySrc(), _v$20 = imageAltText(), _v$21 = dimensions().width, _v$22 = dimensions().height, _v$23 = shouldEagerLoad() ? "eager" : "lazy", _v$24 = cx(VerticalImageItem_module_default.image, fitModeClass(), isLoaded() ? VerticalImageItem_module_default.loaded : VerticalImageItem_module_default.loading);
						_v$19 !== _p$.e && setAttribute(_el$6, "src", _p$.e = _v$19);
						_v$20 !== _p$.t && setAttribute(_el$6, "alt", _p$.t = _v$20);
						_v$21 !== _p$.a && setAttribute(_el$6, "width", _p$.a = _v$21);
						_v$22 !== _p$.o && setAttribute(_el$6, "height", _p$.o = _v$22);
						_v$23 !== _p$.i && setAttribute(_el$6, "loading", _p$.i = _v$23);
						_v$24 !== _p$.n && className(_el$6, _p$.n = _v$24);
						return _p$;
					}, {
						e: void 0,
						t: void 0,
						a: void 0,
						o: void 0,
						i: void 0,
						n: void 0
					});
					return _el$6;
				})() : null;
			})(), null);
			insert(_el$2, (() => {
				var _c$3 = memo(() => !!isError());
				return () => _c$3() && (() => {
					var _el$7 = _tmpl$5(), _el$8 = _el$7.firstChild, _el$9 = _el$8.nextSibling;
					insert(_el$9, () => translate("msg.gal.loadFail", { type: isVideo() ? "video" : "image" }));
					createRenderEffect((_p$) => {
						var _v$25 = VerticalImageItem_module_default.error, _v$26 = VerticalImageItem_module_default.errorIcon, _v$27 = VerticalImageItem_module_default.errorText;
						_v$25 !== _p$.e && className(_el$7, _p$.e = _v$25);
						_v$26 !== _p$.t && className(_el$8, _p$.t = _v$26);
						_v$27 !== _p$.a && className(_el$9, _p$.a = _v$27);
						return _p$;
					}, {
						e: void 0,
						t: void 0,
						a: void 0
					});
					return _el$7;
				})();
			})(), null);
			createRenderEffect((_p$) => {
				var _v$ = containerClasses(), _v$2 = local.index, _v$3 = resolvedFitMode(), _v$4 = isLoaded() ? "true" : "false", _v$5 = hasIntrinsicSize() ? "true" : void 0, _v$6 = mergedStyle(), _v$7 = local["aria-label"] || imageAltText(), _v$8 = local["aria-describedby"], _v$9 = local.index + 1, _v$0 = totalItems(), _v$1 = resolvedContainerRole(), _v$10 = isFocused() ? 0 : -1, _v$11 = void 0, _v$12 = VerticalImageItem_module_default.imageWrapper;
				_v$ !== _p$.e && className(_el$, _p$.e = _v$);
				_v$2 !== _p$.t && setAttribute(_el$, "data-index", _p$.t = _v$2);
				_v$3 !== _p$.a && setAttribute(_el$, "data-fit-mode", _p$.a = _v$3);
				_v$4 !== _p$.o && setAttribute(_el$, "data-media-loaded", _p$.o = _v$4);
				_v$5 !== _p$.i && setAttribute(_el$, "data-has-intrinsic-size", _p$.i = _v$5);
				_p$.n = style(_el$, _v$6, _p$.n);
				_v$7 !== _p$.s && setAttribute(_el$, "aria-label", _p$.s = _v$7);
				_v$8 !== _p$.h && setAttribute(_el$, "aria-describedby", _p$.h = _v$8);
				_v$9 !== _p$.r && setAttribute(_el$, "aria-posinset", _p$.r = _v$9);
				_v$0 !== _p$.d && setAttribute(_el$, "aria-setsize", _p$.d = _v$0);
				_v$1 !== _p$.l && setAttribute(_el$, "role", _p$.l = _v$1);
				_v$10 !== _p$.u && setAttribute(_el$, "tabindex", _p$.u = _v$10);
				_v$11 !== _p$.c && setAttribute(_el$, "data-testid", _p$.c = _v$11);
				_v$12 !== _p$.w && className(_el$2, _p$.w = _v$12);
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
				w: void 0
			});
			return _el$;
		})();
	}
	delegateEvents([
		"click",
		"keydown",
		"keyup"
	]);
	var Tooltip_module_default = {
		trigger: "xg-wQ6O",
		content: "xg-rNmA",
		placementBottom: "xg-ge-p",
		placementTop: "xg-kpNX",
		visible: "xg-JV6L",
		arrow: "xg-guqM",
		placementBottomArrow: "xg-46Rg",
		placementTopArrow: "xg-GobA",
		arrowInner: "xg-RfHK",
		placementBottomArrowInner: "xg-a50g",
		placementTopArrowInner: "xg-t4Y3"
	};
	//#endregion
	//#region src/shared/components/ui/Tooltip/Tooltip.tsx
	/**
	* @fileoverview Tooltip component with intelligent positioning.
	*
	* Renders a custom tooltip on hover/focus via Portal to document.body.
	* Supports auto-flip between top/bottom placement, configurable delay,
	* and full accessibility (aria-describedby, role="tooltip").
	*
	* @module shared/components/ui/Tooltip/Tooltip
	*/
	var _tmpl$$10 = /*#__PURE__*/ template(`<span>`);
	var _tmpl$2$5 = /*#__PURE__*/ template(`<div role=tooltip><span aria-hidden=true></span><span aria-hidden=true>`);
	/** Default show delay (ms) — short enough to feel responsive, long enough to not flicker */
	var DEFAULT_SHOW_DELAY = 300;
	/** Default hide delay (ms) — prevents flicker when moving between adjacent tooltip targets */
	var DEFAULT_HIDE_DELAY = 100;
	/** Gap between tooltip and trigger element (px) */
	var DEFAULT_OFFSET = 6;
	/** Minimum distance from viewport edge (px) */
	var VIEWPORT_PADDING = 8;
	/**
	* Compute tooltip position relative to a trigger element.
	* Auto-flips between bottom/top based on available viewport space.
	*/
	function computePosition(triggerRect, preferredPlacement, offset) {
		const viewportWidth = window.innerWidth;
		const viewportHeight = window.innerHeight;
		const centerX = triggerRect.left + triggerRect.width / 2;
		const spaceBelow = viewportHeight - triggerRect.bottom - offset - VIEWPORT_PADDING;
		const spaceAbove = triggerRect.top - offset - VIEWPORT_PADDING;
		const useTop = preferredPlacement === "top" || spaceBelow < 0;
		let y;
		let actualPlacement;
		if (useTop && spaceAbove > 0) {
			actualPlacement = "top";
			y = triggerRect.top - offset;
		} else {
			actualPlacement = "bottom";
			y = triggerRect.bottom + offset;
		}
		return {
			x: Math.max(VIEWPORT_PADDING, Math.min(centerX, viewportWidth - VIEWPORT_PADDING)),
			y,
			actualPlacement
		};
	}
	/**
	* Tooltip component.
	*
	* Wraps child elements with hover/focus handlers and renders a positioned
	* tooltip in a Portal. Uses `display: contents` on the trigger wrapper
	* so it does not affect layout.
	*
	* @example
	* ```tsx
	* <Tooltip content="Close gallery">
	*   <button>✕</button>
	* </Tooltip>
	* ```
	*/
	function Tooltip(props) {
		const [local] = splitProps(props, [
			"offset",
			"showDelay",
			"hideDelay",
			"placement",
			"children",
			"content"
		]);
		const tooltipId = createUniqueId();
		const [visible, setVisible] = createSignal(false);
		const [position, setPosition] = createSignal(null);
		const offset = local.offset ?? DEFAULT_OFFSET;
		const showDelay = local.showDelay ?? DEFAULT_SHOW_DELAY;
		const hideDelay = local.hideDelay ?? DEFAULT_HIDE_DELAY;
		const preferredPlacement = local.placement ?? "bottom";
		let triggerRef;
		let showTimer;
		let hideTimer;
		let positionRafId;
		const clearTimers = () => {
			if (showTimer !== void 0) {
				clearTimeout(showTimer);
				showTimer = void 0;
			}
			if (hideTimer !== void 0) {
				clearTimeout(hideTimer);
				hideTimer = void 0;
			}
			if (positionRafId !== void 0) {
				cancelAnimationFrame(positionRafId);
				positionRafId = void 0;
			}
		};
		const updatePosition = () => {
			if (!triggerRef) return;
			const firstChild = triggerRef.firstElementChild;
			if (!(firstChild instanceof HTMLElement)) return;
			positionRafId = requestAnimationFrame(() => {
				const rect = firstChild.getBoundingClientRect();
				setPosition(computePosition(rect, preferredPlacement, offset));
			});
		};
		const show = () => {
			clearTimers();
			updatePosition();
			showTimer = setTimeout(() => {
				updatePosition();
				setVisible(true);
			}, showDelay);
		};
		const hide = () => {
			clearTimers();
			hideTimer = setTimeout(() => {
				setVisible(false);
				setPosition(null);
			}, hideDelay);
		};
		const activePosition = createMemo(() => {
			const pos = position();
			return visible() && pos !== null ? pos : null;
		});
		const tooltipStyle = createMemo(() => {
			const pos = activePosition();
			if (pos === null) return {};
			return {
				left: `${pos.x}px`,
				top: `${pos.y}px`
			};
		});
		const tooltipClass = createMemo(() => {
			const pos = activePosition();
			if (pos === null) return Tooltip_module_default.content;
			return cx(Tooltip_module_default.content, Tooltip_module_default.visible, pos.actualPlacement === "bottom" ? Tooltip_module_default.placementBottom : Tooltip_module_default.placementTop);
		});
		const arrowClass = createMemo(() => {
			const pos = activePosition();
			if (pos === null) return Tooltip_module_default.arrow;
			return cx(Tooltip_module_default.arrow, pos.actualPlacement === "bottom" ? Tooltip_module_default.placementBottomArrow : Tooltip_module_default.placementTopArrow);
		});
		const arrowInnerClass = createMemo(() => {
			const pos = activePosition();
			if (pos === null) return Tooltip_module_default.arrowInner;
			return cx(Tooltip_module_default.arrowInner, pos.actualPlacement === "bottom" ? Tooltip_module_default.placementBottomArrowInner : Tooltip_module_default.placementTopArrowInner);
		});
		const describeById = createMemo(() => activePosition() !== null ? tooltipId : void 0);
		onCleanup(() => {
			clearTimers();
		});
		return (() => {
			var _el$ = _tmpl$$10();
			_el$.$$focusout = (event) => {
				if (!triggerRef.contains(event.relatedTarget)) hide();
			};
			_el$.$$focusin = show;
			_el$.addEventListener("mouseleave", hide);
			_el$.addEventListener("mouseenter", show);
			var _ref$ = triggerRef;
			typeof _ref$ === "function" ? use(_ref$, _el$) : triggerRef = _el$;
			insert(_el$, () => local.children, null);
			insert(_el$, (() => {
				var _c$ = memo(() => activePosition() !== null);
				return () => _c$() && createComponent(Portal, {
					get mount() {
						return document.body;
					},
					get children() {
						var _el$2 = _tmpl$2$5(), _el$3 = _el$2.firstChild, _el$4 = _el$3.nextSibling;
						setAttribute(_el$2, "id", tooltipId);
						insert(_el$2, () => local.content, null);
						createRenderEffect((_p$) => {
							var _v$3 = tooltipClass(), _v$4 = tooltipStyle(), _v$5 = arrowClass(), _v$6 = arrowInnerClass();
							_v$3 !== _p$.e && className(_el$2, _p$.e = _v$3);
							_p$.t = style(_el$2, _v$4, _p$.t);
							_v$5 !== _p$.a && className(_el$3, _p$.a = _v$5);
							_v$6 !== _p$.o && className(_el$4, _p$.o = _v$6);
							return _p$;
						}, {
							e: void 0,
							t: void 0,
							a: void 0,
							o: void 0
						});
						return _el$2;
					}
				});
			})(), null);
			createRenderEffect((_p$) => {
				var _v$ = Tooltip_module_default.trigger, _v$2 = describeById();
				_v$ !== _p$.e && className(_el$, _p$.e = _v$);
				_v$2 !== _p$.t && setAttribute(_el$, "aria-describedby", _p$.t = _v$2);
				return _p$;
			}, {
				e: void 0,
				t: void 0
			});
			return _el$;
		})();
	}
	delegateEvents(["focusin", "focusout"]);
	//#endregion
	//#region src/shared/components/ui/Button/IconButton.tsx
	var _tmpl$$9 = /*#__PURE__*/ template(`<button>`);
	/**
	* Accessible icon button with optional tooltip.
	*
	* Renders a `<button>` element with an icon.
	* When `tooltip` is provided, a Portal-based custom tooltip is shown on hover/focus
	* instead of the native `title` attribute. Falls back to `title` for backward compatibility.
	*
	* @param props - Button configuration (icon, label, click handler, tooltip, etc.)
	* @returns Button JSX element (optionally wrapped in Tooltip)
	*/
	function IconButton(props) {
		const [local] = splitProps(props, [
			"ref",
			"id",
			"type",
			"class",
			"title",
			"tooltip",
			"size",
			"disabled",
			"tabIndex",
			"data-testid",
			"aria-label",
			"aria-controls",
			"aria-expanded",
			"aria-pressed",
			"aria-busy",
			"onClick",
			"onMouseDown",
			"children"
		]);
		const buttonElement = (() => {
			var _el$ = _tmpl$$9();
			addEventListener(_el$, "mousedown", local.onMouseDown, true);
			addEventListener(_el$, "click", local.onClick, true);
			var _ref$ = local.ref;
			typeof _ref$ === "function" ? use(_ref$, _el$) : local.ref = _el$;
			insert(_el$, () => local.children);
			createRenderEffect((_p$) => {
				var _v$ = local.id, _v$2 = local.type ?? "button", _v$3 = cx(local.class), _v$4 = local.tooltip ? void 0 : local.title, _v$5 = local.disabled, _v$6 = local.tabIndex, _v$7 = local.size, _v$8 = local["data-testid"], _v$9 = local["aria-label"], _v$0 = local["aria-controls"], _v$1 = local["aria-expanded"], _v$10 = local["aria-pressed"], _v$11 = local["aria-busy"];
				_v$ !== _p$.e && setAttribute(_el$, "id", _p$.e = _v$);
				_v$2 !== _p$.t && setAttribute(_el$, "type", _p$.t = _v$2);
				_v$3 !== _p$.a && className(_el$, _p$.a = _v$3);
				_v$4 !== _p$.o && setAttribute(_el$, "title", _p$.o = _v$4);
				_v$5 !== _p$.i && (_el$.disabled = _p$.i = _v$5);
				_v$6 !== _p$.n && setAttribute(_el$, "tabindex", _p$.n = _v$6);
				_v$7 !== _p$.s && setAttribute(_el$, "data-size", _p$.s = _v$7);
				_v$8 !== _p$.h && setAttribute(_el$, "data-testid", _p$.h = _v$8);
				_v$9 !== _p$.r && setAttribute(_el$, "aria-label", _p$.r = _v$9);
				_v$0 !== _p$.d && setAttribute(_el$, "aria-controls", _p$.d = _v$0);
				_v$1 !== _p$.l && setAttribute(_el$, "aria-expanded", _p$.l = _v$1);
				_v$10 !== _p$.u && setAttribute(_el$, "aria-pressed", _p$.u = _v$10);
				_v$11 !== _p$.c && setAttribute(_el$, "aria-busy", _p$.c = _v$11);
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
				c: void 0
			});
			return _el$;
		})();
		if (local.tooltip) return createComponent(Tooltip, {
			get content() {
				return local.tooltip;
			},
			children: buttonElement
		});
		return buttonElement;
	}
	delegateEvents(["click", "mousedown"]);
	//#endregion
	//#region src/shared/components/ui/Icon/Icon.tsx
	var _tmpl$$8 = /*#__PURE__*/ template(`<svg xmlns=http://www.w3.org/2000/svg viewBox="0 0 24 24"fill=none stroke="var(--xeg-icon-color, currentColor)"stroke-width=var(--xeg-icon-stroke-width) stroke-linecap=round stroke-linejoin=round>`);
	function Icon(props) {
		const [local] = splitProps(props, [
			"size",
			"class",
			"children",
			"aria-label"
		]);
		const size = local.size ?? "var(--xeg-icon-size)";
		const className = local.class ?? "";
		const ariaLabel = local["aria-label"];
		const sizeValue = typeof size === "number" ? `${size}px` : size;
		return (() => {
			var _el$ = _tmpl$$8();
			setAttribute(_el$, "width", sizeValue);
			setAttribute(_el$, "height", sizeValue);
			setAttribute(_el$, "class", className);
			setAttribute(_el$, "role", ariaLabel ? "img" : void 0);
			setAttribute(_el$, "aria-label", ariaLabel);
			setAttribute(_el$, "aria-hidden", !ariaLabel);
			insert(_el$, () => local.children);
			return _el$;
		})();
	}
	//#endregion
	//#region src/shared/components/ui/Icon/lucide/icon-nodes.ts
	/**
	* Lucide icon definitions as SVG node arrays.
	* Source: https://github.com/lucide-icons/lucide (ISC License)
	*/
	var LUCIDE_ICON_NODES = {
		"chevron-left": [["path", { d: "m15 18-6-6 6-6" }]],
		"chevron-right": [["path", { d: "m9 18 6-6-6-6" }]],
		download: [
			["path", { d: "M12 15V3" }],
			["path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }],
			["path", { d: "m7 10 5 5 5-5" }]
		],
		"folder-down": [
			["path", { d: "M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" }],
			["path", { d: "M12 10v6" }],
			["path", { d: "m15 13-3 3-3-3" }]
		],
		"maximize-2": [
			["path", { d: "M15 3h6v6" }],
			["path", { d: "m21 3-7 7" }],
			["path", { d: "m3 21 7-7" }],
			["path", { d: "M9 21H3v-6" }]
		],
		"minimize-2": [
			["path", { d: "m14 10 7-7" }],
			["path", { d: "M20 10h-6V4" }],
			["path", { d: "m3 21 7-7" }],
			["path", { d: "M4 14h6v6" }]
		],
		"move-horizontal": [
			["path", { d: "m18 8 4 4-4 4" }],
			["path", { d: "M2 12h20" }],
			["path", { d: "m6 8-4 4 4 4" }]
		],
		"move-vertical": [
			["path", { d: "M12 2v20" }],
			["path", { d: "m8 18 4 4 4-4" }],
			["path", { d: "m8 6 4-4 4 4" }]
		],
		"settings-2": [
			["path", { d: "M14 17H5" }],
			["path", { d: "M19 7h-9" }],
			["circle", {
				cx: 17,
				cy: 17,
				r: 3
			}],
			["circle", {
				cx: 7,
				cy: 7,
				r: 3
			}]
		],
		"messages-square": [["path", { d: "M16 10a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 14.286V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" }], ["path", { d: "M20 9a2 2 0 0 1 2 2v10.286a.71.71 0 0 1-1.212.502l-2.202-2.202A2 2 0 0 0 17.172 19H10a2 2 0 0 1-2-2v-1" }]],
		"external-link": [
			["path", { d: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" }],
			["path", { d: "m15 3 6 6" }],
			["path", { d: "M10 14 21 3" }]
		],
		x: [["path", { d: "M18 6 6 18" }], ["path", { d: "m6 6 12 12" }]]
	};
	//#endregion
	//#region src/shared/components/ui/Icon/lucide/lucide-icons.tsx
	var _tmpl$$7 = /*#__PURE__*/ template(`<svg><path></svg>`, false, true, false);
	var _tmpl$2$4 = /*#__PURE__*/ template(`<svg><circle></svg>`, false, true, false);
	/** Renders a Lucide icon node (path or circle) as SVG element. */
	var renderNode = (node) => {
		const [tag, attrs] = node;
		switch (tag) {
			case "path": return (() => {
				var _el$ = _tmpl$$7();
				createRenderEffect(() => setAttribute(_el$, "d", attrs.d));
				return _el$;
			})();
			case "circle": return (() => {
				var _el$2 = _tmpl$2$4();
				createRenderEffect((_p$) => {
					var _v$ = attrs.cx, _v$2 = attrs.cy, _v$3 = attrs.r;
					_v$ !== _p$.e && setAttribute(_el$2, "cx", _p$.e = _v$);
					_v$2 !== _p$.t && setAttribute(_el$2, "cy", _p$.t = _v$2);
					_v$3 !== _p$.a && setAttribute(_el$2, "r", _p$.a = _v$3);
					return _p$;
				}, {
					e: void 0,
					t: void 0,
					a: void 0
				});
				return _el$2;
			})();
			default: return tag;
		}
	};
	/**
	* Renders a Lucide SVG icon from predefined node definitions.
	* Maps icon names to SVG nodes and renders them via the shared Icon wrapper.
	*
	* @param props - Component props with icon name and Icon component options
	* @returns JSX element containing the rendered icon SVG
	*
	* @example
	* ```tsx
	* <LucideIcon name="download" />
	* <LucideIcon name="download" size="2em" aria-label="Download file" />
	* <LucideIcon name="chevron-right" size={24} class="text-primary" />
	* ```
	*/
	function LucideIcon(props) {
		const [local] = splitProps(props, [
			"name",
			"size",
			"class",
			"aria-label"
		]);
		const nodes = LUCIDE_ICON_NODES[local.name];
		return createComponent(Icon, {
			get size() {
				return local.size;
			},
			get ["class"]() {
				return local.class;
			},
			get ["aria-label"]() {
				return local["aria-label"];
			},
			get children() {
				return nodes.map(renderNode);
			}
		});
	}
	var SettingsControls_module_default = {
		body: "xg-EeSh",
		bodyCompact: "xg-nm9B",
		setting: "xg-PI5C",
		settingCompact: "xg-VUTt",
		label: "xg-vhT3",
		compactLabel: "xg-Y62M",
		select: "xg-jpiS"
	};
	//#endregion
	//#region src/shared/components/ui/Settings/SettingsControls.tsx
	/**
	* @fileoverview Settings Controls Component
	* @module shared/components/ui/Settings/SettingsControls
	* @description Theme and language selection controls for application settings
	*
	* **Features**:
	* - Theme selection (auto, light, dark)
	* - Language selection (auto, Korean, English, Japanese)
	* - Compact mode for toolbar integration
	* - Reactive translations via language service
	* - Fully accessible with proper ARIA labels
	* - Custom tooltip on hover/focus via Tooltip component
	*
	* **Design Pattern**:
	* - Reactive: Uses createMemo for derived state
	* - Effect cleanup: Language change subscription properly cleaned up
	* - Accessibility: Native select elements with proper labels
	*
	* @see {@link SettingsControlsProps} - Type definitions
	* Component styles: `SettingsControls.module.css`
	*/
	var _tmpl$$6 = /*#__PURE__*/ template(`<select autocomplete=off aria-invalid=false required>`);
	var _tmpl$2$3 = /*#__PURE__*/ template(`<div><div><label></div><div><label>`);
	var _tmpl$3$1 = /*#__PURE__*/ template(`<option>`);
	/**
	* Available theme options
	*/
	var THEME_OPTIONS = [
		"auto",
		"light",
		"dark"
	];
	/**
	* Available language options
	*/
	var LANGUAGE_OPTIONS = [
		"auto",
		"en",
		"ko",
		"ja",
		"zh-CN",
		"es",
		"ar"
	];
	/**
	* Native-language display labels for each language option.
	* Each language is shown in its own script, regardless of the current UI language.
	*/
	var LANGUAGE_NATIVE_LABELS = {
		auto: "Auto",
		en: "English",
		ko: "한국어",
		ja: "日本語",
		"zh-CN": "简体中文",
		es: "Español",
		ar: "العربية"
	};
	/**
	* Settings Controls Component
	*
	* Renders theme and language selection controls with reactive translations.
	* Supports compact mode for toolbar integration.
	*
	* @param props - Component props
	* @returns Settings controls JSX element
	*
	* @example
	* ```tsx
	* <SettingsControls
	*   currentTheme="auto"
	*   currentLanguage="ko"
	*   onThemeChange={(e) => handleThemeChange(e)}
	*   onLanguageChange={(e) => handleLanguageChange(e)}
	*   compact={false}
	*   data-testid="settings-controls"
	* />
	* ```
	*/
	function SettingsControls(props) {
		const [local] = splitProps(props, [
			"currentTheme",
			"currentLanguage",
			"onThemeChange",
			"onLanguageChange",
			"compact",
			"data-testid"
		]);
		const languageService = getLanguageService();
		const [revision, setRevision] = createSignal(0);
		onMount(() => {
			onCleanup(languageService.onLanguageChange(() => setRevision((v) => v + 1)));
		});
		const strings = createMemo(() => {
			revision();
			return {
				theme: {
					title: languageService.translate("st.th"),
					labels: {
						auto: languageService.translate("st.thAuto"),
						light: languageService.translate("st.thLt"),
						dark: languageService.translate("st.thDk")
					}
				},
				language: {
					title: languageService.translate("st.lang"),
					labels: {
						auto: languageService.translate("st.langAuto"),
						ko: languageService.translate("st.langKo"),
						en: languageService.translate("st.langEn"),
						ja: languageService.translate("st.langJa"),
						"zh-CN": languageService.translate("st.langZhCn"),
						es: languageService.translate("st.langEs"),
						ar: languageService.translate("st.langAr")
					}
				}
			};
		});
		const themeValue = () => resolve(local.currentTheme);
		const languageValue = () => resolve(local.currentLanguage);
		return (() => {
			var _el$ = _tmpl$2$3(), _el$2 = _el$.firstChild, _el$3 = _el$2.firstChild, _el$5 = _el$2.nextSibling, _el$6 = _el$5.firstChild;
			insert(_el$3, () => strings().theme.title);
			insert(_el$2, createComponent(Tooltip, {
				get content() {
					return strings().theme.title;
				},
				get children() {
					var _el$4 = _tmpl$$6();
					addEventListener(_el$4, "change", local.onThemeChange);
					insert(_el$4, () => THEME_OPTIONS.map((option) => (() => {
						var _el$8 = _tmpl$3$1();
						_el$8.value = option;
						insert(_el$8, () => strings().theme.labels[option]);
						return _el$8;
					})()));
					createRenderEffect((_p$) => {
						var _v$ = local["data-testid"] ? `${local["data-testid"]}-theme-select` : "settings-theme-select", _v$2 = cx("xeg-inline-center", SettingsControls_module_default.select), _v$3 = strings().theme.title, _v$4 = local["data-testid"] ? `${local["data-testid"]}-theme-label` : "settings-theme-label", _v$5 = local["data-testid"] ? `${local["data-testid"]}-theme-error` : "settings-theme-error", _v$6 = void 0;
						_v$ !== _p$.e && setAttribute(_el$4, "id", _p$.e = _v$);
						_v$2 !== _p$.t && className(_el$4, _p$.t = _v$2);
						_v$3 !== _p$.a && setAttribute(_el$4, "aria-label", _p$.a = _v$3);
						_v$4 !== _p$.o && setAttribute(_el$4, "aria-labelledby", _p$.o = _v$4);
						_v$5 !== _p$.i && setAttribute(_el$4, "aria-errormessage", _p$.i = _v$5);
						_v$6 !== _p$.n && setAttribute(_el$4, "data-testid", _p$.n = _v$6);
						return _p$;
					}, {
						e: void 0,
						t: void 0,
						a: void 0,
						o: void 0,
						i: void 0,
						n: void 0
					});
					createRenderEffect(() => _el$4.value = themeValue());
					return _el$4;
				}
			}), null);
			insert(_el$6, () => strings().language.title);
			insert(_el$5, createComponent(Tooltip, {
				get content() {
					return strings().language.title;
				},
				get children() {
					var _el$7 = _tmpl$$6();
					addEventListener(_el$7, "change", local.onLanguageChange);
					insert(_el$7, () => LANGUAGE_OPTIONS.map((option) => (() => {
						var _el$9 = _tmpl$3$1();
						_el$9.value = option;
						insert(_el$9, () => LANGUAGE_NATIVE_LABELS[option] ?? option);
						return _el$9;
					})()));
					createRenderEffect((_p$) => {
						var _v$7 = local["data-testid"] ? `${local["data-testid"]}-language-select` : "settings-language-select", _v$8 = cx("xeg-inline-center", SettingsControls_module_default.select), _v$9 = strings().language.title, _v$0 = local["data-testid"] ? `${local["data-testid"]}-language-label` : "settings-language-label", _v$1 = local["data-testid"] ? `${local["data-testid"]}-language-error` : "settings-language-error", _v$10 = void 0;
						_v$7 !== _p$.e && setAttribute(_el$7, "id", _p$.e = _v$7);
						_v$8 !== _p$.t && className(_el$7, _p$.t = _v$8);
						_v$9 !== _p$.a && setAttribute(_el$7, "aria-label", _p$.a = _v$9);
						_v$0 !== _p$.o && setAttribute(_el$7, "aria-labelledby", _p$.o = _v$0);
						_v$1 !== _p$.i && setAttribute(_el$7, "aria-errormessage", _p$.i = _v$1);
						_v$10 !== _p$.n && setAttribute(_el$7, "data-testid", _p$.n = _v$10);
						return _p$;
					}, {
						e: void 0,
						t: void 0,
						a: void 0,
						o: void 0,
						i: void 0,
						n: void 0
					});
					createRenderEffect(() => _el$7.value = languageValue());
					return _el$7;
				}
			}), null);
			createRenderEffect((_p$) => {
				var _v$11 = cx(SettingsControls_module_default.body, local.compact && SettingsControls_module_default.bodyCompact), _v$12 = void 0, _v$13 = cx(SettingsControls_module_default.setting, local.compact && SettingsControls_module_default.settingCompact), _v$14 = local["data-testid"] ? `${local["data-testid"]}-theme-label` : "settings-theme-label", _v$15 = local["data-testid"] ? `${local["data-testid"]}-theme-select` : "settings-theme-select", _v$16 = cx(SettingsControls_module_default.label, local.compact && SettingsControls_module_default.compactLabel), _v$17 = cx(SettingsControls_module_default.setting, local.compact && SettingsControls_module_default.settingCompact), _v$18 = local["data-testid"] ? `${local["data-testid"]}-language-label` : "settings-language-label", _v$19 = local["data-testid"] ? `${local["data-testid"]}-language-select` : "settings-language-select", _v$20 = cx(SettingsControls_module_default.label, local.compact && SettingsControls_module_default.compactLabel);
				_v$11 !== _p$.e && className(_el$, _p$.e = _v$11);
				_v$12 !== _p$.t && setAttribute(_el$, "data-testid", _p$.t = _v$12);
				_v$13 !== _p$.a && className(_el$2, _p$.a = _v$13);
				_v$14 !== _p$.o && setAttribute(_el$3, "id", _p$.o = _v$14);
				_v$15 !== _p$.i && setAttribute(_el$3, "for", _p$.i = _v$15);
				_v$16 !== _p$.n && className(_el$3, _p$.n = _v$16);
				_v$17 !== _p$.s && className(_el$5, _p$.s = _v$17);
				_v$18 !== _p$.h && setAttribute(_el$6, "id", _p$.h = _v$18);
				_v$19 !== _p$.r && setAttribute(_el$6, "for", _p$.r = _v$19);
				_v$20 !== _p$.d && className(_el$6, _p$.d = _v$20);
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
				d: void 0
			});
			return _el$;
		})();
	}
	//#endregion
	//#region src/shared/utils/events/wheel-scroll-guard.ts
	/**
	* Finds the nearest scrollable ancestor element matching the given selector.
	*
	* @param target - The event target or element to start searching from
	* @param scrollableSelector - CSS selector for scrollable containers
	* @returns The nearest matching HTMLElement or null if not found
	* @internal
	*/
	function findScrollableAncestor(target, scrollableSelector) {
		if (!(target instanceof HTMLElement)) return null;
		return target.closest(scrollableSelector);
	}
	/**
	* Determines whether a scrollable element can consume a wheel scroll event.
	*
	* @param element - The scrollable element to check
	* @param deltaY - The wheel event's vertical scroll delta
	* @param tolerance - Pixel tolerance for boundary detection
	* @returns True if the element can consume the scroll in the given direction
	* @internal
	*/
	function canConsumeWheelEvent(element, deltaY, tolerance = 1) {
		const overflow = element.scrollHeight - element.clientHeight;
		if (overflow <= tolerance) return false;
		if (deltaY < 0) return element.scrollTop > tolerance;
		if (deltaY > 0) return element.scrollTop < overflow - tolerance;
		return true;
	}
	/**
	* Determines if the browser's default wheel behavior should be allowed
	*
	* Returns true when a nested scrollable element can consume the scroll event,
	* preventing the default browser scrolling behavior from propagating further.
	*
	* @param event - The WheelEvent to evaluate
	* @param options - Configuration for scroll guard behavior
	* @returns True if default wheel behavior should be allowed
	*/
	function shouldAllowWheelDefault$1(event, options) {
		const scrollable = findScrollableAncestor(event.target, options.scrollableSelector);
		if (!scrollable) return false;
		return canConsumeWheelEvent(scrollable, event.deltaY, options.tolerance);
	}
	var Toolbar_module_default = {
		toolbarButton: "xg-4eoj",
		galleryToolbar: "xg-fLg7",
		settingsExpanded: "xg-ZpP8",
		tweetPanelExpanded: "xg-t4eq",
		stateIdle: "xg-ojCW",
		stateLoading: "xg-Y6KF",
		stateDownloading: "xg-n-ab",
		stateError: "xg-bEzl",
		toolbarContent: "xg-f8g4",
		toolbarControls: "xg-Ix3j",
		counterBlock: "xg-0EHq",
		separator: "xg-FKnO",
		downloadButton: "xg-atmJ",
		mediaCounterWrapper: "xg-GG86",
		mediaCounter: "xg-2cjm",
		currentIndex: "xg-JEXm",
		totalCount: "xg-d1et",
		progressBar: "xg-vB6N",
		progressFill: "xg-LWQw",
		fitButton: "xg-Q7dU",
		closeButton: "xg-Vn14",
		settingsPanel: "xg-JcF-",
		tweetPanel: "xg-yRtv",
		panelExpanded: "xg-4a2L",
		tweetUrlLink: "xg-AVKe",
		tweetContent: "xg-jmjG",
		tweetPanelBody: "xg-w56C",
		tweetTextHeader: "xg-rSWg",
		tweetTextLabel: "xg-jd-V",
		tweetUrlSection: "xg-0Eeq",
		tweetUrlIcon: "xg-5RjR",
		tweetUrlLabel: "xg-8Stf",
		tweetUrlValue: "xg-3pwZ",
		tweetUrlDivider: "xg-sltl"
	};
	//#endregion
	//#region src/shared/components/ui/Toolbar/TweetTextPanel.tsx
	var _tmpl$$5 = /*#__PURE__*/ template(`<a target=_blank rel="noopener noreferrer">`);
	var _tmpl$2$2 = /*#__PURE__*/ template(`<div><a target=_blank rel="noopener noreferrer"><span></span><span>`);
	var _tmpl$3 = /*#__PURE__*/ template(`<div><div><span></div><div data-gallery-scrollable=true><span>`);
	var _tmpl$4 = /*#__PURE__*/ template(`<div>`);
	/**
	* URL safety policy for tweet text links
	*/
	var TWEET_TEXT_URL_POLICY = {
		allowedProtocols: /* @__PURE__ */ new Set(["http:", "https:"]),
		allowRelative: false,
		allowProtocolRelative: false,
		allowFragments: false,
		allowDataUrls: false
	};
	/**
	* Pattern to match URLs and hashtags in tweet text
	*/
	var LINK_PATTERN = /https?:\/\/[^\s]+|(?<![\p{L}\p{N}_])#[\p{L}\p{N}_]+/gu;
	/**
	* Pattern to match trailing punctuation in URLs
	*/
	var URL_TRAILING_PUNCTUATION = /[),.!?:;\]]+$/;
	/**
	* Pattern to match protocol prefix in URLs
	*/
	var PROTOCOL_PREFIX = /^https?:\/\//;
	/**
	* Builds a Twitter/X.com hashtag URL
	* @param tag - Hashtag text without the # symbol
	* @returns Full URL to the hashtag page
	*/
	var buildHashtagUrl = (tag) => `https://x.com/hashtag/${encodeURIComponent(tag)}`;
	/**
	* Splits trailing punctuation from a URL
	* @param value - URL string that may contain trailing punctuation
	* @returns Object with separated url and trailing punctuation
	*/
	var splitUrlTrailingPunctuation = (value) => {
		const match = value.match(URL_TRAILING_PUNCTUATION);
		if (!match) return {
			url: value,
			trailing: ""
		};
		const trailing = match[0] ?? "";
		return {
			url: value.slice(0, Math.max(0, value.length - trailing.length)),
			trailing
		};
	};
	/**
	* Tokenizes tweet text into structured segments (text, URLs, hashtags)
	* @param input - Raw tweet text
	* @returns Array of tokens representing different text segments
	*/
	var tokenizeTweetText = (input) => {
		const tokens = [];
		let lastIndex = 0;
		for (const match of input.matchAll(LINK_PATTERN)) {
			const startIndex = match.index ?? 0;
			const rawMatch = match[0] ?? "";
			if (startIndex > lastIndex) tokens.push({
				type: "text",
				value: input.slice(lastIndex, startIndex)
			});
			if (rawMatch.startsWith("http://") || rawMatch.startsWith("https://")) {
				const { url, trailing } = splitUrlTrailingPunctuation(rawMatch);
				if (url && isUrlAllowed(url, TWEET_TEXT_URL_POLICY)) {
					tokens.push({
						type: "url",
						value: url,
						href: url
					});
					if (trailing) tokens.push({
						type: "text",
						value: trailing
					});
				} else tokens.push({
					type: "text",
					value: rawMatch
				});
			} else if (rawMatch.startsWith("#")) {
				const tag = rawMatch.slice(1);
				if (tag) tokens.push({
					type: "hashtag",
					value: rawMatch,
					href: buildHashtagUrl(tag)
				});
				else tokens.push({
					type: "text",
					value: rawMatch
				});
			} else tokens.push({
				type: "text",
				value: rawMatch
			});
			lastIndex = startIndex + rawMatch.length;
		}
		if (lastIndex < input.length) tokens.push({
			type: "text",
			value: input.slice(lastIndex)
		});
		return tokens;
	};
	/**
	* Normalizes and validates a tweet URL
	* @param value - Raw tweet URL string
	* @returns Validated URL string or null if invalid
	*/
	var normalizeTweetUrl = (value) => {
		const trimmed = value?.trim();
		return trimmed && isUrlAllowed(trimmed, TWEET_TEXT_URL_POLICY) ? trimmed : null;
	};
	/**
	* Formats a tweet URL for display by removing protocol prefix
	* @param url - Full URL string
	* @returns URL without http:// or https:// prefix
	*/
	var formatTweetUrlLabel = (url) => url.replace(PROTOCOL_PREFIX, "");
	/**
	* Renders tweet tokens as JSX elements with proper links
	* @param tokens - Array of tweet tokens
	* @param translate - Translation function
	* @returns JSX element array
	*/
	var renderTweetTokens = (tokens, translate) => tokens.map((token) => {
		if ((token.type === "url" || token.type === "hashtag") && token.href) {
			const label = token.type === "hashtag" ? translate("msg.gal.hashtagLabel", { value: token.value }) : token.value;
			return (() => {
				var _el$ = _tmpl$$5();
				setAttribute(_el$, "aria-label", label);
				insert(_el$, () => token.value);
				createRenderEffect(() => setAttribute(_el$, "href", token.href));
				return _el$;
			})();
		}
		return token.value;
	});
	/**
	* Tweet URL link component
	*/
	function TweetUrlLink(props) {
		const t = props.translate;
		return (() => {
			var _el$2 = _tmpl$2$2(), _el$3 = _el$2.firstChild, _el$4 = _el$3.firstChild, _el$5 = _el$4.nextSibling;
			insert(_el$3, createComponent(LucideIcon, {
				name: "external-link",
				size: 14,
				get ["class"]() {
					return Toolbar_module_default.tweetUrlIcon;
				}
			}), _el$4);
			insert(_el$4, () => t("tb.twUrl"));
			insert(_el$5, () => props.label);
			createRenderEffect((_p$) => {
				var _v$ = Toolbar_module_default.tweetUrlSection, _v$2 = props.url, _v$3 = Toolbar_module_default.tweetUrlLink, _v$4 = props.label, _v$5 = Toolbar_module_default.tweetUrlLabel, _v$6 = Toolbar_module_default.tweetUrlValue;
				_v$ !== _p$.e && className(_el$2, _p$.e = _v$);
				_v$2 !== _p$.t && setAttribute(_el$3, "href", _p$.t = _v$2);
				_v$3 !== _p$.a && className(_el$3, _p$.a = _v$3);
				_v$4 !== _p$.o && setAttribute(_el$3, "aria-label", _p$.o = _v$4);
				_v$5 !== _p$.i && className(_el$4, _p$.i = _v$5);
				_v$6 !== _p$.n && className(_el$5, _p$.n = _v$6);
				return _p$;
			}, {
				e: void 0,
				t: void 0,
				a: void 0,
				o: void 0,
				i: void 0,
				n: void 0
			});
			return _el$2;
		})();
	}
	/**
	* TweetTextPanel component - Displays tweet text with parsed links and hashtags
	* @param props - Component props
	* @returns JSX element
	*/
	function TweetTextPanel(props) {
		const [local] = splitProps(props, [
			"tweetText",
			"tweetTextContent",
			"tweetUrl"
		]);
		const translate = useTranslation();
		const tweetText = local.tweetTextContent ?? local.tweetText ?? "";
		const tokens = tweetText ? tokenizeTweetText(tweetText) : [];
		const safeTweetUrl = normalizeTweetUrl(local.tweetUrl);
		const tweetUrlLabel = safeTweetUrl ? formatTweetUrlLabel(safeTweetUrl) : "";
		return (() => {
			var _el$6 = _tmpl$3(), _el$7 = _el$6.firstChild, _el$8 = _el$7.firstChild, _el$9 = _el$7.nextSibling, _el$0 = _el$9.firstChild;
			insert(_el$8, () => translate("tb.twTxt"));
			insert(_el$9, safeTweetUrl && createComponent(TweetUrlLink, {
				url: safeTweetUrl,
				label: tweetUrlLabel,
				translate
			}), _el$0);
			insert(_el$9, (() => {
				var _c$ = memo(() => !!(safeTweetUrl && tokens.length > 0));
				return () => _c$() && (() => {
					var _el$1 = _tmpl$4();
					createRenderEffect(() => className(_el$1, Toolbar_module_default.tweetUrlDivider));
					return _el$1;
				})();
			})(), _el$0);
			insert(_el$0, () => renderTweetTokens(tokens, translate));
			createRenderEffect((_p$) => {
				var _v$7 = Toolbar_module_default.tweetPanelBody, _v$8 = Toolbar_module_default.tweetTextHeader, _v$9 = Toolbar_module_default.tweetTextLabel, _v$0 = Toolbar_module_default.tweetContent;
				_v$7 !== _p$.e && className(_el$6, _p$.e = _v$7);
				_v$8 !== _p$.t && className(_el$7, _p$.t = _v$8);
				_v$9 !== _p$.a && className(_el$8, _p$.a = _v$9);
				_v$0 !== _p$.o && className(_el$9, _p$.o = _v$0);
				return _p$;
			}, {
				e: void 0,
				t: void 0,
				a: void 0,
				o: void 0
			});
			return _el$6;
		})();
	}
	//#endregion
	//#region src/shared/components/ui/Toolbar/ToolbarView.tsx
	var _tmpl$$4 = /*#__PURE__*/ template(`<div data-gallery-element=toolbar><div><div><div><div><span id=xeg-toolbar-counter aria-live=polite><span></span><span>/</span><span></span></span><div role=progressbar aria-valuemin=1 aria-labelledby=xeg-toolbar-counter><div></div></div></div></div></div></div><div id=toolbar-settings-panel data-gallery-scrollable=true role=region aria-labelledby=settings-button data-gallery-element=settings-panel></div><div id=toolbar-tweet-panel role=region aria-labelledby=tweet-text-button data-gallery-element=tweet-panel>`);
	var SCROLLABLE_SELECTOR = "[data-gallery-scrollable=\"true\"]";
	var SCROLL_LOCK_TOLERANCE = 1;
	var shouldAllowWheelDefault = (event) => {
		return shouldAllowWheelDefault$1(event, {
			scrollableSelector: SCROLLABLE_SELECTOR,
			tolerance: SCROLL_LOCK_TOLERANCE
		});
	};
	function ToolbarView(props) {
		const [local] = splitProps(props, [
			"totalCount",
			"currentIndex",
			"disabled",
			"currentFitMode",
			"tweetText",
			"tweetTextContent",
			"tweetUrl",
			"fitModeLabels",
			"fitModeOrder",
			"role",
			"tabIndex",
			"onFocus",
			"onBlur",
			"navState",
			"displayedIndex",
			"progressWidth",
			"toolbarClass",
			"toolbarDataState",
			"activeFitMode",
			"handleFitModeClick",
			"isFitDisabled",
			"onPreviousClick",
			"onNextClick",
			"onDownloadCurrent",
			"onDownloadAll",
			"onCloseClick",
			"settingsController",
			"showSettingsButton",
			"isTweetPanelExpanded",
			"toggleTweetPanelExpanded",
			"aria-label",
			"aria-describedby",
			"data-testid"
		]);
		const totalCount = createMemo(() => local.totalCount);
		const currentIndex = createMemo(() => local.currentIndex);
		const isToolbarDisabled = createMemo(() => local.disabled);
		const activeFitMode = createMemo(() => local.currentFitMode);
		const tweetText = createMemo(() => local.tweetText);
		const tweetTextContent = createMemo(() => local.tweetTextContent);
		const tweetUrl = createMemo(() => local.tweetUrl);
		const [toolbarElement, setToolbarElement] = createSignal(null);
		const [counterElement, setCounterElement] = createSignal(null);
		const [settingsPanelEl, setSettingsPanelEl] = createSignal(null);
		const [tweetPanelEl, setTweetPanelEl] = createSignal(null);
		const translate = useTranslation();
		const nav = createMemo(() => local.navState());
		const fitModeLabels = () => local.fitModeLabels;
		const assignToolbarRef = (element) => {
			setToolbarElement(element);
			local.settingsController.assignToolbarRef(element);
		};
		const assignSettingsPanelRef = (element) => {
			setSettingsPanelEl(element);
			local.settingsController.assignSettingsPanelRef(element);
		};
		createEffect(() => {
			const toolbar = toolbarElement();
			const counter = counterElement();
			if (!toolbar && !counter) return;
			const current = String(currentIndex());
			const focused = String(local.displayedIndex());
			if (toolbar) {
				toolbar.dataset.currentIndex = current;
				toolbar.dataset.focusedIndex = focused;
			}
			if (counter) {
				counter.dataset.currentIndex = current;
				counter.dataset.focusedIndex = focused;
			}
		});
		const hasTweetContent = () => !!(tweetTextContent() ?? tweetText() ?? tweetUrl());
		const toolbarButtonClass = (...extra) => cx(Toolbar_module_default.toolbarButton, "xeg-inline-center", ...extra);
		const toolbarStateClass = () => {
			switch (local.toolbarDataState()) {
				case "loading": return Toolbar_module_default.stateLoading;
				case "downloading": return Toolbar_module_default.stateDownloading;
				case "error": return Toolbar_module_default.stateError;
				default: return Toolbar_module_default.stateIdle;
			}
		};
		/**
		* Handle wheel events within toolbar panels.
		* - If inside a scrollable element (e.g., tweet text): consume scroll internally, stop propagation
		* - Otherwise: let event propagate to gallery (which may hide toolbar on scroll)
		*/
		const handlePanelWheel = (event) => {
			if (!shouldAllowWheelDefault(event)) return;
			event.stopPropagation();
		};
		/**
		* Prevent scroll chaining from toolbar buttons/controls.
		* - If the scroll can be consumed by a nested scrollable: stop propagation only
		*   (the gallery's own wheel handler will still see the event).
		* - Otherwise: prevent default browser scroll + stop propagation.
		* Note: stopImmediatePropagation is intentionally NOT used here — the gallery's
		* wheel redirect handler on the container may still need to see this event.
		*/
		const preventScrollChaining = (event) => {
			if (shouldAllowWheelDefault(event)) {
				event.stopPropagation();
				return;
			}
			event.preventDefault();
			event.stopPropagation();
		};
		const registerWheelListener = (getElement, handler, options) => {
			createEffect(() => {
				const element = getElement();
				if (!element) return;
				const controller = new AbortController();
				const eventManager = getEventManager();
				const listener = (event) => handler(event);
				eventManager.addEventListener(element, "wheel", listener, {
					passive: options.passive,
					signal: controller.signal,
					context: options.context
				});
				onCleanup(() => {
					controller.abort();
					eventManager.removeByContext(options.context);
				});
			});
		};
		registerWheelListener(toolbarElement, preventScrollChaining, {
			passive: false,
			context: "toolbar:wheel:prevent-scroll-chaining"
		});
		registerWheelListener(settingsPanelEl, preventScrollChaining, {
			passive: false,
			context: "toolbar:wheel:prevent-scroll-chaining:settings-panel"
		});
		registerWheelListener(tweetPanelEl, handlePanelWheel, {
			passive: true,
			context: "toolbar:wheel:panel"
		});
		return (() => {
			var _el$ = _tmpl$$4(), _el$2 = _el$.firstChild, _el$3 = _el$2.firstChild, _el$4 = _el$3.firstChild, _el$5 = _el$4.firstChild, _el$6 = _el$5.firstChild, _el$7 = _el$6.firstChild, _el$8 = _el$7.nextSibling, _el$9 = _el$8.nextSibling, _el$0 = _el$6.nextSibling, _el$1 = _el$0.firstChild, _el$10 = _el$2.nextSibling, _el$11 = _el$10.nextSibling;
			_el$.$$keydown = (event) => local.settingsController.handleToolbarKeyDown(event);
			addEventListener(_el$, "blur", local.onBlur);
			addEventListener(_el$, "focus", local.onFocus);
			use(assignToolbarRef, _el$);
			insert(_el$3, createComponent(IconButton, {
				get ["class"]() {
					return toolbarButtonClass();
				},
				size: "toolbar",
				get ["aria-label"]() {
					return translate("tb.prev");
				},
				get tooltip() {
					return translate("tb.prev");
				},
				get disabled() {
					return nav().prevDisabled;
				},
				get onClick() {
					return local.onPreviousClick;
				},
				get children() {
					return createComponent(LucideIcon, {
						name: "chevron-left",
						size: TOOLBAR_ICON_SIZE_VAR
					});
				}
			}), _el$4);
			insert(_el$3, createComponent(IconButton, {
				get ["class"]() {
					return toolbarButtonClass();
				},
				size: "toolbar",
				get ["aria-label"]() {
					return translate("tb.next");
				},
				get tooltip() {
					return translate("tb.next");
				},
				get disabled() {
					return nav().nextDisabled;
				},
				get onClick() {
					return local.onNextClick;
				},
				get children() {
					return createComponent(LucideIcon, {
						name: "chevron-right",
						size: TOOLBAR_ICON_SIZE_VAR
					});
				}
			}), _el$4);
			use((element) => {
				setCounterElement(element);
			}, _el$6);
			insert(_el$7, () => local.displayedIndex() + 1);
			insert(_el$9, totalCount);
			insert(_el$3, () => local.fitModeOrder.map(({ mode, iconName }) => {
				const label = fitModeLabels()[mode];
				return createComponent(IconButton, {
					get ["class"]() {
						return toolbarButtonClass(Toolbar_module_default.fitButton);
					},
					size: "toolbar",
					get onClick() {
						return local.handleFitModeClick(mode);
					},
					get disabled() {
						return local.isFitDisabled(mode);
					},
					get ["aria-label"]() {
						return label.label;
					},
					get tooltip() {
						return label.title;
					},
					get ["aria-pressed"]() {
						return activeFitMode() === mode;
					},
					get children() {
						return createComponent(LucideIcon, {
							name: iconName,
							size: TOOLBAR_ICON_SIZE_VAR
						});
					}
				});
			}), null);
			insert(_el$3, createComponent(IconButton, {
				get ["class"]() {
					return toolbarButtonClass(Toolbar_module_default.downloadButton, Toolbar_module_default.downloadCurrent);
				},
				size: "toolbar",
				get onClick() {
					return local.onDownloadCurrent;
				},
				get disabled() {
					return nav().downloadDisabled;
				},
				get ["aria-label"]() {
					return translate("tb.dl");
				},
				get tooltip() {
					return translate("tb.dl");
				},
				get children() {
					return createComponent(LucideIcon, {
						name: "download",
						size: TOOLBAR_ICON_SIZE_VAR
					});
				}
			}), null);
			insert(_el$3, (() => {
				var _c$ = memo(() => !!nav().canDownloadAll);
				return () => _c$() && createComponent(IconButton, {
					get ["class"]() {
						return toolbarButtonClass(Toolbar_module_default.downloadButton, Toolbar_module_default.downloadAll);
					},
					size: "toolbar",
					get onClick() {
						return local.onDownloadAll;
					},
					get disabled() {
						return nav().downloadDisabled;
					},
					get ["aria-label"]() {
						return translate("tb.dlAllCt", { count: totalCount() });
					},
					get tooltip() {
						return translate("tb.dlAllCt", { count: totalCount() });
					},
					get children() {
						return createComponent(LucideIcon, {
							name: "folder-down",
							size: "var(--xeg-toolbar-icon-size)"
						});
					}
				});
			})(), null);
			insert(_el$3, (() => {
				var _c$2 = memo(() => !!local.showSettingsButton);
				return () => _c$2() && createComponent(IconButton, {
					ref(r$) {
						var _ref$ = local.settingsController.assignSettingsButtonRef;
						typeof _ref$ === "function" ? _ref$(r$) : local.settingsController.assignSettingsButtonRef = r$;
					},
					id: "settings-button",
					get ["class"]() {
						return toolbarButtonClass();
					},
					size: "toolbar",
					get ["aria-label"]() {
						return translate("tb.setOpen");
					},
					get ["aria-expanded"]() {
						return local.settingsController.isSettingsExpanded() ? "true" : "false";
					},
					"aria-controls": "toolbar-settings-panel",
					get tooltip() {
						return translate("tb.setOpen");
					},
					get disabled() {
						return isToolbarDisabled();
					},
					get onMouseDown() {
						return local.settingsController.handleSettingsMouseDown;
					},
					get onClick() {
						return local.settingsController.handleSettingsClick;
					},
					get children() {
						return createComponent(LucideIcon, {
							name: "settings-2",
							size: "var(--xeg-toolbar-icon-size)"
						});
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
						return translate("tb.twTxt");
					},
					get ["aria-expanded"]() {
						return local.isTweetPanelExpanded() ? "true" : "false";
					},
					"aria-controls": "toolbar-tweet-panel",
					get tooltip() {
						return translate("tb.twTxt");
					},
					get disabled() {
						return isToolbarDisabled();
					},
					get onClick() {
						return local.toggleTweetPanelExpanded;
					},
					get children() {
						return createComponent(LucideIcon, {
							name: "messages-square",
							size: "var(--xeg-toolbar-icon-size)"
						});
					}
				});
			})(), null);
			insert(_el$3, createComponent(IconButton, {
				get ["class"]() {
					return toolbarButtonClass(Toolbar_module_default.closeButton);
				},
				size: "toolbar",
				get ["aria-label"]() {
					return translate("tb.cls");
				},
				get tooltip() {
					return translate("tb.cls");
				},
				get disabled() {
					return isToolbarDisabled();
				},
				get onClick() {
					return local.onCloseClick;
				},
				get children() {
					return createComponent(LucideIcon, {
						name: "x",
						size: TOOLBAR_ICON_SIZE_VAR
					});
				}
			}), null);
			addEventListener(_el$10, "click", local.settingsController.handlePanelClick, true);
			addEventListener(_el$10, "mousedown", local.settingsController.handlePanelMouseDown, true);
			use(assignSettingsPanelRef, _el$10);
			insert(_el$10, createComponent(Show, {
				get when() {
					return local.settingsController.isSettingsExpanded();
				},
				get children() {
					return createComponent(SettingsControls, {
						get currentTheme() {
							return local.settingsController.currentTheme;
						},
						get currentLanguage() {
							return local.settingsController.currentLanguage;
						},
						get onThemeChange() {
							return local.settingsController.handleThemeChange;
						},
						get onLanguageChange() {
							return local.settingsController.handleLanguageChange;
						},
						compact: true,
						"data-testid": void 0
					});
				}
			}));
			use(setTweetPanelEl, _el$11);
			insert(_el$11, createComponent(Show, {
				get when() {
					return memo(() => !!local.isTweetPanelExpanded())() && hasTweetContent();
				},
				get children() {
					return createComponent(TweetTextPanel, {
						get tweetText() {
							return tweetText() ?? void 0;
						},
						get tweetTextContent() {
							return tweetTextContent() ?? void 0;
						},
						get tweetUrl() {
							return tweetUrl() ?? void 0;
						}
					});
				}
			}));
			createRenderEffect((_p$) => {
				var _v$ = cx(local.toolbarClass(), toolbarStateClass(), local.settingsController.isSettingsExpanded() ? Toolbar_module_default.settingsExpanded : void 0, local.isTweetPanelExpanded() ? Toolbar_module_default.tweetPanelExpanded : void 0), _v$2 = local.role ?? "toolbar", _v$3 = local["aria-label"] ?? translate("tb.galleryToolbar"), _v$4 = local["aria-describedby"], _v$5 = isToolbarDisabled(), _v$6 = void 0, _v$7 = local.tabIndex, _v$8 = cx(Toolbar_module_default.toolbarContent, "xeg-row-center"), _v$9 = Toolbar_module_default.toolbarControls, _v$0 = Toolbar_module_default.counterBlock, _v$1 = cx(Toolbar_module_default.mediaCounterWrapper, "xeg-inline-center"), _v$10 = cx(Toolbar_module_default.mediaCounter, "xeg-inline-center"), _v$11 = Toolbar_module_default.currentIndex, _v$12 = Toolbar_module_default.separator, _v$13 = Toolbar_module_default.totalCount, _v$14 = Toolbar_module_default.progressBar, _v$15 = translate("tb.progress"), _v$16 = local.displayedIndex() + 1, _v$17 = totalCount(), _v$18 = Toolbar_module_default.progressFill, _v$19 = local.progressWidth(), _v$20 = cx(Toolbar_module_default.settingsPanel, local.settingsController.isSettingsExpanded() ? Toolbar_module_default.panelExpanded : void 0), _v$21 = translate("tb.settingsPanel"), _v$22 = cx(Toolbar_module_default.tweetPanel, local.isTweetPanelExpanded() ? Toolbar_module_default.panelExpanded : void 0), _v$23 = translate("tb.twPanel");
				_v$ !== _p$.e && className(_el$, _p$.e = _v$);
				_v$2 !== _p$.t && setAttribute(_el$, "role", _p$.t = _v$2);
				_v$3 !== _p$.a && setAttribute(_el$, "aria-label", _p$.a = _v$3);
				_v$4 !== _p$.o && setAttribute(_el$, "aria-describedby", _p$.o = _v$4);
				_v$5 !== _p$.i && setAttribute(_el$, "aria-disabled", _p$.i = _v$5);
				_v$6 !== _p$.n && setAttribute(_el$, "data-testid", _p$.n = _v$6);
				_v$7 !== _p$.s && setAttribute(_el$, "tabindex", _p$.s = _v$7);
				_v$8 !== _p$.h && className(_el$2, _p$.h = _v$8);
				_v$9 !== _p$.r && className(_el$3, _p$.r = _v$9);
				_v$0 !== _p$.d && className(_el$4, _p$.d = _v$0);
				_v$1 !== _p$.l && className(_el$5, _p$.l = _v$1);
				_v$10 !== _p$.u && className(_el$6, _p$.u = _v$10);
				_v$11 !== _p$.c && className(_el$7, _p$.c = _v$11);
				_v$12 !== _p$.w && className(_el$8, _p$.w = _v$12);
				_v$13 !== _p$.m && className(_el$9, _p$.m = _v$13);
				_v$14 !== _p$.f && className(_el$0, _p$.f = _v$14);
				_v$15 !== _p$.y && setAttribute(_el$0, "aria-label", _p$.y = _v$15);
				_v$16 !== _p$.g && setAttribute(_el$0, "aria-valuenow", _p$.g = _v$16);
				_v$17 !== _p$.p && setAttribute(_el$0, "aria-valuemax", _p$.p = _v$17);
				_v$18 !== _p$.b && className(_el$1, _p$.b = _v$18);
				_v$19 !== _p$.T && setStyleProperty(_el$1, "width", _p$.T = _v$19);
				_v$20 !== _p$.A && className(_el$10, _p$.A = _v$20);
				_v$21 !== _p$.O && setAttribute(_el$10, "aria-label", _p$.O = _v$21);
				_v$22 !== _p$.I && className(_el$11, _p$.I = _v$22);
				_v$23 !== _p$.S && setAttribute(_el$11, "aria-label", _p$.S = _v$23);
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
				S: void 0
			});
			return _el$;
		})();
	}
	delegateEvents([
		"keydown",
		"mousedown",
		"click"
	]);
	//#endregion
	//#region src/shared/dom/theme.ts
	/**
	* @fileoverview Theme DOM helpers
	* @description Keep theme-related data attributes in sync across document root and XEG scopes.
	*/
	var THEME_DOM_ATTRIBUTE = "data-theme";
	/**
	* Synchronize data-theme attribute for gallery theme scopes.
	* Updates XEG theme scope elements and optionally document root.
	* Mutates DOM — by-design side effect for a DOM utility function.
	* @param theme - Target theme name ('light' or 'dark')
	* @param options - Optional configuration for scope and root element handling
	*/
	function syncThemeAttributes(theme, options = {}) {
		if (typeof document === "undefined") return;
		const { scopes, includeDocumentRoot = false } = options;
		if (includeDocumentRoot && document.documentElement) document.documentElement.setAttribute(THEME_DOM_ATTRIBUTE, theme);
		const targets = scopes ?? document.querySelectorAll(".xeg-theme-scope");
		for (const target of Array.from(targets)) if (target instanceof HTMLElement) target.setAttribute(THEME_DOM_ATTRIBUTE, theme);
	}
	//#endregion
	//#region src/shared/services/theme-service.ts
	/**
	* @fileoverview Theme service: system theme detection and application
	*/
	var VALID_THEME_SETTINGS = [
		"light",
		"dark",
		"auto"
	];
	function isThemeSetting(value) {
		return typeof value === "string" && VALID_THEME_SETTINGS.includes(value);
	}
	var ThemeService = class {
		_initialized = false;
		currentTheme = "light";
		themeSetting = "auto";
		listeners = /* @__PURE__ */ new Set();
		settings = null;
		observedThemeScopes = /* @__PURE__ */ new WeakSet();
		mediaQueryList = null;
		mediaQueryListener = null;
		domEventsController = null;
		observer = null;
		constructor() {
			this.mediaQueryList = typeof window !== "undefined" && typeof window.matchMedia === "function" ? window.matchMedia("(prefers-color-scheme: dark)") : null;
		}
		async initialize() {
			if (this._initialized) return;
			const svc = tryGetSettings();
			if (svc) this.settings = {
				get: (key) => svc.get(key),
				set: (key, value) => svc.set(key, value)
			};
			if (!this.mediaQueryList) this.mediaQueryList = typeof window !== "undefined" && typeof window.matchMedia === "function" ? window.matchMedia("(prefers-color-scheme: dark)") : null;
			if (this.settings) {
				const stored = this.settings.get("gallery.theme");
				if (isThemeSetting(stored) && stored !== this.themeSetting) this.themeSetting = stored;
			}
			this.initializeThemeScopeObservation();
			this.initializeSystemDetection();
			this.applyCurrentTheme(true);
			this._initialized = true;
		}
		destroy() {
			this.cleanup();
			this._initialized = false;
		}
		isInitialized() {
			return this._initialized;
		}
		bindSettingsService(svc) {
			if (!svc || this.settings === svc) return;
			this.settings = svc;
			const settingsTheme = svc.get("gallery.theme");
			if (isThemeSetting(settingsTheme) && settingsTheme !== this.themeSetting) {
				this.themeSetting = settingsTheme;
				this.applyCurrentTheme(true);
			}
		}
		setTheme(setting, options) {
			const normalized = isThemeSetting(setting) ? setting : "light";
			this.themeSetting = normalized;
			if (options?.persist !== false && this.settings) {
				const result = this.settings.set("gallery.theme", this.themeSetting);
				if (result instanceof Promise) result.catch((error) => {});
			}
			this.applyCurrentTheme(options?.force);
			this.notifyListeners();
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
		applyThemeToScopes(scopes) {
			const newScopes = [];
			for (const scope of scopes) if (!this.observedThemeScopes.has(scope)) {
				this.observedThemeScopes.add(scope);
				newScopes.push(scope);
			}
			if (newScopes.length > 0) syncThemeAttributes(this.currentTheme, { scopes: newScopes });
		}
		initializeThemeScopeObservation() {
			if (typeof document === "undefined" || typeof MutationObserver === "undefined") return;
			this.applyThemeToScopes(Array.from(document.querySelectorAll(".xeg-theme-scope")));
			this.observer?.disconnect();
			this.observer = new MutationObserver((mutations) => {
				for (const mutation of mutations) {
					if (mutation.addedNodes.length === 0) continue;
					mutation.addedNodes.forEach((node) => {
						if (!(node instanceof Element)) return;
						if (node.classList.contains("xeg-theme-scope")) {
							this.applyThemeToScopes([node]);
							return;
						}
						if (node.querySelectorAll) {
							const scopes = node.querySelectorAll(".xeg-theme-scope");
							if (scopes.length > 0) this.applyThemeToScopes(Array.from(scopes));
						}
					});
				}
			});
			if (document.body) this.observer.observe(document.body, {
				childList: true,
				subtree: true
			});
		}
		cleanup() {
			this.settings = null;
			this.listeners.clear();
			this.observedThemeScopes = /* @__PURE__ */ new WeakSet();
			this.observer?.disconnect();
			this.observer = null;
			getEventManager().removeByContext("theme-service");
			this.domEventsController?.abort();
			this.domEventsController = null;
			this.mediaQueryListener = null;
		}
		initializeSystemDetection() {
			if (!this.mediaQueryList) return;
			if (this.mediaQueryListener) return;
			if (!this.domEventsController || this.domEventsController.signal.aborted) this.domEventsController = new AbortController();
			this.mediaQueryListener = () => {
				if (this.themeSetting === "auto") this.applyCurrentTheme(true);
			};
			getEventManager().addEventListener(this.mediaQueryList, "change", (event) => this.mediaQueryListener(event), {
				signal: this.domEventsController.signal,
				context: "theme-service"
			});
		}
		applyCurrentTheme(force = false) {
			const effective = this.getEffectiveTheme();
			if (force || this.currentTheme !== effective) {
				this.currentTheme = effective;
				syncThemeAttributes(this.currentTheme);
			}
		}
		notifyListeners() {
			for (const listener of this.listeners) try {
				listener(this.currentTheme, this.themeSetting);
			} catch (error) {}
		}
	};
	var { getInstance: getThemeService, resetForTests: resetThemeServiceForTests } = createSingleton(() => new ThemeService());
	//#endregion
	//#region src/shared/hooks/toolbar/use-toolbar-settings-controller.ts
	/**
	* @fileoverview Toolbar settings controller hook for settings panel management
	* @description Manages settings panel toggling, outside click handling, and localized options
	*/
	var DEFAULTS$1 = {
		FOCUS_DELAY_MS: 50,
		SELECT_GUARD_MS: 300
	};
	function useToolbarSettingsController(options) {
		/**
		* Settings panel management hook
		* Handles toggling, outside-click detection, theme/language selection, and focus management
		*/
		const { isSettingsExpanded, setSettingsExpanded, toggleSettingsExpanded, documentRef = typeof document !== "undefined" ? document : void 0, themeService: providedThemeService, languageService: providedLanguageService, focusDelayMs = DEFAULTS$1.FOCUS_DELAY_MS, selectChangeGuardMs = DEFAULTS$1.SELECT_GUARD_MS } = options;
		const themeManager = providedThemeService ?? getThemeService();
		const languageService = providedLanguageService ?? getLanguageService();
		const scheduleTimeout = (callback, delay) => {
			return setTimeout(callback, delay);
		};
		const clearScheduledTimeout = (handle) => {
			if (handle == null) return;
			clearTimeout(handle);
		};
		const [toolbarRef, setToolbarRef] = createSignal(void 0);
		const [settingsPanelRef, setSettingsPanelRef] = createSignal(void 0);
		const [settingsButtonRef, setSettingsButtonRef] = createSignal(void 0);
		const toThemeOption = (value) => {
			return value === "light" || value === "dark" ? value : "auto";
		};
		const getInitialTheme = () => {
			try {
				const currentSetting = themeManager.getCurrentTheme();
				return toThemeOption(currentSetting);
			} catch (error) {}
			return "auto";
		};
		const [currentTheme, setCurrentTheme] = createSignal(getInitialTheme());
		const [currentLanguage, setCurrentLanguage] = createSignal(languageService.getCurrentLanguage());
		const syncThemeFromService = () => {
			try {
				const setting = themeManager.getCurrentTheme();
				setCurrentTheme(toThemeOption(setting));
			} catch (error) {}
		};
		syncThemeFromService();
		if (typeof themeManager.isInitialized === "function" && !themeManager.isInitialized()) themeManager.initialize().then(syncThemeFromService).catch((error) => {});
		createEffect(() => {
			const unsubscribe = themeManager.onThemeChange((_theme, setting) => {
				setCurrentTheme(toThemeOption(setting));
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
			const eventManager = getEventManager();
			const listenerContext = `toolbar-settings-controller:${crypto.randomUUID()}`;
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
			Array.from(panel.querySelectorAll("select")).forEach((select) => {
				eventManager.addEventListener(select, "focus", handleSelectFocus, { context: listenerContext });
				eventManager.addEventListener(select, "blur", handleSelectBlur, { context: listenerContext });
				eventManager.addEventListener(select, "change", handleSelectChange, { context: listenerContext });
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
			eventManager.addEventListener(documentRef, "mousedown", handleOutsideClick, {
				capture: false,
				context: listenerContext
			});
			onCleanup(() => {
				clearScheduledTimeout(selectGuardTimeout);
				eventManager.removeByContext(listenerContext);
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
			const select = event.target;
			if (!select) return;
			const theme = toThemeOption(select.value);
			setCurrentTheme(theme);
			themeManager.setTheme(theme);
			try {
				const settingsService = tryGetSettings();
				if (settingsService) settingsService.set("gallery.theme", theme).catch((error) => {});
			} catch (error) {}
		};
		const handleLanguageChange = (event) => {
			const select = event.target;
			if (!select) return;
			const language = select.value || "auto";
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
	//#endregion
	//#region src/shared/hooks/use-toolbar-state.ts
	/**
	* @fileoverview Toolbar state management hook with download debouncing
	*/
	function useToolbarState() {
		const [isDownloading, setIsDownloading] = createSignal(false);
		const [isLoading, setIsLoading] = createSignal(false);
		const [hasError, setHasError] = createSignal(false);
		const [lastDownloadToggle, setLastDownloadToggle] = createSignal(0);
		const timer = createTimeout();
		const setDownloading = (downloading) => {
			const now = performance.now();
			if (downloading) {
				batch(() => {
					setLastDownloadToggle(now);
					timer.clear();
					setIsDownloading(true);
					setHasError(false);
				});
				return;
			}
			const timeSinceStart = now - lastDownloadToggle();
			if (timeSinceStart < 300) {
				timer.set(() => {
					setIsDownloading(false);
				}, 300 - timeSinceStart);
				return;
			}
			setIsDownloading(false);
		};
		const setLoading = (loading) => {
			setIsLoading(loading);
			if (loading) setHasError(false);
		};
		const setError = (errorState) => {
			batch(() => {
				setHasError(errorState);
				if (errorState) {
					setIsLoading(false);
					setIsDownloading(false);
				}
			});
		};
		const resetState = () => {
			timer.clear();
			batch(() => {
				setLastDownloadToggle(0);
				setIsDownloading(false);
				setIsLoading(false);
				setHasError(false);
			});
		};
		return [{
			isDownloading,
			isLoading,
			hasError
		}, {
			setDownloading,
			setLoading,
			setError,
			resetState
		}];
	}
	//#endregion
	//#region src/shared/components/ui/Toolbar/Toolbar.tsx
	var FIT_MODE_ORDER = [
		{
			mode: "original",
			iconName: "maximize-2"
		},
		{
			mode: "fitWidth",
			iconName: "move-horizontal"
		},
		{
			mode: "fitHeight",
			iconName: "move-vertical"
		},
		{
			mode: "fitContainer",
			iconName: "minimize-2"
		}
	];
	function getToolbarDataState(state) {
		if (state.hasError()) return "error";
		if (state.isDownloading()) return "downloading";
		if (state.isLoading()) return "loading";
		return "idle";
	}
	function stopEvent(event) {
		event.preventDefault();
		event.stopPropagation();
	}
	function Toolbar(rawProps) {
		const [local] = splitProps(rawProps, [
			"currentIndex",
			"totalCount",
			"focusedIndex",
			"isDownloading",
			"disabled",
			"className",
			"currentFitMode",
			"handlers",
			"tweetText",
			"tweetTextContent",
			"tweetUrl"
		]);
		const translate = useTranslation();
		const [toolbarState, toolbarActions] = useToolbarState();
		const [settingsExpandedSignal, setSettingsExpandedSignal] = createSignal(false);
		const [tweetExpanded, setTweetExpanded] = createSignal(false);
		const totalItems = () => Math.max(0, local.totalCount() ?? 0);
		const currentIndexForNav = () => clampIndex(local.currentIndex() ?? 0, totalItems());
		const displayedIndex = createMemo(() => {
			const total = totalItems();
			const currentIdx = currentIndexForNav();
			const focusIdx = local.focusedIndex?.() ?? null;
			if (total <= 0) return 0;
			if (typeof focusIdx === "number" && focusIdx >= 0 && focusIdx < total) return focusIdx;
			return currentIdx;
		});
		const progressWidth = createMemo(() => {
			const total = totalItems();
			const idx = displayedIndex();
			return total <= 0 ? "0%" : `${(idx + 1) / total * 100}%`;
		});
		const toolbarDataState = createMemo(() => getToolbarDataState(toolbarState));
		const navState = createMemo(() => {
			const total = totalItems();
			const hasItems = total > 0;
			const displayed = displayedIndex();
			const toolbarDisabled = local.disabled?.() ?? false;
			const downloadBusy = (local.isDownloading?.() ?? false) || toolbarState.isDownloading();
			return {
				prevDisabled: toolbarDisabled || !hasItems || displayed <= 0,
				nextDisabled: toolbarDisabled || !hasItems || displayed >= total - 1,
				canDownloadAll: total > 1,
				downloadDisabled: toolbarDisabled || downloadBusy || !hasItems,
				anyActionDisabled: toolbarDisabled
			};
		});
		const fitModeHandlers = () => ({
			original: local.handlers.fitMode?.onFitOriginal,
			fitWidth: local.handlers.fitMode?.onFitWidth,
			fitHeight: local.handlers.fitMode?.onFitHeight,
			fitContainer: local.handlers.fitMode?.onFitContainer
		});
		const fitModeLabels = createMemo(() => ({
			original: {
				label: translate("tb.fitOri"),
				title: translate("tb.fitOri")
			},
			fitWidth: {
				label: translate("tb.fitW"),
				title: translate("tb.fitW")
			},
			fitHeight: {
				label: translate("tb.fitH"),
				title: translate("tb.fitH")
			},
			fitContainer: {
				label: translate("tb.fitC"),
				title: translate("tb.fitC")
			}
		}));
		const activeFitMode = () => local.currentFitMode?.() ?? FIT_MODE_ORDER[0]?.mode ?? "original";
		createEffect(on(() => local.isDownloading?.() ?? false, (value) => toolbarActions.setDownloading(!!value)));
		const setSettingsExpanded = (expanded) => {
			setSettingsExpandedSignal(expanded);
			if (expanded) setTweetExpanded(false);
		};
		const toggleSettings = () => setSettingsExpanded(!settingsExpandedSignal());
		const toggleTweet = () => {
			setTweetExpanded((prev) => {
				if (!prev) setSettingsExpanded(false);
				return !prev;
			});
		};
		const isToolbarDisabled = () => !!(local.disabled?.() ?? false);
		const isFitDisabled = (mode) => {
			if (isToolbarDisabled()) return true;
			if (!fitModeHandlers()[mode]) return true;
			return activeFitMode() === mode;
		};
		const handleFitModeClick = (mode) => (event) => {
			stopEvent(event);
			if (!isToolbarDisabled()) fitModeHandlers()[mode]?.(event);
		};
		const guardedClick = (disabled, action) => (event) => {
			stopEvent(event);
			if (!disabled()) action?.();
		};
		const handleClose = (event) => {
			stopEvent(event);
			local.handlers.lifecycle.onClose();
		};
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
				if (!wasOpen && settingsExpandedSignal()) local.handlers.lifecycle.onOpenSettings?.();
			}
		};
		const toolbarClass = () => {
			const extra = local.className ? ` ${local.className}` : "";
			return `${Toolbar_module_default.toolbar} ${Toolbar_module_default.galleryToolbar}${extra}`;
		};
		return createComponent(ToolbarView, {
			get currentIndex() {
				return local.currentIndex() ?? 0;
			},
			get focusedIndex() {
				return local.focusedIndex?.() ?? null;
			},
			get totalCount() {
				return local.totalCount() ?? 0;
			},
			get isDownloading() {
				return local.isDownloading?.() ?? false;
			},
			get disabled() {
				return local.disabled?.() ?? false;
			},
			get currentFitMode() {
				return activeFitMode();
			},
			get tweetText() {
				return local.tweetText?.() ?? null;
			},
			get tweetTextContent() {
				return local.tweetTextContent?.() ?? null;
			},
			get tweetUrl() {
				return local.tweetUrl?.() ?? null;
			},
			toolbarClass,
			toolbarState,
			toolbarDataState,
			navState,
			displayedIndex,
			progressWidth,
			fitModeOrder: FIT_MODE_ORDER,
			get fitModeLabels() {
				return fitModeLabels();
			},
			activeFitMode,
			handleFitModeClick,
			isFitDisabled,
			get onPreviousClick() {
				return guardedClick(() => navState().prevDisabled, local.handlers.navigation.onPrevious);
			},
			get onNextClick() {
				return guardedClick(() => navState().nextDisabled, local.handlers.navigation.onNext);
			},
			get onDownloadCurrent() {
				return guardedClick(() => navState().downloadDisabled, local.handlers.download.onDownloadCurrent);
			},
			get onDownloadAll() {
				return guardedClick(() => navState().downloadDisabled, local.handlers.download.onDownloadAll);
			},
			onCloseClick: handleClose,
			settingsController,
			get showSettingsButton() {
				return typeof local.handlers.lifecycle.onOpenSettings === "function";
			},
			isTweetPanelExpanded: tweetExpanded,
			toggleTweetPanelExpanded: toggleTweet
		});
	}
	//#endregion
	//#region src/shared/utils/performance/preload.ts
	/**
	* Computes indices to preload around current item with bounds safety
	*/
	/** Maximum items to preload per direction (forward/backward). */
	var MAX_PRELOAD_PER_DIRECTION = 20;
	/**
	* Computes preload indices around current index
	*
	* @param currentIndex - Reference index (clamped to valid range)
	* @param total - Total items (must be positive finite)
	* @param count - Items to preload per direction (clamped to 0-20)
	* @returns Indices ordered by proximity (previous first, then next)
	*/
	function computePreloadIndices(currentIndex, total, count) {
		const safeTotal = Number.isFinite(total) && total > 0 ? Math.floor(total) : 0;
		if (safeTotal === 0) return [];
		const safeIndex = clampIndex(Math.floor(currentIndex), safeTotal);
		const safeCount = clamp(Math.floor(count), 0, MAX_PRELOAD_PER_DIRECTION);
		if (safeCount === 0) return [];
		const indices = [];
		for (let i = 1; i <= safeCount; i += 1) {
			const idx = safeIndex - i;
			if (idx >= 0) indices.push(idx);
			else break;
		}
		for (let i = 1; i <= safeCount; i += 1) {
			const idx = safeIndex + i;
			if (idx < safeTotal) indices.push(idx);
			else break;
		}
		return indices;
	}
	//#endregion
	//#region src/features/gallery/components/vertical-gallery-view/VerticalGalleryView.tsx
	/**
	* @fileoverview Vertical Gallery View Component (Solid.js)
	* @description Main gallery component rendering media items with vertical scrolling, state management,
	* toolbar visibility, keyboard navigation, and fit mode support via useVerticalGallery hook.
	*/
	var _tmpl$$3 = /*#__PURE__*/ template(`<div><div><h2></h2><p>`);
	var _tmpl$2$1 = /*#__PURE__*/ template(`<div><div aria-hidden=true></div><div role=toolbar></div><div role=list><div aria-hidden=true>`);
	function VerticalGalleryView(props) {
		const [local] = splitProps(props, [
			"onClose",
			"className",
			"onPrevious",
			"onNext",
			"onDownloadCurrent",
			"onDownloadAll"
		]);
		const handleClose = local.onClose ?? (() => {});
		const mediaItems = createMemo(() => gallerySignals.mediaItems);
		const currentIndex = createMemo(() => gallerySignals.currentIndex);
		const isDownloading = createMemo(() => downloadState.isProcessing);
		const [containerEl, setContainerEl] = createSignal(null);
		const [toolbarWrapperEl, setToolbarWrapperEl] = createSignal(null);
		const [itemsContainerEl, setItemsContainerEl] = createSignal(null);
		const isVisible = createMemo(() => mediaItems().length > 0);
		const activeMedia = createMemo(() => {
			return mediaItems()[currentIndex()] ?? null;
		});
		const tweetText = () => activeMedia()?.tweetText ?? null;
		const tweetTextContent = () => activeMedia()?.tweetTextContent ?? null;
		const tweetUrl = () => activeMedia()?.tweetUrl ?? null;
		const preloadCount = createMemo(() => getTypedSettingOr("gallery.preloadCount", 3));
		const preloadIndices = createMemo(() => computePreloadIndices(currentIndex(), mediaItems().length, preloadCount()));
		const { scroll, navigation, focus, toolbar } = useVerticalGallery({
			isVisible,
			currentIndex,
			mediaItemsCount: () => mediaItems().length,
			containerEl,
			toolbarWrapperEl,
			itemsContainerEl
		});
		const translate = useTranslation();
		const { debouncedScrollCorrection } = useGalleryScrollCorrection({
			isVisible,
			currentIndex,
			activeMedia,
			scrollToItem: scroll.scrollToItem
		});
		createEffect(() => {
			if (!isVisible() || navigation.lastNavigationTrigger()) return;
			navigateToItem(currentIndex(), "auto-focus");
		});
		const { imageFitMode, handleFitOriginal, handleFitWidth, handleFitHeight, handleFitContainer } = useGalleryFitMode({ scrollToCurrentItem: scroll.scrollToCurrentItem });
		const handleDownloadCurrent = () => local.onDownloadCurrent?.();
		const handleDownloadAll = () => local.onDownloadAll?.();
		const handleMediaLoad = (mediaId, indexValue) => {
			if (mediaItems()[indexValue]?.id !== mediaId) return;
			debouncedScrollCorrection(indexValue, mediaId);
		};
		const createRegisterContainer = (index) => (element) => focus.registerItem(index, element);
		const createHandleFocus = (index) => () => focus.handleItemFocus(index);
		const { handlePrevious, handleNext, handleBackgroundClick, handleMediaItemClick } = useGalleryNavigationHandlers({
			currentIndex,
			focusedIndex: focus.focusedIndex,
			mediaItems,
			onClose: handleClose
		});
		useGalleryWheelRedirect({
			containerEl,
			itemsContainerEl
		});
		const toolbarHandlers = createMemo(() => ({
			navigation: {
				onPrevious: local.onPrevious ?? handlePrevious,
				onNext: local.onNext ?? handleNext
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
				onClose: handleClose,
				onOpenSettings: () => {}
			}
		}));
		if (!isVisible()) return (() => {
			var _el$ = _tmpl$$3(), _el$2 = _el$.firstChild, _el$3 = _el$2.firstChild, _el$4 = _el$3.nextSibling;
			insert(_el$3, () => translate("msg.gal.emptyT"));
			insert(_el$4, () => translate("msg.gal.emptyD"));
			createRenderEffect((_p$) => {
				var _v$ = cx(VerticalGalleryView_module_default.container, VerticalGalleryView_module_default.empty, local.className), _v$2 = VerticalGalleryView_module_default.emptyMessage;
				_v$ !== _p$.e && className(_el$, _p$.e = _v$);
				_v$2 !== _p$.t && className(_el$2, _p$.t = _v$2);
				return _p$;
			}, {
				e: void 0,
				t: void 0
			});
			return _el$;
		})();
		return (() => {
			var _el$5 = _tmpl$2$1(), _el$6 = _el$5.firstChild, _el$7 = _el$6.nextSibling, _el$8 = _el$7.nextSibling, _el$9 = _el$8.firstChild;
			addEventListener(_el$5, "click", handleBackgroundClick, true);
			use((el) => setContainerEl(el ?? null), _el$5);
			use((el) => setToolbarWrapperEl(el ?? null), _el$7);
			insert(_el$7, createComponent(Toolbar, {
				currentIndex,
				get focusedIndex() {
					return focus.focusedIndex;
				},
				totalCount: () => mediaItems().length,
				isDownloading,
				currentFitMode: imageFitMode,
				tweetText,
				tweetTextContent,
				tweetUrl,
				get className() {
					return VerticalGalleryView_module_default.toolbar;
				},
				get handlers() {
					return toolbarHandlers();
				}
			}));
			use((el) => setItemsContainerEl(el ?? null), _el$8);
			insert(_el$8, createComponent(For, {
				get each() {
					return mediaItems();
				},
				children: (item, index) => {
					const actualIndex = index();
					return createComponent(VerticalImageItem, {
						media: item,
						index: actualIndex,
						get isActive() {
							return actualIndex === currentIndex();
						},
						get isFocused() {
							return actualIndex === focus.focusedIndex();
						},
						forceVisible: preloadIndices().includes(actualIndex),
						fitMode: imageFitMode,
						onClick: () => handleMediaItemClick(actualIndex),
						onMediaLoad: handleMediaLoad,
						get className() {
							return cx(VerticalGalleryView_module_default.galleryItem, actualIndex === currentIndex() && VerticalGalleryView_module_default.itemActive);
						},
						get registerContainer() {
							return createRegisterContainer(actualIndex);
						},
						get onFocus() {
							return createHandleFocus(actualIndex);
						}
					});
				}
			}), _el$9);
			createRenderEffect((_p$) => {
				var _v$3 = cx(VerticalGalleryView_module_default.container, toolbar.isInitialToolbarVisible() && VerticalGalleryView_module_default.initialToolbarVisible, scroll.isScrolling() && VerticalGalleryView_module_default.isScrolling, local.className), _v$4 = VerticalGalleryView_module_default.toolbarHoverZone, _v$5 = VerticalGalleryView_module_default.toolbarWrapper, _v$6 = VerticalGalleryView_module_default.itemsContainer, _v$7 = VerticalGalleryView_module_default.scrollSpacer;
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
	delegateEvents(["click"]);
	//#endregion
	//#region src/shared/async/abort-signal.ts
	/**
	* @fileoverview AbortSignal utilities — polyfill for AbortSignal.any()
	* (unavailable in Safari 17.0–17.3).
	*/
	/**
	* Polyfill for AbortSignal.any() — combines multiple AbortSignals into one.
	* If any input signal aborts, the returned signal aborts too.
	*
	* Returns both the merged signal and a cleanup function. Call cleanup()
	* after the operation using the merged signal finishes (success or error)
	* to remove the abort listeners from the input signals. This prevents
	* listener accumulation on long-lived signals.
	*
	* @param signals - One or more AbortSignals to merge
	* @returns An object with the merged signal and a cleanup function
	*/
	function mergeAbortSignals(...signals) {
		const controller = new AbortController();
		const listeners = [];
		for (const signal of signals) {
			if (signal.aborted) {
				controller.abort();
				break;
			}
			const handler = () => controller.abort();
			signal.addEventListener("abort", handler, { once: true });
			listeners.push({
				signal,
				handler
			});
		}
		const cleanup = () => {
			for (const { signal, handler } of listeners) signal.removeEventListener("abort", handler);
			listeners.length = 0;
		};
		return {
			signal: controller.signal,
			cleanup
		};
	}
	//#endregion
	//#region src/shared/core/filename/filename-utils.ts
	function sanitize(name) {
		return name.replace(/[<>:"/\\|?*]/g, "_").replace(/^[\s.]+|[\s.]+$/g, "").slice(0, 255) || "media";
	}
	function resolveNowMs(nowMs) {
		return Number.isFinite(nowMs) ? nowMs : Date.now();
	}
	function getExtension(url) {
		try {
			const parsed = new URL(url);
			const formatParam = parsed.searchParams.get("format");
			if (formatParam && /^(jpg|jpeg|png|gif|webp|mp4|mov|avi)$/i.test(formatParam)) return formatParam.toLowerCase();
			const path = parsed.pathname;
			if (!path) return "jpg";
			const ext = path.split(".").pop();
			if (ext && /^(jpg|jpeg|png|gif|webp|mp4|mov|avi)$/i.test(ext)) return ext.toLowerCase();
		} catch {}
		return "jpg";
	}
	/**
	* Extract index from media ID.
	* Parses patterns like '_media_0' → '1' (1-indexed) or '_1' → '1'.
	* @param mediaId - Media identifier string to parse
	* @returns 1-indexed position string, or null if no match
	*/
	function getIndexFromMediaId(mediaId) {
		if (!mediaId) return null;
		const match = mediaId.match(/_media_(\d+)$/) || mediaId.match(/_(\d+)$/);
		if (match) {
			const idx = Number.parseInt(match[1], 10);
			return mediaId.includes("_media_") ? (idx + 1).toString() : match[1] ?? null;
		}
		return null;
	}
	/**
	* Normalize index to a positive integer string.
	* Invalid values default to '1'.
	* @param index - Index value to normalize
	* @returns Positive integer string, minimum '1'
	*/
	function normalizeIndex(index) {
		if (index === void 0 || index === null) return "1";
		const num = typeof index === "string" ? Number.parseInt(index, 10) : index;
		return Number.isNaN(num) || num < 1 ? "1" : num.toString();
	}
	/**
	* Resolve username and tweetId from media metadata.
	* Extraction priority: quoted tweet → direct tweet → URL → fallback.
	* @param media - Media item to extract metadata from
	* @param fallbackUsername - Optional fallback username when extraction fails
	* @returns Object with username and tweetId (both nullable)
	*/
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
	/**
	* Generate a filename for a media item.
	* Priority: media.filename → `${username}_${tweetId}_${index}` → `tweet_${tweetId}_${index}` → `${fallbackPrefix}_${nowMs}_${index}`
	* @param media - Media item to generate filename for
	* @param options - Optional configuration for filename generation
	* @returns Sanitized filename string
	*/
	function generateMediaFilename(media, options = {}) {
		try {
			if (media.filename) return sanitize(media.filename);
			const nowMs = resolveNowMs(options.nowMs);
			const extension = options.extension ?? getExtension(media.originalUrl ?? media.url);
			const index = getIndexFromMediaId(media.id) ?? normalizeIndex(options.index);
			const { username, tweetId } = resolveMetadata(media, options.fallbackUsername);
			if (username && tweetId) return sanitize(`${username}_${tweetId}_${index}.${extension}`);
			if (tweetId && /^\d+$/.test(tweetId)) return sanitize(`tweet_${tweetId}_${index}.${extension}`);
			return sanitize(`${options.fallbackPrefix ?? "media"}_${nowMs}_${index}.${extension}`);
		} catch {
			return `media_${resolveNowMs(options.nowMs)}.${options.extension || "jpg"}`;
		}
	}
	/**
	* Generate a filename for a ZIP archive.
	* Priority: `${username}_${tweetId}.zip` (from first media) → `${fallbackPrefix}_${nowMs}.zip`
	* @param mediaItems - Array of media items to archive (uses first item for metadata)
	* @param options - Optional configuration for ZIP filename generation
	* @returns Sanitized ZIP filename string
	*/
	function generateZipFilename(mediaItems, options = {}) {
		try {
			const firstItem = mediaItems[0];
			if (firstItem) {
				const { username, tweetId } = resolveMetadata(firstItem);
				if (username && tweetId) return sanitize(`${username}_${tweetId}.zip`);
			}
			return sanitize(`${options.fallbackPrefix ?? "xcom_gallery"}_${resolveNowMs(options.nowMs)}.zip`);
		} catch {
			return `download_${resolveNowMs(options.nowMs)}.zip`;
		}
	}
	//#endregion
	//#region src/shared/core/download/download-plan.ts
	/**
	* @fileoverview Download planning utilities (functional core)
	* @description Pure functions that convert inputs (media, options, capabilities)
	*              into executable download plans.
	*/
	/** Helper to generate filename with optional time source */
	function generateDesiredName(media, nowMs) {
		return nowMs === void 0 ? generateMediaFilename(media) : generateMediaFilename(media, { nowMs });
	}
	/** Helper to generate ZIP filename with optional time source */
	function generateZipName(items, nowMs) {
		return nowMs === void 0 ? generateZipFilename(items) : generateZipFilename(items, { nowMs });
	}
	/**
	* Plan the ZIP download: resolve desired names and associate optional prefetched blobs.
	* @param input - Configuration for bulk download planning
	* @returns Plan containing items with URLs, filenames, and optional blobs, plus ZIP filename
	*/
	function planBulkDownload(input) {
		return {
			items: input.mediaItems.map((media) => ({
				url: media.url,
				desiredName: generateDesiredName(media, input.nowMs),
				blob: input.prefetchedBlobs?.get(media.url)
			})),
			zipFilename: input.zipFilename ?? generateZipName(input.mediaItems, input.nowMs)
		};
	}
	//#endregion
	//#region src/shared/utils/math/percentage.ts
	/**
	* Compute a clamped percentage (0-100) from current/total.
	* Returns 0 for invalid totals (zero or negative).
	*/
	function computePercentage(current, total) {
		if (total <= 0) return 0;
		return Math.min(100, Math.max(0, Math.round(current / total * 100)));
	}
	//#endregion
	//#region src/shared/services/download/types.ts
	function reportProgress(onProgress, payload) {
		if (!onProgress) return;
		const percentage = payload.percentage ?? computePercentage(payload.current, payload.total);
		onProgress({
			...payload,
			percentage
		});
	}
	//#endregion
	//#region src/shared/services/download/single-download.ts
	var createAbortResult = () => ({
		success: false,
		error: USER_CANCELLED_MESSAGE
	});
	var createErrorDownloadResult = (error) => ({
		success: false,
		error: normalizeErrorMessage(error)
	});
	/**
	* Race a work promise against an AbortSignal, returning `onAborted()` if
	* the signal fires before the work completes.
	*
	* Uses a flat `Promise.race` with `{ once: true }` listener — no nested
	* controller chain. The listener self-removes when the abort fires.
	*
	* @param work - Promise representing the actual work (with handlers attached)
	* @param signal - AbortSignal to race against
	* @param onAborted - Factory for the result when the abort wins
	* @returns The work result or the abort result
	*/
	async function raceWithAbort(work, signal, onAborted) {
		if (signal.aborted) return onAborted();
		let settled = false;
		let abortHandler = null;
		const abortPromise = new Promise((resolve) => {
			abortHandler = () => {
				if (settled) return;
				settled = true;
				resolve(onAborted());
			};
			signal.addEventListener("abort", abortHandler, { once: true });
		});
		try {
			const result = await Promise.race([work, abortPromise]);
			settled = true;
			return result;
		} finally {
			if (!settled && abortHandler) signal.removeEventListener("abort", abortHandler);
		}
	}
	async function downloadSingleFile(media, options = {}) {
		const abortSignal = options.signal;
		if (abortSignal?.aborted) return createAbortResult();
		const filename = generateMediaFilename(media, { nowMs: Date.now() });
		if (options.blob) return downloadBlobWithAdapter(options.blob, filename, abortSignal);
		return downloadWithAdapter(media.url, filename, options, abortSignal);
	}
	async function downloadWithAdapter(url, filename, options, abortSignal) {
		const adapter = getDownloadAdapter();
		if (adapter.needsBlobFallback()) return downloadWithFetchFallback(url, filename, options, abortSignal, adapter);
		if (abortSignal) return raceWithAbort(adapter.download(url, filename, void 0, abortSignal).then(() => {
			reportProgress(options.onProgress, {
				phase: "complete",
				current: 1,
				total: 1,
				percentage: 100,
				filename
			});
			return {
				success: true,
				filename
			};
		}, (error) => createErrorDownloadResult(error)), abortSignal, createAbortResult);
		reportProgress(options.onProgress, {
			phase: "preparing",
			current: 0,
			total: 1,
			percentage: 0,
			filename
		});
		try {
			await adapter.download(url, filename, void 0, abortSignal);
			reportProgress(options.onProgress, {
				phase: "complete",
				current: 1,
				total: 1,
				percentage: 100,
				filename
			});
			return {
				success: true,
				filename
			};
		} catch (error) {
			return createErrorDownloadResult(error);
		}
	}
	async function downloadWithFetchFallback(url, filename, options, abortSignal, adapter) {
		reportProgress(options.onProgress, {
			phase: "preparing",
			current: 0,
			total: 1,
			percentage: 0,
			filename
		});
		try {
			const timeoutSignal = AbortSignal.timeout(DEFAULT_REQUEST_TIMEOUT_MS);
			const fetchInit = { credentials: "include" };
			if (abortSignal) {
				const combinedController = new AbortController();
				const onCombinedAbort = () => combinedController.abort();
				abortSignal.addEventListener("abort", onCombinedAbort, { once: true });
				timeoutSignal.addEventListener("abort", onCombinedAbort, { once: true });
				fetchInit.signal = combinedController.signal;
				const cleanupCombined = () => {
					abortSignal.removeEventListener("abort", onCombinedAbort);
					timeoutSignal.removeEventListener("abort", onCombinedAbort);
				};
				try {
					const response = await fetch(url, fetchInit);
					if (!response.ok) return createErrorDownloadResult(/* @__PURE__ */ new Error(`HTTP ${response.status}: ${response.statusText}`));
					const blob = await response.blob();
					reportProgress(options.onProgress, {
						phase: "downloading",
						current: 50,
						total: 100,
						percentage: 50,
						filename
					});
					const result = await raceWithAbort(adapter.downloadBlob(blob, filename, abortSignal).then(() => ({
						success: true,
						filename
					}), (error) => createErrorDownloadResult(error)), abortSignal, createAbortResult);
					if (!result.success) return result;
					reportProgress(options.onProgress, {
						phase: "complete",
						current: 1,
						total: 1,
						percentage: 100,
						filename
					});
					return {
						success: true,
						filename
					};
				} finally {
					cleanupCombined();
				}
			} else {
				fetchInit.signal = timeoutSignal;
				const response = await fetch(url, fetchInit);
				if (!response.ok) return createErrorDownloadResult(/* @__PURE__ */ new Error(`HTTP ${response.status}: ${response.statusText}`));
				const blob = await response.blob();
				reportProgress(options.onProgress, {
					phase: "downloading",
					current: 50,
					total: 100,
					percentage: 50,
					filename
				});
				await adapter.downloadBlob(blob, filename, abortSignal);
				reportProgress(options.onProgress, {
					phase: "complete",
					current: 1,
					total: 1,
					percentage: 100,
					filename
				});
				return {
					success: true,
					filename
				};
			}
		} catch (error) {
			if (isAbortError(error)) return createAbortResult();
			if (adapter.needsBlobFallback()) try {
				await adapter.download(url, filename, void 0, abortSignal);
				reportProgress(options.onProgress, {
					phase: "complete",
					current: 1,
					total: 1,
					percentage: 100,
					filename
				});
				return {
					success: true,
					filename
				};
			} catch {
				return createErrorDownloadResult(error);
			}
			return createErrorDownloadResult(error);
		}
	}
	async function downloadBlobWithAdapter(blob, filename, abortSignal) {
		const adapter = getDownloadAdapter();
		if (abortSignal?.aborted) return createAbortResult();
		try {
			const download = adapter.downloadBlob(blob, filename, abortSignal).then(() => ({
				success: true,
				filename
			}), (error) => createErrorDownloadResult(error));
			if (!abortSignal) return await download;
			return await raceWithAbort(download, abortSignal, createAbortResult);
		} catch (error) {
			return createErrorDownloadResult(error);
		}
	}
	//#endregion
	//#region src/shared/external/zip/streaming-zip-writer.ts
	/**
	* @fileoverview Streaming ZIP writer for progressive ZIP generation
	* @description Pipelined file downloads and ZIP assembly with immediate Local File Headers
	*/
	var textEncoder = new TextEncoder();
	var crc32Table = null;
	/**
	* Lazily initialize and cache CRC32 lookup table (polynomial 0xEDB88320)
	* @returns Cached 256-element Uint32Array
	* @internal
	*/
	function ensureCRC32Table() {
		if (crc32Table) return crc32Table;
		const table = /* @__PURE__ */ new Uint32Array(256);
		const polynomial = 3988292384;
		for (let i = 0; i < 256; i++) {
			let crc = i;
			for (let j = 0; j < 8; j++) crc = crc & 1 ? crc >>> 1 ^ polynomial : crc >>> 1;
			table[i] = crc >>> 0;
		}
		crc32Table = table;
		return table;
	}
	/**
	* Encode UTF-8 string to byte array
	* @param value - String to encode
	* @returns Uint8Array with UTF-8 bytes
	*/
	function encodeUtf8(value) {
		return textEncoder.encode(value);
	}
	/**
	* Calculate CRC32 checksum using polynomial 0xEDB88320
	* @param data - Byte array to checksum
	* @returns 32-bit unsigned CRC32 value
	*/
	function calculateCRC32(data) {
		const table = ensureCRC32Table();
		let crc = 4294967295;
		for (let i = 0; i < data.length; i++) crc = crc >>> 8 ^ table[(crc ^ data[i]) & 255];
		return (crc ^ 4294967295) >>> 0;
	}
	/**
	* Encode 16-bit unsigned integer to little-endian bytes
	* @param value - 16-bit unsigned integer
	* @returns 2-byte Uint8Array in little-endian order
	*/
	function writeUint16LE(value) {
		const bytes = /* @__PURE__ */ new Uint8Array(2);
		bytes[0] = value & 255;
		bytes[1] = value >>> 8 & 255;
		return bytes;
	}
	/**
	* Encode 32-bit unsigned integer to little-endian bytes
	* @param value - 32-bit unsigned integer
	* @returns 4-byte Uint8Array in little-endian order
	*/
	function writeUint32LE(value) {
		const bytes = /* @__PURE__ */ new Uint8Array(4);
		bytes[0] = value & 255;
		bytes[1] = value >>> 8 & 255;
		bytes[2] = value >>> 16 & 255;
		bytes[3] = value >>> 24 & 255;
		return bytes;
	}
	var ZIP_CONST = {
		MAX_UINT16: 65535,
		MAX_UINT32: 4294967295,
		ZIP32_ERROR: "Zip32 limit exceeded",
		SIG_LOCAL_HEADER: new Uint8Array([
			80,
			75,
			3,
			4
		]),
		SIG_CENTRAL_DIR: new Uint8Array([
			80,
			75,
			1,
			2
		]),
		SIG_END_CENTRAL_DIR: new Uint8Array([
			80,
			75,
			5,
			6
		]),
		UTF8_FLAG: 2048,
		VERSION: 20
	};
	function assertZip32(condition, message) {
		if (condition) return;
		throw new Error(ZIP_CONST.ZIP32_ERROR);
	}
	/** Optimized buffer concatenation (no function call overhead) */
	var concat = (arrays) => {
		let len = 0;
		for (const array of arrays) len += array.length;
		const result = new Uint8Array(len);
		let offset = 0;
		for (const array of arrays) {
			result.set(array, offset);
			offset += array.length;
		}
		return result;
	};
	/**
	* Streaming ZIP writer with immediate Local File Header writes
	* Finalize() adds Central Directory to complete the ZIP
	*/
	var StreamingZipWriter = class {
		chunks = [];
		entries = [];
		currentOffset = 0;
		/**
		* Add file to archive (streaming mode)
		* Writes Local File Header + File Data immediately
		* @param filename - Name of file in archive
		* @param data - File content bytes
		* @throws Error if archive/entry would exceed Zip32 limits
		*/
		addFile(filename, data) {
			assertZip32(this.entries.length < ZIP_CONST.MAX_UINT16 - 1, `too many entries (count=${this.entries.length + 1})`);
			assertZip32(data.length < ZIP_CONST.MAX_UINT32, `file too large (size=${data.length})`);
			assertZip32(this.currentOffset < ZIP_CONST.MAX_UINT32, `offset overflow (offset=${this.currentOffset})`);
			const filenameBytes = encodeUtf8(filename);
			const crc32 = calculateCRC32(data);
			const localHeader = concat([
				ZIP_CONST.SIG_LOCAL_HEADER,
				writeUint16LE(ZIP_CONST.VERSION),
				writeUint16LE(ZIP_CONST.UTF8_FLAG),
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
			assertZip32(this.currentOffset + localHeader.length + data.length < ZIP_CONST.MAX_UINT32, `archive too large (offset=${this.currentOffset}, add=${localHeader.length + data.length})`);
			this.chunks.push(localHeader, data);
			this.entries.push({
				filename,
				size: data.length,
				offset: this.currentOffset,
				crc32
			});
			this.currentOffset += localHeader.length + data.length;
		}
		/**
		* Finalize ZIP file (add Central Directory).
		*
		* Returns an array of parts suitable for `new Blob(parts, {type:'application/zip'})`.
		* Unlike the previous implementation, this does NOT allocate a monolithic
		* Uint8Array — the Blob constructor natively concatenates the parts without
		* duplicating data in JS heap, halving peak memory (~4× → ~2× archive size).
		*
		* @returns BlobPart[] — file data chunks followed by central directory + EOCD
		* @throws Error if archive exceeds Zip32 limits
		*/
		finalize() {
			assertZip32(this.entries.length < ZIP_CONST.MAX_UINT16, `too many entries (count=${this.entries.length})`);
			const centralDirStart = this.currentOffset;
			assertZip32(centralDirStart < ZIP_CONST.MAX_UINT32, `central directory offset overflow (${centralDirStart})`);
			let centralDirSize = 0;
			for (const entry of this.entries) centralDirSize += 46 + encodeUtf8(entry.filename).length;
			const centralDir = new Uint8Array(centralDirSize);
			let pos = 0;
			for (const entry of this.entries) {
				const filenameBytes = encodeUtf8(entry.filename);
				assertZip32(entry.offset < ZIP_CONST.MAX_UINT32, `entry offset overflow (${entry.offset})`);
				assertZip32(entry.size < ZIP_CONST.MAX_UINT32, `entry too large (size=${entry.size})`);
				centralDir.set(ZIP_CONST.SIG_CENTRAL_DIR, pos);
				pos += 4;
				centralDir.set(writeUint16LE(ZIP_CONST.VERSION), pos);
				pos += 2;
				centralDir.set(writeUint16LE(ZIP_CONST.VERSION), pos);
				pos += 2;
				centralDir.set(writeUint16LE(ZIP_CONST.UTF8_FLAG), pos);
				pos += 2;
				centralDir.set(writeUint16LE(0), pos);
				pos += 2;
				centralDir.set(writeUint16LE(0), pos);
				pos += 2;
				centralDir.set(writeUint16LE(0), pos);
				pos += 2;
				centralDir.set(writeUint32LE(entry.crc32), pos);
				pos += 4;
				centralDir.set(writeUint32LE(entry.size), pos);
				pos += 4;
				centralDir.set(writeUint32LE(entry.size), pos);
				pos += 4;
				centralDir.set(writeUint16LE(filenameBytes.length), pos);
				pos += 2;
				centralDir.set(writeUint16LE(0), pos);
				pos += 2;
				centralDir.set(writeUint16LE(0), pos);
				pos += 2;
				centralDir.set(writeUint16LE(0), pos);
				pos += 2;
				centralDir.set(writeUint16LE(0), pos);
				pos += 2;
				centralDir.set(writeUint32LE(0), pos);
				pos += 4;
				centralDir.set(writeUint32LE(entry.offset), pos);
				pos += 4;
				centralDir.set(filenameBytes, pos);
				pos += filenameBytes.length;
			}
			const eocd = /* @__PURE__ */ new Uint8Array(22);
			let epos = 0;
			eocd.set(ZIP_CONST.SIG_END_CENTRAL_DIR, epos);
			epos += 4;
			eocd.set(writeUint16LE(0), epos);
			epos += 2;
			eocd.set(writeUint16LE(0), epos);
			epos += 2;
			eocd.set(writeUint16LE(this.entries.length), epos);
			epos += 2;
			eocd.set(writeUint16LE(this.entries.length), epos);
			epos += 2;
			eocd.set(writeUint32LE(centralDirSize), epos);
			epos += 4;
			eocd.set(writeUint32LE(centralDirStart), epos);
			epos += 4;
			eocd.set(writeUint16LE(0), epos);
			return [
				...this.chunks,
				centralDir,
				eocd
			];
		}
	};
	//#endregion
	//#region src/shared/async/retry.ts
	/**
	* @fileoverview Retry utility with exponential backoff.
	*/
	var DEFAULTS = {
		maxAttempts: 3,
		baseDelayMs: 200,
		maxDelayMs: 1e4
	};
	/**
	* Calculate exponential backoff delay with jitter.
	* Exported for testability — accepts `random` for deterministic jitter.
	*
	* @param attempt - Current attempt number (0-indexed)
	* @param base - Base delay in milliseconds
	* @param max - Maximum delay in milliseconds
	* @param random - Random function returning [0, 1) (default: Math.random)
	*/
	function calcBackoff(attempt, base, max, random = Math.random) {
		const exp = base * 2 ** attempt;
		const jitter = random() * .25 * exp;
		return Math.min(Math.floor(exp + jitter), max);
	}
	async function withRetry(operation, options = {}) {
		const { maxAttempts = DEFAULTS.maxAttempts, baseDelayMs = DEFAULTS.baseDelayMs, maxDelayMs = DEFAULTS.maxDelayMs, signal, onRetry, shouldRetry, random } = options;
		let lastError;
		for (let attempt = 0; attempt < maxAttempts; attempt++) {
			if (signal?.aborted) return {
				success: false,
				error: signal.reason ?? new DOMException("Aborted", "AbortError"),
				attempts: attempt
			};
			try {
				return {
					success: true,
					data: await operation(),
					attempts: attempt + 1
				};
			} catch (error) {
				lastError = error;
				if (isAbortError(error)) return {
					success: false,
					error,
					attempts: attempt + 1
				};
				if (shouldRetry && !shouldRetry(error)) return {
					success: false,
					error,
					attempts: attempt + 1
				};
				if (attempt + 1 >= maxAttempts) break;
				const delayMs = calcBackoff(attempt, baseDelayMs, maxDelayMs, random);
				onRetry?.(attempt + 1, error, delayMs);
				try {
					await sleep(delayMs, signal);
				} catch (delayError) {
					if (isAbortError(delayError)) return {
						success: false,
						error: delayError,
						attempts: attempt + 1
					};
					throw delayError;
				}
			}
		}
		return {
			success: false,
			error: lastError,
			attempts: maxAttempts
		};
	}
	//#endregion
	//#region src/shared/network/retry-fetch.ts
	/**
	* @fileoverview Retry-fetch utility: HTTP status error handling with configurable backoff.
	*/
	var HttpStatusError = class extends Error {
		status;
		name = "HttpStatusError";
		constructor(status) {
			super(`HTTP error: ${status}`);
			this.status = status;
		}
	};
	var isRetryableStatus = (status) => status === 0 || status === 408 || status === 425 || status === 429 || status >= 500 && status < 600;
	var getStatusFromError = (error) => {
		if (!error || typeof error !== "object" || !("status" in error)) return null;
		const statusValue = error.status;
		return typeof statusValue === "number" ? statusValue : null;
	};
	/**
	* Fetches a URL as an ArrayBuffer with configurable retries and exponential backoff.
	*
	* @param url - The URL to fetch
	* @param retries - Maximum number of retry attempts
	* @param signal - Optional AbortSignal for cancellation
	* @param backoffBaseMs - Base delay for exponential backoff (default: 200ms)
	* @returns Response body as Uint8Array
	* @throws On non-retryable HTTP errors or abort signal rejection
	*/
	async function fetchArrayBufferWithRetry(url, retries, signal, backoffBaseMs = 200) {
		if (signal?.aborted) throw getUserCancelledAbortErrorFromSignal(signal);
		const httpService = getHttpRequestService();
		const result = await withRetry(async () => {
			if (signal?.aborted) throw getUserCancelledAbortErrorFromSignal(signal);
			const response = await httpService.get(url, {
				responseType: "arraybuffer",
				timeout: DEFAULT_REQUEST_TIMEOUT_MS,
				...signal ? { signal } : {}
			});
			if (!response.ok) throw new HttpStatusError(response.status);
			return new Uint8Array(response.data);
		}, {
			maxAttempts: Math.max(1, retries + 1),
			baseDelayMs: backoffBaseMs,
			...signal ? { signal } : {},
			shouldRetry: (error) => {
				if (isAbortError(error)) return false;
				const status = getStatusFromError(error);
				if (status === null) return true;
				return isRetryableStatus(status);
			}
		});
		if (result.success) return result.data;
		if (signal?.aborted) throw getUserCancelledAbortErrorFromSignal(signal);
		throw result.error;
	}
	//#endregion
	//#region src/shared/services/download/zip-download.ts
	var ensureUniqueFilenameFactory = () => {
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
			let candidate = "";
			do {
				count += 1;
				candidate = `${name}-${count}${ext}`;
			} while (usedNames.has(candidate));
			baseCounts.set(baseKey, count);
			usedNames.add(candidate);
			return candidate;
		};
	};
	var clampConcurrency = (value) => {
		return Math.min(8, Math.max(1, value ?? 4));
	};
	var clampRetries = (value) => Math.max(0, value ?? 3);
	var throwIfAborted = (signal) => {
		if (signal?.aborted) throw getUserCancelledAbortErrorFromSignal(signal);
	};
	/**
	* Download multiple media items as a ZIP archive using parallel fetch workers.
	* Each completed file is written to the ZIP writer immediately to minimize
	* peak memory usage — only one file's data is buffered beyond the fetch buffer
	* at any time, instead of holding all files in memory before writing.
	*
	* @param items - Media items to download
	* @param options - Download options (concurrency, retries, signal, progress)
	* @returns ZIP result with file success/failure counts and binary data
	*/
	async function downloadAsZip(items, options = {}) {
		const writer = new StreamingZipWriter();
		const concurrency = clampConcurrency(options.concurrency);
		const retries = clampRetries(options.retries);
		const abortSignal = options.signal;
		const onProgress = options.onProgress;
		throwIfAborted(abortSignal);
		const total = items.length;
		let processed = 0;
		let successful = 0;
		const failures = [];
		const ensureUniqueFilename = ensureUniqueFilenameFactory();
		const assignedFilenames = items.map((item) => ensureUniqueFilename(item.desiredName));
		let currentIndex = 0;
		const runNext = async () => {
			while (currentIndex < total) {
				throwIfAborted(abortSignal);
				const index = currentIndex++;
				const item = items[index];
				if (!item) continue;
				const filename = assignedFilenames[index] ?? item.desiredName;
				try {
					let data;
					if (item.blob) {
						let blob;
						try {
							blob = item.blob instanceof Promise ? await item.blob : item.blob;
						} catch {}
						if (blob) {
							throwIfAborted(abortSignal);
							data = new Uint8Array(await blob.arrayBuffer());
						} else data = await fetchArrayBufferWithRetry(item.url, retries, abortSignal, 200);
					} else data = await fetchArrayBufferWithRetry(item.url, retries, abortSignal, 200);
					throwIfAborted(abortSignal);
					if (index > 0) await schedulerYield(0);
					writer.addFile(filename, data);
					successful++;
				} catch (error) {
					throwIfAborted(abortSignal);
					failures.push({
						url: item.url,
						error: normalizeErrorMessage(error)
					});
				} finally {
					processed++;
					reportProgress(onProgress, {
						phase: "downloading",
						current: processed,
						total,
						filename
					});
				}
			}
		};
		const workers = Array.from({ length: Math.min(concurrency, total) }, () => runNext());
		await Promise.all(workers);
		reportProgress(onProgress, {
			phase: "complete",
			current: processed,
			total,
			percentage: 100
		});
		const zipBytes = writer.finalize();
		return {
			filesSuccessful: successful,
			failures,
			zipData: zipBytes
		};
	}
	//#endregion
	//#region src/shared/services/download/download-orchestrator.ts
	/** @fileoverview Unified download service: single + bulk (ZIP) via GM_download. */
	/**
	* Create a standardized error response for bulk download operations.
	* Provides a consistent error shape across all failure paths.
	*/
	function createErrorResponse(error, code, filesProcessed, options) {
		return {
			success: false,
			status: "error",
			filesProcessed,
			filesSuccessful: options?.filesSuccessful ?? 0,
			error,
			...options?.failures ? { failures: options.failures } : {},
			code
		};
	}
	var DownloadOrchestrator = class {
		_initialized = false;
		abortController = new AbortController();
		/** Initialize service (idempotent) */
		initialize() {
			this.abortController = new AbortController();
			this._initialized = true;
		}
		/** Destroy service (idempotent) — aborts all in-progress downloads */
		destroy() {
			this.abortController.abort();
			this._initialized = false;
		}
		isInitialized() {
			return this._initialized;
		}
		/**
		* The AbortSignal for all downloads managed by this orchestrator.
		* Destroyed via abort() when destroy() is called.
		*/
		get signal() {
			return this.abortController.signal;
		}
		/**
		* Download a single media file
		*
		* @param media - Media info containing URL and metadata
		* @param options - Download options (signal, progress callback)
		* @returns Download result with success status
		*/
		async downloadSingle(media, options = {}) {
			const { signal: mergedSignal, cleanup } = this.mergeSignal(options.signal);
			try {
				return await downloadSingleFile(media, {
					...options,
					signal: mergedSignal
				});
			} finally {
				cleanup();
			}
		}
		/**
		* Download multiple media files as a ZIP archive
		*
		* @param mediaItems - Array of media items to download
		* @param options - Download options including optional zipFilename
		* @returns Bulk download result with per-file status
		*/
		async downloadBulk(mediaItems, options = {}) {
			const { signal: mergedSignal, cleanup } = this.mergeSignal(options.signal);
			try {
				if (mergedSignal.aborted) return createErrorResponse(normalizeErrorMessage(getUserCancelledAbortErrorFromSignal(mergedSignal)), ErrorCode.CANCELLED, 0);
				if (mediaItems.length === 0) return createErrorResponse("No media to download", ErrorCode.EMPTY_INPUT, 0);
				await schedulerYield(50);
				if (!getDownloadAdapter()) return createErrorResponse("No download method", ErrorCode.ALL_FAILED, mediaItems.length);
				const plan = planBulkDownload({
					mediaItems,
					prefetchedBlobs: options.prefetchedBlobs,
					zipFilename: options.zipFilename,
					nowMs: Date.now()
				});
				const items = plan.items;
				try {
					const result = await downloadAsZip(items, {
						...options,
						signal: mergedSignal
					});
					if (result.filesSuccessful === 0) return createErrorResponse("No files downloaded", ErrorCode.ALL_FAILED, items.length, { failures: result.failures });
					const zipBlob = new Blob(result.zipData, { type: "application/zip" });
					const filename = plan.zipFilename;
					const saveResult = await this.saveWithDownloadAdapter(zipBlob, filename, mergedSignal);
					if (!saveResult.success) {
						if (mergedSignal.aborted) return createErrorResponse(normalizeErrorMessage(getUserCancelledAbortErrorFromSignal(mergedSignal)), ErrorCode.CANCELLED, items.length, {
							filesSuccessful: result.filesSuccessful,
							failures: result.failures
						});
						return createErrorResponse(saveResult.error || "Failed to save ZIP file", ErrorCode.ALL_FAILED, items.length, {
							filesSuccessful: result.filesSuccessful,
							failures: result.failures
						});
					}
					return {
						success: true,
						status: result.filesSuccessful === items.length ? "success" : "partial",
						filesProcessed: items.length,
						filesSuccessful: result.filesSuccessful,
						filename,
						failures: result.failures,
						code: ErrorCode.NONE
					};
				} catch (error) {
					if (isAbortError(error)) return createErrorResponse(normalizeErrorMessage(error), ErrorCode.CANCELLED, items.length);
					return createErrorResponse(normalizeErrorMessage(error), ErrorCode.ALL_FAILED, items.length);
				}
			} finally {
				cleanup();
			}
		}
		/**
		* Returns the effective AbortSignal for downloads.
		* Combines the orchestrator's signal with the caller's signal (if any)
		* so that either aborting the orchestrator or the caller's signal cancels
		* the download. Falls back to just the orchestrator's signal when no
		* caller signal is provided.
		*
		* @returns An object with the merged signal and a cleanup function to
		* remove abort listeners from the input signals. Call cleanup() after
		* the download settles to prevent listener accumulation.
		*/
		mergeSignal(callerSignal) {
			if (!callerSignal) return {
				signal: this.abortController.signal,
				cleanup: () => {}
			};
			return mergeAbortSignals(this.abortController.signal, callerSignal);
		}
		/**
		* Save blob using DownloadAdapter (relies to background SW or GM_download)
		* @internal
		*/
		async saveWithDownloadAdapter(blob, filename, signal) {
			const adapter = getDownloadAdapter();
			try {
				await adapter.downloadBlob(blob, filename, signal);
				return { success: true };
			} catch (error) {
				return {
					success: false,
					error: normalizeErrorMessage(error)
				};
			}
		}
	};
	var { getInstance: getDownloadOrchestrator, resetForTests: resetDownloadOrchestratorForTests } = createSingleton(() => new DownloadOrchestrator());
	//#endregion
	//#region src/features/gallery/hooks/use-gallery-download.ts
	/**
	* @fileoverview Gallery download hook - manages single and batch download.
	*/
	/**
	* Hook providing gallery download functionality.
	* Handles single and bulk downloads with progress tracking, error handling,
	* and GM_notification integration for userscript environments.
	*
	* @returns Download handler functions and reactive state
	*/
	function createDownloadHandler() {
		const notify = getNotificationAdapter();
		let abortController = new AbortController();
		const resetAbortController = () => {
			abortController = new AbortController();
		};
		const getDownloadErrorNotification = (error) => {
			const message = normalizeErrorMessage(error);
			try {
				const languageService = getLanguageService();
				return {
					title: languageService.translate("msg.dl.one.err.t"),
					body: languageService.translate("msg.dl.one.err.b", { error: message })
				};
			} catch {
				return {
					title: "Download failed",
					body: message
				};
			}
		};
		const handleDownload = async (type) => {
			const signal = abortController.signal;
			if (signal.aborted) {
				setDownloading(false);
				return;
			}
			setError(null);
			setDownloading(true);
			const notifyError = (title, body) => {
				notify.notify(title, body);
			};
			try {
				const languageService = getLanguageService();
				const mediaItems = gallerySignals.mediaItems;
				const mediaService = getMediaService();
				const downloadService = getDownloadOrchestrator();
				if (type === "current") {
					const currentMedia = mediaItems[gallerySignals.currentIndex];
					if (currentMedia) {
						let blob;
						try {
							const pending = mediaService.getCachedMedia(currentMedia.url);
							if (pending) blob = await pending;
						} catch {}
						const result = await downloadService.downloadSingle(currentMedia, {
							...blob ? { blob } : {},
							signal
						});
						if (!result.success && result.error !== "Download cancelled by user") {
							const error = result.error || "Unknown error";
							const title = languageService.translate("msg.dl.one.err.t");
							const body = languageService.translate("msg.dl.one.err.b", { error });
							setError(body);
							notifyError(title, body);
						}
					} else notifyError(languageService.translate("msg.dl.one.err.t"), languageService.translate("msg.dl.noMedia"));
				} else {
					const prefetchedBlobs = /* @__PURE__ */ new Map();
					for (const item of mediaItems) {
						if (!item) continue;
						const pending = mediaService.getCachedMedia(item.url);
						if (!pending) continue;
						prefetchedBlobs.set(item.url, pending);
					}
					const result = await downloadService.downloadBulk([...mediaItems], {
						...prefetchedBlobs.size > 0 ? { prefetchedBlobs } : {},
						signal
					});
					if (!result.success) {
						if (result.code === "CANCELLED") return;
						if (result.filesSuccessful === 0) {
							const title = languageService.translate("msg.dl.allFail.t");
							const body = languageService.translate("msg.dl.allFail.b");
							setError(body);
							notifyError(title, body);
						} else {
							const error = result.error || languageService.translate("msg.dl.zipFail");
							const title = languageService.translate("msg.dl.one.err.t");
							const body = languageService.translate("msg.dl.one.err.b", { error });
							setError(body);
							notifyError(title, body);
						}
						return;
					}
					if (result.status === "partial") {
						const failures = Math.max(0, result.filesProcessed - result.filesSuccessful);
						if (failures > 0) {
							const title = languageService.translate("msg.dl.part.t");
							const body = languageService.translate("msg.dl.part.b", { count: failures });
							setError(body);
							notifyError(title, body);
						}
					}
				}
			} catch (error) {
				logger.error("Download failed", error);
				const { title, body } = getDownloadErrorNotification(error);
				setError(body);
				notifyError(title, body);
			} finally {
				setDownloading(false);
			}
		};
		const cancelDownloads = () => {
			abortController.abort();
			resetAbortController();
		};
		return {
			handleDownload,
			cancelDownloads
		};
	}
	//#endregion
	//#region src/shared/dom/background-visibility.ts
	var GALLERY_HIDDEN_MARKER = "data-xeg-gallery-hidden";
	var previousAriaHidden = /* @__PURE__ */ new WeakMap();
	function hideBackgroundElement(element) {
		if (!previousAriaHidden.has(element)) previousAriaHidden.set(element, element.getAttribute("aria-hidden"));
		element.setAttribute(GALLERY_HIDDEN_MARKER, "");
		element.setAttribute("aria-hidden", "true");
	}
	function restoreBackgroundElement(element) {
		if (!previousAriaHidden.has(element) && !element.hasAttribute(GALLERY_HIDDEN_MARKER)) return;
		const previous = previousAriaHidden.get(element);
		if (previous === null || previous === void 0) element.removeAttribute("aria-hidden");
		else element.setAttribute("aria-hidden", previous);
		previousAriaHidden.delete(element);
		element.removeAttribute(GALLERY_HIDDEN_MARKER);
	}
	function isHiddenByGallery(element) {
		return element.hasAttribute(GALLERY_HIDDEN_MARKER);
	}
	//#endregion
	//#region src/shared/components/isolation/GalleryContainer.tsx
	var _tmpl$$2 = /*#__PURE__*/ template(`<div data-xeg-gallery-container role=dialog aria-modal=true tabindex=-1>`);
	var DISPOSE_SYMBOL = Symbol();
	function mountGallery(container, element) {
		const host = container;
		host[DISPOSE_SYMBOL]?.();
		host[DISPOSE_SYMBOL] = render(typeof element === "function" ? element : () => element ?? null, host);
		return container;
	}
	function unmountGallery(container) {
		const host = container;
		host[DISPOSE_SYMBOL]?.();
		delete host[DISPOSE_SYMBOL];
		container.replaceChildren();
	}
	function GalleryContainer(props) {
		const [local] = splitProps(props, [
			"children",
			"className",
			"lang",
			"dir"
		]);
		const translate = useTranslation();
		const classes = cx(CSS.CLASSES.OVERLAY, CSS.CLASSES.CONTAINER, local.className);
		let containerEl;
		createEffect(() => {
			if (!containerEl) return;
			const applyColorScheme = (el) => {
				const theme = el.getAttribute("data-theme");
				if (theme === "dark") el.style.setProperty("color-scheme", "dark");
				else if (theme === "light") el.style.setProperty("color-scheme", "light");
				else {
					const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
					el.style.setProperty("color-scheme", prefersDark ? "dark" : "light");
				}
			};
			applyColorScheme(containerEl);
			const observer = new MutationObserver(() => {
				if (containerEl) applyColorScheme(containerEl);
			});
			observer.observe(containerEl, {
				attributes: true,
				attributeFilter: ["data-theme"]
			});
			onCleanup(() => {
				observer.disconnect();
			});
		});
		createEffect(() => {
			if (!containerEl) return;
			const focusableSelectors = [
				"a[href]",
				"button:not([disabled])",
				"iframe",
				"input:not([disabled])",
				"select:not([disabled])",
				"textarea:not([disabled])",
				"[tabindex]:not([tabindex=\"-1\"])"
			].join(", ");
			const handleKeyDown = (event) => {
				if (event.key !== "Tab") return;
				const focusableElements = Array.from(containerEl.querySelectorAll(focusableSelectors)).filter((el) => !el.hasAttribute("aria-hidden") && (el.getClientRects().length > 0 || !el.hasAttribute("disabled") && getComputedStyle(el).visibility !== "hidden"));
				if (focusableElements.length === 0) return;
				const firstElement = focusableElements[0];
				const lastElement = focusableElements[focusableElements.length - 1];
				if (!firstElement || !lastElement) return;
				if (event.shiftKey) {
					if (document.activeElement === firstElement) {
						event.preventDefault();
						lastElement.focus();
					}
				} else if (document.activeElement === lastElement) {
					event.preventDefault();
					firstElement.focus();
				}
			};
			containerEl.addEventListener("keydown", handleKeyDown);
			onCleanup(() => {
				containerEl?.removeEventListener("keydown", handleKeyDown);
			});
		});
		let scrollRestoration = null;
		let previousScrollRestoration = null;
		let previouslyFocusedElement = null;
		let hiddenBackgroundElements = [];
		createEffect(() => {
			if (!scrollRestoration) {
				previouslyFocusedElement = document.activeElement;
				if ("scrollRestoration" in window.history) {
					previousScrollRestoration = window.history.scrollRestoration;
					window.history.scrollRestoration = "manual";
				}
				scrollRestoration = {
					scrollY: window.scrollY,
					overflow: document.body.style.overflow,
					position: document.body.style.position,
					top: document.body.style.top,
					left: document.body.style.left,
					right: document.body.style.right
				};
				document.body.style.overflow = "hidden";
				document.body.style.position = "fixed";
				document.body.style.top = `-${scrollRestoration.scrollY}px`;
				document.body.style.left = "0";
				document.body.style.right = "0";
				const children = Array.from(document.body.children);
				const containerElement = containerEl;
				if (!containerElement || containerElement.parentElement === document.body) hiddenBackgroundElements = children.filter((el) => el !== containerElement && el instanceof HTMLElement);
				else hiddenBackgroundElements = children.filter((el) => el instanceof HTMLElement && !el.contains(containerElement));
				for (const el of hiddenBackgroundElements) hideBackgroundElement(el);
				if (containerElement) {
					containerElement.focus();
					if (document.activeElement !== containerElement) containerElement.querySelector("button, [href], input, select, textarea, [tabindex]:not([tabindex=\"-1\"])")?.focus();
				}
			}
		});
		onCleanup(() => {
			if (scrollRestoration) {
				document.body.style.overflow = scrollRestoration.overflow;
				document.body.style.position = scrollRestoration.position;
				document.body.style.top = scrollRestoration.top;
				document.body.style.left = scrollRestoration.left;
				document.body.style.right = scrollRestoration.right;
				window.scrollTo(0, scrollRestoration.scrollY);
				if ("scrollRestoration" in window.history) window.history.scrollRestoration = previousScrollRestoration ?? "auto";
				scrollRestoration = null;
			}
			for (const el of hiddenBackgroundElements) restoreBackgroundElement(el);
			hiddenBackgroundElements = [];
			if (previouslyFocusedElement && typeof previouslyFocusedElement.focus === "function") {
				try {
					previouslyFocusedElement.focus();
				} catch {}
				previouslyFocusedElement = null;
			}
		});
		return (() => {
			var _el$ = _tmpl$$2();
			use((el) => {
				containerEl = el;
			}, _el$);
			className(_el$, classes);
			insert(_el$, () => local.children);
			createRenderEffect((_p$) => {
				var _v$ = translate("msg.gal.imageGallery"), _v$2 = local.lang ?? "en", _v$3 = local.dir ?? "ltr";
				_v$ !== _p$.e && setAttribute(_el$, "aria-label", _p$.e = _v$);
				_v$2 !== _p$.t && setAttribute(_el$, "lang", _p$.t = _v$2);
				_v$3 !== _p$.a && setAttribute(_el$, "dir", _p$.a = _v$3);
				return _p$;
			}, {
				e: void 0,
				t: void 0,
				a: void 0
			});
			return _el$;
		})();
	}
	var ErrorBoundary_module_default = {
		xegErrorBoundaryTitle: "xg-Rr2-",
		xegErrorBoundaryBody: "xg-yRlq",
		xegErrorBoundaryAction: "xg-hFWG",
		xegErrorBoundaryReset: "xg-Mhri"
	};
	//#endregion
	//#region src/shared/components/ui/ErrorBoundary/ErrorBoundary.tsx
	/**
	* @fileoverview Wraps SolidJS `<ErrorBoundary>` with localized error notifications.
	* Provides a retry-friendly fallback UI and deduplicates error notifications.
	*/
	var _tmpl$$1 = /*#__PURE__*/ template(`<button type=button>`);
	var _tmpl$2 = /*#__PURE__*/ template(`<div aria-live=polite data-xeg-error-boundary><p></p><p></p><button type=button>`);
	/** Maximum number of retry attempts before disabling the retry button. */
	var MAX_RETRIES = 3;
	/** Auto-reset timeout in milliseconds after retries are exhausted. */
	var AUTO_RESET_MS = 3e4;
	/**
	* Returns localized error title and body using language service.
	*/
	function translateError(error) {
		try {
			const lang = getLanguageService();
			return {
				title: lang.translate("msg.err.t"),
				body: lang.translate("msg.err.b", { error: normalizeErrorMessage(error) })
			};
		} catch {
			return {
				body: normalizeErrorMessage(error),
				title: "Unexpected error"
			};
		}
	}
	/**
	* Error Boundary component with localized notifications and retry support.
	*/
	function ErrorBoundary(props) {
		const [local] = splitProps(props, ["children", "onError"]);
		const [lastError, setLastError] = createSignal(void 0);
		const [caughtError, setCaughtError] = createSignal(void 0);
		const [mounted, setMounted] = createSignal(true);
		const [retryCount, setRetryCount] = createSignal(0);
		let autoResetTimer;
		const scheduleAutoReset = () => {
			if (autoResetTimer) clearTimeout(autoResetTimer);
			autoResetTimer = setTimeout(() => {
				handleReset();
			}, AUTO_RESET_MS);
		};
		onCleanup(() => {
			if (autoResetTimer) clearTimeout(autoResetTimer);
		});
		const notifyError = (error) => {
			if (lastError() === error) return;
			setLastError(error);
			const { title, body } = translateError(error);
			getNotificationAdapter().notify(title, body);
		};
		const handleRetry = () => {
			if (retryCount() >= MAX_RETRIES) return;
			setLastError(void 0);
			setCaughtError(void 0);
			const nextCount = retryCount() + 1;
			setRetryCount(nextCount);
			setMounted(false);
			queueMicrotask(() => setMounted(true));
			if (nextCount >= MAX_RETRIES) scheduleAutoReset();
		};
		const handleReset = () => {
			if (autoResetTimer) {
				clearTimeout(autoResetTimer);
				autoResetTimer = void 0;
			}
			setLastError(void 0);
			setCaughtError(void 0);
			setRetryCount(0);
			setMounted(false);
			queueMicrotask(() => setMounted(true));
		};
		const getRetryLabel = () => {
			try {
				const lang = getLanguageService();
				if (retryCount() >= MAX_RETRIES) return lang.translate("msg.err.noMoreRetries");
				return lang.translate("msg.err.retry");
			} catch {
				if (retryCount() >= MAX_RETRIES) return "No more retries";
				return "Retry";
			}
		};
		return [createComponent(Show, {
			get when() {
				return mounted();
			},
			get children() {
				return createComponent(ErrorBoundary$1, {
					fallback: (error) => {
						notifyError(error);
						setCaughtError(error);
						local.onError?.(error);
						return null;
					},
					get children() {
						return local.children;
					}
				});
			}
		}), createComponent(Show, {
			get when() {
				return caughtError();
			},
			children: (error) => {
				const { title, body } = translateError(error());
				const exhausted = retryCount() >= MAX_RETRIES;
				return (() => {
					var _el$ = _tmpl$2(), _el$2 = _el$.firstChild, _el$3 = _el$2.nextSibling, _el$4 = _el$3.nextSibling;
					insert(_el$2, title);
					insert(_el$3, body);
					_el$4.$$click = handleRetry;
					_el$4.disabled = exhausted;
					insert(_el$4, getRetryLabel);
					insert(_el$, createComponent(Show, {
						when: exhausted,
						get children() {
							var _el$5 = _tmpl$$1();
							_el$5.$$click = handleReset;
							insert(_el$5, () => {
								try {
									return getLanguageService().translate("msg.err.reset");
								} catch {
									return "Reset";
								}
							});
							createRenderEffect(() => className(_el$5, `${ErrorBoundary_module_default["xeg-error-boundary__action"]} ${ErrorBoundary_module_default["xeg-error-boundary__reset"]}`));
							return _el$5;
						}
					}), null);
					createRenderEffect((_p$) => {
						var _v$ = ErrorBoundary_module_default["xeg-error-boundary__title"], _v$2 = ErrorBoundary_module_default["xeg-error-boundary__body"], _v$3 = ErrorBoundary_module_default["xeg-error-boundary__action"];
						_v$ !== _p$.e && className(_el$2, _p$.e = _v$);
						_v$2 !== _p$.t && className(_el$3, _p$.t = _v$2);
						_v$3 !== _p$.a && className(_el$4, _p$.a = _v$3);
						return _p$;
					}, {
						e: void 0,
						t: void 0,
						a: void 0
					});
					return _el$;
				})();
			}
		})];
	}
	delegateEvents(["click"]);
	//#endregion
	//#region src/features/gallery/gallery-renderer.tsx
	/** Handles rendering and lifecycle of the gallery component. */
	var _tmpl$ = /*#__PURE__*/ template(`<div aria-live=polite class=xeg-sr-only aria-atomic=true>`);
	function GalleryRoot(props) {
		const [local] = splitProps(props, [
			"onClose",
			"onDownloadCurrent",
			"onDownloadAll"
		]);
		const themeService = getThemeService();
		const languageService = getLanguageService();
		const [currentTheme, setCurrentTheme] = createSignal(themeService.getCurrentTheme());
		const [currentLanguage, setCurrentLanguage] = createSignal(languageService.getCurrentLanguage());
		const unbindTheme = themeService.onThemeChange((_, setting) => setCurrentTheme(setting));
		const unbindLanguage = languageService.onLanguageChange((lang) => setCurrentLanguage(lang));
		onCleanup(() => {
			unbindTheme();
			unbindLanguage();
		});
		/** Resolve 'auto' to actual language code for the lang attribute */
		const resolvedLanguage = () => {
			const lang = currentLanguage();
			if (lang === "auto") return languageService.detectLanguage();
			return lang;
		};
		/** Determine text direction for RTL languages like Arabic */
		const dir = () => resolvedLanguage() === "ar" ? "rtl" : "ltr";
		const handleRenderError = () => {
			document.body.style.overflow = "";
			document.body.style.position = "";
			document.body.style.top = "";
			document.body.style.left = "";
			document.body.style.right = "";
			if ("scrollRestoration" in window.history) window.history.scrollRestoration = "auto";
			for (const el of Array.from(document.body.children)) if (el instanceof HTMLElement && isHiddenByGallery(el)) restoreBackgroundElement(el);
		};
		return createComponent(ErrorBoundary, {
			onError: handleRenderError,
			get children() {
				return createComponent(GalleryContainer, {
					get className() {
						return `${CSS.CLASSES.RENDERER} ${CSS.CLASSES.ROOT} xeg-theme-scope`;
					},
					get ["data-theme"]() {
						return currentTheme();
					},
					get ["data-language"]() {
						return currentLanguage();
					},
					get lang() {
						return resolvedLanguage();
					},
					get dir() {
						return dir();
					},
					get children() {
						return [(() => {
							var _el$ = _tmpl$();
							insert(_el$, () => gallerySignals.error ?? "");
							return _el$;
						})(), createComponent(VerticalGalleryView, {
							get onClose() {
								return local.onClose;
							},
							onPrevious: () => navigatePrevious("button"),
							onNext: () => navigateNext("button"),
							onDownloadCurrent: () => local.onDownloadCurrent(),
							onDownloadAll: () => local.onDownloadAll(),
							get className() {
								return CSS.CLASSES.VERTICAL_VIEW;
							}
						})];
					}
				});
			}
		});
	}
	var GalleryRenderer = class {
		container = null;
		isMounting = false;
		destroyed = false;
		stateUnsubscribe = null;
		downloadHandler;
		constructor() {
			this.downloadHandler = createDownloadHandler();
			this.setupStateSubscription();
		}
		setupStateSubscription() {
			this.stateUnsubscribe = createEffectRoot(() => {
				if (this.destroyed) return;
				if (gallerySignals.isOpen && !this.container) this.renderGallery();
				else if (!gallerySignals.isOpen && this.container) this.cleanupGallery();
			});
		}
		renderGallery() {
			if (this.isMounting || this.container) return;
			if (!gallerySignals.isOpen || gallerySignals.mediaItems.length === 0) return;
			this.isMounting = true;
			try {
				this.createContainer();
				this.renderComponent();
			} catch (error) {
				logger.error("Render failed", error);
				this.cleanupContainer();
				this.container = null;
				setError(normalizeErrorMessage(error));
			} finally {
				this.isMounting = false;
			}
		}
		createContainer() {
			this.cleanupContainer();
			this.container = document.createElement("div");
			this.container.className = CSS.CLASSES.RENDERER;
			this.container.setAttribute("data-renderer", "gallery");
			document.body.appendChild(this.container);
		}
		renderComponent() {
			if (!this.container) return;
			const handleClose = () => {
				closeGallery();
			};
			mountGallery(this.container, () => {
				const _self$ = this;
				return createComponent(GalleryRoot, {
					onClose: handleClose,
					onDownloadCurrent: () => _self$.downloadHandler.handleDownload("current"),
					onDownloadAll: () => _self$.downloadHandler.handleDownload("all")
				});
			});
		}
		cleanupGallery() {
			this.isMounting = false;
			this.downloadHandler.cancelDownloads();
			this.cleanupContainer();
		}
		cleanupContainer() {
			if (this.container) {
				const container = this.container;
				try {
					unmountGallery(container);
				} catch (error) {}
				try {
					container.remove();
				} catch (error) {} finally {
					this.container = null;
				}
			}
		}
		render(mediaItems, renderOptions) {
			openGallery(mediaItems, renderOptions?.startIndex ?? 0);
		}
		close() {
			if (!gallerySignals.isOpen) return;
			closeGallery();
		}
		isRendering() {
			return !!(this.container && gallerySignals.isOpen);
		}
		destroy() {
			this.destroyed = true;
			this.stateUnsubscribe?.();
			this.stateUnsubscribe = null;
			this.cleanupGallery();
		}
	};
	//#endregion
	//#region src/features/settings/services/settings-migration.ts
	function pruneWithTemplate(input, template, depth = 0) {
		if (!isRecord(input)) return {};
		if (depth > 10) return {};
		const out = {};
		for (const key of Object.keys(template)) {
			const tplVal = template[key];
			const inVal = input[key];
			if (inVal === void 0) continue;
			if (isRecord(tplVal) && !Array.isArray(tplVal)) out[key] = pruneWithTemplate(inVal, tplVal, depth + 1);
			else out[key] = inVal;
		}
		return out;
	}
	/** Valid video click mode values for runtime validation */
	var VALID_VIDEO_CLICK_MODES = [
		"block-all",
		"block-controls-only",
		"allow-all"
	];
	/**
	* Migrate legacy `blockVideoControlClick` + `preciseVideoControlDetection`
	* booleans to the unified `videoClickMode` enum.
	*/
	function migrateVideoClickMode(gallery) {
		const blockAll = gallery.blockVideoControlClick;
		const precise = gallery.preciseVideoControlDetection;
		if (typeof gallery.videoClickMode === "string") {
			if (VALID_VIDEO_CLICK_MODES.includes(gallery.videoClickMode)) return {};
		}
		if (blockAll === false) return { videoClickMode: "allow-all" };
		if (blockAll === true && precise === false) return { videoClickMode: "block-all" };
		if (blockAll !== void 0) return { videoClickMode: "block-controls-only" };
		return {};
	}
	function migrateSettings(input, nowMs) {
		if (isRecord(input.gallery)) {
			const migration = migrateVideoClickMode(input.gallery);
			if (migration.videoClickMode) input.gallery.videoClickMode = migration.videoClickMode;
		}
		const pruned = pruneWithTemplate(input, DEFAULT_SETTINGS);
		const merged = {
			...DEFAULT_SETTINGS,
			...pruned
		};
		for (const key of [
			"gallery",
			"toolbar",
			"download",
			"accessibility",
			"features"
		]) merged[key] = {
			...DEFAULT_SETTINGS[key],
			...pruned[key] ?? {}
		};
		return {
			...merged,
			version: DEFAULT_SETTINGS.version,
			lastModified: nowMs
		};
	}
	//#endregion
	//#region src/features/settings/services/settings-repository.ts
	/** Schema version hash - bump when persisted settings shape changes */
	var SETTINGS_SCHEMA_HASH = "1";
	var PersistentSettingsRepository = class {
		storage = getPersistentStorage();
		schemaHash = SETTINGS_SCHEMA_HASH;
		async load() {
			const stored = await this.storage.get(APP_SETTINGS_STORAGE_KEY);
			if (!stored) return globalThis.structuredClone(createDefaultSettings(Date.now()));
			const migrated = migrateSettings(stored, Date.now());
			if (stored.__schemaHash !== this.schemaHash) await this.persist(migrated).catch(() => {});
			return globalThis.structuredClone(migrated);
		}
		async save(settings) {
			await this.persist(settings);
		}
		async persist(settings) {
			await this.storage.set(APP_SETTINGS_STORAGE_KEY, {
				...settings,
				__schemaHash: this.schemaHash
			});
		}
	};
	//#endregion
	//#region src/features/settings/services/settings-service.ts
	var SettingsService = class {
		repository;
		_initialized = false;
		settings = createDefaultSettings(Date.now());
		listeners = /* @__PURE__ */ new Set();
		persistQueue = Promise.resolve();
		constructor(repository = new PersistentSettingsRepository()) {
			this.repository = repository;
		}
		async initialize() {
			if (this._initialized) return;
			this.settings = await this.repository.load();
			this._initialized = true;
		}
		destroy() {
			if (!this._initialized) return;
			this.listeners.clear();
			this._initialized = false;
		}
		isInitialized() {
			return this._initialized;
		}
		get(key) {
			const value = resolveNestedPath(this.settings, key);
			return value === void 0 ? this.getDefaultValue(key) : value;
		}
		async set(key, value) {
			if (!this.isValidSettingValue(this.getDefaultValue(key), value)) throw new Error(`Invalid setting value for ${key}`);
			const oldValue = this.get(key);
			if (oldValue === value) return;
			if (!this.assignNestedPath(this.settings, key, value)) throw new Error(`Failed to assign setting value for ${key}`);
			const timestamp = Date.now();
			this.settings.lastModified = timestamp;
			this.notifyListeners({
				key,
				oldValue,
				newValue: value,
				timestamp,
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
		async persist() {
			const prev = this.persistQueue;
			this.persistQueue = prev.then(() => this.repository.save(this.settings), () => this.repository.save(this.settings));
			await this.persistQueue;
		}
		getDefaultValue(key) {
			return resolveNestedPath(DEFAULT_SETTINGS, key);
		}
		/** Assign value to nested object property by dot-notation path */
		assignNestedPath(target, path, value) {
			if (target === null || typeof target !== "object") return false;
			if (typeof path !== "string" || path === "") return false;
			const segments = path.split(".");
			const last = segments[segments.length - 1];
			if (!last) return false;
			let current = target;
			for (let i = 0; i < segments.length - 1; i++) {
				const segment = segments[i];
				if (!segment) return false;
				const existing = Object.hasOwn(current, segment) ? current[segment] : void 0;
				if (existing === null || typeof existing !== "object") {
					const next = Object.create(null);
					current[segment] = next;
					current = next;
					continue;
				}
				current = existing;
			}
			current[last] = value;
			return true;
		}
		/** Validate a setting value against its default type */
		isValidSettingValue(defaultValue, value) {
			if (defaultValue === void 0) return true;
			if (Array.isArray(defaultValue)) return Array.isArray(value);
			if (typeof defaultValue === "object" && defaultValue !== null) return typeof value === "object" && value !== null;
			return typeof value === typeof defaultValue;
		}
		notifyListeners(event) {
			for (const listener of this.listeners) try {
				listener(event);
			} catch (error) {}
		}
	};
	var { getInstance: getSettingsService, resetForTests: resetSettingsServiceForTests } = createSingleton(() => new SettingsService());
	//#endregion
	//#region src/bootstrap/gallery-init.ts
	/**
	* @fileoverview Gallery bootstrap helpers.
	*/
	async function initializeCoreBaseServices() {
		const services = [
			getThemeService(),
			getLanguageService(),
			getMediaService()
		];
		await Promise.all(services.map((s) => s.initialize()));
	}
	async function initializeSettingsService() {
		const settings = getSettingsService();
		await settings.initialize();
		registerSettings(settings);
	}
	async function initializeGalleryServices() {
		try {
			await initializeSettingsService();
		} catch (error) {
			settingsErrorReporter.warn(error, { code: "SETTINGS_SERVICE_INIT_FAILED" });
			const lang = getLanguageService();
			getNotificationAdapter().notify(lang.translate("msg.err.settingsUnavailable.title"), lang.translate("msg.err.settingsUnavailable.body"));
		}
	}
	async function initializeGalleryApp() {
		try {
			const galleryApp = new GalleryApp(new GalleryRenderer());
			await galleryApp.initialize();
			return galleryApp;
		} catch (error) {
			galleryErrorReporter.error(error, { code: "GALLERY_APP_INIT_FAILED" });
			throw error;
		}
	}
	//#endregion
	//#region src/bootstrap/utils.ts
	/**
	* @fileoverview Bootstrap stage execution utilities
	*/
	async function executeStage(stage) {
		const startTime = performance.now();
		if (stage.shouldRun && !stage.shouldRun()) return {
			label: stage.label,
			success: true,
			optional: stage.optional ?? false,
			error: void 0,
			durationMs: 0
		};
		try {
			await Promise.resolve(stage.run());
			const durationMs = performance.now() - startTime;
			return {
				label: stage.label,
				success: true,
				optional: stage.optional ?? false,
				error: void 0,
				durationMs
			};
		} catch (error) {
			const durationMs = performance.now() - startTime;
			if (stage.optional) bootstrapErrorReporter.warn(error, {
				code: "STAGE_OPTIONAL_FAILED",
				metadata: {
					stage: stage.label,
					durationMs
				}
			});
			else bootstrapErrorReporter.error(error, {
				code: "STAGE_FAILED",
				metadata: {
					stage: stage.label,
					durationMs
				}
			});
			return {
				label: stage.label,
				success: false,
				optional: stage.optional ?? false,
				error,
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
			if (!result.success && !result.optional && stopOnFailure) {
				logger.error(`[bootstrap] Critical stage failed: ${stage.label}`);
				break;
			}
		}
		return results;
	}
	//#endregion
	//#region src/shared/error/error-handler.ts
	/**
	* @fileoverview Global error handler for uncaught errors and unhandled rejections
	* @description Singleton service that captures and logs runtime errors (dev mode).
	*/
	var formatErrorLocation = (filename, lineno, colno) => filename && `${filename}:${lineno ?? 0}:${colno ?? 0}`;
	var formatRejectionMessage = (reason) => {
		const message = normalizeErrorMessage(reason);
		if (reason instanceof Error) return message;
		if (typeof reason === "string") return message;
		return `Unhandled rejection: ${message}`;
	};
	var GlobalErrorHandler = class {
		isInitialized = false;
		controller = null;
		destroy() {
			this.controller?.abort();
			this.controller = null;
			getEventManager().removeByContext("global-error-handler");
			this.isInitialized = false;
		}
		errorListener = (event) => {
			formatErrorLocation(event.filename, event.lineno, event.colno);
		};
		rejectionListener = (event) => {
			formatRejectionMessage(event.reason);
		};
		/**
		* Initialize the global error handler.
		* Sets up listeners for uncaught errors and unhandled promise rejections.
		* Safe to call multiple times - subsequent calls are ignored.
		*/
		initialize() {
			if (this.isInitialized) return;
			const eventManager = getEventManager();
			this.controller = new AbortController();
			eventManager.addEventListener(window, "error", this.errorListener, {
				signal: this.controller.signal,
				context: "global-error-handler"
			});
			eventManager.addEventListener(window, "unhandledrejection", this.rejectionListener, {
				signal: this.controller.signal,
				context: "global-error-handler"
			});
			this.isInitialized = true;
		}
	};
	var { getInstance: getGlobalErrorHandler, resetForTests: resetGlobalErrorHandlerForTests } = createSingleton(() => new GlobalErrorHandler());
	//#endregion
	//#region src/main.ts
	/**
	* @fileoverview Main entry. Orchestrates bootstrap stages, startup, and cleanup.
	*/
	var lifecycleState = {
		started: false,
		startPromise: null,
		cleanupPromise: null,
		galleryApp: null
	};
	var navigationIntent = 0;
	function wireGlobalEvents(onBeforeUnload) {
		const controller = new AbortController();
		const handler = () => {
			controller.abort();
			onBeforeUnload();
		};
		getEventManager().addEventListener(window, "pagehide", handler, {
			once: true,
			passive: true,
			signal: controller.signal,
			context: "bootstrap:pagehide"
		});
		return () => {
			controller.abort();
		};
	}
	/**
	* Module-level teardown handle for global event handlers.
	*
	* SAFETY: setupGlobalEventHandlers() always calls tearDownGlobalEventHandlers()
	* BEFORE overwriting this variable, so re-initialization (e.g., if the
	* bootstrap stage runs twice) never silently drops the first teardown.
	* The teardown is also called during cleanup() to ensure orderly shutdown.
	*/
	var globalEventTeardown = null;
	var bfcacheRecoveryTeardown = null;
	function tearDownGlobalEventHandlers(options) {
		if (globalEventTeardown) {
			const teardown = globalEventTeardown;
			globalEventTeardown = null;
			try {
				teardown();
			} catch (error) {}
		}
		if (!options?.preserveBFCacheRecovery && bfcacheRecoveryTeardown) {
			const teardown = bfcacheRecoveryTeardown;
			bfcacheRecoveryTeardown = null;
			try {
				teardown();
			} catch (error) {}
		}
	}
	function wireBFCacheRecovery(restart) {
		const controller = new AbortController();
		const handler = (event) => {
			if (event.persisted) {
				if (!isAllowedStartPage()) return;
				(async () => {
					if (lifecycleState.cleanupPromise) await lifecycleState.cleanupPromise;
					await restart();
				})().catch((error) => {});
			}
		};
		getEventManager().addEventListener(window, "pageshow", handler, {
			signal: controller.signal,
			context: "bootstrap:pageshow"
		});
		return () => controller.abort();
	}
	function setupGlobalEventHandlers() {
		tearDownGlobalEventHandlers();
		globalEventTeardown = wireGlobalEvents(() => {
			cleanup().catch((error) => {});
		});
		bfcacheRecoveryTeardown = wireBFCacheRecovery(startApplication);
	}
	async function runOptionalCleanup(label, task) {
		try {
			await task();
		} catch (error) {}
	}
	function buildStages() {
		return [
			{
				label: "Error handler",
				run: () => getGlobalErrorHandler().initialize()
			},
			{
				label: "Settings",
				run: initializeGalleryServices,
				optional: true
			},
			{
				label: "Core services (Theme / Language / Media)",
				run: initializeCoreBaseServices,
				optional: true
			},
			{
				label: "Global event wiring",
				run: setupGlobalEventHandlers
			},
			{
				label: "Gallery initialization",
				run: initializeGallery,
				shouldRun: () => true
			}
		];
	}
	async function runBootstrapStages() {
		const failed = (await executeStages(buildStages(), { stopOnFailure: true })).find((r) => !r.success && !r.optional);
		if (failed) throw failed.error ?? /* @__PURE__ */ new Error(`Bootstrap stage failed: ${failed.label}`);
	}
	async function initializeGallery() {
		try {
			lifecycleState.galleryApp = await initializeGalleryApp();
		} catch (error) {
			lifecycleState.galleryApp = null;
			galleryErrorReporter.error(error, { code: "GALLERY_INIT_FAILED" });
			throw error;
		}
	}
	async function performCleanup() {
		try {
			const pendingStart = lifecycleState.startPromise;
			if (pendingStart) await pendingStart.catch(() => void 0);
			lifecycleState.started = false;
			await runOptionalCleanup("gallery", async () => {
				const app = lifecycleState.galleryApp;
				lifecycleState.galleryApp = null;
				if (app) await app.cleanup();
			});
			await runOptionalCleanup("theme-service", () => {
				const ts = getThemeService();
				if (ts.isInitialized()) ts.destroy();
			});
			tearDownGlobalEventHandlers({ preserveBFCacheRecovery: true });
			await runOptionalCleanup("error-handler", () => getGlobalErrorHandler().destroy());
			clearSettings();
		} catch (error) {
			bootstrapErrorReporter.error(error, { code: "CLEANUP_FAILED" });
			throw error;
		}
	}
	function cleanup() {
		if (lifecycleState.cleanupPromise) return lifecycleState.cleanupPromise;
		let cleanupRun;
		cleanupRun = performCleanup().then(() => {
			if (lifecycleState.cleanupPromise === cleanupRun) lifecycleState.cleanupPromise = null;
		}, (error) => {
			if (lifecycleState.cleanupPromise === cleanupRun) lifecycleState.cleanupPromise = null;
			throw error;
		});
		lifecycleState.cleanupPromise = cleanupRun;
		return cleanupRun;
	}
	async function startApplication() {
		if (lifecycleState.startPromise) return lifecycleState.startPromise;
		if (lifecycleState.started) return;
		if (lifecycleState.cleanupPromise) {
			await lifecycleState.cleanupPromise;
			return startApplication();
		}
		lifecycleState.startPromise = (async () => {
			await runBootstrapStages();
			lifecycleState.started = true;
		})().catch((error) => {
			lifecycleState.started = false;
			bootstrapErrorReporter.error(error, { code: "APP_INIT_FAILED" });
			throw error;
		}).finally(() => {
			lifecycleState.startPromise = null;
		});
		return lifecycleState.startPromise;
	}
	/** Paths where gallery initialization is unnecessary (login, settings, etc.). */
	var EXCLUDED_PATH_PREFIXES = [
		"/login",
		"/logout",
		"/signup",
		"/settings",
		"/i/flow/",
		"/i/settings",
		"/intent/",
		"/share"
	];
	function isAllowedStartPage() {
		return isAllowedStartUrl(location.href);
	}
	function isAllowedStartUrl(value) {
		let url;
		try {
			url = new URL(value, location.href);
		} catch {
			return false;
		}
		const hostname = url.hostname.toLowerCase();
		if (!TWITTER_HOSTS.some((h) => hostname === h || hostname.endsWith(`.${h}`))) return false;
		const path = url.pathname;
		return !EXCLUDED_PATH_PREFIXES.some((prefix) => path.startsWith(prefix));
	}
	function reconcileApplication(allowed) {
		const intent = ++navigationIntent;
		if (allowed) {
			if (lifecycleState.started && !lifecycleState.cleanupPromise) return;
			(async () => {
				if (lifecycleState.cleanupPromise) await lifecycleState.cleanupPromise;
				if (intent !== navigationIntent) return;
				await startApplication();
			})().catch((error) => {});
			return;
		}
		if (lifecycleState.started || lifecycleState.startPromise) cleanup().catch((error) => {});
	}
	if (isAllowedStartPage()) startApplication().catch((error) => {});
	if (typeof navigation !== "undefined") navigation.addEventListener("navigate", (event) => {
		const destination = event.destination?.url;
		if (!destination) return;
		reconcileApplication(isAllowedStartUrl(destination));
	});
	else window.addEventListener("popstate", () => {
		reconcileApplication(isAllowedStartPage());
	});
	//#endregion
	exports.cleanup = cleanup;
	exports.isAllowedStartPage = isAllowedStartPage;
	exports.isAllowedStartUrl = isAllowedStartUrl;
	exports.startApplication = startApplication;
	return exports;
})({});
