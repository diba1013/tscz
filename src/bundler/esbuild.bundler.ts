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
			},

			async dispose() {
				await bundler.dispose();
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

		return {
			format: entry.format,
			platform: options.platform ?? "node",
			target: options.target ?? "esnext",
			bundle: entry.bundle ?? true,
			entryPoints: entry.inputs,
			outfile: entry.output,
			external: options.externals ?? [],
			minify: entry.minify ?? entry.format !== "esm",
			define: this.replace(options.env ?? {}),
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
