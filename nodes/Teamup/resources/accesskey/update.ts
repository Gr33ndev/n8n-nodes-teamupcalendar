import {
	NodeOperationError,
	type IDataObject,
	type IExecuteFunctions,
	type INodeExecutionData,
} from 'n8n-workflow';
import { compact, parseJsonParameter, teamupRequest } from '../../utils';

export async function update(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData> {
	const keyId = context.getNodeParameter('accessKeyId', itemIndex) as string;
	if (!keyId) {
		throw new NodeOperationError(context.getNode(), 'Access Key ID is required', { itemIndex });
	}
	const name = context.getNodeParameter('accessKeyName', itemIndex) as string;
	const permissions = parseJsonParameter(
		context,
		context.getNodeParameter('accessKeySubcalendarPermissions', itemIndex, {}),
		'Subcalendar Permissions (JSON)',
		itemIndex,
	);
	const additionalFields = context.getNodeParameter(
		'accessKeyAdditionalFields',
		itemIndex,
		{},
	) as IDataObject;

	// Teamup requires a complete key for PUT (name, active, share_type, ...), so the current key is
	// merged with the changes.
	const existing = await teamupRequest<{ key: IDataObject }>(context, {
		method: 'GET',
		path: `/keys/${keyId}`,
		itemIndex,
	});

	const responseData = await teamupRequest<{ key: IDataObject }>(context, {
		method: 'PUT',
		path: `/keys/${keyId}`,
		body: {
			...(existing?.key ?? {}),
			id: parseInt(keyId, 10),
			name,
			subcalendar_permissions: permissions,
			...compact(additionalFields),
		},
		itemIndex,
	});

	return {
		json: responseData.key ?? responseData,
		pairedItem: { item: itemIndex },
	};
}
