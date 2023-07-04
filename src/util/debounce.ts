import type { Callable } from "@/global.types";

type DebounceTimeout = ReturnType<typeof setTimeout>;
export type DebounceFlightFunction = () => void;

export function debounce(callable: Callable): DebounceFlightFunction {
	let running = false;
	let flight: DebounceFlightFunction | undefined;
	let timeout: DebounceTimeout | undefined;

	return function build() {
		if (running) {
			flight = build;
			return;
		}
		if (timeout !== undefined) {
			clearTimeout(timeout);
		}
		// Errors are handled
		// eslint-disable-next-line @typescript-eslint/no-misused-promises
		timeout = setTimeout(async () => {
			timeout = undefined;
			running = true;
			try {
				await callable();
			} catch {
				// Ignore
			} finally {
				running = false;
				flight?.();
				flight = undefined;
			}
		}, 100);
	};
}
