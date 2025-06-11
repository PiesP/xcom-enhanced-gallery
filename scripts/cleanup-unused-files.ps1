# X.com Enhanced Gallery - 미사용 파일 정리 스크립트
# 미사용 파일들을 백업 폴더로 안전하게 이동

param(
    [string]$BackupPath = "backup\unused-files",
    [switch]$DryRun = $false,
    [switch]$Force = $false
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

# 미사용 파일 목록 (unimported 결과 기반)
$UnusedFiles = @(
    "src\app\App.tsx",
    "src\core\config\ApplicationConfig.ts",
    "src\core\constants\config.ts",
    "src\core\constants\keys.ts",
    "src\core\constants\ui-layers.ts",
    "src\core\lifecycle\LifecycleManager.ts",
    "src\core\services\dom\DOMObserverService.ts",
    "src\core\services\lifecycle\DefaultLifecycleManager.ts",
    "src\core\services\MediaCacheService.ts",
    "src\core\services\NotificationService.ts",
    "src\core\state\index.ts",
    "src\core\state\signals\download.signals.ts",
    "src\core\state\signals\gallery.signals.ts",
    "src\core\state\signals\media.signals.ts",
    "src\core\state\signals\settings.signals.ts",
    "src\core\state\signals\ui.signals.ts",
    "src\core\state\stores\preact-signals.store.ts",
    "src\core\types.ts",
    "src\core\types\gallery.types.ts",
    "src\features\app\GalleryApp.ts",
    "src\features\app\MinimalGalleryApp.ts",
    "src\features\download\services\UnifiedDownloadService.ts",
    "src\features\gallery\components\GalleryContent.tsx",
    "src\features\gallery\components\index.ts",
    "src\features\gallery\components\VerticalGalleryView\VerticalGalleryView.backup.tsx",
    "src\features\gallery\constants\gallery.constants.ts",
    "src\features\gallery\GalleryManager.ts",
    "src\features\gallery\hooks\useGalleryIntegration.ts",
    "src\features\gallery\hooks\useGalleryNavigation.ts",
    "src\features\gallery\hooks\useGalleryState.ts",
    "src\features\gallery\services\galleryStorage.ts",
    "src\features\gallery\types\gallery.types.ts",
    "src\features\media\components\ImageViewer.tsx",
    "src\features\media\components\MediaControls.tsx",
    "src\features\media\components\MediaViewer.tsx",
    "src\features\media\components\VideoPlayer.tsx",
    "src\features\media\constants\animation-constants.ts",
    "src\features\media\constants\video-constants.ts",
    "src\features\media\hooks\useMediaLoader.ts",
    "src\features\media\hooks\useVideoControls.ts",
    "src\features\media\index.ts",
    "src\features\media\MediaDetector.ts",
    "src\features\media\services\index.ts",
    "src\features\media\services\mediaCache.ts",
    "src\features\media\services\mediaExtractor.ts",
    "src\features\media\services\MediaExtractorService.ts",
    "src\features\media\services\MediaFilterConfig.ts",
    "src\features\media\services\MediaFilterService.ts",
    "src\features\media\services\mediaProcessor.ts",
    "src\features\media\test-integration.ts",
    "src\features\media\types\index.ts",
    "src\features\media\types\media.types.ts",
    "src\features\settings\hooks\useSettingsStore.tsx",
    "src\features\settings\SettingsManager.ts",
    "src\features\ui\UIIntegration.ts",
    "src\infrastructure\browser\dom-observer.ts",
    "src\infrastructure\browser\intersection-observer.ts",
    "src\infrastructure\browser\mutation-observer.ts",
    "src\infrastructure\error\error-handler.ts",
    "src\infrastructure\logging\debug.ts",
    "src\infrastructure\logging\error-reporter.ts",
    "src\infrastructure\logging\index.ts",
    "src\infrastructure\logging\performance-monitor.ts",
    "src\infrastructure\logging\throttled-logger.ts",
    "src\infrastructure\storage\constants.ts",
    "src\infrastructure\storage\EnhancedCache.ts",
    "src\infrastructure\storage\local-storage.adapter.ts",
    "src\shared\components\debug\DebugPanel.tsx",
    "src\shared\components\feedback\ErrorBoundary.tsx",
    "src\shared\components\feedback\ErrorBoundaryWrappers.tsx",
    "src\shared\components\feedback\LoadingSpinner.tsx",
    "src\shared\components\feedback\UnifiedErrorBoundary.tsx",
    "src\shared\components\layout\Container.tsx",
    "src\shared\components\layout\Overlay.tsx",
    "src\shared\components\media\ImageViewer.backup.tsx",
    "src\shared\components\media\ImageViewer.tsx",
    "src\shared\components\media\index.ts",
    "src\shared\components\media\UnifiedMediaViewer.tsx",
    "src\shared\components\media\VideoViewer.tsx",
    "src\shared\components\safe-render\index.ts",
    "src\shared\components\safe-render\SafePreactComponent.tsx",
    "src\shared\components\ui\Button\index.ts",
    "src\shared\components\ui\EnhancedThumbnailBar\EnhancedThumbnailBar.tsx",
    "src\shared\components\ui\EnhancedThumbnailBar\index.ts",
    "src\shared\components\ui\index.ts",
    "src\shared\components\ui\ShadowComponent\index.ts",
    "src\shared\components\ui\ShadowComponent\ShadowComponent.tsx",
    "src\shared\components\ui\ThumbnailBar\index.ts",
    "src\shared\components\ui\ThumbnailBar\ThumbnailBar.tsx",
    "src\shared\components\ui\Toast\index.ts",
    "src\shared\components\ui\Toast\ToastContainer.tsx",
    "src\shared\components\ui\Toolbar\index.ts",
    "src\shared\components\ui\Toolbar\ViewModeSelector.tsx",
    "src\shared\constants\events.ts",
    "src\shared\hooks\index.ts",
    "src\shared\hooks\useEventCoordination.ts",
    "src\shared\hooks\useEventListener.ts",
    "src\shared\hooks\useGalleryKeyboard.ts",
    "src\shared\hooks\useImageFit.ts",
    "src\shared\hooks\useImageZoom.ts",
    "src\shared\hooks\useKeyboardNavigation.ts",
    "src\shared\hooks\useLocalStorage.ts",
    "src\shared\hooks\usePanGesture.ts",
    "src\shared\services\ClickEventManager.ts",
    "src\shared\services\DOMObserverService.ts",
    "src\shared\services\error\UnifiedErrorBoundaryService.ts",
    "src\shared\services\EventCoordinator.ts",
    "src\shared\services\KeyboardEventManager.ts",
    "src\shared\services\RuntimeTypeChecker.ts",
    "src\shared\services\UIStateManager.ts",
    "src\shared\services\UnifiedMediaExtractor.ts",
    "src\shared\services\UserScriptStateManager.ts",
    "src\shared\types\browser-api.types.ts",
    "src\shared\types\browser-apis.ts",
    "src\shared\types\browser-apis.types.ts",
    "src\shared\types\browser.types.ts",
    "src\shared\types\common.types.ts",
    "src\shared\types\dom-events.types.ts",
    "src\shared\types\gallery-ui.types.clean.ts",
    "src\shared\types\gallery-ui.types.ts",
    "src\shared\types\index.ts",
    "src\shared\types\storage.ts",
    "src\shared\types\vendors.ts",
    "src\shared\utils\architecture\dependencyValidator.ts",
    "src\shared\utils\async\delay.ts",
    "src\shared\utils\async\errorBoundary.ts",
    "src\shared\utils\browser\file-system-api.ts",
    "src\shared\utils\css\css-utils.ts",
    "src\shared\utils\dom\download.ts",
    "src\shared\utils\dom\focus-manager.ts",
    "src\shared\utils\dom\namespace-manager.ts",
    "src\shared\utils\environment\environment-detector.ts",
    "src\shared\utils\environment\index.ts",
    "src\shared\utils\error\error-utils.ts",
    "src\shared\utils\event-utils.ts",
    "src\shared\utils\format\date-utils.ts",
    "src\shared\utils\format\file-utils.ts",
    "src\shared\utils\format\format-utils.ts",
    "src\shared\utils\gallery\errorHandling.ts",
    "src\shared\utils\gallery\index.ts",
    "src\shared\utils\gallery\typeGuards.ts",
    "src\shared\utils\index.ts",
    "src\shared\utils\media\converter.ts",
    "src\shared\utils\media\enhanced-tweet-extractor.ts",
    "src\shared\utils\media\enhanced-webp-handler.ts",
    "src\shared\utils\media\extractor.ts",
    "src\shared\utils\media\format-detector.ts",
    "src\shared\utils\media\index.ts",
    "src\shared\utils\media\simplified-extractor.ts",
    "src\shared\utils\media\thumbnailConverter.ts",
    "src\shared\utils\media\url-utils.ts",
    "src\shared\utils\patterns\index.ts",
    "src\shared\utils\patterns\media-factory.ts",
    "src\shared\utils\performance\asyncQueue.ts",
    "src\shared\utils\performance\event-optimization.ts",
    "src\shared\utils\performance\GalleryPerformanceMonitor.ts",
    "src\shared\utils\performance\ImageCacheManager.ts",
    "src\shared\utils\performance\index.ts",
    "src\shared\utils\performance\LazyLoadingSystem.tsx",
    "src\shared\utils\performance\MemoryMonitor.ts",
    "src\shared\utils\performance\optimization.ts",
    "src\shared\utils\performance\performance-monitor.ts",
    "src\shared\utils\performance\SimpleLazyLoadingSystem.tsx",
    "src\shared\utils\performance\UnifiedPerformanceMonitor.ts",
    "src\shared\utils\preact\index.ts",
    "src\shared\utils\timing\index.ts",
    "src\shared\utils\timing\timing.ts",
    "src\shared\utils\url\thumbnail-utils.ts",
    "src\shared\utils\url\url-utils.ts",
    "src\shared\utils\userscript\enhanced-download.ts",
    "src\shared\utils\validation\advancedTypeGuards.ts",
    "src\shared\utils\vendors\index.optimized.ts",
    "src\shared\utils\zip\index.ts"
)

# 스크립트 시작
Write-ColorOutput "🚀 X.com Enhanced Gallery - 미사용 파일 정리 시작" "Cyan"
Write-ColorOutput "=================================================" "Cyan"

# 매개변수 출력
Write-ColorOutput "📋 설정:" "Yellow"
Write-ColorOutput "  - 백업 경로: $BackupPath" "White"
Write-ColorOutput "  - Dry Run: $DryRun" "White"
Write-ColorOutput "  - Force 모드: $Force" "White"
Write-ColorOutput "  - 대상 파일 수: $($UnusedFiles.Count)" "White"
Write-ColorOutput ""

# 현재 디렉토리 확인
$CurrentDir = Get-Location
if (-not (Test-Path "src")) {
    Write-ColorOutput "❌ 오류: 프로젝트 루트 디렉토리에서 실행해주세요 (src 폴더가 있는 곳)" "Red"
    exit 1
}

# 백업 디렉토리 생성
$FullBackupPath = Join-Path $CurrentDir $BackupPath
if (-not $DryRun) {
    if (-not (Test-Path $FullBackupPath)) {
        New-Item -ItemType Directory -Path $FullBackupPath -Force | Out-Null
        Write-ColorOutput "📁 백업 디렉토리 생성: $FullBackupPath" "Green"
    }
}

# 로그 파일 설정
$LogFile = Join-Path $FullBackupPath "cleanup-log-$(Get-Date -Format 'yyyyMMdd-HHmmss').txt"
$ErrorLogFile = Join-Path $FullBackupPath "cleanup-errors-$(Get-Date -Format 'yyyyMMdd-HHmmss').txt"

function Write-Log {
    param([string]$Message, [string]$LogPath = $LogFile)
    $TimeStamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogEntry = "[$TimeStamp] $Message"

    if (-not $DryRun) {
        Add-Content -Path $LogPath -Value $LogEntry -Encoding UTF8
    }
    Write-Host $LogEntry
}

# 실제 존재하는 파일만 필터링
$ExistingFiles = @()
$NotFoundFiles = @()

Write-ColorOutput "🔍 파일 존재 여부 확인 중..." "Yellow"
foreach ($File in $UnusedFiles) {
    $FullPath = Join-Path $CurrentDir $File
    if (Test-Path $FullPath) {
        $ExistingFiles += $File
    } else {
        $NotFoundFiles += $File
    }
}

Write-ColorOutput "✅ 존재하는 파일: $($ExistingFiles.Count)개" "Green"
Write-ColorOutput "❌ 존재하지 않는 파일: $($NotFoundFiles.Count)개" "Yellow"

if ($NotFoundFiles.Count -gt 0) {
    Write-ColorOutput "📝 존재하지 않는 파일들:" "Yellow"
    $NotFoundFiles | ForEach-Object { Write-ColorOutput "  - $_" "Gray" }
}

# 확인 메시지 (Force 모드가 아닌 경우)
if (-not $Force -and -not $DryRun -and $ExistingFiles.Count -gt 0) {
    Write-ColorOutput ""
    Write-ColorOutput "⚠️  경고: $($ExistingFiles.Count)개 파일을 백업으로 이동합니다." "Yellow"
    Write-ColorOutput "이 작업은 되돌릴 수 있지만 신중하게 진행하세요." "Yellow"
    $Confirmation = Read-Host "계속하시겠습니까? (y/N)"

    if ($Confirmation -ne "y" -and $Confirmation -ne "Y") {
        Write-ColorOutput "❌ 작업이 취소되었습니다." "Red"
        exit 0
    }
}

# 실제 파일 이동 작업
$MovedCount = 0
$ErrorCount = 0
$SkippedCount = 0

Write-ColorOutput ""
Write-ColorOutput "🔄 파일 이동 작업 시작..." "Cyan"

foreach ($File in $ExistingFiles) {
    try {
        $SourcePath = Join-Path $CurrentDir $File
        $RelativeBackupPath = Join-Path $BackupPath $File
        $DestinationPath = Join-Path $CurrentDir $RelativeBackupPath
        $DestinationDir = Split-Path $DestinationPath -Parent

        if ($DryRun) {
            Write-ColorOutput "  [DRY RUN] $File → $RelativeBackupPath" "Cyan"
            $MovedCount++
        } else {
            # 대상 디렉토리 생성
            if (-not (Test-Path $DestinationDir)) {
                New-Item -ItemType Directory -Path $DestinationDir -Force | Out-Null
            }

            # 파일 이동
            if (Test-Path $DestinationPath) {
                Write-ColorOutput "  ⚠️  이미 존재함: $File" "Yellow"
                Write-Log "SKIPPED: $File (already exists in backup)" $ErrorLogFile
                $SkippedCount++
            } else {
                Move-Item -Path $SourcePath -Destination $DestinationPath -Force
                Write-ColorOutput "  ✅ 이동 완료: $File" "Green"
                Write-Log "MOVED: $File → $RelativeBackupPath"
                $MovedCount++
            }
        }
    } catch {
        Write-ColorOutput "  ❌ 이동 실패: $File - $($_.Exception.Message)" "Red"
        Write-Log "ERROR: Failed to move $File - $($_.Exception.Message)" $ErrorLogFile
        $ErrorCount++
    }
}

# 빈 디렉토리 정리
if (-not $DryRun -and $MovedCount -gt 0) {
    Write-ColorOutput ""
    Write-ColorOutput "🧹 빈 디렉토리 정리 중..." "Yellow"

    # src 디렉토리 하위의 빈 폴더들 찾아서 제거
    $EmptyDirs = Get-ChildItem -Path "src" -Recurse -Directory |
                 Where-Object { (Get-ChildItem $_.FullName -Force | Measure-Object).Count -eq 0 } |
                 Sort-Object FullName -Descending

    foreach ($EmptyDir in $EmptyDirs) {
        try {
            $RelativePath = $EmptyDir.FullName.Substring($CurrentDir.Path.Length + 1)
            Remove-Item $EmptyDir.FullName -Force
            Write-ColorOutput "  🗑️  빈 디렉토리 제거: $RelativePath" "Gray"
            Write-Log "REMOVED EMPTY DIR: $RelativePath"
        } catch {
            Write-ColorOutput "  ⚠️  디렉토리 제거 실패: $($EmptyDir.Name)" "Yellow"
        }
    }
}

# 결과 요약
Write-ColorOutput ""
Write-ColorOutput "📊 작업 완료 요약" "Cyan"
Write-ColorOutput "=================================================" "Cyan"
Write-ColorOutput "✅ 성공적으로 이동: $MovedCount 개" "Green"
Write-ColorOutput "⚠️  건너뜀: $SkippedCount 개" "Yellow"
Write-ColorOutput "❌ 오류 발생: $ErrorCount 개" "Red"
Write-ColorOutput "📁 백업 위치: $FullBackupPath" "Blue"

if (-not $DryRun) {
    Write-ColorOutput "📝 로그 파일: $LogFile" "Blue"
    if ($ErrorCount -gt 0) {
        Write-ColorOutput "🚨 오류 로그: $ErrorLogFile" "Red"
    }
}

# 복원 명령어 안내
if ($MovedCount -gt 0 -and -not $DryRun) {
    Write-ColorOutput ""
    Write-ColorOutput "🔄 복원이 필요한 경우:" "Yellow"
    Write-ColorOutput "powershell -File scripts\restore-unused-files.ps1 -BackupPath '$BackupPath'" "Cyan"
}

# 다음 단계 안내
Write-ColorOutput ""
Write-ColorOutput "🎯 다음 단계:" "Cyan"
Write-ColorOutput "1. npm run typecheck  # 타입 오류 확인" "White"
Write-ColorOutput "2. npm run build      # 빌드 테스트" "White"
Write-ColorOutput "3. npm run test       # 기능 테스트" "White"
Write-ColorOutput "4. 문제가 없으면 커밋" "White"

if ($DryRun) {
    Write-ColorOutput ""
    Write-ColorOutput "💡 실제 실행하려면 -DryRun 플래그를 제거하고 다시 실행하세요." "Yellow"
}

Write-ColorOutput ""
Write-ColorOutput "🎉 미사용 파일 정리 작업 완료!" "Green"
