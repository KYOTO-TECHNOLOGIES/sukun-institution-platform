import React  from 'react';
import { Tooltip } from '@mui/material';
import { useDispatch } from 'react-redux';
import classNames from 'classnames';
import Swal from 'sweetalert2'; // adjust the import according to your setup
import { buttonColor } from '../../../helpers/constants';
import { authAxios } from '../../../axiosInstance';
import Button from '../../bootstrap/Button';
import useToasterNotification from '../../../hooks/useToasterNotification';
import swalFire from '../../../helpers/swalHelper';

interface StatusButtonProps {
  status: string;
  fieldKey: string;
  tableRef?: React.RefObject<any>; // Reference to the table
  api: string 
  reduxAction?: any
}

const StatusButton: React.FC<StatusButtonProps> = ({ status,fieldKey,tableRef=null,api,reduxAction=null }) => {
  const isActivated = status === 'Active'|| status === 'Assigned';
  const isReader=api.includes('reader')
  const dispatch = useDispatch();
  const {showErrorNotification}=useToasterNotification()
  const statusCode:any={
    Active:isReader?'Inactive':'Disable',
    Assigned:'Unassign',
    Disabled:"Activate",
    Unassigned:'Assign',
    Inactive:'Activate',

  }
  const statusCodePayload:any={
    Active:isReader?'Inactive':'Disabled',
    Assigned:'Unassigned',
    Disabled:"Active",
    Unassigned:'Assigned',
    Inactive:'Active',

  }
  const activateDeactivateHandler = () => {
    swalFire({
      title: 'Are you sure?',
      icon: 'info',
      text: '',
      showCancelButton: true,
      iconColor: buttonColor[0],
      confirmButtonColor: buttonColor[isActivated ? 0 : 1],
      cancelButtonColor: buttonColor[isActivated ? 1 : 0],
      confirmButtonText: statusCode[status],
    }).then((result:any) => {
      if (result.isConfirmed) {
        const payload = {
          [fieldKey]:statusCodePayload[status],
        };
        authAxios
          .patch(api, payload)
          .then(() => {
            if(reduxAction){
              dispatch(reduxAction())
            }else{
              tableRef.current.onQueryChange();
            }
          })
          .catch((err) => showErrorNotification(err));

      }
    });
  };

  return (
    <Tooltip
      arrow
      title={statusCode[status]}
      placement='left'>
      <Button
        isOutline={false}
        size='sm'
        color={isActivated ? 'danger' : 'success'}
        isLight
        className={classNames('text-nowrap', {
          'border-light': false,
        })}
        style={{borderRadius: '10px'}}
        
        icon={isActivated ? 'Block' : 'TaskAlt'}
        onClick={(e:any) => {
          e.stopPropagation();
          activateDeactivateHandler();}}
      />
    </Tooltip>
  );
};

export default StatusButton;
