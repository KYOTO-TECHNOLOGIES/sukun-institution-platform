import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { Tooltip } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import Button from '../../bootstrap/Button';
import Modal, { ModalBody, ModalFooter, ModalHeader, ModalTitle } from '../../bootstrap/Modal';
import Spinner from '../../bootstrap/Spinner';
import type { QueueSchedule } from '../../../services/queueManagementApi';
import { schedulesApi } from '../../../services/queueManagementApi';
import useToasterNotification from '../../../hooks/useToasterNotification';

export function toDateTimeLocalValue(value: Date) {
	return dayjs(value).format('YYYY-MM-DDTHH:mm');
}

function minEndAfterStartLocal(startLocal: string): string | undefined {
	const trimmed = startLocal?.trim();
	if (!trimmed) return undefined;
	const d = new Date(trimmed);
	if (Number.isNaN(d.getTime())) return undefined;
	return toDateTimeLocalValue(dayjs(d).add(1, 'minute').toDate());
}

/** Schedules that cannot change dates/tokens/description from the schedule form. */
export function isScheduleMetadataEditable(status?: string) {
	const s = (status || '').toLowerCase();
	return s !== 'completed' && s !== 'cancelled' && s !== 'canceled';
}

export interface ScheduleFormState {
	description: string;
	start: string;
	end: string;
	token_from: string;
	token_to: string;
	token_limit: string;
	/** Edit only — shown and PATCHed when `mode === 'edit'`; create uses the queue default. */
	token_prefix: string;
	is_reporting_enabled: boolean;
	allow_postpone: boolean;
}

function queueScheduleRowToForm(rec: QueueSchedule): ScheduleFormState {
	const start = rec.from_datetime ? new Date(rec.from_datetime) : new Date();
	const end = rec.to_datetime ? new Date(rec.to_datetime) : dayjs(start).add(1, 'hour').toDate();
	return {
		description: rec.description ?? '',
		start: toDateTimeLocalValue(start),
		end: toDateTimeLocalValue(end),
		token_from: rec.token_from != null ? String(rec.token_from) : '',
		token_to: rec.token_to != null ? String(rec.token_to) : '',
		token_limit: rec.limit != null ? String(rec.limit) : '',
		token_prefix:
			rec.token_prefix != null && String(rec.token_prefix).trim() !== ''
				? String(rec.token_prefix).trim()
				: '',
		is_reporting_enabled: rec.is_reporting_enabled ?? true,
		allow_postpone: rec.allow_postpone ?? true,
	};
}

function defaultCreateForm(): ScheduleFormState {
	return {
		description: '',
		start: toDateTimeLocalValue(new Date()),
		end: toDateTimeLocalValue(dayjs().add(1, 'hour').toDate()),
		token_from: '1',
		token_to: '100',
		token_limit: '100',
		token_prefix: '',
		is_reporting_enabled: true,
		allow_postpone: true,
	};
}

export interface ScheduleFormModalProps {
	isOpen: boolean;
	setIsOpen: (open: boolean) => void;
	mode: 'create' | 'edit';
	queueId?: number | null;
	scheduleId?: number | null;
	editingSchedule?: QueueSchedule | null;
	initialStart?: string;
	initialEnd?: string;
	onSaved?: () => void | Promise<void>;
}

