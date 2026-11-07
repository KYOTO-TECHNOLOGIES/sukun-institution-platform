const LMS_UUID_RE =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface ParsedTemplateZone {
	name: string;
	queueIds: number[];
	queueUuids: string[];
	queueChipNames: string[];
	left: number;
	top: number;
	width: number;
	height: number;
	backgroundColor: string;
	/** Token display theme slug when zone uses theme mode (not fill). */
	displayTheme: string | null;
	borderRadius: number;
	borderColor: string;
	border: boolean;
	/** Zone-level opacity (0–1). Defaults to 1 when not saved. */
	opacity: number;
}

export interface ParsedTemplateLayout {
	width: number;
	height: number;
	zones: ParsedTemplateZone[];
}

function parsePx(value: string | undefined): number {
	if (!value) return 0;
	const n = parseFloat(value.replace(/px$/i, '').trim());
	return Number.isFinite(n) ? n : 0;
}

function parseStyleValue(style: string, prop: string): string | undefined {
	const re = new RegExp(`${prop}\\s*:\\s*([^;]+)`, 'i');
	return re.exec(style)?.[1]?.trim();
}

export function parseQueueRefsFromAttribute(attr: string): { ids: number[]; uuids: string[] } {
	if (!attr?.trim()) return { ids: [], uuids: [] };

	const ids: number[] = [];
	const uuids: string[] = [];

	attr
		.split(',')
		.map((part) => part.trim())
		.filter(Boolean)
		.forEach((part) => {
			if (LMS_UUID_RE.test(part)) {
				uuids.push(part);
				return;
			}
			if (/^\d+$/.test(part)) {
				const id = Number(part);
				if (Number.isFinite(id) && id > 0) ids.push(id);
			}
		});

	return { ids, uuids };
}

export function parseTemplateLayoutFromHtml(html?: string | null): ParsedTemplateLayout | null {
	if (!html?.trim()) return null;

	const doc = new DOMParser().parseFromString(html, 'text/html');
	const container = doc.querySelector('.template-container');
	if (!container) return null;

	const containerStyle = container.getAttribute('style') ?? '';
	const width = parsePx(parseStyleValue(containerStyle, 'width')) || 1920;
	const height = parsePx(parseStyleValue(containerStyle, 'height')) || 1080;

	const zones: ParsedTemplateZone[] = [];
	container.querySelectorAll('.queue-zone').forEach((el) => {
		const style = el.getAttribute('style') ?? '';
		const bgEl = el.querySelector('.queue-zone-bg');
		const bgStyle = bgEl?.getAttribute('style') ?? '';
		const borderRaw = parseStyleValue(style, 'border') ?? '';
		const borderMatch = borderRaw.match(/solid\s+(.+)$/i);
		const queueIdsAttr = el.getAttribute('data-queue-ids') ?? el.getAttribute('data-queue-id') ?? '';
		const { ids: queueIds, uuids: queueUuids } = parseQueueRefsFromAttribute(queueIdsAttr);
		const queueChipNames = Array.from(el.querySelectorAll('.queue-zone-queue-chip'))
			.map((chip) => chip.textContent?.trim() ?? '')
			.filter(Boolean);

		const displayThemeAttr =
			el.getAttribute('data-theme-id')?.trim() ||
			el.getAttribute('data-display-theme')?.trim() ||
			null;

		// New saves: opacity + background live on .queue-zone-bg; legacy: on .queue-zone itself.
		const opacityRaw =
			parseStyleValue(bgStyle, 'opacity') ?? parseStyleValue(style, 'opacity');
		const opacityParsed = opacityRaw != null ? parseFloat(opacityRaw) : NaN;
		zones.push({
			name: el.getAttribute('data-zone-name') ?? '',
			queueIds,
			queueUuids,
			queueChipNames,
			left: parsePx(parseStyleValue(style, 'left')),
			top: parsePx(parseStyleValue(style, 'top')),
			width: parsePx(parseStyleValue(style, 'width')),
			height: parsePx(parseStyleValue(style, 'height')),
			backgroundColor:
				parseStyleValue(bgStyle, 'background') ??
				parseStyleValue(bgStyle, 'background-color') ??
				parseStyleValue(style, 'background') ??
				parseStyleValue(style, 'background-color') ??
				'#ffffff',
			displayTheme: displayThemeAttr || null,
			borderRadius: parsePx(parseStyleValue(style, 'border-radius')),
			borderColor: borderMatch?.[1]?.trim() ?? 'black',
			border: borderRaw !== '' && borderRaw !== 'none' && !/^0(?:px)?$/i.test(borderRaw),
			opacity: Number.isFinite(opacityParsed) ? Math.min(1, Math.max(0, opacityParsed)) : 1,
		});
	});

	return { width, height, zones };
}

