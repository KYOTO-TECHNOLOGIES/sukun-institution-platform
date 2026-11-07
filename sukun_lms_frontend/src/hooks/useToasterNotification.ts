import { Store } from 'react-notifications-component';
import { useContext } from 'react';
import useErrorHandler from './useErrorHandler';
import AuthContext from '../contexts/authContext';
import {
	formatPermissionDeniedMessage,
	isForbiddenPermissionError,
} from '../components/MasterComponents/QueueManagement/queueManagementUtils';

const useToasterNotification = () => {
  const { setLogOut } = useContext(AuthContext);

  const { handleError } = useErrorHandler();

  const showNotification = (
    title: string | JSX.Element,
    message: string | JSX.Element,
    type: 'default' | 'success' | 'danger' | 'info' | 'warning' = 'default'
  ) => {
    Store.addNotification({
      title,
      message,
      type,
      insert: 'top',
      container: 'top-right',
      animationOut: ['animate__animated', 'animate__fadeOut'],
      dismiss: {
        duration: 2000,
        pauseOnHover: true,
        onScreen: true,
        showIcon: true,
        waitForAnimation: true,
      },
    });
  };

  const showErrorNotification = (message: any| JSX.Element) => {
    if (message?.response?.status === 401) {
      setLogOut();
    } else if (isForbiddenPermissionError(message)) {
      showNotification('Access restricted', formatPermissionDeniedMessage(message), 'warning');
    } else if (message?.response?.status === 403) {
      setLogOut();
    } else {
      showNotification('Error', handleError(message), 'danger');
    }
  };

  const showSuccessNotification = (message: string | JSX.Element) => {
    showNotification('Success', message, 'success');
  };

  return {
    showNotification,
    showErrorNotification,
    showSuccessNotification,
  };
};

export default useToasterNotification;
