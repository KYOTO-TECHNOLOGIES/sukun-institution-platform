/**
 * Zone display appearance — fill color OR a named token display theme.
 *
 * Backend (per zone, when integrated):
 *   - `theme_id`: string slug e.g. `"deep-blue"` | null
 *   - `background_color`: CSS color when using fill mode | null
 *   - `display_theme` / `data-display-theme` — legacy, still read
 *
 * Rules: exactly one visual mode. Theme mode clears fill; fill mode clears theme id.
 */

/**
 * Built-in theme ids — stable slugs stored in the database.
 *
 * Each slug maps to a genuinely different visual design in _token-display-theme.scss:
 *   digital-crimson  — dark crimson + sweep animation + split token/status layout
 *   onyx-gold        — pure black + liquid-gold top rule + gold token
 *   crimson-banner   — modern queue board (dark navy, rotating rings, glass status card)
 *   imperial-court   — dark luxury broadcast UI with wireframe + gold separators
 *   arctic-white     — premium glassmorphism panel with flowing border energy
 *   pipboy-terminal  — retro CRT terminal with scanlines, flip digits, and green glow
 *   velvet-crown     — royal burgundy lacquer with champagne gold emboss
 *   sun-bento        — neo-brutalist cream card with bold corners and lightning accent
 *   royal-ticket     — perforated royal ticket with gold grid and barcode stub
 *
 * Legacy slugs (midnight-cobalt, deep-blue, high-contrast, amber, emerald, crimson,
 * midnight, royal-purple, slate) are no longer active. Saved zones that still
 * reference them fall back to fill mode gracefully.
 */
export const ZONE_DISPLAY_THEME_IDS = [
	'digital-crimson',
	'onyx-gold',
	'crimson-banner',
	'imperial-court',
	'arctic-white',
	'pipboy-terminal',
	'velvet-crown',
	'sun-bento',
	'royal-ticket',
] as const;

/** Themes 6–9: active tokens render in a screen-level ticker, not inside each zone card. */
export const SCREEN_TICKER_ZONE_THEME_IDS = [
	'pipboy-terminal',
	'velvet-crown',
	'sun-bento',
	'royal-ticket',
] as const;

export type ScreenTickerZoneThemeId = (typeof SCREEN_TICKER_ZONE_THEME_IDS)[number];

export type ZoneDisplayThemeId = (typeof ZONE_DISPLAY_THEME_IDS)[number];

const SCREEN_TICKER_THEME_SET = new Set<string>(SCREEN_TICKER_ZONE_THEME_IDS);

export function zoneUsesScreenLevelActiveTokensTicker(
	themeId: ZoneDisplayThemeId | null | undefined,
): boolean {
	return themeId != null && SCREEN_TICKER_THEME_SET.has(themeId);
}

export type ZoneAppearanceMode = 'fill' | 'theme';

export interface ZoneDisplayAppearance {
	mode: ZoneAppearanceMode;
	/** Set when mode === 'theme'. Persisted as `theme_id`. */
	displayTheme: ZoneDisplayThemeId | null;
	/** Set when mode === 'fill'. Persisted as `background_color`. */
	backgroundColor: string | null;
}

/** Default theme when neither fill nor theme is configured. */
export const DEFAULT_ZONE_DISPLAY_THEME: ZoneDisplayThemeId = 'digital-crimson';

export type ZoneDisplayTextColor = 'light' | 'dark';

export interface ZoneDisplayThemeConfig {
	id: ZoneDisplayThemeId;
	label: string;
	description: string;
	textColor: ZoneDisplayTextColor;
	previewGradient: string;
}

export const ZONE_DISPLAY_THEME_CONFIGS: Record<
	ZoneDisplayThemeId,
	ZoneDisplayThemeConfig
