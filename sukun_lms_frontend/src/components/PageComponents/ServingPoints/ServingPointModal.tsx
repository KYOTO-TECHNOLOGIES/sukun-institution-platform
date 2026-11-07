import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Modal, { ModalBody, ModalFooter, ModalHeader, ModalTitle } from '../../bootstrap/Modal';
import Button from '../../bootstrap/Button';
import Spinner from '../../bootstrap/Spinner';
import ReactSelectWithState from '../../CustomComponent/Select/ReactSelect';
import useToasterNotification from '../../../hooks/useToasterNotification';
import {
	type CreateServingPointPayload,
	type Queue,
	type ServingPoint,
	type User,
	queuesApi,
	usersApi,
} from '../../../services/queueManagementApi';
import {
	servingPointAssignedUserIds,
	servingPointQueueIds,
} from '../../MasterComponents/QueueManagement/queueManagementUtils';

function servingPointUserLabel(user: User): string {
	const name = [user.first_name, user.last_name].filter(Boolean).join(' ').trim();
	return name || user.email || user.username || `User ${user.id}`;
}

export interface ServingPointFormValues {
	name: string;
	queue_ids: number[];
	description: string;
	is_active: boolean;
	assigned_users: number[];
}

export const emptyServingPointForm = (defaultQueueId?: number | null): ServingPointFormValues => ({
	name: '',
	queue_ids:
		defaultQueueId != null && !Number.isNaN(defaultQueueId) && defaultQueueId > 0
			? [defaultQueueId]
			: [],
	description: '',
	is_active: true,
	assigned_users: [],
});

export const servingPointToFormValues = (point: ServingPoint): ServingPointFormValues => ({
	name: point.name || '',
	queue_ids: servingPointQueueIds(point),
	description: point.description || '',
	is_active: Boolean(point.is_active ?? true),
	assigned_users: servingPointAssignedUserIds(point),
});

export interface ServingPointModalProps {
	isOpen: boolean;
	setIsOpen: (open: boolean) => void;
	mode?: 'add' | 'edit';
	/** When editing, pass the row to pre-fill the form. */
	servingPoint?: ServingPoint | null;
	/** Pre-select queue on add (e.g. `?queueId=` on list page). */
	defaultQueueId?: number | null;
	onSuccess?: (point: ServingPoint, mode: 'add' | 'edit') => void;
}

