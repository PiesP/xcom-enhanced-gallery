# Remove all .solid extensions from import statements
# This script finds and replaces all occurrences of .solid in import/export statements
# Uses UTF-8 without BOM to prevent encoding issues

$rootPath = "C:\git\xcom-enhanced-gallery"
$srcPath = Join-Path $rootPath "src"

Write-Host "Searching for .solid imports in: $srcPath"

# Find all .tsx and .ts files
$files = Get-ChildItem -Path $srcPath -Recurse -Include "*.tsx","*.ts" | Where-Object { $_.Name -notlike "*.test.*" -and $_.Name -notlike "*.spec.*" }

Write-Host "Found $($files.Count) files to process"

$totalReplacements = 0
$utf8NoBom = New-Object System.Text.UTF8Encoding $false

foreach ($file in $files) {
    $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
    $originalContent = $content

    # Replace .solid extensions in import/export statements
    $content = $content -replace "(import\s+.*?from\s+['""].*?)\.solid(['""])", '$1$2'
    $content = $content -replace "(export\s+.*?from\s+['""].*?)\.solid(['""])", '$1$2'

    if ($content -ne $originalContent) {
        [System.IO.File]::WriteAllText($file.FullName, $content, $utf8NoBom)
        $changes = ([regex]::Matches($originalContent, "\.solid")).Count
        Write-Host "  Updated: $($file.Name) ($changes replacements)"
        $totalReplacements += $changes
    }
}

Write-Host "`nTotal: $totalReplacements .solid references removed from imports/exports"
