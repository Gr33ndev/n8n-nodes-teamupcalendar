import { NodeOperationError, type IExecuteFunctions, type INodeExecutionData } from 'n8n-workflow';
import { teamupRequest, getResourceId, isVersion1 } from '../../utils';

export async function deleteSubcalendar(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData> {
	const subcalendarId = getResourceId(context, 'subcalendarId', itemIndex);
	if (!subcalendarId) {
		throw new NodeOperationError(context.getNode(), 'Subcalendar ID is required for delete', {
			itemIndex,
		});
	}

	const response = await teamupRequest(context, {
		method: 'DELETE',
		path: `/subcalendars/${subcalendarId}`,
		itemIndex,
	});

	return {
		json: isVersion1(context)
			? response && Object.keys(response).length > 0
				? response
				: { success: true, subcalendarId, status: 'Deleted' }
			: { deleted: true },
		pairedItem: { item: itemIndex },
	};
}
