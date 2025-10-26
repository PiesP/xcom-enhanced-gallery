# WSL (Windows Subsystem for Linux) 개발 환경 최적화 가이드

> 이 문서는 Windows에서 WSL을 사용하여 `xcom-enhanced-gallery` 프로젝트를 개발할
> 때 빌드 및 테스트 성능을 최적화하기 위한 구체적인 설정과 실행 방법을
> 제시합니다.

## 🎯 최근 최적화 (2025-10-26)

**대상 시스템**: ASUS ProArt P16 (AMD Ryzen AI 9 HX 370, 64GB RAM, Windows 11
Pro)

### 핵심 변경사항

| 항목              | 이전     | 현재    | 개선   |
| ----------------- | -------- | ------- | ------ |
| **메모리**        | 8GB      | 32GB    | +4배   |
| **CPU 코어**      | 6개      | 22개    | +3.7배 |
| **스왑**          | 2GB      | 24GB    | +12배  |
| **테스트 안정성** | OOM 발생 | ✅ 안정 | 해결됨 |

**적용 결과**: 테스트 실행 시 메모리 부족(OOM) 현상 완벽히 해결 ✅

### `.wslconfig` 최적 설정

```ini
[wsl2]
memory=32GB          # 64GB 시스템 중 절반 할당
processors=22        # 24코어 중 22코어 (호스트용 2코어 예약)
swap=24GB           # 메모리 스파이크 흡수
pageReporting=true  # 사용하지 않는 메모리 자동 회수
sparseVhd=true      # 디스크 공간 효율화
kernelCommandLine=vsyscall=emulate  # AMD 아키텍처 최적화
localhostForwarding=true
autoProxy=true
```

### 노드 메모리 설정 (package.json)

```json
"test": "NODE_OPTIONS='--max-old-space-size=3072' vitest run"
```

---

## 목차

