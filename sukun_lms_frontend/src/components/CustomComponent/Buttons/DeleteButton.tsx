import React from 'react';
import Swal from 'sweetalert2'; // Adjust the import according to your setup
import classNames from 'classnames';
import { useDispatch } from 'react-redux';
import Button from '../../bootstrap/Button'; // Adjust the import according to your setup
import { authAxios } from '../../../axiosInstance';
import { buttonColor } from '../../../helpers/constants';
import useDarkMode from '../../../hooks/useDarkMode';
import useToasterNotification from '../../../hooks/useToasterNotification';
import swalFire from '../../../helpers/swalHelper';
import type { TColor } from '../../../type/color-type';

interface DeleteButtonProps {
  apiEndpoint: string;
  tableRef?: React.RefObject<any>; // Reference to the table
  text:string
  reduxAction?: any
  color?: TColor
}

const DeleteButton: React.FC<DeleteButtonProps> = ({  apiEndpoint, tableRef,text,reduxAction,color }) => {
	const {showErrorNotification}=useToasterNotification();
  const dispatch = useDispatch();
  const { darkModeStatus } = useDarkMode();

  const deletehandler = (e:any) => {
    e.stopPropagation();
   
    swalFire({
      title: 'Are you sure?',
      icon: 'info',
      text:text|| "You won't be able to revert this!",
      showCancelButton: true,
      iconColor: buttonColor[0],
      theme: darkModeStatus ? 'dark' : 'light',
      confirmButtonColor: buttonColor[0],
      cancelButtonColor: buttonColor[1],
      confirmButtonText: 'Delete',
    }).then((result:any) => {
      if (result.isConfirmed) {
        const url = `${apiEndpoint}`;
        authAxios
          .delete(url)
          .then(() =>{
            // totalRecordsCount.current - 1;
            if(reduxAction){
              dispatch(reduxAction())
            }else{
              tableRef.current.onQueryChange()
            }

          })
          .catch((err) => showErrorNotification(err));
      }
    });
  };

  return (
    <Button
      isOutline={false}
      color={color ?? (darkModeStatus ? 'light' : 'dark')}
      isLight
      size='sm'
      className={classNames('text-nowrap', {
        'border-light': false,
      })}
      icon='Delete'
      style={{borderRadius:"10px"}}
      onClick={deletehandler} />
    //   Delete
    // </Button>
  );
};

export default DeleteButton;
