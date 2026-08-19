import { readJson } from "../decode.js";
import type { Operation } from "../operation.js";
import type { ConfidenceRange, InRange } from "../types/ConfidenceTypes.js";
import type { IpV4, IpV6 } from "../types/IpAddressTypes.js";
import type { Report } from "./reports.js";

// `/check` and `/reports` return the same report shape, so it is defined once
// next to the endpoint that exists to return them and re-exported here.
export type { Report };

export interface CheckResponse {
	readonly ipAddress: IpV4 | IpV6;
	readonly isPublic: boolean;
	readonly ipVersion: 4 | 6;
	readonly isWhitelisted: boolean;
	readonly abuseConfidenceScore: ConfidenceRange;
	readonly countryCode: string; // other than political reason (joke), i ain't gonna maintain this list
	readonly countryName: string;
	// Null rather than absent when the API has nothing on file for the address,
	// which is what an unrouted or freshly allocated block looks like.
	readonly usageType: string | null;
	readonly isp: string | null;
	readonly domain: string | null;
	readonly hostnames: readonly string[];
	readonly isTor: boolean;
	readonly totalReports: number;
	readonly numDistinctUsers: number;
	/** `null` for an address that has never been reported. */
	readonly lastReportedAt: Date | null;
	/** Only returned when `verbose` was set, and capped at the newest reports. */
	readonly reports?: readonly Report[];
}

interface CheckEnvelope {
	readonly data: CheckResponse;
}

export const getCheck = <A extends number>(
	ip: IpV4 | IpV6,
	maxAgeInDays?: InRange<A, 1, 365>,
	verbose?: boolean
): Operation<CheckResponse> => {
	return {
		method: "GET",
		path: "/check",
		headers: { accept: "application/json" },
		// `buildUrl` appends these through `URLSearchParams`, which percent-encodes
		// reserved characters (like the colons in an IPv6 address) on its own, so
		// encoding `ip` again here would just double-encode it.
		query: {
			ipAddress: ip,
			maxAgeInDays: maxAgeInDays,
			// `verbose` is a presence flag on the API side: sending `verbose=false`
			// still turns it on, so a falsy value must be omitted rather than sent.
			verbose: verbose || undefined,
		},
		decode: async (response) => {
			const { data } = await readJson<CheckEnvelope>(response);
			return data;
		},
	}
}