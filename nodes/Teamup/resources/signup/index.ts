import type { INodeProperties } from 'n8n-workflow';
import { eventField } from '../shared';

export const signupDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: { resource: ['signup'] },
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Create a signup for an event',
				action: 'Create a signup',
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete a signup from an event',
				action: 'Delete a signup',
			},
			{
				name: 'Get Many',
				value: 'getMany',
				description: 'List signups for an event',
				action: 'Get many signups',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update a signup',
				action: 'Update a signup',
			},
		],
		default: 'getMany',
	},
	...eventField({
		name: 'signupEventId',
		legacyDescription: 'The event the signup belongs to',
		displayOptions: {
			show: { resource: ['signup'] },
		},
	}),
	{
		displayName: 'Signup ID',
		name: 'signupId',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. 654321',
		description: 'The signup to update or delete',
		displayOptions: {
			show: {
				resource: ['signup'],
				operation: ['update', 'delete'],
			},
		},
	},
	{
		displayName: 'Name',
		name: 'signupName',
		type: 'string',
		required: true,
		default: '',
		description: 'Name of the person signing up',
		displayOptions: {
			show: {
				resource: ['signup'],
				operation: ['create', 'update'],
			},
		},
	},
	{
		displayName: 'Email',
		name: 'signupEmail',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. mark@example.org',
		description: 'Email of the person signing up',
		displayOptions: {
			show: {
				resource: ['signup'],
				operation: ['create', 'update'],
			},
		},
	},
	{
		displayName: 'Remote ID',
		name: 'signupRemoteId',
		type: 'string',
		default: '',
		description: 'An optional identifier from an external system',
		displayOptions: {
			show: {
				resource: ['signup'],
				operation: ['create', 'update'],
			},
		},
	},
	{
		displayName: 'Options',
		name: 'signupOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['signup'],
				operation: ['create', 'update', 'getMany'],
			},
		},
		options: [
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
