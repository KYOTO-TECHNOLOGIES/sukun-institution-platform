import React from 'react';

interface ThumbnailListProps {
	images: any[];
	onRemoveImage: (id: number) => void;
}

const ThumbnailList: React.FC<ThumbnailListProps> = ({ images, onRemoveImage }) => {
	return (
		<div className="text-center mt-2">
			<div className="text-muted mb-2" style={{ fontSize: '12px' }}>
				{images?.length} image{images?.length > 1 ? 's' : ''}
			</div>
			<div className="d-flex flex-wrap gap-2 justify-content-center">
				{images?.map((img, index) => (
					<div
						key={index}
						style={{
							position: 'relative',
							width: '50px',
							height: '50px',
							borderRadius: '4px',
							overflow: 'hidden',
							border: '2px solid #ddd'
						}}
					>
						<img
							src={img.image_thumbnail}
							alt={`Thumbnail ${index + 1}`}
							style={{
								width: '100%',
								height: '100%',
								objectFit: 'cover'
							}}
						/>
						<button
							onClick={() => onRemoveImage(img?.id)}
							aria-label={`Remove image ${index + 1}`}
							style={{
								position: 'absolute',
								top: '-5px',
								right: '-5px',
								background: '#dc3545',
								color: 'white',
								border: '2px solid white',
								borderRadius: '50%',
								width: '20px',
								height: '20px',
								cursor: 'pointer',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								fontSize: '12px',
								fontWeight: 'bold',
								padding: 0,
								lineHeight: 1
							}}
							type="button"
						>
							×
						</button>
					</div>
				))}
			</div>
		</div>
	);
};

export default ThumbnailList;

