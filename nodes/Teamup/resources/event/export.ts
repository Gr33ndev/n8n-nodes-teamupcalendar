import { NodeOperationError, type IExecuteFunctions, type INodeExecutionData } from 'n8n-workflow';
import { USER_AGENT, teamupRequest, getResourceId } from '../../utils';

export async function exportEvent(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData> {
	const eventId = getResourceId(context, 'eventId', itemIndex);
	if (!eventId) {
		throw new NodeOperationError(context.getNode(), 'Event ID is required', { itemIndex });
	}

	const ics = await teamupRequest<string>(context, {
		method: 'GET',
		path: `/events/${eventId}.ics`,
		itemIndex,
		requestOptions: {
			json: false,
			encoding: 'text',
			headers: {
				Accept: 'text/calendar',
				'User-Agent': USER_AGENT,
			},
		},
	});

	return {
		json: { eventId, ics: String(ics) },
		pairedItem: { item: itemIndex },
	};
}
