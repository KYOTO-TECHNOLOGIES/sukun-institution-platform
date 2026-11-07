import React, { useEffect, useMemo, useRef, useState } from 'react';
import Modal, { ModalBody, ModalFooter, ModalHeader, ModalTitle } from '../../bootstrap/Modal';
import Button from '../../bootstrap/Button';
import Spinner from '../../bootstrap/Spinner';
import ReactSelectWithState from '../../CustomComponent/Select/ReactSelect';
import useToasterNotification from '../../../hooks/useToasterNotification';
import type { Queue } from '../../../services/queueManagementApi';
import { queuesApi } from '../../../services/queueManagementApi';

interface QueueGroupFormModalProps {
	isOpen: boolean;
	setIsOpen: (status: boolean) => void;
	mode?: 'add' | 'edit';
	editGroupId?: number | null;
	onSaved?: () => void | Promise<void>;
}

type QueueSelectOption = { value: number; label: string };

const syncQueueMembership = async (
	groupId: number,
	previousIds: number[],
	selectedIds: number[],
) => {
	const toAdd = selectedIds.filter((id) => !previousIds.includes(id));
	const toRemove = previousIds.filter((id) => !selectedIds.includes(id));
	await Promise.all([
		...toAdd.map((queueId) => queuesApi.update(queueId, { group: groupId })),
		...toRemove.map((queueId) => queuesApi.update(queueId, { group: null })),
	]);
};

const QueueGroupFormModal: React.FC<QueueGroupFormModalProps> = ({
	isOpen,
	setIsOpen,
	mode = 'add',
	editGroupId = null,
	onSaved,
}) => {
	const isEditMode = mode === 'edit' && editGroupId != null && !Number.isNaN(editGroupId);
	const [name, setName] = useState('');
	const [description, setDescription] = useState('');
	const [selectedQueueIds, setSelectedQueueIds] = useState<number[]>([]);
	const [initialQueueIds, setInitialQueueIds] = useState<number[]>([]);
	const [queues, setQueues] = useState<Queue[]>([]);
	const [loadingQueues, setLoadingQueues] = useState(false);
	const [loadingGroup, setLoadingGroup] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const { showErrorNotification, showSuccessNotification } = useToasterNotification();
	const showErrorNotificationRef = useRef(showErrorNotification);
	const setIsOpenRef = useRef(setIsOpen);
	showErrorNotificationRef.current = showErrorNotification;
	setIsOpenRef.current = setIsOpen;

	useEffect(() => {
		if (!isOpen) {
			setName('');
			setDescription('');
			setSelectedQueueIds([]);
			setInitialQueueIds([]);
			setQueues([]);
			setLoadingGroup(false);
		}
	}, [isOpen]);

	useEffect(() => {
		let cancelled = false;

		if (!isOpen) {
			setLoadingQueues(false);
			return;
		}

		setLoadingQueues(true);
		void queuesApi
			.list()
			.then((res) => {
				if (!cancelled) setQueues(res.results || []);
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

	useEffect(() => {
		let cancelled = false;

		if (!isOpen || !isEditMode) {
			setLoadingGroup(false);
			return;
		}

		setLoadingGroup(true);
		void queuesApi
			.getGroup(editGroupId as number)
			.then((group) => {
				if (cancelled) return;
				setName(group.name || '');
				setDescription(group.description || '');
				const memberIds = (group.queues || []).map((q) => q.id);
				setSelectedQueueIds(memberIds);
				setInitialQueueIds(memberIds);
			})
			.catch((err) => {
				if (!cancelled) {
					showErrorNotificationRef.current(err);
					setIsOpenRef.current(false);
				}
			})
			.finally(() => {
				if (!cancelled) setLoadingGroup(false);
			});

		return () => {
			cancelled = true;
		};
	}, [isOpen, isEditMode, editGroupId]);

	const queueOptions = useMemo<QueueSelectOption[]>(
		() =>
			queues.map((queue) => ({
				value: queue.id,
				label: queue.name || `Queue ${queue.id}`,
			})),
		[queues],
	);

	const selectedQueueOptions = useMemo(
		() => queueOptions.filter((option) => selectedQueueIds.includes(option.value)),
		[queueOptions, selectedQueueIds],
	);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const trimmedName = name.trim();
		if (!trimmedName) return;

		setSubmitting(true);
		try {
			if (isEditMode) {
				await queuesApi.updateGroup(editGroupId as number, {
					name: trimmedName,
					description: description.trim() || undefined,
				});
				await syncQueueMembership(editGroupId as number, initialQueueIds, selectedQueueIds);
				showSuccessNotification('Queue group updated successfully.');
			} else {
				const created = await queuesApi.createGroup({
					name: trimmedName,
					description: description.trim() || undefined,
				});
				await syncQueueMembership(created.id, [], selectedQueueIds);
				showSuccessNotification('Queue group created successfully.');
			}
			setIsOpen(false);
			await onSaved?.();
		} catch (err) {
			showErrorNotification(err);
		} finally {
			setSubmitting(false);
		}
	};

	const formReady = !isEditMode || !loadingGroup;
	const modalTitle = isEditMode ? 'Edit Group' : 'Add Group';
	const submitLabel = isEditMode ? 'Update Group' : 'Create Group';
	const submittingLabel = isEditMode ? 'Updating...' : 'Creating...';

	return (
		<Modal isOpen={isOpen} setIsOpen={setIsOpen} isCentered size='lg' isAnimation={false}>
			<ModalHeader setIsOpen={setIsOpen}>
				<ModalTitle id='queue-group-form-modal'>{modalTitle}</ModalTitle>
			</ModalHeader>
			<form onSubmit={handleSubmit}>
				<ModalBody>
					{isEditMode && loadingGroup ? (
						<div className='d-flex flex-column align-items-center justify-content-center py-5 gap-2 text-muted'>
							<Spinner color='primary' />
							<span>Loading group…</span>
						</div>
					) : (
						<div className='row g-3'>
							<div className='col-12'>
								<label className='form-label fw-semibold' htmlFor='queue-group-name'>
									Group Name
								</label>
								<input
									id='queue-group-name'
									className='form-control'
									value={name}
									onChange={(e) => setName(e.target.value)}
									placeholder='Enter group name'
									required
									autoFocus
									disabled={!formReady}
								/>
							</div>
							<div className='col-12'>
								<label className='form-label fw-semibold' htmlFor='queue-group-description'>
									Description
								</label>
								<textarea
									id='queue-group-description'
									className='form-control'
									rows={3}
									value={description}
									onChange={(e) => setDescription(e.target.value)}
									placeholder='Short description'
									disabled={!formReady}
								/>
							</div>
							<div className='col-12'>
								<label className='form-label fw-semibold'>Queues</label>
								{loadingQueues ? (
									<div className='text-muted small py-2'>Loading queues…</div>
								) : (
									<ReactSelectWithState
										options={queueOptions}
										value={selectedQueueOptions}
										setValue={(selected: QueueSelectOption[] | null) =>
											setSelectedQueueIds((selected || []).map((option) => option.value))
										}
										isMulti
										placeholder='Select queues to add to this group'
									/>
								)}
							</div>
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
						isDisable={submitting || !name.trim() || (isEditMode && !formReady)}>
						{submitting ? (
							<>
								<Spinner isSmall inButton />
								{submittingLabel}
							</>
						) : (
							submitLabel
						)}
					</Button>
				</ModalFooter>
			</form>
		</Modal>
	);
};

export default QueueGroupFormModal;
