import {
	NodeOperationError,
	type IDataObject,
	type IExecuteFunctions,
	type INodeExecutionData,
} from 'n8n-workflow';
import { formatDateTime, formatRrule, teamupRequest, getResourceId } from '../../utils';
import { applyExtraSubcalendars, getEventOptions, mapEventFields } from './helpers';

export async function create(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData> {
	const subcalendarId = getResourceId(context, 'subcalendarId', itemIndex);
	const title = context.getNodeParameter('title', itemIndex) as string;
	const startDateTime = context.getNodeParameter('startDateTime', itemIndex) as string;
	const endDateTime = context.getNodeParameter('endDateTime', itemIndex) as string;
	const additionalFields = context.getNodeParameter(
		'additionalFields',
		itemIndex,
		{},
	) as IDataObject;
	const rrule = formatRrule(context.getNodeParameter('rrule', itemIndex, '') as string);
	const options = getEventOptions(context, itemIndex);

	const baseIds = [parseInt(subcalendarId, 10)];
	if (isNaN(baseIds[0])) {
		throw new NodeOperationError(context.getNode(), 'Choose a subcalendar for the event', {
			itemIndex,
		});
	}
	const body: IDataObject = {
		subcalendar_ids: baseIds,
		title,
		start_dt: formatDateTime(startDateTime),
		end_dt: formatDateTime(endDateTime),
		signup_enabled: false,
		comments_enabled: false,
		attachments: [],
		...mapEventFields(context, itemIndex, additionalFields),
	};
	applyExtraSubcalendars(body, baseIds);
	if (rrule) {
		body.rrule = rrule;
	}

	const response = await teamupRequest(context, {
		method: 'POST',
		path: '/events',
		qs: { inputFormat: options.inputFormat as string, format: options.format as string },
		body,
		itemIndex,
	});

	return {
		json: response,
		pairedItem: { item: itemIndex },
	};
}
