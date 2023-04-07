#!/usr/bin/env node

import path from "node:path";
import { cac } from "cac";
import type { Bundle, Bundler } from "@/bundler/bundler.types";
import { BundleConfig, BundleEntry, BundleOptions } from "@/bundler/bundler.types";
import { ConvertingBundleConfigRetriever } from "@/bundler/config.adapter";
import { StandardIntermediateConfigResolver } from "@/config/default.provider";
import { ExportIntermediateConfigProvider } from "@/config/export.provider";
import { ExportConfigRetriever } from "@/config/export.resolver";
import { MergeIntermediateConfigResolver } from "@/config/merge.provider";
import { PackageIntermediateConfigResolver } from "@/config/package.provider";
import { PackageConfigRetriever } from "@/config/package.resolver";
import { TypescriptIntermediateConfigResolver } from "@/config/typescript.provider";
import { TypeScriptConfigRetriever } from "@/config/typescript.resolver";
import { wrap } from "@/util/array";

// eslint-disable-next-line unicorn/prefer-module
const WORKER_FILE = path.resolve(__dirname, "../dist/worker.mjs");

const VERSION = process.env.VERSION ?? "unknown";

export type FileBundler = {
	build: (entry: BundleEntry, options?: BundleOptions) => Promise<void>;

	dispose?: () => Promise<void>;
};

export type F = {
	bundle: FileBundler;
};

export type FileBundlerFactory = () => Promise<FileBundler>;

export type ResolvedFileBundlerFactory = (bundle: Bundle) => Promise<Bundle>;

async function config(root: string, bundler: Bundler): Promise<BundleConfig[]> {
	const start = Date.now();
	try {
		const adapter = new ConvertingBundleConfigRetriever();
		const resolver = new ExportIntermediateConfigProvider({
			bundle: new ExportConfigRetriever(bundler),
			config: new MergeIntermediateConfigResolver([
				new StandardIntermediateConfigResolver("index"),
				new PackageIntermediateConfigResolver({
					config: new PackageConfigRetriever(),
				}),
				new TypescriptIntermediateConfigResolver({
					config: new TypeScriptConfigRetriever(),
				}),
			]),
		});

		const configs = wrap(await resolver.get(root));

		const entries: BundleConfig[] = [];
		for (const config of configs) {
			const unwrapped = await adapter.map(config);
			entries.push(...unwrapped);
		}
		return entries;
	} finally {
		console.info(`⭐ Warm up in ${Date.now() - start}ms`);
	}
}

async function build(bundler: Bundle): Promise<Bundle> {
	return {
		async build() {
			const start = Date.now();
			try {
				await bundler.build();
			} finally {
				console.info(`⚡ Done bundling in ${Date.now() - start}ms`);
			}
		},

		async dispose() {
			await bundler.dispose();
		},
	};
}

async function watch(bundler: Bundle): Promise<Bundle> {
	return {
		async build() {
			process.stdin.setRawMode(true);
			process.stdin.setEncoding("utf8");

			const { watch } = await import("chokidar");
			const watcher = watch("src/*", {
				ignored: "dist",
			});

			watcher.on("all", async () => {
				const start = Date.now();
				await bundler.build();
				console.log(`⚡ Done rebuilding in ${Date.now() - start}ms`);
			});

			await new Promise<void>((resolve) => {
				process.stdin.setRawMode(true);
				process.stdin.setEncoding("utf8");

				process.stdin.on("data", async (input: string) => {
					// ctrl+c or ctrl+d
					if (input === "\u0003" || input === "\u0004") {
						resolve();
					}
				});

				process.stdin.resume();
			});

			await watcher.close();
		},

		async dispose() {
			try {
				await bundler.dispose();
			} finally {
				process.stdin.pause();
				process.stdin.setRawMode(false);
			}
		},
	};
}

async function execute(factory: FileBundlerFactory, executor: ResolvedFileBundlerFactory): Promise<void> {
	const start = Date.now();
	const bundler = await factory();
	try {
		// Bundle beforehand to eliminate repeated lookups for build
		const configs = await config(process.cwd(), {
			async bundle(entry, options) {
				return {
					async build() {
						await bundler.build(entry, options);
					},

					async dispose() {
						// Do not dispose to ensure bundler available for actual file bundling
					},
				};
			},
		});

		// Do the actual bundling
		const bundle = await executor({
			async build() {
				await Promise.all(
					configs.map(async ({ entry, options }) => {
						await bundler.build(entry, options);
					}),
				);
			},

			async dispose() {
				await bundler.dispose?.();
			},
		});

		try {
			await bundle.build();
		} finally {
			await bundle.dispose();
		}

		// Ensure resources are disposed
		await bundler.dispose?.();
		console.info(`Done with stuff ${Date.now() - start}ms`);
		// Ensure process exits in any case
		process.exit(0);
	} catch (error) {
		console.error("Could not bundle", error);
		// Ensure resources are disposed
		await bundler.dispose?.();
		console.info(`Done with stuff ${Date.now() - start}ms`);
		// Ensure process exits in any case
		process.exit(1);
	}
}

function run(factory: FileBundlerFactory) {
	const cli = cac("tscz");

	cli.command("[root]", "Build") //
		.option("--project", "The current project", {
			default: process.cwd(),
		})
		.action(async () => {
			await execute(factory, build);
		});

	cli.command("watch", "Watch for file changes and rebuild application") //
		.action(async () => {
			if (!process.stdin.isTTY || process.env.CI) {
				return;
			}

			await execute(factory, watch);
		});

	cli.help();
	cli.version(VERSION);

	cli.parse();
}

run(async (): Promise<FileBundler> => {
	if (process.env.BUNDLED === "DONE") {
		const { ThreadPool } = await import("nanothreads");

		const pool = new ThreadPool<BundleConfig, { start: number; end: number }>({
			task: WORKER_FILE,
			type: "module",
			count: 8,
		});

		return {
			build: async (entry: BundleEntry, options?: BundleOptions) => {
				const start = Date.now();
				const { start: request, end: response } = await pool.exec({
					entry,
					options,
				});
				console.log(
					`${entry.output}: ${request - start} - ${Date.now() - response} / ${Date.now() - start}: ${
						Buffer.from(JSON.stringify({ entry, config })).length
					}`,
				);
			},

			dispose: async () => {
				await pool.terminate();
			},
		};
	} else {
		const { bundle } = await import("@/worker");

		return {
			build: async (entry: BundleEntry, options?: BundleOptions) => {
				await bundle({
					entry,
					options,
				});
			},
		};
	}
});
