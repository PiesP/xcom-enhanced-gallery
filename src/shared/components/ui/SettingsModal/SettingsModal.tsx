/**
 * @fileoverview 설정 패널 (재작성)
 * @description 비정상적이던 기존 모달 레이아웃/백드롭을 제거하고, 툴바 디자인 요소(toolbarButton, glass-surface)를 그대로 재사용하는 경량 패널.
 * - 새로운 시각 요소 도입 금지: Toolbar CSS 클래스 재사용
 * - 단순 포지셔닝: 기본(top 고정 후 Toolbar 아래) / top-right 지원
 */

import { getPreact, getPreactHooks, type VNode } from '../../../external/vendors';
// Phase21: 디자인 토큰 직접 포함 (테스트 환경 단독 렌더 시 변수 누락 방지)
// NOTE: design-tokens.css 는 글로벌 진입점(main.ts)에서 1회 주입됨. 테스트 안정성을 위해
// 별도 import 를 제거 (Vite 경로 해석 이슈 방지) - Phase21.
import { ComponentStandards } from '../StandardProps';
import { X } from '../Icon';
import { LanguageService } from '../../../services/LanguageService';
import { ThemeService } from '../../../services/ThemeService';
// Toolbar 스타일 재사용 (버튼 등)
import toolbarStyles from '../Toolbar/Toolbar.module.css';
import styles from './SettingsModal.module.css';
import {
  evaluateModalSurfaceModeDetailed,
  getTestSampleColors,
  getTestForcedMode,
  type ModalSurfaceMode,
} from '@shared/styles/modal-surface-evaluator';
import {
  collectBackgroundSamplesV2,
  escalateTiersUntilContrast,
} from '@shared/styles/modal-surface-escalation';

// Surface mode preference key
const SURFACE_MODE_STORAGE_KEY = 'xeg-surface-mode';
type SurfaceModePreference = 'auto' | 'glass' | 'solid';

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** (호환) 패널 위치 - 구 레거시 명칭 center/bottom-sheet 지원 */
  position?: 'toolbar-below' | 'top-right' | 'center' | 'bottom-sheet';
  className?: string;
  'data-testid'?: string;
}

