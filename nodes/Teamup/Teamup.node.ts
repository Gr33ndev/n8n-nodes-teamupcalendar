import {
	NodeApiError,
	NodeConnectionTypes,
	NodeOperationError,
	type IExecuteFunctions,
	type ILoadOptionsFunctions,
	type INodeExecutionData,
	type INodePropertyOptions,
	type INodeType,
	type INodeTypeDescription,
	type JsonObject,
} from 'n8n-workflow';

import { create as createEvent } from './resources/event/create';
import { deleteEvent } from './resources/event/delete';
import { exportEvent } from './resources/event/export';
import { get as getEvent } from './resources/event/get';
import { getAuxiliaryInfo } from './resources/event/getAuxiliaryInfo';
import { getChanged as getChangedEvents } from './resources/event/getChanged';
import { getMany as getManyEvents } from './resources/event/getMany';
import { getPageUrl as getEventPageUrl } from './resources/event/getPageUrl';
import { search as searchEvents } from './resources/event/search';
import { undo as undoEvent } from './resources/event/undo';
import { update as updateEvent } from './resources/event/update';
import { eventDescription } from './resources/event';

import { checkAccess } from './resources/calendar/checkAccess';
import { duplicate as duplicateCalendar } from './resources/calendar/duplicate';
import { getConfiguration as getCalendarConfiguration } from './resources/calendar/getConfiguration';
import { getUploadUrl as getAttachmentUploadUrl } from './resources/calendar/getUploadUrl';
import { calendarDescription } from './resources/calendar';

import { create as createSubcalendar } from './resources/subcalendar/create';
import { deleteSubcalendar } from './resources/subcalendar/delete';
import { get as getSubcalendar } from './resources/subcalendar/get';
import { getMany as getManySubcalendars } from './resources/subcalendar/getMany';
import { patch as patchSubcalendar } from './resources/subcalendar/patch';
import { update as updateSubcalendar } from './resources/subcalendar/update';
import { subcalendarDescription } from './resources/subcalendar';

import { create as createSignup } from './resources/signup/create';
import { deleteSignup } from './resources/signup/delete';
import { getMany as getManySignups } from './resources/signup/getMany';
import { update as updateSignup } from './resources/signup/update';
import { signupDescription } from './resources/signup';

import { create as createComment } from './resources/comment/create';
import { deleteComment } from './resources/comment/delete';
import { update as updateComment } from './resources/comment/update';
import { commentDescription } from './resources/comment';

import {
	getDefaults as getDefaultReminders,
	getSubcalendarDefaults as getSubcalendarDefaultReminders,
	setEventReminders,
	setSubcalendarDefaults as setSubcalendarDefaultReminders,
} from './resources/reminder/operations';
import { reminderDescription } from './resources/reminder';

import { create as createAccessKey } from './resources/accesskey/create';
import { deleteKey as deleteAccessKey } from './resources/accesskey/delete';
import { get as getAccessKey } from './resources/accesskey/get';
import { getMany as getManyAccessKeys } from './resources/accesskey/getMany';
import { patch as patchAccessKey } from './resources/accesskey/patch';
import { update as updateAccessKey } from './resources/accesskey/update';
import { accessKeyDescription } from './resources/accesskey';

import * as listSearch from './listSearch';
import { CALENDAR_OVERRIDE_PARAMETER, getErrorMessage, teamupRequest } from './utils';

type Operation = (
	context: IExecuteFunctions,
	itemIndex: number,
) => Promise<INodeExecutionData | INodeExecutionData[]>;

