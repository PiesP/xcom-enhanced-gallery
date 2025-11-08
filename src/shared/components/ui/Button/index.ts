/**
 * @fileoverview Button UI Component Barrel Export
 * @version 4.1.0 - Phase 385: Unified button component
 * @description Exports unified Button component and icon button wrapper
 *
 * Phase 2 completion (GREEN status):
 * - Single unified Button component for all button use cases
 * - Icon button convenience wrapper with size validation
 * - Full accessibility support
 * - CSS Module style isolation
 * - TypeScript type safety
 *
 * @module @shared/components/ui/Button
 *
 * @example
 * ```typescript
 * import { Button, IconButton } from '@shared/components/ui/Button';
 *
 * // Primary button
 * <Button onClick={handleClick}>Save</Button>
 *
 * // Icon button
 * <IconButton aria-label="Download" variant="secondary">
 *   <DownloadIcon />
 * </IconButton>
 * ```
 */

// ============================================================================
// Primary exports - Main Button component and type definitions
// ============================================================================
export { Button, type ButtonProps } from './Button';
export { Button as default } from './Button';
