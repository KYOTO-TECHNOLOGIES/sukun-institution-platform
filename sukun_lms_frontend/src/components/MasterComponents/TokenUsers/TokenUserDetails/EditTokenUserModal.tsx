import React, { useCallback, useEffect, useState } from 'react';
import Button from '../../../bootstrap/Button';
import Modal, { ModalBody, ModalFooter, ModalHeader, ModalTitle } from '../../../bootstrap/Modal';
import useToasterNotification from '../../../../hooks/useToasterNotification';
import {
	type PatchTokenUserPayload,
	type TokenUser,
	tokensApi,
} from '../../../../services/queueManagementApi';

type EditDraft = {
	name: string;
	email: string;
	phone: string;
	age: string;
	place: string;
	remarks: string;
};

const emptyDraft = (): EditDraft => ({
	name: '',
	email: '',
	phone: '',
	age: '',
	place: '',
	remarks: '',
});

const tokenUserToDraft = (tokenUser: TokenUser): EditDraft => ({
	name: tokenUser.name ?? '',
	email: tokenUser.email ?? '',
	phone: tokenUser.phone ?? '',
	age: tokenUser.age != null && tokenUser.age !== '' ? String(tokenUser.age) : '',
	place: tokenUser.place ?? '',
	remarks: tokenUser.remarks ?? '',
});

export interface EditTokenUserModalProps {
	isOpen: boolean;
	setIsOpen: (open: boolean) => void;
	userId: number;
	tokenUser: TokenUser | null;
	onSaved: (updated: TokenUser) => void;
}

const EditTokenUserModal: React.FC<EditTokenUserModalProps> = ({
	isOpen,
	setIsOpen,
	userId,
	tokenUser,
	onSaved,
}) => {
	const [editDraft, setEditDraft] = useState<EditDraft>(emptyDraft);
	const [saving, setSaving] = useState(false);
	const { showErrorNotification, showSuccessNotification } = useToasterNotification();

	useEffect(() => {
		if (!isOpen || !tokenUser) return;
		setEditDraft(tokenUserToDraft(tokenUser));
	}, [isOpen, tokenUser]);

	const closeModal = useCallback(() => {
		setIsOpen(false);
	}, [setIsOpen]);

	const handleSave = useCallback(async () => {
		const name = editDraft.name.trim();
		if (!name) {
			showErrorNotification('Name is required.');
			return;
		}
		const ageStr = editDraft.age.trim();
		if (ageStr !== '') {
			const n = Number(ageStr);
			if (!Number.isFinite(n)) {
				showErrorNotification('Age must be a valid number.');
				return;
			}
		}
		const payload: PatchTokenUserPayload = {
			name,
			email: editDraft.email.trim() || null,
			phone: editDraft.phone.trim() || null,
			place: editDraft.place.trim() || null,
			remarks: editDraft.remarks.trim() || null,
		};
		if (ageStr !== '') {
			payload.age = Number(ageStr);
		} else {
			payload.age = null;
		}
		setSaving(true);
		try {
			const updated = await tokensApi.patchUser(userId, payload);
			onSaved(updated);
			closeModal();
			showSuccessNotification('Token user updated.');
		} catch (err) {
			showErrorNotification(err);
		} finally {
			setSaving(false);
		}
	}, [
		closeModal,
		editDraft,
		onSaved,
		showErrorNotification,
		showSuccessNotification,
		userId,
	]);

	return (
		<Modal
			isCentered
			isOpen={isOpen}
			setIsOpen={(open) => {
				if (!open) closeModal();
			}}
			size='lg'
			isAnimation={false}
			titleId='token-user-edit-modal-title'>
			<ModalHeader setIsOpen={closeModal}>
				<ModalTitle id='token-user-edit-modal-title'>Edit token user</ModalTitle>
			</ModalHeader>
			<ModalBody>
				<form
					className='d-grid gap-3'
					onSubmit={(e) => {
						e.preventDefault();
						void handleSave();
					}}>
					<div>
						<label htmlFor='token-user-edit-name' className='form-label small'>
							Name <span className='text-danger'>*</span>
						</label>
						<input
							id='token-user-edit-name'
							type='text'
							className='form-control'
							value={editDraft.name}
							onChange={(e) => setEditDraft((d) => ({ ...d, name: e.target.value }))}
							autoComplete='name'
							required
						/>
					</div>
					<div>
						<label htmlFor='token-user-edit-email' className='form-label small'>
							Email
						</label>
						<input
							id='token-user-edit-email'
							type='email'
							className='form-control'
							value={editDraft.email}
							onChange={(e) => setEditDraft((d) => ({ ...d, email: e.target.value }))}
							autoComplete='email'
						/>
					</div>
					<div>
						<label htmlFor='token-user-edit-phone' className='form-label small'>
							Phone
						</label>
						<input
							id='token-user-edit-phone'
							type='tel'
							className='form-control'
							value={editDraft.phone}
							onChange={(e) => setEditDraft((d) => ({ ...d, phone: e.target.value }))}
							autoComplete='tel'
						/>
					</div>
					<div className='row g-3'>
						<div className='col-12 col-sm-6'>
							<label htmlFor='token-user-edit-age' className='form-label small'>
								Age
							</label>
							<input
								id='token-user-edit-age'
								type='text'
								inputMode='numeric'
								className='form-control'
								value={editDraft.age}
								onChange={(e) => setEditDraft((d) => ({ ...d, age: e.target.value }))}
							/>
						</div>
						<div className='col-12 col-sm-6'>
							<label htmlFor='token-user-edit-place' className='form-label small'>
								Place
							</label>
							<input
								id='token-user-edit-place'
								type='text'
								className='form-control'
								value={editDraft.place}
								onChange={(e) => setEditDraft((d) => ({ ...d, place: e.target.value }))}
							/>
						</div>
					</div>
					<div>
						<label htmlFor='token-user-edit-remarks' className='form-label small'>
							Remarks
						</label>
						<textarea
							id='token-user-edit-remarks'
							className='form-control'
							rows={3}
							value={editDraft.remarks}
							onChange={(e) => setEditDraft((d) => ({ ...d, remarks: e.target.value }))}
						/>
					</div>
				</form>
			</ModalBody>
			<ModalFooter>
				<Button color='secondary' isOutline onClick={closeModal} isDisable={saving}>
					Cancel
				</Button>
				<Button color='primary' onClick={() => void handleSave()} isDisable={saving}>
					{saving ? 'Saving…' : 'Save'}
				</Button>
			</ModalFooter>
		</Modal>
	);
};

export default EditTokenUserModal;
