import { readJson } from "../decode.js";
import type { Operation } from "../operation.js";
import type { ConfidenceRange, InRange } from "../types/ConfidenceTypes.js";
import type { Cidr, IpV4, IpV6 } from "../types/IpAddressTypes.js";

/** One reported address inside the checked network. */
export interface ReportedAddress {
	readonly ipAddress: IpV4 | IpV6;
	readonly numReports: number;
	readonly mostRecentReport: Date;
	readonly abuseConfidenceScore: ConfidenceRange;
	readonly countryCode: string | null;
}

/** What `/check-block` says about a network. */
export interface CheckBlockResponse {
	readonly networkAddress: IpV4 | IpV6;
	readonly netmask: string;
	readonly minAddress: IpV4 | IpV6;
	readonly maxAddress: IpV4 | IpV6;
	readonly numPossibleHosts: number;
	/** How the block is allocated, e.g. `Internet` or `Private-Use Networks`. */
	readonly addressSpaceDesc: string;
	/** Only the addresses with reports, not every address in the block. */
	readonly reportedAddress: readonly ReportedAddress[];
}

/**
 * `GET /check-block`. Every reported address inside a network.
 *
 * How large a `network` and how long a `maxAgeInDays` are accepted depends on
 * the key's plan: /24 and 30 days on a free key, /20 and 60 days on Basic,
 * /16 and 365 days on Premium. Asking for more is a 402, not a trimmed
 * answer, so the bounds here are the widest any plan allows.
 */
export function getCheckBlock<A extends number>(
	network: Cidr,
	maxAgeInDays?: InRange<A, 1, 365>
): Operation<CheckBlockResponse> {
	return {
		method: "GET",
		path: "/check-block",
		headers: { accept: "application/json" },
		query: {
			network,
			maxAgeInDays,
		},
		decode: async (response) => {
			const { data } = await readJson<{ data: CheckBlockResponse }>(response);
			return data;
		},
	};
}
