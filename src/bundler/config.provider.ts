import type { Bundle, BundleConfig, BundleConfigRetriever, BundleEntry, Bundler } from "@/bundler/bundler.types";
import type {
	Config,
	ConfigEntryOutput,
	ConfigEntryOutputList,
	Format,
	FormatObject,
	IntermediateConfig,
	Module,
} from "@/config/config.types";
import { Retriever } from "@/global.types";
import { wrap } from "@/util/array";
import path from "node:path";
import pc from "picocolors";

const EXTENSIONS: Record<Module, Record<Format, string>> = {
	commonjs: {
		cjs: "js",
		esm: "mjs",
		dts: "d.ts",
	},
	module: {
		cjs: "cjs",
		esm: "js",
		dts: "d.ts",
	},
};

class BundledBundle implements Bundle {
	private readonly $bundles: Bundle[];

	constructor(bundles: Bundle[]) {
		this.$bundles = bundles;
	}

	async build() {
		const start = Date.now();
		try {
			console.info(`${pc.blue("[cli]")} Bundling ${this.$bundles.length} configurations...`);
			const outputs = await Promise.all(
				this.$bundles.map(async (bundle) => {
					return bundle.build();
				}),
			);
			return outputs.flat();
		} finally {
			const end = Date.now() - start;
			console.info(`${pc.blue("[cli]")} Done bundling in ${end}ms`);
		}
	}

	async dispose() {
		const start = Date.now();
		try {
			await Promise.all(
				this.$bundles.map((bundle) => {
					return bundle.dispose();
				}),
			);
		} finally {
			const end = Date.now() - start;
			console.info(
				`${pc.blue("[cli]")} ${pc.dim(`Disposed ${this.$bundles.length} configurations in ${end}ms`)}\n`,
			);
		}
	}
}

export type ConvertingBundleConfigRetrieverProvider = {
	config: Retriever<IntermediateConfig>;
	bundler: Bundler;
};

export class ConvertingBundleConfigRetriever implements BundleConfigRetriever {
	private readonly $config: Retriever<IntermediateConfig>;
	private readonly $bundler: Bundler;

	constructor({ config, bundler }: ConvertingBundleConfigRetrieverProvider) {
		this.$config = config;
		this.$bundler = bundler;
	}

	async get(root: string): Promise<BundleConfig> {
		const start = Date.now();
		const configs = await this.$config.get(root);
		// Gather watch paths
		const watch = new Set<string>();
		const ignored = new Set<string>(["**/{.git,node_modules,.vscode}/**"]);
		// Remap configs to bundles
		const entries: BundleEntry[] = [];
		for (const config of wrap(configs)) {
			for (const entry of this.toBundleEntries(config)) {
				entries.push(entry);
			}
			for (const path of this.toWatchPaths(config)) {
				watch.add(path);
			}
			ignored.add(`./${config.output ?? "dist"}/**`);
		}
		// compile bundles
		const bundles = await Promise.all(
			entries.map(async (entry) => {
				return await this.$bundler.bundle(entry);
			}),
		);
		console.info(`${pc.blue("[cli]")} ${pc.dim(`Warm up in ${Date.now() - start}ms`)}`);
		return {
			bundle: new BundledBundle(bundles),
			watch: { paths: [...watch], ignored: [...ignored] },
		};
	}

	private *toBundleEntries({
		type,
		name: global,
		target,
		output: bases = "dist",
		platform,
		resolve,
		externals,
		env,
		entries = [],
	}: Config): Generator<BundleEntry> {
		for (const { name, input, output, bundle, minify } of entries) {
			for (const {
				format,
				file = `${name ?? global ?? "index"}.${this.extension(format, type)}`,
			} of this.toFormatObjects(output)) {
				yield {
					format,
					inputs: wrap(input),
					bundle,
					minify,
					output: path.resolve(bases, file),
					target,
					platform,
					resolve,
					externals,
					env,
				};
			}
		}
	}

	private *toFormatObjects(entries: ConfigEntryOutput | ConfigEntryOutputList): Generator<FormatObject> {
		for (const entry of wrap(entries)) {
			yield typeof entry === "string"
				? {
						format: entry,
				  }
				: entry;
		}
	}

	private extension(format: Format, type: Module = "commonjs"): string {
		return EXTENSIONS[type]?.[format] ?? "js";
	}

	private toWatchPaths({ watch = true }: Config): string[] {
		if (Array.isArray(watch)) {
			return watch;
		}
		if (watch) {
			return ["."];
		}
		return [];
	}
}
