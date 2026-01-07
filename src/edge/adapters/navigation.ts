/**
 * @fileoverview Navigation adapter for Edge layer runtime integration
 *
 * ## Purpose
 * Provides a thin navigation adapter that bridges command-runtime with browser navigation
 * APIs. Implements two navigation strategies: `assign` (in-place navigation) and `open`
 * (new window/tab navigation) with graceful fallback and popup block detection.
 *
 * ## Key Responsibilities
 * - **Adapter Pattern**: Bridge between command-runtime and browser navigation APIs
 * - **Mode Routing**: Dispatch to appropriate navigation method (assign vs open)
 * - **Fallback Handling**: Gracefully degrade when `window.location.assign` unavailable
 * - **Popup Detection**: Throw error when browser blocks popup (user/site restrictions)
 * - **Security**: Include security headers (noopener, noreferrer) for opened windows
 * - **Environment Validation**: Check `window` availability before navigation
 *
 * ## Architecture Context
 * **Layer**: Edge Adapter (browser API integration)
 * **Navigation System**: Executes NavigateRequested commands from `src/core/cmd.ts`
 * **Browser APIs**:
 *   - `window.location.assign()` (preferred for in-place navigation)
 *   - `window.location.href` (fallback for non-standard environments)
 *   - `window.open()` (new window/tab navigation with security headers)
 *
 * ## Design Principles
 * 1. **Mode-Based Routing**: Different navigation strategies based on command intention
 * 2. **Graceful Degradation**: Fallback when standard APIs unavailable
 * 3. **Security First**: Security headers prevent window escalation attacks
 * 4. **Error Transparency**: Popup block errors propagate for caller handling
 * 5. **Immutable Input**: NavigateInput readonly for predictability
 *
 * ## Navigation Modes
 * - **assign**: In-place navigation (replace current document)
 *   - Uses `window.location.assign()` (standard, preferred)
 *   - Fallback to `window.location.href` (non-standard environments)
 *   - Default target: `_self` (current window)
 *   - Returns immediately after assignment
 *
 * - **open**: Open new window/tab (navigates in new context)
 *   - Uses `window.open()` with specified target
 *   - Default target: `_blank` (new tab)
 *   - Includes security headers (noopener, noreferrer)
 *   - Throws PopupBlocked error if window.open returns null
 *
 * ## Usage Pattern
 * ```typescript
 * import { navigate } from '@edge/adapters/navigation';
 *
 * // In-place navigation (replace current document)
 * await navigate({
 *   url: 'https://example.com/page',
 *   mode: 'assign',
 *   target: '_self', // optional, default is _self
 * });
 *
 * // Open in new tab (default)
 * await navigate({
 *   url: 'https://example.com/article',
 *   mode: 'open',
 *   // target defaults to '_blank'
 * });
 *
 * // Open in new window
 * await navigate({
 *   url: 'https://example.com/player',
 *   mode: 'open',
 *   target: '_blank',
 * });
 *
 * // Error handling: popup blocked
 * try {
 *   await navigate({
 *     url: 'https://example.com/popup',
 *     mode: 'open',
 *   });
 * } catch (error) {
 *   if (error.message === 'PopupBlocked') {
 *     console.log('Popup was blocked by browser');
 *   }
 * }
 * ```
 *
 * ## Error Handling
 * - **window unavailable**: Throws "window is not available" (SSR, worker context)
 * - **popup blocked**: Throws "PopupBlocked" (user/site popup restrictions)
 *
 * ## Security Considerations
 * - **noopener**: Prevents opened window from accessing window.opener (opener property = null)
 * - **noreferrer**: Prevents opened page from seeing Referer header
 * - **URL Validation**: Caller responsible for validating URLs before navigation
 *
 * @module edge/adapters/navigation
 */

import type { NavigateMode } from '@core/cmd';

/**
 * Navigation request input parameters
 *
 * Encapsulates the information needed to perform a browser navigation operation
 * through either in-place (assign) or new-window (open) strategies.
 *
 * @remarks
 * **Design Decisions**:
 * - `url`: Absolute or relative URL (browser resolves relative to current location)
 * - `mode`: Navigation strategy ('assign' for in-place, 'open' for new window)
 * - `target`: Window target specifier ('_self' for current, '_blank' for new)
 *
 * **Immutability**: All fields readonly to prevent accidental mutation during async navigation
 *
 * **Default Behavior**:
 * - `target` defaults to '_self' for assign mode (not overridable)
 * - `target` defaults to '_blank' for open mode (user can override)
 *
 * **Mode-Specific Semantics**:
 * - **assign mode**: target is ignored (always in-place, uses _self semantics)
 * - **open mode**: target controls window behavior (_blank = new tab, _self = current)
 *
 * @example
 * ```typescript
 * // In-place navigation
 * const assignInput: NavigateInput = {
 *   url: 'https://example.com/new-page',
 *   mode: 'assign',
 *   target: '_self', // optional
 * };
 *
 * // Open new tab/window
 * const openInput: NavigateInput = {
 *   url: 'https://example.com/external',
 *   mode: 'open',
 *   target: '_blank', // optional, default
 * };
 *
 * // Relative URL (browser resolves)
 * const relativeInput: NavigateInput = {
 *   url: '/page/subpage',
 *   mode: 'assign',
 * };
 * ```
 *
 * @see {@link NavigateMode} for allowed navigation mode values
 */
