[CmdletBinding()]
param(
    [string]$TaskName = 'PlantVision Backend'
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$runtimeDir = Join-Path $repoRoot '.runtime'
New-Item -ItemType Directory -Path $runtimeDir -Force | Out-Null
$errorFile = Join-Path $runtimeDir 'scheduled-task-diagnostics.error.txt'
trap {
    $_ | Out-String | Set-Content -LiteralPath $errorFile -Encoding UTF8
    exit 1
}
$identity = [Security.Principal.WindowsIdentity]::GetCurrent()
$principalCheck = New-Object Security.Principal.WindowsPrincipal($identity)
if (-not $principalCheck.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    throw 'Run this script from PowerShell as Administrator.'
}

$outputFile = Join-Path $runtimeDir 'scheduled-task-diagnostics.txt'
$task = Get-ScheduledTask -TaskName $TaskName -ErrorAction Stop
$info = Get-ScheduledTaskInfo -TaskName $TaskName
$action = $task.Actions | Select-Object -First 1
$trigger = $task.Triggers | Select-Object -First 1
@(
    "TaskName=$($task.TaskName)",
    "State=$($task.State)",
    "UserId=$($task.Principal.UserId)",
    "LogonType=$($task.Principal.LogonType)",
    "Execute=$($action.Execute)",
    "Arguments=$($action.Arguments)",
    "WorkingDirectory=$($action.WorkingDirectory)",
    "TriggerDelay=$($trigger.Delay)",
    "LastRunTime=$($info.LastRunTime)",
    "LastTaskResult=$($info.LastTaskResult)",
    "NextRunTime=$($info.NextRunTime)"
) | Set-Content -LiteralPath $outputFile -Encoding UTF8
Write-Output "Diagnostics written to $outputFile"
