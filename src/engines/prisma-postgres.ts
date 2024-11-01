import { PrismaClient } from '@prisma/client/edge';
import { withAccelerate } from '@prisma/extension-accelerate';
import { Engine } from '../types';

export class PrismaPostgresEngine implements Engine {
	#prisma: Client;
	#cache: boolean;

	constructor(env: Env, config: { cache: boolean }) {
		this.#prisma = makeClient(env.PG_DATABASE_URL);
		this.#cache = config.cache;
	}

	async put(id: string, content: string): Promise<void> {
		this.#prisma.pgCacheRecord.create({
			data: {
				id,
				content,
			},
		});
	}

	async get(id: string): Promise<string | null> {
		const result = await this.#prisma.pgCacheRecord.findUnique({
			where: { id },
			cacheStrategy: this.#cache ? { swr: 60, ttl: 60 } : undefined,
		});
		return result?.content ?? null;
	}
}

const makeClient = (datasourceUrl: string) => new PrismaClient({ datasourceUrl }).$extends(withAccelerate());

type Client = ReturnType<typeof makeClient>;
