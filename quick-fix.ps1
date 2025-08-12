# 빠른 매직 넘버 수정

# 주요 갤러리 훅 파일들 처리
$files = @(
    "src\features\gallery\hooks\use-gallery-scroll.ts",
    "src\features\gallery\hooks\useScrollPositionManager.ts",
    "src\features\settings\services\settings-service.ts"
)

$patterns = @{
    "150" = "TIME_CONSTANTS.MILLISECONDS_150"
    "300" = "TIME_CONSTANTS.MILLISECONDS_300"
    "1000" = "TIME_CONSTANTS.ONE_SECOND"
    "50" = "PERCENTAGE.HALF"
    "10" = "SIZE_CONSTANTS.TEN"
    "20" = "SIZE_CONSTANTS.TWENTY"
}

foreach ($file in $files) {
    $content = Get-Content $file -Raw
    if ($content -match "import.*from.*constants") {
        Write-Host "이미 constants import 있음: $file"
    } else {
        Write-Host "Constants import 추가: $file"
        # 첫 번째 import 뒤에 추가
        $lines = $content -split "`r?`n"
        for ($i = 0; $i -lt $lines.Length; $i++) {
            if ($lines[$i] -match "^import.*from") {
                $lines[$i] += "`nimport { TIME_CONSTANTS, PERCENTAGE, SIZE_CONSTANTS } from '@/constants';"
                break
            }
        }
        $content = $lines -join "`n"
    }

    foreach ($old in $patterns.Keys) {
        $new = $patterns[$old]
        $content = $content -replace "\b$old\b", $new
    }

    Set-Content $file $content -NoNewline -Encoding UTF8
    Write-Host "완료: $file"
}

Write-Host "핵심 갤러리 파일 수정 완료!"