export function SettingsModal({
  isOpen,
  onClose,
  position = 'center',
  className = '',
  'data-testid': testId,
}: SettingsModalProps): VNode | null {
  const { h } = getPreact();
  const { useState, useEffect, useRef, useCallback } = getPreactHooks();

  // Theme / Language
  const [currentTheme, setCurrentTheme] = useState<'auto' | 'light' | 'dark'>('auto');
  const [currentLanguage, setCurrentLanguage] = useState<'auto' | 'ko' | 'en' | 'ja'>('auto');
  const [languageService] = useState(() => new LanguageService());
  const [themeService] = useState(() => new ThemeService());

  // Surface adaptive + preference
  const [surfaceMode, setSurfaceMode] = useState<ModalSurfaceMode>('glass'); // last evaluated adaptive result
  const [applyTextShadow, setApplyTextShadow] = useState(false);
  const [scrimClasses, setScrimClasses] = useState('');
  const [surfacePref, setSurfacePref] = useState<SurfaceModePreference>('auto'); // user override
  const prefRestoredRef = useRef(false);

  // Refs
  const panelRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocusedRef = useRef<Element | null>(null);
  const originalBodyOverflowRef = useRef('');
  const backgroundElementsRef = useRef<HTMLElement[]>([]);

  // Restore preference & evaluate mode when opening
  useEffect(() => {
    if (!isOpen) return;
    previouslyFocusedRef.current = typeof document !== 'undefined' ? document.activeElement : null;

    // Restore surface preference once per open cycle
    if (!prefRestoredRef.current) {
      try {
        const saved = localStorage.getItem(
          SURFACE_MODE_STORAGE_KEY
        ) as SurfaceModePreference | null;
        if (saved && ['auto', 'glass', 'solid'].includes(saved)) {
          setSurfacePref(saved);
        }
      } catch {
        /* ignore */
      }
      prefRestoredRef.current = true;
    }

    // Decide surface mode (forced > user override > adaptive)
    const forced = getTestForcedMode();
    if (forced) {
      setSurfaceMode(forced);
      setApplyTextShadow(false);
      setScrimClasses('');
    } else if (surfacePref === 'glass' || surfacePref === 'solid') {
      setSurfaceMode(surfacePref);
      setApplyTextShadow(false);
      setScrimClasses('');
    } else {
      const samples = getTestSampleColors() || collectBackgroundSamplesV2();
      const textColor = themeService.isDarkMode() ? '#ffffff' : '#000000';
      // Phase21.3 escalation first (tiered scrim/solid) then legacy detailed evaluator for auxiliary metadata
      const esc = escalateTiersUntilContrast({
        samples: samples.length ? samples : [],
        textColor,
        threshold: 4.5,
        solidBg: themeService.isDarkMode() ? '#000000' : '#ffffff',
        previousStage: surfaceMode as unknown as
          | 'glass'
          | 'scrim-low'
          | 'scrim-med'
          | 'scrim-high'
          | 'solid',
      });
      // Map escalation stage to surface mode + scrim classes
      const nextMode: ModalSurfaceMode = esc.finalStage === 'solid' ? 'solid' : 'glass';
      let scrimCls = '';
      if (nextMode === 'glass' && esc.finalStage.startsWith('scrim')) {
        const intensity = esc.finalStage.replace('scrim-', '') || 'med';
        scrimCls = `xeg-scrim xeg-scrim-intensity-${intensity}`;
      }
      const detailed = evaluateModalSurfaceModeDetailed({
        sampleColors: samples,
        textColor,
        previousMode: surfaceMode,
        textShadowMargin: 0.6,
      });
      // Preserve escalation solid if detailed disagrees (safety)
      if (nextMode === 'solid' && detailed.mode !== 'solid') {
        // force override
        setSurfaceMode('solid');
        setApplyTextShadow(false);
      } else {
        setSurfaceMode(nextMode);
        setApplyTextShadow(detailed.applyTextShadow && nextMode === 'glass');
      }
      setScrimClasses(scrimCls);
    }

    // Sync theme & language
    setCurrentLanguage(languageService.getCurrentLanguage());
    setCurrentTheme(
      themeService.getCurrentTheme
        ? (themeService.getCurrentTheme() as typeof currentTheme)
        : 'auto'
    );

    // Scroll lock & background focus shield
    if (typeof document !== 'undefined') {
      originalBodyOverflowRef.current = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      backgroundElementsRef.current = [];
      const children = Array.from(document.body.children) as HTMLElement[];
      children.forEach(el => {
        if (!panelRef.current || panelRef.current === el || panelRef.current.contains(el)) return;
        if (!el.hasAttribute('data-xeg-prev-tabindex')) {
          const prev = el.getAttribute('tabindex');
          if (prev !== null) el.setAttribute('data-xeg-prev-tabindex', prev);
          el.setAttribute('tabindex', '-1');
          backgroundElementsRef.current.push(el);
        }
      });
    }
    return () => {
      if (typeof document !== 'undefined') {
        document.body.style.overflow = originalBodyOverflowRef.current;
        backgroundElementsRef.current.forEach(el => {
          const prev = el.getAttribute('data-xeg-prev-tabindex');
          if (prev !== null) {
            el.setAttribute('tabindex', prev);
            el.removeAttribute('data-xeg-prev-tabindex');
          } else {
            el.removeAttribute('tabindex');
          }
        });
      }
      prefRestoredRef.current = false;
    };
  }, [isOpen, surfacePref, themeService, languageService]);

  // Escape & outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        const target = e.target as Node | null;
        if (panelRef.current && target && panelRef.current.contains(target)) {
          e.stopPropagation();
          onClose();
        }
      }
      if (e.key === 'Tab' && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]),select:not([disabled]),[href],[tabindex]:not([tabindex="-1"])'
        );
        const list = Array.from(focusables).filter(el => !el.hasAttribute('disabled'));
        if (list.length === 0) return;
        const first = list[0];
        const last = list[list.length - 1];
        if (e.shiftKey && document.activeElement === first && last) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last && first) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    const handleClick = (e: MouseEvent): void => {
      if (!panelRef.current) return;
      const target = e.target as Node;
      if (!panelRef.current.contains(target) || target === panelRef.current) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKey);
    document.addEventListener('mousedown', handleClick);
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [isOpen, onClose]);

  // Initial focus
  useEffect(() => {
    if (!isOpen) return;
    const closeBtn = panelRef.current?.querySelector(
      'button[aria-label="Close"]'
    ) as HTMLButtonElement | null;
    closeBtn?.focus();
  }, [isOpen]);

  // Focus return
  useEffect(() => {
    if (isOpen) return;
    const prev = previouslyFocusedRef.current as HTMLElement | null;
    prev?.focus?.();
  }, [isOpen]);

  // Handlers
  const handleThemeChange = useCallback(
    (event: Event) => {
      const newTheme = (event.target as HTMLSelectElement).value as 'auto' | 'light' | 'dark';
      setCurrentTheme(newTheme);
      themeService.setTheme(newTheme);
      if (typeof document !== 'undefined') {
        if (newTheme === 'auto') {
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
        } else {
          document.documentElement.setAttribute('data-theme', newTheme);
        }
      }
    },
    [themeService]
  );

  const handleLanguageChange = useCallback(
    (event: Event) => {
      const newLanguage = (event.target as HTMLSelectElement).value as 'auto' | 'ko' | 'en' | 'ja';
      setCurrentLanguage(newLanguage);
      languageService.setLanguage(newLanguage);
    },
    [languageService]
  );

  const handleSurfaceModeChange = useCallback(
    (event: Event) => {
      const newPref = (event.target as HTMLSelectElement).value as SurfaceModePreference;
      setSurfacePref(newPref);
      try {
        localStorage.setItem(SURFACE_MODE_STORAGE_KEY, newPref);
      } catch {
        /* ignore */
      }
      if (newPref === 'auto') {
        const samples = getTestSampleColors() || collectBackgroundSamplesV2();
        const textColor = themeService.isDarkMode() ? '#ffffff' : '#000000';
        const esc = escalateTiersUntilContrast({
          samples: samples.length ? samples : [],
          textColor,
          threshold: 4.5,
          solidBg: themeService.isDarkMode() ? '#000000' : '#ffffff',
          previousStage: surfaceMode as unknown as
            | 'glass'
            | 'scrim-low'
            | 'scrim-med'
            | 'scrim-high'
            | 'solid',
        });
        const nextMode: ModalSurfaceMode = esc.finalStage === 'solid' ? 'solid' : 'glass';
        setSurfaceMode(nextMode);
        setApplyTextShadow(false);
      } else {
        setSurfaceMode(newPref); // immediate visual feedback
        setApplyTextShadow(false);
      }
    },
    [themeService, surfaceMode]
  );

  if (!isOpen) return null;

  const testProps = ComponentStandards.createTestProps(testId);
  // 위치 매핑 (레거시 center -> toolbar-below, bottom-sheet -> toolbar-below 변형)
  const normalizedPosition = ((): 'toolbar-below' | 'top-right' => {
    if (position === 'top-right') return 'top-right';
    return 'toolbar-below';
  })();
  const positionClass = normalizedPosition === 'top-right' ? styles.topRight : styles.toolbarBelow;
  const legacyPositionClasses: string[] = [];
  if (position === 'center' && styles.center) legacyPositionClasses.push(styles.center);
  if (position === 'bottom-sheet' && styles.bottomSheet)
    legacyPositionClasses.push(styles.bottomSheet);
  const panelClass = ComponentStandards.createClassName(
    styles.panel,
    positionClass,
    'accessibility-enhanced', // 접근성 개선
    ...legacyPositionClasses,
    className
  );
  const effectiveSurfaceMode: ModalSurfaceMode =
    surfacePref === 'glass' || surfacePref === 'solid' ? surfacePref : surfaceMode;
  const innerClass = ComponentStandards.createClassName(
    styles.modal,
    'glass-surface',
    'modal-surface',
    effectiveSurfaceMode === 'solid' ? 'modal-surface-solid' : '',
    applyTextShadow && effectiveSurfaceMode === 'glass' ? 'xeg-modal-text-shadow' : '',
    scrimClasses,
    styles.inner
  );

  const header = h('div', { className: styles.header, key: 'header' }, [
    h(
      'h2',
      { id: 'settings-title', className: styles.title, key: 'title' },
      languageService.getString('settings.title')
    ),
    h(
      'button',
      {
        type: 'button',
        className: `${toolbarStyles.toolbarButton} ${styles.closeButton}`,
        onClick: onClose,
        'aria-label': 'Close',
        key: 'close',
      },
      h(X, { size: 16 })
    ),
  ]);

  const themeSelect = h(
    'select',
    {
      id: 'theme-select',
      className: `${toolbarStyles.toolbarButton} ${styles.select}`,
      value: currentTheme,
      onChange: handleThemeChange,
    },
    [
      h('option', { value: 'auto' }, languageService.getString('settings.themeAuto')),
      h('option', { value: 'light' }, languageService.getString('settings.themeLight')),
      h('option', { value: 'dark' }, languageService.getString('settings.themeDark')),
    ]
  );

  const languageSelect = h(
    'select',
    {
      id: 'language-select',
      className: `${toolbarStyles.toolbarButton} ${styles.select}`,
      value: currentLanguage,
      onChange: handleLanguageChange,
    },
    [
      h('option', { value: 'auto' }, '자동 / Auto / 自動'),
      h('option', { value: 'ko' }, '한국어'),
      h('option', { value: 'en' }, 'English'),
      h('option', { value: 'ja' }, '日本語'),
    ]
  );

  const surfaceModeSelect = h(
    'select',
    {
      id: 'surface-mode-select',
      className: `${toolbarStyles.toolbarButton} ${styles.select}`,
      value: surfacePref,
      onChange: handleSurfaceModeChange,
      onInput: handleSurfaceModeChange,
      'aria-label': languageService.getString('settings.surfaceMode') || 'Surface',
    },
    [
      h(
        'option',
        { value: 'auto' },
        languageService.getString('settings.surfaceModeAuto') || 'Auto'
      ),
      h(
        'option',
        { value: 'glass' },
        languageService.getString('settings.surfaceModeGlass') || 'Glass'
      ),
      h(
        'option',
        { value: 'solid' },
        languageService.getString('settings.surfaceModeSolid') || 'Solid'
      ),
    ]
  );

  const body = h('div', { className: styles.body, key: 'body' }, [
    h('div', { className: styles.setting, key: 'theme-setting' }, [
      h(
        'label',
        { htmlFor: 'theme-select', className: styles.label },
        languageService.getString('settings.theme')
      ),
      themeSelect,
    ]),
    h('div', { className: styles.setting, key: 'language-setting' }, [
      h(
        'label',
        { htmlFor: 'language-select', className: styles.label },
        languageService.getString('settings.language')
      ),
      languageSelect,
    ]),
    h('div', { className: styles.setting, key: 'surface-mode-setting' }, [
      h(
        'label',
        { htmlFor: 'surface-mode-select', className: styles.label },
        languageService.getString('settings.surfaceMode') || 'Surface'
      ),
      surfaceModeSelect,
    ]),
  ]);

  const content = h('div', { ref: innerRef, id: 'settings-content', className: innerClass }, [
    header,
    body,
  ]);
  const node = h(
    'div',
    {
      ref: panelRef,
      className: panelClass,
      role: 'dialog',
      'aria-modal': 'true',
      'aria-labelledby': 'settings-title',
      'aria-describedby': 'settings-content',
      'data-position': position,
      onClick: (e: MouseEvent) => {
        // 테스트는 role='dialog' 요소 자체 클릭을 배경 클릭으로 간주
        if (panelRef.current && e.target === panelRef.current) {
          onClose();
        }
      },
      ...testProps,
    },
    content
  );
  return node as unknown as VNode;
}

// Collect a small set of background colors around the intended modal area.
// legacy collectBackgroundSamples removed (replaced by collectBackgroundSamplesV2 from escalation module)
