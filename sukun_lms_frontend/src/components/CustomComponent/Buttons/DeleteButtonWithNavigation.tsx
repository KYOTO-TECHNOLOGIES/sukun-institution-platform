import React from 'react';
import Swal from 'sweetalert2'; // Adjust the import according to your setup
import classNames from 'classnames';
import { useNavigate } from 'react-router-dom';
import Button from '../../bootstrap/Button'; // Adjust the import according to your setup
import { authAxios } from '../../../axiosInstance';
import { buttonColor } from '../../../helpers/constants';
import useToasterNotification from '../../../hooks/useToasterNotification';
import swalFire from '../../../helpers/swalHelper';

interface DeleteButtonProps {
  apiEndpoint: string;
  route: string;
  text:string;
  width:string;
  height:string;
}

const DeleteButtonWithNavigation: React.FC<DeleteButtonProps> = ({  apiEndpoint,route,text ,width,height}) => {
   const {showErrorNotification}=useToasterNotification()
   const navigate=useNavigate()
   const deletehandler = () => {

    swalFire({
      title: 'Are you sure?',
      icon: 'info',
      text: "You won't be able to revert this!",
      showCancelButton: true,
      iconColor: buttonColor[0],
      confirmButtonColor: buttonColor[0],
      cancelButtonColor: buttonColor[1],
      confirmButtonText: 'Delete',
    }).then((result:any) => {
      if (result.isConfirmed) {
        const url = `${apiEndpoint}`;
        authAxios
          .delete(url)
          .then(() =>{
            navigate(route)

          })
          .catch((err) => showErrorNotification(err));
      }
    });
  };

  return (
    <Button
      isOutline={false}
      color='danger'
      isLight
      size='sm'
      className={classNames('text-nowrap', {
        'border-light': false,
      })}
      icon='Delete'
      style={{width:width,
        height:height
      }}
      onClick={deletehandler}>
        {text}
    </Button>
  );
};

export default DeleteButtonWithNavigation;