export interface ZoneGeometry {
	left: number;
	top: number;
	width: number;
	height: number;
}

/**
 * Save artifact: half-width bbox anchored near horizontal center (e.g. left:959, width:961).
 * Do NOT match intentional left columns (left:0, width:~half canvas).
 */
function isLikelyHalfWidthBboxArtifact(left: number, width: number, canvasW: number): boolean {
	const halfW = canvasW / 2;
	const tolerance = Math.max(24, Math.round(canvasW * 0.03));
	const startsNearCenter = Math.abs(left - halfW) <= tolerance;
	return startsNearCenter && Math.abs(width - halfW) <= tolerance;
}

/** Intentional right column (left:~half, width:~half) — must not expand to full canvas. */
function isIntentionalRightColumn(left: number, width: number, canvasW: number): boolean {
	const halfW = canvasW / 2;
	const tolerance = Math.max(24, Math.round(canvasW * 0.03));
	return (
		Math.abs(left - halfW) <= tolerance &&
		Math.abs(width - halfW) <= tolerance &&
		Math.abs(left + width - canvasW) <= tolerance
	);
}

/**
 * Clip legacy html zone rows to the canvas without changing intentional placement.
 * (Do not reset top to 0 — that stacked every column on load.)
 *
 * Fixes a common save artifact: zones drawn full-width but stored with a centered
 * left offset (~canvasW/2) and/or a width taken from the visible bbox only
 * (e.g. left:959 + width:961 on a 1920px canvas). The list thumbnail still looks
 * correct because it is captured from Fabric; reload without this fix shows only
 * the left half of each zone.
 */
export function normalizeZoneGeometryForCanvas(
	zone: ZoneGeometry,
	canvasW: number,
	canvasH: number,
): ZoneGeometry {
	let { left, top, width, height } = zone;
	const edgeTol = 2;

	if (left < 0) {
		width += left;
		left = 0;
	}
	if (top < 0) {
		height += top;
		top = 0;
	}

	const spillsRight = left + width > canvasW + edgeTol;
	// Only snap when the zone is genuinely wide — not a narrow column ending at the right edge
	// (e.g. left:1073 + width:847 on 1920px must stay as-is).
	const pinnedToRightEdge =
		left + width >= canvasW - edgeTol &&
		left + width <= canvasW + edgeTol &&
		left > canvasW * 0.4 &&
		width >= canvasW * 0.85;
	const intendedFullWidth =
		width > canvasW ||
		width >= canvasW * 0.75 ||
		(spillsRight && width >= canvasW * 0.45) ||
		pinnedToRightEdge;

	if (
		!isIntentionalRightColumn(left, width, canvasW) &&
		intendedFullWidth &&
		(spillsRight || pinnedToRightEdge || width >= canvasW * 0.75)
	) {
		left = 0;
		width = canvasW;
	} else if (isLikelyHalfWidthBboxArtifact(left, width, canvasW)) {
		left = 0;
		width = canvasW;
	} else if (left + width > canvasW) {
		width = canvasW - left;
	}

	if (height > canvasH) {
		height = canvasH;
		top = 0;
	} else if (height >= canvasH * 0.75 && top + height > canvasH + edgeTol) {
		top = 0;
		height = canvasH;
	} else if (top + height > canvasH) {
		height = canvasH - top;
	}

	return {
		left: Math.max(0, left),
		top: Math.max(0, top),
		width: Math.max(8, width),
		height: Math.max(8, height),
	};
}

