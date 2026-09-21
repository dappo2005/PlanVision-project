[CmdletBinding()]
param(
    [ValidateRange(1024, 65535)]
    [int]$Port = 5000
)

$ErrorActionPreference = 'Continue'
$repoRoot = Split-Path -Parent $PSScriptRoot
$logDir = Join-Path $repoRoot 'logs'
New-Item -ItemType Directory -Path $logDir -Force | Out-Null
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$logFile = Join-Path $logDir "scheduled-$stamp.log"
$backendDir = Join-Path $repoRoot 'backend'
$pythonExe = Join-Path $backendDir '.venv\Scripts\python.exe'

@(
    "started_at=$((Get-Date).ToString('o'))",
    "identity=$([Security.Principal.WindowsIdentity]::GetCurrent().Name)",
    "repo_access=$(Test-Path -LiteralPath $repoRoot -PathType Container)",
    "python_access=$(Test-Path -LiteralPath $pythonExe -PathType Leaf)",
    "env_access=$(Test-Path -LiteralPath (Join-Path $backendDir '.env') -PathType Leaf)",
    "build_access=$(Test-Path -LiteralPath (Join-Path $repoRoot 'build\index.html') -PathType Leaf)"
) | Set-Content -LiteralPath $logFile -Encoding UTF8

& $pythonExe --version *>> $logFile
if ($LASTEXITCODE -ne 0) {
    "python_probe_exit=$LASTEXITCODE" | Add-Content -LiteralPath $logFile -Encoding UTF8
    exit $LASTEXITCODE
}

$waitressArgs = @(
    '-m', 'waitress', '--host=127.0.0.1', "--port=$Port", '--threads=4',
    '--connection-limit=50', '--channel-timeout=120',
    '--max-request-header-size=65536', '--max-request-body-size=9437184',
    '--url-scheme=https', '--ident=PlantVision', 'app:app'
)
Push-Location $backendDir
try {
    & $pythonExe @waitressArgs *>> $logFile
    $processExitCode = $LASTEXITCODE
}
finally {
    Pop-Location
}
if ($null -eq $processExitCode) {
    $processExitCode = 1
}
exit $processExitCode
