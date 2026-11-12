import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { teamupRequest, teamupRequestAllItems, isVersion1 } from '../../utils';

export async function getMany(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const filters = context.getNodeParameter('subcalendarFilters', itemIndex, {}) as IDataObject;
	const qs: Record<string, string | boolean> = {};
	if (filters.includeInactive) qs.includeInactive = true;
	if (filters.filterBy) qs.filterBy = filters.filterBy as string;
	if (filters.keyId) qs.keyId = filters.keyId as string;

	// Version 1 always returns all subcalendars.
	const returnAll =
		isVersion1(context) || (context.getNodeParameter('returnAll', itemIndex, false) as boolean);

	let subcalendars: IDataObject[];
	if (returnAll) {
		const response = await teamupRequest<{ subcalendars: IDataObject[] }>(context, {
			method: 'GET',
			path: '/subcalendars',
			qs,
			itemIndex,
		});
		subcalendars = response.subcalendars || [];
	} else {
		const limit = context.getNodeParameter('limit', itemIndex, 50) as number;
		subcalendars = await teamupRequestAllItems(
			context,
			{ method: 'GET', path: '/subcalendars', qs, itemIndex },
			'subcalendars',
			limit,
		);
	}

	return subcalendars.map((subcalendar) => ({
		json: subcalendar,
		pairedItem: { item: itemIndex },
	}));
}
