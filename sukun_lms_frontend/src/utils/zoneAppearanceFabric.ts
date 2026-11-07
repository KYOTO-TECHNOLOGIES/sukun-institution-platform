import {
	createFillAppearance,
	createThemeAppearance,
	getZoneAppearanceFromSaved,
	parseDisplayThemeId,
	ZONE_DISPLAY_THEME_CONFIGS,
	type ZoneDisplayAppearance,
	type ZoneDisplayThemeId,
} from '../components/MasterComponents/TokenDisplayThemes/tokenDisplayThemes';

/** Custom Fabric rect props persisted in fabric_json. */
export const FABRIC_ZONE_APPEARANCE_PROPS = ['displayTheme', 'zoneFillColor'] as const;

/**
 * Read zone opacity (0–1) from a Fabric rect.
 * Prefers `zoneOpacity` (0–100, editor/save format); falls back to legacy Fabric `opacity` (0–1).
 */
export function getZoneOpacityFromRect(rect: {
	zoneOpacity?: number;
	opacity?: number;
}): number {
	if (typeof rect.zoneOpacity === 'number' && Number.isFinite(rect.zoneOpacity)) {
		return Math.max(0, Math.min(1, rect.zoneOpacity / 100));
	}
	if (typeof rect.opacity === 'number' && Number.isFinite(rect.opacity)) {
		return Math.max(0, Math.min(1, rect.opacity));
	}
	return 1;
}

/** Resolve zone opacity (0–1) for template-wide chrome (e.g. Active Tokens bar). */
export function resolveTemplateZoneBackgroundOpacity(
	zones: { opacity?: number }[],
): number | undefined {
	if (!zones.length) return undefined;
	const opacities = zones.map((z) =>
		typeof z.opacity === 'number' && Number.isFinite(z.opacity) ? z.opacity : 1,
	);
	const opacity = opacities.every((o) => o === opacities[0]) ? opacities[0] : opacities[0];
	return opacity < 1 ? opacity : undefined;
}

/** Minimum Fabric zone rect shape for appearance + HTML overlay positioning. */
export type FabricZoneOverlayRect = {
	id?: string;
	name?: string;
	queueIds?: number[];
	queueChipNames?: string[];
	displayTheme?: string | null;
	zoneFillColor?: string | null;
	fill?: string | null;
	/** Zone opacity 0–100 (editor + saved config). */
	zoneOpacity?: number;
	/** Legacy Fabric built-in opacity (0–1). */
	opacity?: number;
	setCoords?: () => void;
	aCoords?: { tl?: { x: number; y: number }; br?: { x: number; y: number } };
	getBoundingRect?: () => { left: number; top: number; width: number; height: number };
	left?: number;
	top?: number;
	width?: number;
	height?: number;
	scaleX?: number;
	scaleY?: number;
	rx?: number;
};

/** Read theme slug from a Fabric zone rect (direct field or Fabric `.get()`). */
export function readFabricRectDisplayTheme(rect: {
	displayTheme?: string | null;
	get?: (key: string) => unknown;
}): string | null {
	const direct = rect.displayTheme;
	if (typeof direct === 'string' && direct.trim()) return direct.trim();

	if (typeof rect.get === 'function') {
		const fromGet = rect.get('displayTheme');
		if (typeof fromGet === 'string' && fromGet.trim()) return fromGet.trim();
	}

	return null;
}

export function getZoneAppearanceFromRect(rect: {
	displayTheme?: string | null;
	zoneFillColor?: string | null;
	fill?: string | null;
	get?: (key: string) => unknown;
}): ZoneDisplayAppearance {
	const themeId = parseDisplayThemeId(readFabricRectDisplayTheme(rect));
	if (themeId) return createThemeAppearance(themeId);

	const fill = (rect.zoneFillColor ?? rect.fill ?? '').trim();
	if (fill) return createFillAppearance(fill);

	return createFillAppearance('#ffffff');
}

/** Representative solid color for HTML thumbnail / list when zone uses a theme. */
export function themeFallbackBackgroundColor(themeId: ZoneDisplayThemeId): string {
	const fallbacks: Record<ZoneDisplayThemeId, string> = {
		'digital-crimson': '#3a0404',
		'onyx-gold': '#000000',
		'crimson-banner': '#020817',
		'imperial-court': '#02140f',
		'arctic-white': '#0a0b0d',
		'pipboy-terminal': '#020a02',
		'velvet-crown': '#1a0a12',
		'sun-bento': '#fff492',
		'royal-ticket': '#14101f',
	};
	return fallbacks[themeId];
}