1. [WSL 환경 구성](#wsl-환경-구성)
2. [파일 시스템 최적화](#파일-시스템-최적화)
3. [Vite 빌드 최적화](#vite-빌드-최적화)
4. [Vitest 테스트 최적화](#vitest-테스트-최적화)
5. [성능 벤치마크 및 측정](#성능-벤치마크-및-측정)
6. [문제 해결](#문제-해결)

---

## WSL 환경 구성

### WSL 버전 확인

```bash
# WSL 버전 확인 (WSL 2 권장)
wsl --version
wsl -l -v
```

**권장 사항**:

- **WSL 2** (또는 그 이상) 사용 (Hyper-V 기반, 성능 우수)
- WSL 1은 파일 시스템 성능이 낮으므로 피할 것
- 최신 커널로 업데이트: `wsl --update`

### 프로젝트 저장 위치 최적화

**성능 순서** (빠른 순서):

1. ✅ **WSL 가상 드라이브 내** (Linux 네이티브):
   `/home/user/projects/xcom-enhanced-gallery`
   - I/O 성능: 가장 빠름 (~3-5배 빠름)
   - 추천: 개발 시 필수
2. ⚠️ **Windows 드라이브 (`/mnt/c/*`) 내에서 WSL 실행**
   - I/O 성능: 느림 (서로 다른 파일 시스템 간 번역 오버헤드)
   - 주의: IDE/에디터가 Windows에 있다면 네트워크 I/O 발생 가능

**권장 설정**:

```bash
# WSL 내에서 프로젝트 위치 확인
pwd

# /home/ 또는 /root/ 경로 권장
# /mnt/c/ 경로는 피할 것 (또는 WSL 드라이브로 복사)

# Windows 드라이브에서 WSL로 복사
cp -r /mnt/c/git/xcom-enhanced-gallery ~/projects/xcom-enhanced-gallery
cd ~/projects/xcom-enhanced-gallery
```

---

## 파일 시스템 최적화

### `.wslconfig` 설정 (Windows에서 생성)

Windows 홈 디렉터리(`C:\Users\<YourUsername>\.wslconfig`)에 다음 파일을
생성합니다:

```ini
# .wslconfig — WSL 2 성능 최적화
[wsl2]
# 메모리: 시스템의 50-75% (예: 16GB 시스템 → 8-12GB)
# 너무 크면 Windows 시스템 성능 저하, 너무 작으면 OOM 위험
memory=8GB

# CPU: 시스템 코어 수의 50-75% (예: 8코어 시스템 → 4-6개)
processors=6

# 스왑 메모리: 테스트 병렬 실행 시 필요
swap=2GB

# 가상 디스크 최대 크기 (확장 가능)
pageReporting=true

# I/O 성능 최적화 (WSL 2.0+)
kernelCommandLine=vsyscall=emulate

# 일시적 파일에 tmpfs 사용 (메모리 기반, 고속)
localhostForwarding=true

# 네트워크 성능 최적화
autoProxy=true
```

**설정 반영**:

```bash
# Windows PowerShell에서 WSL 재시작
wsl --shutdown
wsl
```

---

## Vite 빌드 최적화

### 1. 빌드 캐싱 활성화

**현재 상태**: `vite.config.ts`에서 기본 캐싱이 활성화되어 있습니다.

**확인 방법**:

```bash
npm run build:dev  # 첫 실행: 느림 (캐싱 생성)
npm run build:dev  # 두 번째 실행: 빠름 (캐싱 사용)
```

### 2. 빌드 성능 모니터링

```bash
# 번들 분석 활성화 (현재: visualizer 플러그인 설정됨)
npm run build:prod

# dist/stats.html에서 번들 크기 분석
open dist/stats.html
```

### 3. Vite 캐시 문제 해결

```bash
# Vite 캐시 초기화 (필요 시만)
rm -rf node_modules/.vite

# 모든 캐시 정리 후 재빌드
npm run clean
npm run build:dev
```

### 권장 환경 변수

```bash
# 빌드 성능 향상 (소스맵 최소화)
export VITE_SOURCEMAP=false

# 병렬 번들 최적화
export NODE_ENV=production

# 빌드 실행
npm run build:prod
```

---

## Vitest 테스트 최적화

### 1. 현재 설정 검토

**vitest.config.ts의 핵심 설정**:

- 환경: `happy-dom` (JSDOM보다 빠름)
- 멀티스레드: 로컬에서는 최대 4개 워커, CI에서는 단일 스레드
- 메모리 제한: 로컬 2GB, CI 1GB per worker
- Inline 의존성: `@features/`, `@shared/`, `solid-js` 등

### 2. 로컬에서 테스트 최적화 실행

```bash
# 빠른 테스트 (smoke)
npm run test:smoke

# 주요 단위 테스트 (fast)
npm run test:fast

# 전체 단위 테스트 (unit)
npm run test:unit

# Watch 모드 (개발 중 권장)
npm run test:watch

# UI 모드 (대시보드로 확인)
npm run test:ui
```

### 3. 멀티스레드 최적화

**로컬에서 워커 개수 조정** (CPU 코어 수에 따라):

```bash
# 환경 변수로 워커 개수 지정
export VITEST_WORKERS=6  # 6개 워커 사용 (기본: 4)
npm run test:unit
```

**주의사항**:

- 워커 개수 > CPU 코어 수 → 성능 저하
- 메모리 누수 방지를 위해 `singleThread: false` + `memoryLimit: 2048MB` 사용

### 4. 테스트 캐싱

```bash
# 변경 없는 파일 재사용 (Vitest 기본)
npm run test:watch

# 캐시 초기화 (필요 시만)
rm -rf node_modules/.vitest
npm run test:smoke  # 캐시 재생성
```

### 5. 병렬 실행 최적화 (CI 설정 반영)

**로컬에서 CI 환경 시뮬레이션**:

```bash
# 단일 스레드 모드 (CI 환경과 동일)
export VITEST_SINGLE_THREAD=true
npm run test:unit
```

---

## 성능 벤치마크 및 측정

### 1. 빌드 성능 측정

```bash
# 빌드 타이밍 측정 (개발 빌드)
time npm run build:dev

# 프로덕션 빌드 타이밍
time npm run build:prod

# 캐시 없이 전체 빌드
npm run clean && time npm run build:dev
```

**일반적인 성능**:

| 작업              | WSL (로컬) | CI (GitHub Actions) |
| ----------------- | ---------- | ------------------- |
| 개발 빌드 (캐시O) | 5-10s      | 20-30s              |
| 개발 빌드 (캐시X) | 15-25s     | 40-60s              |
| 프로덕션 빌드     | 20-30s     | 50-80s              |

### 2. 테스트 성능 측정

```bash
# Smoke 테스트 타이밍
time npm run test:smoke

# 빠른 단위 테스트 타이밍
time npm run test:fast

# 전체 단위 테스트 + 커버리지
time npm run test:coverage
```

**일반적인 성능**:

| 테스트               | WSL (로컬) | CI (GitHub Actions) |
| -------------------- | ---------- | ------------------- |
| Smoke                | 5-10s      | 15-25s              |
| Fast                 | 20-40s     | 45-60s              |
| Unit (모든 프로젝트) | 60-120s    | 120-180s            |
| Coverage 포함        | 120-180s   | 180-240s            |

### 3. 성능 벤치마크 스크립트 실행

```bash
# 프로젝트별 테스트 성능 분석
node scripts/benchmark-vitest.js

# 결과: metrics/benchmark-report.txt 생성
cat metrics/benchmark-report.txt
```

---

## 문제 해결

### 1. 빌드가 매우 느린 경우

**진단**:

```bash
# 파일 시스템 성능 확인
time dd if=/dev/zero of=test.img bs=1M count=100
rm test.img

# 결과가 낮으면 (<100 MB/s) 파일 시스템 최적화 필요
```

**해결책**:

1. 프로젝트를 WSL 네이티브 드라이브로 이동: `/home/user/`
2. `.wslconfig` 메모리/CPU 설정 증가
3. VSCode Remote WSL 확장 설치 (Windows↔WSL 간 I/O 최적화)

### 2. 테스트 타임아웃

**증상**: "Test timeout exceeded" 또는 "Worker killed due to memory limit"

**원인 및 해결**:

```bash
# 메모리 제한 증가 (로컬)
export VITEST_MEMORY_LIMIT=4096  # 4GB

# 또는 vitest.config.ts에서 memoryLimit 수정:
# memoryLimit: 4096 (로컬 설정)

npm run test:unit
```

### 3. Vite HMR (Hot Module Replacement) 느림

**원인**: Windows와 WSL 간 파일 시스템 인터페이스

**해결책**:

```bash
# vite.config.ts에 추가 (이미 설정됨):
export default defineConfig({
  server: {
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5173,
    },
    watch: {
      usePolling: false,  // WSL 2에서는 필요 없음
      interval: 1000,     // 필요 시만 증가
    },
  },
});
```

### 4. npm install이 느린 경우

**원인**: 패키지 다운로드 성능 문제

**해결책**:

```bash
# npm 캐시 초기화
npm cache clean --force

# 등록소 변경 (필요 시)
npm config set registry https://registry.npmjs.org/

# 재설치
npm ci --prefer-offline
```

### 5. 메모리 부족으로 인한 크래시

**진단**:

```bash
# WSL 메모리 사용량 확인
free -h

# 스왑 사용량 확인
swapon --show
```

**해결책**:

1. `.wslconfig`에서 `memory` 및 `swap` 값 증가
2. 불필요한 백그라운드 프로세스 종료
3. 병렬 워커 수 감소: `export VITEST_WORKERS=2`

---

## 최종 권장 설정 체크리스트

### 초기 설정 (1회)

- [ ] WSL 2로 업그레이드: `wsl --version` (결과: 2.0 이상)
- [ ] `.wslconfig` 생성 및 설정 (메모리 8GB, CPU 6개)
- [ ] WSL 커널 업데이트: `wsl --update`
- [ ] 프로젝트를 WSL 네이티브 드라이브로 이동 (선택사항이지만 권장)
- [ ] VSCode Remote WSL 확장 설치

### 개발 워크플로 (매번)

```bash
# 개발 시작
npm ci
npm run test:watch    # 또는 test:ui

# 빌드 전 최종 검증
npm run validate:build

# 커밋 전
npm run typecheck
npm run lint:fix
npm test
npm run build
```

### 성능 측정 (주 1회 또는 필요 시)

```bash
# 성능 스냅샷 저장
npm run test:coverage
time npm run build:prod

# 이전 결과와 비교하여 퇴행 여부 확인
```

---

## 참고 자료

### WSL 공식 문서

- [WSL 최적화](https://docs.microsoft.com/en-us/windows/wsl/compare-versions)
- [.wslconfig 설정](https://docs.microsoft.com/en-us/windows/wsl/wsl-config)

### Vite 공식 문서

- [Vite 성능 최적화](https://vitejs.dev/guide/features.html#build-optimization)
- [Vite 캐싱 및 워치](https://vitejs.dev/config/server-options.html)

### Vitest 공식 문서

- [Vitest 멀티스레드 설정](https://vitest.dev/config/#pool)
- [Vitest 환경 설정](https://vitest.dev/config/#environment)

### 프로젝트 가이드

- [AGENTS.md](./AGENTS.md) — 개발 워크플로우
- [TESTING_STRATEGY.md](./TESTING_STRATEGY.md) — 테스트 전략
- [ARCHITECTURE.md](./ARCHITECTURE.md) — 프로젝트 구조

---

## 성능 최적화 요약 (2025-10-26)

### 시스템 사양 기반 권장 설정

| 사양          | 할당값 | 근거                       |
| ------------- | ------ | -------------------------- |
| 메모리 (64GB) | 32GB   | 호스트:WSL = 1:1 균형      |
| CPU (24코어)  | 22코어 | 호스트 안정성 (2코어 예약) |
| 스왑          | 24GB   | 메모리 75% (스파이크 흡수) |

### 개선 결과

- ✅ 테스트 OOM 해결 (메모리 부족 현상 없음)
- ✅ Vitest worker pool 안정화
- ✅ 테스트 속도 5-8분 내로 단축
- ✅ 모든 검증 통과 (validate, test:smoke, build)

### 적용 후 확인 사항

```bash
# WSL 내에서 할당된 리소스 확인
free -h              # 메모리 할당 확인
nproc                # CPU 코어 확인
swapon --show        # 스왑 할당 확인
```

**예상 출력**:

```
Mem:           31Gi        2-5Gi      26-29Gi
Swap:          24Gi        0Gi         24Gi
CPU cores:     22개
```

---

## 문의 및 개선 제안

이 가이드는 지속적으로 개선됩니다. 다음의 경우 문서 업데이트를 권장합니다:

- 새로운 성능 이슈 발견
- `.wslconfig` 또는 설정 파일 변경
- WSL 또는 도구 버전 업그레이드
- 성능 벤치마크 결과 큰 변화

**최종 업데이트**: 2025년 10월 26일 (하드웨어별 최적화 가이드 추가)
