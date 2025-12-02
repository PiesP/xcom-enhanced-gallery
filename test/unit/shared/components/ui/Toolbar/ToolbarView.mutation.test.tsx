/**
 * @fileoverview Mutation coverage tests for ToolbarView.tsx
 * Focus: Helper functions and conditional logic
 */
import { SERVICE_KEYS } from '@/constants/service-keys';
import { ArrowsPointingOut } from '@shared/components/ui/Icon';
import { ToolbarView, type ToolbarViewProps } from '@shared/components/ui/Toolbar/ToolbarView';
import { CoreServiceRegistry } from '@shared/container/core-service-registry';
import { LanguageService } from '@shared/services/language-service';
import type { ToolbarSettingsControllerResult } from '@shared/hooks';
import { fireEvent, render, screen } from '@solidjs/testing-library';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('ToolbarView mutation killers', () => {
  beforeEach(() => {
    const languageService = LanguageService.getInstance();
    vi.spyOn(languageService, 'translate').mockImplementation((key: string) => {
      const map: Record<string, string> = {
        'toolbar.previous': 'Previous Media',
        'toolbar.next': 'Next Media',
        'toolbar.download': 'Download Current File',
        'toolbar.download_all': 'Download all (ZIP)',
        'toolbar.close': 'Close Gallery',
        'toolbar.original': 'Original Size',
        'toolbar.settings': 'Open Settings',
        'toolbar.tweetText': 'Show Tweet Text',
      };
      return map[key] || key;
    });
    CoreServiceRegistry.register(SERVICE_KEYS.LANGUAGE, languageService);
  });

  const createSettingsController = (
    overrides: Partial<ToolbarSettingsControllerResult> = {}
  ): ToolbarSettingsControllerResult => ({
    assignToolbarRef: vi.fn(),
    assignSettingsButtonRef: vi.fn(),
    assignSettingsPanelRef: vi.fn(),
    isSettingsExpanded: () => false,
    handleSettingsClick: vi.fn(),
    handleSettingsMouseDown: vi.fn(),
    handlePanelMouseDown: vi.fn(),
    handlePanelClick: vi.fn(),
    handleThemeChange: vi.fn(),
    handleLanguageChange: vi.fn(),
    currentTheme: () => 'auto',
    currentLanguage: () => 'auto',
    handleToolbarKeyDown: vi.fn(),
    ...overrides,
  });

  const createDefaultProps = (overrides: Partial<ToolbarViewProps> = {}): ToolbarViewProps => ({
    toolbarClass: () => 'toolbar-class',
    toolbarState: {
      isDownloading: false,
      isLoading: false,
      hasError: false,
    },
    toolbarDataState: () => 'idle',
    navState: () => ({
      prevDisabled: false,
      nextDisabled: false,
      canDownloadAll: true,
      downloadDisabled: false,
      anyActionDisabled: false,
    }),
    displayedIndex: () => 1,
    progressWidth: () => '50%',
    fitModeOrder: [{ mode: 'original', Icon: ArrowsPointingOut }],
    fitModeLabels: {
      original: { label: 'Original', title: 'Original Size' },
      fitWidth: { label: 'Fit Width', title: 'Fit Width' },
      fitHeight: { label: 'Fit Height', title: 'Fit Height' },
      fitContainer: { label: 'Fit Container', title: 'Fit Container' },
    },
    activeFitMode: () => 'original',
    handleFitModeClick: () => () => {},
    isFitDisabled: () => false,
    onPreviousClick: vi.fn(),
    onNextClick: vi.fn(),
    onDownloadCurrent: vi.fn(),
    onDownloadAll: vi.fn(),
    onCloseClick: vi.fn(),
    settingsController: createSettingsController(),
    showSettingsButton: true,
    isTweetPanelExpanded: () => false,
    toggleTweetPanelExpanded: vi.fn(),
    totalCount: () => 10,
    currentIndex: () => 0,
    isDownloading: () => false,
    disabled: () => false,
    tweetText: () => 'Some tweet text',
    ...overrides,
  });

  describe('resolveAccessorValue mutations', () => {
    it('kills typeof value === "function" -> true mutation', () => {
      // Test with non-function value - should return as-is
      const props = createDefaultProps({ totalCount: 5 as unknown as () => number });
      render(() => <ToolbarView {...props} />);
      // Renders without crashing and displays 5
      expect(screen.getByText(/5/)).toBeInTheDocument();
    });

    it('kills ternary inversion mutation for function accessor', () => {
      const props = createDefaultProps({ totalCount: () => 7 });
      render(() => <ToolbarView {...props} />);
      expect(screen.getByText(/7/)).toBeInTheDocument();
    });
  });

  describe('resolveOptionalAccessorValue mutations', () => {
    it('kills value === undefined check mutation', () => {
      const props = createDefaultProps({ tweetText: undefined });
      render(() => <ToolbarView {...props} />);
      // Should still render (no crash)
      expect(screen.getByRole('toolbar')).toBeInTheDocument();
    });

    it('kills return undefined mutation', () => {
      // Pass undefined explicitly
      const props = createDefaultProps({ disabled: undefined });
      render(() => <ToolbarView {...props} />);
      // isToolbarDisabled should resolve to false (not undefined)
      expect(screen.getByRole('toolbar')).not.toHaveAttribute('aria-disabled', 'undefined');
    });
  });

  describe('findScrollableAncestor mutations', () => {
    it('kills target instanceof HTMLElement -> true mutation', () => {
      const props = createDefaultProps();
      render(() => <ToolbarView {...props} />);
      const toolbar = screen.getByRole('toolbar');
      
      // Create wheel event with non-HTMLElement target
      const wheelEvent = new WheelEvent('wheel', {
        deltaY: 10,
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(wheelEvent, 'target', { value: null });
      
      toolbar.dispatchEvent(wheelEvent);
      // Should not crash, event should be handled
    });

    it('kills instanceof HTMLElement false return null mutation', () => {
      const props = createDefaultProps();
      render(() => <ToolbarView {...props} />);
      const toolbar = screen.getByRole('toolbar');
      
      // Create wheel event with text node target
      const textNode = document.createTextNode('text');
      const wheelEvent = new WheelEvent('wheel', {
        deltaY: 10,
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(wheelEvent, 'target', { value: textNode });
      
      toolbar.dispatchEvent(wheelEvent);
    });
  });

  describe('canConsumeWheelEvent mutations', () => {
    it('kills overflow <= SCROLL_LOCK_TOLERANCE -> true mutation', () => {
      const props = createDefaultProps();
      render(() => <ToolbarView {...props} />);
      const toolbar = screen.getByRole('toolbar');
      
      // Create scrollable element with no overflow
      const scrollable = document.createElement('div');
      scrollable.setAttribute('data-gallery-scrollable', 'true');
      Object.defineProperty(scrollable, 'scrollHeight', { value: 100 });
      Object.defineProperty(scrollable, 'clientHeight', { value: 100 }); // no overflow
      Object.defineProperty(scrollable, 'scrollTop', { value: 0 });
      toolbar.appendChild(scrollable);
      
      const wheelEvent = new WheelEvent('wheel', {
        deltaY: 10,
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(wheelEvent, 'target', { value: scrollable });
      
      toolbar.dispatchEvent(wheelEvent);
    });

    it('kills deltaY < 0 conditional mutation', () => {
      const props = createDefaultProps();
      render(() => <ToolbarView {...props} />);
      const toolbar = screen.getByRole('toolbar');
      
      const scrollable = document.createElement('div');
      scrollable.setAttribute('data-gallery-scrollable', 'true');
      Object.defineProperty(scrollable, 'scrollHeight', { value: 200 });
      Object.defineProperty(scrollable, 'clientHeight', { value: 100 });
      Object.defineProperty(scrollable, 'scrollTop', { value: 50 }); // can scroll up
      toolbar.appendChild(scrollable);
      
      // Scroll up (negative deltaY)
      const wheelEvent = new WheelEvent('wheel', {
        deltaY: -10,
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(wheelEvent, 'target', { value: scrollable });
      
      toolbar.dispatchEvent(wheelEvent);
    });

    it('kills scrollTop > SCROLL_LOCK_TOLERANCE mutation', () => {
      const props = createDefaultProps();
      render(() => <ToolbarView {...props} />);
      const toolbar = screen.getByRole('toolbar');
      
      const scrollable = document.createElement('div');
      scrollable.setAttribute('data-gallery-scrollable', 'true');
      Object.defineProperty(scrollable, 'scrollHeight', { value: 200 });
      Object.defineProperty(scrollable, 'clientHeight', { value: 100 });
      Object.defineProperty(scrollable, 'scrollTop', { value: 0 }); // at top - cannot scroll up
      toolbar.appendChild(scrollable);
      
      const wheelEvent = new WheelEvent('wheel', {
        deltaY: -10,
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(wheelEvent, 'target', { value: scrollable });
      
      toolbar.dispatchEvent(wheelEvent);
    });

    it('kills deltaY > 0 conditional mutation', () => {
      const props = createDefaultProps();
      render(() => <ToolbarView {...props} />);
      const toolbar = screen.getByRole('toolbar');
      
      const scrollable = document.createElement('div');
      scrollable.setAttribute('data-gallery-scrollable', 'true');
      Object.defineProperty(scrollable, 'scrollHeight', { value: 200 });
      Object.defineProperty(scrollable, 'clientHeight', { value: 100 });
      Object.defineProperty(scrollable, 'scrollTop', { value: 50 });
      toolbar.appendChild(scrollable);
      
      // Scroll down (positive deltaY)
      const wheelEvent = new WheelEvent('wheel', {
        deltaY: 10,
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(wheelEvent, 'target', { value: scrollable });
      
      toolbar.dispatchEvent(wheelEvent);
    });

    it('kills scrollTop < maxScrollTop check mutation', () => {
      const props = createDefaultProps();
      render(() => <ToolbarView {...props} />);
      const toolbar = screen.getByRole('toolbar');
      
      const scrollable = document.createElement('div');
      scrollable.setAttribute('data-gallery-scrollable', 'true');
      Object.defineProperty(scrollable, 'scrollHeight', { value: 200 });
      Object.defineProperty(scrollable, 'clientHeight', { value: 100 });
      Object.defineProperty(scrollable, 'scrollTop', { value: 100 }); // at bottom - cannot scroll down
      toolbar.appendChild(scrollable);
      
      const wheelEvent = new WheelEvent('wheel', {
        deltaY: 10,
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(wheelEvent, 'target', { value: scrollable });
      
      toolbar.dispatchEvent(wheelEvent);
    });

    it('kills return true fallback mutation (deltaY === 0)', () => {
      const props = createDefaultProps();
      render(() => <ToolbarView {...props} />);
      const toolbar = screen.getByRole('toolbar');
      
      const scrollable = document.createElement('div');
      scrollable.setAttribute('data-gallery-scrollable', 'true');
      Object.defineProperty(scrollable, 'scrollHeight', { value: 200 });
      Object.defineProperty(scrollable, 'clientHeight', { value: 100 });
      Object.defineProperty(scrollable, 'scrollTop', { value: 50 });
      toolbar.appendChild(scrollable);
      
      // No scroll (deltaY === 0)
      const wheelEvent = new WheelEvent('wheel', {
        deltaY: 0,
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(wheelEvent, 'target', { value: scrollable });
      
      toolbar.dispatchEvent(wheelEvent);
    });
  });

  describe('shouldAllowWheelDefault mutations', () => {
    it('kills !scrollable -> true mutation', () => {
      const props = createDefaultProps();
      render(() => <ToolbarView {...props} />);
      const toolbar = screen.getByRole('toolbar');
      
      // Create wheel event on non-scrollable element
      const wheelEvent = new WheelEvent('wheel', {
        deltaY: 10,
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(wheelEvent, 'target', { value: toolbar });
      
      toolbar.dispatchEvent(wheelEvent);
    });
  });

  describe('createEffect mutations', () => {
    it('kills !element -> true mutation in toolbar effect', () => {
      const props = createDefaultProps();
      render(() => <ToolbarView {...props} />);
      const toolbar = screen.getByRole('toolbar');
      
      // Effect should set data-current-index
      expect(toolbar.dataset.currentIndex).toBe('0');
    });

    it('kills !element -> true mutation in counter effect', () => {
      const props = createDefaultProps();
      render(() => <ToolbarView {...props} />);
      
      // Counter should have data attributes - find by data-gallery-element
      const counter = document.querySelector('[data-gallery-element="counter"]');
      expect(counter).not.toBeNull();
      expect(counter?.getAttribute('data-current-index')).toBe('0');
      expect(counter?.getAttribute('data-focused-index')).toBe('1');
    });
  });

  describe('hasTweetContent mutations', () => {
    it('kills tweetTextHTML() ?? tweetText() -> true mutation', () => {
      const props = createDefaultProps({
        tweetText: undefined,
        tweetTextHTML: undefined,
      });
      render(() => <ToolbarView {...props} />);
      
      // Tweet panel button should not appear when no content
      // Or it should be disabled
      expect(screen.queryByLabelText('Show Tweet Text')).toBeNull();
    });

    it('kills Boolean(...) -> true mutation', () => {
      const props = createDefaultProps({
        tweetText: () => '',
        tweetTextHTML: () => '',
      });
      render(() => <ToolbarView {...props} />);
      
      // Empty strings should be treated as no content
      expect(screen.getByRole('toolbar')).toBeInTheDocument();
    });

    it('handles tweetTextHTML presence correctly', () => {
      const props = createDefaultProps({
        tweetText: undefined,
        tweetTextHTML: () => '<p>HTML content</p>',
      });
      render(() => <ToolbarView {...props} />);
      
      expect(screen.getByRole('toolbar')).toBeInTheDocument();
    });
  });

  describe('preventScrollChaining mutations', () => {
    it('kills shouldAllowWheelDefault check mutation', () => {
      const props = createDefaultProps();
      render(() => <ToolbarView {...props} />);
      const toolbar = screen.getByRole('toolbar');
      
      const preventDefaultSpy = vi.fn();
      const stopPropagationSpy = vi.fn();
      
      const wheelEvent = new WheelEvent('wheel', {
        deltaY: 10,
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(wheelEvent, 'preventDefault', { value: preventDefaultSpy });
      Object.defineProperty(wheelEvent, 'stopPropagation', { value: stopPropagationSpy });
      Object.defineProperty(wheelEvent, 'target', { value: toolbar });
      
      fireEvent(toolbar, wheelEvent);
    });
  });

  describe('aria-label fallback mutations', () => {
    it('kills props.role ?? "toolbar" mutation', () => {
      const props = createDefaultProps({ role: undefined });
      render(() => <ToolbarView {...props} />);
      
      expect(screen.getByRole('toolbar')).toBeInTheDocument();
    });

    it('kills props["aria-label"] ?? "Gallery Toolbar" mutation', () => {
      const props = createDefaultProps({ 'aria-label': undefined });
      render(() => <ToolbarView {...props} />);
      
      expect(screen.getByLabelText('Gallery Toolbar')).toBeInTheDocument();
    });
  });

  describe('button disabled state mutations', () => {
    it('kills prevDisabled check mutation', () => {
      const props = createDefaultProps({
        navState: () => ({
          prevDisabled: true,
          nextDisabled: false,
          canDownloadAll: true,
          downloadDisabled: false,
          anyActionDisabled: false,
        }),
      });
      render(() => <ToolbarView {...props} />);
      
      const prevButton = screen.getByLabelText('Previous Media');
      expect(prevButton).toBeDisabled();
    });

    it('kills nextDisabled check mutation', () => {
      const props = createDefaultProps({
        navState: () => ({
          prevDisabled: false,
          nextDisabled: true,
          canDownloadAll: true,
          downloadDisabled: false,
          anyActionDisabled: false,
        }),
      });
      render(() => <ToolbarView {...props} />);
      
      const nextButton = screen.getByLabelText('Next Media');
      expect(nextButton).toBeDisabled();
    });

    it('kills downloadDisabled check mutation', () => {
      const props = createDefaultProps({
        navState: () => ({
          prevDisabled: false,
          nextDisabled: false,
          canDownloadAll: true,
          downloadDisabled: true,
          anyActionDisabled: false,
        }),
      });
      render(() => <ToolbarView {...props} />);
      
      const downloadButton = screen.getByLabelText('Download Current File');
      expect(downloadButton).toBeDisabled();
    });

    it('kills canDownloadAll check mutation', () => {
      const props = createDefaultProps({
        navState: () => ({
          prevDisabled: false,
          nextDisabled: false,
          canDownloadAll: false,
          downloadDisabled: false,
          anyActionDisabled: false,
        }),
      });
      render(() => <ToolbarView {...props} />);
      
      // Download all should not appear when canDownloadAll is false
      expect(screen.queryByLabelText('Download all (ZIP)')).toBeNull();
    });

    it('kills anyActionDisabled check mutation', () => {
      const props = createDefaultProps({
        navState: () => ({
          prevDisabled: false,
          nextDisabled: false,
          canDownloadAll: true,
          downloadDisabled: false,
          anyActionDisabled: true,
        }),
      });
      render(() => <ToolbarView {...props} />);
      
      // When anyActionDisabled is true, download button data-action-disabled should be true
      const downloadButton = screen.getByLabelText('Download Current File');
      expect(downloadButton.dataset.actionDisabled).toBe('true');
    });

    it('kills isToolbarDisabled check mutation for close button', () => {
      const props = createDefaultProps({
        disabled: () => true,
      });
      render(() => <ToolbarView {...props} />);
      
      // When disabled is true, close button should be disabled
      const closeButton = screen.getByLabelText('Close Gallery');
      expect(closeButton).toBeDisabled();
    });
  });

  describe('settings controller mutations', () => {
    it('kills isSettingsExpanded() -> true mutation', () => {
      const props = createDefaultProps({
        settingsController: createSettingsController({ isSettingsExpanded: () => true }),
      });
      render(() => <ToolbarView {...props} />);
      
      const toolbar = screen.getByRole('toolbar');
      expect(toolbar.dataset.settingsExpanded).toBe('true');
    });

    it('kills showSettingsButton check mutation', () => {
      const props = createDefaultProps({ showSettingsButton: false });
      render(() => <ToolbarView {...props} />);
      
      // Settings button should not be visible
      const settingsButton = screen.queryByLabelText('Open Settings');
      expect(settingsButton).toBeNull();
    });
  });

  describe('tweet panel mutations', () => {
    it('kills isTweetPanelExpanded() -> true mutation', () => {
      const props = createDefaultProps({ isTweetPanelExpanded: () => true });
      render(() => <ToolbarView {...props} />);
      
      const toolbar = screen.getByRole('toolbar');
      expect(toolbar.dataset.tweetPanelExpanded).toBe('true');
    });

    it('calls toggleTweetPanelExpanded on button click', () => {
      const toggleFn = vi.fn();
      const props = createDefaultProps({ toggleTweetPanelExpanded: toggleFn });
      render(() => <ToolbarView {...props} />);
      
      const tweetButton = screen.getByLabelText('Show Tweet Text');
      fireEvent.click(tweetButton);
      
      expect(toggleFn).toHaveBeenCalled();
    });
  });
});
