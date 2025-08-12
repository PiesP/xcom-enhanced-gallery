#!/usr/bin/env pwsh
# 매직 넘버를 상수로 교체하는 스크립트

$files = @(
    "src\shared\components\ui\InteractionComponents.tsx",
    "src\shared\components\ui\Toolbar\components\ToolbarButton.tsx",
    "src\shared\dom\dom-service.ts",
    "src\shared\dom\unified-dom-service.ts",
    "src\shared\external\zip\zip-creator.ts",
    "src\shared\hooks\useAccessibility.ts",
    "src\shared\hooks\useScrollDirection.ts",
    "src\shared\media\filename-service.ts",
    "src\shared\services\toast-service.ts"
)

# 공통 교체 패턴들
$replacements = @{
    " 100" = " PERCENTAGE.FULL"
    " 50" = " PERCENTAGE.HALF"
    " 40" = " PERCENTAGE.FORTY"
    " 30" = " PERCENTAGE.THIRTY"
    " 20" = " SIZE_CONSTANTS.TWENTY"
    " 10" = " SIZE_CONSTANTS.TEN"
    " 24" = " SIZE_CONSTANTS.TWENTY_FOUR"
    " 150" = " TIME_CONSTANTS.MILLISECONDS_150"
    " 300" = " TIME_CONSTANTS.MILLISECONDS_300"
    " 1000" = " TIME_CONSTANTS.ONE_SECOND"
    " 3000" = " TIME_CONSTANTS.THREE_SECONDS"
    " 200" = " TIME_CONSTANTS.MILLISECONDS_200"
    " 1024" = " MEMORY_SIZE_CONSTANTS.BYTES_PER_KB"
}

Write-Host "매직 넘버 교체 시작..."

foreach ($file in $files) {
    $fullPath = Join-Path $PWD $file
    if (Test-Path $fullPath) {
        Write-Host "처리 중: $file"
        $content = Get-Content $fullPath -Raw

        # Import 구문이 있는지 확인하고 없으면 추가
        if ($content -notmatch "import.*constants") {
            $lines = $content -split "`n"
            $importIndex = -1
            for ($i = 0; $i -lt $lines.Count; $i++) {
                if ($lines[$i] -match "^import") {
                    $importIndex = $i
                }
            }
            if ($importIndex -ge 0) {
                $lines[$importIndex] += "`nimport { SIZE_CONSTANTS, PERCENTAGE, TIME_CONSTANTS, MEMORY_SIZE_CONSTANTS } from '@/constants';"
                $content = $lines -join "`n"
            }
        }

        # 매직 넘버 교체
        foreach ($pattern in $replacements.Keys) {
            $content = $content -replace [regex]::Escape($pattern), $replacements[$pattern]
        }

        Set-Content $fullPath $content -NoNewline
        Write-Host "완료: $file"
    }
}

Write-Host "매직 넘버 교체 완료!"
