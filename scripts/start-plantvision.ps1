[CmdletBinding()]
param(
    [ValidateRange(1024, 65535)]
    [int]$Port = 5000
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$backendDir = Join-Path $repoRoot 'backend'
$pythonExe = Join-Path $backendDir '.venv\Scripts\python.exe'
$runtimeDir = Join-Path $repoRoot '.runtime'
$logDir = Join-Path $repoRoot 'logs'
$pidFile = Join-Path $runtimeDir 'plantvision.pid'

foreach ($requiredFile in @($pythonExe, (Join-Path $backendDir '.env'), (Join-Path $repoRoot 'build\index.html'))) {
    if (-not (Test-Path -LiteralPath $requiredFile -PathType Leaf)) {
        throw "Required production file is missing: $requiredFile"
    }
}

New-Item -ItemType Directory -Path $runtimeDir -Force | Out-Null
New-Item -ItemType Directory -Path $logDir -Force | Out-Null

if (Test-Path -LiteralPath $pidFile) {
    $existingId = [int](Get-Content -LiteralPath $pidFile -Raw)
    if (Get-Process -Id $existingId -ErrorAction SilentlyContinue) {
        throw "PlantVision already appears to be running with PID $existingId"
    }
    Remove-Item -LiteralPath $pidFile -Force
}

$listener = Get-NetTCPConnection -LocalAddress '127.0.0.1' -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
if ($listener) {
    throw "Port 127.0.0.1:$Port is already in use"
}

$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$stdoutLog = Join-Path $logDir "plantvision-$stamp.out.log"
$stderrLog = Join-Path $logDir "plantvision-$stamp.err.log"
$waitressArgs = @(
    '-m', 'waitress', '--host=127.0.0.1', "--port=$Port", '--threads=4',
    '--connection-limit=50', '--channel-timeout=120',
    '--max-request-header-size=65536', '--max-request-body-size=9437184',
    '--url-scheme=https', '--ident=PlantVision', 'app:app'
)

$process = Start-Process -FilePath $pythonExe -ArgumentList $waitressArgs `
    -WorkingDirectory $backendDir -WindowStyle Hidden -PassThru `
    -RedirectStandardOutput $stdoutLog -RedirectStandardError $stderrLog
Set-Content -LiteralPath $pidFile -Value $process.Id -Encoding ASCII

$healthUrl = "http://127.0.0.1:$Port/health"
$deadline = (Get-Date).AddSeconds(120)
do {
    if ($process.HasExited) {
        Remove-Item -LiteralPath $pidFile -Force -ErrorAction SilentlyContinue
        throw "PlantVision exited during startup. Check $stderrLog"
    }
    try {
        $response = Invoke-WebRequest -Uri $healthUrl -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            $escapedPort = [regex]::Escape(":$Port")
            $listenerLine = netstat -ano | Where-Object {
                $_ -match "^\s*TCP\s+127\.0\.0\.1$escapedPort\s+.*LISTENING\s+(\d+)\s*$"
            } | Select-Object -First 1
            if (-not $listenerLine -or $listenerLine -notmatch 'LISTENING\s+(\d+)\s*$') {
                throw "PlantVision is healthy but its loopback listener PID could not be resolved"
            }
            $listenerId = [int]$matches[1]
            Set-Content -LiteralPath $pidFile -Value $listenerId -Encoding ASCII
            Write-Output "PlantVision is ready at $healthUrl (PID $listenerId)"
            Write-Output "Logs: $stdoutLog and $stderrLog"
            exit 0
        }
    }
    catch {
        Start-Sleep -Seconds 2
    }
} while ((Get-Date) -lt $deadline)

Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
Remove-Item -LiteralPath $pidFile -Force -ErrorAction SilentlyContinue
throw "PlantVision did not become ready within 120 seconds. Check $stderrLog"
