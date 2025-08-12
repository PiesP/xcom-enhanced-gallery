# 매직 넘버 일괄 수정 스크립트 (핵심 파일만)

$coreFiles = @{
    "src\shared\services\toast-service.ts" = @{
        "patterns" = @{ " 3000" = " TIME_CONSTANTS.THREE_SECONDS" }
        "imports" = "TIME_CONSTANTS"
    }
    "src\shared\components\ui\Toolbar\components\ToolbarButton.tsx" = @{
        "patterns" = @{ " 24" = " SIZE_CONSTANTS.TWENTY_FOUR" }
        "imports" = "SIZE_CONSTANTS"
    }
    "src\shared\hooks\useAccessibility.ts" = @{
        "patterns" = @{ " 1000" = " TIME_CONSTANTS.ONE_SECOND"; " 100" = " PERCENTAGE.FULL" }
        "imports" = "TIME_CONSTANTS, PERCENTAGE"
    }
    "src\features\settings\services\twitter-token-extractor.ts" = @{
        "patterns" = @{ " -50" = " SIZE_CONSTANTS.NEGATIVE_FIFTY"; " 50" = " PERCENTAGE.HALF"; " 5000" = " TIME_CONSTANTS.FIVE_SECONDS" }
        "imports" = "SIZE_CONSTANTS, PERCENTAGE, TIME_CONSTANTS"
    }
}

Write-Host "핵심 파일 매직 넘버 수정 시작..."

foreach ($file in $coreFiles.Keys) {
    $fullPath = Join-Path (Get-Location) $file
    if (Test-Path $fullPath) {
        Write-Host "수정 중: $file"

        $content = Get-Content $fullPath -Raw
        $config = $coreFiles[$file]

        # Import 추가
        $importLine = "import { $($config.imports) } from '@/constants';"

        if ($content -notmatch [regex]::Escape($config.imports)) {
            # 첫 번째 import 문 이후에 추가
            $lines = $content -split "`r?`n"
            $insertIndex = -1
            for ($i = 0; $i -lt $lines.Count; $i++) {
                if ($lines[$i] -match "^import") {
                    $insertIndex = $i + 1
                }
            }
            if ($insertIndex -ge 0) {
                $lines = @($lines[0..($insertIndex-1)]) + $importLine + @($lines[$insertIndex..($lines.Count-1)])
                $content = $lines -join "`n"
            }
        }

        # 패턴 교체
        foreach ($pattern in $config.patterns.Keys) {
            $replacement = $config.patterns[$pattern]
            $content = $content -replace [regex]::Escape($pattern), $replacement
        }

        Set-Content $fullPath $content -NoNewline -Encoding UTF8
        Write-Host "완료: $file"
    } else {
        Write-Host "파일 없음: $file" -ForegroundColor Yellow
    }
}

Write-Host "핵심 파일 수정 완료!"
