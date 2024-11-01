import { Engine } from './types';

type RunArgs = {
	engine: Engine;
	prewarm: boolean;
	parallel: boolean;
	count: number;
};

export const run = async ({}: RunArgs) => {};
