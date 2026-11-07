import React, { useContext, useState } from 'react';
//@ts-ignore
import ProfilePic from "../../assets/img/Avatar.svg"
import ImageCropper from '../../helpers/imageCropper';
import Icon from '../icon/Icon';
import Avatar from '../Avatar';


const ProfilePicUploadWithState = ({ image, setImage,isEdit = false }: any) => {

	const updateAvatar = (updateImage: any) => {
		
			setImage(updateImage)

	}
	const handleButtonClick = () => {
			const input = document.getElementById("customFile");
			if (input !== null) {
				input.click();
			}

	};




	//   const imageFromHook = useImageHandler(!isBase64Image(image) ? image : null, '');

	const getAvatarSrc = () => {
		if (!image) {
			return ProfilePic;
		}
		return image;
		// if (isBase64Image(image)) {
		// 	return image;
		// }
		// return imageFromHook || Profile;
	};

	// const getAvatarSrc = () => {
	//   if (typeof image === 'string' &&
	// 	  image.startsWith('data:image/') &&
	// 	  image.includes(';base64,')) {
	// 	return image;
	//   } else {
	// 	return imageFromHook || Profile;
	//   }
	// };



	// Use this function to get the source
	const avatarSrc = getAvatarSrc();



	return (
		<div >
			<div style={{ display: "none" }} >
				<ImageCropper
					isProfile
					updateCompanyLogo={updateAvatar}
					isFromDasboard
				/>
			</div>
			<div className='text-center'>

				<div style={{ width: "145px", position: "relative" }} >
					{/* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
					<div
						onClick={() => handleButtonClick()}
						className='profile-pic-button'>
								<Icon icon='Edit' color='light' size='lg' />
					</div>


					<Avatar srcSet={avatarSrc} src={avatarSrc} size={140} />
				</div>
				{/* eslint-enable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
			</div>
		</div>

	);
};

export default ProfilePicUploadWithState