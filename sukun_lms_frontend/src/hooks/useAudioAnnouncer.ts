import { useCallback, useEffect, useRef, useState } from 'react';
import type { PublicQueueStatus } from '../services/publicScreenApi';

interface TrackedQueueState {
	tokenDisplay: string;
	servingPointName: string;
	textToSpeech: string;
}

function getQueueTokenDisplay(queue: PublicQueueStatus): string {
	return (
		queue.token_display?.trim() ||
		queue.current_token?.token_display?.trim() ||
		''
	);
}

function getQueueServingPoint(queue: PublicQueueStatus): string {
	return queue.serving_point_name?.trim() || '';
}

/** Announcement phrase from API when token + serving point are present. */
function getQueueAnnouncementText(queue: PublicQueueStatus): string | null {
	const tokenDisplay = getQueueTokenDisplay(queue);
	const servingPointName = getQueueServingPoint(queue);
	if (!tokenDisplay || !servingPointName) return null;

	const textToSpeech = queue.text_to_speech?.trim();
	if (textToSpeech) return textToSpeech;

	return `Token number: ${tokenDisplay}, Serving point: ${servingPointName}`;
}

function trackQueueState(queue: PublicQueueStatus): TrackedQueueState {
	const tokenDisplay = getQueueTokenDisplay(queue);
	const servingPointName = getQueueServingPoint(queue);
	return {
		tokenDisplay,
		servingPointName,
		textToSpeech: queue.text_to_speech?.trim() || '',
	};
}

const MAX_ANNOUNCEMENT_BACKLOG = 10;
const ANNOUNCEMENT_DEDUPE_MS = 15_000;
const ANNOUNCEMENT_GAP_MS = 300;

export type AudioConsentStatus = 'pending' | 'allowed' | 'declined';

export interface UseAudioAnnouncerResult {
	speechSupported: boolean;
	isUnlocked: boolean;
	showConsent: boolean;
	allowAudio: () => void;
	declineAudio: () => void;
}

function consentStorageKey(screenUuid: string) {
	return `screen_audio_consent_${screenUuid}`;
}

function readConsentStatus(screenUuid: string): AudioConsentStatus {
	if (typeof window === 'undefined' || !screenUuid) return 'pending';
	const value = sessionStorage.getItem(consentStorageKey(screenUuid));
	if (value === 'allowed' || value === 'declined') return value;
	return 'pending';
}

function writeConsentStatus(screenUuid: string, status: Exclude<AudioConsentStatus, 'pending'>) {
	sessionStorage.setItem(consentStorageKey(screenUuid), status);
}

