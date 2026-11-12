import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import {
	formatDateTime,
	teamupRequest,
	todayInTimezone,
	getResourceId,
	isVersion1,
} from '../../utils';
import { getEventOptions, toEventItems } from './helpers';

export async function getMany(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const subcalendarId = getResourceId(context, 'subcalendarId', itemIndex);
	const startDateStr = String(context.getNodeParameter('startDate', itemIndex, '') ?? '').trim();
	const endDateStr = String(context.getNodeParameter('endDate', itemIndex, '') ?? '').trim();
	const returnAll = context.getNodeParameter('returnAll', itemIndex, false) as boolean;
	const limit = context.getNodeParameter('limit', itemIndex, 50) as number;
	const options = getEventOptions(context, itemIndex);

	const qs: Record<string, string | string[]> = {};

	// Same as 0.4.2: without a start date Teamup gets today's date; without an end date Teamup
	// returns the events of the start date only.
	qs.startDate = startDateStr
		? formatDateTime(startDateStr, isVersion1(context))
		: todayInTimezone(context.getTimezone());
	if (endDateStr) {
		qs.endDate = formatDateTime(endDateStr, isVersion1(context));
	}

	if (subcalendarId) {
		qs.subcalendarId = [String(subcalendarId)];
	}
	if (options.tz) qs.tz = options.tz as string;
	if (options.format) qs.format = options.format as string;

	const response = await teamupRequest<{ events: IDataObject[] }>(context, {
		method: 'GET',
		path: '/events',
		qs,
		itemIndex,
	});

	let events = response.events || [];
	if (!returnAll && events.length > limit) {
		events = events.slice(0, limit);
	}

	return toEventItems(context, itemIndex, events);
}
