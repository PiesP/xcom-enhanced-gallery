import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ErrorBoundary } from '@shared/components/ui/ErrorBoundary/ErrorBoundary';
import {
  GalleryContainer,
  mountGallery,
  unmountGallery,
} from '@shared/components/isolation/GalleryContainer';
import { restoreActiveGalleryHostState } from '@shared/components/isolation/gallery-host-state';
import {
  getLanguageService,
  resetLanguageServiceForTests,
} from '@shared/services/language-service';
import { createEffect, createSignal, type JSXElement } from 'solid-js';

const languageState = vi.hoisted(() => ({ current: 'en' }));

vi.mock('@platform/index', () => ({
  getNotificationAdapter: () => ({ notify: vi.fn(async () => undefined) }),
  getStorageAdapter: () => ({
    get: vi.fn(async () => undefined),
    remove: vi.fn(async () => undefined),
    set: vi.fn(async () => undefined),
  }),
  notifySafely: vi.fn(),
}));

vi.mock('@shared/hooks/use-translation', () => ({
  useTranslation: () => (key: string) => key,
}));

vi.mock('@shared/services/language-service', () => {
  const labels = {
    ar: {
      'msg.err.b': 'حدث خطأ غير متوقع: {error}',
      'msg.err.noMoreRetries': 'لا توجد محاولات إضافية',
      'msg.err.reset': 'إعادة تعيين',
      'msg.err.retry': 'إعادة المحاولة',
      'msg.err.t': 'حدث خطأ',
      'tb.cls': 'إغلاق',
    },
    en: {
      'msg.err.b': 'An unexpected error occurred: {error}',
      'msg.err.noMoreRetries': 'No more retries',
      'msg.err.reset': 'Reset',
      'msg.err.retry': 'Retry',
      'msg.err.t': 'An error occurred',
      'tb.cls': 'Close',
    },
    ko: {
      'msg.err.b': '예상치 못한 오류가 발생했습니다: {error}',
      'msg.err.noMoreRetries': '더 이상 재시도할 수 없음',
      'msg.err.reset': '초기화',
      'msg.err.retry': '다시 시도',
      'msg.err.t': '오류가 발생했습니다',
      'tb.cls': '닫기',
    },
  } as const;
  return {
    getLanguageService: () => ({
      setLanguage: (language: keyof typeof labels) => {
        languageState.current = language;
      },
      translate: (key: keyof (typeof labels)['en'], params?: Record<string, string>) => {
        const language = languageState.current as keyof typeof labels;
        const template = labels[language][key];
        return params?.error ? template.replace('{error}', params.error) : template;
      },
    }),
    resetLanguageServiceForTests: () => {
      languageState.current = 'en';
    },
  };
});

