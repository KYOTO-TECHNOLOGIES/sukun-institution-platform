import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import Cookies from 'js-cookie';
import ScreenPublicDisplay from '../../components/PublicPages/ScreenPublicDisplay';
import ScreenAudioConsentOverlay from '../../components/PublicPages/ScreenAudioConsentOverlay';
import {
	buildQueuesByUuidMap,
	pickPublicScreenTemplateForCycle,
	publicScreenApi,
	type PublicQueueStatus,
	type PublicScreenInfo,
	type PublicScreenTemplate,
	type RecentQueueToken,
} from '../../services/publicScreenApi';
import { collectQueueUuidsFromTemplate } from '../../utils/parseTemplateZones';
import { useAudioAnnouncer } from '../../hooks/useAudioAnnouncer';

const CYCLE_COOKIE_PREFIX = 'screen_display_start_';
const LMS_POLL_MS = 5000;
const TICK_MS = 1_000;

function cycleCookieKey(screenUuid: string) {
	return `${CYCLE_COOKIE_PREFIX}${screenUuid}`;
}

function getOrCreateCycleStart(screenUuid: string): number {
	const key = cycleCookieKey(screenUuid);
	const existing = Cookies.get(key);
	if (existing) {
		const parsed = Number(existing);
		if (Number.isFinite(parsed) && parsed > 0) return parsed;
	}
	const now = Date.now();
	Cookies.set(key, String(now), { expires: 365 });
	return now;
}

const MAX_HISTORY = 30;

