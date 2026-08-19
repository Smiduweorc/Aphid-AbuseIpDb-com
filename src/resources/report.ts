import { readJson } from "../decode.js";
import type { Operation } from "../operation.js";
import type { ConfidenceRange } from "../types/ConfidenceTypes.js";
import type { ReportCategory } from "../types/CategoryTypes.js";
import type { IpV4, IpV6 } from "../types/IpAddressTypes.js";

/** What the API answers with once a report is filed. */
export interface ReportResult {
	readonly ipAddress: IpV4 | IpV6;
	/** The address's score after the report was counted. */
	readonly abuseConfidenceScore: ConfidenceRange;
}

/** Fields accepted by {@link report}. */
export interface NewReport {
	/** The address being reported. Reporting your own address is rejected. */
	readonly ip: IpV4 | IpV6;

	/**
	 * At least one category. The API takes up to 30 report categories on one
	 * report, and rejects a report with none.
	 */
	readonly categories: readonly [ReportCategory, ...ReportCategory[]];

	/**
	 * What happened. Strip anything you would not publish: comments are shown
	 * on the address's public page, and the API redacts email addresses and
	 * the reporter's own addresses but nothing else.
	 */
	readonly comment?: string;

	/**
	 * When the abuse happened, defaulting to now on the API side. A `Date` is
	 * sent as ISO 8601; a string is sent as given, so it has to carry a UTC
	 * offset, AbuseIPDB rejects a timestamp without one.
	 */
	readonly timestamp?: Date | string;
}

/**
 * `POST /report`. Files one report against one address.
 *
 * Sent as `application/x-www-form-urlencoded` (via `URLSearchParams`, which
 * sets that content type itself) because that is the encoding the endpoint
 * documents; a JSON body is not accepted.
 *
 * This is not retried by `withRetry` and should not be: a report that was
 * saved and then lost its response has already been filed, and sending it
 * again files a duplicate.
 */
export function report(input: NewReport): Operation<ReportResult> {
	const body = new URLSearchParams({
		ip: input.ip,
		categories: input.categories.join(","),
	});

	if (input.comment !== undefined) {
		body.set("comment", input.comment);
	}
	if (input.timestamp !== undefined) {
		body.set(
			"timestamp",
			input.timestamp instanceof Date
				? input.timestamp.toISOString()
				: input.timestamp
		);
	}

	return {
		method: "POST",
		path: "/report",
		headers: { accept: "application/json" },
		body,
		decode: async (response) => {
			const { data } = await readJson<{ data: ReportResult }>(response);
			return data;
		},
	};
}
