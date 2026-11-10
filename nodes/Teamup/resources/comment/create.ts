import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { compact, teamupRequest, getResourceId } from '../../utils';

export async function create(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData> {
	const eventId = getResourceId(context, 'commentEventId', itemIndex);
	const message = context.getNodeParameter('commentMessage', itemIndex) as string;
	const additionalFields = context.getNodeParameter(
		'commentAdditionalFields',
		itemIndex,
		{},
	) as IDataObject;
	const options = context.getNodeParameter('commentOptions', itemIndex, {}) as IDataObject;

	const responseData = await teamupRequest<{ data?: IDataObject }>(context, {
		method: 'POST',
		path: `/events/${eventId}/comments`,
		qs: compact(options) as Record<string, string>,
		body: { message, ...compact(additionalFields) },
		itemIndex,
	});

	return {
		json: responseData.data ?? responseData,
		pairedItem: { item: itemIndex },
	};
}
