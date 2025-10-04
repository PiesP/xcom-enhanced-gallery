# CodeQL 로컬 환경 활용 가이드

> 로컬 개발 환경에서 CodeQL을 효과적으로 활용하는 방법

**관련 문서**: [실행 가이드](../AGENTS.md) | [아키텍처](ARCHITECTURE.md) |
[TDD 계획](TDD_REFACTORING_PLAN.md)

---

## 1. 개요

CodeQL은 코드 보안 취약점을 자동으로 탐지하는 정적 분석 도구입니다. 본
프로젝트는 로컬 개발 환경과 CI 환경 모두에서 CodeQL을 활용합니다.

**핵심 개념**:

- **표준 쿼리 팩**: GitHub Advanced Security 전용 (400+ 보안 규칙)
- **Fallback 쿼리 팩**: 로컬 환경에서 사용 가능 (50+ 기본 규칙)
- **SARIF 출력**: 분석 결과를 구조화된 형식으로 저장

---

## 2. 쿼리 팩 종류

### 표준 쿼리 팩 (`codeql/javascript-security-and-quality`)

**특징**:

- GitHub Advanced Security 활성화 시 사용 가능
- 400+ 보안 규칙 포함 (확장 규칙 포함)
- CI 환경(GitHub Actions)에서 자동 적용
- Code Scanning 대시보드 연동

**규칙 커버리지**:

- XSS, SQL Injection, Path Traversal
- Prototype Pollution, CSRF
- 정규식 DoS, 암호화 취약점
- 하드코딩된 비밀 정보

### Fallback 쿼리 팩 (`codeql/javascript-queries`)

**특징**:

- 로컬 환경에서 사용 가능 (인증 불필요)
- 50+ 기본 보안 규칙 포함
- 핵심 보안 취약점 탐지에 집중
- 빠른 피드백 제공

**규칙 커버리지**:

- XSS, SQL Injection (기본 패턴)
- Path Traversal (기본 패턴)
- 정규식 DoS (기본 패턴)
- 명시적 보안 취약점

**제약 사항**:

- 확장 규칙 미포함 (security-extended)
- 일부 고급 패턴 미지원
- Code Scanning 대시보드 자동 연동 불가

---

## 3. 환경별 동작 방식

### 로컬 환경

**자동 Fallback 전환**:

```bash
npm run codeql:scan
```

1. 표준 쿼리 팩 다운로드 시도
2. 403 Forbidden → Fallback 쿼리 팩으로 자동 전환
3. 50+ 규칙으로 기본 보안 분석 수행
4. SARIF/CSV/개선 계획 생성

**로깅 예시**:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  Fallback 쿼리 팩으로 전환합니다
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📌 전환 사유:
   표준 쿼리 팩(codeql/javascript-security-and-quality) 접근이 거부되었습니다.
   GitHub Advanced Security가 활성화되지 않은 환경으로 추정됩니다.

📦 Fallback 쿼리 팩 정보:
   - 사용할 팩: codeql/javascript-queries
   - 예상 규칙 수: 50+ 개 (표준 팩 대비 제한적)
   - 커버리지: 기본 보안 규칙 중심 (확장 규칙 미포함)

💡 환경별 가이드:
   [로컬 환경]
     - Fallback 쿼리 팩으로 기본 보안 분석 가능
     - 완전한 분석은 CI 환경(GitHub Actions)에서 자동 실행됨
```

### CI 환경 (GitHub Actions)

**자동 표준 쿼리 팩 사용**:

```yaml
- name: CodeQL Analysis
  uses: github/codeql-action/analyze@v3
```

1. GitHub Advanced Security 자동 활성화
2. 표준 쿼리 팩 400+ 규칙 적용
3. SARIF 업로드 → Code Scanning 대시보드 연동
4. PR에 자동 코멘트 (발견된 취약점)

**장점**:

- 완전한 보안 규칙 커버리지
- 히스토리 추적 (Security 탭)
- 자동 알림 (이메일/Slack)
- 베이스라인 비교 (신규/기존 분리)

---

## 4. 실행 방법

### 기본 실행

```pwsh
# 로컬 분석 (Fallback 자동 전환)
npm run codeql:scan

# 미리보기 모드 (명령어만 확인)
npm run codeql:dry-run
```

### 고급 옵션

```pwsh
# 커스텀 CodeQL CLI 경로 지정
node ./scripts/run-codeql.mjs --codeql-path "C:/codeql/codeql.exe"

# 스레드 수 지정 (기본값: CPU 코어 수 - 1)
node ./scripts/run-codeql.mjs --threads=4

# 기존 데이터베이스 유지
node ./scripts/run-codeql.mjs --keep-db

