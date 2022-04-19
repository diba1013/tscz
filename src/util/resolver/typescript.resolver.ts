import { CompilerOptions, parseConfigFileTextToJson, parseJsonConfigFileContent, sys } from "typescript";
import { Retriever } from "@/global.types";
import { File } from "@/util/resolver/file.resolver";

export type TypeScriptConfig = {
	compilerOptions: CompilerOptions;
};

export type TypeScriptConfigRetrieverOptions = {
	root?: string;
	name?: string;
};

export class TypeScriptConfigRetriever implements Retriever<TypeScriptConfig> {
	private $file: Retriever<File>;

	constructor(file: Retriever<File>) {
		this.$file = file;
	}

	async get(): Promise<TypeScriptConfig> {
		const { parent, path, content = "{}" } = await this.$file.get();

		const { config } = parseConfigFileTextToJson(path, content);
		const { options, errors } = parseJsonConfigFileContent(config, sys, parent);
		if (errors.length > 0) {
			const cause = errors.map((error) => {
				return new Error(error.messageText.toString());
			});
			throw new AggregateError(cause, `Could not parse ${path}`);
		}

		return {
			compilerOptions: options,
		};
	}
}
