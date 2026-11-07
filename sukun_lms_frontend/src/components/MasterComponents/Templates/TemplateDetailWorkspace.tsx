/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { nanoid } from 'nanoid';
import { templatesApi, type Template } from '../../../services/templatesApi';
import { queuesApi, type Queue } from '../../../services/queueManagementApi';
import {
	applyLogicalZoneGeometryToFabric,
	clampZoneGeometryToCanvas,
	enrichParsedZonesWithConfiguration,
	ensureFabricRectLeftTopOrigin,
	normalizeFabricRectToCanvas,
	parseTemplateLayoutFromHtml,
	readLogicalZoneGeometryFromFabric,
	toFabricZoneGeometry,
} from '../../../utils/parseTemplateZones';
import {
	FABRIC_ZONE_APPEARANCE_PROPS,
	applyColorAlpha,
	applyZoneAppearanceToRect,
	captureTemplateThumbnailFromFabric,
	getZoneAppearanceFromRect,
	getZoneAppearanceFromSavedZone,
	themeFallbackBackgroundColor,
} from '../../../utils/zoneAppearanceFabric';
import {
	ZoneDisplayThemePicker,
	ZONE_DISPLAY_THEME_IDS,
	createThemeAppearance,
	getZoneAppearanceFromSaved,
	isZoneThemeSelectionComplete,
	parseDisplayThemeId,
	serializeZoneAppearance,
	type ZoneDisplayAppearance,
} from '../TokenDisplayThemes';
import PreviewTvFrame from '../../StandardTvFrame/PreviewTvFrame';
import Spinner from '../../bootstrap/Spinner';
import Button from '../../bootstrap/Button';
import Icon from '../../icon/Icon';
import TemplateZoneThemeOverlays from './TemplateZoneThemeOverlays';
import { parseTemplateConfiguration } from '../../../utils/templateOverlayOpacity';
import usePermissions from '../../../hooks/usePermissions';
import {
	formatPermissionDeniedMessage,
	getErrorMessage,
	isForbiddenPermissionError,
} from '../QueueManagement/queueManagementUtils';

// ─── Types ────────────────────────────────────────────────────────────────────

const ZONE_LABEL_KEY = 'isZoneQueueLabel';
const ZONE_LABEL_FOR_KEY = 'zoneLabelFor';
const FABRIC_CUSTOM_PROPS = [
	'name',
	'queueId',
	'queueIds',
	'queueUuids',
	'queueChipNames',
	'zoneOpacity',
	...FABRIC_ZONE_APPEARANCE_PROPS,
];
const LMS_UUID_RE =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface ZoneProps {
	containerName: string;
	queueIds: number[];
	containerZIndex: number;
	width: number;
	height: number;
	left: number;
	top: number;
	color: string;
	radius: number;
	borderColor: string;
	/** 0–100 (%) opacity of this zone over the screen background. Default 100. */
	opacity: number;
}

const BLANK_PROPS: ZoneProps = {
	containerName: '',
	queueIds: [],
	containerZIndex: 0,
	width: 0,
	height: 0,
	left: 0,
	top: 0,
	color: 'rgba(255,255,255,0)',
	radius: 0,
	borderColor: 'rgba(255,255,255,0)',
	opacity: 100,
};

function normalizeQueueIds(source: {
	queueIds?: number[] | null;
	queueId?: number | null;
}): number[] {
	if (Array.isArray(source.queueIds) && source.queueIds.length) {
		return Array.from(
			new Set(source.queueIds.filter((id) => Number.isFinite(id) && id > 0)),
		);
	}
	if (source.queueId != null && !Number.isNaN(Number(source.queueId))) {
		return [Number(source.queueId)];
	}
	return [];
}

function dedupeQueueIdsPreserveOrder(queueIds: number[]): number[] {
	const seen = new Set<number>();
	return queueIds.filter((id) => {
		if (seen.has(id)) return false;
		seen.add(id);
		return true;
	});
}

/** Each zone may only be linked to one queue. */
function toSingleZoneQueueIds(queueIds: number[]): number[] {
	const unique = dedupeQueueIdsPreserveOrder(queueIds);
	return unique.length ? [unique[0]] : [];
}

function queueIdsToUuids(queueIds: number[], queuesById: Map<number, Queue>): string[] {
	return queueIds
		.map((id) => queuesById.get(id)?.uuid)
		.filter((uuid): uuid is string => typeof uuid === 'string' && uuid.length > 0);
}

function buildQueuesByUuidMulti(queues: Queue[]): Map<string, Queue[]> {
	const map = new Map<string, Queue[]>();
	queues.forEach((queue) => {
		if (!queue.uuid) return;
		const list = map.get(queue.uuid) ?? [];
		list.push(queue);
		map.set(queue.uuid, list);
	});
	return map;
}

function buildQueuesByName(queues: Queue[]): Map<string, Queue[]> {
	const map = new Map<string, Queue[]>();
	queues.forEach((queue) => {
		const key = queue.name?.trim();
		if (!key) return;
		const list = map.get(key) ?? [];
		list.push(queue);
		map.set(key, list);
	});
	return map;
}

function resolveQueueIdForUuid(
	uuid: string,
	chipName: string | undefined,
	queuesByUuidMulti: Map<string, Queue[]>,
	queuesByName: Map<string, Queue[]>,
): number | null {
	const candidates = queuesByUuidMulti.get(uuid) ?? [];
	const label = chipName?.trim();

	if (candidates.length === 1) return candidates[0].id;

	if (label) {
		const byUuidAndName = candidates.find((q) => q.name === label);
		if (byUuidAndName) return byUuidAndName.id;

		const byName = queuesByName.get(label) ?? [];
		if (byName.length === 1) return byName[0].id;
		if (byName.length > 1) {
			const overlap = byName.find((q) => q.uuid === uuid);
			if (overlap) return overlap.id;
		}
	}

	return candidates[0]?.id ?? null;
}

function resolveQueueIdsFromRefs(
	refs: {
		queueIds?: number[] | null;
		queueUuids?: string[] | null;
		queueChipNames?: string[] | null;
		queueId?: number | null;
	},
	queuesByUuidMulti: Map<string, Queue[]>,
	queuesByName: Map<string, Queue[]>,
): number[] {
	const uuids = Array.isArray(refs.queueUuids) ? refs.queueUuids : [];
	const chipNames = Array.isArray(refs.queueChipNames) ? refs.queueChipNames : [];

	if (uuids.some((uuid) => LMS_UUID_RE.test(uuid))) {
		const resolved: number[] = [];
		uuids.forEach((uuid, index) => {
			if (!LMS_UUID_RE.test(uuid)) return;
			const queueId = resolveQueueIdForUuid(
				uuid,
				chipNames[index],
				queuesByUuidMulti,
				queuesByName,
			);
			if (queueId != null) resolved.push(queueId);
		});
		if (resolved.length) return toSingleZoneQueueIds(resolved);
	}

	const numericIds = Array.isArray(refs.queueIds)
		? refs.queueIds.filter((id) => Number.isFinite(id) && id > 0)
		: [];
	if (numericIds.length) return toSingleZoneQueueIds(numericIds);

	return toSingleZoneQueueIds(normalizeQueueIds(refs));
}

function resolveQueueIdsFromRect(
	rect: {
		queueIds?: number[] | null;
		queueUuids?: string[] | null;
		queueChipNames?: string[] | null;
		queueId?: number | null;
	},
	queuesByUuidMulti: Map<string, Queue[]>,
	queuesByName: Map<string, Queue[]>,
): number[] {
	return resolveQueueIdsFromRefs(rect, queuesByUuidMulti, queuesByName);
}

function applyQueueRefsToRect(
	rect: any,
	queueIds: number[],
	queuesById: Map<number, Queue>,
) {
	const uniqueIds = toSingleZoneQueueIds(queueIds);
	const queueUuids = queueIdsToUuids(uniqueIds, queuesById);
	const queueChipNames = uniqueIds.map(
		(id) => queuesById.get(id)?.name ?? `Queue #${id}`,
	);
	rect.set({
		queueIds: uniqueIds,
		queueId: uniqueIds[0] ?? null,
		queueUuids,
		queueChipNames,
	});
}

