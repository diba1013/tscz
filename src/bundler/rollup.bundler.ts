import type { RollupBuild } from "rollup";
import { ScriptTarget } from "typescript";
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
						target: ScriptTarget.ESNext,
						paths: {
							"@/*": ["src/*"],
						},
						// Ensure dts generation
						declaration: true,
						noEmit: false,
						emitDeclarationOnly: true,
						// Speed up compilation by avoiding extra work
						noEmitOnError: true,
						checkJs: false,
						declarationMap: false,
						skipLibCheck: true,
						preserveSymlinks: false,
						// Disable composite as this messes with file inclusion
						composite: false,
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
