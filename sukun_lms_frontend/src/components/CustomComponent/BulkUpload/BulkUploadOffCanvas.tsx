import React, { FC, useState } from 'react';
import { useForm } from 'react-hook-form';
import { authAxios } from '../../../axiosInstance';
import OffCanvasComponent from '../../OffCanvasComponent';
import Card, { CardBody } from '../../bootstrap/Card';
import useToasterNotification from '../../../hooks/useToasterNotification';
import BulkUploadFields from './BulkUploadFields';
import SaveIconButton from '../../CustomComponent/Buttons/SaveIconButton';

export interface BulkUploadOffCanvasProps {
	isOpen: boolean;
	setIsOpen: (isOpen: boolean) => void;
	title: string;
	uploadUrl: string;
	templateDownloadUrl: string;
	formDataFieldName?: string;
	templateFileName?: string;
	tableRef?: React.RefObject<{ onQueryChange: () => void } | null>;
	onSuccess?: () => void;
}

const BulkUploadOffCanvas: FC<BulkUploadOffCanvasProps> = ({
	isOpen,
	setIsOpen,
	title,
	uploadUrl,
	templateDownloadUrl,
	formDataFieldName = 'imported_file',
	templateFileName = 'Bulk_upload_template.xlsx',
	tableRef,
	onSuccess,
}) => {
	const { showErrorNotification } = useToasterNotification();
	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm();

	const [waitingForAxios, setWaitingForAxios] = useState(false);

	const onSubmit = (data: any) => {
		const formData = new FormData();
		formData.append(formDataFieldName, data.file[0]);
		setWaitingForAxios(true);

		authAxios
			.post(uploadUrl, formData)
			.then(() => {
				setWaitingForAxios(false);
				if (tableRef?.current) {
					tableRef.current.onQueryChange();
				}
				onSuccess?.();
				setIsOpen(false);
			})
			.catch((err) => {
				setWaitingForAxios(false);
				showErrorNotification(err);
			});
	};

	return (
		<OffCanvasComponent isOpen={isOpen} placement='end' title={title} setOpen={setIsOpen}>
			<Card>
				<CardBody>
					<BulkUploadFields
						register={register}
						errors={errors}
						templateDownloadUrl={templateDownloadUrl}
						templateFileName={templateFileName}
					/>
					<div className='row m-0'>
						<div className='col-12 p-3'>
							<SaveIconButton
								waitingForAxios={waitingForAxios}
								onClickfunc={() => handleSubmit(onSubmit)()}
							/>
						</div>
					</div>
				</CardBody>
			</Card>
		</OffCanvasComponent>
	);
};

export default BulkUploadOffCanvas;
