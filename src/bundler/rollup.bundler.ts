import type { RollupBuild } from "rollup";

import { rollup } from "rollup";
import dts from "rollup-plugin-dts";
import { BundleEntry, BundleOptions, Bundler } from "@/bundler";

class RollupBundler implements Bundler {
	public async bundle(entry: BundleEntry, config: BundleOptions): Promise<void> {
		if (entry.format !== "dts") {
			return;
		}
		const bundle = await this.create(entry, config);
		try {
			await bundle.write({
				format: "esm",
				file: entry.output,
			});
		} finally {
			await bundle.close();
		}
	}

	private async create(entry: BundleEntry, config: BundleOptions): Promise<RollupBuild> {
		return rollup({
			input: entry.inputs,
			output: {
				format: "esm",
				file: entry.output,
			},
			plugins: [
				dts({
					compilerOptions: {
						baseUrl: ".",
						paths: {
							"@/*": ["src/*"],
						},
					},
				}),
			],
			external: config.externals,
		});
	}
}

export function roll(): Bundler {
	return new RollupBundler();
}
