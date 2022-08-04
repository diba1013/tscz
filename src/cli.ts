#!/usr/bin/env node

import { cac } from "cac";
import type { BundleConfig } from "@/bundler/bundler.types";
import { bundle } from "@/bundler/bundler.worker";
import { ConvertingBundleConfigRetriever } from "@/bundler/config.adapter";
import { BundleIntermediateConfigResolver } from "@/config/bundle.provider";
import type { Config, ConfigResolver } from "@/config/config.types";
import { MergeIntermediateConfigResolver } from "@/config/merge.provider";
import { PackageIntermediateConfigResolver } from "@/config/package.provider";
import { StandardIntermediateConfigResolver } from "@/config/standard.provider";
import { TypescriptIntermediateConfigResolver } from "@/config/typescript.provider";
import { wrap } from "@/util/array";
import { DiscoverableFileRetriever } from "@/util/resolver/file.resolver";
import { PackageConfigRetriever } from "@/util/resolver/package.resolver";
import { TypeScriptConfigRetriever } from "@/util/resolver/typescript.resolver";

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

async function config(): Promise<BundleConfig[]> {
	try {
		console.time("⭐ Warm up in");

		const adapter = new ConvertingBundleConfigRetriever();
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

async function run() {
	try {
		console.time("⚡ Done bundling in");

		const configs = await config();

		await Promise.all(
			configs.map(async (entry) => {
				await bundle(entry);
			}),
		);
	} catch (error) {
		console.error("Could not bundle", error);
	} finally {
		console.timeEnd("⚡ Done bundling in");
	}
}

// eslint-disable-next-line unicorn/prefer-top-level-await
run();
