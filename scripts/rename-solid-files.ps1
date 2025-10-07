# Rename all .solid.tsx files to .tsx using git mv
# This preserves git history

$rootPath = Split-Path -Parent $PSScriptRoot
$srcPath = Join-Path $rootPath "src"

Write-Host "Searching in: $srcPath"
$files = Get-ChildItem -Path $srcPath -Recurse -Filter "*.solid.tsx"
Write-Host "Found $($files.Count) files"

$count = 0

foreach ($file in $files) {
    $newName = $file.Name -replace '\.solid\.tsx$', '.tsx'
    $newPath = Join-Path $file.Directory.FullName $newName
    
    Write-Host "Renaming: $($file.Name) -> $newName"
    
    # Use relative path for git mv
    $relativePath = $file.FullName.Substring($rootPath.Length + 1)
    $relativeNewPath = $newPath.Substring($rootPath.Length + 1)
    
    git mv "$relativePath" "$relativeNewPath"
    
    if ($LASTEXITCODE -eq 0) {
        $count++
    } else {
        Write-Error "Failed to rename: $relativePath"
    }
}

Write-Host "`nRenamed $count files successfully"
