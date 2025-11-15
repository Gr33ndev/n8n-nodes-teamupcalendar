import { IDataObject, IExecuteFunctions, INodeExecutionData, NodeOperationError, } from 'n8n-workflow';

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

function getErrorMessage(error: unknown): string {
	if (error instanceof Error) return error.message;
	return String(error);
}

export async function get(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData> {
	const { token, calendarKey } = await getCredentials(context);

	const subcalendarId = context.getNodeParameter('subcalendarId', itemIndex) as string;
	if (!subcalendarId) {
		throw new NodeOperationError(context.getNode(), 'Subcalendar ID is required for get', {
			itemIndex,
		});
	}

	const url = `https://api.teamup.com/${calendarKey}/subcalendars/${subcalendarId}`;
	let responseData: { subcalendar: IDataObject };

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
		})) as { subcalendar: IDataObject };

		if (!responseData?.subcalendar) {
			throw new Error('Invalid response data from API');
		}
	} catch (error) {
		throw new NodeOperationError(
			context.getNode(),
			`Failed to fetch subcalendar ${subcalendarId}: ${getErrorMessage(error)}`,
			{ itemIndex },
		);
	}

	return {
		json: responseData.subcalendar,
		pairedItem: { item: itemIndex },
	};
}
