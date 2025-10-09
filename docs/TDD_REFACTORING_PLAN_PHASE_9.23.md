# Phase 9.23: BROWSER-TEST-CRITICAL-FIXES

**우선순위**: Critical (P0) **상태**: 🔄 작업 중 **날짜**: 2025-10-09

## 목표

브라우저 테스트(v0.3.1-dev.1759929188276)에서 발견된 4가지 Critical 버그를
수정합니다.

## 배경

Phase 9.21.3 완료 후 브라우저 테스트 결과, 다음 4가지 문제가 **실제로는 여전히
발생**하고 있음을 확인:

1. ❌ **네비게이션 깜빡임**: 이전/다음 버튼 클릭 시 화면이 깜빡이며 첫 이미지로
   리셋
2. ❌ **툴바 아이콘 안 보임**: 다크모드에서 툴바 버튼이 투명하게 렌더링
3. ❌ **설정 모달 CSS 깨짐**: 모달이 평범한 텍스트/버튼으로 보임 (glassmorphism
   효과 없음)
4. ❌ **언어 설정 미작동**: 언어 선택 후 변경되지 않음 (영어로 고정)

**근본 원인**: 코드 분석만으로는 런타임 동작을 정확히 파악할 수 없었으며, 실제
브라우저 환경에서의 검증이 필수적임.

## 솔루션 평가 및 선택

### 문제 1: 네비게이션 깜빡임

**근본 원인**: `createEffect`가 `isGalleryOpen` 변경마다 `renderGallery()` 호출
→ 컴포넌트 재마운트 → state 리셋

**솔루션 평가**: | 솔루션 | 장점 | 단점 | 복잡도 | 선택 |
|--------|------|------|--------|------| | 1. isInitialized 플래그 | 간단, 즉시
적용 가능, 명확한 의도 | 상태 추가 | Low | ⭐ | | 2. createMemo + debounce |
구조적으로 깔끔, signal 최적화 | 복잡도 증가, 디버깅 어려움 | High | ❌ | | 3.
debounce만 추가 | 빠름 | 근본 원인 해결 안 됨, 깜빡임 여전히 발생 | Medium | ❌
|

**선택**: **솔루션 1 (isInitialized 플래그)** **이유**: 최소 변경으로 근본 원인
해결, Phase 9.21.4 작업과 자연스럽게 통합 가능

### 문제 2: 툴바 아이콘 안 보임

**근본 원인**: `ThemeService.init()` 비동기 → CSS 변수 늦게 로드 → SVG
`currentColor` 투명화

**솔루션 평가**: | 솔루션 | 장점 | 단점 | 복잡도 | 선택 |
|--------|------|------|--------|------| | 1. 동기 초기화 + CSS fallback | 근본
해결, 성능 개선 | ThemeService 리팩토링 필요 | Medium | ⭐ | | 2. Heroicons
인라인 스타일 | 빠름 | 유지보수 부담, 모든 아이콘 수정 필요 | High | ❌ | | 3.
CSS Fallback만 강화 | 간단 | 타이밍 이슈 근본 해결 안 됨 | Low | 보조 |

**선택**: **솔루션 1 (동기 초기화) + 솔루션 3 (CSS Fallback 보조)** **이유**:
타이밍 이슈를 근본적으로 해결하고 Fallback으로 안정성 강화

### 문제 3: 설정 모달 CSS 깨짐

**근본 원인**: CSS Modules 비동기 로드 + `createMemo` 실행 시점에 `styles` 객체
미완성 + 클래스 이름 계산 오류

**솔루션 평가**: | 솔루션 | 장점 | 단점 | 복잡도 | 선택 |
|--------|------|------|--------|------| | 1. CSS Modules 정적 import | 표준
패턴 | 이미 적용되어 있음, 효과 없음 | Low | ❌ | | 2. 명시적 클래스 매핑 |
간단, 확실, 타입 안전 | 맵 객체 추가 | Low | ⭐ | | 3. backdrop-filter Polyfill
| 브라우저 호환성 향상 | 주 문제 해결 안 됨 | Low | 보조 |

**선택**: **솔루션 2 (명시적 클래스 매핑)** **이유**: Phase 9.21.4의 modal-debug
작업과 직접 연결, 클래스 이름 계산 오류 완전 제거

### 문제 4: 언어 설정 미작동

**근본 원인**: Solid.js에서 `onChange`가 select에서 작동하지 않음 +
`LanguageService` 비반응성

**솔루션 평가**: | 솔루션 | 장점 | 단점 | 복잡도 | 선택 |
|--------|------|------|--------|------| | 1. onChange → onInput | 1줄 수정,
즉시 효과 | Solid.js 이벤트 모델 차이 인지 필요 | Low | ⭐ | | 2.
LanguageService Signal 추가 | 구조적 개선, 반응성 완성 | LanguageService 전면
리팩토링 | High | 별도 Phase | | 3. 강제 재렌더링 | 빠름 | 안티패턴, 유지보수
악화 | Medium | ❌ |

