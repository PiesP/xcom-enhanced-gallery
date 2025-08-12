# 마지막 핵심 파일들 수정

$finalFiles = @{
    "src\shared\dom\unified-dom-service.ts" = @{
        "10" = "SIZE_CONSTANTS.TEN"
        "imports" = "SIZE_CONSTANTS"
    }
    "src\shared\external\zip\zip-creator.ts" = @{
        "10" = "SIZE_CONSTANTS.TEN"
        "imports" = "SIZE_CONSTANTS"
    }
    "src\shared\hooks\useScrollDirection.ts" = @{
        "150" = "TIME_CONSTANTS.MILLISECONDS_150"
        "imports" = "TIME_CONSTANTS"
    }
    "src\shared\media\filename-service.ts" = @{
        "10" = "SIZE_CONSTANTS.TEN"
        "imports" = "SIZE_CONSTANTS"
    }
    "src\shared\services\gallery\GalleryService.ts" = @{
        "100" = "PERCENTAGE.FULL"
        "imports" = "PERCENTAGE"
    }
    "src\shared\services\theme-service.ts" = @{
        "200" = "TIME_CONSTANTS.MILLISECONDS_200"
        "16" = "SIZE_CONSTANTS.SIXTEEN"
        "imports" = "TIME_CONSTANTS, SIZE_CONSTANTS"
    }
}

foreach ($file in $finalFiles.Keys) {
    if (Test-Path $file) {
        Write-Host "최종 수정: $file"
        $content = Get-Content $file -Raw
        $config = $finalFiles[$file]

        # Import 추가 (아직 없다면)
        if ($content -notmatch [regex]::Escape($config.imports.Split(',')[0].Trim())) {
            $importLine = "import { $($config.imports) } from '@/constants';"
            $lines = $content -split "`r?`n"

            for ($i = 0; $i -lt $lines.Count; $i++) {
                if ($lines[$i] -match "^import.*from") {
                    $lines = @($lines[0..$i]) + $importLine + @($lines[($i+1)..($lines.Count-1)])
                    break
                }
            }
            $content = $lines -join "`n"
        }

        # 숫자 교체 (정확한 매칭을 위해)
        foreach ($num in $config.Keys) {
            if ($num -ne "imports") {
                $replacement = $config[$num]
                # 단어 경계 사용하여 정확한 매칭
                $content = $content -replace "\b$num\b", $replacement
            }
        }

        Set-Content $file $content -NoNewline -Encoding UTF8
        Write-Host "완료: $file"
    }
}

Write-Host "핵심 파일 최종 수정 완료!"
