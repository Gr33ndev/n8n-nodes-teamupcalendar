import { NodeOperationError, type IExecuteFunctions, type INodeExecutionData } from 'n8n-workflow';
import { teamupRequest } from '../../utils';

export async function undo(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData> {
	const undoId = context.getNodeParameter('undoId', itemIndex) as string;
	if (!undoId) {
		throw new NodeOperationError(context.getNode(), 'Undo ID is required', { itemIndex });
	}

	const responseData = await teamupRequest(context, {
		method: 'PUT',
		path: `/events/undo/${undoId}`,
		itemIndex,
	});

	if (Object.keys(responseData || {}).length === 0) {
		return {
			json: { success: true, undoId, status: 'Undone' },
			pairedItem: { item: itemIndex },
		};
	}
	return {
		json: responseData,
		pairedItem: { item: itemIndex },
	};
}
