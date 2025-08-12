import { getPreact, getPreactHooks } from '@shared/external/vendors';
import { wireSettingsModal } from '@/features/settings/settings-menu';
import { themeService, type Theme } from '@shared/services/theme-service';
import { ToolbarButton } from '@shared/components/ui/Toolbar/components/ToolbarButton';
import styles from './SettingsOverlay.module.css';

export interface SettingsOverlayProps {
  onClose?: () => void;
}

export function SettingsOverlay({ onClose }: SettingsOverlayProps) {
  const { h } = getPreact();
  const { useEffect, useRef, useState } = getPreactHooks();
  const ref = useRef<HTMLDivElement | null>(null);

  // [추가] 테마 상태 추적
  const [currentTheme, setCurrentTheme] = useState<Theme>(themeService.getCurrentTheme());

  useEffect(() => {
    const node = ref.current;
    if (node) {
      // CSS 모듈 사용: 스타일은 클래스에서 관리
      wireSettingsModal(node);

      // [추가] 테마 변경 시 data-theme 속성 업데이트
      node.setAttribute('data-theme', currentTheme);

      // Initial focus
      setTimeout(() => {
        const focusables = getFocusableElements(node);
        if (focusables.length > 0) (focusables[0] as HTMLElement).focus();
        else node.focus();
      }, 0);
      // ESC close + focus trap
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          if (onClose) onClose();
          return;
        }
        if (e.key === 'Tab') {
          const els = getFocusableElements(node);
          if (els.length === 0) return;
          const first = els[0] as HTMLElement;
          const last = els[els.length - 1] as HTMLElement;
          const active = document.activeElement as HTMLElement | null;
          if (e.shiftKey) {
            if (active === first || !node.contains(active)) {
              e.preventDefault();
              last.focus();
            }
          } else {
            if (active === last || !node.contains(active)) {
              e.preventDefault();
              first.focus();
            }
          }
        }
      };
      node.addEventListener('keydown', onKeyDown);

      // [추가] 테마 변경 감지 및 업데이트
      const themeObserver = (theme: Theme) => {
        setCurrentTheme(theme);
        if (node) {
          node.setAttribute('data-theme', theme);
        }
      };

      themeService.addObserver(themeObserver);

      return () => {
        node.removeEventListener('keydown', onKeyDown);
        themeService.removeObserver(themeObserver);
      };
    }
    return () => {
      // nothing specific; host unmount will remove element
      if (onClose) onClose();
    };
  }, [currentTheme]); // [수정] currentTheme을 의존성으로 추가

  return h(
    'div',
    {
      ref,
      'data-testid': 'xeg-settings-modal',
      className: styles.modalOverlay,
      'data-theme': currentTheme, // [추가] 테마 속성 추가
      tabindex: -1,
      onClick: (e: MouseEvent) => {
        if (e.target === e.currentTarget) onClose?.();
      },
    },
    h('div', { className: styles.modalContent, role: 'dialog', 'aria-modal': 'true' }, [
      h('div', { className: styles.modalHeader }, [
        h('h3', { className: styles.modalTitle }, 'XEG 설정'),
        h(ToolbarButton, {
          icon: 'x',
          variant: 'ghost',
          size: 'sm',
          'aria-label': '닫기',
          onClick: () => onClose?.(),
          'data-testid': 'settings-close-button',
          iconSize: 22,
          context: 'settings-close',
        }),
      ]),
      h('div', { className: styles.modalBody }, [
        // 다운로드 섹션
        h('h4', { className: styles.sectionTitle }, '다운로드 설정'),
        h('div', { className: styles.settingRow }, [
          h('label', { for: 'xeg-filename-pattern' }, '파일명 패턴'),
          h('select', { id: 'xeg-filename-pattern', 'data-testid': 'filename-pattern' }, [
            h('option', { value: 'tweet-id' }, '유저명_트윗ID_인덱스'),
            h('option', { value: 'original' }, '원본 파일명'),
            h('option', { value: 'timestamp' }, '타임스탬프'),
            h('option', { value: 'custom' }, '사용자 지정'),
          ]),
        ]),
        // [추가] 사용자 지정 입력 필드
        h(
          'div',
          {
            className: `${styles.settingRow} ${styles.customTemplateRow}`,
            'data-testid': 'custom-template-row',
          },
          [
            h('label', { for: 'xeg-custom-template' }, '사용자 지정 패턴'),
            h('div', { className: styles.customTemplateInputWrapper }, [
              h('input', {
                id: 'xeg-custom-template',
                type: 'text',
                placeholder: '{user}_{tweetId}_{index}',
                'data-testid': 'custom-template',
                inputmode: 'text' as unknown as string,
                autocomplete: 'off' as unknown as string,
                spellcheck: false as unknown as boolean,
              }),
              // [추가] 토큰 헬퍼
              h('div', { className: styles.tokenHelpers, 'data-testid': 'token-helpers' }, [
                h('button', { 'data-token': 'user' }, '유저명'),
                h('button', { 'data-token': 'tweetId' }, '트윗ID'),
                h('button', { 'data-token': 'index' }, '인덱스'),
                h('button', { 'data-token': 'ext' }, '확장자'),
              ]),
            ]),
          ]
        ),
        h('div', { className: styles.settingRow }, [
          h('label', { for: 'xeg-image-quality' }, '이미지 품질'),
          h('select', { id: 'xeg-image-quality', 'data-testid': 'image-quality' }, [
            h('option', { value: 'original' }, 'Original'),
            h('option', { value: 'large' }, 'Large'),
          ]),
        ]),
        h('div', { className: styles.settingRow }, [
          h('label', { for: 'xeg-concurrency' }, '동시 다운로드 수'),
          h('input', {
            id: 'xeg-concurrency',
            type: 'number',
            min: 1,
            max: 20,
            'data-testid': 'concurrency',
          }),
        ]),
        h('div', { className: styles.settingRow }, [
          h('label', { for: 'xeg-auto-zip' }, '여러 파일 자동 압축'),
          h('input', { id: 'xeg-auto-zip', type: 'checkbox', 'data-testid': 'auto-zip' }),
        ]),
        // 갤러리 섹션
        h('h4', { className: styles.sectionTitle }, '갤러리 설정'),
        // [추가] 테마 설정
        h('div', { className: styles.settingRow }, [
          h('label', { for: 'xeg-theme' }, '테마'),
          h('select', { id: 'xeg-theme', 'data-testid': 'theme' }, [
            h('option', { value: 'light' }, '라이트'),
            h('option', { value: 'dark' }, '다크'),
            h('option', { value: 'auto' }, '자동'),
          ]),
        ]),
        h('div', { className: styles.settingRow }, [
          h('label', { for: 'xeg-auto-scroll-speed' }, '자동 스크롤 속도'),
          h('input', {
            id: 'xeg-auto-scroll-speed',
            type: 'range',
            min: 1,
            max: 10,
            'data-testid': 'auto-scroll-speed',
          }),
        ]),
        h('div', { className: styles.settingRow }, [
          h('label', { for: 'xeg-animations' }, '애니메이션 효과'),
          h('input', { id: 'xeg-animations', type: 'checkbox', 'data-testid': 'animations' }),
        ]),
      ]),
    ])
  );
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
