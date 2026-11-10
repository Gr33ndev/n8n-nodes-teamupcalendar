import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { compact, parseJsonParameter, teamupRequest } from '../../utils';

export async function create(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData> {
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

	const responseData = await teamupRequest<{ key: IDataObject }>(context, {
		method: 'POST',
		path: '/keys',
		body: { name, subcalendar_permissions: permissions, ...compact(additionalFields) },
		itemIndex,
	});

	return {
		json: responseData.key ?? responseData,
		pairedItem: { item: itemIndex },
	};
}
