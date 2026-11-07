import React from 'react';
import Modal, { ModalBody, ModalFooter, ModalHeader, ModalTitle } from '../../bootstrap/Modal';
import Button from '../../bootstrap/Button';
import Icon from '../../icon/Icon';
import StatusBadge from '../../BadgeWithIcon.jsx';
import type { Token } from '../../../services/queueManagementApi';
import { getTokenDisplay } from '../../MasterComponents/QueueManagement/queueManagementUtils';

export type IssuedTokenModalVariant = 'postpone' | 'complete';

export interface IssuedTokenModalProps {
	isOpen: boolean;
	setIsOpen: (open: boolean) => void;
	variant: IssuedTokenModalVariant;
	token: Token | null;
	detail?: string | null;
}

const VARIANT_CONFIG: Record<
	IssuedTokenModalVariant,
	{
		title: string;
		icon: string;
		color: 'warning' | 'success';
		defaultDetail: string;
		tokenLabel: string;
		modalId: string;
	}
> = {
	postpone: {
		title: 'Token postponed',
		icon: 'Update',
		color: 'warning',
		defaultDetail: 'A new token has been issued and is now waiting in the queue.',
		tokenLabel: 'New token',
		modalId: 'issued-token-modal-postpone',
	},
	complete: {
		title: 'Service completed',
		icon: 'TaskAlt',
		color: 'success',
		defaultDetail: 'A new token has been created in the next queue for this customer.',
		tokenLabel: 'New token in next queue',
		modalId: 'issued-token-modal-complete',
	},
};

const IssuedTokenModal: React.FC<IssuedTokenModalProps> = ({
	isOpen,
	setIsOpen,
	variant,
	token,
	detail,
}) => {
	const config = VARIANT_CONFIG[variant];
	const handleClose = () => setIsOpen(false);

	const tokenDisplay = token ? getTokenDisplay(token) : '—';
	const customerName = token?.token_user?.name?.trim() || null;
	const parentLabel =
		token?.parent_tokens?.[0]?.token_display?.trim() ||
		(token?.parent_tokens?.[0]?.token_number != null
			? String(token.parent_tokens[0].token_number)
			: null);

	return (
		<Modal
			isOpen={isOpen}
			setIsOpen={(open) => {
				if (!open) handleClose();
			}}
			isCentered
			size='sm'
			isAnimation={false}>
			<ModalHeader
				setIsOpen={(open) => {
					if (!open) handleClose();
				}}>
				<ModalTitle id={config.modalId}>
					<div className='d-flex align-items-center gap-2'>
						<span
							className={[
								'd-inline-flex align-items-center justify-content-center rounded-circle bg-opacity-10 flex-shrink-0',
								config.color === 'success' ? 'bg-success' : 'bg-warning',
							].join(' ')}
							style={{ width: 32, height: 32 }}>
							<Icon icon={config.icon} color={config.color} size='sm' />
						</span>
						{config.title}
					</div>
				</ModalTitle>
			</ModalHeader>

			<ModalBody>
				{(detail?.trim() || token) && (
					<p className='text-muted small mb-3 lh-base'>
						{detail?.trim() || config.defaultDetail}
					</p>
				)}

				{token && (
					<div className='d-flex flex-column gap-3 p-3 rounded-3 border border-secondary border-opacity-25 bg-body-secondary'>
						<div className='d-flex align-items-center gap-3'>
							<span
								className='d-inline-flex align-items-center justify-content-center rounded-circle bg-primary bg-opacity-10 flex-shrink-0'
								style={{ width: 44, height: 44 }}>
								<Icon icon='ConfirmationNumber' color='primary' />
							</span>
							<div className='min-w-0 flex-grow-1'>
								<div className='text-muted small text-uppercase fw-semibold mb-1'>
									{config.tokenLabel}
								</div>
								<div className='fw-bold fs-4 text-primary lh-sm'>{tokenDisplay}</div>
								{customerName && (
									<div className='text-body-secondary small text-truncate'>{customerName}</div>
								)}
							</div>
						</div>

						<div className='d-flex flex-wrap align-items-center gap-2'>
							<span className='text-muted small'>Status</span>
							<StatusBadge status={token.status} />
						</div>

						{token.queue_name?.trim() && (
							<div className='d-flex align-items-start gap-2 small'>
								<Icon icon='Queue' color='secondary' size='sm' className='mt-1 flex-shrink-0' />
								<div className='min-w-0'>
									<span className='text-muted'>Queue: </span>
									<span className='fw-medium'>{token.queue_name.trim()}</span>
								</div>
							</div>
						)}

						{parentLabel && (
							<div className='d-flex align-items-start gap-2 small pt-1 border-top border-secondary border-opacity-25'>
								<Icon icon='History' color='secondary' size='sm' className='mt-1 flex-shrink-0' />
								<div className='min-w-0'>
									<span className='text-muted'>Previous token: </span>
									<span className='fw-medium'>{parentLabel}</span>
									{token.parent_tokens?.[0]?.status && (
										<span className='ms-1'>
											<StatusBadge status={token.parent_tokens[0].status} />
										</span>
									)}
								</div>
							</div>
						)}

						{token.notes?.trim() && (
							<div className='d-flex align-items-start gap-2 small text-muted'>
								<Icon icon='Notes' color='secondary' size='sm' className='mt-1 flex-shrink-0' />
								<span className='text-break'>{token.notes.trim()}</span>
							</div>
						)}
					</div>
				)}
			</ModalBody>

			<ModalFooter>
				<Button color='primary' type='button' icon='Check' onClick={handleClose}>
					Got it
				</Button>
			</ModalFooter>
		</Modal>
	);
};

export default IssuedTokenModal;
