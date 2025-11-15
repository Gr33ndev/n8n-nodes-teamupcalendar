# n8n-nodes-teamupcalendar

This is a n8n community node. It lets you use [Teamup Calendar](https://teamup.com) in your n8n workflows.

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
- **Get Many**: Retrieve multiple events with filtering options by date range, subcalendar, and result limits
- **Search events**: Find events based on keywords in titles or notes
- **Undo**: Undo an event action
- **Update**: Modify existing events including changing dates, titles, subcalendars, and other properties

### Subcalendar Operations

- **Create**: Add a new subcalendar to the Teamup calendar
- **Delete**: Remove a subcalendar from the Teamup calendar
- **Get**: Retrieve details of a specific subcalendar by its ID
- **Get Many**: Fetch all available subcalendars for the connected Teamup calendar
- **Update**: Change properties of an existing subcalendar such as name and color

## Credentials

To use this node, you need:

1. **Teamup Calendar Account**: Sign up at [Teamup Calendar](https://teamup.com/register) and get your API key from
   there
2. **Calendar Key**: The unique identifier for your Teamup calendar (found in your share calendar URL, Settings >
   Sharing > Create Link)

### Setting up credentials:

1. Create a Teamup calendar or use an existing one
2. Share your calendar via Settings > Sharing > Create Link
3. Note your calendar key from that sharing URL (e.g., `https://teamup.com/ks1234567890` → key is `ks1234567890`)
4. In n8n, create new "Teamup API" credentials with your calendar key and API token

## Compatibility

- **Minimum n8n version**: 1.117.3
- **Tested with**: n8n version 1.117.3

## Usage

### Basic Event Creation

1. Select "Event" as resource and "Create" as operation
2. Choose the target subcalendar
3. Set event title, start date/time, and end date/time
4. Optionally add location, notes, attendees, or mark as all-day event

### Filtering Events

When using "Get Many" for events:

- **Start Date**: Events starting on or after this date (defaults to today)
- **End Date**: Events starting before this date (defaults to today's end of the day)
- **Subcalendar**: Filter by specific subcalendar (optional)
- **Limit**: Maximum number of events to return (default: 50, max: 1000)

### Date/Time Handling

- All dates are automatically formatted for the Teamup API
- Supports both date-only and full datetime values
- Timezone handling follows your n8n instance settings

## Resources

* [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
* [Teamup Calendar API Documentation](https://apidocs.teamup.com/)
* [Teamup Calendar Help Center](https://support.teamup.com/)
