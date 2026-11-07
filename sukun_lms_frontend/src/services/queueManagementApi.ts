import { authAxios } from '../axiosInstance';

export interface PaginatedResponse<T> {
	count: number;
	next?: string | null;
	previous?: string | null;
	results: T[];
}

export interface User {
	id: number;
	username: string;
	email: string;
	first_name?: string;
	last_name?: string;
	is_staff?: boolean;
	is_superuser?: boolean;
	date_joined?: string;
	last_login?: string | null;
	role?: UserRole;
}

export interface UserRole {
	id: number;
	name: string;
	description?: string;
}

export interface QueueUser {
	id: number;
	user: number;
	role: number;
	is_active: boolean;
	created_at?: string;
}

export interface QueueGroup {
	id: number;
	name: string;
	description?: string;
	is_active?: boolean;
	/** From GET /api/queues/groups/ list/detail. */
	queue_count?: number;
	created_at?: string;
	updated_at?: string;
}

export interface QueueGroupQueueRef {
	id: number;
	name: string;
	description?: string;
	limit?: number;
}

export interface QueueGroupDetail extends QueueGroup {
	queues?: QueueGroupQueueRef[];
}

export interface ServingPoint {
	id: number;
	name: string;
	/** Single id from older responses, or list when the API links a point to multiple queues. */
	queue: Queue[] | number[];
	description?: string;
	status?: string;
	is_available?: boolean;
	is_active?: boolean;
	created_at?: string;
	assigned_user?: User[];

}

/** GET /api/queues/serving-points/{id}/current-serving-window/ */
export interface CurrentServingWindowResponse {
	serving_point: ServingPoint;
	active_window: ScheduleServingPoint | null;
	windows_with_token_count: number;
	detail?: string;
}

export interface Queue {
	id: number;
	uuid?: string;
	name: string;
	description?: string;
	group?: number;
	group_name?: string;
	limit?: number;
	grace_period_minutes?: number;
	allow_postpone?: boolean;
	is_reporting_enabled?: boolean;
	token_prefix?: string;
	is_active?: boolean;
	/** e.g. `"active"` | `"inactive"` when returned by the API. */
	status?: string;
	serving_points?: ServingPoint[];
	/** Queues tokens can advance to after this queue (ids or nested on GET). */
	next_queues?: Queue[] | number[];
	created_at?: string;
	updated_at?: string;
}

/** GET /api/queues/{id}/statistics/ */
export interface QueueStatistics {
	queue_id: number;
	queue_name: string;
	total_tokens: number;
	today_tokens?: number;
	completed: number;
	cancelled: number;
	/** Tokens waiting to be served (checked in). */
	waiting: number;
	serving: number;
	current_count?: number;
	/** Optional legacy or extended stats */
	no_show?: number;
	avg_wait_time?: string;
	avg_service_time?: string;
	current_serving?: Array<{
		token_number: string;
		customer_name: string;
		wait_time?: string;
	}>;
}

export type TokenStatus =
	| 'registred'
	| 'waiting'
	| 'serving'
	| 'completed'
	| 'cancelled'
	| 'postponed'
	| 'no_show';

export interface TokenUser {
	id?: number;
	uuid?: string;
	name: string;
	email?: string;
	phone?: string;
	age?: number | string;
	place?: string;
	remarks?: string;
	created_at?: string;
	updated_at?: string;
}

/** GET /api/queues/{id}/currently_serving/ — rows for “currently serving” UI (shape may vary; map in the component). */
export interface CurrentlyServingEntry {
	id?: number;
	token_number?: string | number;
	token_display?: string;
	token?: string | number;
	customer_name?: string;
	customer?: string;
	token_user?: TokenUser;
	queue_name?: string;
	schedule?: number;
	status?: string;
	created_at?: string;
	started_serving_at?: string | null;
	completed_at?: string | null;
	cancelled_at?: string | null;
	parent_token?: string | number | null;
	notes?: string | null;
	wait_time?: string | null;
	wait?: string | null;
	service_time?: string | null;
	is_priority_queued?: boolean;
	counter?: string;
	serving_point_name?: string;
	counter_name?: string;
	serving_point?: string | { name?: string };
}

export interface TokenQueueRef {
	id: number;
	name: string;
}

