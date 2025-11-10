import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { getSolid } from '@shared/external/vendors';
import type { ThemeOption, LanguageOption } from '@shared/components/ui/Settings/SettingsControls';
import { SettingsControls } from '@shared/components/ui/Settings/SettingsControls';
import styles from '@shared/components/ui/Settings/SettingsControls.module.css';

describe('SettingsControls compact mode labels (Phase 113 RED)', () => {
  let container: HTMLDivElement;
  let dispose: (() => void) | undefined;
  const testId = 'settings-controls-test';
  const themeSelectId = `${testId}-theme-select`;
  const languageSelectId = `${testId}-language-select`;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    dispose?.();
    container.remove();
    dispose = undefined;
  });

  function mountSettingsControls(
    overrides?: Partial<{ theme: ThemeOption; language: LanguageOption }>
  ): void {
    const { theme = 'auto', language = 'auto' } = overrides ?? {};

    const { render } = getSolid();
    dispose = render(
      () => (
        <SettingsControls
          currentTheme={theme}
          currentLanguage={language}
          onThemeChange={() => undefined}
          onLanguageChange={() => undefined}
          compact={true}
          data-testid={testId}
        />
      ),
      container
    );
  }

  it('should render visible theme and language labels in compact mode', () => {
    mountSettingsControls();

    const themeLabel = container.querySelector('label[for$="theme-select"]');
    const languageLabel = container.querySelector('label[for$="language-select"]');

    expect(themeLabel, 'Theme label should be present in compact mode').not.toBeNull();
    expect(languageLabel, 'Language label should be present in compact mode').not.toBeNull();

    expect(themeLabel?.textContent?.trim().length ?? 0).toBeGreaterThan(0);
    expect(languageLabel?.textContent?.trim().length ?? 0).toBeGreaterThan(0);
  });

  it('should apply compact label styling and maintain DOM order', () => {
    mountSettingsControls({ theme: 'light', language: 'en' });

    const themeLabel = container.querySelector('label[for$="theme-select"]');
    const themeSelect = container.querySelector('select[id$="theme-select"]');

    expect(themeLabel).not.toBeNull();
    expect(themeLabel?.classList.contains(styles.label)).toBe(true);
    // compact mode should add dedicated styling class to reduce spacing/size
    expect(themeLabel?.classList.contains(styles.compactLabel)).toBe(true);
    expect(themeLabel?.nextElementSibling).toBe(themeSelect);
  });
});
