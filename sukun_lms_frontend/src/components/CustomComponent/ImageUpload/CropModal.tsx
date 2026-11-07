import React from 'react';
import Cropper from 'react-cropper';
import 'cropperjs/dist/cropper.css';
import Modal, { ModalBody, ModalFooter } from '../../bootstrap/Modal';
import { Button, ModalHeader } from 'reactstrap';

interface CropModalProps {
	isOpen: boolean;
	onClose: () => void;
	currentImageUrl: string;
	currentCropIndex: number;
	totalImages: number;
	isProcessing: boolean;
	loading: boolean;
	aspectRatio: number;
	onSave: () => void;
	onSkip: () => void;
	onCropperInit: (instance: any) => void;
}

const CropModal: React.FC<CropModalProps> = ({
	isOpen,
	onClose,
	currentImageUrl,
	currentCropIndex,
	totalImages,
	isProcessing,
	loading,
	aspectRatio,
	onSave,
	onSkip,
	onCropperInit,
}) => {
	return (
		<Modal centered isOpen={isOpen} setIsOpen={() => {}} size="lg">
			<ModalHeader toggle={onClose}>
				Crop Image ({currentCropIndex + 1} of {totalImages})
			</ModalHeader>
			<ModalBody>
				<Cropper
					style={{ height: 400, width: '100%' }}
					zoomTo={0}
					aspectRatio={aspectRatio}
					preview='.img-preview'
					src={currentImageUrl}
					viewMode={1}
					guides
					minCropBoxHeight={10}
					minCropBoxWidth={10}
					background={false}
					responsive
					autoCropArea={1}
					checkOrientation={false}
					onInitialized={onCropperInit}
				/>
				<p className="mt-2 text-muted">Scroll to zoom in and out...</p>
			</ModalBody>
			<ModalFooter>
				<Button
					type='button'
					color='danger'
					onClick={onClose}
					disabled={isProcessing}>
					Cancel All
				</Button>
				<Button
					type='button'
					color='primary'
					onClick={onSkip}
					disabled={isProcessing}>
					Skip
				</Button>
				<Button
					type='button'
					color='primary'
					onClick={onSave}
					disabled={isProcessing}>
					{isProcessing || loading ? 'Processing...' : `Save & ${currentCropIndex < totalImages - 1 ? 'Next' : 'Finish'}`}
				</Button>
			</ModalFooter>
		</Modal>
	);
};

export default CropModal;

