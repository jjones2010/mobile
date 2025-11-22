# Auto-submit to TestFlight when build completes
Write-Host "🔍 Monitoring build status..." -ForegroundColor Cyan
Write-Host "Will automatically submit to TestFlight when ready" -ForegroundColor Cyan
Write-Host ""

$maxAttempts = 60  # Check for up to 60 minutes
$checkInterval = 30  # Check every 30 seconds

for ($i = 0; $i -lt $maxAttempts; $i++) {
    try {
        # Check latest build status
        $buildInfo = eas build:list --platform ios --limit 1 --json | ConvertFrom-Json
        
        if ($buildInfo -and $buildInfo.Count -gt 0) {
            $latestBuild = $buildInfo[0]
            $status = $latestBuild.status
            $buildId = $latestBuild.id
            
            Write-Host "[$([DateTime]::Now.ToString('HH:mm:ss'))] Build Status: $status" -ForegroundColor Yellow
            
            if ($status -eq "FINISHED") {
                Write-Host ""
                Write-Host "✅ Build completed successfully!" -ForegroundColor Green
                Write-Host "📱 Submitting to TestFlight..." -ForegroundColor Cyan
                Write-Host ""
                
                # Submit to TestFlight
                $env:EAS_NO_VCS=1
                eas submit --platform ios --latest
                
                Write-Host ""
                Write-Host "🎉 Submitted to TestFlight!" -ForegroundColor Green
                Write-Host "⏳ Apple will process in 5-30 minutes" -ForegroundColor Yellow
                Write-Host "📧 You'll receive an email when ready" -ForegroundColor Yellow
                Write-Host ""
                exit 0
                
            } elseif ($status -eq "ERRORED" -or $status -eq "CANCELED") {
                Write-Host ""
                Write-Host "❌ Build failed with status: $status" -ForegroundColor Red
                Write-Host "Check build details: https://expo.dev" -ForegroundColor Yellow
                Write-Host ""
                exit 1
            } else {
                # Still building
                $elapsed = $i * $checkInterval
                Write-Host "   ⏳ Still building... (${elapsed}s elapsed)" -ForegroundColor Gray
            }
        }
        
    } catch {
        Write-Host "   ⚠️  Error checking status: $($_.Exception.Message)" -ForegroundColor Yellow
    }
    
    # Wait before next check
    Start-Sleep -Seconds $checkInterval
}

Write-Host ""
Write-Host "⏰ Timeout reached after $($maxAttempts * $checkInterval / 60) minutes" -ForegroundColor Yellow
Write-Host "Build may still be in progress. Check manually:" -ForegroundColor Yellow
Write-Host "   eas build:list --platform ios --limit 1" -ForegroundColor White
Write-Host ""
