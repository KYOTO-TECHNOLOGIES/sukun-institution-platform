import React, { type FormEvent, useEffect, useState } from 'react';
import Modal, { ModalBody, ModalHeader, ModalTitle } from '../../bootstrap/Modal';
import TokenCreateForm from '../QueueManagement/TokenCreateForm';
import StatusBadge from '../../BadgeWithIcon.jsx';
import type { CreateTokenPayload, Queue, QueueSchedule, Token } from '../../../services/queueManagementApi';
import { tokensApi } from '../../../services/queueManagementApi';
import useToasterNotification from '../../../hooks/useToasterNotification';
import { initialTokenForm } from '../../MasterComponents/QueueManagement/queueManagementConstants';
import { getTokenDisplay } from '../../MasterComponents/QueueManagement/queueManagementUtils';

export interface ScheduleTokenModalProps {
	isOpen: boolean;
	setIsOpen: (open: boolean) => void;
	mode: 'create' | 'edit';
	scheduleId: number;
	queueId: number;
	queues: Queue[];
	schedules: QueueSchedule[];
	editingToken: Token | null;
	onSaved: () => void | Promise<void>;
}

const tokenToForm = (token: Token, scheduleId: number): CreateTokenPayload => {
	const u = token.token_user;
	const ageRaw = u?.age;
	let age: number | undefined;
	if (ageRaw != null && ageRaw !== '') {
		const n = Number(ageRaw);
		age = Number.isNaN(n) ? undefined : n;
	}

	const scheduleFromToken =
		typeof token.schedule === 'number' && !Number.isNaN(token.schedule) ? token.schedule : scheduleId;

	const remarksFromUser = (u?.remarks ?? '').trim();
	const remarksFromTokenNotes = (token.notes ?? '').trim();
	const remarks = remarksFromUser || remarksFromTokenNotes;

	return {
		schedule_id: scheduleFromToken,
		name: (u?.name ?? '').trim(),
		email: (u?.email ?? '').trim(),
		phone: (u?.phone ?? '').trim(),
		age,
		place: (u?.place ?? '').trim(),
		remarks,
	};
};

const ScheduleTokenModal: React.FC<ScheduleTokenModalProps> = ({
	isOpen,
	setIsOpen,
	mode,
	scheduleId,
	queueId,
	queues,
	schedules,
	editingToken,
	onSaved,
}) => {
	const [tokenForm, setTokenForm] = useState<CreateTokenPayload>(initialTokenForm);
	const [saving, setSaving] = useState(false);
	const [tokenNumberLoading, setTokenNumberLoading] = useState(false);
	const { showErrorNotification, showSuccessNotification } = useToasterNotification();

	useEffect(() => {
		if (!isOpen) return;
		if (mode === 'edit' && editingToken) {
			setTokenForm(tokenToForm(editingToken, scheduleId));
			return;
		}
		// Create mode: reset form then fetch next token number
		setTokenForm({ ...initialTokenForm, schedule_id: scheduleId });
		setTokenNumberLoading(true);
		tokensApi
			.getNextTokenNumber(scheduleId)
			.then((res) => {
				setTokenForm((prev) => ({ ...prev, token_number: res.next_token_number }));
			})
			.catch(() => {
				// silently ignore — user can type manually
			})
			.finally(() => {
				setTokenNumberLoading(false);
			});
	}, [isOpen, mode, editingToken, scheduleId]);

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (
			mode === 'create' &&
			tokenForm.token_number != null &&
			Number(tokenForm.token_number) >= 1000
		) {
			return;
		}
		if (mode === 'create') {
			setSaving(true);
			try {
				await tokensApi.create({
					schedule_id: scheduleId,
					name: tokenForm.name.trim(),
					email: tokenForm.email?.trim() || undefined,
					phone: tokenForm.phone?.trim() || undefined,
					age:
						tokenForm.age != null && !Number.isNaN(Number(tokenForm.age))
							? Number(tokenForm.age)
							: undefined,
					place: tokenForm.place?.trim() || undefined,
					remarks: tokenForm.remarks?.trim() || undefined,
					token_number:
						tokenForm.token_number != null && tokenForm.token_number !== ''
							? Number(tokenForm.token_number)
							: undefined,
				});
				showSuccessNotification('Token created successfully.');
				setIsOpen(false);
				await onSaved();
			} catch (err) {
				showErrorNotification(err);
			} finally {
				setSaving(false);
			}
			return;
		}

		if (!editingToken?.id) return;
		setSaving(true);
		try {
			const userId = editingToken.token_user?.id;
			const ageNum =
				tokenForm.age != null && !Number.isNaN(Number(tokenForm.age)) ? Number(tokenForm.age) : null;
			await tokensApi.patch(editingToken.id, {
				token_user: {
					...(userId != null ? { id: userId } : {}),
					name: tokenForm.name.trim(),
					email: tokenForm.email?.trim() ?? '',
					phone: tokenForm.phone?.trim() ?? '',
					age: ageNum,
					place: tokenForm.place?.trim() ?? '',
					remarks: tokenForm.remarks?.trim() ?? '',
				},
			});
			showSuccessNotification('Token updated successfully.');
			setIsOpen(false);
			await onSaved();
		} catch (err) {
			showErrorNotification(err);
		} finally {
			setSaving(false);
		}
	};

	const title = mode === 'create' ? 'Create Token for Schedule' : 'Edit Token';
	const submitLabel = mode === 'create' ? 'Create Token' : 'Save changes';

	return (
		<Modal isOpen={isOpen} setIsOpen={setIsOpen} isCentered size='lg' isAnimation={false}>
			<ModalHeader setIsOpen={setIsOpen}>
				<ModalTitle id='schedule-token-modal'>{title}</ModalTitle>
			</ModalHeader>
			<ModalBody>
				{mode === 'edit' && editingToken && (
					<div className='d-flex flex-wrap align-items-center gap-2 text-muted small mb-3'>
						<span>Token</span>
						<span className='fw-semibold text-body'>{getTokenDisplay(editingToken)}</span>
						<span className='text-muted'>·</span>
						<span>Status</span>
						<StatusBadge status={editingToken.status} />
					</div>
				)}
			<TokenCreateForm
				tokenForm={tokenForm}
				setTokenForm={setTokenForm}
				queues={queues}
				schedules={schedules}
				selectedQueueId={queueId}
				onQueueChange={() => {}}
				fixedScheduleId={scheduleId}
				servingPoints={[]}
				showServingPoints={false}
				onCancel={() => setIsOpen(false)}
				onSubmit={handleSubmit}
				isSubmitting={saving}
				submitLabel={submitLabel}
				showTokenNumber={mode === 'create'}
				tokenNumberLoading={tokenNumberLoading}
			/>
			</ModalBody>
		</Modal>
	);
};

export default ScheduleTokenModal;
