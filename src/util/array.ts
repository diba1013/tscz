import { MaybeArray } from "@/global.types";

export function wrap<T>(array: MaybeArray<T>): T[] {
	if (Array.isArray(array)) {
		return array;
	}
	return [array];
}

export function merge<T>(items: MaybeArray<T>): T {
	if (Array.isArray(items)) {
		return Object.assign({}, ...items);
	}
	return items;
}

export function combine<T>(config: T, items: MaybeArray<T>): MaybeArray<T> {
	if (Array.isArray(items)) {
		if (items.length > 0) {
			return items.map((item) => {
				return merge([config, item]);
			});
		}
		return wrap(config);
	}
	return merge([config, items]);
}
