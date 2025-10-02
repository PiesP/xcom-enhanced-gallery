/**
 * @fileoverview RadioGroup - WAI-ARIA compliant radio button group component
 * @description Epic LANG_ICON_SELECTOR Phase 2
 *
 * Requirements:
 * - WAI-ARIA radiogroup pattern
 * - Keyboard navigation (Arrow keys, Home/End, Space/Enter)
 * - PC-only events (no touch/pointer)
 * - Design tokens only
 * - SolidJS native patterns
 */

import type { JSX } from 'solid-js';
import { getSolidCore } from '@shared/external/vendors';
import { LazyIcon } from '@shared/components/LazyIcon';
import styles from './RadioGroup.module.css';

export interface RadioOption {
  readonly value: string;
  readonly label: string;
  readonly iconName?: string;
  readonly disabled?: boolean;
}

export interface RadioGroupProps {
  readonly name: string;
  readonly value: string;
  readonly options: readonly RadioOption[];
  readonly onChange: (value: string) => void;
  readonly orientation?: 'vertical' | 'horizontal';
  readonly 'aria-label'?: string;
  readonly 'aria-labelledby'?: string;
  readonly 'aria-describedby'?: string;
  readonly className?: string;
  readonly disabled?: boolean;
}

export const RadioGroup = (props: RadioGroupProps): JSX.Element => {
  const solid = getSolidCore();
  const { createSignal, createMemo, createEffect } = solid;

  // 내부 포커스 인덱스 관리
  const [focusedIndex, setFocusedIndex] = createSignal(0);

  // 선택된 옵션의 인덱스 계산
  const selectedIndex = createMemo(() => {
    return props.options.findIndex(opt => opt.value === props.value);
  });

  // 활성화된 옵션들만 필터링 (disabled가 아닌 옵션)
  const enabledIndices = createMemo(() => {
    return props.options
      .map((opt, idx) => ({ opt, idx }))
      .filter(({ opt }) => !opt.disabled)
      .map(({ idx }) => idx);
  });

  // 초기 포커스 설정
  createEffect(() => {
    const selected = selectedIndex();
    if (selected >= 0) {
      setFocusedIndex(selected);
    } else {
      const enabled = enabledIndices();
      if (enabled.length > 0 && enabled[0] !== undefined) {
        setFocusedIndex(enabled[0]);
      }
    }
  });

  // 다음 활성화된 인덱스 찾기 (순환)
  const getNextEnabledIndex = (currentIdx: number, direction: 1 | -1): number => {
    const enabled = enabledIndices();
    if (enabled.length === 0) return currentIdx;

    const currentPos = enabled.indexOf(currentIdx);
    if (currentPos === -1) {
      // 현재 인덱스가 비활성화 상태면 첫 번째 활성화 인덱스 반환
      return enabled[0] ?? 0;
    }

    let nextPos = currentPos + direction;
    // 순환 처리
    if (nextPos >= enabled.length) {
      nextPos = 0;
    } else if (nextPos < 0) {
      nextPos = enabled.length - 1;
    }

    return enabled[nextPos] ?? 0;
  };

  // 키보드 네비게이션 핸들러
  const handleKeyDown = (event: KeyboardEvent) => {
    const orientation = props.orientation ?? 'vertical';
    const currentIdx = focusedIndex();

    let handled = false;
    let newIndex: number | null = null;

    switch (event.key) {
      case 'ArrowDown':
        if (orientation === 'vertical') {
          newIndex = getNextEnabledIndex(currentIdx, 1);
          handled = true;
        }
        break;
      case 'ArrowUp':
        if (orientation === 'vertical') {
          newIndex = getNextEnabledIndex(currentIdx, -1);
          handled = true;
        }
        break;
      case 'ArrowRight':
        if (orientation === 'horizontal') {
          newIndex = getNextEnabledIndex(currentIdx, 1);
          handled = true;
        }
        break;
      case 'ArrowLeft':
        if (orientation === 'horizontal') {
          newIndex = getNextEnabledIndex(currentIdx, -1);
          handled = true;
        }
        break;
      case 'Home':
        {
          const enabled = enabledIndices();
          if (enabled.length > 0 && enabled[0] !== undefined) {
            newIndex = enabled[0];
            handled = true;
          }
        }
        break;
      case 'End':
        {
          const enabled = enabledIndices();
          const lastIdx = enabled[enabled.length - 1];
          if (enabled.length > 0 && lastIdx !== undefined) {
            newIndex = lastIdx;
            handled = true;
          }
        }
        break;
      case ' ':
      case 'Enter':
        {
          const option = props.options[currentIdx];
          if (option && !option.disabled && option.value !== props.value) {
            props.onChange(option.value);
            handled = true;
          }
        }
        break;
    }

    if (handled) {
      event.preventDefault();
      if (newIndex !== null && newIndex !== currentIdx) {
        setFocusedIndex(newIndex);
        // 포커스를 새 옵션으로 이동
        const radioElement = document.querySelector(
          `[data-radio-index="${newIndex}"]`
        ) as HTMLElement;
        radioElement?.focus();
      }
    }
  };

  // 옵션 클릭 핸들러
  const handleOptionClick = (option: RadioOption) => {
    if (option.disabled || props.disabled) return;

    // 이미 선택된 옵션을 다시 클릭하면 onChange 호출하지 않음
    if (option.value === props.value) return;

    props.onChange(option.value);
  };

  // 옵션별 tabindex 계산
  const getTabIndex = (index: number): number => {
    const selected = selectedIndex();
    if (selected >= 0) {
      return index === selected ? 0 : -1;
    }
    // 선택된 옵션이 없으면 첫 번째 활성화된 옵션에 tabindex 0
    const enabled = enabledIndices();
    return enabled.length > 0 && enabled[0] !== undefined && index === enabled[0] ? 0 : -1;
  };

  const orientation = () => props.orientation ?? 'vertical';
  const orientationClass = () =>
    orientation() === 'horizontal' ? styles.horizontal : styles.vertical;

  return (
    <div
      role='radiogroup'
      aria-labelledby={props['aria-labelledby']}
      aria-label={props['aria-label']}
      aria-describedby={props['aria-describedby']}
      class={`${styles.radioGroup} ${orientationClass()} ${props.className ?? ''}`}
      onKeyDown={handleKeyDown}
    >
      {props.options.map((option, index) => {
        const isSelected = () => option.value === props.value;
        const isDisabled = () => option.disabled || props.disabled;
        const tabIndex = () => getTabIndex(index);

        return (
          <div
            role='radio'
            aria-checked={isSelected()}
            aria-disabled={isDisabled() ? true : undefined}
            tabIndex={tabIndex()}
            data-radio-index={index}
            data-value={option.value}
            class={`${styles.radioOption} ${isSelected() ? styles.selected : ''} ${
              isDisabled() ? styles.disabled : ''
            }`}
            onClick={() => handleOptionClick(option)}
            onKeyDown={handleKeyDown}
          >
            {option.iconName && (
              <LazyIcon
                name={option.iconName}
                {...(styles.icon ? { className: styles.icon } : {})}
              />
            )}
            <span class={styles.label}>{option.label}</span>
          </div>
        );
      })}
    </div>
  );
};
