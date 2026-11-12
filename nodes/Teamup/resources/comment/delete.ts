import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { teamupRequest, getResourceId, isVersion1 } from '../../utils';

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
		json: isVersion1(context)
			? { success: true, eventId, commentId, status: 'Deleted' }
			: { deleted: true },
		pairedItem: { item: itemIndex },
	};
}