> = {
	'digital-crimson': {
		id: 'digital-crimson',
		label: 'Digital Crimson',
		description:
			'Dark crimson with scan-line animation, header beam, and split token/status layout',
		textColor: 'light',
		previewGradient: 'linear-gradient(145deg, #6d0b0b 0%, #3a0404 55%, #180000 100%)',
	},
	'onyx-gold': {
		id: 'onyx-gold',
		label: 'Onyx Gold',
		description: 'Pure black with liquid-gold token, header beam, and animated gold column separator',
		textColor: 'light',
		previewGradient:
			'linear-gradient(180deg, #e8c96a 0%, #d4af37 12%, #4a3d12 32%, #1a1200 58%, #0a0800 100%)',
	},
	'crimson-banner': {
		id: 'crimson-banner',
		label: 'Modern Queue',
		description: 'Dark cyber board with live indicator, rotating rings, and glass status card',
		textColor: 'light',
		previewGradient:
			'radial-gradient(circle at 50% 40%, rgba(0, 132, 255, 0.2) 0%, #031122 45%, #020817 100%)',
	},
	'imperial-court': {
		id: 'imperial-court',
		label: 'Regal Court',
		description:
			'Dark luxury broadcast board with header beam, animated column separator, status border flow, and active-tokens line sweep',
		textColor: 'light',
		previewGradient:
			'radial-gradient(circle at 50% 38%, rgba(80, 200, 150, 0.5) 0%, rgba(12, 72, 52, 0.85) 38%, #02140f 72%, #010806 100%)',
	},
	'arctic-white': {
		id: 'arctic-white',
		label: 'Glass Panel',
		description:
			'Premium glassmorphism with header beam, animated column separator, status border flow, and active-tokens line sweep',
		textColor: 'light',
		previewGradient:
			'radial-gradient(circle at 50% 36%, rgba(255, 255, 255, 0.42) 0%, rgba(200, 210, 220, 0.18) 32%, #3a3f45 52%, #141618 100%)',
	},
	'pipboy-terminal': {
		id: 'pipboy-terminal',
		label: 'Pipboy Terminal',
		description: 'Retro futuristic fallout inspired terminal with CRT scanlines and green glow',
		textColor: 'light',
		previewGradient: 'linear-gradient(135deg, #020a02 0%, #001a00 100%)',
	},
	'velvet-crown': {
		id: 'velvet-crown',
		label: 'Velvet Crown',
		description: 'Royal burgundy lacquer with champagne gold emboss and glossy shimmer',
		textColor: 'light',
		previewGradient: 'linear-gradient(155deg, #3a1228 0%, #1a0a12 55%, #0e0509 100%)',
	},
	'sun-bento': {
		id: 'sun-bento',
		label: 'Sun Bento',
		description: 'Neo-brutalist cream card with bold corners, lightning accent, and playful hover lift',
		textColor: 'dark',
		previewGradient: 'linear-gradient(180deg, #fff492 0%, #ffe566 100%)',
	},
	'royal-ticket': {
		id: 'royal-ticket',
		label: 'Royal Pass',
		description: 'Perforated royal ticket with gold grid, barcode stub, and 3D hover lift',
		textColor: 'light',
		previewGradient: 'linear-gradient(165deg, #1f1830 0%, #14101f 55%, #0a0812 100%)',
	},
};

// ─── Parse / map backend values ─────────────────────────────────────────────

const THEME_ID_SET = new Set<string>(ZONE_DISPLAY_THEME_IDS);

/** Normalize API/editor string to a valid theme id, or null if unknown. */
export function parseDisplayThemeId(
	value: string | null | undefined,
): ZoneDisplayThemeId | null {
	if (value == null) return null;
	const normalized = String(value).trim().toLowerCase();
	if (!normalized || !THEME_ID_SET.has(normalized)) return null;
	return normalized as ZoneDisplayThemeId;
}

export function isDisplayThemeId(
	value: string | null | undefined,
): value is ZoneDisplayThemeId {
	return parseDisplayThemeId(value) != null;
}

/** Active Tokens bar modifier — ONLY used when zone theme is pipboy-terminal. */
export const PIPBOY_ACTIVE_TOKENS_TICKER_CLASS = 'pct-bar--pipboy';

export const VELVET_CROWN_ACTIVE_TOKENS_TICKER_CLASS = 'pct-bar--velvet-crown';

export const SUN_BENTO_ACTIVE_TOKENS_TICKER_CLASS = 'pct-bar--sun-bento';

export const ROYAL_TICKET_ACTIVE_TOKENS_TICKER_CLASS = 'pct-bar--royal-ticket';

const ACTIVE_TOKENS_TICKER_THEME_CLASSES: Partial<Record<ZoneDisplayThemeId, string>> = {
	'pipboy-terminal': PIPBOY_ACTIVE_TOKENS_TICKER_CLASS,
	'velvet-crown': VELVET_CROWN_ACTIVE_TOKENS_TICKER_CLASS,
	'sun-bento': SUN_BENTO_ACTIVE_TOKENS_TICKER_CLASS,
	'royal-ticket': ROYAL_TICKET_ACTIVE_TOKENS_TICKER_CLASS,
};

