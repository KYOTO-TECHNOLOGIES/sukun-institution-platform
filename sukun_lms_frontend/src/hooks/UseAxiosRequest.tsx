import { useState, useCallback } from 'react';
import useToasterNotification from './useToasterNotification';
import { authAxios } from '../axiosInstance';

 const useAxiosRequest = () => {
	const [loading, setLoading] = useState(false);
	const {showErrorNotification} = useToasterNotification();

	const sendRequest = useCallback(async ({ url, method, data, config, onSuccess }:any) => {
		setLoading(true);
		try {
			const response = await authAxios({
				url,
				method,
				data,
				...config,
			});
			if (onSuccess) onSuccess(response);
		} catch (err) {
			showErrorNotification(err)	
		} finally {
			setLoading(false);
		}
	  // eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return { sendRequest, loading };
};
export default  useAxiosRequest