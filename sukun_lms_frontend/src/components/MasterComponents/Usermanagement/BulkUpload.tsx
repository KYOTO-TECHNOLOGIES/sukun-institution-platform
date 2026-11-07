import React, { FC } from 'react';
import { BulkUploadOffCanvas } from '../../CustomComponent/BulkUpload';

interface BulkUploadProps {
	isOpen: boolean;
	setIsOpen: (isOpen: boolean) => void;
	tableRef: any;
	title: string;
}

const BULK_UPLOAD_URL = '/api/users/bulk-user-creation/';

const BulkUpload: FC<BulkUploadProps> = ({ isOpen, setIsOpen, tableRef, title }) => {
	return (
		<BulkUploadOffCanvas
			isOpen={isOpen}
			setIsOpen={setIsOpen}
			title={title}
			uploadUrl={BULK_UPLOAD_URL}
			templateDownloadUrl={BULK_UPLOAD_URL}
			tableRef={tableRef}
		/>
	);
};

export default BulkUpload;
