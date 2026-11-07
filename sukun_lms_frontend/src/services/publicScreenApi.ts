import { publicAxios } from '../axiosInstance';

export interface PublicScreenInfo {
	id: number;
	uuid: string;
	name: string;
	location?: string;
	description?: string;
	ip_address?: string | null;
	ip_bind?: boolean;
	enable_audio?: boolean;
	is_active?: boolean;
	is_online?: boolean;
	background_image?: string | null;
	last_heartbeat?: string | null;
}

export interface PublicScreenTemplate {
	id: number;
	uuid?: string;
	name: string;
	description?: string;
	html_content?: string;
	/** Zone queue assignments (queue_uuids per zone) when provided by the public screen API. */
	configuration?: Record<string, unknown> | string | null;
	thumbnail?: string | null;
	is_active?: boolean;
	/** Display duration in minutes before rotating to the next assigned template. */
	interval: number;
	order: number;
	screen_template_id: number;
}

export interface PublicScreenResponse {
	screen: PublicScreenInfo;
	templates: PublicScreenTemplate[];
	template_count: number;
}

function parseAssignmentNumber(value: unknown, fallback: number): number {
	if (value == null || value === '') return fallback;
	const parsed = Number(value);
	return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

/** Normalize one public screen template; coerces order/interval from API variants. */
export function normalizePublicScreenTemplate(
	raw: PublicScreenTemplate | Record<string, unknown>,
	fallbackOrder: number,
): PublicScreenTemplate {
	const r = raw as Record<string, unknown>;
	const nested =
		r.screen_template && typeof r.screen_template === 'object'
			? (r.screen_template as Record<string, unknown>)
			: null;

	const screenTemplateId =
		Number(r.screen_template_id ?? nested?.id ?? r.id) || 0;

	return {
		id: Number(r.id) || screenTemplateId,
		uuid: typeof r.uuid === 'string' ? r.uuid : undefined,
		name: String(r.name ?? r.template_name ?? '').trim(),
		description: typeof r.description === 'string' ? r.description : undefined,
		html_content: typeof r.html_content === 'string' ? r.html_content : undefined,
		configuration: (r.configuration ?? null) as PublicScreenTemplate['configuration'],
		thumbnail:
			typeof r.thumbnail === 'string' ? r.thumbnail : (r.thumbnail as null) ?? null,
		is_active: r.is_active !== false,
		interval: parseAssignmentNumber(r.interval ?? nested?.interval, 1),
		order: parseAssignmentNumber(
			r.order ?? nested?.order ?? r.display_order,
			fallbackOrder,
		),
		screen_template_id: screenTemplateId,
	};
}

/** Same ordering as Screens admin (Order 1, 2, 3…). */
export function sortPublicScreenTemplatesByOrder(
	templates: (PublicScreenTemplate | Record<string, unknown>)[],
): PublicScreenTemplate[] {
	return templates
		.map((item, index) => normalizePublicScreenTemplate(item, index + 1))
		.sort((a, b) => {
			const byOrder = a.order - b.order;
			if (byOrder !== 0) return byOrder;
			return a.screen_template_id - b.screen_template_id;
		});
}

/** interval on screen assignments is stored in minutes (Screens admin UI). */
export function publicScreenIntervalToSeconds(interval: number | undefined): number {
	return Math.max(1, interval || 1) * 60;
}

/**
 * Pick which assigned template should display now.
 * `templates` must already be sorted by `sortPublicScreenTemplatesByOrder`.
 */
export function pickPublicScreenTemplateForCycle(
	templates: PublicScreenTemplate[],
	startMs: number,
	nowMs: number,
): PublicScreenTemplate | null {
	const active = templates.filter((t) => t.is_active !== false);
	if (!active.length) return null;
	if (active.length === 1) return active[0];

	const totalSeconds = active.reduce(
		(sum, t) => sum + publicScreenIntervalToSeconds(t.interval),
		0,
	);
	if (totalSeconds <= 0) return active[0];

	const elapsedSec = ((nowMs - startMs) / 1000) % totalSeconds;
	let cursor = 0;
	for (const template of active) {
		cursor += publicScreenIntervalToSeconds(template.interval);
		if (elapsedSec < cursor) return template;
	}
	return active[0];
}

export interface PublicQueueToken {
	id: number;
	token_number: number;
	token_display: string;
	status: string;
	created_at: string;
}

/** A previously-called token entry (flat shape used in the ticker bar). */
export interface RecentQueueToken {
	token_display: string;
	serving_point_name?: string;
	queue_name?: string;
	/** ISO string or human-readable time returned by the API. */
	called_at?: string;
}

export interface PublicQueueStatus {
	uuid: string;
	id: number;
	name: string;
	status: string;
	is_active: boolean;
	current_token: PublicQueueToken | null;
	schedule_id: number | null;
	/** Flat fields returned by POST /api/public/queue-status/ */
	queue_name?: string;
	serving_point_name?: string;
	token_display?: string;
	token_status?: string;
	/** Server-generated phrase for audio announcements (POST /api/public/queue-status/). */
	text_to_speech?: string;
	/** Recently-called tokens for this queue, if the API returns them. */
	recent_tokens?: RecentQueueToken[];
	/**
	 * Other tokens currently being served at other counters for this queue.
	 * Mapped from the `other_current_tokens` array in the API response.
	 * These are shown live in the history strip at the bottom of the zone card.
	 */
	other_tokens?: RecentQueueToken[];
}

export interface PublicQueueZoneDisplay {
	queueName: string;
	servingPointName: string;
	tokenDisplay: string;
	tokenStatus: string;
}

/** Map legacy nested and flat public queue-status payloads into one shape. */
export function normalizePublicQueueStatus(
	raw: PublicQueueStatus | Record<string, unknown>,
): PublicQueueStatus {
	const r = raw as Record<string, unknown>;
	const nestedToken =
		r.current_token && typeof r.current_token === 'object'
			? (r.current_token as PublicQueueToken)
			: null;

	const queueName = String(r.queue_name ?? r.name ?? '').trim();
	const tokenDisplay = String(
		r.token_display ?? nestedToken?.token_display ?? '',
	).trim();
	const tokenStatus = String(
		r.token_status ?? r.status ?? nestedToken?.status ?? '',
	).trim();
	const servingPointName =
		typeof r.serving_point_name === 'string' ? r.serving_point_name.trim() : '';
	const textToSpeech =
		typeof r.text_to_speech === 'string' ? r.text_to_speech.trim() : '';

	let current_token: PublicQueueToken | null = nestedToken;
	if (!current_token && (tokenDisplay || r.token_number != null)) {
		current_token = {
			id: 0,
			token_number: Number(r.token_number) || 0,
			token_display: tokenDisplay,
			status: tokenStatus,
			created_at: '',
		};
	}

	function mapToRecentToken(raw: unknown): RecentQueueToken {
		const t = raw as Record<string, unknown>;
		return {
			token_display: String(t.token_display ?? ''),
			serving_point_name:
				typeof t.serving_point_name === 'string' ? t.serving_point_name : undefined,
			queue_name:
				typeof t.queue_name === 'string' ? t.queue_name : undefined,
			called_at:
				typeof t.called_at === 'string' ? t.called_at : undefined,
		};
	}

	const recentTokens = Array.isArray(r.recent_tokens)
		? (r.recent_tokens as unknown[]).map(mapToRecentToken)
		: undefined;

	// `other_current_tokens` — other tokens being served at other counters right now.
	const otherTokens = Array.isArray(r.other_current_tokens)
		? (r.other_current_tokens as unknown[])
				.map(mapToRecentToken)
				.filter((t) => Boolean(t.token_display))
		: undefined;

	return {
		uuid: String(r.uuid ?? ''),
		id: Number(r.id) || 0,
		name: queueName,
		status: tokenStatus || 'inactive',
		is_active: r.is_active !== false,
		current_token,
		schedule_id: r.schedule_id != null ? Number(r.schedule_id) : null,
		queue_name: queueName || undefined,
		serving_point_name: servingPointName || undefined,
		token_display: tokenDisplay || undefined,
		token_status: tokenStatus || undefined,
		text_to_speech: textToSpeech || undefined,
		recent_tokens: recentTokens,
		other_tokens: otherTokens,
	};
}

export function buildQueuesByUuidMap(
	queues: (PublicQueueStatus | Record<string, unknown>)[],
): Record<string, PublicQueueStatus> {
	const map: Record<string, PublicQueueStatus> = {};
	for (const item of queues) {
		const queue = normalizePublicQueueStatus(item);
		const key = queue.uuid || (queue.name ? `name:${queue.name}` : '');
		if (key) map[key] = queue;
	}
	return map;
}

export function getPublicQueueZoneDisplay(
	queue: PublicQueueStatus | null,
	fallbacks: { queueName?: string } = {},
): PublicQueueZoneDisplay {
	const queueName =
		queue?.queue_name?.trim() ||
		queue?.name?.trim() ||
		fallbacks.queueName?.trim() ||
		'Queue';
	const servingPointName = queue?.serving_point_name?.trim() || '—';
	const tokenDisplay =
		queue?.token_display?.trim() ||
		queue?.current_token?.token_display?.trim() ||
		'—';
	const tokenStatus =
		queue?.token_status?.trim() ||
		queue?.current_token?.status?.trim() ||
		queue?.status?.trim() ||
		'waiting';

	return { queueName, servingPointName, tokenDisplay, tokenStatus };
}

/** Flatten `other_current_tokens` from all queues for the screen-level active-tokens ticker. */
export function aggregateActiveTokensFromQueues(
	queuesByUuid: Record<string, PublicQueueStatus> | undefined,
): RecentQueueToken[] {
	if (!queuesByUuid) return [];

	const seen = new Set<string>();
	const list: RecentQueueToken[] = [];

	for (const queue of Object.values(queuesByUuid)) {
		for (const token of queue.other_tokens ?? []) {
			if (!token.token_display) continue;
			const key = `${token.token_display}|${token.serving_point_name ?? ''}|${token.called_at ?? ''}`;
			if (seen.has(key)) continue;
			seen.add(key);
			list.push(token);
		}
	}

	return list;
}

export interface PublicQueueStatusResponse {
	count: number;
	queues: PublicQueueStatus[];
	/** Flat list of recently-served tokens across all queues (if returned by API). */
	recent_tokens?: RecentQueueToken[];
}

const unwrap = <T>(request: Promise<{ data: T }>) => request.then((response) => response.data);

export const publicScreenApi = {
	getScreen: async (screenUuid: string): Promise<PublicScreenResponse> => {
		const data = await unwrap<PublicScreenResponse>(
			publicAxios.post('api/public/screen/', { screen_uuid: screenUuid }),
		);
		const templates = sortPublicScreenTemplatesByOrder(data.templates ?? []);
		return {
			...data,
			templates,
			template_count: templates.length,
		};
	},
	getQueueStatus: (screenUuid: string, queueUuids: string[]) =>
		unwrap<PublicQueueStatusResponse>(
			publicAxios.post('api/public/queue-status/', {
				screen_uuid: screenUuid,
				queue_uuids: queueUuids,
			}),
		),
};
