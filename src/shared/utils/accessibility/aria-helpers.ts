/**
 * @fileoverview ARIA Helpers and Screen Reader Utilities
 * @description WCAG ARIA attribute configuration and screen reader support functions
 */

import { globalTimerManager } from '../timer-management';

/**
 * Add text for screen readers
 * WCAG 4.1.2 Screen Reader Support
 */
export function addScreenReaderText(element: HTMLElement, text: string): void {
  const srText = document.createElement('span');
  srText.className = 'sr-only';
  srText.textContent = text;
  srText.style.cssText = `
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: clip;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  `;
  element.appendChild(srText);
}

/**
 * Set ARIA label
 * WCAG 4.1.2 Name, Role, Value
 */
export function setAriaLabel(element: HTMLElement, label: string): void {
  element.setAttribute('aria-label', label);
}

/**
 * Set ARIA role
 * WCAG 4.1.2 Name, Role, Value
 */
export function setAriaRole(element: HTMLElement, role: string): void {
  element.setAttribute('role', role);
}

/**
 * Set live region
 * WCAG 4.1.3 Status Messages
 */
export function setAriaLive(
  element: HTMLElement,
  politeness: 'polite' | 'assertive' = 'polite'
): void {
  element.setAttribute('aria-live', politeness);
}

/**
 * Validate screen reader compatibility
 * WCAG 4.1.2 Screen Reader Compatible
 */
export function validateScreenReaderSupport(element: HTMLElement): boolean {
  const hasAriaLabel = element.hasAttribute('aria-label');
  const hasAriaDescribedBy = element.hasAttribute('aria-describedby');
  const hasRole = element.hasAttribute('role');

  return hasAriaLabel || hasAriaDescribedBy || hasRole;
}

/**
 * Create navigation landmark
 * WCAG 2.4.1 Bypass Blocks
 */
export function createNavigationLandmark(element: HTMLElement, type = 'navigation'): void {
  element.setAttribute('role', type);
  element.setAttribute('aria-label', `${type} region`);
}

/**
 * Announce live message
 * WCAG 4.1.3 Status Messages
 */
export function announceLiveMessage(message: string, politeness = 'polite'): void {
  const liveRegion = document.createElement('div');
  liveRegion.setAttribute('aria-live', politeness);
  liveRegion.setAttribute('aria-atomic', 'true');
  liveRegion.style.cssText =
    'position: absolute; left: -10000px; width: 1px; height: 1px; overflow: hidden;';

  document.body.appendChild(liveRegion);
  liveRegion.textContent = message;

  globalTimerManager.setTimeout(() => {
    document.body.removeChild(liveRegion);
  }, 1000);
}

/**
 * Validate alternative text quality
 * WCAG 1.1.1 Non-text Content
 */
export function validateAltTextQuality(altText: string, imageType = 'informative'): boolean {
  if (imageType === 'decorative') {
    return altText === '';
  }

  return altText.length > 0 && altText.length <= 125;
}

/**
 * Set atomic update
 * WCAG 4.1.3 Status Messages
 */
export function setAriaAtomic(element: HTMLElement, atomic = true): void {
  element.setAttribute('aria-atomic', atomic.toString());
}

/**
 * Link description text
 * WCAG 3.3.2 Labels or Instructions
 */
export function setAriaDescription(element: HTMLElement, descriptionId: string): void {
  element.setAttribute('aria-describedby', descriptionId);
}

/**
 * Initialize live region
 * WCAG 4.1.3 Live Region Initialization
 */
export function initializeLiveRegion(element: HTMLElement): void {
  element.setAttribute('aria-live', 'polite');
  element.setAttribute('aria-atomic', 'false');
}

/**
 * Notify screen reader
 * WCAG 4.1.2 Screen Reader Notification
 */
export function notifyScreenReader(message: string): void {
  announceLiveMessage(message, 'assertive');
}

/**
 * Associate label
 * WCAG 3.3.2 Label Association
 */
export function associateLabel(inputElement: HTMLElement, labelElement: HTMLElement): void {
  const labelId = labelElement.id || `label-${Date.now()}`;
  labelElement.id = labelId;
  inputElement.setAttribute('aria-labelledby', labelId);
}

/**
 * WCAG standard label setting functions
 */
export function setAccessibleName(element: HTMLElement, name: string): void {
  element.setAttribute('aria-label', name);
}

export function setAccessibleDescription(element: HTMLElement, description: string): void {
  element.setAttribute('aria-describedby', description);
}

export function setAccessibleExpanded(element: HTMLElement, expanded: boolean): void {
  element.setAttribute('aria-expanded', expanded.toString());
}

export function setAccessiblePressed(element: HTMLElement, pressed: boolean): void {
  element.setAttribute('aria-pressed', pressed.toString());
}

export function setAccessibleSelected(element: HTMLElement, selected: boolean): void {
  element.setAttribute('aria-selected', selected.toString());
}

export function setAccessibleChecked(element: HTMLElement, checked: boolean): void {
  element.setAttribute('aria-checked', checked.toString());
}

export function setAccessibleHidden(element: HTMLElement, hidden: boolean): void {
  element.setAttribute('aria-hidden', hidden.toString());
}

export function setAccessibleDisabled(element: HTMLElement, disabled: boolean): void {
  element.setAttribute('aria-disabled', disabled.toString());
}

export function setAccessibleRequired(element: HTMLElement, required: boolean): void {
  element.setAttribute('aria-required', required.toString());
}

export function setAccessibleInvalid(element: HTMLElement, invalid: boolean): void {
  element.setAttribute('aria-invalid', invalid.toString());
}

/**
 * Additional ARIA attribute functions
 */
export function setARIARole(element: HTMLElement, role: string): void {
  element.setAttribute('role', role);
}

