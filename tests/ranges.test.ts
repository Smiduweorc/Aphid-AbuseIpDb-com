import assert from "node:assert/strict";
import { test } from "node:test";

import { getBlacklist, getCheck, getCheckBlock, getReports } from "../index.js";
import type { Cidr, IpV4 } from "../index.js";

const ip = "118.25.6.39" as IpV4;

// The bounds are enforced at compile time, so the assertions that matter are
// the `@ts-expect-error` lines: `npm run typecheck` fails if any of them stops
// being an error. At runtime this only checks the operation still builds.
test("out-of-range literals are rejected at compile time", () => {
	assert.ok(getCheck(ip, 365));
	// @ts-expect-error maxAgeInDays is capped at 365
	assert.ok(getCheck(ip, 366));

	assert.ok(getBlacklist({ limit: 500000, confidenceMinimum: 25 }));
	// @ts-expect-error limit is capped at 500000
	assert.ok(getBlacklist({ limit: 500001 }));
	// @ts-expect-error confidenceMinimum starts at 25
	assert.ok(getBlacklist({ confidenceMinimum: 24 }));

	assert.ok(getReports(ip, { page: 1, perPage: 100 }));
	// @ts-expect-error perPage is capped at 100
	assert.ok(getReports(ip, { perPage: 101 }));
	// @ts-expect-error page starts at 1
	assert.ok(getReports(ip, { page: 0 }));

	assert.ok(getCheckBlock("127.0.0.1/24" as Cidr, 1));
	// @ts-expect-error maxAgeInDays is capped at 365
	assert.ok(getCheckBlock("127.0.0.1/24" as Cidr, 400));
});

test("a runtime number is accepted without a literal to check", () => {
	const limit: number = Number("42");
	assert.ok(getBlacklist({ limit }));
});
