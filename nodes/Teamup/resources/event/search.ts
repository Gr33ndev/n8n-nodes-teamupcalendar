import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { formatDateTime, teamupRequestAllItems, isVersion1 } from '../../utils';
import { getEventOptions, toEventItems } from './helpers';

export async function search(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const query = context.getNodeParameter('eventSearchQuery', itemIndex) as string;
	const subcalendarIds = (
		context.getNodeParameter('eventSearchSubcalendarIds', itemIndex, []) as string[]
	).map((id) => parseInt(id, 10));
	const startDate = context.getNodeParameter('eventSearchStartDate', itemIndex, '') as string;
	const returnAll = context.getNodeParameter('returnAll', itemIndex, false) as boolean;
	const limit = context.getNodeParameter('limit', itemIndex, 50) as number;
	const options = getEventOptions(context, itemIndex);

	const qs: Record<string, string | number | number[]> = { query };
	if (startDate) qs.startDate = formatDateTime(startDate, isVersion1(context));
	if (options.endDate) qs.endDate = formatDateTime(options.endDate as string, isVersion1(context));
	if (subcalendarIds.length > 0) qs.subcalendarId = subcalendarIds;
	if (options.tz) qs.tz = options.tz as string;
	if (options.format) qs.format = options.format as string;

	const events = await teamupRequestAllItems(
		context,
		{ method: 'GET', path: '/events', qs, itemIndex },
		'events',
		returnAll ? undefined : limit,
	);

	return toEventItems(context, itemIndex, events);
}
