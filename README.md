This is a demo repo meant to demonstrate how to use aphid for use cases where you have to write the code by hand.

If you want a proper wrapper, you should look into making your own or taking a look at [abuseipdb-client by athur-melo](https://www.npmjs.com/package/abuseipdb-client)

## Usage

Every endpoint of AbuseIPDB APIv2 is a function returning an `Operation`, which
builds no request and performs no I/O until an `ApiClient` is handed it. Point
the client at the v2 base URL and put your API key in the `Key` header (this
API does not use `Authorization: Bearer`).

```ts
import {
	ApiClient,
	bulkReport,
	clearAddress,
	getBlacklist,
	getBlacklistPlaintext,
	getCheck,
	getCheckBlock,
	getReports,
	report,
	ReportCategory,
	toBulkReportCsv,
} from "@Smiduweorc/AphidTemplate";
import { withRetry } from "@Smiduweorc/AphidTemplate/transport";
import { isCidr, isIpV4 } from "@Smiduweorc/AphidTemplate";

const api = new ApiClient({
	baseUrl: "https://api.abuseipdb.com/api/v2",
	headers: { Key: process.env.ABUSEIPDB_KEY!, accept: "application/json" },
	// Optional. Backs off on 429 and 5xx, and leaves POSTs alone.
	transport: withRetry(fetch),
});

const address = "118.25.6.39";
if (!isIpV4(address)) throw new Error("not an address");

// GET /check
const check = await api.request(getCheck(address, 90, true));

// GET /reports
const page = await api.request(getReports(address, { page: 1, perPage: 100 }));

// GET /blacklist, as JSON or as one address per line
const list = await api.request(getBlacklist({ limit: 1000, confidenceMinimum: 90 }));
const lines = await api.request(getBlacklistPlaintext({ limit: 1000 }));

// POST /report
await api.request(
	report({
		ip: address,
		categories: [ReportCategory.Ssh, ReportCategory.BruteForce],
		comment: "Failed SSH logins",
	})
);

// GET /check-block
const network = "127.0.0.1/24";
if (isCidr(network)) {
	const block = await api.request(getCheckBlock(network, 30));
}

// POST /bulk-report
await api.request(
	bulkReport(
		toBulkReportCsv([
			{
				ip: address,
				categories: [ReportCategory.PortScan],
				timestamp: new Date(),
				comment: "Port scan",
			},
		])
	)
);

// DELETE /clear-address, which removes your own reports only
await api.request(clearAddress(address));
```

Numeric parameters with documented bounds (`maxAgeInDays`, `limit`,
`confidenceMinimum`, `page`, `perPage`) are checked at compile time when you
pass a literal: `getCheck(ip, 400)` does not compile. A value whose type is
plain `number` is passed through unchecked, since there is no literal to
compare.

Failures arrive as `TransportError`, `HttpError` or `DecodeError`, all of which
extend `ApiError`. AbuseIPDB signals a plan limit (a network wider than your
tier allows, a subscriber-only blacklist filter) as an `HttpError` with status
402, and a rate limit as a 429 carrying `Retry-After`.