export function applyZoneAppearanceToRect(
	rect: { set: (props: Record<string, unknown>) => void },
	appearance: ZoneDisplayAppearance,
	preserveStroke?: string | null,
): void {
	if (appearance.mode === 'theme' && appearance.displayTheme) {
		const config = ZONE_DISPLAY_THEME_CONFIGS[appearance.displayTheme];
		void config;
		rect.set({
			displayTheme: appearance.displayTheme,
			zoneFillColor: appearance.backgroundColor,
			fill: 'rgba(0,0,0,0.2)',
			stroke: preserveStroke ?? 'rgba(255,255,255,0.4)',
			strokeDashArray: [8, 5],
		});
		return;
	}

	const fill = appearance.backgroundColor?.trim() || '#ffffff';
	rect.set({
		displayTheme: null,
		zoneFillColor: fill,
		fill,
		stroke: preserveStroke ?? undefined,
		strokeDashArray: undefined,
	});
}

export function getZoneAppearanceFromSavedZone(zone: {
	theme_id?: string | null;
	themeId?: string | null;
	display_theme?: string | null;
	displayTheme?: string | null;
	background_color?: string | null;
	backgroundColor?: string | null;
}): ZoneDisplayAppearance {
	return getZoneAppearanceFromSaved({
		theme_id: zone.theme_id ?? zone.themeId,
		display_theme: zone.display_theme ?? zone.displayTheme,
		background_color: zone.background_color ?? zone.backgroundColor,
	});
}

/** Resolve fill vs theme for a parsed template zone (html + configuration merge). */
export function getZoneAppearanceFromParsedZone(zone: {
	displayTheme?: string | null;
	backgroundColor?: string;
}): ZoneDisplayAppearance {
	const hasTheme = Boolean(zone.displayTheme?.trim());
	return getZoneAppearanceFromSaved({
		theme_id: zone.displayTheme,
		display_theme: zone.displayTheme,
		background_color: hasTheme ? null : zone.backgroundColor,
		backgroundColor: zone.backgroundColor,
	});
}

/** Zone fields used when painting Fabric rects for list thumbnails. */
export interface ThumbnailZoneConfig {
	theme_id?: string | null;
	display_theme?: string | null;
	background_color?: string | null;
	backgroundColor?: string;
	border?: number | boolean;
	borderColor?: string;
}

type FabricRectSnapshot = {
	fill?: string | null;
	stroke?: string | null;
	strokeDashArray?: number[] | null;
};

/**
 * Capture a PNG from the Fabric canvas for template list thumbnails.
 * Theme zones use HTML overlays in the editor, so their Fabric fill is nearly
 * transparent — temporarily paint each zone with its theme/fill color first.
 */
export function captureTemplateThumbnailFromFabric(
	fc: {
		toDataURL: (opts: { format?: string; quality?: number }) => string;
		requestRenderAll?: () => void;
		renderAll: () => void;
	},
	zoneRects: Array<
		FabricZoneOverlayRect & {
			set?: (props: Record<string, unknown>) => void;
			stroke?: string | null;
			strokeDashArray?: number[] | null;
		}
	>,
	zonesConfig: ThumbnailZoneConfig[],
): string {
	const savedStyles: FabricRectSnapshot[] = zoneRects.map((rect, idx) => {
		const zone = zonesConfig[idx];
		const appearance = zone
			? getZoneAppearanceFromSavedZone(zone)
			: getZoneAppearanceFromRect(rect);

		const prev: FabricRectSnapshot = {
			fill: rect.fill ?? null,
			stroke: rect.stroke ?? null,
			strokeDashArray: rect.strokeDashArray ?? null,
		};

		let fill =
			zone?.backgroundColor?.trim() ||
			(appearance.mode === 'fill' ? appearance.backgroundColor?.trim() : null) ||
			'#ffffff';

		if (appearance.mode === 'theme' && appearance.displayTheme) {
			fill = themeFallbackBackgroundColor(appearance.displayTheme);
		}

		const borderOn = Boolean(zone?.border);
		rect.set?.({
			fill,
			stroke: borderOn ? zone?.borderColor ?? 'black' : 'transparent',
			strokeDashArray: undefined,
		});

		return prev;
	});

	fc.requestRenderAll?.();
	fc.renderAll();
	const dataUrl = fc.toDataURL({ format: 'png', quality: 1 });

	zoneRects.forEach((rect, idx) => {
		const appearance = getZoneAppearanceFromRect(rect);
		const prev = savedStyles[idx];
		if (appearance.mode === 'theme') {
			applyZoneAppearanceToRect(
				{ set: (props) => rect.set?.(props) },
				appearance,
				prev.stroke ?? null,
			);
		} else {
			rect.set?.({
				fill: prev.fill ?? appearance.backgroundColor ?? '#ffffff',
				stroke: prev.stroke,
				strokeDashArray: prev.strokeDashArray,
			});
		}
	});

	fc.renderAll();
	return dataUrl;
}

