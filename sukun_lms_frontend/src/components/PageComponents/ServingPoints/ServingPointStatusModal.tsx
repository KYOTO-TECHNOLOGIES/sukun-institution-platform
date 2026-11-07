import React, { useCallback, useEffect, useState } from 'react';
import Modal, { ModalBody, ModalFooter, ModalHeader, ModalTitle } from '../../bootstrap/Modal';
import Button from '../../bootstrap/Button';
import Spinner from '../../bootstrap/Spinner';
import StatusBadge from '../../BadgeWithIcon.jsx';
import useToasterNotification from '../../../hooks/useToasterNotification';
import { type ServingPoint, queuesApi } from '../../../services/queueManagementApi';
import {
	getNextAllowedServingPointStatuses,
	SP_STATUS_COLORS,
	SP_STATUS_LABELS,
} from '../../MasterComponents/QueueManagement/queueManagementUtils';

export interface ServingPointStatusModalProps {
	isOpen: boolean;
	setIsOpen: (open: boolean) => void;
	servingPoint: ServingPoint | null;
	/** Optional note below the serving point name (e.g. window detail context). */
	helperText?: string;
	onSuccess?: (point: ServingPoint) => void;
}

const ServingPointStatusModal: React.FC<ServingPointStatusModalProps> = ({
	isOpen,
	setIsOpen,
	servingPoint,
	helperText,
	onSuccess,
}) => {
	const [statusFormValue, setStatusFormValue] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const { showErrorNotification, showSuccessNotification } = useToasterNotification();

	useEffect(() => {
		if (!isOpen || !servingPoint) return;
		const allowed = getNextAllowedServingPointStatuses(servingPoint.status);
		setStatusFormValue(allowed[0] ?? '');
	}, [isOpen, servingPoint]);

	const handleClose = useCallback(() => {
		setIsOpen(false);
	}, [setIsOpen]);

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!servingPoint) return;
		const allowed = getNextAllowedServingPointStatuses(servingPoint.status);
		if (!statusFormValue || !allowed.includes(statusFormValue)) {
			showErrorNotification('Selected status transition is not allowed.');
			return;
		}
		setIsSubmitting(true);
		try {
			const updated = await queuesApi.updateServingPoint(servingPoint.id, {
				status: statusFormValue,
			});
			showSuccessNotification('Serving point status updated successfully.');
			onSuccess?.(updated);
			handleClose();
		} catch (err) {
			showErrorNotification(err);
		} finally {
			setIsSubmitting(false);
		}
	};

	const allowedOptions = servingPoint
		? getNextAllowedServingPointStatuses(servingPoint.status)
		: [];

	return (
		<Modal
			isOpen={isOpen && servingPoint != null}
			setIsOpen={(open) => {
				if (!open) handleClose();
			}}
			isCentered
			size='sm'
			isAnimation={false}>
			<ModalHeader setIsOpen={(open) => { if (!open) handleClose(); }}>
				<ModalTitle id='serving-point-status-modal'>Update serving point status</ModalTitle>
			</ModalHeader>
			{servingPoint && allowedOptions.length > 0 && (
				<form onSubmit={(e) => void handleSubmit(e)}>
					<ModalBody>
						<p className='fw-semibold mb-1'>{servingPoint.name}</p>
						{helperText ? (
							<p className='text-muted small mb-3 lh-base'>{helperText}</p>
						) : null}
						<div className='d-flex align-items-center gap-2 mb-3'>
							<span className='text-muted small'>Current status</span>
							<StatusBadge
								status={servingPoint.status}
								isAvailable={servingPoint.is_available}
							/>
						</div>
						<label className='form-label fw-semibold' htmlFor='sp-status-next'>
							Change to
						</label>
						<select
							id='sp-status-next'
							className='form-select'
							value={statusFormValue}
							disabled={isSubmitting}
							onChange={(ev) => setStatusFormValue(ev.target.value)}>
							{allowedOptions.map((v) => (
								<option key={v} value={v}>
									{SP_STATUS_LABELS[v] ?? v.replace(/_/g, ' ')}
								</option>
							))}
						</select>
					</ModalBody>
					<ModalFooter>
						<Button
							color='light'
							isLight
							type='button'
							isDisable={isSubmitting}
							onClick={handleClose}>
							Cancel
						</Button>
						<Button
							color={SP_STATUS_COLORS[statusFormValue] ?? 'primary'}
							type='submit'
							isDisable={isSubmitting}>
							{isSubmitting ? (
								<>
									<Spinner isSmall inButton />
									Updating…
								</>
							) : (
								`Set ${SP_STATUS_LABELS[statusFormValue] ?? statusFormValue}`
							)}
						</Button>
					</ModalFooter>
				</form>
			)}
		</Modal>
	);
};

export default ServingPointStatusModal;
