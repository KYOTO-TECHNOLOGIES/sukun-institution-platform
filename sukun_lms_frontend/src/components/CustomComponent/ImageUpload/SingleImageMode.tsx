import React from 'react';
//@ts-ignore
import ProfilePic from "../../../assets/img/Avatar.svg";
import Icon from '../../icon/Icon';
import Avatar from '../../Avatar';

interface SingleImageModeProps {
	images: any[];
	onButtonClick: () => void;
}

const SingleImageMode: React.FC<SingleImageModeProps> = ({ images, onButtonClick }) => {
	const getDisplayImage = () => {
		if (images?.length > 0) {
			return images[0].image;
		}
		return ProfilePic;
	};

	return (
		<div className='text-center'>
			<div style={{ width: "145px", position: "relative" }}>
				{/* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
				<div
					onClick={onButtonClick}
					className='profile-pic-button'>
					<Icon icon='Edit' color='light' size='lg' />
				</div>
				<Avatar srcSet={getDisplayImage()} src={getDisplayImage()} size={140} />
			</div>
		</div>
	);
};

export default SingleImageMode;

