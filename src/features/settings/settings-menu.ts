import { logger } from '@shared/logging';
import { createElement, querySelector } from '@shared/dom';
import { getPreact } from '@shared/external/vendors';
import type { VNode } from '@shared/external/vendors';
import { getService } from '@shared/services/service-manager';
import { SERVICE_KEYS } from '@/constants';
import type { SettingsService } from './services/settings-service';

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

    if (modal) wireSettingsModal(modal);
    return;
  } catch {
    // Fallback DOM content
    const modal = document.createElement('div');
    modal.setAttribute('data-testid', 'xeg-settings-modal');
    modal.className = 'xeg-modal';
    modal.innerHTML = `
      <h3 class="xeg-modal-title">XEG 설정</h3>
      <section data-section="filename">
        <label>파일명 패턴</label>
        <select data-testid="filename-pattern">
          <option value="original">원본</option>
          <option value="tweet-id">유저명_트윗ID_인덱스</option>
          <option value="timestamp">타임스탬프</option>
          <option value="custom">사용자 지정</option>
        </select>
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
    `;
    root.appendChild(modal);

    wireSettingsModal(modal);
  }
}

function SettingsModal(): VNode {
  const { h } = getPreact();
  return h('div', { 'data-testid': 'xeg-settings-modal', className: 'xeg-modal' }, [
    h('h3', { className: 'xeg-modal-title' }, 'XEG 설정'),
    h('section', { 'data-section': 'filename' }, [
      h('label', {}, '파일명 패턴'),
      h('select', { 'data-testid': 'filename-pattern' }, [
        h('option', { value: 'original' }, '원본'),
        h('option', { value: 'tweet-id' }, '유저명_트윗ID_인덱스'),
        h('option', { value: 'timestamp' }, '타임스탬프'),
        h('option', { value: 'custom' }, '사용자 지정'),
      ]),
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
  ]) as unknown as VNode;
}

// test helper
let __lastRegistered: (() => void) | null = null;
export function __getLastRegisteredCallback(): (() => void) | null {
  return __lastRegistered;
}

export default { registerSettingsMenu, openSettingsModal };

// Internal: wire inputs to SettingsService
function wireSettingsModal(container: HTMLElement): void {
  try {
    const svc = getService<SettingsService>(SERVICE_KEYS.SETTINGS_MANAGER);

    const filename = container.querySelector(
      '[data-testid="filename-pattern"]'
    ) as HTMLSelectElement | null;
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
      filename.value = String(svc.get('download.filenamePattern' as const) ?? 'original');

    if (quality) quality.value = String(svc.get('download.imageQuality' as const) ?? 'original');
    if (autoZip) autoZip.checked = Boolean(svc.get('download.autoZip' as const));
    if (conc) conc.value = String(svc.get('download.maxConcurrentDownloads' as const) ?? 3);
    if (speed) speed.value = String(svc.get('gallery.autoScrollSpeed' as const) ?? 5);
    if (anim) anim.checked = Boolean(svc.get('gallery.animations' as const));

    // 변경 핸들러 바인딩
    filename?.addEventListener('change', e => {
      const v = (e.currentTarget as HTMLSelectElement).value;
      void svc.set('download.filenamePattern' as const, v);
    });
    quality?.addEventListener('change', e => {
      const v = (e.currentTarget as HTMLSelectElement).value;
      void svc.set('download.imageQuality' as const, v);
    });
    autoZip?.addEventListener('change', e => {
      const v = (e.currentTarget as HTMLInputElement).checked;
      void svc.set('download.autoZip' as const, v);
    });
    conc?.addEventListener('change', e => {
      const vStr = (e.currentTarget as HTMLInputElement).value;
      const v = parseInt(vStr, 10);
      void svc.set('download.maxConcurrentDownloads' as const, v);
    });
    speed?.addEventListener('change', e => {
      const vStr = (e.currentTarget as HTMLInputElement).value;
      const v = parseInt(vStr, 10);
      void svc.set('gallery.autoScrollSpeed' as const, v);
    });
    anim?.addEventListener('change', e => {
      const v = (e.currentTarget as HTMLInputElement).checked;
      void svc.set('gallery.animations' as const, v);
    });
  } catch (error) {
    logger.warn('Settings modal wiring 실패:', error);
  }
}
