import {
	NodeOperationError,
	type IDataObject,
	type IExecuteFunctions,
	type INodeExecutionData,
} from 'n8n-workflow';
import { teamupRequest, type TeamupEvent, getResourceId } from '../../utils';
import { applyExtraSubcalendars, getEventOptions, mapEventFields } from './helpers';

export async function update(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData> {
	const eventId = getResourceId(context, 'eventId', itemIndex);
	if (!eventId) {
		throw new NodeOperationError(context.getNode(), 'Event ID is required for update', {
			itemIndex,
		});
	}

	const updateFields = context.getNodeParameter('updateFields', itemIndex, {}) as IDataObject;
	const redit = context.getNodeParameter('redit', itemIndex) as string;
	const options = getEventOptions(context, itemIndex);
	const body = mapEventFields(context, itemIndex, updateFields);

	// Teamup only supports full updates (PUT), so the current event is merged with the changes.
	// The current "version" is sent along, so Teamup rejects the update if the event changed meanwhile.
	const existing = await teamupRequest<{ event: TeamupEvent }>(context, {
		method: 'GET',
		path: `/events/${eventId}`,
		itemIndex,
	});
	if (!existing?.event?.id) {
		throw new NodeOperationError(context.getNode(), `Event ${eventId} not found`, { itemIndex });
	}

	const existingIds = (existing.event.subcalendar_ids as number[] | undefined) ?? [];
	applyExtraSubcalendars(body, (body.subcalendar_ids as number[] | undefined) ?? existingIds);

	const response = await teamupRequest(context, {
		method: 'PUT',
		path: `/events/${eventId}`,
		qs: { inputFormat: options.inputFormat as string },
		body: { ...existing.event, ...body, redit },
		itemIndex,
	});

	return {
		json: response,
		pairedItem: { item: itemIndex },
	};
}
