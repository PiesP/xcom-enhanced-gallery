/**
 * @fileoverview Video player control detection and gallery view mode constants
 *
 * @description
 * Provides constant arrays for identifying video player controls through various HTML attributes
 * (data-testid, role, aria-label) and defining supported gallery view modes. These constants
 * enable the userscript to detect and avoid interfering with native X.com video controls
 * while implementing custom gallery navigation.
 *
 * @module constants/video-controls
 *
 * @remarks
 * **Control Detection Strategy**:
 * The userscript needs to distinguish between user interactions with the gallery and
 * interactions with native video player controls (play/pause, volume, seek bar). These
 * constants define patterns for identifying video control elements through multiple
 * HTML attribute types for robust detection across X.com UI updates.
 *
 * **Detection Layers**:
 * 1. **data-testid prefixes**: X.com's internal test identifiers for controls
 * 2. **ARIA roles**: Standard accessibility roles for media controls
 * 3. **aria-label tokens**: Descriptive text tokens in control labels
 *
 * **View Mode System**:
 * Currently supports vertical list gallery layout. The VIEW_MODES array defines
 * valid layout options for future extensibility (horizontal, grid, etc.).
 *
 * **Usage Context**:
 * - Event delegation: Filter out clicks on video controls
 * - Focus management: Skip video controls in keyboard navigation
 * - Layout rendering: Select appropriate gallery component based on view mode
 *
 * @example
 * ```typescript
 * // Check if element is a video control
 * import {
 *   VIDEO_CONTROL_DATASET_PREFIXES,
 *   VIDEO_CONTROL_ROLES,
 *   VIDEO_CONTROL_ARIA_TOKENS,
 * } from '@constants/video-controls';
 *
 * function isVideoControl(element: HTMLElement): boolean {
 *   const testId = element.dataset.testid;
 *   if (testId && VIDEO_CONTROL_DATASET_PREFIXES.some(prefix =>
 *     testId.startsWith(prefix)
 *   )) {
 *     return true;
 *   }
 *
 *   const role = element.getAttribute('role');
 *   if (role && VIDEO_CONTROL_ROLES.includes(role as VideoControlRole)) {
 *     return true;
 *   }
 *
 *   const ariaLabel = element.getAttribute('aria-label')?.toLowerCase();
 *   if (ariaLabel && VIDEO_CONTROL_ARIA_TOKENS.some(token =>
 *     ariaLabel.includes(token)
 *   )) {
 *     return true;
 *   }
 *
 *   return false;
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Validate view mode
 * import { VIEW_MODES } from '@constants/video-controls';
 * import type { ViewMode } from '@constants/types';
 *
 * function setViewMode(mode: string): void {
 *   if (VIEW_MODES.includes(mode as ViewMode)) {
 *     applyViewMode(mode as ViewMode);
 *   } else {
 *     console.error(`Invalid view mode: ${mode}`);
 *   }
 * }
 * ```
 *
 * @see {@link EventManager} Event handling with control filtering
 * @see {@link GalleryRenderer} Gallery rendering based on VIEW_MODES
 * @see {@link ViewMode} Type definition extracted from VIEW_MODES
 */

/**
 * Data-testid prefixes for identifying video player chrome controls
 *
 * @remarks
 * X.com (Twitter) uses data-testid attributes for internal testing and element identification.
 * Video player controls consistently use specific prefixes in their test IDs. This array
 * enables prefix-based matching to detect control elements.
 *
 * **Prefix Categories**:
 * - **Playback**: `play`, `pause` - Play/pause button states
 * - **Audio**: `mute`, `unmute`, `volume` - Volume controls
 * - **Timeline**: `slider`, `seek`, `scrub`, `progress` - Seek bar and progress indicators
 *
 * **Detection Pattern**:
 * ```typescript
 * const testId = element.dataset.testid;
 * const isControl = VIDEO_CONTROL_DATASET_PREFIXES.some(prefix =>
 *   testId?.startsWith(prefix)
 * );
 * ```
 *
 * **Update Strategy**:
 * If X.com changes their test ID naming conventions, update these prefixes accordingly.
 * Monitor browser DevTools for new control element attributes when video player UI changes.
 *
 * **Why Prefixes**:
 * Test IDs often include suffixes for variants or states (e.g., `playButton-primary`,
 * `volumeSlider-expanded`). Prefix matching provides more resilient detection than
 * exact string matching.
 *
 * @example
 * ```typescript
 * // Check element's data-testid
 * function hasVideoControlTestId(element: HTMLElement): boolean {
 *   const testId = element.dataset.testid;
 *   if (!testId) return false;
 *
 *   return VIDEO_CONTROL_DATASET_PREFIXES.some(prefix =>
 *     testId.startsWith(prefix)
 *   );
 * }
 * ```
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/data-*} data-* attributes
 */
