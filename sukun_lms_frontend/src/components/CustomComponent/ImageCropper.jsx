import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Tooltip } from '@mui/material';
import Cropper from 'react-cropper';
import 'cropperjs/dist/cropper.css';
import Input from '../bootstrap/forms/Input';
import Button from '../bootstrap/Button';
import PlaceholderImage from '../extras/PlaceholderImage';
import useDarkMode from '../../hooks/useDarkMode';

const ImageCropper = (props) => {
	const { setCroppedImage, croppedImage, withoutRatio,setValue } = props;
	const [isSave, setSave] = useState(false);
	const [image, setImage] = useState(null);
	const [cropper, setCropper] = useState(null);
	const { darkModeStatus } = useDarkMode();

	const handleImageChange = (e) => {
		e.preventDefault();
		const reader = new FileReader();
		const uploadedFile = e.target.files[0];
		reader.onload = () => {
			setImage(reader.result);
		};
		reader.readAsDataURL(uploadedFile);
	};

	const getCropData = () => {
		setSave(true);
		if (typeof cropper !== 'undefined') {
			setCroppedImage(cropper.getCroppedCanvas().toDataURL());
		}
	};
	const deleteImage = () => {
		setImage(null);
		setCroppedImage(null);
		setSave(false);
		setValue('is_delete_image',true)
	};

	const renderContent = () => {
		if (croppedImage) {
			return (
				<div>
					<img
						src={croppedImage}
						alt=''
						width={128}
						height={128}
						className='mx-auto d-block img-fluid mb-3'
					/>
					<div className='text-center'>
						{/* <Tooltip arrow title='Delete'>
							<IconButton onClick={() => deleteImage()}>
								<DeleteIcon />
							</IconButton>
						</Tooltip> */}
						<Tooltip arrow title='Delete' placement='right'>
							<Button
								isOutline={false}
								color={darkModeStatus ? 'light' : 'dark'}
								isLight
								size='sm'
								className={classNames('text-nowrap', {
									'border-light': false,
								})}
								icon='Delete'
								onClick={() => deleteImage()}
							/>
						</Tooltip>
					</div>
				</div>
			);
		}
		if (image === null) {
			return (
				<>
					<PlaceholderImage
						width={128}
						height={128}
						className='mx-auto d-block img-fluid mb-5 rounded'
					/>
					<Input
						type='file'
						autoComplete='photo'
						id='image_cropper'
						accept='image/*'
						className='mt-4'
						onChange={handleImageChange}
						style={{ height: '35px' }}
					/>
				</>
			);
		}

		if (image && !isSave) {
			return (
				<>
					<h5 className='text-muted'>Please crop your image</h5>
					<Cropper
						style={{ height: 300, width: '100%' }}
						zoomTo={1}
						aspectRatio={withoutRatio ? null : 1}
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
				</>
			);
		}
     return null
		// This part will execute if the above conditions are false
	};

	useEffect(() => {
		return () => {
			setImage(null);
			setCroppedImage(null);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<>
			{renderContent()}

			<div className='mt-3 d-flex justify-content-end'>
				{!isSave && image && (
					<>
						<Button color='danger' onClick={() => deleteImage()} className='me-2'>
							Close
						</Button>
						<Button color='secondary' onClick={() => getCropData()}>
							Crop
						</Button>
					</>
				)}
			</div>
		</>
	);
};
/* eslint-disable react/forbid-prop-types */
ImageCropper.propTypes = {
	setCroppedImage: PropTypes.func.isRequired,
	croppedImage: PropTypes.any,
	withoutRatio: PropTypes.bool,
	setValue: PropTypes.func.isRequired,

};
/* eslint-enable react/forbid-prop-types */

ImageCropper.defaultProps = {
	withoutRatio: false,
	croppedImage: null,
};
export default ImageCropper;
