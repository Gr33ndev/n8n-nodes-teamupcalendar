import {
	NodeOperationError,
	type IDataObject,
	type IExecuteFunctions,
	type INodeExecutionData,
} from 'n8n-workflow';
import { teamupRequest, getResourceId } from '../../utils';

export async function get(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData> {
	const subcalendarId = getResourceId(context, 'subcalendarId', itemIndex);
	if (!subcalendarId) {
		throw new NodeOperationError(context.getNode(), 'Subcalendar ID is required for get', {
			itemIndex,
		});
	}

	const responseData = await teamupRequest<{ subcalendar: IDataObject }>(context, {
		method: 'GET',
		path: `/subcalendars/${subcalendarId}`,
		itemIndex,
	});
	if (!responseData?.subcalendar) {
		throw new NodeOperationError(context.getNode(), 'Invalid response data from API', {
			itemIndex,
		});
	}

	return {
		json: responseData.subcalendar,
		pairedItem: { item: itemIndex },
	};
}
