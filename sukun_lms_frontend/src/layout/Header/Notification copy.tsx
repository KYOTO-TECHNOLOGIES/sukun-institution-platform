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
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState('Unread');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const navigate = useNavigate();
  // Filter options
  const filterOptions = ['Unread', 'Read', 'All'];


  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch notifications when filter or debounced search changes
  useEffect(() => {
    if (isOpen) {
      setPage(1);
      setHasMore(true);
      fetchNotifications(true);
    }
  }, [isOpen, activeFilter, debouncedSearchQuery]);

  // Handle pagination
  useEffect(() => {
    if (isOpen && page > 1) {
      fetchNotifications(false);
    }
  }, [page]);


  const fetchNotifications = async (reset = false) => {
    if (loading) return;

    setLoading(true);
    try {
      // Build query parameters based on active filter AND search
      const params: any = {
        page: reset ? 1 : page,
        page_size: 50,
      };

      // Add search parameter if exists
      if (debouncedSearchQuery.trim()) {
        params.search = debouncedSearchQuery;
      }

      // Add filter parameters based on activeFilter
      switch (activeFilter) {
        case 'Read':
          params.is_read = true;
          break;
        case 'Unread':
          params.is_read = false;
          break;
        case 'Dismissed':
          params.dismissed = true;
          break;
        case 'All':
        default:
          params.dismissed = false;
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
        created_time: item.notification?.delivered_at,
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

      setHasMore(!!response.data.next);

    } catch (error) {
      showErrorNotification(error);
    } finally {
      setLoading(false);
    }
  };

  //search api call
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // Handle scroll to load more
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollTop + clientHeight >= scrollHeight - 5 && hasMore && !loading) {
      setPage(prev => prev + 1);
    }
  };

  // Update the filter change handler
  const handleFilterChange = (newFilter: string) => {
    setActiveFilter(newFilter);
  };
  // Determine which notifications to display
  const displayNotifications = notifications;

  // 1. Mark specific notification as read
  const refreshNotifications = useCallback(() => {
    setPage(1);
    fetchNotifications(true);
  }, [activeFilter, debouncedSearchQuery]);

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
  // 2. Mark specific notification as unread button inside card 
  const markAsUnread = (id: string) => {
    const url = `/region/notification-users/${id}/mark-as-unread/`
    authAxios.post(url)
      .then(() => {
        // Update the notification in the list to mark it as unread
        const updatedNotifications = notifications.map((notification: any) =>
          notification.id === id ? { ...notification, is_read: false } : notification
        );
        setNotifications(updatedNotifications);
        dispatch(addNotifications(updatedNotifications));
        dispatch(toggleUpdateNotification());
      })
      .catch(err => showErrorNotification(err))
  }
  // 3. Dismiss specific notification button inside card 
  const dismissNotification = (id: string) => {
    const url = `/api/administration/notification-users/${id}/dismiss/`
    authAxios.post(url)
      .then(() => {
        // Remove the dismissed notification from the list
        const updatedNotifications = notifications.filter((notification: any) =>
          notification.id !== id
        );
        setNotifications(updatedNotifications);
        dispatch(addNotifications(updatedNotifications));
        dispatch(toggleUpdateNotification());
      })
      .catch(err => showErrorNotification(err))
  }

  // 4. Mark all notifications as read
  const markAllAsRead = () => {
    const url = `/region/notification-users/mark-all-as-read/`
    authAxios.post(url)
      .then(() => {
        // Update all notifications to mark them as read
        const updatedNotifications = notifications.map((notification: any) => ({
          ...notification,
          is_read: true
        }));
        setNotifications(updatedNotifications);
        dispatch(addNotifications(updatedNotifications));
        dispatch(toggleUpdateNotification());
      })
      .catch(err => showErrorNotification(err))
  }



  // Updated Alerts mapping based on the API response
  const Alerts: any = {
    ALERT: "Info",
    SYSTEM: "Settings",
    TASK: "Assignment",
    INFO: "Info",
    WARNING: "Warning",
    ERROR: "Error",
    CRITICAL: "Error"
  }

  // Function to get color based on severity
  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'danger';
      case 'ERROR':
        return 'danger';
      case 'WARNING':
        return 'warning';
      case 'INFO':
        return 'info';
      default:
        return 'info';
    }
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
      <Offcanvas
        id='notificationCanvas'
        title='Notifications'
        direction='end'
        isOpen={isOpen}
        onHide={handleClose}>
        <div className='m-3'>
          <OffcanvasHeader className='border-bottom' toggle={handleClose}>
            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
            <div className='m-0 fs-2'>
              Notifications

            </div>

            {/* Filter Buttons */}
            <div className=' py-2 ' style={{ marginLeft: '-6px' }}>
              <ButtonFilterOnHeader
                FilterStatus={filterOptions}
                activeTab={activeFilter}
                handleFilterStatus={(status: any) => {
                  handleFilterChange(status)
                }}
              />
            </div>
          </OffcanvasHeader>


          {/* Search Input - Always show */}
          {/* <div className='px-3 py-2 border-bottom'>
          <div className='position-relative'>
            <input
              type='text'
              className='form-control form-control-sm'
              placeholder='Search notifications...'
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              style={{ paddingLeft: '2.5rem' }}
            />
            <Icon
              icon='Search'
              size='lg'
              className='position-absolute top-50 start-0 translate-middle-y ms-2 text-muted'
            />
            {searchQuery && (
              <button
                type='button'
                className='btn-close position-absolute top-50 end-0 translate-middle-y me-2'
                onClick={() => {
                  setSearchQuery('');
                  setDebouncedSearchQuery('');
                }}
                style={{ fontSize: '0.75rem' }}
              />
            )}
          </div>
        </div> */}





          <OffcanvasBody
            style={{
              maxHeight: '100vh',
              overflowY: 'auto',
              padding: '1rem'
            }}
          // onScroll={handleScroll}
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
                      {searchQuery.trim()
                        ? `No notifications found for "${searchQuery}"`
                        : activeFilter === 'All'
                          ? 'No notifications found!'
                          : `No ${activeFilter.toLowerCase()} notifications!`
                      }
                    </p>
                  </div>
                ) : (
                  <>
                    {displayNotifications.map((data: any) => (
                      <div key={data.id} onClick={() => handleNotificationClick(data.id)}>
                        <div className='d-flex gap-3 align-items-center py-4 border-bottom'>
                          <div className='d-flex align-items-center justify-content-center  p-3 rounded-circle'
                          style={{backgroundColor:'#EBEBEB'}}
                          >
                            <Icon icon='NotificationIcon' size='2x' />
                          </div>
                          <div>
                         
                              <small className=' fs-5'>{data?.notification?.title?data?.notification?.title:'No title'}</small>
                            
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
                              {Moments(data?.created_time, 'datetime')}
                            </p>
                          </div>

                        </div>

                        {/* Add action buttons for unread notifications */}
                        <div className='d-flex gap-2 ms-auto'>
                          {/* For unread notifications - show Read and Dismiss buttons */}
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
                    ))}
                    {displayNotifications.length === 10 && (
                      <div className='d-flex justify-content-center mt-3'>
                        <Button
                          size='sm'
                          color='primary'
                          rounded='pill'
                          hoverShadow='sm'
                          className='px-3 d-inline-flex align-items-center gap-2 fw-semibold'
                          icon='ArrowForward'
                          onClick={() => {
                            handleClose();
                            navigate('/notifications');
                          }}
                        >
                          View All
                        </Button>
                      </div>
                    )}

                  </>

                )}
          </OffcanvasBody>
        </div>

      </Offcanvas >
    </>
  )
}

export default Notifications