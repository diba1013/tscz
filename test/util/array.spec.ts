import { combine, merge, wrap } from "@/util/array";
import { describe, expect, it } from "vitest";

describe("wrap", () => {
	it("should not touch empty array", () => {
		const result = wrap([]);

		expect(result).to.eql([]);
	});

	it("should not touch filled array", () => {
		const result = wrap([0, 1]);

		expect(result).to.eql([0, 1]);
	});

	it("should wrap single item", () => {
		const result = wrap(0);

		expect(result).to.eql([0]);
	});
});

describe("merge", () => {
	it("should return empty object with empty array", () => {
		const result = merge([]);

		expect(result).to.be.empty;
	});

	it("should not copy object", () => {
		const input = {
			a: 0,
		};

		const result = merge(input);

		expect(result).to.be.equal(input);
	});

	it("should copy single array", () => {
		const input = {
			a: 0,
		};

		const result = merge([input]);

		expect(result).to.not.equal(input);
		expect(result).to.deep.equal(input);
	});

	it("should merge array left to right", () => {
		const result = merge([
			{
				a: 0,
				b: 0,
				c: 0,
			},
			{
				b: 1,
			},
			{
				c: 2,
				d: 2,
			},
		]);

		expect(result).to.eql({
			a: 0,
			b: 1,
			c: 2,
			d: 2,
		});
	});
});

describe("combine", () => {
	it("should return object if object", () => {
		const result = combine(
			{
				a: 0,
			},
			{
				b: 1,
			},
		);

		expect(result).to.eql({
			a: 0,
			b: 1,
		});
	});

	it("should only wrap object if empty array", () => {
		const input = {
			a: 0,
		};

		const result = combine(input, []);

		expect(result).to.be.an("array").that.includes(input);
	});

	it("should only merge object with single array", () => {
		const result = combine(
			{
				a: 0,
			},
			[
				{
					a: 1,
				},
			],
		);

		expect(result).to.be.an("array").with.length(1).that.deep.includes({
			a: 1,
		});
	});

	it("should merge object with each array item", () => {
		const result = combine(
			{
				a: 0,
			},
			[
				{
					a: 1,
				},
				{
					b: 1,
				},
			],
		);

		expect(result).to.eqls([
			{
				a: 1,
			},
			{
				a: 0,
				b: 1,
			},
		]);
	});
});
