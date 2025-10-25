# test/unit/features/scroll - 스크롤 동작 테스트

> 갤러리 스크롤 동작 및 스크롤 체이닝 방지 메커니즘 검증

**최종 업데이트**: 2025-10-25 (Phase 185)

## 📂 디렉터리 구조

```
scroll/
├── behavior.test.ts          # 네이티브 스크롤 동작 검증
├── behavior-native.test.tsx  # 브라우저 네이티브 스크롤 전환 검증
└── chaining/
    ├── boundary.test.ts      # 스크롤 경계 조건 검증
    ├── css.test.ts           # CSS overscroll-behavior 검증
    ├── events.test.ts        # 이벤트 기반 방지 패턴 테스트
    └── dynamic-content.test.ts  # 동적 콘텐츠 로딩 시나리오
```

## 🎯 파일별 목적

### behavior.test.ts (232줄)

**목표**: 네이티브 스크롤 동작이 올바르게 작동하는지 검증

- 휠 이벤트 처리
- 스크롤 범위 내 콘텐츠 이동
- 경계에서의 스크롤 정지

### behavior-native.test.tsx (115줄)

**목표**: 브라우저 네이티브 스크롤로의 전환 검증

- CSS `overflow:auto` 동작 확인
- 수동 `scrollBy()` 호출 제거 검증
- 포지션 계산 정확성

### chaining/boundary.test.ts (406줄)

**목표**: 스크롤 경계에서 페이지 스크롤 방지 검증

- 갤러리 경계 감지 로직
- 경계에서의 스크롤 이벤트 처리
- CSS `overscroll-behavior` 동작

### chaining/css.test.ts (207줄)

**목표**: CSS 기반 스크롤 체이닝 방지 검증

- `overscroll-behavior: none` 적용 확인
- CSS 우선순위 및 상속
- 브라우저 호환성

### chaining/events.test.ts (425줄)

**목표**: 이벤트 기반 스크롤 체이닝 방지 패턴 검증

- `preventDefault()` 효과 검증
- `stopPropagation()` 동작
- 이벤트 배칭 및 최적화

### chaining/dynamic-content.test.ts (600줄)

**목표**: 동적 콘텐츠 로딩 중 스크롤 체이닝 방지 검증

- 무한 스크롤 (아이템 추가)
- 아이템 제거 시 경계 업데이트
- 이미지 지연 로딩 중 안정성
- 비동기 콘텐츠 로딩

## ✅ 테스트 현황

| 파일                      | 상태     | 설명                      |
| ------------------------- | -------- | ------------------------- |
| behavior.test.ts          | ✅ GREEN | 네이티브 스크롤 동작 검증 |
| behavior-native.test.tsx  | ✅ GREEN | 브라우저 전환 검증        |
| chaining/boundary.test.ts | ✅ GREEN | 경계 조건 검증            |
| chaining/css.test.ts      | ✅ GREEN | CSS 방식 검증             |
| chaining/events.test.ts   | ✅ GREEN | 이벤트 패턴 검증          |
| chaining/dynamic-content  | ✅ GREEN | 동적 콘텐츠 검증          |

**총계**: 6개 파일, 모두 GREEN 테스트 ✅

## 🔗 관련 구현

- `src/features/gallery/hooks/useGalleryScroll.ts` - 갤러리 스크롤 로직
- `src/features/gallery/components/vertical-gallery-view/VerticalGalleryView.module.css` -
  스크롤 스타일
- `src/shared/styles/performance.css` - 스크롤 최적화

## 📝 작성 및 실행

### 테스트 실행

```bash
# 전체 스크롤 테스트
npm run test -- --include='**/scroll/**/*.test.ts*'

# 특정 파일만 테스트
npm run test -- test/unit/features/scroll/chaining/css.test.ts
```

### 파일명 규칙

- kebab-case 준수: `behavior-native.test.tsx`
- 의미 명확: 스크롤 종류 (behavior, chaining) + 구현 방식 (css, events)
- 중첩 구조: 스크롤 체이닝은 `chaining/` 하위 폴더

---

**마지막 검증**: npm run build ✅ | npm run validate ✅ | npm test ✅
