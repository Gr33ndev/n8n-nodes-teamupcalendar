import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { teamupRequest, getResourceId } from '../../utils';

function toItems(itemIndex: number, response: unknown): INodeExecutionData[] {
	if (response === undefined || response === null || response === '') {
		return [{ json: { success: true }, pairedItem: { item: itemIndex } }];
	}
	const list = Array.isArray(response) ? (response as IDataObject[]) : [response as IDataObject];
	return list.map((json) => ({ json, pairedItem: { item: itemIndex } }));
}

function getReminders(
	context: IExecuteFunctions,
	itemIndex: number,
	forSubcalendar: boolean,
): IDataObject[] {
	const collection = context.getNodeParameter('reminders', itemIndex, {}) as {
		reminder?: IDataObject[];
	};
	const timezone = context.getTimezone();
	return (collection.reminder ?? []).map((reminder) => {
		const result: IDataObject = {
			transport: reminder.transport || 'email',
			offset: reminder.offset,
			tz: reminder.tz || timezone,
		};
		if (reminder.time_of_day) result.time_of_day = reminder.time_of_day;
		if (forSubcalendar) {
			result.all_day = reminder.all_day === true;
			if (reminder.id) result.id = reminder.id;
		}
		return result;
	});
}

export async function getDefaults(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const response = await teamupRequest<unknown>(context, {
		method: 'GET',
		path: '/subscriptions/reminders',
		itemIndex,
	});
	return toItems(itemIndex, response);
}

export async function getSubcalendarDefaults(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const subcalendarId = getResourceId(context, 'reminderSubcalendarId', itemIndex);
	const response = await teamupRequest<unknown>(context, {
		method: 'GET',
		path: `/subscriptions/reminders/${subcalendarId}`,
		itemIndex,
	});
	return toItems(itemIndex, response);
}

export async function setSubcalendarDefaults(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const subcalendarId = getResourceId(context, 'reminderSubcalendarId', itemIndex);
	const response = await teamupRequest<unknown>(context, {
		method: 'PUT',
		path: `/subscriptions/reminders/${subcalendarId}`,
		body: getReminders(context, itemIndex, true),
		itemIndex,
	});
	return toItems(itemIndex, response);
}

export async function setEventReminders(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const eventId = getResourceId(context, 'reminderEventId', itemIndex);
	const response = await teamupRequest<unknown>(context, {
		method: 'PUT',
		path: `/events/${eventId}/reminder-subscriptions`,
		body: getReminders(context, itemIndex, false),
		itemIndex,
	});
	return toItems(itemIndex, response);
}
