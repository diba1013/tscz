import type { RollupBuild } from "rollup";
import { rollup } from "rollup";
import dts from "rollup-plugin-dts";
import { Bundle, BundleEntry, BundleOptions, Bundler } from "@/bundler/bundler.types";

// Need a constant here, since typescript ScriptTarget does not work with esm
const ES_NEXT = 99;

export class RollupBundler implements Bundler {
	public async bundle(entry: BundleEntry, config: BundleOptions): Promise<Bundle> {
		if (entry.format !== "dts") {
			throw new Error(`Rollup cannot bundle ${entry.format} files`);
		}
		const bundle = await this.create(entry, config);
		return {
			async build() {
				await bundle.write({
					format: "esm",
					file: entry.output,
				});
			},

			async watch() {
				// Ignore for dts
			},

			async dispose() {
				await bundle.close();
			},
		};
	}

	private create(entry: BundleEntry, config: BundleOptions): Promise<RollupBuild> {
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
						target: ES_NEXT,
						paths: this.restore(config.resolve?.alias ?? {}),
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

	private restore(entries: Record<string, string>): Record<string, string[]> {
		const result: Record<string, string[]> = {};

		for (const [key, path] of Object.entries(entries)) {
			result[key] = [path];
			if (key.endsWith("/")) {
				result[`${key}*`] = [`${path}${path.endsWith("/") ? "*" : "/*"}`];
			}
		}

		return result;
	}
}
