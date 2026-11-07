import { baseURLForFrontend } from '../helpers/baseURL';

const useHelpcenterNavigate = () => {

	const goToLink = (link) => {
		// navigate(link);
		window.open(`${baseURLForFrontend}${link}`, '_blank');
	};

	return goToLink;
};

export default useHelpcenterNavigate;
