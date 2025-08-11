import axios from 'axios';
import { AgentResource, ResourceContent } from './types';

export class UrlResourceLoader {
    private cache: Map<string, { content: string; timestamp: number }> = new Map();
    private defaultCacheDuration = 3600000; // 1 hour in milliseconds

    /**
     * Load multiple resources for an agent
     */
    async loadResources(resources: AgentResource[]): Promise<ResourceContent[]> {
        const loadedResources: ResourceContent[] = [];

        for (const resource of resources) {
            const content = await this.loadResource(resource);
            loadedResources.push(content);
        }

        return loadedResources;
    }

    /**
     * Load a single resource
     */
    async loadResource(resource: AgentResource): Promise<ResourceContent> {
        const cacheKey = this.getCacheKey(resource);
        const cacheDuration = resource.cacheDuration || this.defaultCacheDuration;

        // Check cache
        const cached = this.cache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp) < cacheDuration) {
            console.log(`Using cached resource: ${resource.url}`);
            return {
                url: resource.url,
                content: cached.content,
                loadedAt: new Date(cached.timestamp)
            };
        }

        try {
            console.log(`Loading resource: ${resource.url}`);
            
            const response = await axios.get(resource.url, {
                timeout: 15000,
                headers: {
                    'User-Agent': 'VSCode-Cloud-Team-Copilot-Agent',
                    'Accept': this.getAcceptHeader(resource.type),
                    ...resource.headers
                },
                responseType: 'text'
            });

            const content = this.processContent(response.data, resource.type);

            // Update cache
            this.cache.set(cacheKey, {
                content,
                timestamp: Date.now()
            });

            return {
                url: resource.url,
                content,
                loadedAt: new Date()
            };

        } catch (error: any) {
            console.error(`Failed to load resource ${resource.url}:`, error.message);
            
            // Return cached version if available, even if expired
            const cached = this.cache.get(cacheKey);
            if (cached) {
                console.log(`Using expired cache for failed resource: ${resource.url}`);
                return {
                    url: resource.url,
                    content: cached.content,
                    loadedAt: new Date(cached.timestamp),
                    error: error.message
                };
            }

            return {
                url: resource.url,
                content: '',
                loadedAt: new Date(),
                error: error.message
            };
        }
    }

    /**
     * Process content based on type
     */
    private processContent(data: any, type: string): string {
        if (typeof data === 'string') {
            return data;
        }

        if (type === 'api' || type === 'url') {
            try {
                // If it's JSON, stringify it with formatting
                return JSON.stringify(data, null, 2);
            } catch {
                return String(data);
            }
        }

        return String(data);
    }

    /**
     * Get appropriate Accept header based on resource type
     */
    private getAcceptHeader(type: string): string {
        switch (type) {
            case 'api':
                return 'application/json, application/xml, text/plain';
            case 'file':
                return 'text/plain, text/html, text/markdown';
            case 'url':
            default:
                return '*/*';
        }
    }

    /**
     * Generate cache key for a resource
     */
    private getCacheKey(resource: AgentResource): string {
        const headers = resource.headers ? JSON.stringify(resource.headers) : '';
        return `${resource.url}::${headers}`;
    }

    /**
     * Clear cache
     */
    clearCache(): void {
        this.cache.clear();
        console.log('Resource cache cleared');
    }

    /**
     * Clear expired cache entries
     */
    clearExpiredCache(): void {
        const now = Date.now();
        let clearedCount = 0;

        for (const [key, value] of this.cache.entries()) {
            if (now - value.timestamp > this.defaultCacheDuration) {
                this.cache.delete(key);
                clearedCount++;
            }
        }

        if (clearedCount > 0) {
            console.log(`Cleared ${clearedCount} expired cache entries`);
        }
    }

    /**
     * Preload resources for all agents
     */
    async preloadResources(agentResources: Map<string, AgentResource[]>): Promise<void> {
        console.log(`Preloading resources for ${agentResources.size} agents`);
        
        const allResources: AgentResource[] = [];
        for (const resources of agentResources.values()) {
            allResources.push(...resources);
        }

        // Deduplicate resources by URL
        const uniqueResources = new Map<string, AgentResource>();
        for (const resource of allResources) {
            if (!uniqueResources.has(resource.url)) {
                uniqueResources.set(resource.url, resource);
            }
        }

        // Load unique resources in parallel (with concurrency limit)
        const batchSize = 5;
        const resourceArray = Array.from(uniqueResources.values());
        
        for (let i = 0; i < resourceArray.length; i += batchSize) {
            const batch = resourceArray.slice(i, i + batchSize);
            await Promise.all(batch.map(resource => this.loadResource(resource)));
        }

        console.log(`Preloaded ${uniqueResources.size} unique resources`);
    }
}
