import { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { getCredentials } from '../../utils';

export async function deleteEvent(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData> {
	const { token, calendarKey } = await getCredentials(context);

	const eventId = context.getNodeParameter('eventId', itemIndex) as string;
	const redit = context.getNodeParameter('redit', itemIndex) as string;

	const response = await context.helpers.httpRequest({
		method: 'DELETE',
		url: `https://api.teamup.com/${calendarKey}/events/${eventId}?redit=${redit}`,
		headers: {
			'Teamup-Token': token,
			Accept: 'application/json',
			'User-Agent': 'n8n-teamup-node/0.1.0',
		},
		json: true,
	});

	return {
		json: response,
		pairedItem: { item: itemIndex },
	};
}
