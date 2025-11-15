import { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { getCredentials, TeamupSubcalendar } from '../../utils';

export async function getMany(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const { token, calendarKey } = await getCredentials(context);

	const response = (await context.helpers.httpRequest({
		method: 'GET',
		url: `https://api.teamup.com/${calendarKey}/subcalendars`,
		headers: {
			'Teamup-Token': token,
			Accept: 'application/json',
			'User-Agent': 'n8n-teamup-node/0.1.0',
		},
		json: true,
	})) as { subcalendars: TeamupSubcalendar[] };

	const subcalendars = response.subcalendars || [];

	return subcalendars.map((subcalendar) => ({
		json: subcalendar as IDataObject,
		pairedItem: { item: itemIndex },
	}));
}