function isZoneRect(obj: any): boolean {
	return obj?.type === 'rect' && !obj?.[ZONE_LABEL_KEY];
}

function getZoneRects(fc: any): any[] {
	return (fc.getObjects?.() ?? []).filter(isZoneRect);
}

/** Keep a zone rect fully inside the white canvas area while dragging or resizing. */
function constrainZoneToCanvas(obj: any, fc: any) {
	const canvasW = fc.width ?? 0;
	const canvasH = fc.height ?? 0;
	if (!canvasW || !canvasH) return;

	const scaleX = obj.scaleX ?? 1;
	const scaleY = obj.scaleY ?? 1;
	if (scaleX !== 1 || scaleY !== 1) {
		obj.set({
			width: (obj.width ?? 0) * scaleX,
			height: (obj.height ?? 0) * scaleY,
			scaleX: 1,
			scaleY: 1,
		});
	}

	const minSize = 8;
	let width = Math.max(minSize, obj.width ?? 0);
	let height = Math.max(minSize, obj.height ?? 0);
	if (width > canvasW) width = canvasW;
	if (height > canvasH) height = canvasH;
	if (width !== obj.width || height !== obj.height) {
		obj.set({ width, height, scaleX: 1, scaleY: 1 });
	}

	obj.setCoords?.();
	const bound = obj.getBoundingRect();

	let left = obj.left ?? 0;
	let top = obj.top ?? 0;

	if (bound.left < 0) left -= bound.left;
	if (bound.top < 0) top -= bound.top;
	if (bound.left + bound.width > canvasW) {
		left -= bound.left + bound.width - canvasW;
	}
	if (bound.top + bound.height > canvasH) {
		top -= bound.top + bound.height - canvasH;
	}

	obj.set({ left, top });
	obj.setCoords?.();
}

/** Normalize scale and sync Fabric rect to its visual bounding box (canvas pixels). */
function syncRectFromBoundingBox(obj: any) {
	const scaleX = obj.scaleX ?? 1;
	const scaleY = obj.scaleY ?? 1;
	if (scaleX !== 1 || scaleY !== 1) {
		obj.set({
			width: (obj.width ?? 0) * scaleX,
			height: (obj.height ?? 0) * scaleY,
			scaleX: 1,
			scaleY: 1,
		});
	}
	obj.setCoords?.();
	const bound = obj.getBoundingRect?.();
	if (!bound) return;
	obj.set({
		left: bound.left,
		top: bound.top,
		width: bound.width,
		height: bound.height,
		scaleX: 1,
		scaleY: 1,
	});
	obj.setCoords?.();
}

function readLogicalZoneGeometry(obj: any, sf: number) {
	return readLogicalZoneGeometryFromFabric(obj, sf);
}

/** Enable or disable selecting / dragging / resizing zones on the Fabric canvas. */
function setZoneRectsInteractive(fc: any, interactive: boolean) {
	getZoneRects(fc).forEach((rect) => {
		rect.set({
			selectable: interactive,
			evented: interactive,
			hasControls: interactive,
			lockMovementX: !interactive,
			lockMovementY: !interactive,
			lockScalingX: !interactive,
			lockScalingY: !interactive,
		});
		rect.setCoords?.();
	});
}

function attachZoneRectHandlers(rect: any, fc: any) {
	if (rect.__zoneHandlersAttached) return;
	rect.__zoneHandlersAttached = true;

	rect.setControlsVisibility?.({
		tl: false,
		tr: false,
		br: false,
		bl: false,
		mtr: false,
	});
	rect.on('scaling', function (this: any) {
		this.set({
			width: this.width * this.scaleX,
			height: this.height * this.scaleY,
			scaleX: 1,
			scaleY: 1,
		});
		constrainZoneToCanvas(this, fc);
	});
}

function escapeHtml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

/** Remove legacy Fabric queue labels — zone text is rendered in HTML overlays. */
function syncZoneQueueLabel(fc: any, rect: any) {
	removeZoneLabels(fc, rect.id);
	fc.renderAll?.();
}

function removeZoneLabels(fc: any, rectId: string) {
	(fc.getObjects?.() ?? [])
		.filter((o: any) => o[ZONE_LABEL_FOR_KEY] === rectId)
		.forEach((o: any) => fc.remove(o));
}