const ScheduleFormModal: React.FC<ScheduleFormModalProps> = ({
	isOpen,
	setIsOpen,
	mode,
	queueId,
	scheduleId,
	editingSchedule,
	initialStart,
	initialEnd,
	onSaved,
}) => {
	const isEditMode = mode === 'edit';

	const [savingSchedule, setSavingSchedule] = useState(false);
	const [scheduleForm, setScheduleForm] = useState<ScheduleFormState>(() => defaultCreateForm());
	const { showErrorNotification, showSuccessNotification } = useToasterNotification();

	const endDateTimeMin = useMemo(() => minEndAfterStartLocal(scheduleForm.start), [scheduleForm.start]);

	useEffect(() => {
		if (!isOpen) return;
		if (isEditMode && editingSchedule) {
			setScheduleForm(queueScheduleRowToForm(editingSchedule));
			return;
		}
		const base = defaultCreateForm();
		setScheduleForm({
			...base,
			...(initialStart ? { start: initialStart } : {}),
			...(initialEnd ? { end: initialEnd } : {}),
		});
	}, [isOpen, isEditMode, editingSchedule, initialStart, initialEnd]);

	const closeModal = () => {
		setIsOpen(false);
	};

	const handleScheduleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		const startDate = new Date(scheduleForm.start);
		const endDate = new Date(scheduleForm.end);
		if (Number.isNaN(startDate.getTime())) {
			showErrorNotification('Start date and time is required.');
			return;
		}
		if (Number.isNaN(endDate.getTime())) {
			showErrorNotification('End date and time is required.');
			return;
		}
		if (endDate <= startDate) {
			showErrorNotification('End date and time must be later than start date and time.');
			return;
		}
		if (!isEditMode && startDate.getTime() < Date.now()) {
			showErrorNotification('Start date and time cannot be in the past.');
			return;
		}

		const tokenFromNum = scheduleForm.token_from ? Number(scheduleForm.token_from) : undefined;
		const tokenToNum = scheduleForm.token_to ? Number(scheduleForm.token_to) : undefined;
		if (tokenFromNum != null && Number.isNaN(tokenFromNum)) {
			showErrorNotification('Token from must be a valid number.');
			return;
		}
		if (tokenToNum != null && Number.isNaN(tokenToNum)) {
			showErrorNotification('Token to must be a valid number.');
			return;
		}
		if (tokenFromNum != null && tokenFromNum < 1) {
			showErrorNotification('Token from must be 1 or greater.');
			return;
		}
		if (tokenToNum != null && tokenToNum < 1) {
			showErrorNotification('Token to must be 1 or greater.');
			return;
		}
		if (tokenFromNum != null && tokenToNum != null && tokenFromNum > tokenToNum) {
			showErrorNotification('Token from must be less than or equal to token to.');
			return;
		}

		const tokenLimitRaw = scheduleForm.token_limit.trim();
		const tokenLimitNum = tokenLimitRaw ? Number(tokenLimitRaw) : undefined;
		if (tokenLimitRaw && Number.isNaN(tokenLimitNum!)) {
			showErrorNotification('Token limit must be a valid number.');
			return;
		}
		if (tokenLimitNum != null && (!Number.isInteger(tokenLimitNum) || tokenLimitNum < 1)) {
			showErrorNotification('Token limit must be a whole number of 1 or greater.');
			return;
		}

		if (!isEditMode && !queueId) return;

		setSavingSchedule(true);
		try {
			if (isEditMode && scheduleId != null) {
				const tokenPrefix = scheduleForm.token_prefix.trim();
				await schedulesApi.patch(scheduleId, {
					from_datetime: startDate.toISOString(),
					to_datetime: endDate.toISOString(),
					description: scheduleForm.description.trim() || undefined,
					is_reporting_enabled: scheduleForm.is_reporting_enabled,
					allow_postpone: scheduleForm.allow_postpone,
					...(tokenPrefix ? { token_prefix: tokenPrefix } : {}),
					...(tokenFromNum != null ? { token_from: tokenFromNum } : {}),
					...(tokenToNum != null ? { token_to: tokenToNum } : {}),
					...(tokenLimitNum != null ? { limit: tokenLimitNum } : {}),
				});
			} else if (queueId) {
				await schedulesApi.create({
					queue: queueId,
					from_datetime: startDate.toISOString(),
					to_datetime: endDate.toISOString(),
					description: scheduleForm.description.trim() || undefined,
					token_from: tokenFromNum,
					token_to: tokenToNum,
					is_reporting_enabled: scheduleForm.is_reporting_enabled,
					allow_postpone: scheduleForm.allow_postpone,
					...(tokenLimitNum != null ? { limit: tokenLimitNum } : {}),
				});
			}
			showSuccessNotification(
				isEditMode ? 'Schedule updated successfully.' : 'Schedule created successfully.',
			);
			closeModal();
			await onSaved?.();
		} catch (err) {
			showErrorNotification(err);
		} finally {
			setSavingSchedule(false);
		}
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={(open) => !open && closeModal()} isCentered size='lg' isAnimation={false}>
			<ModalHeader setIsOpen={(open) => !open && closeModal()}>
				<ModalTitle id='schedule-form-modal'>{isEditMode ? 'Edit Schedule' : 'Create Schedule'}</ModalTitle>
			</ModalHeader>
			<form onSubmit={handleScheduleFormSubmit}>
				<ModalBody>
					<div className='row g-3'>
						<div className='col-md-6'>
							<label className='form-label fw-semibold' htmlFor='schedule-start'>
								Start Date & Time
							</label>
							<input
								id='schedule-start'
								type='datetime-local'
								className='form-control'
								min={isEditMode ? undefined : toDateTimeLocalValue(new Date())}
								value={scheduleForm.start}
								onChange={(e) => {
									const nextStart = e.target.value;
									setScheduleForm((prev) => {
										const ns = new Date(nextStart);
										const ne = new Date(prev.end);
										let nextEnd = prev.end;
										if (
											nextStart &&
											!Number.isNaN(ns.getTime()) &&
											prev.end &&
											!Number.isNaN(ne.getTime()) &&
											ne <= ns
										) {
											nextEnd = toDateTimeLocalValue(dayjs(ns).add(1, 'minute').toDate());
										}
										return { ...prev, start: nextStart, end: nextEnd };
									});
								}}
								required
							/>
						</div>
						<div className='col-md-6'>
							<label className='form-label fw-semibold' htmlFor='schedule-end'>
								End Date & Time
							</label>
							<input
								id='schedule-end'
								type='datetime-local'
								className='form-control'
								min={endDateTimeMin}
								value={scheduleForm.end}
								onChange={(e) => setScheduleForm((prev) => ({ ...prev, end: e.target.value }))}
								required
							/>
						</div>
						<div className='col-md-6'>
							<label className='form-label fw-semibold' htmlFor='schedule-token-from'>
								Token from
							</label>
							<input
								id='schedule-token-from'
								type='number'
								min={1}
								className='form-control'
								value={scheduleForm.token_from}
								onChange={(e) => setScheduleForm((prev) => ({ ...prev, token_from: e.target.value }))}
							/>
						</div>
						<div className='col-md-6'>
							<label className='form-label fw-semibold' htmlFor='schedule-token-to'>
								Token to
							</label>
							<input
								id='schedule-token-to'
								type='number'
								min={1}
								className='form-control'
								value={scheduleForm.token_to}
								onChange={(e) => setScheduleForm((prev) => ({ ...prev, token_to: e.target.value }))}
							/>
						</div>
						<div className='col-12 col-md-6'>
							<label className='form-label fw-semibold' htmlFor='schedule-token-limit'>
								Token limit
							</label>
							<input
								id='schedule-token-limit'
								type='number'
								min={1}
								step={1}
								className='form-control'
								value={scheduleForm.token_limit}
								onChange={(e) => setScheduleForm((prev) => ({ ...prev, token_limit: e.target.value }))}
								placeholder='Optional — maps to schedule limit'
							/>
						</div>
						{isEditMode && (
							<div className='col-12 col-md-6'>
								<label
									className='form-label fw-semibold d-flex align-items-center gap-1'
									htmlFor='schedule-token-prefix'>
									Token prefix
									<Tooltip
										arrow
										placement='top'
										title='A short text prepended to every token number generated for this queue (e.g. "A" produces tokens A001, A002, …). Leave blank to use plain numbers.'>
										<InfoOutlinedIcon style={{ fontSize: 16, color: '#6c757d', cursor: 'default' }} />
									</Tooltip>
								</label>
								<input
									id='schedule-token-prefix'
									type='text'
									className='form-control'
									value={scheduleForm.token_prefix}
									onChange={(e) =>
										setScheduleForm((prev) => ({ ...prev, token_prefix: e.target.value }))
									}
									placeholder='Optional — e.g. A'
									maxLength={10}
									autoComplete='off'
								/>
							</div>
						)}
						<div className='col-md-6'>
							<div className='form-check form-switch pt-md-4'>
								<input
									id='schedule-is-reporting-enabled'
									type='checkbox'
									className='form-check-input'
									role='switch'
									checked={scheduleForm.is_reporting_enabled}
									onChange={(e) =>
										setScheduleForm((prev) => ({
											...prev,
											is_reporting_enabled: e.target.checked,
										}))
									}
								/>
								<label className='form-check-label fw-semibold' htmlFor='schedule-is-reporting-enabled'>
									Reporting enabled
								</label>
							</div>
						</div>
						<div className='col-md-6'>
							<div className='form-check form-switch pt-md-4'>
								<input
									id='schedule-allow-postpone'
									type='checkbox'
									className='form-check-input'
									role='switch'
									checked={scheduleForm.allow_postpone}
									onChange={(e) =>
										setScheduleForm((prev) => ({ ...prev, allow_postpone: e.target.checked }))
									}
								/>
								<label className='form-check-label fw-semibold' htmlFor='schedule-allow-postpone'>
									Allow postpone
								</label>
							</div>
						</div>
						<div className='col-12'>
							<label className='form-label fw-semibold' htmlFor='schedule-description'>
								Description
							</label>
							<textarea
								id='schedule-description'
								className='form-control'
								rows={3}
								value={scheduleForm.description}
								onChange={(e) => setScheduleForm((prev) => ({ ...prev, description: e.target.value }))}
								placeholder='Optional notes for this schedule'
							/>
						</div>
					</div>
				</ModalBody>
				<ModalFooter>
					<Button color='secondary' isLight type='button' onClick={closeModal}>
						Cancel
					</Button>
					<Button color='primary' type='submit' isDisable={savingSchedule}>
						{savingSchedule ? (
							<>
								<Spinner isSmall inButton />
								Saving…
							</>
						) : isEditMode ? (
							'Save changes'
						) : (
							'Create Schedule'
						)}
					</Button>
				</ModalFooter>
			</form>
		</Modal>
	);
};

export default ScheduleFormModal;
