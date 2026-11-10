import type { INodeProperties } from 'n8n-workflow';
import { eventLocator, subcalendarLocator } from '../shared';

export const reminderDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: { resource: ['reminder'] },
		},
		options: [
			{
				name: 'Get Defaults',
				value: 'getDefaults',
				description: 'Get the default reminders of all subcalendars for the current user',
				action: 'Get default reminders',
			},
			{
				name: 'Get Subcalendar Defaults',
				value: 'getSubcalendarDefaults',
				description: 'Get the default reminders of one subcalendar',
				action: 'Get default reminders of a subcalendar',
			},
			{
				name: 'Set Event Reminders',
				value: 'setEventReminders',
				description: 'Replace the reminders of an event for the current user',
				action: 'Set reminders of an event',
			},
			{
				name: 'Set Subcalendar Defaults',
				value: 'setSubcalendarDefaults',
				description: 'Replace the default reminders of one subcalendar',
				action: 'Set default reminders of a subcalendar',
			},
		],
		default: 'getDefaults',
	},
	subcalendarLocator({
		name: 'reminderSubcalendarId',
		description: 'The subcalendar whose default reminders to use',
		displayOptions: {
			show: {
				resource: ['reminder'],
				operation: ['getSubcalendarDefaults', 'setSubcalendarDefaults'],
			},
		},
	}),
	eventLocator({
		name: 'reminderEventId',
		displayOptions: {
			show: {
				resource: ['reminder'],
				operation: ['setEventReminders'],
			},
		},
	}),
	{
		displayName: 'Reminders',
		name: 'reminders',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true },
		placeholder: 'Add Reminder',
		default: {},
		description:
			'The complete list of reminders. Existing reminders that are not listed are removed.',
		displayOptions: {
			show: {
				resource: ['reminder'],
				operation: ['setEventReminders', 'setSubcalendarDefaults'],
			},
		},
		options: [
			{
				displayName: 'Reminder',
				name: 'reminder',
				values: [
					{
						displayName: 'All-Day Events',
						name: 'all_day',
						type: 'boolean',
						default: false,
						description:
							'Whether this default reminder applies to all-day events (only for subcalendar defaults)',
					},
					{
						displayName: 'Offset',
						name: 'offset',
						type: 'string',
						default: 'PT15M',
						placeholder: 'e.g. PT15M',
						description:
							'How long before the event the reminder is sent, as an ISO-8601 duration (PT15M	=	15 minutes, P1D	=	1 day)',
					},
					{
						displayName: 'Reminder ID',
						name: 'id',
						type: 'number',
						default: 0,
						description:
							'ID of an existing default reminder to keep. Leave at 0 to create a new one (only for subcalendar defaults).',
					},
					{
						displayName: 'Time of Day',
						name: 'time_of_day',
						type: 'string',
						default: '',
						placeholder: 'e.g. 09:00',
						description: 'For all-day events:	the time of day the reminder is sent (24h format)',
					},
					{
						displayName: 'Time Zone',
						name: 'tz',
						type: 'string',
						default: '',
						placeholder: 'e.g. Europe/Berlin',
						description: 'Time zone used for the reminder. Defaults to the workflow time zone.',
					},
					{
						displayName: 'Transport',
						name: 'transport',
						type: 'string',
						default: 'email',
						description: 'How the reminder is delivered',
					},
				],
			},
		],
	},
];
