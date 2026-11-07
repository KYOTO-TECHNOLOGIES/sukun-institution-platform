import React, { useState } from 'react';
import Modal, {
	ModalBody,
	ModalFooter,
	ModalHeader,
	ModalTitle,
} from '../../bootstrap/Modal';
import Button from '../../bootstrap/Button';
import Spinner from '../../bootstrap/Spinner';
import Checks from '../../bootstrap/forms/Checks';
import ImageCropper from '../../CustomComponent/ImageCropper';
import dataUrlToFile from '../../../helpers/dataUrlToFile';
import type { CreateScreenPayload } from '../../../services/screensManagementApi';

interface Props {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (payload: CreateScreenPayload, backgroundImage?: File | null) => Promise<void>;
}

const noopSetValue = () => {};

const ScreenCreateModal: React.FC<Props> = ({ isOpen, onClose, onSubmit }) => {
	const [name, setName] = useState('');
	const [location, setLocation] = useState('');
	const [description, setDescription] = useState('');
	const [ipAddress, setIpAddress] = useState('');
	const [ipBind, setIpBind] = useState(false);
	const [isActive, setIsActive] = useState(true);
	const [croppedImage, setCroppedImage] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	const resetForm = () => {
		setName('');
		setLocation('');
		setDescription('');
		setIpAddress('');
		setIpBind(false);
		setIsActive(true);
		setCroppedImage(null);
	};

	const handleClose = () => {
		resetForm();
		onClose();
	};

	const handleSubmit = async () => {
		if (!name.trim()) return;
		setLoading(true);
		try {
			const payload: CreateScreenPayload = {
				name: name.trim(),
				location: location.trim(),
				description: description.trim(),
				ip_address: ipAddress.trim() || null,
				ip_bind: ipBind,
				is_active: isActive,
			};

			const backgroundFile = croppedImage
				? dataUrlToFile(croppedImage, 'background_image.jpg')
				: null;

			await onSubmit(payload, backgroundFile);
			handleClose();
		} finally {
			setLoading(false);
		}
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={handleClose} size='lg' isCentered isAnimation={false}>
			<ModalHeader setIsOpen={handleClose}>
				<ModalTitle id='new-screen-modal'>Add screen</ModalTitle>
			</ModalHeader>
			<ModalBody>
				<div className='mb-3'>
					<label className='form-label' htmlFor='screen-create-name'>
						Name
					</label>
					<input
						id='screen-create-name'
						className='form-control'
						type='text'
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder='Screen name'
						autoFocus
						autoComplete='off'
					/>
				</div>
				<div className='mb-3'>
					<label className='form-label' htmlFor='screen-create-location'>
						Location
					</label>
					<input
						id='screen-create-location'
						className='form-control'
						type='text'
						value={location}
						onChange={(e) => setLocation(e.target.value)}
						placeholder='e.g. Lobby, Counter 2'
						autoComplete='off'
					/>
				</div>
				<div className='mb-3'>
					<label className='form-label' htmlFor='screen-create-description'>
						Description
					</label>
					<textarea
						id='screen-create-description'
						className='form-control'
						rows={3}
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						placeholder='Optional notes'
					/>
				</div>
				<div className='mb-3'>
					<label className='form-label' htmlFor='screen-create-background-image'>
						Screen background image
					</label>
					<p className='form-text text-muted mb-2'>
						Optional. Upload an image and crop it; it is sent as{' '}
						<code>background_image</code> when you create the screen.
					</p>
					<div className='screen-create-background-cropper border rounded p-3 bg-light'>
						<ImageCropper
							croppedImage={croppedImage}
							setCroppedImage={setCroppedImage}
							setValue={noopSetValue}
							withoutRatio
						/>
					</div>
				</div>
				<div className='mb-3'>
					<label className='form-label' htmlFor='screen-create-ip-address'>
						IP address
					</label>
					<input
						id='screen-create-ip-address'
						className='form-control'
						type='text'
						value={ipAddress}
						onChange={(e) => setIpAddress(e.target.value)}
						placeholder='e.g. 192.168.1.100'
						autoComplete='off'
					/>
				</div>
				<Checks
					id='screen-create-ip-bind'
					type='switch'
					label='IP bind'
					checked={ipBind}
					onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIpBind(e.target.checked)}
				/>
				<Checks
					id='screen-create-active'
					type='switch'
					label='Active'
					checked={isActive}
					onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIsActive(e.target.checked)}
				/>
			</ModalBody>
			<ModalFooter>
				<Button color='secondary' onClick={handleClose}>
					Cancel
				</Button>
				<Button color='primary' isDisable={!name.trim() || loading} onClick={handleSubmit}>
					{loading ? <Spinner isSmall /> : 'Create screen'}
				</Button>
			</ModalFooter>
		</Modal>
	);
};

export default ScreenCreateModal;
