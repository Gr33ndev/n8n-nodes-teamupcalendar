import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { teamupRequest, getResourceId } from '../../utils';

export async function deleteComment(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData> {
	const eventId = getResourceId(context, 'commentEventId', itemIndex);
	const commentId = context.getNodeParameter('commentId', itemIndex) as string;

	await teamupRequest(context, {
		method: 'DELETE',
		path: `/events/${eventId}/comments/${commentId}`,
		itemIndex,
	});

	return {
		json: { deleted: true },
		pairedItem: { item: itemIndex },
	};
}
