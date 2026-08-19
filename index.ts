// Public surface. Everything reachable from here is API you have to keep;
// anything else under `src/` is internal and free to change.
//
// The `.js` extension is required: under `nodenext` resolution the specifier
// must match the emitted file, not the `.ts` source.

export { ApiClient } from "./src/client.js";
export type {
	ApiClientOptions,
	RequestOptions,
	Transport,
} from "./src/client.js";

export type {
	HttpMethod,
	Operation,
	QueryParams,
	QueryValue,
	RequestBody,
	RequestHeaders,
} from "./src/operation.js";

export { readJson } from "./src/decode.js";

export {
	ApiError,
	DecodeError,
	HttpError,
	TransportError,
} from "./src/errors.js";

// AbuseIPDB APIv2, one module per endpoint. Every function returns an
// `Operation`; hand it to `ApiClient.request` with a base URL of
// `https://api.abuseipdb.com/api/v2` and a `Key` header holding your API key.

export { getCheck } from "./src/resources/check.js";
export type { CheckResponse } from "./src/resources/check.js";

export { getReports } from "./src/resources/reports.js";
export type {
	Report,
	ReportsPage,
	ReportsQuery,
} from "./src/resources/reports.js";

export {
	getBlacklist,
	getBlacklistPlaintext,
} from "./src/resources/blacklist.js";
export type {
	BlackListData,
	BlackListMetaData,
	BlackListResponseData,
	BlacklistQuery,
} from "./src/resources/blacklist.js";

export { report } from "./src/resources/report.js";
export type { NewReport, ReportResult } from "./src/resources/report.js";

export { getCheckBlock } from "./src/resources/check-block.js";
export type {
	CheckBlockResponse,
	ReportedAddress,
} from "./src/resources/check-block.js";

export { bulkReport, toBulkReportCsv } from "./src/resources/bulk-report.js";
export type {
	BulkReportEntry,
	BulkReportResult,
	InvalidReport,
} from "./src/resources/bulk-report.js";

export { clearAddress } from "./src/resources/clear-address.js";
export type { ClearAddressResult } from "./src/resources/clear-address.js";

// Shared vocabulary the resources are typed with.

export { ReportCategory, reportCategoryTitles } from "./src/types/CategoryTypes.js";

export type {
	Compare,
	ConfidenceRange,
	Enumerate,
	InRange,
	IntRange,
	IntUnion,
} from "./src/types/ConfidenceTypes.js";

export { isCidr, isIpV4, isIpV6 } from "./src/types/IpAddressTypes.js";
export type { Cidr, IpV4, IpV6 } from "./src/types/IpAddressTypes.js";

// Example resource. Delete these two exports along with src/resources/example.ts.
export {
	createExample,
	getExample,
	listExamples,
} from "./src/resources/example.js";
export type {
	Example,
	ExampleListResponse,
	ListExamplesQuery,
	NewExample,
} from "./src/resources/example.js";
