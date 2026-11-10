import { NodeOperationError, type IExecuteFunctions, type INodeExecutionData } from 'n8n-workflow';
import { teamupRequest } from '../../utils';

export async function deleteKey(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData> {
	const keyId = context.getNodeParameter('accessKeyId', itemIndex) as string;
	if (!keyId) {
		throw new NodeOperationError(context.getNode(), 'Access Key ID is required', { itemIndex });
	}

	await teamupRequest(context, {
		method: 'DELETE',
		path: `/keys/${keyId}`,
		itemIndex,
	});

	return {
		json: { deleted: true },
		pairedItem: { item: itemIndex },
	};
}
