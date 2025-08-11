import * as vscode from 'vscode';
import { AgentManager } from './agentManager';
import { UrlResourceLoader } from './urlResourceLoader';
import { Agent, ResourceContent } from './types';

export class CopilotIntegration {
    private agentManager: AgentManager;
    private urlResourceLoader: UrlResourceLoader;
    private participants: Map<string, vscode.ChatParticipant> = new Map();
    private disposables: vscode.Disposable[] = [];

    constructor(agentManager: AgentManager, urlResourceLoader: UrlResourceLoader) {
        this.agentManager = agentManager;
        this.urlResourceLoader = urlResourceLoader;
    }

    /**
     * Register all chat participants
     */
    async registerParticipants(context: vscode.ExtensionContext): Promise<void> {
        // Clear existing participants
        this.clearParticipants();

        const agents = this.agentManager.getAgents();
        
        for (const agent of agents) {
            if (agent.enabled !== false) {
                await this.registerParticipant(agent, context);
            }
        }

        console.log(`Registered ${this.participants.size} chat participants`);
    }

    /**
     * Register a single chat participant
     */
    private async registerParticipant(agent: Agent, context: vscode.ExtensionContext): Promise<void> {
        try {
            // Create a unique ID for the participant
            const participantId = `cloudteam.${agent.id}`;
            
            // Register the chat participant
            const participant = vscode.chat.createChatParticipant(
                participantId,
                this.createChatHandler(agent)
            );

            // Set metadata
            participant.iconPath = this.getAgentIcon(agent);
            // Note: description property may not exist in all VSCode versions
            (participant as any).description = agent.description || `${agent.name} assistant`;
            
            // Store the participant
            this.participants.set(participantId, participant);
            this.disposables.push(participant);
            context.subscriptions.push(participant);

            console.log(`Registered chat participant: ${participantId}`);

        } catch (error: any) {
            console.error(`Failed to register participant for agent ${agent.id}:`, error.message);
        }
    }

    /**
     * Create chat handler for an agent
     */
    private createChatHandler(agent: Agent): vscode.ChatRequestHandler {
        return async (
            request: vscode.ChatRequest,
            context: vscode.ChatContext,
            stream: vscode.ChatResponseStream,
            token: vscode.CancellationToken
        ): Promise<vscode.ChatResult> => {
            try {
                // Start progress
                stream.progress('Loading agent resources...');

                // Load resources if defined
                let resourceContents: ResourceContent[] = [];
                if (agent.resources && agent.resources.length > 0) {
                    resourceContents = await this.urlResourceLoader.loadResources(agent.resources);
                    stream.progress(`Loaded ${resourceContents.length} resources`);
                }

                // Build the complete prompt
                const completePrompt = this.buildCompletePrompt(agent, request, resourceContents);

                // Stream the agent's base instructions first (for visibility)
                stream.markdown(`### ${agent.name}\n\n`);
                
                if (agent.description) {
                    stream.markdown(`*${agent.description}*\n\n`);
                }

                // Add resource status if any were loaded
                if (resourceContents.length > 0) {
                    const successfulResources = resourceContents.filter(r => !r.error);
                    stream.markdown(`📚 *Loaded ${successfulResources.length}/${resourceContents.length} resources*\n\n`);
                }

                // Process the request with the complete prompt
                stream.markdown('---\n\n');
                
                // Include the agent's system prompt and resources in the context
                const systemContext = this.formatSystemContext(agent, resourceContents);
                
                // Add system context as a reference
                stream.reference(
                    vscode.Uri.parse(`vscode://cloudteam/${agent.id}`)
                );

                // Format and stream the response
                await this.streamResponse(
                    completePrompt,
                    systemContext,
                    request,
                    stream,
                    token
                );

                // Add examples or templates if available
                if (agent.examples && agent.examples.length > 0) {
                    stream.markdown('\n\n### Examples\n');
                    for (const example of agent.examples) {
                        stream.markdown(`- ${example}\n`);
                    }
                }

                if (agent.templates && agent.templates.length > 0) {
                    stream.markdown('\n\n### Templates\n');
                    stream.markdown('```\n');
                    for (const template of agent.templates) {
                        stream.markdown(`${template}\n\n`);
                    }
                    stream.markdown('```\n');
                }

                return {
                    metadata: {
                        command: agent.id,
                        agentVersion: agent.version || '1.0.0'
                    }
                };

            } catch (error: any) {
                stream.markdown(`❌ Error: ${error.message}`);
                return {
                    metadata: {
                        command: agent.id,
                        error: error.message
                    }
                };
            }
        };
    }

