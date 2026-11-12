import {
	NodeApiError,
	NodeOperationError,
	type IDataObject,
	type IExecuteFunctions,
	type IHttpRequestMethods,
	type IHttpRequestOptions,
	type ILoadOptionsFunctions,
	type IPollFunctions,
	type JsonObject,
} from 'n8n-workflow';

export const USER_AGENT = 'n8n-nodes-teamupcalendar';
export const BASE_URL = 'https://api.teamup.com';
export const CREDENTIAL_NAME = 'teamupApi';

/** Node parameter that overrides the calendar key from the credential. */
export const CALENDAR_OVERRIDE_PARAMETER = 'calendarKeyOverride';

export interface TeamupSubcalendar {
	id: string | number;
	name: string;
	color: number;
	active: boolean;
	overlap: boolean;
	type: number;
	[key: string]: unknown;
}

export interface TeamupEvent {
	id: string;
	title: string;
	start_dt: string;
	end_dt: string;
	subcalendar_id?: number;
	[key: string]: unknown;
}

export type TeamupContext = IExecuteFunctions | ILoadOptionsFunctions | IPollFunctions;

export function getErrorMessage(error: unknown): string {
	if (error instanceof Error) return error.message;
	return String(error);
}

/** Node version 2 changed date handling and other behavior. Version 1 keeps the old behavior. */
export function isVersion1(context: TeamupContext): boolean {
	return context.getNode().typeVersion < 2;
}

/**
 * Formats a date for Teamup.
 *
 * Version 2: time zone information is kept, a trailing "Z" becomes "+00:00".
 * Version 1 (`legacy`): a trailing "Z" is removed, so Teamup reads UTC times as calendar time.
 * Dates without a time zone are interpreted by Teamup in the calendar's time zone.
 */
