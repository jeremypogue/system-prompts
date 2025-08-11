import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import { Agent, AgentConfig } from './types';

export class RepositorySync {
    private context: vscode.ExtensionContext;
    private localRepoPath: string;
    private isInitialized: boolean = false;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.localRepoPath = path.join(context.globalStorageUri.fsPath, 'agent-repo');
    }

    /**
     * Initialize repository sync
     */
    async initialize(): Promise<void> {
        // Ensure storage directory exists
        if (!fs.existsSync(this.context.globalStorageUri.fsPath)) {
            fs.mkdirSync(this.context.globalStorageUri.fsPath, { recursive: true });
        }

        if (!fs.existsSync(this.localRepoPath)) {
            fs.mkdirSync(this.localRepoPath, { recursive: true });
        }

        this.isInitialized = true;
        console.log('Repository sync initialized');
    }

    /**
     * Fetch agents from repository
     */
    async fetchAgents(): Promise<Agent[]> {
        const config = vscode.workspace.getConfiguration('cloudTeamCopilotAgents');
        const repoUrl = config.get<string>('repositoryUrl');
        const branch = config.get<string>('branch') || 'master';

        if (!repoUrl) {
            console.log('No repository URL configured');
            return [];
        }

        try {
            // Fetch the agents configuration file from the repository
            const configUrl = this.buildRawUrl(repoUrl, branch, 'agents.json');
            console.log(`Fetching agents from: ${configUrl}`);

            const response = await axios.get<AgentConfig>(configUrl, {
                timeout: 10000,
                headers: {
                    'Accept': 'application/json',
                    'Cache-Control': 'no-cache'
                }
            });

            if (!response.data || !response.data.agents) {
                throw new Error('Invalid agent configuration format');
            }

            const agentConfig = response.data;
            console.log(`Fetched ${agentConfig.agents.length} agents (version: ${agentConfig.version})`);

            // Process and validate agents
            const validAgents = agentConfig.agents.filter(agent => 
                this.validateAgent(agent)
            );

            // Fetch additional agent files if they reference external prompts
            const processedAgents = await this.processAgentFiles(validAgents, repoUrl, branch);

            // Store last sync time
            await this.context.globalState.update('lastSync', new Date().toISOString());

            return processedAgents;

        } catch (error: any) {
            console.error('Failed to fetch agents:', error.message);
            
            // Try to load cached agents if network fails
            const cachedAgents = this.context.globalState.get<Agent[]>('agents', []);
            if (cachedAgents.length > 0) {
                console.log('Using cached agents due to sync failure');
                return cachedAgents;
            }

            throw error;
        }
    }

    /**
     * Process agent files that reference external prompts
     */
    private async processAgentFiles(agents: Agent[], repoUrl: string, branch: string): Promise<Agent[]> {
        const processedAgents: Agent[] = [];

        for (const agent of agents) {
            try {
                // Check if prompt is a file reference
                if (agent.prompt && agent.prompt.startsWith('file:')) {
                    const fileName = agent.prompt.substring(5);
                    const fileUrl = this.buildRawUrl(repoUrl, branch, `agents/${fileName}`);
                    
                    const response = await axios.get<string>(fileUrl, {
                        timeout: 5000,
                        headers: {
                            'Accept': 'text/plain',
                            'Cache-Control': 'no-cache'
                        }
                    });

                    agent.prompt = response.data;
                }

                // Process template files if they exist
                if (agent.templates && Array.isArray(agent.templates)) {
                    const processedTemplates: string[] = [];
                    
                    for (const template of agent.templates) {
                        if (template.startsWith('file:')) {
                            const fileName = template.substring(5);
                            const fileUrl = this.buildRawUrl(repoUrl, branch, `templates/${fileName}`);
                            
                            try {
                                const response = await axios.get<string>(fileUrl, {
                                    timeout: 5000,
                                    headers: {
                                        'Accept': 'text/plain',
                                        'Cache-Control': 'no-cache'
                                    }
                                });
                                processedTemplates.push(response.data);
                            } catch (error) {
                                console.warn(`Failed to fetch template ${fileName}:`, error);
                                processedTemplates.push(template);
                            }
                        } else {
                            processedTemplates.push(template);
                        }
                    }
                    
                    agent.templates = processedTemplates;
                }

                processedAgents.push(agent);
            } catch (error: any) {
                console.error(`Failed to process agent ${agent.id}:`, error.message);
                // Still include the agent but with the original prompt
                processedAgents.push(agent);
            }
        }

        return processedAgents;
    }

    /**
     * Build raw URL for GitHub or GitLab repositories
     */
    private buildRawUrl(repoUrl: string, branch: string, filePath: string): string {
        // Remove trailing .git if present
        const cleanUrl = repoUrl.replace(/\.git$/, '');

        // GitHub
        if (cleanUrl.includes('github.com')) {
            const match = cleanUrl.match(/github\.com[/:]([\w-]+)\/([\w-]+)/);
            if (match) {
                const [, owner, repo] = match;
                return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`;
            }
        }

        // GitLab
        if (cleanUrl.includes('gitlab.com')) {
            const match = cleanUrl.match(/gitlab\.com[/:]([\w-]+)\/([\w-]+)/);
            if (match) {
                const [, owner, repo] = match;
                return `https://gitlab.com/${owner}/${repo}/-/raw/${branch}/${filePath}`;
            }
        }

        // Azure DevOps
        if (cleanUrl.includes('dev.azure.com')) {
            const match = cleanUrl.match(/dev\.azure\.com\/([^/]+)\/([^/]+)\/_git\/([^/]+)/);
            if (match) {
                const [, org, project, repo] = match;
                return `https://dev.azure.com/${org}/${project}/_apis/git/repositories/${repo}/items?path=/${filePath}&version=GB${branch}&api-version=7.0`;
            }
        }

        // Bitbucket
        if (cleanUrl.includes('bitbucket.org')) {
            const match = cleanUrl.match(/bitbucket\.org[/:]([\w-]+)\/([\w-]+)/);
            if (match) {
                const [, owner, repo] = match;
                return `https://bitbucket.org/${owner}/${repo}/raw/${branch}/${filePath}`;
            }
        }

        // Default: assume the URL supports direct file access
        return `${cleanUrl}/raw/${branch}/${filePath}`;
    }

    /**
     * Validate agent structure
     */
    private validateAgent(agent: any): boolean {
        if (!agent.id || !agent.name || !agent.prompt) {
            return false;
        }

        if (typeof agent.id !== 'string' || 
            typeof agent.name !== 'string' || 
            typeof agent.prompt !== 'string') {
            return false;
        }

        return true;
    }

    /**
     * Get sync status
     */
    async getSyncStatus(): Promise<{
        lastSync: string | undefined;
        repoUrl: string | undefined;
        branch: string;
        isConfigured: boolean;
    }> {
        const config = vscode.workspace.getConfiguration('cloudTeamCopilotAgents');
        const repoUrl = config.get<string>('repositoryUrl');
        const branch = config.get<string>('branch') || 'master';
        const lastSync = this.context.globalState.get<string>('lastSync');

        return {
            lastSync,
            repoUrl,
            branch,
            isConfigured: !!repoUrl
        };
    }
}
