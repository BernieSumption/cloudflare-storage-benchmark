import { Engine } from '../types';

export class R2Engine implements Engine {
	constructor(private r2: R2Bucket) {}

	async put(id: string, content: string): Promise<void> {
		await this.r2.put(id, content);
	}

	async get(id: string): Promise<string | null> {
		const result = await this.r2.get(id);
		const body = await result?.text();
		return typeof body === 'string' ? body : null;
	}
}
