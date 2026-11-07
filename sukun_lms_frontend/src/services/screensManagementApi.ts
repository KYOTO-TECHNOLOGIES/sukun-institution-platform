import { authAxios, authAxiosFileUpload } from '../axiosInstance';
import type { ScreenTemplateAssignment } from './screenTemplatesApi';

export interface PaginatedResponse<T> {
	count: number;
	next?: string | null;
	previous?: string | null;
	results: T[];
}

export interface ScreenTemplate {
	id: number;
	name: string;
}

export interface ScreenQueueRef {
	id: number;
	name: string;
}

export interface ScreenGroupRef {
	id: number;
	name: string;
	description?: string;
}

export interface ScreenGroup {
	id: number;
	name: string;
	description?: string;
	screen_count?: number;
	screen_ids?: number[];
	created_at?: string;
	updated_at?: string;
}

export interface ScreenGroupScreenRef {
	id: number;
	uuid?: string;
	name: string;
	location?: string;
	description?: string | null;
	is_active?: boolean;
	is_online?: boolean;
	last_heartbeat?: string | null;
}

export interface ScreenGroupDetail extends ScreenGroup {
	screens?: ScreenGroupScreenRef[];
}

export interface CreateScreenGroupPayload {
	name: string;
	description?: string;
	screen_ids?: number[];
}

export interface UpdateScreenGroupPayload {
	name?: string;
	description?: string;
	screen_ids?: number[];
}

export interface ScreenIdsPayload {
	screen_ids: number[];
}

export interface CreateScreenPayload {
	name: string;
	location?: string;
	description?: string;
	ip_address?: string | null;
	ip_bind?: boolean;
	is_active: boolean;
}

export interface UpdateScreenPayload {
	name?: string;
	location?: string;
	description?: string;
	ip_address?: string | null;
	ip_bind?: boolean;
	is_active?: boolean;
	enable_audio?: boolean;
}

export interface Screen {
	id: number;
	uuid?: string;
	name: string;
	location?: string;
	description?: string;
	ip_address?: string | null;
	ip_bind?: boolean;
	screen_groups?: ScreenGroupRef[];
	template?: ScreenTemplate | null;
	screen_templates?: ScreenTemplateAssignment[];
	queues?: ScreenQueueRef[];
	enable_audio?: boolean;
	is_active?: boolean;
	is_online?: boolean;
	background_image?: string | null;
	last_heartbeat?: string | null;
	created_at?: string;
	updated_at?: string;
}

const unwrap = <T>(request: Promise<{ data: T }>) => request.then((response) => response.data);

/** GET /api/screens/groups/ may return a plain array or a paginated envelope. */
const unwrapScreenGroupList = (request: Promise<{ data: ScreenGroup[] | PaginatedResponse<ScreenGroup> }>) =>
	request.then((response) => {
		const data = response.data;
		if (Array.isArray(data)) return data;
		return data.results ?? [];
	});

/** Screens with no group memberships (API allows multiple groups per screen). */
export function isUngroupedScreen(screen: Screen): boolean {
	return !screen.screen_groups?.length;
}

/** Build multipart body for POST `api/screens/` (includes optional `background_image` file). */
export function buildCreateScreenFormData(payload: CreateScreenPayload, backgroundImage?: File | null) {
	const formData = new FormData();
	formData.append('name', payload.name);
	formData.append('location', payload.location ?? '');
	formData.append('description', payload.description ?? '');
	if (payload.ip_address) {
		formData.append('ip_address', payload.ip_address);
	}
	formData.append('ip_bind', String(Boolean(payload.ip_bind)));
	formData.append('is_active', String(Boolean(payload.is_active)));
	if (backgroundImage) {
		formData.append('background_image', backgroundImage);
	}
	return formData;
}

export const screensApi = {
	create: (payload: CreateScreenPayload, backgroundImage?: File | null) =>
		unwrap<Screen>(
			authAxiosFileUpload.post(
				'api/screens/',
				buildCreateScreenFormData(payload, backgroundImage),
			),
		),
	list: (params?: {
		location?: string;
		search?: string;
		is_active?: boolean;
		is_online?: boolean;
		limit?: number;
		offset?: number;
	}) => unwrap<PaginatedResponse<Screen>>(authAxios.get('api/screens/', { params })),
	get: (id: number) => unwrap<Screen>(authAxios.get(`api/screens/${id}/`)),
	update: (id: number, payload: UpdateScreenPayload) =>
		unwrap<Screen>(authAxios.patch(`api/screens/${id}/`, payload)),
	remove: (id: number) => authAxios.delete(`api/screens/${id}/`),
	groups: (params?: { search?: string; ordering?: string }) =>
		unwrapScreenGroupList(authAxios.get('api/screens/groups/', { params })),
	getGroup: (id: number) => unwrap<ScreenGroupDetail>(authAxios.get(`api/screens/groups/${id}/`)),
	getGroupScreens: (id: number) =>
		unwrap<ScreenGroupScreenRef[]>(authAxios.get(`api/screens/groups/${id}/screens/`)),
	createGroup: (payload: CreateScreenGroupPayload) =>
		unwrap<ScreenGroup>(authAxios.post('api/screens/groups/', payload)),
	updateGroup: (id: number, payload: UpdateScreenGroupPayload) =>
		unwrap<ScreenGroup>(authAxios.patch(`api/screens/groups/${id}/`, payload)),
	deleteGroup: (id: number) => authAxios.delete(`api/screens/groups/${id}/`),
	addGroupScreens: (id: number, payload: ScreenIdsPayload) =>
		unwrap<ScreenGroupDetail>(authAxios.post(`api/screens/groups/${id}/add-screens/`, payload)),
	removeGroupScreens: (id: number, payload: ScreenIdsPayload) =>
		unwrap<ScreenGroupDetail>(authAxios.post(`api/screens/groups/${id}/remove-screens/`, payload)),
	heartbeat: (id: number) => unwrap<Screen>(authAxios.post(`api/screens/${id}/heartbeat/`)),
	activate: (id: number) => unwrap<Screen>(authAxios.post(`api/screens/${id}/activate/`)),
	deactivate: (id: number) => unwrap<Screen>(authAxios.post(`api/screens/${id}/deactivate/`)),
	toggleAudio: (id: number, enable_audio: boolean) =>
		unwrap<Screen>(authAxios.patch(`api/screens/${id}/`, { enable_audio })),
	onlineScreens: () => unwrap<Screen[]>(authAxios.get('api/screens/online-screens/')),
	byLocation: (location: string) =>
		unwrap<Screen[]>(authAxios.get('api/screens/by-location/', { params: { location } })),
};
