import type { IDataObject, ILoadOptionsFunctions, INodeListSearchResult } from 'n8n-workflow';
import { teamupRequest } from './utils';

function isoDate(offsetDays: number): string {
	const d = new Date();
	d.setDate(d.getDate() + offsetDays);
	return d.toISOString().slice(0, 10);
}

export async function searchSubcalendars(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<INodeListSearchResult> {
	const response = await teamupRequest<{ subcalendars?: IDataObject[] }>(this, {
		method: 'GET',
		path: '/subcalendars',
		qs: { filterBy: filter?.trim() || undefined, includeInactive: true },
	});

	return {
		results: (response.subcalendars ?? []).map((subcalendar) => ({
			name:
				subcalendar.active === false ? `${subcalendar.name} (inactive)` : String(subcalendar.name),
			value: String(subcalendar.id),
		})),
	};
}

/**
 * Without a search term, lists events from the last 7 to the next 30 days.
 * With a search term (at least 2 characters), searches events of the last and next year.
 */
export async function searchEvents(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<INodeListSearchResult> {
	const query = filter?.trim() ?? '';
	const qs: Record<string, string | number> =
		query.length >= 2
			? { query, startDate: isoDate(-365), endDate: isoDate(365), limit: 100 }
			: { startDate: isoDate(-7), endDate: isoDate(30) };

	const response = await teamupRequest<{ events?: IDataObject[] }>(this, {
		method: 'GET',
		path: '/events',
		qs,
	});

	return {
		results: (response.events ?? []).slice(0, 100).map((event) => {
			const start = String(event.start_dt ?? '')
				.slice(0, 16)
				.replace('T', ' ');
			return {
				name: `${event.title || '(no title)'} – ${start}`,
				value: String(event.id),
			};
		}),
	};
}