/** One visit to a serving point on token detail (`GET /api/tokens/{id}/`). */
export interface TokenServingHistory {
	id: number;
	token: number;
	serving_point: number;
	serving_point_name?: string | null;
	entered_at: string;
	/** Legacy responses: end of visit at counter. */
	exited_at?: string | null;
	duration?: string | null;
	notes?: string | null;
	served_by?: number | null;
	served_by_username?: string | null;
	completed_at?: string | null;
	completed_by?: number | null;
	completed_by_username?: string | null;
	no_show_marked_at?: string | null;
	no_show_marked_by?: number | null;
	no_show_marked_by_username?: string | null;
	postponed_at?: string | null;
	postponed_by?: number | null;
	postponed_by_username?: string | null;
	cancelled_at?: string | null;
	cancelled_by?: number | null;
	cancelled_by_username?: string | null;
	skipped_at?: string | null;
	skipped_by?: number | null;
	skipped_by_username?: string | null;
	token_display?: string | null;
	token_id?: number | null;
	/** Aggregated history: row is for the viewed token or a linked parent token. */
	relationship?: 'parent' | 'self' | string | null;
}

/** Parent chain item on token detail (`GET /api/tokens/{id}/`). */
export interface TokenParentSummary {
	id: number;
	token_number?: string | number;
	token_display?: string | null;
	status: TokenStatus | string;
	created_at?: string;
}

export interface Token {
	id: number;
	/** Customer-facing token label when provided by the API (e.g. token detail). */
	token_display?: string | null;
	token_number: string;
	/** Prefix + number label from API (e.g. queue prefix + token number). */
	token_user?: TokenUser;
	queue: number | TokenQueueRef;
	/** Schedule id this token belongs to */
	schedule?: number | null;
	queue_name?: string;
	status: TokenStatus;
	priority?: number;
	is_vip?: boolean;
	/** When true, token is treated as prioritized in the queue (API field name). */
	is_priority_queued?: boolean;
	created_at?: string;
	started_serving_at?: string | null;
	completed_at?: string | null;
	cancelled_at?: string | null;
	/** Parent token id when this token was split or chained from another. */
	parent_token?: number | null;
	/** Nested parent token summaries when provided by the API. */
	parent_tokens?: TokenParentSummary[] | null;
	notes?: string | null;
	wait_time?: string;
	service_time?: string | null;
	/** Full lineage-aware serving events for token detail (`GET /api/tokens/{id}/`). */
	complete_serving_history?: TokenServingHistory[] | null;
	/** Older API shape; prefer `complete_serving_history` when present. */
	serving_history?: TokenServingHistory[] | null;
	/** Nested on current-serving-window `active_window.current_token`. */
	schedule_allow_postpone?: boolean | string;
	schedule_status?: string;
}

export interface QueueStatus {
	queue_id: number | string;
	/** Checked-in tokens waiting to be served. */
	waiting: number;
	serving: number;
	completed_today: number;
	total: number;
}

/** POST /api/tokens/create-token/ — flat body per backend */
export interface CreateTokenPayload {
	schedule_id: number;
	name: string;
	email?: string;
	phone?: string;
	age?: number;
	place?: string;
	remarks?: string;
	priority?: number;
	is_vip?: boolean;
	token_number?: number | string;
}

/** Nested `token_user` body for PATCH — mirrors GET token response shape. */
export interface PatchTokenUserPayload {
	id?: number;
	name?: string;
	email?: string;
	phone?: string;
	age?: number | null;
	place?: string;
	remarks?: string;
	is_priority_queued?: boolean;
}

/** PATCH /api/tokens/{id}/ — send customer fields under `token_user` like the list/detail response. */
export interface PatchTokenPayload {
	token_user?: PatchTokenUserPayload;
	notes?: string | null;
	priority?: number;
	is_vip?: boolean;
	is_priority_queued?: boolean;
}

export interface CreateQueueGroupPayload {
	name: string;
	description?: string;
	/** Queue ids to assign to this group on create (when supported by the API). */
	queues?: number[];
}

export interface UpdateQueueGroupPayload {
	name?: string;
	description?: string;
}

export interface CreateQueuePayload {
	name: string;
	description?: string;
	limit?: number;
	grace_period_minutes?: number;
	allow_postpone?: boolean;
	is_reporting_enabled?: boolean;
	token_prefix?: string;
	serving_points?: number[];
	next_queues?: number[];
}

