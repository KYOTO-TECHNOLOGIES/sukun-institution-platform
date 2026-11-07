import React, { useEffect, useState } from 'react';
import Modal, { ModalHeader, ModalBody, ModalTitle } from '../../components/bootstrap/Modal';
import Icon from '../../components/icon/Icon';
import { authAxios } from '../../axiosInstance';
import useToasterNotification from '../../hooks/useToasterNotification';
import ContractLogSkeleton from '../../components/CustomComponent/Skeleton/ContractLogSkelton';
import Moments from '../../helpers/Moment';

type NotificationDetailModalProps = {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  notification: any;
};

const dummyData = {
  id: 1,
  title: 'Grease Trap Inspection Scheduled',
  message: 'Your grease trap inspection has been scheduled for November 12, 2025 at 10:00 AM.',
  created_time: '2025-11-06T14:30:00Z',
  image: 'https://cpimg.tistatic.com/08736286/b/4/Oil-Grease-Trap.jpg',
  type: 'Schedule Update',
  status: 'Unread',
};

const NotificationDetailModal: React.FC<NotificationDetailModalProps> = ({
  isOpen,
  setIsOpen,
  notification,
}) => {
  const [notificationDetail, setNotificationDetail] = useState<any>(dummyData);
  const [loader, setLoader] = useState(true);
  const { showErrorNotification } = useToasterNotification();

  const handleClose = () => setIsOpen(false);

  useEffect(() => {
    const fetchNotificationDetail = async () => {
      try {
        setLoader(true);
        // const response = await authAxios.get(`/region/notifications/${notification?.notification?.id}/`);
        // setNotificationDetail(response.data);
      } catch (error) {
        showErrorNotification(error);
      } finally {
        setLoader(false);
      }
    };
    fetchNotificationDetail();
  }, [notification]);

  return (
    <Modal
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      id="notificationDetailModal"
      titleId="notificationDetailModalTitle"
      isCentered
      size="lg"
    >
        <></>
      {loader ? (
        <ContractLogSkeleton />
      ) : (
        <div className="notification-detail-modal">
          {/* Header */}
          <ModalHeader setIsOpen={handleClose}>
            <ModalTitle id="notificationDetailModalTitle" className="prevent-userselect">
              <div className="d-flex align-items-center gap-3">
                <div
                  style={{
                    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                    borderRadius: '10px',
                    padding: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon icon="NotificationsActive" size="2x" color="light" />
                </div>
                <div>
                  <h5 className="mb-0 fw-semibold text-dark">Notification Details</h5>
                  <small className="text-muted">
                    {Moments(notificationDetail.created_time)}
                  </small>
                </div>
              </div>
            </ModalTitle>
          </ModalHeader>

          {/* Body */}
          <ModalBody className="p-4">
            <div
              className="d-flex flex-column flex-md-row gap-4"
              style={{
                borderRadius: '12px',
                background: '#f9fafb',
                padding: '20px',
                boxShadow: 'inset 0 0 0 1px #e5e7eb',
              }}
            >
              {/* Image Section */}
              {notificationDetail.image && (
                <div
                  className="flex-shrink-0"
                  style={{
                    borderRadius: '12px',
                    overflow: 'hidden',
                    width: '240px',
                    height: '180px',
                    position: 'relative',
                  }}
                >
                  <img
                    src={notificationDetail.image}
                    alt="Notification visual"
                    style={{
                      objectFit: 'cover',
                      width: '100%',
                      height: '100%',
                      transition: 'transform 0.3s ease',
                    }}
                    className="hover-scale"
                  />
                </div>
              )}

              {/* Details Section */}
              <div className="flex-grow-1">
                <h5 className="fw-semibold mb-2 text-dark">{notificationDetail.title}</h5>

                <p
                  className="text-muted mb-3"
                  style={{
                    fontSize: '0.95rem',
                    lineHeight: 1.6,
                    borderLeft: '3px solid #7c3aed',
                    paddingLeft: '12px',
                  }}
                >
                  {notificationDetail.message}
                </p>

                <div className="d-flex flex-wrap gap-3 mt-3">
                  <span
                    className="badge rounded-pill"
                    style={{
                      background: '#e0e7ff',
                      color: '#4338ca',
                      fontWeight: 500,
                      padding: '8px 12px',
                    }}
                  >
                    <Icon icon="InfoCircle" size="sm" className="me-1" />
                    {notificationDetail.type}
                  </span>

                  <span
                    className={`badge rounded-pill ${
                      notificationDetail.status === 'Unread'
                        ? 'bg-warning text-dark'
                        : 'bg-success'
                    }`}
                    style={{ fontWeight: 500, padding: '8px 12px' }}
                  >
                    {notificationDetail.status}
                  </span>
                </div>
              </div>
            </div>
          </ModalBody>
        </div>
      )}
    </Modal>
  );
};

export default NotificationDetailModal;