    /**
     * Build complete prompt with agent instructions and resources
     */
    private buildCompletePrompt(
        agent: Agent, 
        request: vscode.ChatRequest,
        resources: ResourceContent[]
    ): string {
        let prompt = agent.prompt;

        // Add resource content to the prompt
        if (resources.length > 0) {
            prompt += '\n\n## Context Resources\n\n';
            
            for (const resource of resources) {
                if (!resource.error && resource.content) {
                    prompt += `### Resource: ${resource.url}\n`;
                    prompt += `\`\`\`\n${resource.content}\n\`\`\`\n\n`;
                }
            }
        }

        // Add user's request
        prompt += `\n\n## User Request\n\n${request.prompt}`;

        // Add command parameters if any
        if (request.command) {
            prompt += `\n\nCommand: ${request.command}`;
        }

        return prompt;
    }

    /**
     * Format system context for the agent
     */
    private formatSystemContext(agent: Agent, resources: ResourceContent[]): string {
        let context = `Agent: ${agent.name}\n`;
        context += `Version: ${agent.version || '1.0.0'}\n`;
        
        if (agent.tags && agent.tags.length > 0) {
            context += `Tags: ${agent.tags.join(', ')}\n`;
        }

        if (resources.length > 0) {
            context += `\nLoaded Resources:\n`;
            for (const resource of resources) {
                const status = resource.error ? '❌' : '✅';
                context += `${status} ${resource.url}\n`;
            }
        }

        return context;
    }

    /**
     * Stream the response (placeholder for actual implementation)
     */
    private async streamResponse(
        prompt: string,
        systemContext: string,
        request: vscode.ChatRequest,
        stream: vscode.ChatResponseStream,
        token: vscode.CancellationToken
    ): Promise<void> {
        // This is where the actual integration with Copilot's language model would happen
        // For now, we'll provide a structured response based on the agent's configuration
        
        stream.markdown('*Processing with agent context...*\n\n');
        
        // The actual response would come from the Copilot language model
        // This is a placeholder that shows how the agent's prompt is being used
        stream.markdown(`Based on the ${this.agentManager.getAgents().find(a => prompt.includes(a.prompt))?.name || 'agent'} guidelines:\n\n`);
        
        // Simulate processing the request
        const lines = request.prompt.split('\n');
        for (const line of lines) {
            if (token.isCancellationRequested) {
                break;
            }
            
            // This would be replaced with actual AI-generated content
            stream.markdown(`Processing: "${line}"\n`);
        }
    }

    /**
     * Get icon for agent
     */
    private getAgentIcon(agent: Agent): vscode.ThemeIcon | undefined {
        // Map agent IDs or tags to appropriate icons
        if (agent.id === 'agile') {
            return new vscode.ThemeIcon('dashboard');
        }
        if (agent.id === 'aws-evaluation') {
            return new vscode.ThemeIcon('beaker');
        }
        if (agent.id === 'documentation') {
            return new vscode.ThemeIcon('book');
        }
        if (agent.id === 'okr') {
            return new vscode.ThemeIcon('target');
        }
        
        // Default icon
        return new vscode.ThemeIcon('robot');
    }

    /**
     * Update participants when agents change
     */
    async updateParticipants(): Promise<void> {
        // Get the context from the first participant (if any)
        const context = (vscode.extensions.getExtension('cloud-engineering-team.cloud-team-copilot-agents')?.exports as any)?.context;
        
        if (context) {
            await this.registerParticipants(context);
        } else {
            console.warn('Unable to update participants: no context available');
        }
    }

    /**
     * Clear all participants
     */
    private clearParticipants(): void {
        for (const disposable of this.disposables) {
            disposable.dispose();
        }
        this.disposables = [];
        this.participants.clear();
    }

    /**
     * Dispose of all resources
     */
    dispose(): void {
        this.clearParticipants();
    }
}