export interface UpdateQueuePayload {
	name?: string;
	description?: string;
	group?: number | null;
	limit?: number;
	grace_period_minutes?: number;
	allow_postpone?: boolean;
	is_reporting_enabled?: boolean;
	token_prefix?: string;
	serving_points?: number[];
	next_queues?: number[];
}

export interface CreateServingPointPayload {
	name: string;
	queue: number[];
	description?: string;
	is_active?: boolean;
	assigned_users?: number[];
}

export interface UpdateServingPointPayload {
	name?: string;
	queue?: number[];
	description?: string;
	status?: string;
	is_available?: boolean;
	is_active?: boolean;
	assigned_users?: number[];
}

export interface CreateUserPayload {
	username: string;
	email: string;
	password: string;
	first_name?: string;
	last_name?: string;
}

export type ScheduleApiStatus = string;

export interface QueueSchedule {
	id: number;
	queue: number;
	queue_name?: string;
	from_datetime: string | null;
	to_datetime: string | null;
	description?: string;
	current_token?: number | Token | null;
	/** Prefixed label for the active token on this schedule. */
	current_token_display?: string | null;
	current_token_number?: string | null;
	waiting_token_count?: number;
	scheduled_token_count?: number;
	status: ScheduleApiStatus;
	limit?: number;
	token_from?: number;
	token_to?: number;
	/** Optional override of the queue token prefix for this schedule (edit / PATCH). */
	token_prefix?: string | null;
	available_serving_points?: number[];
	allow_postpone?: boolean;
	/** From schedule detail API; gates registered → waiting in schedule token UI. */
	is_reporting_enabled?: boolean;
	serving_point_windows?: ScheduleServingPoint[];
	created_at?: string;
	updated_at?: string;
}

export interface CreateSchedulePayload {
	queue: number;
	from_datetime: string;
	to_datetime: string;
	description?: string;
	status?: string;
	limit?: number;
	token_from?: number;
	token_to?: number;
	is_reporting_enabled?: boolean;
	allow_postpone?: boolean;
}

export interface PatchSchedulePayload {
	from_datetime?: string;
	to_datetime?: string;
	description?: string;
	status?: string;
	limit?: number;
	token_from?: number;
	token_to?: number;
	token_prefix?: string | null;
	is_reporting_enabled?: boolean;
	allow_postpone?: boolean;
}

export interface ScheduleServingPoint {
	id: number;
	queue_schedule: number;
	queue_schedule_queue_id?: number;
	serving_point: number;
	serving_point_name?: string;
	serving_point_status?: string;
	from_datetime: string;
	to_datetime: string;
	status?: string;
	schedule_status?: string;
	current_token?: number | Token | null;
	current_token_number?: string | null;
	current_token_status?: string | null;
	/** Default next queue when completing (current-serving-window). */
	next_queue?: { id: number; name: string } | null;
	created_at?: string;
	updated_at?: string;
}

/** POST /api/queues/schedule-serving-points/{id}/postpone/ */
export interface ScheduleServingPointPostponeResponse extends ScheduleServingPoint {
	detail?: string;
	new_token_number?: number;
	new_token?: Token;
}

/** POST /api/queues/schedule-serving-points/{id}/complete/ (with next_queue_id) */
export interface ScheduleServingPointCompleteResponse extends ScheduleServingPoint {
	detail?: string;
	next_token?: Token;
}

export interface CreateScheduleServingPointPayload {
	queue_schedule: number;
	serving_point: number;
	from_datetime: string;
	to_datetime: string;
}

export interface PatchScheduleServingPointPayload {
	from_datetime?: string;
	to_datetime?: string;
	status?: string;
}

/** POST /api/queues/schedule-serving-points/{id}/set_status/ */
export interface SetScheduleServingPointStatusPayload {
	status: string;
}

export interface SetScheduleServingPointsPayload {
	serving_point_ids: number[];
}

export interface QueryParams {
	[key: string]: string | number | boolean | undefined;
	search?: string;
	ordering?: string;
	page?: number;
	page_size?: number;
	/** DRF LimitOffsetPagination — used by `api/tokens/` */
	limit?: number;
	/** DRF LimitOffsetPagination — used by `api/tokens/` */
	offset?: number;
	queue?: number | string;
	queue_id?: number | string;
	schedule?: number | string;
	status?: TokenStatus | string;
	group?: number | string;
	is_available?: boolean | string;
	/** Schedules list: single calendar day `YYYY-MM-DD` if the backend supports it. */
	date?: string;
	/** Schedules list: window overlaps local day — `to_datetime >= dayStart` (ISO 8601). */
	to_datetime__gte?: string;
	/** Schedules list: window overlaps local day — `from_datetime <= dayEnd` (ISO 8601). */
	from_datetime__lte?: string;
}

