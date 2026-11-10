import { NodeOperationError, type IExecuteFunctions, type INodeExecutionData } from 'n8n-workflow';
import { teamupRequest, getResourceId } from '../../utils';

export async function deleteSignup(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData> {
	const eventId = getResourceId(context, 'signupEventId', itemIndex);
	const signupId = context.getNodeParameter('signupId', itemIndex) as string;
	if (!eventId || !signupId) {
		throw new NodeOperationError(context.getNode(), 'Event ID and Signup ID are required', {
			itemIndex,
		});
	}

	await teamupRequest(context, {
		method: 'DELETE',
		path: `/events/${eventId}/signups/${signupId}`,
		itemIndex,
	});

	return {
		json: { deleted: true },
		pairedItem: { item: itemIndex },
	};
}
