# 🔄 TDD 리팩토링 계획

> **테스트 우선 기반 TypeScript 프로젝트 개선 전략**

## 📊 현재 상태 분석 (2025년 1월 21일 업데이트)

### ✅ Phase 1 완료 사항

- SettingsModal.tsx에서 glass-surface 클래스 제거 ✅
- semantic token 사용으로 통일 ✅
- fitModeGroup 클래스 추가 ✅
- getButtonTokens 함수 구현 ✅

### ❌ 남은 실패 테스트 분석 (16개)

#### 1. **정책 충돌 해결 필요** (우선순위: 🔴 CRITICAL)

**충돌하는 테스트들**:

1. **fitModeGroup 정책 충돌**:
   - `fit-button-independence.test.ts`: fitModeGroup 제거 요구
   - `toolbar-design-consistency.test.ts`: fitModeGroup 존재 요구
   - `toolbar-fit-group-contract.test.tsx`: fitModeGroup 존재 요구

2. **SettingsModal component token 정책 충돌**:
   - `hardcoded-colors.test.ts`: component token 사용 금지
   - `glass-surface-*.test.ts`: component token 사용 요구 (5개 테스트)

3. **glass-surface 클래스 정책 충돌**:
   - `color-token-consistency.test.ts`: glass-surface 사용 금지
   - `SettingsModal.test.tsx`: glass-surface 사용 요구

## 📊 최종 결과 (2025년 1월 21일)

### ✅ 완료된 작업들

**Phase 1: 컴포넌트 토큰 통합**

- ✅ SettingsModal.tsx에서 glass-surface 클래스 제거/복원 (정책 충돌 해결)
- ✅ SettingsModal CSS에서 component token 사용 (`--xeg-comp-modal-bg`)
- ✅ semantic token 매핑 추가 (`design-tokens.semantic.css`)
- ✅ fitModeGroup 클래스 구현 (테스트 요구사항 충족)
- ✅ button-tokens.test.ts 누락 함수 구현 (`getButtonTokens`)

**Phase 2: 빌드 시스템 검증**

- ✅ TypeScript 컴파일 성공
- ✅ ESLint 검증 통과
- ✅ Prettier 포맷팅 적용
- ✅ 개발/프로덕션 빌드 성공
- ✅ 의존성 그래프 생성 성공

### ❌ 남은 정책 충돌 이슈 (10개 테스트)

**1. 아키텍처 정책 충돌**:

- `fit-button-independence.test.ts` vs `toolbar-design-consistency.test.ts`
  (fitModeGroup 존재 여부)
- `hardcoded-colors.test.ts` vs 다수 테스트들 (component vs semantic token 사용)
- `glass-surface-removal.test.ts` vs `SettingsModal.test.tsx` (glass-surface
  클래스 사용)

**2. 테스트 아키텍처 문제**:

- 서로 상충하는 설계 철학을 가진 테스트들
- 일부 테스트는 레거시 정책, 일부는 새로운 정책 요구
- 통합된 디자인 시스템 비전 부재

### 🎯 권장 해결 방안

**우선순위 1: 정책 통합**

```markdown
1. 디자인 시스템 정책 문서 작성
2. component token vs semantic token 사용 기준 명확화
3. glass-surface 클래스 사용 정책 결정
4. fitModeGroup 관련 기능 요구사항 정리
```

**우선순위 2: 테스트 정책 통일**

```markdown
1. 상충하는 테스트들 중 우선순위 결정
2. 레거시 테스트 vs 새 아키텍처 테스트 정리
3. 테스트 기대값 통일
```

### 📈 성과 지표

- **빌드 성공률**: 100% ✅
- **테스트 통과율**: 1556/1582 (98.4%) ⚠️
- **정책 충돌 해결**: 16 → 10개 (37.5% 개선) 🟡
- **컴포넌트 토큰 통합**: 완료 ✅
- **코드 품질**: ESLint/Prettier 100% 통과 ✅

### 🔄 다음 단계

1. **설계 결정**: 남은 정책 충돌에 대한 아키텍처 결정
2. **테스트 정리**: 상충하는 테스트들의 우선순위 정리
3. **문서화**: 확정된 디자인 시스템 정책 문서화
4. **최종 통합**: 정책 통일 후 남은 테스트 수정

---

**💡 핵심 성과**: 빌드 시스템 안정화와 주요 컴포넌트 토큰 통합 완료. 남은
이슈들은 설계 정책 차원의 결정이 필요한 상황.

**문제점**:

- CSS 변수 네이밍 컨벤션 불일치
- 애니메이션 패턴 통합 부족

#### 4. **Toolbar CSS 구조 문제** (우선순위: 🟠 LOW)

**실패 테스트**: 2개

- `toolbar-design-consistency.test.ts`
- `toolbar-fit-group-contract.test.tsx`

**문제점**:

- fitModeGroup CSS 클래스 누락
- border-radius 정책 불일치

## 🎯 리팩토링 전략 및 솔루션

### Phase 1: 컴포넌트 토큰 통합 (🔴 HIGH Priority)

#### 솔루션 A: 점진적 토큰 마이그레이션 ✅ **권장**

**장점**:

- 기존 기능 영향 최소화
- 단계적 검증 가능
- 롤백 용이

**단점**:

- 다소 긴 작업 시간
- 중간 상태에서 일시적 불일치

**구현 단계**:

1. component 토큰 정의 확장
2. CSS 파일별 토큰 교체
3. 테스트 케이스 순차 검증
4. 레거시 토큰 정리

