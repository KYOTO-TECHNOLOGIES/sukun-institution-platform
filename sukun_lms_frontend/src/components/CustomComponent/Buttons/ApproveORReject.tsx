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

interface ApproveORRejectProps {
  fieldKey: string;
  tableRef?: React.RefObject<any>; // Reference to the table
  api: string 
  reduxAction?: any
}

const ApproveOrRejectButton: React.FC<ApproveORRejectProps> = ({ fieldKey,tableRef=null,api,reduxAction=null }) => {
  // const isActivated = status === 'Active'|| status === 'Assigned';
  // const isReader=api.includes('reader')
  const dispatch = useDispatch();
  const {showErrorNotification}=useToasterNotification()
 
  const approveOrRejectHandler = (approveOrReject:string) => {
    swalFire({
      title: 'Are you sure?',
      icon: 'info',
      text: '',
      showCancelButton: true,
      iconColor: buttonColor[0],
      // confirmButtonColor: buttonColor[isActivated ? 0 : 1],
      // cancelButtonColor: buttonColor[isActivated ? 1 : 0],
      // confirmButtonText: statusCode[status],
    }).then((result:any) => {
      if (result.isConfirmed) {
        const payload = {
          [fieldKey]:approveOrReject,
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
    <div className='d-flex gap-2'>

      <Tooltip
      arrow
      title="Approve"
      placement='left'>
      <Button
        isOutline={false}
        size='sm'
        color='secondary'
        // color={isActivated ? 'danger' : 'success'}
        isLight
        className={classNames('text-nowrap', {
          'border-light': false,
        })}
        style={{borderRadius: '10px'}}
        
        icon='Done'
        onClick={(e:any) => {
          e.stopPropagation();
          approveOrRejectHandler('Approved');}}
      />
      </Tooltip>
      <Tooltip
      arrow
      title="Reject"
      placement='left'>
      <Button
        isOutline={false}
        size='sm'
        color='danger'

        // color={isActivated ? 'danger' : 'success'}
        isLight
        className={classNames('text-nowrap', {
          'border-light': false,
        })}
        style={{borderRadius: '10px'}}
        
        icon='Clear'
        onClick={(e:any) => {
          e.stopPropagation();
          approveOrRejectHandler('Rejected');}}
      />
      </Tooltip>
    </div>
  );
};

export default ApproveOrRejectButton;
