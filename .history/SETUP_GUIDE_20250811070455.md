# Cloud Team Copilot Agents - Setup Guide

## Quick Start

### 1. Install the Extension

The extension has been packaged as `cloud-team-copilot-agents-1.0.0.vsix`

**To install:**
1. Open VSCode
2. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
3. Type "Install from VSIX" and select "Extensions: Install from VSIX..."
4. Navigate to and select `cloud-team-copilot-agents-1.0.0.vsix`
5. Restart VSCode

### 2. Configure the Repository

**Option A: Using Command Palette**
1. Press `Ctrl+Shift+P`
2. Run "Cloud Team Agents: Configure Repository"
3. Enter your repository URL (e.g., `https://github.com/your-org/copilot-agents.git`)

**Option B: Using Settings**
1. Open VSCode Settings (`Ctrl+,`)
2. Search for "Cloud Team Copilot Agents"
3. Set:
   - `cloudTeamCopilotAgents.repositoryUrl`: Your Git repository URL
   - `cloudTeamCopilotAgents.branch`: Branch name (default: master)
   - `cloudTeamCopilotAgents.updateInterval`: Update interval in ms (default: 300000 = 5 minutes)

### 3. Repository Setup

Your central repository needs an `agents.json` file in the root. This repository already includes a sample with 4 agents:
- **Agile Agent** - For writing epics and user stories
- **AWS Service Evaluation Agent** - For evaluating AWS services
- **Documentation Agent** - For consistent documentation
- **OKR Agent** - For performance reviews and OKRs

To use this repository as your central source:
1. Push this repository to your GitHub/GitLab/Azure DevOps
2. Configure all team members' extensions to point to this repository
3. Any changes to `agents.json` will automatically sync to all team members

### 4. Using the Agents

In GitHub Copilot Chat:
1. Type `@cloudteam` to see available agents
2. Select an agent (e.g., `@cloudteam.agile`)
3. Type your request

Example:
```
@cloudteam.agile Help me write a user story for implementing SSO authentication
```

## Adding New Agents

Edit `agents.json` in your central repository:

```json
{
  "id": "new-agent",
  "name": "New Agent Name",
  "description": "What this agent does",
  "prompt": "You are an expert in... Help the user by...",
  "resources": [
    {
      "type": "url",
      "url": "https://docs.example.com",
      "cacheDuration": 3600000
    }
  ],
  "examples": ["Example usage 1", "Example usage 2"],
  "templates": ["Template content"],
  "tags": ["category"],
  "enabled": true
}
```

After pushing to master, all team members will receive the update within 5 minutes.

## Troubleshooting

### Agents not appearing
- Check repository configuration: Run "Cloud Team Agents: Show Agent Status"
- Verify network access to repository
- Check VSCode Output panel for "Cloud Team Copilot Agents" logs

### Manual refresh
- Run "Cloud Team Agents: Refresh Agents" from command palette

### Verify installation
- Look for agents starting with `@cloudteam` in GitHub Copilot Chat
- Check extension is enabled in Extensions view

## Distribution to Team

1. Share the `cloud-team-copilot-agents-1.0.0.vsix` file via:
   - Internal file share
   - Teams/Slack
   - Email
   - Internal package repository

2. Share this setup guide

3. Ensure all team members configure the same repository URL

## Next Steps

1. **Customize agents**: Modify `agents.json` with your team-specific prompts
2. **Add resources**: Include URLs to internal documentation, APIs, or wikis
3. **Create templates**: Add templates for common tasks
4. **Test with team**: Have team members test each agent
5. **Iterate**: Refine prompts based on team feedback

## Security Notes

- Only include trusted URLs in agent resources
- Don't include secrets or sensitive data in prompts
- Use private repositories for internal-only agents
- Consider access controls on your central repository

## Support

For issues or improvements:
1. Check logs in VSCode Output panel
2. Run "Cloud Team Agents: Show Agent Status"
3. Update/modify agents in central repository as needed
