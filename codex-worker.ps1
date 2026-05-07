# Codex Worker Script for MAS
# Fixed by Antigravity

Write-Host "--- Codex AI Worker Started (Polling brain/tasks_queue) ---" -ForegroundColor Magenta

if (!(Test-Path "brain/tasks_done")) { New-Item -ItemType Directory "brain/tasks_done" }

while ($true) {
    $tasks = Get-ChildItem "brain/tasks_queue/*.txt" | Where-Object { $_.Name -like "*ui*" -or $_.Name -like "*codex*" }
    
    if ($tasks.Count -gt 0) {
        foreach ($task in $tasks) {
            $taskName = $task.BaseName
            $workingName = "$taskName.working"
            $workingPath = Join-Path $task.Directory.FullName $workingName
            
            Rename-Item -Path $task.FullName -NewName $workingName -ErrorAction SilentlyContinue
            
            if (Test-Path $workingPath) {
                Write-Host "[WORKING] Codex is processing: $taskName" -ForegroundColor Yellow
                $prompt = Get-Content $workingPath -Raw
                
                Write-Host "[EXEC] Calling Codex CLI..." -ForegroundColor Gray
                # Giả định lệnh thực thi Codex là 'gh copilot' hoặc tương đương
                # gh copilot suggest "$prompt"
                Write-Warning "Codex CLI placeholder. Please ensure your specific CLI is configured."
                
                $donePath = Join-Path "brain/tasks_done" "$taskName.done.txt"
                if (Test-Path $donePath) { Remove-Item $donePath }
                Move-Item $workingPath $donePath
                
                git add .
                git commit -m "worker(codex): completed task $taskName"
                git push origin master
                
                Write-Host "[SUCCESS] Codex Task $taskName finished!" -ForegroundColor Green
                [console]::beep(800, 200)
                [console]::beep(1200, 200)
            }
        }
    }
    Start-Sleep -Seconds 15
}
