/**
 * @fileoverview Phase 0: Hello World Solid.js Component
 * @description Solid.js 빌드 환경 검증용 최소 컴포넌트
 */

import { createSignal } from 'solid-js';
import styles from './HelloSolid.module.css';

export interface HelloSolidProps {
  readonly initialCount?: number;
}

/**
 * Phase 0 검증용 Solid.js 컴포넌트
 * - createSignal 사용
 * - JSX 렌더링
 * - 이벤트 핸들링 (PC 전용)
 */
export function HelloSolid(props: HelloSolidProps) {
  const [count, setCount] = createSignal(props.initialCount ?? 0);

  const increment = () => {
    setCount(count() + 1);
  };

  return (
    <div class={styles.container} data-testid='hello-solid'>
      <h2 class={styles.title}>Hello Solid.js! 🎉</h2>
      <p class={styles.description}>Phase 0: Solid.js 빌드 환경이 정상적으로 구성되었습니다.</p>
      <div class={styles.counter}>
        <p>
          Count: <span class={styles.count}>{count()}</span>
        </p>
        <button
          type='button'
          class={styles.button}
          onClick={increment}
          aria-label='Increment counter'
        >
          Increment
        </button>
      </div>
    </div>
  );
}
