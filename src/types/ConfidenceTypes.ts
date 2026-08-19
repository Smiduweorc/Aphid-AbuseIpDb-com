// Helper to recursively build a union of numbers from 0 to N
export type Enumerate<N extends number, Acc extends number[] = []> =
	Acc["length"] extends N
	? Acc[number]
	: Enumerate<N, [...Acc, Acc["length"]]>;

// Subtracts the lower bound by excluding numbers below it
export type IntRange<F extends number, T extends number> =
	Exclude<Enumerate<T>, Enumerate<F>> | T;

export type ConfidenceRange = IntRange<0, 100>;