const ServingPointModal: React.FC<ServingPointModalProps> = ({
	isOpen,
	setIsOpen,
	mode = 'add',
	servingPoint = null,
	defaultQueueId = null,
	onSuccess,
}) => {
	const isEdit = mode === 'edit';
	const editId = isEdit ? servingPoint?.id : null;

	const [form, setForm] = useState<ServingPointFormValues>(() => emptyServingPointForm(defaultQueueId));
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [optionsLoading, setOptionsLoading] = useState(false);
	const [queues, setQueues] = useState<Queue[]>([]);
	const [users, setUsers] = useState<User[]>([]);

	const { showErrorNotification, showSuccessNotification, showNotification } = useToasterNotification();
	const errorNotifierRef = useRef(showErrorNotification);
	useEffect(() => {
		errorNotifierRef.current = showErrorNotification;
	}, [showErrorNotification]);

	const loadOptions = useCallback(async () => {
		setOptionsLoading(true);
		try {
			const [queuesRes, usersRes] = await Promise.all([
				queuesApi.list(),
				usersApi.list(),
			]);
			setQueues(queuesRes.results || []);
			setUsers(usersRes.results || []);
		} catch (err) {
			errorNotifierRef.current(err);
		} finally {
			setOptionsLoading(false);
		}
	}, []);

	useEffect(() => {
		if (!isOpen) return;
		void loadOptions();
		if (isEdit && servingPoint) {
			setForm(servingPointToFormValues(servingPoint));
		} else {
			setForm(emptyServingPointForm(defaultQueueId));
		}
	}, [isOpen, isEdit, servingPoint, defaultQueueId, loadOptions]);

	useEffect(() => {
		if (!isOpen || users.length === 0) return;
		const allowedIds = new Set(users.map((u) => u.id));
		setForm((prev) => ({
			...prev,
			assigned_users: prev.assigned_users.filter((id) => allowedIds.has(id)),
		}));
	}, [isOpen, users]);

	const queueOptions = useMemo(
		() => queues.map((q) => ({ value: q.id, label: q.name })),
		[queues],
	);

	const userOptions = useMemo(
		() =>
			users.map((user) => ({
				value: user.id,
				label: servingPointUserLabel(user),
			})),
		[users],
	);

	const selectedQueueOptions = useMemo(
		() => queueOptions.filter((o) => form.queue_ids.includes(o.value)),
		[form.queue_ids, queueOptions],
	);

	const selectedUserOptions = useMemo(
		() => userOptions.filter((o) => form.assigned_users.includes(o.value)),
		[form.assigned_users, userOptions],
	);

	const handleClose = useCallback(() => {
		setIsOpen(false);
	}, [setIsOpen]);

	const handleSubmit = async () => {
		if (!form.name.trim()) {
			showNotification('Error', 'Serving point name is required.', 'danger');
			return;
		}
		if (isEdit && !editId) {
			showErrorNotification('Serving point could not be identified for update.');
			return;
		}

		setIsSubmitting(true);
		try {
			if (isEdit && editId) {
				const updated = await queuesApi.updateServingPoint(editId, {
					name: form.name.trim(),
					queue: form.queue_ids,
					description: form.description.trim() || undefined,
					is_active: form.is_active,
					assigned_users: form.assigned_users,
				});
				showSuccessNotification('Serving point updated successfully.');
				onSuccess?.(updated, 'edit');
			} else {
				const payload: CreateServingPointPayload = {
					name: form.name.trim(),
					queue: form.queue_ids,
					description: form.description.trim() || undefined,
					is_active: form.is_active,
					assigned_users: form.assigned_users,
				};
				const created = await queuesApi.createServingPoint(payload);
				showSuccessNotification('Serving point created successfully.');
				onSuccess?.(created, 'add');
			}
			handleClose();
		} catch (err) {
			showErrorNotification(err);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={setIsOpen} isCentered size='lg' isAnimation={false}>
			<ModalHeader setIsOpen={setIsOpen}>
				<ModalTitle id='serving-point-modal-title'>
					{isEdit ? 'Edit Serving Point' : 'Add Serving Point'}
				</ModalTitle>
			</ModalHeader>
			<form
				onSubmit={(event) => {
					event.preventDefault();
					void handleSubmit();
				}}>
				<ModalBody>
					{optionsLoading && queues.length === 0 ? (
						<div className='text-muted small py-2'>Loading form options…</div>
					) : null}
					<div className='row g-3'>
						<div className='col-12'>
							<label className='form-label fw-semibold' htmlFor='sp-name'>
								Name
							</label>
							<input
								id='sp-name'
								className='form-control'
								value={form.name}
								onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
								placeholder='Enter serving point name'
								required
								disabled={isSubmitting}
							/>
						</div>
						<div className='col-md-6'>
							<label className='form-label fw-semibold'>Queues</label>
							<ReactSelectWithState
								options={queueOptions}
								value={selectedQueueOptions}
								setValue={(selected: Array<{ value: number; label: string }> | null) =>
									setForm((prev) => ({
										...prev,
										queue_ids: (selected || []).map((option) => option.value),
									}))
								}
								isMulti
								placeholder='Select one or more queues'
							/>
						</div>
						<div className='col-md-6 d-flex align-items-end'>
							<div className='form-check form-switch mb-2'>
								<input
									className='form-check-input'
									type='checkbox'
									id='sp-active'
									checked={form.is_active}
									disabled={isSubmitting}
									onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
								/>
								<label className='form-check-label fw-semibold' htmlFor='sp-active'>
									Active
								</label>
							</div>
						</div>
						<div className='col-12'>
							<label className='form-label fw-semibold'>Assigned Users</label>
							<ReactSelectWithState
								options={userOptions}
								value={selectedUserOptions}
								setValue={(selected: Array<{ value: number; label: string }> | null) =>
									setForm((prev) => ({
										...prev,
										assigned_users: (selected || []).map((option) => option.value),
									}))
								}
								isMulti
								placeholder='Select users'
							/>
						</div>
						<div className='col-12'>
							<label className='form-label fw-semibold' htmlFor='sp-description'>
								Description
							</label>
							<textarea
								id='sp-description'
								className='form-control'
								rows={3}
								value={form.description}
								disabled={isSubmitting}
								onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
								placeholder='Short description'
							/>
						</div>
					</div>
				</ModalBody>
				<ModalFooter>
					<Button color='secondary' isLight type='button' isDisable={isSubmitting} onClick={handleClose}>
						Cancel
					</Button>
					<Button color='primary' type='submit' isDisable={isSubmitting || optionsLoading}>
						{isSubmitting ? (
							<>
								<Spinner isSmall inButton />
								{isEdit ? 'Updating...' : 'Creating...'}
							</>
						) : isEdit ? (
							'Update Serving Point'
						) : (
							'Create Serving Point'
						)}
					</Button>
				</ModalFooter>
			</form>
		</Modal>
	);
};

export default ServingPointModal;
