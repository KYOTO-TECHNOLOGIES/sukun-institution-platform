import React from 'react';
import Swal from 'sweetalert2'; // Adjust the import according to your setup
import classNames from 'classnames';
import Button from '../../bootstrap/Button'; // Adjust the import according to your setup
import { authAxios } from '../../../axiosInstance';
import { buttonColor } from '../../../helpers/constants';
import useDarkMode from '../../../hooks/useDarkMode';
import useToasterNotification from '../../../hooks/useToasterNotification';
import swalFire from '../../../helpers/swalHelper';

interface ButtonWithWarningProps {
  apiEndpoint: string;
  text:string;
  confirmBtnText:string;
  payload:any;
  OnSuccess: (response: any) => void; 
  Icon:string
  Buttoncolor:string
  ButtonText:string
  CancelButton:string
}

const ButtonWithWarning: React.FC<ButtonWithWarningProps> = ({  apiEndpoint,text,confirmBtnText,payload,OnSuccess,Icon,Buttoncolor,ButtonText ,CancelButton}) => {
  const {showErrorNotification}=useToasterNotification()
  const { darkModeStatus } = useDarkMode();
  const onclickHandler = () => {

    swalFire({
      title: 'Are you sure?',
      icon: 'info',
      text:text|| "You won't be able to revert this!",
      showCancelButton: true,
      iconColor: buttonColor[0],
      confirmButtonColor: buttonColor[0],
      cancelButtonColor: buttonColor[1],
      confirmButtonText: confirmBtnText,
      cancelButtonText: CancelButton||"Cancel",

    }).then((result:any) => {
      if (result.isConfirmed) {
        const url = `${apiEndpoint}`;
        authAxios
          .patch(url,payload)
          .then((res) =>{
           OnSuccess(res)
          })
          .catch((err) => showErrorNotification(err));
      }
    });
  };

  return (
    <Button
      isOutline={false}
      color={Buttoncolor||darkModeStatus ? 'light' : 'dark'}
      isLight
      size='sm'
      className={classNames('text-nowrap', {
        'border-light': false,
      })}
      icon={Icon}
      onClick={onclickHandler}>
     {ButtonText}
    </Button>
  );
};

export default ButtonWithWarning;