export function setARIALive(
  element: HTMLElement,
  politeness: 'off' | 'polite' | 'assertive'
): void {
  element.setAttribute('aria-live', politeness);
}

export function setARIAAtomic(element: HTMLElement, atomic: boolean): void {
  element.setAttribute('aria-atomic', atomic.toString());
}

export function setARIABusy(element: HTMLElement, busy: boolean): void {
  element.setAttribute('aria-busy', busy.toString());
}

export function setARIAControls(element: HTMLElement, controls: string): void {
  element.setAttribute('aria-controls', controls);
}

export function setARIAOwns(element: HTMLElement, owns: string): void {
  element.setAttribute('aria-owns', owns);
}

export function setARIAFlowTo(element: HTMLElement, flowto: string): void {
  element.setAttribute('aria-flowto', flowto);
}

export function setARIADropEffect(element: HTMLElement, effect: string): void {
  element.setAttribute('aria-dropeffect', effect);
}

export function setARIAGrabbed(element: HTMLElement, grabbed: boolean): void {
  element.setAttribute('aria-grabbed', grabbed.toString());
}

export function setARIAHasPopup(element: HTMLElement, haspopup: boolean | string): void {
  element.setAttribute('aria-haspopup', haspopup.toString());
}

export function setARIALevel(element: HTMLElement, level: number): void {
  element.setAttribute('aria-level', level.toString());
}

export function setARIAMultiline(element: HTMLElement, multiline: boolean): void {
  element.setAttribute('aria-multiline', multiline.toString());
}

export function setARIAMultiselectable(element: HTMLElement, multiselectable: boolean): void {
  element.setAttribute('aria-multiselectable', multiselectable.toString());
}

export function setARIAOrientation(
  element: HTMLElement,
  orientation: 'horizontal' | 'vertical'
): void {
  element.setAttribute('aria-orientation', orientation);
}

export function setARIAReadonly(element: HTMLElement, readonly: boolean): void {
  element.setAttribute('aria-readonly', readonly.toString());
}

export function setARIARelevant(element: HTMLElement, relevant: string): void {
  element.setAttribute('aria-relevant', relevant);
}

export function setARIASort(element: HTMLElement, sort: string): void {
  element.setAttribute('aria-sort', sort);
}

export function setARIAValuemax(element: HTMLElement, valuemax: number): void {
  element.setAttribute('aria-valuemax', valuemax.toString());
}

export function setARIAValuemin(element: HTMLElement, valuemin: number): void {
  element.setAttribute('aria-valuemin', valuemin.toString());
}

export function setARIAValuenow(element: HTMLElement, valuenow: number): void {
  element.setAttribute('aria-valuenow', valuenow.toString());
}

export function setARIAValuetext(element: HTMLElement, valuetext: string): void {
  element.setAttribute('aria-valuetext', valuetext);
}

export function setLandmarkRole(element: HTMLElement, role: string): void {
  const landmarkRoles = ['banner', 'navigation', 'main', 'complementary', 'contentinfo', 'region'];
  if (landmarkRoles.includes(role)) {
    element.setAttribute('role', role);
  }
}

export function setHeadingLevel(element: HTMLElement, level: number): void {
  if (level >= 1 && level <= 6) {
    element.setAttribute('aria-level', level.toString());
    if (element.tagName.toLowerCase() !== `h${level}`) {
      element.setAttribute('role', 'heading');
    }
  }
}

export function isValidHeadingStructure(container: HTMLElement): boolean {
  const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6, [role="heading"]');
  let previousLevel = 0;

  for (const heading of Array.from(headings)) {
    const tagMatch = heading.tagName.match(/^H(\d)$/);
    const ariaLevel = heading.getAttribute('aria-level');
    const level = tagMatch ? parseInt(tagMatch[1] ?? '1') : ariaLevel ? parseInt(ariaLevel) : 1;

    if (level > previousLevel + 1) {
      return false; // Level was skipped
    }
    previousLevel = level;
  }

  return true;
}

export function announceToScreenReader(message: string): void {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);
  globalTimerManager.setTimeout(() => document.body.removeChild(announcement), 1000);
}

export function announceUrgentToScreenReader(message: string): void {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', 'assertive');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);
  globalTimerManager.setTimeout(() => document.body.removeChild(announcement), 1000);
}

export function setARIALabel(element: HTMLElement, label: string): void {
  element.setAttribute('aria-label', label);
}

export function setARIADescribedBy(element: HTMLElement, id: string): void {
  element.setAttribute('aria-describedby', id);
}

export function setARIALabelledBy(element: HTMLElement, id: string): void {
  element.setAttribute('aria-labelledby', id);
}

export function setARIAExpanded(element: HTMLElement, expanded: boolean): void {
  element.setAttribute('aria-expanded', expanded.toString());
}

export function setARIAPressed(element: HTMLElement, pressed: boolean): void {
  element.setAttribute('aria-pressed', pressed.toString());
}

export function setARIASelected(element: HTMLElement, selected: boolean): void {
  element.setAttribute('aria-selected', selected.toString());
}

export function setARIAChecked(element: HTMLElement, checked: boolean): void {
  element.setAttribute('aria-checked', checked.toString());
}

export function setARIAHidden(element: HTMLElement, hidden: boolean): void {
  element.setAttribute('aria-hidden', hidden.toString());
}

export function setARIADisabled(element: HTMLElement, disabled: boolean): void {
  element.setAttribute('aria-disabled', disabled.toString());
}

export function setARIARequired(element: HTMLElement, required: boolean): void {
  element.setAttribute('aria-required', required.toString());
}

export function setARIAInvalid(element: HTMLElement, invalid: boolean): void {
  element.setAttribute('aria-invalid', invalid.toString());
}
