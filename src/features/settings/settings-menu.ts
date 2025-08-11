import { logger } from '@shared/logging';
import { createElement, querySelector } from '@shared/dom';
import { getPreact } from '@shared/external/vendors';
import type { VNode, PreactAPI } from '@shared/external/vendors';
import { getService } from '@shared/services/service-manager';
import { showSuccess } from '@shared/services/toast-integration';
import { SERVICE_KEYS, TIMING } from '@/constants';
import type { SettingsService } from './services/settings-service';
import { galleryState } from '@shared/state/signals/gallery.signals';
import { themeService } from '@shared/services/theme-service';
import type { Theme } from '@shared/services/theme-service';

// Lightweight modal for settings using Preact via getters
export function registerSettingsMenu(): void {
  try {
    interface UserscriptGlobal {
      GM_registerMenuCommand?: (name: string, fn: () => void, accessKey?: string) => number;
    }
    const g = globalThis as unknown as UserscriptGlobal;
    if ('GM_registerMenuCommand' in g && typeof g.GM_registerMenuCommand === 'function') {
      const cb = () => openSettingsModal();
      // expose last callback for tests
      __lastRegistered = cb;
      g.GM_registerMenuCommand('XEG 설정', cb);
      logger.debug('Settings menu registered');
    }
  } catch (e) {
    logger.warn('GM_registerMenuCommand not available:', e);
  }
}

export function openSettingsModal(): void {
  const rootId = 'xeg-settings-modal-root';
  let root = querySelector(`#${rootId}`) as HTMLElement | null;
  if (!root) {
    root = createElement('div');
    root.id = rootId;
    root.setAttribute('data-xeg-role', 'modal');
    document.body.appendChild(root);
  }
  // Prefer Preact render; fallback to simple DOM for test env
  try {
    const { h, render } = getPreact();
    render(h(SettingsModal, {}), root);
    // wire after render
    const modal = root.querySelector('[data-testid="xeg-settings-modal"]') as HTMLElement | null;

    if (modal) {
      applyBasicModalStyles(modal);
      // 갤러리 종료 시 모달 자동 정리
      const initialOpen = getInitialGalleryOpenState();
      const unsubscribe = galleryState.subscribe(state => {
        try {
          if (initialOpen && state && state.isOpen === false) {
            closeModal(root, render);
          }
        } catch {
          // ignore
        }
      });
      setupModalUX(modal, root, render, () => unsubscribe?.());
      wireSettingsModal(modal);
    }
    return;
  } catch (error) {
    logger.error('SettingsModal Preact 렌더링 실패:', error);
    // Fallback DOM content
    const modal = document.createElement('div');
    modal.setAttribute('data-testid', 'xeg-settings-modal');
    modal.className = 'xeg-modal';
    modal.setAttribute('tabindex', '-1');
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.innerHTML = `
      <div class="xeg-modal-header">
        <h3 class="xeg-modal-title">XEG 설정</h3>
        <button class="xeg-modal-close-button" data-testid="modal-close-button" aria-label="설정 닫기" title="설정 닫기" type="button">×</button>
      </div>
      <div class="xeg-modal-body">
        <section data-section="filename">
          <label>파일명 패턴</label>
          <select data-testid="filename-pattern">
            <option value="original">원본</option>
            <option value="tweet-id">유저명_트윗ID_인덱스</option>
            <option value="timestamp">타임스탬프</option>
            <option value="custom">사용자 지정</option>
          </select>
          <div data-testid="custom-template-row" style="display:none; gap: 8px; align-items: center; margin-top: 8px;">
            <label>사용자 지정 패턴</label>
            <input type="text" data-testid="custom-template" placeholder="예: {user}_{tweetId}_{index}.{ext}" spellcheck="false" autocomplete="off" />
            <div data-testid="template-preview" style="margin-top: 8px; font-family: monospace; font-size: 12px; padding: 8px; background: var(--xeg-color-surface-inset); border-radius: 4px; border: 1px solid var(--xeg-color-border-secondary);">
              <div style="color: var(--xeg-color-text-tertiary); margin-bottom: 4px;">미리보기:</div>
              <div data-testid="preview-output" style="color: var(--xeg-color-success);">x_com_123456789_1.jpg</div>
            </div>
          </div>
        </section>
        <section data-section="download">
          <label>이미지 품질</label>
          <select data-testid="image-quality">
            <option value="original">Original</option>
            <option value="large">Large</option>
            <option value="medium">Medium</option>
            <option value="small">Small</option>
          </select>
          <label>자동 압축</label>
          <input type="checkbox" data-testid="auto-zip" />
          <label>동시 다운로드 수</label>
          <input type="number" min="1" max="20" data-testid="concurrency" />
        </section>
        <section data-section="gallery">
          <label>테마</label>
          <select data-testid="theme">
            <option value="auto">자동 (시스템)</option>
            <option value="light">라이트 모드</option>
            <option value="dark">다크 모드</option>
          </select>
          <label>자동 스크롤 속도</label>
          <input type="range" min="1" max="10" data-testid="auto-scroll-speed" />
          <label>애니메이션 효과</label>
          <input type="checkbox" data-testid="animations" />
        </section>
      </div>
    `;
    root.appendChild(modal);

    applyBasicModalStyles(modal);

    // 갤러리 종료 시 모달 자동 정리
    const initialOpen = getInitialGalleryOpenState();
    const unsubscribe = galleryState.subscribe(state => {
      try {
        if (initialOpen && state && state.isOpen === false) {
          closeModal(root);
        }
      } catch {
        // ignore
      }
    });

    setupModalUX(modal, root, undefined, () => unsubscribe?.());
    wireSettingsModal(modal);
  }
}

