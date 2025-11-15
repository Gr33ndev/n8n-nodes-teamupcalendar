import { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';

export async function create(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData> {
	const credentials = await context.getCredentials('teamupApi');
	const name = context.getNodeParameter('name', itemIndex) as string;
	const color = context.getNodeParameter('color', itemIndex) as number;
	const active = context.getNodeParameter('active', itemIndex) as boolean;
	const overlap = context.getNodeParameter('overlap', itemIndex) as boolean;

	const body = {
		name: name,
		color: color,
		active: active,
		overlap: overlap,
		type: 0,
	};

	const url = `https://api.teamup.com/${credentials.calendarKey}/subcalendars`;

	const responseData = (await context.helpers.httpRequest({
		method: 'POST',
		url: url,
		headers: {
			'Teamup-Token': credentials.token as string,
			Accept: 'application/json',
			'Content-Type': 'application/json',
			'User-Agent': 'n8n-teamup-node/0.1.0',
		},
		body: body,
		json: true,
	})) as { subcalendar: IDataObject };

	const subcalendarData = responseData.subcalendar;

	return {
		json: subcalendarData,
		pairedItem: { item: itemIndex },
	};
}
