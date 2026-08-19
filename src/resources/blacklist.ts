import { readJson } from "../decode.js";
import type { Operation } from "../operation.js";
import type { ConfidenceRange } from "../types/ConfidenceTypes.js";
import type { IpV4, IpV6 } from "../types/IpAddressTypes.js";

export interface BlackListMetaData {
	readonly generatedAt: Date;
}

export interface BlackListData {
	readonly ipAddress: IpV4 | IpV6;
	readonly abuseConfidenceScore: ConfidenceRange;
	readonly lastReportedAt: Date;
}

export interface BlackListResponseData {
	readonly meta: BlackListMetaData;
	readonly data: BlackListData[];
}

export const GetBlacklist = (): Operation<BlackListResponseData> => {
	return {
		method: "GET",
		path: "/blacklist",
		decode: async  (response) => {
			const { data } = await readJson<{ data: BlackListResponseData }>(response);
			return data;
		}
	}
}