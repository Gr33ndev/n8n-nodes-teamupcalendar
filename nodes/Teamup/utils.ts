export function formatDateTime(dateStr: string): string {
	if (!dateStr?.trim()) return dateStr;

	// ISO-like
	if (dateStr.includes('T') && dateStr.includes('-')) {
		return dateStr.replace(/\.\d{3}Z?$/, '').replace('Z', '');
	}

	// DD.MM.YYYY HH:MM
	const match = dateStr.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})(?:[ T](\d{1,2}):(\d{2}))?$/);
	if (match) {
		const [, day, month, year, hour = '00', minute = '00'] = match;
		return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:00`;
	}

	// Fallback
	const d = new Date(dateStr);
	if (!isNaN(d.getTime())) {
		return d.toISOString().slice(0, 19);
	}

	throw new Error(`Unsupported date format: ${dateStr}`);
}
