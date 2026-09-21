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

$task = Get-ScheduledTask -TaskName $TaskName -ErrorAction Stop
if ($task.State -ne 'Running') {
    Start-ScheduledTask -TaskName $TaskName
}

$healthUrl = "http://127.0.0.1:$Port/health"
$deadline = (Get-Date).AddSeconds(120)
do {
    try {
        $response = Invoke-WebRequest -Uri $healthUrl -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            $info = Get-ScheduledTaskInfo -TaskName $TaskName
            Write-Output "Scheduled task '$TaskName' is ready at $healthUrl."
            Write-Output "LastTaskResult=$($info.LastTaskResult)"
            exit 0
        }
    }
    catch {
        Start-Sleep -Seconds 2
    }
} while ((Get-Date) -lt $deadline)

$info = Get-ScheduledTaskInfo -TaskName $TaskName
throw "Scheduled task did not become ready. LastTaskResult=$($info.LastTaskResult)"