const unwrap = <T>(request: Promise<{ data: T }>) => request.then((response) => response.data);

export const usersApi = {
	list: (params?: QueryParams) => unwrap<PaginatedResponse<User>>(authAxios.get('api/users/', { params })),
	get: (id: number) => unwrap<User>(authAxios.get(`api/users/${id}/`)),
	me: () => unwrap<User>(authAxios.get('api/users/me/')),
	create: (payload: CreateUserPayload) => unwrap<User>(authAxios.post('api/users/', payload)),
	setPassword: (id: number, payload: { old_password: string; password: string }) =>
		unwrap<{ detail: string }>(authAxios.post(`api/users/${id}/set-password/`, payload)),
	roles: () => unwrap<PaginatedResponse<UserRole>>(authAxios.get('api/users/roles/')),
	queueUsers: () => unwrap<PaginatedResponse<QueueUser>>(authAxios.get('api/users/queue-users/')),
};

export const queuesApi = {
	list: (params?: QueryParams) =>
		unwrap<PaginatedResponse<Queue>>(authAxios.get('api/queues/', { params })),
	get: (id: number) => unwrap<Queue>(authAxios.get(`api/queues/${id}/`)),
	create: (payload: CreateQueuePayload) => unwrap<Queue>(authAxios.post('api/queues/', payload)),
	update: (id: number, payload: UpdateQueuePayload) =>
		unwrap<Queue>(authAxios.patch(`api/queues/${id}/`, payload)),
	statistics: (id: number) =>
		unwrap<QueueStatistics>(authAxios.get(`api/queues/${id}/statistics/`)),
	currentlyServing: (id: number, params?: QueryParams) =>
		unwrap<CurrentlyServingEntry[] | PaginatedResponse<CurrentlyServingEntry>>(
			authAxios.get(`api/queues/${id}/currently_serving/`, { params }),
		),
	activate: (id: number) => unwrap<Queue>(authAxios.post(`api/queues/${id}/activate/`)),
	deactivate: (id: number) => unwrap<Queue>(authAxios.post(`api/queues/${id}/deactivate/`)),
	groups: (params?: QueryParams) =>
		unwrap<PaginatedResponse<QueueGroup>>(authAxios.get('api/queues/groups/', { params })),
	getGroup: (id: number) => unwrap<QueueGroupDetail>(authAxios.get(`api/queues/groups/${id}/`)),
	getGroupQueues: (id: number) =>
		unwrap<QueueGroupQueueRef[]>(authAxios.get(`api/queues/groups/${id}/queues/`)),
	createGroup: (payload: CreateQueueGroupPayload) =>
		unwrap<QueueGroup>(authAxios.post('api/queues/groups/', payload)),
	updateGroup: (id: number, payload: UpdateQueueGroupPayload) =>
		unwrap<QueueGroup>(authAxios.patch(`api/queues/groups/${id}/`, payload)),
	deleteGroup: (id: number) => unwrap<void>(authAxios.delete(`api/queues/groups/${id}/`)),
	servingPoints: (params?: QueryParams) =>
		unwrap<PaginatedResponse<ServingPoint>>(authAxios.get('api/queues/serving-points/', { params })),
	getServingPoint: (id: number) =>
		unwrap<ServingPoint>(authAxios.get(`api/queues/serving-points/${id}/`)),
	/** GET /api/queues/serving-points/{id}/current-serving-window/ */
	currentServingWindow: (id: number) =>
		unwrap<CurrentServingWindowResponse>(
			authAxios.get(`api/queues/serving-points/${id}/current-serving-window/`),
		),
	createServingPoint: (payload: CreateServingPointPayload) =>
		unwrap<ServingPoint>(authAxios.post('api/queues/serving-points/', payload)),
	updateServingPoint: (id: number, payload: UpdateServingPointPayload) =>
		unwrap<ServingPoint>(authAxios.patch(`api/queues/serving-points/${id}/`, payload)),
};

