/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.toml`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { CacheEngine } from './engines/cache';
import { D1Engine } from './engines/d1';
import { ErrorEngine } from './engines/error';
import { KvEngine } from './engines/kv';
import { PrismaPostgresEngine } from './engines/prisma-postgres';
import { R2Engine } from './engines/r2';
import { Engine, EngineId, engineIds } from './types';

const engines: Record<EngineId, (env: Env) => Engine> = {
	kv: (env) => new KvEngine(env.KV),
	d1: (env) => new D1Engine(env.DB),
	r2: (env) => new R2Engine(env.R2),
	cfcache: () => new CacheEngine(),
	pp: (env) => new PrismaPostgresEngine(env, { cache: false }),
	ppwithcache: (env) => new PrismaPostgresEngine(env, { cache: true }),
	error: () => new ErrorEngine(),
};

export default {
	async fetch(request, env, ctx): Promise<Response> {
		try {
			const url = new URL(request.url);
			const engineId = url.searchParams.get('engine') as EngineId;

			if (!engineIds.includes(engineId)) {
				return new Response('engine must be one of ' + engineIds.join(', '), { status: 400 });
			}

			const engine = engines[engineId](env);
			const prewarm = url.searchParams.has('prewarm');
			const parallel = url.searchParams.has('parallel');
			const count = parseFloat(url.searchParams.get('count') ?? '1');

			if (isNaN(count)) {
				return new Response('count must be a number', { status: 400 });
			}

			let existing: any;
			const cacheKey = 'my-record';

			if (prewarm) {
				await engine.get(cacheKey);
			}

			const start = Date.now();

			if (parallel) {
				const results = await Promise.all(
					Array(count)
						.fill(null)
						.map(() => engine.get(cacheKey))
				);
				existing = results[0];
			} else {
				for (let i = 0; i < count; i++) {
					existing = await engine.get(cacheKey);
				}
			}

			const duration = Date.now() - start;

			if (existing == null) {
				await engine.put(cacheKey, `A pretty short string generated at ${new Date()}`);
				return new Response('needed to insert test data, run again for stats');
			} else {
				if (typeof existing !== 'string' || !existing.includes('generated at')) {
					return new Response('test data malformed', { status: 500 });
				}
			}

			return new Response(
				JSON.stringify({
					duration,
					prewarm,
					count,
					parallel,
				}),
				{ headers: { 'Content-Type': 'application/json' } }
			);
		} catch (e: any) {
			return new Response(String(e?.stack ?? e), { status: 500 });
		}
	},
} satisfies ExportedHandler<Env>;

// TODO:
// - port test runner from other project, with query params
// - error handler catches error and serves it as plain text
// - interface for test method with a populate and query method
// - DONE implement for KV
// - DONE implement for D1 (without prisma)
// - DONE implement for R2
// - implement for Cache API
// - implement for Prisma Postgres
// - implement for Prisma Postgres with Cache
// - ui option serves HTML with form to set each query param, post to iframe
