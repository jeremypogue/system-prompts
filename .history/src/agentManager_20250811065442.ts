import * as vscode from 'vscode';
import { Agent, AgentResource } from './types';

export class AgentManager {
    private agents: Map<string, Agent> = new Map();
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    /**
     * Load agents from global state
     */
    async loadAgents(): Promise<void> {
        const savedAgents = this.context.globalState.get<Agent[]>('agents', []);
        this.agents.clear();
        
        for (const agent of savedAgents) {
            this.agents.set(agent.id, agent);
        }
        
        console.log(`Loaded ${this.agents.size} agents from global state`);
    }

    /**
     * Save agents to global state
     */
    async saveAgents(): Promise<void> {
        const agentsArray = Array.from(this.agents.values());
        await this.context.globalState.update('agents', agentsArray);
        console.log(`Saved ${agentsArray.length} agents to global state`);
    }

    /**
     * Update agents from repository
     */
    async updateAgents(newAgents: Agent[]): Promise<void> {
        this.agents.clear();
        
        for (const agent of newAgents) {
            // Validate agent structure
            if (this.validateAgent(agent)) {
                this.agents.set(agent.id, agent);
            } else {
                console.warn(`Invalid agent structure for: ${agent.id}`);
            }
        }
        
        await this.saveAgents();
        console.log(`Updated to ${this.agents.size} agents`);
    }

    /**
     * Get all agents
     */
    getAgents(): Agent[] {
        return Array.from(this.agents.values());
    }

    /**
     * Get a specific agent by ID
     */
    getAgent(id: string): Agent | undefined {
        return this.agents.get(id);
    }

    /**
     * Get agent by name
     */
    getAgentByName(name: string): Agent | undefined {
        return Array.from(this.agents.values()).find(agent => 
            agent.name.toLowerCase() === name.toLowerCase()
        );
    }

    /**
     * Validate agent structure
     */
    private validateAgent(agent: Agent): boolean {
        if (!agent.id || !agent.name || !agent.prompt) {
            return false;
        }

        if (typeof agent.id !== 'string' || 
            typeof agent.name !== 'string' || 
            typeof agent.prompt !== 'string') {
            return false;
        }

        // Validate resources if present
        if (agent.resources) {
            if (!Array.isArray(agent.resources)) {
                return false;
            }
            
            for (const resource of agent.resources) {
                if (!this.validateResource(resource)) {
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * Validate resource structure
     */
    private validateResource(resource: AgentResource): boolean {
        if (!resource.type || !resource.url) {
            return false;
        }

        if (typeof resource.type !== 'string' || typeof resource.url !== 'string') {
            return false;
        }

        if (!['url', 'file', 'api'].includes(resource.type)) {
            return false;
        }

        return true;
    }

    /**
     * Add or update a single agent
     */
    async addOrUpdateAgent(agent: Agent): Promise<boolean> {
        if (!this.validateAgent(agent)) {
            return false;
        }

        this.agents.set(agent.id, agent);
        await this.saveAgents();
        return true;
    }

    /**
     * Remove an agent
     */
    async removeAgent(id: string): Promise<boolean> {
        const deleted = this.agents.delete(id);
        if (deleted) {
            await this.saveAgents();
        }
        return deleted;
    }

    /**
     * Clear all agents
     */
    async clearAgents(): Promise<void> {
        this.agents.clear();
        await this.saveAgents();
    }
}
