import React, { useEffect, useState } from 'react';
import Modal, { ModalBody, ModalFooter, ModalHeader, ModalTitle } from '../../bootstrap/Modal';
import Button from '../../bootstrap/Button';
import Icon from '../../icon/Icon';
import StatusBadge from '../../BadgeWithIcon.jsx';

export interface NextQueueOption {
	id: number;
	name: string;
	description?: string;
	status?: string;
	is_active?: boolean;
}

const isNextQueueActive = (queue: NextQueueOption): boolean => {
	const status = queue.status?.toLowerCase().trim();
	if (status) return status === 'active';
	if (queue.is_active != null) return queue.is_active;
	return true;
};

export interface CompleteWithNextQueueModalProps {
	isOpen: boolean;
	setIsOpen: (open: boolean) => void;
	tokenDisplay: string | null;
	customerName?: string | null;
	nextQueues: NextQueueOption[];
	onComplete: (nextQueueId?: number) => void;
}

const CompleteWithNextQueueModal: React.FC<CompleteWithNextQueueModalProps> = ({
	isOpen,
	setIsOpen,
	tokenDisplay,
	customerName,
	nextQueues,
	onComplete,
}) => {
	const [selectedQueueId, setSelectedQueueId] = useState<number | null>(null);

	useEffect(() => {
		if (isOpen) {
			const activeQueues = nextQueues.filter(isNextQueueActive);
			setSelectedQueueId(activeQueues.length === 1 ? activeQueues[0].id : null);
		}
	}, [isOpen, nextQueues]);

	const handleClose = () => setIsOpen(false);

	const selectedQueue = nextQueues.find((q) => q.id === selectedQueueId) ?? null;
	const canCompleteWithSelectedQueue =
		selectedQueue != null && isNextQueueActive(selectedQueue);

	return (
		<Modal
			isOpen={isOpen}
			setIsOpen={(open) => {
				if (!open) handleClose();
			}}
			isCentered
			size='lg'
			isAnimation={false}>
			<ModalHeader
				setIsOpen={(open) => {
					if (!open) handleClose();
				}}>
				<ModalTitle id='complete-next-queue-modal'>
					<div className='d-flex align-items-center gap-2'>
						<span
							className='d-inline-flex align-items-center justify-content-center rounded-circle bg-success bg-opacity-10 flex-shrink-0'
							style={{ width: 32, height: 32 }}>
							<Icon icon='TaskAlt' color='success' size='sm' />
						</span>
						Complete service
					</div>
				</ModalTitle>
			</ModalHeader>

			<ModalBody>
				{(tokenDisplay || customerName) && (
					<div className='d-flex align-items-center gap-3 p-3 rounded-3 mb-4 border border-secondary border-opacity-25 bg-body-secondary'>
						<span
							className='d-inline-flex align-items-center justify-content-center rounded-circle bg-primary bg-opacity-10 flex-shrink-0'
							style={{ width: 44, height: 44 }}>
							<Icon icon='ConfirmationNumber' color='primary' />
						</span>
						<div className='min-w-0'>
							{tokenDisplay && (
								<div className='fw-bold fs-5 text-primary lh-sm'>{tokenDisplay}</div>
							)}
							{customerName && (
								<div className='text-muted small text-truncate'>{customerName}</div>
							)}
						</div>
					</div>
				)}

				{nextQueues.length > 0 ? (
					<>
						<p className='text-muted small mb-3 lh-base'>
							This queue has follow-up queues configured. Select an active queue to redirect the
							customer, or complete without redirecting.
						</p>
						<div className='d-flex flex-column gap-2'>
							{nextQueues.map((queue) => {
								const isActive = isNextQueueActive(queue);
								const isSelected = isActive && selectedQueueId === queue.id;
								return (
									<button
										key={queue.id}
										type='button'
										disabled={!isActive}
										onClick={() => {
											if (!isActive) return;
											setSelectedQueueId(isSelected ? null : queue.id);
										}}
										className={[
											'd-flex align-items-center gap-3 p-3 rounded-3 border text-start w-100 transition-all',
											!isActive
												? 'border-secondary border-opacity-25 bg-body-secondary opacity-75'
												: isSelected
													? 'border-success bg-success bg-opacity-10'
													: 'border-secondary border-opacity-25 bg-transparent',
										].join(' ')}
										style={{ cursor: isActive ? 'pointer' : 'not-allowed' }}>
										<span
											className={[
												'd-inline-flex align-items-center justify-content-center rounded-circle flex-shrink-0 border',
												isSelected
													? 'bg-success border-success'
													: 'bg-body border-secondary border-opacity-50',
											].join(' ')}
											style={{ width: 22, height: 22 }}>
											{isSelected && (
												<Icon icon='Check' size='sm' color='light' />
											)}
										</span>

										<span
											className={[
												'd-inline-flex align-items-center justify-content-center rounded-circle flex-shrink-0',
												isSelected
													? 'bg-success bg-opacity-15'
													: 'bg-body-secondary',
											].join(' ')}
											style={{ width: 36, height: 36 }}>
											<Icon
												icon='Queue'
												size='sm'
												color={isSelected ? 'success' : 'secondary'}
											/>
										</span>

										<div className='flex-grow-1 min-w-0'>
											<div className='d-flex align-items-center gap-2 flex-wrap mb-1'>
												<div
													className={`fw-semibold text-truncate ${isSelected ? 'text-success' : 'text-body'}`}>
													{queue.name}
												</div>
												<StatusBadge
													status={
														isActive
															? queue.status?.trim() || 'active'
															: queue.status?.trim() || 'inactive'
													}
												/>
											</div>
											{queue.description?.trim() ? (
												<div className='text-muted small text-truncate'>
													{queue.description.trim()}
												</div>
											) : (
												<div className='text-muted small'>Queue #{queue.id}</div>
											)}
											{!isActive && (
												<div className='text-muted small mt-1'>
													This queue is inactive. Complete only, or choose another queue.
												</div>
											)}
										</div>

										{isSelected && (
											<Icon icon='ArrowForward' color='success' size='sm' className='flex-shrink-0' />
										)}
									</button>
								);
							})}
						</div>
					</>
				) : (
					<p className='text-muted small mb-0'>
						Confirm completion of service for this token.
					</p>
				)}
			</ModalBody>

			<ModalFooter>
				<Button
					color='secondary'
					isLight
					type='button'
					icon='TaskAlt'
					onClick={() => onComplete(undefined)}>
					Complete only
				</Button>

				{nextQueues.length > 0 && (
					<Button
						color='success'
						type='button'
						icon='ArrowForward'
						isDisable={!canCompleteWithSelectedQueue}
						onClick={() => {
							if (canCompleteWithSelectedQueue && selectedQueueId != null) {
								onComplete(selectedQueueId);
							}
						}}>
						{selectedQueue
							? `Complete & create new token in ${selectedQueue.name}`
							: 'Complete & create new token'}
					</Button>
				)}
			</ModalFooter>
		</Modal>
	);
};

export default CompleteWithNextQueueModal;
