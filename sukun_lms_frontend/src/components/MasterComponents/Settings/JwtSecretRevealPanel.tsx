import React, { FC, useState } from 'react';
import Icon from '../../icon/Icon';
import useToasterNotification from '../../../hooks/useToasterNotification';

export interface JwtSecretRevealPanelProps {
	secret: string;
	deviceName?: string;
	mode: 'create' | 'regenerate';
}

const JwtSecretRevealPanel: FC<JwtSecretRevealPanelProps> = ({ secret, deviceName, mode }) => {
	const [secretCopied, setSecretCopied] = useState(false);
	const { showSuccessNotification } = useToasterNotification();

	const handleCopy = () => {
		if (!secret) return;
		void navigator.clipboard.writeText(secret);
		setSecretCopied(true);
		showSuccessNotification('Secret copied to clipboard.');
	};

	const isRegenerate = mode === 'regenerate';

	return (
		<>
			<div className='rounded-3 border border-warning border-opacity-25 bg-warning bg-opacity-10 p-3 p-md-4 mb-4'>
				<div className='d-flex gap-2 align-items-start'>
					<Icon
						icon={isRegenerate ? 'Shield' : 'Warning'}
						color='warning'
						className='flex-shrink-0 mt-1'
					/>
					<div>
						<div className='fw-semibold mb-1'>
							{isRegenerate ? 'Store this secret securely' : 'This secret will not be shown again.'}
						</div>
						<div className='text-body-secondary small'>
							{isRegenerate ? (
								<>
									This secret will not be shown again. Devices using the old secret for{' '}
									<strong className='text-body-emphasis'>{deviceName}</strong> must be updated
									immediately.
								</>
							) : (
								<>Copy it now and store it securely before closing this dialog.</>
							)}
						</div>
					</div>
				</div>
			</div>

			<div className='rounded-3 border border-secondary border-opacity-25 bg-body-secondary p-3 p-md-4'>
				<div className='d-flex align-items-center justify-content-between mb-2 gap-2'>
					<label className='form-label fw-semibold small mb-0'>JWT Secret</label>
					{secretCopied && (
						<span className='badge bg-success bg-opacity-10 text-success border border-success border-opacity-25'>
							Copied
						</span>
					)}
				</div>
				<div className='input-group'>
					<input
						type='text'
						className='form-control font-monospace small'
						readOnly
						value={secret}
					/>
					<button
						className={`btn ${secretCopied ? 'btn-success' : 'btn-primary'}`}
						type='button'
						onClick={handleCopy}>
						<Icon icon={secretCopied ? 'Check' : 'ContentCopy'} className='me-1' />
						{secretCopied ? 'Copied' : 'Copy Secret'}
					</button>
				</div>
				<div className='text-body-secondary small mt-2'>
					Keep this value private. Anyone with this secret can authenticate as this device.
				</div>
			</div>
		</>
	);
};

export default JwtSecretRevealPanel;
