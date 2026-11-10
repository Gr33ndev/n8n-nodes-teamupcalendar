import {
	NodeOperationError,
	type IDataObject,
	type IExecuteFunctions,
	type INodeExecutionData,
} from 'n8n-workflow';
import { teamupRequest } from '../../utils';

export async function get(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData> {
	const keyId = context.getNodeParameter('accessKeyId', itemIndex) as string;
	if (!keyId) {
		throw new NodeOperationError(context.getNode(), 'Access Key ID is required', { itemIndex });
	}

	const responseData = await teamupRequest<{ key: IDataObject }>(context, {
		method: 'GET',
		path: `/keys/${keyId}`,
		itemIndex,
	});
	if (!responseData?.key) {
		throw new NodeOperationError(context.getNode(), 'Invalid response data from API', {
			itemIndex,
		});
	}

	return {
		json: responseData.key,
		pairedItem: { item: itemIndex },
	};
}
