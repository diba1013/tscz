import pc from "picocolors";
import type { BundleConfig } from "@/bundler/bundler.types";
import { EsbuildBundler } from "@/bundler/esbuild.bundler";
import { RollupBundler } from "@/bundler/rollup.bundler";

export async function bundle({ entry, options = {} }: BundleConfig): Promise<void> {
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
		const file = pc.gray(entry.output);
		console.info(`${format} Done bundling ${file}: ${Date.now() - start}ms`);
	}
}
