import {
	NodeOperationError,
	type IDataObject,
	type IExecuteFunctions,
	type INodeExecutionData,
} from 'n8n-workflow';
import { teamupRequest, getResourceId } from '../../utils';
import { getEventOptions, toEventItems } from './helpers';

export async function get(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData> {
	const eventId = getResourceId(context, 'eventId', itemIndex);
	if (!eventId) {
		throw new NodeOperationError(context.getNode(), 'Event ID is required', { itemIndex });
	}
	const options = getEventOptions(context, itemIndex);

	const responseData = await teamupRequest<{ event: IDataObject }>(context, {
		method: 'GET',
		path: `/events/${eventId}`,
		qs: { format: options.format as string },
		itemIndex,
	});
	if (!responseData?.event) {
		throw new NodeOperationError(context.getNode(), 'Invalid response data from API', {
			itemIndex,
		});
	}

	return toEventItems(context, itemIndex, [responseData.event])[0];
}
