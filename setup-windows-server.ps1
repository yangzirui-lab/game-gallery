# Windows Server 2019 部署环境配置脚本
# 请以管理员身份运行此脚本

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Game Gallery Windows Server 部署配置" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# 1. 安装 IIS
Write-Host "[1/5] 正在安装 IIS..." -ForegroundColor Yellow
$iisInstalled = Get-WindowsFeature -Name Web-Server | Select-Object -ExpandProperty Installed
if (-not $iisInstalled) {
    Install-WindowsFeature -name Web-Server -IncludeManagementTools
    Write-Host "✓ IIS 安装完成" -ForegroundColor Green
} else {
    Write-Host "✓ IIS 已安装" -ForegroundColor Green
}

# 2. 安装 OpenSSH Server
Write-Host "[2/5] 正在配置 OpenSSH Server..." -ForegroundColor Yellow
$sshCapability = Get-WindowsCapability -Online | Where-Object Name -like 'OpenSSH.Server*'
if ($sshCapability.State -ne "Installed") {
    Add-WindowsCapability -Online -Name OpenSSH.Server~~~~0.0.1.0
    Write-Host "✓ OpenSSH Server 安装完成" -ForegroundColor Green
} else {
    Write-Host "✓ OpenSSH Server 已安装" -ForegroundColor Green
}

# 启动并设置为自动启动
Start-Service sshd -ErrorAction SilentlyContinue
Set-Service -Name sshd -StartupType 'Automatic'
Write-Host "✓ OpenSSH Server 已启动并设置为自动启动" -ForegroundColor Green

# 3. 配置防火墙
Write-Host "[3/5] 正在配置防火墙规则..." -ForegroundColor Yellow
$firewallRule = Get-NetFirewallRule -Name "sshd" -ErrorAction SilentlyContinue
if (-not $firewallRule) {
    New-NetFirewallRule -Name sshd -DisplayName 'OpenSSH Server (sshd)' -Enabled True -Direction Inbound -Protocol TCP -Action Allow -LocalPort 22
    Write-Host "✓ 防火墙规则已添加 (端口 22)" -ForegroundColor Green
} else {
    Write-Host "✓ 防火墙规则已存在" -ForegroundColor Green
}

# HTTP 端口 80
$httpRule = Get-NetFirewallRule -DisplayName "HTTP (Port 80)" -ErrorAction SilentlyContinue
if (-not $httpRule) {
    New-NetFirewallRule -DisplayName "HTTP (Port 80)" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow
    Write-Host "✓ 防火墙规则已添加 (端口 80)" -ForegroundColor Green
} else {
    Write-Host "✓ 防火墙规则已存在 (端口 80)" -ForegroundColor Green
}

# 4. 创建网站目录
Write-Host "[4/5] 正在创建网站目录..." -ForegroundColor Yellow
$webPath = "C:\inetpub\wwwroot\game-gallery"
if (-not (Test-Path $webPath)) {
    New-Item -ItemType Directory -Path $webPath -Force | Out-Null
    Write-Host "✓ 网站目录已创建: $webPath" -ForegroundColor Green
} else {
    Write-Host "✓ 网站目录已存在: $webPath" -ForegroundColor Green
}

# 设置目录权限（允许 IIS 访问）
$acl = Get-Acl $webPath
$rule = New-Object System.Security.AccessControl.FileSystemAccessRule("IIS_IUSRS", "FullControl", "ContainerInherit,ObjectInherit", "None", "Allow")
$acl.SetAccessRule($rule)
Set-Acl $webPath $acl
Write-Host "✓ 目录权限已配置" -ForegroundColor Green

# 5. 创建 IIS 网站
Write-Host "[5/5] 正在配置 IIS 网站..." -ForegroundColor Yellow
Import-Module WebAdministration

$siteName = "game-gallery"
$existingSite = Get-Website -Name $siteName -ErrorAction SilentlyContinue

if ($existingSite) {
    Write-Host "! 网站 '$siteName' 已存在，正在更新配置..." -ForegroundColor Yellow
    Set-ItemProperty "IIS:\Sites\$siteName" -Name physicalPath -Value $webPath
    Set-ItemProperty "IIS:\Sites\$siteName" -Name serverAutoStart -Value $true
} else {
    # 停止默认网站以避免端口冲突
    Stop-Website -Name "Default Web Site" -ErrorAction SilentlyContinue

    # 创建新网站
    New-Website -Name $siteName -Port 80 -PhysicalPath $webPath -Force | Out-Null
    Write-Host "✓ IIS 网站已创建: $siteName" -ForegroundColor Green
}

Start-Website -Name $siteName
Write-Host "✓ 网站已启动" -ForegroundColor Green

# 显示配置信息
Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "配置完成！" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "网站名称: $siteName" -ForegroundColor White
Write-Host "网站路径: $webPath" -ForegroundColor White
Write-Host "访问端口: 80" -ForegroundColor White
Write-Host "SSH 端口: 22" -ForegroundColor White
Write-Host ""
Write-Host "下一步操作：" -ForegroundColor Yellow
Write-Host "1. 在 GitHub 仓库中配置以下 Secrets："
Write-Host "   - WINDOWS_SERVER_HOST: $(Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.InterfaceAlias -notmatch 'Loopback'} | Select-Object -First 1 -ExpandProperty IPAddress)" -ForegroundColor Cyan
Write-Host "   - WINDOWS_SERVER_USERNAME: $env:USERNAME" -ForegroundColor Cyan
Write-Host "   - WINDOWS_SERVER_PASSWORD: <你的密码>" -ForegroundColor Cyan
Write-Host "   - DEPLOY_PATH: $webPath" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. 推送代码到 main 分支，GitHub Actions 将自动部署" -ForegroundColor Yellow
Write-Host ""
Write-Host "3. 访问网站: http://$(Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.InterfaceAlias -notmatch 'Loopback'} | Select-Object -First 1 -ExpandProperty IPAddress)" -ForegroundColor Yellow
Write-Host ""
