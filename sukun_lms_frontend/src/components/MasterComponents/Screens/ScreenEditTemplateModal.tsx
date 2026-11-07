import React, { useEffect, useMemo, useState } from 'react';
import Modal, {
	ModalBody,
	ModalFooter,
	ModalHeader,
	ModalTitle,
} from '../../bootstrap/Modal';
import Button from '../../bootstrap/Button';
import Spinner from '../../bootstrap/Spinner';
import TemplateCardTile from '../Templates/TemplateCardTile';
import type { ScreenTemplateAssignment, UpdateScreenTemplatePayload } from '../../../services/screenTemplatesApi';
import { getScreenTemplateId, getScreenTemplateName } from '../../../services/screenTemplatesApi';
import type { Template } from '../../../services/templatesApi';

interface Props {
	isOpen: boolean;
	assignment: ScreenTemplateAssignment | null;
	template?: Template | null;
	onClose: () => void;
	onSubmit: (assignmentId: number, payload: UpdateScreenTemplatePayload) => Promise<void>;
}

const noop = () => undefined;

const ScreenEditTemplateModal: React.FC<Props> = ({
	isOpen,
	assignment,
	template,
	onClose,
	onSubmit,
}) => {
	const [interval, setInterval] = useState(30);
	const [order, setOrder] = useState(1);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (!assignment || !isOpen) return;
		setInterval(assignment.interval);
		setOrder(assignment.order);
	}, [assignment, isOpen]);

	const displayTemplate = useMemo((): Template | null => {
		if (!assignment) return null;
		if (template) return template;
		return {
			id: getScreenTemplateId(assignment),
			template_name: getScreenTemplateName(assignment),
			orientation: 'landscape',
			resolution_width: 1920,
			resolution_height: 1080,
		};
	}, [assignment, template]);

	const handleClose = () => {
		onClose();
	};

	const handleSubmit = async () => {
		if (!assignment) return;
		setLoading(true);
		try {
			await onSubmit(assignment.id, {
				interval: Math.max(1, interval),
				order: Math.max(1, order),
			});
			handleClose();
		} finally {
			setLoading(false);
		}
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={handleClose} isCentered>
			<ModalHeader setIsOpen={handleClose}>
				<ModalTitle id='edit-screen-template-modal'>Edit template</ModalTitle>
			</ModalHeader>
			<ModalBody className='screen-edit-template-body'>
				{displayTemplate && (
					<div className='screen-edit-template-layout'>
						<div className='screen-edit-template-card'>
							<TemplateCardTile
								template={displayTemplate}
								thumbSize={96}
								readOnly
								isSelected
								pickMode
								onOpen={noop}
								onToggleSelect={noop}
								onDelete={noop}
							/>
						</div>
						<div className='screen-edit-template-fields'>
							<div>
								<label className='form-label' htmlFor='screen-edit-interval'>
									Interval (minutes)
								</label>
								<input
									id='screen-edit-interval'
									className='form-control'
									type='number'
									min={1}
									value={interval}
									onChange={(e) => setInterval(Number(e.target.value) || 1)}
								/>
							</div>
							<div>
								<label className='form-label' htmlFor='screen-edit-order'>
									Order
								</label>
								<input
									id='screen-edit-order'
									className='form-control'
									type='number'
									min={1}
									value={order}
									onChange={(e) => setOrder(Number(e.target.value) || 1)}
								/>
							</div>
						</div>
					</div>
				)}
			</ModalBody>
			<ModalFooter>
				<Button color='primary' isDisable={!assignment || loading} onClick={handleSubmit}>
					{loading ? <Spinner isSmall /> : 'Save changes'}
				</Button>
				<Button color='light' onClick={handleClose}>
					Cancel
				</Button>
			</ModalFooter>
		</Modal>
	);
};

export default ScreenEditTemplateModal;