export function formatDateTime(dateStr: string, legacy = false): string {
	if (!dateStr?.trim()) return dateStr;

	if (dateStr.includes('T') && dateStr.includes('-')) {
		if (legacy) {
			return dateStr.replace(/\.\d{3}Z?$/, '').replace('Z', '');
		}
		return dateStr
			.trim()
			.replace(/\.\d+(?=Z|[+-]\d{2}:?\d{2}$|$)/, '')
			.replace(/Z$/, '+00:00');
	}

	const match = dateStr.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})(?:[ T](\d{1,2}):(\d{2}))?$/);
	if (match) {
		const [, day, month, year, hour = '00', minute = '00'] = match;
		return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:00`;
	}

	const d = new Date(dateStr);
	if (!isNaN(d.getTime())) {
		return legacy ? d.toISOString().slice(0, 19) : `${d.toISOString().slice(0, 19)}+00:00`;
	}

	throw new Error(`Unsupported date format: ${dateStr}`);
}

/** Today's date (YYYY-MM-DD) in the given IANA time zone. */
export function todayInTimezone(timezone: string): string {
	try {
		return new Intl.DateTimeFormat('en-CA', {
			timeZone: timezone,
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
		}).format(new Date());
	} catch {
		return new Date().toISOString().slice(0, 10);
	}
}

export function formatRrule(rruleInput: string): string {
	return (rruleInput ?? '')
		.trim()
		.replace(/^rrule:/i, '')
		.trim();
}

/** Removes empty strings, null and undefined so they are not sent to the API. */
export function compact(fields: IDataObject): IDataObject {
	const result: IDataObject = {};
	for (const [key, value] of Object.entries(fields ?? {})) {
		if (value === '' || value === undefined || value === null) continue;
		result[key] = value;
	}
	return result;
}

export function parseJsonParameter(
	context: TeamupContext,
	value: unknown,
	parameterName: string,
	itemIndex?: number,
): IDataObject {
	if (value === undefined || value === null || value === '') return {};
	if (typeof value === 'object') return value as IDataObject;
	try {
		return JSON.parse(String(value)) as IDataObject;
	} catch {
		throw new NodeOperationError(
			context.getNode(),
			`Parameter "${parameterName}" must be valid JSON`,
			{
				itemIndex,
			},
		);
	}
}

type QueryValue = string | number | boolean | Array<string | number>;

function buildQueryString(params: Record<string, QueryValue | undefined>): string {
	const parts: string[] = [];
	for (const [key, value] of Object.entries(params)) {
		if (value === undefined || value === null || value === '') continue;
		if (Array.isArray(value)) {
			for (const v of value) {
				parts.push(`${key}[]=${encodeURIComponent(String(v))}`);
			}
		} else {
			parts.push(`${key}=${encodeURIComponent(String(value))}`);
		}
	}
	return parts.join('&');
}

function getCalendarOverride(context: TeamupContext, itemIndex: number): string {
	try {
		let value: unknown;
		if ('getCurrentNodeParameter' in context) {
			value = context.getCurrentNodeParameter(CALENDAR_OVERRIDE_PARAMETER);
		} else if ('getInputData' in context) {
			value = context.getNodeParameter(CALENDAR_OVERRIDE_PARAMETER, itemIndex, '');
		} else {
			value = context.getNodeParameter(CALENDAR_OVERRIDE_PARAMETER, '');
		}
		return typeof value === 'string' ? value.trim() : '';
	} catch {
		return '';
	}
}

function stripHtml(text: string): string {
	return text
		.replace(/<[^>]*>/g, '')
		.replace(/\s+/g, ' ')
		.trim();
}

/** Teamup error bodies look like {"error": {"id", "title", "message"}}. */
function findTeamupError(
	error: unknown,
): { id?: string; title?: string; message?: string } | undefined {
	const candidates: unknown[] = [];
	const e = error as IDataObject & {
		response?: { data?: unknown; body?: unknown };
		cause?: { response?: { data?: unknown; body?: unknown } };
		context?: { data?: unknown };
	};
	candidates.push(
		e?.response?.data,
		e?.response?.body,
		e?.cause?.response?.data,
		e?.cause?.response?.body,
		e?.context?.data,
		e?.error,
		e?.description,
	);

	for (let candidate of candidates) {
		if (typeof candidate === 'string') {
			try {
				candidate = JSON.parse(candidate);
			} catch {
				continue;
			}
		}
		const body = candidate as { error?: { id?: string; title?: string; message?: unknown } };
		if (body && typeof body === 'object' && body.error && typeof body.error === 'object') {
			const rawMessage = body.error.message;
			const message = Array.isArray(rawMessage)
				? rawMessage.map((m) => stripHtml(String(m))).join(' ')
				: rawMessage !== undefined
					? stripHtml(String(rawMessage))
					: undefined;
			return { id: body.error.id, title: body.error.title, message };
		}
	}
	return undefined;
}

export function toNodeApiError(
	context: TeamupContext,
	error: unknown,
	itemIndex?: number,
): NodeApiError {
	const teamupError = findTeamupError(error);
	const options: { itemIndex?: number; message?: string; description?: string } = {};
	if (itemIndex !== undefined) options.itemIndex = itemIndex;
	if (teamupError?.title || teamupError?.message) {
		options.message = teamupError.title ?? teamupError.message;
		options.description = [
			teamupError.message,
			teamupError.id ? `(Teamup error: ${teamupError.id})` : '',
		]
			.filter(Boolean)
			.join(' ');
	}

	if (error instanceof NodeApiError) {
		if (itemIndex !== undefined) error.context.itemIndex = itemIndex;
		if (options.message) error.message = options.message;
		if (options.description) error.description = options.description;
		return error;
	}
	const apiError = new NodeApiError(context.getNode(), error as JsonObject, options);
	// NodeApiError prefers the raw response message, which Teamup may send as an HTML array.
	if (options.description) apiError.description = options.description;
	return apiError;
}

export interface TeamupRequestOptions {
	method: IHttpRequestMethods;
	path: string;
	qs?: Record<string, QueryValue | undefined>;
	body?: unknown;
	/** Request without the calendar key prefix (e.g. /check-access). */
	global?: boolean;
	itemIndex?: number;
	/** Extra options passed to the HTTP helper. */
	requestOptions?: Partial<IHttpRequestOptions>;
}

export async function teamupRequest<T = IDataObject>(
	context: TeamupContext,
	options: TeamupRequestOptions,
): Promise<T> {
	const itemIndex = options.itemIndex ?? 0;
	let prefix = '';
	if (!options.global) {
		const credentials = await context.getCredentials(CREDENTIAL_NAME, itemIndex);
		const calendarKey =
			getCalendarOverride(context, itemIndex) || (credentials.calendarKey as string);
		prefix = `/${encodeURIComponent(calendarKey)}`;
	}
	const qs = options.qs ? buildQueryString(options.qs) : '';
	const url = `${BASE_URL}${prefix}${options.path}${qs ? `?${qs}` : ''}`;

	const request: IHttpRequestOptions = {
		method: options.method,
		url,
		headers: {
			Accept: 'application/json',
			...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
			'User-Agent': USER_AGENT,
		},
		json: true,
		...options.requestOptions,
	};
	if (options.body !== undefined) {
		request.body = options.body as IDataObject;
	}

	try {
		return (await context.helpers.httpRequestWithAuthentication.call(
			context,
			CREDENTIAL_NAME,
			request,
		)) as T;
	} catch (error) {
		throw toNodeApiError(context, error, options.itemIndex);
	}
}

/** Fetches all pages of an offset/limit paginated collection. */
export async function teamupRequestAllItems(
	context: TeamupContext,
	options: TeamupRequestOptions,
	propertyName: string,
	maxItems?: number,
	pageSize = 100,
): Promise<IDataObject[]> {
	const results: IDataObject[] = [];
	let offset = 0;
	for (;;) {
		const limit = maxItems !== undefined ? Math.min(pageSize, maxItems - results.length) : pageSize;
		if (limit <= 0) break;
		const response = await teamupRequest<IDataObject>(context, {
			...options,
			qs: { ...(options.qs ?? {}), offset, limit },
		});
		const page = (response?.[propertyName] as IDataObject[] | undefined) ?? [];
		results.push(...page);
		if (page.length < limit) break;
		offset += page.length;
	}
	return maxItems !== undefined ? results.slice(0, maxItems) : results;
}

/**
 * Reads the ID from a resource locator parameter ({ mode, value }).
 * Plain strings (from expressions or older workflows) are accepted as well.
 */
export function getResourceId(
	context: IExecuteFunctions,
	parameterName: string,
	itemIndex: number,
): string {
	const value = context.getNodeParameter(parameterName, itemIndex, '', {
		extractValue: true,
	}) as unknown;
	if (value && typeof value === 'object' && 'value' in value) {
		return String((value as { value: unknown }).value ?? '').trim();
	}
	return String(value ?? '').trim();
}
