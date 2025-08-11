# Quick Setup Script for Cloud Team Copilot Agents
# Run this in PowerShell after installing the VSIX

Write-Host "Cloud Team Copilot Agents - Quick Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get the current directory path
$currentPath = Get-Location
$fileUrl = "file:///$($currentPath.Path.Replace('\', '/'))"

Write-Host "Current repository path: $currentPath" -ForegroundColor Yellow
Write-Host "File URL: $fileUrl" -ForegroundColor Yellow
Write-Host ""

# Create settings for VSCode
$settings = @{
    "cloudTeamCopilotAgents.repositoryUrl" = $fileUrl
    "cloudTeamCopilotAgents.branch" = "master"
    "cloudTeamCopilotAgents.updateInterval" = 300000
}

# Get VSCode settings path
$vscodePath = "$env:APPDATA\Code\User\settings.json"

Write-Host "Configuring VSCode settings..." -ForegroundColor Green

# Check if settings file exists
if (Test-Path $vscodePath) {
    # Read existing settings
    $existingSettings = Get-Content $vscodePath -Raw | ConvertFrom-Json
    
    # Add our settings
    $settings.GetEnumerator() | ForEach-Object {
        $existingSettings | Add-Member -MemberType NoteProperty -Name $_.Key -Value $_.Value -Force
    }
    
    # Write back
    $existingSettings | ConvertTo-Json -Depth 10 | Set-Content $vscodePath
    Write-Host "✓ Settings updated successfully!" -ForegroundColor Green
} else {
    # Create new settings file
    $settings | ConvertTo-Json -Depth 10 | Set-Content $vscodePath
    Write-Host "✓ Settings file created!" -ForegroundColor Green
}

Write-Host ""
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Restart VSCode" -ForegroundColor White
Write-Host "2. Open GitHub Copilot Chat" -ForegroundColor White
Write-Host "3. Type @ to see available agents:" -ForegroundColor White
Write-Host "   - @cloudteam.agile" -ForegroundColor Gray
Write-Host "   - @cloudteam.aws-evaluation" -ForegroundColor Gray
Write-Host "   - @cloudteam.documentation" -ForegroundColor Gray
Write-Host "   - @cloudteam.okr" -ForegroundColor Gray
Write-Host ""
Write-Host "To verify agents are loaded:" -ForegroundColor Yellow
Write-Host "  Press Ctrl+Shift+P and run 'Cloud Team Agents: Show Agent Status'" -ForegroundColor White
Write-Host ""
Write-Host "For production use:" -ForegroundColor Yellow
Write-Host "  1. Push this repository to GitHub/GitLab" -ForegroundColor White
Write-Host "  2. Update the repository URL in VSCode settings" -ForegroundColor White
Write-Host "  3. Share with your team" -ForegroundColor White
