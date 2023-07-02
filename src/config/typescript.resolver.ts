import type { Retriever } from "@/global.types";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { CompilerOptions, parseConfigFileTextToJson, parseJsonConfigFileContent, sys } from "typescript";

const TYPESCRIPT_FILE = "tsconfig.json";

export type TypeScriptConfig = {
	compilerOptions: CompilerOptions;
};

export type TypeScriptConfigRetrieverOptions = {
	root?: string;
	name?: string;
};

export class TypeScriptConfigRetriever implements Retriever<TypeScriptConfig> {
	async get(root: string): Promise<TypeScriptConfig> {
		const input = path.resolve(root, TYPESCRIPT_FILE);
		const file = await readFile(input);
		const content = file.toString();

		// This is fine as long as there are no errors while parsing
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const { config } = parseConfigFileTextToJson(input, content);
		const { options, errors } = parseJsonConfigFileContent(config, sys, root);
		if (errors.length > 0) {
			const cause = errors.map((error) => {
				return new Error(error.messageText.toString());
			});
			throw new AggregateError(cause, `Could not parse ${input}`);
		}

		return {
			compilerOptions: options,
		};
	}
}
