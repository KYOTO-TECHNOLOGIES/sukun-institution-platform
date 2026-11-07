import fileDownload from 'js-file-download';
import { authAxios } from '../axiosInstance';
import showNotification from '../components/extras/showNotification';

const downloadHandler = (url, name ,setLoading) => {
	setLoading(true)
	authAxios({
		url,
		method: 'GET',
		responseType: 'blob', 
	})
		.then((response) => {
			fileDownload(response.data, name);
			setLoading(false)
		})
		.catch(() => {
			setLoading(false)
			showNotification('Error', 'Error downloading the file !', 'danger');
			// showErrorNotification(error)
			
		});
};
export default downloadHandler;
