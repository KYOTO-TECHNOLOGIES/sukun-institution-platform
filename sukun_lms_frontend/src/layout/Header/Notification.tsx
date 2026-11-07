import React, { FC, useContext, useEffect, useState } from 'react'
import { Player } from '@lottiefiles/react-lottie-player';
import { useSelector, useDispatch } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';

import Alert from '../../components/bootstrap/Alert';
import Button from '../../components/bootstrap/Button';
import useDarkMode from '../../hooks/useDarkMode';
import fileDownloader from '../../helpers/FileDownloader';
import { addNotifications, deleteReportNotification, toggleUpdateNotification } from '../../store/notifications';
import noNotification from "../../assets/Lottie/notification.json"
import Icon from '../../components/icon/Icon';
import { authAxios } from '../../axiosInstance';
import showNotification from '../../components/extras/showNotification';
import Error from '../../helpers/Error';
import AuthContext from '../../contexts/authContext';
import useToasterNotification from '../../hooks/useToasterNotification';
import ButtonFiltter from '../../components/CustomComponent/Filters/ButtonFiltter';
import { useCallback } from 'react';
import { Tooltip } from '@mui/material';
import { baseURL } from '../../helpers/baseURL';
import { Offcanvas, OffcanvasHeader, OffcanvasBody } from 'reactstrap';
import CustomSpinner from '../../components/CustomSpinner/CustomSpinner';
import Moments from '../../helpers/Moment';
import { useNavigate } from 'react-router-dom';
import ButtonFilterOnHeader from '../../components/CustomComponent/Filters/ButtonFilterOnHeader';
import Modal, { ModalBody, ModalHeader, ModalTitle } from '../../components/bootstrap/Modal';

