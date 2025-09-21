/* eslint-env browser */
/**
 * @file Test DOM fixtures for action buttons
 */

export type ActionFixtureOptions = Partial<{
  like: string; // aria-label text
  retweet: string; // aria-label text (Retweet or Repost)
  reply: string;
  share: string;
  bookmark: string;
  useRoleDiv: boolean; // use <div role="button"> instead of <button>
}>;

/**
 * Renders minimal markup for a specific action button with the given aria-label.
 * Returns the created element for convenience.
 */
export function renderActionButton(
  action: keyof ActionFixtureOptions,
  label: string,
  useRoleDiv = false
): HTMLElement {
  const root = document.createElement('div');
  let el: HTMLElement;
  if (useRoleDiv) {
    el = document.createElement('div');
    el.setAttribute('role', 'button');
  } else {
    el = document.createElement('button');
  }
  el.setAttribute('aria-label', label);
  el.id = `${action}Btn`;
  el.textContent = action;
  root.appendChild(el);
  document.body.innerHTML = '';
  document.body.appendChild(root);
  return el;
}

/**
 * Renders multiple action buttons at once based on options.
 * Only actions with provided labels will be rendered.
 */
export function renderActionButtons(options: ActionFixtureOptions = {}): void {
  document.body.innerHTML = '';
  const root = document.createElement('div');
  const { useRoleDiv = false, ...labels } = options;
  (Object.keys(labels) as Array<keyof ActionFixtureOptions>).forEach(key => {
    const label = labels[key];
    if (!label) return;
    let el: HTMLElement;
    if (useRoleDiv) {
      el = document.createElement('div');
      el.setAttribute('role', 'button');
    } else {
      el = document.createElement('button');
    }
    el.setAttribute('aria-label', String(label));
    el.id = `${String(key)}Btn`;
    el.textContent = String(key);
    root.appendChild(el);
  });
  document.body.appendChild(root);
}
