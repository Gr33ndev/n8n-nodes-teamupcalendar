import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { teamupRequest } from '../../utils';

export async function getConfiguration(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData> {
	const responseData = await teamupRequest(context, {
		method: 'GET',
		path: '/configuration',
		itemIndex,
	});

	return {
		json: responseData,
		pairedItem: { item: itemIndex },
	};
}
