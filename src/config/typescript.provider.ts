import type { IntermediateConfig, IntermediateConfigResolver } from "@/config/config.types";
import type { TypeScriptConfig } from "@/config/typescript.resolver";

import path from "node:path";
import { ScriptTarget } from "typescript";

import type { Retriever } from "@/global.types";

type ScriptTargets = Lowercase<keyof typeof ScriptTarget>;

const SCRIPT_TARGET_MAPPING: Partial<Record<ScriptTargets, string>> = {
	latest: "esnext",
};

export type TypescriptIntermediateConfigResolverOptions = {
	config: Retriever<TypeScriptConfig>;
};

export class TypescriptIntermediateConfigResolver implements IntermediateConfigResolver {
	private readonly $config: Retriever<TypeScriptConfig>;

	constructor({ config }: TypescriptIntermediateConfigResolverOptions) {
		this.$config = config;
	}

	public async get(root: string): Promise<IntermediateConfig> {
		const {
			compilerOptions: { baseUrl = root, outDir: output = "dist", target = ScriptTarget.ESNext, paths = {} },
		} = await this.$config.get(root);

		return {
			output,
			target: this.target(target),
			resolve: {
				alias: this.alias(baseUrl, paths),
			},
		};
	}

	private target(target: ScriptTarget): string {
		const resolved = ScriptTarget[target];
		const name = resolved.toLowerCase() as ScriptTargets;
		return SCRIPT_TARGET_MAPPING[name] ?? name;
	}

	private alias(root: string, paths: Record<string, string[]>): Record<string, string> {
		const alias: Record<string, string> = {};

		for (const [key, [entry]] of Object.entries(paths)) {
			alias[this.normalize(key)] = path.resolve(root, this.normalize(entry));
		}

		return alias;
	}

	private normalize(path: string): string {
		return path.replace(/\/\*$/, "/");
	}
}