const operations: Record<string, Record<string, Operation>> = {
	event: {
		create: createEvent,
		delete: deleteEvent,
		export: exportEvent,
		get: getEvent,
		getAuxiliaryInfo,
		getChanged: getChangedEvents,
		getMany: getManyEvents,
		getPageUrl: getEventPageUrl,
		search: searchEvents,
		undo: undoEvent,
		update: updateEvent,
	},
	subcalendar: {
		create: createSubcalendar,
		delete: deleteSubcalendar,
		get: getSubcalendar,
		getMany: getManySubcalendars,
		patch: patchSubcalendar,
		update: updateSubcalendar,
	},
	calendar: {
		checkAccess,
		duplicate: duplicateCalendar,
		getConfiguration: getCalendarConfiguration,
		getUploadUrl: getAttachmentUploadUrl,
	},
	signup: {
		create: createSignup,
		delete: deleteSignup,
		getMany: getManySignups,
		update: updateSignup,
	},
	comment: {
		create: createComment,
		delete: deleteComment,
		update: updateComment,
	},
	reminder: {
		getDefaults: getDefaultReminders,
		getSubcalendarDefaults: getSubcalendarDefaultReminders,
		setEventReminders,
		setSubcalendarDefaults: setSubcalendarDefaultReminders,
	},
	accessKey: {
		create: createAccessKey,
		delete: deleteAccessKey,
		get: getAccessKey,
		getMany: getManyAccessKeys,
		patch: patchAccessKey,
		update: updateAccessKey,
	},
};

export class Teamup implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Teamup',
		name: 'teamup',
		icon: { light: 'file:teamup.svg', dark: 'file:teamup.dark.svg' },
		group: ['input', 'output'],
		version: [1, 2],
		defaultVersion: 2,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with the Teamup Calendar API',
		defaults: {
			name: 'Teamup',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'teamupApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Access Key',
						value: 'accessKey',
						description: 'Work with calendar access keys',
					},
					{
						name: 'Calendar',
						value: 'calendar',
						description: 'Work with the calendar itself',
					},
					{
						name: 'Comment',
						value: 'comment',
						description: 'Work with event comments',
					},
					{
						name: 'Event',
						value: 'event',
						description: 'Work with calendar events',
					},
					{
						name: 'Reminder',
						value: 'reminder',
						description: 'Work with event and default reminders',
					},
					{
						name: 'Signup',
						value: 'signup',
						description: 'Work with event signups',
					},
					{
						name: 'Subcalendar',
						value: 'subcalendar',
						description: 'Work with subcalendars',
					},
				],
				default: 'event',
			},
			...eventDescription,
			...subcalendarDescription,
			...calendarDescription,
			...accessKeyDescription,
			...signupDescription,
			...commentDescription,
			...reminderDescription,
			{
				displayName: 'Calendar Key or ID',
				name: CALENDAR_OVERRIDE_PARAMETER,
				type: 'string',
				default: '',
				placeholder: 'e.g. ks1234567890abcdef',
				description:
					'Work with another calendar than the one in the credential. Leave empty to use the calendar key from the credential.',
				displayOptions: {
					hide: { operation: ['checkAccess'] },
				},
			},
		],
	};

	methods = {
		listSearch: {
			searchEvents: listSearch.searchEvents,
			searchSubcalendars: listSearch.searchSubcalendars,
		},
		loadOptions: {
			async getSubcalendars(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const response = await teamupRequest<{
					subcalendars: Array<{ id: string | number; name: string }>;
				}>(this, { method: 'GET', path: '/subcalendars' });
				return (response.subcalendars || []).map((subcalendar) => ({
					name: subcalendar.name,
					value: String(subcalendar.id),
				}));
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;

				const run = operations[resource]?.[operation];
				if (!run) {
					throw new NodeOperationError(
						this.getNode(),
						`The operation "${operation}" is not supported for resource "${resource}"`,
						{ itemIndex: i },
					);
				}

				const result = await run(this, i);
				if (Array.isArray(result)) {
					returnData.push(...result);
				} else {
					returnData.push(result);
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: getErrorMessage(error) },
						pairedItem: { item: i },
					});
					continue;
				}

				if (error instanceof NodeApiError) {
					throw new NodeApiError(this.getNode(), error as unknown as JsonObject);
				}
				throw new NodeOperationError(this.getNode(), error as Error, { itemIndex: i });
			}
		}

		return [returnData];
	}
}
