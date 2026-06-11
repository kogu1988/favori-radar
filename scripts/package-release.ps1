$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

$manifest = Get-Content "public/manifest.json" -Raw | ConvertFrom-Json
$releaseDirectory = Join-Path $projectRoot "release"
$archivePath = Join-Path $releaseDirectory "favori-radar-$($manifest.version).zip"

npm run build

if (-not (Test-Path $releaseDirectory)) {
  New-Item -ItemType Directory -Path $releaseDirectory | Out-Null
}

if (Test-Path $archivePath) {
  Remove-Item -LiteralPath $archivePath
}

Compress-Archive -Path (Join-Path $projectRoot "dist\*") -DestinationPath $archivePath

Write-Host "Release paketi hazır: $archivePath"
