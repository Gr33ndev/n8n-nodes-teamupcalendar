import type { INodeProperties } from 'n8n-workflow';

const roleOptions = [
	{ name: 'Add Only', value: 'add_only' },
	{ name: 'Add Only Without Details', value: 'add_only_without_details' },
	{ name: 'Admin', value: 'admin' },
	{ name: 'Modify', value: 'modify' },
	{ name: 'Modify From Same Link', value: 'modify_from_same_link' },
	{ name: 'Modify From Same Link Without Details', value: 'modify_from_same_link_without_details' },
	{ name: 'No Access', value: 'no_access' },
	{ name: 'Read Only', value: 'read_only' },
	{ name: 'Read Only Without Details', value: 'read_only_without_details' },
];

export const accessKeyDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: { resource: ['accessKey'] },
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Create a new access key',
				action: 'Create an access key',
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete an access key (cannot be undone)',
				action: 'Delete an access key',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Retrieve a single access key by ID',
				action: 'Get an access key',
			},
			{
				name: 'Get Many',
				value: 'getMany',
				description: 'Retrieve access keys for this calendar',
				action: 'Get many access keys',
			},
			{
				name: 'Patch',
				value: 'patch',
				description: 'Partially update an access key (only changed fields)',
				action: 'Patch an access key',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update an existing access key',
				action: 'Update an access key',
			},
		],
		default: 'getMany',
	},
	{
		displayName: 'Access Key ID',
		name: 'accessKeyId',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. 123',
		description: 'The access key to retrieve, update, patch or delete',
		displayOptions: {
			show: {
				resource: ['accessKey'],
				operation: ['get', 'update', 'delete', 'patch'],
			},
		},
	},
	{
		displayName: 'Name',
		name: 'accessKeyName',
		type: 'string',
		required: true,
		default: '',
		description: 'The name of the access key',
		displayOptions: {
			show: {
				resource: ['accessKey'],
				operation: ['create', 'update'],
			},
		},
	},
	{
		displayName: 'Subcalendar Permissions (JSON)',
		name: 'accessKeySubcalendarPermissions',
		type: 'json',
		required: true,
		default: '{}',
		description:
			'A JSON object mapping subcalendar IDs to a role, e.g. {"12345":"modify","67890":"read_only"}. Valid roles: modify, modify_from_same_link, add_only, read_only, no_access and their _without_details variants. Used when Share Type is Selected Subcalendars.',
		displayOptions: {
			show: {
				resource: ['accessKey'],
				operation: ['create', 'update'],
			},
		},
	},
	{
		displayName: 'Additional Fields',
		name: 'accessKeyAdditionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['accessKey'],
				operation: ['create', 'update'],
			},
		},
		options: [
			{
				displayName: 'Active',
				name: 'active',
				type: 'boolean',
				default: true,
				description: 'Whether the access key can be used',
			},
			{
				displayName: 'Admin',
				name: 'admin',
				type: 'boolean',
				default: false,
				description: 'Whether the access key has administrator rights',
			},
			{
				displayName: 'Password',
				name: 'password',
				type: 'string',
				typeOptions: { password: true },
				default: '',
				description: 'Password for the access key, used together with Require Password',
			},
			{
				displayName: 'Require Password',
				name: 'require_password',
				type: 'boolean',
				default: false,
				description: 'Whether a password is required to use the access key',
			},
			{
				displayName: 'Role',
				name: 'role',
				type: 'options',
				options: roleOptions,
				default: 'read_only',
				description: 'The permission level of the access key',
			},
			{
				displayName: 'Share Type',
				name: 'share_type',
				type: 'options',
				options: [
					{ name: 'All Subcalendars', value: 'all_subcalendars' },
					{ name: 'Selected Subcalendars', value: 'selected_subcalendars' },
				],
				default: 'all_subcalendars',
				description: 'Whether the key gives access to all subcalendars or only the selected ones',
			},
		],
	},
	{
		displayName: 'Patch Fields (JSON)',
		name: 'accessKeyPatchFields',
		type: 'json',
		required: true,
		default: '{}',
		description:
			'A JSON object of the access-key fields to change. Example: {"name":"New name","active":false}.',
		displayOptions: {
			show: {
				resource: ['accessKey'],
				operation: ['patch'],
			},
		},
	},
	{
		displayName: 'Filter By',
		name: 'accessKeyFilterBy',
		type: 'string',
		default: '',
		description: 'Filter access keys by link name, user or group name',
		displayOptions: {
			show: {
				resource: ['accessKey'],
				operation: ['getMany'],
			},
		},
	},
	{
		displayName: 'Type',
		name: 'accessKeyType',
		type: 'options',
		default: '',
		options: [
			{ name: 'All', value: '' },
			{ name: 'Anonymous', value: 'anonymous' },
			{ name: 'User', value: 'user' },
			{ name: 'Group', value: 'group' },
		],
		description: 'Filter access keys by type',
		displayOptions: {
			show: {
				resource: ['accessKey'],
				operation: ['getMany'],
			},
		},
	},
	{
		displayName: 'Limit',
		name: 'accessKeyLimit',
		type: 'number',
		typeOptions: { minValue: 0 },
		default: 0,
		description: 'Max number of access keys to return (0 = no limit)',
		displayOptions: {
			show: {
				resource: ['accessKey'],
				operation: ['getMany'],
			},
		},
	},
];
