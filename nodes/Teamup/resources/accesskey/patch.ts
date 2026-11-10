import {
	NodeOperationError,
	type IExecuteFunctions,
	type INodeExecutionData,
	type IDataObject,
} from 'n8n-workflow';
import { compact, parseJsonParameter, teamupRequest } from '../../utils';

export async function patch(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData> {
	const keyId = context.getNodeParameter('accessKeyId', itemIndex) as string;
	if (!keyId) {
		throw new NodeOperationError(context.getNode(), 'Access Key ID is required', { itemIndex });
	}

	const body = compact(
		parseJsonParameter(
			context,
			context.getNodeParameter('accessKeyPatchFields', itemIndex, {}),
			'Patch Fields (JSON)',
			itemIndex,
		),
	);
	if (Object.keys(body).length === 0) {
		throw new NodeOperationError(
			context.getNode(),
			'No fields provided to patch. Add at least one field.',
			{ itemIndex },
		);
	}

	const responseData = await teamupRequest<{ key: IDataObject }>(context, {
		method: 'PATCH',
		path: `/keys/${keyId}`,
		body,
		itemIndex,
	});

	return {
		json: responseData.key ?? responseData,
		pairedItem: { item: itemIndex },
	};
}
