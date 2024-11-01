import { Engine } from '../types';

export class D1Engine implements Engine {
	constructor(private d1: D1Database) {}

	async put(id: string, content: string): Promise<void> {
		await this.d1.prepare('INSERT INTO CacheRecord (id, content) VALUES (?, ?)').bind(id, content).run();
	}

	async get(id: string): Promise<string | null> {
		const result = await this.d1.prepare('SELECT content FROM CacheRecord WHERE id = ?').bind(id).first();
		const content = result?.content;
		return typeof content === 'string' ? content : null;
	}
}
