import React from 'react';
import Modal, { ModalBody } from '../../bootstrap/Modal';
import { Button } from 'reactstrap';

interface ViewImageModalProps {
	isOpen: boolean;
	onClose: () => void;
	selectedImage: any;
	images: any[];
	currentIndex: number;
	onNext: () => void;
	onPrev: () => void;
	onPrimaryChange?: (id: number, isPrimary: boolean) => Promise<void>;
	primaryChanging: boolean;
}

const ViewImageModal: React.FC<ViewImageModalProps> = ({
	isOpen,
	onClose,
	selectedImage,
	images,
	currentIndex,
	onNext,
	onPrev,
	onPrimaryChange,
	primaryChanging,
}) => {
	return (
		<>
			<Modal centered isOpen={isOpen} setIsOpen={onClose} size="lg">
				<div style={{
					padding: '20px 24px',
					borderRadius: '12px 12px 0 0',
					position: 'relative'
				}}>
					<h4 style={{
						margin: 0,
						fontSize: '20px',
						fontWeight: '600',
						letterSpacing: '0.3px'
					}}>
						Image Preview
					</h4>
					<button
						onClick={onClose}
						style={{
							position: 'absolute',
							right: '20px',
							top: '50%',
							transform: 'translateY(-50%)',
							background: 'rgba(0, 0, 0, 0.56)',
							border: 'none',
							borderRadius: '50%',
							width: '36px',
							height: '36px',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							cursor: 'pointer',
							transition: 'all 0.3s ease',
							color: 'white',
							fontSize: '24px',
							fontWeight: '300'
						}}
						onMouseEnter={(e) => {
							e.currentTarget.style.transform = 'translateY(-50%) rotate(90deg)';
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.transform = 'translateY(-50%) rotate(0deg)';
						}}
					>
						×
					</button>
				</div>
				<ModalBody style={{ padding: 0, background: '#f8f9fa' }}>
					<div style={{
						background: '#fff',
						padding: '40px 24px',
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						justifyContent: 'center',
						position: 'relative'
					}}>
						{images?.length > 1 && (
							<button
								onClick={onPrev}
								style={{
									position: 'absolute',
									left: '10px',
									top: '50%',
									transform: 'translateY(-50%)',
									background: 'rgba(0, 0, 0, 0.5)',
									border: 'none',
									borderRadius: '50%',
									width: '40px',
									height: '40px',
									cursor: 'pointer',
									color: 'white',
									fontSize: '20px',
									zIndex: 10
								}}
							>
								‹
							</button>
						)}
						<div style={{
							position: 'relative',
							maxWidth: '100%',
							boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
							borderRadius: '12px',
							overflow: 'hidden',
							background: '#f8f9fa'
						}}>
							<a
								href={selectedImage?.image}
								target="_blank"
								rel="noopener noreferrer"
								style={{
									display: 'block',
									cursor: 'pointer',
									position: 'relative'
								}}
								title="Click to open in new tab"
							>
								<img
									src={selectedImage?.image}
									alt="Full size view"
									style={{
										maxWidth: '100%',
										maxHeight: '40vh',
										objectFit: 'contain',
										display: 'block'
									}}
								/>
							</a>
						</div>
						{images?.length > 1 && (
							<button
								onClick={onNext}
								style={{
									position: 'absolute',
									right: '10px',
									top: '50%',
									transform: 'translateY(-50%)',
									background: 'rgba(0, 0, 0, 0.5)',
									border: 'none',
									borderRadius: '50%',
									width: '40px',
									height: '40px',
									cursor: 'pointer',
									color: 'white',
									fontSize: '20px',
									zIndex: 10
								}}
							>
								›
							</button>
						)}
						{images?.length > 1 && (
							<div style={{ marginTop: '10px', color: '#6c757d', fontSize: '14px' }}>
								{currentIndex + 1} / {images?.length}
							</div>
						)}
					</div>
					{onPrimaryChange && (
						<div style={{
							background: 'white',
							padding: '12px',
							borderTop: '1px solid #e9ecef'
						}}>
							<label
								htmlFor="primaryImageCheck"
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: '12px',
									cursor: primaryChanging ? 'not-allowed' : 'pointer',
									padding: '8px 20px',
									position: 'relative',
									userSelect: 'none'
								}}
								onMouseEnter={(e) => {
									if (!primaryChanging) {
										e.currentTarget.style.transform = 'translateY(-2px)';
									}
								}}
								onMouseLeave={(e) => {
									e.currentTarget.style.transform = 'translateY(0)';
								}}
							>
								<input
									type="checkbox"
									id="primaryImageCheck"
									checked={selectedImage?.is_primary || false}
									onChange={(e) => onPrimaryChange(selectedImage?.id, e.target.checked)}
									disabled={primaryChanging || selectedImage?.is_primary}
									style={{
										width: '18px',
										height: '18px',
										cursor: primaryChanging ? 'not-allowed' : 'pointer',
									}}
								/>
								<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
									<span>
										{selectedImage?.is_primary ? 'Primary Image' : 'Set as Primary Image'}
									</span>
								</div>
								{primaryChanging && (
									<div
										style={{
											marginLeft: '8px',
											width: '16px',
											height: '16px',
											border: '2px solid',
											borderColor: selectedImage?.is_primary ? 'white' : '#667eea',
											borderTopColor: 'transparent',
											borderRadius: '50%',
											animation: 'spin 0.8s linear infinite'
										}}
									/>
								)}
							</label>
						</div>
					)}
				</ModalBody>
				<div style={{
					background: '#f8f9fa',
					padding: '16px 24px',
					borderTop: '1px solid #e9ecef',
					display: 'flex',
					justifyContent: 'flex-end',
					gap: '12px'
				}}>
					<Button
						type='button'
						color='primary'
						onClick={onClose}
						disabled={primaryChanging}
						onMouseEnter={(e: any) => {
							e.currentTarget.style.background = '#f8f9fa';
							e.currentTarget.style.borderColor = '#adb5bd';
						}}
						onMouseLeave={(e: any) => {
							e.currentTarget.style.background = 'white';
							e.currentTarget.style.borderColor = '#dee2e6';
						}}
					>
						Close
					</Button>
				</div>
			</Modal>
			<style>
				{`
					@keyframes spin {
						to { transform: rotate(360deg); }
					}
				`}
			</style>
		</>
	);
};

export default ViewImageModal;

