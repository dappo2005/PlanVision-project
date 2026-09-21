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

$repoRoot = Split-Path -Parent $PSScriptRoot
$runner = Join-Path $PSScriptRoot 'run-scheduled.ps1'
if (-not (Test-Path -LiteralPath $runner -PathType Leaf)) {
    throw "Scheduled runner is missing: $runner"
}

$powerShellExe = Join-Path $PSHOME 'powershell.exe'
if (-not (Test-Path -LiteralPath $powerShellExe)) {
    $powerShellExe = 'powershell.exe'
}
$arguments = "-NoLogo -NoProfile -NonInteractive -ExecutionPolicy Bypass -File `"$runner`" -Port $Port"
$action = New-ScheduledTaskAction -Execute $powerShellExe -Argument $arguments -WorkingDirectory $repoRoot
$trigger = New-ScheduledTaskTrigger -AtStartup
$trigger.Delay = 'PT45S'
$principal = New-ScheduledTaskPrincipal -UserId 'SYSTEM' -LogonType ServiceAccount -RunLevel Highest
$settings = New-ScheduledTaskSettingsSet `
    -StartWhenAvailable `
    -RestartCount 3 `
    -RestartInterval (New-TimeSpan -Minutes 1) `
    -ExecutionTimeLimit ([TimeSpan]::Zero) `
    -MultipleInstances IgnoreNew `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries

$task = New-ScheduledTask -Action $action -Trigger $trigger -Principal $principal -Settings $settings `
    -Description 'Starts the local PlantVision Waitress server for Tailscale Funnel.'
Register-ScheduledTask -TaskName $TaskName -InputObject $task -Force | Out-Null
Write-Output "Scheduled task '$TaskName' installed for SYSTEM at Windows startup."
