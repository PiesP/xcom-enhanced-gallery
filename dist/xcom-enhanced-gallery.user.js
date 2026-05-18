// ==UserScript==
// @name X.com Enhanced Gallery
// @namespace https://github.com/PiesP/xcom-enhanced-gallery
// @version 2.1.1
// @description Media viewer and download functionality for X.com
// @author PiesP
// @license MIT
// Copyright (c) 2024-2026 X.com Enhanced Gallery Contributors
// @homepageURL https://github.com/PiesP/xcom-enhanced-gallery
// @match https://x.com/*
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
// @icon https://abs.twimg.com/favicons/twitter.3.ico
// @compatible chrome 117+
// @compatible firefox 119+
// @compatible edge 117+
// @compatible safari 17+
// @noframes
// ==/UserScript==
(function(){if(typeof document==='undefined')return;var css="@layer xeg.components{:root{--xtt:opacity var(--xdt) var(--xe-s), transform var(--xdt) var(--xe-s), visibility 0s;--xeg-spacing-gallery:clamp(var(--xs-s), 2.5vw, var(--xs-l));--xeg-spacing-mobile:clamp(var(--xs-xs), 2vw, var(--xs-m));--xeg-spacing-compact:clamp(.25rem, 1.5vw, var(--xs-s));--xth-o:0;--xth-v:hidden;--xth-pe:none}.xeg-surface{background:var(--xsu-b);border:.0625rem solid var(--xsu-br);border-radius:var(--xr-l)}.xeg-spinner{width:var(--xsp-s,var(--xsp-sd));height:var(--xsp-s,var(--xsp-sd));border-radius:var(--xr-f);border:var(--xsp-bw) solid var(--xsp-tc);border-top-color:var(--xsp-ic);animation:xeg-spin var(--xsp-d) var(--xsp-e) infinite;box-sizing:border-box;display:inline-block}@media (prefers-reduced-motion:reduce){.xeg-spinner{animation:none}}@keyframes xeg-fade-in{0%{opacity:0}to{opacity:1}}@keyframes xeg-fade-out{0%{opacity:1}to{opacity:0}}@keyframes xeg-spin{0%{transform:rotate(0)}to{transform:rotate(360deg)}}}@media (prefers-reduced-motion:reduce){@layer xeg.components{:root{--xtt:none}.xg-X9gZ{scroll-behavior:auto;transition:none}.xg-meO3{transition:none}}}.xg-X9gZ{width:100vw;height:100vh;z-index:var(--xz-g,10000);background:var(--xg-b);will-change:opacity, transform;contain:layout style paint;opacity:1;visibility:visible;transition:var(--xten);cursor:default;pointer-events:auto;scroll-behavior:smooth;overscroll-behavior:none;flex-direction:column;display:flex;position:fixed;top:0;left:0;container:gallery-container\u002Fsize}.xg-meO3{height:auto;z-index:var(--xz-t,2147480000);opacity:var(--toolbar-opacity,0);visibility:var(--toolbar-visibility,hidden);transition:var(--xtt);will-change:transform, opacity, visibility;contain:layout style;pointer-events:var(--toolbar-pointer-events,none);background:0 0;border:none;border-radius:0;margin:0;padding-block-end:var(--xeg-spacing-gallery);display:block;position:fixed;top:0;left:0;right:0}.xg-meO3:is(:hover,:focus-within){--toolbar-opacity:1;--toolbar-visibility:visible;--toolbar-pointer-events:auto;--toolbar-transform-y:0}.xg-meO3:focus-within{transition:var(--xtef)}.xg-meO3 *{pointer-events:inherit}.xg-meO3 [data-gallery-element=settings-panel][data-expanded=true]{pointer-events:auto}.xg-meO3:has([data-gallery-element=settings-panel][data-expanded=true]){--toolbar-opacity:1;--toolbar-visibility:visible;--toolbar-pointer-events:auto}.xg-X9gZ.xg-9abg{cursor:none}.xg-X9gZ.xg-sOsS[data-xeg-gallery=true][data-xeg-role=gallery] .xg-meO3{--toolbar-opacity:var(--xth-o,0);--toolbar-visibility:var(--xth-v,hidden);--toolbar-pointer-events:var(--xth-pe,none)}.xg-X9gZ *{pointer-events:auto}.xg-gmRW{z-index:0;contain:layout style;overscroll-behavior:contain;scrollbar-gutter:stable;pointer-events:auto;flex-direction:column;flex:1;display:flex;position:relative;overflow:auto;container:items-list\u002Fsize}.xg-gmRW::-webkit-scrollbar{width:var(--xsw)}.xg-gmRW::-webkit-scrollbar-track{background:0 0}.xg-gmRW::-webkit-scrollbar-thumb{background:var(--xeg-scrollbar-thumb-color,var(--xcn3));border-radius:var(--xsbr);transition:background-color var(--xdn) var(--xe-s)}.xg-gmRW::-webkit-scrollbar-thumb:hover{background:var(--xeg-scrollbar-thumb-hover-color,var(--xcn4))}.xg-X9gZ.xg-9abg .xg-meO3{pointer-events:none;opacity:0;transition:opacity var(--xdf) var(--xe-s)}.xg-X9gZ.xg-9abg [data-xeg-role=items-container],.xg-X9gZ.xg-9abg .xg-gmRW{pointer-events:auto}.xg-X9gZ.xg-yhK-{justify-content:center;align-items:center}.xg-EfVa{margin-bottom:var(--xs-m,1rem);border-radius:var(--xr-l,.5rem);transition:var(--xten);contain:layout style;position:relative}.xg-LxHL{z-index:1;position:relative}.xg-sfF0{height:calc(100vh - var(--xeg-toolbar-height,3.75rem));pointer-events:none;user-select:none;opacity:0;contain:strict;content-visibility:auto;background:0 0;flex-shrink:0;min-height:50vh}.xg-gC-m{height:var(--xhzh);z-index:var(--xz-th,2147480000);pointer-events:auto;background:0 0;position:fixed;top:0;left:0;right:0}.xg-X9gZ.xg-Canm:not([data-settings-expanded=true]) .xg-gC-m,.xg-X9gZ:has(.xg-meO3:hover):not([data-settings-expanded=true]) .xg-gC-m{pointer-events:none}.xg-X9gZ.xg-Canm .xg-meO3,.xg-X9gZ:has(.xg-gC-m:hover) .xg-meO3{--toolbar-opacity:1;--toolbar-visibility:visible;--toolbar-pointer-events:auto;--toolbar-transform-y:0}.xg-meO3 [class*=galleryToolbar]{opacity:var(--toolbar-opacity,0);visibility:var(--toolbar-visibility,hidden);pointer-events:var(--toolbar-pointer-events,none);display:flex}.xg-meO3 button,.xg-meO3 [role=button],.xg-meO3 .xg-e06X{pointer-events:auto;z-index:10;position:relative}.xg-fwsr{text-align:center;color:var(--xct-s);max-inline-size:min(25rem,90vw);padding:clamp(1.875rem,5vw,2.5rem)}.xg-fwsr h3{font-size:clamp(1.25rem,4vw,1.5rem);font-weight:var(--xfw-s);color:var(--xct-p);line-height:var(--xeg-line-height-tight);margin:0 0 clamp(.75rem,2vw,1rem)}.xg-fwsr p{font-size:clamp(.875rem,2.5vw,1rem);line-height:var(--xlh);color:var(--xct-t);margin:0}@container gallery-container (width\u003C=48rem){.xg-gmRW{padding:var(--xeg-spacing-mobile);gap:var(--xeg-spacing-mobile)}.xg-meO3{padding-block-end:var(--xeg-spacing-mobile)}}@container gallery-container (width\u003C=30rem){.xg-gmRW{padding:var(--xeg-spacing-compact);gap:var(--xeg-spacing-compact)}}@media (prefers-reduced-motion:reduce){.xg-gmRW{scroll-behavior:auto;will-change:auto;transform:none}.xg-meO3:hover,.xg-meO3:focus-within{transform:none}}.xg-X9gZ [class*=galleryToolbar]:hover{--toolbar-opacity:1;--toolbar-pointer-events:auto}.xg-huYo{margin-bottom:var(--xs-m);border-radius:var(--xr-l);transition:var(--xti);cursor:pointer;border:.0625rem solid var(--xcb-p);background:var(--xcbg-s);padding:var(--xs-s);text-align:center;pointer-events:auto;will-change:transform;contain:layout style;flex-direction:column;align-items:center;width:fit-content;max-width:100%;margin-inline:auto;display:flex;position:relative;overflow:visible}.xg-huYo[data-fit-mode=original]{flex-shrink:0;align-self:center;width:max-content;max-width:none}.xg-huYo:hover{transform:var(--xhl);background:var(--xc-se);border-color:var(--xbe)}.xg-huYo:focus-visible{border-color:var(--xfic,var(--xcb-p))}.xg-huYo.xg-xm-1{border-color:var(--xbe,var(--xcb-s));transition:var(--xti)}.xg-huYo.xg-xm-1:focus-visible{border-color:var(--xfic,var(--xcb-s))}.xg-huYo.xg-luqi{border-color:var(--xfic,var(--xcb-p));transition:var(--xti)}.xg-8-c8{background:var(--xcbg-s);contain:layout paint;justify-content:center;align-items:center;width:fit-content;max-width:100%;margin:0 auto;display:flex;position:relative}.xg-huYo[data-fit-mode=original] .xg-8-c8{width:auto;max-width:none}.xg-huYo[data-media-loaded=false] .xg-8-c8{min-height:var(--xs-3);aspect-ratio:var(--xgi-r,var(--xad))}.xg-lhkE{background:var(--xsk-b);min-height:var(--xs-3);justify-content:center;align-items:center;display:flex;position:absolute;inset:0}.xg-6YYD{--xsp-s:var(--xs-l);--xsp-bw:.125rem;--xsp-tc:var(--xcb-p);--xsp-ic:var(--xc-p)}.xg-FWlk,.xg-GUev{border-radius:var(--xr-m);object-fit:contain;pointer-events:auto;user-select:none;-webkit-user-drag:none;will-change:opacity;transition:opacity var(--xdn) var(--xe-s);display:block}:is(.xg-FWlk,.xg-GUev).xg-8Z3S{opacity:0}:is(.xg-FWlk,.xg-GUev).xg-y9iP{opacity:1}.xg-GUev{inline-size:100%;overflow:clip}:is(.xg-FWlk,.xg-GUev).xg-yYtG{object-fit:none;block-size:auto;max-block-size:none;inline-size:auto;max-inline-size:none}:is(.xg-FWlk,.xg-GUev).xg-Uc0o{object-fit:scale-down;block-size:auto;max-block-size:none;inline-size:auto;max-inline-size:100%}:is(.xg-FWlk,.xg-GUev).xg-M9Z6{block-size:auto;inline-size:auto;max-inline-size:calc(100vw - var(--xs-l) * 2);max-block-size:var(--xvhc);object-fit:scale-down}:is(.xg-FWlk,.xg-GUev).xg--Mlr{block-size:auto;inline-size:auto;max-inline-size:100%;max-block-size:var(--xvhc);object-fit:contain}.xg-Wno7{font-size:var(--xfs-2);margin-bottom:var(--xs-s)}.xg-8-wi{font-size:var(--xfs-s);text-align:center}.xg-Gswe{background:var(--xc-e-bg);color:var(--xc-e);min-height:var(--xs-3);flex-direction:column;justify-content:center;align-items:center;display:flex;position:absolute;inset:0}.xg-huYo[data-media-loaded=false][data-fit-mode=original],.xg-huYo[data-media-loaded=false][data-fit-mode=original] .xg-FWlk,.xg-huYo[data-media-loaded=false][data-fit-mode=original] .xg-GUev{inline-size:min(var(--xgi-w,100%), 100%);max-inline-size:min(var(--xgi-w,100%), 100%);max-block-size:min(var(--xgi-h,var(--xs-5)), var(--xvhc))}.xg-huYo[data-media-loaded=false][data-has-intrinsic-size=true][data-fit-mode=fitHeight],.xg-huYo[data-media-loaded=false][data-has-intrinsic-size=true][data-fit-mode=fitContainer]{--xgf-ht:min(var(--xgi-h,var(--xs-5)), var(--xvhc));max-block-size:var(--xgf-ht);inline-size:min(100%, calc(var(--xgf-ht) * var(--xgi-r,1)));max-inline-size:min(100%, calc(var(--xgf-ht) * var(--xgi-r,1)))}.xg-huYo[data-media-loaded=false][data-has-intrinsic-size=true]:is([data-fit-mode=fitHeight],[data-fit-mode=fitContainer]) :is(.xg-FWlk,.xg-GUev){max-block-size:var(--xgf-ht);max-inline-size:min(100%, calc(var(--xgf-ht) * var(--xgi-r,1)))}@media (prefers-reduced-motion:reduce){.xg-huYo{will-change:auto;transition:none}.xg-huYo:hover{transform:none}:where(.xg-FWlk,.xg-GUev){will-change:auto;transition:none}}.xg-EeSh{gap:var(--xse-g);padding:var(--xse-p);flex-direction:column;display:flex}.xg-nm9B{gap:var(--sps)}.xg-PI5C{gap:var(--xse-cg);flex-direction:column;display:flex}.xg-VUTt{gap:var(--spx)}.xg-vhT3{font-size:var(--xse-lf);font-weight:var(--xse-lw);color:var(--xct-p)}.xg-Y62M{font-size:var(--fsx);color:var(--xct-s);letter-spacing:var(--xeg-letter-spacing-wide);text-transform:uppercase}.xg-jpiS{width:100%;padding:var(--xse-sp);font-size:var(--xse-sf);color:var(--xct-p);background-color:var(--xte-b);border:var(--bwt) solid var(--xt-b);border-radius:var(--xr-m);cursor:pointer;line-height:var(--xeg-line-height-snug);min-height:2.75em;transition:border-color var(--xdf) var(--xe-s), background-color var(--xdf) var(--xe-s), box-shadow var(--xdf) var(--xe-s);overflow:visible;transform:none}.xg-jpiS:hover{border-color:var(--xcb-h);background-color:var(--xte-bs);box-shadow:0 0 0 2px color-mix(in oklch, var(--xt-b) 20%, transparent 80%)}.xg-jpiS:focus,.xg-jpiS:focus-visible{border-color:var(--xfic);box-shadow:0 0 0 3px color-mix(in oklch, var(--xfic) 25%, transparent 75%)}.xg-jpiS option{line-height:var(--xlh);padding:.5em .75em}.xg-4eoj{color:var(--xtt-c,var(--xct-p));cursor:pointer;font-size:.875em;font-weight:var(--xfw-m);width:var(--xsb-m);height:var(--xsb-m);min-width:var(--xsb-m);min-height:var(--xsb-m);aspect-ratio:1;border-radius:var(--xr-m);transition:var(--xts), transform var(--xdf) var(--xe-s);background:0 0;border:none;padding:.5em;position:relative;overflow:clip}.xg-4eoj:focus,.xg-4eoj:focus-visible{background:var(--xte-b,var(--xcn1))}.xg-fLg7{--toolbar-surface-base:var(--xtp-s,var(--xt-s,var(--xcbg-p,Canvas)));--toolbar-surface-border:var(--xt-b);--xb-do:1;background:var(--toolbar-surface-base);border-radius:var(--xr-l);z-index:var(--xz-t,2147480000);display:var(--toolbar-display,inline-flex);height:3em;color:var(--xtt-c,var(--xct-p));visibility:var(--toolbar-visibility,visible);opacity:var(--toolbar-opacity,1);pointer-events:var(--toolbar-pointer-events,auto);transition:var(--xten);user-select:none;overscroll-behavior:contain;border:none;justify-content:space-between;align-items:center;gap:0;padding:.5em 1em;position:fixed;top:1.25em;left:50%;transform:translate(-50%)}.xg-fLg7.xg-ZpP8,.xg-fLg7.xg-t4eq{border-radius:var(--xr-l) var(--xr-l) 0 0}.xg-fLg7.xg-ojCW,.xg-fLg7.xg-Y6KF,.xg-fLg7.xg-n-ab,.xg-fLg7.xg-bEzl{--toolbar-opacity:1;--toolbar-pointer-events:auto;--toolbar-visibility:visible;--toolbar-display:inline-flex}.xg-f8g4{justify-content:center;align-items:center;width:100%;max-width:100%;display:flex;overflow:hidden}.xg-Ix3j{justify-content:center;align-items:center;gap:var(--xs-xs);flex-wrap:wrap;width:100%;display:flex}.xg-Ix3j\u003E*{flex:none}.xg-0EHq{padding-inline:var(--xs-s);justify-content:center;align-items:center;min-width:5em;display:flex}.xg-FKnO{color:var(--xtt-m,var(--xct-p));margin:0 .125em}:where(.xg-4eoj[aria-pressed=true]){background:var(--xte-bs,var(--xcn2))}.xg-4eoj:disabled{--button-opacity:.5;color:var(--xtt-m,var(--xcn4));cursor:not-allowed}@media (hover:hover){.xg-4eoj:hover:not(:disabled){background:var(--xte-b,var(--xcn1));transform:translateY(var(--xb-l))}}.xg-4eoj:active:not(:disabled){background:var(--xte-bs,var(--xcn2));transform:translateY(0)}.xg-atmJ{position:relative}.xg-GG86{box-sizing:border-box;gap:0;min-width:5em;min-height:2.5em;padding-bottom:.5em;position:relative}.xg-2cjm{color:var(--xtt-c,var(--xct-p));font-size:var(--xfs-m);font-weight:var(--xfw-s);text-align:center;white-space:nowrap;border-radius:var(--xr-m);background:0 0;border:none;padding:.25em .5em;line-height:1}.xg-JEXm{color:var(--xtt-c,var(--xct-p));font-weight:var(--xeg-font-weight-bold)}.xg-d1et{color:var(--xtt-c,var(--xct-p))}.xg-vB6N{background:var(--xtp-pt,var(--xcn2));border-radius:var(--xr-s);width:3.75em;height:.125em;position:absolute;bottom:.125em;left:50%;overflow:clip;transform:translate(-50%)}.xg-LWQw{background:var(--xtt-c,var(--xct-p));border-radius:var(--xr-s);width:100%;height:100%;transition:var(--xtwn);transform-origin:0}.xg-Q7dU,button.xg-Q7dU{transition:var(--xti);z-index:10;pointer-events:auto;position:relative}.xg-Q7dU[data-selected=true]{--toolbar-button-accent-hover:var(--xc-p);--toolbar-button-focus-border:var(--xc-ph)}.xg-Q7dU:focus,.xg-Q7dU:focus-visible{border:none}@media (prefers-reduced-transparency:reduce){.xg-fLg7,[data-theme=dark] .xg-fLg7{background:var(--xtp-s,var(--xt-s))}}@media (prefers-reduced-motion:reduce){.xg-4eoj:hover:not(:disabled),.xg-atmJ:hover:not(:disabled),.xg-Vn14:hover:not(:disabled),.xg-Q7dU:hover{transform:none}}:where(.xg-JcF-,.xg-yRtv){gap:var(--xs-m);width:100%;padding:var(--xs-l);max-height:var(--xtp-mh);opacity:0;visibility:hidden;pointer-events:none;transition:var(--xtp-t), transform var(--xdn) var(--xe-s), visibility 0s var(--xdn);background:var(--toolbar-surface-base,var(--xtp-s,var(--xt-s)));border-top:var(--bwt) solid var(--toolbar-surface-border,var(--xt-b));border-radius:0 0 var(--xr-l) var(--xr-l);z-index:var(--xz-tp);will-change:transform, opacity;overscroll-behavior:contain;flex-direction:column;display:flex;position:absolute;top:100%;left:0;right:0;overflow:hidden;transform:translateY(-.5em)}.xg-JcF-{height:var(--xtp-h)}.xg-yRtv{min-height:var(--xtp-h)}:where(.xg-JcF-,.xg-yRtv).xg-4a2L{opacity:1;visibility:visible;pointer-events:auto;border-top-color:var(--toolbar-surface-border,var(--xt-b));height:auto;transition:var(--xtp-t), transform var(--xdn) var(--xe-s), visibility 0s 0s;z-index:var(--xz-ta);transform:translateY(0)}.xg-w56C{gap:var(--xs-s);flex-direction:column;display:flex}.xg-rSWg{padding-bottom:var(--xs-xs);border-bottom:var(--bwt) solid var(--toolbar-surface-border);margin-bottom:var(--xs-s);align-items:center;display:flex}.xg-jd-V{font-size:var(--xfs-s);font-weight:var(--xfw-s);color:var(--xtt-c);text-transform:uppercase;letter-spacing:var(--xeg-letter-spacing-wide)}.xg-jmjG{padding:var(--xs-s) var(--xs-m);font-size:var(--xfs-b);line-height:var(--xeg-line-height-snug);color:var(--xtt-c,var(--xct-p));background:var(--toolbar-surface-base,var(--xtp-s,var(--xt-s)));border:var(--bwt) solid var(--toolbar-surface-border,var(--xt-b));border-radius:var(--xr-m);white-space:pre-wrap;word-wrap:break-word;overscroll-behavior:contain;max-height:18em;transition:var(--xts);-webkit-user-select:text;user-select:text;cursor:text;overflow-y:auto}.xg-jmjG::-webkit-scrollbar{width:.5em}.xg-jmjG::-webkit-scrollbar-track{background:var(--xts-t,var(--xcn2));border-radius:var(--xr-s)}.xg-jmjG::-webkit-scrollbar-thumb{background:var(--xts-th,var(--xcn4));border-radius:var(--xr-s)}.xg-jmjG::-webkit-scrollbar-thumb:hover{background:var(--xte-bs,var(--xcn5))}.xg-jmjG a{color:var(--xc-p);font-weight:var(--xfw-m);border-radius:var(--xr-xs);overflow-wrap:break-word;transition:color var(--xdf) var(--xe-s), background-color var(--xdf) var(--xe-s);cursor:pointer;margin:-.125em -.25em;padding:.125em .25em;text-decoration:none}.xg-jmjG a:hover{color:var(--xc-ph);background:var(--xte-b);text-underline-offset:.125em;text-decoration:underline .0625rem}.xg-jmjG a:focus,.xg-jmjG a:focus-visible{background:var(--xte-bs,var(--xcn2));color:var(--xc-ph);border-radius:var(--xr-xs)}.xg-jmjG a:active{color:var(--xc-p-active)}.xg-0Eeq{align-items:center;gap:var(--xs-xs);padding:var(--xs-s);margin-bottom:var(--xs-s);background:var(--xte-bs);border:var(--bwt) solid var(--toolbar-surface-border,var(--xt-b));border-radius:var(--xr-s);transition:var(--xts);display:flex}.xg-0Eeq:hover{background:color-mix(in oklch, var(--xte-bs) 85%, var(--xc-p) 15%);border-color:var(--xcb-h)}.xg-AVKe{width:100%;color:var(--xc-p);font-size:var(--xfs-s);font-weight:var(--xfw-m);transition:color var(--xdf) var(--xe-s);align-items:center;gap:.375em;text-decoration:none;display:flex}.xg-AVKe:hover{color:var(--xc-ph)}.xg-AVKe:focus,.xg-AVKe:focus-visible{outline:.125rem solid var(--xfic);outline-offset:.125rem;border-radius:var(--xr-xs)}.xg-5RjR{stroke:currentColor;flex-shrink:0;width:.875em;height:.875em}.xg-8Stf{color:var(--xtt-m,var(--xct-s));font-weight:var(--xfw-s);flex-shrink:0}.xg-3pwZ{color:var(--xc-p);text-overflow:ellipsis;white-space:nowrap;flex:1;overflow:hidden}.xg-sltl{width:100%;height:var(--bwt);background:color-mix(in oklch, var(--toolbar-surface-border) 60%, transparent 40%);margin:var(--xs-m) 0;border-radius:var(--xr-s)}@layer xeg.features{.xeg-gallery-renderer[data-renderer=gallery]{width:0;height:0;display:block;overflow:visible}.xeg-gallery-overlay{z-index:var(--xz-g,10000);background:var(--xg-b);opacity:1;transition:opacity var(--xdn) var(--xe-s);pointer-events:auto;justify-content:center;align-items:center;display:flex;position:fixed;inset:0}.xeg-gallery-container{overscroll-behavior:contain;scrollbar-gutter:stable both-edges;flex-direction:column;width:100%;max-width:100vw;height:100%;max-height:100vh;display:flex;position:relative;overflow:hidden auto}}@layer xeg.tokens{:where(:root,.xeg-theme-scope){--cbw:oklch(100% 0 0);--cbb:oklch(0% 0 0);--cg0:oklch(97% .002 206.2);--cg1:oklch(94.3% .006 206.2);--cg2:oklch(89.6% .006 206.2);--cg3:oklch(79.6% .006 206.2);--cg4:oklch(69.6% .006 286.3);--cg5:oklch(59.8% .006 286.3);--cg6:oklch(48.8% .006 286.3);--cg7:oklch(37.8% .005 286.3);--cg8:oklch(30.6% .005 282);--cg9:oklch(23.4% .006 277.8);--space-none:0;--spx:.25rem;--sps:.5rem;--spm:1rem;--spl:1.5rem;--spxl:2rem;--sp2:3rem;--space-3xl:4rem;--space-4xl:5rem;--rx:.125em;--rs:.25em;--rm:.375em;--rl:.5em;--r2:1em;--rf:50%;--ffp:\"TwitterChirp\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif;--fsx:.75rem;--fss:.875rem;--fsb:.9375rem;--fsm:1rem;--fsl:1.125rem;--fsxl:1.25rem;--fs2:1.5rem;--fwn:400;--fwm:500;--fws:600;--fwb:700;--duration-instant:.1s;--df:.15s;--dn:.25s;--ds:.3s;--dser:.4s;--bwt:.0625rem;--line-height-tight:1.25;--line-height-snug:1.375;--lhn:1.5;--line-height-relaxed:1.75;--xcbg-p:var(--cbw);--xcbg-s:var(--cg0);--xeg-color-bg-surface:var(--cbw);--xeg-color-bg-elevated:var(--cbw);--xbgt:var(--xeg-color-bg-surface);--xt-b:var(--xcb-p);--xt-s:var(--xbgt);--xtp-s:var(--xt-s);--xg-bl:var(--xcbg-p);--xg-bd:var(--cg9);--xg-b:var(--xg-bl);--xc-bg:var(--cg0);--xad:4 \u002F 3;--xct-p:var(--cbb);--xct-s:var(--cg6);--xeg-color-border-default:var(--cg2);--xeg-color-border-emphasis:var(--cg5);--xcb-p:var(--xeg-color-border-default);--xcb-h:var(--cg3);--xcb-s:var(--xeg-color-border-emphasis);--xtt-c:var(--xct-p);--xtt-m:var(--xct-s);--xte-b:color-mix(in oklch, var(--xbgt) 80%, var(--cbw) 20%);--xte-bs:color-mix(in oklch, var(--xbgt) 65%, var(--cbw) 35%);--xte-br:color-mix(in oklch, var(--xt-b) 85%, var(--cbw) 15%);--xtp-pt:color-mix(in oklch, var(--xte-b) 60%, var(--xte-br) 40%);--xts-t:color-mix(in oklch, var(--xte-b) 50%, var(--cbw) 50%);--xts-th:color-mix(in oklch, var(--xte-br) 80%, var(--cbw) 20%);--xc-s:oklch(55% .18 145);--xc-sh:oklch(48% .18 145);--xc-s-bg:oklch(90% .08 145);--xc-e:oklch(50% .22 25);--xc-eh:oklch(43% .22 25);--xc-e-bg:oklch(90% .08 25);--xeg-color-info-bg:var(--cg0);--xc-p:var(--cg9);--xc-ph:var(--cg7);--xc-p-active:var(--cg8);--xcn1:var(--cg1);--xcn2:var(--cg2);--xcn3:var(--cg3);--xcn4:var(--cg4);--xcn5:var(--cg5);--xct-t:var(--cg5);--xct-i:var(--cbw);--xsb-s:2rem;--xsb-m:2.5em;--xsb-l:3rem;--xfic:var(--xcb-p);--xfs-s:var(--fss);--xfs-b:var(--fsb);--xfs-m:var(--fsm);--xfs-l:var(--fsl);--xeg-font-size-xl:var(--fsxl);--xfs-2:var(--fs2);--xff-u:-apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif;--xeg-font-weight-normal:var(--fwn);--xfw-m:var(--fwm);--xfw-s:var(--fws);--xeg-font-weight-bold:var(--fwb);--xeg-line-height-tight:var(--line-height-tight);--xeg-line-height-snug:var(--line-height-snug);--xeg-line-height-relaxed:var(--line-height-relaxed);--xeg-letter-spacing-wide:.04em;--xdf:var(--df);--xdn:var(--dn);--xdt:var(--dn);--xsu-b:var(--xeg-color-bg-surface);--xsu-br:var(--xeg-color-border-default);--xsu-bh:var(--xcbg-s);--xc-se:var(--xeg-color-bg-elevated);--xsk-b:var(--xcbg-s);--xbe:var(--xeg-color-border-emphasis);--xz-g:9999;--xz-th:10001;--xz-t:10002;--xz-tp:10003;--xz-ta:10004;--xe-s:cubic-bezier(.4, 0, .2, 1);--xe-d:cubic-bezier(0, 0, .2, 1);--xe-a:cubic-bezier(.4, 0, 1, 1);--xel:linear;--xlh:var(--lhn);--xb-l:-.0625rem;--xo-d:.5;--xhl:translateY(-.125rem);--xeg-spacing-none:var(--space-none);--xs-xl:var(--spxl);--xs-5:var(--sp2);--xr-s:var(--rs);--xr-m:var(--rm);--xr-l:var(--rl);--xr-2:var(--r2);--xr-f:var(--rf);--xeg-scrollbar-thumb-color:var(--cg4);--xeg-scrollbar-thumb-hover-color:var(--cg5);--xeg-scrollbar-track-color:var(--cg2)}:where(:root,.xeg-theme-scope)[data-theme=dark]{--xcbg-p:var(--cg9);--xeg-color-bg-surface:var(--cg9);--xeg-color-bg-elevated:var(--cg7);--xct-p:var(--cbw);--xct-s:var(--cg4);--xbgt:var(--cg8);--xcb-p:var(--cg6);--xt-b:var(--cg6);--xcbg-s:var(--cg8);--xg-b:var(--xg-bd);--xtt-c:var(--xct-p);--xtt-m:var(--cg3);--xte-b:color-mix(in oklch, var(--xbgt) 85%, var(--cbb) 15%);--xte-bs:color-mix(in oklch, var(--xbgt) 70%, var(--cbb) 30%);--xte-br:color-mix(in oklch, var(--xt-b) 75%, var(--cbb) 25%);--xtp-pt:color-mix(in oklch, var(--xt-b) 65%, var(--xbgt) 35%);--xts-t:color-mix(in oklch, var(--xte-b) 80%, var(--cbb) 20%);--xts-th:color-mix(in oklch, var(--xte-br) 85%, var(--cbb) 15%);--xc-bg:var(--cg9);--xc-p:var(--cg1);--xc-ph:var(--cg2);--xc-p-active:var(--cg3);--xsu-b:var(--cg9);--xsu-br:var(--cg6);--xsu-bh:var(--cg8)}@media (prefers-reduced-motion:reduce){:where(:root,.xeg-theme-scope){--xdf:0s;--xts:none;--xten:none;--xtef:none;--xti:none;--xtwn:none}}:where(:root,.xeg-theme-scope){--xse-g:var(--spm);--xse-p:var(--spm);--xse-cg:var(--sps);--xse-lf:var(--fss);--xse-lw:var(--fwb);--xse-sf:var(--fss);--xse-sp:var(--sps) var(--spm);--xtp-t:height var(--xdn) var(--xe-s), opacity var(--xdf) var(--xe-s);--xtp-h:0;--xtp-mh:17.5rem;--xsw:.5rem;--xsbr:0;--xhzh:7.5rem;--xsp-sd:1rem;--xsp-bw:.125rem;--xsp-tc:color-mix(in oklch, var(--xcn4) 60%, transparent);--xsp-ic:var(--xc-p,currentColor);--xsp-d:var(--xdn);--xsp-e:var(--xel);--xts:background-color var(--xdf) var(--xe-s), border-color var(--xdf) var(--xe-s), color var(--xdf) var(--xe-s);--xten:transform var(--xdn) var(--xe-s), opacity var(--xdn) var(--xe-s);--xtef:transform var(--xdf) var(--xe-s), opacity var(--xdf) var(--xe-s);--xti:background-color var(--xdf) var(--xe-s), border-color var(--xdf) var(--xe-s), color var(--xdf) var(--xe-s), transform var(--xdf) var(--xe-s);--xtwn:width var(--xdn) var(--xe-s);--xisw:.125rem;--xis:1.25em;--xs-xs:var(--spx);--xs-s:var(--sps);--xs-m:var(--spm);--xs-l:var(--spl);--xvhc:90vh}@media (prefers-reduced-transparency:reduce){:where(:root,.xeg-theme-scope){--xsu-b:var(--xcbg-p)}}}@layer xeg.base{:where(.xeg-gallery-root,.xeg-gallery-root *),:where(){box-sizing:border-box;margin:0;padding:0}.xeg-gallery-root button{cursor:pointer;font:inherit;color:inherit;background:0 0;border:none}.xeg-gallery-root a{color:inherit;text-decoration:none}.xeg-gallery-root img{max-width:100%;height:auto;display:block}.xeg-gallery-root ul,.xeg-gallery-root ol{list-style:none}.xeg-gallery-root input,.xeg-gallery-root textarea,.xeg-gallery-root select{font:inherit;color:inherit;background:0 0}.xeg-gallery-root ::-webkit-scrollbar{width:var(--xsw,.5rem);height:var(--xsw,.5rem)}.xeg-gallery-root ::-webkit-scrollbar-track{background:0 0}.xeg-gallery-root ::-webkit-scrollbar-thumb{background:var(--xeg-scrollbar-thumb-color);border-radius:var(--xr-s,.25rem)}.xeg-gallery-root ::-webkit-scrollbar-thumb:hover{background:var(--xeg-scrollbar-thumb-hover-color)}.xeg-gallery-root{all:initial;--xeg-inherited:inherit;box-sizing:border-box;scroll-behavior:smooth;font-family:var(--ffp);font-size:var(--fsb,.9375rem);line-height:var(--xlh,1.5);color:var(--xct-p,currentColor);width:100vw;height:100vh;z-index:var(--xz-g,10000);isolation:isolate;contain:style paint;overscroll-behavior:contain;background:var(--xg-b,var(--xcbg-p,Canvas));pointer-events:auto;user-select:none;will-change:opacity, transform;-webkit-text-size-adjust:100%;text-size-adjust:100%;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;display:block;position:fixed;inset:0}}@layer xeg.utilities{.xeg-row-center{align-items:center;display:flex}.xeg-inline-center{justify-content:center;align-items:center;display:inline-flex}.xeg-gap-sm{gap:var(--xs-s)}.xeg-fade-in{animation:xeg-fade-in var(--xdn) var(--xe-d);animation-fill-mode:both}.xeg-fade-out{animation:xeg-fade-out var(--xdf) var(--xe-a);animation-fill-mode:both}@media (prefers-reduced-motion:reduce){.xeg-fade-in,.xeg-fade-out{animation:none}}}@layer xeg.overrides;";var s=document.getElementById("xeg-injected-styles");if(!s){s=document.createElement('style');s.id="xeg-injected-styles";(document.head||document.documentElement).appendChild(s);}s.textContent=css;})();
(function() {
//#region src/shared/constants/i18n/language-types.ts
/**
* Supported language codes for the application
* These must match the available language files in the languages directory
*/
var LANGUAGE_CODES = [
"en",
"ko",
"ja"
];
/**
* Type guard to check if a value is a valid base language code
* @param value - Value to check
* @returns True if value is a valid BaseLanguageCode
*/
function isBaseLanguageCode(value) {
return value === "en" || value === "ko" || value === "ja";
}
//#endregion
//#region src/shared/constants/i18n/translation-values.ts
function buildLanguageStringsFromValues(values) {
let i = 0;
const next = () => values[i++];
return {
tb: {
prev: next(),
next: next(),
dl: next(),
dlAllCt: next(),
setOpen: next(),
cls: next(),
twTxt: next(),
twPanel: next(),
twUrl: next(),
fitOri: next(),
fitW: next(),
fitH: next(),
fitC: next()
},
st: {
th: next(),
lang: next(),
thAuto: next(),
thLt: next(),
thDk: next(),
langAuto: next(),
langKo: next(),
langEn: next(),
langJa: next()
},
msg: {
err: {
t: next(),
b: next()
},
kb: {
t: next(),
prev: next(),
next: next(),
cls: next(),
toggle: next()
},
dl: {
one: { err: {
t: next(),
b: next()
} },
allFail: {
t: next(),
b: next()
},
part: {
t: next(),
b: next()
}
},
gal: {
emptyT: next(),
emptyD: next(),
itemLbl: next(),
loadFail: next()
}
}
};
}
/**
* English language strings for the application
*/
var en = buildLanguageStringsFromValues([
"Previous",
"Next",
"Download",
"Download all {count} files as ZIP",
"Open Settings",
"Close",
"View tweet",
"Tweet text panel",
"View original tweet",
"Original",
"Fit Width",
"Fit Height",
"Fit Window",
"Theme",
"Language",
"Auto",
"Light",
"Dark",
"Auto / 자동 / 自動",
"Korean",
"English",
"Japanese",
"An error occurred",
"An unexpected error occurred: {error}",
"Keyboard shortcuts",
"ArrowLeft: Previous media",
"ArrowRight: Next media",
"Escape: Close gallery",
"?: Show this help",
"Download Failed",
"Could not download the file: {error}",
"Download Failed",
"Failed to download all items.",
"Partial Failure",
"Failed to download {count} items.",
"No media available",
"There are no images or videos to display.",
"Media {index}: {filename}",
"Failed to load {type}"
]);
/**
* Japanese language strings for the application
*/
var ja = buildLanguageStringsFromValues([
"前へ",
"次へ",
"ダウンロード",
"すべての{count}件をZIPでダウンロード",
"設定を開く",
"閉じる",
"ツイートを見る",
"ツイートテキストパネル",
"元のツイートを見る",
"原寸",
"幅に合わせる",
"高さに合わせる",
"ウィンドウに合わせる",
"テーマ",
"Language / 언어 / 言語",
"自動",
"ライト",
"ダーク",
"Auto / 자동 / 自動",
"韓国語",
"英語",
"日本語",
"エラーが発生しました",
"予期しないエラーが発生しました: {error}",
"キーボードショートカット",
"ArrowLeft: 前のメディア",
"ArrowRight: 次のメディア",
"Escape: ギャラリーを閉じる",
"?: このヘルプを表示",
"ダウンロード失敗",
"ファイルを取得できません: {error}",
"ダウンロード失敗",
"すべての項目をダウンロードできませんでした。",
"一部失敗",
"{count}個の項目を取得できませんでした。",
"メディアがありません",
"表示する画像や動画がありません。",
"メディア {index}: {filename}",
"{type} の読み込みに失敗しました"
]);
//#endregion
//#region src/shared/constants/i18n/translation-registry.ts
var TRANSLATION_REGISTRY = {
en,
ko: buildLanguageStringsFromValues([
"이전",
"다음",
"다운로드",
"모든 {count}개 파일을 ZIP으로 다운로드",
"설정 열기",
"닫기",
"트윗 보기",
"트윗 텍스트 패널",
"원본 트윗 보기",
"원본",
"너비 맞춤",
"높이 맞춤",
"창 맞춤",
"테마",
"Language / 언어 / 言語",
"자동",
"라이트",
"다크",
"Auto / 자동 / 自動",
"한국어",
"영어",
"일본어",
"오류가 발생했습니다",
"예상치 못한 오류가 발생했습니다: {error}",
"키보드 단축키",
"ArrowLeft: 이전 미디어",
"ArrowRight: 다음 미디어",
"Escape: 갤러리 닫기",
"?: 이 도움말 표시",
"다운로드 실패",
"파일을 가져올 수 없습니다: {error}",
"다운로드 실패",
"모든 항목을 다운로드할 수 없었습니다.",
"일부 실패",
"{count}개 항목을 가져올 수 없었습니다.",
"미디어 없음",
"표시할 이미지 또는 동영상이 없습니다.",
"미디어 {index}: {filename}",
"{type} 로드 실패"
]),
ja
};
//#endregion
//#region src/shared/i18n/translator.ts
function resolveTranslationValue(dictionary, key) {
const segments = key.split(".");
let current = dictionary;
for (const segment of segments) {
if (current == null || typeof current !== "object") return void 0;
current = current[segment];
}
return typeof current === "string" ? current : void 0;
}
var Translator = class {
bundles = {};
fallbackLanguage;
constructor(options = {}) {
const { bundles = TRANSLATION_REGISTRY, fallbackLanguage = "en" } = options;
this.fallbackLanguage = fallbackLanguage;
for (const [lang, strings] of Object.entries(bundles)) if (strings) this.bundles[lang] = strings;
if (!this.bundles[this.fallbackLanguage]) throw new Error(`Missing fallback language bundle: ${this.fallbackLanguage}`);
}
get languages() {
return LANGUAGE_CODES;
}
translate(language, key, params) {
const template = resolveTranslationValue(this.bundles[language] ?? this.bundles[this.fallbackLanguage], key);
if (!template) return key;
if (!params) return template;
return template.replace(/\{(\w+)\}/g, (match, placeholder) => Object.hasOwn(params, placeholder) ? String(params[placeholder]) : match);
}
};
//#endregion
//#region src/shared/logging/logger.ts
var BASE_PREFIX = "[XEG]";
var noop = () => {};
var createErrorOnlyLogger = (prefix) => ({
info: noop,
warn: noop,
debug: noop,
trace: noop,
error: (...args) => {
console.error(prefix, ...args);
}
});
function buildLogger(prefix) {
return createErrorOnlyLogger(prefix);
}
function createLogger(config = {}) {
return buildLogger(config.prefix ?? BASE_PREFIX);
}
var logger = createLogger();
//#endregion
//#region src/shared/external/userscript/adapter.ts
function resolveGMAPIs() {
const g = globalThis;
return {
download: g.GM_download,
setValue: g.GM_setValue,
getValue: g.GM_getValue,
deleteValue: g.GM_deleteValue,
listValues: g.GM_listValues,
xmlHttpRequest: g.GM_xmlhttpRequest,
notification: g.GM_notification,
cookie: g.GM_cookie
};
}
var cachedGMAPIs = null;
function getResolvedGMAPIsCached() {
if (cachedGMAPIs) return cachedGMAPIs;
cachedGMAPIs = resolveGMAPIs();
return cachedGMAPIs;
}
function asFunction(value) {
return typeof value === "function" ? value : void 0;
}
function resolveGMDownload() {
return getResolvedGMAPIsCached().download;
}
function createUserscriptAPI() {
const g = getResolvedGMAPIsCached();
const gmDownload = asFunction(g.download);
const gmSetValue = asFunction(g.setValue);
const gmGetValue = asFunction(g.getValue);
const gmDeleteValue = asFunction(g.deleteValue);
const gmListValues = asFunction(g.listValues);
const gmXmlHttpRequest = asFunction(g.xmlHttpRequest);
const gmNotification = asFunction(g.notification);
const cookieCandidate = g.cookie;
return {
async download(url, filename) {
if (!gmDownload) throw new Error("GM_download unavailable");
gmDownload(url, filename);
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
}
function getUserscript() {
return createUserscriptAPI();
}
//#endregion
//#region src/shared/services/persistent-storage.ts
var _persistentStorageInstance = null;
var PersistentStorage = class PersistentStorage {
get userscript() {
return getUserscript();
}
constructor() {}
static getInstance() {
if (!_persistentStorageInstance) _persistentStorageInstance = new PersistentStorage();
return _persistentStorageInstance;
}
async set(key, value) {
if (value === void 0) {
await this.userscript.deleteValue(key);
return;
}
const serialized = typeof value === "string" ? value : JSON.stringify(value);
await this.userscript.setValue(key, serialized);
}
async get(key, defaultValue) {
const value = await this.userscript.getValue(key);
if (value === void 0 || value === null) return defaultValue;
try {
return JSON.parse(value);
} catch {
return value;
}
}
async getString(key, defaultValue) {
const value = await this.userscript.getValue(key);
if (value === void 0 || value === null) return defaultValue;
return value;
}
async has(key) {
const value = await this.userscript.getValue(key);
return value !== void 0 && value !== null;
}
/**
* Synchronous storage access via UserscriptAPI adapter.
*
* [WARNING] Only reliable in Tampermonkey and Violentmonkey.
* Greasemonkey 4+ uses async-only storage - returns defaultValue.
* Use ONLY for critical initialization paths (e.g., theme to prevent FOUC).
*/
getSync(key, defaultValue) {
try {
const value = this.userscript.getValueSync(key);
if (value == null) return defaultValue;
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
await this.userscript.deleteValue(key);
}
};
//#endregion
//#region src/shared/services/language-service.ts
/**
* @fileoverview Multilingual Support Service
* @description TDD-based simple i18n system with lazy language loading
*/
var _instance$1 = null;
/**
* Multilingual Service
* - onInitialize(): Restore language setting from storage
* - onDestroy(): Clean up listeners
*
* Note: Global singleton export requires initialize() call from main.ts
*/
var LanguageService = class LanguageService {
static STORAGE_KEY = "xeg-language";
_initialized = false;
currentLanguage = "auto";
listeners = /* @__PURE__ */ new Set();
storage = PersistentStorage.getInstance();
translator;
constructor() {
this.translator = new Translator();
}
static getInstance() {
if (!_instance$1) _instance$1 = new LanguageService();
return _instance$1;
}
/** Initialize service (idempotent) */
async initialize() {
if (this._initialized) return;
try {
const saved = await this.storage.getString(LanguageService.STORAGE_KEY);
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
const browserLang = typeof navigator !== "undefined" && typeof navigator.language === "string" ? navigator.language.slice(0, 2) : "en";
if (isBaseLanguageCode(browserLang)) return browserLang;
return "en";
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
//#endregion
//#region src/shared/error/normalize.ts
/**
* @fileoverview Error message normalization helper
* @description Extract a meaningful error string from any error type.
*/
function normalizeErrorMessage(error) {
if (error instanceof Error) return error.message || error.name || "Error";
if (typeof error === "string") return error;
if (error == null) return "Unknown error";
if (typeof error === "object") {
const msg = error.message;
if (typeof msg === "string") return msg;
try {
return JSON.stringify(error);
} catch {
return String(error);
}
}
return String(error);
}
//#endregion
//#region src/shared/error/cancellation.ts
var USER_CANCELLED_MESSAGE = "Download cancelled by user";
function isAbortError(value) {
return value instanceof DOMException && (value.name === "AbortError" || value.name === "TimeoutError");
}
function isUserCancelledAbortError(error) {
return error instanceof DOMException && error.name === "AbortError" && error.message === USER_CANCELLED_MESSAGE;
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
//#region src/shared/utils/async/promise-helpers.ts
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
var _httpInstance = null;
var HttpRequestService = class HttpRequestService {
defaultTimeout = 1e4;
constructor() {}
static getInstance() {
if (!_httpInstance) _httpInstance = new HttpRequestService();
return _httpInstance;
}
async get(url, options) {
return this.request("GET", url, options);
}
async request(method, url, options) {
const deferred = createDeferred();
const signal = options?.signal;
if (signal?.aborted) {
deferred.reject(getAbortReasonOrAbortErrorFromSignal(signal));
return deferred.promise;
}
const onAbort = () => {
deferred.reject(getAbortReasonOrAbortErrorFromSignal(signal));
};
signal?.addEventListener("abort", onAbort, { once: true });
const settle = (fn) => {
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
deferred.reject(getAbortReasonOrAbortErrorFromSignal(signal));
});
}
};
getUserscript().xmlHttpRequest(details);
return deferred.promise;
}
};
//#endregion
//#region src/shared/utils/performance/idle-scheduler.ts
/**
* Schedules a task to run during browser idle time.
* Errors in tasks are caught and logged (in DEV only) without crashing.
*/
function scheduleIdle(task) {
const id = requestIdleCallback(() => {
try {
task();
} catch (error) {}
});
return { cancel: () => cancelIdleCallback(id) };
}
//#endregion
//#region src/shared/services/media/prefetch-manager.ts
/**
* Manages media prefetching and caching.
* Extracted from MediaService for better separation of concerns.
*/
var PrefetchManager = class {
cache = /* @__PURE__ */ new Map();
activeRequests = /* @__PURE__ */ new Map();
maxEntries;
constructor(maxEntries = 20) {
this.maxEntries = maxEntries;
}
/**
* Prefetch media with specified scheduling strategy
*/
async prefetch(media, schedule = "idle") {
if (schedule === "immediate") {
await this.prefetchSingle(media.url);
return;
}
scheduleIdle(() => {
this.prefetchSingle(media.url).catch(() => {});
});
}
/**
* Get cached media blob
*/
get(url) {
return this.cache.get(url) ?? null;
}
/**
* Cancel all active prefetch requests
*/
cancelAll() {
for (const controller of this.activeRequests.values()) controller.abort();
this.activeRequests.clear();
}
/**
* Clear the prefetch cache
*/
clear() {
this.cache.clear();
}
/**
* Cleanup resources
*/
destroy() {
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
}
if (this.cache.has(url)) return;
}
const controller = new AbortController();
this.activeRequests.set(url, controller);
if (this.cache.size >= this.maxEntries) this.evictOldest();
const fetchPromise = HttpRequestService.getInstance().get(url, {
signal: controller.signal,
responseType: "blob"
}).then((response) => {
if (!response.ok) throw new Error(`HTTP ${response.status}`);
return response.data;
}).finally(() => {
this.activeRequests.delete(url);
});
this.cache.set(url, fetchPromise);
try {
await fetchPromise;
} catch (error) {
if (this.cache.get(url) === fetchPromise) this.cache.delete(url);
}
}
evictOldest() {
const first = this.cache.keys().next();
if (!first.done) {
const url = first.value;
const controller = this.activeRequests.get(url);
if (controller) {
controller.abort();
this.activeRequests.delete(url);
}
this.cache.delete(url);
}
}
};
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
var DATA_ATTRIBUTES = {
GALLERY: "data-xeg-gallery",
ROLE: "data-xeg-role"
};
var SELECTORS = {
OVERLAY: `.${CLASSES.OVERLAY}`,
CONTAINER: `.${CLASSES.CONTAINER}`,
ROOT: `.${CLASSES.ROOT}`,
RENDERER: `.${CLASSES.RENDERER}`,
VERTICAL_VIEW: `.${CLASSES.VERTICAL_VIEW}`,
ITEM: `.${CLASSES.ITEM}`,
DATA_GALLERY: `[${DATA_ATTRIBUTES.GALLERY}]`,
DATA_ROLE: `[${DATA_ATTRIBUTES.ROLE}]`,
ROLE_GALLERY: `[${DATA_ATTRIBUTES.ROLE}="gallery"]`
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
SELECTORS.DATA_ROLE,
SELECTORS.ROLE_GALLERY
]
};
//#endregion
//#region src/constants/selectors.ts
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
},
QUALITY: {
ORIGINAL: "orig",
LARGE: "large",
MEDIUM: "medium",
SMALL: "small"
}
};
//#endregion
//#region src/shared/services/media-extraction/utils/extraction-result-factory.ts
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
//#region src/shared/utils/media/media-element-utils.ts
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
//#endregion
//#region src/shared/utils/media/tweet-extractor.ts
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
logger.error("[tweet] extract failed", error);
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
var TWITTER_USERNAME_PATTERN = /^[a-zA-Z0-9_]{1,15}$/u;
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
//#endregion
//#region src/shared/utils/url/safety.ts
/**
* @fileoverview Centralized URL safety utilities
*/
var CONTROL_CHARS_REGEX = /[\u0000-\u001F\u007F]/g;
var SCHEME_WHITESPACE_REGEX = /[\u0000-\u001F\u007F\s]+/g;
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
Object.freeze(new Set([
"http:",
"https:",
"blob:"
]));
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
const probe = value.slice(0, MAX_SCHEME_PROBE_LENGTH);
if (/%(?![0-9A-Fa-f]{2})/.test(probe)) return true;
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
* Standard HTTP URL length limit is 2048 characters.
*/
var MAX_URL_LENGTH = 2048;
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
if (typeof url !== "string" || url.length > MAX_URL_LENGTH) return false;
const parsed = tryParseUrl(url);
if (!parsed) return false;
if (!isHttpProtocol(parsed.protocol)) return false;
if (!isHostMatching(parsed, ALLOWED_MEDIA_HOSTS)) return false;
return isAllowedMediaPath(parsed.hostname, parsed.pathname);
}
var isHttpProtocol = (protocol) => protocol === "https:" || protocol === "http:";
function isAllowedMediaPath(hostname, pathname) {
if (hostname === "pbs.twimg.com") return checkPbsMediaPath(pathname);
if (hostname === "video.twimg.com") return checkVideoMediaPath(pathname);
return false;
}
var checkPbsMediaPath = (pathname) => pathname.startsWith("/media/") || pathname.startsWith("/ext_tw_video_thumb/") || pathname.startsWith("/tweet_video_thumb/") || pathname.startsWith("/video_thumb/") || pathname.startsWith("/amplify_video_thumb/") || pathname.startsWith("/card_img/");
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
* @param tweetTextHTML - Tweet text HTML
* @returns MediaInfo object or null
*/
function createMediaInfoFromDOM(element, tweetInfo, index, tweetTextHTML) {
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
return {
id: `${tweetInfo.tweetId}_dom_${index}`,
url: mediaUrl,
type: mediaType,
filename: "",
tweetUsername: tweetInfo.username,
tweetId: tweetInfo.tweetId,
tweetUrl: tweetInfo.tweetUrl,
tweetText: void 0,
tweetTextHTML,
originalUrl: mediaUrl,
thumbnailUrl: mediaUrl,
alt: `${mediaType} ${index + 1}`,
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
const tweetTextHTML = extractTweetTextHTMLFromClickedElement(clickedElement);
const mediaElements = findAllMediaInContainer(tweetContainer);
if (mediaElements.length === 0) return createFailureResult("No media elements found in DOM", "dom-fallback", "dom-extraction-failed");
const mediaItems = [];
const elementToIndexMap = /* @__PURE__ */ new Map();
for (let i = 0; i < mediaElements.length; i++) {
const element = mediaElements[i];
if (!element) continue;
const mediaInfo = createMediaInfoFromDOM(element, tweetInfo, i, tweetTextHTML);
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
const hostname = url.hostname.toLowerCase();
if (hostname === "twitter.com" || hostname === "www.twitter.com" || hostname === "mobile.twitter.com") {
url.hostname = "x.com";
url.protocol = "https:";
}
if (hostname === "www.x.com") {
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
var TweetInfoExtractor = class {
strategies = [
extractFromElement,
extractFromDOM,
extractFromMediaGridItem
];
extract(element) {
for (const strategy of this.strategies) try {
const result = strategy(element);
if (result && this.isValid(result)) return result;
} catch {}
return null;
}
isValid(info) {
return !!info.tweetId && /^\d+$/.test(info.tweetId) && info.tweetId !== "unknown";
}
};
//#endregion
//#region src/shared/utils/media/media-url-utils.ts
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
const urlCandidate = typeof media.originalUrl === "string" && media.originalUrl.length > 0 ? media.originalUrl : typeof media.url === "string" && media.url.length > 0 ? media.url : null;
if (!urlCandidate) return null;
const typePrefix = media.type === "image" || media.type === "video" || media.type === "gif" ? `${media.type}:` : "";
const parsed = tryParseUrl(urlCandidate, "https://example.invalid");
if (parsed) {
const host = parsed.hostname;
const path = parsed.pathname;
const format = parsed.searchParams.get("format");
if (host && path) return `${typePrefix}${host}${path}${format ? `?format=${format}` : ""}`;
}
const filename = extractFilenameFromUrl(urlCandidate);
return filename ? `${typePrefix}${filename}` : `${typePrefix}${urlCandidate}`;
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
//#region src/shared/utils/types/safety.ts
/**
* Safely parse a string to integer with fallback to 0.
* Handles null/undefined and invalid inputs.
* @param value - String to parse or null/undefined
* @param radix - Base for parsing (default: 10)
* @returns Parsed integer or 0
*/
function safeParseInt(value, radix = 10) {
if (value == null) return 0;
const result = Number.parseInt(value, radix);
return Number.isNaN(result) ? 0 : result;
}
/**
* Constrain a number to a specified range.
* @param value - Number to clamp
* @param min - Minimum value (default: 0)
* @param max - Maximum value (default: 1)
* @returns Value clamped to [min, max]
*/
function clamp(value, min = 0, max = 1) {
return Math.min(Math.max(value, min), max);
}
/**
* Safely clamp an index to valid array bounds.
* Handles non-finite values and invalid lengths.
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
var STANDARD_GALLERY_HEIGHT = 720;
var DEFAULT_DIMENSIONS = {
width: 540,
height: STANDARD_GALLERY_HEIGHT
};
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
if (heightRatio <= 0 || widthRatio <= 0) return DEFAULT_DIMENSIONS;
return {
width: Math.max(1, Math.round(widthRatio / heightRatio * STANDARD_GALLERY_HEIGHT)),
height: STANDARD_GALLERY_HEIGHT
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
dimensions: DEFAULT_DIMENSIONS,
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
dimensions: DEFAULT_DIMENSIONS,
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
var createMediaInfoFromAPI = (apiMedia, tweetInfo, index, tweetTextHTML) => {
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
metadata
};
} catch (error) {
return null;
}
};
/**
* Transform API Media to MediaInfo Array
*/
function convertAPIMediaToMediaInfo(apiMedias, tweetInfo, tweetTextHTML) {
const mediaItems = [];
for (let i = 0; i < apiMedias.length; i++) {
const apiMedia = apiMedias[i];
if (!apiMedia) continue;
const mediaInfo = createMediaInfoFromAPI(apiMedia, tweetInfo, i, tweetTextHTML);
if (mediaInfo) mediaItems.push(mediaInfo);
}
return mediaItems;
}
//#endregion
//#region src/constants/twitter-api.ts
/** @fileoverview X.com API configuration for GraphQL queries and authentication. */
var TWITTER_API_CONFIG = {
GUEST_AUTHORIZATION: "Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA",
TWEET_RESULT_BY_REST_ID_QUERY_ID: "zAz9764BcLZOJ0JU2wrd1A",
USER_BY_SCREEN_NAME_QUERY_ID: "1VOOyvKkiI3FMmkeDNxM9A",
SUPPORTED_HOSTS: ["x.com", "twitter.com"],
DEFAULT_HOST: "x.com"
};
//#endregion
//#region src/shared/core/twitter-api/endpoint.ts
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
//#region src/shared/dom/safe-location.ts
function getSafeHref() {
return globalThis.location?.href;
}
function getSafeHostname() {
return globalThis.location?.hostname;
}
function getSafeLocationHeaders() {
const referer = getSafeHref();
const origin = globalThis.location?.origin;
if (!referer && !origin) return {};
return {
...referer ? { referer } : {},
...origin ? { origin } : {}
};
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
var cachedCookieAPI;
function resolveCookieAPI() {
try {
return getUserscript().cookie ?? null;
} catch {
return null;
}
}
function getCookieAPI() {
if (cachedCookieAPI === void 0) cachedCookieAPI = resolveCookieAPI();
return cachedCookieAPI;
}
function parseDocumentCookies(filterName) {
const cookieStr = document.cookie;
if (!cookieStr) return [];
return cookieStr.split(";").map((entry) => entry.trim()).filter(Boolean).map((entry) => {
const eqIdx = entry.indexOf("=");
return {
name: eqIdx >= 0 ? entry.slice(0, eqIdx) : entry,
value: eqIdx >= 0 ? entry.slice(eqIdx + 1) : "",
path: "/",
session: true
};
}).filter((r) => !filterName || r.name === filterName);
}
async function listCookies(options) {
const gm = getCookieAPI();
if (!gm?.list) return parseDocumentCookies(options?.name);
return promisifyCallback((cb) => gm.list(options, (cookies, error) => {
if (error) return cb(void 0, error);
cb((cookies ?? []).map((c) => ({ ...c })), void 0);
}), { fallback: () => parseDocumentCookies(options?.name) });
}
async function getCookieValue(name) {
if (!name) return void 0;
if (getCookieAPI()?.list) {
const value = (await listCookies({ name }))[0]?.value;
if (value) return value;
}
return getCookieValueSync(name);
}
function getCookieValueSync(name) {
if (!name) return void 0;
const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${escapeRegExp(name)}=([^;]*)`));
if (!match?.[1]) return void 0;
try {
return decodeURIComponent(match[1]);
} catch {
return match[1];
}
}
//#endregion
//#region src/shared/services/media/twitter-auth/twitter-auth.ts
var _csrfToken;
async function getCsrfTokenAsync() {
if (_csrfToken) return _csrfToken;
const syncToken = getCookieValueSync("ct0");
if (syncToken) {
_csrfToken = syncToken;
return syncToken;
}
_csrfToken = await getCookieValue("ct0") ?? void 0;
return _csrfToken;
}
function resolveBearerToken() {
try {
const nextDataScript = document.getElementById("__NEXT_DATA__");
if (nextDataScript?.textContent) {
const nextData = JSON.parse(nextDataScript.textContent);
const token = nextData?.props?.pageProps?.token?.Bearer ?? nextData?.props?.token?.Bearer;
if (token && typeof token === "string") return `Bearer ${token}`;
}
} catch {}
return TWITTER_API_CONFIG.GUEST_AUTHORIZATION;
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
if (tweet.legacy) {
if (!tweet.extended_entities) tweet.extended_entities = tweet.legacy.extended_entities;
if (!tweet.full_text) tweet.full_text = tweet.legacy.full_text;
if (!tweet.id_str) tweet.id_str = tweet.legacy.id_str;
}
const noteText = tweet.note_tweet?.note_tweet_results?.result?.text;
if (noteText) tweet.full_text = noteText;
}
function normalizeLegacyUser(user) {
if (user.legacy) {
if (!user.screen_name) user.screen_name = user.legacy.screen_name;
if (!user.name) user.name = user.legacy.name;
}
}
//#endregion
//#region src/shared/services/media/twitter-api-client.ts
/**
* @fileoverview Twitter Video Extractor - GraphQL API Integration
* @description Facade for Twitter API interactions, delegating to specialized services.
*/
function resolveTwitterApiHost(hostname, supportedHosts, defaultHost) {
if (!hostname) return defaultHost;
const normalized = hostname.toLowerCase();
for (const host of supportedHosts) if (normalized === host || normalized.endsWith(`.${host}`)) return host;
return defaultHost;
}
function getSafeHost() {
return resolveTwitterApiHost(getSafeHostname(), TWITTER_API_CONFIG.SUPPORTED_HOSTS, TWITTER_API_CONFIG.DEFAULT_HOST);
}
function createTweetEndpointUrl(tweetId) {
return buildTweetResultByRestIdUrl({
host: getSafeHost(),
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
async function apiRequest(url) {
const csrfToken = await getCsrfTokenAsync() ?? "";
const authorization = resolveBearerToken() ?? TWITTER_API_CONFIG.GUEST_AUTHORIZATION;
const headers = new Headers({
authorization,
"x-csrf-token": csrfToken,
"x-twitter-client-language": "en",
"x-twitter-active-user": "yes",
"content-type": "application/json",
"x-twitter-auth-type": "OAuth2Session"
});
const locationHeaders = getSafeLocationHeaders();
if (locationHeaders.referer) headers.append("referer", locationHeaders.referer);
if (locationHeaders.origin) headers.append("origin", locationHeaders.origin);
try {
const response = await HttpRequestService.getInstance().get(url, {
headers: Object.fromEntries(headers.entries()),
responseType: "json"
});
if (!response.ok) throw new Error(`TW:${response.status}`);
return response.data;
} catch (error) {
throw error;
}
}
/**
* Get Tweet Medias - Main API Entry Point
*/
async function getTweetMedias(tweetId) {
const json = await apiRequest(createTweetEndpointUrl(tweetId));
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
//#endregion
//#region src/shared/services/media-extraction/determine-clicked-index.ts
var determineClickedIndex = (clickedElement, mediaItems) => {
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
} catch {
return 0;
}
};
var resolveClickedElementUrl = (clickedElement) => {
const mediaElement = findMediaElementInDOM(clickedElement);
const elementUrl = mediaElement ? extractMediaUrlFromElement(mediaElement) : null;
if (elementUrl) return elementUrl;
return extractBackgroundImageUrl(mediaElement ?? clickedElement, 3);
};
var extractBackgroundImageUrl = (element, maxAncestorHops) => {
if (!element) return null;
let current = element;
for (let hops = 0; hops <= maxAncestorHops && current; hops++) {
const url = extractUrlFromCssValue((globalThis.getComputedStyle?.(current))?.backgroundImage ?? "");
if (url) return url;
current = current.parentElement;
}
return null;
};
var extractUrlFromCssValue = (value) => {
if (!value || value === "none") return null;
return value.match(/url\((?:'|")?(.*?)(?:'|")?\)/i)?.[1]?.trim() || null;
};
var getNormalizedMediaCandidates = (item) => {
const candidates = [
item.url,
item.originalUrl,
item.thumbnailUrl
];
const apiData = item.metadata?.apiData;
if (apiData) candidates.push(getStringValue(apiData, "download_url"), getStringValue(apiData, "preview_url"));
const normalized = candidates.map((candidate) => candidate ? normalizeMediaUrl(candidate) : null).filter((candidate) => !!candidate);
return Array.from(new Set(normalized));
};
var getStringValue = (record, key) => {
const value = record[key];
return typeof value === "string" && value.trim() ? value : null;
};
//#endregion
//#region src/shared/services/media-extraction/extractors/twitter-api-extractor.ts
/**
* @fileoverview Twitter API-Based Media Extractor (Primary Strategy)
*/
var TwitterAPIExtractor = class {
async extract(tweetInfo, clickedElement, _options, extractionId) {
try {
const apiMedias = await getTweetMedias(tweetInfo.tweetId);
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
//#region src/shared/types/media.types.ts
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
//#endregion
//#region src/shared/types/result.types.ts
/**
* Error codes for machine-readable error identification.
*
* Using const object instead of enum for tree-shaking optimization.
*/
var ErrorCode = {
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
//#endregion
//#region src/shared/utils/id/create-id.ts
/**
* Generates a unique ID using crypto.randomUUID.
* @returns Compact unique identifier without dashes.
*/
function createId() {
return crypto.randomUUID().replaceAll("-", "");
}
/**
* Generates a prefixed unique ID.
* @param prefix - The prefix for the ID
* @param separator - Separator between prefix and ID (default: '_')
* @returns Prefixed ID in format: `{prefix}{separator}{id}`
*/
function createPrefixedId(prefix, separator = "_") {
return `${prefix}${separator}${createId()}`;
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
var MediaExtractionService = class {
tweetInfoExtractor;
apiExtractor;
domFallbackExtractor;
constructor() {
this.tweetInfoExtractor = new TweetInfoExtractor();
this.apiExtractor = new TwitterAPIExtractor();
this.domFallbackExtractor = new DOMFallbackExtractor();
}
async extractFromClickedElement(element, options = {}) {
const extractionId = generateExtractionId();
try {
const tweetInfo = this.tweetInfoExtractor.extract(element);
if (!tweetInfo?.tweetId) return createErrorResult("No tweet information found");
const apiResult = await this.apiExtractor.extract(tweetInfo, element, options, extractionId);
if (apiResult.success && apiResult.mediaItems.length > 0) return finalizeResult({
...apiResult,
tweetInfo: mergeTweetInfo(tweetInfo, apiResult.tweetInfo)
});
const domResult = await this.domFallbackExtractor.extract(tweetInfo, element, options, extractionId);
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
var _instance = null;
var MediaService = class MediaService {
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
static getInstance() {
if (!_instance) _instance = new MediaService();
return _instance;
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
//#endregion
//#region src/shared/container/settings-registry.ts
var _settings = null;
function registerSettings(s) {
_settings = s;
}
function tryGetSettings() {
return _settings;
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
//#region src/shared/dom/theme.ts
/**
* @fileoverview Theme DOM helpers
* @description Keep theme-related data attributes in sync across document root and XEG scopes.
*/
var THEME_DOM_ATTRIBUTE = "data-theme";
/**
* Synchronize data-theme attribute for gallery theme scopes.
* Updates XEG theme scope elements and optionally document root.
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
//#region src/shared/services/event-manager.ts
var _eventManagerInstance = null;
var EventManager = class EventManager {
listeners = /* @__PURE__ */ new Map();
constructor() {}
static getInstance() {
if (!_eventManagerInstance) _eventManagerInstance = new EventManager();
return _eventManagerInstance;
}
addEventListener(element, type, listener, options) {
const { context, ...listenerOptions } = options ?? {};
if (!element || typeof element.addEventListener !== "function") return null;
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
return true;
} catch (error) {
return false;
}
}
};
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
var _themeInstance = null;
var ThemeService = class ThemeService {
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
static getInstance() {
if (!_themeInstance) _themeInstance = new ThemeService();
return _themeInstance;
}
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
for (const mutation of mutations) mutation.addedNodes.forEach((node) => {
if (!(node instanceof Element)) return;
const scopes = [];
if (node.classList.contains("xeg-theme-scope")) scopes.push(node);
node.querySelectorAll(".xeg-theme-scope").forEach((scope) => scopes.push(scope));
if (scopes.length > 0) this.applyThemeToScopes(scopes);
});
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
this.domEventsController?.abort();
this.domEventsController = null;
this.mediaQueryListener = null;
this.mediaQueryList = null;
}
initializeSystemDetection() {
if (!this.mediaQueryList) return;
if (this.mediaQueryListener) return;
if (!this.domEventsController || this.domEventsController.signal.aborted) this.domEventsController = new AbortController();
this.mediaQueryListener = () => {
if (this.themeSetting === "auto") this.applyCurrentTheme(true);
};
EventManager.getInstance().addEventListener(this.mediaQueryList, "change", (event) => this.mediaQueryListener(event), {
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
//#endregion
//#region src/bootstrap/base-services.ts
/**
* @fileoverview Core base services initialization for application bootstrap.
*
* Invokes lifecycle `initialize()` on ES module singletons (theme, language, media).
*/
async function initializeCoreBaseServices() {
const services = [
ThemeService.getInstance(),
LanguageService.getInstance(),
MediaService.getInstance()
];
for (const service of services) await service.initialize();
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
const path = url.split("?")[0];
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
const idx = safeParseInt(match[1], 10);
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
const num = typeof index === "string" ? safeParseInt(index, 10) : index;
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
//#region src/shared/utils/download/report-progress.ts
var reportProgress = (onProgress, payload) => {
if (!onProgress) return;
const percentage = payload.percentage ?? (payload.total <= 0 ? 0 : Math.min(100, Math.max(0, Math.round(payload.current / payload.total * 100))));
onProgress({
...payload,
percentage
});
};
//#endregion
//#region src/shared/services/download/single-download.ts
function asGMDownloadFunction(value) {
return typeof value === "function" ? value : void 0;
}
function detectDownloadCapability() {
const gmDownload = asGMDownloadFunction(resolveGMDownload());
const hasGMDownload = !!gmDownload;
return {
hasGMDownload,
method: hasGMDownload ? "gm_download" : "none",
gmDownload: hasGMDownload ? gmDownload : void 0
};
}
var DOWNLOAD_TIMEOUT_MS = 3e4;
var DOWNLOAD_TIMEOUT_MESSAGE = "Download timeout";
var createAbortResult = () => ({
success: false,
error: "Download cancelled by user"
});
async function downloadSingleFile(media, options = {}, capability) {
if (options.signal?.aborted) return createAbortResult();
const filename = generateMediaFilename(media, { nowMs: performance.now() });
const gmDownload = (capability ?? detectDownloadCapability()).gmDownload;
if (!gmDownload) return {
success: false,
error: "No download method available"
};
reportProgress(options.onProgress, {
phase: "preparing",
current: 0,
total: 1,
percentage: 0,
filename
});
let url = media.url;
let isBlobUrl = false;
const blob = options.blob;
if (blob) {
url = URL.createObjectURL(blob);
isBlobUrl = true;
}
return new Promise((resolve) => {
let timer;
let settled = false;
const cleanup = () => {
if (isBlobUrl) URL.revokeObjectURL(url);
if (timer) clearTimeout(timer);
};
const settle = (result) => {
if (settled) return;
settled = true;
if (result.success) reportProgress(options.onProgress, {
phase: "complete",
current: 1,
total: 1,
percentage: 100,
filename
});
cleanup();
resolve(result);
};
timer = setTimeout(() => {
settle({
success: false,
error: DOWNLOAD_TIMEOUT_MESSAGE
});
}, DOWNLOAD_TIMEOUT_MS);
try {
gmDownload({
url,
name: filename,
onload: () => settle({
success: true,
filename
}),
onerror: (error) => {
settle({
success: false,
error: normalizeErrorMessage(error)
});
},
ontimeout: () => settle({
success: false,
error: DOWNLOAD_TIMEOUT_MESSAGE
}),
onprogress: (progress) => {
if (settled || !options.onProgress || progress.total <= 0) return;
const pct = Math.min(100, Math.max(0, Math.round(progress.loaded / progress.total * 100)));
reportProgress(options.onProgress, {
phase: "downloading",
current: progress.loaded,
total: progress.total,
percentage: pct,
filename
});
}
});
} catch (error) {
settle({
success: false,
error: normalizeErrorMessage(error)
});
}
});
}
//#endregion
//#region src/shared/external/zip/zip-utils.ts
/**
* @fileoverview ZIP utility helpers for CRC32 and byte encoding
* @description Shared ZIP encoding and checksum functions
*/
var textEncoder = new TextEncoder();
var crc32Table = null;
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
const bytes = new Uint8Array(2);
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
const bytes = new Uint8Array(4);
bytes[0] = value & 255;
bytes[1] = value >>> 8 & 255;
bytes[2] = value >>> 16 & 255;
bytes[3] = value >>> 24 & 255;
return bytes;
}
//#endregion
//#region src/shared/external/zip/streaming-zip-writer.ts
/**
* @fileoverview Streaming ZIP writer for progressive ZIP generation
* @description Pipelined file downloads and ZIP assembly with immediate Local File Headers
*/
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
data,
offset: this.currentOffset,
crc32
});
this.currentOffset += localHeader.length + data.length;
}
/**
* Finalize ZIP file (add Central Directory)
* @returns Complete ZIP archive as Uint8Array
* @throws Error if archive exceeds Zip32 limits
*/
finalize() {
assertZip32(this.entries.length < ZIP_CONST.MAX_UINT16, `too many entries (count=${this.entries.length})`);
const centralDirStart = this.currentOffset;
assertZip32(centralDirStart < ZIP_CONST.MAX_UINT32, `central directory offset overflow (${centralDirStart})`);
const centralDirChunks = [];
for (const entry of this.entries) {
const filenameBytes = encodeUtf8(entry.filename);
assertZip32(entry.offset < ZIP_CONST.MAX_UINT32, `entry offset overflow (${entry.offset})`);
assertZip32(entry.data.length < ZIP_CONST.MAX_UINT32, `entry too large (size=${entry.data.length})`);
centralDirChunks.push(concat([
ZIP_CONST.SIG_CENTRAL_DIR,
writeUint16LE(ZIP_CONST.VERSION),
writeUint16LE(ZIP_CONST.VERSION),
writeUint16LE(ZIP_CONST.UTF8_FLAG),
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
assertZip32(centralDir.length < ZIP_CONST.MAX_UINT32, `central directory too large (size=${centralDir.length})`);
const endOfCentralDir = concat([
ZIP_CONST.SIG_END_CENTRAL_DIR,
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
};
//#endregion
//#region src/shared/async/delay.ts
/**
* @fileoverview Delay utility with AbortSignal support
* @description Modern async delay primitive replacing setTimeout-based patterns
*/
/**
* Create a promise that resolves after a delay
*
* Supports cancellation via AbortSignal - when signal is aborted,
* the promise rejects immediately.
*
* @param ms - Delay duration in milliseconds
* @param signal - Optional AbortSignal for cancellation
* @returns Promise that resolves after delay or rejects on abort
*
* @example
* ```typescript
* // Simple delay
* await delay(1000);
*
* // Cancellable delay
* const controller = new AbortController();
* try {
*   await delay(5000, controller.signal);
* } catch (error) {
*   if (isAbortError(error)) {
*     console.log('Delay was cancelled');
*   }
* }
*
* // Cancel from elsewhere
* controller.abort();
* ```
*/
async function delay(ms, signal) {
if (ms <= 0) return;
if (signal?.aborted) throw getAbortReasonOrAbortErrorFromSignal(signal);
return new Promise((resolve, reject) => {
const timerId = setTimeout(() => {
cleanup();
resolve();
}, ms);
const onAbort = () => {
cleanup();
reject(getAbortReasonOrAbortErrorFromSignal(signal));
};
const cleanup = () => {
clearTimeout(timerId);
signal?.removeEventListener("abort", onAbort);
};
signal?.addEventListener("abort", onAbort, { once: true });
});
}
//#endregion
//#region src/shared/async/retry.ts
/**
* @fileoverview Retry utility with exponential backoff.
*/
var DEFAULTS$2 = {
maxAttempts: 3,
baseDelayMs: 200,
maxDelayMs: 1e4
};
function calcBackoff(attempt, base, max) {
const exp = base * 2 ** attempt;
const jitter = Math.random() * .25 * exp;
return Math.min(Math.floor(exp + jitter), max);
}
async function withRetry(operation, options = {}) {
const { maxAttempts = DEFAULTS$2.maxAttempts, baseDelayMs = DEFAULTS$2.baseDelayMs, maxDelayMs = DEFAULTS$2.maxDelayMs, signal, onRetry, shouldRetry } = options;
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
const delayMs = calcBackoff(attempt, baseDelayMs, maxDelayMs);
onRetry?.(attempt + 1, error, delayMs);
try {
await delay(delayMs, signal);
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
async function fetchArrayBufferWithRetry(url, retries, signal, backoffBaseMs = 200) {
if (signal?.aborted) throw getUserCancelledAbortErrorFromSignal(signal);
const httpService = HttpRequestService.getInstance();
const result = await withRetry(async () => {
if (signal?.aborted) throw getUserCancelledAbortErrorFromSignal(signal);
const response = await httpService.get(url, {
responseType: "arraybuffer",
timeout: 3e4,
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
var MAX_CONCURRENCY = 8;
var MIN_CONCURRENCY = 1;
var DEFAULT_CONCURRENCY = 4;
var DEFAULT_RETRIES = 3;
var clampConcurrency = (value) => {
return Math.min(MAX_CONCURRENCY, Math.max(MIN_CONCURRENCY, value ?? DEFAULT_CONCURRENCY));
};
var clampRetries = (value) => Math.max(0, value ?? DEFAULT_RETRIES);
var throwIfAborted = (signal) => {
if (signal?.aborted) throw getUserCancelledAbortErrorFromSignal(signal);
};
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
const blob = item.blob instanceof Promise ? await item.blob : item.blob;
throwIfAborted(abortSignal);
data = new Uint8Array(await blob.arrayBuffer());
} else data = await fetchArrayBufferWithRetry(item.url, retries, abortSignal, 200);
throwIfAborted(abortSignal);
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
total
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
var _downloadInstance = null;
var DownloadOrchestrator = class DownloadOrchestrator {
capability = null;
_initialized = false;
constructor() {}
static getInstance() {
if (!_downloadInstance) _downloadInstance = new DownloadOrchestrator();
return _downloadInstance;
}
/** Initialize service (idempotent) */
initialize() {
this._initialized = true;
}
/** Destroy service (idempotent) */
destroy() {
this.capability = null;
this._initialized = false;
}
/** Check if service is initialized */
isInitialized() {
return this._initialized;
}
/**
* Get download capability (cached)
*/
getCapability() {
return this.capability ??= detectDownloadCapability();
}
/**
* Download a single media file
*
* @param media - Media info containing URL and metadata
* @param options - Download options (signal, progress callback)
* @returns Download result with success status
*/
async downloadSingle(media, options = {}) {
return downloadSingleFile(media, options, this.getCapability());
}
/**
* Download multiple media files as a ZIP archive
*
* @param mediaItems - Array of media items to download
* @param options - Download options including optional zipFilename
* @returns Bulk download result with per-file status
*/
async downloadBulk(mediaItems, options = {}) {
if (options.signal?.aborted) return {
success: false,
status: "error",
filesProcessed: 0,
filesSuccessful: 0,
error: normalizeErrorMessage(getUserCancelledAbortErrorFromSignal(options.signal)),
code: ErrorCode.CANCELLED
};
if (mediaItems.length === 0) return {
success: false,
status: "error",
filesProcessed: 0,
filesSuccessful: 0,
error: "No media to download",
code: ErrorCode.EMPTY_INPUT
};
const capability = this.getCapability();
if (capability.method === "none") return {
success: false,
status: "error",
filesProcessed: mediaItems.length,
filesSuccessful: 0,
error: "No download method",
code: ErrorCode.ALL_FAILED
};
const plan = planBulkDownload({
mediaItems,
prefetchedBlobs: options.prefetchedBlobs,
zipFilename: options.zipFilename,
nowMs: performance.now()
});
const items = plan.items;
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
const filename = plan.zipFilename;
const saveResult = await this.saveZipBlob(zipBlob, filename, options, capability);
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
filename,
failures: result.failures,
code: ErrorCode.NONE
};
} catch (error) {
if (isAbortError(error)) return {
success: false,
status: "error",
filesProcessed: items.length,
filesSuccessful: 0,
error: normalizeErrorMessage(error),
code: ErrorCode.CANCELLED
};
return {
success: false,
status: "error",
filesProcessed: items.length,
filesSuccessful: 0,
error: normalizeErrorMessage(error),
code: ErrorCode.ALL_FAILED
};
}
}
async saveZipBlob(zipBlob, filename, options, capability) {
if (capability.method === "gm_download" && capability.gmDownload) return this.saveWithGMDownload(capability.gmDownload, zipBlob, filename, options.onProgress);
return {
success: false,
error: "No download method"
};
}
async saveWithGMDownload(gmDownload, blob, filename, onprogress) {
const url = URL.createObjectURL(blob);
try {
await new Promise((resolve, reject) => {
gmDownload({
url,
name: filename,
onload: () => resolve(),
onerror: (err) => reject(err),
ontimeout: () => reject(/* @__PURE__ */ new Error("Timeout")),
...onprogress ? { onprogress: (progress) => {
if (progress.total <= 0) return;
const pct = Math.min(100, Math.max(0, Math.round(progress.loaded / progress.total * 100)));
onprogress({
phase: "saving",
current: progress.loaded,
total: progress.total,
percentage: pct,
filename
});
} } : {}
});
});
return { success: true };
} catch (error) {
return {
success: false,
error: normalizeErrorMessage(error)
};
} finally {
URL.revokeObjectURL(url);
}
}
};
//#endregion
//#region src/shared/container/container.ts
/**
* @fileoverview Service registry, type-safe settings access, and singleton accessors.
*/
function getThemeService() {
return ThemeService.getInstance();
}
function getLanguageService() {
return LanguageService.getInstance();
}
function getMediaService() {
return MediaService.getInstance();
}
function getDownloadOrchestrator() {
return DownloadOrchestrator.getInstance();
}
//#endregion
//#region src/shared/error/app-error-reporter.ts
/**
* @fileoverview Error reporting: pre-bound reporters for each context.
*/
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
//#endregion
//#region src/shared/utils/events/emitter.ts
function createEventEmitter() {
const listeners = /* @__PURE__ */ new Map();
return {
on(event, callback) {
const eventListeners = listeners.get(event);
if (eventListeners) eventListeners.add(callback);
else listeners.set(event, new Set([callback]));
return () => {
const currentListeners = listeners.get(event);
if (currentListeners) currentListeners.delete(callback);
};
},
emit(event, data) {
const eventListeners = listeners.get(event);
if (!eventListeners) return;
for (const callback of eventListeners) try {
callback(data);
} catch (error) {}
},
dispose() {
listeners.clear();
}
};
}
//#endregion
//#region node_modules/.pnpm/solid-js@1.9.12/node_modules/solid-js/dist/solid.js
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
var [transPending, setTransPending] = /* @__PURE__ */ createSignal(false);
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
//#region src/shared/state/signals/gallery.signals.ts
var INITIAL_NAV_SOURCE = "auto-focus";
var [_navSource, setNavSource] = createSignal(INITIAL_NAV_SOURCE);
var [_navTimestamp, setNavTimestamp] = createSignal(0);
var [_navIndex, setNavIndex] = createSignal(null);
var isManualSource = (source) => source === "button" || source === "keyboard";
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
function resetNavigation(nowMs) {
setNavSource(INITIAL_NAV_SOURCE);
setNavTimestamp(nowMs ?? performance.now());
setNavIndex(null);
}
function resolveNavigationSource(trigger) {
if (trigger === "scroll") return "scroll";
if (trigger === "keyboard") return "keyboard";
return "button";
}
var INITIAL_STATE = {
isOpen: false,
mediaItems: [],
currentIndex: 0,
error: null
};
var galleryIndexEvents = createEventEmitter();
var [isOpenSig, setIsOpenSig] = createSignal(INITIAL_STATE.isOpen);
function setIsOpen(value) {
setIsOpenSig(value);
}
var [mediaItemsSig, setMediaItems] = createSignal(INITIAL_STATE.mediaItems);
var [currentIndexSig, setCurrentIndex] = createSignal(INITIAL_STATE.currentIndex);
var [focusedIndexSig, setFocusedIndex] = createSignal(null);
var [currentVideoElementSig, setCurrentVideoElement] = createSignal(null);
var [_errorSig, _setErrorSig] = createSignal(INITIAL_STATE.error);
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
function setError(error) {
_setErrorSig(error);
}
function applyGallerySessionUpdate(state) {
batch(() => {
setMediaItems(state.mediaItems);
setCurrentIndex(state.currentIndex);
setFocusedIndex(state.focusedIndex);
setCurrentVideoElement(state.currentVideoElement);
_setErrorSig(state.error);
setIsOpen(state.isOpen);
});
}
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
function navigateNext(trigger = "click") {
const items = mediaItemsSig();
const current = currentIndexSig();
if (items.length <= 1) return;
const next = current + 1;
if (next >= items.length) return;
batch(() => {
setCurrentIndex(next);
setFocusedIndex(next);
});
recordNavigation(next, resolveNavigationSource(trigger));
galleryIndexEvents.emit("navigate:complete", {
index: next,
trigger
});
}
function navigatePrevious(trigger = "click") {
const items = mediaItemsSig();
const current = currentIndexSig();
if (items.length <= 1) return;
const prev = current - 1;
if (prev < 0) return;
batch(() => {
setCurrentIndex(prev);
setFocusedIndex(prev);
});
recordNavigation(prev, resolveNavigationSource(trigger));
galleryIndexEvents.emit("navigate:complete", {
index: prev,
trigger
});
}
function navigateToItem(targetIndex, source) {
const clampedIndex = clampIndex(targetIndex, mediaItemsSig().length);
if (clampedIndex === currentIndexSig()) return;
batch(() => {
setCurrentIndex(clampedIndex);
setFocusedIndex(clampedIndex);
});
recordNavigation(clampedIndex, source);
galleryIndexEvents.emit("navigate:complete", {
index: clampedIndex,
trigger: source
});
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
function getGalleryVideo(video) {
if (video instanceof HTMLVideoElement) return video;
const signaled = gallerySignals.currentVideoElement;
return signaled instanceof HTMLVideoElement ? signaled : null;
}
function playVideo(video, context) {
video.play?.().catch(() => {});
}
function pauseVideo(video) {
video.pause?.();
}
function togglePlayPause(video, context) {
if (!video.paused) pauseVideo(video);
else playVideo(video, context);
}
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
var keyboardDebounceState = {
lastExecutionTime: 0,
lastKey: ""
};
function shouldExecuteKeyboardAction(key, minIntervalMs) {
const now = performance.now();
const timeSinceLastExecution = now - keyboardDebounceState.lastExecutionTime;
if (key === keyboardDebounceState.lastKey && timeSinceLastExecution < minIntervalMs) return false;
keyboardDebounceState = {
lastExecutionTime: now,
lastKey: key
};
return true;
}
function resetKeyboardDebounceState() {
keyboardDebounceState = {
lastExecutionTime: 0,
lastKey: ""
};
}
/** Navigation and help keys: Home, End, PageUp/Down, Arrows, ? */
var NAVIGATION_KEYS = new Set([
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
var VIDEO_CONTROL_KEYS = new Set([
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
const isNavKey = NAVIGATION_KEYS.has(key) || key === "Space";
const isVideoKey = VIDEO_CONTROL_KEYS.has(key) || key === "Space";
if (!isNavKey && !isVideoKey) {
handlers.onKeyboardEvent?.(event);
return;
}
event.preventDefault();
event.stopPropagation();
if (key === "?") showKeyboardHelp();
else if (key === "Space") handleVideoControl(key);
else if ((key === "ArrowUp" || key === "ArrowDown") && gallerySignals.currentVideoElement) handleVideoControl(key);
else if (NAVIGATION_KEYS.has(key)) handleNavigation(key);
else handleVideoControl(key);
handlers.onKeyboardEvent?.(event);
} catch (error) {}
}
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
function handleVideoControl(key) {
switch (key) {
case "Space":
if (shouldExecuteKeyboardAction("Space", 150)) executeVideoControl("togglePlayPause");
break;
case "ArrowUp":
if (shouldExecuteKeyboardAction("ArrowUp", 100)) executeVideoControl("volumeUp");
break;
case "ArrowDown":
if (shouldExecuteKeyboardAction("ArrowDown", 100)) executeVideoControl("volumeDown");
break;
case "m":
case "M":
if (shouldExecuteKeyboardAction("M", 100)) executeVideoControl("toggleMute");
break;
}
}
function showKeyboardHelp() {
if (!shouldExecuteKeyboardAction("?", 500)) return;
try {
const lang = getLanguageService();
getUserscript().notification({
title: lang.translate("msg.kb.t"),
text: [
lang.translate("msg.kb.prev"),
lang.translate("msg.kb.next"),
lang.translate("msg.kb.cls"),
lang.translate("msg.kb.toggle")
].join("\n"),
timeout: 6e3
});
} catch {}
}
//#endregion
//#region src/constants/video-controls.ts
/** @fileoverview Video player control detection constants. */
var VIDEO_CONTROL_DATASET_PREFIXES = [
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
var VIDEO_CONTROL_ROLES = ["slider", "progressbar"];
var VIDEO_CONTROL_ARIA_TOKENS = [
"volume",
"mute",
"unmute",
"seek",
"scrub",
"timeline",
"progress"
];
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
var GALLERY_SELECTORS = CSS.INTERNAL_SELECTORS;
var VIDEO_CONTROL_SELECTORS = [".video-controls", ".video-progress button"];
/**
* Check if string value contains any control tokens (case-insensitive).
*/
function containsControlToken(value, tokens) {
if (!value) return false;
const normalized = value.toLowerCase();
return tokens.some((token) => normalized.includes(token.toLowerCase()));
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
* Determine if element is a video control.
*/
function isVideoControlElement(element) {
if (!isHTMLElement(element)) return false;
if (element.tagName.toLowerCase() === "video") return true;
if (typeof element.matches !== "function") return false;
if (matchesVideoControlSelectors(element)) return true;
if (containsControlToken(getNearestAttributeValue(element, "data-testid"), VIDEO_CONTROL_DATASET_PREFIXES)) return true;
if (containsControlToken(getNearestAttributeValue(element, "aria-label"), VIDEO_CONTROL_ARIA_TOKENS)) return true;
if (!isWithinVideoPlayer(element)) return false;
const role = element.getAttribute("role");
if (role && VIDEO_CONTROL_ROLES.includes(role.toLowerCase())) return true;
return element.matches("input[type=\"range\"]");
}
/**
* Check if element is inside the gallery UI.
*/
function isGalleryInternalElement(element) {
if (!isHTMLElement(element)) return false;
if (typeof element.matches !== "function") return false;
return GALLERY_SELECTORS.some((selector) => {
return element.matches(selector) || element.closest(selector) !== null;
});
}
/**
* Check if event originated from gallery UI.
*/
function isGalleryInternalEvent(event) {
const target = event.target;
if (!isHTMLElement(target)) return false;
return isGalleryInternalElement(target);
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
var TWITTER_HOST_RE = /(^|\.)(?:x|twitter)\.com$/iu;
var STATUS_MEDIA_RE = /\/status\/\d+|\/photo\/\d+|\/video\/\d+/iu;
function isValidMediaSource(url) {
if (!url) return false;
if (url.startsWith("blob:")) return true;
return isValidMediaUrl(url);
}
function isNativeStatusMediaLink(href) {
if (!href) return false;
const parsed = tryParseUrl(href);
if (!parsed || !TWITTER_HOST_RE.test(parsed.hostname)) return false;
return STATUS_MEDIA_RE.test(parsed.pathname);
}
function isMediaCard(cardWrapper) {
for (const link of cardWrapper.querySelectorAll("a[href]")) if (!isNativeStatusMediaLink(link.getAttribute("href"))) return false;
if (cardWrapper.querySelector("img[src*=\"pbs.twimg.com/card_img\"]")) return true;
return cardWrapper.querySelector("img, video") !== null;
}
function shouldBlockMediaTrigger(target) {
if (!target) return false;
if (isVideoControlElement(target)) return true;
if (target.closest(CSS.SELECTORS.ROOT) || target.closest(CSS.SELECTORS.OVERLAY)) return true;
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
function isProcessableMedia(target) {
if (!target || gallerySignals.isOpen || shouldBlockMediaTrigger(target)) return false;
const mediaElement = findMediaElementInDOM(target);
if (mediaElement) {
if (isValidMediaSource(extractMediaUrlFromElement(mediaElement))) return true;
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
async function handleMediaClick(event, handlers, options) {
if (!options.enableMediaDetection) return;
const target = event.target;
if (!isHTMLElement(target)) return;
if (gallerySignals.isOpen && isGalleryInternalElement(target)) return;
if (isVideoControlElement(target)) return;
if (!isProcessableMedia(target)) return;
event.stopImmediatePropagation();
event.preventDefault();
try {
await handlers.onMediaClick(target, event);
} catch (error) {}
}
//#endregion
//#region src/shared/utils/events/lifecycle/gallery-lifecycle.ts
var initialized = false;
var currentContext = null;
function initializeGalleryEvents(handlers, options) {
if (initialized) cleanupGalleryEvents();
if (!handlers) return cleanupGalleryEvents;
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
const eventManager = EventManager.getInstance();
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
return cleanupGalleryEvents;
}
function cleanupGalleryEvents() {
if (!initialized) return;
if (currentContext) EventManager.getInstance().removeByContext(currentContext);
resetKeyboardDebounceState();
initialized = false;
currentContext = null;
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
//#region src/shared/utils/media/ambient-video-coordinator.ts
/**
* @fileoverview Ambient video pauser: silences background videos when gallery opens.
*/
function emptyResult() {
return {
pausedCount: 0,
totalCandidates: 0,
skippedCount: 0
};
}
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
return {
...emptyResult(),
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
return typeof value === "function" ? value() : value;
}
/**
* Convert a MaybeAccessor to an Accessor function.
* @param value - A value or accessor function
* @returns An accessor function that returns the value
* @example
* ```ts
* toAccessor(42); // () => 42
* const getValue = toAccessor(props.value);
* createMemo(() => getValue() * 2);
* ```
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
//#region src/shared/utils/media/ambient-video-guard.ts
var guardDispose = null;
function startAmbientVideoGuard() {
if (guardDispose) return () => {
guardDispose?.();
};
let active = true;
guardDispose = createEffectRoot(() => {
if (!gallerySignals.isOpen) return;
if (pauseAmbientVideosForGallery({
trigger: "guard",
reason: "guard"
}).pausedCount > 0) {}
});
return () => {
if (!active) return;
active = false;
guardDispose?.();
guardDispose = null;
};
}
//#endregion
//#region src/features/gallery/GalleryApp.ts
/**
* @fileoverview Gallery application orchestrator.
*/
var GalleryApp = class {
initialized = false;
ambientVideoGuardDispose = null;
async initialize() {
if (this.initialized) return;
try {
await this.setupEventHandlers();
this.ambientVideoGuardDispose ??= startAmbientVideoGuard();
this.initialized = true;
} catch (error) {
galleryErrorReporter.critical(error, { code: "GALLERY_APP_INIT_FAILED" });
throw error;
}
}
async setupEventHandlers() {
const settings = tryGetSettings();
initializeGalleryEvents({
onMediaClick: (element, event) => this.handleMediaClick(element, event),
onGalleryClose: () => this.close()
}, {
enableKeyboard: typeof settings?.get("gallery.enableKeyboardNav") === "boolean" ? settings.get("gallery.enableKeyboardNav") : true,
enableMediaDetection: true,
debugMode: false,
preventBubbling: true,
context: "gallery"
});
}
async handleMediaClick(element, _event) {
try {
const result = await getMediaService().extractFromClickedElement(element);
if (result.success && result.mediaItems.length > 0) this.openGallery(result.mediaItems, result.clickedIndex, { reason: "media-click" });
else {
mediaErrorReporter.warn(/* @__PURE__ */ new Error("Media extraction returned no items"), {
code: "MEDIA_EXTRACTION_EMPTY",
metadata: { success: result.success }
});
getUserscript().notification({
title: "Failed to load media",
text: "Could not find images or videos."
});
}
} catch (error) {
mediaErrorReporter.error(error, { code: "MEDIA_EXTRACTION_ERROR" });
getUserscript().notification({
title: "Error occurred",
text: normalizeErrorMessage(error)
});
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
getUserscript().notification({
title: "Failed to load gallery",
text: normalizeErrorMessage(error)
});
throw error;
}
}
close() {
if (gallerySignals.isOpen) closeGallery();
}
async cleanup() {
if (gallerySignals.isOpen) this.close();
this.ambientVideoGuardDispose?.();
this.ambientVideoGuardDispose = null;
try {
cleanupGalleryEvents();
} catch (error) {}
this.initialized = false;
delete globalThis.xegGalleryDebug;
}
};
//#endregion
//#region node_modules/.pnpm/solid-js@1.9.12/node_modules/solid-js/web/dist/web.js
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
const { scrollToCurrentItem, currentIndex } = options;
const getInitialFitMode = () => {
return getTypedSettingOr("gallery.imageFitMode", "fitWidth");
};
const [imageFitMode, setImageFitMode] = createSignal(getInitialFitMode());
const persistFitMode = (mode) => setTypedSetting("gallery.imageFitMode", mode).catch((error) => {});
const applyFitMode = (mode, event) => {
event?.preventDefault();
event?.stopPropagation();
setImageFitMode(mode);
persistFitMode(mode);
scrollToCurrentItem();
navigateToItem(currentIndex(), "auto-focus");
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
* Provides event handlers for gallery navigation actions.
* Handles boundary checking, background click dismissal, and
* media item click navigation via the shared navigateToItem function.
*
* @param options - Hook configuration with state accessors and close callback
* @returns Navigation handler functions
*/
function useGalleryNavigationHandlers(options) {
const { currentIndex, mediaItems, onClose } = options;
const handlePrevious = () => {
const current = currentIndex();
if (current > 0) navigateToItem(current - 1, "button");
};
const handleNext = () => {
const current = currentIndex();
if (current < mediaItems().length - 1) navigateToItem(current + 1, "button");
};
const handleBackgroundClick = (event) => {
const target = event.target;
if (!(target instanceof Element)) return;
if (target.closest("[data-role=\"toolbar\"], [data-role=\"toolbar-hover-zone\"], [data-gallery-element], [data-xeg-role=\"gallery-item\"], [data-xeg-role=\"scroll-spacer\"]")) return;
onClose();
};
const handleMediaItemClick = (index) => {
const items = mediaItems();
const current = currentIndex();
if (index >= 0 && index < items.length && index !== current) navigateToItem(index, "scroll");
};
return {
handlePrevious,
handleNext,
handleBackgroundClick,
handleMediaItemClick
};
}
//#endregion
//#region src/shared/async/debounce.ts
/**
* Create a debounced version of a function
*
* @template Args - Tuple type representing function arguments
* @param fn - Function to debounce
* @param delayMs - Delay in milliseconds (default: 300ms)
* @returns Debounced function with cancel/flush methods
*/
function createDebounced(fn, delayMs = 300) {
let timeoutId = null;
let pendingArgs = null;
const cancel = () => {
if (timeoutId !== null) {
clearTimeout(timeoutId);
timeoutId = null;
}
pendingArgs = null;
};
const flush = () => {
if (timeoutId !== null && pendingArgs !== null) {
clearTimeout(timeoutId);
const args = pendingArgs;
timeoutId = null;
pendingArgs = null;
fn(...args);
}
};
const debounced = ((...args) => {
cancel();
pendingArgs = args;
timeoutId = setTimeout(() => {
const savedArgs = pendingArgs;
timeoutId = null;
pendingArgs = null;
if (savedArgs !== null) fn(...savedArgs);
}, delayMs);
});
debounced.cancel = cancel;
debounced.flush = flush;
return debounced;
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
const controller = new AbortController();
const handleContainerWheel = (event) => {
const itemsContainer = itemsContainerEl();
if (!itemsContainer) return;
const target = event.target;
if (!(target instanceof Element)) return;
if (itemsContainer.contains(target)) return;
event.preventDefault();
event.stopPropagation();
itemsContainer.scrollTop += event.deltaY;
};
const eventManager = EventManager.getInstance();
const listener = (event) => {
handleContainerWheel(event);
};
eventManager.addEventListener(container, "wheel", listener, {
passive: false,
signal: controller.signal,
context: "gallery:wheel:container-redirect"
});
onCleanup(() => controller.abort());
});
}
//#endregion
//#region src/shared/utils/performance/observer-pool.ts
/**
* IntersectionObserver helper with automatic cleanup
*/
var observerRegistry = /* @__PURE__ */ new WeakMap();
var SharedObserver = {
observe(element, callback, options = {}) {
const observer = new IntersectionObserver((entries) => {
for (const entry of entries) try {
callback(entry);
} catch (error) {}
}, options);
observer.observe(element);
let set = observerRegistry.get(element);
if (!set) {
set = /* @__PURE__ */ new Set();
observerRegistry.set(element, set);
}
set.add(observer);
let isActive = true;
return () => {
if (!isActive) return;
isActive = false;
observer.unobserve(element);
observer.disconnect();
const currentSet = observerRegistry.get(element);
if (currentSet) {
currentSet.delete(observer);
if (currentSet.size === 0) observerRegistry.delete(element);
}
};
},
unobserve(element) {
const set = observerRegistry.get(element);
if (!set || set.size === 0) return;
for (const observer of set) observer.disconnect();
observerRegistry.delete(element);
}
};
//#endregion
//#region src/features/gallery/logic/focus-coordinator.ts
/** @fileoverview Scroll-based focus selection via IntersectionObserver. Selects most visible gallery item. */
var DEFAULTS$1 = {
THRESHOLD: [
0,
.5,
1
],
ROOT_MARGIN: "0px"
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
else resolvedThreshold = [...DEFAULTS$1.THRESHOLD];
this.observerOptions = {
threshold: resolvedThreshold,
rootMargin: options.rootMargin ?? DEFAULTS$1.ROOT_MARGIN
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
const topProximityThreshold = 50;
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
if (source === "auto" && index !== null) navigateToItem(index, "auto-focus");
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
onCleanup(() => itemsCache.clear());
const getCachedItem = (index, itemsRoot) => {
const cached = itemsCache.get(index)?.deref();
if (cached?.isConnected) return cached;
const element = itemsRoot.querySelectorAll("[data-xeg-role=\"gallery-item\"]")[index];
if (element) itemsCache.set(index, new WeakRef(element));
return element ?? null;
};
const scrollToItem = (index) => {
const container = containerAccessor();
if (!enabled() || !container || index < 0 || index >= totalItemsAccessor()) return;
const itemsRoot = container.querySelector("[data-xeg-role=\"items-container\"]");
if (!itemsRoot) return;
const target = getCachedItem(index, itemsRoot);
if (target) {
options.onScrollStart?.();
target.scrollIntoView({
behavior: behavior(),
block: alignToCenter() ? "center" : block(),
inline: "nearest"
});
} else requestAnimationFrame(() => {
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
function useGalleryScroll({ container, scrollTarget, onScrollEnd, enabled = true, programmaticScrollTimestamp }) {
const containerAccessor = toAccessor(container);
const scrollTargetAccessor = toAccessor(scrollTarget ?? containerAccessor);
const enabledAccessor = toAccessor(enabled);
const programmaticTimestampAccessor = toAccessor(programmaticScrollTimestamp ?? 0);
const isGalleryOpen = createMemo(() => gallerySignals.isOpen);
const [isScrolling, setIsScrolling] = createSignal(false);
const [lastScrollTime, setLastScrollTime] = createSignal(0);
let scrollIdleTimerId = null;
const clearScrollIdleTimer = () => {
if (scrollIdleTimerId !== null) {
clearTimeout(scrollIdleTimerId);
scrollIdleTimerId = null;
}
};
const markScrolling = () => {
setIsScrolling(true);
setLastScrollTime(performance.now());
};
const scheduleScrollEnd = () => {
clearScrollIdleTimer();
scrollIdleTimerId = setTimeout(() => {
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
if (!isGalleryOpen() || !isGalleryInternalEvent(event)) return;
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
clearScrollIdleTimer();
return;
}
const eventManager = EventManager.getInstance();
const listenerContext = createPrefixedId(LISTENER_CONTEXT_PREFIX, ":");
const listenerIds = [];
const registerListener = (type, handler) => {
const id = eventManager.addEventListener(eventTarget, type, handler, {
passive: true,
context: listenerContext
});
if (id) listenerIds.push(id);
};
registerListener("wheel", handleWheel);
registerListener("scroll", handleScroll);
onCleanup(() => {
for (const id of listenerIds) eventManager.removeListener(id);
clearScrollIdleTimer();
setIsScrolling(false);
});
});
onCleanup(clearScrollIdleTimer);
return {
isScrolling,
lastScrollTime
};
}
//#endregion
//#region src/shared/dom/ensure-gallery-scroll.ts
/**
* @fileoverview Gallery scroll availability enforcement for Edge layer.
* Ensures scrollable containers have proper overflow enabled via inline styles.
* @module edge/dom/ensure-gallery-scroll
*/
/**
* Ensure gallery and content containers have scrollable overflow enabled.
* Sets overflowY to 'auto' on matched scrollable container selectors.
* @param element - Root element to search for scrollable containers, or null to skip.
*/
function ensureGalleryScrollAvailable(element) {
if (!element) return;
element.querySelectorAll("[data-xeg-role=\"items-container\"], .itemsList, .content").forEach((el) => {
if (el.style.overflowY !== "auto" && el.style.overflowY !== "scroll") el.style.overflowY = "auto";
});
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
const schedule = () => {
if (pending) return;
pending = true;
if (typeof requestAnimationFrame === "function") requestAnimationFrame(() => {
pending = false;
calcAndApply();
});
else setTimeout(() => {
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
if (typeof window !== "undefined") resizeListenerId = EventManager.getInstance().addEventListener(window, "resize", createEventListener(onResize), {
passive: true,
context: "viewport:resize"
});
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
//#endregion
//#region src/shared/utils/css/css-animations.ts
/**
* @fileoverview CSS animation helpers for gallery entrance/exit effects.
*/
var ANIMATION_CLASSES = {
FADE_IN: "xeg-fade-in",
FADE_OUT: "xeg-fade-out"
};
var ANIMATION_TIMEOUT_MS = 5e3;
function runCssAnimation(element, className) {
return new Promise((resolve) => {
let settled = false;
const settle = () => {
if (settled) return;
settled = true;
element.classList.remove(className);
resolve();
};
element.addEventListener("animationend", settle, { once: true });
element.addEventListener("animationcancel", settle, { once: true });
setTimeout(settle, ANIMATION_TIMEOUT_MS);
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
function useGalleryLifecycle(options) {
const { containerEl, toolbarWrapperEl, isVisible } = options;
createEffect(on(containerEl, (element) => {
if (element) ensureGalleryScrollAvailable(element);
}));
createEffect(on([containerEl, isVisible], ([container, visible]) => {
if (!container) return;
if (visible) animateGalleryEnter(container);
else {
animateGalleryExit(container);
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
/**
* @fileoverview Navigation hook: tracks trigger source, coordinates scroll
* on keyboard/click (not scroll) events. Subscribes only when visible.
*/
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
//#endregion
//#region src/features/gallery/components/vertical-gallery-view/hooks/use-toolbar-auto-hide.ts
/** @fileoverview Toolbar auto-hide with configurable delay. */
function useToolbarAutoHide(options) {
const { isVisible, hasItems } = options;
const computeInitialVisibility = () => !!(isVisible() && hasItems());
const [isInitialToolbarVisible, setIsInitialToolbarVisible] = createSignal(computeInitialVisibility());
const [activeTimer, setActiveTimer] = createSignal(null);
const clearActiveTimer = () => {
const timer = activeTimer();
if (timer === null) return;
clearTimeout(timer);
setActiveTimer(null);
};
createEffect(() => {
onCleanup(clearActiveTimer);
if (!computeInitialVisibility()) {
setIsInitialToolbarVisible(false);
return;
}
setIsInitialToolbarVisible(true);
const rawAutoHideDelay = getTypedSettingOr("toolbar.autoHideDelay", 3e3);
const autoHideDelay = Math.max(0, typeof rawAutoHideDelay === "number" ? rawAutoHideDelay : 0);
if (autoHideDelay === 0) {
setIsInitialToolbarVisible(false);
return;
}
setActiveTimer(setTimeout(() => {
setIsInitialToolbarVisible(false);
setActiveTimer(null);
}, autoHideDelay));
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
uiHidden: "xg-9abg",
isScrolling: "xg-sOsS",
itemsContainer: "xg-gmRW",
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
var DEFAULT_VOLUME_EPSILON = .001;
/** Compare volume values with epsilon for rounding tolerance */
function areVolumesEquivalent(a, b) {
if (!Number.isFinite(a) || !Number.isFinite(b)) return a === b;
return Math.abs(a - b) <= DEFAULT_VOLUME_EPSILON;
}
/** Monotonic timestamp in milliseconds (performance.now() with Date.now() fallback) */
function nowMs() {
return typeof performance !== "undefined" && typeof performance.now === "function" ? performance.now() : Date.now();
}
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
if (expectedMarks.length > MAX_EXPECTED_MARKS) expectedMarks = expectedMarks.slice(-MAX_EXPECTED_MARKS);
},
shouldIgnoreChange(current) {
if (expectedMarks.length === 0) return false;
pruneExpiredMarks(nowMs());
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
setTypedSetting("gallery.videoVolume", volume);
setTypedSetting("gallery.videoMuted", muted);
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
//#region src/features/gallery/components/vertical-gallery-view/VerticalImageItem.tsx
/**
* @fileoverview Vertical Image/Video Item Component (Solid.js)
* @description Renders individual media items with fit mode, visibility/loading states,
* video auto-pause, and accessibility support via useVideoVisibility hook.
*/
var _tmpl$$9 = /* @__PURE__ */ template(`<div data-xeg-role=gallery-item><div data-xeg-role=media-wrapper>`), _tmpl$2$4 = /* @__PURE__ */ template(`<div><div>`), _tmpl$3$1 = /* @__PURE__ */ template(`<video controls>`), _tmpl$4$1 = /* @__PURE__ */ template(`<img decoding=async>`, true, false, false), _tmpl$5 = /* @__PURE__ */ template(`<div><span>⚠️</span><span>`);
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
"onImageContextMenu",
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
const isFocused = createMemo(() => local.isFocused ?? false);
const className$1 = createMemo(() => local.className ?? "");
const shouldEagerLoad = createMemo(() => (local.forceVisible ?? false) || (local.isActive ?? false));
const translate = useTranslation();
const isVideo = createMemo(() => local.media.type === "video" || local.media.type === "gif");
const [isLoaded, setIsLoaded] = createSignal(false);
const [isError, setIsError] = createSignal(false);
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
const mergedStyle = createMemo(() => ({
...intrinsicSizingStyle(),
...local.style ?? {}
}));
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
const preventDragStart = (event) => event.preventDefault();
const handleContainerClick = (event) => {
event.stopPropagation();
if (isVideo()) {
const video = videoRef();
if (video) {
const target = event.target;
const targetInVideo = target instanceof Node && video.contains(target);
const path = typeof event.composedPath === "function" ? event.composedPath() : [];
const pathIncludesVideo = Array.isArray(path) && path.includes(video);
if (targetInVideo || pathIncludesVideo) return;
}
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
const key = event.key;
if (key === "Enter" || key === " ") {
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
const handleContextMenu = (event) => {
local.onImageContextMenu?.(event, local.media);
};
createEffect(() => {
if (isLoaded()) return;
if (isVideo()) {
const video = videoRef();
if (video && video.readyState >= 1) handleMediaLoad();
} else {
const image = imageRef();
if (image?.complete) if (image.naturalWidth > 0) handleMediaLoad();
else handleMediaError();
}
});
const resolvedFitMode = createMemo(() => {
const value = local.fitMode;
if (typeof value === "function") return value();
return value ?? "fitWidth";
});
const fitModeClass = createMemo(() => FIT_MODE_CLASSES[resolvedFitMode()]);
const containerClasses = createMemo(() => cx("xeg-gallery", CSS.CLASSES.ITEM, "vertical-item", VerticalImageItem_module_default.container, local.isActive ? VerticalImageItem_module_default.active : void 0, isFocused() ? VerticalImageItem_module_default.focused : void 0, className$1()));
const assignContainerRef = (element) => {
setContainerRef(element);
local.registerContainer?.(element);
};
const defaultContainerRole = createMemo(() => isVideo() ? "group" : "button");
const resolvedContainerRole = createMemo(() => local.role ?? defaultContainerRole());
const defaultAriaLabel = createMemo(() => translate("msg.gal.itemLbl", {
index: local.index + 1,
filename: cleanFilename(local.media.filename)
}));
return (() => {
var _el$ = _tmpl$$9(), _el$2 = _el$.firstChild;
_el$.$$keydown = handleContainerKeyDown;
addEventListener(_el$, "blur", rest.onBlur);
addEventListener(_el$, "focus", local.onFocus);
_el$.$$click = handleContainerClick;
use(assignContainerRef, _el$);
insert(_el$2, (() => {
var _c$ = memo(() => !!(!isLoaded() && !isError()));
return () => _c$() && (() => {
var _el$3 = _tmpl$2$4(), _el$4 = _el$3.firstChild;
createRenderEffect((_p$) => {
var _v$11 = VerticalImageItem_module_default.placeholder, _v$12 = cx("xeg-spinner", VerticalImageItem_module_default.loadingSpinner);
_v$11 !== _p$.e && className(_el$3, _p$.e = _v$11);
_v$12 !== _p$.t && className(_el$4, _p$.t = _v$12);
return _p$;
}, {
e: void 0,
t: void 0
});
return _el$3;
})();
})(), null);
insert(_el$2, (() => {
var _c$2 = memo(() => !!isVideo());
return () => _c$2() ? (() => {
var _el$5 = _tmpl$3$1();
addEventListener(_el$5, "volumechange", handleVolumeChange);
_el$5.addEventListener("dragstart", preventDragStart);
_el$5.$$contextmenu = handleContextMenu;
_el$5.addEventListener("error", handleMediaError);
_el$5.addEventListener("loadedmetadata", handleMediaLoad);
use(setVideoRef, _el$5);
createRenderEffect((_p$) => {
var _v$13 = local.media.url, _v$14 = cx(VerticalImageItem_module_default.video, fitModeClass(), isLoaded() ? VerticalImageItem_module_default.loaded : VerticalImageItem_module_default.loading);
_v$13 !== _p$.e && setAttribute(_el$5, "src", _p$.e = _v$13);
_v$14 !== _p$.t && className(_el$5, _p$.t = _v$14);
return _p$;
}, {
e: void 0,
t: void 0
});
return _el$5;
})() : (() => {
var _el$6 = _tmpl$4$1();
_el$6.addEventListener("dragstart", preventDragStart);
_el$6.$$contextmenu = handleContextMenu;
_el$6.addEventListener("error", handleMediaError);
_el$6.addEventListener("load", handleMediaLoad);
use(setImageRef, _el$6);
createRenderEffect((_p$) => {
var _v$15 = local.media.url, _v$16 = cleanFilename(local.media.filename), _v$17 = shouldEagerLoad() ? "eager" : "lazy", _v$18 = cx(VerticalImageItem_module_default.image, fitModeClass(), isLoaded() ? VerticalImageItem_module_default.loaded : VerticalImageItem_module_default.loading);
_v$15 !== _p$.e && setAttribute(_el$6, "src", _p$.e = _v$15);
_v$16 !== _p$.t && setAttribute(_el$6, "alt", _p$.t = _v$16);
_v$17 !== _p$.a && setAttribute(_el$6, "loading", _p$.a = _v$17);
_v$18 !== _p$.o && className(_el$6, _p$.o = _v$18);
return _p$;
}, {
e: void 0,
t: void 0,
a: void 0,
o: void 0
});
return _el$6;
})();
})(), null);
insert(_el$2, (() => {
var _c$3 = memo(() => !!isError());
return () => _c$3() && (() => {
var _el$7 = _tmpl$5(), _el$8 = _el$7.firstChild, _el$9 = _el$8.nextSibling;
insert(_el$9, () => translate("msg.gal.loadFail", { type: isVideo() ? "video" : "image" }));
createRenderEffect((_p$) => {
var _v$19 = VerticalImageItem_module_default.error, _v$20 = VerticalImageItem_module_default.errorIcon, _v$21 = VerticalImageItem_module_default.errorText;
_v$19 !== _p$.e && className(_el$7, _p$.e = _v$19);
_v$20 !== _p$.t && className(_el$8, _p$.t = _v$20);
_v$21 !== _p$.a && className(_el$9, _p$.a = _v$21);
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
var _v$ = containerClasses(), _v$2 = local.index, _v$3 = resolvedFitMode(), _v$4 = isLoaded() ? "true" : "false", _v$5 = hasIntrinsicSize() ? "true" : void 0, _v$6 = mergedStyle(), _v$7 = local["aria-label"] || defaultAriaLabel(), _v$8 = local["aria-describedby"], _v$9 = resolvedContainerRole(), _v$0 = local.tabIndex ?? 0, _v$1 = void 0, _v$10 = VerticalImageItem_module_default.imageWrapper;
_v$ !== _p$.e && className(_el$, _p$.e = _v$);
_v$2 !== _p$.t && setAttribute(_el$, "data-index", _p$.t = _v$2);
_v$3 !== _p$.a && setAttribute(_el$, "data-fit-mode", _p$.a = _v$3);
_v$4 !== _p$.o && setAttribute(_el$, "data-media-loaded", _p$.o = _v$4);
_v$5 !== _p$.i && setAttribute(_el$, "data-has-intrinsic-size", _p$.i = _v$5);
_p$.n = style(_el$, _v$6, _p$.n);
_v$7 !== _p$.s && setAttribute(_el$, "aria-label", _p$.s = _v$7);
_v$8 !== _p$.h && setAttribute(_el$, "aria-describedby", _p$.h = _v$8);
_v$9 !== _p$.r && setAttribute(_el$, "role", _p$.r = _v$9);
_v$0 !== _p$.d && setAttribute(_el$, "tabindex", _p$.d = _v$0);
_v$1 !== _p$.l && setAttribute(_el$, "data-testid", _p$.l = _v$1);
_v$10 !== _p$.u && className(_el$2, _p$.u = _v$10);
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
u: void 0
});
return _el$;
})();
}
delegateEvents([
"click",
"keydown",
"contextmenu"
]);
//#endregion
//#region src/shared/components/ui/Button/IconButton.tsx
var _tmpl$$8 = /* @__PURE__ */ template(`<button>`);
function IconButton(props) {
return (() => {
var _el$ = _tmpl$$8();
addEventListener(_el$, "mousedown", props.onMouseDown, true);
addEventListener(_el$, "click", props.onClick, true);
var _ref$ = props.ref;
typeof _ref$ === "function" ? use(_ref$, _el$) : props.ref = _el$;
insert(_el$, () => props.children);
createRenderEffect((_p$) => {
var _v$ = props.id, _v$2 = props.type ?? "button", _v$3 = cx(props.class), _v$4 = props.title, _v$5 = props.disabled, _v$6 = props.tabIndex, _v$7 = props.size, _v$8 = props["data-testid"], _v$9 = props["aria-label"], _v$0 = props["aria-controls"], _v$1 = props["aria-expanded"], _v$10 = props["aria-pressed"], _v$11 = props["aria-busy"];
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
}
delegateEvents(["click", "mousedown"]);
//#endregion
//#region src/shared/components/ui/Icon/Icon.tsx
var _tmpl$$7 = /* @__PURE__ */ template(`<svg xmlns=http://www.w3.org/2000/svg viewBox="0 0 24 24"fill=none stroke="var(--xeg-icon-color, currentColor)"stroke-width=var(--xeg-icon-stroke-width) stroke-linecap=round stroke-linejoin=round>`);
function Icon({ size = "var(--xeg-icon-size)", class: className = "", children, "aria-label": ariaLabel }) {
const sizeValue = typeof size === "number" ? `${size}px` : size;
return (() => {
var _el$ = _tmpl$$7();
setAttribute(_el$, "width", sizeValue);
setAttribute(_el$, "height", sizeValue);
setAttribute(_el$, "class", className);
setAttribute(_el$, "role", ariaLabel ? "img" : void 0);
setAttribute(_el$, "aria-label", ariaLabel);
setAttribute(_el$, "aria-hidden", !ariaLabel);
insert(_el$, children);
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
/** Renders Lucide icons from data-driven SVG node definitions. */
var _tmpl$$6 = /* @__PURE__ */ template(`<svg><path></svg>`, false, true, false), _tmpl$2$3 = /* @__PURE__ */ template(`<svg><circle></svg>`, false, true, false);
/** Renders a Lucide icon node (path or circle) as SVG element. */
var renderNode = (node) => {
const [tag, attrs] = node;
switch (tag) {
case "path": return (() => {
var _el$ = _tmpl$$6();
createRenderEffect(() => setAttribute(_el$, "d", attrs.d));
return _el$;
})();
case "circle": return (() => {
var _el$2 = _tmpl$2$3();
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
const nodes = LUCIDE_ICON_NODES[props.name];
return createComponent(Icon, {
get size() {
return props.size;
},
get ["class"]() {
return props.class;
},
get ["aria-label"]() {
return props["aria-label"];
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
*
* **Design Pattern**:
* - Reactive: Uses createMemo for derived state
* - Effect cleanup: Language change subscription properly cleaned up
* - Accessibility: Native select elements with proper labels
*
* @see {@link SettingsControlsProps} - Type definitions
* Component styles: `SettingsControls.module.css`
*/
var _tmpl$$5 = /* @__PURE__ */ template(`<div><div><label></label><select></select></div><div><label></label><select>`), _tmpl$2$2 = /* @__PURE__ */ template(`<option>`);
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
"ko",
"en",
"ja"
];
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
ja: languageService.translate("st.langJa")
}
}
};
});
const themeValue = () => resolve(props.currentTheme);
const languageValue = () => resolve(props.currentLanguage);
return (() => {
var _el$ = _tmpl$$5(), _el$2 = _el$.firstChild, _el$3 = _el$2.firstChild, _el$4 = _el$3.nextSibling, _el$5 = _el$2.nextSibling, _el$6 = _el$5.firstChild, _el$7 = _el$6.nextSibling;
insert(_el$3, () => strings().theme.title);
addEventListener(_el$4, "change", props.onThemeChange);
insert(_el$4, () => THEME_OPTIONS.map((option) => (() => {
var _el$8 = _tmpl$2$2();
_el$8.value = option;
insert(_el$8, () => strings().theme.labels[option]);
return _el$8;
})()));
insert(_el$6, () => strings().language.title);
addEventListener(_el$7, "change", props.onLanguageChange);
insert(_el$7, () => LANGUAGE_OPTIONS.map((option) => (() => {
var _el$9 = _tmpl$2$2();
_el$9.value = option;
insert(_el$9, () => strings().language.labels[option]);
return _el$9;
})()));
createRenderEffect((_p$) => {
var _v$ = cx(SettingsControls_module_default.body, props.compact && SettingsControls_module_default.bodyCompact), _v$2 = void 0, _v$3 = cx(SettingsControls_module_default.setting, props.compact && SettingsControls_module_default.settingCompact), _v$4 = props["data-testid"] ? `${props["data-testid"]}-theme-select` : "settings-theme-select", _v$5 = cx(SettingsControls_module_default.label, props.compact && SettingsControls_module_default.compactLabel), _v$6 = props["data-testid"] ? `${props["data-testid"]}-theme-select` : "settings-theme-select", _v$7 = cx("xeg-inline-center", SettingsControls_module_default.select), _v$8 = strings().theme.title, _v$9 = strings().theme.title, _v$0 = void 0, _v$1 = cx(SettingsControls_module_default.setting, props.compact && SettingsControls_module_default.settingCompact), _v$10 = props["data-testid"] ? `${props["data-testid"]}-language-select` : "settings-language-select", _v$11 = cx(SettingsControls_module_default.label, props.compact && SettingsControls_module_default.compactLabel), _v$12 = props["data-testid"] ? `${props["data-testid"]}-language-select` : "settings-language-select", _v$13 = cx("xeg-inline-center", SettingsControls_module_default.select), _v$14 = strings().language.title, _v$15 = strings().language.title, _v$16 = void 0;
_v$ !== _p$.e && className(_el$, _p$.e = _v$);
_v$2 !== _p$.t && setAttribute(_el$, "data-testid", _p$.t = _v$2);
_v$3 !== _p$.a && className(_el$2, _p$.a = _v$3);
_v$4 !== _p$.o && setAttribute(_el$3, "for", _p$.o = _v$4);
_v$5 !== _p$.i && className(_el$3, _p$.i = _v$5);
_v$6 !== _p$.n && setAttribute(_el$4, "id", _p$.n = _v$6);
_v$7 !== _p$.s && className(_el$4, _p$.s = _v$7);
_v$8 !== _p$.h && setAttribute(_el$4, "aria-label", _p$.h = _v$8);
_v$9 !== _p$.r && setAttribute(_el$4, "title", _p$.r = _v$9);
_v$0 !== _p$.d && setAttribute(_el$4, "data-testid", _p$.d = _v$0);
_v$1 !== _p$.l && className(_el$5, _p$.l = _v$1);
_v$10 !== _p$.u && setAttribute(_el$6, "for", _p$.u = _v$10);
_v$11 !== _p$.c && className(_el$6, _p$.c = _v$11);
_v$12 !== _p$.w && setAttribute(_el$7, "id", _p$.w = _v$12);
_v$13 !== _p$.m && className(_el$7, _p$.m = _v$13);
_v$14 !== _p$.f && setAttribute(_el$7, "aria-label", _p$.f = _v$14);
_v$15 !== _p$.y && setAttribute(_el$7, "title", _p$.y = _v$15);
_v$16 !== _p$.g && setAttribute(_el$7, "data-testid", _p$.g = _v$16);
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
g: void 0
});
createRenderEffect(() => _el$4.value = themeValue());
createRenderEffect(() => _el$7.value = languageValue());
return _el$;
})();
}
//#endregion
//#region src/shared/utils/events/wheel-scroll-guard.ts
function findScrollableAncestor(target, scrollableSelector) {
if (!(target instanceof HTMLElement)) return null;
return target.closest(scrollableSelector);
}
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
tweetPanelBody: "xg-w56C",
tweetTextHeader: "xg-rSWg",
tweetTextLabel: "xg-jd-V",
tweetContent: "xg-jmjG",
tweetUrlSection: "xg-0Eeq",
tweetUrlLink: "xg-AVKe",
tweetUrlIcon: "xg-5RjR",
tweetUrlLabel: "xg-8Stf",
tweetUrlValue: "xg-3pwZ",
tweetUrlDivider: "xg-sltl"
};
//#endregion
//#region src/shared/components/ui/Toolbar/TweetTextPanel.tsx
var _tmpl$$4 = /* @__PURE__ */ template(`<a target=_blank rel="noopener noreferrer">`), _tmpl$2$1 = /* @__PURE__ */ template(`<div><a target=_blank rel="noopener noreferrer"><span></span><span>`), _tmpl$3 = /* @__PURE__ */ template(`<div><div><span></div><div data-gallery-scrollable=true><span>`), _tmpl$4 = /* @__PURE__ */ template(`<div>`);
/**
* URL safety policy for tweet text links
*/
var TWEET_TEXT_URL_POLICY = {
allowedProtocols: new Set(["http:", "https:"]),
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
* @returns JSX element array
*/
var renderTweetTokens = (tokens) => tokens.map((token) => {
if ((token.type === "url" || token.type === "hashtag") && token.href) return (() => {
var _el$ = _tmpl$$4();
insert(_el$, () => token.value);
createRenderEffect(() => setAttribute(_el$, "href", token.href));
return _el$;
})();
return token.value;
});
/**
* Tweet URL link component
*/
function TweetUrlLink(props) {
const t = props.translate;
return (() => {
var _el$2 = _tmpl$2$1(), _el$3 = _el$2.firstChild, _el$4 = _el$3.firstChild, _el$5 = _el$4.nextSibling;
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
var _v$ = Toolbar_module_default.tweetUrlSection, _v$2 = props.url, _v$3 = Toolbar_module_default.tweetUrlLink, _v$4 = Toolbar_module_default.tweetUrlLabel, _v$5 = Toolbar_module_default.tweetUrlValue;
_v$ !== _p$.e && className(_el$2, _p$.e = _v$);
_v$2 !== _p$.t && setAttribute(_el$3, "href", _p$.t = _v$2);
_v$3 !== _p$.a && className(_el$3, _p$.a = _v$3);
_v$4 !== _p$.o && className(_el$4, _p$.o = _v$4);
_v$5 !== _p$.i && className(_el$5, _p$.i = _v$5);
return _p$;
}, {
e: void 0,
t: void 0,
a: void 0,
o: void 0,
i: void 0
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
const translate = useTranslation();
const tweetText = props.tweetTextHTML ?? props.tweetText ?? "";
const tokens = tweetText ? tokenizeTweetText(tweetText) : [];
const safeTweetUrl = normalizeTweetUrl(props.tweetUrl);
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
insert(_el$0, () => renderTweetTokens(tokens));
createRenderEffect((_p$) => {
var _v$6 = Toolbar_module_default.tweetPanelBody, _v$7 = Toolbar_module_default.tweetTextHeader, _v$8 = Toolbar_module_default.tweetTextLabel, _v$9 = Toolbar_module_default.tweetContent;
_v$6 !== _p$.e && className(_el$6, _p$.e = _v$6);
_v$7 !== _p$.t && className(_el$7, _p$.t = _v$7);
_v$8 !== _p$.a && className(_el$8, _p$.a = _v$8);
_v$9 !== _p$.o && className(_el$9, _p$.o = _v$9);
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
var _tmpl$$3 = /* @__PURE__ */ template(`<div data-gallery-element=toolbar><div><div><div><div><span aria-live=polite><span></span><span>/</span><span></span></span><div><div></div></div></div></div></div></div><div id=toolbar-settings-panel data-gallery-scrollable=true role=region aria-label="Settings Panel"aria-labelledby=settings-button data-gallery-element=settings-panel></div><div id=toolbar-tweet-panel role=region aria-labelledby=tweet-text-button data-gallery-element=tweet-panel>`);
var SCROLLABLE_SELECTOR = "[data-gallery-scrollable=\"true\"]";
var SCROLL_LOCK_TOLERANCE = 1;
var shouldAllowWheelDefault = (event) => {
return shouldAllowWheelDefault$1(event, {
scrollableSelector: SCROLLABLE_SELECTOR,
tolerance: SCROLL_LOCK_TOLERANCE
});
};
function ToolbarView(props) {
const totalCount = () => props.totalCount;
const currentIndex = () => props.currentIndex;
const isToolbarDisabled = () => props.disabled;
const activeFitMode = () => props.currentFitMode;
const tweetText = () => props.tweetText;
const tweetTextHTML = () => props.tweetTextHTML;
const tweetUrl = () => props.tweetUrl;
const [toolbarElement, setToolbarElement] = createSignal(null);
const [counterElement, setCounterElement] = createSignal(null);
const [settingsPanelEl, setSettingsPanelEl] = createSignal(null);
const [tweetPanelEl, setTweetPanelEl] = createSignal(null);
const translate = useTranslation();
const nav = createMemo(() => props.navState());
const fitModeLabels = () => props.fitModeLabels;
const assignToolbarRef = (element) => {
setToolbarElement(element);
props.settingsController.assignToolbarRef(element);
};
const assignSettingsPanelRef = (element) => {
setSettingsPanelEl(element);
props.settingsController.assignSettingsPanelRef(element);
};
createEffect(() => {
const toolbar = toolbarElement();
const counter = counterElement();
if (!toolbar && !counter) return;
const current = String(currentIndex());
const focused = String(props.displayedIndex());
if (toolbar) {
toolbar.dataset.currentIndex = current;
toolbar.dataset.focusedIndex = focused;
}
if (counter) {
counter.dataset.currentIndex = current;
counter.dataset.focusedIndex = focused;
}
});
const hasTweetContent = () => !!(tweetTextHTML() ?? tweetText() ?? tweetUrl());
const toolbarButtonClass = (...extra) => cx(Toolbar_module_default.toolbarButton, "xeg-inline-center", ...extra);
const toolbarStateClass = () => {
switch (props.toolbarDataState()) {
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
*/
const preventScrollChaining = (event) => {
if (shouldAllowWheelDefault(event)) {
event.stopPropagation();
return;
}
event.preventDefault();
event.stopPropagation();
event.stopImmediatePropagation();
};
const registerWheelListener = (getElement, handler, options) => {
createEffect(() => {
const element = getElement();
if (!element) return;
const controller = new AbortController();
const eventManager = EventManager.getInstance();
const listener = (event) => handler(event);
eventManager.addEventListener(element, "wheel", listener, {
passive: options.passive,
signal: controller.signal,
context: options.context
});
onCleanup(() => controller.abort());
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
var _el$ = _tmpl$$3(), _el$2 = _el$.firstChild, _el$3 = _el$2.firstChild, _el$4 = _el$3.firstChild, _el$5 = _el$4.firstChild, _el$6 = _el$5.firstChild, _el$7 = _el$6.firstChild, _el$8 = _el$7.nextSibling, _el$9 = _el$8.nextSibling, _el$0 = _el$6.nextSibling, _el$1 = _el$0.firstChild, _el$10 = _el$2.nextSibling, _el$11 = _el$10.nextSibling;
_el$.$$keydown = (event) => props.settingsController.handleToolbarKeyDown(event);
addEventListener(_el$, "blur", props.onBlur);
addEventListener(_el$, "focus", props.onFocus);
use(assignToolbarRef, _el$);
insert(_el$3, createComponent(IconButton, {
get ["class"]() {
return toolbarButtonClass();
},
size: "toolbar",
get ["aria-label"]() {
return translate("tb.prev");
},
get title() {
return translate("tb.prev");
},
get disabled() {
return nav().prevDisabled;
},
get onClick() {
return props.onPreviousClick;
},
get children() {
return createComponent(LucideIcon, {
name: "chevron-left",
size: 18
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
get title() {
return translate("tb.next");
},
get disabled() {
return nav().nextDisabled;
},
get onClick() {
return props.onNextClick;
},
get children() {
return createComponent(LucideIcon, {
name: "chevron-right",
size: 18
});
}
}), _el$4);
use((element) => {
setCounterElement(element);
}, _el$6);
insert(_el$7, () => props.displayedIndex() + 1);
insert(_el$9, totalCount);
insert(_el$3, () => props.fitModeOrder.map(({ mode, iconName }) => {
const label = fitModeLabels()[mode];
return createComponent(IconButton, {
get ["class"]() {
return toolbarButtonClass(Toolbar_module_default.fitButton);
},
size: "toolbar",
get onClick() {
return props.handleFitModeClick(mode);
},
get disabled() {
return props.isFitDisabled(mode);
},
get ["aria-label"]() {
return label.label;
},
get title() {
return label.title;
},
get ["aria-pressed"]() {
return activeFitMode() === mode;
},
get children() {
return createComponent(LucideIcon, {
name: iconName,
size: 18
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
return props.onDownloadCurrent;
},
get disabled() {
return nav().downloadDisabled;
},
get ["aria-label"]() {
return translate("tb.dl");
},
get title() {
return translate("tb.dl");
},
get children() {
return createComponent(LucideIcon, {
name: "download",
size: 18
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
return props.onDownloadAll;
},
get disabled() {
return nav().downloadDisabled;
},
get ["aria-label"]() {
return translate("tb.dlAllCt", { count: totalCount() });
},
get title() {
return translate("tb.dlAllCt", { count: totalCount() });
},
get children() {
return createComponent(LucideIcon, {
name: "folder-down",
size: 18
});
}
});
})(), null);
insert(_el$3, (() => {
var _c$2 = memo(() => !!props.showSettingsButton);
return () => _c$2() && createComponent(IconButton, {
ref(r$) {
var _ref$ = props.settingsController.assignSettingsButtonRef;
typeof _ref$ === "function" ? _ref$(r$) : props.settingsController.assignSettingsButtonRef = r$;
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
return props.settingsController.isSettingsExpanded() ? "true" : "false";
},
"aria-controls": "toolbar-settings-panel",
get title() {
return translate("tb.setOpen");
},
get disabled() {
return isToolbarDisabled();
},
get onMouseDown() {
return props.settingsController.handleSettingsMouseDown;
},
get onClick() {
return props.settingsController.handleSettingsClick;
},
get children() {
return createComponent(LucideIcon, {
name: "settings-2",
size: 18
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
return props.isTweetPanelExpanded() ? "true" : "false";
},
"aria-controls": "toolbar-tweet-panel",
get title() {
return translate("tb.twTxt");
},
get disabled() {
return isToolbarDisabled();
},
get onClick() {
return props.toggleTweetPanelExpanded;
},
get children() {
return createComponent(LucideIcon, {
name: "messages-square",
size: 18
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
get title() {
return translate("tb.cls");
},
get disabled() {
return isToolbarDisabled();
},
get onClick() {
return props.onCloseClick;
},
get children() {
return createComponent(LucideIcon, {
name: "x",
size: 18
});
}
}), null);
addEventListener(_el$10, "click", props.settingsController.handlePanelClick, true);
addEventListener(_el$10, "mousedown", props.settingsController.handlePanelMouseDown, true);
use(assignSettingsPanelRef, _el$10);
insert(_el$10, createComponent(Show, {
get when() {
return props.settingsController.isSettingsExpanded();
},
get children() {
return createComponent(SettingsControls, {
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
"data-testid": void 0
});
}
}));
use(setTweetPanelEl, _el$11);
insert(_el$11, createComponent(Show, {
get when() {
return memo(() => !!props.isTweetPanelExpanded())() && hasTweetContent();
},
get children() {
return createComponent(TweetTextPanel, {
get tweetText() {
return tweetText() ?? void 0;
},
get tweetTextHTML() {
return tweetTextHTML() ?? void 0;
},
get tweetUrl() {
return tweetUrl() ?? void 0;
}
});
}
}));
createRenderEffect((_p$) => {
var _v$ = cx(props.toolbarClass(), toolbarStateClass(), props.settingsController.isSettingsExpanded() ? Toolbar_module_default.settingsExpanded : void 0, props.isTweetPanelExpanded() ? Toolbar_module_default.tweetPanelExpanded : void 0), _v$2 = props.role ?? "toolbar", _v$3 = props["aria-label"] ?? "Gallery Toolbar", _v$4 = props["aria-describedby"], _v$5 = isToolbarDisabled(), _v$6 = void 0, _v$7 = props.tabIndex, _v$8 = cx(Toolbar_module_default.toolbarContent, "xeg-row-center"), _v$9 = Toolbar_module_default.toolbarControls, _v$0 = Toolbar_module_default.counterBlock, _v$1 = cx(Toolbar_module_default.mediaCounterWrapper, "xeg-inline-center"), _v$10 = cx(Toolbar_module_default.mediaCounter, "xeg-inline-center"), _v$11 = Toolbar_module_default.currentIndex, _v$12 = Toolbar_module_default.separator, _v$13 = Toolbar_module_default.totalCount, _v$14 = Toolbar_module_default.progressBar, _v$15 = Toolbar_module_default.progressFill, _v$16 = props.progressWidth(), _v$17 = cx(Toolbar_module_default.settingsPanel, props.settingsController.isSettingsExpanded() ? Toolbar_module_default.panelExpanded : void 0), _v$18 = cx(Toolbar_module_default.tweetPanel, props.isTweetPanelExpanded() ? Toolbar_module_default.panelExpanded : void 0), _v$19 = translate("tb.twPanel");
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
_v$15 !== _p$.y && className(_el$1, _p$.y = _v$15);
_v$16 !== _p$.g && setStyleProperty(_el$1, "width", _p$.g = _v$16);
_v$17 !== _p$.p && className(_el$10, _p$.p = _v$17);
_v$18 !== _p$.b && className(_el$11, _p$.b = _v$18);
_v$19 !== _p$.T && setAttribute(_el$11, "aria-label", _p$.T = _v$19);
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
T: void 0
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
//#region src/shared/hooks/toolbar/use-toolbar-settings-controller.ts
var toolbarSettingsControllerListenerSeq = 0;
var DEFAULTS = {
FOCUS_DELAY_MS: 50,
SELECT_GUARD_MS: 300
};
function useToolbarSettingsController(options) {
/**
* Settings panel management hook
* Handles toggling, outside-click detection, theme/language selection, and focus management
*/
const { isSettingsExpanded, setSettingsExpanded, toggleSettingsExpanded, documentRef = typeof document !== "undefined" ? document : void 0, themeService: providedThemeService, languageService: providedLanguageService, focusDelayMs = DEFAULTS.FOCUS_DELAY_MS, selectChangeGuardMs = DEFAULTS.SELECT_GUARD_MS } = options;
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
return toThemeOption(themeManager.getCurrentTheme());
} catch (error) {}
return "auto";
};
const [currentTheme, setCurrentTheme] = createSignal(getInitialTheme());
const [currentLanguage, setCurrentLanguage] = createSignal(languageService.getCurrentLanguage());
const syncThemeFromService = () => {
try {
setCurrentTheme(toThemeOption(themeManager.getCurrentTheme()));
} catch (error) {
;
}
};
syncThemeFromService();
if (typeof themeManager.isInitialized === "function" && !themeManager.isInitialized()) themeManager.initialize().then(syncThemeFromService).catch((error) => {
;
});
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
const eventManager = EventManager.getInstance();
const listenerContext = `toolbar-settings-controller:${toolbarSettingsControllerListenerSeq++}`;
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
if (settingsService) settingsService.set("gallery.theme", theme).catch((error) => {
;
});
} catch (error) {
;
}
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
var DOWNLOAD_MIN_DISPLAY_TIME = 300;
function useToolbarState() {
const [isDownloading, setIsDownloading] = createSignal(false);
const [isLoading, setIsLoading] = createSignal(false);
const [hasError, setHasError] = createSignal(false);
const [lastDownloadToggle, setLastDownloadToggle] = createSignal(0);
const [downloadTimeoutRef, setDownloadTimeoutRef] = createSignal(null);
const clearDownloadTimeout = () => {
const timer = downloadTimeoutRef();
if (timer !== null) {
clearTimeout(timer);
setDownloadTimeoutRef(null);
}
};
const setDownloading = (downloading) => {
const now = performance.now();
if (downloading) {
setLastDownloadToggle(now);
clearDownloadTimeout();
setIsDownloading(true);
setHasError(false);
return;
}
const timeSinceStart = now - lastDownloadToggle();
if (timeSinceStart < DOWNLOAD_MIN_DISPLAY_TIME) {
clearDownloadTimeout();
setDownloadTimeoutRef(setTimeout(() => {
setIsDownloading(false);
setDownloadTimeoutRef(null);
}, DOWNLOAD_MIN_DISPLAY_TIME - timeSinceStart));
return;
}
setIsDownloading(false);
};
const setLoading = (loading) => {
setIsLoading(loading);
if (loading) setHasError(false);
};
const setError = (errorState) => {
setHasError(errorState);
if (errorState) {
setIsLoading(false);
setIsDownloading(false);
}
};
const resetState = () => {
clearDownloadTimeout();
setLastDownloadToggle(0);
setIsDownloading(false);
setIsLoading(false);
setHasError(false);
};
onCleanup(() => {
clearDownloadTimeout();
});
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
"tweetTextHTML",
"tweetUrl"
]);
const translate = useTranslation();
const [toolbarState, toolbarActions] = useToolbarState();
const [settingsExpandedSignal, setSettingsExpandedSignal] = createSignal(false);
const [tweetExpanded, setTweetExpanded] = createSignal(false);
const totalItems = createMemo(() => Math.max(0, local.totalCount() ?? 0));
const currentIndexForNav = createMemo(() => clampIndex(local.currentIndex() ?? 0, totalItems()));
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
const canNavigate = hasItems && total > 1;
const toolbarDisabled = !!(local.disabled?.() ?? false);
const downloadBusy = !!(local.isDownloading?.() ?? false) || toolbarState.isDownloading();
return {
prevDisabled: toolbarDisabled || !canNavigate,
nextDisabled: toolbarDisabled || !canNavigate,
canDownloadAll: total > 1,
downloadDisabled: toolbarDisabled || downloadBusy || !hasItems,
anyActionDisabled: toolbarDisabled
};
});
const fitModeHandlers = createMemo(() => ({
original: local.handlers.fitMode?.onFitOriginal,
fitWidth: local.handlers.fitMode?.onFitWidth,
fitHeight: local.handlers.fitMode?.onFitHeight,
fitContainer: local.handlers.fitMode?.onFitContainer
}));
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
const activeFitMode = createMemo(() => local.currentFitMode?.() ?? FIT_MODE_ORDER[0]?.mode ?? "original");
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
get tweetTextHTML() {
return local.tweetTextHTML?.() ?? null;
},
get tweetUrl() {
return local.tweetUrl?.() ?? null;
},
toolbarClass: createMemo(() => {
const cls = [Toolbar_module_default.toolbar, Toolbar_module_default.galleryToolbar];
if (local.className) cls.push(local.className);
return cls.join(" ");
}),
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
//#region src/shared/state/signals/download.signals.ts
/**
* Download state signals — separated from gallery.signals to avoid
* coupling download lifecycle to gallery open/close transitions.
*/
var [_isProcessing, setIsProcessing] = createSignal(false);
var downloadState = { get isProcessing() {
return _isProcessing();
} };
function setDownloading(value) {
setIsProcessing(value);
}
//#endregion
//#region src/shared/utils/performance/preload.ts
/**
* Computes indices to preload around current item with bounds safety
*/
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
const safeCount = clamp(Math.floor(count), 0, 20);
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
* @version 8.0
*/
var _tmpl$$2 = /* @__PURE__ */ template(`<div><div><h3></h3><p>`), _tmpl$2 = /* @__PURE__ */ template(`<div><div data-role=toolbar-hover-zone></div><div data-role=toolbar></div><div data-xeg-role=items-container><div aria-hidden=true data-xeg-role=scroll-spacer>`);
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
const tweetText = createMemo(() => activeMedia()?.tweetText ?? null);
const tweetTextHTML = createMemo(() => activeMedia()?.tweetTextHTML ?? null);
const tweetUrl = createMemo(() => activeMedia()?.tweetUrl ?? null);
const preloadIndices = createMemo(() => {
const count = getTypedSettingOr("gallery.preloadCount", 3);
return computePreloadIndices(currentIndex(), mediaItems().length, count);
});
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
const { imageFitMode, handleFitOriginal, handleFitWidth, handleFitHeight, handleFitContainer } = useGalleryFitMode({
scrollToCurrentItem: scroll.scrollToCurrentItem,
currentIndex
});
const handleDownloadCurrent = () => local.onDownloadCurrent?.();
const handleDownloadAll = () => local.onDownloadAll?.();
const handleMediaLoad = (mediaId, indexValue) => debouncedScrollCorrection(indexValue, mediaId);
const createRegisterContainer = (index) => (element) => focus.registerItem(index, element);
const createHandleFocus = (index) => () => focus.handleItemFocus(index);
const { handlePrevious, handleNext, handleBackgroundClick, handleMediaItemClick } = useGalleryNavigationHandlers({
currentIndex,
mediaItems,
onClose: handleClose
});
useGalleryWheelRedirect({
containerEl,
itemsContainerEl
});
if (!isVisible()) return (() => {
var _el$ = _tmpl$$2(), _el$2 = _el$.firstChild, _el$3 = _el$2.firstChild, _el$4 = _el$3.nextSibling;
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
var _el$5 = _tmpl$2(), _el$6 = _el$5.firstChild, _el$7 = _el$6.nextSibling, _el$8 = _el$7.nextSibling, _el$9 = _el$8.firstChild;
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
tweetTextHTML,
tweetUrl,
get className() {
return VerticalGalleryView_module_default.toolbar;
},
get handlers() {
return {
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
};
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
//#region src/features/gallery/hooks/use-gallery-download.ts
/**
* @fileoverview Gallery download hook - manages single and batch download.
*/
function useGalleryDownload() {
const userscript = getUserscript();
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
setDownloading(true);
const notifyError = (title, body) => {
userscript.notification({
title,
text: body
});
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
const result = await downloadService.downloadSingle(currentMedia, { ...blob ? { blob } : {} });
if (!result.success) {
const error = result.error || "Unknown error";
const title = languageService.translate("msg.dl.one.err.t");
const body = languageService.translate("msg.dl.one.err.b", { error });
setError(body);
notifyError(title, body);
}
}
} else {
const prefetchedBlobs = /* @__PURE__ */ new Map();
for (const item of mediaItems) {
if (!item) continue;
const pending = mediaService.getCachedMedia(item.url);
if (!pending) continue;
prefetchedBlobs.set(item.url, pending);
}
const result = await downloadService.downloadBulk([...mediaItems], { ...prefetchedBlobs.size > 0 ? { prefetchedBlobs } : {} });
if (!result.success) {
if (result.filesSuccessful === 0) {
const title = languageService.translate("msg.dl.allFail.t");
const body = languageService.translate("msg.dl.allFail.b");
setError(body);
notifyError(title, body);
} else {
const error = result.error || "Failed to save ZIP file";
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
return { handleDownload };
}
//#endregion
//#region src/shared/components/isolation/GalleryContainer.tsx
var _tmpl$$1 = /* @__PURE__ */ template(`<div data-xeg-gallery-container>`);
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
const [local] = splitProps(props, ["children", "className"]);
const classes = cx(CSS.CLASSES.OVERLAY, CSS.CLASSES.CONTAINER, local.className);
return (() => {
var _el$ = _tmpl$$1();
className(_el$, classes);
insert(_el$, () => local.children);
return _el$;
})();
}
//#endregion
//#region src/shared/components/ui/ErrorBoundary/ErrorBoundary.tsx
/**
* @fileoverview Wraps SolidJS `<ErrorBoundary>` with localized error notifications.
* Provides a retry-friendly fallback UI and deduplicates error notifications.
*/
var _tmpl$ = /* @__PURE__ */ template(`<div aria-live=polite data-xeg-error-boundary role=alert><p class=xeg-error-boundary__title></p><p class=xeg-error-boundary__body></p><button class=xeg-error-boundary__action type=button>Retry`);
/**
* Converts an error to string, handling Error objects and fallbacks safely.
*/
function stringifyError(error) {
if (error instanceof Error && error.message) return error.message;
try {
return String(error);
} catch {
return "Unknown error";
}
}
/**
* Returns localized error title and body using language service.
*/
function translateError(error) {
try {
const lang = getLanguageService();
return {
title: lang.translate("msg.err.t"),
body: lang.translate("msg.err.b", { error: stringifyError(error) })
};
} catch {
return {
body: stringifyError(error),
title: "Unexpected error"
};
}
}
/**
* Error Boundary component with localized notifications and retry support.
*/
function ErrorBoundary(props) {
const [lastError, setLastError] = createSignal(void 0);
const [caughtError, setCaughtError] = createSignal(void 0);
const [mounted, setMounted] = createSignal(true);
const [retryCount, setRetryCount] = createSignal(0);
const notifyError = (error) => {
if (lastError() === error) return;
setLastError(error);
const { title, body } = translateError(error);
getUserscript().notification({
title,
text: body
});
};
const handleRetry = () => {
if (retryCount() >= 3) return;
setLastError(void 0);
setCaughtError(void 0);
setRetryCount((c) => c + 1);
setMounted(false);
queueMicrotask(() => setMounted(true));
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
children: (error) => {
const { title, body } = translateError(error());
return (() => {
var _el$ = _tmpl$(), _el$2 = _el$.firstChild, _el$3 = _el$2.nextSibling, _el$4 = _el$3.nextSibling;
insert(_el$2, title);
insert(_el$3, body);
_el$4.$$click = handleRetry;
return _el$;
})();
}
})];
}
delegateEvents(["click"]);
//#endregion
//#region src/features/gallery/GalleryRenderer.tsx
/** Handles rendering and lifecycle of the gallery component. */
function GalleryRoot(props) {
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
get children() {
return createComponent(ErrorBoundary, { get children() {
return createComponent(VerticalGalleryView, {
get onClose() {
return props.onClose;
},
onPrevious: () => navigatePrevious("button"),
onNext: () => navigateNext("button"),
onDownloadCurrent: () => props.onDownloadCurrent(),
onDownloadAll: () => props.onDownloadAll(),
get className() {
return CSS.CLASSES.VERTICAL_VIEW;
}
});
} });
}
});
}
var GalleryRenderer = class {
container = null;
isMounting = false;
stateUnsubscribe = null;
downloadHandler;
constructor() {
this.downloadHandler = useGalleryDownload().handleDownload;
this.setupStateSubscription();
}
setupStateSubscription() {
this.stateUnsubscribe = createEffectRoot(() => {
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
onDownloadCurrent: () => _self$.downloadHandler("current"),
onDownloadAll: () => _self$.downloadHandler("all")
});
});
}
cleanupGallery() {
this.isMounting = false;
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
this.stateUnsubscribe?.();
this.stateUnsubscribe = null;
this.cleanupGallery();
}
};
//#endregion
//#region src/constants/settings.ts
var APP_SETTINGS_STORAGE_KEY = "xeg-app-settings";
var DEFAULT_SETTINGS = {
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
version: "2.1.1",
lastModified: 0
};
function createDefaultSettings(timestamp = Date.now()) {
return globalThis.structuredClone({
...DEFAULT_SETTINGS,
lastModified: timestamp
});
}
//#endregion
//#region src/features/settings/services/settings-migration.ts
function pruneWithTemplate(input, template) {
if (!isRecord(input)) return {};
const out = {};
for (const key of Object.keys(template)) {
const tplVal = template[key];
const inVal = input[key];
if (inVal === void 0) continue;
if (isRecord(tplVal) && !Array.isArray(tplVal)) out[key] = pruneWithTemplate(inVal, tplVal);
else out[key] = inVal;
}
return out;
}
function migrateSettings(input, nowMs) {
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
storage = PersistentStorage.getInstance();
schemaHash = SETTINGS_SCHEMA_HASH;
async load() {
const stored = await this.storage.get(APP_SETTINGS_STORAGE_KEY);
if (!stored) return globalThis.structuredClone(createDefaultSettings());
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
//#region src/features/settings/services/settings-helpers.ts
/**
* @fileoverview Settings service helper utilities
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
/** Assign value to nested object property by dot-notation path */
function assignNestedPath(target, path, value) {
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
function isValidSettingValue(defaultValue, value) {
if (defaultValue === void 0) return true;
if (Array.isArray(defaultValue)) return Array.isArray(value);
if (typeof defaultValue === "object" && defaultValue !== null) return typeof value === "object" && value !== null;
return typeof value === typeof defaultValue;
}
//#endregion
//#region src/features/settings/services/settings-service.ts
var _settingsInstance = null;
var SettingsService = class SettingsService {
repository;
_initialized = false;
static getInstance() {
if (!_settingsInstance) _settingsInstance = new SettingsService();
return _settingsInstance;
}
settings = createDefaultSettings();
listeners = /* @__PURE__ */ new Set();
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
if (!isValidSettingValue(this.getDefaultValue(key), value)) throw new Error(`Invalid setting value for ${key}`);
const oldValue = this.get(key);
if (!assignNestedPath(this.settings, key, value)) throw new Error(`Failed to assign setting value for ${key}`);
this.settings.lastModified = Date.now();
this.notifyListeners({
key,
oldValue,
newValue: value,
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
async persist() {
await this.repository.save(this.settings);
}
getDefaultValue(key) {
return resolveNestedPath(DEFAULT_SETTINGS, key);
}
notifyListeners(event) {
for (const listener of this.listeners) try {
listener(event);
} catch (error) {}
}
};
//#endregion
//#region src/bootstrap/gallery-init.ts
/**
* @fileoverview Gallery bootstrap helpers.
*/
async function initializeSettingsService() {
const settings = new SettingsService();
await settings.initialize();
registerSettings(settings);
}
async function initializeGalleryServices() {
try {
await initializeSettingsService();
} catch (error) {
settingsErrorReporter.warn(error, { code: "SETTINGS_SERVICE_INIT_FAILED" });
getUserscript().notification({
title: "Settings unavailable",
text: "Defaults will be used until settings load."
});
}
}
async function initializeGalleryApp() {
try {
new GalleryRenderer();
const galleryApp = new GalleryApp();
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
var formatErrorLocation = (filename, lineno, colno) => filename && `${filename}:${lineno ?? 0}:${colno ?? 0}`;
var formatRejectionMessage = (reason) => {
if (reason instanceof Error) return reason.message;
if (typeof reason === "string") return reason;
return `Unhandled rejection: ${String(reason)}`;
};
var _errorHandlerInstance = null;
var GlobalErrorHandler = class GlobalErrorHandler {
isInitialized = false;
controller = null;
constructor() {}
static getInstance() {
if (!_errorHandlerInstance) _errorHandlerInstance = new GlobalErrorHandler();
return _errorHandlerInstance;
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
const eventManager = EventManager.getInstance();
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
/**
* Destroy the global error handler and clean up all resources.
* Removes all event listeners and aborts any pending operations.
* Safe to call multiple times - subsequent calls are ignored.
*/
destroy() {
if (!this.isInitialized) return;
this.controller?.abort();
this.controller = null;
this.isInitialized = false;
}
};
//#endregion
//#region src/main.ts
/**
* @fileoverview Main entry. Orchestrates bootstrap stages, startup, and cleanup.
*/
var lifecycleState = {
started: false,
startPromise: null,
galleryApp: null
};
function wireGlobalEvents(onBeforeUnload) {
const controller = new AbortController();
const handler = () => {
controller.abort();
onBeforeUnload();
};
EventManager.getInstance().addEventListener(window, "pagehide", handler, {
once: true,
passive: true,
signal: controller.signal,
context: "bootstrap:pagehide"
});
return () => {
controller.abort();
};
}
var globalEventTeardown = null;
function tearDownGlobalEventHandlers() {
if (!globalEventTeardown) return;
const teardown = globalEventTeardown;
globalEventTeardown = null;
try {
teardown();
} catch (error) {}
}
function setupGlobalEventHandlers() {
tearDownGlobalEventHandlers();
globalEventTeardown = wireGlobalEvents(() => {
cleanup().catch((error) => {});
});
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
run: () => GlobalErrorHandler.getInstance().initialize()
},
{
label: "Gallery services",
run: initializeGalleryServices,
optional: true
},
{
label: "Base services",
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
async function cleanup() {
try {
await runOptionalCleanup("gallery", async () => {
const app = lifecycleState.galleryApp;
lifecycleState.galleryApp = null;
if (app) await app.cleanup();
});
tearDownGlobalEventHandlers();
await runOptionalCleanup("error-handler", () => GlobalErrorHandler.getInstance().destroy());
lifecycleState.started = false;
} catch (error) {
bootstrapErrorReporter.error(error, { code: "CLEANUP_FAILED" });
throw error;
}
}
async function startApplication() {
if (lifecycleState.startPromise) return lifecycleState.startPromise;
if (lifecycleState.started) return;
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
startApplication().catch((error) => {});
//#endregion
})();