export const VIDEO_CONTROL_DATASET_PREFIXES = [
  'play',
  'pause',
  'mute',
  'unmute',
  'volume',
  'slider',
  'seek',
  'scrub',
  'progress',
] as const;

/**
 * ARIA role attributes for interactive media controls
 *
 * @remarks
 * Standard ARIA roles that identify interactive controls within media players.
 * When scoped to video player elements, these roles indicate user-interactive
 * controls that should be excluded from gallery navigation.
 *
 * **Supported Roles**:
 * - `slider` - Volume slider, seek bar, or other range controls
 * - `progressbar` - Progress/buffer indicators (may be interactive in some players)
 *
 * **Scoping Requirement**:
 * These roles are generic and appear in many contexts beyond video players.
 * Always check that the element is within a video player container before
 * treating it as a video control.
 *
 * **Accessibility Context**:
 * These roles provide semantic meaning for screen readers and assistive
 * technologies. By respecting these roles, the userscript maintains
 * accessibility compliance.
 *
 * @example
 * ```typescript
 * // Check if element has video control role (with scoping)
 * function hasVideoControlRole(element: HTMLElement, videoContainer: HTMLElement): boolean {
 *   const role = element.getAttribute('role');
 *   if (!role) return false;
 *
 *   const isControlRole = VIDEO_CONTROL_ROLES.includes(role as VideoControlRole);
 *   const isWithinVideo = videoContainer.contains(element);
 *
 *   return isControlRole && isWithinVideo;
 * }
 * ```
 *
 * @see {@link https://www.w3.org/WAI/ARIA/apg/patterns/slider/} ARIA slider pattern
 * @see {@link https://www.w3.org/WAI/ARIA/apg/patterns/meter/} ARIA progressbar pattern
 */
export const VIDEO_CONTROL_ROLES = ['slider', 'progressbar'] as const;

/**
 * aria-label text tokens commonly found in video control descriptions
 *
 * @remarks
 * Video player controls use aria-label attributes to provide accessible descriptions
 * for screen readers. These tokens represent common words appearing in those labels.
 * Token matching enables detection even when exact label text varies or is localized.
 *
 * **Token Categories**:
 * - **Audio**: `volume`, `mute`, `unmute` - Audio control descriptions
 * - **Timeline**: `seek`, `scrub`, `timeline`, `progress` - Playback position controls
 *
 * **Case-Insensitive Matching**:
 * aria-label text should be converted to lowercase before token matching:
 * ```typescript
 * const label = element.getAttribute('aria-label')?.toLowerCase();
 * const hasToken = VIDEO_CONTROL_ARIA_TOKENS.some(token => label?.includes(token));
 * ```
 *
 * **Localization Considerations**:
 * These tokens are English-language. For multilingual support, consider adding
 * localized token arrays or using more robust detection methods (element structure,
 * parent relationships, etc.).
 *
 * **False Positive Risk**:
 * Generic tokens like "progress" might appear in non-video contexts. Combine
 * aria-label checking with other detection methods (data-testid, role, parent scope)
 * for more accurate identification.
 *
 * @example
 * ```typescript
 * // Check aria-label for video control tokens
 * function hasVideoControlAriaLabel(element: HTMLElement): boolean {
 *   const ariaLabel = element.getAttribute('aria-label')?.toLowerCase();
 *   if (!ariaLabel) return false;
 *
 *   return VIDEO_CONTROL_ARIA_TOKENS.some(token =>
 *     ariaLabel.includes(token)
 *   );
 * }
 * ```
 *
 * @see {@link https://www.w3.org/WAI/ARIA/apg/practices/names-and-descriptions/} ARIA naming
 */
export const VIDEO_CONTROL_ARIA_TOKENS = [
  'volume',
  'mute',
  'unmute',
  'seek',
  'scrub',
  'timeline',
  'progress',
] as const;

