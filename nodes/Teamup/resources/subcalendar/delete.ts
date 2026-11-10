import { NodeOperationError, type IExecuteFunctions, type INodeExecutionData } from 'n8n-workflow';
import { teamupRequest, getResourceId } from '../../utils';

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

	await teamupRequest(context, {
		method: 'DELETE',
		path: `/subcalendars/${subcalendarId}`,
		itemIndex,
	});

	return {
		json: { deleted: true },
		pairedItem: { item: itemIndex },
	};
}