describe('gallery host-state recovery', () => {
  afterEach(() => {
    vi.useRealTimers();
    restoreActiveGalleryHostState();
    document.body.replaceChildren();
    document.body.removeAttribute('style');
    resetLanguageServiceForTests();
    vi.restoreAllMocks();
  });

  it('renders an initial error as a themed, localized modeless recovery surface', async () => {
    const outside = document.createElement('button');
    outside.textContent = 'Outside';
    document.body.append(outside);
    outside.focus();

    const host = document.createElement('div');
    host.style.width = '0';
    host.style.height = '0';
    document.body.append(host);
    const onClose = vi.fn();
    getLanguageService().setLanguage('ar');
    const [language, setLanguage] = createSignal<'ar' | 'ko'>('ar');

    function ThrowOnInitialRender(): JSXElement {
      throw new Error(`Initial ${'very long '.repeat(40)}render failure`);
    }

    mountGallery(host, () => (
      <ErrorBoundary
        dir={language() === 'ar' ? 'rtl' : 'ltr'}
        lang={language()}
        onClose={onClose}
        onError={restoreActiveGalleryHostState}
        theme="dark"
        themeSetting="dark"
      >
        <ThrowOnInitialRender />
      </ErrorBoundary>
    ));
    await Promise.resolve();

    const recovery = host.querySelector<HTMLElement>('[data-xeg-error-boundary]');
    expect(recovery).not.toBeNull();
    expect(recovery).toMatchObject({
      dir: 'rtl',
      lang: 'ar',
    });
    expect(recovery?.tagName).toBe('SECTION');
    expect(recovery?.hasAttribute('aria-labelledby')).toBe(true);
    expect(recovery?.hasAttribute('aria-modal')).toBe(false);
    expect(recovery?.getAttribute('data-theme')).toBe('dark');
    expect(recovery?.getAttribute('data-pp-theme')).toBe('dark');
    expect(recovery?.classList).toContain('xeg-theme-scope');
    expect(recovery?.textContent).toContain('Initial very long');
    expect(document.activeElement).toBe(outside);

    const retry = recovery?.querySelector<HTMLButtonElement>('[data-xeg-error-action="retry"]');
    const close = recovery?.querySelector<HTMLButtonElement>('[data-xeg-error-action="close"]');
    expect(retry?.textContent).toBe('إعادة المحاولة');
    expect(close?.textContent).toBe('إغلاق');

    getLanguageService().setLanguage('ko');
    setLanguage('ko');
    await Promise.resolve();
    expect(recovery).toMatchObject({ dir: 'ltr', lang: 'ko' });
    expect(recovery?.querySelector('h2')?.textContent).toBe('오류가 발생했습니다');
    expect(recovery?.querySelector('[role="alert"] p')?.textContent).toContain(
      '예상치 못한 오류가 발생했습니다: Initial very long'
    );
    expect(retry?.textContent).toBe('다시 시도');
    expect(close?.textContent).toBe('닫기');
    close?.focus();
    close?.click();
    await Promise.resolve();

    expect(onClose).toHaveBeenCalledOnce();
    expect(host.querySelector('[data-xeg-error-boundary]')).toBeNull();
    expect(document.activeElement).toBe(outside);
    unmountGallery(host);
  });

  it('offers a localized reset after bounded failed retries', async () => {
    const outside = document.createElement('button');
    document.body.append(outside);
    outside.focus();
    const host = document.createElement('div');
    document.body.append(host);
    getLanguageService().setLanguage('ko');

    function AlwaysThrows(): JSXElement {
      throw new Error('Persistent render failure');
    }

    mountGallery(host, () => (
      <ErrorBoundary lang="en" onClose={() => undefined}>
        <AlwaysThrows />
      </ErrorBoundary>
    ));

    for (let attempt = 0; attempt < 3; attempt += 1) {
      await Promise.resolve();
      host.querySelector<HTMLButtonElement>('[data-xeg-error-action="retry"]')?.click();
      await Promise.resolve();
      await Promise.resolve();
    }

    const retry = host.querySelector<HTMLButtonElement>('[data-xeg-error-action="retry"]');
    const reset = host.querySelector<HTMLButtonElement>('[data-xeg-error-action="reset"]');
    expect(retry?.disabled).toBe(true);
    expect(retry?.textContent).toBe('더 이상 재시도할 수 없음');
    expect(reset?.textContent).toBe('초기화');

    reset?.click();
    await Promise.resolve();
    await Promise.resolve();
    expect(
      host.querySelector<HTMLButtonElement>('[data-xeg-error-action="retry"]')?.disabled
    ).toBe(false);
    expect(
      host.querySelector<HTMLButtonElement>('[data-xeg-error-action="retry"]')?.textContent
    ).toBe('다시 시도');
    unmountGallery(host);
  });

  it('does not schedule a stale reset after the third retry succeeds', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');
    const outside = document.createElement('button');
    document.body.append(outside);
    outside.focus();
    const host = document.createElement('div');
    document.body.append(host);
    let renderCount = 0;

    function SucceedsOnThirdRetry(): JSXElement {
      renderCount += 1;
      if (renderCount <= 3) throw new Error(`Transient render failure ${renderCount}`);
      return <button data-stable-gallery="" type="button">Recovered gallery</button>;
    }

    mountGallery(host, () => (
      <ErrorBoundary lang="en" onClose={() => undefined}>
        <SucceedsOnThirdRetry />
      </ErrorBoundary>
    ));

    for (let attempt = 0; attempt < 3; attempt += 1) {
      await Promise.resolve();
      host.querySelector<HTMLButtonElement>('[data-xeg-error-action="retry"]')?.click();
      await Promise.resolve();
      await Promise.resolve();
    }

    const recovered = host.querySelector('[data-stable-gallery]');
    expect(recovered).not.toBeNull();
    expect(renderCount).toBe(4);
    expect(setTimeoutSpy).not.toHaveBeenCalledWith(expect.any(Function), 30_000);
    vi.advanceTimersByTime(30_000);
    await Promise.resolve();
    expect(host.querySelector('[data-stable-gallery]')).toBe(recovered);
    expect(renderCount).toBe(4);
    expect(document.activeElement).toBe(outside);
    unmountGallery(host);
  });

  it('keeps recovery color scheme and long localized actions explicit after all reset', () => {
    const css = readFileSync(
      resolve(process.cwd(), 'src/shared/components/ui/ErrorBoundary/ErrorBoundary.module.css'),
      'utf8'
    );
    expect(css).toMatch(/\.recoveryRoot\[data-theme="light"\]\s*{\s*color-scheme: light;/);
    expect(css).toMatch(/\.recoveryRoot\[data-theme="dark"\]\s*{\s*color-scheme: dark;/);
    expect(css).toMatch(
      /\.recoveryAction\s*{[^}]*overflow-wrap: anywhere;[^}]*white-space: normal;/s
    );
  });

  it('restores the exact host snapshot after a child render error and remains idempotent', async () => {
    document.body.style.overflow = 'clip';
    document.body.style.position = 'relative';
    document.body.style.top = '7px';
    document.body.style.left = '8px';
    document.body.style.right = '9px';
    window.history.scrollRestoration = 'manual';
    vi.spyOn(window, 'scrollY', 'get').mockReturnValue(321);
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);

    const outside = document.createElement('button');
    outside.setAttribute('aria-hidden', 'false');
    outside.textContent = 'Outside';
    document.body.append(outside);
    outside.focus();

    const host = document.createElement('div');
    document.body.append(host);
    let triggerError = (): void => undefined;

    function ThrowAfterMount(): JSXElement {
      const [shouldThrow, setShouldThrow] = createSignal(false);
      triggerError = () => setShouldThrow(true);
      createEffect(() => {
        if (shouldThrow()) throw new Error('Injected render failure');
      });
      return <button type="button">Inside</button>;
    }

    const onClose = vi.fn();
    mountGallery(host, () => (
      <ErrorBoundary
        lang="en"
        onClose={onClose}
        onError={restoreActiveGalleryHostState}
        theme="light"
        themeSetting="auto"
      >
        <GalleryContainer>
          <ThrowAfterMount />
        </GalleryContainer>
      </ErrorBoundary>
    ));

    expect(document.body.style.position).toBe('fixed');
    expect(outside.hasAttribute('inert')).toBe(true);
    triggerError();
    await Promise.resolve();

    expect(document.body.style).toMatchObject({
      overflow: 'clip',
      position: 'relative',
      top: '7px',
      left: '8px',
      right: '9px',
    });
    expect(window.history.scrollRestoration).toBe('manual');
    expect(outside.getAttribute('aria-hidden')).toBe('false');
    expect(outside.hasAttribute('inert')).toBe(false);
    expect(document.activeElement).toBe(outside);
    expect(scrollTo).toHaveBeenCalledWith(0, 321);

    const recovery = host.querySelector<HTMLElement>('[data-xeg-error-boundary]');
    const retry = recovery?.querySelector<HTMLButtonElement>('[data-xeg-error-action="retry"]');
    expect(recovery?.tagName).toBe('SECTION');
    expect(retry).toBeDefined();
    retry?.focus();
    retry?.click();
    await Promise.resolve();
    await Promise.resolve();

    expect(host.querySelector('[data-xeg-error-boundary]')).toBeNull();
    expect(host.querySelector('[data-xeg-gallery-container]')).not.toBeNull();
    expect(document.body.style.position).toBe('fixed');
    expect(outside.hasAttribute('inert')).toBe(true);

    triggerError();
    await Promise.resolve();
    expect(document.body.style.position).toBe('relative');
    expect(outside.hasAttribute('inert')).toBe(false);
    expect(document.activeElement).toBe(outside);

    const close = host.querySelector<HTMLButtonElement>('[data-xeg-error-action="close"]');
    close?.focus();
    close?.click();
    await Promise.resolve();
    expect(onClose).toHaveBeenCalledOnce();
    expect(host.querySelector('[data-xeg-error-boundary]')).toBeNull();
    expect(document.activeElement).toBe(outside);

    expect(scrollTo).toHaveBeenCalledTimes(2);
    restoreActiveGalleryHostState();
    expect(document.body.style.position).toBe('relative');
    expect(scrollTo).toHaveBeenCalledTimes(2);
    unmountGallery(host);
  });
});
