import { IDataObject, IExecuteFunctions, INodeExecutionData, NodeOperationError, } from 'n8n-workflow';
import { getCredentials, getErrorMessage } from '../../utils';

export async function search(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const { token, calendarKey } = await getCredentials(context);

	const query = context.getNodeParameter('eventSearchQuery', itemIndex) as string;
	const subcalendarIdInput = (
		context.getNodeParameter('eventSearchSubcalendarIds', itemIndex, []) as string[]
	).map((id) => parseInt(id, 10));
	const startDate = context.getNodeParameter('eventSearchStartDate', itemIndex, null) as string;
	const limit = context.getNodeParameter('eventSearchLimit', itemIndex, 50) as number;

	const params: string[] = [];

	params.push(`query=${encodeURIComponent(query)}`);
	params.push(`limit=${limit}`);

	if (startDate) {
		const formattedDate = new Date(startDate).toISOString().split('T')[0];
		params.push(`startDate=${formattedDate}`);
	}

	if (subcalendarIdInput.length > 0) {
		for (const id of subcalendarIdInput) {
			params.push(`subcalendarId[]=${id}`);
		}
	}

	const url = `https://api.teamup.com/${calendarKey}/events?${params.join('&')}`;

	let responseData: { events: IDataObject[] };

	try {
		responseData = (await context.helpers.httpRequest({
			method: 'GET',
			url: url,
			headers: {
				'Teamup-Token': token,
				Accept: 'application/json',
				'User-Agent': 'n8n-teamup-node/0.1.0',
			},
			json: true,
		})) as { events: IDataObject[] };

		if (!responseData?.events) {
			throw new Error('Invalid response data from API');
		}
	} catch (error) {
		throw new NodeOperationError(
			context.getNode(),
			`Failed to search events with query "${query}": ${getErrorMessage(error)}`,
			{ itemIndex },
		);
	}

	return responseData.events.map((event) => ({
		json: event,
		pairedItem: { item: itemIndex },
	}));
}
