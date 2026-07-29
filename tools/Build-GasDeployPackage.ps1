[CmdletBinding()]
param(
    [string]$OutputDirectory = ".gas-deploy",
    [string]$BaselineDirectory = ""
)

$ErrorActionPreference = "Stop"
$workspaceRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot ".."))
$manifestPath = Join-Path $PSScriptRoot "gas-deploy-files.json"
$claspConfigPath = Join-Path $workspaceRoot ".clasp.json"
$outputPath = if ([System.IO.Path]::IsPathRooted($OutputDirectory)) {
    [System.IO.Path]::GetFullPath($OutputDirectory)
} else {
    [System.IO.Path]::GetFullPath((Join-Path $workspaceRoot $OutputDirectory))
}

if (Test-Path -LiteralPath $outputPath) {
    throw "Output directory already exists; refusing to overwrite: $outputPath"
}
if (-not (Test-Path -LiteralPath $claspConfigPath)) {
    throw "Missing local .clasp.json"
}

$manifest = Get-Content -Raw -LiteralPath $manifestPath | ConvertFrom-Json
$files = @($manifest.files)
$releaseOverlay = @($manifest.releaseOverlay)
if ($files.Count -eq 0) {
    throw "Deploy allowlist is empty"
}

$forbiddenPattern = '(^|[\\/])(test-results|playwright-report|node_modules)([\\/]|$)|(^|[\\/])(temp|recovered|old_)|danhba_chuan_hoa'
$seen = @{}
foreach ($relativePath in $files) {
    if ([System.IO.Path]::IsPathRooted($relativePath) -or $relativePath -match '(^|[\\/])\.\.([\\/]|$)') {
        throw "Unsafe allowlist path: $relativePath"
    }
    if ($relativePath -match $forbiddenPattern) {
        throw "Forbidden deploy path: $relativePath"
    }
    if ($seen.ContainsKey($relativePath)) {
        throw "Duplicate allowlist path: $relativePath"
    }
    $seen[$relativePath] = $true
    $sourcePath = [System.IO.Path]::GetFullPath((Join-Path $workspaceRoot $relativePath))
    if (-not $sourcePath.StartsWith($workspaceRoot + [System.IO.Path]::DirectorySeparatorChar)) {
        throw "Source escapes workspace: $relativePath"
    }
    if (-not (Test-Path -LiteralPath $sourcePath -PathType Leaf)) {
        throw "Missing deploy source: $relativePath"
    }
}

New-Item -ItemType Directory -Path $outputPath | Out-Null
foreach ($relativePath in $files) {
    $sourcePath = Join-Path $workspaceRoot $relativePath
    if ($BaselineDirectory -and -not ($releaseOverlay -contains $relativePath)) {
        $baselineRoot = [System.IO.Path]::GetFullPath($BaselineDirectory)
        $baselineRelativePath = $relativePath
        if ($relativePath -eq "Code.gs.gs") {
            $baselineRelativePath = "Code.gs.js"
        } elseif ($relativePath.EndsWith(".gs")) {
            $baselineRelativePath = $relativePath.Substring(0, $relativePath.Length - 3) + ".js"
        }
        $sourcePath = Join-Path $baselineRoot $baselineRelativePath
        if (-not (Test-Path -LiteralPath $sourcePath -PathType Leaf)) {
            throw "Missing baseline source: $baselineRelativePath"
        }
    }
    $targetPath = Join-Path $outputPath $relativePath
    $targetParent = Split-Path -Parent $targetPath
    if (-not (Test-Path -LiteralPath $targetParent)) {
        New-Item -ItemType Directory -Path $targetParent | Out-Null
    }
    Copy-Item -LiteralPath $sourcePath -Destination $targetPath
}

$claspConfig = Get-Content -Raw -LiteralPath $claspConfigPath | ConvertFrom-Json
$claspConfig.rootDir = ""
$claspConfig | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath (Join-Path $outputPath ".clasp.json") -Encoding utf8

$actualFiles = Get-ChildItem -LiteralPath $outputPath -Recurse -File |
    ForEach-Object {
        $fullName = [System.IO.Path]::GetFullPath($_.FullName)
        $prefix = $outputPath.TrimEnd([System.IO.Path]::DirectorySeparatorChar) + [System.IO.Path]::DirectorySeparatorChar
        if (-not $fullName.StartsWith($prefix)) {
            throw "Staging file escapes output directory: $fullName"
        }
        $fullName.Substring($prefix.Length).Replace('\', '/')
    } |
    Sort-Object
$expectedFiles = @($files | ForEach-Object { $_.Replace('\', '/') }) + ".clasp.json" | Sort-Object
$difference = Compare-Object -ReferenceObject $expectedFiles -DifferenceObject $actualFiles
if ($difference) {
    throw "Staging inventory does not match allowlist: $($difference | Out-String)"
}

Write-Host "Apps Script staging package ready: $outputPath"
Write-Host "Validated files: $($actualFiles.Count)"
if ($BaselineDirectory) {
    Write-Host "Release mode: remote baseline with $($releaseOverlay.Count) approved overlays."
} else {
    Write-Warning "Local-only package: supply -BaselineDirectory before a production push."
}
Write-Host "Run clasp commands only with this directory as the working directory."
