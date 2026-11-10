import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { teamupRequest } from '../../utils';

export async function getUploadUrl(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData> {
	const response = await teamupRequest<{ headers?: Record<string, string | undefined> }>(context, {
		method: 'GET',
		path: '/attachments/uploadurl',
		itemIndex,
		requestOptions: { returnFullResponse: true },
	});

	const location = response?.headers?.location || response?.headers?.Location;

	return {
		json: { uploadUrl: location },
		pairedItem: { item: itemIndex },
	};
}
