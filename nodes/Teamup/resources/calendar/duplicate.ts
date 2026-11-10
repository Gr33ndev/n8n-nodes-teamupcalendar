import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { teamupRequest } from '../../utils';

export async function duplicate(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData> {
	const title = context.getNodeParameter('calendarDuplicateTitle', itemIndex, '') as string;
	const copyConfiguration = context.getNodeParameter(
		'calendarCopyConfiguration',
		itemIndex,
		true,
	) as boolean;
	const copySubcalendars = context.getNodeParameter(
		'calendarCopySubcalendars',
		itemIndex,
		true,
	) as boolean;

	const responseData = await teamupRequest(context, {
		method: 'POST',
		path: '/copy',
		qs: {
			copyConfiguration: String(copyConfiguration),
			copySubcalendars: String(copySubcalendars),
			title: title || undefined,
		},
		itemIndex,
	});

	return {
		json: responseData,
		pairedItem: { item: itemIndex },
	};
}
