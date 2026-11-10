import type { IDataObject, INodeProperties } from 'n8n-workflow';

export const formatOption: INodeProperties = {
	displayName: 'Notes Format',
	name: 'format',
	type: 'options',
	options: [
		{ name: 'HTML', value: 'html' },
		{ name: 'Markdown', value: 'markdown' },
	],
	default: 'html',
	description: 'Format in which Teamup returns rich text such as event notes and comments',
};

export const inputFormatOption: INodeProperties = {
	displayName: 'Input Format',
	name: 'inputFormat',
	type: 'options',
	options: [
		{ name: 'HTML', value: 'html' },
		{ name: 'Markdown', value: 'markdown' },
	],
	default: 'html',
	description: 'Format of the rich text you send, such as event notes and comments',
};

export function simplifyParameter(resource: string, operations: string[]): INodeProperties {
	return {
		displayName: 'Simplify',
		name: 'simplify',
		type: 'boolean',
		default: false,
		description: 'Whether to return a simplified version of the response instead of the raw data',
		displayOptions: {
			show: { resource: [resource], operation: operations },
		},
	};
}

const SIMPLIFIED_EVENT_FIELDS = [
	'id',
	'title',
	'start_dt',
	'end_dt',
	'all_day',
	'subcalendar_ids',
	'location',
	'who',
	'notes',
	'rrule',
];

export function simplifyEvent(event: IDataObject): IDataObject {
	const result: IDataObject = {};
	for (const field of SIMPLIFIED_EVENT_FIELDS) {
		if (event[field] !== undefined) result[field] = event[field];
	}
	return result;
}

/** Event fields shared by "Additional Fields" (create) and "Update Fields" (update). */
export const extraEventFields: INodeProperties[] = [
	{
		displayName: 'Additional Subcalendar Names or IDs',
		name: 'additionalSubcalendarIds',
		type: 'multiOptions',
		typeOptions: {
			loadOptionsMethod: 'getSubcalendars',
		},
		default: [],
		description:
			'Further subcalendars the event appears in. Choose from the list, or specify IDs using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
	},
	{
		displayName: 'Comments Enabled',
		name: 'comments_enabled',
		type: 'boolean',
		default: false,
		description: 'Whether people can comment on the event',
	},
	{
		displayName: 'Comments Visibility',
		name: 'comments_visibility',
		type: 'options',
		options: [
			{ name: 'All Users', value: 'all_users' },
			{ name: 'Users With Modify Permission', value: 'users_with_modify_permission' },
		],
		default: 'all_users',
		description: 'Who can see the comments of the event',
	},
	{
		displayName: 'Custom Fields (JSON)',
		name: 'custom',
		type: 'json',
		default: '{}',
		description:
			'Custom field values as a JSON object with the custom field IDs as keys, e.g. {"field_1":"value","choice_2":["opt_1"]}',
	},
	{
		displayName: 'Remote ID',
		name: 'remote_id',
		type: 'string',
		default: '',
		description: 'An identifier to link the event to a record in another system',
	},
	{
		displayName: 'Signup Deadline',
		name: 'signup_deadline',
		type: 'dateTime',
		default: '',
		description: 'Until when people can sign up. Defaults to the start of the event.',
	},
	{
		displayName: 'Signup Enabled',
		name: 'signup_enabled',
		type: 'boolean',
		default: false,
		description: 'Whether people can sign up for the event',
	},
	{
		displayName: 'Signup Limit',
		name: 'signup_limit',
		type: 'number',
		typeOptions: { minValue: 0 },
		default: 0,
		description: 'Maximum number of signups. Required by Teamup when signups are enabled.',
	},
	{
		displayName: 'Signup Visibility',
		name: 'signup_visibility',
		type: 'options',
		options: [
			{ name: 'All Users', value: 'all_users' },
			{ name: 'Users With Modify Permission', value: 'users_with_modify_permission' },
		],
		default: 'all_users',
		description: 'Who can see the signups of the event',
	},
];

export function sortByName(properties: INodeProperties[]): INodeProperties[] {
	return [...properties].sort((a, b) => a.displayName.localeCompare(b.displayName));
}

/** Resource locator for a subcalendar ("From List" or "By ID"). */
export function subcalendarLocator(
	overrides: Partial<INodeProperties> & Pick<INodeProperties, 'name' | 'displayOptions'>,
): INodeProperties {
	return {
		displayName: 'Subcalendar',
		type: 'resourceLocator',
		default: { mode: 'list', value: '' },
		required: true,
		modes: [
			{
				displayName: 'From List',
				name: 'list',
				type: 'list',
				placeholder: 'Select a subcalendar...',
				typeOptions: {
					searchListMethod: 'searchSubcalendars',
					searchable: true,
				},
			},
			{
				displayName: 'By ID',
				name: 'id',
				type: 'string',
				placeholder: 'e.g. 1234567',
				validation: [
					{
						type: 'regex',
						properties: {
							regex: '^\\s*\\d+\\s*$',
							errorMessage: 'Not a valid subcalendar ID',
						},
					},
				],
			},
		],
		...overrides,
	} as INodeProperties;
}

/** Resource locator for an event ("From List" with search or "By ID"). */
export function eventLocator(
	overrides: Partial<INodeProperties> & Pick<INodeProperties, 'name' | 'displayOptions'>,
): INodeProperties {
	return {
		displayName: 'Event',
		type: 'resourceLocator',
		default: { mode: 'list', value: '' },
		required: true,
		description: 'The event. In the list, type at least 2 characters to search.',
		modes: [
			{
				displayName: 'From List',
				name: 'list',
				type: 'list',
				placeholder: 'Select an event...',
				typeOptions: {
					searchListMethod: 'searchEvents',
					searchable: true,
				},
			},
			{
				displayName: 'By ID',
				name: 'id',
				type: 'string',
				placeholder: 'e.g. 1234567890',
				validation: [
					{
						type: 'regex',
						properties: {
							regex: '^\\s*[1-9][0-9]*(-rid-[1-9][0-9]*)?\\s*$',
							errorMessage: 'Not a valid event ID',
						},
					},
				],
			},
		],
		...overrides,
	} as INodeProperties;
}
