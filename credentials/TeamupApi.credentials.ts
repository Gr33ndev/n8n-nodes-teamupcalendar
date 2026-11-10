import type {
	ICredentialDataDecryptedObject,
	ICredentialTestRequest,
	ICredentialType,
	IDataObject,
	IHttpRequestHelper,
	IHttpRequestOptions,
	Icon,
	INodeProperties,
} from 'n8n-workflow';

const NO_USER_SESSION = 'none';

export class TeamupApi implements ICredentialType {
	name = 'teamupApi';

	displayName = 'Teamup API';

	icon: Icon = {
		light: 'file:../nodes/Teamup/teamup.svg',
		dark: 'file:../nodes/Teamup/teamup.dark.svg',
	};

	documentationUrl = 'https://apidocs.teamup.com/docs/api/';

	properties: INodeProperties[] = [
		{
			displayName: 'Teamup Token',
			name: 'token',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			description:
				'Your Teamup API key. Request one for free at https://teamup.com/api-keys/request.',
		},
		// The secret calendar key grants access to the calendar, so it is a secret.
		// eslint-disable-next-line @n8n/community-nodes/credential-unnecessary-password
		{
			displayName: 'Calendar Key',
			name: 'calendarKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			description:
				'Secret calendar key (e.g. ks1234567890abcdef) or, when logging in with a Teamup user, the calendar ID. Create a key in Teamup under Settings > Sharing > Create Link. Can be overridden per node.',
			placeholder: 'e.g. ks1234567890abcdef',
		},
		{
			displayName: 'User Email',
			name: 'email',
			type: 'string',
			placeholder: 'e.g. name@example.com',
			default: '',
			description:
				'Optional. Log in as a Teamup user to act with that user’s permissions (needed when using a calendar ID instead of a secret calendar key).',
		},
		{
			displayName: 'User Password',
			name: 'password',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			displayOptions: {
				hide: { email: [''] },
			},
		},
		{
			displayName: 'Session Token',
			name: 'sessionToken',
			type: 'hidden',
			typeOptions: {
				expirable: true,
				password: true,
			},
			default: '',
		},
	];

	async preAuthentication(this: IHttpRequestHelper, credentials: ICredentialDataDecryptedObject) {
		const email = (credentials.email as string | undefined)?.trim();
		if (!email) {
			return { sessionToken: NO_USER_SESSION };
		}

		const response = (await this.helpers.httpRequest({
			method: 'POST',
			url: 'https://api.teamup.com/auth/tokens',
			headers: {
				'Teamup-Token': credentials.token as string,
				'Content-Type': 'application/json',
				Accept: 'application/json',
			},
			body: {
				app_name: 'n8n',
				device_id: 'n8n',
				email,
				password: credentials.password as string,
			},
			json: true,
		})) as IDataObject;

		return { sessionToken: response.auth_token as string };
	}

	async authenticate(
		credentials: ICredentialDataDecryptedObject,
		requestOptions: IHttpRequestOptions,
	): Promise<IHttpRequestOptions> {
		const headers: IDataObject = {
			...(requestOptions.headers ?? {}),
			'Teamup-Token': credentials.token as string,
		};

		const sessionToken = credentials.sessionToken as string | undefined;
		const email = (credentials.email as string | undefined)?.trim();
		if (email && sessionToken && sessionToken !== NO_USER_SESSION) {
			headers.Authorization = `Bearer ${sessionToken}`;
		}

		return { ...requestOptions, headers };
	}

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.teamup.com',
			url: '={{"/" + $credentials.calendarKey + "/subcalendars"}}',
			method: 'GET',
		},
	};
}
