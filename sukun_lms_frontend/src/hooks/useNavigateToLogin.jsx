import { useNavigate } from 'react-router-dom';

const useNavigateToLogin = () => {
	const navigate = useNavigate();

	const navigateToLogin = () => {
		navigate('/login');
	};

	return navigateToLogin;
};

export default useNavigateToLogin;
