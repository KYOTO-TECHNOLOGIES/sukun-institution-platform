import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Cropper from 'react-cropper';
import 'cropperjs/dist/cropper.css';
import Modal, { ModalBody, ModalFooter, ModalHeader, ModalTitle } from '../bootstrap/Modal';
import Input from '../bootstrap/forms/Input';
import Button from '../bootstrap/Button';

const ImageCropperModal = (props) => {
	const { setCroppedImage } = props;
	const [isModalVisible, setIsModalVisible] = useState(false);
	const [image, setImage] = useState(null);
	const [cropper, setCropper] = useState(null);

	const handleImageChange = (e) => {
		e.preventDefault();
		const reader = new FileReader();
		const uploadedFile = e.target.files[0];
		setIsModalVisible(true);
		reader.onload = () => {
			setImage(reader.result);
		};
		reader.readAsDataURL(uploadedFile);
	};

	const getCropData = (e) => {
		e.stopPropagation();

		if (typeof cropper !== 'undefined') {
			setCroppedImage(cropper.getCroppedCanvas().toDataURL());
		}
		setIsModalVisible(false);
	};

	const deleteImage = () => {
		setImage(null);
		setCroppedImage(null);
		setIsModalVisible(false);
		// @ts-ignore
		document.getElementById('image_cropper').value = '';
	};

	return (
		<>
			<Input
				type='file'
				autoComplete='photo'
				id='image_cropper'
				accept='image/*'
				onChange={handleImageChange}
			/>
			{/* @ts-ignore */}
			<Modal isOpen={isModalVisible} setIsOpen={setIsModalVisible} size='md'>
				<ModalHeader className='p-4'>
					<ModalTitle id='image_cropper_modal_title'>Image Cropper</ModalTitle>
				</ModalHeader>
				<ModalBody className='px-4'>
					<Cropper
						style={{ height: 380, width: '100%' }}
						zoomTo={1}
						aspectRatio={1}
						preview='.img-preview'
						src={image}
						viewMode={1}
						guides
						minCropBoxHeight={10}
						minCropBoxWidth={10}
						background={false}
						responsive
						autoCropArea={1}
						checkOrientation={false}
						onInitialized={(instance) => {
							setCropper(instance);
						}}
					/>
				</ModalBody>
				<ModalFooter className='px-4 pb-4'>
					<>
						<Button color='danger' onClick={() => deleteImage()} className='me-2'>
							Close
						</Button>
						<Button color='secondary' onClick={(e) => getCropData(e)}>
							Crop
						</Button>
					</>
				</ModalFooter>
			</Modal>
		</>
	);
};

ImageCropperModal.propTypes = {
	setCroppedImage: PropTypes.func.isRequired,
};

export default ImageCropperModal;
