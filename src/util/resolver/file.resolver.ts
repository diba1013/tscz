import path from "path";
import { constants, promises as fs } from "fs";
import { Retriever } from "@/global.types";

export type DiscoverableFileRetrieverOptions = {
	root?: string;
	name: string;
};

export type File = {
	parent: string;
	path: string;
	content?: string;
};

export class DiscoverableFileRetriever implements Retriever<File> {
	private readonly $root: string;
	private readonly $name: string;

	constructor({ root, name }: DiscoverableFileRetrieverOptions) {
		this.$root = root ?? process.cwd();
		this.$name = name;
	}

	public async get(): Promise<File> {
		const { parent, path } = await this.find();
		const buffer = await fs.readFile(path);

		return {
			parent,
			path,
			content: buffer.toString(),
		};
	}

	private async find(): Promise<File> {
		for (const directory of this.directories()) {
			const file = path.resolve(directory, this.$name);
			try {
				await fs.access(file, constants.R_OK);
				return {
					parent: directory,
					path: file,
				};
			} catch {
				// ignore
			}
		}
		throw new Error(`Could not find ${this.$name} in '${this.$root}'`);
	}

	private *directories(): Generator<string> {
		let pointer = this.$root;
		while (pointer !== path.dirname(pointer)) {
			yield pointer;
			pointer = path.dirname(pointer);
		}
	}
}
