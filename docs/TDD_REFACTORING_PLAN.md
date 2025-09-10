# 🔧 TDD 리팩토링 계획

> **다크 테마 일관성 및 상충 테스트 해결 - 진행 상황 업데이트**

## 🎯 작업 완료 상태 (2024-01-20)

### ✅ 완료된 주요 작업

#### 1. 핵심 충돌 해결 완료

- **glass-surface 클래스 제거**: `Toolbar.tsx`, `SettingsModal.tsx`에서 완전
  제거
- **CSS 토큰 기반 아키텍처 도입**: `--xeg-comp-toolbar-bg`,
  `--xeg-comp-modal-bg` 등 컴포넌트별 토큰 사용
- **충돌하는 테스트 해결**: 5개 주요 테스트 파일 모두 통과
  - `glass-surface-removal.test.ts` ✅
  - `settings-modal-design-consistency.test.ts` ✅
  - `glass-surface-consistency.test.ts` ✅
  - `settings-modal-unit-consistency.test.ts` ✅
  - `fit-button-independence.test.ts` ✅

#### 2. 아키텍처 표준화 완료

- **CSS 클래스 정리**: `fitModeGroup` 등 불필요한 CSS 클래스 제거
- **컴포넌트 토큰 시스템**: 일관된 CSS 토큰 네이밍 규칙 적용
- **다크 테마 일관성**: 툴바, 설정 모달의 다크 테마 참조 통일

### 🔄 추가 개선이 필요한 영역

#### 1. 디자인 토큰 완전 통합

- Blur 효과 관련 토큰 완전 제거 (일부 남아있음)
- 애니메이션 시스템 일관성 개선 필요
- CSS 디자인 시스템 통합 완료 필요

#### 2. 품질 보증

- 일부 테스트에서 여전히 블러 토큰 감지
- 디자인 토큰 체계 완전 통합 필요
- 빌드 시스템 최적화 여지

### 📊 현재 달성 수준

- **사용자 요구사항 충족**: ✅ 완료 (다크 테마 일관성, 상충 테스트 해결)
- **핵심 아키텍처 통일**: ✅ 완료 (CSS 토큰 기반 설계)
- **테스트 통과율**: 🔄 진행 중 (주요 충돌 해결 완료, 세부 최적화 남음)

---

## 📚 참고: 원본 분석 내용

## 📊 현재 상태 분석

### 🎯 발견된 문제점

#### 1. 상충하는 테스트 요구사항 ⚠️

**문제**: Glass Surface 클래스에 대한 모순된 테스트

- **제거 요구**: `test/refactoring/glass-surface-removal.test.ts`
- **사용 요구**: `test/refactoring/settings-modal-design-consistency.test.ts`
- **영향**: TDD 원칙 위배, 개발 방향성 혼란

#### 2. 토큰 체계 불일치

**문제 A**: 컴포넌트 토큰 vs 일반 토큰 혼재

- **컴포넌트 토큰**: `var(--xeg-comp-modal-bg)` (요구사항)
- **일반 토큰**: `var(--xeg-modal-bg)` (다른 테스트 요구사항)

**문제 B**: 테마별 토큰 참조 방식 불일치

- 갤러리: `--xeg-gallery-bg` (테마 자동 전환)
- 툴바: `--xeg-comp-toolbar-bg` (컴포넌트 토큰)
- 모달: 혼재 상황

#### 3. 디자인 아키텍처 방향성 부재

**현상**: Glass Surface 패턴의 역할 불명확

- CSS 클래스 기반 vs CSS 토큰 기반 접근법 충돌
- 컴포넌트별 일관성 부족

## 🎛️ 솔루션 분석

### 솔루션 1: 테스트 통합 우선 (권장) ⭐

**접근법**: 상충하는 테스트를 분석하여 일관된 아키텍처 결정 **장점**:

- TDD 원칙 준수 (명확한 요구사항)
- 장기적 일관성 확보
- 개발자 혼란 제거

**단점**:

- 추가 분석 시간 필요
- 일부 테스트 수정 필요

**우선순위**:

1. 테스트 요구사항 충돌 해결
2. 통일된 디자인 토큰 체계 확립
3. 컴포넌트별 일관성 적용

