/**
 * @fileoverview Phase 7.2 RED: 갤러리 접근성 테스트
 * @description ARIA 속성, Focus management, Screen reader 지원 검증
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@solidjs/testing-library';
import type { JSX } from 'solid-js';

// Vendors getter 사용
const vendorModule = await import('@shared/external/vendors');
const { getSolid, getSolidWeb } = vendorModule;
const { createSignal } = getSolid();
const { render: solidRender } = getSolidWeb();

// 컴포넌트 및 서비스
import { GalleryContainer } from '@/shared/components/isolation/GalleryContainer';
import type { GalleryContainerProps } from '@/shared/components/isolation/GalleryContainer';

describe('Phase 7.2: Gallery Accessibility', () => {
  afterEach(() => {
    cleanup();
  });

  describe('GalleryContainer ARIA Attributes', () => {
    it('[RED] should have role="dialog" on container', () => {
      // Arrange
      const TestComponent = (): JSX.Element => (
        <GalleryContainer>
          <div>Test Content</div>
        </GalleryContainer>
      );

      // Act
      render(() => <TestComponent />);
      const container = screen.getByText('Test Content').closest('[data-xeg-gallery-container]');

      // Assert
      expect(container).toHaveAttribute('role', 'dialog');
    });

    it('[RED] should have aria-modal="true" on container', () => {
      // Arrange
      const TestComponent = (): JSX.Element => (
        <GalleryContainer>
          <div>Modal Content</div>
        </GalleryContainer>
      );

      // Act
      render(() => <TestComponent />);
      const container = screen.getByText('Modal Content').closest('[data-xeg-gallery-container]');

      // Assert
      expect(container).toHaveAttribute('aria-modal', 'true');
    });

    it('[RED] should have aria-label describing the gallery', () => {
      // Arrange
      const TestComponent = (): JSX.Element => (
        <GalleryContainer>
          <div>Gallery</div>
        </GalleryContainer>
      );

      // Act
      render(() => <TestComponent />);
      const container = screen.getByText('Gallery').closest('[data-xeg-gallery-container]');

      // Assert
      expect(container).toHaveAttribute('aria-label');
      const ariaLabel = container?.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
      expect(ariaLabel?.length).toBeGreaterThan(0);
    });

    it('[RED] should have aria-describedby pointing to help text', () => {
      // Arrange
      const TestComponent = (): JSX.Element => (
        <GalleryContainer>
          <div>Content</div>
        </GalleryContainer>
      );

      // Act
      render(() => <TestComponent />);
      const container = screen.getByText('Content').closest('[data-xeg-gallery-container]');

      // Assert
      expect(container).toHaveAttribute('aria-describedby');
    });
  });

  describe('Focus Management', () => {
    it('[RED] should focus first interactive element when opened', () => {
      // Arrange
      const TestComponent = (): JSX.Element => (
        <GalleryContainer>
          <button data-testid='close-button'>Close</button>
          <button data-testid='download-button'>Download</button>
        </GalleryContainer>
      );

      // Act
      render(() => <TestComponent />);

      // Assert
      const closeButton = screen.getByTestId('close-button');
      expect(document.activeElement).toBe(closeButton);
    });

    it('[RED] should restore focus to trigger element when closed', () => {
      // Arrange
      const triggerButton = document.createElement('button');
      triggerButton.textContent = 'Open Gallery';
      document.body.appendChild(triggerButton);
      triggerButton.focus();

      const initialActiveElement = document.activeElement;

      const [isOpen, setIsOpen] = createSignal(true);
      const TestComponent = (): JSX.Element => (
        <>
          {isOpen() && (
            <GalleryContainer onClose={() => setIsOpen(false)}>
              <button data-testid='close-button'>Close</button>
            </GalleryContainer>
          )}
        </>
      );

      // Act
      render(() => <TestComponent />);
      const closeButton = screen.queryByTestId('close-button');
      closeButton?.click();

      // Wait for async cleanup
      return new Promise<void>(resolve => {
        setTimeout(() => {
          // Assert
          expect(document.activeElement).toBe(initialActiveElement);
          document.body.removeChild(triggerButton);
          resolve();
        }, 50);
      });
    });

    it('[RED] should trap focus within gallery', () => {
      // Arrange
      const TestComponent = (): JSX.Element => (
        <GalleryContainer>
          <button data-testid='first-button'>First</button>
          <button data-testid='second-button'>Second</button>
          <button data-testid='last-button'>Last</button>
        </GalleryContainer>
      );

      // Act
      render(() => <TestComponent />);
      const firstButton = screen.getByTestId('first-button');
      const lastButton = screen.getByTestId('last-button');

      // Tab from last element
      lastButton.focus();
      const tabEvent = new window.KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
      lastButton.dispatchEvent(tabEvent);

      // Assert - should cycle back to first element
      expect(document.activeElement).toBe(firstButton);
    });
  });

  describe('Screen Reader Support', () => {
    it('[RED] should announce current image position', () => {
      // Arrange
      const TestComponent = (): JSX.Element => (
        <GalleryContainer>
          <div role='img' aria-label='이미지 1 / 5'>
            Image
          </div>
        </GalleryContainer>
      );

      // Act
      render(() => <TestComponent />);
      const image = screen.getByRole('img');

      // Assert
      expect(image).toHaveAttribute('aria-label');
      const label = image.getAttribute('aria-label');
      expect(label).toMatch(/\d+ \/ \d+/); // "1 / 5" 형식
    });

    it('[RED] should have aria-live region for navigation announcements', () => {
      // Arrange
      const TestComponent = (): JSX.Element => (
        <GalleryContainer>
          <div aria-live='polite' aria-atomic='true' data-testid='live-region'>
            이미지 3으로 이동했습니다
          </div>
        </GalleryContainer>
      );

      // Act
      render(() => <TestComponent />);
      const liveRegion = screen.getByTestId('live-region');

      // Assert
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
      expect(liveRegion).toHaveAttribute('aria-atomic', 'true');
    });

    it('[RED] should indicate loading state with aria-busy', () => {
      // Arrange
      const [isLoading, setIsLoading] = createSignal(true);
      const TestComponent = (): JSX.Element => (
        <GalleryContainer>
          <div aria-busy={isLoading()} data-testid='content'>
            {isLoading() ? 'Loading...' : 'Loaded'}
          </div>
        </GalleryContainer>
      );

      // Act
      render(() => <TestComponent />);
      const content = screen.getByTestId('content');

      // Assert
      expect(content).toHaveAttribute('aria-busy', 'true');

      // When loading completes
      setIsLoading(false);
      expect(content).toHaveAttribute('aria-busy', 'false');
    });

    it('[RED] should provide text alternatives for icon buttons', () => {
      // Arrange
      const TestComponent = (): JSX.Element => (
        <GalleryContainer>
          <button aria-label='갤러리 닫기' data-testid='close-icon'>
            <svg aria-hidden='true'>
              <use href='#icon-x' />
            </svg>
          </button>
        </GalleryContainer>
      );

      // Act
      render(() => <TestComponent />);
      const button = screen.getByTestId('close-icon');
      const svg = button.querySelector('svg');

      // Assert
      expect(button).toHaveAttribute('aria-label');
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Keyboard Navigation Integration', () => {
    it('[RED] should describe keyboard shortcuts in aria-describedby', () => {
      // Arrange
      const TestComponent = (): JSX.Element => (
        <GalleryContainer>
          <div id='keyboard-help' hidden>
            화살표 키로 이미지 이동, Escape로 닫기
          </div>
          <div aria-describedby='keyboard-help' data-testid='content'>
            Content
          </div>
        </GalleryContainer>
      );

      // Act
      render(() => <TestComponent />);
      const content = screen.getByTestId('content');
      const helpText = document.getElementById('keyboard-help');

      // Assert
      expect(content).toHaveAttribute('aria-describedby', 'keyboard-help');
      expect(helpText).toBeInTheDocument();
      expect(helpText?.textContent).toContain('화살표');
      expect(helpText?.textContent).toContain('Escape');
    });

    it('[RED] should announce navigation actions', () => {
      // Arrange
      const [announcement, setAnnouncement] = createSignal('');
      const TestComponent = (): JSX.Element => (
        <GalleryContainer>
          <div role='status' aria-live='polite' aria-atomic='true' data-testid='announcement'>
            {announcement()}
          </div>
          <button onClick={() => setAnnouncement('다음 이미지로 이동')} data-testid='next-button'>
            Next
          </button>
        </GalleryContainer>
      );

      // Act
      render(() => <TestComponent />);
      const nextButton = screen.getByTestId('next-button');
      const announcementRegion = screen.getByTestId('announcement');

      nextButton.click();

      // Assert
      expect(announcementRegion).toHaveAttribute('role', 'status');
      expect(announcementRegion).toHaveAttribute('aria-live', 'polite');
      expect(announcementRegion.textContent).toBe('다음 이미지로 이동');
    });
  });
});
