import React from 'react';
import Swal from 'sweetalert2';
import classNames from 'classnames';
import Button from '../../bootstrap/Button';
import { authAxios } from '../../../axiosInstance';
import { buttonColor } from '../../../helpers/constants';
import useToasterNotification from '../../../hooks/useToasterNotification';
import swalFire from '../../../helpers/swalHelper';

interface ActivateDeactivateButtonProps {
  apiEndpoint: string;
  onSuccess: (data: any) => void;
  width: string;
  height: string;
  status: string;
}

const ActivateAndDeactivate: React.FC<ActivateDeactivateButtonProps> = ({
  apiEndpoint,
  onSuccess,
  width,
  height,
  status,
}) => {
  const { showErrorNotification } = useToasterNotification();
  const isActive = status === 'Active' || status === 'Assigned';
  const text = isActive ? 'Deactivate' : 'Activate';
  const payload = status === 'Active' ? 'Disabled' : 'Active';
  const handleToggle = () => {
    const action = isActive ? 'deactivate' : 'activate';
    const title = isActive ? 'Deactivate?' : 'Activate?';

    swalFire({
      title: title,
      icon: 'info',
      text: `Are you sure you want to ${action} this?`,
      showCancelButton: true,
      iconColor: buttonColor[0],
      confirmButtonColor: buttonColor[0],
      cancelButtonColor: buttonColor[1],
      confirmButtonText: text,
    }).then((result: any) => {
      if (result.isConfirmed) {
        const url = `${apiEndpoint}`;
        authAxios
          .post(url, { status: payload })
          .then((response) => {
            onSuccess(response.data);
          })
          .catch((err) => showErrorNotification(err));
      }
    });
  };

  return (
    <Button
      isOutline={false}
      color={isActive ? 'primary' : 'success'}
      isLight
      size='sm'
      className={classNames('text-nowrap', {
        'border-light': false,
      })}
      icon={isActive ? 'Block' : 'CheckCircle'}
      style={{ width: width, height: height }}
      onClick={handleToggle}>
      {text}
    </Button>
  );
};

export default ActivateAndDeactivate;
