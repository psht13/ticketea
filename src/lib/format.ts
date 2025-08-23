export function formatTime(epochMs: number): string {
	const d = new Date(epochMs);
	const hours = d.getUTCHours().toString().padStart(2, "0");
	const minutes = d.getUTCMinutes().toString().padStart(2, "0");
	return `${hours}:${minutes} UTC`;
}

export function formatDurationMinutes(totalMinutes: number): string {
	const hours = Math.floor(totalMinutes / 60);
	const minutes = totalMinutes % 60;
	if (hours <= 0) return `${minutes}m`;
	if (minutes === 0) return `${hours}h`;
	return `${hours}h ${minutes}m`;
}

export function formatUTCDateTime(epochMs: number): string {
	const d = new Date(epochMs);
	const year = d.getUTCFullYear();
	const month = (d.getUTCMonth() + 1).toString().padStart(2, "0");
	const day = d.getUTCDate().toString().padStart(2, "0");
	const hours = d.getUTCHours().toString().padStart(2, "0");
	const minutes = d.getUTCMinutes().toString().padStart(2, "0");
	return `${year}-${month}-${day} ${hours}:${minutes}`;
}

export function parseUTCDateTime(input: string): number | null {
	// Accepts "YYYY-MM-DD HH:mm"
	const match = input.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})$/);
	if (!match) return null;
	const [, y, m, d, hh, mm] = match;
	const epochMs = Date.UTC(Number(y), Number(m) - 1, Number(d), Number(hh), Number(mm), 0, 0);
	return Number.isNaN(epochMs) ? null : epochMs;
} 