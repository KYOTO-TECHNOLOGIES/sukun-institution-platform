/** Parse template `configuration` (object or JSON string). */
export function parseTemplateConfiguration(
	configuration?: Record<string, unknown> | string | null,
): Record<string, unknown> {
	if (!configuration) return {};
	if (typeof configuration === 'string') {
		try {
			const parsed = JSON.parse(configuration) as unknown;
			return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
				? (parsed as Record<string, unknown>)
				: {};
		} catch {
			return {};
		}
	}
	if (typeof configuration === 'object' && !Array.isArray(configuration)) {
		return configuration;
	}
	return {};
}

/**
 * Template layer opacity over a screen background (0 = transparent, 1 = opaque).
 * Stored in configuration as `overlay_opacity` (0–1). Legacy 0–100 values are supported.
 */
export function getTemplateOverlayOpacity(
	configuration?: Record<string, unknown> | string | null,
): number {
	const config = parseTemplateConfiguration(configuration);
	const raw = config.overlay_opacity ?? config.template_overlay_opacity;

	if (raw == null || raw === '') return 1;

	const n = Number(raw);
	if (!Number.isFinite(n)) return 1;

	if (n > 1) return Math.min(1, Math.max(0, n / 100));
	return Math.min(1, Math.max(0, n));
}

/** Slider value 0–100 for the template editor UI. */
export function getTemplateOverlayOpacityPercent(
	configuration?: Record<string, unknown> | string | null,
): number {
	return Math.round(getTemplateOverlayOpacity(configuration) * 100);
}
