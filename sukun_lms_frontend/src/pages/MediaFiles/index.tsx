import React, { useRef, useState } from 'react';
import PageWrapper from '../../layout/PageWrapper/PageWrapper';
import Page from '../../layout/Page/Page';
import MediaFilesWorkspace from '../../components/MasterComponents/MediaFiles/MediaFilesWorkspace';

type MediaPageTab = 'Media' | 'Folders';

const MediaFilesPage = () => {
	const [activeTab, setActiveTab] = useState<MediaPageTab>('Media');
	const [selectedUploadCount, setSelectedUploadCount] = useState(0);
	const uploadInputRef = useRef<HTMLInputElement>(null);

	const onUploadFilesSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
		const fileCount = event.target.files?.length ?? 0;
		setSelectedUploadCount(fileCount);
		event.target.value = '';
	};

	return (
		<PageWrapper title='Media Files'>
			<input
				ref={uploadInputRef}
				type='file'
				multiple
				accept='image/*,video/*'
				className='d-none'
				onChange={onUploadFilesSelected}
			/>
			<Page container='fluid'>
				<MediaFilesWorkspace
					activeTab={activeTab}
					setActiveTab={setActiveTab}
					selectedUploadCount={selectedUploadCount}
					onUploadClick={() => uploadInputRef.current?.click()}
				/>
			</Page>
		</PageWrapper>
	);
};

export default MediaFilesPage;
