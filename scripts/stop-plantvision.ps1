[CmdletBinding()]
param(
    [ValidateRange(1024, 65535)]
    [int]$Port = 5000
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$runtimeDir = Join-Path $repoRoot '.runtime'
$pidFile = Join-Path $runtimeDir 'plantvision.pid'

if (-not (Test-Path -LiteralPath $pidFile -PathType Leaf)) {
    Write-Output 'PlantVision is not running (PID file not found).'
    exit 0
}

$processId = [int](Get-Content -LiteralPath $pidFile -Raw)
$process = Get-Process -Id $processId -ErrorAction SilentlyContinue
if (-not $process) {
    Remove-Item -LiteralPath $pidFile -Force
    Write-Output 'Removed a stale PlantVision PID file.'
    exit 0
}

$escapedPort = [regex]::Escape(":$Port")
$ownsExpectedListener = netstat -ano | Where-Object {
    $_ -match "^\s*TCP\s+127\.0\.0\.1$escapedPort\s+.*LISTENING\s+$processId\s*$"
} | Select-Object -First 1
if (-not $ownsExpectedListener -or $process.ProcessName -notmatch '^python') {
    throw "PID $processId is not the Python process listening on 127.0.0.1:$Port; refusing to stop it."
}

Stop-Process -Id $processId
Wait-Process -Id $processId -Timeout 15 -ErrorAction SilentlyContinue
if (Get-Process -Id $processId -ErrorAction SilentlyContinue) {
    throw "PlantVision PID $processId did not stop cleanly"
}
Remove-Item -LiteralPath $pidFile -Force
Write-Output "PlantVision stopped (PID $processId)."
