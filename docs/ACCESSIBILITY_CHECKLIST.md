# 접근성 체크리스트 (WCAG 2.1 Level AA)

> **목적**: 프로젝트의 접근성 준수 상태 추적  
> **최종 업데이트**: 2025-10-26 | **테스트**: axe-core 34/34 ✅

---

## 📊 준수 현황

| 항목                  | 상태 | 근거                                |
| --------------------- | ---- | ----------------------------------- |
| **자동화 테스트**     | ✅   | Playwright + axe-core 34/34         |
| **키보드 내비게이션** | ✅   | Arrow/Home/End/Escape 지원          |
| **색상 대비**         | ✅   | OKLCH 디자인 토큰 시스템            |
| **ARIA 패턴**         | ✅   | role, aria-label, Live Region       |
| **포커스 관리**       | ✅   | FocusRestoreManager 구현            |
| **스크린 리더**       | ⚠️   | 자동 테스트만 (수동 검증 필요)      |
| **200% 확대**         | ⚠️   | 상대 단위 사용 (레이아웃 확인 필요) |

---

## ✅ 구현 완료

### 기본 구조

- ✅ 시맨틱 HTML (`<button>`, `<nav>`, `role="dialog"`)
- ✅ 고유 ID (`uuid-generator.ts`)
- ✅ 유효한 HTML 구조

### 키보드

- ✅ 모든 기능 키보드 접근 가능
- ✅ Tab 순서 = 논리적 순서
- ✅ 포커스 트랩 없음 (Escape로 닫기 가능)
- ✅ `:focus-visible` CSS

### 색상 & 대비

- ✅ WCAG AA 색상 대비 (토큰 검증)
- ✅ 색상만으로 정보 전달 안함
- ✅ 아이콘 + 텍스트 병행

### ARIA & Live Region

- ✅ `aria-label`, `aria-labelledby`, `aria-hidden`
- ✅ `role="dialog"`, `role="button"`
- ✅ Live Region (polite/assertive)
- ✅ 포커스 복원 (`FocusRestoreManager`)

### 버튼 & 링크

- ✅ 설명적 레이블
- ✅ 명확한 목적
- ✅ 텍스트 + 아이콘

### 입력 필드

- ✅ 레이블 제공
- ✅ placeholder로 예시 제공
- ✅ 입력 오류 알림 (Toast)

---

## ⚠️ 부분 구현 / 수동 검증 필요

| 항목                      | 상태 | 다음 단계             |
| ------------------------- | ---- | --------------------- |
| 스크린 리더 전체 흐름     | ⚠️   | NVDA/JAWS 수동 테스트 |
| 200% 텍스트 확대 레이아웃 | ⚠️   | 브라우저 확대 검증    |
| 갤러리 이미지 설명        | ⚠️   | aria-label 개선       |
| 고대비 모드               | ⚠️   | Windows 고대비 검증   |

---

## 🧪 테스트 현황

| 테스트 유형            | 도구                  | 상태    | 개수  |
| ---------------------- | --------------------- | ------- | ----- |
| **자동화 (E2E)**       | Playwright + axe-core | ✅ PASS | 34/34 |
| **단위**               | Vitest                | ✅ PASS | 5     |
| **스크린 리더 (수동)** | NVDA/JAWS             | ⚠️ 필요 | -     |

---

## 🎯 참고 문서

| 항목            | 위치                              |
| --------------- | --------------------------------- |
| **E2E 테스트**  | `playwright/accessibility/`       |
| **단위 테스트** | `test/unit/accessibility/`        |
| **ARIA 유틸**   | `src/shared/utils/accessibility/` |
| **코딩 규칙**   | `docs/CODING_GUIDELINES.md`       |
| **테스트 전략** | `docs/TESTING_STRATEGY.md`        |

---

## 📌 PC 전용 정책

프로젝트는 **PC 환경만 지원**합니다. 따라서:

- ✅ Touch/Pointer 이벤트 금지 (모바일 제스처 불필요)
- ✅ 터치 타겟 크기 검증 제외
- ✅ 데스크톱 키보드 단축키만 지원

---

**마지막 검증**: 2025-10-26 (`npm run e2e:a11y` 모두 통과)