# 추가 쿼리 팩 지정
node ./scripts/run-codeql.mjs --packs=./custom-queries
```

---

## 5. 산출물 분석

### SARIF 파일 (`codeql-results.sarif`)

**용도**: 구조화된 분석 결과 (JSON 형식)

**주요 필드**:

```json
{
  "runs": [{
    "tool": {
      "driver": {
        "name": "CodeQL",
        "rules": [...]  // 사용된 규칙 목록
      }
    },
    "results": [...]  // 발견된 취약점
  }]
}
```

**분석 방법**:

```pwsh
# 규칙 수 확인
Select-String -Path codeql-results.sarif -Pattern '"id":' | Measure-Object

# js/ 보안 규칙 수 확인
Select-String -Path codeql-results.sarif -Pattern '"id": "js/' | Measure-Object
```

### CSV 요약 (`codeql-results-summary.csv`)

**용도**: 엑셀/스프레드시트에서 분석 가능한 요약

**컬럼**:

- `ruleId`: 규칙 ID (예: `js/incomplete-url-substring-sanitization`)
- `severity`: 심각도 (`error`, `warning`, `note`)
- `message`: 경고 메시지
- `file`: 파일 경로
- `line`: 라인 번호
- `column`: 컬럼 번호
- `helpUrl`: 가이드 문서 링크

**분석 방법**:

```pwsh
# 심각도별 집계
Import-Csv codeql-results-summary.csv | Group-Object severity
```

### 개선 계획 (`codeql-improvement-plan.md`)

**용도**: 우선순위 기반 개선 작업 체크리스트

**섹션**:

1. 전체 통계 (심각도별 개수)
2. 상세 개선 항목 (위치/가이드/우선순위)
3. 후속 절차 제안 (TDD 백로그 등록)

**워크플로**:

1. 개선 계획 검토
2. 우선순위 높은 항목부터 대응
3. `TDD_REFACTORING_BACKLOG.md`에 등록
4. Epic/Phase로 구조화하여 순차 진행

---

## 6. 환경 정보 확인

### 자동 환경 감지

스크립트는 실행 시 환경을 자동으로 감지하고 로깅합니다:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 쿼리 팩 종류: Fallback 쿼리 팩
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   - 총 1개 팩 사용
   - 예상 규칙 수: 50+ 개

   [1] codeql/javascript-queries
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 테스트에서 환경 확인

```typescript
import {
  hasAdvancedSecurity,
  detectQueryPackType,
  getCodeQLEnvironmentInfo,
} from '@/test/utils/codeql-environment';

// Advanced Security 활성화 여부
const hasAdvanced = hasAdvancedSecurity(); // boolean

// 쿼리 팩 종류 감지
const packType = detectQueryPackType(); // 'standard' | 'fallback' | 'unknown'

