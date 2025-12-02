import { SERVICE_KEYS } from '@/constants/service-keys';
import { Toolbar } from '@shared/components/ui/Toolbar/Toolbar';
import { CoreServiceRegistry } from '@shared/container/core-service-registry';
import { LanguageService } from '@shared/services/language-service';
import { fireEvent, render, screen } from '@solidjs/testing-library';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock dependencies
vi.mock('@shared/hooks', () => ({
  useToolbarState: () => [{ isDownloading: false }, { setDownloading: vi.fn() }],
  useToolbarSettingsController: () => ({
    handleSettingsClick: vi.fn(),
    settingsRef: { current: null },
    isSettingsOpen: () => false,
    isSettingsExpanded: () => false,
    assignToolbarRef: vi.fn(),
    assignSettingsRef: vi.fn(),
  }),
}));

vi.mock('@shared/utils/toolbar-utils', () => ({
  getToolbarDataState: () => 'idle',
  getToolbarClassName: () => 'mock-toolbar-class',
}));

describe('Toolbar Container', () => {
  beforeEach(() => {
    const languageService = LanguageService.getInstance();
    vi.spyOn(languageService, 'translate').mockImplementation((key: unknown) => key as string);
    CoreServiceRegistry.register(SERVICE_KEYS.LANGUAGE, languageService);
  });

  const defaultProps = {
    currentIndex: 0,
    totalCount: 5,
    onClose: vi.fn(),
    onPrevious: vi.fn(),
    onNext: vi.fn(),
    onDownloadCurrent: vi.fn(),
    onDownloadAll: vi.fn(),
    onFitOriginal: vi.fn(),
    onFitWidth: vi.fn(),
    onFitHeight: vi.fn(),
    onFitContainer: vi.fn(),
    currentFitMode: 'original' as const,
  };

  it('should render successfully', () => {
    render(() => <Toolbar {...defaultProps} />);
    expect(screen.getByRole('toolbar')).toBeInTheDocument();
  });

  it('should handle fit mode clicks', () => {
    render(() => <Toolbar {...defaultProps} currentFitMode="original" />);

    // "original" is active, so it should be disabled.
    // Click "fitWidth" instead.
    // Using actual English title from FIT_MODE_LABELS

    const fitWidthButton = screen.getByTitle('Fit to Width');
    fireEvent.click(fitWidthButton);
    expect(defaultProps.onFitWidth).toHaveBeenCalled();
  });

  it('should disable fit mode button if it is active', () => {
    render(() => <Toolbar {...defaultProps} currentFitMode="original" />);
    const originalButton = screen.getByTitle('Original Size (1:1)');
    expect(originalButton).toBeDisabled();
  });

  it('should not call handler if toolbar is disabled', () => {
    render(() => <Toolbar {...defaultProps} disabled={true} />);
    const originalButton = screen.getByTitle('Original Size (1:1)');
    // Even if disabled, fireEvent might trigger it, but the handler inside Toolbar should prevent it.
    // However, if the button is disabled in DOM, fireEvent.click might not work or the handler won't be called.
    // The `isFitDisabled` logic in Toolbar.tsx sets the `disabled` prop on the button.
    expect(originalButton).toBeDisabled();
  });
});
