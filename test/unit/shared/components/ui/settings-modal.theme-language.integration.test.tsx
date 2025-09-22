/**
 * SettingsModal – theme/language integration tests
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/preact';
import { SettingsModal } from '@/shared/components/ui/SettingsModal/SettingsModal';

// Force i18n to start in English for deterministic label queries
vi.stubGlobal('navigator', { language: 'en-US' } as any);

describe('SettingsModal – theme/language integration', () => {
  const baseProps = { isOpen: true, onClose: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    // Ensure data-theme is clean before each test
    if (typeof document !== 'undefined') {
      document.documentElement.removeAttribute('data-theme');
    }
  });

  afterEach(() => {
    cleanup();
  });

  it('updates data-theme attribute when theme select changes (light/dark/auto)', async () => {
    // Note: SettingsModal creates its own ThemeService instance; we observe DOM side-effect instead.
    render(<SettingsModal {...baseProps} />);

    const themeLabel = screen.getByText('Theme');
    expect(themeLabel).toBeDefined();

    const select = document.getElementById('theme-select') as any;
    expect(select).toBeTruthy();

    // Switch to dark
    select!.selectedIndex = 2; // options: auto(0), light(1), dark(2)
    select!.value = 'dark';
    fireEvent.input(select!, { bubbles: true });
    fireEvent.change(select!, { bubbles: true });
    expect(select!.value).toBe('dark');
    await waitFor(() => expect(document.documentElement.getAttribute('data-theme')).toBe('dark'));

    // Switch to light
    select!.selectedIndex = 1;
    select!.value = 'light';
    fireEvent.input(select!, { bubbles: true });
    fireEvent.change(select!, { bubbles: true });
    expect(select!.value).toBe('light');
    await waitFor(() => expect(document.documentElement.getAttribute('data-theme')).toBe('light'));

    // Switch to auto (matchMedia polyfill in setup returns matches=false → light)
    select!.selectedIndex = 0;
    select!.value = 'auto';
    fireEvent.input(select!, { bubbles: true });
    fireEvent.change(select!, { bubbles: true });
    expect(select!.value).toBe('auto');
    await waitFor(() => expect(document.documentElement.getAttribute('data-theme')).toBe('light'));
  });

  it('changes visible labels when language select switches to Korean', async () => {
    render(<SettingsModal {...baseProps} />);

    // English labels first
    const titleEn = screen.getByText('Settings');
    const themeLabelEn = screen.getByText('Theme');
    const languageLabelEn = screen.getByText('Language');
    expect(titleEn).toBeDefined();
    expect(themeLabelEn).toBeDefined();
    expect(languageLabelEn).toBeDefined();

    const languageSelect = document.getElementById('language-select') as any;
    expect(languageSelect).toBeTruthy();

    // Change to Korean
    languageSelect!.selectedIndex = 1; // auto, ko, en, ja
    languageSelect!.value = 'ko';
    fireEvent.input(languageSelect!, { bubbles: true });
    fireEvent.change(languageSelect!, { bubbles: true });

    // Labels should update to Korean
    const themeLabelKo = await screen.findByText('테마');
    const languageLabelKo = await screen.findByText('언어');
    expect(themeLabelKo).toBeDefined();
    expect(languageLabelKo).toBeDefined();
  });
});
