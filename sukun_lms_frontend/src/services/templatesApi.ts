import { authAxios } from '../axiosInstance';
import { baseURL } from '../helpers/baseURL';

export interface PaginatedResponse<T> {
	count: number;
	next?: string | null;
	previous?: string | null;
	results: T[];
}

interface AdminTemplateResponse {
	id: number;
	name: string;
	description?: string;
	html_content?: string;
	css_content?: string;
	configuration?: Record<string, unknown> | string;
	thumbnail?: string | null;
	is_active?: boolean;
	created_at?: string;
	updated_at?: string;
}

export interface Template {
	id: number;
	template_name: string;
	description?: string;
	orientation: 'landscape' | 'portrait';
	resolution_width: number;
	resolution_height: number;
	thumbnail?: string | null;
	html_content?: string;
	file_type?: string;
	created_at?: string;
	updated_at?: string;
	configuration?: Record<string, unknown> | string;
}

export interface CreateTemplatePayload {
	name: string;
	description?: string;
	// orientation: 'landscape' | 'portrait';
	// resolution_width: number;
	// resolution_height: number;
	// file_type?: string;
}

const unwrap = <T>(request: Promise<{ data: T }>) => request.then((r) => r.data);

/** Backend may return http URLs or paths without the /media/ prefix. */
export const resolveTemplateThumbnailUrl = (
	thumbnail?: string | null,
): string | null => {
	if (!thumbnail?.trim()) return null;

	const trimmed = thumbnail.trim();

	if (trimmed.startsWith('/')) {
		const path = trimmed.startsWith('/media/') ? trimmed : `/media${trimmed}`;
		return `${baseURL}${path}`;
	}

	if (!/^https?:\/\//i.test(trimmed)) {
		const path = trimmed.replace(/^\/+/, '');
		return `${baseURL}/media/${path}`;
	}

	try {
		const url = new URL(trimmed);
		const apiBase = new URL(baseURL);

		url.protocol = apiBase.protocol;
		url.host = apiBase.host;

		if (url.pathname.startsWith('/templates/')) {
			url.pathname = `/media${url.pathname}`;
		}

		return url.toString();
	} catch {
		return trimmed;
	}
};

const parseStyleValue = (style: string, prop: string): string | null => {
	const match = style.match(new RegExp(`${prop}\\s*:\\s*([^;]+)`, 'i'));
	return match ? match[1].trim() : null;
};

const parsePx = (value: string | null | undefined): number => {
	if (!value) return 0;
	const n = parseFloat(value.replace(/px$/i, '').trim());
	return Number.isFinite(n) ? Math.round(n) : 0;
};

const parseDimensionsFromHtml = (
	html?: string,
): { width: number; height: number } | null => {
	if (!html?.trim()) return null;
	const doc = new DOMParser().parseFromString(html, 'text/html');
	const container = doc.querySelector('.template-container');
	if (!container) return null;
	const style = container.getAttribute('style') ?? '';
	const width = parsePx(parseStyleValue(style, 'width'));
	const height = parsePx(parseStyleValue(style, 'height'));
	if (!width || !height) return null;
	return { width, height };
};

const mapAdminTemplateToTemplate = (item: AdminTemplateResponse): Template => {
	const config =
		typeof item.configuration === 'string'
			? (JSON.parse(item.configuration) as Record<string, unknown>)
			: item.configuration;

	const layout = String((config as { layout?: unknown } | undefined)?.layout ?? '')
		.toLowerCase()
		.trim();

	const fromHtml = parseDimensionsFromHtml(item.html_content);
	let resolution_width = fromHtml?.width ?? 1920;
	let resolution_height = fromHtml?.height ?? 1080;

	if (!fromHtml) {
		const isPortrait = layout === 'vertical' || layout === 'portrait';
		resolution_width = isPortrait ? 1080 : 1920;
		resolution_height = isPortrait ? 1920 : 1080;
	}

	const isPortrait = resolution_height > resolution_width;

	return {
		id: item.id,
		template_name: item.name,
		description: item.description,
		orientation: isPortrait ? 'portrait' : 'landscape',
		resolution_width,
		resolution_height,
		thumbnail: resolveTemplateThumbnailUrl(item.thumbnail),
		html_content: item.html_content,
		configuration: config ?? item.configuration,
		created_at: item.created_at,
		updated_at: item.updated_at,
	};
};

export const templatesApi = {
	list: (params?: {
		search?: string;
		is_active?: boolean;
		limit?: number;
		offset?: number;
	}) =>
		unwrap<PaginatedResponse<AdminTemplateResponse>>(
			authAxios.get('api/administration/templates/', { params }),
		).then((res) => ({
			...res,
			results: (res.results ?? []).map(mapAdminTemplateToTemplate),
		})),

	// get: (id: number) => unwrap<Template>(authAxios.get(`api/administration/templates/${id}`)),
	get: async (id: number): Promise<Template> => {
		const res = await unwrap<AdminTemplateResponse>(
			authAxios.get(`api/administration/templates/${id}/`),
		);

		return mapAdminTemplateToTemplate(res);
	},

	// create: (payload: CreateTemplatePayload) =>
	// 	unwrap<Template>(authAxios.post('api/administration/templates/', payload )),

	create: async (payload: CreateTemplatePayload): Promise<Template> => {
		const res = await unwrap<AdminTemplateResponse>(
			authAxios.post('api/administration/templates/', payload),
		);
	
		return mapAdminTemplateToTemplate(res);
	},

	delete: (id: number) => authAxios.delete(`api/administration/templates/${id}/`),

	/** Save layout HTML, configuration (zones + fabric_json), and thumbnail. */
	saveContent: (id: number, formData: FormData) =>
		unwrap<AdminTemplateResponse>(
			authAxios.patch(`api/administration/templates/${id}/`, formData, {
				headers: { 'Content-Type': 'multipart/form-data' },
			}),
		).then(mapAdminTemplateToTemplate),
};
