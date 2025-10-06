# TDD 리팩토링 활성 계획 (2025-10-07 갱신)

> 목표: 충돌/중복/분산·레거시 코드를 줄이고, 아키텍처·토큰·입력 정책 위반을
> 테스트로 고정하며, UI/UX 일관성과 안정성을 높인다. 모든 변경은 실패 테스트 →
> 최소 구현 → 리팩토링 순으로 진행한다.

- 근거 문서: `docs/ARCHITECTURE.md`, `docs/CODING_GUIDELINES.md`,
  `docs/DEPENDENCY-GOVERNANCE.md`
- 환경: Vitest + JSDOM, 기본 URL https://x.com, vendors/userscript는
  getter/adapter로 모킹
- 공통 원칙: 최소 diff, 3계층 단방향(Features → Shared → External), PC 전용
  입력, CSS Modules + 디자인 토큰만

---

## 0) 현재 상태 점검 요약

- 품질 게이트: typecheck, lint, smoke/fast 테스트 GREEN. dev/prod 빌드 및
  postbuild validator 정상 동작 중.
- Vendors: 정적 매니저(`StaticVendorManager`) 경유 정책 준수. 테스트 모드 자동
  초기화 경고는 다운그레이드되어 소음 없음(완료 항목으로 이관됨).
- 레거시 표면: 동적 VendorManager(`vendor-manager.ts`)는 TEST-ONLY 유지. 갤러리
  런타임 `createAppContainer.ts` 스텁은 삭제 완료(테스트 하네스 전용 경로만
  사용).
- **fflate 의존성**: ✅ 완전 제거 완료 (2025-10-07). StoreZipWriter로 대체.
  자세한 내용은 `TDD_REFACTORING_PLAN_COMPLETED.md` 참조.

---

## 남은 작업(우선순위 및 순서)

### ⚡ 우선순위 1: Shadow DOM → Light DOM 완전 전환

**목표**: Shadow DOM을 Light DOM으로 완전히 전환하여 코드 복잡도를 낮추고,
스타일 격리는 기존 CSS Modules + Cascade Layers로 대체

**현황**:

- `GalleryRenderer.ts`에서 `useShadowDOM: true` 하드코딩
- `GalleryContainer.tsx`에서 Shadow DOM 마운트 로직 존재
- 스타일 격리를 위해 Shadow DOM에 `@import` 방식으로 CSS 주입 시도
- 프로젝트에 이미 CSS Modules + 디자인 토큰 + Cascade Layers 인프라 존재

**전환 방법 비교 분석**:

| 방법                    | 장점                                                  | 단점                                           | 적합도          |
| ----------------------- | ----------------------------------------------------- | ---------------------------------------------- | --------------- |
| **방법 1: 점진적 전환** | 위험 최소화 / 단계별 검증 / 롤백 용이 / TDD 흐름 적합 | 시간 소요 / 중간 상태 관리 필요                | ⭐⭐⭐⭐⭐ 최적 |
| 방법 2: 일괄 전환       | 빠른 완료 / 코드 간결화                               | 높은 위험 / 광범위한 테스트 필요 / 롤백 어려움 | ⭐⭐ 비권장     |
| 방법 3: Feature Flag    | A/B 테스트 가능 / 즉시 롤백                           | 코드 복잡도 증가 / 장기 유지보수 부담          | ⭐⭐⭐ 과도     |

**스타일 격리 전략 비교**:

| 전략                           | 장점                                                           | 단점                                                            | 적합도          |
| ------------------------------ | -------------------------------------------------------------- | --------------------------------------------------------------- | --------------- |
| **전략 A: CSS Cascade Layers** | 명시적 우선순위 / 유지보수 용이 / 기존 인프라 활용 / 표준 기반 | 브라우저 호환성 필요 (이미 사용 중)                             | ⭐⭐⭐⭐⭐ 최적 |
| 전략 B: Specificity 증가       | 간단한 구현 / 빠른 적용                                        | 유지보수 어려움 / Twitter 스타일 변경에 취약 / Specificity 전쟁 | ⭐⭐ 비권장     |
| 전략 C: CSS-in-JS              | 완전한 격리                                                    | 성능 저하 / 대규모 구조 변경 / 기존 CSS Modules 폐기            | ⭐ 비권장       |

**최적 솔루션 선택**: **방법 1 (점진적 전환) + 전략 A (CSS Cascade Layers)**

**선택 근거**:

1. 프로젝트 TDD 우선 원칙과 부합
2. `cascade-layers.css` 이미 존재하여 인프라 준비됨
3. CSS Modules로 클래스명 격리 이미 달성
4. `xeg-` 프리픽스로 네이밍 충돌 방지
5. 롤백 용이하여 리스크 최소화
6. 단계별 검증으로 품질 보장

**단계별 실행 계획**:

#### Phase 1: 사전 준비 및 테스트 RED 작성 (1차 커밋)

**목표**: Light DOM 전환 실패를 감지하는 테스트 작성

**작업**:

