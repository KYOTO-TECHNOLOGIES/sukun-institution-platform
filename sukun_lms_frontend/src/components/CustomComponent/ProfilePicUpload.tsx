import React, { useContext, useState } from 'react';
//@ts-ignore
import ProfilePic from "../../assets/img/Avatar.svg"
import ImageCropper from '../../helpers/imageCropper';
import Icon from '../../components/icon/Icon';
import Avatar from '../../components/Avatar';
import base64toFile from '../../helpers/base64toFile';
import { authAxiosFileUpload } from '../../axiosInstance';
import AuthContext from '../../contexts/authContext';
import { Spinner } from 'reactstrap';
import useToasterNotification from '../../hooks/useToasterNotification';
import urlMaker from '../../helpers/UrlMaker';
import Profile from '../../assets/img/Avatar.svg';


const ProfilePicUpload = ({ image, setImage, isProfile = false, isEdit = false }: any) => {
	const [waitingForAxios, setWaitingForAxios] = useState(false)
	const { userData, setUserData } = useContext(AuthContext);
	const { showErrorNotification } = useToasterNotification();

	const updateAvatar = (updateImage: any) => {
		if (isProfile || isEdit) {
			setWaitingForAxios(true);
			const url = `api/users/profile/`;
			const payload = {
				avatar: updateImage
			}
			authAxiosFileUpload
				.patch(url, payload)
				.then((res) => {
					setWaitingForAxios(false);
					if (isProfile) {
						setUserData((prev: any) => ({ ...prev, avatar: res.data?.avatar, avatar_thumbnail: res.data?.avatar_thumbnail }))
					}
					setImage(res.data?.avatar)
				})
				.catch((error) => {
					setWaitingForAxios(false);
					setImage(null)
					showErrorNotification(error)

				});

		}
		else {
			setImage(updateImage)

		}


	}
	const handleButtonClick = () => {
		if (!waitingForAxios) {
			const input = document.getElementById("customFile");
			if (input !== null) {
				input.click();
			}
		}

	};




	//   const imageFromHook = useImageHandler(!isBase64Image(image) ? image : null, '');

	const getAvatarSrc = () => {
		if (userData?.avatar) {
			return urlMaker(userData.avatar, 'avatars');
		}
		if (image) {
			return image;
		}
		return Profile;
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
					{isProfile &&
						<div
							onClick={() => !waitingForAxios && handleButtonClick()}
							className='profile-pic-button'>
							{
								waitingForAxios ?
									<Spinner size='sm' color='white' />
									:
									<Icon icon='Edit' color='light' size='lg' />
							}
						</div>}


					<Avatar srcSet={avatarSrc} src={avatarSrc} size={140} />
				</div>
				{/* eslint-enable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
			</div>
		</div>

	);
};

export default ProfilePicUpload