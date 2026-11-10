import {
	NodeOperationError,
	type IDataObject,
	type IExecuteFunctions,
	type INodeExecutionData,
} from 'n8n-workflow';
import { teamupRequest, getResourceId } from '../../utils';

export async function getMany(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const eventId = getResourceId(context, 'signupEventId', itemIndex);
	if (!eventId) {
		throw new NodeOperationError(context.getNode(), 'Event ID is required', { itemIndex });
	}
	const options = context.getNodeParameter('signupOptions', itemIndex, {}) as IDataObject;

	const responseData = await teamupRequest<IDataObject[] | { signups?: IDataObject[] }>(context, {
		method: 'GET',
		path: `/events/${eventId}/signups`,
		qs: { clientTimezone: options.clientTimezone as string },
		itemIndex,
	});

	const signups = Array.isArray(responseData) ? responseData : [];
	return signups.map((signup) => ({
		json: signup,
		pairedItem: { item: itemIndex },
	}));
}
