import { IExecuteFunctions, INodeExecutionData, NodeOperationError } from 'n8n-workflow';
import { formatDateTime, formatRrule, getCredentials, getErrorMessage, TeamupEvent, } from '../../utils';

export async function update(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData> {
	const { token, calendarKey } = await getCredentials(context);

	const eventId = context.getNodeParameter('eventId', itemIndex) as string;
	if (!eventId) {
		throw new NodeOperationError(context.getNode(), 'Event ID is required for update', {
			itemIndex,
		});
	}

	const updateFields = context.getNodeParameter('updateFields', itemIndex, {}) as Record<
		string,
		unknown
	>;
	const redit = context.getNodeParameter('redit', itemIndex) as string;

	if (updateFields.startDateTime) {
		updateFields.start_dt = formatDateTime(updateFields.startDateTime as string);
		delete updateFields.startDateTime;
	}
	if (updateFields.endDateTime) {
		updateFields.end_dt = formatDateTime(updateFields.endDateTime as string);
		delete updateFields.endDateTime;
	}
	if (updateFields.subcalendarId) {
		updateFields.subcalendar_id = parseInt(updateFields.subcalendarId as string, 10);
		delete updateFields.subcalendarId;
	}
	if (updateFields.rrule) {
		updateFields.rrule = formatRrule(updateFields.rrule as string);
		delete updateFields.rrule;
	}

	let existingEvent: TeamupEvent;
	try {
		const existingEventResponse = (await context.helpers.httpRequest({
			method: 'GET',
			url: `https://api.teamup.com/${calendarKey}/events/${eventId}`,
			headers: {
				'Teamup-Token': token,
				Accept: 'application/json',
				'User-Agent': 'n8n-teamup-node/0.1.0',
			},
			json: true,
		})) as { event: TeamupEvent };

		if (!existingEventResponse?.event?.id) {
			throw new Error('Event not found or invalid response body');
		}
		existingEvent = existingEventResponse.event;
	} catch (error) {
		throw new NodeOperationError(
			context.getNode(),
			`Failed to fetch event ${eventId} for update: ${getErrorMessage(error)}`,
			{ itemIndex },
		);
	}

	const body = {
		...existingEvent,
		...updateFields,
		redit: redit,
	};

	const response = await context.helpers.httpRequest({
		method: 'PUT',
		url: `https://api.teamup.com/${calendarKey}/events/${eventId}`,
		headers: {
			'Teamup-Token': token,
			Accept: 'application/json',
			'Content-Type': 'application/json',
			'User-Agent': 'n8n-teamup-node/0.1.0',
		},
		body,
		json: true,
	});

	return {
		json: response,
		pairedItem: { item: itemIndex },
	};
}
