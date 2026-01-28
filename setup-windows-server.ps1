# Windows Server 2019 Deployment Setup Script
# Please run this script as Administrator

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Game Gallery Windows Server Setup" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# 1. Install IIS
Write-Host "[1/5] Installing IIS..." -ForegroundColor Yellow
$iisInstalled = Get-WindowsFeature -Name Web-Server | Select-Object -ExpandProperty Installed
if (-not $iisInstalled) {
    Install-WindowsFeature -name Web-Server -IncludeManagementTools
    Write-Host "OK IIS installed successfully" -ForegroundColor Green
} else {
    Write-Host "OK IIS already installed" -ForegroundColor Green
}

# 2. Configure Firewall
Write-Host "[2/4] Configuring firewall rules..." -ForegroundColor Yellow

# HTTP Port 80
$httpRule = Get-NetFirewallRule -DisplayName "HTTP (Port 80)" -ErrorAction SilentlyContinue
if (-not $httpRule) {
    New-NetFirewallRule -DisplayName "HTTP (Port 80)" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow
    Write-Host "OK Firewall rule added (Port 80)" -ForegroundColor Green
} else {
    Write-Host "OK Firewall rule already exists (Port 80)" -ForegroundColor Green
}

# 3. Create website directory
Write-Host "[3/4] Creating website directory..." -ForegroundColor Yellow
$webPath = "C:\inetpub\wwwroot\game-gallery"
if (-not (Test-Path $webPath)) {
    New-Item -ItemType Directory -Path $webPath -Force | Out-Null
    Write-Host "OK Website directory created: $webPath" -ForegroundColor Green
} else {
    Write-Host "OK Website directory already exists: $webPath" -ForegroundColor Green
}

# Set directory permissions (allow IIS access)
$acl = Get-Acl $webPath
$rule = New-Object System.Security.AccessControl.FileSystemAccessRule("IIS_IUSRS", "FullControl", "ContainerInherit,ObjectInherit", "None", "Allow")
$acl.SetAccessRule($rule)
Set-Acl $webPath $acl
Write-Host "OK Directory permissions configured" -ForegroundColor Green

# 4. Create IIS website
Write-Host "[4/4] Configuring IIS website..." -ForegroundColor Yellow
Import-Module WebAdministration

$siteName = "game-gallery"
$existingSite = Get-Website -Name $siteName -ErrorAction SilentlyContinue

if ($existingSite) {
    Write-Host "! Website '$siteName' already exists, updating configuration..." -ForegroundColor Yellow
    Set-ItemProperty "IIS:\Sites\$siteName" -Name physicalPath -Value $webPath
    Set-ItemProperty "IIS:\Sites\$siteName" -Name serverAutoStart -Value $true
} else {
    # Stop default website to avoid port conflict
    Stop-Website -Name "Default Web Site" -ErrorAction SilentlyContinue

    # Create new website
    New-Website -Name $siteName -Port 80 -PhysicalPath $webPath -Force | Out-Null
    Write-Host "OK IIS website created: $siteName" -ForegroundColor Green
}

Start-Website -Name $siteName
Write-Host "OK Website started" -ForegroundColor Green

# Display configuration information
Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Website Name: $siteName" -ForegroundColor White
Write-Host "Website Path: $webPath" -ForegroundColor White
Write-Host "Access Port: 80" -ForegroundColor White
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Clone the repository on this server:" -ForegroundColor White
Write-Host "   git clone https://github.com/yangzirui-lab/game-gallery.git C:\Users\Administrator\code\game-gallery" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Install Node.js if not already installed:" -ForegroundColor White
Write-Host "   Download from: https://nodejs.org/" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Run the deployment script whenever you want to update:" -ForegroundColor White
Write-Host "   cd C:\Users\Administrator\code\game-gallery" -ForegroundColor Cyan
Write-Host "   .\deploy-manual.ps1" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. Visit website: http://$(Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.InterfaceAlias -notmatch 'Loopback'} | Select-Object -First 1 -ExpandProperty IPAddress)" -ForegroundColor Yellow
Write-Host ""
