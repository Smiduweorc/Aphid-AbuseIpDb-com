import { readJson } from "../decode.js";
import type { Operation } from "../operation.js";
import type { ReportCategory } from "../types/CategoryTypes.js";
import type { IpV4, IpV6 } from "../types/IpAddressTypes.js";

/** A row of the uploaded CSV the API refused, with the reason it refused it. */
export interface InvalidReport {
	readonly error: string;
	/** The row as it was sent, so it can be logged or corrected. */
	readonly input: string;
	/** 1-based row number in the uploaded file, counting the heading row. */
	readonly rowNumber: number;
}

/** What the API answers with after a bulk upload. */
export interface BulkReportResult {
	readonly savedReports: number;
	/** Empty when every row was accepted. Rejected rows are skipped, not fatal. */
	readonly invalidReports: readonly InvalidReport[];
}

/**
 * One row for {@link toBulkReportCsv}. Every column is required: unlike
 * `/report`, the bulk endpoint rejects a row with a missing field rather than
 * filling in a default.
 */
export interface BulkReportEntry {
	readonly ip: IpV4 | IpV6;
	readonly categories: readonly [ReportCategory, ...ReportCategory[]];
	/** Must be within the last two months, or the row is refused. */
	readonly timestamp: Date | string;
	/** Truncated by the API after 1024 characters. */
	readonly comment: string;
}

/**
 * Quotes a field the way the endpoint's parser reads it: enclosures are `"`
 * and the escape character is `\`, not a doubled quote, so a comment
 * containing either has to be escaped rather than duplicated.
 */
function csvField(value: string): string {
	const escaped = value.replace(/[\\"]/gu, "\\$&");
	return /[,"\r\n\\]/u.test(value) ? `"${escaped}"` : escaped;
}

/**
 * Renders rows as the CSV the endpoint expects, with the documented heading
 * row and ISO 8601 timestamps.
 *
 * The API caps an upload at 10000 lines including the heading and at 8 MB,
 * neither of which is enforced here; split the rows if you have more.
 */
export function toBulkReportCsv(
	entries: readonly BulkReportEntry[]
): string {
	const rows = entries.map((entry) => {
		const timestamp =
			entry.timestamp instanceof Date
				? entry.timestamp.toISOString()
				: entry.timestamp;

		return [
			csvField(entry.ip),
			csvField(entry.categories.join(",")),
			csvField(timestamp),
			csvField(entry.comment),
		].join(",");
	});

	return ["IP,Categories,ReportDate,Comment", ...rows].join("\n");
}

/**
 * `POST /bulk-report`. Files many reports from one CSV file.
 *
 * Takes the CSV as text, or as a `Blob`/`File` when you already have one (a
 * `fs.openAsBlob()` handle, say), and sends it as the `csv` part of a
 * multipart body. `FormData` sets its own `content-type` with the boundary,
 * so none is set here.
 *
 * A partly bad file still succeeds: rows that failed come back in
 * `invalidReports` rather than as an `HttpError`, so check that field.
 */
export function bulkReport(csv: string | Blob): Operation<BulkReportResult> {
	const body = new FormData();
	const file =
		typeof csv === "string" ? new Blob([csv], { type: "text/csv" }) : csv;

	body.append("csv", file, "report.csv");

	return {
		method: "POST",
		path: "/bulk-report",
		headers: { accept: "application/json" },
		body,
		decode: async (response) => {
			const { data } = await readJson<{ data: BulkReportResult }>(response);
			return data;
		},
	};
}
