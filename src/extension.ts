import * as vscode from 'vscode';
import { AgentManager } from './agentManager';
import { RepositorySync } from './repositorySync';
import { CopilotIntegration } from './copilotIntegration';
import { UrlResourceLoader } from './urlResourceLoader';

let agentManager: AgentManager;
let repositorySync: RepositorySync;
let copilotIntegration: CopilotIntegration;
let urlResourceLoader: UrlResourceLoader;
let updateInterval: NodeJS.Timeout | undefined;

export async function activate(context: vscode.ExtensionContext) {
    console.log('Cloud Team Copilot Agents extension is now active!');

    // Initialize components
    agentManager = new AgentManager(context);
    repositorySync = new RepositorySync(context);
    urlResourceLoader = new UrlResourceLoader();
    copilotIntegration = new CopilotIntegration(agentManager, urlResourceLoader);

    // Load saved agents from global state
    await agentManager.loadAgents();

    // Initialize repository sync
    await repositorySync.initialize();

    // Set up automatic updates
    setupAutomaticUpdates(context);

    // Register commands
    registerCommands(context);

    // Register Copilot chat participants
    await copilotIntegration.registerParticipants(context);

    // Initial sync
    await syncAgents();

    vscode.window.showInformationMessage('Cloud Team Copilot Agents initialized successfully');
}

function registerCommands(context: vscode.ExtensionContext) {
    // Refresh agents command
    const refreshCommand = vscode.commands.registerCommand(
        'cloudTeamCopilotAgents.refreshAgents',
        async () => {
            await syncAgents();
            vscode.window.showInformationMessage('Agents refreshed successfully');
        }
    );

    // Configure repository command
    const configureCommand = vscode.commands.registerCommand(
        'cloudTeamCopilotAgents.configureRepository',
        async () => {
            const config = vscode.workspace.getConfiguration('cloudTeamCopilotAgents');
            const currentUrl = config.get<string>('repositoryUrl') || '';
            
            const newUrl = await vscode.window.showInputBox({
                prompt: 'Enter the Git repository URL for agent definitions',
                value: currentUrl,
                placeHolder: 'https://github.com/your-org/copilot-agents.git'
            });

            if (newUrl) {
                await config.update('repositoryUrl', newUrl, vscode.ConfigurationTarget.Global);
                await repositorySync.initialize();
                await syncAgents();
                vscode.window.showInformationMessage('Repository configured successfully');
            }
        }
    );

    // Show agent status command
    const statusCommand = vscode.commands.registerCommand(
        'cloudTeamCopilotAgents.showAgentStatus',
        async () => {
            const agents = agentManager.getAgents();
            const agentList = agents.map(a => `• ${a.name} (${a.id})`).join('\n');
            const message = agents.length > 0 
                ? `Active Agents:\n${agentList}`
                : 'No agents loaded. Please configure the repository.';
            
            vscode.window.showInformationMessage(message, { modal: true });
        }
    );

    context.subscriptions.push(refreshCommand, configureCommand, statusCommand);
}

function setupAutomaticUpdates(context: vscode.ExtensionContext) {
    const config = vscode.workspace.getConfiguration('cloudTeamCopilotAgents');
    const interval = config.get<number>('updateInterval') || 300000; // Default 5 minutes

    // Clear existing interval if any
    if (updateInterval) {
        clearInterval(updateInterval);
    }

    // Set up new interval
    updateInterval = setInterval(async () => {
        console.log('Running automatic agent sync...');
        await syncAgents();
    }, interval);

    // Clean up on deactivation
    context.subscriptions.push({
        dispose: () => {
            if (updateInterval) {
                clearInterval(updateInterval);
            }
        }
    });
}

async function syncAgents() {
    try {
        // Fetch latest agents from repository
        const agents = await repositorySync.fetchAgents();
        
        if (agents.length > 0) {
            // Update agent manager
            await agentManager.updateAgents(agents);
            
            // Re-register Copilot participants
            await copilotIntegration.updateParticipants();
            
            console.log(`Successfully synced ${agents.length} agents`);
        }
    } catch (error) {
        console.error('Failed to sync agents:', error);
        vscode.window.showErrorMessage(`Failed to sync agents: ${error}`);
    }
}

export function deactivate() {
    if (updateInterval) {
        clearInterval(updateInterval);
    }
}
