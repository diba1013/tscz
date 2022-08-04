import { BuildContext, BuildOptions, context, Plugin } from "esbuild";
import alias from "esbuild-plugin-alias";
import { replace } from "esbuild-plugin-replace";
import type { Bundle, BundleEntry, BundleOptions, Bundler } from "@/bundler/bundler.types";

export type EsbuildOptions = {
	bundle: boolean;
};

export class EsbuildBundler implements Bundler {
	private readonly $options: EsbuildOptions;

	constructor(options?: EsbuildOptions) {
		this.$options = options ?? {
			bundle: true,
		};
	}

	async bundle(entry: BundleEntry, options: BundleOptions = {}): Promise<Bundle> {
		let bundler: BuildContext<BuildOptions> | undefined;
		return {
			build: async () => {
				if (bundler === undefined) {
					const config = this.config(entry, options);
					bundler = await context(config);
				}
				await bundler?.rebuild();
			},

			async watch() {
				await bundler?.watch();
			},

			async dispose() {
				await bundler?.dispose();
			},
		};
	}

	config(entry: BundleEntry, options: BundleOptions): BuildOptions {
		if (entry.format === "dts") {
			throw new Error("Cannot bundle dts with esbuild");
		}

		const plugins: Plugin[] = [];
		if (options.resolve?.alias !== undefined) {
			plugins.push(this.alias(options.resolve.alias));
		}
		if (options.define !== undefined) {
			plugins.push(this.replace(options.define));
		}

		return {
			format: entry.format,
			platform: options.platform ?? "node",
			target: options.target ?? "esnext",
			bundle: this.$options.bundle,
			entryPoints: entry.inputs,
			outfile: entry.output,
			external: options.externals ?? [],
			minify: entry.minify ?? entry.format !== "esm",
			plugins,
		};
	}

	alias(paths: Record<string, string>): Plugin {
		const aliases: Record<string, string> = {};

		for (const [key, value] of Object.entries(paths)) {
			aliases[this.normalize(key)] = this.normalize(value);
		}

		return alias(aliases);
	}

	normalize(path: string): string {
		return path.replace(/\/*$/, "");
	}

	replace(paths: Record<string, string>): Plugin {
		return replace(paths);
	}
}
