import { readJson } from "../decode.js";
import type { Operation } from "../operation.js";
import type { InRange } from "../types/ConfidenceTypes.js";
import type { ReportCategory } from "../types/CategoryTypes.js";
import type { IpV4, IpV6 } from "../types/IpAddressTypes.js";

/**
 * One report as the API returns it, from either `/reports` or the `reports`
 * array of a verbose `/check`.
 */
export interface Report {
	readonly reportedAt: Date;
	readonly comment: string;
	readonly categories: readonly ReportCategory[];
	readonly reporterId: number;
	readonly reporterCountryCode: string;
	readonly reporterCountryName: string;
}

/** One page of reports, with the API's own pagination fields. */
export interface ReportsPage {
	/** Reports matching the query across every page. */
	readonly total: number;
	readonly page: number;
	/** Reports on this page, which is `perPage` except on the last one. */
	readonly count: number;
	readonly perPage: number;
	readonly lastPage: number;
	/** Absolute URL of the next page, or `null` on the last page. */
	readonly nextPageUrl: string | null;
	/** Absolute URL of the previous page, or `null` on the first page. */
	readonly previousPageUrl: string | null;
	readonly results: readonly Report[];
}

/** Filters accepted by {@link getReports}. */
export interface ReportsQuery<
	A extends number = number,
	P extends number = number,
	R extends number = number,
> {
	/** How far back to look, 1 to 365 days. Defaults to 30. */
	readonly maxAgeInDays?: InRange<A, 1, 365>;

	/**
	 * 1-based page number. Defaults to 1. The API documents no upper bound, so
	 * the only thing checked here is that the page is a positive integer.
	 */
	readonly page?: InRange<P, 1, 2147483647>;

	/** Reports per page, 1 to 100. Defaults to 25. */
	readonly perPage?: InRange<R, 1, 100>;
}

/**
 * `GET /reports`. The reports filed against one address, paginated.
 *
 * This is the endpoint to use over a verbose `/check` when you want more than
 * the newest handful of reports, since `/check` caps its `reports` array.
 */
export function getReports<
	A extends number,
	P extends number,
	R extends number,
>(ip: IpV4 | IpV6, query: ReportsQuery<A, P, R> = {}): Operation<ReportsPage> {
	return {
		method: "GET",
		path: "/reports",
		headers: { accept: "application/json" },
		query: {
			ipAddress: ip,
			maxAgeInDays: query.maxAgeInDays,
			page: query.page,
			perPage: query.perPage,
		},
		decode: async (response) => {
			const { data } = await readJson<{ data: ReportsPage }>(response);
			return data;
		},
	};
}
