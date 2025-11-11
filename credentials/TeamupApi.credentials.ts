import {Icon, ICredentialTestRequest, ICredentialType, INodeProperties} from 'n8n-workflow';

export class TeamupApi implements ICredentialType {
	name = 'teamupApi';
	displayName = 'Teamup API';
	icon: Icon = {light: 'file:../nodes/Teamup/teamup.svg', dark: 'file:../nodes/Teamup/teamup.dark.svg',};
	documentationUrl = 'https://apidocs.teamup.com';
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
			description: 'Your Teamup API Token. You can generate one in your Teamup calendar settings.',
		},
		{
			displayName: 'Calendar Key',
			name: 'calendarKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			description: 'Your Teamup calendar key (e.g., ks1234567890abcdef). You can create one by going to Settings > Sharing > Create Link',
			placeholder: 'ks1234567890abcdef',
		},
	];

	test: ICredentialTestRequest = {
		request: {
			method: 'GET',
			url: '={{"https://api.teamup.com/" + $credentials.calendarKey + "/subcalendars"}}',
			headers: {
				'Teamup-Token': '={{$credentials.token}}',
				'Accept': 'application/json',
				'User-Agent': 'n8n-teamup-node/0.1.0',
			},
		},
	};
}