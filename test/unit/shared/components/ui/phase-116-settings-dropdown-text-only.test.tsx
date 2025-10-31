import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getSolid } from '@shared/external/vendors';
import { LanguageService } from '@shared/services/language-service';
import type { ThemeOption, LanguageOption } from '@shared/components/ui/Settings/SettingsControls';
import { SettingsControls } from '@shared/components/ui/Settings/SettingsControls';
import styles from '@shared/components/ui/Settings/SettingsControls.module.css';

const DECORATIVE_SYMBOLS = ['/', '▾'] as const;

describe('Phase 116: Settings dropdown labels should not include decorative symbols (GREEN)', () => {
  let container: HTMLDivElement;
  let dispose: (() => void) | undefined;
  const languageService = new LanguageService();

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    dispose?.();
    container.remove();
    dispose = undefined;
  });

  function mountControls(options?: {
    readonly compact?: boolean;
    readonly theme?: ThemeOption;
    readonly language?: LanguageOption;
  }): void {
    const { compact = false, theme = 'auto', language = 'auto' } = options ?? {};

    const { render } = getSolid();
    dispose = render(
      () => (
        <SettingsControls
          currentTheme={theme}
          currentLanguage={language}
          onThemeChange={() => undefined}
          onLanguageChange={() => undefined}
          compact={compact}
          data-testid='phase-116-settings-controls'
        />
      ),
      container
    );
  }

  function assertLabelText(forId: string, expected: string): void {
    const label = container.querySelector(`label[for="${forId}"]`);
    expect(label, `${forId} label should exist`).not.toBeNull();
    expect(label?.classList.contains(styles.label)).toBe(true);

    const textContent = label?.textContent?.trim() ?? '';
    expect(textContent).toBe(expected);

    DECORATIVE_SYMBOLS.forEach(symbol => {
      expect(textContent.includes(symbol)).toBe(false);
    });

    const hiddenSpans = label ? Array.from(label.querySelectorAll('span[aria-hidden="true"]')) : [];
    expect(hiddenSpans.length).toBe(0);
  }

  it('renders theme and language labels as plain text (default mode)', () => {
    mountControls();

    assertLabelText('theme-select', languageService.getString('settings.theme'));
    assertLabelText('language-select', languageService.getString('settings.language'));
  });

  it('renders compact labels without decorative symbols', () => {
    mountControls({ compact: true, theme: 'light', language: 'en' });

    const themeLabel = container.querySelector('label[for="theme-select"]');
    const languageLabel = container.querySelector('label[for="language-select"]');

    expect(themeLabel?.classList.contains(styles.compactLabel)).toBe(true);
    expect(languageLabel?.classList.contains(styles.compactLabel)).toBe(true);

    assertLabelText('theme-select', languageService.getString('settings.theme'));
    assertLabelText('language-select', languageService.getString('settings.language'));
  });
});
