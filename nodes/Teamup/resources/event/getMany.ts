import { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';

interface TeamupCredentials {
	token: string;
	calendarKey: string;
}

interface TeamupEvent {
	id: string;
	title: string;
	start_dt: string;
	end_dt: string;
	subcalendar_id?: number;
	[key: string]: unknown;
}

async function getCredentials(context: IExecuteFunctions): Promise<TeamupCredentials> {
	const credentials = await context.getCredentials('teamupApi');
	return {
		token: credentials.token as string,
		calendarKey: credentials.calendarKey as string,
	};
}

function formatDateTime(dateStr: string): string {
	if (!dateStr) return dateStr;
	return dateStr.replace(/\.\d{3}Z?$/, '').replace('Z', '');
}

function formatTodayDate(): string {
	const today = new Date();
	const year = today.getFullYear();
	const month = String(today.getMonth() + 1).padStart(2, '0');
	const day = String(today.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

export async function getMany(context: IExecuteFunctions, itemIndex: number): Promise<INodeExecutionData[]> {
	const { token, calendarKey } = await getCredentials(context);

	const subcalendarId = context.getNodeParameter('subcalendarId', itemIndex, '') as string;
	const startDateParam = context.getNodeParameter('startDate', itemIndex, '');
	const endDateParam = context.getNodeParameter('endDate', itemIndex, '');
	const limit = context.getNodeParameter('limit', itemIndex, 50) as number;

	const queryParams: string[] = [];

	const startDateStr = startDateParam ? String(startDateParam).trim() : '';
	const endDateStr = endDateParam ? String(endDateParam).trim() : '';

	if (startDateStr) {
		const startDate = formatDateTime(startDateStr);
		queryParams.push(`startDate=${encodeURIComponent(startDate)}`);
	} else {
		const today = formatTodayDate();
		queryParams.push(`startDate=${encodeURIComponent(today)}`);
	}

	if (endDateStr) {
		const endDate = formatDateTime(endDateStr);
		queryParams.push(`endDate=${encodeURIComponent(endDate)}`);
	}

	if (subcalendarId) {
		queryParams.push(`subcalendarId[]=${encodeURIComponent(subcalendarId)}`);
	}

	const url = queryParams.length > 0
		? `https://api.teamup.com/${calendarKey}/events?${queryParams.join('&')}`
		: `https://api.teamup.com/${calendarKey}/events`;

	const response = await context.helpers.httpRequest({
		method: 'GET',
		url,
		headers: {
			'Teamup-Token': token,
			'Accept': 'application/json',
			'User-Agent': 'n8n-teamup-node/0.1.0',
		},
		json: true,
	}) as { events: TeamupEvent[] };

	let events = response.events || [];

	if (events.length > limit) {
		events = events.slice(0, limit);
	}

	return events.map(event => ({
		json: event as IDataObject,
		pairedItem: { item: itemIndex },
	}));
}