import {
	NodeConnectionTypes,
	type IDataObject,
	type ILoadOptionsFunctions,
	type INodeExecutionData,
	type INodePropertyOptions,
	type INodeType,
	type INodeTypeDescription,
	type IPollFunctions,
} from 'n8n-workflow';

import { simplifyEvent } from './resources/shared';
import { CALENDAR_OVERRIDE_PARAMETER, teamupRequest } from './utils';

/** Teamup only returns changes of the last 30 days. Stay a bit below that. */
const MAX_LOOKBACK_SECONDS = 29 * 24 * 60 * 60;
/** Look-back for manual test runs when the trigger has no state yet. */
const MANUAL_LOOKBACK_SECONDS = 7 * 24 * 60 * 60;

type ChangeType = 'created' | 'updated' | 'deleted';

function getChangeType(event: IDataObject, since: number): ChangeType {
	if (event.delete_dt) return 'deleted';
	const created = Date.parse(String(event.creation_dt ?? ''));
	if (!isNaN(created) && created / 1000 >= since) return 'created';
	return 'updated';
}

export class TeamupTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Teamup Trigger',
		name: 'teamupTrigger',
		icon: { light: 'file:teamup.svg', dark: 'file:teamup.dark.svg' },
		group: ['trigger'],
		version: 1,
		subtitle: '={{"Events: " + $parameter["events"].join(", ")}}',
		description:
			'Starts the workflow when events in a Teamup calendar are created, updated or deleted',
		defaults: {
			name: 'Teamup Trigger',
		},
		polling: true,
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'teamupApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Trigger On',
				name: 'events',
				type: 'multiOptions',
				required: true,
				options: [
					{
						name: 'Event Created',
						value: 'created',
					},
					{
						name: 'Event Deleted',
						value: 'deleted',
					},
					{
						name: 'Event Updated',
						value: 'updated',
					},
				],
				default: ['created', 'updated', 'deleted'],
				description: 'Which changes start the workflow',
			},
			{
				displayName: 'Subcalendar Names or IDs',
				name: 'subcalendarIds',
				type: 'multiOptions',
				typeOptions: {
					loadOptionsMethod: 'getSubcalendars',
				},
				default: [],
				description:
					'Only trigger for events in these subcalendars. Leave empty for all. Choose from the list, or specify IDs using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
			},
			{
				displayName: 'Simplify',
				name: 'simplify',
				type: 'boolean',
				default: false,
				description:
					'Whether to return a simplified version of the response instead of the raw data',
			},
			{
				displayName: 'Calendar Key or ID',
				name: CALENDAR_OVERRIDE_PARAMETER,
				type: 'string',
				default: '',
				placeholder: 'e.g. ks1234567890abcdef',
				description:
					'Watch another calendar than the one in the credential. Leave empty to use the calendar key from the credential.',
			},
		],
	};

	methods = {
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

	async poll(this: IPollFunctions): Promise<INodeExecutionData[][] | null> {
		const staticData = this.getWorkflowStaticData('node');
		const isManual = this.getMode() === 'manual';
		const now = Math.floor(Date.now() / 1000);

		let since = staticData.lastTimestamp as number | undefined;
		if (since === undefined) {
			if (!isManual) {
				// First run after activation: only report changes from now on.
				staticData.lastTimestamp = now;
				return null;
			}
			since = now - MANUAL_LOOKBACK_SECONDS;
		}
		since = Math.max(since, now - MAX_LOOKBACK_SECONDS);

		const response = await teamupRequest<{ events?: IDataObject[]; timestamp?: number }>(this, {
			method: 'GET',
			path: '/events',
			// "monitor" also returns events that were created and deleted since the last poll.
			qs: { modifiedSince: since, mode: 'monitor' },
		});

		if (!isManual) {
			staticData.lastTimestamp = response.timestamp ?? now;
		}

		const wanted = this.getNodeParameter('events', []) as ChangeType[];
		const subcalendarIds = (this.getNodeParameter('subcalendarIds', []) as string[]).map(String);
		const simplify = this.getNodeParameter('simplify', false) as boolean;

		const items: INodeExecutionData[] = [];
		for (const event of response.events ?? []) {
			const changeType = getChangeType(event, since);
			if (!wanted.includes(changeType)) continue;
			if (subcalendarIds.length > 0) {
				const eventSubcalendars = ((event.subcalendar_ids as Array<string | number>) ?? []).map(
					String,
				);
				if (!eventSubcalendars.some((id) => subcalendarIds.includes(id))) continue;
			}
			const data = simplify ? simplifyEvent(event) : event;
			items.push({ json: { ...data, changeType } });
		}

		if (items.length === 0) return null;
		return [items];
	}
}