/** CSS modifier for ticker root (empty string when theme has no variant). */
export function getActiveTokensTickerClassForTheme(
	themeId: ZoneDisplayThemeId | null | undefined,
): string {
	if (!themeId) return '';
	return ACTIVE_TOKENS_TICKER_THEME_CLASSES[themeId] ?? '';
}

/** First valid theme slug in list — used for screen-level ticker styling. */
export function resolvePrimaryZoneDisplayTheme(
	themeCandidates: Array<string | null | undefined>,
): ZoneDisplayThemeId | null {
	for (const raw of themeCandidates) {
		const id = parseDisplayThemeId(raw);
		if (id) return id;
	}
	return null;
}

/** Root CSS class(es) for ticker based on the template's primary zone theme. */
export function resolveActiveTokensTickerClass(
	themeCandidates: Array<string | null | undefined>,
): string {
	return getActiveTokensTickerClassForTheme(resolvePrimaryZoneDisplayTheme(themeCandidates));
}

/** True when any candidate resolves to the Pipboy Terminal zone theme. */
export function templateUsesPipboyTerminal(
	themeCandidates: Array<string | null | undefined>,
): boolean {
	return resolvePrimaryZoneDisplayTheme(themeCandidates) === 'pipboy-terminal';
}

export function resolvePipboyActiveTokensTickerClassOnly(
	themeCandidates: Array<string | null | undefined>,
): string {
	return resolveUniformThemedActiveTokensTickerClass(themeCandidates);
}

/**
 * When every themed zone shares one slug that has an Active Tokens bar variant, return its class.
 * Returns '' for mixed templates or themes without a ticker variant.
 */
export function resolveUniformThemedActiveTokensTickerClass(
	themeCandidates: Array<string | null | undefined>,
): string {
	const themes = themeCandidates
		.map(parseDisplayThemeId)
		.filter((t): t is ZoneDisplayThemeId => t != null);

	if (!themes.length) return '';

	const unique = Array.from(new Set(themes));
	if (unique.length !== 1) return '';

	return getActiveTokensTickerClassForTheme(unique[0]);
}

/** Theme slug when template uses a themed Active Tokens bar, else undefined. */
export function resolveUniformThemedActiveTokensTickerSlug(
	themeCandidates: Array<string | null | undefined>,
): ZoneDisplayThemeId | undefined {
	const themes = themeCandidates
		.map(parseDisplayThemeId)
		.filter((t): t is ZoneDisplayThemeId => t != null);

	if (!themes.length) return undefined;

	const unique = Array.from(new Set(themes));
	if (unique.length !== 1) return undefined;

	const slug = unique[0];
	return getActiveTokensTickerClassForTheme(slug) ? slug : undefined;
}

/** Build appearance from saved zone fields (API / configuration.zones). */
export function getZoneAppearanceFromSaved(saved: {
	theme_id?: string | null;
	themeId?: string | null;
	display_theme?: string | null;
	displayTheme?: string | null;
	/** @deprecated Use theme_id — still read for older saves */
	display_template?: string | null;
	/** @deprecated Use displayTheme */
	displayTemplate?: string | null;
	background_color?: string | null;
	backgroundColor?: string | null;
}): ZoneDisplayAppearance {
	const themeRaw =
		saved.theme_id ??
		saved.themeId ??
		saved.display_theme ??
		saved.displayTheme ??
		saved.display_template ??
		saved.displayTemplate;
	const themeId = parseDisplayThemeId(themeRaw);
	if (themeId) {
		return { mode: 'theme', displayTheme: themeId, backgroundColor: null };
	}

	const fill =
		(saved.background_color ?? saved.backgroundColor)?.trim() || null;
	if (fill) {
		return { mode: 'fill', displayTheme: null, backgroundColor: fill };
	}

	return {
		mode: 'fill',
		displayTheme: null,
		backgroundColor: null,
	};
}

/** Payload shape for saving a zone (snake_case for Django-style APIs). */
export function serializeZoneAppearance(appearance: ZoneDisplayAppearance): {
	theme_id: string | null;
	background_color: string | null;
} {
	if (appearance.mode === 'theme' && appearance.displayTheme) {
		return {
			theme_id: appearance.displayTheme,
			background_color: null,
		};
	}
	return {
		theme_id: null,
		background_color: appearance.backgroundColor?.trim() || null,
	};
}

