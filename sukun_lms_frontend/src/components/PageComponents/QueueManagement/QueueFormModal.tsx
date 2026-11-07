import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Tooltip } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import Modal, { ModalBody, ModalFooter, ModalHeader, ModalTitle } from '../../bootstrap/Modal';
import Button from '../../bootstrap/Button';
import Spinner from '../../bootstrap/Spinner';
import ReactSelectWithState from '../../CustomComponent/Select/ReactSelect';
import useToasterNotification from '../../../hooks/useToasterNotification';
import type {
	CreateQueuePayload,
	Queue,
	ServingPoint,
	UpdateQueuePayload,
} from '../../../services/queueManagementApi';
import { queuesApi } from '../../../services/queueManagementApi';

interface QueueFormModalProps {
	isOpen: boolean;
	setIsOpen: (status: boolean) => void;
	mode?: 'add' | 'edit';
	/** When `mode` is `edit`, the modal loads the queue with `queuesApi.get(editQueueId)` before showing the form. */
	editQueueId?: number | null;
	onSaved?: () => void | Promise<void>;
}

interface QueueFormState {
	name: string;
	description: string;
	limit: string;
	grace_period_minutes: string;
	allow_postpone: boolean;
	is_reporting_enabled: boolean;
	token_prefix: string;
	serving_point_ids: number[];
	next_queue_ids: number[];
}

const defaultFormState = (): QueueFormState => ({
	name: '',
	description: '',
	limit: '50',
	grace_period_minutes: '15',
	allow_postpone: true,
	is_reporting_enabled: false,
	token_prefix: '',
	serving_point_ids: [],
	next_queue_ids: [],
});

const extractNextQueueIds = (nextQueues?: Queue[] | number[]): number[] => {
	if (!nextQueues?.length) return [];
	if (typeof nextQueues[0] === 'number') return nextQueues as number[];
	return (nextQueues as Queue[]).map((queue) => queue.id);
};

const queueToFormState = (q: Queue): QueueFormState => ({
	name: q.name || '',
	description: q.description || '',
	limit: String(q.limit ?? 50),
	grace_period_minutes: String(q.grace_period_minutes ?? 15),
	allow_postpone: q.allow_postpone ?? true,
	is_reporting_enabled: q.is_reporting_enabled ?? false,
	token_prefix: q.token_prefix || '',
	serving_point_ids: (q.serving_points || []).map((point) => point.id),
	next_queue_ids: extractNextQueueIds(q.next_queues),
});

