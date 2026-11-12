import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { formatDateTime, formatRrule, parseJsonParameter, isVersion1 } from '../../utils';
import { simplifyEvent } from '../shared';

/**
 * Maps the UI fields of "Additional Fields" / "Update Fields" to the Teamup event body.
 * Empty values are skipped so they do not overwrite existing data.
 */
export function mapEventFields(
	context: IExecuteFunctions,
	itemIndex: number,
	fields: IDataObject,
): IDataObject {
	const body: IDataObject = {};
	const extraSubcalendars: number[] = [];

	for (const [key, value] of Object.entries(fields)) {
		if (value === '' || value === undefined || value === null) continue;
		switch (key) {
			case 'startDateTime':
				body.start_dt = formatDateTime(value as string, isVersion1(context));
				break;
			case 'endDateTime':
				body.end_dt = formatDateTime(value as string, isVersion1(context));
				break;
			case 'signup_deadline':
				body.signup_deadline = formatDateTime(value as string, isVersion1(context));
				break;
			case 'subcalendarId':
				body.subcalendar_ids = [parseInt(value as string, 10)];
				break;
			case 'additionalSubcalendarIds':
				for (const id of value as Array<string | number>) {
					extraSubcalendars.push(parseInt(String(id), 10));
				}
				break;
			case 'rrule':
				body.rrule = formatRrule(value as string);
				break;
			case 'custom': {
				const custom = parseJsonParameter(context, value, 'Custom Fields (JSON)', itemIndex);
				if (Object.keys(custom).length > 0) body.custom = custom;
				break;
			}
			default:
				body[key] = value;
		}
	}

	if (extraSubcalendars.length > 0) {
		body.additionalSubcalendarIds = extraSubcalendars;
	}
	return body;
}

/** Merges "Additional Subcalendar IDs" into subcalendar_ids. */
export function applyExtraSubcalendars(body: IDataObject, baseIds: number[]): IDataObject {
	const extra = (body.additionalSubcalendarIds as number[] | undefined) ?? [];
	delete body.additionalSubcalendarIds;
	if (extra.length === 0) return body;
	const ids = [...baseIds];
	for (const id of extra) {
		if (!ids.includes(id)) ids.push(id);
	}
	body.subcalendar_ids = ids;
	return body;
}

export function getEventOptions(context: IExecuteFunctions, itemIndex: number): IDataObject {
	return context.getNodeParameter('eventOptions', itemIndex, {}) as IDataObject;
}

export function toEventItems(
	context: IExecuteFunctions,
	itemIndex: number,
	events: IDataObject[],
): INodeExecutionData[] {
	const simplify = context.getNodeParameter('simplify', itemIndex, false) as boolean;
	return events.map((event) => ({
		json: simplify ? simplifyEvent(event) : event,
		pairedItem: { item: itemIndex },
	}));
}
