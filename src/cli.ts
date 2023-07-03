#!/usr/bin/env node

import type { Bundle, Bundler } from "@/bundler/bundler.types";
import type { BundleEntry, BundleOutput } from "@/bundler/bundler.types";
import { ConvertingBundleConfigRetriever } from "@/bundler/config.provider";
import { StandardIntermediateConfigResolver } from "@/config/default.provider";
import { ExportConfigRetriever } from "@/config/export.provider";
import { MergeIntermediateConfigResolver } from "@/config/merge.provider";
import { PackageIntermediateConfigResolver } from "@/config/package.provider";
import { PackageConfigRetriever } from "@/config/package.resolver";
import { TypescriptIntermediateConfigResolver } from "@/config/typescript.provider";
import { TypeScriptConfigRetriever } from "@/config/typescript.resolver";
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

type ResolvedFileBundlerFactory = (bundle: Bundle) => Bundle;

async function config(root: string, bundler: Bundler): Promise<Bundle> {
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

function watch(bundler: Bundle): Bundle {
	return {
		async build() {
			process.stdin.setRawMode(true);
			process.stdin.setEncoding("utf8");

			const { watch } = await import("chokidar");
			const watcher = watch("src/*", {
				ignored: "dist",
			});

			// Promise is handled
			// eslint-disable-next-line @typescript-eslint/no-misused-promises
			watcher.on("all", async () => {
				const start = Date.now();
				try {
					await bundler.build();
					console.info(`⚡ Done rebuilding in ${Date.now() - start}ms`);
				} catch (error) {
					console.error(`⚡ Failed rebuilding in ${Date.now() - start}ms`, error);
				}
			});

			await new Promise<void>((resolve) => {
				process.stdin.setRawMode(true);
				process.stdin.setEncoding("utf8");

				process.stdin.on("data", (input: string) => {
					// ctrl+c or ctrl+d
					if (input === "\u0003" || input === "\u0004") {
						resolve();
					}
				});

				process.stdin.resume();
			});

			await watcher.close();

			return [];
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

async function execute(bundler: FileBundler, executor: ResolvedFileBundlerFactory = (bundle) => bundle): Promise<void> {
	try {
		// Bundle beforehand to eliminate repeated lookups for build
		const bundle = executor(
			await config(process.cwd(), {
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
			}),
		);

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
			await execute(await factory());
		});

	cli.command("watch", "Watch for file changes and rebuild application") //
		.action(async () => {
			if (!process.stdin.isTTY || process.env.CI) {
				return;
			}

			await execute(await factory(), watch);
		});

	cli.help();
	cli.version(VERSION);

	cli.parse();
}

run(async (): Promise<FileBundler> => {
	console.info(`${pc.bgBlue(" TSC ")} Bundling with ${pc.green(process.env.BUNDLED || "development")} mode.\n`);

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
