import path from "path";
import { describe, expect, it } from "vitest";
import { DiscoverableFileRetriever } from "@/util/resolver/file.resolver";

describe("DiscoverableFileRetriever", () => {
	it("should find file in current direcotry", async () => {
		const cut = new DiscoverableFileRetriever({
			root: process.cwd(),
			name: "package.json",
		});

		const result = await cut.get();

		expect(result).to.include({
			parent: process.cwd(),
			path: path.resolve(process.cwd(), "package.json"),
		});
	});

	it("should find file in child directory", async () => {
		const cut = new DiscoverableFileRetriever({
			root: path.resolve(process.cwd(), "src"),
			name: "LICENSE",
		});

		const result = await cut.get();

		expect(result).to.include({
			parent: process.cwd(),
			path: path.resolve(process.cwd(), "LICENSE"),
		});
	});

	it("should throw if not in parent tree", async () => {
		const cut = new DiscoverableFileRetriever({
			root: process.cwd(),
			name: "non-existent-file",
		});

		const result = cut.get();

		await expect(result).rejects.toThrow();
	});
});