const ScreenTokenStatusPage: React.FC = () => {
	const { uuid: screenUuid = '' } = useParams<{ uuid: string }>();

	const [screen, setScreen] = useState<PublicScreenInfo | null>(null);
	const [templates, setTemplates] = useState<PublicScreenTemplate[]>([]);
	const [queuesByUuid, setQueuesByUuid] = useState<Record<string, PublicQueueStatus>>({});
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [nowMs, setNowMs] = useState(Date.now());
	const [cycleStartMs, setCycleStartMs] = useState<number | null>(null);
	/** Recently-called tokens keyed by queue UUID (max 15 per queue). */
	const [recentByQueue, setRecentByQueue] = useState<Record<string, RecentQueueToken[]>>({});
	// Tracks the last-known token per queue UUID to detect changes between polls.
	const prevQueuesRef = useRef<Record<string, PublicQueueStatus>>({});

	const { showConsent, allowAudio, declineAudio } = useAudioAnnouncer(
		queuesByUuid,
		screen?.enable_audio === true,
		screenUuid,
	);

	// Already sorted by assignment order when loaded from publicScreenApi.getScreen.
	const activeTemplate = useMemo(() => {
		if (!cycleStartMs || !templates.length) return null;
		return pickPublicScreenTemplateForCycle(templates, cycleStartMs, nowMs);
	}, [cycleStartMs, templates, nowMs]);

	const allQueueUuids = useMemo(() => {
		const seen = new Set<string>();
		const uuids: string[] = [];
		templates.forEach((template) => {
			collectQueueUuidsFromTemplate(template).forEach((uuid) => {
				if (seen.has(uuid)) return;
				seen.add(uuid);
				uuids.push(uuid);
			});
		});
		return uuids;
	}, [templates]);

	const activeTemplateQueueUuids = useMemo(() => {
		if (!activeTemplate) return [];
		return collectQueueUuidsFromTemplate(activeTemplate);
	}, [activeTemplate]);

	const fetchQueueStatus = useCallback(async (queueUuids: string[]) => {
		if (!screenUuid || !queueUuids.length) {
			if (!queueUuids.length) setQueuesByUuid({});
			return;
		}
		try {
			const response = await publicScreenApi.getQueueStatus(screenUuid, queueUuids);
			const newQueues = buildQueuesByUuidMap(response.queues ?? []);
			setQueuesByUuid(newQueues);

			// Detect per-queue transitions: current_token changed since last poll.
			const prev = prevQueuesRef.current;
			const addedByQueue: Record<string, RecentQueueToken> = {};

			for (const [uuid, queue] of Object.entries(newQueues)) {
				const prevQueue = prev[uuid];
				if (!prevQueue) continue;
				const prevToken = prevQueue.current_token;
				const nextToken = queue.current_token;
				if (
					prevToken?.token_display &&
					(!nextToken || prevToken.token_display !== nextToken.token_display)
				) {
					addedByQueue[uuid] = {
						token_display: prevToken.token_display,
						serving_point_name: prevQueue.serving_point_name,
						queue_name: prevQueue.queue_name || prevQueue.name,
						called_at: new Date().toISOString(),
					};
				}
			}
			prevQueuesRef.current = newQueues;

			// Also absorb per-queue recent_tokens the API may return.
			for (const queue of response.queues ?? []) {
				if (queue.uuid && queue.recent_tokens?.length) {
					addedByQueue[queue.uuid] ??= queue.recent_tokens[0];
				}
			}

			if (Object.keys(addedByQueue).length) {
				setRecentByQueue((existing) => {
					const next = { ...existing };
					for (const [uuid, entry] of Object.entries(addedByQueue)) {
						const list = next[uuid] ?? [];
						const alreadyIn = list.some((t) => t.token_display === entry.token_display);
						if (!alreadyIn) next[uuid] = [entry, ...list].slice(0, MAX_HISTORY);
					}
					return next;
				});
			}
		} catch {
			// Keep last known queue data on transient failures.
		}
	}, [screenUuid]);

	const loadScreen = useCallback(async () => {
		if (!screenUuid) {
			setError('Missing screen identifier in URL.');
			setLoading(false);
			return;
		}

		setLoading(true);
		setError(null);
		try {
			const response = await publicScreenApi.getScreen(screenUuid);
			setScreen(response.screen);
			setTemplates(response.templates);
			setCycleStartMs(getOrCreateCycleStart(screenUuid));

			const queueUuids = response.templates.flatMap((t) => collectQueueUuidsFromTemplate(t));
			const uniqueQueueUuids = Array.from(new Set(queueUuids));
			await fetchQueueStatus(uniqueQueueUuids);
		} catch (err: unknown) {
			const typed = err as { response?: { data?: { detail?: string } }; message?: string };
			setError(
				typed.response?.data?.detail || typed.message || 'Failed to load screen display.',
			);
		} finally {
			setLoading(false);
		}
	}, [screenUuid, fetchQueueStatus]);

	useEffect(() => {
		void loadScreen();
	}, [loadScreen]);

	useEffect(() => {
		const tick = window.setInterval(() => setNowMs(Date.now()), TICK_MS);
		return () => window.clearInterval(tick);
	}, []);

	useEffect(() => {
		if (!allQueueUuids.length) return undefined;
		const poll = window.setInterval(() => {
			void fetchQueueStatus(allQueueUuids);
		}, LMS_POLL_MS);
		return () => window.clearInterval(poll);
	}, [allQueueUuids, fetchQueueStatus]);

	useEffect(() => {
		if (!activeTemplateQueueUuids.length) return;
		void fetchQueueStatus(activeTemplateQueueUuids);
	}, [activeTemplateQueueUuids, fetchQueueStatus]);

	return (
		<div className='screen-public-page screen-public-page--fullscreen'>
			{loading && (
				<div className='screen-public-page-message'>Loading screen display…</div>
			)}

			{!loading && error && (
				<div className='screen-public-page-message screen-public-page-message--error'>
					{error}
				</div>
			)}

			{!loading && !error && screen && (
				<ScreenPublicDisplay
					screen={screen}
					template={activeTemplate}
					queuesByUuid={queuesByUuid}
					recentByQueue={recentByQueue}
				/>
			)}

			{!loading && !error && screen?.enable_audio && showConsent && (
				<ScreenAudioConsentOverlay
					screenName={screen.name}
					onAllow={allowAudio}
					onDecline={declineAudio}
				/>
			)}
		</div>
	);
};

export default ScreenTokenStatusPage;
