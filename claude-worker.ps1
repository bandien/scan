# Claude Worker Script (Strict ID Version)
# Updated by Antigravity

Write-Host "--- Claude AI Worker Started (Strict ID Mode) ---" -ForegroundColor Cyan

while ($true) {
    # CHỈ nhận các file có tiền tố WAIT_CLAUDE_
    $tasks = Get-ChildItem "brain/tasks_queue/WAIT_CLAUDE_*.txt"
    
    if ($tasks.Count -gt 0) {
        foreach ($task in $tasks) {
            $taskBaseName = $task.BaseName.Replace("WAIT_CLAUDE_", "")
            $workingName = "WORK_CLAUDE_$taskBaseName.working"
            $workingPath = Join-Path $task.Directory.FullName $workingName
            
            Rename-Item -Path $task.FullName -NewName $workingName -ErrorAction SilentlyContinue
            
            if (Test-Path $workingPath) {
                Write-Host "[EXEC] Claude is processing: $taskBaseName" -ForegroundColor Yellow
                $prompt = Get-Content $workingPath -Raw
                claude -p "$prompt"
                
                $finalName = if ($LASTEXITCODE -eq 0) { "DONE_CLAUDE_$taskBaseName.txt" } else { "FAIL_CLAUDE_$taskBaseName.txt" }
                $finalPath = Join-Path "brain/tasks_done" $finalName
                
                if (Test-Path $finalPath) { Remove-Item $finalPath }
                Move-Item $workingPath $finalPath
                
                git add .
                git commit -m "worker(claude): finished $finalName"
                git push origin master
                [console]::beep(1000, 300)
            }
        }
    }
    Start-Sleep -Seconds 5
}
