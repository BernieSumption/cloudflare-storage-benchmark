import { Engine } from '../types';

export class ErrorEngine implements Engine {
	constructor() {}

	async put(id: string, content: string): Promise<void> {
		throw new Error('ErrorEngine always throws');
	}

	async get(id: string): Promise<string | null> {
		throw new Error('ErrorEngine always throws');
	}
}
