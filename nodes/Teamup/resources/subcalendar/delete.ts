import { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';

export async function deleteSubcalendar(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData> {
	const credentials = await context.getCredentials('teamupApi');

	const subcalendarId = context.getNodeParameter('subcalendarId', itemIndex) as string;

	const url = `https://api.teamup.com/${credentials.calendarKey}/subcalendars/${subcalendarId}`;

	const response = await context.helpers.httpRequest({
		method: 'DELETE',
		url: url,
		headers: {
			'Teamup-Token': credentials.token as string,
			Accept: 'application/json',
			'User-Agent': 'n8n-teamup-node/0.1.0',
		},
	});

	return {
		json: response,
		pairedItem: { item: itemIndex },
	};
}
