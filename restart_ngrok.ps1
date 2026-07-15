# ==========================================
# restart_ngrok.ps1 — Khoi phuc duong truyen ngrok
# Xu ly truong hop ngrok.exe cu bi treo ngam (Zombie Process)
# Chay bang: powershell -ExecutionPolicy Bypass -File restart_ngrok.ps1
# ==========================================

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  KHOI PHUC NGROK TUNNEL (BanDienScan)" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# --- BUOC 1: Phat hien va tat cac tien trinh ngrok dang bi treo ---
Write-Host "[1/4] Kiem tra tien trinh ngrok.exe dang chay..." -ForegroundColor Yellow

$ngrokProcesses = Get-Process -Name "ngrok" -ErrorAction SilentlyContinue
if ($ngrokProcesses) {
    Write-Host "      Phat hien $($ngrokProcesses.Count) tien trinh ngrok.exe (PID: $($ngrokProcesses.Id -join ', '))" -ForegroundColor Red
    Write-Host "      Dang tat..." -ForegroundColor Yellow
    taskkill /F /IM ngrok.exe 2>&1 | Out-Null
    Start-Sleep -Seconds 2
    Write-Host "      OK - Da tat tat ca tien trinh ngrok cu." -ForegroundColor Green
} else {
    Write-Host "      OK - Khong co tien trinh ngrok nao bi treo." -ForegroundColor Green
}

# --- BUOC 2: Tat PM2 daemon cu de tranh xung dot ---
Write-Host ""
Write-Host "[2/4] Dang khoi dong lai PM2 daemon..." -ForegroundColor Yellow
pm2 kill 2>&1 | Out-Null
Start-Sleep -Seconds 2
Write-Host "      OK - PM2 daemon da dung." -ForegroundColor Green

# --- BUOC 3: Khoi phuc cac tien trinh PM2 tu file dump ---
Write-Host ""
Write-Host "[3/4] Dang khoi phuc cac tien trinh PM2 (pm2 resurrect)..." -ForegroundColor Yellow
pm2 resurrect 2>&1 | Out-Null
Start-Sleep -Seconds 3

# Kiem tra trang thai bang pm2 list (tranh loi ConvertFrom-Json)
$pm2ListOutput = pm2 list 2>&1 | Out-String
if ($pm2ListOutput -match "erpnext-tunnel" -and $pm2ListOutput -match "online") {
    Write-Host "      OK - PM2 tien trinh 'erpnext-tunnel' dang Online." -ForegroundColor Green
} else {
    Write-Host "      [!] Tien trinh chua Online. Thu khoi dong thu cong..." -ForegroundColor Red
    $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
    pm2 start "$scriptDir\start_ngrok.js" --name "erpnext-tunnel" 2>&1 | Out-Null
    Start-Sleep -Seconds 3
    Write-Host "      OK - Da khoi dong thu cong." -ForegroundColor Green
}

# --- BUOC 4: Xac nhan duong truyen ngrok da Online ---
Write-Host ""
Write-Host "[4/4] Dang xac nhan ket noi ngrok (cho toi da 15 giay)..." -ForegroundColor Yellow

$maxRetries = 5
$retry = 0
$tunnelOnline = $false

while ($retry -lt $maxRetries -and -not $tunnelOnline) {
    Start-Sleep -Seconds 3
    try {
        $apiResponse = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -TimeoutSec 5 -ErrorAction Stop
        $tunnel = $apiResponse.tunnels | Where-Object { $_.name -eq "erpnext" }
        if ($tunnel -and $tunnel.public_url) {
            $tunnelOnline = $true
            Write-Host ""
            Write-Host "========================================" -ForegroundColor Cyan
            Write-Host "  THANH CONG!" -ForegroundColor Green
            Write-Host "  URL cong khai : $($tunnel.public_url)" -ForegroundColor White
            Write-Host "  Chuyen tiep   : localhost:8080 (ERPNext)" -ForegroundColor White
            Write-Host "========================================" -ForegroundColor Cyan
        }
    } catch {
        $retry++
        Write-Host "      Ket noi chua san sang, thu lan $retry/$maxRetries..." -ForegroundColor DarkYellow
    }
}

if (-not $tunnelOnline) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "  THAT BAI: Khong ket noi duoc sau 15 giay." -ForegroundColor Red
    Write-Host "  Goi y:" -ForegroundColor Yellow
    Write-Host "  1. Kiem tra authtoken trong ngrok.yml" -ForegroundColor Yellow
    Write-Host "  2. Kiem tra ket noi Internet" -ForegroundColor Yellow
    Write-Host "  3. Vao https://dashboard.ngrok.com kiem tra Endpoint" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Red
    exit 1
}

pm2 save 2>&1 | Out-Null
Write-Host "  Trang thai PM2 da duoc luu lai." -ForegroundColor DarkGray
Write-Host ""
