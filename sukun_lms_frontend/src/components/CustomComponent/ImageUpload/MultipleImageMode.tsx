import React from 'react';
import { Tooltip } from '@mui/material';
import Icon from '../../icon/Icon';
// import Carousel from '../Carousel/Carousel';
import noimage from '../../../assets/img/no_image.png';
import ThumbnailList from './ThumbnailList';
import Carousel from '../Carousel/Carousel';

interface MultipleImageModeProps {
	images: any[];
	editMode: boolean;
	maxImages: number;
	carouselWidth: number;
	carouselHeight: number;
	onEditMode: () => void;
	onButtonClick: () => void;
	onImageClick: (index: number) => void;
	onRemoveImage: (id: number) => void;
}

const MultipleImageMode: React.FC<MultipleImageModeProps> = ({
	images,
	editMode,
	maxImages,
	carouselWidth,
	carouselHeight,
	onEditMode,
	onButtonClick,
	onImageClick,
	onRemoveImage,
}) => {
	return (
		<div>
			<div className="d-flex flex-wrap flex-column gap-3 mb-3 align-items-center justify-content-center">
				<div style={{ width: carouselWidth + 'px', height: carouselHeight + 'px', position: 'relative' }}>
					{images && images?.length > 0 ? (
						<Carousel
							key={`carousel-${images?.length}-${images?.map(i => i?.id).join('-')}`}
							items={images.map(
								(img, idx) => ({
									src: img.image_thumbnail,
									altText: `Image ${idx + 1}`,
								}),
							)}
							height={carouselHeight}
							isIndicators
							isControl
							rounded={0}
							isFluid={false}
							onImageClick={onImageClick}
						/>
					) : (
						<div className="text-center" style={{ width: carouselWidth + 'px', height: carouselHeight + 'px' }}>
							<img
								src={noimage}
								alt="No image"
								style={{
									width: '100%',
									height: '100%',
									objectFit: 'cover',
									borderRadius: 10
								}}
							/>
						</div>
					)}
				</div>
				<div className='d-flex gap-2'>
					{images?.length > 0 && (
						<Tooltip arrow title={editMode ? 'Close Edit Mode' : 'Remove Images'}>
							<div
								onClick={onEditMode}
								style={{
									backgroundColor: editMode ? '#dc3545' : '#42B7A5',
									padding: '11px',
									borderRadius: '50%',
									height: '40px',
									width: '40px',
									cursor: 'pointer',
									transition: 'all 0.2s ease',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center'
								}}
							>
								<Icon
									icon={editMode ? "Close" : "Delete"}
									size="lg"
									style={{
										color: 'white',
									}}
								/>
							</div>
						</Tooltip>
					)}
					{images?.length < maxImages && (
						<Tooltip arrow title={'Upload New Image'}>
							<label
								htmlFor="imageUpload"
								onClick={onButtonClick}
							>
								<div style={{
									backgroundColor: '#42B7A5',
									padding: '11px',
									borderRadius: '50%',
									height: '40px',
									width: '40px',
									cursor: 'pointer',
									transition: 'all 0.2s ease'
								}}>
									<Icon
										icon="Upload"
										size="lg"
										style={{
											color: 'white',
										}}
									/>
								</div>
							</label>
						</Tooltip>
					)}
				</div>
			</div>
			{images?.length > 0 && editMode && (
				<ThumbnailList images={images} onRemoveImage={onRemoveImage} />
			)}
		</div>
	);
};

export default MultipleImageMode;

