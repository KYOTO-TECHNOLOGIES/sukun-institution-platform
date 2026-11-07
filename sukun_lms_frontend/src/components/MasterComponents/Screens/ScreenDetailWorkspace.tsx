import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Card, { CardActions, CardBody, CardHeader, CardLabel, CardTitle } from '../../bootstrap/Card';
import Button from '../../bootstrap/Button';
import { screensApi, type Screen } from '../../../services/screensManagementApi';
import ScreenTvPreview from './ScreenTvPreview';
import ScreenDetailPanel from './ScreenDetailPanel';
import ScreenAssignTemplateModal from './ScreenAssignTemplateModal';
import ScreenEditTemplateModal from './ScreenEditTemplateModal';
import useToasterNotification from '../../../hooks/useToasterNotification';
import {
	screenTemplatesApi,
	type ScreenTemplateAssignment,
	type UpdateScreenTemplatePayload,
} from '../../../services/screenTemplatesApi';
import { templatesApi, type Template } from '../../../services/templatesApi';
import { swalFire } from '../../../helpers/swalHelper';
import usePermissions from '../../../hooks/usePermissions';

const ScreenDetailWorkspace: React.FC = () => {
	const navigate = useNavigate();
	const { id } = useParams();
	const screenId = Number(id);
	const { showErrorNotification, showSuccessNotification } = useToasterNotification();
	const showErrorNotificationRef = useRef(showErrorNotification);
	showErrorNotificationRef.current = showErrorNotification;

	const [screen, setScreen] = useState<Screen | null>(null);
	const [loading, setLoading] = useState(false);
	const [loadFailed, setLoadFailed] = useState(false);
	const [actionLoadingKey, setActionLoadingKey] = useState<string | null>(null);
	const [showAssignTemplateModal, setShowAssignTemplateModal] = useState(false);
	const [editingAssignment, setEditingAssignment] = useState<ScreenTemplateAssignment | null>(null);
	const [templateById, setTemplateById] = useState<Record<number, Template>>({});
	const [linkCopied, setLinkCopied] = useState(false);
	const { can } = usePermissions();
	const canWrite = can('screens_write');

	const getScreenPublicUrl = (uuid: string) =>
		`${window.location.origin}/screenstokenstatus/${uuid}`;

	const handleCopyScreenLink = async (uuid: string) => {
		const url = getScreenPublicUrl(uuid);
		try {
			await navigator.clipboard.writeText(url);
		} catch {
			const el = document.createElement('textarea');
			el.value = url;
			document.body.appendChild(el);
			el.select();
			document.execCommand('copy');
			document.body.removeChild(el);
		}
		setLinkCopied(true);
		setTimeout(() => setLinkCopied(false), 2500);
	};

	const loadScreen = useCallback(async () => {
		if (!Number.isFinite(screenId)) return;
		setLoading(true);
		setLoadFailed(false);
		try {
			const response = await screensApi.get(screenId);
			setScreen(response);
		} catch (error) {
			setScreen(null);
			setLoadFailed(true);
			showErrorNotificationRef.current(error);
		} finally {
			setLoading(false);
		}
	}, [screenId]);

	useEffect(() => {
		loadScreen();
	}, [loadScreen]);

	useEffect(() => {
		let cancelled = false;
		templatesApi
			.list({ limit: 200 })
			.then((res) => {
				if (cancelled) return;
				const map: Record<number, Template> = {};
				for (const item of res.results ?? []) {
					map[item.id] = item;
				}
				setTemplateById(map);
			})
			.catch(() => {
				if (!cancelled) setTemplateById({});
			});
		return () => {
			cancelled = true;
		};
	}, []);

	const runAction = async (key: string, action: () => Promise<unknown>) => {
		if (!screen) return;
		setActionLoadingKey(key);
		try {
			await action();
			await loadScreen();
		} catch (error) {
			showErrorNotification(error);
		} finally {
			setActionLoadingKey(null);
		}
	};

	const handleActivateToggle = (target: Screen) => {
		const key = `screen-active-${target.id}`;
		const apiAction = () =>
			target.is_active ? screensApi.deactivate(target.id) : screensApi.activate(target.id);
		runAction(key, apiAction);
	};

	const handleAudioToggle = (target: Screen) => {
		const key = `screen-audio-${target.id}`;
		runAction(key, () => screensApi.toggleAudio(target.id, !Boolean(target.enable_audio)));
	};

	const handleHeartbeat = (target: Screen) => {
		const key = `screen-heartbeat-${target.id}`;
		runAction(key, () => screensApi.heartbeat(target.id));
	};

	const handleAssignTemplate = async (payload: Parameters<typeof screenTemplatesApi.create>[0]) => {
		try {
			await screenTemplatesApi.create(payload);
			await loadScreen();
		} catch (error) {
			showErrorNotification(error);
			throw error;
		}
	};

	const handleRemoveTemplate = (assignmentId: number) => {
		const key = `screen-template-remove-${assignmentId}`;
		runAction(key, () => screenTemplatesApi.remove(assignmentId));
	};

	const handleEditTemplate = async (
		assignmentId: number,
		payload: UpdateScreenTemplatePayload,
	) => {
		const key = `screen-template-edit-${assignmentId}`;
		setActionLoadingKey(key);
		try {
			await screenTemplatesApi.patch(assignmentId, payload);
			setEditingAssignment(null);
			await loadScreen();
		} catch (error) {
			showErrorNotification(error);
			throw error;
		} finally {
			setActionLoadingKey(null);
		}
	};

	const handleDeleteScreen = async () => {
		if (!screen) return;
		const result = await swalFire({
			title: 'Delete screen?',
			text: `Delete "${screen.name}"? This cannot be undone.`,
			icon: 'warning',
			showCancelButton: true,
			confirmButtonText: 'Delete',
			cancelButtonText: 'Cancel',
			reverseButtons: true,
		});
		if (!result.isConfirmed) return;

		setActionLoadingKey(`screen-delete-${screen.id}`);
		try {
			await screensApi.remove(screen.id);
			showSuccessNotification('Screen deleted successfully.');
			navigate('/screens');
		} catch (error) {
			showErrorNotification(error);
		} finally {
			setActionLoadingKey(null);
		}
	};

	const editingTemplate = editingAssignment
		? templateById[
				typeof editingAssignment.template === 'object'
					? editingAssignment.template.id
					: editingAssignment.template
			]
		: null;

	const nextTemplateOrder =
		(screen?.screen_templates?.length ?? 0) > 0
			? Math.max(...(screen?.screen_templates ?? []).map((item) => item.order)) + 1
			: 1;

	return (
		<>
			<ScreenAssignTemplateModal
				isOpen={showAssignTemplateModal}
				screenId={screenId}
				defaultOrder={nextTemplateOrder}
				onClose={() => setShowAssignTemplateModal(false)}
				onSubmit={handleAssignTemplate}
			/>
			<ScreenEditTemplateModal
				isOpen={editingAssignment !== null}
				assignment={editingAssignment}
				template={editingTemplate}
				onClose={() => setEditingAssignment(null)}
				onSubmit={handleEditTemplate}
			/>
		<Card stretch className='screens-workspace-card'>
			<CardHeader>
				<CardLabel icon='SmartScreen'>
					<CardTitle tag='h4'>Screen Detail</CardTitle>
				</CardLabel>
				<CardActions>
					<Button color='light' icon='ArrowBack' onClick={() => navigate('/screens')}>
						Back to Screens
					</Button>
					{screen?.uuid && (
						<>
							<Button
								color='info'
								isLight
								icon='Link'
								onClick={() => {
									window.open(
										getScreenPublicUrl(screen.uuid),
										'_blank',
										'noopener,noreferrer',
									);
								}}>
								Link
							</Button>
							<Button
								color={linkCopied ? 'success' : 'info'}
								isLight
								icon={linkCopied ? 'Check' : 'ContentCopy'}
								onClick={() => void handleCopyScreenLink(screen.uuid)}>
								{linkCopied ? 'Copied!' : ''}
							</Button>
						</>
					)}
					{screen && canWrite && (
						<Button
							color='danger'
							icon='Delete'
							isDisable={actionLoadingKey === `screen-delete-${screen.id}`}
							onClick={handleDeleteScreen}>
							Delete Screen
						</Button>
					)}
				</CardActions>
			</CardHeader>
			<CardBody className='screens-body'>
		
				{loading ? (
					<div className='text-center text-muted py-5'>Loading screen detail...</div>
				) : loadFailed ? (
					<div className='text-center py-5'>
						<p className='text-muted mb-3'>Could not load screen details.</p>
						<Button color='primary' icon='Refresh' onClick={() => void loadScreen()}>
							Retry
						</Button>
					</div>
				) : (
					<div className='screens-layout-detail-only'>
						<ScreenTvPreview screen={screen} templateById={templateById} />
						<ScreenDetailPanel
							screen={screen}
							templateById={templateById}
							actionLoadingKey={actionLoadingKey}
							onActivateToggle={handleActivateToggle}
							onAudioToggle={handleAudioToggle}
							onHeartbeat={handleHeartbeat}
							onAssignTemplate={() => setShowAssignTemplateModal(true)}
							onEditTemplate={setEditingAssignment}
							onRemoveTemplate={handleRemoveTemplate}
						/>
					</div>
				)}
			</CardBody>
		</Card>
		</>
	);
};

export default ScreenDetailWorkspace;

