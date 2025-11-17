# Run this script as Administrator
# Right-click PowerShell → Run as Administrator

$projectPath = "C:\Users\troyg\Documents\OmniNode-Weaponized"

Write-Host "Adding Windows Defender exclusions for OmniNode-Weaponized..." -ForegroundColor Cyan

try {
    # Add project directory exclusion
    Add-MpPreference -ExclusionPath $projectPath -ErrorAction Stop
    Write-Host "✓ Added path exclusion: $projectPath" -ForegroundColor Green
    
    # Add Node.js process exclusion if exists
    $nodePath = (Get-Command node -ErrorAction SilentlyContinue).Path
    if ($nodePath) {
        Add-MpPreference -ExclusionProcess $nodePath -ErrorAction Stop
        Write-Host "✓ Added process exclusion: $nodePath" -ForegroundColor Green
    }
    
    # Add common processes
    $processes = @("node.exe", "npm.exe", "npx.exe", "warp.exe", "pwsh.exe")
    foreach ($proc in $processes) {
        try {
            Add-MpPreference -ExclusionProcess $proc -ErrorAction Stop
            Write-Host "✓ Added process exclusion: $proc" -ForegroundColor Green
        } catch {
            Write-Host "⚠ Could not add: $proc" -ForegroundColor Yellow
        }
    }
    
    Write-Host "`n✓ Defender exclusions added successfully!" -ForegroundColor Green
    Write-Host "Verify with: Get-MpPreference | Select ExclusionPath, ExclusionProcess" -ForegroundColor Cyan
    
} catch {
    Write-Host "✗ Failed to add exclusions. Run PowerShell as Administrator." -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
}
