import type { BundleEntry, BundleOptions } from "@/bundler/bundler.types";

import { EsbuildBundler } from "@/bundler/esbuild.bundler";
import { RollupBundler } from "@/bundler/rollup.bundler";
import path from "node:path";
import pc from "picocolors";

export type BundleConfiguration = {
	parent?: string;
	entry: BundleEntry;
	options?: BundleOptions;
};

export async function bundle({ parent = process.cwd(), entry, options = {} }: BundleConfiguration): Promise<void> {
	const start = Date.now();
	try {
		const bundler = entry.format === "dts" ? new RollupBundler() : new EsbuildBundler();
		const bundle = await bundler.bundle(entry, options);
		try {
			await bundle.build();
		} finally {
			await bundle.dispose();
		}
	} finally {
		const format = pc.cyan(`[${entry.format}]`);
		const file = pc.gray(path.relative(parent, entry.output));
		console.info(`${format} Done bundling ${file}: ${Date.now() - start}ms`);
	}
}

export default bundle;
