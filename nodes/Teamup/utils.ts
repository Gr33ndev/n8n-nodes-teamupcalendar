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
		const iso = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:00`;

		const date = new Date(iso);
		const offsetMinutes = -date.getTimezoneOffset();
		const sign = offsetMinutes >= 0 ? '+' : '-';
		const pad = (n: number) => String(Math.floor(Math.abs(n))).padStart(2, '0');
		const hours = pad(offsetMinutes / 60);
		const minutes = pad(offsetMinutes % 60);
		return `${iso}${sign}${hours}:${minutes}`;
	}

	// Fallback
	const d = new Date(dateStr);
	if (!isNaN(d.getTime())) {
		const offsetMinutes = -d.getTimezoneOffset();
		const sign = offsetMinutes >= 0 ? '+' : '-';
		const pad = (n: number) => String(Math.floor(Math.abs(n))).padStart(2, '0');
		const hours = pad(offsetMinutes / 60);
		const minutes = pad(offsetMinutes % 60);
		return d.toISOString().slice(0, 19) + sign + hours + ':' + minutes;
	}

	throw new Error(`Unsupported date format: ${dateStr}`);
}
