# 최종 핵심 미디어 파일 수정

$mediaFiles = @{
    "src\shared\services\media-extraction\extractors\TwitterAPIExtractor.ts" = @{
        "5" = "SIZE_CONSTANTS.FIVE"
        "imports" = "SIZE_CONSTANTS"
    }
    "src\shared\services\media-extraction\strategies\ClickedElementTweetStrategy.ts" = @{
        "10" = "SIZE_CONSTANTS.TEN"
        "imports" = "SIZE_CONSTANTS"
    }
    "src\shared\services\media-extraction\strategies\DataAttributeTweetStrategy.ts" = @{
        "5" = "SIZE_CONSTANTS.FIVE"
        "imports" = "SIZE_CONSTANTS"
    }
    "src\shared\services\media-extraction\strategies\ParentTraversalTweetStrategy.ts" = @{
        "10" = "SIZE_CONSTANTS.TEN"
        "imports" = "SIZE_CONSTANTS"
    }
    "src\shared\services\media-mapping\MediaTabUrlDirectStrategy.ts" = @{
        "10" = "SIZE_CONSTANTS.TEN"
        "imports" = "SIZE_CONSTANTS"
    }
    "src\shared\services\media\TwitterVideoExtractor.ts" = @{
        "16" = "SIZE_CONSTANTS.SIXTEEN"
        "imports" = "SIZE_CONSTANTS"
    }
    "src\shared\state\signals\download.signals.ts" = @{
        "36" = "SIZE_CONSTANTS.THIRTY_SIX"
        "9" = "SIZE_CONSTANTS.NINE"
        "100" = "PERCENTAGE.FULL"
        "imports" = "SIZE_CONSTANTS, PERCENTAGE"
    }
    "src\shared\utils\media\media-url.util.ts" = @{
        "200" = "TIME_CONSTANTS.MILLISECONDS_200"
        "imports" = "TIME_CONSTANTS"
    }
}

foreach ($file in $mediaFiles.Keys) {
    if (Test-Path $file) {
        Write-Host "미디어 파일 수정: $file"
        $content = Get-Content $file -Raw
        $config = $mediaFiles[$file]

        # Import 추가
        $firstImport = $config.imports.Split(',')[0].Trim()
        if ($content -notmatch [regex]::Escape($firstImport)) {
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

        # 숫자 교체
        foreach ($num in $config.Keys) {
            if ($num -ne "imports") {
                $replacement = $config[$num]
                $content = $content -replace "\b$num\b", $replacement
            }
        }

        Set-Content $file $content -NoNewline -Encoding UTF8
        Write-Host "완료: $file"
    }
}

Write-Host "미디어 파일 수정 완료!"
