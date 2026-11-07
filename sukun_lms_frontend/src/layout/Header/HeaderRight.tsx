import React, { FC, ReactNode, useContext, useEffect, useLayoutEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { useTour } from '@reactour/tour';
import Button, { IButtonProps } from '../../components/bootstrap/Button';
import { HeaderRight } from './Header';
import Icon from '../../components/icon/Icon';
import ThemeContext from '../../contexts/themeContext';
import useDarkMode from '../../hooks/useDarkMode';
import Popovers from '../../components/bootstrap/Popovers';
import { authAxios } from '../../axiosInstance';
import useToasterNotification from '../../hooks/useToasterNotification';
import Notifications from './Notification';

interface IMainHeaderRightProps {
	beforeChildren?: ReactNode;
	afterChildren?: ReactNode;
}
const EMPTY_ARRAY: any[] = [];

const MainHeaderRight: FC<IMainHeaderRightProps> = ({ beforeChildren, afterChildren }) => {
	const NotificationList = useSelector((state: any) => state.NotificationSlice?.notifications || EMPTY_ARRAY);
	const { darkModeStatus, setDarkModeStatus } = useDarkMode();
	const { fullScreenStatus, setFullScreenStatus } = useContext(ThemeContext);
	// Add state for unread count
	const [unreadCount, setUnreadCount] = useState(0);
	const updateNotification = useSelector((state: any) => state.NotificationSlice?.updateNotification || false);
	const { showSuccessNotification, showErrorNotification } = useToasterNotification();

	const styledBtn: IButtonProps = {
		color: darkModeStatus ? 'dark' : 'light',
		hoverShadow: 'default',
		isLight: !darkModeStatus,
		size: 'lg',
	};

	const [offcanvasStatus, setOffcanvasStatus] = useState(false);
	const { i18n } = useTranslation();
	/**
	 * Language attribute
	 */
	useLayoutEffect(() => {
		document.documentElement.setAttribute('lang', i18n.language.substring(0, 2));
	});

	const { setIsOpen } = useTour();
	// Add useEffect to fetch unread count
	// useEffect(() => {
	// 	const fetchUnreadCount = async () => {
	// 		try {
	// 			const response = await authAxios.get('/region/notification-users/unread-count/');
	// 			setUnreadCount(response.data.data.unread_count || 0);
	// 		} catch (error) {
	// 			showErrorNotification(Error(error))
	// 		}
	// 	};

	// 	fetchUnreadCount();

	// }, [updateNotification]);
	return (	
		<>		
		<HeaderRight>
			
			<div className='row g-3'>
				{beforeChildren}

				{/* Dark Mode */}
				<div className='col-auto'>
					<Popovers trigger='hover' desc='Dark / Light mode'>
						<Button
							// eslint-disable-next-line react/jsx-props-no-spreading
							{...styledBtn}
							onClick={() => setDarkModeStatus(!darkModeStatus)}
							className='btn-only-icon'
							data-tour='dark-mode'
							aria-label='Toggle dark mode'>
							<Icon
								icon={darkModeStatus ? 'DarkMode' : 'LightMode'}
								color={darkModeStatus ? 'info' : 'warning'}
								className='btn-icon'
							/>
						</Button>
					</Popovers>
				</div>

				{/*	Full Screen */}
				<div className='col-auto'>
					<Popovers trigger='hover' desc='Fullscreen'>
						<Button
							// eslint-disable-next-line react/jsx-props-no-spreading
							{...styledBtn}
							icon={fullScreenStatus ? 'FullscreenExit' : 'Fullscreen'}
							onClick={() => setFullScreenStatus(!fullScreenStatus)}
							aria-label='Toggle fullscreen'
						/>
					</Popovers>
				</div>

				{/*	Notifications */}
				{/* <div className='col-auto'>
					<div className='col-auto position-relative'>
						{unreadCount > 0 && (
							<div className='position-absolute start-85 mt-2 top-0 translate-middle badge rounded-pill bg-danger notification_icon_styles'>
								{unreadCount > 99 ? '99+' : unreadCount}
							</div>
						)}
						<Button
							// eslint-disable-next-line react/jsx-props-no-spreading
							{...styledBtn}
							icon='Notifications'
							onClick={() => setOffcanvasStatus(true)}
							aria-label='Notifications'
						/>

					</div>
				</div> */}
				{/*	Notifications */}
				{/* <div className='col-auto'>
				<div className='col-auto position-relative'>
                {NotificationList.length!==0&&
						<Icon
							icon='Circle'
							className='animate__animated animate__heartBeat animate__infinite animate__slower position-absolute start-65 text-danger notification_icon_styles'
							/>
					}
					<Button
						// eslint-disable-next-line react/jsx-props-no-spreading
						{...styledBtn}
						icon='Notifications'
						onClick={() => setOffcanvasStatus(true)}
						aria-label='Notifications'
						/>
					
				</div>
				</div> */}
				{afterChildren}
			</div>
			{/* {offcanvasStatus&&
		   <Notifications 
		   setIsOpen={setOffcanvasStatus} 
			isOpen={offcanvasStatus}/>
		   } */}

		</HeaderRight>
		{offcanvasStatus &&
				<Notifications
					setIsOpen={setOffcanvasStatus}
					isOpen={offcanvasStatus} />
			}
		</>
	);
};
MainHeaderRight.propTypes = {
	// @ts-ignore
	beforeChildren: PropTypes.node,
	// @ts-ignore
	afterChildren: PropTypes.node,
};
MainHeaderRight.defaultProps = {
	beforeChildren: null,
	afterChildren: null,
};

export default MainHeaderRight;
