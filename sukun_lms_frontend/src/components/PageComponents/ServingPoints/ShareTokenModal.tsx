import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import Modal, { ModalBody, ModalFooter, ModalHeader, ModalTitle } from '../../bootstrap/Modal';
import Button from '../../bootstrap/Button';
import Icon from '../../icon/Icon';
import Spinner from '../../bootstrap/Spinner';

export interface ShareTokenModalProps {
	isOpen: boolean;
	setIsOpen: (open: boolean) => void;
	tokenUserUuid: string;
	queueId: number;
	tokenDisplay: string | null;
	customerName?: string | null;
}

const ShareTokenModal: React.FC<ShareTokenModalProps> = ({
	isOpen,
	setIsOpen,
	tokenUserUuid,
	queueId,
	tokenDisplay,
	customerName,
}) => {
	const [copied, setCopied] = useState(false);
	const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
	const [qrLoading, setQrLoading] = useState(false);

	const publicUrl = `${window.location.origin}/public/token-status?token=${encodeURIComponent(tokenUserUuid)}&queue=${queueId}`;

	useEffect(() => {
		if (!isOpen) {
			setQrDataUrl(null);
			return;
		}
		let cancelled = false;
		setQrLoading(true);
		void QRCode.toDataURL(publicUrl, { width: 200, margin: 2, errorCorrectionLevel: 'M' })
			.then((url) => { if (!cancelled) setQrDataUrl(url); })
			.catch(() => { if (!cancelled) setQrDataUrl(null); })
			.finally(() => { if (!cancelled) setQrLoading(false); });
		return () => { cancelled = true; };
	}, [isOpen, publicUrl]);

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(publicUrl);
		} catch {
			const el = document.createElement('textarea');
			el.value = publicUrl;
			document.body.appendChild(el);
			el.select();
			document.execCommand('copy');
			document.body.removeChild(el);
		}
		setCopied(true);
		setTimeout(() => setCopied(false), 2500);
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={setIsOpen} isCentered isAnimation={false}>
			<ModalHeader setIsOpen={setIsOpen} className='border-0 pb-0'>
				<ModalTitle id='share-token-modal'>
					<div className='d-flex align-items-center gap-2'>
						<span
							className='d-inline-flex align-items-center justify-content-center rounded-2 bg-info bg-opacity-10 flex-shrink-0'
							style={{ width: 34, height: 34 }}>
							<Icon icon='QrCode2' color='info' size='sm' />
						</span>
						<div>
							<div className='fw-bold' style={{ fontSize: '0.95rem', lineHeight: 1.2 }}>
								Share Token Status
							</div>
							<div className='text-muted' style={{ fontSize: '0.72rem', fontWeight: 400 }}>
								Let the customer track their position
							</div>
						</div>
					</div>
				</ModalTitle>
			</ModalHeader>

			<ModalBody className='pt-2'>

				{/* ── Token chip ── */}
				{(tokenDisplay || customerName) && (
					<div className='d-flex align-items-center gap-3 p-3 rounded-3 mb-4 border border-secondary border-opacity-25 bg-body-secondary'>
						<span
							className='d-inline-flex align-items-center justify-content-center rounded-2 bg-primary bg-opacity-10 flex-shrink-0'
							style={{ width: 42, height: 42 }}>
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

				{/* ── QR Code ── */}
				<div className='d-flex flex-column align-items-center mb-4'>
					<div
						className='p-3 rounded-3 border'
						style={{
							background: 'var(--bs-body-bg)',
							boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
							display: 'inline-flex',
						}}>
						{qrLoading ? (
							<div
								className='d-flex align-items-center justify-content-center'
								style={{ width: 200, height: 200 }}>
								<Spinner color='primary' />
							</div>
						) : qrDataUrl ? (
							<img
								src={qrDataUrl}
								alt='QR code for token status link'
								width={200}
								height={200}
								style={{ display: 'block', borderRadius: 4 }}
							/>
						) : (
							<div
								className='d-flex align-items-center justify-content-center text-muted small text-center px-2'
								style={{ width: 200, height: 200 }}>
								Could not generate QR code
							</div>
						)}
					</div>

					<div
						className='d-flex align-items-center gap-1 text-muted mt-2'
						style={{ fontSize: '0.75rem' }}>
						<Icon icon='PhoneIphone' style={{ fontSize: '0.9rem' }} />
						Scan with any phone camera
					</div>
				</div>

				{/* ── Divider ── */}
				<div className='d-flex align-items-center gap-2 mb-3'>
					<div className='flex-fill border-top' />
					<span
						className='text-muted'
						style={{ fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
						or share link
					</span>
					<div className='flex-fill border-top' />
				</div>

				{/* ── Copy URL bar ── */}
				<div
					className={`d-flex align-items-center gap-2 p-2 rounded-3 border ${copied ? 'border-success bg-success bg-opacity-10' : 'bg-body-secondary'}`}>
					<div
						className='text-muted flex-grow-1'
						style={{ wordBreak: 'break-all', fontSize: '0.7rem', fontFamily: 'monospace', lineHeight: 1.5 }}>
						{publicUrl}
					</div>
					<button
						type='button'
						onClick={handleCopy}
						className={`btn btn-sm flex-shrink-0 ${copied ? 'btn-success' : 'btn-primary'}`}
						style={{ minWidth: 90 }}>
						<Icon icon={copied ? 'Check' : 'ContentCopy'} size='sm' />
						{' '}
						{copied ? 'Copied!' : 'Copy link'}
					</button>
				</div>
			</ModalBody>

			<ModalFooter>
				<Button color='dark' isLight type='button' onClick={() => setIsOpen(false)}>
					Close
				</Button>
			</ModalFooter>
		</Modal>
	);
};

export default ShareTokenModal;