**선택**: **솔루션 1 (onChange → onInput)** **이유**: 최소 변경으로 즉시 효과,
솔루션 2는 별도 Phase 9.24로 진행

## 작업 범위

### RED: 테스트 작성

```
test/unit/features/gallery/browser-test-critical-fixes.red.test.ts
```

4가지 문제를 각각 검증하는 테스트:

1. 네비게이션: 버튼 클릭 시 currentIndex 변경, 재마운트 없음 확인
2. 툴바: CSS 변수 동기 설정 확인, 아이콘 색상 fallback 확인
3. 모달: SIZE_CLASS_MAP/SURFACE_CLASS_MAP 사용 확인
4. 언어: onInput 이벤트 바인딩 확인

### GREEN: 최소 구현

#### 1. 네비게이션 깜빡임 수정

**파일**: `src/features/gallery/GalleryRenderer.tsx`

```typescript
private setupStateSubscription(): void {
  const { createEffect, createRoot, on } = getSolid();

  this.stateUnsubscribe = createRoot(dispose => {
    let isInitialized = false; // ✅ 초기화 플래그 추가

    createEffect(
      on(
        isGalleryOpen,
        isOpen => {
          if (isOpen && !isInitialized) {
            // 최초 한 번만 렌더링
            this.renderGallery();
            isInitialized = true;
          } else if (!isOpen && isInitialized) {
            this.cleanupGallery();
            isInitialized = false;
          }
          // isOpen이 true로 유지되는 동안에는 재렌더링 안 함
        },
        { defer: true }
      )
    );

    return dispose;
  });
}
```

**변경 사항**:

- `isInitialized` 플래그로 최초 1회만 `renderGallery()` 호출
- `isOpen` 변경 시에는 cleanup만 수행, 재렌더링 방지

#### 2. 툴바 아이콘 수정

**파일**: `src/shared/services/ThemeService.ts`

```typescript
export class ThemeService {
  constructor() {
    // async 제거 - 동기 초기화
    this.initSync();
  }

  private initSync(): void {
    const saved = this.loadTheme(); // GM_getValue 동기 호출
    const theme = saved || this.detectTheme();
    this.applyTheme(theme);
  }

  private applyTheme(theme: ThemeMode): void {
    document.documentElement.setAttribute('data-theme', theme);

    // CSS 변수 즉시 설정
    const iconColor =
      theme === 'dark' ? 'oklch(0.95 0.01 264)' : 'oklch(0.25 0.01 264)';

    document.documentElement.style.setProperty('--xeg-icon-color', iconColor);
  }
}
```

**파일**: `src/shared/components/ui/Toolbar/Toolbar.module.css`

```css
.toolbarButton {
  /* 명시적 fallback 추가 */
  color: var(--xeg-color-text-primary, oklch(0.95 0.01 264));
  opacity: 1 !important;
  pointer-events: auto !important;
}

/* 다크 모드 명시적 지원 */
[data-theme='dark'] .toolbarButton {
  color: oklch(0.95 0.01 264); /* 밝은 색 */
}

[data-theme='light'] .toolbarButton {
  color: oklch(0.25 0.01 264); /* 어두운 색 */
}
```

**변경 사항**:

- `async init()` → `initSync()`: 동기 초기화로 타이밍 이슈 제거
- `applyTheme()`에서 CSS 변수 즉시 설정
- Toolbar CSS에 명시적 fallback 및 `[data-theme]` 선택자 추가

#### 3. 설정 모달 CSS 수정

**파일**: `src/shared/components/ui/ModalShell/ModalShell.tsx`

```typescript
import styles from './ModalShell.module.css';

// 명시적 클래스 매핑 객체
const SIZE_CLASS_MAP = {
  sm: styles.modalSizeSm,
  md: styles.modalSizeMd,
  lg: styles.modalSizeLg,
  xl: styles.modalSizeXl,
} as const;

const SURFACE_CLASS_MAP = {
  glass: styles.modalSurfaceGlass,
  solid: styles.modalSurfaceSolid,
  elevated: styles.modalSurfaceElevated,
} as const;

export const ModalShell: Component<ModalShellProps> = props => {
  // ... (기존 코드)

  const shellClass = createMemo(() => {
    const classes = [
      styles.modalShell,
      SIZE_CLASS_MAP[local.size], // ✅ 명시적 매핑 사용
      SURFACE_CLASS_MAP[local.surfaceVariant], // ✅ 명시적 매핑 사용
    ];

    if (local.className) {
      classes.push(local.className);
    }

    return classes.filter(Boolean).join(' ');
  });

  // ... (나머지 코드)
};
```

