import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';

const useUnAuthorizedHandler = () => {
	const navigate = useNavigate();
	const logOutHandler = () => {
		navigate('/login');
		Cookies.remove('tenant');
	};

	return logOutHandler;
};

export default useUnAuthorizedHandler;