1. `test/refactoring/light-dom-transition.test.ts` 생성
   - Shadow DOM 사용 검증 테스트 (현재 PASS → 이후 RED 예정)
   - Light DOM 스타일 격리 검증 테스트 (현재 RED → 이후 PASS 목표)
   - Cascade Layers 우선순위 테스트 (현재 RED → 이후 PASS 목표)

2. 테스트 내용:

   ```typescript
   // Shadow DOM 사용 금지 검증 (RED → GREEN)
   describe('Shadow DOM 제거 검증', () => {
     it('GalleryRenderer에서 Shadow DOM을 사용하지 않아야 함', () => {
       const source = fs.readFileSync(
         'src/features/gallery/GalleryRenderer.ts',
         'utf8'
       );
       expect(source).not.toContain('useShadowDOM: true');
       expect(source).not.toContain('shadowRoot');
     });

     it('GalleryContainer에서 Shadow DOM 로직이 없어야 함', () => {
       const source = fs.readFileSync(
         'src/shared/components/isolation/GalleryContainer.tsx',
         'utf8'
       );
       expect(source).not.toContain('attachShadow');
       expect(source).not.toContain('shadowRoot');
     });
   });

   // Light DOM 스타일 격리 검증 (RED → GREEN)
   describe('Light DOM 스타일 격리', () => {
     it('갤러리 컨테이너에 xeg- 프리픽스 루트 클래스가 있어야 함', () => {
       // DOM에서 .xeg-gallery-root 검증
     });

     it('Cascade Layers가 올바른 순서로 정의되어야 함', () => {
       // cascade-layers.css 파싱 및 순서 검증
     });

     it('갤러리 스타일이 Twitter 스타일보다 높은 우선순위를 가져야 함', () => {
       // Computed styles 검증
     });
   });
   ```

**수용 기준**:

- [ ] 테스트 파일 생성 완료
- [ ] Shadow DOM 사용 검증 테스트 PASS (현재 상태)
- [ ] Light DOM 스타일 격리 테스트 RED (전환 전 실패)
- [ ] `npm test` 실행 시 새 테스트만 RED, 기존 테스트 GREEN

---

#### Phase 2: Cascade Layers 강화 (2차 커밋)

**목표**: 스타일 우선순위 명확화 및 격리 강화

**작업**:

1. `src/shared/styles/cascade-layers.css` 갱신

   ```css
   /* 갤러리 전용 레이어 추가 */
   @layer reset, tokens, base, twitter-compat, layout, components, gallery, utilities, overrides;

   /**
    * Twitter Compatibility Layer
    * Twitter/X.com의 기본 스타일보다 낮은 우선순위 유지
    */
   @layer twitter-compat {
     /* Twitter 스타일 호환성 보정 */
   }

   /**
    * Gallery Layer
    * 갤러리 전용 스타일을 별도 레이어로 격리
    * components보다 높은 우선순위
    */
   @layer gallery {
     /* 갤러리 전역 스타일 포함 */
     @import url('../../features/gallery/styles/gallery-global.css');
   }
   ```

2. `src/features/gallery/styles/gallery-global.css` 갱신
   - 모든 스타일을 `@layer gallery` 내부로 이동
   - `.xeg-gallery-root` 루트 클래스 추가로 specificity 보강

**수용 기준**:

- [ ] Cascade Layers 순서 정의 완료
- [ ] 갤러리 스타일 레이어 분리 완료
- [ ] Cascade Layers 우선순위 테스트 GREEN
- [ ] 기존 스타일 정상 동작 (시각 회귀 테스트)

---

#### Phase 3: Light DOM 전환 (3차 커밋)

**목표**: Shadow DOM 제거 및 Light DOM으로 전환

**작업**:

1. `src/features/gallery/GalleryRenderer.ts` 수정

   ```typescript
   // 변경 전
   useShadowDOM: true,

   // 변경 후
   useShadowDOM: false,
   ```

2. `src/shared/components/isolation/GalleryContainer.tsx` 검증
   - `useShadowDOM = false` 기본값 유지 확인
   - Light DOM 폴백 경로 정상 동작 확인

3. 테스트 실행 및 검증
   ```bash
   npm run test:refactor
   npm run test:styles
   npm run test:unit
   ```

**수용 기준**:

- [ ] `useShadowDOM: false` 적용 완료
- [ ] Shadow DOM 사용 금지 테스트 GREEN
- [ ] Light DOM 스타일 격리 테스트 GREEN
- [ ] 전체 테스트 스위트 GREEN
- [ ] dev/prod 빌드 정상

---

#### Phase 4: Shadow DOM 코드 제거 (4차 커밋)

**목표**: 사용하지 않는 Shadow DOM 로직 완전 제거

**작업**:

1. `src/shared/components/isolation/GalleryContainer.tsx` 리팩토링
   - `useShadowDOM` prop 제거
   - `mountGallery` 함수에서 Shadow DOM 분기 제거
   - 단순화된 Light DOM 전용 마운트 로직으로 교체

