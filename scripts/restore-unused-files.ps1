# X.com Enhanced Gallery - 미사용 파일 복원 스크립트
# 백업된 파일들을 원래 위치로 복원

param(
    [string]$BackupPath = "backup\unused-files",
    [switch]$DryRun = $false,
    [switch]$Force = $false,
    [string]$LogFilter = ""  # 특정 로그 파일 기준으로 복원
)

# 색상 출력 함수
function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")

    switch ($Color) {
        "Red" { Write-Host $Message -ForegroundColor Red }
        "Green" { Write-Host $Message -ForegroundColor Green }
        "Yellow" { Write-Host $Message -ForegroundColor Yellow }
        "Blue" { Write-Host $Message -ForegroundColor Blue }
        "Cyan" { Write-Host $Message -ForegroundColor Cyan }
        default { Write-Host $Message -ForegroundColor White }
    }
}

# 스크립트 시작
Write-ColorOutput "🔄 X.com Enhanced Gallery - 미사용 파일 복원 시작" "Cyan"
Write-ColorOutput "=================================================" "Cyan"

# 현재 디렉토리 확인
$CurrentDir = Get-Location
$FullBackupPath = Join-Path $CurrentDir $BackupPath

if (-not (Test-Path $FullBackupPath)) {
    Write-ColorOutput "❌ 오류: 백업 디렉토리를 찾을 수 없습니다: $FullBackupPath" "Red"
    exit 1
}

# 백업된 파일들 찾기
Write-ColorOutput "🔍 백업된 파일 검색 중..." "Yellow"
$BackupFiles = Get-ChildItem -Path $FullBackupPath -Recurse -File | Where-Object {
    $_.Extension -match '\.(ts|tsx|js|jsx|css)$'
}

Write-ColorOutput "📋 설정:" "Yellow"
Write-ColorOutput "  - 백업 경로: $BackupPath" "White"
Write-ColorOutput "  - Dry Run: $DryRun" "White"
Write-ColorOutput "  - Force 모드: $Force" "White"
Write-ColorOutput "  - 발견된 백업 파일: $($BackupFiles.Count)개" "White"
Write-ColorOutput ""

if ($BackupFiles.Count -eq 0) {
    Write-ColorOutput "📁 복원할 백업 파일이 없습니다." "Yellow"
    exit 0
}

# 로그 파일 설정
$RestoreLogFile = Join-Path $FullBackupPath "restore-log-$(Get-Date -Format 'yyyyMMdd-HHmmss').txt"

function Write-Log {
    param([string]$Message)
    $TimeStamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogEntry = "[$TimeStamp] $Message"

    if (-not $DryRun) {
        Add-Content -Path $RestoreLogFile -Value $LogEntry -Encoding UTF8
    }
    Write-Host $LogEntry
}

# 백업 파일 목록 표시
Write-ColorOutput "📁 복원 가능한 파일들:" "Blue"
foreach ($File in $BackupFiles) {
    $RelativePath = $File.FullName.Substring($FullBackupPath.Length + 1)
    Write-ColorOutput "  - $RelativePath" "Gray"
}

# 확인 메시지 (Force 모드가 아닌 경우)
if (-not $Force -and -not $DryRun) {
    Write-ColorOutput ""
    Write-ColorOutput "⚠️  경고: $($BackupFiles.Count)개 파일을 원래 위치로 복원합니다." "Yellow"
    Write-ColorOutput "기존에 같은 이름의 파일이 있으면 덮어쓰게 됩니다." "Yellow"
    $Confirmation = Read-Host "계속하시겠습니까? (y/N)"

    if ($Confirmation -ne "y" -and $Confirmation -ne "Y") {
        Write-ColorOutput "❌ 복원 작업이 취소되었습니다." "Red"
        exit 0
    }
}

# 파일 복원 작업
$RestoredCount = 0
$ErrorCount = 0
$SkippedCount = 0

Write-ColorOutput ""
Write-ColorOutput "🔄 파일 복원 작업 시작..." "Cyan"

foreach ($File in $BackupFiles) {
    try {
        # 백업 파일의 상대 경로 계산
        $RelativePath = $File.FullName.Substring($FullBackupPath.Length + 1)
        $DestinationPath = Join-Path $CurrentDir $RelativePath
        $DestinationDir = Split-Path $DestinationPath -Parent

        if ($DryRun) {
            Write-ColorOutput "  [DRY RUN] $RelativePath ← backup" "Cyan"
            $RestoredCount++
        } else {
            # 대상 디렉토리 생성
            if (-not (Test-Path $DestinationDir)) {
                New-Item -ItemType Directory -Path $DestinationDir -Force | Out-Null
            }

            # 파일 복원 (복사 후 백업 파일 유지)
            Copy-Item -Path $File.FullName -Destination $DestinationPath -Force
            Write-ColorOutput "  ✅ 복원 완료: $RelativePath" "Green"
            Write-Log "RESTORED: $RelativePath"
            $RestoredCount++
        }
    } catch {
        Write-ColorOutput "  ❌ 복원 실패: $RelativePath - $($_.Exception.Message)" "Red"
        Write-Log "ERROR: Failed to restore $RelativePath - $($_.Exception.Message)"
        $ErrorCount++
    }
}

# 결과 요약
Write-ColorOutput ""
Write-ColorOutput "📊 복원 작업 완료 요약" "Cyan"
Write-ColorOutput "=================================================" "Cyan"
Write-ColorOutput "✅ 성공적으로 복원: $RestoredCount 개" "Green"
Write-ColorOutput "⚠️  건너뜀: $SkippedCount 개" "Yellow"
Write-ColorOutput "❌ 오류 발생: $ErrorCount 개" "Red"

if (-not $DryRun) {
    Write-ColorOutput "📝 복원 로그: $RestoreLogFile" "Blue"
}

# 다음 단계 안내
Write-ColorOutput ""
Write-ColorOutput "🎯 다음 단계:" "Cyan"
Write-ColorOutput "1. npm run typecheck  # 타입 오류 확인" "White"
Write-ColorOutput "2. npm run build      # 빌드 테스트" "White"
Write-ColorOutput "3. npm run test       # 기능 테스트" "White"

if ($DryRun) {
    Write-ColorOutput ""
    Write-ColorOutput "💡 실제 실행하려면 -DryRun 플래그를 제거하고 다시 실행하세요." "Yellow"
}

Write-ColorOutput ""
Write-ColorOutput "🎉 파일 복원 작업 완료!" "Green"
