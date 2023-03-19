import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Retriever } from "@/global.types";
import type { Module } from "@/config/config.types";

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
		return JSON.parse(content);
	}
}
