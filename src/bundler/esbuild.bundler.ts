import { BuildOptions, Plugin, build } from "esbuild";
import alias from "esbuild-plugin-alias";
import { replace } from "esbuild-plugin-replace";
import { BundleEntry, BundleOptions, Bundler } from "@/bundler/bundler.types";

export type EsbuildOptions = {
	bundle: boolean;
};

class EsbuildBundler implements Bundler {
	constructor(private readonly options: EsbuildOptions) {}

	async bundle(entry: BundleEntry, options: BundleOptions = {}): Promise<void> {
		const config = await this.config(entry, options);
		await build(config);
	}

	async config(entry: BundleEntry, options: BundleOptions): Promise<BuildOptions> {
		if (entry.format === "dts") {
			throw new Error("Cannot bundle dts with esbuild");
		}
		return {
			format: entry.format,
			platform: options.platform ?? "node",
			target: options.target ?? "esnext",
			bundle: this.options.bundle,
			watch: options.watch
				? {
						onRebuild() {
							console.info("Rebuilding");
						},
				  }
				: undefined,
			entryPoints: entry.inputs,
			outfile: entry.output,
			external: options.externals ?? [],
			minify: entry.minify ?? entry.format !== "esm",
			plugins: [this.alias(options.resolve?.alias ?? {}), this.replace(options.define ?? {})],
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

export function esbuild(options: EsbuildOptions): Bundler {
	return new EsbuildBundler(options);
}
