import {
	NodeOperationError,
	type IDataObject,
	type IExecuteFunctions,
	type INodeExecutionData,
} from 'n8n-workflow';
import { teamupRequest } from '../../utils';
import { getEventOptions, toEventItems } from './helpers';

export async function getChanged(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const modifiedSinceString = context.getNodeParameter(
		'eventChangesModifiedSince',
		itemIndex,
	) as string;

	if (!modifiedSinceString) {
		throw new NodeOperationError(context.getNode(), 'Modified Since is a required field', {
			itemIndex,
		});
	}

	const options = getEventOptions(context, itemIndex);
	const modifiedSinceDate = new Date(modifiedSinceString);
	if (isNaN(modifiedSinceDate.getTime())) {
		throw new NodeOperationError(context.getNode(), 'Modified Since is not a valid date', {
			itemIndex,
		});
	}

	const thirtyDaysAgo = new Date();
	thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

	if (modifiedSinceDate < thirtyDaysAgo) {
		throw new NodeOperationError(
			context.getNode(),
			'The "Modified Since" date cannot be more than 30 days in the past.',
			{ itemIndex },
		);
	}

	const responseData = await teamupRequest<{ events: IDataObject[] }>(context, {
		method: 'GET',
		path: '/events',
		qs: {
			modifiedSince: Math.floor(modifiedSinceDate.getTime() / 1000),
			mode: options.includeShortLived ? 'monitor' : undefined,
		},
		itemIndex,
	});

	if (!responseData?.events) {
		throw new NodeOperationError(context.getNode(), 'Invalid response data from API', {
			itemIndex,
		});
	}

	return toEventItems(context, itemIndex, responseData.events);
}
