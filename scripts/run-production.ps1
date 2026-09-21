[CmdletBinding()]
param(
    [ValidateRange(1024, 65535)]
    [int]$Port = 5000
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$backendDir = Join-Path $repoRoot 'backend'
$pythonExe = Join-Path $backendDir '.venv\Scripts\python.exe'
$requiredFiles = @(
    $pythonExe,
    (Join-Path $backendDir '.env'),
    (Join-Path $backendDir 'app.py'),
    (Join-Path $repoRoot 'build\index.html')
)

foreach ($requiredFile in $requiredFiles) {
    if (-not (Test-Path -LiteralPath $requiredFile -PathType Leaf)) {
        throw "Required production file is missing: $requiredFile"
    }
}

$waitressArgs = @(
    '-m', 'waitress',
    '--host=127.0.0.1',
    "--port=$Port",
    '--threads=4',
    '--connection-limit=50',
    '--channel-timeout=120',
    '--max-request-header-size=65536',
    '--max-request-body-size=9437184',
    '--url-scheme=https',
    '--ident=PlantVision',
    'app:app'
)

Push-Location $backendDir
try {
    & $pythonExe @waitressArgs
    exit $LASTEXITCODE
}
finally {
    Pop-Location
}
