import {
	NodeOperationError,
	type IDataObject,
	type IExecuteFunctions,
	type INodeExecutionData,
} from 'n8n-workflow';
import { compact, teamupRequest, getResourceId } from '../../utils';

export async function patch(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData> {
	const subcalendarId = getResourceId(context, 'subcalendarId', itemIndex);
	if (!subcalendarId) {
		throw new NodeOperationError(context.getNode(), 'Subcalendar ID is required for patch', {
			itemIndex,
		});
	}

	const body = compact(
		context.getNodeParameter('subcalendarUpdateFields', itemIndex, {}) as IDataObject,
	);
	if (Object.keys(body).length === 0) {
		throw new NodeOperationError(
			context.getNode(),
			'No fields provided to patch. Add at least one field under "Update Fields".',
			{ itemIndex },
		);
	}

	const response = await teamupRequest<{ subcalendar: IDataObject }>(context, {
		method: 'PATCH',
		path: `/subcalendars/${subcalendarId}`,
		body,
		itemIndex,
	});

	return {
		json: response.subcalendar ?? response,
		pairedItem: { item: itemIndex },
	};
}
