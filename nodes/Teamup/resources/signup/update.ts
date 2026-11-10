import {
	NodeOperationError,
	type IDataObject,
	type IExecuteFunctions,
	type INodeExecutionData,
} from 'n8n-workflow';
import { teamupRequest, getResourceId } from '../../utils';

export async function update(
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
	const email = context.getNodeParameter('signupEmail', itemIndex) as string;
	const name = context.getNodeParameter('signupName', itemIndex) as string;
	const remoteId = context.getNodeParameter('signupRemoteId', itemIndex, '') as string;
	const options = context.getNodeParameter('signupOptions', itemIndex, {}) as IDataObject;

	const body: IDataObject = { email, name };
	if (remoteId) body.remote_id = remoteId;

	const responseData = await teamupRequest<{ data: IDataObject }>(context, {
		method: 'PUT',
		path: `/events/${eventId}/signups/${signupId}`,
		qs: { clientTimezone: options.clientTimezone as string },
		body,
		itemIndex,
	});

	return {
		json: responseData.data ?? responseData,
		pairedItem: { item: itemIndex },
	};
}
