import {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	NodeOperationError,
} from 'n8n-workflow';
import { getCredentials, getErrorMessage } from '../../utils';

export async function getChanged(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const { token, calendarKey } = await getCredentials(context);

	const modifiedSinceString = context.getNodeParameter(
		'eventChangesModifiedSince',
		itemIndex,
	) as string;

	if (!modifiedSinceString) {
		throw new NodeOperationError(context.getNode(), 'Modified Since is a required field', {
			itemIndex,
		});
	}

	const modifiedSinceDate = new Date(modifiedSinceString);
	const thirtyDaysAgo = new Date();
	thirtyDaysAgo.setDate(new Date().getDate() - 30);

	if (modifiedSinceDate < thirtyDaysAgo) {
		throw new NodeOperationError(
			context.getNode(),
			'The "Modified Since" date cannot be more than 30 days in the past.',
			{ itemIndex },
		);
	}

	const modifiedSinceTimestamp = Math.floor(modifiedSinceDate.getTime() / 1000);

	const url = `https://api.teamup.com/${calendarKey}/events?modifiedSince=${modifiedSinceTimestamp}`;

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
			`Failed to get changed events: ${getErrorMessage(error)}`,
			{ itemIndex },
		);
	}

	return responseData.events.map((event) => ({
		json: event,
		pairedItem: { item: itemIndex },
	}));
}
