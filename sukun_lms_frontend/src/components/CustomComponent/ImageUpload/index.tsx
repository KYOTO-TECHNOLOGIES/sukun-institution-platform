import React, { useState, useRef } from 'react';
import Swal from 'sweetalert2';
import Card, { CardBody } from '../../../components/bootstrap/Card';
import useToasterNotification from '../../../hooks/useToasterNotification';
import CropModal from './CropModal';
import ViewImageModal from './ViewImageModal';
import SingleImageMode from './SingleImageMode';
import MultipleImageMode from './MultipleImageMode';
import swalFire from '../../../helpers/swalHelper';

interface ImageUploadProps {
	images: any[];
	onSave: (image: string) => Promise<void>;
	isEdit?: boolean;
	multiple?: boolean;
	maxImages?: number;
	onRemoveImage: (index: number) => void;
	loading: boolean;
	maxHeight?: number;
	maxWidth?: number;
	onPrimaryChange?: (imageId: number, isPrimary: boolean) => Promise<void>;
	aspectRatio?: number;
	carouselHeight?: number;
	carouselWidth?: number;
}

const ImageUpload = ({
	images,
	isEdit = false,
	multiple = true,
	maxImages = 10,
	onRemoveImage,
	onSave,
	loading,
	maxHeight = 400,
	maxWidth = 400,
	onPrimaryChange,
	aspectRatio = 1,
	carouselHeight = 200,
	carouselWidth = 200
}: ImageUploadProps) => {
	const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
	const [currentCropIndex, setCurrentCropIndex] = useState<number>(-1);
	const [currentImageUrl, setCurrentImageUrl] = useState<string>('');
	const [cropper, setCropper] = useState<any>(null);
	const [isModalVisible, setIsModalVisible] = useState(false);
	const [isProcessing, setIsProcessing] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [editMode, setEditMode] = useState(false);
	const [viewImageModal, setViewImageModal] = useState(false);
	const [selectedViewImage, setSelectedViewImage] = useState<any>(null);
	const [currentViewIndex, setCurrentViewIndex] = useState<number>(0);
	const [primaryChanging, setPrimaryChanging] = useState(false);
	const { showErrorNotification } = useToasterNotification();

	// Auto-close edit mode when no images left
	React.useEffect(() => {
		if (images?.length === 0) {
			setEditMode(false);
		}
	}, [images?.length]);

	const handleButtonClick = () => {
		if (fileInputRef.current) {
			fileInputRef.current.click();
		}
	};

	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (!files || files.length === 0) return;

		const validFiles: File[] = [];
		const fileArray = Array.from(files);

		// Validate files
		for (const file of fileArray) {
			if (file.name.match(/\.(jpg|jpeg|png|gif|JPG|JPEG|PNG|GIF)$/)) {
				validFiles.push(file);
			} else {
				swalFire({
					title: 'Invalid File',
					text: `${file.name} is not a valid image file!`,
					icon: 'error',
				});
			}
		}

		// Check max images limit
		if (images?.length + validFiles.length > maxImages) {
			swalFire({
				title: 'Too Many Images',
				text: `You can only upload up to ${maxImages} images. Current: ${images?.length}`,
				icon: 'warning',
			});
			return;
		}

		if (validFiles.length > 0) {
			setSelectedFiles(validFiles);
			// Start cropping the first image
			openCropModal(validFiles[0], 0);
		}

		// Reset input
		if (fileInputRef.current) {
			fileInputRef.current.value = '';
		}
	};

	const openCropModal = (file: File, index: number) => {
		const reader = new FileReader();
		reader.onload = () => {
			setCurrentImageUrl(reader.result as string);
			setCurrentCropIndex(index);
			setIsModalVisible(true);
		};
		reader.readAsDataURL(file);
	};

	const handleCropSave = async () => {
		// Prevent multiple clicks
		if (isProcessing || loading) return;

		if (cropper) {
			setIsProcessing(true);

			const croppedImage = cropper.getCroppedCanvas().toDataURL();

			try {
				// Wait for the image to be saved to backend
				await onSave(croppedImage);

				// Close edit mode when adding new images
				if (editMode) {
					setEditMode(false);
				}

				// Check if there are more images to crop
				if (currentCropIndex < selectedFiles.length - 1) {
					// Crop next image
					const nextIndex = currentCropIndex + 1;
					setTimeout(() => {
						openCropModal(selectedFiles[nextIndex], nextIndex);
						setIsProcessing(false);
					}, 100);
				} else {
					// All images cropped
					setIsModalVisible(false);
					setSelectedFiles([]);
					setCurrentCropIndex(-1);
					setCurrentImageUrl('');
					setIsProcessing(false);
				}
			} catch (error) {
				// If save fails, stop processing and keep modal open
				setIsProcessing(false);
				// Error notification is handled by the parent component (saveImages function)
			}
		}
	};

	const handleCropSkip = () => {
		// Prevent multiple clicks
		if (isProcessing || loading) return;

		setIsProcessing(true);

		// Skip current image and move to next
		if (currentCropIndex < selectedFiles.length - 1) {
			const nextIndex = currentCropIndex + 1;
			setTimeout(() => {
				openCropModal(selectedFiles[nextIndex], nextIndex);
				setIsProcessing(false);
			}, 100);
		} else {
			// No more images
			setIsModalVisible(false);
			setSelectedFiles([]);
			setCurrentCropIndex(-1);
			setCurrentImageUrl('');
			setIsProcessing(false);
		}
	};

	const handleCropClose = () => {
		setIsModalVisible(false);
		setSelectedFiles([]);
		setCurrentCropIndex(-1);
		setCurrentImageUrl('');
		setIsProcessing(false);
	};

	const handleRemoveImage = (index: number) => {
		swalFire({
			title: 'Remove Image?',
			text: 'Are you sure you want to remove this image?',
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#d33',
			cancelButtonColor: '#3085d6',
			confirmButtonText: 'Yes, remove it!',
		}).then((result) => {
			if (result.isConfirmed) {
				onRemoveImage(index);
				// Close edit mode if no images left after deletion
				if (images?.length <= 1) {
					setEditMode(false);
				}
			}
		});
	};

	const handleEditMode = () => {
		setEditMode(!editMode);
	};

	const handleImageClick = (index: number) => {
		if (images && images[index]) {
			setCurrentViewIndex(index);
			setSelectedViewImage(images[index]);
			setViewImageModal(true);
		}
	};

	const handleNextImage = () => {
		const nextIndex = (currentViewIndex + 1) % images?.length;
		setCurrentViewIndex(nextIndex);
		setSelectedViewImage(images[nextIndex]);
	};

	const handlePrevImage = () => {
		const prevIndex = (currentViewIndex - 1 + images?.length) % images?.length;
		setCurrentViewIndex(prevIndex);
		setSelectedViewImage(images[prevIndex]);
	};

	const handlePrimaryChange = async (id: number, isPrimary: boolean) => {
		if (!selectedViewImage || !onPrimaryChange) return;

		setPrimaryChanging(true);
		try {
			await onPrimaryChange(selectedViewImage.id, isPrimary);
			// Update the local state to reflect the change
			setSelectedViewImage({ ...selectedViewImage, is_primary: isPrimary });
		} catch (error) {
			showErrorNotification(error);
		} finally {
			setPrimaryChanging(false);
		}
	};

	return (
		<Card style={{
			maxWidth: maxWidth ? maxWidth + 'px' : '400px',
			margin: '0 auto 32px auto',
			borderRadius: 16,
			boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
			overflow: 'hidden',
		}}>
			<CardBody style={{ padding: 24 }}>
				<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
					<div>
						<input
							ref={fileInputRef}
							type="file"
							accept="image/*"
							multiple={multiple}
							onChange={handleFileSelect}
							style={{ display: 'none' }}
						/>

						{/* Single Image Mode (Profile Picture Style) */}
						{!multiple && (
							<SingleImageMode
								images={images}
								onButtonClick={handleButtonClick}
							/>
						)}

						{/* Multiple Images Mode (Gallery Style) */}
						{multiple && (
							<MultipleImageMode
								images={images}
								editMode={editMode}
								maxImages={maxImages}
								carouselWidth={carouselWidth}
								carouselHeight={carouselHeight}
								onEditMode={handleEditMode}
								onButtonClick={handleButtonClick}
								onImageClick={handleImageClick}
								onRemoveImage={handleRemoveImage}
							/>
						)}

						{/* Crop Modal */}
						<CropModal
							isOpen={isModalVisible}
							onClose={handleCropClose}
							currentImageUrl={currentImageUrl}
							currentCropIndex={currentCropIndex}
							totalImages={selectedFiles.length}
							isProcessing={isProcessing}
							loading={loading}
							aspectRatio={aspectRatio}
							onSave={handleCropSave}
							onSkip={handleCropSkip}
							onCropperInit={(instance) => setCropper(instance)}
						/>

						{/* View Image Modal */}
						<ViewImageModal
							isOpen={viewImageModal}
							onClose={() => setViewImageModal(false)}
							selectedImage={selectedViewImage}
							images={images}
							currentIndex={currentViewIndex}
							onNext={handleNextImage}
							onPrev={handlePrevImage}
							onPrimaryChange={onPrimaryChange}
							primaryChanging={primaryChanging}
						/>
					</div>
				</div>
			</CardBody>
		</Card>
	);
};

export default ImageUpload;
