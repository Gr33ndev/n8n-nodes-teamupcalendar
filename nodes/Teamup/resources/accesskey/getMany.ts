import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { teamupRequest } from '../../utils';

export async function getMany(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const filterBy = context.getNodeParameter('accessKeyFilterBy', itemIndex, '') as string;
	const type = context.getNodeParameter('accessKeyType', itemIndex, '') as string;
	const limit = context.getNodeParameter('accessKeyLimit', itemIndex, 0) as number;

	const responseData = await teamupRequest<{ keys: IDataObject[] }>(context, {
		method: 'GET',
		path: '/keys',
		qs: { filterBy, type, limit: limit || undefined },
		itemIndex,
	});

	return (responseData.keys || []).map((key) => ({
		json: key,
		pairedItem: { item: itemIndex },
	}));
}
