[CmdletBinding()]
param(
    [string]$TaskName = 'PlantVision Backend',
    [ValidateRange(1024, 65535)]
    [int]$Port = 5000
)

$ErrorActionPreference = 'Stop'
$identity = [Security.Principal.WindowsIdentity]::GetCurrent()
$principalCheck = New-Object Security.Principal.WindowsPrincipal($identity)
if (-not $principalCheck.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    throw 'Run this script from PowerShell as Administrator.'
}

$task = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if (-not $task) {
    Write-Output "Scheduled task '$TaskName' is not installed."
    exit 0
}

function Get-PlantVisionWaitressProcess {
    $repoRoot = Split-Path -Parent $PSScriptRoot
    $listenerPids = @(
        Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
            Select-Object -ExpandProperty OwningProcess -Unique
    )

    foreach ($listenerPid in $listenerPids) {
        $processInfo = Get-CimInstance Win32_Process -Filter "ProcessId = $listenerPid" -ErrorAction SilentlyContinue
        if (-not $processInfo) {
            continue
        }

        $commandLine = [string]$processInfo.CommandLine
        $isWaitress = $commandLine -match '(?i)-m\s+waitress' -and $commandLine -match '(?i)app:app'
        $isProjectProcess = $commandLine -like "*$repoRoot\backend\*"
        if ($isWaitress -and $isProjectProcess) {
            $processInfo
        }
    }
}

if ($task.State -eq 'Running') {
    Stop-ScheduledTask -TaskName $TaskName
}

# Stopping a scheduled PowerShell action can leave its native Python child
# running. Only terminate a Waitress listener whose command line belongs to
# this project, never an unrelated process that happens to use the same port.
Start-Sleep -Seconds 2
Get-PlantVisionWaitressProcess | ForEach-Object {
    Stop-Process -Id $_.ProcessId -Force -ErrorAction Stop
}

$deadline = (Get-Date).AddSeconds(30)
do {
    $listener = netstat -ano | Select-String -Pattern ":$Port\s+.*LISTENING"
    if (-not $listener) {
        Write-Output "Scheduled task '$TaskName' stopped."
        exit 0
    }
    Start-Sleep -Seconds 1
} while ((Get-Date) -lt $deadline)

throw "Scheduled task stopped but port $Port is still listening"
