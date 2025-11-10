import { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';

interface TeamupCredentials {
	token: string;
	calendarKey: string;
}

async function getCredentials(context: IExecuteFunctions): Promise<TeamupCredentials> {
	const credentials = await context.getCredentials('teamupApi');
	return {
		token: credentials.token as string,
		calendarKey: credentials.calendarKey as string,
	};
}

export async function deleteEvent(context: IExecuteFunctions, itemIndex: number): Promise<INodeExecutionData> {
	const { token, calendarKey } = await getCredentials(context);

	const eventId = context.getNodeParameter('eventId', itemIndex) as string;

	const response = await context.helpers.httpRequest({
		method: 'DELETE',
		url: `https://api.teamup.com/${calendarKey}/events/${eventId}`,
		headers: {
			'Teamup-Token': token,
			'Accept': 'application/json',
			'User-Agent': 'n8n-teamup-node/0.1.0',
		},
		json: true,
	});

	return {
		json: response,
		pairedItem: { item: itemIndex },
	};
}