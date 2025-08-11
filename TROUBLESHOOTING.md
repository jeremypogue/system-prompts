# Troubleshooting - Agents Not Appearing

## Quick Fix Steps

### 1. Verify Extension is Installed and Active
1. Open VSCode
2. Go to Extensions view (`Ctrl+Shift+X`)
3. Search for "Cloud Team Copilot Agents"
4. Ensure it shows as installed and enabled
5. If not enabled, click "Enable"

### 2. Configure the Repository URL (REQUIRED)
The extension needs to know where to fetch agents from. You have two options:

**Option A: Use the current local repository**
1. Press `Ctrl+Shift+P`
2. Run "Cloud Team Agents: Configure Repository"
3. Enter the full path to this folder as a file URL:
   - Windows: `file:///C:/Users/jeremypogue/Documents/repo/system-prompts`
   - Or use a GitHub URL if you've pushed this repo

**Option B: Configure via Settings**
1. Open VSCode Settings (`Ctrl+,`)
2. Search for "Cloud Team Copilot Agents"
3. Set `cloudTeamCopilotAgents.repositoryUrl` to your repository URL

### 3. Verify Agents are Loaded
1. Press `Ctrl+Shift+P`
2. Run "Cloud Team Agents: Show Agent Status"
3. You should see the 4 agents listed

### 4. Manual Refresh
1. Press `Ctrl+Shift+P`
2. Run "Cloud Team Agents: Refresh Agents"

### 5. Check the Extension Output
1. Go to View > Output
2. Select "Cloud Team Copilot Agents" from the dropdown
3. Look for any error messages

### 6. Restart VSCode
After configuration, restart VSCode to ensure the extension activates properly

## How to Access the Agents

Once configured, the agents appear in GitHub Copilot Chat:
1. Open GitHub Copilot Chat panel
2. Type `@` to see available agents
3. Look for agents starting with `@cloudteam`
   - `@cloudteam.agile`
   - `@cloudteam.aws-evaluation`
   - `@cloudteam.documentation`
   - `@cloudteam.okr`

## Common Issues

### "No repository URL configured"
- The extension requires a repository URL to fetch agents
- Use the configuration steps above

### Agents not syncing
- Check network connectivity
- Verify the repository URL is accessible
- Check if `agents.json` exists in the repository root

### Extension not activating
- Check Extensions view for any errors
- Try disabling and re-enabling the extension
- Reinstall the VSIX file if needed

## For Local Testing
If you want to test with the local repository:
1. Configure the repository URL as: `file:///C:/Users/jeremypogue/Documents/repo/system-prompts`
2. Run "Cloud Team Agents: Refresh Agents"
3. The agents from the local `agents.json` will be loaded

## Next Steps After Fixing
1. Push this repository to GitHub/GitLab
2. Update the repository URL to point to the remote repository
3. Share the repository URL with your team
4. All team members configure the same URL
