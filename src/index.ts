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

const engineNames: Record<EngineId, string> = {
	kv: 'KV',
	d1: 'D1',
	r2: 'R2',
	cfcache: 'Cloudflare Cache',
	pp: 'Prisma Postgres',
	ppwithcache: 'Prisma Postgres (with cache)',
	error: 'Error',
};

import uiHtml from './ui.html';

export default {
	async fetch(request, env): Promise<Response> {
		try {
			const url = new URL(request.url);
			if (url.pathname === '/') {
				return new Response(uiHtml, { headers: { 'Content-Type': 'text/html' } });
			}
			if (url.pathname === '/measure') {
				return measure(url.searchParams, env);
			}
			return new Response('Not found', { status: 404 });
		} catch (e: any) {
			return new Response(String(e?.stack ?? e), { status: 500 });
		}
	},
} satisfies ExportedHandler<Env>;

async function measure(params: URLSearchParams, env: Env): Promise<Response> {
	const engineId = params.get('engine') as EngineId;

	if (!engineIds.includes(engineId)) {
		return new Response('engine must be one of ' + engineIds.join(', '), { status: 400 });
	}

	const engine = engines[engineId](env);
	const prewarm = params.has('prewarm');
	const parallel = params.has('parallel');
	const html = params.has('html');
	const count = parseFloat(params.get('count') ?? '1');

	if (isNaN(count) || count < 1 || count > 1000) {
		return new Response('count must be a number between 1 and 1000', { status: 400 });
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

	if (html) {
		const result = `Executed ${count} ${parallel ? 'parallel' : 'sequential'} request${count === 1 ? '' : 's'} to ${
			engineNames[engineId]
		} in ${duration}ms`;
		return new Response(
			`
			<html><body>
			Executed ${count}
			${parallel ? 'parallel' : 'sequential'}
			request${count === 1 ? '' : 's'} to
			${engineNames[engineId]}
			in ${duration}ms
			${count > 1 && !parallel ? `(that's ${Math.round(duration / count)}ms per request)` : ''}
			</body></html>`,
			{ headers: { 'Content-Type': 'text/html' } }
		);
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
}
