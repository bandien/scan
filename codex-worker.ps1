# Codex Worker Script (Strict ID Version)
# Updated by Antigravity

Write-Host "--- Codex AI Worker Started (Strict ID Mode) ---" -ForegroundColor Magenta

while ($true) {
    # CHỈ nhận các file có tiền tố WAIT_CODEX_ hoặc có chữ REVIEW
    $tasks = Get-ChildItem "brain/tasks_queue/WAIT_*.txt" | Where-Object { $_.Name -like "*CODEX*" -or $_.Name -like "*REVIEW*" }
    
    if ($tasks.Count -gt 0) {
        foreach ($task in $tasks) {
            $taskBaseName = $task.BaseName.Replace("WAIT_", "")
            $workingName = "WORK_$taskBaseName.working"
            $workingPath = Join-Path $task.Directory.FullName $workingName
            
            Rename-Item -Path $task.FullName -NewName $workingName -ErrorAction SilentlyContinue
            
            if (Test-Path $workingPath) {
                Write-Host "[EXEC] Codex is processing Review: $taskBaseName" -ForegroundColor Yellow
                
                # Thực hiện lệnh Codex/Reviewer CLI của bạn ở đây
                
                $finalName = "DONE_$taskBaseName.txt"
                $finalPath = Join-Path "brain/tasks_done" $finalName
                
                if (Test-Path $finalPath) { Remove-Item $finalPath }
                Move-Item $workingPath $finalPath
                
                git add .
                git commit -m "worker(codex): finished $finalName"
                git push origin master
                [console]::beep(800, 200)
            }
        }
    }
    Start-Sleep -Seconds 10
}