/**
 * Minimal bounds clamp for editor saves — preserves deliberate multi-column layouts.
 * Use normalizeZoneGeometryForCanvas only when loading legacy/corrupt html.
 */
export function clampZoneGeometryToCanvas(
	zone: ZoneGeometry,
	canvasW: number,
	canvasH: number,
): ZoneGeometry {
	let { left, top, width, height } = zone;

	if (left < 0) {
		width += left;
		left = 0;
	}
	if (top < 0) {
		height += top;
		top = 0;
	}

	if (width > canvasW) {
		width = canvasW;
		left = 0;
	}
	if (height > canvasH) {
		height = canvasH;
		top = 0;
	}

	if (left + width > canvasW) {
		width = canvasW - left;
	}
	if (top + height > canvasH) {
		height = canvasH - top;
	}

	return {
		left: Math.max(0, left),
		top: Math.max(0, top),
		width: Math.max(8, width),
		height: Math.max(8, height),
	};
}

/**
 * Fix zones saved with height larger than the canvas (e.g. top:538 + height:1080 on a 1080px canvas).
 * The template editor thumbnail looks correct because Fabric clips the canvas; raw HTML overflows.
 */
export function normalizeTemplateZonesInDom(
	container: HTMLElement,
	containerWidth: number,
	containerHeight: number,
): void {
	container.querySelectorAll<HTMLElement>('.queue-zone').forEach((zoneEl) => {
		let left = parsePx(zoneEl.style.left);
		let top = parsePx(zoneEl.style.top);
		let width = parsePx(zoneEl.style.width);
		let height = parsePx(zoneEl.style.height);

		if (left < 0) {
			width += left;
			left = 0;
		}
		if (top < 0) {
			height += top;
			top = 0;
		}
		const normalized = normalizeZoneGeometryForCanvas(
			{ left, top, width, height },
			containerWidth,
			containerHeight,
		);
		left = normalized.left;
		top = normalized.top;
		width = normalized.width;
		height = normalized.height;

		width = Math.max(0, width);
		height = Math.max(0, height);

		zoneEl.style.left = `${left}px`;
		zoneEl.style.top = `${top}px`;
		zoneEl.style.width = `${width}px`;
		zoneEl.style.height = `${height}px`;
	});
}

export type ZoneGeometryMode = 'normalize' | 'clamp';

/** Map logical template pixels to Fabric canvas pixels. */
export function toFabricZoneGeometry(
	zone: ZoneGeometry,
	canvasW: number,
	canvasH: number,
	sf: number,
	mode: ZoneGeometryMode = 'normalize',
): ZoneGeometry {
	const norm =
		mode === 'clamp'
			? clampZoneGeometryToCanvas(zone, canvasW, canvasH)
			: normalizeZoneGeometryForCanvas(zone, canvasW, canvasH);
	return {
		left: norm.left * sf,
		top: norm.top * sf,
		width: Math.max(8, norm.width * sf),
		height: Math.max(8, norm.height * sf),
	};
}

type FabricCoordSource = {
	left?: number;
	top?: number;
	width?: number;
	height?: number;
	scaleX?: number;
	scaleY?: number;
	originX?: string;
	originY?: string;
	set?: (props: Record<string, unknown>) => void;
	setCoords?: () => void;
	aCoords?: {
		tl?: { x: number; y: number };
		br?: { x: number; y: number };
	};
	getCenterPoint?: () => { x: number; y: number };
	setPositionByOrigin?: (
		point: { x: number; y: number },
		originX: string,
		originY: string,
	) => void;
};

