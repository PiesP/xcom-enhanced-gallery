# test/archive/unit/a11y — 아카이브

접근성(Accessibility, a11y) 관련 RED 테스트 및 완료된 Phase 파일을 보관합니다.

## 📋 포함 파일

### RED 테스트 (구현 전 작성)

- **announce-routing.red.test.ts**
  - 목적: Toast와 Live Region 상호작용 검증 (RED 상태)
  - 상태: 미구현 기능 ("Announce routing hardening")
  - 라인: 50줄
  - 이유: Phase 진행에 따라 완료 또는 폐기 예정

## 📅 아카이브 정책

- **보존 기간**: 무기한 (참고용)
- **CI/CD 제외**: `vitest.config.ts`의 projects 설정에서 제외됨
- **복원 가능**: 필요시 test/unit으로 이동 후 재활성화 가능

## 🔄 복원 방법

```bash
# 파일 확인
ls -la test/archive/unit/a11y/

# 활성화 시 test/unit/a11y로 이동
cp test/archive/unit/a11y/announce-routing.red.test.ts test/unit/a11y/

# vitest.config.ts projects 설정 수정 (필요시)
```

## 📖 참고

- **활성 a11y 테스트**: test/unit/accessibility/ 참고
- **E2E 접근성 테스트**: playwright/accessibility/ 참고
- **접근성 가이드**: docs/ACCESSIBILITY_CHECKLIST.md 참고