function SettingsModal(): VNode {
  const { h } = getPreact();
  return h(
    'div',
    {
      'data-testid': 'xeg-settings-modal',
      className: 'xeg-modal',
      tabindex: -1,
      role: 'dialog',
      'aria-modal': 'true',
    },
    [
      h('div', { className: 'xeg-modal-header' }, [
        h('h3', { className: 'xeg-modal-title' }, 'XEG 설정'),
        h(
          'button',
          {
            className: 'xeg-modal-close-button',
            'data-testid': 'modal-close-button',
            onClick: (e: Event) => {
              e.preventDefault();
              e.stopPropagation();
              // closeModal은 setupModalUX에서 설정된 이벤트를 통해 호출됨
              const modal = (e.target as HTMLElement).closest('[data-testid="xeg-settings-modal"]');
              if (modal) {
                modal.dispatchEvent(new CustomEvent('xeg-modal-close'));
              }
            },
            'aria-label': '설정 닫기',
            title: '설정 닫기',
            type: 'button',
          },
          '×'
        ),
      ]),
      h('div', { className: 'xeg-modal-body' }, [
        h('section', { 'data-section': 'filename' }, [
          h('label', {}, '파일명 패턴'),
          h('select', { 'data-testid': 'filename-pattern' }, [
            h('option', { value: 'original' }, '원본'),
            h('option', { value: 'tweet-id' }, '유저명_트윗ID_인덱스'),
            h('option', { value: 'timestamp' }, '타임스탬프'),
            h('option', { value: 'custom' }, '사용자 지정'),
          ]),
          h(
            'div',
            {
              'data-testid': 'custom-template-row',
              style: 'display:none; gap: 8px; align-items: center; margin-top: 8px;',
            },
            [
              h('label', {}, '사용자 지정 패턴'),
              h('input', {
                type: 'text',
                'data-testid': 'custom-template',
                placeholder: '예: {user}_{tweetId}_{index}.{ext}',
                spellcheck: false,
                autocomplete: 'off',
              }),
            ]
          ),
        ]),
        h('section', { 'data-section': 'download' }, [
          h('label', {}, '이미지 품질'),
          h('select', { 'data-testid': 'image-quality' }, [
            h('option', { value: 'original' }, 'Original'),
            h('option', { value: 'large' }, 'Large'),
            h('option', { value: 'medium' }, 'Medium'),
            h('option', { value: 'small' }, 'Small'),
          ]),
          h('label', {}, '자동 압축'),
          h('input', { type: 'checkbox', 'data-testid': 'auto-zip' }),
          h('label', {}, '동시 다운로드 수'),
          h('input', { type: 'number', min: 1, max: 20, 'data-testid': 'concurrency' }),
        ]),
        h('section', { 'data-section': 'gallery' }, [
          h('label', {}, '테마'),
          h('select', { 'data-testid': 'theme' }, [
            h('option', { value: 'auto' }, '자동 (시스템)'),
            h('option', { value: 'light' }, '라이트 모드'),
            h('option', { value: 'dark' }, '다크 모드'),
          ]),
          h('label', {}, '자동 스크롤 속도'),
          h('input', { type: 'range', min: 1, max: 10, 'data-testid': 'auto-scroll-speed' }),
          h('label', {}, '애니메이션 효과'),
          h('input', { type: 'checkbox', 'data-testid': 'animations' }),
        ]),
      ]),
    ]
  ) as unknown as VNode;
}

