import React from 'react';
import FormGroup from '../../bootstrap/forms/FormGroup';
import { authAxios } from '../../../axiosInstance';
import useToasterNotification from '../../../hooks/useToasterNotification';
import { CardTitle } from '../../bootstrap/Card';

export interface BulkUploadFieldsProps {
	register: any;
	errors: any;
	templateDownloadUrl: string;
	templateFileName?: string;
}

const BulkUploadFields: React.FC<BulkUploadFieldsProps> = ({
	register,
	errors,
	templateDownloadUrl,
	templateFileName = 'Bulk_upload_template.xlsx',
}) => {
	const { showErrorNotification } = useToasterNotification();

	const handleDownload = async () => {
		authAxios
			.get(templateDownloadUrl, {
				responseType: 'arraybuffer',
			})
			.then((response) => {
				const blob = new Blob([response.data], {
					type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
				});
				const url = window.URL.createObjectURL(blob);
				const link = document.createElement('a');
				link.href = url;
				link.setAttribute('download', templateFileName);
				document.body.appendChild(link);
				link.click();
				link.remove();
				window.URL.revokeObjectURL(url);
			})
			.catch((err) => {
				showErrorNotification(err);
			});
	};

	return (
		<>
			<div className='col-12 gap-4'>
				<FormGroup label='Upload a File *'>
					<CardTitle className='text-muted fw-normal fs-6 mb-3'>
						Click on the provided link to download the sample{' '}
						<span
							style={{
								color: '#0d6efd',
								cursor: 'pointer',
								textDecoration: 'underline',
							}}
							onClick={handleDownload}>
							{templateFileName}
						</span>{' '}
						to ensure quick and error-free data upload.
					</CardTitle>
					<input
						type='file'
						className={
							errors?.file?.type === 'required' ? 'form-control is-invalid' : 'form-control'
						}
						{...register('file', {
							required: true,
						})}
					/>
					{errors?.file && <span style={{ color: 'red' }}>{errors.file.message}</span>}
				</FormGroup>
			</div>
		</>
	);
};

export default BulkUploadFields;