export function createFillAppearance(backgroundColor: string): ZoneDisplayAppearance {
	return {
		mode: 'fill',
		displayTheme: null,
		backgroundColor: backgroundColor.trim(),
	};
}

export function createThemeAppearance(
	themeId: ZoneDisplayThemeId,
): ZoneDisplayAppearance {
	return {
		mode: 'theme',
		displayTheme: themeId,
		backgroundColor: null,
	};
}

/** Theme mode requires a chosen swatch before save. */
export function isZoneThemeSelectionComplete(appearance: ZoneDisplayAppearance): boolean {
	return appearance.mode !== 'theme' || appearance.displayTheme != null;
}

// ─── Resolved card rendering (theme class vs fill background) ─────────────────

export interface ResolvedZoneCardStyle {
	appearance: ZoneDisplayAppearance;
	/** CSS module class on .tdc root, e.g. tdc--deep-blue */
	themeClass: string | null;
	/** true when using zone fill color instead of a named theme */
	useFillBackground: boolean;
	backgroundColor: string | null;
	textColor: ZoneDisplayTextColor;
}

export function resolveZoneCardStyle(
	appearance: ZoneDisplayAppearance,
): ResolvedZoneCardStyle {
	if (appearance.mode === 'theme' && appearance.displayTheme) {
		const config = ZONE_DISPLAY_THEME_CONFIGS[appearance.displayTheme];
		return {
			appearance,
			themeClass: `tdc--${appearance.displayTheme}`,
			useFillBackground: false,
			backgroundColor: null,
			textColor: config.textColor,
		};
	}

	const fill = appearance.backgroundColor?.trim() || null;
	return {
		appearance,
		themeClass: null,
		useFillBackground: true,
		backgroundColor: fill,
		textColor: fill ? getContrastTextColorForBackground(fill) : 'light',
	};
}

/** Rough luminance check for fill-only zones (no named theme). */
export function getContrastTextColorForBackground(color: string): ZoneDisplayTextColor {
	const hex = color.trim();
	let r = 0;
	let g = 0;
	let b = 0;

	const shortHex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i.exec(hex);
	if (shortHex) {
		r = parseInt(shortHex[1] + shortHex[1], 16);
		g = parseInt(shortHex[2] + shortHex[2], 16);
		b = parseInt(shortHex[3] + shortHex[3], 16);
	} else {
		const fullHex = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		if (fullHex) {
			r = parseInt(fullHex[1], 16);
			g = parseInt(fullHex[2], 16);
			b = parseInt(fullHex[3], 16);
		} else {
			const rgba = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i.exec(hex);
			if (rgba) {
				r = Number(rgba[1]);
				g = Number(rgba[2]);
				b = Number(rgba[3]);
			}
		}
	}

	const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
	return luminance > 0.55 ? 'dark' : 'light';
}

// ─── Status display ───────────────────────────────────────────────────────────

export type TokenStatusKey =
	| 'registred'
	| 'waiting'
	| 'serving'
	| 'completed'
	| 'cancelled'
	| 'postponed'
	| 'no_show';

export interface TokenStatusDisplayConfig {
	label: string;
	modifier: string;
	icon: string;
}

export const TOKEN_STATUS_DISPLAY: Record<string, TokenStatusDisplayConfig> = {
	registred: { label: 'Registered', modifier: 'registered', icon: '📋' },
	registered: { label: 'Registered', modifier: 'registered', icon: '📋' },
	waiting: { label: 'Waiting', modifier: 'waiting', icon: '⏱' },
	serving: { label: 'Now Serving', modifier: 'serving', icon: '▶' },
	completed: { label: 'Completed', modifier: 'completed', icon: '✓' },
	cancelled: { label: 'Cancelled', modifier: 'cancelled', icon: '✕' },
	postponed: { label: 'Postponed', modifier: 'postponed', icon: '⏸' },
	no_show: { label: 'No Show', modifier: 'no-show', icon: '⚠' },
};

export function getStatusConfig(status?: string | null): TokenStatusDisplayConfig {
	if (!status) return TOKEN_STATUS_DISPLAY.waiting;
	const normalized = status.toLowerCase().replace(/[^a-z_]/g, '');
	return (
		TOKEN_STATUS_DISPLAY[normalized] ?? {
			label: status,
			modifier: 'unknown',
			icon: '•',
		}
	);
}

export const TOKEN_DISPLAY_NO_TOKEN = '—';

