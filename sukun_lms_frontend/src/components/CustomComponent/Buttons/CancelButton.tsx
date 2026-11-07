import React from 'react';
import Swal from 'sweetalert2'; // Adjust the import according to your setup
import classNames from 'classnames';
import Button from '../../bootstrap/Button'; // Adjust the import according to your setup
import { authAxios } from '../../../axiosInstance';
import { buttonColor } from '../../../helpers/constants';
import useDarkMode from '../../../hooks/useDarkMode';
import useToasterNotification from '../../../hooks/useToasterNotification';
import swalFire from '../../../helpers/swalHelper';

interface CancelButtonProps {
  apiEndpoint: string;
  tableRef: React.RefObject<any>; // Reference to the table
  text:string
}

const CancelButton: React.FC<CancelButtonProps> = ({  apiEndpoint, tableRef,text }) => {
	const {showErrorNotification}=useToasterNotification();

  const { darkModeStatus } = useDarkMode();

  const cancelHandler =(e:any) => {
    e.stopPropagation();

    swalFire({
      title: 'Are you sure?',
      icon: 'info',
      text:text|| "You won't be able to revert this!",
      showCancelButton: true,
      iconColor: buttonColor[0],
      confirmButtonColor: buttonColor[0],
      cancelButtonColor: buttonColor[1],
      confirmButtonText: 'Proceed !',
    }).then((result:any) => {
      if (result.isConfirmed) {
        const url = `${apiEndpoint}`;
        authAxios
          .delete(url)
          .then(() =>{
            // totalRecordsCount.current - 1;
            tableRef.current.onQueryChange()

          })
          .catch((err) => showErrorNotification(err));
      }
    });
  };

  return (
    <Button
      isOutline={false}
      color={darkModeStatus ? 'light' : 'dark'}
      isLight
      size='sm'
      className={classNames('text-nowrap', {
        'border-light': false,
      })}
      icon='Close'
      style={{width:"95px"}}
      onClick={cancelHandler}>
      Cancel
    </Button>
  );
};

export default CancelButton;