/**
 * Supported gallery view modes
 *
 * @remarks
 * Defines available layout modes for the gallery renderer. Currently supports
 * only vertical list layout, but structured as an array for future extensibility
 * to additional layouts (horizontal, grid, masonry, etc.).
 *
 * **Current Mode**:
 * - `verticalList` - Vertical scrolling list with one item per row
 *
 * **Future Extensions** (planned):
 * - `horizontalList` - Horizontal scrolling carousel
 * - `grid` - Grid layout with multiple columns
 * - `masonry` - Masonry grid with variable heights
 *
 * **Type Extraction**:
 * The ViewMode type is extracted from this constant using:
 * ```typescript
 * export type ViewMode = (typeof VIEW_MODES)[number];
 * // Results in: 'verticalList'
 * ```
 *
 * **Usage Pattern**:
 * Use this array for runtime validation of user settings or API inputs:
 * ```typescript
 * function isValidViewMode(mode: string): mode is ViewMode {
 *   return VIEW_MODES.includes(mode as ViewMode);
 * }
 * ```
 *
 * **Why "verticalList" instead of "vertical"**:
 * Explicit naming distinguishes list-style vertical layouts from potential
 * future variants (e.g., "verticalGrid", "verticalMasonry"). This naming
 * convention provides clarity as layout options expand.
 *
 * @example
 * ```typescript
 * // Validate and apply view mode
 * import { VIEW_MODES } from '@constants/video-controls';
 * import type { ViewMode } from '@constants/types';
 *
 * function applyViewMode(mode: string): void {
 *   if (!VIEW_MODES.includes(mode as ViewMode)) {
 *     console.error(`Unsupported view mode: ${mode}`);
 *     return;
 *   }
 *
 *   const validMode = mode as ViewMode;
 *   galleryRenderer.setViewMode(validMode);
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Settings dropdown options
 * const viewModeOptions = VIEW_MODES.map(mode => ({
 *   value: mode,
 *   label: formatViewModeLabel(mode),
 * }));
 * ```
 *
 * @see {@link ViewMode} Type definition in types.ts
 * @see {@link GalleryRenderer} Gallery renderer using view modes
 * @see {@link SettingsService} User preference storage for view mode
 */
export const VIEW_MODES = ['verticalList'] as const;

/**
 * Type helper: Video control data-testid prefix type
 *
 * @remarks
 * Union type of all valid data-testid prefixes for video controls.
 * Use for type-safe prefix checking and validation.
 *
 * @example
 * ```typescript
 * function getControlType(prefix: VideoControlDatasetPrefix): string {
 *   switch (prefix) {
 *     case 'play':
 *     case 'pause':
 *       return 'playback';
 *     case 'mute':
 *     case 'unmute':
 *     case 'volume':
 *       return 'audio';
 *     default:
 *       return 'timeline';
 *   }
 * }
 * ```
 */
export type VideoControlDatasetPrefix = (typeof VIDEO_CONTROL_DATASET_PREFIXES)[number];

/**
 * Type helper: Video control ARIA role type
 *
 * @remarks
 * Union type of valid ARIA roles for video controls.
 * Use for type-safe role validation and element filtering.
 *
 * @example
 * ```typescript
 * function isInteractiveControlRole(role: string): role is VideoControlRole {
 *   return VIDEO_CONTROL_ROLES.includes(role as VideoControlRole);
 * }
 * ```
 */
export type VideoControlRole = (typeof VIDEO_CONTROL_ROLES)[number];

/**
 * Type helper: Video control aria-label token type
 *
 * @remarks
 * Union type of common tokens found in video control aria-labels.
 * Use for type-safe token matching and label parsing.
 *
 * @example
 * ```typescript
 * function extractControlTokens(ariaLabel: string): VideoControlAriaToken[] {
 *   const tokens: VideoControlAriaToken[] = [];
 *   const lowerLabel = ariaLabel.toLowerCase();
 *
 *   for (const token of VIDEO_CONTROL_ARIA_TOKENS) {
 *     if (lowerLabel.includes(token)) {
 *       tokens.push(token);
 *     }
 *   }
 *
 *   return tokens;
 * }
 * ```
 */
export type VideoControlAriaToken = (typeof VIDEO_CONTROL_ARIA_TOKENS)[number];
