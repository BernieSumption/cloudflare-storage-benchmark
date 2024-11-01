import { Engine } from '../types';

export class KvEngine implements Engine {
	constructor(private kv: KVNamespace) {}

	async put(id: string, content: string) {
		await this.kv.put(id, content);
	}

	async get(id: string) {
		return await this.kv.get(id);
	}
}