function isSpeechSupported() {
	return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/**
 * Hospital-style token announcer using the browser Web Speech API.
 *
 * Chrome requires a user gesture before speech works. Call `allowAudio()` from
 * the consent overlay click handler to unlock and prime the engine.
 */
export function useAudioAnnouncer(
	queuesByUuid: Record<string, PublicQueueStatus>,
	enableAudio: boolean,
	screenUuid = '',
): UseAudioAnnouncerResult {
	const prevRef = useRef<Record<string, TrackedQueueState>>({});
	const initializedRef = useRef(false);
	const unlockedRef = useRef(false);
	const primedRef = useRef(false);
	const announcementQueueRef = useRef<string[]>([]);
	const isSpeakingRef = useRef(false);
	const lastQueuedAtRef = useRef<Record<string, number>>({});
	const processQueueRef = useRef<() => void>(() => {});

	const speechSupported = isSpeechSupported();
	const [consentStatus, setConsentStatus] = useState<AudioConsentStatus>(() =>
		readConsentStatus(screenUuid),
	);
	const [isUnlocked, setIsUnlocked] = useState(false);

	const speakUtterance = (text: string, onDone: () => void) => {
		window.speechSynthesis.resume();
		const voices = window.speechSynthesis.getVoices();
		const utterance = new SpeechSynthesisUtterance(text);
		utterance.rate = 0.9;
		utterance.pitch = 1.0;
		utterance.volume = 1.0;
		if (voices.length > 0) {
			utterance.voice = voices.find((v) => v.lang.startsWith('en')) ?? voices[0];
		}
		utterance.onend = onDone;
		utterance.onerror = onDone;
		window.speechSynthesis.speak(utterance);
	};

	processQueueRef.current = () => {
		if (!speechSupported) return;
		if (!unlockedRef.current) return;
		if (isSpeakingRef.current) return;
		if (document.visibilityState !== 'visible') return;
		const nextText = announcementQueueRef.current.shift();
		if (!nextText) return;

		isSpeakingRef.current = true;
		const finish = () => {
			isSpeakingRef.current = false;
			window.setTimeout(() => processQueueRef.current(), ANNOUNCEMENT_GAP_MS);
		};
		speakUtterance(nextText, finish);
	};

	const processQueue = () => processQueueRef.current();

	const enqueueAnnouncement = (key: string, text: string) => {
		const now = Date.now();
		const lastQueuedAt = lastQueuedAtRef.current[key] ?? 0;
		if (now - lastQueuedAt < ANNOUNCEMENT_DEDUPE_MS) return;
		lastQueuedAtRef.current[key] = now;

		const queue = announcementQueueRef.current;
		if (queue.length >= MAX_ANNOUNCEMENT_BACKLOG) queue.shift();
		queue.push(text);
		processQueue();
	};

	const unlockAudio = useCallback(
		(fromUserGesture = false) => {
			if (!speechSupported || unlockedRef.current) return;

			const markUnlocked = () => {
				if (unlockedRef.current) return;
				unlockedRef.current = true;
				setIsUnlocked(true);
				processQueue();
			};

			window.speechSynthesis.cancel();
			window.speechSynthesis.resume();

			if (fromUserGesture) {
				primedRef.current = true;
				const prime = new SpeechSynthesisUtterance('\u200b');
				prime.volume = 0.01;
				prime.onend = markUnlocked;
				prime.onerror = markUnlocked;
				window.speechSynthesis.speak(prime);
				return;
			}

			// Same-tab refresh: only hide overlay if Chrome actually starts speech.
			const prime = new SpeechSynthesisUtterance('\u200b');
			prime.volume = 0.01;
			prime.onstart = markUnlocked;
			prime.onend = () => {
				if (!unlockedRef.current) markUnlocked();
			};
			prime.onerror = () => {
				// Keep overlay visible; user must click Allow again.
			};
			window.speechSynthesis.speak(prime);
		},
		[speechSupported],
	);

	const allowAudio = useCallback(() => {
		if (!screenUuid) return;
		writeConsentStatus(screenUuid, 'allowed');
		setConsentStatus('allowed');
		unlockAudio(true);
	}, [screenUuid, unlockAudio]);

	const declineAudio = useCallback(() => {
		if (!screenUuid) return;
		writeConsentStatus(screenUuid, 'declined');
		setConsentStatus('declined');
	}, [screenUuid]);

	useEffect(() => {
		setConsentStatus(readConsentStatus(screenUuid));
		unlockedRef.current = false;
		primedRef.current = false;
		setIsUnlocked(false);
		initializedRef.current = false;
		prevRef.current = {};
		announcementQueueRef.current = [];
	}, [screenUuid]);

	useEffect(() => {
		if (!enableAudio || !speechSupported) return;

		const loadVoices = () => window.speechSynthesis.getVoices();
		loadVoices();
		window.speechSynthesis.addEventListener('voiceschanged', loadVoices);

		const onVisibility = () => {
			if (document.visibilityState === 'visible') processQueue();
		};
		document.addEventListener('visibilitychange', onVisibility);

		return () => {
			window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
			document.removeEventListener('visibilitychange', onVisibility);
		};
	}, [enableAudio, speechSupported]);

	useEffect(() => {
		if (!enableAudio || !speechSupported) return;
		if (consentStatus !== 'allowed') return;
		// Best-effort unlock after refresh in the same tab session.
		unlockAudio(false);
	}, [consentStatus, enableAudio, speechSupported, unlockAudio]);

	useEffect(() => {
		if (!enableAudio) return;
		if (!speechSupported) return;

		if (!initializedRef.current) {
			const baseline: Record<string, TrackedQueueState> = {};
			for (const [uuid, queue] of Object.entries(queuesByUuid)) {
				baseline[uuid] = trackQueueState(queue);
			}
			prevRef.current = baseline;
			initializedRef.current = true;
			return;
		}

		const prev = prevRef.current;
		const textsToSpeak: string[] = [];

		for (const [uuid, queue] of Object.entries(queuesByUuid)) {
			const nextState = trackQueueState(queue);
			const announcementText = getQueueAnnouncementText(queue);

			if (!announcementText) {
				prev[uuid] = nextState;
				continue;
			}

			const prevState = prev[uuid];
			const tokenChanged = !prevState || prevState.tokenDisplay !== nextState.tokenDisplay;
			const pointChanged =
				!prevState || prevState.servingPointName !== nextState.servingPointName;
			const speechChanged =
				!prevState || prevState.textToSpeech !== nextState.textToSpeech;

			if (tokenChanged || pointChanged || speechChanged) {
				textsToSpeak.push(announcementText);
			}

			prev[uuid] = nextState;
		}

		prevRef.current = { ...prev };

		for (const text of textsToSpeak) {
			enqueueAnnouncement(text, text);
		}
	}, [queuesByUuid, enableAudio, speechSupported]);

	const showConsent =
		enableAudio &&
		speechSupported &&
		consentStatus !== 'declined' &&
		!isUnlocked;

	return {
		speechSupported,
		isUnlocked,
		showConsent,
		allowAudio,
		declineAudio,
	};
}
