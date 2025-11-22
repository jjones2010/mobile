# Build Production iOS App for App Store
Write-Host "Building Production iOS App for App Store..." -ForegroundColor Cyan
Write-Host ""

# Set environment variable to bypass Git requirement
$env:EAS_NO_VCS = "1"

# Build for iOS only (production profile)
Write-Host "Starting iOS production build..." -ForegroundColor Yellow
Write-Host "This will take 10-20 minutes..." -ForegroundColor Gray
Write-Host ""

eas build --platform ios --profile production

Write-Host ""
Write-Host "Build process initiated!" -ForegroundColor Green
Write-Host "Monitor progress at: https://expo.dev" -ForegroundColor Cyan