/** Keep the visual box but store Fabric's reference point at the top-left corner. */
export function ensureFabricRectLeftTopOrigin(obj: FabricCoordSource): void {
	if (obj.originX === 'left' && obj.originY === 'top') {
		obj.setCoords?.();
		return;
	}
	if (typeof obj.getCenterPoint !== 'function' || typeof obj.setPositionByOrigin !== 'function') {
		return;
	}
	const center = obj.getCenterPoint();
	obj.set?.({ originX: 'left', originY: 'top' });
	obj.setPositionByOrigin(center, 'center', 'center');
	obj.setCoords?.();
}

/**
 * Read the visible top-left box in logical (template) pixels.
 * Uses aCoords so center-origin rects (top ≈ height/2) do not corrupt saves.
 */
export function readLogicalZoneGeometryFromFabric(obj: FabricCoordSource, sf: number): ZoneGeometry {
	const scale = sf || 1;
	obj.setCoords?.();

	const tl = obj.aCoords?.tl;
	const br = obj.aCoords?.br;
	if (tl && br) {
		return {
			left: Math.round(Math.min(tl.x, br.x) / scale),
			top: Math.round(Math.min(tl.y, br.y) / scale),
			width: Math.round(Math.abs(br.x - tl.x) / scale),
			height: Math.round(Math.abs(br.y - tl.y) / scale),
		};
	}

	ensureFabricRectLeftTopOrigin(obj);
	const scaleX = obj.scaleX ?? 1;
	const scaleY = obj.scaleY ?? 1;
	return {
		left: Math.round((obj.left ?? 0) / scale),
		top: Math.round((obj.top ?? 0) / scale),
		width: Math.round(((obj.width ?? 0) * scaleX) / scale),
		height: Math.round(((obj.height ?? 0) * scaleY) / scale),
	};
}

/** Apply logical zone geometry back onto a Fabric rect (canvas pixels). */
export function applyLogicalZoneGeometryToFabric(
	obj: {
		set?: (props: Record<string, number | string>) => void;
		setCoords?: () => void;
	},
	geom: ZoneGeometry,
	sf: number,
): void {
	const scale = sf || 1;
	obj.set?.({
		originX: 'left',
		originY: 'top',
		left: geom.left * scale,
		top: geom.top * scale,
		width: Math.max(8, geom.width * scale),
		height: Math.max(8, geom.height * scale),
		scaleX: 1,
		scaleY: 1,
	});
	obj.setCoords?.();
}

/** Re-anchor rects loaded from stale fabric_json (canvas px) onto the logical grid. */
export function normalizeFabricRectToCanvas(
	obj: FabricCoordSource & {
		set?: (props: Record<string, number | string>) => void;
	},
	sf: number,
	canvasW: number,
	canvasH: number,
): void {
	const logical = readLogicalZoneGeometryFromFabric(obj, sf);
	const norm = normalizeZoneGeometryForCanvas(logical, canvasW, canvasH);
	applyLogicalZoneGeometryToFabric(obj, norm, sf);
	ensureFabricRectLeftTopOrigin(obj);
}

export interface TemplateConfigurationZone {
	name?: string;
	queue_uuids?: string[];
	queue_ids?: number[];
	queue_names?: string[];
	theme_id?: string | null;
	/** @deprecated Use theme_id */
	display_theme?: string | null;
	background_color?: string | null;
}

