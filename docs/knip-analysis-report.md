# knip 분석 결과 요약 (Phase 4 - Unused Exports Removal)

## 실행 정보

- 날짜: 2025-10-06 08:15:00
- 브랜치: feat/bundle-size-phase4-orphan-cleanup
- knip 버전: 5.64.1

## 전체 통계

- 미사용 파일 (files): 96개
  - test/\* : ~70개 (번들 영향 없음)
  - scripts/\* : ~8개 (번들 영향 없음)
  - **src/\* : 18개 (번들 영향 있음)** ⚠️

- 미사용 exports (issues): 약 111개
  - types/interfaces: ~90% (런타임 영향 없음)
  - 중복 exports: ~10개
  - 실제 구현체: 소수

## 번들 크기 영향 분석

### 높은 우선순위 (즉시 제거 가능)

1. **createParitySnapshot.ts** (2개)
   - src/features/gallery/solid/createParitySnapshot.ts
   - src/features/settings/solid/createParitySnapshot.ts
   - 목적: Solid 마이그레이션 테스트 헬퍼 (개발용)
   - 제거 가능: ✅ (프로덕션 코드에서 미사용)

2. **solid-jsx-dev-runtime.ts**
   - src/shared/polyfills/solid-jsx-dev-runtime.ts
   - 목적: DEV 전용 폴리필
   - 상태: 이미 문서화됨 (intentionally kept for DEV)
   - 제거 가능: ❌ (DEV 환경 필수)

3. **vendor-api.ts**
   - src/shared/external/vendors/vendor-api.ts
   - 검토 필요: 벤더 타입 정의, 실제 사용 여부 확인 필요

### 중간 우선순위 (신중한 검토 필요)

4. **VerticalGalleryView.tsx**
   - src/features/gallery/components/vertical-gallery-view/VerticalGalleryView.tsx
   - 의심: 레거시 컴포넌트? 실제 사용처 확인 필요

5. **UnifiedSettingsModal.tsx**
   - src/shared/components/ui/SettingsModal/UnifiedSettingsModal.tsx
   - 검토: 통합 전 레거시 버전?

6. **서비스 파일들**
   - src/shared/services/core-icons.ts
   - src/shared/services/event-managers.ts
   - src/shared/services/icon-types.ts
   - src/shared/services/media-mapping/MediaMappingService.ts
   - src/shared/services/media-mapping/MediaTabUrlDirectStrategy.ts
   - 검토: 실제 미사용 또는 dynamic import로 인한 오탐?

### 낮은 우선순위 (타입 정의)

7. **types.ts**
   - src/features/gallery/types.ts
   - 타입만 포함, 런타임 영향 없음

8. **인터페이스/유틸리티**
   - src/shared/interfaces/ServiceInterfaces.ts
   - src/shared/styles/theme-utils.ts
   - src/shared/utils/accessibility/barrel.ts
   - src/shared/utils/dom/BatchDOMUpdateManager.ts
   - src/shared/utils/position-calculator.ts
   - src/shared/utils/styles/style-utils.ts
   - 대부분 타입 또는 헬퍼, 선택적 제거

## 예상 번들 크기 감축

- **즉시 제거 가능 (Phase 4A)**: ~5-8 KB
  - createParitySnapshot.ts (2개): ~2-3 KB
  - 검증된 미사용 서비스: ~3-5 KB

- **신중한 검토 후 제거 (Phase 4B)**: ~5-10 KB
  - 레거시 컴포넌트/서비스
  - Dynamic import로 인한 오탐 제외 후

- **총 예상 감축**: ~10-18 KB (Option D 목표치 내)

## 다음 단계

1. ✅ knip 분석 완료
2. ⏳ 파일별 상세 검토 (grep/semantic search)
3. ⏳ TDD_REFACTORING_PLAN.md 작성
4. ⏳ Phase 4A 실행 (즉시 제거 가능 항목)
5. ⏳ Phase 4B 실행 (검토 후 제거)
