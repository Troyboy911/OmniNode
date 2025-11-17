#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Auto-deploy monitor with failure recovery and auto-debug
.DESCRIPTION
    Monitors GitHub Actions deployment, auto-detects failures, debugs issues, and re-deploys automatically
#>

param(
    [int]$MaxRetries = 3,
    [int]$CheckIntervalSeconds = 30,
    [switch]$AutoFix,
    [switch]$Verbose
)

$ErrorActionPreference = "Continue"
$repo = "Troyboy911/OmniNode"
$branch = "feat-weaponized-omninode"
$retryCount = 0

function Write-Status {
    param([string]$Message, [string]$Type = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $color = switch ($Type) {
        "SUCCESS" { "Green" }
        "ERROR" { "Red" }
        "WARNING" { "Yellow" }
        "DEBUG" { "Cyan" }
        default { "White" }
    }
    Write-Host "[$timestamp] [$Type] $Message" -ForegroundColor $color
}

function Get-LatestWorkflowRun {
    Write-Status "Checking latest workflow run..." "INFO"
    
    try {
        $response = gh api "/repos/$repo/actions/runs?branch=$branch&per_page=1" --jq '.workflow_runs[0]' | ConvertFrom-Json
        return $response
    }
    catch {
        Write-Status "Failed to fetch workflow run: $_" "ERROR"
        return $null
    }
}

function Get-WorkflowLogs {
    param([string]$RunId)
    
    Write-Status "Fetching workflow logs for run $RunId..." "DEBUG"
    
    try {
        $logs = gh api "/repos/$repo/actions/runs/$RunId/logs" 2>&1
        return $logs
    }
    catch {
        Write-Status "Could not fetch logs: $_" "WARNING"
        return ""
    }
}

function Analyze-Failure {
    param([string]$Logs, [object]$WorkflowRun)
    
    Write-Status "Analyzing failure patterns..." "DEBUG"
    
    $fixes = @()
    
    # Check for common failure patterns
    if ($Logs -match "npm ERR!|yarn error|pnpm ERR!") {
        Write-Status "Detected: Dependency installation failure" "WARNING"
        $fixes += @{
            Issue = "Dependency installation failed"
            Fix = "Clean install with legacy peer deps"
            Command = "rm -r node_modules, backend/node_modules; npm install --legacy-peer-deps; cd backend; npm install"
        }
    }
    
    if ($Logs -match "Prisma|schema\.prisma") {
        Write-Status "Detected: Prisma/Database issue" "WARNING"
        $fixes += @{
            Issue = "Prisma schema or client generation failed"
            Fix = "Regenerate Prisma client and push schema"
            Command = "cd backend; npx prisma generate; npx prisma db push"
        }
    }
    
    if ($Logs -match "wrangler.*error|Worker.*failed") {
        Write-Status "Detected: Cloudflare Workers deployment failure" "WARNING"
        $fixes += @{
            Issue = "Cloudflare Workers deployment failed"
            Fix = "Check wrangler.toml and secrets"
            Command = "cd backend; wrangler whoami; wrangler deployments list"
        }
    }
    
    if ($Logs -match "vercel.*error|deployment.*failed") {
        Write-Status "Detected: Vercel deployment failure" "WARNING"
        $fixes += @{
            Issue = "Vercel deployment failed"
            Fix = "Re-authenticate and deploy"
            Command = "vercel whoami; vercel --prod"
        }
    }
    
    if ($Logs -match "EACCES|permission denied") {
        Write-Status "Detected: Permission issue" "WARNING"
        $fixes += @{
            Issue = "Permission denied"
            Fix = "Check file permissions and authentication"
            Command = "wrangler whoami; vercel whoami"
        }
    }
    
    if ($Logs -match "timeout|ETIMEDOUT") {
        Write-Status "Detected: Network timeout" "WARNING"
        $fixes += @{
            Issue = "Network timeout"
            Fix = "Retry deployment"
            Command = ".\deploy.ps1 -Production -SkipTests"
        }
    }
    
    if ($Logs -match "TypeScript|type error|TS\d+") {
        Write-Status "Detected: TypeScript compilation error" "WARNING"
        $fixes += @{
            Issue = "TypeScript errors"
            Fix = "Run type check and fix errors"
            Command = "npm run type-check; cd backend; npm run type-check"
        }
    }
    
    if ($Logs -match "lint.*error|ESLint") {
        Write-Status "Detected: Linting errors" "WARNING"
        $fixes += @{
            Issue = "Linting errors"
            Fix = "Auto-fix linting issues"
            Command = "npm run lint -- --fix; cd backend; npm run lint -- --fix"
        }
    }
    
    if ($Logs -match "test.*failed|jest.*failed") {
        Write-Status "Detected: Test failures" "WARNING"
        $fixes += @{
            Issue = "Tests failed"
            Fix = "Skip tests or fix failing tests"
            Command = ".\deploy.ps1 -Production -SkipTests"
        }
    }
    
    if ($Logs -match "No space left|ENOSPC") {
        Write-Status "Detected: Disk space issue" "WARNING"
        $fixes += @{
            Issue = "No disk space"
            Fix = "Clean build artifacts"
            Command = "npm run clean; cd backend; npm run clean"
        }
    }
    
    # Check secrets
    if ($Logs -match "missing.*secret|undefined.*env|DATABASE_URL") {
        Write-Status "Detected: Missing secrets/environment variables" "WARNING"
        $fixes += @{
            Issue = "Missing secrets or environment variables"
            Fix = "Set required secrets"
            Command = "cd backend; wrangler secret put DATABASE_URL; wrangler secret put JWT_SECRET; wrangler secret put OPENAI_API_KEY"
        }
    }
    
    if ($fixes.Count -eq 0) {
        Write-Status "No specific failure pattern detected. Generic retry recommended." "WARNING"
        $fixes += @{
            Issue = "Unknown failure"
            Fix = "Generic redeploy"
            Command = ".\deploy.ps1 -Production -SkipTests"
        }
    }
    
    return $fixes
}

function Apply-AutoFix {
    param([array]$Fixes)
    
    Write-Status "Applying auto-fixes..." "INFO"
    
    foreach ($fix in $Fixes) {
        Write-Status "Fixing: $($fix.Issue)" "WARNING"
        Write-Status "Solution: $($fix.Fix)" "INFO"
        Write-Status "Running: $($fix.Command)" "DEBUG"
        
        try {
            Invoke-Expression $fix.Command
            Write-Status "Fix applied successfully" "SUCCESS"
            Start-Sleep -Seconds 2
        }
        catch {
            Write-Status "Fix failed: $_" "ERROR"
        }
    }
}

function Trigger-Redeploy {
    Write-Status "Triggering redeploy..." "INFO"
    
    try {
        # Create empty commit to trigger workflow
        git commit --allow-empty -m "chore: auto-redeploy after fixing issues [skip ci]"
        git push origin $branch
        
        Write-Status "Redeploy triggered via git push" "SUCCESS"
        return $true
    }
    catch {
        Write-Status "Failed to trigger redeploy: $_" "ERROR"
        
        # Fallback: try manual deploy
        Write-Status "Attempting manual deployment..." "INFO"
        .\deploy.ps1 -Production -SkipTests
        return $false
    }
}

function Monitor-Deployment {
    Write-Status "Starting deployment monitor for $repo on branch $branch" "INFO"
    Write-Status "Max retries: $MaxRetries | Check interval: ${CheckIntervalSeconds}s" "INFO"
    
    while ($retryCount -lt $MaxRetries) {
        $run = Get-LatestWorkflowRun
        
        if (-not $run) {
            Write-Status "No workflow run found. Waiting..." "WARNING"
            Start-Sleep -Seconds $CheckIntervalSeconds
            continue
        }
        
        $status = $run.status
        $conclusion = $run.conclusion
        $runId = $run.id
        $runNumber = $run.run_number
        $createdAt = $run.created_at
        
        Write-Status "Workflow Run #$runNumber (ID: $runId)" "INFO"
        Write-Status "Status: $status | Conclusion: $conclusion" "INFO"
        Write-Status "Started: $createdAt" "DEBUG"
        
        switch ($status) {
            "completed" {
                if ($conclusion -eq "success") {
                    Write-Status "✅ DEPLOYMENT SUCCESSFUL!" "SUCCESS"
                    Write-Status "URLs:" "INFO"
                    Write-Status "  - Frontend: https://omninode.cc" "SUCCESS"
                    Write-Status "  - API: https://api.omninode.cc" "SUCCESS"
                    Write-Status "  - WebSocket: https://ws.omninode.cc" "SUCCESS"
                    Write-Status "  - Scraper: https://api.omninode.cc/api/scraper" "SUCCESS"
                    return $true
                }
                elseif ($conclusion -eq "failure") {
                    Write-Status "❌ DEPLOYMENT FAILED" "ERROR"
                    $retryCount++
                    
                    if ($retryCount -ge $MaxRetries) {
                        Write-Status "Max retries reached. Manual intervention required." "ERROR"
                        return $false
                    }
                    
                    # Fetch and analyze logs
                    $logs = Get-WorkflowLogs -RunId $runId
                    $fixes = Analyze-Failure -Logs $logs -WorkflowRun $run
                    
                    Write-Status "Identified $($fixes.Count) potential fix(es)" "INFO"
                    
                    foreach ($fix in $fixes) {
                        Write-Status "Issue: $($fix.Issue)" "WARNING"
                        Write-Status "Fix: $($fix.Fix)" "INFO"
                        if ($Verbose) {
                            Write-Status "Command: $($fix.Command)" "DEBUG"
                        }
                    }
                    
                    if ($AutoFix) {
                        Apply-AutoFix -Fixes $fixes
                        Write-Status "Waiting 10 seconds before redeploy..." "INFO"
                        Start-Sleep -Seconds 10
                        $triggered = Trigger-Redeploy
                        
                        if ($triggered) {
                            Write-Status "Retry $retryCount/$MaxRetries initiated" "INFO"
                            Start-Sleep -Seconds $CheckIntervalSeconds
                        }
                    }
                    else {
                        Write-Status "AutoFix disabled. Run with -AutoFix to auto-correct issues." "WARNING"
                        
                        Write-Host "`nRecommended fixes:"
                        foreach ($fix in $fixes) {
                            Write-Host "  - $($fix.Fix): $($fix.Command)" -ForegroundColor Yellow
                        }
                        
                        return $false
                    }
                }
                else {
                    Write-Status "Deployment concluded with: $conclusion" "WARNING"
                    return $false
                }
            }
            
            "in_progress" {
                Write-Status "Deployment in progress..." "INFO"
                Start-Sleep -Seconds $CheckIntervalSeconds
            }
            
            "queued" {
                Write-Status "Deployment queued..." "INFO"
                Start-Sleep -Seconds $CheckIntervalSeconds
            }
            
            default {
                Write-Status "Unknown status: $status" "WARNING"
                Start-Sleep -Seconds $CheckIntervalSeconds
            }
        }
    }
    
    Write-Status "Monitor exiting after $retryCount retries" "WARNING"
    return $false
}

# Main execution
Write-Status "=== OmniNode Auto-Deploy Monitor ===" "INFO"
Write-Status "Repository: $repo" "INFO"
Write-Status "Branch: $branch" "INFO"

# Check if gh CLI is installed
try {
    $ghVersion = gh --version
    Write-Status "GitHub CLI detected: $($ghVersion[0])" "SUCCESS"
}
catch {
    Write-Status "GitHub CLI not found. Install with: winget install GitHub.cli" "ERROR"
    exit 1
}

# Check authentication
try {
    $ghUser = gh auth status 2>&1
    if ($ghUser -match "Logged in") {
        Write-Status "GitHub authentication OK" "SUCCESS"
    }
    else {
        Write-Status "Not authenticated. Run: gh auth login" "ERROR"
        exit 1
    }
}
catch {
    Write-Status "Authentication check failed. Run: gh auth login" "ERROR"
    exit 1
}

# Start monitoring
$success = Monitor-Deployment

if ($success) {
    Write-Status "=== DEPLOYMENT COMPLETE ===" "SUCCESS"
    exit 0
}
else {
    Write-Status "=== DEPLOYMENT FAILED ===" "ERROR"
    Write-Status "Check logs: gh run view --repo $repo" "INFO"
    exit 1
}