// 전체 환경 정보
const envInfo = getCodeQLEnvironmentInfo();
console.log(envInfo);
// {
//   hasAdvancedSecurity: false,
//   queryPackType: 'fallback',
//   totalRules: 86,
//   jsSecurityRules: 86,
//   sarifExists: true,
//   sarifSizeKB: 708.45
// }
```

---

## 7. 트러블슈팅

### CodeQL CLI를 찾을 수 없음

**증상**:

```
❌ CodeQL CLI(codeql)를 찾을 수 없습니다.
```

**해결 방법**:

1. CodeQL CLI 설치: https://codeql.github.com/docs/codeql-cli/installation/
2. PATH 환경 변수 설정 확인
3. `--codeql-path` 옵션으로 경로 지정:
   ```pwsh
   node ./scripts/run-codeql.mjs --codeql-path "C:/codeql/codeql.exe"
   ```

### 쿼리 팩 다운로드 실패

**증상**:

```
⚠️  쿼리 팩 접근 거부: "codeql/javascript-security-and-quality"
```

**해결 방법**:

- **로컬 환경**: 정상 동작 (Fallback 자동 전환)
- **CI 환경**: GitHub Advanced Security 활성화 필요
- **커스텀 팩**: `--packs` 옵션으로 로컬 경로 지정

### SARIF 파일이 너무 큼

**증상**:

```
SARIF 크기: 5.2 MB (예상: 500 KB ~ 2 MB)
```

**해결 방법**:

1. 불필요한 규칙 제외:
   ```pwsh
   node ./scripts/run-codeql.mjs --no-default-packs --packs=./custom-queries
   ```
2. 분석 대상 축소 (`.codeqlignore` 파일 활용)
3. CI 환경에서 실행 (로컬 리소스 절약)

### 메모리 부족 오류

**증상**:

```
JavaScript heap out of memory
```

**해결 방법**:

1. 스레드 수 감소:
   ```pwsh
   node ./scripts/run-codeql.mjs --threads=2
   ```
2. Node.js 메모리 증가:
   ```pwsh
   $env:NODE_OPTIONS="--max-old-space-size=4096"
   npm run codeql:scan
   ```

---

## 8. 베스트 프랙티스

### 로컬 개발 워크플로

1. **정기 실행** (주 1회 권장):

   ```pwsh
   npm run codeql:scan
   ```

2. **개선 계획 검토**:

   ```pwsh
   code codeql-improvement-plan.md
   ```

3. **우선순위 높은 항목부터 대응**:
   - `error` 심각도 → 즉시 수정
   - `warning` 심각도 → TDD 백로그 등록
   - `note` 심각도 → 차후 검토

4. **테스트 작성**:
   ```pwsh
   # 보안 계약 테스트 작성 (test/security/)
   npm test -- test/security/
   ```

### CI 통합 워크플로

1. **PR 생성 시 자동 실행** (`.github/workflows/security.yml`)
2. **SARIF 업로드** → Code Scanning 대시보드
3. **PR 코멘트** → 신규 취약점 자동 알림
4. **머지 전 필수** → 모든 `error` 심각도 해결

---

## 9. 관련 도구

### VS Code 확장

**CodeQL Extension**:

- URL: https://marketplace.visualstudio.com/items?itemName=GitHub.vscode-codeql
- 기능: 쿼리 편집, 디버깅, 결과 탐색

**SARIF Viewer**:

- URL:
  https://marketplace.visualstudio.com/items?itemName=MS-SarifVSCode.sarif-viewer
- 기능: SARIF 파일 시각화, 코드 위치 점프

### CLI 도구

**jq** (JSON 처리):

```pwsh
# 규칙 ID 목록 추출
Get-Content codeql-results.sarif | jq '.runs[0].tool.driver.rules[].id'
```

**SARIF Multitool**:

- URL: https://github.com/microsoft/sarif-sdk
- 기능: SARIF 병합, 변환, 필터링

---

## 10. FAQ

### Q1. 로컬에서 표준 쿼리 팩을 사용할 수 있나요?

**A**: GitHub Advanced Security가 활성화된 조직 계정이 필요합니다. 개인 계정이나
무료 조직은 Fallback 쿼리 팩을 사용해야 합니다.

### Q2. Fallback 쿼리 팩으로 충분한가요?

**A**: 기본 보안 취약점(50+ 규칙)은 충분히 탐지 가능합니다. 완전한 분석(400+
규칙)은 CI 환경에서 자동으로 실행되므로 로컬에서는 빠른 피드백에 집중하세요.

### Q3. CI 환경에서 Fallback 쿼리 팩이 사용되나요?

**A**: 아니요. GitHub Actions는 자동으로 표준 쿼리 팩을 사용합니다 (GitHub
Advanced Security 자동 활성화).

### Q4. 커스텀 쿼리를 추가할 수 있나요?

**A**: 네. `codeql-custom-queries-javascript/` 디렉터리에 쿼리를 추가하고
`--packs` 옵션으로 지정하세요:

```pwsh
node ./scripts/run-codeql.mjs --packs=./codeql-custom-queries-javascript
```

### Q5. SARIF 파일을 GitHub에 업로드할 수 있나요?

**A**: 로컬에서 직접 업로드는 불가능합니다. CI 환경에서
`github/codeql-action/upload-sarif@v3` 액션을 사용하세요.

---

## 11. 참고 문서

**공식 문서**:

- CodeQL CLI 설치: https://codeql.github.com/docs/codeql-cli/installation/
- CodeQL 쿼리 작성: https://codeql.github.com/docs/writing-codeql-queries/
- GitHub Code Scanning: https://docs.github.com/en/code-security/code-scanning

**프로젝트 문서**:

- [실행 가이드](../AGENTS.md): 로컬/CI 워크플로
- [아키텍처](ARCHITECTURE.md): 보안 정책 섹션
- [TDD 계획](TDD_REFACTORING_PLAN.md): Epic CODEQL-LOCAL-ENHANCEMENT

**관련 Epic**:

- `CODEQL-SECURITY-HARDENING`: URL Sanitization + Prototype Pollution 강화
  (완료)
- `CODEQL-LOCAL-ENHANCEMENT`: 로컬 워크플로 개선 (진행 중)
- `GITHUB-ADVANCED-SECURITY-INTEGRATION`: 표준 쿼리 팩 통합 (백로그 HOLD)

---

본 가이드는 로컬 CodeQL 활용의 단일 소스입니다. 환경 제약이나 트러블슈팅이
필요하면 본 문서를 우선 참고하세요.
