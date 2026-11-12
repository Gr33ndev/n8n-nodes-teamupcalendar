import type { INodeProperties } from 'n8n-workflow';
import { FROM_VERSION_2, sortByName, subcalendarField } from '../shared';

const colorDescription =
	'The color index for the subcalendar (1-48). See color list here: https://teamup.stoplight.io/docs/api/ZG9jOjI4Mzk0ODA5-colors.';

const extraSubcalendarFields: INodeProperties[] = [
	{
		displayName: 'Feed URL',
		name: 'feed_url',
		type: 'string',
		default: '',
		placeholder: 'e.g. https://example.com/calendar.ics',
		description: 'URL of an iCalendar feed to import events from (for feed subcalendars)',
	},
	{
		displayName: 'Polling Interval',
		name: 'polling_interval',
		type: 'number',
		typeOptions: { minValue: 0 },
		default: 0,
		description: 'How often Teamup refreshes the feed, in minutes (for feed subcalendars)',
	},
	{
		displayName: 'Remote ID',
		name: 'remote_id',
		type: 'string',
		default: '',
		description: 'An identifier to link the subcalendar to a record in another system',
	},
	{
		displayName: 'Type',
		name: 'type',
		type: 'options',
		options: [
			{ name: 'Regular', value: 0 },
			{ name: 'Feed', value: 1 },
		],
		default: 0,
		description: 'Whether this is a regular subcalendar or one that imports an iCalendar feed',
	},
];

export const subcalendarDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: { resource: ['subcalendar'] },
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Create a new subcalendar',
				action: 'Create a subcalendar',
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete a subcalendar',
				action: 'Delete a subcalendar',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Retrieve a single subcalendar by ID',
				action: 'Get a subcalendar',
			},
			{
				name: 'Get Many',
				value: 'getMany',
				description: 'Retrieve many subcalendars',
				action: 'Get many subcalendars',
			},
			{
				name: 'Patch',
				value: 'patch',
				description: 'Partially update a subcalendar (only changed fields)',
				action: 'Patch a subcalendar',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update an existing subcalendar',
				action: 'Update a subcalendar',
			},
		],
		default: 'getMany',
	},
	...subcalendarField({
		name: 'subcalendarId',
		description: 'The subcalendar to work with',
		displayOptions: {
			show: {
				resource: ['subcalendar'],
				operation: ['get', 'update', 'delete', 'patch'],
			},
		},
	}),
	{
		displayName: 'Update Fields',
		name: 'subcalendarUpdateFields',
		type: 'collection',
		placeholder: 'Add Field to Update',
		default: {},
		displayOptions: {
			show: {
				resource: ['subcalendar'],
				operation: ['update', 'patch'],
			},
		},
		options: sortByName([
			{
				displayName: 'Active',
				name: 'active',
				type: 'boolean',
				default: true,
				description: 'Whether the subcalendar is active and visible',
			},
			{
				displayName: 'Color Index',
				name: 'color',
				type: 'number',
				default: 1,
				description: colorDescription,
				typeOptions: {
					minValue: 1,
					maxValue: 48,
				},
			},
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Overlap Events',
				name: 'overlap',
				type: 'boolean',
				default: true,
				description: 'Whether to allow overlapping events on this subcalendar',
			},
			...extraSubcalendarFields,
		]),
	},
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		required: true,
		default: '',
		description: 'The name of the new subcalendar',
		displayOptions: {
			show: {
				resource: ['subcalendar'],
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'Color Index',
		name: 'color',
		type: 'number',
		default: 1,
		description: colorDescription,
		typeOptions: {
			minValue: 1,
			maxValue: 48,
		},
		displayOptions: {
			show: {
				resource: ['subcalendar'],
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'Active',
		name: 'active',
		type: 'boolean',
		default: true,
		description: 'Whether the subcalendar is active and visible',
		displayOptions: {
			show: {
				resource: ['subcalendar'],
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'Overlap Events',
		name: 'overlap',
		type: 'boolean',
		default: true,
		description: 'Whether to allow overlapping events on this subcalendar',
		displayOptions: {
			show: {
				resource: ['subcalendar'],
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'Additional Fields',
		name: 'subcalendarAdditionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['subcalendar'],
				operation: ['create'],
			},
		},
		options: extraSubcalendarFields,
	},
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['subcalendar'],
				operation: ['getMany'],
				'@version': FROM_VERSION_2,
			},
		},
		default: false,
		description: 'Whether to return all results or only up to a given limit',
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['subcalendar'],
				operation: ['getMany'],
				returnAll: [false],
				'@version': FROM_VERSION_2,
			},
		},
		typeOptions: {
			minValue: 1,
		},
		default: 50,
		description: 'Max number of results to return',
	},
	{
		displayName: 'Filters',
		name: 'subcalendarFilters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: {
			show: {
				resource: ['subcalendar'],
				operation: ['getMany'],
			},
		},
		options: [
			{
				displayName: 'Access Key ID',
				name: 'keyId',
				type: 'string',
				default: '',
				description: 'Only return subcalendars that this access key can see',
			},
			{
				displayName: 'Include Inactive',
				name: 'includeInactive',
				type: 'boolean',
				default: false,
				description: 'Whether to include inactive subcalendars',
			},
			{
				displayName: 'Name Contains',
				name: 'filterBy',
				type: 'string',
				default: '',
				description: 'Only return subcalendars whose name contains this text',
			},
		],
	},
];