const dummyData = [
  {
    id: 1,
    title: 'This is a test notification',
    alert_message: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos.',
    created_time: '2021-01-01',
    is_read: 'true',
    notification: {
      title: 'This is a test notification',
      body: 'This is a test notification',
      created_time: '2021-01-01',
    }
  },
  {
    id: 2,
    title: 'This is a test notification',
    alert_message: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos.',
    created_time: '2021-01-01',
    is_read: 'false',
    notification: {
      title: 'This is a test notification',
      body: 'This is a test notification',
      created_time: '2021-01-01',
    }
  },
]
const Notifications: FC<any> = ({ isOpen, setIsOpen }) => {

  const { showErrorNotification } = useToasterNotification()
  const dispatch = useDispatch()
  // Simplified state management
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState('Unread');
  const navigate = useNavigate();
  // Filter options
  const filterOptions = ['Unread', 'Read', 'All'];



  // Fetch notifications when filter or debounced search changes
  useEffect(() => {
    if (isOpen) {

      fetchNotifications(true);
    }
  }, [isOpen, activeFilter]);



  const fetchNotifications = async (reset = false) => {
    if (loading) return;

    setLoading(true);
    try {

      const params: any = {
        limit: 10,
      };
      // Add filter parameters based on activeFilter
      switch (activeFilter) {
        case 'Read':
          params.is_read = true;
          break;
        case 'Unread':
          params.is_read = false;
          break;
        case 'All':
        default:
          break;
      }

      const response = await authAxios.get('/region/notification-users', {
        params: params,
      });

      const newNotifications = response.data.results || response.data;

      // Transform the API response
      const transformedNotifications = newNotifications.map((item: any) => ({
        id: item.id,
        // alert_type: item.notification?.kind || 'INFO',
        title: item.notification?.title || 'No title',
        alert_message: item.notification?.message || 'No message',
        // severity: item.notification?.severity || 'INFO',
        created_time: item?.delivered_at,
        is_read: item.is_read,
        // dismissed: item.dismissed,
        notification: item.notification
      }));



      if (reset) {
        setNotifications(transformedNotifications);
      } else {
        const updatedNotifications = [...notifications, ...transformedNotifications];
        setNotifications(updatedNotifications);
      }


    } catch (error) {
      showErrorNotification(error);
    } finally {
      setLoading(false);
    }
  };

  // Update the filter change handler
  const handleFilterChange = (newFilter: string) => {
    setActiveFilter(newFilter);
  };
  // Determine which notifications to display
  const displayNotifications = notifications;


  const markAsRead = (id: string) => {
    const url = `/region/notification-users/${id}/mark-as-read/`
    authAxios.post(url)
      .then(() => {
        // Update the notification in the list to mark it as read
        const updatedNotifications = notifications.map((notification: any) =>
          notification.id === id ? { ...notification, is_read: true } : notification
        );

        setNotifications(updatedNotifications);

        dispatch(toggleUpdateNotification());
      })
      .catch(err => showErrorNotification(err))
  }


  const handleNotificationClick = (id: string) => {
    navigate(`/notifications/${id}`);
    setIsOpen(false);
  }
  const handleClose = () => {
    setIsOpen(false);
  }
  return (
    <>
      <Modal
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        id="notificationDetailModal"
        titleId="notificationDetailModalTitle"
        isPositionRight={true}
	// @ts-ignore
        size="md"
      >
        <div className='position-absolute top-0 end-0 p-2'>
          <Button
            size='lg'
            onClick={() => setIsOpen(false)}
            icon='Close'
          />
        </div>
        <div className='p-2'>

          <div className='d-flex flex-column justify-content-between  p-4 pb-0'>

            <div className='m-0 fs-2 fw-semibold'>
              Notifications

            </div>
            <div className=' py-2 pb-4 border-bottom' style={{ marginLeft: '-6px' }}>
              <ButtonFilterOnHeader
                FilterStatus={filterOptions}
                activeTab={activeFilter}
                handleFilterStatus={(status: any) => {
                  handleFilterChange(status)
                }}
              />
            </div>
          </div>






          <ModalBody
            style={{
              maxHeight: '50vh',
              overflowY: 'auto',
              padding: '1rem'
            }}
            // onScroll={handleScroll}
            className='pt-0'
          >
            {
              loading ? (
                <div className='text-center h-100'>
                  <CustomSpinner />
                </div>
              ) :
                displayNotifications.length === 0 ? (
                  <div className='text-center'>
                    <Player
                      autoplay
                      loop
                      src={noNotification}
                      style={{ height: '200px' }}
                    />
                    <p className='text-muted mt-3'>
                      No notifications found!
                    </p>
                  </div>
                ) : (
                  <>
                    {displayNotifications.map((data: any) => (
                      <div key={data.id} onClick={() => handleNotificationClick(data.id)}
                        className='cursor-pointer'

                      >
                        <div className='d-flex gap-3 align-items-center justify-content-between py-4 border-bottom'>
                          <div className='d-flex gap-3 align-items-center'>
                            <div className='d-flex align-items-center justify-content-center  p-3 rounded-circle'
                              style={{ backgroundColor: '#EBEBEB' }}
                            >
                              <Icon icon='NotificationIcon' size='2x' />
                            </div>
                            <div>

                              <small className=' fs-5'>{data?.notification?.title ? data?.notification?.title : 'No title'}</small>
                              <p className='mt-1 m-0' style={{ fontWeight: 'normal', whiteSpace: 'pre-wrap', fontSize: '12px' }}>
                                {Moments(data?.created_time, 'relativetime')}
                              </p>
                            </div>
                          </div>
                          <div>
                            <Tooltip title={data.is_read ? 'Read' : 'Mark as Read'} arrow>
                              <Button
                                size='sm'
                                color={data.is_read ? 'secondary' : 'primary'}
                                onClick={(e) => {
                                  // @ts-ignore
                                  e.stopPropagation();
                                  markAsRead(data.id);
                                }}
                                className='px-2 py-1'
                                style={{ fontSize: '12px' }}
                                isLight={true}
                                icon='DoneAll'
                                isDisable={data.is_read}

                              />
                            </Tooltip>
                          </div>
                        </div>

                      </div>
                    ))}

                    <div className='d-flex justify-content-center mt-3'>
                      <a
                        className='px-3 d-inline-flex align-items-center gap-2 fw-semibold text-primary cursor-pointer'
                        onClick={() => {
                          handleClose();
                          navigate('/notifications');
                        }}
                      >
                        View All
                      </a>
                    </div>


                  </>

                )}
          </ModalBody>
        </div>

      </Modal >
    </>
  )
}

export default Notifications