const QueueFormModal: React.FC<QueueFormModalProps> = ({
	isOpen,
	setIsOpen,
	mode = 'add',
	editQueueId = null,
	onSaved,
}) => {
	const isEditMode = mode === 'edit' && editQueueId != null && !Number.isNaN(editQueueId);
	const [submitting, setSubmitting] = useState(false);
	const [loadingEditQueue, setLoadingEditQueue] = useState(false);
	const [loadedEditQueue, setLoadedEditQueue] = useState<Queue | null>(null);
	const [servingPoints, setServingPoints] = useState<ServingPoint[]>([]);
	const [loadingServingPoints, setLoadingServingPoints] = useState(false);
	const [allQueues, setAllQueues] = useState<Queue[]>([]);
	const [loadingQueues, setLoadingQueues] = useState(false);
	const [form, setForm] = useState<QueueFormState>(defaultFormState);
	const { showErrorNotification, showSuccessNotification, showNotification } = useToasterNotification();

	const setIsOpenRef = useRef(setIsOpen);
	const showErrorNotificationRef = useRef(showErrorNotification);
	setIsOpenRef.current = setIsOpen;
	showErrorNotificationRef.current = showErrorNotification;

	const canSubmitEdit = isEditMode && loadedEditQueue != null && !loadingEditQueue;
	const isUpdateSubmit = isEditMode && loadedEditQueue != null;

	useEffect(() => {
		let cancelled = false;

		if (!isOpen) {
			setLoadedEditQueue(null);
			setLoadingEditQueue(false);
			return;
		}

		if (!isEditMode) {
			setLoadedEditQueue(null);
			setLoadingEditQueue(false);
			setForm(defaultFormState());
			return;
		}

		setLoadingEditQueue(true);
		setLoadedEditQueue(null);

		void queuesApi
			.get(editQueueId as number)
			.then((q) => {
				if (cancelled) return;
				setLoadedEditQueue(q);
				setForm(queueToFormState(q));
			})
			.catch((err) => {
				if (!cancelled) {
					showErrorNotificationRef.current(err);
					setIsOpenRef.current(false);
				}
			})
			.finally(() => {
				if (!cancelled) setLoadingEditQueue(false);
			});

		return () => {
			cancelled = true;
		};
	}, [isOpen, isEditMode, editQueueId]);

	useEffect(() => {
		let cancelled = false;

		if (!isOpen || isEditMode) {
			setServingPoints([]);
			setLoadingServingPoints(false);
			return;
		}

		setLoadingServingPoints(true);
		void queuesApi.servingPoints()
			.then((res) => {
				if (!cancelled) setServingPoints(res.results || []);
			})
			.catch((err) => {
				if (!cancelled) showErrorNotificationRef.current(err);
			})
			.finally(() => {
				if (!cancelled) setLoadingServingPoints(false);
			});

		return () => {
			cancelled = true;
		};
	}, [isOpen, isEditMode]);

	useEffect(() => {
		let cancelled = false;

		if (!isOpen) {
			setAllQueues([]);
			setLoadingQueues(false);
			return;
		}

		setLoadingQueues(true);
		void queuesApi
			.list()
			.then((res) => {
				if (!cancelled) setAllQueues(res.results || []);
			})
			.catch((err) => {
				if (!cancelled) showErrorNotificationRef.current(err);
			})
			.finally(() => {
				if (!cancelled) setLoadingQueues(false);
			});

		return () => {
			cancelled = true;
		};
	}, [isOpen]);

	const servingPointOptions = useMemo(
		() =>
			servingPoints.map((point) => ({
				value: point.id,
				label: point.name,
			})),
		[servingPoints],
	);

	const selectedServingPointOptions = useMemo(
		() => servingPointOptions.filter((option) => form.serving_point_ids.includes(option.value)),
		[form.serving_point_ids, servingPointOptions],
	);

	const queueOptions = useMemo(() => {
		const excludeId = isEditMode && editQueueId != null ? editQueueId : null;
		return allQueues
			.filter((queue) => excludeId == null || queue.id !== excludeId)
			.map((queue) => ({
				value: queue.id,
				label: queue.name,
			}));
	}, [allQueues, isEditMode, editQueueId]);

	const selectedNextQueueOptions = useMemo(
		() => queueOptions.filter((option) => form.next_queue_ids.includes(option.value)),
		[form.next_queue_ids, queueOptions],
	);

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!form.name.trim()) {
			showNotification('Error', 'Queue name is required.', 'danger');
			return;
		}

		const graceRaw = form.grace_period_minutes.trim();
		if (graceRaw === '') {
			showNotification('Error', 'Grace period (minutes) is required.', 'danger');
			return;
		}
		const graceMinutes = Number(graceRaw);
		if (!Number.isInteger(graceMinutes) || graceMinutes < 0) {
			showNotification('Error', 'Grace period must be a whole number of 0 or greater.', 'danger');
			return;
		}

		setSubmitting(true);
		try {
			if (isUpdateSubmit) {
				const updatePayload: UpdateQueuePayload = {
					name: form.name.trim(),
					description: form.description.trim() || undefined,
					limit: Number(form.limit || 0) || 0,
					grace_period_minutes: graceMinutes,
					allow_postpone: form.allow_postpone,
					is_reporting_enabled: form.is_reporting_enabled,
					token_prefix: form.token_prefix.trim() || undefined,
					next_queues: form.next_queue_ids,
				};
				await queuesApi.update(loadedEditQueue!.id, updatePayload);
				showSuccessNotification('Queue updated successfully.');
			} else {
				const payload: CreateQueuePayload = {
					name: form.name.trim(),
					description: form.description.trim() || undefined,
					limit: Number(form.limit || 0) || 0,
					grace_period_minutes: graceMinutes,
					allow_postpone: form.allow_postpone,
					is_reporting_enabled: form.is_reporting_enabled,
					token_prefix: form.token_prefix.trim() || undefined,
					serving_points: form.serving_point_ids,
					next_queues: form.next_queue_ids,
				};
				await queuesApi.create(payload);
				showSuccessNotification('Queue created successfully.');
			}
			setIsOpen(false);
			await onSaved?.();
		} catch (err) {
			showErrorNotification(err);
		} finally {
			setSubmitting(false);
		}
	};

	const formReady = !isEditMode || !loadingEditQueue;

	return (
		<Modal isOpen={isOpen} setIsOpen={setIsOpen} isCentered size='lg' isAnimation={false}>
			<ModalHeader setIsOpen={setIsOpen}>
				<ModalTitle id='queue-form-modal'>{isEditMode ? 'Edit Queue' : 'Add Queue'}</ModalTitle>
			</ModalHeader>
			<form onSubmit={handleSubmit}>
				<ModalBody>
					{isEditMode && loadingEditQueue ? (
						<div className='d-flex flex-column align-items-center justify-content-center py-5 gap-2 text-muted'>
							<Spinner color='primary' />
							<span>Loading queue…</span>
						</div>
					) : (
						<div className='row g-3'>
							<div className='col-12'>
								<label className='form-label fw-semibold' htmlFor='queue-name'>
									Queue Name
								</label>
								<input
									id='queue-name'
									className='form-control'
									value={form.name}
									onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
									placeholder='Enter queue name'
									required
									disabled={!formReady}
								/>
							</div>
							<div className='col-12'>
								<label className='form-label fw-semibold' htmlFor='queue-description'>
									Description
								</label>
								<textarea
									id='queue-description'
									className='form-control'
									rows={3}
									value={form.description}
									onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
									placeholder='Short description'
									disabled={!formReady}
								/>
							</div>
							<div className='col-md-6'>
								<label className='form-label fw-semibold d-flex align-items-center gap-1' htmlFor='queue-token-prefix'>
									Token Prefix
									<Tooltip
										arrow
										placement='top'
										title='A short text prepended to every token number generated for this queue (e.g. "A" produces tokens A001, A002, …). Leave blank to use plain numbers.'>
										<InfoOutlinedIcon style={{ fontSize: 16, color: '#6c757d', cursor: 'default' }} />
									</Tooltip>
								</label>
								<input
									id='queue-token-prefix'
									className='form-control'
									value={form.token_prefix}
									onChange={(e) => setForm((prev) => ({ ...prev, token_prefix: e.target.value }))}
									placeholder='e.g. A'
									maxLength={10}
									disabled={!formReady}
								/>
							</div>
							<div className='col-md-6'>
								<label className='form-label fw-semibold' htmlFor='queue-limit'>
									Token Limit
								</label>
								<input
									id='queue-limit'
									type='number'
									min={1}
									className='form-control'
									value={form.limit}
									onChange={(e) => setForm((prev) => ({ ...prev, limit: e.target.value }))}
									disabled={!formReady}
								/>
							</div>
							<div className='col-md-6'>
								<label className='form-label fw-semibold' htmlFor='queue-grace-period-minutes'>
									Grace period (minutes)
								</label>
								<input
									id='queue-grace-period-minutes'
									type='number'
									min={0}
									step={1}
									className='form-control'
									value={form.grace_period_minutes}
									onChange={(e) =>
										setForm((prev) => ({ ...prev, grace_period_minutes: e.target.value }))
									}
									placeholder='e.g. 15'
									disabled={!formReady}
								/>
							</div>
							<div className='col-md-6 d-flex align-items-end'>
								<div className='form-check form-switch mb-2'>
									<input
										className='form-check-input'
										type='checkbox'
										id='queue-allow-postpone'
										checked={form.allow_postpone}
										onChange={(e) =>
											setForm((prev) => ({ ...prev, allow_postpone: e.target.checked }))
										}
										disabled={!formReady}
									/>
									<label className='form-check-label fw-semibold' htmlFor='queue-allow-postpone'>
										Allow Postpone
									</label>
								</div>
							</div>
							<div className='col-md-6 d-flex align-items-end'>
								<div className='form-check form-switch mb-2'>
									<input
										className='form-check-input'
										type='checkbox'
										id='queue-is-reporting-enabled'
										checked={form.is_reporting_enabled}
										onChange={(e) =>
											setForm((prev) => ({ ...prev, is_reporting_enabled: e.target.checked }))
										}
										disabled={!formReady}
									/>
									<label className='form-check-label fw-semibold' htmlFor='queue-is-reporting-enabled'>
										Reporting Enabled
									</label>
								</div>
							</div>
							<div className='col-12'>
								<label className='form-label fw-semibold'>Next queue</label>
								{loadingQueues ? (
									<div className='text-muted small py-2'>Loading queues…</div>
								) : (
									<ReactSelectWithState
										options={queueOptions}
										value={selectedNextQueueOptions}
										setValue={(selected: Array<{ value: number; label: string }> | null) =>
											setForm((prev) => ({
												...prev,
												next_queue_ids: (selected || []).map((option) => option.value),
											}))
										}
										isMulti
										placeholder='Select next queues'
									/>
								)}
							</div>
							{!isEditMode && (
								<div className='col-12'>
									<label className='form-label fw-semibold'>Serving Points</label>
									{loadingServingPoints ? (
										<div className='text-muted small py-2'>Loading serving points…</div>
									) : (
										<ReactSelectWithState
											options={servingPointOptions}
											value={selectedServingPointOptions}
											setValue={(selected: Array<{ value: number; label: string }> | null) =>
												setForm((prev) => ({
													...prev,
													serving_point_ids: (selected || []).map((option) => option.value),
												}))
											}
											isMulti
											placeholder='Select serving points'
										/>
									)}
								</div>
							)}
						</div>
					)}
				</ModalBody>
				<ModalFooter>
					<Button color='secondary' isLight onClick={() => setIsOpen(false)}>
						Cancel
					</Button>
					<Button
						color='primary'
						type='submit'
						isDisable={submitting || (isEditMode && !canSubmitEdit)}>
						{submitting ? (
							<>
								<Spinner isSmall inButton />
								{isUpdateSubmit ? 'Updating...' : 'Creating...'}
							</>
						) : isUpdateSubmit ? (
							'Update Queue'
						) : (
							'Create Queue'
						)}
					</Button>
				</ModalFooter>
			</form>
		</Modal>
	);
};

export default QueueFormModal;
