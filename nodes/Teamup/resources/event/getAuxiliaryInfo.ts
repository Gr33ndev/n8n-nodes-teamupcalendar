import { NodeOperationError, type IExecuteFunctions, type INodeExecutionData } from 'n8n-workflow';
import { teamupRequest, getResourceId } from '../../utils';
import { getEventOptions } from './helpers';

export async function getAuxiliaryInfo(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData> {
	const eventId = getResourceId(context, 'eventId', itemIndex);
	if (!eventId) {
		throw new NodeOperationError(context.getNode(), 'Event ID is required', { itemIndex });
	}
	const options = getEventOptions(context, itemIndex);

	const responseData = await teamupRequest(context, {
		method: 'GET',
		path: `/events/${eventId}/aux`,
		qs: { format: options.format as string },
		itemIndex,
	});

	return {
		json: responseData,
		pairedItem: { item: itemIndex },
	};
}