/** Below this count, active-token strip is static and left-aligned (no marquee duplicate). */
export const ACTIVE_TOKENS_MARQUEE_MIN_COUNT = 5;

/**
 * Token size in fill-container mode (see `.tdc--fill .tdc__token` in SCSS).
 * Keep in sync with TOKEN_DISPLAY_FILL_LAYOUT_EM.
 */
/** Token size multiplier in fill mode (see `.tdc--fill .tdc__token` in SCSS). */
export const TOKEN_DISPLAY_FILL_TOKEN_EM = 3.35;

/** Headroom for token pulse/float animations so glyphs stay inside the zone. */
export const TOKEN_DISPLAY_FILL_ANIMATION_MARGIN = 1.06;

export interface FillZoneFontSizeOptions {
	tokenEm?: number;
	bodyColumnFraction?: number;
	animationMargin?: number;
}

/** Token `em` multiplier for `.tdc--fill` — must match theme SCSS overrides. */
export function getFillZoneTokenEm(themeClass: string | null): number {
	switch (themeClass) {
		case 'tdc--onyx-gold':
			return 4.4;
		case 'tdc--arctic-white':
			return 3.45;
		case 'tdc--imperial-court':
			return 3.4;
		case 'tdc--pipboy-terminal':
			return 3.1;
		default:
			return TOKEN_DISPLAY_FILL_TOKEN_EM;
	}
}

/** Left column share of split fill grid (token column). */
export function getFillZoneBodyColumnFraction(themeClass: string | null): number {
	if (themeClass === 'tdc--crimson-banner') return 1.6 / 2.5;
	return 0.58;
}

/** Split layout: header row + body/status row (matches grid fill zones). */
export const TOKEN_DISPLAY_FILL_SPLIT_LAYOUT_EM = 5.2;

/** Legacy centered layout (non-split). */
export const TOKEN_DISPLAY_FILL_LAYOUT_EM = 7;

/**
 * Base font-size (px) for `.tdc--fill` so queue/token/badge fit inside the zone box.
 * Uses height, width, and token length so shrinking either dimension reduces text.
 */
/** Boost root font-size on large zones (TV / fullscreen signage). */
export function applyFillZoneFontSizeBoost(
	base: number,
	width: number,
	height: number,
): number {
	const minSide = Math.min(Math.max(1, width), Math.max(1, height));
	let boost = 1;
	let maxCap = 52;

	if (minSide >= 320) {
		boost = 1.06;
		maxCap = 58;
	}
	if (minSide >= 480) {
		boost = 1.12;
		maxCap = 68;
	}
	if (minSide >= 720) {
		boost = 1.18;
		maxCap = 80;
	}
	if (minSide >= 1080) {
		boost = 1.24;
		maxCap = 96;
	}

	return Math.max(5, Math.round(Math.min(base * boost, maxCap)));
}

export function computeTokenDisplayFillBaseFontSize(
	width: number,
	height: number,
	tokenLength = 2,
): number {
	const w = Math.max(1, width);
	const h = Math.max(1, height);
	const chars = Math.max(1, tokenLength);

	const fromHeight = h / TOKEN_DISPLAY_FILL_LAYOUT_EM;
	const fromMinSide = Math.min(w, h) / TOKEN_DISPLAY_FILL_LAYOUT_EM;
	const fromTokenWidth =
		w / (chars * TOKEN_DISPLAY_FILL_TOKEN_EM * 0.58 + 1.4);

	const base = Math.min(fromHeight, fromMinSide, fromTokenWidth);
	return applyFillZoneFontSizeBoost(base, w, h);
}

/** Pipboy fill layout: header + clock + flip row + status — not the 58/42 split grid. */
export const PIPBOY_FILL_LAYOUT_EM = 9.2;

/** Matches `.tdc--fill.tdc--pipboy-terminal .tdc__body .tdc__token { font-size: 4.5em }`. */
export const PIPBOY_FILL_FLIP_TOKEN_EM = 4.5;

export function computePipboyFillBaseFontSize(
	width: number,
	height: number,
	tokenLength = 2,
	/** Reserve bottom band for screen-level Active Tokens ticker (editor + live). */
	tickerHeightPx = 0,
): number {
	const w = Math.max(1, width);
	const h = Math.max(1, height - Math.max(0, tickerHeightPx));
	const chars = Math.max(1, tokenLength);

	const fromHeight = h / PIPBOY_FILL_LAYOUT_EM;
	const fromMinSide = Math.min(w, h) / PIPBOY_FILL_LAYOUT_EM;
	const fromFlipWidth =
		w / (chars * PIPBOY_FILL_FLIP_TOKEN_EM * 0.85 + 2.8);

	const base = Math.min(fromHeight, fromMinSide, fromFlipWidth);
	return applyFillZoneFontSizeBoost(base, w, h);
}

