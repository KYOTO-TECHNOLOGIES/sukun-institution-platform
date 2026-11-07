import React, { ChangeEvent, FC, FormEvent, useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { authAxios } from '../../../axiosInstance';
import useToasterNotification from '../../../hooks/useToasterNotification';
import Button from '../../bootstrap/Button';
import Modal, { ModalBody, ModalFooter, ModalHeader, ModalTitle } from '../../bootstrap/Modal';
import FormGroup from '../../bootstrap/forms/FormGroup';
import Spinner from '../../bootstrap/Spinner';
import JwtSecretRevealPanel from './JwtSecretRevealPanel';

export interface DeviceCredential {
	id?: number;
	name: string;
	description?: string;
	/** Controller is not required; omitted from form per requirements */
	controller?: number | null;
	controller_name?: string | null;
	queue_id?: number | null;
	queue_name?: string | null;
	valid_from?: string | null;
	valid_until?: string | null;
	is_active: boolean;
	is_valid_now?: boolean;
	jwt_secret_masked?: string;
	created_at?: string;
	updated_at?: string;
}

interface ApiKeyModalProps {
	isOpen: boolean;
	setIsOpen: (open: boolean) => void;
	editing: DeviceCredential | null;
	onSaved: (created: { jwt_secret?: string } | null) => void;
}

interface FormState {
	name: string;
	description: string;
	valid_from: string;
	valid_until: string;
}

const toDatetimeLocal = (iso: string | null | undefined): string => {
	if (!iso) return '';
	// Strip timezone to get local datetime-local value
	return iso.slice(0, 16);
};

const toIso = (local: string): string | null => {
	const trimmed = local.trim();
	if (!trimmed) return null;
	const d = new Date(trimmed);
	if (Number.isNaN(d.getTime())) return null;
	return d.toISOString();
};

const toDateTimeLocalValue = (value: Date) => dayjs(value).format('YYYY-MM-DDTHH:mm');

const minValidUntilAfterFrom = (validFromLocal: string): string | undefined => {
	const trimmed = validFromLocal.trim();
	if (!trimmed) return undefined;
	const d = new Date(trimmed);
	if (Number.isNaN(d.getTime())) return undefined;
	return toDateTimeLocalValue(dayjs(d).add(1, 'minute').toDate());
};

const DEFAULT_FORM: FormState = {
	name: '',
	description: '',
	valid_from: '',
	valid_until: '',
};

const ApiKeyModal: FC<ApiKeyModalProps> = ({ isOpen, setIsOpen, editing, onSaved }) => {
	const isEdit = Boolean(editing?.id);
	const [form, setForm] = useState<FormState>(DEFAULT_FORM);
	const [submitting, setSubmitting] = useState(false);
	const [newSecret, setNewSecret] = useState<string | null>(null);

	const { showErrorNotification, showSuccessNotification } = useToasterNotification();

	const validUntilMin = useMemo(() => minValidUntilAfterFrom(form.valid_from), [form.valid_from]);

	useEffect(() => {
		if (!isOpen) {
			setForm(DEFAULT_FORM);
			setNewSecret(null);
			return;
		}
		if (editing) {
			setForm({
				name: editing.name ?? '',
				description: editing.description ?? '',
				valid_from: toDatetimeLocal(editing.valid_from),
				valid_until: toDatetimeLocal(editing.valid_until),
			});
		} else {
			setForm(DEFAULT_FORM);
		}
		setNewSecret(null);
	}, [isOpen, editing]);

	const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		const { name, value } = e.target;
		if (name === 'valid_from') {
			setForm((prev) => {
				const nextFrom = value;
				const fromDate = new Date(nextFrom);
				const untilDate = new Date(prev.valid_until);
				let nextUntil = prev.valid_until;
				if (
					nextFrom &&
					prev.valid_until &&
					!Number.isNaN(fromDate.getTime()) &&
					!Number.isNaN(untilDate.getTime()) &&
					untilDate <= fromDate
				) {
					nextUntil = toDateTimeLocalValue(dayjs(fromDate).add(1, 'minute').toDate());
				}
				return { ...prev, valid_from: nextFrom, valid_until: nextUntil };
			});
			return;
		}
		setForm((prev) => ({ ...prev, [name]: value }));
	};

	const validateForm = (): { valid_from?: string; valid_until?: string } | null => {
		const name = form.name.trim();
		if (!name) {
			showErrorNotification('Name is required.');
			return null;
		}

		const fromRaw = form.valid_from.trim();
		const untilRaw = form.valid_until.trim();

		if (!isEdit) {
			if (!fromRaw) {
				showErrorNotification('Valid from is required.');
				return null;
			}
			if (!untilRaw) {
				showErrorNotification('Valid until is required.');
				return null;
			}
		}

		let fromIso: string | undefined;
		let untilIso: string | undefined;

		if (fromRaw) {
			fromIso = toIso(fromRaw) ?? undefined;
			if (!fromIso) {
				showErrorNotification('Valid from must be a valid date and time.');
				return null;
			}
			if (!isEdit && new Date(fromRaw).getTime() < Date.now()) {
				showErrorNotification('Valid from cannot be in the past.');
				return null;
			}
		}

		if (untilRaw) {
			untilIso = toIso(untilRaw) ?? undefined;
			if (!untilIso) {
				showErrorNotification('Valid until must be a valid date and time.');
				return null;
			}
		}

		if (fromRaw && untilRaw) {
			const fromDate = new Date(fromRaw);
			const untilDate = new Date(untilRaw);
			if (untilDate <= fromDate) {
				showErrorNotification('Valid until must be later than valid from.');
				return null;
			}
		}

		return {
			valid_from: fromIso,
			valid_until: untilIso,
		};
	};

	const canSave = form.name.trim().length > 0;

	const handleSubmit = async (event?: FormEvent) => {
		event?.preventDefault();
		const dates = validateForm();
		if (!dates) return;

		setSubmitting(true);
		try {
			if (isEdit && editing?.id) {
				const payload: Record<string, unknown> = {
					name: form.name.trim(),
					description: form.description.trim() || null,
					...(dates.valid_from ? { valid_from: dates.valid_from } : {}),
					...(dates.valid_until ? { valid_until: dates.valid_until } : {}),
				};
				await authAxios.patch(`/api/administration/device-credentials/${editing.id}/`, payload);
				showSuccessNotification('API key updated.');
				setIsOpen(false);
				onSaved(null);
			} else {
				const res = await authAxios.post('/api/administration/device-credentials/', {
					name: form.name.trim(),
					description: form.description.trim() || null,
					valid_from: dates.valid_from,
					valid_until: dates.valid_until,
					is_active: true,
				});
				showSuccessNotification('API key created. Copy the secret — it is shown only once.');
				setNewSecret(res.data.jwt_secret ?? null);
				onSaved(res.data);
			}
		} catch (err) {
			showErrorNotification(err);
		} finally {
			setSubmitting(false);
		}
	};

	const handleClose = () => {
		if (submitting) return;
		setIsOpen(false);
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={handleClose}  isCentered isAnimation={false} size='lg'>
			<ModalHeader setIsOpen={handleClose}>
				<ModalTitle id='api-key-modal'>
					{newSecret
						? 'API Key Created — Save Your Secret'
						: isEdit
							? 'Edit API Key'
							: 'Create API Key'}
				</ModalTitle>
			</ModalHeader>

			{newSecret ? (
				/* ── Secret reveal screen (only after create) ── */
				<>
					<ModalBody>
						<JwtSecretRevealPanel secret={newSecret} mode='create' />
					</ModalBody>
					<ModalFooter>
						<Button color='primary' onClick={handleClose}>
							Done
						</Button>
					</ModalFooter>
				</>
			) : (
				/* ── Create / Edit form ── */
				<form onSubmit={handleSubmit}>
					<ModalBody>
						<div className='row g-3'>
							<div className='col-12'>
								<FormGroup label='Name *'>
									<input
										type='text'
										className='form-control'
										name='name'
										placeholder='e.g. Kiosk 1'
										value={form.name}
										onChange={handleChange}
										required
									/>
								</FormGroup>
							</div>

							<div className='col-12'>
								<FormGroup label='Description'>
									<textarea
										className='form-control'
										name='description'
										rows={2}
										placeholder='Optional description'
										value={form.description}
										onChange={handleChange}
									/>
								</FormGroup>
							</div>

							<div className='col-12 col-md-6'>
								<FormGroup label={isEdit ? 'Valid from' : 'Valid from *'}>
									<input
										type='datetime-local'
										className='form-control'
										name='valid_from'
										min={!isEdit ? toDateTimeLocalValue(new Date()) : undefined}
										value={form.valid_from}
										onChange={handleChange}
										required={!isEdit}
									/>
								</FormGroup>
							</div>

							<div className='col-12 col-md-6'>
								<FormGroup label={isEdit ? 'Valid until' : 'Valid until *'}>
									<input
										type='datetime-local'
										className='form-control'
										name='valid_until'
										min={validUntilMin}
										value={form.valid_until}
										onChange={handleChange}
										required={!isEdit}
									/>
								</FormGroup>
							</div>

						</div>
					</ModalBody>
					<ModalFooter>
						<Button
							color='secondary'
							isLight
							type='button'
							onClick={handleClose}
							isDisable={submitting}>
							Cancel
						</Button>
						<Button color='primary' type='submit' isDisable={submitting || !canSave}>
							{submitting ? (
								<>
									<Spinner isSmall inButton />
									{isEdit ? 'Saving…' : 'Creating…'}
								</>
							) : isEdit ? (
								'Save Changes'
							) : (
								'Create API Key'
							)}
						</Button>
					</ModalFooter>
				</form>
			)}
		</Modal>
	);
};

export default ApiKeyModal;
