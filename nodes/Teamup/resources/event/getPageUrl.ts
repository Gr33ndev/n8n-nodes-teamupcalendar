import { NodeOperationError, type IExecuteFunctions, type INodeExecutionData } from 'n8n-workflow';
import { teamupRequest, getResourceId } from '../../utils';

export async function getPageUrl(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData> {
	const eventId = getResourceId(context, 'eventId', itemIndex);
	if (!eventId) {
		throw new NodeOperationError(context.getNode(), 'Event ID is required', { itemIndex });
	}

	const responseData = await teamupRequest(context, {
		method: 'POST',
		path: `/events/${eventId}/pointer`,
		itemIndex,
	});

	return {
		json: responseData,
		pairedItem: { item: itemIndex },
	};
}
