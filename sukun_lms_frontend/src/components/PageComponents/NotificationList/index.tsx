import { FC, useCallback, useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import { CardBody } from '../../bootstrap/Card';
import useDarkMode from '../../../hooks/useDarkMode';
import useToasterNotification from '../../../hooks/useToasterNotification';
import { authAxios } from '../../../axiosInstance';
import CustomPaginationButtons from '../../CustomPaginationButton';
import Icon from '../../icon/Icon';
import { useSelector, useDispatch } from 'react-redux';
// import { addDisputeTypes, editDisputeType } from '../../../store/disputeType';
import NoDataComponent from '../../CustomComponent/NoDataComponent';
// import useEmptyValue from '../../../hooks/useEmptyValue';
import AddButton from '../../CustomComponent/Buttons/AddButton';
import CustomSpinner from '../../CustomSpinner/CustomSpinner';
import no_data from '../../../assets/Lottie/no_data.json';
import ButtonWithTooltip from '../../CustomComponent/Buttons/ButtonWithTooltip';
import StatusButton from '../../CustomComponent/Buttons/StatusButton';
import Moments from '../../../helpers/Moment';
import { useNavigate } from 'react-router-dom';
import { addNotifications, toggleUpdateNotification } from '../../../store/notifications';
import ButtonFilterOnHeader from '../../CustomComponent/Filters/ButtonFilterOnHeader';
import { NoData } from '../../../helpers/constants';
import Button from '../../bootstrap/Button';
import { Tooltip } from 'reactstrap';

interface VehicleType {
	id: string;
	name: string;
	description: string;
}


const NotificationList = () => {
	const { themeStatus, darkModeStatus } = useDarkMode();

	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(10);
	const [totalItems, setTotalItems] = useState(0);
	const [isLoading, setIsLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState('');
	const abortControllerRef = useRef<AbortController | null>(null);
	const dispatch = useDispatch();
	const [notificationDetails, setNotificationDetails] = useState([]);
	const { showErrorNotification } = useToasterNotification();
	const FilterStatus = ["Unread", "Read", "All"];
	const [activeTab, setActiveTab] = useState('Unread');
	const navigate = useNavigate();
	const dark = darkModeStatus ? 'dark' : '';
	const hasUnreadNotifications = notificationDetails.some(
		(notification: any) => !notification.is_read,
	);
	// const emptyValue = useEmptyValue('');
	const fetchNotificationDetails = useCallback(async () => {
		if (abortControllerRef.current) {
			abortControllerRef.current.abort();
		}

		const controller = new AbortController();
		abortControllerRef.current = controller;
		let isMounted = true;
		setIsLoading(true);

		try {
			let query = `/region/notification-users/?limit=${itemsPerPage}&offset=${itemsPerPage * (currentPage - 1)}`;
			if (searchTerm) {
				query += `&search=${searchTerm}`;
			}

			if (activeTab !== 'All') {
				query += `&is_read=${activeTab === 'Read' ? true : false}`;
			}

			const response = await authAxios.get(query, {
				signal: controller.signal,
			});
			setTimeout(() => {
				setIsLoading(false);
			}, 300);

			if (isMounted) {
				setNotificationDetails(response.data.results || []);
				setTotalItems(response.data.count || 0);
			}
		} catch (error) {
			if (!controller.signal.aborted) {
				showErrorNotification(error);
				setNotificationDetails([]);
				setTotalItems(0);
			}
		} finally {
			// if (isMounted) {
			// 	setIsLoading(false);
			// }
		}

		return () => {
			isMounted = false;
			controller.abort();
		};
	}, [currentPage, itemsPerPage, searchTerm, dispatch, activeTab]);

	useEffect(() => {
		document.body.style.overflowX = 'hidden';
		return () => {
			document.body.style.overflowX = '';
			// dispatch(addDisputeTypes(null));
		};
	}, []);

	useEffect(() => {
		const timer = setTimeout(
			() => {
				fetchNotificationDetails();
			},
			searchTerm ? 500 : 0,
		);

		return () => {
			clearTimeout(timer);
			if (abortControllerRef.current) {
				abortControllerRef.current.abort();
			}
		};
	}, [currentPage, itemsPerPage, searchTerm]);

	useEffect(() => {
		if (searchTerm && currentPage !== 1) {
			setCurrentPage(1);
		}
	}, [searchTerm, currentPage]);

	const handlePageChange = (page: number) => {
		setCurrentPage(page);
	};

	const handleItemsPerPageChange = (perPage: number) => {
		setItemsPerPage(perPage);
		setCurrentPage(1);
	};

	const markAsRead = (id: string) => {
		const url = `/region/notification-users/${id}/mark-as-read/`
		authAxios.post(url)
			.then(() => {
				// Update the notification in the list to mark it as read
				const updatedNotifications = notificationDetails.map((notification: any) =>
					notification.id === id ? { ...notification, is_read: true } : notification
				);
				dispatch(toggleUpdateNotification());
				setNotificationDetails(updatedNotifications);
			})
			.catch(err => showErrorNotification(err))
	}


	// 4. Mark all notifications as read
	const markAllAsRead = () => {

		const url = `/region/notification-users/mark-all-as-read/`
		authAxios.post(url)
			.then(() => {
				// Update all notifications to mark them as read
				const updatedNotifications = notificationDetails.map((notification: any) => ({
					...notification,
					is_read: true
				}));
				setNotificationDetails(updatedNotifications);
				dispatch(toggleUpdateNotification());
			})
			.catch(err => showErrorNotification(err))
	}
	useEffect(() => {
		fetchNotificationDetails();
		setCurrentPage(1);

		return () => {
			setCurrentPage(1);
		};
	}, [activeTab]);
	return (
		<>

			<div className='row mb-3'>
				<div className='col-md-4 d-flex align-items-center gap-2'>
					<div style={{ width: '70%' }}>
						<ButtonFilterOnHeader
							FilterStatus={FilterStatus}
							activeTab={activeTab}
							handleFilterStatus={(status: any) => {
								setActiveTab(status)
							}}
						/>
					</div>
				</div>
				<div className='col-md-8 d-flex flex-wrap justify-content-md-end align-items-center gap-3'>
					{hasUnreadNotifications && (<Button
						color='primary'
						isLight
						rounded='pill'
						size='sm'
						icon='DoneAll'
						className='px-3 py-2 d-flex align-items-center gap-2'
						hoverShadow='sm'
						onClick={markAllAsRead}

					>
						Mark All As Read
					</Button>
					)}
					{/* <div className={`search-container me-3 ${dark}`}>
						<Icon icon='Search' className='search-icon' />
						<input
							placeholder='Search'
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className='search-input'
						/>
					</div> */}

				</div>
			</div>
			<div className='hr_line bg-light' />
			<CardBody
				className='table-responsive'
				style={{ minHeight: '50vh' }}>
				<div className="row g-3">
					{isLoading ? <div className='text-center'><CustomSpinner /></div> : notificationDetails.length > 0 ?

						notificationDetails.map((item) => (
							<div key={item.id} className='cursor-pointer' onClick={() => navigate(`/notifications/${item.id}`)}>
								<div className='d-flex gap-3 align-items-center justify-content-between py-4 border-bottom'>
									<div className='d-flex gap-3 align-items-center'>
										<div className='d-flex align-items-center justify-content-center  p-3 rounded-circle'
											style={{ backgroundColor: '#EBEBEB' }}
										>
											<Icon icon='NotificationIcon' size='2x' />
										</div>
										<div>

											<small className=' fs-5'>{item?.notification?.title ? item?.notification?.title : 'No title'}</small>

											{/* <p
								  className='mt-2 mb-2'
								  style={{
									display: '-webkit-box',
									WebkitLineClamp: 3,
									WebkitBoxOrient: 'vertical',
									overflow: 'hidden',
									textOverflow: 'ellipsis',
									wordBreak: 'break-word'
								  }}
								>
								  {data?.alert_message}
								</p> */}
											<p className='mt-1 m-0' style={{ fontWeight: 'normal', whiteSpace: 'pre-wrap', fontSize: '12px' }}>
												{Moments(item?.delivered_at, 'relativetime')}
											</p>
										</div>
									</div>
									<div>

										<ButtonWithTooltip
											TooltipTitle={item.is_read ? 'Read' : 'Mark as Read'}
											onClick={(e) => {
												e.stopPropagation();
												markAsRead(item.id);
											}}
											icon={item.is_read ? 'DoneAll' : 'DoneAll'}
											color={item.is_read ? 'secondary' : 'primary'}
											isLight={true}
											className="px-2 py-1"
											style={{ fontSize: '12px' }}
											isDisable={item.is_read}
										/>
									</div>
								</div>

							</div>
						)) : <div className=''><NoDataComponent lottie={no_data} description='No notifications found' /></div>}
				</div>
			</CardBody>

			<CustomPaginationButtons
				totalCount={totalItems}
				label='items'
				setCurrentPage={handlePageChange}
				currentPage={currentPage}
				perPage={itemsPerPage}
				setPerPage={handleItemsPerPageChange}
			/>
		</>
	);
};

NotificationList.defaultProps = {
	isFluid: false,
};

export default NotificationList;
