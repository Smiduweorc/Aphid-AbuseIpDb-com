import assert from "node:assert/strict";
import { test } from "node:test";

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
} from "../index.js";
import type { Transport } from "../index.js";
import type { Cidr, IpV4 } from "../index.js";

const BASE = "https://api.abuseipdb.com/api/v2";

const ip = "118.25.6.39" as IpV4;

/** Captures the request an operation produces and answers with `body`. */
function record(body: unknown, contentType = "application/json"): {
	transport: Transport;
	sent: () => Request;
} {
	let seen: Request | undefined;
	const transport: Transport = async (request) => {
		seen = request;
		return new Response(
			typeof body === "string" ? body : JSON.stringify(body),
			{ headers: { "content-type": contentType } }
		);
	};
	return {
		transport,
		sent: () => {
			assert.ok(seen, "no request was sent");
			return seen;
		},
	};
}

test("check sends the address and unwraps the envelope", async () => {
	const { transport, sent } = record({
		data: { ipAddress: ip, abuseConfidenceScore: 100, lastReportedAt: null },
	});
	const api = new ApiClient({ baseUrl: BASE, transport });

	const result = await api.request(getCheck(ip, 90, true));

	const url = new URL(sent().url);
	assert.equal(url.pathname, "/api/v2/check");
	assert.equal(url.searchParams.get("ipAddress"), ip);
	assert.equal(url.searchParams.get("maxAgeInDays"), "90");
	assert.equal(url.searchParams.get("verbose"), "true");
	assert.equal(result.abuseConfidenceScore, 100);
	assert.equal(result.lastReportedAt, null);
});

test("check omits verbose when it is false", async () => {
	const { transport, sent } = record({ data: {} });
	const api = new ApiClient({ baseUrl: BASE, transport });

	await api.request(getCheck(ip, 30, false));

	assert.equal(new URL(sent().url).searchParams.has("verbose"), false);
});

test("reports paginates and unwraps the envelope", async () => {
	const { transport, sent } = record({
		data: { total: 2, page: 2, count: 1, perPage: 1, results: [] },
	});
	const api = new ApiClient({ baseUrl: BASE, transport });

	const page = await api.request(getReports(ip, { page: 2, perPage: 1 }));

	const url = new URL(sent().url);
	assert.equal(url.pathname, "/api/v2/reports");
	assert.equal(url.searchParams.get("page"), "2");
	assert.equal(url.searchParams.get("perPage"), "1");
	assert.equal(page.total, 2);
});

test("blacklist keeps the meta envelope and never sends plaintext", async () => {
	const { transport, sent } = record({
		meta: { generatedAt: "2026-08-19T00:00:00+00:00" },
		data: [{ ipAddress: ip, abuseConfidenceScore: 100 }],
	});
	const api = new ApiClient({ baseUrl: BASE, transport });

	const list = await api.request(
		getBlacklist({
			limit: 5,
			confidenceMinimum: 90,
			onlyCountries: ["US", "CN"],
			ipVersion: 4,
		})
	);

	const url = new URL(sent().url);
	assert.equal(url.searchParams.has("plaintext"), false);
	assert.equal(url.searchParams.get("limit"), "5");
	assert.equal(url.searchParams.get("confidenceMinimum"), "90");
	assert.equal(url.searchParams.get("onlyCountries"), "US,CN");
	assert.equal(url.searchParams.get("ipVersion"), "4");
	assert.ok(list.meta.generatedAt instanceof Date);
	assert.equal(list.data.length, 1);
});

test("blacklist plaintext splits lines and drops blanks", async () => {
	const { transport, sent } = record("1.2.3.4\n5.6.7.8\n\n", "text/plain");
	const api = new ApiClient({ baseUrl: BASE, transport });

	const addresses = await api.request(getBlacklistPlaintext());

	assert.equal(new URL(sent().url).searchParams.get("plaintext"), "true");
	assert.deepEqual(addresses, ["1.2.3.4", "5.6.7.8"]);
});

