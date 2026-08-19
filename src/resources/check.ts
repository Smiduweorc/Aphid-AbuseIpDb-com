import { readJson } from "../decode.js";
import type { Operation } from "../operation.js";
import type { ConfidenceRange, InRange } from "../types/ConfidenceTypes.js";
import type { IpV4, IpV6 } from "../types/IpAddressTypes.js";

export interface Report {
	reportedAt: Date;
	comment: string;
	categories: number[];
	reporterId: number;
	reporterCountryCode: string;
	reporterCountryName: string;
}

export interface CheckResponse {
	readonly ipAddress: IpV4 | IpV6;
	readonly isPublic: boolean;
	readonly ipVersion: 4 | 6;
	readonly isWhitelisted: boolean;
	readonly abuseConfidenceScore: ConfidenceRange;
	readonly countryCode: string; // other than political reason (joke), i ain't gonna maintain this list
	readonly countryName: string;
	readonly usageType: string;
	readonly isp: string;
	readonly domain: string;
	readonly hostnames: string[];
	readonly isTor: boolean;
	readonly totalReports: number;
	readonly numDistinctUsers: number;
	readonly lastReportedAt: Date;
	readonly reports: Report[];
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