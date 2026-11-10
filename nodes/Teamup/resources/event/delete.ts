import { NodeOperationError, type IExecuteFunctions, type INodeExecutionData } from 'n8n-workflow';
import { teamupRequest, getResourceId } from '../../utils';
import { getEventOptions } from './helpers';

export async function deleteEvent(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData> {
	const eventId = getResourceId(context, 'eventId', itemIndex);
	const redit = context.getNodeParameter('redit', itemIndex) as string;
	const options = getEventOptions(context, itemIndex);

	if (!eventId) {
		throw new NodeOperationError(context.getNode(), 'Event ID is required for delete', {
			itemIndex,
		});
	}

	const response = await teamupRequest<{ undo_id?: string }>(context, {
		method: 'DELETE',
		path: `/events/${eventId}`,
		qs: { redit, version: options.version as string },
		itemIndex,
	});

	return {
		json: { deleted: true, ...(response?.undo_id ? { undo_id: response.undo_id } : {}) },
		pairedItem: { item: itemIndex },
	};
}
