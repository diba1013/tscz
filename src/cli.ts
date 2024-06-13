#!/usr/bin/env node

import type { BundleEntry, BundleOutput } from "@/bundler/bundler.types";
import type { Bundle, BundleConfig, Bundler } from "@/bundler/bundler.types";
import { ConvertingBundleConfigRetriever } from "@/bundler/config.provider";
import { StandardIntermediateConfigResolver } from "@/config/default.provider";
import { ExportConfigRetriever } from "@/config/export.provider";
import { MergeIntermediateConfigResolver } from "@/config/merge.provider";
import { PackageIntermediateConfigResolver } from "@/config/package.provider";
import { PackageConfigRetriever } from "@/config/package.resolver";
import { TypescriptIntermediateConfigResolver } from "@/config/typescript.provider";
import { TypeScriptConfigRetriever } from "@/config/typescript.resolver";
import { debounce } from "@/util/debounce";
import path from "node:path";
import { cac } from "cac";
import pc from "picocolors";

// eslint-disable-next-line unicorn/prefer-module
const WORKER_FILE = path.resolve(__dirname, "../dist/worker.js");

const VERSION = process.env.VERSION ?? "unknown";

type FileBundler = {
	bundle: (entry: BundleEntry) => Promise<BundleOutput[]>;

	dispose?: () => Promise<void>;
};

type FileBundlerFactory = () => Promise<FileBundler>;

type ResolvedFileBundlerFactory = (bundler: Bundler) => Promise<Bundle>;

async function config(bundler: Bundler, root = process.cwd()): Promise<BundleConfig> {
	const adapter = new ConvertingBundleConfigRetriever({
		config: new ExportConfigRetriever({
			bundler,
			config: new MergeIntermediateConfigResolver([
				new StandardIntermediateConfigResolver("index"),
				new PackageIntermediateConfigResolver({
					config: new PackageConfigRetriever(),
				}),
				new TypescriptIntermediateConfigResolver({
					config: new TypeScriptConfigRetriever(),
				}),
			]),
		}),
		bundler,
	});
	return await adapter.get(root);
}

async function build(bundler: Bundler): Promise<Bundle> {
	const { bundle } = await config(bundler);
	return {
		async build() {
			return await bundle.build();
		},

		async dispose() {
			await bundle.dispose();
		},
	};
}

async function watch(bundler: Bundler): Promise<Bundle> {
	const {
		bundle,
		watch: { paths, ignored },
	} = await config(bundler);

	return {
		async build() {
			console.info(`${pc.blue("[cli]")} ${pc.dim(`Watching ${paths.join(" | ")}`)}`);
			console.info(`${pc.blue("[cli]")} ${pc.dim(`Ignoring ${ignored.join(" | ")}`)}`);

			process.stdin.setRawMode(true);
			process.stdin.setEncoding("utf8");

			const { watch } = await import("chokidar");
			const watcher = watch(paths, {
				ignored,
			});

			const build = debounce(async () => {
				await bundle.build();
			});
			watcher.on("all", build);

			await new Promise<void>((resolve) => {
				process.stdin.resume();
				process.stdin.on("data", (input: string) => {
					// ctrl+c or ctrl+d
					if (input === "\u0003" || input === "\u0004") {
						resolve();
					}
				});
			});

			await watcher.close();

			return [];
		},

		async dispose() {
			try {
				await bundle.dispose();
			} finally {
				process.stdin.pause();
				process.stdin.setRawMode(false);
			}
		},
	};
}

async function execute(bundler: FileBundler, executor: ResolvedFileBundlerFactory): Promise<void> {
	try {
		// Bundle beforehand to eliminate repeated lookups for build
		const bundle = await executor({
			// Satisfies interface
			// eslint-disable-next-line @typescript-eslint/require-await
			async bundle(entry) {
				return {
					async build() {
						return await bundler.bundle(entry);
					},

					async dispose() {
						// Do not dispose to ensure bundler available for actual file bundling
					},
				};
			},
		});

		try {
			await bundle.build();
		} finally {
			await bundle.dispose();
		}

		// Ensure resources are disposed
		await bundler.dispose?.();
		// Ensure process exits in any case
		process.exit(0);
	} catch (error) {
		console.error("Could not bundle", error);
		// Ensure resources are disposed
		await bundler.dispose?.();
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
			const instance = await factory();
			await execute(instance, build);
		});

	cli.command("watch", "Watch for file changes and rebuild application") //
		.action(async () => {
			if (!process.stdin.isTTY || process.env.CI) {
				return;
			}
			const instance = await factory();
			await execute(instance, watch);
		});

	cli.help();
	cli.version(VERSION);

	cli.parse();
}

run(async (): Promise<FileBundler> => {
	console.info(`${pc.bgBlue(" TSC ")} Bundling with ${pc.green(process.env.BUNDLED ?? "development")} mode.\n`);

	if (process.env.BUNDLED === "production") {
		const { Tinypool } = await import("tinypool");

		const pool = new Tinypool({
			filename: WORKER_FILE,
		});

		return {
			bundle: async (entry: BundleEntry) => {
				// This is ensured by the worker
				// eslint-disable-next-line @typescript-eslint/no-unsafe-return
				return await pool.run({
					entry,
				});
			},

			dispose: async () => {
				await pool.destroy();
			},
		};
	} else {
		const { bundle } = await import("@/worker");

		return {
			bundle: async (entry: BundleEntry) => {
				return await bundle({
					entry,
				});
			},
		};
	}
});
