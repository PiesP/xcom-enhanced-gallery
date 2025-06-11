# 미사용 파일 정리 스크립트 사용법

## 📋 개요

X.com Enhanced Gallery 프로젝트에서 사용되지 않는 173개 파일을 안전하게 백업으로 이동시키는 PowerShell 스크립트들입니다.

## 🚀 사용법

### 1단계: Dry Run (테스트 실행)

먼저 어떤 파일들이 이동될지 미리 확인해보세요:

```powershell
# 프로젝트 루트 디렉토리에서 실행
cd C:\git\xcom-enhanced-gallery

# 테스트 실행 (실제로는 파일을 이동하지 않음)
powershell -ExecutionPolicy Bypass -File scripts\cleanup-unused-files.ps1 -DryRun
```

### 2단계: 실제 실행

테스트 결과가 만족스러우면 실제로 실행하세요:

```powershell
# 실제 파일 이동 (확인 메시지 표시)
powershell -ExecutionPolicy Bypass -File scripts\cleanup-unused-files.ps1

# 또는 확인 없이 강제 실행
powershell -ExecutionPolicy Bypass -File scripts\cleanup-unused-files.ps1 -Force
```

### 3단계: 검증

파일 이동 후 프로젝트가 정상 동작하는지 확인하세요:

```powershell
# 타입 검사
npm run typecheck

# 빌드 테스트
npm run build

# 단위 테스트
npm run test
```

## 🔄 복원 방법

문제가 발생하면 백업된 파일들을 복원할 수 있습니다:

```powershell
# 테스트 복원
powershell -ExecutionPolicy Bypass -File scripts\restore-unused-files.ps1 -DryRun

# 실제 복원
powershell -ExecutionPolicy Bypass -File scripts\restore-unused-files.ps1
```

## 📁 파일 구조

```
backup/
└── unused-files/
    ├── src/
    │   ├── app/
    │   ├── core/
    │   ├── features/
    │   ├── infrastructure/
    │   └── shared/
    ├── cleanup-log-20240101-120000.txt
    └── cleanup-errors-20240101-120000.txt (오류 발생 시)
```

## 📊 스크립트 옵션

### cleanup-unused-files.ps1

| 옵션          | 설명                                  | 기본값                |
| ------------- | ------------------------------------- | --------------------- |
| `-BackupPath` | 백업 디렉토리 경로                    | `backup\unused-files` |
| `-DryRun`     | 테스트 실행 (실제 파일 이동하지 않음) | `$false`              |
| `-Force`      | 확인 메시지 없이 강제 실행            | `$false`              |

### restore-unused-files.ps1

| 옵션          | 설명                                  | 기본값                |
| ------------- | ------------------------------------- | --------------------- |
| `-BackupPath` | 백업 디렉토리 경로                    | `backup\unused-files` |
| `-DryRun`     | 테스트 실행 (실제 파일 복원하지 않음) | `$false`              |
| `-Force`      | 확인 메시지 없이 강제 실행            | `$false`              |

## 🎯 처리되는 파일 목록

총 173개 파일이 다음 카테고리로 분류됩니다:

### Core Layer (19개)

- ApplicationConfig.ts, config.ts, keys.ts 등 설정 파일들
- LifecycleManager.ts, DOMObserverService.ts 등 서비스들
- 각종 signals 및 stores

### Features Layer (43개)

- 갤러리, 미디어, 설정, UI 관련 컴포넌트들
- 사용되지 않는 훅들과 서비스들

### Shared Layer (96개)

- 공통 컴포넌트들 (UI, 피드백, 레이아웃 등)
- 유틸리티 함수들 (성능, 미디어, 포맷 등)
- 타입 정의 파일들

### Infrastructure Layer (15개)

- 브라우저 API 래퍼들
- 스토리지, 로깅 관련 파일들

## ⚠️ 주의사항

1. **백업 필수**: 중요한 작업이므로 반드시 Git commit 후 실행하세요
2. **단계적 실행**: 처음에는 반드시 `-DryRun`으로 테스트하세요
3. **검증 필수**: 파일 이동 후 빌드와 테스트를 실행하세요
4. **로그 확인**: 오류가 발생하면 로그 파일을 확인하세요

## 🚨 문제 해결

### PowerShell 실행 정책 오류

```powershell
# 임시로 실행 정책 변경
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# 또는 스크립트 실행 시 정책 우회
powershell -ExecutionPolicy Bypass -File scripts\cleanup-unused-files.ps1
```

### 파일 접근 권한 오류

```powershell
# 관리자 권한으로 PowerShell 실행
# 또는 파일 권한 확인
```

### 예상보다 적은 파일 이동

- 일부 파일이 이미 삭제되었을 수 있습니다
- 파일 경로가 변경되었을 수 있습니다
- 로그 파일에서 상세 내용을 확인하세요

## 🎉 완료 후 효과

미사용 파일 정리 후 다음과 같은 개선을 기대할 수 있습니다:

- **번들 크기 감소**: ~30-40% 감소 예상
- **빌드 시간 단축**: TypeScript 컴파일 시간 감소
- **IDE 성능 향상**: 인텔리센스 속도 개선
- **코드 탐색 개선**: 실제 사용 파일에만 집중
- **유지보수성 향상**: 깔끔한 프로젝트 구조

## 📞 지원

문제가 발생하면 다음을 확인하세요:

1. 로그 파일 (`backup/unused-files/cleanup-log-*.txt`)
2. 오류 로그 (`backup/unused-files/cleanup-errors-*.txt`)
3. Git 상태 (`git status`)
4. 빌드 결과 (`npm run build`)
