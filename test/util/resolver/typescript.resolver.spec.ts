import { ScriptTarget } from "typescript";
import { describe, expect, it } from "vitest";
import { DiscoverableFileRetriever, File } from "@/util/resolver/file.resolver";
import { TypeScriptConfigRetriever } from "@/config/typescript.resolver";

const TSCONFIG_FILE = "tsconfig.json";

describe("TypeScriptConfigRetriever", () => {
	it("should parse json config", async () => {
		const cut = new TypeScriptConfigRetriever({
			get(): File {
				return {
					parent: process.cwd(),
					path: TSCONFIG_FILE,
					content: `{
						"compilerOptions": {
							"baseUrl": ".",
							"target": "esnext",
							"module": "esnext"
						}
					}`,
				};
			},
		});

		const { compilerOptions } = await cut.get();

		expect(compilerOptions).to.have.property("target", ScriptTarget.ESNext);
		expect(compilerOptions).to.have.property("module", ScriptTarget.ESNext);
		expect(compilerOptions).to.have.property("baseUrl", process.cwd());
	});

	it("should throw if json config invalid", async () => {
		const cut = new TypeScriptConfigRetriever({
			get(): File {
				return {
					parent: process.cwd(),
					path: TSCONFIG_FILE,
					content: `{
						"compilerOptions": {
							"baseUrl": ".",
							"target": "invalid",
						}
					}`,
				};
			},
		});

		const result = cut.get();

		await expect(result).rejects.toThrow();
	});

	it("should read extended project config", async () => {
		const cut = new TypeScriptConfigRetriever(
			new DiscoverableFileRetriever({
				name: TSCONFIG_FILE,
			}),
		);

		const { compilerOptions } = await cut.get();

		expect(compilerOptions).to.have.property("target", ScriptTarget.ESNext);
		expect(compilerOptions).to.have.property("module", ScriptTarget.ESNext);
		expect(compilerOptions).to.have.property("baseUrl", process.cwd());
	});
});