// test helper
let __lastRegistered: (() => void) | null = null;
export function __getLastRegisteredCallback(): (() => void) | null {
  return __lastRegistered;
}

export default { registerSettingsMenu, openSettingsModal };

// Internal: wire inputs to SettingsService
export function wireSettingsModal(container: HTMLElement): void {
  try {
    const svc = getService<SettingsService>(SERVICE_KEYS.SETTINGS_MANAGER);

    // 요소 선택
    const filename = container.querySelector(
      '[data-testid="filename-pattern"]'
    ) as HTMLSelectElement | null;
    const customRow = container.querySelector(
      '[data-testid="custom-template-row"]'
    ) as HTMLElement | null;
    const customInput = container.querySelector(
      '[data-testid="custom-template"]'
    ) as HTMLInputElement | null;
    const tokenHelpers = container.querySelector(
      '[data-testid="token-helpers"]'
    ) as HTMLElement | null;
    const quality = container.querySelector(
      '[data-testid="image-quality"]'
    ) as HTMLSelectElement | null;
    const autoZip = container.querySelector('[data-testid="auto-zip"]') as HTMLInputElement | null;
    const conc = container.querySelector('[data-testid="concurrency"]') as HTMLInputElement | null;
    const speed = container.querySelector(
      '[data-testid="auto-scroll-speed"]'
    ) as HTMLInputElement | null;
    const anim = container.querySelector('[data-testid="animations"]') as HTMLInputElement | null;

    // 초기 값 로드
    if (filename)
      filename.value = String(svc.get('download.filenamePattern' as const) ?? 'tweet-id');
    if (customInput) customInput.value = String(svc.get('download.customTemplate' as const) ?? '');
    // [수정] 동적 표시 로직
    if (customRow) customRow.style.display = filename?.value === 'custom' ? 'flex' : 'none';

    if (quality) quality.value = String(svc.get('download.imageQuality' as const) ?? 'original');
    if (autoZip) autoZip.checked = Boolean(svc.get('download.autoZip' as const));
    if (conc) conc.value = String(svc.get('download.maxConcurrentDownloads' as const) ?? 4);
    if (speed) speed.value = String(svc.get('gallery.autoScrollSpeed' as const) ?? 5);
    if (anim) anim.checked = Boolean(svc.get('gallery.animations' as const));

    // [추가] 테마 설정 초기 값 로드
    const theme = container.querySelector('[data-testid="theme"]') as HTMLSelectElement | null;
    if (theme) {
      theme.value = String(svc.get('gallery.theme' as const) ?? 'auto');
      // 현재 테마 스타일도 적용
      applyThemeStyle(theme.value);
    }

    // 변경 핸들러 바인딩
    const notifySaved = createDebouncedSaveNotifier();

    filename?.addEventListener('change', e => {
      const v = (e.currentTarget as HTMLSelectElement).value;
      void svc.set('download.filenamePattern' as const, v).then(() => notifySaved());
      // [수정] 동적 표시 로직
      if (customRow) customRow.style.display = v === 'custom' ? 'flex' : 'none';
      if (v === 'custom' && customInput) {
        setTimeout(() => customInput.focus(), 0);
      }
    });

    // [추가] 커스텀 템플릿 입력 핸들러 (검증 + 저장 + 실시간 미리보기)
    customInput?.addEventListener('input', e => {
      const val = (e.currentTarget as HTMLInputElement).value;
      const isValid = isValidCustomTemplate(val);
      (e.currentTarget as HTMLInputElement).setAttribute('aria-invalid', String(!isValid));

      // 실시간 미리보기 업데이트
      updateTemplatePreview(val, isValid);

      // 유효한 템플릿인 경우에만 저장
      if (isValid || val.trim() === '') {
        void svc.set('download.customTemplate' as const, val).then(() => notifySaved());
      }
    });

    // [추가] 테마 변경 핸들러
    theme?.addEventListener('change', e => {
      const v = (e.currentTarget as HTMLSelectElement).value;
      void svc.set('gallery.theme' as const, v).then(() => {
        notifySaved();
        // 테마 변경 즉시 적용
        applyThemeStyle(v);
      });
    });

    // [추가] 토큰 헬퍼 클릭 이벤트
    tokenHelpers?.addEventListener('click', e => {
      const target = e.target as HTMLElement;
      if (target.dataset.token && customInput) {
        const { selectionStart, selectionEnd, value } = customInput;
        const token = `{${target.dataset.token}}`;
        customInput.value =
          value.slice(0, selectionStart ?? 0) + token + value.slice(selectionEnd ?? 0);
        customInput.focus();
        customInput.selectionStart = (selectionStart ?? 0) + token.length;
        customInput.selectionEnd = customInput.selectionStart;
      }
    });
    quality?.addEventListener('change', e => {
      const v = (e.currentTarget as HTMLSelectElement).value;
      void svc.set('download.imageQuality' as const, v).then(() => notifySaved());
    });
    autoZip?.addEventListener('change', e => {
      const v = (e.currentTarget as HTMLInputElement).checked;
      void svc.set('download.autoZip' as const, v).then(() => notifySaved());
    });
    conc?.addEventListener('change', e => {
      const vStr = (e.currentTarget as HTMLInputElement).value;
      const v = parseInt(vStr, 10);
      void svc.set('download.maxConcurrentDownloads' as const, v).then(() => notifySaved());
    });
    speed?.addEventListener('change', e => {
      const vStr = (e.currentTarget as HTMLInputElement).value;
      const v = parseInt(vStr, 10);
      void svc.set('gallery.autoScrollSpeed' as const, v).then(() => notifySaved());
    });
    anim?.addEventListener('change', e => {
      const v = (e.currentTarget as HTMLInputElement).checked;
      void svc.set('gallery.animations' as const, v).then(() => notifySaved());
    });
  } catch (error) {
    logger.warn('Settings modal wiring 실패:', error);
  }
}

