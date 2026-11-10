import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { compact, teamupRequest } from '../../utils';

export async function create(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData> {
	const name = context.getNodeParameter('name', itemIndex) as string;
	const color = context.getNodeParameter('color', itemIndex) as number;
	const active = context.getNodeParameter('active', itemIndex) as boolean;
	const overlap = context.getNodeParameter('overlap', itemIndex) as boolean;
	const additionalFields = context.getNodeParameter(
		'subcalendarAdditionalFields',
		itemIndex,
		{},
	) as IDataObject;

	const body = {
		name,
		color,
		active,
		overlap,
		type: 0,
		...compact(additionalFields),
	};

	const responseData = await teamupRequest<{ subcalendar: IDataObject }>(context, {
		method: 'POST',
		path: '/subcalendars',
		body,
		itemIndex,
	});

	return {
		json: responseData.subcalendar,
		pairedItem: { item: itemIndex },
	};
}
