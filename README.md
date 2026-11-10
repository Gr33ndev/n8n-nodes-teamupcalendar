# n8n-nodes-teamupcalendar

This is an n8n community node package. It lets you use [Teamup Calendar](https://teamup.com) in your n8n workflows.
It contains two nodes:

- **Teamup**: covers the documented [Teamup API](https://apidocs.teamup.com/docs/api/) (events, subcalendars, signups,
  comments, reminders, access keys and calendar operations). Usable as an AI agent tool.
- **Teamup Trigger**: starts a workflow when events are created, updated or deleted.

Teamup Calendar is a collaborative calendar platform that allows teams to share calendars, manage events, and coordinate
schedules. It offers powerful features like subcalendars and flexible access controls.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/) workflow automation
platform.

[Installation](#installation)
[Operations](#operations)
[Credentials](#credentials)
[Compatibility](#compatibility)
[Usage](#usage)
[Resources](#resources)
[Version history](#version-history)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community
nodes documentation.

## Operations

### Event Operations

- **Create**: Create a new calendar event with title, dates, subcalendar assignment, and optional fields like location,
  notes, and attendees
- **Delete**: Remove events from the calendar
- **Get**: Retrieve details of a specific event by its ID
- **Get Auxiliary Info**: Fetch additional information related to an event
- **Get Changed Events**: Retrieve events that have changed since a specified timestamp (max 30 days ago)
- **Get Many**: Retrieve multiple events with filtering options by date range, subcalendar, and result limits
- **Get Page URL**: Get the public page URL for an event
- **Export**: Export an event in iCal format
- **Search**: Find events by keyword, with optional date range, subcalendar filter and pagination
- **Undo**: Undo an event action
- **Update**: Modify existing events including changing dates, titles, subcalendars, and other properties

Create and Update also support signups, comments, custom fields, remote IDs and multiple subcalendars. Delete accepts
the event `version` for soft-locking.

### Comment Operations

- **Create**: Add a comment to an event
- **Update**: Change a comment
- **Delete**: Remove a comment

### Reminder Operations

- **Get Defaults**: Default reminders of all subcalendars for the current user
- **Get Subcalendar Defaults**: Default reminders of one subcalendar
- **Set Subcalendar Defaults**: Replace the default reminders of one subcalendar
- **Set Event Reminders**: Replace the reminders of one event

### Subcalendar Operations

- **Create**: Add a new subcalendar to the Teamup calendar
- **Delete**: Remove a subcalendar from the Teamup calendar
- **Get**: Retrieve details of a specific subcalendar by its ID
- **Get Many**: Fetch all available subcalendars for the connected Teamup calendar
- **Update**: Change properties of an existing subcalendar such as name and color
- **Patch**: Partially update a subcalendar, sending only the changed fields

### Calendar Operations

- **Check Access**: Check that the Teamup API key is valid
- **Duplicate**: Duplicate this calendar (subcalendars + configuration, not events)
- **Get Attachment Upload URL**: Get a short-lived URL to upload attachment files to
- **Get Configuration**: Retrieve the calendar configuration

### Signup Operations

- **Create**: Create a signup for an event (name + email)
- **Delete**: Delete a signup from an event
- **Get Many**: List signups for an event
- **Update**: Update a signup's name, email or remote id

### Access Key Operations

- **Create**: Create a new calendar access key with subcalendar permissions
- **Delete**: Delete an access key (cannot be undone)
- **Get**: Retrieve a single access key by ID
- **Get Many**: List access keys, filterable by name and type
- **Patch**: Partially update an access key
- **Update**: Update an existing access key

## Credentials

To use this node, you need:

1. **Teamup Calendar Account**: Sign up at [Teamup Calendar](https://teamup.com/register) and get your API key from
   there
2. **Calendar Key**: The unique identifier for your Teamup calendar (found in your share calendar URL, Settings >
   Sharing > Create Link)

### Setting up credentials:

1. Request a free API key at [teamup.com/api-keys](https://teamup.com/api-keys/request)
2. Create a Teamup calendar or use an existing one
3. Share your calendar via Settings > Sharing > Create Link
4. Note your calendar key from that sharing URL (e.g., `https://teamup.com/ks1234567890` → key is `ks1234567890`)
5. In n8n, create new "Teamup API" credentials with your calendar key and API token

### Optional: log in as a Teamup user

Fill in **User Email** and **User Password** to act with the permissions of a Teamup user account. n8n then logs in
via `POST /auth/tokens` and sends the bearer token with every request. This is needed when you address a calendar by its
calendar ID instead of a secret calendar key. Accounts with two-factor authentication are not supported.

### Which permissions are needed?

| Operations | Calendar key (modify link) | User login + calendar ID |
| --- | --- | --- |
| Events, signups, comments, calendar configuration, trigger | ✅ | ✅ |
| Reminders | ❌ (`login_required`) | ✅ |
| Create/update/delete subcalendars, access keys | ❌ (`no_permission`) | ✅ (calendar admin) |

Secret calendar keys always act with the rights of their sharing link, even when you also log in. For administrator
operations, log in with a calendar administrator and set **Calendar Key or ID** to the calendar ID (the short ID of
the calendar in your Teamup dashboard, e.g. `a1b2c3`).

### Working with several calendars

Every Teamup node has a **Calendar Key or ID** field. Leave it empty to use the calendar from the credential, or set
it to work with another calendar using the same credential.

## Compatibility

- **Minimum n8n version**: 1.117.3
- **Tested with**: n8n version 1.117.3 & 1.123.5

## Usage

### Selecting subcalendars and events

Subcalendar and event fields offer **From List** and **By ID**. In the event list, type at least 2 characters to
search events of the last and next 12 months; without a search term the list shows events from the last 7 to the next
30 days.

### Basic Event Creation

1. Select "Event" as resource and "Create" as operation
2. Choose the target subcalendar
3. Set event title, start date/time, and end date/time
4. Optionally add location, notes, attendees, or mark as all-day event

### Filtering Events

When using "Get Many" for events:

- **Start Date**: Events from this date on (defaults to today)
- **End Date**: Events until this date (if empty, only the events of the start date)
- **Subcalendar**: Filter by specific subcalendar (optional)
- **Limit**: Maximum number of events to return (default: 50, max: 1000)

### Date/Time Handling

- All dates are automatically formatted for the Teamup API
- Supports both date-only and full datetime values
- The time zone of a date is kept: `2026-03-01T10:00:00Z` stays 10:00 UTC. Dates without a time zone are read in the
  calendar's time zone.

### Breaking changes in 1.0.0

Parameters and operations are unchanged, so existing workflows keep their configuration. The behavior changes in
these places:

- **Dates with a time zone are no longer shifted.** Before, a trailing `Z` was removed, so UTC times like
  `2026-03-01T10:00:00Z` were read as 10:00 calendar time. Now they are read as 10:00 UTC. Check workflows that pass
  UTC timestamps (for example `new Date().toISOString()`).
- **Delete operations** (event, subcalendar, signup, access key) return `{ "deleted": true }`. Event > Delete also
  returns the `undo_id`. Before, they returned `{ "success": true, "status": "Deleted", ... }`.
- **Subcalendar and event fields are resource locators** ("From List" with search, or "By ID"). Saved selections
  from older versions are read as IDs, but open each Teamup node once and check the Subcalendar and Event fields.
- **Subcalendar > Get Many** has **Return All** and **Limit** now and returns 50 subcalendars by default. Turn on
  Return All to get every subcalendar as before.

### Teamup Trigger

The trigger polls `GET /events?modifiedSince=` and emits one item per changed event with a `changeType` field
(`created`, `updated` or `deleted`). After activation it only reports changes from then on. Manual test runs show the
changes of the last 7 days. Teamup keeps changes for 30 days.

Teamup webhooks can only be set up in the Teamup UI (Settings > API). To receive them, use n8n's Webhook node and
paste its URL there.

## Development

```bash
npm run build      # build
npm run lint       # n8n community node lint
npm run dev        # local n8n with the node at http://localhost:5678
```

`npm run test:integration` runs every operation and the trigger against the real Teamup API and cleans up after
itself. Use a separate test calendar. Put the values into `.env.test` (gitignored):

```
TEAMUP_TOKEN=<API key>
TEAMUP_CALENDAR_KEY=<secret calendar key>
# optional, for reminders and admin operations:
TEAMUP_EMAIL=<user email>
TEAMUP_PASSWORD=<user password>
TEAMUP_CALENDAR_ID=<calendar ID>
```

## Resources

* [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
* [Teamup Calendar API Documentation](https://apidocs.teamup.com/)
* [Teamup Calendar Help Center](https://support.teamup.com/)
