# Monitor training output
$logFile = "C:\Users\$env:USERNAME\.conda\envs\planvision-ml\training.log"

# Run training and capture output
$process = Start-Process -FilePath "C:\ProgramData\Anaconda3\Scripts\conda.exe" `
    -ArgumentList 'run -n planvision-ml python train.py --epochs 20 --batch_size 16' `
    -NoNewWindow -PassThru -RedirectStandardOutput "$PSScriptRoot\training_output.log" -RedirectStandardError "$PSScriptRoot\training_error.log"

Write-Host "🚀 Training started (PID: $($process.Id))"
Write-Host "📊 Monitoring output..."

# Monitor the output file
$lastLines = 0
while (-not $process.HasExited) {
    Start-Sleep -Milliseconds 500
    
    if (Test-Path "$PSScriptRoot\training_output.log") {
        $lines = @(Get-Content "$PSScriptRoot\training_output.log" -ErrorAction SilentlyContinue)
        if ($lines.Count -gt $lastLines) {
            # Show new lines
            $lines[$lastLines..($lines.Count-1)] | ForEach-Object { Write-Host $_ }
            $lastLines = $lines.Count
        }
    }
}

# Show final output
Write-Host "`n✅ Training completed!"
if (Test-Path "$PSScriptRoot\training_output.log") {
    $finalLines = @(Get-Content "$PSScriptRoot\training_output.log" -Tail 20)
    Write-Host "`n📋 Final Output:"
    $finalLines | ForEach-Object { Write-Host $_ }
}
