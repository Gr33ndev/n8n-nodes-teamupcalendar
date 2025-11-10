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

function formatDateTime(dateStr: string): string {
	if (!dateStr) return dateStr;
	return dateStr.replace(/\.\d{3}Z?$/, '').replace('Z', '');
}

export async function create(context: IExecuteFunctions, itemIndex: number): Promise<INodeExecutionData> {
	const { token, calendarKey } = await getCredentials(context);

	const subcalendarId = context.getNodeParameter('subcalendarId', itemIndex) as string;
	const title = context.getNodeParameter('title', itemIndex) as string;
	const startDateTime = context.getNodeParameter('startDateTime', itemIndex) as string;
	const endDateTime = context.getNodeParameter('endDateTime', itemIndex) as string;
	const additionalFields = context.getNodeParameter('additionalFields', itemIndex, {}) as Record<string, unknown>;

	const body = {
		subcalendar_id: parseInt(subcalendarId, 10),
		title,
		start_dt: formatDateTime(startDateTime),
		end_dt: formatDateTime(endDateTime),
		...additionalFields,
	};

	const url = `https://api.teamup.com/${calendarKey}/events`;

	const response = await context.helpers.httpRequest({
		method: 'POST',
		url,
		headers: {
			'Teamup-Token': token,
			'Accept': 'application/json',
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