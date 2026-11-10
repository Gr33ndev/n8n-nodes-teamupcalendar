import type { INodeProperties } from 'n8n-workflow';
import { eventLocator, formatOption, inputFormatOption } from '../shared';

export const commentDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: { resource: ['comment'] },
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Add a comment to an event',
				action: 'Create a comment',
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete a comment from an event',
				action: 'Delete a comment',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update a comment',
				action: 'Update a comment',
			},
		],
		default: 'create',
	},
	eventLocator({
		name: 'commentEventId',
		displayOptions: {
			show: { resource: ['comment'] },
		},
	}),
	{
		displayName: 'Comment ID',
		name: 'commentId',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. 4321',
		description: 'The comment to update or delete',
		displayOptions: {
			show: {
				resource: ['comment'],
				operation: ['update', 'delete'],
			},
		},
	},
	{
		displayName: 'Message',
		name: 'commentMessage',
		type: 'string',
		typeOptions: { rows: 4 },
		required: true,
		default: '',
		description: 'The text of the comment',
		displayOptions: {
			show: {
				resource: ['comment'],
				operation: ['create', 'update'],
			},
		},
	},
	{
		displayName: 'Additional Fields',
		name: 'commentAdditionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['comment'],
				operation: ['create', 'update'],
			},
		},
		options: [
			{
				displayName: 'Email',
				name: 'email',
				type: 'string',
				placeholder: 'e.g. mark@example.org',
				default: '',
				description: 'Email of the comment author. Either name or email must be set.',
			},
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				description: 'Name of the comment author. Either name or email must be set.',
			},
		],
	},
	{
		displayName: 'Options',
		name: 'commentOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['comment'],
				operation: ['create', 'update'],
			},
		},
		options: [
			inputFormatOption,
			{ ...formatOption, displayName: 'Output Format' },
			{
				displayName: 'Time Zone',
				name: 'clientTimezone',
				type: 'string',
				default: '',
				placeholder: 'e.g. Europe/Berlin',
				description:
					'Time zone for the returned creation and update times. Defaults to the calendar time zone.',
			},
		],
	},
];
