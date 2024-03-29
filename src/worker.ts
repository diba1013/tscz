import type { BundleEntry, BundleOutput } from "@/bundler/bundler.types";
import { EsbuildBundler } from "@/bundler/esbuild.bundler";
import { RollupBundler } from "@/bundler/rollup.bundler";
import path from "node:path";
import pc from "picocolors";

export type BundleConfiguration = {
	parent?: string;
	entry: BundleEntry;
};

export async function bundle({ parent = process.cwd(), entry }: BundleConfiguration): Promise<BundleOutput[]> {
	const start = Date.now();
	try {
		const bundler = entry.format === "dts" ? new RollupBundler() : new EsbuildBundler();
		const bundle = await bundler.bundle(entry);
		try {
			return await bundle.build();
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