### 솔루션 2: 컴포넌트 토큰 체계 표준화

**접근법**: 모든 컴포넌트에 일관된 토큰 체계 적용 **장점**:

- 명확한 토큰 위계 구조
- 테마 확장성
- 디자이너-개발자 협업 개선

**단점**:

- 기존 코드 대폭 수정
- 테스트 업데이트 필요

### 솔루션 3: Glass Surface 아키텍처 재설계

**접근법**: Glass Surface 패턴의 역할과 구현 방식 재정의 **장점**:

- 완전한 일관성
- 현대적 CSS 아키텍처
- 성능 최적화

**단점**:

- 높은 리스크
- 대규모 리팩토링
- 일정 지연 가능성

## ✅ 채택된 솔루션: 테스트 통합 우선

### 🔍 테스트 충돌 분석 결과

#### 상충 테스트 분류:

1. **제거 그룹**: `glass-surface-removal.test.ts`
   - 목표: 레거시 클래스 제거, 모던 CSS 아키텍처
   - 근거: 성능 최적화, 토큰 기반 접근

2. **사용 그룹**: `settings-modal-design-consistency.test.ts`
   - 목표: 컴포넌트 간 일관성, 재사용 가능한 Glass 효과
   - 근거: 디자인 시스템 통합, 개발 효율성

#### 🎯 통합 결정: **CSS 토큰 기반 Glass Surface**

**결정 근거**:

- CSS 클래스보다 토큰이 더 현대적이고 확장 가능
- 테마 전환 시 성능 우수 (CSS 변수 활용)
- 디자이너 친화적 (Design Token 시스템)

## 🎯 TDD 기반 리팩토링 단계

### Phase 1: 상충 테스트 해결 (RED → GREEN)

**목표**: 일관된 CSS 토큰 아키텍처 확립

**1.1 테스트 업데이트**:

```typescript
// OLD: glass-surface 클래스 기반 테스트
expect(component).toContain('glass-surface');

// NEW: 토큰 기반 테스트
expect(cssContent).toMatch(/var\(--xeg-surface-glass-bg\)/);
```

**1.2 컴포넌트 수정**:

- SettingsModal: 컴포넌트 토큰 사용
- Toolbar: 컴포넌트 토큰 사용
- CSS: 토큰 기반 glassmorphism 구현

### Phase 2: 토큰 체계 표준화 (RED → GREEN)

**목표**: 모든 테마 토큰 일관성 확보

**2.1 토큰 위계 정립**:

```css
/* 기본 레이어 */
:root {
  --xeg-surface-glass-bg: rgba(255, 255, 255, 0.8);
  --xeg-surface-glass-border: rgba(255, 255, 255, 0.2);
}

/* 컴포넌트 레이어 */
:root {
  --xeg-comp-modal-bg: var(--xeg-surface-glass-bg);
  --xeg-comp-toolbar-bg: var(--xeg-surface-glass-bg);
}

/* 테마 레이어 */
[data-theme='dark'] {
  --xeg-surface-glass-bg: rgba(30, 30, 30, 0.95);
  --xeg-surface-glass-border: rgba(255, 255, 255, 0.1);
}
```

**2.2 컴포넌트 적용**:

- 모든 Surface 요소에 통일된 토큰 적용
- 테마별 자동 전환 확인

### Phase 3: 다크 테마 최종 검증 (GREEN → REFACTOR)

**목표**: 모든 컴포넌트의 다크 테마 동작 완전 검증

**검증 매트릭스**: | 컴포넌트 | 라이트 모드 | 다크 모드 | 자동 감지 |
|----------|------------|-----------|-----------| | 갤러리 | ✅ | ✅ | ✅ | |
툴바 | ✅ | 🔄 | 🔄 | | 모달 | 🔄 | 🔄 | 🔄 |

**최종 목표**: 모든 셀이 ✅ 상태

## 📋 구현 체크리스트

### ✅ 완료된 작업

- [x] 테마 토큰 시스템 구축
- [x] 갤러리 다크 테마 구현
- [x] 기본 컴포넌트 토큰 정의
- [x] 자동 테마 감지 기능

### 🔄 진행 중인 작업

