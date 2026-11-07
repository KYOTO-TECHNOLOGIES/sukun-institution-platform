import React from 'react';

export interface RoyalTicketCardProps {
	queueName?: string;
	subtitle?: string;
	displayToken: string;
	statusLabel: string;
}

function ticketBarcodeId(token: string): string {
	const compact = token.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
	return compact ? `RQ-${compact.slice(0, 8).padEnd(4, '0')}` : 'RQ-0000';
}

const RoyalTicketCard: React.FC<RoyalTicketCardProps> = ({
	queueName,
	subtitle,
	displayToken,
	statusLabel,
}) => (
	<div className='tdc-rt-wrapper'>
		<div className='tdc-rt-ticket'>
			<div className='tdc-rt-main'>
				<div className='tdc-rt-content'>
					<div className='tdc-rt-header'>
						<div className='tdc-rt-logo'>
							<svg viewBox='0 0 24 24' aria-hidden='true'>
								<path
									d='M5 16L3 21l5-1 4-4M19 16l2 5-5-1-4-4M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z'
									fill='currentColor'
								/>
							</svg>
							<span>{queueName || 'Queue'}</span>
						</div>
						<div className='tdc-rt-type'>{statusLabel}</div>
					</div>
					<div className='tdc-rt-title' aria-label={`Token ${displayToken}`}>
						{displayToken}
					</div>
					{subtitle ? <div className='tdc-rt-subtitle'>{subtitle}</div> : null}
				</div>
				<div className='tdc-rt-perforation' aria-hidden='true'>
					<div className='tdc-rt-perf-line' />
				</div>
			</div>
			<div className='tdc-rt-stub'>
				<div className='tdc-rt-barcode-wrap'>
					<div className='tdc-rt-barcode' aria-hidden='true' />
					<div className='tdc-rt-barcode-id'>{ticketBarcodeId(displayToken)}</div>
				</div>
				<div className='tdc-rt-admit'>
					<div className='tdc-rt-admit-text'>Token</div>
					<div className='tdc-rt-admit-num'>{displayToken}</div>
				</div>
			</div>
		</div>
	</div>
);

export default RoyalTicketCard;