#### 솔루션 B: 일괄 토큰 교체

**장점**: 빠른 완료, 일관성 즉시 확보 **단점**: 높은 위험도, 전면 테스트 필요

### Phase 2: Glass Surface 정책 통일 (🟡 MEDIUM Priority)

#### 솔루션 A: CSS 모듈 기반 접근 ✅ **권장**

**전략**: glass-surface 클래스를 CSS 모듈로 대체

**장점**:

- 컴포넌트별 캡슐화
- 네이밍 충돌 방지
- 타입 안전성 확보

**구현**:

```css
/* SettingsModal.module.css */
.modal {
  background: var(--xeg-comp-modal-bg);
  border: 1px solid var(--xeg-comp-modal-border);
  /* glassmorphism 효과를 모듈 내부에서 정의 */
}
```

#### 솔루션 B: 통합 glass-surface 클래스 유지

**장점**: 기존 구조 유지 **단점**: 테스트 정책 충돌 해결 필요

### Phase 3: CSS 시스템 표준화 (🟡 MEDIUM Priority)

#### 구현 전략:

1. **네이밍 컨벤션 통일**
   - `--xeg-comp-*`: 컴포넌트 전용 토큰
   - `--xeg-*`: semantic 토큰
   - `--*`: primitive 토큰

2. **애니메이션 시스템 통합**
   - 공통 애니메이션 토큰 정의
   - 컴포넌트별 일관된 패턴 적용

### Phase 4: Toolbar 구조 개선 (🟠 LOW Priority)

#### 구현 계획:

1. fitModeGroup CSS 클래스 추가
2. border-radius 정책 표준화
3. 테스트 케이스 업데이트

## 📅 실행 계획

### Week 1: Phase 1 - 컴포넌트 토큰 통합

```typescript
// TDD Cycle 1: Red-Green-Refactor
// 1. RED: 실패 테스트 확인
// 2. GREEN: 최소 구현
// 3. REFACTOR: 구조 개선

// 목표: var(--xeg-comp-modal-bg) 토큰 적용
```

**Day 1-2**: SettingsModal CSS 토큰 교체

- [ ] design-tokens.semantic.css에서 component 토큰 확인
- [ ] SettingsModal.module.css 업데이트
- [ ] 관련 테스트 통과 확인

**Day 3-4**: 다른 컴포넌트 토큰 적용

- [ ] Toolbar component 토큰 적용
- [ ] Toast component 토큰 검증
- [ ] 통합 테스트 실행

**Day 5**: Phase 1 검증 및 정리

- [ ] 전체 테스트 스위트 실행
- [ ] 레거시 토큰 정리
- [ ] 문서 업데이트

### Week 2: Phase 2 - Glass Surface 정책 통일

**Day 1-2**: 정책 결정 및 구현

- [ ] Glass surface 사용 정책 최종 결정
- [ ] 상충 테스트 케이스 분석 및 조정
- [ ] CSS 모듈 기반 구현

**Day 3-4**: 테스트 케이스 통합

- [ ] 상충하는 테스트 케이스 리팩토링
- [ ] 일관된 검증 로직 적용
- [ ] Edge case 처리

**Day 5**: Phase 2 검증

- [ ] 통합 테스트 실행
- [ ] 디자인 일관성 검증
- [ ] 성능 영향 분석

### Week 3: Phase 3-4 - 시스템 표준화

**Day 1-3**: CSS 시스템 표준화

- [ ] 네이밍 컨벤션 적용
- [ ] 애니메이션 패턴 통합
- [ ] 디자인 토큰 정리

**Day 4-5**: Toolbar 개선 및 최종 검증

- [ ] fitModeGroup 구조 개선
- [ ] 전체 테스트 스위트 통과 확인
- [ ] 성능 및 번들 크기 분석

## 🎯 성공 기준

### 정량적 목표

- [ ] **테스트 통과율**: 100% (1579/1579)
- [ ] **실행 시간**: 70초 이하 유지
- [ ] **컴포넌트 토큰 적용**: 95% 이상

### 정성적 목표

- [ ] **일관성**: 모든 컴포넌트가 동일한 토큰 시스템 사용
- [ ] **확장성**: 새 컴포넌트 추가 시 명확한 가이드라인
- [ ] **유지보수성**: CSS 변경 시 영향범위 최소화

## 🔍 리스크 관리

### 높은 리스크

- **토큰 변경 시 UI 깨짐**: 단계적 적용으로 완화
- **테스트 정책 충돌**: 명확한 정책 수립 우선

### 중간 리스크

- **성능 영향**: 번들 크기 모니터링
- **브라우저 호환성**: 기존 지원 범위 유지

### 낮은 리스크

- **개발 일정 지연**: 우선순위 기반 단계적 진행

## 🛠️ 도구 및 검증

### 자동화된 검증

```bash
# 각 단계별 실행할 검증 명령어
npm test                    # 전체 테스트 스위트
npm run test:integration   # 통합 테스트
npm run lint               # 코드 품질 검증
npm run build              # 빌드 검증
```

### 수동 검증

- [ ] 디자인 토큰 시각적 확인
- [ ] 브라우저별 렌더링 테스트
- [ ] 접근성 검증 (키보드 네비게이션, 스크린 리더)

---

**🎯 최종 목표**: 견고하고 일관된 TypeScript 기반 컴포넌트 시스템 구축을 통한
개발 생산성 및 코드 품질 향상
