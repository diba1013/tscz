/**
 * A type that may or may not represent a promise.
 */
export type MaybePromise<T> = T | PromiseLike<T> | Promise<T>;

/**
 * A type that may or may not represent an array.
 */
export type MaybeArray<T> = T | T[];

/**
 * A `Retriever` is used to request a specified resource by means of reading, fetching or any other method of retrieval.
 * This resource should be idempotent; subsequent requests should always return the same resource, as long as the underlying source is not changed (e.g. file modifications).
 * Thus, further means of optimization like threading or caching may be used for subsequent requests.
 */
export interface Retriever<T> {
	/**
	 * Retrieves the requested resource.
	 */
	get(): MaybePromise<T>;
}
