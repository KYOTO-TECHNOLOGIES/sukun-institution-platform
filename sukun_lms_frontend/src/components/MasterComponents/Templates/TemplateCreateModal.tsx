import React, { useEffect, useState } from 'react';
import Modal, {
	ModalBody,
	ModalFooter,
	ModalHeader,
	ModalTitle,
} from '../../bootstrap/Modal';
import Button from '../../bootstrap/Button';
import Spinner from '../../bootstrap/Spinner';
import { getApiErrorMessage } from '../../../helpers/authSession';
import type { CreateTemplatePayload } from '../../../services/templatesApi';

const RESOLUTIONS = [
	{ val: 1 as const, getLabel: (land: boolean) => (land ? '1920 × 1080' : '1080 × 1920'), tag: 'Full HD' },
	{ val: 2 as const, getLabel: (land: boolean) => (land ? '1280 × 720' : '720 × 1280'), tag: 'HD' },
	{ val: 3 as const, getLabel: () => 'Custom', tag: null },
];

const ZONE_GRADIENTS = [
	'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
	'linear-gradient(135deg, #06b6d4 0%, #0e7490 100%)',
	'linear-gradient(135deg, #10b981 0%, #047857 100%)',
	'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
];

interface Props {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (payload: CreateTemplatePayload) => Promise<void>;
}

const TemplateCreateModal: React.FC<Props> = ({ isOpen, onClose, onSubmit }) => {
	const [name, setName] = useState('');
	const [loading, setLoading] = useState(false);
	const [submitError, setSubmitError] = useState('');
	const [nameFieldError, setNameFieldError] = useState('');
	const [isLandscape, setIsLandscape] = useState(true);
	const [width, setWidth] = useState(1920);
	const [height, setHeight] = useState(1080);
	const [resolution, setResolution] = useState<1 | 2 | 3>(1);
	const [description, setDescription] = useState('');
	const [previewW, setPreviewW] = useState(290);
	const [previewH, setPreviewH] = useState(163);
	const [border, setBorder] = useState(10);
	const [radius, setRadius] = useState(20);

	useEffect(() => {
		const w = Number(width);
		const h = Number(height);
		setIsLandscape(w >= h);
		const MAX = 280;
		const scale = MAX / Math.max(w, h);
		setPreviewW(Math.round(scale * w));
		setPreviewH(Math.round(scale * h));
		setBorder(Math.round(scale * 10));
		setRadius(Math.round(scale * 20));
	}, [width, height]);

	const switchOrientation = (toLandscape: boolean) => {
		if (toLandscape === isLandscape) return;
		setWidth(height);
		setHeight(width);
	};

	const pickResolution = (val: 1 | 2 | 3) => {
		setResolution(val);
		if (val === 1) {
			setWidth(isLandscape ? 1920 : 1080);
			setHeight(isLandscape ? 1080 : 1920);
		} else if (val === 2) {
			setWidth(isLandscape ? 1280 : 720);
			setHeight(isLandscape ? 720 : 1280);
		}
	};

	const clearErrors = () => {
		setSubmitError('');
		setNameFieldError('');
	};

	const handleClose = () => {
		setName('');
		setDescription('');
		setResolution(1);
		setWidth(1920);
		setHeight(1080);
		clearErrors();
		onClose();
	};

	const handleSubmit = async () => {
		if (!name.trim()) return;
		setLoading(true);
		clearErrors();
		try {
			await onSubmit({
				name: name.trim(),
				description: description.trim(),
				// orientation: isLandscape ? 'landscape' : 'portrait',
				// resolution_width: Number(width),
				// resolution_height: Number(height),
			});
			handleClose();
		} catch (err: unknown) {
			const apiErr = err as { response?: { data?: Record<string, string[] | string> } };
			const nameErrors = apiErr.response?.data?.name;
			const nameMessage = Array.isArray(nameErrors)
				? nameErrors[0]
				: typeof nameErrors === 'string'
					? nameErrors
					: '';

			if (nameMessage) {
				setNameFieldError(nameMessage);
			} else {
				setSubmitError(getApiErrorMessage(err, 'Failed to create template.'));
			}
		} finally {
			setLoading(false);
		}
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={handleClose} size='lg' isCentered isAnimation={false}>
			<ModalHeader setIsOpen={handleClose}>
				<ModalTitle id='new-template-modal'>New Template</ModalTitle>
			</ModalHeader>
			<ModalBody>
				<div className='tpl-modal-body'>
					<div className='tpl-modal-form'>
						{submitError && (
							<div className='tpl-create-error' role='alert'>
								{submitError}
							</div>
						)}

						<div className='tpl-field-group'>
							<label className='tpl-field-label' htmlFor='tpl-name'>
								Template name
							</label>
							<input
								id='tpl-name'
								className={`form-control${nameFieldError ? ' is-invalid' : ''}`}
								type='text'
								value={name}
								onChange={(e) => {
									setName(e.target.value);
									if (nameFieldError) setNameFieldError('');
									if (submitError) setSubmitError('');
								}}
								placeholder='e.g. Main lobby display'
								autoFocus
								autoComplete='off'
								aria-invalid={Boolean(nameFieldError)}
								aria-describedby={nameFieldError ? 'tpl-name-error' : undefined}
							/>
							{nameFieldError && (
								<div id='tpl-name-error' className='tpl-field-error'>
									{nameFieldError}
								</div>
							)}
						</div>
						<div className='tpl-field-group'>
							<label className='tpl-field-label' htmlFor='tpl-description'>
								Description
							</label>
							<textarea
								id='tpl-description'
								className='form-control'
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								placeholder='Optional notes'
							/>
						</div>
						{resolution === 3 && (
							<div className='tpl-field-group'>
								<label className='tpl-field-label'>Custom size (px)</label>
								<div className='tpl-custom-res-row'>
									<div className='tpl-custom-res-field'>
										<label className='tpl-custom-field-label' htmlFor='tpl-width'>Width</label>
										<input
											id='tpl-width'
											className='form-control'
											type='number'
											min={480}
											value={width}
											onChange={(e) => setWidth(Number(e.target.value))}
										/>
									</div>
									<span className='tpl-custom-sep'>×</span>
									<div className='tpl-custom-res-field'>
										<label className='tpl-custom-field-label' htmlFor='tpl-height'>Height</label>
										<input
											id='tpl-height'
											className='form-control'
											type='number'
											min={480}
											value={height}
											onChange={(e) => setHeight(Number(e.target.value))}
										/>
									</div>
								</div>
							</div>
						)}
					</div>
				</div>
			</ModalBody>
			<ModalFooter>
				<Button color='secondary' onClick={handleClose}>
					Cancel
				</Button>
				<Button
					color='primary'
					isDisable={!name.trim() || loading}
					onClick={handleSubmit}>
					{loading ? <Spinner isSmall /> : 'Create Template'}
				</Button>
			</ModalFooter>
		</Modal>
	);
};

export default TemplateCreateModal;