// 현재 테마 가져오기
function getCurrentTheme(): Theme {
  try {
    return themeService.getCurrentTheme();
  } catch {
    // fallback: DOM에서 직접 읽기
    return (document.documentElement.getAttribute('data-theme') as Theme) || 'light';
  }
}

// 테마에 따른 동적 스타일 적용
function applyThemeBasedStyles(style: CSSStyleDeclaration, theme: Theme, modal: HTMLElement): void {
  if (theme === 'dark') {
    style.background = 'var(--xeg-glass-bg-dark, rgba(21, 32, 43, 0.95))';
    style.color = 'var(--xeg-color-text-primary, rgba(255, 255, 255, 0.9))';
  } else {
    style.background = 'var(--xeg-glass-bg-light, rgba(255, 255, 255, 0.95))';
    style.color = 'var(--xeg-color-text-primary, rgba(0, 0, 0, 0.9))';
  }

  // 내부 요소들에도 테마 속성 적용
  if (modal) {
    modal.setAttribute('data-theme', theme);

    // 헤더와 바디에도 테마 클래스 적용
    const header = modal.querySelector('.xeg-modal-header') as HTMLElement;
    const body = modal.querySelector('.xeg-modal-body') as HTMLElement;
    const closeButton = modal.querySelector('.xeg-modal-close-button') as HTMLElement;

    if (header) {
      header.setAttribute('data-theme', theme);
    }
    if (body) {
      body.setAttribute('data-theme', theme);
    }
    if (closeButton) {
      closeButton.setAttribute('data-theme', theme);
      // CSS 클래스 기반 스타일링으로 변경 - inline 스타일 최소화
      closeButton.classList.add('xeg-enhanced-close-button');
    }
  }
}

