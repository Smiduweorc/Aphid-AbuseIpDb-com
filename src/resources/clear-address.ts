import { readJson } from "../decode.js";
import type { Operation } from "../operation.js";
import type { IpV4, IpV6 } from "../types/IpAddressTypes.js";

/** What the API answers with after clearing an address. */
export interface ClearAddressResult {
	readonly numReportsDeleted: number;
}

/**
 * `DELETE /clear-address`. Removes your own reports against one address.
 *
 * It only clears reports filed by the key doing the asking, so it undoes a
 * mistake of your own rather than whitelisting an address. The response counts
 * what was deleted, which is `0` when there was nothing of yours to delete.
 */
export function clearAddress(ip: IpV4 | IpV6): Operation<ClearAddressResult> {
	return {
		method: "DELETE",
		path: "/clear-address",
		headers: { accept: "application/json" },
		query: { ipAddress: ip },
		decode: async (response) => {
			const { data } = await readJson<{ data: ClearAddressResult }>(response);
			return data;
		},
	};
}