export const schedulesApi = {
	list: (params?: QueryParams) =>
		unwrap<PaginatedResponse<QueueSchedule>>(authAxios.get('api/queues/schedules/', { params })),
	get: (id: number) => unwrap<QueueSchedule>(authAxios.get(`api/queues/schedules/${id}/`)),
	create: (payload: CreateSchedulePayload) =>
		unwrap<QueueSchedule>(authAxios.post('api/queues/schedules/', payload)),
	update: (id: number, payload: CreateSchedulePayload) =>
		unwrap<QueueSchedule>(authAxios.put(`api/queues/schedules/${id}/`, payload)),
	patch: (id: number, payload: PatchSchedulePayload) =>
		unwrap<QueueSchedule>(authAxios.patch(`api/queues/schedules/${id}/`, payload)),
	delete: (id: number) => unwrap<void>(authAxios.delete(`api/queues/schedules/${id}/`)),
	refreshCurrentToken: (id: number) =>
		unwrap<QueueSchedule>(authAxios.post(`api/queues/schedules/${id}/refresh-current-token/`)),
	setAvailableServingPoints: (id: number, payload: SetScheduleServingPointsPayload) =>
		unwrap<unknown>(
			authAxios.post(`api/queues/schedules/${id}/set-available-serving-points/`, payload),
		),
};

export const scheduleServingPointsApi = {
	list: (params?: QueryParams) =>
		unwrap<PaginatedResponse<ScheduleServingPoint>>(
			authAxios.get('api/queues/schedule-serving-points/', { params }),
		),
	get: (id: number) => unwrap<ScheduleServingPoint>(authAxios.get(`api/queues/schedule-serving-points/${id}/`)),
	create: (payload: CreateScheduleServingPointPayload) =>
		unwrap<ScheduleServingPoint>(authAxios.post('api/queues/schedule-serving-points/', payload)),
	update: (id: number, payload: CreateScheduleServingPointPayload) =>
		unwrap<ScheduleServingPoint>(authAxios.put(`api/queues/schedule-serving-points/${id}/`, payload)),
	patch: (id: number, payload: PatchScheduleServingPointPayload) =>
		unwrap<ScheduleServingPoint>(authAxios.patch(`api/queues/schedule-serving-points/${id}/`, payload)),
	startServing: (id: number) =>
		unwrap<ScheduleServingPoint>(
			authAxios.post(`api/queues/schedule-serving-points/${id}/start-serving/`),
		),
	complete: (id: number, options?: { serving_point_status?: string; next_queue_id?: number }) => {
		const body: Record<string, string | number> = {};
		const trimmed = options?.serving_point_status?.trim();
		if (trimmed) body.serving_point_status = trimmed;
		if (options?.next_queue_id != null) body.next_queue_id = options.next_queue_id;
		return unwrap<ScheduleServingPointCompleteResponse>(
			authAxios.post(`api/queues/schedule-serving-points/${id}/complete/`, body),
		);
	},
	cancel: (id: number, options?: { serving_point_status?: string }) => {
		const trimmed = options?.serving_point_status?.trim();
		const body = trimmed ? { serving_point_status: trimmed } : {};
		return unwrap<ScheduleServingPoint>(
			authAxios.post(`api/queues/schedule-serving-points/${id}/cancel/`, body),
		);
	},
	noShow: (id: number, options?: { serving_point_status?: string }) => {
		const trimmed = options?.serving_point_status?.trim();
		const body = trimmed ? { serving_point_status: trimmed } : {};
		return unwrap<ScheduleServingPoint>(
			authAxios.post(`api/queues/schedule-serving-points/${id}/no-show/`, body),
		);
	},
	postpone: (id: number, options?: { serving_point_status?: string }) => {
		const trimmed = options?.serving_point_status?.trim();
		const body = trimmed ? { serving_point_status: trimmed } : {};
		return unwrap<ScheduleServingPointPostponeResponse>(
			authAxios.post(`api/queues/schedule-serving-points/${id}/postpone/`, body),
		);
	},
	skipToken: (id: number, options?: { serving_point_status?: string }) => {
		const trimmed = options?.serving_point_status?.trim();
		const body = trimmed ? { serving_point_status: trimmed } : {};
		return unwrap<ScheduleServingPoint>(
			authAxios.post(`api/queues/schedule-serving-points/${id}/skip-token/`, body),
		);
	},
	setStatus: (id: number, payload: SetScheduleServingPointStatusPayload) =>
		unwrap<ScheduleServingPoint>(
			authAxios.post(`api/queues/schedule-serving-points/${id}/set_status/`, payload),
		),
	delete: (id: number) => unwrap<void>(authAxios.delete(`api/queues/schedule-serving-points/${id}/`)),
};

