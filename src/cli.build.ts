import type { BundleConfigRetriever } from "@/bundler/bundler.types";

import { ConvertingBundleConfigRetriever } from "@/bundler/config.provider";
import path from "node:path";
import pc from "picocolors";

import { bundle } from "@/worker";

async function run(root = process.cwd()) {
	const retriever: BundleConfigRetriever = new ConvertingBundleConfigRetriever({
		config: {
			get() {
				return {
					type: "commonjs",
					platform: "node",
					target: "esnext",
					entries: [
						{
							name: "index",
							input: path.resolve(root, "./src/index.ts"),
							output: {
								format: "cjs",
								file: "index.cjs",
							},
						},
						{
							name: "cli",
							input: path.resolve(root, "./src/cli.ts"),
							output: {
								format: "cjs",
								file: "cli.cjs",
							},
						},
					],
					resolve: {
						alias: {
							"@/": path.resolve(root, "./src/"),
						},
					},
					externals: ["esbuild", "typescript"],
				};
			},
		},
		bundler: {
			bundle(entry, options) {
				return {
					async build() {
						return await bundle({ parent: root, entry, options });
					},

					dispose() {
						// Ignore
					},
				};
			},
		},
	});

	try {
		console.info(`${pc.bgBlue(" TSC ")} Bundling with ${pc.green("scaffolding")} mode.\n`);

		const bundle = await retriever.get(root);
		try {
			await bundle.build();
		} finally {
			await bundle.dispose();
		}
	} catch (error) {
		console.error("Failed bundling", error);
	}
}

await run();
