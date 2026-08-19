// Bounded integer types.
//
// The obvious encoding enumerate every member of the range as a union, only
// scales to a few hundred values: building the tuple blows the instantiation
// depth limit around 1000, and TypeScript refuses unions past 100k members long
// before something like `1..500000` is reachable. So `IntRange` instead compares
// the literal against the bounds digit by digit, which costs one instantiation
// per digit (six for 500000) and works for arbitrarily large bounds.

type Digit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";

// For each digit, the digits strictly greater than it.
type GreaterDigits = {
	"0": "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";
	"1": "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";
	"2": "3" | "4" | "5" | "6" | "7" | "8" | "9";
	"3": "4" | "5" | "6" | "7" | "8" | "9";
	"4": "5" | "6" | "7" | "8" | "9";
	"5": "6" | "7" | "8" | "9";
	"6": "7" | "8" | "9";
	"7": "8" | "9";
	"8": "9";
	"9": never;
};

type Ordering = "lt" | "eq" | "gt";

type Flip<O extends Ordering> = O extends "lt" ? "gt" : O extends "gt" ? "lt" : "eq";

type Tail<S extends string> = S extends `${infer _H}${infer T}` ? T : "";

// True only for a non-empty run of decimal digits, which rules out the string
// forms of NaN, Infinity, 1.5 and 1e+21 before they reach the digit compare.
type IsDigits<S extends string> =
	S extends ""
		? false
		: S extends `${Digit}${infer T}`
			? T extends "" ? true : IsDigits<T>
			: false;

// Shorter digit string loses: `${number}` never emits leading zeroes.
type CompareLength<A extends string, B extends string> =
	A extends ""
		? B extends "" ? "eq" : "lt"
		: B extends ""
			? "gt"
			: CompareLength<Tail<A>, Tail<B>>;

// Most significant digit first, so the first difference decides.
type CompareDigits<A extends string, B extends string> =
	A extends `${infer AH extends Digit}${infer AT}`
		? B extends `${infer BH extends Digit}${infer BT}`
			? AH extends BH
				? CompareDigits<AT, BT>
				: BH extends GreaterDigits[AH] ? "lt" : "gt"
			: "gt"
		: "eq";

type CompareMagnitude<A extends string, B extends string> =
	CompareLength<A, B> extends "eq" ? CompareDigits<A, B> : CompareLength<A, B>;

type CompareStrings<A extends string, B extends string> =
	A extends `-${infer AM}`
		? B extends `-${infer BM}` ? Flip<CompareMagnitude<AM, BM>> : "lt"
		: B extends `-${string}` ? "gt" : CompareMagnitude<A, B>;

/** Orders two numeric literals: `"lt" | "eq" | "gt"`. Negatives are supported. */
export type Compare<A extends number, B extends number> = CompareStrings<`${A}`, `${B}`>;

type IsInteger<N extends number> = IsDigits<`${N}` extends `-${infer M}` ? M : `${N}`>;

type Includes<N extends number, Min extends number, Max extends number> =
	IsInteger<N> extends true
		? Compare<N, Min> extends "lt"
			? false
			: Compare<N, Max> extends "gt" ? false : true
		: false;

/**
 * An integer literal constrained to `[Min, Max]` (both inclusive).
 *
 * With the literal supplied as `N` it resolves to `N` when in range and to
 * `never` when out of range or not an integer. Without it, i.e. `IntRange<1,
 * 500000>` used as a plain annotation, there is no literal to check, so it
 * degrades to `number`; use {@link InRange} to keep the check on a parameter.
 */
export type IntRange<Min extends number, Max extends number, N extends number = number> =
	number extends N
		? number
		: N extends N
			? Includes<N, Min, Max> extends true ? N : never
			: never;

/**
 * `IntRange` in argument position, where the literal has to be inferred:
 *
 * ```ts
 * const take = <N extends number>(limit: InRange<N, 1, 500000>) => limit;
 * take(500000); // ok
 * take(500001); // error: not assignable to parameter of type `never`
 * ```
 */
export type InRange<N extends number, Min extends number, Max extends number> =
	N & IntRange<Min, Max, N>;

// Helper to recursively build a union of numbers from 0 to N
export type Enumerate<N extends number, Acc extends number[] = []> =
	Acc["length"] extends N
	? Acc[number]
	: Enumerate<N, [...Acc, Acc["length"]]>;

/**
 * The enumerated form of a range: every member as a literal union, which keeps
 * autocompletion and narrowing. Limited to spans below ~1000 by the recursion
 * depth, anything wider has to use {@link IntRange}.
 */
export type IntUnion<F extends number, T extends number> =
	Exclude<Enumerate<T>, Enumerate<F>> | T;

export type ConfidenceRange = IntUnion<0, 100>;