// 테마 변경 감지 및 자동 업데이트
function setupThemeChangeListener(modal: HTMLElement): void {
  // ThemeService 관찰자 등록
  const onThemeChange = (newTheme: Theme) => {
    applyThemeBasedStyles(modal.style, newTheme, modal);
  };

  try {
    themeService.addObserver(onThemeChange);

    // 모달이 제거될 때 관찰자도 제거
    const observer = new MutationObserver(() => {
      if (!document.body.contains(modal)) {
        themeService.removeObserver(onThemeChange);
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  } catch (error) {
    logger.warn('테마 변경 리스너 설정 실패:', error);
  }
}

// 최소 표시 스타일 적용: 갤러리 오버레이 위에 뜨도록 보장 + 테마 시스템 연동
export function applyBasicModalStyles(modal: HTMLElement): void {
  try {
    const style = modal.style;
    // 위치 및 레이어
    style.position = 'fixed';
    style.top = '20%';
    style.left = '50%';
    style.transform = 'translateX(-50%)';
    style.maxWidth = 'min(520px, 90vw)';
    style.width = '90vw';
    // CSS 변수 없을 때도 안전하게 최상위로 표시되도록 fallback 지정
    style.zIndex = 'var(--xeg-z-modal-content, 2147483647)';
    // 가시성 보장
    style.display = 'block';
    style.visibility = 'visible';
    style.pointerEvents = 'auto';

    // 테마 시스템 연동: 현재 테마에 따른 동적 스타일 적용
    const currentTheme = getCurrentTheme();
    applyThemeBasedStyles(style, currentTheme, modal);

    // 모달 컨테이너 기본 스타일
    style.borderRadius = 'var(--xeg-radius-lg, 8px)';
    style.boxShadow = 'var(--xeg-glass-shadow-strong, 0 10px 30px rgba(0,0,0,.35))';
    style.backdropFilter = 'var(--xeg-glass-blur-medium, blur(16px))';
    style.border = '1px solid var(--xeg-border-light, rgba(255, 255, 255, 0.1))';

    // 포커스 가능
    if (!modal.hasAttribute('tabindex')) {
      modal.setAttribute('tabindex', '-1');
    }

    // 테마 변경 감지 및 자동 업데이트
    setupThemeChangeListener(modal);
  } catch {
    // ignore styling errors (test env)
  }
}

// UX: ESC 닫기, 포커스 트랩, 초기 포커싱, 닫기 버튼, 배경 클릭
function setupModalUX(
  modal: HTMLElement,
  root: HTMLElement,
  preactRender?: PreactAPI['render'],
  onCleanup?: () => void
): void {
  // 초기 포커스
  setTimeout(() => {
    const focusable = getFocusableElements(modal);
    if (focusable.length > 0) {
      (focusable[0] as HTMLElement).focus();
    } else {
      modal.focus();
    }
  }, 0);

  // 모달 닫기 함수
  const closeModalHandler = () => {
    closeModal(root, preactRender);
  };

  // 키보드 처리: ESC 닫기 + Tab 포커스 트랩
  const onKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      closeModalHandler();
      return;
    }
    if (e.key === 'Tab') {
      const focusable = getFocusableElements(modal);
      if (focusable.length === 0) return;
      const first = focusable[0] as HTMLElement;
      const last = focusable[focusable.length - 1] as HTMLElement;
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey) {
        if (active === first || !modal.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (active === last || !modal.contains(active)) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  };
  modal.addEventListener('keydown', onKeyDown);

  // 닫기 버튼 이벤트 처리
  const onCloseButtonClick = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    closeModalHandler();
  };
  modal.addEventListener('xeg-modal-close', onCloseButtonClick);

  // 배경 클릭으로 닫기 (모달 바깥 영역 클릭)
  const onBackgroundClick = (e: Event) => {
    // 클릭한 요소가 모달 내부가 아니면 모달을 닫음
    if (e.target === root || !modal.contains(e.target as Node)) {
      closeModalHandler();
    }
  };
  // root에 클릭 이벤트 추가 (배경 클릭 감지)
  root.addEventListener('click', onBackgroundClick);

  // 정리: 닫힐 때 리스너 제거
  const cleanup = () => {
    modal.removeEventListener('keydown', onKeyDown);
    modal.removeEventListener('xeg-modal-close', onCloseButtonClick);
    root.removeEventListener('click', onBackgroundClick);
    try {
      if (onCleanup) onCleanup();
    } catch {
      // ignore
    }
  };
  // MutationObserver로 root 제거 감지하여 cleanup
  const observer = new MutationObserver(() => {
    if (!document.body.contains(root)) {
      cleanup();
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

function getFocusableElements(scope: HTMLElement): Element[] {
  const selectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ];
  const list = Array.from(scope.querySelectorAll(selectors.join(',')));
  return list.filter(el => {
    const style = window.getComputedStyle(el as HTMLElement);
    return style.display !== 'none' && style.visibility !== 'hidden';
  });
}

function closeModal(root: HTMLElement, preactRender?: PreactAPI['render']): void {
  try {
    if (preactRender) {
      // Preact 언마운트
      preactRender(null, root);
    }
  } catch {
    // ignore
  }
  if (root.parentElement) {
    root.parentElement.removeChild(root);
  } else {
    root.remove();
  }
}

// 안전한 갤러리 초기 상태 조회 (에러 보호)
function getInitialGalleryOpenState(): boolean {
  try {
    // 동기 접근이므로 예외만 차단
    return !!(galleryState?.value as { isOpen?: boolean } | undefined)?.isOpen;
  } catch {
    return false;
  }
}

// 저장 성공 토스트: 과도한 알림 방지를 위해 디바운스 + 시각적 피드백 개선
function createDebouncedSaveNotifier(delay = TIMING.DEBOUNCED_SAVE_DELAY): () => void {
  let t: ReturnType<typeof setTimeout> | null = null;
  let isShowing = false;

  return () => {
    if (t) {
      clearTimeout(t);
    }

    // 연속된 변경에 대해서는 더 짧은 딜레이로 피드백
    const actualDelay = isShowing ? 100 : delay;

    t = setTimeout(() => {
      // 더 간결하고 비침습적인 피드백
      showSuccess('저장됨', '설정이 자동 저장되었습니다', 1200);
      isShowing = true;
      t = null;

      // 3초 후 피드백 상태 리셋 (다음 저장시 일반 딜레이 사용)
      setTimeout(() => {
        isShowing = false;
      }, 3000);
    }, actualDelay);
  };
}

// 간단한 커스텀 템플릿 유효성 검사: 필수 토큰 중 하나라도 포함하고, 금지 문자가 없는지 확인
function isValidCustomTemplate(tpl: string): boolean {
  if (!tpl || typeof tpl !== 'string') return false;
  const s = tpl.trim();
  if (s.length < 3 || s.length > 120) return false;
  // 허용 토큰: {user}, {tweetId}, {index}, {ext}, {mediaId}
  const hasToken = /\{(user|tweetId|index|ext|mediaId)\}/.test(s);
  if (!hasToken) return false;
  // 파일명 금지 문자 제외
  if (/[\\/:*?"<>|]/.test(s)) return false;
  return true;
}

// 템플릿 미리보기 업데이트 함수
function updateTemplatePreview(template: string, isValid: boolean): void {
  const previewOutput = document.querySelector('[data-testid="preview-output"]') as HTMLElement;
  if (!previewOutput) return;

  if (!template.trim()) {
    previewOutput.textContent = '패턴을 입력해주세요';
    previewOutput.style.color = 'var(--xeg-color-text-tertiary)';
    return;
  }

  if (!isValid) {
    previewOutput.textContent = '유효하지 않은 패턴입니다';
    previewOutput.style.color = 'var(--xeg-color-error)';
    return;
  }

  // 예시 데이터로 템플릿 변환
  const sampleData = {
    user: 'x_com',
    tweetId: '123456789',
    index: '1',
    ext: 'jpg',
    mediaId: 'abc123',
  };

  let preview = template;
  Object.entries(sampleData).forEach(([key, value]) => {
    const regex = new RegExp(`\\{${key}\\}`, 'g');
    preview = preview.replace(regex, value);
  });

  // 확장자가 없으면 자동으로 추가
  if (!preview.includes('.')) {
    preview += '.jpg';
  }

  previewOutput.textContent = preview;
  previewOutput.style.color = 'var(--xeg-color-success)';
}

// 테마 스타일 적용 함수 - ThemeService와 연동
function applyThemeStyle(theme: string): void {
  try {
    // 유효한 테마 값 검증 (native 테마 제거)
    const validThemes = ['auto', 'light', 'dark'];
    if (!validThemes.includes(theme)) {
      logger.warn(`잘못된 테마 값: ${theme}, 기본값(auto) 사용`);
      theme = 'auto';
    }

    // ThemeService에 테마 설정
    themeService.setTheme(theme as Theme);

    logger.debug(`테마 변경 완료: ${theme} (현재 적용된 테마: ${themeService.getCurrentTheme()})`);
  } catch (error) {
    logger.error('테마 적용 실패:', error);

    // Fallback: 직접 DOM 조작
    const documentElement = document.documentElement;

    // 기존 테마 스타일 속성 제거 (네이티브 스타일 속성도 제거)
    documentElement.removeAttribute('data-theme-style');
    documentElement.removeAttribute('data-theme');

    // 네이티브 테마 fallback 제거, auto/light/dark만 지원
    if (theme === 'dark') {
      documentElement.setAttribute('data-theme', 'dark');
      logger.debug('다크 테마 fallback 적용됨');
    } else if (theme === 'auto') {
      // auto 모드는 시스템 테마에 따라 결정
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
      logger.debug(`자동 테마 fallback 적용됨: ${prefersDark ? 'dark' : 'light'}`);
    } else {
      documentElement.setAttribute('data-theme', 'light');
      logger.debug('라이트 테마 fallback 적용됨');
    }
  }
}
