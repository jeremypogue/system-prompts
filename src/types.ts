/**
 * Agent resource type
 */
export interface AgentResource {
    type: 'url' | 'file' | 'api';
    url: string;
    name?: string;
    description?: string;
    headers?: Record<string, string>;
    cacheDuration?: number; // in milliseconds
}

/**
 * Agent definition
 */
export interface Agent {
    id: string;
    name: string;
    description?: string;
    prompt: string;
    resources?: AgentResource[];
    examples?: string[];
    templates?: string[];
    version?: string;
    tags?: string[];
    enabled?: boolean;
}

/**
 * Agent configuration from repository
 */
export interface AgentConfig {
    version: string;
    agents: Agent[];
    globalResources?: AgentResource[];
    metadata?: {
        lastUpdated?: string;
        author?: string;
        team?: string;
    };
}

/**
 * Resource content after loading
 */
export interface ResourceContent {
    url: string;
    content: string;
    loadedAt: Date;
    error?: string;
}

/**
 * Chat context with loaded resources
 */
export interface ChatContext {
    agent: Agent;
    resources: ResourceContent[];
    userMessage: string;
    history?: string[];
}

/**
 * Repository sync status
 */
export interface SyncStatus {
    lastSync?: Date;
    lastError?: string;
    syncInProgress: boolean;
    agentCount: number;
}