**변경 사항**:

- `SIZE_CLASS_MAP`, `SURFACE_CLASS_MAP` 객체로 클래스 이름 매핑 명시화
- 문자열 계산 제거, 타입 안전성 향상

#### 4. 언어 설정 수정

**파일**: `src/shared/components/ui/SettingsModal/SettingsModal.tsx`

```typescript
<select
  class={styles['settings-select']}
  value={internalLanguage()}
  onInput={handleLanguageChange}  // ✅ onChange → onInput 변경
  id="language-select"
>
  <option value="auto">{languageService.getString('settings.languageAuto')}</option>
  <option value="ko">{languageService.getString('settings.languageKo')}</option>
  <option value="en">{languageService.getString('settings.languageEn')}</option>
  <option value="ja">{languageService.getString('settings.languageJa')}</option>
</select>
```

**변경 사항**:

- `onChange` → `onInput`: Solid.js에서 select 요소는 onInput 사용 필요

### REFACTOR: 검증 및 정리

1. **타입 체크**: `npm run typecheck`
2. **린트**: `npm run lint:fix`
3. **테스트**: `npm test`
4. **빌드**: `npm run build:dev` + `npm run build:prod`
5. **브라우저 테스트**: Tampermonkey에 dev.user.js 설치 후 X.com에서 검증

## 브라우저 테스트 체크리스트

### 시나리오 1: 네비게이션 (문제 1)

- [ ] 갤러리 열기
- [ ] 다음 버튼 3회 클릭 → 부드러운 전환, 깜빡임 없음 확인
- [ ] 이전 버튼 3회 클릭 → currentIndex 정상 변경 확인
- [ ] 키보드 ArrowLeft/Right → 정상 동작 확인

### 시나리오 2: 툴바 가시성 (문제 2)

- [ ] 라이트 모드 → 툴바 버튼 보임 (어두운 아이콘)
- [ ] 다크 모드 전환 → 툴바 버튼 보임 (밝은 아이콘)
- [ ] 호버 시 버튼 하이라이트 확인
- [ ] 페이지 새로고침 → 테마 유지 + 아이콘 즉시 표시

### 시나리오 3: 설정 모달 (문제 3)

- [ ] 설정 버튼 클릭 → 모달 열림
- [ ] 모달 스타일 확인: 테두리, 그림자, glassmorphism 효과
- [ ] 테마 선택 → 즉시 적용 확인
- [ ] ESC 키 → 모달 닫힘 확인

### 시나리오 4: 언어 설정 (문제 4)

- [ ] 언어 선택 → 한국어
- [ ] 모달 텍스트 한국어로 즉시 변경 확인
- [ ] 페이지 새로고침 → 언어 유지 확인
- [ ] 다른 언어(영어, 일본어) 전환 테스트

## 수락 기준

- ✅ 4개 RED 테스트 모두 GREEN
- ✅ 브라우저 테스트 4개 시나리오 모두 통과
- ✅ 타입/린트/빌드 검증 통과
- ✅ 빌드 크기: Dev ≤ 1,100 KB, Prod ≤ 350 KB (gzip ≤ 95 KB)

## 후속 작업

### Phase 9.24: LANGUAGE-SERVICE-REACTIVITY (별도 진행)

**목표**: LanguageService에 Solid Signal 통합하여 완전한 반응성 구현

**범위**:

- `languageSignal` 추가
- `getString()` 메서드를 signal 기반으로 변경
- 컴포넌트에서 자동 재렌더링 지원

**우선순위**: Medium (P2) - Phase 9.23 완료 후 진행

## 참고 문서

- `docs/CRITICAL_FIXES_PLAN.md`: 상세 분석 및 솔루션 평가
- `docs/TDD_REFACTORING_PLAN_PHASE_9.21.4.md`: Effect 최적화 작업
- `docs/CODING_GUIDELINES.md`: Solid.js 이벤트 패턴, 디자인 토큰 규칙
- `docs/ARCHITECTURE.md`: 3계층 구조, 의존성 경계

## 리스크 및 완화

| 리스크                                    | 영향   | 완화 방안                                           |
| ----------------------------------------- | ------ | --------------------------------------------------- |
| ThemeService 동기화로 인한 초기 로딩 지연 | Low    | GM_getValue는 빠름 (로컬 스토리지), 성능 영향 미미  |
| isInitialized 플래그로 인한 edge case     | Medium | 브라우저 테스트로 갤러리 열기/닫기 반복 검증        |
| CSS 클래스 매핑 누락                      | Low    | 타입 체크로 컴파일 타임에 발견                      |
| onInput 이벤트 브라우저 호환성            | Low    | 모든 모던 브라우저 지원, Tampermonkey 환경에서 검증 |

---

**작성자**: GitHub Copilot **검토자**: @PiesP **상태**: 🔄 작업 중