- [x] Glass Surface 클래스 제거 (SettingsModal, Toolbar)
- [x] 컴포넌트 토큰 부분 적용
- [ ] 상충 테스트 해결
- [ ] 토큰 위계 표준화

### 📝 향후 작업

- [ ] 모든 테스트 통과 달성
- [ ] 다크 테마 완전 검증
- [ ] 성능 최적화 검증
- [ ] 접근성 검증

### 🚨 즉시 해결 필요

- [ ] **테스트 충돌 해결**: glass-surface 관련 모순된 요구사항
- [ ] **토큰 일관성**: `--xeg-modal-bg` vs `--xeg-comp-modal-bg`
- [ ] **아키텍처 결정**: CSS 클래스 vs CSS 토큰 기반

## 🧪 테스트 전략

### Red-Green-Refactor 사이클

#### Red (실패 테스트 작성)

```typescript
// 현재 실패하는 테스트들
test('should not use glass-surface class', () => {
  expect(componentCode).not.toMatch(/glass-surface/);
});

test('should use component tokens', () => {
  expect(cssCode).toMatch(/var\(--xeg-comp-modal-bg\)/);
});
```

#### Green (최소 구현)

```typescript
// 최소한의 수정으로 테스트 통과
const innerClass = ComponentStandards.createClassName(
  styles.modal,
  styles.inner
  // 'glass-surface' 제거
);
```

#### Refactor (품질 개선)

```css
/* 스타일 품질 개선 */
.modal {
  background: var(--xeg-comp-modal-bg); /* 컴포넌트 토큰 사용 */
  border: 1px solid var(--xeg-comp-modal-border);
}
```

## 🎨 코딩 가이드라인 준수

### 타입 안전성

- TypeScript strict 모드 100% 준수
- 모든 props에 명시적 타입 정의
- readonly 인터페이스 사용

### 의존성 격리

- getter 함수를 통한 외부 라이브러리 접근
- 모킹 가능한 구조 설계

### PC 환경 전용

- 터치 이벤트 사용 금지
- 키보드/마우스 이벤트만 지원

## 🔍 품질 보증

### 테스트 커버리지

- 단위 테스트: 컴포넌트별 기능 검증
- 통합 테스트: 테마 전환 시나리오
- 시각적 테스트: 다크/라이트 모드 렌더링

### 성능 최적화

- CSS 변수 기반 테마 전환 (리페인트 최소화)
- 메모이제이션된 컴포넌트 사용
- 불필요한 리렌더링 방지

### 접근성

- 고대비 모드 지원
- 키보드 네비게이션
- 스크린 리더 호환성

## 📈 예상 결과

### 테스트 성공률

- **현재**: 146/178 테스트 통과 (82.0%)
- **1단계 목표**: 테스트 충돌 해결 → 155/178 (87.1%)
- **최종 목표**: 178/178 테스트 통과 (100%)

### 코드 품질 개선

- 일관된 CSS 토큰 아키텍처
- 충돌 없는 테스트 슈트
- 명확한 다크 테마 지원
- 확장 가능한 디자인 시스템

### 개발자 경험

- 명확한 테마 토큰 구조 (`--xeg-comp-*` 체계)
- 일관된 glassmorphism 구현
- 안정적이고 모순 없는 테스트
- 쉬운 새 컴포넌트 추가

## 🔧 다음 단계

### 즉시 실행 항목

1. **테스트 충돌 분석 및 해결**
   - glass-surface 관련 테스트 정책 결정
   - 일관된 토큰 체계 확립

2. **SettingsModal 토큰 일관성 확보**
   - `--xeg-modal-bg` → `--xeg-comp-modal-bg` 통일
   - 또는 테스트 요구사항 수정

3. **최종 검증**
   - 모든 컴포넌트 다크 테마 동작 확인
   - 시스템 테마 자동 감지 테스트

---

**🎯 핵심 목표**: 상충하는 테스트를 해결하여 일관된 CSS 토큰 아키텍처를
확립하고, TDD 원칙을 통해 안전하게 다크 테마 일관성을 확보한다.

**⚠️ 우선 과제**: 현재 glass-surface 클래스와 토큰 체계에 대한 모순된 테스트
요구사항을 분석하여 통일된 아키텍처 방향을 설정해야 한다.