interface SavedZoneConfig {
	name?: string;
	queue_id?: number | null;
	queue_ids?: number[];
	queue_uuids?: string[];
	queue_names?: string[];
	left?: number;
	top?: number;
	width?: number;
	height?: number;
	backgroundColor?: string;
	theme_id?: string | null;
	display_theme?: string | null;
	background_color?: string | null;
	border?: number;
	borderRadius?: number;
	borderColor?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

const TemplateDetailWorkspace: React.FC = () => {
	const navigate = useNavigate();
	const { id } = useParams<{ id: string }>();
	const location = useLocation();
	const routeTemplate = (location.state as Template | null) ?? null;
	const { can } = usePermissions();
	const canWrite = can('templates_write');
	const canWriteRef = useRef(canWrite);

	useEffect(() => {
		canWriteRef.current = canWrite;
	}, [canWrite]);

	const [templateDetails, setTemplateDetails] = useState<Template | null>(routeTemplate);
	const [loading, setLoading] = useState(!routeTemplate);
	const [saving, setSaving] = useState(false);

	// Fabric state
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const fabricRef = useRef<any>(null); // fabric.Canvas instance
	const [scalingFactor, setScalingFactor] = useState(1);
	const [canvasWidth, setCanvasWidth] = useState(0);
	const [canvasHeight, setCanvasHeight] = useState(0);
	const [canvasObjects, setCanvasObjects] = useState<any[]>([]);
	const [selectedObject, setSelectedObject] = useState<any>(null);

	// Zone properties panel
	const [zoneProps, setZoneProps] = useState<ZoneProps>(BLANK_PROPS);
	const [zoneAppearance, setZoneAppearance] = useState<ZoneDisplayAppearance>({
		mode: 'fill',
		displayTheme: null,
		backgroundColor: '#ffffff',
	});
	const [overlayRevision, setOverlayRevision] = useState(0);
	const bumpOverlayRevision = useCallback(() => setOverlayRevision((n) => n + 1), []);
	const [nameError, setNameError] = useState(false);
	const [themeError, setThemeError] = useState(false);
	const [queues, setQueues] = useState<Queue[]>([]);
	const [queuesLoading, setQueuesLoading] = useState(false);
	const [queuesLoadError, setQueuesLoadError] = useState<string | null>(null);

	const queuesById = React.useMemo(
		() => new Map(queues.map((q) => [q.id, q])),
		[queues],
	);

	const queuesByUuidMulti = React.useMemo(() => buildQueuesByUuidMulti(queues), [queues]);
	const queuesByName = React.useMemo(() => buildQueuesByName(queues), [queues]);

	useEffect(() => {
		let cancelled = false;
		setQueuesLoading(true);
		setQueuesLoadError(null);
		queuesApi
			.list({ ordering: 'name', limit: 200 })
			.then((res) => {
				if (cancelled) return;
				setQueues(res.results ?? []);
				setQueuesLoadError(null);
			})
			.catch((err) => {
				if (cancelled) return;
				setQueues([]);
				setQueuesLoadError(
					isForbiddenPermissionError(err)
						? formatPermissionDeniedMessage(err)
						: getErrorMessage(err),
				);
			})
			.finally(() => {
				if (!cancelled) setQueuesLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, []);

	const refreshAllZoneLabels = useCallback(() => {
		const fc = fabricRef.current;
		if (!fc || queuesById.size === 0) return;
		getZoneRects(fc).forEach((rect) => {
			const queueIds = resolveQueueIdsFromRect(rect as any, queuesByUuidMulti, queuesByName);
			applyQueueRefsToRect(rect, queueIds, queuesById);
			syncZoneQueueLabel(fc, rect);
		});
	}, [queuesById, queuesByUuidMulti, queuesByName, scalingFactor]);

	useEffect(() => {
		refreshAllZoneLabels();
	}, [refreshAllZoneLabels, templateDetails]);

	/** When read-only, zones cannot be selected (no Zone Properties panel). */
	useEffect(() => {
		const fc = fabricRef.current;
		if (!fc) return;
		fc.selection = canWrite;
		setZoneRectsInteractive(fc, canWrite);
		if (!canWrite) {
			fc.discardActiveObject();
			fc.requestRenderAll?.();
			setSelectedObject(null);
			setZoneProps(BLANK_PROPS);
			setZoneAppearance({ mode: 'fill', displayTheme: null, backgroundColor: '#ffffff' });
		}
	}, [canWrite]);

	const applyZoneAppearance = useCallback(
		(next: ZoneDisplayAppearance) => {
			setZoneAppearance(next);
			if (isZoneThemeSelectionComplete(next)) {
				setThemeError(false);
			}
			if (!fabricRef.current) return;
			const fc = fabricRef.current;
			const active = fc.getActiveObject?.();
			const target = active ?? selectedObject;
			if (!target || !isZoneRect(target)) return;

			const stroke = target.stroke ?? null;
			applyZoneAppearanceToRect(target, next, stroke);

			// Re-encode zone opacity into the fill alpha after changing appearance
			// (applyZoneAppearanceToRect resets fill to a solid colour).
			if (next.mode === 'fill') {
				const zoneOpacity100 = Number.isFinite((target as any).zoneOpacity)
					? Number((target as any).zoneOpacity)
					: Math.round(((target as any).opacity ?? 1) * 100);
				if (zoneOpacity100 < 100) {
					const fraction = zoneOpacity100 / 100;
					const base = next.backgroundColor ?? '#ffffff';
					target.set({ fill: applyColorAlpha(base, fraction) });
				}
			}

			const fillColor =
				next.mode === 'fill' ? (next.backgroundColor ?? '#ffffff') : 'theme';
			setZoneProps((s) => ({ ...s, color: fillColor }));

			if (next.mode === 'theme') {
				(fc.getObjects?.() ?? [])
					.filter((o: any) => o[ZONE_LABEL_FOR_KEY] === target.id)
					.forEach((o: any) => fc.remove(o));
			} else {
				const queueIds = resolveQueueIdsFromRect(
					target as any,
					queuesByUuidMulti,
					queuesByName,
				);
				syncZoneQueueLabel(fc, target);
			}

			bumpOverlayRevision();
			fc.requestRenderAll?.();
			fc.renderAll();
		},
		[
			selectedObject,
			queuesById,
			queuesByUuidMulti,
			queuesByName,
			scalingFactor,
			bumpOverlayRevision,
		],
	);

	// ─── Load template ───────────────────────────────────────────────────────
	// If the list page already passed the template via router state we skip the
	// API call entirely; this avoids hanging on dummy / offline templates.

	useEffect(() => {
		if (!id) return;
		setLoading(true);
		templatesApi
			.get(Number(id))
			.then((data) => setTemplateDetails(data))
			.catch(() => {
				if (routeTemplate) {
					setTemplateDetails(routeTemplate);
					return;
				}
				setTemplateDetails({
					id: Number(id),
					template_name: 'Template',
					orientation: 'landscape',
					resolution_width: 1920,
					resolution_height: 1080,
				});
			})
			.finally(() => setLoading(false));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [id]);

	// ─── Build fabric canvas when templateDetails arrive ─────────────────────

	useEffect(() => {
		if (!templateDetails || !canvasRef.current) return;

		// Destroy previous canvas if any
		if (fabricRef.current) {
			fabricRef.current.dispose();
			fabricRef.current = null;
		}

		// const isLandscape = templateDetails.orientation === 'landscape';
		const orientation = templateDetails.orientation ?? 'landscape';

		const htmlLayout = parseTemplateLayoutFromHtml(templateDetails.html_content ?? '');
		const width = htmlLayout?.width ?? templateDetails.resolution_width ?? 1920;
		const height = htmlLayout?.height ?? templateDetails.resolution_height ?? 1080;

		const isLandscape = orientation === 'landscape';

		// const sf = isLandscape
		// 	? window.innerWidth / templateDetails.resolution_width / 2.3
		// 	: window.innerWidth / templateDetails.resolution_height / 4;

		// const cw = templateDetails.resolution_width * sf;
		// const ch = templateDetails.resolution_height * sf;

		// Smaller divisors → larger on-canvas TV preview in the editor.
		const sf = isLandscape
			? window.innerWidth / width / 1.75
			: window.innerWidth / height / 3.0;

		const cw = width * sf;
		const ch = height * sf;

		setScalingFactor(sf);
		setCanvasWidth(cw);
		setCanvasHeight(ch);

		// Dynamically import fabric — v7 exports classes directly (no { fabric } namespace)
		import('fabric').then(({ Canvas }) => {
			const fc = new Canvas('tpl-detail-canvas', {
				height: ch,
				width: cw,
				backgroundColor: 'white',
				selection: true,
				renderOnAddRemove: true,
				preserveObjectStacking: true,
			});

			fc.on('selection:created', (e: any) => {
				if (!canWriteRef.current) {
					fc.discardActiveObject();
					return;
				}
				const obj = e?.selected?.[0] ?? null;
				setSelectedObject(isZoneRect(obj) ? obj : null);
			});
			fc.on('selection:updated', (e: any) => {
				if (!canWriteRef.current) {
					fc.discardActiveObject();
					return;
				}
				const obj = e?.selected?.[0] ?? e?.target ?? null;
				setSelectedObject(isZoneRect(obj) ? obj : null);
			});
			fc.on('selection:cleared', () => {
				setSelectedObject(null);
				setZoneProps(BLANK_PROPS);
				setZoneAppearance({ mode: 'fill', displayTheme: null, backgroundColor: '#ffffff' });
			});
			fc.on('object:added', () => setCanvasObjects(getZoneRects(fc)));
			fc.on('object:modified', (e: any) => {
				if (!canWriteRef.current) return;
				const target = e.target;
				if (isZoneRect(target)) {
					ensureFabricRectLeftTopOrigin(target);
					constrainZoneToCanvas(target, fc);
					const queueIds = resolveQueueIdsFromRect(target as any, queuesByUuidMulti, queuesByName);
					syncZoneQueueLabel(fc, target);
					setOverlayRevision((n) => n + 1);
				}
				setSelectedObject(null);
				setSelectedObject(isZoneRect(target) ? target : null);
				setCanvasObjects(getZoneRects(fc));
			});
			fc.on('object:moving', (e: any) => {
				if (!canWriteRef.current) return;
				const target = e.target;
				if (isZoneRect(target)) {
					constrainZoneToCanvas(target, fc);
					const queueIds = resolveQueueIdsFromRect(
						target as any,
						queuesByUuidMulti,
						queuesByName,
					);
					syncZoneQueueLabel(fc, target);
					setOverlayRevision((n) => n + 1);
				}
			});
			fc.on('object:scaling', (e: any) => {
				if (!canWriteRef.current) return;
				const target = e.target;
				if (isZoneRect(target)) {
					constrainZoneToCanvas(target, fc);
					const queueIds = resolveQueueIdsFromRect(
						target as any,
						queuesByUuidMulti,
						queuesByName,
					);
					syncZoneQueueLabel(fc, target);
					setOverlayRevision((n) => n + 1);
				}
			});
			fc.on('object:removed', () => {
				setCanvasObjects(getZoneRects(fc));
				refreshZoneQueueLabels();
			});

			fabricRef.current = fc;

			const configuration =
				typeof templateDetails.configuration === 'string'
					? JSON.parse(templateDetails.configuration)
					: templateDetails.configuration;

			const fabricJson = configuration?.fabric_json;

			const refreshZoneQueueLabels = () => {
				if (queuesById.size === 0) return;
				getZoneRects(fc).forEach((rect) => {
					const queueIds = resolveQueueIdsFromRect(
						rect as any,
						queuesByUuidMulti,
						queuesByName,
					);
					applyQueueRefsToRect(rect, queueIds, queuesById);
					syncZoneQueueLabel(fc, rect);
				});
			};

			const finishLoad = () => {
				(fc.getObjects?.() ?? [])
					.filter((o: any) => o[ZONE_LABEL_KEY])
					.forEach((o: any) => fc.remove(o));

				getZoneRects(fc).forEach((rect) => {
					ensureFabricRectLeftTopOrigin(rect);
					attachZoneRectHandlers(rect, fc);
					const appearance = getZoneAppearanceFromRect(rect);
					applyZoneAppearanceToRect(rect, appearance, rect.stroke ?? 'black');

					// Migrate legacy fabric opacity to zoneOpacity / fill-alpha approach.
					// Old saves stored opacity on the whole Fabric rect (which fades text too).
					const fabricOpacity: number = (rect as any).opacity ?? 1;
					const existingZoneOpacity: number | undefined = (rect as any).zoneOpacity;
					const zoneOpacity100 = Number.isFinite(existingZoneOpacity)
						? Number(existingZoneOpacity)
						: Math.round(fabricOpacity * 100);

					if (!Number.isFinite(existingZoneOpacity)) {
						(rect as any).set?.({ zoneOpacity: zoneOpacity100 });
					}

					// For fill mode: move opacity from fabric rect into fill colour alpha.
					if (appearance.mode === 'fill' && zoneOpacity100 < 100) {
						const fraction = zoneOpacity100 / 100;
						const base = appearance.backgroundColor ?? '#ffffff';
						(rect as any).set?.({ fill: applyColorAlpha(base, fraction) });
					}

					// Always reset fabric element opacity to 1 (opacity now lives in fill alpha).
					if (fabricOpacity < 1) {
						(rect as any).set?.({ opacity: 1 });
					}

					// Do not constrain on load — fabric_json / saved zones already have
					// correct positions; constraining here was shifting the user's design.
				});

				refreshZoneQueueLabels();
				fc.selection = canWriteRef.current;
				setZoneRectsInteractive(fc, canWriteRef.current);
				fc.renderAll();
				setCanvasObjects(getZoneRects(fc));
				setOverlayRevision((n) => n + 1);
			};

			const loadZoneRects = (
				zones: {
					name?: string;
					queueIds?: number[];
					queueUuids?: string[];
					queueChipNames?: string[];
					left: number;
					top: number;
					width: number;
					height: number;
					appearance: ZoneDisplayAppearance;
					stroke?: string | null;
					rx?: number;
					/** 0-1 zone opacity (from saved data). Default 1. */
					zoneOpacityFraction?: number;
				}[],
			) => {
				import('fabric').then(({ Rect }) => {
					zones.forEach((zone) => {
						const queueUuids = zone.queueUuids ?? [];
						const queueIds = zone.queueIds ?? [];
						const queueChipNames = zone.queueChipNames ?? [];
						const fabricGeom = toFabricZoneGeometry(
							{
								left: zone.left,
								top: zone.top,
								width: zone.width,
								height: zone.height,
							},
							width,
							height,
							sf,
							'clamp',
						);
						const zoneOpacityFraction = zone.zoneOpacityFraction ?? 1;
						const rect = new Rect({
							id: nanoid(),
							name: zone.name ?? '',
							queueIds,
							queueUuids,
							queueChipNames,
							queueId: queueIds[0] ?? null,
							originX: 'left',
							originY: 'top',
							width: fabricGeom.width,
							height: fabricGeom.height,
							left: fabricGeom.left,
							top: fabricGeom.top,
							fill:
								zone.appearance.mode === 'fill'
									? applyColorAlpha(
										zone.appearance.backgroundColor ?? '#ffffff',
										zoneOpacityFraction,
									)
									: 'rgba(0,0,0,0.2)',
							displayTheme:
								zone.appearance.mode === 'theme' ? zone.appearance.displayTheme : null,
							zoneFillColor: zone.appearance.backgroundColor,
							// zoneOpacity stores 0-100; Fabric opacity is always 1 (we never reduce
							// the whole-element opacity — only the fill colour's alpha channel).
							zoneOpacity: Math.round(zoneOpacityFraction * 100),
							stroke: zone.stroke ?? 'black',
							strokeUniform: true,
							lockScalingFlip: true,
							hasRotatingPoint: false,
							noScaleCache: false,
							rx: (zone.rx ?? 0) * sf,
							ry: (zone.rx ?? 0) * sf,
						});
						applyZoneAppearanceToRect(rect, zone.appearance, zone.stroke ?? 'black');
						// Re-encode fill alpha after applyZoneAppearanceToRect (which sets solid fill)
						if (zone.appearance.mode === 'fill' && zoneOpacityFraction < 1) {
							const base = zone.appearance.backgroundColor ?? '#ffffff';
							rect.set({ fill: applyColorAlpha(base, zoneOpacityFraction) });
						}
						rect.on('deselected', () => {
							setSelectedObject(null);
							setZoneProps(BLANK_PROPS);
						});
						fc.add(rect);
					});
					finishLoad();
					setOverlayRevision((n) => n + 1);
				});
			};

			const savedZones = configuration?.zones as SavedZoneConfig[] | undefined;
			const parsedHtml =
				htmlLayout ?? parseTemplateLayoutFromHtml(templateDetails.html_content ?? '');

			const mapHtmlZonesToRects = () => {
				const enrichedZones = enrichParsedZonesWithConfiguration(
					parsedHtml?.zones ?? [],
					configuration,
				);

				loadZoneRects(
					enrichedZones.map((zone) => {
						const geom = clampZoneGeometryToCanvas(
							{
								left: zone.left,
								top: zone.top,
								width: zone.width,
								height: zone.height,
							},
							width,
							height,
						);
						const appearance = getZoneAppearanceFromSaved({
							display_theme: zone.displayTheme,
							background_color: zone.displayTheme ? null : zone.backgroundColor,
						});
						return {
							name: zone.name,
							queueIds: zone.queueIds.slice(0, 1),
							queueUuids: zone.queueUuids.slice(0, 1),
							queueChipNames: zone.queueChipNames.slice(0, 1),
							...geom,
							appearance,
							stroke: zone.border ? zone.borderColor : null,
							rx: zone.borderRadius,
							zoneOpacityFraction: zone.opacity ?? 1,
						};
					}),
				);
			};

			const mapSavedZonesToRects = () =>
				loadZoneRects(
					(savedZones ?? []).map((zone) => {
						const geom = clampZoneGeometryToCanvas(
							{
								left: zone.left ?? 0,
								top: zone.top ?? 0,
								width: zone.width ?? 0,
								height: zone.height ?? 0,
							},
							width,
							height,
						);
						const appearance = getZoneAppearanceFromSavedZone(zone);
						return {
							name: zone.name,
							queueIds:
								zone.queue_ids ??
								(zone.queue_id != null ? [zone.queue_id] : []),
							queueUuids: zone.queue_uuids ?? [],
							queueChipNames: zone.queue_names ?? [],
							...geom,
							appearance,
							stroke: zone.border ? zone.borderColor ?? 'black' : null,
							rx: zone.borderRadius ?? 0,
							zoneOpacityFraction: (zone as any).zone_opacity ?? 1,
						};
					}),
				);

			// html_content is the display source of truth. Never load fabric_json when html
			// has zones — stale fabric_json (from screens preview / old saves) caused mismatch
			// with list thumbnails.
			const hasHtmlZones = (parsedHtml?.zones.length ?? 0) > 0;

			if (hasHtmlZones) {
				mapHtmlZonesToRects();
				return;
			}

			if (Array.isArray(savedZones) && savedZones.length > 0) {
				mapSavedZonesToRects();
				return;
			}

			if (fabricJson) {
				fc.loadFromJSON(fabricJson, () => {
					getZoneRects(fc).forEach((obj) => {
						normalizeFabricRectToCanvas(obj, sf, width, height);
					});
					finishLoad();
				});
				return;
			}

			finishLoad();
		});

		return () => {
			fabricRef.current?.dispose();
			fabricRef.current = null;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [templateDetails]);

	// ─── Keep zone-props panel in sync with selectedObject ────────────────────

	useEffect(() => {
		if (!selectedObject) return;
		setNameError(false);
		setThemeError(false);
		const appearance = getZoneAppearanceFromRect(selectedObject);
		setZoneAppearance(appearance);
		const geom = readLogicalZoneGeometryFromFabric(selectedObject, scalingFactor);
		setZoneProps({
			containerName: selectedObject.name ?? '',
			queueIds: resolveQueueIdsFromRect(selectedObject as any, queuesByUuidMulti, queuesByName),
			containerZIndex: canvasObjects.indexOf(selectedObject),
			width: geom.width,
			height: geom.height,
			left: geom.left,
			top: geom.top,
			color:
				appearance.mode === 'fill'
					? (appearance.backgroundColor ?? '#ffffff')
					: 'theme',
			radius: Math.round((selectedObject.rx ?? 0) / scalingFactor),
			borderColor: selectedObject.stroke ?? 'rgba(255,255,255,0)',
			// Read opacity from zoneOpacity (never from fabric opacity, which we no longer set)
			opacity: Number.isFinite((selectedObject as any).zoneOpacity)
				? Math.round(Number((selectedObject as any).zoneOpacity))
				: 100,
		});
	}, [selectedObject, scalingFactor, canvasObjects, queuesByUuidMulti, queuesByName]);

	// ─── Delete key handler ───────────────────────────────────────────────────

	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			if (e.key === 'Delete' && selectedObject && fabricRef.current && isZoneRect(selectedObject)) {
				const fc = fabricRef.current;
				removeZoneLabels(fc, selectedObject.id);
				fc.remove(selectedObject);
				setSelectedObject(null);
				setZoneProps(BLANK_PROPS);
				setCanvasObjects(getZoneRects(fc));
				getZoneRects(fc).forEach((rect) => {
					const queueIds = resolveQueueIdsFromRect(
						rect as any,
						queuesByUuidMulti,
						queuesByName,
					);
					syncZoneQueueLabel(fc, rect);
				});
			}
		};
		document.addEventListener('keydown', handler);
		return () => document.removeEventListener('keydown', handler);
	}, [selectedObject]);

	// ─── Helpers ─────────────────────────────────────────────────────────────

	const nudge = useCallback(
		(type: keyof ZoneProps, delta: number) => {
			if (!selectedObject || !fabricRef.current) return;
			const fc = fabricRef.current;
			const sf = scalingFactor;
			switch (type) {
				case 'width': {
					const cur = selectedObject.width * (selectedObject.scaleX ?? 1);
					selectedObject.set({ width: cur + delta * sf, scaleX: 1 });
					break;
				}
				case 'height': {
					const cur = selectedObject.height * (selectedObject.scaleY ?? 1);
					selectedObject.set({ height: cur + delta * sf, scaleY: 1 });
					break;
				}
				case 'left':
					selectedObject.set('left', selectedObject.left + delta * sf);
					break;
				case 'top':
					selectedObject.set('top', selectedObject.top + delta * sf);
					break;
				case 'radius': {
					const nr = ((zoneProps.radius ?? 0) + delta) * sf;
					selectedObject.set({ rx: nr, ry: nr });
					break;
				}
			}
			selectedObject.setCoords?.();
			constrainZoneToCanvas(selectedObject, fc);
			fc.renderAll();
			setZoneProps((s) => ({ ...s, [type]: (s[type] as number) + delta }));
			bumpOverlayRevision();
		},
		[selectedObject, scalingFactor, zoneProps.radius, bumpOverlayRevision],
	);

	const arrangeLayer = useCallback(
		(action: 'forward' | 'backward' | 'front' | 'back') => {
			const fc = fabricRef.current;
			if (!fc) return;
			const activeObject = fc.getActiveObject?.() ?? selectedObject;
			if (!activeObject) return;

			const moveByIndex = (nextIndex: number) => {
				const objects: any[] = fc.getObjects?.() ?? [];
				const bounded = Math.max(0, Math.min(objects.length - 1, nextIndex));
				if (typeof fc.moveObjectTo === 'function') {
					fc.moveObjectTo(activeObject, bounded);
					return;
				}
				if (typeof activeObject.moveTo === 'function') {
					activeObject.moveTo(bounded);
				}
			};

			const objects: any[] = fc.getObjects?.() ?? [];
			const currentIndex = objects.indexOf(activeObject);

			if (action === 'forward') {
				if (typeof fc.bringObjectForward === 'function') fc.bringObjectForward(activeObject, true);
				else if (typeof fc.bringForward === 'function') fc.bringForward(activeObject, true);
				else if (currentIndex >= 0) moveByIndex(currentIndex + 1);
			}
			if (action === 'backward') {
				if (typeof fc.sendObjectBackwards === 'function') fc.sendObjectBackwards(activeObject, true);
				else if (typeof fc.sendBackwards === 'function') fc.sendBackwards(activeObject, true);
				else if (currentIndex >= 0) moveByIndex(currentIndex - 1);
			}
			if (action === 'front') {
				if (typeof fc.bringObjectToFront === 'function') fc.bringObjectToFront(activeObject);
				else if (typeof fc.bringToFront === 'function') fc.bringToFront(activeObject);
				else moveByIndex((objects.length || 1) - 1);
			}
			if (action === 'back') {
				if (typeof fc.sendObjectToBack === 'function') fc.sendObjectToBack(activeObject);
				else if (typeof fc.sendToBack === 'function') fc.sendToBack(activeObject);
				else moveByIndex(0);
			}

			fc.requestRenderAll?.();
			fc.renderAll();
			setCanvasObjects(getZoneRects(fc));
			setSelectedObject(activeObject);
		},
		[selectedObject],
	);

	const handleForwardLayer = (e: React.MouseEvent<HTMLButtonElement>) => {
		arrangeLayer(e.shiftKey ? 'front' : 'forward');
	};

	const handleBackwardLayer = (e: React.MouseEvent<HTMLButtonElement>) => {
		arrangeLayer(e.shiftKey ? 'back' : 'backward');
	};

	const updateSelectedZoneQueues = useCallback(
		(nextQueueIds: number[]) => {
			if (!selectedObject || !fabricRef.current || !isZoneRect(selectedObject)) return;
			const fc = fabricRef.current;
			const uniqueIds = toSingleZoneQueueIds(nextQueueIds);
			applyQueueRefsToRect(selectedObject, uniqueIds, queuesById);
			setZoneProps((s) => ({ ...s, queueIds: uniqueIds }));
			syncZoneQueueLabel(fc, selectedObject);
			bumpOverlayRevision();
			fc.renderAll();
		},
		[selectedObject, queuesById, scalingFactor, bumpOverlayRevision],
	);

	const handleZoneQueueChange = (value: string) => {
		if (!value) {
			updateSelectedZoneQueues([]);
			return;
		}
		const queueId = Number(value);
		if (!Number.isFinite(queueId) || queueId <= 0) return;
		updateSelectedZoneQueues([queueId]);
	};

	// ─── Add zone ─────────────────────────────────────────────────────────────

	const addZone = useCallback(() => {
		if (!fabricRef.current || !templateDetails) return;
		import('fabric').then(({ Rect }) => {
			const fc = fabricRef.current;
			const sf = scalingFactor || 1;
			const maxLogicalSide = Math.min(templateDetails.resolution_width, templateDetails.resolution_height);
			const zoneLogicalSize = Math.max(80, Math.min(220, Math.round(maxLogicalSide * 0.25)));
			const zoneCanvasSize = Math.max(28, zoneLogicalSize * sf);
			const startLeft = Math.max(0, (fc.width - zoneCanvasSize) / 2);
			const startTop = Math.max(0, (fc.height - zoneCanvasSize) / 2);

			const defaultAppearance = createThemeAppearance(ZONE_DISPLAY_THEME_IDS[0]);
			const rect = new Rect({
				id: nanoid(),
				name: '',
				queueIds: [],
				queueUuids: [],
				queueId: null,
				originX: 'left',
				originY: 'top',
				width: zoneCanvasSize,
				height: zoneCanvasSize,
				left: startLeft,
				top: startTop,
				fill: 'rgba(0,0,0,0.2)',
				displayTheme: defaultAppearance.displayTheme,
				zoneFillColor: null,
				zoneOpacity: 100,
				stroke: 'black',
				strokeUniform: true,
				lockScalingFlip: true,
				hasRotatingPoint: false,
				noScaleCache: false,
			});
			applyZoneAppearanceToRect(rect, defaultAppearance, 'black');
			attachZoneRectHandlers(rect, fc);
			rect.on('deselected', () => {
				setSelectedObject(null);
				setZoneProps(BLANK_PROPS);
			});
			fc.add(rect);
			constrainZoneToCanvas(rect, fc);
			fc.setActiveObject(rect);
			fc.renderAll();
			setOverlayRevision((n) => n + 1);
		});
	}, [templateDetails, scalingFactor]);

	// ─── Save ─────────────────────────────────────────────────────────────────

	// const saveTemplate = useCallback(async () => {
	// 	const fc = fabricRef.current;
	// 	if (!fc || !templateDetails) return;

	// 	const objs: any[] = fc.getObjects();

	// 	if (objs.length === 0) {
	// 		alert('Please add at least one zone before saving.');
	// 		return;
	// 	}

	// 	const unnamed = objs.find((o) => !o.name?.trim());
	// 	if (unnamed) {
	// 		fc.setActiveObject(unnamed);
	// 		fc.renderAll();
	// 		setSelectedObject(unnamed);
	// 		setNameError(true);
	// 		return;
	// 	}

	// 	setSaving(true);
	// 	try {
	// 		const sf = scalingFactor;
	// 		const divs = objs.map((obj, idx) => ({
	// 			div_name: obj.name,
	// 			position: 'absolute',
	// 			marginTop: Math.round(obj.top / sf),
	// 			marginLeft: Math.round(obj.left / sf),
	// 			height: Math.round(obj.height / sf),
	// 			width: Math.round(obj.width / sf),
	// 			backgroundColor: obj.fill,
	// 			border: obj.stroke === null ? 0 : 1,
	// 			borderRadius: Math.round((obj.rx ?? 0) / sf),
	// 			borderColor: obj.stroke ?? 'rgba(255,255,255,0)',
	// 			zIndex: idx,
	// 			template: templateDetails.id,
	// 		}));

	// 		const png = fc.toDataURL({ format: 'png' });
	// 		const blob = await (await fetch(png)).blob();
	// 		const { authAxios } = await import('../../../axiosInstance');

	// 		const generateTemplateHtml = (
	// 			objs: any[],
	// 			sf: number,
	// 			templateWidth: number,
	// 			templateHeight: number,
	// 		) => {
	// 			const html = objs
	// 				.map((obj, idx) => {
	// 					return `
	// 		<div
	// 			class="queue-zone"
	// 			data-queue-id="${obj.queueId ?? ''}"
	// 			style="
	// 				position:absolute;
	// 				left:${Math.round(obj.left / sf)}px;
	// 				top:${Math.round(obj.top / sf)}px;
	// 				width:${Math.round(obj.width / sf)}px;
	// 				height:${Math.round(obj.height / sf)}px;
	// 				background:${obj.fill};
	// 				border:${obj.stroke ? `1px solid ${obj.stroke}` : 'none'};
	// 				border-radius:${Math.round((obj.rx ?? 0) / sf)}px;
	// 				z-index:${idx};
	// 				box-sizing:border-box;
	// 				overflow:hidden;
	// 			">
	// 		</div>`;
	// 				})
	// 				.join('\n');

	// 			return `
	// 		<div
	// 			class="template-container"
	// 			style="
	// 				position:relative;
	// 				width:${templateWidth}px;
	// 				height:${templateHeight}px;
	// 				background:white;
	// 				overflow:hidden;
	// 			">
	// 			${html}
	// 		</div>
	// 		`;
	// 		};

	// 		const htmlContent = generateTemplateHtml(
	// 			objs,
	// 			sf,
	// 			templateDetails.resolution_width,
	// 			templateDetails.resolution_height,
	// 		);

	// 		await authAxios.patch(
	// 			`api/administration/templates/${templateDetails.id}/`,
	// 			{
	// 				html_content: htmlContent,
	// 			},
	// 		);

	// 		// const form = new FormData();
	// 		// form.append('thumbnail', blob, `template${templateDetails.id}.png`);
	// 		// form.append('data', JSON.stringify(divs));
	// 		// form.append('template_id', String(templateDetails.id));

	// 		// await authAxios.post('api/signage/divs', form, {
	// 		// 	headers: { 'content-type': 'multipart/form-data' },
	// 		// });


	// 		navigate('/templates');
	// 	} catch {
	// 		alert('Save failed. Please try again.');
	// 	} finally {
	// 		setSaving(false);
	// 	}
	// }, [templateDetails, scalingFactor, navigate]);

	const saveTemplate = useCallback(async () => {
		const fc = fabricRef.current;

		if (!fc || !templateDetails) return;

		const objs: any[] = getZoneRects(fc);

		// -----------------------------
		// VALIDATIONS
		// -----------------------------

		if (objs.length === 0) {
			alert('Please add at least one zone before saving.');
			return;
		}

		const unnamed = objs.find((o) => !o.name?.trim());

		if (unnamed) {
			fc.setActiveObject(unnamed);
			fc.renderAll();

			setSelectedObject(unnamed);
			setNameError(true);
			setThemeError(false);

			return;
		}

		const missingTheme = objs.find((o) => {
			const appearance = getZoneAppearanceFromRect(o);
			return !isZoneThemeSelectionComplete(appearance);
		});

		if (missingTheme) {
			fc.setActiveObject(missingTheme);
			fc.renderAll();

			setSelectedObject(missingTheme);
			setZoneAppearance(getZoneAppearanceFromRect(missingTheme));
			setNameError(false);
			setThemeError(true);

			return;
		}

		setSaving(true);

		try {
			const sf = scalingFactor;

			// ----------------------------------------
			// CLEAN ZONES DATA
			// ----------------------------------------

			const templateWidth = templateDetails.resolution_width ?? 1920;
			const templateHeight = templateDetails.resolution_height ?? 1080;

			getZoneRects(fc).forEach((obj) => ensureFabricRectLeftTopOrigin(obj));

			const zones = getZoneRects(fc).map((obj: any, idx: number) => {
				const rawGeom = readLogicalZoneGeometry(obj, sf);
				// Clamp only — do not run legacy full-width normalize on save (it was
				// turning right columns like left:1073+width:847 into full-screen overlays).
				const geom = clampZoneGeometryToCanvas(
					rawGeom,
					templateWidth,
					templateHeight,
				);
				const queueIds = resolveQueueIdsFromRect(obj as any, queuesByUuidMulti, queuesByName);
				const queueUuids = queueIdsToUuids(queueIds, queuesById);
				const appearance = getZoneAppearanceFromRect(obj);
				const { theme_id, background_color } = serializeZoneAppearance(appearance);
				const themeId = parseDisplayThemeId(theme_id);
				const htmlBackground =
					themeId != null
						? themeFallbackBackgroundColor(themeId)
						: background_color || obj.zoneFillColor || obj.fill || '#ffffff';

				return {
					id: idx + 1,

					name: obj.name,

					queue_id: queueIds[0] ?? null,
					queue_ids: queueIds,
					queue_uuids: queueUuids,
					queue_names: queueIds.map(
						(qId) => queuesById.get(qId)?.name ?? `Queue #${qId}`,
					),

					position: 'absolute',

					left: geom.left,

					top: geom.top,

					width: geom.width,

					height: geom.height,

					theme_id,
					background_color,
					backgroundColor: htmlBackground,

					border: obj.stroke ? 1 : 0,

					borderRadius: Math.round((obj.rx ?? 0) / sf),

					borderColor: obj.stroke ?? 'transparent',

					zIndex: idx,

					/** Zone-level opacity (0-1). Saved for HTML + config restore. */
					zone_opacity: Number.isFinite((obj as any).zoneOpacity)
						? Math.round(Number((obj as any).zoneOpacity)) / 100
						: obj.opacity ?? 1,
				};
			});

			// Sync canvas + fabric_json to normalized logical geometry (avoids half-width bbox saves).
			const zoneRects = getZoneRects(fc);
			zoneRects.forEach((obj, idx) => {
				const zone = zones[idx];
				if (!zone) return;
				applyLogicalZoneGeometryToFabric(
					obj,
					{
						left: zone.left,
						top: zone.top,
						width: zone.width,
						height: zone.height,
					},
					sf,
				);
			});
			fc.renderAll();

			// ----------------------------------------
			// SAVE FABRIC JSON
			// VERY IMPORTANT
			// ----------------------------------------

			let fabricJson: string | object = fc.toJSON(FABRIC_CUSTOM_PROPS);
			try {
				const parsed =
					typeof fabricJson === 'string' ? JSON.parse(fabricJson) : { ...fabricJson };
				if (Array.isArray(parsed.objects)) {
					parsed.objects = parsed.objects.filter((o: any) => !o[ZONE_LABEL_KEY]);
					fabricJson = JSON.stringify(parsed);
				}
			} catch {
				// keep original fabric JSON
			}

			// ----------------------------------------
			// GENERATE HTML
			// ----------------------------------------

			const generateTemplateHtml = (
				zones: any[],
				templateWidth: number,
				templateHeight: number,
			) => {
				const html = zones
					.map((zone) => {
						const queueUuids: string[] = (zone.queue_uuids ?? []).slice(0, 1);
						const queueName: string = (zone.queue_names ?? [])[0] ?? '';
						const themeSlug =
							typeof zone.theme_id === 'string' && zone.theme_id.trim()
								? zone.theme_id.trim()
								: '';
						const themeAttr = themeSlug
							? ` data-theme-id="${escapeHtml(themeSlug)}"`
							: '';
						const chips = queueName
							? `<span class="queue-zone-queue-chip" style="display:inline-block;margin:2px 4px 2px 0;padding:3px 8px;background:rgba(0,0,0,0.45);border-radius:4px;color:#fff;font-size:13px;line-height:1.2;font-family:system-ui,sans-serif;">${escapeHtml(queueName)}</span>`
							: '';

						return `
	<div
		class="queue-zone"
		data-queue-ids="${queueUuids.join(',')}"
		data-zone-name="${escapeHtml(zone.name ?? '')}"${themeAttr}
		style="
			position:absolute;
			left:${zone.left}px;
			top:${zone.top}px;
			width:${zone.width}px;
			height:${zone.height}px;
			border:${zone.border ? `1px solid ${zone.borderColor}` : 'none'};
			border-radius:${zone.borderRadius}px;
			z-index:${zone.zIndex};
			box-sizing:border-box;
			overflow:hidden;
		"
	>
		<div
			class="queue-zone-bg"
			style="position:absolute;inset:0;background:${zone.backgroundColor};opacity:${zone.zone_opacity ?? 1};border-radius:${zone.borderRadius}px;pointer-events:none;z-index:0;"
		></div>
		<div class="queue-zone-queues" style="position:absolute;inset:0;padding:8px;display:flex;flex-wrap:wrap;align-items:center;justify-content:center;align-content:center;gap:2px;pointer-events:none;overflow:hidden;z-index:1;">
			${chips}
		</div>
	</div>`;
					})
					.join('\n');

				return `
	<div
		class="template-container"
		style="
			position:relative;
			width:${templateWidth}px;
			height:${templateHeight}px;
			background:white;
			overflow:hidden;
		"
	>
	${html}
	</div>
	`;
			};

			const htmlContent = generateTemplateHtml(zones, templateWidth, templateHeight);

			// ----------------------------------------
			// GENERATE THUMBNAIL
			// Theme zones render via HTML overlays — paint real colors on Fabric
			// rects briefly so the list thumbnail matches saved html_content.
			// ----------------------------------------

			const png = captureTemplateThumbnailFromFabric(fc, zoneRects, zones);

			const blob = await (await fetch(png)).blob();

			// ----------------------------------------
			// CREATE FORM DATA
			// ----------------------------------------

			const formData = new FormData();

			formData.append(
				'html_content',
				htmlContent,
			);

			const existingConfig = parseTemplateConfiguration(templateDetails.configuration);

			formData.append(
				'configuration',
				JSON.stringify({
					...existingConfig,
					fabric_json: fabricJson,
					zones,
				}),
			);

			formData.append(
				'thumbnail',
				blob,
				`template-${templateDetails.id}.png`,
			);

			// ----------------------------------------
			// API CALL
			// ----------------------------------------

			// New templates: POST creates the record; first "Save" (and later saves) use PATCH.
			await templatesApi.saveContent(templateDetails.id, formData);

			// ----------------------------------------
			// SUCCESS
			// ----------------------------------------

			navigate('/templates');

		} catch (error) {
			console.error(error);

			alert('Save failed. Please try again.');
		} finally {
			setSaving(false);
		}
	}, [
		templateDetails,
		scalingFactor,
		navigate,
		queuesById,
		queuesByUuidMulti,
		queuesByName,
	]);

	// ─── Stepper widget ───────────────────────────────────────────────────────

	const Stepper = ({ label, value, propKey }: { label: string; value: number; propKey: keyof ZoneProps }) => (
		<div className='tdc-stepper-group'>
			<span className='tdc-stepper-label'>{label}</span>
			<div className='tdc-stepper'>
				<button className='tdc-step-btn' onClick={() => nudge(propKey, -1)}>−</button>
				<span className='tdc-step-val'>{value}</span>
				<button className='tdc-step-btn' onClick={() => nudge(propKey, 1)}>+</button>
			</div>
		</div>
	);

	// ─── Render ───────────────────────────────────────────────────────────────

	if (loading) {
		return (
			<div className='tdc-backdrop'>
				<div className='tdc-loading'>
					<Spinner size='3rem' />
					<p>Loading template…</p>
				</div>
			</div>
		);
	}

	const isPortrait = templateDetails?.orientation === 'portrait';

	return (
		<div className='tdc-backdrop'>
			{/* Small-screen warning */}
			<div className='tdc-small-screen-warning'>
				<h4>Please use a higher-resolution device to view the template editor.</h4>
			</div>

			{/* Main editor shell */}
			<div className='tdc-main-container'>

				{/* ── Toolbar ── */}
				<div className='tdc-toolbar'>
					<button className='tdc-back-btn' onClick={() => navigate('/templates')}>
						<Icon icon='ArrowBack' size='sm' />
						Back
					</button>

					<div className='tdc-toolbar-center'>
						<div className='tdc-toolbar-title'>
							{templateDetails?.template_name || 'Template Creator'}
						</div>
						{templateDetails && (
							<div className='tdc-toolbar-subtitle'>
								{templateDetails.orientation}&nbsp;·&nbsp;
								{templateDetails.resolution_width}&nbsp;×&nbsp;
								{templateDetails.resolution_height}
							</div>
						)}
					</div>

					{canWrite && (
						<div className='tdc-toolbar-actions'>
							<Button color='light' size='sm' icon='AddBox' onClick={addZone}>
								Add Zone
							</Button>
							<Button
								color='primary'
								size='sm'
								icon='Save'
								onClick={saveTemplate}
								isDisable={saving}>
								{saving ? <><Spinner size='sm' isSmall /> Saving…</> : 'Save Template'}
							</Button>
						</div>
					)}
				</div>

				{/* ── Canvas stage + properties panel ── */}
				<div className={`tdc-body${canWrite ? '' : ' tdc-body--readonly'}`}>

					{/* Canvas area */}
					<div className='tdc-canvas-area'>
						<PreviewTvFrame
							className='tdc-tv-frame'
							monitorWidth={canvasWidth + 18}
							monitorHeight={canvasHeight + 35}
							screenWidth={canvasWidth}
							screenHeight={canvasHeight}
							portrait={isPortrait}
							flicker>
							<div
								className='tdc-canvas-wrap'
								style={{ width: canvasWidth, height: canvasHeight }}>
								<canvas id='tpl-detail-canvas' ref={canvasRef} />
								<TemplateZoneThemeOverlays
									zones={canvasObjects}
									queuesById={queuesById}
									revision={overlayRevision}
									configuration={templateDetails?.configuration ?? null}
									htmlContent={templateDetails?.html_content ?? null}
								/>
							</div>
						</PreviewTvFrame>
					</div>

					{canWrite && (
						<aside className='tdc-panel'>
							<div className='tdc-panel-header'>
								<span className='tdc-panel-title'>Zone Properties</span>
								{selectedObject && (
									<span className='tdc-panel-sub'>
										{zoneProps.containerName || 'Unnamed Zone'}
									</span>
								)}
							</div>

							{selectedObject ? (
								<div className='tdc-props-scroll'>

									{/* Zone name */}
									<div className='tdc-prop-section'>
										<div className='tdc-prop-section-label'>Zone Name</div>
										<input
											className={`tdc-prop-input${nameError && !zoneProps.containerName?.trim() ? ' tdc-prop-input--error' : ''}`}
											placeholder='Enter zone name…'
											value={zoneProps.containerName}
											onChange={(e) => {
												setNameError(false);
												const name = e.target.value;
												setZoneProps((s) => ({ ...s, containerName: name }));
												selectedObject.set({ name });
											}}
										/>
										{nameError && !zoneProps.containerName?.trim() && (
											<div className='tdc-name-error'>Zone name is required</div>
										)}
									</div>

									{/* Dimensions */}
									<div className='tdc-prop-section'>
										<div className='tdc-prop-section-label'>Dimensions</div>
										<div className='tdc-prop-row2'>
											<Stepper label='Width (px)' value={zoneProps.width} propKey='width' />
											<Stepper label='Height (px)' value={zoneProps.height} propKey='height' />
										</div>
									</div>

									{/* Position */}
									<div className='tdc-prop-section'>
										<div className='tdc-prop-section-label'>Position</div>
										<div className='tdc-prop-row2'>
											<Stepper label='Left / X' value={zoneProps.left} propKey='left' />
											<Stepper label='Top / Y' value={zoneProps.top} propKey='top' />
										</div>
									</div>

									{/* Appearance */}
									<div className='tdc-prop-section'>
										<div className='tdc-prop-section-label'>Appearance</div>
										<ZoneDisplayThemePicker
											value={zoneAppearance}
											onChange={applyZoneAppearance}
											showThemeError={themeError}
											previewQueueName={
												zoneProps.queueIds[0] != null
													? (queuesById.get(zoneProps.queueIds[0])?.name ??
														`Queue #${zoneProps.queueIds[0]}`)
													: zoneProps.containerName || 'Queue'
											}
											previewSubtitle=''
											previewTokenDisplay='05'
											previewStatus='waiting'
										/>

										<div className='tdc-appearance-zone-controls'>
											<div className='tdc-appearance-zone-controls__block'>
												<span className='zone-appearance-picker__label'>Queue</span>
												{queuesLoadError ? (
													<p className='tdc-zone-queue-access-denied' role='alert'>
														{queuesLoadError}
													</p>
												) : (
													<>
														<select
															className='tdc-prop-input'
															value={zoneProps.queueIds[0] ?? ''}
															disabled={queuesLoading}
															onChange={(e) => handleZoneQueueChange(e.target.value)}>
															<option value=''>
																{queuesLoading
																	? 'Loading queues…'
																	: 'Select queue for this zone…'}
															</option>
															{queues.map((queue) => (
																<option key={queue.id} value={queue.id}>
																	{queue.name}
																</option>
															))}
														</select>
														<p className='tdc-zone-queue-hint'>
															{zoneProps.queueIds.length > 0
																? `Assigned: ${queuesById.get(zoneProps.queueIds[0])?.name ?? `Queue #${zoneProps.queueIds[0]}`}. Choose another option to replace it.`
																: 'One queue per zone. Select a queue from the list above.'}
														</p>
													</>
												)}
												{queuesLoadError && zoneProps.queueIds.length > 0 && (
													<p className='tdc-zone-queue-hint'>
														{`This zone already has queue #${zoneProps.queueIds[0]} assigned. You cannot change it without queue list access.`}
													</p>
												)}
											</div>

											<div className='tdc-appearance-zone-controls__block'>
												<span className='zone-appearance-picker__label'>Zone Opacity</span>
												<label
													className='tdc-template-opacity-label'
													htmlFor='zone-opacity-slider'>
													{zoneProps.opacity}%
												</label>
												<input
													id='zone-opacity-slider'
													type='range'
													min={0}
													max={100}
													step={1}
													value={zoneProps.opacity}
													className='form-range tdc-template-opacity-range'
													onChange={(e) => {
														const val = Number(e.target.value);
														setZoneProps((s) => ({ ...s, opacity: val }));
														if (selectedObject) {
															const fraction = val / 100;
															// Store zone opacity without touching Fabric's own
															// opacity (which would reduce text/borders too).
															selectedObject.set({ zoneOpacity: val });
															// For fill-mode zones: encode opacity into the
															// fill colour's alpha channel only.
															if (!selectedObject.displayTheme) {
																const base =
																	selectedObject.zoneFillColor ||
																	selectedObject.fill ||
																	'#ffffff';
																selectedObject.set({
																	fill: applyColorAlpha(base, fraction),
																});
															}
															fabricRef.current?.requestRenderAll?.();
															fabricRef.current?.renderAll();
															bumpOverlayRevision();
														}
													}}
												/>
											</div>
										</div>

										<div className='tdc-stepper-group' style={{ marginTop: '0.6rem' }}>
											<span className='tdc-stepper-label'>Border Radius</span>
											<div className='tdc-stepper'>
												<button className='tdc-step-btn' onClick={() => nudge('radius', -1)}>−</button>
												<span className='tdc-step-val'>{zoneProps.radius}</span>
												<button className='tdc-step-btn' onClick={() => nudge('radius', 1)}>+</button>
											</div>
										</div>
									</div>

									{/* Layer order */}
									{canvasObjects.length > 1 && (
										<div className='tdc-prop-section'>
											<div className='tdc-prop-section-label'>Layer Order</div>
											<div className='tdc-layer-btns'>
												<button
													className='tdc-layer-btn'
													type='button'
													title='Forward (Shift+Click: To Front)'
													onClick={handleForwardLayer}>
													<Icon icon='ArrowUpward' size='sm' /> Forward
												</button>
												<button
													className='tdc-layer-btn'
													type='button'
													title='Backward (Shift+Click: To Back)'
													onClick={handleBackwardLayer}>
													<Icon icon='ArrowDownward' size='sm' /> Backward
												</button>
											</div>
										</div>
									)}
								</div>
							) : (
								<div className='tdc-empty'>
									<div className='tdc-empty-icon'>
										{canvasObjects.length === 0 ? '⊞' : '↖'}
									</div>
									<div className='tdc-empty-title'>
										{canvasObjects.length === 0 ? 'No zones yet' : 'Select a zone'}
									</div>
									<div className='tdc-empty-desc'>
										{canvasObjects.length === 0
											? canWrite
												? 'Click "Add Zone" in the toolbar to start building.'
												: 'This template has no zones.'
											: canWrite
												? 'Click a zone on the canvas to edit its properties.'
												: 'You have read-only access to this template.'}
									</div>
								</div>
							)}

							<div className='tdc-dim-note'>
								<p>* All dimensions are in pixels</p>
								{canvasObjects.length === 0 && (
									<p>* Add at least one zone before saving</p>
								)}
							</div>
						</aside>
					)}
				</div>
			</div>
		</div>
	);
};

export default TemplateDetailWorkspace;
