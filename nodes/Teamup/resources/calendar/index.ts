import type { INodeProperties } from 'n8n-workflow';

export const calendarDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: { resource: ['calendar'] },
		},
		options: [
			{
				name: 'Check Access',
				value: 'checkAccess',
				description: 'Check that the Teamup API key is valid',
				action: 'Check API access',
			},
			{
				name: 'Duplicate',
				value: 'duplicate',
				description: 'Duplicate this calendar (subcalendars + configuration, not events)',
				action: 'Duplicate a calendar',
			},
			{
				name: 'Get Attachment Upload URL',
				value: 'getUploadUrl',
				description: 'Get a short-lived URL to upload attachment files to',
				action: 'Get an attachment upload URL',
			},
			{
				name: 'Get Configuration',
				value: 'getConfiguration',
				description: 'Retrieve the calendar configuration',
				action: 'Get the calendar configuration',
			},
		],
		default: 'getConfiguration',
	},
	{
		displayName: 'Title',
		name: 'calendarDuplicateTitle',
		type: 'string',
		default: '',
		description:
			'Title of the duplicated calendar. If empty, the source title is copied with a "(copy)" suffix.',
		displayOptions: {
			show: {
				resource: ['calendar'],
				operation: ['duplicate'],
			},
		},
	},
	{
		displayName: 'Copy Configuration',
		name: 'calendarCopyConfiguration',
		type: 'boolean',
		default: true,
		description: 'Whether to copy the source calendar configuration',
		displayOptions: {
			show: {
				resource: ['calendar'],
				operation: ['duplicate'],
			},
		},
	},
	{
		displayName: 'Copy Subcalendars',
		name: 'calendarCopySubcalendars',
		type: 'boolean',
		default: true,
		description: 'Whether to copy the source calendar subcalendars',
		displayOptions: {
			show: {
				resource: ['calendar'],
				operation: ['duplicate'],
			},
		},
	},
];
