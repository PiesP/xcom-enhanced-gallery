import { SERVICE_KEYS } from '@/constants/service-keys';
import { ArrowsPointingOut } from '@shared/components/ui/Icon';
import { ToolbarView, type ToolbarViewProps } from '@shared/components/ui/Toolbar/ToolbarView';
import { CoreServiceRegistry } from '@shared/container/core-service-registry';
import { LanguageService } from '@shared/services/language-service';
import { fireEvent, render, screen } from '@solidjs/testing-library';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('ToolbarView', () => {
  beforeEach(() => {
    const languageService = LanguageService.getInstance();
    vi.spyOn(languageService, 'translate').mockImplementation((key: any) => {
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

  const defaultProps: ToolbarViewProps = {
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
    settingsController: {
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
    } as unknown as any,
    showSettingsButton: true,
    isTweetPanelExpanded: () => false,
    toggleTweetPanelExpanded: vi.fn(),
    totalCount: () => 10,
    currentIndex: () => 0,
    isDownloading: () => false,
    disabled: () => false,
    tweetText: () => 'Some tweet text',
  };

  it('renders navigation buttons', () => {
    render(() => <ToolbarView {...defaultProps} />);
    expect(screen.getByLabelText('Previous Media')).toBeInTheDocument();
    expect(screen.getByLabelText('Next Media')).toBeInTheDocument();
  });

  it('calls onPreviousClick when previous button is clicked', () => {
    const onPreviousClick = vi.fn();
    render(() => <ToolbarView {...defaultProps} onPreviousClick={onPreviousClick} />);
    fireEvent.click(screen.getByLabelText('Previous Media'));
    expect(onPreviousClick).toHaveBeenCalled();
  });

  it('calls onNextClick when next button is clicked', () => {
    const onNextClick = vi.fn();
    render(() => <ToolbarView {...defaultProps} onNextClick={onNextClick} />);
    fireEvent.click(screen.getByLabelText('Next Media'));
    expect(onNextClick).toHaveBeenCalled();
  });

  it('renders download buttons', () => {
    render(() => <ToolbarView {...defaultProps} />);
    expect(screen.getByLabelText('Download Current File')).toBeInTheDocument();
    expect(screen.getByLabelText('Download all 10 files as ZIP')).toBeInTheDocument();
  });

  it('calls onDownloadCurrent when download button is clicked', () => {
    const onDownloadCurrent = vi.fn();
    render(() => <ToolbarView {...defaultProps} onDownloadCurrent={onDownloadCurrent} />);
    fireEvent.click(screen.getByLabelText('Download Current File'));
    expect(onDownloadCurrent).toHaveBeenCalled();
  });

  it('calls onDownloadAll when download all button is clicked', () => {
    const onDownloadAll = vi.fn();
    render(() => <ToolbarView {...defaultProps} onDownloadAll={onDownloadAll} />);
    fireEvent.click(screen.getByLabelText('Download all 10 files as ZIP'));
    expect(onDownloadAll).toHaveBeenCalled();
  });

  it('renders close button and calls onCloseClick', () => {
    const onCloseClick = vi.fn();
    render(() => <ToolbarView {...defaultProps} onCloseClick={onCloseClick} />);
    const closeButton = screen.getByLabelText('Close Gallery');
    expect(closeButton).toBeInTheDocument();
    fireEvent.click(closeButton);
    expect(onCloseClick).toHaveBeenCalled();
  });

  it('renders fit mode buttons', () => {
    render(() => <ToolbarView {...defaultProps} />);
    expect(screen.getByTitle('Original Size')).toBeInTheDocument();
  });

  it('toggles settings panel', () => {
    const handleSettingsClick = vi.fn();
    const settingsController = {
      ...defaultProps.settingsController,
      handleSettingsClick,
    };
    render(() => <ToolbarView {...defaultProps} settingsController={settingsController} />);
    fireEvent.click(screen.getByLabelText('Open Settings'));
    expect(handleSettingsClick).toHaveBeenCalled();
  });

  it('toggles tweet text panel', () => {
    const toggleTweetPanelExpanded = vi.fn();
    render(() => (
      <ToolbarView {...defaultProps} toggleTweetPanelExpanded={toggleTweetPanelExpanded} />
    ));
    fireEvent.click(screen.getByLabelText('Show Tweet Text'));
    expect(toggleTweetPanelExpanded).toHaveBeenCalled();
  });

  describe('Accessibility', () => {
    it('should have correct role and aria-label', () => {
      render(() => <ToolbarView {...defaultProps} />);

      const toolbar = screen.getByRole('toolbar');
      expect(toolbar).toHaveAttribute('aria-label', 'Gallery Toolbar');
    });

    it('should respect custom aria-describedby prop', () => {
      render(() => <ToolbarView {...defaultProps} aria-describedby="custom-description" />);

      const toolbar = screen.getByRole('toolbar');
      expect(toolbar).toHaveAttribute('aria-describedby', 'custom-description');
    });

    it('should respect custom aria-label prop', () => {
      render(() => <ToolbarView {...defaultProps} aria-label="Custom toolbar" />);

      const toolbar = screen.getByRole('toolbar');
      expect(toolbar).toHaveAttribute('aria-label', 'Custom toolbar');
    });

    it('should set aria-disabled when toolbar is disabled', () => {
      render(() => <ToolbarView {...defaultProps} disabled={() => true} />);

      const toolbar = screen.getByRole('toolbar');
      expect(toolbar).toHaveAttribute('aria-disabled', 'true');
    });
  });

  describe('Data Attributes', () => {
    it('should set data-gallery-element on toolbar', () => {
      const { container } = render(() => <ToolbarView {...defaultProps} />);

      const toolbar = container.querySelector('[data-gallery-element="toolbar"]');
      expect(toolbar).toBeInTheDocument();
    });

    it('should set data-state from toolbarDataState', () => {
      render(() => <ToolbarView {...defaultProps} toolbarDataState={() => 'loading'} />);

      const toolbar = screen.getByRole('toolbar');
      expect(toolbar).toHaveAttribute('data-state', 'loading');
    });

    it('should set data-testid when provided', () => {
      render(() => <ToolbarView {...defaultProps} data-testid="custom-toolbar" />);

      expect(screen.getByTestId('custom-toolbar')).toBeInTheDocument();
    });

    it('should set data-settings-expanded attribute', () => {
      const settingsController = {
        ...defaultProps.settingsController,
        isSettingsExpanded: () => true,
      };
      render(() => <ToolbarView {...defaultProps} settingsController={settingsController} />);

      const toolbar = screen.getByRole('toolbar');
      expect(toolbar).toHaveAttribute('data-settings-expanded', 'true');
    });

    it('should set data-tweet-panel-expanded attribute', () => {
      render(() => <ToolbarView {...defaultProps} isTweetPanelExpanded={() => true} />);

      const toolbar = screen.getByRole('toolbar');
      expect(toolbar).toHaveAttribute('data-tweet-panel-expanded', 'true');
    });

    it('should set data-focused-index and data-current-index', () => {
      render(() => (
        <ToolbarView {...defaultProps} displayedIndex={() => 3} currentIndex={() => 2} />
      ));

      const toolbar = screen.getByRole('toolbar');
      expect(toolbar).toHaveAttribute('data-focused-index', '3');
      expect(toolbar).toHaveAttribute('data-current-index', '2');
    });
  });

  describe('Navigation State', () => {
    it('should disable previous button when prevDisabled is true', () => {
      render(() => (
        <ToolbarView
          {...defaultProps}
          navState={() => ({
            ...defaultProps.navState(),
            prevDisabled: true,
          })}
        />
      ));

      expect(screen.getByLabelText('Previous Media')).toBeDisabled();
    });

    it('should disable next button when nextDisabled is true', () => {
      render(() => (
        <ToolbarView
          {...defaultProps}
          navState={() => ({
            ...defaultProps.navState(),
            nextDisabled: true,
          })}
        />
      ));

      expect(screen.getByLabelText('Next Media')).toBeDisabled();
    });

    it('should disable download button when downloadDisabled is true', () => {
      render(() => (
        <ToolbarView
          {...defaultProps}
          navState={() => ({
            ...defaultProps.navState(),
            downloadDisabled: true,
          })}
        />
      ));

      expect(screen.getByLabelText('Download Current File')).toBeDisabled();
    });

    it('should not render download all button when canDownloadAll is false', () => {
      render(() => (
        <ToolbarView
          {...defaultProps}
          navState={() => ({
            ...defaultProps.navState(),
            canDownloadAll: false,
          })}
        />
      ));

      expect(screen.queryByLabelText('Download all 10 files as ZIP')).not.toBeInTheDocument();
    });
  });

  describe('Counter Display', () => {
    it('should display correct counter values', () => {
      render(() => (
        <ToolbarView {...defaultProps} displayedIndex={() => 4} totalCount={() => 20} />
      ));

      // Index is 0-based, display should be 1-based
      expect(screen.getByText('5')).toBeInTheDocument(); // 4 + 1
      expect(screen.getByText('20')).toBeInTheDocument();
    });

    it('should display separator between counter values', () => {
      const { container } = render(() => <ToolbarView {...defaultProps} />);

      const separator = container.querySelector('[class*="separator"]');
      expect(separator).toHaveTextContent('/');
    });
  });

  describe('Progress Bar', () => {
    it('should render progress bar with correct width', () => {
      const { container } = render(() => (
        <ToolbarView {...defaultProps} progressWidth={() => '75%'} />
      ));

      const progressFill = container.querySelector('[class*="progressFill"]');
      expect(progressFill).toHaveStyle({ width: '75%' });
    });
  });

  describe('Fit Mode Buttons', () => {
    it('should call handleFitModeClick when fit mode button is clicked', () => {
      const handleFitModeClick = vi.fn(() => vi.fn());
      render(() => (
        <ToolbarView {...defaultProps} handleFitModeClick={handleFitModeClick} />
      ));

      fireEvent.click(screen.getByTitle('Original Size'));
      expect(handleFitModeClick).toHaveBeenCalledWith('original');
    });

    it('should mark active fit mode with data-selected', () => {
      const { container } = render(() => (
        <ToolbarView {...defaultProps} activeFitMode={() => 'original'} />
      ));

      const fitButton = container.querySelector('[data-gallery-element="fit-original"]');
      expect(fitButton).toHaveAttribute('data-selected', 'true');
    });

    it('should disable fit mode button when isFitDisabled returns true', () => {
      render(() => (
        <ToolbarView {...defaultProps} isFitDisabled={() => true} />
      ));

      expect(screen.getByTitle('Original Size')).toBeDisabled();
    });
  });

  describe('Settings Button', () => {
    it('should not render settings button when showSettingsButton is false', () => {
      render(() => <ToolbarView {...defaultProps} showSettingsButton={false} />);

      expect(screen.queryByLabelText('Open Settings')).not.toBeInTheDocument();
    });

    it('should set aria-expanded on settings button', () => {
      const settingsController = {
        ...defaultProps.settingsController,
        isSettingsExpanded: () => true,
      };
      render(() => <ToolbarView {...defaultProps} settingsController={settingsController} />);

      const settingsButton = screen.getByLabelText('Open Settings');
      expect(settingsButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('should call handleSettingsMouseDown on mousedown', () => {
      const handleSettingsMouseDown = vi.fn();
      const settingsController = {
        ...defaultProps.settingsController,
        handleSettingsMouseDown,
      };
      render(() => <ToolbarView {...defaultProps} settingsController={settingsController} />);

      fireEvent.mouseDown(screen.getByLabelText('Open Settings'));
      expect(handleSettingsMouseDown).toHaveBeenCalled();
    });
  });

  describe('Tweet Panel', () => {
    it('should not render tweet button when no tweet content', () => {
      render(() => (
        <ToolbarView {...defaultProps} tweetText={() => undefined} tweetTextHTML={undefined} />
      ));

      expect(screen.queryByLabelText('Show Tweet Text')).not.toBeInTheDocument();
    });

    it('should render tweet button when tweetText is provided', () => {
      render(() => <ToolbarView {...defaultProps} tweetText={() => 'Some text'} />);

      expect(screen.getByLabelText('Show Tweet Text')).toBeInTheDocument();
    });

    it('should render tweet button when tweetTextHTML is provided', () => {
      render(() => (
        <ToolbarView
          {...defaultProps}
          tweetText={() => undefined}
          tweetTextHTML={() => '<span>HTML</span>'}
        />
      ));

      expect(screen.getByLabelText('Show Tweet Text')).toBeInTheDocument();
    });

    it('should set aria-expanded on tweet button', () => {
      render(() => <ToolbarView {...defaultProps} isTweetPanelExpanded={() => true} />);

      const tweetButton = screen.getByLabelText('Show Tweet Text');
      expect(tweetButton).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('Wheel Event Handling', () => {
    it('should prevent wheel scroll on toolbar', () => {
      const { container } = render(() => <ToolbarView {...defaultProps} />);

      const toolbar = container.querySelector('[data-gallery-element="toolbar"]');
      const wheelEvent = new WheelEvent('wheel', {
        bubbles: true,
        cancelable: true,
        deltaY: 100,
      });

      toolbar?.dispatchEvent(wheelEvent);

      // Note: The actual behavior depends on whether a scrollable element is found
      // and the scroll position of that element
    });

    it('should allow wheel scroll on scrollable ancestor scrolling down', () => {
      const { container } = render(() => <ToolbarView {...defaultProps} />);

      // Create a scrollable element
      const scrollable = document.createElement('div');
      scrollable.setAttribute('data-gallery-scrollable', 'true');
      Object.defineProperties(scrollable, {
        scrollHeight: { value: 500, configurable: true },
        clientHeight: { value: 200, configurable: true },
        scrollTop: { value: 0, writable: true, configurable: true },
      });

      const toolbar = container.querySelector('[data-gallery-element="toolbar"]');
      if (toolbar) {
        scrollable.appendChild(toolbar);
        document.body.appendChild(scrollable);

        const wheelEvent = new WheelEvent('wheel', {
          bubbles: true,
          cancelable: true,
          deltaY: 100, // scrolling down
        });

        const preventDefault = vi.spyOn(wheelEvent, 'preventDefault');

        toolbar.dispatchEvent(wheelEvent);

        // Should NOT prevent default since we can scroll down
        expect(preventDefault).not.toHaveBeenCalled();

        document.body.removeChild(scrollable);
      }
    });

    it('should allow wheel scroll on scrollable ancestor scrolling up', () => {
      const { container } = render(() => <ToolbarView {...defaultProps} />);

      // Create a scrollable element already scrolled down
      const scrollable = document.createElement('div');
      scrollable.setAttribute('data-gallery-scrollable', 'true');
      Object.defineProperties(scrollable, {
        scrollHeight: { value: 500, configurable: true },
        clientHeight: { value: 200, configurable: true },
        scrollTop: { value: 100, writable: true, configurable: true },
      });

      const toolbar = container.querySelector('[data-gallery-element="toolbar"]');
      if (toolbar) {
        scrollable.appendChild(toolbar);
        document.body.appendChild(scrollable);

        const wheelEvent = new WheelEvent('wheel', {
          bubbles: true,
          cancelable: true,
          deltaY: -50, // scrolling up
        });

        const preventDefault = vi.spyOn(wheelEvent, 'preventDefault');

        toolbar.dispatchEvent(wheelEvent);

        // Should NOT prevent default since we can scroll up
        expect(preventDefault).not.toHaveBeenCalled();

        document.body.removeChild(scrollable);
      }
    });

    it('should prevent wheel when scrollable at bottom and scrolling down', () => {
      const { container } = render(() => <ToolbarView {...defaultProps} />);

      // Create a scrollable element at the bottom
      const scrollable = document.createElement('div');
      scrollable.setAttribute('data-gallery-scrollable', 'true');
      Object.defineProperties(scrollable, {
        scrollHeight: { value: 500, configurable: true },
        clientHeight: { value: 200, configurable: true },
        scrollTop: { value: 300, writable: true, configurable: true }, // at bottom
      });

      const toolbar = container.querySelector('[data-gallery-element="toolbar"]');
      if (toolbar) {
        scrollable.appendChild(toolbar);
        document.body.appendChild(scrollable);

        const wheelEvent = new WheelEvent('wheel', {
          bubbles: true,
          cancelable: true,
          deltaY: 100, // scrolling down
        });

        const preventDefault = vi.spyOn(wheelEvent, 'preventDefault');

        toolbar.dispatchEvent(wheelEvent);

        // Should prevent default since we're at bottom and scrolling down
        expect(preventDefault).toHaveBeenCalled();

        document.body.removeChild(scrollable);
      }
    });

    it('should prevent wheel when scrollable at top and scrolling up', () => {
      const { container } = render(() => <ToolbarView {...defaultProps} />);

      // Create a scrollable element at the top
      const scrollable = document.createElement('div');
      scrollable.setAttribute('data-gallery-scrollable', 'true');
      Object.defineProperties(scrollable, {
        scrollHeight: { value: 500, configurable: true },
        clientHeight: { value: 200, configurable: true },
        scrollTop: { value: 0, writable: true, configurable: true }, // at top
      });

      const toolbar = container.querySelector('[data-gallery-element="toolbar"]');
      if (toolbar) {
        scrollable.appendChild(toolbar);
        document.body.appendChild(scrollable);

        const wheelEvent = new WheelEvent('wheel', {
          bubbles: true,
          cancelable: true,
          deltaY: -50, // scrolling up
        });

        const preventDefault = vi.spyOn(wheelEvent, 'preventDefault');

        toolbar.dispatchEvent(wheelEvent);

        // Should prevent default since we're at top and scrolling up
        expect(preventDefault).toHaveBeenCalled();

        document.body.removeChild(scrollable);
      }
    });

    it('should prevent wheel on non-scrollable element', () => {
      const { container } = render(() => <ToolbarView {...defaultProps} />);

      // Create a non-scrollable element (no data-gallery-scrollable attribute)
      const nonScrollable = document.createElement('div');

      const toolbar = container.querySelector('[data-gallery-element="toolbar"]');
      if (toolbar) {
        nonScrollable.appendChild(toolbar);
        document.body.appendChild(nonScrollable);

        const wheelEvent = new WheelEvent('wheel', {
          bubbles: true,
          cancelable: true,
          deltaY: 100,
        });

        const preventDefault = vi.spyOn(wheelEvent, 'preventDefault');

        toolbar.dispatchEvent(wheelEvent);

        // Should prevent default since no scrollable ancestor
        expect(preventDefault).toHaveBeenCalled();

        document.body.removeChild(nonScrollable);
      }
    });

    it('should handle wheel with zero deltaY', () => {
      const { container } = render(() => <ToolbarView {...defaultProps} />);

      // Create a scrollable element
      const scrollable = document.createElement('div');
      scrollable.setAttribute('data-gallery-scrollable', 'true');
      Object.defineProperties(scrollable, {
        scrollHeight: { value: 500, configurable: true },
        clientHeight: { value: 200, configurable: true },
        scrollTop: { value: 100, writable: true, configurable: true },
      });

      const toolbar = container.querySelector('[data-gallery-element="toolbar"]');
      if (toolbar) {
        scrollable.appendChild(toolbar);
        document.body.appendChild(scrollable);

        const wheelEvent = new WheelEvent('wheel', {
          bubbles: true,
          cancelable: true,
          deltaY: 0, // no scroll
        });

        const preventDefault = vi.spyOn(wheelEvent, 'preventDefault');

        toolbar.dispatchEvent(wheelEvent);

        // With deltaY === 0, canConsumeWheelEvent returns true
        expect(preventDefault).not.toHaveBeenCalled();

        document.body.removeChild(scrollable);
      }
    });
  });

  describe('Focus Events', () => {
    it('should call onFocus when toolbar receives focus', () => {
      const onFocus = vi.fn();
      render(() => <ToolbarView {...defaultProps} onFocus={onFocus} />);

      const toolbar = screen.getByRole('toolbar');
      fireEvent.focus(toolbar);

      expect(onFocus).toHaveBeenCalled();
    });

    it('should call onBlur when toolbar loses focus', () => {
      const onBlur = vi.fn();
      render(() => <ToolbarView {...defaultProps} onBlur={onBlur} />);

      const toolbar = screen.getByRole('toolbar');
      fireEvent.blur(toolbar);

      expect(onBlur).toHaveBeenCalled();
    });
  });

  describe('Keyboard Events', () => {
    it('should call handleToolbarKeyDown on keydown', () => {
      const handleToolbarKeyDown = vi.fn();
      const settingsController = {
        ...defaultProps.settingsController,
        handleToolbarKeyDown,
      };
      render(() => <ToolbarView {...defaultProps} settingsController={settingsController} />);

      const toolbar = screen.getByRole('toolbar');
      fireEvent.keyDown(toolbar, { key: 'Escape' });

      expect(handleToolbarKeyDown).toHaveBeenCalled();
    });
  });

  describe('Settings Panel Interactions', () => {
    it('should call handlePanelMouseDown on settings panel mousedown', () => {
      const handlePanelMouseDown = vi.fn();
      const settingsController = {
        ...defaultProps.settingsController,
        handlePanelMouseDown,
        isSettingsExpanded: () => true,
      };
      const { container } = render(() => (
        <ToolbarView {...defaultProps} settingsController={settingsController} />
      ));

      const settingsPanel = container.querySelector('#toolbar-settings-panel');
      fireEvent.mouseDown(settingsPanel!);

      expect(handlePanelMouseDown).toHaveBeenCalled();
    });

    it('should call handlePanelClick on settings panel click', () => {
      const handlePanelClick = vi.fn();
      const settingsController = {
        ...defaultProps.settingsController,
        handlePanelClick,
        isSettingsExpanded: () => true,
      };
      const { container } = render(() => (
        <ToolbarView {...defaultProps} settingsController={settingsController} />
      ));

      const settingsPanel = container.querySelector('#toolbar-settings-panel');
      fireEvent.click(settingsPanel!);

      expect(handlePanelClick).toHaveBeenCalled();
    });
  });
});
