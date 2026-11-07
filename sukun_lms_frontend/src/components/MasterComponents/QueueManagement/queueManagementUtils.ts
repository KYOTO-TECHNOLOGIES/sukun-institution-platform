import type { Queue, ScheduleServingPoint, ServingPoint, Token } from '../../../services/queueManagementApi';

/** `YYYY-MM-DD` for `<input type="date" />` and schedule list filters (local calendar). */
export function formatLocalDateInputValue(d: Date = new Date()): string {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${y}-${m}-${day}`;
}

/**
 * Query params so the API returns schedules whose window overlaps the given local calendar day.
 * Uses `to_datetime__gte` / `from_datetime__lte` (common DRF / django-filter pattern).
 */
export function getScheduleListDayOverlapParams(yyyyMmDd: string): {
	to_datetime__gte: string;
	from_datetime__lte: string;
} {
	const parts = yyyyMmDd.split('-').map(Number);
	const y = parts[0];
	const m = parts[1];
	const d = parts[2];
	const safeY = Number.isFinite(y) ? y : new Date().getFullYear();
	const safeM = Number.isFinite(m) ? Math.min(12, Math.max(1, m)) : 1;
	const safeD = Number.isFinite(d) ? Math.max(1, d) : 1;
	const start = new Date(safeY, safeM - 1, safeD, 0, 0, 0, 0);
	const end = new Date(safeY, safeM - 1, safeD, 23, 59, 59, 999);
	return {
		to_datetime__gte: start.toISOString(),
		from_datetime__lte: end.toISOString(),
	};
}

/** Same overlap logic as a single day, but spanning `startYyyyMmDd`…`endYyyyMmDd` (inclusive, local calendar). */
export function getScheduleListRangeOverlapParams(
	startYyyyMmDd: string,
	endYyyyMmDd: string,
): { to_datetime__gte: string; from_datetime__lte: string } {
	let start = startYyyyMmDd;
	let end = endYyyyMmDd;
	if (start > end) [start, end] = [end, start];
	const { to_datetime__gte } = getScheduleListDayOverlapParams(start);
	const { from_datetime__lte } = getScheduleListDayOverlapParams(end);
	return { to_datetime__gte, from_datetime__lte };
}

/** Normalizes `ServingPoint.queue` whether the API returns a single id or a list. */
export const servingPointQueueIds = (
	point: ServingPoint,
): number[] => {
	return (point.queue || []).map((queue) => queue.id);
};

/** Normalizes `ServingPoint.assigned_users` whether the API returns ids or nested objects. */
export const servingPointAssignedUserIds = (
	point: ServingPoint,
): number[] => {
	return (point.assigned_user || []).map((user) => user.id);
};

/** Customer-facing token label: prefixed `token_display` from API, else raw `token_number`. */
export const getTokenDisplay = (token: {
	token_display?: string | null;
	token_number?: string | number | null;
}): string => {
	const display = token.token_display != null ? String(token.token_display).trim() : '';
	if (display) return display;
	if (token.token_number != null && String(token.token_number).trim() !== '') {
		return String(token.token_number);
	}
	return '—';
};

/** Current token label on a schedule row (flat display, nested token, then number/id). */
export const getScheduleCurrentTokenDisplay = (schedule: {
	current_token_display?: string | null;
	current_token_number?: string | null;
	current_token?: number | Token | null;
}): string => {
	const flatDisplay =
		schedule.current_token_display != null ? String(schedule.current_token_display).trim() : '';
	if (flatDisplay) return flatDisplay;

	const nested = schedule.current_token;
	if (
		nested &&
		typeof nested === 'object' &&
		('token_number' in nested || 'token_display' in nested)
	) {
		const label = getTokenDisplay(nested);
		if (label !== '—') return label;
	}

	if (schedule.current_token_number != null && String(schedule.current_token_number).trim() !== '') {
		return String(schedule.current_token_number).trim();
	}

	if (typeof nested === 'number') return String(nested);

	return '—';
};

/** Same transition rules as queue / schedule serving-point UIs (global counter via `queuesApi.updateServingPoint`). */
export const normalizeServingPointStatus = (status?: string) =>
	(status || '').toLowerCase().trim().replace(/\s+/g, '_');

export const getNextAllowedServingPointStatuses = (status?: string): string[] => {
	const n = normalizeServingPointStatus(status);
	if (n === 'scheduled') return ['running', 'cancelled'];
	if (n === 'running') return ['on_hold', 'completed', 'cancelled'];
	if (n === 'on_hold') return ['running', 'completed', 'cancelled'];
	return [];
};

export const getWindowServingPointStatus = (row: ScheduleServingPoint): string | undefined =>
	row.serving_point_status ?? row.status;

export const SP_STATUS_LABELS: Record<string, string> = {
	running: 'Running',
	on_hold: 'On Hold',
	completed: 'Completed',
	cancelled: 'Cancelled',
};

export const SP_STATUS_COLORS: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'secondary'> = {
	running: 'primary',
	on_hold: 'warning',
	completed: 'success',
	cancelled: 'danger',
};

/** True while the schedule window’s `to_datetime` is still strictly in the future (invalid/missing end → false). */
export const isServingWindowEndInFuture = (row: ScheduleServingPoint): boolean => {
	if (!row.to_datetime) return false;
	const end = new Date(row.to_datetime).getTime();
	return !Number.isNaN(end) && end > Date.now();
};

const FIELD_LABELS: Record<string, string> = {
	non_field_errors: '',
	__all__: '',
	from_datetime: 'Start',
	to_datetime: 'End',
	token_from: 'Token from',
	token_to: 'Token to',
	limit: 'Token limit',
	description: 'Description',
	queue: 'Queue',
	status: 'Status',
};

const formatFieldErrors = (field: string, messages: string[]): string => {
	const text = messages.join(' ');
	const label = FIELD_LABELS[field] ?? field;
	return label ? `${label}: ${text}` : text;
};

export const getErrorMessage = (error: unknown): string => {
	if (typeof error === 'string') return error;

	const typedError = error as {
		message?: string;
		response?: {
			data?:
				| string
				| {
						detail?: string;
						message?: string;
						non_field_errors?: string[];
						errors?: Record<string, string[]>;
						[key: string]: unknown;
				  };
		};
	};

	const data = typedError.response?.data;

	if (typeof data === 'string' && data.trim()) {
		return data;
	}

	if (data && typeof data === 'object') {
		if (typeof data.detail === 'string' && data.detail.trim()) {
			return data.detail;
		}
		if (typeof data.message === 'string' && data.message.trim()) {
			return data.message;
		}
		if (Array.isArray(data.non_field_errors) && data.non_field_errors.length) {
			return data.non_field_errors.join(' ');
		}
		if (data.errors && typeof data.errors === 'object') {
			const parts = Object.entries(data.errors)
				.filter(([, messages]) => Array.isArray(messages) && messages.length)
				.map(([field, messages]) => formatFieldErrors(field, messages as string[]));
			if (parts.length) return parts.join(' ');
		}

		const fieldEntries = Object.entries(data).filter(
			([key, value]) =>
				key !== 'detail' &&
				key !== 'message' &&
				key !== 'errors' &&
				Array.isArray(value) &&
				(value as unknown[]).every((item) => typeof item === 'string'),
		);
		if (fieldEntries.length) {
			return fieldEntries
				.map(([field, messages]) => formatFieldErrors(field, messages as string[]))
				.join(' ');
		}
	}

	if (typeof typedError.message === 'string' && typedError.message.trim()) {
		return typedError.message;
	}

	return 'Something went wrong while calling the queue management API.';
};

/** True when the user is authenticated but lacks permission for the requested action (HTTP 403). */
export const isForbiddenPermissionError = (error: unknown): boolean => {
	const status = (error as { response?: { status?: number } })?.response?.status;
	if (status !== 403) return false;
	const message = getErrorMessage(error).toLowerCase();
	return (
		message.includes('permission') ||
		message.includes('do not have') ||
		message.includes('not allowed') ||
		message.includes('access denied')
	);
};

export const PERMISSION_DENIED_CONTACT_ADMIN =
	'Please contact your administrator if you need access to this feature.';

/** User-facing copy for permission-denied API responses. */
export const formatPermissionDeniedMessage = (error: unknown): string => {
	const detail = getErrorMessage(error);
	return detail
		? `${detail} ${PERMISSION_DENIED_CONTACT_ADMIN}`
		: `You do not have permission to perform this action. ${PERMISSION_DENIED_CONTACT_ADMIN}`;
};

export const getQueueName = (queue: Queue | number | undefined, queues: Queue[]) => {
	if (!queue) return '-';

	if (typeof queue === 'number') {
		return queues.find((item) => item.id === queue)?.name || `Queue ${queue}`;
	}

	return queue.name;
};

export const getTokenQueueName = (queue: Token['queue'], queues: Queue[]) => {
	if (typeof queue === 'number') {
		return getQueueName(queue, queues);
	}

	return queue?.name || '-';
};

export const formatDate = (value?: string | null) => {
	if (!value) return '-';
	return new Date(value).toLocaleString();
};

export const statusBadgeColor = (status?: string) => {
	const s = (status || '').toLowerCase().trim();
	switch (s) {
		case 'registred':
			return 'secondary';
		case 'waiting':
			return 'warning';
		case 'serving':
			return 'info';
		case 'completed':
			return 'success';
		case 'cancelled':
		case 'no_show':
			return 'danger';
		case 'postponed':
			return 'secondary';
		default:
			return 'light';
	}
};

