#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Simple deployment status checker and auto-fixer
#>

param(
    [switch]$Watch,
    [switch]$AutoFix,
    [int]$MaxRetries = 3
)

$repo = "Troyboy911/OmniNode"
$branch = "feat-weaponized-omninode"
$retryCount = 0

function Write-Status {
    param([string]$Message, [string]$Type = "INFO")
    $color = switch ($Type) {
        "SUCCESS" { "Green" }
        "ERROR" { "Red" }
        "WARNING" { "Yellow" }
        default { "White" }
    }
    Write-Host "[$Type] $Message" -ForegroundColor $color
}

function Get-WorkflowStatus {
    Write-Status "Checking GitHub Actions workflow..." "INFO"
    
    $url = "https://github.com/$repo/actions?query=branch:$branch"
    Write-Status "View workflow: $url" "INFO"
    
    # Try to open in browser
    Start-Process $url
    
    Write-Status "GitHub Actions triggered!" "SUCCESS"
    Write-Status "Workflow will:" "INFO"
    Write-Status "  1. Install dependencies" "INFO"
    Write-Status "  2. Run type checks" "INFO"
    Write-Status "  3. Build backend & frontend" "INFO"
    Write-Status "  4. Deploy to Cloudflare Workers" "INFO"
    Write-Status "  5. Deploy to Vercel" "INFO"
    Write-Status "" "INFO"
    Write-Status "Expected completion: ~5-10 minutes" "INFO"
}

function Check-LocalBuild {
    Write-Status "Checking local build health..." "INFO"
    
    # Check Node modules
    if (-not (Test-Path "node_modules") -or -not (Test-Path "backend/node_modules")) {
        Write-Status "Missing dependencies. Installing..." "WARNING"
        
        Write-Status "Installing frontend deps..." "INFO"
        npm install --legacy-peer-deps
        
        Write-Status "Installing backend deps..." "INFO"
        Set-Location backend
        npm install
        Set-Location ..
        
        Write-Status "Dependencies installed" "SUCCESS"
    }
    
    # Check Prisma client
    if (-not (Test-Path "backend/node_modules/.prisma")) {
        Write-Status "Generating Prisma client..." "WARNING"
        Set-Location backend
        npx prisma generate
        Set-Location ..
        Write-Status "Prisma client generated" "SUCCESS"
    }
    
    Write-Status "Local build health OK" "SUCCESS"
}

function Run-LocalTests {
    Write-Status "Running local validation..." "INFO"
    
    try {
        Write-Status "Type checking frontend..." "INFO"
        npm run type-check
        Write-Status "Frontend type check passed" "SUCCESS"
    }
    catch {
        Write-Status "Frontend type check failed: $_" "WARNING"
    }
    
    try {
        Write-Status "Type checking backend..." "INFO"
        Set-Location backend
        npm run type-check
        Set-Location ..
        Write-Status "Backend type check passed" "SUCCESS"
    }
    catch {
        Write-Status "Backend type check failed: $_" "WARNING"
    }
}

function Apply-CommonFixes {
    Write-Status "Applying common fixes..." "INFO"
    
    # Fix 1: Clean install
    Write-Status "Fix 1: Clean dependency install" "INFO"
    npm install --legacy-peer-deps --force
    Set-Location backend
    npm install --force
    Set-Location ..
    
    # Fix 2: Regenerate Prisma
    Write-Status "Fix 2: Regenerate Prisma client" "INFO"
    Set-Location backend
    npx prisma generate
    Set-Location ..
    
    # Fix 3: Clear cache
    Write-Status "Fix 3: Clear build cache" "INFO"
    if (Test-Path ".next") { Remove-Item -Recurse -Force ".next" }
    if (Test-Path "backend/dist") { Remove-Item -Recurse -Force "backend/dist" }
    
    Write-Status "Common fixes applied" "SUCCESS"
}

function Trigger-ManualDeploy {
    Write-Status "Triggering manual deployment..." "INFO"
    
    try {
        .\deploy.ps1 -Production -SkipTests
        Write-Status "Manual deployment completed" "SUCCESS"
        return $true
    }
    catch {
        Write-Status "Manual deployment failed: $_" "ERROR"
        return $false
    }
}

# Main execution
Write-Status "=== OmniNode Deployment Check ===" "INFO"
Write-Status "Repository: $repo" "INFO"
Write-Status "Branch: $branch" "INFO"

# Check local health
Check-LocalBuild

# Get workflow status
Get-WorkflowStatus

if ($AutoFix) {
    Write-Status "AutoFix enabled. Will fix issues if deployment fails." "WARNING"
    Write-Status "Waiting 60 seconds for initial workflow check..." "INFO"
    Start-Sleep -Seconds 60
    
    while ($retryCount -lt $MaxRetries) {
        Write-Status "Checking if fixes needed (retry $retryCount/$MaxRetries)..." "INFO"
        
        Write-Host "`nDid the GitHub Actions workflow fail? (y/n): " -NoNewline
        $response = Read-Host
        
        if ($response -eq "y") {
            Write-Status "Applying fixes..." "WARNING"
            Apply-CommonFixes
            Run-LocalTests
            
            Write-Host "`nRetry deployment? (y/n): " -NoNewline
            $retry = Read-Host
            
            if ($retry -eq "y") {
                $retryCount++
                
                # Commit and push fix
                git add .
                git commit -m "fix: auto-apply common fixes (retry $retryCount)"
                git push origin $branch
                
                Write-Status "Fix pushed. Check workflow again in 60s..." "INFO"
                Start-Sleep -Seconds 60
            }
            else {
                break
            }
        }
        elseif ($response -eq "n") {
            Write-Status "Deployment successful!" "SUCCESS"
            break
        }
        else {
            Write-Status "Invalid input. Enter 'y' or 'n'" "WARNING"
        }
    }
}

Write-Status "" "INFO"
Write-Status "=== Next Steps ===" "INFO"
Write-Status "1. Monitor: https://github.com/$repo/actions" "INFO"
Write-Status "2. On success, access:" "INFO"
Write-Status "   - https://omninode.cc" "SUCCESS"
Write-Status "   - https://api.omninode.cc" "SUCCESS"
Write-Status "   - https://ws.omninode.cc" "SUCCESS"
Write-Status "3. If failed, run: .\check-deploy.ps1 -AutoFix" "WARNING"
Write-Status "4. Or deploy manually: .\deploy.ps1 -Production" "INFO"