/** Canvas-pixel bounds for HTML overlays on the template editor canvas. */
export function getZoneOverlayBounds(rect: FabricZoneOverlayRect): {
	left: number;
	top: number;
	width: number;
	height: number;
	borderRadius: number;
} {
	rect.setCoords?.();

	const tl = rect.aCoords?.tl;
	const br = rect.aCoords?.br;
	if (tl && br) {
		return {
			left: Math.min(tl.x, br.x),
			top: Math.min(tl.y, br.y),
			width: Math.abs(br.x - tl.x),
			height: Math.abs(br.y - tl.y),
			borderRadius: rect.rx ?? 0,
		};
	}

	const bound = rect.getBoundingRect?.() ?? {
		left: rect.left ?? 0,
		top: rect.top ?? 0,
		width: (rect.width ?? 0) * (rect.scaleX ?? 1),
		height: (rect.height ?? 0) * (rect.scaleY ?? 1),
	};

	return {
		left: bound.left,
		top: bound.top,
		width: bound.width,
		height: bound.height,
		borderRadius: rect.rx ?? 0,
	};
}

export type ZoneOverlayBounds = ReturnType<typeof getZoneOverlayBounds>;

/** Bounding box union for all zone rects (template editor ticker anchoring). */
export function getZonesUnionBounds(
	rects: FabricZoneOverlayRect[],
): ZoneOverlayBounds | null {
	if (!rects.length) return null;

	let left = Infinity;
	let top = Infinity;
	let right = -Infinity;
	let bottom = -Infinity;

	rects.forEach((rect) => {
		const b = getZoneOverlayBounds(rect);
		left = Math.min(left, b.left);
		top = Math.min(top, b.top);
		right = Math.max(right, b.left + b.width);
		bottom = Math.max(bottom, b.top + b.height);
	});

	if (!Number.isFinite(left) || right <= left || bottom <= top) return null;

	return {
		left,
		top,
		width: right - left,
		height: bottom - top,
		borderRadius: 0,
	};
}

/**
 * Convert any CSS color string to `rgba(r,g,b,alpha)` with the given alpha.
 * Handles `#rrggbb`, `#rgb`, `rgb(...)`, and `rgba(...)` formats.
 * Returns the original string unchanged when the format is unrecognised.
 */
export function applyColorAlpha(color: string, alpha: number): string {
	const a = Math.max(0, Math.min(1, alpha));
	if (a >= 1) return color;
	if (a <= 0) return 'rgba(0,0,0,0)';

	const trimmed = color.trim();

	// #rrggbb or #rgb
	const hexMatch = /^#([0-9a-f]{6}|[0-9a-f]{3})$/i.exec(trimmed);
	if (hexMatch) {
		const h = hexMatch[1];
		const [r, g, b] =
			h.length === 3
				? [
						parseInt(h[0] + h[0], 16),
						parseInt(h[1] + h[1], 16),
						parseInt(h[2] + h[2], 16),
					]
				: [
						parseInt(h.slice(0, 2), 16),
						parseInt(h.slice(2, 4), 16),
						parseInt(h.slice(4, 6), 16),
					];
		return `rgba(${r},${g},${b},${a})`;
	}

	// rgb(r, g, b)
	const rgbMatch = /^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i.exec(trimmed);
	if (rgbMatch) {
		return `rgba(${rgbMatch[1]},${rgbMatch[2]},${rgbMatch[3]},${a})`;
	}

	// rgba(r, g, b, old-alpha) — replace existing alpha
	const rgbaMatch =
		/^rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*[\d.]+\s*\)$/i.exec(trimmed);
	if (rgbaMatch) {
		return `rgba(${rgbaMatch[1]},${rgbaMatch[2]},${rgbaMatch[3]},${a})`;
	}

	return color;
}

/** Active Tokens bar height for themes 6–9 (matches editor + live display clamp). */
export const PIPBOY_TICKER_HEIGHT_RATIO = 0.18;

export function getThemedActiveTokensTickerHeight(
	zoneHeight: number,
	zoneWidth?: number,
): number {
	const h = Math.max(1, zoneHeight);
	const w = Math.max(1, zoneWidth ?? zoneHeight);
	const fromHeight = h * PIPBOY_TICKER_HEIGHT_RATIO;
	// Narrow zones need a shorter band so cards fit without clipping.
	const fromWidth = w * 0.13;
	const raw = Math.min(fromHeight, fromWidth);
	return Math.round(Math.min(130, Math.max(44, raw)));
}
