# 📋 Toolbar 기능 테스트 가이드

> `test/unit/features/toolbar/` 디렉토리의 테스트 문서

## 📊 파일 목록

| 파일명                            | 라인 수 | 테스트 유형 | 설명                                                  |
| --------------------------------- | ------- | ----------- | ----------------------------------------------------- |
| `toolbar-effect-cleanup.test.tsx` | 70      | 구현 검증   | Toolbar 컴포넌트의 effect cleanup 및 최적화 정책 검증 |

## 🎯 테스트 개요

### toolbar-effect-cleanup.test.tsx

**검증 항목**:

- 외부 클릭 감지 effect의 메모리 누수 방지
- props 동기화 최적화 (on() helper 사용)
- 파생 상태 createMemo 최적화

**검증 범위**:

- `src/shared/components/ui/Toolbar/Toolbar.tsx`
- `src/shared/hooks/toolbar/use-toolbar-settings-controller.ts`

**테스트 케이스**:

1. **외부 클릭 감지 effect cleanup**
   - `useToolbarSettingsController`에서 `mousedown` 리스너 등록/해제 검증
   - `onCleanup()` 내 `removeEventListener()` 호출 확인

2. **isDownloading props 동기화 최적화**
   - `Toolbar.tsx`에서 `isDownloading` 효과 검증
   - `on()` helper 또는 `createEffect()` 패턴 사용 확인
   - props 동기화 로직 존재 여부 검증

3. **파생 상태 메모화**
   - `Toolbar.tsx`에서 `createMemo` 기반 파생 상태(navState, progressWidth) 검증

## 🏃 실행 방법

### 단일 테스트 실행

```bash
# 전체 toolbar 테스트
npm run test -- test/unit/features/toolbar --run

# 특정 테스트만 실행
npx vitest run test/unit/features/toolbar/toolbar-effect-cleanup.test.tsx

# 특정 케이스만 실행
npx vitest run -t "배경 밝기 감지"
```

### 개발 중 워치 모드

```bash
npm run test:watch -- test/unit/features/toolbar
```

## 📝 주의사항

### Source Code Inspection

이 테스트는 **구현 파일을 직접 읽어서 검증**하는 방식입니다:

- `readFileSync()`로 소스 코드 읽음
- 정규표현식으로 구현 패턴 검증
- 리팩토링 시 주의 필요

### 유지보수 요점

- **Toolbar.tsx** 변경 시: `setDownloading`, `createEffect`, `on()` 패턴 유지
- **use-toolbar-settings-controller.ts** 변경 시:
   - 외부 클릭(mousedown) 리스너 등록/해제 유지
   - `onCleanup()` 구현 유지

## 🔗 관련 파일

- **구현**: `src/shared/components/ui/Toolbar/Toolbar.tsx`
- **구현**: `src/shared/hooks/toolbar/use-toolbar-settings-controller.ts`
- **부모 가이드**: `test/README.md#featuresgroup-tests`

## 📚 더 보기

- [전체 테스트 가이드](../README.md)
- [Toolbar 컴포넌트 구현](../../../../src/shared/components/ui/Toolbar/Toolbar.tsx)
- [Settings Controller 훅](../../../../src/shared/hooks/toolbar/use-toolbar-settings-controller.ts)

---

**Last Updated**: 2025-10-25 (Phase 184)
