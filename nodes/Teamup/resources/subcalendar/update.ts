import {
	NodeOperationError,
	type IDataObject,
	type IExecuteFunctions,
	type INodeExecutionData,
} from 'n8n-workflow';
import { teamupRequest, type TeamupSubcalendar, getResourceId } from '../../utils';

export async function update(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData> {
	const subcalendarId = getResourceId(context, 'subcalendarId', itemIndex);
	if (!subcalendarId) {
		throw new NodeOperationError(context.getNode(), 'Subcalendar ID is required for update', {
			itemIndex,
		});
	}

	const updateFields = context.getNodeParameter(
		'subcalendarUpdateFields',
		itemIndex,
		{},
	) as IDataObject;

	const existing = await teamupRequest<{ subcalendar: TeamupSubcalendar }>(context, {
		method: 'GET',
		path: `/subcalendars/${subcalendarId}`,
		itemIndex,
	});
	if (!existing?.subcalendar?.id) {
		throw new NodeOperationError(context.getNode(), `Subcalendar ${subcalendarId} not found`, {
			itemIndex,
		});
	}

	const response = await teamupRequest<{ subcalendar: IDataObject }>(context, {
		method: 'PUT',
		path: `/subcalendars/${subcalendarId}`,
		body: { ...existing.subcalendar, ...updateFields },
		itemIndex,
	});

	return {
		json: response.subcalendar,
		pairedItem: { item: itemIndex },
	};
}
