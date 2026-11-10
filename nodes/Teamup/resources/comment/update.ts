import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { compact, teamupRequest, getResourceId } from '../../utils';

export async function update(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData> {
	const eventId = getResourceId(context, 'commentEventId', itemIndex);
	const commentId = context.getNodeParameter('commentId', itemIndex) as string;
	const message = context.getNodeParameter('commentMessage', itemIndex) as string;
	const additionalFields = context.getNodeParameter(
		'commentAdditionalFields',
		itemIndex,
		{},
	) as IDataObject;
	const options = context.getNodeParameter('commentOptions', itemIndex, {}) as IDataObject;

	const responseData = await teamupRequest<{ data?: IDataObject }>(context, {
		method: 'PUT',
		path: `/events/${eventId}/comments/${commentId}`,
		qs: compact(options) as Record<string, string>,
		body: { message, ...compact(additionalFields) },
		itemIndex,
	});

	return {
		json: responseData.data ?? responseData,
		pairedItem: { item: itemIndex },
	};
}
