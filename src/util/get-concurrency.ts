import * as isCi from 'is-ci';
import * as physicalCpuCount from 'physical-cpu-count';

let logged = false;

export function getConcurrency(argVal?: string): number {
	// Default concurrency to the number of physical cores.
	// Things seem to start breaking if we go higher than that.
	let concurrency = physicalCpuCount;

	// If on CI, always just hardcode to 2 cores.
	// This could maybe be made better later, but for now this is fine for the majority of cases.
	if (isCi) {
		concurrency = 2;
	}

	// If the user provided their own concurrency value, use that.
	if (typeof argVal === 'string') {
		const userProvidedConcurrency = parseInt(argVal, 10);
		if (userProvidedConcurrency > 0) {
			concurrency = userProvidedConcurrency;
		}
	}

	if (!logged) {
		console.log('Running with a concurrency of:', concurrency);
		console.log('---------------------------------\n');
		logged = true;
	}

	return concurrency;
}