2. 타입 정의 갱신

   ```typescript
   // GalleryContainerProps에서 useShadowDOM 제거
   export interface GalleryContainerProps {
     children: ComponentChildren;
     onClose?: () => void;
     className?: string;
     // useShadowDOM?: boolean; ← 제거
   }
   ```

3. 관련 주석 및 문서 갱신

**수용 기준**:

- [ ] Shadow DOM 관련 코드 완전 제거
- [ ] 타입 오류 없음 (`npm run typecheck` GREEN)
- [ ] 린트 오류 없음 (`npm run lint` GREEN)
- [ ] 전체 테스트 GREEN
- [ ] 번들 사이즈 감소 확인

---

#### Phase 5: 통합 테스트 및 문서화 (최종 커밋)

**목표**: 전환 완료 검증 및 문서 정리

**작업**:

1. Playwright E2E 테스트 실행

   ```bash
   npm run test:e2e
   ```

2. 시각 회귀 테스트
   - 다크/라이트 모드 전환
   - 다양한 화면 크기
   - Twitter UI와의 통합

3. 문서 갱신
   - `ARCHITECTURE.md`: 스타일 격리 전략 업데이트
   - `CODING_GUIDELINES.md`: Shadow DOM 제거 명시
   - `TDD_REFACTORING_PLAN_COMPLETED.md`: 완료 항목 이관

4. 커밋 메시지

   ```
   refactor: migrate from Shadow DOM to Light DOM with Cascade Layers

   BREAKING CHANGE: Shadow DOM support removed

   - Remove useShadowDOM prop from GalleryContainer
   - Simplify mounting logic to Light DOM only
   - Strengthen style isolation with CSS Cascade Layers
   - Add gallery-specific layer for proper priority
   - All tests GREEN, visual regression passed

   Fixes #<issue-number>
   ```

**수용 기준**:

- [ ] E2E 테스트 PASS
- [ ] 시각 회귀 테스트 PASS
- [ ] 문서 업데이트 완료
- [ ] 전체 품질 게이트 GREEN:
  - `npm run typecheck` ✅
  - `npm run lint` ✅
  - `npm test` ✅
  - `npm run build:dev` ✅
  - `npm run build:prod` ✅
  - `node scripts/validate-build.js` ✅

---

**리스크 및 롤백 계획**:

리스크:

1. Twitter/X.com 스타일과의 충돌
   - 완화: Cascade Layers + specificity로 우선순위 보장
   - 모니터링: 시각 회귀 테스트로 조기 감지

2. 브라우저 호환성 (Cascade Layers)
   - 완화: 이미 cascade-layers.css 사용 중, 호환성 검증됨
   - 폴백: Cascade Layers 미지원 시 specificity로 대체

3. 예상치 못한 스타일 누수
   - 완화: CSS Modules + xeg- 프리픽스로 네임스페이스 격리
   - 모니터링: E2E 테스트 + 사용자 피드백

롤백 계획:

1. **Phase 1-2**: 테스트만 작성, 롤백 불필요
2. **Phase 3**: `useShadowDOM: true`로 되돌리기 (단일 파일 수정)
3. **Phase 4**: Git revert로 Shadow DOM 코드 복원
4. **Phase 5**: Git revert로 이전 커밋 복원

**마일스톤**:

- Phase 1-2: 준비 단계 (1일)
- Phase 3: 전환 실행 (1일)
- Phase 4: 정리 단계 (1일)
- Phase 5: 검증 및 문서화 (1일)
- **총 예상 기간**: 4일

---

## 품질 게이트 (작업 중 반복 확인)

## 참고/정책 고지

---

## 부록 — SOURCE PATH RENAME / CLEANUP PLAN (정리됨)

> 목적: 레거시/혼동 가능 경로를 식별하고, 안전한 단계별 리네임/정리를 통해

- 근거/제약: 3계층 단방향(Features → Shared → External), vendors/userscript
  getter 규칙, PC-only, CSS Tokens, 테스트 우선(TDD)

### 스코프(1차)

- (해결) B/C/F 항목은 TEST-ONLY/LEGACY 표면 유지 정책으로 확정되었습니다. 활성
  계획에서는 제외되었으며, 완료 로그에서 가드/수용 기준과 함께 추적합니다.

### 후보와 제안

- 해당 없음(완료 로그 참조). 필요 시 후속 스캔/가드 강화만 수행.

### 단계별 실행 순서(요약 현행화)

- 현재 없음 — 신규 관찰 대상이 생기면 추가.

### 리스크/롤백

- 리스크: 테스트 경로 의존(특히 vendor-manager.ts) 및 스캔 규칙 민감도
- 롤백: re-export 유지, 배럴 되돌림, 문서/테스트만 수정으로 복구 가능

### 수용 기준(전역)

- deps-cruiser 순환/금지 위반 0
- src/\*\*에서 TEST-ONLY/LEGACY 대상의 런타임 import 0
- 번들 문자열 가드 PASS(VendorManager 등 금지 키워드 0)
- 전체 테스트/빌드/포스트빌드 GREEN
