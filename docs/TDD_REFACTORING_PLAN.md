# TDD 리팩토링 계획

**마지막 업데이트**: 2025-10-27 | **상태**: Phase 209 완료 ✅

---

## 📊 현황 요약

| 항목          | 상태            | 비고                        |
| ------------- | --------------- | --------------------------- |
| 빌드          | ✅ 안정         | 병렬화 + 메모리 최적화 완료 |
| 성능          | ✅ 14.7% 향상   | 병렬 실행으로 7.3초 단축    |
| 테스트        | ✅ 82/87 E2E    | 5 skipped, 모두 통과        |
| 접근성 테스트 | ✅ 33/33 통과   | 통합 완료                   |
| 타입/린트     | ✅ 0 errors     | 모두 통과                   |
| 의존성        | ✅ 0 violations | 3계층 구조 강제             |
| 번들 크기     | ✅ 341 KB       | 목표 ≤420 KB (79 KB 여유)   |
| Scripts       | ✅ 정리 완료    | JSDoc 현대화 및 표준 준수   |
| 문서          | ✅ 정리 완료    | 현대화 및 간결화            |
| 구성 파일     | ✅ 최적화 완료  | Phase 209 완료              |

---

## 🎯 활성 작업

### Phase 210 🔄 (2025-10-27) - Global Style Tokens Modernization

**목표**: (구) `src/assets/styles` 하위 전역 CSS를 `src/shared/styles` 체계로
편입하고 토큰 일관성을 회복한다.

**배경**:

- 애니메이션 토큰이 `design-tokens` 계층과 중복 정의되어 일관성이 깨짐
- `layout.css` 등에서 정의되지 않은 토큰(`--xeg-space-*`)이 사용되고 있어
  안전하지 않음
- 전역 CSS가 `@assets`에 남아 있어 SSOT(`@shared/styles`) 구조와 어긋남

**계획**:

1. [x] (과거) `src/assets/styles/**/*` 사용 현황을 점검하고 토큰/유틸 중복 및
       불필요 항목을 기록한다.
2. [x] 애니메이션/레이아웃 유틸을 `src/shared/styles` 구조로 재배치하고, 기존
       토큰 체계(primitive → semantic → component)를 활용하도록 갱신한다.
3. [x] `globals.ts`, 문서(`ARCHITECTURE.md`, `CODING_GUIDELINES.md`)와 관련
       테스트/스냅샷을 업데이트하고, 제거된 파일은 정리한다.

**수용 기준**:

- [ ] `npm run lint:css`, `npm run test:styles`, `npm run test:smoke`가 모두
      GREEN이다.
- [ ] `npm run build`가 통과한다.
- [ ] 새/기존 토큰 정의가 단일 소스로 정리되어 중복 정의나 미정의 토큰이 없다.
- [ ] 관련 문서가 최신 구조를 설명하며, 완료 후 계획은
      `TDD_REFACTORING_PLAN_COMPLETED.md`로 이관한다.

**예상 시간**: 4h

---

## 📝 새로운 Phase 템플릿

```markdown
### Phase XXX 🔄 (YYYY-MM-DD) - [작업 제목]

**목표**: [한 줄 설명]

**배경**:

- 현재 문제점
- 개선이 필요한 이유

**계획**:

1. [ ] 작업 항목 1
2. [ ] 작업 항목 2
3. [ ] 작업 항목 3

**수용 기준**:

- [ ] 테스트 통과 (unit + integration + E2E)
- [ ] 타입체크/린트 통과
- [ ] 빌드 크기 유지 (≤420 KB)
- [ ] 성능 저하 없음

**예상 시간**: X 시간
```

---

## 📚 참고 문서

- **완료 기록**:
  [TDD_REFACTORING_PLAN_COMPLETED.md](./TDD_REFACTORING_PLAN_COMPLETED.md)
  (Phase 197-208 포함)
- **아키텍처**: [ARCHITECTURE.md](./ARCHITECTURE.md)
- **코딩 규칙**: [CODING_GUIDELINES.md](./CODING_GUIDELINES.md)
- **테스트 전략**: [TESTING_STRATEGY.md](./TESTING_STRATEGY.md)
- **유지보수**: [MAINTENANCE.md](./MAINTENANCE.md)

---

## 💡 추천 다음 단계

### 성능 최적화

- [ ] **번들 크기 추가 최적화** - Tree shaking 개선, 중복 코드 제거
- [ ] **렌더링 성능** - 불필요한 Effect 제거, memo 최적화
- [ ] **네트워크 요청 최적화** - 병렬 요청, 캐싱 전략

### 코드 품질

- [ ] **테스트 커버리지 향상** - 현재 미테스트 영역 식별 및 추가
- [ ] **타입 안전성 강화** - any 타입 제거, strict null checks
- [ ] **접근성 개선** - WCAG AAA 수준 도달

### 개발자 경험

- [ ] **문서 시각화** - 아키텍처 다이어그램, 플로우차트
- [ ] **개발 도구 개선** - 더 빠른 HMR, 더 나은 에러 메시지
- [ ] **CI/CD 최적화** - 캐싱 전략, 병렬 작업 확대

---

**작성**: 2025-10-26 | **최종 업데이트**: 2025-10-27
