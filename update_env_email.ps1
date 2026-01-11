# PowerShell script to help update .env file with Gmail settings
# Run this after you get your App Password from Google

Write-Host "`n=== Gmail Email Configuration ===" -ForegroundColor Cyan

$emailAddress = Read-Host "Enter your Gmail address"
$appPassword = Read-Host "Enter your 16-character App Password (from Google)"
$appPassword = $appPassword -replace '\s+', ''  # Remove spaces

if ($appPassword.Length -ne 16) {
    Write-Host "`n[WARNING] App Password should be 16 characters (without spaces)" -ForegroundColor Yellow
    Write-Host "Current length: $($appPassword.Length)" -ForegroundColor Yellow
    $continue = Read-Host "Continue anyway? (y/n)"
    if ($continue -ne 'y') {
        Write-Host "Cancelled." -ForegroundColor Red
        exit
    }
}

Write-Host "`nUpdating .env file..." -ForegroundColor Yellow

# Read current .env if it exists
$envContent = @()
if (Test-Path .env) {
    $envContent = Get-Content .env
    Write-Host "Found existing .env file" -ForegroundColor Green
} else {
    Write-Host "Creating new .env file" -ForegroundColor Yellow
}

# Remove old email settings
$envContent = $envContent | Where-Object {
    $_ -notmatch '^EMAIL_BACKEND=' -and
    $_ -notmatch '^EMAIL_HOST=' -and
    $_ -notmatch '^EMAIL_PORT=' -and
    $_ -notmatch '^EMAIL_USE_TLS=' -and
    $_ -notmatch '^EMAIL_HOST_USER=' -and
    $_ -notmatch '^EMAIL_HOST_PASSWORD=' -and
    $_ -notmatch '^DEFAULT_FROM_EMAIL='
}

# Add new email settings
$envContent += ""
$envContent += "# Email Configuration (Gmail)"
$envContent += "EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend"
$envContent += "EMAIL_HOST=smtp.gmail.com"
$envContent += "EMAIL_PORT=587"
$envContent += "EMAIL_USE_TLS=True"
$envContent += "EMAIL_HOST_USER=$emailAddress"
$envContent += "EMAIL_HOST_PASSWORD=$appPassword"
$envContent += "DEFAULT_FROM_EMAIL=$emailAddress"

# Write to file
$envContent | Set-Content .env

Write-Host "`n[OK] .env file updated successfully!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Restart your Django server (Ctrl+C then: python manage.py runserver)" -ForegroundColor White
Write-Host "2. Test by requesting an OTP" -ForegroundColor White
Write-Host "3. Check the inbox of $emailAddress" -ForegroundColor White

