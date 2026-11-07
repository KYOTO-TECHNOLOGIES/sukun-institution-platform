import React, { useEffect, useState } from 'react';
import Modal, {
	ModalBody,
	ModalFooter,
	ModalHeader,
	ModalTitle,
} from '../../bootstrap/Modal';
import Button from '../../bootstrap/Button';
import Spinner from '../../bootstrap/Spinner';
import TemplateCardTile from '../Templates/TemplateCardTile';
import type { CreateScreenTemplatePayload } from '../../../services/screenTemplatesApi';
import { templatesApi, type Template } from '../../../services/templatesApi';

interface Props {
	isOpen: boolean;
	screenId: number;
	defaultOrder: number;
	onClose: () => void;
	onSubmit: (payload: CreateScreenTemplatePayload) => Promise<void>;
}

const noop = () => undefined;

const ScreenAssignTemplateModal: React.FC<Props> = ({
	isOpen,
	screenId,
	defaultOrder,
	onClose,
	onSubmit,
}) => {
	const [templates, setTemplates] = useState<Template[]>([]);
	const [templatesLoading, setTemplatesLoading] = useState(false);
	const [templateId, setTemplateId] = useState<number | ''>('');
	const [interval, setInterval] = useState(30);
	const [order, setOrder] = useState(defaultOrder);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (!isOpen) return;
		setOrder(defaultOrder);
		setTemplatesLoading(true);
		templatesApi
			.list({ limit: 200 })
			.then((res) => setTemplates(res.results ?? []))
			.catch(() => setTemplates([]))
			.finally(() => setTemplatesLoading(false));
	}, [isOpen, defaultOrder]);

	const handleClose = () => {
		setTemplateId('');
		setInterval(30);
		setOrder(defaultOrder);
		onClose();
	};

	const handleToggleSelect = (template: Template) => {
		setTemplateId((current) => (current === template.id ? '' : template.id));
	};

	const handleSubmit = async () => {
		if (templateId === '') return;
		setLoading(true);
		try {
			await onSubmit({
				screen: screenId,
				template: templateId,
				interval: Math.max(1, interval),
				order: Math.max(1, order),
			});
			handleClose();
		} finally {
			setLoading(false);
		}
	};

	const selectedTemplate = templates.find((item) => item.id === templateId);

	return (
		<Modal isOpen={isOpen} setIsOpen={handleClose} size='xl' isCentered>
			<ModalHeader setIsOpen={handleClose}>
				<ModalTitle id='assign-screen-template-modal'>Assign template</ModalTitle>
			</ModalHeader>
			<ModalBody>
				<div className='mb-3'>
					<label className='form-label'>Select a template</label>
					{templatesLoading ? (
						<div className='text-muted py-4 text-center'>
							<Spinner isSmall /> Loading templates...
						</div>
					) : templates.length === 0 ? (
						<div className='text-muted py-4 text-center'>No templates available.</div>
					) : (
						<div className='screen-assign-template-grid'>
							<div className='tpl-grid'>
								{templates.map((item) => (
									<TemplateCardTile
										key={item.id}
										template={item}
										thumbSize={120}
										pickMode
										isSelected={templateId === item.id}
										onOpen={handleToggleSelect}
										onToggleSelect={handleToggleSelect}
										onDelete={noop}
									/>
								))}
							</div>
						</div>
					)}
					{selectedTemplate && (
						<div className='screen-assign-template-selected text-muted small mt-2'>
							Selected: <strong>{selectedTemplate.template_name}</strong>
						</div>
					)}
				</div>
				<div className='row g-3'>
					<div className='col-sm-6'>
						<label className='form-label' htmlFor='screen-assign-interval'>
							Interval (minutes)
						</label>
						<input
							id='screen-assign-interval'
							className='form-control'
							type='number'
							min={1}
							value={interval}
							onChange={(e) => setInterval(Number(e.target.value) || 1)}
						/>
					</div>
					<div className='col-sm-6'>
						<label className='form-label' htmlFor='screen-assign-order'>
							Order
						</label>
						<input
							id='screen-assign-order'
							className='form-control'
							type='number'
							min={1}
							value={order}
							onChange={(e) => setOrder(Number(e.target.value) || 1)}
						/>
					</div>
				</div>
			</ModalBody>
			<ModalFooter>
				<Button
					color='primary'
					isDisable={templateId === '' || loading || templatesLoading}
					onClick={handleSubmit}>
					{loading ? <Spinner isSmall /> : 'Assign template'}
				</Button>
				<Button color='light' onClick={handleClose}>
					Cancel
				</Button>
			</ModalFooter>
		</Modal>
	);
};

export default ScreenAssignTemplateModal;