export function parseTemplateConfiguration(
	configuration?: Record<string, unknown> | string | null,
): TemplateConfigurationZone[] {
	if (!configuration) return [];
	let config: Record<string, unknown>;
	try {
		config =
			typeof configuration === 'string'
				? (JSON.parse(configuration) as Record<string, unknown>)
				: configuration;
	} catch {
		return [];
	}
	const zones = config.zones;
	if (!Array.isArray(zones)) return [];

	return zones.map((zone: Record<string, unknown>) => ({
		name: typeof zone.name === 'string' ? zone.name : '',
		theme_id:
			typeof zone.theme_id === 'string'
				? zone.theme_id
				: typeof zone.themeId === 'string'
					? zone.themeId
					: typeof zone.display_theme === 'string'
						? zone.display_theme
						: typeof zone.displayTheme === 'string'
							? zone.displayTheme
							: null,
		display_theme:
			typeof zone.display_theme === 'string'
				? zone.display_theme
				: typeof zone.displayTheme === 'string'
					? zone.displayTheme
					: null,
		background_color:
			typeof zone.background_color === 'string'
				? zone.background_color
				: typeof zone.backgroundColor === 'string'
					? zone.backgroundColor
					: null,
		queue_uuids: Array.isArray(zone.queue_uuids)
			? zone.queue_uuids.filter(
				(uuid): uuid is string =>
					typeof uuid === 'string' && LMS_UUID_RE.test(uuid),
			)
			: [],
		queue_ids: Array.isArray(zone.queue_ids)
			? zone.queue_ids.filter(
				(id): id is number => typeof id === 'number' && Number.isFinite(id) && id > 0,
			)
			: typeof zone.queue_id === 'number' && zone.queue_id > 0
				? [zone.queue_id]
				: [],
		queue_names: Array.isArray(zone.queue_names)
			? zone.queue_names.filter((name): name is string => typeof name === 'string')
			: [],
	}));
}

/** Merge queue refs from saved configuration when html zones lack data-queue-ids. */
export function enrichParsedZonesWithConfiguration(
	zones: ParsedTemplateZone[],
	configuration?: Record<string, unknown> | string | null,
): ParsedTemplateZone[] {
	const configZones = parseTemplateConfiguration(configuration);
	if (!configZones.length) return zones;

	return zones.map((zone, index) => {
		const configZone =
			(configZones.find((cz) => cz.name && cz.name === zone.name) ?? configZones[index]) ??
			null;
		if (!configZone) return zone;

		const queueUuids =
			zone.queueUuids.length > 0 ? zone.queueUuids : (configZone.queue_uuids ?? []);
		const queueIds = zone.queueIds.length > 0 ? zone.queueIds : (configZone.queue_ids ?? []);
		const queueChipNames =
			zone.queueChipNames.length > 0
				? zone.queueChipNames
				: (configZone.queue_names ?? []);


		const displayTheme =
			zone.displayTheme?.trim() ||
			configZone.theme_id?.trim() ||
			configZone.display_theme?.trim() ||
			null;
		const backgroundColor =
			configZone.background_color?.trim() || zone.backgroundColor || '#ffffff';

		const configZoneOpacity =
			typeof (configZone as any).zone_opacity === 'number'
				? (configZone as any).zone_opacity
				: null;
		const opacity =
			configZoneOpacity != null ? configZoneOpacity : zone.opacity ?? 1;

		return {
			...zone,
			queueUuids,
			queueIds,
			queueChipNames,
			displayTheme: displayTheme || null,
			backgroundColor,
			opacity,
		};
	});
}

export function collectQueueUuidsFromHtml(html?: string | null): string[] {
	const layout = parseTemplateLayoutFromHtml(html);
	if (!layout) return [];
	const seen = new Set<string>();
	const uuids: string[] = [];
	layout.zones.forEach((zone) => {
		zone.queueUuids.forEach((uuid) => {
			if (!LMS_UUID_RE.test(uuid) || seen.has(uuid)) return;
			seen.add(uuid);
			uuids.push(uuid);
		});
	});
	return uuids;
}

/** Collect queue UUIDs from template html and optional saved configuration. */
export function collectQueueUuidsFromTemplate(template: {
	html_content?: string | null;
	configuration?: Record<string, unknown> | string | null;
}): string[] {
	const seen = new Set<string>();
	const uuids: string[] = [];

	const add = (uuid: string) => {
		if (!LMS_UUID_RE.test(uuid) || seen.has(uuid)) return;
		seen.add(uuid);
		uuids.push(uuid);
	};

	collectQueueUuidsFromHtml(template.html_content).forEach(add);
	parseTemplateConfiguration(template.configuration).forEach((zone) => {
		(zone.queue_uuids ?? []).forEach(add);
	});

	return uuids;
}
