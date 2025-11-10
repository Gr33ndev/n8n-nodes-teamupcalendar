import { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';

interface TeamupCredentials {
	token: string;
	calendarKey: string;
}

interface TeamupSubcalendar {
	id: string | number;
	name: string;
	[key: string]: unknown;
}

async function getCredentials(context: IExecuteFunctions): Promise<TeamupCredentials> {
	const credentials = await context.getCredentials('teamupApi');
	return {
		token: credentials.token as string,
		calendarKey: credentials.calendarKey as string,
	};
}

export async function getMany(context: IExecuteFunctions, itemIndex: number): Promise<INodeExecutionData[]> {
	const { token, calendarKey } = await getCredentials(context);

	const response = await context.helpers.httpRequest({
		method: 'GET',
		url: `https://api.teamup.com/${calendarKey}/subcalendars`,
		headers: {
			'Teamup-Token': token,
			'Accept': 'application/json',
			'User-Agent': 'n8n-teamup-node/0.1.0',
		},
		json: true,
	}) as { subcalendars: TeamupSubcalendar[] };

	const subcalendars = response.subcalendars || [];

	return subcalendars.map(subcalendar => ({
		json: subcalendar as IDataObject,
		pairedItem: { item: itemIndex },
	}));
}