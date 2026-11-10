// Integration test against the real Teamup API.
// Runs the built node (dist/) with a minimal fake n8n context.
// Usage: npm run build && node test/integration.js
// Reads TEAMUP_TOKEN, TEAMUP_CALENDAR_KEY (and optional TEAMUP_EMAIL / TEAMUP_PASSWORD) from .env.test.

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const env = {};
for (const line of fs.readFileSync(path.join(root, '.env.test'), 'utf8').split('\n')) {
	const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
	if (m) env[m[1]] = m[2];
}
if (!env.TEAMUP_TOKEN || !env.TEAMUP_CALENDAR_KEY) {
	console.error('Set TEAMUP_TOKEN and TEAMUP_CALENDAR_KEY in .env.test');
	process.exit(2);
}

const { Teamup } = require(path.join(root, 'dist/nodes/Teamup/Teamup.node.js'));
const { TeamupTrigger } = require(path.join(root, 'dist/nodes/Teamup/TeamupTrigger.node.js'));
const { TeamupApi } = require(path.join(root, 'dist/credentials/TeamupApi.credentials.js'));
const { NodeApiError } = require('n8n-workflow');
const listSearch = require(path.join(root, 'dist/nodes/Teamup/listSearch.js'));
const rl = (value, mode = 'id') => ({ __rl: true, mode, value: String(value) });

const credentialType = new TeamupApi();
const TIMEZONE = 'Europe/Berlin';

// ---- minimal HTTP helper (behaves like n8n's httpRequest for what the node uses)
async function httpRequest(opts) {
	const headers = { ...(opts.headers || {}) };
	let body = opts.body;
	if (body !== undefined && typeof body !== 'string') body = JSON.stringify(body);
	const res = await fetch(opts.url, { method: opts.method || 'GET', headers, body });
	const text = await res.text();
	let data = text;
	if (opts.json !== false && opts.encoding !== 'text') {
		try {
			data = text ? JSON.parse(text) : {};
		} catch {
			data = text;
		}
	}
	if (!res.ok) {
		const err = new Error(`Request failed with status code ${res.status}`);
		err.response = { status: res.status, data };
		err.httpCode = String(res.status);
		throw err;
	}
	if (opts.returnFullResponse) {
		return {
			body: data,
			headers: Object.fromEntries(res.headers.entries()),
			statusCode: res.status,
			redirected: res.redirected,
			url: res.url,
		};
	}
	return data;
}

function makeCredentials(withUser) {
	return {
		token: env.TEAMUP_TOKEN,
		calendarKey: env.TEAMUP_CALENDAR_KEY,
		email: withUser ? env.TEAMUP_EMAIL : '',
		password: withUser ? env.TEAMUP_PASSWORD : '',
		sessionToken: '',
	};
}

async function httpRequestWithAuthentication(credentials, opts) {
	if (!credentials.sessionToken) {
		Object.assign(
			credentials,
			await credentialType.preAuthentication.call({ helpers: { httpRequest } }, credentials),
		);
	}
	const authed = await credentialType.authenticate(credentials, opts);
	return httpRequest(authed);
}

const useUser = Boolean(env.TEAMUP_EMAIL && env.TEAMUP_PASSWORD);
const sharedCredentials = makeCredentials(useUser);
console.log(`INFO  auth: ${useUser ? 'API key + calendar key + user login (bearer)' : 'API key + calendar key'}`);

function makeContext(params, { credentials, staticData = {}, mode = 'manual' } = {}) {
	credentials = credentials || sharedCredentials;
	const node = { name: 'Teamup', type: 'teamup', typeVersion: 1, parameters: params };
	return {
		getNode: () => node,
		getNodeParameter: (name, a, b) =>
			name in params ? params[name] : typeof a === 'number' ? b : a,
		getCurrentNodeParameter: undefined,
		getCredentials: async () => credentials,
		getInputData: () => [{ json: {} }],
		getTimezone: () => TIMEZONE,
		continueOnFail: () => false,
		getWorkflowStaticData: () => staticData,
		getMode: () => mode,
		helpers: {
			httpRequest,
			httpRequestWithAuthentication: (_name, opts) =>
				httpRequestWithAuthentication(credentials, opts),
		},
	};
}

