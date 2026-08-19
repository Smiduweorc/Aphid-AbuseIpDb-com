import type { Operation } from "../operation.js";
import type { ConfidenceRange, InRange } from "../types/ConfidenceTypes.js";
import type { IpV4, IpV6 } from "../types/IpAddressTypes.js";

/** One entry of the blacklist. */
export interface BlackListData {
	readonly ipAddress: IpV4 | IpV6;
	readonly abuseConfidenceScore: ConfidenceRange;
	readonly lastReportedAt: Date;
	/** Only present when the list was filtered by country. */
	readonly countryCode?: string;
}

export interface BlackListMetaData {
	readonly generatedAt: Date;
}

/** The blacklist as JSON: an envelope the caller keeps, since `meta` dates it. */
export interface BlackListResponseData {
	readonly meta: BlackListMetaData;
	readonly data: readonly BlackListData[];
}

/**
 * Filters accepted by {@link getBlacklist} and {@link getBlacklistPlaintext}.
 *
 * `confidenceMinimum`, `onlyCountries` and `exceptCountries` are subscriber
 * features; sending them on a free key is answered with a 402.
 */
export interface BlacklistQuery<
	L extends number = number,
	C extends number = number,
> {
	/**
	 * How many addresses to return, at most. Defaults to 10000 on the API side
	 * and is capped by the key's plan, so asking for 500000 on a free key is a
	 * 402 rather than a shorter list.
	 */
	readonly limit?: InRange<L, 1, 500000>;

	/** Lowest confidence score to include, 25 to 100. Defaults to 100. */
	readonly confidenceMinimum?: InRange<C, 25, 100>;

	/** ISO 3166 alpha-2 codes to restrict the list to. */
	readonly onlyCountries?: readonly string[];

	/** ISO 3166 alpha-2 codes to leave out of the list. */
	readonly exceptCountries?: readonly string[];

	/** Restrict to one address family. Both are returned when omitted. */
	readonly ipVersion?: 4 | 6;
}

/**
 * The country filters go over the wire as one comma-separated value, which is
 * not what `buildUrl` does with an array (it repeats the key), so they are
 * joined here.
 */
function countries(codes: readonly string[] | undefined): string | undefined {
	return codes && codes.length > 0 ? codes.join(",") : undefined;
}

function blacklistQuery<L extends number, C extends number>(
	query: BlacklistQuery<L, C>
): Record<string, string | number | undefined> {
	return {
		limit: query.limit,
		confidenceMinimum: query.confidenceMinimum,
		onlyCountries: countries(query.onlyCountries),
		exceptCountries: countries(query.exceptCountries),
		ipVersion: query.ipVersion,
	};
}

/**
 * `GET /blacklist`. The addresses AbuseIPDB is most confident about, as JSON.
 *
 * The `{ meta, data }` envelope is kept: `meta.generatedAt` is how a caller
 * knows how stale a cached copy of the list is.
 */
export function getBlacklist<L extends number, C extends number>(
	query: BlacklistQuery<L, C> = {}
): Operation<BlackListResponseData> {
	return {
		method: "GET",
		path: "/blacklist",
		headers: { accept: "application/json" },
		query: blacklistQuery(query),
	};
}

/**
 * `GET /blacklist?plaintext`. The same list as one address per line, which is
 * the shape a firewall or a `deny` file wants, split into an array here.
 *
 * `plaintext` is a presence flag on the API side, so it is only ever sent by
 * this function and never by {@link getBlacklist}.
 */
export function getBlacklistPlaintext<L extends number, C extends number>(
	query: BlacklistQuery<L, C> = {}
): Operation<readonly string[]> {
	return {
		method: "GET",
		path: "/blacklist",
		headers: { accept: "text/plain" },
		query: { ...blacklistQuery(query), plaintext: true },
		decode: async (response) => {
			const body = await response.text();
			return body
				.split("\n")
				.map((line) => line.trim())
				.filter((line) => line.length > 0);
		},
	};
}
