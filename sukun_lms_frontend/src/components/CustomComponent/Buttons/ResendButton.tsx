import React from 'react';
import Swal from 'sweetalert2'; // Adjust the import according to your setup
import classNames from 'classnames';
import Button from '../../bootstrap/Button'; // Adjust the import according to your setup
import { authAxios } from '../../../axiosInstance';
import { buttonColor } from '../../../helpers/constants';
import useDarkMode from '../../../hooks/useDarkMode';
import useToasterNotification from '../../../hooks/useToasterNotification';
import swalFire from '../../../helpers/swalHelper';

interface ResendButtonProps {
  id: any;

}

const ResendButton: React.FC<ResendButtonProps> = ({  id }) => {
	const {showErrorNotification,showSuccessNotification}=useToasterNotification();

  const { darkModeStatus } = useDarkMode();

  const resendMail = (e:any) => {
    e.stopPropagation();

    swalFire({
      title: 'Are you sure?',
      icon: 'info',
      text:'',
      showCancelButton: true,
      iconColor: 'info',
      confirmButtonColor:buttonColor[2],
      cancelButtonColor: buttonColor[0] ,
      confirmButtonText: 'Resend',
    }).then((result:any) => {
      if (result.isConfirmed) {
        const url = `api/users/resend_invitation/${id}`;
        authAxios
          .put(url)
          .then(() =>{
            showSuccessNotification('Email Resend Successfully !')
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
      icon='Send'
      style={{width:"80px"}}
      onClick={resendMail}>
      Resend
    </Button>
  );
};

export default ResendButton;