interface NavigateInput {
  /** URL to navigate to (absolute or relative) */
  readonly url: string;

  /** Navigation mode ('assign' for in-place, 'open' for new window) */
  readonly mode: NavigateMode;

  /** Window target ('_self' or '_blank', defaults based on mode) */
  readonly target?: '_self' | '_blank';
}

/**
 * Perform browser navigation with mode-based routing and error handling
 *
 * Routes navigation requests to appropriate browser API based on mode parameter,
 * with graceful fallback and security considerations for opened windows.
 * This adapter provides the command-runtime interface to browser navigation.
 *
 * @param input - Navigation request (url, mode, target)
 * @returns Promise that resolves when navigation completes
 * @throws {Error} If window not available (SSR/worker context)
 * @throws {Error} If popup blocked (user/site restrictions)
 *
 * @remarks
 * **Navigation Modes**:
 *
 * **assign Mode** (in-place navigation):
 * - Replaces current document (leaves browsing history)
 * - Uses `window.location.assign(url)` (standard API)
 * - Fallback: `window.location.href = url` (non-standard environments)
 * - target parameter is ignored
 * - Returns immediately after assignment
 * - Typical use: Navigating user within same application
 *
 * **open Mode** (new window/tab):
 * - Opens window/tab in new context (independent history)
 * - Uses `window.open(url, target, features)` with security headers
 * - target parameter controls window behavior (_blank = new tab, _self = same window)
 * - Security headers: noopener (prevent opener access), noreferrer (prevent referrer leak)
 * - Throws PopupBlocked error if window.open returns null (browser/user blocked)
 * - Typical use: External links, documentation, secondary flows
 *
 * **Error Handling**:
 * - **window undefined**: Throws if running in SSR/worker/non-browser context
 * - **popup blocked**: Throws "PopupBlocked" when user/site blocks popups
 * - Other errors: Network failures, invalid URLs handled by browser (propagate to caller)
 *
 * **Async Semantics**:
 * - Function is async but returns immediately (no actual waiting occurs)
 * - Navigation happens synchronously, function structure allows future async operations
 * - Promise resolves after navigation command is dispatched
 *
 * **Browser Compatibility**:
 * - `window.location.assign()`: All modern browsers (ES5+)
 * - `window.location.href`: All browsers (fallback available)
 * - `window.open()`: All browsers (popup blocking is browser/OS feature)
 * - Security headers: All modern browsers support these features
 *
 * **Performance**:
 * - O(1) operation (simple method dispatch)
 * - No network requests (navigation happens in browser)
 * - User perceives unload and reload of page/tab
 *
 * @example
 * ```typescript
 * import { navigate } from '@edge/adapters/navigation';
 *
 * // In-place navigation to new page
 * try {
 *   await navigate({
 *     url: 'https://api.example.com/settings',
 *     mode: 'assign',
 *   });
 *   // Current page is replaced with /settings
 *   // User can use back button to return
 * } catch (error) {
 *   console.error('Navigation failed:', error);
 * }
 *
 * // Open external link in new tab
 * try {
 *   await navigate({
 *     url: 'https://external-site.com/docs',
 *     mode: 'open',
 *     target: '_blank', // optional, default
 *   });
 *   // New tab opens with external page
 *   // Current page remains unchanged
 * } catch (error) {
 *   if (error.message === 'PopupBlocked') {
 *     // User has disabled popups, handle gracefully
 *     console.log('Please allow popups to open documentation');
 *   } else {
 *     console.error('Navigation failed:', error);
 *   }
 * }
 *
 * // Open player in new window with security headers
 * try {
 *   await navigate({
 *     url: 'https://player.example.com/video?id=123',
 *     mode: 'open',
 *     target: '_blank',
 *   });
 *   // Window opens with noopener,noreferrer headers
 *   // Player page cannot access opener property
 *   // Player page doesn't see Referer header
 * } catch (error) {
 *   if (error.message === 'PopupBlocked') {
 *     // Handle popup blocked (site restrictions or user choice)
 *   }
 * }
 *
 * // Fallback from assign() to href (non-standard environment)
 * try {
 *   await navigate({
 *     url: '/page?redirect=true',
 *     mode: 'assign',
 *   });
 *   // Tries: window.location.assign('/page?redirect=true')
 *   // Fallback: window.location.href = '/page?redirect=true'
 * } catch (error) {
 *   // window not available (SSR context)
 * }
 *
 * // Error: window unavailable (server-side rendering)
 * try {
 *   await navigate({
 *     url: 'https://example.com',
 *     mode: 'open',
 *   });
 * } catch (error) {
 *   // throws: Error('window is not available')
 *   // This happens in SSR, Node.js, Web Workers
 * }
 * ```
 *
 * @see {@link NavigateInput} for input parameter structure
 * @see {@link NavigateMode} for allowed mode values
 * @see {@link window.location.assign} for assign mode documentation
 * @see {@link window.open} for open mode documentation
 */
export async function navigate(input: NavigateInput): Promise<void> {
  if (typeof window === 'undefined') {
    throw new Error('window is not available');
  }

  if (input.mode === 'assign') {
    if (typeof window.location?.assign === 'function') {
      window.location.assign(input.url);
      return;
    }

    // Fallback for non-standard environments.
    window.location.href = input.url;
    return;
  }

  const target = input.target ?? '_blank';
  const opened = window.open(input.url, target, 'noopener,noreferrer');
  if (!opened) {
    throw new Error('PopupBlocked');
  }
}
