import { Engine } from '../types';

export class CacheEngine implements Engine {
	async put(id: string, content: string): Promise<void> {
		await getCache().put(keyToUrl(id), new Response(content));
	}

	async get(id: string): Promise<string | null> {
		const result = await getCache().match(keyToUrl(id));
		console.log('result', result);
		const content = await result?.text();
		return typeof content === 'string' ? content : null;
	}
}

const getCache = () => (globalThis as any).caches.default;

const keyToUrl = (id: string) => `http://internal/cache/${encodeURIComponent(id)}`;