const calendarOverride = useUser && env.TEAMUP_CALENDAR_ID ? env.TEAMUP_CALENDAR_ID : '';
if (calendarOverride) console.log(`INFO  using calendar ID ${calendarOverride} via the "Calendar Key or ID" field`);

async function run(params, options) {
	if (calendarOverride && !('calendarKeyOverride' in params)) params = { ...params, calendarKeyOverride: calendarOverride };
	const ctx = makeContext(params, options);
	delete ctx.getCurrentNodeParameter;
	const [items] = await new Teamup().execute.call(ctx);
	return items.map((i) => i.json);
}

// ---- tiny test runner
const results = [];
async function step(name, fn) {
	try {
		const info = await fn();
		results.push({ name, ok: true, info });
		console.log(`PASS  ${name}${info ? `  (${info})` : ''}`);
	} catch (error) {
		const detail =
			error instanceof NodeApiError
				? `${error.message} | ${error.description ?? ''} | HTTP ${error.httpCode}`
				: error.message;
		results.push({ name, ok: false, info: detail });
		console.log(`FAIL  ${name}  -> ${detail}`);
	}
}
function assert(cond, msg) {
	if (!cond) throw new Error(`Assertion failed: ${msg}`);
}

(async () => {
	const stamp = Date.now();
	const state = {};
	const startUtc = '2026-12-01T10:00:00.000Z';
	const endUtc = '2026-12-01T11:00:00.000Z';

	await step('calendar.checkAccess', async () => {
		const [r] = await run({ resource: 'calendar', operation: 'checkAccess' });
		return JSON.stringify(r);
	});
	await step('calendar.getConfiguration', async () => {
		const [r] = await run({ resource: 'calendar', operation: 'getConfiguration' });
		state.calendarTz = r?.configuration?.general_settings?.timezone ?? r?.configuration?.timezone;
		return `keys: ${Object.keys(r.configuration ?? r).slice(0, 6).join(',')}`;
	});
	await step('calendar.getUploadUrl', async () => {
		const [r] = await run({ resource: 'calendar', operation: 'getUploadUrl' });
		assert(r.uploadUrl, `no upload url: ${JSON.stringify(r)}`);
		return r.uploadUrl.slice(0, 40) + '…';
	});

	await step('subcalendar.getMany (returnAll)', async () => {
		const r = await run({ resource: 'subcalendar', operation: 'getMany', returnAll: true });
		state.initialSubcalendars = r.length;
		state.fallbackSubId = r.find((s) => !s.readonly && s.active !== false)?.id ?? r[0]?.id;
		return `${r.length} subcalendars`;
	});
	await step('subcalendar.getMany (limit 1)', async () => {
		const r = await run({ resource: 'subcalendar', operation: 'getMany', returnAll: false, limit: 1 });
		assert(r.length === 1, `expected 1, got ${r.length}`);
	});
	await step('subcalendar.create', async () => {
		const r = await run({
			resource: 'subcalendar',
			operation: 'create',
			name: `n8n-test-${stamp}`,
			color: 5,
			active: true,
			overlap: true,
			subcalendarAdditionalFields: { remote_id: `remote-${stamp}` },
		});
		state.subId = r[0].id;
		assert(state.subId, 'no id');
		return `id ${state.subId}, remote_id ${r[0].remote_id}`;
	});
	await step('subcalendar.get', async () => {
		const [r] = await run({ resource: 'subcalendar', operation: 'get', subcalendarId: rl(state.subId, 'list') });
		assert(String(r.id) === String(state.subId), 'wrong id');
	});
	await step('subcalendar.patch', async () => {
		const [r] = await run({
			resource: 'subcalendar',
			operation: 'patch',
			subcalendarId: String(state.subId),
			subcalendarUpdateFields: { name: `n8n-test-${stamp}-patched` },
		});
		assert(r.name.endsWith('-patched'), `name ${r.name}`);
	});
	await step('subcalendar.update', async () => {
		const [r] = await run({
			resource: 'subcalendar',
			operation: 'update',
			subcalendarId: String(state.subId),
			subcalendarUpdateFields: { color: 7 },
		});
		assert(r.color === 7, `color ${r.color}`);
	});
	await step('subcalendar.getMany filter', async () => {
		const r = await run({
			resource: 'subcalendar',
			operation: 'getMany',
			returnAll: true,
			subcalendarFilters: { filterBy: `n8n-test-${stamp}` },
		});
		return `${r.length} match(es)`;
	});

	if (!state.subId) {
		state.subId = state.fallbackSubId;
		state.usingFallbackSubcalendar = true;
		console.log(`INFO  using existing subcalendar ${state.subId} for event tests`);
	}

	await step('event.create (UTC time zone kept)', async () => {
		const [r] = await run({
			resource: 'event',
			operation: 'create',
			subcalendarId: String(state.subId),
			title: `n8n test event ${stamp}`,
			startDateTime: startUtc,
			endDateTime: endUtc,
			rrule: '',
			additionalFields: {
				location: 'Testraum',
				notes: '**Markdown** notes',
				signup_enabled: true,
				signup_limit: 10,
				comments_enabled: true,
				remote_id: `ev-${stamp}`,
			},
			eventOptions: { inputFormat: 'markdown' },
		});
		state.event = r.event;
		state.eventId = r.event.id;
		const same = Date.parse(r.event.start_dt) === Date.parse(startUtc);
		assert(same, `start_dt ${r.event.start_dt} != ${startUtc}`);
		return `id ${state.eventId}, start_dt ${r.event.start_dt}, undo ${r.undo_id}`;
	});
	await step('event.get (simplify)', async () => {
		const [r] = await run({ resource: 'event', operation: 'get', eventId: rl(state.eventId), simplify: true });
		assert(Object.keys(r).length <= 10, 'not simplified');
		return Object.keys(r).join(',');
	});
	await step('event.get (markdown format)', async () => {
		const [r] = await run({
			resource: 'event',
			operation: 'get',
			eventId: state.eventId,
			eventOptions: { format: 'markdown' },
		});
		return `notes: ${JSON.stringify(r.notes)}`;
	});
	await step('event.getMany', async () => {
		const r = await run({
			resource: 'event',
			operation: 'getMany',
			subcalendarId: String(state.subId),
			startDate: '2026-12-01T00:00:00',
			endDate: '2026-12-02T00:00:00',
			limit: 50,
		});
		assert(r.some((e) => e.id === state.eventId), `event not found among ${r.length}`);
		return `${r.length} event(s)`;
	});
	await step('event.getMany (defaults: today)', async () => {
		const r = await run({ resource: 'event', operation: 'getMany', limit: 5 });
		return `${r.length} event(s) today`;
	});
	await step('event.search', async () => {
		const r = await run({
			resource: 'event',
			operation: 'search',
			eventSearchQuery: `${stamp}`,
			eventSearchStartDate: '2026-11-01T00:00:00',
			eventOptions: { endDate: '2027-01-01T00:00:00' },
			returnAll: true,
		});
		return `${r.length} hit(s)${r.some((e) => e.id === state.eventId) ? ', contains test event' : ', test event NOT found'}`;
	});
	const loadCtx = () => {
		const ctx = makeContext({});
		ctx.getCurrentNodeParameter = (name) => (name === 'calendarKeyOverride' ? calendarOverride : undefined);
		delete ctx.getInputData;
		return ctx;
	};
	await step('listSearch.searchSubcalendars', async () => {
		const r = await listSearch.searchSubcalendars.call(loadCtx(), `n8n-test-${stamp}`);
		assert(r.results.some((x) => x.value === String(state.subId)), `not found in ${JSON.stringify(r.results).slice(0, 200)}`);
		return `${r.results.length} result(s): ${r.results[0]?.name}`;
	});
	await step('listSearch.searchEvents (search term)', async () => {
		const r = await listSearch.searchEvents.call(loadCtx(), String(stamp));
		assert(r.results.some((x) => x.value === String(state.eventId)), `not found in ${r.results.length} results`);
		return r.results.find((x) => x.value === String(state.eventId)).name;
	});
	await step('listSearch.searchEvents (no term)', async () => {
		const r = await listSearch.searchEvents.call(loadCtx(), '');
		return `${r.results.length} upcoming event(s)`;
	});
	await step('event.update', async () => {
		const [r] = await run({
			resource: 'event',
			operation: 'update',
			eventId: state.eventId,
			redit: 'single',
			updateFields: { title: `n8n test event ${stamp} (updated)`, endDateTime: '2026-12-01T12:00:00Z' },
		});
		assert(r.event.title.endsWith('(updated)'), 'title not updated');
		assert(Date.parse(r.event.end_dt) === Date.parse('2026-12-01T12:00:00Z'), `end_dt ${r.event.end_dt}`);
		state.event = r.event;
		return `version ${r.event.version}`;
	});
	await step('event.getAuxiliaryInfo', async () => {
		const [r] = await run({ resource: 'event', operation: 'getAuxiliaryInfo', eventId: state.eventId });
		return Object.keys(r).join(',');
	});
	await step('event.getPageUrl', async () => {
		const [r] = await run({ resource: 'event', operation: 'getPageUrl', eventId: state.eventId });
		return r.url;
	});
	await step('event.export', async () => {
		const [r] = await run({ resource: 'event', operation: 'export', eventId: state.eventId });
		assert(String(r.ics).includes('BEGIN:VCALENDAR'), `not ics: ${String(r.ics).slice(0, 80)}`);
	});

	await step('signup.create', async () => {
		const [r] = await run({
			resource: 'signup',
			operation: 'create',
			signupEventId: state.eventId,
			signupName: 'Test Person',
			signupEmail: 'test@example.org',
			signupRemoteId: '',
		});
		state.signupId = r.id;
		assert(state.signupId, `no id: ${JSON.stringify(r)}`);
		return `id ${state.signupId}`;
	});
	await step('signup.getMany', async () => {
		const r = await run({ resource: 'signup', operation: 'getMany', signupEventId: rl(state.eventId, 'list') });
		assert(r.length >= 1, `got ${r.length}: ${JSON.stringify(r).slice(0, 200)}`);
		return `${r.length} signup(s)`;
	});
	await step('signup.update', async () => {
		const [r] = await run({
			resource: 'signup',
			operation: 'update',
			signupEventId: state.eventId,
			signupId: String(state.signupId),
			signupName: 'Test Person 2',
			signupEmail: 'test@example.org',
			signupRemoteId: 'r1',
		});
		return `name ${r.name}`;
	});
	await step('signup.delete', async () => {
		await run({ resource: 'signup', operation: 'delete', signupEventId: state.eventId, signupId: String(state.signupId) });
	});

	await step('comment.create', async () => {
		const [r] = await run({
			resource: 'comment',
			operation: 'create',
			commentEventId: state.eventId,
			commentMessage: 'Hello from **n8n**',
			commentAdditionalFields: { name: 'n8n Test' },
			commentOptions: { inputFormat: 'markdown' },
		});
		state.commentId = r.id ?? r.comment?.id;
		assert(state.commentId, `no id: ${JSON.stringify(r).slice(0, 300)}`);
		return `id ${state.commentId}`;
	});
	await step('comment.update', async () => {
		const [r] = await run({
			resource: 'comment',
			operation: 'update',
			commentEventId: state.eventId,
			commentId: String(state.commentId),
			commentMessage: 'Edited',
			commentAdditionalFields: { name: 'n8n Test' },
		});
		return JSON.stringify(r).slice(0, 100);
	});
	await step('comment.delete', async () => {
		await run({ resource: 'comment', operation: 'delete', commentEventId: state.eventId, commentId: String(state.commentId) });
	});

	await step('reminder.getDefaults', async () => {
		const r = await run({ resource: 'reminder', operation: 'getDefaults' });
		return JSON.stringify(r).slice(0, 120);
	});
	await step('reminder.setSubcalendarDefaults', async () => {
		const r = await run({
			resource: 'reminder',
			operation: 'setSubcalendarDefaults',
			reminderSubcalendarId: String(state.subId),
			reminders: { reminder: [{ transport: 'email', offset: 'PT15M', tz: '', all_day: false, time_of_day: '', id: 0 }] },
		});
		return JSON.stringify(r).slice(0, 160);
	});
	await step('reminder.getSubcalendarDefaults', async () => {
		const r = await run({ resource: 'reminder', operation: 'getSubcalendarDefaults', reminderSubcalendarId: String(state.subId) });
		return JSON.stringify(r).slice(0, 160);
	});
	await step('reminder.setEventReminders', async () => {
		const r = await run({
			resource: 'reminder',
			operation: 'setEventReminders',
			reminderEventId: state.eventId,
			reminders: { reminder: [{ transport: 'email', offset: 'PT30M', tz: '', time_of_day: '' }] },
		});
		return JSON.stringify(r).slice(0, 160);
	});

	await step('accessKey.getMany', async () => {
		const r = await run({ resource: 'accessKey', operation: 'getMany', accessKeyFilterBy: '', accessKeyType: '', accessKeyLimit: 0 });
		return `${r.length} key(s)`;
	});
	await step('accessKey.create', async () => {
		const [r] = await run({
			resource: 'accessKey',
			operation: 'create',
			accessKeyName: `n8n-test-key-${stamp}`,
			accessKeySubcalendarPermissions: JSON.stringify({ [state.subId]: 'read_only' }),
			accessKeyAdditionalFields: { share_type: 'selected_subcalendars', role: 'read_only' },
		});
		state.keyId = r.id;
		assert(state.keyId, `no id: ${JSON.stringify(r).slice(0, 200)}`);
		return `id ${state.keyId}`;
	});
	await step('accessKey.get', async () => {
		const [r] = await run({ resource: 'accessKey', operation: 'get', accessKeyId: String(state.keyId) });
		return `name ${r.name}, share_type ${r.share_type}, permissions ${JSON.stringify(r.subcalendar_permissions)}`;
	});
	await step('accessKey.patch', async () => {
		const [r] = await run({
			resource: 'accessKey',
			operation: 'patch',
			accessKeyId: String(state.keyId),
			accessKeyPatchFields: JSON.stringify({ name: `n8n-test-key-${stamp}-p`, subcalendar_permissions: { [state.subId]: 'read_only' } }),
		});
		return `name ${r.name}`;
	});
	await step('accessKey.update', async () => {
		const [r] = await run({
			resource: 'accessKey',
			operation: 'update',
			accessKeyId: String(state.keyId),
			accessKeyName: `n8n-test-key-${stamp}-u`,
			accessKeySubcalendarPermissions: { [state.subId]: 'modify' },
			accessKeyAdditionalFields: { share_type: 'selected_subcalendars', role: 'read_only' },
		});
		return `name ${r.name}`;
	});
	await step('accessKey.delete', async () => {
		await run({ resource: 'accessKey', operation: 'delete', accessKeyId: String(state.keyId) });
	});

	await step('event.getChanged', async () => {
		const r = await run({
			resource: 'event',
			operation: 'getChanged',
			eventChangesModifiedSince: new Date(Date.now() - 3600 * 1000).toISOString(),
		});
		assert(r.some((e) => e.id === state.eventId), `test event not in ${r.length} changes`);
		return `${r.length} change(s)`;
	});
	await step('trigger.poll (manual)', async () => {
		const ctx = makeContext({ events: ['created', 'updated', 'deleted'], subcalendarIds: [String(state.subId)], simplify: true, calendarKeyOverride: calendarOverride });
		const out = await new TeamupTrigger().poll.call(ctx);
		const items = out?.[0] ?? [];
		const mine = items.find((i) => i.json.id === state.eventId);
		assert(mine, `event not in ${items.length} trigger item(s)`);
		return `changeType ${mine.json.changeType}`;
	});
	await step('trigger.poll (active: first run, then change)', async () => {
		const staticData = {};
		const params = { events: ['created', 'updated', 'deleted'], subcalendarIds: [String(state.subId)], calendarKeyOverride: calendarOverride };
		const first = await new TeamupTrigger().poll.call(makeContext(params, { staticData, mode: 'trigger' }));
		assert(first === null && staticData.lastTimestamp, 'first run should only store timestamp');
		staticData.lastTimestamp -= 5; // make sure the following change is after the cursor
		await run({ resource: 'event', operation: 'update', eventId: state.eventId, redit: 'single', updateFields: { location: 'Moved' } });
		const second = await new TeamupTrigger().poll.call(makeContext(params, { staticData, mode: 'trigger' }));
		const mine = second?.[0]?.find((i) => i.json.id === state.eventId);
		assert(mine, 'update not reported');
		return `changeType ${mine.json.changeType}`;
	});

	await step('event.delete', async () => {
		const [r] = await run({ resource: 'event', operation: 'delete', eventId: state.eventId, redit: 'single' });
		state.undoId = r.undo_id;
		return `undo ${state.undoId}`;
	});
	await step('event.undo', async () => {
		const [r] = await run({ resource: 'event', operation: 'undo', undoId: state.undoId });
		return JSON.stringify(r).slice(0, 80);
	});
	await step('trigger.poll reports deletion of a short-lived event', async () => {
		const staticData = {};
		const params = { events: ['deleted'], subcalendarIds: [String(state.subId)], calendarKeyOverride: calendarOverride };
		await new TeamupTrigger().poll.call(makeContext(params, { staticData, mode: 'trigger' }));
		staticData.lastTimestamp -= 5;
		const [created] = await run({
			resource: 'event', operation: 'create', subcalendarId: String(state.subId), title: `short-lived ${stamp}`,
			startDateTime: startUtc, endDateTime: endUtc, rrule: '', additionalFields: {},
		});
		await run({ resource: 'event', operation: 'delete', eventId: created.event.id, redit: 'single' });
		const out = await new TeamupTrigger().poll.call(makeContext(params, { staticData, mode: 'trigger' }));
		const mine = out?.[0]?.find((i) => i.json.id === created.event.id);
		assert(mine && mine.json.changeType === 'deleted', 'deletion not reported');
		return 'changeType deleted';
	});
	await step('event.delete with stale version is rejected', async () => {
		assert(state.eventId, 'no test event');
		try {
			await run({ resource: 'event', operation: 'delete', eventId: state.eventId, redit: 'single', eventOptions: { version: 'stale' } });
		} catch (error) {
			return `rejected: ${error.message}`;
		}
		throw new Error('delete with wrong version succeeded');
	});
	await step('error: get unknown event', async () => {
		try {
			await run({ resource: 'event', operation: 'get', eventId: '1' });
		} catch (error) {
			assert(error instanceof NodeApiError, 'not a NodeApiError');
			return `${error.message} | ${error.description} | HTTP ${error.httpCode}`;
		}
		throw new Error('no error thrown');
	});

	if (useUser) {
		await step('user login (bearer token)', async () => {
			assert(sharedCredentials.sessionToken && sharedCredentials.sessionToken !== 'none', 'no session token');
			return 'session token obtained';
		});
	}

	// cleanup
	await step('cleanup: event.delete', async () => {
		await run({ resource: 'event', operation: 'delete', eventId: state.eventId, redit: 'all' });
	});
	if (!state.usingFallbackSubcalendar) await step('cleanup: subcalendar.delete', async () => {
		await run({ resource: 'subcalendar', operation: 'delete', subcalendarId: String(state.subId) });
	});

	const failed = results.filter((r) => !r.ok);
	console.log(`\n${results.length - failed.length}/${results.length} passed`);
	process.exit(failed.length ? 1 : 0);
})();
