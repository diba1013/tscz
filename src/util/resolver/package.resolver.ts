import { Retriever } from "@/global.types";
import { Module } from "@/config/config.types";
import { File } from "@/util/resolver/file.resolver";

export type PackageConfig = {
	name: string;
	type: Module;
	version: string;
	dependencies?: Record<string, string>;
	peerDependencies?: Record<string, string>;
};

export class PackageConfigRetriever implements Retriever<PackageConfig> {
	private readonly $file: Retriever<File>;

	constructor(file: Retriever<File>) {
		this.$file = file;
	}

	async get(): Promise<PackageConfig> {
		const { content = "{}" } = await this.$file.get();
		return JSON.parse(content);
	}
}
