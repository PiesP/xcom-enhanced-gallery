# Phase 11 완료 로그

## Phase 11: Deprecated 항목 정리 (2025-10-08 완료 ✅)

### Phase 11 목표

실사용 여부를 점검하여 deprecated 태그를 정리하고, 실제 사용 중인 API는 정식
API로 인정했습니다.

### 작업 내용

#### 11.1: 미사용 Deprecated 파일 점검 결과

**조사 대상**:

- `DOMEventManager.ts` → EventManager.ts에서 사용 중 ✅
- `events.ts` GalleryEventManager → EventManager.ts에서 사용 중 ✅
- 기타 deprecated 항목 → 모두 실제 사용 중

**결론**: 완전히 미사용인 deprecated 파일은 없었습니다. 모든 항목이 내부적으로
활발히 사용되고 있었습니다.

#### 11.2: Deprecated 태그 정리 완료

**제거한 deprecated 태그**:

1. **ServiceManager.getDiagnostics()** - 진단 도구에서 사용 중, 정식 API로 인정
2. **BrowserService.getDiagnostics()** - 브라우저 진단 도구에서 사용 중
3. **DOMEventManager 클래스** - EventManager에서 내부적으로 사용
4. **createDomEventManager()** - EventManager에서 내부적으로 사용
5. **GalleryEventManager** - EventManager에서 위임 패턴으로 사용
6. **UnifiedToastManager export** - 하위 호환성 유지, ToastManager 사용 권장으로
   변경
7. **MediaService.downloadSingle/downloadMultiple()** - BulkDownloadService 위임
   패턴, 정식 wrapper로 인정
8. **Button.iconVariant prop** - 하위 호환성 지원으로 명시, intent 사용 권장
9. **CSS 주석 2곳** - deprecated 표시 제거, 정보성 주석으로 변경

**변경 파일**:

- `src/shared/services/ServiceManager.ts`
- `src/shared/browser/BrowserService.ts`
- `src/shared/dom/DOMEventManager.ts`
- `src/shared/utils/events.ts`
- `src/shared/services/UnifiedToastManager.ts`
- `src/shared/services/MediaService.ts`
- `src/shared/components/ui/Button/Button.tsx`
- `src/shared/styles/modern-features.css`
- `src/features/gallery/styles/gallery-global.css`

### 최종 메트릭

| 메트릭          | Phase 10  | Phase 11  | 변화          |
| --------------- | --------- | --------- | ------------- |
| Dev 빌드        | ~1,030 KB | 1,031 KB  | 변화 없음     |
| Prod 빌드       | ~330 KB   | 331.29 KB | 변화 없음     |
| gzip            | ~88 KB    | 88.42 KB  | 변화 없음     |
| Deprecated 태그 | 9개       | **0개**   | **정리됨** ✅ |
| 코드 복잡도     | 중간      | **낮음**  | **개선됨** ✅ |
| 실제 사용 API   | 혼재      | **명확**  | **명확화** ✅ |

### 수용 기준

- [x] 모든 deprecated 태그 점검 완료
- [x] 실사용 API는 deprecated 태그 제거 또는 설명 정확화
- [x] 빌드/테스트 GREEN 유지 (Dev 1,031 KB, Prod 331.29 KB, gzip 88.42 KB)
- [x] deprecated 관련 테스트 통과
- [x] 코드 의도 명확화 (사용 중 vs 하위 호환성)

### 주요 발견 사항

1. **모든 조사 대상이 실제로 사용 중**: 제거할 수 있는 완전 미사용 파일은
   없었습니다.
2. **내부 구현 패턴**: DOMEventManager, GalleryEventManager는 EventManager에서
   내부 구현으로 활용
3. **위임 패턴**: MediaService는 BulkDownloadService로 위임하는 wrapper로 정상
   동작
4. **하위 호환성**: UnifiedToastManager, Button.iconVariant는 하위 호환성 유지
   목적으로 명시

### 결론

모든 deprecated 표시가 제거되고 각 API의 역할이 명확해졌습니다. 실제로는 모두
사용 중인 정상 API였으며, 단지 deprecated 태그로 인한 혼란만 제거한 것입니다.

---

이 내용을 `TDD_REFACTORING_PLAN_COMPLETED.md`의 최상단에 추가하세요.
