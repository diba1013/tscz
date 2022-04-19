#!/usr/bin/env node

import { cac } from "cac";
import pc from "picocolors";
import { BundleEntry, BundleOptions, Bundler, Bundlers } from "@/bundler";
import { BundleIntermediateConfigResolver } from "@/config/bundle.provider";
import { Config, ConfigResolver } from "@/config/config.types";
import { convert } from "@/bundler/config.adapter";
import { DiscoverableFileRetriever } from "@/util/resolver/file.resolver";
import { MergeIntermediateConfigResolver } from "@/config/merge.provider";
import { PackageConfigRetriever } from "@/util/resolver/package.resolver";
import { PackageIntermediateConfigResolver } from "@/config/package.provider";
import { StandardIntermediateConfigResolver } from "@/config/standard.provider";
import { TypeScriptConfigRetriever } from "@/util/resolver/typescript.resolver";
import { TypescriptIntermediateConfigResolver } from "@/config/typescript.provider";
import { wrap } from "@/util/array";

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

async function config(): Promise<Config[]> {
	console.time("⭐ Warm up in");

	const resolver = new BundleIntermediateConfigResolver({
		file: new DiscoverableFileRetriever({
			name: "tscz.config.ts",
		}),
		config: new MergeIntermediateConfigResolver([
			new StandardIntermediateConfigResolver("index"),
			new PackageIntermediateConfigResolver(
				new PackageConfigRetriever(
					new DiscoverableFileRetriever({
						name: "package.json",
					}),
				),
			),
			new TypescriptIntermediateConfigResolver(
				new TypeScriptConfigRetriever(
					new DiscoverableFileRetriever({
						name: "tsconfig.json",
					}),
				),
			),
			new CommandLineConfigResolver(),
		]),
	});

	const configs = await resolver.get();

	console.timeEnd("⭐ Warm up in");

	return wrap(configs);
}

async function bundle(bundler: Bundler, entry: BundleEntry, options?: BundleOptions) {
	const format = `[${entry.format}]`;
	const name = `${pc.cyan(format)} Done bundling ${pc.gray(entry.output)}`;

	console.time(name);
	await bundler.bundle(entry, options);
	console.timeEnd(name);
}

async function run() {
	console.time("⚡ Done bundling in");

	const bundler = Bundlers.generic();
	const configs = await config();

	const adapter = convert();

	for (const config of configs) {
		for (const { entry, options } of await adapter.map(config)) {
			await bundle(bundler, entry, options);
		}
	}

	console.timeEnd("⚡ Done bundling in");
}

run();
