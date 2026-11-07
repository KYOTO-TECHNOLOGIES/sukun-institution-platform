import React, { useState } from 'react';
// import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap';
import Cropper from 'react-cropper';
import 'cropperjs/dist/cropper.css';
import { useForm } from 'react-hook-form';
import swalFire from './swalHelper';
import PropTypes from 'prop-types';
import Modal, { ModalBody, ModalFooter } from '../components/bootstrap/Modal';
import { Button, ModalHeader } from 'reactstrap';

const ImageCropper = (props) => {
	const { isProfile, isFromDasboard, updateCompanyLogo } = props;
	const [image, setImage] = useState(null);
	const [cropper, setCropper] = useState(null);
	const [isModalVisible, setIsModalVisible] = useState(false);
	const ModalToggle = () => {
		setIsModalVisible(!isModalVisible);
	};
	const { register, reset } = useForm();
	const showModal = () => {
		setIsModalVisible(true);
	};

	const getCropData = () => {
		if (typeof cropper !== 'undefined') {
			if (isFromDasboard) {
				updateCompanyLogo(cropper.getCroppedCanvas().toDataURL());
			}
		}
	};
	const onChange = (e) => {
		e.preventDefault();
		const reader = new FileReader();
		const uploadedFile = e.target.files[0];
		if (uploadedFile.name.match(/\.(jpg|jpeg|png|gif|JPG|JPEG|PNG|GIF)$/)) {
			showModal();
		} else {
			swalFire({
				title: 'Oops...',
				text: 'The selected file is not an image!',
				icon: 'error',
			});
		}
		reader.onload = () => {
			setImage(reader.result);
		};
		reader.readAsDataURL(uploadedFile);
	};

	const handleOk = () => {
		if (isProfile) {
			reset({ imageInput: null });
		}
		setIsModalVisible(false);
		getCropData();
	};

	return (
		<>
			<input
				className={`form-control ${isProfile && 'form-control-sm'}`}
				id='customFile'
				accept='image/*'
				{...register('imageInput')}
				onChange={onChange}
				type='file'
			// capture='environment'
			/>

			<Modal centered isOpen={isModalVisible} setIsOpen={setIsModalVisible}>
				<ModalHeader toggle={ModalToggle}>Crop the Profile Picture</ModalHeader>
				<ModalBody>
					{' '}
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
					<br />
					<p>Scroll for zooming in and out...</p>
				</ModalBody>
				<ModalFooter>
					<Button
						type='button'
						id='custom-imagecropper-close'
						color='danger'
						className='w-xs waves-effect waves-light me-1'
						onClick={ModalToggle}>
						Close
					</Button>
					<Button
						type='button'
						color='primary'
						id='custom-imagecropper-save'
						className='w-xs waves-effect waves-light me-1'
						onClick={handleOk}>
						Save
					</Button>
				</ModalFooter>
			</Modal>
		</>
	);
};

/* eslint-disable react/forbid-prop-types */

ImageCropper.propTypes = {
	isProfile: PropTypes.bool.isRequired,
	isFromDasboard: PropTypes.bool.isRequired,
	updateCompanyLogo: PropTypes.func.isRequired,
};
/* eslint-enable react/forbid-prop-types */
export default ImageCropper;
