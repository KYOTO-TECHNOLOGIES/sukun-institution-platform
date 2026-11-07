import React, { useEffect, useMemo, useRef, useState } from 'react';
import Modal, { ModalBody, ModalFooter, ModalHeader, ModalTitle } from '../../bootstrap/Modal';
import Button from '../../bootstrap/Button';
import Spinner from '../../bootstrap/Spinner';
import ReactSelectWithState from '../../CustomComponent/Select/ReactSelect';
import useToasterNotification from '../../../hooks/useToasterNotification';
import {
	screensApi,
	type Screen,
} from '../../../services/screensManagementApi';

interface ScreenGroupFormModalProps {
	isOpen: boolean;
	setIsOpen: (status: boolean) => void;
	mode?: 'add' | 'edit';
	editGroupId?: number | null;
	onSaved?: () => void | Promise<void>;
}

type ScreenSelectOption = { value: number; label: string };

const ScreenGroupFormModal: React.FC<ScreenGroupFormModalProps> = ({
	isOpen,
	setIsOpen,
	mode = 'add',
	editGroupId = null,
	onSaved,
}) => {
	const isEditMode = mode === 'edit' && editGroupId != null && !Number.isNaN(editGroupId);
	const [name, setName] = useState('');
	const [description, setDescription] = useState('');
	const [selectedScreenIds, setSelectedScreenIds] = useState<number[]>([]);
	const [screens, setScreens] = useState<Screen[]>([]);
	const [loadingScreens, setLoadingScreens] = useState(false);
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
			setSelectedScreenIds([]);
			setScreens([]);
			setLoadingGroup(false);
		}
	}, [isOpen]);

	useEffect(() => {
		let cancelled = false;

		if (!isOpen) {
			setLoadingScreens(false);
			return;
		}

		setLoadingScreens(true);
		void screensApi
			.list({ limit: 500, offset: 0 })
			.then((res) => {
				if (!cancelled) setScreens(res.results || []);
			})
			.catch((err) => {
				if (!cancelled) showErrorNotificationRef.current(err);
			})
			.finally(() => {
				if (!cancelled) setLoadingScreens(false);
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
		void screensApi
			.getGroup(editGroupId as number)
			.then((group) => {
				if (cancelled) return;
				setName(group.name || '');
				setDescription(group.description || '');
				const memberIds = (group.screens || []).map((s) => s.id);
				setSelectedScreenIds(memberIds);
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

	const screenOptions = useMemo<ScreenSelectOption[]>(
		() =>
			screens.map((screen) => ({
				value: screen.id,
				label: screen.name || `Screen ${screen.id}`,
			})),
		[screens],
	);

	const selectedScreenOptions = useMemo(
		() => screenOptions.filter((option) => selectedScreenIds.includes(option.value)),
		[screenOptions, selectedScreenIds],
	);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const trimmedName = name.trim();
		if (!trimmedName) return;

		const payload = {
			name: trimmedName,
			description: description.trim() || undefined,
			screen_ids: selectedScreenIds,
		};

		setSubmitting(true);
		try {
			if (isEditMode) {
				await screensApi.updateGroup(editGroupId as number, payload);
				showSuccessNotification('Screen group updated successfully.');
			} else {
				await screensApi.createGroup(payload);
				showSuccessNotification('Screen group created successfully.');
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
	const modalTitle = isEditMode ? 'Edit Screen Group' : 'Add Screen Group';
	const submitLabel = isEditMode ? 'Update Group' : 'Create Group';
	const submittingLabel = isEditMode ? 'Updating...' : 'Creating...';

	return (
		<Modal isOpen={isOpen} setIsOpen={setIsOpen} isCentered size='lg' isAnimation={false}>
			<ModalHeader setIsOpen={setIsOpen}>
				<ModalTitle id='screen-group-form-modal'>{modalTitle}</ModalTitle>
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
								<label className='form-label fw-semibold' htmlFor='screen-group-name'>
									Group Name
								</label>
								<input
									id='screen-group-name'
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
								<label className='form-label fw-semibold' htmlFor='screen-group-description'>
									Description
								</label>
								<textarea
									id='screen-group-description'
									className='form-control'
									rows={3}
									value={description}
									onChange={(e) => setDescription(e.target.value)}
									placeholder='Short description'
									disabled={!formReady}
								/>
							</div>
							<div className='col-12'>
								<label className='form-label fw-semibold'>Screens</label>
								{loadingScreens ? (
									<div className='text-muted small py-2'>Loading screens…</div>
								) : (
									<ReactSelectWithState
										options={screenOptions}
										value={selectedScreenOptions}
										setValue={(selected: ScreenSelectOption[] | null) =>
											setSelectedScreenIds((selected || []).map((option) => option.value))
										}
										isMulti
										placeholder='Select screens in this group'
									/>
								)}
								{isEditMode && (
									<p className='text-muted small mb-0 mt-2'>
										Saving replaces the full screen list for this group.
									</p>
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

export default ScreenGroupFormModal;
