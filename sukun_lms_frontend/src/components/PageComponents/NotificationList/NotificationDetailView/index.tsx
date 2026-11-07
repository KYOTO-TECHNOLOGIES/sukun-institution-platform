import React from 'react';
import { Badge } from 'reactstrap';
import Icon from '../../../icon/Icon';
import Moments from '../../../../helpers/Moment';

interface NotificationDetailViewProps {
  data: {
    id: number;
    notification: {
      id: number;
      notification_id: string;
      title: string;
      message: string;
      priority: string;
      channel: string;
      send_type: string;
      target_party_types: string[];
    };
    is_read: boolean;
    read_at: string | null;
    delivered_at: string;
    user: number;
  };
}

const getPriorityColor = (priority: string) => {
  switch (priority.toLowerCase()) {
    case 'high':
      return 'danger';
    case 'medium':
      return 'warning';
    case 'low':
      return 'success';
    default:
      return 'secondary';
  }
};

export default function NotificationDetailView({ data }: NotificationDetailViewProps) {

  const { notification, is_read, delivered_at, read_at } = data;

  return (
    <>
          {/* Header */}
          <div className="d-flex justify-content-between align-items-start mb-3">
            <div>
              <h4 className="fw-bold mb-1">{notification.title}</h4>
              <div className="mt-3">{notification.message}</div>
            </div>
            
         
          </div>

       
           

      

        


          {/* Dates */}
          <div className="">
            <div className="d-flex flex-column flex-sm-row justify-content-between text-muted small">
              <div className="d-flex align-items-center mb-2 mb-sm-0">
                <Icon icon='Calendar' size='lg' className="me-2 text-secondary" />
                <span>Sent: {    Moments(delivered_at, 'datetime')}</span>
              </div>
              {read_at && (
                <div className="d-flex align-items-center">
                  <Icon icon='DoneAll' size='lg' className="me-2 text-success" />
                  <span>Read At: {Moments(read_at, 'datetime')}</span>
                </div>
              )}
            </div>
          </div>
        </>
  );
}
