import {
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

import { create as createEvent } from './resources/event/create';
import { update as updateEvent } from './resources/event/update';
import { deleteEvent } from './resources/event/delete';
import { getMany as getManyEvents } from './resources/event/getMany';
import { getMany as getManySubcalendars } from './resources/subcalendar/getMany';

function getErrorMessage(error: unknown): string {
	if (error instanceof Error) return error.message;
	return String(error);
}

async function loadSubcalendars(context: ILoadOptionsFunctions) {
	try {
		const credentials = await context.getCredentials('teamupApi');
		const token = credentials.token as string;
		const calendarKey = credentials.calendarKey as string;

		const response = await context.helpers.httpRequest({
			method: 'GET',
			url: `https://api.teamup.com/${calendarKey}/subcalendars`,
			headers: {
				'Teamup-Token': token,
				'Accept': 'application/json',
				'User-Agent': 'n8n-teamup-node/0.1.0',
			},
			json: true,
		}) as { subcalendars: Array<{ id: string | number; name: string }> };

		return (response.subcalendars || []).map((sc) => ({
			name: sc.name,
			value: String(sc.id),
		}));
	} catch (error) {
		throw new NodeOperationError(context.getNode(), `Failed to load subcalendars: ${getErrorMessage(error)}`);
	}
}

export class Teamup implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Teamup',
		name: 'teamup',
		icon: { light: 'file:teamup.svg', dark: 'file:teamup.dark.svg' },
		group: ['input', 'output'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with the Teamup Calendar API',
		defaults: {
			name: 'Teamup',
		},
		inputs: ['main'],
		outputs: ['main'],
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
						name: 'Event',
						value: 'event',
						description: 'Work with calendar events',
					},
					{
						name: 'Subcalendar',
						value: 'subcalendar',
						description: 'Work with subcalendars',
					},
				],
				default: 'event',
			},
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
						name: 'Get Many',
						value: 'getMany',
						description: 'Retrieve multiple events',
						action: 'Get many events',
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
						name: 'Get Many',
						value: 'getMany',
						description: 'Retrieve all subcalendars',
						action: 'Get many subcalendars',
					},
				],
				default: 'getMany',
			},
			{
				displayName: 'Event ID',
				name: 'eventId',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['event'],
						operation: ['update', 'delete'],
					},
				},
				default: '',
				required: true,
				description: 'The unique identifier of the event',
				placeholder: '1234567890',
			},
			{
				displayName: 'Subcalendar Name or ID',
				name: 'subcalendarId',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getSubcalendars',
				},
				displayOptions: {
					show: {
						resource: ['event'],
						operation: ['getMany'],
					},
				},
				default: '',
				description: 'Filter events by a specific subcalendar (leave empty for all). Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
			},
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
				description: 'Get events that start on or after this date/time (leave empty to start from now)',
				hint: 'Leave empty to get events from now on',
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
				description: 'Get events that start before this date/time (leave empty for no end date)',
				hint: 'Leave empty to get only events until midnight',
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				displayOptions: {
					show: {
						resource: ['event'],
						operation: ['getMany'],
					},
				},
				typeOptions: {
					minValue: 1,
					maxValue: 1000,
				},
				default: 50,
				description: 'Max number of results to return',
			},
			{
				displayName: 'Subcalendar Name or ID',
				name: 'subcalendarId',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getSubcalendars',
				},
				displayOptions: {
					show: {
						resource: ['event'],
						operation: ['create'],
					},
				},
				default: '',
				required: true,
				description: 'The subcalendar to which this event belongs. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
			},
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
				placeholder: 'Team Meeting',
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
				options: [
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
						description: 'Change the subcalendar. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
					},
					{
						displayName: 'Title',
						name: 'title',
						type: 'string',
						default: '',
						description: 'Update the title of the event',
						placeholder: 'Team Meeting',
					},
					{
						displayName: 'Who',
						name: 'who',
						type: 'string',
						default: '',
						description: 'People involved in the event',
					},
				],
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
						operation: ['create', 'update'],
					},
				},
				options: [
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
				],
			},
		],
		usableAsTool: true,
	};

	methods = {
		loadOptions: {
			async getSubcalendars(this: ILoadOptionsFunctions) {
				return await loadSubcalendars(this);
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
				let results: INodeExecutionData | INodeExecutionData[];

				if (resource === 'event') {
					switch (operation) {
						case 'create':
							results = await createEvent(this, i);
							returnData.push(results);
							break;
						case 'update':
							results = await updateEvent(this, i);
							returnData.push(results);
							break;
						case 'delete':
							results = await deleteEvent(this, i);
							returnData.push(results);
							break;
						case 'getMany':
							results = await getManyEvents(this, i);
							returnData.push(...results);
							break;
						default:
							throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`, { itemIndex: i });
					}
				} else if (resource === 'subcalendar') {
					switch (operation) {
						case 'getMany':
							results = await getManySubcalendars(this, i);
							returnData.push(...results);
							break;
						default:
							throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`, { itemIndex: i });
					}
				} else {
					throw new NodeOperationError(this.getNode(), `Unknown resource: ${resource}`, { itemIndex: i });
				}

			} catch (error) {
				const errorMessage = getErrorMessage(error);

				if (this.continueOnFail()) {
					returnData.push({
						json: { error: errorMessage },
						pairedItem: { item: i },
					});
					continue;
				}

				throw new NodeOperationError(
					this.getNode(),
					`Error processing item ${i}: ${errorMessage}`,
					{ itemIndex: i }
				);
			}
		}

		return [returnData];
	}
}