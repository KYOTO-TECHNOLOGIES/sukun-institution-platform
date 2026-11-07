import { baseURL } from '../helpers/baseURL';

/** Resolve API media paths or relative URLs to an absolute URL for `<img>` / CSS. */
export function resolveMediaUrl(url?: string | null): string | null {
	if (!url?.trim()) return null;

	const trimmed = url.trim();

	if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
		return trimmed;
	}

	if (/^https?:\/\//i.test(trimmed)) {
		return trimmed;
	}

	if (trimmed.startsWith('/')) {
		const path = trimmed.startsWith('/media/') ? trimmed : `/media${trimmed}`;
		return `${baseURL}${path}`;
	}

	const path = trimmed.replace(/^\/+/, '');
	return `${baseURL}/media/${path}`;
}
