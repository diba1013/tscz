import type { Module } from "@/config/config.types";
import type { Retriever } from "@/global.types";
import path from "node:path";
import { readFile } from "node:fs/promises";

const PACKAGE_FILE = "package.json";

export type PackageConfig = {
	name: string;
	type: Module;
	version: string;
	dependencies?: Record<string, string>;
	peerDependencies?: Record<string, string>;
};

export class PackageConfigRetriever implements Retriever<PackageConfig> {
	async get(root: string): Promise<PackageConfig> {
		const input = path.resolve(root, PACKAGE_FILE);
		const file = await readFile(input);
		const content = file.toString();
		// Using any here is fine
		// eslint-disable-next-line @typescript-eslint/no-unsafe-return
		return JSON.parse(content);
	}
}
