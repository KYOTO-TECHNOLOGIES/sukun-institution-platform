import {
	PIPBOY_ACTIVE_TOKENS_TICKER_CLASS,
	parseDisplayThemeId,
	resolveUniformThemedActiveTokensTickerClass,
	resolveUniformThemedActiveTokensTickerSlug,
	ROYAL_TICKET_ACTIVE_TOKENS_TICKER_CLASS,
	SUN_BENTO_ACTIVE_TOKENS_TICKER_CLASS,
	VELVET_CROWN_ACTIVE_TOKENS_TICKER_CLASS,
	type ZoneDisplayThemeId,
} from '../components/MasterComponents/TokenDisplayThemes/tokenDisplayThemes';
import {
	parseTemplateConfiguration,
	type ParsedTemplateZone,
} from './parseTemplateZones';
import {
	type FabricZoneOverlayRect,
	getZoneAppearanceFromRect,
	readFabricRectDisplayTheme,
} from './zoneAppearanceFabric';

/** Resolve theme slug for one zone (canvas rect + saved config + HTML fallback). */
export function resolveZoneThemeIdForTicker(
	rect: FabricZoneOverlayRect,
	configuration?: Record<string, unknown> | string | null,
	parsedHtmlZones?: ParsedTemplateZone[],
	index = 0,
): ZoneDisplayThemeId | null {
	const fromAppearance = getZoneAppearanceFromRect(rect).displayTheme;
	if (fromAppearance) return fromAppearance;

	const fromRectRaw = parseDisplayThemeId(readFabricRectDisplayTheme(rect));
	if (fromRectRaw) return fromRectRaw;

	const configZones = parseTemplateConfiguration(configuration);
	const configZone =
		(configZones.find((cz) => cz.name && cz.name === rect.name) ?? configZones[index]) ??
		null;
	const fromConfig = parseDisplayThemeId(
		configZone?.theme_id ?? configZone?.display_theme ?? null,
	);
	if (fromConfig) return fromConfig;

	const htmlZone =
		(parsedHtmlZones?.find((hz) => hz.name && hz.name === rect.name) ??
			parsedHtmlZones?.[index]) ??
		null;
	return parseDisplayThemeId(htmlZone?.displayTheme ?? null);
}

function collectSavedTemplateThemeCandidates(
	configuration?: Record<string, unknown> | string | null,
	parsedHtmlZones?: ParsedTemplateZone[],
): Array<string | null | undefined> {
	const configZones = parseTemplateConfiguration(configuration);
	const htmlZones = parsedHtmlZones ?? [];

	const fromConfig = configZones.map(
		(zone) => zone.theme_id?.trim() || zone.display_theme?.trim() || null,
	);
	const fromHtml = htmlZones.map((zone) => zone.displayTheme?.trim() || null);

	return [...fromConfig, ...fromHtml];
}

function collectTemplateThemeIds(
	zones: FabricZoneOverlayRect[],
	configuration?: Record<string, unknown> | string | null,
	parsedHtmlZones?: ParsedTemplateZone[],
): ZoneDisplayThemeId[] {
	if (zones.length > 0) {
		return zones
			.map((rect, index) =>
				resolveZoneThemeIdForTicker(rect, configuration, parsedHtmlZones, index),
			)
			.filter((t): t is ZoneDisplayThemeId => t != null);
	}

	return collectSavedTemplateThemeCandidates(configuration, parsedHtmlZones)
		.map(parseDisplayThemeId)
		.filter((t): t is ZoneDisplayThemeId => t != null);
}

/** @deprecated Use templateUsesThemedActiveTokensTicker */
export function templateUsesPipboyActiveTokensTicker(
	zones: FabricZoneOverlayRect[],
	configuration?: Record<string, unknown> | string | null,
	parsedHtmlZones?: ParsedTemplateZone[],
): boolean {
	return templateUsesThemedActiveTokensTicker(zones, configuration, parsedHtmlZones);
}

/** True when every zone uses the same theme that has an Active Tokens bar variant. */
export function templateUsesThemedActiveTokensTicker(
	zones: FabricZoneOverlayRect[],
	configuration?: Record<string, unknown> | string | null,
	parsedHtmlZones?: ParsedTemplateZone[],
): boolean {
	return resolveTemplateActiveTokensTickerClass(zones, configuration, parsedHtmlZones) !== '';
}

/** CSS modifier for ActiveTokensTicker — empty when theme has no bar variant or zones are mixed. */
export function resolveTemplateActiveTokensTickerClass(
	zones: FabricZoneOverlayRect[],
	configuration?: Record<string, unknown> | string | null,
	parsedHtmlZones?: ParsedTemplateZone[],
): string {
	return resolveUniformThemedActiveTokensTickerClass(
		collectTemplateThemeIds(zones, configuration, parsedHtmlZones),
	);
}

/** Theme slug for data-ticker-theme attribute — undefined when no themed bar applies. */
export function resolveTemplateActiveTokensTickerSlug(
	zones: FabricZoneOverlayRect[],
	configuration?: Record<string, unknown> | string | null,
	parsedHtmlZones?: ParsedTemplateZone[],
): ZoneDisplayThemeId | undefined {
	return resolveUniformThemedActiveTokensTickerSlug(
		collectTemplateThemeIds(zones, configuration, parsedHtmlZones),
	);
}

export {
	PIPBOY_ACTIVE_TOKENS_TICKER_CLASS,
	VELVET_CROWN_ACTIVE_TOKENS_TICKER_CLASS,
	SUN_BENTO_ACTIVE_TOKENS_TICKER_CLASS,
	ROYAL_TICKET_ACTIVE_TOKENS_TICKER_CLASS,
};
