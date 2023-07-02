import type { Bundle, BundleEntry, BundleOptions, Bundler } from "@/bundler/bundler.types";
import { BuildOptions, Plugin, context } from "esbuild";
import alias from "esbuild-plugin-alias";

export class EsbuildBundler implements Bundler {
	async bundle(entry: BundleEntry, options: BundleOptions = {}): Promise<Bundle> {
		const config = this.config(entry, options);
		const bundler = await context(config);
		return {
			async build() {
				await bundler.rebuild();
				return [
					{
						file: entry.output,
					},
				];
			},

			async dispose() {
				await bundler.dispose();
			},
		};
	}

	config(
		{ format, inputs, output, bundle = true, minify = format !== "esm" }: BundleEntry,
		{ platform = "node", target = "esnext", resolve = {}, externals = [], env: environment = {} }: BundleOptions,
	): BuildOptions {
		if (format === "dts") {
			throw new Error("Cannot bundle dts with esbuild");
		}

		const plugins: Plugin[] = [];
		if (resolve.alias !== undefined) {
			plugins.push(this.alias(resolve.alias));
		}

		return {
			format,
			platform,
			target,
			bundle,
			entryPoints: inputs,
			outfile: output,
			external: bundle ? externals : [],
			minify,
			define: this.replace(environment),
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

	replace(paths: Record<string, string>): Record<string, string> {
		const entries: Record<string, string> = {};

		for (const [key, value] of Object.entries(paths)) {
			const normalized = JSON.stringify(value);
			entries[`process.env.${key}`] = normalized;
			entries[`import.meta.env.${key}`] = normalized;
		}

		return entries;
	}
}
