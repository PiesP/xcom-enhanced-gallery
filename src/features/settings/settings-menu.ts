import { logger } from '@shared/logging';
import { createElement, querySelector } from '@shared/dom';
import { getPreact } from '@shared/external/vendors';
import type { VNode, PreactAPI } from '@shared/external/vendors';
import { getService } from '@shared/services/service-manager';
import { showSuccess } from '@shared/services/toast-integration';
import { SERVICE_KEYS } from '@/constants';
import type { SettingsService } from './services/settings-service';
import { galleryState } from '@shared/state/signals/gallery.signals';

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

    // [추가] 커스텀 템플릿 입력 핸들러 (검증 + 저장)
    customInput?.addEventListener('input', e => {
      const v = (e.currentTarget as HTMLInputElement).value;
      const valid = isValidCustomTemplate(v);
      (e.currentTarget as HTMLInputElement).setAttribute('aria-invalid', String(!valid));
    });
    customInput?.addEventListener('change', e => {
      const v = (e.currentTarget as HTMLInputElement).value;
      if (!isValidCustomTemplate(v)) return;
      void svc.set('download.customTemplate' as const, v).then(() => notifySaved());
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

// 최소 표시 스타일 적용: 갤러리 오버레이 위에 뜨도록 보장
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

    // 가독성 - 디자인 토큰 사용
    style.background = 'var(--xeg-glass-bg-dark, #1f1f1f)';
    style.color = 'var(--xeg-color-text-primary, #fff)';
    style.padding = 'var(--xeg-spacing-md, 16px)';
    style.borderRadius = 'var(--xeg-radius-lg, 8px)';
    style.boxShadow = 'var(--xeg-glass-shadow-strong, 0 10px 30px rgba(0,0,0,.35))';

    // 포커스 가능
    if (!modal.hasAttribute('tabindex')) {
      modal.setAttribute('tabindex', '-1');
    }
  } catch {
    // ignore styling errors (test env)
  }
}

// UX: ESC 닫기, 포커스 트랩, 초기 포커싱
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

  // 키보드 처리: ESC 닫기 + Tab 포커스 트랩
  const onKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      closeModal(root, preactRender);
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

  // 정리: 닫힐 때 리스너 제거
  const cleanup = () => {
    modal.removeEventListener('keydown', onKeyDown);
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

// 저장 성공 토스트: 과도한 알림 방지를 위해 디바운스
function createDebouncedSaveNotifier(delay = 600): () => void {
  let t: ReturnType<typeof setTimeout> | null = null;
  return () => {
    if (t) {
      clearTimeout(t);
    }
    t = setTimeout(() => {
      showSuccess('설정이 저장됨', '변경 사항이 저장되었습니다.', 1500);
      t = null;
    }, delay);
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
