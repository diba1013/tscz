import { cac } from "cac";
import type { Bundle, BundleConfig } from "@/bundler/bundler.types";
import { ConvertingBundleConfigRetriever } from "@/bundler/config.adapter";
import type { Config, ConfigResolver } from "@/config/config.types";
import { MergeIntermediateConfigResolver } from "@/config/merge.provider";
import { PackageIntermediateConfigResolver } from "@/config/package.provider";
import { StandardIntermediateConfigResolver } from "@/config/default.provider";
import { wrap } from "@/util/array";
import { PackageConfigRetriever } from "@/config/package.resolver";
import { TypeScriptConfigRetriever } from "@/config/typescript.resolver";
import { MaybePromise } from "@/global.types";
import { ExportIntermediateConfigProvider } from "@/config/export.provider";
import { ExportConfigRetriever } from "@/config/export.resolver";
import { TypescriptIntermediateConfigResolver } from "@/config/typescript.provider";

export type FileBundlerFactory = (config: BundleConfig[]) => MaybePromise<Bundle>;

class CommandLineConfigResolver implements ConfigResolver {
	constructor(private readonly input?: string[]) {}

	async get(): Promise<Config> {
		const cli = cac("tscz");

		cli.option("--watch", "Watch file changes and rebuild", {
			default: false,
		});

		const { options } = cli.parse(this.input);

		return {
			watch: options["watch"] ?? false,
		};
	}
}

async function config(root: string): Promise<BundleConfig[]> {
	try {
		console.time("⭐ Warm up in");

		const adapter = new ConvertingBundleConfigRetriever();
		const resolver = new ExportIntermediateConfigProvider({
			bundle: new ExportConfigRetriever(),
			config: new MergeIntermediateConfigResolver([
				new StandardIntermediateConfigResolver("index"),
				new PackageIntermediateConfigResolver({
					config: new PackageConfigRetriever(),
				}),
				new TypescriptIntermediateConfigResolver({
					config: new TypeScriptConfigRetriever(),
				}),
				new CommandLineConfigResolver(),
			]),
		});

		const configs = await resolver.get(root);

		const entries: BundleConfig[] = [];
		for (const config of wrap(configs)) {
			const unwrapped = await adapter.map(config);
			entries.push(...unwrapped);
		}
		return entries;
	} finally {
		console.timeEnd("⭐ Warm up in");
	}
}

async function bundle(bundler: Bundle) {
	try {
		console.time("⚡ Done bundling in");
		await bundler.build();
		console.timeEnd("⚡ Done bundling in");
	} finally {
		console.time("⭐ Shutdown");
		await bundler.dispose();
		console.timeEnd("⭐ Shutdown");
	}
}

export async function run(factory: FileBundlerFactory) {
	try {
		const configs = await config(process.cwd());
		const bundler = await factory(configs);

		await bundle(bundler);
	} catch (error) {
		console.error("Could not bundle", error);
		// eslint-disable-next-line unicorn/no-process-exit
		process.exit(1);
	}
}
