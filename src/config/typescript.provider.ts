import path from "path";
import { ScriptTarget } from "typescript";
import { IntermediateConfig, IntermediateConfigResolver } from "@/config/config.types";
import { Retriever } from "@/global.types";
import { TypeScriptConfig } from "@/util/resolver/typescript.resolver";

type ScriptTargets = Lowercase<keyof typeof ScriptTarget>;

const SCRIPT_TARGET_MAPPING: Partial<Record<ScriptTargets, string>> = {
	latest: "esnext",
};

export class TypescriptIntermediateConfigResolver implements IntermediateConfigResolver {
	constructor(private readonly config: Retriever<TypeScriptConfig>) {}

	public async get(): Promise<IntermediateConfig> {
		const {
			compilerOptions: { baseUrl, outDir, target, paths },
		} = await this.config.get();

		return {
			output: outDir ?? "dist",
			target: this.target(target),
			resolve: {
				alias: this.alias(baseUrl, paths),
			},
		};
	}

	private target(target: ScriptTarget = ScriptTarget.ESNext): string {
		const resolved = ScriptTarget[target];
		const name = resolved.toLowerCase() as ScriptTargets;
		return SCRIPT_TARGET_MAPPING[name] ?? name;
	}

	private alias(root: string = process.cwd(), paths: Record<string, string[]> = {}): Record<string, string> {
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
