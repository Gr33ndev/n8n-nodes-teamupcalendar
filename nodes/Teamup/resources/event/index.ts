import type { INodeProperties } from 'n8n-workflow';
import {
	eventLocator,
	extraEventFields,
	formatOption,
	inputFormatOption,
	simplifyParameter,
	sortByName,
	subcalendarLocator,
} from '../shared';

export const eventDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: { resource: ['event'] },
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Create a new event',
				action: 'Create an event',
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete an event',
				action: 'Delete an event',
			},
			{
				name: 'Export',
				value: 'export',
				description: 'Export an event in iCal format',
				action: 'Export an event',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Retrieve a single event by ID',
				action: 'Get an event',
			},
			{
				name: 'Get Auxiliary Info',
				value: 'getAuxiliaryInfo',
				description: "Get an event's history, comments, signups and reminders",
				action: 'Get auxiliary event info',
			},
			{
				name: 'Get Changed Events',
				value: 'getChanged',
				description: 'Get events that were created, changed or deleted since a point in time',
				action: 'Get changed events',
			},
			{
				name: 'Get Many',
				value: 'getMany',
				description: 'Retrieve multiple events',
				action: 'Get many events',
			},
			{
				name: 'Get Page URL',
				value: 'getPageUrl',
				description: 'Get the public page URL for an event',
				action: 'Get an event page URL',
			},
			{
				name: 'Search',
				value: 'search',
				description: 'Search events by keyword',
				action: 'Search events',
			},
			{
				name: 'Undo',
				value: 'undo',
				description: 'Undo a previous create, update or delete action',
				action: 'Undo an event action',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update an existing event',
				action: 'Update an event',
			},
		],
		default: 'getMany',
	},
	eventLocator({
		name: 'eventId',
		displayOptions: {
			show: {
				resource: ['event'],
				operation: ['get', 'getAuxiliaryInfo', 'update', 'delete', 'getPageUrl', 'export'],
			},
		},
	}),
	{
		displayName: 'Undo ID',
		name: 'undoId',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['event'],
				operation: ['undo'],
			},
		},
		default: '',
		required: true,
		description: 'The undo ID returned by a previous create, update or delete action',
		placeholder: 'e.g. 3f4394eb85b5609babbb',
	},
	subcalendarLocator({
		name: 'subcalendarId',
		required: false,
		description: 'Only return events of this subcalendar. Leave empty for all subcalendars.',
		displayOptions: {
			show: {
				resource: ['event'],
				operation: ['getMany'],
			},
		},
	}),
	{
		displayName: 'Start Date',
		name: 'startDate',
		type: 'dateTime',
		displayOptions: {
			show: {
				resource: ['event'],
				operation: ['getMany'],
			},
		},
		default: '',
		description: 'Get events from this date on. Leave empty to start today.',
		hint: 'Leave empty to start today',
	},
	{
		displayName: 'End Date',
		name: 'endDate',
		type: 'dateTime',
		displayOptions: {
			show: {
				resource: ['event'],
				operation: ['getMany'],
			},
		},
		default: '',
		description:
			'Get events until this date. Leave empty to get only the events of the start date.',
		hint: 'Leave empty to get only the events of the start date',
	},
	{
		displayName: 'Search Query',
		name: 'eventSearchQuery',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['event'],
				operation: ['search'],
			},
		},
		default: '',
		required: true,
		description: 'The keyword or phrase to search for (2 to 100 characters)',
	},
	{
		displayName: 'Subcalendars to Search',
		name: 'eventSearchSubcalendarIds',
		type: 'multiOptions',
		typeOptions: {
			loadOptionsMethod: 'getSubcalendars',
		},
		displayOptions: {
			show: {
				resource: ['event'],
				operation: ['search'],
			},
		},
		default: [],
		description:
			'A list of subcalendars to search in. Leave empty to search all. Choose from the list, or specify IDs using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
	},
	{
		displayName: 'Start Date',
		name: 'eventSearchStartDate',
		type: 'dateTime',
		default: '',
		description: 'Search for events starting on or after this date',
		displayOptions: {
			show: {
				resource: ['event'],
				operation: ['search'],
			},
		},
	},
	{
		displayName: 'Modified Since',
		name: 'eventChangesModifiedSince',
		type: 'dateTime',
		displayOptions: {
			show: {
				resource: ['event'],
				operation: ['getChanged'],
			},
		},
		default: '',
		required: true,
		description: 'Return events that changed after this date and time (at most 30 days ago)',
	},
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['event'],
				operation: ['getMany', 'search'],
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
				resource: ['event'],
				operation: ['getMany', 'search'],
			},
			hide: {
				returnAll: [true],
			},
		},
		typeOptions: {
			minValue: 1,
			maxValue: 1000,
		},
		default: 50,
		description: 'Max number of results to return',
	},
	subcalendarLocator({
		name: 'subcalendarId',
		description: 'The subcalendar to which this event belongs',
		displayOptions: {
			show: {
				resource: ['event'],
				operation: ['create'],
			},
		},
	}),
	{
		displayName: 'Title',
		name: 'title',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['event'],
				operation: ['create'],
			},
		},
		default: '',
		required: true,
		description: 'The title of the event',
		placeholder: 'e.g. Team Meeting',
	},
	{
		displayName: 'Start Date & Time',
		name: 'startDateTime',
		type: 'dateTime',
		displayOptions: {
			show: {
				resource: ['event'],
				operation: ['create'],
			},
		},
		default: '',
		required: true,
		description: 'When the event starts',
	},
	{
		displayName: 'End Date & Time',
		name: 'endDateTime',
		type: 'dateTime',
		displayOptions: {
			show: {
				resource: ['event'],
				operation: ['create'],
			},
		},
		default: '',
		required: true,
		description: 'When the event ends',
	},
	{
		displayName: 'Recurrence Rule (RRULE)',
		name: 'rrule',
		type: 'string',
		default: '',
		placeholder: 'e.g. FREQ=WEEKLY;BYDAY=MO,WE,FR;COUNT=10',
		description:
			'An iCal RRULE string for recurring events. RRULE generator: https://calget.com/tools/rrule-generator.',
		displayOptions: {
			show: {
				resource: ['event'],
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'Recurring Edit Mode',
		name: 'redit',
		type: 'options',
		default: 'single',
		description:
			"If updating a recurring series, choose how to apply the change. For a single, non-recurring event, leave this as 'This Single Event Only'.",
		options: [
			{
				name: 'This Single Event Only',
				value: 'single',
			},
			{
				name: 'This & Future Events',
				value: 'future',
			},
			{
				name: 'All Events in Series',
				value: 'all',
			},
		],
		displayOptions: {
			show: {
				resource: ['event'],
				operation: ['update', 'delete'],
			},
		},
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field to Update',
		default: {},
		displayOptions: {
			show: {
				resource: ['event'],
				operation: ['update'],
			},
		},
		options: sortByName([
			{
				displayName: 'All Day',
				name: 'all_day',
				type: 'boolean',
				default: false,
				description: 'Whether this is an all-day event',
			},
			{
				displayName: 'End Date & Time',
				name: 'endDateTime',
				type: 'dateTime',
				default: '',
				description: 'Update when the event ends',
			},
			{
				displayName: 'Location',
				name: 'location',
				type: 'string',
				default: '',
				description: 'Location of the event',
			},
			{
				displayName: 'Notes',
				name: 'notes',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				default: '',
				description: 'Additional notes or description for the event',
			},
			{
				displayName: 'Recurrence Rule (RRULE)',
				name: 'rrule',
				type: 'string',
				default: '',
				placeholder: 'e.g. FREQ=WEEKLY;BYDAY=MO,WE,FR;COUNT=10',
				description:
					'An iCal RRULE string for recurring events. RRULE generator: https://calget.com/tools/rrule-generator.',
			},
			{
				displayName: 'Start Date & Time',
				name: 'startDateTime',
				type: 'dateTime',
				default: '',
				description: 'Update when the event starts',
			},
			{
				displayName: 'Subcalendar Name or ID',
				name: 'subcalendarId',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getSubcalendars',
				},
				default: '',
				description:
					'Change the subcalendar. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
			},
			{
				displayName: 'Title',
				name: 'title',
				type: 'string',
				default: '',
				description: 'Update the title of the event',
				placeholder: 'e.g. Team Meeting',
			},
			{
				displayName: 'Who',
				name: 'who',
				type: 'string',
				default: '',
				description: 'People involved in the event',
			},
			...extraEventFields,
		]),
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['event'],
				operation: ['create'],
			},
		},
		options: sortByName([
			{
				displayName: 'All Day',
				name: 'all_day',
				type: 'boolean',
				default: false,
				description: 'Whether this is an all-day event',
			},
			{
				displayName: 'Location',
				name: 'location',
				type: 'string',
				default: '',
				description: 'Location of the event',
			},
			{
				displayName: 'Notes',
				name: 'notes',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				default: '',
				description: 'Additional notes or description for the event',
			},
			{
				displayName: 'Who',
				name: 'who',
				type: 'string',
				default: '',
				description: 'People involved in the event',
			},
			...extraEventFields,
		]),
	},
	{
		displayName: 'Options',
		name: 'eventOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['event'],
				operation: [
					'getMany',
					'search',
					'get',
					'getAuxiliaryInfo',
					'getChanged',
					'create',
					'update',
					'delete',
				],
			},
		},
		options: [
			{
				...inputFormatOption,
				displayOptions: { show: { '/operation': ['create', 'update'] } },
			},
			{
				...formatOption,
				displayOptions: {
					show: {
						'/operation': ['getMany', 'search', 'get', 'getAuxiliaryInfo', 'create'],
					},
				},
			},
			{
				displayName: 'Time Zone',
				name: 'tz',
				type: 'string',
				default: '',
				placeholder: 'e.g. Europe/Berlin',
				description:
					'IANA time zone for the dates of the returned events. Defaults to the calendar time zone.',
				displayOptions: { show: { '/operation': ['getMany', 'search'] } },
			},
			{
				displayName: 'End Date',
				name: 'endDate',
				type: 'dateTime',
				default: '',
				description: 'Only find events that start before this date',
				displayOptions: { show: { '/operation': ['search'] } },
			},
			{
				displayName: 'Include Short-Lived Events',
				name: 'includeShortLived',
				type: 'boolean',
				default: false,
				description:
					'Whether to also return events that were created and deleted after the Modified Since time (Teamup "monitor" mode)',
				displayOptions: { show: { '/operation': ['getChanged'] } },
			},
			{
				displayName: 'Version',
				name: 'version',
				type: 'string',
				default: '',
				description:
					'The event version for soft-locking. If set, Teamup rejects the delete when the event changed in the meantime.',
				displayOptions: { show: { '/operation': ['delete'] } },
			},
		],
	},
	simplifyParameter('event', ['get', 'getMany', 'search', 'getChanged']),
];
