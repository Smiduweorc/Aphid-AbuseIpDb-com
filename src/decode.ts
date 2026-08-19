import { DecodeError } from "./errors.js";

// Regex to identify ISO 8601 date strings
const isoDateFormat = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

function dateReviver(_key: string, value: unknown): unknown {
	if (typeof value === "string" && isoDateFormat.test(value)) {
		return new Date(value);
	}
	return value;
}

export const readJson = async <T>(response: Response): Promise<T> => {
	const body = await response.text();

	try {
		return JSON.parse(body, dateReviver) as T;
	} catch (cause) {
		throw new DecodeError({
			url: response.url,
			status: response.status,
			body,
			cause,
		});
	}
}
