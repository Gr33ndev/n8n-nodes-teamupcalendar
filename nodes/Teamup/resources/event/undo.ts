import {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	NodeOperationError,
} from 'n8n-workflow';
import { getCredentials, getErrorMessage } from '../../utils';

export async function undo(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData> {
	const { token, calendarKey } = await getCredentials(context);

	const undoId = context.getNodeParameter('undoId', itemIndex) as string;
	if (!undoId) {
		throw new NodeOperationError(context.getNode(), 'Undo ID is required', { itemIndex });
	}

	const url = `https://api.teamup.com/${calendarKey}/events/undo/${undoId}`;
	let responseData: IDataObject;

	try {
		responseData = (await context.helpers.httpRequest({
			method: 'PUT',
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
			`Failed to undo action ${undoId}: ${getErrorMessage(error)}`,
			{ itemIndex },
		);
	}

	if (Object.keys(responseData).length === 0) {
		return {
			json: { success: true, undoId: undoId, status: 'Undone' },
			pairedItem: { item: itemIndex },
		};
	}

	return {
		json: responseData,
		pairedItem: { item: itemIndex },
	};
}
