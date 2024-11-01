export const engineIds = ['kv', 'd1', 'r2', 'cfcache', 'pp', 'ppwithcache', 'error'] as const;

export type EngineId = (typeof engineIds)[number];

export interface Engine {
	put(id: string, content: string): Promise<void>;
	get(id: string): Promise<string | null>;
}