/** Royal Ticket fill layout: header + large title + perforated stub (not the 58/42 split grid). */
export const ROYAL_TICKET_FILL_LAYOUT_EM = 10.2;

/** Matches `.tdc--fill.tdc--royal-ticket .tdc-rt-title { font-size: … }` cap in fill overrides. */
export const ROYAL_TICKET_FILL_TITLE_EM = 2.2;

export function computeRoyalTicketFillBaseFontSize(
	width: number,
	height: number,
	tokenLength = 2,
): number {
	const w = Math.max(1, width);
	const h = Math.max(1, height);
	const chars = Math.max(1, tokenLength);

	const fromHeight = h / ROYAL_TICKET_FILL_LAYOUT_EM;
	const fromMinSide = Math.min(w, h) / ROYAL_TICKET_FILL_LAYOUT_EM;
	const fromTitleHeight = h / (ROYAL_TICKET_FILL_TITLE_EM + 6.4);
	const fromTitleWidth = w / (chars * ROYAL_TICKET_FILL_TITLE_EM * 0.52 + 1.6);
	const fromStubWidth = w / 11.5;

	const base = Math.min(
		fromHeight,
		fromMinSide,
		fromTitleHeight,
		fromTitleWidth,
		fromStubWidth,
	);
	return applyFillZoneFontSizeBoost(base, w, h);
}

/**
 * Fill layout with status on the right (all themes in `.tdc--fill`):
 * header full-width | token left | status right [ | history row ].
 */
export function computeFillZoneSplitBaseFontSize(
	width: number,
	height: number,
	tokenLength = 2,
	hasHistoryStrip = false,
	options: FillZoneFontSizeOptions = {},
): number {
	const w = Math.max(1, width);
	const h = Math.max(1, height);
	const chars = Math.max(1, tokenLength);

	const tokenEm = options.tokenEm ?? TOKEN_DISPLAY_FILL_TOKEN_EM;
	const bodyCol = options.bodyColumnFraction ?? 0.58;
	const statusCol = Math.max(0.28, 1 - bodyCol);
	const animationMargin = options.animationMargin ?? TOKEN_DISPLAY_FILL_ANIMATION_MARGIN;

	const layoutEm = hasHistoryStrip
		? TOKEN_DISPLAY_FILL_SPLIT_LAYOUT_EM + 1.4
		: TOKEN_DISPLAY_FILL_SPLIT_LAYOUT_EM;
	const STATUS_FACTOR = 4.6;
	const STATUS_STACK_EM = 3.35;
	const historyRowFraction = hasHistoryStrip ? 0.26 : 0;
	const headerRowFraction = 0.11;
	const mainRowHeight = h * (1 - historyRowFraction - headerRowFraction);
	const fromStatusStackHeight = mainRowHeight / STATUS_STACK_EM;

	const fromHeight = h / layoutEm;
	const fromMinSide = Math.min(w, h) / layoutEm;
	const fromTokenWidth =
		(w * bodyCol) / (chars * tokenEm * 0.58 * animationMargin + 1.2);
	const fromStatusWidth = (w * statusCol) / STATUS_FACTOR;

	const base = Math.min(
		fromHeight,
		fromMinSide,
		fromTokenWidth,
		fromStatusWidth,
		fromStatusStackHeight,
	);
	return applyFillZoneFontSizeBoost(base, w, h);
}

/** @deprecated Use computeFillZoneSplitBaseFontSize */
export const computeDigitalCrimsonFillBaseFontSize = computeFillZoneSplitBaseFontSize;

/** Pixel font sizes for fill-color zone overlays (Fabric canvas fallback). */
export function computeFillZoneTextSizes(
	width: number,
	height: number,
	tokenLength = 2,
) {
	const base = computeTokenDisplayFillBaseFontSize(width, height, tokenLength);
	return {
		base,
		queueName: Math.round(base),
		subtitle: Math.round(base * 0.9),
		token: Math.round(base * TOKEN_DISPLAY_FILL_TOKEN_EM),
		status: Math.round(base * 0.75),
		gap: Math.max(4, Math.round(base * 0.12)),
	};
}