test("report posts a form-encoded body", async () => {
	const { transport, sent } = record({
		data: { ipAddress: ip, abuseConfidenceScore: 52 },
	});
	const api = new ApiClient({ baseUrl: BASE, transport });
	const when = new Date("2026-08-19T10:00:37.000Z");

	const result = await api.request(
		report({
			ip,
			categories: [ReportCategory.Ssh, ReportCategory.BruteForce],
			comment: "SSH brute force",
			timestamp: when,
		})
	);

	const request = sent();
	assert.equal(request.method, "POST");
	assert.match(
		request.headers.get("content-type") ?? "",
		/application\/x-www-form-urlencoded/u
	);

	const form = new URLSearchParams(await request.text());
	assert.equal(form.get("ip"), ip);
	assert.equal(form.get("categories"), "22,18");
	assert.equal(form.get("comment"), "SSH brute force");
	assert.equal(form.get("timestamp"), when.toISOString());
	assert.equal(result.abuseConfidenceScore, 52);
});

test("report omits an absent comment and timestamp", async () => {
	const { transport, sent } = record({ data: {} });
	const api = new ApiClient({ baseUrl: BASE, transport });

	await api.request(report({ ip, categories: [ReportCategory.PortScan] }));

	const form = new URLSearchParams(await sent().text());
	assert.deepEqual([...form.keys()], ["ip", "categories"]);
});

test("check-block sends the network", async () => {
	const { transport, sent } = record({ data: { reportedAddress: [] } });
	const api = new ApiClient({ baseUrl: BASE, transport });

	const block = await api.request(
		getCheckBlock("127.0.0.1/24" as Cidr, 15)
	);

	const url = new URL(sent().url);
	assert.equal(url.pathname, "/api/v2/check-block");
	assert.equal(url.searchParams.get("network"), "127.0.0.1/24");
	assert.equal(url.searchParams.get("maxAgeInDays"), "15");
	assert.deepEqual(block.reportedAddress, []);
});

test("bulk-report uploads the csv as a multipart file", async () => {
	const { transport, sent } = record({
		data: { savedReports: 1, invalidReports: [] },
	});
	const api = new ApiClient({ baseUrl: BASE, transport });

	const csv = toBulkReportCsv([
		{
			ip,
			categories: [ReportCategory.Ssh, ReportCategory.BruteForce],
			timestamp: new Date("2026-08-19T10:00:37.000Z"),
			comment: "brute force, with a \"quote\"",
		},
	]);

	const result = await api.request(bulkReport(csv));

	const request = sent();
	assert.equal(request.method, "POST");
	assert.match(request.headers.get("content-type") ?? "", /multipart\/form-data/u);

	const uploaded = (await request.formData()).get("csv");
	assert.ok(uploaded instanceof File);
	assert.equal(await uploaded.text(), csv);
	assert.equal(result.savedReports, 1);
});

test("the bulk csv quotes the fields the parser needs quoted", () => {
	const csv = toBulkReportCsv([
		{
			ip,
			categories: [ReportCategory.Ssh, ReportCategory.BruteForce],
			timestamp: "2026-08-19T10:00:37+00:00",
			comment: "a, b \"c\" d",
		},
	]);

	assert.deepEqual(csv.split("\n"), [
		"IP,Categories,ReportDate,Comment",
		"118.25.6.39,\"22,18\",2026-08-19T10:00:37+00:00,\"a, b \\\"c\\\" d\"",
	]);
});

test("clear-address deletes by address", async () => {
	const { transport, sent } = record({ data: { numReportsDeleted: 3 } });
	const api = new ApiClient({ baseUrl: BASE, transport });

	const result = await api.request(clearAddress(ip));

	const request = sent();
	assert.equal(request.method, "DELETE");
	assert.equal(new URL(request.url).searchParams.get("ipAddress"), ip);
	assert.equal(result.numReportsDeleted, 3);
});
