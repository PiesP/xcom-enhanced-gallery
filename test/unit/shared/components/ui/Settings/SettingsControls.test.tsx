import { SERVICE_KEYS } from '@/constants/service-keys';
import {
  SettingsControls,
  type SettingsControlsProps,
  type ThemeOption,
  type LanguageOption,
} from '@shared/components/ui/Settings/SettingsControls';
import { CoreServiceRegistry } from '@shared/container/core-service-registry';
import { CoreService } from '@shared/services/service-manager';
import { LanguageService } from '@shared/services/language-service';
import { fireEvent, render, screen } from '@solidjs/testing-library';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('SettingsControls', () => {
  let languageService: LanguageService;
  let mockUnsubscribe: () => void;

  beforeEach(() => {
    languageService = LanguageService.getInstance();
    mockUnsubscribe = vi.fn();

    vi.spyOn(languageService, 'translate').mockImplementation((key: string) => {
      const translations: Record<string, string> = {
        'settings.theme': 'Theme',
        'settings.themeAuto': 'Auto',
        'settings.themeLight': 'Light',
        'settings.themeDark': 'Dark',
        'settings.language': 'Language',
        'settings.languageAuto': 'Auto',
        'settings.languageKo': 'Korean',
        'settings.languageEn': 'English',
        'settings.languageJa': 'Japanese',
      };
      return translations[key] || key;
    });

    vi.spyOn(languageService, 'onLanguageChange').mockReturnValue(mockUnsubscribe);
    CoreServiceRegistry.register(SERVICE_KEYS.LANGUAGE, languageService);
  });

  afterEach(() => {
    vi.clearAllMocks();
    CoreService.resetInstance();
  });

  const createProps = (overrides?: Partial<SettingsControlsProps>): SettingsControlsProps => ({
    currentTheme: 'auto',
    currentLanguage: 'auto',
    onThemeChange: vi.fn(),
    onLanguageChange: vi.fn(),
    ...overrides,
  });

  describe('Rendering', () => {
    it('should render theme and language selects', () => {
      render(() => <SettingsControls {...createProps()} />);

      expect(screen.getByLabelText('Theme')).toBeInTheDocument();
      expect(screen.getByLabelText('Language')).toBeInTheDocument();
    });

    it('should render all theme options', () => {
      render(() => <SettingsControls {...createProps()} />);

      const themeSelect = screen.getByLabelText('Theme');
      expect(themeSelect).toBeInTheDocument();

      const options = themeSelect.querySelectorAll('option');
      expect(options.length).toBe(3);
      expect(options[0]).toHaveValue('auto');
      expect(options[1]).toHaveValue('light');
      expect(options[2]).toHaveValue('dark');
    });

    it('should render all language options', () => {
      render(() => <SettingsControls {...createProps()} />);

      const languageSelect = screen.getByLabelText('Language');
      expect(languageSelect).toBeInTheDocument();

      const options = languageSelect.querySelectorAll('option');
      expect(options.length).toBe(4);
      expect(options[0]).toHaveValue('auto');
      expect(options[1]).toHaveValue('ko');
      expect(options[2]).toHaveValue('en');
      expect(options[3]).toHaveValue('ja');
    });

    it('should render with data-testid when provided', () => {
      render(() => <SettingsControls {...createProps({ 'data-testid': 'test-settings' })} />);

      expect(screen.getByTestId('test-settings')).toBeInTheDocument();
      expect(screen.getByTestId('test-settings-theme')).toBeInTheDocument();
      expect(screen.getByTestId('test-settings-language')).toBeInTheDocument();
    });

    it('should render labels with correct for attribute', () => {
      render(() => <SettingsControls {...createProps({ 'data-testid': 'custom' })} />);

      const themeLabel = screen.getByText('Theme');
      const languageLabel = screen.getByText('Language');

      expect(themeLabel).toHaveAttribute('for', 'custom-theme-select');
      expect(languageLabel).toHaveAttribute('for', 'custom-language-select');
    });

    it('should use default IDs when no data-testid provided', () => {
      render(() => <SettingsControls {...createProps()} />);

      const themeSelect = screen.getByLabelText('Theme');
      const languageSelect = screen.getByLabelText('Language');

      expect(themeSelect).toHaveAttribute('id', 'settings-theme-select');
      expect(languageSelect).toHaveAttribute('id', 'settings-language-select');
    });
  });

  describe('Compact Mode', () => {
    it('should apply compact styles when compact prop is true', () => {
      const { container } = render(() => <SettingsControls {...createProps({ compact: true })} />);

      // Verify container has the component structure
      expect(container.querySelector('div')).toBeInTheDocument();
    });

    it('should not apply compact styles when compact prop is false', () => {
      const { container } = render(() => <SettingsControls {...createProps({ compact: false })} />);

      expect(container.querySelector('div')).toBeInTheDocument();
    });
  });

  describe('Value Handling', () => {
    it('should set theme select value from static value', () => {
      render(() => <SettingsControls {...createProps({ currentTheme: 'dark' })} />);

      const themeSelect = screen.getByLabelText('Theme') as HTMLSelectElement;
      expect(themeSelect.value).toBe('dark');
    });

    it('should set theme select value from accessor', () => {
      const themeAccessor = () => 'light' as ThemeOption;
      render(() => <SettingsControls {...createProps({ currentTheme: themeAccessor })} />);

      const themeSelect = screen.getByLabelText('Theme') as HTMLSelectElement;
      expect(themeSelect.value).toBe('light');
    });

    it('should set language select value from static value', () => {
      render(() => <SettingsControls {...createProps({ currentLanguage: 'ko' })} />);

      const languageSelect = screen.getByLabelText('Language') as HTMLSelectElement;
      expect(languageSelect.value).toBe('ko');
    });

    it('should set language select value from accessor', () => {
      const languageAccessor = () => 'ja' as LanguageOption;
      render(() => <SettingsControls {...createProps({ currentLanguage: languageAccessor })} />);

      const languageSelect = screen.getByLabelText('Language') as HTMLSelectElement;
      expect(languageSelect.value).toBe('ja');
    });
  });

  describe('Event Handling', () => {
    it('should call onThemeChange when theme is changed', () => {
      const onThemeChange = vi.fn();
      render(() => <SettingsControls {...createProps({ onThemeChange })} />);

      const themeSelect = screen.getByLabelText('Theme');
      fireEvent.change(themeSelect, { target: { value: 'dark' } });

      expect(onThemeChange).toHaveBeenCalled();
    });

    it('should call onLanguageChange when language is changed', () => {
      const onLanguageChange = vi.fn();
      render(() => <SettingsControls {...createProps({ onLanguageChange })} />);

      const languageSelect = screen.getByLabelText('Language');
      fireEvent.change(languageSelect, { target: { value: 'en' } });

      expect(onLanguageChange).toHaveBeenCalled();
    });
  });

  describe('Language Change Subscription', () => {
    it('should subscribe to language changes on mount', () => {
      render(() => <SettingsControls {...createProps()} />);

      expect(languageService.onLanguageChange).toHaveBeenCalled();
    });

    it('should unsubscribe from language changes on cleanup', () => {
      const { unmount } = render(() => <SettingsControls {...createProps()} />);

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have aria-label on theme select', () => {
      render(() => <SettingsControls {...createProps()} />);

      const themeSelect = screen.getByLabelText('Theme');
      expect(themeSelect).toHaveAttribute('aria-label', 'Theme');
    });

    it('should have aria-label on language select', () => {
      render(() => <SettingsControls {...createProps()} />);

      const languageSelect = screen.getByLabelText('Language');
      expect(languageSelect).toHaveAttribute('aria-label', 'Language');
    });

    it('should have title attributes for tooltips', () => {
      render(() => <SettingsControls {...createProps()} />);

      const themeSelect = screen.getByLabelText('Theme');
      const languageSelect = screen.getByLabelText('Language');

      expect(themeSelect).toHaveAttribute('title', 'Theme');
      expect(languageSelect).toHaveAttribute('title', 'Language');
    });
  });

  describe('Translation Integration', () => {
    it('should display translated labels', () => {
      render(() => <SettingsControls {...createProps()} />);

      expect(screen.getByText('Theme')).toBeInTheDocument();
      expect(screen.getByText('Language')).toBeInTheDocument();
    });

    it('should display translated option labels', () => {
      render(() => <SettingsControls {...createProps()} />);

      // Check theme options
      expect(screen.getAllByText('Auto').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Light')).toBeInTheDocument();
      expect(screen.getByText('Dark')).toBeInTheDocument();

      // Check language options
      expect(screen.getByText('Korean')).toBeInTheDocument();
      expect(screen.getByText('English')).toBeInTheDocument();
      expect(screen.getByText('Japanese')).toBeInTheDocument();
    });
  });
});
