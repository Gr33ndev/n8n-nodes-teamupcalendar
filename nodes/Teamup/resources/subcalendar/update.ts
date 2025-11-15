import {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	NodeOperationError,
} from 'n8n-workflow';
import { getCredentials, getErrorMessage, TeamupSubcalendar } from '../../utils';

export async function update(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData> {
	const { token, calendarKey } = await getCredentials(context);

	const subcalendarId = context.getNodeParameter('subcalendarId', itemIndex) as string;
	if (!subcalendarId) {
		throw new NodeOperationError(context.getNode(), 'Subcalendar ID is required for update', {
			itemIndex,
		});
	}

	const updateFields = context.getNodeParameter(
		'subcalendarUpdateFields',
		itemIndex,
		{},
	) as IDataObject;

	let existingSubcalendar: TeamupSubcalendar;
	try {
		const existingSubcalendarResponse = (await context.helpers.httpRequest({
			method: 'GET',
			url: `https://api.teamup.com/${calendarKey}/subcalendars/${subcalendarId}`,
			headers: {
				'Teamup-Token': token,
				Accept: 'application/json',
				'User-Agent': 'n8n-teamup-node/0.1.0',
			},
			json: true,
		})) as { subcalendar: TeamupSubcalendar };

		if (!existingSubcalendarResponse?.subcalendar?.id) {
			throw new Error('Subcalendar not found or invalid response body');
		}
		existingSubcalendar = existingSubcalendarResponse.subcalendar;
	} catch (error) {
		throw new NodeOperationError(
			context.getNode(),
			`Failed to fetch subcalendar ${subcalendarId} for update: ${getErrorMessage(error)}`,
			{ itemIndex },
		);
	}

	const body = {
		...existingSubcalendar,
		...updateFields,
	};

	const response = await context.helpers.httpRequest({
		method: 'PUT',
		url: `https://api.teamup.com/${calendarKey}/subcalendars/${subcalendarId}`,
		headers: {
			'Teamup-Token': token,
			Accept: 'application/json',
			'Content-Type': 'application/json',
			'User-Agent': 'n8n-teamup-node/0.1.0',
		},
		body,
		json: true,
	});

	return {
		json: (response as { subcalendar: IDataObject }).subcalendar,
		pairedItem: { item: itemIndex },
	};
}
