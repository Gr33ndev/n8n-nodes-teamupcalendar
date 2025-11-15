import {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	NodeOperationError,
} from 'n8n-workflow';
import { getCredentials, getErrorMessage } from '../../utils';

export async function getAuxiliaryInfo(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData> {
	const { token, calendarKey } = await getCredentials(context);

	const eventId = context.getNodeParameter('eventId', itemIndex) as string;
	if (!eventId) {
		throw new NodeOperationError(context.getNode(), 'Event ID is required', { itemIndex });
	}

	const url = `https://api.teamup.com/${calendarKey}/events/${eventId}/aux`;
	let responseData: IDataObject;

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
		})) as IDataObject;
	} catch (error) {
		throw new NodeOperationError(
			context.getNode(),
			`Failed to fetch auxiliary info for event ${eventId}: ${getErrorMessage(error)}`,
			{ itemIndex },
		);
	}

	return {
		json: responseData,
		pairedItem: { item: itemIndex },
	};
}