export interface QueueEvent {
	id: number;
	event_type: string;
	/** Human-readable label from API (e.g. "Schedule Status Change"). */
	event_type_display?: string | null;
	description?: string | null;
	timestamp?: string | null;
	created_at?: string | null;
	updated_at?: string | null;
	token?: number | null;
	token_number?: string | null;
	serving_point?: number | null;
	serving_point_name?: string | null;
	schedule?: number | null;
	schedule_name?: string | null;
	queue_name?: string | null;
	user?: number | null;
	user_username?: string | null;
	actor_name?: string | null;
	details?: Record<string, unknown> | null;
	[key: string]: unknown;
}

export const eventsApi = {
	bySchedule: (scheduleId: number, date?: string) =>
		unwrap<QueueEvent[] | PaginatedResponse<QueueEvent>>(
			authAxios.get('api/queues/events/by-schedule/', {
				params: { schedule_id: scheduleId, ...(date ? { date } : {}) },
			}),
		),
	byServingPoint: (servingPointId: number, date?: string) =>
		unwrap<QueueEvent[] | PaginatedResponse<QueueEvent>>(
			authAxios.get('api/queues/events/by-serving-point/', {
				params: { serving_point_id: servingPointId, ...(date ? { date } : {}) },
			}),
		),
};

export const tokensApi = {
	list: (params?: QueryParams) =>
		unwrap<PaginatedResponse<Token>>(authAxios.get('api/tokens/', { params })),
	/** GET /api/tokens/{id}/ — full token detail (DRF retrieve). */
	get: (id: number) => unwrap<Token>(authAxios.get(`api/tokens/${id}/`)),
	patch: (id: number, payload: PatchTokenPayload) =>
		unwrap<Token>(authAxios.patch(`api/tokens/${id}/`, payload)),
	create: (payload: CreateTokenPayload) =>
		unwrap<Token>(authAxios.post('api/tokens/create-token/', payload)),
	queueStatus: (queueId: number) =>
		unwrap<QueueStatus>(authAxios.get('api/tokens/queue-status/', { params: { queue_id: queueId } })),
	recent: (limit = 10) =>
		unwrap<Token[]>(authAxios.get('api/tokens/recent/', { params: { limit } })),
	today: () => unwrap<Token[]>(authAxios.get('api/tokens/today/')),
	markArrived: (id: number) => unwrap<Token>(authAxios.post(`api/tokens/${id}/mark-arrived/`)),
	startServing: (id: number) => unwrap<Token>(authAxios.post(`api/tokens/${id}/start-serving/`)),
	completeServing: (id: number) =>
		unwrap<Token>(authAxios.post(`api/tokens/${id}/complete-serving/`)),
	cancel: (id: number) => unwrap<Token>(authAxios.post(`api/tokens/${id}/cancel/`)),
	postpone: (id: number) => unwrap<Token>(authAxios.post(`api/tokens/${id}/postpone/`)),
	markNoShow: (id: number) => unwrap<Token>(authAxios.post(`api/tokens/${id}/mark-no-show/`)),
	getNextTokenNumber: (scheduleId: number) =>
		unwrap<{ next_token_number: number }>(
			authAxios.get('api/tokens/get_next_token_number/', { params: {schedule_id: scheduleId} }),
		),
	users: (params?: QueryParams) =>
		unwrap<PaginatedResponse<TokenUser>>(authAxios.get('api/tokens/users/', { params })),
	patchUser: (id: number, payload: PatchTokenUserPayload) =>
		unwrap<TokenUser>(authAxios.patch(`api/tokens/users/${id}/`, payload)),
	usersByPhone: (phone: string) =>
		unwrap<TokenUser[]>(authAxios.get('api/tokens/users/by-phone/', { params: { phone } })),
	usersByEmail: (email: string) =>
		unwrap<TokenUser[]>(authAxios.get('api/tokens/users/by-email/', { params: { email } })),
};
