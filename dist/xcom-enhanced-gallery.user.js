// ==UserScript==
// @name         X.com Enhanced Gallery
// @namespace    https://github.com/PiesP/xcom-enhanced-gallery
// @version      1.1.0
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
// @supportURL   https://github.com/PiesP/xcom-enhanced-gallery/issues
// @downloadURL  https://cdn.jsdelivr.net/gh/PiesP/xcom-enhanced-gallery@master/dist/xcom-enhanced-gallery.user.js
// @updateURL    https://cdn.jsdelivr.net/gh/PiesP/xcom-enhanced-gallery@master/dist/xcom-enhanced-gallery.user.js
// @noframes
// ==/UserScript==
/*
 * Third-Party Licenses
 * ====================
 *
 * MIT License
 *
 * Copyright (c) Tailwind Labs, Inc. (Heroicons)
 * Copyright (c) 2016-2024 Ryan Carniato (Solid.js)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 */

(function() {
  'use strict';
  if (typeof document === 'undefined') return;

  var css = ":where(.xeg_fo-0dp){transition:var(--xti)} .xeg_fo-0dp{border:.0625rem solid transparent;border-radius:var(--xr-m);font-family:var( --xff-u, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif );font-weight:var(--xfw-m);text-decoration:none;cursor:pointer;user-select:none;background:transparent;color:inherit;&:focus-visible{border-color:var(--xfic, var(--xcb-p));z-index:1} &:disabled{opacity:var(--xb-do, var(--xo-d));cursor:not-allowed;transform:none}} .xeg_eGfiCS{padding:var(--xs-xs) var(--xs-s);font-size:var(--xfs-s);min-height:var(--xsb-s);border-radius:var(--xr-s)} .xeg_HQ-pdQ{padding:var(--xs-s) var(--xs-m);font-size:var(--xfs-b);min-height:var(--xsb-m)} .xeg_OlARDM{padding:var(--xs-m) var(--xs-l);font-size:var(--xfs-l);min-height:var(--xsb-l);border-radius:var(--xr-l)} .xeg_QBM9Ik{background:var(--color-primary);color:var(--color-text-inverse);border-color:var(--color-primary)} .xeg_QBM9Ik:hover:not(:disabled){background:var(--color-primary-hover);border-color:var(--color-primary-hover);transform:translateY(var(--xb-l))} .xeg_QBM9Ik:active:not(:disabled){transform:translateY(0)} .xeg_plglHX{background:var(--xcn1);color:var(--xct-p);border-color:var(--xcb-p)} .xeg_plglHX:hover:not(:disabled){background:var(--xcn2);border-color:var(--xcb-h);transform:translateY(var(--xb-l))} .xeg_plglHX:active:not(:disabled){transform:translateY(0);background:var(--xcn1)} .xeg_wAOIqT{background:transparent;color:var(--xct-p);border-color:var(--xcb-p)} .xeg_wAOIqT:hover:not(:disabled){background:var(--xcn1);border-color:var(--xcb-h);transform:translateY(var(--xb-l))} .xeg_wAOIqT:active:not(:disabled){transform:translateY(0);background:var(--xcn2)} .xeg_7vf19L{background:transparent;color:var(--xct-s);border-color:transparent} .xeg_7vf19L:hover:not(:disabled){background:var(--xcn1);color:var(--xct-p);transform:translateY(var(--xb-l))} .xeg_7vf19L:active:not(:disabled){transform:translateY(0);background:var(--xcn2)} .xeg_gY3mKU{background:var(--color-error);color:var(--color-text-inverse);border-color:var(--color-error)} .xeg_gY3mKU:hover:not(:disabled){background:var(--color-error-hover);border-color:var(--color-error-hover);transform:translateY(var(--xb-l))} .xeg_gY3mKU:active:not(:disabled){transform:translateY(0)} .xeg_hhXZtE{background:transparent;color:var(--xct-s);border-color:var(--xcb-p);aspect-ratio:1;padding:var(--xs-s)} .xeg_hhXZtE:hover:not(:disabled){background:var(--xcn1);color:var(--xct-p);border-color:var(--xcb-h);transform:translateY(var(--xb-l))} .xeg_hhXZtE:active:not(:disabled){transform:translateY(0);background:var(--xcn2)}:where(.xeg_w0xu8z, .xeg_X7avzn, .xeg_5VJv9K, .xeg_ckEOwJ){width:var(--xb-ss, var(--xsb-m));height:var(--xb-ss, var(--xsb-m));min-width:var(--xb-ss, var(--xsb-m));min-height:var(--xb-ss, var(--xsb-m));padding:var(--xb-sp, .5em);aspect-ratio:1} .xeg_w0xu8z{background:transparent;color:var(--xct-p);border-color:var(--xcb-p)} .xeg_w0xu8z:hover:not(:disabled){background:var(--xcn1);border-color:var(--xcb-h);transform:translateY(var(--xb-l))} .xeg_w0xu8z:active:not(:disabled){transform:translateY(0);background:var(--xcn2)} .xeg_X7avzn{background:var(--xc-p);color:var(--color-text-inverse);border-color:var(--xc-p)} .xeg_X7avzn:hover:not(:disabled){background:var(--color-primary-hover);border-color:var(--color-primary-hover);transform:translateY(var(--xb-l))} .xeg_X7avzn:active:not(:disabled){transform:translateY(0)} .xeg_5VJv9K{background:var(--xc-s);color:var(--color-text-inverse);border-color:var(--xc-s)} .xeg_5VJv9K:hover:not(:disabled){background:var(--color-success-hover);border-color:var(--color-success-hover);transform:translateY(var(--xb-l))} .xeg_5VJv9K:active:not(:disabled){transform:translateY(0)} .xeg_ckEOwJ{--xb-ss:var(--xsb-m);--xb-sp:.5em;font-size:.875em} .xeg_XYc0m9{--xios:var(--xsb-m);aspect-ratio:1;padding:var(--xs-s);width:var(--xios);height:var(--xios);min-width:var(--xios);min-height:var(--xios)} .xeg_XYc0m9.xeg_eGfiCS{--xios:var(--xsb-s);padding:var(--xs-xs)} .xeg_XYc0m9.xeg_HQ-pdQ{--xios:var(--xsb-m)} .xeg_XYc0m9.xeg_OlARDM{--xios:var(--xsb-l);padding:var(--xs-m)} .xeg_n6NlCJ{border-color:var(--color-primary);color:var(--color-primary)} .xeg_n6NlCJ:hover:not(:disabled){background:var(--color-info-bg);border-color:var(--color-primary-hover)} .xeg_XOcWSO{border-color:var(--color-success);color:var(--color-success)} .xeg_XOcWSO:hover:not(:disabled){background:var(--color-success-bg);border-color:var(--color-success-hover)} .xeg_-AdANz{border-color:var(--color-error);color:var(--color-error)} .xeg_-AdANz:hover:not(:disabled){background:var(--color-error-bg);border-color:var(--color-error-hover)} .xeg_r7YJ-A{border-color:var(--xcn4);color:var(--xct-s)} .xeg_r7YJ-A:hover:not(:disabled){background:var(--xcn1);border-color:var(--xcn5)} .xeg_CfJMD-{opacity:.8;cursor:wait;pointer-events:none} .xeg_PEieDK{opacity:var(--xb-do, var(--xo-d));cursor:not-allowed;transform:none} .xeg_243I8p{--xsp-s:1em;--xsp-tc:transparent;--xsp-ic:currentColor;margin-right:var(--xs-xs)} @media (prefers-reduced-motion:reduce){.xeg_243I8p{animation:none} .xeg_fo-0dp:hover:not(:disabled){transform:none}} .xeg_4eojab{color:var(--xtt-c, var(--xct-p));cursor:pointer;font-size:.875em;font-weight:500;position:relative;overflow:clip;border-radius:var(--xr-m);background:var( --toolbar-surface-base, var(--xtp-s, var(--xt-s)) );--toolbar-button-accent:var(--toolbar-surface-border, var(--xt-b));--toolbar-button-accent-hover:var(--xcb-h);--toolbar-button-focus-border:var( --xfic, var(--toolbar-button-accent-hover) );border:var(--border-width-thin) solid var(--toolbar-button-accent, var(--xt-b));transition:var(--xts), transform var(--xdf) var(--xe-s)} .xeg_4eojab:focus, .xeg_4eojab:focus-visible{border-color:var(--toolbar-button-focus-border)} .xeg_fLg7uD{--toolbar-surface-base:var(--xtp-s, var(--xt-s));--toolbar-surface-border:var(--xt-b);--xb-do:1;background:var(--toolbar-surface-base);border:none;border-radius:var(--xr-l);position:fixed;top:1.25em;left:50%;transform:translateX(-50%);z-index:var(--xz-t);display:var(--toolbar-display, inline-flex);align-items:center;justify-content:space-between;height:3em;padding:.5em 1em;gap:0;color:var(--xtt-c, var(--xct-p));visibility:var(--toolbar-visibility, visible);opacity:var(--toolbar-opacity, 1);pointer-events:var(--toolbar-pointer-events, auto);transition:var(--xten);user-select:none;overscroll-behavior:contain} .xeg_fLg7uD[data-settings-expanded='true'], .xeg_fLg7uD[data-tweet-panel-expanded='true']{border-radius:var(--xr-l) var(--xr-l) 0 0} .xeg_fLg7uD[data-state='idle'], .xeg_fLg7uD:not([data-state]){--toolbar-opacity:1;--toolbar-pointer-events:auto;--toolbar-visibility:visible;--toolbar-display:inline-flex} .xeg_fLg7uD[data-state='loading'], .xeg_fLg7uD[data-state='downloading'], .xeg_fLg7uD[data-state='error']{--toolbar-opacity:1;--toolbar-pointer-events:auto;--toolbar-visibility:visible;--toolbar-display:inline-flex} .xeg_f8g4ur{display:flex;align-items:center;justify-content:center;width:100%;max-width:100%;overflow:hidden} .xeg_Ix3ja2{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:var(--space-xs);width:100%} .xeg_Ix3ja2 > *{flex:0 0 auto} .xeg_0EHq9g{display:flex;align-items:center;justify-content:center;padding-inline:var(--space-sm);min-width:5em} .xeg_FKnOOH{color:var(--xtt-m, var(--xct-p));margin:0 .125em}:where(.xeg_4eojab[data-active='true'], .xeg_4eojab[data-selected='true']){border-color:var(--toolbar-button-accent-hover)} .xeg_4eojab[data-loading='true']{--button-opacity:.7;--button-transform:scale(.95)} .xeg_4eojab[data-disabled='true']{--button-opacity:.5;color:var(--xtt-m, var(--xcn4));cursor:not-allowed} @media (hover:hover){.xeg_4eojab:hover:not([data-disabled='true']){border-color:var(--toolbar-button-accent-hover);transform:translateY(var(--xb-l))}}:where(.xeg_4eojab.xeg_sOycQJ, .xeg_njlfQM){--toolbar-button-accent:var(--xc-p);--toolbar-button-accent-hover:var(--xc-ph);--toolbar-button-focus-border:var(--xc-ph)}:where(.xeg_4eojab.xeg_PN3Cut, .xeg_AU-dPz){--toolbar-button-accent:var(--xc-s);--toolbar-button-accent-hover:var(--xc-sh);--toolbar-button-focus-border:var(--xc-sh)}:where(.xeg_4eojab.xeg_hxgUUk, .xeg_Vn14NE){--toolbar-button-accent:var(--xc-e);--toolbar-button-accent-hover:var(--xc-eh);--toolbar-button-focus-border:var(--xc-eh)} .xeg_atmJJM{position:relative} .xeg_GG869J{position:relative;gap:0;min-width:5em;min-height:2.5em;padding-bottom:.5em;box-sizing:border-box} .xeg_2cjmvu{color:var(--xtt-c, var(--xct-p));font-size:var(--xfs-m);font-weight:600;text-align:center;white-space:nowrap;line-height:1;background:transparent;padding:.25em .5em;border-radius:var(--xr-m);border:none} .xeg_JEXmPu{color:var(--xtt-c, var(--xct-p));font-weight:700} .xeg_d1et2f{color:var(--xtt-c, var(--xct-p))} .xeg_vB6NL3{position:absolute;left:50%;bottom:.125em;transform:translateX(-50%);width:3.75em;height:.125em;background:var(--xtp-pt, var(--xcn2));border-radius:var(--xr-s);overflow:clip} .xeg_LWQwIA{width:100%;height:100%;background:var(--xtt-c, var(--xct-p));border-radius:var(--xr-s);transition:var(--xtwn);transform-origin:left} .xeg_Q7dUY4, button.xeg_Q7dUY4{transition:var(--xti);position:relative;z-index:10;pointer-events:auto} .xeg_Q7dUY4[data-selected='true']{--toolbar-button-accent-hover:var(--xc-p);--toolbar-button-focus-border:var(--xc-ph)} .xeg_Q7dUY4:focus, .xeg_Q7dUY4:focus-visible{border-color:var(--toolbar-button-focus-border, var(--xcb-h))} .xeg_atmJJM{position:relative} @media (prefers-reduced-transparency:reduce){.xeg_fLg7uD{background:var(--xtp-s, var(--xt-s))} [data-theme='dark'] .xeg_fLg7uD{background:var(--xtp-s, var(--xt-s))}} @media (prefers-reduced-motion:reduce){.xeg_4eojab:hover:not(:disabled), .xeg_atmJJM:hover:not(:disabled), .xeg_Vn14NE:hover:not(:disabled), .xeg_Q7dUY4:hover{transform:none}}:where(.xeg_JcF-YS, .xeg_yRtvAY){position:absolute;top:100%;left:0;right:0;width:100%;display:flex;flex-direction:column;gap:var(--space-md);padding:var(--space-md);max-height:var(--xtp-mh);overflow:hidden;opacity:0;transform:translateY(-.5em);visibility:hidden;pointer-events:none;transition:var(--xtp-t), transform var(--xdn) var(--xe-s), visibility 0s var(--xdn);background:var( --toolbar-surface-base, var(--xtp-s, var(--xt-s)) );border-top:var(--border-width-thin) solid var(--toolbar-surface-border, var(--xt-b));border-radius:0 0 var(--xr-l) var(--xr-l);z-index:var(--xz-tp);will-change:transform, opacity;overscroll-behavior:contain} .xeg_JcF-YS{height:var(--xtp-h)} .xeg_yRtvAY{min-height:var(--xtp-h)}:where(.xeg_JcF-YS, .xeg_yRtvAY)[data-expanded='true']{height:auto;opacity:1;transform:translateY(0);visibility:visible;pointer-events:auto;border-top-color:var(--toolbar-surface-border, var(--xt-b));transition:var(--xtp-t), transform var(--xdn) var(--xe-s), visibility 0s 0s;z-index:var(--xz-ta)} .xeg_w56Ci4{display:flex;flex-direction:column;gap:var(--space-sm)} .xeg_jmjGCs{padding:var(--space-sm);font-size:var(--xfs-m);line-height:1.5;color:var(--xtt-c, var(--xct-p));background:var( --toolbar-surface-base, var(--xtp-s, var(--xt-s)) );border:var(--border-width-thin) solid var(--toolbar-surface-border, var(--xt-b));border-radius:var(--xr-m);white-space:pre-wrap;word-wrap:break-word;overflow-y:auto;overscroll-behavior:contain;max-height:15em;transition:var(--xts);user-select:text;-webkit-user-select:text;cursor:text} .xeg_jmjGCs::-webkit-scrollbar{width:.5em} .xeg_jmjGCs::-webkit-scrollbar-track{background:var(--xts-t, var(--xcn2));border-radius:var(--xr-s)} .xeg_jmjGCs::-webkit-scrollbar-thumb{background:var(--xts-th, var(--xcn4));border-radius:var(--xr-s)} .xeg_jmjGCs::-webkit-scrollbar-thumb:hover{background:var(--xte-bs, var(--xcn5))}:where(.xeg_ZzP6Op, .xeg_jmjGCs a){color:var(--xc-p);text-decoration:none;overflow-wrap:break-word;transition:color var(--xdf) var(--xe-s), background-color var(--xdf) var(--xe-s);cursor:pointer}:where(.xeg_ZzP6Op, .xeg_jmjGCs a):hover{color:var(--xc-ph);text-decoration:underline}:where(.xeg_ZzP6Op, .xeg_jmjGCs a):focus,:where(.xeg_ZzP6Op, .xeg_jmjGCs a):focus-visible{background:var(--xte-bs, var(--xcn2));color:var(--xc-ph);border-radius:var(--xr-xs)}:where(.xeg_ZzP6Op, .xeg_jmjGCs a):active{color:var(--xc-p-active)} @layer base, components, utilities;.xeg_LSA44p{container-type:size;container-name:vertical-gallery;contain:layout style paint;content-visibility:auto;contain-intrinsic-size:100vw 100vh} @layer components{:root{--xtt:opacity var(--xdt) var(--xeo), transform var( --xdt ) var(--xeo), visibility 0ms;--xeg-spacing-gallery:clamp(var(--xs-s), 2.5vw, var(--xs-l));--xeg-spacing-mobile:clamp(var(--xs-xs), 2vw, var(--xs-m));--xeg-spacing-compact:clamp(.25rem, 1.5vw, var(--xs-s));--xth-o:0;--xth-v:hidden;--xth-pe:none}} @media (prefers-reduced-motion:reduce){@layer components{:root{--xtt:none}}} .xeg_X9gZRg{position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:var(--xz-g, 10000);background:var(--xg-b);display:flex;flex-direction:column;transform:var(--xgh);will-change:opacity, transform;contain:layout style paint;opacity:1;visibility:visible;transition:var(--xten);cursor:default;pointer-events:auto;container-type:size;container-name:gallery-container;scroll-behavior:smooth;overscroll-behavior:none} .xeg_meO3Up{position:fixed;top:0;left:0;right:0;height:auto;z-index:var(--xz-t);opacity:var(--toolbar-opacity, 0);visibility:var(--toolbar-visibility, hidden);display:block;transition:var(--xtt);will-change:transform, opacity, visibility;contain:layout style;transform:var(--xgh);backface-visibility:var(--xbv);pointer-events:var(--toolbar-pointer-events, none);background:transparent;border:none;border-radius:0;margin:0;padding-block-end:var(--xeg-spacing-gallery)} .xeg_meO3Up:hover{--toolbar-opacity:1;--toolbar-visibility:visible;--toolbar-pointer-events:auto;--toolbar-transform-y:0} .xeg_meO3Up:focus-within{--toolbar-opacity:1;--toolbar-visibility:visible;--toolbar-pointer-events:auto;--toolbar-transform-y:0;transition:var(--xtef)} .xeg_meO3Up *{pointer-events:inherit} .xeg_meO3Up [data-gallery-element='settings-panel'][data-expanded='true']{pointer-events:auto} .xeg_meO3Up:has([data-gallery-element='settings-panel'][data-expanded='true']){--toolbar-opacity:1;--toolbar-visibility:visible;--toolbar-pointer-events:auto} .xeg_X9gZRg.xeg_9abgzR{cursor:none} .xeg_X9gZRg.xeg_sOsSyv[data-xeg-gallery='true'][data-xeg-role='gallery'] .xeg_meO3Up{--toolbar-opacity:var(--xth-o, 0);--toolbar-visibility:var(--xth-v, hidden);--toolbar-pointer-events:var(--xth-pe, none)} .xeg_X9gZRg *{pointer-events:auto} .xeg_gmRWyH{flex:1;display:flex;flex-direction:column;overflow:auto;position:relative;contain:layout style;transform:var(--xgh);overscroll-behavior:contain;scrollbar-gutter:stable;pointer-events:auto;container-type:size;container-name:items-list} .xeg_gmRWyH::-webkit-scrollbar{width:var(--xsw)} .xeg_gmRWyH::-webkit-scrollbar-track{background:transparent} .xeg_gmRWyH::-webkit-scrollbar-thumb{background:var(--xcn3);border-radius:var( --xsbr );transition:background-color var(--xdn) var(--xe-s)} .xeg_gmRWyH::-webkit-scrollbar-thumb:hover{background:var(--xcn4)} .xeg_X9gZRg.xeg_9abgzR .xeg_meO3Up{pointer-events:none;opacity:0;transition:opacity var(--xdf) var(--xeo)} .xeg_X9gZRg.xeg_9abgzR [data-xeg-role='items-list'], .xeg_X9gZRg.xeg_9abgzR .xeg_gmRWyH{pointer-events:auto} .xeg_X9gZRg.xeg_yhK-Ds{justify-content:center;align-items:center} .xeg_EfVayF{position:relative;margin-bottom:var(--xs-m, 1rem);border-radius:var(--xr-l, .5rem);transition:var(--xten);contain:layout style;transform:var(--xgh)} .xeg_LxHLC8{position:relative;z-index:1} .xeg_sfF005{height:calc(100vh - var(--xeg-toolbar-height, 3.75rem));min-height:50vh;pointer-events:none;user-select:none;flex-shrink:0;background:transparent;opacity:0;contain:strict;content-visibility:auto} .xeg_X9gZRg:has(.xeg_LxHLC8){--has-active-item:1} .xeg_X9gZRg:has(.xeg_meO3Up:hover){--toolbar-interaction:1} .xeg_gC-mQz{position:fixed;top:0;left:0;right:0;height:var(--xhzh);z-index:var(--xz-th);background:transparent;pointer-events:auto} .xeg_gC-mQz:hover{z-index:var(--xz-th);background:var(--xth-bg, transparent)} .xeg_X9gZRg.xeg_Canm64:not([data-settings-expanded='true']) .xeg_gC-mQz, .xeg_X9gZRg:has(.xeg_meO3Up:hover):not([data-settings-expanded='true']) .xeg_gC-mQz{pointer-events:none} .xeg_X9gZRg.xeg_Canm64 .xeg_meO3Up, .xeg_X9gZRg:has(.xeg_gC-mQz:hover) .xeg_meO3Up{--toolbar-opacity:1;--toolbar-visibility:visible;--toolbar-pointer-events:auto;--toolbar-transform-y:0} @supports not (selector(:has(*))){.xeg_meO3Up:hover ~ .xeg_gC-mQz{pointer-events:none} .xeg_gC-mQz:hover + .xeg_meO3Up, .xeg_gC-mQz:hover ~ .xeg_meO3Up{--toolbar-opacity:1;--toolbar-visibility:visible;--toolbar-pointer-events:auto;--toolbar-transform-y:0} .xeg_X9gZRg:hover .xeg_meO3Up{--toolbar-opacity:1;--toolbar-visibility:visible;--toolbar-pointer-events:auto;--toolbar-transform-y:0}} .xeg_meO3Up [class*='galleryToolbar'], .xeg_meO3Up [data-testid*='toolbar']{opacity:var(--toolbar-opacity, 0);visibility:var(--toolbar-visibility, hidden);display:flex;pointer-events:var(--toolbar-pointer-events, none)} .xeg_meO3Up button, .xeg_meO3Up [role='button'], .xeg_meO3Up .xeg_e06XPV{pointer-events:auto;position:relative;z-index:10} .xeg_fwsrVX{text-align:center;color:var(--xct-s);max-inline-size:min(25rem, 90vw);padding:clamp(1.875rem, 5vw, 2.5rem)} .xeg_fwsrVX h3{margin:0 0 clamp(.75rem, 2vw, 1rem);font-size:clamp(1.25rem, 4vw, 1.5rem);font-weight:600;color:var(--xct-p);line-height:1.2} .xeg_fwsrVX p{margin:0;font-size:clamp(.875rem, 2.5vw, 1rem);line-height:1.5;color:var(--xct-t)} @container gallery-container (max-width:48rem){.xeg_gmRWyH{padding:var(--xeg-spacing-mobile);gap:var(--xeg-spacing-mobile)} .xeg_meO3Up{padding-block-end:var(--xeg-spacing-mobile)}} @container gallery-container (max-width:30rem){.xeg_gmRWyH{padding:var(--xeg-spacing-compact);gap:var(--xeg-spacing-compact)}} @media (width <= 760.5rem){.xeg_gmRWyH{padding:var(--xeg-spacing-mobile);gap:var(--xeg-spacing-mobile)} .xeg_meO3Up{padding-block-end:var(--xeg-spacing-mobile)}} @media (width <= 45rem){.xeg_gmRWyH{padding:var(--xeg-spacing-compact);gap:var(--xeg-spacing-compact)}} @media (prefers-reduced-motion:reduce){.xeg_gmRWyH{scroll-behavior:auto;will-change:auto;transform:none}} @media (prefers-reduced-motion:reduce){.xeg_meO3Up:hover, .xeg_meO3Up:focus-within{transform:none}} .xeg_X9gZRg [class*='galleryToolbar']:hover{--toolbar-opacity:1;--toolbar-pointer-events:auto} .xeg_huYoSL{position:relative;margin-bottom:var(--xs-m);margin-inline:auto;border-radius:var(--xr-l);overflow:visible;transition:var(--xti);cursor:pointer;border:.0625rem solid var(--xcb-p);background:var(--xcbg-s);padding:var(--xs-s);width:fit-content;max-width:100%;text-align:center;display:flex;flex-direction:column;align-items:center;pointer-events:auto;transform:var(--xgh);will-change:transform;contain:layout style} .xeg_huYoSL[data-fit-mode='original']{max-width:none;flex-shrink:0;width:max-content;align-self:center} .xeg_huYoSL:hover{transform:var(--xhl);background:var(--xc-se);border-color:var(--xbe)} .xeg_huYoSL:focus-visible{border-color:var(--xfic, var(--xcb-p))} .xeg_huYoSL.xeg_xm-1cY{border-color:var(--xbe, var(--xcb-s));transition:var(--xti)} .xeg_huYoSL.xeg_xm-1cY:focus-visible{border-color:var(--xfic, var(--xcb-s))} .xeg_huYoSL.xeg_luqi-C{border-color:var(--xfic, var(--xcb-p));transition:var(--xti)} .xeg_8-c8dL{position:relative;background:var(--xcbg-s);width:fit-content;max-width:100%;margin:0 auto;display:flex;justify-content:center;align-items:center} .xeg_8-c8dL:has(.xeg_FWlk5q.xeg_yYtGJp), .xeg_8-c8dL:has(.xeg_GUevPQ.xeg_yYtGJp){width:auto;max-width:none} .xeg_huYoSL[data-media-loaded='false'] .xeg_8-c8dL{min-height:var(--xs-3, 3rem);aspect-ratio:var(--xad, 4 / 3)} .xeg_lhkEW2{position:absolute;top:0;left:0;right:0;bottom:0;display:flex;align-items:center;justify-content:center;background:var(--xsk-b);min-height:var(--xs-3, 3rem)} .xeg_6YYDYR{--xsp-s:var(--xs-l);--xsp-bw:.125rem;--xsp-tc:var(--xcb-p);--xsp-ic:var(--xc-p)} .xeg_FWlk5q, .xeg_GUevPQ{display:block;border-radius:var(--xr-m);object-fit:contain;pointer-events:auto;user-select:none;-webkit-user-drag:none;transform:var(--xgh);will-change:opacity;transition:opacity var(--xdn) var(--xeo)}:is(.xeg_FWlk5q, .xeg_GUevPQ).xeg_8Z3Su4{opacity:0}:is(.xeg_FWlk5q, .xeg_GUevPQ).xeg_y9iPua{opacity:1} .xeg_GUevPQ{inline-size:100%;overflow:clip}:is(.xeg_FWlk5q, .xeg_GUevPQ).xeg_yYtGJp{inline-size:auto;block-size:auto;max-inline-size:none;max-block-size:none;object-fit:none}:is(.xeg_FWlk5q, .xeg_GUevPQ).xeg_Uc0oUi{inline-size:auto;block-size:auto;max-inline-size:100%;max-block-size:none;object-fit:scale-down}:is(.xeg_FWlk5q, .xeg_GUevPQ).xeg_M9Z6MG{inline-size:auto;block-size:auto;max-inline-size:calc(100vw - var(--xs-l, 1.5rem) * 2);max-block-size:var(--xvhc, 90vh);object-fit:scale-down}:is(.xeg_FWlk5q, .xeg_GUevPQ).xeg_-Mlrhi{inline-size:auto;block-size:auto;max-inline-size:100%;max-block-size:var(--xvhc, 90vh);object-fit:contain} .xeg_qb9K3H{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:var(--xs-3, 3rem) var(--xs-l);background:var(--xcbg-s);color:var(--xct-s);min-height:var(--xs-3, 3rem)} .xeg_Wno7Ud{font-size:var(--xfs-2);margin-bottom:var(--xs-s)} .xeg_8-wisg{font-size:var(--xfs-s);text-align:center} .xeg_PjdGbm{position:absolute;top:var(--xs-s);right:var(--xs-s);display:flex;gap:var(--xs-s);opacity:0;transition:var(--xto)} .xeg_huYoSL:hover .xeg_PjdGbm{opacity:1} .xeg_7a-5Mj{display:flex;align-items:center;justify-content:center;min-width:var(--xs-l);height:var(--xs-l);background:var(--xc-om);color:var(--xct-i);font-size:var(--xeg-font-size-xs);font-weight:var(--xfw-s);border-radius:var(--xr-l);padding:0 var(--xs-s)} .xeg_3r-xCG{padding:var(--xs-s);background:var(--xcbg-p)} .xeg_TyK4eD{font-size:var(--xfs-s);font-weight:var(--xfw-m);color:var(--xct-p);margin-bottom:var(--xs-xs);overflow:clip;text-overflow:ellipsis;white-space:nowrap} .xeg_-W7qaz{font-size:var(--xeg-font-size-xs);color:var(--xct-s)} .xeg_GswePL{position:absolute;top:0;left:0;right:0;bottom:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:var(--color-error-bg);color:var(--color-error);min-height:var(--xs-3)} .xeg_huYoSL.xeg_y9iPua .xeg_FWlk5q{opacity:1} .xeg_huYoSL.xeg_GswePL{border:.0625rem solid var(--xc-e)} .xeg_huYoSL[data-fit-mode='original'] .xeg_FWlk5q, .xeg_huYoSL[data-fit-mode='original'] .xeg_GUevPQ{cursor:pointer} .xeg_huYoSL[data-fit-mode='original'] .xeg_FWlk5q:active, .xeg_huYoSL[data-fit-mode='original'] .xeg_GUevPQ:active{cursor:pointer} .xeg_huYoSL[data-media-loaded='false'][data-fit-mode='original']{inline-size:min(var(--xgi-w, 100%), 100%);max-inline-size:min(var(--xgi-w, 100%), 100%);max-block-size:min( var(--xgi-h, var(--xs-5)), var(--xvhc, 90vh) )} .xeg_huYoSL[data-media-loaded='false'][data-fit-mode='original'] .xeg_FWlk5q, .xeg_huYoSL[data-media-loaded='false'][data-fit-mode='original'] .xeg_GUevPQ{inline-size:min(var(--xgi-w, 100%), 100%);max-inline-size:min(var(--xgi-w, 100%), 100%);max-block-size:min( var(--xgi-h, var(--xs-5)), var(--xvhc, 90vh) )} .xeg_huYoSL[data-media-loaded='false'][data-has-intrinsic-size='true'][data-fit-mode='fitHeight'], .xeg_huYoSL[data-media-loaded='false'][data-has-intrinsic-size='true'][data-fit-mode='fitContainer']{--xgf-ht:min( var(--xgi-h, var(--xs-5)), var(--xvhc, 90vh) );max-block-size:var(--xgf-ht);inline-size:min( 100%, calc(var(--xgf-ht) * var(--xgi-r, 1)) );max-inline-size:min( 100%, calc(var(--xgf-ht) * var(--xgi-r, 1)) )} .xeg_huYoSL[data-media-loaded='false'][data-has-intrinsic-size='true'][data-fit-mode='fitHeight'] .xeg_FWlk5q, .xeg_huYoSL[data-media-loaded='false'][data-has-intrinsic-size='true'][data-fit-mode='fitHeight'] .xeg_GUevPQ, .xeg_huYoSL[data-media-loaded='false'][data-has-intrinsic-size='true'][data-fit-mode='fitContainer'] .xeg_FWlk5q, .xeg_huYoSL[data-media-loaded='false'][data-has-intrinsic-size='true'][data-fit-mode='fitContainer'] .xeg_GUevPQ{max-block-size:var(--xgf-ht);max-inline-size:min( 100%, calc(var(--xgf-ht) * var(--xgi-r, 1)) )} .xeg_hV2D27{pointer-events:none} @media (prefers-reduced-motion:reduce){.xeg_huYoSL{will-change:auto} .xeg_huYoSL:hover{transform:none}} @layer xeg.features{:where(.xeg-surface, .xeg-glass-surface, .glass-surface){background:var(--xsu-b);border:var(--border-width-thin) solid var(--xsu-br);border-radius:var(--xr-2);isolation:isolate;transition:opacity var(--xdn) var(--xe-s)}:where(.xeg-surface, .xeg-glass-surface, .glass-surface):hover{background:var(--xsu-bh, var(--xsu-b))} .xeg-gallery-renderer[data-renderer='gallery']{display:block;width:0;height:0;overflow:visible} .xeg-gallery-overlay{display:flex;align-items:center;justify-content:center;position:fixed;inset:0;z-index:var(--xz-g, 10000);background:var(--xg-b);opacity:1;transition:opacity var(--xdn) var(--xe-s);pointer-events:auto} .xeg-gallery-container{position:relative;width:100%;height:100%;max-width:100vw;max-height:100vh;display:flex;flex-direction:column;overflow-y:auto;overflow-x:hidden}} @layer xeg.tokens, xeg.base, xeg.utilities, xeg.components, xeg.features, xeg.overrides;@layer xeg.tokens{:where(:root, .xeg-theme-scope){--color-base-white:oklch(1 0 0);--color-base-black:oklch(0 0 0);--color-gray-50:oklch(.97 .002 206.2);--color-gray-100:oklch(.943 .006 206.2);--color-gray-200:oklch(.896 .006 206.2);--color-gray-300:oklch(.796 .006 206.2);--color-gray-400:oklch(.696 .006 286.3);--color-gray-500:oklch(.598 .006 286.3);--color-gray-600:oklch(.488 .006 286.3);--color-gray-700:oklch(.378 .005 286.3);--color-gray-800:oklch( .306 .005 282 );--color-gray-900:oklch(.234 .006 277.8);--space-xs:.25rem;--space-sm:.5rem;--space-md:1rem;--space-lg:1.5rem;--space-xl:2rem;--space-2xl:3rem;--radius-xs:.125em;--radius-sm:.25em;--radius-md:.375em;--radius-lg:.5em;--radius-xl:.75em;--radius-2xl:1em;--radius-pill:1.75em;--radius-full:50%;--font-family-primary:'TwitterChirp', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;--font-size-2xs:.6875rem;--font-size-xs:.75rem;--font-size-sm:.875rem;--font-size-base:.9375rem;--font-size-md:1rem;--font-size-lg:1.0625rem;--font-size-xl:1.125rem;--font-size-2xl:1.25rem;--font-size-3xl:1.5rem;--font-weight-normal:400;--font-weight-medium:500;--font-weight-semibold:600;--font-weight-bold:700;--duration-fast:150ms;--duration-normal:250ms;--duration-slow:300ms;--border-width-thin:.0625rem;--border-width-sm:.125rem;--opacity-overlay-backdrop:.85;--line-height-normal:1.5}} @layer xeg.tokens{:where(:root, .xeg-theme-scope){--color-bg-primary:var(--color-base-white);--color-bg-secondary:var(--color-gray-50);--color-bg-surface:var(--color-base-white);--color-bg-elevated:var(--color-base-white);--xbgt:var(--color-bg-surface);--xt-b:var(--xcb-p);--xt-bg:var(--xbgt);--xt-s:var(--xbgt);--xtp-s:var(--xt-s);--xcbg-s:var(--color-bg-secondary);--xg-bl:var(--color-bg-primary);--xg-bd:var(--color-gray-900);--xg-b:var(--xg-bl);--xc-bg:oklch(95% 0 0deg);--color-text-primary:var(--color-base-black);--color-text-secondary:var( --color-gray-600 );--color-text-muted:var(--color-gray-500);--color-text-inverse:var(--color-base-white);--color-text-error:var(--color-base-white);--color-text-on-overlay:var(--color-base-white);--color-border-default:var(--color-gray-200);--color-border-muted:var(--color-gray-100);--color-border-subtle:var(--color-gray-100);--color-border-emphasis:var(--color-gray-500);--color-border-hover:var(--color-gray-300);--xcb-p:var(--color-border-default);--xcb-h:var(--color-border-hover);--xcb-s:var(--color-border-emphasis);--xgbs:var(--color-border-emphasis);--xb-bg:var(--color-bg-surface);--xb-b:var(--color-border-default);--xb-t:var(--color-text-primary);--xb-bgh:var(--color-bg-secondary);--xb-bh:var(--color-border-hover);--xbb:var(--xcb-p);--xm-bl:var(--color-bg-elevated);--xm-brl:var(--color-border-default);--xm-bd:var(--color-gray-800);--xm-brd:var(--color-border-emphasis);--xm-b:var(--xm-bl);--xm-br:var(--xm-brl);--xtt-c:var(--xct-p);--xtt-m:var(--xct-s);--xte-b:color-mix( in oklch, var(--xbgt) 80%, var(--color-base-white) 20% );--xte-bs:color-mix( in oklch, var(--xbgt) 65%, var(--color-base-white) 35% );--xte-br:color-mix( in oklch, var(--xt-b) 85%, var(--color-base-white) 15% );--xtp-pt:color-mix( in oklch, var(--xte-b) 60%, var(--xte-br) 40% );--xts-t:color-mix( in oklch, var(--xte-b) 50%, var(--color-base-white) 50% );--xts-th:color-mix( in oklch, var(--xte-br) 80%, var(--color-base-white) 20% );--color-success:var(--color-gray-800);--color-success-hover:var(--color-gray-900);--color-success-bg:var(--color-gray-100);--color-error:var(--color-gray-800);--color-error-hover:var(--color-gray-900);--color-error-bg:var(--color-gray-100);--color-warning:var(--color-gray-700);--color-warning-bg:var(--color-gray-50);--color-info:var(--color-gray-700);--color-info-bg:var(--color-gray-50);--xc-e:var(--color-error);--xc-eh:var(--color-error-hover);--xc-sh:var(--color-success-hover);--color-primary:var(--color-gray-900);--color-primary-hover:var(--color-gray-700);--color-primary-active:var(--color-gray-800);--xc-p:var(--color-primary);--xc-s:var(--color-success);--xcn1:var(--color-gray-100);--xcn2:var(--color-gray-200);--xcn3:var(--color-gray-300);--xcn4:var(--color-gray-400);--xcn5:var(--color-gray-500);--xct-p:var(--color-text-primary);--xct-s:var(--color-text-secondary);--xct-t:var(--color-text-muted);--xct-i:var(--color-text-inverse);--xcbg-p:var(--color-bg-primary);--color-overlay-medium:var(--color-gray-300);--color-overlay-backdrop:var(--color-gray-900);--xc-om:var(--color-overlay-medium);--size-button-md:2.5em;--size-icon-md:1.25em;--xsb-m:var(--size-button-md);--transition-fast:var(--duration-fast) cubic-bezier(.4, 0, .2, 1);--transition-normal:var(--duration-normal) cubic-bezier(.4, 0, .2, 1);--transition-slow:var(--duration-slow) cubic-bezier(.4, 0, .2, 1);--shadow-sm:none;--shadow-md:none;--shadow-gallery-image:none;--shadow-gallery-counter:none;--shadow-gallery-nav:none;--shadow-gallery-nav-hover:none;--shadow-thumbnail:none;--shadow-thumbnail-hover:none;--xeg-shadow-xs:none;--xeg-shadow-sm:none;--xeg-shadow-md:none;--xeg-shadow-lg:none;--xfic:var(--xcb-p);--xfs-s:.875rem;--xfs-b:1rem;--xfs-l:1.125rem;--xfw-m:500;--xfs-2:var(--font-size-2xl);--xfw-s:var(--font-weight-semibold);--xdf:var(--duration-fast);--xds:var(--duration-slow);--xdn:var(--duration-normal);--xdt:var(--duration-normal);--xto:opacity var(--xdn) var(--xeo);--xsu-b:var(--color-bg-surface);--xsu-br:var(--color-border-default);--xsu-bh:var(--color-bg-secondary);--xc-se:var(--color-bg-elevated);--xsk-b:var(--color-bg-secondary);--xbe:var(--color-border-emphasis);--xz-sb:2147483600;--xz-g:2147483600;--xz-go:2147483608;--xz-gt:2147483612;--xz-th:2147483618;--xz-t:2147483620;--xz-tp:2147483622;--xz-ta:2147483624;--xz-o:2147483630;--xz-mb:2147483640;--xz-m:2147483645;--xz-mf:2147483646;--xz-tt:2147483647;--xlr:var(--xz-g);--xeo:cubic-bezier(.4, 0, .2, 1);--xei:cubic-bezier(.4, 0, 1, 1);--xel:linear;--xlh:var(--line-height-normal, 1.5);--xd:var(--duration-normal);--xb-l:-.0625rem;--xo-d:.5;--xhl:translateY(-.125rem);--xr-s:var(--radius-sm);--xr-m:var(--radius-md);--xr-l:var(--radius-lg);--xr-xl:var(--radius-xl);--xr-2:var(--radius-2xl);--xr-f:var(--radius-full)}:where(:root, .xeg-theme-scope)[data-theme='light']{--color-bg-primary:var(--color-base-white);--color-text-primary:var(--color-base-black);--color-text-secondary:var(--color-gray-600);--color-glass-bg:var(--color-bg-surface);--color-glass-border:var(--color-border-default);--xg-b:var(--xg-bl);--xm-b:var(--xm-bl);--xm-br:var(--xm-brl);--xcb-p:var(--color-border-default);--xse-g:var(--space-md);--xse-p:var(--space-md);--xse-cg:var(--space-sm);--xse-lf:var(--font-size-sm);--xse-lw:var(--font-weight-medium);--xse-sp:var(--space-sm);--xse-sf:var(--font-size-sm);--xad:4 / 3;--xc-bg:oklch(95% 0 0deg)}:where(:root, .xeg-theme-scope)[data-theme='dark']{--color-bg-primary:var(--color-gray-900);--color-bg-surface:var(--color-gray-900);--color-bg-elevated:var(--color-gray-700);--color-text-primary:var(--color-base-white);--color-text-secondary:var(--color-gray-400);--color-glass-bg:var(--color-gray-900);--color-glass-border:var(--color-gray-600);--xbgt:var(--color-gray-800);--xcb-p:var(--color-gray-600);--xt-b:var(--color-gray-600);--xcbg-s:var(--color-gray-800);--xg-b:var(--xg-bd);--xb-bg:var(--color-gray-800);--xb-b:var(--color-gray-600);--xb-t:var(--color-text-primary);--xb-bgh:var(--color-gray-700);--xb-bh:var(--color-gray-600);--xm-b:var(--xm-bd);--xm-br:var(--xm-brd);--xtt-c:var(--color-text-primary);--xtt-m:var(--color-gray-300);--xte-b:color-mix( in oklch, var(--xbgt) 85%, var(--color-base-black) 15% );--xte-bs:color-mix( in oklch, var(--xbgt) 70%, var(--color-base-black) 30% );--xte-br:color-mix( in oklch, var(--xt-b) 75%, var(--color-base-black) 25% );--xtp-pt:color-mix( in oklch, var(--xt-b) 65%, var(--xbgt) 35% );--xts-t:color-mix( in oklch, var(--xte-b) 80%, var(--color-base-black) 20% );--xts-th:color-mix( in oklch, var(--xte-br) 85%, var(--color-base-black) 15% );--xc-bg:oklch(20% 0 0deg);--color-primary:var(--color-gray-100);--color-primary-hover:var(--color-gray-200);--color-primary-active:var(--color-gray-300);--xsu-b:var(--color-gray-900);--xsu-br:var(--color-gray-600);--xsu-bh:var(--color-gray-800)} @media (prefers-color-scheme:dark){:where(:root, .xeg-theme-scope):not([data-theme]){--color-bg-primary:var(--color-gray-900);--color-bg-surface:var(--color-gray-900);--color-bg-elevated:var(--color-gray-700);--color-text-primary:var(--color-base-white);--color-text-secondary:var(--color-gray-400);--color-glass-bg:var(--color-gray-900);--color-glass-border:var(--color-gray-600);--xbgt:var(--color-gray-800);--xcb-p:var(--color-gray-600);--xt-b:var(--color-gray-600);--xcbg-s:var(--color-gray-800);--xg-b:var(--xg-bd);--xb-bg:var(--color-gray-800);--xb-b:var(--color-gray-600);--xb-t:var(--color-text-primary);--xb-bgh:var(--color-gray-700);--xb-bh:var(--color-gray-600);--xm-b:var(--xm-bd);--xm-br:var(--xm-brd);--xtt-c:var(--color-text-primary);--xtt-m:var(--color-gray-300);--xte-b:color-mix( in oklch, var(--xbgt) 85%, var(--color-base-black) 15% );--xte-bs:color-mix( in oklch, var(--xbgt) 70%, var(--color-base-black) 30% );--xte-br:color-mix( in oklch, var(--xt-b) 75%, var(--color-base-black) 25% );--xtp-pt:color-mix( in oklch, var(--xt-b) 65%, var(--xbgt) 35% );--xts-t:color-mix( in oklch, var(--xte-b) 80%, var(--color-base-black) 20% );--xts-th:color-mix( in oklch, var(--xte-br) 85%, var(--color-base-black) 15% );--xc-bg:oklch(20% 0 0deg);--color-primary:var(--color-gray-100);--color-primary-hover:var(--color-gray-200);--color-primary-active:var(--color-gray-300);--xsu-b:var(--color-gray-900);--xsu-br:var(--color-gray-600);--xsu-bh:var(--color-gray-800)}} @media (prefers-reduced-motion:reduce){:where(:root, .xeg-theme-scope){--xd:0ms;--xdf:0ms;--xds:0ms;--transition-fast:0ms;--transition-normal:0ms;--transition-slow:0ms;--xtsn:none;--xts:none;--xten:none;--xtef:none;--xti:none;--xtwn:none;--animation-fade-in:none;--animation-fade-out:none;--animation-slide-in:none;--animation-slide-out:none;--animation-toolbar-show:none;--animation-toolbar-hide:none}}:where(:root, .xeg-theme-scope){--xeg-space-8:var(--space-sm);--xeg-space-12:.75rem;--xeg-space-16:var(--space-md);--xse-g:var(--space-md);--xse-p:var(--space-md);--xse-cg:var(--space-sm);--xse-lf:var(--font-size-sm);--xse-lw:var( --font-weight-bold );--xse-sf:var(--font-size-sm);--xse-sp:var(--space-sm) var(--space-md);--xtp-sh:var(--xeg-shadow-xs);--xeg-text-counter:var(--xct-p);--xeg-counter-text:var(--xeg-text-counter);--xeg-text-button:var(--xct-p);--xeg-text-button-navigation:var(--xct-p);--xeg-shadow-toolbar:var(--xeg-shadow-md);--xt-sh:var(--xeg-shadow-toolbar);--xeg-toolbar-wrapper-gradient-start:var(--xbgt);--xeg-toolbar-wrapper-gradient-mid:color-mix( in oklab, var(--xbgt) 85%, var(--color-gray-900) 15% );--xeg-toolbar-wrapper-gradient-end:var(--xbgt);--xeg-toolbar-wrapper-border:none;--xeg-toolbar-wrapper-radius:0;--xeg-toolbar-wrapper-margin:0;--xth-bg:transparent;--xeg-neutral-100:var(--xcn1);--xeg-neutral-200:var(--xcn2);--xeg-neutral-300:var(--xcn3);--xeg-neutral-400:var(--xcn4);--xeg-comp-modal-backdrop:var(--color-overlay-backdrop);--xm-bl:var(--color-bg-elevated);--xm-brl:var(--color-border-default);--xm-b:var(--xm-bl);--xm-br:var(--xm-brl)}} @layer xeg.tokens{:where(:root, .xeg-theme-scope){--xtp-t:height var(--xdn) var(--xe-s), opacity var(--xdf) var(--xe-s);--xtp-h:0;--xtp-mh:17.5rem;--xsw:.5rem;--xhzh:7.5rem;--xsp-sd:1rem;--xsp-bw:.125rem;--xsp-tc:color-mix(in oklch, var(--xcn4) 60%, transparent);--xsp-ic:var(--xc-p, currentColor);--xsp-d:var(--xdn);--xsp-e:var(--xel);--xtsn:background-color var(--xdn) var(--xe-s), border-color var( --xdn ) var(--xe-s), color var(--xdn) var(--xe-s);--xts:background-color var(--xdf) var(--xe-s), border-color var( --xdf ) var(--xe-s), color var(--xdf) var(--xe-s);--xten:transform var(--xdn) var(--xe-s), opacity var( --xdn ) var(--xe-s);--xtef:transform var(--xdf) var(--xe-s), opacity var(--xdf) var(--xe-s);--xti:background-color var(--xdf) var(--xeo), border-color var( --xdf ) var(--xeo), color var(--xdf) var(--xeo), transform var(--xdf) var(--xeo);--xtwn:width var(--xdn) var(--xe-s);--xisw:.125rem;--xis:var(--size-icon-md);--xs-xs:var(--space-xs);--xs-s:var(--space-sm);--xs-m:var(--space-md);--xs-l:var(--space-lg);--xs-xl:var(--space-xl);--xs-2:var(--space-2xl);--xs-3:3rem;--xs-5:5rem;--xvhc:90vh} @media (prefers-reduced-transparency:reduce){:where(:root, .xeg-theme-scope){--xsu-b:var(--color-bg-primary)}}} @layer xeg.components{.xeg-surface{background:var(--xsu-b);border:.0625rem solid var(--xsu-br);border-radius:var(--xr-l)} .xeg-anim-fade-in{animation:xeg-fade-in var(--xd) var(--xeo)} .xeg-anim-fade-out{animation:xeg-fade-out var(--xdf) var(--xei)} .xeg-spinner{display:inline-block;width:var(--xsp-s, var(--xsp-sd));height:var(--xsp-s, var(--xsp-sd));border-radius:var(--xr-f);border:var(--xsp-bw) solid var(--xsp-tc);border-top-color:var(--xsp-ic);animation:xeg-spin var(--xsp-d) var(--xsp-e) infinite;box-sizing:border-box} @media (prefers-reduced-motion:reduce){.xeg-spinner{animation:none}}} @layer xeg.components{@keyframes xeg-fade-in{from{opacity:0} to{opacity:1}} @keyframes xeg-fade-out{from{opacity:1} to{opacity:0}} @keyframes xeg-spin{from{transform:rotate(0deg)} to{transform:rotate(360deg)}} @keyframes xeg-slide-out-top{from{opacity:1;transform:translateY(0) scale(1)} to{opacity:0;transform:translateY(-1.25rem) scale(.95)}}} @layer xeg.tokens{:root{--xe-d:cubic-bezier(0, 0, .2, 1);--xe-a:cubic-bezier(.4, 0, 1, 1);--xe-s:cubic-bezier(.4, 0, .2, 1);--xe-e:var(--xe-d);--xgh:translate3d(0, 0, 0);--xbv:hidden}} @layer xeg.base{:where(.xeg-gallery-root, .xeg-gallery-root *),:where(.xeg-gallery-root *::before, .xeg-gallery-root *::after){box-sizing:border-box;margin:0;padding:0} .xeg-gallery-root{scroll-behavior:smooth;font-family:var( --font-family-primary, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif );line-height:var(--xlh, 1.5);color:var(--xct-p, var(--color-text-primary, currentColor));background:var(--xc-bg, transparent);-webkit-text-size-adjust:100%;-moz-text-size-adjust:100%;text-size-adjust:100%;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale} .xeg-gallery-root button{border:none;background:none;cursor:pointer;font:inherit;color:inherit} .xeg-gallery-root a{color:inherit;text-decoration:none} .xeg-gallery-root img{max-width:100%;height:auto;display:block} .xeg-gallery-root ul, .xeg-gallery-root ol{list-style:none} .xeg-gallery-root input, .xeg-gallery-root textarea, .xeg-gallery-root select{font:inherit;color:inherit;background:transparent} .xeg-gallery-root::-webkit-scrollbar{width:var(--xsw, .5rem);height:var(--xsw, .5rem)} .xeg-gallery-root::-webkit-scrollbar-track{background:transparent} .xeg-gallery-root::-webkit-scrollbar-thumb{background:var(--xcn4, oklch(60% 0 0deg));border-radius:var(--xr-s, .25em)} .xeg-gallery-root::-webkit-scrollbar-thumb:hover{background:var(--xcn5, oklch(50% 0 0deg))}} @layer xeg.utilities{.xeg-row-center{display:flex;align-items:center} .xeg-inline-center{display:inline-flex;align-items:center;justify-content:center} .xeg-gap-sm{gap:var(--xs-s)}} @layer xeg.utilities{@keyframes xeg-scale-in{from{opacity:0;transform:scale(.8) var(--xgh)} to{opacity:1;transform:scale(1) var(--xgh)}} .xeg-fade-in{animation:xeg-fade-in var(--xdn) var(--xe-e);animation-fill-mode:both} .xeg-scale-in{animation:xeg-scale-in var(--xdn) var(--xe-e);animation-fill-mode:both;backface-visibility:var(--xbv)} @media (prefers-reduced-motion:reduce){.xeg-fade-in, .xeg-scale-in{animation:none}}} @layer xeg.features{.xeg-gallery-root{all:unset;box-sizing:border-box;font-family:var( --font-family-primary, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif );font-size:var(--font-size-base, .9375rem);line-height:var(--xlh, 1.5);color:var(--xct-p, currentColor);position:fixed;inset:0;width:100vw;height:100vh;display:block;z-index:var(--xlr, 10000);isolation:isolate;contain:style paint;background:var(--xg-b, var(--color-bg-primary));pointer-events:auto;user-select:none;overscroll-behavior:contain;transform:translateZ(0);will-change:opacity, transform} .xeg-gallery-root *, .xeg-gallery-root *::before, .xeg-gallery-root *::after{box-sizing:border-box}} .xeg_EeShbY{display:flex;flex-direction:column;gap:var(--xse-g);padding:var(--xse-p)} .xeg_nm9B3P{gap:var(--space-sm)} .xeg_PI5CjL{display:flex;flex-direction:column;gap:var(--xse-cg)} .xeg_VUTt8w{gap:var(--space-xs)} .xeg_vhT3QS{font-size:var(--xse-lf);font-weight:var(--xse-lw);color:var(--xct-p)} .xeg_Y62M5l{font-size:var(--font-size-xs);color:var(--xct-s);letter-spacing:.04em;text-transform:uppercase} .xeg_jpiS5y{width:100%;padding:var(--xse-sp);font-size:var(--xse-sf);color:var(--xct-p);background-color:var(--xtp-s, var(--xt-s));border:var(--border-width-thin) solid var(--xt-b);border-radius:var(--xr-m);cursor:pointer;line-height:1.375;min-height:2.5em;transform:none;overflow:visible;transition:border-color var(--xdf) var(--xe-s), background-color var(--xdf) var(--xe-s)} .xeg_jpiS5y:hover{border-color:var(--xcb-h);background-color:var(--xtp-s, var(--xt-s))} .xeg_jpiS5y:focus, .xeg_jpiS5y:focus-visible{border-color:var(--xfic, var(--xcb-h))} .xeg_jpiS5y option{padding:.5em .75em;line-height:1.5}";

  var existingStyle = document.getElementById('xeg-injected-styles');
  if (existingStyle) {
    existingStyle.textContent = css;
    return;
  }

  var style = document.createElement('style');
  style.id = 'xeg-injected-styles';
  style.setAttribute('data-xeg-version', 'prod');
  style.textContent = css;

  (document.head || document.documentElement).appendChild(style);
})();
var XcomEnhancedGallery = (function (exports) {
  'use strict';

  const DEFAULT_LOG_LEVEL = "warn";

  const createNoOpLogger = () => {
    const noop = () => {
    };
    return { info: noop, warn: noop, error: noop, debug: noop, trace: noop };
  };
  let createLoggerImpl;
  {
    createLoggerImpl = () => createNoOpLogger();
  }
  function createLogger(config = {}) {
    return createLoggerImpl(config);
  }
  const logger$2 = createLogger({
    level: DEFAULT_LOG_LEVEL
  });

  function wireGlobalEvents(onBeforeUnload) {
    const hasWindow = typeof window !== "undefined" && Boolean(window.addEventListener);
    if (!hasWindow) {
      return () => {
      };
    }
    let disposed = false;
    const invokeOnce = () => {
      if (disposed) {
        return;
      }
      disposed = true;
      onBeforeUnload();
    };
    const handler = () => {
      invokeOnce();
    };
    window.addEventListener("pagehide", handler, { once: true, passive: true });
    return () => {
      if (disposed) {
        return;
      }
      disposed = true;
      window.removeEventListener("pagehide", handler);
    };
  }

  function createSingleton(factory) {
    let instance = null;
    return {
      get() {
        if (instance === null) {
          instance = factory();
        }
        return instance;
      },
      reset() {
        instance = null;
      }
    };
  }

  function isDisposable(value) {
    return value !== null && typeof value === "object" && "destroy" in value && typeof value.destroy === "function";
  }
  class CoreService {
    static singleton = createSingleton(() => new CoreService());
    services = /* @__PURE__ */ new Map();
    constructor() {
    }
    static getInstance() {
      return CoreService.singleton.get();
    }
    /** @internal Test helper */
    static resetForTests() {
      const instance = CoreService.singleton.get();
      instance.reset();
      CoreService.singleton.reset();
    }
    register(key, instance) {
      this.services.set(key, instance);
    }
    get(key) {
      if (this.services.has(key)) {
        return this.services.get(key);
      }
      throw new Error(`Service not found: ${key}`);
    }
    tryGet(key) {
      if (this.services.has(key)) {
        return this.services.get(key);
      }
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
          if (isDisposable(service)) {
            service.destroy();
          }
        } catch (e) {
          logger$2.error("Service cleanup failed", e);
        }
      });
      this.services.clear();
    }
    reset() {
      this.cleanup();
    }
  }
  CoreService.getInstance();

  var serviceManager = {
    __proto__: null,
    CoreService: CoreService
  };

  const LANGUAGE_CODES = ["en", "ko", "ja"];
  const LANGUAGE_CODE_LOOKUP = new Set(LANGUAGE_CODES);
  function isBaseLanguageCode(value) {
    return value != null && LANGUAGE_CODE_LOOKUP.has(value);
  }

  const en = {
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
      gallery: {
        sectionTitle: "Gallery"
      }
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
        single: {
          error: {
            title: "Download Failed",
            body: "Could not download the file: {error}"
          }
        },
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

  const TRANSLATION_REGISTRY = Object.freeze({
    en
  });
  const DEFAULT_LANGUAGE = "en";
  const LAZY_LANGUAGE_LOADERS = {
    ko: async () => {
      const { ko } = await Promise.resolve().then(function () { return ko$1; });
      return ko;
    },
    ja: async () => {
      const { ja } = await Promise.resolve().then(function () { return ja$1; });
      return ja;
    }
  };

  class TranslationCatalog {
    bundles = /* @__PURE__ */ new Map();
    fallbackLanguage;
    loadingPromises = /* @__PURE__ */ new Map();
    constructor(options = {}) {
      const { bundles = TRANSLATION_REGISTRY, fallbackLanguage = DEFAULT_LANGUAGE } = options;
      this.fallbackLanguage = fallbackLanguage;
      this.registerBundles(bundles);
      if (!this.bundles.has(this.fallbackLanguage)) {
        throw new Error(`Missing fallback language bundle: ${this.fallbackLanguage}`);
      }
    }
    register(language, strings) {
      this.bundles.set(language, strings);
    }
    has(language) {
      return this.bundles.has(language);
    }
    get(language) {
      if (language && this.bundles.has(language)) {
        return this.bundles.get(language);
      }
      return this.bundles.get(this.fallbackLanguage);
    }
    /**
     * Ensure a language bundle is loaded (lazy load if necessary).
     * Returns true if the language was loaded, false if it was already available.
     */
    async ensureLanguage(language) {
      if (this.bundles.has(language)) {
        return false;
      }
      const loader = LAZY_LANGUAGE_LOADERS[language];
      if (!loader) {
        return false;
      }
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
    /**
     * Check if a language can be lazy-loaded.
     */
    canLazyLoad(language) {
      return language in LAZY_LANGUAGE_LOADERS;
    }
    keys() {
      return Array.from(this.bundles.keys());
    }
    /**
     * Get all available languages (loaded + lazy-loadable).
     */
    availableLanguages() {
      const loaded = new Set(this.bundles.keys());
      const lazyLoadable = Object.keys(LAZY_LANGUAGE_LOADERS);
      for (const lang of lazyLoadable) {
        loaded.add(lang);
      }
      return Array.from(loaded);
    }
    toRecord() {
      return Object.fromEntries(this.bundles.entries());
    }
    registerBundles(bundles) {
      for (const [language, strings] of Object.entries(bundles)) {
        if (!strings) {
          continue;
        }
        this.register(language, strings);
      }
    }
  }

  function resolveTranslationValue(dictionary, key) {
    const segments = key.split(".");
    let current = dictionary;
    for (const segment of segments) {
      if (!current || typeof current !== "object") {
        return void 0;
      }
      current = current[segment];
    }
    return typeof current === "string" ? current : void 0;
  }

  class Translator {
    catalog;
    constructor(options = {}) {
      this.catalog = options instanceof TranslationCatalog ? options : new TranslationCatalog(options);
    }
    /**
     * Get all available languages (loaded + lazy-loadable).
     */
    get languages() {
      return [...LANGUAGE_CODES];
    }
    /**
     * Ensure a language bundle is loaded before translation.
     * Call this when switching languages to preload the bundle.
     */
    async ensureLanguage(language) {
      await this.catalog.ensureLanguage(language);
    }
    translate(language, key, params) {
      const dictionary = this.catalog.get(language);
      const template = resolveTranslationValue(dictionary, key);
      if (!template) {
        return key;
      }
      if (!params) {
        return template;
      }
      return template.replace(/\{(\w+)\}/g, (_, placeholder) => {
        if (Object.hasOwn(params, placeholder)) {
          return String(params[placeholder]);
        }
        return `{${placeholder}}`;
      });
    }
  }

  function createLifecycle(serviceName, options = {}) {
    const { onInitialize, onDestroy, silent = false } = options;
    let initialized = false;
    const noop = () => {
    };
    const log = silent || !logger$2?.info ? { info: noop, error: noop } : { info: logger$2.info.bind(logger$2), error: logger$2.error.bind(logger$2) };
    const initialize = async () => {
      if (initialized) return;
      log.info(`${serviceName} initializing...`);
      try {
        if (onInitialize) {
          await onInitialize();
        }
        initialized = true;
        log.info(`${serviceName} initialized`);
      } catch (error) {
        log.error(`${serviceName} initialization failed:`, error);
        throw error;
      }
    };
    const destroy = () => {
      if (!initialized) return;
      log.info(`${serviceName} destroying...`);
      try {
        if (onDestroy) {
          onDestroy();
        }
        log.info(`${serviceName} destroyed`);
      } catch (error) {
        log.error(`${serviceName} destroy failed:`, error);
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

  function safeParseInt(value, radix = 10) {
    const result = parseInt(value, radix);
    return Number.isNaN(result) ? 0 : result;
  }
  function clamp(value, min = 0, max = 1) {
    return Math.min(Math.max(value, min), max);
  }
  function clampIndex(index, length) {
    if (!Number.isFinite(index) || length <= 0) {
      return 0;
    }
    return clamp(Math.floor(index), 0, length - 1);
  }
  function isGMUserScriptInfo(obj) {
    if (obj === null || typeof obj !== "object") {
      return false;
    }
    const objRecord = obj;
    return "scriptHandler" in objRecord || Object.keys(objRecord).length > 0;
  }
  function cloneDeep(value) {
    if (typeof globalThis.structuredClone === "function") {
      return globalThis.structuredClone(value);
    }
    return JSON.parse(JSON.stringify(value));
  }

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
  const ERROR_MESSAGES = {
    download: "GM_download not available - Tampermonkey/Greasemonkey environment required",
    setValue: "GM_setValue not available - Tampermonkey/Greasemonkey environment required",
    getValue: "GM_getValue not available - Tampermonkey/Greasemonkey environment required",
    deleteValue: "GM_deleteValue not available - Tampermonkey/Greasemonkey environment required",
    listValues: "GM_listValues not available - Tampermonkey/Greasemonkey environment required",
    addStyle: "GM_addStyle not available - Tampermonkey/Greasemonkey environment required",
    xmlHttpRequest: "GM_xmlhttpRequest not available - Tampermonkey/Greasemonkey environment required"
  };
  function assertFunction(fn, errorMessage) {
    if (typeof fn !== "function") {
      throw new Error(errorMessage);
    }
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
      async download(url, filename) {
        const fn = assertFunction(gmDownload, ERROR_MESSAGES.download);
        fn(url, filename);
      },
      async setValue(key, value) {
        const fn = assertFunction(gmSetValue, ERROR_MESSAGES.setValue);
        await Promise.resolve(fn(key, value));
      },
      async getValue(key, defaultValue) {
        const fn = assertFunction(gmGetValue, ERROR_MESSAGES.getValue);
        const value = await Promise.resolve(fn(key, defaultValue));
        return value;
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
        const fn = assertFunction(gmAddStyle, ERROR_MESSAGES.addStyle);
        return fn(css);
      },
      xmlHttpRequest(details) {
        const fn = assertFunction(gmXmlHttpRequest, ERROR_MESSAGES.xmlHttpRequest);
        return fn(details);
      },
      cookie: gmCookie
    });
  }

  const GM_API_CHECKS = {
    getValue: (gm) => typeof gm.GM_getValue === "function",
    setValue: (gm) => typeof gm.GM_setValue === "function",
    download: (gm) => typeof gm.GM_download === "function",
    notification: (gm) => typeof gm.GM_notification === "function",
    deleteValue: (gm) => typeof gm.GM_deleteValue === "function",
    listValues: (gm) => typeof gm.GM_listValues === "function",
    cookie: (gm) => typeof gm.GM_cookie?.list === "function"
  };
  function isGMAPIAvailable(apiName) {
    const gm = globalThis;
    const checker = GM_API_CHECKS[apiName];
    if (!checker) {
      return false;
    }
    try {
      return checker(gm);
    } catch {
      return false;
    }
  }

  class PersistentStorage {
    userscript = getUserscript();
    static singleton = createSingleton(() => new PersistentStorage());
    constructor() {
    }
    static getInstance() {
      return PersistentStorage.singleton.get();
    }
    /** @internal Test helper */
    static resetForTests() {
      PersistentStorage.singleton.reset();
    }
    async set(key, value) {
      try {
        const serialized = typeof value === "string" ? value : JSON.stringify(value);
        await this.userscript.setValue(key, serialized);
      } catch (error) {
        logger$2.error(`PersistentStorage.set failed for "${key}":`, error);
        throw error;
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
      } catch (error) {
        if (error instanceof Error && error.message.includes("GM_getValue not available")) {
          return defaultValue;
        }
        logger$2.error(`PersistentStorage.get failed for "${key}":`, error);
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
      } catch (error) {
        logger$2.error(`PersistentStorage.remove failed for "${key}":`, error);
        throw error;
      }
    }
  }
  function getPersistentStorage() {
    return PersistentStorage.getInstance();
  }

  var persistentStorage = {
    __proto__: null,
    PersistentStorage: PersistentStorage,
    getPersistentStorage: getPersistentStorage
  };

  const translationCatalog = new TranslationCatalog({
    bundles: TRANSLATION_REGISTRY,
    fallbackLanguage: DEFAULT_LANGUAGE
  });
  const translator = new Translator(translationCatalog);
  class LanguageService {
    lifecycle;
    static STORAGE_KEY = "xeg-language";
    static SUPPORTED_LANGUAGES = /* @__PURE__ */ new Set([
      "auto",
      ...LANGUAGE_CODES
    ]);
    currentLanguage = "auto";
    listeners = /* @__PURE__ */ new Set();
    storage = getPersistentStorage();
    static singleton = createSingleton(() => new LanguageService());
    static getInstance() {
      return LanguageService.singleton.get();
    }
    /** @internal Test helper */
    static resetForTests() {
      LanguageService.singleton.reset();
    }
    constructor() {
      this.lifecycle = createLifecycle("LanguageService", {
        onInitialize: () => this.onInitialize(),
        onDestroy: () => this.onDestroy()
      });
    }
    /** Initialize service (idempotent, fail-fast on error) */
    async initialize() {
      return this.lifecycle.initialize();
    }
    /** Destroy service (idempotent, graceful on error) */
    destroy() {
      this.lifecycle.destroy();
    }
    /** Check if service is initialized */
    isInitialized() {
      return this.lifecycle.isInitialized();
    }
    /**
     * Service initialization hook
     * Restore language setting from storage and lazy load language bundle if needed
     */
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
      } catch (error) {
        logger$2.warn("Failed to restore language setting from storage:", error);
      }
    }
    /**
     * Service cleanup hook
     * Clean up listeners
     */
    onDestroy() {
      this.listeners.clear();
    }
    detectLanguage() {
      const browserLang = typeof navigator !== "undefined" && navigator.language ? navigator.language.slice(0, 2) : DEFAULT_LANGUAGE;
      if (isBaseLanguageCode(browserLang)) {
        return browserLang;
      }
      return DEFAULT_LANGUAGE;
    }
    getCurrentLanguage() {
      return this.currentLanguage;
    }
    getAvailableLanguages() {
      return [...LANGUAGE_CODES];
    }
    setLanguage(language) {
      const normalized = this.normalizeLanguage(language);
      if (language !== normalized && language !== "auto") {
        logger$2.warn(`Unsupported language: ${language}, falling back to '${normalized}'`);
      }
      if (this.currentLanguage === normalized) {
        return;
      }
      this.currentLanguage = normalized;
      this.notifyListeners(normalized);
      void this.persistLanguage(normalized);
      const effectiveLang = this.getEffectiveLanguage();
      void this.ensureLanguageLoaded(effectiveLang);
      logger$2.debug(`Language changed to: ${normalized}`);
    }
    /**
     * Ensure the language bundle is loaded (lazy load if necessary).
     * This is called automatically when language changes.
     */
    async ensureLanguageLoaded(language) {
      try {
        await translator.ensureLanguage(language);
      } catch (error) {
        logger$2.warn(`Failed to load language bundle: ${language}`, error);
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
      if (!language) {
        return "auto";
      }
      if (LanguageService.SUPPORTED_LANGUAGES.has(language)) {
        return language;
      }
      return DEFAULT_LANGUAGE;
    }
    notifyListeners(language) {
      this.listeners.forEach((listener) => {
        try {
          listener(language);
        } catch (error) {
          logger$2.warn("Language change listener error:", error);
        }
      });
    }
    async persistLanguage(language) {
      try {
        await this.storage.set(LanguageService.STORAGE_KEY, language);
      } catch (error) {
        logger$2.warn("Failed to persist language setting:", error);
      }
    }
    getEffectiveLanguage() {
      return this.currentLanguage === "auto" ? this.detectLanguage() : this.currentLanguage;
    }
  }

  class HttpError extends Error {
    constructor(message, status, statusText) {
      super(message);
      this.status = status;
      this.statusText = statusText;
      this.name = "HttpError";
    }
  }
  class HttpRequestService {
    static singleton = createSingleton(() => new HttpRequestService());
    defaultTimeout = 1e4;
    // 10 seconds
    constructor() {
    }
    /**
     * Perform HTTP request using GM_xmlhttpRequest
     * Phase 373: Re-introduced for cross-origin support
     */
    async request(method, url, options) {
      return new Promise((resolve, reject) => {
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
              if (response.responseHeaders) {
                response.responseHeaders.split("\r\n").forEach((line) => {
                  const parts = line.split(": ");
                  if (parts.length >= 2 && parts[0]) {
                    headers[parts[0].toLowerCase()] = parts.slice(1).join(": ");
                  }
                });
              }
              resolve({
                ok: response.status >= 200 && response.status < 300,
                status: response.status,
                statusText: response.statusText,
                data: response.response,
                headers
              });
            },
            onerror: (response) => {
              reject(
                new HttpError(
                  response.statusText || "Network Error",
                  response.status,
                  response.statusText
                )
              );
            },
            ontimeout: () => {
              reject(new HttpError("Request timeout", 0, "Timeout"));
            },
            onabort: () => {
              reject(new Error("Request was aborted"));
            }
          };
          if (options && "data" in options && options.data) {
            const data = options.data;
            if (typeof data === "object" && !(data instanceof Blob) && !(data instanceof ArrayBuffer) && !(data instanceof Uint8Array) && !(data instanceof FormData) && !(data instanceof URLSearchParams)) {
              details.data = JSON.stringify(data);
              if (!details.headers["content-type"]) {
                details.headers["content-type"] = "application/json";
              }
            } else {
              details.data = data;
            }
          }
          if (options && options.contentType && !details.headers["content-type"]) {
            details.headers["content-type"] = options.contentType;
          }
          const control = userscript.xmlHttpRequest(details);
          if (options?.signal) {
            options.signal.addEventListener("abort", () => {
              control.abort();
            });
          }
        } catch (error) {
          reject(error);
        }
      });
    }
    /**
     * Get or create the singleton instance
     */
    static getInstance() {
      return HttpRequestService.singleton.get();
    }
    /** @internal Test helper */
    static resetForTests() {
      HttpRequestService.singleton.reset();
    }
    /**
     * Perform a GET request
     */
    async get(url, options) {
      return this.request("GET", url, options);
    }
    /**
     * Perform a POST request
     */
    async post(url, data, options) {
      return this.request("POST", url, { ...options, data });
    }
    /**
     * Perform a PUT request
     */
    async put(url, data, options) {
      return this.request("PUT", url, { ...options, data });
    }
    /**
     * Perform a DELETE request
     */
    async delete(url, options) {
      return this.request("DELETE", url, options);
    }
    /**
     * Perform a PATCH request
     */
    async patch(url, data, options) {
      return this.request("PATCH", url, { ...options, data });
    }
    /**
     * Send binary data (ArrayBuffer or UInt8Array) via POST request - Phase 320
     * Optimized for large binary payloads with proper Content-Type handling
     *
     * Requires @connect directive for target domain
     *
     * @param url Target endpoint
     * @param data ArrayBuffer or UInt8Array to send
     * @param options Binary request options (contentType defaults to 'application/octet-stream')
     * @returns Promise resolving to HTTP response with parsed data
     *
     * @example
     * ```typescript
     * // Send compressed data
     * const compressed = await compressData(largeData);
     * const response = await httpService.postBinary<ApiResponse>(
     *   'https://api.example.com/upload',
     *   compressed,
     *   {
     *     contentType: 'application/gzip',
     *     responseType: 'json',
     *     timeout: 30000
     *   }
     * );
     *
     * // Send raw binary data
     * const binary = new Uint8Array([1, 2, 3, 4, 5]);
     * const result = await httpService.postBinary(url, binary);
     * ```
     */
    async postBinary(url, data, options) {
      const contentType = options?.contentType ?? "application/octet-stream";
      return await this.request("POST", url, {
        ...options,
        data,
        contentType
      });
    }
  }

  class TimerManager {
    timers = /* @__PURE__ */ new Set();
    /**
     * Register and track setTimeout
     */
    setTimeout(callback, delay) {
      const id = window.setTimeout(() => {
        this.timers.delete(id);
        callback();
      }, delay);
      this.timers.add(id);
      return id;
    }
    /**
     * Remove registered setTimeout
     */
    clearTimeout(id) {
      if (this.timers.has(id)) {
        window.clearTimeout(id);
        this.timers.delete(id);
      }
    }
    /**
     * Clean up all timers
     */
    cleanup() {
      this.timers.forEach((id) => window.clearTimeout(id));
      this.timers.clear();
    }
    /**
     * Get count of active timers
     */
    getActiveTimersCount() {
      return this.timers.size;
    }
  }
  const globalTimerManager = new TimerManager();

  const getIdleAPIs = () => {
    const source = typeof globalThis !== "undefined" ? globalThis : void 0;
    const ric = source && typeof source === "object" && "requestIdleCallback" in source ? source.requestIdleCallback || null : null;
    const cic = source && typeof source === "object" && "cancelIdleCallback" in source ? source.cancelIdleCallback || null : null;
    return { ric, cic };
  };
  function scheduleIdle(task) {
    const { ric, cic } = getIdleAPIs();
    if (ric) {
      const id = ric(() => {
        try {
          task();
        } catch {
        }
      });
      return {
        cancel: () => {
          cic?.(id);
        }
      };
    }
    const timerId = globalTimerManager.setTimeout(() => {
      try {
        task();
      } catch {
      }
    }, 0);
    return {
      cancel: () => {
        globalTimerManager.clearTimeout(timerId);
      }
    };
  }

  const observerPool = /* @__PURE__ */ new Map();
  let elementCallbackMap = /* @__PURE__ */ new WeakMap();
  let callbackIdCounter = 0;
  const createObserverKey = (options = {}) => {
    const rootMargin = options.rootMargin ?? "0px";
    const threshold = Array.isArray(options.threshold) ? options.threshold.join(",") : `${options.threshold ?? 0}`;
    return `${rootMargin}|${threshold}`;
  };
  const getObserver = (key, options) => {
    let observer = observerPool.get(key);
    if (observer) {
      return observer;
    }
    observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const callbacksByKey = elementCallbackMap.get(entry.target);
        const callbacks = callbacksByKey?.get(key);
        if (!callbacks || callbacks.size === 0) {
          return;
        }
        callbacks.forEach((cb) => {
          try {
            cb(entry);
          } catch {
          }
        });
      });
    }, options);
    observerPool.set(key, observer);
    return observer;
  };
  const SharedObserver = {
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
      if (isFirstForKey) {
        observer.observe(element);
      }
      let isActive = true;
      const unsubscribe = () => {
        if (!isActive) {
          return;
        }
        isActive = false;
        const callbacksByKeyCurrent = elementCallbackMap.get(element);
        const callbacksForKey = callbacksByKeyCurrent?.get(key);
        callbacksForKey?.delete(callbackId);
        if (callbacksForKey && callbacksForKey.size === 0) {
          callbacksByKeyCurrent?.delete(key);
          observer.unobserve(element);
        }
        if (!callbacksByKeyCurrent || callbacksByKeyCurrent.size === 0) {
          elementCallbackMap.delete(element);
        }
      };
      return unsubscribe;
    },
    unobserve(element) {
      const callbacksByKey = elementCallbackMap.get(element);
      if (!callbacksByKey) {
        return;
      }
      callbacksByKey.forEach((_callbacks, key) => {
        const observer = observerPool.get(key);
        observer?.unobserve(element);
      });
      elementCallbackMap.delete(element);
    }
  };

  function computePreloadIndices(currentIndex, total, count) {
    const safeTotal = Number.isFinite(total) && total > 0 ? Math.floor(total) : 0;
    const safeIndex = clampIndex(Math.floor(currentIndex), safeTotal);
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

  class PrefetchManager {
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
        void this.prefetchSingle(media.url).catch(() => {
        });
      });
    }
    /**
     * Get cached media blob
     */
    get(url) {
      return this.cache.get(url) ?? null;
    }
    /**
     * Check if media is cached
     */
    has(url) {
      return this.cache.has(url);
    }
    /**
     * Cancel all active prefetch requests
     */
    cancelAll() {
      for (const controller of this.activeRequests.values()) {
        controller.abort();
      }
      this.activeRequests.clear();
    }
    /**
     * Clear the prefetch cache
     */
    clear() {
      this.cache.clear();
    }
    /**
     * Get the cache for bulk downloads
     */
    getCache() {
      return this.cache;
    }
    /**
     * Cleanup resources
     */
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
      if (this.cache.size >= this.maxEntries) {
        this.evictOldest();
      }
      this.cache.set(url, fetchPromise);
      fetchPromise.catch(() => {
        if (this.cache.get(url) === fetchPromise) {
          this.cache.delete(url);
        }
      });
      await fetchPromise.catch(() => {
      });
    }
    evictOldest() {
      const first = this.cache.keys().next().value;
      if (first) {
        this.cache.delete(first);
      }
    }
  }

  class MediaService {
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
    /** Initialize service (idempotent, fail-fast on error) */
    async initialize() {
      return this.lifecycle.initialize();
    }
    /** Destroy service (idempotent, graceful on error) */
    destroy() {
      this.lifecycle.destroy();
    }
    /** Check if service is initialized */
    isInitialized() {
      return this.lifecycle.isInitialized();
    }
    async onInitialize() {
      if (typeof __FEATURE_MEDIA_EXTRACTION__ === "undefined" || __FEATURE_MEDIA_EXTRACTION__) {
        const { MediaExtractionService } = await Promise.resolve().then(function () { return mediaExtractionService; });
        this.mediaExtraction = new MediaExtractionService();
      }
      await this.detectWebPSupport();
    }
    onDestroy() {
      this.prefetchManager.destroy();
    }
    static getInstance(_options) {
      return MediaService.singleton.get();
    }
    /** @internal Test helper */
    static resetForTests() {
      MediaService.singleton.reset();
    }
    async extractFromClickedElement(element, options = {}) {
      if (!this.mediaExtraction) throw new Error("Media Extraction not initialized");
      const result = await this.mediaExtraction.extractFromClickedElement(element, options);
      if (result.success && result.mediaItems.length > 0) {
        const firstItem = result.mediaItems[0];
        if (firstItem) {
          this.prefetchMedia(firstItem, "immediate");
        }
        result.mediaItems.slice(1).forEach((item) => {
          this.prefetchMedia(item, "idle");
        });
      }
      return result;
    }
    async extractAllFromContainer(container, options = {}) {
      if (!this.mediaExtraction) throw new Error("Media Extraction not initialized");
      return this.mediaExtraction.extractAllFromContainer(container, options);
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
      const { DownloadOrchestrator } = await Promise.resolve().then(function () { return downloadOrchestrator; });
      const downloadService = DownloadOrchestrator.getInstance();
      const pendingPromise = this.prefetchManager.get(media.url);
      let blob;
      if (pendingPromise) {
        try {
          blob = await pendingPromise;
        } catch {
        }
      }
      return downloadService.downloadSingle(media, {
        ...options,
        ...blob ? { blob } : {}
      });
    }
    async downloadMultiple(items, options = {}) {
      const { DownloadOrchestrator } = await Promise.resolve().then(function () { return downloadOrchestrator; });
      const downloadService = DownloadOrchestrator.getInstance();
      return downloadService.downloadBulk(items, {
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
  }

  const CLASS_PREFIX = "xeg";
  const toSelector = (className) => `.${className}`;
  const toAttributeSelector = (attribute, value) => value ? `[${attribute}="${value}"]` : `[${attribute}]`;
  const CLASSES = {
    OVERLAY: `${CLASS_PREFIX}-gallery-overlay`,
    CONTAINER: `${CLASS_PREFIX}-gallery-container`,
    ROOT: `${CLASS_PREFIX}-gallery-root`,
    RENDERER: `${CLASS_PREFIX}-gallery-renderer`,
    VERTICAL_VIEW: `${CLASS_PREFIX}-vertical-gallery`,
    ITEM: `${CLASS_PREFIX}-gallery-item`,
    LEGACY_SCOPE: `${CLASS_PREFIX}-gallery`
  };
  const DATA_ATTRIBUTES = {
    GALLERY: "data-xeg-gallery",
    CONTAINER: "data-xeg-gallery-container",
    ELEMENT: "data-gallery-element",
    ROLE: "data-xeg-role",
    ROLE_COMPAT: "data-xeg-role-compat",
    GALLERY_TYPE: "data-xeg-gallery-type",
    GALLERY_VERSION: "data-xeg-gallery-version"
  };
  const SELECTORS$1 = {
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
  const INTERNAL_SELECTORS = Object.freeze(
    Array.from(
      new Set(
        [
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
        ].filter(Boolean)
      )
    )
  );
  const SCOPES = {
    HOSTS: Object.freeze(
      Array.from(
        /* @__PURE__ */ new Set([
          SELECTORS$1.ROOT,
          SELECTORS$1.DATA_GALLERY,
          SELECTORS$1.CONTAINER,
          SELECTORS$1.DATA_CONTAINER
        ])
      )
    )
  };
  const CSS = {
    SELECTORS: SELECTORS$1,
    INTERNAL_SELECTORS,
    SCOPES
  };

  const STATIC_DEFAULT_SETTINGS = {
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
    toolbar: {
      autoHideDelay: 3e3
      // ms, toolbar auto-hide delay (default 3s)
    },
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
      // Gallery feature enabled (required)
      settings: true,
      // Settings UI enabled
      download: true,
      // Download feature enabled
      mediaExtraction: true,
      // Media extraction enabled
      accessibility: true
      // Accessibility features enabled
    },
    version: "1.0.1",
    // Static default retains deterministic timestamp for hashing comparisons
    lastModified: 0
  };
  const DEFAULT_SETTINGS = STATIC_DEFAULT_SETTINGS;
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

  const SELECTORS = {
    // Tweet containers
    TWEET: 'article[data-testid="tweet"]',
    /** Tweet article with fallback to generic article */
    TWEET_ARTICLE: '[data-testid="tweet"], article',
    // Media elements
    TWEET_PHOTO: '[data-testid="tweetPhoto"]',
    TWEET_TEXT: '[data-testid="tweetText"]',
    VIDEO_PLAYER: '[data-testid="videoPlayer"]',
    // Links and URLs
    /** Status link for tweet ID extraction */
    STATUS_LINK: 'a[href*="/status/"]',
    /** Combined media source selector for extraction */
    TWITTER_MEDIA: 'img[src*="pbs.twimg.com"], video[src*="video.twimg.com"]'};
  const STABLE_SELECTORS = {
    /** Tweet container selectors */
    TWEET_CONTAINERS: [
      'article[data-testid="tweet"]',
      'article[role="article"]',
      '[data-testid="cellInnerDiv"] article'
    ],
    /** Media container selectors */
    MEDIA_CONTAINERS: [
      '[data-testid="tweetPhoto"]',
      '[data-testid="videoPlayer"]',
      '[aria-label*="Image"]',
      '[aria-label*="Video"]',
      'a[href*="/photo/"] > div'
    ],
    /** Video container selectors */
    VIDEO_CONTAINERS: [
      '[data-testid="videoPlayer"]',
      "video",
      '[aria-label*="Video"]',
      '[data-testid="videoComponent"]'
    ],
    /** Image container selectors */
    IMAGE_CONTAINERS: [
      '[data-testid="tweetPhoto"]',
      'img[src*="pbs.twimg.com"]',
      '[aria-label*="Image"] img',
      'a[href*="/photo/"] img'
    ]};

  const SERVICE_KEYS = {
    // ========================================
    // Core Services
    // ========================================
    /** Alias for GALLERY_DOWNLOAD */
    BULK_DOWNLOAD: "core.bulkDownload",
    LANGUAGE: "language.service",
    // ========================================
    // Gallery Services
    // ========================================
    GALLERY_DOWNLOAD: "gallery.download",
    GALLERY_RENDERER: "gallery.renderer",
    // ========================================
    // Media Services
    // ========================================
    MEDIA_FILENAME: "media.filename",
    MEDIA_SERVICE: "media.service",
    // ========================================
    // Settings Services
    // ========================================
    SETTINGS: "settings.manager",
    // ========================================
    // UI Services
    // ========================================
    THEME: "theme.auto"
    // ========================================
    // [RESERVED] Future Extension Keys
    // These keys are defined for future features but not currently in use.
    // Do not remove - they ensure consistent naming when features are added.
    // ========================================
    /** [RESERVED] Animation service for future motion control */
    // ANIMATION: 'animation.service',
    /** [RESERVED] Gallery root service for future component orchestration */
    // GALLERY: 'gallery',
    /** [RESERVED] Media extraction service (currently handled by MediaExtractionService directly) */
    // MEDIA_EXTRACTION: 'media.extraction',
    /** [RESERVED] Video playback control service */
    // VIDEO_CONTROL: 'video.control',
    /** [RESERVED] Video state management service */
    // VIDEO_STATE: 'video.state',
  };

  const APP_SETTINGS_STORAGE_KEY = "xeg-app-settings";

  const TWITTER_API_CONFIG = {
    /** Guest/Suspended account Bearer token */
    GUEST_AUTHORIZATION: "Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA",
    /** Tweet result lookup query ID */
    TWEET_RESULT_BY_REST_ID_QUERY_ID: "zAz9764BcLZOJ0JU2wrd1A"};

  const VIDEO_CONTROL_SELECTORS = [
    '[data-testid="playButton"]',
    '[data-testid="pauseButton"]',
    '[data-testid="muteButton"]',
    '[data-testid="unmuteButton"]',
    '[data-testid="volumeButton"]',
    '[data-testid="volumeSlider"]',
    '[data-testid="volumeControl"]',
    '[data-testid="videoProgressSlider"]',
    '[data-testid="seekBar"]',
    '[data-testid="scrubber"]',
    '[data-testid="videoPlayer"] [role="slider"]',
    '[data-testid="videoPlayer"] [role="progressbar"]',
    '[data-testid="videoPlayer"] [data-testid="SliderRail"]',
    '[data-testid="videoPlayer"] input[type="range"]',
    '[data-testid="videoPlayer"] [aria-label*="Volume"]',
    ".video-controls button",
    ".video-progress button",
    "video::-webkit-media-controls-play-button",
    "video::-webkit-media-controls-mute-button"
  ];
  const VIDEO_CONTROL_DATASET_PREFIXES = [
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
  const VIDEO_CONTROL_ROLES = ["slider", "progressbar"];
  const VIDEO_CONTROL_ARIA_TOKENS = [
    "volume",
    "mute",
    "unmute",
    "seek",
    "scrub",
    "timeline",
    "progress"
  ];

  var index$3 = {
    __proto__: null,
    APP_SETTINGS_STORAGE_KEY: APP_SETTINGS_STORAGE_KEY,
    CSS: CSS,
    DEFAULT_SETTINGS: DEFAULT_SETTINGS,
    SELECTORS: SELECTORS,
    SERVICE_KEYS: SERVICE_KEYS,
    STABLE_SELECTORS: STABLE_SELECTORS,
    TWITTER_API_CONFIG: TWITTER_API_CONFIG,
    VIDEO_CONTROL_ARIA_TOKENS: VIDEO_CONTROL_ARIA_TOKENS,
    VIDEO_CONTROL_DATASET_PREFIXES: VIDEO_CONTROL_DATASET_PREFIXES,
    VIDEO_CONTROL_ROLES: VIDEO_CONTROL_ROLES,
    VIDEO_CONTROL_SELECTORS: VIDEO_CONTROL_SELECTORS,
    createDefaultSettings: createDefaultSettings
  };

  const THEME_DOM_ATTRIBUTE = "data-theme";

  function syncThemeAttributes(theme, options = {}) {
    if (typeof document === "undefined") {
      return;
    }
    const { scopes, includeDocumentRoot = false } = options;
    if (includeDocumentRoot) {
      document.documentElement?.setAttribute(THEME_DOM_ATTRIBUTE, theme);
    }
    const targets = scopes ?? document.querySelectorAll(".xeg-theme-scope");
    for (const target of Array.from(targets)) {
      if (target instanceof HTMLElement) {
        target.setAttribute(THEME_DOM_ATTRIBUTE, theme);
      }
    }
  }

  class ThemeService {
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
    /** @internal Test helper */
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
          for (const m of mutations) {
            m.addedNodes.forEach((node) => {
              if (node instanceof Element) {
                if (node.classList.contains("xeg-theme-scope")) {
                  syncThemeAttributes(this.currentTheme, { scopes: [node] });
                }
                node.querySelectorAll(".xeg-theme-scope").forEach((scope) => {
                  syncThemeAttributes(this.currentTheme, { scopes: [scope] });
                });
              }
            });
          }
        });
        if (document.documentElement) {
          this.observer.observe(document.documentElement, {
            childList: true,
            subtree: true
          });
        } else {
          logger$2.warn("[ThemeService] document.documentElement not available for observation");
        }
      }
      this.themeSetting = this.loadThemeSync();
      this.applyCurrentTheme(true);
      void Promise.resolve().then(async () => {
        const saved = await this.loadThemeAsync();
        if (saved && saved !== this.themeSetting) {
          this.themeSetting = saved;
          this.applyCurrentTheme(true);
        }
        this.initializeSystemDetection();
      });
    }
    /** Initialize service (idempotent, fail-fast on error) */
    async initialize() {
      return this.lifecycle.initialize();
    }
    /** Destroy service (idempotent, graceful on error) */
    destroy() {
      this.lifecycle.destroy();
    }
    /** Check if service is initialized */
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
        const { tryGetSettingsManager } = await Promise.resolve().then(function () { return serviceAccessors; });
        const settingsService = tryGetSettingsManager();
        if (settingsService) {
          this.bindSettingsService(settingsService);
        }
      } catch (err) {
        logger$2.debug("[ThemeService] SettingsService not available", err);
      }
    }
    bindSettingsService(settingsService) {
      if (!settingsService || this.boundSettingsService === settingsService) return;
      if (this.settingsUnsubscribe) {
        this.settingsUnsubscribe();
      }
      this.boundSettingsService = settingsService;
      const settingsTheme = settingsService.get?.("gallery.theme");
      if (settingsTheme && ["light", "dark", "auto"].includes(settingsTheme)) {
        if (settingsTheme !== this.themeSetting) {
          this.themeSetting = settingsTheme;
          this.applyCurrentTheme(true);
        }
      }
      if (typeof settingsService.subscribe === "function") {
        this.settingsUnsubscribe = settingsService.subscribe((event) => {
          if (event?.key === "gallery.theme") {
            const newVal = event.newValue;
            if (["light", "dark", "auto"].includes(newVal) && newVal !== this.themeSetting) {
              this.themeSetting = newVal;
              this.applyCurrentTheme();
            }
          }
        });
      }
    }
    setTheme(setting, options) {
      const validSettings = ["light", "dark", "auto"];
      const normalized = validSettings.includes(setting) ? setting : "light";
      this.themeSetting = normalized;
      if (options?.persist !== false && this.boundSettingsService?.set) {
        void this.boundSettingsService.set("gallery.theme", this.themeSetting);
      }
      const notified = this.applyCurrentTheme(options?.force);
      if (!notified) {
        this.notifyListeners();
      }
    }
    getEffectiveTheme() {
      if (this.themeSetting === "auto") {
        return this.mediaQueryList?.matches ? "dark" : "light";
      }
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
      if (this.settingsUnsubscribe) {
        this.settingsUnsubscribe();
      }
      this.listeners.clear();
      this.observer?.disconnect();
    }
    initializeSystemDetection() {
      if (this.mediaQueryList) {
        this.mediaQueryList.addEventListener("change", () => {
          if (this.themeSetting === "auto") {
            this.applyCurrentTheme();
          }
        });
      }
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
        const snapshot = this.storage.getSync(APP_SETTINGS_STORAGE_KEY);
        return snapshot?.gallery?.theme ?? "auto";
      } catch {
        return "auto";
      }
    }
    async loadThemeAsync() {
      try {
        const snapshot = await this.storage.get(APP_SETTINGS_STORAGE_KEY);
        return snapshot?.gallery?.theme ?? null;
      } catch {
        return null;
      }
    }
  }

  function getThemeServiceInstance() {
    return ThemeService.getInstance();
  }
  function getLanguageServiceInstance() {
    return LanguageService.getInstance();
  }
  function getMediaServiceInstance() {
    return MediaService.getInstance();
  }

  const THEME_SERVICE_IDENTIFIER = SERVICE_KEYS.THEME;
  const LANGUAGE_SERVICE_IDENTIFIER = SERVICE_KEYS.LANGUAGE;
  const MEDIA_SERVICE_IDENTIFIER = SERVICE_KEYS.MEDIA_SERVICE;
  const CORE_BASE_SERVICE_IDENTIFIERS = [
    THEME_SERVICE_IDENTIFIER,
    LANGUAGE_SERVICE_IDENTIFIER,
    MEDIA_SERVICE_IDENTIFIER
  ];
  function tryGetFromCoreService(key) {
    try {
      const coreService = CoreService.getInstance();
      if (coreService.has(key)) {
        return coreService.get(key);
      }
    } catch {
    }
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
      void getMediaService();
    } catch {
    }
  }
  function warmupNonCriticalServices() {
    try {
      void getThemeService();
    } catch {
    }
  }

  var serviceAccessors = {
    __proto__: null,
    CORE_BASE_SERVICE_IDENTIFIERS: CORE_BASE_SERVICE_IDENTIFIERS,
    LANGUAGE_SERVICE_IDENTIFIER: LANGUAGE_SERVICE_IDENTIFIER,
    MEDIA_SERVICE_IDENTIFIER: MEDIA_SERVICE_IDENTIFIER,
    THEME_SERVICE_IDENTIFIER: THEME_SERVICE_IDENTIFIER,
    getGalleryRenderer: getGalleryRenderer,
    getLanguageService: getLanguageService,
    getMediaService: getMediaService,
    getThemeService: getThemeService,
    registerGalleryRenderer: registerGalleryRenderer,
    registerSettingsManager: registerSettingsManager,
    tryGetSettingsManager: tryGetSettingsManager,
    warmupCriticalServices: warmupCriticalServices,
    warmupNonCriticalServices: warmupNonCriticalServices
  };

  const SEVERITY_LOG_MAP = {
    critical: "error",
    error: "error",
    warning: "warn",
    info: "info"
  };
  const DEFAULT_SEVERITY = "error";
  function normalizeErrorMessage$1(error) {
    if (error instanceof Error) {
      return error.message || error.name || "Error";
    }
    if (typeof error === "string" && error.length > 0) {
      return error;
    }
    if (error && typeof error === "object") {
      if ("message" in error && typeof error.message === "string") {
        return error.message;
      }
      try {
        return JSON.stringify(error);
      } catch {
        return String(error);
      }
    }
    if (error === null) {
      return "null";
    }
    if (error === void 0) {
      return "undefined";
    }
    return String(error);
  }
  function extractStackTrace(error) {
    if (error instanceof Error && error.stack) {
      return error.stack;
    }
    return void 0;
  }
  function formatContextTag(context, code) {
    const base = `[${context.charAt(0).toUpperCase() + context.slice(1)}]`;
    return code ? `${base}[${code}]` : base;
  }
  class AppErrorReporter {
    static notificationCallback = null;
    /**
     * Set callback for UI notifications
     * This allows decoupling from NotificationService
     */
    static setNotificationCallback(callback) {
      AppErrorReporter.notificationCallback = callback;
    }
    /**
     * Report an error with context and severity
     *
     * @param error - The error to report (can be any type)
     * @param options - Report options including context and severity
     * @returns Report result with normalized message
     * @throws Re-throws error if severity is 'critical'
     */
    static report(error, options) {
      const severity = options.severity ?? DEFAULT_SEVERITY;
      const message = normalizeErrorMessage$1(error);
      const tag = formatContextTag(options.context, options.code);
      const logLevel = SEVERITY_LOG_MAP[severity];
      const stack = extractStackTrace(error);
      const logPayload = {
        context: options.context,
        severity
      };
      if (options.metadata) {
        logPayload.metadata = options.metadata;
      }
      if (stack && severity !== "info") {
        logPayload.stack = stack;
      }
      logger$2[logLevel](`${tag} ${message}`, logPayload);
      if (options.notify && AppErrorReporter.notificationCallback) {
        AppErrorReporter.notificationCallback(message, options.context);
      }
      const result = {
        reported: true,
        message,
        context: options.context,
        severity
      };
      if (severity === "critical") {
        throw error instanceof Error ? error : new Error(message);
      }
      return result;
    }
    /**
     * Report an error and return a default value
     * Useful for catch blocks that need to return something
     */
    static reportAndReturn(error, options, defaultValue) {
      const effectiveOptions = {
        ...options,
        severity: options.severity === "critical" ? "error" : options.severity
      };
      AppErrorReporter.report(error, effectiveOptions);
      return defaultValue;
    }
    /**
     * Create a context-bound reporter for convenience
     *
     * @param context - Default context for all reports
     * @returns Bound reporter functions
     *
     * @example
     * ```typescript
     * const reporter = AppErrorReporter.forContext('gallery');
     * reporter.error(err, { code: 'OPEN_FAILED' });
     * reporter.warn(err, { notify: true });
     * ```
     */
    static forContext(context) {
      return {
        critical: (error, options) => AppErrorReporter.report(error, { ...options, context, severity: "critical" }),
        error: (error, options) => AppErrorReporter.report(error, { ...options, context, severity: "error" }),
        warn: (error, options) => AppErrorReporter.report(error, { ...options, context, severity: "warning" }),
        info: (error, options) => AppErrorReporter.report(error, { ...options, context, severity: "info" })
      };
    }
  }
  const bootstrapErrorReporter = AppErrorReporter.forContext("bootstrap");
  const galleryErrorReporter = AppErrorReporter.forContext("gallery");
  const mediaErrorReporter = AppErrorReporter.forContext("media");
  AppErrorReporter.forContext("download");
  const settingsErrorReporter = AppErrorReporter.forContext("settings");
  AppErrorReporter.forContext("event");
  AppErrorReporter.forContext("network");
  AppErrorReporter.forContext("storage");
  AppErrorReporter.forContext("ui");

  class GlobalErrorHandler {
    static singleton = createSingleton(() => new GlobalErrorHandler());
    isInitialized = false;
    errorListener = (event) => {
      const message = event.message ?? "Unknown error occurred";
      const location = event.filename ? `${event.filename}:${event.lineno ?? 0}:${event.colno ?? 0}` : void 0;
      logger$2.error(`[UncaughtError] ${message}`, {
        type: "uncaught-error",
        location
      });
    };
    rejectionListener = (event) => {
      const { reason } = event;
      const message = reason instanceof Error ? reason.message : typeof reason === "string" ? reason : `Unhandled rejection: ${String(reason)}`;
      logger$2.error(`[UnhandledRejection] ${message}`, {
        type: "unhandled-rejection",
        reason
      });
    };
    static getInstance() {
      return GlobalErrorHandler.singleton.get();
    }
    /** @internal Test helper */
    static resetForTests() {
      GlobalErrorHandler.singleton.reset();
    }
    constructor() {
    }
    initialize() {
      if (this.isInitialized || typeof window === "undefined") {
        return;
      }
      window.addEventListener("error", this.errorListener);
      window.addEventListener("unhandledrejection", this.rejectionListener);
      this.isInitialized = true;
    }
    destroy() {
      if (!this.isInitialized || typeof window === "undefined") {
        return;
      }
      window.removeEventListener("error", this.errorListener);
      window.removeEventListener("unhandledrejection", this.rejectionListener);
      this.isInitialized = false;
    }
  }
  GlobalErrorHandler.getInstance();

  const ErrorCode = {
    // Generic error codes
    NONE: "NONE",
    ALL_FAILED: "ALL_FAILED",
    NO_MEDIA_FOUND: "NO_MEDIA_FOUND"};

  var index$2 = {
    __proto__: null,
    AppErrorReporter: AppErrorReporter,
    GlobalErrorHandler: GlobalErrorHandler,
    bootstrapErrorReporter: bootstrapErrorReporter,
    galleryErrorReporter: galleryErrorReporter,
    mediaErrorReporter: mediaErrorReporter,
    normalizeErrorMessage: normalizeErrorMessage$1,
    settingsErrorReporter: settingsErrorReporter
  };

  let rendererRegistrationTask = null;
  async function registerRenderer() {
    if (!rendererRegistrationTask) {
      rendererRegistrationTask = (async () => {
        const { GalleryRenderer: GalleryRenderer$1 } = await Promise.resolve().then(function () { return GalleryRenderer; });
        registerGalleryRenderer(new GalleryRenderer$1());
      })().finally(() => {
        rendererRegistrationTask = null;
      });
    }
    await rendererRegistrationTask;
  }
  async function initializeServices() {
    const hasRequiredGMAPIs = isGMAPIAvailable("download") || isGMAPIAvailable("setValue");
    if (!hasRequiredGMAPIs) {
      bootstrapErrorReporter.warn(new Error("Tampermonkey APIs limited"), {
        code: "GM_API_LIMITED"
      });
    }
    let settingsService$1 = null;
    try {
      const { SettingsService } = await Promise.resolve().then(function () { return settingsService; });
      const service = new SettingsService();
      await service.initialize();
      registerSettingsManager(service);
      settingsService$1 = service;
      logger$2.debug("[Bootstrap] ✅ SettingsService initialized");
    } catch (error) {
      settingsErrorReporter.warn(error, {
        code: "SETTINGS_SERVICE_INIT_FAILED"
      });
    }
    try {
      const { getThemeService } = await Promise.resolve().then(function () { return serviceAccessors; });
      const themeService = getThemeService();
      if (!themeService.isInitialized()) {
        await themeService.initialize();
      }
      if (settingsService$1) {
        themeService.bindSettingsService(settingsService$1);
        const storedTheme = themeService.getCurrentTheme();
        themeService.setTheme(storedTheme, { force: true, persist: false });
      }
      logger$2.debug(`[Bootstrap] Theme confirmed: ${themeService.getCurrentTheme()}`);
    } catch (error) {
      bootstrapErrorReporter.warn(error, {
        code: "THEME_SYNC_FAILED"
      });
    }
  }
  async function initializeGalleryApp() {
    try {
      logger$2.info("🎨 Gallery app lazy initialization starting");
      await Promise.all([registerRenderer(), initializeServices()]);
      const { GalleryApp } = await Promise.resolve().then(function () { return GalleryApp$1; });
      const galleryApp = new GalleryApp();
      await galleryApp.initialize();
      logger$2.info("✅ Gallery app initialization complete");
      return galleryApp;
    } catch (error) {
      galleryErrorReporter.critical(error, {
        code: "GALLERY_APP_INIT_FAILED"
      });
      throw error;
    }
  }

  async function executeStage(stage) {
    const startTime = performance.now();
    if (stage.shouldRun && !stage.shouldRun()) {
      return {
        label: stage.label,
        success: true,
        durationMs: 0
      };
    }
    try {
      await Promise.resolve(stage.run());
      const durationMs = performance.now() - startTime;
      return {
        label: stage.label,
        success: true,
        durationMs
      };
    } catch (error) {
      const durationMs = performance.now() - startTime;
      if (stage.optional) {
        bootstrapErrorReporter.warn(error, {
          code: "STAGE_OPTIONAL_FAILED",
          metadata: { stage: stage.label, durationMs }
        });
      } else {
        bootstrapErrorReporter.error(error, {
          code: "STAGE_FAILED",
          metadata: { stage: stage.label, durationMs }
        });
      }
      return {
        label: stage.label,
        success: false,
        error,
        durationMs
      };
    }
  }
  async function executeStages(stages, options) {
    const results = [];
    const stopOnFailure = options?.stopOnFailure;
    for (const stage of stages) {
      const result = await executeStage(stage);
      results.push(result);
      if (!result.success && !stage.optional && stopOnFailure) {
        logger$2.error(`[bootstrap] ❌ Critical stage failed: ${stage.label}`);
        break;
      }
    }
    return results;
  }

  const __vite_import_meta_env__ = {"BASE_URL": "/", "DEV": false, "MODE": "production", "PROD": true, "SSR": false};
  const FALLBACK_VERSION = "0.4.15";
  const APP_NAME = "X.com Enhanced Gallery";
  const MAX_GALLERY_ITEMS = 100;
  const DEFAULT_ANIMATION_DURATION = "var(--xeg-duration-normal)";
  const DEFAULT_SERVICE_TIMEOUT_MS = 1e4;
  const DEFAULT_BOOTSTRAP_RETRY_ATTEMPTS = 3;
  const DEFAULT_BOOTSTRAP_RETRY_DELAY_MS = 100;
  const importMetaEnv = resolveImportMetaEnv();
  const nodeEnv = resolveNodeEnv();
  const rawVersion = resolveStringValue(
    importMetaEnv.VITE_VERSION,
    nodeEnv.VITE_VERSION,
    nodeEnv.npm_package_version
  ) ?? FALLBACK_VERSION;
  const devFlag = parseBooleanFlag(importMetaEnv.DEV);
  const nodeDevFlag = parseBooleanFlag(nodeEnv.DEV);
  const mode = importMetaEnv.MODE ?? nodeEnv.NODE_ENV ?? "production";
  const isTest = mode === "test";
  const isDev = devFlag ?? nodeDevFlag ?? (!isTest && mode !== "production");
  const isProd = !isDev && !isTest;
  const autoStartFlag = parseBooleanFlag(importMetaEnv.VITE_AUTO_START ?? nodeEnv.VITE_AUTO_START);
  const debugToolsFlag = parseBooleanFlag(
    importMetaEnv.VITE_ENABLE_DEBUG_TOOLS ?? nodeEnv.VITE_ENABLE_DEBUG_TOOLS
  );
  const resolvedAppConfig = Object.freeze(
    {
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
      runtime: {
        autoStart: autoStartFlag ?? true
      },
      limits: {
        maxGalleryItems: MAX_GALLERY_ITEMS
      },
      ui: {
        animationDuration: DEFAULT_ANIMATION_DURATION
      },
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
    }
  );
  const APP_CONFIG = resolvedAppConfig;
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
    if (typeof globalThis !== "undefined" && globalThis.__XEG_IMPORT_META_ENV__) {
      return globalThis.__XEG_IMPORT_META_ENV__;
    }
    try {
      return __vite_import_meta_env__ ?? {};
    } catch {
      return {};
    }
  }
  function resolveNodeEnv() {
    if (typeof process !== "undefined" && process?.env) {
      return process.env;
    }
    return {};
  }
  function parseBooleanFlag(value) {
    if (typeof value === "boolean") {
      return value;
    }
    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (!normalized) {
        return void 0;
      }
      if (["1", "true", "yes", "on"].includes(normalized)) {
        return true;
      }
      if (["0", "false", "no", "off"].includes(normalized)) {
        return false;
      }
    }
    return void 0;
  }
  function resolveStringValue(...values) {
    for (const value of values) {
      if (typeof value === "string") {
        const normalized = value.trim();
        if (normalized.length > 0) {
          return normalized;
        }
      }
    }
    return void 0;
  }

  let windowLoadPromise = null;
  const hasBrowserContext = typeof window !== "undefined" && typeof document !== "undefined";
  function isWindowLoaded() {
    if (!hasBrowserContext) {
      return true;
    }
    return document.readyState === "complete";
  }
  function createWindowLoadPromise() {
    if (windowLoadPromise) {
      return windowLoadPromise;
    }
    windowLoadPromise = new Promise((resolve) => {
      const handleLoad = () => {
        window.removeEventListener("load", handleLoad);
        resolve();
        windowLoadPromise = Promise.resolve();
      };
      window.addEventListener("load", handleLoad, { once: true, passive: true });
    });
    return windowLoadPromise;
  }
  function waitForWindowLoad() {
    if (isWindowLoaded()) {
      return Promise.resolve();
    }
    return createWindowLoadPromise();
  }
  function runAfterWindowLoad(callback) {
    return waitForWindowLoad().then(() => Promise.resolve(callback())).then(() => void 0);
  }

  const isDevEnvironment = false;
  const lifecycleState$1 = {
    started: false,
    startPromise: null,
    galleryApp: null
  };
  const warnCleanupLog = (message, error) => {
    logger$2.warn(message, error);
  };
  const debugCleanupLog = (message, error) => {
    logger$2.debug(message, error);
  };
  let globalEventTeardown = null;
  function setGlobalEventTeardown(teardown) {
    globalEventTeardown = teardown;
  }
  function tearDownGlobalEventHandlers() {
    if (!globalEventTeardown) {
      return;
    }
    const teardown = globalEventTeardown;
    globalEventTeardown = null;
    try {
      teardown();
    } catch (error) {
    }
  }
  async function runOptionalCleanup(label, task, log = warnCleanupLog) {
    try {
      await task();
    } catch (error) {
      log(label, error);
    }
  }
  const bootstrapStages = [
    {
      label: "Global styles",
      run: loadGlobalStyles
    },
    {
      label: "Developer tooling",
      run: initializeDevToolsIfNeeded,
      shouldRun: () => isDevEnvironment
    },
    {
      label: "Infrastructure",
      run: initializeInfrastructure
    },
    {
      label: "Critical systems",
      run: async () => {
        const { initializeCriticalSystems } = await Promise.resolve().then(function () { return criticalSystems; });
        await initializeCriticalSystems();
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
        const { registerFeatureServicesLazy } = await Promise.resolve().then(function () { return features; });
        await registerFeatureServicesLazy();
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
    const results = await executeStages(bootstrapStages, { stopOnFailure: true });
    const failedStage = results.find((r) => !r.success);
    if (failedStage) {
      throw failedStage.error ?? new Error(`Bootstrap stage failed: ${failedStage.label}`);
    }
  }
  async function initializeInfrastructure() {
    try {
      const { initializeEnvironment } = await Promise.resolve().then(function () { return environment; });
      await initializeEnvironment();
      logger$2.debug("✅ Vendor library initialization complete");
    } catch (error) {
      bootstrapErrorReporter.critical(error, {
        code: "INFRASTRUCTURE_INIT_FAILED"
      });
    }
  }
  async function initializeBaseServicesStage() {
    try {
      const { initializeCoreBaseServices } = await Promise.resolve().then(function () { return baseServices; });
      await initializeCoreBaseServices();
      logger$2.debug("✅ Base services initialization complete");
    } catch (error) {
      bootstrapErrorReporter.warn(error, {
        code: "BASE_SERVICES_INIT_FAILED"
      });
    }
  }
  async function applyInitialThemeSetting() {
    try {
      const { getThemeService } = await Promise.resolve().then(function () { return serviceAccessors; });
      const themeService = getThemeService();
      if (typeof themeService.isInitialized === "function" && !themeService.isInitialized()) {
        await themeService.initialize();
      }
      const savedSetting = themeService.getCurrentTheme();
      themeService.setTheme(savedSetting, { force: true, persist: false });
    } catch (error) {
      logger$2.warn("[theme-sync] Initial theme application skipped:", error);
    }
  }
  function initializeNonCriticalSystems() {
    try {
      logger$2.info("Starting non-critical system initialization");
      warmupNonCriticalServices();
      logger$2.info("✅ Non-critical system initialization complete");
    } catch (error) {
      logger$2.warn("Error during non-critical system initialization:", error);
    }
  }
  function setupGlobalEventHandlers() {
    tearDownGlobalEventHandlers();
    globalEventTeardown = wireGlobalEvents(() => {
      cleanup().catch((error) => logger$2.error("Error during page unload cleanup:", error));
    });
  }
  async function loadGlobalStyles() {
    await Promise.resolve().then(function () { return globals; });
  }
  async function initializeDevToolsIfNeeded() {
    {
      return;
    }
  }
  async function initializeGalleryIfPermitted() {
    await initializeGallery();
  }
  function triggerPreloadStrategy() {
    void runAfterWindowLoad(async () => {
      try {
        const { executePreloadStrategy } = await Promise.resolve().then(function () { return preload; });
        await executePreloadStrategy();
      } catch (error) {
        logger$2.warn("[Phase 326] Error executing preload strategy:", error);
      }
    });
  }
  async function cleanup() {
    try {
      logger$2.info("🧹 Starting application cleanup");
      tearDownGlobalEventHandlers();
      await runOptionalCleanup("Gallery cleanup", async () => {
        if (!lifecycleState$1.galleryApp) {
          return;
        }
        await lifecycleState$1.galleryApp.cleanup();
        lifecycleState$1.galleryApp = null;
      });
      await runOptionalCleanup("CoreService cleanup", () => {
        CoreService.getInstance().cleanup();
      });
      await runOptionalCleanup("Global timer cleanup", () => {
        globalTimerManager.cleanup();
      });
      await runOptionalCleanup(
        "Global error handler cleanup",
        async () => {
          const { GlobalErrorHandler } = await Promise.resolve().then(function () { return index$2; });
          GlobalErrorHandler.getInstance().destroy();
        },
        debugCleanupLog
      );
      lifecycleState$1.started = false;
      logger$2.info("✅ Application cleanup complete");
    } catch (error) {
      bootstrapErrorReporter.error(error, {
        code: "CLEANUP_FAILED"
      });
      throw error;
    }
  }
  async function startApplication() {
    if (lifecycleState$1.started) {
      logger$2.debug("Application: Already started");
      return;
    }
    if (lifecycleState$1.startPromise) {
      logger$2.debug("Application: Start in progress - reusing promise");
      return lifecycleState$1.startPromise;
    }
    lifecycleState$1.startPromise = (async () => {
      logger$2.info("🚀 Starting X.com Enhanced Gallery...");
      await runBootstrapStages();
      triggerPreloadStrategy();
      lifecycleState$1.started = true;
      logger$2.info("✅ Application initialization complete");
    })().catch((error) => {
      bootstrapErrorReporter.error(error, {
        code: "APP_INIT_FAILED",
        metadata: { leanMode: true }
      });
    }).finally(() => {
      lifecycleState$1.startPromise = null;
    });
    return lifecycleState$1.startPromise;
  }
  async function initializeGallery() {
    try {
      logger$2.debug("🎯 Starting gallery immediate initialization");
      lifecycleState$1.galleryApp = await initializeGalleryApp();
      logger$2.debug("✅ Gallery immediate initialization complete");
    } catch (error) {
      galleryErrorReporter.critical(error, {
        code: "GALLERY_INIT_FAILED"
      });
    }
  }
  startApplication();
  var main = {
    start: startApplication,
    createConfig: createAppConfig,
    cleanup
  };

  const ko = {
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
      gallery: {
        sectionTitle: "갤러리"
      }
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
        single: {
          error: {
            title: "다운로드 실패",
            body: "파일을 가져올 수 없습니다: {error}"
          }
        },
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

  var ko$1 = {
    __proto__: null,
    ko: ko
  };

  const ja = {
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
      gallery: {
        sectionTitle: "ギャラリー"
      }
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
        single: {
          error: {
            title: "ダウンロード失敗",
            body: "ファイルを取得できません: {error}"
          }
        },
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

  var ja$1 = {
    __proto__: null,
    ja: ja
  };

  const STANDARD_GALLERY_HEIGHT = 720;
  const DEFAULT_DIMENSIONS = {
    width: 540,
    height: STANDARD_GALLERY_HEIGHT
  };
  function removeDuplicates(items, keyExtractor) {
    const seen = /* @__PURE__ */ new Set();
    const uniqueItems = [];
    for (const item of items) {
      if (!item) {
        continue;
      }
      const key = keyExtractor(item);
      if (!key) {
        logger$2.warn("Skipping item without key");
        continue;
      }
      if (!seen.has(key)) {
        seen.add(key);
        uniqueItems.push(item);
      }
    }
    return uniqueItems;
  }
  function removeDuplicateMediaItems(mediaItems) {
    if (!mediaItems?.length) {
      return [];
    }
    const result = removeDuplicates(mediaItems, (item) => item.originalUrl ?? item.url);
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
      const visualIndex = extractVisualIndexFromUrl(media.expanded_url || "");
      return { media, visualIndex };
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
    if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) {
      return null;
    }
    return { width, height };
  }
  function normalizeDimension(value) {
    if (typeof value === "number" && Number.isFinite(value) && value > 0) {
      return Math.round(value);
    }
    if (typeof value === "string") {
      const parsed = Number.parseFloat(value);
      if (Number.isFinite(parsed) && parsed > 0) {
        return Math.round(parsed);
      }
    }
    return null;
  }
  function normalizeMediaUrl(url) {
    if (!url) return null;
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      let filename = pathname.split("/").pop();
      if (filename) {
        const dotIndex = filename.lastIndexOf(".");
        if (dotIndex !== -1) {
          filename = filename.substring(0, dotIndex);
        }
      }
      return filename && filename.length > 0 ? filename : null;
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
        if (dotIndex !== -1) {
          filenamePart = filenamePart.substring(0, dotIndex);
        }
        return filenamePart.length > 0 ? filenamePart : null;
      } catch {
        return null;
      }
    }
  }
  function scaleAspectRatio(widthRatio, heightRatio) {
    if (heightRatio <= 0 || widthRatio <= 0) {
      return DEFAULT_DIMENSIONS;
    }
    const scaledHeight = STANDARD_GALLERY_HEIGHT;
    const scaledWidth = Math.max(1, Math.round(widthRatio / heightRatio * scaledHeight));
    return {
      width: scaledWidth,
      height: scaledHeight
    };
  }
  function extractDimensionsFromMetadataObject(dimensions) {
    if (!dimensions) {
      return null;
    }
    const width = normalizeDimension(dimensions.width);
    const height = normalizeDimension(dimensions.height);
    if (width && height) {
      return { width, height };
    }
    return null;
  }
  function extractDimensionsFromUrlCandidate(candidate) {
    if (typeof candidate !== "string" || !candidate) {
      return null;
    }
    return extractDimensionsFromUrl(candidate);
  }
  function deriveDimensionsFromMetadata(metadata) {
    if (!metadata) {
      return null;
    }
    const dimensions = extractDimensionsFromMetadataObject(
      metadata.dimensions
    );
    if (dimensions) {
      return dimensions;
    }
    const apiData = metadata.apiData;
    if (!apiData) {
      return null;
    }
    const originalWidth = normalizeDimension(apiData.original_width ?? apiData.originalWidth);
    const originalHeight = normalizeDimension(apiData.original_height ?? apiData.originalHeight);
    if (originalWidth && originalHeight) {
      return { width: originalWidth, height: originalHeight };
    }
    const fromDownloadUrl = extractDimensionsFromUrlCandidate(apiData.download_url);
    if (fromDownloadUrl) {
      return fromDownloadUrl;
    }
    const fromPreviewUrl = extractDimensionsFromUrlCandidate(apiData.preview_url);
    if (fromPreviewUrl) {
      return fromPreviewUrl;
    }
    const aspectRatio = apiData.aspect_ratio;
    if (Array.isArray(aspectRatio) && aspectRatio.length >= 2) {
      const ratioWidth = normalizeDimension(aspectRatio[0]);
      const ratioHeight = normalizeDimension(aspectRatio[1]);
      if (ratioWidth && ratioHeight) {
        return scaleAspectRatio(ratioWidth, ratioHeight);
      }
    }
    return null;
  }
  function deriveDimensionsFromMediaUrls(media) {
    const candidates = [media.url, media.originalUrl, media.thumbnailUrl];
    for (const candidate of candidates) {
      const dimensions = extractDimensionsFromUrlCandidate(candidate);
      if (dimensions) {
        return dimensions;
      }
    }
    return null;
  }
  function resolveMediaDimensions(media) {
    if (!media) {
      return DEFAULT_DIMENSIONS;
    }
    const directWidth = normalizeDimension(media.width);
    const directHeight = normalizeDimension(media.height);
    if (directWidth && directHeight) {
      return { width: directWidth, height: directHeight };
    }
    const fromMetadata = deriveDimensionsFromMetadata(
      media.metadata
    );
    if (fromMetadata) {
      return fromMetadata;
    }
    const fromUrls = deriveDimensionsFromMediaUrls(media);
    if (fromUrls) {
      return fromUrls;
    }
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
    const safeOriginalIndex = clampIndex(originalClickedIndex, originalItems.length);
    const clickedItem = originalItems[safeOriginalIndex];
    if (!clickedItem) return 0;
    const clickedKey = clickedItem.originalUrl ?? clickedItem.url;
    const newIndex = uniqueItems.findIndex((item) => {
      const itemKey = item.originalUrl ?? item.url;
      return itemKey === clickedKey;
    });
    return newIndex >= 0 ? newIndex : 0;
  }

  const FALLBACK_BASE_URL = "https://x.com";
  function tryParseUrl(value, base = FALLBACK_BASE_URL) {
    if (value instanceof URL) {
      return value;
    }
    if (typeof value !== "string") {
      return null;
    }
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }
    try {
      if (trimmed.startsWith("//")) {
        return new URL(`https:${trimmed}`);
      }
      return new URL(trimmed, base);
    } catch {
      return null;
    }
  }
  function isHostMatching(value, allowedHosts, options = {}) {
    if (!Array.isArray(allowedHosts)) {
      return false;
    }
    const parsed = tryParseUrl(value);
    if (!parsed) {
      return false;
    }
    const hostname = parsed.hostname.toLowerCase();
    const allowSubdomains = options.allowSubdomains === true;
    return allowedHosts.some((host) => {
      const normalized = host.toLowerCase();
      if (hostname === normalized) {
        return true;
      }
      return allowSubdomains && hostname.endsWith(`.${normalized}`);
    });
  }
  const RESERVED_TWITTER_PATHS = /* @__PURE__ */ new Set([
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
  const TWITTER_USERNAME_PATTERN = /^[a-zA-Z0-9_]{1,15}$/;
  const TWITTER_HOSTS = ["twitter.com", "x.com"];
  function extractUsernameFromUrl(url, options = {}) {
    if (!url || typeof url !== "string") {
      return null;
    }
    try {
      let path;
      if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("//")) {
        const parsed = tryParseUrl(url);
        if (!parsed) {
          return null;
        }
        if (options.strictHost) {
          if (!isHostMatching(parsed, TWITTER_HOSTS, { allowSubdomains: true })) {
            return null;
          }
        }
        path = parsed.pathname;
      } else {
        path = url;
      }
      const segments = path.split("/").filter(Boolean);
      if (segments.length >= 3 && segments[1] === "status") {
        const username = segments[0];
        if (!username) {
          return null;
        }
        if (RESERVED_TWITTER_PATHS.has(username.toLowerCase())) {
          return null;
        }
        if (TWITTER_USERNAME_PATTERN.test(username)) {
          return username;
        }
      }
      return null;
    } catch {
      return null;
    }
  }

  const CONTROL_CHARS_REGEX = /[\u0000-\u001F\u007F]/g;
  const SCHEME_WHITESPACE_REGEX = /[\u0000-\u001F\u007F\s]+/g;
  const EXPLICIT_SCHEME_REGEX = /^[a-zA-Z][a-zA-Z0-9+.-]*:/;
  const MAX_DECODE_ITERATIONS = 3;
  const MAX_SCHEME_PROBE_LENGTH = 64;
  const DEFAULT_BLOCKED_PROTOCOL_HINTS = Object.freeze([
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
  const HTML_ATTR_SAFE_PROTOCOLS = /* @__PURE__ */ new Set(["http:", "https:"]);
  const HTML_ATTRIBUTE_URL_POLICY = {
    allowedProtocols: HTML_ATTR_SAFE_PROTOCOLS,
    allowRelative: true,
    allowDataUrls: false
  };
  function isUrlAllowed(rawUrl, policy) {
    if (!rawUrl || typeof rawUrl !== "string") {
      return false;
    }
    const normalized = rawUrl.replace(CONTROL_CHARS_REGEX, "").trim();
    if (!normalized) {
      return false;
    }
    const blockedHints = policy.blockedProtocolHints ?? DEFAULT_BLOCKED_PROTOCOL_HINTS;
    if (startsWithBlockedProtocolHint(normalized, blockedHints)) {
      return false;
    }
    const lower = normalized.toLowerCase();
    if (lower.startsWith("data:")) {
      return policy.allowDataUrls === true;
    }
    if (lower.startsWith("//")) {
      return handleProtocolRelative(normalized, policy);
    }
    if (lower.startsWith("#")) {
      return true;
    }
    const hasScheme = EXPLICIT_SCHEME_REGEX.test(normalized);
    if (!hasScheme) {
      return policy.allowRelative === true;
    }
    try {
      const parsed = new URL(normalized);
      return policy.allowedProtocols.has(parsed.protocol);
    } catch {
      return false;
    }
  }
  function startsWithBlockedProtocolHint(value, hints) {
    const probe = value.slice(0, MAX_SCHEME_PROBE_LENGTH);
    const variants = buildProbeVariants(probe);
    return variants.some((candidate) => hints.some((hint) => candidate.startsWith(hint)));
  }
  function buildProbeVariants(value) {
    const variants = /* @__PURE__ */ new Set();
    const base = value.toLowerCase();
    variants.add(base);
    variants.add(base.replace(SCHEME_WHITESPACE_REGEX, ""));
    let decoded = base;
    for (let i = 0; i < MAX_DECODE_ITERATIONS; i += 1) {
      try {
        decoded = decodeURIComponent(decoded);
        variants.add(decoded);
        variants.add(decoded.replace(SCHEME_WHITESPACE_REGEX, ""));
      } catch {
        break;
      }
    }
    return Array.from(variants.values());
  }
  function handleProtocolRelative(url, policy) {
    const fallbackProtocol = policy.allowedProtocols.has("https:") ? "https:" : policy.allowedProtocols.has("http:") ? "http:" : "https:";
    try {
      const resolved = new URL(`${fallbackProtocol}${url}`);
      return policy.allowedProtocols.has(resolved.protocol);
    } catch {
      return false;
    }
  }

  const MAX_URL_LENGTH = 2048;
  function isValidMediaUrl(url) {
    if (typeof url !== "string" || url.length > MAX_URL_LENGTH) {
      return false;
    }
    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      return false;
    }
    if (!verifyUrlProtocol(parsed.protocol)) {
      return false;
    }
    if (parsed.hostname === "pbs.twimg.com") {
      return checkPbsMediaPath(parsed.pathname);
    }
    if (parsed.hostname === "video.twimg.com") {
      return true;
    }
    return false;
  }
  function verifyUrlProtocol(protocol) {
    return protocol === "https:" || protocol === "http:";
  }
  function checkPbsMediaPath(pathname) {
    return pathname.startsWith("/media/") || pathname.startsWith("/ext_tw_video_thumb/") || pathname.startsWith("/tweet_video_thumb/") || pathname.startsWith("/video_thumb/");
  }

  const extractFromElement = (element) => {
    const dataId = element.dataset.tweetId;
    if (dataId && /^\d+$/.test(dataId)) {
      return {
        tweetId: dataId,
        username: element.dataset.user ?? "unknown",
        tweetUrl: `https://twitter.com/i/status/${dataId}`,
        extractionMethod: "element-attribute",
        confidence: 0.9
      };
    }
    const href = element.getAttribute("href");
    if (href) {
      const match = href.match(/\/status\/(\d+)/);
      if (match?.[1]) {
        return {
          tweetId: match[1],
          username: extractUsernameFromUrl(href) ?? "unknown",
          tweetUrl: href.startsWith("http") ? href : `https://twitter.com${href}`,
          extractionMethod: "element-href",
          confidence: 0.8
        };
      }
    }
    return null;
  };
  const extractFromDOM = (element) => {
    const container = element.closest(SELECTORS.TWEET_ARTICLE);
    if (!container) return null;
    const statusLink = container.querySelector(SELECTORS.STATUS_LINK);
    if (!statusLink) return null;
    const href = statusLink.getAttribute("href");
    if (!href) return null;
    const match = href.match(/\/status\/(\d+)/);
    if (!match || !match[1]) return null;
    const tweetId = match[1];
    const username = extractUsernameFromUrl(href) ?? "unknown";
    return {
      tweetId,
      username,
      tweetUrl: href.startsWith("http") ? href : `https://twitter.com${href}`,
      extractionMethod: "dom-structure",
      confidence: 0.85,
      metadata: { containerTag: container.tagName.toLowerCase() }
    };
  };
  const extractFromMediaGridItem = (element) => {
    const link = element.closest("a");
    if (!link) return null;
    const href = link.getAttribute("href");
    if (!href) return null;
    const match = href.match(/\/status\/(\d+)/);
    if (!match || !match[1]) return null;
    const tweetId = match[1];
    const username = extractUsernameFromUrl(href) ?? "unknown";
    return {
      tweetId,
      username,
      tweetUrl: href.startsWith("http") ? href : `https://twitter.com${href}`,
      extractionMethod: "media-grid-item",
      confidence: 0.8
    };
  };
  class TweetInfoExtractor {
    strategies = [
      extractFromElement,
      extractFromDOM,
      extractFromMediaGridItem
    ];
    async extract(element) {
      for (const strategy of this.strategies) {
        try {
          const result = strategy(element);
          if (result && this.isValid(result)) {
            logger$2.debug(`[TweetInfoExtractor] Success: ${result.extractionMethod}`, {
              tweetId: result.tweetId
            });
            return result;
          }
        } catch {
        }
      }
      return null;
    }
    isValid(info) {
      return !!info.tweetId && /^\d+$/.test(info.tweetId) && info.tweetId !== "unknown";
    }
  }

  function resolveDimensionsFromApiMedia(apiMedia) {
    const widthFromOriginal = normalizeDimension(apiMedia.original_width);
    const heightFromOriginal = normalizeDimension(apiMedia.original_height);
    if (widthFromOriginal && heightFromOriginal) {
      return {
        width: widthFromOriginal,
        height: heightFromOriginal
      };
    }
    return null;
  }
  function createMediaInfoFromAPI(apiMedia, tweetInfo, index, tweetTextHTML) {
    try {
      const mediaType = apiMedia.type === "photo" ? "image" : "video";
      const dimensions = resolveDimensionsFromApiMedia(apiMedia);
      const metadata = {
        apiIndex: index,
        apiData: apiMedia
      };
      if (dimensions) {
        metadata.dimensions = dimensions;
      }
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
        metadata
      };
    } catch (error) {
      logger$2.error("Failed to create API MediaInfo:", error);
      return null;
    }
  }
  async function convertAPIMediaToMediaInfo(apiMedias, tweetInfo, tweetTextHTML) {
    const mediaItems = [];
    for (let i = 0; i < apiMedias.length; i++) {
      const apiMedia = apiMedias[i];
      if (!apiMedia) continue;
      const mediaInfo = createMediaInfoFromAPI(apiMedia, tweetInfo, i, tweetTextHTML);
      if (mediaInfo) {
        mediaItems.push(mediaInfo);
      }
    }
    return mediaItems;
  }

  function promisifyCallback(executor, options) {
    return new Promise((resolve, reject) => {
      try {
        executor((result, error) => {
          if (error) {
            if (options?.fallback) {
              resolve(Promise.resolve(options.fallback()));
            } else {
              reject(new Error(String(error)));
            }
            return;
          }
          resolve(result);
        });
      } catch (error) {
        if (options?.fallback) {
          resolve(Promise.resolve(options.fallback()));
        } else {
          reject(error instanceof Error ? error : new Error(String(error)));
        }
      }
    });
  }

  let cachedCookieAPI;
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
      if (userscript.cookie) {
        return userscript.cookie;
      }
    } catch {
    }
    const global = globalThis;
    if (global.GM_cookie && typeof global.GM_cookie.list === "function") {
      return global.GM_cookie;
    }
    return null;
  }
  function getCookieAPI() {
    if (cachedCookieAPI === void 0) {
      cachedCookieAPI = resolveCookieAPI();
    }
    return cachedCookieAPI;
  }
  function listFromDocument(options) {
    if (typeof document === "undefined" || typeof document.cookie !== "string") {
      return [];
    }
    const domain = typeof document.location?.hostname === "string" ? document.location.hostname : void 0;
    const records = document.cookie.split(";").map((entry) => entry.trim()).filter(Boolean).map((entry) => {
      const [rawName, ...rest] = entry.split("=");
      const nameDecoded = decode(rawName);
      if (!nameDecoded) {
        return null;
      }
      const value = decode(rest.join("=")) ?? "";
      const record = {
        name: nameDecoded,
        value,
        path: "/",
        session: true,
        ...domain ? { domain } : {}
      };
      return record;
    }).filter((record) => Boolean(record));
    const filtered = options?.name ? records.filter((record) => record.name === options.name) : records;
    return filtered;
  }
  async function listCookies(options) {
    const gmCookie = getCookieAPI();
    if (!gmCookie?.list) {
      return listFromDocument(options);
    }
    return promisifyCallback(
      (callback) => gmCookie?.list(options, (cookies, error) => {
        if (error) {
          logger$2.warn("GM_cookie.list failed; falling back to document.cookie", error);
        }
        callback(error ? void 0 : (cookies ?? []).map((c) => ({ ...c })), error);
      }),
      { fallback: () => listFromDocument(options) }
    );
  }
  async function getCookieValue(name, options) {
    const gmCookie = getCookieAPI();
    if (gmCookie?.list) {
      const cookies = await listCookies({ ...options, name });
      const value = cookies[0]?.value;
      if (value) {
        return value;
      }
    }
    return getCookieValueSync(name);
  }
  function getCookieValueSync(name) {
    if (typeof document === "undefined" || typeof document.cookie !== "string") {
      return void 0;
    }
    const pattern = new RegExp(`(?:^|;\\s*)${escapeRegex(name)}=([^;]*)`);
    const match = document.cookie.match(pattern);
    return decode(match?.[1]);
  }

  let _csrfToken;
  let _tokensInitialized = false;
  function initializeTokens() {
    if (_tokensInitialized) {
      return;
    }
    _csrfToken = getCookieValueSync("ct0");
    void getCookieValue("ct0").then((value) => {
      if (value) {
        _csrfToken = value;
      }
    }).catch((error) => {
      logger$2.debug("Failed to hydrate CSRF token from GM_cookie", error);
    });
    _tokensInitialized = true;
  }
  function getCsrfToken() {
    initializeTokens();
    return _csrfToken;
  }

  function resolveDimensions(media, mediaUrl) {
    const dimensionsFromUrl = extractDimensionsFromUrl(mediaUrl);
    const widthFromOriginal = normalizeDimension(media.original_info?.width);
    const heightFromOriginal = normalizeDimension(media.original_info?.height);
    const widthFromUrl = normalizeDimension(dimensionsFromUrl?.width);
    const heightFromUrl = normalizeDimension(dimensionsFromUrl?.height);
    const width = widthFromOriginal ?? widthFromUrl;
    const height = heightFromOriginal ?? heightFromUrl;
    const result = {};
    if (width !== null && width !== void 0) {
      result.width = width;
    }
    if (height !== null && height !== void 0) {
      result.height = height;
    }
    return result;
  }
  function resolveAspectRatio(media, dimensions) {
    const aspectRatioValues = Array.isArray(media.video_info?.aspect_ratio) ? media.video_info?.aspect_ratio : void 0;
    const aspectRatioWidth = normalizeDimension(aspectRatioValues?.[0]);
    const aspectRatioHeight = normalizeDimension(aspectRatioValues?.[1]);
    if (aspectRatioWidth && aspectRatioHeight) {
      return [aspectRatioWidth, aspectRatioHeight];
    }
    if (dimensions.width && dimensions.height) {
      return [dimensions.width, dimensions.height];
    }
    return void 0;
  }
  function getPhotoHighQualityUrl(mediaUrlHttps) {
    return mediaUrlHttps.includes("?format=") ? mediaUrlHttps : mediaUrlHttps.replace(/\.(jpg|png)$/, "?format=$1&name=orig");
  }
  function getVideoHighQualityUrl(media) {
    const variants = media.video_info?.variants ?? [];
    const mp4Variants = variants.filter((v) => v.content_type === "video/mp4");
    if (mp4Variants.length === 0) return null;
    const bestVariant = mp4Variants.reduce((best, current) => {
      const bestBitrate = best.bitrate ?? 0;
      const currentBitrate = current.bitrate ?? 0;
      return currentBitrate > bestBitrate ? current : best;
    });
    return bestVariant.url;
  }
  function getHighQualityMediaUrl(media) {
    if (media.type === "photo") {
      return getPhotoHighQualityUrl(media.media_url_https);
    }
    if (media.type === "video" || media.type === "animated_gif") {
      return getVideoHighQualityUrl(media);
    }
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
    if (dimensions.width) {
      entry.original_width = dimensions.width;
    }
    if (dimensions.height) {
      entry.original_height = dimensions.height;
    }
    if (aspectRatio) {
      entry.aspect_ratio = aspectRatio;
    }
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
        const tweetText = (tweetResult.full_text ?? "").replace(` ${media.url}`, "").trim();
        const entry = createMediaEntry(
          media,
          mediaUrl,
          screenName,
          tweetId,
          tweetText,
          index,
          typeIndex[mediaType] ?? 0,
          typeIndex[media.type] ?? 0,
          sourceLocation
        );
        mediaItems.push(entry);
      } catch (error) {
        logger$2.warn(`Failed to process media ${media.id_str}:`, error);
      }
    }
    return mediaItems;
  }
  function normalizeLegacyTweet(tweet) {
    if (tweet.legacy) {
      if (!tweet.extended_entities && tweet.legacy.extended_entities) {
        tweet.extended_entities = tweet.legacy.extended_entities;
      }
      if (!tweet.full_text && tweet.legacy.full_text) {
        tweet.full_text = tweet.legacy.full_text;
      }
      if (!tweet.id_str && tweet.legacy.id_str) {
        tweet.id_str = tweet.legacy.id_str;
      }
    }
    const noteTweetText = tweet.note_tweet?.note_tweet_results?.result?.text;
    if (noteTweetText) {
      tweet.full_text = noteTweetText;
    }
  }
  function normalizeLegacyUser(user) {
    if (user.legacy) {
      if (!user.screen_name && user.legacy.screen_name) {
        user.screen_name = user.legacy.screen_name;
      }
      if (!user.name && user.legacy.name) {
        user.name = user.legacy.name;
      }
    }
  }

  class TwitterAPI {
    /** LRU cache for API responses (max 16 entries) */
    static requestCache = /* @__PURE__ */ new Map();
    static CACHE_LIMIT = 16;
    /**
     * Get Tweet Medias - Main API Entry Point
     */
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
        if (quotedTweet.tweet) {
          quotedTweet = quotedTweet.tweet;
        }
        const quotedUser = quotedTweet.core?.user_results?.result;
        if (quotedTweet && quotedUser) {
          normalizeLegacyTweet(quotedTweet);
          normalizeLegacyUser(quotedUser);
          const quotedMedia = extractMediaFromTweet(quotedTweet, quotedUser, "quoted");
          const sortedQuotedMedia = sortMediaByVisualOrder(quotedMedia);
          const adjustedResult = result.map((media) => ({
            ...media,
            index: media.index + sortedQuotedMedia.length
          }));
          result = [...sortedQuotedMedia, ...adjustedResult];
        }
      }
      return result;
    }
    /**
     * Execute GraphQL API request to Twitter.
     */
    static async apiRequest(url) {
      const _url = url.toString();
      if (TwitterAPI.requestCache.has(_url)) {
        return TwitterAPI.requestCache.get(_url);
      }
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
        const httpService = HttpRequestService.getInstance();
        const response = await httpService.get(_url, {
          headers: Object.fromEntries(headers.entries()),
          responseType: "json"
        });
        if (!response.ok) {
          logger$2.warn(
            `Twitter API request failed: ${response.status} ${response.statusText}`,
            response.data
          );
          throw new Error(`Twitter API request failed: ${response.status} ${response.statusText}`);
        }
        const json = response.data;
        if (json.errors && json.errors.length > 0) {
          logger$2.warn("Twitter API returned errors:", json.errors);
        }
        if (TwitterAPI.requestCache.size >= TwitterAPI.CACHE_LIMIT) {
          const firstKey = TwitterAPI.requestCache.keys().next().value;
          if (firstKey) {
            TwitterAPI.requestCache.delete(firstKey);
          }
        }
        TwitterAPI.requestCache.set(_url, json);
        return json;
      } catch (error) {
        logger$2.error("Twitter API request failed:", error);
        throw error;
      }
    }
    /**
     * Construct the GraphQL endpoint URL for fetching tweet details.
     */
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
  }

  const DEFAULT_MAX_DESCENDANT_DEPTH = 6;
  const DEFAULT_MAX_ANCESTOR_HOPS = 3;
  const DEFAULT_TRAVERSAL_OPTIONS = {
    maxDescendantDepth: DEFAULT_MAX_DESCENDANT_DEPTH,
    maxAncestorHops: DEFAULT_MAX_ANCESTOR_HOPS
  };
  function isMediaElement(element) {
    if (!element) {
      return false;
    }
    return element.tagName === "IMG" || element.tagName === "VIDEO";
  }
  function findMediaElementInDOM(target, options = {}) {
    const { maxDescendantDepth, maxAncestorHops } = {
      ...DEFAULT_TRAVERSAL_OPTIONS,
      ...options
    };
    if (isMediaElement(target)) {
      return target;
    }
    const descendant = findMediaDescendant(target, {
      includeRoot: false,
      maxDepth: maxDescendantDepth
    });
    if (descendant) {
      return descendant;
    }
    let branch = target;
    for (let hops = 0; hops < maxAncestorHops && branch; hops++) {
      branch = branch.parentElement;
      if (!branch) {
        break;
      }
      const ancestorMedia = findMediaDescendant(branch, {
        includeRoot: true,
        maxDepth: maxDescendantDepth
      });
      if (ancestorMedia) {
        return ancestorMedia;
      }
    }
    return null;
  }
  function extractMediaUrlFromElement(element) {
    if (element instanceof HTMLImageElement) {
      return pickFirstTruthy([element.currentSrc, element.src, element.getAttribute("src")]);
    }
    if (element instanceof HTMLVideoElement) {
      return pickFirstTruthy([
        element.currentSrc,
        element.src,
        element.getAttribute("src"),
        element.poster,
        element.getAttribute("poster")
      ]);
    }
    return null;
  }
  function findMediaDescendant(root, { includeRoot, maxDepth }) {
    const queue = [{ node: root, depth: 0 }];
    while (queue.length) {
      const current = queue.shift();
      if (!current) {
        break;
      }
      const { node, depth } = current;
      if ((includeRoot || node !== root) && isMediaElement(node)) {
        return node;
      }
      if (depth >= maxDepth) {
        continue;
      }
      for (const child of Array.from(node.children)) {
        if (child instanceof HTMLElement) {
          queue.push({ node: child, depth: depth + 1 });
        }
      }
    }
    return null;
  }
  function pickFirstTruthy(values) {
    for (const value of values) {
      if (value) {
        return value;
      }
    }
    return null;
  }

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
          logger$2.debug(
            `[determineClickedIndex] Matched clicked media at index ${i}: ${normalizedElementUrl}`
          );
          return true;
        }
        if (item.thumbnailUrl && normalizeMediaUrl(item.thumbnailUrl) === normalizedElementUrl) {
          logger$2.debug(
            `[determineClickedIndex] Matched clicked media (thumbnail) at index ${i}: ${normalizedElementUrl}`
          );
          return true;
        }
        return false;
      });
      if (index !== -1) return index;
      logger$2.warn(
        `[determineClickedIndex] No matching media found for URL: ${normalizedElementUrl}, defaulting to 0`
      );
      return 0;
    } catch (error) {
      logger$2.warn("[determineClickedIndex] Error calculating clicked index:", error);
      return 0;
    }
  }

  const DEFAULT_CONFIG = {
    allowedTags: ["a", "span", "br", "strong", "em", "img"],
    allowedAttributes: {
      a: ["href", "title", "rel", "target", "dir"],
      span: ["class", "dir"],
      img: ["alt", "src", "draggable"]
    }
  };
  function sanitizeHTML(html, config = DEFAULT_CONFIG) {
    if (!html || typeof html !== "string") return "";
    const doc = new DOMParser().parseFromString(html, "text/html");
    function sanitizeNode(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.cloneNode(false);
      }
      if (node.nodeType !== Node.ELEMENT_NODE) {
        return null;
      }
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
        if (attrName.startsWith("on")) {
          continue;
        }
        if (!allowedAttrs.includes(attrName)) {
          continue;
        }
        if ((attrName === "href" || attrName === "src") && !isSafeAttributeUrl(attr.value)) {
          continue;
        }
        sanitized.setAttribute(attrName, attr.value);
      }
      if (tagName === "a" && sanitized.getAttribute("target") === "_blank") {
        sanitized.setAttribute("rel", "noopener noreferrer");
      }
      for (const child of Array.from(element.childNodes)) {
        const sanitizedChild = sanitizeNode(child);
        if (sanitizedChild) {
          sanitized.appendChild(sanitizedChild);
        }
      }
      return sanitized;
    }
    const bodyContent = doc.body;
    const sanitizedBody = document.createElement("div");
    for (const child of Array.from(bodyContent.childNodes)) {
      const sanitized = sanitizeNode(child);
      if (sanitized) {
        sanitizedBody.appendChild(sanitized);
      }
    }
    return sanitizedBody.innerHTML;
  }
  function isSafeAttributeUrl(url) {
    return isUrlAllowed(url, HTML_ATTRIBUTE_URL_POLICY);
  }

  function extractTweetTextHTML(tweetArticle) {
    if (!tweetArticle) return void 0;
    try {
      const tweetTextElement = tweetArticle.querySelector(SELECTORS.TWEET_TEXT);
      if (!tweetTextElement) {
        logger$2.debug("[extractTweetTextHTML] tweetText element not found");
        return void 0;
      }
      const rawHTML = tweetTextElement.innerHTML;
      if (!rawHTML?.trim()) {
        logger$2.debug("[extractTweetTextHTML] Empty HTML content");
        return void 0;
      }
      const sanitized = sanitizeHTML(rawHTML);
      if (!sanitized?.trim()) {
        logger$2.debug("[extractTweetTextHTML] HTML sanitization resulted in empty content");
        return void 0;
      }
      logger$2.debug("[extractTweetTextHTML] Successfully extracted and sanitized HTML", {
        originalLength: rawHTML.length,
        sanitizedLength: sanitized.length
      });
      return sanitized;
    } catch (error) {
      logger$2.error("[extractTweetTextHTML] Error extracting tweet text HTML:", error);
      return void 0;
    }
  }
  function extractTweetTextHTMLFromClickedElement(element, maxDepth = 10) {
    let current = element;
    let depth = 0;
    while (current && depth < maxDepth) {
      if (current.tagName === "ARTICLE" && (current.hasAttribute("data-testid") || current.querySelector(SELECTORS.TWEET))) {
        return extractTweetTextHTML(current);
      }
      current = current.parentElement;
      depth++;
    }
    logger$2.debug("[extractTweetTextHTMLFromClickedElement] Tweet article not found within depth", {
      maxDepth
    });
    return void 0;
  }

  class TwitterAPIExtractor {
    async extract(tweetInfo, clickedElement, _options, extractionId) {
      try {
        logger$2.debug(`[APIExtractor] ${extractionId}: Starting API extraction`, {
          tweetId: tweetInfo.tweetId
        });
        const apiMedias = await TwitterAPI.getTweetMedias(tweetInfo.tweetId);
        if (!apiMedias || apiMedias.length === 0) {
          return this.createFailureResult("No media found in API response");
        }
        const tweetTextHTML = extractTweetTextHTMLFromClickedElement(clickedElement);
        const mediaItems = await convertAPIMediaToMediaInfo(apiMedias, tweetInfo, tweetTextHTML);
        const clickedIndex = determineClickedIndex(clickedElement, mediaItems);
        return {
          success: true,
          mediaItems,
          clickedIndex,
          metadata: {
            extractedAt: Date.now(),
            sourceType: "twitter-api",
            strategy: "api-extraction",
            totalProcessingTime: 0,
            apiMediaCount: apiMedias.length
          },
          tweetInfo
        };
      } catch (error) {
        logger$2.warn(`[APIExtractor] ${extractionId}: API extraction failed:`, error);
        return this.createFailureResult(
          error instanceof Error ? error.message : "API extraction failed"
        );
      }
    }
    createFailureResult(error) {
      return {
        success: false,
        mediaItems: [],
        clickedIndex: 0,
        metadata: {
          extractedAt: Date.now(),
          sourceType: "twitter-api",
          strategy: "api-extraction-failed",
          error
        },
        tweetInfo: null
      };
    }
  }

  class ExtractionError extends Error {
    constructor(code, message, originalError) {
      super(message);
      this.code = code;
      this.originalError = originalError;
      this.name = "ExtractionError";
    }
  }

  class MediaExtractionService {
    tweetInfoExtractor;
    apiExtractor;
    constructor() {
      this.tweetInfoExtractor = new TweetInfoExtractor();
      this.apiExtractor = new TwitterAPIExtractor();
    }
    async extractFromClickedElement(element, options = {}) {
      const extractionId = this.generateExtractionId();
      logger$2.info(`[MediaExtractor] ${extractionId}: Extraction started`);
      try {
        const tweetInfo = await this.tweetInfoExtractor.extract(element);
        if (!tweetInfo?.tweetId) {
          logger$2.warn(`[MediaExtractor] ${extractionId}: No tweet info found`);
          return this.createErrorResult("No tweet information found");
        }
        const apiResult = await this.apiExtractor.extract(tweetInfo, element, options, extractionId);
        if (apiResult.success && apiResult.mediaItems.length > 0) {
          return this.finalizeResult({
            ...apiResult,
            tweetInfo: this.mergeTweetInfoMetadata(tweetInfo, apiResult.tweetInfo)
          });
        }
        logger$2.error(`[MediaExtractor] ${extractionId}: API extraction failed`);
        return this.createErrorResult("API extraction failed");
      } catch (error) {
        logger$2.error(`[MediaExtractor] ${extractionId}: Extraction error`, error);
        return this.createErrorResult(error);
      }
    }
    async extractAllFromContainer(container, options = {}) {
      try {
        const firstMedia = container.querySelector(SELECTORS.TWITTER_MEDIA);
        if (!firstMedia) {
          return this.createErrorResult("No media found in container");
        }
        return this.extractFromClickedElement(firstMedia, options);
      } catch (error) {
        return this.createErrorResult(error);
      }
    }
    generateExtractionId() {
      if (typeof crypto !== "undefined" && crypto.randomUUID) {
        return `simp_${crypto.randomUUID()}`;
      }
      return `simp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
    createErrorResult(error) {
      const errorMessage = error instanceof Error ? error.message : typeof error === "string" ? error : "Unknown error";
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
      if (uniqueItems.length === 0) {
        return { ...result, mediaItems: [], clickedIndex: 0 };
      }
      const adjustedIndex = adjustClickedIndexAfterDeduplication(
        result.mediaItems,
        uniqueItems,
        result.clickedIndex ?? 0
      );
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
  }

  var mediaExtractionService = {
    __proto__: null,
    MediaExtractionService: MediaExtractionService
  };

  function getErrorMessage(error) {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === "string") {
      return error;
    }
    if (error && typeof error === "object" && "message" in error) {
      const message = error.message;
      return typeof message === "string" ? message : String(message ?? "");
    }
    if (error == null) {
      return "";
    }
    return String(error);
  }

  function detectDownloadCapability() {
    const gmDownload = resolveGMDownload();
    const hasGMDownload = typeof gmDownload === "function";
    const hasFetch = typeof fetch === "function";
    const hasBlob = typeof Blob !== "undefined" && typeof URL !== "undefined" && typeof URL.createObjectURL === "function";
    let method = "none";
    if (hasGMDownload) {
      method = "gm_download";
    } else if (hasFetch && hasBlob) {
      method = "fetch_blob";
    }
    return { hasGMDownload, hasFetch, hasBlob, method, gmDownload };
  }
  function resolveGMDownload() {
    if (typeof GM_download !== "undefined" && typeof GM_download === "function") {
      return GM_download;
    }
    const globalObject = globalThis;
    const fromGlobal = globalObject.GM_download;
    if (typeof fromGlobal === "function") {
      return fromGlobal;
    }
    return void 0;
  }
  async function downloadWithFetchBlob(url, filename, options = {}) {
    const { signal, onProgress, timeout = 3e4 } = options;
    if (signal?.aborted) {
      return { success: false, error: "Download cancelled" };
    }
    onProgress?.({
      phase: "preparing",
      current: 0,
      total: 1,
      percentage: 0,
      filename
    });
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      if (signal) {
        signal.addEventListener("abort", () => controller.abort());
      }
      const response = await fetch(url, {
        signal: controller.signal,
        mode: "cors",
        credentials: "omit"
      });
      clearTimeout(timeoutId);
      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }
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
              filename
            });
          }
        }
        blob = new Blob(chunks, {
          type: response.headers.get("content-type") || "application/octet-stream"
        });
      } else {
        blob = await response.blob();
      }
      const blobUrl = URL.createObjectURL(blob);
      try {
        await triggerAnchorDownload(blobUrl, filename);
        onProgress?.({
          phase: "complete",
          current: 1,
          total: 1,
          percentage: 100,
          filename
        });
        logger$2.debug(`[FallbackDownload] Download complete: ${filename}`);
        return { success: true, filename };
      } finally {
        URL.revokeObjectURL(blobUrl);
      }
    } catch (error) {
      const errorMsg = getErrorMessage(error);
      if (errorMsg.includes("abort") || errorMsg.includes("cancel")) {
        return { success: false, error: "Download cancelled" };
      }
      logger$2.error("[FallbackDownload] Download failed:", error);
      onProgress?.({
        phase: "complete",
        current: 1,
        total: 1,
        percentage: 0,
        filename
      });
      return { success: false, error: errorMsg };
    }
  }
  async function triggerAnchorDownload(url, filename) {
    return new Promise((resolve, reject) => {
      try {
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = filename;
        anchor.style.display = "none";
        document.body.appendChild(anchor);
        anchor.click();
        setTimeout(() => {
          document.body.removeChild(anchor);
          resolve();
        }, 100);
      } catch (error) {
        reject(error);
      }
    });
  }
  async function downloadBlobWithAnchor(blob, filename, options = {}) {
    const { onProgress } = options;
    onProgress?.({
      phase: "preparing",
      current: 0,
      total: 1,
      percentage: 0,
      filename
    });
    const blobUrl = URL.createObjectURL(blob);
    try {
      await triggerAnchorDownload(blobUrl, filename);
      onProgress?.({
        phase: "complete",
        current: 1,
        total: 1,
        percentage: 100,
        filename
      });
      logger$2.debug(`[FallbackDownload] Blob download complete: ${filename}`);
      return { success: true, filename };
    } catch (error) {
      const errorMsg = getErrorMessage(error);
      logger$2.error("[FallbackDownload] Blob download failed:", error);
      onProgress?.({
        phase: "complete",
        current: 1,
        total: 1,
        percentage: 0,
        filename
      });
      return { success: false, error: errorMsg };
    } finally {
      URL.revokeObjectURL(blobUrl);
    }
  }

  function sanitize(name) {
    const sanitized = name.replace(/[<>:"/\\|?*]/g, "_").replace(/^[\s.]+|[\s.]+$/g, "").slice(0, 255);
    return sanitized || "media";
  }
  function getExtension(url) {
    try {
      const path = url.split("?")[0];
      if (!path) return "jpg";
      const ext = path.split(".").pop();
      if (ext && /^(jpg|jpeg|png|gif|webp|mp4|mov|avi)$/i.test(ext)) {
        return ext.toLowerCase();
      }
    } catch {
    }
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
      if (media.tweetUsername && media.tweetUsername !== "unknown") {
        username = media.tweetUsername;
      } else {
        const url = ("originalUrl" in media ? media.originalUrl : null) || media.url;
        if (typeof url === "string") {
          username = extractUsernameFromUrl(url, { strictHost: true });
        }
      }
    }
    if (!username && fallbackUsername) {
      username = fallbackUsername;
    }
    return { username, tweetId };
  }
  function generateMediaFilename(media, options = {}) {
    try {
      if (media.filename) {
        return sanitize(media.filename);
      }
      const originalUrl = media.originalUrl;
      const extension = options.extension ?? getExtension(originalUrl ?? media.url);
      const index = getIndexFromMediaId(media.id) ?? normalizeIndex(options.index);
      const { username, tweetId } = resolveMetadata(media, options.fallbackUsername);
      if (username && tweetId) {
        return sanitize(`${username}_${tweetId}_${index}.${extension}`);
      }
      if (tweetId && /^\d+$/.test(tweetId)) {
        return sanitize(`tweet_${tweetId}_${index}.${extension}`);
      }
      const prefix = options.fallbackPrefix ?? "media";
      return sanitize(`${prefix}_${Date.now()}_${index}.${extension}`);
    } catch {
      return `media_${Date.now()}.${options.extension || "jpg"}`;
    }
  }
  function generateZipFilename(mediaItems, options = {}) {
    try {
      const firstItem = mediaItems[0];
      if (firstItem) {
        const { username, tweetId } = resolveMetadata(firstItem);
        if (username && tweetId) {
          return sanitize(`${username}_${tweetId}.zip`);
        }
      }
      const prefix = options.fallbackPrefix ?? "xcom_gallery";
      return sanitize(`${prefix}_${Date.now()}.zip`);
    } catch {
      return `download_${Date.now()}.zip`;
    }
  }

  async function downloadSingleFile(media, options = {}, capability) {
    if (options.signal?.aborted) {
      return { success: false, error: "User cancelled download" };
    }
    const filename = generateMediaFilename(media);
    const effectiveCapability = capability ?? detectDownloadCapability();
    if (effectiveCapability.method === "fetch_blob") {
      logger$2.debug("[SingleDownload] Using fetch+blob fallback (GM_download not available)");
      if (options.blob) {
        return downloadBlobWithAnchor(options.blob, filename, {
          onProgress: options.onProgress
        });
      }
      return downloadWithFetchBlob(media.url, filename, {
        signal: options.signal,
        onProgress: options.onProgress,
        timeout: 3e4
      });
    }
    if (effectiveCapability.method === "none") {
      return {
        success: false,
        error: "No download method available in this environment"
      };
    }
    const gmDownload = effectiveCapability.gmDownload;
    if (!gmDownload) {
      return {
        success: false,
        error: "GM_download not available"
      };
    }
    let url = media.url;
    let isBlobUrl = false;
    if (options.blob) {
      url = URL.createObjectURL(options.blob);
      isBlobUrl = true;
    }
    return new Promise((resolve) => {
      const cleanup = () => {
        if (isBlobUrl) {
          URL.revokeObjectURL(url);
        }
        globalTimerManager.clearTimeout(timer);
      };
      const timer = globalTimerManager.setTimeout(() => {
        options.onProgress?.({
          phase: "complete",
          current: 1,
          total: 1,
          percentage: 0
        });
        cleanup();
        resolve({ success: false, error: "Download timeout" });
      }, 3e4);
      try {
        gmDownload({
          url,
          name: filename,
          onload: () => {
            logger$2.debug(`[SingleDownload] Download complete: ${filename}`);
            options.onProgress?.({
              phase: "complete",
              current: 1,
              total: 1,
              percentage: 100
            });
            cleanup();
            resolve({ success: true, filename });
          },
          onerror: (error) => {
            const errorMsg = getErrorMessage(error);
            logger$2.error("[SingleDownload] Download failed:", error);
            options.onProgress?.({
              phase: "complete",
              current: 1,
              total: 1,
              percentage: 0
            });
            cleanup();
            resolve({ success: false, error: errorMsg });
          },
          ontimeout: () => {
            options.onProgress?.({
              phase: "complete",
              current: 1,
              total: 1,
              percentage: 0
            });
            cleanup();
            resolve({ success: false, error: "Download timeout" });
          },
          onprogress: (progress) => {
            if (options.onProgress && progress.total > 0) {
              options.onProgress({
                phase: "downloading",
                current: 1,
                total: 1,
                percentage: Math.round(progress.loaded / progress.total * 100)
              });
            }
          }
        });
      } catch (error) {
        const errorMsg = getErrorMessage(error);
        cleanup();
        resolve({ success: false, error: errorMsg });
      }
    });
  }

  const DEFAULT_BACKOFF_BASE_MS = 200;
  async function sleep(ms, signal) {
    if (ms <= 0) return;
    return new Promise((resolve, reject) => {
      const timer = globalTimerManager.setTimeout(() => {
        cleanup();
        resolve();
      }, ms);
      const onAbort = () => {
        cleanup();
        reject(new Error("Download cancelled by user"));
      };
      const cleanup = () => {
        globalTimerManager.clearTimeout(timer);
        signal?.removeEventListener("abort", onAbort);
      };
      if (signal) signal.addEventListener("abort", onAbort);
    });
  }
  async function fetchArrayBufferWithRetry(url, retries, signal, backoffBaseMs = DEFAULT_BACKOFF_BASE_MS) {
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
        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }
        return new Uint8Array(response.data);
      } catch (err) {
        if (attempt >= retries) throw err;
        attempt += 1;
        const delay = Math.max(0, Math.floor(backoffBaseMs * 2 ** (attempt - 1)));
        await sleep(delay, signal);
      }
    }
  }

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

  async function downloadAsZip(items, options = {}) {
    const { StreamingZipWriter } = await Promise.resolve().then(function () { return index$1; });
    const writer = new StreamingZipWriter();
    const concurrency = Math.min(8, Math.max(1, options.concurrency ?? 6));
    const retries = Math.max(0, options.retries ?? 0);
    const abortSignal = options.signal;
    const total = items.length;
    let processed = 0;
    let successful = 0;
    const failures = [];
    const usedFilenames = [];
    const ensureUniqueFilename = ensureUniqueFilenameFactory();
    let currentIndex = 0;
    const runNext = async () => {
      while (currentIndex < total) {
        if (abortSignal?.aborted) return;
        const index = currentIndex++;
        const item = items[index];
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
          } else {
            data = await fetchArrayBufferWithRetry(
              item.url,
              retries,
              abortSignal,
              DEFAULT_BACKOFF_BASE_MS
            );
          }
          const filename = ensureUniqueFilename(item.desiredName);
          writer.addFile(filename, data);
          usedFilenames.push(filename);
          successful++;
        } catch (error) {
          if (abortSignal?.aborted) throw new Error("Download cancelled by user");
          failures.push({ url: item.url, error: getErrorMessage(error) });
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

  class DownloadOrchestrator {
    lifecycle;
    static singleton = createSingleton(() => new DownloadOrchestrator());
    /** Cached download capability detection (lazy initialized) */
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
    /**
     * Reset singleton instance (for testing only)
     * @internal
     */
    static resetForTests() {
      DownloadOrchestrator.singleton.reset();
    }
    /** Initialize service (idempotent, fail-fast on error) */
    async initialize() {
      return this.lifecycle.initialize();
    }
    /** Destroy service (idempotent, graceful on error) */
    destroy() {
      this.lifecycle.destroy();
    }
    /** Check if service is initialized */
    isInitialized() {
      return this.lifecycle.isInitialized();
    }
    async onInitialize() {
      logger$2.debug("[DownloadOrchestrator] Initialized");
    }
    onDestroy() {
      this.capability = null;
    }
    /**
     * Get download capability (cached)
     */
    getCapability() {
      if (!this.capability) {
        this.capability = detectDownloadCapability();
      }
      return this.capability;
    }
    /**
     * Download a single media file
     *
     * @param media - Media info containing URL and metadata
     * @param options - Download options (signal, progress callback)
     * @returns Download result with success status
     */
    async downloadSingle(media, options = {}) {
      const capability = this.getCapability();
      return downloadSingleFile(media, options, capability);
    }
    /**
     * Download multiple media files as a ZIP archive
     *
     * @param mediaItems - Array of media items to download
     * @param options - Download options including optional zipFilename
     * @returns Bulk download result with per-file status
     */
    async downloadBulk(mediaItems, options = {}) {
      const items = mediaItems.map((media) => ({
        url: media.url,
        desiredName: generateMediaFilename(media),
        blob: options.prefetchedBlobs?.get(media.url)
      }));
      try {
        const result = await downloadAsZip(items, options);
        if (result.filesSuccessful === 0) {
          return {
            success: false,
            status: "error",
            filesProcessed: items.length,
            filesSuccessful: 0,
            error: "No files downloaded",
            failures: result.failures,
            code: ErrorCode.ALL_FAILED
          };
        }
        const zipBlob = new Blob([result.zipData], {
          type: "application/zip"
        });
        const filename = options.zipFilename || generateZipFilename(mediaItems);
        const saveResult = await this.saveZipBlob(zipBlob, filename, options);
        if (!saveResult.success) {
          return {
            success: false,
            status: "error",
            filesProcessed: items.length,
            filesSuccessful: result.filesSuccessful,
            error: saveResult.error || "Failed to save ZIP file",
            failures: result.failures,
            code: ErrorCode.ALL_FAILED
          };
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
        return {
          success: false,
          status: "error",
          filesProcessed: items.length,
          filesSuccessful: 0,
          error: error instanceof Error ? error.message : "Unknown error",
          code: ErrorCode.ALL_FAILED
        };
      }
    }
    /**
     * Save ZIP blob using the detected download method
     * @internal
     */
    async saveZipBlob(zipBlob, filename, options) {
      const capability = this.getCapability();
      if (capability.method === "gm_download" && capability.gmDownload) {
        return this.saveWithGMDownload(capability.gmDownload, zipBlob, filename);
      }
      if (capability.method === "fetch_blob") {
        logger$2.debug("[DownloadOrchestrator] Using anchor fallback for ZIP download");
        const fallbackResult = await downloadBlobWithAnchor(zipBlob, filename, {
          onProgress: options.onProgress
        });
        return fallbackResult.error ? { success: fallbackResult.success, error: fallbackResult.error } : { success: fallbackResult.success };
      }
      return { success: false, error: "No download method available" };
    }
    /**
     * Save blob using GM_download
     * @internal
     */
    async saveWithGMDownload(gmDownload, blob, filename) {
      const url = URL.createObjectURL(blob);
      try {
        await new Promise((resolve, reject) => {
          gmDownload({
            url,
            name: filename,
            onload: () => resolve(),
            onerror: (err) => reject(err),
            ontimeout: () => reject(new Error("Timeout"))
          });
        });
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "GM_download failed"
        };
      } finally {
        URL.revokeObjectURL(url);
      }
    }
  }

  var downloadOrchestrator = {
    __proto__: null,
    DownloadOrchestrator: DownloadOrchestrator
  };

  async function registerCoreServices() {
    const core = CoreService.getInstance();
    core.register(SERVICE_KEYS.THEME, getThemeServiceInstance());
    core.register(SERVICE_KEYS.LANGUAGE, getLanguageServiceInstance());
    core.register(SERVICE_KEYS.MEDIA_SERVICE, getMediaServiceInstance());
  }

  var serviceInitialization = {
    __proto__: null,
    registerCoreServices: registerCoreServices
  };

  let downloadServiceRegistered = false;
  async function ensureDownloadServiceRegistered() {
    if (downloadServiceRegistered) {
      return;
    }
    try {
      const { DownloadOrchestrator } = await Promise.resolve().then(function () { return downloadOrchestrator; });
      const downloadService = DownloadOrchestrator.getInstance();
      const { CoreService } = await Promise.resolve().then(function () { return serviceManager; });
      const { SERVICE_KEYS } = await Promise.resolve().then(function () { return index$3; });
      const serviceManager$1 = CoreService.getInstance();
      serviceManager$1.register(SERVICE_KEYS.GALLERY_DOWNLOAD, downloadService);
      serviceManager$1.register(SERVICE_KEYS.BULK_DOWNLOAD, downloadService);
      downloadServiceRegistered = true;
      logger$2.info("✅ DownloadService lazily registered (first download)");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger$2.error("❌ Failed to lazily register DownloadService:", message);
      throw error;
    }
  }

  var lazyServices = {
    __proto__: null,
    ensureDownloadServiceRegistered: ensureDownloadServiceRegistered
  };

  const sharedConfig = {
    context: undefined,
    registry: undefined,
    effects: undefined,
    done: false,
    getContextId() {
      return getContextId(this.context.count);
    },
    getNextContextId() {
      return getContextId(this.context.count++);
    }
  };
  function getContextId(count) {
    const num = String(count),
      len = num.length - 1;
    return sharedConfig.context.id + (len ? String.fromCharCode(96 + len) : "") + num;
  }
  function setHydrateContext(context) {
    sharedConfig.context = context;
  }
  const equalFn = (a, b) => a === b;
  const $PROXY = Symbol("solid-proxy");
  const SUPPORTS_PROXY = typeof Proxy === "function";
  const signalOptions = {
    equals: equalFn
  };
  let ERROR = null;
  let runEffects = runQueue;
  const STALE = 1;
  const PENDING = 2;
  const UNOWNED = {
    owned: null,
    cleanups: null,
    context: null,
    owner: null
  };
  const NO_INIT = {};
  var Owner = null;
  let Listener = null;
  let Updates = null;
  let Effects = null;
  let ExecCount = 0;
  function createRoot(fn, detachedOwner) {
    const listener = Listener,
      owner = Owner,
      unowned = fn.length === 0,
      current = detachedOwner === undefined ? owner : detachedOwner,
      root = unowned ? UNOWNED : {
        owned: null,
        cleanups: null,
        context: current ? current.context : null,
        owner: current
      },
      updateFn = unowned ? fn : () => fn(() => untrack(() => cleanNode(root)));
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
      comparator: options.equals || undefined
    };
    const setter = value => {
      if (typeof value === "function") {
        value = value(s.value);
      }
      return writeSignal(s, value);
    };
    return [readSignal.bind(s), setter];
  }
  function createComputed(fn, value, options) {
    const c = createComputation(fn, value, true, STALE);
    updateComputation(c);
  }
  function createRenderEffect(fn, value, options) {
    const c = createComputation(fn, value, false, STALE);
    updateComputation(c);
  }
  function createEffect(fn, value, options) {
    runEffects = runUserEffects;
    const c = createComputation(fn, value, false, STALE),
      s = SuspenseContext && useContext(SuspenseContext);
    if (s) c.suspense = s;
    c.user = true;
    Effects ? Effects.push(c) : updateComputation(c);
  }
  function createMemo(fn, value, options) {
    options = options ? Object.assign({}, signalOptions, options) : signalOptions;
    const c = createComputation(fn, value, true, 0);
    c.observers = null;
    c.observerSlots = null;
    c.comparator = options.equals || undefined;
    updateComputation(c);
    return readSignal.bind(c);
  }
  function isPromise(v) {
    return v && typeof v === "object" && "then" in v;
  }
  function createResource(pSource, pFetcher, pOptions) {
    let source;
    let fetcher;
    let options;
    {
      source = true;
      fetcher = pSource;
      options = {};
    }
    let pr = null,
      initP = NO_INIT,
      id = null,
      scheduled = false,
      resolved = "initialValue" in options,
      dynamic = typeof source === "function" && createMemo(source);
    const contexts = new Set(),
      [value, setValue] = (options.storage || createSignal)(options.initialValue),
      [error, setError] = createSignal(undefined),
      [track, trigger] = createSignal(undefined, {
        equals: false
      }),
      [state, setState] = createSignal(resolved ? "ready" : "unresolved");
    if (sharedConfig.context) {
      id = sharedConfig.getNextContextId();
      if (options.ssrLoadFrom === "initial") initP = options.initialValue;else if (sharedConfig.load && sharedConfig.has(id)) initP = sharedConfig.load(id);
    }
    function loadEnd(p, v, error, key) {
      if (pr === p) {
        pr = null;
        key !== undefined && (resolved = true);
        if ((p === initP || v === initP) && options.onHydrated) queueMicrotask(() => options.onHydrated(key, {
          value: v
        }));
        initP = NO_INIT;
        completeLoad(v, error);
      }
      return v;
    }
    function completeLoad(v, err) {
      runUpdates(() => {
        if (err === undefined) setValue(() => v);
        setState(err !== undefined ? "errored" : resolved ? "ready" : "unresolved");
        setError(err);
        for (const c of contexts.keys()) c.decrement();
        contexts.clear();
      }, false);
    }
    function read() {
      const c = SuspenseContext && useContext(SuspenseContext),
        v = value(),
        err = error();
      if (err !== undefined && !pr) throw err;
      if (Listener && !Listener.user && c) {
        createComputed(() => {
          track();
          if (pr) {
            if (!contexts.has(c)) {
              c.increment();
              contexts.add(c);
            }
          }
        });
      }
      return v;
    }
    function load(refetching = true) {
      if (refetching !== false && scheduled) return;
      scheduled = false;
      const lookup = dynamic ? dynamic() : source;
      if (lookup == null || lookup === false) {
        loadEnd(pr, untrack(value));
        return;
      }
      let error;
      const p = initP !== NO_INIT ? initP : untrack(() => {
        try {
          return fetcher(lookup, {
            value: value(),
            refetching
          });
        } catch (fetcherError) {
          error = fetcherError;
        }
      });
      if (error !== undefined) {
        loadEnd(pr, undefined, castError(error), lookup);
        return;
      } else if (!isPromise(p)) {
        loadEnd(pr, p, undefined, lookup);
        return p;
      }
      pr = p;
      if ("v" in p) {
        if (p.s === 1) loadEnd(pr, p.v, undefined, lookup);else loadEnd(pr, undefined, castError(p.v), lookup);
        return p;
      }
      scheduled = true;
      queueMicrotask(() => scheduled = false);
      runUpdates(() => {
        setState(resolved ? "refreshing" : "pending");
        trigger();
      }, false);
      return p.then(v => loadEnd(p, v, undefined, lookup), e => loadEnd(p, undefined, castError(e), lookup));
    }
    Object.defineProperties(read, {
      state: {
        get: () => state()
      },
      error: {
        get: () => error()
      },
      loading: {
        get() {
          const s = state();
          return s === "pending" || s === "refreshing";
        }
      },
      latest: {
        get() {
          if (!resolved) return read();
          const err = error();
          if (err && !pr) throw err;
          return value();
        }
      }
    });
    let owner = Owner;
    if (dynamic) createComputed(() => (owner = Owner, load(false)));else load(false);
    return [read, {
      refetch: info => runWithOwner(owner, () => load(info)),
      mutate: setValue
    }];
  }
  function batch$1(fn) {
    return runUpdates(fn, false);
  }
  function untrack(fn) {
    if (Listener === null) return fn();
    const listener = Listener;
    Listener = null;
    try {
      return fn();
    } finally {
      Listener = listener;
    }
  }
  function on(deps, fn, options) {
    const isArray = Array.isArray(deps);
    let prevInput;
    let defer = options && options.defer;
    return prevValue => {
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
    if (Owner === null) ;else if (Owner.cleanups === null) Owner.cleanups = [fn];else Owner.cleanups.push(fn);
    return fn;
  }
  function catchError(fn, handler) {
    ERROR || (ERROR = Symbol("error"));
    Owner = createComputation(undefined, undefined, true);
    Owner.context = {
      ...Owner.context,
      [ERROR]: [handler]
    };
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
  function resumeEffects(e) {
    Effects.push.apply(Effects, e);
    e.length = 0;
  }
  function createContext(defaultValue, options) {
    const id = Symbol("context");
    return {
      id,
      Provider: createProvider(id),
      defaultValue
    };
  }
  function useContext(context) {
    let value;
    return Owner && Owner.context && (value = Owner.context[context.id]) !== undefined ? value : context.defaultValue;
  }
  function children(fn) {
    const children = createMemo(fn);
    const memo = createMemo(() => resolveChildren(children()));
    memo.toArray = () => {
      const c = memo();
      return Array.isArray(c) ? c : c != null ? [c] : [];
    };
    return memo;
  }
  let SuspenseContext;
  function getSuspenseContext() {
    return SuspenseContext || (SuspenseContext = createContext());
  }
  function readSignal() {
    if (this.sources && (this.state)) {
      if ((this.state) === STALE) updateComputation(this);else {
        const updates = Updates;
        Updates = null;
        runUpdates(() => lookUpstream(this), false);
        Updates = updates;
      }
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
    return this.value;
  }
  function writeSignal(node, value, isComp) {
    let current = node.value;
    if (!node.comparator || !node.comparator(current, value)) {
      node.value = value;
      if (node.observers && node.observers.length) {
        runUpdates(() => {
          for (let i = 0; i < node.observers.length; i += 1) {
            const o = node.observers[i];
            if (!o.state) {
              if (o.pure) Updates.push(o);else Effects.push(o);
              if (o.observers) markDownstream(o);
            }
            o.state = STALE;
          }
          if (Updates.length > 10e5) {
            Updates = [];
            throw new Error();
          }
        }, false);
      }
    }
    return value;
  }
  function updateComputation(node) {
    if (!node.fn) return;
    cleanNode(node);
    const time = ExecCount;
    runComputation(node, node.value, time);
  }
  function runComputation(node, value, time) {
    let nextValue;
    const owner = Owner,
      listener = Listener;
    Listener = Owner = node;
    try {
      nextValue = node.fn(value);
    } catch (err) {
      if (node.pure) {
        {
          node.state = STALE;
          node.owned && node.owned.forEach(cleanNode);
          node.owned = null;
        }
      }
      node.updatedAt = time + 1;
      return handleError(err);
    } finally {
      Listener = listener;
      Owner = owner;
    }
    if (!node.updatedAt || node.updatedAt <= time) {
      if (node.updatedAt != null && "observers" in node) {
        writeSignal(node, nextValue);
      } else node.value = nextValue;
      node.updatedAt = time;
    }
  }
  function createComputation(fn, init, pure, state = STALE, options) {
    const c = {
      fn,
      state: state,
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
    if (Owner === null) ;else if (Owner !== UNOWNED) {
      {
        if (!Owner.owned) Owner.owned = [c];else Owner.owned.push(c);
      }
    }
    return c;
  }
  function runTop(node) {
    if ((node.state) === 0) return;
    if ((node.state) === PENDING) return lookUpstream(node);
    if (node.suspense && untrack(node.suspense.inFallback)) return node.suspense.effects.push(node);
    const ancestors = [node];
    while ((node = node.owner) && (!node.updatedAt || node.updatedAt < ExecCount)) {
      if (node.state) ancestors.push(node);
    }
    for (let i = ancestors.length - 1; i >= 0; i--) {
      node = ancestors[i];
      if ((node.state) === STALE) {
        updateComputation(node);
      } else if ((node.state) === PENDING) {
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
    if (Effects) wait = true;else Effects = [];
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
      runQueue(Updates);
      Updates = null;
    }
    if (wait) return;
    const e = Effects;
    Effects = null;
    if (e.length) runUpdates(() => runEffects(e), false);
  }
  function runQueue(queue) {
    for (let i = 0; i < queue.length; i++) runTop(queue[i]);
  }
  function runUserEffects(queue) {
    let i,
      userLength = 0;
    for (i = 0; i < queue.length; i++) {
      const e = queue[i];
      if (!e.user) runTop(e);else queue[userLength++] = e;
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
    node.state = 0;
    for (let i = 0; i < node.sources.length; i += 1) {
      const source = node.sources[i];
      if (source.sources) {
        const state = source.state;
        if (state === STALE) {
          if (source !== ignore && (!source.updatedAt || source.updatedAt < ExecCount)) runTop(source);
        } else if (state === PENDING) lookUpstream(source, ignore);
      }
    }
  }
  function markDownstream(node) {
    for (let i = 0; i < node.observers.length; i += 1) {
      const o = node.observers[i];
      if (!o.state) {
        o.state = PENDING;
        if (o.pure) Updates.push(o);else Effects.push(o);
        o.observers && markDownstream(o);
      }
    }
  }
  function cleanNode(node) {
    let i;
    if (node.sources) {
      while (node.sources.length) {
        const source = node.sources.pop(),
          index = node.sourceSlots.pop(),
          obs = source.observers;
        if (obs && obs.length) {
          const n = obs.pop(),
            s = source.observerSlots.pop();
          if (index < obs.length) {
            n.sourceSlots[s] = index;
            obs[index] = n;
            source.observerSlots[index] = s;
          }
        }
      }
    }
    if (node.tOwned) {
      for (i = node.tOwned.length - 1; i >= 0; i--) cleanNode(node.tOwned[i]);
      delete node.tOwned;
    }
    if (node.owned) {
      for (i = node.owned.length - 1; i >= 0; i--) cleanNode(node.owned[i]);
      node.owned = null;
    }
    if (node.cleanups) {
      for (i = node.cleanups.length - 1; i >= 0; i--) node.cleanups[i]();
      node.cleanups = null;
    }
    node.state = 0;
  }
  function castError(err) {
    if (err instanceof Error) return err;
    return new Error(typeof err === "string" ? err : "Unknown error", {
      cause: err
    });
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
    });else runErrors(error, fns, owner);
  }
  function resolveChildren(children) {
    if (typeof children === "function" && !children.length) return resolveChildren(children());
    if (Array.isArray(children)) {
      const results = [];
      for (let i = 0; i < children.length; i++) {
        const result = resolveChildren(children[i]);
        Array.isArray(result) ? results.push.apply(results, result) : results.push(result);
      }
      return results;
    }
    return children;
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
      }), undefined);
      return res;
    };
  }

  const FALLBACK = Symbol("fallback");
  function dispose(d) {
    for (let i = 0; i < d.length; i++) d[i]();
  }
  function mapArray(list, mapFn, options = {}) {
    let items = [],
      mapped = [],
      disposers = [],
      len = 0,
      indexes = mapFn.length > 1 ? [] : null;
    onCleanup(() => dispose(disposers));
    return () => {
      let newItems = list() || [],
        newLen = newItems.length,
        i,
        j;
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
            mapped[0] = createRoot(disposer => {
              disposers[0] = disposer;
              return options.fallback();
            });
            len = 1;
          }
        }
        else if (len === 0) {
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
          newIndices = new Map();
          newIndicesNext = new Array(newEnd + 1);
          for (j = newEnd; j >= start; j--) {
            item = newItems[j];
            i = newIndices.get(item);
            newIndicesNext[j] = i === undefined ? -1 : i;
            newIndices.set(item, j);
          }
          for (i = start; i <= end; i++) {
            item = items[i];
            j = newIndices.get(item);
            if (j !== undefined && j !== -1) {
              temp[j] = mapped[i];
              tempdisposers[j] = disposers[i];
              indexes && (tempIndexes[j] = indexes[i]);
              j = newIndicesNext[j];
              newIndices.set(item, j);
            } else disposers[i]();
          }
          for (j = start; j < newLen; j++) {
            if (j in temp) {
              mapped[j] = temp[j];
              disposers[j] = tempdisposers[j];
              if (indexes) {
                indexes[j] = tempIndexes[j];
                indexes[j](j);
              }
            } else mapped[j] = createRoot(mapper);
          }
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
  function createComponent(Comp, props) {
    return untrack(() => Comp(props || {}));
  }
  function trueFn() {
    return true;
  }
  const propTraps = {
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
  function resolveSource(s) {
    return !(s = typeof s === "function" ? s() : s) ? {} : s;
  }
  function resolveSources() {
    for (let i = 0, length = this.length; i < length; ++i) {
      const v = this[i]();
      if (v !== undefined) return v;
    }
  }
  function mergeProps(...sources) {
    let proxy = false;
    for (let i = 0; i < sources.length; i++) {
      const s = sources[i];
      proxy = proxy || !!s && $PROXY in s;
      sources[i] = typeof s === "function" ? (proxy = true, createMemo(s)) : s;
    }
    if (SUPPORTS_PROXY && proxy) {
      return new Proxy({
        get(property) {
          for (let i = sources.length - 1; i >= 0; i--) {
            const v = resolveSource(sources[i])[property];
            if (v !== undefined) return v;
          }
        },
        has(property) {
          for (let i = sources.length - 1; i >= 0; i--) {
            if (property in resolveSource(sources[i])) return true;
          }
          return false;
        },
        keys() {
          const keys = [];
          for (let i = 0; i < sources.length; i++) keys.push(...Object.keys(resolveSource(sources[i])));
          return [...new Set(keys)];
        }
      }, propTraps);
    }
    const sourcesMap = {};
    const defined = Object.create(null);
    for (let i = sources.length - 1; i >= 0; i--) {
      const source = sources[i];
      if (!source) continue;
      const sourceKeys = Object.getOwnPropertyNames(source);
      for (let i = sourceKeys.length - 1; i >= 0; i--) {
        const key = sourceKeys[i];
        if (key === "__proto__" || key === "constructor") continue;
        const desc = Object.getOwnPropertyDescriptor(source, key);
        if (!defined[key]) {
          defined[key] = desc.get ? {
            enumerable: true,
            configurable: true,
            get: resolveSources.bind(sourcesMap[key] = [desc.get.bind(source)])
          } : desc.value !== undefined ? desc : undefined;
        } else {
          const sources = sourcesMap[key];
          if (sources) {
            if (desc.get) sources.push(desc.get.bind(source));else if (desc.value !== undefined) sources.push(() => desc.value);
          }
        }
      }
    }
    const target = {};
    const definedKeys = Object.keys(defined);
    for (let i = definedKeys.length - 1; i >= 0; i--) {
      const key = definedKeys[i],
        desc = defined[key];
      if (desc && desc.get) Object.defineProperty(target, key, desc);else target[key] = desc ? desc.value : undefined;
    }
    return target;
  }
  function splitProps(props, ...keys) {
    const len = keys.length;
    if (SUPPORTS_PROXY && $PROXY in props) {
      const blocked = len > 1 ? keys.flat() : keys[0];
      const res = keys.map(k => {
        return new Proxy({
          get(property) {
            return k.includes(property) ? props[property] : undefined;
          },
          has(property) {
            return k.includes(property) && property in props;
          },
          keys() {
            return k.filter(property => property in props);
          }
        }, propTraps);
      });
      res.push(new Proxy({
        get(property) {
          return blocked.includes(property) ? undefined : props[property];
        },
        has(property) {
          return blocked.includes(property) ? false : property in props;
        },
        keys() {
          return Object.keys(props).filter(k => !blocked.includes(k));
        }
      }, propTraps));
      return res;
    }
    const objects = [];
    for (let i = 0; i <= len; i++) {
      objects[i] = {};
    }
    for (const propName of Object.getOwnPropertyNames(props)) {
      let keyIndex = len;
      for (let i = 0; i < keys.length; i++) {
        if (keys[i].includes(propName)) {
          keyIndex = i;
          break;
        }
      }
      const desc = Object.getOwnPropertyDescriptor(props, propName);
      const isDefaultDesc = !desc.get && !desc.set && desc.enumerable && desc.writable && desc.configurable;
      isDefaultDesc ? objects[keyIndex][propName] = desc.value : Object.defineProperty(objects[keyIndex], propName, desc);
    }
    return objects;
  }
  function lazy(fn) {
    let comp;
    let p;
    const wrap = props => {
      const ctx = sharedConfig.context;
      if (ctx) {
        const [s, set] = createSignal();
        sharedConfig.count || (sharedConfig.count = 0);
        sharedConfig.count++;
        (p || (p = fn())).then(mod => {
          !sharedConfig.done && setHydrateContext(ctx);
          sharedConfig.count--;
          set(() => mod.default);
          setHydrateContext();
        });
        comp = s;
      } else if (!comp) {
        const [s] = createResource(() => (p || (p = fn())).then(mod => mod.default));
        comp = s;
      }
      let Comp;
      return createMemo(() => (Comp = comp()) ? untrack(() => {
        if (!ctx || sharedConfig.done) return Comp(props);
        const c = sharedConfig.context;
        setHydrateContext(ctx);
        const r = Comp(props);
        setHydrateContext(c);
        return r;
      }) : "");
    };
    wrap.preload = () => p || ((p = fn()).then(mod => comp = () => mod.default), p);
    return wrap;
  }

  const narrowedError = name => `Stale read from <${name}>.`;
  function For(props) {
    const fallback = "fallback" in props && {
      fallback: () => props.fallback
    };
    return createMemo(mapArray(() => props.each, props.children, fallback || undefined));
  }
  function Show(props) {
    const keyed = props.keyed;
    const conditionValue = createMemo(() => props.when, undefined, undefined);
    const condition = keyed ? conditionValue : createMemo(conditionValue, undefined, {
      equals: (a, b) => !a === !b
    });
    return createMemo(() => {
      const c = condition();
      if (c) {
        const child = props.children;
        const fn = typeof child === "function" && child.length > 0;
        return fn ? untrack(() => child(keyed ? c : () => {
          if (!untrack(condition)) throw narrowedError("Show");
          return conditionValue();
        })) : child;
      }
      return props.fallback;
    }, undefined, undefined);
  }
  function Switch(props) {
    const chs = children(() => props.children);
    const switchFunc = createMemo(() => {
      const ch = chs();
      const mps = Array.isArray(ch) ? ch : [ch];
      let func = () => undefined;
      for (let i = 0; i < mps.length; i++) {
        const index = i;
        const mp = mps[i];
        const prevFunc = func;
        const conditionValue = createMemo(() => prevFunc() ? undefined : mp.when, undefined, undefined);
        const condition = mp.keyed ? conditionValue : createMemo(conditionValue, undefined, {
          equals: (a, b) => !a === !b
        });
        func = () => prevFunc() || (condition() ? [index, conditionValue, mp] : undefined);
      }
      return func;
    });
    return createMemo(() => {
      const sel = switchFunc()();
      if (!sel) return props.fallback;
      const [index, conditionValue, mp] = sel;
      const child = mp.children;
      const fn = typeof child === "function" && child.length > 0;
      return fn ? untrack(() => child(mp.keyed ? conditionValue() : () => {
        if (untrack(switchFunc)()?.[0] !== index) throw narrowedError("Match");
        return conditionValue();
      })) : child;
    }, undefined, undefined);
  }
  function Match(props) {
    return props;
  }
  let Errors;
  function ErrorBoundary$1(props) {
    let err;
    if (sharedConfig.context && sharedConfig.load) err = sharedConfig.load(sharedConfig.getContextId());
    const [errored, setErrored] = createSignal(err, undefined);
    Errors || (Errors = new Set());
    Errors.add(setErrored);
    onCleanup(() => Errors.delete(setErrored));
    return createMemo(() => {
      let e;
      if (e = errored()) {
        const f = props.fallback;
        return typeof f === "function" && f.length ? untrack(() => f(e, () => setErrored())) : f;
      }
      return catchError(() => props.children, setErrored);
    }, undefined, undefined);
  }
  const SuspenseListContext = /* #__PURE__ */createContext();
  function Suspense(props) {
    let counter = 0,
      show,
      ctx,
      p,
      flicker,
      error;
    const [inFallback, setFallback] = createSignal(false),
      SuspenseContext = getSuspenseContext(),
      store = {
        increment: () => {
          if (++counter === 1) setFallback(true);
        },
        decrement: () => {
          if (--counter === 0) setFallback(false);
        },
        inFallback,
        effects: [],
        resolved: false
      },
      owner = getOwner();
    if (sharedConfig.context && sharedConfig.load) {
      const key = sharedConfig.getContextId();
      let ref = sharedConfig.load(key);
      if (ref) {
        if (typeof ref !== "object" || ref.s !== 1) p = ref;else sharedConfig.gather(key);
      }
      if (p && p !== "$$f") {
        const [s, set] = createSignal(undefined, {
          equals: false
        });
        flicker = s;
        p.then(() => {
          if (sharedConfig.done) return set();
          sharedConfig.gather(key);
          setHydrateContext(ctx);
          set();
          setHydrateContext();
        }, err => {
          error = err;
          set();
        });
      }
    }
    const listContext = useContext(SuspenseListContext);
    if (listContext) show = listContext.register(store.inFallback);
    let dispose;
    onCleanup(() => dispose && dispose());
    return createComponent(SuspenseContext.Provider, {
      value: store,
      get children() {
        return createMemo(() => {
          if (error) throw error;
          ctx = sharedConfig.context;
          if (flicker) {
            flicker();
            return flicker = undefined;
          }
          if (ctx && p === "$$f") setHydrateContext();
          const rendered = createMemo(() => props.children);
          return createMemo(prev => {
            const inFallback = store.inFallback(),
              {
                showContent = true,
                showFallback = true
              } = show ? show() : {};
            if ((!inFallback || p && p !== "$$f") && showContent) {
              store.resolved = true;
              dispose && dispose();
              dispose = ctx = p = undefined;
              resumeEffects(store.effects);
              return rendered();
            }
            if (!showFallback) return;
            if (dispose) return prev;
            return createRoot(disposer => {
              dispose = disposer;
              if (ctx) {
                setHydrateContext({
                  id: ctx.id + "F",
                  count: 0
                });
                ctx = undefined;
              }
              return props.fallback;
            }, owner);
          });
        });
      }
    });
  }

  const booleans = ["allowfullscreen", "async", "alpha",
  "autofocus",
  "autoplay", "checked", "controls", "default", "disabled", "formnovalidate", "hidden",
  "indeterminate", "inert",
  "ismap", "loop", "multiple", "muted", "nomodule", "novalidate", "open", "playsinline", "readonly", "required", "reversed", "seamless",
  "selected", "adauctionheaders",
  "browsingtopics",
  "credentialless",
  "defaultchecked", "defaultmuted", "defaultselected", "defer", "disablepictureinpicture", "disableremoteplayback", "preservespitch",
  "shadowrootclonable", "shadowrootcustomelementregistry",
  "shadowrootdelegatesfocus", "shadowrootserializable",
  "sharedstoragewritable"
  ];
  const Properties = new Set([
  "className", "value",
  "readOnly", "noValidate", "formNoValidate", "isMap", "noModule", "playsInline", "adAuctionHeaders",
  "allowFullscreen", "browsingTopics",
  "defaultChecked", "defaultMuted", "defaultSelected", "disablePictureInPicture", "disableRemotePlayback", "preservesPitch", "shadowRootClonable", "shadowRootCustomElementRegistry",
  "shadowRootDelegatesFocus", "shadowRootSerializable",
  "sharedStorageWritable",
  ...booleans]);
  const ChildProperties = new Set(["innerHTML", "textContent", "innerText", "children"]);
  const Aliases = Object.assign(Object.create(null), {
    className: "class",
    htmlFor: "for"
  });
  const PropAliases = Object.assign(Object.create(null), {
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
  function getPropAlias(prop, tagName) {
    const a = PropAliases[prop];
    return typeof a === "object" ? a[tagName] ? a["$"] : undefined : a;
  }
  const DelegatedEvents = new Set(["beforeinput", "click", "dblclick", "contextmenu", "focusin", "focusout", "input", "keydown", "keyup", "mousedown", "mousemove", "mouseout", "mouseover", "mouseup", "pointerdown", "pointermove", "pointerout", "pointerover", "pointerup", "touchend", "touchmove", "touchstart"]);
  const SVGNamespace = {
    xlink: "http://www.w3.org/1999/xlink",
    xml: "http://www.w3.org/XML/1998/namespace"
  };

  const memo = fn => createMemo(() => fn());

  function reconcileArrays(parentNode, a, b) {
    let bLength = b.length,
      aEnd = a.length,
      bEnd = bLength,
      aStart = 0,
      bStart = 0,
      after = a[aEnd - 1].nextSibling,
      map = null;
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
      } else if (bEnd === bStart) {
        while (aStart < aEnd) {
          if (!map || !map.has(a[aStart])) a[aStart].remove();
          aStart++;
        }
      } else if (a[aStart] === b[bEnd - 1] && b[bStart] === a[aEnd - 1]) {
        const node = a[--aEnd].nextSibling;
        parentNode.insertBefore(b[bStart++], a[aStart++].nextSibling);
        parentNode.insertBefore(b[--bEnd], node);
        a[aEnd] = b[bEnd];
      } else {
        if (!map) {
          map = new Map();
          let i = bStart;
          while (i < bEnd) map.set(b[i], i++);
        }
        const index = map.get(a[aStart]);
        if (index != null) {
          if (bStart < index && index < bEnd) {
            let i = aStart,
              sequence = 1,
              t;
            while (++i < aEnd && i < bEnd) {
              if ((t = map.get(a[i])) == null || t !== index + sequence) break;
              sequence++;
            }
            if (sequence > index - bStart) {
              const node = a[aStart];
              while (bStart < index) parentNode.insertBefore(b[bStart++], node);
            } else parentNode.replaceChild(b[bStart++], a[aStart++]);
          } else aStart++;
        } else a[aStart++].remove();
      }
    }
  }

  const $$EVENTS = "_$DX_DELEGATE";
  function render(code, element, init, options = {}) {
    let disposer;
    createRoot(dispose => {
      disposer = dispose;
      element === document ? code() : insert(element, code(), element.firstChild ? null : undefined, init);
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
    const e = document[$$EVENTS] || (document[$$EVENTS] = new Set());
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
    if (value == null) node.removeAttribute(name);else node.setAttribute(name, value);
  }
  function setAttributeNS(node, namespace, name, value) {
    if (isHydrating(node)) return;
    if (value == null) node.removeAttributeNS(namespace, name);else node.setAttributeNS(namespace, name, value);
  }
  function setBoolAttribute(node, name, value) {
    if (isHydrating(node)) return;
    value ? node.setAttribute(name, "") : node.removeAttribute(name);
  }
  function className(node, value) {
    if (isHydrating(node)) return;
    if (value == null) node.removeAttribute("class");else node.className = value;
  }
  function addEventListener(node, name, handler, delegate) {
    if (delegate) {
      if (Array.isArray(handler)) {
        node[`$$${name}`] = handler[0];
        node[`$$${name}Data`] = handler[1];
      } else node[`$$${name}`] = handler;
    } else if (Array.isArray(handler)) {
      const handlerFn = handler[0];
      node.addEventListener(name, handler[0] = e => handlerFn.call(node, handler[1], e));
    } else node.addEventListener(name, handler, typeof handler !== "function" && handler);
  }
  function classList(node, value, prev = {}) {
    const classKeys = Object.keys(value || {}),
      prevKeys = Object.keys(prev);
    let i, len;
    for (i = 0, len = prevKeys.length; i < len; i++) {
      const key = prevKeys[i];
      if (!key || key === "undefined" || value[key]) continue;
      toggleClassKey(node, key, false);
      delete prev[key];
    }
    for (i = 0, len = classKeys.length; i < len; i++) {
      const key = classKeys[i],
        classValue = !!value[key];
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
    typeof prev === "string" && (nodeStyle.cssText = prev = undefined);
    prev || (prev = {});
    value || (value = {});
    let v, s;
    for (s in prev) {
      value[s] == null && nodeStyle.removeProperty(s);
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
    createRenderEffect(() => typeof props.ref === "function" && use(props.ref, node));
    createRenderEffect(() => assign(node, props, isSVG, true, prevProps, true));
    return prevProps;
  }
  function use(fn, element, arg) {
    return untrack(() => fn(element, arg));
  }
  function insert(parent, accessor, marker, initial) {
    if (marker !== undefined && !initial) initial = [];
    if (typeof accessor !== "function") return insertExpression(parent, accessor, initial, marker);
    createRenderEffect(current => insertExpression(parent, accessor(), current, marker), initial);
  }
  function assign(node, props, isSVG, skipChildren, prevProps = {}, skipRef = false) {
    props || (props = {});
    for (const prop in prevProps) {
      if (!(prop in props)) {
        if (prop === "children") continue;
        prevProps[prop] = assignProp(node, prop, null, prevProps[prop], isSVG, skipRef, props);
      }
    }
    for (const prop in props) {
      if (prop === "children") {
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
    } else if (prop.slice(0, 5) === "attr:") {
      setAttribute(node, prop.slice(5), value);
    } else if (prop.slice(0, 5) === "bool:") {
      setBoolAttribute(node, prop.slice(5), value);
    } else if ((forceProp = prop.slice(0, 5) === "prop:") || (isChildProp = ChildProperties.has(prop)) || !isSVG && ((propAlias = getPropAlias(prop, node.tagName)) || (isProp = Properties.has(prop))) || (isCE = node.nodeName.includes("-") || "is" in props)) {
      if (forceProp) {
        prop = prop.slice(5);
        isProp = true;
      } else if (isHydrating(node)) return value;
      if (prop === "class" || prop === "className") className(node, value);else if (isCE && !isProp && !isChildProp) node[toPropertyName(prop)] = value;else node[propAlias || prop] = value;
    } else {
      const ns = isSVG && prop.indexOf(":") > -1 && SVGNamespace[prop.split(":")[0]];
      if (ns) setAttributeNS(node, ns, prop, value);else setAttribute(node, Aliases[prop] || prop, value);
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
    const retarget = value => Object.defineProperty(e, "target", {
      configurable: true,
      value
    });
    const handleNode = () => {
      const handler = node[key];
      if (handler && !node.disabled) {
        const data = node[`${key}Data`];
        data !== undefined ? handler.call(node, data, e) : handler.call(node, e);
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
        if (node.parentNode === oriCurrentTarget) {
          break;
        }
      }
    }
    else walkUpTree();
    retarget(oriTarget);
  }
  function insertExpression(parent, value, current, marker, unwrapArray) {
    const hydrating = isHydrating(parent);
    if (hydrating) {
      !current && (current = [...parent.childNodes]);
      let cleaned = [];
      for (let i = 0; i < current.length; i++) {
        const node = current[i];
        if (node.nodeType === 8 && node.data.slice(0, 2) === "!$") node.remove();else cleaned.push(node);
      }
      current = cleaned;
    }
    while (typeof current === "function") current = current();
    if (value === current) return current;
    const t = typeof value,
      multi = marker !== undefined;
    parent = multi && current[0] && current[0].parentNode || parent;
    if (t === "string" || t === "number") {
      if (hydrating) return current;
      if (t === "number") {
        value = value.toString();
        if (value === current) return current;
      }
      if (multi) {
        let node = current[0];
        if (node && node.nodeType === 3) {
          node.data !== value && (node.data = value);
        } else node = document.createTextNode(value);
        current = cleanChildren(parent, current, marker, node);
      } else {
        if (current !== "" && typeof current === "string") {
          current = parent.firstChild.data = value;
        } else current = parent.textContent = value;
      }
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
        if (marker === undefined) return current = [...parent.childNodes];
        let node = array[0];
        if (node.parentNode !== parent) return current;
        const nodes = [node];
        while ((node = node.nextSibling) !== marker) nodes.push(node);
        return current = nodes;
      }
      if (array.length === 0) {
        current = cleanChildren(parent, current, marker);
        if (multi) return current;
      } else if (currentArray) {
        if (current.length === 0) {
          appendNodes(parent, array, marker);
        } else reconcileArrays(parent, current, array);
      } else {
        current && cleanChildren(parent);
        appendNodes(parent, array);
      }
      current = array;
    } else if (value.nodeType) {
      if (hydrating && value.parentNode) return current = multi ? [value] : value;
      if (Array.isArray(current)) {
        if (multi) return current = cleanChildren(parent, current, marker, value);
        cleanChildren(parent, current, null, value);
      } else if (current == null || current === "" || !parent.firstChild) {
        parent.appendChild(value);
      } else parent.replaceChild(value, parent.firstChild);
      current = value;
    } else ;
    return current;
  }
  function normalizeIncomingArray(normalized, array, current, unwrap) {
    let dynamic = false;
    for (let i = 0, len = array.length; i < len; i++) {
      let item = array[i],
        prev = current && current[normalized.length],
        t;
      if (item == null || item === true || item === false) ; else if ((t = typeof item) === "object" && item.nodeType) {
        normalized.push(item);
      } else if (Array.isArray(item)) {
        dynamic = normalizeIncomingArray(normalized, item, prev) || dynamic;
      } else if (t === "function") {
        if (unwrap) {
          while (typeof item === "function") item = item();
          dynamic = normalizeIncomingArray(normalized, Array.isArray(item) ? item : [item], Array.isArray(prev) ? prev : [prev]) || dynamic;
        } else {
          normalized.push(item);
          dynamic = true;
        }
      } else {
        const value = String(item);
        if (prev && prev.nodeType === 3 && prev.data === value) normalized.push(prev);else normalized.push(document.createTextNode(value));
      }
    }
    return dynamic;
  }
  function appendNodes(parent, array, marker = null) {
    for (let i = 0, len = array.length; i < len; i++) parent.insertBefore(array[i], marker);
  }
  function cleanChildren(parent, current, marker, replacement) {
    if (marker === undefined) return parent.textContent = "";
    const node = replacement || document.createTextNode("");
    if (current.length) {
      let inserted = false;
      for (let i = current.length - 1; i >= 0; i--) {
        const el = current[i];
        if (node !== el) {
          const isParent = el.parentNode === parent;
          if (!inserted && !i) isParent ? parent.replaceChild(node, el) : parent.insertBefore(node, marker);else isParent && el.remove();
        } else inserted = true;
      }
    } else parent.insertBefore(node, marker);
    return [node];
  }

  var _tmpl$$a = /* @__PURE__ */ template(`<svg xmlns=http://www.w3.org/2000/svg viewBox="0 0 24 24"fill=none stroke="var(--xeg-icon-color, currentColor)"stroke-width=var(--xeg-icon-stroke-width) stroke-linecap=round stroke-linejoin=round>`);
  function Icon({
    size = "var(--xeg-icon-size)",
    className = "",
    children,
    "aria-label": ariaLabel,
    ...otherProps
  }) {
    const accessibilityProps = {};
    if (ariaLabel) {
      accessibilityProps.role = "img";
      accessibilityProps["aria-label"] = ariaLabel;
    } else {
      accessibilityProps["aria-hidden"] = "true";
    }
    const sizeValue = typeof size === "number" ? `${size}px` : size;
    return (() => {
      var _el$ = _tmpl$$a();
      setAttribute(_el$, "width", sizeValue);
      setAttribute(_el$, "height", sizeValue);
      setAttribute(_el$, "class", className);
      spread(_el$, mergeProps(accessibilityProps, otherProps), true);
      insert(_el$, children);
      return _el$;
    })();
  }

  const ICON_PATHS = {
    // Actions - Download
    download: "M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3",
    // Navigation arrows (compact)
    arrowSmallLeft: "M19.5 12H4.5m0 0l6.75 6.75M4.5 12l6.75-6.75",
    arrowSmallRight: "M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75",
    // Sizing - Fit modes
    arrowsPointingIn: "M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5M15 15l5.25 5.25",
    arrowsPointingOut: "M3.75 3.75v4.5m0-4.5h4.5M3.75 3.75L9 9m-5.25 11.25v-4.5m0 4.5h4.5M3.75 20.25L9 15m11.25-11.25h-4.5m4.5 0v4.5M20.25 3.75L15 9m5.25 11.25h-4.5m4.5 0v-4.5M20.25 20.25L15 15",
    arrowsRightLeft: "M7.5 21L3 16.5M3 16.5l4.5-4.5M3 16.5h13.5M16.5 3l4.5 4.5M21 7.5l-4.5 4.5M21 7.5H7.5",
    arrowsUpDown: "M3 7.5l4.5-4.5M7.5 3l4.5 4.5M7.5 3v13.5M21 16.5l-4.5 4.5M16.5 21l-4.5-4.5M16.5 21V7.5",
    // Download variants
    arrowDownOnSquareStack: "M7.5 7.5h-.75a2.25 2.25 0 00-2.25 2.25v7.5a2.25 2.25 0 002.25 2.25h7.5a2.25 2.25 0 002.25-2.25v-7.5a2.25 2.25 0 00-2.25-2.25h-.75m-6 3.75l3 3m0 0l3-3m-3 3V1.5m6 9h.75a2.25 2.25 0 012.25 2.25v7.5a2.25 2.25 0 01-2.25 2.25h-7.5a2.25 2.25 0 01-2.25-2.25v-.75",
    // Exit/Close
    arrowLeftOnRectangle: "M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m-3.75-6l-3 3m0 0l3 3m-3-3H21.75",
    // Communication
    chatBubbleLeftRight: "M20.25 8.511a1.5 1.5 0 011.5 1.497v4.286a1.5 1.5 0 01-1.33 1.488c-.31.025-.62.047-.93.064v3.091L15.75 17.25c-1.353 0-2.693-.055-4.02-.163a1.5 1.5 0 01-.825-.241m9.345-8.335a4.125 4.125 0 00-.477-.095A59.924 59.924 0 0015.75 8.25c-1.355 0-2.697.056-4.023.167A1.5 1.5 0 009.75 10.608v4.286c0 .838.46 1.582 1.155 1.952m9.345-8.335V6.637a3.375 3.375 0 00-2.76-3.235A60.508 60.508 0 0011.25 3C9.135 3 7.052 3.137 5.01 3.402A3.375 3.375 0 002.25 6.637v6.225a3.375 3.375 0 002.76 3.236c.577.075 1.157.14 1.74.194V21l4.155-4.155"
  };
  const MULTI_PATH_ICONS = {
    cog6Tooth: [
      "M9.593 3.94a1.125 1.125 0 011.11-.94h2.594a1.125 1.125 0 011.11.94l.214 1.281a1.125 1.125 0 00.644.87l.22.122a1.125 1.125 0 001.076-.053l1.216-.456a1.125 1.125 0 011.369.487l1.297 2.247a1.125 1.125 0 01-.259 1.41l-1.004.827a1.125 1.125 0 00-.429.908l.001.127v.255c0 .042 0 .084-.001.127a1.125 1.125 0 00.429.908l1.004.827a1.125 1.125 0 01.259 1.41l-1.297 2.246a1.125 1.125 0 01-1.369.488l-1.216-.457a1.125 1.125 0 00-1.076-.053l-.22.122a1.125 1.125 0 00-.644.87l-.214 1.281a1.125 1.125 0 01-1.11.94H10.703a1.125 1.125 0 01-1.11-.94l-.214-1.281a1.125 1.125 0 00-.644-.87l-.22-.122a1.125 1.125 0 00-1.076.053l-1.216.457a1.125 1.125 0 01-1.369-.488L3.757 15.38a1.125 1.125 0 01.259-1.41l1.005-.827a1.125 1.125 0 00.429-.908c0-.042-.001-.084-.001-.127v-.255c0-.042 0-.084.001-.127a1.125 1.125 0 00-.429-.908L4.016 9.81a1.125 1.125 0 01-.259-1.41l1.297-2.247a1.125 1.125 0 011.369-.487l1.216.456a1.125 1.125 0 001.076.052l.22-.121a1.125 1.125 0 00.644-.871L9.593 3.94z",
      "M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    ]
  };

  var _tmpl$$9 = /* @__PURE__ */ template(`<svg><path></svg>`, false, true, false);
  function createSinglePathIcon(name) {
    return function IconComponent(props) {
      return createComponent(Icon, mergeProps(props, {
        get children() {
          var _el$ = _tmpl$$9();
          createRenderEffect(() => setAttribute(_el$, "d", ICON_PATHS[name]));
          return _el$;
        }
      }));
    };
  }
  function createMultiPathIcon(name) {
    return function IconComponent(props) {
      return createComponent(Icon, mergeProps(props, {
        get children() {
          return createComponent(For, {
            get each() {
              return MULTI_PATH_ICONS[name];
            },
            children: (pathData) => (() => {
              var _el$2 = _tmpl$$9();
              setAttribute(_el$2, "d", pathData);
              return _el$2;
            })()
          });
        }
      }));
    };
  }
  const HeroDownload = createSinglePathIcon("download");
  const HeroArrowSmallLeft = createSinglePathIcon("arrowSmallLeft");
  const HeroArrowSmallRight = createSinglePathIcon("arrowSmallRight");
  const HeroArrowsPointingIn = createSinglePathIcon("arrowsPointingIn");
  const HeroArrowsPointingOut = createSinglePathIcon("arrowsPointingOut");
  const HeroArrowsRightLeft = createSinglePathIcon("arrowsRightLeft");
  const HeroArrowsUpDown = createSinglePathIcon("arrowsUpDown");
  const HeroArrowDownOnSquareStack = createSinglePathIcon("arrowDownOnSquareStack");
  const HeroArrowLeftOnRectangle = createSinglePathIcon("arrowLeftOnRectangle");
  const HeroChatBubbleLeftRight = createSinglePathIcon("chatBubbleLeftRight");
  const HeroCog6Tooth = createMultiPathIcon("cog6Tooth");

  function resolve(value) {
    return typeof value === "function" ? value() : value;
  }
  function resolveOptional(value) {
    if (value === void 0) {
      return void 0;
    }
    return resolve(value);
  }
  function toAccessor(value) {
    return typeof value === "function" ? value : () => value;
  }
  function toRequiredAccessor(resolver, fallback) {
    return () => {
      const value = resolver();
      const resolved = resolveOptional(value);
      return resolved ?? fallback;
    };
  }
  function toOptionalAccessor(resolver) {
    return () => resolveOptional(resolver());
  }

  const ENTITY_PATTERN = /(https?:\/\/[^\s]+|@[a-zA-Z0-9_]{1,15}|#[\p{L}\p{N}_]{1,50}|\$[A-Z]{1,6}(?:\.[A-Z]{1,2})?)/gu;
  function formatTweetText(text) {
    if (!text) return [];
    const tokens = [];
    const lines = text.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line) {
        if (i < lines.length - 1) {
          tokens.push({ type: "break" });
        }
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
          if (textContent) {
            tokens.push({ type: "text", content: textContent });
          }
        }
        tokens.push(createEntityToken(entity));
        lastIndex = matchIndex + entity.length;
      }
      if (lastIndex < line.length) {
        const textContent = line.slice(lastIndex);
        if (textContent) {
          tokens.push({ type: "text", content: textContent });
        }
      }
      if (i < lines.length - 1) {
        tokens.push({ type: "break" });
      }
    }
    return tokens;
  }
  function createEntityToken(entity) {
    if (entity.startsWith("http")) {
      return {
        type: "link",
        content: entity,
        href: entity
      };
    }
    if (entity.startsWith("@")) {
      const username = entity.slice(1);
      return {
        type: "mention",
        content: entity,
        href: `https://x.com/${username}`
      };
    }
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
      const encoded = encodeURIComponent(`$${symbol}`);
      return {
        type: "cashtag",
        content: entity,
        href: `https://x.com/search?q=${encoded}`
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
      if (base.length >= maxLength) {
        return `${base}${path}`;
      }
      if (segments.length <= 2 || path.length <= Math.min(20, Math.max(0, allowedPathLen))) {
        return `${base}${path}`;
      }
      if (url.length > maxLength && segments.length > 2) {
        const first = segments[0];
        const last = segments[segments.length - 1];
        return `${base}/${first}/.../${last}`;
      }
      return `${urlObj.protocol}//${domain}${path}`;
    } catch {
      return url.length > maxLength ? `${url.slice(0, maxLength)}...` : url;
    }
  }
  function cx(...inputs) {
    const classes = [];
    for (const input of inputs) {
      if (!input) continue;
      if (typeof input === "string") {
        classes.push(input);
      } else if (typeof input === "number") {
        classes.push(String(input));
      } else if (Array.isArray(input)) {
        const nested = cx(...input);
        if (nested) classes.push(nested);
      } else if (typeof input === "object") {
        for (const [key, value] of Object.entries(input)) {
          if (value) {
            classes.push(key);
          }
        }
      }
    }
    return classes.join(" ");
  }

  const unifiedButton = "xeg_fo-0dp";
  const sizeSm = "xeg_eGfiCS";
  const sizeMd = "xeg_HQ-pdQ";
  const sizeLg = "xeg_OlARDM";
  const variantPrimary = "xeg_QBM9Ik";
  const variantSecondary = "xeg_plglHX";
  const variantOutline = "xeg_wAOIqT";
  const variantGhost = "xeg_7vf19L";
  const variantDanger = "xeg_gY3mKU";
  const variantIcon = "xeg_hhXZtE";
  const variantToolbar = "xeg_w0xu8z";
  const variantNavigation = "xeg_X7avzn";
  const variantAction = "xeg_5VJv9K";
  const sizeToolbar = "xeg_ckEOwJ";
  const iconOnly = "xeg_XYc0m9";
  const intentPrimary = "xeg_n6NlCJ";
  const intentSuccess = "xeg_XOcWSO";
  const intentDanger = "xeg_-AdANz";
  const intentNeutral = "xeg_r7YJ-A";
  const loading$1 = "xeg_CfJMD-";
  const disabled = "xeg_PEieDK";
  const spinner = "xeg_243I8p";
  var styles$4 = {
  	unifiedButton: unifiedButton,
  	sizeSm: sizeSm,
  	sizeMd: sizeMd,
  	sizeLg: sizeLg,
  	variantPrimary: variantPrimary,
  	variantSecondary: variantSecondary,
  	variantOutline: variantOutline,
  	variantGhost: variantGhost,
  	variantDanger: variantDanger,
  	variantIcon: variantIcon,
  	variantToolbar: variantToolbar,
  	variantNavigation: variantNavigation,
  	variantAction: variantAction,
  	sizeToolbar: sizeToolbar,
  	iconOnly: iconOnly,
  	intentPrimary: intentPrimary,
  	intentSuccess: intentSuccess,
  	intentDanger: intentDanger,
  	intentNeutral: intentNeutral,
  	loading: loading$1,
  	disabled: disabled,
  	spinner: spinner
  };

  var _tmpl$$8 = /* @__PURE__ */ template(`<button>`), _tmpl$2$5 = /* @__PURE__ */ template(`<span aria-hidden=true>`);
  const defaultProps = {
    variant: "primary",
    size: "md",
    type: "button",
    iconOnly: false,
    disabled: false,
    loading: false
  };
  function Button(rawProps) {
    const props = mergeProps(defaultProps, rawProps);
    const [local, rest] = splitProps(props, ["children", "variant", "size", "intent", "iconOnly", "loading", "ref", "className", "class", "id", "type", "form", "autoFocus", "disabled", "tabIndex", "title", "onClick", "onMouseDown", "onMouseUp", "onFocus", "onBlur", "onKeyDown", "onMouseEnter", "onMouseLeave", "aria-label", "aria-labelledby", "aria-describedby", "aria-pressed", "aria-expanded", "aria-controls", "aria-haspopup", "aria-busy", "data-testid", "data-gallery-element", "data-disabled", "data-selected", "data-loading"]);
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
    const isLoading = createMemo(() => !!loadingAccessor());
    const isDisabled = createMemo(() => !!disabledAccessor() || isLoading());
    createEffect(() => {
      if (!iconOnlyAccessor()) return;
      const derived = ariaLabelAccessor() ?? ariaLabelledByAccessor() ?? titleAccessor();
      if (!derived) {
        logger$2.warn("Icon-only buttons must have accessible labels (aria-label or aria-labelledby).", {
          component: "UnifiedButton",
          variant: local.variant,
          iconOnly: true
        });
      }
    });
    onCleanup(() => {
      local.ref?.(null);
    });
    const [elementRef, setElementRef] = createSignal(null);
    const handleClick = (event) => {
      if (isDisabled() || isLoading()) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      local.onClick?.(event);
    };
    const handleMouseDown = (event) => {
      if (isDisabled()) {
        return;
      }
      local.onMouseDown?.(event);
    };
    const handleMouseUp = (event) => {
      if (isDisabled()) {
        return;
      }
      local.onMouseUp?.(event);
    };
    const handleKeyDown = (event) => {
      if (isDisabled()) {
        return;
      }
      local.onKeyDown?.(event);
    };
    const buttonClasses = () => cx(styles$4.unifiedButton, styles$4[`variant-${local.variant}`], styles$4[`size-${local.size}`], local.intent ? styles$4[`intent-${local.intent}`] : void 0, iconOnlyAccessor() ? styles$4.iconOnly : void 0, isLoading() ? styles$4.loading : void 0, isDisabled() ? styles$4.disabled : void 0, "xeg-inline-center", "xeg-gap-sm", typeof local.className === "function" ? local.className() : local.className, typeof local.class === "function" ? local.class() : local.class);
    const loadingClassName = styles$4.loading;
    createEffect(() => {
      const el = elementRef();
      const disabledNow = isDisabled();
      const loadingNow = isLoading();
      if (!el) return;
      el.disabled = disabledNow;
      el.setAttribute("aria-disabled", String(disabledNow));
      {
        el.classList.toggle(loadingClassName, loadingNow);
      }
    });
    return (() => {
      var _el$ = _tmpl$$8();
      use((element) => {
        setElementRef(element ?? null);
        if (typeof local.ref === "function") {
          local.ref(element ?? null);
        }
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
          return ariaBusyAccessor() ?? isLoading();
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
      }), false);
      insert(_el$, (() => {
        var _c$ = memo(() => !!isLoading());
        return () => _c$() && (() => {
          var _el$2 = _tmpl$2$5();
          createRenderEffect(() => className(_el$2, cx("xeg-spinner", styles$4.spinner)));
          return _el$2;
        })();
      })(), null);
      insert(_el$, () => local.children, null);
      return _el$;
    })();
  }

  const ALLOWED_ICON_SIZES = /* @__PURE__ */ new Set(["sm", "md", "lg", "toolbar"]);
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

  var _tmpl$$7 = /* @__PURE__ */ template(`<div style=height:7.5rem>`);
  const LazySettingsControls = lazy(() => Promise.resolve().then(function () { return SettingsControls$1; }).then((module) => ({
    default: module.SettingsControls
  })));
  const SettingsControlsFallback = () => {
    return _tmpl$$7();
  };
  const SettingsControlsLazy = (props) => createComponent(Suspense, {
    get fallback() {
      return createComponent(SettingsControlsFallback, {});
    },
    get children() {
      return createComponent(LazySettingsControls, props);
    }
  });

  function safeEventPrevent(event) {
    if (!event) return;
    event.preventDefault();
    event.stopPropagation();
  }
  function safeEventPreventAll(event) {
    if (!event) return;
    event.preventDefault();
    event.stopPropagation();
    const eventWithImmediate = event;
    eventWithImmediate.stopImmediatePropagation?.();
  }

  const toolbarButton = "xeg_4eojab";
  const galleryToolbar = "xeg_fLg7uD";
  const toolbarContent = "xeg_f8g4ur";
  const toolbarControls = "xeg_Ix3ja2";
  const counterBlock = "xeg_0EHq9g";
  const separator = "xeg_FKnOOH";
  const downloadCurrent = "xeg_njlfQM";
  const downloadAll = "xeg_AU-dPz";
  const closeButton = "xeg_Vn14NE";
  const downloadButton = "xeg_atmJJM";
  const mediaCounterWrapper = "xeg_GG869J";
  const mediaCounter = "xeg_2cjmvu";
  const currentIndex = "xeg_JEXmPu";
  const totalCount = "xeg_d1et2f";
  const progressBar = "xeg_vB6NL3";
  const progressFill = "xeg_LWQwIA";
  const fitButton = "xeg_Q7dUY4";
  const settingsPanel = "xeg_JcF-YS";
  const tweetPanel = "xeg_yRtvAY";
  const tweetPanelBody = "xeg_w56Ci4";
  const tweetContent = "xeg_jmjGCs";
  const tweetLink = "xeg_ZzP6Op";
  var styles$3 = {
  	toolbarButton: toolbarButton,
  	galleryToolbar: galleryToolbar,
  	toolbarContent: toolbarContent,
  	toolbarControls: toolbarControls,
  	counterBlock: counterBlock,
  	separator: separator,
  	downloadCurrent: downloadCurrent,
  	downloadAll: downloadAll,
  	closeButton: closeButton,
  	downloadButton: downloadButton,
  	mediaCounterWrapper: mediaCounterWrapper,
  	mediaCounter: mediaCounter,
  	currentIndex: currentIndex,
  	totalCount: totalCount,
  	progressBar: progressBar,
  	progressFill: progressFill,
  	fitButton: fitButton,
  	settingsPanel: settingsPanel,
  	tweetPanel: tweetPanel,
  	tweetPanelBody: tweetPanelBody,
  	tweetContent: tweetContent,
  	tweetLink: tweetLink
  };

  var _tmpl$$6 = /* @__PURE__ */ template(`<div data-gallery-element=toolbar><div data-gallery-element=toolbar-content><div data-gallery-element=toolbar-controls><div data-gallery-element=counter-section><div><span aria-live=polite data-gallery-element=counter><span></span><span>/</span><span></span></span><div><div></div></div></div></div></div></div><div id=toolbar-settings-panel data-gallery-scrollable=true role=region aria-label="Settings Panel"aria-labelledby=settings-button data-gallery-element=settings-panel></div><div id=toolbar-tweet-panel role=region aria-labelledby=tweet-text-button data-gallery-element=tweet-panel>`), _tmpl$2$4 = /* @__PURE__ */ template(`<div>Loading...`);
  const TweetTextPanelLazy = lazy(() => Promise.resolve().then(function () { return TweetTextPanel$1; }));
  const SCROLLABLE_SELECTOR = '[data-gallery-scrollable="true"]';
  const SCROLL_LOCK_TOLERANCE = 1;
  const findScrollableAncestor = (target) => {
    if (!(target instanceof HTMLElement)) {
      return null;
    }
    return target.closest(SCROLLABLE_SELECTOR);
  };
  const canConsumeWheelEvent = (element, deltaY) => {
    const overflow = element.scrollHeight - element.clientHeight;
    if (overflow <= SCROLL_LOCK_TOLERANCE) {
      return false;
    }
    if (deltaY < 0) {
      return element.scrollTop > SCROLL_LOCK_TOLERANCE;
    }
    if (deltaY > 0) {
      const maxScrollTop = overflow;
      return element.scrollTop < maxScrollTop - SCROLL_LOCK_TOLERANCE;
    }
    return true;
  };
  const shouldAllowWheelDefault = (event) => {
    const scrollable = findScrollableAncestor(event.target);
    if (!scrollable) {
      return false;
    }
    return canConsumeWheelEvent(scrollable, event.deltaY);
  };
  function ToolbarView(props) {
    const totalCount = createMemo(() => resolve(props.totalCount));
    const currentIndex = createMemo(() => resolve(props.currentIndex));
    const displayedIndex = createMemo(() => props.displayedIndex());
    const isToolbarDisabled = createMemo(() => Boolean(resolveOptional(props.disabled)));
    const activeFitMode = createMemo(() => props.activeFitMode());
    const tweetText = createMemo(() => resolveOptional(props.tweetText) ?? null);
    const tweetTextHTML = createMemo(() => resolveOptional(props.tweetTextHTML) ?? null);
    const [toolbarElement, setToolbarElement] = createSignal(null);
    const [counterElement, setCounterElement] = createSignal(null);
    const [settingsPanelEl, setSettingsPanelEl] = createSignal(null);
    const [tweetPanelEl, setTweetPanelEl] = createSignal(null);
    const prevDisabled = createMemo(() => props.navState().prevDisabled);
    const nextDisabled = createMemo(() => props.navState().nextDisabled);
    const downloadDisabled = createMemo(() => props.navState().downloadDisabled);
    const canDownloadAll = createMemo(() => props.navState().canDownloadAll);
    const anyActionDisabled = createMemo(() => props.navState().anyActionDisabled);
    const assignToolbarRef = (element) => {
      setToolbarElement(element);
      props.settingsController.assignToolbarRef(element);
    };
    const assignSettingsPanelRef = (element) => {
      setSettingsPanelEl(element);
      props.settingsController.assignSettingsPanelRef(element);
    };
    createEffect(() => {
      const element = toolbarElement();
      if (!element) {
        return;
      }
      element.dataset.currentIndex = String(currentIndex());
      element.dataset.focusedIndex = String(displayedIndex());
    });
    createEffect(() => {
      const element = counterElement();
      if (!element) {
        return;
      }
      element.dataset.currentIndex = String(currentIndex());
      element.dataset.focusedIndex = String(displayedIndex());
    });
    const hasTweetContent = () => Boolean(tweetTextHTML() ?? tweetText());
    const toolbarButtonClass = (...extra) => cx(styles$3.toolbarButton, "xeg-inline-center", ...extra);
    const handlePanelWheel = (event) => {
      if (shouldAllowWheelDefault(event)) {
        event.stopPropagation();
        return;
      }
    };
    const preventScrollChaining = (event) => {
      if (shouldAllowWheelDefault(event)) {
        event.stopPropagation();
        return;
      }
      safeEventPreventAll(event);
    };
    createEffect(() => {
      const toolbar = toolbarElement();
      if (toolbar) {
        toolbar.addEventListener("wheel", preventScrollChaining, {
          passive: false
        });
        onCleanup(() => toolbar.removeEventListener("wheel", preventScrollChaining));
      }
    });
    createEffect(() => {
      const settingsPanel = settingsPanelEl();
      if (settingsPanel) {
        settingsPanel.addEventListener("wheel", preventScrollChaining, {
          passive: false
        });
        onCleanup(() => settingsPanel.removeEventListener("wheel", preventScrollChaining));
      }
    });
    createEffect(() => {
      const tweetPanel = tweetPanelEl();
      if (tweetPanel) {
        tweetPanel.addEventListener("wheel", handlePanelWheel, {
          passive: true
        });
        onCleanup(() => tweetPanel.removeEventListener("wheel", handlePanelWheel));
      }
    });
    return (() => {
      var _el$ = _tmpl$$6(), _el$2 = _el$.firstChild, _el$3 = _el$2.firstChild, _el$4 = _el$3.firstChild, _el$5 = _el$4.firstChild, _el$6 = _el$5.firstChild, _el$7 = _el$6.firstChild, _el$8 = _el$7.nextSibling, _el$9 = _el$8.nextSibling, _el$0 = _el$6.nextSibling, _el$1 = _el$0.firstChild, _el$10 = _el$2.nextSibling, _el$11 = _el$10.nextSibling;
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
          return createComponent(HeroArrowSmallLeft, {
            size: 18
          });
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
          return createComponent(HeroArrowSmallRight, {
            size: 18
          });
        }
      }), _el$4);
      use((element) => {
        setCounterElement(element);
      }, _el$6);
      insert(_el$7, () => displayedIndex() + 1);
      insert(_el$9, totalCount);
      insert(_el$3, () => props.fitModeOrder.map(({
        mode,
        Icon
      }) => {
        const label = props.fitModeLabels[mode];
        return createComponent(IconButton, {
          get ["class"]() {
            return toolbarButtonClass(styles$3.fitButton);
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
          "data-gallery-element": `fit-${mode}`,
          get ["data-selected"]() {
            return activeFitMode() === mode;
          },
          get ["data-disabled"]() {
            return props.isFitDisabled(mode);
          },
          get children() {
            return createComponent(Icon, {
              size: 18
            });
          }
        });
      }), null);
      insert(_el$3, createComponent(IconButton, {
        get ["class"]() {
          return toolbarButtonClass(styles$3.downloadButton, styles$3.downloadCurrent);
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
          return createComponent(HeroDownload, {
            size: 18
          });
        }
      }), null);
      insert(_el$3, (() => {
        var _c$ = memo(() => !!canDownloadAll());
        return () => _c$() && createComponent(IconButton, {
          get ["class"]() {
            return toolbarButtonClass(styles$3.downloadButton, styles$3.downloadAll);
          },
          size: "toolbar",
          get onClick() {
            return props.onDownloadAll;
          },
          get disabled() {
            return downloadDisabled();
          },
          get ["aria-label"]() {
            return `Download all ${totalCount()} files as ZIP`;
          },
          get title() {
            return `Download all ${totalCount()} files as ZIP`;
          },
          "data-gallery-element": "download-all",
          get ["data-disabled"]() {
            return downloadDisabled();
          },
          get ["data-action-disabled"]() {
            return anyActionDisabled();
          },
          get children() {
            return createComponent(HeroArrowDownOnSquareStack, {
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
            return createComponent(HeroCog6Tooth, {
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
            return createComponent(HeroChatBubbleLeftRight, {
              size: 18
            });
          }
        });
      })(), null);
      insert(_el$3, createComponent(IconButton, {
        get ["class"]() {
          return toolbarButtonClass(styles$3.closeButton);
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
          return createComponent(HeroArrowLeftOnRectangle, {
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
      use(setTweetPanelEl, _el$11);
      insert(_el$11, createComponent(Show, {
        get when() {
          return memo(() => !!props.isTweetPanelExpanded())() && hasTweetContent();
        },
        get children() {
          return createComponent(Suspense, {
            get fallback() {
              return (() => {
                var _el$12 = _tmpl$2$4();
                createRenderEffect(() => className(_el$12, styles$3.tweetPanelLoading));
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
        var _v$ = props.toolbarClass(), _v$2 = props.role ?? "toolbar", _v$3 = props["aria-label"] ?? "Gallery Toolbar", _v$4 = props["aria-describedby"], _v$5 = isToolbarDisabled(), _v$6 = props["data-testid"], _v$7 = props.toolbarDataState(), _v$8 = isToolbarDisabled(), _v$9 = props.settingsController.isSettingsExpanded(), _v$0 = props.isTweetPanelExpanded(), _v$1 = displayedIndex(), _v$10 = currentIndex(), _v$11 = props.tabIndex, _v$12 = cx(styles$3.toolbarContent, "xeg-row-center"), _v$13 = styles$3.toolbarControls, _v$14 = styles$3.counterBlock, _v$15 = cx(styles$3.mediaCounterWrapper, "xeg-inline-center"), _v$16 = cx(styles$3.mediaCounter, "xeg-inline-center"), _v$17 = displayedIndex(), _v$18 = currentIndex(), _v$19 = styles$3.currentIndex, _v$20 = styles$3.separator, _v$21 = styles$3.totalCount, _v$22 = styles$3.progressBar, _v$23 = styles$3.progressFill, _v$24 = props.progressWidth(), _v$25 = styles$3.settingsPanel, _v$26 = props.settingsController.isSettingsExpanded(), _v$27 = styles$3.tweetPanel, _v$28 = props.isTweetPanelExpanded(), _v$29 = getLanguageService().translate("toolbar.tweetTextPanel") || "Tweet text panel";
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
  delegateEvents(["keydown", "mousedown", "click"]);

  const DEFAULT_FOCUS_DELAY_MS = 50;
  const DEFAULT_SELECT_GUARD_MS = 300;
  function useToolbarSettingsController(options) {
    const {
      isSettingsExpanded,
      setSettingsExpanded,
      toggleSettingsExpanded,
      documentRef = typeof document !== "undefined" ? document : void 0,
      themeService: providedThemeService,
      languageService: providedLanguageService,
      focusDelayMs = DEFAULT_FOCUS_DELAY_MS,
      selectChangeGuardMs = DEFAULT_SELECT_GUARD_MS
    } = options;
    const themeManager = providedThemeService ?? getThemeService();
    const languageService = providedLanguageService ?? getLanguageService();
    const scheduleTimeout = (callback, delay) => {
      return globalTimerManager.setTimeout(callback, delay);
    };
    const clearScheduledTimeout = (handle) => {
      if (handle == null) {
        return;
      }
      globalTimerManager.clearTimeout(handle);
    };
    const [toolbarRef, setToolbarRef] = createSignal(void 0);
    const [settingsPanelRef, setSettingsPanelRef] = createSignal(
      void 0
    );
    const [settingsButtonRef, setSettingsButtonRef] = createSignal(
      void 0
    );
    const toThemeOption = (value) => {
      return value === "light" || value === "dark" ? value : "auto";
    };
    const getInitialTheme = () => {
      try {
        const currentSetting = themeManager.getCurrentTheme();
        return toThemeOption(currentSetting);
      } catch (error) {
      }
      return "auto";
    };
    const [currentTheme, setCurrentTheme] = createSignal(getInitialTheme());
    const [currentLanguage, setCurrentLanguage] = createSignal(
      languageService.getCurrentLanguage()
    );
    const syncThemeFromService = () => {
      try {
        const setting = themeManager.getCurrentTheme();
        setCurrentTheme(toThemeOption(setting));
      } catch (error) {
        logger$2.warn("[ToolbarSettingsController] Failed to read theme from service", error);
      }
    };
    syncThemeFromService();
    if (typeof themeManager.isInitialized === "function" && !themeManager.isInitialized()) {
      void themeManager.initialize().then(syncThemeFromService).catch((error) => {
        logger$2.warn("[ToolbarSettingsController] ThemeService initialization failed", error);
      });
    }
    createEffect(() => {
      const unsubscribe = themeManager.onThemeChange((_, setting) => {
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
      if (!documentRef) {
        return;
      }
      const expanded = isSettingsExpanded();
      const panel = settingsPanelRef();
      if (!expanded || !panel) {
        return;
      }
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
      selects.forEach((select) => {
        select.addEventListener("focus", handleSelectFocus);
        select.addEventListener("blur", handleSelectBlur);
        select.addEventListener("change", handleSelectChange);
      });
      const handleOutsideClick = (event) => {
        const target = event.target;
        const settingsButton = settingsButtonRef();
        const toolbarElement = toolbarRef();
        if (!target) {
          return;
        }
        if (isSelectActive) {
          return;
        }
        const targetElement = target;
        if (toolbarElement?.contains(targetElement)) {
          return;
        }
        if (settingsButton?.contains(targetElement)) {
          return;
        }
        if (panel.contains(targetElement)) {
          return;
        }
        let currentNode = targetElement;
        while (currentNode) {
          if (currentNode.tagName === "SELECT" || currentNode.tagName === "OPTION") {
            return;
          }
          currentNode = currentNode.parentElement;
        }
        setSettingsExpanded(false);
      };
      documentRef.addEventListener("mousedown", handleOutsideClick, false);
      onCleanup(() => {
        clearScheduledTimeout(selectGuardTimeout);
        documentRef.removeEventListener("mousedown", handleOutsideClick, false);
        selects.forEach((select) => {
          select.removeEventListener("focus", handleSelectFocus);
          select.removeEventListener("blur", handleSelectBlur);
          select.removeEventListener("change", handleSelectChange);
        });
      });
    });
    const handleSettingsClick = (event) => {
      event.stopImmediatePropagation?.();
      const wasExpanded = isSettingsExpanded();
      toggleSettingsExpanded();
      if (!wasExpanded) {
        scheduleTimeout(() => {
          const panel = settingsPanelRef();
          const firstControl = panel?.querySelector("select");
          if (firstControl) {
            firstControl.focus({ preventScroll: true });
          }
        }, focusDelayMs);
      }
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
          if (settingsButton) {
            settingsButton.focus({ preventScroll: true });
          }
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
      if (!select) {
        return;
      }
      const theme = toThemeOption(select.value);
      setCurrentTheme(theme);
      themeManager.setTheme(theme);
      try {
        const settingsService = tryGetSettingsManager();
        if (settingsService) {
          void settingsService.set("gallery.theme", theme).catch((error) => {
            logger$2.warn(
              "[ToolbarSettingsController] Failed to sync theme to SettingsService:",
              error
            );
          });
        }
      } catch (error) {
        logger$2.debug(
          "[ToolbarSettingsController] SettingsService not available for theme sync:",
          error
        );
      }
    };
    const handleLanguageChange = (event) => {
      const select = event.target;
      if (!select) {
        return;
      }
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

  const INITIAL_STATE$2 = {
    isDownloading: false,
    isLoading: false,
    hasError: false
  };
  function useToolbarState() {
    const [isDownloading, setIsDownloading] = createSignal(INITIAL_STATE$2.isDownloading);
    const [isLoading, setIsLoading] = createSignal(INITIAL_STATE$2.isLoading);
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
    const setLoading = (loading) => {
      setIsLoading(loading);
      if (loading) {
        setHasError(false);
      }
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
      lastDownloadToggle = 0;
      setIsDownloading(INITIAL_STATE$2.isDownloading);
      setIsLoading(INITIAL_STATE$2.isLoading);
      setHasError(INITIAL_STATE$2.hasError);
    };
    onCleanup(() => {
      clearDownloadTimeout();
    });
    const actions = {
      setDownloading,
      setLoading,
      setError,
      resetState
    };
    const state = {
      get isDownloading() {
        return isDownloading();
      },
      get isLoading() {
        return isLoading();
      },
      get hasError() {
        return hasError();
      }
    };
    return [state, actions];
  }

  const DEFAULT_PROPS = {
    isDownloading: false,
    disabled: false,
    className: ""
  };
  const FIT_MODE_LABELS = {
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
  const FIT_MODE_ORDER = [{
    mode: "original",
    Icon: HeroArrowsPointingOut
  }, {
    mode: "fitWidth",
    Icon: HeroArrowsRightLeft
  }, {
    mode: "fitHeight",
    Icon: HeroArrowsUpDown
  }, {
    mode: "fitContainer",
    Icon: HeroArrowsPointingIn
  }];
  const resolveDisplayedIndex = ({
    total,
    currentIndex,
    focusedIndex
  }) => {
    if (total <= 0) {
      return 0;
    }
    if (typeof focusedIndex === "number" && focusedIndex >= 0 && focusedIndex < total) {
      return focusedIndex;
    }
    return clampIndex(currentIndex, total);
  };
  const calculateProgressWidth = (index, total) => {
    if (total <= 0) {
      return "0%";
    }
    return `${(index + 1) / total * 100}%`;
  };
  const computeNavigationState = ({
    total,
    toolbarDisabled,
    downloadBusy
  }) => {
    const hasItems = total > 0;
    const canNavigate = hasItems && total > 1;
    const prevDisabled = toolbarDisabled || !canNavigate;
    const nextDisabled = toolbarDisabled || !canNavigate;
    const downloadDisabled = toolbarDisabled || downloadBusy || !hasItems;
    return {
      prevDisabled,
      nextDisabled,
      canDownloadAll: total > 1,
      downloadDisabled,
      anyActionDisabled: toolbarDisabled
    };
  };
  const createGuardedHandler = (guard, action) => {
    return (event) => {
      safeEventPrevent(event);
      if (guard()) {
        return;
      }
      action?.();
    };
  };
  function getToolbarDataState(state) {
    if (state.hasError) return "error";
    if (state.isDownloading) return "downloading";
    if (state.isLoading) return "loading";
    return "idle";
  }
  function ToolbarContainer(rawProps) {
    const props = mergeProps(DEFAULT_PROPS, rawProps);
    const currentIndex = toRequiredAccessor(() => props.currentIndex, 0);
    const totalCount = toRequiredAccessor(() => props.totalCount, 0);
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
      if (expanded) {
        setTweetExpanded(false);
      }
    };
    const toggleSettings = () => {
      setSettingsExpanded(!settingsExpandedSignal());
    };
    const toggleTweet = () => {
      setTweetExpanded((prev) => {
        const next = !prev;
        if (next) {
          setSettingsExpanded(false);
        }
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
        if (!wasOpen && settingsExpandedSignal()) {
          props.handlers.lifecycle.onOpenSettings?.();
        }
      }
    };
    const toolbarClass = createMemo(() => cx(styles$3.toolbar, styles$3.galleryToolbar, props.className));
    const totalItems = createMemo(() => Math.max(0, totalCount()));
    const currentIndexForNav = createMemo(() => clampIndex(currentIndex(), totalItems()));
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
    const handleFitModeClick = (mode) => (event) => {
      safeEventPreventAll(event);
      if (isToolbarDisabled()) {
        return;
      }
      fitModeHandlers()[mode]?.(event);
    };
    const isFitDisabled = (mode) => {
      if (isToolbarDisabled()) {
        return true;
      }
      const handler = fitModeHandlers()[mode];
      if (!handler) {
        return true;
      }
      return activeFitMode() === mode;
    };
    const handlePrevious = createGuardedHandler(() => navState().prevDisabled, props.handlers.navigation.onPrevious);
    const handleNext = createGuardedHandler(() => navState().nextDisabled, props.handlers.navigation.onNext);
    const handleDownloadCurrent = createGuardedHandler(() => navState().downloadDisabled, props.handlers.download.onDownloadCurrent);
    const handleDownloadAll = createGuardedHandler(() => navState().downloadDisabled, props.handlers.download.onDownloadAll);
    const handleClose = (event) => {
      safeEventPrevent(event);
      props.handlers.lifecycle.onClose();
    };
    return createComponent(
      ToolbarView,
      {
        currentIndex,
        focusedIndex,
        totalCount,
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
      }
    );
  }
  const Toolbar = ToolbarContainer;

  function requireSettingsService() {
    const service = tryGetSettingsManager();
    if (!service) {
      throw new Error(
        "SettingsService is not registered. Ensure bootstrap registers it before usage."
      );
    }
    return service;
  }
  function getTypedSettingOr(path, fallback) {
    const value = requireSettingsService().get(path);
    return value === void 0 ? fallback : value;
  }
  function setTypedSetting(path, value) {
    return requireSettingsService().set(path, value);
  }

  function createSignalSafe(initial) {
    const [read, write] = createSignal(initial, { equals: false });
    const signalObject = {
      subscribe(callback) {
        return createRoot((dispose) => {
          createEffect(() => callback(read()));
          return dispose;
        });
      }
    };
    Object.defineProperty(signalObject, "value", {
      get: () => read(),
      set: (v) => write(() => v),
      enumerable: true
    });
    return signalObject;
  }
  function effectSafe(fn) {
    return createRoot((dispose) => {
      createEffect(() => fn());
      return dispose;
    });
  }

  const INITIAL_STATE$1 = {
    activeTasks: /* @__PURE__ */ new Map(),
    queue: [],
    isProcessing: false
  };
  let downloadStateSignal = null;
  function getDownloadState() {
    if (!downloadStateSignal) {
      downloadStateSignal = createSignalSafe(INITIAL_STATE$1);
    }
    return downloadStateSignal;
  }
  function setProcessingFlag(isProcessing) {
    const currentState = downloadState.value;
    if (currentState.isProcessing === isProcessing) {
      return;
    }
    downloadState.value = {
      ...currentState,
      isProcessing
    };
  }
  function acquireDownloadLock() {
    setProcessingFlag(true);
    return () => {
      const { queue, activeTasks } = downloadState.value;
      if (queue.length === 0 && activeTasks.size === 0) {
        setProcessingFlag(false);
      }
    };
  }
  function isDownloadLocked() {
    return downloadState.value.isProcessing;
  }
  const downloadState = {
    get value() {
      return getDownloadState().value;
    },
    set value(newState) {
      getDownloadState().value = newState;
    }};

  const INITIAL_NAVIGATION_STATE = {
    lastSource: "auto-focus",
    lastTimestamp: Date.now(),
    lastNavigatedIndex: null
  };
  const VALID_NAVIGATION_SOURCES = [
    "button",
    "keyboard",
    "scroll",
    "auto-focus"
  ];
  const VALID_NAVIGATION_TRIGGERS = [
    "button",
    "click",
    "keyboard",
    "scroll"
  ];
  const navigationSignals = {
    lastSource: createSignalSafe(INITIAL_NAVIGATION_STATE.lastSource),
    lastTimestamp: createSignalSafe(INITIAL_NAVIGATION_STATE.lastTimestamp),
    lastNavigatedIndex: createSignalSafe(INITIAL_NAVIGATION_STATE.lastNavigatedIndex)
  };
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
    return new Error(`[Gallery] Invalid navigation action (${context}): ${reason}`);
  }
  function validateNavigationParams(targetIndex, source, trigger, context) {
    if (typeof targetIndex !== "number" || Number.isNaN(targetIndex)) {
      throw createNavigationActionError(context, "Navigate payload targetIndex invalid");
    }
    if (!isValidNavigationSource(source)) {
      throw createNavigationActionError(
        context,
        `Navigate payload source invalid: ${String(source)}`
      );
    }
    if (!isValidNavigationTrigger(trigger)) {
      throw createNavigationActionError(
        context,
        `Navigate payload trigger invalid: ${String(trigger)}`
      );
    }
  }
  function recordNavigation(targetIndex, source) {
    const timestamp = Date.now();
    const currentIndex = navigationSignals.lastNavigatedIndex.value;
    const currentSource = navigationSignals.lastSource.value;
    const isDuplicate = targetIndex === currentIndex && isManualSource(source) && isManualSource(currentSource);
    if (isDuplicate) {
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
    if (trigger === "scroll") {
      return "scroll";
    }
    if (trigger === "keyboard") {
      return "keyboard";
    }
    return "button";
  }

  const logger$1 = logger$2;
  const INITIAL_UI_STATE = {
    viewMode: "vertical",
    isLoading: false,
    error: null
  };
  const uiSignals = {
    viewMode: createSignalSafe(INITIAL_UI_STATE.viewMode),
    isLoading: createSignalSafe(INITIAL_UI_STATE.isLoading),
    error: createSignalSafe(INITIAL_UI_STATE.error)
  };
  function setError(error) {
    uiSignals.error.value = error;
    if (error) {
      uiSignals.isLoading.value = false;
      logger$1.error(`[Gallery UI] Error: ${error}`);
    }
  }

  function createEventEmitter() {
    const listeners = /* @__PURE__ */ new Map();
    return {
      /**
       * Register event listener
       * @returns Unsubscribe function
       */
      on(event, callback) {
        if (!listeners.has(event)) {
          listeners.set(event, /* @__PURE__ */ new Set());
        }
        listeners.get(event).add(callback);
        return () => {
          listeners.get(event)?.delete(callback);
        };
      },
      /**
       * Emit event (synchronous execution)
       * Listener errors are isolated - one listener failure doesn't prevent others
       */
      emit(event, data) {
        const eventListeners = listeners.get(event);
        if (!eventListeners) {
          return;
        }
        eventListeners.forEach((callback) => {
          try {
            callback(data);
          } catch (error) {
            logger$2.error(`[EventEmitter] Listener error for event "${String(event)}":`, error);
          }
        });
      },
      /**
       * Remove all listeners (optional)
       */
      dispose() {
        listeners.clear();
      }
    };
  }

  const logger = logger$2;
  const batch = batch$1;
  const INITIAL_STATE = {
    isOpen: false,
    mediaItems: [],
    currentIndex: 0};
  const galleryIndexEvents = createEventEmitter();
  const gallerySignals = {
    isOpen: createSignalSafe(INITIAL_STATE.isOpen),
    mediaItems: createSignalSafe(INITIAL_STATE.mediaItems),
    currentIndex: createSignalSafe(INITIAL_STATE.currentIndex),
    // Delegate to ui.state.ts signals
    isLoading: uiSignals.isLoading,
    error: uiSignals.error,
    viewMode: uiSignals.viewMode,
    focusedIndex: createSignalSafe(null),
    /**
     * Phase 329: DOM query caching
     * Current gallery video element (keyboard performance optimization)
     * - Use Signal reference instead of DOM query per keyboard event
     * - Performance improvement: 30% ↑
     */
    currentVideoElement: createSignalSafe(null)
  };
  const galleryState = {
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
      batch(() => {
        gallerySignals.isOpen.value = state.isOpen;
        gallerySignals.mediaItems.value = state.mediaItems;
        gallerySignals.currentIndex.value = state.currentIndex;
        gallerySignals.isLoading.value = state.isLoading;
        gallerySignals.error.value = state.error;
        gallerySignals.viewMode.value = state.viewMode;
      });
    }};
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
    logger.debug(`[Gallery] Opened with ${items.length} items, starting at index ${validIndex}`);
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
    logger.debug("[Gallery] Closed");
  }
  function navigateToItem(index, trigger = "button", source) {
    const state = galleryState.value;
    const validIndex = clampIndex(index, state.mediaItems.length);
    const navigationSource = source ?? resolveNavigationSource(trigger);
    validateNavigationParams(validIndex, navigationSource, trigger, "navigateToItem");
    const result = recordNavigation(validIndex, navigationSource);
    if (result.isDuplicate) {
      logger.debug(
        `[Gallery] Already at index ${index} (source: ${navigationSource}), ensuring sync`
      );
      gallerySignals.focusedIndex.value = validIndex;
      return;
    }
    galleryIndexEvents.emit("navigate:start", {
      from: state.currentIndex,
      to: validIndex,
      trigger
    });
    batch(() => {
      galleryState.value = {
        ...state,
        currentIndex: validIndex
      };
      gallerySignals.focusedIndex.value = validIndex;
    });
    galleryIndexEvents.emit("navigate:complete", { index: validIndex, trigger });
    logger.debug(
      `[Gallery] Navigated to item: ${index} (trigger: ${trigger}, source: ${navigationSource})`
    );
  }
  function navigatePrevious(trigger = "button") {
    const state = galleryState.value;
    const baseIndex = getCurrentActiveIndex();
    const newIndex = baseIndex > 0 ? baseIndex - 1 : state.mediaItems.length - 1;
    const source = resolveNavigationSource(trigger);
    navigateToItem(newIndex, trigger, source);
  }
  function navigateNext(trigger = "button") {
    const state = galleryState.value;
    const baseIndex = getCurrentActiveIndex();
    const newIndex = baseIndex < state.mediaItems.length - 1 ? baseIndex + 1 : 0;
    const source = resolveNavigationSource(trigger);
    navigateToItem(newIndex, trigger, source);
  }
  function getCurrentActiveIndex() {
    return gallerySignals.focusedIndex.value ?? galleryState.value.currentIndex;
  }

  function isDownloadUiBusy(context) {
    return Boolean(context.downloadProcessing);
  }

  const DEFAULTS = {
    THRESHOLD: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
    ROOT_MARGIN: "0px"
  };
  class FocusCoordinator {
    constructor(options) {
      this.options = options;
      this.observerOptions = {
        threshold: options.threshold ?? [...DEFAULTS.THRESHOLD],
        rootMargin: options.rootMargin ?? DEFAULTS.ROOT_MARGIN
      };
    }
    items = /* @__PURE__ */ new Map();
    observerOptions;
    registerItem(index, element) {
      const prev = this.items.get(index);
      prev?.unsubscribe?.();
      if (!element) {
        this.items.delete(index);
        return;
      }
      const trackedItem = { element, isVisible: false };
      trackedItem.unsubscribe = SharedObserver.observe(
        element,
        (entry) => {
          const item = this.items.get(index);
          if (item) {
            item.entry = entry;
            item.isVisible = entry.isIntersecting;
          }
        },
        this.observerOptions
      );
      this.items.set(index, trackedItem);
    }
    updateFocus(force = false) {
      if (!force && !this.options.isEnabled()) return;
      const container = this.options.container();
      if (!container) return;
      const containerRect = container.getBoundingClientRect();
      const selection = this.selectBestCandidate(containerRect);
      if (!selection) return;
      const currentIndex = this.options.activeIndex();
      const hasChanged = currentIndex !== selection.index;
      if (hasChanged) {
        this.options.onFocusChange(selection.index, "auto");
      }
    }
    cleanup() {
      for (const item of this.items.values()) {
        item.unsubscribe?.();
      }
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
        if (topDistance <= topProximityThreshold && visibilityRatio > 0.1) {
          if (!topAlignedCandidate || topDistance < topAlignedCandidate.distance) {
            topAlignedCandidate = { index, distance: topDistance };
          }
        }
        if (visibilityRatio > 0.1) {
          const isBetterVisibility = !highestVisibilityCandidate || visibilityRatio > highestVisibilityCandidate.ratio || visibilityRatio === highestVisibilityCandidate.ratio && centerDistance < highestVisibilityCandidate.centerDistance;
          if (isBetterVisibility) {
            highestVisibilityCandidate = { index, ratio: visibilityRatio, centerDistance };
          }
        }
        if (!bestCandidate || centerDistance < bestCandidate.distance) {
          bestCandidate = { index, distance: centerDistance };
        }
      }
      if (topAlignedCandidate) {
        return topAlignedCandidate;
      }
      if (highestVisibilityCandidate) {
        return { index: highestVisibilityCandidate.index, distance: 0 };
      }
      return bestCandidate;
    }
  }

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
      activeIndex: () => galleryState.value.currentIndex,
      ...options.threshold !== void 0 && { threshold: options.threshold },
      rootMargin: options.rootMargin ?? "0px",
      onFocusChange: (index, source) => {
        if (source === "auto" && index !== null) {
          navigateToItem(index, "scroll", "auto-focus");
        }
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

  function useGalleryItemScroll(containerRef, currentIndex, totalItems, options = {}) {
    const containerAccessor = typeof containerRef === "function" ? containerRef : () => containerRef.current;
    const enabled = toAccessor(options.enabled ?? true);
    const behavior = toAccessor(options.behavior ?? "auto");
    const block = toAccessor(options.block ?? "start");
    const alignToCenter = toAccessor(options.alignToCenter ?? false);
    const isScrolling = toAccessor(options.isScrolling ?? false);
    const currentIndexAccessor = toAccessor(currentIndex);
    const totalItemsAccessor = toAccessor(totalItems);
    const scrollToItem = (index) => {
      const container = containerAccessor();
      if (!enabled() || !container || index < 0 || index >= totalItemsAccessor()) return;
      const itemsRoot = container.querySelector(
        '[data-xeg-role="items-list"], [data-xeg-role="items-container"]'
      );
      if (!itemsRoot) return;
      const items = itemsRoot.querySelectorAll('[data-xeg-role="gallery-item"]');
      const target = items[index];
      if (target) {
        options.onScrollStart?.();
        target.scrollIntoView({
          behavior: behavior(),
          block: alignToCenter() ? "center" : block(),
          inline: "nearest"
        });
      } else {
        requestAnimationFrame(() => {
          const retryItems = itemsRoot.querySelectorAll('[data-xeg-role="gallery-item"]');
          const retryTarget = retryItems[index];
          if (retryTarget) {
            options.onScrollStart?.();
            retryTarget.scrollIntoView({
              behavior: behavior(),
              block: alignToCenter() ? "center" : block(),
              inline: "nearest"
            });
          }
        });
      }
    };
    createEffect(() => {
      const index = currentIndexAccessor();
      const container = containerAccessor();
      const total = totalItemsAccessor();
      if (!container || total <= 0) {
        return;
      }
      if (untrack(enabled) && !untrack(isScrolling)) {
        scrollToItem(index);
      }
    });
    return {
      scrollToItem,
      scrollToCurrentItem: () => scrollToItem(currentIndexAccessor())
    };
  }

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

  const GALLERY_SELECTORS = CSS.INTERNAL_SELECTORS;
  function ensureGalleryScrollAvailable(element) {
    if (!element) {
      return;
    }
    const scrollableElements = element.querySelectorAll(
      '[data-xeg-role="items-list"], .itemsList, .content'
    );
    scrollableElements.forEach((el) => {
      if (el.style.overflowY !== "auto" && el.style.overflowY !== "scroll") {
        el.style.overflowY = "auto";
      }
    });
  }
  const VIDEO_PLAYER_CONTEXT_SELECTORS = [
    SELECTORS.VIDEO_PLAYER,
    '[data-testid="videoComponent"]',
    '[data-testid="videoPlayerControls"]',
    '[data-testid="videoPlayerOverlay"]',
    '[role="application"]',
    '[aria-label*="Video"]'
  ];
  const VIDEO_CONTROL_ROLE_SET = new Set(VIDEO_CONTROL_ROLES.map((role) => role.toLowerCase()));
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
    if (typeof element.matches !== "function") {
      return false;
    }
    try {
      return element.matches('input[type="range"]');
    } catch {
      return false;
    }
  }
  function getNearestAttributeValue(element, attribute) {
    if (element.hasAttribute(attribute)) {
      return element.getAttribute(attribute);
    }
    try {
      const host = element.closest(`[${attribute}]`);
      return host?.getAttribute(attribute) ?? null;
    } catch {
      return null;
    }
  }
  function containsControlToken(value, tokens) {
    if (!value) {
      return false;
    }
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
    if (matchesVideoControlSelectors(element)) {
      return {
        selectorMatch: true,
        datasetToken: false,
        ariaToken: false,
        playerScoped: true,
        roleMatch: false,
        rangeSignature: hasInputRangeSignature(element)
      };
    }
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
    const tagName = element.tagName.toLowerCase();
    if (tagName === "video") return true;
    const evidence = gatherVideoControlEvidence(element);
    if (evidence.selectorMatch) {
      return true;
    }
    if (evidence.datasetToken || evidence.ariaToken) {
      return true;
    }
    if (!evidence.playerScoped) {
      return false;
    }
    if (evidence.roleMatch || evidence.rangeSignature) {
      return true;
    }
    return false;
  }
  function isGalleryInternalElement(element) {
    if (!element) return false;
    if (!(element instanceof HTMLElement)) {
      return false;
    }
    if (typeof element.matches !== "function") {
      logger$2.warn("Invalid element: matches is not a function", element);
      return false;
    }
    return GALLERY_SELECTORS.some((selector) => {
      try {
        return element.matches(selector) || element.closest(selector) !== null;
      } catch (error) {
        logger$2.warn("Invalid selector:", selector, error);
        return false;
      }
    });
  }
  function isGalleryInternalEvent(event) {
    const target = event.target;
    if (!isHTMLElement(target)) return false;
    return isGalleryInternalElement(target);
  }

  const listeners = /* @__PURE__ */ new Map();
  function generateListenerId(ctx) {
    const r = Math.random().toString(36).slice(2, 11);
    return ctx ? `${ctx}:${r}` : r;
  }
  function addListener(element, type, listener, options, context) {
    const id = generateListenerId(context);
    if (!element || typeof element.addEventListener !== "function") {
      logger$2.warn("Invalid element passed to addListener", { type, context });
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
      logger$2.debug(`Listener registered: ${type} (${id})`, { context });
      return id;
    } catch (error) {
      logger$2.error(`Failed to add listener: ${type}`, { error, context });
      return id;
    }
  }
  function removeEventListenerManaged(id) {
    const ctx = listeners.get(id);
    if (!ctx) {
      logger$2.warn(`Listener not found for removal: ${id}`);
      return false;
    }
    try {
      ctx.element.removeEventListener(ctx.type, ctx.listener, ctx.options);
      listeners.delete(id);
      logger$2.debug(`Listener removed: ${ctx.type} (${id})`);
      return true;
    } catch (error) {
      logger$2.error(`Failed to remove listener: ${id}`, error);
      return false;
    }
  }
  function removeEventListenersByContext(context) {
    const toRemove = [];
    for (const [id, ctx] of listeners) {
      if (ctx.context === context) {
        toRemove.push(id);
      }
    }
    let count = 0;
    for (const id of toRemove) {
      if (removeEventListenerManaged(id)) {
        count++;
      }
    }
    if (count > 0) {
      logger$2.debug(`Removed ${count} listeners for context: ${context}`);
    }
    return count;
  }
  function getEventListenerStatus() {
    const byContext = {};
    const byType = {};
    for (const ctx of listeners.values()) {
      const c = ctx.context || "default";
      byContext[c] = (byContext[c] || 0) + 1;
      byType[ctx.type] = (byType[ctx.type] || 0) + 1;
    }
    return { total: listeners.size, byContext, byType };
  }

  class EventManager {
    lifecycle;
    static singleton = createSingleton(() => new EventManager());
    isDestroyed = false;
    constructor() {
      this.lifecycle = createLifecycle("EventManager", {
        onInitialize: () => this.onInitialize(),
        onDestroy: () => this.onDestroy()
      });
    }
    /** Get singleton instance */
    static getInstance() {
      return EventManager.singleton.get();
    }
    /** @internal Test helper */
    static resetForTests() {
      EventManager.singleton.reset();
    }
    /** Initialize service (idempotent, fail-fast on error) */
    async initialize() {
      return this.lifecycle.initialize();
    }
    /** Destroy service (idempotent, graceful on error) */
    destroy() {
      this.lifecycle.destroy();
    }
    /** Check if service is initialized */
    isInitialized() {
      return this.lifecycle.isInitialized();
    }
    /** Lifecycle: Initialization */
    async onInitialize() {
      logger$2.debug("EventManager initialized");
    }
    /** Lifecycle: Cleanup */
    onDestroy() {
      this.cleanup();
    }
    /**
     * Add event listener with tracking
     *
     * @param element - Target element
     * @param type - Event type
     * @param listener - Event handler
     * @param options - Listener options
     * @param context - Context for grouping (e.g., 'gallery-keyboard')
     * @returns Listener ID for removal
     */
    addListener(element, type, listener, options, context) {
      if (this.isDestroyed) {
        logger$2.warn("EventManager: addListener called on destroyed instance");
        return "";
      }
      return addListener(element, type, listener, options, context);
    }
    /**
     * Remove event listener by ID
     */
    removeListener(id) {
      return removeEventListenerManaged(id);
    }
    /**
     * Remove all listeners matching a context
     */
    removeByContext(context) {
      return removeEventListenersByContext(context);
    }
    /** Check if destroyed */
    getIsDestroyed() {
      return this.isDestroyed;
    }
    /** Get listener statistics */
    getListenerStatus() {
      return getEventListenerStatus();
    }
    /** Clean up and mark as destroyed */
    cleanup() {
      if (this.isDestroyed) {
        return;
      }
      this.isDestroyed = true;
      logger$2.debug("EventManager cleanup completed");
    }
  }

  const SCROLL_IDLE_TIMEOUT = 250;
  const PROGRAMMATIC_SCROLL_WINDOW = 100;
  const LISTENER_CONTEXT_PREFIX = "useGalleryScroll";
  function useGalleryScroll({
    container,
    scrollTarget,
    onScroll,
    onScrollEnd,
    enabled = true,
    programmaticScrollTimestamp
  }) {
    const containerAccessor = toAccessor(container);
    const scrollTargetAccessor = toAccessor(scrollTarget ?? containerAccessor);
    const enabledAccessor = toAccessor(enabled);
    const programmaticTimestampAccessor = toAccessor(programmaticScrollTimestamp ?? 0);
    const isGalleryOpen = createMemo(() => galleryState.value.isOpen);
    const [isScrolling, setIsScrolling] = createSignal(false);
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
        logger$2.debug("useGalleryScroll: Scroll ended");
        onScrollEnd?.();
      }, SCROLL_IDLE_TIMEOUT);
    };
    const shouldIgnoreScroll = () => Date.now() - programmaticTimestampAccessor() < PROGRAMMATIC_SCROLL_WINDOW;
    const isToolbarScroll = (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return false;
      return Boolean(
        target.closest('[data-gallery-element="toolbar"]') || target.closest('[data-gallery-element="settings-panel"]') || target.closest('[data-gallery-element="tweet-panel"]') || target.closest('[data-role="toolbar"]')
      );
    };
    const handleWheel = (event) => {
      if (!isGalleryOpen() || !isGalleryInternalEvent(event)) return;
      if (isToolbarScroll(event)) return;
      markScrolling();
      onScroll?.();
      scheduleScrollEnd();
    };
    const handleScroll = () => {
      if (!isGalleryOpen() || shouldIgnoreScroll()) return;
      markScrolling();
      onScroll?.();
      scheduleScrollEnd();
    };
    createEffect(() => {
      const isEnabled = enabledAccessor();
      const containerElement = containerAccessor();
      const scrollElement = scrollTargetAccessor();
      const eventTarget = scrollElement ?? containerElement;
      if (!isEnabled || !eventTarget) {
        setIsScrolling(false);
        clearScrollIdleTimer();
        return;
      }
      const eventManager = EventManager.getInstance();
      const listenerContext = `${LISTENER_CONTEXT_PREFIX}:${Date.now().toString(36)}:${Math.random().toString(36).slice(2)}`;
      const listenerIds = [];
      const registerListener = (type, handler) => {
        const id = eventManager.addListener(
          eventTarget,
          type,
          handler,
          { passive: true },
          listenerContext
        );
        if (id) {
          listenerIds.push(id);
          logger$2.debug("useGalleryScroll: listener registered", {
            type,
            id,
            context: listenerContext
          });
        }
      };
      registerListener("wheel", handleWheel);
      registerListener("scroll", handleScroll);
      logger$2.debug("useGalleryScroll: Listeners registered");
      onCleanup(() => {
        for (const id of listenerIds) {
          eventManager.removeListener(id);
          logger$2.debug("useGalleryScroll: listener removed", { id, context: listenerContext });
        }
        clearScrollIdleTimer();
        setIsScrolling(false);
      });
    });
    onCleanup(clearScrollIdleTimer);
    return { isScrolling, lastScrollTime };
  }

  function useGalleryKeyboard({ onClose }) {
    createEffect(() => {
      if (typeof document === "undefined") {
        return;
      }
      const isEditableTarget = (target) => {
        const element = target;
        if (!element) {
          return false;
        }
        const tag = element.tagName?.toUpperCase();
        if (tag === "INPUT" || tag === "TEXTAREA") {
          return true;
        }
        return Boolean(element.isContentEditable);
      };
      const handleKeyDown = (event) => {
        const keyboardEvent = event;
        if (isEditableTarget(keyboardEvent.target)) {
          return;
        }
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
      const listenerId = eventManager.addListener(
        document,
        "keydown",
        handleKeyDown,
        { capture: true },
        "gallery-keyboard-navigation"
      );
      onCleanup(() => {
        if (listenerId) {
          eventManager.removeListener(listenerId);
        }
      });
    });
  }

  function computeViewportConstraints(rect, chrome = {}) {
    const vw = Math.max(0, Math.floor(rect.width));
    const vh = Math.max(0, Math.floor(rect.height));
    const top = Math.max(0, Math.floor(chrome.paddingTop ?? 0));
    const bottom = Math.max(0, Math.floor(chrome.paddingBottom ?? 0));
    const toolbar = Math.max(0, Math.floor(chrome.toolbarHeight ?? 0));
    const constrained = Math.max(0, vh - top - bottom - toolbar);
    return { viewportW: vw, viewportH: vh, constrainedH: constrained };
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
      const v = computeViewportConstraints({ width: rect.width, height: rect.height }, getChrome());
      applyViewportCssVars(el, v);
    };
    let pending = false;
    const schedule = () => {
      if (pending) return;
      pending = true;
      if (typeof requestAnimationFrame === "function") {
        requestAnimationFrame(() => {
          pending = false;
          calcAndApply();
        });
      } else {
        globalTimerManager.setTimeout(() => {
          pending = false;
          calcAndApply();
        }, 0);
      }
    };
    calcAndApply();
    let ro = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => schedule());
      try {
        ro.observe(el);
      } catch {
      }
    }
    const onResize = () => schedule();
    let resizeListenerId = null;
    if (typeof window !== "undefined") {
      resizeListenerId = EventManager.getInstance().addListener(
        window,
        "resize",
        createEventListener(onResize),
        { passive: true },
        "viewport:resize"
      );
    }
    return () => {
      disposed = true;
      if (ro) {
        try {
          ro.disconnect();
        } catch {
        }
      }
      if (resizeListenerId) {
        EventManager.getInstance().removeListener(resizeListenerId);
        resizeListenerId = null;
      }
    };
  }

  const styleMap = /* @__PURE__ */ new Map();
  function isBrowserEnvironment() {
    return typeof document !== "undefined" && typeof document.createElement === "function";
  }
  function getExistingElement(id) {
    const entry = styleMap.get(id);
    if (entry) {
      return entry;
    }
    if (!isBrowserEnvironment()) {
      return null;
    }
    const domEntry = document.getElementById(id);
    if (domEntry instanceof HTMLStyleElement) {
      styleMap.set(id, domEntry);
      return domEntry;
    }
    return null;
  }
  function registerStyle(options) {
    if (!isBrowserEnvironment()) {
      logger$2.warn("[StyleRegistry] Unable to register style outside browser environment", options.id);
      return null;
    }
    const trimmedCss = options.cssText.trim();
    if (!trimmedCss) {
      logger$2.warn("[StyleRegistry] Ignoring empty style registration", options.id);
      return null;
    }
    const existing = getExistingElement(options.id);
    if (existing && options.replaceExisting !== false) {
      existing.textContent = trimmedCss;
      return { id: options.id, element: existing, replaced: true };
    }
    if (existing) {
      return { id: options.id, element: existing, replaced: false };
    }
    let styleElement;
    try {
      styleElement = getUserscript().addStyle(trimmedCss);
    } catch {
      styleElement = document.createElement("style");
      styleElement.textContent = trimmedCss;
      (document.head || document.documentElement).appendChild(styleElement);
    }
    styleElement.id = options.id;
    if (options.attributes) {
      Object.entries(options.attributes).forEach(([key, value]) => {
        if (value === void 0) return;
        styleElement.setAttribute(key, String(value));
      });
    }
    styleMap.set(options.id, styleElement);
    logger$2.debug("[StyleRegistry] Registered style", options.id);
    return { id: options.id, element: styleElement, replaced: false };
  }
  function hasStyle(id) {
    return styleMap.has(id) || Boolean(getExistingElement(id));
  }

  const ANIMATION_CLASSES = {
    FADE_IN: "animate-fade-in",
    FADE_OUT: "animate-fade-out",
    SLIDE_IN_BOTTOM: "animate-slide-in-bottom",
    SLIDE_OUT_TOP: "animate-slide-out-top",
    SCALE_IN: "animate-scale-in",
    SCALE_OUT: "animate-scale-out",
    IMAGE_LOAD: "animate-image-load"};
  const ANIMATION_STYLE_ID = "xeg-animation-styles";
  const ANIMATION_LAYER = "xeg.utilities";
  const GALLERY_SCOPE_HOSTS = CSS.SCOPES.HOSTS;
  const KEYFRAMES = {
    FADE_IN: "xeg-fade-in",
    FADE_OUT: "xeg-fade-out",
    SLIDE_IN_BOTTOM: "xeg-slide-in-bottom",
    SLIDE_OUT_TOP: "xeg-slide-out-top",
    SCALE_IN: "xeg-scale-in",
    SCALE_OUT: "xeg-scale-out",
    IMAGE_LOAD: "xeg-image-load"
  };
  function injectAnimationStyles() {
    if (hasStyle(ANIMATION_STYLE_ID)) {
      return;
    }
    const cssText = buildScopedAnimationCss();
    registerStyle({ id: ANIMATION_STYLE_ID, cssText });
    logger$2.debug("CSS animation styles registered via StyleRegistry.");
  }
  function buildScopedAnimationCss() {
    const scopedClass = (className) => GALLERY_SCOPE_HOSTS.map((scope) => `${scope} .${className}`).join(", ");
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
    return new Promise((resolve) => {
      try {
        const handleAnimationEnd = () => {
          element.removeEventListener("animationend", handleAnimationEnd);
          element.classList.remove(ANIMATION_CLASSES.FADE_IN);
          options.onComplete?.();
          resolve();
        };
        element.addEventListener("animationend", handleAnimationEnd);
        element.classList.add(ANIMATION_CLASSES.FADE_IN);
      } catch (error) {
        logger$2.warn("Gallery entry animation failed:", error);
        resolve();
      }
    });
  }
  async function animateGalleryExit(element, options = {}) {
    injectAnimationStyles();
    return new Promise((resolve) => {
      try {
        const handleAnimationEnd = () => {
          element.removeEventListener("animationend", handleAnimationEnd);
          element.classList.remove(ANIMATION_CLASSES.FADE_OUT);
          options.onComplete?.();
          resolve();
        };
        element.addEventListener("animationend", handleAnimationEnd);
        element.classList.add(ANIMATION_CLASSES.FADE_OUT);
      } catch (error) {
        logger$2.warn("Gallery exit animation failed:", error);
        resolve();
      }
    });
  }

  function useGalleryLifecycle(options) {
    const { containerEl, toolbarWrapperEl, isVisible } = options;
    createEffect(
      on(containerEl, (element) => {
        if (element) {
          ensureGalleryScrollAvailable(element);
        }
      })
    );
    createEffect(
      on(
        [containerEl, isVisible],
        ([container, visible]) => {
          if (!container) return;
          if (visible) {
            animateGalleryEnter(container);
          } else {
            animateGalleryExit(container);
            const logCleanupFailure = (error) => {
              logger$2.warn("video cleanup failed", { error });
            };
            const videos = container.querySelectorAll("video");
            videos.forEach((video) => {
              try {
                video.pause();
              } catch (error) {
                logCleanupFailure(error);
              }
              try {
                if (video.currentTime !== 0) {
                  video.currentTime = 0;
                }
              } catch (error) {
                logCleanupFailure(error);
              }
            });
          }
        },
        { defer: true }
      )
    );
    createEffect(() => {
      const container = containerEl();
      const wrapper = toolbarWrapperEl();
      if (!container || !wrapper) return;
      const cleanup = observeViewportCssVars(container, () => {
        const toolbarHeight = wrapper ? Math.floor(wrapper.getBoundingClientRect().height) : 0;
        return { toolbarHeight, paddingTop: 0, paddingBottom: 0 };
      });
      onCleanup(() => {
        cleanup?.();
      });
    });
  }

  function useGalleryNavigation(options) {
    const { isVisible, scrollToItem } = options;
    const [lastNavigationTrigger, setLastNavigationTrigger] = createSignal(
      null
    );
    const [programmaticScrollTimestamp, setProgrammaticScrollTimestamp] = createSignal(0);
    createEffect(
      on(isVisible, (visible) => {
        if (!visible) {
          return;
        }
        const dispose = registerNavigationEvents({
          onTriggerChange: setLastNavigationTrigger,
          onNavigateComplete: ({ index, trigger }) => {
            if (trigger === "scroll") {
              return;
            }
            scrollToItem(index);
          }
        });
        onCleanup(dispose);
      })
    );
    return {
      lastNavigationTrigger,
      setLastNavigationTrigger,
      programmaticScrollTimestamp,
      setProgrammaticScrollTimestamp
    };
  }
  function registerNavigationEvents({
    onTriggerChange,
    onNavigateComplete
  }) {
    const stopStart = galleryIndexEvents.on(
      "navigate:start",
      (payload) => onTriggerChange(payload.trigger)
    );
    const stopComplete = galleryIndexEvents.on(
      "navigate:complete",
      (payload) => {
        onTriggerChange(payload.trigger);
        onNavigateComplete(payload);
      }
    );
    return () => {
      stopStart();
      stopComplete();
    };
  }

  function useToolbarAutoHide(options) {
    const { isVisible, hasItems } = options;
    const computeInitialVisibility = () => Boolean(isVisible() && hasItems());
    const [isInitialToolbarVisible, setIsInitialToolbarVisible] = createSignal(
      computeInitialVisibility()
    );
    let activeTimer = null;
    const clearActiveTimer = () => {
      if (activeTimer === null) {
        return;
      }
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

  function useVerticalGallery(options) {
    const {
      isVisible,
      currentIndex,
      mediaItemsCount,
      containerEl,
      toolbarWrapperEl,
      itemsContainerEl,
      onClose
    } = options;
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
    const { isScrolling } = useGalleryScroll({
      container: containerEl,
      scrollTarget: itemsContainerEl,
      enabled: isVisible,
      programmaticScrollTimestamp: () => navigationState.programmaticScrollTimestamp(),
      onScrollEnd: () => focusSyncCallback()?.()
    });
    const { scrollToItem, scrollToCurrentItem } = useGalleryItemScroll(
      containerEl,
      currentIndex,
      mediaItemsCount,
      {
        enabled: () => !isScrolling() && navigationState.lastNavigationTrigger() !== "scroll",
        block: "start",
        isScrolling,
        onScrollStart: () => navigationState.setProgrammaticScrollTimestamp(Date.now())
      }
    );
    scrollToItemRef = scrollToItem;
    const {
      focusedIndex,
      registerItem: registerFocusItem,
      handleItemFocus,
      forceSync: focusTrackerForceSync
    } = useGalleryFocusTracker({
      container: containerEl,
      isEnabled: isVisible,
      isScrolling,
      lastNavigationTrigger: navigationState.lastNavigationTrigger
    });
    createEffect(() => setFocusSyncCallback(() => focusTrackerForceSync));
    useGalleryLifecycle({
      containerEl,
      toolbarWrapperEl,
      isVisible
    });
    createEffect(() => {
      if (isScrolling()) {
        setIsInitialToolbarVisible(false);
      }
    });
    useGalleryKeyboard({
      onClose: onClose ?? (() => {
      })
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

  const container$1 = "xeg_X9gZRg";
  const toolbarWrapper = "xeg_meO3Up";
  const isScrolling = "xeg_sOsSyv";
  const itemsContainer = "xeg_gmRWyH";
  const empty = "xeg_yhK-Ds";
  const galleryItem = "xeg_EfVayF";
  const itemActive = "xeg_LxHLC8";
  const scrollSpacer = "xeg_sfF005";
  const toolbarHoverZone = "xeg_gC-mQz";
  const initialToolbarVisible = "xeg_Canm64";
  const emptyMessage = "xeg_fwsrVX";
  var styles$2 = {
  	container: container$1,
  	toolbarWrapper: toolbarWrapper,
  	isScrolling: isScrolling,
  	itemsContainer: itemsContainer,
  	empty: empty,
  	galleryItem: galleryItem,
  	itemActive: itemActive,
  	scrollSpacer: scrollSpacer,
  	toolbarHoverZone: toolbarHoverZone,
  	initialToolbarVisible: initialToolbarVisible,
  	emptyMessage: emptyMessage
  };

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
        timeoutId = null;
        const args = pendingArgs;
        pendingArgs = null;
        fn(...args);
      }
    };
    const debounced = ((...args) => {
      cancel();
      pendingArgs = args;
      timeoutId = setTimeout(() => {
        timeoutId = null;
        const savedArgs = pendingArgs;
        pendingArgs = null;
        if (savedArgs !== null) {
          fn(...savedArgs);
        }
      }, delayMs);
    });
    debounced.cancel = cancel;
    debounced.flush = flush;
    return debounced;
  }

  function useVideoVisibility(options) {
    const { container, video, isVideo } = options;
    let wasPlayingBeforeHidden = false;
    let wasMutedBeforeHidden = null;
    let unsubscribeObserver;
    let hasRunUnsubscribe = false;
    const runUnsubscribe = () => {
      if (hasRunUnsubscribe) {
        return;
      }
      hasRunUnsubscribe = true;
      if (typeof unsubscribeObserver === "function") {
        unsubscribeObserver();
      }
    };
    createEffect(() => {
      if (!isVideo) {
        return;
      }
      const videoEl = video();
      if (videoEl && typeof videoEl.muted === "boolean") {
        try {
          videoEl.muted = true;
        } catch (err) {
          logger$2.warn("Failed to mute video", { error: err });
        }
      }
    });
    createEffect(() => {
      if (!isVideo) {
        return;
      }
      const containerEl = container();
      const videoEl = video();
      if (!containerEl || !videoEl) {
        return;
      }
      const pauseVideo = () => {
        if (typeof videoEl.pause === "function") {
          videoEl.pause();
        }
      };
      const playVideo = () => {
        if (typeof videoEl.play === "function") {
          void videoEl.play();
        }
      };
      const handleVisibilityChange = (entry) => {
        if (!entry.isIntersecting) {
          try {
            wasPlayingBeforeHidden = !videoEl.paused;
            wasMutedBeforeHidden = videoEl.muted;
            videoEl.muted = true;
            if (!videoEl.paused) {
              pauseVideo();
            }
          } catch (err) {
            logger$2.warn("Failed to pause video", { error: err });
          }
        } else {
          try {
            if (wasMutedBeforeHidden !== null) {
              videoEl.muted = wasMutedBeforeHidden;
            }
            if (wasPlayingBeforeHidden) {
              playVideo();
            }
          } catch (err) {
            logger$2.warn("Failed to resume video", { error: err });
          } finally {
            wasPlayingBeforeHidden = false;
            wasMutedBeforeHidden = null;
          }
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

  const VIDEO_EXTENSIONS = [".mp4", ".webm", ".mov", ".avi"];
  function cleanFilename(filename) {
    if (!filename) {
      return "Untitled";
    }
    let cleaned = filename.replace(/^twitter_media_\d{8}T\d{6}_/, "").replace(/^\/media\//, "").replace(/^\.\//g, "");
    const lastSegment = cleaned.split(/[\\/]/).pop();
    if (lastSegment) {
      cleaned = lastSegment;
    }
    if (/^[\\/]+$/.test(cleaned)) {
      cleaned = "";
    }
    if (cleaned.length > 40 || !cleaned) {
      const match = filename.match(/([^/\\]+)$/);
      cleaned = match?.[1] ?? "Image";
    }
    return cleaned;
  }
  function isVideoMedia(media) {
    const urlLowerCase = media.url.toLowerCase();
    if (VIDEO_EXTENSIONS.some((ext) => urlLowerCase.includes(ext))) {
      return true;
    }
    if (media.filename) {
      const filenameLowerCase = media.filename.toLowerCase();
      if (VIDEO_EXTENSIONS.some((ext) => filenameLowerCase.endsWith(ext))) {
        return true;
      }
    }
    try {
      const url = new URL(media.url);
      return url.hostname === "video.twimg.com";
    } catch {
      return false;
    }
  }

  const container = "xeg_huYoSL";
  const active = "xeg_xm-1cY";
  const focused = "xeg_luqi-C";
  const imageWrapper = "xeg_8-c8dL";
  const image = "xeg_FWlk5q";
  const fitOriginal = "xeg_yYtGJp";
  const video = "xeg_GUevPQ";
  const placeholder = "xeg_lhkEW2";
  const loadingSpinner = "xeg_6YYDYR";
  const loading = "xeg_8Z3Su4";
  const loaded = "xeg_y9iPua";
  const fitWidth = "xeg_Uc0oUi";
  const fitHeight = "xeg_M9Z6MG";
  const fitContainer = "xeg_-Mlrhi";
  const errorIcon = "xeg_Wno7Ud";
  const errorText = "xeg_8-wisg";
  const error = "xeg_GswePL";
  var styles$1 = {
  	container: container,
  	active: active,
  	focused: focused,
  	imageWrapper: imageWrapper,
  	image: image,
  	fitOriginal: fitOriginal,
  	video: video,
  	placeholder: placeholder,
  	loadingSpinner: loadingSpinner,
  	loading: loading,
  	loaded: loaded,
  	fitWidth: fitWidth,
  	fitHeight: fitHeight,
  	fitContainer: fitContainer,
  	errorIcon: errorIcon,
  	errorText: errorText,
  	error: error};

  var _tmpl$$5 = /* @__PURE__ */ template(`<div data-xeg-role=gallery-item data-xeg-gallery=true data-xeg-gallery-type=item data-xeg-gallery-version=2.0 data-xeg-component=vertical-image-item data-xeg-block-twitter=true>`), _tmpl$2$3 = /* @__PURE__ */ template(`<div><div>`), _tmpl$3$1 = /* @__PURE__ */ template(`<video controls>`), _tmpl$4$1 = /* @__PURE__ */ template(`<img loading=lazy decoding=async>`, true, false, false), _tmpl$5$1 = /* @__PURE__ */ template(`<div><span>⚠️</span><span>`);
  const FIT_MODE_CLASSES = {
    original: styles$1.fitOriginal,
    fitHeight: styles$1.fitHeight,
    fitWidth: styles$1.fitWidth,
    fitContainer: styles$1.fitContainer
  };
  function VerticalImageItem(props) {
    const {
      media,
      index,
      isActive,
      isFocused = false,
      forceVisible = false,
      onClick,
      onImageContextMenu,
      className: className$1 = "",
      onMediaLoad,
      "data-testid": testId,
      "aria-label": ariaLabel,
      "aria-describedby": ariaDescribedBy,
      registerContainer,
      role,
      tabIndex,
      onFocus,
      onBlur,
      onKeyDown
    } = props;
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
      const video = videoRef();
      if (video && isVideo) {
        isApplyingVideoSettings = true;
        try {
          video.muted = videoMuted();
          video.volume = videoVolume();
        } finally {
          isApplyingVideoSettings = false;
        }
      }
    });
    const debouncedSaveVolume = createDebounced((volume, muted) => {
      void setTypedSetting("gallery.videoVolume", volume);
      void setTypedSetting("gallery.videoMuted", muted);
    }, 300);
    onCleanup(() => {
      debouncedSaveVolume.flush();
    });
    const handleVolumeChange = (event) => {
      if (isApplyingVideoSettings) {
        return;
      }
      const video = event.currentTarget;
      const newVolume = video.volume;
      const newMuted = video.muted;
      setVideoVolume(newVolume);
      setVideoMuted(newMuted);
      debouncedSaveVolume(newVolume, newMuted);
    };
    const handleClick = () => {
      containerRef()?.focus?.({
        preventScroll: true
      });
      onClick?.();
    };
    const handleContainerClick = (event) => {
      const mouseEvent = event;
      mouseEvent?.stopImmediatePropagation?.();
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
      if (forceVisible && !isVisible()) {
        setIsVisible(true);
      }
    });
    createEffect(() => {
      const container = containerRef();
      if (!container || isVisible() || forceVisible) {
        return;
      }
      let unsubscribe = null;
      const handleEntry = (entry) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          unsubscribe?.();
          unsubscribe = null;
        }
      };
      unsubscribe = SharedObserver.observe(container, handleEntry, {
        threshold: 0.1,
        rootMargin: "100px"
      });
      onCleanup(() => {
        unsubscribe?.();
        unsubscribe = null;
      });
    });
    createEffect(() => {
      if (!isVisible() || isLoaded()) {
        return;
      }
      if (isVideo) {
        const video = videoRef();
        if (video && video.readyState >= 1) {
          handleMediaLoad();
        }
      } else {
        const image = imageRef();
        if (image?.complete) {
          handleMediaLoad();
        }
      }
    });
    const resolvedFitMode = createMemo(() => {
      const value = props.fitMode;
      if (typeof value === "function") {
        return value() ?? "fitWidth";
      }
      return value ?? "fitWidth";
    });
    const fitModeClass = createMemo(() => FIT_MODE_CLASSES[resolvedFitMode()] ?? "");
    const containerClasses = createMemo(() => cx("xeg-gallery", "xeg-gallery-item", "vertical-item", styles$1.container, styles$1.imageWrapper, isActive ? styles$1.active : void 0, isFocused ? styles$1.focused : void 0, fitModeClass(), className$1));
    const imageClasses = createMemo(() => cx(styles$1.image, fitModeClass()));
    const ariaProps = {
      "aria-label": ariaLabel || `Media ${index + 1}: ${cleanFilename(media.filename)}`,
      "aria-describedby": ariaDescribedBy,
      role: role || "button",
      tabIndex: tabIndex ?? 0
    };
    const testProps = testId ? {
      "data-testid": testId
    } : {};
    const assignContainerRef = (element) => {
      setContainerRef(element);
      registerContainer?.(element);
    };
    return (() => {
      var _el$ = _tmpl$$5();
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
      }, ariaProps, testProps), false);
      insert(_el$, (() => {
        var _c$ = memo(() => !!isVisible());
        return () => _c$() && [memo(() => memo(() => !!(!isLoaded() && !isError() && !isVideo))() && (() => {
          var _el$2 = _tmpl$2$3(), _el$3 = _el$2.firstChild;
          createRenderEffect((_p$) => {
            var _v$ = styles$1.placeholder, _v$2 = cx("xeg-spinner", styles$1.loadingSpinner);
            _v$ !== _p$.e && className(_el$2, _p$.e = _v$);
            _v$2 !== _p$.t && className(_el$3, _p$.t = _v$2);
            return _p$;
          }, {
            e: void 0,
            t: void 0
          });
          return _el$2;
        })()), isVideo ? (() => {
          var _el$4 = _tmpl$3$1();
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
            var _v$3 = media.url, _v$4 = cx(styles$1.video, fitModeClass(), isLoaded() ? styles$1.loaded : styles$1.loading), _v$5 = resolvedFitMode();
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
          var _el$5 = _tmpl$4$1();
          _el$5.addEventListener("dragstart", (e) => e.preventDefault());
          _el$5.$$contextmenu = handleContextMenu;
          _el$5.addEventListener("error", handleMediaError);
          _el$5.addEventListener("load", handleMediaLoad);
          use(setImageRef, _el$5);
          createRenderEffect((_p$) => {
            var _v$6 = media.url, _v$7 = cleanFilename(media.filename) || getLanguageService().translate("messages.gallery.failedToLoadImage", {
              type: "image"
            }), _v$8 = cx(imageClasses(), isLoaded() ? styles$1.loaded : styles$1.loading), _v$9 = resolvedFitMode();
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
        })(), memo(() => memo(() => !!isError())() && (() => {
          var _el$6 = _tmpl$5$1(), _el$7 = _el$6.firstChild, _el$8 = _el$7.nextSibling;
          insert(_el$8, () => getLanguageService().translate("messages.gallery.failedToLoadImage", {
            type: isVideo ? "video" : "image"
          }));
          createRenderEffect((_p$) => {
            var _v$0 = styles$1.error, _v$1 = styles$1.errorIcon, _v$10 = styles$1.errorText;
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
        })())];
      })());
      return _el$;
    })();
  }
  delegateEvents(["click", "keydown", "contextmenu"]);

  var _tmpl$$4 = /* @__PURE__ */ template(`<div><div><h3></h3><p>`), _tmpl$2$2 = /* @__PURE__ */ template(`<div data-xeg-gallery=true data-xeg-role=gallery><div data-role=toolbar-hover-zone></div><div data-role=toolbar></div><div data-xeg-role=items-container data-xeg-role-compat=items-list><div aria-hidden=true data-xeg-role=scroll-spacer>`);
  function VerticalGalleryViewCore({
    onClose,
    className: className$1 = "",
    onPrevious,
    onNext,
    onDownloadCurrent,
    onDownloadAll
  }) {
    const mediaItems = createMemo(() => galleryState.value.mediaItems);
    const currentIndex = createMemo(() => galleryState.value.currentIndex);
    const isDownloading = createMemo(() => isDownloadUiBusy({
      downloadProcessing: downloadState.value.isProcessing
    }));
    const [containerEl, setContainerEl] = createSignal(null);
    const [toolbarWrapperEl, setToolbarWrapperEl] = createSignal(null);
    const [itemsContainerEl, setItemsContainerEl] = createSignal(null);
    const isVisible = createMemo(() => mediaItems().length > 0);
    const activeMedia = createMemo(() => {
      const items = mediaItems();
      const index = currentIndex();
      return items[index] ?? null;
    });
    const preloadIndices = createMemo(() => {
      const count = getTypedSettingOr("gallery.preloadCount", 0);
      return computePreloadIndices(currentIndex(), mediaItems().length, count);
    });
    const {
      scroll,
      navigation,
      focus,
      toolbar
    } = useVerticalGallery({
      isVisible,
      currentIndex,
      mediaItemsCount: () => mediaItems().length,
      containerEl,
      toolbarWrapperEl,
      itemsContainerEl,
      onClose
    });
    createEffect(() => {
      if (!isVisible() || navigation.lastNavigationTrigger()) {
        return;
      }
      navigateToItem(currentIndex(), "click");
    });
    const getInitialFitMode = () => {
      return getTypedSettingOr("gallery.imageFitMode", "fitWidth");
    };
    const [imageFitMode, setImageFitMode] = createSignal(getInitialFitMode());
    const persistFitMode = (mode) => setTypedSetting("gallery.imageFitMode", mode).catch((error) => {
      logger$2.warn("Failed to save fit mode", {
        error,
        mode
      });
    });
    const applyFitMode = (mode, event) => {
      safeEventPrevent(event);
      setImageFitMode(mode);
      void persistFitMode(mode);
      scroll.scrollToCurrentItem();
      navigateToItem(currentIndex(), "click");
    };
    const handleDownloadCurrent = () => onDownloadCurrent?.();
    const handleDownloadAll = () => onDownloadAll?.();
    const handleFitOriginal = (event) => applyFitMode("original", event);
    const handleFitWidth = (event) => applyFitMode("fitWidth", event);
    const handleFitHeight = (event) => applyFitMode("fitHeight", event);
    const handleFitContainer = (event) => applyFitMode("fitContainer", event);
    const handlePrevious = () => {
      const current = currentIndex();
      if (current > 0) {
        navigateToItem(current - 1, "click");
      }
    };
    const handleNext = () => {
      const current = currentIndex();
      const items = mediaItems();
      if (current < items.length - 1) {
        navigateToItem(current + 1, "click");
      }
    };
    const handleBackgroundClick = (event) => {
      const target = event.target;
      if (target.closest('[data-role="toolbar"]') || target.closest('[data-role="toolbar-hover-zone"]') || target.closest('[data-gallery-element="toolbar"]') || target.closest("[data-gallery-element]")) {
        return;
      }
      if (target.closest('[data-xeg-role="gallery-item"]')) {
        return;
      }
      if (target.closest('[data-xeg-role="scroll-spacer"]')) {
        return;
      }
      onClose?.();
    };
    const handleMediaItemClick = (index) => {
      const items = mediaItems();
      const current = currentIndex();
      if (index >= 0 && index < items.length && index !== current) {
        navigateToItem(index, "click");
      }
    };
    createEffect(() => {
      const container = containerEl();
      if (!container) return;
      const handleContainerWheel = (event) => {
        const itemsContainer = itemsContainerEl();
        if (!itemsContainer) return;
        const target = event.target;
        if (itemsContainer.contains(target)) {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        itemsContainer.scrollTop += event.deltaY;
      };
      container.addEventListener("wheel", handleContainerWheel, {
        passive: false
      });
      onCleanup(() => container.removeEventListener("wheel", handleContainerWheel));
    });
    if (!isVisible() || mediaItems().length === 0) {
      const languageService = getLanguageService();
      const emptyTitle = languageService.translate("messages.gallery.emptyTitle");
      const emptyDesc = languageService.translate("messages.gallery.emptyDescription");
      return (() => {
        var _el$ = _tmpl$$4(), _el$2 = _el$.firstChild, _el$3 = _el$2.firstChild, _el$4 = _el$3.nextSibling;
        insert(_el$3, emptyTitle);
        insert(_el$4, emptyDesc);
        createRenderEffect((_p$) => {
          var _v$ = cx(styles$2.container, styles$2.empty, className$1), _v$2 = styles$2.emptyMessage;
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
      var _el$5 = _tmpl$2$2(), _el$6 = _el$5.firstChild, _el$7 = _el$6.nextSibling, _el$8 = _el$7.nextSibling, _el$9 = _el$8.firstChild;
      _el$5.$$click = handleBackgroundClick;
      use((el) => setContainerEl(el ?? null), _el$5);
      use((el) => setToolbarWrapperEl(el ?? null), _el$7);
      insert(_el$7, createComponent(Toolbar, {
        currentIndex,
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
          return styles$2.toolbar || "";
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
            onClose: onClose || (() => {
            }),
            onOpenSettings: () => logger$2.debug("[VerticalGalleryView] Settings opened")
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
          const forcePreload = preloadIndices().includes(actualIndex);
          return createComponent(VerticalImageItem, mergeProps({
            media: item,
            index: actualIndex,
            get isActive() {
              return actualIndex === currentIndex();
            },
            get isFocused() {
              return actualIndex === focus.focusedIndex();
            },
            forceVisible: forcePreload,
            fitMode: imageFitMode,
            onClick: () => handleMediaItemClick(actualIndex),
            get className() {
              return cx(styles$2.galleryItem, actualIndex === currentIndex() && styles$2.itemActive);
            },
            "data-index": actualIndex,
            "data-xeg-role": "gallery-item",
            registerContainer: (element) => focus.registerItem(actualIndex, element)
          }, onDownloadCurrent ? {
            onDownload: handleDownloadCurrent
          } : {}, {
            onFocus: () => focus.handleItemFocus(actualIndex)
          }));
        }
      }), _el$9);
      createRenderEffect((_p$) => {
        var _v$3 = cx(styles$2.container, toolbar.isInitialToolbarVisible() && styles$2.initialToolbarVisible, scroll.isScrolling() && styles$2.isScrolling, className$1), _v$4 = styles$2.toolbarHoverZone, _v$5 = styles$2.toolbarWrapper, _v$6 = styles$2.itemsContainer, _v$7 = styles$2.scrollSpacer;
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
  const VerticalGalleryView = VerticalGalleryViewCore;
  delegateEvents(["click"]);

  var _tmpl$$3 = /* @__PURE__ */ template(`<div data-xeg-gallery-container>`);
  const ESCAPE_LISTENER_STORAGE_KEY = "__xegCapturedEscapeListener";
  function GalleryContainer({
    children,
    onClose,
    className: className$1,
    registerEscapeListener
  }) {
    const classes = cx("xeg-gallery-overlay", "xeg-gallery-container", className$1);
    const hasCloseHandler = typeof onClose === "function";
    const escapeListener = (event) => {
      if (!hasCloseHandler) {
        return;
      }
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
      if (!hasCloseHandler) {
        return;
      }
      const eventManager = EventManager.getInstance();
      const listenerId = eventManager.addListener(document, "keydown", escapeListener);
      onCleanup(() => {
        eventManager.removeListener(listenerId);
      });
    });
    return (() => {
      var _el$ = _tmpl$$3();
      className(_el$, classes);
      insert(_el$, children);
      return _el$;
    })();
  }

  class NotificationService {
    static singleton = createSingleton(() => new NotificationService());
    constructor() {
    }
    static getInstance() {
      return NotificationService.singleton.get();
    }
    /** @internal Test helper */
    static resetForTests() {
      NotificationService.singleton.reset();
    }
    gmNotify(options) {
      const gm = globalThis.GM_notification;
      if (!gm) return;
      try {
        const details = {
          title: options.title
        };
        if (typeof options.text !== "undefined") {
          details.text = options.text;
        }
        if (typeof options.image !== "undefined") {
          details.image = options.image;
        }
        if (typeof options.timeout !== "undefined") {
          details.timeout = options.timeout;
        }
        if (typeof options.onclick === "function") {
          details.onclick = options.onclick;
        }
        gm(details, void 0);
      } catch (e) {
        logger$2.warn("[NotificationService] GM_notification failed (silent lean mode)", e);
      }
    }
    async show(options) {
      const gm = globalThis.GM_notification;
      if (gm) {
        this.gmNotify(options);
        logger$2.debug(`Notification (gm): ${options.title}`);
      } else {
        logger$2.debug(`Notification skipped (no GM_notification): ${options.title}`);
      }
    }
    async error(title, text, timeout = 5e3) {
      await this.show({ title, text: text ?? "An error occurred.", timeout });
    }
  }

  var _tmpl$$2 = /* @__PURE__ */ template(`<div role=alert data-xeg-error-boundary aria-live=polite><p class=xeg-error-boundary__title></p><p class=xeg-error-boundary__body></p><button type=button class=xeg-error-boundary__action>Retry`);
  function stringifyError(error) {
    if (error instanceof Error && error.message) {
      return error.message;
    }
    try {
      return String(error);
    } catch {
      return "Unknown error";
    }
  }
  function translateError(error) {
    try {
      const languageService = getLanguageService();
      return {
        title: languageService.translate("messages.errorBoundary.title"),
        body: languageService.translate("messages.errorBoundary.body", {
          error: stringifyError(error)
        })
      };
    } catch {
      return {
        title: "Unexpected error",
        body: stringifyError(error)
      };
    }
  }
  function ErrorBoundary(props) {
    let lastReportedError;
    const [caughtError, setCaughtError] = createSignal(void 0);
    const [boundaryMounted, setBoundaryMounted] = createSignal(true);
    const notifyError = (error) => {
      if (lastReportedError === error) return;
      lastReportedError = error;
      try {
        const copy = translateError(error);
        NotificationService.getInstance().error(copy.title, copy.body);
      } catch {
      }
    };
    const handleRetry = () => {
      lastReportedError = void 0;
      setCaughtError(void 0);
      setBoundaryMounted(false);
      queueMicrotask(() => setBoundaryMounted(true));
    };
    const renderFallback = (error) => {
      let title = "Unexpected error";
      let body = stringifyError(error);
      try {
        const copy = translateError(error);
        title = copy.title;
        body = copy.body;
      } catch {
      }
      return (() => {
        var _el$ = _tmpl$$2(), _el$2 = _el$.firstChild, _el$3 = _el$2.nextSibling, _el$4 = _el$3.nextSibling;
        insert(_el$2, title);
        insert(_el$3, body);
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
      children: (error) => renderFallback(error())
    })];
  }
  delegateEvents(["click"]);

  const ZERO_RESULT = Object.freeze({
    pausedCount: 0,
    totalCandidates: 0,
    skippedCount: 0
  });
  function resolveRoot(root) {
    if (root && typeof root.querySelectorAll === "function") return root;
    return typeof document !== "undefined" && typeof document.querySelectorAll === "function" ? document : null;
  }
  function isVideoPlaying(video) {
    try {
      return !video.paused && !video.ended;
    } catch {
      return false;
    }
  }
  function shouldPauseVideo(video, force = false) {
    return video instanceof HTMLVideoElement && !isGalleryInternalElement(video) && video.isConnected && (force || isVideoPlaying(video));
  }
  function tryPauseVideo(video) {
    try {
      video.pause?.();
      return true;
    } catch (error) {
      logger$2.debug("[AmbientVideo] Failed to pause Twitter video", { error });
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
    for (const video of videos) {
      if (!shouldPauseVideo(video, options.force)) {
        continue;
      }
      totalCandidates += 1;
      if (tryPauseVideo(video)) {
        pausedCount += 1;
      }
    }
    const result = {
      pausedCount,
      totalCandidates,
      skippedCount: inspectedCount - pausedCount
    };
    if (result.pausedCount > 0) {
      logger$2.debug("[AmbientVideo] Ambient Twitter videos paused", {
        ...result,
        inspected: inspectedCount
      });
    }
    return result;
  }

  const VIDEO_TRIGGER_SCOPES = /* @__PURE__ */ new Set([
    SELECTORS.VIDEO_PLAYER,
    ...STABLE_SELECTORS.VIDEO_CONTAINERS
  ]);
  const IMAGE_TRIGGER_SCOPES = /* @__PURE__ */ new Set([
    SELECTORS.TWEET_PHOTO,
    ...STABLE_SELECTORS.IMAGE_CONTAINERS
  ]);
  const PAUSE_RESULT_DEFAULT = Object.freeze({
    pausedCount: 0,
    totalCandidates: 0,
    skippedCount: 0
  });
  function findTweetContainer(element) {
    if (!element) {
      return null;
    }
    for (const selector of STABLE_SELECTORS.TWEET_CONTAINERS) {
      try {
        const container = element.closest(selector);
        if (container instanceof HTMLElement) {
          return container;
        }
      } catch {
      }
    }
    return null;
  }
  function resolvePauseContext(request) {
    if (request.root !== void 0) {
      return {
        root: request.root ?? null,
        scope: "custom"
      };
    }
    const tweetContainer = findTweetContainer(request.sourceElement);
    if (tweetContainer) {
      return {
        root: null,
        scope: "tweet"
      };
    }
    return {
      root: null,
      scope: "document"
    };
  }
  function isVideoTriggerElement(element) {
    if (!element) return false;
    if (element.tagName === "VIDEO") return true;
    for (const selector of VIDEO_TRIGGER_SCOPES) {
      try {
        if (element.matches(selector) || element.closest(selector)) {
          return true;
        }
      } catch {
      }
    }
    return false;
  }
  function isImageTriggerElement(element) {
    if (!element) return false;
    if (element.tagName === "IMG") return true;
    for (const selector of IMAGE_TRIGGER_SCOPES) {
      try {
        if (element.matches(selector) || element.closest(selector)) {
          return true;
        }
      } catch {
      }
    }
    return false;
  }
  function inferAmbientVideoTrigger(element) {
    if (isVideoTriggerElement(element)) {
      return "video-click";
    }
    if (isImageTriggerElement(element)) {
      return "image-click";
    }
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
    } catch (error) {
      logger$2.warn("[AmbientVideoCoordinator] Failed to pause ambient videos", { error, trigger });
      return {
        ...PAUSE_RESULT_DEFAULT,
        trigger,
        forced: force,
        reason,
        scope
      };
    }
    if (result.totalCandidates > 0 || result.pausedCount > 0) {
      logger$2.debug("[AmbientVideoCoordinator] Ambient videos paused", {
        ...result,
        reason,
        trigger,
        forced: force,
        scope
      });
    }
    return {
      ...result,
      trigger,
      forced: force,
      reason,
      scope
    };
  }

  let GalleryRenderer$1 = class GalleryRenderer {
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
        if (isOpen && !this.container) {
          this.renderGallery();
        } else if (!isOpen && this.container) {
          this.cleanupGallery();
        }
      });
    }
    renderGallery() {
      if (this.isRenderingFlag || this.container) return;
      const {
        isOpen,
        mediaItems
      } = gallerySignals;
      if (!isOpen.value || mediaItems.value.length === 0) return;
      this.isRenderingFlag = true;
      logger$2.info("[GalleryRenderer] Rendering started");
      try {
        this.createContainer();
        this.renderComponent();
        logger$2.debug("[GalleryRenderer] Component rendering complete");
      } catch (error) {
        logger$2.error("[GalleryRenderer] Rendering failed:", error);
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
          const unbindTheme = themeService.onThemeChange((_, setting) => setCurrentTheme(setting));
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
            return createComponent(ErrorBoundary, {
              get children() {
                return createComponent(VerticalGalleryView, {
                  onClose: handleClose,
                  onPrevious: () => navigatePrevious("button"),
                  onNext: () => navigateNext("button"),
                  onDownloadCurrent: () => handleDownload("current"),
                  onDownloadAll: () => handleDownload("all"),
                  className: "xeg-vertical-gallery"
                });
              }
            });
          }
        });
      };
      this.disposeApp = render(() => createComponent(Root, {}), this.container);
      logger$2.info("[GalleryRenderer] Gallery mounted");
    }
    async handleDownload(type) {
      logger$2.info(`[GalleryRenderer] handleDownload called with type: ${type}`);
      if (!isGMAPIAvailable("download")) {
        logger$2.warn("[GalleryRenderer] GM_download not available");
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
            if (!result.success) {
              setError(result.error || "Download failed.");
            }
          }
        } else {
          const result = await downloadService.downloadBulk([...mediaItems]);
          if (!result.success) {
            setError(result.error || "Download failed.");
          }
        }
      } catch (error) {
        logger$2.error(`[GalleryRenderer] ${type} download failed:`, error);
        setError("Download failed.");
      } finally {
        releaseLock();
      }
    }
    /**
     * Lazy load download service on first use.
     * This enables code splitting - download code is only loaded when user initiates a download.
     */
    async getDownloadService() {
      const {
        ensureDownloadServiceRegistered
      } = await Promise.resolve().then(function () { return lazyServices; });
      await ensureDownloadServiceRegistered();
      const {
        DownloadOrchestrator
      } = await Promise.resolve().then(function () { return downloadOrchestrator; });
      return DownloadOrchestrator.getInstance();
    }
    cleanupGallery() {
      logger$2.debug("[GalleryRenderer] Cleanup started");
      this.isRenderingFlag = false;
      this.cleanupContainer();
    }
    cleanupContainer() {
      if (this.container) {
        try {
          this.disposeApp?.();
          this.disposeApp = null;
          if (document.contains(this.container)) {
            this.container.remove();
          }
        } catch (error) {
          logger$2.warn("[GalleryRenderer] Container cleanup failed:", error);
        }
        this.container = null;
      }
    }
    async render(mediaItems, renderOptions) {
      const pauseContext = renderOptions?.pauseContext ?? {
        reason: "programmatic"
      };
      try {
        pauseAmbientVideosForGallery(pauseContext);
      } catch (error) {
        logger$2.warn("[GalleryRenderer] Ambient video pause failed", {
          error
        });
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
      logger$2.info("[GalleryRenderer] Full cleanup started");
      this.stateUnsubscribe?.();
      this.cleanupGallery();
    }
  };

  var GalleryRenderer = {
    __proto__: null,
    GalleryRenderer: GalleryRenderer$1
  };

  const FORBIDDEN_KEYS = /* @__PURE__ */ new Set(["__proto__", "constructor", "prototype"]);
  function isSafeKey(key) {
    return !FORBIDDEN_KEYS.has(key);
  }
  function resolveNestedPath(source, path) {
    if (!source || typeof source !== "object" || !path) {
      return void 0;
    }
    const keys = path.split(".");
    let current = source;
    for (const key of keys) {
      if (!isSafeKey(key)) {
        return void 0;
      }
      if (current === null || current === void 0 || typeof current !== "object") {
        return void 0;
      }
      current = current[key];
    }
    return current;
  }
  function assignNestedPath(target, path, value, options) {
    if (!target || typeof target !== "object" || !path) {
      return false;
    }
    const keys = path.split(".");
    if (keys.length === 0) {
      return false;
    }
    for (const key of keys) {
      if (!isSafeKey(key)) {
        return false;
      }
    }
    let current = target;
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!key || !isSafeKey(key)) continue;
      const descriptor = Object.getOwnPropertyDescriptor(current, key);
      const hasOwnKey = descriptor !== void 0;
      const existingValue = hasOwnKey ? descriptor.value : void 0;
      if (!hasOwnKey || typeof existingValue !== "object" || existingValue === null) {
        const newObj = /* @__PURE__ */ Object.create(null);
        Object.defineProperty(current, key, {
          value: newObj,
          writable: true,
          enumerable: true,
          configurable: true
        });
        current = newObj;
      } else {
        current = existingValue;
      }
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

  const migrations = {
    // Phase 447: Force-enable keyboard navigation after accidental default disablement
    "1.0.0": (input) => {
      const next = { ...input };
      next.gallery = {
        ...next.gallery,
        enableKeyboardNav: true
      };
      return next;
    }
    // '0.9.0': (input) => { /* example: rename keys, adjust ranges */ return input; },
  };
  function pruneWithTemplate(input, template) {
    if (!isRecord(input)) return {};
    const out = {};
    for (const key of Object.keys(template)) {
      const tplVal = template[key];
      const inVal = input[key];
      if (inVal === void 0) continue;
      if (isRecord(tplVal) && !Array.isArray(tplVal)) {
        out[key] = pruneWithTemplate(inVal, tplVal);
      } else {
        out[key] = inVal;
      }
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
    const merged = { ...DEFAULT_SETTINGS, ...pruned };
    for (const [key, defaults] of Object.entries(categories)) {
      merged[key] = {
        ...defaults,
        ...pruned[key] ?? {}
      };
    }
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
    if (typeof mig === "function") {
      try {
        working = mig(working);
      } catch {
      }
    }
    return fillWithDefaults(working);
  }

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
    const str = JSON.stringify(filtered, (key, value) => key === "__schemaHash" ? void 0 : value);
    return computeHash(str);
  }
  function computeCurrentSettingsSchemaHash() {
    return computeSettingsSchemaHashFrom(DEFAULT_SETTINGS);
  }

  class PersistentSettingsRepository {
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
        if (stored.__schemaHash !== this.schemaHash) {
          await this.persist(migrated);
        }
        return cloneDeep(migrated);
      } catch (error) {
        logger$2.warn("[SettingsRepository] load failed, falling back to defaults", error);
        const defaults = createDefaultSettings();
        await this.persist(defaults);
        return cloneDeep(defaults);
      }
    }
    async save(settings) {
      try {
        await this.persist(settings);
      } catch (error) {
        logger$2.error("[SettingsRepository] save failed", error);
        throw error;
      }
    }
    async persist(settings) {
      await this.storage.set(APP_SETTINGS_STORAGE_KEY, {
        ...settings,
        __schemaHash: this.schemaHash
      });
    }
  }

  const FEATURE_DEFAULTS = Object.freeze({ ...DEFAULT_SETTINGS.features });
  function normalizeFeatureFlags(features) {
    const featureKeys = Object.keys(FEATURE_DEFAULTS);
    return featureKeys.reduce(
      (acc, key) => {
        const candidate = features?.[key];
        acc[key] = typeof candidate === "boolean" ? candidate : FEATURE_DEFAULTS[key];
        return acc;
      },
      {}
    );
  }
  class SettingsService {
    constructor(repository = new PersistentSettingsRepository()) {
      this.repository = repository;
      this.lifecycle = createLifecycle("SettingsService", {
        onInitialize: () => this.onInitialize(),
        onDestroy: () => this.onDestroy()
      });
    }
    lifecycle;
    static singleton = createSingleton(() => new SettingsService());
    static getInstance() {
      return SettingsService.singleton.get();
    }
    /** @internal Test helper */
    static resetForTests() {
      SettingsService.singleton.reset();
    }
    settings = createDefaultSettings();
    featureMap = normalizeFeatureFlags(this.settings.features);
    listeners = /* @__PURE__ */ new Set();
    /** Initialize service (idempotent, fail-fast on error) */
    async initialize() {
      return this.lifecycle.initialize();
    }
    /** Destroy service (idempotent, graceful on error) */
    destroy() {
      this.lifecycle.destroy();
    }
    /** Check if service is initialized */
    isInitialized() {
      return this.lifecycle.isInitialized();
    }
    async onInitialize() {
      this.settings = await this.repository.load();
      this.refreshFeatureMap();
    }
    onDestroy() {
      this.listeners.clear();
      void this.repository.save(this.settings);
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
      for (const [key, value] of entries) {
        if (!this.isValid(key, value)) throw new Error(`Invalid setting value for ${key}`);
      }
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
      if (!category) {
        this.settings = createDefaultSettings();
      } else if (category in DEFAULT_SETTINGS) {
        this.settings[category] = cloneDeep(
          DEFAULT_SETTINGS[category]
        );
      }
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
      } catch (error) {
        logger$2.error("Settings import failed:", error);
        throw error;
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
        } catch (error) {
          logger$2.error("Settings listener error:", error);
        }
      });
    }
    assertInitialized() {
      if (!this.isInitialized()) {
        throw new Error("SettingsService must be initialized before use");
      }
    }
  }

  var settingsService = {
    __proto__: null,
    SettingsService: SettingsService
  };

  let guardDispose = null;
  let guardSubscribers = 0;
  function ensureGuardEffect() {
    if (guardDispose) {
      return;
    }
    guardDispose = effectSafe(() => {
      if (!gallerySignals.isOpen.value) {
        return;
      }
      const result = pauseAmbientVideosForGallery({
        trigger: "guard",
        reason: "guard"
      });
      if (result.pausedCount > 0) {
        logger$2.debug("[AmbientVideoGuard] Ambient pause triggered by guard", result);
      }
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
    if (guardSubscribers === 0) {
      return;
    }
    guardSubscribers -= 1;
    if (guardSubscribers > 0) {
      return;
    }
    guardDispose?.();
    guardDispose = null;
  }
  function withAmbientVideoGuard() {
    const dispose = startAmbientVideoGuard();
    return {
      dispose
    };
  }

  class GalleryApp {
    galleryRenderer = null;
    isInitialized = false;
    notificationService = NotificationService.getInstance();
    ambientVideoGuardHandle = null;
    constructor() {
      logger$2.info("[GalleryApp] Constructor called");
    }
    async initialize() {
      try {
        logger$2.info("[GalleryApp] Initialization started");
        this.galleryRenderer = getGalleryRenderer();
        this.galleryRenderer?.setOnCloseCallback(() => this.closeGallery());
        await this.setupEventHandlers();
        this.ambientVideoGuardHandle = this.ambientVideoGuardHandle ?? withAmbientVideoGuard();
        this.isInitialized = true;
        logger$2.info("[GalleryApp] ✅ Initialization complete");
      } catch (error) {
        galleryErrorReporter.critical(error, {
          code: "GALLERY_APP_INIT_FAILED"
        });
      }
    }
    async setupEventHandlers() {
      try {
        const { initializeGalleryEvents } = await Promise.resolve().then(function () { return galleryLifecycle; });
        const settingsService = tryGetSettingsManager();
        const enableKeyboard = settingsService?.get("gallery.enableKeyboardNav") ?? true;
        await initializeGalleryEvents(
          {
            onMediaClick: (element, event) => this.handleMediaClick(element, event),
            onGalleryClose: () => this.closeGallery(),
            onKeyboardEvent: (event) => {
              if (event.key === "Escape" && gallerySignals.isOpen.value) {
                this.closeGallery();
              }
            }
          },
          {
            enableKeyboard,
            enableMediaDetection: true,
            debugMode: false,
            preventBubbling: true,
            context: "gallery"
          }
        );
        logger$2.info("[GalleryApp] ✅ Event handlers setup complete");
      } catch (error) {
        galleryErrorReporter.critical(error, {
          code: "EVENT_HANDLERS_SETUP_FAILED"
        });
      }
    }
    async handleMediaClick(element, _event) {
      try {
        const mediaService = getMediaService();
        const result = await mediaService.extractFromClickedElement(element);
        if (result.success && result.mediaItems.length > 0) {
          await this.openGallery(result.mediaItems, result.clickedIndex, {
            pauseContext: {
              sourceElement: element,
              reason: "media-click"
            }
          });
        } else {
          mediaErrorReporter.warn(new Error("Media extraction returned no items"), {
            code: "MEDIA_EXTRACTION_EMPTY",
            metadata: { success: result.success }
          });
          this.notificationService.error("Failed to load media", "Could not find images or videos.");
        }
      } catch (error) {
        mediaErrorReporter.error(error, {
          code: "MEDIA_EXTRACTION_ERROR",
          notify: true
        });
        this.notificationService.error(
          "Error occurred",
          error instanceof Error ? error.message : "Unknown error"
        );
      }
    }
    async openGallery(mediaItems, startIndex = 0, options = {}) {
      if (!this.isInitialized) {
        logger$2.warn("[GalleryApp] Gallery not initialized.");
        this.notificationService.error(
          "Gallery unavailable",
          "Tampermonkey or similar userscript manager is required."
        );
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
        } catch (error) {
          logger$2.warn("[GalleryApp] Ambient video coordinator failed", error);
        }
        openGallery(mediaItems, validIndex);
      } catch (error) {
        galleryErrorReporter.error(error, {
          code: "GALLERY_OPEN_FAILED",
          metadata: { itemCount: mediaItems.length, startIndex },
          notify: true
        });
        this.notificationService.error(
          "Failed to load gallery",
          error instanceof Error ? error.message : "Unknown error"
        );
        throw error;
      }
    }
    closeGallery() {
      try {
        if (gallerySignals.isOpen.value) {
          closeGallery();
        }
      } catch (error) {
        galleryErrorReporter.error(error, {
          code: "GALLERY_CLOSE_FAILED"
        });
      }
    }
    async cleanup() {
      try {
        logger$2.info("[GalleryApp] Cleanup started");
        if (gallerySignals.isOpen.value) {
          this.closeGallery();
        }
        this.ambientVideoGuardHandle?.dispose();
        this.ambientVideoGuardHandle = null;
        try {
          const { cleanupGalleryEvents } = await Promise.resolve().then(function () { return galleryLifecycle; });
          cleanupGalleryEvents();
        } catch (error) {
          logger$2.warn("[GalleryApp] Event cleanup failed:", error);
        }
        this.galleryRenderer = null;
        this.isInitialized = false;
        delete globalThis.xegGalleryDebug;
        logger$2.info("[GalleryApp] ✅ Cleanup complete");
      } catch (error) {
        galleryErrorReporter.error(error, {
          code: "GALLERY_CLEANUP_FAILED"
        });
      }
    }
  }

  var GalleryApp$1 = {
    __proto__: null,
    GalleryApp: GalleryApp
  };

  async function initializeCriticalSystems() {
    try {
      const { registerCoreServices } = await Promise.resolve().then(function () { return serviceInitialization; });
      await registerCoreServices();
      warmupCriticalServices();
    } catch (error) {
      bootstrapErrorReporter.critical(error, {
        code: "CRITICAL_SYSTEMS_INIT_FAILED"
      });
    }
  }

  var criticalSystems = {
    __proto__: null,
    initializeCriticalSystems: initializeCriticalSystems
  };

  const ERROR_BEHAVIOR_MAP = {
    critical: { logLevel: "error", throwOnError: true },
    recoverable: { logLevel: "warn", throwOnError: false }
  };
  const normalizeErrorMessage = (error) => {
    if (error instanceof Error && error.message) {
      return error.message;
    }
    if (typeof error === "string" && error.length > 0) {
      return error;
    }
    return "Unknown bootstrap error";
  };
  function reportBootstrapError(error, options) {
    const severity = options.severity ?? "recoverable";
    const behavior = ERROR_BEHAVIOR_MAP[severity];
    const message = `[${options.context}] initialization failed: ${normalizeErrorMessage(error)}`;
    options.logger[behavior.logLevel](message, error);
    if (behavior.throwOnError) {
      throw error instanceof Error ? error : new Error(message);
    }
  }

  const FEATURE_KEYS = [
    "gallery",
    "settings",
    "download",
    "mediaExtraction",
    "accessibility"
  ];
  const DEFAULT_FEATURE_STATE = {
    gallery: true,
    settings: true,
    download: true,
    mediaExtraction: true,
    accessibility: true
  };
  function coerceBoolean(value, fallback) {
    if (typeof value === "boolean") {
      return value;
    }
    return fallback;
  }
  function readFlag(settings, feature) {
    const source = settings?.features ?? {};
    return coerceBoolean(source[feature], DEFAULT_FEATURE_STATE[feature]);
  }
  function resolveFeatureStates(settings) {
    return FEATURE_KEYS.reduce(
      (state, key) => {
        state[key] = readFlag(settings ?? void 0, key);
        return state;
      },
      {}
    );
  }
  const getDevOverride = () => {
    const scopedGlobal = globalThis;
    if (scopedGlobal && typeof scopedGlobal.__XEG_DEV__ === "boolean") {
      return scopedGlobal.__XEG_DEV__;
    }
    return void 0;
  };
  const isDevelopmentBuild = () => {
    const override = getDevOverride();
    if (typeof override === "boolean") {
      return override;
    }
    return false;
  };
  const debug = (message) => {
    if (isDevelopmentBuild()) {
      logger$2.debug(message);
    }
  };
  const featureLoaders = [];
  const DEFAULT_FEATURE_SETTINGS = Object.freeze({
    features: { ...DEFAULT_SETTINGS.features }
  });
  const cloneDefaultFeatureSettings = () => ({
    features: { ...DEFAULT_FEATURE_SETTINGS.features }
  });
  async function loadFeatureSettings() {
    try {
      const { getPersistentStorage } = await Promise.resolve().then(function () { return persistentStorage; });
      const storage = getPersistentStorage();
      const stored = await storage.get(APP_SETTINGS_STORAGE_KEY);
      if (stored && typeof stored === "object" && "features" in stored) {
        const candidate = stored.features;
        if (candidate && typeof candidate === "object") {
          debug("[features] Settings loaded successfully");
          return {
            features: {
              ...DEFAULT_FEATURE_SETTINGS.features,
              ...candidate
            }
          };
        }
      }
    } catch (error) {
      logger$2.warn("[features] Settings loading failed - using defaults:", error);
    }
    return cloneDefaultFeatureSettings();
  }
  async function registerFeatureServicesLazy() {
    try {
      debug("[features] Registering feature services");
      const settings = await loadFeatureSettings();
      const featureStates = resolveFeatureStates(settings);
      for (const loader of featureLoaders) {
        if (loader.devOnly && !isDevelopmentBuild()) {
          continue;
        }
        if (!featureStates[loader.flag]) {
          debug(`[features] ℹ️ ${loader.name} disabled (${loader.flag}: false)`);
          continue;
        }
        try {
          await loader.load();
          debug(`[features] ✅ ${loader.name} registered`);
        } catch (error) {
          logger$2.warn(`[features] ⚠️ ${loader.name} registration failed (continuing):`, error);
        }
      }
      debug("[features] ✅ Feature services registered");
    } catch (error) {
      reportBootstrapError(error, { context: "features", logger: logger$2 });
    }
  }

  var features = {
    __proto__: null,
    registerFeatureServicesLazy: registerFeatureServicesLazy
  };

  async function initializeEnvironment() {
  }

  var environment = {
    __proto__: null,
    initializeEnvironment: initializeEnvironment
  };

  const BASE_SERVICE_REGISTRATIONS = [
    [THEME_SERVICE_IDENTIFIER, getThemeServiceInstance],
    [LANGUAGE_SERVICE_IDENTIFIER, getLanguageServiceInstance],
    [MEDIA_SERVICE_IDENTIFIER, getMediaServiceInstance]
  ];
  function registerMissingBaseServices(coreService) {
    let registeredCount = 0;
    for (const [key, getService] of BASE_SERVICE_REGISTRATIONS) {
      if (!coreService.has(key)) {
        coreService.register(key, getService());
        registeredCount += 1;
      }
    }
    return registeredCount;
  }
  async function initializeCoreBaseServices() {
    const coreService = CoreService.getInstance();
    try {
      const newlyRegistered = registerMissingBaseServices(coreService);
      if (newlyRegistered > 0 && false) {
        logger$2.debug(`[base-services] Registered ${newlyRegistered} base services`);
      }
      for (const identifier of CORE_BASE_SERVICE_IDENTIFIERS) {
        const service = coreService.get(identifier);
        if (service && typeof service.initialize === "function") {
          await service.initialize();
        }
      }
    } catch (error) {
      reportBootstrapError(error, { context: "base-services", logger: logger$2 });
    }
  }

  var baseServices = {
    __proto__: null,
    initializeCoreBaseServices: initializeCoreBaseServices
  };

  var globals = {
    __proto__: null
  };

  const PRELOAD_TASKS = Object.freeze([
    {
      label: "gallery core",
      loader: () => Promise.resolve().then(function () { return index; })
    }
  ]);
  const DEFAULT_PRELOAD_DEPENDENCIES = Object.freeze({
    logWarn: (message, error) => {
      logger$2.warn(message, error);
    }
  });
  async function runPreloadTask(task, deps) {
    try {
      await task.loader();
    } catch (error) {
      deps.logWarn(`[preload] ${task.label} preload failed`, error);
    }
  }
  async function executePreloadStrategy(tasks = PRELOAD_TASKS, deps = DEFAULT_PRELOAD_DEPENDENCIES) {
    for (const task of tasks) {
      await runPreloadTask(task, deps);
    }
  }

  var preload = {
    __proto__: null,
    executePreloadStrategy: executePreloadStrategy
  };

  const textEncoder = new TextEncoder();
  let crc32Table = null;
  function ensureCRC32Table() {
    if (crc32Table) {
      return crc32Table;
    }
    const table = new Uint32Array(256);
    const polynomial = 3988292384;
    for (let i = 0; i < 256; i++) {
      let crc = i;
      for (let j = 0; j < 8; j++) {
        crc = crc & 1 ? crc >>> 1 ^ polynomial : crc >>> 1;
      }
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
    for (let i = 0; i < data.length; i++) {
      crc = crc >>> 8 ^ (table[(crc ^ data[i]) & 255] ?? 0);
    }
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

  const concat = (arrays) => {
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
  class StreamingZipWriter {
    chunks = [];
    entries = [];
    currentOffset = 0;
    /**
     * Add file (streaming mode)
     *
     * Writes Local File Header + File Data immediately
     */
    addFile(filename, data) {
      const filenameBytes = encodeUtf8(filename);
      const crc32 = calculateCRC32(data);
      const localHeader = concat([
        new Uint8Array([80, 75, 3, 4]),
        // Signature
        writeUint16LE(20),
        // Version needed
        writeUint16LE(2048),
        // UTF-8 flag
        writeUint16LE(0),
        // No compression
        writeUint16LE(0),
        // Time
        writeUint16LE(0),
        // Date
        writeUint32LE(crc32),
        writeUint32LE(data.length),
        writeUint32LE(data.length),
        writeUint16LE(filenameBytes.length),
        writeUint16LE(0),
        // No extra field
        filenameBytes
      ]);
      this.chunks.push(localHeader, data);
      this.entries.push({ filename, data, offset: this.currentOffset, crc32 });
      this.currentOffset += localHeader.length + data.length;
    }
    /** Finalize ZIP file (add Central Directory) */
    finalize() {
      const centralDirStart = this.currentOffset;
      const centralDirChunks = [];
      for (const entry of this.entries) {
        const filenameBytes = encodeUtf8(entry.filename);
        centralDirChunks.push(
          concat([
            new Uint8Array([80, 75, 1, 2]),
            // Signature
            writeUint16LE(20),
            // Version made by
            writeUint16LE(20),
            // Version needed
            writeUint16LE(2048),
            // UTF-8
            writeUint16LE(0),
            // No compression
            writeUint16LE(0),
            // Time
            writeUint16LE(0),
            // Date
            writeUint32LE(entry.crc32),
            writeUint32LE(entry.data.length),
            writeUint32LE(entry.data.length),
            writeUint16LE(filenameBytes.length),
            writeUint16LE(0),
            // Extra
            writeUint16LE(0),
            // Comment
            writeUint16LE(0),
            // Disk
            writeUint16LE(0),
            // Internal attrs
            writeUint32LE(0),
            // External attrs
            writeUint32LE(entry.offset),
            filenameBytes
          ])
        );
      }
      const centralDir = concat(centralDirChunks);
      const endOfCentralDir = concat([
        new Uint8Array([80, 75, 5, 6]),
        writeUint16LE(0),
        // Disk number
        writeUint16LE(0),
        // Central dir disk
        writeUint16LE(this.entries.length),
        writeUint16LE(this.entries.length),
        writeUint32LE(centralDir.length),
        writeUint32LE(centralDirStart),
        writeUint16LE(0)
        // Comment length
      ]);
      return concat([...this.chunks, centralDir, endOfCentralDir]);
    }
    /** Get current entry count */
    getEntryCount() {
      return this.entries.length;
    }
    /** Get current ZIP size (excluding Central Directory) */
    getCurrentSize() {
      return this.currentOffset;
    }
  }

  var index$1 = {
    __proto__: null,
    StreamingZipWriter: StreamingZipWriter
  };

  const body = "xeg_EeShbY";
  const bodyCompact = "xeg_nm9B3P";
  const setting = "xeg_PI5CjL";
  const settingCompact = "xeg_VUTt8w";
  const label = "xeg_vhT3QS";
  const compactLabel = "xeg_Y62M5l";
  const select = "xeg_jpiS5y";
  var styles = {
  	body: body,
  	bodyCompact: bodyCompact,
  	setting: setting,
  	settingCompact: settingCompact,
  	label: label,
  	compactLabel: compactLabel,
  	select: select
  };

  var _tmpl$$1 = /* @__PURE__ */ template(`<div><div><label></label><select></select></div><div><label></label><select>`), _tmpl$2$1 = /* @__PURE__ */ template(`<option>`);
  const THEME_OPTIONS = ["auto", "light", "dark"];
  const LANGUAGE_OPTIONS = ["auto", "ko", "en", "ja"];
  function SettingsControls(props) {
    const languageService = getLanguageService();
    const [revision, setRevision] = createSignal(0);
    onMount(() => {
      const unsubscribe = languageService.onLanguageChange(() => setRevision((v) => v + 1));
      onCleanup(unsubscribe);
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
    const selectClass = cx("xeg-inline-center", styles.select);
    const containerClass = cx(styles.body, props.compact && styles.bodyCompact);
    const settingClass = cx(styles.setting, props.compact && styles.settingCompact);
    const labelClass = cx(styles.label, props.compact && styles.compactLabel);
    const themeValue = createMemo(() => resolve(props.currentTheme));
    const languageValue = createMemo(() => resolve(props.currentLanguage));
    const themeSelectId = props["data-testid"] ? `${props["data-testid"]}-theme-select` : "settings-theme-select";
    const languageSelectId = props["data-testid"] ? `${props["data-testid"]}-language-select` : "settings-language-select";
    const themeStrings = () => strings().theme;
    const languageStrings = () => strings().language;
    return (() => {
      var _el$ = _tmpl$$1(), _el$2 = _el$.firstChild, _el$3 = _el$2.firstChild, _el$4 = _el$3.nextSibling, _el$5 = _el$2.nextSibling, _el$6 = _el$5.firstChild, _el$7 = _el$6.nextSibling;
      className(_el$, containerClass);
      className(_el$2, settingClass);
      setAttribute(_el$3, "for", themeSelectId);
      className(_el$3, labelClass);
      insert(_el$3, () => themeStrings().title);
      addEventListener(_el$4, "change", props.onThemeChange);
      setAttribute(_el$4, "id", themeSelectId);
      className(_el$4, selectClass);
      insert(_el$4, () => THEME_OPTIONS.map((option) => (() => {
        var _el$8 = _tmpl$2$1();
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
        var _el$9 = _tmpl$2$1();
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

  var SettingsControls$1 = {
    __proto__: null,
    SettingsControls: SettingsControls
  };

  var _tmpl$ = /* @__PURE__ */ template(`<a target=_blank rel="noopener noreferrer">`), _tmpl$2 = /* @__PURE__ */ template(`<div><div><span></span></div><div data-gallery-element=tweet-content data-gallery-scrollable=true>`), _tmpl$3 = /* @__PURE__ */ template(`<div>`), _tmpl$4 = /* @__PURE__ */ template(`<br>`), _tmpl$5 = /* @__PURE__ */ template(`<span>`);
  function renderTweetAnchor(accessor, kind, displayText) {
    const token = accessor();
    return (() => {
      var _el$ = _tmpl$();
      _el$.$$click = (e) => e.stopPropagation();
      setAttribute(_el$, "data-kind", kind);
      insert(_el$, () => displayText ?? token.content);
      createRenderEffect((_p$) => {
        var _v$ = token.href, _v$2 = styles$3.tweetLink;
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
      var _el$2 = _tmpl$2(), _el$3 = _el$2.firstChild, _el$4 = _el$3.firstChild, _el$5 = _el$3.nextSibling;
      insert(_el$4, () => getLanguageService().translate("toolbar.tweetText") || "Tweet text");
      insert(_el$5, (() => {
        var _c$ = memo(() => !!props.tweetTextHTML);
        return () => _c$() ? (
          /*
          Security Note: tweetTextHTML is sanitized via @shared/utils/text/html-sanitizer
          before being passed here. It only allows safe tags (a, span, etc.) and attributes.
          Links are checked for safe protocols (http/https) and target="_blank" is secured.
          Double-sanitization here ensures safety even if the prop source changes.
          */
          (() => {
            var _el$6 = _tmpl$3();
            createRenderEffect(() => _el$6.innerHTML = sanitizeHTML(props.tweetTextHTML));
            return _el$6;
          })()
        ) : createComponent(For, {
          get each() {
            return formatTweetText(props.tweetText ?? "");
          },
          children: (token) => createComponent(Switch, {
            get children() {
              return [createComponent(Match, {
                get when() {
                  return token.type === "link" && token;
                },
                children: (linkToken) => renderTweetAnchor(linkToken, "url", shortenUrl(linkToken().content, 40))
              }), createComponent(Match, {
                get when() {
                  return token.type === "mention" && token;
                },
                children: (mentionToken) => renderTweetAnchor(mentionToken, "mention")
              }), createComponent(Match, {
                get when() {
                  return token.type === "hashtag" && token;
                },
                children: (hashtagToken) => renderTweetAnchor(hashtagToken, "hashtag")
              }), createComponent(Match, {
                get when() {
                  return token.type === "cashtag" && token;
                },
                children: (cashtagToken) => renderTweetAnchor(cashtagToken, "cashtag")
              }), createComponent(Match, {
                get when() {
                  return token.type === "break";
                },
                get children() {
                  return _tmpl$4();
                }
              }), createComponent(Match, {
                get when() {
                  return token.type === "text" && token;
                },
                children: (textToken) => (() => {
                  var _el$8 = _tmpl$5();
                  insert(_el$8, () => textToken().content);
                  return _el$8;
                })()
              })];
            }
          })
        });
      })());
      createRenderEffect((_p$) => {
        var _v$3 = styles$3.tweetPanelBody, _v$4 = styles$3.tweetTextHeader, _v$5 = styles$3.tweetTextLabel, _v$6 = styles$3.tweetContent;
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
  delegateEvents(["click"]);

  var TweetTextPanel$1 = {
    __proto__: null,
    default: TweetTextPanel
  };

  const videoPlaybackStateMap = /* @__PURE__ */ new WeakMap();
  function getCurrentGalleryVideo(video) {
    if (video) {
      return video;
    }
    const signaled = gallerySignals.currentVideoElement.value;
    if (signaled instanceof HTMLVideoElement) {
      return signaled;
    }
    try {
      const doc = typeof document !== "undefined" ? document : globalThis.document;
      if (!(doc instanceof Document)) return null;
      const hostSelectors = [
        CSS.SELECTORS.DATA_GALLERY,
        CSS.SELECTORS.ROOT,
        CSS.SELECTORS.CONTAINER,
        CSS.SELECTORS.DATA_CONTAINER
      ];
      let container = null;
      for (const selector of hostSelectors) {
        const match = doc.querySelector(selector);
        if (match) {
          container = match;
          break;
        }
      }
      if (!container) return null;
      const items = container.querySelector('[data-xeg-role="items-container"]');
      if (!items) return null;
      const index = gallerySignals.currentIndex.value;
      const target = items.children?.[index];
      if (!target) return null;
      const fallbackVideo = target.querySelector("video");
      return fallbackVideo instanceof HTMLVideoElement ? fallbackVideo : null;
    } catch (error) {
      logger$2.debug("Failed to get current gallery video:", error);
      return null;
    }
  }
  function executeVideoControl(action, options = {}) {
    const { video, context } = options;
    try {
      const videoElement = getCurrentGalleryVideo(video);
      if (!videoElement) {
        logger$2.debug("[VideoControl] No video element found", {
          action,
          context
        });
        return;
      }
      switch (action) {
        case "play":
          videoElement.play?.().catch(() => {
            logger$2.debug("[VideoControl] Play failed", { context });
          });
          videoPlaybackStateMap.set(videoElement, { playing: true });
          break;
        case "pause":
          videoElement.pause?.();
          videoPlaybackStateMap.set(videoElement, { playing: false });
          break;
        case "togglePlayPause": {
          const current = videoPlaybackStateMap.get(videoElement)?.playing ?? !videoElement.paused;
          const next = !current;
          if (next) {
            videoElement.play?.().catch(() => {
              logger$2.debug("[VideoControl] Play failed during toggle", {
                context
              });
            });
          } else {
            videoElement.pause?.();
          }
          videoPlaybackStateMap.set(videoElement, { playing: next });
          break;
        }
        case "volumeUp": {
          const newVolume = Math.min(1, Math.round((videoElement.volume + 0.1) * 100) / 100);
          videoElement.volume = newVolume;
          if (newVolume > 0 && videoElement.muted) {
            videoElement.muted = false;
          }
          break;
        }
        case "volumeDown": {
          const newVolume = Math.max(0, Math.round((videoElement.volume - 0.1) * 100) / 100);
          videoElement.volume = newVolume;
          if (newVolume === 0 && !videoElement.muted) {
            videoElement.muted = true;
          }
          break;
        }
        case "mute":
          videoElement.muted = true;
          break;
        case "toggleMute":
          videoElement.muted = !videoElement.muted;
          break;
      }
      logger$2.debug("[VideoControl] Action executed", {
        action,
        context,
        method: "video-element"
      });
    } catch (error) {
      logger$2.error("[VideoControl] Unexpected error", { error, action, context });
    }
  }

  const debounceState = {
    lastExecutionTime: 0,
    lastKey: ""
  };
  function shouldExecuteKeyboardAction(key, minInterval = 100) {
    const now = Date.now();
    const timeSinceLastExecution = now - debounceState.lastExecutionTime;
    if (key === debounceState.lastKey && timeSinceLastExecution < minInterval) {
      logger$2.debug(
        `[Keyboard Debounce] Blocked ${key} (${timeSinceLastExecution}ms < ${minInterval}ms)`
      );
      return false;
    }
    debounceState.lastExecutionTime = now;
    debounceState.lastKey = key;
    return true;
  }
  function shouldExecuteVideoControlKey(key) {
    const videoControlKeys = ["ArrowUp", "ArrowDown", "m", "M"];
    if (!videoControlKeys.includes(key)) return true;
    return shouldExecuteKeyboardAction(key, 100);
  }
  function shouldExecutePlayPauseKey(key) {
    if (key !== " " && key !== "Space") return true;
    return shouldExecuteKeyboardAction(key, 150);
  }
  function resetKeyboardDebounceState() {
    debounceState.lastExecutionTime = 0;
    debounceState.lastKey = "";
    logger$2.debug("[Keyboard Debounce] State reset");
  }

  function checkGalleryOpen() {
    return gallerySignals.isOpen.value;
  }
  function handleKeyboardEvent(event, handlers, options) {
    if (!options.enableKeyboard) return;
    try {
      if (checkGalleryOpen()) {
        const key = event.key;
        const isNavKey = key === "Home" || key === "End" || key === "PageDown" || key === "PageUp" || key === "ArrowLeft" || key === "ArrowRight" || key === " " || key === "Space";
        const isVideoKey = key === " " || key === "Space" || key === "ArrowUp" || key === "ArrowDown" || key === "m" || key === "M";
        if (isNavKey || isVideoKey) {
          event.preventDefault();
          event.stopPropagation();
          switch (key) {
            case " ":
            case "Space":
              if (shouldExecutePlayPauseKey(event.key)) {
                executeVideoControl("togglePlayPause");
              }
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
            case "End": {
              const lastIndex = Math.max(0, gallerySignals.mediaItems.value.length - 1);
              navigateToItem(lastIndex, "keyboard");
              break;
            }
            case "PageDown": {
              navigateToItem(
                Math.min(
                  gallerySignals.mediaItems.value.length - 1,
                  gallerySignals.currentIndex.value + 5
                ),
                "keyboard"
              );
              break;
            }
            case "PageUp": {
              navigateToItem(Math.max(0, gallerySignals.currentIndex.value - 5), "keyboard");
              break;
            }
            case "ArrowUp":
              if (shouldExecuteVideoControlKey(event.key)) {
                executeVideoControl("volumeUp");
              }
              break;
            case "ArrowDown":
              if (shouldExecuteVideoControlKey(event.key)) {
                executeVideoControl("volumeDown");
              }
              break;
            case "m":
            case "M":
              if (shouldExecuteVideoControlKey(event.key)) {
                executeVideoControl("toggleMute");
              }
              break;
          }
          if (handlers.onKeyboardEvent) {
            handlers.onKeyboardEvent(event);
          }
          return;
        }
      }
      if (event.key === "Escape" && checkGalleryOpen()) {
        handlers.onGalleryClose();
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      if (handlers.onKeyboardEvent) {
        handlers.onKeyboardEvent(event);
      }
    } catch (error) {
      logger$2.error("Error handling keyboard event:", error);
    }
  }

  const MEDIA_SELECTORS = {
    MEDIA_LINK: SELECTORS.STATUS_LINK
  };
  const MEDIA_CONTAINER_SELECTOR = STABLE_SELECTORS.MEDIA_CONTAINERS.join(", ");
  const INTERACTIVE_SELECTOR = [
    "button",
    "a",
    '[role="button"]',
    '[data-testid="like"]',
    '[data-testid="retweet"]',
    '[data-testid="reply"]',
    '[data-testid="share"]',
    '[data-testid="bookmark"]'
  ].join(", ");
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
    if (interactive) {
      const isMediaLink = interactive.matches(MEDIA_SELECTORS.MEDIA_LINK) || interactive.matches(MEDIA_CONTAINER_SELECTOR) || interactive.querySelector(MEDIA_CONTAINER_SELECTOR) !== null;
      return !isMediaLink;
    }
    return false;
  }
  function isProcessableMedia(target) {
    if (!target) return false;
    if (gallerySignals.isOpen.value) return false;
    if (shouldBlockMediaTrigger(target)) return false;
    const mediaElement = findMediaElementInDOM(target);
    if (mediaElement) {
      const mediaUrl = extractMediaUrlFromElement(mediaElement);
      if (isValidMediaSource(mediaUrl)) {
        return true;
      }
    }
    return Boolean(target.closest(MEDIA_CONTAINER_SELECTOR));
  }

  async function handleMediaClick(event, handlers, options) {
    if (!options.enableMediaDetection) {
      return { handled: false, reason: "Media detection disabled" };
    }
    const target = event.target;
    if (!isHTMLElement(target)) {
      return { handled: false, reason: "Invalid target (not HTMLElement)" };
    }
    if (gallerySignals.isOpen.value && isGalleryInternalElement(target)) {
      return { handled: false, reason: "Gallery internal event" };
    }
    if (isVideoControlElement(target)) {
      return { handled: false, reason: "Video control element" };
    }
    if (!isProcessableMedia(target)) {
      return { handled: false, reason: "Non-processable media target" };
    }
    event.stopImmediatePropagation();
    event.preventDefault();
    await handlers.onMediaClick(target, event);
    return {
      handled: true,
      reason: "Media click handled"
    };
  }

  const DEFAULT_GALLERY_EVENT_OPTIONS = {
    enableKeyboard: true,
    enableMediaDetection: true,
    debugMode: false,
    preventBubbling: true,
    context: "gallery"
  };
  const initialLifecycleState = {
    initialized: false,
    options: null,
    handlers: null,
    keyListener: null,
    clickListener: null,
    listenerContext: null,
    eventTarget: null
  };
  let lifecycleState = { ...initialLifecycleState };
  function sanitizeContext(context) {
    const trimmed = context?.trim();
    return trimmed && trimmed.length > 0 ? trimmed : DEFAULT_GALLERY_EVENT_OPTIONS.context;
  }
  function resolveInitializationInput(optionsOrRoot) {
    if (optionsOrRoot instanceof HTMLElement) {
      return {
        options: { ...DEFAULT_GALLERY_EVENT_OPTIONS },
        root: optionsOrRoot
      };
    }
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
    if (lifecycleState.initialized) {
      logger$2.warn("[GalleryLifecycle] Already initialized, re-initializing");
      cleanupGalleryEvents();
    }
    if (!handlers) {
      logger$2.error("[GalleryLifecycle] Missing handlers");
      return () => {
      };
    }
    const { options: finalOptions, root: explicitGalleryRoot } = resolveInitializationInput(
      optionsOrRoot
    );
    const listenerContext = sanitizeContext(finalOptions.context);
    const keyHandler = (evt) => {
      const event = evt;
      handleKeyboardEvent(event, handlers, finalOptions);
    };
    const clickHandler = async (evt) => {
      const event = evt;
      const result = await handleMediaClick(event, handlers, finalOptions);
      if (result.handled && finalOptions.preventBubbling) {
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
    if (finalOptions.enableKeyboard) {
      eventManager.addListener(target, "keydown", keyHandler, listenerOptions, listenerContext);
    }
    if (finalOptions.enableMediaDetection) {
      eventManager.addListener(target, "click", clickHandler, listenerOptions, listenerContext);
    }
    resetKeyboardDebounceState();
    lifecycleState = {
      initialized: true,
      options: finalOptions,
      handlers,
      keyListener: keyHandler,
      clickListener: clickHandler,
      listenerContext,
      eventTarget: target
    };
    if (finalOptions.debugMode) {
      logger$2.debug("[GalleryEvents] Event listeners registered", {
        context: listenerContext
      });
    }
    return () => {
      cleanupGalleryEvents();
    };
  }
  function cleanupGalleryEvents() {
    if (!lifecycleState.initialized) {
      return;
    }
    if (lifecycleState.listenerContext) {
      EventManager.getInstance().removeByContext(lifecycleState.listenerContext);
    }
    resetKeyboardDebounceState();
    lifecycleState = { ...initialLifecycleState };
  }

  var galleryLifecycle = {
    __proto__: null,
    cleanupGalleryEvents: cleanupGalleryEvents,
    initializeGalleryEvents: initializeGalleryEvents
  };

  var index = {
    __proto__: null
  };

  exports.applyInitialThemeSetting = applyInitialThemeSetting;
  exports.cleanup = cleanup;
  exports.default = main;
  exports.initializeBaseServicesStage = initializeBaseServicesStage;
  exports.initializeDevToolsIfNeeded = initializeDevToolsIfNeeded;
  exports.initializeGallery = initializeGallery;
  exports.initializeGalleryIfPermitted = initializeGalleryIfPermitted;
  exports.initializeInfrastructure = initializeInfrastructure;
  exports.initializeNonCriticalSystems = initializeNonCriticalSystems;
  exports.lifecycleState = lifecycleState$1;
  exports.loadGlobalStyles = loadGlobalStyles;
  exports.runBootstrapStages = runBootstrapStages;
  exports.runOptionalCleanup = runOptionalCleanup;
  exports.setGlobalEventTeardown = setGlobalEventTeardown;
  exports.setupGlobalEventHandlers = setupGlobalEventHandlers;
  exports.startApplication = startApplication;
  exports.triggerPreloadStrategy = triggerPreloadStrategy;

  Object.defineProperty(exports, '__esModule', { value: true });

  return exports;

})({});
